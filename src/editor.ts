import { SequenceElement } from "./types";
import { THREAT_SCHEDULE, BOSS_THREATS } from "./constants";

interface EditorThreat {
  timer: number;
  hurdle: number;
  sequence: SequenceElement[];
}

interface EditorRound {
  label: string;
  isBoss: boolean;
  threats: EditorThreat[];
}

const STORAGE_KEY = "vegialter_custom_threats";
const app = document.getElementById("app")!;

let rounds: EditorRound[] = [];

function loadRounds(): void {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      rounds = JSON.parse(saved);
      return;
    } catch { /* fall through to defaults */ }
  }
  rounds = THREAT_SCHEDULE.map((rt, i) => ({
    label: `라운드 ${i + 1}`,
    isBoss: false,
    threats: rt.threats.map((t) => ({
      timer: t.timer,
      hurdle: t.hurdle,
      sequence: [...t.sequence],
    })),
  }));
  rounds.push({
    label: "보스",
    isBoss: true,
    threats: BOSS_THREATS.threats.map((t) => ({
      timer: t.timer,
      hurdle: t.hurdle,
      sequence: [...t.sequence],
    })),
  });
}

function save(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
}

function relabelRounds(): void {
  let idx = 1;
  for (const r of rounds) {
    if (!r.isBoss) {
      r.label = `라운드 ${idx}`;
      idx++;
    }
  }
}

function seqEmoji(elem: SequenceElement): string {
  if (elem === SequenceElement.HP) return "❤️";
  if (elem === SequenceElement.TIME) return "⏳";
  return "🪙";
}

function renderEditor(): void {
  let html = `<div class="editor">`;
  html += `<div class="editor-nav"><a href="./">← 게임으로 돌아가기</a></div>`;
  html += `<h1>위협 에디터</h1>`;
  html += `<div class="editor-actions">
    <button class="btn btn--primary" id="btn-save">저장</button>
    <button class="btn btn--primary" id="btn-play">저장 & 플레이</button>
    <button class="btn btn--end-turn" id="btn-reset">기본값으로 초기화</button>
    <button class="btn btn--primary" id="btn-add-round">라운드 추가</button>
  </div>`;

  for (let ri = 0; ri < rounds.length; ri++) {
    const round = rounds[ri];
    html += `<div class="editor-round">`;
    html += `<div class="editor-round-header">
      <h2>${round.label}</h2>
      <button class="btn-small btn-small--add" data-add-threat="${ri}">위협 추가</button>
      ${!round.isBoss ? `<button class="btn-small btn-small--remove" data-remove-round="${ri}">라운드 삭제</button>` : ""}
    </div>`;

    for (let ti = 0; ti < round.threats.length; ti++) {
      const threat = round.threats[ti];
      html += `<div class="editor-threat">`;
      html += `<div class="editor-threat-header">
        <span>위협 ${ti + 1}</span>
        <button class="btn-small btn-small--remove" data-remove-threat="${ri}-${ti}">삭제</button>
      </div>`;
      html += `<div class="editor-threat-fields">
        <label>타이머: <input type="number" min="1" max="10" value="${threat.timer}" data-field="timer" data-threat="${ri}-${ti}" class="editor-input"></label>
        <label>허들: <input type="number" min="1" max="20" value="${threat.hurdle}" data-field="hurdle" data-threat="${ri}-${ti}" class="editor-input"></label>
      </div>`;
      html += `<div class="editor-sequence"><span>시퀀스: </span>`;
      for (let si = 0; si < threat.sequence.length; si++) {
        const elem = threat.sequence[si];
        html += `<span class="seq-badge seq-badge--${elem.toLowerCase()}" data-remove-seq="${ri}-${ti}-${si}">${seqEmoji(elem)}</span>`;
      }
      html += `
        <button class="btn-small btn-small--seq" data-add-seq="${ri}-${ti}-HP">+❤️</button>
        <button class="btn-small btn-small--seq" data-add-seq="${ri}-${ti}-TIME">+⏳</button>
        <button class="btn-small btn-small--seq" data-add-seq="${ri}-${ti}-MONEY">+🪙</button>
      </div>`;
      html += `</div>`;
    }

    html += `</div>`;
  }

  html += `</div>`;
  app.innerHTML = html;
  bindEditorEvents();
}

function bindEditorEvents(): void {
  document.getElementById("btn-save")?.addEventListener("click", () => {
    save();
    alert("저장되었습니다!");
  });

  document.getElementById("btn-play")?.addEventListener("click", () => {
    save();
    window.location.href = "./";
  });

  document.getElementById("btn-reset")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    loadRounds();
    renderEditor();
  });

  document.getElementById("btn-add-round")?.addEventListener("click", () => {
    const bossIdx = rounds.findIndex((r) => r.isBoss);
    rounds.splice(bossIdx, 0, {
      label: "",
      isBoss: false,
      threats: [{ timer: 3, hurdle: 2, sequence: [SequenceElement.HP, SequenceElement.MONEY] }],
    });
    relabelRounds();
    renderEditor();
  });

  app.querySelectorAll<HTMLElement>("[data-remove-round]").forEach((el) => {
    el.addEventListener("click", () => {
      const ri = parseInt(el.dataset.removeRound!);
      rounds.splice(ri, 1);
      relabelRounds();
      renderEditor();
    });
  });

  app.querySelectorAll<HTMLElement>("[data-add-threat]").forEach((el) => {
    el.addEventListener("click", () => {
      const ri = parseInt(el.dataset.addThreat!);
      rounds[ri].threats.push({ timer: 3, hurdle: 2, sequence: [SequenceElement.HP, SequenceElement.MONEY] });
      renderEditor();
    });
  });

  app.querySelectorAll<HTMLElement>("[data-remove-threat]").forEach((el) => {
    el.addEventListener("click", () => {
      const [ri, ti] = el.dataset.removeThreat!.split("-").map(Number);
      rounds[ri].threats.splice(ti, 1);
      renderEditor();
    });
  });

  app.querySelectorAll<HTMLInputElement>("[data-field]").forEach((el) => {
    el.addEventListener("change", () => {
      const [ri, ti] = el.dataset.threat!.split("-").map(Number);
      const field = el.dataset.field as "timer" | "hurdle";
      rounds[ri].threats[ti][field] = parseInt(el.value) || 1;
    });
  });

  app.querySelectorAll<HTMLElement>("[data-add-seq]").forEach((el) => {
    el.addEventListener("click", () => {
      const parts = el.dataset.addSeq!.split("-");
      const ri = parseInt(parts[0]);
      const ti = parseInt(parts[1]);
      const elem = parts[2] as SequenceElement;
      rounds[ri].threats[ti].sequence.push(elem);
      renderEditor();
    });
  });

  app.querySelectorAll<HTMLElement>("[data-remove-seq]").forEach((el) => {
    el.addEventListener("click", () => {
      const [ri, ti, si] = el.dataset.removeSeq!.split("-").map(Number);
      rounds[ri].threats[ti].sequence.splice(si, 1);
      renderEditor();
    });
  });
}

loadRounds();
renderEditor();
