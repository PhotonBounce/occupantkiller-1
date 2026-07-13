window.MayoWestport = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18240;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildClewBay();
        buildDrumlinIslands();
        buildWestportHouse();
        buildCarrowbegRiver();
        buildMall();
        buildOctagonSquare();
        buildGeorgianShopfronts();
        buildStMarysChurch();
        buildCroaghPatrick();
        buildWestportHarbour();
        buildMattMolloysPub();
        buildAmbientTrees();
    }

    function buildGround() {
        // Large flat ground using boxes laid as ground tiles
        makeBox(1200, 2, 1200, 0x4A7C3F, 0, -1, 0);
        // Grassy surrounds
        makeBox(600, 1, 400, 0x567D46, -350, -0.5, 200);
        makeBox(400, 1, 600, 0x4E7A3D, 300, -0.5, -250);
    }

    function buildClewBay() {
        // Main bay body — wide, shallow, north-west of town
        makeBox(700, 4, 500, 0x1E6BA8, -180, -3, -420);
        // Second water section — inner bay
        makeBox(400, 3, 300, 0x006994, 60, -2.5, -380);
        // Shoreline strip — darker water at edge
        makeBox(680, 2, 40, 0x1A5F96, -180, -1, -175);
        // Reflective surface patch
        makeBox(300, 1, 200, 0x2278BA, -100, -1.2, -350);
    }

    function buildDrumlinIslands() {
        // ~10 small rounded drumlin islands in Clew Bay
        var islandData = [
            [-80, -280], [-200, -320], [-300, -260], [-150, -400],
            [-40, -360], [-260, -440], [-320, -380], [-120, -460],
            [20, -420], [-380, -310]
        ];
        for (var i = 0; i < islandData.length; i++) {
            var ix = islandData[i][0];
            var iz = islandData[i][1];
            var iw = 18 + (i % 3) * 8;
            var id = 14 + (i % 4) * 6;
            // Island base (soil)
            makeBox(iw, 5, id, 0x8B6914, ix, 1.5, iz);
            // Island top (green)
            makeBox(iw - 4, 3, id - 4, 0x228B22, ix, 5, iz);
        }
    }

    function buildWestportHouse() {
        // Grand Georgian Palladian mansion — wide, 3 storeys
        // Main body — cream/off-white
        makeBox(100, 36, 50, 0xF5F0E8, -260, 18, 80);
        // Central projecting bay (wider centre block)
        makeBox(30, 42, 55, 0xF5F0E8, -260, 21, 80);
        // Triangular pediment over centre bay
        makeCone(22, 14, 4, 0xEDE8DC, -260, 49, 80);
        // Pediment base cornice
        makeBox(32, 3, 8, 0xDDD8CC, -260, 42, 80);
        // Left wing
        makeBox(34, 28, 44, 0xF5F0E8, -311, 14, 80);
        // Right wing
        makeBox(34, 28, 44, 0xF5F0E8, -209, 14, 80);
        // Roof cornice / balustrade strip
        makeBox(104, 4, 52, 0xDDD8CC, -260, 37, 80);
        // Chimney stacks — left
        makeBox(6, 12, 6, 0xCCCCBB, -300, 44, 74);
        makeBox(6, 12, 6, 0xCCCCBB, -300, 44, 86);
        // Chimney stacks — right
        makeBox(6, 12, 6, 0xCCCCBB, -220, 44, 74);
        makeBox(6, 12, 6, 0xCCCCBB, -220, 44, 86);
        // Entrance portico columns (cylinders)
        makeCylinder(1.5, 1.5, 22, 8, 0xF0EBE0, -267, 11, 55);
        makeCylinder(1.5, 1.5, 22, 8, 0xF0EBE0, -260, 11, 55);
        makeCylinder(1.5, 1.5, 22, 8, 0xF0EBE0, -253, 11, 55);
        // Portico entablature
        makeBox(22, 3, 5, 0xDDD8CC, -260, 23, 55);
        // Steps up to entrance
        makeBox(16, 3, 6, 0xE0DDD0, -260, 1.5, 53);
        makeBox(12, 2, 4, 0xE0DDD0, -260, 3.5, 51);
        // Walled estate grounds front wall
        makeBox(160, 6, 2, 0xCCBB99, -260, 3, 50);
        // Side walls
        makeBox(2, 6, 60, 0xCCBB99, -340, 3, 80);
        makeBox(2, 6, 60, 0xCCBB99, -180, 3, 80);
        // Ornamental gate piers
        makeBox(5, 10, 5, 0xDDD0BB, -275, 5, 50);
        makeBox(5, 10, 5, 0xDDD0BB, -245, 5, 50);
        // Gate pier finials
        makeSphere(3, 6, 6, 0xCCBBAA, -275, 11, 50);
        makeSphere(3, 6, 6, 0xCCBBAA, -245, 11, 50);
        // Rear lawn / garden
        makeBox(110, 1, 80, 0x3A8C3A, -260, 0, 130);
    }

    function buildCarrowbegRiver() {
        // River running through the Mall — narrow blue ribbon
        makeBox(8, 2, 320, 0x006994, 0, 0.5, -40);
        // River banks (stone)
        makeBox(4, 3, 320, 0x888880, -6, 1, -40);
        makeBox(4, 3, 320, 0x888880, 6, 1, -40);
        // Small stone bridge over river — Mall crossing
        makeBox(20, 5, 10, 0x999088, 0, 3, 0);
        makeBox(20, 5, 10, 0x999088, 0, 3, 60);
    }

    function buildMall() {
        // The Mall — elegant tree-lined river walkway
        // Footpath left side
        makeBox(18, 1, 280, 0xB8B8B0, -16, 0.5, -20);
        // Footpath right side
        makeBox(18, 1, 280, 0xB8B8B0, 16, 0.5, -20);
        // Lime trees lining the Mall — left row
        var mallTreeZPositions = [-140, -100, -60, -20, 20, 60, 100, 140];
        for (var ti = 0; ti < mallTreeZPositions.length; ti++) {
            var tz = mallTreeZPositions[ti];
            // Left side tree trunk
            makeCylinder(0.8, 1.0, 10, 7, 0x5C3A1E, -22, 5, tz);
            // Left side tree canopy
            makeCylinder(6, 2, 10, 8, 0x228B22, -22, 14, tz);
            // Right side tree trunk
            makeCylinder(0.8, 1.0, 10, 7, 0x5C3A1E, 22, 5, tz);
            // Right side tree canopy
            makeCylinder(6, 2, 10, 8, 0x228B22, 22, 14, tz);
        }
        // Mall bench (box) — a few scattered along walkway
        makeBox(6, 2, 2, 0x7A5C30, -19, 1.5, -80);
        makeBox(6, 2, 2, 0x7A5C30, 19, 1.5, 40);
        // Lamp posts (cylinder + sphere top)
        makeCylinder(0.4, 0.4, 12, 6, 0x333333, -13, 6, -110);
        makeSphere(1.2, 6, 6, 0xFFFFAA, -13, 12.5, -110);
        makeCylinder(0.4, 0.4, 12, 6, 0x333333, 13, 6, 30);
        makeSphere(1.2, 6, 6, 0xFFFFAA, 13, 12.5, 30);
    }

    function buildOctagonSquare() {
        // The Octagon — central town square, octagonal paved area
        // Eight side panels approximated with angled boxes
        makeBox(50, 1, 50, 0xC0C0C0, 60, 0.5, 0);
        makeBox(40, 1, 20, 0xB8B8B8, 60, 0.6, 30);
        makeBox(40, 1, 20, 0xB8B8B8, 60, 0.6, -30);
        makeBox(20, 1, 40, 0xB8B8B8, 90, 0.6, 0);
        makeBox(20, 1, 40, 0xB8B8B8, 30, 0.6, 0);
        // Clocktower at centre of Octagon
        makeBox(8, 28, 8, 0x888880, 60, 14, 0);
        // Clock face panels (slightly lighter)
        makeBox(8, 7, 1, 0xAAAAAA, 60, 22, -4);
        makeBox(8, 7, 1, 0xAAAAAA, 60, 22, 4);
        makeBox(1, 7, 8, 0xAAAAAA, 56, 22, 0);
        makeBox(1, 7, 8, 0xAAAAAA, 64, 22, 0);
        // Clocktower top finial
        makeCone(5, 10, 4, 0x666666, 60, 33, 0);
        // Octagon low decorative wall surround
        makeBox(60, 3, 2, 0xAAAAAA, 60, 1.5, 32);
        makeBox(60, 3, 2, 0xAAAAAA, 60, 1.5, -32);
        makeBox(2, 3, 60, 0xAAAAAA, 92, 1.5, 0);
        makeBox(2, 3, 60, 0xAAAAAA, 28, 1.5, 0);
    }

    function buildGeorgianShopfronts() {
        // Georgian shopfronts along James Street / Bridge Street
        var shopColors = [0xCD5C5C, 0xB05050, 0xC84C4C, 0xA04040, 0xCC6666, 0xBB5555, 0xD06060];
        for (var si = 0; si < 7; si++) {
            var sx = 110 + si * 22;
            // Shop front body
            makeBox(18, 24, 14, shopColors[si], sx, 12, -50);
            // Shop parapet / fascia
            makeBox(20, 4, 2, 0xAA8866, sx, 26, -57);
            // Shop window recess
            makeBox(10, 10, 2, 0x223344, sx, 10, -57);
            // Chimney
            makeBox(4, 8, 4, 0x996655, sx + 4, 30, -50);
        }
        // South side of street — more shopfronts
        for (var sj = 0; sj < 5; sj++) {
            var sjx = 120 + sj * 24;
            makeBox(20, 22, 14, 0xBB6666, sjx, 11, 50);
            makeBox(22, 3, 2, 0xAA8866, sjx, 23, 57);
        }
    }

    function buildStMarysChurch() {
        // Gothic Revival church — grey stone
        // Nave body
        makeBox(22, 30, 50, 0x808080, 180, 15, -60);
        // Chancel (east end)
        makeBox(16, 26, 20, 0x787878, 180, 13, -90);
        // Main tower base
        makeBox(14, 42, 14, 0x787878, 164, 21, -60);
        // Tower top battlements (box crenellations)
        makeBox(16, 4, 4, 0x696969, 164, 44, -54);
        makeBox(16, 4, 4, 0x696969, 164, 44, -66);
        makeBox(4, 4, 16, 0x696969, 158, 44, -60);
        makeBox(4, 4, 16, 0x696969, 170, 44, -60);
        // Spire on tower
        makeCone(8, 40, 8, 0x808080, 164, 66, -60);
        // Buttresses on nave
        makeBox(4, 30, 4, 0x707070, 172, 15, -42);
        makeBox(4, 30, 4, 0x707070, 188, 15, -42);
        makeBox(4, 30, 4, 0x707070, 172, 15, -78);
        makeBox(4, 30, 4, 0x707070, 188, 15, -78);
        // Lancet window inserts (dark recess panels)
        makeBox(4, 12, 1, 0x334455, 180, 20, -86);
        makeBox(4, 12, 1, 0x334455, 174, 20, -86);
        makeBox(4, 12, 1, 0x334455, 186, 20, -86);
        // Churchyard perimeter wall
        makeBox(70, 5, 2, 0x666666, 175, 2.5, -30);
        makeBox(2, 5, 70, 0x666666, 145, 2.5, -65);
        // Churchyard cross (box + box)
        makeBox(2, 14, 2, 0x888888, 160, 7, -40);
        makeBox(8, 2, 2, 0x888888, 160, 12, -40);
    }

    function buildCroaghPatrick() {
        // Croagh Patrick — Ireland's holy mountain, distant conical peak
        // Main mountain body — large cone
        makeCone(160, 340, 12, 0x808080, -460, 170, -520);
        // Snow-cap / lighter summit
        makeCone(30, 60, 10, 0xCCCCCC, -460, 370, -520);
        // Shoulder ridges — stacked boxes for rocky profile
        makeBox(60, 80, 40, 0x707070, -540, 40, -500);
        makeBox(50, 60, 35, 0x787878, -380, 30, -510);
        // Lower foothills
        makeBox(180, 40, 80, 0x5A6E3A, -460, 20, -420);
        // Pilgrimage path marker (small white cross on summit)
        makeBox(3, 20, 3, 0xFFFFFF, -460, 360, -520);
        makeBox(12, 3, 3, 0xFFFFFF, -460, 374, -520);
    }

    function buildWestportHarbour() {
        // Harbour — stone quay walls, dark water
        // Harbour water
        makeBox(240, 3, 180, 0x1A5080, 200, -2, -240);
        // North quay wall
        makeBox(240, 8, 6, 0x696969, 200, 4, -152);
        // South quay wall
        makeBox(240, 8, 6, 0x696969, 200, 4, -328);
        // West quay wall
        makeBox(6, 8, 180, 0x696969, 82, 4, -240);
        // East quay wall (harbour mouth partial)
        makeBox(6, 8, 60, 0x696969, 320, 4, -190);
        makeBox(6, 8, 60, 0x696969, 320, 4, -290);
        // Bollards along north quay
        makeCylinder(1.5, 1.5, 5, 6, 0x555555, 140, 6, -155);
        makeCylinder(1.5, 1.5, 5, 6, 0x555555, 180, 6, -155);
        makeCylinder(1.5, 1.5, 5, 6, 0x555555, 220, 6, -155);
        makeCylinder(1.5, 1.5, 5, 6, 0x555555, 260, 6, -155);
        // Fishing boat 1 — box hull + cylinder mast
        makeBox(20, 5, 8, 0x4466AA, 150, 3.5, -200);
        makeBox(14, 3, 6, 0xCCBBAA, 150, 7, -200);
        makeCylinder(0.6, 0.6, 20, 6, 0x553311, 152, 17, -200);
        // Fishing boat 2
        makeBox(18, 5, 7, 0xAA3333, 190, 3.5, -220);
        makeBox(12, 3, 5, 0xCCBBAA, 190, 7, -220);
        makeCylinder(0.6, 0.6, 18, 6, 0x553311, 192, 16, -220);
        // Fishing boat 3
        makeBox(22, 5, 9, 0x226644, 240, 3.5, -195);
        makeBox(16, 3, 7, 0xDDCCBB, 240, 7, -195);
        makeCylinder(0.6, 0.6, 22, 6, 0x553311, 242, 18, -195);
        // Harbour warehouse / store
        makeBox(40, 18, 20, 0x886655, 290, 9, -165);
        makeBox(40, 3, 22, 0x777766, 290, 19, -165);
        // Harbour crane arm (box)
        makeBox(2, 24, 2, 0x555544, 270, 12, -163);
        makeBox(20, 2, 2, 0x555544, 280, 25, -163);
    }

    function buildMattMolloysPub() {
        // Matt Molloy's pub — famous trad pub on Bridge Street
        // Dark red exterior
        makeBox(18, 20, 14, 0x8B0000, 90, 10, -10);
        // Pub fascia / signboard
        makeBox(20, 5, 2, 0x6B0000, 90, 22, -17);
        // Hanging sign arm (box) + sign board
        makeBox(1, 1, 6, 0x553300, 100, 19, -16);
        makeBox(6, 4, 1, 0xFFDD88, 100, 17, -13);
        // Pub window (dark interior glow)
        makeBox(6, 8, 1, 0x221100, 84, 10, -17);
        makeBox(6, 8, 1, 0x221100, 96, 10, -17);
        // Door
        makeBox(4, 10, 1, 0x4A2200, 90, 7, -17);
        // Chimney
        makeBox(4, 10, 4, 0x664444, 94, 27, -10);
        // Flower boxes under windows
        makeBox(7, 2, 3, 0x228B22, 84, 6.5, -17);
        makeBox(7, 2, 3, 0x228B22, 96, 6.5, -17);
        // Musician figures inside (box figures at window level)
        makeBox(3, 7, 3, 0x332211, 84, 8, -12);
        makeBox(3, 7, 3, 0x332211, 90, 8, -12);
        makeBox(3, 7, 3, 0x332211, 96, 8, -12);
        // Adjacent pub terrace tables (boxes)
        makeBox(5, 2, 5, 0x886633, 80, 1.5, -20);
        makeBox(5, 2, 5, 0x886633, 104, 1.5, -20);
    }

    function buildAmbientTrees() {
        // Scattered trees around town for atmosphere
        var treePositions = [
            [140, -120], [150, 100], [-100, 140], [-160, 50],
            [200, 80], [220, -90], [-50, -180], [80, 180]
        ];
        for (var ai = 0; ai < treePositions.length; ai++) {
            var ax = treePositions[ai][0];
            var az = treePositions[ai][1];
            makeCylinder(0.9, 1.1, 10, 6, 0x5C3A1E, ax, 5, az);
            makeCylinder(5 + (ai % 3), 1, 9, 8, 0x2E7D2E, ax, 14, az);
        }
        // Stone walls bordering fields west of town
        makeBox(120, 4, 2, 0x888880, -150, 2, 160);
        makeBox(2, 4, 100, 0x888880, -210, 2, 110);
        makeBox(80, 4, 2, 0x888880, -130, 2, 60);
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
