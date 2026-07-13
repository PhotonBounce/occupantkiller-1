window.GrimsbyDocks = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21960;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildRoyalDock();
        buildAlexandraDock();
        buildDockTower();
        buildFishDocks();
        buildFishMarket();
        buildTrawlers();
        buildHumber();
        buildBeach();
        buildWindTurbines();
        buildVictorianStreets();
        buildRefrigerationWarehouses();
        buildDocksideInfrastructure();
        buildLighthouse();
    }

    function buildGround() {
        // Main ground plane built from boxes
        var groundGeo = new THREE.BoxGeometry(2000, 2, 2000);
        addMesh(groundGeo, 0x4A5240, 0, -1, 0);

        // Dock surrounds — flat concrete paving
        var quayGeo = new THREE.BoxGeometry(600, 1, 400);
        addMesh(quayGeo, 0x888888, -100, 0, 100);

        var quayGeo2 = new THREE.BoxGeometry(400, 1, 300);
        addMesh(quayGeo2, 0x777777, 300, 0, -50);
    }

    function buildRoyalDock() {
        // Royal Dock basin — world's largest purpose-built fishing port
        // Basin floor (water surface represented as flat dark blue box)
        var basinFloor = new THREE.BoxGeometry(400, 2, 300);
        addMesh(basinFloor, 0x4682B4, -150, -1, 0);

        // North quay wall
        var northWall = new THREE.BoxGeometry(420, 8, 12);
        addMesh(northWall, 0x888888, -150, 4, -156);

        // South quay wall
        var southWall = new THREE.BoxGeometry(420, 8, 12);
        addMesh(southWall, 0x888888, -150, 4, 156);

        // East quay wall
        var eastWall = new THREE.BoxGeometry(12, 8, 300);
        addMesh(eastWall, 0x888888, 56, 4, 0);

        // West entrance — lock gates represented as thick wall with gap
        var westWallN = new THREE.BoxGeometry(12, 8, 120);
        addMesh(westWallN, 0x888888, -356, 4, -90);

        var westWallS = new THREE.BoxGeometry(12, 8, 120);
        addMesh(westWallS, 0x888888, -356, 4, 90);

        // Lock gate (closed) — pair of dark wooden beams
        var gateN = new THREE.BoxGeometry(4, 10, 50);
        addMesh(gateN, 0x5C3A1E, -350, 5, -25);

        var gateS = new THREE.BoxGeometry(4, 10, 50);
        addMesh(gateS, 0x5C3A1E, -350, 5, 25);

        // Bollards along north quay
        for (var i = 0; i < 6; i++) {
            var bollardGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 8);
            addMesh(bollardGeo, 0x222222, -310 + i * 70, 4.5, -148);
        }

        // Bollards along south quay
        for (var j = 0; j < 6; j++) {
            var bollardGeo2 = new THREE.CylinderGeometry(1.2, 1.2, 3, 8);
            addMesh(bollardGeo2, 0x222222, -310 + j * 70, 4.5, 148);
        }

        // Victorian dock buildings along east quay
        var hqBuilding = new THREE.BoxGeometry(40, 20, 30);
        addMesh(hqBuilding, 0x8B6040, 80, 10, -40);

        var hqRoof = new THREE.ConeGeometry(25, 10, 4);
        addMesh(hqRoof, 0x6B4030, 80, 25, -40, 0, Math.PI / 4);

        var hqBuilding2 = new THREE.BoxGeometry(35, 16, 28);
        addMesh(hqBuilding2, 0x9B7050, 80, 8, 40);

        var hqRoof2 = new THREE.BoxGeometry(37, 3, 30);
        addMesh(hqRoof2, 0x6B4030, 80, 17.5, 40);
    }

    function buildAlexandraDock() {
        // Alexandra Dock — second large dock, container handling
        var basinFloor = new THREE.BoxGeometry(350, 2, 250);
        addMesh(basinFloor, 0x4682B4, 350, -1, 200);

        // North quay
        var northWall = new THREE.BoxGeometry(370, 6, 10);
        addMesh(northWall, 0x666666, 350, 3, 75);

        // South quay
        var southWall = new THREE.BoxGeometry(370, 6, 10);
        addMesh(southWall, 0x666666, 350, 3, 325);

        // East wall
        var eastWall = new THREE.BoxGeometry(10, 6, 250);
        addMesh(eastWall, 0x666666, 525, 3, 200);

        // Container stacks (coloured boxes on quayside)
        var containerColors = [0xFF4040, 0x4040FF, 0x40AA40, 0xFFAA00, 0xAA40AA];
        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 3; j++) {
                var containerGeo = new THREE.BoxGeometry(12, 8, 6);
                addMesh(containerGeo, containerColors[i], 180 + i * 15, 4 + j * 8, 80 + j * 0.5);
            }
        }

        // Container crane arm
        var craneLeg = new THREE.BoxGeometry(4, 40, 4);
        addMesh(craneLeg, 0xFFDD00, 540, 20, 90);

        var craneArm = new THREE.BoxGeometry(60, 4, 4);
        addMesh(craneArm, 0xFFDD00, 510, 41, 90);

        var craneCable = new THREE.BoxGeometry(1, 20, 1);
        addMesh(craneCable, 0x333333, 520, 31, 90);

        // Dock office building
        var officeGeo = new THREE.BoxGeometry(30, 14, 20);
        addMesh(officeGeo, 0xB09070, 200, 7, 340);

        var officeRoof = new THREE.BoxGeometry(32, 2, 22);
        addMesh(officeRoof, 0x706050, 200, 15, 340);
    }

    function buildDockTower() {
        // Dock Tower — famous 94m tall Italianate red-brick water tower
        // Base plinth
        var basePlinth = new THREE.BoxGeometry(22, 4, 22);
        addMesh(basePlinth, 0x8B4513, 200, 2, -250);

        // Main shaft — tapered slightly
        var shaftLower = new THREE.CylinderGeometry(8, 9, 50, 12);
        addMesh(shaftLower, 0x8B4513, 200, 29, -250);

        var shaftMid = new THREE.CylinderGeometry(7, 8, 30, 12);
        addMesh(shaftMid, 0x9B5020, 200, 69, -250);

        var shaftUpper = new THREE.CylinderGeometry(6, 7, 20, 12);
        addMesh(shaftUpper, 0x9B5020, 200, 94, -250);

        // Decorative cornice band
        var cornice = new THREE.CylinderGeometry(8.5, 8.5, 3, 12);
        addMesh(cornice, 0xC8A020, 200, 84, -250);

        // Water tank / top chamber
        var topChamber = new THREE.CylinderGeometry(9, 8, 12, 12);
        addMesh(topChamber, 0x8B4513, 200, 110, -250);

        // Conical roof cap
        var roofCap = new THREE.ConeGeometry(10, 14, 12);
        addMesh(roofCap, 0x5C3A1E, 200, 122, -250);

        // Arched windows at various levels — represented as recessed dark boxes
        for (var level = 0; level < 4; level++) {
            var windowGeo = new THREE.BoxGeometry(3, 5, 2);
            addMesh(windowGeo, 0x2A1A0A, 208, 25 + level * 22, -250);
            addMesh(windowGeo, 0x2A1A0A, 192, 25 + level * 22, -250);
        }

        // Small outbuilding at base
        var outbuilding = new THREE.BoxGeometry(18, 8, 14);
        addMesh(outbuilding, 0x8B4513, 220, 4, -250);
    }

    function buildFishDocks() {
        // Fish docks — concrete quays and structures
        // Fish dock 1
        var fishDock1 = new THREE.BoxGeometry(200, 2, 100);
        addMesh(fishDock1, 0x555555, -100, 0, -200);

        // Fish dock 2
        var fishDock2 = new THREE.BoxGeometry(180, 2, 90);
        addMesh(fishDock2, 0x4A4A4A, 120, 0, -220);

        // Quayside sheds — long low corrugated steel buildings
        var shed1 = new THREE.BoxGeometry(120, 10, 18);
        addMesh(shed1, 0x777777, -100, 5, -165);

        var shed1Roof = new THREE.BoxGeometry(122, 3, 20);
        addMesh(shed1Roof, 0x555555, -100, 11.5, -165);

        var shed2 = new THREE.BoxGeometry(100, 10, 18);
        addMesh(shed2, 0x777777, 120, 5, -180);

        var shed2Roof = new THREE.BoxGeometry(102, 3, 20);
        addMesh(shed2Roof, 0x555555, 120, 11.5, -180);

        // Ice plant / refrigeration unit
        var icePlant = new THREE.BoxGeometry(30, 16, 25);
        addMesh(icePlant, 0x9999AA, -20, 8, -175);

        // Cooling towers on ice plant
        var coolTower1 = new THREE.CylinderGeometry(4, 5, 12, 8);
        addMesh(coolTower1, 0xBBBBCC, -30, 22, -175);

        var coolTower2 = new THREE.CylinderGeometry(4, 5, 12, 8);
        addMesh(coolTower2, 0xBBBBCC, -10, 22, -175);

        // Fish auction clock tower
        var clockTowerBody = new THREE.BoxGeometry(8, 22, 8);
        addMesh(clockTowerBody, 0x9B7050, -180, 11, -200);

        var clockFace = new THREE.CylinderGeometry(4, 4, 1, 8);
        addMesh(clockFace, 0xFFFFCC, -180, 23, -197, Math.PI / 2);

        // Fuel depot tanks
        var tank1 = new THREE.CylinderGeometry(8, 8, 14, 12);
        addMesh(tank1, 0x444444, -240, 7, -190);

        var tank2 = new THREE.CylinderGeometry(7, 7, 12, 12);
        addMesh(tank2, 0x333333, -260, 6, -210);

        // Weighbridge building
        var weighbridge = new THREE.BoxGeometry(16, 6, 10);
        addMesh(weighbridge, 0x888877, 50, 3, -170);
    }

    function buildFishMarket() {
        // North Sea fish market — large covered market halls
        // Main market hall
        var hallBody = new THREE.BoxGeometry(160, 14, 60);
        addMesh(hallBody, 0xAAAAAA, -50, 7, -300);

        // Barrel-vault roof sections (approximated with stacked boxes)
        var roofA = new THREE.BoxGeometry(162, 4, 20);
        addMesh(roofA, 0x999999, -50, 15, -280);

        var roofB = new THREE.BoxGeometry(162, 4, 20);
        addMesh(roofB, 0x999999, -50, 15, -300);

        var roofC = new THREE.BoxGeometry(162, 4, 20);
        addMesh(roofC, 0x999999, -50, 15, -320);

        // Market hall 2 — secondary hall
        var hall2Body = new THREE.BoxGeometry(100, 12, 50);
        addMesh(hall2Body, 0xBBBBBB, 130, 6, -290);

        var hall2Roof = new THREE.BoxGeometry(102, 3, 52);
        addMesh(hall2Roof, 0x999999, 130, 13.5, -290);

        // Market entrance canopy
        var canopyGeo = new THREE.BoxGeometry(30, 3, 10);
        addMesh(canopyGeo, 0x888888, -50, 15, -270);

        // Canopy supports
        var support1 = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
        addMesh(support1, 0x666666, -60, 12, -270);

        var support2 = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
        addMesh(support2, 0x666666, -40, 12, -270);

        // Fish crates stacked outside market
        for (var i = 0; i < 4; i++) {
            var crateGeo = new THREE.BoxGeometry(6, 4, 4);
            addMesh(crateGeo, 0xDDCC99, -130 + i * 8, 2 + Math.floor(i / 2) * 4, -275);
        }

        // Refrigerated lorry parked at market
        var lorryBody = new THREE.BoxGeometry(20, 9, 7);
        addMesh(lorryBody, 0xFFFFFF, 80, 4.5, -270);

        var lorryCab = new THREE.BoxGeometry(7, 7, 7);
        addMesh(lorryCab, 0xEEEEEE, 96, 3.5, -270);

        var lorryWheel1 = new THREE.CylinderGeometry(2, 2, 1.5, 8);
        addMesh(lorryWheel1, 0x111111, 72, 1.5, -273, 0, 0, Math.PI / 2);

        var lorryWheel2 = new THREE.CylinderGeometry(2, 2, 1.5, 8);
        addMesh(lorryWheel2, 0x111111, 88, 1.5, -273, 0, 0, Math.PI / 2);
    }

    function buildTrawlers() {
        // Steel fishing trawlers moored at quay
        buildSingleTrawler(-300, 0, -140, 0);
        buildSingleTrawler(-220, 0, -140, 0);
        buildSingleTrawler(-140, 0, -140, 0);
        buildSingleTrawler(-300, 0, 140, Math.PI);
        buildSingleTrawler(-220, 0, 140, Math.PI);
    }

    function buildSingleTrawler(x, y, z, ry) {
        // Hull
        var hullGeo = new THREE.BoxGeometry(40, 6, 10);
        addMesh(hullGeo, 0x666666, x, y + 3, z, 0, ry);

        // Bow — angled front using cone
        var bowGeo = new THREE.ConeGeometry(5, 8, 4);
        addMesh(bowGeo, 0x555555, x + (ry === 0 ? 22 : -22), y + 3, z, 0, ry, Math.PI / 2);

        // Superstructure / wheelhouse
        var wheelhouseGeo = new THREE.BoxGeometry(10, 8, 8);
        addMesh(wheelhouseGeo, 0xCCCCCC, x + (ry === 0 ? 8 : -8), y + 9, z);

        // Funnel / smokestack
        var funnelGeo = new THREE.CylinderGeometry(1.5, 2, 6, 8);
        addMesh(funnelGeo, 0x222222, x + (ry === 0 ? 6 : -6), y + 16, z);

        // Mast
        var mastGeo = new THREE.CylinderGeometry(0.5, 0.5, 16, 6);
        addMesh(mastGeo, 0xAA8833, x + (ry === 0 ? 10 : -10), y + 16, z);

        // Boom / derrick arm
        var boomGeo = new THREE.BoxGeometry(12, 1, 1);
        addMesh(boomGeo, 0xAA8833, x + (ry === 0 ? 16 : -16), y + 20, z);

        // Net bundle (sphere on deck)
        var netGeo = new THREE.SphereGeometry(3, 6, 4);
        addMesh(netGeo, 0x886633, x + (ry === 0 ? -10 : 10), y + 6, z);

        // Winch drum
        var winchGeo = new THREE.CylinderGeometry(2, 2, 4, 8);
        addMesh(winchGeo, 0x444444, x + (ry === 0 ? -5 : 5), y + 7, z, 0, 0, Math.PI / 2);
    }

    function buildHumber() {
        // Humber Estuary — wide estuary to the north
        var estuary1 = new THREE.BoxGeometry(2000, 2, 400);
        addMesh(estuary1, 0x006994, 0, -1, -600);

        // Estuary has some wave texture suggestion — darker mid channel
        var midChannel = new THREE.BoxGeometry(2000, 0.5, 150);
        addMesh(midChannel, 0x004A70, 0, 0, -650);

        // River bank / mudflats (tidal estuary)
        var mudflat1 = new THREE.BoxGeometry(2000, 1, 60);
        addMesh(mudflat1, 0x8B7355, 0, 0, -408);

        var mudflat2 = new THREE.BoxGeometry(2000, 1, 50);
        addMesh(mudflat2, 0x7B6345, 0, 0, -800);

        // Navigation buoy in estuary
        var buoyBody = new THREE.SphereGeometry(3, 8, 6);
        addMesh(buoyBody, 0xFF2200, -200, 3, -550);

        var buoyPole = new THREE.CylinderGeometry(0.5, 0.5, 6, 6);
        addMesh(buoyPole, 0xFF2200, -200, 8, -550);

        // Second buoy
        var buoyBody2 = new THREE.SphereGeometry(3, 8, 6);
        addMesh(buoyBody2, 0x00AA00, 300, 3, -580);

        var buoyPole2 = new THREE.CylinderGeometry(0.5, 0.5, 6, 6);
        addMesh(buoyPole2, 0x00AA00, 300, 8, -580);
    }

    function buildBeach() {
        // Cleethorpes beach — sand beach to the SE
        var beach1 = new THREE.BoxGeometry(600, 1, 120);
        addMesh(beach1, 0xF4E0A0, 400, 0, 450);

        var beach2 = new THREE.BoxGeometry(500, 1, 80);
        addMesh(beach2, 0xEDD08A, 380, 0.5, 540);

        // Beach sea water
        var seaShallow = new THREE.BoxGeometry(600, 1, 80);
        addMesh(seaShallow, 0x5BA3C9, 400, -0.5, 600);

        // Pier — Cleethorpes Pier
        var pierDeck = new THREE.BoxGeometry(120, 2, 12);
        addMesh(pierDeck, 0xCC9966, 350, 1.5, 580);

        // Pier legs
        for (var i = 0; i < 5; i++) {
            var legGeo = new THREE.CylinderGeometry(1, 1, 8, 6);
            addMesh(legGeo, 0x888866, 290 + i * 30, -3, 580);
        }

        // Pier pavilion at end
        var pavilion = new THREE.BoxGeometry(20, 12, 16);
        addMesh(pavilion, 0xFFEECC, 408, 7, 580);

        var pavilionRoof = new THREE.ConeGeometry(14, 8, 4);
        addMesh(pavilionRoof, 0xCC4444, 408, 15, 580, 0, Math.PI / 4);

        // Beach huts (colourful row)
        var hutColors = [0xFF6633, 0x3366FF, 0x33AA33, 0xFFCC00, 0xFF33AA, 0x33CCCC];
        for (var h = 0; h < 6; h++) {
            var hutGeo = new THREE.BoxGeometry(7, 8, 6);
            addMesh(hutGeo, hutColors[h], 200 + h * 10, 4, 445);
            var hutRoof = new THREE.BoxGeometry(8, 2, 7);
            addMesh(hutRoof, hutColors[(h + 1) % hutColors.length], 200 + h * 10, 9, 445);
        }

        // Amusement arcade building on promenade
        var arcadeGeo = new THREE.BoxGeometry(40, 10, 20);
        addMesh(arcadeGeo, 0xFFDD88, 500, 5, 440);

        var arcadeSign = new THREE.BoxGeometry(42, 4, 3);
        addMesh(arcadeSign, 0xFF2200, 500, 12, 430);
    }

    function buildWindTurbines() {
        // Humber Offshore Wind Farm — white turbines on North Sea horizon
        var turbinePositions = [
            [-500, -700], [-300, -720], [-100, -710], [100, -700],
            [300, -720], [500, -710], [700, -700], [-700, -730]
        ];

        for (var t = 0; t < turbinePositions.length; t++) {
            var tx = turbinePositions[t][0];
            var tz = turbinePositions[t][1];

            // Tower
            var towerGeo = new THREE.CylinderGeometry(2.5, 4, 70, 8);
            addMesh(towerGeo, 0xD3D3D3, tx, 35, tz);

            // Nacelle (generator housing)
            var nacelleGeo = new THREE.BoxGeometry(14, 6, 6);
            addMesh(nacelleGeo, 0xD3D3D3, tx, 72, tz);

            // Hub
            var hubGeo = new THREE.SphereGeometry(3, 8, 6);
            addMesh(hubGeo, 0xCCCCCC, tx + 7, 72, tz);

            // Three blades
            var blade1 = new THREE.BoxGeometry(2, 40, 1);
            addMesh(blade1, 0xDDDDDD, tx + 7, 92, tz);

            var blade2 = new THREE.BoxGeometry(2, 40, 1);
            addMesh(blade2, 0xDDDDDD, tx + 7, 52, tz, 0, 0, Math.PI * 2 / 3);

            var blade3 = new THREE.BoxGeometry(2, 40, 1);
            addMesh(blade3, 0xDDDDDD, tx + 7, 72, tz, 0, 0, Math.PI * 4 / 3);
        }
    }

    function buildVictorianStreets() {
        // Victorian terraced streets — workers' houses in brick
        // Street 1 — terraced row running E-W
        buildTerracedRow(-100, 0, 300, 10, 0xC87020);
        buildTerracedRow(-100, 0, 340, 10, 0xBB6818);
        buildTerracedRow(200, 0, 300, 8, 0xC87020);
        buildTerracedRow(200, 0, 340, 8, 0xBB6818);

        // Cross street — N-S terrace
        buildTerracedRowNS(50, 0, 320, 6, 0xC07018);

        // Corner pub / shop
        var cornerPub = new THREE.BoxGeometry(16, 14, 16);
        addMesh(cornerPub, 0xAA6010, -8, 7, 280);

        var pubSign = new THREE.BoxGeometry(14, 3, 2);
        addMesh(pubSign, 0x336633, -8, 12, 272);

        var pubChimney = new THREE.BoxGeometry(3, 6, 3);
        addMesh(pubChimney, 0x885510, -14, 18, 285);

        // Church with tower
        var churchBody = new THREE.BoxGeometry(30, 12, 18);
        addMesh(churchBody, 0x9B8060, 300, 6, 310);

        var churchTower = new THREE.BoxGeometry(10, 24, 10);
        addMesh(churchTower, 0x8B7050, 315, 12, 310);

        var churchSpire = new THREE.ConeGeometry(6, 16, 4);
        addMesh(churchSpire, 0x7B6040, 315, 28, 310, 0, Math.PI / 4);

        var churchRoof = new THREE.BoxGeometry(32, 4, 20);
        addMesh(churchRoof, 0x8B7050, 300, 14, 310);

        // Corner shop with flat roof parapet
        var shopBody = new THREE.BoxGeometry(12, 10, 10);
        addMesh(shopBody, 0xBB7030, 160, 5, 280);

        var shopParapet = new THREE.BoxGeometry(14, 2, 12);
        addMesh(shopParapet, 0xDD9050, 160, 11, 280);
    }

    function buildTerracedRow(startX, y, z, count, color) {
        for (var i = 0; i < count; i++) {
            // House body
            var houseGeo = new THREE.BoxGeometry(10, 12, 9);
            addMesh(houseGeo, color, startX + i * 11, y + 6, z);

            // Roof (pitched — two boxes)
            var roofGeo = new THREE.BoxGeometry(11, 3, 10);
            addMesh(roofGeo, 0x553322, startX + i * 11, y + 13.5, z);

            // Chimney stack
            var chimneyGeo = new THREE.BoxGeometry(2.5, 5, 2.5);
            addMesh(chimneyGeo, 0x994411, startX + i * 11 + 3, y + 16, z - 3);
        }
    }

    function buildTerracedRowNS(x, y, startZ, count, color) {
        for (var i = 0; i < count; i++) {
            var houseGeo = new THREE.BoxGeometry(9, 12, 10);
            addMesh(houseGeo, color, x, y + 6, startZ + i * 11);

            var roofGeo = new THREE.BoxGeometry(10, 3, 11);
            addMesh(roofGeo, 0x553322, x, y + 13.5, startZ + i * 11);

            var chimneyGeo = new THREE.BoxGeometry(2.5, 5, 2.5);
            addMesh(chimneyGeo, 0x994411, x + 3, y + 16, startZ + i * 11 + 3);
        }
    }

    function buildRefrigerationWarehouses() {
        // Large refrigeration warehouses at the fish docks
        // Warehouse A
        var whA = new THREE.BoxGeometry(80, 20, 40);
        addMesh(whA, 0x99AABB, -300, 10, -280);

        var whARoof = new THREE.BoxGeometry(82, 3, 42);
        addMesh(whARoof, 0x889999, -300, 21.5, -280);

        // Loading bay canopies on warehouse A
        var canopyA = new THREE.BoxGeometry(15, 4, 10);
        addMesh(canopyA, 0x778899, -260, 13, -260);

        var canopyA2 = new THREE.BoxGeometry(15, 4, 10);
        addMesh(canopyA2, 0x778899, -240, 13, -260);

        // Warehouse B — larger
        var whB = new THREE.BoxGeometry(100, 18, 35);
        addMesh(whB, 0xAABBCC, -380, 9, -290);

        var whBRoof = new THREE.BoxGeometry(102, 2, 37);
        addMesh(whBRoof, 0x9AABBC, -380, 19, -290);

        // Vent shafts on roof
        for (var v = 0; v < 4; v++) {
            var ventGeo = new THREE.CylinderGeometry(1.5, 1.5, 5, 6);
            addMesh(ventGeo, 0x888888, -350 + v * 22, 21, -290);

            var ventCapGeo = new THREE.CylinderGeometry(2.5, 1.5, 2, 6);
            addMesh(ventCapGeo, 0x777777, -350 + v * 22, 24.5, -290);
        }

        // Forklift truck parked outside
        var forkBody = new THREE.BoxGeometry(5, 4, 4);
        addMesh(forkBody, 0xFF8800, -252, 2, -265);

        var forkMast = new THREE.BoxGeometry(1, 6, 1);
        addMesh(forkMast, 0xDD7700, -250, 5, -265);
    }

    function buildDocksideInfrastructure() {
        // Dock railway lines (represented as flat strips)
        var rail1 = new THREE.BoxGeometry(400, 0.5, 2);
        addMesh(rail1, 0x444444, -100, 0.25, 175);

        var rail2 = new THREE.BoxGeometry(400, 0.5, 2);
        addMesh(rail2, 0x444444, -100, 0.25, 185);

        // Shunting locomotive
        var locoBody = new THREE.BoxGeometry(14, 8, 6);
        addMesh(locoBody, 0x222222, -50, 4, 180);

        var locoCab = new THREE.BoxGeometry(6, 6, 6);
        addMesh(locoCab, 0x333333, -56, 5, 180);

        var locoFunnel = new THREE.CylinderGeometry(1.2, 1.5, 5, 6);
        addMesh(locoFunnel, 0x111111, -44, 11, 180);

        // Dock road — runs parallel to quay
        var dockRoad = new THREE.BoxGeometry(500, 0.3, 16);
        addMesh(dockRoad, 0x333333, -100, 0.15, 200);

        // Street lamps along dock road
        for (var l = 0; l < 8; l++) {
            var lampPole = new THREE.CylinderGeometry(0.5, 0.5, 10, 6);
            addMesh(lampPole, 0x888866, -320 + l * 70, 5, 193);

            var lampHead = new THREE.SphereGeometry(1.5, 6, 4);
            addMesh(lampHead, 0xFFFFCC, -320 + l * 70, 11, 193);
        }

        // Dock gate / entrance — ornamental brick pillars
        var pillar1 = new THREE.BoxGeometry(5, 16, 5);
        addMesh(pillar1, 0x8B4513, -370, 8, 210);

        var pillar2 = new THREE.BoxGeometry(5, 16, 5);
        addMesh(pillar2, 0x8B4513, -370, 8, 190);

        var pillarCap1 = new THREE.SphereGeometry(4, 8, 6);
        addMesh(pillarCap1, 0x6B3500, -370, 17, 210);

        var pillarCap2 = new THREE.SphereGeometry(4, 8, 6);
        addMesh(pillarCap2, 0x6B3500, -370, 17, 190);

        // Gate arch spanning the two pillars
        var gateArch = new THREE.BoxGeometry(4, 3, 20);
        addMesh(gateArch, 0x7B4510, -370, 17, 200);

        // Fuel barge at quayside
        var bargeHull = new THREE.BoxGeometry(50, 4, 14);
        addMesh(bargeHull, 0x334455, 30, 2, 148);

        var bargeSuperstructure = new THREE.BoxGeometry(16, 6, 10);
        addMesh(bargeSuperstructure, 0x445566, 40, 7, 148);

        // Rope coils on quayside
        for (var r = 0; r < 3; r++) {
            var ropeCoilGeo = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 8);
            addMesh(ropeCoilGeo, 0xAA9966, -280 + r * 40, 1.5, 148);
        }

        // Harbour master's office
        var hmOffice = new THREE.BoxGeometry(18, 10, 14);
        addMesh(hmOffice, 0xCC9955, -390, 5, 170);

        var hmRoof = new THREE.BoxGeometry(20, 3, 16);
        addMesh(hmRoof, 0x996633, -390, 11.5, 170);

        var hmFlag = new THREE.BoxGeometry(0.5, 12, 0.5);
        addMesh(hmFlag, 0x888866, -381, 11, 163);

        var flagCloth = new THREE.BoxGeometry(7, 4, 0.5);
        addMesh(flagCloth, 0x3333CC, -377, 19, 163);
    }

    function buildLighthouse() {
        // Lighthouse at dock entrance
        var baseGeo = new THREE.CylinderGeometry(5, 7, 4, 8);
        addMesh(baseGeo, 0xDDDDCC, -420, 2, 0);

        var shaftGeo = new THREE.CylinderGeometry(3.5, 5, 28, 8);
        addMesh(shaftGeo, 0xEEEEDD, -420, 18, 0);

        // Red stripe band
        var stripGeo = new THREE.CylinderGeometry(3.6, 3.6, 5, 8);
        addMesh(stripGeo, 0xCC2200, -420, 20, 0);

        // Lamp room
        var lampRoomGeo = new THREE.CylinderGeometry(4.5, 3.5, 6, 8);
        addMesh(lampRoomGeo, 0xCCCCCC, -420, 35, 0);

        // Glass lantern dome
        var lanternGeo = new THREE.SphereGeometry(3.5, 8, 6);
        addMesh(lanternGeo, 0xFFFFAA, -420, 40, 0);

        // Conical roof cap
        var capGeo = new THREE.ConeGeometry(4, 4, 8);
        addMesh(capGeo, 0x333333, -420, 45, 0);

        // Walkway railing around lamp room
        var railGeo = new THREE.CylinderGeometry(5, 5, 0.5, 8);
        addMesh(railGeo, 0x888888, -420, 32.5, 0);
    }

    function update(delta) {
        // Static environment — no per-frame updates required
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
