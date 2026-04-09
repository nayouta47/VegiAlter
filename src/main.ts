// VegiAlter v0.1
import { GameEngine } from "./engine/GameEngine";
import { render } from "./ui/Renderer";
import { buyFreePick, buyGoldItem } from "./engine/ShopManager";
import { CardDef, CardType, GamePhase, ShopItemType, ToolEffect } from "./types";
import { CARD_DEFS } from "./constants";

const app = document.getElementById("app")!;
const engine = new GameEngine();
let dragCardIndex: number | null = null;
let currentPreviewCell: string | null = null;
let transplantEdge: { rowA: number; colA: number; rowB: number; colB: number } | null = null;
let codexOpen = false;

engine.setRenderer((state) => {
  render(state, app, codexOpen);
  bindEvents();
});

function bindEvents(): void {
  // Card click + drag
  app.querySelectorAll<HTMLElement>("[data-hand-index]").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.handIndex!);
      engine.selectCard(idx);
    });

    el.addEventListener("dragstart", (e) => {
      const idx = parseInt(el.dataset.handIndex!);
      const card = engine.state.hand[idx];
      if (!card || card.isDummy) { e.preventDefault(); return; }
      const def = CARD_DEFS[card.defId];
      if (engine.state.water < def.cost) { e.preventDefault(); return; }

      dragCardIndex = idx;
      engine.state.selectedCardIndex = idx;
      el.classList.add("dragging");
      e.dataTransfer!.effectAllowed = "move";
      e.dataTransfer!.setData("text/plain", String(idx));
      highlightValidCells(def);
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
      clearDragUI();
      if (dragCardIndex !== null) {
        engine.state.selectedCardIndex = null;
        dragCardIndex = null;
        engine.render();
      }
    });
  });

  // Grid cell click + drag target
  app.querySelectorAll<HTMLElement>("[data-row]").forEach((el) => {
    el.addEventListener("click", () => {
      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);

      // Harvest fully grown plant (no card selected)
      if (engine.state.phase === GamePhase.ACTION && engine.state.selectedCardIndex === null) {
        const cell = engine.state.grid[row][col];
        if (cell.plant && cell.plant.growthStack >= cell.plant.fullStack) {
          engine.harvestPlant(row, col);
          return;
        }
      }

      if (engine.state.selectedCardIndex !== null && transplantEdge) {
        const card = engine.state.hand[engine.state.selectedCardIndex];
        if (card && CARD_DEFS[card.defId].type === CardType.TRANSPLANT) {
          const edge = transplantEdge;
          transplantEdge = null;
          engine.playTransplantOnEdge(edge.rowA, edge.colA, edge.rowB, edge.colB);
          return;
        }
      }

      engine.playCardOnCell(row, col);
    });

    el.addEventListener("dragover", (e) => {
      if (dragCardIndex === null) return;
      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);
      const card = engine.state.hand[dragCardIndex];
      if (!card) return;
      const def = CARD_DEFS[card.defId];

      if (def.type === CardType.TRANSPLANT) {
        const edge = detectTransplantEdge(el, e.clientX, e.clientY, row, col);
        const edgeKey = edge ? `${edge.rowA},${edge.colA}-${edge.rowB},${edge.colB}` : null;
        const curKey = transplantEdge ? `${transplantEdge.rowA},${transplantEdge.colA}-${transplantEdge.rowB},${transplantEdge.colB}` : null;
        if (edgeKey !== curKey) {
          clearDragPreview();
          transplantEdge = edge;
          if (edge) showTransplantSwapPreview(edge);
        }
        if (edge) {
          e.preventDefault();
          e.dataTransfer!.dropEffect = "move";
        }
        return;
      }

      if (isDragValidTarget(row, col, def)) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
      }
    });

    el.addEventListener("dragenter", () => {
      if (dragCardIndex === null) return;
      const card = engine.state.hand[dragCardIndex];
      if (!card) return;
      const def = CARD_DEFS[card.defId];
      if (def.type === CardType.TRANSPLANT) return;

      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);
      const cellKey = `${row},${col}`;
      if (currentPreviewCell === cellKey) return;
      currentPreviewCell = cellKey;
      clearDragPreview();
      if (isDragValidTarget(row, col, def)) {
        showDragPreview(row, col, def);
      }
    });

    el.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragCardIndex === null) return;

      const card = engine.state.hand[dragCardIndex];
      if (card && CARD_DEFS[card.defId].type === CardType.TRANSPLANT) {
        if (transplantEdge) {
          const edge = transplantEdge;
          engine.state.selectedCardIndex = dragCardIndex;
          dragCardIndex = null;
          clearDragUI();
          engine.playTransplantOnEdge(edge.rowA, edge.colA, edge.rowB, edge.colB);
        } else {
          dragCardIndex = null;
          clearDragUI();
        }
        return;
      }

      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);
      engine.state.selectedCardIndex = dragCardIndex;
      dragCardIndex = null;
      clearDragUI();
      engine.playCardOnCell(row, col);
    });

    // Transplant edge detection on hover (click mode)
    el.addEventListener("mousemove", (e) => {
      if (dragCardIndex !== null) return;
      if (engine.state.selectedCardIndex === null) return;
      const card = engine.state.hand[engine.state.selectedCardIndex];
      if (!card) return;
      if (CARD_DEFS[card.defId].type !== CardType.TRANSPLANT) return;

      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);
      const edge = detectTransplantEdge(el, e.clientX, e.clientY, row, col);
      const edgeKey = edge ? `${edge.rowA},${edge.colA}-${edge.rowB},${edge.colB}` : null;
      const curKey = transplantEdge ? `${transplantEdge.rowA},${transplantEdge.colA}-${transplantEdge.rowB},${transplantEdge.colB}` : null;
      if (edgeKey !== curKey) {
        clearDragPreview();
        transplantEdge = edge;
        if (edge) showTransplantSwapPreview(edge);
      }
    });

    el.addEventListener("mouseleave", () => {
      if (dragCardIndex !== null) return;
      if (engine.state.selectedCardIndex === null) return;
      const card = engine.state.hand[engine.state.selectedCardIndex];
      if (!card) return;
      if (CARD_DEFS[card.defId].type !== CardType.TRANSPLANT) return;
      clearDragPreview();
      transplantEdge = null;
    });
  });

  // End turn
  document.getElementById("btn-end-turn")?.addEventListener("click", () => {
    engine.endTurn();
  });

  // Rewards
  app.querySelector("[data-reward='gold']")?.addEventListener("click", () => {
    engine.claimRewardGold();
  });
  app.querySelector("[data-reward='card']")?.addEventListener("click", () => {
    engine.openRewardCard();
  });
  app.querySelectorAll<HTMLElement>("[data-reward-card]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      engine.claimRewardCard(el.dataset.rewardCard!);
    });
  });
  app.querySelector("[data-reward='expand']")?.addEventListener("click", () => {
    engine.openRewardExpand();
  });
  app.querySelectorAll<HTMLElement>("[data-reward-expand]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      engine.claimRewardExpand(el.dataset.rewardExpand as "top" | "bottom" | "left" | "right");
    });
  });

  // Enter shop
  document.getElementById("btn-enter-shop")?.addEventListener("click", () => {
    engine.enterShop();
  });

  // Leave shop
  document.getElementById("btn-leave-shop")?.addEventListener("click", () => {
    engine.leaveShop();
  });

  // Free pick
  app.querySelectorAll<HTMLElement>("[data-free-index]").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.freeIndex!);
      buyFreePick(engine.state, idx);
      engine.render();
    });
  });

  // Gold purchase
  app.querySelectorAll<HTMLElement>("[data-gold-index]").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.goldIndex!);
      const item = engine.state.shopGoldItems[idx];
      if (item.type === ShopItemType.EXPAND) {
        const dir =
          engine.state.gridRows <= engine.state.gridCols ? "bottom" : "right";
        buyGoldItem(engine.state, idx, dir);
      } else {
        buyGoldItem(engine.state, idx);
      }
      engine.render();
    });
  });

  // Restart
  document.getElementById("btn-restart")?.addEventListener("click", () => {
    engine.startRun();
  });

}

