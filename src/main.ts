// VegiAlter v0.1
import { GameEngine } from "./engine/GameEngine";
import { render } from "./ui/Renderer";
import { buyFreePick, buyGoldItem } from "./engine/ShopManager";
import { GamePhase, ShopItemType } from "./types";

const app = document.getElementById("app")!;
const engine = new GameEngine();

engine.setRenderer((state) => {
  render(state, app);
  bindEvents();
});

function bindEvents(): void {
  // Card selection
  app.querySelectorAll<HTMLElement>("[data-hand-index]").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.handIndex!);
      engine.selectCard(idx);
    });
  });

  // Grid cell click
  app.querySelectorAll<HTMLElement>("[data-row]").forEach((el) => {
    el.addEventListener("click", () => {
      const row = parseInt(el.dataset.row!);
      const col = parseInt(el.dataset.col!);
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
        // Simple: always expand bottom or right alternately
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

  // F2 debug
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

// Start the game
engine.startRun();
