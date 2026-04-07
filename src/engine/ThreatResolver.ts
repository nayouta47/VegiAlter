import { GameState, SequenceElement, Threat } from "../types";
import { shuffle } from "../utils/random";

export function placeThreatsForRound(state: GameState, roundIndex: number): void {
  const schedule = state.isBoss
    ? state.threatSchedule[state.threatSchedule.length - 1]
    : state.threatSchedule[roundIndex];
  if (!schedule) return;

  // Collect all cell positions
  const positions: [number, number][] = [];
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      positions.push([r, c]);
    }
  }
  const shuffled = shuffle(positions);

  let maxTimer = 0;
  for (let i = 0; i < schedule.threats.length; i++) {
    const t = schedule.threats[i];
    const [row, col] = shuffled[i % shuffled.length];
    const threat: Threat = {
      id: state.nextThreatId++,
      timer: t.timer,
      sequence: [...t.sequence],
      fired: false,
    };
    state.grid[row][col].threats.push(threat);
    if (t.timer > maxTimer) maxTimer = t.timer;
  }
  state.maxTimerThisRound = maxTimer;
}

export function tickThreats(state: GameState): void {
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      for (const threat of state.grid[r][c].threats) {
        if (!threat.fired) {
          threat.timer--;
        }
      }
    }
  }
}

export function fireThreats(state: GameState): boolean {
  let anyFired = false;

  // Process in row-major order
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      const cell = state.grid[r][c];
      for (const threat of cell.threats) {
        if (threat.fired || threat.timer > 0) continue;
        threat.fired = true;
        anyFired = true;

        state.log.push(`위협 발동 (${r},${c})!`);
        let plantDied = cell.plant === null;

        for (const elem of threat.sequence) {
          if (!plantDied && cell.plant) {
            // Process against plant
            processElementOnPlant(state, cell.plant, elem, r, c);
            if (cell.plant.hp <= 0) {
              plantDied = true;
              killPlant(state, r, c);
            }
          } else {
            // Process against farmer
            processElementOnFarmer(state, elem);
          }
        }
      }
    }
  }

  return anyFired;
}

function processElementOnPlant(
  state: GameState,
  plant: { hp: number; defId: string; stunned: boolean },
  elem: SequenceElement,
  row: number,
  col: number
): void {
  switch (elem) {
    case SequenceElement.HP:
      plant.hp -= 1;
      state.log.push(`  식물(${row},${col}) 피해 1 → HP ${plant.hp}`);
      break;
    case SequenceElement.TIME:
      plant.stunned = true;
      state.log.push(`  식물(${row},${col}) 성장 정지`);
      break;
    case SequenceElement.MONEY:
      state.gold += 1;
      state.log.push(`  골드 +1 (총 ${state.gold})`);
      break;
  }
}

function processElementOnFarmer(state: GameState, elem: SequenceElement): void {
  switch (elem) {
    case SequenceElement.HP:
      state.farmerHp -= 1;
      state.log.push(`  농부 피해! HP ${state.farmerHp}`);
      break;
    case SequenceElement.TIME:
      state.timeTokens -= 1;
      state.log.push(`  시간 토큰 -1 (남은: ${state.timeTokens})`);
      break;
    case SequenceElement.MONEY:
      // No gold when hitting farmer
      state.log.push(`  (돈 요소 — 식물 없어 획득 불가)`);
      break;
  }
}

function killPlant(state: GameState, row: number, col: number): void {
  const cell = state.grid[row][col];
  const plant = cell.plant;
  if (!plant) return;

  state.log.push(`  식물(${row},${col}) 사망!`);

  // Find the card instance and mark as dummy
  const allCards = [...state.deck, ...state.hand, ...state.discard];
  const card = allCards.find((c) => c.instanceId === plant.cardInstanceId);
  if (card) {
    card.isDummy = true;
  }
  // Also check cards still in the discard (dead plant card goes to discard)
  // The card might not be in any pile if it was placed from hand
  // In that case we need to create a new discard entry
  if (!card) {
    state.discard.push({
      instanceId: plant.cardInstanceId,
      defId: plant.defId,
      isDummy: true,
      isTemp: false,
    });
  }

  cell.plant = null;
}

export function allThreatsFired(state: GameState): boolean {
  for (const row of state.grid) {
    for (const cell of row) {
      for (const threat of cell.threats) {
        if (!threat.fired) return false;
      }
    }
  }
  return true;
}
