window.DonegalCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var BASE_X = 18040;
    var BASE_Y = 0;
    var BASE_Z = 0;

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

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function buildCastle() {
        // Main keep - tall brownish-red sandstone tower house
        var keepGeo = new THREE.BoxGeometry(12, 15, 10);
        makeMesh(keepGeo, 0x8B4513, 0, 7.5, 0);

        // Jacobean manor wing attached to keep
        var wingGeo = new THREE.BoxGeometry(16, 9, 10);
        makeMesh(wingGeo, 0x8B7355, 14, 4.5, 0);

        // Keep battlements - top crenellations (series of merlons)
        var merlonGeo1 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(merlonGeo1, 0x8B4513, -4, 16.5, 0);
        var merlonGeo2 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(merlonGeo2, 0x8B4513, -1, 16.5, 0);
        var merlonGeo3 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(merlonGeo3, 0x8B4513, 2, 16.5, 0);
        var merlonGeo4 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(merlonGeo4, 0x8B4513, 5, 16.5, 0);

        // Wing battlements
        var wingMerlon1 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(wingMerlon1, 0x8B7355, 7, 10.5, 0);
        var wingMerlon2 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(wingMerlon2, 0x8B7355, 11, 10.5, 0);
        var wingMerlon3 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(wingMerlon3, 0x8B7355, 15, 10.5, 0);
        var wingMerlon4 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(wingMerlon4, 0x8B7355, 19, 10.5, 0);
        var wingMerlon5 = new THREE.BoxGeometry(2.5, 2, 2);
        makeMesh(wingMerlon5, 0x8B7355, 22, 10.5, 0);

        // Mullioned windows on keep - cross-shaped dark boxes (vertical bar)
        var win1v = new THREE.BoxGeometry(0.5, 2.5, 0.4);
        makeMesh(win1v, 0x1A1A1A, -3, 10, -5.2);
        var win1h = new THREE.BoxGeometry(1.8, 0.5, 0.4);
        makeMesh(win1h, 0x1A1A1A, -3, 10, -5.2);

        var win2v = new THREE.BoxGeometry(0.5, 2.5, 0.4);
        makeMesh(win2v, 0x1A1A1A, 2, 10, -5.2);
        var win2h = new THREE.BoxGeometry(1.8, 0.5, 0.4);
        makeMesh(win2h, 0x1A1A1A, 2, 10, -5.2);

        var win3v = new THREE.BoxGeometry(0.5, 2.5, 0.4);
        makeMesh(win3v, 0x1A1A1A, -3, 5, -5.2);
        var win3h = new THREE.BoxGeometry(1.8, 0.5, 0.4);
        makeMesh(win3h, 0x1A1A1A, -3, 5, -5.2);

        // Mullioned windows on manor wing
        var wwin1v = new THREE.BoxGeometry(0.5, 2.5, 0.4);
        makeMesh(wwin1v, 0x1A1A1A, 10, 6, -5.2);
        var wwin1h = new THREE.BoxGeometry(1.8, 0.5, 0.4);
        makeMesh(wwin1h, 0x1A1A1A, 10, 6, -5.2);

        var wwin2v = new THREE.BoxGeometry(0.5, 2.5, 0.4);
        makeMesh(wwin2v, 0x1A1A1A, 16, 6, -5.2);
        var wwin2h = new THREE.BoxGeometry(1.8, 0.5, 0.4);
        makeMesh(wwin2h, 0x1A1A1A, 16, 6, -5.2);

        // Castle entrance doorway
        var doorGeo = new THREE.BoxGeometry(2.5, 4, 0.6);
        makeMesh(doorGeo, 0x2B1A0A, -3, 2, -5.2);

        // Castle wall/curtain enclosure
        var wallN = new THREE.BoxGeometry(40, 4, 1.5);
        makeMesh(wallN, 0x8B7355, 5, 2, -18);
        var wallS = new THREE.BoxGeometry(40, 4, 1.5);
        makeMesh(wallS, 0x8B7355, 5, 2, 18);
        var wallE = new THREE.BoxGeometry(1.5, 4, 35);
        makeMesh(wallE, 0x8B7355, 25, 2, 0);
        var wallW = new THREE.BoxGeometry(1.5, 4, 35);
        makeMesh(wallW, 0x8B7355, -15, 2, 0);

        // Gatehouse over entrance to castle grounds
        var gatehouseGeo = new THREE.BoxGeometry(6, 7, 4);
        makeMesh(gatehouseGeo, 0x8B7355, -15, 3.5, 0);
        var gateArchGeo = new THREE.BoxGeometry(2.5, 4, 4.5);
        makeMesh(gateArchGeo, 0x2B1A0A, -15, 2, 0);
    }

    function buildRoundTower() {
        // Round corner tower - CylinderGeometry
        var towerGeo = new THREE.CylinderGeometry(3, 3.5, 14, 12);
        makeMesh(towerGeo, 0x8B4513, -10, 7, -10);
        // Cone cap on round tower
        var capGeo = new THREE.ConeGeometry(3.2, 4, 12);
        makeMesh(capGeo, 0x5C4033, -10, 16, -10);
        // Small window slit in round tower
        var slitGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
        makeMesh(slitGeo, 0x1A1A1A, -7.1, 8, -10);
    }

    function buildRiverEske() {
        // River Eske running past castle into Donegal Bay
        // River as series of flat box sections (BoxGeometry used as flat plane)
        var river1 = new THREE.BoxGeometry(8, 0.3, 60);
        makeMesh(river1, 0x006994, -30, 0.15, -10);
        var river2 = new THREE.BoxGeometry(8, 0.3, 30);
        makeMesh(river2, 0x006994, -34, 0.15, 45);
        var river3 = new THREE.BoxGeometry(12, 0.3, 20);
        makeMesh(river3, 0x006994, -38, 0.15, 65);
        // Riverbank stones
        var bank1 = new THREE.BoxGeometry(2, 0.5, 60);
        makeMesh(bank1, 0x9B9B7A, -34.5, 0.25, -10);
        var bank2 = new THREE.BoxGeometry(2, 0.5, 60);
        makeMesh(bank2, 0x9B9B7A, -25.5, 0.25, -10);
    }

    function buildDonegalBay() {
        // Bay water expanse to south
        var bay1 = new THREE.BoxGeometry(200, 0.4, 80);
        makeMesh(bay1, 0x1E6BA8, 0, 0.2, 90);
        var bay2 = new THREE.BoxGeometry(200, 0.4, 60);
        makeMesh(bay2, 0x1565A8, 0, 0.2, 160);
        // Tidal flats
        var tidalFlat1 = new THREE.BoxGeometry(60, 0.25, 30);
        makeMesh(tidalFlat1, 0xB8A88A, -50, 0.12, 65);
        var tidalFlat2 = new THREE.BoxGeometry(40, 0.25, 25);
        makeMesh(tidalFlat2, 0xB8A88A, 60, 0.12, 70);
        // Shoreline edge
        var shore1 = new THREE.BoxGeometry(200, 0.5, 5);
        makeMesh(shore1, 0xD2B48C, 0, 0.25, 50);
    }

    function buildDiamond() {
        // Diamond (central town square) - cobbled paving
        var squareGeo = new THREE.BoxGeometry(30, 0.3, 30);
        makeMesh(squareGeo, 0xC0C0C0, 60, 0.15, 0);

        // Obelisk monument in Diamond centre - base and shaft
        var obeliskBase = new THREE.BoxGeometry(3, 1, 3);
        makeMesh(obeliskBase, 0xF5F5F5, 60, 0.5, 0);
        var obeliskPedestal = new THREE.BoxGeometry(2.2, 2, 2.2);
        makeMesh(obeliskPedestal, 0xF5F5F5, 60, 2, 0);
        var obeliskShaft = new THREE.BoxGeometry(1.2, 7, 1.2);
        makeMesh(obeliskShaft, 0xF5F5F5, 60, 7.5, 0);
        var obeliskTip = new THREE.ConeGeometry(0.7, 2, 4);
        makeMesh(obeliskTip, 0xF5F5F5, 60, 12.5, 0);

        // Benches around Diamond
        var bench1 = new THREE.BoxGeometry(3, 0.3, 0.8);
        makeMesh(bench1, 0x8B4513, 50, 0.6, -10);
        var bench2 = new THREE.BoxGeometry(3, 0.3, 0.8);
        makeMesh(bench2, 0x8B4513, 70, 0.6, 10);

        // Street lamp posts in Diamond
        var lamp1Post = new THREE.CylinderGeometry(0.1, 0.1, 4, 6);
        makeMesh(lamp1Post, 0x2F2F2F, 52, 2, -8);
        var lamp1Head = new THREE.SphereGeometry(0.3, 6, 6);
        makeMesh(lamp1Head, 0xFFFF99, 52, 4.2, -8);

        var lamp2Post = new THREE.CylinderGeometry(0.1, 0.1, 4, 6);
        makeMesh(lamp2Post, 0x2F2F2F, 68, 2, 8);
        var lamp2Head = new THREE.SphereGeometry(0.3, 6, 6);
        makeMesh(lamp2Head, 0xFFFF99, 68, 4.2, 8);
    }

    function buildAbbey() {
        // Donegal Abbey - Franciscan friary ruins by the bay
        // Main nave walls
        var naveWallN = new THREE.BoxGeometry(20, 6, 1.2);
        makeMesh(naveWallN, 0x808080, -60, 3, 38);
        var naveWallS = new THREE.BoxGeometry(20, 6, 1.2);
        makeMesh(naveWallS, 0x808080, -60, 3, 58);
        var naveWallW = new THREE.BoxGeometry(1.2, 6, 20);
        makeMesh(naveWallW, 0x808080, -70, 3, 48);
        // East gable - partial ruin, taller
        var naveWallE = new THREE.BoxGeometry(1.2, 9, 20);
        makeMesh(naveWallE, 0x808080, -50, 4.5, 48);

        // Gothic window opening in east gable (dark box inset)
        var gothicWinV = new THREE.BoxGeometry(0.5, 4, 2.5);
        makeMesh(gothicWinV, 0x2A2A2A, -49.7, 6, 48);
        var gothicWinArch = new THREE.BoxGeometry(0.5, 1.5, 1.5);
        makeMesh(gothicWinArch, 0x2A2A2A, -49.7, 9, 48);

        // Abbey tower
        var abbeyTower = new THREE.BoxGeometry(5, 12, 5);
        makeMesh(abbeyTower, 0x808080, -60, 6, 38);
        // Tower top crenellations
        var abbeyMerlon1 = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        makeMesh(abbeyMerlon1, 0x808080, -62, 12.75, 37);
        var abbeyMerlon2 = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        makeMesh(abbeyMerlon2, 0x808080, -59, 12.75, 37);
        var abbeyMerlon3 = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        makeMesh(abbeyMerlon3, 0x808080, -56, 12.75, 37);

        // Cloister remains - low walls
        var cloisterWall1 = new THREE.BoxGeometry(14, 2, 0.8);
        makeMesh(cloisterWall1, 0x909090, -60, 1, 44);
        var cloisterWall2 = new THREE.BoxGeometry(0.8, 2, 12);
        makeMesh(cloisterWall2, 0x909090, -53, 1, 48);
        var cloisterWall3 = new THREE.BoxGeometry(14, 2, 0.8);
        makeMesh(cloisterWall3, 0x909090, -60, 1, 52);

        // Abbey grounds - gravestone slabs
        var grave1 = new THREE.BoxGeometry(0.6, 0.8, 0.2);
        makeMesh(grave1, 0x5A5A5A, -55, 0.4, 46);
        var grave2 = new THREE.BoxGeometry(0.6, 0.8, 0.2);
        makeMesh(grave2, 0x5A5A5A, -57, 0.4, 50);
        var grave3 = new THREE.BoxGeometry(0.6, 0.8, 0.2);
        makeMesh(grave3, 0x5A5A5A, -53, 0.4, 52);
    }

    function buildShopfronts() {
        // Donegal tweed and colourful shopfronts around Diamond

        // Red shop
        var shop1Body = new THREE.BoxGeometry(8, 5, 6);
        makeMesh(shop1Body, 0xCD5C5C, 50, 2.5, -20);
        var shop1Roof = new THREE.BoxGeometry(8.4, 0.6, 6.4);
        makeMesh(shop1Roof, 0x8B0000, 50, 5.3, -20);
        var shop1Window = new THREE.BoxGeometry(3, 2.5, 0.3);
        makeMesh(shop1Window, 0x87CEEB, 50, 2.5, -23.1);
        var shop1Door = new THREE.BoxGeometry(1.5, 3, 0.3);
        makeMesh(shop1Door, 0x4A1A00, 48, 1.5, -23.1);
        var shop1Sign = new THREE.BoxGeometry(5, 1, 0.3);
        makeMesh(shop1Sign, 0xFFFFFF, 50, 4.5, -23.1);

        // Green shop (tweed)
        var shop2Body = new THREE.BoxGeometry(8, 5, 6);
        makeMesh(shop2Body, 0x3B7A57, 60, 2.5, -20);
        var shop2Roof = new THREE.BoxGeometry(8.4, 0.6, 6.4);
        makeMesh(shop2Roof, 0x2E5E40, 60, 5.3, -20);
        var shop2Window = new THREE.BoxGeometry(3, 2.5, 0.3);
        makeMesh(shop2Window, 0x87CEEB, 60, 2.5, -23.1);
        var shop2Door = new THREE.BoxGeometry(1.5, 3, 0.3);
        makeMesh(shop2Door, 0x2B1A0A, 62, 1.5, -23.1);
        var shop2Sign = new THREE.BoxGeometry(5, 1, 0.3);
        makeMesh(shop2Sign, 0xFFD700, 60, 4.5, -23.1);

        // Gold/amber shop
        var shop3Body = new THREE.BoxGeometry(8, 5, 6);
        makeMesh(shop3Body, 0xDAA520, 70, 2.5, -20);
        var shop3Roof = new THREE.BoxGeometry(8.4, 0.6, 6.4);
        makeMesh(shop3Roof, 0xB8860B, 70, 5.3, -20);
        var shop3Window = new THREE.BoxGeometry(3, 2.5, 0.3);
        makeMesh(shop3Window, 0x87CEEB, 70, 2.5, -23.1);
        var shop3Door = new THREE.BoxGeometry(1.5, 3, 0.3);
        makeMesh(shop3Door, 0x2B1A0A, 72, 1.5, -23.1);

        // Blue shop opposite Diamond
        var shop4Body = new THREE.BoxGeometry(8, 5, 6);
        makeMesh(shop4Body, 0x4169E1, 50, 2.5, 20);
        var shop4Roof = new THREE.BoxGeometry(8.4, 0.6, 6.4);
        makeMesh(shop4Roof, 0x27408B, 50, 5.3, 20);
        var shop4Window = new THREE.BoxGeometry(3, 2.5, 0.3);
        makeMesh(shop4Window, 0x87CEEB, 50, 2.5, 23.1);

        // White pub/shop
        var shop5Body = new THREE.BoxGeometry(9, 6, 6);
        makeMesh(shop5Body, 0xF5F5F5, 80, 3, -20);
        var shop5Roof = new THREE.BoxGeometry(9.4, 0.7, 6.4);
        makeMesh(shop5Roof, 0x696969, 80, 6.35, -20);
        var shop5Window1 = new THREE.BoxGeometry(2.5, 2, 0.3);
        makeMesh(shop5Window1, 0x87CEEB, 77, 3, -23.1);
        var shop5Window2 = new THREE.BoxGeometry(2.5, 2, 0.3);
        makeMesh(shop5Window2, 0x87CEEB, 83, 3, -23.1);
        var shop5Door = new THREE.BoxGeometry(1.5, 3.5, 0.3);
        makeMesh(shop5Door, 0x8B0000, 80, 1.75, -23.1);
    }

    function buildSeaStacks() {
        // Dramatic sea stacks off the coast
        var stack1 = new THREE.CylinderGeometry(2.5, 3.5, 18, 8);
        makeMesh(stack1, 0x808080, -80, 9, 110);
        var stack1Cap = new THREE.BoxGeometry(5, 2, 5);
        makeMesh(stack1Cap, 0x6B6B6B, -80, 19, 110);

        var stack2 = new THREE.CylinderGeometry(1.8, 2.8, 14, 7);
        makeMesh(stack2, 0x696969, -60, 7, 120);
        var stack2Cap = new THREE.ConeGeometry(2.5, 3, 7);
        makeMesh(stack2Cap, 0x5E5E5E, -60, 16.5, 120);

        var stack3 = new THREE.CylinderGeometry(3, 4, 22, 8);
        makeMesh(stack3, 0x787878, -100, 11, 105);
        var stack3Top = new THREE.BoxGeometry(6, 1.5, 5);
        makeMesh(stack3Top, 0x6A6A6A, -100, 23, 105);

        var stack4 = new THREE.CylinderGeometry(1.2, 2, 10, 6);
        makeMesh(stack4, 0x808080, -70, 5, 130);
    }

    function buildSlieveLeague() {
        // Slieve League cliffs visible on horizon - very tall cliff face boxes
        var cliff1 = new THREE.BoxGeometry(80, 60, 12);
        makeMesh(cliff1, 0x696969, -120, 30, 200);
        var cliff2 = new THREE.BoxGeometry(60, 75, 12);
        makeMesh(cliff2, 0x5E5E5E, -170, 37.5, 200);
        var cliff3 = new THREE.BoxGeometry(50, 50, 12);
        makeMesh(cliff3, 0x787878, -80, 25, 200);
        var cliff4 = new THREE.BoxGeometry(40, 45, 12);
        makeMesh(cliff4, 0x696969, -50, 22.5, 195);
        // Cliff top grass edge
        var cliffTop1 = new THREE.BoxGeometry(80, 3, 12);
        makeMesh(cliffTop1, 0x4A7A3A, -120, 61.5, 200);
        var cliffTop2 = new THREE.BoxGeometry(60, 3, 12);
        makeMesh(cliffTop2, 0x4A7A3A, -170, 77, 200);
        // Scree at cliff base
        var scree1 = new THREE.BoxGeometry(80, 5, 8);
        makeMesh(scree1, 0x7A7A6A, -120, 2.5, 196);
    }

    function buildWildAtlanticWayMarker() {
        // Wild Atlantic Way marker post - blue waymarker with wave symbol
        var markerPost = new THREE.CylinderGeometry(0.12, 0.12, 3, 6);
        makeMesh(markerPost, 0x006994, 40, 1.5, 45);
        // Wave symbol board on top
        var markerBoard = new THREE.BoxGeometry(0.8, 0.9, 0.12);
        makeMesh(markerBoard, 0x006994, 40, 3.3, 45);
        // Wave decoration strip (lighter blue stripe)
        var waveStripe = new THREE.BoxGeometry(0.8, 0.2, 0.14);
        makeMesh(waveStripe, 0x00B4D8, 40, 3.1, 45);
    }

    function buildTownBuildings() {
        // Additional town buildings around the Diamond and streets

        // Town hall / court house
        var townHall = new THREE.BoxGeometry(14, 8, 10);
        makeMesh(townHall, 0xE8DCC8, 80, 4, 10);
        var townHallRoof = new THREE.BoxGeometry(14.4, 1, 10.4);
        makeMesh(townHallRoof, 0x808080, 80, 8.5, 10);
        // Columns on town hall facade
        var col1 = new THREE.CylinderGeometry(0.4, 0.4, 7, 8);
        makeMesh(col1, 0xF0EAD6, 75, 3.5, 4.9);
        var col2 = new THREE.CylinderGeometry(0.4, 0.4, 7, 8);
        makeMesh(col2, 0xF0EAD6, 78, 3.5, 4.9);
        var col3 = new THREE.CylinderGeometry(0.4, 0.4, 7, 8);
        makeMesh(col3, 0xF0EAD6, 81, 3.5, 4.9);
        var col4 = new THREE.CylinderGeometry(0.4, 0.4, 7, 8);
        makeMesh(col4, 0xF0EAD6, 84, 3.5, 4.9);

        // Church with steeple
        var churchBody = new THREE.BoxGeometry(12, 7, 18);
        makeMesh(churchBody, 0xD3CBBC, 30, 3.5, -35);
        var churchSteeple = new THREE.BoxGeometry(4, 10, 4);
        makeMesh(churchSteeple, 0xC8BFB0, 30, 12, -35);
        var churchSpire = new THREE.ConeGeometry(2.2, 8, 4);
        makeMesh(churchSpire, 0x808080, 30, 21, -35);
        var churchWindow1 = new THREE.BoxGeometry(0.4, 3.5, 2.5);
        makeMesh(churchWindow1, 0x2A2A2A, 24.1, 4, -35);

        // Residential houses
        var house1 = new THREE.BoxGeometry(7, 5, 8);
        makeMesh(house1, 0xE8C99A, 90, 2.5, -15);
        var house1Roof = new THREE.BoxGeometry(7.4, 0.5, 8.4);
        makeMesh(house1Roof, 0x8B0000, 90, 5.25, -15);
        var house2 = new THREE.BoxGeometry(7, 5, 8);
        makeMesh(house2, 0xC8A87A, 100, 2.5, -15);
        var house2Roof = new THREE.BoxGeometry(7.4, 0.5, 8.4);
        makeMesh(house2Roof, 0x2F4F4F, 100, 5.25, -15);

        // Small stone wall along road
        var roadWall1 = new THREE.BoxGeometry(30, 1.2, 0.6);
        makeMesh(roadWall1, 0x9A9A8A, 20, 0.6, -28);
    }

    function buildCoastalFlats() {
        // Coastal flatlands and grass fields
        var field1 = new THREE.BoxGeometry(60, 0.2, 40);
        makeMesh(field1, 0x4A7A3A, -50, 0.1, 20);
        var field2 = new THREE.BoxGeometry(40, 0.2, 35);
        makeMesh(field2, 0x5A8A4A, 30, 0.1, 65);
        // Stone field walls
        var fieldWall1 = new THREE.BoxGeometry(40, 0.8, 0.5);
        makeMesh(fieldWall1, 0x9A9A8A, -50, 0.4, 5);
        var fieldWall2 = new THREE.BoxGeometry(0.5, 0.8, 40);
        makeMesh(fieldWall2, 0x9A9A8A, -30, 0.4, 20);
    }

    function buildRoads() {
        // Main road through Donegal town
        var road1 = new THREE.BoxGeometry(8, 0.18, 80);
        makeMesh(road1, 0x3A3A3A, 60, 0.09, -55);
        var road2 = new THREE.BoxGeometry(80, 0.18, 8);
        makeMesh(road2, 0x3A3A3A, 35, 0.09, 0);
        // Road to castle
        var road3 = new THREE.BoxGeometry(6, 0.18, 40);
        makeMesh(road3, 0x3A3A3A, 20, 0.09, -15);
        // Road markings (white dashes)
        var dashGeo1 = new THREE.BoxGeometry(0.3, 0.2, 3);
        makeMesh(dashGeo1, 0xFFFFFF, 60, 0.1, -40);
        var dashGeo2 = new THREE.BoxGeometry(0.3, 0.2, 3);
        makeMesh(dashGeo2, 0xFFFFFF, 60, 0.1, -55);
        var dashGeo3 = new THREE.BoxGeometry(0.3, 0.2, 3);
        makeMesh(dashGeo3, 0xFFFFFF, 60, 0.1, -70);
    }

    function build() {
        buildCastle();
        buildRoundTower();
        buildRiverEske();
        buildDonegalBay();
        buildDiamond();
        buildAbbey();
        buildShopfronts();
        buildSeaStacks();
        buildSlieveLeague();
        buildWildAtlanticWayMarker();
        buildTownBuildings();
        buildCoastalFlats();
        buildRoads();

        // Ground plane (base terrain using BoxGeometry)
        var ground = new THREE.BoxGeometry(400, 0.5, 400);
        makeMesh(ground, 0x5A8040, 0, -0.25, 0);
    }

    function update(delta) { }

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