// --- Drag & Drop helpers ---

function isDragValidTarget(row: number, col: number, def: CardDef): boolean {
  const s = engine.state;
  const cell = s.grid[row][col];
  if (def.type === CardType.VEGETABLE) return cell.plant === null;
  if (def.type === CardType.WATERING) return cell.plant !== null;
  if (def.type === CardType.TRANSPLANT) {
    if (cell.plant) return true;
    const offsets: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of offsets) {
      const r = row + dr, c = col + dc;
      if (r >= 0 && r < s.gridRows && c >= 0 && c < s.gridCols) {
        if (s.grid[r][c].plant) return true;
      }
    }
    return false;
  }
  if (def.toolEffect === ToolEffect.WATERING_CAN) return true;
  return false;
}

function highlightValidCells(def: CardDef): void {
  for (let r = 0; r < engine.state.gridRows; r++) {
    for (let c = 0; c < engine.state.gridCols; c++) {
      if (isDragValidTarget(r, c, def)) {
        const el = app.querySelector(`[data-row="${r}"][data-col="${c}"]`) as HTMLElement;
        if (el) el.classList.add("cell--valid");
      }
    }
  }
}

function showDragPreview(row: number, col: number, def: CardDef): void {
  if (def.type === CardType.VEGETABLE) {
    addPreviewToCell(row, col, def.emoji);
  } else if (def.type === CardType.WATERING) {
    addPreviewToCell(row, col, "성장+1", true);
  } else if (def.toolEffect === ToolEffect.WATERING_CAN) {
    const offsets: [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of offsets) {
      const r = row + dr, c = col + dc;
      if (r < 0 || r >= engine.state.gridRows || c < 0 || c >= engine.state.gridCols) continue;
      if (engine.state.grid[r][c].plant) addPreviewToCell(r, c, "성장+1", true);
    }
    const cellEl = app.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
    if (cellEl) cellEl.classList.add("cell--drag-over");
  }
}

