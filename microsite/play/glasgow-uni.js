window.GlasgowUni = (function() {
    'use strict';

    var WORLD_X = 2140;
    var WORLD_Z = 2200;

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        return new THREE.Mesh(geo, mat);
    }

    function makeCylinder(rt, rb, h, segs, color) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        return new THREE.Mesh(geo, mat);
    }

    function makeSphere(r, ws, hs, color) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        return new THREE.Mesh(geo, mat);
    }

    function makeCone(r, h, segs, color) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        return new THREE.Mesh(geo, mat);
    }

    function makeEdges(mesh) {
        var edges = new THREE.EdgesGeometry(mesh.geometry);
        var mat = new THREE.LineBasicMaterial({ color: 0x333333 });
        return new THREE.LineSegments(edges, mat);
    }

    function buildMainSpire(scene) {
        var ox = WORLD_X + 0;
        var oz = WORLD_Z + 0;

        // Main tower base
        var tower = makeBox(8, 40, 8, 0x9A8A78);
        tower.position.set(ox, 20, oz);
        scene.add(tower);

        // Upper tower section
        var upperTower = makeBox(6, 20, 6, 0x9A8A78);
        upperTower.position.set(ox, 50, oz);
        scene.add(upperTower);

        // Spire cone top
        var spire = makeCone(3, 24, 8, 0x888070);
        spire.position.set(ox, 72, oz);
        scene.add(spire);

        // Clock faces on 4 sides (glass box inserts)
        var clockOffsets = [
            [0, 0, 3.6],
            [0, 0, -3.6],
            [3.6, 0, 0],
            [-3.6, 0, 0]
        ];
        for (var i = 0; i < clockOffsets.length; i++) {
            var co = clockOffsets[i];
            var clockFace = makeBox(2.5, 2.5, 0.3, 0xADD8E6);
            clockFace.position.set(ox + co[0], 44, oz + co[2]);
            if (co[0] !== 0) {
                clockFace.rotation.y = Math.PI / 2;
            }
            scene.add(clockFace);
        }

        // Corner buttresses
        var buttressPositions = [
            [4, 0, 4],
            [-4, 0, 4],
            [4, 0, -4],
            [-4, 0, -4]
        ];
        for (var j = 0; j < buttressPositions.length; j++) {
            var bp = buttressPositions[j];
            var buttress = makeBox(2, 30, 2, 0x8A7A6A);
            buttress.position.set(ox + bp[0], 15, oz + bp[2]);
            scene.add(buttress);
        }
    }

    function buildQuadrangle(scene, cx, cz, label) {
        var wallColor = 0xD4A97A;
        var wallThick = 2;
        var wallH = 8;
        var size = 20;
        var half = size / 2;

        // North wall
        var northWall = makeBox(size + wallThick * 2, wallH, wallThick, wallColor);
        northWall.position.set(cx, wallH / 2, cz - half);
        scene.add(northWall);

        // South wall
        var southWall = makeBox(size + wallThick * 2, wallH, wallThick, wallColor);
        southWall.position.set(cx, wallH / 2, cz + half);
        scene.add(southWall);

        // East wall
        var eastWall = makeBox(wallThick, wallH, size, wallColor);
        eastWall.position.set(cx + half, wallH / 2, cz);
        scene.add(eastWall);

        // West wall
        var westWall = makeBox(wallThick, wallH, size, wallColor);
        westWall.position.set(cx - half, wallH / 2, cz);
        scene.add(westWall);

        // Cloister columns — evenly spaced around inner perimeter
        var colColor = 0xC8996A;
        var colRadius = 0.4;
        var colH = 6;
        var colCount = 5;
        var spacing = size / (colCount + 1);

        // North colonnade (inner side)
        for (var i = 1; i <= colCount; i++) {
            var col = makeCylinder(colRadius, colRadius, colH, 8, colColor);
            col.position.set(cx - half + i * spacing, colH / 2, cz - half + 1.5);
            scene.add(col);
        }

        // South colonnade
        for (var si = 1; si <= colCount; si++) {
            var scol = makeCylinder(colRadius, colRadius, colH, 8, colColor);
            scol.position.set(cx - half + si * spacing, colH / 2, cz + half - 1.5);
            scene.add(scol);
        }

        // East colonnade
        for (var ei = 1; ei <= colCount; ei++) {
            var ecol = makeCylinder(colRadius, colRadius, colH, 8, colColor);
            ecol.position.set(cx + half - 1.5, colH / 2, cz - half + ei * spacing);
            scene.add(ecol);
        }

        // West colonnade
        for (var wi = 1; wi <= colCount; wi++) {
            var wcol = makeCylinder(colRadius, colRadius, colH, 8, colColor);
            wcol.position.set(cx - half + 1.5, colH / 2, cz - half + wi * spacing);
            scene.add(wcol);
        }
    }

    function buildButeHall(scene) {
        var ox = WORLD_X - 30;
        var oz = WORLD_Z + 10;
        var hallColor = 0xD4A97A;

        // Main hall body
        var hall = makeBox(24, 12, 14, hallColor);
        hall.position.set(ox, 6, oz);
        scene.add(hall);

        // Gable end (front)
        var gable = makeBox(24, 4, 1, 0xC49060);
        gable.position.set(ox, 14, oz - 7);
        scene.add(gable);

        // Gable peak (triangular approximation with cone)
        var gablePeak = makeCone(5, 4, 3, 0xB88050);
        gablePeak.position.set(ox, 18, oz - 7);
        scene.add(gablePeak);

        // Rose window (circular approximation — sphere inset)
        var roseWindow = makeSphere(1.8, 12, 8, 0x88AACC);
        roseWindow.position.set(ox, 10, oz - 7.1);
        scene.add(roseWindow);

        // Buttresses on sides
        var buttressXPositions = [-10, -5, 0, 5, 10];
        for (var i = 0; i < buttressXPositions.length; i++) {
            var bx = buttressXPositions[i];
            var buttN = makeBox(1.5, 10, 2, 0xC49060);
            buttN.position.set(ox + bx, 5, oz - 7);
            scene.add(buttN);

            var buttS = makeBox(1.5, 10, 2, 0xC49060);
            buttS.position.set(ox + bx, 5, oz + 7);
            scene.add(buttS);
        }

        // Entrance porch
        var porch = makeBox(6, 8, 4, 0xBE8A6A);
        porch.position.set(ox, 4, oz - 9);
        scene.add(porch);
    }

    function buildKelvingroveMunseum(scene) {
        var ox = WORLD_X - 80;
        var oz = WORLD_Z + 60;
        var museumColor = 0xB05050;

        // Main museum body
        var body = makeBox(35, 14, 20, museumColor);
        body.position.set(ox, 7, oz);
        scene.add(body);

        // Central entrance block
        var entrance = makeBox(10, 16, 6, 0xA04040);
        entrance.position.set(ox, 8, oz - 13);
        scene.add(entrance);

        // Entrance arch
        var archTop = makeCylinder(4, 4, 1.5, 16, 0xC06060);
        archTop.rotation.x = Math.PI / 2;
        archTop.position.set(ox, 10, oz - 16.5);
        scene.add(archTop);

        // Twin copper domes
        var domeColor = 0x4A9A7A;
        var domeLeft = makeSphere(5, 16, 12, domeColor);
        domeLeft.position.set(ox - 14, 18, oz);
        scene.add(domeLeft);

        var domeRight = makeSphere(5, 16, 12, domeColor);
        domeRight.position.set(ox + 14, 18, oz);
        scene.add(domeRight);

        // Dome drum bases
        var drumLeft = makeCylinder(3.5, 3.5, 3, 12, museumColor);
        drumLeft.position.set(ox - 14, 15, oz);
        scene.add(drumLeft);

        var drumRight = makeCylinder(3.5, 3.5, 3, 12, museumColor);
        drumRight.position.set(ox + 14, 15, oz);
        scene.add(drumRight);

        // Corner towers
        var cornerPositions = [
            [-16, -9],
            [16, -9],
            [-16, 9],
            [16, 9]
        ];
        for (var i = 0; i < cornerPositions.length; i++) {
            var cp = cornerPositions[i];
            var ctower = makeBox(4, 18, 4, museumColor);
            ctower.position.set(ox + cp[0], 9, oz + cp[1]);
            scene.add(ctower);

            var ctowerTop = makeCone(2.5, 5, 8, 0x904040);
            ctowerTop.position.set(ox + cp[0], 20.5, oz + cp[1]);
            scene.add(ctowerTop);
        }

        // Fountain plaza (flat base)
        var plazaBase = makeBox(12, 0.5, 12, 0x888888);
        plazaBase.position.set(ox, 0.25, oz - 22);
        scene.add(plazaBase);

        // Fountain basin
        var fountainBase = makeCylinder(4, 4.5, 0.6, 16, 0x999999);
        fountainBase.position.set(ox, 0.8, oz - 22);
        scene.add(fountainBase);

        // Fountain column
        var fountainCol = makeCylinder(0.3, 0.5, 3, 8, 0xAAAAAA);
        fountainCol.position.set(ox, 2, oz - 22);
        scene.add(fountainCol);

        // Fountain top bowl
        var fountainBowl = makeCylinder(1.5, 0.5, 0.4, 12, 0x999999);
        fountainBowl.position.set(ox, 3.5, oz - 22);
        scene.add(fountainBowl);

        // Staircase steps
        for (var s = 0; s < 4; s++) {
            var step = makeBox(12, 0.4, 1.2, 0xC8B090);
            step.position.set(ox, 0.2 + s * 0.4, oz - 14.5 - s * 1.2);
            scene.add(step);
        }
    }

    function buildKelvinBridge(scene) {
        var ox = WORLD_X - 50;
        var oz = WORLD_Z + 30;
        var stoneColor = 0xC8B090;

        // River Kelvin banks (decorative water channel)
        var riverBank1 = makeBox(30, 1.5, 3, 0x88AA88);
        riverBank1.position.set(ox, 0.75, oz - 5);
        scene.add(riverBank1);

        var riverBank2 = makeBox(30, 1.5, 3, 0x88AA88);
        riverBank2.position.set(ox, 0.75, oz + 5);
        scene.add(riverBank2);

        // River water surface
        var river = makeBox(30, 0.3, 7, 0x2266AA);
        river.position.set(ox, 0.5, oz);
        scene.add(river);

        // Bridge deck
        var deck = makeBox(20, 3, 6, stoneColor);
        deck.position.set(ox, 3.5, oz);
        scene.add(deck);

        // Bridge side parapets
        var parapetN = makeBox(20, 1.5, 0.5, stoneColor);
        parapetN.position.set(ox, 5.25, oz - 2.75);
        scene.add(parapetN);

        var parapetS = makeBox(20, 1.5, 0.5, stoneColor);
        parapetS.position.set(ox, 5.25, oz + 2.75);
        scene.add(parapetS);

        // Decorative sphere finials on corners
        var finialPositions = [
            [-10, -3],
            [-10, 3],
            [10, -3],
            [10, 3]
        ];
        for (var i = 0; i < finialPositions.length; i++) {
            var fp = finialPositions[i];
            var finialPost = makeBox(0.6, 2, 0.6, stoneColor);
            finialPost.position.set(ox + fp[0], 6.5, oz + fp[1]);
            scene.add(finialPost);

            var finialSphere = makeSphere(0.5, 8, 6, 0xD0C0A0);
            finialSphere.position.set(ox + fp[0], 8, oz + fp[1]);
            scene.add(finialSphere);
        }

        // Bridge arch supports (cylinders)
        var archPositions = [-6, 0, 6];
        for (var ai = 0; ai < archPositions.length; ai++) {
            var archCol = makeCylinder(0.8, 1.0, 4, 8, 0xBBAA88);
            archCol.position.set(ox + archPositions[ai], 1, oz);
            scene.add(archCol);
        }

        // Lamp posts on bridge
        var lampXPositions = [-8, 0, 8];
        for (var li = 0; li < lampXPositions.length; li++) {
            var lampPostN = makeCylinder(0.12, 0.15, 5, 6, 0x444444);
            lampPostN.position.set(ox + lampXPositions[li], 7.5, oz - 2.4);
            scene.add(lampPostN);

            var lampPostS = makeCylinder(0.12, 0.15, 5, 6, 0x444444);
            lampPostS.position.set(ox + lampXPositions[li], 7.5, oz + 2.4);
            scene.add(lampPostS);

            var lampN = makeSphere(0.25, 6, 4, 0xFFEEAA);
            lampN.position.set(ox + lampXPositions[li], 10, oz - 2.4);
            scene.add(lampN);

            var lampS = makeSphere(0.25, 6, 4, 0xFFEEAA);
            lampS.position.set(ox + lampXPositions[li], 10, oz + 2.4);
            scene.add(lampS);
        }
    }

    function buildGrounds(scene) {
        var ox = WORLD_X;
        var oz = WORLD_Z;

        // Flagpole
        var pole = makeCylinder(0.15, 0.2, 18, 6, 0xCCCCCC);
        pole.position.set(ox + 12, 9, oz - 10);
        scene.add(pole);

        var flag = makeBox(3, 1.5, 0.1, 0x0033AA);
        flag.position.set(ox + 13.5, 17, oz - 10);
        scene.add(flag);

        // Garden path (stone slabs)
        var pathSegments = [
            [0, 15],
            [0, 25],
            [0, 35]
        ];
        for (var pi = 0; pi < pathSegments.length; pi++) {
            var ps = pathSegments[pi];
            var pathSlab = makeBox(3, 0.2, 4, 0xAAAAAA);
            pathSlab.position.set(ox + ps[0], 0.1, oz + ps[1]);
            scene.add(pathSlab);
        }

        // Decorative gateposts at entrance
        var gatepostPositions = [-5, 5];
        for (var gi = 0; gi < gatepostPositions.length; gi++) {
            var gp = gatepostPositions[gi];
            var gatepost = makeBox(1.5, 5, 1.5, 0xC8B090);
            gatepost.position.set(ox + gp, 2.5, oz + 45);
            scene.add(gatepost);

            var gpCap = makeSphere(1, 8, 6, 0xD0C0A0);
            gpCap.position.set(ox + gp, 5.5, oz + 45);
            scene.add(gpCap);
        }
    }

    function build(scene) {
        buildMainSpire(scene);
        buildQuadrangle(scene, WORLD_X + 25, WORLD_Z - 15, 'east');
        buildQuadrangle(scene, WORLD_X - 25, WORLD_Z - 15, 'west');
        buildButeHall(scene);
        buildKelvingroveMunseum(scene);
        buildKelvinBridge(scene);
        buildGrounds(scene);
    }

    return {
        build: build,
        worldX: WORLD_X,
        worldZ: WORLD_Z
    };

}());
