window.DushanbeRudaki = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 23960;
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
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function placeMesh(geo, color, x, y, z) {
        var m = makeMesh(geo, color);
        m.position.set(OX + x, OY + y, OZ + z);
        return addMesh(m);
    }

    function build() {
        buildGround();
        buildRudakiAvenue();
        buildSomoniMonument();
        buildFlagpole();
        buildNationalMuseum();
        buildOperaHouse();
        buildMosque();
        buildVarzobGorge();
        buildPamirMountains();
        buildKomsomolLake();
        buildBazaar();
    }

    function buildGround() {
        // Main city ground slab — approximated with flat box
        var groundGeo = new THREE.BoxGeometry(2400, 2, 2400);
        var ground = placeMesh(groundGeo, 0x8A9A70, 0, -1, 0);
        ground.name = 'dushGround';

        // Road surface — Rudaki Avenue surface
        var roadGeo = new THREE.BoxGeometry(40, 0.5, 1200);
        placeMesh(roadGeo, 0x444444, 0, 0.25, 0);

        // Central promenade divider
        var promenadeGeo = new THREE.BoxGeometry(10, 0.6, 1200);
        placeMesh(promenadeGeo, 0xD0C8B8, 0, 0.3, 0);
    }

    function buildRudakiAvenue() {
        // Soviet-era buildings — left side of avenue
        var buildingColors = [0xD0C8B8, 0xC8C0A8, 0xD8D0C0, 0xC0B8A8];
        var i, bGeo, bHeight, bColor;

        // Left-side buildings
        for (i = 0; i < 6; i++) {
            bHeight = 18 + (i % 3) * 8;
            bColor = buildingColors[i % buildingColors.length];
            bGeo = new THREE.BoxGeometry(22, bHeight, 30);
            placeMesh(bGeo, bColor, -45, bHeight / 2, -220 + i * 90);
        }

        // Right-side buildings
        for (i = 0; i < 6; i++) {
            bHeight = 16 + (i % 4) * 6;
            bColor = buildingColors[(i + 2) % buildingColors.length];
            bGeo = new THREE.BoxGeometry(22, bHeight, 30);
            placeMesh(bGeo, bColor, 45, bHeight / 2, -220 + i * 90);
        }

        // Trees — left promenade row
        var treeTrunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 5, 6);
        var treeTopGeo = new THREE.SphereGeometry(3, 6, 5);
        for (i = 0; i < 14; i++) {
            placeMesh(treeTrunkGeo, 0x5C3A1E, -8, 2.5, -260 + i * 40);
            placeMesh(treeTopGeo, 0x2D5A1B, -8, 7.5, -260 + i * 40);
        }

        // Trees — right promenade row
        for (i = 0; i < 14; i++) {
            placeMesh(treeTrunkGeo, 0x5C3A1E, 8, 2.5, -260 + i * 40);
            placeMesh(treeTopGeo, 0x2D5A1B, 8, 7.5, -260 + i * 40);
        }

        // Flower beds — left side (box approximation)
        var flowerBedGeo = new THREE.BoxGeometry(4, 0.5, 8);
        for (i = 0; i < 7; i++) {
            placeMesh(flowerBedGeo, 0xCC4466, -12, 0.25, -230 + i * 80);
            placeMesh(flowerBedGeo, 0xEE8833, 12, 0.25, -190 + i * 80);
        }

        // Street lamp poles left
        var lampPoleGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 5);
        var lampHeadGeo = new THREE.SphereGeometry(0.5, 5, 4);
        for (i = 0; i < 8; i++) {
            placeMesh(lampPoleGeo, 0x888888, -16, 4, -250 + i * 70);
            placeMesh(lampHeadGeo, 0xFFFFCC, -16, 8.5, -250 + i * 70);
        }

        // Street lamp poles right
        for (i = 0; i < 8; i++) {
            placeMesh(lampPoleGeo, 0x888888, 16, 4, -250 + i * 70);
            placeMesh(lampHeadGeo, 0xFFFFCC, 16, 8.5, -250 + i * 70);
        }

        // Pavement left
        var pavGeo = new THREE.BoxGeometry(12, 0.3, 1200);
        placeMesh(pavGeo, 0xB8B0A0, -22, 0.15, 0);

        // Pavement right
        placeMesh(pavGeo, 0xB8B0A0, 22, 0.15, 0);
    }

    function buildSomoniMonument() {
        // Central square base platform
        var squareGeo = new THREE.BoxGeometry(80, 1, 80);
        placeMesh(squareGeo, 0xD0C8C0, 0, 0.5, -350);

        // White marble arch / portico — back wall
        var archBackGeo = new THREE.BoxGeometry(36, 28, 3);
        placeMesh(archBackGeo, 0xF5F2EE, 0, 14, -378);

        // Arch left pillar
        var pillarGeo = new THREE.BoxGeometry(5, 28, 3);
        placeMesh(pillarGeo, 0xEEEBE5, -15.5, 14, -378);

        // Arch right pillar
        placeMesh(pillarGeo, 0xEEEBE5, 15.5, 14, -378);

        // Arch top span
        var archTopGeo = new THREE.BoxGeometry(36, 5, 3);
        placeMesh(archTopGeo, 0xEEEBE5, 0, 29.5, -378);

        // Arch center opening (dark recess)
        var archOpenGeo = new THREE.BoxGeometry(22, 20, 0.5);
        placeMesh(archOpenGeo, 0x222222, 0, 12, -376.5);

        // Statue pedestal — tall white column
        var pedestalGeo = new THREE.BoxGeometry(6, 12, 6);
        placeMesh(pedestalGeo, 0xF0EDE8, 0, 6, -358);

        // Statue body — Ismoil Somoni golden figure
        var statueBodyGeo = new THREE.CylinderGeometry(1.0, 1.2, 6, 7);
        placeMesh(statueBodyGeo, 0xD4A840, 0, 15, -358);

        // Statue head
        var statueHeadGeo = new THREE.SphereGeometry(0.9, 7, 6);
        placeMesh(statueHeadGeo, 0xD4A840, 0, 18.8, -358);

        // Statue crown / headdress
        var statueHatGeo = new THREE.CylinderGeometry(0.5, 0.9, 1.2, 6);
        placeMesh(statueHatGeo, 0xC89A30, 0, 19.8, -358);

        // Statue raised arm
        var armGeo = new THREE.BoxGeometry(0.5, 3.5, 0.5);
        var armMesh = makeMesh(armGeo, 0xD4A840);
        armMesh.position.set(OX + 1.2, OY + 16.5, OZ - 358);
        armMesh.rotation.z = -0.6;
        addMesh(armMesh);

        // Square decorative columns left
        var decColGeo = new THREE.CylinderGeometry(0.7, 0.8, 10, 6);
        placeMesh(decColGeo, 0xD8D4CE, -20, 5, -360);
        placeMesh(decColGeo, 0xD8D4CE, -28, 5, -360);
        placeMesh(decColGeo, 0xD8D4CE, 20, 5, -360);
        placeMesh(decColGeo, 0xD8D4CE, 28, 5, -360);

        // Square fountain bowl
        var fountainBowlGeo = new THREE.CylinderGeometry(8, 9, 1.5, 8);
        placeMesh(fountainBowlGeo, 0x9AACB8, 0, 0.75, -340);

        // Fountain water jet approximation
        var fountainJetGeo = new THREE.CylinderGeometry(0.3, 0.8, 5, 5);
        placeMesh(fountainJetGeo, 0x88BBDD, 0, 3.5, -340);

        // Square benches
        var benchGeo = new THREE.BoxGeometry(6, 0.8, 1.5);
        placeMesh(benchGeo, 0xA09080, -18, 0.4, -330);
        placeMesh(benchGeo, 0xA09080, 18, 0.4, -330);
        placeMesh(benchGeo, 0xA09080, -18, 0.4, -368);
        placeMesh(benchGeo, 0xA09080, 18, 0.4, -368);
    }

    function buildFlagpole() {
        // World's tallest flagpole — 165m steel pole (scaled for scene)
        var poleGeo = new THREE.CylinderGeometry(0.6, 1.2, 165, 7);
        placeMesh(poleGeo, 0xCCCCCC, 120, 82.5, -300);

        // Flagpole base platform
        var basePlatGeo = new THREE.CylinderGeometry(8, 10, 3, 8);
        placeMesh(basePlatGeo, 0xBBBBBB, 120, 1.5, -300);

        // Tajikistan flag — green stripe
        var flagGreenGeo = new THREE.BoxGeometry(30, 5, 0.3);
        placeMesh(flagGreenGeo, 0x009A44, 135, 160, -300);

        // Flag white stripe
        var flagWhiteGeo = new THREE.BoxGeometry(30, 4, 0.3);
        placeMesh(flagWhiteGeo, 0xFFFFFF, 135, 155, -300);

        // Flag red stripe
        var flagRedGeo = new THREE.BoxGeometry(30, 5, 0.3);
        placeMesh(flagRedGeo, 0xCC0000, 135, 150, -300);

        // Flag emblem (simplified golden crown)
        var emblemGeo = new THREE.SphereGeometry(1.5, 5, 4);
        placeMesh(emblemGeo, 0xFFCC00, 125, 155, -299.5);
    }

    function buildNationalMuseum() {
        // National Museum of Tajikistan — large Soviet structure
        var museumBodyGeo = new THREE.BoxGeometry(90, 22, 50);
        placeMesh(museumBodyGeo, 0xD4C8B0, -160, 11, -320);

        // Museum upper storey setback
        var museumUpperGeo = new THREE.BoxGeometry(70, 10, 45);
        placeMesh(museumUpperGeo, 0xCCC0A0, -160, 27, -320);

        // Museum front columns
        var mColGeo = new THREE.CylinderGeometry(1.2, 1.4, 18, 7);
        var i;
        for (i = 0; i < 6; i++) {
            placeMesh(mColGeo, 0xDED2B8, -185 + i * 9, 9, -295);
        }

        // Museum front steps
        var mStepGeo = new THREE.BoxGeometry(60, 1.5, 5);
        placeMesh(mStepGeo, 0xC8BCAA, -160, 0.75, -293);
        placeMesh(mStepGeo, 0xC0B4A2, -160, 2.25, -292);
        placeMesh(mStepGeo, 0xB8AC9A, -160, 3.75, -291);

        // Museum roof pediment
        var pedGeo = new THREE.BoxGeometry(90, 4, 6);
        placeMesh(pedGeo, 0xCEC2AE, -160, 23, -294);

        // Museum dome feature
        var mDomeGeo = new THREE.SphereGeometry(8, 8, 6);
        placeMesh(mDomeGeo, 0xCEC2AE, -160, 35, -320);
    }

    function buildOperaHouse() {
        // Aini Opera and Ballet Theatre — neoclassical
        var operaBodyGeo = new THREE.BoxGeometry(70, 20, 45);
        placeMesh(operaBodyGeo, 0xD4C8A0, 160, 10, -320);

        // Opera upper pavilion
        var operaUpperGeo = new THREE.BoxGeometry(50, 8, 40);
        placeMesh(operaUpperGeo, 0xCCC09A, 160, 24, -320);

        // Opera neoclassical columns
        var oColGeo = new THREE.CylinderGeometry(1.0, 1.2, 16, 7);
        var i;
        for (i = 0; i < 7; i++) {
            placeMesh(oColGeo, 0xDDD0A8, 130 + i * 8, 8, -298);
        }

        // Opera central dome
        var oDomeGeo = new THREE.SphereGeometry(10, 8, 6);
        placeMesh(oDomeGeo, 0xC8BC98, 160, 33, -320);

        // Opera front steps
        var oStepGeo = new THREE.BoxGeometry(50, 1.2, 5);
        placeMesh(oStepGeo, 0xC8BCA0, 160, 0.6, -295);
        placeMesh(oStepGeo, 0xC0B498, 160, 1.8, -294);

        // Opera park trees left
        var tGeo = new THREE.SphereGeometry(3.5, 6, 5);
        var tTrunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 5, 5);
        for (i = 0; i < 4; i++) {
            placeMesh(tTrunkGeo, 0x5C3A1E, 120 + i * 14, 2.5, -270);
            placeMesh(tGeo, 0x2A5A18, 120 + i * 14, 7, -270);
        }

        // Soviet ornament band on facade
        var ornBandGeo = new THREE.BoxGeometry(70, 1.5, 1);
        placeMesh(ornBandGeo, 0xBBAA88, 160, 19, -298);
    }

    function buildMosque() {
        // Haji Yaqub Mosque — Friday mosque
        var mosqueBodyGeo = new THREE.BoxGeometry(50, 16, 45);
        placeMesh(mosqueBodyGeo, 0xD4C890, 0, 8, 200);

        // Blue ribbed main dome
        var mainDomeGeo = new THREE.SphereGeometry(12, 8, 7);
        placeMesh(mainDomeGeo, 0x3355AA, 0, 22, 190);

        // Dome drum base
        var drumGeo = new THREE.CylinderGeometry(10, 11, 5, 8);
        placeMesh(drumGeo, 0xD4C890, 0, 17, 190);

        // Minaret left — tall cylinder
        var minBodyGeo = new THREE.CylinderGeometry(1.8, 2.2, 40, 8);
        placeMesh(minBodyGeo, 0xD4C890, -28, 20, 190);

        // Minaret right
        placeMesh(minBodyGeo, 0xD4C890, 28, 20, 190);

        // Minaret caps left
        var minCapGeo = new THREE.ConeGeometry(2.5, 5, 8);
        placeMesh(minCapGeo, 0x3355AA, -28, 42.5, 190);
        placeMesh(minCapGeo, 0x3355AA, 28, 42.5, 190);

        // Minaret balconies
        var balGeo = new THREE.CylinderGeometry(3, 2.5, 1.2, 8);
        placeMesh(balGeo, 0xC8BC84, -28, 32, 190);
        placeMesh(balGeo, 0xC8BC84, 28, 32, 190);

        // Courtyard
        var courtyardGeo = new THREE.BoxGeometry(80, 0.4, 30);
        placeMesh(courtyardGeo, 0xE0D8C8, 0, 0.2, 230);

        // Courtyard fountain
        var cFountainGeo = new THREE.CylinderGeometry(5, 6, 1, 8);
        placeMesh(cFountainGeo, 0x88AABB, 0, 0.5, 240);

        // Courtyard ablution arches — side structures
        var archSideGeo = new THREE.BoxGeometry(12, 8, 4);
        placeMesh(archSideGeo, 0xD0C488, -32, 4, 230);
        placeMesh(archSideGeo, 0xD0C488, 32, 4, 230);

        // Mosque entrance portal arch
        var portalGeo = new THREE.BoxGeometry(16, 14, 2);
        placeMesh(portalGeo, 0xC8BC84, 0, 7, 176);
        var portalOpenGeo = new THREE.BoxGeometry(8, 10, 1);
        placeMesh(portalOpenGeo, 0x111111, 0, 6, 175.5);
    }

    function buildVarzobGorge() {
        // Gorge north of city — canyon walls
        var wallLeftGeo = new THREE.BoxGeometry(30, 80, 500);
        placeMesh(wallLeftGeo, 0x6A6050, -120, 40, 400);

        var wallRightGeo = new THREE.BoxGeometry(30, 80, 500);
        placeMesh(wallRightGeo, 0x6A6050, 120, 40, 400);

        // Gorge floor / river bed
        var gorgeFloorGeo = new THREE.BoxGeometry(60, 4, 500);
        placeMesh(gorgeFloorGeo, 0x808870, 0, -2, 400);

        // River water
        var riverGeo = new THREE.BoxGeometry(20, 0.8, 500);
        placeMesh(riverGeo, 0x2A5A8A, 0, 0.4, 400);

        // Forest on left canyon wall — tree clusters
        var fTreeGeo = new THREE.ConeGeometry(4, 12, 5);
        var fTrunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 5, 5);
        var i;
        for (i = 0; i < 8; i++) {
            placeMesh(fTrunkGeo, 0x4A2E10, -105 + (i % 3) * 5, 42.5, 300 + i * 30);
            placeMesh(fTreeGeo, 0x2A5A20, -105 + (i % 3) * 5, 51, 300 + i * 30);
        }

        // Forest on right canyon wall
        for (i = 0; i < 8; i++) {
            placeMesh(fTrunkGeo, 0x4A2E10, 105 + (i % 3) * 5, 42.5, 310 + i * 30);
            placeMesh(fTreeGeo, 0x2A5A20, 105 + (i % 3) * 5, 51, 310 + i * 30);
        }

        // Gorge rock formations
        var rock1Geo = new THREE.BoxGeometry(15, 20, 18);
        placeMesh(rock1Geo, 0x7A7060, -80, 10, 350);
        var rock2Geo = new THREE.BoxGeometry(12, 15, 14);
        placeMesh(rock2Geo, 0x7A7060, 85, 7.5, 420);
    }

    function buildPamirMountains() {
        // Pamir Mountains backdrop — Roof of the World
        // Communism Peak 7495m — tallest, central
        var communismPeakGeo = new THREE.ConeGeometry(130, 340, 6);
        placeMesh(communismPeakGeo, 0x8899CC, 0, 170, 900);

        // Snow cap on Communism Peak
        var commSnowGeo = new THREE.ConeGeometry(55, 100, 6);
        placeMesh(commSnowGeo, 0xEEEEFF, 0, 320, 900);

        // Peak 2 — left
        var peak2Geo = new THREE.ConeGeometry(100, 260, 6);
        placeMesh(peak2Geo, 0x7788BB, -280, 130, 870);
        var snow2Geo = new THREE.ConeGeometry(40, 80, 6);
        placeMesh(snow2Geo, 0xEEEEFF, -280, 250, 870);

        // Peak 3 — far left
        var peak3Geo = new THREE.ConeGeometry(90, 220, 5);
        placeMesh(peak3Geo, 0x8899CC, -500, 110, 950);
        var snow3Geo = new THREE.ConeGeometry(35, 65, 5);
        placeMesh(snow3Geo, 0xEEEEFF, -500, 215, 950);

        // Peak 4 — right
        var peak4Geo = new THREE.ConeGeometry(110, 280, 6);
        placeMesh(peak4Geo, 0x8899CC, 300, 140, 880);
        var snow4Geo = new THREE.ConeGeometry(45, 85, 6);
        placeMesh(snow4Geo, 0xEEEEFF, 300, 265, 880);

        // Peak 5 — far right
        var peak5Geo = new THREE.ConeGeometry(85, 200, 5);
        placeMesh(peak5Geo, 0x7788BB, 520, 100, 960);
        var snow5Geo = new THREE.ConeGeometry(32, 60, 5);
        placeMesh(snow5Geo, 0xEEEEFF, 520, 200, 960);

        // Foothills — rolling lower ridges
        var foothill1Geo = new THREE.ConeGeometry(180, 70, 5);
        placeMesh(foothill1Geo, 0x6A7A50, -150, 35, 700);

        var foothill2Geo = new THREE.ConeGeometry(160, 60, 5);
        placeMesh(foothill2Geo, 0x6A7A50, 200, 30, 720);

        var foothill3Geo = new THREE.ConeGeometry(200, 80, 5);
        placeMesh(foothill3Geo, 0x7A8A60, 0, 40, 680);

        // Glacier approximation — white elongated boxes on peak flanks
        var glacier1Geo = new THREE.BoxGeometry(20, 6, 80);
        placeMesh(glacier1Geo, 0xDDEEFF, -30, 200, 855);

        var glacier2Geo = new THREE.BoxGeometry(18, 6, 70);
        placeMesh(glacier2Geo, 0xDDEEFF, 40, 195, 860);

        // Glacial moraine ridge
        var moraineGeo = new THREE.BoxGeometry(80, 10, 20);
        placeMesh(moraineGeo, 0x9A9080, 0, 5, 650);
    }

    function buildKomsomolLake() {
        // Komsomol Lake — artificial park lake
        var lakeGeo = new THREE.BoxGeometry(120, 0.6, 80);
        placeMesh(lakeGeo, 0x2A6A9A, 200, 0.3, 80);

        // Lake shore / bank
        var bankGeo = new THREE.BoxGeometry(130, 1.5, 90);
        placeMesh(bankGeo, 0x88A870, 200, -0.75, 80);

        // Rowing boats on lake (3 boats)
        var boatHullGeo = new THREE.BoxGeometry(4, 1, 2.5);
        placeMesh(boatHullGeo, 0xCC4422, 190, 1.1, 75);
        placeMesh(boatHullGeo, 0x2244CC, 200, 1.1, 88);
        placeMesh(boatHullGeo, 0xCCAA22, 212, 1.1, 70);

        // Lake cafe building
        var cafeGeo = new THREE.BoxGeometry(16, 6, 10);
        placeMesh(cafeGeo, 0xE0D4B8, 250, 3, 75);

        // Cafe roof
        var cafeRoofGeo = new THREE.BoxGeometry(18, 1.5, 12);
        placeMesh(cafeRoofGeo, 0xCC6633, 250, 6.75, 75);

        // Cafe awning
        var awningGeo = new THREE.BoxGeometry(18, 0.4, 5);
        placeMesh(awningGeo, 0xCC6633, 250, 4.2, 67);

        // Park path around lake
        var pathGeo = new THREE.BoxGeometry(6, 0.3, 110);
        placeMesh(pathGeo, 0xC8C0A8, 155, 0.15, 80);
        placeMesh(pathGeo, 0xC8C0A8, 245, 0.15, 80);

        // Lake park trees
        var lTreeGeo = new THREE.SphereGeometry(3, 6, 5);
        var lTrunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 5, 5);
        var i;
        for (i = 0; i < 5; i++) {
            placeMesh(lTrunkGeo, 0x5C3A1E, 160 + i * 20, 2.5, 50);
            placeMesh(lTreeGeo, 0x336622, 160 + i * 20, 7, 50);
        }
    }

    function buildBazaar() {
        // Bahor Bazaar — colourful market
        // Main covered hall
        var bazaarMainGeo = new THREE.BoxGeometry(80, 12, 60);
        placeMesh(bazaarMainGeo, 0xCC8833, -200, 6, 80);

        // Bazaar roof arches (evenly spaced barrel approximations)
        var roofArchGeo = new THREE.CylinderGeometry(8, 8, 80, 6);
        var roofArch = makeMesh(roofArchGeo, 0xBB7722);
        roofArch.position.set(OX - 200, OY + 14, OZ + 80);
        roofArch.rotation.z = Math.PI / 2;
        addMesh(roofArch);

        // Bazaar entrance gate
        var gateGeo = new THREE.BoxGeometry(14, 12, 3);
        placeMesh(gateGeo, 0xDD9944, -200, 6, 51);
        var gateOpenGeo = new THREE.BoxGeometry(8, 8, 2);
        placeMesh(gateOpenGeo, 0x222222, -200, 5, 50.5);

        // Market stall awnings — colourful
        var stall1Geo = new THREE.BoxGeometry(10, 0.4, 6);
        var stall2Geo = new THREE.BoxGeometry(10, 5, 4);
        var stallColors = [0xCC3333, 0x3388CC, 0x33AA44, 0xEECC22, 0xCC44AA, 0xFF6600];
        var i;
        for (i = 0; i < 6; i++) {
            placeMesh(stall2Geo, 0xC89060, -225 + i * 12, 2.5, 55);
            placeMesh(stall1Geo, stallColors[i], -225 + i * 12, 5.2, 55);
        }

        // Dried fruits / nuts display boxes (stall goods)
        var goodsGeo = new THREE.BoxGeometry(2, 1.5, 2);
        var goodsColors = [0x8B4513, 0xD4A020, 0x8B2020, 0xE8C050, 0x7A4010];
        for (i = 0; i < 5; i++) {
            placeMesh(goodsGeo, goodsColors[i], -225 + i * 12, 1, 52);
        }

        // Spice cone displays
        var spiceConeGeo = new THREE.ConeGeometry(0.7, 2, 6);
        var spiceColors = [0xCC4400, 0xFFAA00, 0xCC8800, 0xAA2200, 0xDDCC00];
        for (i = 0; i < 5; i++) {
            placeMesh(spiceConeGeo, spiceColors[i], -222 + i * 12, 1.5, 54);
        }

        // Pottery display stand
        var potStandGeo = new THREE.BoxGeometry(6, 3, 3);
        placeMesh(potStandGeo, 0xAA7744, -200, 1.5, 55);

        // Pottery bowls (sphere approximations)
        var potGeo = new THREE.SphereGeometry(0.8, 6, 5);
        placeMesh(potGeo, 0xCC4422, -202, 3.8, 55);
        placeMesh(potGeo, 0x2244AA, -200, 3.8, 55);
        placeMesh(potGeo, 0x228833, -198, 3.8, 55);

        // Bazaar perimeter wall
        var bazWallGeo = new THREE.BoxGeometry(82, 3, 2);
        placeMesh(bazWallGeo, 0xBB7733, -200, 1.5, 111);
        var bazWallSideGeo = new THREE.BoxGeometry(2, 3, 62);
        placeMesh(bazWallSideGeo, 0xBB7733, -241, 1.5, 80);
        placeMesh(bazWallSideGeo, 0xBB7733, -159, 1.5, 80);
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
