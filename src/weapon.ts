import * as THREE from 'three';
import type { Enemy } from './enemy';

export class Weapon {
  raycaster = new THREE.Raycaster();
  damage = 25;
  headshotMul = 4;
  fireRate = 100;
  magSize = 30;
  ammo = 30;
  reserve = 90;
  private lastShot = 0;

  canFire(now: number) {
    return now - this.lastShot >= this.fireRate && this.ammo > 0;
  }

  fire(camera: THREE.Camera, enemies: Enemy[], onHit?: (dmg: number, headshot: boolean) => void): { hit: boolean; headshot: boolean } {
    const now = performance.now();
    if (!this.canFire(now)) return { hit: false, headshot: false };

    this.lastShot = now;
    this.ammo--;

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    this.raycaster.set(camera.position, dir);

    const meshes: THREE.Object3D[] = [];
    enemies.forEach(e => { if (e.alive) meshes.push(e.mesh); });

    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits.length > 0) {
      const hitObj = hits[0].object as THREE.Mesh;
      const enemy = hitObj.userData.enemy as Enemy;
      if (enemy) {
        const isHead = hitObj.userData.isHead === true;
        const dmg = this.damage * (isHead ? this.headshotMul : 1);
        enemy.takeDamage(dmg);
        onHit?.(dmg, isHead);
        return { hit: true, headshot: isHead };
      }
    }
    return { hit: false, headshot: false };
  }

  // Overload for cheats to apply custom damage
  applyDamage(enemy: Enemy, dmg: number) {
    enemy.takeDamage(dmg);
  }

  reload() {
    const need = this.magSize - this.ammo;
    const take = Math.min(need, this.reserve);
    this.ammo += take;
    this.reserve -= take;
  }
}