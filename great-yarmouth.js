window.GreatYarmouth = (function() {
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
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

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 21680;

        // ── North Sea ──────────────────────────────────────────────────────────
        // Deep open sea further out
        makeBox(600, 2, 400, 0x006994, cx + 300, -1, 0);
        // Choppy near-shore water
        makeBox(120, 1.5, 400, 0x005580, cx + 80, -0.5, 0);
        // Wave crests (slightly lighter boxes)
        makeBox(110, 2, 8, 0x3399BB, cx + 70, 0.5, -60);
        makeBox(110, 2, 8, 0x3399BB, cx + 70, 0.5, 40);
        makeBox(110, 2, 8, 0x3399BB, cx + 70, 0.5, 120);
        makeBox(110, 2, 8, 0x3399BB, cx + 70, 0.5, -140);

        // ── Sandy Beach / Golden Mile ──────────────────────────────────────────
        makeBox(80, 1, 400, 0xF4E0A0, cx + 20, 0, 0);
        // Dry upper beach (slightly paler)
        makeBox(40, 1.2, 400, 0xF0D890, cx - 5, 0.1, 0);
        // Beach huts row (small colourful boxes)
        var hutColors = [0xFF4444, 0x44BBFF, 0xFFDD00, 0x44CC44, 0xFF8800, 0xAA44FF, 0xFF4488, 0x00CCAA];
        for (var hi = 0; hi < 8; hi++) {
            makeBox(4, 3, 3, hutColors[hi], cx - 18, 1.5, -140 + hi * 40);
            makeCone(2.5, 2, 4, 0xCC2200, cx - 18, 3.5, -140 + hi * 40);
        }

        // ── Promenade ─────────────────────────────────────────────────────────
        makeBox(12, 0.6, 400, 0xCCBBAA, cx - 26, 0.3, 0);
        // Promenade railings (LineSegments along edge)
        (function() {
            var pts = [];
            for (var ri = 0; ri <= 20; ri++) {
                pts.push(cx - 21, 1.5, -190 + ri * 19);
                pts.push(cx - 21, 0.3, -190 + ri * 19);
            }
            var buf = new THREE.BufferGeometry();
            var arr = new Float32Array(pts.length);
            for (var k = 0; k < pts.length; k++) arr[k] = pts[k];
            buf.setAttribute('position', new THREE.BufferAttribute(arr, 3));
            var lmat = new THREE.LineBasicMaterial({ color: 0x888888 });
            var lines = new THREE.LineSegments(buf, lmat);
            scene.add(lines);
            objects.push(lines);
        }());

        // ── Amusement Arcades (Golden Mile) ───────────────────────────────────
        // Arcade 1
        makeBox(18, 8, 22, 0xFF8844, cx - 42, 4, -150);
        makeBox(18, 1, 22, 0xFFAA66, cx - 42, 8.5, -150);
        // Arcade 2
        makeBox(20, 9, 26, 0xFF6622, cx - 44, 4.5, -80);
        makeBox(20, 1.2, 26, 0xFF8844, cx - 44, 9.6, -80);
        // Arcade 3 — bigger fun palace
        makeBox(28, 10, 30, 0xFF9933, cx - 46, 5, 20);
        makeBox(28, 1.5, 30, 0xFFBB55, cx - 46, 10.75, 20);
        makeSphere(4, 8, 6, 0xFFDD00, cx - 46, 13, 20);
        // Arcade 4
        makeBox(16, 7, 20, 0xFF7733, cx - 42, 3.5, 110);
        // Arcade signs (thin bright boxes on fronts)
        makeBox(18, 2, 0.5, 0xFFEE00, cx - 33, 7, -150);
        makeBox(20, 2, 0.5, 0xFFEE00, cx - 34, 8, -80);
        makeBox(28, 2.5, 0.5, 0xFF2200, cx - 32, 9.5, 20);

        // ── Britannia Pier ────────────────────────────────────────────────────
        // Pier deck
        makeBox(14, 1.5, 200, 0x8B6914, cx + 10, 0.75, -160);
        // Pier legs (cylinder posts in sea)
        for (var pi = 0; pi < 10; pi++) {
            makeCyl(0.6, 0.6, 6, 6, 0x6B4F0F, cx + 10, -2.5, -75 - pi * 18);
            makeCyl(0.6, 0.6, 6, 6, 0x6B4F0F, cx + 16, -2.5, -75 - pi * 18);
            makeCyl(0.6, 0.6, 6, 6, 0x6B4F0F, cx + 4, -2.5, -75 - pi * 18);
        }
        // Theatre at pier end
        makeBox(20, 12, 24, 0x9B7722, cx + 10, 6.75, -255);
        makeCone(11, 8, 4, 0x7A5510, cx + 10, 16.75, -255);
        // Pier entrance pavilion
        makeBox(18, 8, 10, 0xA07828, cx + 10, 4.75, -65);
        makeCone(9.5, 5, 4, 0x7A5510, cx + 10, 12.25, -65);
        // Flagpole on theatre
        makeCyl(0.2, 0.2, 8, 4, 0xCCCCCC, cx + 10, 20.75, -255);
        makeSphere(0.8, 6, 4, 0xFF0000, cx + 10, 25.75, -255);

        // ── Wellington Pier ───────────────────────────────────────────────────
        // Pier deck
        makeBox(12, 1.5, 160, 0x8B6914, cx + 10, 0.75, 120);
        // Pier posts
        for (var wp = 0; wp < 8; wp++) {
            makeCyl(0.6, 0.6, 6, 6, 0x6B4F0F, cx + 10, -2.5, 55 + wp * 18);
            makeCyl(0.6, 0.6, 6, 6, 0x6B4F0F, cx + 15, -2.5, 55 + wp * 18);
            makeCyl(0.6, 0.6, 6, 6, 0x6B4F0F, cx + 5, -2.5, 55 + wp * 18);
        }
        // Winter Gardens building at pier end
        makeBox(22, 10, 18, 0x9B7722, cx + 10, 5.75, 200);
        // Glass dome over winter gardens (sphere approximation)
        makeSphere(10, 10, 6, 0xAADDCC, cx + 10, 15.75, 200);
        // Pier head amusement building
        makeBox(14, 7, 14, 0xA07828, cx + 10, 4.25, 180);
        // Wellington pier entrance
        makeBox(16, 9, 8, 0x9B7722, cx + 10, 4.75, 55);
        makeCone(9, 6, 4, 0x7A5510, cx + 10, 12.75, 55);

        // ── Town Walls (Medieval) ─────────────────────────────────────────────
        // North wall segment
        makeBox(180, 7, 3, 0xAAAAAA, cx - 90, 3.5, -180);
        // South wall segment
        makeBox(180, 7, 3, 0xAAAAAA, cx - 90, 3.5, 180);
        // West wall segment
        makeBox(3, 7, 360, 0xAAAAAA, cx - 178, 3.5, 0);
        // Round towers every ~50m along north wall
        makeCyl(5, 5, 10, 10, 0x999999, cx - 178, 5, -180);
        makeCyl(5, 5, 10, 10, 0x999999, cx - 130, 5, -180);
        makeCyl(5, 5, 10, 10, 0x999999, cx - 80, 5, -180);
        makeCyl(5, 5, 10, 10, 0x999999, cx - 30, 5, -180);
        // Round towers south wall
        makeCyl(5, 5, 10, 10, 0x999999, cx - 178, 5, 180);
        makeCyl(5, 5, 10, 10, 0x999999, cx - 130, 5, 180);
        makeCyl(5, 5, 10, 10, 0x999999, cx - 80, 5, 180);
        makeCyl(5, 5, 10, 10, 0x999999, cx - 30, 5, 180);
        // Corner towers
        makeCyl(6, 6, 12, 10, 0x999999, cx - 178, 6, -180);
        makeCyl(6, 6, 12, 10, 0x999999, cx - 178, 6, 180);
        // Battlements (crenellations — small boxes on top of walls)
        for (var bm = 0; bm < 12; bm++) {
            makeBox(4, 2, 3.5, 0xBBBBBB, cx - 168 + bm * 14, 8, -180);
            makeBox(4, 2, 3.5, 0xBBBBBB, cx - 168 + bm * 14, 8, 180);
        }
        for (var bw = 0; bw < 10; bw++) {
            makeBox(3.5, 2, 4, 0xBBBBBB, cx - 178, 8, -160 + bw * 32);
        }

        // ── Tolhouse Museum ───────────────────────────────────────────────────
        // Main flint building
        makeBox(22, 10, 16, 0x888888, cx - 110, 5, -30);
        // Second storey
        makeBox(18, 5, 12, 0x7A7A7A, cx - 110, 12.5, -30);
        // Roof
        makeCone(13, 6, 4, 0x666666, cx - 110, 17.5, -30);
        // Entrance arch (tall thin box)
        makeBox(4, 6, 1, 0x999999, cx - 99, 3, -30);

        // ── St Nicholas Minster ───────────────────────────────────────────────
        // Massive nave — largest parish church in England
        makeBox(55, 18, 28, 0xD4C8A0, cx - 100, 9, 60);
        // Chancel
        makeBox(22, 16, 22, 0xD0C49C, cx - 68, 8, 60);
        // Central tower
        makeBox(16, 36, 16, 0xC8BC98, cx - 110, 18, 60);
        // Tower pinnacles
        makeCone(3, 10, 4, 0xBEB290, cx - 117, 40, 53);
        makeCone(3, 10, 4, 0xBEB290, cx - 103, 40, 53);
        makeCone(3, 10, 4, 0xBEB290, cx - 117, 40, 67);
        makeCone(3, 10, 4, 0xBEB290, cx - 103, 40, 67);
        // Nave roof ridge
        makeCone(28, 8, 4, 0xC0B490, cx - 100, 23, 60);
        // North transept
        makeBox(18, 14, 20, 0xD2C6A0, cx - 112, 7, 46);
        // South transept
        makeBox(18, 14, 20, 0xD2C6A0, cx - 112, 7, 74);
        // Buttresses
        makeBox(3, 18, 4, 0xC8BC98, cx - 95, 9, 47);
        makeBox(3, 18, 4, 0xC8BC98, cx - 95, 9, 73);
        makeBox(3, 18, 4, 0xC8BC98, cx - 120, 9, 47);
        makeBox(3, 18, 4, 0xC8BC98, cx - 120, 9, 73);

        // ── River Yare ────────────────────────────────────────────────────────
        makeBox(500, 1.5, 60, 0x4682B4, cx - 250, -0.25, -250);
        // River bank near side
        makeBox(500, 2, 10, 0x8B7355, cx - 250, 0.5, -222);
        // Quayside
        makeBox(200, 1, 20, 0xAA9977, cx - 100, 0.2, -215);

        // ── Herring Smacks in Harbour ─────────────────────────────────────────
        for (var hs = 0; hs < 4; hs++) {
            // Hull
            makeBox(14, 3, 5, 0x8B6914, cx - 80 + hs * 22, 1, -220);
            // Cabin
            makeBox(5, 3, 4, 0x7A5810, cx - 76 + hs * 22, 3.5, -220);
            // Mast
            makeCyl(0.3, 0.3, 16, 4, 0x5C4010, cx - 80 + hs * 22, 9.5, -220);
            // Sail (folded box)
            makeBox(0.5, 8, 6, 0xEEDDCC, cx - 80 + hs * 22, 8, -220);
        }

        // ── Norfolk Broads Inland ─────────────────────────────────────────────
        // Broad 1 — flat water expanse
        makeBox(180, 1, 100, 0x4682B4, cx - 260, -0.5, 80);
        // Broad 2
        makeBox(120, 1, 80, 0x5090C0, cx - 300, -0.5, -60);
        // Reed beds (thin tall boxes in clusters)
        for (var rb = 0; rb < 12; rb++) {
            makeCyl(0.4, 0.4, 5, 4, 0x8B7355, cx - 200 + (rb % 6) * 8, 2.5, 75 + (rb % 3) * 8);
        }
        // Broads cruiser boat
        makeBox(10, 2.5, 4, 0xFFFFEE, cx - 240, 1, 85);
        makeBox(6, 2, 3, 0xEEEEDD, cx - 237, 3.5, 85);
        makeCyl(0.25, 0.25, 6, 4, 0x888888, cx - 238, 6.5, 85);
        // Second cruiser
        makeBox(10, 2.5, 4, 0xDDEEFF, cx - 265, 1, 75);
        makeBox(6, 2, 3, 0xCCDDEE, cx - 262, 3.5, 75);

        // ── Town Centre Buildings ─────────────────────────────────────────────
        // Market Place row of shops
        makeBox(16, 10, 12, 0xCC9966, cx - 70, 5, -10);
        makeBox(14, 12, 12, 0xBB8855, cx - 54, 6, -10);
        makeBox(18, 9, 12, 0xDDAA77, cx - 88, 4.5, -10);
        // Town Hall
        makeBox(24, 14, 18, 0xD4C090, cx - 150, 7, 10);
        makeCyl(4, 4, 20, 8, 0xC0AC7C, cx - 150, 17, 10);
        makeSphere(2.5, 8, 6, 0xB8A470, cx - 150, 28, 10);
        // Row of terraced houses
        for (var th = 0; th < 6; th++) {
            makeBox(8, 9, 10, 0xCC9977, cx - 60 + th * 10, 4.5, 100);
            makeCone(4.5, 4, 4, 0x884422, cx - 60 + th * 10, 11, 100);
        }
        // Rows of Victorian seaside hotels
        makeBox(30, 16, 14, 0xEEDDCC, cx - 50, 8, -100);
        makeBox(26, 14, 14, 0xE8D8C8, cx - 30, 7, -100);
        makeCone(5, 5, 4, 0xCC9966, cx - 50, 18.5, -100);
        makeCone(4.5, 5, 4, 0xCC9966, cx - 30, 16.5, -100);

        // ── Rollercoaster / Funfair on Golden Mile ────────────────────────────
        // Ferris wheel spokes (cylinders)
        makeCyl(0.5, 0.5, 30, 8, 0xCC2200, cx - 50, 15, 160);
        makeCyl(15, 15, 1, 16, 0xCC2200, cx - 50, 15, 160);
        // Ride gondolas around wheel (small spheres)
        for (var fg = 0; fg < 8; fg++) {
            var fgAngle = fg * Math.PI / 4;
            makeSphere(1.2, 6, 4, 0xFFEE00, cx - 50 + Math.cos(fgAngle) * 14, 15 + Math.sin(fgAngle) * 14, 160);
        }
        // Helter skelter
        makeCone(5, 22, 8, 0xFF2244, cx - 62, 11, 145);
        makeCyl(5, 5, 1, 8, 0xFF4466, cx - 62, 0.5, 145);

        // ── Lighthouse ────────────────────────────────────────────────────────
        makeCyl(4, 5, 28, 10, 0xFFFFFF, cx + 5, 14, -200);
        makeCyl(5, 5, 2, 10, 0xCCCCCC, cx + 5, 28.5, -200);
        makeSphere(3, 8, 6, 0xFFDD00, cx + 5, 30.5, -200);
        makeBox(2, 1, 6, 0xFF0000, cx + 5, 0.5, -200);

        // ── Road / Streets ────────────────────────────────────────────────────
        // Marine Parade (main seafront road)
        makeBox(10, 0.5, 400, 0x444444, cx - 35, 0.25, 0);
        // Central road inland
        makeBox(400, 0.5, 8, 0x333333, cx - 100, 0.25, 0);

        // ── Lamp posts along promenade ────────────────────────────────────────
        for (var lp = 0; lp < 8; lp++) {
            makeCyl(0.25, 0.25, 7, 4, 0x555555, cx - 30, 3.5, -168 + lp * 48);
            makeSphere(1, 6, 4, 0xFFEE88, cx - 30, 7.5, -168 + lp * 48);
        }

        // ── Cliffs / Dunes at north end ───────────────────────────────────────
        makeBox(40, 8, 30, 0xD4C070, cx - 5, 4, -195);
        makeBox(30, 5, 20, 0xC8B460, cx + 10, 2.5, -195);
        makeCone(12, 6, 4, 0xD0BC6C, cx - 5, 10.5, -192);

        // ── Public Gardens / Bowling Green ────────────────────────────────────
        makeBox(40, 0.5, 30, 0x336622, cx - 90, 0.25, 130);
        // Bandstand
        makeCyl(8, 8, 1, 8, 0x448833, cx - 90, 0.75, 130);
        makeCyl(0.4, 0.4, 5, 6, 0x888888, cx - 82, 3, 122);
        makeCyl(0.4, 0.4, 5, 6, 0x888888, cx - 98, 3, 122);
        makeCyl(0.4, 0.4, 5, 6, 0x888888, cx - 98, 3, 138);
        makeCyl(0.4, 0.4, 5, 6, 0x888888, cx - 82, 3, 138);
        makeCone(9, 4, 8, 0x226611, cx - 90, 6.5, 130);

        // ── Suspension Bridge over Yare ───────────────────────────────────────
        makeBox(8, 1, 70, 0x777766, cx - 175, 3, -250);
        makeCyl(2, 2, 14, 6, 0x666655, cx - 175, 7, -220);
        makeCyl(2, 2, 14, 6, 0x666655, cx - 175, 7, -280);
        // Cable lines represented as thin boxes
        makeBox(0.5, 6, 60, 0x999988, cx - 175, 7, -250);

        // ── St George's Park / open green space ──────────────────────────────
        makeBox(60, 0.4, 40, 0x447733, cx - 140, 0.2, -70);
        // Trees (cone + cylinder trunk)
        for (var tr = 0; tr < 5; tr++) {
            makeCyl(0.5, 0.5, 5, 5, 0x5C3A1E, cx - 125 + tr * 12, 2.5, -70);
            makeCone(5, 8, 6, 0x227722, cx - 125 + tr * 12, 9.5, -70);
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
