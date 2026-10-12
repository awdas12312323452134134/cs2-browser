import * as THREE from 'three';
import './style.css';
import { Player } from './player';
import { Enemy } from './enemy';
import { Weapon } from './weapon';
import { CheatManager } from './cheats';
import { HUD } from './hud';

// ---- Scene setup ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 20, 100);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.4));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(15, 25, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
scene.add(sun);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshStandardMaterial({ color: 0x333344 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Simple cover boxes (map)
const wallMat = new THREE.MeshStandardMaterial({ color: 0x666688 });
const wallPositions: [number, number, number, number, number, number][] = [
  [10, 2, 5, 4, 4, 1],
  [-10, 2, -5, 4, 4, 1],
  [5, 2, -15, 6, 4, 1],
  [-8, 2, 15, 1, 4, 8],
  [20, 2, 20, 8, 4, 1],
];
for (const [x, y, z, w, h, d] of wallPositions) {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
}

// ---- Entities ----
const player = new Player();
const weapon = new Weapon();
const enemies: Enemy[] = [];

function spawnEnemy(x: number, z: number) {
  const e = new Enemy(scene, x, z);
  enemies.push(e);
  return e;
}

for (let i = 0; i < 6; i++) {
  const angle = (i / 6) * Math.PI * 2;
  spawnEnemy(Math.cos(angle) * 25, Math.sin(angle) * 25);
}

// ---- Cheats ----
const cheats = new CheatManager();
const hud = new HUD((key) => {
  cheats.toggle(key, enemies);
});
// ---- Input ----
const keys: Record<string, boolean> = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'KeyR') weapon.reload();
});
document.addEventListener('keyup', e => keys[e.code] = false);

renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock();
});

document.addEventListener('mousemove', e => {
  if (document.pointerLockElement !== renderer.domElement) return;
  if (cheats.state.aimbot) return; // aimbot owns the camera
  player.yaw -= e.movementX * 0.002;
  player.pitch -= e.movementY * 0.002;
  player.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, player.pitch));
});

document.addEventListener('mousedown', e => {
  if (e.button === 0 && document.pointerLockElement === renderer.domElement) {
    const r = weapon.fire(camera, enemies);
    if (r.hit) {
      hud.addKill(r.headshot ? '🎯 HEADSHOT' : '✔ HIT');
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---- Loop ----
const clock = new THREE.Clock();

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.1);

  // Movement
  const speed = player.speed * (cheats.state.speedhack ? 3 : 1);
  const forward = player.forward();
  const right = player.right();
  const move = new THREE.Vector3();
  if (keys['KeyW']) move.add(forward);
  if (keys['KeyS']) move.sub(forward);
  if (keys['KeyD']) move.add(right);
  if (keys['KeyA']) move.sub(right);
  if (move.lengthSq() > 0) {
    move.normalize();
    player.pos.addScaledVector(move, speed * dt);
  }

  player.applyToCamera(camera);

  // Cheats (must run before enemy AI so aimbot has aimed)
  cheats.update(player, camera, enemies, weapon, dt);

  // Infinite ammo
  if (cheats.state.infiniteAmmo) weapon.ammo = weapon.magSize;

  // Enemies
  for (const e of enemies) {
    e.update(dt, player.pos, (dmg) => {
      if (cheats.state.godmode) return;
      player.takeDamage(dmg);
      hud.addKill(`💥 Took ${dmg} damage`);
    });
  }

  // HUD
  hud.update(player.health, weapon.ammo, weapon.reserve, player.alive);

  renderer.render(scene, camera);
}

loop();