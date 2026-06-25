window.RyeCobbles = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10480;

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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildMermaidStreet() {
        // Steep cobbled lane base
        var roadGeo = new THREE.BoxGeometry(6, 0.3, 60);
        var roadMat = makeMat(0x7a6a5a);
        var road = new THREE.Mesh(roadGeo, roadMat);
        road.position.set(X_OFFSET, 0.15, 0);
        addMesh(road);

        // Cobblestone details — small boxes as cobble patches
        var cobbleMat = makeMat(0x6b5d4f);
        for (var ci = 0; ci < 12; ci++) {
            var cGeo = new THREE.BoxGeometry(5.5, 0.1, 4);
            var cob = new THREE.Mesh(cGeo, cobbleMat);
            cob.position.set(X_OFFSET, 0.31, -22 + ci * 4);
            addMesh(cob);
        }

        // 8 buildings per side (left and right of street)
        var buildingColors = [0x8b7355, 0x7a6a50, 0x9b8060, 0x6d5f4a, 0x8a7045, 0x755a40, 0x9a7e5f, 0x7c6650];
        var timberColors   = [0x3d2b1f, 0x2e2016, 0x4a3020, 0x3a2515, 0x2d1e0e, 0x3f2a18, 0x4d3525, 0x2a1a0c];

        for (var i = 0; i < 8; i++) {
            var bz = -24.5 + i * 7;
            var bw = 5.5;
            var bh = 5 + (i % 3) * 1.5;
            var bd = 6;

            // Left side buildings (negative X from street center)
            var lx = X_OFFSET - 5.5;
            var lGround = new THREE.BoxGeometry(bw, bh, bd);
            var lMesh = new THREE.Mesh(lGround, makeMat(buildingColors[i]));
            lMesh.position.set(lx, bh / 2, bz);
            addMesh(lMesh);

            // Jettied upper floor — overhangs street
            var lUpperGeo = new THREE.BoxGeometry(bw + 1.2, 2.5, bd);
            var lUpper = new THREE.Mesh(lUpperGeo, makeMat(timberColors[i]));
            lUpper.position.set(lx + 0.6, bh + 1.25, bz);
            addMesh(lUpper);

            // Timber frame stripes on upper floor
            var lFrameGeo = new THREE.BoxGeometry(0.2, 2.5, bd + 0.1);
            for (var tf = 0; tf < 3; tf++) {
                var lFrame = new THREE.Mesh(lFrameGeo, makeMat(0x2a1a0a));
                lFrame.position.set(lx - 1.8 + tf * 1.8 + 0.6, bh + 1.25, bz);
                addMesh(lFrame);
            }

            // Roof left
            var lRoofGeo = new THREE.BoxGeometry(bw + 1.4, 0.4, bd + 0.4);
            var lRoof = new THREE.Mesh(lRoofGeo, makeMat(0x3d2e1e));
            lRoof.position.set(lx + 0.6, bh + 2.7, bz);
            addMesh(lRoof);

            // Right side buildings (positive X from street center)
            var rx = X_OFFSET + 5.5;
            var rGround = new THREE.BoxGeometry(bw, bh, bd);
            var rMesh = new THREE.Mesh(rGround, makeMat(buildingColors[(i + 3) % 8]));
            rMesh.position.set(rx, bh / 2, bz);
            addMesh(rMesh);

            // Jettied upper floor right
            var rUpperGeo = new THREE.BoxGeometry(bw + 1.2, 2.5, bd);
            var rUpper = new THREE.Mesh(rUpperGeo, makeMat(timberColors[(i + 2) % 8]));
            rUpper.position.set(rx - 0.6, bh + 1.25, bz);
            addMesh(rUpper);

            // Timber frame right
            var rFrameGeo = new THREE.BoxGeometry(0.2, 2.5, bd + 0.1);
            for (var tf2 = 0; tf2 < 3; tf2++) {
                var rFrame = new THREE.Mesh(rFrameGeo, makeMat(0x2a1a0a));
                rFrame.position.set(rx - 1.8 + tf2 * 1.8 - 0.6, bh + 1.25, bz);
                addMesh(rFrame);
            }

            // Roof right
            var rRoofGeo = new THREE.BoxGeometry(bw + 1.4, 0.4, bd + 0.4);
            var rRoof = new THREE.Mesh(rRoofGeo, makeMat(0x3d2e1e));
            rRoof.position.set(rx - 0.6, bh + 2.7, bz);
            addMesh(rRoof);

            // Window openings (small dark boxes inset on ground floor)
            var winMat = makeMat(0x1a1208);
            var winGeo = new THREE.BoxGeometry(1.2, 1.4, 0.1);
            var lWin = new THREE.Mesh(winGeo, winMat);
            lWin.position.set(lx, bh * 0.4, bz - bd / 2 + 0.05);
            addMesh(lWin);
            var rWin = new THREE.Mesh(winGeo, winMat);
            rWin.position.set(rx, bh * 0.4, bz - bd / 2 + 0.05);
            addMesh(rWin);
        }
    }

    function buildStMarysChurch() {
        // Hilltop position — elevated
        var hillGeo = new THREE.BoxGeometry(22, 4, 22);
        var hillMesh = new THREE.Mesh(hillGeo, makeMat(0x5a7040));
        hillMesh.position.set(X_OFFSET + 30, 2, -50);
        addMesh(hillMesh);

        // Flint tower base
        var towerGeo = new THREE.BoxGeometry(8, 18, 8);
        var towerMat = makeMat(0x6a6860);
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(X_OFFSET + 30, 4 + 9, -50);
        addMesh(tower);

        // Flint texture suggestion — alternating stone bands
        var bandMat = makeMat(0x585650);
        for (var band = 0; band < 6; band++) {
            var bandGeo = new THREE.BoxGeometry(8.1, 0.3, 8.1);
            var bandMesh = new THREE.Mesh(bandGeo, bandMat);
            bandMesh.position.set(X_OFFSET + 30, 4 + band * 3 + 1.5, -50);
            addMesh(bandMesh);
        }

        // Battlements on top
        var merlonMat = makeMat(0x6a6860);
        for (var m = 0; m < 4; m++) {
            var merlonGeo = new THREE.BoxGeometry(2, 2, 2);
            var angles = [
                [X_OFFSET + 27, 4 + 19, -53],
                [X_OFFSET + 33, 4 + 19, -53],
                [X_OFFSET + 27, 4 + 19, -47],
                [X_OFFSET + 33, 4 + 19, -47]
            ];
            var merlon = new THREE.Mesh(merlonGeo, merlonMat);
            merlon.position.set(angles[m][0], angles[m][1], angles[m][2]);
            addMesh(merlon);
        }

        // Clock faces on each side — light square inset
        var clockMat = makeMat(0xd4c89a);
        var clockPositions = [
            [X_OFFSET + 30, 4 + 13, -46.01, 0, 0],
            [X_OFFSET + 30, 4 + 13, -53.99, 0, 0],
            [X_OFFSET + 26.01, 4 + 13, -50, 0, 0],
            [X_OFFSET + 33.99, 4 + 13, -50, 0, 0]
        ];
        for (var c = 0; c < 4; c++) {
            var clockGeo = new THREE.BoxGeometry(2.5, 2.5, 0.15);
            var clockMesh = new THREE.Mesh(clockGeo, clockMat);
            clockMesh.position.set(clockPositions[c][0], clockPositions[c][1], clockPositions[c][2]);
            addMesh(clockMesh);
        }

        // Church nave
        var naveGeo = new THREE.BoxGeometry(14, 8, 20);
        var nave = new THREE.Mesh(naveGeo, makeMat(0x6a6860));
        nave.position.set(X_OFFSET + 30, 4 + 4, -55);
        addMesh(nave);

        // Nave roof
        var naveRoofGeo = new THREE.BoxGeometry(15, 1.5, 21);
        var naveRoof = new THREE.Mesh(naveRoofGeo, makeMat(0x3a3530));
        naveRoof.position.set(X_OFFSET + 30, 4 + 8.75, -55);
        addMesh(naveRoof);
    }

    function buildLandgate() {
        // Stone archway base
        var gateMat = makeMat(0x7a7260);

        // Left tower
        var ltGeo = new THREE.CylinderGeometry(3, 3.5, 14, 8);
        var lt = new THREE.Mesh(ltGeo, gateMat);
        lt.position.set(X_OFFSET - 6, 7, 60);
        addMesh(lt);

        // Right tower
        var rtGeo = new THREE.CylinderGeometry(3, 3.5, 14, 8);
        var rt = new THREE.Mesh(rtGeo, gateMat);
        rt.position.set(X_OFFSET + 6, 7, 60);
        addMesh(rt);

        // Arch passage (gateway body between towers)
        var archBodyGeo = new THREE.BoxGeometry(12, 10, 5);
        var archBody = new THREE.Mesh(archBodyGeo, gateMat);
        archBody.position.set(X_OFFSET, 5, 60);
        addMesh(archBody);

        // Dark archway opening
        var openingGeo = new THREE.BoxGeometry(4, 7, 5.2);
        var opening = new THREE.Mesh(openingGeo, makeMat(0x111008));
        opening.position.set(X_OFFSET, 3.5, 60);
        addMesh(opening);

        // Arch keystone row above opening
        var keystoneGeo = new THREE.BoxGeometry(4.5, 1.5, 5.2);
        var keystone = new THREE.Mesh(keystoneGeo, makeMat(0x8a8070));
        keystone.position.set(X_OFFSET, 7.75, 60);
        addMesh(keystone);

        // Battlements on arch top
        var bMat = makeMat(0x7a7260);
        for (var bm = 0; bm < 5; bm++) {
            var bmGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
            var bmMesh = new THREE.Mesh(bmGeo, bMat);
            bmMesh.position.set(X_OFFSET - 4 + bm * 2, 11, 60);
            addMesh(bmMesh);
        }

        // Parapet over towers
        var lParGeo = new THREE.CylinderGeometry(3.2, 3, 1.5, 8);
        var lPar = new THREE.Mesh(lParGeo, gateMat);
        lPar.position.set(X_OFFSET - 6, 14.75, 60);
        addMesh(lPar);

        var rParGeo = new THREE.CylinderGeometry(3.2, 3, 1.5, 8);
        var rPar = new THREE.Mesh(rParGeo, gateMat);
        rPar.position.set(X_OFFSET + 6, 14.75, 60);
        addMesh(rPar);

        // Conical caps on towers
        var lCapGeo = new THREE.ConeGeometry(3.2, 4, 8);
        var lCap = new THREE.Mesh(lCapGeo, makeMat(0x4a4035));
        lCap.position.set(X_OFFSET - 6, 17.5, 60);
        addMesh(lCap);

        var rCapGeo = new THREE.ConeGeometry(3.2, 4, 8);
        var rCap = new THREE.Mesh(rCapGeo, makeMat(0x4a4035));
        rCap.position.set(X_OFFSET + 6, 17.5, 60);
        addMesh(rCap);
    }

    function buildHarbourView() {
        // Flat marshland ground
        var marshGeo = new THREE.BoxGeometry(120, 0.3, 60);
        var marshMesh = new THREE.Mesh(marshGeo, makeMat(0x4a5e30));
        marshMesh.position.set(X_OFFSET, 0.15, 110);
        addMesh(marshMesh);

        // Distant water surface
        var waterGeo = new THREE.BoxGeometry(120, 0.2, 40);
        var water = new THREE.Mesh(waterGeo, makeMat(0x2a4a6a));
        water.position.set(X_OFFSET, 0.25, 150);
        addMesh(water);

        // Reed patches — thin box rows
        var reedMat = makeMat(0x7a6a30);
        for (var r = 0; r < 10; r++) {
            var rz = 90 + (r % 5) * 8;
            var rx = X_OFFSET - 40 + Math.floor(r / 5) * 60;
            var reedGeo = new THREE.BoxGeometry(8, 1.5, 0.4);
            var reed = new THREE.Mesh(reedGeo, reedMat);
            reed.position.set(rx, 1.05, rz);
            addMesh(reed);

            var reedGeo2 = new THREE.BoxGeometry(0.4, 1.5, 8);
            var reed2 = new THREE.Mesh(reedGeo2, reedMat);
            reed2.position.set(rx + 3, 1.05, rz + 2);
            addMesh(reed2);
        }

        // Windmill silhouette — body
        var millBodyGeo = new THREE.CylinderGeometry(2, 2.5, 10, 8);
        var millBody = new THREE.Mesh(millBodyGeo, makeMat(0x3a3530));
        millBody.position.set(X_OFFSET - 35, 5, 100);
        addMesh(millBody);

        // Windmill cap
        var millCapGeo = new THREE.ConeGeometry(2.2, 3, 8);
        var millCap = new THREE.Mesh(millCapGeo, makeMat(0x2e2820));
        millCap.position.set(X_OFFSET - 35, 11.5, 100);
        addMesh(millCap);

        // Windmill sails — two crossing boxes
        var sailMat = makeMat(0xc8b87a);
        var sail1Geo = new THREE.BoxGeometry(14, 0.6, 0.6);
        var sail1 = new THREE.Mesh(sail1Geo, sailMat);
        sail1.position.set(X_OFFSET - 35, 11, 99.7);
        addMesh(sail1);

        var sail2Geo = new THREE.BoxGeometry(0.6, 14, 0.6);
        var sail2 = new THREE.Mesh(sail2Geo, sailMat);
        sail2.position.set(X_OFFSET - 35, 11, 99.7);
        addMesh(sail2);

        // Harbour wall suggestion
        var wallGeo = new THREE.BoxGeometry(120, 1.5, 2);
        var wall = new THREE.Mesh(wallGeo, makeMat(0x706050));
        wall.position.set(X_OFFSET, 0.75, 135);
        addMesh(wall);
    }

    function buildYpresTower() {
        var towerMat = makeMat(0x6e6558);

        // Main squat square body
        var bodyGeo = new THREE.BoxGeometry(12, 12, 12);
        var body = new THREE.Mesh(bodyGeo, towerMat);
        body.position.set(X_OFFSET + 45, 6, -20);
        addMesh(body);

        // Corner turrets (4 cylindrical)
        var turretPositions = [
            [X_OFFSET + 39, -20],
            [X_OFFSET + 51, -20],
            [X_OFFSET + 39, -14],
            [X_OFFSET + 51, -14]
        ];
        for (var t = 0; t < 4; t++) {
            var turGeo = new THREE.CylinderGeometry(1.8, 2, 14, 6);
            var tur = new THREE.Mesh(turGeo, towerMat);
            tur.position.set(turretPositions[t][0], 7, turretPositions[t][1]);
            addMesh(tur);

            // Turret cap
            var turCapGeo = new THREE.ConeGeometry(2, 3, 6);
            var turCap = new THREE.Mesh(turCapGeo, makeMat(0x3e3530));
            turCap.position.set(turretPositions[t][0], 15.5, turretPositions[t][1]);
            addMesh(turCap);
        }

        // Battlements on main tower top
        var btMat = makeMat(0x6e6558);
        var btPositions = [
            [X_OFFSET + 41, -23], [X_OFFSET + 45, -23], [X_OFFSET + 49, -23],
            [X_OFFSET + 41, -17], [X_OFFSET + 45, -17], [X_OFFSET + 49, -17],
            [X_OFFSET + 39, -21], [X_OFFSET + 39, -19],
            [X_OFFSET + 51, -21], [X_OFFSET + 51, -19]
        ];
        for (var bt = 0; bt < btPositions.length; bt++) {
            var btGeo = new THREE.BoxGeometry(1.8, 2, 1.8);
            var btMesh = new THREE.Mesh(btGeo, btMat);
            btMesh.position.set(btPositions[bt][0], 13, btPositions[bt][1]);
            addMesh(btMesh);
        }

        // Moat suggestion — flat dark strip around tower
        var moatMat = makeMat(0x1a2a3a);
        var moatGeo = new THREE.BoxGeometry(22, 0.2, 22);
        var moat = new THREE.Mesh(moatGeo, moatMat);
        moat.position.set(X_OFFSET + 45, 0.1, -20);
        addMesh(moat);

        // Moat bank (raised earth rim)
        var bankGeo = new THREE.BoxGeometry(26, 1, 26);
        var bank = new THREE.Mesh(bankGeo, makeMat(0x4a5a30));
        bank.position.set(X_OFFSET + 45, -0.5, -20);
        addMesh(bank);

        // Ground under tower (fill in moat center)
        var groundGeo = new THREE.BoxGeometry(14, 0.25, 14);
        var ground = new THREE.Mesh(groundGeo, makeMat(0x5a5040));
        ground.position.set(X_OFFSET + 45, 0.15, -20);
        addMesh(ground);

        // Arrow slit windows
        var slitMat = makeMat(0x0d0c0a);
        for (var s = 0; s < 4; s++) {
            var slitGeo = new THREE.BoxGeometry(0.4, 2, 0.15);
            var slitOffsets = [
                [X_OFFSET + 45, 6, -14.05],
                [X_OFFSET + 45, 6, -25.95],
                [X_OFFSET + 39.05, 6, -20],
                [X_OFFSET + 50.95, 6, -20]
            ];
            var slit = new THREE.Mesh(slitGeo, slitMat);
            slit.position.set(slitOffsets[s][0], slitOffsets[s][1], slitOffsets[s][2]);
            addMesh(slit);
        }
    }

    function buildGroundPlane() {
        // Base ground for the whole environment
        var gGeo = new THREE.BoxGeometry(160, 0.5, 240);
        var gMesh = new THREE.Mesh(gGeo, makeMat(0x5a6040));
        gMesh.position.set(X_OFFSET, -0.25, 30);
        addMesh(gMesh);
    }

    function build() {
        buildGroundPlane();
        buildMermaidStreet();
        buildStMarysChurch();
        buildLandgate();
        buildHarbourView();
        buildYpresTower();
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
