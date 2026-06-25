window.PeakCavern = (function() {
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

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function buildPeakCavernEntrance() {
        // Ground platform in front of cave
        var groundGeo = new THREE.BoxGeometry(60, 1, 40);
        var ground = makeMesh(groundGeo, 0x8B7355);
        ground.position.set(15600, -0.5, 0);
        addObj(ground);

        // Massive cliff face around cave entrance
        var cliffLeft = makeMesh(new THREE.BoxGeometry(20, 25, 30), 0x808080);
        cliffLeft.position.set(15570, 12, 0);
        addObj(cliffLeft);

        var cliffRight = makeMesh(new THREE.BoxGeometry(20, 25, 30), 0x808080);
        cliffRight.position.set(15630, 12, 0);
        addObj(cliffRight);

        var cliffTop = makeMesh(new THREE.BoxGeometry(60, 12, 30), 0x808080);
        cliffTop.position.set(15600, 24, 0);
        addObj(cliffTop);

        // Cave mouth interior (dark)
        var caveInterior = makeMesh(new THREE.BoxGeometry(38, 18, 20), 0x1a1a1a);
        caveInterior.position.set(15600, 7, -10);
        addObj(caveInterior);

        // Cave arch - top curved suggestion via cylinders stacked
        var archCenter = makeMesh(new THREE.CylinderGeometry(2, 2, 42, 6), 0x696969);
        archCenter.rotation.z = Math.PI / 2;
        archCenter.position.set(15600, 18, 0);
        addObj(archCenter);

        // Ropemakers workshop inside entrance - wooden frame structures
        var ropePost1 = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x8B4513);
        ropePost1.position.set(15588, 2, -5);
        addObj(ropePost1);

        var ropePost2 = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x8B4513);
        ropePost2.position.set(15596, 2, -5);
        addObj(ropePost2);

        var ropePost3 = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x8B4513);
        ropePost3.position.set(15604, 2, -5);
        addObj(ropePost3);

        var ropePost4 = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x8B4513);
        ropePost4.position.set(15612, 2, -5);
        addObj(ropePost4);

        var ropeBeam = makeMesh(new THREE.BoxGeometry(26, 0.3, 0.3), 0x8B4513);
        ropeBeam.position.set(15600, 4, -5);
        addObj(ropeBeam);

        // Rope hanging representation (thin cylinders)
        var rope1 = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 4), 0x8B6914);
        rope1.position.set(15590, 2.5, -5);
        addObj(rope1);

        var rope2 = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 4), 0x8B6914);
        rope2.position.set(15598, 2.5, -5);
        addObj(rope2);

        var rope3 = makeMesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 4), 0x8B6914);
        rope3.position.set(15606, 2.5, -5);
        addObj(rope3);

        // Cave tour path going in
        var pathSlab1 = makeMesh(new THREE.BoxGeometry(4, 0.2, 8), 0x9e9e9e);
        pathSlab1.position.set(15600, 0.1, -2);
        addObj(pathSlab1);

        var pathSlab2 = makeMesh(new THREE.BoxGeometry(4, 0.2, 8), 0x9e9e9e);
        pathSlab2.position.set(15600, 0.1, -12);
        addObj(pathSlab2);

        var pathSlab3 = makeMesh(new THREE.BoxGeometry(4, 0.2, 8), 0x9e9e9e);
        pathSlab3.position.set(15600, 0.1, -22);
        addObj(pathSlab3);

        // Tour guide post at entrance
        var guidePost = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 6), 0xFFD700);
        guidePost.position.set(15593, 1, 2);
        addObj(guidePost);

        var guideSign = makeMesh(new THREE.BoxGeometry(2, 1, 0.1), 0x8B0000);
        guideSign.position.set(15593, 2.2, 2);
        addObj(guideSign);
    }

    function buildPeverilCastle() {
        // Sharp hill for the castle
        var hillBase = makeMesh(new THREE.ConeGeometry(30, 35, 8), 0x6B8E23);
        hillBase.position.set(15660, 17.5, -80);
        addObj(hillBase);

        // Castle keep - square Norman tower
        var keep = makeMesh(new THREE.BoxGeometry(12, 18, 12), 0xC0C0C0);
        keep.position.set(15660, 44, -80);
        addObj(keep);

        // Keep battlements
        var battlement1 = makeMesh(new THREE.BoxGeometry(2, 2, 2), 0xC0C0C0);
        battlement1.position.set(15654, 54, -80);
        addObj(battlement1);

        var battlement2 = makeMesh(new THREE.BoxGeometry(2, 2, 2), 0xC0C0C0);
        battlement2.position.set(15658, 54, -80);
        addObj(battlement2);

        var battlement3 = makeMesh(new THREE.BoxGeometry(2, 2, 2), 0xC0C0C0);
        battlement3.position.set(15662, 54, -80);
        addObj(battlement3);

        var battlement4 = makeMesh(new THREE.BoxGeometry(2, 2, 2), 0xC0C0C0);
        battlement4.position.set(15666, 54, -80);
        addObj(battlement4);

        // Curtain walls
        var wallNorth = makeMesh(new THREE.BoxGeometry(40, 8, 1.5), 0xA9A9A9);
        wallNorth.position.set(15660, 38, -65);
        addObj(wallNorth);

        var wallSouth = makeMesh(new THREE.BoxGeometry(40, 8, 1.5), 0xA9A9A9);
        wallSouth.position.set(15660, 38, -95);
        addObj(wallSouth);

        var wallEast = makeMesh(new THREE.BoxGeometry(1.5, 8, 30), 0xA9A9A9);
        wallEast.position.set(15680, 38, -80);
        addObj(wallEast);

        var wallWest = makeMesh(new THREE.BoxGeometry(1.5, 8, 30), 0xA9A9A9);
        wallWest.position.set(15640, 38, -80);
        addObj(wallWest);

        // Gatehouse
        var gatehouseBase = makeMesh(new THREE.BoxGeometry(8, 10, 6), 0xB8B8B8);
        gatehouseBase.position.set(15660, 39, -95);
        addObj(gatehouseBase);

        var gatehouseTowerL = makeMesh(new THREE.BoxGeometry(3, 12, 3), 0xB8B8B8);
        gatehouseTowerL.position.set(15656, 40, -95);
        addObj(gatehouseTowerL);

        var gatehouseTowerR = makeMesh(new THREE.BoxGeometry(3, 12, 3), 0xB8B8B8);
        gatehouseTowerR.position.set(15664, 40, -95);
        addObj(gatehouseTowerR);

        // Gateway arch (dark opening)
        var gateway = makeMesh(new THREE.BoxGeometry(3, 4, 6), 0x222222);
        gateway.position.set(15660, 37, -95);
        addObj(gateway);

        // Corner towers of curtain wall
        var cornerTower1 = makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 10, 8), 0xA9A9A9);
        cornerTower1.position.set(15680, 39, -65);
        addObj(cornerTower1);

        var cornerTower2 = makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 10, 8), 0xA9A9A9);
        cornerTower2.position.set(15640, 39, -65);
        addObj(cornerTower2);
    }

    function buildWinnatsPass() {
        // Left cliff wall of gorge
        var leftWallBase = makeMesh(new THREE.BoxGeometry(8, 40, 80), 0x808080);
        leftWallBase.position.set(15560, 20, -200);
        addObj(leftWallBase);

        var leftWallTop = makeMesh(new THREE.BoxGeometry(10, 20, 80), 0x909090);
        leftWallTop.position.set(15558, 50, -200);
        addObj(leftWallTop);

        // Right cliff wall of gorge
        var rightWallBase = makeMesh(new THREE.BoxGeometry(8, 40, 80), 0x808080);
        rightWallBase.position.set(15640, 20, -200);
        addObj(rightWallBase);

        var rightWallTop = makeMesh(new THREE.BoxGeometry(10, 20, 80), 0x909090);
        rightWallTop.position.set(15642, 50, -200);
        addObj(rightWallTop);

        // Gorge floor
        var gorgeFloor = makeMesh(new THREE.BoxGeometry(72, 1, 85), 0x7a7a6a);
        gorgeFloor.position.set(15600, -0.5, -200);
        addObj(gorgeFloor);

        // Narrow road through the pass
        var road = makeMesh(new THREE.BoxGeometry(5, 0.3, 80), 0x555555);
        road.position.set(15600, 0.15, -200);
        addObj(road);

        // Limestone outcrops jutting from walls
        var outcrop1 = makeMesh(new THREE.BoxGeometry(5, 6, 4), 0x9e9e9e);
        outcrop1.position.set(15568, 15, -185);
        addObj(outcrop1);

        var outcrop2 = makeMesh(new THREE.BoxGeometry(4, 8, 5), 0x9e9e9e);
        outcrop2.position.set(15632, 22, -210);
        addObj(outcrop2);

        var outcrop3 = makeMesh(new THREE.BoxGeometry(6, 5, 4), 0x9e9e9e);
        outcrop3.position.set(15565, 30, -215);
        addObj(outcrop3);

        // Climbers suggestion - tiny figures on wall
        var climber1Body = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 5), 0xFF4500);
        climber1Body.position.set(15568, 18, -190);
        addObj(climber1Body);

        var climber2Body = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 5), 0x00008B);
        climber2Body.position.set(15635, 25, -208);
        addObj(climber2Body);

        // Legend markers - Bronze Age burial marker
        var burialMarker = makeMesh(new THREE.ConeGeometry(1.5, 2.5, 6), 0x8B8B00);
        burialMarker.position.set(15598, 0.5, -220);
        addObj(burialMarker);

        // End of pass - opening
        var passEnd = makeMesh(new THREE.BoxGeometry(1, 0.5, 1), 0x666666);
        passEnd.position.set(15600, 0, -245);
        addObj(passEnd);
    }

    function buildBlueJohnCavern() {
        // Mam Tor hillside base for Blue John
        var hillside = makeMesh(new THREE.BoxGeometry(50, 20, 50), 0x556B2F);
        hillside.position.set(15540, 10, -320);
        addObj(hillside);

        var hillsideSlope = makeMesh(new THREE.ConeGeometry(25, 15, 8), 0x556B2F);
        hillsideSlope.position.set(15540, 27, -320);
        addObj(hillsideSlope);

        // Cave entrance on hillside
        var caveWallL = makeMesh(new THREE.BoxGeometry(5, 8, 5), 0x808080);
        caveWallL.position.set(15530, 22, -310);
        addObj(caveWallL);

        var caveWallR = makeMesh(new THREE.BoxGeometry(5, 8, 5), 0x808080);
        caveWallR.position.set(15545, 22, -310);
        addObj(caveWallR);

        var caveLintel = makeMesh(new THREE.BoxGeometry(20, 3, 4), 0x808080);
        caveLintel.position.set(15537, 28, -310);
        addObj(caveLintel);

        var caveOpeningDark = makeMesh(new THREE.BoxGeometry(10, 6, 4), 0x111111);
        caveOpeningDark.position.set(15537, 23, -310);
        addObj(caveOpeningDark);

        // Underground chamber walls (Blue John mine)
        var chamberFloor = makeMesh(new THREE.BoxGeometry(20, 1, 20), 0x3a3a3a);
        chamberFloor.position.set(15537, 18, -325);
        addObj(chamberFloor);

        var chamberWallL = makeMesh(new THREE.BoxGeometry(1, 10, 20), 0x4a3060);
        chamberWallL.position.set(15527, 23, -325);
        addObj(chamberWallL);

        var chamberWallR = makeMesh(new THREE.BoxGeometry(1, 10, 20), 0x4a3060);
        chamberWallR.position.set(15547, 23, -325);
        addObj(chamberWallR);

        var chamberCeiling = makeMesh(new THREE.BoxGeometry(20, 1, 20), 0x2e2040);
        chamberCeiling.position.set(15537, 28, -325);
        addObj(chamberCeiling);

        // Stalactites hanging from ceiling
        var stal1 = makeMesh(new THREE.ConeGeometry(0.4, 2.5, 5), 0x9370DB);
        stal1.position.set(15533, 26, -322);
        addObj(stal1);

        var stal2 = makeMesh(new THREE.ConeGeometry(0.3, 1.8, 5), 0x9370DB);
        stal2.position.set(15537, 26.5, -326);
        addObj(stal2);

        var stal3 = makeMesh(new THREE.ConeGeometry(0.5, 3.0, 5), 0x8B4DC8);
        stal3.position.set(15542, 26, -320);
        addObj(stal3);

        var stal4 = makeMesh(new THREE.ConeGeometry(0.3, 2.0, 5), 0x7B68EE);
        stal4.position.set(15530, 26.8, -330);
        addObj(stal4);

        // Stalagmites rising from floor
        var stam1 = makeMesh(new THREE.ConeGeometry(0.5, 2.0, 5), 0x8A6B9E);
        stam1.rotation.x = Math.PI;
        stam1.position.set(15532, 20, -324);
        addObj(stam1);

        var stam2 = makeMesh(new THREE.ConeGeometry(0.4, 1.5, 5), 0x8A6B9E);
        stam2.rotation.x = Math.PI;
        stam2.position.set(15543, 20, -328);
        addObj(stam2);

        // Blue John mineral veins in walls (purple-blue streaks)
        var vein1 = makeMesh(new THREE.BoxGeometry(0.3, 4, 8), 0x4B0082);
        vein1.position.set(15527.5, 22, -325);
        addObj(vein1);

        var vein2 = makeMesh(new THREE.BoxGeometry(0.3, 3, 6), 0x6A0DAD);
        vein2.position.set(15546.5, 24, -320);
        addObj(vein2);

        var vein3 = makeMesh(new THREE.BoxGeometry(0.3, 5, 4), 0x4B0082);
        vein3.position.set(15527.5, 25, -330);
        addObj(vein3);

        // Gift shop / visitor entrance building
        var shopBuilding = makeMesh(new THREE.BoxGeometry(8, 4, 6), 0xD2B48C);
        shopBuilding.position.set(15552, 22, -312);
        addObj(shopBuilding);

        var shopRoof = makeMesh(new THREE.ConeGeometry(6, 3, 4), 0x8B4513);
        shopRoof.position.set(15552, 25.5, -312);
        addObj(shopRoof);
    }

    function buildMamTor() {
        // Main Mam Tor hill mass
        var mamTorBase = makeMesh(new THREE.ConeGeometry(60, 50, 8), 0x6B7C3A);
        mamTorBase.position.set(15580, 25, -430);
        addObj(mamTorBase);

        // Summit area
        var summit = makeMesh(new THREE.CylinderGeometry(12, 18, 8, 8), 0x7A8A4A);
        summit.position.set(15580, 53, -430);
        addObj(summit);

        // Layered shale bands (Shivering Mountain effect)
        var shale1 = makeMesh(new THREE.BoxGeometry(50, 1.5, 20), 0x708090);
        shale1.position.set(15580, 10, -420);
        addObj(shale1);

        var shale2 = makeMesh(new THREE.BoxGeometry(45, 1.5, 18), 0x778899);
        shale2.position.set(15582, 15, -422);
        addObj(shale2);

        var shale3 = makeMesh(new THREE.BoxGeometry(40, 1.5, 16), 0x708090);
        shale3.position.set(15584, 20, -424);
        addObj(shale3);

        // Landslide scar - exposed rock face
        var landslideScar = makeMesh(new THREE.BoxGeometry(30, 35, 5), 0x969696);
        landslideScar.position.set(15600, 17, -405);
        addObj(landslideScar);

        // Landslide debris at base
        var debris1 = makeMesh(new THREE.SphereGeometry(3, 5, 4), 0x888888);
        debris1.position.set(15605, 1.5, -398);
        addObj(debris1);

        var debris2 = makeMesh(new THREE.SphereGeometry(4, 5, 4), 0x808080);
        debris2.position.set(15614, 2, -402);
        addObj(debris2);

        var debris3 = makeMesh(new THREE.SphereGeometry(2.5, 5, 4), 0x888888);
        debris3.position.set(15598, 1.5, -395);
        addObj(debris3);

        // Old road buried under landslide
        var oldRoadA = makeMesh(new THREE.BoxGeometry(5, 0.3, 15), 0x444444);
        oldRoadA.position.set(15606, 0.15, -390);
        addObj(oldRoadA);

        var oldRoadBuried = makeMesh(new THREE.BoxGeometry(5, 0.3, 10), 0x333333);
        oldRoadBuried.position.set(15606, 1.5, -405);
        addObj(oldRoadBuried);

        // Summit hill fort earthworks - rampart banks
        var rampart1 = makeMesh(new THREE.BoxGeometry(28, 2.5, 3), 0x5a6a30);
        rampart1.position.set(15580, 57, -418);
        addObj(rampart1);

        var rampart2 = makeMesh(new THREE.BoxGeometry(28, 2.5, 3), 0x5a6a30);
        rampart2.position.set(15580, 57, -442);
        addObj(rampart2);

        var rampart3 = makeMesh(new THREE.BoxGeometry(3, 2.5, 24), 0x5a6a30);
        rampart3.position.set(15566, 57, -430);
        addObj(rampart3);

        var rampart4 = makeMesh(new THREE.BoxGeometry(3, 2.5, 24), 0x5a6a30);
        rampart4.position.set(15594, 57, -430);
        addObj(rampart4);

        // Ridge walk path
        var ridgePath = makeMesh(new THREE.BoxGeometry(2.5, 0.3, 60), 0x8a8a7a);
        ridgePath.position.set(15580, 55, -430);
        addObj(ridgePath);

        // Trig point at summit
        var trigPoint = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, 1.2, 6), 0xFFFFFF);
        trigPoint.position.set(15580, 58.6, -430);
        addObj(trigPoint);
    }

    function buildCastletonVillage() {
        // Village ground
        var villageGround = makeMesh(new THREE.BoxGeometry(80, 1, 60), 0x7CFC00);
        villageGround.position.set(15600, -0.5, 80);
        addObj(villageGround);

        // Castle Street - road
        var castleStreet = makeMesh(new THREE.BoxGeometry(6, 0.3, 55), 0x555555);
        castleStreet.position.set(15600, 0.15, 80);
        addObj(castleStreet);

        // Side lane
        var sideLane = makeMesh(new THREE.BoxGeometry(30, 0.3, 4), 0x666666);
        sideLane.position.set(15600, 0.15, 75);
        addObj(sideLane);

        // Shop row left side
        var shop1 = makeMesh(new THREE.BoxGeometry(6, 5, 5), 0xD2B48C);
        shop1.position.set(15583, 2.5, 70);
        addObj(shop1);

        var shop1Roof = makeMesh(new THREE.BoxGeometry(7, 1.5, 6), 0x8B4513);
        shop1Roof.position.set(15583, 5.75, 70);
        addObj(shop1Roof);

        var shop2 = makeMesh(new THREE.BoxGeometry(6, 5, 5), 0xC4A882);
        shop2.position.set(15583, 2.5, 78);
        addObj(shop2);

        var shop2Roof = makeMesh(new THREE.BoxGeometry(7, 1.5, 6), 0x7A3B10);
        shop2Roof.position.set(15583, 5.75, 78);
        addObj(shop2Roof);

        var shop3 = makeMesh(new THREE.BoxGeometry(6, 5, 5), 0xBDA882);
        shop3.position.set(15583, 2.5, 86);
        addObj(shop3);

        var shop3Roof = makeMesh(new THREE.BoxGeometry(7, 1.5, 6), 0x8B4513);
        shop3Roof.position.set(15583, 5.75, 86);
        addObj(shop3Roof);

        // Shop row right side
        var shop4 = makeMesh(new THREE.BoxGeometry(6, 5, 5), 0xD2C4A0);
        shop4.position.set(15617, 2.5, 70);
        addObj(shop4);

        var shop4Roof = makeMesh(new THREE.BoxGeometry(7, 1.5, 6), 0x8B4513);
        shop4Roof.position.set(15617, 5.75, 70);
        addObj(shop4Roof);

        var shop5 = makeMesh(new THREE.BoxGeometry(6, 5, 5), 0xC8BA9A);
        shop5.position.set(15617, 2.5, 78);
        addObj(shop5);

        var shop5Roof = makeMesh(new THREE.BoxGeometry(7, 1.5, 6), 0x7A3B10);
        shop5Roof.position.set(15617, 5.75, 78);
        addObj(shop5Roof);

        // Visitor centre - larger building
        var visitorCentre = makeMesh(new THREE.BoxGeometry(12, 6, 8), 0xE8E0D0);
        visitorCentre.position.set(15600, 3, 100);
        addObj(visitorCentre);

        var visitorRoof = makeMesh(new THREE.ConeGeometry(9, 4, 4), 0x8B4513);
        visitorRoof.position.set(15600, 8, 100);
        addObj(visitorRoof);

        // Visitor centre sign post
        var vcSignPost = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 3, 5), 0x555555);
        vcSignPost.position.set(15594, 1.5, 95);
        addObj(vcSignPost);

        var vcSign = makeMesh(new THREE.BoxGeometry(3, 1, 0.2), 0x228B22);
        vcSign.position.set(15594, 3, 95);
        addObj(vcSign);

        // Post Office
        var postOffice = makeMesh(new THREE.BoxGeometry(7, 5, 6), 0xFFF8DC);
        postOffice.position.set(15617, 2.5, 86);
        addObj(postOffice);

        var postOfficeRoof = makeMesh(new THREE.BoxGeometry(8, 1.5, 7), 0x8B0000);
        postOfficeRoof.position.set(15617, 5.75, 86);
        addObj(postOfficeRoof);

        var postSign = makeMesh(new THREE.BoxGeometry(2, 1.5, 0.2), 0xFF0000);
        postSign.position.set(15617, 4, 82.9);
        addObj(postSign);

        // Youth Hostel (former mill) - larger industrial-looking building
        var hostelBase = makeMesh(new THREE.BoxGeometry(15, 8, 10), 0xB8A898);
        hostelBase.position.set(15575, 4, 95);
        addObj(hostelBase);

        var hostelRoof = makeMesh(new THREE.BoxGeometry(16, 2, 11), 0x696969);
        hostelRoof.position.set(15575, 9, 95);
        addObj(hostelRoof);

        // Mill chimney (former mill heritage)
        var chimney = makeMesh(new THREE.CylinderGeometry(0.8, 1.2, 12, 8), 0x8B7355);
        chimney.position.set(15568, 6, 98);
        addObj(chimney);

        // Limestone walls along road edge
        var limeWallL = makeMesh(new THREE.BoxGeometry(1, 1.2, 55), 0xC8C8B8);
        limeWallL.position.set(15575, 0.6, 80);
        addObj(limeWallL);

        var limeWallR = makeMesh(new THREE.BoxGeometry(1, 1.2, 55), 0xC8C8B8);
        limeWallR.position.set(15625, 0.6, 80);
        addObj(limeWallR);

        // Village church
        var churchBody = makeMesh(new THREE.BoxGeometry(10, 8, 14), 0xD3D3C8);
        churchBody.position.set(15625, 4, 92);
        addObj(churchBody);

        var churchTower = makeMesh(new THREE.BoxGeometry(5, 14, 5), 0xC8C8BC);
        churchTower.position.set(15625, 7, 99);
        addObj(churchTower);

        var churchSpire = makeMesh(new THREE.ConeGeometry(3, 8, 4), 0xA9A9A0);
        churchSpire.position.set(15625, 18, 99);
        addObj(churchSpire);

        // Village green / Hope Valley view direction
        var green = makeMesh(new THREE.BoxGeometry(20, 0.4, 14), 0x228B22);
        green.position.set(15600, 0.2, 60);
        addObj(green);
    }

    function build() {
        buildPeakCavernEntrance();
        buildPeverilCastle();
        buildWinnatsPass();
        buildBlueJohnCavern();
        buildMamTor();
        buildCastletonVillage();
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
