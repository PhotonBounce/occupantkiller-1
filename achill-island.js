window.AchillIsland = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 18280;
    var CY = 0;
    var CZ = 0;

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
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildTerrain();
        buildKeemBay();
        buildSlievemore();
        buildDesertedVillage();
        buildAchillSound();
        buildKeelVillage();
        buildAtlanticDriveCliffs();
        buildDugortStrand();
        buildGraceOMalleyCastle();
        buildMinaunCliffs();
        buildSurfBeach();
    }

    function buildTerrain() {
        // Base island terrain — large green ground mass
        makebox(1800, 12, 1400, 0x4A7C40, 0, -6, 0);
        // Underlying rock layer
        makebox(1820, 6, 1420, 0x5A5A5A, 0, -12, 0);
        // Central bogland plateau (dark brown bog)
        makebox(600, 10, 400, 0x6B4226, -100, -1, 100);
        // Boggy ground detail patches
        makebox(150, 5, 120, 0x7A5535, 200, -1, -80);
        makebox(180, 5, 100, 0x6B4226, -300, -1, 200);
        // Heather moorland patch (purple-ish)
        makebox(200, 6, 150, 0x7B5EA7, 50, -1, -200);
        makebox(160, 6, 130, 0x7B5EA7, -150, -1, -300);
    }

    function buildKeemBay() {
        // Keem Bay — western most bay, stunning turquoise water
        // Main bay water surface
        makebox(320, 4, 220, 0x00CED1, -620, -2, -180);
        // Deeper water center
        makebox(200, 6, 140, 0x008B8B, -630, -4, -175);
        // Shallow nearshore water strip
        makebox(320, 3, 30, 0x40E0D0, -620, -1, -60);

        // White sandy beach arc — three sections forming a curve
        makebox(280, 3, 35, 0xFFFAF0, -620, 0, -40);
        makebox(90, 3, 60, 0xFFFAF0, -480, 0, -80);
        makebox(90, 3, 60, 0xFFFAF0, -760, 0, -80);

        // Beach sand dunes
        makebox(60, 8, 20, 0xF5E6C8, -600, 4, -22);
        makebox(50, 6, 18, 0xF5E6C8, -660, 3, -25);

        // Keem Bay cliffs — north side rising dramatically
        makebox(300, 120, 40, 0x808080, -620, 60, -310);
        makebox(100, 150, 40, 0x696969, -760, 75, -270);
        makebox(100, 90, 40, 0x808080, -480, 45, -270);
        // Cliff face detail — layered rock strata
        makebox(290, 30, 20, 0x6A6A6A, -620, 110, -295);
        makebox(290, 20, 15, 0x909090, -620, 80, -293);

        // South cliffs at Keem
        makebox(280, 100, 40, 0x808080, -620, 50, -50);
        makebox(90, 130, 40, 0x696969, -480, 65, -60);
        // Cliff waterfall trace (lighter streak)
        makebox(8, 60, 5, 0xB0C4DE, -640, 30, -305);
    }

    function buildSlievemore() {
        // Slievemore mountain — dominant peak 671m, north of island
        // Main mountain body
        makebox(500, 220, 380, 0x556B2F, 100, 110, -450);
        // Upper mountain, narrowing
        makebox(320, 120, 240, 0x4A5E28, 100, 290, -450);
        // Peak summit area
        makebox(160, 60, 120, 0x5A6A30, 100, 390, -450);
        // Rocky summit cap
        makebox(90, 40, 70, 0x808080, 105, 448, -445);
        // Ridgeline rocky outcrops
        makebox(200, 20, 30, 0x808080, 50, 395, -440);
        makebox(60, 25, 25, 0x707070, 170, 405, -430);
        makebox(40, 30, 20, 0x808080, -30, 390, -455);
        // Mountain flanks — lower slopes
        makebox(700, 80, 100, 0x4E6B28, 80, 40, -370);
        makebox(120, 40, 200, 0x556B2F, -260, 20, -460);
        makebox(120, 40, 200, 0x556B2F, 440, 20, -460);
        // Scree slopes (grey rocky debris)
        makebox(180, 30, 60, 0x888880, 60, 15, -380);
        makebox(120, 20, 40, 0x909080, 130, 10, -375);
        // Corrie hollow below summit
        makebox(80, 8, 80, 0x3A6E8A, 110, 200, -420);
        // Mountain lake (corrie lake — dark blue)
        makebox(60, 4, 50, 0x1C4B6E, 110, 198, -420);
    }

    function buildDesertedVillage() {
        // Slievemore Deserted Village — row of roofless stone cottage ruins
        // 12 cottages in a row along mountainside
        var startX = -80;
        var baseZ = -390;
        var baseY = 18;
        var i;
        for (i = 0; i < 12; i++) {
            var cx2 = startX + i * 38;
            var cz2 = baseZ - i * 8;
            var cy2 = baseY + i * 2;
            // Cottage front wall
            makebox(22, 16, 2, 0x808080, cx2, cy2, cz2);
            // Cottage back wall
            makebox(22, 16, 2, 0x808080, cx2, cy2, cz2 - 14);
            // Cottage left side wall
            makebox(2, 16, 14, 0x808080, cx2 - 10, cy2, cz2 - 7);
            // Cottage right side wall
            makebox(2, 16, 14, 0x808080, cx2 + 10, cy2, cz2 - 7);
            // Ruined gable end remnant (partial)
            makebox(4, 24, 2, 0x707070, cx2 - 9, cy2 + 8, cz2 - 14);
        }
        // Village track/path along cottages
        makebox(440, 2, 5, 0xC8B89A, 130, 17, -385);
        // Stone field wall running above village
        makebox(460, 10, 4, 0x969696, 130, 23, -410);
    }

    function buildAchillSound() {
        // Achill Sound — eastern strait between island and mainland
        // Sound water channel
        makebox(80, 4, 400, 0x006994, 820, -2, 0);
        // Swing bridge deck
        makebox(80, 5, 14, 0xC0C0C0, 820, 4, 0);
        // Bridge side railings
        makebox(80, 8, 2, 0xA0A0A0, 820, 8, -7);
        makebox(80, 8, 2, 0xA0A0A0, 820, 8, 7);
        // Bridge support towers
        makebox(6, 28, 6, 0xB8B8B8, 790, 16, 0);
        makebox(6, 28, 6, 0xB8B8B8, 850, 16, 0);
        // Bridge cables (thin boxes)
        makebox(2, 20, 30, 0x909090, 790, 22, 0);
        makebox(2, 20, 30, 0x909090, 850, 22, 0);
        // Mainland approach road
        makebox(20, 3, 120, 0x808080, 900, 2, 0);
        // Island approach road
        makebox(20, 3, 120, 0x808080, 740, 2, 0);
        // Causeway/quay walls
        makebox(4, 10, 100, 0x909090, 812, 5, 0);
        makebox(4, 10, 100, 0x909090, 828, 5, 0);
        // Boat mooring posts
        makecyl(1, 1, 8, 6, 0x4A3728, 800, 4, 20);
        makecyl(1, 1, 8, 6, 0x4A3728, 800, 4, -20);
        makecyl(1, 1, 8, 6, 0x4A3728, 840, 4, 20);
        // Small boat at quay
        makebox(12, 4, 5, 0x8B6914, 800, 2, 30);
    }

    function buildKeelVillage() {
        // Keel village — central south coast settlement
        var i;
        // White painted cottages — cluster
        var keelCottages = [
            [-50, 50], [-10, 48], [30, 52], [70, 50], [-90, 55],
            [-50, 80], [-10, 82], [30, 85], [70, 78]
        ];
        for (i = 0; i < keelCottages.length; i++) {
            var kx = keelCottages[i][0];
            var kz = keelCottages[i][1];
            // Cottage walls
            makebox(18, 10, 12, 0xFFFFF0, kx, 5, kz);
            // Cottage roof (low gable)
            makecone(12, 8, 4, 0xD2691E, kx, 14, kz);
        }
        // Pub buildings — reddish
        makebox(22, 14, 16, 0xCD5C5C, 110, 7, 60);
        makebox(20, 14, 14, 0xCD5C5C, 140, 7, 65);
        // Pub signboard (flat box)
        makebox(18, 4, 1, 0x8B0000, 110, 18, 52);
        // Village shop
        makebox(20, 12, 14, 0xFFFFF0, -130, 6, 62);
        makebox(20, 12, 14, 0xE8E8D0, -160, 6, 58);
        // Village road
        makebox(200, 2, 8, 0x808080, 0, 1, 70);
        // Church (white with grey roof)
        makebox(20, 18, 30, 0xFAFAF0, -200, 9, 65);
        makecone(5, 15, 4, 0x808080, -200, 30, 50);
        // Church cross on top
        makebox(2, 8, 1, 0xC0C0C0, -200, 42, 50);
        makebox(6, 2, 1, 0xC0C0C0, -200, 46, 50);
        // Keel beach (south side)
        makebox(300, 3, 30, 0xFFFAF0, 0, 0, 30);
    }

    function buildAtlanticDriveCliffs() {
        // Atlantic Drive — dramatic west coast cliffs
        // Main cliff wall sections
        makebox(60, 180, 30, 0x808080, -720, 90, 100);
        makebox(60, 200, 30, 0x808080, -780, 100, 180);
        makebox(60, 160, 30, 0x696969, -760, 80, 60);
        makebox(60, 220, 30, 0x808080, -800, 110, 260);
        makebox(60, 190, 30, 0x696969, -810, 95, 340);
        makebox(60, 170, 30, 0x808080, -790, 85, 420);
        // Cliff base sea
        makebox(100, 20, 600, 0x006994, -780, -10, 250);
        // Cliff top grass strip
        makebox(30, 5, 600, 0x556B2F, -740, 4, 250);
        // Rock stacks in sea (sea stacks)
        makebox(10, 40, 10, 0x707070, -820, 20, 150);
        makebox(8, 30, 8, 0x808080, -835, 15, 200);
        makebox(12, 50, 10, 0x686868, -825, 25, 300);
        // Atlantic Drive road
        makebox(14, 3, 600, 0x808080, -710, 2, 250);
        // Cliff face rock strata bands
        makebox(50, 8, 25, 0x909090, -720, 60, 100);
        makebox(50, 8, 25, 0x707070, -720, 120, 100);
        makebox(50, 8, 25, 0x909090, -780, 80, 180);
    }

    function buildDugortStrand() {
        // Dugort strand — north coast long sandy beach
        // Main beach strip
        makebox(500, 3, 50, 0xF5DEB3, 200, 0, -680);
        // Wet sand near water
        makebox(500, 2, 20, 0xE8CFA0, 200, 0, -660);
        // Dune system
        makebox(80, 12, 18, 0xF0D89A, 50, 6, -700);
        makebox(60, 10, 15, 0xF0D89A, 140, 5, -705);
        makebox(70, 14, 20, 0xF0D89A, 280, 7, -698);
        makebox(55, 9, 14, 0xF0D89A, 360, 5, -702);
        // Marram grass on dunes (dark green patches)
        makebox(80, 4, 8, 0x2D5A20, 50, 14, -700);
        makebox(70, 4, 8, 0x2D5A20, 280, 17, -698);
        // Dugort village above beach
        makebox(18, 10, 12, 0xFFFFF0, 160, 5, -730);
        makebox(18, 10, 12, 0xFFFFF0, 195, 5, -728);
        makebox(18, 10, 12, 0xFFFFF0, 230, 5, -730);
        // Hostel/hotel building
        makebox(35, 16, 20, 0xFFF8DC, 100, 8, -740);
        // Beach access path
        makebox(6, 2, 60, 0xD2B48C, 200, 1, -690);
        // Offshore water
        makebox(600, 6, 100, 0x006994, 200, -3, -620);
    }

    function buildGraceOMalleyCastle() {
        // Grace O'Malley's Castle — medieval tower house ruin on Achill shore
        // Main tower base (thick stone walls)
        makebox(20, 8, 20, 0x8B7355, 680, 4, -200);
        // Tower walls — hollow shell (four walls)
        makebox(20, 40, 3, 0x8B7355, 680, 28, -190);
        makebox(20, 40, 3, 0x8B7355, 680, 28, -210);
        makebox(3, 40, 20, 0x8B7355, 670, 28, -200);
        makebox(3, 40, 20, 0x8B7355, 690, 28, -200);
        // Upper floor remnant
        makebox(14, 3, 14, 0x7A6348, 680, 40, -200);
        // Battlements (merlons)
        makebox(4, 8, 3, 0x8B7355, 672, 52, -190);
        makebox(4, 8, 3, 0x8B7355, 680, 52, -190);
        makebox(4, 8, 3, 0x8B7355, 688, 52, -190);
        makebox(4, 8, 3, 0x8B7355, 672, 52, -210);
        makebox(4, 8, 3, 0x8B7355, 688, 52, -210);
        // Ruined corner tower
        makebox(6, 30, 6, 0x7A6348, 692, 23, -192);
        // Surrounding castle wall fragments
        makebox(30, 10, 3, 0x8B7355, 680, 5, -175);
        makebox(3, 10, 25, 0x8B7355, 665, 5, -187);
        // Castle courtyard ground
        makebox(28, 2, 22, 0x9E8B72, 680, 1, -200);
        // Waterside — castle sits on rocky shore
        makebox(40, 8, 20, 0x707060, 680, -2, -168);
        makebox(60, 6, 10, 0x006994, 680, -1, -155);
    }

    function buildMinaunCliffs() {
        // Minaun cliffs — very tall, south coast, dark dramatic
        makebox(80, 260, 35, 0x696969, -300, 130, 480);
        makebox(80, 240, 35, 0x696969, -220, 120, 485);
        makebox(80, 280, 35, 0x696969, -380, 140, 475);
        makebox(80, 220, 35, 0x696969, -460, 110, 470);
        makebox(80, 300, 35, 0x696969, -140, 150, 488);
        makebox(80, 250, 35, 0x696969, -60, 125, 483);
        // Cliff top plateau
        makebox(500, 8, 30, 0x556B2F, -260, 4, 465);
        // Cliff face strata lines
        makebox(70, 12, 30, 0x808080, -300, 80, 478);
        makebox(70, 12, 30, 0x808080, -300, 160, 478);
        makebox(70, 12, 30, 0x909090, -220, 70, 483);
        makebox(70, 12, 30, 0x909090, -380, 100, 473);
        // Sea below cliffs
        makebox(600, 8, 80, 0x006994, -260, -4, 540);
        // Sea spray effect (white boxes)
        makebox(10, 6, 6, 0xE0F0FF, -280, 4, 500);
        makebox(8, 5, 5, 0xE0F0FF, -340, 3, 498);
        makebox(12, 6, 6, 0xE0F0FF, -220, 4, 502);
        // Cliff top heather
        makebox(100, 4, 20, 0x7B5EA7, -260, 8, 462);
        makebox(80, 4, 15, 0x7B5EA7, -400, 6, 460);
    }

    function buildSurfBeach() {
        // Surf beach — popular beach on south/southwest coast
        // Beach sand
        makebox(300, 3, 60, 0xFFFAF0, -200, 0, 350);
        // Wave boxes at shoreline — rolling white water
        makebox(280, 6, 12, 0xF0F8FF, -200, 3, 310);
        makebox(240, 5, 10, 0xE8F4FF, -200, 3, 298);
        makebox(200, 4, 8, 0xD8ECFF, -200, 2, 288);
        // Breaking wave crests (white foam)
        makebox(280, 3, 5, 0xFFFFFF, -200, 7, 310);
        makebox(240, 2, 4, 0xFFFFFF, -200, 6, 298);
        // Offshore wave sets
        makebox(300, 4, 8, 0xF0F8FF, -200, 2, 270);
        makebox(300, 4, 8, 0xF0F8FF, -200, 2, 255);
        // Ocean beyond
        makebox(400, 8, 150, 0x006994, -200, -2, 180);
        // Surfer figures — simple box shapes in water
        makebox(2, 6, 1, 0xFF6600, -160, 5, 305);
        makebox(2, 6, 1, 0x0000FF, -190, 5, 302);
        makebox(2, 6, 1, 0xFF0000, -220, 5, 308);
        makebox(2, 6, 1, 0x00AA00, -240, 5, 300);
        // Surfboards under surfers
        makebox(1, 1, 7, 0xFFFF00, -160, 3, 305);
        makebox(1, 1, 7, 0xFF69B4, -190, 3, 302);
        makebox(1, 1, 7, 0xFFFFFF, -220, 3, 308);
        // Car park behind beach
        makebox(80, 2, 40, 0x808080, -200, 1, 398);
        // Lifeguard tower
        makebox(6, 2, 6, 0xFF0000, -140, 1, 375);
        makebox(6, 10, 6, 0xFF0000, -140, 7, 375);
        makebox(10, 3, 10, 0xFF4444, -140, 13, 375);
        // Beach dunes backing the surf beach
        makebox(60, 10, 18, 0xF0D89A, -250, 5, 370);
        makebox(50, 8, 15, 0xF0D89A, -170, 4, 372);
        makebox(55, 9, 16, 0xF0D89A, -100, 5, 368);
        // Rock pools at south end
        makebox(15, 4, 15, 0x2E8B57, -340, 2, 340);
        makebox(10, 4, 10, 0x008080, -325, 2, 355);
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
