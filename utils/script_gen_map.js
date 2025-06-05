// --- SCRIPT TẠO MAP CỐ ĐỊNH 100x100 ---

function generateFixedBackroomsMap() {
    // --- CÀI ĐẶT ---
    const MAP_WIDTH = 100;
    const MAP_HEIGHT = 100;
    const LEGEND = {
        FLOOR: 0, WALL: 1, DOOR: 2, PILLAR: 3,
        ITEM_1: 4, ITEM_2: 5, ITEM_3: 6, ITEM_4: 7,
        START_POS: 8, EXIT_POS: 9,
    };

    // 1. Bắt đầu với một map toàn tường
    let map = Array(MAP_HEIGHT).fill(0).map(() => Array(MAP_WIDTH).fill(LEGEND.WALL));

    // --- HÀM TIỆN ÍCH ---
    const createRectRoom = (x, y, w, h) => {
        for (let i = y; i < y + h; i++) {
            for (let j = x; j < x + w; j++) {
                if (map[i] && map[i][j] !== undefined) {
                    if (i === y || i === y + h - 1 || j === x || j === x + w - 1) {
                        if (map[i][j] === LEGEND.WALL) map[i][j] = LEGEND.WALL;
                    } else {
                        map[i][j] = LEGEND.FLOOR;
                    }
                }
            }
        }
    };
    
    const createHallway = (x1, y1, x2, y2, width) => {
        let currX = x1, currY = y1;
        const halfWidth = Math.floor(width / 2);
        while (Math.abs(currX - x2) > 0 || Math.abs(currY - y2) > 0) {
            const moveX = Math.abs(currX - x2) > Math.abs(currY - y2);
            if (moveX) {
                currX < x2 ? currX++ : currX--;
            } else {
                currY < y2 ? currY++ : currY--;
            }
            for (let i = -halfWidth; i <= halfWidth; i++) {
                for (let j = -halfWidth; j <= halfWidth; j++) {
                    if (map[currY + i] && map[currY + i][currX + j] !== undefined) {
                        map[currY + i][currX + j] = LEGEND.FLOOR;
                    }
                }
            }
        }
    };

    // --- BẮT ĐẦU THIẾT KẾ CÁC KHU VỰC ---

    // KHU A: Mê cung hành lang hẹp (góc trên bên trái)
    createRectRoom(5, 5, 25, 20); // Tạo không gian nền
    for(let i = 6; i < 24; i += 4) { map[i].fill(LEGEND.WALL, 7, 28); }
    for(let i = 8; i < 28; i += 4) { for(let y=6; y<24; y++) map[y][i] = LEGEND.WALL; }
    // Thêm vài lối đi ngang
    createHallway(6, 8, 28, 8, 1);
    createHallway(6, 16, 28, 16, 1);
    createHallway(6, 22, 28, 22, 1);

    // KHU B: Sảnh Cột Lớn (giữa bên phải)
    createRectRoom(60, 20, 35, 25);
    for (let i = 22; i < 43; i += 4) {
        for (let j = 62; j < 93; j += 4) {
            map[i][j] = LEGEND.PILLAR;
        }
    }
    
    // KHU C: Khu Văn phòng chữ L (giữa bản đồ)
    createRectRoom(30, 30, 20, 40); // Phần dọc
    createRectRoom(50, 60, 25, 15); // Phần ngang
    // Tạo các vách ngăn văn phòng
    for(let i=35; i<68; i+=5) { map[i].fill(LEGEND.WALL, 31, 49); map[i][38] = LEGEND.DOOR; }
    for(let i=52; i<73; i+=5) { for(let y=61; y<74; y++) map[y][i] = LEGEND.WALL; map[65][i]=LEGEND.DOOR;}

    // KHU D: Vết nứt Chéo (từ dưới Khu A đi xuống)
    createHallway(28, 23, 20, 80, 3); // Lối đi chéo chính
    
    // KHU E: Phòng Chứa Lối ra (góc dưới bên trái)
    createRectRoom(5, 80, 20, 15);
    map[85][25] = LEGEND.DOOR; // Cửa vào phòng cuối
    map[82][7] = LEGEND.WALL; map[83][7]=LEGEND.WALL; map[84][7]=LEGEND.WALL; // Thêm vài vật cản

    // --- KẾT NỐI CÁC KHU VỰC ---
    createHallway(28, 12, 60, 25, 3); // Nối A -> B
    createHallway(65, 45, 45, 50, 1); // Nối B -> C (lối đi hẹp)
    createHallway(35, 68, 20, 75, 3); // Nối C -> D/E

    // --- ĐẶT CÁC ĐỐI TƯỢNG QUAN TRỌNG (Vị trí được chọn thủ công) ---
    map[8][8] = LEGEND.START_POS;            // Bắt đầu trong Khu A
    map[18][12] = LEGEND.ITEM_1;             // Vật phẩm 1 trong ngõ cụt của Khu A
    
    map[35][85] = LEGEND.ITEM_2;             // Vật phẩm 2 trong Sảnh cột B
    
    map[42][42] = LEGEND.ITEM_3;             // Vật phẩm 3 trong một "văn phòng" của Khu C
    
    map[88][12] = LEGEND.ITEM_4;             // Vật phẩm 4 trong Phòng cuối E
    
    map[88][13] = LEGEND.EXIT_POS;           // Lối ra ngay cạnh vật phẩm cuối cùng

    return map;
}

// --- HÀM XUẤT RA MAP ---
function exportMap() {
    const finalMap = generateFixedBackroomsMap();
    let mapString = 'export const FIXED_MAP_LAYOUT = [\n';
    finalMap.forEach((row, index) => {
        mapString += `  /*${String(index).padStart(2, ' ')}*/[${row.join(',')}],\n`;
    });
    mapString += '];';
    console.log(mapString);
}

// Chạy hàm để xuất map
exportMap();