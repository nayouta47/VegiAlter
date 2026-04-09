import { GameState } from "../types";
import { CARD_DEFS, REWARD_GOLD } from "../constants";

export function renderRewards(state: GameState): string {
  const rw = state.roundRewards;
  if (!rw) return "";

  let html = `<div class="rewards">`;
  html += `<h2 class="rewards-title">라운드 ${state.runRound} 클리어!</h2>`;
  html += `<div class="rewards-list">`;

  // 1. Gold
  html += `<div class="reward-item${rw.goldClaimed ? " reward-item--claimed" : ""}" data-reward="gold">`;
  html += `<span class="reward-icon">🪙</span>`;
  html += `<span class="reward-label">골드 +${REWARD_GOLD}</span>`;
  html += `<span class="reward-status">${rw.goldClaimed ? "✅ 획득" : "클릭하여 획득"}</span>`;
  html += `</div>`;

  // 2. Card pick
  html += `<div class="reward-item${rw.cardClaimed ? " reward-item--claimed" : ""}" data-reward="card">`;
  html += `<span class="reward-icon">🃏</span>`;
  html += `<span class="reward-label">카드 3택 1</span>`;
  html += `<span class="reward-status">${rw.cardClaimed ? "✅ 획득" : rw.cardPending ? "선택하세요" : "클릭하여 선택"}</span>`;
  html += `</div>`;

  if (rw.cardPending && !rw.cardClaimed) {
    html += `<div class="reward-choices">`;
    for (const defId of rw.cardChoices) {
      const def = CARD_DEFS[defId];
      html += `<div class="reward-choice" data-reward-card="${defId}">`;
      html += `<div class="reward-choice-emoji">${def.emoji}</div>`;
      html += `<div class="reward-choice-name">${def.name}</div>`;
      if (def.description) html += `<div class="reward-choice-desc">${def.description}</div>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  // 3. Expand
  html += `<div class="reward-item${rw.expandClaimed ? " reward-item--claimed" : ""}" data-reward="expand">`;
  html += `<span class="reward-icon">🌱</span>`;
  html += `<span class="reward-label">밭 확장 (${state.gridRows}x${state.gridCols})</span>`;
  html += `<span class="reward-status">${rw.expandClaimed ? "✅ 확장 완료" : rw.expandPending ? "방향을 선택하세요" : "클릭하여 선택"}</span>`;
  html += `</div>`;

  if (rw.expandPending && !rw.expandClaimed) {
    const rows = state.gridRows;
    const cols = state.gridCols;
    const popupCols = cols + 2;

    html += `<div class="expand-popup">`;
    html += `<div class="expand-grid" style="grid-template-columns: repeat(${popupCols}, 48px);">`;

    for (let r = 0; r < rows + 2; r++) {
      for (let c = 0; c < popupCols; c++) {
        const isTop = r === 0 && c > 0 && c <= cols;
        const isBottom = r === rows + 1 && c > 0 && c <= cols;
        const isLeft = c === 0 && r > 0 && r <= rows;
        const isRight = c === cols + 1 && r > 0 && r <= rows;
        const isExisting = r > 0 && r <= rows && c > 0 && c <= cols;

        if (isExisting) {
          html += `<div class="expand-cell expand-cell--existing">🌿</div>`;
        } else if (isTop) {
          html += `<div class="expand-cell expand-cell--add" data-reward-expand="top">+</div>`;
        } else if (isBottom) {
          html += `<div class="expand-cell expand-cell--add" data-reward-expand="bottom">+</div>`;
        } else if (isLeft) {
          html += `<div class="expand-cell expand-cell--add" data-reward-expand="left">+</div>`;
        } else if (isRight) {
          html += `<div class="expand-cell expand-cell--add" data-reward-expand="right">+</div>`;
        } else {
          html += `<div class="expand-cell expand-cell--empty"></div>`;
        }
      }
    }

    html += `</div>`;
    html += `</div>`;
  }

  html += `</div>`; // rewards-list

  const allClaimed = rw.goldClaimed && rw.cardClaimed && rw.expandClaimed;
  if (allClaimed) {
    html += `<button class="btn btn--primary" id="btn-enter-shop">상점으로 →</button>`;
  }

  html += `</div>`;
  return html;
}
