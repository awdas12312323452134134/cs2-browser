import type { CheatKey } from './cheats';
export class HUD {
  root: HTMLElement;
  statsEl: HTMLElement;
  ammoEl: HTMLElement;
  feedEl: HTMLElement;
  lockEl: HTMLElement;
  menuEl: HTMLElement;

  constructor(private onToggle: (k: CheatKey) => void) {
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
    h.textContent = 'CHEATS';
    el.appendChild(h);

    const keys: CheatKey[] = [
      'aimbot', 'triggerbot', 'spinbot',
      'wallhack', 'noRecoil', 'infiniteAmmo',
      'godmode', 'speedhack',
    ];

    for (const key of keys) {
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.onchange = () => this.onToggle(key);
      label.appendChild(cb);
      label.appendChild(document.createTextNode(key));
      el.appendChild(label);
    }
    return el;
  }

  update(playerHealth: number, ammo: number, reserve: number, alive: boolean) {
    this.statsEl.textContent = `HP: ${playerHealth}  ${alive ? '' : '☠ DEAD'}`;
    this.ammoEl.textContent = `${ammo} / ${reserve}`;
  }

  addKill(text: string) {
    const d = document.createElement('div');
    d.textContent = text;
    this.feedEl.prepend(d);
    setTimeout(() => d.remove(), 4000);
  }
}