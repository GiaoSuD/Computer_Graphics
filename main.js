import GUI from "https://cdn.skypack.dev/lil-gui@0.18.0";
import * as THREE from 'https://unpkg.com/three@0.149.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.149.0/examples/jsm/loaders/GLTFLoader.js';

import { PointerLockControls } from "./PointerLockControls.js";
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.149.0/examples/jsm/postprocessing/ShaderPass';
import { RGBShiftShader } from './shader/RGBShiftShader.js';
import { FilmShader } from './shader/FilmShader.js';
import { StaticShader } from './shader/StaticShader.js';
import { BadTVShader } from './shader/BadTVShader.js';
import Stats from 'https://cdn.skypack.dev/stats.js';
import { VignetteShader } from './shader/VignetteShader.js';
import { UnrealBloomPass } from './shader/UnrealBloomPass.js';

// Import player system
import { loadPlayer, PlayerAnimator, ANIMATION_STATES } from './src/objects/Player.js';

// Import fixed map layout
import { FIXED_MAP_LAYOUT, getCellValue, MAP_WIDTH, MAP_HEIGHT } from './utils/FixedMapLayout.js';

// Import door system
import { loadDoor, DoorAnimator } from './src/objects/Door.js';

// Import glowstick system
import { loadGlowstick } from './src/objects/Glowstick.js';

// Import ending door system
import { loadEndingDoor } from './src/objects/EndingDoor.js';

//Sử dụng map cố định
var mazeWidth = MAP_WIDTH;
var mazeHeight = MAP_HEIGHT;

var notStarted = true;

var flashlightEnabled = false;
var flashlight;

var fpsCapped = true;

var paused = true;

var dynamicLightsPopup = false;

var secretEnabled = false;

let timeout;
let currentMessage = "";
const popup = document.getElementById("popup");

// Biến hệ thống nhân vật
let mixer;
let playerModel;
let playerAnimator;
let isMoving = false;
let isRunning = false;
let isCrouching = false;
let isMovingBackward = false;
let lastTime = performance.now();
let clock = new THREE.Clock();
let maxFPS = 100;
let halfMazeWidth = mazeWidth / 2;
let halfMazeHeight = mazeHeight / 2;
let shaderTime = 0;
let performanceOverride = false;
let ambientLight = new THREE.AmbientLight(0xe8e4ca, 0.1);
let offsetX = 0;
let offsetZ = 0;
let tolerance = 0;
let lightsEnabled = true;
let shadersToggled = true;
let spectatorMode = false;

var messageQueue = [];
var isShowingMessage = false;

// Thêm hệ thống đếm glowstick
let glowstickCount = 0;
const glowstickTotal = 4;
const glowstickCounter = document.createElement('div');
glowstickCounter.id = 'glowstickCounter';
glowstickCounter.style.position = 'fixed';
glowstickCounter.style.top = '16px';
glowstickCounter.style.left = '50%';
glowstickCounter.style.transform = 'translateX(-50%)';
glowstickCounter.style.fontSize = '1.5rem';
glowstickCounter.style.color = '#00ff00';
glowstickCounter.style.fontWeight = 'bold';
glowstickCounter.style.textShadow = '0 0 8px #000';
glowstickCounter.style.fontFamily = '"VCR OSD Mono", monospace';
glowstickCounter.style.letterSpacing = '2px';
glowstickCounter.style.textTransform = 'uppercase';
glowstickCounter.innerText = `Glowsticks: 0/${glowstickTotal}`;
document.body.appendChild(glowstickCounter);
function updateGlowstickCounter() {
  glowstickCounter.innerText = `Glowsticks: ${glowstickCount}/${glowstickTotal}`;
}

// Tạo scene, camera và renderer
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, mazeHeight + 1);
var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "default" });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.setPixelRatio(window.devicePixelRatio * 0.5);

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const textureLoader = new THREE.TextureLoader();

const canvas = document.querySelector('.webgl')

// Tạo render target cho mỗi composer
const renderTarget1 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

// Tạo EffectComposers
const composer = new EffectComposer(renderer, renderTarget1);

// Tạo render passes cho mỗi composer
const renderPass1 = new RenderPass(scene, camera);

const filmPass = new ShaderPass(FilmShader);
filmPass.renderToScreen = true;

filmPass.uniforms.grayscale.value = 0;
filmPass.uniforms.nIntensity.value = 0.1;
filmPass.uniforms.sIntensity.value = 0.8;
filmPass.uniforms.sCount.value = 375;

const staticPass = new ShaderPass(StaticShader);

staticPass.uniforms.amount.value = 0.04;
staticPass.uniforms.size.value = 4.0;

const RGBShiftShaderPass = new ShaderPass(RGBShiftShader);
RGBShiftShaderPass.renderToScreen = true;

RGBShiftShaderPass.uniforms.amount.value = 0.001;
RGBShiftShaderPass.uniforms.angle.value = 0.0;

const BadTVShaderPass = new ShaderPass(BadTVShader);
BadTVShaderPass.renderToScreen = true;

BadTVShaderPass.uniforms.distortion.value = 0.15;
BadTVShaderPass.uniforms.distortion2.value = 0.3;
BadTVShaderPass.uniforms.speed.value = 0.005;
BadTVShaderPass.uniforms.rollSpeed.value = 0;

const vignettePass = new ShaderPass(VignetteShader);
vignettePass.renderToScreen = true;

vignettePass.uniforms.offset.value = 0.81;
vignettePass.uniforms.darkness.value = 1.0;

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.renderToScreen = false;

bloomPass.threshold = 1;
bloomPass.strength = 0;
bloomPass.radius = 0.9;

// Thêm render passes vào các composer tương ứng
composer.addPass(renderPass1);
composer.addPass(staticPass);
composer.addPass(RGBShiftShaderPass);
composer.addPass(filmPass);
composer.addPass(BadTVShaderPass);
composer.addPass(vignettePass);
composer.addPass(bloomPass);

// Tạo GUI
// Thêm GUI controls. Thay thế controls bằng settings
const gui = new GUI();
const graphicSettings = gui.addFolder("Graphics Settings");
const gameplaySettings = gui.addFolder("Gameplay Settings");
const shaderSettings = gui.addFolder("Shader Settings");
const staticSettings = shaderSettings.addFolder("Static Settings");
const rgbSettings = shaderSettings.addFolder("RGB Shift Settings");
const filmSettings = shaderSettings.addFolder("Scanline Settings");
const vignetteSettings = shaderSettings.addFolder("Vignette Settings");
const bloomSettings = shaderSettings.addFolder("Bloom Settings");
const guicontrols = {
    enabled: true,
    pixelratio: 50,
    movementspeed: 1,
    dynamiclights: false,
    fpscapped: true
};
const staticControls = {
    enabled: true,
    amount: 0.04,
    size: 4.0
};
const rgbControls = {
    enabled: true,
    amount: 0.001,
    angle: 0.0
};
const filmControls = {
    enabled: true,
    grayscale: false,
    nIntensity: 0.1,
    sIntensity: 0.8,
    sCount: 375
};
const vignetteControls = {
    enabled: true,
    offset: 0.81,
    darkness: 1.0
};
const bloomControls = {
    enabled: false,
    threshold: 1,
    strength: 0,
    radius: 0.9
};

// Đặt khai báo playerSettings lên trước khi add control vào GUI
const playerSettings = { baseSpeed: 0.01 };

// Thêm control cho rotationSpeed
graphicSettings.add(guicontrols, "pixelratio", 20, 100, 5).onChange((value) => {
    renderer.setPixelRatio(window.devicePixelRatio * (value / 100));
}).name("Pixel Ratio (%)").listen();

