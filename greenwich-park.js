window.GreenwichPark = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var timeBall = null;
    var timeBallMast = null;
    var timeBallState = 0; // 0=top, 1=dropping, 2=bottom
    var timeBallTimer = 0;
    var deerObjects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        deerObjects = [];
        timeBall = null;
        timeBallMast = null;
        timeBallState = 0;
        timeBallTimer = 0;
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geometry, color) {
        return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: color }));
    }

    function build() {
        buildHill();
        buildRoyalObservatory();
        buildNationalMaritimeMuseum();
        buildCuttySark();
        buildQueensHouse();
        buildDeer();
        buildCanaryWharfVista();
        buildMeridianLine();
        buildParkGrounds();
    }

    function buildHill() {
        // Main hill as a large flattened cone/box arrangement
        var hillBase = makeMesh(new THREE.CylinderGeometry(80, 120, 28, 16), 0x4a7c3f);
        hillBase.position.set(10960, 14, 0);
        addObj(hillBase);

        // Upper hill crest
        var hillTop = makeMesh(new THREE.CylinderGeometry(30, 80, 10, 12), 0x5a8c4a);
        hillTop.position.set(10960, 30, 0);
        addObj(hillTop);

        // Path up the hill
        var path1 = makeMesh(new THREE.BoxGeometry(6, 0.5, 60), 0x8b7355);
        path1.position.set(10960, 28.5, 30);
        addObj(path1);

        var path2 = makeMesh(new THREE.BoxGeometry(6, 0.5, 30), 0x8b7355);
        path2.position.set(10960, 14.5, 80);
        path2.rotation.y = 0.3;
        addObj(path2);

        // Grass terrace walls
        var terrace1 = makeMesh(new THREE.BoxGeometry(40, 3, 3), 0x6b5b3e);
        terrace1.position.set(10960, 16, -20);
        addObj(terrace1);

        var terrace2 = makeMesh(new THREE.BoxGeometry(35, 3, 3), 0x6b5b3e);
        terrace2.position.set(10960, 22, -10);
        addObj(terrace2);
    }

    function buildRoyalObservatory() {
        var ox = 10960;
        var oz = -10;
        var baseY = 35;

        // Flamsteed House main block - red brick
        var mainBlock = makeMesh(new THREE.BoxGeometry(18, 12, 14), 0x8b3a2a);
        mainBlock.position.set(ox, baseY + 6, oz);
        addObj(mainBlock);

        // Roof
        var roof = makeMesh(new THREE.BoxGeometry(20, 3, 16), 0x5c4033);
        roof.position.set(ox, baseY + 13, oz);
        addObj(roof);

        // Left turret (with dome)
        var turretL = makeMesh(new THREE.CylinderGeometry(3.5, 3.5, 10, 8), 0x8b3a2a);
        turretL.position.set(ox - 6, baseY + 17, oz);
        addObj(turretL);

        // White dome on left turret
        var domeL = makeMesh(new THREE.SphereGeometry(3.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xf0efe8);
        domeL.position.set(ox - 6, baseY + 22, oz);
        addObj(domeL);

        // Right turret
        var turretR = makeMesh(new THREE.CylinderGeometry(3.5, 3.5, 10, 8), 0x8b3a2a);
        turretR.position.set(ox + 6, baseY + 17, oz);
        addObj(turretR);

        // Small dome right turret
        var domeR = makeMesh(new THREE.SphereGeometry(3.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xf0efe8);
        domeR.position.set(ox + 6, baseY + 22, oz);
        addObj(domeR);

        // Time Ball mast
        var mast = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), 0x333333);
        mast.position.set(ox - 6, baseY + 30, oz);
        addObj(mast);
        timeBallMast = mast;

        // Time Ball (red sphere that drops at 1pm)
        var ball = makeMesh(new THREE.SphereGeometry(1.2, 8, 6), 0xcc2200);
        ball.position.set(ox - 6, baseY + 34, oz);
        addObj(ball);
        timeBall = ball;
        timeBall.userData.baseX = ox - 6;
        timeBall.userData.baseZ = oz;
        timeBall.userData.topY = baseY + 34;
        timeBall.userData.bottomY = baseY + 27;

        // Windows on Flamsteed House
        for (var wi = 0; wi < 3; wi++) {
            var win = makeMesh(new THREE.BoxGeometry(2, 3, 0.3), 0xaaccee);
            win.position.set(ox - 4 + wi * 4, baseY + 7, oz + 7.1);
            addObj(win);
        }

        // Altazimuth Pavilion - large dome building
        var pavBase = makeMesh(new THREE.CylinderGeometry(8, 9, 8, 10), 0x8b3a2a);
        pavBase.position.set(ox + 20, baseY + 4, oz - 5);
        addObj(pavBase);

        var pavDome = makeMesh(new THREE.SphereGeometry(8, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xd0cfc8);
        pavDome.position.set(ox + 20, baseY + 8, oz - 5);
        addObj(pavDome);

        // Dome slit
        var domeSlit = makeMesh(new THREE.BoxGeometry(2, 8, 0.5), 0x555555);
        domeSlit.position.set(ox + 20, baseY + 11, oz - 13);
        addObj(domeSlit);

        // Observatory courtyard wall
        var wall1 = makeMesh(new THREE.BoxGeometry(50, 3, 1), 0x8b3a2a);
        wall1.position.set(ox + 5, baseY + 1.5, oz + 12);
        addObj(wall1);

        var wall2 = makeMesh(new THREE.BoxGeometry(1, 3, 25), 0x8b3a2a);
        wall2.position.set(ox - 15, baseY + 1.5, oz);
        addObj(wall2);

        var wall3 = makeMesh(new THREE.BoxGeometry(1, 3, 25), 0x8b3a2a);
        wall3.position.set(ox + 30, baseY + 1.5, oz);
        addObj(wall3);

        // Gate pillars
        var pillar1 = makeMesh(new THREE.BoxGeometry(1.5, 5, 1.5), 0x8b3a2a);
        pillar1.position.set(ox - 3, baseY + 2.5, oz + 12);
        addObj(pillar1);

        var pillar2 = makeMesh(new THREE.BoxGeometry(1.5, 5, 1.5), 0x8b3a2a);
        pillar2.position.set(ox + 3, baseY + 2.5, oz + 12);
        addObj(pillar2);
    }

    function buildMeridianLine() {
        // Bright green meridian line (Prime Meridian) running N-S
        var meridian = makeMesh(new THREE.BoxGeometry(1.5, 0.3, 300), 0x00ff44);
        meridian.position.set(10960, 0.2, 0);
        addObj(meridian);

        // Meridian line on hill
        var meridianHill = makeMesh(new THREE.BoxGeometry(1.5, 0.3, 80), 0x00ff44);
        meridianHill.position.set(10960, 35.2, -5);
        meridianHill.rotation.x = -0.35;
        addObj(meridianHill);

        // Meridian marker post
        var markerPost = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 4, 6), 0xdddddd);
        markerPost.position.set(10960, 37, -15);
        addObj(markerPost);

        var markerTop = makeMesh(new THREE.SphereGeometry(0.5, 6, 6), 0xffff00);
        markerTop.position.set(10960, 39.2, -15);
        addObj(markerTop);

        // Ground plaques along meridian
        for (var mi = 0; mi < 8; mi++) {
            var plaque = makeMesh(new THREE.BoxGeometry(2, 0.2, 2), 0xaaaaaa);
            plaque.position.set(10960, 0.2, 50 + mi * 20);
            addObj(plaque);
        }
    }

    function buildNationalMaritimeMuseum() {
        var mx = 10960;
        var mz = 110;

        // Main building body
        var mainBody = makeMesh(new THREE.BoxGeometry(80, 14, 40), 0xe8e0cc);
        mainBody.position.set(mx, 7, mz);
        addObj(mainBody);

        // East wing
        var eastWing = makeMesh(new THREE.BoxGeometry(30, 12, 35), 0xe8e0cc);
        eastWing.position.set(mx + 55, 6, mz + 2);
        addObj(eastWing);

        // West wing
        var westWing = makeMesh(new THREE.BoxGeometry(30, 12, 35), 0xe8e0cc);
        westWing.position.set(mx - 55, 6, mz + 2);
        addObj(westWing);

        // Classical roof cornice
        var cornice = makeMesh(new THREE.BoxGeometry(84, 2, 44), 0xd8d0bc);
        cornice.position.set(mx, 14.5, mz);
        addObj(cornice);

        // Roof
        var mainRoof = makeMesh(new THREE.BoxGeometry(82, 4, 42), 0xc8c0b0);
        mainRoof.position.set(mx, 17, mz);
        addObj(mainRoof);

        // Portico columns - front facade
        for (var ci = 0; ci < 8; ci++) {
            var col = makeMesh(new THREE.CylinderGeometry(0.9, 1.1, 14, 8), 0xf0ece0);
            col.position.set(mx - 14 + ci * 4, 7, mz - 21);
            addObj(col);
        }

        // Portico pediment
        var pediment = makeMesh(new THREE.ConeGeometry(16, 5, 4), 0xe8e0cc);
        pediment.position.set(mx, 17, mz - 20);
        pediment.rotation.y = Math.PI / 4;
        addObj(pediment);

        // Portico roof slab
        var porticoRoof = makeMesh(new THREE.BoxGeometry(32, 1.5, 5), 0xd8d0bc);
        porticoRoof.position.set(mx, 15, mz - 21);
        addObj(porticoRoof);

        // Steps
        var steps1 = makeMesh(new THREE.BoxGeometry(35, 1, 6), 0xd8d0bc);
        steps1.position.set(mx, 0.5, mz - 24);
        addObj(steps1);

        var steps2 = makeMesh(new THREE.BoxGeometry(33, 1, 5), 0xd8d0bc);
        steps2.position.set(mx, 1.5, mz - 22);
        addObj(steps2);

        // Neptune Court glass atrium dome
        var atriumDome = makeMesh(new THREE.SphereGeometry(22, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0x88aacc);
        atriumDome.position.set(mx, 14, mz + 8);
        addObj(atriumDome);

        // Dome support ring
        var domeRing = makeMesh(new THREE.CylinderGeometry(22, 22, 2, 16), 0xd8d0bc);
        domeRing.position.set(mx, 13, mz + 8);
        addObj(domeRing);

        // Museum windows
        for (var mwi = 0; mwi < 10; mwi++) {
            var mwin = makeMesh(new THREE.BoxGeometry(3, 4, 0.3), 0xaaccee);
            mwin.position.set(mx - 18 + mwi * 4, 8, mz - 20.2);
            addObj(mwin);
        }

        // East wing columns
        for (var eci = 0; eci < 4; eci++) {
            var ecol = makeMesh(new THREE.CylinderGeometry(0.7, 0.9, 12, 8), 0xf0ece0);
            ecol.position.set(mx + 55, 6, mz - 18 + eci * 4);
            addObj(ecol);
        }
    }

    function buildCuttySark() {
        var cx = 10960 + 90;
        var cz = 200;
        var deckY = 6;

        // Visitor centre building (glass box around ship)
        var centre = makeMesh(new THREE.BoxGeometry(50, 16, 20), 0x7799bb);
        centre.position.set(cx, 8, cz);
        addObj(centre);

        // Glass roof panels
        var glassRoof = makeMesh(new THREE.BoxGeometry(52, 1, 22), 0x99bbcc);
        glassRoof.position.set(cx, 16.5, cz);
        addObj(glassRoof);

        // Dry dock cradle structure
        var cradleL = makeMesh(new THREE.BoxGeometry(2, 5, 18), 0x555566);
        cradleL.position.set(cx - 20, 2.5, cz);
        addObj(cradleL);

        var cradleR = makeMesh(new THREE.BoxGeometry(2, 5, 18), 0x555566);
        cradleR.position.set(cx + 20, 2.5, cz);
        addObj(cradleR);

        var cradleBase = makeMesh(new THREE.BoxGeometry(42, 1.5, 18), 0x444455);
        cradleBase.position.set(cx, 0.75, cz);
        addObj(cradleBase);

        // Ship hull - main body (tea clipper, sleek)
        var hull = makeMesh(new THREE.BoxGeometry(40, 6, 10), 0x2a1a0a);
        hull.position.set(cx, deckY, cz);
        addObj(hull);

        // Hull bow (pointed front)
        var bow = makeMesh(new THREE.ConeGeometry(5, 10, 4), 0x2a1a0a);
        bow.position.set(cx + 25, deckY, cz);
        bow.rotation.z = -Math.PI / 2;
        bow.rotation.y = Math.PI / 4;
        addObj(bow);

        // Hull stern
        var stern = makeMesh(new THREE.BoxGeometry(8, 8, 10), 0x3a2a1a);
        stern.position.set(cx - 22, deckY + 1, cz);
        addObj(stern);

        // Deck
        var deck = makeMesh(new THREE.BoxGeometry(42, 1, 10), 0x8b6914);
        deck.position.set(cx, deckY + 3.5, cz);
        addObj(deck);

        // Figurehead
        var figurehead = makeMesh(new THREE.SphereGeometry(1, 6, 6), 0xf4c87a);
        figurehead.position.set(cx + 30, deckY + 1, cz);
        addObj(figurehead);

        // Three masts
        var mastHeight = 20;
        var mastPositions = [cx - 12, cx, cx + 14];
        var masts = [];
        for (var mi = 0; mi < 3; mi++) {
            var mast = makeMesh(new THREE.CylinderGeometry(0.3, 0.5, mastHeight, 6), 0x5c3d1e);
            mast.position.set(mastPositions[mi], deckY + 3.5 + mastHeight / 2, cz);
            addObj(mast);
            masts.push(mast);

            // Crow's nest
            var nest = makeMesh(new THREE.CylinderGeometry(1.5, 1, 2, 6), 0x6b4a2a);
            nest.position.set(mastPositions[mi], deckY + 3.5 + mastHeight * 0.6, cz);
            addObj(nest);

            // Top yard (horizontal spar)
            var topYard = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 14, 4), 0x5c3d1e);
            topYard.position.set(mastPositions[mi], deckY + 3.5 + mastHeight * 0.85, cz);
            topYard.rotation.z = Math.PI / 2;
            addObj(topYard);

            // Mid yard
            var midYard = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 12, 4), 0x5c3d1e);
            midYard.position.set(mastPositions[mi], deckY + 3.5 + mastHeight * 0.65, cz);
            midYard.rotation.z = Math.PI / 2;
            addObj(midYard);
        }

        // Rigging as LineSegments between masts
        var rigPoints = [];
        // Forestay: bow to foremast
        rigPoints.push(cx + 30, deckY + 2, cz, mastPositions[2], deckY + 3.5 + mastHeight, cz);
        // Foremast to mainmast
        rigPoints.push(mastPositions[2], deckY + 3.5 + mastHeight, cz, mastPositions[1], deckY + 3.5 + mastHeight, cz);
        // Mainmast to mizzenmast
        rigPoints.push(mastPositions[1], deckY + 3.5 + mastHeight, cz, mastPositions[0], deckY + 3.5 + mastHeight, cz);
        // Backstay: stern to mizzenmast
        rigPoints.push(mastPositions[0], deckY + 3.5 + mastHeight, cz, cx - 22, deckY + 5, cz);
        // Cross shrouds foremast
        rigPoints.push(mastPositions[2], deckY + 3.5 + mastHeight, cz, cx + 20, deckY + 4, cz - 5);
        rigPoints.push(mastPositions[2], deckY + 3.5 + mastHeight, cz, cx + 20, deckY + 4, cz + 5);
        // Cross shrouds mainmast
        rigPoints.push(mastPositions[1], deckY + 3.5 + mastHeight, cz, cx + 2, deckY + 4, cz - 5);
        rigPoints.push(mastPositions[1], deckY + 3.5 + mastHeight, cz, cx + 2, deckY + 4, cz + 5);
        // Cross shrouds mizzenmast
        rigPoints.push(mastPositions[0], deckY + 3.5 + mastHeight, cz, cx - 10, deckY + 4, cz - 5);
        rigPoints.push(mastPositions[0], deckY + 3.5 + mastHeight, cz, cx - 10, deckY + 4, cz + 5);
        // Top yard stays foremast
        rigPoints.push(mastPositions[2] - 7, deckY + 3.5 + mastHeight * 0.85, cz, mastPositions[2] - 7, deckY + 4, cz);
        rigPoints.push(mastPositions[2] + 7, deckY + 3.5 + mastHeight * 0.85, cz, mastPositions[2] + 7, deckY + 4, cz);
        // Bowsprit diagonal bracing
        rigPoints.push(mastPositions[2], deckY + 3.5 + mastHeight * 0.5, cz, cx + 30, deckY + 2, cz);

        var rigGeo = new THREE.BufferGeometry();
        var rigArray = new Float32Array(rigPoints);
        rigGeo.setAttribute('position', new THREE.BufferAttribute(rigArray, 3));
        var rigLines = new THREE.LineSegments(rigGeo, new THREE.MeshLambertMaterial({ color: 0x8b7355 }));
        scene.add(rigLines);
        objects.push(rigLines);

        // Bowsprit (forward-pointing spar)
        var bowsprit = makeMesh(new THREE.CylinderGeometry(0.2, 0.35, 16, 5), 0x5c3d1e);
        bowsprit.position.set(cx + 28, deckY + 4, cz);
        bowsprit.rotation.z = -Math.PI / 6;
        addObj(bowsprit);

        // Ship nameplate
        var nameplate = makeMesh(new THREE.BoxGeometry(8, 2, 0.3), 0xffd700);
        nameplate.position.set(cx - 8, deckY - 1, cz - 5.2);
        addObj(nameplate);
    }

    function buildQueensHouse() {
        var qx = 10960;
        var qz = 80;

        // Main Palladian villa body - white symmetrical facade
        var mainHouse = makeMesh(new THREE.BoxGeometry(36, 12, 20), 0xf5f5f0);
        mainHouse.position.set(qx, 6, qz);
        addObj(mainHouse);

        // Flat roof with balustrade
        var roof = makeMesh(new THREE.BoxGeometry(38, 1.5, 22), 0xeeece0);
        roof.position.set(qx, 12.75, qz);
        addObj(roof);

        // Balustrade posts along roof edge
        for (var bi = 0; bi < 12; bi++) {
            var bpost = makeMesh(new THREE.BoxGeometry(0.5, 2, 0.5), 0xf0f0e8);
            bpost.position.set(qx - 17 + bi * 3.2, 14, qz - 11);
            addObj(bpost);
        }

        // Top balustrade rail
        var brail = makeMesh(new THREE.BoxGeometry(38, 0.5, 1), 0xf0f0e8);
        brail.position.set(qx, 15, qz - 11);
        addObj(brail);

        // Central loggia - recessed portico
        var loggia = makeMesh(new THREE.BoxGeometry(16, 10, 4), 0xe8e8e0);
        loggia.position.set(qx, 5, qz - 12);
        addObj(loggia);

        // Loggia columns
        for (var lci = 0; lci < 4; lci++) {
            var lcol = makeMesh(new THREE.CylinderGeometry(0.6, 0.7, 10, 8), 0xf5f5f0);
            lcol.position.set(qx - 4.5 + lci * 3, 5, qz - 14);
            addObj(lcol);
        }

        // Double staircase left
        var stairL1 = makeMesh(new THREE.BoxGeometry(6, 1, 8), 0xe0ddd0);
        stairL1.position.set(qx - 14, 0.5, qz - 14);
        stairL1.rotation.z = 0.15;
        addObj(stairL1);

        var stairL2 = makeMesh(new THREE.BoxGeometry(6, 1, 8), 0xe0ddd0);
        stairL2.position.set(qx - 12, 1.5, qz - 14);
        stairL2.rotation.z = 0.08;
        addObj(stairL2);

        // Double staircase right
        var stairR1 = makeMesh(new THREE.BoxGeometry(6, 1, 8), 0xe0ddd0);
        stairR1.position.set(qx + 14, 0.5, qz - 14);
        stairR1.rotation.z = -0.15;
        addObj(stairR1);

        var stairR2 = makeMesh(new THREE.BoxGeometry(6, 1, 8), 0xe0ddd0);
        stairR2.position.set(qx + 12, 1.5, qz - 14);
        stairR2.rotation.z = -0.08;
        addObj(stairR2);

        // Windows - regular symmetrical arrangement
        var winPositionsX = [-13, -7, 0, 7, 13];
        for (var qwi = 0; qwi < winPositionsX.length; qwi++) {
            var qwin = makeMesh(new THREE.BoxGeometry(3, 4, 0.3), 0xaaccee);
            qwin.position.set(qx + winPositionsX[qwi], 7, qz - 10.2);
            addObj(qwin);

            var qwinU = makeMesh(new THREE.BoxGeometry(3, 3, 0.3), 0xaaccee);
            qwinU.position.set(qx + winPositionsX[qwi], 3, qz - 10.2);
            addObj(qwinU);
        }

        // Rear linking colonnades (Queens House bridges road)
        var colonnade1 = makeMesh(new THREE.BoxGeometry(36, 8, 2), 0xf0f0e8);
        colonnade1.position.set(qx, 4, qz + 12);
        addObj(colonnade1);

        // Surrounding park lawn
        var lawn = makeMesh(new THREE.BoxGeometry(80, 0.2, 60), 0x4a9a3a);
        lawn.position.set(qx, 0.1, qz + 5);
        addObj(lawn);

        // Flanking trees (simple cylinders + cones)
        var treePositions = [
            [qx - 25, qz - 5],
            [qx - 25, qz + 15],
            [qx + 25, qz - 5],
            [qx + 25, qz + 15]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var trunk = makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 6), 0x5c3d1e);
            trunk.position.set(treePositions[ti][0], 2.5, treePositions[ti][1]);
            addObj(trunk);

            var foliage = makeMesh(new THREE.SphereGeometry(4, 8, 6), 0x2d6e22);
            foliage.position.set(treePositions[ti][0], 9, treePositions[ti][1]);
            addObj(foliage);
        }
    }

    function buildParkGrounds() {
        // Main park flat ground
        var ground = makeMesh(new THREE.BoxGeometry(300, 0.5, 300), 0x3d7a35);
        ground.position.set(10960, -0.25, 100);
        addObj(ground);

        // Park paths
        var mainPath = makeMesh(new THREE.BoxGeometry(6, 0.3, 200), 0x9b8b6e);
        mainPath.position.set(10960, 0.15, 70);
        addObj(mainPath);

        var crossPath = makeMesh(new THREE.BoxGeometry(120, 0.3, 5), 0x9b8b6e);
        crossPath.position.set(10960, 0.15, 130);
        addObj(crossPath);

        // Park benches
        var benchPositions = [
            [10930, 55], [10990, 55],
            [10930, 145], [10990, 145]
        ];
        for (var bni = 0; bni < benchPositions.length; bni++) {
            var bench = makeMesh(new THREE.BoxGeometry(3, 0.5, 0.8), 0x6b4a1a);
            bench.position.set(benchPositions[bni][0], 0.75, benchPositions[bni][1]);
            addObj(bench);
            var benchLeg1 = makeMesh(new THREE.BoxGeometry(0.3, 0.8, 0.8), 0x5c3d1e);
            benchLeg1.position.set(benchPositions[bni][0] - 1, 0.4, benchPositions[bni][1]);
            addObj(benchLeg1);
            var benchLeg2 = makeMesh(new THREE.BoxGeometry(0.3, 0.8, 0.8), 0x5c3d1e);
            benchLeg2.position.set(benchPositions[bni][0] + 1, 0.4, benchPositions[bni][1]);
            addObj(benchLeg2);
        }

        // Park lamp posts
        var lampPositions = [
            [10940, 60], [10980, 60],
            [10940, 120], [10980, 120],
            [10940, 180], [10980, 180]
        ];
        for (var li = 0; li < lampPositions.length; li++) {
            var post = makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 7, 6), 0x333344);
            post.position.set(lampPositions[li][0], 3.5, lampPositions[li][1]);
            addObj(post);
            var lamp = makeMesh(new THREE.SphereGeometry(0.5, 6, 6), 0xffffcc);
            lamp.position.set(lampPositions[li][0], 7.2, lampPositions[li][1]);
            addObj(lamp);
        }

        // Scattered mature trees throughout park
        var parkTreePositions = [
            [10920, 50], [10920, 90], [10920, 130], [10920, 170],
            [11000, 50], [11000, 90], [11000, 130], [11000, 170],
            [10935, 165], [10985, 165],
            [10930, 35], [10990, 35]
        ];
        for (var pti = 0; pti < parkTreePositions.length; pti++) {
            var ptrunk = makeMesh(new THREE.CylinderGeometry(0.7, 1, 6, 7), 0x5c3d1e);
            ptrunk.position.set(parkTreePositions[pti][0], 3, parkTreePositions[pti][1]);
            addObj(ptrunk);
            var pfoliage = makeMesh(new THREE.SphereGeometry(4.5 + Math.sin(pti) * 1.5, 8, 6), 0x2d6e22);
            pfoliage.position.set(parkTreePositions[pti][0], 10, parkTreePositions[pti][1]);
            addObj(pfoliage);
        }
    }

    function buildDeer() {
        // Red deer herd in park - simple boxy creatures
        var deerSpots = [
            [10945, 160], [10955, 163],
            [10948, 170], [10965, 158],
            [10970, 165], [10958, 175]
        ];
        for (var di = 0; di < deerSpots.length; di++) {
            var dx = deerSpots[di][0];
            var dz = deerSpots[di][1];

            // Body
            var deerBody = makeMesh(new THREE.BoxGeometry(3, 2, 1.2), 0x8b5a2b);
            deerBody.position.set(dx, 2.5, dz);
            addObj(deerBody);
            deerObjects.push(deerBody);

            // Neck
            var deerNeck = makeMesh(new THREE.BoxGeometry(0.8, 1.5, 0.8), 0x8b5a2b);
            deerNeck.position.set(dx + 1.2, 3.5, dz);
            addObj(deerNeck);
            deerObjects.push(deerNeck);

            // Head
            var deerHead = makeMesh(new THREE.BoxGeometry(1.2, 1, 0.9), 0x8b5a2b);
            deerHead.position.set(dx + 1.8, 4.6, dz);
            addObj(deerHead);
            deerObjects.push(deerHead);

            // Antlers (some deer)
            if (di % 2 === 0) {
                var antlerL = makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 2, 4), 0x6b4a1a);
                antlerL.position.set(dx + 1.7, 5.7, dz - 0.3);
                antlerL.rotation.z = 0.3;
                addObj(antlerL);

                var antlerR = makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 2, 4), 0x6b4a1a);
                antlerR.position.set(dx + 1.7, 5.7, dz + 0.3);
                antlerR.rotation.z = 0.3;
                addObj(antlerR);
            }

            // Legs
            for (var leg = 0; leg < 4; leg++) {
                var legX = dx + (leg < 2 ? -0.8 : 0.8);
                var legZ = dz + (leg % 2 === 0 ? -0.4 : 0.4);
                var deerLeg = makeMesh(new THREE.CylinderGeometry(0.18, 0.15, 2, 4), 0x7a4a1f);
                deerLeg.position.set(legX, 1.0, legZ);
                addObj(deerLeg);
            }

            // Tail
            var tail = makeMesh(new THREE.SphereGeometry(0.3, 4, 4), 0xffffff);
            tail.position.set(dx - 1.6, 3.0, dz);
            addObj(tail);
        }
    }

    function buildCanaryWharfVista() {
        // Fan-shaped vista from observatory hill toward Canary Wharf
        // Distant Canary Wharf towers visible from hill (simplified silhouette)
        var cwBase = 10960 + 150;

        // One Canada Square (main tower)
        var ocs = makeMesh(new THREE.BoxGeometry(8, 60, 8), 0xaabbcc);
        ocs.position.set(cwBase, 30, -80);
        addObj(ocs);

        // Pyramid cap
        var ocsPyramid = makeMesh(new THREE.ConeGeometry(5.6, 8, 4), 0x99aacc);
        ocsPyramid.position.set(cwBase, 64, -80);
        ocsPyramid.rotation.y = Math.PI / 4;
        addObj(ocsPyramid);

        // HSBC tower
        var hsbc = makeMesh(new THREE.BoxGeometry(7, 48, 7), 0x99aabb);
        hsbc.position.set(cwBase + 18, 24, -80);
        addObj(hsbc);

        // Citigroup tower
        var citi = makeMesh(new THREE.BoxGeometry(7, 44, 7), 0x889aab);
        citi.position.set(cwBase - 18, 22, -80);
        addObj(citi);

        // Additional towers
        var t1 = makeMesh(new THREE.BoxGeometry(6, 36, 6), 0x8899aa);
        t1.position.set(cwBase + 30, 18, -75);
        addObj(t1);

        var t2 = makeMesh(new THREE.BoxGeometry(6, 32, 6), 0x7788aa);
        t2.position.set(cwBase - 30, 16, -75);
        addObj(t2);

        var t3 = makeMesh(new THREE.BoxGeometry(5, 28, 5), 0x6677aa);
        t3.position.set(cwBase + 12, 14, -70);
        addObj(t3);

        var t4 = makeMesh(new THREE.BoxGeometry(5, 24, 5), 0x6688aa);
        t4.position.set(cwBase - 12, 12, -70);
        addObj(t4);

        // Thames River - flat blue strip in vista
        var thames = makeMesh(new THREE.BoxGeometry(300, 0.5, 20), 0x2266aa);
        thames.position.set(cwBase, 0, -55);
        addObj(thames);

        // River banks
        var bankN = makeMesh(new THREE.BoxGeometry(300, 1, 5), 0x8b7355);
        bankN.position.set(cwBase, 0.5, -46);
        addObj(bankN);

        var bankS = makeMesh(new THREE.BoxGeometry(300, 1, 5), 0x8b7355);
        bankS.position.set(cwBase, 0.5, -64);
        addObj(bankS);

        // Vista viewpoint marker on hilltop
        var viewPoint = makeMesh(new THREE.CylinderGeometry(5, 5, 0.4, 12), 0x888888);
        viewPoint.position.set(10960, 35.5, -5);
        addObj(viewPoint);

        // Compass rose on viewpoint
        var compN = makeMesh(new THREE.BoxGeometry(1, 0.3, 4), 0xff4444);
        compN.position.set(10960, 35.8, -7);
        addObj(compN);

        var compE = makeMesh(new THREE.BoxGeometry(4, 0.3, 1), 0x4444ff);
        compE.position.set(10962, 35.8, -5);
        addObj(compE);
    }

    function update(delta) {
        timeBallTimer += delta;

        // Time ball simulation: drops slowly then resets
        if (timeBall) {
            if (timeBallState === 0) {
                // Waiting at top - rise/hold
                timeBall.position.y = timeBall.userData.topY;
                // Every 60 seconds simulate the 1pm drop
                if (timeBallTimer > 60) {
                    timeBallState = 1;
                    timeBallTimer = 0;
                }
            } else if (timeBallState === 1) {
                // Dropping over 5 seconds
                var dropProgress = Math.min(timeBallTimer / 5, 1);
                timeBall.position.y = timeBall.userData.topY + (timeBall.userData.bottomY - timeBall.userData.topY) * dropProgress;
                if (dropProgress >= 1) {
                    timeBallState = 2;
                    timeBallTimer = 0;
                }
            } else if (timeBallState === 2) {
                // Hold at bottom then rise
                timeBall.position.y = timeBall.userData.bottomY;
                if (timeBallTimer > 5) {
                    timeBallState = 0;
                    timeBallTimer = 0;
                    timeBall.position.y = timeBall.userData.topY;
                }
            }
        }

        // Subtle deer animation - gentle bobbing
        for (var di = 0; di < deerObjects.length; di++) {
            if (deerObjects[di] && deerObjects[di].userData && deerObjects[di].userData.bobBase !== undefined) {
                deerObjects[di].position.y = deerObjects[di].userData.bobBase + Math.sin(timeBallTimer * 0.8 + di) * 0.05;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        deerObjects = [];
        timeBall = null;
        timeBallMast = null;
        timeBallState = 0;
        timeBallTimer = 0;
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
