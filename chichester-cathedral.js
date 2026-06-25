window.ChichesterCathedral = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10280;

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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildCathedral();
        buildBellTower();
        buildRomanWalls();
        buildMarketCross();
        buildCanalBasin();
    }

    function buildCathedral() {
        var stoneColor = 0xc8b89a;
        var darkStoneColor = 0x9a8870;
        var roofColor = 0x6b7c6b;

        // Main nave — long Norman nave 35x12x18
        var naveGeo = new THREE.BoxGeometry(35, 18, 12);
        var naveMat = makeMaterial(stoneColor);
        var nave = new THREE.Mesh(naveGeo, naveMat);
        nave.position.set(X_OFFSET + 0, 9, 0);
        addMesh(nave);

        // Nave roof — pitched
        var naveRoofGeo = new THREE.BoxGeometry(36, 3, 7);
        var naveRoofMat = makeMaterial(roofColor);
        var naveRoof = new THREE.Mesh(naveRoofGeo, naveRoofMat);
        naveRoof.position.set(X_OFFSET + 0, 19.5, 0);
        addMesh(naveRoof);

        // Nave roof ridge — CylinderGeometry as ridge
        var ridgeGeo = new THREE.CylinderGeometry(1, 1, 36, 4);
        var ridgeMat = makeMaterial(roofColor);
        var ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.rotation.z = Math.PI / 2;
        ridge.position.set(X_OFFSET + 0, 21, 0);
        addMesh(ridge);

        // Transept (crossing) — crossing tower base
        var transeptGeo = new THREE.BoxGeometry(14, 18, 28);
        var transeptMat = makeMaterial(stoneColor);
        var transept = new THREE.Mesh(transeptGeo, transeptMat);
        transept.position.set(X_OFFSET + 5, 9, 0);
        addMesh(transept);

        // Transept roof
        var transeptRoofGeo = new THREE.BoxGeometry(9, 3, 29);
        var transeptRoofMat = makeMaterial(roofColor);
        var transeptRoof = new THREE.Mesh(transeptRoofGeo, transeptRoofMat);
        transeptRoof.position.set(X_OFFSET + 5, 19.5, 0);
        addMesh(transeptRoof);

        // Central crossing tower — 18 high above nave
        var crossingGeo = new THREE.BoxGeometry(10, 18, 10);
        var crossingMat = makeMaterial(stoneColor);
        var crossing = new THREE.Mesh(crossingGeo, crossingMat);
        crossing.position.set(X_OFFSET + 5, 27, 0);
        addMesh(crossing);

        // Crossing tower spire
        var crossingSpireGeo = new THREE.ConeGeometry(5, 14, 4);
        var crossingSpireMat = makeMaterial(roofColor);
        var crossingSpire = new THREE.Mesh(crossingSpireGeo, crossingSpireMat);
        crossingSpire.position.set(X_OFFSET + 5, 43, 0);
        addMesh(crossingSpire);

        // Crossing tower pinnacles (4 corners)
        var pinnacleGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 4);
        var pinnacleMat = makeMaterial(darkStoneColor);
        var pinnaclePositions = [
            [X_OFFSET + 1, 37, 1],
            [X_OFFSET + 1, 37, -1],
            [X_OFFSET + 9, 37, 1],
            [X_OFFSET + 9, 37, -1]
        ];
        for (var pi = 0; pi < pinnaclePositions.length; pi++) {
            var pinnacle = new THREE.Mesh(pinnacleGeo, pinnacleMat);
            pinnacle.position.set(pinnaclePositions[pi][0], pinnaclePositions[pi][1], pinnaclePositions[pi][2]);
            addMesh(pinnacle);
        }

        // West end — facade
        var westFacadeGeo = new THREE.BoxGeometry(3, 20, 14);
        var westFacadeMat = makeMaterial(stoneColor);
        var westFacade = new THREE.Mesh(westFacadeGeo, westFacadeMat);
        westFacade.position.set(X_OFFSET - 19, 10, 0);
        addMesh(westFacade);

        // West tower left
        var westTowerLGeo = new THREE.BoxGeometry(6, 24, 6);
        var westTowerLMat = makeMaterial(stoneColor);
        var westTowerL = new THREE.Mesh(westTowerLGeo, westTowerLMat);
        westTowerL.position.set(X_OFFSET - 20, 12, -7);
        addMesh(westTowerL);

        // West tower left spire
        var wtlSpireGeo = new THREE.ConeGeometry(3.2, 10, 4);
        var wtlSpireMat = makeMaterial(roofColor);
        var wtlSpire = new THREE.Mesh(wtlSpireGeo, wtlSpireMat);
        wtlSpire.position.set(X_OFFSET - 20, 29, -7);
        addMesh(wtlSpire);

        // West tower right
        var westTowerRGeo = new THREE.BoxGeometry(6, 24, 6);
        var westTowerRMat = makeMaterial(stoneColor);
        var westTowerR = new THREE.Mesh(westTowerRGeo, westTowerRMat);
        westTowerR.position.set(X_OFFSET - 20, 12, 7);
        addMesh(westTowerR);

        // West tower right spire
        var wtrSpireGeo = new THREE.ConeGeometry(3.2, 10, 4);
        var wtrSpireMat = makeMaterial(roofColor);
        var wtrSpire = new THREE.Mesh(wtrSpireGeo, wtrSpireMat);
        wtrSpire.position.set(X_OFFSET - 20, 29, 7);
        addMesh(wtrSpire);

        // Choir (east end)
        var choirGeo = new THREE.BoxGeometry(16, 16, 11);
        var choirMat = makeMaterial(stoneColor);
        var choir = new THREE.Mesh(choirGeo, choirMat);
        choir.position.set(X_OFFSET + 20, 8, 0);
        addMesh(choir);

        // Choir roof
        var choirRoofGeo = new THREE.BoxGeometry(17, 3, 7);
        var choirRoofMat = makeMaterial(roofColor);
        var choirRoof = new THREE.Mesh(choirRoofGeo, choirRoofMat);
        choirRoof.position.set(X_OFFSET + 20, 17.5, 0);
        addMesh(choirRoof);

        // Lady Chapel (far east)
        var ladyGeo = new THREE.BoxGeometry(8, 13, 8);
        var ladyMat = makeMaterial(stoneColor);
        var lady = new THREE.Mesh(ladyGeo, ladyMat);
        lady.position.set(X_OFFSET + 30, 6.5, 0);
        addMesh(lady);

        // Apse (rounded east end suggestion using CylinderGeometry)
        var apseGeo = new THREE.CylinderGeometry(4, 4, 13, 8);
        var apseMat = makeMaterial(stoneColor);
        var apse = new THREE.Mesh(apseGeo, apseMat);
        apse.position.set(X_OFFSET + 35, 6.5, 0);
        addMesh(apse);

        // Apse roof
        var apseRoofGeo = new THREE.ConeGeometry(4, 5, 8);
        var apseRoofMat = makeMaterial(roofColor);
        var apseRoof = new THREE.Mesh(apseRoofGeo, apseRoofMat);
        apseRoof.position.set(X_OFFSET + 35, 15.5, 0);
        addMesh(apseRoof);

        // Flying buttresses — north side of nave
        var buttressPositions = [-12, -4, 4, 12];
        for (var bi = 0; bi < buttressPositions.length; bi++) {
            var bz = buttressPositions[bi];

            // Buttress pier
            var buttressPierGeo = new THREE.BoxGeometry(2, 12, 2);
            var buttressPierMat = makeMaterial(darkStoneColor);
            var buttressPierN = new THREE.Mesh(buttressPierGeo, buttressPierMat);
            buttressPierN.position.set(X_OFFSET + bz, 6, -10);
            addMesh(buttressPierN);

            // Buttress arch (simplified box)
            var buttressArchGeo = new THREE.BoxGeometry(2, 1.5, 4);
            var buttressArchMat = makeMaterial(darkStoneColor);
            var buttressArchN = new THREE.Mesh(buttressArchGeo, buttressArchMat);
            buttressArchN.position.set(X_OFFSET + bz, 13, -8);
            addMesh(buttressArchN);

            // South side buttress pier
            var buttressPierSGeo = new THREE.BoxGeometry(2, 12, 2);
            var buttressPierSMat = makeMaterial(darkStoneColor);
            var buttressPierS = new THREE.Mesh(buttressPierSGeo, buttressPierSMat);
            buttressPierS.position.set(X_OFFSET + bz, 6, 10);
            addMesh(buttressPierS);

            // South buttress arch
            var buttressArchSGeo = new THREE.BoxGeometry(2, 1.5, 4);
            var buttressArchSMat = makeMaterial(darkStoneColor);
            var buttressArchS = new THREE.Mesh(buttressArchSGeo, buttressArchSMat);
            buttressArchS.position.set(X_OFFSET + bz, 13, 8);
            addMesh(buttressArchS);
        }

        // Arched windows — north nave wall (using thin boxes as window embrasures)
        var windowPositions = [-14, -8, -2, 4, 10, 16];
        for (var wi = 0; wi < windowPositions.length; wi++) {
            var wx = windowPositions[wi];

            // North window
            var windowGeo = new THREE.BoxGeometry(0.5, 5, 2.5);
            var windowMat = new THREE.MeshLambertMaterial({ color: 0x4a6fa5 });
            var windowNorth = new THREE.Mesh(windowGeo, windowMat);
            windowNorth.position.set(X_OFFSET + wx, 10, -6);
            addMesh(windowNorth);

            // South window
            var windowSouth = new THREE.Mesh(windowGeo, windowMat);
            windowSouth.position.set(X_OFFSET + wx, 10, 6);
            addMesh(windowSouth);
        }

        // West rose window
        var roseWindowGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 8);
        var roseWindowMat = new THREE.MeshLambertMaterial({ color: 0x7a9cbf });
        var roseWindow = new THREE.Mesh(roseWindowGeo, roseWindowMat);
        roseWindow.rotation.z = Math.PI / 2;
        roseWindow.position.set(X_OFFSET - 21, 16, 0);
        addMesh(roseWindow);

        // Cathedral floor platform
        var floorGeo = new THREE.BoxGeometry(60, 0.5, 20);
        var floorMat = makeMaterial(0xb0a090);
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(X_OFFSET + 5, 0, 0);
        addMesh(floor);
    }

    function buildBellTower() {
        var stoneColor = 0xc0aa88;
        var roofColor = 0x5a6b5a;

        // Detached bell tower campanile — 16 high, square
        var towerBaseGeo = new THREE.BoxGeometry(8, 16, 8);
        var towerBaseMat = makeMaterial(stoneColor);
        var towerBase = new THREE.Mesh(towerBaseGeo, towerBaseMat);
        towerBase.position.set(X_OFFSET - 35, 8, 0);
        addMesh(towerBase);

        // Bell tower belfry stage
        var belfryGeo = new THREE.BoxGeometry(9, 4, 9);
        var belfryMat = makeMaterial(0xb8a080);
        var belfry = new THREE.Mesh(belfryGeo, belfryMat);
        belfry.position.set(X_OFFSET - 35, 18, 0);
        addMesh(belfry);

        // Bell tower roof
        var bellRoofGeo = new THREE.ConeGeometry(5.5, 8, 4);
        var bellRoofMat = makeMaterial(roofColor);
        var bellRoof = new THREE.Mesh(bellRoofGeo, bellRoofMat);
        bellRoof.position.set(X_OFFSET - 35, 26, 0);
        addMesh(bellRoof);

        // Bell tower pinnacles
        var btPinnacleGeo = new THREE.ConeGeometry(0.5, 3, 4);
        var btPinnacleMat = makeMaterial(roofColor);
        var btPinnaclePositions = [
            [X_OFFSET - 39, 22, 4],
            [X_OFFSET - 39, 22, -4],
            [X_OFFSET - 31, 22, 4],
            [X_OFFSET - 31, 22, -4]
        ];
        for (var bpi = 0; bpi < btPinnaclePositions.length; bpi++) {
            var btp = new THREE.Mesh(btPinnacleGeo, btPinnacleMat);
            btp.position.set(btPinnaclePositions[bpi][0], btPinnaclePositions[bpi][1], btPinnaclePositions[bpi][2]);
            addMesh(btp);
        }

        // Bell tower openings (belfry louvers)
        var louverMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var louverDirections = [0, 1, 2, 3];
        for (var li = 0; li < louverDirections.length; li++) {
            var louverGeo = new THREE.BoxGeometry(3, 2.5, 0.4);
            var louver = new THREE.Mesh(louverGeo, louverMat);
            var angle = (li / 4) * Math.PI * 2;
            louver.position.set(
                X_OFFSET - 35 + Math.sin(angle) * 4.5,
                18,
                Math.cos(angle) * 4.5
            );
            louver.rotation.y = angle;
            addMesh(louver);
        }

        // Tower base surround / plinth
        var plinthGeo = new THREE.BoxGeometry(10, 1, 10);
        var plinthMat = makeMaterial(0xa09080);
        var plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.set(X_OFFSET - 35, 0.5, 0);
        addMesh(plinth);
    }

    function buildRomanWalls() {
        var wallColor = 0x8a7a68;
        var wallHeight = 3;
        var wallThickness = 2;

        // Roman rectangular city plan — approx 200x150 footprint
        // North wall
        var northWallGeo = new THREE.BoxGeometry(200, wallHeight, wallThickness);
        var northWallMat = makeMaterial(wallColor);
        var northWall = new THREE.Mesh(northWallGeo, northWallMat);
        northWall.position.set(X_OFFSET + 0, wallHeight / 2, -75);
        addMesh(northWall);

        // South wall
        var southWallGeo = new THREE.BoxGeometry(200, wallHeight, wallThickness);
        var southWallMat = makeMaterial(wallColor);
        var southWall = new THREE.Mesh(southWallGeo, southWallMat);
        southWall.position.set(X_OFFSET + 0, wallHeight / 2, 75);
        addMesh(southWall);

        // East wall
        var eastWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, 150);
        var eastWallMat = makeMaterial(wallColor);
        var eastWall = new THREE.Mesh(eastWallGeo, eastWallMat);
        eastWall.position.set(X_OFFSET + 100, wallHeight / 2, 0);
        addMesh(eastWall);

        // West wall
        var westWallGeo = new THREE.BoxGeometry(wallThickness, wallHeight, 150);
        var westWallMat = makeMaterial(wallColor);
        var westWall = new THREE.Mesh(westWallGeo, westWallMat);
        westWall.position.set(X_OFFSET - 100, wallHeight / 2, 0);
        addMesh(westWall);

        // Corner towers (4 corners of Roman walls)
        var cornerPositions = [
            [X_OFFSET + 100, 0, -75],
            [X_OFFSET + 100, 0, 75],
            [X_OFFSET - 100, 0, -75],
            [X_OFFSET - 100, 0, 75]
        ];
        for (var ci = 0; ci < cornerPositions.length; ci++) {
            var cornerGeo = new THREE.CylinderGeometry(3, 3.5, wallHeight + 2, 8);
            var cornerMat = makeMaterial(0x7a6a58);
            var corner = new THREE.Mesh(cornerGeo, cornerMat);
            corner.position.set(cornerPositions[ci][0], (wallHeight + 2) / 2, cornerPositions[ci][2]);
            addMesh(corner);
        }

        // Gate towers — north and south gates
        var gateTowerGeo = new THREE.BoxGeometry(5, wallHeight + 4, 4);
        var gateTowerMat = makeMaterial(0x7a6a58);

        var northGateL = new THREE.Mesh(gateTowerGeo, gateTowerMat);
        northGateL.position.set(X_OFFSET - 4, (wallHeight + 4) / 2, -75);
        addMesh(northGateL);

        var northGateR = new THREE.Mesh(gateTowerGeo, gateTowerMat);
        northGateR.position.set(X_OFFSET + 4, (wallHeight + 4) / 2, -75);
        addMesh(northGateR);

        var southGateL = new THREE.Mesh(gateTowerGeo, gateTowerMat);
        southGateL.position.set(X_OFFSET - 4, (wallHeight + 4) / 2, 75);
        addMesh(southGateL);

        var southGateR = new THREE.Mesh(gateTowerGeo, gateTowerMat);
        southGateR.position.set(X_OFFSET + 4, (wallHeight + 4) / 2, 75);
        addMesh(southGateR);

        // Wall battlements — north wall merlons
        for (var mi = -9; mi <= 9; mi++) {
            var merlonGeo = new THREE.BoxGeometry(2, 1, 1.5);
            var merlonMat = makeMaterial(wallColor);
            var merlon = new THREE.Mesh(merlonGeo, merlonMat);
            merlon.position.set(X_OFFSET + mi * 10, wallHeight + 0.5, -75);
            addMesh(merlon);
        }
    }

    function buildMarketCross() {
        var stoneColor = 0xd4c4a8;
        var darkStone = 0xa89878;

        // Market Cross in town center — octagonal canopy
        // Central column
        var centerColGeo = new THREE.CylinderGeometry(0.6, 0.8, 8, 8);
        var centerColMat = makeMaterial(stoneColor);
        var centerCol = new THREE.Mesh(centerColGeo, centerColMat);
        centerCol.position.set(X_OFFSET + 0, 4, -40);
        addMesh(centerCol);

        // 8 outer stone piers arranged octagonally
        var pierCount = 8;
        for (var oi = 0; oi < pierCount; oi++) {
            var pierAngle = (oi / pierCount) * Math.PI * 2;
            var pierX = X_OFFSET + Math.sin(pierAngle) * 5;
            var pierZ = -40 + Math.cos(pierAngle) * 5;

            var pierGeo = new THREE.CylinderGeometry(0.4, 0.5, 6, 6);
            var pierMat = makeMaterial(stoneColor);
            var pier = new THREE.Mesh(pierGeo, pierMat);
            pier.position.set(pierX, 3, pierZ);
            addMesh(pier);

            // Pier base
            var pierBaseGeo = new THREE.BoxGeometry(1.2, 0.5, 1.2);
            var pierBaseMat = makeMaterial(darkStone);
            var pierBase = new THREE.Mesh(pierBaseGeo, pierBaseMat);
            pierBase.position.set(pierX, 0.25, pierZ);
            addMesh(pierBase);
        }

        // Canopy base ring
        var canopyRingGeo = new THREE.CylinderGeometry(6, 6, 0.8, 8);
        var canopyRingMat = makeMaterial(darkStone);
        var canopyRing = new THREE.Mesh(canopyRingGeo, canopyRingMat);
        canopyRing.position.set(X_OFFSET + 0, 6.4, -40);
        addMesh(canopyRing);

        // Canopy roof — octagonal
        var canopyGeo = new THREE.CylinderGeometry(1.5, 6.5, 3, 8);
        var canopyMat = makeMaterial(0x8a9878);
        var canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.set(X_OFFSET + 0, 8.3, -40);
        addMesh(canopy);

        // Canopy finial
        var finialGeo = new THREE.ConeGeometry(0.8, 3, 8);
        var finialMat = makeMaterial(stoneColor);
        var finial = new THREE.Mesh(finialGeo, finialMat);
        finial.position.set(X_OFFSET + 0, 11.3, -40);
        addMesh(finial);

        // Top cross / pinnacle
        var crossVGeo = new THREE.BoxGeometry(0.3, 2, 0.3);
        var crossMat = makeMaterial(0xcccccc);
        var crossV = new THREE.Mesh(crossVGeo, crossMat);
        crossV.position.set(X_OFFSET + 0, 13.8, -40);
        addMesh(crossV);

        var crossHGeo = new THREE.BoxGeometry(1.2, 0.3, 0.3);
        var crossH = new THREE.Mesh(crossHGeo, crossMat);
        crossH.position.set(X_OFFSET + 0, 14.2, -40);
        addMesh(crossH);

        // Stone step platform for market cross
        var stepGeo = new THREE.CylinderGeometry(7, 8, 0.8, 8);
        var stepMat = makeMaterial(0xbcac90);
        var step = new THREE.Mesh(stepGeo, stepMat);
        step.position.set(X_OFFSET + 0, 0.4, -40);
        addMesh(step);

        // Decorative corner pinnacles on canopy
        for (var di = 0; di < 8; di++) {
            var dAngle = (di / 8) * Math.PI * 2;
            var dPinnGeo = new THREE.ConeGeometry(0.25, 1.5, 4);
            var dPinnMat = makeMaterial(stoneColor);
            var dPinn = new THREE.Mesh(dPinnGeo, dPinnMat);
            dPinn.position.set(
                X_OFFSET + Math.sin(dAngle) * 6.2,
                7.5,
                -40 + Math.cos(dAngle) * 6.2
            );
            addMesh(dPinn);
        }
    }

    function buildCanalBasin() {
        var waterColor = 0x2a6080;
        var stoneColor = 0x8a8070;
        var woodColor = 0x6a5040;

        // Canal basin — blue water rectangle
        var basinGeo = new THREE.BoxGeometry(50, 0.4, 20);
        var basinMat = makeMaterial(waterColor);
        var basin = new THREE.Mesh(basinGeo, basinMat);
        basin.position.set(X_OFFSET + 60, 0.2, 50);
        addMesh(basin);

        // Canal channel leading south
        var channelGeo = new THREE.BoxGeometry(8, 0.4, 40);
        var channelMat = makeMaterial(waterColor);
        var channel = new THREE.Mesh(channelGeo, channelMat);
        channel.position.set(X_OFFSET + 60, 0.2, 80);
        addMesh(channel);

        // Warehouse 1 — north side of basin
        var ware1Geo = new THREE.BoxGeometry(18, 10, 10);
        var ware1Mat = makeMaterial(0x706050);
        var ware1 = new THREE.Mesh(ware1Geo, ware1Mat);
        ware1.position.set(X_OFFSET + 55, 5, 32);
        addMesh(ware1);

        // Warehouse 1 roof
        var ware1RoofGeo = new THREE.BoxGeometry(19, 2, 5);
        var ware1RoofMat = makeMaterial(0x504040);
        var ware1Roof = new THREE.Mesh(ware1RoofGeo, ware1RoofMat);
        ware1Roof.position.set(X_OFFSET + 55, 11, 32);
        addMesh(ware1Roof);

        // Warehouse 2 — east side
        var ware2Geo = new THREE.BoxGeometry(12, 9, 14);
        var ware2Mat = makeMaterial(0x786858);
        var ware2 = new THREE.Mesh(ware2Geo, ware2Mat);
        ware2.position.set(X_OFFSET + 88, 4.5, 48);
        addMesh(ware2);

        // Warehouse 2 roof
        var ware2RoofGeo = new THREE.BoxGeometry(13, 2, 6);
        var ware2RoofMat = makeMaterial(0x504040);
        var ware2Roof = new THREE.Mesh(ware2RoofGeo, ware2RoofMat);
        ware2Roof.position.set(X_OFFSET + 88, 10, 48);
        addMesh(ware2Roof);

        // Warehouse 3 — west end
        var ware3Geo = new THREE.BoxGeometry(10, 8, 12);
        var ware3Mat = makeMaterial(0x706050);
        var ware3 = new THREE.Mesh(ware3Geo, ware3Mat);
        ware3.position.set(X_OFFSET + 32, 4, 48);
        addMesh(ware3);

        // Lock gate suggestion — vertical planks across channel
        var lockGate1Geo = new THREE.BoxGeometry(8, 4, 0.8);
        var lockGateMat = makeMaterial(woodColor);
        var lockGate1 = new THREE.Mesh(lockGate1Geo, lockGateMat);
        lockGate1.position.set(X_OFFSET + 60, 2, 62);
        addMesh(lockGate1);

        var lockGate2Geo = new THREE.BoxGeometry(8, 4, 0.8);
        var lockGate2 = new THREE.Mesh(lockGate2Geo, lockGateMat);
        lockGate2.position.set(X_OFFSET + 60, 2, 68);
        addMesh(lockGate2);

        // Lock gate balance beam (horizontal arm)
        var beam1Geo = new THREE.BoxGeometry(0.5, 0.5, 7);
        var beamMat = makeMaterial(woodColor);
        var beam1 = new THREE.Mesh(beam1Geo, beamMat);
        beam1.position.set(X_OFFSET + 64, 4, 65);
        addMesh(beam1);

        var beam2Geo = new THREE.BoxGeometry(0.5, 0.5, 7);
        var beam2 = new THREE.Mesh(beam2Geo, beamMat);
        beam2.position.set(X_OFFSET + 56, 4, 65);
        addMesh(beam2);

        // Quayside walls — stone edging of basin
        var quayNGeo = new THREE.BoxGeometry(52, 1.5, 1.5);
        var quayMat = makeMaterial(stoneColor);
        var quayN = new THREE.Mesh(quayNGeo, quayMat);
        quayN.position.set(X_OFFSET + 60, 0.75, 39.5);
        addMesh(quayN);

        var quaySGeo = new THREE.BoxGeometry(52, 1.5, 1.5);
        var quayS = new THREE.Mesh(quaySGeo, quayMat);
        quayS.position.set(X_OFFSET + 60, 0.75, 60.5);
        addMesh(quayS);

        var quayEGeo = new THREE.BoxGeometry(1.5, 1.5, 22);
        var quayE = new THREE.Mesh(quayEGeo, quayMat);
        quayE.position.set(X_OFFSET + 85.5, 0.75, 50);
        addMesh(quayE);

        var quayWGeo = new THREE.BoxGeometry(1.5, 1.5, 22);
        var quayW = new THREE.Mesh(quayWGeo, quayMat);
        quayW.position.set(X_OFFSET + 34.5, 0.75, 50);
        addMesh(quayW);

        // Mooring bollards
        var bollardsX = [40, 50, 60, 70, 80];
        for (var boi = 0; boi < bollardsX.length; boi++) {
            var bollardGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 6);
            var bollardMat = makeMaterial(0x444444);
            var bollardN = new THREE.Mesh(bollardGeo, bollardMat);
            bollardN.position.set(X_OFFSET + bollardsX[boi], 0.9, 40.5);
            addMesh(bollardN);

            var bollardS = new THREE.Mesh(bollardGeo, bollardMat);
            bollardS.position.set(X_OFFSET + bollardsX[boi], 0.9, 59.5);
            addMesh(bollardS);
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
