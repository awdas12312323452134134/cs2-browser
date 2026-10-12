import * as THREE from 'three';

export class Enemy {
  mesh: THREE.Mesh;
  head: THREE.Mesh;
  health = 100;
  alive = true;
  speed = 2.5;
  private lastShot = 0;
  private shotCooldown = 1200; // ms
  private fireRange = 20;
  private spread = 0.25;

  constructor(scene: THREE.Scene, x: number, z: number, color = 0xff3333) {
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1.6, 0.6), bodyMat);
    this.mesh.position.set(x, 0.8, z);
    this.mesh.castShadow = true;
    this.mesh.userData.enemy = this;

    this.head = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffaa00 })
    );
    this.head.position.y = 1.25;
    this.head.userData.enemy = this;
    this.head.userData.isHead = true;
    this.mesh.add(this.head);

    scene.add(this.mesh);
  }

  getHeadWorldPos() {
    return new THREE.Vector3().copy(this.head.position).applyMatrix4(this.mesh.matrixWorld);
  }

  takeDamage(n: number) {
    if (!this.alive) return;
    this.health -= n;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.mesh.visible = false;
    }
  }

  update(dt: number, playerPos: THREE.Vector3, onShoot: (dmg: number) => void) {
    if (!this.alive) return;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    // Face player
    this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

    // Move toward player if far
    if (dist > 8) {
      toPlayer.normalize();
      this.mesh.position.addScaledVector(toPlayer, this.speed * dt);
    }

    // Shoot player
    const now = performance.now();
    if (dist < this.fireRange && now - this.lastShot > this.shotCooldown) {
      this.lastShot = now;
      if (Math.random() > this.spread) onShoot(10);
    }
  }
}