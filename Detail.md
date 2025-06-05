# Phân tích công nghệ & thư viện sử dụng trong game Backrooms (Three.js)

## 1. main.js
- **Three.js**: Dựng scene, camera, ánh sáng, vật liệu, mesh, fog, post-processing, raycasting, animation.
- **GLTFLoader**: Tải mô hình 3D (nhân vật, cửa, glowstick, ending door).
- **PointerLockControls**: Điều khiển camera góc nhìn thứ nhất (FPS), giới hạn góc nhìn, khoá chuột.
- **EffectComposer, RenderPass, ShaderPass**: Hệ thống post-processing cho hiệu ứng hình ảnh.
- **Custom Shaders**: RGBShiftShader, FilmShader, StaticShader, BadTVShader, VignetteShader, UnrealBloomPass.
- **lil-gui**: Giao diện điều chỉnh thông số realtime (pixel ratio, tốc độ, shader, model position, brightness...)
- **stats.js**: Hiển thị FPS realtime.
- **Popup system**: Thông báo, hướng dẫn, trạng thái game.
- **Raycaster**: Xử lý tương tác với cửa (E để mở cửa).
- **Custom logic**: Xử lý va chạm, di chuyển, animation, thu thập glowstick, điều kiện chiến thắng, spectator mode, v.v.
- **Import các module con**: Player, Door, Glowstick, EndingDoor, FixedMapLayout.

## 2. PointerLockControls.js
- **Three.js**: Sử dụng các class Euler, Vector3, EventDispatcher để điều khiển camera.
- **Custom implementation**: Tự viết lại logic giới hạn góc nhìn dọc (pitch), xử lý sự kiện mousemove, pointerlock, pointerlockerror.
- **Không dùng thêm thư viện ngoài** ngoài Three.js.

## 3. utils/FixedMapLayout.js
- **ES6 Module**: Xuất bản đồ cố định dạng mảng 2D, các hàm tiện ích lấy giá trị ô, kích thước map.
- **Không dùng thư viện ngoài**.

## 4. utils/script_gen_map.js
- **ES6 Module**: Script tự động sinh bản đồ Backrooms dạng mảng 2D, có các hàm tạo phòng, hành lang, đặt vật phẩm, cửa, vị trí bắt đầu/kết thúc.
- **Không dùng thư viện ngoài**.

## 5. src/objects/Glowstick.js
- **Three.js**: Tạo mesh, vật liệu cho glowstick.
- **GLTFLoader**: Tải mô hình glowstick từ file glb.
- **Không dùng thêm thư viện ngoài** ngoài Three.js.

## 6. src/objects/Player.js
- **Three.js**: Tạo mesh, vật liệu, animation cho nhân vật.
- **GLTFLoader**: Tải mô hình nhân vật từ file glb.
- **THREE.AnimationMixer**: Quản lý và phát các animation cho model 3D.
- **Custom Animator Class**: PlayerAnimator quản lý trạng thái hoạt ảnh (idle, walking, running, crouching, backward...)
- **Không dùng thêm thư viện ngoài** ngoài Three.js.

## 7. src/objects/EndingDoor.js
- **Three.js**: Tạo mesh, vật liệu, animation cho cửa kết thúc.
- **GLTFLoader**: Tải mô hình cửa kết thúc từ file glb.
- **THREE.AnimationMixer**: Quản lý và phát animation mở cửa.
- **Custom Animator Class**: EndingDoorAnimator quản lý trạng thái đóng/mở cửa.
- **Không dùng thêm thư viện ngoài** ngoài Three.js.

## 8. src/objects/Door.js
- **Three.js**: Tạo mesh, vật liệu, animation cho cửa thường.
- **GLTFLoader**: Tải mô hình cửa từ file glb.
- **THREE.AnimationMixer**: Quản lý và phát animation mở/đóng cửa.
- **Custom Animator Class**: DoorAnimator quản lý trạng thái đóng/mở cửa, tự động đóng sau khi mở.
- **Không dùng thêm thư viện ngoài** ngoài Three.js.

---

## Tổng kết công nghệ & thư viện
- **Three.js**: Nền tảng đồ họa 3D, xử lý scene, mesh, vật liệu, ánh sáng, camera, fog, animation, loader, post-processing, raycasting, v.v.
- **GLTFLoader**: Loader cho mô hình 3D glTF.
- **PointerLockControls**: Điều khiển camera FPS.
- **EffectComposer, ShaderPass, RenderPass**: Hệ thống post-processing.
- **Custom Shaders**: RGBShift, Film, Static, BadTV, Vignette, UnrealBloom.
- **lil-gui**: Giao diện điều chỉnh thông số realtime.
- **stats.js**: Hiển thị FPS.
- **ES6 Modules**: Quản lý code, chia nhỏ module, import/export.
- **Không sử dụng framework ngoài nào khác** (React, Vue, Angular, v.v.).

**Toàn bộ gameplay, logic, hiệu ứng, animation, va chạm, popup... đều được code thuần ES6 và Three.js.**
