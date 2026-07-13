window.EdinburghCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14720;

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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildCastleRock() {
        // Main volcanic plug base - dark basalt
        var rockGeo = new THREE.CylinderGeometry(60, 90, 80, 8);
        var rockMat = makeMaterial(0x1a1a1a);
        var rock = new THREE.Mesh(rockGeo, rockMat);
        rock.position.set(X_OFFSET, 40, -200);
        addMesh(rock);

        // Upper rock platform - flatter top
        var upperGeo = new THREE.CylinderGeometry(55, 62, 25, 8);
        var upperMat = makeMaterial(0x222222);
        var upper = new THREE.Mesh(upperGeo, upperMat);
        upper.position.set(X_OFFSET, 90, -200);
        addMesh(upper);

        // North face cliff - sheer drop
        var northCliffGeo = new THREE.BoxGeometry(100, 60, 20);
        var northCliffMat = makeMaterial(0x111111);
        var northCliff = new THREE.Mesh(northCliffGeo, northCliffMat);
        northCliff.position.set(X_OFFSET, 50, -260);
        addMesh(northCliff);

        // South face cliff
        var southCliffGeo = new THREE.BoxGeometry(100, 60, 20);
        var southCliffMat = makeMaterial(0x111111);
        var southCliff = new THREE.Mesh(southCliffGeo, southCliffMat);
        southCliff.position.set(X_OFFSET, 50, -140);
        addMesh(southCliff);

        // West cliff - steepest face
        var westCliffGeo = new THREE.BoxGeometry(20, 70, 80);
        var westCliffMat = makeMaterial(0x0d0d0d);
        var westCliff = new THREE.Mesh(westCliffGeo, westCliffMat);
        westCliff.position.set(X_OFFSET - 60, 45, -200);
        addMesh(westCliff);

        // East approach - gradual slope
        var eastSlopeGeo = new THREE.BoxGeometry(80, 8, 60);
        var eastSlopeMat = makeMaterial(0x333333);
        var eastSlope = new THREE.Mesh(eastSlopeGeo, eastSlopeMat);
        eastSlope.position.set(X_OFFSET + 80, 5, -200);
        eastSlope.rotation.z = -0.15;
        addMesh(eastSlope);
    }

    function buildEdinburghCastle() {
        // Gatehouse with portcullis
        var gateHouseGeo = new THREE.BoxGeometry(20, 20, 15);
        var gateHouseMat = makeMaterial(0x5a5a4a);
        var gateHouse = new THREE.Mesh(gateHouseGeo, gateHouseMat);
        gateHouse.position.set(X_OFFSET + 30, 115, -200);
        addMesh(gateHouse);

        // Gatehouse towers
        var gateTower1Geo = new THREE.CylinderGeometry(4, 5, 25, 6);
        var gateTower1Mat = makeMaterial(0x4a4a3a);
        var gateTower1 = new THREE.Mesh(gateTower1Geo, gateTower1Mat);
        gateTower1.position.set(X_OFFSET + 22, 122, -193);
        addMesh(gateTower1);

        var gateTower2Geo = new THREE.CylinderGeometry(4, 5, 25, 6);
        var gateTower2Mat = makeMaterial(0x4a4a3a);
        var gateTower2 = new THREE.Mesh(gateTower2Geo, gateTower2Mat);
        gateTower2.position.set(X_OFFSET + 38, 122, -193);
        addMesh(gateTower2);

        // Portcullis arch (simplified as dark box cutout impression)
        var portcullisGeo = new THREE.BoxGeometry(8, 10, 3);
        var portcullisMat = makeMaterial(0x1a1a1a);
        var portcullis = new THREE.Mesh(portcullisGeo, portcullisMat);
        portcullis.position.set(X_OFFSET + 30, 110, -194);
        addMesh(portcullis);

        // Half Moon Battery - curved artillery platform
        var hmb1Geo = new THREE.CylinderGeometry(30, 32, 12, 16, 1, false, 0, Math.PI);
        var hmb1Mat = makeMaterial(0x6b6b5a);
        var hmb1 = new THREE.Mesh(hmb1Geo, hmb1Mat);
        hmb1.position.set(X_OFFSET, 110, -220);
        hmb1.rotation.y = Math.PI / 2;
        addMesh(hmb1);

        // Half Moon Battery wall
        var hmbWallGeo = new THREE.BoxGeometry(60, 15, 5);
        var hmbWallMat = makeMaterial(0x5a5a4a);
        var hmbWall = new THREE.Mesh(hmbWallGeo, hmbWallMat);
        hmbWall.position.set(X_OFFSET, 115, -245);
        addMesh(hmbWall);

        // Crown Square - central courtyard (flat platform)
        var crownSquareGeo = new THREE.BoxGeometry(70, 4, 50);
        var crownSquareMat = makeMaterial(0x7a7a6a);
        var crownSquare = new THREE.Mesh(crownSquareGeo, crownSquareMat);
        crownSquare.position.set(X_OFFSET - 10, 104, -200);
        addMesh(crownSquare);

        // Great Hall - main hall building
        var greatHallGeo = new THREE.BoxGeometry(40, 18, 20);
        var greatHallMat = makeMaterial(0x6a6a5a);
        var greatHall = new THREE.Mesh(greatHallGeo, greatHallMat);
        greatHall.position.set(X_OFFSET - 10, 115, -195);
        addMesh(greatHall);

        // Great Hall roof
        var greatHallRoofGeo = new THREE.BoxGeometry(42, 8, 22);
        var greatHallRoofMat = makeMaterial(0x3a3a3a);
        var greatHallRoof = new THREE.Mesh(greatHallRoofGeo, greatHallRoofMat);
        greatHallRoof.position.set(X_OFFSET - 10, 127, -195);
        addMesh(greatHallRoof);

        // Great Hall ridge (triangular roof suggestion)
        var ridgeGeo = new THREE.BoxGeometry(42, 5, 4);
        var ridgeMat = makeMaterial(0x2a2a2a);
        var ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.position.set(X_OFFSET - 10, 132, -195);
        addMesh(ridge);

        // St Margaret's Chapel - oldest building, small
        var chapelGeo = new THREE.BoxGeometry(10, 12, 8);
        var chapelMat = makeMaterial(0x8a8a7a);
        var chapel = new THREE.Mesh(chapelGeo, chapelMat);
        chapel.position.set(X_OFFSET - 35, 110, -205);
        addMesh(chapel);

        // Chapel apse (rounded east end)
        var chapelApseGeo = new THREE.CylinderGeometry(4, 4, 12, 8);
        var chapelApseMat = makeMaterial(0x8a8a7a);
        var chapelApse = new THREE.Mesh(chapelApseGeo, chapelApseMat);
        chapelApse.position.set(X_OFFSET - 40, 110, -205);
        addMesh(chapelApse);

        // Chapel roof
        var chapelRoofGeo = new THREE.BoxGeometry(11, 5, 9);
        var chapelRoofMat = makeMaterial(0x3a3a3a);
        var chapelRoof = new THREE.Mesh(chapelRoofGeo, chapelRoofMat);
        chapelRoof.position.set(X_OFFSET - 35, 118, -205);
        addMesh(chapelRoof);

        // One O'Clock Gun position (cannon battery)
        var gunPlatGeo = new THREE.BoxGeometry(15, 4, 10);
        var gunPlatMat = makeMaterial(0x5a5a4a);
        var gunPlat = new THREE.Mesh(gunPlatGeo, gunPlatMat);
        gunPlat.position.set(X_OFFSET + 10, 108, -240);
        addMesh(gunPlat);

        // Cannon 1
        var cannon1BarrelGeo = new THREE.CylinderGeometry(1, 1.5, 10, 8);
        var cannon1BarrelMat = makeMaterial(0x222222);
        var cannon1Barrel = new THREE.Mesh(cannon1BarrelGeo, cannon1BarrelMat);
        cannon1Barrel.position.set(X_OFFSET + 10, 113, -240);
        cannon1Barrel.rotation.z = Math.PI / 2;
        addMesh(cannon1Barrel);

        // Cannon 2
        var cannon2BarrelGeo = new THREE.CylinderGeometry(1, 1.5, 10, 8);
        var cannon2BarrelMat = makeMaterial(0x222222);
        var cannon2Barrel = new THREE.Mesh(cannon2BarrelGeo, cannon2BarrelMat);
        cannon2Barrel.position.set(X_OFFSET + 4, 113, -240);
        cannon2Barrel.rotation.z = Math.PI / 2;
        addMesh(cannon2Barrel);

        // Castle perimeter walls
        var wallNorthGeo = new THREE.BoxGeometry(90, 10, 4);
        var wallNorthMat = makeMaterial(0x5a5a4a);
        var wallNorth = new THREE.Mesh(wallNorthGeo, wallNorthMat);
        wallNorth.position.set(X_OFFSET - 5, 108, -248);
        addMesh(wallNorth);

        var wallSouthGeo = new THREE.BoxGeometry(90, 10, 4);
        var wallSouthMat = makeMaterial(0x5a5a4a);
        var wallSouth = new THREE.Mesh(wallSouthGeo, wallSouthMat);
        wallSouth.position.set(X_OFFSET - 5, 108, -155);
        addMesh(wallSouth);

        var wallWestGeo = new THREE.BoxGeometry(4, 10, 94);
        var wallWestMat = makeMaterial(0x5a5a4a);
        var wallWest = new THREE.Mesh(wallWestGeo, wallWestMat);
        wallWest.position.set(X_OFFSET - 50, 108, -200);
        addMesh(wallWest);

        // Corner tower northwest
        var cornerTower1Geo = new THREE.CylinderGeometry(5, 6, 20, 6);
        var cornerTower1Mat = makeMaterial(0x4a4a3a);
        var cornerTower1 = new THREE.Mesh(cornerTower1Geo, cornerTower1Mat);
        cornerTower1.position.set(X_OFFSET - 50, 118, -248);
        addMesh(cornerTower1);

        // Corner tower southwest
        var cornerTower2Geo = new THREE.CylinderGeometry(5, 6, 20, 6);
        var cornerTower2Mat = makeMaterial(0x4a4a3a);
        var cornerTower2 = new THREE.Mesh(cornerTower2Geo, cornerTower2Mat);
        cornerTower2.position.set(X_OFFSET - 50, 118, -155);
        addMesh(cornerTower2);
    }

    function buildRoyalMile() {
        // Royal Mile road surface - runs east from castle to parliament
        var roadGeo = new THREE.BoxGeometry(14, 1, 420);
        var roadMat = makeMaterial(0x888880);
        var road = new THREE.Mesh(roadGeo, roadMat);
        road.position.set(X_OFFSET, 1, 10);
        addMesh(road);

        // Lawnmarket section - wide upper section near castle
        var lawnmarketGeo = new THREE.BoxGeometry(18, 1, 80);
        var lawnmarketMat = makeMaterial(0x888880);
        var lawnmarket = new THREE.Mesh(lawnmarketGeo, lawnmarketMat);
        lawnmarket.position.set(X_OFFSET, 1, -130);
        addMesh(lawnmarket);

        // Stone tenements north side - tall narrow buildings
        var tenementPositionsNorth = [
            -160, -100, -40, 20, 80, 140
        ];
        for (var i = 0; i < tenementPositionsNorth.length; i++) {
            var tnGeo = new THREE.BoxGeometry(18, 35, 20);
            var tnMat = makeMaterial(0xb0a898);
            var tn = new THREE.Mesh(tnGeo, tnMat);
            tn.position.set(X_OFFSET + 20, 18, tenementPositionsNorth[i]);
            addMesh(tn);

            // Tenement roof
            var tnRoofGeo = new THREE.BoxGeometry(18, 6, 20);
            var tnRoofMat = makeMaterial(0x555555);
            var tnRoof = new THREE.Mesh(tnRoofGeo, tnRoofMat);
            tnRoof.position.set(X_OFFSET + 20, 38, tenementPositionsNorth[i]);
            addMesh(tnRoof);

            // Chimney stacks
            var chimneyGeo = new THREE.BoxGeometry(3, 6, 3);
            var chimneyMat = makeMaterial(0x444444);
            var chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
            chimney.position.set(X_OFFSET + 18, 45, tenementPositionsNorth[i]);
            addMesh(chimney);
        }

        // Stone tenements south side
        var tenementPositionsSouth = [
            -140, -80, -20, 40, 100, 160
        ];
        for (var j = 0; j < tenementPositionsSouth.length; j++) {
            var tsGeo = new THREE.BoxGeometry(18, 32, 20);
            var tsMat = makeMaterial(0xa89888);
            var ts = new THREE.Mesh(tsGeo, tsMat);
            ts.position.set(X_OFFSET - 20, 16, tenementPositionsSouth[j]);
            addMesh(ts);

            var tsRoofGeo = new THREE.BoxGeometry(18, 5, 20);
            var tsRoofMat = makeMaterial(0x555555);
            var tsRoof = new THREE.Mesh(tsRoofGeo, tsRoofMat);
            tsRoof.position.set(X_OFFSET - 20, 35, tenementPositionsSouth[j]);
            addMesh(tsRoof);

            var tsChimneyGeo = new THREE.BoxGeometry(3, 5, 3);
            var tsChimneyMat = makeMaterial(0x444444);
            var tsChimney = new THREE.Mesh(tsChimneyGeo, tsChimneyMat);
            tsChimney.position.set(X_OFFSET - 22, 41, tenementPositionsSouth[j]);
            addMesh(tsChimney);
        }
    }

    function buildStGilesCathedral() {
        // Main nave
        var naveGeo = new THREE.BoxGeometry(28, 22, 55);
        var naveMat = makeMaterial(0x9a9080);
        var nave = new THREE.Mesh(naveGeo, naveMat);
        nave.position.set(X_OFFSET, 11, -60);
        addMesh(nave);

        // Transepts (north-south arms)
        var transeptNGeo = new THREE.BoxGeometry(20, 20, 18);
        var transeptNMat = makeMaterial(0x9a9080);
        var transeptN = new THREE.Mesh(transeptNGeo, transeptNMat);
        transeptN.position.set(X_OFFSET + 24, 10, -60);
        addMesh(transeptN);

        var transeptSGeo = new THREE.BoxGeometry(20, 20, 18);
        var transeptSMat = makeMaterial(0x9a9080);
        var transeptS = new THREE.Mesh(transeptSGeo, transeptSMat);
        transeptS.position.set(X_OFFSET - 24, 10, -60);
        addMesh(transeptS);

        // Choir/chancel east end
        var choirGeo = new THREE.BoxGeometry(20, 20, 20);
        var choirMat = makeMaterial(0x9a9080);
        var choir = new THREE.Mesh(choirGeo, choirMat);
        choir.position.set(X_OFFSET, 10, -95);
        addMesh(choir);

        // Central tower base
        var towerBaseGeo = new THREE.BoxGeometry(14, 32, 14);
        var towerBaseMat = makeMaterial(0x888070);
        var towerBase = new THREE.Mesh(towerBaseGeo, towerBaseMat);
        towerBase.position.set(X_OFFSET, 28, -60);
        addMesh(towerBase);

        // Crown spire - central shaft
        var crownShaftGeo = new THREE.BoxGeometry(8, 20, 8);
        var crownShaftMat = makeMaterial(0x7a7068);
        var crownShaft = new THREE.Mesh(crownShaftGeo, crownShaftMat);
        crownShaft.position.set(X_OFFSET, 64, -60);
        addMesh(crownShaft);

        // Eight flying buttresses meeting at top (crown spire arms)
        var buttressAngles = [
            0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4,
            Math.PI, 5 * Math.PI / 4, 3 * Math.PI / 2, 7 * Math.PI / 4
        ];
        for (var b = 0; b < buttressAngles.length; b++) {
            var bGeo = new THREE.BoxGeometry(2, 14, 14);
            var bMat = makeMaterial(0x7a7068);
            var bMesh = new THREE.Mesh(bGeo, bMat);
            var bAngle = buttressAngles[b];
            bMesh.position.set(
                X_OFFSET + Math.sin(bAngle) * 8,
                62,
                -60 + Math.cos(bAngle) * 8
            );
            bMesh.rotation.y = bAngle;
            bMesh.rotation.z = 0.6;
            addMesh(bMesh);
        }

        // Crown spire top finial
        var crownTopGeo = new THREE.ConeGeometry(3, 12, 8);
        var crownTopMat = makeMaterial(0x6a6058);
        var crownTop = new THREE.Mesh(crownTopGeo, crownTopMat);
        crownTop.position.set(X_OFFSET, 84, -60);
        addMesh(crownTop);

        // Thistle chapel (south-east corner)
        var thistleGeo = new THREE.BoxGeometry(10, 14, 12);
        var thistleMat = makeMaterial(0x9a9080);
        var thistle = new THREE.Mesh(thistleGeo, thistleMat);
        thistle.position.set(X_OFFSET - 22, 7, -90);
        addMesh(thistle);

        // Thistle chapel small tower
        var thistleTowerGeo = new THREE.CylinderGeometry(3, 4, 20, 6);
        var thistleTowerMat = makeMaterial(0x888070);
        var thistleTower = new THREE.Mesh(thistleTowerGeo, thistleTowerMat);
        thistleTower.position.set(X_OFFSET - 26, 17, -94);
        addMesh(thistleTower);

        // Buttresses on nave walls
        var buttressZPositions = [-45, -60, -75];
        for (var nb = 0; nb < buttressZPositions.length; nb++) {
            var nbGeo = new THREE.BoxGeometry(4, 18, 5);
            var nbMat = makeMaterial(0x888070);
            var nbMesh = new THREE.Mesh(nbGeo, nbMat);
            nbMesh.position.set(X_OFFSET + 16, 9, buttressZPositions[nb]);
            addMesh(nbMesh);

            var sbGeo = new THREE.BoxGeometry(4, 18, 5);
            var sbMat = makeMaterial(0x888070);
            var sbMesh = new THREE.Mesh(sbGeo, sbMat);
            sbMesh.position.set(X_OFFSET - 16, 9, buttressZPositions[nb]);
            addMesh(sbMesh);
        }
    }

    function buildScottishParliament() {
        // Main building - unusual angular organic shapes
        var mainBldgGeo = new THREE.BoxGeometry(60, 14, 35);
        var mainBldgMat = makeMaterial(0x8a8878);
        var mainBldg = new THREE.Mesh(mainBldgGeo, mainBldgMat);
        mainBldg.position.set(X_OFFSET, 7, 220);
        addMesh(mainBldg);

        // Debating chamber - distinctive round/angular shape
        var chamberGeo = new THREE.CylinderGeometry(18, 20, 16, 10);
        var chamberMat = makeMaterial(0x7a7868);
        var chamber = new THREE.Mesh(chamberGeo, chamberMat);
        chamber.position.set(X_OFFSET, 8, 240);
        addMesh(chamber);

        // Chamber roof - flat with skylight
        var chamberRoofGeo = new THREE.CylinderGeometry(18, 18, 3, 10);
        var chamberRoofMat = makeMaterial(0x555545);
        var chamberRoof = new THREE.Mesh(chamberRoofGeo, chamberRoofMat);
        chamberRoof.position.set(X_OFFSET, 17, 240);
        addMesh(chamberRoof);

        // MSP block - offices with oak leaf window bays (angular protrusions)
        var mspBlockGeo = new THREE.BoxGeometry(80, 18, 25);
        var mspBlockMat = makeMaterial(0x8a8070);
        var mspBlock = new THREE.Mesh(mspBlockGeo, mspBlockMat);
        mspBlock.position.set(X_OFFSET + 10, 9, 185);
        addMesh(mspBlock);

        // Oak leaf window bays (angular protrusions)
        var bayPositions = [-30, -15, 0, 15, 30];
        for (var op = 0; op < bayPositions.length; op++) {
            var bayGeo = new THREE.BoxGeometry(8, 14, 6);
            var bayMat = makeMaterial(0x7a7868);
            var bay = new THREE.Mesh(bayGeo, bayMat);
            bay.position.set(X_OFFSET + bayPositions[op], 9, 172);
            addMesh(bay);

            // Bay window (dark)
            var winGeo = new THREE.BoxGeometry(5, 8, 2);
            var winMat = makeMaterial(0x2a3a4a);
            var win = new THREE.Mesh(winGeo, winMat);
            win.position.set(X_OFFSET + bayPositions[op], 10, 170);
            addMesh(win);
        }

        // Queensberry House - incorporated historic building
        var qhGeo = new THREE.BoxGeometry(25, 20, 20);
        var qhMat = makeMaterial(0xaa9a88);
        var qh = new THREE.Mesh(qhGeo, qhMat);
        qh.position.set(X_OFFSET - 45, 10, 200);
        addMesh(qh);

        // Queensberry House roof
        var qhRoofGeo = new THREE.BoxGeometry(25, 6, 20);
        var qhRoofMat = makeMaterial(0x3a3a3a);
        var qhRoof = new THREE.Mesh(qhRoofGeo, qhRoofMat);
        qhRoof.position.set(X_OFFSET - 45, 22, 200);
        addMesh(qhRoof);

        // Granite facade panels (north elevation)
        var graniteGeo = new THREE.BoxGeometry(60, 12, 2);
        var graniteMat = makeMaterial(0x9a9080);
        var granite = new THREE.Mesh(graniteGeo, graniteMat);
        granite.position.set(X_OFFSET, 8, 203);
        addMesh(granite);

        // Concrete canopy over entrance
        var canopyGeo = new THREE.BoxGeometry(25, 2, 10);
        var canopyMat = makeMaterial(0xaaa898);
        var canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.set(X_OFFSET, 14, 205);
        addMesh(canopy);

        // Miralles angular roof element
        var roofElemGeo = new THREE.BoxGeometry(50, 8, 30);
        var roofElemMat = makeMaterial(0x6a6858);
        var roofElem = new THREE.Mesh(roofElemGeo, roofElemMat);
        roofElem.position.set(X_OFFSET + 5, 19, 220);
        roofElem.rotation.z = 0.05;
        addMesh(roofElem);
    }

    function buildArthursSeat() {
        // Main volcanic dome - large hill
        var domGeo = new THREE.SphereGeometry(120, 12, 8);
        var domMat = makeMaterial(0x4a6a3a);
        var dome = new THREE.Mesh(domGeo, domMat);
        dome.position.set(X_OFFSET + 200, 60, 350);
        dome.scale.set(1, 0.6, 1);
        addMesh(dome);

        // Summit crags - rocky top
        var summit1Geo = new THREE.BoxGeometry(20, 25, 18);
        var summit1Mat = makeMaterial(0x3a3a2a);
        var summit1 = new THREE.Mesh(summit1Geo, summit1Mat);
        summit1.position.set(X_OFFSET + 195, 118, 345);
        addMesh(summit1);

        var summit2Geo = new THREE.BoxGeometry(15, 20, 12);
        var summit2Mat = makeMaterial(0x3a3a2a);
        var summit2 = new THREE.Mesh(summit2Geo, summit2Mat);
        summit2.position.set(X_OFFSET + 210, 115, 355);
        addMesh(summit2);

        var summit3Geo = new THREE.ConeGeometry(8, 18, 6);
        var summit3Mat = makeMaterial(0x2a2a1a);
        var summit3 = new THREE.Mesh(summit3Geo, summit3Mat);
        summit3.position.set(X_OFFSET + 200, 128, 350);
        addMesh(summit3);

        // Salisbury Crags - dramatic cliff band running along west side
        var crags1Geo = new THREE.BoxGeometry(10, 35, 120);
        var crags1Mat = makeMaterial(0x3a3530);
        var crags1 = new THREE.Mesh(crags1Geo, crags1Mat);
        crags1.position.set(X_OFFSET + 80, 35, 340);
        addMesh(crags1);

        // Salisbury Crags top edge
        var cragsTopGeo = new THREE.BoxGeometry(12, 8, 120);
        var cragsTopMat = makeMaterial(0x2a2520);
        var cragsTop = new THREE.Mesh(cragsTopGeo, cragsTopMat);
        cragsTop.position.set(X_OFFSET + 80, 55, 340);
        addMesh(cragsTop);

        // Crags cliff face segments - jagged
        var cragSegPositions = [280, 310, 340, 370, 400];
        for (var cs = 0; cs < cragSegPositions.length; cs++) {
            var csGeo = new THREE.BoxGeometry(8, 28 + cs * 3, 18);
            var csMat = makeMaterial(0x333028);
            var csMesh = new THREE.Mesh(csGeo, csMat);
            csMesh.position.set(X_OFFSET + 82 + cs * 2, 30, cragSegPositions[cs]);
            addMesh(csMesh);
        }

        // Holyrood Park - green ground area
        var parkGeo = new THREE.BoxGeometry(250, 2, 220);
        var parkMat = makeMaterial(0x4a7a3a);
        var park = new THREE.Mesh(parkGeo, parkMat);
        park.position.set(X_OFFSET + 150, 1, 320);
        addMesh(park);

        // Hunter's Bog - low-lying area
        var bogGeo = new THREE.BoxGeometry(80, 1, 80);
        var bogMat = makeMaterial(0x3a6a2a);
        var bog = new THREE.Mesh(bogGeo, bogMat);
        bog.position.set(X_OFFSET + 170, 1, 370);
        addMesh(bog);

        // Dunsapie Loch (small loch in park)
        var lochGeo = new THREE.BoxGeometry(35, 1, 25);
        var lochMat = makeMaterial(0x3a5a7a);
        var loch = new THREE.Mesh(lochGeo, lochMat);
        loch.position.set(X_OFFSET + 240, 2, 380);
        addMesh(loch);

        // Lower hill slopes - multiple levels
        var slope1Geo = new THREE.CylinderGeometry(80, 100, 30, 10);
        var slope1Mat = makeMaterial(0x5a7a4a);
        var slope1 = new THREE.Mesh(slope1Geo, slope1Mat);
        slope1.position.set(X_OFFSET + 200, 15, 350);
        addMesh(slope1);

        var slope2Geo = new THREE.CylinderGeometry(100, 115, 15, 10);
        var slope2Mat = makeMaterial(0x607a50);
        var slope2 = new THREE.Mesh(slope2Geo, slope2Mat);
        slope2.position.set(X_OFFSET + 200, 7, 350);
        addMesh(slope2);
    }

    function buildGroundPlane() {
        // Base ground for Edinburgh area
        var groundGeo = new THREE.BoxGeometry(600, 2, 800);
        var groundMat = makeMaterial(0x6a7a5a);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(X_OFFSET + 50, -1, 100);
        addMesh(ground);

        // Old Town area - slightly raised
        var oldTownGeo = new THREE.BoxGeometry(200, 2, 500);
        var oldTownMat = makeMaterial(0x7a8060);
        var oldTown = new THREE.Mesh(oldTownGeo, oldTownMat);
        oldTown.position.set(X_OFFSET, 1, 50);
        addMesh(oldTown);
    }

    function build() {
        buildGroundPlane();
        buildCastleRock();
        buildEdinburghCastle();
        buildRoyalMile();
        buildStGilesCathedral();
        buildScottishParliament();
        buildArthursSeat();
    }

    function update(delta) {
        // Static environment - no animation needed
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
