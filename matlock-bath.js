window.MatlockBath = (function() {
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
        return mesh;
    }

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 21760;

        // --- GROUND / VALLEY FLOOR ---
        // Valley floor base
        makeBox(600, 4, 200, 0x6B8F47, cx, -2, 0);

        // --- RIVER DERWENT ---
        // Main river channel running through valley
        makeBox(500, 2, 18, 0x4682B4, cx, 0.5, 8);
        makeBox(500, 1, 14, 0x5596C4, cx, 1, 6);
        // River ripples / surface detail
        makeBox(120, 1.5, 10, 0x3A72A0, cx - 180, 1.2, 7);
        makeBox(90, 1.5, 10, 0x3A72A0, cx + 60, 1.2, 8);
        makeBox(110, 1.5, 10, 0x3A72A0, cx + 200, 1.2, 7);

        // --- LIMESTONE CLIFFS (west side) ---
        makeBox(600, 90, 30, 0xC8C8C8, cx, 45, -70);
        makeBox(600, 60, 20, 0xB8B8B8, cx, 30, -80);
        makeBox(600, 40, 15, 0xD0D0D0, cx, 20, -60);
        // Cliff face details / buttresses
        makeBox(30, 80, 10, 0xBBBBBB, cx - 200, 40, -68);
        makeBox(25, 70, 10, 0xBBBBBB, cx - 100, 35, -68);
        makeBox(28, 75, 10, 0xBBBBBB, cx + 50, 38, -68);
        makeBox(22, 65, 10, 0xBBBBBB, cx + 180, 32, -68);
        // Cliff overhangs
        makeBox(80, 8, 12, 0xA8A8A8, cx - 150, 70, -72);
        makeBox(60, 6, 10, 0xA8A8A8, cx + 120, 65, -72);

        // --- LIMESTONE CLIFFS (east side) ---
        makeBox(600, 85, 28, 0xC0C0C0, cx, 42, 90);
        makeBox(600, 55, 18, 0xB0B0B0, cx, 27, 100);
        // East cliff face details
        makeBox(35, 75, 10, 0xB5B5B5, cx - 220, 37, 88);
        makeBox(28, 68, 10, 0xB5B5B5, cx + 80, 34, 88);
        makeBox(30, 72, 10, 0xB5B5B5, cx + 230, 36, 88);

        // --- HEIGHTS OF ABRAHAM (hilltop, west/south ridge) ---
        // Main hilltop mass
        makeBox(220, 50, 80, 0x3A7D44, cx - 80, 95, -120);
        makeBox(180, 30, 60, 0x2D6535, cx - 60, 125, -130);
        // Wooded hilltop trees
        makeSphere(18, 8, 6, 0x2E6B30, cx - 40, 135, -115);
        makeSphere(14, 8, 6, 0x3A7D44, cx - 90, 130, -125);
        makeSphere(16, 8, 6, 0x326838, cx - 130, 128, -118);
        makeSphere(12, 8, 6, 0x2D6535, cx + 20, 127, -122);
        makeSphere(15, 8, 6, 0x3A7D44, cx - 160, 124, -112);
        // Great Masson Cavern entrance building
        makeBox(24, 16, 18, 0xA09080, cx - 85, 113, -106);
        makeCone(12, 10, 8, 0x705040, cx - 85, 124, -106);
        // Cavern archway
        makeBox(10, 14, 4, 0x807060, cx - 85, 112, -97);

        // --- CABLE CAR SYSTEM (Heights of Abraham) ---
        // Lower station
        makeBox(20, 14, 14, 0x8B7355, cx + 10, 7, -40);
        makeCone(10, 8, 4, 0x6B5535, cx + 10, 18, -40);
        // Upper station
        makeBox(20, 14, 14, 0x8B7355, cx - 60, 108, -108);
        makeCone(10, 8, 4, 0x6B5535, cx - 60, 119, -108);
        // Cable car pylons (towers)
        makeCylinder(1.5, 2, 55, 8, 0x778899, cx - 10, 27, -58);
        makeCylinder(1.5, 2, 70, 8, 0x778899, cx - 30, 35, -74);
        makeCylinder(1.5, 2, 80, 8, 0x778899, cx - 50, 40, -88);
        // Gondola boxes on cable line
        makeBox(5, 4, 4, 0xFFCC00, cx + 0, 30, -55);
        makeBox(5, 4, 4, 0xFFCC00, cx - 20, 50, -70);
        makeBox(5, 4, 4, 0xFFCC00, cx - 40, 75, -88);
        makeBox(5, 4, 4, 0xFFCC00, cx - 55, 98, -103);
        // Cable lines (thin horizontal boxes approximating diagonal cables)
        makeBox(80, 0.5, 0.5, 0x444444, cx - 20, 28, -55);
        makeBox(80, 0.5, 0.5, 0x444444, cx - 50, 65, -85);

        // --- MATLOCK BATH VILLAGE ---
        // Main road (A6)
        makeBox(500, 1, 12, 0x555555, cx, 1, -15);
        // Pavement
        makeBox(500, 1, 5, 0xAAAAAA, cx, 1, -20);
        makeBox(500, 1, 4, 0xAAAAAA, cx, 1, -11);

        // --- VICTORIAN HOTELS ---
        // Temple Hotel (large Victorian hotel)
        makeBox(40, 28, 20, 0xD4C8A0, cx - 60, 14, -28);
        makeBox(40, 4, 22, 0xC8BC94, cx - 60, 29, -28);
        makeCone(5, 8, 4, 0x8B7355, cx - 48, 34, -22);
        makeCone(5, 8, 4, 0x8B7355, cx - 72, 34, -22);
        // New Bath Hotel
        makeBox(36, 26, 18, 0xD4C8A0, cx + 80, 13, -26);
        makeBox(36, 3, 20, 0xC8BC94, cx + 80, 27, -26);
        makeCone(4, 7, 4, 0x8B7355, cx + 68, 32, -20);
        makeCone(4, 7, 4, 0x8B7355, cx + 92, 32, -20);
        // Hodgkinson's Hotel
        makeBox(28, 22, 16, 0xD4C8A0, cx - 160, 11, -25);
        makeBox(28, 3, 18, 0xC8BC94, cx - 160, 24, -25);

        // --- VICTORIAN PUMP ROOM / SPA BUILDINGS ---
        makeBox(50, 20, 24, 0xF5F5DC, cx + 20, 10, -33);
        makeBox(50, 3, 26, 0xE8E8C8, cx + 20, 22, -33);
        // Ornate pillars on pump room facade
        makeCylinder(1.2, 1.2, 18, 8, 0xF0F0D8, cx + 0, 9, -21);
        makeCylinder(1.2, 1.2, 18, 8, 0xF0F0D8, cx + 10, 9, -21);
        makeCylinder(1.2, 1.2, 18, 8, 0xF0F0D8, cx + 20, 9, -21);
        makeCylinder(1.2, 1.2, 18, 8, 0xF0F0D8, cx + 30, 9, -21);
        makeCylinder(1.2, 1.2, 18, 8, 0xF0F0D8, cx + 40, 9, -21);
        // Dome on pump room
        makeSphere(8, 10, 8, 0xF5F5DC, cx + 20, 26, -30);

        // --- ILLUMINATIONS PAVILION ---
        makeBox(45, 18, 22, 0xD4C8A0, cx - 20, 9, -31);
        makeBox(45, 2, 24, 0xB0A888, cx - 20, 19, -31);
        // Pavilion ironwork roof ridge
        makeBox(45, 2, 2, 0x333333, cx - 20, 20, -20);
        makeBox(45, 2, 2, 0x333333, cx - 20, 20, -42);
        // Illumination light strings (box approximations)
        makeBox(45, 1, 1, 0xFFFF88, cx - 20, 21, -25);
        makeBox(45, 1, 1, 0xFFFF88, cx - 20, 21, -35);

        // --- GIFT SHOPS / AMUSEMENT ARCADES ---
        makeBox(18, 10, 12, 0xFF8844, cx + 160, 5, -22);
        makeBox(16, 10, 12, 0xFF8844, cx + 182, 5, -22);
        makeBox(18, 10, 12, 0xFF8844, cx + 204, 5, -22);
        makeBox(16, 10, 12, 0xFF6622, cx - 230, 5, -22);
        makeBox(18, 10, 12, 0xFF8844, cx - 250, 5, -22);
        // Shop signs (flat boxes)
        makeBox(16, 3, 1, 0xFFCC00, cx + 160, 12, -16);
        makeBox(14, 3, 1, 0xFF4400, cx + 182, 12, -16);
        makeBox(16, 3, 1, 0xFFCC00, cx + 204, 12, -16);

        // --- LOVERS WALKS (wooded riverside path) ---
        // Path
        makeBox(200, 1, 6, 0x8B7355, cx - 50, 1, 22);
        // Riverside trees
        makeSphere(8, 8, 6, 0x228B22, cx - 80, 12, 25);
        makeSphere(7, 8, 6, 0x2D6B22, cx - 50, 11, 27);
        makeSphere(9, 8, 6, 0x1E7B1E, cx - 20, 13, 24);
        makeSphere(7, 8, 6, 0x228B22, cx + 10, 11, 26);
        makeSphere(8, 8, 6, 0x2D6B22, cx + 50, 12, 25);
        makeSphere(6, 8, 6, 0x1E7B1E, cx + 80, 10, 27);
        makeSphere(9, 8, 6, 0x228B22, cx + 120, 13, 24);
        // Tree trunks along Lovers Walk
        makeCylinder(0.8, 1.0, 10, 6, 0x5C4020, cx - 80, 5, 25);
        makeCylinder(0.8, 1.0, 9, 6, 0x5C4020, cx - 20, 5, 24);
        makeCylinder(0.8, 1.0, 10, 6, 0x5C4020, cx + 50, 5, 25);
        makeCylinder(0.8, 1.0, 11, 6, 0x5C4020, cx + 120, 5, 24);

        // --- PETRIFYING WELL ---
        // Cave mouth / limestone encrusted entrance
        makeBox(14, 10, 8, 0xC8C0A0, cx + 240, 5, -50);
        makeBox(14, 6, 6, 0xB0A888, cx + 240, 12, -50);
        // Limestone encrustation lumps
        makeSphere(3, 6, 5, 0xD4CCA0, cx + 234, 8, -46);
        makeSphere(2.5, 6, 5, 0xCCC498, cx + 244, 9, -47);
        makeSphere(2, 6, 5, 0xBCB490, cx + 238, 11, -45);
        // Dripping water pool
        makeBox(8, 1, 6, 0x4682B4, cx + 240, 1.5, -46);

        // --- DERWENT VALLEY MILLS / CROMFORD ---
        // Arkwright's first mill (1771) — red brick mills
        makeBox(60, 35, 22, 0xC8B89A, cx - 380, 17, -20);
        makeBox(60, 4, 24, 0xB0A088, cx - 380, 37, -20);
        // Mill windows (inset box details)
        makeBox(58, 2, 1, 0x8B7355, cx - 380, 12, -9);
        makeBox(58, 2, 1, 0x8B7355, cx - 380, 20, -9);
        makeBox(58, 2, 1, 0x8B7355, cx - 380, 28, -9);
        // Second Cromford mill building
        makeBox(48, 28, 18, 0xC8B89A, cx - 440, 14, -22);
        makeBox(48, 4, 20, 0xB0A088, cx - 440, 30, -22);
        // Mill chimney
        makeCylinder(3, 4, 45, 8, 0xB87040, cx - 360, 22, -10);
        // Mill leat / water channel
        makeBox(80, 2, 6, 0x4682B4, cx - 420, 1.5, 0);
        // Mill wheel (CylinderGeometry on side)
        makeCylinder(8, 8, 4, 12, 0x5C4020, cx - 400, 8, -9);
        // Upstream mills (Derwent Valley UNESCO)
        makeBox(50, 30, 20, 0xC8B89A, cx - 320, 15, -18);
        makeBox(50, 3, 22, 0xB0A088, cx - 320, 32, -18);
        makeCylinder(2.5, 3, 38, 8, 0xB87040, cx - 300, 19, -8);

        // --- BRIDGES OVER RIVER ---
        // Main road bridge
        makeBox(22, 4, 20, 0x999999, cx + 30, 3, 0);
        // Bridge piers
        makeCylinder(2, 2, 8, 8, 0x888888, cx + 22, 4, 5);
        makeCylinder(2, 2, 8, 8, 0x888888, cx + 38, 4, 5);
        // Footbridge (Lovers Walk)
        makeBox(16, 2, 8, 0x8B7355, cx - 30, 3, 15);
        makeCylinder(0.8, 0.8, 6, 6, 0x666666, cx - 36, 4, 15);
        makeCylinder(0.8, 0.8, 6, 6, 0x666666, cx - 24, 4, 15);

        // --- ADDITIONAL VALLEY TREES AND VEGETATION ---
        makeSphere(10, 8, 6, 0x2D6B22, cx - 200, 12, -85);
        makeSphere(12, 8, 6, 0x228B22, cx - 140, 14, -80);
        makeSphere(8, 8, 6, 0x1E7B1E, cx - 60, 11, -82);
        makeSphere(11, 8, 6, 0x3A7D44, cx + 100, 13, -78);
        makeSphere(9, 8, 6, 0x2D6B22, cx + 200, 12, -82);
        makeSphere(10, 8, 6, 0x228B22, cx + 280, 13, -86);
        // East bank woodland
        makeSphere(10, 8, 6, 0x2D6B22, cx - 180, 12, 78);
        makeSphere(8, 8, 6, 0x228B22, cx - 90, 11, 76);
        makeSphere(12, 8, 6, 0x1E7B1E, cx + 60, 14, 80);
        makeSphere(9, 8, 6, 0x3A7D44, cx + 180, 12, 78);

        // --- ROCK FORMATIONS IN RIVER ---
        makeBox(8, 3, 5, 0xA0A0A0, cx - 100, 2, 9);
        makeBox(6, 2, 4, 0xB0B0B0, cx + 150, 2, 7);
        makeBox(10, 4, 6, 0x989898, cx + 280, 2, 10);

        // --- ROADSIDE FEATURES ---
        // Lamp posts along main road
        makeCylinder(0.3, 0.3, 10, 6, 0x333333, cx - 100, 5, -16);
        makeCylinder(0.3, 0.3, 10, 6, 0x333333, cx + 0, 5, -16);
        makeCylinder(0.3, 0.3, 10, 6, 0x333333, cx + 100, 5, -16);
        makeCylinder(0.3, 0.3, 10, 6, 0x333333, cx + 200, 5, -16);
        // Lamp globes
        makeSphere(1.2, 6, 5, 0xFFFF88, cx - 100, 11, -16);
        makeSphere(1.2, 6, 5, 0xFFFF88, cx + 0, 11, -16);
        makeSphere(1.2, 6, 5, 0xFFFF88, cx + 100, 11, -16);
        makeSphere(1.2, 6, 5, 0xFFFF88, cx + 200, 11, -16);

        // --- CABLE CAR SUPPORT CABLE LINES (LineSegments) ---
        var cabPoints = [];
        cabPoints.push(new THREE.Vector3(cx + 10, 14, -40));
        cabPoints.push(new THREE.Vector3(cx - 10, 30, -58));
        cabPoints.push(new THREE.Vector3(cx - 30, 46, -75));
        cabPoints.push(new THREE.Vector3(cx - 50, 70, -91));
        cabPoints.push(new THREE.Vector3(cx - 60, 108, -108));
        var cabGeo = new THREE.BufferGeometry().setFromPoints(cabPoints);
        var cabMat = new THREE.LineBasicMaterial({ color: 0x222222 });
        var cabLine = new THREE.LineSegments(cabGeo, cabMat);
        scene.add(cabLine);
        objects.push(cabLine);

        // River bank edges (LineSegments to mark banks)
        var bankPoints = [];
        bankPoints.push(new THREE.Vector3(cx - 250, 1, 2));
        bankPoints.push(new THREE.Vector3(cx + 250, 1, 2));
        var bankGeo = new THREE.BufferGeometry().setFromPoints(bankPoints);
        var bankMat = new THREE.LineBasicMaterial({ color: 0x8B7355 });
        var bankLine = new THREE.LineSegments(bankGeo, bankMat);
        scene.add(bankLine);
        objects.push(bankLine);

        // --- SMALL RIVERSIDE CAFE / FISH & CHIP SHOP ---
        makeBox(16, 9, 12, 0xD4C8A0, cx + 130, 4, -22);
        makeBox(16, 2, 14, 0xB0A888, cx + 130, 10, -22);
        // Cafe sign
        makeBox(14, 2, 1, 0xCC4400, cx + 130, 12, -16);

        // --- PARKING AREA ---
        makeBox(80, 1, 30, 0x666666, cx + 300, 1, -30);
        // Parked car shapes (boxes)
        makeBox(8, 4, 4, 0xFF0000, cx + 280, 3, -25);
        makeBox(8, 4, 4, 0x0000FF, cx + 294, 3, -25);
        makeBox(8, 4, 4, 0xFFFFFF, cx + 308, 3, -25);
        makeBox(8, 4, 4, 0x006600, cx + 322, 3, -25);

        // --- AQUARIUM / VISITOR ATTRACTION ---
        makeBox(35, 16, 22, 0xD4C8A0, cx - 110, 8, -28);
        makeBox(35, 2, 24, 0xB0A888, cx - 110, 17, -28);
        // Aquarium blue tint windows
        makeBox(32, 8, 2, 0x4488BB, cx - 110, 10, -17);
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

    return { init: init, update: update, reset: reset };
}());
