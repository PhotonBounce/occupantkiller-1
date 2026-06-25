window.GalwayCity = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 17600;
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildShopStreet();
        buildSpanishArch();
        buildCathedral();
        buildRiverCorrib();
        buildCladdagh();
        buildEyreSquare();
        buildStreetLamps();
        buildHookerBoat();
        buildExtraDetails();
    }

    function buildGround() {
        // Ground plane via flat boxes
        makebox(400, 0.5, 400, 0x888888, 0, -0.25, 0);
        // Road surfaces along Shop Street
        makebox(200, 0.6, 12, 0x555555, 0, -0.1, 0);
        // Cobblestone texture hint — slightly raised strips
        makebox(200, 0.7, 1.5, 0x666655, 0, -0.05, -5);
        makebox(200, 0.7, 1.5, 0x666655, 0, -0.05, 5);
    }

    function buildShopStreet() {
        // Row of merchant buildings north side of Shop Street
        var shopColors = [0xCC3333, 0x228B22, 0x336699, 0xCC7722, 0x993366, 0x22AAAA, 0xCC4422, 0x557722];
        var awningColors = [0xAA2222, 0x116611, 0x224477, 0xAA5511, 0x772255, 0x117788, 0xAA3311, 0x336611];

        var i;
        for (i = 0; i < 8; i++) {
            var bx = -80 + i * 22;
            var bh = 6 + (i % 3) * 2; // 6, 8, or 10 high (2-3 stories)
            // Main building body
            makebox(18, bh, 10, shopColors[i], bx, bh / 2, -10);
            // Window rows — inset darker boxes on facade
            makebox(3, 2, 0.3, 0x222222, bx - 5, bh - 2, -5.15);
            makebox(3, 2, 0.3, 0x222222, bx + 5, bh - 2, -5.15);
            makebox(3, 2, 0.3, 0x222222, bx - 5, bh - 5, -5.15);
            makebox(3, 2, 0.3, 0x222222, bx + 5, bh - 5, -5.15);
            // Awning over ground floor
            makebox(18, 0.4, 3, awningColors[i], bx, 2.5, -6.5);
            // Door
            makebox(2, 3, 0.3, 0x4B2E0A, bx, 1.5, -5.15);
            // Shop sign board
            makebox(10, 1, 0.3, 0xFFEECC, bx, 3.5, -5.15);
        }

        // Row of merchant buildings south side of Shop Street
        var shopColors2 = [0xDD4444, 0x33AA33, 0x4477AA, 0xDD8833, 0xAA4477, 0x33BBBB, 0xDD5533, 0x66AA33];
        var awningColors2 = [0xBB3333, 0x227722, 0x335588, 0xBB6622, 0x883366, 0x228899, 0xBB4422, 0x447722];

        for (i = 0; i < 8; i++) {
            var bx2 = -80 + i * 22;
            var bh2 = 6 + ((i + 1) % 3) * 2;
            makebox(18, bh2, 10, shopColors2[i], bx2, bh2 / 2, 10);
            makebox(3, 2, 0.3, 0x222222, bx2 - 5, bh2 - 2, 5.15);
            makebox(3, 2, 0.3, 0x222222, bx2 + 5, bh2 - 2, 5.15);
            makebox(3, 2, 0.3, 0x222222, bx2 - 5, bh2 - 5, 5.15);
            makebox(3, 2, 0.3, 0x222222, bx2 + 5, bh2 - 5, 5.15);
            makebox(18, 0.4, 3, awningColors2[i], bx2, 2.5, 6.5);
            makebox(2, 3, 0.3, 0x4B2E0A, bx2, 1.5, 5.15);
            makebox(10, 1, 0.3, 0xFFEECC, bx2, 3.5, 5.15);
        }
    }

    function buildSpanishArch() {
        // Spanish Arch near river — two stone pillars + lintel
        var ax = 110;
        var az = 60;
        // Left pillar
        makebox(4, 12, 4, 0x8B7355, ax - 5, 6, az);
        // Right pillar
        makebox(4, 12, 4, 0x8B7355, ax + 5, 6, az);
        // Lintel top
        makebox(14, 3, 4, 0x8B7355, ax, 12.5, az);
        // Arch detail — small decorative boxes on pillars
        makebox(4.5, 2, 0.5, 0x7A6548, ax - 5, 4, az - 2.2);
        makebox(4.5, 2, 0.5, 0x7A6548, ax + 5, 4, az - 2.2);
        makebox(4.5, 2, 0.5, 0x7A6548, ax - 5, 8, az - 2.2);
        makebox(4.5, 2, 0.5, 0x7A6548, ax + 5, 8, az - 2.2);
        // Battlement on top
        makebox(3, 2, 3, 0x8B7355, ax - 5, 15, az);
        makebox(3, 2, 3, 0x8B7355, ax, 15, az);
        makebox(3, 2, 3, 0x8B7355, ax + 5, 15, az);
        // Side wall extension
        makebox(20, 8, 2, 0x8B7355, ax + 17, 4, az);
        makebox(20, 8, 2, 0x8B7355, ax - 17, 4, az);
    }

    function buildCathedral() {
        // Galway Cathedral — large stone structure
        var cx = -120;
        var cz = -60;
        var stoneColor = 0x8B7355;
        var roofColor = 0x556B2F;

        // Main nave
        makebox(40, 18, 20, stoneColor, cx, 9, cz);
        // Nave roof ridge
        makebox(42, 2, 2, 0x6B5A3E, cx, 19, cz);

        // Transepts (cross arms)
        makebox(20, 14, 12, stoneColor, cx - 25, 7, cz);
        makebox(20, 14, 12, stoneColor, cx + 25, 7, cz);

        // Central dome on crossing
        makecyl(7, 7, 8, 12, stoneColor, cx, 22, cz);
        makecyl(6, 6, 0.5, 12, roofColor, cx, 26.2, cz);
        makesphere(6.5, 12, 8, 0x6B8B5E, cx, 28, cz);
        // Lantern on dome
        makecyl(1.5, 1.5, 4, 8, stoneColor, cx, 35, cz);
        makecone(2, 3, 8, 0x556B2F, cx, 38.5, cz);

        // Twin spires at west facade
        makebox(8, 20, 8, stoneColor, cx - 16, 10, cz + 14);
        makebox(8, 20, 8, stoneColor, cx + 16, 10, cz + 14);
        makecone(4, 14, 8, 0x556B2F, cx - 16, 27, cz + 14);
        makecone(4, 14, 8, 0x556B2F, cx + 16, 27, cz + 14);

        // Entrance portico
        makebox(14, 10, 4, stoneColor, cx, 5, cz + 14);
        // Rose window box
        makebox(6, 6, 0.5, 0xDDCCAA, cx, 16, cz + 12);
        // Cathedral steps
        makebox(20, 1, 6, 0x9E8B6F, cx, 0.5, cz + 17);

        // Buttresses on sides
        makebox(3, 14, 3, stoneColor, cx - 22, 7, cz - 8);
        makebox(3, 14, 3, stoneColor, cx - 22, 7, cz + 8);
        makebox(3, 14, 3, stoneColor, cx + 22, 7, cz - 8);
        makebox(3, 14, 3, stoneColor, cx + 22, 7, cz + 8);
    }

    function buildRiverCorrib() {
        // River Corrib — wide water channel, three wide boxes at y=-0.3
        var rx = 60;
        var rz = 90;
        makebox(300, 1, 25, 0x1E6BA8, rx, -0.3, rz);
        makebox(300, 1, 25, 0x1A5F95, rx, -0.8, rz + 5);
        makebox(300, 1, 25, 0x2277B5, rx, -0.8, rz - 5);
        // Riverbank stonework
        makebox(300, 2, 2, 0x888877, rx, 0.5, rz + 13);
        makebox(300, 2, 2, 0x888877, rx, 0.5, rz - 13);
        // River quayside wall
        makebox(300, 4, 1.5, 0x777766, rx, 2, rz + 14);
    }

    function buildCladdagh() {
        // Claddagh village — small white thatched cottages
        var i;
        var wallColor = 0xF5F5DC;
        var roofColor = 0x8B4513;
        var clx = 150;
        var clz = 60;
        for (i = 0; i < 5; i++) {
            var cxc = clx + i * 18;
            var czc = clz + (i % 2) * 10;
            // Cottage walls
            makebox(12, 5, 8, wallColor, cxc, 2.5, czc);
            // Thatched roof — slightly wider and angled-look box
            makebox(14, 3, 10, roofColor, cxc, 6.5, czc);
            // Small chimney
            makecyl(0.6, 0.6, 3, 6, 0x666666, cxc + 3, 9.5, czc);
            // Door
            makebox(2, 2.5, 0.3, 0x5C3317, cxc, 1.25, czc - 4.15);
            // Window
            makebox(2, 1.5, 0.3, 0xAAAABB, cxc - 3, 3, czc - 4.15);
        }
        // Claddagh ring memorial — decorative box+sphere
        makecyl(0.4, 0.4, 3, 6, 0x888888, clx + 40, 1.5, clz - 10);
        makebox(4, 0.5, 4, 0x888888, clx + 40, 0.25, clz - 10);
    }

    function buildEyreSquare() {
        // Eyre Square — open plaza
        var ex = -30;
        var ez = -100;
        // Park area — green box
        makebox(60, 0.6, 50, 0x228B22, ex, 0.1, ez);
        // Paths across park
        makebox(60, 0.7, 3, 0xAA9977, ex, 0.15, ez);
        makebox(3, 0.7, 50, 0xAA9977, ex, 0.15, ez);
        // Browne doorway memorial — pair of stone pillars + lintel
        makebox(2, 6, 2, 0x9E8B6F, ex - 4, 3, ez - 20);
        makebox(2, 6, 2, 0x9E8B6F, ex + 4, 3, ez - 20);
        makebox(10, 1.5, 2, 0x9E8B6F, ex, 6.75, ez - 20);
        // Kennedy memorial sculpture — box base + sphere
        makebox(4, 1.5, 4, 0x888888, ex + 15, 0.75, ez - 15);
        makesphere(2, 10, 8, 0x999999, ex + 15, 3, ez - 15);
        // Cannons decorative — cylinders
        makecyl(0.8, 0.8, 5, 8, 0x333333, ex - 20, 0.5, ez - 20);
        makecyl(0.8, 0.8, 5, 8, 0x333333, ex + 20, 0.5, ez - 20);
        // Park bench (box)
        makebox(4, 0.5, 1.5, 0x8B5E3C, ex - 10, 0.75, ez - 5);
        makebox(4, 0.5, 1.5, 0x8B5E3C, ex + 10, 0.75, ez - 5);
        // Fountain base in center
        makecyl(5, 5, 0.8, 12, 0xAAAAAA, ex, 0.4, ez + 5);
        makecyl(1, 1, 3, 8, 0xBBBBBB, ex, 2, ez + 5);
        makesphere(1.5, 8, 6, 0x9999AA, ex, 3.8, ez + 5);
        // Perimeter iron railing hints — thin box segments
        makebox(60, 2, 0.5, 0x222222, ex, 1, ez + 26);
        makebox(60, 2, 0.5, 0x222222, ex, 1, ez - 26);
        makebox(0.5, 2, 50, 0x222222, ex + 31, 1, ez);
        makebox(0.5, 2, 50, 0x222222, ex - 31, 1, ez);
    }

    function buildStreetLamps() {
        // Street lamps along Shop Street and quays
        var lampPositions = [
            [-70, 0, -14], [-48, 0, -14], [-26, 0, -14], [-4, 0, -14],
            [18, 0, -14], [40, 0, -14], [62, 0, -14], [84, 0, -14],
            [-70, 0, 14], [-48, 0, 14], [-26, 0, 14], [-4, 0, 14],
            [18, 0, 14], [40, 0, 14], [62, 0, 14], [84, 0, 14],
            [100, 0, 40], [100, 0, 60], [100, 0, 80]
        ];
        var i;
        for (i = 0; i < lampPositions.length; i++) {
            var lp = lampPositions[i];
            // Pole
            makecyl(0.2, 0.2, 6, 6, 0x333333, lp[0], 3, lp[2]);
            // Lamp globe
            makesphere(0.6, 8, 6, 0xFFFFCC, lp[0], 6.4, lp[2]);
            // Bracket arm
            makebox(1.5, 0.2, 0.2, 0x333333, lp[0] + 0.5, 6, lp[2]);
        }
    }

    function buildHookerBoat() {
        // Galway hooker boat in the river
        var hx = 80;
        var hz = 90;
        var hy = 0.5;
        // Hull — dark brown box
        makebox(14, 2.5, 5, 0x5C3317, hx, hy, hz);
        // Hull sides slightly raised
        makebox(14, 0.8, 0.6, 0x4A2810, hx, hy + 1.2, hz + 2.7);
        makebox(14, 0.8, 0.6, 0x4A2810, hx, hy + 1.2, hz - 2.7);
        // Deck
        makebox(12, 0.3, 4, 0x6B4020, hx, hy + 1.5, hz);
        // Mast — tall cylinder
        makecyl(0.25, 0.25, 12, 6, 0xCC4400, hx, hy + 7.5, hz);
        // Boom arm
        makecyl(0.15, 0.15, 8, 6, 0xFF6600, hx, hy + 10, hz);
        // Sail suggestion — flat orange box
        makebox(0.3, 8, 4, 0xFF4400, hx + 0.5, hy + 8, hz);
        // Bow pointy extension
        makebox(3, 1, 4, 0x4A2810, hx + 8, hy, hz);
    }

    function buildExtraDetails() {
        // Extra cobblestone texture details for Shop Street
        var j;
        for (j = 0; j < 10; j++) {
            makebox(1.5, 0.3, 1.5, 0x777766, -90 + j * 18, 0.2, 0);
        }

        // Additional side street buildings
        makebox(15, 7, 10, 0xBB6633, -95, 3.5, -25);
        makebox(15, 9, 10, 0x448844, -95, 4.5, -40);
        makebox(15, 7, 10, 0x6644AA, 105, 3.5, -25);
        makebox(15, 9, 10, 0xAA4433, 105, 4.5, -40);

        // Wall along waterfront (Long Walk style)
        makebox(120, 3, 1.5, 0x999988, 100, 1.5, 75);

        // Bollards along quay
        var b;
        for (b = 0; b < 8; b++) {
            makecyl(0.4, 0.5, 1.5, 6, 0x444444, 50 + b * 12, 0.75, 77);
        }

        // Eyre Square shopping centre (modern box building)
        makebox(50, 15, 35, 0xCCCCCC, -80, 7.5, -100);
        makebox(50, 1, 35, 0xAAAAAA, -80, 15.5, -100);

        // Bank building on corner
        makebox(20, 12, 15, 0xD4C4A0, 110, 6, -20);
        makebox(20, 1, 15, 0xC4B490, 110, 12.5, -20);

        // Large stone wall boundary near Spanish Arch
        makebox(2, 8, 40, 0x8B7355, 100, 4, 50);

        // Trees (dark green sphere on cylinder)
        var treePosns = [
            [-30, 0, -80], [-15, 0, -80], [0, 0, -80], [15, 0, -80],
            [130, 0, 45], [145, 0, 45], [160, 0, 55]
        ];
        var t;
        for (t = 0; t < treePosns.length; t++) {
            var tp = treePosns[t];
            makecyl(0.3, 0.3, 5, 6, 0x5C3A1E, tp[0], 2.5, tp[2]);
            makesphere(2.5, 8, 6, 0x2D6A2D, tp[0], 7, tp[2]);
        }
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