// Thêm control cho Movement Speed
gameplaySettings.add(playerSettings, "baseSpeed", 0.005, 0.05, 0.001).onChange((value) => {
    playerSettings.baseSpeed = value;
}).name("Movement Speed").listen();

// Thêm control cho dynamicLights
graphicSettings.add(guicontrols, "dynamiclights").onChange((value) => {
    lightsEnabled = value;
    if (value) {
        createLightSources(offsetX, offsetZ);
        ceilingMaterial.color.setHex(0x333333);
        ambientLight.intensity = 0.1;
        // Show glowstick lights
        glowstickLights.forEach(light => {
            if(light) light.visible = true;
        });
    } else {
        deleteLights();
        ceilingMaterial.color.setHex(0x777777);
        ambientLight.intensity = 0.7;
        // Hide glowstick lights
        glowstickLights.forEach(light => {
            if(light) light.visible = false;
        });
    }
}).name("Dynamic Lights").listen();

staticSettings.add(staticControls, "enabled").onChange((value) => {
    staticPass.enabled = value;
    if (value) {
        staticPass.renderToScreen = true;
    } else {
        staticPass.renderToScreen = false;
    }
}).name("Enabled").listen();

staticSettings.add(staticControls, "amount", 0, 1, 0.01).onChange((value) => {
    staticPass.uniforms.amount.value = value;
}).name("Amount").listen();

staticSettings.add(staticControls, "size", 0, 10, 0.1).onChange((value) => {
    staticPass.uniforms.size.value = value;
}).name("Size").listen();

// Thêm control cho rgb shift
rgbSettings.add(rgbControls, "enabled").onChange((value) => {
    RGBShiftShaderPass.enabled = value;
    if (value) {
        RGBShiftShaderPass.renderToScreen = true;
    } else {
        RGBShiftShaderPass.renderToScreen = false;
    }
}).name("Enabled").listen();
rgbSettings.add(rgbControls, "amount", 0, 1, 0.001).onChange((value) => {
    RGBShiftShaderPass.uniforms.amount.value = value;
}).name("Amount").listen();
rgbSettings.add(rgbControls, "angle", 0, 1, 0.001).onChange((value) => {
    RGBShiftShaderPass.uniforms.angle.value = value;
}).name("Angle").listen();

// Thêm control cho film
filmSettings.add(filmControls, "enabled").onChange((value) => {
    filmPass.enabled = value;
    if (value) {
        filmPass.renderToScreen = true;
    } else {
        filmPass.renderToScreen = false;
    }
}).name("Enabled").listen();

filmSettings.add(filmControls, "grayscale").onChange((value) => {
    filmPass.uniforms.grayscale.value = value;
}).name("Grayscale").listen();

filmSettings.add(filmControls, "nIntensity", 0, 1, 0.001).onChange((value) => {
    filmPass.uniforms.nIntensity.value = value;
}).name("Noise Intensity").listen();

filmSettings.add(filmControls, "sIntensity", 0, 1, 0.001).onChange((value) => {
    filmPass.uniforms.sIntensity.value = value;
}).name("Scanline Intensity").listen();

filmSettings.add(filmControls, "sCount", 0, 1500, 1).onChange((value) => {
    filmPass.uniforms.sCount.value = value;
}).name("Scanline Count").listen();

// Thêm control cho vignette
vignetteSettings.add(vignetteControls, "enabled").onChange((value) => {
    vignettePass.enabled = value;
    if (value) {
        vignettePass.renderToScreen = true;
    } else {
        vignettePass.renderToScreen = false;
    }
}).name("Enabled").listen();

vignetteSettings.add(vignetteControls, "offset", 0, 1, 0.001).onChange((value) => {
    vignettePass.uniforms.offset.value = value;
}).name("Offset").listen();

vignetteSettings.add(vignetteControls, "darkness", 0, 1, 0.001).onChange((value) => {
    vignettePass.uniforms.darkness.value = value;
}).name("Darkness").listen();

// Thêm control cho bloom
bloomSettings.add(bloomControls, "enabled").onChange((value) => {
    bloomPass.enabled = value;
    if (value) {
        bloomPass.renderToScreen = true;
    } else {
        bloomPass.renderToScreen = false;
    }
}).name("Enabled").listen();

bloomSettings.add(bloomControls, "threshold", 0, 1, 0.001).onChange((value) => {
    bloomPass.threshold = value;
}).name("Threshold").listen();

bloomSettings.add(bloomControls, "strength", 0, 1, 0.001).onChange((value) => {
    bloomPass.strength = value;
}).name("Strength").listen();

bloomSettings.add(bloomControls, "radius", 0, 1, 0.001).onChange((value) => {
    bloomPass.radius = value;
}).name("Radius").listen();

// toggle all shaders
shaderSettings.add({ toggleAll: function () {
    toggleShaders();
} }, "toggleAll").name("Toggle All Shaders");

function toggleShaders(){
    if (shadersToggled) {
        staticPass.enabled = false;
        RGBShiftShaderPass.enabled = false;
        filmPass.enabled = false;
        BadTVShaderPass.enabled = false;
        vignettePass.enabled = false;
        bloomPass.enabled = false;
        shadersToggled = false;
    } else {
        staticPass.enabled = true;
        RGBShiftShaderPass.enabled = true;
        filmPass.enabled = true;
        BadTVShaderPass.enabled = true;
        vignettePass.enabled = true;
        shadersToggled = true;
    }
    if (staticPass.enabled) {
        staticPass.renderToScreen = true;
    } else {
        staticPass.renderToScreen = false;
    }
    if (RGBShiftShaderPass.enabled) {
        RGBShiftShaderPass.renderToScreen = true;
    } else {
        RGBShiftShaderPass.renderToScreen = false;
    }
    if (filmPass.enabled) {
        filmPass.renderToScreen = true;
    } else {
        filmPass.renderToScreen = false;
    }
    if (BadTVShaderPass.enabled) {
        BadTVShaderPass.renderToScreen = true;
    } else {
        BadTVShaderPass.renderToScreen = false;
    }
    if (vignettePass.enabled) {
        vignettePass.renderToScreen = true;
    } else {
        vignettePass.renderToScreen = false;
    }
    bloomPass.renderToScreen = false;
    // cũng set tất cả các cài đặt
    staticControls.enabled = staticPass.enabled;
    rgbControls.enabled = RGBShiftShaderPass.enabled;
    filmControls.enabled = filmPass.enabled;
    vignetteControls.enabled = vignettePass.enabled;
    bloomControls.enabled = bloomPass.enabled;
}

shaderSettings.close();
gameplaySettings.close();
//Kết thúc phần tạo GUI


// Tạo ánh sáng và thêm nó vào scene ở trên cùng và thêm bóng tối cho renderer
const light = new THREE.DirectionalLight(0x222222, 0.9);
light.position.set(0, 10, 0);
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = mazeHeight + 1;
light.shadow.bias = 0.002;
scene.add(light);

