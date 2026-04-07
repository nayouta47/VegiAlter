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
  },
  garlic: {
    id: "garlic",
    name: "마늘",
    type: CardType.VEGETABLE,
    cost: 1,
    hp: 3,
    fullStack: 3,
    emoji: "🧄",
  },
  watering_can: {
    id: "watering_can",
    name: "물뿌리개",
    type: CardType.TOOL,
    cost: 2,
    toolEffect: ToolEffect.WATERING_CAN,
    emoji: "🚿",
  },
  rain_stick: {
    id: "rain_stick",
    name: "레인스틱",
    type: CardType.TOOL,
    cost: 0,
    toolEffect: ToolEffect.RAIN_STICK,
    emoji: "🎋",
  },
  water_drop: {
    id: "water_drop",
    name: "물방울",
    type: CardType.TOOL,
    cost: 0,
    toolEffect: ToolEffect.WATER_DROP,
    emoji: "💧",
  },
  watering: {
    id: "watering",
    name: "물주기",
    type: CardType.WATERING,
    cost: 1,
    emoji: "💦",
  },
  transplant: {
    id: "transplant",
    name: "옮겨심기",
    type: CardType.TRANSPLANT,
    cost: 0,
    emoji: "🔀",
  },
};

export const STARTING_DECK: string[] = [
  ...Array(7).fill("bean"),
  ...Array(3).fill("garlic"),
  "watering_can",
  "rain_stick",
];

export const THREAT_SCHEDULE: RoundThreats[] = [
  // Round 1
  { threats: [{ timer: 3, sequence: [S.HP, S.MONEY] }] },
  // Round 2
  {
    threats: [
      { timer: 3, sequence: [S.HP, S.HP, S.MONEY] },
      { timer: 4, sequence: [S.HP, S.TIME, S.MONEY] },
    ],
  },
  // Round 3
  {
    threats: [
      { timer: 3, sequence: [S.HP, S.HP, S.HP] },
      { timer: 3, sequence: [S.HP, S.TIME, S.MONEY, S.MONEY] },
    ],
  },
  // Round 4
  {
    threats: [
      { timer: 2, sequence: [S.HP, S.HP] },
      { timer: 3, sequence: [S.HP, S.HP, S.TIME, S.MONEY] },
      { timer: 4, sequence: [S.HP, S.HP, S.HP, S.MONEY] },
    ],
  },
  // Round 5
  {
    threats: [
      { timer: 2, sequence: [S.HP, S.HP, S.HP] },
      { timer: 3, sequence: [S.HP, S.HP, S.TIME, S.TIME] },
      { timer: 4, sequence: [S.HP, S.HP, S.HP, S.MONEY, S.MONEY] },
    ],
  },
];

export const BOSS_THREATS: RoundThreats = {
  threats: [
    { timer: 2, sequence: [S.HP, S.HP, S.HP, S.HP] },
    { timer: 2, sequence: [S.HP, S.HP, S.TIME, S.TIME] },
    { timer: 3, sequence: [S.HP, S.HP, S.HP, S.HP, S.HP] },
    { timer: 3, sequence: [S.HP, S.HP, S.HP, S.TIME, S.MONEY, S.MONEY] },
  ],
};

export const INITIAL_FARMER_HP = 5;
export const INITIAL_TIME_TOKENS = 5;
export const INITIAL_GRID_ROWS = 3;
export const INITIAL_GRID_COLS = 3;
export const WATER_PER_TURN = 3;
export const CARDS_PER_DRAW = 5;

export const SHOP_EXPAND_COST = 3;
export const SHOP_HEAL_COST = 2;

export const SHOP_CARD_POOL: { defId: string; cost: number }[] = [
  { defId: "bean", cost: 2 },
  { defId: "garlic", cost: 3 },
  { defId: "watering_can", cost: 3 },
  { defId: "rain_stick", cost: 2 },
];
