window.SkyeEileanDonan = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 19920;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        if (sx !== undefined) mesh.scale.set(sx, sy, sz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addBox(color, x, y, z, w, h, d) {
        var geo = new THREE.BoxGeometry(w, h, d);
        return addMesh(geo, color, x, y, z);
    }

    function addCyl(color, x, y, z, rt, rb, h, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        return addMesh(geo, color, x, y, z);
    }

    function addSphere(color, x, y, z, r, ws, hs) {
        var geo = new THREE.SphereGeometry(r, ws || 8, hs || 6);
        return addMesh(geo, color, x, y, z);
    }

    function addCone(color, x, y, z, r, h, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        return addMesh(geo, color, x, y, z);
    }

    function build() {
        buildLochDuich();
        buildEileanDonanCastle();
        buildCuillinMountains();
        buildRedHills();
        buildOldManOfStorr();
        buildQuiraing();
        buildPortreeHarbour();
        buildDunveganCastle();
        buildSkyeBridge();
        buildFairyPools();
        buildTaliskerDistillery();
        buildScottishHighlandsTerrain();
    }

    // --- Loch Duich: dramatic sea loch ---
    function buildLochDuich() {
        // Main loch body - large flat water surface using stacked thin boxes
        addBox(0x006994, 0, -1, 0, 600, 2, 400);
        // Deeper channel running through loch
        addBox(0x004466, -50, -2, 0, 300, 2, 150);
        // Loch arms extending outward
        addBox(0x006994, -200, -1, 100, 200, 1.5, 100);
        addBox(0x006994, -200, -1, -100, 200, 1.5, 100);
        // Shoreline water edge strips
        addBox(0x0077AA, 100, -0.5, 0, 80, 1, 380);
        addBox(0x0077AA, -280, -0.5, 0, 40, 1, 380);
        // Small island base for Eilean Donan
        addBox(0x5a5040, 0, 0.5, 0, 60, 3, 55);
        // Island rock detail
        addBox(0x4a4030, -5, 2.5, 5, 50, 1, 45);
    }

    // --- Eilean Donan Castle ---
    function buildEileanDonanCastle() {
        var castleColor = 0x7a7060;
        var towerColor = 0x6a6050;
        var roofColor = 0x555545;

        // Main keep tower - tall central structure
        addBox(castleColor, 0, 15, 0, 18, 30, 16);
        // Keep battlements top
        addBox(towerColor, -6, 31, 0, 4, 3, 16);
        addBox(towerColor, 6, 31, 0, 4, 3, 16);
        addBox(towerColor, 0, 31, -6, 18, 3, 4);
        addBox(towerColor, 0, 31, 6, 18, 3, 4);

        // Great hall range - long lower building attached to keep
        addBox(castleColor, -22, 9, 0, 26, 18, 24);
        // Great hall roof
        addBox(roofColor, -22, 19, 0, 27, 3, 25);
        // Great hall battlements
        addBox(towerColor, -22, 21, 10, 26, 3, 4);
        addBox(towerColor, -22, 21, -10, 26, 3, 4);

        // Inner courtyard wall
        addBox(castleColor, 5, 6, 18, 10, 12, 3);
        addBox(castleColor, 5, 6, -18, 10, 12, 3);

        // Round corner towers - CylinderGeometry as per rules
        addCyl(towerColor, 10, 12, 14, 5, 5, 24, 10);
        addCyl(towerColor, 10, 12, -14, 5, 5, 24, 10);
        addCyl(towerColor, -35, 10, 14, 4, 4, 20, 10);
        addCyl(towerColor, -35, 10, -14, 4, 4, 20, 10);

        // Conical tower roofs
        addCone(roofColor, 10, 26, 14, 5.5, 8, 10);
        addCone(roofColor, 10, 26, -14, 5.5, 8, 10);
        addCone(roofColor, -35, 22, 14, 4.5, 7, 10);
        addCone(roofColor, -35, 22, -14, 4.5, 7, 10);

        // 3-arch stone causeway/bridge over water
        // Bridge deck
        addBox(0x888070, 28, 2, 0, 38, 3, 10);
        // Bridge arch supports (piers)
        addBox(0x7a7060, 18, -1, 0, 5, 6, 10);
        addBox(0x7a7060, 28, -1, 0, 5, 6, 10);
        addBox(0x7a7060, 38, -1, 0, 5, 6, 10);
        // Bridge arch openings (dark voids under deck between piers)
        addBox(0x222211, 23, 0, 0, 4, 4, 11);
        addBox(0x222211, 33, 0, 0, 4, 4, 11);
        addBox(0x222211, 43, 0, 0, 4, 4, 11);
        // Bridge parapets
        addBox(0x888070, 28, 5, 5, 38, 2, 1);
        addBox(0x888070, 28, 5, -5, 38, 2, 1);

        // Outer defensive wall around island
        addBox(castleColor, 0, 4, 25, 50, 8, 3);
        addBox(castleColor, 0, 4, -25, 50, 8, 3);
        addBox(castleColor, -27, 4, 0, 3, 8, 50);
        addBox(castleColor, 27, 4, 0, 3, 8, 8);

        // Gatehouse over bridge entrance
        addBox(castleColor, 48, 8, 0, 10, 14, 12);
        addBox(roofColor, 48, 16, 0, 11, 3, 13);
        // Gatehouse arch
        addBox(0x333322, 48, 5, 0, 5, 8, 13);

        // Wall walk merlons on outer wall
        addBox(towerColor, -12, 9, 25, 4, 3, 3);
        addBox(towerColor, 0, 9, 25, 4, 3, 3);
        addBox(towerColor, 12, 9, 25, 4, 3, 3);
    }

    // --- Cuillin Mountains: Black Cuillins - jagged serrated ridge ---
    function buildCuillinMountains() {
        var blackColor = 0x444444;
        var darkColor = 0x333333;

        // Main ridge - stacked irregular boxes for serrated effect
        // Peak 1 - Sgurr nan Gillean style
        addBox(blackColor, -200, 40, -220, 30, 80, 25);
        addBox(darkColor, -200, 85, -218, 18, 10, 15);
        addBox(blackColor, -200, 96, -220, 10, 8, 10);

        // Peak 2
        addBox(blackColor, -240, 35, -230, 28, 70, 22);
        addBox(darkColor, -238, 75, -228, 16, 8, 14);
        addBox(blackColor, -240, 84, -230, 8, 6, 8);

        // Peak 3 - tallest - Sgurr Alasdair
        addBox(blackColor, -280, 45, -215, 32, 90, 28);
        addBox(darkColor, -280, 92, -215, 20, 10, 18);
        addBox(blackColor, -280, 103, -215, 10, 10, 10);

        // Peak 4
        addBox(blackColor, -320, 38, -225, 26, 76, 20);
        addBox(darkColor, -318, 78, -225, 14, 7, 13);

        // Peak 5 - narrow spire
        addBox(blackColor, -360, 30, -210, 20, 60, 18);
        addBox(darkColor, -358, 65, -210, 10, 10, 10);
        addBox(blackColor, -360, 76, -210, 5, 8, 5);

        // Connecting ridge between peaks
        addBox(darkColor, -220, 25, -225, 45, 50, 20);
        addBox(darkColor, -260, 28, -220, 45, 56, 18);
        addBox(darkColor, -300, 22, -218, 45, 44, 18);
        addBox(darkColor, -340, 18, -215, 45, 36, 16);

        // Talus/scree slopes at base
        addBox(0x555555, -280, 5, -185, 200, 10, 20);
        addBox(0x4a4a4a, -280, 2, -175, 180, 6, 15);

        // Near-vertical faces - thin tall slabs
        addBox(blackColor, -260, 30, -205, 3, 60, 20);
        addBox(blackColor, -300, 25, -200, 3, 50, 18);
    }

    // --- Red Hills: rounded granite peaks ---
    function buildRedHills() {
        var redColor = 0xCC7755;
        var darkRed = 0xAA5533;

        // Beinn na Caillich
        addBox(redColor, -150, 30, -280, 80, 60, 70);
        addBox(redColor, -150, 58, -280, 55, 18, 50);
        addBox(darkRed, -150, 72, -280, 35, 8, 35);
        // Smooth rounded top using sphere-like layered boxes
        addBox(redColor, -150, 79, -280, 20, 6, 20);

        // Glamaig dome
        addBox(redColor, -80, 28, -260, 75, 56, 65);
        addBox(redColor, -80, 55, -260, 50, 16, 45);
        addBox(darkRed, -80, 68, -260, 30, 8, 30);
        addBox(redColor, -80, 74, -260, 16, 5, 16);

        // Marsco
        addBox(redColor, -220, 22, -270, 65, 44, 55);
        addBox(darkRed, -220, 55, -270, 40, 10, 38);
    }

    // --- Old Man of Storr: tall isolated rock pinnacle ---
    function buildOldManOfStorr() {
        var rockColor = 0x666666;
        var darkRock = 0x555555;

        // Main pinnacle - tall thin cylinder
        addCyl(rockColor, 180, 25, -180, 4, 6, 50, 8);
        // Pinnacle tip
        addCone(darkRock, 180, 52, -180, 4, 8, 8);

        // Secondary pinnacles
        addCyl(rockColor, 170, 15, -170, 3, 4, 30, 7);
        addCone(darkRock, 170, 31, -170, 3, 5, 7);
        addCyl(rockColor, 190, 12, -185, 2.5, 3.5, 24, 7);
        addCone(darkRock, 190, 25, -185, 2.5, 4, 7);

        // The Sanctuary - rocky hillside plateau
        addBox(darkRock, 180, 5, -180, 80, 10, 60);
        // Scree slopes
        addBox(0x777777, 180, 2, -155, 70, 6, 20);
        // Trotternish ridge behind
        addBox(0x5a5a5a, 200, 20, -220, 120, 40, 50);
        addBox(0x4a4a4a, 200, 38, -220, 90, 12, 40);
    }

    // --- Quiraing: dramatic tilted table and needle ---
    function buildQuiraing() {
        var tableColor = 0x5a5a5a;
        var needleColor = 0x4a4a4a;

        // The Table - flat-topped tilted block
        addBox(tableColor, 250, 30, -200, 45, 5, 35);
        // Table support cliff
        addBox(tableColor, 250, 15, -200, 35, 25, 30);

        // The Needle - tall narrow pinnacle
        addCyl(needleColor, 235, 22, -175, 3, 5, 44, 7);
        addCone(0x3a3a3a, 235, 45, -175, 3, 6, 7);

        // The Prison - large blocky cliff
        addBox(tableColor, 270, 20, -190, 30, 40, 25);
        addBox(needleColor, 268, 40, -188, 25, 5, 20);

        // Landslipped cliff terraces
        addBox(tableColor, 255, 8, -165, 60, 16, 20);
        addBox(0x6a6a6a, 255, 3, -148, 55, 8, 15);
    }

    // --- Portree Harbour: colourful fishing town ---
    function buildPortreeHarbour() {
        var harbourWall = 0x888880;
        var building1 = 0xF5C842;
        var building2 = 0xCD5C5C;
        var building3 = 0xE8E8D0;
        var roofSlate = 0x444466;
        var pier = 0x999980;

        // Stone pier / quay extending into water
        addBox(pier, 120, 1, 150, 80, 4, 12);
        addBox(pier, 160, 1, 150, 8, 4, 30);
        // Pier end
        addBox(pier, 162, 1, 165, 8, 3, 4);

        // Harbour wall
        addBox(harbourWall, 130, 3, 143, 70, 8, 3);
        addBox(harbourWall, 164, 3, 155, 3, 8, 22);

        // Colourful harbour-front buildings - the iconic row
        // Yellow building
        addBox(building1, 100, 5, 170, 12, 12, 10);
        addBox(roofSlate, 100, 12, 170, 13, 4, 11);
        // Red building
        addBox(building2, 114, 5, 170, 12, 12, 10);
        addBox(roofSlate, 114, 12, 170, 13, 4, 11);
        // White building
        addBox(building3, 128, 5, 170, 12, 14, 10);
        addBox(roofSlate, 128, 13, 170, 13, 5, 11);
        // Another yellow
        addBox(building1, 142, 5, 170, 10, 12, 10);
        addBox(roofSlate, 142, 12, 170, 11, 4, 11);
        // Another red
        addBox(building2, 154, 5, 170, 10, 10, 10);
        addBox(roofSlate, 154, 11, 170, 11, 4, 11);

        // Back-row buildings on hill
        addBox(building3, 108, 8, 183, 14, 10, 10);
        addBox(roofSlate, 108, 14, 183, 15, 4, 11);
        addBox(building1, 124, 8, 183, 14, 10, 10);
        addBox(roofSlate, 124, 14, 183, 15, 4, 11);

        // Fishing boats in harbour (boxes)
        addBox(0xEEEECC, 130, 1, 152, 10, 2, 4);
        addBox(0xCC4444, 130, 3, 152, 8, 2, 3);
        addBox(0xEEEECC, 145, 1, 155, 8, 2, 3);
        addBox(0x4444CC, 145, 3, 155, 6, 2, 2.5);
        // Boat masts
        addCyl(0x888866, 130, 6, 152, 0.3, 0.3, 8, 5);
        addCyl(0x888866, 145, 6, 155, 0.3, 0.3, 7, 5);

        // Portree hill backdrop
        addBox(0x447744, 130, 15, 210, 100, 30, 30);
        addBox(0x336633, 130, 25, 215, 70, 10, 20);
    }

    // --- Dunvegan Castle: ancient MacLeod fortress ---
    function buildDunveganCastle() {
        var stoneColor = 0x8B7355;
        var darkStone = 0x7a6244;
        var roofColor = 0x555544;

        // Main square keep
        addBox(stoneColor, -180, 12, 180, 22, 24, 20);
        // Keep battlements
        addBox(darkStone, -180, 25, 180, 23, 4, 21);
        // Keep roof
        addBox(roofColor, -180, 28, 180, 20, 2, 18);

        // East wing - later addition
        addBox(stoneColor, -160, 9, 180, 20, 18, 18);
        addBox(darkStone, -160, 19, 180, 21, 3, 19);

        // West tower - round
        addCyl(darkStone, -200, 10, 180, 6, 6, 20, 10);
        addCone(roofColor, -200, 21, 180, 6.5, 7, 10);

        // North wing
        addBox(stoneColor, -180, 8, 163, 24, 16, 14);
        addBox(darkStone, -180, 17, 163, 25, 3, 15);

        // Sea loch side wall
        addBox(stoneColor, -175, 5, 195, 30, 10, 3);
        addBox(stoneColor, -195, 5, 185, 3, 10, 22);

        // Rocky sea loch platform
        addBox(0x776655, -180, 0, 180, 70, 2, 60);
        addBox(0x006994, -180, -1, 215, 150, 2, 30);

        // Dunvegan village building
        addBox(0xCCBB99, -155, 4, 195, 10, 9, 8);
        addBox(roofColor, -155, 9, 195, 11, 3, 9);
    }

    // --- Skye Bridge: modern concrete arch bridge ---
    function buildSkyeBridge() {
        var concreteColor = 0xD3D3D3;
        var darkConcrete = 0xB8B8B8;

        // Main bridge deck spanning Kyle of Lochalsh
        addBox(concreteColor, 280, 8, 0, 200, 3, 14);

        // Bridge arch below deck
        addBox(darkConcrete, 255, 4, 0, 80, 5, 12);
        addBox(darkConcrete, 305, 4, 0, 80, 5, 12);

        // Main arch piers
        addCyl(darkConcrete, 240, 4, 0, 3, 4, 10, 8);
        addCyl(darkConcrete, 280, 2, 0, 4, 5, 8, 8);
        addCyl(darkConcrete, 320, 4, 0, 3, 4, 10, 8);

        // Approach viaduct sections
        addBox(concreteColor, 200, 6, 0, 60, 2, 12);
        addBox(concreteColor, 355, 6, 0, 50, 2, 12);

        // Approach viaduct supports
        addBox(darkConcrete, 190, 3, 0, 4, 7, 10);
        addBox(darkConcrete, 210, 3, 0, 4, 7, 10);
        addBox(darkConcrete, 350, 3, 0, 4, 7, 10);
        addBox(darkConcrete, 368, 3, 0, 4, 7, 10);

        // Bridge road surface
        addBox(0xBBBBBB, 280, 10, 0, 200, 1, 10);

        // Roadway barrier rails
        addBox(concreteColor, 280, 11, 6, 200, 1, 0.5);
        addBox(concreteColor, 280, 11, -6, 200, 1, 0.5);
    }

    // --- Fairy Pools: crystal mountain pools ---
    function buildFairyPools() {
        var crystalWater = 0x00AACC;
        var deepPool = 0x0088AA;
        var rockColor = 0x888888;
        var waterfallColor = 0x88CCEE;

        // Series of connected pools stepping down hillside
        addBox(crystalWater, -120, 1, -120, 20, 2, 16);
        addBox(deepPool, -120, 0, -120, 16, 2, 12);

        addBox(crystalWater, -110, 3, -100, 18, 2, 14);
        addBox(deepPool, -110, 2, -100, 14, 2, 10);

        addBox(crystalWater, -100, 6, -80, 16, 2, 12);
        addBox(deepPool, -100, 5, -80, 12, 2, 8);

        addBox(crystalWater, -90, 9, -60, 14, 2, 10);
        addBox(deepPool, -90, 8, -60, 10, 2, 7);

        // Waterfall cascades between pools - thin vertical water strips
        addBox(waterfallColor, -115, 2, -110, 4, 4, 3);
        addBox(waterfallColor, -105, 4.5, -90, 3, 5, 3);
        addBox(waterfallColor, -95, 7.5, -70, 3, 5, 2.5);

        // Rocky banks and boulders around pools
        addBox(rockColor, -130, 2, -120, 6, 4, 16);
        addBox(rockColor, -108, 2, -120, 6, 4, 16);
        addBox(rockColor, -120, 2, -128, 20, 4, 4);
        addBox(rockColor, -120, 2, -112, 20, 3, 3);

        // Glenbrittle hillside above pools
        addBox(0x556644, -120, 8, -140, 80, 16, 30);
        addBox(0x445533, -120, 16, -145, 60, 8, 20);
    }

    // --- Talisker Distillery ---
    function buildTaliskerDistillery() {
        var distilleryWall = 0xCD5C5C;
        var darkWall = 0xAA4444;
        var roofColor = 0x333333;
        var pagodaColor = 0x555555;

        // Main distillery building
        addBox(distilleryWall, 320, 7, 180, 28, 14, 18);
        addBox(roofColor, 320, 15, 180, 29, 4, 19);

        // Still house with pagoda kiln roof - distinctive pyramid
        addBox(distilleryWall, 295, 8, 180, 16, 16, 16);
        addCone(pagodaColor, 295, 20, 180, 10, 12, 8);
        // Kiln ventilator top
        addCyl(0x222222, 295, 27, 180, 1, 2, 5, 6);

        // Second kiln with pagoda
        addBox(distilleryWall, 278, 7, 180, 12, 14, 14);
        addCone(pagodaColor, 278, 18, 180, 8, 10, 8);
        addCyl(0x222222, 278, 24, 180, 0.8, 1.5, 4, 6);

        // Warehouses
        addBox(darkWall, 355, 5, 178, 30, 10, 20);
        addBox(roofColor, 355, 11, 178, 31, 4, 21);
        addBox(darkWall, 355, 5, 200, 30, 10, 16);
        addBox(roofColor, 355, 11, 200, 31, 3, 17);

        // Distillery chimney
        addCyl(0x777766, 332, 15, 178, 2, 2.5, 22, 8);
        // Chimney top cap
        addCyl(0x555544, 332, 27, 178, 2.5, 2, 2, 8);

        // Talisker Bay sea access - coastal strip
        addBox(0x006994, 320, -1, 160, 100, 2, 25);
        addBox(0x666655, 320, 0.5, 167, 90, 2, 8);
    }

    // --- General Highland terrain, coast, and ground plane ---
    function buildScottishHighlandsTerrain() {
        var grassColor = 0x4a7a3a;
        var heatherColor = 0x7a4a7a;
        var coastRock = 0x887766;
        var moorColor = 0x556644;

        // Main ground plane - large flat terrain base
        addBox(grassColor, 0, -2, 0, 800, 2, 800);

        // Highland moor sections
        addBox(moorColor, 50, 0, 100, 150, 3, 100);
        addBox(heatherColor, 80, 1, 50, 100, 2, 80);
        addBox(moorColor, -100, 0, 50, 120, 2, 90);

        // Coastal cliffs on west
        addBox(coastRock, -260, 8, 0, 20, 18, 300);
        addBox(coastRock, -250, 4, 0, 10, 10, 280);

        // Sea cliffs Trotternish
        addBox(coastRock, 200, 12, -100, 15, 24, 200);

        // Rolling hills
        addBox(grassColor, 50, 4, 80, 60, 10, 50);
        addBox(grassColor, -60, 3, -60, 50, 8, 40);
        addBox(moorColor, 100, 5, -80, 70, 12, 60);

        // Croft buildings - scattered Highland cottages
        addBox(0xEEEEDD, -80, 4, 80, 8, 8, 6);
        addBox(0x555566, -80, 9, 80, 9, 3, 7);
        addBox(0xEEEEDD, -60, 4, 95, 7, 7, 5);
        addBox(0x555566, -60, 8, 95, 8, 3, 6);

        // Stone field walls (drystane dykes)
        addBox(coastRock, 20, 2, 80, 60, 3, 1.5);
        addBox(coastRock, 20, 2, 50, 1.5, 3, 30);
        addBox(coastRock, -40, 2, 80, 40, 3, 1.5);

        // Kyle Rhea - narrow sound
        addBox(0x006994, 350, -1, 50, 60, 2, 80);

        // Background coastal sea
        addBox(0x005577, -300, -2, 0, 100, 2, 600);
        addBox(0x004455, 400, -2, 0, 100, 2, 600);
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
