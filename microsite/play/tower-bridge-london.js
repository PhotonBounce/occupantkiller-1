window.TowerBridgeLondon = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11800;

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

    function makeMat(color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.transparent !== undefined) params.transparent = opts.transparent;
            if (opts.opacity !== undefined) params.opacity = opts.opacity;
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function makeBox(w, h, d, color, x, y, z, opts) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z, opts) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeLines(positions, color) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(geo, mat);
        scene.add(lines);
        objects.push(lines);
        return lines;
    }

    function buildTowerBridge() {
        var bx = X_OFFSET;
        var bz = 0;
        var graniteColor = 0x8B4513;
        var stoneColor = 0xA0856C;
        var steelColor = 0x708090;
        var cableColor = 0x555555;
        var walkwayColor = 0xC8A87A;
        var glassColor = 0x88CCEE;

        // North tower base
        makeBox(10, 28, 10, graniteColor, bx - 20, 14, bz);
        // North tower upper section
        makeBox(10, 8, 10, stoneColor, bx - 20, 32, bz);
        // North tower gothic spires (4 corner turrets)
        makeCyl(0.8, 1.2, 10, 6, graniteColor, bx - 24, 38, bz - 4);
        makeCyl(0.8, 1.2, 10, 6, graniteColor, bx - 24, 38, bz + 4);
        makeCyl(0.8, 1.2, 10, 6, graniteColor, bx - 16, 38, bz - 4);
        makeCyl(0.8, 1.2, 10, 6, graniteColor, bx - 16, 38, bz + 4);
        // North tower turret caps
        makeCone(1.2, 4, 6, 0x4a3728, bx - 24, 44, bz - 4);
        makeCone(1.2, 4, 6, 0x4a3728, bx - 24, 44, bz + 4);
        makeCone(1.2, 4, 6, 0x4a3728, bx - 16, 44, bz - 4);
        makeCone(1.2, 4, 6, 0x4a3728, bx - 16, 44, bz + 4);
        // North tower main spire
        makeCone(3, 8, 8, 0x4a3728, bx - 20, 40, bz);

        // South tower base
        makeBox(10, 28, 10, graniteColor, bx + 20, 14, bz);
        // South tower upper section
        makeBox(10, 8, 10, stoneColor, bx + 20, 32, bz);
        // South tower gothic spires (4 corner turrets)
        makeCyl(0.8, 1.2, 10, 6, graniteColor, bx + 16, 38, bz - 4);
        makeCyl(0.8, 1.2, 10, 6, graniteColor, bx + 16, 38, bz + 4);
        makeCyl(0.8, 1.2, 10, 6, graniteColor, bx + 24, 38, bz - 4);
        makeCyl(0.8, 1.2, 10, 6, graniteColor, bx + 24, 38, bz + 4);
        // South tower turret caps
        makeCone(1.2, 4, 6, 0x4a3728, bx + 16, 44, bz - 4);
        makeCone(1.2, 4, 6, 0x4a3728, bx + 16, 44, bz + 4);
        makeCone(1.2, 4, 6, 0x4a3728, bx + 24, 44, bz - 4);
        makeCone(1.2, 4, 6, 0x4a3728, bx + 24, 44, bz + 4);
        // South tower main spire
        makeCone(3, 8, 8, 0x4a3728, bx + 20, 40, bz);

        // Bascule bridge leaves raised at 45 degrees
        var leafGeo1 = new THREE.BoxGeometry(20, 1.2, 10);
        var leafMat = makeMat(steelColor);
        var leaf1 = new THREE.Mesh(leafGeo1, leafMat);
        // Left leaf raised 45 degrees, pivot at inner edge of north tower
        leaf1.position.set(bx - 10, 10, bz);
        leaf1.rotation.z = Math.PI / 4;
        scene.add(leaf1);
        objects.push(leaf1);

        var leafGeo2 = new THREE.BoxGeometry(20, 1.2, 10);
        var leaf2 = new THREE.Mesh(leafGeo2, makeMat(steelColor));
        // Right leaf raised 45 degrees, pivot at inner edge of south tower
        leaf2.position.set(bx + 10, 10, bz);
        leaf2.rotation.z = -Math.PI / 4;
        scene.add(leaf2);
        objects.push(leaf2);

        // Road approach decks (outside the towers)
        makeBox(20, 1, 10, 0x808080, bx - 35, 2, bz);
        makeBox(20, 1, 10, 0x808080, bx + 35, 2, bz);

        // High-level walkways between towers
        makeBox(40, 1.5, 4, walkwayColor, bx, 36, bz);
        // Walkway glass floor panels
        makeBox(38, 0.2, 3.5, glassColor, bx, 36.85, bz, { transparent: true, opacity: 0.5 });
        // Walkway railings
        makeBox(40, 2, 0.2, 0xC0C0C0, bx, 37, bz - 2);
        makeBox(40, 2, 0.2, 0xC0C0C0, bx, 37, bz + 2);

        // Suspension chains as LineSegments
        // From north tower top to approach
        var chainPositions = [
            bx - 20, 43, bz - 2,   bx - 40, 2, bz - 2,
            bx - 20, 43, bz + 2,   bx - 40, 2, bz + 2,
            bx - 20, 43, bz - 2,   bx - 25, 20, bz - 2,
            bx - 20, 43, bz + 2,   bx - 25, 20, bz + 2,
            bx + 20, 43, bz - 2,   bx + 40, 2, bz - 2,
            bx + 20, 43, bz + 2,   bx + 40, 2, bz + 2,
            bx + 20, 43, bz - 2,   bx + 25, 20, bz - 2,
            bx + 20, 43, bz + 2,   bx + 25, 20, bz + 2
        ];
        makeLines(chainPositions, cableColor);

        // Vertical suspender rods on approach spans
        var suspenders = [];
        for (var si = 0; si < 4; si++) {
            var sx = bx - 40 + si * 5;
            var sy = 2 + si * 3;
            suspenders.push(sx, sy, bz - 2, sx, sy + 12, bz - 2);
            suspenders.push(sx, sy, bz + 2, sx, sy + 12, bz + 2);
        }
        for (var sj = 0; sj < 4; sj++) {
            var sx2 = bx + 25 + sj * 5;
            var sy2 = 20 - sj * 3;
            suspenders.push(sx2, sy2, bz - 2, sx2, sy2 + 10, bz - 2);
            suspenders.push(sx2, sy2, bz + 2, sx2, sy2 + 10, bz + 2);
        }
        makeLines(suspenders, cableColor);

        // Bridge piers in river
        makeBox(6, 8, 6, 0x696969, bx - 20, 4, bz);
        makeBox(6, 8, 6, 0x696969, bx + 20, 4, bz);
    }

    function buildTowerOfLondon() {
        var tx = X_OFFSET - 80;
        var tz = -60;
        var normanColor = 0xD2B48C;
        var wallColor = 0xA9A9A9;
        var towerColor = 0xC0C0C0;
        var roofColor = 0x2F4F4F;

        // White Tower (Norman Keep) - main body
        makeBox(14, 22, 14, normanColor, tx, 11, tz);
        // White Tower upper battlements
        makeBox(14, 2, 14, normanColor, tx, 23, tz);
        // White Tower roof
        makeBox(14, 1.5, 14, roofColor, tx, 24.5, tz);

        // 4 corner turrets on White Tower
        var corners = [
            [tx - 7, tz - 7],
            [tx + 7, tz - 7],
            [tx - 7, tz + 7],
            [tx + 7, tz + 7]
        ];
        for (var ci = 0; ci < corners.length; ci++) {
            makeCyl(1.5, 2, 28, 8, towerColor, corners[ci][0], 14, corners[ci][1]);
            // Cupola dome on each turret
            makeSphere(2, 8, 6, roofColor, corners[ci][0], 29, corners[ci][1]);
            makeCone(1, 3, 8, roofColor, corners[ci][0], 32, corners[ci][1]);
        }

        // Inner ward curtain wall - North side
        makeBox(70, 8, 2, wallColor, tx, 4, tz - 35);
        // Inner ward curtain wall - South side (riverside)
        makeBox(70, 8, 2, wallColor, tx, 4, tz + 35);
        // Inner ward curtain wall - West side
        makeBox(2, 8, 70, wallColor, tx - 35, 4, tz);
        // Inner ward curtain wall - East side
        makeBox(2, 8, 70, wallColor, tx + 35, 4, tz);

        // Mural towers (13 around the curtain wall)
        var muralColor = 0xB0B0B0;
        // North wall towers
        makeBox(5, 10, 5, muralColor, tx - 24, 5, tz - 35);
        makeBox(5, 10, 5, muralColor, tx, 5, tz - 35);
        makeBox(5, 10, 5, muralColor, tx + 24, 5, tz - 35);
        // South wall towers
        makeBox(5, 10, 5, muralColor, tx - 24, 5, tz + 35);
        makeBox(5, 10, 5, muralColor, tx, 5, tz + 35);
        makeBox(5, 10, 5, muralColor, tx + 24, 5, tz + 35);
        // West wall towers
        makeBox(5, 10, 5, muralColor, tx - 35, 5, tz - 18);
        makeBox(5, 10, 5, muralColor, tx - 35, 5, tz + 18);
        // East wall towers
        makeBox(5, 10, 5, muralColor, tx + 35, 5, tz - 18);
        makeBox(5, 10, 5, muralColor, tx + 35, 5, tz + 18);
        // Corner towers
        makeBox(6, 12, 6, muralColor, tx - 35, 6, tz - 35);
        makeBox(6, 12, 6, muralColor, tx + 35, 6, tz - 35);
        makeBox(6, 12, 6, muralColor, tx - 35, 6, tz + 35);

        // Traitors Gate (water gate from Thames) - south wall
        makeBox(8, 5, 1, 0x4a4a4a, tx - 5, 4.5, tz + 35.5);
        makeBox(8, 0.5, 1, 0x2a2a2a, tx - 5, 2, tz + 35.5);
        // Gate arch top
        makeCyl(4, 4, 1, 16, 0x2a2a2a, tx - 5, 5, tz + 35.5);

        // Yeoman Warder sentry
        makeBox(1, 3, 1, 0x1a1a8a, tx + 30, 1.5, tz - 30);
        makeSphere(0.6, 6, 6, 0xFFD700, tx + 30, 3.6, tz - 30);
        // Sentry hat
        makeCyl(0.5, 0.7, 0.8, 8, 0x1a1a8a, tx + 30, 4.2, tz - 30);

        // Outer ward - moat (low flat area)
        makeBox(80, 0.5, 80, 0x228B22, tx, 0.25, tz);
    }

    function buildHMSBelfast() {
        var hx = X_OFFSET + 60;
        var hz = 80;
        var hullColor = 0x4a4a4a;
        var deckColor = 0x696969;
        var superColor = 0x808080;
        var gunColor = 0x555555;

        // Hull - main body
        makeBox(80, 6, 16, hullColor, hx, 3, hz);
        // Hull bow taper
        var bowGeo = new THREE.BoxGeometry(15, 5, 14);
        var bowMesh = new THREE.Mesh(bowGeo, makeMat(hullColor));
        bowMesh.position.set(hx + 47, 3.5, hz);
        bowMesh.rotation.y = 0.4;
        scene.add(bowMesh);
        objects.push(bowMesh);
        // Hull stern
        makeBox(10, 5, 13, hullColor, hx - 45, 3, hz);
        // Waterline stripe
        makeBox(82, 0.5, 17, 0x8B0000, hx, 1, hz);

        // Main deck
        makeBox(78, 1, 14, deckColor, hx, 6.5, hz);

        // Forward superstructure
        makeBox(20, 8, 10, superColor, hx + 15, 11, hz);
        makeBox(16, 5, 8, superColor, hx + 15, 17, hz);
        makeBox(12, 4, 6, superColor, hx + 15, 23, hz);

        // Aft superstructure
        makeBox(15, 6, 10, superColor, hx - 15, 10, hz);
        makeBox(12, 4, 8, superColor, hx - 15, 15, hz);

        // Funnels
        makeCyl(2, 2.5, 10, 8, 0x222222, hx + 5, 17, hz - 2);
        makeCyl(2, 2.5, 10, 8, 0x222222, hx - 2, 17, hz - 2);
        // Funnel tops
        makeCyl(2.2, 2.2, 1, 8, 0x111111, hx + 5, 23, hz - 2);
        makeCyl(2.2, 2.2, 1, 8, 0x111111, hx - 2, 23, hz - 2);

        // Gun turrets - triple 6-inch guns (forward)
        makeCyl(3, 3.5, 2, 12, gunColor, hx + 30, 8, hz);
        makeBox(8, 1, 1, gunColor, hx + 30, 9, hz - 1);
        makeBox(8, 1, 1, gunColor, hx + 30, 9, hz);
        makeBox(8, 1, 1, gunColor, hx + 30, 9, hz + 1);

        makeCyl(3, 3.5, 2, 12, gunColor, hx + 20, 8, hz);
        makeBox(8, 1, 1, gunColor, hx + 20, 9, hz - 1);
        makeBox(8, 1, 1, gunColor, hx + 20, 9, hz);
        makeBox(8, 1, 1, gunColor, hx + 20, 9, hz + 1);

        // Gun turrets - aft
        makeCyl(3, 3.5, 2, 12, gunColor, hx - 25, 8, hz);
        makeBox(8, 1, 1, gunColor, hx - 25, 9, hz - 1);
        makeBox(8, 1, 1, gunColor, hx - 25, 9, hz);
        makeBox(8, 1, 1, gunColor, hx - 25, 9, hz + 1);

        makeCyl(3, 3.5, 2, 12, gunColor, hx - 35, 8, hz);
        makeBox(8, 1, 1, gunColor, hx - 35, 9, hz - 1);
        makeBox(8, 1, 1, gunColor, hx - 35, 9, hz);
        makeBox(8, 1, 1, gunColor, hx - 35, 9, hz + 1);

        // Masts
        makeCyl(0.3, 0.5, 25, 6, 0x333333, hx + 15, 33, hz);
        makeCyl(0.3, 0.5, 20, 6, 0x333333, hx - 10, 28, hz);
        // Mast crossbars
        makeBox(10, 0.4, 0.4, 0x333333, hx + 15, 42, hz);
        makeBox(8, 0.4, 0.4, 0x333333, hx - 10, 36, hz);

        // Anchor chain lines
        var anchorLines = [
            hx + 50, 6, hz - 3,   hx + 55, 1, hz - 3,
            hx + 50, 6, hz + 3,   hx + 55, 1, hz + 3
        ];
        makeLines(anchorLines, 0x4a4a4a);
    }

    function buildTowerWharf() {
        var wx = X_OFFSET - 20;
        var wz = 50;
        var cannonColor = 0x2a2a2a;
        var stoneColor = 0x808070;

        // Wharf walkway
        makeBox(80, 1, 12, 0x8B7355, wx, 0.5, wz);
        // Wharf railing
        makeBox(80, 1.5, 0.3, 0x555555, wx, 1.75, wz + 6);
        makeBox(80, 1.5, 0.3, 0x555555, wx, 1.75, wz - 6);

        // Cannon display (historic cannons)
        for (var i = 0; i < 5; i++) {
            var cx = wx - 30 + i * 15;
            // Cannon carriage
            makeBox(3, 1.2, 1.5, 0x4a3728, cx, 1.6, wz + 2);
            // Cannon barrel
            var barrelGeo = new THREE.CylinderGeometry(0.4, 0.6, 5, 8);
            var barrelMesh = new THREE.Mesh(barrelGeo, makeMat(cannonColor));
            barrelMesh.position.set(cx, 2.5, wz + 2);
            barrelMesh.rotation.z = Math.PI / 2;
            barrelMesh.rotation.y = Math.PI / 8;
            scene.add(barrelMesh);
            objects.push(barrelMesh);
            // Cannon wheels
            makeCyl(0.7, 0.7, 0.3, 10, 0x4a3728, cx - 1.2, 1, wz + 1.2);
            makeCyl(0.7, 0.7, 0.3, 10, 0x4a3728, cx - 1.2, 1, wz + 2.8);
            makeCyl(0.7, 0.7, 0.3, 10, 0x4a3728, cx + 1.2, 1, wz + 1.2);
            makeCyl(0.7, 0.7, 0.3, 10, 0x4a3728, cx + 1.2, 1, wz + 2.8);
        }

        // Thames river surface
        makeBox(300, 0.5, 60, 0x1a3a5c, X_OFFSET, -0.25, 50);
        makeBox(300, 0.5, 20, 0x1a4a6c, X_OFFSET, -0.1, 75);

        // Mooring posts
        for (var mp = 0; mp < 6; mp++) {
            makeCyl(0.4, 0.5, 4, 8, 0x4a3728, wx - 35 + mp * 14, 2, wz + 6.5);
        }
    }

    function buildCitySkyline() {
        var sx = X_OFFSET + 150;
        var sz = -120;
        var skyColor = 0xC0C0C0;
        var glassColor = 0x87CEEB;
        var darkGlass = 0x4682B4;

        // The Gherkin (30 St Mary Axe) - tapering cylinder
        for (var gi = 0; gi < 8; gi++) {
            var gRadius = 8 - gi * 0.8;
            var gY = gi * 7 + 3.5;
            makeCyl(gRadius, gRadius + 0.8, 7, 16, glassColor, sx, gY, sz);
        }
        // Gherkin dome cap
        makeSphere(5, 12, 8, glassColor, sx, 60, sz);
        makeCone(2, 4, 10, darkGlass, sx, 64, sz);

        // Walkie Talkie (20 Fenchurch Street) - wider top
        makeBox(18, 40, 16, darkGlass, sx + 50, 20, sz);
        makeBox(22, 12, 18, darkGlass, sx + 50, 46, sz);
        makeBox(24, 6, 20, darkGlass, sx + 50, 55, sz);
        // Sky garden floor
        makeBox(23, 2, 19, 0x88AA66, sx + 50, 58.5, sz);

        // Cheesegrater (Leadenhall Building) - tapered slab
        for (var li = 0; li < 10; li++) {
            var lw = 20 - li * 1.5;
            var lh = 6;
            var ly = li * lh + 3;
            makeBox(lw, lh, 14, glassColor, sx + 100, ly, sz);
        }
        // Cheesegrater upper taper
        for (var lu = 0; lu < 5; lu++) {
            var lw2 = 5 - lu * 0.8;
            var ly2 = 63 + lu * 5;
            makeBox(lw2 < 0.5 ? 0.5 : lw2, 5, 12, glassColor, sx + 100, ly2, sz);
        }

        // Generic background office buildings
        makeBox(20, 50, 18, skyColor, sx + 160, 25, sz + 20);
        makeBox(16, 35, 14, 0xA0A0A0, sx + 180, 17, sz - 10);
        makeBox(22, 45, 16, 0xB0B0B0, sx + 130, 22, sz + 30);
        makeBox(18, 30, 14, skyColor, sx + 200, 15, sz + 10);
        makeBox(14, 55, 12, darkGlass, sx + 220, 27, sz - 20);

        // St Paul's Cathedral dome (distant)
        makeCyl(14, 14, 35, 16, 0xE8E8E0, sx - 60, 17, sz - 80);
        makeSphere(14, 16, 10, 0xF0F0E8, sx - 60, 40, sz - 80);
        makeCyl(3, 3, 10, 12, 0xE8E8E0, sx - 60, 50, sz - 80);
        makeCone(2, 6, 8, 0xE8E8E0, sx - 60, 57, sz - 80);
        makeBox(4, 0.5, 4, 0xFFD700, sx - 60, 60, sz - 80);
    }

    function buildGroundPlane() {
        // Ground/Thames Embankment
        makeBox(400, 0.5, 200, 0x3a5a3a, X_OFFSET, -0.25, -80);
        // North bank road
        makeBox(300, 0.3, 20, 0x333333, X_OFFSET, 0.15, -10);
        // South bank path
        makeBox(300, 0.3, 15, 0x555555, X_OFFSET, 0.15, 65);
        // Embankment wall
        makeBox(300, 3, 2, 0x808070, X_OFFSET, 1.5, 40);
    }

    function build() {
        buildGroundPlane();
        buildTowerBridge();
        buildTowerOfLondon();
        buildHMSBelfast();
        buildTowerWharf();
        buildCitySkyline();
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
