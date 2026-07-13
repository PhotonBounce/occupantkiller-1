window.CoventGarden = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11640;

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

    function makeMat(color, emissive) {
        return new THREE.MeshLambertMaterial({ color: color, emissive: emissive || 0x000000 });
    }

    function buildMarketHall() {
        // Central iron-column hall floor
        var floorGeo = new THREE.BoxGeometry(80, 1, 50);
        var floorMat = makeMat(0xc8a87a);
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(X_OFFSET, 0.5, 0);
        addMesh(floor);

        // Main hall north wall
        var wallNGeo = new THREE.BoxGeometry(80, 18, 2);
        var wallMat = makeMat(0xd4b88a);
        var wallN = new THREE.Mesh(wallNGeo, wallMat);
        wallN.position.set(X_OFFSET, 9, -25);
        addMesh(wallN);

        // Main hall south wall
        var wallSGeo = new THREE.BoxGeometry(80, 18, 2);
        var wallS = new THREE.Mesh(wallSGeo, wallMat);
        wallS.position.set(X_OFFSET, 9, 25);
        addMesh(wallS);

        // Main hall east wall
        var wallEGeo = new THREE.BoxGeometry(2, 18, 50);
        var wallE = new THREE.Mesh(wallEGeo, wallMat);
        wallE.position.set(X_OFFSET + 41, 9, 0);
        addMesh(wallE);

        // Main hall west wall
        var wallWGeo = new THREE.BoxGeometry(2, 18, 50);
        var wallW = new THREE.Mesh(wallWGeo, wallMat);
        wallW.position.set(X_OFFSET - 41, 9, 0);
        addMesh(wallW);

        // Arched glass roof (simulated with box, pale blue-green)
        var roofGeo = new THREE.BoxGeometry(78, 4, 48);
        var roofMat = makeMat(0x99ccbb);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(X_OFFSET, 20, 0);
        addMesh(roof);

        // Roof ridge beam
        var ridgeGeo = new THREE.BoxGeometry(80, 2, 3);
        var ridgeMat = makeMat(0x445533);
        var ridge = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridge.position.set(X_OFFSET, 22, 0);
        addMesh(ridge);

        // Iron columns along interior — 6 columns each side
        var colMat = makeMat(0x334422);
        var colPositionsZ = [-20, -10, 0, 10, 20];
        for (var ci = 0; ci < colPositionsZ.length; ci++) {
            var colGeoN = new THREE.CylinderGeometry(0.6, 0.6, 17, 8);
            var colN = new THREE.Mesh(colGeoN, colMat);
            colN.position.set(X_OFFSET - 30, 8.5, colPositionsZ[ci]);
            addMesh(colN);

            var colGeoS = new THREE.CylinderGeometry(0.6, 0.6, 17, 8);
            var colS = new THREE.Mesh(colGeoS, colMat);
            colS.position.set(X_OFFSET + 30, 8.5, colPositionsZ[ci]);
            addMesh(colS);
        }

        // Apple Market courtyard — open cobbled area in centre of hall
        var courtyardGeo = new THREE.BoxGeometry(40, 0.5, 30);
        var courtyardMat = makeMat(0xaaa090);
        var courtyard = new THREE.Mesh(courtyardGeo, courtyardMat);
        courtyard.position.set(X_OFFSET, 1.1, 0);
        addMesh(courtyard);

        // Floral displays — clusters of sphere "flowers" on courtyard
        var flowerColors = [0xff6677, 0xffcc44, 0xff9933, 0xee44aa, 0xffffff];
        var flowerPositions = [
            [X_OFFSET - 15, 2, -8],
            [X_OFFSET - 15, 2, 8],
            [X_OFFSET + 15, 2, -8],
            [X_OFFSET + 15, 2, 8],
            [X_OFFSET, 2, -12],
            [X_OFFSET, 2, 12]
        ];
        for (var fi = 0; fi < flowerPositions.length; fi++) {
            var fc = flowerColors[fi % flowerColors.length];
            var fGeo = new THREE.SphereGeometry(1.2, 6, 6);
            var fMat = makeMat(fc);
            var fMesh = new THREE.Mesh(fGeo, fMat);
            fMesh.position.set(flowerPositions[fi][0], flowerPositions[fi][1], flowerPositions[fi][2]);
            addMesh(fMesh);

            var stemGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 5);
            var stemMat = makeMat(0x336622);
            var stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.set(flowerPositions[fi][0], flowerPositions[fi][1] - 1.3, flowerPositions[fi][2]);
            addMesh(stem);
        }

        // Jubilee Market Hall — separate building to south-east
        var jFloorGeo = new THREE.BoxGeometry(40, 0.8, 28);
        var jFloorMat = makeMat(0xb89a6a);
        var jFloor = new THREE.Mesh(jFloorGeo, jFloorMat);
        jFloor.position.set(X_OFFSET + 30, 0.4, 50);
        addMesh(jFloor);

        var jWallNGeo = new THREE.BoxGeometry(40, 10, 1.5);
        var jWallMat = makeMat(0xcbaa7a);
        var jWallN = new THREE.Mesh(jWallNGeo, jWallMat);
        jWallN.position.set(X_OFFSET + 30, 5, 36);
        addMesh(jWallN);

        var jWallSGeo = new THREE.BoxGeometry(40, 10, 1.5);
        var jWallS = new THREE.Mesh(jWallSGeo, jWallMat);
        jWallS.position.set(X_OFFSET + 30, 5, 64);
        addMesh(jWallS);

        var jWallEGeo = new THREE.BoxGeometry(1.5, 10, 28);
        var jWallE = new THREE.Mesh(jWallEGeo, jWallMat);
        jWallE.position.set(X_OFFSET + 51, 5, 50);
        addMesh(jWallE);

        var jWallWGeo = new THREE.BoxGeometry(1.5, 10, 28);
        var jWallW = new THREE.Mesh(jWallWGeo, jWallMat);
        jWallW.position.set(X_OFFSET + 9, 5, 50);
        addMesh(jWallW);

        var jRoofGeo = new THREE.BoxGeometry(40, 2, 28);
        var jRoofMat = makeMat(0x88aaaa);
        var jRoof = new THREE.Mesh(jRoofGeo, jRoofMat);
        jRoof.position.set(X_OFFSET + 30, 11, 50);
        addMesh(jRoof);
    }

    function buildRoyalOperaHouse() {
        // ROH is to the north-east of the market
        var rohX = X_OFFSET + 55;
        var rohZ = -60;

        // Main building body
        var bodyGeo = new THREE.BoxGeometry(60, 30, 40);
        var bodyMat = makeMat(0xe8dcc8);
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(rohX, 15, rohZ);
        addMesh(body);

        // Portico base / podium
        var podGeo = new THREE.BoxGeometry(42, 3, 8);
        var podMat = makeMat(0xd8cbb4);
        var pod = new THREE.Mesh(podGeo, podMat);
        pod.position.set(rohX, 1.5, rohZ + 24);
        addMesh(pod);

        // 8 Corinthian columns along facade
        var rohColMat = makeMat(0xeee8d8);
        for (var rc = 0; rc < 8; rc++) {
            var rohColGeo = new THREE.CylinderGeometry(0.7, 0.85, 22, 10);
            var rohCol = new THREE.Mesh(rohColGeo, rohColMat);
            rohCol.position.set(rohX - 18 + rc * 5.2, 13, rohZ + 23);
            addMesh(rohCol);
        }

        // Pediment (triangular top of portico)
        var pedGeo = new THREE.ConeGeometry(22, 6, 3);
        var pedMat = makeMat(0xe0d4bc);
        var ped = new THREE.Mesh(pedGeo, pedMat);
        ped.position.set(rohX, 27, rohZ + 21);
        ped.rotation.y = Math.PI / 6;
        addMesh(ped);

        // Entablature / architrave band
        var entGeo = new THREE.BoxGeometry(44, 3, 5);
        var entMat = makeMat(0xd8ccb4);
        var ent = new THREE.Mesh(entGeo, entMat);
        ent.position.set(rohX, 25, rohZ + 21);
        addMesh(ent);

        // Large arched windows — 3 on facade
        var winMat = makeMat(0x99bbcc);
        var winPositions = [-12, 0, 12];
        for (var wi = 0; wi < winPositions.length; wi++) {
            var winGeo = new THREE.BoxGeometry(5, 10, 1);
            var win = new THREE.Mesh(winGeo, winMat);
            win.position.set(rohX + winPositions[wi], 12, rohZ + 20.5);
            addMesh(win);

            var winArchGeo = new THREE.CylinderGeometry(2.5, 2.5, 1, 8, 1, false, 0, Math.PI);
            var winArch = new THREE.Mesh(winArchGeo, winMat);
            winArch.position.set(rohX + winPositions[wi], 17.5, rohZ + 20.5);
            winArch.rotation.z = Math.PI / 2;
            addMesh(winArch);
        }

        // Floral Hall glass barrel vault on east side
        var fhGeo = new THREE.CylinderGeometry(10, 10, 28, 12, 1, false, 0, Math.PI);
        var fhMat = makeMat(0xaaccbb);
        var fh = new THREE.Mesh(fhGeo, fhMat);
        fh.position.set(rohX + 38, 18, rohZ);
        fh.rotation.z = Math.PI / 2;
        addMesh(fh);

        // Floral Hall end wall
        var fhEndGeo = new THREE.BoxGeometry(2, 22, 28);
        var fhEndMat = makeMat(0x99bbaa);
        var fhEnd = new THREE.Mesh(fhEndGeo, fhEndMat);
        fhEnd.position.set(rohX + 52, 10, rohZ);
        addMesh(fhEnd);
    }

    function buildPiazza() {
        // Cobbled central piazza
        var piazzaGeo = new THREE.BoxGeometry(100, 0.4, 80);
        var piazzaMat = makeMat(0x999088);
        var piazza = new THREE.Mesh(piazzaGeo, piazzaMat);
        piazza.position.set(X_OFFSET, 0.2, 10);
        addMesh(piazza);

        // Cobble pattern lines (LineSegments)
        var lineGeo = new THREE.BoxGeometry(100, 0.1, 0.3);
        var lineMat = makeMat(0x777060);
        for (var li = -4; li <= 4; li++) {
            var lineMesh = new THREE.Mesh(lineGeo, lineMat);
            lineMesh.position.set(X_OFFSET, 0.45, li * 9);
            addMesh(lineMesh);
        }

        // Stone plinth / performance platform
        var plinthGeo = new THREE.BoxGeometry(12, 0.8, 10);
        var plinthMat = makeMat(0xb8a898);
        var plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.set(X_OFFSET - 10, 0.6, -10);
        addMesh(plinth);

        // Plinth steps
        var step1Geo = new THREE.BoxGeometry(14, 0.4, 12);
        var stepMat = makeMat(0xaaa090);
        var step1 = new THREE.Mesh(step1Geo, stepMat);
        step1.position.set(X_OFFSET - 10, 0.2, -10);
        addMesh(step1);

        // Juggler figure (street performer)
        buildJuggler(X_OFFSET - 10, 1.4, -10);

        // Human statue figure
        buildHumanStatue(X_OFFSET + 5, 0.6, -8);
    }

    function buildJuggler(px, py, pz) {
        // Body
        var bodyGeo = new THREE.BoxGeometry(1.2, 2, 0.6);
        var bodyMat = makeMat(0xcc4422);
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(px, py + 1.2, pz);
        addMesh(body);

        // Head
        var headGeo = new THREE.SphereGeometry(0.5, 7, 7);
        var headMat = makeMat(0xf5c8a0);
        var head = new THREE.Mesh(headGeo, headMat);
        head.position.set(px, py + 2.8, pz);
        addMesh(head);

        // Arms raised
        var armMatJ = makeMat(0xcc4422);
        var armLGeo = new THREE.BoxGeometry(0.3, 1.6, 0.3);
        var armL = new THREE.Mesh(armLGeo, armMatJ);
        armL.position.set(px - 1.1, py + 2.2, pz);
        armL.rotation.z = -0.8;
        addMesh(armL);

        var armRGeo = new THREE.BoxGeometry(0.3, 1.6, 0.3);
        var armR = new THREE.Mesh(armRGeo, armMatJ);
        armR.position.set(px + 1.1, py + 2.2, pz);
        armR.rotation.z = 0.8;
        addMesh(armR);

        // Juggling balls
        var ballMat1 = makeMat(0xffdd00);
        var ballMat2 = makeMat(0xff4400);
        var ballMat3 = makeMat(0x00aaff);

        var b1Geo = new THREE.SphereGeometry(0.22, 6, 6);
        var b1 = new THREE.Mesh(b1Geo, ballMat1);
        b1.position.set(px - 1.5, py + 3.5, pz);
        addMesh(b1);

        var b2Geo = new THREE.SphereGeometry(0.22, 6, 6);
        var b2 = new THREE.Mesh(b2Geo, ballMat2);
        b2.position.set(px, py + 4.5, pz);
        addMesh(b2);

        var b3Geo = new THREE.SphereGeometry(0.22, 6, 6);
        var b3 = new THREE.Mesh(b3Geo, ballMat3);
        b3.position.set(px + 1.5, py + 3.5, pz);
        addMesh(b3);

        // Legs
        var legMatJ = makeMat(0x222266);
        var legLGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
        var legL = new THREE.Mesh(legLGeo, legMatJ);
        legL.position.set(px - 0.3, py + 0.15, pz);
        addMesh(legL);

        var legRGeo = new THREE.BoxGeometry(0.4, 1.5, 0.4);
        var legR = new THREE.Mesh(legRGeo, legMatJ);
        legR.position.set(px + 0.3, py + 0.15, pz);
        addMesh(legR);
    }

    function buildHumanStatue(px, py, pz) {
        // Human statue painted gold
        var goldMat = makeMat(0xccaa22);

        var sBodyGeo = new THREE.BoxGeometry(1.2, 2.2, 0.7);
        var sBody = new THREE.Mesh(sBodyGeo, goldMat);
        sBody.position.set(px, py + 1.3, pz);
        addMesh(sBody);

        var sHeadGeo = new THREE.SphereGeometry(0.52, 7, 7);
        var sHead = new THREE.Mesh(sHeadGeo, goldMat);
        sHead.position.set(px, py + 2.9, pz);
        addMesh(sHead);

        // One arm extended outward
        var sArmGeo = new THREE.BoxGeometry(1.8, 0.3, 0.3);
        var sArm = new THREE.Mesh(sArmGeo, goldMat);
        sArm.position.set(px + 1.1, py + 2.2, pz);
        addMesh(sArm);

        // Other arm at side
        var sArm2Geo = new THREE.BoxGeometry(0.3, 1.4, 0.3);
        var sArm2 = new THREE.Mesh(sArm2Geo, goldMat);
        sArm2.position.set(px - 0.75, py + 1.6, pz);
        addMesh(sArm2);

        var sLegLGeo = new THREE.BoxGeometry(0.45, 1.6, 0.45);
        var sLegL = new THREE.Mesh(sLegLGeo, goldMat);
        sLegL.position.set(px - 0.3, py + 0.2, pz);
        addMesh(sLegL);

        var sLegRGeo = new THREE.BoxGeometry(0.45, 1.6, 0.45);
        var sLegR = new THREE.Mesh(sLegRGeo, goldMat);
        sLegR.position.set(px + 0.3, py + 0.2, pz);
        addMesh(sLegR);

        // Pedestal box for human statue
        var pedGeo = new THREE.BoxGeometry(1.8, 1.2, 1.8);
        var pedMat = makeMat(0x888870);
        var ped = new THREE.Mesh(pedGeo, pedMat);
        ped.position.set(px, py - 0.4, pz);
        addMesh(ped);
    }

    function buildStPaulsChurch() {
        // St Paul's Church (Inigo Jones) to the west of piazza
        var churchX = X_OFFSET - 75;
        var churchZ = 10;

        // Church body — simple rectangular box
        var cBodyGeo = new THREE.BoxGeometry(30, 14, 22);
        var cBodyMat = makeMat(0xd8c8a0);
        var cBody = new THREE.Mesh(cBodyGeo, cBodyMat);
        cBody.position.set(churchX, 7, churchZ);
        addMesh(cBody);

        // Tuscan portico roof
        var pRoofGeo = new THREE.BoxGeometry(18, 1.5, 7);
        var pRoofMat = makeMat(0xc8b888);
        var pRoof = new THREE.Mesh(pRoofGeo, pRoofMat);
        pRoof.position.set(churchX, 10.5, churchZ + 14.5);
        addMesh(pRoof);

        // Portico pediment
        var ppGeo = new THREE.ConeGeometry(10, 4, 3);
        var ppMat = makeMat(0xd0c090);
        var pp = new THREE.Mesh(ppGeo, ppMat);
        pp.position.set(churchX, 13, churchZ + 14);
        pp.rotation.y = Math.PI / 6;
        addMesh(pp);

        // Tuscan columns — 2 columns portico
        var tcMat = makeMat(0xe0d4b4);
        for (var tc = 0; tc < 4; tc++) {
            var tcGeo = new THREE.CylinderGeometry(0.55, 0.65, 9, 8);
            var tcMesh = new THREE.Mesh(tcGeo, tcMat);
            tcMesh.position.set(churchX - 6 + tc * 4, 5.5, churchZ + 14.5);
            addMesh(tcMesh);
        }

        // Large timber doors
        var doorGeo = new THREE.BoxGeometry(4, 6, 0.5);
        var doorMat = makeMat(0x5c3a1e);
        var door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(churchX, 3.5, churchZ + 11.2);
        addMesh(door);

        // Pitched roof
        var roofGeo = new THREE.CylinderGeometry(0.1, 17, 6, 3);
        var roofMat = makeMat(0x7a6050);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(churchX, 17.5, churchZ);
        roof.rotation.y = Math.PI / 6;
        addMesh(roof);

        // Walled churchyard — 4 walls
        var wallHigh = 2.5;
        var wyMat = makeMat(0xc0ae88);

        var wyN = new THREE.Mesh(new THREE.BoxGeometry(50, wallHigh, 1), wyMat);
        wyN.position.set(churchX, wallHigh / 2, churchZ - 18);
        addMesh(wyN);

        var wyS = new THREE.Mesh(new THREE.BoxGeometry(50, wallHigh, 1), wyMat);
        wyS.position.set(churchX, wallHigh / 2, churchZ + 22);
        addMesh(wyS);

        var wyW = new THREE.Mesh(new THREE.BoxGeometry(1, wallHigh, 40), wyMat);
        wyW.position.set(churchX - 26, wallHigh / 2, churchZ + 2);
        addMesh(wyW);

        var wyE = new THREE.Mesh(new THREE.BoxGeometry(1, wallHigh, 40), wyMat);
        wyE.position.set(churchX + 24, wallHigh / 2, churchZ + 2);
        addMesh(wyE);
    }

    function buildSevenDials() {
        // Seven Dials — iconic junction north of Covent Garden
        var sdX = X_OFFSET - 30;
        var sdZ = -90;

        // Central column base / plinth
        var sdBaseGeo = new THREE.CylinderGeometry(2.5, 3, 1.5, 7);
        var sdBaseMat = makeMat(0xb0a090);
        var sdBase = new THREE.Mesh(sdBaseGeo, sdBaseMat);
        sdBase.position.set(sdX, 0.75, sdZ);
        addMesh(sdBase);

        // Sundial column shaft
        var sdColGeo = new THREE.CylinderGeometry(0.5, 0.7, 8, 8);
        var sdColMat = makeMat(0x888880);
        var sdCol = new THREE.Mesh(sdColGeo, sdColMat);
        sdCol.position.set(sdX, 5.5, sdZ);
        addMesh(sdCol);

        // Column capital
        var sdCapGeo = new THREE.CylinderGeometry(1.2, 0.5, 1.5, 8);
        var sdCapMat = makeMat(0x999990);
        var sdCap = new THREE.Mesh(sdCapGeo, sdCapMat);
        sdCap.position.set(sdX, 10, sdZ);
        addMesh(sdCap);

        // 7 sundial faces as flat boxes radiating from top of column
        var dialMat = makeMat(0xaaaaaa);
        for (var di = 0; di < 7; di++) {
            var angle = (di / 7) * Math.PI * 2;
            var dGeo = new THREE.BoxGeometry(2, 1.5, 0.2);
            var dMesh = new THREE.Mesh(dGeo, dialMat);
            dMesh.position.set(
                sdX + Math.cos(angle) * 1.5,
                10.5,
                sdZ + Math.sin(angle) * 1.5
            );
            dMesh.rotation.y = -angle;
            addMesh(dMesh);
        }

        // 7 roads radiating from the junction (simple flat strips)
        var roadMat = makeMat(0x555550);
        for (var ri = 0; ri < 7; ri++) {
            var rAngle = (ri / 7) * Math.PI * 2;
            var roadGeo = new THREE.BoxGeometry(4, 0.2, 40);
            var road = new THREE.Mesh(roadGeo, roadMat);
            road.position.set(
                sdX + Math.cos(rAngle) * 22,
                0.1,
                sdZ + Math.sin(rAngle) * 22
            );
            road.rotation.y = -rAngle;
            addMesh(road);
        }

        // Circular junction ground
        var juncGeo = new THREE.CylinderGeometry(8, 8, 0.25, 14);
        var juncMat = makeMat(0x777770);
        var junc = new THREE.Mesh(juncGeo, juncMat);
        junc.position.set(sdX, 0.12, sdZ);
        addMesh(junc);
    }

    function buildSurroundingStreets() {
        // Street paving around piazza
        var streetMat = makeMat(0x888880);

        // North street
        var sNGeo = new THREE.BoxGeometry(100, 0.3, 14);
        var sN = new THREE.Mesh(sNGeo, streetMat);
        sN.position.set(X_OFFSET, 0.15, -45);
        addMesh(sN);

        // South street
        var sSGeo = new THREE.BoxGeometry(100, 0.3, 14);
        var sS = new THREE.Mesh(sSGeo, streetMat);
        sS.position.set(X_OFFSET, 0.15, 55);
        addMesh(sS);

        // East street
        var sEGeo = new THREE.BoxGeometry(14, 0.3, 80);
        var sE = new THREE.Mesh(sEGeo, streetMat);
        sE.position.set(X_OFFSET + 65, 0.15, 10);
        addMesh(sE);

        // West street
        var sWGeo = new THREE.BoxGeometry(14, 0.3, 80);
        var sW = new THREE.Mesh(sWGeo, streetMat);
        sW.position.set(X_OFFSET - 65, 0.15, 10);
        addMesh(sW);

        // Lamp posts around piazza
        var lampMat = makeMat(0x222222);
        var lampTopMat = makeMat(0xffffcc, 0xffffaa);
        var lampPositions = [
            [X_OFFSET - 45, 0, -38],
            [X_OFFSET + 45, 0, -38],
            [X_OFFSET - 45, 0, 55],
            [X_OFFSET + 45, 0, 55],
            [X_OFFSET, 0, -38],
            [X_OFFSET, 0, 55]
        ];
        for (var lpi = 0; lpi < lampPositions.length; lpi++) {
            var lpx = lampPositions[lpi][0];
            var lpy = lampPositions[lpi][1];
            var lpz = lampPositions[lpi][2];

            var poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 7, 6);
            var pole = new THREE.Mesh(poleGeo, lampMat);
            pole.position.set(lpx, lpy + 3.5, lpz);
            addMesh(pole);

            var globeGeo = new THREE.SphereGeometry(0.4, 6, 6);
            var globe = new THREE.Mesh(globeGeo, lampTopMat);
            globe.position.set(lpx, lpy + 7.3, lpz);
            addMesh(globe);
        }
    }

    function build() {
        buildMarketHall();
        buildRoyalOperaHouse();
        buildPiazza();
        buildStPaulsChurch();
        buildSevenDials();
        buildSurroundingStreets();
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

    return { init: init, update: update, reset: reset };
}());
