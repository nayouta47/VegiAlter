import { GameState } from "../types";

export function renderLog(state: GameState): string {
  const entries = state.log
    .slice(-20)
    .map((msg) => `<div class="log-entry">${msg}</div>`)
    .join("");

  return `
    <div class="log-panel">
      <div class="log-header">로그</div>
      <div class="log-entries">${entries}</div>
    </div>
  `;
}
