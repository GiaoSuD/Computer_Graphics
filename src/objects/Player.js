import * as THREE from 'three';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/loaders/GLTFLoader';

// Trạng thái hoạt ảnh
const ANIMATION_STATES = {
  IDLE: 'idle',
  WALKING: 'walking',
  RUNNING: 'running', 
  JUMPING: 'jumping',
  CROUCHING: 'crouching',
  CROUCH_WALKING: 'crouch_walking',
  WALKING_BACKWARD: 'walking_backward'
};

export class PlayerAnimator {
  constructor(mixer, animations) {
    this.mixer = mixer;
    this.actions = {};
    this.currentAction = null;
    this.currentState = ANIMATION_STATES.IDLE;
    
    // Map animations dựa trên tên
    this.setupAnimations(animations);
    
    // Bắt đầu với Idle
    this.playAnimation(ANIMATION_STATES.IDLE);
  }

  setupAnimations(animations) {
    animations.forEach((clip) => {
      // Chỉ map các animation thuộc armature chính
      if (!clip.name.startsWith('Armature|Armature')) return;
      const action = this.mixer.clipAction(clip);      // Map tên hoạt ảnh đến trạng thái
      //action.timeScale = 20;
      if (clip.name.includes('Armature.001')) {
        this.actions[ANIMATION_STATES.CROUCH_WALKING] = action;
      } else if (clip.name.includes('Armature.002')) {
        this.actions[ANIMATION_STATES.RUNNING] = action;
      } else if (clip.name.includes('Armature.003')) {
        this.actions[ANIMATION_STATES.JUMPING] = action;
      } else if (clip.name.includes('Armature.004')) {
        this.actions[ANIMATION_STATES.CROUCHING] = action;
      } else if (clip.name.includes('Armature.006')) {
        this.actions[ANIMATION_STATES.WALKING] = action;
      } else if (clip.name.includes('Armature.007')) {
        this.actions[ANIMATION_STATES.WALKING_BACKWARD] = action;
      } else if (clip.name.includes('Armature|Armature|')) {
        this.actions[ANIMATION_STATES.IDLE] = action;
      }
    });  }

  playAnimation(stateName, crossfadeDuration = 0.2) {
    const newAction = this.actions[stateName];
    if (this.currentState === stateName) {
      return;
    }
    
    if (this.currentAction && this.currentAction !== newAction) {
      this.currentAction.fadeOut(crossfadeDuration);
    }
    newAction.reset();
    newAction.fadeIn(crossfadeDuration);
    newAction.play();
    this.currentAction = newAction;
    this.currentState = stateName;
    //console.log('Player: Switched animation to:', stateName);
  }
  
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }
  
  getCurrentState() {
    return this.currentState;
  }
  // Phương thức xử lý chuyển đổi hoạt ảnh dựa trên chuyển động
  updateMovementAnimation(isMoving, isRunning, isCrouching, isMovingBackward) {
    let newState = ANIMATION_STATES.IDLE;
    
    if (isCrouching) {
      if (isMoving) {
        // Crouch + Movement = Crouch Walking
        newState = ANIMATION_STATES.CROUCH_WALKING;
      } else {
        // Crouch + Stationary = Crouch Idle
        newState = ANIMATION_STATES.CROUCHING;
      }
    } else if (isMoving) {
      if (isMovingBackward) {
        newState = ANIMATION_STATES.WALKING_BACKWARD;
      } else if (isRunning) {
        newState = ANIMATION_STATES.RUNNING;
      } else {
        newState = ANIMATION_STATES.WALKING;
      }
    }
    
    if (newState !== this.currentState) {
      this.playAnimation(newState);
    }
  }  
}

//Sử dụng model đã xoá đầu cho FPV
export function loadPlayer(scene, onLoaded) {
  const loader = new GLTFLoader();
  loader.load('assets/headless_player.glb', (gltf) => {
    const player = gltf.scene;
    player.position.set(0, 2, 0);
    player.scale.set(0.3, 0.3, 0.3);     
    // Lưu trữ các nhóm mesh theo armature cho nhiều phần thân
    const meshGroups = new Map();
    const allArmatures = [];
    
    player.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const originalMaterial = child.material;
          
          // Luôn sử dụng MeshStandardMaterial cho tương thích ánh sáng tốt hơn
          child.material = new THREE.MeshStandardMaterial({
            color: originalMaterial.color || new THREE.Color(1, 1, 1),
            map: originalMaterial.map,
            normalMap: originalMaterial.normalMap,
            roughnessMap: originalMaterial.roughnessMap,
            metalnessMap: originalMaterial.metalnessMap,
            transparent: originalMaterial.transparent,
            opacity: originalMaterial.opacity || 1.0,
            side: originalMaterial.side || THREE.FrontSide,
            
            // Thuộc tính vật liệu chuẩn cho ánh sáng tốt hơn
            metalness: originalMaterial.metalness || 0.0,
            roughness: originalMaterial.roughness || 0.5,
            
            // Đảm bảo tính nhìn thấy tốt trong các điều kiện ánh sáng khác nhau
            emissive: new THREE.Color(0x111111), // Tự phát sáng nhẹ
            emissiveIntensity: 0.1
          });
          
          child.material.needsUpdate = true;
        }
        
        // Tìm armature mà mesh này thuộc về
        let armature = child.parent;
        while (armature && !armature.name.includes('Armature')) {
          armature = armature.parent;
        }
        
        if (armature) {
          if (!meshGroups.has(armature.name)) {
            meshGroups.set(armature.name, []);
            allArmatures.push(armature);
          }
          meshGroups.get(armature.name).push(child);
        }
      }
    });
    
    // Chọn armature chính cho hoạt ảnh
    let mainArmatureName = null;
    for (const [armatureName, meshes] of meshGroups.entries()) {
      if (!armatureName.match(/\d+$/)) {
        mainArmatureName = armatureName;
        break;
      }
    }
    
    if (!mainArmatureName && meshGroups.size > 0) {
      mainArmatureName = Array.from(meshGroups.keys())[0];
    }
    
    // Giữ tất cả các mesh nhìn thấy nhưng ẩn các armature trùng lặp
    // Do model gồm 8 nhân vật
    let totalVisibleMeshes = 0;
    for (const [armatureName, meshes] of meshGroups.entries()) {
      // Giữ tất cả các mesh nhìn thấy
      meshes.forEach(mesh => {
        mesh.visible = true;
        totalVisibleMeshes++;
      });
      
      // Ẩn các armature trùng lặp 
      if (armatureName !== mainArmatureName) {
        const armature = allArmatures.find(arm => arm.name === armatureName);
        if (armature) {
          armature.visible = false;
        }
      }
    }

    scene.add(player);
    
    // Thiết lập hoạt ảnh
    let mixer = null;
    let animator = null;
    
    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(player);
      animator = new PlayerAnimator(mixer, gltf.animations);  
    }
    
    if (onLoaded) onLoaded(player, mixer, animator);
  }, undefined, (error) => {
    console.error('Lỗi tải player:', error);
  });
}
export { ANIMATION_STATES };
