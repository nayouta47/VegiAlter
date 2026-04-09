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
    let cornerHtml = "";
    if (def.type === CardType.VEGETABLE && def.hp !== undefined) {
      cornerHtml = `
        <div class="card-corner card-corner--hp">❤️${def.hp}</div>
        <div class="card-corner card-corner--growth">🌱${def.fullStack}</div>
      `;
    } else if (def.type === CardType.WATERING) {
      statsHtml = `<div class="card-stats">식물 1개 성장+1</div>`;
    } else if (def.type === CardType.TRANSPLANT) {
      statsHtml = `<div class="card-stats">식물 이동</div>`;
    }

    const tooltipText = def.description || "";
    html += `
      <div class="${cardClass}" data-hand-index="${i}"${!isDummy && canAfford ? ' draggable="true"' : ''}>
        ${!isDummy ? cornerHtml : ""}
        <div class="card-emoji">${isDummy ? "💀" : def.emoji}</div>
        <div class="card-name">${def.name}</div>
        <div class="card-cost">💧${def.cost}</div>
        ${isDummy ? '<div class="card-dummy-label">사용 불가</div>' : statsHtml}
        ${!isDummy && tooltipText ? `<div class="card-tooltip">${tooltipText}</div>` : ""}
      </div>
    `;
  }
  html += `</div>`;
  return html;
}
