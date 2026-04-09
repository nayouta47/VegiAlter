import { GameState } from "../types";
import { getAdjacentCells } from "./GridManager";
import { tickThreats, fireThreats } from "./ThreatResolver";

export function resolveTurnEnd(state: GameState): void {
  state.log.push(`--- 턴 ${state.turnInRound} 종료 처리 ---`);

  // Phase 1: Growth
  resolveGrowth(state);

  // Phase 2: Full-stack heal
  resolveFullStack(state);

  // Phase 3: Threat timer tick
  tickThreats(state);

  // Phase 4: Fire threats with timer 0
  fireThreats(state);
}

function resolveGrowth(state: GameState): void {
  for (const row of state.grid) {
    for (const cell of row) {
      if (cell.plant && !cell.plant.stunned) {
        cell.plant.growthStack++;
        state.log.push(
          `식물(${cell.row},${cell.col}) 성장 ${cell.plant.growthStack - 1}→${cell.plant.growthStack}`
        );
      }
      // Clear stun after skipping (stun lasts for one turn-end)
      if (cell.plant && cell.plant.stunned) {
        state.log.push(`식물(${cell.row},${cell.col}) 성장 정지 (스턴)`);
        cell.plant.stunned = false;
      }
    }
  }
}

function resolveFullStack(state: GameState): void {
  // Collect all full-stack plants first
  const fullStackCells: { row: number; col: number }[] = [];

  for (const row of state.grid) {
    for (const cell of row) {
      if (cell.plant && cell.plant.growthStack >= cell.plant.fullStack) {
        fullStackCells.push({ row: cell.row, col: cell.col });
      }
    }
  }

  // Apply per-crop harvest effects
  for (const pos of fullStackCells) {
    const cell = state.grid[pos.row][pos.col];
    if (!cell.plant) continue;
    const defId = cell.plant.defId;

    if (defId === "garlic") {
      // Garlic: +1 defense to self only
      cell.plant.defense += 1;
      state.log.push(
        `🧄 수확(${pos.row},${pos.col}) 방어+1 (총 ${cell.plant.defense})`
      );
    } else if (defId === "bean") {
      // Bean: +1 growth to adjacent 4 cells + 1 gold
      const adjacents = getAdjacentCells(state, pos.row, pos.col, false);
      for (const adj of adjacents) {
        if (adj.plant && !adj.plant.stunned) {
          adj.plant.growthStack++;
          state.log.push(
            `🫘 수확(${pos.row},${pos.col}) → 식물(${adj.row},${adj.col}) 성장+1 (${adj.plant.growthStack})`
          );
        }
      }
      state.gold += 1;
      state.log.push(`🫘 수확(${pos.row},${pos.col}) 골드+1 (총 ${state.gold})`);
    }
  }

  // Reset growth stacks
  for (const pos of fullStackCells) {
    const cell = state.grid[pos.row][pos.col];
    if (cell.plant) {
      state.log.push(
        `식물(${pos.row},${pos.col}) 풀스택 발동! 성장 리셋`
      );
      cell.plant.growthStack = 0;
    }
  }
}