// pointer lock controls
const controls = new PointerLockControls(camera, canvas)
scene.add(controls.getObject()); 
const startButton = document.getElementById('startButton')
const menuPanel = document.getElementById('menuPanel')
startButton.addEventListener(
    'click',
    function () {
        controls.lock()
        // ẩn #startButton và #menuPanel
        startButton.style.display = 'none'
        menuPanel.style.display = 'none'
        if (notStarted){
            startButton.innerHTML = "Click to Resume"
            setTimeout(function () {
                popupMessage("Press \"F\" to toggle the flashlight.")
            }, 3000);
            setTimeout(function () {
                popupMessage("Press \"1\" to toggle all shader effects.")
            }, 15000);
            setTimeout(function () {
                if (dynamicLightsPopup)
                    return;
                popupMessage("Press \"2\" or \"G\" to toggle dynamic lights.")
            }, 22500);
            setTimeout(function () {
                popupMessage("Đồ án The Backrooms - CS105")
            }, 30000);
            setTimeout(function () {
                popupMessage("Press \"X\" to toggle spectator mode.")
            }, 45000);     
            keyState.KeyW = false;
            controls.getObject().position.x = spawnPos.x;
            controls.getObject().position.y = 0.5;
            controls.getObject().position.z = spawnPos.z;
            createFlashlight();
            notStarted = false;
        }
        paused = false;
    },
    false
)

controls.addEventListener('lock', function () {
    startButton.style.display = 'none'
    menuPanel.style.display = 'none'
    paused = false;
})

controls.addEventListener('unlock', function () {
    startButton.style.display = 'block'
    menuPanel.style.display = 'block'
    paused = true;
    menuPanel.style.backdropFilter = "blur(0px)";
    document.getElementById('title').style.display = 'none'
    Object.keys(keyState).forEach(function (key) {
        keyState[key] = false;
    });
})

document.addEventListener(
    'keydown',
    function (e) {
        if (e.code === 'KeyF') {
            if (!paused){
                if (flashlightEnabled) {
                    deleteFlashlight();
                    flashlightEnabled = false;
                } else {
                    flashlightEnabled = true;
                    createFlashlight();
                }
            }
        }
        if (e.code == 'Digit1') {
            toggleShaders();
        }
        if (e.code === 'Digit2' || e.code === 'KeyG') {
            if (lightsEnabled) {
                lightsEnabled = false;
                guicontrols.dynamiclights = false;
                deleteLights();
                ceilingMaterial.color.setHex(0x777777);
                ambientLight.intensity = 0.7;
            } else {
                lightsEnabled = true;
                guicontrols.dynamiclights = true;
                createLightSources(offsetX, offsetZ);
                ceilingMaterial.color.setHex(0x333333);
                ambientLight.intensity = 0.1;
            }
        }
        if (e.code == "KeyX") {
            spectatorMode = !spectatorMode;
            if (spectatorMode) {
                popupMessage("Spectator đã kích hoạt! Sử dụng WASD để di chuyển.");
            } else {
                popupMessage("Spectator đã tắt! Trở lại chế độ chơi bình thường.");
            }
        }
        if (e.code === 'Escape') {
            // show #startButton and #menuPanel
            startButton.style.display = 'block'
            menuPanel.style.display = 'block'
            paused = true;
        }
    },
    false
)

flashlight = new THREE.SpotLight(0xffffff, 0, 0, Math.PI / 6, 0.5, 2.5);
flashlight.castShadow = true;
flashlight.shadow.mapSize.width = 1024;
flashlight.shadow.mapSize.height = 1024;
flashlight.shadow.camera.near = 0.5;
flashlight.shadow.camera.far = mazeHeight + 1;
flashlight.identifier = "flashlight";
scene.add(flashlight);
flashlight.intensity = 0;

function createFlashlight(){
    flashlight.intensity = 0.8;
}

function deleteFlashlight(){
    flashlight.intensity = 0;
}


// Nếu mất focus của canvas, giải phóng pointer lock controls và hiển thị #startButton và #menuPanel. lắng nghe blur
window.addEventListener(
    'blur',
    function () {
        controls.unlock()
        paused = true;
        // show #startButton and #menuPanel
        startButton.style.display = 'block'
        menuPanel.style.display = 'block'
    },
    false
)

// Khi cửa sổ được thay đổi kích thước, thay đổi kích thước canvas
window.addEventListener('resize', function () {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Đặt vị trí sinh lại của người chơi từ bố cục cố định
function findSpawnFromMap() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (FIXED_MAP_LAYOUT[y][x] === 8) {
                FIXED_MAP_LAYOUT[y][x] = 0;
                return { x: x - MAP_WIDTH / 2, z: y - MAP_HEIGHT / 2 };
            }
        }
    }
    // fallback: nếu không có số 8, spawn ở (0,0)
    return { x: 6, z: 7 };
}
const spawnPos = findSpawnFromMap();
controls.getObject().position.x = spawnPos.x;
controls.getObject().position.y = 0.5;
controls.getObject().position.z = spawnPos.z;

// vận tốc cho người chơi
const velocity = new THREE.Vector3();
const damping = 0.9;

// Trạng thái phím để theo dõi xem phím có được nhấn hay không
const keyState = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    KeyQ: false,
    KeyE: false,
    KeyC: false,      // Phím Crouch
    KeyF: false,      // Phím Flashlight
    ShiftLeft: false, // Phím Run
};

document.addEventListener('keydown', function (event) {
    if (!paused) {
        keyState[event.code] = true;
    }
});

var visitedOffsets = [[0,0]];
document.addEventListener('keyup', function (event) {
    if (!paused) {
        keyState[event.code] = false;
    }
});

//FPS counter
const stats = new Stats();
document.body.appendChild(stats.dom);

const wallTexture = textureLoader.load('./public/wallpaper.png', function (texture) {
    // Bật mipmapping cho texture
    texture.generateMipmaps = true;
    texture.minFilter = THREE.NearestMipmapNearestFilter ;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // Thêm offset ngẫu nhiên cho tọa độ texture
    texture.offset.set(Math.random(), Math.random());
    texture.repeat.set(1, 1);
});
const baseboardTexture = textureLoader.load('./public/baseboard.jpg', function (texture) {
    // Bật mipmapping cho texture
    texture.generateMipmaps = true;
    texture.minFilter = THREE.NearestMipmapNearestFilter ;
    // tăng hiệu suất
    texture.anisotropy = 16;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    texture.repeat.set(20, 20);
});

// FLOOR
const floorTexture = textureLoader.load('./public/floor.png', function (texture) {
    // Bật mipmapping cho texture
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // Thêm offset ngẫu nhiên cho tọa độ texture
    texture.repeat.set(40, 40);
});

// CEILING
const ceilingTexture = textureLoader.load('./public/ceiling_tile.jpg', function (texture) {
    // Bật mipmapping cho texture
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(40, 40);
});
const ceilingHeightTexture = textureLoader.load('./public/ceiling_tile_heightmap.png', function (texture) {
    // Bật mipmapping cho texture
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(60, 40);
});

// Xây dựng bố cục cố định sử dụng bố cục từ FixedMapLayout.js
function buildFixedLayout() {
    buildWalls();
    buildFloor();
    buildCeiling();
    buildColumns();
    buildDoors();
    buildExitDoor();
    createLights();
    if (lightsEnabled) {
        createLightSources();
    }
}

// Xây dựng tường dựa trên bố cục cố định
function buildWalls() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const cellValue = getCellValue(x, y);
            
            if (cellValue === 1) { // Wall
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                
                // Chuyển tọa độ bản đồ sang tọa độ thế giới
                wall.position.x = x - MAP_WIDTH / 2;
                wall.position.y = wallSize / 2;
                wall.position.z = y - MAP_HEIGHT / 2;
                
                wall.castShadow = true;
                wall.receiveShadow = true;
                wall.userData.isMapObject = true;
                wall.userData.cellType = 'wall';
                wall.identifier = "0,0,wall"; // Keep for compatibility
                
                const baseboard = new THREE.Mesh(baseboardGeometry, baseboardMaterial);
                baseboard.position.x = 0;
                baseboard.position.y = -0.48;
                baseboard.position.z = 0;
                baseboard.castShadow = true;
                baseboard.receiveShadow = true;
                wall.add(baseboard);
                
                scene.add(wall);
            }        
        }
    }
}

