import { GameState, ShopItemType } from "../types";
import { CARD_DEFS, SHOP_CARD_POOL, SHOP_HEAL_COST } from "../constants";
import { shuffle } from "../utils/random";
import { addCardToDeck } from "./DeckManager";
import { expandGrid } from "./GridManager";

export function generateShop(state: GameState): void {
  // 3 free picks (pick 1)
  const pool = shuffle(SHOP_CARD_POOL);
  state.shopChoices = pool.slice(0, 3).map((item) => {
    const def = CARD_DEFS[item.defId];
    return {
      type: ShopItemType.CARD,
      cardDefId: item.defId,
      cost: 0,
      label: `${def.emoji} ${def.name}`,
      emoji: def.emoji,
      sold: false,
    };
  });

  // Gold items
  state.shopGoldItems = [
    ...SHOP_CARD_POOL.map((item) => {
      const def = CARD_DEFS[item.defId];
      return {
        type: ShopItemType.CARD,
        cardDefId: item.defId,
        cost: item.cost,
        label: `${def.emoji} ${def.name}`,
        emoji: def.emoji,
        sold: false,
      };
    }),
    {
      type: ShopItemType.HEAL,
      cost: SHOP_HEAL_COST,
      label: "체력 회복 +1",
      emoji: "❤️",
      sold: false,
    },
  ];

  state.freePickUsed = false;
}

export function buyFreePick(state: GameState, index: number): boolean {
  if (state.freePickUsed || index < 0 || index >= state.shopChoices.length) return false;
  const item = state.shopChoices[index];
  if (item.cardDefId) {
    addCardToDeck(state, item.cardDefId);
    state.log.push(`무료 선택: ${item.label}`);
  }
  state.freePickUsed = true;
  return true;
}

export function buyGoldItem(
  state: GameState,
  index: number,
  expandDir?: "top" | "bottom" | "left" | "right"
): boolean {
  if (index < 0 || index >= state.shopGoldItems.length) return false;
  const item = state.shopGoldItems[index];
  if (item.sold || state.gold < item.cost) return false;

  state.gold -= item.cost;

  switch (item.type) {
    case ShopItemType.CARD:
      if (item.cardDefId) {
        addCardToDeck(state, item.cardDefId);
        state.log.push(`구매: ${item.label} (-${item.cost}G)`);
      }
      break;
    case ShopItemType.EXPAND:
      expandGrid(state, expandDir ?? "bottom");
      state.log.push(`밭 확장! (${state.gridRows}x${state.gridCols})`);
      break;
    case ShopItemType.HEAL:
      if (state.farmerHp < state.farmerMaxHp) {
        state.farmerHp = Math.min(state.farmerHp + 1, state.farmerMaxHp);
        state.log.push(`체력 회복 → ${state.farmerHp}`);
      }
      break;
  }
  item.sold = true;
  return true;
}
