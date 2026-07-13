window.AshgabatMarble = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var revolving = [];

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        return makeMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z);
    }

    function makeCyl(rt, rb, h, color, x, y, z, segs) {
        return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs || 8), color, x, y, z);
    }

    function makeSphere(r, color, x, y, z) {
        return makeMesh(new THREE.SphereGeometry(r, 12, 8), color, x, y, z);
    }

    function makeCone(r, h, color, x, y, z, segs) {
        return makeMesh(new THREE.ConeGeometry(r, h, segs || 8), color, x, y, z);
    }

    function build() {
        var cx = 23920;

        // ── Karakum Desert floor ─────────────────────────────────────────
        // Desert base as a grid of flat sand boxes (BoxGeometry allowed)
        makeBox(1200, 2, 1200, 0xDAB86F, cx, -1, 0);

        // Sand dunes scattered
        makeCyl(0, 60, 18, 0xDAB86F, cx - 350, 9, -280, 12);
        makeCyl(0, 50, 14, 0xDAB86F, cx + 420, 7, -350, 12);
        makeCyl(0, 70, 20, 0xDAB86F, cx - 500, 10, 200, 12);
        makeCyl(0, 45, 12, 0xDAB86F, cx + 280, 6, 340, 12);
        makeCyl(0, 55, 16, 0xDAB86F, cx - 200, 8, 400, 12);
        makeCyl(0, 80, 22, 0xDAB86F, cx + 550, 11, -180, 12);

        // ── Wide empty boulevards (white marble paving) ───────────────────
        makeBox(600, 0.5, 18, 0xEEEEEE, cx, 0.25, 0);      // main east-west boulevard
        makeBox(18, 0.5, 600, 0xEEEEEE, cx, 0.25, 0);      // main north-south
        makeBox(300, 0.5, 14, 0xEEEEEE, cx + 80, 0.25, 80); // side street
        makeBox(300, 0.5, 14, 0xEEEEEE, cx - 80, 0.25, -80); // side street

        // ── White Marble City Government Blocks ───────────────────────────
        // Block 1 - grand ministry building
        makeBox(60, 50, 40, 0xF5F5F5, cx - 120, 25, -70);
        makeBox(70, 10, 44, 0xF5F5F5, cx - 120, 55, -70);   // cornice
        makeBox(20, 60, 10, 0xF5F5F5, cx - 120, 30, -50);   // portico columns facade

        // Block 2 - senate building
        makeBox(55, 45, 35, 0xF5F5F5, cx + 130, 22, -65);
        makeBox(65, 8, 39, 0xF5F5F5, cx + 130, 50, -65);    // cornice

        // Block 3 - ministry of culture
        makeBox(50, 40, 32, 0xF5F5F5, cx - 110, 20, 80);
        makeBox(58, 7, 36, 0xF5F5F5, cx - 110, 44, 80);     // cornice

        // Block 4 - tall tower
        makeBox(22, 90, 22, 0xF5F5F5, cx + 90, 45, 85);
        makeBox(10, 20, 10, 0xF5F5F5, cx + 90, 100, 85);    // penthouse
        makeCyl(1, 1, 20, 0xFFD700, cx + 90, 120, 85, 4);   // spire

        // Block 5 - long low government hall
        makeBox(120, 25, 30, 0xF5F5F5, cx - 10, 12, -90);
        makeBox(124, 6, 34, 0xF5F5F5, cx - 10, 28, -90);    // roof ledge

        // Gold statue on plinth in boulevard
        makeBox(5, 8, 5, 0xF5F5F5, cx, 4, 40);              // plinth
        makeCyl(0.6, 0.6, 12, 0xFFD700, cx, 16, 40, 8);     // statue body
        makeSphere(1.5, 0xFFD700, cx, 24, 40);              // statue head

        // Gold statue 2
        makeBox(5, 8, 5, 0xF5F5F5, cx + 60, 4, -40);
        makeCyl(0.6, 0.6, 12, 0xFFD700, cx + 60, 16, -40, 8);
        makeSphere(1.5, 0xFFD700, cx + 60, 24, -40);

        // Flagpoles lining boulevard
        makeCyl(0.3, 0.3, 30, 0xCCCCCC, cx - 30, 15, 10, 6);
        makeCyl(0.3, 0.3, 30, 0xCCCCCC, cx + 30, 15, 10, 6);
        makeCyl(0.3, 0.3, 30, 0xCCCCCC, cx - 30, 15, -10, 6);
        makeCyl(0.3, 0.3, 30, 0xCCCCCC, cx + 30, 15, -10, 6);
        makeBox(6, 3, 0.2, 0x00AA44, cx - 30, 28, 10);      // flag
        makeBox(6, 3, 0.2, 0x00AA44, cx + 30, 28, 10);
        makeBox(6, 3, 0.2, 0x00AA44, cx - 30, 28, -10);
        makeBox(6, 3, 0.2, 0x00AA44, cx + 30, 28, -10);

        // ── Neutrality Monument — 75m tripod arch + revolving golden statue ──
        var nmx = cx + 200, nmz = -200;
        // Three legs of the tripod
        var leg1 = makeBox(6, 75, 6, 0xF0EDE8, nmx - 18, 37, nmz - 10);
        leg1.rotation.z = 0.18;
        var leg2 = makeBox(6, 75, 6, 0xF0EDE8, nmx + 18, 37, nmz - 10);
        leg2.rotation.z = -0.18;
        var leg3 = makeBox(6, 75, 6, 0xF0EDE8, nmx, 37, nmz + 22);
        leg3.rotation.x = -0.18;
        // Top platform where legs meet
        makeBox(28, 8, 28, 0xF0EDE8, nmx, 76, nmz);
        // Revolving golden man statue on top
        var statueBase = makeBox(4, 6, 4, 0xF0EDE8, nmx, 83, nmz);
        var statueBody = makeCyl(1.5, 1.5, 10, 0xFFD700, nmx, 92, nmz, 8);
        var statueHead = makeSphere(2, 0xFFD700, nmx, 99, nmz);
        var statueArm1 = makeBox(8, 1.5, 1.5, 0xFFD700, nmx, 94, nmz);
        revolving.push(statueBase, statueBody, statueHead, statueArm1);

        // ── Presidential Palace ───────────────────────────────────────────
        var ppx = cx - 180, ppz = -180;
        makeBox(120, 35, 80, 0xF5F5F5, ppx, 17, ppz);       // main block
        makeBox(130, 8, 88, 0xF5F5F5, ppx, 39, ppz);        // roof cornice
        makeBox(40, 45, 28, 0xF5F5F5, ppx, 22, ppz);        // central tower
        makeBox(46, 10, 32, 0xF5F5F5, ppx, 50, ppz);        // tower cornice
        // Golden crescent moon on tower
        makeCyl(4, 4, 1, 0xFFD700, ppx, 58, ppz, 16);
        makeSphere(4, 0xFFD700, ppx, 58, ppz);
        makeSphere(2.5, 0xF5F5F5, ppx + 2.5, 59, ppz);      // crescent cutout illusion
        // Golden star
        makeBox(3, 3, 0.5, 0xFFD700, ppx + 8, 61, ppz);
        // Palace flagpoles
        makeCyl(0.4, 0.4, 22, 0xCCCCCC, ppx - 55, 11, ppz - 35, 6);
        makeCyl(0.4, 0.4, 22, 0xCCCCCC, ppx + 55, 11, ppz - 35, 6);
        makeBox(7, 3.5, 0.2, 0x00AA44, ppx - 55, 21, ppz - 35);
        makeBox(7, 3.5, 0.2, 0x00AA44, ppx + 55, 21, ppz - 35);
        // Palace fountain pool
        makeCyl(18, 18, 1.5, 0x5599BB, ppx, 0.75, ppz + 60);
        makeCyl(2, 2, 8, 0xF5F5F5, ppx, 4, ppz + 60, 8);
        makeSphere(3, 0x88CCFF, ppx, 9.5, ppz + 60);

        // ── Turkmenbasy Ruhy Mosque ───────────────────────────────────────
        var mox = cx + 220, moz = 180;
        makeBox(80, 20, 80, 0xF5F5F5, mox, 10, moz);        // mosque base
        makeBox(84, 5, 84, 0xF5F5F5, mox, 22, moz);         // base cornice
        // Central dome
        makeSphere(22, 0xF5F5F5, mox, 38, moz);
        makeCyl(5, 22, 16, 0xF5F5F5, mox, 25, moz, 12);     // drum
        // Dome finial
        makeCyl(0.5, 0.5, 8, 0xFFD700, mox, 62, moz, 6);
        makeSphere(1.2, 0xFFD700, mox, 67, moz);
        // 4 minarets
        makeCyl(3, 3.5, 55, 0xF5F5F5, mox - 38, 27, moz - 38, 8);
        makeCyl(4, 3, 8, 0xF5F5F5, mox - 38, 58, moz - 38, 8);
        makeCone(2, 10, 0xF5F5F5, mox - 38, 68, moz - 38, 8);
        makeCyl(0.3, 0.3, 5, 0xFFD700, mox - 38, 75, moz - 38, 6);

        makeCyl(3, 3.5, 55, 0xF5F5F5, mox + 38, 27, moz - 38, 8);
        makeCyl(4, 3, 8, 0xF5F5F5, mox + 38, 58, moz - 38, 8);
        makeCone(2, 10, 0xF5F5F5, mox + 38, 68, moz - 38, 8);
        makeCyl(0.3, 0.3, 5, 0xFFD700, mox + 38, 75, moz - 38, 6);

        makeCyl(3, 3.5, 55, 0xF5F5F5, mox - 38, 27, moz + 38, 8);
        makeCyl(4, 3, 8, 0xF5F5F5, mox - 38, 58, moz + 38, 8);
        makeCone(2, 10, 0xF5F5F5, mox - 38, 68, moz + 38, 8);
        makeCyl(0.3, 0.3, 5, 0xFFD700, mox - 38, 75, moz + 38, 6);

        makeCyl(3, 3.5, 55, 0xF5F5F5, mox + 38, 27, moz + 38, 8);
        makeCyl(4, 3, 8, 0xF5F5F5, mox + 38, 58, moz + 38, 8);
        makeCone(2, 10, 0xF5F5F5, mox + 38, 68, moz + 38, 8);
        makeCyl(0.3, 0.3, 5, 0xFFD700, mox + 38, 75, moz + 38, 6);

        // ── Earthquake Monument — bull holding cracked earth ──────────────
        var eqx = cx - 60, eqz = 160;
        makeBox(20, 2, 20, 0x888888, eqx, 1, eqz);          // base slab
        // Bull body
        makeBox(14, 10, 8, 0x888888, eqx, 14, eqz);
        // Bull head
        makeBox(6, 7, 5, 0x888888, eqx - 10, 17, eqz);
        // Bull horns
        makeCyl(0.5, 0.3, 5, 0x888888, eqx - 14, 22, eqz - 2, 4);
        makeCyl(0.5, 0.3, 5, 0x888888, eqx - 14, 22, eqz + 2, 4);
        // Cracked globe on horns
        makeSphere(8, 0x888888, eqx - 8, 28, eqz);
        // Crack lines (thin boxes)
        makeBox(14, 0.8, 0.8, 0x555555, eqx - 8, 28, eqz);
        makeBox(0.8, 14, 0.8, 0x555555, eqx - 8, 28, eqz);
        // Bull legs
        makeCyl(1.5, 1.5, 8, 0x888888, eqx - 4, 5, eqz - 3, 6);
        makeCyl(1.5, 1.5, 8, 0x888888, eqx + 4, 5, eqz - 3, 6);
        makeCyl(1.5, 1.5, 8, 0x888888, eqx - 4, 5, eqz + 3, 6);
        makeCyl(1.5, 1.5, 8, 0x888888, eqx + 4, 5, eqz + 3, 6);

        // ── Wedding Palace — Soviet tripod with ring ──────────────────────
        var wpx = cx + 80, wpz = -160;
        // Three concrete legs of the tripod
        makeBox(8, 55, 8, 0xF5F5F5, wpx - 22, 27, wpz - 14);
        makeBox(8, 55, 8, 0xF5F5F5, wpx + 22, 27, wpz - 14);
        makeBox(8, 55, 8, 0xF5F5F5, wpx, 27, wpz + 26);
        // Top platform
        makeBox(38, 10, 38, 0xF5F5F5, wpx, 59, wpz);
        // 8 stories above platform
        makeBox(28, 35, 28, 0xF5F5F5, wpx, 82, wpz);
        makeBox(32, 5, 32, 0xF5F5F5, wpx, 102, wpz);
        // Wedding ring on top
        makeCyl(12, 12, 3, 0xFFD700, wpx, 110, wpz, 20);
        makeCyl(9, 9, 5, 0xF5F5F5, wpx, 110, wpz, 20);     // ring hole

        // ── Alem Cultural Center — star shell + Ferris wheel ─────────────
        var acx = cx - 250, acz = 50;
        // Star shape as 6 box spikes + central core
        makeBox(100, 40, 20, 0x8899CC, acx, 30, acz);       // horizontal spike
        makeBox(20, 40, 100, 0x8899CC, acx, 30, acz);       // vertical spike
        makeBox(70, 40, 70, 0x8899CC, acx, 30, acz);        // center fill
        // Angled spikes
        var spike1 = makeBox(80, 40, 14, 0x8899CC, acx, 30, acz);
        spike1.rotation.y = Math.PI / 4;
        var spike2 = makeBox(80, 40, 14, 0x8899CC, acx, 30, acz);
        spike2.rotation.y = -Math.PI / 4;
        // Glass outer shell (lighter tint)
        makeCyl(55, 55, 42, 0x99AABB, acx, 31, acz, 6);
        // Ferris wheel inside — rings and spokes
        makeCyl(28, 28, 3, 0xCCCCDD, acx, 31, acz, 16);    // outer ring
        makeCyl(25, 25, 2, 0x8899CC, acx, 31, acz, 16);    // inner ring gap
        makeCyl(1.5, 1.5, 54, 0xCCCCDD, acx, 31, acz, 6); // horizontal axle
        makeCyl(1.5, 1.5, 54, 0xCCCCDD, acx, 31, acz, 6);  // spoke vertical
        makeCyl(0.8, 0.8, 26, 0xCCCCDD, acx + 14, 31, acz, 4); // spoke

        // ── National Museum of Turkmenistan ───────────────────────────────
        var nmux = cx + 60, nmuz = 155;
        makeBox(90, 30, 60, 0xF5F5F5, nmux, 15, nmuz);      // main building
        makeBox(96, 7, 64, 0xF5F5F5, nmux, 33, nmuz);       // cornice
        // Ornamental dome
        makeSphere(15, 0xF5F5F5, nmux, 50, nmuz);
        makeCyl(6, 15, 10, 0xF5F5F5, nmux, 39, nmuz, 12);
        // Turkmen ornament band (geometric boxes)
        makeBox(90, 3, 2, 0xCC8833, nmux, 28, nmuz - 30);
        makeBox(90, 3, 2, 0xCC8833, nmux, 22, nmuz - 30);
        makeBox(2, 9, 2, 0xCC8833, nmux - 40, 25, nmuz - 30);
        makeBox(2, 9, 2, 0xCC8833, nmux - 20, 25, nmuz - 30);
        makeBox(2, 9, 2, 0xCC8833, nmux, 25, nmuz - 30);
        makeBox(2, 9, 2, 0xCC8833, nmux + 20, 25, nmuz - 30);
        makeBox(2, 9, 2, 0xCC8833, nmux + 40, 25, nmuz - 30);
        // Museum entrance portico columns
        makeCyl(2.5, 2.5, 22, 0xF5F5F5, nmux - 18, 11, nmuz - 30, 8);
        makeCyl(2.5, 2.5, 22, 0xF5F5F5, nmux, 11, nmuz - 30, 8);
        makeCyl(2.5, 2.5, 22, 0xF5F5F5, nmux + 18, 11, nmuz - 30, 8);
        makeBox(56, 5, 6, 0xF5F5F5, nmux, 24, nmuz - 30);   // entablature
        // Dome finial
        makeCyl(0.5, 0.5, 6, 0xFFD700, nmux, 66, nmuz, 6);

        // ── More White City buildings — residential/commercial blocks ─────
        makeBox(35, 30, 28, 0xF5F5F5, cx + 160, 15, 100);
        makeBox(40, 7, 32, 0xF5F5F5, cx + 160, 33, 100);
        makeBox(28, 28, 22, 0xF5F5F5, cx - 155, 14, 120);
        makeBox(32, 6, 26, 0xF5F5F5, cx - 155, 30, 120);
        makeBox(45, 22, 30, 0xF5F5F5, cx + 10, 11, -150);
        makeBox(50, 5, 34, 0xF5F5F5, cx + 10, 24, -150);

        // ── Darvaza Gas Crater ────────────────────────────────────────────
        var dvx = cx - 400, dvz = -400;
        // Crater rim (ring of raised earth)
        makeCyl(42, 38, 8, 0xDAB86F, dvx, 4, dvz, 24);     // outer rim
        // Crater inner walls descend
        makeCyl(35, 30, 10, 0xFF6600, dvx, -3, dvz, 20);
        makeCyl(28, 22, 10, 0xFF4400, dvx, -11, dvz, 16);
        makeCyl(20, 14, 8, 0xFF2200, dvx, -18, dvz, 14);
        // Glowing bottom of crater
        makeCyl(12, 12, 4, 0xFF8800, dvx, -22, dvz, 12);
        // Fire glow orbs above crater
        makeSphere(8, 0xFF5500, dvx, 6, dvz);
        makeSphere(5, 0xFF8800, dvx + 6, 9, dvz - 4);
        makeSphere(4, 0xFFAA00, dvx - 5, 8, dvz + 5);
        makeSphere(3, 0xFF3300, dvx + 2, 12, dvz + 2);
        // Desert around crater
        makeCyl(0, 30, 8, 0xDAB86F, dvx + 100, 4, dvz + 80, 10);
        makeCyl(0, 20, 6, 0xDAB86F, dvx - 80, 3, dvz - 60, 10);

        // ── Additional city details — water features, arches ──────────────
        // Grand arch at city entrance
        var archx = cx, archz = -300;
        makeBox(8, 40, 8, 0xF5F5F5, archx - 25, 20, archz);
        makeBox(8, 40, 8, 0xF5F5F5, archx + 25, 20, archz);
        makeBox(60, 12, 10, 0xF5F5F5, archx, 43, archz);
        makeBox(56, 6, 8, 0xF5F5F5, archx, 52, archz);
        makeBox(20, 5, 4, 0xFFD700, archx, 57, archz);      // golden top

        // Fountains on main boulevard
        makeCyl(12, 12, 1.5, 0x5599BB, cx + 50, 0.75, 0, 16);
        makeCyl(1.5, 1.5, 6, 0xF5F5F5, cx + 50, 3.75, 0, 8);
        makeSphere(2.5, 0x88CCFF, cx + 50, 8, 0);

        makeCyl(12, 12, 1.5, 0x5599BB, cx - 50, 0.75, 0, 16);
        makeCyl(1.5, 1.5, 6, 0xF5F5F5, cx - 50, 3.75, 0, 8);
        makeSphere(2.5, 0x88CCFF, cx - 50, 8, 0);

        // Decorative lamp posts
        makeCyl(0.5, 0.5, 14, 0xBBBBBB, cx - 10, 7, -50, 6);
        makeSphere(1.5, 0xFFFF88, cx - 10, 15, -50);
        makeCyl(0.5, 0.5, 14, 0xBBBBBB, cx + 10, 7, -50, 6);
        makeSphere(1.5, 0xFFFF88, cx + 10, 15, -50);
        makeCyl(0.5, 0.5, 14, 0xBBBBBB, cx - 10, 7, 50, 6);
        makeSphere(1.5, 0xFFFF88, cx - 10, 15, 50);
        makeCyl(0.5, 0.5, 14, 0xBBBBBB, cx + 10, 7, 50, 6);
        makeSphere(1.5, 0xFFFF88, cx + 10, 15, 50);

        // Horse statue (Akhal-Teke golden horse — Turkmenistan symbol)
        makeBox(6, 8, 12, 0xFFD700, cx, 10, -220);          // horse body
        makeCyl(2, 2, 10, 0xFFD700, cx - 7, 14, -220, 6);  // neck
        makeBox(4, 5, 4, 0xFFD700, cx - 11, 20, -220);      // head
        makeBox(1.5, 1.5, 10, 0xFFD700, cx - 3, 2, -215, 4);// front leg
        makeBox(1.5, 1.5, 10, 0xFFD700, cx + 3, 2, -215, 4);// front leg 2
        makeBox(1.5, 1.5, 10, 0xFFD700, cx - 3, 2, -225, 4);// back leg
        makeBox(1.5, 1.5, 10, 0xFFD700, cx + 3, 2, -225, 4);// back leg 2
        makeBox(6, 12, 6, 0xF5F5F5, cx, 6, -220);           // plinth under horse

        // Extra city buildings for density
        makeBox(40, 38, 25, 0xF5F5F5, cx + 195, 19, -80);
        makeBox(44, 8, 29, 0xF5F5F5, cx + 195, 42, -80);
        makeBox(30, 55, 20, 0xF5F5F5, cx - 210, 27, -100);
        makeBox(34, 8, 24, 0xF5F5F5, cx - 210, 59, -100);
        makeBox(50, 28, 35, 0xF5F5F5, cx + 260, 14, 60);
        makeBox(54, 6, 39, 0xF5F5F5, cx + 260, 31, 60);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        revolving = [];
        build();
    }

    function update(delta) {
        for (var i = 0; i < revolving.length; i++) {
            revolving[i].rotation.y += delta * 0.3;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        revolving = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