// Xây dựng sàn dựa trên bố cục cố định
function buildFloor() {
    const tileCount = 10;
    const tileWidth = MAP_WIDTH / tileCount;
    const tileHeight = MAP_HEIGHT / tileCount;
    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            const floorGeometry = new THREE.PlaneGeometry(tileWidth, tileHeight);
            const floor = new THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotateX(-Math.PI / 2);
            floor.position.x = -MAP_WIDTH/2 + tileWidth/2 + i * tileWidth;
            floor.position.z = -MAP_HEIGHT/2 + tileHeight/2 + j * tileHeight;
            floor.position.y = -0.01;
            floor.receiveShadow = true;
            floor.userData.isMapObject = true;
            floor.userData.cellType = 'floor';
            floor.identifier = `floor_${i}_${j}`;
            scene.add(floor);
        }
    }
}

// Xây dựng trần dựa trên bố cục cố định
function buildCeiling() {
    const ceilingGeometry = new THREE.PlaneGeometry(MAP_WIDTH, MAP_HEIGHT);
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotateX(Math.PI / 2);
    ceiling.position.y = 1;
    ceiling.receiveShadow = true;
    ceiling.userData.isMapObject = true;
    ceiling.userData.cellType = 'ceiling';
    ceiling.identifier = "0,0,ceiling"; // Keep for compatibility
    scene.add(ceiling);
}

// Xây dựng cột dựa trên bố cục cố định
function buildColumns() {
    const columnGeometry = new THREE.BoxGeometry(wallSize * 0.8, wallSize, wallSize * 0.8);
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const cellValue = getCellValue(x, y);
            if (cellValue === 3) { //Vị trí cột trong fixed map
                const column = new THREE.Mesh(columnGeometry, wallMaterial);
                column.position.x = x - MAP_WIDTH / 2;
                column.position.y = wallSize / 2;
                column.position.z = y - MAP_HEIGHT / 2;
                column.castShadow = true;
                column.receiveShadow = true;
                column.userData.isMapObject = true;
                column.userData.cellType = 'column';
                column.identifier = "0,0,column"; // Keep for compatibility
                scene.add(column);
            }
        }
    }
}

// Xây dựng cửa dựa trên bố cục cố định
function buildDoors() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const cellValue = getCellValue(x, y);
            if (cellValue === 2 || cellValue === 22) {
                // Xác định vị trí cửa
                const pos = {
                    x: x - MAP_WIDTH / 2,
                    y: 0,
                    z: y - MAP_HEIGHT / 2
                };
                // Xác định hướng xoay
                const rotationY = (cellValue === 22) ? Math.PI / 2 : 0;
                loadDoor(scene, pos, (door, mixer, animator) => {
                    door.rotation.y = rotationY;
                    door.userData.isMapObject = true;
                    door.userData.cellType = 'door';
                    door.userData.animator = animator;
                    door.userData.mixer = mixer;
                    door.identifier = "0,0,door";
                    if (!window.doorAnimators) window.doorAnimators = [];
                    if (animator) window.doorAnimators.push(animator);
                    // Thêm tường phụ hai bên cửa
                    let dx = 0.7, dz = 0;
                    let sideWallGeometry, baseboardGeometrySide;
                    if (cellValue === 2) {
                        sideWallGeometry = new THREE.BoxGeometry(wallSize, wallSize, 0.01);
                        baseboardGeometrySide = new THREE.BoxGeometry(wallSize * 1.01, 0.065, 0.02);
                    } else {
                        dx = 0; dz = 0.7;
                        sideWallGeometry = new THREE.BoxGeometry(0.01, wallSize, wallSize);
                        baseboardGeometrySide = new THREE.BoxGeometry(0.02, 0.065, wallSize * 1.01);
                    }

                    // Side wall 1
                    const sideWall1 = new THREE.Mesh(sideWallGeometry, wallMaterial);
                    sideWall1.position.x = pos.x - dx;
                    sideWall1.position.y = 0.5;
                    sideWall1.position.z = pos.z - dz;
                    sideWall1.castShadow = true;
                    sideWall1.receiveShadow = true;
                    sideWall1.userData.isMapObject = true;
                    sideWall1.userData.cellType = 'wall';
                    sideWall1.identifier = "0,0,sideWall1";

                    // Baseboard cho sideWall1
                    const baseboard1 = new THREE.Mesh(baseboardGeometrySide, baseboardMaterial);
                    baseboard1.position.set(0, -0.48, 0);
                    baseboard1.castShadow = true;
                    baseboard1.receiveShadow = true;
                    sideWall1.add(baseboard1);
                    scene.add(sideWall1);

                    // Side wall 2
                    const sideWall2 = new THREE.Mesh(sideWallGeometry, wallMaterial);
                    sideWall2.position.x = pos.x + dx;
                    sideWall2.position.y = 0.5;
                    sideWall2.position.z = pos.z + dz;
                    sideWall2.castShadow = true;
                    sideWall2.receiveShadow = true;
                    sideWall2.userData.isMapObject = true;
                    sideWall2.userData.cellType = 'wall';
                    sideWall2.identifier = "0,0,sideWall2";

                    // Baseboard cho sideWall2
                    const baseboard2 = new THREE.Mesh(baseboardGeometrySide, baseboardMaterial);
                    baseboard2.position.set(0, -0.48, 0);
                    baseboard2.castShadow = true;
                    baseboard2.receiveShadow = true;
                    sideWall2.add(baseboard2);
                    scene.add(sideWall2);
                });
            }
        }
    }
}

// Xây dựng cửa ra dựa trên bố cục cố định
function buildExitDoor() {
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const cellValue = getCellValue(x, y);
            if (cellValue === 9) { // Exit door
                const pos = {
                    x: x - MAP_WIDTH / 2,
                    y: 0,
                    z: y - MAP_HEIGHT / 2
                };
                
                loadEndingDoor(scene, pos, (door, mixer, animator) => {
                    door.userData.isMapObject = true;
                    door.userData.cellType = 'exitDoor';
                    door.userData.animator = animator;
                    door.userData.mixer = mixer;
                    door.identifier = "0,0,exitDoor";
                    if (!window.endingDoorAnimators) window.endingDoorAnimators = [];
                    if (animator) window.endingDoorAnimators.push(animator);
                });
            }
        }
    }
}

var wallSize = 1;

const wallGeometry = new THREE.BoxGeometry(wallSize+0.000001, wallSize, wallSize+0.000001);
const wallMaterial = new THREE.MeshPhongMaterial({ map: wallTexture });
const baseboardGeometry = new THREE.BoxGeometry(wallSize + 0.01, 0.065, wallSize + 0.01);
const baseboardMaterial = new THREE.MeshPhongMaterial({ map: baseboardTexture, reflectivity: 0, shininess: 0 });

// Định nghĩa vật liệu sàn
const floorMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x4a4a4a, 
    map: floorTexture, 
    shininess: 0, 
    reflectivity: 0 
});

// Định nghĩa vật liệu trần
const ceilingMaterial = new THREE.MeshStandardMaterial({ 
    map: ceilingTexture, 
    bumpMap: ceilingHeightTexture, 
    bumpScale: 0.001,
    roughness: 1
});

// Hình dạng và vật liệu ánh sáng cho hàm createLights
const lightGeometry = new THREE.BoxGeometry(0.15, 0.01, 0.15);
const lightMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
const outlineGeometry = new THREE.BoxGeometry(0.17, 0.01, 0.17);
const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });

