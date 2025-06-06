import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/loaders/GLTFLoader';

// Các trạng thái hoạt ảnh cho SCP-096
export const SCP096_ANIMATION_STATES = {
  IDLE1: 'idle1',
  IDLE2: 'idle2',
  WALK: 'walk',
  SCREAM: 'scream',
  RUN: 'run',
  ATTACK2: 'attack2'
};

export class SCP096Animator {
  constructor(mixer, animations) {
    this.mixer = mixer;
    this.actions = {};
    this.currentAction = null;
    this.currentState = SCP096_ANIMATION_STATES.IDLE1;
    this.isAnimationComplete = true;
    this.setupAnimations(animations);
    this.playAnimation(SCP096_ANIMATION_STATES.IDLE1);
  }

  setupAnimations(animations) {
    animations.forEach((clip) => {
      const action = this.mixer.clipAction(clip);
      if (clip.name === 'C.096_ACalm.F') {
        this.actions[SCP096_ANIMATION_STATES.IDLE1] = action;
      } else if (clip.name === 'C.096_AIdle.F') {
        this.actions[SCP096_ANIMATION_STATES.IDLE2] = action;
      } else if (clip.name === 'C.096_DWlk.F - Forward') {
        this.actions[SCP096_ANIMATION_STATES.WALK] = action;
      } else if (clip.name === 'C.096_Dstd.F') {
        this.actions[SCP096_ANIMATION_STATES.SCREAM] = action;
      } else if (clip.name === 'C.096_ARun.F - Forward') {
        this.actions[SCP096_ANIMATION_STATES.RUN] = action;
      } else if (clip.name === 'C.096_ASwp2.F') {
        this.actions[SCP096_ANIMATION_STATES.ATTACK2] = action;
      }
    });
  }

  playAnimation(state) {
    const action = this.actions[state];
    if (!action) {
        return;
    }
    if (this.currentAction === action) {
        return;
    }
    
    // Dừng animation hiện tại nếu có
    if (this.currentAction) {
        this.currentAction.fadeOut(0.2);
    }
    
    // Reset và phát animation mới
    action.reset();
    action.setEffectiveTimeScale(1);
    action.setEffectiveWeight(1);
    action.fadeIn(0.2);
    action.play();
    
    // Chỉ lặp lại cho các animation không phải idle và scream
    if (state !== SCP096_ANIMATION_STATES.IDLE1 && 
        state !== SCP096_ANIMATION_STATES.IDLE2 && 
        state !== SCP096_ANIMATION_STATES.SCREAM) {
        action.setLoop(THREE.LoopRepeat);
        this.isAnimationComplete = true; // Luôn true cho run, walk, attack
    } else {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        this.isAnimationComplete = false;
    }
    
    this.currentAction = action;
    this.currentState = state;
    //console.log('SCP-096: Switched animation to:', state);
  }

  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
      
      // Chỉ kiểm tra completion cho idle và scream
      if (this.currentAction && !this.isAnimationComplete && 
          (this.currentState === SCP096_ANIMATION_STATES.IDLE1 || 
           this.currentState === SCP096_ANIMATION_STATES.IDLE2 || 
           this.currentState === SCP096_ANIMATION_STATES.SCREAM)) {
        
        // Kiểm tra xem animation đã hoàn thành chưa
        if (this.currentAction.time >= this.currentAction.getClip().duration) {
          this.isAnimationComplete = true;
        }
      }
    }
  }

  isCurrentAnimationComplete() {
    return this.isAnimationComplete;
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
