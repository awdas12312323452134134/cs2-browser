import * as THREE from 'three';

const OPERATOR_SKINS = [
  { name: 'Vanguard',   body: 0x3a5a40, head: 0x8b7355, accent: 0xffd700 }, // green/desert
  { name: 'Crimson',    body: 0x7a1f1f, head: 0xa08060, accent: 0xffaa00 }, // red
  { name: 'Phantom',    body: 0x2a2a3a, head: 0x6b5540, accent: 0x00d0ff }, // black ops
  { name: 'Frostbite',  body: 0x4a6070, head: 0xa0a0a0, accent: 0x00ffcc }, // cold weather
  { name: 'Sahara',     body: 0x9c7a45, head: 0x8b7355, accent: 0xff8800 }, // desert
  { name: 'Nightshade', body: 0x1a1a2a, head: 0x707070, accent: 0xaa00ff }, // stealth
  { name: 'Ember',      body: 0x8a3a1a, head: 0x9a7a5a, accent: 0xff4400 }, // fire
  { name: 'Jade',       body: 0x2a5a4a, head: 0x8b9070, accent: 0x00ff88 }, // jungle
];

export class Enemy {
  mesh: THREE.Group;
  head: THREE.Mesh;
  body: THREE.Mesh;
  arms: THREE.Mesh;
  health = 100;
  maxHealth = 100;
  alive = true;
  speed = 2.5;
  skin: typeof OPERATOR_SKINS[number];
  private lastShot = 0;
  private shotCooldown = 1200;
  private fireRange = 25;
  private spread = 0.35;

  constructor(scene: THREE.Scene, x: number, z: number) {
    this.skin = OPERATOR_SKINS[Math.floor(Math.random() * OPERATOR_SKINS.length)];
    this.mesh = new THREE.Group();
    this.mesh.position.set(x, 0, z);

    const bodyMat = new THREE.MeshStandardMaterial({ color: this.skin.body });
    const headMat = new THREE.MeshStandardMaterial({ color: this.skin.head });
    const accentMat = new THREE.MeshStandardMaterial({ color: this.skin.accent, emissive: this.skin.accent, emissiveIntensity: 0.3 });

    // Torso
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.4), bodyMat);
    this.body.position.y = 0.9;
    this.body.castShadow = true;
    this.body.userData.enemy = this;
    this.mesh.add(this.body);

    // Head
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), headMat);
    this.head.position.y = 1.65;
    this.head.castShadow = true;
    this.head.userData.enemy = this;
    this.head.userData.isHead = true;
    this.mesh.add(this.head);

    // Helmet/visor (accent)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.5), accentMat);
    visor.position.set(0, 1.7, 0);
    visor.userData.enemy = this;
    this.mesh.add(visor);

    // Arms (one box stretched forward as a gun)
    this.arms = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.9), bodyMat);
    this.arms.position.set(0.35, 1.2, -0.5);
    this.arms.castShadow = true;
    this.arms.userData.enemy = this;
    this.mesh.add(this.arms);

    const arms2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.9), bodyMat);
    arms2.position.set(-0.35, 1.2, -0.5);
    arms2.userData.enemy = this;
    this.mesh.add(arms2);

    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.3), legMat);
    legL.position.set(-0.2, 0.35, 0);
    legL.userData.enemy = this;
    this.mesh.add(legL);

    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.3), legMat);
    legR.position.set(0.2, 0.35, 0);
    legR.userData.enemy = this;
    this.mesh.add(legR);

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

  dispose(scene: THREE.Scene) {
    scene.remove(this.mesh);
    this.mesh.traverse(obj => {
      const m = (obj as THREE.Mesh);
      if (m.geometry) m.geometry.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach(x => x.dispose());
        else m.material.dispose();
      }
    });
  }

  update(dt: number, playerPos: THREE.Vector3, onShoot: (dmg: number) => void) {
    if (!this.alive) return;

    const toPlayer = new THREE.Vector3().subVectors(playerPos, this.mesh.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();

    this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

    if (dist > 10) {
      toPlayer.normalize();
      this.mesh.position.addScaledVector(toPlayer, this.speed * dt);
    }

    const now = performance.now();
    if (dist < this.fireRange && now - this.lastShot > this.shotCooldown) {
      this.lastShot = now;
      if (Math.random() > this.spread) onShoot(8 + Math.random() * 6);
    }
  }
}