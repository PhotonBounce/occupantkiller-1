window.LancasterCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 22120;
    var BASE_Y = 0;
    var BASE_Z = 0;

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
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function buildCastleHill() {
        // Castle Hill mound
        makeCylinder(55, 80, 22, 8, 0x7A6B50, 0, 11, 0);
        // Hill grass cap
        makeCylinder(56, 56, 3, 8, 0x5C7A3E, 0, 23, 0);
    }

    function buildLancasterCastle() {
        // === MAIN CASTLE CURTAIN WALL ===
        // North wall
        makeBox(120, 14, 5, 0xAAAAAA, 0, 32, -50);
        // South wall
        makeBox(120, 14, 5, 0xAAAAAA, 0, 32, 50);
        // East wall
        makeBox(5, 14, 100, 0xAAAAAA, 60, 32, 0);
        // West wall
        makeBox(5, 14, 100, 0xAAAAAA, -60, 32, 0);

        // === HADRIAN'S TOWER (huge round keep, NW corner) ===
        makeCylinder(14, 15, 30, 12, 0x999999, -55, 40, -45);
        // Hadrian's Tower battlements ring
        makeCylinder(15, 15, 3, 12, 0x888888, -55, 57, -45);
        // Hadrian's Tower conical roof
        makeCone(14, 12, 12, 0x776655, -55, 69, -45);

        // === WELL TOWER (NE corner) ===
        makeCylinder(10, 11, 26, 10, 0x9A9A9A, 55, 37, -45);
        makeCylinder(11, 11, 3, 10, 0x888888, 55, 52, -45);
        makeCone(10, 9, 10, 0x776655, 55, 58, -45);

        // === JOHN OF GAUNT'S GATEWAY (south entrance) ===
        // Left tower of gateway
        makeCylinder(8, 9, 24, 10, 0xAAAAAA, -12, 37, 50);
        makeCone(8, 8, 10, 0x776655, -12, 50, 50);
        // Right tower of gateway
        makeCylinder(8, 9, 24, 10, 0xAAAAAA, 12, 37, 50);
        makeCone(8, 8, 10, 0x776655, 12, 50, 50);
        // Gateway arch lintel
        makeBox(24, 5, 6, 0x999999, 0, 34, 50);
        // Gateway portcullis slot box
        makeBox(8, 14, 3, 0x777777, 0, 34, 53);

        // === SHIRE HALL (main hall building inside castle) ===
        makeBox(60, 16, 30, 0xB0B0B0, 0, 33, -10);
        // Shire Hall roof
        makeBox(62, 4, 32, 0x8A8A8A, 0, 41, -10);
        // Shire Hall windows (decorative boxes)
        makeBox(4, 6, 1, 0x555555, -20, 34, 26);
        makeBox(4, 6, 1, 0x555555, 0, 34, 26);
        makeBox(4, 6, 1, 0x555555, 20, 34, 26);

        // === CASTLE KEEP (central tower) ===
        makeBox(22, 28, 22, 0xA0A0A0, 0, 41, -15);
        // Keep battlements
        makeBox(24, 4, 24, 0x909090, 0, 56, -15);
        // Keep corner turrets
        makeBox(5, 6, 5, 0x888888, -12, 58, -27);
        makeBox(5, 6, 5, 0x888888, 12, 58, -27);
        makeBox(5, 6, 5, 0x888888, -12, 58, -3);
        makeBox(5, 6, 5, 0x888888, 12, 58, -3);

        // === ADRIAN'S TOWER (SW corner) ===
        makeCylinder(9, 10, 22, 10, 0x9E9E9E, -55, 35, 45);
        makeCone(9, 8, 10, 0x776655, -55, 47, 45);

        // === SE CORNER TOWER ===
        makeCylinder(9, 10, 22, 10, 0x9E9E9E, 55, 35, 45);
        makeCone(9, 8, 10, 0x776655, 55, 47, 45);

        // Castle courtyard ground
        makeBox(110, 1, 90, 0x8A8070, 0, 25, 0);
    }

    function buildPrioryChurch() {
        // St Mary's Priory — beside castle to the east
        // Nave
        makeBox(40, 18, 18, 0xD4C8A0, 110, 30, -20);
        // Chancel
        makeBox(20, 16, 14, 0xCEC2A0, 140, 29, -20);
        // Tower
        makeBox(12, 32, 12, 0xD0C49C, 92, 41, -20);
        // Tower battlements
        makeBox(14, 4, 14, 0xC8BC98, 92, 59, -20);
        // Tower pinnacles
        makeCone(2, 6, 4, 0xBEB49A, 85, 63, -27);
        makeCone(2, 6, 4, 0xBEB49A, 99, 63, -27);
        makeCone(2, 6, 4, 0xBEB49A, 85, 63, -13);
        makeCone(2, 6, 4, 0xBEB49A, 99, 63, -13);
        // Transept
        makeBox(16, 15, 36, 0xD2C69E, 122, 29, -20);
        // Porch
        makeBox(8, 10, 8, 0xC8BC98, 108, 28, -3);
        // Priory roof ridge
        makeBox(42, 3, 2, 0xB8AC8E, 110, 40, -20);
    }

    function buildRiverLune() {
        // River Lune — flowing west to Morecambe Bay
        // Main river channel (wide)
        makeBox(600, 2, 80, 0x4682B4, -280, 1, 200);
        // River bend section
        makeBox(100, 2, 60, 0x4682B4, -500, 1, 170);
        // Estuary widening toward bay
        makeBox(300, 1, 200, 0x5A8EC0, -600, 0, 260);
        // River bank north
        makeBox(600, 3, 20, 0x8A7A5A, -280, 1, 160);
        // River bank south
        makeBox(600, 3, 20, 0x8A7A5A, -280, 1, 280);
        // Salmon weir (low box across river)
        makeBox(3, 3, 80, 0x9A8A6A, -100, 2, 200);
    }

    function buildLancasterAqueduct() {
        // Rennie's 1797 Aqueduct — 5 arches over River Lune
        // Main aqueduct deck
        makeBox(80, 5, 12, 0xD3D3D3, -270, 22, 200);
        // Pier 1
        makeBox(8, 20, 10, 0xC8C8C8, -300, 11, 200);
        // Pier 2
        makeBox(8, 20, 10, 0xC8C8C8, -280, 11, 200);
        // Pier 3 (central)
        makeBox(8, 20, 10, 0xC8C8C8, -260, 11, 200);
        // Pier 4
        makeBox(8, 20, 10, 0xC8C8C8, -240, 11, 200);
        // Pier 5
        makeBox(8, 20, 10, 0xC8C8C8, -220, 11, 200);
        // Arch spandrels (decorative boxes between piers)
        makeBox(12, 8, 8, 0xBBBBBB, -290, 15, 200);
        makeBox(12, 8, 8, 0xBBBBBB, -270, 15, 200);
        makeBox(12, 8, 8, 0xBBBBBB, -250, 15, 200);
        makeBox(12, 8, 8, 0xBBBBBB, -230, 15, 200);
        // Canal water on top
        makeBox(70, 2, 7, 0x4A90C4, -265, 25, 200);
        // Aqueduct approach embankment north
        makeBox(60, 10, 12, 0xB0A890, -345, 6, 200);
        // Aqueduct approach embankment south
        makeBox(60, 10, 12, 0xB0A890, -185, 6, 200);
    }

    function buildAshtonMemorial() {
        // Ashton Memorial in Williamson Park (SE of city on hill)
        // Park hill
        makeCylinder(50, 70, 18, 8, 0x6A8A50, 220, 9, 180);
        // Memorial base plinth (wide square)
        makeBox(28, 6, 28, 0xD3D3D3, 220, 21, 180);
        // Lower colonnade drum
        makeCylinder(14, 14, 8, 16, 0xD0D0D0, 220, 28, 180);
        // Upper drum / rotunda
        makeCylinder(11, 11, 10, 16, 0xD5D5D5, 220, 37, 180);
        // Dome
        makeSphere(11, 16, 12, 0xD3D3D3, 220, 49, 180);
        // Lantern on dome
        makeCylinder(3, 3, 6, 8, 0xCCCCCC, 220, 61, 180);
        // Lantern cap
        makeCone(3, 4, 8, 0xBBBBBB, 220, 67, 180);
        // Portico columns north
        makeCylinder(1, 1, 8, 8, 0xD8D8D8, 214, 25, 166);
        makeCylinder(1, 1, 8, 8, 0xD8D8D8, 220, 25, 166);
        makeCylinder(1, 1, 8, 8, 0xD8D8D8, 226, 25, 166);
        // Portico columns south
        makeCylinder(1, 1, 8, 8, 0xD8D8D8, 214, 25, 194);
        makeCylinder(1, 1, 8, 8, 0xD8D8D8, 220, 25, 194);
        makeCylinder(1, 1, 8, 8, 0xD8D8D8, 226, 25, 194);
    }

    function buildWilliamsonPark() {
        // Park ground surface
        makeBox(200, 1, 200, 0x4CAF50, 180, 8, 150);
        // Tree clusters (cylinders for trunks, spheres for canopy)
        makeCylinder(1, 1, 8, 6, 0x5C4A2A, 160, 12, 130);
        makeSphere(5, 8, 6, 0x3A8A30, 160, 19, 130);
        makeCylinder(1, 1, 8, 6, 0x5C4A2A, 175, 12, 125);
        makeSphere(5, 8, 6, 0x3A8A30, 175, 19, 125);
        makeCylinder(1, 1, 10, 6, 0x5C4A2A, 195, 13, 135);
        makeSphere(6, 8, 6, 0x2E7828, 195, 21, 135);
        makeCylinder(1, 1, 8, 6, 0x5C4A2A, 250, 12, 160);
        makeSphere(5, 8, 6, 0x3A8A30, 250, 19, 160);
        makeCylinder(1, 1, 9, 6, 0x5C4A2A, 240, 12, 190);
        makeSphere(6, 8, 6, 0x2E7828, 240, 20, 190);
        // Park path
        makeBox(120, 1, 4, 0xC8B890, 190, 9, 165);
        // Park wall perimeter
        makeBox(200, 3, 3, 0xA0956A, 180, 10, 55);
        makeBox(200, 3, 3, 0xA0956A, 180, 10, 245);
        makeBox(3, 3, 190, 0xA0956A, 85, 10, 150);
    }

    function buildMorecambeBay() {
        // Morecambe Bay — huge shallow tidal estuary to the west
        // Main bay water
        makeBox(800, 1, 600, 0x006994, -900, 0, 100);
        // Mudflats (low, sandy colored)
        makeBox(300, 1, 200, 0xC2A882, -680, 0, 50);
        makeBox(200, 1, 180, 0xC2A882, -750, 0, 300);
        // Salt marsh
        makeBox(150, 1, 100, 0x6A8A50, -600, 0, 380);
        // Bay edge — tidal line
        makeBox(600, 2, 15, 0xA0C8D8, -750, 0, 160);
    }

    function buildCustomHouse() {
        // Georgian Custom House on the Quay
        // Main building
        makeBox(28, 16, 14, 0xDEB887, -80, 10, 175);
        // Pediment / triangular front
        makeBox(28, 5, 2, 0xD4A870, -80, 19, 168);
        // Columns
        makeCylinder(1, 1, 14, 6, 0xE8D0A0, -90, 10, 168);
        makeCylinder(1, 1, 14, 6, 0xE8D0A0, -82, 10, 168);
        makeCylinder(1, 1, 14, 6, 0xE8D0A0, -74, 10, 168);
        makeCylinder(1, 1, 14, 6, 0xE8D0A0, -66, 10, 168);
        // Roof cupola
        makeCylinder(4, 5, 4, 8, 0xD4A870, -80, 22, 175);
        makeCone(4, 5, 8, 0xC89A5A, -80, 27, 175);
        // Quayside wall
        makeBox(100, 4, 4, 0xC0A070, -80, 4, 162);
        // Warehouse beside Custom House
        makeBox(24, 14, 16, 0xC8A070, -50, 9, 175);
        makeBox(24, 3, 16, 0xA88050, -50, 17, 175);
    }

    function buildVictorianTown() {
        // Market Square and Victorian commercial district
        // Market Square paving
        makeBox(60, 1, 60, 0xB8B0A0, 80, 26, 40);
        // Town Hall
        makeBox(32, 22, 20, 0xC8B89A, 80, 37, 40);
        // Town Hall columns
        makeCylinder(1, 1, 20, 6, 0xD0C0A0, 68, 37, 30);
        makeCylinder(1, 1, 20, 6, 0xD0C0A0, 74, 37, 30);
        makeCylinder(1, 1, 20, 6, 0xD0C0A0, 80, 37, 30);
        makeCylinder(1, 1, 20, 6, 0xD0C0A0, 86, 37, 30);
        makeCylinder(1, 1, 20, 6, 0xD0C0A0, 92, 37, 30);
        // Town Hall clock tower
        makeBox(10, 32, 10, 0xC0B090, 80, 53, 40);
        makeCone(6, 8, 4, 0xA89060, 80, 70, 40);
        // Victorian commercial block 1
        makeBox(30, 18, 14, 0xC4B494, 130, 36, 40);
        makeBox(30, 3, 14, 0xA89870, 130, 46, 40);
        // Victorian commercial block 2
        makeBox(25, 16, 14, 0xBCAA8A, 40, 35, 40);
        // Victorian commercial block 3
        makeBox(28, 20, 14, 0xC8B890, 80, 37, 80);
        // Market hall
        makeBox(50, 14, 30, 0xBEAE8E, 150, 34, 80);
        makeBox(52, 5, 32, 0xA89870, 150, 42, 80);
        // Street lamp post
        makeCylinder(0, 0, 0, 6, 0x444444, 100, 29, 30);
        makeSphere(1, 6, 6, 0xFFEE88, 100, 32, 30);
        makeCylinder(0, 0, 0, 6, 0x444444, 60, 29, 30);
        makeSphere(1, 6, 6, 0xFFEE88, 60, 32, 30);
        // Narrow cobbled street
        makeBox(120, 1, 8, 0xA09080, 100, 27, 28);
    }

    function buildCanalBridge() {
        // Lancaster Canal road bridge over canal
        makeBox(30, 4, 12, 0xC0B090, -180, 14, 160);
        // Bridge parapets
        makeBox(30, 3, 2, 0xB0A080, -180, 16, 154);
        makeBox(30, 3, 2, 0xB0A080, -180, 16, 166);
        // Canal water approaching aqueduct
        makeBox(200, 2, 7, 0x4A90C4, -130, 13, 160);
    }

    function buildGroundTerrain() {
        // City ground plane sections
        makeBox(400, 1, 400, 0x9A8E78, 60, 24, 20);
        makeBox(300, 1, 200, 0x9A9A80, -100, 5, 100);
        // Hillside connecting castle to town
        makeBox(100, 8, 80, 0x7A8A60, 60, 20, 30);
    }

    function build() {
        buildGroundTerrain();
        buildCastleHill();
        buildLancasterCastle();
        buildPrioryChurch();
        buildRiverLune();
        buildLancasterAqueduct();
        buildAshtonMemorial();
        buildWilliamsonPark();
        buildMorecambeBay();
        buildCustomHouse();
        buildVictorianTown();
        buildCanalBridge();
    }

    function update(delta) {
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };

}());
