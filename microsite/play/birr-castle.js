window.BirrCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18880;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
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
        buildCastleMainBody();
        buildCastleTowers();
        buildCastleGatehouse();
        buildCastleWalls();
        buildCastleBattlements();
        buildGreatTelescope();
        buildObservatoryBuilding();
        buildCastleGardens();
        buildRiverCamcor();
        buildOrnamentalBridge();
        buildWalledKitchenGarden();
        buildBirrTown();
        buildDoolysHotel();
        buildTownSquare();
        buildStBrendansCathedral();
        buildScienceHeritageCentre();
        buildTreesAndLandscape();
    }

    function buildGround() {
        // Ground platform — using many BoxGeometry slabs
        var geo = new THREE.BoxGeometry(600, 2, 600);
        makeMesh(geo, 0x3B6B35, 0, -1, 0);

        // Demesne lawn areas
        var lawn1 = new THREE.BoxGeometry(200, 1, 200);
        makeMesh(lawn1, 0x228B22, -50, 0, -50);

        var lawn2 = new THREE.BoxGeometry(150, 1, 150);
        makeMesh(lawn2, 0x32CD32, 80, 0, 60);
    }

    function buildCastleMainBody() {
        // Main castle keep — Gothic Revival, Earls of Rosse
        var mainBody = new THREE.BoxGeometry(50, 40, 35);
        makeMesh(mainBody, 0x8B7355, 0, 20, 0);

        // Upper floor extension
        var upperFloor = new THREE.BoxGeometry(46, 10, 31);
        makeMesh(upperFloor, 0x7A6444, 0, 45, 0);

        // Castle roof sections
        var roofLeft = new THREE.BoxGeometry(20, 8, 33);
        makeMesh(roofLeft, 0x6B5B3E, -13, 54, 0);

        var roofRight = new THREE.BoxGeometry(20, 8, 33);
        makeMesh(roofRight, 0x6B5B3E, 13, 54, 0);

        // Central parapet row
        var parapet = new THREE.BoxGeometry(52, 4, 4);
        makeMesh(parapet, 0x8B7355, 0, 52, -18);

        var parapetBack = new THREE.BoxGeometry(52, 4, 4);
        makeMesh(parapetBack, 0x8B7355, 0, 52, 18);

        // Windows (recessed dark boxes)
        for (var i = -2; i <= 2; i++) {
            var win = new THREE.BoxGeometry(4, 6, 1);
            makeMesh(win, 0x2F2F2F, i * 9, 18, -18);
        }
        for (var j = -2; j <= 2; j++) {
            var win2 = new THREE.BoxGeometry(4, 6, 1);
            makeMesh(win2, 0x2F2F2F, j * 9, 32, -18);
        }

        // Door archway
        var doorway = new THREE.BoxGeometry(6, 10, 2);
        makeMesh(doorway, 0x1A1A1A, 0, 5, -18);
    }

    function buildCastleTowers() {
        // Four corner towers — Gothic Revival style
        var towerPositions = [
            [-30, 0, -20],
            [30, 0, -20],
            [-30, 0, 20],
            [30, 0, 20]
        ];

        for (var t = 0; t < towerPositions.length; t++) {
            var tp = towerPositions[t];
            // Tower body
            var towerBody = new THREE.BoxGeometry(14, 50, 14);
            makeMesh(towerBody, 0x8B7355, tp[0], 25, tp[2]);

            // Tower top cap
            var towerTop = new THREE.BoxGeometry(16, 5, 16);
            makeMesh(towerTop, 0x7A6444, tp[0], 52, tp[2]);

            // Tower battlements — four sides
            var batt1 = new THREE.BoxGeometry(4, 4, 2);
            makeMesh(batt1, 0x8B7355, tp[0] - 4, 57, tp[2] - 7);
            var batt2 = new THREE.BoxGeometry(4, 4, 2);
            makeMesh(batt2, 0x8B7355, tp[0] + 4, 57, tp[2] - 7);
            var batt3 = new THREE.BoxGeometry(2, 4, 4);
            makeMesh(batt3, 0x8B7355, tp[0] - 7, 57, tp[2]);
            var batt4 = new THREE.BoxGeometry(2, 4, 4);
            makeMesh(batt4, 0x8B7355, tp[0] + 7, 57, tp[2]);

            // Arrow slits
            var slit = new THREE.BoxGeometry(1, 5, 2);
            makeMesh(slit, 0x1A1A1A, tp[0], 30, tp[2] - 7);
        }

        // Two extra flanking turrets on main facade
        var turret1 = new THREE.BoxGeometry(8, 45, 8);
        makeMesh(turret1, 0x8B7355, -15, 22, -21);

        var turret2 = new THREE.BoxGeometry(8, 45, 8);
        makeMesh(turret2, 0x8B7355, 15, 22, -21);
    }

    function buildCastleGatehouse() {
        // Medieval-looking gatehouse at front
        var gateLeft = new THREE.BoxGeometry(10, 30, 10);
        makeMesh(gateLeft, 0x8B7355, -10, 15, -35);

        var gateRight = new THREE.BoxGeometry(10, 30, 10);
        makeMesh(gateRight, 0x8B7355, 10, 15, -35);

        // Arch over gate passage
        var archTop = new THREE.BoxGeometry(20, 6, 8);
        makeMesh(archTop, 0x7A6444, 0, 28, -35);

        // Gate portcullis opening
        var portcullis = new THREE.BoxGeometry(10, 18, 2);
        makeMesh(portcullis, 0x2A2A1A, 0, 10, -36);

        // Gatehouse battlements
        var gBatt1 = new THREE.BoxGeometry(4, 4, 3);
        makeMesh(gBatt1, 0x8B7355, -14, 33, -35);
        var gBatt2 = new THREE.BoxGeometry(4, 4, 3);
        makeMesh(gBatt2, 0x8B7355, -6, 33, -35);
        var gBatt3 = new THREE.BoxGeometry(4, 4, 3);
        makeMesh(gBatt3, 0x8B7355, 6, 33, -35);
        var gBatt4 = new THREE.BoxGeometry(4, 4, 3);
        makeMesh(gBatt4, 0x8B7355, 14, 33, -35);

        // Drawbridge approach
        var drawbridge = new THREE.BoxGeometry(12, 1, 15);
        makeMesh(drawbridge, 0x5C4A2A, 0, 0, -43);
    }

    function buildCastleWalls() {
        // Perimeter curtain walls
        var wallN = new THREE.BoxGeometry(120, 12, 4);
        makeMesh(wallN, 0x8B7355, -20, 6, -55);

        var wallS = new THREE.BoxGeometry(120, 12, 4);
        makeMesh(wallS, 0x8B7355, -20, 6, 40);

        var wallE = new THREE.BoxGeometry(4, 12, 100);
        makeMesh(wallE, 0x8B7355, 40, 6, -8);

        var wallW = new THREE.BoxGeometry(4, 12, 100);
        makeMesh(wallW, 0x8B7355, -80, 6, -8);

        // Wall walk capping stones
        var capN = new THREE.BoxGeometry(120, 2, 5);
        makeMesh(capN, 0x7A6444, -20, 13, -55);
        var capS = new THREE.BoxGeometry(120, 2, 5);
        makeMesh(capS, 0x7A6444, -20, 13, 40);
    }

    function buildCastleBattlements() {
        // Merlons along north curtain wall
        for (var m = 0; m < 8; m++) {
            var merlon = new THREE.BoxGeometry(5, 5, 4);
            makeMesh(merlon, 0x8B7355, -65 + m * 14, 16, -55);
        }
        // Merlons south wall
        for (var ms = 0; ms < 8; ms++) {
            var merlonS = new THREE.BoxGeometry(5, 5, 4);
            makeMesh(merlonS, 0x8B7355, -65 + ms * 14, 16, 40);
        }
    }

    function buildGreatTelescope() {
        // The Leviathan of Parsonstown — world's largest telescope 1845-1917
        // Two massive masonry walls (north and south walls)
        var wallA = new THREE.BoxGeometry(8, 22, 70);
        makeMesh(wallA, 0x696969, -110, 11, -10);

        var wallB = new THREE.BoxGeometry(8, 22, 70);
        makeMesh(wallB, 0x696969, -90, 11, -10);

        // Wall caps
        var capA = new THREE.BoxGeometry(10, 3, 72);
        makeMesh(capA, 0x5A5A5A, -110, 23, -10);
        var capB = new THREE.BoxGeometry(10, 3, 72);
        makeMesh(capB, 0x5A5A5A, -90, 23, -10);

        // Buttresses on the walls
        for (var b = 0; b < 5; b++) {
            var buttA = new THREE.BoxGeometry(5, 20, 5);
            makeMesh(buttA, 0x696969, -113, 10, -35 + b * 15);
            var buttB = new THREE.BoxGeometry(5, 20, 5);
            makeMesh(buttB, 0x696969, -87, 10, -35 + b * 15);
        }

        // The telescope tube — massive metal cylinder, angled upward
        var telescopeTube = new THREE.CylinderGeometry(4, 4.5, 55, 12);
        makeMesh(telescopeTube, 0x808080, -100, 28, -10, 1.5708, 0, 0);

        // Telescope mirror box (lower end)
        var mirrorBox = new THREE.BoxGeometry(12, 14, 14);
        makeMesh(mirrorBox, 0x606060, -100, 20, 20);

        // Eyepiece end (upper)
        var eyepieceBox = new THREE.BoxGeometry(8, 8, 8);
        makeMesh(eyepieceBox, 0x505050, -100, 22, -38);

        // Cogwheel drive mechanism boxes
        var cogBox1 = new THREE.BoxGeometry(8, 6, 6);
        makeMesh(cogBox1, 0x4A4A4A, -115, 14, 15);

        var cogBox2 = new THREE.BoxGeometry(6, 8, 4);
        makeMesh(cogBox2, 0x4A4A4A, -85, 14, 15);

        // Cog cylinders (wheels)
        var cog1 = new THREE.CylinderGeometry(4, 4, 2, 8);
        makeMesh(cog1, 0x3A3A3A, -115, 18, 18, 0, 0, 1.5708);

        var cog2 = new THREE.CylinderGeometry(3, 3, 2, 8);
        makeMesh(cog2, 0x3A3A3A, -85, 18, 18, 0, 0, 1.5708);

        // Chain drive housing
        var chainHouse = new THREE.BoxGeometry(3, 15, 4);
        makeMesh(chainHouse, 0x555555, -112, 8, 18);

        // Observation platform / wooden gallery alongside walls
        var platform = new THREE.BoxGeometry(6, 1, 68);
        makeMesh(platform, 0x8B6914, -117, 18, -10);

        // Platform support poles
        for (var p = 0; p < 6; p++) {
            var pole = new THREE.BoxGeometry(1, 18, 1);
            makeMesh(pole, 0x6B5414, -117, 9, -35 + p * 12);
        }
    }

    function buildObservatoryBuilding() {
        // Stone building adjacent to telescope
        var obsMain = new THREE.BoxGeometry(30, 16, 20);
        makeMesh(obsMain, 0x808080, -140, 8, -10);

        var obsRoof = new THREE.BoxGeometry(32, 5, 22);
        makeMesh(obsRoof, 0x6A6A6A, -140, 18, -10);

        // Dome-like box on observatory
        var dome = new THREE.BoxGeometry(14, 10, 14);
        makeMesh(dome, 0x909090, -140, 25, -10);

        // Observatory door
        var obsDoor = new THREE.BoxGeometry(4, 7, 2);
        makeMesh(obsDoor, 0x2A1A0A, -140, 4, -21);

        // Observatory windows
        var obsWin1 = new THREE.BoxGeometry(4, 4, 1);
        makeMesh(obsWin1, 0x87CEEB, -150, 10, -21);
        var obsWin2 = new THREE.BoxGeometry(4, 4, 1);
        makeMesh(obsWin2, 0x87CEEB, -130, 10, -21);

        // Small outbuilding / workshop
        var workshop = new THREE.BoxGeometry(18, 12, 14);
        makeMesh(workshop, 0x787878, -160, 6, 20);
        var workshopRoof = new THREE.BoxGeometry(20, 4, 16);
        makeMesh(workshopRoof, 0x606060, -160, 14, 20);
    }

    function buildCastleGardens() {
        // Formal garden layout — box hedges and paths
        // Hedge rows (dark green boxes)
        for (var h = 0; h < 5; h++) {
            var hedgeN = new THREE.BoxGeometry(2, 3, 30);
            makeMesh(hedgeN, 0x1A5C1A, 20 + h * 15, 1, -70);
        }

        for (var hh = 0; hh < 4; hh++) {
            var hedgeE = new THREE.BoxGeometry(55, 3, 2);
            makeMesh(hedgeE, 0x1A5C1A, 47, 1, -85 + hh * 10);
        }

        // Circular garden bed — approximated with small boxes in a ring
        for (var c = 0; c < 8; c++) {
            var angle = c * 0.785398;
            var cx = Math.cos(angle) * 15;
            var cz = Math.sin(angle) * 15;
            var bedBox = new THREE.BoxGeometry(4, 1, 4);
            makeMesh(bedBox, 0xFF6B35, 50 + cx, 0.5, -60 + cz);
        }

        // Flower border boxes
        for (var fl = 0; fl < 8; fl++) {
            var flower = new THREE.BoxGeometry(3, 1, 8);
            makeMesh(flower, 0xFF4500, 20 + fl * 10, 0.5, -80);
        }

        // Garden path — gravel-coloured slabs
        var pathMain = new THREE.BoxGeometry(4, 0.5, 60);
        makeMesh(pathMain, 0xC8B878, 50, 0.2, -65);

        var pathCross = new THREE.BoxGeometry(60, 0.5, 4);
        makeMesh(pathCross, 0xC8B878, 30, 0.2, -60);
    }

    function buildRiverCamcor() {
        // River Camcor flowing through demesne — blue BoxGeometry strips
        var river1 = new THREE.BoxGeometry(8, 0.5, 120);
        makeMesh(river1, 0x006994, -40, 0.1, -30);

        var river2 = new THREE.BoxGeometry(8, 0.5, 60);
        makeMesh(river2, 0x006994, -55, 0.1, 30);

        var river3 = new THREE.BoxGeometry(60, 0.5, 8);
        makeMesh(river3, 0x006994, -70, 0.1, 60);

        // River bank edges
        var bank1 = new THREE.BoxGeometry(2, 2, 120);
        makeMesh(bank1, 0x4A7C2A, -45, 0.5, -30);
        var bank2 = new THREE.BoxGeometry(2, 2, 120);
        makeMesh(bank2, 0x4A7C2A, -35, 0.5, -30);
    }

    function buildOrnamentalBridge() {
        // Stone bridge over river Camcor
        var bridgeDeck = new THREE.BoxGeometry(12, 2, 14);
        makeMesh(bridgeDeck, 0x9E9E7A, -40, 2, -10);

        // Bridge parapets
        var bParL = new THREE.BoxGeometry(12, 3, 2);
        makeMesh(bParL, 0x8B8B6A, -40, 4, -17);
        var bParR = new THREE.BoxGeometry(12, 3, 2);
        makeMesh(bParR, 0x8B8B6A, -40, 4, -3);

        // Bridge arch supports (box representation)
        var archL = new THREE.BoxGeometry(4, 5, 14);
        makeMesh(archL, 0x9E9E7A, -45, -2, -10);
        var archR = new THREE.BoxGeometry(4, 5, 14);
        makeMesh(archR, 0x9E9E7A, -35, -2, -10);

        // Bridge pillars
        var pillar1 = new THREE.CylinderGeometry(1.5, 2, 6, 6);
        makeMesh(pillar1, 0x8B8B6A, -43, -2, -10);
        var pillar2 = new THREE.CylinderGeometry(1.5, 2, 6, 6);
        makeMesh(pillar2, 0x8B8B6A, -37, -2, -10);
    }

    function buildWalledKitchenGarden() {
        // High stone walls enclosing walled garden
        var wkgN = new THREE.BoxGeometry(60, 15, 4);
        makeMesh(wkgN, 0x8B7355, 60, 7, -120);

        var wkgS = new THREE.BoxGeometry(60, 15, 4);
        makeMesh(wkgS, 0x8B7355, 60, 7, -70);

        var wkgE = new THREE.BoxGeometry(4, 15, 54);
        makeMesh(wkgE, 0x8B7355, 90, 7, -95);

        var wkgW = new THREE.BoxGeometry(4, 15, 54);
        makeMesh(wkgW, 0x8B7355, 30, 7, -95);

        // Garden interior beds
        for (var kg = 0; kg < 4; kg++) {
            var kgBed = new THREE.BoxGeometry(20, 0.5, 8);
            makeMesh(kgBed, 0x5A3A1A, 60, 0.2, -115 + kg * 12);
        }

        // Fruit trees (box hedges)
        for (var ft = 0; ft < 6; ft++) {
            var ftBox = new THREE.BoxGeometry(4, 4, 4);
            makeMesh(ftBox, 0x2E8B2E, 40 + ft * 9, 2, -100);
        }

        // Garden gate
        var gate = new THREE.BoxGeometry(6, 12, 2);
        makeMesh(gate, 0x4A3A1A, 60, 6, -70);
    }

    function buildBirrTown() {
        // Georgian streetscape — terraced houses
        var streetPositions = [
            [120, 0], [130, 0], [140, 0], [150, 0],
            [160, 0], [170, 0], [180, 0]
        ];

        for (var s = 0; s < streetPositions.length; s++) {
            var sp = streetPositions[s];
            // Georgian terrace house
            var house = new THREE.BoxGeometry(10, 18, 12);
            makeMesh(house, 0xC8A87A, sp[0], 9, sp[1] - 80);

            // House roof
            var houseRoof = new THREE.BoxGeometry(11, 5, 13);
            makeMesh(houseRoof, 0x8B2500, sp[0], 20, sp[1] - 80);

            // Sash windows
            var hw1 = new THREE.BoxGeometry(2, 3, 1);
            makeMesh(hw1, 0x87CEEB, sp[0] - 2, 12, sp[1] - 86);
            var hw2 = new THREE.BoxGeometry(2, 3, 1);
            makeMesh(hw2, 0x87CEEB, sp[0] + 2, 12, sp[1] - 86);
            var hw3 = new THREE.BoxGeometry(2, 3, 1);
            makeMesh(hw3, 0x87CEEB, sp[0] - 2, 6, sp[1] - 86);
            var hw4 = new THREE.BoxGeometry(2, 3, 1);
            makeMesh(hw4, 0x87CEEB, sp[0] + 2, 6, sp[1] - 86);
        }

        // Opposite row of buildings
        for (var s2 = 0; s2 < 6; s2++) {
            var house2 = new THREE.BoxGeometry(10, 16, 12);
            makeMesh(house2, 0xB89868, 120 + s2 * 12, 8, -65);
            var roof2 = new THREE.BoxGeometry(11, 4, 13);
            makeMesh(roof2, 0x7A2000, 120 + s2 * 12, 18, -65);
        }

        // Town main street (road surface)
        var mainStreet = new THREE.BoxGeometry(10, 0.3, 80);
        makeMesh(mainStreet, 0x555555, 150, 0.1, -75);

        // Footpaths
        var footpathE = new THREE.BoxGeometry(3, 0.3, 80);
        makeMesh(footpathE, 0x888888, 156, 0.2, -75);
        var footpathW = new THREE.BoxGeometry(3, 0.3, 80);
        makeMesh(footpathW, 0x888888, 144, 0.2, -75);
    }

    function buildDoolysHotel() {
        // Dooly's Hotel — famous coaching inn, c.1747
        var hotelMain = new THREE.BoxGeometry(28, 22, 18);
        makeMesh(hotelMain, 0x8B0000, 200, 11, -80);

        // Hotel upper floor
        var hotelUpper = new THREE.BoxGeometry(28, 8, 18);
        makeMesh(hotelUpper, 0x780000, 200, 26, -80);

        // Hotel roof
        var hotelRoof = new THREE.BoxGeometry(30, 6, 20);
        makeMesh(hotelRoof, 0x4A0000, 200, 32, -80);

        // Georgian fanlight door
        var hotelDoor = new THREE.BoxGeometry(5, 9, 1);
        makeMesh(hotelDoor, 0x1A0A0A, 200, 5, -90);

        // Hotel windows — Georgian proportions
        for (var hw = -2; hw <= 2; hw++) {
            var hotelWin = new THREE.BoxGeometry(3, 5, 1);
            makeMesh(hotelWin, 0x87CEEB, 200 + hw * 5, 16, -90);
            var hotelWin2 = new THREE.BoxGeometry(3, 5, 1);
            makeMesh(hotelWin2, 0x87CEEB, 200 + hw * 5, 24, -90);
        }

        // Hotel sign board
        var signBoard = new THREE.BoxGeometry(16, 4, 1);
        makeMesh(signBoard, 0x2A0000, 200, 10, -90);

        // Coach house / stable block behind hotel
        var stableBlock = new THREE.BoxGeometry(20, 12, 14);
        makeMesh(stableBlock, 0x9E8060, 200, 6, -68);
        var stableRoof = new THREE.BoxGeometry(22, 4, 16);
        makeMesh(stableRoof, 0x6B4020, 200, 14, -68);

        // Yard archway
        var archYard = new THREE.BoxGeometry(8, 14, 4);
        makeMesh(archYard, 0x8B0000, 200, 7, -72);
        var archPassage = new THREE.BoxGeometry(4, 10, 4);
        makeMesh(archPassage, 0x1A0A0A, 200, 5, -72);
    }

    function buildTownSquare() {
        // Town square / market place
        var squarePaving = new THREE.BoxGeometry(40, 0.3, 40);
        makeMesh(squarePaving, 0xAA9970, 150, 0.1, -40);

        // Central column / monument
        var columnBase = new THREE.BoxGeometry(5, 3, 5);
        makeMesh(columnBase, 0xC0C0C0, 150, 1, -40);

        var columnShaft = new THREE.CylinderGeometry(1, 1.2, 20, 8);
        makeMesh(columnShaft, 0xB0B0B0, 150, 12, -40);

        var columnCapital = new THREE.BoxGeometry(3, 2, 3);
        makeMesh(columnCapital, 0xA0A0A0, 150, 23, -40);

        // Statue sphere on top
        var statue = new THREE.SphereGeometry(2, 8, 6);
        makeMesh(statue, 0x909090, 150, 27, -40);

        // Market cross / pump
        var pumpBase = new THREE.CylinderGeometry(2, 2.5, 4, 8);
        makeMesh(pumpBase, 0x808070, 165, 2, -40);

        // Bench boxes around square
        for (var bn = 0; bn < 4; bn++) {
            var bench = new THREE.BoxGeometry(6, 1, 2);
            makeMesh(bench, 0x4A3010, 135 + bn * 10, 0.5, -20);
        }
    }

    function buildStBrendansCathedral() {
        // Church of Ireland Cathedral
        var navMain = new THREE.BoxGeometry(22, 20, 50);
        makeMesh(navMain, 0x808080, 100, 10, -140);

        // Nave roof (box approximation)
        var naveRoof = new THREE.BoxGeometry(24, 8, 52);
        makeMesh(naveRoof, 0x606060, 100, 24, -140);

        // Chancel
        var chancel = new THREE.BoxGeometry(14, 16, 18);
        makeMesh(chancel, 0x808080, 100, 8, -170);
        var chancelRoof = new THREE.BoxGeometry(16, 6, 20);
        makeMesh(chancelRoof, 0x606060, 100, 19, -170);

        // Tower with ConeGeometry spire — as specified
        var tower = new THREE.BoxGeometry(12, 35, 12);
        makeMesh(tower, 0x787878, 100, 17, -118);

        // Battlemented tower top
        var towerTop = new THREE.BoxGeometry(14, 4, 14);
        makeMesh(towerTop, 0x696969, 100, 37, -118);

        // ConeGeometry spire
        var spire = new THREE.ConeGeometry(6, 30, 8);
        makeMesh(spire, 0x505050, 100, 54, -118);

        // Gothic windows
        for (var gw = 0; gw < 4; gw++) {
            var gothWin = new THREE.BoxGeometry(4, 8, 1);
            makeMesh(gothWin, 0x87CEEB, 90 + gw * 7, 12, -115);
        }

        // Porch
        var porch = new THREE.BoxGeometry(10, 14, 8);
        makeMesh(porch, 0x808080, 100, 7, -112);
        var porchRoof = new THREE.BoxGeometry(12, 4, 10);
        makeMesh(porchRoof, 0x606060, 100, 15, -112);

        // Graveyard wall
        var gYardWall = new THREE.BoxGeometry(80, 6, 4);
        makeMesh(gYardWall, 0x707070, 100, 3, -105);

        // Graveyard — headstones (small boxes)
        for (var gs = 0; gs < 10; gs++) {
            var headstone = new THREE.BoxGeometry(1, 3, 0.4);
            makeMesh(headstone, 0x888888, 70 + gs * 5, 1.5, -120);
        }
    }

    function buildScienceHeritageCentre() {
        // Modern Science Heritage Centre / interpretation
        var centreMain = new THREE.BoxGeometry(30, 14, 22);
        makeMesh(centreMain, 0xAAAAAA, -80, 7, -90);

        // Glazed front section
        var glazed = new THREE.BoxGeometry(18, 12, 4);
        makeMesh(glazed, 0x87CEEB, -80, 6, -102);

        // Flat roof
        var flatRoof = new THREE.BoxGeometry(32, 2, 24);
        makeMesh(flatRoof, 0x888888, -80, 15, -90);

        // Entrance canopy
        var canopy = new THREE.BoxGeometry(14, 2, 8);
        makeMesh(canopy, 0x999999, -80, 12, -103);

        // Canopy supports
        var supp1 = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        makeMesh(supp1, 0x777777, -87, 6, -105);
        var supp2 = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        makeMesh(supp2, 0x777777, -73, 6, -105);

        // Display telescope model outside centre
        var displayTube = new THREE.CylinderGeometry(1, 1.2, 15, 8);
        makeMesh(displayTube, 0x606060, -65, 7, -90, 0.5, 0, 0);

        // Heritage centre sign plinth
        var plinth = new THREE.BoxGeometry(8, 3, 2);
        makeMesh(plinth, 0x909090, -80, 1, -106);
    }

    function buildTreesAndLandscape() {
        // Trees throughout demesne — trunk (CylinderGeometry) + canopy (SphereGeometry)
        var treeData = [
            [30, 0, -100], [-20, 0, -100], [10, 0, 50],
            [-30, 0, 50], [60, 0, 20], [70, 0, -20],
            [-60, 0, -80], [-70, 0, -60], [5, 0, -50],
            [-50, 0, 20], [80, 0, -80], [-90, 0, -100],
            [130, 0, -110], [120, 0, -30], [185, 0, -100],
            [220, 0, -70], [90, 0, -50], [-130, 0, 40]
        ];

        for (var tr = 0; tr < treeData.length; tr++) {
            var td = treeData[tr];
            var trunk = new THREE.CylinderGeometry(0.8, 1, 8, 6);
            makeMesh(trunk, 0x4A2800, td[0], 4, td[2]);

            var canopy = new THREE.SphereGeometry(5, 7, 5);
            makeMesh(canopy, 0x2D5A1B, td[0], 13, td[2]);
        }

        // Conifer / yew trees (ConeGeometry) in formal garden areas
        var coniferData = [
            [25, 0, -75], [35, 0, -75], [45, 0, -75],
            [55, 0, -75], [65, 0, -75], [75, 0, -75]
        ];

        for (var cf = 0; cf < coniferData.length; cf++) {
            var cd = coniferData[cf];
            var coniferTrunk = new THREE.CylinderGeometry(0.5, 0.7, 4, 6);
            makeMesh(coniferTrunk, 0x3A2000, cd[0], 2, cd[2]);
            var coniferCone = new THREE.ConeGeometry(3, 10, 7);
            makeMesh(coniferCone, 0x1A4A0A, cd[0], 12, cd[2]);
        }

        // Rock outcrops
        var rock1 = new THREE.BoxGeometry(5, 2, 4);
        makeMesh(rock1, 0x888878, -25, 0.8, 10);
        var rock2 = new THREE.BoxGeometry(3, 1.5, 3);
        makeMesh(rock2, 0x7A7A6A, -22, 0.6, 7);

        // Small pond / water feature in garden
        var pond = new THREE.BoxGeometry(12, 0.3, 10);
        makeMesh(pond, 0x006994, 55, 0.1, -50);
        var pondEdge = new THREE.BoxGeometry(14, 1, 12);
        makeMesh(pondEdge, 0x9E9E7A, 55, -0.3, -50);

        // Sundial in garden
        var sundialBase = new THREE.CylinderGeometry(2, 2.5, 3, 8);
        makeMesh(sundialBase, 0xB0A070, 45, 1.5, -55);
        var sundialPlate = new THREE.CylinderGeometry(2, 2, 0.5, 8);
        makeMesh(sundialPlate, 0xC0B080, 45, 3.2, -55);

        // Lamp posts along main path
        for (var lp = 0; lp < 5; lp++) {
            var lampPost = new THREE.CylinderGeometry(0.3, 0.4, 10, 6);
            makeMesh(lampPost, 0x2A2A2A, 50, 5, -75 + lp * 18);
            var lampHead = new THREE.SphereGeometry(1, 6, 5);
            makeMesh(lampHead, 0xFFFF80, 50, 10.5, -75 + lp * 18);
        }
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