// Tắt toàn bộ shader effects để tăng FPS tối đa khi khởi động
staticPass.enabled = false;
RGBShiftShaderPass.enabled = false;
filmPass.enabled = false;
BadTVShaderPass.enabled = false;
vignettePass.enabled = false;
bloomPass.enabled = false;
shadersToggled = false;

// Xây dựng bố cục cố định
buildFixedLayout();

// Tải model nhân vật và thiết lập góc nhìn thứ nhất
loadPlayer(scene, (loadedPlayer, loadedMixer, loadedAnimator) => {
    playerModel = loadedPlayer;
    mixer = loadedMixer;
    playerAnimator = loadedAnimator;
    // Đặt nhân vật ở vị trí spawn
    const spawnPos = findSpawnFromMap();
    playerModel.position.set(spawnPos.x, 0, spawnPos.z); 
    console.log('Player loaded and positioned at:', spawnPos);

    // Đổi lại vật liệu model để không bị đen
    playerModel.traverse((child) => {
        if (child.isMesh) {
            let oldMat = child.material;
            child.material = new THREE.MeshBasicMaterial({
                map: oldMat.map || null,
                color: oldMat.color ? oldMat.color.clone() : 0xffffff,
                skinning: oldMat.skinning || false // nếu là skinned mesh
            });
        }
    });
});

const raycaster = new THREE.Raycaster();

//Thêm control Camera GUI
const CAMERA_DEFAULT_Y = 0.6; 
let cameraYFromGUI = CAMERA_DEFAULT_Y; // Lưu giá trị Y do GUI điều khiển
const cameraPosition = {
    x: controls.getObject().position.x,
    y: CAMERA_DEFAULT_Y, // Đặt mặc định
    z: controls.getObject().position.z
};
controls.getObject().position.y = CAMERA_DEFAULT_Y; // Đặt lại vị trí y mặc định
graphicSettings.add(cameraPosition, "x", -5, 5, 0.01).onChange((value) => {
    controls.getObject().position.x = value;
}).name("Camera X").listen();
graphicSettings.add(cameraPosition, "y", 0, 2, 0.01).onChange((value) => {
    cameraYFromGUI = value;
    controls.getObject().position.y = value;
}).name("Camera Y").listen();
graphicSettings.add(cameraPosition, "z", -5, 5, 0.01).onChange((value) => {
    controls.getObject().position.z = value;
}).name("Camera Z").listen();

// Thêm các biến điều chỉnh vị trí model và camera
const modelPosition = {
    x: 0,
    y: -0.55,
    z: -0.35,
    rotationOffset: Math.PI
};

// Thêm controls Model GUI
const modelSettings = gui.addFolder("Model Position");
modelSettings.add(modelPosition, "x", -1, 1, 0.01).onChange((value) => {
    modelPosition.x = value;
}).name("Model X Offset").listen();
modelSettings.add(modelPosition, "y", -1, 0, 0.01).onChange((value) => {
    modelPosition.y = value;
}).name("Model Height").listen();
modelSettings.add(modelPosition, "z", -1, 1, 0.01).onChange((value) => {
    modelPosition.z = value;
}).name("Model Z Offset").listen();
modelSettings.add(modelPosition, "rotationOffset", 0, Math.PI * 2, 0.01).onChange((value) => {
    modelPosition.rotationOffset = value;
}).name("Model Rotation").listen();

// Thêm option chỉnh brightness vào GUI
let brightness = 0.7;
graphicSettings.add({ brightness }, 'brightness', 0.1, 2.0, 0.01).onChange((value) => {
    brightness = value;
    ambientLight.intensity = value;
    // Điều chỉnh fog và background cho sáng hơn
    let fogColor = new THREE.Color(0x222222).lerp(new THREE.Color(0xffffff), (value-0.1)/1.9);
    scene.fog.color = fogColor;
    renderer.setClearColor(fogColor);
}).name("Brightness").listen();
ambientLight.intensity = brightness;

// Thêm offset cho model khi crouch
const modelCrouchYOffset = 0.15;

update();

function popupMessage(message) {
    if (!currentMessage)
    {
        currentMessage = "";
    }
    if (message === currentMessage || messageQueue.includes(message)) {
                    return;
                }

    messageQueue.push(message);

    if (!isShowingMessage) {
        showNextMessage();
    }
}

function showNextMessage() {
    if (messageQueue.length > 0) {
        // ẩn thông báo hiện tại
        popup.classList.remove("show");
        popup.classList.add("hide");
        // var nextMessage = messageQueue.shift();
        // showMessage(nextMessage);
        // chờ 1 giây cho chuyển tiếp
        setTimeout(function () {
            var nextMessage = messageQueue.shift();
            showMessage(nextMessage);
        }, 550);
    }
}

function showMessage(message) {
    isShowingMessage = true;
    popup.innerHTML = message;
    currentMessage = message;
    popup.classList.add("show");
    popup.classList.remove("hide"); // xóa class 'hide' nếu nó đã được thêm

    if (timeout !== undefined) {
        clearTimeout(timeout);
    }

    timeout = setTimeout(function () {
        popup.classList.remove("show");
        popup.classList.add("hide");
        currentMessage = "";
        isShowingMessage = false;
        showNextMessage(); // hiển thị thông báo tiếp theo trong hàng đợi
    }, 2500);
}

// Sau buildFixedLayout();
let floorCount = 0, ceilingCount = 0;
scene.traverse(obj => {
  if(obj.userData && obj.userData.cellType === 'floor') floorCount++;
  if(obj.userData && obj.userData.cellType === 'ceiling') ceilingCount++;
});

