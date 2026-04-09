import { CARD_DEFS } from "../constants";
import { CardType } from "../types";

export function renderCodex(): string {
  const vegetables = Object.values(CARD_DEFS).filter(c => c.type === CardType.VEGETABLE);
  const actions = Object.values(CARD_DEFS).filter(c => c.type === CardType.WATERING || c.type === CardType.TRANSPLANT);
  const tools = Object.values(CARD_DEFS).filter(c => c.type === CardType.TOOL);

  function cardHtml(c: typeof vegetables[0]): string {
    const costLabel = c.cost > 0 ? `💧 ${c.cost}` : "무료";
    const hpLabel = c.hp ? `❤️ ${c.hp}` : "";
    const growthLabel = c.fullStack ? `🌱 ${c.fullStack}` : "";
    const stats = [costLabel, hpLabel, growthLabel].filter(Boolean).join("  ");

    return `
      <div class="codex-card">
        <div class="codex-card-emoji">${c.emoji}</div>
        <div class="codex-card-name">${c.name}</div>
        <div class="codex-card-stats">${stats}</div>
        <div class="codex-card-desc">${c.description}</div>
      </div>`;
  }

  function sectionHtml(title: string, cards: typeof vegetables): string {
    return `
      <div class="codex-section">
        <h3 class="codex-section-title">${title}</h3>
        <div class="codex-cards">${cards.map(cardHtml).join("")}</div>
      </div>`;
  }

  return `
    <div class="codex-overlay" id="codex-overlay">
      <div class="codex-panel">
        <div class="codex-header">
          <h2>📖 카드 도감</h2>
          <button class="codex-close" id="codex-close">&times;</button>
        </div>
        ${sectionHtml("🥬 야채", vegetables)}
        ${sectionHtml("💧 행동", actions)}
        ${sectionHtml("🔧 도구", tools)}
      </div>
    </div>`;
}
