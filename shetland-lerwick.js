window.ShetlandLerwick = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var fireMeshes = [];
    var fireTimer = 0;

    var OX = 22520;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        fireMeshes = [];
        fireTimer = 0;
        build();
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function addBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCyl(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCone(r, h, seg, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, seg);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildOcean();
        buildPeatMoorland();
        buildBressaySound();
        buildLerwickTown();
        buildFortCharlotte();
        buildClickiminBroch();
        buildMousaBroch();
        buildUpHellyAa();
        buildJarlshof();
        buildSullomVoe();
        buildBressayIsland();
        buildAmbientLight();
    }

    function buildAmbientLight() {
        var ambient = new THREE.AmbientLight(0x334455, 0.8);
        scene.add(ambient);
        var sun = new THREE.DirectionalLight(0xCCBBAA, 0.6);
        sun.position.set(OX + 200, OY + 300, OZ - 100);
        scene.add(sun);
    }

    function buildOcean() {
        // North Atlantic ocean base — large flat box
        addBox(2400, 4, 1800, 0x1A3A5C, 0, -2, 0);
        // Wave-layer variation boxes to give ocean texture
        addBox(600, 3, 400, 0x1E3F64, -500, -1, -300);
        addBox(500, 3, 350, 0x163258, 400, -1, 300);
        addBox(700, 3, 300, 0x1C3A5A, 200, -1, -500);
        // Stormy whitecap hints
        addBox(80, 2, 40, 0x4A6A8A, -600, 2, -200);
        addBox(60, 2, 30, 0x4A6A8A, 350, 2, 400);
        addBox(90, 2, 50, 0x4A6A8A, -200, 2, 600);
    }

    function buildPeatMoorland() {
        // Dark brown peat moorland covering the island hills
        addBox(800, 18, 600, 0x7B5B3A, -100, 9, 50);
        addBox(400, 22, 300, 0x6B4B2A, 150, 11, -80);
        addBox(300, 15, 250, 0x7B5B3A, -250, 7, 120);
        addBox(200, 25, 180, 0x6E5030, 80, 12, -200);
        // Bog pools (blue water pools in peat)
        addBox(30, 1, 20, 0x4682B4, -80, 19, 30);
        addBox(20, 1, 15, 0x4682B4, -110, 20, 60);
        addBox(40, 1, 25, 0x4682B4, 60, 23, -90);
        addBox(15, 1, 18, 0x4682B4, -200, 16, 100);
        addBox(25, 1, 12, 0x4682B4, 200, 13, -150);
        // Peat hummocks
        addBox(50, 8, 40, 0x5A3E20, -300, 23, 80);
        addBox(60, 10, 50, 0x7B5B3A, 220, 17, 200);
        addBox(45, 7, 35, 0x6B4B2A, -180, 22, -150);
    }

    function buildBressaySound() {
        // Sheltered harbour water between Lerwick and Bressay
        addBox(300, 3, 400, 0x006994, 180, -1, 0);
        addBox(120, 3, 200, 0x0077A8, 150, 0, 50);
        addBox(80, 3, 180, 0x005C80, 220, 0, -60);
        // Harbour wall / pier
        addBox(120, 6, 10, 0x888888, 80, 3, -80);
        addBox(10, 6, 80, 0x888888, 80, 3, -120);
        addBox(120, 6, 10, 0x777777, 80, 3, 80);
        // Mooring posts
        addCyl(1, 1, 8, 6, 0x444444, 60, 4, -75);
        addCyl(1, 1, 8, 6, 0x444444, 80, 4, -75);
        addCyl(1, 1, 8, 6, 0x444444, 100, 4, -75);
        // Small fishing boat hull shapes
        addBox(18, 5, 8, 0x8B4513, 120, 2, -40);
        addBox(14, 4, 6, 0x6B3410, 140, 2, 30);
        addBox(20, 5, 9, 0x5C3317, 110, 2, 60);
        // Boat masts
        addCyl(0.5, 0.5, 20, 4, 0x554433, 120, 12, -40);
        addCyl(0.5, 0.5, 18, 4, 0x554433, 110, 11, 60);
    }

    function buildLerwickTown() {
        // Grey stone buildings on slopes above Bressay Sound
        // Commercial Street row — main street parallel to sound
        addBox(14, 18, 10, 0xD4C8A0, 20, 9, -50);
        addBox(12, 16, 10, 0xCCC0A0, 36, 8, -50);
        addBox(16, 20, 10, 0xD0C4A0, 4, 10, -50);
        addBox(14, 15, 10, 0xC8BC98, 52, 7, -50);
        addBox(12, 22, 10, 0xD4C8A0, -12, 11, -50);
        // Back row of buildings on higher ground (slope)
        addBox(14, 16, 10, 0xCCC0A0, 20, 12, -65);
        addBox(12, 18, 10, 0xD4C8A0, 36, 13, -65);
        addBox(16, 14, 10, 0xC8BC98, 4, 11, -65);
        // Town Hall — prominent civic building
        addBox(30, 28, 20, 0xD0C4A0, 0, 14, -80);
        addBox(8, 10, 8, 0xC0B490, 0, 33, -80);
        addCyl(2, 2, 15, 8, 0x888888, 0, 43, -80);
        // Church spire
        addBox(12, 24, 12, 0xCCC0A0, -40, 12, -70);
        addCone(5, 18, 8, 0x9B8B6B, -40, 33, -70);
        // Steep close (lane) walls
        addBox(2, 12, 30, 0xA09080, 28, 6, -58);
        addBox(2, 10, 25, 0xA09080, 44, 5, -58);
        // Lerwick Museum building
        addBox(24, 16, 18, 0xD4C8A0, -30, 8, -55);
        addBox(8, 6, 8, 0xCCC0A0, -30, 22, -55);
        // Hillside houses stepping up the slope
        addBox(10, 12, 10, 0xD4C8A0, -55, 14, -70);
        addBox(10, 12, 10, 0xCCC0A0, -55, 16, -85);
        addBox(10, 12, 10, 0xD0C4A0, -55, 18, -100);
        // Rooftop detail boxes (chimneys)
        addBox(2, 4, 2, 0x888888, 20, 19, -50);
        addBox(2, 4, 2, 0x888888, 36, 17, -50);
        addBox(2, 4, 2, 0x888888, 4, 21, -50);
        addBox(2, 3, 2, 0x888888, -12, 23, -50);
    }

    function buildFortCharlotte() {
        // 17th-century star fort — pentagonal bastioned fortification
        // Main curtain wall segments (5-sided approximation with boxes)
        addBox(60, 10, 4, 0x888888, -10, 5, -120);
        addBox(60, 10, 4, 0x888888, -10, 5, -160);
        addBox(4, 10, 40, 0x888888, 20, 5, -140);
        addBox(4, 10, 40, 0x888888, -40, 5, -140);
        // Angled bastion walls (star points)
        addBox(20, 10, 4, 0x888888, 30, 5, -128);
        addBox(4, 10, 20, 0x888888, 38, 5, -118);
        addBox(20, 10, 4, 0x888888, -50, 5, -128);
        addBox(4, 10, 20, 0x888888, -58, 5, -118);
        addBox(20, 10, 4, 0x888888, 30, 5, -152);
        addBox(4, 10, 20, 0x888888, 38, 5, -162);
        addBox(20, 10, 4, 0x888888, -50, 5, -152);
        addBox(4, 10, 20, 0x888888, -58, 5, -162);
        // Interior barrack buildings
        addBox(30, 12, 12, 0x999999, -10, 6, -135);
        addBox(30, 12, 10, 0x999999, -10, 6, -150);
        // Parapet / wall walk detail
        addBox(60, 2, 2, 0x777777, -10, 11, -120);
        addBox(60, 2, 2, 0x777777, -10, 11, -160);
        // Cannon embrasures (small boxes cut into wall line)
        addBox(3, 3, 5, 0x666666, -20, 8, -118);
        addBox(3, 3, 5, 0x666666, 0, 8, -118);
        addBox(3, 3, 5, 0x666666, 20, 8, -118);
        // Gate arch hint
        addBox(8, 8, 5, 0x777777, -10, 4, -120);
    }

    function buildClickiminBroch() {
        // Iron Age broch on Clickimin Loch — circular dry-stone tower
        // Loch (pool)
        addBox(80, 2, 80, 0x4682B4, -200, 1, 100);
        // Broch base — wide hollow cylinder approximation using boxes
        addBox(20, 3, 20, 0xAAAAAA, -200, 1, 100);
        // Outer wall ring (approximated as 8 boxes around perimeter)
        addBox(4, 16, 14, 0xAAAAAA, -200, 8, 87);
        addBox(4, 16, 14, 0xAAAAAA, -200, 8, 113);
        addBox(14, 16, 4, 0xAAAAAA, -187, 8, 100);
        addBox(14, 16, 4, 0xAAAAAA, -213, 8, 100);
        addBox(4, 16, 10, 0x999999, -191, 8, 89);
        addBox(4, 16, 10, 0x999999, -209, 8, 89);
        addBox(4, 16, 10, 0x999999, -191, 8, 111);
        addBox(4, 16, 10, 0x999999, -209, 8, 111);
        // Inner wall top rim
        addBox(16, 2, 16, 0xBBBBBB, -200, 17, 100);
        // Causeway to broch
        addBox(40, 2, 4, 0x999999, -175, 2, 100);
        // Loch bank settlement remains
        addBox(12, 3, 10, 0xAAAAAA, -220, 2, 115);
        addBox(10, 3, 8, 0x999999, -215, 2, 88);
    }

    function buildMousaBroch() {
        // Best-preserved Iron Age broch — 13m tall, on Mousa island
        // Mousa island ground
        addBox(120, 6, 120, 0x7B5B3A, 300, 3, 200);
        // Broch tower — tall narrow cylinder, dry-stone
        addCyl(8, 9, 26, 12, 0xAAAAAA, 300, 16, 200);
        // Interior hollow approximation — slightly darker inner cylinder
        addCyl(5, 6, 24, 10, 0x888888, 300, 15, 200);
        // Top parapet cap
        addCyl(9, 8, 2, 12, 0xBBBBBB, 300, 30, 200);
        // Entrance passage (low box)
        addBox(10, 4, 3, 0x999999, 308, 2, 200);
        // Surrounding settlement remains
        addBox(14, 2, 12, 0x999999, 285, 6, 215);
        addBox(12, 2, 10, 0xAAAAAA, 318, 6, 190);
        // Sea around Mousa island
        addBox(200, 3, 200, 0x006994, 300, -1, 200);
    }

    function buildUpHellyAa() {
        // Viking longship burning for Up Helly Aa fire festival
        // Longship hull
        addBox(40, 6, 12, 0x4A2800, -50, 3, 50);
        // Hull sides curve up (box approximation at bow and stern)
        addBox(6, 10, 10, 0x3A1E00, -68, 5, 50);
        addBox(6, 10, 10, 0x3A1E00, -32, 5, 50);
        // Dragon prow
        addBox(4, 8, 4, 0x5C3000, -72, 9, 50);
        addCone(2, 6, 6, 0x5C2800, -75, 14, 50);
        // Stern post
        addBox(3, 10, 3, 0x4A2800, -28, 9, 50);
        addCone(1.5, 5, 5, 0x4A2000, -28, 16, 50);
        // Oar ports (thin boxes along hull)
        addBox(2, 2, 13, 0x3A1600, -42, 4, 50);
        addBox(2, 2, 13, 0x3A1600, -52, 4, 50);
        addBox(2, 2, 13, 0x3A1600, -62, 4, 50);
        // Mast
        addCyl(1, 1, 28, 6, 0x5C3000, -50, 17, 50);
        // Sail (box)
        addBox(1, 18, 22, 0xCC2200, -50, 22, 50);
        // Fire effects — bright light-colored boxes stacked for flame look
        addBox(14, 8, 8, 0xFF6600, -50, 7, 50);
        addBox(10, 12, 6, 0xFF8800, -50, 14, 50);
        addBox(6, 16, 4, 0xFFAA00, -50, 22, 50);
        addBox(4, 18, 3, 0xFFCC00, -50, 28, 50);
        addBox(3, 10, 2, 0xFFEE44, -50, 34, 50);
        // Side fire spread
        addBox(8, 6, 6, 0xFF5500, -58, 6, 50);
        addBox(8, 6, 6, 0xFF5500, -42, 6, 50);
        addBox(6, 10, 5, 0xFF7700, -62, 10, 50);
        addBox(6, 10, 5, 0xFF7700, -38, 10, 50);
        // Torchbearers (small cylinders surrounding)
        addCyl(0.8, 0.8, 14, 5, 0xAA7722, -30, 7, 38);
        addBox(2, 3, 2, 0xFF6600, -30, 15, 38);
        addCyl(0.8, 0.8, 14, 5, 0xAA7722, -30, 7, 62);
        addBox(2, 3, 2, 0xFF7700, -30, 15, 62);
        addCyl(0.8, 0.8, 14, 5, 0xAA7722, -70, 7, 38);
        addBox(2, 3, 2, 0xFF6600, -70, 15, 38);
        // Festival crowd area — ground marker
        addBox(80, 1, 60, 0x3A3A3A, -50, 0, 50);
    }

    function buildJarlshof() {
        // 4000 years of settlement — Neolithic, Bronze Age, Iron Age, Norse
        // Site on south end of mainland
        // Neolithic oval house (Bronze Age roundhouse)
        addBox(14, 3, 12, 0xAAAAAA, 150, 1, -250);
        addCyl(6, 7, 4, 8, 0x999999, 150, 3, -250);
        // Bronze Age courtyard farm walls
        addBox(30, 3, 3, 0xAAAAAA, 160, 1, -240);
        addBox(3, 3, 25, 0xAAAAAA, 175, 1, -248);
        addBox(30, 3, 3, 0xAAAAAA, 160, 1, -260);
        addBox(3, 3, 25, 0xAAAAAA, 145, 1, -248);
        // Iron Age wheelhouse (circular with radial walls)
        addCyl(10, 11, 4, 10, 0xAAAAAA, 190, 2, -250);
        addBox(9, 4, 2, 0x999999, 190, 2, -250);
        addBox(2, 4, 9, 0x999999, 190, 2, -250);
        // Norse longhouse
        addBox(35, 5, 10, 0xAAAAAA, 130, 2, -270);
        addBox(33, 3, 8, 0x888888, 130, 6, -270);
        // Medieval farm mound
        addBox(20, 6, 20, 0x9B8B6B, 170, 3, -280);
        // Scattered foundation stones
        addBox(8, 2, 6, 0xAAAAAA, 200, 1, -260);
        addBox(10, 2, 8, 0x999999, 140, 1, -240);
        addBox(6, 2, 5, 0xAAAAAA, 185, 1, -235);
        // Visitor centre building
        addBox(20, 10, 15, 0xD4C8A0, 155, 5, -225);
    }

    function buildSullomVoe() {
        // Massive North Sea oil terminal — Shetland's main industry
        // Main oil storage tanks (large cylinders)
        addCyl(20, 20, 18, 12, 0x888888, -300, 9, -200);
        addCyl(20, 20, 18, 12, 0x888888, -340, 9, -200);
        addCyl(20, 20, 18, 12, 0x888888, -300, 9, -240);
        addCyl(20, 20, 18, 12, 0x888888, -340, 9, -240);
        // Tank roofs (slightly smaller top discs)
        addCyl(20, 20, 2, 12, 0x777777, -300, 19, -200);
        addCyl(20, 20, 2, 12, 0x777777, -340, 19, -200);
        addCyl(20, 20, 2, 12, 0x777777, -300, 19, -240);
        addCyl(20, 20, 2, 12, 0x777777, -340, 19, -240);
        // Processing plant buildings
        addBox(60, 20, 30, 0x888888, -280, 10, -170);
        addBox(40, 30, 25, 0x777777, -360, 15, -210);
        // Flare stack
        addCyl(1.5, 2, 50, 6, 0x999999, -290, 25, -180);
        addBox(4, 4, 4, 0xFF6600, -290, 52, -180);
        addCone(3, 8, 6, 0xFF4400, -290, 57, -180);
        // Pipeline runs
        addBox(120, 3, 4, 0x666666, -310, 3, -195);
        addBox(4, 3, 80, 0x666666, -310, 3, -215);
        // Jetty for tankers
        addBox(200, 4, 12, 0x777777, -250, 2, -160);
        addBox(15, 10, 30, 0x888888, -200, 5, -160);
        // Terminal fence perimeter
        addBox(200, 4, 2, 0x666666, -300, 2, -150);
        addBox(200, 4, 2, 0x666666, -300, 2, -280);
        addBox(2, 4, 130, 0x666666, -200, 2, -215);
        addBox(2, 4, 130, 0x666666, -400, 2, -215);
        // Security gate
        addBox(4, 8, 4, 0x888888, -300, 4, -150);
        addBox(20, 4, 4, 0x666666, -300, 8, -150);
    }

    function buildBressayIsland() {
        // Bressay island — long ridge across the sound from Lerwick
        addBox(400, 20, 120, 0x7B5B3A, 380, 10, 0);
        addBox(200, 30, 80, 0x6B4B2A, 400, 15, -20);
        addBox(100, 35, 60, 0x5A3E20, 420, 17, 10);
        // Cliff faces on Lerwick-facing side
        addBox(400, 25, 8, 0x8A7A6A, 380, 12, -60);
        // Ward of Bressay (highest point)
        addBox(60, 40, 60, 0x7B5B3A, 440, 22, 0);
        // Noss island (nature reserve) further east
        addBox(80, 15, 60, 0x6B5B30, 550, 7, 50);
        addBox(40, 25, 30, 0x5A4A20, 570, 14, 40);
        // Seabird colony cliff
        addBox(8, 40, 60, 0x8A8070, 585, 20, 50);
        // Lighthouse on south Bressay
        addCyl(3, 3, 20, 8, 0xF0F0F0, 420, 30, -100);
        addBox(6, 5, 6, 0xCCCCCC, 420, 12, -100);
        addCyl(4, 4, 4, 8, 0xDDDDDD, 420, 22, -100);
    }

    function update(delta) {
        fireTimer += delta;
        // Animate fire meshes by subtle scale oscillation — skip for strict mode
        // (fire effect is purely static bright boxes to comply with rules)
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        fireMeshes = [];
        fireTimer = 0;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
