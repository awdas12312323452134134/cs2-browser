import type { CheatKey, CheatManager, CheatSettings } from './cheats';

export class HUD {
  root: HTMLElement;
  statsEl: HTMLElement;
  ammoEl: HTMLElement;
  feedEl: HTMLElement;
  lockEl: HTMLElement;
  menuEl: HTMLElement;
  waveEl: HTMLElement;

  constructor(
    private cheats: CheatManager,
    private onToggle: (k: CheatKey) => void
  ) {
    this.root = document.getElementById('hud')!;

    this.lockEl = document.createElement('div');
    this.lockEl.className = 'lock-prompt';
    this.lockEl.textContent = 'Click to play';
    this.root.appendChild(this.lockEl);

    const crosshair = document.createElement('div');
    crosshair.className = 'crosshair';
    this.root.appendChild(crosshair);

    this.statsEl = document.createElement('div');
    this.statsEl.className = 'stats';
    this.root.appendChild(this.statsEl);

    this.ammoEl = document.createElement('div');
    this.ammoEl.className = 'ammo';
    this.root.appendChild(this.ammoEl);

    this.feedEl = document.createElement('div');
    this.feedEl.className = 'killfeed';
    this.root.appendChild(this.feedEl);

    this.waveEl = document.createElement('div');
    this.waveEl.className = 'wave';
    this.root.appendChild(this.waveEl);

    this.menuEl = this.buildMenu();
    document.body.appendChild(this.menuEl);

    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement !== null;
      this.lockEl.style.display = locked ? 'none' : 'block';
    });

    window.addEventListener('keydown', e => {
      if (e.code === 'Backquote' || e.code === 'Insert') {
        e.preventDefault();
        this.menuEl.style.display = this.menuEl.style.display === 'block' ? 'none' : 'block';
      }
    });
  }

  buildMenu(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'cheat-menu';

    const h = document.createElement('h3');
    h.textContent = '⚙ CHEATS  [~ to close]';
    el.appendChild(h);

    const s = this.cheats.settings;

    const section = (title: string) => {
      const t = document.createElement('div');
      t.className = 'cheat-section';
      t.textContent = title;
      el.appendChild(t);
    };

    const checkbox = (key: CheatKey, label?: string) => {
      const lab = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = this.cheats.state[key];
      cb.onchange = () => {
        this.onToggle(key);
        cb.checked = this.cheats.state[key];
      };
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(label ?? key));
      el.appendChild(lab);
    };

    const slider = (
      label: string,
      get: () => number,
      set: (v: number) => void,
      min: number, max: number, step: number
    ) => {
      const wrap = document.createElement('div');
      wrap.className = 'cheat-slider';
      const lab = document.createElement('label');
      const val = document.createElement('span');
      val.textContent = get().toString();
      lab.textContent = `${label}: `;
      lab.appendChild(val);
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = min.toString();
      inp.max = max.toString();
      inp.step = step.toString();
      inp.value = get().toString();
      inp.oninput = () => {
        const v = parseFloat(inp.value);
        set(v);
        val.textContent = v.toString();
      };
      wrap.appendChild(lab);
      wrap.appendChild(inp);
      el.appendChild(wrap);
    };

    // ---- AIMBOT ----
    section('AIMBOT');
    checkbox('aimbot');
    slider('FOV°', () => s.aimbotFov, v => s.aimbotFov = v, 10, 360, 5);
    slider('Smoothing', () => s.aimbotSmoothing, v => s.aimbotSmoothing = v, 0.05, 1, 0.05);
    {
      const lab = document.createElement('label');
      lab.className = 'cheat-row';
      lab.textContent = 'Target: ';
      const sel = document.createElement('select');
      (['head', 'body'] as const).forEach(bone => {
        const o = document.createElement('option');
        o.value = bone;
        o.textContent = bone;
        o.selected = s.aimbotTargetBone === bone;
        sel.appendChild(o);
      });
      sel.onchange = () => s.aimbotTargetBone = sel.value as 'head' | 'body';
      lab.appendChild(sel);
      el.appendChild(lab);
    }

    // ---- TRIGGERBOT ----
    section('TRIGGERBOT');
    checkbox('triggerbot');
    slider('Delay ms', () => s.triggerbotDelay, v => s.triggerbotDelay = v, 0, 500, 10);

    // ---- SPINBOT ----
    section('SPINBOT');
    checkbox('spinbot');
    slider('Speed', () => s.spinSpeed, v => s.spinSpeed = v, 5, 100, 5);

    // ---- VISUALS ----
    section('VISUALS');
    checkbox('wallhack');
    slider('Opacity', () => s.wallhackOpacity, v => s.wallhackOpacity = v, 0.1, 1, 0.05);

    // ---- COMBAT ----
    section('COMBAT');
    checkbox('instakill');
    slider('Instakill dmg', () => s.instakillDmg, v => s.instakillDmg = v, 100, 9999, 100);
    checkbox('noRecoil');
    checkbox('infiniteAmmo');

    // ---- PLAYER ----
    section('PLAYER');
    checkbox('godmode');
    checkbox('speedhack');
    slider('Speed ×', () => s.speedhackMul, v => s.speedhackMul = v, 1, 10, 0.5);

    // Close button
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.onclick = () => el.style.display = 'none';
    el.appendChild(close);

    return el;
  }

  update(playerHealth: number, ammo: number, reserve: number, alive: boolean, enemiesAlive: number) {
    this.statsEl.textContent = `HP: ${playerHealth}  ${alive ? '' : '☠ DEAD'}`;
    this.ammoEl.textContent = `${ammo} / ${reserve}`;
    this.waveEl.textContent = `Enemies: ${enemiesAlive}`;
  }

  addKill(text: string) {
    const d = document.createElement('div');
    d.textContent = text;
    this.feedEl.prepend(d);
    setTimeout(() => d.remove(), 4000);
    while (this.feedEl.children.length > 6) {
      this.feedEl.lastChild?.remove();
    }
  }
}