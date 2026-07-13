window.AmsterdamCanals = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 22640;
    var OY = 0;
    var OZ = 0;

    function addMesh(geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        if (sx || sy || sz) mesh.scale.set(sx || 1, sy || 1, sz || 1);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildCanalWater(xOff, zOff, width, length, ry) {
        var matWater = makeMat(0x4682B4);
        var geo = new THREE.BoxGeometry(width, 0.5, length);
        var mesh = new THREE.Mesh(geo, matWater);
        mesh.position.set(OX + xOff, OY - 0.5, OZ + zOff);
        if (ry) mesh.rotation.y = ry;
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildCanalHouse(xOff, zOff, w, h, ry, gableStyle) {
        var matBrick = makeMat(0xC87020);
        var matRoof = makeMat(0x5C3317);
        var matWindow = makeMat(0x87CEEB);
        // Main body
        var bodyGeo = new THREE.BoxGeometry(w, h, w * 1.8);
        var body = new THREE.Mesh(bodyGeo, matBrick);
        body.position.set(OX + xOff, OY + h / 2, OZ + zOff);
        if (ry) body.rotation.y = ry;
        scene.add(body);
        objects.push(body);
        // Windows (stacked, 3 per floor on front face)
        var floors = Math.floor(h / 3);
        for (var f = 0; f < floors; f++) {
            var winGeo = new THREE.BoxGeometry(w * 0.22, 1.0, 0.2);
            var winMesh = new THREE.Mesh(winGeo, matWindow);
            var winY = OY + 1.5 + f * 3;
            var frontZ = OZ + zOff + (w * 1.8 / 2) + 0.11;
            winMesh.position.set(OX + xOff, winY, frontZ);
            if (ry) winMesh.rotation.y = ry;
            scene.add(winMesh);
            objects.push(winMesh);
        }
        // Gable top
        if (gableStyle === 'step') {
            // Stepped gable — stack of decreasing boxes
            var steps = 3;
            for (var s = 0; s < steps; s++) {
                var sw = w * (1 - s * 0.28);
                var sh = 1.2;
                var stepGeo = new THREE.BoxGeometry(sw, sh, w * 0.5);
                var stepMesh = new THREE.Mesh(stepGeo, matBrick);
                stepMesh.position.set(OX + xOff, OY + h + sh / 2 + s * sh, OZ + zOff);
                if (ry) stepMesh.rotation.y = ry;
                scene.add(stepMesh);
                objects.push(stepMesh);
            }
        } else {
            // Curved / pointed gable using a cylinder cap
            var gableGeo = new THREE.CylinderGeometry(w * 0.38, w * 0.55, 2.5, 6);
            var gableMesh = new THREE.Mesh(gableGeo, matBrick);
            gableMesh.position.set(OX + xOff, OY + h + 1.25, OZ + zOff);
            if (ry) gableMesh.rotation.y = ry;
            scene.add(gableMesh);
            objects.push(gableMesh);
        }
    }

    function buildCanalHouseRow(startX, startZ, count, spacing, ry) {
        var gableStyles = ['step', 'curve', 'step', 'curve', 'step'];
        for (var i = 0; i < count; i++) {
            var w = 5 + (i % 3) * 1.0;
            var h = 12 + (i % 3) * 3;
            var xPos = startX + i * spacing;
            var style = gableStyles[i % gableStyles.length];
            buildCanalHouse(xPos, startZ, w, h, ry, style);
        }
    }

    function buildCanalBoat(xOff, zOff, ry) {
        var matBoat = makeMat(0x8B4513);
        var matCabin = makeMat(0x5C3317);
        var matAccent = makeMat(0x4CAF50);
        // Hull
        var hullGeo = new THREE.BoxGeometry(3, 1.2, 9);
        var hull = new THREE.Mesh(hullGeo, matBoat);
        hull.position.set(OX + xOff, OY + 0.3, OZ + zOff);
        if (ry) hull.rotation.y = ry;
        scene.add(hull);
        objects.push(hull);
        // Cabin
        var cabinGeo = new THREE.BoxGeometry(2.4, 1.8, 5);
        var cabin = new THREE.Mesh(cabinGeo, matCabin);
        cabin.position.set(OX + xOff, OY + 1.8, OZ + zOff - 1.5);
        if (ry) cabin.rotation.y = ry;
        scene.add(cabin);
        objects.push(cabin);
        // Roof stripe
        var roofGeo = new THREE.BoxGeometry(2.4, 0.3, 5);
        var roof = new THREE.Mesh(roofGeo, matAccent);
        roof.position.set(OX + xOff, OY + 2.75, OZ + zOff - 1.5);
        if (ry) roof.rotation.y = ry;
        scene.add(roof);
        objects.push(roof);
    }

    function buildRijksmuseum(xOff, zOff) {
        var matBrick = makeMat(0xC87020);
        var matRoof = makeMat(0x5C3317);
        var matStone = makeMat(0xD4C8A0);
        // Main body
        var bodyGeo = new THREE.BoxGeometry(60, 20, 30);
        addMesh(bodyGeo, matBrick, xOff, 10, zOff);
        // Central arch passage
        var archGeo = new THREE.BoxGeometry(8, 12, 32);
        var archMesh = new THREE.Mesh(archGeo, makeMat(0x404040));
        archMesh.position.set(OX + xOff, OY + 6, OZ + zOff);
        scene.add(archMesh);
        objects.push(archMesh);
        // Arch top fill (rounded arch simulation with cylinder)
        var archTopGeo = new THREE.CylinderGeometry(4, 4, 32, 8, 1, false, 0, Math.PI);
        var archTop = new THREE.Mesh(archTopGeo, matBrick);
        archTop.rotation.z = Math.PI / 2;
        archTop.rotation.y = Math.PI / 2;
        archTop.position.set(OX + xOff, OY + 12, OZ + zOff);
        scene.add(archTop);
        objects.push(archTop);
        // Left tower
        var towerGeo = new THREE.BoxGeometry(10, 28, 10);
        addMesh(towerGeo, matBrick, xOff - 25, 14, zOff);
        var towerTopGeo = new THREE.ConeGeometry(5.5, 8, 4);
        addMesh(towerTopGeo, matRoof, xOff - 25, 32, zOff);
        // Right tower
        addMesh(towerGeo, matBrick, xOff + 25, 14, zOff);
        addMesh(towerTopGeo, matRoof, xOff + 25, 32, zOff);
        // Roof ridge
        var ridgeGeo = new THREE.BoxGeometry(60, 2, 4);
        addMesh(ridgeGeo, matRoof, xOff, 21, zOff);
        // Decorative stone band
        var bandGeo = new THREE.BoxGeometry(62, 1.5, 31);
        addMesh(bandGeo, matStone, xOff, 20, zOff);
    }

    function buildVanGoghMuseum(xOff, zOff) {
        var matModern = makeMat(0xD3D3D3);
        var matGlass = makeMat(0x87CEEB);
        var matDark = makeMat(0x555555);
        // Main angular modernist body
        var bodyGeo = new THREE.BoxGeometry(30, 16, 20);
        addMesh(bodyGeo, matModern, xOff, 8, zOff);
        // Angled wing extension left
        var wingGeo = new THREE.BoxGeometry(15, 12, 18);
        addMesh(wingGeo, matModern, xOff - 22, 6, zOff);
        // Glass facade strip
        var glassGeo = new THREE.BoxGeometry(30, 14, 0.5);
        addMesh(glassGeo, matGlass, xOff, 8, zOff + 10.25);
        // Flat roof overhang
        var roofGeo = new THREE.BoxGeometry(33, 1.5, 23);
        addMesh(roofGeo, matDark, xOff, 16.75, zOff);
        // Side cantilever slab
        var slabGeo = new THREE.BoxGeometry(6, 1, 22);
        addMesh(slabGeo, matModern, xOff + 18, 10, zOff);
    }

    function buildRoyalPalace(xOff, zOff) {
        var matPalace = makeMat(0xD4C8A0);
        var matDark = makeMat(0x8B8060);
        // Main body
        var bodyGeo = new THREE.BoxGeometry(55, 22, 35);
        addMesh(bodyGeo, matPalace, xOff, 11, zOff);
        // Central dome base cylinder
        var domeBaseGeo = new THREE.CylinderGeometry(6, 6, 6, 8);
        addMesh(domeBaseGeo, matPalace, xOff, 25, zOff);
        // Dome hemisphere
        var domeGeo = new THREE.SphereGeometry(6.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(domeGeo, matDark, xOff, 28, zOff);
        // Weathervane spire on dome
        var spireGeo = new THREE.CylinderGeometry(0.2, 0.4, 5, 4);
        addMesh(spireGeo, matDark, xOff, 35.5, zOff);
        // Pilasters on facade (front)
        for (var p = -2; p <= 2; p++) {
            var pilGeo = new THREE.BoxGeometry(1.5, 22, 1.5);
            addMesh(pilGeo, matDark, xOff + p * 9, 11, zOff + 17.75);
        }
        // Cornice
        var corniceGeo = new THREE.BoxGeometry(57, 2, 37);
        addMesh(corniceGeo, matDark, xOff, 22.5, zOff);
        // Steps
        var stepsGeo = new THREE.BoxGeometry(30, 1.5, 5);
        addMesh(stepsGeo, matPalace, xOff, 0.75, zOff + 20);
    }

    function buildWesterkerk(xOff, zOff) {
        var matChurch = makeMat(0xD4C8A0);
        var matTower = makeMat(0xB8A880);
        var matCrown = makeMat(0xFFD700);
        // Nave body
        var naveGeo = new THREE.BoxGeometry(20, 16, 40);
        addMesh(naveGeo, matChurch, xOff, 8, zOff);
        // Nave roof ridge
        var naveRoofGeo = new THREE.CylinderGeometry(1, 10, 8, 4);
        var naveRoof = new THREE.Mesh(naveRoofGeo, matTower);
        naveRoof.position.set(OX + xOff, OY + 20, OZ + zOff);
        naveRoof.rotation.y = Math.PI / 4;
        scene.add(naveRoof);
        objects.push(naveRoof);
        // Tower base
        var towerGeo = new THREE.BoxGeometry(12, 40, 12);
        addMesh(towerGeo, matChurch, xOff - 14, 20, zOff + 14);
        // Tower octagonal mid section
        var octGeo = new THREE.CylinderGeometry(5, 6, 16, 8);
        addMesh(octGeo, matTower, xOff - 14, 48, zOff + 14);
        // Tower spire
        var spireGeo = new THREE.ConeGeometry(3, 18, 8);
        addMesh(spireGeo, matTower, xOff - 14, 64, zOff + 14);
        // Imperial crown (stacked rings)
        var crownGeo = new THREE.CylinderGeometry(3.5, 3.5, 1.5, 8);
        addMesh(crownGeo, matCrown, xOff - 14, 73.75, zOff + 14);
        var crownTopGeo = new THREE.SphereGeometry(1.5, 8, 8);
        addMesh(crownTopGeo, matCrown, xOff - 14, 75.5, zOff + 14);
        // Crown points
        for (var cp = 0; cp < 8; cp++) {
            var angle = (cp / 8) * Math.PI * 2;
            var cx = Math.cos(angle) * 3.2;
            var cz = Math.sin(angle) * 3.2;
            var pointGeo = new THREE.ConeGeometry(0.3, 1.5, 4);
            addMesh(pointGeo, matCrown, xOff - 14 + cx, 75.0, zOff + 14 + cz);
        }
        // Transept
        var transeptGeo = new THREE.BoxGeometry(30, 14, 12);
        addMesh(transeptGeo, matChurch, xOff, 7, zOff + 5);
    }

    function buildAnneFrankHouse(xOff, zOff) {
        var matBrick = makeMat(0xC87020);
        var matRoof = makeMat(0x5C3317);
        var matWin = makeMat(0x87CEEB);
        // Very narrow tall canal house
        var bodyGeo = new THREE.BoxGeometry(6, 18, 10);
        addMesh(bodyGeo, matBrick, xOff, 9, zOff);
        // Stepped gable top
        var g1Geo = new THREE.BoxGeometry(6, 1.5, 3);
        addMesh(g1Geo, matBrick, xOff, 18.75, zOff);
        var g2Geo = new THREE.BoxGeometry(4.5, 1.5, 3);
        addMesh(g2Geo, matBrick, xOff, 20.25, zOff);
        var g3Geo = new THREE.BoxGeometry(3, 1.5, 3);
        addMesh(g3Geo, matBrick, xOff, 21.75, zOff);
        // Flag or sign plaque
        var plaqueGeo = new THREE.BoxGeometry(2, 0.5, 0.2);
        addMesh(plaqueGeo, makeMat(0xFFFFFF), xOff, 16, zOff + 5.1);
        // Windows
        for (var f = 0; f < 5; f++) {
            var wGeo = new THREE.BoxGeometry(1.2, 1.4, 0.2);
            addMesh(wGeo, matWin, xOff - 1.5, 3 + f * 3, zOff + 5.1);
            addMesh(wGeo, matWin, xOff + 1.5, 3 + f * 3, zOff + 5.1);
        }
        // Annex behind (the secret annex)
        var annexGeo = new THREE.BoxGeometry(7, 14, 9);
        addMesh(annexGeo, matBrick, xOff, 7, zOff - 10);
    }

    function buildCentralStation(xOff, zOff) {
        var matStation = makeMat(0xC87020);
        var matRoof = makeMat(0x8B8060);
        var matGlass = makeMat(0x87CEEB);
        // Main station body
        var bodyGeo = new THREE.BoxGeometry(80, 18, 28);
        addMesh(bodyGeo, matStation, xOff, 9, zOff);
        // Grand arched glass roof centre
        var glassRoofGeo = new THREE.CylinderGeometry(12, 12, 50, 16, 1, false, 0, Math.PI);
        var glassRoof = new THREE.Mesh(glassRoofGeo, matGlass);
        glassRoof.rotation.z = Math.PI / 2;
        glassRoof.position.set(OX + xOff, OY + 18, OZ + zOff);
        scene.add(glassRoof);
        objects.push(glassRoof);
        // Left tower (Gothic double towers)
        var ltGeo = new THREE.BoxGeometry(14, 28, 14);
        addMesh(ltGeo, matStation, xOff - 33, 14, zOff);
        var ltSpireGeo = new THREE.ConeGeometry(6, 14, 8);
        addMesh(ltSpireGeo, matRoof, xOff - 33, 35, zOff);
        // Right tower
        addMesh(ltGeo, matStation, xOff + 33, 14, zOff);
        addMesh(ltSpireGeo, matRoof, xOff + 33, 35, zOff);
        // Central gable
        var cgGeo = new THREE.BoxGeometry(20, 6, 3);
        addMesh(cgGeo, matStation, xOff, 21, zOff + 14);
        var cgTopGeo = new THREE.ConeGeometry(8, 10, 4);
        addMesh(cgTopGeo, matRoof, xOff, 29, zOff + 14);
        // Clock faces (round discs)
        var clockGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 12);
        addMesh(clockGeo, makeMat(0xFFFFFF), xOff - 33, 22, zOff + 7.15);
        addMesh(clockGeo, makeMat(0xFFFFFF), xOff + 33, 22, zOff + 7.15);
    }

    function buildIJRiver(xOff, zOff) {
        var matWater = makeMat(0x4682B4);
        var waterGeo = new THREE.BoxGeometry(200, 0.5, 80);
        addMesh(waterGeo, matWater, xOff, -0.5, zOff);
        // Docks / quayside
        var dockMat = makeMat(0x888888);
        var dockGeo = new THREE.BoxGeometry(200, 1, 10);
        addMesh(dockGeo, dockMat, xOff, 0.5, zOff + 45);
    }

    function buildVondelpark(xOff, zOff) {
        var matGrass = makeMat(0x4CAF50);
        var matPath = makeMat(0xB5A485);
        var matTree = makeMat(0x2D6A2D);
        var matTrunk = makeMat(0x8B4513);
        var matPavilion = makeMat(0xFFFFFF);
        // Park ground
        var parkGeo = new THREE.BoxGeometry(90, 0.3, 60);
        addMesh(parkGeo, matGrass, xOff, 0.15, zOff);
        // Path through park
        var pathGeo = new THREE.BoxGeometry(6, 0.4, 60);
        addMesh(pathGeo, matPath, xOff + 10, 0.2, zOff);
        var path2Geo = new THREE.BoxGeometry(60, 0.4, 6);
        addMesh(path2Geo, matPath, xOff, 0.2, zOff + 5);
        // Trees scattered
        var treePositions = [
            [-35, -20], [-20, -22], [0, -25], [20, -20], [35, -22],
            [-30, 20], [-15, 18], [5, 22], [25, 18], [38, 20],
            [-40, 0], [40, 0]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0];
            var tz = treePositions[t][1];
            var trunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 4, 6);
            addMesh(trunkGeo, matTrunk, xOff + tx, 2, zOff + tz);
            var canopyGeo = new THREE.SphereGeometry(3, 8, 6);
            addMesh(canopyGeo, matTree, xOff + tx, 6.5, zOff + tz);
        }
        // Open-air theatre pavilion
        var pavGeo = new THREE.BoxGeometry(20, 6, 12);
        addMesh(pavGeo, matPavilion, xOff - 25, 3, zOff - 15);
        var pavRoofGeo = new THREE.CylinderGeometry(1, 11, 4, 4);
        addMesh(pavRoofGeo, makeMat(0x2D6A2D), xOff - 25, 8, zOff - 15);
        // Pond
        var pondGeo = new THREE.BoxGeometry(20, 0.2, 14);
        addMesh(pondGeo, makeMat(0x4682B4), xOff + 28, 0.1, zOff - 18);
    }

    function buildRedLightDistrict(xOff, zOff) {
        var matNeon = makeMat(0xCC0000);
        var matBuilding = makeMat(0x8B2020);
        var matStreet = makeMat(0x444444);
        // Narrow cobbled street
        var streetGeo = new THREE.BoxGeometry(8, 0.3, 60);
        addMesh(streetGeo, matStreet, xOff, 0.15, zOff);
        // Row of narrow neon-fronted buildings left side
        for (var b = 0; b < 5; b++) {
            var bGeo = new THREE.BoxGeometry(6, 12, 8);
            addMesh(bGeo, matBuilding, xOff - 8, 6, zOff - 24 + b * 12);
            // Neon sign strip
            var neonGeo = new THREE.BoxGeometry(5.5, 1.2, 0.3);
            addMesh(neonGeo, matNeon, xOff - 8, 10, zOff - 24 + b * 12 + 4.15);
            // Red window lights
            var winGeo = new THREE.BoxGeometry(2.5, 3.5, 0.2);
            addMesh(winGeo, makeMat(0xFF3333), xOff - 8, 5, zOff - 24 + b * 12 + 4.1);
        }
        // Right side buildings
        for (var br = 0; br < 5; br++) {
            var brGeo = new THREE.BoxGeometry(6, 10, 8);
            addMesh(brGeo, matBuilding, xOff + 8, 5, zOff - 24 + br * 12);
            var neonRGeo = new THREE.BoxGeometry(5.5, 1.0, 0.3);
            addMesh(neonRGeo, matNeon, xOff + 8, 8.5, zOff - 24 + br * 12 - 4.15);
        }
        // Canal through district
        var canalGeo = new THREE.BoxGeometry(5, 0.5, 60);
        addMesh(canalGeo, makeMat(0x4682B4), xOff + 18, -0.25, zOff);
    }

    function buildGroundPlane(xOff, zOff) {
        var matGround = makeMat(0x8B8B6B);
        var groundGeo = new THREE.BoxGeometry(400, 0.5, 400);
        addMesh(groundGeo, matGround, xOff, -0.25, zOff);
    }

    function buildDamSquare(xOff, zOff) {
        var matCobble = makeMat(0x999980);
        var squareGeo = new THREE.BoxGeometry(60, 0.4, 60);
        addMesh(squareGeo, matCobble, xOff, 0.2, zOff);
        // National Monument obelisk
        var monoGeo = new THREE.CylinderGeometry(0.8, 1.5, 22, 8);
        addMesh(monoGeo, makeMat(0xFFFFFF), xOff + 10, 11, zOff);
        var monoTopGeo = new THREE.ConeGeometry(1.5, 4, 8);
        addMesh(monoTopGeo, makeMat(0xFFFFFF), xOff + 10, 24, zOff);
    }

    function build() {
        // Ground plane
        buildGroundPlane(0, 0);

        // ---- IJ River waterfront (north edge) ----
        buildIJRiver(0, -140);
        // Central Station on waterfront
        buildCentralStation(0, -110);

        // ---- Three concentric canals (grachtengordel) ----
        // Singel (inner)
        buildCanalWater(-80, 20, 8, 120, 0);
        buildCanalWater(80, 20, 8, 120, 0);
        buildCanalWater(0, -30, 8, 160, Math.PI / 2);

        // Herengracht
        buildCanalWater(-110, 20, 8, 120, 0);
        buildCanalWater(110, 20, 8, 120, 0);
        buildCanalWater(0, -60, 8, 220, Math.PI / 2);

        // Keizersgracht
        buildCanalWater(-140, 20, 8, 120, 0);
        buildCanalWater(140, 20, 8, 120, 0);
        buildCanalWater(0, -80, 8, 280, Math.PI / 2);

        // Prinsengracht (outer)
        buildCanalWater(-165, 20, 8, 120, 0);
        buildCanalWater(165, 20, 8, 120, 0);
        buildCanalWater(0, -100, 8, 330, Math.PI / 2);

        // ---- Canal house rows along Herengracht ----
        buildCanalHouseRow(-105, 10, 6, 8, 0);
        buildCanalHouseRow(-105, 30, 6, 8, 0);

        // ---- Canal house rows along Keizersgracht ----
        buildCanalHouseRow(-135, 10, 5, 8, 0);
        buildCanalHouseRow(-135, 30, 5, 8, 0);

        // ---- Canal house rows along Prinsengracht ----
        buildCanalHouseRow(-160, 5, 5, 8, 0);
        buildCanalHouseRow(-160, 28, 5, 8, 0);

        // ---- Canal house rows on east side ----
        buildCanalHouseRow(88, 10, 5, 8, 0);
        buildCanalHouseRow(120, 10, 5, 8, 0);

        // ---- Canal boats moored along canals ----
        buildCanalBoat(-90, 0, 0);
        buildCanalBoat(-90, 20, 0);
        buildCanalBoat(-90, 40, 0);
        buildCanalBoat(90, 10, 0);
        buildCanalBoat(90, 30, 0);
        buildCanalBoat(-120, 0, 0);
        buildCanalBoat(-150, 5, 0);

        // ---- Anne Frank House on Prinsengracht ----
        buildAnneFrankHouse(-158, 15);

        // ---- Dam Square + Royal Palace ----
        buildDamSquare(10, 40);
        buildRoyalPalace(10, 40);

        // ---- Westerkerk ----
        buildWesterkerk(-60, 30);

        // ---- Rijksmuseum ----
        buildRijksmuseum(30, 100);

        // ---- Van Gogh Museum (next to Rijksmuseum) ----
        buildVanGoghMuseum(110, 100);

        // ---- Vondelpark ----
        buildVondelpark(80, 150);

        // ---- Red Light District ----
        buildRedLightDistrict(-30, -50);
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
