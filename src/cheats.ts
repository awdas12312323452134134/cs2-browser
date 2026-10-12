import * as THREE from 'three';
import type { Player } from './player';
import type { Enemy } from './enemy';
import type { Weapon } from './weapon';

export type CheatKey =
  | 'aimbot' | 'spinbot' | 'triggerbot'
  | 'wallhack' | 'noRecoil' | 'infiniteAmmo'
  | 'godmode' | 'speedhack' | 'instakill';

export interface CheatSettings {
  aimbotFov: number;
  aimbotSmoothing: number;
  aimbotTargetBone: 'head' | 'body';
  spinSpeed: number;
  triggerbotDelay: number;
  triggerbotFov: number;
  speedhackMul: number;
  wallhackOpacity: number;
  instakillDmg: number;
}

export class CheatManager {
  state: Record<CheatKey, boolean> = {
    aimbot: false, spinbot: false, triggerbot: false,
    wallhack: false, noRecoil: false, infiniteAmmo: false,
    godmode: false, speedhack: false, instakill: false,
  };

  settings: CheatSettings = {
    aimbotFov: 180,
    aimbotSmoothing: 0.5,
    aimbotTargetBone: 'head',
    spinSpeed: 30,
    triggerbotDelay: 0,
    triggerbotFov: 2,
    speedhackMul: 3,
    wallhackOpacity: 0.7,
    instakillDmg: 1000,
  };

  private originalMats = new Map<THREE.Mesh, { depthTest: boolean; depthWrite: boolean; transparent: boolean; opacity: number }>();
  private lastTrigger = 0;

  toggle(key: CheatKey, enemies: Enemy[]) {
    this.state[key] = !this.state[key];
    if (key === 'wallhack') this.applyWallhack(enemies);
  }

  applyWallhack(enemies: Enemy[]) {
    for (const e of enemies) {
      e.mesh.traverse((obj: THREE.Object3D) => {
        const m = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (!m) return;
        if (this.state.wallhack) {
          if (!this.originalMats.has(obj as THREE.Mesh)) {
            this.originalMats.set(obj as THREE.Mesh, {
              depthTest: m.depthTest, depthWrite: m.depthWrite,
              transparent: m.transparent, opacity: m.opacity,
            });
          }
          m.depthTest = false;
          m.depthWrite = false;
          m.transparent = true;
          m.opacity = this.settings.wallhackOpacity;
          (obj as THREE.Mesh).renderOrder = 999;
        } else {
          const orig = this.originalMats.get(obj as THREE.Mesh);
          if (orig) {
            m.depthTest = orig.depthTest;
            m.depthWrite = orig.depthWrite;
            m.transparent = orig.transparent;
            m.opacity = orig.opacity;
            (obj as THREE.Mesh).renderOrder = 0;
          }
        }
      });
    }
  }

  update(player: Player, camera: THREE.PerspectiveCamera, enemies: Enemy[], weapon: Weapon, dt: number) {
    // Spinbot
    if (this.state.spinbot) {
      player.yaw += this.settings.spinSpeed * dt;
    }

    // Aimbot
    if (this.state.aimbot && enemies.length) {
      const camPos = camera.position.clone();
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);

      let best: Enemy | null = null;
      let bestAngle = this.settings.aimbotFov / 2;
      let bestPos: THREE.Vector3 | null = null;

      for (const e of enemies) {
        if (!e.alive) continue;
        const target = this.settings.aimbotTargetBone === 'head'
          ? e.getHeadWorldPos()
          : e.mesh.position.clone().add(new THREE.Vector3(0, 0.9, 0));
        const toEnemy = target.clone().sub(camPos).normalize();
        const angle = THREE.MathUtils.radToDeg(camDir.angleTo(toEnemy));
        if (angle < bestAngle) {
          bestAngle = angle;
          best = e;
          bestPos = target;
        }
      }

      if (best && bestPos) {
        const desired = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(camPos, bestPos, camera.up)
        );
        camera.quaternion.slerp(desired, this.settings.aimbotSmoothing);

        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        player.yaw = euler.y;
        player.pitch = euler.x;
      }
    }

    // Triggerbot
    if (this.state.triggerbot && enemies.length) {
      const now = performance.now();
      if (now - this.lastTrigger < this.settings.triggerbotDelay) return;

      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const rc = new THREE.Raycaster(camera.position, camDir);
      const meshes: THREE.Object3D[] = [];
      enemies.forEach(e => { if (e.alive) meshes.push(e.mesh); });
      const hits = rc.intersectObjects(meshes, true);
      if (hits.length && weapon.canFire(now)) {
        weapon.fire(camera, enemies);
        this.lastTrigger = now;
      }
    }
  }

  // Called by main loop to compute damage with instakill
  damageFor(base: number, isHead: boolean, weapon: Weapon): number {
    if (this.state.instakill) return this.settings.instakillDmg;
    return base * (isHead ? weapon.headshotMul : 1);
  }
}