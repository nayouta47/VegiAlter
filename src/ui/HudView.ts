import { GameState } from "../types";
import { WATER_PER_TURN } from "../constants";

export function renderHud(state: GameState): string {
  const bossLabel = state.isBoss ? " [BOSS]" : "";
  return `
    <div class="hud">
      <div class="hud-item">❤️ ${state.farmerHp}/${state.farmerMaxHp}</div>
      <div class="hud-item">💧 ${state.water}/${WATER_PER_TURN}</div>
      <div class="hud-item">🪙 ${state.gold}</div>
      <div class="hud-item">⏳ ${state.timeTokens}</div>
      <div class="hud-item">📋 라운드 ${state.runRound}${bossLabel} / 턴 ${state.turnInRound}</div>
      <div class="hud-item">🃏 덱 ${state.deck.length} | 버림 ${state.discard.length}</div>
      <div class="hud-item hud-item--right"><button class="btn-codex" id="btn-codex">📖 도감</button></div>
    </div>
  `;
}
