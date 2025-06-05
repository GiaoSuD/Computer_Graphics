import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/loaders/GLTFLoader';

// Chỉ cần 2 trạng thái
const ENDING_DOOR_STATES = {
  CLOSED: 'closed',
  OPEN: 'open'
};

export class EndingDoorAnimator {
  constructor(mixer, animations, door) {
    this.mixer = mixer;
    this.door = door;
    this.actions = {};
    this.currentAction = null;
    this.currentState = ENDING_DOOR_STATES.CLOSED;
    this.animationDuration = 2.0;
    
    // Setup animations
    this.setupAnimations(animations);
  }
  
  setupAnimations(animations) {
    animations.forEach((clip) => {
      const action = this.mixer.clipAction(clip);
      action.setDuration(this.animationDuration);
      
      const clipName = clip.name.toLowerCase();
      
      // Chỉ cần animation mở cửa
      if (clipName.includes('door.001') && clipName.includes('open') || 
          (clipName.includes('open') && !clipName.includes('door.001'))) {
        this.actions[ENDING_DOOR_STATES.OPEN] = action;
      }
    });
  }
  
  playAnimation(stateName) {
    const newAction = this.actions[stateName];
    
    if (this.currentAction && this.currentAction !== newAction) {
      this.currentAction.stop();
    }
    
    newAction.reset();
    newAction.setLoop(THREE.LoopOnce);
    newAction.clampWhenFinished = true;
    newAction.play();
    
    this.currentAction = newAction;
    this.currentState = stateName;
  }
  
  open() {
    if (this.currentState === ENDING_DOOR_STATES.OPEN) {
      return false;
    }
    
    this.playAnimation(ENDING_DOOR_STATES.OPEN);
    this.currentState = ENDING_DOOR_STATES.OPEN;
    return true;
  }
  
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
  
  isOpen() {
    return this.currentState === ENDING_DOOR_STATES.OPEN;
  }
  
  isClosed() {
    return this.currentState === ENDING_DOOR_STATES.CLOSED;
  }
}

export function loadEndingDoor(scene, position = { x: 0, y: 0, z: 0 }, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/ending_door.glb', (gltf) => {
    const door = gltf.scene;
    door.position.set(position.x, position.y, position.z);
    door.scale.set(1, 1, 1);
    
    // Thiết lập vật liệu và bóng cho cửa
    door.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    scene.add(door);
    
    // Thiết lập hoạt ảnh
    let mixer = null;
    let animator = null;
    
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(door);
      animator = new EndingDoorAnimator(mixer, gltf.animations, door);
    }
    
    if (onLoaded) onLoaded(door, mixer, animator);
  }, undefined, (error) => {
    console.error('Ending door load error:', error);
  });
}

export { ENDING_DOOR_STATES };