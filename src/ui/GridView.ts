import { CardDef, CardType, GameState, SequenceElement, ToolEffect } from "../types";
import { CARD_DEFS } from "../constants";

export function renderGrid(state: GameState): string {
  const selectedCard =
    state.selectedCardIndex !== null ? state.hand[state.selectedCardIndex] : null;
  const selectedDef = selectedCard ? CARD_DEFS[selectedCard.defId] : null;

  let html = `<div class="grid" style="grid-template-columns: repeat(${state.gridCols}, auto);">`;

  for (let r = 0; r < state.gridRows; r++) {
    for (let c = 0; c < state.gridCols; c++) {
      const cell = state.grid[r][c];
      const isValidTarget = getIsValidTarget(state, r, c, selectedDef);

      let cellClass = "cell";
      if (isValidTarget) cellClass += " cell--valid";
      if (cell.plant) cellClass += " cell--planted";
      if (cell.plant && cell.plant.growthStack >= cell.plant.fullStack) cellClass += " cell--harvestable";

      html += `<div class="${cellClass}" data-row="${r}" data-col="${c}">`;

      // Plant info
      if (cell.plant) {
        const pDef = CARD_DEFS[cell.plant.defId];
        const hpBar = renderMiniBar(cell.plant.hp, cell.plant.maxHp, "hp");
        const growthBar = renderMiniBar(cell.plant.growthStack, cell.plant.fullStack, "growth");
        const stunIcon = cell.plant.stunned ? '<span class="stun-icon">💤</span>' : "";
        const defenseIcon = cell.plant.defense > 0
          ? `<span class="defense-icon">🛡️${cell.plant.defense}</span>`
          : "";
        html += `
          <div class="plant">
            <div class="plant-emoji">${pDef.emoji}</div>
            <div class="plant-stats">
              ${hpBar} ${growthBar}
            </div>
            ${stunIcon}
            ${defenseIcon}
          </div>
        `;
      }

      // Threats (timer only — hurdle and sequence are hidden until fired)
      if (cell.threats.length > 0) {
        html += `<div class="threats">`;
        for (const threat of cell.threats) {
          if (threat.fired) continue;
          const seq = threat.sequence.map(s =>
            s === SequenceElement.HP ? "💔" : s === SequenceElement.TIME ? "⌛" : "🪙"
          ).join("");
          html += `<div class="threat-badge">⏱️${threat.timer} ${seq}</div>`;
        }
        html += `</div>`;
      }

      html += `</div>`;
    }
  }

  html += `</div>`;
  return html;
}

function getIsValidTarget(
  state: GameState,
  row: number,
  col: number,
  selectedDef: CardDef | null
): boolean {
  if (!selectedDef || state.selectedCardIndex === null) return false;
  const cell = state.grid[row][col];

  if (selectedDef.type === CardType.VEGETABLE) {
    return cell.plant === null;
  }
  if (selectedDef.type === CardType.WATERING) {
    return cell.plant !== null;
  }
  if (selectedDef.type === CardType.TRANSPLANT) {
    if (cell.plant) return true;
    const offsets: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dr, dc] of offsets) {
      const r2 = row + dr, c2 = col + dc;
      if (r2 >= 0 && r2 < state.gridRows && c2 >= 0 && c2 < state.gridCols) {
        if (state.grid[r2][c2].plant) return true;
      }
    }
    return false;
  }
  if (selectedDef.toolEffect === ToolEffect.WATERING_CAN) {
    return true; // Can target any cell
  }
  return false;
}

function renderMiniBar(current: number, max: number, type: string): string {
  const pips = [];
  for (let i = 0; i < max; i++) {
    const filled = i < current ? "filled" : "";
    pips.push(`<span class="pip pip--${type} ${filled}"></span>`);
  }
  return `<div class="mini-bar">${pips.join("")}</div>`;
}
