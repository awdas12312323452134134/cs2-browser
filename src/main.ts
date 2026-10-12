import * as THREE from 'three';
import './style.css';
import { Player } from './player';
import { Enemy } from './enemy';
import { Weapon } from './weapon';
import { CheatManager } from './cheats';
import { HUD } from './hud';
import { buildMap } from './map';

// ---- Scene ----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 40, 160);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.camera.far = 200;
scene.add(sun);

// Map
buildMap(scene);

// ---- Entities ----
const player = new Player();
const weapon = new Weapon();
const enemies: Enemy[] = [];

const SPAWN_INTERVAL = 4000; // ms
const MAX_ENEMIES = 12;
const SPAWN_RADIUS = 45;
let lastSpawn = 0;

function spawnEnemy() {
  if (enemies.filter(e => e.alive).length >= MAX_ENEMIES) return;
  const angle = Math.random() * Math.PI * 2;
  const r = SPAWN_RADIUS + Math.random() * 10;
  const x = Math.cos(angle) * r;
  const z = Math.sin(angle) * r;
  enemies.push(new Enemy(scene, x, z));
}

// Initial wave
for (let i = 0; i < 5; i++) spawnEnemy();

// ---- Cheats + HUD ----
const cheats = new CheatManager();
const hud = new HUD(cheats, (key) => cheats.toggle(key, enemies));

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
  if (cheats.state.aimbot) return;
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
let feedCheck = 0;

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.1);
  const now = performance.now();

  // Movement
  const speed = player.speed * (cheats.state.speedhack ? cheats.settings.speedhackMul : 1);
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

  // Cheats first (aimbot aims camera)
  cheats.update(player, camera, enemies, weapon, dt);

  // Infinite ammo
  if (cheats.state.infiniteAmmo) weapon.ammo = weapon.magSize;

  // Enemy AI + instakill override
  const instakill = cheats.state.instakill;
  for (const e of enemies) {
    e.update(dt, player.pos, (dmg) => {
      if (cheats.state.godmode) return;
      player.takeDamage(dmg);
      if (Math.random() < 0.3) hud.addKill(`💥 Took ${Math.round(dmg)} dmg`);
    });
  }

  // Respawn loop
  if (now - lastSpawn > SPAWN_INTERVAL) {
    lastSpawn = now;
    spawnEnemy();
  }

  // Track kills: if a live enemy dies, remove it and feed
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.alive) {
      // already logged via weapon.fire() callback above for hits
      e.dispose(scene);
      enemies.splice(i, 1);
    }
  }

  // HUD
  const alive = enemies.filter(e => e.alive).length;
  hud.update(player.health, weapon.ammo, weapon.reserve, player.alive, alive);

  renderer.render(scene, camera);
}

loop();