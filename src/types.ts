export enum GamePhase {
  ROUND_START = "ROUND_START",
  DRAW = "DRAW",
  ACTION = "ACTION",
  TURN_END = "TURN_END",
  ROUND_END = "ROUND_END",
  SHOP = "SHOP",
  GAME_OVER = "GAME_OVER",
  VICTORY = "VICTORY",
}

export enum CardType {
  VEGETABLE = "VEGETABLE",
  WATERING = "WATERING",
  TRANSPLANT = "TRANSPLANT",
  TOOL = "TOOL",
}

export enum SequenceElement {
  HP = "HP",
  TIME = "TIME",
  MONEY = "MONEY",
}

export enum ToolEffect {
  WATERING_CAN = "WATERING_CAN",
  RAIN_STICK = "RAIN_STICK",
  WATER_DROP = "WATER_DROP",
}

export enum ShopItemType {
  CARD = "CARD",
  EXPAND = "EXPAND",
  HEAL = "HEAL",
}

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  hp?: number;
  fullStack?: number;
  toolEffect?: ToolEffect;
  emoji: string;
  description?: string;
}

export interface CardInstance {
  instanceId: number;
  defId: string;
  isDummy: boolean;
  isTemp: boolean;
}

export interface Plant {
  cardInstanceId: number;
  defId: string;
  hp: number;
  maxHp: number;
  growthStack: number;
  fullStack: number;
  stunned: boolean;
  defense: number;
}

export interface Threat {
  id: number;
  timer: number;
  hurdle: number;
  sequence: SequenceElement[];
  fired: boolean;
}

export interface Cell {
  row: number;
  col: number;
  plant: Plant | null;
  threats: Threat[];
}

export interface PendingThreat {
  hurdle: number;
  sequence: SequenceElement[];
}

export interface RoundThreats {
  phases: { hurdle: number; sequence: SequenceElement[] }[][];
}

export interface ShopItem {
  type: ShopItemType;
  cardDefId?: string;
  cost: number;
  label: string;
  emoji: string;
  sold: boolean;
}

export interface RoundRewards {
  goldClaimed: boolean;
  cardClaimed: boolean;
  expandClaimed: boolean;
  cardChoices: string[];
  cardPending: boolean;
  expandPending: boolean;
}

export interface GameState {
  phase: GamePhase;
  runRound: number;
  turnInRound: number;
  isBoss: boolean;

  grid: Cell[][];
  gridRows: number;
  gridCols: number;

  deck: CardInstance[];
  hand: CardInstance[];
  discard: CardInstance[];

  water: number;
  farmerHp: number;
  farmerMaxHp: number;
  timeTokens: number;
  gold: number;

  threatSchedule: RoundThreats[];
  pendingThreats: PendingThreat[];

  shopChoices: ShopItem[];
  shopGoldItems: ShopItem[];
  freePickUsed: boolean;

  selectedCardIndex: number | null;
  roundRewards: RoundRewards | null;
  currentPhase: number;
  waitingForManualRoundEnd: boolean;

  nextInstanceId: number;
  nextThreatId: number;
  log: string[];
}