// Cập nhật hàm
function update() {
    var currentTime = performance.now();
    var deltaTime = currentTime - lastTime;
    const delta = clock.getDelta();
    // Giới hạn tốc độ khung hình để tránh lỗi vật lý
    if (deltaTime > 1000 / maxFPS || !fpsCapped) {
        stats.begin();

        // Theo dõi trạng thái chuyển động cho các hoạt ảnh
        let wasMoving = isMoving;
        isMoving = false;
        isRunning = false;
        isMovingBackward = false;
        isCrouching = keyState.KeyC; 

        let speed = playerSettings.baseSpeed;
        let runMultiplier = 3; // hệ số chạy
        if (keyState.ShiftLeft && !isCrouching) speed *= runMultiplier;
        if (spectatorMode) speed *= 5; // Spectator nhanh hơn
        let crouchModifier = isCrouching ? 0.5 : 1.0;
        speed *= crouchModifier;
        // Reset velocity mỗi frame
        velocity.x = 0;
        velocity.y = 0;
        velocity.z = 0;
        if (keyState.KeyW) velocity.z = speed;
        if (keyState.KeyA) velocity.x = -speed;
        if (keyState.KeyS) velocity.z = -speed;
        if (keyState.KeyD) velocity.x = speed;
        // Cập nhật hoạt ảnh nhân vật dựa trên chuyển động
        if (typeof playerAnimator !== 'undefined' && playerAnimator) {
            const isMoving = keyState.KeyW || keyState.KeyA || keyState.KeyS || keyState.KeyD;
            const isRunning = keyState.ShiftLeft && !isCrouching;
            const isMovingBackward = keyState.KeyS;
            playerAnimator.updateMovementAnimation(isMoving, isRunning, isCrouching, isMovingBackward);
            // Gọi update cho animator mỗi frame
            playerAnimator.update(delta);
        }

        // Tốc độ chuyển động
        velocity.multiplyScalar(damping);
        
        // Cập nhật vị trí
        var oldPosition = controls.getObject().position.clone();

        controls.moveForward(velocity.z);
        controls.moveRight(velocity.x);
        if (spectatorMode) controls.moveUp(velocity.y);

        // Đồng bộ hóa vị trí và xoay model nhân vật với camera
        if (playerModel) {
            // Tính toán vị trí mới của model dựa trên vị trí camera và offset
            const cameraPosition = controls.getObject().position;
            const cameraDirection = new THREE.Vector3(0, 0, -1);
            cameraDirection.applyQuaternion(controls.getObject().quaternion);
            
            // Tính toán vị trí phía sau camera
            const behindCamera = new THREE.Vector3();
            behindCamera.copy(cameraPosition).add(cameraDirection.multiplyScalar(modelPosition.z));
            
            // Áp dụng offset ngang
            const rightVector = new THREE.Vector3(1, 0, 0);
            rightVector.applyQuaternion(controls.getObject().quaternion);
            behindCamera.add(rightVector.multiplyScalar(modelPosition.x));
            
            // Cập nhật vị trí model
            playerModel.position.x = behindCamera.x;
            playerModel.position.z = behindCamera.z;
            // Nếu crouch thì nâng model lên một chút
            playerModel.position.y = cameraPosition.y + modelPosition.y + (isCrouching ? modelCrouchYOffset : 0);
            
            // Xoay model theo hướng camera
            const euler = new THREE.Euler();
            euler.setFromQuaternion(controls.getObject().quaternion, 'YXZ');
            playerModel.rotation.y = euler.y + modelPosition.rotationOffset;
        }

        if (flashlightEnabled && flashlight != undefined) { // đèn pin theo camera
            flashlight.position.copy(controls.getObject().position);
            flashlight.position.y -= 0.12;
            // Sử dụng quaternion để xác định hướng bên phải camera
            const right = new THREE.Vector3(1, 0, 0).applyQuaternion(controls.getObject().quaternion);
            flashlight.position.addScaledVector(right, 0.15);
            var direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(controls.getObject().quaternion); 
            var distance = 5;
            var targetPosition = new THREE.Vector3();
            targetPosition.copy(controls.getObject().position).add(direction.multiplyScalar(distance));
            flashlight.target.position.copy(targetPosition);
            flashlight.target.updateMatrixWorld();
        }

        // Kiểm tra va chạm với tường
        if (!spectatorMode) {
            checkWallCollisions(oldPosition);
        }

        const playerPosition = controls.getObject().position;
        const { x: oldX, z: oldZ } = oldPosition;
        const { x: playerX, z: playerZ } = playerPosition;

        if (oldX !== playerX || oldZ !== playerZ) {
            const calculateOffset = (position, halfMaze, mazeDimension) => {
                return (position < 0 ? (position - halfMaze) : (position + halfMaze)) / mazeDimension | 0;
            };        

            const newOffsetX = calculateOffset(playerX, halfMazeWidth, mazeWidth);
            const newOffsetZ = calculateOffset(playerZ, halfMazeHeight, mazeHeight);

            const offsetPairs = [];
 
            for (let xOffset = -tolerance; xOffset <= tolerance; xOffset++) { 
                const newX = Math.floor((playerX + xOffset + halfMazeWidth) / mazeWidth);

                for (let zOffset = -tolerance; zOffset <= tolerance; zOffset++) {
                    const newZ = Math.floor((playerZ + zOffset + halfMazeHeight) / mazeHeight);

                    if (!offsetPairs.some(([x, z]) => x === newX && z === newZ)) {
                        offsetPairs.push([newX, newZ]);
                    }
                }
            }

            handleOffsetChange(newOffsetX, newOffsetZ, offsetPairs);
        }

        shaderTime += 0.1;
        staticPass.uniforms.time.value = (shaderTime / 10);
        filmPass.uniforms.time.value = shaderTime;
        BadTVShaderPass.uniforms.time.value = shaderTime;

        composer.render();

        lastTime = currentTime;
        stats.end();
    }

    // Điều chỉnh độ cao camera chỉ khi crouch, còn lại trả lại giá trị do GUI điều khiển
    if (isCrouching) {
        controls.getObject().position.y = 0.35; // crouchHeight mặc định
    } else {
        controls.getObject().position.y = cameraYFromGUI; // Trả lại giá trị do GUI điều khiển
    }
    // Điều chỉnh FOV khi chạy
    let targetFov = isRunning ? 85 : 70;
    if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
    }

    //Điều chỉnh modelPosition.z khi chạy
    if (isRunning) {
        modelPosition.z = -0.48;
    }    

    if (currentTime > 1000 && !performanceOverride) {
        lightsEnabled = false;
            guicontrols.dynamiclights = false;
            deleteLights();
            ceilingMaterial.color.setHex(0x777777);
            ambientLight.intensity = 0.7;
            popupMessage("Dynamic lights have been automatically disabled. \n Press \"2\" or \"G\" to re-enable them.")
            dynamicLightsPopup = true;
        performanceOverride = true;
    }

    if ( mixer !== undefined ) {
        mixer.update( delta );
    }

    // Animate đồ vật thu thập (hiệu ứng nổi)
    scene.children.forEach(function(object) {
        if (object.userData && object.userData.isCollectible) {
            if (!object.userData.animationTime) {
                object.userData.animationTime = 0;
                object.userData.originalY = object.position.y;
            }
            object.userData.animationTime += delta * 2;
            object.position.y = object.userData.originalY + Math.sin(object.userData.animationTime) * 0.1;
            object.rotation.y += delta * 1.5; // Slow rotation
        }
    });

    // Cập nhật animators cho cửa
    if (window.doorAnimators) {
        window.doorAnimators.forEach(anim => anim.update(delta));
    }

    // Cập nhật animators cho cửa ending
    if (window.endingDoorAnimators) {
        window.endingDoorAnimators.forEach(anim => anim.update(delta));
    }

    // Kiểm tra chiến thắng khi đi qua cửa ending
    if (!paused) {
        scene.children.forEach((object) => {
            if (object.userData?.cellType === 'exitDoor' && object.userData.animator?.isOpen()) {
                const playerPos = controls.getObject().position;
                const doorPos = object.position;
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - doorPos.x, 2) +
                    Math.pow(playerPos.z - doorPos.z, 2)
                );
                
                if (distance < 1.0) {
                    handleGameWin();
                }
            }
        });
    }

    requestAnimationFrame(update);
}

const coordinates = document.getElementById('coordinates');

function handleOffsetChange(newOffsetX, newOffsetZ, offsetPairs) {
    // Bố cục cố định - không cần tạo sinh lại cho các offset khác nhau
    if ((newOffsetX != offsetX || newOffsetZ != offsetZ) && !hasVisitedOffset(newOffsetX, newOffsetZ)) {
        offsetX = newOffsetX;
        offsetZ = newOffsetZ;
        createLightSources(offsetX, offsetZ);
        deleteLightsExceptOffset(offsetX, offsetZ);
        visitedOffsets.push([newOffsetX, newOffsetZ]);
        coordinates.innerHTML = `(${offsetX},${offsetZ})`;
    } else if (newOffsetX != offsetX || newOffsetZ != offsetZ) {
        offsetX = newOffsetX;
        offsetZ = newOffsetZ;
        deleteLightsExceptOffset(offsetX, offsetZ);
        createLightSources(offsetX, offsetZ);
        coordinates.innerHTML = `(${offsetX},${offsetZ})`;
    }
}

