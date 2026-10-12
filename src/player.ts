import * as THREE from 'three';

export class Player {
  pos = new THREE.Vector3(0, 1.7, 0);
  yaw = 0;
  pitch = 0;
  speed = 8;
  health = 100;
  alive = true;

  forward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }
  right() {
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
  }
  applyToCamera(cam: THREE.PerspectiveCamera) {
    cam.position.copy(this.pos);
    cam.rotation.order = 'YXZ';
    cam.rotation.y = this.yaw;
    cam.rotation.x = this.pitch;
  }
  takeDamage(n: number) {
    if (!this.alive) return;
    this.health -= n;
    if (this.health <= 0) { this.health = 0; this.alive = false; }
  }
}