window.AranIslands = (function() {
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

    function makeBox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, seg, color, x, y, z, ry) {
        var geo = new THREE.ConeGeometry(r, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (ry) mesh.rotation.y = ry;
        return addMesh(mesh);
    }

    function buildCliffFace() {
        // Atlantic cliff edge - towering stone cliff face boxes
        var cx = 17640;
        var cz = 0;
        // Main cliff wall sections dropping into water
        var i;
        for (i = 0; i < 14; i++) {
            makeBox(18, 28, 6, 0x808080, cx - 90 + i * 14, -10, cz + 160, 0, 0, 0);
        }
        // Second row of cliff blocks, slightly back
        for (i = 0; i < 13; i++) {
            makeBox(16, 20, 5, 0x707070, cx - 84 + i * 14, -4, cz + 155, 0, 0, 0);
        }
        // Deep water surface boxes below cliff
        for (i = 0; i < 10; i++) {
            makeBox(20, 2, 12, 0x006994, cx - 80 + i * 18, -22, cz + 170, 0, 0, 0);
        }
        // Cliff base water
        makeBox(200, 4, 30, 0x006994, cx, -24, cz + 185, 0, 0, 0);
        // Cliff ledge cap
        for (i = 0; i < 12; i++) {
            makeBox(15, 3, 5, 0x909090, cx - 82 + i * 15, 4, cz + 152, 0, 0, 0);
        }
    }

    function buildDunAengus() {
        var cx = 17640;
        var cz = 0;
        var color = 0x808080;

        // Dun Aengus: concentric semicircular walls made of arc segments of BoxGeometry blocks
        // Innermost wall (smallest semicircle) - radius ~20
        var r1 = 20;
        var r2 = 36;
        var r3 = 52;
        var r4 = 70;
        var wallH = 6;
        var wallW = 3;
        var seg, angle, bx, bz;

        // Wall 1 - innermost
        for (seg = 0; seg <= 10; seg++) {
            angle = (Math.PI / 10) * seg;
            bx = cx + r1 * Math.cos(angle);
            bz = cz + 120 + r1 * Math.sin(angle);
            makeBox(wallW, wallH, wallW, color, bx, wallH / 2, bz, 0, angle, 0);
        }

        // Wall 2
        for (seg = 0; seg <= 14; seg++) {
            angle = (Math.PI / 14) * seg;
            bx = cx + r2 * Math.cos(angle);
            bz = cz + 120 + r2 * Math.sin(angle);
            makeBox(wallW + 0.5, wallH + 1, wallW + 0.5, color, bx, (wallH + 1) / 2, bz, 0, angle, 0);
        }

        // Wall 3
        for (seg = 0; seg <= 18; seg++) {
            angle = (Math.PI / 18) * seg;
            bx = cx + r3 * Math.cos(angle);
            bz = cz + 120 + r3 * Math.sin(angle);
            makeBox(wallW + 1, wallH + 2, wallW + 1, 0x787878, bx, (wallH + 2) / 2, bz, 0, angle, 0);
        }

        // Wall 4 - outermost
        for (seg = 0; seg <= 22; seg++) {
            angle = (Math.PI / 22) * seg;
            bx = cx + r4 * Math.cos(angle);
            bz = cz + 120 + r4 * Math.sin(angle);
            makeBox(wallW + 1.5, wallH + 3, wallW + 1.5, 0x707070, bx, (wallH + 3) / 2, bz, 0, angle, 0);
        }

        // Chevaux-de-frise: scatter of upright stone stakes outside outer wall
        var stakes = [
            [cx - 55, cz + 95], [cx - 45, cz + 88], [cx - 35, cz + 90],
            [cx - 20, cz + 85], [cx, cz + 83], [cx + 20, cz + 85],
            [cx + 35, cz + 90], [cx + 45, cz + 88], [cx + 55, cz + 95],
            [cx - 60, cz + 100], [cx + 60, cz + 100], [cx - 30, cz + 82],
            [cx + 30, cz + 82], [cx - 10, cz + 80], [cx + 10, cz + 80]
        ];
        var s;
        for (s = 0; s < stakes.length; s++) {
            makeBox(0.4, 2.5, 0.4, 0x696969, stakes[s][0], 1.25, stakes[s][1]);
        }

        // Inner courtyard ground platform
        makeBox(35, 1, 18, 0x909090, cx, 0.5, cz + 120);

        // Fort entrance gap blocks on south side (flat sides)
        makeBox(8, wallH, wallW, color, cx - r1 - 4, wallH / 2, cz + 120);
        makeBox(8, wallH, wallW, color, cx + r1 + 4, wallH / 2, cz + 120);
    }

    function buildKarstLandscape() {
        var cx = 17640;
        var cz = 0;
        var slabs = [
            // [x_offset, z_offset, w, h, d, y, color]
            [-60, -30, 12, 0.8, 9, 0.4, 0xD3D3D3],
            [-44, -20, 9, 0.6, 7, 0.3, 0xA9A9A9],
            [-30, -40, 11, 1.0, 8, 0.5, 0xC8C8C8],
            [-15, -25, 8, 0.7, 10, 0.35, 0xD3D3D3],
            [5, -35, 13, 0.9, 7, 0.45, 0xB0B0B0],
            [22, -28, 10, 0.6, 9, 0.3, 0xA9A9A9],
            [38, -38, 9, 1.1, 8, 0.55, 0xD3D3D3],
            [55, -22, 12, 0.8, 10, 0.4, 0xC0C0C0],
            [-70, 10, 10, 0.7, 8, 0.35, 0xA9A9A9],
            [-55, 20, 14, 0.5, 9, 0.25, 0xD3D3D3],
            [-38, 5, 8, 1.2, 7, 0.6, 0xB8B8B8],
            [-20, 15, 11, 0.8, 11, 0.4, 0xD3D3D3],
            [0, 8, 9, 0.6, 8, 0.3, 0xA9A9A9],
            [18, 25, 12, 0.9, 9, 0.45, 0xC8C8C8],
            [35, 12, 10, 1.0, 7, 0.5, 0xD3D3D3],
            [52, 18, 11, 0.7, 10, 0.35, 0xA9A9A9],
            [68, 5, 9, 0.8, 8, 0.4, 0xD3D3D3],
            [-75, -55, 13, 0.6, 9, 0.3, 0xC0C0C0],
            [-50, -60, 10, 1.0, 8, 0.5, 0xD3D3D3],
            [-25, -65, 12, 0.7, 10, 0.35, 0xA9A9A9],
            [5, -70, 9, 0.9, 7, 0.45, 0xB8B8B8],
            [30, -58, 11, 0.8, 9, 0.4, 0xD3D3D3],
            [60, -65, 10, 0.6, 8, 0.3, 0xA9A9A9],
            [80, -40, 14, 1.1, 11, 0.55, 0xC8C8C8],
            [80, 30, 11, 0.7, 9, 0.35, 0xD3D3D3],
            [-80, 40, 12, 0.8, 8, 0.4, 0xA9A9A9]
        ];
        var i;
        for (i = 0; i < slabs.length; i++) {
            var s = slabs[i];
            makeBox(s[2], s[3], s[4], s[6], cx + s[0], s[5], cz + s[1]);
        }
    }

    function buildStoneWallNetwork() {
        var cx = 17640;
        var cz = 0;
        var walls = [
            // [x, z, w, h, d, ry] - thin crisscrossing walls
            [-100, -80, 40, 1.5, 0.35, 0],
            [-80, -80, 0.35, 1.5, 35, 0],
            [-60, -80, 45, 1.3, 0.35, 0],
            [-60, -60, 0.35, 1.8, 40, 0],
            [-20, -80, 0.35, 1.5, 30, 0],
            [10, -95, 50, 1.4, 0.35, 0],
            [35, -95, 0.35, 1.6, 45, 0],
            [60, -80, 40, 1.5, 0.35, 0],
            [85, -60, 0.35, 1.7, 50, 0],
            [-110, 0, 38, 1.3, 0.35, 0],
            [-110, 0, 0.35, 1.5, 42, 0],
            [-110, 45, 55, 1.6, 0.35, 0],
            [-80, 45, 0.35, 1.4, 38, 0],
            [-55, 20, 0.35, 1.5, 36, 0],
            [-30, 45, 48, 1.3, 0.35, 0],
            [-5, 25, 0.35, 1.7, 28, 0],
            [20, 45, 42, 1.4, 0.35, 0],
            [45, 30, 0.35, 1.5, 34, 0],
            [65, 45, 40, 1.6, 0.35, 0],
            [90, 20, 0.35, 1.4, 46, 0],
            [-50, -10, 32, 1.5, 0.35, 0],
            [15, -10, 0.35, 1.3, 28, 0],
            [50, -15, 35, 1.6, 0.35, 0],
            [-100, -40, 0.35, 1.5, 40, 0],
            [100, -40, 0.35, 1.4, 50, 0]
        ];
        var i, w;
        for (i = 0; i < walls.length; i++) {
            w = walls[i];
            makeBox(w[2], w[3], w[4], 0x808080, cx + w[0], w[3] / 2, cz + w[1], 0, w[5], 0);
        }
    }

    function buildCurrachBoats() {
        var cx = 17640;
        var cz = 0;
        // Traditional currach boats - upturned on shore, near water edge
        // Each boat = hull (long thin box) + two end caps (smaller boxes)
        var boatColor = 0x2C1A0E;
        var pitchColor = 0x1A1A1A;

        // Boat 1
        makeBox(7, 0.7, 1.8, boatColor, cx - 70, 0.35, cz + 135);
        makeBox(1.5, 0.5, 1.6, boatColor, cx - 73, 0.6, cz + 135);
        makeBox(1.5, 0.5, 1.6, boatColor, cx - 67, 0.6, cz + 135);
        makeBox(7.5, 0.15, 1.9, pitchColor, cx - 70, 0.8, cz + 135);

        // Boat 2
        makeBox(7, 0.7, 1.8, boatColor, cx - 55, 0.35, cz + 138);
        makeBox(1.5, 0.5, 1.6, boatColor, cx - 58, 0.6, cz + 138);
        makeBox(1.5, 0.5, 1.6, boatColor, cx - 52, 0.6, cz + 138);
        makeBox(7.5, 0.15, 1.9, pitchColor, cx - 55, 0.8, cz + 138);

        // Boat 3 - angled slightly
        makeBox(7, 0.7, 1.8, boatColor, cx - 40, 0.35, cz + 140, 0, 0.3, 0);
        makeBox(1.5, 0.5, 1.6, boatColor, cx - 43, 0.6, cz + 141);
        makeBox(1.5, 0.5, 1.6, boatColor, cx - 37, 0.6, cz + 139);
        makeBox(7.5, 0.15, 1.9, pitchColor, cx - 40, 0.8, cz + 140);
    }

    function buildVillage() {
        var cx = 17640;
        var cz = 0;
        var wallColor = 0xFFFFF0;
        var roofColor = 0x8B4513;
        var doorColor = 0x4A2800;
        var windowColor = 0x87CEEB;

        // Cottage 1
        makeBox(10, 5, 7, wallColor, cx - 95, 2.5, cz - 55);
        makeBox(11, 1.5, 8, roofColor, cx - 95, 5.75, cz - 55);
        makeBox(1.2, 2, 0.2, doorColor, cx - 95, 1, cz - 51.5);
        makeBox(1.5, 1.2, 0.2, windowColor, cx - 92, 3, cz - 51.5);
        makeBox(1.5, 1.2, 0.2, windowColor, cx - 98, 3, cz - 51.5);

        // Cottage 2
        makeBox(9, 4.5, 6.5, wallColor, cx - 80, 2.25, cz - 70);
        makeBox(10, 1.4, 7.5, roofColor, cx - 80, 4.95, cz - 70);
        makeBox(1.2, 2, 0.2, doorColor, cx - 80, 1, cz - 66.5);
        makeBox(1.5, 1.2, 0.2, windowColor, cx - 77, 2.8, cz - 66.5);

        // Cottage 3 - larger farmhouse
        makeBox(13, 5.5, 8, wallColor, cx - 110, 2.75, cz - 40);
        makeBox(14, 1.6, 9, roofColor, cx - 110, 6.05, cz - 40);
        makeBox(1.4, 2.2, 0.2, doorColor, cx - 110, 1.1, cz - 35.8);
        makeBox(1.6, 1.3, 0.2, windowColor, cx - 106, 3.2, cz - 35.8);
        makeBox(1.6, 1.3, 0.2, windowColor, cx - 114, 3.2, cz - 35.8);

        // Cottage 4
        makeBox(9, 4.5, 6.5, wallColor, cx - 125, 2.25, cz - 60);
        makeBox(10, 1.4, 7.5, roofColor, cx - 125, 4.95, cz - 60);
        makeBox(1.2, 2, 0.2, doorColor, cx - 125, 1, cz - 56.5);

        // Cottage 5 - small outbuilding
        makeBox(6, 3.5, 5, wallColor, cx - 98, 1.75, cz - 78);
        makeBox(6.5, 1.2, 5.5, roofColor, cx - 98, 3.6, cz - 78);

        // Small stone shed
        makeBox(7, 4, 5.5, 0xA9A9A9, cx - 115, 2, cz - 78);
        makeBox(7.5, 1.0, 6, 0x808080, cx - 115, 4.5, cz - 78);

        // Village well - cylinder
        makeCylinder(1.2, 1.2, 1.5, 8, 0x808080, cx - 85, 0.75, cz - 50);
        makeCylinder(0.05, 0.05, 2.5, 6, 0x4A2800, cx - 84, 2.25, cz - 50);
        makeBox(2.8, 0.2, 0.15, 0x4A2800, cx - 85, 3.5, cz - 50);
    }

    function buildLighthouse() {
        var cx = 17640;
        var cz = 0;

        // White lighthouse tower
        makeCylinder(1.8, 2.2, 18, 12, 0xF5F5F5, cx + 100, 9, cz - 50);
        // Lantern house box on top
        makeBox(3.5, 3, 3.5, 0xFF6B35, cx + 100, 19.5, cz - 50);
        // Lantern dome / top cap
        makeCone(2.2, 2.5, 8, 0xCC5500, cx + 100, 22.25, cz - 50);
        // Light lens sphere
        makeSphere(0.8, 8, 8, 0xFFFFAA, cx + 100, 20, cz - 50);
        // Base plinth
        makeCylinder(3, 3, 1.5, 8, 0xD0D0D0, cx + 100, 0.75, cz - 50);
        // Keeper's cottage next to lighthouse
        makeBox(8, 4.5, 6, 0xFFFFF0, cx + 108, 2.25, cz - 50);
        makeBox(9, 1.3, 7, 0x8B4513, cx + 108, 5.15, cz - 50);
        // Boundary wall around lighthouse
        makeBox(22, 1.2, 0.3, 0x808080, cx + 100, 0.6, cz - 60);
        makeBox(22, 1.2, 0.3, 0x808080, cx + 100, 0.6, cz - 40);
        makeBox(0.3, 1.2, 22, 0x808080, cx + 89, 0.6, cz - 50);
        makeBox(0.3, 1.2, 22, 0x808080, cx + 111, 0.6, cz - 50);
    }

    function buildIronAgeRuins() {
        var cx = 17640;
        var cz = 0;
        var ruinColor = 0x696969;

        // Scattered stone blocks - partially collapsed circular Iron Age structure
        var blockPositions = [
            [30, -95, 3, 1.2, 3],
            [36, -98, 2.5, 0.9, 2.5],
            [42, -93, 3, 1.5, 2.8],
            [47, -88, 2, 1.0, 3],
            [44, -82, 2.8, 0.8, 2.5],
            [38, -80, 3.2, 1.3, 2.8],
            [31, -82, 2.5, 1.1, 3],
            [26, -88, 3, 1.6, 2.5],
            [28, -94, 2.8, 0.7, 2.8]
        ];
        var i, b;
        for (i = 0; i < blockPositions.length; i++) {
            b = blockPositions[i];
            makeBox(b[2], b[3], b[4], ruinColor, cx + b[0], b[3] / 2, cz + b[1]);
        }

        // Tumbled/fallen blocks near the ring
        makeBox(2.5, 0.8, 2, ruinColor, cx + 22, 0.4, cz - 88, 0, 0.4, 0.3);
        makeBox(3, 0.9, 2.5, ruinColor, cx + 50, 0.45, cz - 90, 0, -0.3, 0.2);
        makeBox(2, 0.7, 1.8, ruinColor, cx + 35, 0.35, cz - 78, 0, 0.6, 0.1);

        // Large lone standing stone (menhir)
        makeBox(1.2, 5, 0.8, 0x555555, cx + 75, 2.5, cz - 85, 0, 0.2, 0.08);
        makeBox(0.9, 4.2, 0.7, 0x5A5A5A, cx + 80, 2.1, cz - 70, 0, -0.15, -0.05);

        // Scattered rubble
        makeBox(1.5, 0.6, 1.2, ruinColor, cx + 60, 0.3, cz - 100);
        makeBox(1.8, 0.5, 1.4, ruinColor, cx + 40, 0.25, cz - 105);
        makeBox(1.2, 0.4, 1.0, ruinColor, cx + 55, 0.2, cz - 95);
        makeBox(2.0, 0.7, 1.5, ruinColor, cx + 20, 0.35, cz - 102);
    }

    function buildGroundBase() {
        var cx = 17640;
        var cz = 0;
        // Main ground plane as large flat boxes (no PlaneGeometry allowed)
        makeBox(280, 0.5, 280, 0x5F6B3E, cx, -0.25, cz);
        // Shore/beach strip near cliff
        makeBox(280, 0.5, 20, 0xC2B280, cx, -0.1, cz + 148);
        // Rocky ground near fort
        makeBox(160, 0.5, 80, 0x888878, cx, -0.05, cz + 100);
    }

    function buildAtmosphericDetails() {
        var cx = 17640;
        var cz = 0;

        // Aran Islands cross/Celtic cross at village entrance
        makeBox(0.4, 3, 0.4, 0x4A4A4A, cx - 88, 1.5, cz - 46);
        makeBox(1.5, 0.4, 0.4, 0x4A4A4A, cx - 88, 2.5, cz - 46);
        makeSphere(0.5, 6, 6, 0x4A4A4A, cx - 88, 3.2, cz - 46);

        // Fishing net drying poles near shore
        makeBox(0.15, 3.5, 0.15, 0x4A2800, cx - 60, 1.75, cz + 130);
        makeBox(0.15, 3.5, 0.15, 0x4A2800, cx - 52, 1.75, cz + 130);
        makeBox(0.08, 0.08, 8.5, 0x8B7355, cx - 56, 3.4, cz + 130);

        // Turf/peat stack
        makeBox(4, 1.5, 2, 0x5C3A1E, cx - 118, 0.75, cz - 44);
        makeBox(3.5, 1.0, 1.8, 0x5C3A1E, cx - 118, 2, cz - 44);

        // Mooring posts on shore
        makeCylinder(0.2, 0.2, 2, 6, 0x4A2800, cx - 30, 1, cz + 142);
        makeCylinder(0.2, 0.2, 2, 6, 0x4A2800, cx - 15, 1, cz + 145);
        makeCylinder(0.2, 0.2, 2, 6, 0x4A2800, cx + 5, 1, cz + 143);

        // Rocky outcrops in landscape
        makeBox(5, 2, 4, 0x757575, cx + 90, 1, cz + 40);
        makeBox(4, 1.5, 5, 0x6A6A6A, cx - 105, 0.75, cz + 20);
        makeBox(6, 2.5, 4, 0x7A7A7A, cx + 75, 1.25, cz - 30);
        makeBox(3, 1.8, 3, 0x656565, cx - 85, 0.9, cz - 10);

        // Distant low hills / raised terrain in background
        makeBox(60, 8, 20, 0x6B7A4F, cx - 120, 4, cz - 120);
        makeBox(50, 6, 18, 0x607040, cx + 110, 3, cz - 115);
        makeBox(45, 10, 22, 0x6B7A4F, cx - 40, 5, cz - 130);

        // Wildflower patch marker (bright spot box)
        makeBox(8, 0.3, 6, 0xFFD700, cx - 75, 0.15, cz + 30);
        makeBox(6, 0.3, 8, 0xFF69B4, cx - 65, 0.15, cz + 42);
    }

    function build() {
        buildGroundBase();
        buildCliffFace();
        buildDunAengus();
        buildKarstLandscape();
        buildStoneWallNetwork();
        buildCurrachBoats();
        buildVillage();
        buildLighthouse();
        buildIronAgeRuins();
        buildAtmosphericDetails();
    }

    function update(delta) {
        // Static environment - no animation needed
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
