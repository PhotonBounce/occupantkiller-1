window.OsloVigeland = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 22880;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildOslofjord();
        buildVigelandPark();
        buildOperaHouse();
        buildAkershusFortress();
        buildRoyalPalace();
        buildKarlJohansGate();
        buildVikingShipMuseum();
        buildHolmenkollen();
        buildNobelPeaceCenter();
        buildCityHall();
    }

    function buildGround() {
        // Ground base as large flat box (using BoxGeometry, not PlaneGeometry)
        var groundGeo = new THREE.BoxGeometry(3000, 2, 3000);
        var ground = makeMesh(groundGeo, 0x4a7c3f);
        ground.position.set(OX, OY - 1, OZ);

        // Pavement areas — Karl Johans gate boulevard base
        var pavGeo = new THREE.BoxGeometry(900, 0.5, 60);
        var pav = makeMesh(pavGeo, 0xDEB887);
        pav.position.set(OX - 100, OY + 0.3, OZ + 200);
    }

    function buildOslofjord() {
        // Fjord body — deep cold water, south of city
        var fjordGeo = new THREE.BoxGeometry(2000, 8, 800);
        var fjord = makeMesh(fjordGeo, 0x1A4A6A);
        fjord.position.set(OX, OY - 4, OZ + 800);

        // Fjord shore shelf
        var shoreGeo = new THREE.BoxGeometry(2000, 3, 80);
        var shore = makeMesh(shoreGeo, 0x8B7D6B);
        shore.position.set(OX, OY - 1, OZ + 400);

        // Harbour quay wall
        var quayGeo = new THREE.BoxGeometry(600, 6, 12);
        var quay = makeMesh(quayGeo, 0x888888);
        quay.position.set(OX + 100, OY + 3, OZ + 420);

        // Small island in fjord
        var islandGeo = new THREE.BoxGeometry(80, 4, 60);
        var island = makeMesh(islandGeo, 0x5a8a3e);
        island.position.set(OX + 300, OY - 1, OZ + 750);
    }

    function buildVigelandPark() {
        // Park base / lawn
        var parkGeo = new THREE.BoxGeometry(400, 0.8, 500);
        var park = makeMesh(parkGeo, 0x5a9a40);
        park.position.set(OX - 600, OY + 0.4, OZ - 300);

        // ---- MONOLITH ----
        // Granite column — 17m tall, cylindrical with human figures suggestion
        var monolithBaseGeo = new THREE.CylinderGeometry(8, 10, 4, 8);
        var monolithBase = makeMesh(monolithBaseGeo, 0x888888);
        monolithBase.position.set(OX - 600, OY + 2, OZ - 300);

        var monolithGeo = new THREE.CylinderGeometry(3, 4, 17, 8);
        var monolith = makeMesh(monolithGeo, 0x999999);
        monolith.position.set(OX - 600, OY + 12.5, OZ - 300);

        // Figures on monolith — clusters of small cylinders suggesting intertwined humans
        for (var mi = 0; mi < 6; mi++) {
            var angle = (mi / 6) * Math.PI * 2;
            var figGeo = new THREE.CylinderGeometry(0.4, 0.6, 2.5, 5);
            var fig = makeMesh(figGeo, 0x777777);
            fig.position.set(
                OX - 600 + Math.cos(angle) * 2.5,
                OY + 6 + mi * 1.8,
                OZ - 300 + Math.sin(angle) * 2.5
            );
        }

        // Monolith platform stairs — stepped platform
        var step1Geo = new THREE.CylinderGeometry(18, 20, 1.5, 8);
        var step1 = makeMesh(step1Geo, 0x888888);
        step1.position.set(OX - 600, OY + 0.75, OZ - 300);

        var step2Geo = new THREE.CylinderGeometry(14, 16, 1.5, 8);
        var step2 = makeMesh(step2Geo, 0x888888);
        step2.position.set(OX - 600, OY + 2.25, OZ - 300);

        var step3Geo = new THREE.CylinderGeometry(10, 12, 1.5, 8);
        var step3 = makeMesh(step3Geo, 0x888888);
        step3.position.set(OX - 600, OY + 3.75, OZ - 300);

        // ---- BRIDGE ----
        // Main bridge structure — 100m long
        var bridgeGeo = new THREE.BoxGeometry(100, 2, 15);
        var bridge = makeMesh(bridgeGeo, 0x888888);
        bridge.position.set(OX - 600, OY + 2, OZ - 130);

        // Bridge parapet left
        var parapetLGeo = new THREE.BoxGeometry(100, 1.5, 1.5);
        var parapetL = makeMesh(parapetLGeo, 0x999999);
        parapetL.position.set(OX - 600, OY + 3.75, OZ - 122.5);

        // Bridge parapet right
        var parapetRGeo = new THREE.BoxGeometry(100, 1.5, 1.5);
        var parapetR = makeMesh(parapetRGeo, 0x999999);
        parapetR.position.set(OX - 600, OY + 3.75, OZ - 137.5);

        // Bronze sculptures on bridge — 8 representative figures
        for (var bi = 0; bi < 8; bi++) {
            var bfigGeo = new THREE.CylinderGeometry(0.5, 0.7, 2.2, 6);
            var bfig = makeMesh(bfigGeo, 0x8B6914);
            bfig.position.set(OX - 650 + bi * 14, OY + 4.1, OZ - 125 + (bi % 2) * 10);
            var bheadGeo = new THREE.SphereGeometry(0.45, 6, 5);
            var bhead = makeMesh(bheadGeo, 0x8B6914);
            bhead.position.set(OX - 650 + bi * 14, OY + 5.8, OZ - 125 + (bi % 2) * 10);
        }

        // ---- FOUNTAIN ----
        var fountainBaseGeo = new THREE.CylinderGeometry(14, 16, 1.5, 8);
        var fountainBase = makeMesh(fountainBaseGeo, 0x888888);
        fountainBase.position.set(OX - 600, OY + 0.75, OZ - 200);

        var fountainBasinGeo = new THREE.CylinderGeometry(12, 12, 2, 8);
        var fountainBasin = makeMesh(fountainBasinGeo, 0x777777);
        fountainBasin.position.set(OX - 600, OY + 1.75, OZ - 200);

        var fountainCenterGeo = new THREE.CylinderGeometry(2, 3, 5, 6);
        var fountainCenter = makeMesh(fountainCenterGeo, 0x888888);
        fountainCenter.position.set(OX - 600, OY + 4.5, OZ - 200);

        // Water bowl top of fountain
        var bowlGeo = new THREE.CylinderGeometry(4, 2, 2, 8);
        var bowl = makeMesh(bowlGeo, 0x1A4A6A);
        bowl.position.set(OX - 600, OY + 7.5, OZ - 200);

        // ---- WHEEL OF LIFE ----
        var wolBaseGeo = new THREE.CylinderGeometry(3, 3.5, 1, 8);
        var wolBase = makeMesh(wolBaseGeo, 0x888888);
        wolBase.position.set(OX - 600, OY + 0.5, OZ - 380);

        var wolPostGeo = new THREE.CylinderGeometry(0.5, 0.5, 4, 6);
        var wolPost = makeMesh(wolPostGeo, 0x888888);
        wolPost.position.set(OX - 600, OY + 3, OZ - 380);

        // Wheel ring — approximated with box arc segments
        for (var wi = 0; wi < 8; wi++) {
            var wa = (wi / 8) * Math.PI * 2;
            var wsegGeo = new THREE.BoxGeometry(1.2, 1.2, 3);
            var wseg = makeMesh(wsegGeo, 0x777777);
            wseg.position.set(
                OX - 600 + Math.cos(wa) * 5,
                OY + 5,
                OZ - 380 + Math.sin(wa) * 5
            );
        }

        // ---- ANGRY BOY STATUE ----
        var angryBoyBodyGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.4, 6);
        var angryBoyBody = makeMesh(angryBoyBodyGeo, 0x8B6914);
        angryBoyBody.position.set(OX - 560, OY + 2.2, OZ - 250);

        var angryBoyHeadGeo = new THREE.SphereGeometry(0.55, 7, 6);
        var angryBoyHead = makeMesh(angryBoyHeadGeo, 0x8B6914);
        angryBoyHead.position.set(OX - 560, OY + 3.4, OZ - 250);

        var angryBoyPedestalGeo = new THREE.CylinderGeometry(1, 1.2, 1.5, 6);
        var angryBoyPedestal = makeMesh(angryBoyPedestalGeo, 0x888888);
        angryBoyPedestal.position.set(OX - 560, OY + 0.75, OZ - 250);

        // Park trees — cones on cylinders
        for (var ti = 0; ti < 8; ti++) {
            var tx = OX - 700 + (ti % 4) * 60;
            var tz = OZ - 80 + Math.floor(ti / 4) * 400;
            var trunkGeo = new THREE.CylinderGeometry(1, 1.2, 8, 6);
            var trunk = makeMesh(trunkGeo, 0x5C3317);
            trunk.position.set(tx, OY + 4, tz);
            var canopyGeo = new THREE.ConeGeometry(6, 12, 7);
            var canopy = makeMesh(canopyGeo, 0x2d6a1f);
            canopy.position.set(tx, OY + 16, tz);
        }

        // Park entrance gate pillars
        var pillar1Geo = new THREE.BoxGeometry(3, 12, 3);
        var pillar1 = makeMesh(pillar1Geo, 0x888888);
        pillar1.position.set(OX - 570, OY + 6, OZ - 80);

        var pillar2Geo = new THREE.BoxGeometry(3, 12, 3);
        var pillar2 = makeMesh(pillar2Geo, 0x888888);
        pillar2.position.set(OX - 630, OY + 6, OZ - 80);

        var gateLintelGeo = new THREE.BoxGeometry(63, 3, 3);
        var gateLintel = makeMesh(gateLintelGeo, 0x888888);
        gateLintel.position.set(OX - 600, OY + 13, OZ - 80);
    }

    function buildOperaHouse() {
        // Oslo Opera House — angular white marble, roof walkable, slopes to fjord
        // Main building body
        var operaBodyGeo = new THREE.BoxGeometry(180, 18, 120);
        var operaBody = makeMesh(operaBodyGeo, 0xF5F5DC);
        operaBody.position.set(OX + 200, OY + 9, OZ + 380);

        // Sloped roof left — angled box
        var roofLGeo = new THREE.BoxGeometry(180, 2, 60);
        var roofL = makeMesh(roofLGeo, 0xF5F5DC);
        roofL.position.set(OX + 200, OY + 18.5, OZ + 350);
        roofL.rotation.x = 0.25;

        // Sloped roof right extending to fjord
        var roofRGeo = new THREE.BoxGeometry(180, 2, 80);
        var roofR = makeMesh(roofRGeo, 0xEEEEDC);
        roofR.position.set(OX + 200, OY + 12, OZ + 440);
        roofR.rotation.x = -0.3;

        // Main stage tower — tall fly tower
        var stageTowerGeo = new THREE.BoxGeometry(60, 50, 55);
        var stageTower = makeMesh(stageTowerGeo, 0xF5F5DC);
        stageTower.position.set(OX + 200, OY + 25, OZ + 360);

        // Glass curtain wall front facade (dark tinted)
        var glassGeo = new THREE.BoxGeometry(180, 18, 2);
        var glass = makeMesh(glassGeo, 0x2a4060);
        glass.position.set(OX + 200, OY + 9, OZ + 320);

        // Roof walkway surface
        var walkwayGeo = new THREE.BoxGeometry(160, 1, 100);
        var walkway = makeMesh(walkwayGeo, 0xDCDCCC);
        walkway.position.set(OX + 200, OY + 18.5, OZ + 375);

        // Opera quay / waterfront plaza
        var plazaGeo = new THREE.BoxGeometry(220, 0.8, 60);
        var plaza = makeMesh(plazaGeo, 0xCCCCBB);
        plaza.position.set(OX + 200, OY + 0.4, OZ + 308);
    }

    function buildAkershusFortress() {
        // Akershus on harbour promontory — medieval castle
        // Promontory base
        var promoGeo = new THREE.BoxGeometry(220, 12, 200);
        var promo = makeMesh(promoGeo, 0x8B7355);
        promo.position.set(OX + 50, OY + 6, OZ + 500);

        // Curtain wall north
        var wallNGeo = new THREE.BoxGeometry(200, 14, 5);
        var wallN = makeMesh(wallNGeo, 0x888888);
        wallN.position.set(OX + 50, OY + 7, OZ + 410);

        // Curtain wall south
        var wallSGeo = new THREE.BoxGeometry(200, 14, 5);
        var wallS = makeMesh(wallSGeo, 0x888888);
        wallS.position.set(OX + 50, OY + 7, OZ + 600);

        // Curtain wall east
        var wallEGeo = new THREE.BoxGeometry(5, 14, 190);
        var wallE = makeMesh(wallEGeo, 0x888888);
        wallE.position.set(OX + 150, OY + 7, OZ + 505);

        // Curtain wall west
        var wallWGeo = new THREE.BoxGeometry(5, 14, 190);
        var wallW = makeMesh(wallWGeo, 0x888888);
        wallW.position.set(OX - 50, OY + 7, OZ + 505);

        // Main Keep (donjon)
        var keepGeo = new THREE.BoxGeometry(45, 28, 45);
        var keep = makeMesh(keepGeo, 0x777777);
        keep.position.set(OX + 60, OY + 14, OZ + 510);

        // Keep roof — cone top
        var keepRoofGeo = new THREE.ConeGeometry(28, 12, 4);
        var keepRoof = makeMesh(keepRoofGeo, 0x555555);
        keepRoof.position.set(OX + 60, OY + 34, OZ + 510);
        keepRoof.rotation.y = Math.PI / 4;

        // Round tower NW corner
        var towerNWGeo = new THREE.CylinderGeometry(8, 8, 22, 8);
        var towerNW = makeMesh(towerNWGeo, 0x888888);
        towerNW.position.set(OX - 45, OY + 11, OZ + 415);

        var towerNWCapGeo = new THREE.ConeGeometry(9, 10, 8);
        var towerNWCap = makeMesh(towerNWCapGeo, 0x666666);
        towerNWCap.position.set(OX - 45, OY + 27, OZ + 415);

        // Round tower NE corner
        var towerNEGeo = new THREE.CylinderGeometry(8, 8, 22, 8);
        var towerNE = makeMesh(towerNEGeo, 0x888888);
        towerNE.position.set(OX + 145, OY + 11, OZ + 415);

        var towerNECapGeo = new THREE.ConeGeometry(9, 10, 8);
        var towerNECap = makeMesh(towerNECapGeo, 0x666666);
        towerNECap.position.set(OX + 145, OY + 27, OZ + 415);

        // Gate tower
        var gateTowerGeo = new THREE.BoxGeometry(22, 20, 18);
        var gateTower = makeMesh(gateTowerGeo, 0x888888);
        gateTower.position.set(OX + 50, OY + 10, OZ + 410);

        // Gate arch opening (dark)
        var gateArchGeo = new THREE.BoxGeometry(8, 10, 8);
        var gateArch = makeMesh(gateArchGeo, 0x222222);
        gateArch.position.set(OX + 50, OY + 5, OZ + 410);

        // Chapel inside fortress
        var chapelGeo = new THREE.BoxGeometry(30, 16, 20);
        var chapel = makeMesh(chapelGeo, 0x999988);
        chapel.position.set(OX - 10, OY + 8, OZ + 540);

        var chapelRoofGeo = new THREE.CylinderGeometry(0.8, 16, 8, 4);
        var chapelRoof = makeMesh(chapelRoofGeo, 0x666655);
        chapelRoof.position.set(OX - 10, OY + 20, OZ + 540);
        chapelRoof.rotation.y = Math.PI / 4;
    }

    function buildRoyalPalace() {
        // Royal Palace — neoclassical on hill, end of Karl Johans gate
        // Hill base
        var hillGeo = new THREE.BoxGeometry(180, 10, 140);
        var hill = makeMesh(hillGeo, 0x5a8a3e);
        hill.position.set(OX - 350, OY + 5, OZ + 200);

        // Main palace body
        var palaceGeo = new THREE.BoxGeometry(130, 20, 55);
        var palace = makeMesh(palaceGeo, 0xF5F5DC);
        palace.position.set(OX - 350, OY + 20, OZ + 200);

        // Palace roof
        var palaceRoofGeo = new THREE.BoxGeometry(135, 5, 58);
        var palaceRoof = makeMesh(palaceRoofGeo, 0xE8E8C8);
        palaceRoof.position.set(OX - 350, OY + 32.5, OZ + 200);

        // Left wing
        var wingLGeo = new THREE.BoxGeometry(30, 16, 40);
        var wingL = makeMesh(wingLGeo, 0xF5F5DC);
        wingL.position.set(OX - 430, OY + 18, OZ + 200);

        // Right wing
        var wingRGeo = new THREE.BoxGeometry(30, 16, 40);
        var wingR = makeMesh(wingRGeo, 0xF5F5DC);
        wingR.position.set(OX - 270, OY + 18, OZ + 200);

        // Columns on facade — 6 pillars
        for (var ci = 0; ci < 6; ci++) {
            var colGeo = new THREE.CylinderGeometry(1.5, 1.8, 18, 6);
            var col = makeMesh(colGeo, 0xF0F0D8);
            col.position.set(OX - 390 + ci * 16, OY + 19, OZ + 173);
        }

        // Triangular pediment
        var pedimentGeo = new THREE.BoxGeometry(100, 0.5, 12);
        var pediment = makeMesh(pedimentGeo, 0xF5F5DC);
        pediment.position.set(OX - 350, OY + 30, OZ + 173);

        // Palace grounds / forecourt
        var courtyardGeo = new THREE.BoxGeometry(100, 0.5, 80);
        var courtyard = makeMesh(courtyardGeo, 0xDEB887);
        courtyard.position.set(OX - 350, OY + 10.3, OZ + 145);

        // Equestrian statue
        var statueBodyGeo = new THREE.BoxGeometry(4, 4, 8);
        var statueBody = makeMesh(statueBodyGeo, 0x4a3010);
        statueBody.position.set(OX - 350, OY + 15, OZ + 130);

        var statueRiderGeo = new THREE.CylinderGeometry(0.7, 0.8, 3.5, 5);
        var statueRider = makeMesh(statueRiderGeo, 0x4a3010);
        statueRider.position.set(OX - 350, OY + 18.5, OZ + 130);
    }

    function buildKarlJohansGate() {
        // Karl Johans gate — main boulevard with key buildings
        // Boulevard road surface
        var roadGeo = new THREE.BoxGeometry(600, 0.5, 28);
        var road = makeMesh(roadGeo, 0xDEB887);
        road.position.set(OX - 100, OY + 0.3, OZ + 200);

        // Sidewalks
        var sidewalkLGeo = new THREE.BoxGeometry(600, 0.5, 10);
        var sidewalkL = makeMesh(sidewalkLGeo, 0xCCBB99);
        sidewalkL.position.set(OX - 100, OY + 0.3, OZ + 219);

        var sidewalkRGeo = new THREE.BoxGeometry(600, 0.5, 10);
        var sidewalkR = makeMesh(sidewalkRGeo, 0xCCBB99);
        sidewalkR.position.set(OX - 100, OY + 0.3, OZ + 181);

        // ---- National Theatre ----
        var theatreGeo = new THREE.BoxGeometry(65, 22, 50);
        var theatre = makeMesh(theatreGeo, 0xF5F5DC);
        theatre.position.set(OX - 220, OY + 11, OZ + 240);

        var theatreRoofGeo = new THREE.CylinderGeometry(22, 26, 12, 6);
        var theatreRoof = makeMesh(theatreRoofGeo, 0xD4D4B4);
        theatreRoof.position.set(OX - 220, OY + 28, OZ + 240);

        // Theatre portico columns
        for (var tci = 0; tci < 4; tci++) {
            var tcGeo = new THREE.CylinderGeometry(1.2, 1.4, 16, 6);
            var tc = makeMesh(tcGeo, 0xF0F0D8);
            tc.position.set(OX - 237 + tci * 10, OY + 8, OZ + 215);
        }

        // ---- Storting (Parliament) ----
        var stortingGeo = new THREE.BoxGeometry(70, 24, 55);
        var storting = makeMesh(stortingGeo, 0xE8D8B8);
        storting.position.set(OX - 80, OY + 12, OZ + 240);

        var stortingDomeGeo = new THREE.SphereGeometry(16, 8, 6);
        var stortingDome = makeMesh(stortingDomeGeo, 0xD4C8A8);
        stortingDome.position.set(OX - 80, OY + 32, OZ + 240);

        // Storting front steps
        var stortingStepsGeo = new THREE.BoxGeometry(50, 3, 12);
        var stortingSteps = makeMesh(stortingStepsGeo, 0xDDCCAA);
        stortingSteps.position.set(OX - 80, OY + 1.5, OZ + 213);

        // Street lamp posts along boulevard
        for (var li = 0; li < 6; li++) {
            var lampPostGeo = new THREE.CylinderGeometry(0.3, 0.4, 9, 5);
            var lampPost = makeMesh(lampPostGeo, 0x444444);
            lampPost.position.set(OX - 280 + li * 80, OY + 4.5, OZ + 215);

            var lampGeo = new THREE.SphereGeometry(0.8, 5, 4);
            var lamp = makeMesh(lampGeo, 0xFFFFCC);
            lamp.position.set(OX - 280 + li * 80, OY + 9.5, OZ + 215);
        }
    }

    function buildVikingShipMuseum() {
        // Viking Ship Museum — cross-shaped building containing real Viking ships
        // Main hall — central nave
        var naveGeo = new THREE.BoxGeometry(50, 18, 100);
        var nave = makeMesh(naveGeo, 0xC8B89A);
        nave.position.set(OX - 800, OY + 9, OZ - 100);

        // Cross transept
        var transeptGeo = new THREE.BoxGeometry(100, 18, 50);
        var transept = makeMesh(transeptGeo, 0xC8B89A);
        transept.position.set(OX - 800, OY + 9, OZ - 100);

        // Nave roof — barrel vault suggestion using box
        var naiveRoofGeo = new THREE.BoxGeometry(54, 6, 104);
        var naiveRoof = makeMesh(naiveRoofGeo, 0xB8A88A);
        naiveRoof.position.set(OX - 800, OY + 20, OZ - 100);

        // Transept roof
        var transeptRoofGeo = new THREE.BoxGeometry(104, 6, 54);
        var transeptRoof = makeMesh(transeptRoofGeo, 0xB8A88A);
        transeptRoof.position.set(OX - 800, OY + 20, OZ - 100);

        // Viking ship 1 — Oseberg ship shape (elongated hull)
        var ship1HullGeo = new THREE.BoxGeometry(25, 4, 7);
        var ship1Hull = makeMesh(ship1HullGeo, 0x8B6914);
        ship1Hull.position.set(OX - 800, OY + 3, OZ - 110);

        // Ship 1 bow (cone)
        var ship1BowGeo = new THREE.ConeGeometry(3.5, 6, 4);
        var ship1Bow = makeMesh(ship1BowGeo, 0x8B6914);
        ship1Bow.position.set(OX - 812, OY + 4, OZ - 110);
        ship1Bow.rotation.z = -Math.PI / 2;
        ship1Bow.rotation.y = Math.PI / 4;

        // Ship 1 stern
        var ship1SternGeo = new THREE.ConeGeometry(3.5, 6, 4);
        var ship1Stern = makeMesh(ship1SternGeo, 0x8B6914);
        ship1Stern.position.set(OX - 788, OY + 4, OZ - 110);
        ship1Stern.rotation.z = Math.PI / 2;
        ship1Stern.rotation.y = Math.PI / 4;

        // Viking ship 2 — Gokstad ship
        var ship2HullGeo = new THREE.BoxGeometry(22, 3.5, 6);
        var ship2Hull = makeMesh(ship2HullGeo, 0x7A5C0A);
        ship2Hull.position.set(OX - 800, OY + 3, OZ - 90);

        // Museum entrance
        var entranceGeo = new THREE.BoxGeometry(18, 12, 6);
        var entrance = makeMesh(entranceGeo, 0xC8B89A);
        entrance.position.set(OX - 800, OY + 6, OZ - 150);

        var entranceDoorGeo = new THREE.BoxGeometry(6, 8, 4);
        var entranceDoor = makeMesh(entranceDoorGeo, 0x4a3010);
        entranceDoor.position.set(OX - 800, OY + 4, OZ - 152);
    }

    function buildHolmenkollen() {
        // Holmenkollen ski jump — futuristic tower on forested hillside, 62m tall
        // Forested hillside base
        var hillsideGeo = new THREE.BoxGeometry(300, 60, 300);
        var hillside = makeMesh(hillsideGeo, 0x4a7030);
        hillside.position.set(OX - 400, OY + 30, OZ - 600);

        // Jump tower column — main support
        var towerGeo = new THREE.BoxGeometry(8, 62, 8);
        var tower = makeMesh(towerGeo, 0xD3D3D3);
        tower.position.set(OX - 400, OY + 91, OZ - 600);

        // Jump ramp — angled arm at top
        var rampGeo = new THREE.BoxGeometry(6, 4, 80);
        var ramp = makeMesh(rampGeo, 0xD3D3D3);
        ramp.position.set(OX - 400, OY + 122, OZ - 560);
        ramp.rotation.x = 0.35;

        // Curved nose at top (futuristic overhang)
        var noseGeo = new THREE.BoxGeometry(14, 5, 20);
        var nose = makeMesh(noseGeo, 0xD3D3D3);
        nose.position.set(OX - 400, OY + 124, OZ - 520);

        // Observation platform at top
        var obsDeckGeo = new THREE.BoxGeometry(16, 3, 16);
        var obsDeck = makeMesh(obsDeckGeo, 0xC8C8C8);
        obsDeck.position.set(OX - 400, OY + 123, OZ - 600);

        // Landing slope
        var landingGeo = new THREE.BoxGeometry(50, 3, 140);
        var landing = makeMesh(landingGeo, 0xDDDDDD);
        landing.position.set(OX - 400, OY + 72, OZ - 490);
        landing.rotation.x = 0.45;

        // Spectator stands — tiered boxes
        var stands1Geo = new THREE.BoxGeometry(80, 8, 20);
        var stands1 = makeMesh(stands1Geo, 0xD3D3D3);
        stands1.position.set(OX - 360, OY + 64, OZ - 540);

        var stands2Geo = new THREE.BoxGeometry(80, 6, 20);
        var stands2 = makeMesh(stands2Geo, 0xBBBBBB);
        stands2.position.set(OX - 360, OY + 58, OZ - 520);

        // Forest trees around jump
        for (var hti = 0; hti < 6; hti++) {
            var htx = OX - 480 + (hti % 3) * 40;
            var htz = OZ - 650 + Math.floor(hti / 3) * 50;
            var htTrunkGeo = new THREE.CylinderGeometry(1, 1.3, 10, 5);
            var htTrunk = makeMesh(htTrunkGeo, 0x5C3317);
            htTrunk.position.set(htx, OY + 65, htz);
            var htCanopyGeo = new THREE.ConeGeometry(7, 14, 6);
            var htCanopy = makeMesh(htCanopyGeo, 0x2d5a1a);
            htCanopy.position.set(htx, OY + 79, htz);
        }
    }

    function buildNobelPeaceCenter() {
        // Nobel Peace Center — modernist near City Hall, on waterfront
        var nobleMainGeo = new THREE.BoxGeometry(70, 16, 45);
        var nobleMain = makeMesh(nobleMainGeo, 0xD3D3D3);
        nobleMain.position.set(OX - 50, OY + 8, OZ + 450);

        // Cantilevered roof extension
        var nobleRoofGeo = new THREE.BoxGeometry(80, 2, 50);
        var nobleRoof = makeMesh(nobleRoofGeo, 0xC8C8C8);
        nobleRoof.position.set(OX - 50, OY + 16.5, OZ + 450);

        // Glass facade dark panels
        var nobleFacadeGeo = new THREE.BoxGeometry(70, 14, 2);
        var nobleFacade = makeMesh(nobleFacadeGeo, 0x3a5070);
        nobleFacade.position.set(OX - 50, OY + 8, OZ + 427);

        // Entrance canopy
        var nobleCanopyGeo = new THREE.BoxGeometry(24, 1.5, 12);
        var nobleCanopy = makeMesh(nobleCanopyGeo, 0xD8D8D8);
        nobleCanopy.position.set(OX - 50, OY + 12, OZ + 422);

        // Nobel Peace Center flagpoles
        for (var nfi = 0; nfi < 3; nfi++) {
            var nfpGeo = new THREE.CylinderGeometry(0.25, 0.3, 14, 4);
            var nfp = makeMesh(nfpGeo, 0x888888);
            nfp.position.set(OX - 70 + nfi * 20, OY + 7, OZ + 418);
        }
    }

    function buildCityHall() {
        // Oslo City Hall (Radhuset) — twin red brick towers near waterfront
        // Main hall body
        var cityHallGeo = new THREE.BoxGeometry(100, 20, 65);
        var cityHall = makeMesh(cityHallGeo, 0xA03020);
        cityHall.position.set(OX - 100, OY + 10, OZ + 430);

        // West tower
        var towerWGeo = new THREE.BoxGeometry(30, 60, 30);
        var towerW = makeMesh(towerWGeo, 0x902818);
        towerW.position.set(OX - 135, OY + 30, OZ + 430);

        // West tower top
        var towerWTopGeo = new THREE.BoxGeometry(32, 6, 32);
        var towerWTop = makeMesh(towerWTopGeo, 0x802010);
        towerWTop.position.set(OX - 135, OY + 63, OZ + 430);

        // East tower
        var towerEGeo = new THREE.BoxGeometry(30, 60, 30);
        var towerE = makeMesh(towerEGeo, 0x902818);
        towerE.position.set(OX - 65, OY + 30, OZ + 430);

        // East tower top
        var towerETopGeo = new THREE.BoxGeometry(32, 6, 32);
        var towerETop = makeMesh(towerETopGeo, 0x802010);
        towerETop.position.set(OX - 65, OY + 63, OZ + 430);

        // City Hall courtyard / plaza
        var cityPlazaGeo = new THREE.BoxGeometry(120, 0.5, 50);
        var cityPlaza = makeMesh(cityPlazaGeo, 0xCCBBAA);
        cityPlaza.position.set(OX - 100, OY + 0.3, OZ + 400);

        // Clock face suggestion on tower (box inset)
        var clockGeo = new THREE.CylinderGeometry(4, 4, 1, 8);
        var clock = makeMesh(clockGeo, 0xFFD700);
        clock.position.set(OX - 135, OY + 50, OZ + 415);
        clock.rotation.x = Math.PI / 2;
    }

    function update(delta) {
        // No per-frame animation needed for static environment
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
