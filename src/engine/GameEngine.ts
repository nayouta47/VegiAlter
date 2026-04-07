import {
  CardType,
  GamePhase,
  GameState,
  ToolEffect,
} from "../types";
import {
  BOSS_THREATS,
  CARD_DEFS,
  CARDS_PER_DRAW,
  INITIAL_FARMER_HP,
  INITIAL_GRID_COLS,
  INITIAL_GRID_ROWS,
  INITIAL_TIME_TOKENS,
  THREAT_SCHEDULE,
  WATER_PER_TURN,
} from "../constants";
import {
  createStartingDeck,
  discardCard,
  discardHand,
  drawCards,
  removeFromHand,
  roundReset,
  addCardToDeck,
} from "./DeckManager";
import { autoExpandGrid, clearGrid, createGrid, getAdjacentCells, placePlant } from "./GridManager";
import { allThreatsFired, placeThreatsForRound } from "./ThreatResolver";
import { resolveTurnEnd } from "./TurnResolver";
import { generateShop } from "./ShopManager";
import { shuffle } from "../utils/random";

export type RenderCallback = (state: GameState) => void;

export class GameEngine {
  state!: GameState;
  private onRender: RenderCallback | null = null;

  setRenderer(cb: RenderCallback): void {
    this.onRender = cb;
  }

  render(): void {
    if (this.onRender) this.onRender(this.state);
  }

  startRun(): void {
    const state: GameState = {
      phase: GamePhase.ROUND_START,
      runRound: 0,
      turnInRound: 0,
      isBoss: false,

      grid: createGrid(INITIAL_GRID_ROWS, INITIAL_GRID_COLS),
      gridRows: INITIAL_GRID_ROWS,
      gridCols: INITIAL_GRID_COLS,

      deck: [],
      hand: [],
      discard: [],

      water: 0,
      farmerHp: INITIAL_FARMER_HP,
      farmerMaxHp: INITIAL_FARMER_HP,
      timeTokens: INITIAL_TIME_TOKENS,
      gold: 0,

      threatSchedule: [...THREAT_SCHEDULE, BOSS_THREATS],
      maxTimerThisRound: 0,

      shopChoices: [],
      shopGoldItems: [],
      freePickUsed: false,

      selectedCardIndex: null,
      transplantSourceCell: null,

      nextInstanceId: 1,
      nextThreatId: 1,
      log: [],
    };

    this.state = state;
    state.deck = shuffle(createStartingDeck(state));
    state.log.push("런 시작!");
    this.startRound();
  }

  startRound(): void {
    const s = this.state;
    s.runRound++;
    s.turnInRound = 0;
    s.log = [];

    // Check if boss round
    if (s.runRound > THREAT_SCHEDULE.length || s.timeTokens <= 0) {
      s.isBoss = true;
      s.log.push("=== 보스전! ===");
    } else {
      s.log.push(`=== 라운드 ${s.runRound} ===`);
    }

    // Reset deck for new round
    roundReset(s);

    // Clear grid plants (threats are cleared too)
    clearGrid(s);

    // Auto-expand grid (skip round 1)
    if (s.runRound > 1 && !s.isBoss) {
      autoExpandGrid(s);
      s.log.push(`밭 확장! (${s.gridRows}x${s.gridCols})`);
    }

    // Place threats
    const roundIdx = s.isBoss ? THREAT_SCHEDULE.length : s.runRound - 1;
    placeThreatsForRound(s, roundIdx);

    this.startTurn();
  }

  startTurn(): void {
    const s = this.state;
    s.turnInRound++;
    s.phase = GamePhase.ACTION;
    s.water = WATER_PER_TURN;
    s.selectedCardIndex = null;

    drawCards(s, CARDS_PER_DRAW);
    s.log.push(`턴 ${s.turnInRound}: ${s.hand.length}장 드로우, 물 ${s.water}`);
    this.render();
  }

  selectCard(handIndex: number): void {
    const s = this.state;
    if (s.phase !== GamePhase.ACTION) return;

    if (s.selectedCardIndex === handIndex) {
      s.selectedCardIndex = null;
      s.transplantSourceCell = null;
      this.render();
      return;
    }

    const card = s.hand[handIndex];
    if (!card || card.isDummy) return;

    const def = CARD_DEFS[card.defId];
    if (s.water < def.cost) return;

    // For no-target tools, execute immediately
    if (def.type === CardType.TOOL) {
      if (def.toolEffect === ToolEffect.RAIN_STICK) {
        s.water -= def.cost;
        removeFromHand(s, card.instanceId);
        discardCard(s, card);
        addCardToDeck(s, "water_drop", true);
        addCardToDeck(s, "water_drop", true);
        s.log.push("레인스틱 사용 → 물방울 2장 덱에 추가");
        s.selectedCardIndex = null;
        this.render();
        return;
      }
      if (def.toolEffect === ToolEffect.WATER_DROP) {
        s.water -= def.cost;
        s.water += 1;
        removeFromHand(s, card.instanceId);
        // Water drop is consumed (not discarded)
        s.log.push(`물방울 사용 → 물 +1 (${s.water})`);
        s.selectedCardIndex = null;
        // Remove from everywhere if temp
        this.render();
        return;
      }
    }

    s.transplantSourceCell = null;
    s.selectedCardIndex = handIndex;
    this.render();
  }

