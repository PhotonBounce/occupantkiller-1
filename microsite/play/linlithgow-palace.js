window.LinlithgowPalace = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 20240;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            BASE_X + (x || 0),
            BASE_Y + (y || 0),
            BASE_Z + (z || 0)
        );
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildLoch();
        buildPalaceNorthRange();
        buildPalaceSouthRange();
        buildPalaceEastRange();
        buildPalaceWestRange();
        buildPalaceCornerTowers();
        buildCourtyardFountain();
        buildOuterGateway();
        buildGreatHallWindows();
        buildStMichaelsChurch();
        buildChurchCrownSpire();
        buildTownCentre();
        buildLinlithgowCross();
        buildUnionCanalBasin();
        buildBeecraigsPark();
        buildAntonineWall();
        buildRailwayViaduct();
        buildPalaceGrounds();
    }

    function buildGround() {
        // Ground base — large flat box for terrain
        var geo = new THREE.BoxGeometry(1200, 2, 1200);
        makeMesh(geo, 0x5A7A3A, 0, -1, 0);

        // Palace inner courtyard floor
        var courtGeo = new THREE.BoxGeometry(60, 1, 60);
        makeMesh(courtGeo, 0x9C8E78, 0, 0.5, 0);

        // Palace outer grounds / curtilage
        var groundGeo = new THREE.BoxGeometry(160, 1, 160);
        makeMesh(groundGeo, 0x7A8C5A, 0, 0.1, 0);
    }

    function buildLoch() {
        // Main loch body — large flat box coloured water blue
        var lochGeo = new THREE.BoxGeometry(400, 1, 300);
        makeMesh(lochGeo, 0x006994, 200, -0.5, 50);

        // Loch near shore shelf — slightly raised edge
        var shoreNGeo = new THREE.BoxGeometry(400, 2, 8);
        makeMesh(shoreNGeo, 0x5A8060, 200, 0, -100);

        // Loch far shore
        var shoreSGeo = new THREE.BoxGeometry(400, 2, 8);
        makeMesh(shoreSGeo, 0x5A8060, 200, 0, 200);

        // Loch island / reed bed cluster
        var reedGeo = new THREE.CylinderGeometry(3, 4, 2, 8);
        makeMesh(reedGeo, 0x4A6A30, 120, 0.5, 80);

        var reedGeo2 = new THREE.CylinderGeometry(2, 3, 2, 8);
        makeMesh(reedGeo2, 0x4A6A30, 130, 0.5, 95);
    }

    function buildPalaceNorthRange() {
        // North outer wall long section
        var wallGeo = new THREE.BoxGeometry(120, 18, 4);
        makeMesh(wallGeo, 0xD4C9B0, 0, 9, -50);

        // North wall battlements left
        var merlonGeo = new THREE.BoxGeometry(6, 4, 4);
        for (var i = 0; i < 8; i++) {
            makeMesh(merlonGeo, 0xD4C9B0, -45 + i * 14, 20, -50);
        }

        // North range inner wall
        var innerWallGeo = new THREE.BoxGeometry(100, 14, 4);
        makeMesh(innerWallGeo, 0xC8BDAA, 0, 7, -38);

        // North range floor rubble / interior
        var floorGeo = new THREE.BoxGeometry(100, 1, 12);
        makeMesh(floorGeo, 0xB8AA90, 0, 0.5, -44);
    }

    function buildPalaceSouthRange() {
        // South outer wall
        var wallGeo = new THREE.BoxGeometry(120, 18, 4);
        makeMesh(wallGeo, 0xD4C9B0, 0, 9, 50);

        // South wall battlements
        var merlonGeo = new THREE.BoxGeometry(6, 4, 4);
        for (var i = 0; i < 8; i++) {
            makeMesh(merlonGeo, 0xD4C9B0, -45 + i * 14, 20, 50);
        }

        // South range great hall windows — tall lancet openings approximated by thin recess boxes
        var winGeo = new THREE.BoxGeometry(5, 8, 2);
        for (var j = 0; j < 5; j++) {
            makeMesh(winGeo, 0x2A2A2A, -20 + j * 10, 10, 49);
        }

        // South inner range wall
        var innerGeo = new THREE.BoxGeometry(100, 14, 4);
        makeMesh(innerGeo, 0xC8BDAA, 0, 7, 38);
    }

    function buildPalaceEastRange() {
        // East outer wall
        var wallGeo = new THREE.BoxGeometry(4, 18, 100);
        makeMesh(wallGeo, 0xD4C9B0, 60, 9, 0);

        // East wall battlements
        var merlonGeo = new THREE.BoxGeometry(4, 4, 6);
        for (var i = 0; i < 7; i++) {
            makeMesh(merlonGeo, 0xD4C9B0, 60, 20, -36 + i * 12);
        }

        // East range inner wall
        var innerGeo = new THREE.BoxGeometry(4, 14, 80);
        makeMesh(innerGeo, 0xC8BDAA, 48, 7, 0);

        // East range floor
        var floorGeo = new THREE.BoxGeometry(12, 1, 80);
        makeMesh(floorGeo, 0xB8AA90, 54, 0.5, 0);
    }

    function buildPalaceWestRange() {
        // West outer wall
        var wallGeo = new THREE.BoxGeometry(4, 18, 100);
        makeMesh(wallGeo, 0xD4C9B0, -60, 9, 0);

        // West wall battlements
        var merlonGeo = new THREE.BoxGeometry(4, 4, 6);
        for (var i = 0; i < 7; i++) {
            makeMesh(merlonGeo, 0xD4C9B0, -60, 20, -36 + i * 12);
        }

        // West range inner wall
        var innerGeo = new THREE.BoxGeometry(4, 14, 80);
        makeMesh(innerGeo, 0xC8BDAA, -48, 7, 0);

        // West range floor
        var floorGeo = new THREE.BoxGeometry(12, 1, 80);
        makeMesh(floorGeo, 0xB8AA90, -54, 0.5, 0);

        // West range upper window openings (great hall facade)
        var winGeo = new THREE.BoxGeometry(2, 7, 4);
        for (var j = 0; j < 4; j++) {
            makeMesh(winGeo, 0x1A1A2E, -59, 11, -18 + j * 12);
        }
    }

    function buildPalaceCornerTowers() {
        // NW tower
        var twrGeo = new THREE.CylinderGeometry(7, 8, 22, 8);
        makeMesh(twrGeo, 0xD4C9B0, -60, 11, -50);
        var twrTopGeo = new THREE.CylinderGeometry(7, 7, 3, 8);
        makeMesh(twrTopGeo, 0xBFB49A, -60, 23.5, -50);

        // NE tower
        var twrGeo2 = new THREE.CylinderGeometry(7, 8, 22, 8);
        makeMesh(twrGeo2, 0xD4C9B0, 60, 11, -50);
        var twrTopGeo2 = new THREE.CylinderGeometry(7, 7, 3, 8);
        makeMesh(twrTopGeo2, 0xBFB49A, 60, 23.5, -50);

        // SW tower
        var twrGeo3 = new THREE.CylinderGeometry(7, 8, 22, 8);
        makeMesh(twrGeo3, 0xD4C9B0, -60, 11, 50);
        var twrTopGeo3 = new THREE.CylinderGeometry(7, 7, 3, 8);
        makeMesh(twrTopGeo3, 0xBFB49A, -60, 23.5, 50);

        // SE tower
        var twrGeo4 = new THREE.CylinderGeometry(7, 8, 22, 8);
        makeMesh(twrGeo4, 0xD4C9B0, 60, 11, 50);
        var twrTopGeo4 = new THREE.CylinderGeometry(7, 7, 3, 8);
        makeMesh(twrTopGeo4, 0xBFB49A, 60, 23.5, 50);

        // Stair turret NW (octagonal)
        var turretGeo = new THREE.CylinderGeometry(3, 3.5, 20, 8);
        makeMesh(turretGeo, 0xC8BDAA, -50, 10, -50);

        // Stair turret SE
        var turretGeo2 = new THREE.CylinderGeometry(3, 3.5, 20, 8);
        makeMesh(turretGeo2, 0xC8BDAA, 50, 10, 50);
    }

    function buildCourtyardFountain() {
        // Fountain base plinth
        var baseGeo = new THREE.CylinderGeometry(6, 7, 1.5, 12);
        makeMesh(baseGeo, 0xC8B89A, 0, 0.75, 0);

        // Fountain lower bowl
        var bowlGeo = new THREE.CylinderGeometry(4, 5, 2, 12);
        makeMesh(bowlGeo, 0xD4C9B0, 0, 2.5, 0);

        // Fountain central column
        var colGeo = new THREE.CylinderGeometry(0.8, 1.0, 5, 8);
        makeMesh(colGeo, 0xBFB49A, 0, 5.5, 0);

        // Fountain upper bowl
        var upperBowlGeo = new THREE.CylinderGeometry(2.5, 2.5, 1.2, 12);
        makeMesh(upperBowlGeo, 0xD4C9B0, 0, 8.5, 0);

        // Fountain finial
        var finialGeo = new THREE.ConeGeometry(0.6, 2, 8);
        makeMesh(finialGeo, 0xC8B89A, 0, 10.5, 0);

        // Decorative corner posts around fountain
        var postGeo = new THREE.BoxGeometry(1, 3, 1);
        makeMesh(postGeo, 0xC8B89A, 7, 1.5, 0);
        makeMesh(postGeo, 0xC8B89A, -7, 1.5, 0);
        makeMesh(postGeo, 0xC8B89A, 0, 1.5, 7);
        makeMesh(postGeo, 0xC8B89A, 0, 1.5, -7);
    }

    function buildOuterGateway() {
        // Gateway left pier
        var pierGeo = new THREE.BoxGeometry(8, 20, 10);
        makeMesh(pierGeo, 0xD4C9B0, -9, 10, -70);

        // Gateway right pier
        var pierGeo2 = new THREE.BoxGeometry(8, 20, 10);
        makeMesh(pierGeo2, 0xD4C9B0, 9, 10, -70);

        // Portcullis slot arch lintel
        var lintelGeo = new THREE.BoxGeometry(18, 3, 4);
        makeMesh(lintelGeo, 0xBFB49A, 0, 19, -70);

        // Portcullis slot (dark recess)
        var slotGeo = new THREE.BoxGeometry(10, 15, 2);
        makeMesh(slotGeo, 0x1A1A1A, 0, 9, -68);

        // Gatehouse upper walkway
        var walkGeo = new THREE.BoxGeometry(18, 3, 8);
        makeMesh(walkGeo, 0xD4C9B0, 0, 21, -70);

        // Gateway flanking wall left
        var flankGeo = new THREE.BoxGeometry(4, 12, 20);
        makeMesh(flankGeo, 0xD4C9B0, -22, 6, -70);

        // Gateway flanking wall right
        var flankGeo2 = new THREE.BoxGeometry(4, 12, 20);
        makeMesh(flankGeo2, 0xD4C9B0, 22, 6, -70);
    }

    function buildGreatHallWindows() {
        // Great hall is in south range — additional tall window openings on courtyard face
        var winGeo = new THREE.BoxGeometry(4, 9, 2);
        for (var i = 0; i < 6; i++) {
            makeMesh(winGeo, 0x0D0D1A, -25 + i * 10, 10, 37);
        }

        // Tracery suggestion — thin horizontal bar across each window
        var traceGeo = new THREE.BoxGeometry(3, 0.6, 1.5);
        for (var j = 0; j < 6; j++) {
            makeMesh(traceGeo, 0xC8BDAA, -25 + j * 10, 12, 37);
        }
    }

    function buildStMichaelsChurch() {
        // Church nave body
        var naveGeo = new THREE.BoxGeometry(22, 16, 50);
        makeMesh(naveGeo, 0xC8B89A, -100, 8, -10);

        // Nave roof ridge (wedge approximated by two sloped boxes)
        var roofGeo = new THREE.BoxGeometry(22, 5, 50);
        makeMesh(roofGeo, 0xA09080, -100, 18.5, -10, 0, 0, 0.38);

        var roofGeo2 = new THREE.BoxGeometry(22, 5, 50);
        makeMesh(roofGeo2, 0xA09080, -100, 18.5, -10, 0, 0, -0.38);

        // North transept
        var transeptNGeo = new THREE.BoxGeometry(16, 14, 18);
        makeMesh(transeptNGeo, 0xC8B89A, -100, 7, -30);

        // South transept
        var transeptSGeo = new THREE.BoxGeometry(16, 14, 18);
        makeMesh(transeptSGeo, 0xC8B89A, -100, 7, 10);

        // Chancel / choir east end
        var chancelGeo = new THREE.BoxGeometry(14, 14, 16);
        makeMesh(chancelGeo, 0xC8B89A, -100, 7, -38);

        // West tower base
        var twrBaseGeo = new THREE.BoxGeometry(14, 22, 14);
        makeMesh(twrBaseGeo, 0xC8B89A, -100, 11, 18);

        // Pointed west window
        var westWinGeo = new THREE.BoxGeometry(6, 10, 2);
        makeMesh(westWinGeo, 0x0D0D1A, -100, 13, 25);

        // Nave clerestory windows
        var clereGeo = new THREE.BoxGeometry(3, 5, 1.5);
        for (var i = 0; i < 5; i++) {
            makeMesh(clereGeo, 0x1A1A2E, -89, 13, -25 + i * 9);
            makeMesh(clereGeo, 0x1A1A2E, -111, 13, -25 + i * 9);
        }

        // Buttresses on nave
        var buttGeo = new THREE.BoxGeometry(4, 14, 5);
        for (var j = 0; j < 4; j++) {
            makeMesh(buttGeo, 0xB8A890, -89, 7, -20 + j * 12);
            makeMesh(buttGeo, 0xB8A890, -111, 7, -20 + j * 12);
        }
    }

    function buildChurchCrownSpire() {
        // Crown spire shaft
        var shaftGeo = new THREE.CylinderGeometry(2.5, 3, 20, 8);
        makeMesh(shaftGeo, 0xC0C8C8, -100, 32, 18);

        // Crown spire mid flare (the 1964 aluminium crown)
        var crownGeo = new THREE.CylinderGeometry(5, 2.5, 5, 8);
        makeMesh(crownGeo, 0xD8E0E0, -100, 44.5, 18);

        // Crown spire upper cone
        var spireGeo = new THREE.ConeGeometry(5, 10, 8);
        makeMesh(spireGeo, 0xD0D8D8, -100, 52, 18);

        // Crown decorative points around flare
        var pointGeo = new THREE.ConeGeometry(0.8, 4, 6);
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            makeMesh(pointGeo, 0xC8D0D0, -100 + Math.cos(angle) * 5, 49, 18 + Math.sin(angle) * 5);
        }
    }

    function buildTownCentre() {
        // High Street Georgian terrace buildings — row of boxes
        var houseGeo = new THREE.BoxGeometry(12, 10, 8);
        for (var i = 0; i < 6; i++) {
            makeMesh(houseGeo, 0xF5F0E8, -160 + i * 14, 5, -20);
        }

        // Rooflines — pitched
        var roofGeo = new THREE.BoxGeometry(12, 4, 8);
        for (var j = 0; j < 6; j++) {
            makeMesh(roofGeo, 0xCD5C5C, -160 + j * 14, 12, -20, 0, 0, 0.4);
        }

        // Opposite row
        for (var k = 0; k < 5; k++) {
            makeMesh(houseGeo, 0xEDE8DC, -155 + k * 14, 5, -36);
        }
        for (var l = 0; l < 5; l++) {
            makeMesh(roofGeo, 0xCD5C5C, -155 + l * 14, 12, -36, 0, 0, -0.4);
        }

        // Cross House — prominent 3-storey Georgian building
        var crossHouseGeo = new THREE.BoxGeometry(18, 15, 14);
        makeMesh(crossHouseGeo, 0xF5F0E8, -140, 7.5, -28);
        var crossHouseRoofGeo = new THREE.BoxGeometry(18, 5, 14);
        makeMesh(crossHouseRoofGeo, 0x8B6A6A, -140, 17.5, -28);

        // Town road surface
        var roadGeo = new THREE.BoxGeometry(200, 0.5, 14);
        makeMesh(roadGeo, 0x4A4A4A, -140, 0.2, -28);

        // Pavement
        var pavGeo = new THREE.BoxGeometry(200, 0.4, 3);
        makeMesh(pavGeo, 0xC8C0B0, -140, 0.2, -22);
        makeMesh(pavGeo, 0xC8C0B0, -140, 0.2, -34);
    }

    function buildLinlithgowCross() {
        // Market Cross base plinth — octagonal stepped
        var step1Geo = new THREE.CylinderGeometry(5, 5.5, 1, 8);
        makeMesh(step1Geo, 0xC8B89A, -130, 0.5, -28);

        var step2Geo = new THREE.CylinderGeometry(3.5, 4, 1, 8);
        makeMesh(step2Geo, 0xC8B89A, -130, 1.5, -28);

        // Cross shaft
        var shaftGeo = new THREE.CylinderGeometry(0.8, 1, 6, 8);
        makeMesh(shaftGeo, 0xC8B89A, -130, 5, -28);

        // Cross capital
        var capGeo = new THREE.CylinderGeometry(1.5, 0.8, 1.5, 8);
        makeMesh(capGeo, 0xBFB09A, -130, 8.75, -28);

        // Cross finial ball
        var ballGeo = new THREE.SphereGeometry(1, 8, 8);
        makeMesh(ballGeo, 0xD4C9B0, -130, 10.5, -28);
    }

    function buildUnionCanalBasin() {
        // Canal water body
        var canalGeo = new THREE.BoxGeometry(200, 1, 12);
        makeMesh(canalGeo, 0x006994, -200, -0.5, 70);

        // Canal tow path
        var towGeo = new THREE.BoxGeometry(200, 1, 5);
        makeMesh(towGeo, 0xA09070, -200, 0.2, 63);

        // Canal basin widened area
        var basinGeo = new THREE.BoxGeometry(40, 1, 30);
        makeMesh(basinGeo, 0x006994, -200, -0.5, 85);

        // Canal bank wall near side
        var bankGeo = new THREE.BoxGeometry(200, 3, 2);
        makeMesh(bankGeo, 0x8B7A60, -200, 1.5, 58);

        // Canal bank wall far side
        var bankGeo2 = new THREE.BoxGeometry(200, 3, 2);
        makeMesh(bankGeo2, 0x8B7A60, -200, 1.5, 82);

        // Canal warehouse building
        var wareGeo = new THREE.BoxGeometry(20, 10, 14);
        makeMesh(wareGeo, 0xC8B89A, -220, 5, 55);
        var wareRoofGeo = new THREE.BoxGeometry(20, 4, 14);
        makeMesh(wareRoofGeo, 0x554444, -220, 12, 55);

        // Lock gate posts
        var lockPostGeo = new THREE.BoxGeometry(2, 5, 2);
        makeMesh(lockPostGeo, 0x6A5A40, -180, 2.5, 60);
        makeMesh(lockPostGeo, 0x6A5A40, -180, 2.5, 80);

        // Lock gate beams
        var beamGeo = new THREE.BoxGeometry(20, 1, 1.5);
        makeMesh(beamGeo, 0x6A5A40, -180, 2.5, 60);
        makeMesh(beamGeo, 0x6A5A40, -180, 2.5, 80);
    }

    function buildBeecraigsPark() {
        // Reservoir water body
        var reservoirGeo = new THREE.BoxGeometry(80, 1, 60);
        makeMesh(reservoirGeo, 0x006994, 150, -0.5, 180);

        // Reservoir embankment dam wall
        var damGeo = new THREE.BoxGeometry(80, 6, 8);
        makeMesh(damGeo, 0x7A7060, 150, 3, 152);

        // Woodland trees — cylinder trunks + cone canopies
        var trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 5, 6);
        var canopyGeo = new THREE.ConeGeometry(4, 8, 8);

        var treePositions = [
            [100, 0, 160], [110, 0, 175], [120, 0, 155], [105, 0, 200],
            [115, 0, 215], [95, 0, 185], [90, 0, 165], [130, 0, 190],
            [140, 0, 170], [100, 0, 220], [130, 0, 145], [145, 0, 155],
            [160, 0, 140], [170, 0, 155], [175, 0, 170], [165, 0, 185],
            [180, 0, 200], [195, 0, 165], [190, 0, 180], [185, 0, 195]
        ];

        for (var t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            var trunkGeoI = new THREE.CylinderGeometry(0.6, 0.8, 5, 6);
            makeMesh(trunkGeoI, 0x6B4A2A, tp[0], tp[1] + 2.5, tp[2]);
            var canopyGeoI = new THREE.ConeGeometry(4, 8, 8);
            makeMesh(canopyGeoI, 0x2D6A2D, tp[0], tp[1] + 10, tp[2]);
        }

        // Park visitor centre building
        var vcGeo = new THREE.BoxGeometry(16, 6, 10);
        makeMesh(vcGeo, 0xD4C9B0, 110, 3, 145);
        var vcRoofGeo = new THREE.BoxGeometry(16, 3, 10);
        makeMesh(vcRoofGeo, 0x556644, 110, 7.5, 145);
    }

    function buildAntonineWall() {
        // Antonine Wall earthwork — long low mound
        var wallBodyGeo = new THREE.BoxGeometry(300, 4, 8);
        makeMesh(wallBodyGeo, 0x8B7355, -50, 2, 260);

        // Wall stone facing north
        var facingGeo = new THREE.BoxGeometry(300, 3, 2);
        makeMesh(facingGeo, 0x9A8265, -50, 1.5, 256);

        // Wall stone facing south
        var facingGeo2 = new THREE.BoxGeometry(300, 3, 2);
        makeMesh(facingGeo2, 0x9A8265, -50, 1.5, 264);

        // Ditch in front — dark sunken strip
        var ditchGeo = new THREE.BoxGeometry(300, 2, 12);
        makeMesh(ditchGeo, 0x5A4A2A, -50, -1, 248);

        // Wall turret remains
        var turretGeo = new THREE.BoxGeometry(8, 5, 10);
        makeMesh(turretGeo, 0x8B7355, 30, 2.5, 260);
        makeMesh(turretGeo, 0x8B7355, -60, 2.5, 260);

        // Informational marker stones
        var markerGeo = new THREE.BoxGeometry(1.5, 2, 0.5);
        makeMesh(markerGeo, 0xA09080, 0, 1, 256);
        makeMesh(markerGeo, 0xA09080, -30, 1, 256);
    }

    function buildRailwayViaduct() {
        // Victorian stone railway viaduct — series of arch piers
        var pierGeo = new THREE.BoxGeometry(6, 16, 6);
        var archGeo = new THREE.BoxGeometry(14, 4, 6);
        var deckGeo = new THREE.BoxGeometry(14, 3, 6);

        for (var v = 0; v < 7; v++) {
            // Pier
            var pierGeoI = new THREE.BoxGeometry(6, 16, 6);
            makeMesh(pierGeoI, 0xC8B89A, -240 + v * 16, 8, -80);

            // Arch lintel between piers (spans)
            if (v < 6) {
                var archGeoI = new THREE.BoxGeometry(10, 4, 6);
                makeMesh(archGeoI, 0xC8B89A, -234 + v * 16, 15, -80);

                // Arch underside curve suggestion
                var archCurveGeo = new THREE.CylinderGeometry(5, 5, 6, 8, 1, false, 0, Math.PI);
                makeMesh(archCurveGeo, 0xBFB49A, -234 + v * 16, 13, -80, 0, 0, Math.PI);
            }
        }

        // Viaduct deck parapet walls
        var parapetGeo = new THREE.BoxGeometry(96, 2, 1.5);
        makeMesh(parapetGeo, 0xC8B89A, -240, 19.5, -77);
        makeMesh(parapetGeo, 0xC8B89A, -240, 19.5, -83);

        // Railway track surface
        var trackGeo = new THREE.BoxGeometry(96, 1, 5);
        makeMesh(trackGeo, 0x3A3530, -240, 18.5, -80);

        // Rail left
        var railGeo = new THREE.BoxGeometry(96, 0.5, 0.5);
        makeMesh(railGeo, 0x707070, -240, 19.2, -79);
        makeMesh(railGeo, 0x707070, -240, 19.2, -81);
    }

    function buildPalaceGrounds() {
        // Palace forecourt paving
        var foreGeo = new THREE.BoxGeometry(40, 0.5, 20);
        makeMesh(foreGeo, 0xB8AA90, 0, 0.2, -62);

        // Ornamental garden area south of palace
        var gardenGeo = new THREE.BoxGeometry(80, 0.5, 30);
        makeMesh(gardenGeo, 0x4A7A3A, 0, 0.2, 75);

        // Garden border hedges
        var hedgeGeo = new THREE.BoxGeometry(80, 3, 2);
        makeMesh(hedgeGeo, 0x2D5A2D, 0, 1.5, 72);
        makeMesh(hedgeGeo, 0x2D5A2D, 0, 1.5, 90);

        // Garden cross-path
        var pathGeo = new THREE.BoxGeometry(2, 0.6, 18);
        makeMesh(pathGeo, 0xC8B890, 0, 0.3, 81);

        // Palace well in courtyard
        var wellGeo = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
        makeMesh(wellGeo, 0x9A8A70, -20, 1, 10);

        // Well coping stones
        var copingGeo = new THREE.CylinderGeometry(2, 2, 0.5, 8);
        makeMesh(copingGeo, 0xB0A080, -20, 2.25, 10);

        // Scattered ruin stonework on courtyard
        var ruinGeo = new THREE.BoxGeometry(4, 1.5, 3);
        makeMesh(ruinGeo, 0xBFB49A, 20, 0.75, -20);
        makeMesh(ruinGeo, 0xBFB49A, -25, 0.75, 25);
        makeMesh(ruinGeo, 0xBFB49A, 30, 0.75, 15);
    }

    function update(delta) {
        // static environment — no animation required
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
