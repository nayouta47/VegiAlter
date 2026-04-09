import { CardDef, CardType, RoundThreats, SequenceElement, ToolEffect } from "./types";

const S = SequenceElement;

export const CARD_DEFS: Record<string, CardDef> = {
  bean: {
    id: "bean",
    name: "콩",
    type: CardType.VEGETABLE,
    cost: 1,
    hp: 1,
    fullStack: 3,
    emoji: "🫘",
    description: "HP 1, 수확: 상하좌우 성장+1, 골드+1",
  },
  garlic: {
    id: "garlic",
    name: "마늘",
    type: CardType.VEGETABLE,
    cost: 1,
    hp: 3,
    fullStack: 3,
    emoji: "🧄",
    description: "HP 3, 수확: 자신 방어+1",
  },
  watering_can: {
    id: "watering_can",
    name: "물뿌리개",
    type: CardType.TOOL,
    cost: 2,
    toolEffect: ToolEffect.WATERING_CAN,
    emoji: "🚿",
    description: "십자 범위(+) 식물 모두 성장+1",
  },
  rain_stick: {
    id: "rain_stick",
    name: "레인스틱",
    type: CardType.TOOL,
    cost: 0,
    toolEffect: ToolEffect.RAIN_STICK,
    emoji: "🎋",
    description: "물방울 카드 2장을 덱에 추가",
  },
  water_drop: {
    id: "water_drop",
    name: "물방울",
    type: CardType.TOOL,
    cost: 0,
    toolEffect: ToolEffect.WATER_DROP,
    emoji: "💧",
    description: "즉시 물 +1",
  },
  watering: {
    id: "watering",
    name: "물주기",
    type: CardType.WATERING,
    cost: 1,
    emoji: "💦",
    description: "선택한 식물에 성장+1",
  },
  transplant: {
    id: "transplant",
    name: "옮겨심기",
    type: CardType.TRANSPLANT,
    cost: 1,
    emoji: "🔀",
    description: "인접한 두 칸의 식물을 교환",
  },
};

export const STARTING_DECK: string[] = [
  ...Array(2).fill("bean"),
  "garlic",
  ...Array(4).fill("watering"),
  ...Array(5).fill("transplant"),
];

export const THREAT_SCHEDULE: RoundThreats[] = [
  // Round 1
  { threats: [{ appearOnTurn: 1, hurdle: 2, sequence: [S.HP, S.MONEY] }] },
  // Round 2
  {
    threats: [
      { appearOnTurn: 1, hurdle: 3, sequence: [S.HP, S.HP, S.MONEY] },
      { appearOnTurn: 2, hurdle: 3, sequence: [S.HP, S.TIME, S.MONEY] },
    ],
  },
  // Round 3
  {
    threats: [
      { appearOnTurn: 1, hurdle: 4, sequence: [S.HP, S.HP, S.HP] },
      { appearOnTurn: 2, hurdle: 3, sequence: [S.HP, S.TIME, S.MONEY, S.MONEY] },
    ],
  },
  // Round 4
  {
    threats: [
      { appearOnTurn: 1, hurdle: 3, sequence: [S.HP, S.HP] },
      { appearOnTurn: 2, hurdle: 4, sequence: [S.HP, S.HP, S.TIME, S.MONEY] },
      { appearOnTurn: 3, hurdle: 5, sequence: [S.HP, S.HP, S.HP, S.MONEY] },
    ],
  },
  // Round 5
  {
    threats: [
      { appearOnTurn: 1, hurdle: 4, sequence: [S.HP, S.HP, S.HP] },
      { appearOnTurn: 2, hurdle: 5, sequence: [S.HP, S.HP, S.TIME, S.TIME] },
      { appearOnTurn: 3, hurdle: 5, sequence: [S.HP, S.HP, S.HP, S.MONEY, S.MONEY] },
    ],
  },
];

export const BOSS_THREATS: RoundThreats = {
  threats: [
    { appearOnTurn: 1, hurdle: 5, sequence: [S.HP, S.HP, S.HP, S.HP] },
    { appearOnTurn: 1, hurdle: 4, sequence: [S.HP, S.HP, S.TIME, S.TIME] },
    { appearOnTurn: 2, hurdle: 6, sequence: [S.HP, S.HP, S.HP, S.HP, S.HP] },
    { appearOnTurn: 3, hurdle: 5, sequence: [S.HP, S.HP, S.HP, S.TIME, S.MONEY, S.MONEY] },
  ],
};

export const INITIAL_FARMER_HP = 5;
export const INITIAL_TIME_TOKENS = 5;
export const INITIAL_GRID_ROWS = 2;
export const INITIAL_GRID_COLS = 2;
export const WATER_PER_TURN = 3;
export const CARDS_PER_DRAW = 5;

export const REWARD_GOLD = 30;
export const SHOP_EXPAND_COST = 3;
export const SHOP_HEAL_COST = 2;

export const SHOP_CARD_POOL: { defId: string; cost: number }[] = [
  { defId: "bean", cost: 2 },
  { defId: "garlic", cost: 3 },
  { defId: "watering", cost: 1 },
  { defId: "transplant", cost: 1 },
  { defId: "watering_can", cost: 3 },
  { defId: "rain_stick", cost: 2 },
];
