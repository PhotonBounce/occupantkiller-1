window.WhitehavenHarbour = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 22320;
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
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function build() {
        buildSeaFloor();
        buildIrishSea();
        buildHarbourWalls();
        buildHarbourWater();
        buildGeorgianTown();
        buildRumStory();
        buildStJamesChurch();
        buildBeaconMuseum();
        buildHaigColliery();
        buildSellafield();
        buildCoastalHills();
        buildLakelandFells();
        buildHarbourFeatures();
        buildBoatsAndDocks();
        buildStreetFurniture();
        buildSky();
    }

    function buildSeaFloor() {
        // Ground plane using flat boxes
        var ground = makeBox(2000, 2, 2000, 0x6B8E5A, CX, CY - 1, CZ);
        addMesh(ground);

        // Coastal cliff edge
        var cliff = makeBox(600, 40, 30, 0x8B7355, CX - 200, CY + 20, CZ - 280);
        addMesh(cliff);

        var cliff2 = makeBox(400, 35, 25, 0x7A6845, CX + 250, CY + 17, CZ - 270);
        addMesh(cliff2);
    }

    function buildIrishSea() {
        // Main sea surface — split into several large flat boxes to cover west horizon
        var sea1 = makeBox(1200, 2, 800, 0x006994, CX - 700, CY + 0.5, CZ);
        addMesh(sea1);

        var sea2 = makeBox(800, 2, 400, CX - 1100, CY + 0.5, CZ - 200);
        addMesh(sea2);
        // sea2 color fix — rebuild properly
        scene.remove(sea2);
        objects.pop();
        sea2 = makeBox(800, 2, 400, 0x006994, CX - 1100, CY + 0.5, CZ - 200);
        addMesh(sea2);

        var sea3 = makeBox(600, 2, 500, 0x006994, CX - 900, CY + 0.5, CZ + 250);
        addMesh(sea3);

        // Distant sea — darker, more grey for Irish Sea atmosphere
        var seaFar = makeBox(2000, 2, 600, 0x4A7090, CX - 1400, CY + 1, CZ);
        addMesh(seaFar);

        // Wave crests as thin white boxes
        var wave1 = makeBox(120, 1.5, 8, 0xC8D8E8, CX - 600, CY + 1.5, CZ - 80);
        addMesh(wave1);

        var wave2 = makeBox(90, 1.5, 8, 0xC8D8E8, CX - 750, CY + 1.5, CZ + 60);
        addMesh(wave2);

        var wave3 = makeBox(140, 1.5, 8, 0xC8D8E8, CX - 850, CY + 1.5, CZ - 30);
        addMesh(wave3);
    }

    function buildHarbourWalls() {
        // Whitehaven has distinctive Georgian stone harbour walls
        // North Pier
        var northPier = makeBox(300, 8, 18, 0x8B7355, CX - 180, CY + 4, CZ - 160);
        addMesh(northPier);

        // North pier parapet
        var northParapet = makeBox(300, 3, 3, 0x7A6340, CX - 180, CY + 9.5, CZ - 152);
        addMesh(northParapet);

        // South Pier
        var southPier = makeBox(260, 8, 18, 0x8B7355, CX - 160, CY + 4, CZ + 150);
        addMesh(southPier);

        var southParapet = makeBox(260, 3, 3, 0x7A6340, CX - 160, CY + 9.5, CZ + 141);
        addMesh(southParapet);

        // West pier head / lighthouse base
        var pierHead = makeBox(30, 10, 30, 0x9A8870, CX - 340, CY + 5, CZ - 160);
        addMesh(pierHead);

        // Lighthouse on pier head
        var lighthouse = makeCyl(3, 4, 30, 8, 0xF5F0E8, CX - 340, CY + 20, CZ - 160);
        addMesh(lighthouse);

        var lighthouseTop = makeCone(5, 8, 8, 0xCC3333, CX - 340, CY + 39, CZ - 160);
        addMesh(lighthouseTop);

        var lighthouseLight = makeSphere(2.5, 8, 8, 0xFFFF99, CX - 340, CY + 36, CZ - 160);
        addMesh(lighthouseLight);

        // Inner harbour wall connecting structures
        var innerWallN = makeBox(120, 6, 8, 0x8B7355, CX - 60, CY + 3, CZ - 165);
        addMesh(innerWallN);

        var innerWallS = makeBox(120, 6, 8, 0x8B7355, CX - 60, CY + 3, CZ + 155);
        addMesh(innerWallS);

        // Quayside stone edge — harbourside walkway
        var quayside = makeBox(280, 4, 20, 0x9A8870, CX - 50, CY + 2, CZ);
        addMesh(quayside);
    }

    function buildHarbourWater() {
        // Inner harbour basin — calmer, darker water
        var basin = makeBox(280, 1, 280, 0x4682B4, CX - 120, CY + 0.8, CZ);
        addMesh(basin);

        // Mud flats at low tide edge
        var mudFlat = makeBox(80, 1, 80, 0x8B7345, CX - 320, CY + 0.6, CZ + 80);
        addMesh(mudFlat);
    }

    function buildGeorgianTown() {
        // Whitehaven was laid out in 1640s grid — one of Britain's first planned towns
        // Georgian townhouses — systematic grid like Edinburgh New Town but earlier
        var houseColor = 0xD4C8A0;
        var roofColor = 0x7A5C3A;
        var windowColor = 0x8899AA;

        // Lowther Street row (main street)
        var i;
        for (i = 0; i < 6; i++) {
            var hx = CX + 20 + (i * 32);
            var house = makeBox(26, 28, 18, houseColor, hx, CY + 14, CZ - 60);
            addMesh(house);
            var roof = makeBox(28, 8, 20, roofColor, hx, CY + 32, CZ - 60);
            addMesh(roof);
        }

        // Marlborough Street row
        for (i = 0; i < 5; i++) {
            var hx2 = CX + 30 + (i * 32);
            var house2 = makeBox(26, 24, 16, houseColor, hx2, CY + 12, CZ + 60);
            addMesh(house2);
            var roof2 = makeBox(28, 7, 18, roofColor, hx2, CY + 27, CZ + 60);
            addMesh(roof2);
        }

        // King Street terrace — taller 3-storey Georgian
        for (i = 0; i < 4; i++) {
            var hx3 = CX + 80 + (i * 36);
            var townhouse = makeBox(30, 36, 20, houseColor, hx3, CY + 18, CZ);
            addMesh(townhouse);
            var townRoof = makeBox(32, 10, 22, roofColor, hx3, CY + 41, CZ);
            addMesh(townRoof);
        }

        // Church Street buildings
        var churchStreetBuilding = makeBox(80, 22, 16, houseColor, CX + 200, CY + 11, CZ - 100);
        addMesh(churchStreetBuilding);

        // Market Place — open square with surrounding buildings
        var marketBuilding1 = makeBox(50, 30, 18, 0xC8BC98, CX + 120, CY + 15, CZ - 160);
        addMesh(marketBuilding1);

        var marketBuilding2 = makeBox(40, 26, 16, 0xD4C8A0, CX + 180, CY + 13, CZ - 165);
        addMesh(marketBuilding2);

        // Back streets — slightly smaller workers' cottages
        var cottage1 = makeBox(20, 16, 14, 0xC0B490, CX + 320, CY + 8, CZ - 40);
        addMesh(cottage1);

        var cottage2 = makeBox(20, 16, 14, 0xC0B490, CX + 345, CY + 8, CZ - 40);
        addMesh(cottage2);

        var cottage3 = makeBox(20, 16, 14, 0xC0B490, CX + 320, CY + 8, CZ + 40);
        addMesh(cottage3);

        // The old Custom House
        var customHouse = makeBox(45, 32, 25, 0xD4C8A0, CX + 60, CY + 16, CZ - 120);
        addMesh(customHouse);
        var customPortico = makeBox(20, 28, 10, 0xDDD0B0, CX + 60, CY + 14, CZ - 132);
        addMesh(customPortico);
    }

    function buildRumStory() {
        // Jefferson's warehouse — The Rum Story museum on Lowther Street
        // Large Georgian brick warehouse complex
        var mainWarehouse = makeBox(70, 30, 50, 0xC8B89A, CX + 40, CY + 15, CZ - 220);
        addMesh(mainWarehouse);

        // Loading bay doors (darker recesses represented as inset boxes)
        var loadingBay = makeBox(14, 18, 4, 0x7A6040, CX + 20, CY + 9, CZ - 244);
        addMesh(loadingBay);

        var loadingBay2 = makeBox(14, 18, 4, 0x7A6040, CX + 50, CY + 9, CZ - 244);
        addMesh(loadingBay2);

        // Warehouse roof — low pitched
        var warehouseRoof = makeBox(72, 6, 52, 0x5A4530, CX + 40, CY + 33, CZ - 220);
        addMesh(warehouseRoof);

        // Courtyard wing
        var warehouseWing = makeBox(30, 24, 35, 0xC0AE90, CX + 90, CY + 12, CZ - 215);
        addMesh(warehouseWing);

        // Rum barrel storage sign representation — small square detail
        var signBoard = makeBox(10, 5, 1, 0x8B4513, CX + 40, CY + 26, CZ - 245);
        addMesh(signBoard);
    }

    function buildStJamesChurch() {
        // St James' Church — fine Georgian interior, 1752
        var churchBody = makeBox(40, 26, 70, 0xD4C8A0, CX + 280, CY + 13, CZ - 180);
        addMesh(churchBody);

        // Chancel / apse end
        var chancel = makeBox(28, 22, 20, 0xCCBE98, CX + 280, CY + 11, CZ - 240);
        addMesh(chancel);

        // Tower — square Georgian
        var tower = makeBox(16, 60, 16, 0xD4C8A0, CX + 280, CY + 30, CZ - 145);
        addMesh(tower);

        // Tower upper stage
        var towerUpper = makeBox(14, 20, 14, 0xCCBE98, CX + 280, CY + 70, CZ - 145);
        addMesh(towerUpper);

        // Tower pinnacles
        var pinnacle1 = makeCone(2, 10, 4, 0xB8AC88, CX + 274, CY + 88, CZ - 139);
        addMesh(pinnacle1);

        var pinnacle2 = makeCone(2, 10, 4, 0xB8AC88, CX + 286, CY + 88, CZ - 139);
        addMesh(pinnacle2);

        var pinnacle3 = makeCone(2, 10, 4, 0xB8AC88, CX + 274, CY + 88, CZ - 151);
        addMesh(pinnacle3);

        var pinnacle4 = makeCone(2, 10, 4, 0xB8AC88, CX + 286, CY + 88, CZ - 151);
        addMesh(pinnacle4);

        // Church roof — pitched
        var churchRoof = makeBox(42, 12, 72, 0x6A5840, CX + 280, CY + 38, CZ - 180);
        addMesh(churchRoof);
    }

    function buildBeaconMuseum() {
        // The Beacon — modern glass-fronted museum on harbourside, opened 1996
        var beaconBase = makeBox(35, 8, 35, 0xB0B0B0, CX - 30, CY + 4, CZ - 220);
        addMesh(beaconBase);

        // Main tower body — glass and concrete modern
        var beaconTower = makeBox(25, 50, 25, 0xD3D3D3, CX - 30, CY + 33, CZ - 220);
        addMesh(beaconTower);

        // Glass facing panels (slightly blue-tinted)
        var glassFacing = makeBox(23, 46, 3, 0xA8C8D8, CX - 30, CY + 31, CZ - 232);
        addMesh(glassFacing);

        // Viewing platform level
        var viewingPlatform = makeBox(32, 4, 32, 0xC0C0C0, CX - 30, CY + 59, CZ - 220);
        addMesh(viewingPlatform);

        // Beacon lamp structure on top
        var beaconMast = makeCyl(1, 1, 20, 6, 0x888888, CX - 30, CY + 71, CZ - 220);
        addMesh(beaconMast);

        var beaconLight = makeSphere(3, 8, 8, 0xFFDD44, CX - 30, CY + 82, CZ - 220);
        addMesh(beaconLight);
    }

    function buildHaigColliery() {
        // Haig Colliery Mining Museum — on cliff tops above town
        // Headgear (pit head winding gear) — distinctive industrial silhouette
        var headgearLegA = makeBox(4, 60, 4, 0x666666, CX - 60, CY + 30, CZ + 220);
        addMesh(headgearLegA);

        var headgearLegB = makeBox(4, 60, 4, 0x666666, CX - 40, CY + 30, CZ + 220);
        addMesh(headgearLegB);

        var headgearLegC = makeBox(4, 60, 4, 0x666666, CX - 60, CY + 30, CZ + 240);
        addMesh(headgearLegC);

        var headgearLegD = makeBox(4, 60, 4, 0x666666, CX - 40, CY + 30, CZ + 240);
        addMesh(headgearLegD);

        // Cross beam at top
        var headgearBeamH = makeBox(28, 4, 4, 0x555555, CX - 50, CY + 62, CZ + 230);
        addMesh(headgearBeamH);

        var headgearBeamV = makeBox(4, 4, 28, 0x555555, CX - 50, CY + 62, CZ + 230);
        addMesh(headgearBeamV);

        // Winding wheel (cylinder on its side)
        var windingWheel = makeCyl(6, 6, 3, 12, 0x888888, CX - 50, CY + 64, CZ + 230);
        windingWheel.rotation.z = Math.PI / 2;
        addMesh(windingWheel);

        // Engine house building
        var engineHouse = makeBox(30, 20, 25, 0x888888, CX - 80, CY + 10, CZ + 230);
        addMesh(engineHouse);

        var engineRoof = makeBox(32, 6, 27, 0x555555, CX - 80, CY + 23, CZ + 230);
        addMesh(engineRoof);

        // Chimney stack
        var collieryChimney = makeCyl(2.5, 3, 35, 8, 0x777777, CX - 95, CY + 17, CZ + 220);
        addMesh(collieryChimney);

        // Cliff below colliery
        var collieryCliff = makeBox(120, 50, 30, 0x7A6845, CX - 50, CY + 25, CZ + 290);
        addMesh(collieryCliff);
    }

    function buildSellafield() {
        // Sellafield Nuclear Reprocessing Plant — huge complex visible south of Whitehaven
        // One of largest nuclear sites in Europe — massive concrete blocks
        var sellafieldBase = makeBox(600, 10, 300, 0x999999, CX + 100, CY + 5, CZ + 500);
        addMesh(sellafieldBase);

        // Main reactor/reprocessing buildings — huge concrete blocks
        var block1 = makeBox(80, 60, 60, 0xAAAAAA, CX + 0, CY + 30, CZ + 520);
        addMesh(block1);

        var block2 = makeBox(100, 70, 80, 0xA0A0A0, CX + 100, CY + 35, CZ + 510);
        addMesh(block2);

        var block3 = makeBox(90, 55, 70, 0xB0B0B0, CX + 220, CY + 27, CZ + 530);
        addMesh(block3);

        var block4 = makeBox(70, 65, 60, 0x989898, CX + 320, CY + 32, CZ + 515);
        addMesh(block4);

        // THORP reprocessing building — very large
        var thorp = makeBox(150, 80, 120, 0x9A9A9A, CX + 150, CY + 40, CZ + 600);
        addMesh(thorp);

        // Cooling towers (not classic hyperboloid — use cylinders, allowed geometry)
        var coolingTower1 = makeCyl(18, 22, 90, 8, 0xC0BDBA, CX - 50, CY + 45, CZ + 560);
        addMesh(coolingTower1);

        var coolingTower2 = makeCyl(18, 22, 90, 8, 0xC0BDBA, CX + 10, CY + 45, CZ + 570);
        addMesh(coolingTower2);

        // Steam plumes from cooling towers
        var steam1 = makeSphere(12, 6, 6, 0xF0EEF0, CX - 50, CY + 100, CZ + 555);
        addMesh(steam1);

        var steam2 = makeSphere(10, 6, 6, 0xEEECF0, CX + 10, CY + 105, CZ + 568);
        addMesh(steam2);

        // Chimney stacks
        var sellafieldChimney1 = makeCyl(4, 5, 120, 8, 0x888888, CX + 260, CY + 60, CZ + 540);
        addMesh(sellafieldChimney1);

        var sellafieldChimney2 = makeCyl(3.5, 4.5, 100, 8, 0x888888, CX + 350, CY + 50, CZ + 550);
        addMesh(sellafieldChimney2);

        // Security fence represented as low wall
        var fence1 = makeBox(600, 6, 2, 0x778877, CX + 100, CY + 3, CZ + 420);
        addMesh(fence1);
    }

    function buildCoastalHills() {
        // West Cumbrian coastal hills and green fields behind the town
        var hill1 = makeSphere(180, 10, 6, 0x8AB55A, CX + 500, CY - 60, CZ - 100);
        addMesh(hill1);

        var hill2 = makeSphere(220, 10, 6, 0x7DAA4E, CX + 650, CY - 80, CZ + 50);
        addMesh(hill2);

        var hill3 = makeSphere(150, 10, 6, 0x90BF60, CX + 450, CY - 70, CZ + 200);
        addMesh(hill3);

        // Green coastal slopes
        var slope1 = makeBox(300, 20, 200, 0x8AB55A, CX + 380, CY + 8, CZ - 50);
        addMesh(slope1);

        var slope2 = makeBox(250, 15, 150, 0x7DAA4E, CX + 400, CY + 6, CZ + 150);
        addMesh(slope2);
    }

    function buildLakelandFells() {
        // Cumbrian mountains / Lakeland fells visible to east
        var fell1 = makeSphere(280, 8, 5, 0x888888, CX + 900, CY + 60, CZ - 200);
        addMesh(fell1);

        var fell2 = makeSphere(320, 8, 5, 0x7A7A7A, CX + 1100, CY + 100, CZ);
        addMesh(fell2);

        var fell3 = makeSphere(260, 8, 5, 0x909090, CX + 950, CY + 70, CZ + 180);
        addMesh(fell3);

        // Snow caps on higher fells — small white spheres on top
        var snowCap1 = makeSphere(80, 6, 4, 0xF0F0F0, CX + 1100, CY + 185, CZ);
        addMesh(snowCap1);

        var snowCap2 = makeSphere(60, 6, 4, 0xF0F0F0, CX + 900, CY + 145, CZ - 200);
        addMesh(snowCap2);

        // Green foothills connecting to town
        var foothill1 = makeSphere(180, 8, 5, 0x8AB55A, CX + 600, CY + 10, CZ - 250);
        addMesh(foothill1);

        var foothill2 = makeSphere(200, 8, 5, 0x7DAA4E, CX + 700, CY + 20, CZ + 200);
        addMesh(foothill2);
    }

    function buildHarbourFeatures() {
        // Bollards along quayside
        var bollardPositions = [
            [CX - 80, CZ - 155],
            [CX - 120, CZ - 155],
            [CX - 160, CZ - 155],
            [CX - 80, CZ + 145],
            [CX - 120, CZ + 145],
            [CX - 160, CZ + 145]
        ];
        var b;
        for (b = 0; b < bollardPositions.length; b++) {
            var bollard = makeCyl(1.2, 1.5, 5, 6, 0x444444, bollardPositions[b][0], CY + 2.5, bollardPositions[b][1]);
            addMesh(bollard);
        }

        // Capstans — for mooring ropes
        var capstan1 = makeCyl(2, 1.5, 4, 8, 0x5A5A5A, CX - 100, CY + 4, CZ - 160);
        addMesh(capstan1);

        var capstan2 = makeCyl(2, 1.5, 4, 8, 0x5A5A5A, CX - 200, CY + 4, CZ + 150);
        addMesh(capstan2);

        // Harbour master's building
        var harbourMaster = makeBox(20, 14, 16, 0xD4C8A0, CX - 280, CY + 7, CZ - 120);
        addMesh(harbourMaster);

        var hmRoof = makeBox(22, 5, 18, 0x8B6040, CX - 280, CY + 16, CZ - 120);
        addMesh(hmRoof);

        // Fish market shed
        var fishMarket = makeBox(50, 10, 20, 0xA09080, CX - 240, CY + 5, CZ + 80);
        addMesh(fishMarket);

        // Loading crane structure
        var craneBase = makeBox(8, 20, 8, 0x6A6A6A, CX - 180, CY + 10, CZ - 100);
        addMesh(craneBase);

        var craneArm = makeBox(40, 4, 4, 0x6A6A6A, CX - 165, CY + 22, CZ - 100);
        addMesh(craneArm);
    }

    function buildBoatsAndDocks() {
        // Fishing boats in harbour — box hulls with cylinder masts
        // Boat 1
        var hull1 = makeBox(22, 5, 8, 0x4A3A2A, CX - 150, CY + 3.5, CZ - 40);
        addMesh(hull1);

        var mast1 = makeCyl(0.5, 0.5, 20, 5, 0x8B6040, CX - 150, CY + 13, CZ - 40);
        addMesh(mast1);

        var cabin1 = makeBox(8, 4, 7, 0xE8E0D0, CX - 154, CY + 8, CZ - 40);
        addMesh(cabin1);

        // Boat 2
        var hull2 = makeBox(18, 4, 7, 0x3A2A5A, CX - 160, CY + 3, CZ + 30);
        addMesh(hull2);

        var mast2 = makeCyl(0.5, 0.5, 16, 5, 0x6B4020, CX - 160, CY + 11, CZ + 30);
        addMesh(mast2);

        // Boat 3 — larger fishing vessel
        var hull3 = makeBox(28, 6, 10, 0x5A4A3A, CX - 200, CY + 4, CZ - 10);
        addMesh(hull3);

        var mast3 = makeCyl(0.6, 0.6, 25, 5, 0x8B6040, CX - 200, CY + 16.5, CZ - 10);
        addMesh(mast3);

        var cabin3 = makeBox(10, 6, 9, 0xD8D0C0, CX - 205, CY + 10, CZ - 10);
        addMesh(cabin3);

        // Mooring dock — wooden pier
        var dock1 = makeBox(60, 2, 8, 0x8B5A2B, CX - 140, CY + 2.5, CZ - 80);
        addMesh(dock1);

        var dock2 = makeBox(60, 2, 8, 0x8B5A2B, CX - 140, CY + 2.5, CZ + 70);
        addMesh(dock2);
    }

    function buildStreetFurniture() {
        // Georgian street lamps — cylinder post with sphere top
        var lampPositions = [
            [CX + 10, CZ - 50],
            [CX + 50, CZ - 50],
            [CX + 90, CZ - 50],
            [CX + 10, CZ + 50],
            [CX + 50, CZ + 50],
            [CX + 90, CZ + 50],
            [CX - 20, CZ - 200],
            [CX - 60, CZ - 200]
        ];
        var l;
        for (l = 0; l < lampPositions.length; l++) {
            var lampPost = makeCyl(0.4, 0.4, 12, 5, 0x2A2A2A, lampPositions[l][0], CY + 6, lampPositions[l][1]);
            addMesh(lampPost);

            var lampGlobe = makeSphere(1.2, 6, 6, 0xFFEE99, lampPositions[l][0], CY + 13, lampPositions[l][1]);
            addMesh(lampGlobe);
        }

        // Town cross / market cross — stone monument
        var crossBase = makeBox(6, 3, 6, 0xC8C0B0, CX + 120, CY + 1.5, CZ);
        addMesh(crossBase);

        var crossShaft = makeCyl(1, 1.2, 12, 6, 0xB8B0A0, CX + 120, CY + 9, CZ);
        addMesh(crossShaft);

        var crossTop = makeBox(8, 2, 2, 0xB8B0A0, CX + 120, CY + 16, CZ);
        addMesh(crossTop);

        // Road surface — dark boxes for main streets
        var mainRoad = makeBox(200, 1, 12, 0x444444, CX + 100, CY + 0.6, CZ);
        addMesh(mainRoad);

        var crossRoad = makeBox(12, 1, 200, 0x444444, CX + 160, CY + 0.6, CZ);
        addMesh(crossRoad);
    }

    function buildSky() {
        // Overcast West Cumbrian sky — grey cloud mass as large high box
        var cloudLayer = makeBox(3000, 80, 2000, 0xC8C8CC, CX, CY + 600, CZ);
        addMesh(cloudLayer);

        // Darker rain cloud patches
        var rainCloud1 = makeBox(400, 50, 300, 0xA0A0A8, CX - 500, CY + 560, CZ - 100);
        addMesh(rainCloud1);

        var rainCloud2 = makeBox(350, 45, 280, 0x989898, CX + 200, CY + 570, CZ + 200);
        addMesh(rainCloud2);
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
