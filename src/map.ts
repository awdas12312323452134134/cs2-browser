import * as THREE from 'three';

export function buildMap(scene: THREE.Scene) {
  // Bigger ground (400x400)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ color: 0x2a2a3a })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grid helper for orientation
  const grid = new THREE.GridHelper(400, 40, 0x444466, 0x222233);
  grid.position.y = 0.01;
  scene.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x555577 });
  const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b6b3f });

  // Wall layout: [x, z, width, depth, rotationY, height]
  const walls: [number, number, number, number, number, number][] = [
    // Outer arena bounds (partial, so it feels open)
    [60, 0, 1, 120, 0, 6],
    [-60, 0, 1, 120, 0, 6],
    [0, 60, 120, 1, 0, 6],
    [0, -60, 120, 1, 0, 6],

    // Interior cover structures
    [20, 20, 12, 1, 0, 4],
    [20, 20, 1, 12, 0, 4],
    [-20, -20, 12, 1, 0, 4],
    [-20, -20, 1, 12, 0, 4],
    [30, -15, 1, 15, 0, 5],
    [-30, 15, 1, 15, 0, 5],
    [0, 0, 8, 8, 0, 3],

    // Long sightlines
    [40, 40, 20, 1, Math.PI / 4, 3],
    [-40, -40, 20, 1, Math.PI / 4, 3],

    // Small bunkers
    [15, -35, 5, 5, 0, 4],
    [-15, 35, 5, 5, 0, 4],
    [45, 0, 5, 5, 0, 4],
    [-45, 0, 5, 5, 0, 4],
  ];

  for (const [x, z, w, d, ry, h] of walls) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h / 2, z);
    wall.rotation.y = ry;
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);
  }

  // Scattered crates for cover
  const cratePositions: [number, number][] = [
    [10, 10], [10, -10], [-10, 10], [-10, -10],
    [25, 5], [-25, -5], [35, 25], [-35, -25],
    [5, 35], [-5, -35], [50, 20], [-50, -20],
    [0, 25], [0, -25], [25, 40], [-25, -40],
  ];
  for (const [x, z] of cratePositions) {
    const h = 1.5 + Math.random() * 0.5;
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(2, h, 2),
      crateMat
    );
    crate.position.set(x, h / 2, z);
    crate.rotation.y = Math.random() * Math.PI;
    crate.castShadow = true;
    crate.receiveShadow = true;
    scene.add(crate);
  }

  // Some pillars
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x777799 });
  const pillars: [number, number][] = [
    [30, 30], [-30, 30], [30, -30], [-30, -30],
    [50, 50], [-50, -50],
  ];
  for (const [x, z] of pillars) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 12), pillarMat);
    pillar.position.set(x, 4, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
  }

  return { ground };
}