function addPreviewToCell(row: number, col: number, text: string, isEffect = false): void {
  const cellEl = app.querySelector(`[data-row="${row}"][data-col="${col}"]`) as HTMLElement;
  if (!cellEl) return;
  cellEl.classList.add("cell--drag-over");
  const preview = document.createElement("div");
  preview.className = isEffect ? "drag-preview drag-preview--effect" : "drag-preview";
  preview.textContent = text;
  cellEl.appendChild(preview);
}

function clearDragPreview(): void {
  app.querySelectorAll(".drag-preview").forEach((el) => el.remove());
  app.querySelectorAll(".cell--drag-over").forEach((el) => el.classList.remove("cell--drag-over"));
  app.querySelectorAll(".cell--transplant-swap").forEach((el) => el.classList.remove("cell--transplant-swap"));
  app.querySelectorAll("[class*='cell--swap-']").forEach((el) => {
    el.classList.remove("cell--swap-top", "cell--swap-bottom", "cell--swap-left", "cell--swap-right");
  });
}

function clearDragUI(): void {
  clearDragPreview();
  currentPreviewCell = null;
  transplantEdge = null;
  app.querySelectorAll(".cell--valid").forEach((el) => el.classList.remove("cell--valid"));
}

function detectTransplantEdge(
  el: HTMLElement, clientX: number, clientY: number, row: number, col: number
): { rowA: number; colA: number; rowB: number; colB: number } | null {
  const rect = el.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const w = rect.width;
  const h = rect.height;
  const threshold = Math.min(w, h) * 0.35;

  const distLeft = x;
  const distRight = w - x;
  const distTop = y;
  const distBottom = h - y;
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);
  if (minDist > threshold) return null;

  let dr = 0, dc = 0;
  if (minDist === distTop) dr = -1;
  else if (minDist === distBottom) dr = 1;
  else if (minDist === distLeft) dc = -1;
  else dc = 1;

  const adjRow = row + dr;
  const adjCol = col + dc;
  const s = engine.state;
  if (adjRow < 0 || adjRow >= s.gridRows || adjCol < 0 || adjCol >= s.gridCols) return null;

  const cellA = s.grid[row][col];
  const cellB = s.grid[adjRow][adjCol];
  if (!cellA.plant && !cellB.plant) return null;

  return { rowA: row, colA: col, rowB: adjRow, colB: adjCol };
}

function showTransplantSwapPreview(edge: { rowA: number; colA: number; rowB: number; colB: number }): void {
  const s = engine.state;
  const plantA = s.grid[edge.rowA][edge.colA].plant;
  const plantB = s.grid[edge.rowB][edge.colB].plant;

  const elA = app.querySelector(`[data-row="${edge.rowA}"][data-col="${edge.colA}"]`) as HTMLElement;
  const elB = app.querySelector(`[data-row="${edge.rowB}"][data-col="${edge.colB}"]`) as HTMLElement;

  if (elA) elA.classList.add("cell--transplant-swap");
  if (elB) elB.classList.add("cell--transplant-swap");

  const dr = edge.rowB - edge.rowA;
  const dc = edge.colB - edge.colA;
  if (dr === -1) { elA?.classList.add("cell--swap-top"); elB?.classList.add("cell--swap-bottom"); }
  else if (dr === 1) { elA?.classList.add("cell--swap-bottom"); elB?.classList.add("cell--swap-top"); }
  else if (dc === -1) { elA?.classList.add("cell--swap-left"); elB?.classList.add("cell--swap-right"); }
  else { elA?.classList.add("cell--swap-right"); elB?.classList.add("cell--swap-left"); }

  if (plantB) addPreviewToCell(edge.rowA, edge.colA, CARD_DEFS[plantB.defId].emoji);
  if (plantA) addPreviewToCell(edge.rowB, edge.colB, CARD_DEFS[plantA.defId].emoji);
}

// F2 debug + Escape (registered once, outside bindEvents to avoid accumulation)
document.addEventListener("keydown", (e) => {
  if (e.key === "F2") {
    console.log("GameState:", JSON.parse(JSON.stringify(engine.state)));
  }
  if (e.key === "Escape") {
    if (engine.state.phase === GamePhase.ACTION) {
      engine.state.selectedCardIndex = null;
      transplantEdge = null;
      clearDragPreview();
      engine.render();
    }
  }
});

// Start the game
engine.startRun();
