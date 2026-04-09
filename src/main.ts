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

engine.setRenderer((state) => {
  render(state, app);
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
      engine.playCardOnCell(row, col);
    });

    el.addEventListener("dragover", (e) => {
      if (dragCardIndex === null) return;
      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);
      const card = engine.state.hand[dragCardIndex];
      if (!card) return;
      const def = CARD_DEFS[card.defId];
      if (isDragValidTarget(row, col, def)) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
      }
    });

    el.addEventListener("dragenter", () => {
      if (dragCardIndex === null) return;
      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);
      const cellKey = `${row},${col}`;
      if (currentPreviewCell === cellKey) return;
      currentPreviewCell = cellKey;
      clearDragPreview();
      const card = engine.state.hand[dragCardIndex];
      if (!card) return;
      const def = CARD_DEFS[card.defId];
      if (isDragValidTarget(row, col, def)) {
        showDragPreview(row, col, def);
      }
    });

    el.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragCardIndex === null) return;
      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);
      engine.state.selectedCardIndex = dragCardIndex;
      dragCardIndex = null;
      clearDragUI();
      engine.playCardOnCell(row, col);
    });
  });

  // End turn
  document.getElementById("btn-end-turn")?.addEventListener("click", () => {
    engine.endTurn();
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

  // F2 debug + Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "F2") {
      console.log("GameState:", JSON.parse(JSON.stringify(engine.state)));
    }
    if (e.key === "Escape") {
      if (engine.state.phase === GamePhase.ACTION) {
        engine.state.selectedCardIndex = null;
        engine.state.transplantSourceCell = null;
        engine.render();
      }
    }
  });
}

// --- Drag & Drop helpers ---

function isDragValidTarget(row: number, col: number, def: CardDef): boolean {
  const s = engine.state;
  const cell = s.grid[row][col];
  if (def.type === CardType.VEGETABLE) return cell.plant === null;
  if (def.type === CardType.WATERING) return cell.plant !== null;
  if (def.type === CardType.TRANSPLANT) {
    if (s.transplantSourceCell === null) return cell.plant !== null;
    return cell.plant === null;
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
  } else if (def.type === CardType.TRANSPLANT) {
    if (engine.state.transplantSourceCell === null) {
      addPreviewToCell(row, col, "📌");
    } else {
      const src = engine.state.transplantSourceCell;
      const srcPlant = engine.state.grid[src.row][src.col].plant;
      if (srcPlant) addPreviewToCell(row, col, CARD_DEFS[srcPlant.defId].emoji);
    }
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
}

function clearDragUI(): void {
  clearDragPreview();
  currentPreviewCell = null;
  app.querySelectorAll(".cell--valid").forEach((el) => el.classList.remove("cell--valid"));
}

// Start the game
engine.startRun();
