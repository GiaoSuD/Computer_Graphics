import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/loaders/GLTFLoader';

// Trạng thái hoạt ảnh cửa
const DOOR_STATES = {
  CLOSED: 'closed',
  OPENING: 'opening', 
  OPEN: 'open',
  CLOSING: 'closing'
};

export class DoorAnimator {
  constructor(mixer, animations, door) {
    this.mixer = mixer;
    this.door = door;
    this.actions = {};
    this.currentAction = null;
    this.currentState = DOOR_STATES.CLOSED;
    this.isLocked = false;
    
    // Thiết lập hoạt ảnh
    this.setupAnimations(animations);
  }
    setupAnimations(animations) {
    animations.forEach((clip) => {
      const action = this.mixer.clipAction(clip);
      // Model chỉ có 1 animation, dùng cho cả mở và đóng
      this.actions[DOOR_STATES.OPENING] = action;
      // Không có animation đóng
    });
  }
  
  playAnimation(stateName, loop = false) {
    const newAction = this.actions[stateName];
    if (this.currentAction && this.currentAction !== newAction) {
      this.currentAction.stop();
    }
    
    newAction.reset();
    newAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
    newAction.clampWhenFinished = true;
    newAction.play();
    
    this.currentAction = newAction;
    this.currentState = stateName;
    
    console.log('Door animation switched to:', stateName);
  }
    open() {
    if (this.isLocked || this.currentState === DOOR_STATES.OPEN || this.currentState === DOOR_STATES.OPENING) {
      return false;
    }
    this.playAnimation(DOOR_STATES.OPENING);
    this.currentState = DOOR_STATES.OPENING;
    const action = this.actions[DOOR_STATES.OPENING];
    const duration = action ? action.getClip().duration * 1000 : 1000;
    setTimeout(() => {
      if (this.currentState === DOOR_STATES.OPENING) {
        this.currentState = DOOR_STATES.OPEN;
        // Sau khi mở xong, tự động đóng sau 2 giây (2000ms)
        setTimeout(() => {
          if (this.currentState === DOOR_STATES.OPEN) {
            // Không phát lại animation đóng, chỉ chuyển trạng thái
            this.currentState = DOOR_STATES.CLOSED;
          }
        }, 2000);
      }
    }, duration);
    return true;
  }
  close() {
    // Không phát animation đóng, chỉ chuyển trạng thái
    if (this.currentState === DOOR_STATES.CLOSED || this.currentState === DOOR_STATES.CLOSING) {
      return false;
    }
    this.currentState = DOOR_STATES.CLOSING;
    setTimeout(() => {
      if (this.currentState === DOOR_STATES.CLOSING) {
        this.currentState = DOOR_STATES.CLOSED;
      }
    }, 500); // Đóng nhanh
    return true;
  }
  
  toggle() {
    if (this.currentState === DOOR_STATES.CLOSED) {
      return this.open();
    } else if (this.currentState === DOOR_STATES.OPEN) {
      return this.close();
    }
    return false;
  }
  
  lock() {
    this.isLocked = true;
    console.log('Door locked');
  }
  
  unlock() {
    this.isLocked = false;
    console.log('Door unlocked');
  }
  
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
  
  getCurrentState() {
    return this.currentState;
  }
  
  isOpen() {
    return this.currentState === DOOR_STATES.OPEN;
  }
  
  isClosed() {
    return this.currentState === DOOR_STATES.CLOSED;
  }
}

export function loadDoor(scene, position = { x: 0, y: 0, z: 0 }, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/newdoorr.glb', (gltf) => {
    const door = gltf.scene;
    door.position.set(position.x, position.y, position.z);
    door.scale.set(0.4, 0.4, 0.4); //kích thước cửa
    
    // Thiết lập vật liệu và bóng
    door.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Thiết lập vật liệu cửa
        if (child.material) {
          child.material.needsUpdate = true;
        }
      }
    });
    
    scene.add(door);
    
    // Thiết lập hoạt ảnh
    let mixer = null;
    let animator = null;
    
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(door);
      animator = new DoorAnimator(mixer, gltf.animations, door);
    }
    
    if (onLoaded) onLoaded(door, mixer, animator);
  }, undefined, (error) => {
    console.error('Door load error:', error);
  });
}
