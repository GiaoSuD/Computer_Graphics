# 🎮 Backrooms Game - Three.js Horror Experience

## Giới thiệu
Game 3D kinh dị sinh tồn lấy cảm hứng từ Backrooms, phát triển bằng Three.js với hệ thống shader, animation và điều khiển hiện đại, tối ưu cho trình duyệt.

## Công nghệ & Thư viện sử dụng

### 1. Đồ họa & 3D Engine
- **[Three.js v0.149.0](https://threejs.org/)**: Thư viện WebGL 3D chính, dựng hình, ánh sáng, vật liệu, camera, scene.
- **GLTFLoader**: Tải mô hình 3D định dạng glTF (nhân vật, cửa, glowstick...)
- **PointerLockControls**: Điều khiển camera góc nhìn thứ nhất (FPS), hỗ trợ giới hạn góc nhìn, khoá chuột.

### 2. Hệ thống Animation
- **THREE.AnimationMixer**: Quản lý và phát các animation cho model 3D.
- **Custom Animator Classes**: PlayerAnimator, DoorAnimator, EndingDoorAnimator, GlowstickAnimator.

### 3. Shader & Hiệu ứng hình ảnh
- **EffectComposer**: Hệ thống post-processing pipeline.
- **ShaderPass**: Áp dụng các shader custom.
- **Các shader custom:**
  - **RGBShiftShader**: Hiệu ứng lệch màu (chromatic aberration)
  - **FilmShader**: Hiệu ứng scanline, nhiễu phim
  - **StaticShader**: Hiệu ứng nhiễu tĩnh (static noise)
  - **BadTVShader**: Hiệu ứng TV hỏng méo hình
  - **VignetteShader**: Hiệu ứng tối góc (vignette)
  - **UnrealBloomPass**: Hiệu ứng bloom (phát sáng)

### 4. Giao diện & Debug
- **[lil-gui](https://github.com/georgealways/lil-gui)**: Giao diện điều chỉnh thông số realtime (pixel ratio, tốc độ, shader...)
- **[stats.js](https://github.com/mrdoob/stats.js/)**: Hiển thị FPS realtime.
- **Custom popup system**: Thông báo, hướng dẫn, trạng thái game.

### 5. Controls & Gameplay
- **WASD**: Di chuyển
- **Chuột**: Nhìn xung quanh
- **Shift**: Chạy nhanh
- **C**: Crouch (ngồi)
- **F**: Bật/tắt đèn pin
- **X**: Spectator mode
- **E**: Tương tác cửa

### 6. Asset & Model
- **Player Model**: ETB Animated (Sketchfab)
- **Door Model**: Door Wood (Sketchfab)
- **End Door Model**: Garage Door (Sketchfab)
- **GlowStick Model**: Glowstick (Sketchfab)
- **Texture**: Wallpaper, floor, ceiling, baseboard, heightmap (public/)

### 7. Cấu trúc code
```
├── main.js              # Entry point, game logic, scene setup
├── index.html           # HTML chính
├── style.css            # Giao diện, font, popup
├── src/objects/         # Player.js, Door.js, Glowstick.js, EndingDoor.js
├── utils/FixedMapLayout.js # Bản đồ cố định
├── shader/              # Các file shader custom
├── assets/              # Model, texture
├── public/              # Static files
```

## Tính năng nổi bật
- Bản đồ cố định, collision detection
- Hệ thống animation nhân vật, cửa, glowstick, cửa thoát
- Hiệu ứng shader hiện đại: bloom, vignette, film grain, TV distortion...
- Đèn pin động (flashlight)
- Thu thập glowstick, mở cửa kết thúc để chiến thắng
- Spectator mode (bay tự do, xuyên tường)
- Giao diện điều chỉnh thông số realtime (GUI)
- Popup hướng dẫn, thông báo trạng thái

## Cài đặt & Chạy
### Yêu cầu
- Trình duyệt hiện đại hỗ trợ WebGL & ES6 modules
- Kết nối Internet (Three.js CDN)

### Chạy local:
1. **Python HTTP Server**:
   ```bash
   python -m http.server 8000
   ```
2. **Node.js**:
   ```bash
   npm install -g http-server
   http-server -p 8000
   ```
3. Mở trình duyệt: `http://localhost:8000`

## Credits
- Monster Model: https://sketchfab.com/3d-models/scp-096-7074212c3ba54d0d959c48c55b8fefce
- Player Model: https://sketchfab.com/3d-models/etb-animated-use-animation-dropdown-to-see-all-6795caee22124716bab954326306d3e3
- Door Model: https://sketchfab.com/3d-models/door-wood-afed9756ba974d1395a336124ff326fd#download
- End Door Model: https://sketchfab.com/3d-models/garage-door-01-fb7a0e3b6cf348f48831a80e49054609
- GlowStick Model: https://sketchfab.com/3d-models/glowstick-cbc7f31c658247219c32b083183513e5#download

## Tối ưu hiệu năng
- Điều chỉnh pixel ratio động
- Giới hạn FPS
- Tắt/mở hiệu ứng shader
- Tối ưu số lượng object trong scene

---
