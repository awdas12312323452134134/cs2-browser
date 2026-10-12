import * as THREE from 'three';
import type { Player } from './player';
import type { Enemy } from './enemy';
import type { Weapon } from './weapon';

export type CheatKey =
  | 'aimbot' | 'spinbot' | 'triggerbot'
  | 'wallhack' | 'noRecoil' | 'infiniteAmmo'
  | 'godmode' | 'speedhack';

export class CheatManager {
  state: Record<CheatKey, boolean> = {
    aimbot: false, spinbot: false, triggerbot: false,
    wallhack: false, noRecoil: false, infiniteAmmo: false,
    godmode: false, speedhack: false,
  };

  aimbotFov = 180;
  aimbotSmoothing = 1;
  spinSpeed = 30;

  private originalMats = new Map<THREE.Mesh, { depthTest: boolean; depthWrite: boolean; transparent: boolean; opacity: number }>();

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
          m.opacity = 0.7;
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

 update(player: Player, camera: THREE.PerspectiveCamera, enemies: Enemy[], _weapon: Weapon, dt: number) {
    // Spinbot
    if (this.state.spinbot) {
      player.yaw += this.spinSpeed * dt;
    }

    // Aimbot
    if (this.state.aimbot && enemies.length) {
      const camPos = camera.position.clone();
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);

      let best: Enemy | null = null;
      let bestAngle = this.aimbotFov / 2;
      let bestPos: THREE.Vector3 | null = null;

      for (const e of enemies) {
        if (!e.alive) continue;
        const head = e.getHeadWorldPos();
        const toEnemy = head.clone().sub(camPos).normalize();
        const angle = THREE.MathUtils.radToDeg(camDir.angleTo(toEnemy));
        if (angle < bestAngle) {
          bestAngle = angle;
          best = e;
          bestPos = head;
        }
      }

      if (best && bestPos) {
        const desired = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(camPos, bestPos, camera.up)
        );
        camera.quaternion.slerp(desired, this.aimbotSmoothing);

        // Sync player yaw/pitch so movement stays aligned
        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        player.yaw = euler.y;
        player.pitch = euler.x;
      }
    }

    // Triggerbot
    if (this.state.triggerbot && enemies.length) {
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      const rc = new THREE.Raycaster(camera.position, camDir);
      const meshes: THREE.Object3D[] = [];
      enemies.forEach(e => { if (e.alive) meshes.push(e.mesh); });
      const hits = rc.intersectObjects(meshes, true);
      if (hits.length && weapon.canFire(performance.now())) {
        weapon.fire(camera, enemies);
      }
    }
  }

  // Called by weapon before applying recoil/ammo
  modifyDamage(weapon: Weapon) {
    // nothing here yet, placeholder for future
  }
}