  playCardOnCell(row: number, col: number): void {
    const s = this.state;
    if (s.phase !== GamePhase.ACTION || s.selectedCardIndex === null) return;

    const card = s.hand[s.selectedCardIndex];
    if (!card) return;
    const def = CARD_DEFS[card.defId];

    if (def.type === CardType.VEGETABLE) {
      // Place plant
      if (s.grid[row][col].plant) return;
      if (s.water < def.cost) return;

      s.water -= def.cost;
      removeFromHand(s, card.instanceId);
      placePlant(s, row, col, card.instanceId, card.defId);
      s.log.push(`${def.emoji}${def.name} 배치 (${row},${col})`);
    } else if (def.type === CardType.WATERING) {
      // Single target watering: +1 growth to one plant
      const cell = s.grid[row][col];
      if (!cell.plant) return;
      if (s.water < def.cost) return;

      s.water -= def.cost;
      removeFromHand(s, card.instanceId);
      discardCard(s, card);
      cell.plant.growthStack++;
      s.log.push(`물주기 → 식물(${row},${col}) 성장+1 (${cell.plant.growthStack})`);
    } else if (def.type === CardType.TRANSPLANT) {
      // Two-step: first click selects source, second click selects destination
      if (s.transplantSourceCell === null) {
        // Step 1: select source (must have a plant)
        const cell = s.grid[row][col];
        if (!cell.plant) return;
        s.transplantSourceCell = { row, col };
        s.log.push(`옮겨심기: 원본 선택 (${row},${col})`);
        this.render();
        return;
      } else {
        // Step 2: select destination (must be empty)
        const destCell = s.grid[row][col];
        if (destCell.plant) return;

        const src = s.transplantSourceCell;
        const srcCell = s.grid[src.row][src.col];
        if (!srcCell.plant) { s.transplantSourceCell = null; return; }

        // Move plant, preserving all stats
        destCell.plant = srcCell.plant;
        srcCell.plant = null;
        s.transplantSourceCell = null;

        s.water -= def.cost;
        removeFromHand(s, card.instanceId);
        discardCard(s, card);
        s.log.push(`옮겨심기: (${src.row},${src.col}) → (${row},${col})`);
      }
    } else if (def.type === CardType.TOOL && def.toolEffect === ToolEffect.WATERING_CAN) {
      // Watering can: +1 growth to cross
      if (s.water < def.cost) return;

      s.water -= def.cost;
      removeFromHand(s, card.instanceId);
      discardCard(s, card);

      const cells = getAdjacentCells(s, row, col, true);
      let count = 0;
      for (const cell of cells) {
        if (cell.plant) {
          cell.plant.growthStack++;
          count++;
        }
      }
      s.log.push(`물뿌리개 (${row},${col}) → ${count}개 식물 성장+1`);
    }

    s.selectedCardIndex = null;
    this.render();
  }

  endTurn(): void {
    const s = this.state;
    if (s.phase !== GamePhase.ACTION) return;

    s.selectedCardIndex = null;
    s.transplantSourceCell = null;

    // Discard remaining hand
    discardHand(s);

    // Resolve turn end
    resolveTurnEnd(s);

    // Check game over
    if (s.farmerHp <= 0) {
      s.phase = GamePhase.GAME_OVER;
      s.log.push("게임 오버!");
      this.render();
      return;
    }

    // Check round end
    if (allThreatsFired(s)) {
      if (s.isBoss) {
        s.phase = GamePhase.VICTORY;
        s.log.push("승리! 보스를 물리쳤습니다!");
        this.render();
        return;
      }
      s.phase = GamePhase.ROUND_END;
      s.log.push("라운드 종료!");
      this.render();
      return;
    }

    // Next turn
    this.startTurn();
  }

  enterShop(): void {
    const s = this.state;
    generateShop(s);
    s.phase = GamePhase.SHOP;
    s.log = ["=== 상점 ==="];
    this.render();
  }

  leaveShop(): void {
    this.startRound();
  }
}
