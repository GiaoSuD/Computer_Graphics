import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/loaders/GLTFLoader';

// Hàm load glowstick đơn giản, không cần animation
export function loadGlowstick(scene, position = { x: 0, y: 1, z: 0 }, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/glowstick.glb', (gltf) => {
    const glowstick = gltf.scene;
    glowstick.position.set(position.x, position.y, position.z);
    glowstick.scale.set(0.0001, 0.0001, 0.0001);
    glowstick.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(glowstick);
    if (onLoaded) onLoaded(glowstick, null, null);
  }, undefined, (error) => {
    console.error('Glowstick load error:', error);
  });
}