coordinates.innerHTML = `(${offsetX},${offsetZ})`;

function hasVisitedOffset(x, z) {
    return visitedOffsets.some(([vx, vz]) => vx === x && vz === z);
}

// Gom logic kiểm tra va chạm vào 1 hàm
function isCollisionObject(object) {
    return (
        object instanceof THREE.Mesh && (
            (object.identifier && (
                object.identifier.includes("wall") ||
                object.identifier.includes("column") ||
                object.identifier.includes("sideWall") ||
                object.identifier.includes("sideWallTop")
            )) ||
            (object.identifier && object.identifier.includes("door") && object.userData.animator && !object.userData.animator.isOpen()) ||
            (object.userData && object.userData.cellType === 'exitDoor' && !object.userData.animator?.isOpen())
        )
    );
}

//Logic trượt va chạm
function checkWallCollisions(oldPosition) {
    var position = controls.getObject().position;
    let collided = false;
    scene.children?.forEach(function (object) {
        if (isCollisionObject(object)) {
            if (checkCollision(position, object)) {
                collided = true;
            }
        }
    });
    if (collided) {
        // Thử trượt dọc tường (slide):
        // Thử chỉ di chuyển X
        controls.getObject().position.set(position.x, oldPosition.y, oldPosition.z);
        let slideX = false;
        scene.children?.forEach(function (object) {
            if (isCollisionObject(object)) {
                if (checkCollision(controls.getObject().position, object)) {
                    slideX = true;
                }
            }
        });
        if (slideX) {
            // Thử chỉ di chuyển Z
            controls.getObject().position.set(oldPosition.x, oldPosition.y, position.z);
            let slideZ = false;
            scene.children?.forEach(function (object) {
                if (isCollisionObject(object)) {
                    if (checkCollision(controls.getObject().position, object)) {
                        slideZ = true;
                    }
                }
            });
            if (slideZ) {
                // Không trượt được, trả về vị trí cũ
                controls.getObject().position.copy(oldPosition);
            }
        }
    }
}

// Kiểm tra va chạm
function checkCollision(position, wall) {
    var boxSize = new THREE.Vector3(0.32, 1.0, 0.32);

    return (
        position.x + boxSize.x / 2 >= wall.position.x - wall.geometry.parameters.width / 2 &&
        position.x - boxSize.x / 2 <= wall.position.x + wall.geometry.parameters.width / 2 &&
        position.z + boxSize.z / 2 >= wall.position.z - wall.geometry.parameters.depth / 2 &&
        position.z - boxSize.z / 2 <= wall.position.z + wall.geometry.parameters.depth / 2 &&
        position.y + boxSize.y / 2 >= wall.position.y - wall.geometry.parameters.height / 2 &&
        position.y - boxSize.y / 2 <= wall.position.y + wall.geometry.parameters.height / 2
    );
}

scene.fog = new THREE.FogExp2(0x222222, 0.17);

renderer.setClearColor(0x222222);

// Tạo ánh sáng
function createLights() {
    // Tạo ánh sáng trong không gian mở của bố cục cố định
    for (var i = 0; i < MAP_WIDTH; i = i + 4) {
        for (var j = 0; j < MAP_HEIGHT; j = j + 4) {
            const cellValue = getCellValue(i, j);
            if (cellValue === 0) { // Open space
                const light = new THREE.Mesh(lightGeometry, lightMaterial);
                light.position.x = i - MAP_WIDTH / 2;
                light.position.y = 0.99;
                light.position.z = j - MAP_HEIGHT / 2;
                const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
                outline.position.x = i - MAP_WIDTH / 2;
                outline.position.y = 0.999;
                outline.position.z = j - MAP_HEIGHT / 2;
                light.identifier = "0,0,light";
                outline.identifier = "0,0,outline";
                light.userData.isMapObject = true;
                outline.userData.isMapObject = true;
                scene.add(light);
                scene.add(outline);
            }
        }
    }
}

function createLightSources(offsetX, offsetZ){
    if (!lightsEnabled) {
        return;
    }
    //Số lượng PointLight
    const lightStep = 2;
    const lightRadius = 15; // chỉ tạo light trong bán kính 15 block quanh player
    const playerPos = controls.getObject().position;
    for (var i = -tolerance; i < MAP_WIDTH + tolerance; i += lightStep) {
        for (var j = -tolerance; j < MAP_HEIGHT + tolerance; j += lightStep) {
            // Tính vị trí world
            const wx = (i - MAP_WIDTH / 2) + (offsetX * MAP_WIDTH);
            const wz = (j - MAP_HEIGHT / 2) + (offsetZ * MAP_HEIGHT);
            // Chỉ tạo light nếu gần player
            if (Math.abs(wx - playerPos.x) <= lightRadius && Math.abs(wz - playerPos.z) <= lightRadius) {
                const lightSource = new THREE.PointLight(0x222222, 1.1, 3.1);
                lightSource.position.x = wx;
            lightSource.position.y = 0.85;
                lightSource.position.z = wz;
                lightSource.identifier = `${offsetX},${offsetZ}`;
            scene.add(lightSource);
            }
        }
    }
}

createLights(0,0);
createLightSources(0,0);

function deleteLightsExceptOffset(offsetX, offsetZ) {
    for (var i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].type === "PointLight") {
            if (scene.children[i].identifier != `${offsetX},${offsetZ}`) {
                scene.remove(scene.children[i]);
            }
        }
    }
}

function deleteLights() {
    for (var i = scene.children.length - 1; i >= 0; i--) {
        if (scene.children[i].type === "PointLight") {
            scene.remove(scene.children[i]);
        }
    }
}

update();

// Thêm xử lý phím E để interact với cửa:
document.addEventListener('keydown', function (event) {
    if (!paused && event.code === 'KeyE') {
        const origin = controls.getObject().position.clone();
        const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(controls.getObject().quaternion);
        raycaster.set(origin, direction);
        const intersects = raycaster.intersectObjects(scene.children, true);
        for (let i = 0; i < intersects.length; i++) {
            const obj = intersects[i].object;
            let doorObj = obj;
            while (doorObj && !doorObj.userData?.cellType) doorObj = doorObj.parent;
            
            // Xử lý cửa thường
            if (doorObj && doorObj.userData.cellType === 'door') {
                if (intersects[i].distance < 2.0) {
                    if (doorObj.userData.animator) {
                        doorObj.userData.animator.toggle();
                        break;
                    }
                }
            }
            
            // Xử lý cửa thoát
            if (doorObj && doorObj.userData.cellType === 'exitDoor') {
                if (intersects[i].distance < 2.0) {
                    if (glowstickCount >= glowstickTotal) {
                        if (doorObj.userData.animator && !doorObj.userData.animator.isOpen()) {
                            doorObj.userData.animator.open();
                            popupMessage("Cửa đã mở! Bạn có thể thoát ra!");
                        }
                    } else {
                        popupMessage(`Chưa thể thoát! Bạn cần thu thập đủ ${glowstickTotal} glowstick (${glowstickCount}/${glowstickTotal})`);
                    }
                    break;
                }
            }
        }
    }
});

// Đặt glowstick tại các vị trí số 4,5,6,7 trên map
let glowstickAnimators = [];
const glowstickColors = {
  4: 0x00ff00, // Xanh lá
  5: 0x0066ff, // Xanh dương
  6: 0xff0000, // Đỏ
  7: 0xffff00  // Vàng
};

let glowstickLights = [];

