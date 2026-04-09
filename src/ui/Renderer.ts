import { GamePhase, GameState } from "../types";
import { renderHud } from "./HudView";
import { renderGrid } from "./GridView";
import { renderHand } from "./HandView";
import { renderLog } from "./LogView";
import { renderShop } from "./ShopView";
import { renderRewards } from "./RewardView";
import { renderCodex } from "./CodexView";

export function render(state: GameState, container: HTMLElement, codexOpen = false): void {
  let html = "";

  html += renderHud(state);

  switch (state.phase) {
    case GamePhase.ACTION:
    case GamePhase.TURN_END:
      html += renderGrid(state);
      html += renderHand(state);
      html += `<div class="actions">
        <button class="btn btn--end-turn" id="btn-end-turn">턴 종료 🌧️ 전체 성장+1</button>
      </div>`;
      html += renderLog(state);
      break;

    case GamePhase.ROUND_END:
      html += renderRewards(state);
      html += renderLog(state);
      break;

    case GamePhase.SHOP:
      html += renderShop(state);
      break;

    case GamePhase.GAME_OVER:
      html += `<div class="overlay overlay--gameover">
        <h2>게임 오버</h2>
        <p>라운드 ${state.runRound}에서 패배했습니다.</p>
        <button class="btn btn--primary" id="btn-restart">다시 시작</button>
      </div>`;
      html += renderLog(state);
      break;

    case GamePhase.VICTORY:
      html += `<div class="overlay overlay--victory">
        <h2>승리!</h2>
        <p>보스를 물리치고 런을 클리어했습니다!</p>
        <button class="btn btn--primary" id="btn-restart">다시 시작</button>
      </div>`;
      html += renderLog(state);
      break;
  }

  if (codexOpen) {
    html += renderCodex();
  }

  container.innerHTML = html;
}
