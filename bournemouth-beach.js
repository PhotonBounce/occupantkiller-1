window.BournemouthBeach = (function() {
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

    function addMesh(geo, mat, x, y, z) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addLine(geo, mat, x, y, z) {
        var line = new THREE.LineSegments(geo, mat);
        line.position.set(x, y, z);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function build() {
        buildSeaFloor();
        buildSandBeach();
        buildBournemouthPier();
        buildBoscombeP();
        buildPromenade();
        buildBeachHuts();
        buildLowerGardens();
        buildEastCliff();
        buildRussellCotes();
        buildLifeguardStation();
        buildIceCreamKiosks();
        buildAmusements();
    }

    function buildSeaFloor() {
        var mat = new THREE.MeshLambertMaterial({ color: 0x1a6699 });
        var geo = new THREE.BoxGeometry(1200, 2, 600);
        addMesh(geo, mat, 13440, -1, -300);
    }

    function buildSandBeach() {
        var mat = new THREE.MeshLambertMaterial({ color: 0xf5deb3 });
        var geo = new THREE.BoxGeometry(1200, 1, 120);
        addMesh(geo, mat, 13440, 0.5, 60);
    }

    function buildBournemouthPier() {
        var ox = 13440;
        var oz = 0;
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var pileMat = new THREE.MeshLambertMaterial({ color: 0x5a4010 });
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xd4c9a8 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x7a3b1e });
        var railMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        // Main deck extending into sea (183m long, 15m wide)
        var deckGeo = new THREE.BoxGeometry(15, 1, 183);
        addMesh(deckGeo, deckMat, ox, 3, oz - 91);

        // Support piles along pier length
        var pilePositions = [
            -10, -30, -50, -70, -90, -110, -130, -150, -170
        ];
        for (var i = 0; i < pilePositions.length; i++) {
            var pz = oz + pilePositions[i];
            // Left pile
            var pGeoL = new THREE.CylinderGeometry(0.5, 0.7, 8, 6);
            addMesh(pGeoL, pileMat, ox - 7, -1, pz);
            // Right pile
            var pGeoR = new THREE.CylinderGeometry(0.5, 0.7, 8, 6);
            addMesh(pGeoR, pileMat, ox + 7, -1, pz);
            // Cross beam
            var beamGeo = new THREE.BoxGeometry(15, 0.5, 0.5);
            addMesh(beamGeo, pileMat, ox, 1, pz);
        }

        // Ornate entrance arch at shore end
        var entBase = new THREE.BoxGeometry(20, 8, 4);
        addMesh(entBase, wallMat, ox, 4, oz);
        var entArch = new THREE.BoxGeometry(6, 6, 4);
        var entArchMat = new THREE.MeshLambertMaterial({ color: 0xb8a070 });
        addMesh(entArch, entArchMat, ox, 7, oz);
        // Entrance towers
        var towerGeo = new THREE.BoxGeometry(3, 12, 3);
        addMesh(towerGeo, wallMat, ox - 10, 6, oz);
        addMesh(towerGeo.clone(), wallMat, ox + 10, 6, oz);
        var pinnacleGeo = new THREE.ConeGeometry(2, 4, 4);
        addMesh(pinnacleGeo, roofMat, ox - 10, 14, oz);
        addMesh(pinnacleGeo.clone(), roofMat, ox + 10, 14, oz);

        // Pier head pavilion/theatre at end of pier
        var phBase = new THREE.BoxGeometry(30, 6, 25);
        addMesh(phBase, wallMat, ox, 6.5, oz - 175);
        var phRoof = new THREE.BoxGeometry(32, 1, 27);
        addMesh(phRoof, roofMat, ox, 10, oz - 175);
        // Pavilion dome
        var domeGeo = new THREE.SphereGeometry(8, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(domeGeo, roofMat, ox, 10, oz - 175);
        // Pavilion windows suggestion
        var winMat = new THREE.MeshLambertMaterial({ color: 0x88ccff });
        for (var w = -12; w <= 12; w += 6) {
            var winGeo = new THREE.BoxGeometry(3, 3, 0.5);
            addMesh(winGeo, winMat, ox + w, 6, oz - 163);
            addMesh(winGeo.clone(), winMat, ox + w, 6, oz - 187);
        }

        // Deck railings
        var railGeo = new THREE.BoxGeometry(0.2, 1.2, 183);
        addMesh(railGeo, railMat, ox - 7.5, 4.1, oz - 91);
        addMesh(railGeo.clone(), railMat, ox + 7.5, 4.1, oz - 91);
        // Railing posts
        for (var rp = 0; rp > -183; rp -= 10) {
            var postGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
            addMesh(postGeo, railMat, ox - 7.5, 4.1, oz + rp);
            addMesh(postGeo.clone(), railMat, ox + 7.5, 4.1, oz + rp);
        }
    }

    function buildBoscombeP() {
        // Boscombe Pier - Art Deco, ~300m east of main pier
        var ox = 13740;
        var oz = 0;
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x9b7a50 });
        var pileMat = new THREE.MeshLambertMaterial({ color: 0x4a3520 });
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xe0d8c0 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x3a5a7a });
        var railMat = new THREE.MeshLambertMaterial({ color: 0x999999 });

        // Pier deck (~100m long, narrower)
        var deckGeo = new THREE.BoxGeometry(12, 1, 100);
        addMesh(deckGeo, deckMat, ox, 3, oz - 50);

        // Support piles
        var bPiles = [-15, -35, -55, -75, -95];
        for (var i = 0; i < bPiles.length; i++) {
            var pGeoL = new THREE.CylinderGeometry(0.5, 0.7, 8, 6);
            addMesh(pGeoL, pileMat, ox - 6, -1, oz + bPiles[i]);
            var pGeoR = new THREE.CylinderGeometry(0.5, 0.7, 8, 6);
            addMesh(pGeoR, pileMat, ox + 6, -1, oz + bPiles[i]);
        }

        // Art Deco entrance - covered walkway with arches
        var entGeo = new THREE.BoxGeometry(16, 9, 6);
        addMesh(entGeo, wallMat, ox, 4.5, oz);
        // Decorative Art Deco stepped facade
        var step1 = new THREE.BoxGeometry(18, 2, 2);
        addMesh(step1, wallMat, ox, 9, oz);
        var step2 = new THREE.BoxGeometry(14, 2, 2);
        addMesh(step2, wallMat, ox, 11, oz);
        var step3 = new THREE.BoxGeometry(10, 2, 2);
        addMesh(step3, wallMat, ox, 13, oz);

        // Covered walkway canopy along deck
        var canopyGeo = new THREE.BoxGeometry(14, 0.5, 90);
        addMesh(canopyGeo, roofMat, ox, 5.5, oz - 50);
        // Canopy supports
        for (var cs = -5; cs > -100; cs -= 15) {
            var suppL = new THREE.BoxGeometry(0.4, 3, 0.4);
            addMesh(suppL, pileMat, ox - 6, 4, oz + cs);
            addMesh(suppL.clone(), pileMat, ox + 6, 4, oz + cs);
        }

        // Pier head structure
        var phGeo = new THREE.BoxGeometry(22, 5, 18);
        addMesh(phGeo, wallMat, ox, 5.5, oz - 100);
        var phRoofGeo = new THREE.BoxGeometry(24, 1, 20);
        addMesh(phRoofGeo, roofMat, ox, 8.5, oz - 100);

        // Railings
        var railGeo = new THREE.BoxGeometry(0.2, 1.2, 100);
        addMesh(railGeo, railMat, ox - 6.5, 4.1, oz - 50);
        addMesh(railGeo.clone(), railMat, ox + 6.5, 4.1, oz - 50);
    }

    function buildPromenade() {
        var mat = new THREE.MeshLambertMaterial({ color: 0xc8c8c8 });
        var geo = new THREE.BoxGeometry(1200, 0.5, 20);
        addMesh(geo, mat, 13440, 1, 10);

        // Lamp posts along promenade
        var lampMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var lightMat = new THREE.MeshLambertMaterial({ color: 0xffffcc });
        for (var lx = 12900; lx <= 13980; lx += 40) {
            var poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 6, 6);
            addMesh(poleGeo, lampMat, lx, 3, 8);
            var bulbGeo = new THREE.SphereGeometry(0.5, 6, 4);
            addMesh(bulbGeo, lightMat, lx, 6.5, 8);
        }

        // Benches along promenade
        var benchMat = new THREE.MeshLambertMaterial({ color: 0x5a3010 });
        var benchLegMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        for (var bx = 12920; bx <= 13960; bx += 60) {
            var seatGeo = new THREE.BoxGeometry(3, 0.2, 0.8);
            addMesh(seatGeo, benchMat, bx, 1.5, 12);
            var backGeo = new THREE.BoxGeometry(3, 1, 0.15);
            addMesh(backGeo, benchMat, bx, 2, 12.4);
            var legGeoL = new THREE.BoxGeometry(0.2, 1.5, 0.2);
            addMesh(legGeoL, benchLegMat, bx - 1.2, 0.75, 12);
            addMesh(legGeoL.clone(), benchLegMat, bx + 1.2, 0.75, 12);
        }
    }

    function buildBeachHuts() {
        var hutColors = [
            0xff6644, 0x44aaff, 0xffdd00, 0x44cc44, 0xff44aa,
            0xaa44ff, 0xff8800, 0x00ccaa, 0xff2222, 0x2244ff
        ];
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

        for (var hx = 12880; hx <= 14000; hx += 14) {
            var colorIdx = Math.floor((hx - 12880) / 14) % hutColors.length;
            var wallMat = new THREE.MeshLambertMaterial({ color: hutColors[colorIdx] });
            var bodyGeo = new THREE.BoxGeometry(4, 4, 4);
            addMesh(bodyGeo, wallMat, hx, 2, 55);
            var roofGeo = new THREE.ConeGeometry(3.2, 2, 4);
            addMesh(roofGeo, roofMat, hx, 5, 55);
            var doorGeo = new THREE.BoxGeometry(1.2, 2.5, 0.2);
            addMesh(doorGeo, doorMat, hx, 1.25, 53);
        }
    }

    function buildLowerGardens() {
        // Lower/Central Gardens stretching from beach toward town
        var grassMat = new THREE.MeshLambertMaterial({ color: 0x3a7a3a });
        var pathMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x4488bb });
        var flowerMat = new THREE.MeshLambertMaterial({ color: 0xff88bb });
        var treeMat = new THREE.MeshLambertMaterial({ color: 0x228822 });
        var trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });

        // Lawn areas
        var lawnGeo = new THREE.BoxGeometry(120, 0.3, 250);
        addMesh(lawnGeo, grassMat, 13440, 0.65, 180);

        // Garden paths
        var pathGeo = new THREE.BoxGeometry(6, 0.35, 250);
        addMesh(pathGeo, pathMat, 13440, 0.68, 180);
        var crossPathGeo = new THREE.BoxGeometry(120, 0.35, 6);
        addMesh(crossPathGeo, pathMat, 13440, 0.68, 120);
        addMesh(crossPathGeo.clone(), pathMat, 13440, 0.68, 200);

        // The Bourne stream running through gardens
        var streamGeo = new THREE.BoxGeometry(3, 0.1, 200);
        addMesh(streamGeo, waterMat, 13425, 0.7, 160);

        // Bandstand - central feature
        var bandMat = new THREE.MeshLambertMaterial({ color: 0x228866 });
        var bandBaseMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        var bandRoofMat = new THREE.MeshLambertMaterial({ color: 0x116644 });

        // Bandstand base/stage
        var bsBase = new THREE.CylinderGeometry(8, 8, 1, 8);
        addMesh(bsBase, bandBaseMat, 13440, 1, 150);
        // Bandstand roof (ornate dome style)
        var bsRoof = new THREE.ConeGeometry(9, 5, 8);
        addMesh(bsRoof, bandRoofMat, 13440, 9.5, 150);
        // Bandstand support columns
        for (var angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            var cx = 13440 + Math.cos(angle) * 7;
            var cz = 150 + Math.sin(angle) * 7;
            var colGeo = new THREE.CylinderGeometry(0.3, 0.3, 7, 6);
            addMesh(colGeo, bandMat, cx, 4.5, cz);
        }

        // Flower beds - rectangular plots
        var bedPositions = [
            [13415, 120], [13465, 120], [13415, 200], [13465, 200],
            [13415, 170], [13465, 170]
        ];
        for (var b = 0; b < bedPositions.length; b++) {
            var bedGeo = new THREE.BoxGeometry(12, 0.4, 8);
            addMesh(bedGeo, flowerMat, bedPositions[b][0], 0.9, bedPositions[b][1]);
        }

        // Trees lining garden paths
        for (var tx = 13380; tx <= 13500; tx += 20) {
            var trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 5, 6);
            addMesh(trunkGeo, trunkMat, tx, 2.5, 100);
            addMesh(trunkGeo.clone(), trunkMat, tx, 2.5, 260);
            var foliageGeo = new THREE.SphereGeometry(3, 7, 5);
            addMesh(foliageGeo, treeMat, tx, 7.5, 100);
            addMesh(foliageGeo.clone(), treeMat, tx, 7.5, 260);
        }
        for (var tz = 100; tz <= 260; tz += 20) {
            var trunkGeo2 = new THREE.CylinderGeometry(0.3, 0.5, 5, 6);
            addMesh(trunkGeo2, trunkMat, 13385, 2.5, tz);
            addMesh(trunkGeo2.clone(), trunkMat, 13495, 2.5, tz);
            var foliageGeo2 = new THREE.SphereGeometry(3, 7, 5);
            addMesh(foliageGeo2, treeMat, 13385, 7.5, tz);
            addMesh(foliageGeo2.clone(), treeMat, 13495, 7.5, tz);
        }

        // Miniature golf - small flagged holes
        var golfMat = new THREE.MeshLambertMaterial({ color: 0x55aa55 });
        var flagMat = new THREE.MeshLambertMaterial({ color: 0xff2200 });
        var flagPoleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        for (var gh = 0; gh < 9; gh++) {
            var gx = 13460 + (gh % 3) * 10;
            var gz = 230 + Math.floor(gh / 3) * 12;
            var holeGeo = new THREE.CylinderGeometry(2, 2, 0.3, 8);
            addMesh(holeGeo, golfMat, gx, 0.65, gz);
            var gpGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 4);
            addMesh(gpGeo, flagPoleMat, gx, 1.65, gz);
            var flagGeo = new THREE.BoxGeometry(1, 0.6, 0.05);
            addMesh(flagGeo, flagMat, gx + 0.5, 2.5, gz);
        }
    }

    function buildEastCliff() {
        // East Cliff - chalk/sand cliffs to the east of pier
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0xe8dcc8 });
        var cliffTopMat = new THREE.MeshLambertMaterial({ color: 0x88aa55 });
        var liftMat = new THREE.MeshLambertMaterial({ color: 0xcc4422 });
        var liftCarMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var chaleMat = new THREE.MeshLambertMaterial({ color: 0xddddaa });
        var chaleRoofMat = new THREE.MeshLambertMaterial({ color: 0x884422 });

        // Cliff face
        var cliffGeo = new THREE.BoxGeometry(200, 40, 30);
        addMesh(cliffGeo, cliffMat, 13580, 20, 80);
        // Cliff top surface
        var ctGeo = new THREE.BoxGeometry(200, 2, 60);
        addMesh(ctGeo, cliffTopMat, 13580, 41, 55);

        // Cliff lift / funicular railway track
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var trackGeo = new THREE.BoxGeometry(1.5, 42, 1.5);
        // Angled track - approximate with vertical box
        addMesh(trackGeo, trackMat, 13560, 20, 68);
        addMesh(trackGeo.clone(), trackMat, 13564, 20, 68);
        // Lift car at mid point
        var carGeo = new THREE.BoxGeometry(4, 4, 3);
        addMesh(carGeo, liftCarMat, 13562, 20, 68);
        // Lift house at top
        var liftHouseGeo = new THREE.BoxGeometry(6, 5, 6);
        addMesh(liftHouseGeo, liftMat, 13562, 43.5, 60);
        var liftRoofGeo = new THREE.BoxGeometry(7, 1, 7);
        addMesh(liftRoofGeo, liftMat, 13562, 46.5, 60);

        // Beach chalets below cliff
        var chaletColors = [0xffaaaa, 0xaaffaa, 0xaaaaff, 0xffffaa, 0xffaaff];
        for (var ch = 0; ch < 8; ch++) {
            var cx = 13500 + ch * 12;
            var cMat = new THREE.MeshLambertMaterial({ color: chaletColors[ch % chaletColors.length] });
            var chGeo = new THREE.BoxGeometry(5, 4, 4);
            addMesh(chGeo, cMat, cx, 2, 70);
            var chRoofGeo = new THREE.BoxGeometry(6, 2, 5);
            addMesh(chRoofGeo, chaleRoofMat, cx, 5, 70);
        }

        // Cliff top gardens
        var ctGardenMat = new THREE.MeshLambertMaterial({ color: 0x44aa44 });
        var ctGardenGeo = new THREE.BoxGeometry(180, 0.5, 40);
        addMesh(ctGardenGeo, ctGardenMat, 13580, 42.5, 40);
        // Garden shrubs on cliff top
        var shrubMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
        for (var sx = 13500; sx <= 13660; sx += 15) {
            var shrubGeo = new THREE.SphereGeometry(1.5, 6, 4);
            addMesh(shrubGeo, shrubMat, sx, 44, 35);
            addMesh(shrubGeo.clone(), shrubMat, sx + 7, 44, 50);
        }
    }

    function buildRussellCotes() {
        // Russell-Cotes Art Gallery - Victorian Italianate villa on cliff top
        var ox = 13620;
        var oy = 43;
        var oz = 30;

        var wallMat = new THREE.MeshLambertMaterial({ color: 0xf0e8d0 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
        var accMat = new THREE.MeshLambertMaterial({ color: 0xd4a060 });
        var glassMat = new THREE.MeshLambertMaterial({ color: 0xaaddff });
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xccbbaa });

        // Main villa body
        var mainGeo = new THREE.BoxGeometry(28, 14, 20);
        addMesh(mainGeo, wallMat, ox, oy + 7, oz);
        // Central tower/turret
        var towerGeo = new THREE.BoxGeometry(8, 20, 8);
        addMesh(towerGeo, wallMat, ox, oy + 10, oz);
        var towerRoofGeo = new THREE.ConeGeometry(5, 6, 4);
        addMesh(towerRoofGeo, roofMat, ox, oy + 23, oz);
        // Main roof
        var mainRoofGeo = new THREE.BoxGeometry(30, 2, 22);
        addMesh(mainRoofGeo, roofMat, ox, oy + 15, oz);
        // Side wings
        var wingGeo = new THREE.BoxGeometry(8, 10, 16);
        addMesh(wingGeo, wallMat, ox - 18, oy + 5, oz);
        addMesh(wingGeo.clone(), wallMat, ox + 18, oy + 5, oz);
        // Wing roofs
        var wingRoofGeo = new THREE.BoxGeometry(9, 1.5, 17);
        addMesh(wingRoofGeo, roofMat, ox - 18, oy + 10.75, oz);
        addMesh(wingRoofGeo.clone(), roofMat, ox + 18, oy + 10.75, oz);

        // Ornate facade details - decorative columns
        for (var col = -12; col <= 12; col += 6) {
            var colGeo = new THREE.CylinderGeometry(0.4, 0.5, 12, 6);
            addMesh(colGeo, stoneMat, ox + col, oy + 6, oz - 10);
        }

        // Conservatory/glasshouse on side
        var consGeo = new THREE.BoxGeometry(10, 8, 12);
        addMesh(consGeo, glassMat, ox + 23, oy + 4, oz);
        var consRoofGeo = new THREE.BoxGeometry(11, 0.5, 13);
        addMesh(consRoofGeo, accMat, ox + 23, oy + 8, oz);
        // Conservatory roof ridge
        var ridgeGeo = new THREE.BoxGeometry(0.5, 3, 13);
        addMesh(ridgeGeo, accMat, ox + 23, oy + 9.5, oz);

        // Garden terrace in front
        var terraceGeo = new THREE.BoxGeometry(35, 0.5, 8);
        addMesh(terraceGeo, stoneMat, ox, oy, oz - 12);
        // Terrace balustrade
        var balustGeo = new THREE.BoxGeometry(35, 1.5, 0.3);
        addMesh(balustGeo, stoneMat, ox, oy + 1.25, oz - 16);
        // Stone urns / planters on terrace
        var urnMat = new THREE.MeshLambertMaterial({ color: 0x999977 });
        for (var u = -14; u <= 14; u += 7) {
            var urnGeo = new THREE.CylinderGeometry(0.6, 0.4, 1.5, 6);
            addMesh(urnGeo, urnMat, ox + u, oy + 1.25, oz - 15.5);
        }

        // Entry steps
        var stepsGeo = new THREE.BoxGeometry(8, 0.5, 4);
        addMesh(stepsGeo, stoneMat, ox, oy - 0.25, oz - 12);
        addMesh(stepsGeo.clone(), stoneMat, ox, oy - 0.75, oz - 13);
    }

    function buildLifeguardStation() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xff4422 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x88ccff });
        var flagMat = new THREE.MeshLambertMaterial({ color: 0xff2200 });
        var poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var ox = 13440;

        // Station building on raised platform
        var platformGeo = new THREE.BoxGeometry(8, 1.5, 6);
        addMesh(platformGeo, new THREE.MeshLambertMaterial({ color: 0xaaaaaa }), ox, 0.75, 35);
        var bodyGeo = new THREE.BoxGeometry(7, 5, 5);
        addMesh(bodyGeo, wallMat, ox, 4, 35);
        var roofGeo = new THREE.BoxGeometry(8, 1, 6);
        addMesh(roofGeo, roofMat, ox, 6.5, 35);
        // Windows
        var winGeo = new THREE.BoxGeometry(1.5, 1.5, 0.2);
        addMesh(winGeo, windowMat, ox - 2, 4, 32.5);
        addMesh(winGeo.clone(), windowMat, ox + 2, 4, 32.5);
        // Flag pole
        var fpGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 4);
        addMesh(fpGeo, poleMat, ox, 9.5, 35);
        var flagGeo = new THREE.BoxGeometry(2, 1, 0.05);
        addMesh(flagGeo, flagMat, ox + 1, 11.5, 35);
        // Steps up to station
        var stepGeo = new THREE.BoxGeometry(3, 0.5, 1);
        addMesh(stepGeo, new THREE.MeshLambertMaterial({ color: 0xbbbbbb }), ox, 0.75, 30);
        addMesh(stepGeo.clone(), new THREE.MeshLambertMaterial({ color: 0xbbbbbb }), ox, 1.25, 31);
    }

    function buildIceCreamKiosks() {
        var kioskColors = [0xff99cc, 0x99ccff, 0xffee99];
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xee2222 });
        var positions = [
            [13360, 18], [13500, 18], [13640, 18]
        ];
        for (var k = 0; k < positions.length; k++) {
            var kMat = new THREE.MeshLambertMaterial({ color: kioskColors[k] });
            var kGeo = new THREE.BoxGeometry(4, 4, 4);
            addMesh(kGeo, kMat, positions[k][0], 2, positions[k][1]);
            var kRoofGeo = new THREE.ConeGeometry(3, 2, 4);
            addMesh(kRoofGeo, roofMat, positions[k][0], 5, positions[k][1]);
            // Sign board
            var signMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
            var signGeo = new THREE.BoxGeometry(3.5, 0.8, 0.1);
            addMesh(signGeo, signMat, positions[k][0], 3.5, positions[k][1] - 2);
            // Umbrella/sunshade
            var shadeMat = new THREE.MeshLambertMaterial({ color: 0xff8800 });
            var shadeGeo = new THREE.ConeGeometry(3, 1, 8);
            addMesh(shadeGeo, shadeMat, positions[k][0], 7.5, positions[k][1] - 5);
            var shadePolGeo = new THREE.CylinderGeometry(0.1, 0.1, 4, 4);
            addMesh(shadePolGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), positions[k][0], 5.5, positions[k][1] - 5);
        }
    }

    function buildAmusements() {
        // Amusement arcade buildings on promenade
        var arcadeMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var arcadeRoofMat = new THREE.MeshLambertMaterial({ color: 0xff4400 });
        var signMat = new THREE.MeshLambertMaterial({ color: 0xff0088 });

        // Arcade building 1
        var aGeo = new THREE.BoxGeometry(16, 7, 10);
        addMesh(aGeo, arcadeMat, 13380, 3.5, 22);
        var aRGeo = new THREE.BoxGeometry(17, 1, 11);
        addMesh(aRGeo, arcadeRoofMat, 13380, 7, 22);
        var aSGeo = new THREE.BoxGeometry(14, 2, 0.3);
        addMesh(aSGeo, signMat, 13380, 8, 17);

        // Arcade building 2
        addMesh(aGeo.clone(), arcadeMat, 13510, 3.5, 22);
        addMesh(aRGeo.clone(), arcadeRoofMat, 13510, 7, 22);
        addMesh(aSGeo.clone(), signMat, 13510, 8, 17);

        // Candy striped fun pillars
        var candyMat = new THREE.MeshLambertMaterial({ color: 0xff3366 });
        var candyPositions = [
            [13372, 22], [13388, 22], [13502, 22], [13518, 22]
        ];
        for (var cp = 0; cp < candyPositions.length; cp++) {
            var cpGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
            addMesh(cpGeo, candyMat, candyPositions[cp][0], 4, candyPositions[cp][1]);
        }

        // Small carousel frame suggestion
        var carMat = new THREE.MeshLambertMaterial({ color: 0xdd44dd });
        var carBaseMat = new THREE.MeshLambertMaterial({ color: 0x888844 });
        var carBase = new THREE.CylinderGeometry(5, 5, 0.5, 10);
        addMesh(carBase, carBaseMat, 13600, 0.75, 22);
        var carRoof = new THREE.ConeGeometry(6, 5, 10);
        addMesh(carRoof, carMat, 13600, 8.75, 22);
        var carPole = new THREE.CylinderGeometry(0.3, 0.3, 9, 6);
        addMesh(carPole, new THREE.MeshLambertMaterial({ color: 0xcccccc }), 13600, 4.5, 22);
        // Carousel horses suggestion (simple boxes on poles)
        var horseMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        for (var ha = 0; ha < Math.PI * 2; ha += Math.PI / 3) {
            var hx = 13600 + Math.cos(ha) * 4;
            var hz = 22 + Math.sin(ha) * 4;
            var hpGeo = new THREE.CylinderGeometry(0.1, 0.1, 3, 4);
            addMesh(hpGeo, new THREE.MeshLambertMaterial({ color: 0xaaaaaa }), hx, 4, hz);
            var hbGeo = new THREE.BoxGeometry(1, 1, 2);
            addMesh(hbGeo, horseMat, hx, 5.5, hz);
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
