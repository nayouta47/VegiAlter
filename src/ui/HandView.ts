import { CardType, GameState } from "../types";
import { CARD_DEFS } from "../constants";

export function renderHand(state: GameState): string {
  if (state.hand.length === 0) {
    return `<div class="hand"><div class="hand-empty">손패 없음</div></div>`;
  }

  let html = `<div class="hand">`;
  for (let i = 0; i < state.hand.length; i++) {
    const card = state.hand[i];
    const def = CARD_DEFS[card.defId];
    const isSelected = state.selectedCardIndex === i;
    const canAfford = state.water >= def.cost;
    const isDummy = card.isDummy;

    let cardClass = "card";
    if (isSelected) cardClass += " card--selected";
    if (!canAfford && !isDummy) cardClass += " card--expensive";
    if (isDummy) cardClass += " card--dummy";

    let statsHtml = "";
    if (def.hp !== undefined) {
      statsHtml = `<div class="card-stats">HP:${def.hp} 성장:${def.fullStack}</div>`;
    }

    html += `
      <div class="${cardClass}" data-hand-index="${i}">
        <div class="card-emoji">${isDummy ? "💀" : def.emoji}</div>
        <div class="card-name">${def.name}</div>
        <div class="card-cost">💧${def.cost}</div>
        ${isDummy ? '<div class="card-dummy-label">사용 불가</div>' : statsHtml}
      </div>
    `;
  }
  html += `</div>`;
  return html;
}