//Tạo glowstick
for (let y = 0; y < MAP_HEIGHT; y++) {
  for (let x = 0; x < MAP_WIDTH; x++) {
    const cellValue = getCellValue(x, y);
    if (cellValue >= 4 && cellValue <= 7) {
      loadGlowstick(scene, { x: x - MAP_WIDTH / 2, y: 0.05, z: y - MAP_HEIGHT / 2 }, (glowstick, mixer, animator) => {
        glowstick.userData.isGlowstick = true;
        glowstick.userData.animator = animator;
        glowstick.userData.cellValue = cellValue;
        glowstickAnimators.push(animator);
        
        // Tăng cường phát sáng cho glowstick
        glowstick.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.color.set(glowstickColors[cellValue]);
            child.material.emissive = new THREE.Color(glowstickColors[cellValue]);
            child.material.emissiveIntensity = 3.0; // Tăng độ phát sáng
            child.material.needsUpdate = true;
          }
        });

        // Điều chỉnh ánh sáng glowstick
        const innerLight = new THREE.PointLight(
          glowstickColors[cellValue],
          5.0,  // Tăng cường độ lên 5.0
          4,    // Tăng phạm vi lên 4
          1.5   // Giảm độ suy giảm xuống 1.5
        );
        innerLight.position.copy(glowstick.position);
        innerLight.position.y += 0.2; // Nâng cao hơn một chút

        const outerLight = new THREE.PointLight(
          glowstickColors[cellValue],
          2.0,  // Tăng cường độ lên 2.0
          8,    // Tăng phạm vi lên 8
          1.5   // Giảm độ suy giảm
        );
        outerLight.position.copy(glowstick.position);
        outerLight.position.y += 0.2;

        // Thêm bloom effect cho glowstick
        // Tìm và điều chỉnh bloomPass settings
        bloomPass.strength = 1.0;
        bloomPass.radius = 0.5;
        bloomPass.threshold = 0.3;
        bloomPass.enabled = true;

        // Điều chỉnh ambient light để tối hơn (làm nổi bật glowstick)
        ambientLight.intensity = 0.05;
      });
    }
  }
}

//Logic nhặt glowstick: 
function checkGlowstickCollision() {
  const playerPosition = controls.getObject().position;
  scene.children.forEach(function (object) {
    if (object.userData && object.userData.isGlowstick) {
      const dx = playerPosition.x - object.position.x;
      const dz = playerPosition.z - object.position.z;
      const dist2D = Math.sqrt(dx * dx + dz * dz);
      if (dist2D < 0.5) {
        scene.remove(object);
        // Xóa cả hai nguồn sáng
        if (object.userData.glowLight) {
          scene.remove(object.userData.glowLight);
          const lightIndex = glowstickLights.indexOf(object.userData.glowLight);
          if (lightIndex > -1) glowstickLights.splice(lightIndex, 1);
        }
        if (object.userData.ambientGlow) {
          scene.remove(object.userData.ambientGlow);
          const glowIndex = glowstickLights.indexOf(object.userData.ambientGlow);
          if (glowIndex > -1) glowstickLights.splice(glowIndex, 1);
        }
        glowstickCount++;
        updateGlowstickCounter();
        popupMessage('Đã nhặt được glowstick!');
      }
    }
  });
}

// Thêm gọi checkGlowstickCollision vào hàm update
const oldUpdate = update;
update = function() {
  checkGlowstickCollision();
  if (glowstickAnimators) {
    glowstickAnimators.forEach(anim => anim && anim.update(clock.getDelta()));
  }
  oldUpdate();
}

// Thêm hàm xử lý chiến thắng
function handleGameWin() {
    // Hiển thị thông báo chiến thắng
    popupMessage("Chúc mừng! Bạn đã thoát khỏi Backrooms!");
    
    // Tạm dừng game
    paused = true;
    
    // Đổi tiêu đề
    const title = document.getElementById('title');
    if (title) {
        title.innerText = "Chúc mừng! Bạn đã thoát khỏi Backrooms!";
        title.style.display = 'block';
    }
    // Ẩn nút startButton
    startButton.style.display = 'none';
    // Ẩn dòng [ Loading ]
    const loading = document.querySelector('#menuPanel [id*="loading"], #menuPanel .loading, #menuPanel [class*="loading"]');
    if (loading) loading.style.display = 'none';
    // Hiển thị menu
    menuPanel.style.display = 'block';
    
    // Thêm hiệu ứng
    if (bloomPass) {
        bloomPass.enabled = true;
        bloomPass.strength = 1.5;
        bloomPass.radius = 0.9;
    }
    // Thêm âm thanh chiến thắng (nếu có)
    // TODO: Thêm âm thanh chiến thắng
}

// Thêm vào phần đầu file, sau các import
const minimapSize = 200; // Kích thước minimap px
const minimapScale = 4; // Tỷ lệ thu nhỏ map

// Tạo element cho minimap
const minimapContainer = document.createElement('div');
minimapContainer.id = 'minimap';
minimapContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px; 
    width: ${minimapSize}px;
    height: ${minimapSize}px;
    background: rgba(0,0,0,0.8);
    border: 2px solid #444;
    display: none;
    z-index: 1000;
`;

// Tạo canvas cho minimap
const minimapCanvas = document.createElement('canvas');
minimapCanvas.width = minimapSize;
minimapCanvas.height = minimapSize;
minimapContainer.appendChild(minimapCanvas);
document.body.appendChild(minimapContainer);

// Hàm vẽ minimap
function drawMinimap() {
    const ctx = minimapCanvas.getContext('2d');
    ctx.clearRect(0, 0, minimapSize, minimapSize);
    
    const cellSize = minimapSize / (MAP_WIDTH / minimapScale);
    
    // Vẽ các ô trong map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const cellValue = getCellValue(x, y);
            const mapX = (x * cellSize) / minimapScale;
            const mapY = (y * cellSize) / minimapScale;
            
            // Chọn màu dựa vào loại ô
            switch(cellValue) {
                case 1: // Tường
                    ctx.fillStyle = '#666';
                    break;
                case 2: case 22: // Cửa
                    ctx.fillStyle = '#844'; 
                    break;
                case 4: // Glowstick xanh lá
                    ctx.fillStyle = '#0f0';
                    break;
                case 5: // Glowstick xanh dương
                    ctx.fillStyle = '#06f';
                    break;
                case 6: // Glowstick đỏ
                    ctx.fillStyle = '#f00';
                    break;
                case 7: // Glowstick vàng
                    ctx.fillStyle = '#ff0';
                    break;
                case 9: // Cửa thoát
                    ctx.fillStyle = '#0ff';
                    break;
                default: // Không gian trống
                    ctx.fillStyle = '#111';
            }
            
            ctx.fillRect(mapX, mapY, cellSize/minimapScale, cellSize/minimapScale);
        }
    }
    
    // Vẽ vị trí người chơi
    const playerX = ((controls.getObject().position.x + MAP_WIDTH/2) * cellSize) / minimapScale;
    const playerY = ((controls.getObject().position.z + MAP_HEIGHT/2) * cellSize) / minimapScale;
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(playerX, playerY, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Thêm vào event listener keydown
document.addEventListener('keydown', function(event) {
    if (event.code === 'KeyM') {
        if (minimapContainer.style.display === 'none') {
            minimapContainer.style.display = 'block';
            // Cập nhật minimap liên tục khi hiển thị
            if (!window.minimapInterval) {
                window.minimapInterval = setInterval(drawMinimap, 100);
            }
        } else {
            minimapContainer.style.display = 'none';
            // Dừng cập nhật khi ẩn
            if (window.minimapInterval) {
                clearInterval(window.minimapInterval);
                window.minimapInterval = null;
            }
        }
    }
});
