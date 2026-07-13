window.DubaiBurj = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 24200;
    var OY = 0;
    var OZ = 0;

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeLines(geom, color) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(geom, mat);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function build() {
        buildGround();
        buildBurjKhalifa();
        buildBurjAlArab();
        buildPalmJumeirah();
        buildDubaiMarina();
        buildMuseumOfFuture();
        buildDubaiFrame();
        buildDeiraSouk();
        buildDubaiCreek();
        buildAtlantis();
        buildDesertDunes();
    }

    function buildGround() {
        // Ground base plate
        makeBox(6000, 2, 6000, 0xD4C8A0, 0, -1, 0);
        // Water / Gulf sea base
        makeBox(6000, 1, 2000, 0x1A5A8A, 0, 0, -2500);
    }

    function buildBurjKhalifa() {
        // Base plaza
        makeBox(400, 4, 400, 0x8899AA, 0, 2, 0);
        // Fountain basin
        makeBox(300, 2, 120, 0x2A6A9A, 0, 3, 200);
        makeCyl(8, 8, 3, 8, 0xCCDDEE, -60, 3, 200);
        makeCyl(8, 8, 3, 8, 0xCCDDEE, 0, 3, 200);
        makeCyl(8, 8, 3, 8, 0xCCDDEE, 60, 3, 200);
        // Fountain jets (thin cylinders)
        makeCyl(1, 1, 20, 6, 0xAADDFF, -60, 13, 200);
        makeCyl(1, 1, 20, 6, 0xAADDFF, 0, 13, 200);
        makeCyl(1, 1, 20, 6, 0xAADDFF, 60, 13, 200);

        // Burj Khalifa main shaft - Y-shaped cross section approximated
        // Lower section wide base (floors 1-40)
        makeBox(90, 160, 90, 0xC8D8E8, 0, 81, 0);
        makeBox(90, 160, 30, 0xC8D8E8, 0, 81, 60);
        makeBox(90, 160, 30, 0xC8D8E8, 0, 81, -60);
        makeBox(30, 160, 90, 0xC8D8E8, 50, 81, 0);
        makeBox(30, 160, 90, 0xC8D8E8, -50, 81, 0);

        // Mid section (floors 40-75) slightly narrower
        makeBox(70, 140, 70, 0xC8D8E8, 0, 231, 0);
        makeBox(70, 140, 25, 0xC8D8E8, 0, 231, 48);
        makeBox(70, 140, 25, 0xC8D8E8, 0, 231, -48);
        makeBox(25, 140, 70, 0xC8D8E8, 38, 231, 0);
        makeBox(25, 140, 70, 0xC8D8E8, -38, 231, 0);

        // Upper section (floors 75-124)
        makeBox(50, 130, 50, 0xC8D8E8, 0, 366, 0);
        makeBox(50, 130, 18, 0xC8D8E8, 0, 366, 34);
        makeBox(18, 130, 50, 0xC8D8E8, 28, 366, 0);

        // Observation deck (floor 124) - slight step-out
        makeBox(55, 8, 55, 0xDDE8F0, 0, 432, 0);

        // Spire section above obs deck
        makeBox(22, 120, 22, 0xC8D8E8, 0, 491, 0);
        makeBox(14, 80, 14, 0xCCD8E8, 0, 571, 0);
        // Antenna tip
        makeCyl(2, 4, 100, 6, 0xB0C0D0, 0, 641, 0);
        makeCyl(0.5, 2, 80, 4, 0xC0D0E0, 0, 731, 0);

        // Setback rings / floor bands
        makeBox(95, 4, 95, 0xD8E8F0, 0, 160, 0);
        makeBox(80, 4, 80, 0xD8E8F0, 0, 300, 0);
        makeBox(60, 4, 60, 0xD8E8F0, 0, 410, 0);
        makeBox(30, 4, 30, 0xD8E8F0, 0, 480, 0);

        // Base entrance canopy
        makeBox(120, 10, 40, 0xBBCCDD, 0, 7, 100);
    }

    function buildBurjAlArab() {
        var bx = -600;
        var bz = -500;

        // Artificial island base
        makeCyl(120, 120, 4, 12, 0xD4C8A0, bx, 2, bz);

        // Connecting bridge to mainland
        makeBox(250, 8, 25, 0xAAAAAA, bx + 185, 6, bz + 60);

        // BurjAlArab - sail shape using stacked boxes
        // Each layer narrows and leans back to mimic billowing sail
        makeBox(120, 40, 20, 0xF5F5F5, bx, 22, bz);
        makeBox(110, 40, 18, 0xF5F5F5, bx - 4, 62, bz - 2);
        makeBox(98, 40, 16, 0xF5F5F5, bx - 9, 102, bz - 5);
        makeBox(84, 40, 14, 0xF5F5F5, bx - 15, 142, bz - 8);
        makeBox(70, 40, 12, 0xF5F5F5, bx - 22, 182, bz - 12);
        makeBox(54, 40, 10, 0xF5F5F5, bx - 30, 222, bz - 16);
        makeBox(38, 40, 8, 0xF5F5F5, bx - 38, 262, bz - 20);
        makeBox(24, 40, 6, 0xF5F5F5, bx - 46, 302, bz - 24);
        makeBox(14, 30, 5, 0xF5F5F5, bx - 50, 337, bz - 27);

        // Helipad at top
        makeCyl(18, 18, 3, 8, 0xEEEEEE, bx - 52, 355, bz - 28);
        makeBox(36, 1, 36, 0x888888, bx - 52, 357, bz - 28);

        // Interior atrium curve (inner skin suggestion)
        makeBox(80, 20, 5, 0xE0E8F0, bx + 10, 32, bz + 12);
        makeBox(70, 20, 5, 0xE0E8F0, bx + 6, 52, bz + 10);

        // Support struts / X-brace (visual lines)
        var strutGeo = new THREE.BoxGeometry(4, 200, 4);
        var strutMat = makeMat(0xDDDDDD);
        var strut1 = new THREE.Mesh(strutGeo, strutMat);
        strut1.position.set(OX + bx - 58, OY + 100, OZ + bz + 5);
        strut1.rotation.z = 0.3;
        addMesh(strut1);
        var strut2 = new THREE.Mesh(strutGeo.clone(), strutMat);
        strut2.position.set(OX + bx + 50, OY + 100, OZ + bz + 5);
        strut2.rotation.z = -0.3;
        addMesh(strut2);

        // Beach / pool area at base
        makeBox(100, 2, 80, 0xEEDDBB, bx, 4, bz + 80);
    }

    function buildPalmJumeirah() {
        var px = 1200;
        var pz = -1200;

        // Main trunk (north-south)
        makeBox(140, 4, 600, 0xD4C8A0, px, 2, pz);

        // 16 fronds extending from trunk
        var frondAngles = [
            -70, -55, -42, -30, -19, -10, -2,
            2, 10, 19, 30, 42, 55, 70,
            80, -80
        ];
        for (var f = 0; f < frondAngles.length; f++) {
            var ang = frondAngles[f] * Math.PI / 180;
            var frondLen = 280;
            var fx = px + Math.sin(ang) * frondLen * 0.5;
            var fz = pz - 200 + Math.cos(ang) * frondLen * 0.5;
            var frondBox = new THREE.BoxGeometry(40, 4, frondLen);
            var frondMat = makeMat(0xD4C8A0);
            var frondMesh = new THREE.Mesh(frondBox, frondMat);
            frondMesh.position.set(OX + fx, OY + 2, OZ + fz);
            frondMesh.rotation.y = ang;
            addMesh(frondMesh);
        }

        // Outer crescent breakwater
        var crescentSegs = 12;
        for (var c = 0; c < crescentSegs; c++) {
            var ca = (c / crescentSegs) * Math.PI - Math.PI * 0.5;
            var cr = 520;
            var cx = px + Math.cos(ca) * cr;
            var cz = pz - 100 + Math.sin(ca) * cr;
            makeBox(60, 4, 60, 0xD4C8A0, cx - OX, 2, cz - OZ);
        }

        // Atlantis at apex (top of trunk)
        buildAtlantisProxy(px, pz - 680);
    }

    function buildAtlantisProxy(ax, az) {
        // placeholder called from Palm — actual Atlantis built separately
        void ax; void az;
    }

    function buildAtlantis() {
        var ax = 1200;
        var az = -1900;

        // Main resort base
        makeBox(320, 20, 120, 0xF5EBD8, ax, 12, az);

        // Twin towers
        makeBox(60, 120, 60, 0xF5EBD8, ax - 120, 72, az);
        makeBox(60, 120, 60, 0xF5EBD8, ax + 120, 72, az);

        // Connecting arch between towers
        makeBox(180, 30, 40, 0xEEDDCC, ax, 137, az);

        // Central dome / arch piece
        makeCyl(40, 40, 20, 8, 0xF0E0C8, ax, 157, az);

        // Tower crowns
        makeCyl(25, 30, 20, 8, 0xF5EBD8, ax - 120, 142, az);
        makeCyl(25, 30, 20, 8, 0xF5EBD8, ax + 120, 142, az);

        // Wing buildings
        makeBox(120, 40, 60, 0xF5EBD8, ax - 220, 22, az);
        makeBox(120, 40, 60, 0xF5EBD8, ax + 220, 22, az);

        // Water park slides (simplified)
        makeCyl(6, 6, 60, 6, 0xFF6644, ax - 50, 42, az + 70);
        makeCyl(6, 6, 50, 6, 0x44AAFF, ax + 50, 37, az + 70);

        // Beach
        makeBox(400, 2, 100, 0xEEDDBB, ax, 2, az + 110);
    }

    function buildDubaiMarina() {
        var mx = -200;
        var mz = 500;

        // 3km canal (long thin box)
        makeBox(60, 3, 1200, 0x1A5A8A, mx, 1, mz);

        // Marina skyscrapers cluster
        var towers = [
            { x: -80, z: 200, w: 30, h: 260, d: 30 },
            { x: 80, z: 250, w: 28, h: 320, d: 28 },
            { x: -50, z: 400, w: 32, h: 200, d: 32 },
            { x: 100, z: 350, w: 26, h: 280, d: 26 },
            { x: -110, z: 500, w: 30, h: 240, d: 30 },
            { x: 60, z: 600, w: 28, h: 300, d: 28 },
            { x: -30, z: 700, w: 24, h: 180, d: 24 },
            { x: 120, z: 700, w: 22, h: 220, d: 22 }
        ];
        for (var t = 0; t < towers.length; t++) {
            var tw = towers[t];
            makeBox(tw.w, tw.h, tw.d, 0x1A5A8A, mx + tw.x, tw.h * 0.5, mz + tw.z);
            // Glass window band highlight
            makeBox(tw.w + 2, 4, tw.d + 2, 0x4488CC, mx + tw.x, tw.h * 0.7, mz + tw.z);
        }

        // Marina yacht club building
        makeBox(80, 30, 50, 0xCCDDEE, mx, 17, mz + 100);

        // Yachts in marina (small box hulls)
        for (var y = 0; y < 6; y++) {
            makeBox(16, 4, 5, 0xFFFFFF, mx + 40 + y * 5, 4, mz + 150 + y * 30);
            makeCyl(0.5, 0.5, 18, 4, 0xCCCCCC, mx + 40 + y * 5, 14, mz + 150 + y * 30);
        }

        // Promenade walkway
        makeBox(20, 2, 1200, 0xBBBBBB, mx + 50, 2, mz);
        makeBox(20, 2, 1200, 0xBBBBBB, mx - 50, 2, mz);
    }

    function buildMuseumOfFuture() {
        var fx = 400;
        var fz = 300;

        // The museum is an ovoid ring — approximated with BoxGeometry segments
        // arranged in an oval ring pattern
        var ringSegs = 16;
        var ringRx = 80;
        var ringRz = 55;
        var ringH = 60;
        var ringW = 20;
        var ringD = 18;
        for (var s = 0; s < ringSegs; s++) {
            var sa = (s / ringSegs) * Math.PI * 2;
            var sx = fx + Math.cos(sa) * ringRx;
            var sz = fz + Math.sin(sa) * ringRz;
            var seg = new THREE.BoxGeometry(ringW, ringH, ringD);
            var segMat = makeMat(0x228844);
            var segMesh = new THREE.Mesh(seg, segMat);
            segMesh.position.set(OX + sx, OY + ringH * 0.5 + 4, OZ + sz);
            segMesh.rotation.y = sa;
            addMesh(segMesh);
        }

        // Inner details — calligraphy panel strips
        for (var p = 0; p < 8; p++) {
            var pa = (p / 8) * Math.PI * 2;
            var px2 = fx + Math.cos(pa) * (ringRx - 2);
            var pz2 = fz + Math.sin(pa) * (ringRz - 2);
            var panBox = new THREE.BoxGeometry(ringW - 4, 8, 2);
            var panMat = makeMat(0x33AA55);
            var panMesh = new THREE.Mesh(panBox, panMat);
            panMesh.position.set(OX + px2, OY + ringH * 0.6, OZ + pz2);
            panMesh.rotation.y = pa;
            addMesh(panMesh);
        }

        // Base podium
        makeBox(180, 8, 130, 0x1A6633, fx, 4, fz);

        // Green roof cap
        makeBox(160, 6, 110, 0x228844, fx, ringH + 8, fz);

        // Central void (empty by design — no mesh inside ring intentionally)
        // Flagpole
        makeCyl(1, 1, 30, 4, 0x888888, fx, 15, fz);
    }

    function buildDubaiFrame() {
        var dfx = 700;
        var dfz = 200;
        var frameH = 150;
        var frameW = 93;

        // Two gold towers
        makeBox(18, frameH, 18, 0xDAA520, dfx - frameW * 0.5, frameH * 0.5, dfz);
        makeBox(18, frameH, 18, 0xDAA520, dfx + frameW * 0.5, frameH * 0.5, dfz);

        // Glass bridge at top connecting towers
        makeBox(frameW, 14, 18, 0xAACCEE, dfx, frameH - 7, dfz);

        // Gold accent bands on towers
        makeBox(20, 6, 20, 0xFFD700, dfx - frameW * 0.5, 40, dfz);
        makeBox(20, 6, 20, 0xFFD700, dfx + frameW * 0.5, 40, dfz);
        makeBox(20, 6, 20, 0xFFD700, dfx - frameW * 0.5, 80, dfz);
        makeBox(20, 6, 20, 0xFFD700, dfx + frameW * 0.5, 80, dfz);
        makeBox(20, 6, 20, 0xFFD700, dfx - frameW * 0.5, 120, dfz);
        makeBox(20, 6, 20, 0xFFD700, dfx + frameW * 0.5, 120, dfz);

        // Base plinths
        makeBox(30, 10, 30, 0xCC9910, dfx - frameW * 0.5, 5, dfz);
        makeBox(30, 10, 30, 0xCC9910, dfx + frameW * 0.5, 5, dfz);

        // Surrounding plaza
        makeBox(180, 2, 100, 0x999988, dfx, 1, dfz);

        // Observation glass panels on bridge underside
        makeBox(frameW - 10, 2, 10, 0x88BBDD, dfx, frameH - 13, dfz);
    }

    function buildDeiraSouk() {
        var gx = -800;
        var gz = -200;

        // Main covered souk structure
        makeBox(300, 20, 120, 0xD4A850, gx, 12, gz);

        // Roof arches (dome sections)
        for (var a = 0; a < 6; a++) {
            makeCyl(18, 18, 4, 8, 0xCC9933, gx - 110 + a * 44, 23, gz);
        }

        // Market stalls - rows of display box clusters
        for (var row = 0; row < 5; row++) {
            for (var col = 0; col < 10; col++) {
                makeBox(22, 6, 10, 0xD4A850, gx - 130 + col * 28, 5, gz - 40 + row * 20);
                // Gold glitter windows
                makeBox(20, 4, 2, 0xFFD700, gx - 130 + col * 28, 6, gz - 31 + row * 20);
            }
        }

        // Entrance arch
        makeBox(30, 30, 8, 0xCC9933, gx - 145, 17, gz);
        makeBox(30, 30, 8, 0xCC9933, gx + 145, 17, gz);
        makeBox(310, 8, 8, 0xCC9933, gx, 30, gz - 56);

        // Minaret-style decorative tower
        makeCyl(6, 8, 40, 8, 0xD4A850, gx - 155, 22, gz - 60);
        makeCone(8, 15, 8, 0xCC9933, gx - 155, 48, gz - 60);
        makeCyl(6, 8, 40, 8, 0xD4A850, gx + 155, 22, gz - 60);
        makeCone(8, 15, 8, 0xCC9933, gx + 155, 48, gz - 60);
    }

    function buildDubaiCreek() {
        var crx = -900;
        var crz = 200;

        // Creek water channel
        makeBox(80, 3, 800, 0x2A5A8A, crx, 1, crz);

        // Creek banks
        makeBox(30, 4, 800, 0xD4C8A0, crx - 55, 2, crz);
        makeBox(30, 4, 800, 0xD4C8A0, crx + 55, 2, crz);

        // Traditional abra water taxis
        for (var ab = 0; ab < 5; ab++) {
            // Hull
            makeBox(14, 3, 4, 0x885522, crx + (ab % 2 === 0 ? -10 : 10), 3, crz - 200 + ab * 80);
            // Canopy
            makeBox(10, 4, 3, 0x884422, crx + (ab % 2 === 0 ? -10 : 10), 7, crz - 200 + ab * 80);
        }

        // Traditional dhow boats (larger)
        for (var dh = 0; dh < 3; dh++) {
            makeBox(22, 5, 7, 0x774433, crx + 5, 4, crz + 100 + dh * 100);
            makeCyl(1, 1, 24, 4, 0x664422, crx + 5, 18, crz + 100 + dh * 100);
        }

        // Al Fahidi historical district buildings along creek
        for (var hb = 0; hb < 8; hb++) {
            makeBox(20, 18 + hb * 2, 20, 0xE8D8B0, crx - 80 - hb * 2, 10 + hb, crz - 300 + hb * 80);
            // Wind tower (barjeel) on top
            makeCyl(3, 3, 10, 4, 0xDDC8A0, crx - 80 - hb * 2, 22 + hb * 2, crz - 300 + hb * 80);
        }

        // Creek side mosque
        makeBox(50, 25, 50, 0xF0EAD0, crx - 120, 14, crz + 400);
        makeCyl(5, 5, 50, 8, 0xF0EAD0, crx - 140, 27, crz + 390);
        makeCone(6, 12, 8, 0xDDCCB0, crx - 140, 55, crz + 390);
        makeSphere(6, 8, 6, 0xC8B890, crx - 120, 38, crz + 400);
    }

    function buildDesertDunes() {
        var dx = 2000;
        var dz = 800;

        // Sand dune shapes using spheres and cones
        for (var d = 0; d < 12; d++) {
            var dr = 60 + (d * 17) % 80;
            var dh = 20 + (d * 13) % 40;
            var ddx = dx + (d * 150) % 900 - 200;
            var ddz = dz + (d * 110) % 600 - 100;
            makeSphere(dr, 8, 6, 0xDAB86F, ddx, dh * 0.3, ddz);
        }

        // Long dune ridges (box based)
        makeBox(400, 18, 80, 0xDAB86F, dx + 100, 9, dz - 100);
        makeBox(500, 12, 60, 0xD4B06A, dx + 300, 6, dz + 200);
        makeBox(350, 22, 90, 0xE0BF70, dx - 100, 11, dz + 400);

        // Distant desert horizon fill
        makeBox(2000, 6, 400, 0xDAB86F, dx + 600, 3, dz + 300);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) {
        void delta;
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
