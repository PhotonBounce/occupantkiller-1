window.TrafalgarLions = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11600;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        return mesh;
    }

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildNelsonsColumn() {
        // Square plinth base
        var plinthGeo = new THREE.BoxGeometry(14, 6, 14);
        var plinth = makeMesh(plinthGeo, 0x8a7a6a);
        plinth.position.set(X_OFFSET, 3, 0);
        addToScene(plinth);

        // Bronze relief panels on plinth sides (north)
        var reliefN = makeMesh(new THREE.BoxGeometry(8, 3, 0.3), 0x7a6a3a);
        reliefN.position.set(X_OFFSET, 3, -7.05);
        addToScene(reliefN);

        // Bronze relief panels on plinth sides (south)
        var reliefS = makeMesh(new THREE.BoxGeometry(8, 3, 0.3), 0x7a6a3a);
        reliefS.position.set(X_OFFSET, 3, 7.05);
        addToScene(reliefS);

        // Bronze relief panels on plinth sides (east)
        var reliefE = makeMesh(new THREE.BoxGeometry(0.3, 3, 8), 0x7a6a3a);
        reliefE.position.set(X_OFFSET + 7.05, 3, 0);
        addToScene(reliefE);

        // Bronze relief panels on plinth sides (west)
        var reliefW = makeMesh(new THREE.BoxGeometry(0.3, 3, 8), 0x7a6a3a);
        reliefW.position.set(X_OFFSET - 7.05, 3, 0);
        addToScene(reliefW);

        // Main column shaft
        var columnGeo = new THREE.BoxGeometry(4, 50, 4);
        var column = makeMesh(columnGeo, 0x9a8a7a);
        column.position.set(X_OFFSET, 6 + 25, 0);
        addToScene(column);

        // Corinthian capital — slightly wider box
        var capitalGeo = new THREE.BoxGeometry(6, 5, 6);
        var capital = makeMesh(capitalGeo, 0x9a8a7a);
        capital.position.set(X_OFFSET, 6 + 50 + 2.5, 0);
        addToScene(capital);

        // Capital decorative layer
        var capitalTopGeo = new THREE.BoxGeometry(7, 2, 7);
        var capitalTop = makeMesh(capitalTopGeo, 0x8a7a6a);
        capitalTop.position.set(X_OFFSET, 6 + 50 + 5 + 1, 0);
        addToScene(capitalTop);

        // Admiral Nelson figure — body
        var nelsonBodyGeo = new THREE.BoxGeometry(2, 5, 2);
        var nelsonBody = makeMesh(nelsonBodyGeo, 0x2a2a3a);
        nelsonBody.position.set(X_OFFSET, 6 + 50 + 7 + 2.5, 0);
        addToScene(nelsonBody);

        // Admiral Nelson figure — head (sphere)
        var nelsonHeadGeo = new THREE.SphereGeometry(1, 8, 8);
        var nelsonHead = makeMesh(nelsonHeadGeo, 0xd4a87a);
        nelsonHead.position.set(X_OFFSET, 6 + 50 + 7 + 5 + 1, 0);
        addToScene(nelsonHead);

        // Nelson hat (cone)
        var hatGeo = new THREE.ConeGeometry(1.1, 1.5, 4);
        var hat = makeMesh(hatGeo, 0x1a1a2a);
        hat.position.set(X_OFFSET, 6 + 50 + 7 + 5 + 2.5, 0);
        addToScene(hat);
    }

    function buildLion(px, pz, flipZ) {
        // Lion body
        var bodyGeo = new THREE.BoxGeometry(4, 2, 6);
        var body = makeMesh(bodyGeo, 0xb8903a);
        body.position.set(px, 7, pz);
        addToScene(body);

        // Lion head
        var headGeo = new THREE.SphereGeometry(1.5, 8, 8);
        var head = makeMesh(headGeo, 0xc8a04a);
        var headZ = pz + (flipZ ? -3.5 : 3.5);
        head.position.set(px, 8.5, headZ);
        addToScene(head);

        // Lion mane ring (slightly larger sphere, flattened via scale)
        var maneGeo = new THREE.SphereGeometry(2, 8, 8);
        var mane = makeMesh(maneGeo, 0xa07a2a);
        mane.position.set(px, 8.2, headZ);
        mane.scale.set(1, 0.7, 0.7);
        addToScene(mane);

        // Front left paw
        var paw1Geo = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 6);
        var paw1 = makeMesh(paw1Geo, 0xb8903a);
        paw1.rotation.x = Math.PI / 2;
        paw1.position.set(px - 1.2, 6.2, pz + (flipZ ? -2.5 : 2.5));
        addToScene(paw1);

        // Front right paw
        var paw2Geo = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 6);
        var paw2 = makeMesh(paw2Geo, 0xb8903a);
        paw2.rotation.x = Math.PI / 2;
        paw2.position.set(px + 1.2, 6.2, pz + (flipZ ? -2.5 : 2.5));
        addToScene(paw2);

        // Tail (thin box curving up)
        var tailGeo = new THREE.BoxGeometry(0.4, 3, 0.4);
        var tail = makeMesh(tailGeo, 0xb8903a);
        tail.position.set(px, 8, pz + (flipZ ? 3.2 : -3.2));
        tail.rotation.z = 0.3;
        addToScene(tail);
    }

    function buildLions() {
        // Four lions at base corners of column
        buildLion(X_OFFSET - 9, -9, false);   // SW
        buildLion(X_OFFSET + 9, -9, false);   // SE
        buildLion(X_OFFSET - 9, 9, true);     // NW
        buildLion(X_OFFSET + 9, 9, true);     // NE
    }

    function buildFountain(px, pz) {
        // Outer basin
        var basinGeo = new THREE.CylinderGeometry(8, 8.5, 1.5, 16);
        var basin = makeMesh(basinGeo, 0x7a9aaa);
        basin.position.set(px, 1.75, pz);
        addToScene(basin);

        // Inner basin water surface (flat cylinder)
        var waterGeo = new THREE.CylinderGeometry(7.5, 7.5, 0.3, 16);
        var water = makeMesh(waterGeo, 0x3a6a9a);
        water.position.set(px, 2.65, pz);
        addToScene(water);

        // Central column
        var centColGeo = new THREE.CylinderGeometry(0.8, 1.0, 5, 8);
        var centCol = makeMesh(centColGeo, 0x8a9aaa);
        centCol.position.set(px, 4.5, pz);
        addToScene(centCol);

        // Upper basin
        var upperBasinGeo = new THREE.CylinderGeometry(3, 3.2, 0.8, 12);
        var upperBasin = makeMesh(upperBasinGeo, 0x7a9aaa);
        upperBasin.position.set(px, 7.4, pz);
        addToScene(upperBasin);

        // Water jet suggestions — thin vertical boxes
        var jetOffsets = [
            [2.5, 0], [-2.5, 0], [0, 2.5], [0, -2.5],
            [1.8, 1.8], [-1.8, 1.8], [1.8, -1.8], [-1.8, -1.8]
        ];
        for (var i = 0; i < jetOffsets.length; i++) {
            var jx = jetOffsets[i][0];
            var jz = jetOffsets[i][1];
            var jetGeo = new THREE.BoxGeometry(0.15, 3, 0.15);
            var jet = makeMesh(jetGeo, 0xaaddef);
            jet.position.set(px + jx, 9.5, pz + jz);
            addToScene(jet);
        }
    }

    function buildFountains() {
        buildFountain(X_OFFSET - 30, 0);
        buildFountain(X_OFFSET + 30, 0);
    }

    function buildNationalGallery() {
        var gx = X_OFFSET;
        var gz = -80;

        // Main building body
        var mainBodyGeo = new THREE.BoxGeometry(120, 25, 40);
        var mainBody = makeMesh(mainBodyGeo, 0xe8e0d0);
        mainBody.position.set(gx, 12.5, gz);
        addToScene(mainBody);

        // Wide entrance steps (three tiers)
        var step1Geo = new THREE.BoxGeometry(60, 1.5, 6);
        var step1 = makeMesh(step1Geo, 0xd8d0c0);
        step1.position.set(gx, 0.75, gz + 22);
        addToScene(step1);

        var step2Geo = new THREE.BoxGeometry(56, 1.5, 4);
        var step2 = makeMesh(step2Geo, 0xd8d0c0);
        step2.position.set(gx, 2.25, gz + 19);
        addToScene(step2);

        var step3Geo = new THREE.BoxGeometry(52, 1.5, 4);
        var step3 = makeMesh(step3Geo, 0xd8d0c0);
        step3.position.set(gx, 3.75, gz + 16);
        addToScene(step3);

        // Portico entablature (horizontal beam above columns)
        var entablatureGeo = new THREE.BoxGeometry(64, 3, 4);
        var entablature = makeMesh(entablatureGeo, 0xe0d8c8);
        entablature.position.set(gx, 22, gz + 20.5);
        addToScene(entablature);

        // 14 portico columns
        var numCols = 14;
        var colSpacing = 64 / (numCols - 1);
        var colStartX = gx - 32;
        for (var c = 0; c < numCols; c++) {
            var colGeo = new THREE.CylinderGeometry(0.7, 0.8, 18, 8);
            var col = makeMesh(colGeo, 0xf0e8d8);
            col.position.set(colStartX + c * colSpacing, 9 + 4, gz + 20.5);
            addToScene(col);
        }

        // Pediment (triangular top) using a thin box angled — simplified as a flat box
        var pedimentGeo = new THREE.BoxGeometry(64, 0.5, 8);
        var pediment = makeMesh(pedimentGeo, 0xe0d8c8);
        pediment.position.set(gx, 25, gz + 20.5);
        addToScene(pediment);

        // Pediment triangle sides (two sloped boxes)
        var pedTriLGeo = new THREE.BoxGeometry(34, 4, 1);
        var pedTriL = makeMesh(pedTriLGeo, 0xe8e0d0);
        pedTriL.rotation.z = 0.25;
        pedTriL.position.set(gx - 17, 27, gz + 20.5);
        addToScene(pedTriL);

        var pedTriRGeo = new THREE.BoxGeometry(34, 4, 1);
        var pedTriR = makeMesh(pedTriRGeo, 0xe8e0d0);
        pedTriR.rotation.z = -0.25;
        pedTriR.position.set(gx + 17, 27, gz + 20.5);
        addToScene(pedTriR);

        // Central Wilkins dome
        var domeBaseGeo = new THREE.CylinderGeometry(8, 8, 4, 12);
        var domeBase = makeMesh(domeBaseGeo, 0xe8e0d0);
        domeBase.position.set(gx, 27, gz - 5);
        addToScene(domeBase);

        var domeSphereGeo = new THREE.SphereGeometry(8, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var domeSphere = makeMesh(domeSphereGeo, 0xe0d8c8);
        domeSphere.position.set(gx, 29, gz - 5);
        addToScene(domeSphere);

        // Dome lantern
        var lanternGeo = new THREE.CylinderGeometry(2, 2.5, 4, 8);
        var lantern = makeMesh(lanternGeo, 0xe8e0d0);
        lantern.position.set(gx, 37, gz - 5);
        addToScene(lantern);

        var lanternTopGeo = new THREE.ConeGeometry(2, 3, 8);
        var lanternTop = makeMesh(lanternTopGeo, 0xd8d0c0);
        lanternTop.position.set(gx, 41.5, gz - 5);
        addToScene(lanternTop);

        // Left flanking wing
        var leftWingGeo = new THREE.BoxGeometry(30, 20, 30);
        var leftWing = makeMesh(leftWingGeo, 0xe8e0d0);
        leftWing.position.set(gx - 75, 10, gz - 5);
        addToScene(leftWing);

        // Right flanking wing
        var rightWingGeo = new THREE.BoxGeometry(30, 20, 30);
        var rightWing = makeMesh(rightWingGeo, 0xe8e0d0);
        rightWing.position.set(gx + 75, 10, gz - 5);
        addToScene(rightWing);

        // Wing columns — left wing
        for (var lc = 0; lc < 4; lc++) {
            var lcGeo = new THREE.CylinderGeometry(0.6, 0.7, 15, 8);
            var lcMesh = makeMesh(lcGeo, 0xf0e8d8);
            lcMesh.position.set(gx - 90 + lc * 3.5, 7.5 + 4, gz + 15);
            addToScene(lcMesh);
        }

        // Wing columns — right wing
        for (var rc = 0; rc < 4; rc++) {
            var rcGeo = new THREE.CylinderGeometry(0.6, 0.7, 15, 8);
            var rcMesh = makeMesh(rcGeo, 0xf0e8d8);
            rcMesh.position.set(gx + 76 + rc * 3.5, 7.5 + 4, gz + 15);
            addToScene(rcMesh);
        }
    }

    function buildFourthPlinth() {
        // Fourth plinth — NW corner of square
        var px = X_OFFSET - 20;
        var pz = 25;

        // Plinth base
        var plinthGeo = new THREE.BoxGeometry(6, 4, 6);
        var plinth = makeMesh(plinthGeo, 0x9a8a7a);
        plinth.position.set(px, 2, pz);
        addToScene(plinth);

        // Current artwork — abstract sphere
        var artSphereGeo = new THREE.SphereGeometry(2.5, 12, 12);
        var artSphere = makeMesh(artSphereGeo, 0xd4c87a);
        artSphere.position.set(px, 6.5, pz);
        addToScene(artSphere);

        // Abstract art detail — smaller orbiting sphere
        var orbitGeo = new THREE.SphereGeometry(0.8, 8, 8);
        var orbit = makeMesh(orbitGeo, 0x7ad4c8);
        orbit.position.set(px + 3, 8, pz);
        addToScene(orbit);

        // Vertical accent rod on artwork
        var rodGeo = new THREE.BoxGeometry(0.3, 4, 0.3);
        var rod = makeMesh(rodGeo, 0xe8e8e8);
        rod.position.set(px, 11, pz);
        addToScene(rod);
    }

    function buildSquareGround() {
        // Main square paving
        var squareGeo = new THREE.BoxGeometry(180, 0.5, 120);
        var square = makeMesh(squareGeo, 0xb0a898);
        square.position.set(X_OFFSET, 0.25, 0);
        addToScene(square);

        // Road surround — north
        var roadNGeo = new THREE.BoxGeometry(200, 0.3, 20);
        var roadN = makeMesh(roadNGeo, 0x4a4a4a);
        roadN.position.set(X_OFFSET, 0.15, -75);
        addToScene(roadN);

        // Road surround — south
        var roadSGeo = new THREE.BoxGeometry(200, 0.3, 20);
        var roadS = makeMesh(roadSGeo, 0x4a4a4a);
        roadS.position.set(X_OFFSET, 0.15, 75);
        addToScene(roadS);
    }

    function build() {
        buildSquareGround();
        buildNelsonsColumn();
        buildLions();
        buildFountains();
        buildNationalGallery();
        buildFourthPlinth();
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
