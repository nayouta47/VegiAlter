import { GameState, SequenceElement } from "../types";
import { shuffle } from "../utils/random";

export function placeThreatsForRound(state: GameState, roundIndex: number): void {
  const schedule = state.isBoss
    ? state.threatSchedule[state.threatSchedule.length - 1]
    : state.threatSchedule[roundIndex];
  if (!schedule) return;

  state.pendingThreats = [];

  for (const t of schedule.threats) {
    state.pendingThreats.push({
      hurdle: t.hurdle,
      sequence: [...t.sequence],
      appearOnTurn: t.appearOnTurn,
    });
  }
}

export function placePendingThreats(state: GameState): void {
  const toPlace = [];
  const remaining = [];

  for (const pt of state.pendingThreats) {
    if (pt.appearOnTurn <= state.turnInRound) {
      toPlace.push(pt);
    } else {
      remaining.push(pt);
    }
  }
  state.pendingThreats = remaining;
  if (toPlace.length === 0) return;

  // Find cells without unfired threats
  const available: [number, number][] = [];
  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      if (!state.grid[r][c].threats.some(t => !t.fired)) {
        available.push([r, c]);
      }
    }
  }
  if (available.length === 0) return; // all cells full — drop threats

  const shuffled = shuffle(available);
  for (let i = 0; i < toPlace.length; i++) {
    if (i >= shuffled.length) break;
    const pt = toPlace[i];
    const [row, col] = shuffled[i];
    state.grid[row][col].threats.push({
      id: state.nextThreatId++,
      timer: pt.timer,
      hurdle: pt.hurdle,
      sequence: [...pt.sequence],
      fired: false,
    });
  }
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

        // Reveal hurdle and sequence
        const seqStr = threat.sequence
          .map((s) => {
            switch (s) {
              case SequenceElement.HP: return "⚔️";
              case SequenceElement.TIME: return "⏰";
              case SequenceElement.MONEY: return "💰";
            }
          })
          .join("");
        state.log.push(`위협 발동 (${r},${c})! 허들:${threat.hurdle} 시퀀스:${seqStr}`);

        if (cell.plant) {
          const total = cell.plant.hp + cell.plant.defense;
          if (total >= threat.hurdle) {
            // Hurdle SUCCESS: negate HP/TIME, earn MONEY
            state.log.push(`  허들 성공! (HP:${cell.plant.hp} + 방어:${cell.plant.defense} = ${total} >= ${threat.hurdle})`);
            for (const elem of threat.sequence) {
              if (elem === SequenceElement.MONEY) {
                state.gold += 1;
                state.log.push(`  골드 +1 (총 ${state.gold})`);
              }
            }
            cell.plant.defense = 0;
          } else {
            // Hurdle FAILURE: apply sequence normally
            state.log.push(`  허들 실패! (HP:${cell.plant.hp} + 방어:${cell.plant.defense} = ${total} < ${threat.hurdle})`);
            let plantDied = false;
            for (const elem of threat.sequence) {
              if (!plantDied && cell.plant) {
                processElementOnPlant(state, cell.plant, elem, r, c);
                if (cell.plant.hp <= 0) {
                  plantDied = true;
                  killPlant(state, r, c);
                }
              } else {
                processElementOnFarmer(state, elem);
              }
            }
            // Reset defense if plant survived
            if (cell.plant) {
              cell.plant.defense = 0;
            }
          }
        } else {
          // Empty cell: auto-failure, all elements hit farmer
          state.log.push(`  빈 칸 — 전부 농부에게!`);
          for (const elem of threat.sequence) {
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
  if (state.pendingThreats.length > 0) return false;
  for (const row of state.grid) {
    for (const cell of row) {
      for (const threat of cell.threats) {
        if (!threat.fired) return false;
      }
    }
  }
  return true;
}
