import { GameState, ShopItemType } from "../types";
import { CARD_DEFS } from "../constants";

export function renderShop(state: GameState): string {
  let html = `<div class="shop">`;
  html += `<h2 class="shop-title">상점</h2>`;
  html += `<div class="shop-gold">🪙 보유 골드: ${state.gold}</div>`;

  // Free pick
  if (!state.freePickUsed) {
    html += `<div class="shop-section">`;
    html += `<h3>무료 선택 (1개 선택)</h3>`;
    html += `<div class="shop-items">`;
    for (let i = 0; i < state.shopChoices.length; i++) {
      const item = state.shopChoices[i];
      const freeTooltip = getShopTooltip(item);
      html += `
        <div class="shop-item shop-item--free" data-free-index="${i}">
          <div class="shop-item-emoji">${item.emoji}</div>
          <div class="shop-item-label">${item.label}</div>
          <div class="shop-item-cost">무료</div>
          ${freeTooltip ? `<div class="card-tooltip">${freeTooltip}</div>` : ""}
        </div>
      `;
    }
    html += `</div></div>`;
  } else {
    html += `<div class="shop-section"><p class="shop-picked">무료 선택 완료!</p></div>`;
  }

  // Gold purchases
  html += `<div class="shop-section">`;
  html += `<h3>골드 구매</h3>`;
  html += `<div class="shop-items">`;
  for (let i = 0; i < state.shopGoldItems.length; i++) {
    const item = state.shopGoldItems[i];
    const canAfford = state.gold >= item.cost;
    const itemClass = canAfford ? "shop-item" : "shop-item shop-item--disabled";
    const goldTooltip = getShopTooltip(item);
    html += `
      <div class="${itemClass}" data-gold-index="${i}">
        <div class="shop-item-emoji">${item.emoji}</div>
        <div class="shop-item-label">${item.label}</div>
        <div class="shop-item-cost">🪙${item.cost}</div>
        ${goldTooltip ? `<div class="card-tooltip">${goldTooltip}</div>` : ""}
      </div>
    `;
  }
  html += `</div></div>`;

  html += `<button class="btn btn--primary" id="btn-leave-shop">다음 라운드 →</button>`;
  html += `</div>`;
  return html;
}

function getShopTooltip(item: { type: ShopItemType; cardDefId?: string }): string {
  if (item.type === ShopItemType.CARD && item.cardDefId) {
    return CARD_DEFS[item.cardDefId]?.description || "";
  }
  if (item.type === ShopItemType.EXPAND) return "밭 크기를 1줄 확장";
  if (item.type === ShopItemType.HEAL) return "농부 HP를 1 회복";
  return "";
}
