window.AntrimCoast = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeLambert(hex) {
        return new THREE.MeshLambertMaterial({ color: hex });
    }

    function makeBox(w, h, d, hex, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(hex);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function build() {
        var cx = 19480;

        // -------------------------------------------------------
        // ANTRIM COAST ROAD — winding coastal road sections
        // dark tarmac 0x555555 slabs hugging cliff base
        // -------------------------------------------------------
        var roadData = [
            [120, 1, 18,  cx,        0.5,  0],
            [120, 1, 18,  cx + 100,  0.5,  12],
            [120, 1, 18,  cx + 200,  0.5,  20],
            [120, 1, 18,  cx + 300,  0.5,  10],
            [120, 1, 18,  cx + 400,  0.5,  -5],
            [120, 1, 18,  cx + 500,  0.5,  -15],
            [120, 1, 18,  cx - 100,  0.5,  8],
            [120, 1, 18,  cx - 200,  0.5,  18],
            [120, 1, 18,  cx - 300,  0.5,  14],
            [120, 1, 18,  cx - 400,  0.5,  3]
        ];
        for (var ri = 0; ri < roadData.length; ri++) {
            var rd = roadData[ri];
            addMesh(makeBox(rd[0], rd[1], rd[2], 0x555555, rd[3], rd[4], rd[5]));
        }

        // Road white centre-line dashes
        var dashData = [
            [4, 0.6, 1, cx,        1,  0],
            [4, 0.6, 1, cx + 100,  1,  12],
            [4, 0.6, 1, cx + 200,  1,  20],
            [4, 0.6, 1, cx + 300,  1,  10],
            [4, 0.6, 1, cx - 100,  1,  8],
            [4, 0.6, 1, cx - 200,  1,  18]
        ];
        for (var di = 0; di < dashData.length; di++) {
            var dd = dashData[di];
            addMesh(makeBox(dd[0], dd[1], dd[2], 0xFFFFFF, dd[3], dd[4], dd[5]));
        }

        // -------------------------------------------------------
        // BASALT CLIFFS — columnar jointing: vertical rectangular
        // strips packed tightly, dark 0x2F2F2F
        // -------------------------------------------------------
        var cliffColumns = [
            // Main cliff face behind road — series of columns
            [5, 90, 8,  cx - 380,  45,  -55],
            [5, 85, 8,  cx - 373,  42,  -55],
            [5, 95, 8,  cx - 366,  47,  -55],
            [5, 88, 8,  cx - 359,  44,  -55],
            [5, 92, 8,  cx - 352,  46,  -55],
            [5, 80, 8,  cx - 345,  40,  -55],
            [5, 87, 8,  cx - 338,  43,  -55],
            [5, 93, 8,  cx - 331,  46,  -55],
            [5, 86, 8,  cx - 324,  43,  -55],
            [5, 90, 8,  cx - 317,  45,  -55],
            [5, 84, 8,  cx - 310,  42,  -55],
            [5, 91, 8,  cx - 303,  45,  -55],
            // Second cliff section
            [5, 100, 8, cx + 200,  50,  -60],
            [5,  95, 8, cx + 207,  47,  -60],
            [5, 102, 8, cx + 214,  51,  -60],
            [5,  98, 8, cx + 221,  49,  -60],
            [5,  96, 8, cx + 228,  48,  -60],
            [5, 104, 8, cx + 235,  52,  -60],
            [5,  99, 8, cx + 242,  49,  -60],
            [5, 101, 8, cx + 249,  50,  -60],
            [5,  97, 8, cx + 256,  48,  -60],
            [5, 103, 8, cx + 263,  51,  -60],
            // Cliff top cap
            [80, 12, 12, cx - 345,  96,  -55],
            [80, 12, 12, cx + 228,  108, -60]
        ];
        for (var ci = 0; ci < cliffColumns.length; ci++) {
            var cd = cliffColumns[ci];
            addMesh(makeBox(cd[0], cd[1], cd[2], 0x2F2F2F, cd[3], cd[4], cd[5]));
        }

        // -------------------------------------------------------
        // NORTH CHANNEL SEA — 0x1E6BA8
        // Large sea floor boxes to the east
        // -------------------------------------------------------
        addMesh(makeBox(800, 2, 300, 0x1E6BA8, cx + 200,  -1,  180));
        addMesh(makeBox(600, 2, 200, 0x1E6BA8, cx - 200,  -1,  160));
        addMesh(makeBox(400, 2, 150, 0x1E6BA8, cx + 500,  -1,  220));
        // Sea surface ripple suggestion — slightly raised boxes
        addMesh(makeBox(200, 1, 80,  0x2378B5, cx + 100,   0.5, 200));
        addMesh(makeBox(150, 1, 60,  0x2378B5, cx - 50,    0.5, 170));
        addMesh(makeBox(180, 1, 70,  0x2378B5, cx + 350,   0.5, 240));

        // -------------------------------------------------------
        // SCOTLAND ON HORIZON — white box silhouette 0xFFFAF0
        // just visible across the channel
        // -------------------------------------------------------
        addMesh(makeBox(400, 30, 10, 0xFFFAF0, cx + 100,   15, 700));
        addMesh(makeBox(200, 18, 10, 0xFFFAF0, cx + 380,    9, 710));
        addMesh(makeBox(150, 22, 10, 0xFFFAF0, cx - 100,   11, 690));

        // -------------------------------------------------------
        // LARNE LOUGH — sea inlet 0x006994
        // -------------------------------------------------------
        addMesh(makeBox(300, 2, 120, 0x006994, cx - 450,   -1,  50));
        addMesh(makeBox(200, 2,  80, 0x006994, cx - 400,   -1,  80));
        // Lough narrow mouth
        addMesh(makeBox(60,  2,  40, 0x006994, cx - 350,   -1,  30));

        // -------------------------------------------------------
        // BALLYGALLY CASTLE — 17th century towerhouse 0x8B7355
        // on clifftop, now a hotel
        // -------------------------------------------------------
        // Main tower keep
        addMesh(makeBox(18, 40, 18, 0x8B7355, cx - 160,  20, -70));
        // Corner turret
        addMesh(makeBox(6,  50,  6, 0x8B7355, cx - 152,  25, -62));
        // Battlement crenels
        addMesh(makeBox(4,   4,  4, 0x8B7355, cx - 168,  42, -70));
        addMesh(makeBox(4,   4,  4, 0x8B7355, cx - 161,  42, -70));
        addMesh(makeBox(4,   4,  4, 0x8B7355, cx - 154,  42, -70));
        // Hotel wing extension
        addMesh(makeBox(30, 18, 14, 0x8B7355, cx - 145,   9, -72));
        // Castle roof cone
        var castleCone = new THREE.Mesh(
            new THREE.ConeGeometry(6, 12, 4),
            makeLambert(0x5C4A2A)
        );
        castleCone.position.set(cx - 152, 57, -62);
        addMesh(castleCone);

        // -------------------------------------------------------
        // GLENARM VILLAGE — oldest village in Ulster
        // 0xFFFFF0 white painted buildings
        // -------------------------------------------------------
        var glenarmBuildings = [
            [14, 10, 12, cx - 60,   5, -80],
            [12, 12, 10, cx - 78,   6, -82],
            [16,  9, 12, cx - 44,   4, -78],
            [10, 14, 10, cx - 90,   7, -84],
            [12, 10, 12, cx - 30,   5, -76],
            [18,  8, 14, cx - 15,   4, -75]
        ];
        for (var gi = 0; gi < glenarmBuildings.length; gi++) {
            var gb = glenarmBuildings[gi];
            addMesh(makeBox(gb[0], gb[1], gb[2], 0xFFFFF0, gb[3], gb[4], gb[5]));
        }
        // Village roofs — dark slate 0x4A4A4A
        var glenarmRoofs = [
            [14, 4, 12, cx - 60,  12, -80],
            [12, 5, 10, cx - 78,  15, -82],
            [16, 4, 12, cx - 44,  11, -78],
            [10, 6, 10, cx - 90,  17, -84],
            [12, 4, 12, cx - 30,  12, -76]
        ];
        for (var gr = 0; gr < glenarmRoofs.length; gr++) {
            var gro = glenarmRoofs[gr];
            addMesh(makeBox(gro[0], gro[1], gro[2], 0x4A4A4A, gro[3], gro[4], gro[5]));
        }

        // GLENARM CASTLE GROUNDS — castle tower visible
        addMesh(makeBox(16, 35, 16, 0x8B8000, cx - 110,  17, -95));
        // Castle grounds wall
        addMesh(makeBox(60,  4,  2, 0x8B8000, cx -  90,   2, -88));
        addMesh(makeBox( 2,  4, 30, 0x8B8000, cx -  60,   2, -95));
        // Castle cone spire
        var glenarmSpire = new THREE.Mesh(
            new THREE.ConeGeometry(5, 14, 4),
            makeLambert(0x556B2F)
        );
        glenarmSpire.position.set(cx - 110, 42, -95);
        addMesh(glenarmSpire);

        // -------------------------------------------------------
        // GLENARIFF WATERFALL — "Queen of the Glens"
        // 0xC0C0C0 white cascade — stack of thin white boxes
        // -------------------------------------------------------
        var fallX = cx + 280;
        var fallZ = -50;
        for (var fi = 0; fi < 14; fi++) {
            var fallW = 8 - fi * 0.3;
            var fallY = 95 - fi * 6;
            addMesh(makeBox(fallW, 3, 3, 0xC0C0C0, fallX + fi * 0.5, fallY, fallZ));
        }
        // Waterfall plunge pool
        addMesh(makeBox(14, 1, 14, 0x87CEEB, fallX + 4, 10, fallZ + 2));
        // Waterfall mist sphere
        var mistSphere = new THREE.Mesh(
            new THREE.SphereGeometry(6, 6, 4),
            makeLambert(0xE8E8E8)
        );
        mistSphere.position.set(fallX + 4, 14, fallZ + 2);
        addMesh(mistSphere);

        // -------------------------------------------------------
        // NINE GLENS OF ANTRIM — rolling green glen valleys
        // 0x228B22 visible between cliff ridges
        // -------------------------------------------------------
        var glenData = [
            [80, 20, 60, cx - 280,  10, -120, 0x228B22],
            [70, 15, 50, cx - 180,   7, -130, 0x2E8B57],
            [90, 25, 70, cx + 80,   12, -140, 0x228B22],
            [75, 18, 55, cx + 180,   9, -150, 0x32CD32],
            [85, 22, 65, cx + 380,  11, -130, 0x228B22],
            [65, 14, 45, cx + 450,   7, -110, 0x2E8B57],
            // Glen ridge walls
            [10, 30, 60, cx - 240,  15, -120, 0x3D3D2B],
            [10, 28, 50, cx - 110,  14, -130, 0x3D3D2B],
            [10, 32, 70, cx + 120,  16, -140, 0x3D3D2B]
        ];
        for (var glen = 0; glen < glenData.length; glen++) {
            var gd = glenData[glen];
            addMesh(makeBox(gd[0], gd[1], gd[2], gd[6], gd[3], gd[4], gd[5]));
        }

        // -------------------------------------------------------
        // MURLOUGH BAY — hidden bay, McCarthy's beach
        // 0x1E6BA8 with sandy beach 0xF5DEB3
        // -------------------------------------------------------
        addMesh(makeBox(120, 2, 80,  0x1E6BA8, cx + 400,  -1,  30));
        addMesh(makeBox(100, 1, 20,  0xF5DEB3, cx + 400,   0.5, 60));
        // Bay headland rocks
        addMesh(makeBox(20,  12, 15, 0x696969, cx + 350,   6,  20));
        addMesh(makeBox(15,   9, 12, 0x696969, cx + 455,   4,  25));
        // Bay pebbles suggestion
        addMesh(makeBox(30,  1, 10,  0xA0A0A0, cx + 390,   0.5, 58));

        // -------------------------------------------------------
        // RED BAY CASTLE RUINS — 0x808080 on headland
        // red sandstone cliffs 0xCD5C5C
        // -------------------------------------------------------
        // Red sandstone cliff
        addMesh(makeBox(60, 50, 20,  0xCD5C5C, cx + 520,  25, -30));
        addMesh(makeBox(40, 40, 16,  0xCD5C5C, cx + 560,  20, -28));
        // Castle ruin walls — broken tops
        addMesh(makeBox(14, 22, 12,  0x808080, cx + 520,  61, -38));
        addMesh(makeBox( 2, 28,  2,  0x808080, cx + 514,  64, -32));
        addMesh(makeBox( 2, 24,  2,  0x808080, cx + 526,  60, -32));
        // Broken wall section
        addMesh(makeBox(12,  8, 10,  0x808080, cx + 520,  47, -38));
        addMesh(makeBox( 6, 14,  2,  0x808080, cx + 534,  57, -38));
        // Castle rubble
        addMesh(makeBox(10,  3, 10,  0x696969, cx + 518,  52, -42));

        // -------------------------------------------------------
        // CLIFF-TOP VEGETATION — low green shrub boxes
        // -------------------------------------------------------
        var shrubData = [
            [cx - 340,  102,  -50],
            [cx - 320,  104,  -52],
            [cx - 300,   98,  -48],
            [cx + 210,  114,  -58],
            [cx + 230,  112,  -56],
            [cx + 250,  116,  -60]
        ];
        for (var si = 0; si < shrubData.length; si++) {
            var sd = shrubData[si];
            addMesh(makeBox(8, 4, 8, 0x2D6A2D, sd[0], sd[1], sd[2]));
        }
        // Gorse bushes — yellow 0xFFD700
        addMesh(makeBox(6, 3, 6, 0xFFD700, cx - 330, 101, -48));
        addMesh(makeBox(5, 3, 5, 0xFFD700, cx + 220, 113, -56));

        // -------------------------------------------------------
        // COASTAL ROCK OUTCROPS at sea edge
        // -------------------------------------------------------
        var rockData = [
            [12, 8,  10, 0x4A4A4A, cx - 20,  4,  80],
            [ 8, 5,   8, 0x3D3D3D, cx + 30,  2,  90],
            [15, 10, 12, 0x4A4A4A, cx + 80,  5, 100],
            [10, 6,   9, 0x555555, cx + 150,  3,  85],
            [ 7, 4,   7, 0x3D3D3D, cx - 80,  2,  75],
            [11, 7,  10, 0x4A4A4A, cx + 320,  4, 110]
        ];
        for (var rok = 0; rok < rockData.length; rok++) {
            var rkd = rockData[rok];
            addMesh(makeBox(rkd[0], rkd[1], rkd[2], rkd[6 - 3], rkd[3], rkd[4], rkd[5]));
        }

        // -------------------------------------------------------
        // GROUND / COASTAL SHELF — dark grass headland
        // -------------------------------------------------------
        addMesh(makeBox(1200, 2, 80,  0x3B5323, cx,       -1, -30));
        addMesh(makeBox(1200, 2, 40,  0x2E4A1C, cx,       -1, -70));
        // Lower coastal shelf rock
        addMesh(makeBox(1200, 2, 60,  0x5A5A4A, cx,       -1,  30));

        // -------------------------------------------------------
        // LIGHTHOUSE — white cylinder on headland
        // -------------------------------------------------------
        var lighthouseBody = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 5, 36, 8),
            makeLambert(0xF5F5F5)
        );
        lighthouseBody.position.set(cx - 500, 18, -40);
        addMesh(lighthouseBody);
        // Lighthouse lantern room
        addMesh(makeBox(10, 6, 10, 0x4A4A4A, cx - 500, 39, -40));
        // Lighthouse red band
        addMesh(makeBox(12, 4, 12, 0xCC0000, cx - 500, 20, -40));
        // Lighthouse cap
        var lighthouseCap = new THREE.Mesh(
            new THREE.ConeGeometry(5, 8, 8),
            makeLambert(0x333333)
        );
        lighthouseCap.position.set(cx - 500, 45, -40);
        addMesh(lighthouseCap);

        // -------------------------------------------------------
        // FISHING HARBOUR — stone pier boxes
        // -------------------------------------------------------
        addMesh(makeBox(80,  4, 10,  0x808080, cx - 600,   2,  60));
        addMesh(makeBox( 4,  4, 60,  0x808080, cx - 560,   2,  90));
        // Moored boat hulls
        addMesh(makeBox(14,  5, 6,   0x8B4513, cx - 575,   2.5, 68));
        addMesh(makeBox(12,  4, 5,   0x2244AA, cx - 585,   2.5, 74));
        // Boat masts — thin cylinders
        var mast1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 18, 4),
            makeLambert(0x8B4513)
        );
        mast1.position.set(cx - 575, 12, 68);
        addMesh(mast1);
        var mast2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 16, 4),
            makeLambert(0x8B4513)
        );
        mast2.position.set(cx - 585, 11, 74);
        addMesh(mast2);

        // -------------------------------------------------------
        // TELEGRAPH / POWER POLES along road
        // -------------------------------------------------------
        var polePositions = [
            [cx - 250,  -80],
            [cx - 150,  -80],
            [cx - 50,   -80],
            [cx + 50,   -80],
            [cx + 150,  -80],
            [cx + 250,  -80]
        ];
        for (var pi = 0; pi < polePositions.length; pi++) {
            var pp = polePositions[pi];
            var pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.6, 18, 4),
                makeLambert(0x8B6914)
            );
            pole.position.set(pp[0], 9, pp[1]);
            addMesh(pole);
            // Cross arm
            addMesh(makeBox(8, 0.8, 0.8, 0x8B6914, pp[0], 17, pp[1]));
        }

        // -------------------------------------------------------
        // HEATHER ON CLIFFTOP — purple spheres / boxes
        // -------------------------------------------------------
        var heatherData = [
            [cx - 355,  100, -50],
            [cx - 315,  102, -52],
            [cx + 215,  112, -58],
            [cx + 245,  114, -57]
        ];
        for (var hi = 0; hi < heatherData.length; hi++) {
            var hd = heatherData[hi];
            var heather = new THREE.Mesh(
                new THREE.SphereGeometry(3, 5, 4),
                makeLambert(0x9B59B6)
            );
            heather.position.set(hd[0], hd[1], hd[2]);
            addMesh(heather);
        }

        // -------------------------------------------------------
        // DISTANT HILLS inland — dark green ridges
        // -------------------------------------------------------
        addMesh(makeBox(300, 60, 80,  0x1A5E1A, cx - 200,  30, -200));
        addMesh(makeBox(250, 50, 70,  0x1E6B1E, cx + 150,  25, -220));
        addMesh(makeBox(200, 70, 80,  0x174D17, cx + 400,  35, -210));
        // Hill summits — darker caps
        addMesh(makeBox(120, 15, 40,  0x153F15, cx - 200,  63, -200));
        addMesh(makeBox(100, 12, 35,  0x153F15, cx + 150,  53, -220));
        addMesh(makeBox( 80, 18, 40,  0x153F15, cx + 400,  73, -210));

        // -------------------------------------------------------
        // FENCE along cliff edge — low wooden fence posts
        // -------------------------------------------------------
        var fenceXList = [
            cx - 380, cx - 350, cx - 320, cx - 290, cx - 260,
            cx + 180, cx + 210, cx + 240, cx + 270, cx + 300
        ];
        for (var fei = 0; fei < fenceXList.length; fei++) {
            addMesh(makeBox(1, 5, 1, 0x8B6914, fenceXList[fei], 2.5, -42));
            addMesh(makeBox(29, 1, 0.5, 0x8B6914, fenceXList[fei] + 14, 3.5, -42));
        }

        // -------------------------------------------------------
        // CAVE OPENING at cliff base — dark recesses
        // -------------------------------------------------------
        addMesh(makeBox(12, 10, 6, 0x0A0A0A, cx + 100, 5, -58));
        addMesh(makeBox(10,  8, 6, 0x0A0A0A, cx - 220,  4, -56));

        // -------------------------------------------------------
        // SEABIRDS / ROCKS at waterline
        // -------------------------------------------------------
        addMesh(makeBox(4, 2, 3, 0xFFFFFF, cx + 30,  1,  95));
        addMesh(makeBox(3, 2, 2, 0xFFFFFF, cx + 50,  1, 100));
        addMesh(makeBox(4, 2, 3, 0xFFFFFF, cx - 40,  1,  88));

    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
