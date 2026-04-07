import { CardInstance, GameState } from "../types";
import { CARD_DEFS, STARTING_DECK } from "../constants";
import { shuffle } from "../utils/random";

export function createStartingDeck(state: GameState): CardInstance[] {
  return STARTING_DECK.map((defId) => {
    const inst: CardInstance = {
      instanceId: state.nextInstanceId++,
      defId,
      isDummy: false,
      isTemp: false,
    };
    return inst;
  });
}

export function drawCards(state: GameState, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) break;
      state.deck = shuffle(state.discard);
      state.discard = [];
      state.log.push("덱 리셔플!");
    }
    const card = state.deck.pop()!;
    state.hand.push(card);
  }
}

export function discardHand(state: GameState): void {
  state.discard.push(...state.hand);
  state.hand = [];
}

export function discardCard(state: GameState, card: CardInstance): void {
  state.discard.push(card);
}

export function removeFromHand(state: GameState, instanceId: number): CardInstance | null {
  const idx = state.hand.findIndex((c) => c.instanceId === instanceId);
  if (idx === -1) return null;
  return state.hand.splice(idx, 1)[0];
}

export function addCardToDeck(state: GameState, defId: string, temp: boolean = false): void {
  const inst: CardInstance = {
    instanceId: state.nextInstanceId++,
    defId,
    isDummy: false,
    isTemp: temp,
  };
  // insert at random position in deck
  const pos = Math.floor(Math.random() * (state.deck.length + 1));
  state.deck.splice(pos, 0, inst);
}

export function roundReset(state: GameState): void {
  // Gather all cards from hand, deck, discard
  const allCards = [...state.deck, ...state.hand, ...state.discard];

  // Remove temp cards, clear dummy tags
  const kept = allCards.filter((c) => !c.isTemp);
  for (const c of kept) {
    c.isDummy = false;
  }

  state.deck = shuffle(kept);
  state.hand = [];
  state.discard = [];
}

export function getCardDef(defId: string) {
  return CARD_DEFS[defId];
}
