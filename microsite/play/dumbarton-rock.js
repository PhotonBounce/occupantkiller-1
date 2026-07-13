window.DumbartonRock = (function() {
    'use strict';

    var WX = 2020;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
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

    function makeEdges(mesh) {
        var edges = new THREE.EdgesGeometry(mesh.geometry);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 }));
        line.position.copy(mesh.position);
        return line;
    }

    function build(scene) {
        var objects = [];

        // ── River Clyde water ──────────────────────────────────────────────
        var clydeSegments = [
            makeBox(120, 1, 40,  0x1A5A7A, WX,        -0.5, WZ - 35),
            makeBox(120, 1, 40,  0x1A5A7A, WX,        -0.5, WZ + 35),
            makeBox(40,  1, 30,  0x1A5A7A, WX - 50,   -0.5, WZ),
            makeBox(40,  1, 30,  0x1A5A7A, WX + 50,   -0.5, WZ),
            makeBox(60,  1, 20,  0x1A5A7A, WX - 30,   -0.5, WZ - 20),
            makeBox(60,  1, 20,  0x1A5A7A, WX + 30,   -0.5, WZ + 20)
        ];
        for (var i = 0; i < clydeSegments.length; i++) {
            scene.add(clydeSegments[i]);
            objects.push(clydeSegments[i]);
        }

        // ── Volcanic plug base ────────────────────────────────────────────
        var plugBase = makeBox(22, 4, 18, 0x2E2E2E, WX, 2, WZ);
        scene.add(plugBase);
        objects.push(plugBase);

        var plugMid = makeBox(18, 4, 14, 0x323232, WX, 6, WZ);
        scene.add(plugMid);
        objects.push(plugMid);

        // ── Twin basalt peaks ──────────────────────────────────────────────
        // Higher peak (west, Wallace Tower peak)
        var peak1Base = makeBox(10, 6, 9, 0x3A3A3A, WX - 4, 10, WZ);
        scene.add(peak1Base);
        objects.push(peak1Base);

        var peak1Mid = makeBox(8, 5, 7, 0x383838, WX - 4, 15.5, WZ);
        scene.add(peak1Mid);
        objects.push(peak1Mid);

        var peak1Top = makeBox(6, 5, 5, 0x363636, WX - 4, 20, WZ);
        scene.add(peak1Top);
        objects.push(peak1Top);
        // total height ~16 units above plug

        // Lower peak (east)
        var peak2Base = makeBox(8, 5, 7, 0x3C3C3C, WX + 5, 10, WZ);
        scene.add(peak2Base);
        objects.push(peak2Base);

        var peak2Mid = makeBox(6, 5, 5, 0x3A3A3A, WX + 5, 15, WZ);
        scene.add(peak2Mid);
        objects.push(peak2Mid);

        var peak2Top = makeBox(5, 4, 4, 0x383838, WX + 5, 19, WZ);
        scene.add(peak2Top);
        objects.push(peak2Top);
        // total height ~14 units above plug

        // Connecting saddle between peaks
        var saddle = makeBox(6, 3, 6, 0x363636, WX + 1, 10, WZ);
        scene.add(saddle);
        objects.push(saddle);

        // ── Castle walls on west (higher) peak ───────────────────────────
        var wallColor = 0x8A8A8A;
        var wallH = 4;
        var wallT = 1;

        // North wall
        var wN1 = makeBox(8, wallH, wallT, wallColor, WX - 4, 25, WZ - 3.5);
        scene.add(wN1); objects.push(wN1);
        // South wall
        var wS1 = makeBox(8, wallH, wallT, wallColor, WX - 4, 25, WZ + 3.5);
        scene.add(wS1); objects.push(wS1);
        // West wall
        var wW1 = makeBox(wallT, wallH, 7, wallColor, WX - 8, 25, WZ);
        scene.add(wW1); objects.push(wW1);
        // East wall
        var wE1 = makeBox(wallT, wallH, 7, wallColor, WX - 0.5, 25, WZ);
        scene.add(wE1); objects.push(wE1);

        // Merlons on north wall (battlements)
        var merlonSpacing = [WX - 7, WX - 5, WX - 3, WX - 1];
        for (var mi = 0; mi < merlonSpacing.length; mi++) {
            var merlon = makeBox(1, 1, wallT, wallColor, merlonSpacing[mi], 27.5, WZ - 3.5);
            scene.add(merlon); objects.push(merlon);
        }

        // ── Wallace Tower ─────────────────────────────────────────────────
        var wallaceTower = makeBox(4, 12, 4, 0x7A7A7A, WX - 6, 29, WZ - 2);
        scene.add(wallaceTower); objects.push(wallaceTower);

        // Tower battlements
        var towerMerlons = [
            makeBox(1, 1, 4, wallColor, WX - 8, 35.5, WZ - 2),
            makeBox(1, 1, 4, wallColor, WX - 6, 35.5, WZ - 2),
            makeBox(1, 1, 4, wallColor, WX - 4, 35.5, WZ - 2),
            makeBox(4, 1, 1, wallColor, WX - 6, 35.5, WZ - 4),
            makeBox(4, 1, 1, wallColor, WX - 6, 35.5, WZ)
        ];
        for (var ti = 0; ti < towerMerlons.length; ti++) {
            scene.add(towerMerlons[ti]); objects.push(towerMerlons[ti]);
        }

        // ── Castle walls on east (lower) peak ────────────────────────────
        // North wall
        var wN2 = makeBox(6, 3, wallT, wallColor, WX + 5, 22.5, WZ - 3);
        scene.add(wN2); objects.push(wN2);
        // South wall
        var wS2 = makeBox(6, 3, wallT, wallColor, WX + 5, 22.5, WZ + 3);
        scene.add(wS2); objects.push(wS2);
        // West wall
        var wW2 = makeBox(wallT, 3, 6, wallColor, WX + 2, 22.5, WZ);
        scene.add(wW2); objects.push(wW2);
        // East wall
        var wE2 = makeBox(wallT, 3, 6, wallColor, WX + 8, 22.5, WZ);
        scene.add(wE2); objects.push(wE2);

        // Round corner turret on east peak
        var turret = makeCylinder(1.2, 1.4, 5, 8, wallColor, WX + 8, 22.5, WZ - 3);
        scene.add(turret); objects.push(turret);

        // ── Powder magazine (squat box) ───────────────────────────────────
        var powderMag = makeBox(5, 3, 4, 0x6A6A6A, WX + 3, 23, WZ + 1);
        scene.add(powderMag); objects.push(powderMag);

        // Vaulted roof hint (thin box on top)
        var powderRoof = makeBox(5.4, 0.6, 4.4, 0x5A5A5A, WX + 3, 24.6, WZ + 1);
        scene.add(powderRoof); objects.push(powderRoof);

        // ── Governor's House ──────────────────────────────────────────────
        var govHouse = makeBox(8, 6, 5, 0x7A7065, WX - 1, 23.5, WZ + 2);
        scene.add(govHouse); objects.push(govHouse);

        // Governor's House roof
        var govRoof = makeBox(8.4, 0.6, 5.4, 0x5C5650, WX - 1, 26.6, WZ + 2);
        scene.add(govRoof); objects.push(govRoof);

        // Chimney stacks
        var chimneys = [
            makeBox(0.8, 2, 0.8, 0x5A5A5A, WX - 3, 28, WZ + 0.5),
            makeBox(0.8, 2, 0.8, 0x5A5A5A, WX - 3, 28, WZ + 3.5),
            makeBox(0.8, 2, 0.8, 0x5A5A5A, WX + 1, 28, WZ + 0.5)
        ];
        for (var ci = 0; ci < chimneys.length; ci++) {
            scene.add(chimneys[ci]); objects.push(chimneys[ci]);
        }

        // ── Medieval town wall remains ────────────────────────────────────
        var townWallColor = 0x9A8A78;
        var wallFragments = [
            makeBox(8, 3, 1.2, townWallColor, WX - 15, 1.5, WZ - 8),
            makeBox(5, 2.5, 1.2, townWallColor, WX - 10, 1.25, WZ - 8),
            makeBox(6, 3, 1.2, townWallColor, WX - 2,  1.5, WZ - 10),
            makeBox(4, 2,   1.2, townWallColor, WX + 4,  1.0, WZ - 9),
            makeBox(7, 3, 1.2, townWallColor, WX + 10, 1.5, WZ - 7),
            makeBox(1.2, 3, 5,  townWallColor, WX - 15, 1.5, WZ - 6),
            makeBox(1.2, 2, 4,  townWallColor, WX + 13, 1.5, WZ - 5)
        ];
        for (var fi = 0; fi < wallFragments.length; fi++) {
            scene.add(wallFragments[fi]); objects.push(wallFragments[fi]);
        }

        // ── Denny Ship Model Experiment Tank ──────────────────────────────
        // Long narrow building (world's oldest working ship testing tank)
        var tankBuilding = makeBox(40, 4, 8, 0x888888, WX - 30, 2, WZ + 25);
        scene.add(tankBuilding); objects.push(tankBuilding);

        // Tank building roof
        var tankRoof = makeBox(40.4, 0.5, 8.4, 0x707070, WX - 30, 4.25, WZ + 25);
        scene.add(tankRoof); objects.push(tankRoof);

        // Clerestory windows strip (raised box along roof ridge)
        var clerestory = makeBox(36, 1.2, 1.5, 0x999999, WX - 30, 5.1, WZ + 25);
        scene.add(clerestory); objects.push(clerestory);

        // Launch ramp (angled thin box at one end)
        var launchRamp = makeBox(6, 0.4, 7, 0x777777, WX - 51, 1.4, WZ + 25);
        launchRamp.rotation.z = -0.18;
        scene.add(launchRamp); objects.push(launchRamp);

        // Ramp support legs
        var rampLegs = [
            makeBox(0.6, 2, 0.6, 0x666666, WX - 52, 0.5, WZ + 22),
            makeBox(0.6, 2, 0.6, 0x666666, WX - 52, 0.5, WZ + 28),
            makeBox(0.6, 1.2, 0.6, 0x666666, WX - 50, 0.3, WZ + 22),
            makeBox(0.6, 1.2, 0.6, 0x666666, WX - 50, 0.3, WZ + 28)
        ];
        for (var ri = 0; ri < rampLegs.length; ri++) {
            scene.add(rampLegs[ri]); objects.push(rampLegs[ri]);
        }

        // Tank office annex
        var tankOffice = makeBox(8, 4, 8, 0x8A8A8A, WX - 9, 2, WZ + 25);
        scene.add(tankOffice); objects.push(tankOffice);

        // ── Ballantine's Distillery ───────────────────────────────────────
        var sandstone = 0xD4A97A;
        var distX = WX + 28;
        var distZ = WZ + 10;

        // Main warehouse block A
        var warehouseA = makeBox(18, 8, 12, sandstone, distX, 4, distZ);
        scene.add(warehouseA); objects.push(warehouseA);

        // Main warehouse block B
        var warehouseB = makeBox(14, 8, 10, sandstone, distX + 18, 4, distZ - 1);
        scene.add(warehouseB); objects.push(warehouseB);

        // Still house (taller)
        var stillHouse = makeBox(10, 12, 10, sandstone, distX + 2, 6, distZ + 14);
        scene.add(stillHouse); objects.push(stillHouse);

        // Malt barn
        var maltBarn = makeBox(16, 6, 9, sandstone, distX + 14, 3, distZ + 14);
        scene.add(maltBarn); objects.push(maltBarn);

        // Cooperage
        var cooperage = makeBox(10, 5, 8, 0xC49A6A, distX - 2, 2.5, distZ - 12);
        scene.add(cooperage); objects.push(cooperage);

        // Pagoda kiln (square base + cone roof — Victorian malting pagoda)
        var pagodaBase = makeBox(5, 10, 5, sandstone, distX + 6, 5, distZ + 14);
        scene.add(pagodaBase); objects.push(pagodaBase);

        var pagodaCap = makeBox(6, 1, 6, 0x8A8A8A, distX + 6, 10.5, distZ + 14);
        scene.add(pagodaCap); objects.push(pagodaCap);

        var pagodaRoof = makeCone(3, 5, 8, 0x4A4A4A, distX + 6, 14, distZ + 14);
        scene.add(pagodaRoof); objects.push(pagodaRoof);

        var pagodaVent = makeCylinder(0.6, 0.6, 2, 6, 0x333333, distX + 6, 17.5, distZ + 14);
        scene.add(pagodaVent); objects.push(pagodaVent);

        // Second smaller pagoda
        var pagoda2Base = makeBox(4, 8, 4, sandstone, distX + 22, 4, distZ + 10);
        scene.add(pagoda2Base); objects.push(pagoda2Base);

        var pagoda2Roof = makeCone(2.5, 4, 8, 0x4A4A4A, distX + 22, 12, distZ + 10);
        scene.add(pagoda2Roof); objects.push(pagoda2Roof);

        // Distillery chimney stack
        var distChimney = makeCylinder(1, 1.3, 18, 8, 0x8A7A6A, distX + 12, 9, distZ - 5);
        scene.add(distChimney); objects.push(distChimney);

        // Chimney cap
        var chimneyCapRing = makeCylinder(1.3, 1.0, 0.8, 8, 0x555555, distX + 12, 18.4, distZ - 5);
        scene.add(chimneyCapRing); objects.push(chimneyCapRing);

        // Victorian entrance gatehouse
        var gatehouse = makeBox(6, 7, 5, sandstone, distX - 8, 3.5, distZ - 3);
        scene.add(gatehouse); objects.push(gatehouse);

        // Gatehouse roof
        var gateRoof = makeCone(4.5, 3, 4, 0x7A6A5A, distX - 8, 8.5, distZ - 3);
        scene.add(gateRoof); objects.push(gateRoof);

        // Distillery yard wall
        var yardWalls = [
            makeBox(40, 3, 0.8, 0xC09060, distX + 7, 1.5, distZ - 8),
            makeBox(40, 3, 0.8, 0xC09060, distX + 7, 1.5, distZ + 20),
            makeBox(0.8, 3, 28, 0xC09060, distX - 13, 1.5, distZ + 6),
            makeBox(0.8, 3, 28, 0xC09060, distX + 27, 1.5, distZ + 6)
        ];
        for (var yi = 0; yi < yardWalls.length; yi++) {
            scene.add(yardWalls[yi]); objects.push(yardWalls[yi]);
        }

        // ── Additional rock detail: scree boulders ────────────────────────
        var boulders = [
            makeBox(2, 1.5, 1.8, 0x2C2C2C, WX - 12, 0.75, WZ - 5),
            makeBox(1.5, 1.2, 1.4, 0x303030, WX - 10, 0.6, WZ + 4),
            makeBox(1.8, 1.3, 1.6, 0x2A2A2A, WX + 10, 0.65, WZ - 3),
            makeBox(1.2, 0.9, 1.0, 0x343434, WX + 11, 0.45, WZ + 5),
            makeBox(2.2, 1.6, 1.9, 0x2E2E2E, WX - 8,  0.8,  WZ - 9),
            makeBox(1.0, 0.8, 0.9, 0x303030, WX + 6,  0.4,  WZ + 8)
        ];
        for (var bi = 0; bi < boulders.length; bi++) {
            scene.add(boulders[bi]); objects.push(boulders[bi]);
        }

        // ── Flagpole on Wallace Tower ─────────────────────────────────────
        var flagpole = makeCylinder(0.1, 0.1, 5, 4, 0xCCCCCC, WX - 6, 40.5, WZ - 2);
        scene.add(flagpole); objects.push(flagpole);

        // Flag
        var flag = makeBox(2, 1.2, 0.1, 0x003399, WX - 5, 42.5, WZ - 2);
        scene.add(flag); objects.push(flag);

        // ── Gatehouse / portcullis arch ───────────────────────────────────
        // Left jamb
        var archL = makeBox(1, 5, 1.5, wallColor, WX - 1, 22.5, WZ - 0.5);
        scene.add(archL); objects.push(archL);
        // Right jamb
        var archR = makeBox(1, 5, 1.5, wallColor, WX + 1, 22.5, WZ - 0.5);
        scene.add(archR); objects.push(archR);
        // Lintel
        var lintel = makeBox(3, 0.8, 1.5, wallColor, WX, 25.4, WZ - 0.5);
        scene.add(lintel); objects.push(lintel);

        return objects;
    }

    function init(scene) {
        return build(scene);
    }

    return {
        init: init
    };

}());
