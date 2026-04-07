import { Cell, GameState, Plant } from "../types";
import { CARD_DEFS } from "../constants";

export function createGrid(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ row: r, col: c, plant: null, threats: [] });
    }
    grid.push(row);
  }
  return grid;
}

export function clearGrid(state: GameState): void {
  for (const row of state.grid) {
    for (const cell of row) {
      cell.plant = null;
      cell.threats = [];
    }
  }
}

export function placePlant(
  state: GameState,
  row: number,
  col: number,
  cardInstanceId: number,
  defId: string
): boolean {
  const cell = state.grid[row][col];
  if (cell.plant) return false;
  const def = CARD_DEFS[defId];
  if (!def || !def.hp || !def.fullStack) return false;

  const plant: Plant = {
    cardInstanceId,
    defId,
    hp: def.hp,
    maxHp: def.hp,
    growthStack: 0,
    fullStack: def.fullStack,
    stunned: false,
  };
  cell.plant = plant;
  return true;
}

export function removePlant(state: GameState, row: number, col: number): Plant | null {
  const cell = state.grid[row][col];
  const plant = cell.plant;
  cell.plant = null;
  return plant;
}

export function getAdjacentCells(
  state: GameState,
  row: number,
  col: number,
  includeSelf: boolean = true
): Cell[] {
  const cells: Cell[] = [];
  if (includeSelf) cells.push(state.grid[row][col]);
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < state.gridRows && nc >= 0 && nc < state.gridCols) {
      cells.push(state.grid[nr][nc]);
    }
  }
  return cells;
}

export function expandGrid(state: GameState, direction: "top" | "bottom" | "left" | "right"): void {
  if (direction === "bottom") {
    const newRow: Cell[] = [];
    for (let c = 0; c < state.gridCols; c++) {
      newRow.push({ row: state.gridRows, col: c, plant: null, threats: [] });
    }
    state.grid.push(newRow);
    state.gridRows++;
  } else if (direction === "top") {
    const newRow: Cell[] = [];
    for (let c = 0; c < state.gridCols; c++) {
      newRow.push({ row: 0, col: c, plant: null, threats: [] });
    }
    state.grid.unshift(newRow);
    state.gridRows++;
    // fix row indices
    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        state.grid[r][c].row = r;
      }
    }
  } else if (direction === "right") {
    for (let r = 0; r < state.gridRows; r++) {
      state.grid[r].push({ row: r, col: state.gridCols, plant: null, threats: [] });
    }
    state.gridCols++;
  } else if (direction === "left") {
    for (let r = 0; r < state.gridRows; r++) {
      state.grid[r].unshift({ row: r, col: 0, plant: null, threats: [] });
    }
    state.gridCols++;
    // fix col indices
    for (let r = 0; r < state.gridRows; r++) {
      for (let c = 0; c < state.gridCols; c++) {
        state.grid[r][c].col = c;
      }
    }
  }
}
