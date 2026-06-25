window.MinskIndependence = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 23520;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z, rx, ry, rz) {
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
        buildIndependenceAvenue();
        buildVictorySquare();
        buildGovernmentHouse();
        buildKGBBuilding();
        buildSvislachRiver();
        buildHolySpiritCathedral();
        buildNationalLibrary();
        buildRedChurch();
        buildTraetskayeSuburbiye();
        buildYankaKupalapark();
    }

    function buildGround() {
        // Ground plane approximated with large flat boxes
        var groundGeo = new THREE.BoxGeometry(1200, 2, 1200);
        addMesh(groundGeo, 0x555550, 0, -1, 0);

        // Sidewalk surfaces — wide light pavement strips
        var swGeo = new THREE.BoxGeometry(1100, 1, 60);
        addMesh(swGeo, 0xC0BEB8, 0, 0, -85);
        addMesh(swGeo, 0xC0BEB8, 0, 0, 85);

        // Avenue road surface
        var roadGeo = new THREE.BoxGeometry(1100, 1, 50);
        addMesh(roadGeo, 0x383838, 0, 0, 0);

        // Road divider strip
        var divGeo = new THREE.BoxGeometry(1100, 1, 4);
        addMesh(divGeo, 0xF0F0E0, 0, 0.5, 0);
    }

    function buildIndependenceAvenue() {
        // Independence Avenue runs along X-axis
        // Stalinist neoclassical 5-storey blocks on north and south sides
        // Each block ~80 wide, 60 deep, 20 tall (5 floors)

        var blockW = 80;
        var blockD = 55;
        var blockH = 22;
        var color = 0xC8C8CC;

        var positions = [-480, -380, -280, -160, -40, 80, 200, 320, 440];

        for (var i = 0; i < positions.length; i++) {
            var px = positions[i];

            // South side building body
            var geoS = new THREE.BoxGeometry(blockW - 4, blockH, blockD);
            addMesh(geoS, color, px, blockH / 2, -140);

            // South side attic / cornice raise
            var cornSGeo = new THREE.BoxGeometry(blockW - 4, 3, blockD + 2);
            addMesh(cornSGeo, 0xDADADE, px, blockH + 1.5, -140);

            // South side central pavilion projection
            var pavSGeo = new THREE.BoxGeometry(28, blockH + 6, 6);
            addMesh(pavSGeo, 0xB8B8BC, px, (blockH + 6) / 2, -113);

            // South side roof parapet boxes
            var parSGeo = new THREE.BoxGeometry(blockW, 2, 3);
            addMesh(parSGeo, 0xC4C4C8, px, blockH + 3, -115);

            // North side building body
            var geoN = new THREE.BoxGeometry(blockW - 4, blockH, blockD);
            addMesh(geoN, color, px, blockH / 2, 140);

            // North side attic / cornice
            var cornNGeo = new THREE.BoxGeometry(blockW - 4, 3, blockD + 2);
            addMesh(cornNGeo, 0xDADADE, px, blockH + 1.5, 140);

            // North side central pavilion projection
            var pavNGeo = new THREE.BoxGeometry(28, blockH + 6, 6);
            addMesh(pavNGeo, 0xB8B8BC, px, (blockH + 6) / 2, 113);

            // North side roof parapet
            var parNGeo = new THREE.BoxGeometry(blockW, 2, 3);
            addMesh(parNGeo, 0xC4C4C8, px, blockH + 3, 115);
        }

        // Lampposts along avenue
        var lampPositions = [-420, -300, -180, -60, 60, 180, 300, 420];
        for (var j = 0; j < lampPositions.length; j++) {
            var lx = lampPositions[j];
            // Pole
            var poleGeo = new THREE.CylinderGeometry(0.5, 0.6, 12, 6);
            addMesh(poleGeo, 0x888880, lx, 6, -60);
            addMesh(poleGeo, 0x888880, lx, 6, 60);
            // Lamp head
            var lampGeo = new THREE.SphereGeometry(1.2, 6, 4);
            addMesh(lampGeo, 0xFFFFCC, lx, 12.5, -60);
            addMesh(lampGeo, 0xFFFFCC, lx, 12.5, 60);
        }

        // Trees between sidewalk and buildings
        for (var t = 0; t < 10; t++) {
            var tx = -450 + t * 100;
            // South tree trunk
            var trunkGeo = new THREE.CylinderGeometry(0.8, 1.0, 6, 5);
            addMesh(trunkGeo, 0x5A3A1A, tx, 3, -100);
            // South tree crown
            var crownGeo = new THREE.SphereGeometry(5, 5, 4);
            addMesh(crownGeo, 0x2A5A20, tx, 9, -100);
            // North tree trunk
            addMesh(new THREE.CylinderGeometry(0.8, 1.0, 6, 5), 0x5A3A1A, tx, 3, 100);
            addMesh(new THREE.SphereGeometry(5, 5, 4), 0x2A5A20, tx, 9, 100);
        }
    }

    function buildVictorySquare() {
        // Victory Square — large paved area at center-east end of avenue
        // Center ~x=550, z=0

        var sqX = 550;
        var sqColor = 0xD4D0C8;

        // Square paving (flat box)
        var sqGeo = new THREE.BoxGeometry(220, 1, 220);
        addMesh(sqGeo, sqColor, sqX, 0.5, 0);

        // Inner ring raised platform
        var ringGeo = new THREE.CylinderGeometry(55, 58, 1.5, 16);
        addMesh(ringGeo, 0xC8C4BC, sqX, 1.5, 0);

        // Victory Monument obelisk — 38m tall pointed pillar
        var obelBase = new THREE.BoxGeometry(8, 4, 8);
        addMesh(obelBase, 0xB0AEA8, sqX, 2, 0);

        var obelShaft = new THREE.BoxGeometry(5, 60, 5);
        addMesh(obelShaft, 0xC0BEBC, sqX, 32, 0);

        // Obelisk tip — cone
        var obelTip = new THREE.ConeGeometry(3, 12, 4);
        addMesh(obelTip, 0xD0CECC, sqX, 68, 0);

        // Star on top
        var starGeo = new THREE.SphereGeometry(2, 5, 4);
        addMesh(starGeo, 0xDD2222, sqX, 74.5, 0);

        // Eternal flame pedestal
        var flamePedGeo = new THREE.CylinderGeometry(3, 4, 3, 8);
        addMesh(flamePedGeo, 0x888880, sqX + 20, 2, 20);

        // Eternal flame glow
        var flameGeo = new THREE.ConeGeometry(2, 6, 6);
        addMesh(flameGeo, 0xFF6600, sqX + 20, 6, 20);

        // War memorial relief walls — two curved flanking walls (approximated as boxes)
        var wallGeo = new THREE.BoxGeometry(5, 12, 60);
        addMesh(wallGeo, 0xA0A09A, sqX - 50, 6, -35);
        addMesh(wallGeo, 0xA0A09A, sqX - 50, 6, 35);
        addMesh(wallGeo, 0xA0A09A, sqX + 50, 6, -35);
        addMesh(wallGeo, 0xA0A09A, sqX + 50, 6, 35);

        // Underground Victory Chapel entrance (above-ground marker slab)
        var chapelEntryGeo = new THREE.BoxGeometry(14, 3, 14);
        addMesh(chapelEntryGeo, 0x8888AA, sqX + 30, 1.5, -30);

        // Small chapel dome hints (boxes descending below ground, just show a dome)
        var chapelDome = new THREE.SphereGeometry(4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(chapelDome, 0x9999BB, sqX + 30, 3, -30);

        // Soviet reliefs — flat slabs with raised panels
        for (var r = 0; r < 4; r++) {
            var angle = r * (Math.PI / 2) + Math.PI / 4;
            var rx = sqX + Math.cos(angle) * 70;
            var rz = Math.sin(angle) * 70;
            var reliefGeo = new THREE.BoxGeometry(3, 10, 30);
            addMesh(reliefGeo, 0xB8B4AC, rx, 5, rz);
        }

        // Flagpoles around square
        for (var f = 0; f < 8; f++) {
            var fa = f * (Math.PI * 2 / 8);
            var fpx = sqX + Math.cos(fa) * 80;
            var fpz = Math.sin(fa) * 80;
            var fpGeo = new THREE.CylinderGeometry(0.3, 0.4, 20, 5);
            addMesh(fpGeo, 0xAAAAAA, fpx, 10, fpz);
            // Flag
            var flagGeo = new THREE.BoxGeometry(0.2, 8, 14);
            addMesh(flagGeo, 0xCC1111, fpx + 7, 18, fpz);
        }
    }

    function buildGovernmentHouse() {
        // Massive Soviet Constructivist — 7 stories, stepped setbacks
        // Positioned at x=-300, z=-250 (south side, behind avenue)

        var gx = -300;
        var gz = -260;
        var color = 0x888899;

        // Main base block — full width
        var baseGeo = new THREE.BoxGeometry(140, 30, 80);
        addMesh(baseGeo, color, gx, 15, gz);

        // Second tier setback
        var tier2Geo = new THREE.BoxGeometry(120, 10, 70);
        addMesh(tier2Geo, 0x7A7A8A, gx, 35, gz);

        // Third tier
        var tier3Geo = new THREE.BoxGeometry(90, 8, 58);
        addMesh(tier3Geo, 0x6E6E7E, gx, 44, gz);

        // Fourth tier — central tower
        var tier4Geo = new THREE.BoxGeometry(50, 8, 40);
        addMesh(tier4Geo, 0x888899, gx, 52, gz);

        // Central tower top
        var towerGeo = new THREE.BoxGeometry(24, 10, 24);
        addMesh(towerGeo, 0x7A7A8A, gx, 65, gz);

        // Flagpole on roof
        var govFlagGeo = new THREE.CylinderGeometry(0.3, 0.4, 18, 5);
        addMesh(govFlagGeo, 0x999988, gx, 79, gz);

        // Colonnaded entrance portico
        var porticoGeo = new THREE.BoxGeometry(40, 18, 8);
        addMesh(porticoGeo, 0x9999AA, gx, 9, gz + 44);

        // Portico columns
        for (var c = 0; c < 6; c++) {
            var colGeo = new THREE.CylinderGeometry(1.2, 1.4, 18, 8);
            addMesh(colGeo, 0xAAAABB, gx - 12 + c * 5, 9, gz + 48);
        }

        // Steps leading up
        var step1 = new THREE.BoxGeometry(44, 1.5, 6);
        addMesh(step1, 0x9A9AAA, gx, 1.5, gz + 53);
        var step2 = new THREE.BoxGeometry(42, 1.5, 4);
        addMesh(step2, 0x9A9AAA, gx, 3, gz + 51);
        var step3 = new THREE.BoxGeometry(40, 1.5, 4);
        addMesh(step3, 0x9A9AAA, gx, 4.5, gz + 49);
    }

    function buildKGBBuilding() {
        // Dark imposing KGB headquarters
        // Positioned at x=100, z=-220

        var kx = 100;
        var kz = -225;
        var color = 0x555566;

        // Main building body — heavy and dark
        var mainGeo = new THREE.BoxGeometry(90, 28, 70);
        addMesh(mainGeo, color, kx, 14, kz);

        // Corner towers — slightly taller
        var ctGeo = new THREE.BoxGeometry(16, 32, 16);
        addMesh(ctGeo, 0x444455, kx - 37, 16, kz - 27);
        addMesh(ctGeo, 0x444455, kx + 37, 16, kz - 27);
        addMesh(ctGeo, 0x444455, kx - 37, 16, kz + 27);
        addMesh(ctGeo, 0x444455, kx + 37, 16, kz + 27);

        // Roof parapet — dark cornice
        var kRoofGeo = new THREE.BoxGeometry(94, 3, 74);
        addMesh(kRoofGeo, 0x3A3A48, kx, 29.5, kz);

        // Entrance — narrow intimidating doorway block
        var entGeo = new THREE.BoxGeometry(14, 28, 8);
        addMesh(entGeo, 0x4A4A5A, kx, 14, kz + 39);

        // Iron fence in front
        for (var fe = 0; fe < 14; fe++) {
            var fenceGeo = new THREE.BoxGeometry(0.5, 6, 0.5);
            addMesh(fenceGeo, 0x222222, kx - 33 + fe * 5, 3, kz + 52);
        }

        // Detention cell block below — basement walls visible as dark slabs
        var basementGeo = new THREE.BoxGeometry(80, 6, 60);
        addMesh(basementGeo, 0x2A2A36, kx, -4, kz);

        // Courtyard inner wall
        var cwGeo = new THREE.BoxGeometry(50, 10, 4);
        addMesh(cwGeo, 0x3A3A48, kx, 5, kz - 40);

        // Security booth
        var boothGeo = new THREE.BoxGeometry(4, 5, 4);
        addMesh(boothGeo, 0x555560, kx + 50, 2.5, kz + 50);

        // Surveillance tower
        var survTowerGeo = new THREE.CylinderGeometry(2, 2.5, 20, 6);
        addMesh(survTowerGeo, 0x444450, kx + 55, 10, kz - 45);
        var survCapGeo = new THREE.CylinderGeometry(4, 2, 3, 6);
        addMesh(survCapGeo, 0x333340, kx + 55, 21.5, kz - 45);
    }

    function buildSvislachRiver() {
        // River runs roughly parallel to avenue, offset south
        // Approximated as a long flat blue box (river bed visible from above)

        var riverColor = 0x2A6A8A;

        // Main river channel
        var riverGeo = new THREE.BoxGeometry(900, 1, 55);
        addMesh(riverGeo, riverColor, 0, -0.5, 340);

        // River bank — sandy/grassy edge north
        var bankNGeo = new THREE.BoxGeometry(900, 1.5, 15);
        addMesh(bankNGeo, 0x7A9A5A, 0, 0, 313);

        // River bank south
        var bankSGeo = new THREE.BoxGeometry(900, 1.5, 15);
        addMesh(bankSGeo, 0x7A9A5A, 0, 0, 368);

        // Island of Tears — small oval island in river
        var islandGeo = new THREE.CylinderGeometry(22, 24, 2, 10);
        addMesh(islandGeo, 0x88AA66, 200, 0.5, 340);

        // Island of Tears memorial chapel — small white chapel
        var isChapelGeo = new THREE.BoxGeometry(10, 12, 10);
        addMesh(isChapelGeo, 0xDDDDCC, 200, 6, 340);

        // Chapel tent roof
        var isRoofGeo = new THREE.ConeGeometry(7, 8, 4);
        addMesh(isRoofGeo, 0xBBBBAA, 200, 16, 340);

        // Chapel small dome on top
        var isDomeGeo = new THREE.SphereGeometry(2.5, 6, 5, 0, Math.PI * 2, 0, Math.PI / 2);
        addMesh(isDomeGeo, 0xCCCCBB, 200, 20, 340);

        // Cross on top
        var crossVertGeo = new THREE.BoxGeometry(0.5, 5, 0.5);
        addMesh(crossVertGeo, 0xCCCCBB, 200, 24, 340);
        var crossHorzGeo = new THREE.BoxGeometry(4, 0.5, 0.5);
        addMesh(crossHorzGeo, 0xCCCCBB, 200, 26, 340);

        // Bridge over river — two bridges
        var bridgeGeo = new THREE.BoxGeometry(20, 2, 60);
        addMesh(bridgeGeo, 0xAAAAAA, -150, 1, 340);
        addMesh(bridgeGeo, 0xAAAAAA, 350, 1, 340);

        // Bridge railings
        var railGeo = new THREE.BoxGeometry(20, 3, 1.5);
        addMesh(railGeo, 0x888888, -150, 3, 311);
        addMesh(railGeo, 0x888888, -150, 3, 370);
        addMesh(railGeo, 0x888888, 350, 3, 311);
        addMesh(railGeo, 0x888888, 350, 3, 370);
    }

    function buildHolySpiritCathedral() {
        // Blue Orthodox cathedral — Baroque-Rococo
        // Positioned at x=-150, z=200

        var hx = -150;
        var hz = 200;
        var bodyColor = 0x6677AA;
        var domeColor = 0x4455AA;

        // Main cathedral body
        var bodyGeo = new THREE.BoxGeometry(40, 22, 50);
        addMesh(bodyGeo, bodyColor, hx, 11, hz);

        // Transept wings
        var transGeo = new THREE.BoxGeometry(70, 18, 20);
        addMesh(transGeo, bodyColor, hx, 9, hz);

        // Apse — semi-circular rear (approximated box)
        var apseGeo = new THREE.BoxGeometry(22, 18, 14);
        addMesh(apseGeo, bodyColor, hx, 9, hz + 32);

        // Central dome drum
        var drumGeo = new THREE.CylinderGeometry(9, 10, 10, 8);
        addMesh(drumGeo, bodyColor, hx, 29, hz);

        // Central main dome
        var mainDomeGeo = new THREE.SphereGeometry(10, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6);
        addMesh(mainDomeGeo, domeColor, hx, 37, hz);

        // Small corner domes x4
        var smallDrumGeo = new THREE.CylinderGeometry(3.5, 4, 5, 7);
        var smallDomeGeo = new THREE.SphereGeometry(4, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.6);
        var domeOffsets = [[-14, -18], [-14, 18], [14, -18], [14, 18]];
        for (var d = 0; d < 4; d++) {
            addMesh(new THREE.CylinderGeometry(3.5, 4, 5, 7), bodyColor, hx + domeOffsets[d][0], 24, hz + domeOffsets[d][1]);
            addMesh(new THREE.SphereGeometry(4, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.6), domeColor, hx + domeOffsets[d][0], 30, hz + domeOffsets[d][1]);
        }

        // Bell tower — tall separate tower
        var btBaseGeo = new THREE.BoxGeometry(12, 38, 12);
        addMesh(btBaseGeo, bodyColor, hx - 20, 19, hz - 35);

        // Bell tower belfry
        var belfryGeo = new THREE.BoxGeometry(14, 8, 14);
        addMesh(belfryGeo, 0x5566AA, hx - 20, 42, hz - 35);

        // Bell tower spire
        var btSpireGeo = new THREE.ConeGeometry(4, 20, 4);
        addMesh(btSpireGeo, 0x4455AA, hx - 20, 58, hz - 35);

        // Cathedral steps
        var cStepGeo = new THREE.BoxGeometry(44, 1.5, 8);
        addMesh(cStepGeo, 0x9999BB, hx, 1.5, hz - 29);
        addMesh(cStepGeo, 0x8888AA, hx, 3, hz - 27);
    }

    function buildNationalLibrary() {
        // Modern diamond-shaped building (rhombicuboctahedron approx)
        // Use BoxGeometry approximation — faceted box rotations
        // Positioned at x=680, z=220

        var nlx = 680;
        var nlz = 220;
        var color = 0x9988AA;
        var glassColor = 0x6677BB;

        // Core building body — rotated square (diamond shape from above)
        var coreGeo = new THREE.BoxGeometry(55, 70, 55);
        var coreMat = new THREE.MeshLambertMaterial({ color: color });
        var coreMesh = new THREE.Mesh(coreGeo, coreMat);
        coreMesh.position.set(OX + nlx, OY + 35, OZ + nlz);
        coreMesh.rotation.y = Math.PI / 4;
        scene.add(coreMesh);
        objects.push(coreMesh);

        // Faceted angled panels — 8 side panels to approximate diamond shape
        for (var p = 0; p < 8; p++) {
            var panAngle = p * (Math.PI / 4) + Math.PI / 8;
            var panelGeo = new THREE.BoxGeometry(20, 60, 6);
            var panelMat = new THREE.MeshLambertMaterial({ color: (p % 2 === 0) ? glassColor : color });
            var panelMesh = new THREE.Mesh(panelGeo, panelMat);
            panelMesh.position.set(OX + nlx + Math.cos(panAngle) * 38, OY + 30, OZ + nlz + Math.sin(panAngle) * 38);
            panelMesh.rotation.y = -panAngle;
            scene.add(panelMesh);
            objects.push(panelMesh);
        }

        // Base podium
        var podGeo = new THREE.BoxGeometry(90, 6, 90);
        addMesh(podGeo, 0x776688, nlx, 3, nlz);

        // Roof cap
        var roofGeo = new THREE.BoxGeometry(52, 6, 52);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xAA99BB });
        var roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(OX + nlx, OY + 73, OZ + nlz);
        roofMesh.rotation.y = Math.PI / 4;
        scene.add(roofMesh);
        objects.push(roofMesh);

        // Illumination base glow (warm amber box ringing base)
        var glowGeo = new THREE.BoxGeometry(100, 2, 100);
        var glowMat = new THREE.MeshLambertMaterial({ color: 0xFFCC88 });
        var glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.set(OX + nlx, OY + 0.5, OZ + nlz);
        glowMesh.rotation.y = Math.PI / 4;
        scene.add(glowMesh);
        objects.push(glowMesh);
    }

    function buildRedChurch() {
        // Red brick Neo-Romanesque — two towers, garden
        // Positioned at x=250, z=-180

        var rx = 250;
        var rz = -180;
        var color = 0xAA3322;

        // Main nave
        var naveGeo = new THREE.BoxGeometry(28, 20, 50);
        addMesh(naveGeo, color, rx, 10, rz);

        // Nave roof — gabled (two angled boxes)
        var roofGeoA = new THREE.BoxGeometry(30, 4, 52);
        addMesh(roofGeoA, 0x882211, rx, 22, rz);

        var roofRidgeGeo = new THREE.BoxGeometry(1, 6, 52);
        addMesh(roofRidgeGeo, 0x771100, rx, 25, rz);

        // Twin west towers
        var towerBaseGeo = new THREE.BoxGeometry(12, 30, 12);
        addMesh(towerBaseGeo, color, rx - 12, 15, rz - 29);
        addMesh(towerBaseGeo, color, rx + 12, 15, rz - 29);

        // Tower upper sections — slightly narrower
        var towerMidGeo = new THREE.BoxGeometry(10, 12, 10);
        addMesh(towerMidGeo, 0x993322, rx - 12, 36, rz - 29);
        addMesh(towerMidGeo, 0x993322, rx + 12, 36, rz - 29);

        // Tower spires
        var spireGeo = new THREE.ConeGeometry(5, 18, 8);
        addMesh(spireGeo, 0x771100, rx - 12, 52, rz - 29);
        addMesh(spireGeo, 0x771100, rx + 12, 52, rz - 29);

        // Cross on left spire
        var rcVGeo = new THREE.BoxGeometry(0.5, 6, 0.5);
        addMesh(rcVGeo, 0x888888, rx - 12, 63, rz - 29);
        var rcHGeo = new THREE.BoxGeometry(5, 0.5, 0.5);
        addMesh(rcHGeo, 0x888888, rx - 12, 65, rz - 29);

        // Cross on right spire
        addMesh(new THREE.BoxGeometry(0.5, 6, 0.5), 0x888888, rx + 12, 63, rz - 29);
        addMesh(new THREE.BoxGeometry(5, 0.5, 0.5), 0x888888, rx + 12, 65, rz - 29);

        // Church garden boundary wall
        var gardenWallGeo = new THREE.BoxGeometry(70, 3, 2);
        addMesh(gardenWallGeo, 0xAA3322, rx, 1.5, rz - 46);
        addMesh(gardenWallGeo, 0xAA3322, rx, 1.5, rz + 40);

        var gardenSideGeo = new THREE.BoxGeometry(2, 3, 86);
        addMesh(gardenSideGeo, 0xAA3322, rx - 34, 1.5, rz - 3);
        addMesh(gardenSideGeo, 0xAA3322, rx + 34, 1.5, rz - 3);

        // Garden trees
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 5), 0x5A3A1A, rx - 20, 2.5, rz - 38);
        addMesh(new THREE.SphereGeometry(4, 5, 4), 0x1A6A10, rx - 20, 8, rz - 38);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 5), 0x5A3A1A, rx + 20, 2.5, rz - 38);
        addMesh(new THREE.SphereGeometry(4, 5, 4), 0x1A6A10, rx + 20, 8, rz - 38);
    }

    function buildTraetskayeSuburbiye() {
        // Restored old town district — colourful buildings
        // Positioned at x=-500, z=260 along river bank

        var tx = -500;
        var tz = 260;

        var colours = [0xCC8833, 0xBB7722, 0xDDAA44, 0xCC9944, 0xAA6622, 0xEEBB55];
        var widths = [18, 22, 16, 20, 24, 18];
        var heights = [14, 18, 12, 16, 20, 14];

        for (var b = 0; b < 6; b++) {
            var bx = tx + b * 26;
            var bcolor = colours[b];
            var bw = widths[b];
            var bh = heights[b];

            // Building body
            var bGeo = new THREE.BoxGeometry(bw, bh, 18);
            addMesh(bGeo, bcolor, bx, bh / 2, tz);

            // Gabled roof
            var brGeo = new THREE.BoxGeometry(bw + 2, 3, 20);
            addMesh(brGeo, 0x884422, bx, bh + 1.5, tz);

            // Roof ridge
            var brRidgeGeo = new THREE.BoxGeometry(1, 5, 20);
            addMesh(brRidgeGeo, 0x773311, bx, bh + 4.5, tz);

            // Chimney
            var chimGeo = new THREE.BoxGeometry(2, 6, 2);
            addMesh(chimGeo, 0x885533, bx + bw / 4, bh + 7, tz - 5);
        }

        // Cobblestone lane marker
        var laneGeo = new THREE.BoxGeometry(160, 1, 12);
        addMesh(laneGeo, 0x887755, tx + 65, 0.5, tz + 16);
    }

    function buildYankaKupalapark() {
        // Park along the river — x=-300, z=300 area

        var pkx = -300;
        var pkz = 305;
        var greenColor = 0x3D7A32;

        // Park grass area
        var parkGeo = new THREE.BoxGeometry(200, 1, 80);
        addMesh(parkGeo, greenColor, pkx, 0.5, pkz);

        // Open-air theatre — semicircular stepped seating (approximated with boxes)
        var stageGeo = new THREE.BoxGeometry(30, 2, 20);
        addMesh(stageGeo, 0xCCBBAA, pkx, 1, pkz - 20);

        // Seating tiers
        for (var tier = 0; tier < 4; tier++) {
            var tierGeo = new THREE.BoxGeometry(35 + tier * 10, 1.5, 8);
            addMesh(tierGeo, 0xBBAA99, pkx, 1.5 + tier * 1.5, pkz - 4 + tier * 9);
        }

        // Park trees cluster
        var treePosns = [
            [-380, 290], [-360, 320], [-340, 295],
            [-310, 325], [-280, 292], [-250, 318],
            [-220, 300], [-200, 330]
        ];
        for (var tp = 0; tp < treePosns.length; tp++) {
            addMesh(new THREE.CylinderGeometry(0.8, 1.0, 7, 5), 0x5A3A1A, treePosns[tp][0], 3.5, treePosns[tp][1]);
            addMesh(new THREE.SphereGeometry(6, 5, 4), 0x2E6020, treePosns[tp][0], 10, treePosns[tp][1]);
        }

        // Yanka Kupala statue pedestal
        var pedGeo = new THREE.BoxGeometry(4, 6, 4);
        addMesh(pedGeo, 0x9A9A90, pkx + 30, 3, pkz);

        // Statue figure (abstract cylinder + sphere head)
        var figGeo = new THREE.CylinderGeometry(1, 1.5, 8, 6);
        addMesh(figGeo, 0x888880, pkx + 30, 10, pkz);
        var headGeo = new THREE.SphereGeometry(1.8, 6, 5);
        addMesh(headGeo, 0x888880, pkx + 30, 15, pkz);

        // Park benches
        for (var bench = 0; bench < 5; bench++) {
            var benchGeo = new THREE.BoxGeometry(4, 1, 1.5);
            addMesh(benchGeo, 0x8B5A2B, pkx - 60 + bench * 30, 1, pkz + 15);
        }

        // Park path
        var pathGeo = new THREE.BoxGeometry(200, 1, 5);
        addMesh(pathGeo, 0xBBAA88, pkx, 0.7, pkz + 15);
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
