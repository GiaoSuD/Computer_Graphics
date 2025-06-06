// Audio Manager cho game
// Quản lý 2 loại âm lượng: music (nhạc nền) và sfx (hiệu ứng)

// Hàm lerp đơn giản không cần THREE
function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

const musicFiles = [
  'assets/sounds/background1.mp3',
  'assets/sounds/background2.mp3',
  'assets/sounds/background3.mp3'
];
const sfxFiles = {
  collect: 'assets/sounds/collect.mp3',
  door: 'assets/sounds/door.mp3',
  enddoor: 'assets/sounds/enddoor.mp3',
  idlescp: 'assets/sounds/idlescp.mp3',
  pain: 'assets/sounds/pain.mp3',
  screamscp: 'assets/sounds/screamscp.mp3',
  finish: 'assets/sounds/finish.mp3',
  attackscp: 'assets/sounds/attackscp.mp3',
  gameover: 'assets/sounds/gameover.mp3',
  flashlight: 'assets/sounds/flashlight.mp3',
  scpsounds: 'assets/sounds/scpsounds.mp3'
};

// Nhạc nền
const musicAudios = musicFiles.map(src => {
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = 0.3; // Âm lượng music
  return audio;
});
let currentMusic = null;
let musicVolume = 0.2;

// SFX
const sfxAudios = {};
Object.entries(sfxFiles).forEach(([key, src]) => {
  const audio = new Audio(src);
  audio.volume = 0.7; // Âm lượng sfx
  if (key === 'scpsounds') {
    audio.loop = true; // Cho phép loop âm thanh quái vật
  }
  sfxAudios[key] = audio;
});
let sfxVolume = 0.7;

// Biến cho âm thanh quái vật
let scpSoundEnabled = false;
const maxScpSoundDistance = 30; // Khoảng cách tối đa nghe được âm thanh quái vật
const minScpSoundVolume = 0.1; // Âm lượng tối thiểu
const maxScpSoundVolume = 0.7; // Âm lượng tối đa

// Phát nhạc nền random
function playRandomMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }
  const idx = Math.floor(Math.random() * musicAudios.length);
  currentMusic = musicAudios[idx];
  currentMusic.volume = musicVolume;
  currentMusic.play();
}

function stopMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
    currentMusic = null;
  }
}

function setMusicVolume(vol) {
  musicVolume = vol;
  musicAudios.forEach(audio => audio.volume = musicVolume);
  if (currentMusic) currentMusic.volume = musicVolume;
}

function setSFXVolume(vol) {
  sfxVolume = vol;
  Object.values(sfxAudios).forEach(audio => audio.volume = sfxVolume);
}

function playSFX(name, volumeOverride = null) {
  const audio = sfxAudios[name];
  if (audio) {
    audio.currentTime = 0;
    audio.volume = volumeOverride !== null ? volumeOverride : sfxVolume;
    audio.play();
  }
}

function playSCPSound() {
  if (!scpSoundEnabled) {
    const audio = sfxAudios['scpsounds'];
    if (audio) {
      audio.volume = minScpSoundVolume;
      audio.play();
      scpSoundEnabled = true;
    }
  }
}

function stopSCPSound() {
  if (scpSoundEnabled) {
    const audio = sfxAudios['scpsounds'];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      scpSoundEnabled = false;
    }
  }
}

function updateSCPSoundVolume(distance) {
  if (scpSoundEnabled) {
    const audio = sfxAudios['scpsounds'];
    if (audio) {
      // Tính toán âm lượng dựa trên khoảng cách
      const volume = lerp(
        maxScpSoundVolume,
        minScpSoundVolume,
        Math.min(distance / maxScpSoundDistance, 1)
      );
      audio.volume = volume * sfxVolume;
    }
  }
}

export default {
  playRandomMusic,
  stopMusic,
  setMusicVolume,
  setSFXVolume,
  playSFX,
  playSCPSound,
  stopSCPSound,
  updateSCPSoundVolume,
  get musicVolume() { return musicVolume; },
  get sfxVolume() { return sfxVolume; }
};
