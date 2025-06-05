import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/loaders/GLTFLoader';

// Các trạng thái hoạt ảnh cho SCP-096
export const SCP096_ANIMATION_STATES = {
  IDLE1: 'idle1',
  IDLE2: 'idle2',
  CHARGE: 'charge',
  SCREAM: 'scream',
  RUN: 'run',
  WALK: 'walk',
  ATTACK1: 'attack1',
  ATTACK2: 'attack2'
};

export class SCP096Animator {
  constructor(mixer, animations) {
    this.mixer = mixer;
    this.actions = {};
    this.currentAction = null;
    this.currentState = SCP096_ANIMATION_STATES.IDLE1;
    this.setupAnimations(animations);
    this.playAnimation(SCP096_ANIMATION_STATES.IDLE1);
  }

  setupAnimations(animations) {
    animations.forEach((clip) => {
      const action = this.mixer.clipAction(clip);
      if (clip.name.includes('C.096_ACalm.F')) {
        this.actions[SCP096_ANIMATION_STATES.IDLE1] = action;
      } else if (clip.name.includes('C.096_AIdle.F')) {
        this.actions[SCP096_ANIMATION_STATES.IDLE2] = action;
      } else if (clip.name.includes('C.096_AChrge.F')) {
        this.actions[SCP096_ANIMATION_STATES.CHARGE] = action;
      } else if (clip.name.includes('C.096_Dstd.F')) {
        this.actions[SCP096_ANIMATION_STATES.SCREAM] = action;
      } else if (clip.name.includes('C.096_ARun.F - Forward')) {
        this.actions[SCP096_ANIMATION_STATES.RUN] = action;
      } else if (clip.name.includes('C.096_AWlk.F - Forward')) {
        this.actions[SCP096_ANIMATION_STATES.WALK] = action;
      } else if (clip.name.includes('C.096_Aswp1.F')) {
        this.actions[SCP096_ANIMATION_STATES.ATTACK1] = action;
      } else if (clip.name.includes('C.096_AGrpl.F')) {
        this.actions[SCP096_ANIMATION_STATES.ATTACK2] = action;
      }
    });
    console.log('SCP-096 available animations:', Object.keys(this.actions));
  }

  playAnimation(stateName, crossfadeDuration = 0.2) {
    const newAction = this.actions[stateName];
    if (!newAction) {
      console.warn(`SCP-096 animation '${stateName}' not found`);
      return;
    }
    if (this.currentState === stateName) return;
    if (this.currentAction && this.currentAction !== newAction) {
      this.currentAction.fadeOut(crossfadeDuration);
    }
    newAction.reset();
    newAction.fadeIn(crossfadeDuration);
    newAction.play();
    this.currentAction = newAction;
    this.currentState = stateName;
    console.log('SCP-096 switched animation to:', stateName);
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  getCurrentState() {
    return this.currentState;
  }
}

// Hàm load model SCP-096 và trả về animator, mixer, model
export function loadSCP096(scene, position = { x: 0, y: 0, z: 0 }, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/scp-096.glb', (gltf) => {
    const scp = gltf.scene;
    scp.position.set(position.x, position.y, position.z);
    scp.scale.set(0.4, 0.4, 0.4);
    scp.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(scp);
    let mixer = null;
    let animator = null;
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(scp);
      animator = new SCP096Animator(mixer, gltf.animations);
    }
    if (onLoaded) onLoaded(scp, mixer, animator);
  }, undefined, (error) => {
    console.error('SCP-096 load error:', error);
  });
}
