window.CryptKeep = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var torchFlames = [];
    var fogClusters = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        torchFlames = [];
        fogClusters = [];
        buildCrypt();
        buildCatacombs();
        buildFortification();
        buildDecoration();
        buildHazards();
        buildSarcophagi();
        buildWeapons();
        buildAlcoves();
        buildEscape();
        buildAdornments();
        buildVaults();
        buildTreasure();
        buildArmoury();
        buildStatues();
        buildChapel();
        setupLighting();
    }

    function buildCrypt() {
        var stoneGray = 0x4a4a4a;
        var darkStone = 0x2a2a2a;

        var outerBox = new THREE.BoxGeometry(60, 50, 80);
        var outerMat = new THREE.MeshLambertMaterial({ color: darkStone });
        var outerMesh = new THREE.Mesh(outerBox, outerMat);
        outerMesh.position.set(0, 15, 0);
        scene.add(outerMesh);
        objects.push(outerMesh);

        var innerBox = new THREE.BoxGeometry(55, 45, 75);
        var innerMat = new THREE.MeshLambertMaterial({ color: stoneGray });
        var innerMesh = new THREE.Mesh(innerBox, innerMat);
        innerMesh.position.set(0, 15, 0);
        scene.add(innerMesh);
        objects.push(innerMesh);

        var floorBox = new THREE.BoxGeometry(60, 2, 80);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var floorMesh = new THREE.Mesh(floorBox, floorMat);
        floorMesh.position.set(0, 0, 0);
        scene.add(floorMesh);
        objects.push(floorMesh);

        var ceilingBox = new THREE.BoxGeometry(60, 2, 80);
        var ceilingMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var ceilingMesh = new THREE.Mesh(ceilingBox, ceilingMat);
        ceilingMesh.position.set(0, 48, 0);
        scene.add(ceilingMesh);
        objects.push(ceilingMesh);

        for (var i = 0; i < 10; i++) {
            var wallTile = new THREE.BoxGeometry(5, 6, 0.8);
            var tileMat = new THREE.MeshLambertMaterial({ color: 0x353535 });
            var tileMesh = new THREE.Mesh(wallTile, tileMat);
            tileMesh.position.set(-28, 8 + (i % 2) * 8, -35 + i * 7);
            scene.add(tileMesh);
            objects.push(tileMesh);
        }

        for (var i = 0; i < 8; i++) {
            var wallTile2 = new THREE.BoxGeometry(5, 6, 0.8);
            var tileMat2 = new THREE.MeshLambertMaterial({ color: 0x353535 });
            var tileMesh2 = new THREE.Mesh(wallTile2, tileMat2);
            tileMesh2.position.set(28, 8 + (i % 2) * 8, -30 + i * 8);
            scene.add(tileMesh2);
            objects.push(tileMesh2);
        }
    }

    function buildCatacombs() {
        var stoneGray = 0x4a4a4a;
        var darkStone = 0x3a3a3a;

        var corridor1 = new THREE.BoxGeometry(8, 12, 40);
        var corridorMat = new THREE.MeshLambertMaterial({ color: stoneGray });
        var corridorMesh1 = new THREE.Mesh(corridor1, corridorMat);
        corridorMesh1.position.set(-20, 10, 0);
        scene.add(corridorMesh1);
        objects.push(corridorMesh1);

        var archCeil1 = new THREE.CylinderGeometry(4, 4, 40, 8);
        var archMat = new THREE.MeshLambertMaterial({ color: darkStone });
        var archMesh1 = new THREE.Mesh(archCeil1, archMat);
        archMesh1.rotationZ = Math.PI / 2;
        archMesh1.position.set(-20, 18, 0);
        scene.add(archMesh1);
        objects.push(archMesh1);

        var corridor2 = new THREE.BoxGeometry(8, 12, 40);
        var corridorMesh2 = new THREE.Mesh(corridor2, corridorMat);
        corridorMesh2.position.set(20, 10, 0);
        scene.add(corridorMesh2);
        objects.push(corridorMesh2);

        var archMesh2 = new THREE.Mesh(archCeil1, archMat);
        archMesh2.rotationZ = Math.PI / 2;
        archMesh2.position.set(20, 18, 0);
        scene.add(archMesh2);
        objects.push(archMesh2);

        var corridor3 = new THREE.BoxGeometry(40, 12, 8);
        var corridorMesh3 = new THREE.Mesh(corridor3, corridorMat);
        corridorMesh3.position.set(0, 10, -30);
        scene.add(corridorMesh3);
        objects.push(corridorMesh3);

        var archMesh3 = new THREE.Mesh(archCeil1, archMat);
        archMesh3.rotationX = Math.PI / 2;
        archMesh3.position.set(0, 18, -30);
        scene.add(archMesh3);
        objects.push(archMesh3);

        var corridor4 = new THREE.BoxGeometry(40, 12, 8);
        var corridorMesh4 = new THREE.Mesh(corridor4, corridorMat);
        corridorMesh4.position.set(0, 10, 30);
        scene.add(corridorMesh4);
        objects.push(corridorMesh4);

        var archMesh4 = new THREE.Mesh(archCeil1, archMat);
        archMesh4.rotationX = Math.PI / 2;
        archMesh4.position.set(0, 18, 30);
        scene.add(archMesh4);
        objects.push(archMesh4);

        for (var i = 0; i < 5; i++) {
            var sideCorr = new THREE.BoxGeometry(6, 10, 12);
            var sideCorrMesh = new THREE.Mesh(sideCorr, corridorMat);
            sideCorrMesh.position.set(-28, 9, -15 + i * 10);
            scene.add(sideCorrMesh);
            objects.push(sideCorrMesh);

            var sideArch = new THREE.CylinderGeometry(3, 3, 12, 6);
            var sideArchMesh = new THREE.Mesh(sideArch, archMat);
            sideArchMesh.rotationZ = Math.PI / 2;
            sideArchMesh.position.set(-28, 16, -15 + i * 10);
            scene.add(sideArchMesh);
            objects.push(sideArchMesh);
        }

        for (var i = 0; i < 4; i++) {
            var sideCorr2 = new THREE.BoxGeometry(6, 10, 12);
            var sideCorrMesh2 = new THREE.Mesh(sideCorr2, corridorMat);
            sideCorrMesh2.position.set(28, 9, -10 + i * 12);
            scene.add(sideCorrMesh2);
            objects.push(sideCorrMesh2);

            var sideArchMesh2 = new THREE.Mesh(sideArch, archMat);
            sideArchMesh2.rotationZ = Math.PI / 2;
            sideArchMesh2.position.set(28, 16, -10 + i * 12);
            scene.add(sideArchMesh2);
            objects.push(sideArchMesh2);
        }
    }

    function buildFortification() {
        var boneWhite = 0xd0d0d0;
        var darkGreen = 0x1a3a1a;

        var gateFrame1 = new THREE.BoxGeometry(1, 10, 0.5);
        var gateMat = new THREE.MeshLambertMaterial({ color: darkGreen });
        var gateFrameL = new THREE.Mesh(gateFrame1, gateMat);
        gateFrameL.position.set(-4, 10, -35);
        scene.add(gateFrameL);
        objects.push(gateFrameL);

        var gateFrameR = new THREE.Mesh(gateFrame1, gateMat);
        gateFrameR.position.set(4, 10, -35);
        scene.add(gateFrameR);
        objects.push(gateFrameR);

        var gateFrameT = new THREE.BoxGeometry(8.5, 1, 0.5);
        var gateFrameTop = new THREE.Mesh(gateFrameT, gateMat);
        gateFrameTop.position.set(0, 15.5, -35);
        scene.add(gateFrameTop);
        objects.push(gateFrameTop);

        var gateFrameB = new THREE.BoxGeometry(8.5, 1, 0.5);
        var gateFrameBot = new THREE.Mesh(gateFrameB, gateMat);
        gateFrameBot.position.set(0, 4.5, -35);
        scene.add(gateFrameBot);
        objects.push(gateFrameBot);

        var barPoints = [];
        for (var i = 0; i < 12; i++) {
            barPoints.push(new THREE.Vector3(-3.8 + i * 0.7, 5, -35));
            barPoints.push(new THREE.Vector3(-3.8 + i * 0.7, 15, -35));
        }
        var barGeom = new THREE.BufferGeometry();
        barGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(barPoints.flatMap(p => [p.x, p.y, p.z])), 3));
        var barMat = new THREE.LineBasicMaterial({ color: darkGreen, linewidth: 2 });
        var barLines = new THREE.LineSegments(barGeom, barMat);
        scene.add(barLines);
        objects.push(barLines);

        var doorBox = new THREE.BoxGeometry(7, 8, 0.3);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var doorMesh = new THREE.Mesh(doorBox, doorMat);
        doorMesh.position.set(0, 9, -34.8);
        scene.add(doorMesh);
        objects.push(doorMesh);

        for (var i = 0; i < 4; i++) {
            var bulletScar = new THREE.SphereGeometry(0.3, 4, 4);
            var scarMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var scarMesh = new THREE.Mesh(bulletScar, scarMat);
            scarMesh.position.set(-2 + i * 1.5, 8 + i, -34.5);
            scene.add(scarMesh);
            objects.push(scarMesh);
        }
    }

    function buildDecoration() {
        var boneWhite = 0xd0d0d0;
        var stoneGray = 0x4a4a4a;

        for (var i = 0; i < 10; i++) {
            var pillarGeom = new THREE.CylinderGeometry(1.5, 1.5, 30, 8);
            var pillarMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var pillarMesh = new THREE.Mesh(pillarGeom, pillarMat);
            pillarMesh.position.set(-20 + i * 5, 15, -20 + (i % 2) * 15);
            scene.add(pillarMesh);
            objects.push(pillarMesh);

            var pillarBase = new THREE.CylinderGeometry(2, 2, 0.8, 8);
            var baseMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var baseMesh = new THREE.Mesh(pillarBase, baseMat);
            baseMesh.position.set(-20 + i * 5, 0.5, -20 + (i % 2) * 15);
            scene.add(baseMesh);
            objects.push(baseMesh);

            var pillarCap = new THREE.CylinderGeometry(2, 2, 0.8, 8);
            var capMesh = new THREE.Mesh(pillarCap, baseMat);
            capMesh.position.set(-20 + i * 5, 29.5, -20 + (i % 2) * 15);
            scene.add(capMesh);
            objects.push(capMesh);
        }

        for (var i = 0; i < 6; i++) {
            var torchBracket = new THREE.CylinderGeometry(0.5, 0.5, 2, 6);
            var torchMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var torchMesh = new THREE.Mesh(torchBracket, torchMat);
            torchMesh.position.set(-24 + i * 10, 20, 25);
            scene.add(torchMesh);
            objects.push(torchMesh);

            var flameGeom = new THREE.SphereGeometry(0.8, 6, 6);
            var flameMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
            var flameMesh = new THREE.Mesh(flameGeom, flameMat);
            flameMesh.position.set(-24 + i * 10, 22, 25);
            scene.add(flameMesh);
            objects.push(flameMesh);
            torchFlames.push({ mesh: flameMesh, originalScale: 0.8, offset: Math.random() * Math.PI * 2 });
        }

        for (var i = 0; i < 6; i++) {
            var torchBracket2 = new THREE.CylinderGeometry(0.5, 0.5, 2, 6);
            var torchMat2 = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var torchMesh2 = new THREE.Mesh(torchBracket2, torchMat2);
            torchMesh2.position.set(-24 + i * 10, 20, -25);
            scene.add(torchMesh2);
            objects.push(torchMesh2);

            var flameGeom2 = new THREE.SphereGeometry(0.8, 6, 6);
            var flameMat2 = new THREE.MeshLambertMaterial({ color: 0xff6600 });
            var flameMesh2 = new THREE.Mesh(flameGeom2, flameMat2);
            flameMesh2.position.set(-24 + i * 10, 22, -25);
            scene.add(flameMesh2);
            objects.push(flameMesh2);
            torchFlames.push({ mesh: flameMesh2, originalScale: 0.8, offset: Math.random() * Math.PI * 2 });
        }
    }

    function buildHazards() {
        var boneWhite = 0xd0d0d0;
        var darkBone = 0x8b7355;

        for (var i = 0; i < 28; i++) {
            var skullGeom = new THREE.SphereGeometry(0.6, 8, 8);
            var skullMat = new THREE.MeshLambertMaterial({ color: boneWhite });
            var skullMesh = new THREE.Mesh(skullGeom, skullMat);
            var x = -22 + (i % 8) * 6;
            var z = -20 + Math.floor(i / 8) * 18;
            skullMesh.position.set(x, 2 + Math.random() * 2, z);
            scene.add(skullMesh);
            objects.push(skullMesh);
            fogClusters.push({ mesh: skullMesh, originalPos: skullMesh.position.clone(), baseOffset: i });
        }

        for (var i = 0; i < 22; i++) {
            var boneGeom = new THREE.SphereGeometry(0.4, 6, 6);
            var boneMat = new THREE.MeshLambertMaterial({ color: 0xf5f5dc });
            var boneMesh = new THREE.Mesh(boneGeom, boneMat);
            var x = -20 + (i % 11) * 4;
            var z = -14 + Math.floor(i / 11) * 28;
            boneMesh.position.set(x, 1, z);
            scene.add(boneMesh);
            objects.push(boneMesh);
        }

        for (var i = 0; i < 12; i++) {
            var fragmentGeom = new THREE.SphereGeometry(0.3, 4, 4);
            var fragMat = new THREE.MeshLambertMaterial({ color: darkBone });
            var fragMesh = new THREE.Mesh(fragmentGeom, fragMat);
            fragMesh.position.set(-12 + i * 4, 0.5, 0);
            scene.add(fragMesh);
            objects.push(fragMesh);
        }
    }

    function buildSarcophagi() {
        var stoneGray = 0x4a4a4a;
        var darkStone = 0x2a2a2a;
        var boneWhite = 0xd0d0d0;

        for (var i = 0; i < 8; i++) {
            var sarcBase = new THREE.BoxGeometry(3, 1.5, 7);
            var sarcMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var sarcBaseMesh = new THREE.Mesh(sarcBase, sarcMat);
            sarcBaseMesh.position.set(-22 + i * 6, 2, 15);
            scene.add(sarcBaseMesh);
            objects.push(sarcBaseMesh);

            var sarcLid = new THREE.BoxGeometry(3.2, 0.8, 7.2);
            var lidMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var sarcLidMesh = new THREE.Mesh(sarcLid, lidMat);
            sarcLidMesh.position.set(-22 + i * 6, 3.8, 15);
            scene.add(sarcLidMesh);
            objects.push(sarcLidMesh);

            var sarcDecor = new THREE.SphereGeometry(0.5, 4, 4);
            var decorMat = new THREE.MeshLambertMaterial({ color: boneWhite });
            var decorMesh = new THREE.Mesh(sarcDecor, decorMat);
            decorMesh.position.set(-22 + i * 6, 5, 15);
            scene.add(decorMesh);
            objects.push(decorMesh);
        }

        for (var i = 0; i < 6; i++) {
            var sarcBase2 = new THREE.BoxGeometry(3, 1.5, 7);
            var sarcMat2 = new THREE.MeshLambertMaterial({ color: stoneGray });
            var sarcBaseMesh2 = new THREE.Mesh(sarcBase2, sarcMat2);
            sarcBaseMesh2.position.set(-18 + i * 8, 2, -10);
            scene.add(sarcBaseMesh2);
            objects.push(sarcBaseMesh2);

            var sarcLid2 = new THREE.BoxGeometry(3.2, 0.8, 7.2);
            var lidMat2 = new THREE.MeshLambertMaterial({ color: darkStone });
            var sarcLidMesh2 = new THREE.Mesh(sarcLid2, lidMat2);
            sarcLidMesh2.position.set(-18 + i * 8, 3.8, -10);
            scene.add(sarcLidMesh2);
            objects.push(sarcLidMesh2);

            var decorMesh2 = new THREE.Mesh(sarcDecor, decorMat);
            decorMesh2.position.set(-18 + i * 8, 5, -10);
            scene.add(decorMesh2);
            objects.push(decorMesh2);
        }
    }

    function buildWeapons() {
        var darkGreen = 0x1a3a1a;
        var metalGray = 0x505050;
        var stoneGray = 0x4a4a4a;

        for (var i = 0; i < 10; i++) {
            var ammoBox = new THREE.BoxGeometry(2, 1.5, 2);
            var ammoMat = new THREE.MeshLambertMaterial({ color: darkGreen });
            var ammoMesh = new THREE.Mesh(ammoBox, ammoMat);
            ammoMesh.position.set(-20 + i * 4, 6, -20);
            scene.add(ammoMesh);
            objects.push(ammoMesh);

            var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
            var barrelMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var barrelMesh = new THREE.Mesh(barrelGeom, barrelMat);
            barrelMesh.rotationZ = Math.PI / 4;
            barrelMesh.position.set(-20 + i * 4, 7.5, -20);
            scene.add(barrelMesh);
            objects.push(barrelMesh);

            var crate = new THREE.BoxGeometry(2.2, 1.8, 2.2);
            var crateMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var crateMesh = new THREE.Mesh(crate, crateMat);
            crateMesh.position.set(-20 + i * 4, 10, -20);
            scene.add(crateMesh);
            objects.push(crateMesh);
        }

        for (var i = 0; i < 7; i++) {
            var ammoBox2 = new THREE.BoxGeometry(2, 1.5, 2);
            var ammoMat2 = new THREE.MeshLambertMaterial({ color: darkGreen });
            var ammoMesh2 = new THREE.Mesh(ammoBox2, ammoMat2);
            ammoMesh2.position.set(10 + i * 5, 6, 10);
            scene.add(ammoMesh2);
            objects.push(ammoMesh2);

            var barrelGeom2 = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
            var barrelMat2 = new THREE.MeshLambertMaterial({ color: metalGray });
            var barrelMesh2 = new THREE.Mesh(barrelGeom2, barrelMat2);
            barrelMesh2.rotationZ = Math.PI / 3;
            barrelMesh2.position.set(10 + i * 5, 7.5, 10);
            scene.add(barrelMesh2);
            objects.push(barrelMesh2);
        }
    }

    function buildAlcoves() {
        var stoneGray = 0x4a4a4a;
        var darkStone = 0x2a2a2a;

        for (var i = 0; i < 12; i++) {
            var niche = new THREE.BoxGeometry(3, 5, 1.5);
            var nicheMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var nicheMesh = new THREE.Mesh(niche, nicheMat);
            nicheMesh.position.set(-26 + (i % 2) * 52, 8 + i * 2.5, -22 + (i % 4) * 10);
            scene.add(nicheMesh);
            objects.push(nicheMesh);

            var sarcBase = new THREE.BoxGeometry(2.5, 1, 1);
            var sarcMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var sarcMesh = new THREE.Mesh(sarcBase, sarcMat);
            sarcMesh.position.set(-26 + (i % 2) * 52, 8.5 + i * 2.5, -22 + (i % 4) * 10);
            scene.add(sarcMesh);
            objects.push(sarcMesh);

            var sarcLid = new THREE.BoxGeometry(2.7, 0.5, 1.2);
            var lidMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var lidMesh = new THREE.Mesh(sarcLid, lidMat);
            lidMesh.position.set(-26 + (i % 2) * 52, 9.2 + i * 2.5, -22 + (i % 4) * 10);
            scene.add(lidMesh);
            objects.push(lidMesh);

            var scrollRack = new THREE.BoxGeometry(2, 0.3, 0.8);
            var rackMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var rackMesh = new THREE.Mesh(scrollRack, rackMat);
            rackMesh.position.set(-26 + (i % 2) * 52, 10 + i * 2.5, -22 + (i % 4) * 10);
            scene.add(rackMesh);
            objects.push(rackMesh);
        }
    }

    function buildEscape() {
        var stoneGray = 0x4a4a4a;
        var darkStone = 0x2a2a2a;

        var escapePassage = new THREE.BoxGeometry(4, 8, 25);
        var escapeMat = new THREE.MeshLambertMaterial({ color: stoneGray });
        var escapeMesh = new THREE.Mesh(escapePassage, escapeMat);
        escapeMesh.position.set(24, 10, -20);
        scene.add(escapeMesh);
        objects.push(escapeMesh);

        var escapeExit = new THREE.BoxGeometry(4, 8, 1.5);
        var exitMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var exitMesh = new THREE.Mesh(escapeExit, exitMat);
        exitMesh.position.set(24, 10, -32);
        scene.add(exitMesh);
        objects.push(exitMesh);

        for (var i = 0; i < 12; i++) {
            var supportCol = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
            var supportMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            var supportMesh = new THREE.Mesh(supportCol, supportMat);
            supportMesh.position.set(21 + i * 0.9, 10, -20);
            scene.add(supportMesh);
            objects.push(supportMesh);
        }

        for (var i = 0; i < 8; i++) {
            var braceGeom = new THREE.BoxGeometry(4.5, 0.5, 1);
            var braceMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var braceMesh = new THREE.Mesh(braceGeom, braceMat);
            braceMesh.position.set(24, 3.5 + i * 1.3, -20);
            scene.add(braceMesh);
            objects.push(braceMesh);
        }

        for (var i = 0; i < 5; i++) {
            var rungs = new THREE.BoxGeometry(4.2, 0.3, 0.5);
            var rungMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var rungMesh = new THREE.Mesh(rungs, rungMat);
            rungMesh.position.set(24, 5 + i * 2, -20);
            scene.add(rungMesh);
            objects.push(rungMesh);
        }

        var exitSign = new THREE.BoxGeometry(2, 1, 0.3);
        var signMat = new THREE.MeshLambertMaterial({ color: 0xff3300 });
        var signMesh = new THREE.Mesh(exitSign, signMat);
        signMesh.position.set(24, 20, -32);
        scene.add(signMesh);
        objects.push(signMesh);
    }

    function buildAdornments() {
        var boneWhite = 0xd0d0d0;
        var stoneGray = 0x4a4a4a;
        var darkStone = 0x2a2a2a;

        for (var i = 0; i < 35; i++) {
            var ornament = new THREE.SphereGeometry(0.3, 4, 4);
            var ornMat = new THREE.MeshLambertMaterial({ color: boneWhite });
            var ornMesh = new THREE.Mesh(ornament, ornMat);
            ornMesh.position.set(-26 + (i % 9) * 6, 20 + Math.random() * 4, -32 + (i % 4) * 16);
            scene.add(ornMesh);
            objects.push(ornMesh);
        }

        for (var i = 0; i < 20; i++) {
            var coneGeom = new THREE.ConeGeometry(0.6, 1.5, 4);
            var coneMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var coneMesh = new THREE.Mesh(coneGeom, coneMat);
            coneMesh.position.set(-28 + i * 3.5, 4, 8);
            scene.add(coneMesh);
            objects.push(coneMesh);
        }

        for (var i = 0; i < 22; i++) {
            var sphGeom = new THREE.SphereGeometry(0.5, 5, 5);
            var sphMat = new THREE.MeshLambertMaterial({ color: 0x8a8a8a });
            var sphMesh = new THREE.Mesh(sphGeom, sphMat);
            sphMesh.position.set(-22 + i * 2.2, 5, -14);
            scene.add(sphMesh);
            objects.push(sphMesh);
        }

        for (var i = 0; i < 12; i++) {
            var miniCone = new THREE.ConeGeometry(0.4, 1, 4);
            var miniMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var miniMesh = new THREE.Mesh(miniCone, miniMat);
            miniMesh.position.set(-24 + i * 5, 25, 20);
            scene.add(miniMesh);
            objects.push(miniMesh);
        }

        for (var i = 0; i < 12; i++) {
            var finial = new THREE.ConeGeometry(0.3, 0.8, 3);
            var finialMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
            var finialMesh = new THREE.Mesh(finial, finialMat);
            finialMesh.position.set(-18 + i * 6, 28, -26);
            scene.add(finialMesh);
            objects.push(finialMesh);
        }
    }

    function buildVaults() {
        var darkStone = 0x2a2a2a;
        var metalGray = 0x505050;

        for (var i = 0; i < 8; i++) {
            var vaultBox = new THREE.BoxGeometry(6, 8, 4);
            var vaultMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var vaultMesh = new THREE.Mesh(vaultBox, vaultMat);
            vaultMesh.position.set(-18 + i * 8, 12, 22);
            scene.add(vaultMesh);
            objects.push(vaultMesh);

            var doorFrame = new THREE.BoxGeometry(5.5, 7.5, 0.5);
            var doorMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var doorMesh = new THREE.Mesh(doorFrame, doorMat);
            doorMesh.position.set(-18 + i * 8, 12, 24);
            scene.add(doorMesh);
            objects.push(doorMesh);

            var lock = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 6);
            var lockMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
            var lockMesh = new THREE.Mesh(lock, lockMat);
            lockMesh.rotationX = Math.PI / 2;
            lockMesh.position.set(-18 + i * 8, 12, 24.3);
            scene.add(lockMesh);
            objects.push(lockMesh);

            var handleCyl = new THREE.CylinderGeometry(0.2, 0.2, 2, 4);
            var handleMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
            var handleMesh = new THREE.Mesh(handleCyl, handleMat);
            handleMesh.rotationZ = Math.PI / 2;
            handleMesh.position.set(-18 + i * 8, 12, 23);
            scene.add(handleMesh);
            objects.push(handleMesh);
        }

        for (var i = 0; i < 10; i++) {
            var supportGeom = new THREE.CylinderGeometry(1, 1, 10, 6);
            var supportMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var supportMesh = new THREE.Mesh(supportGeom, supportMat);
            supportMesh.position.set(-22 + i * 6, 15, 25);
            scene.add(supportMesh);
            objects.push(supportMesh);

            var cornerBracket = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            var bracketMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var bracketMesh = new THREE.Mesh(cornerBracket, bracketMat);
            bracketMesh.position.set(-22 + i * 6, 20, 25);
            scene.add(bracketMesh);
            objects.push(bracketMesh);
        }
    }

    function buildTreasure() {
        var goldColor = 0xffd700;
        var silverColor = 0xc0c0c0;
        var copperColor = 0xb87333;

        for (var i = 0; i < 25; i++) {
            var coinGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 6);
            var coinMat = new THREE.MeshLambertMaterial({ color: goldColor });
            var coinMesh = new THREE.Mesh(coinGeom, coinMat);
            coinMesh.position.set(-18 + (i % 5) * 4, 5 + Math.floor(i / 5) * 1.2, -5);
            scene.add(coinMesh);
            objects.push(coinMesh);
        }

        for (var i = 0; i < 20; i++) {
            var gemGeom = new THREE.SphereGeometry(0.25, 4, 4);
            var gemMat = new THREE.MeshLambertMaterial({ color: silverColor });
            var gemMesh = new THREE.Mesh(gemGeom, gemMat);
            gemMesh.position.set(-14 + (i % 5) * 5, 4 + Math.floor(i / 5) * 1.5, 5);
            scene.add(gemMesh);
            objects.push(gemMesh);
        }

        for (var i = 0; i < 14; i++) {
            var treasureBox = new THREE.BoxGeometry(1, 0.8, 1.2);
            var treasureMat = new THREE.MeshLambertMaterial({ color: copperColor });
            var treasureMesh = new THREE.Mesh(treasureBox, treasureMat);
            treasureMesh.position.set(-12 + i * 2.5, 3, 15);
            scene.add(treasureMesh);
            objects.push(treasureMesh);
        }

        for (var i = 0; i < 12; i++) {
            var gobletGeom = new THREE.CylinderGeometry(0.4, 0.3, 1, 6);
            var gobletMat = new THREE.MeshLambertMaterial({ color: goldColor });
            var gobletMesh = new THREE.Mesh(gobletGeom, gobletMat);
            gobletMesh.position.set(6 + i * 3, 4, 5);
            scene.add(gobletMesh);
            objects.push(gobletMesh);
        }

        for (var i = 0; i < 8; i++) {
            var reliquaryBox = new THREE.BoxGeometry(2, 1.5, 2);
            var reliquaryMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            var reliquaryMesh = new THREE.Mesh(reliquaryBox, reliquaryMat);
            reliquaryMesh.position.set(-14 + i * 5.5, 6, -15);
            scene.add(reliquaryMesh);
            objects.push(reliquaryMesh);

            var reliquaryLid = new THREE.BoxGeometry(2.2, 0.6, 2.2);
            var lidMat = new THREE.MeshLambertMaterial({ color: goldColor });
            var lidMesh = new THREE.Mesh(reliquaryLid, lidMat);
            lidMesh.position.set(-14 + i * 5.5, 7.5, -15);
            scene.add(lidMesh);
            objects.push(lidMesh);
        }
    }

    function buildArmoury() {
        var metalGray = 0x505050;
        var darkGreen = 0x1a3a1a;
        var stoneGray = 0x4a4a4a;

        for (var i = 0; i < 10; i++) {
            var rackBox = new THREE.BoxGeometry(2, 6, 1);
            var rackMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var rackMesh = new THREE.Mesh(rackBox, rackMat);
            rackMesh.position.set(-22 + i * 5, 10, 30);
            scene.add(rackMesh);
            objects.push(rackMesh);

            var weaponHolder = new THREE.CylinderGeometry(0.3, 0.3, 5, 4);
            var weaponMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var weaponMesh = new THREE.Mesh(weaponHolder, weaponMat);
            weaponMesh.rotationZ = Math.PI / 6;
            weaponMesh.position.set(-22 + i * 5, 12, 30);
            scene.add(weaponMesh);
            objects.push(weaponMesh);
        }

        for (var i = 0; i < 8; i++) {
            var shieldBox = new THREE.SphereGeometry(1.2, 6, 6);
            var shieldMat = new THREE.MeshLambertMaterial({ color: darkGreen });
            var shieldMesh = new THREE.Mesh(shieldBox, shieldMat);
            shieldMesh.position.set(-18 + i * 6, 12, 32);
            scene.add(shieldMesh);
            objects.push(shieldMesh);
        }

        for (var i = 0; i < 6; i++) {
            var helmetBox = new THREE.SphereGeometry(0.9, 6, 6);
            var helmetMat = new THREE.MeshLambertMaterial({ color: metalGray });
            var helmetMesh = new THREE.Mesh(helmetBox, helmetMat);
            helmetMesh.position.set(-14 + i * 9, 16, 30);
            scene.add(helmetMesh);
            objects.push(helmetMesh);
        }
    }

    function buildStatues() {
        var stoneGray = 0x4a4a4a;
        var boneWhite = 0xd0d0d0;

        for (var i = 0; i < 6; i++) {
            var baseBox = new THREE.BoxGeometry(2, 0.5, 2);
            var baseMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var baseMesh = new THREE.Mesh(baseBox, baseMat);
            baseMesh.position.set(-22 + i * 9, 0.5, -28);
            scene.add(baseMesh);
            objects.push(baseMesh);

            var bodyBox = new THREE.BoxGeometry(1.5, 4, 1);
            var bodyMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var bodyMesh = new THREE.Mesh(bodyBox, bodyMat);
            bodyMesh.position.set(-22 + i * 9, 3, -28);
            scene.add(bodyMesh);
            objects.push(bodyMesh);

            var headGeom = new THREE.SphereGeometry(0.8, 6, 6);
            var headMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var headMesh = new THREE.Mesh(headGeom, headMat);
            headMesh.position.set(-22 + i * 9, 6.5, -28);
            scene.add(headMesh);
            objects.push(headMesh);

            var crownGeom = new THREE.ConeGeometry(0.6, 1.2, 4);
            var crownMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
            var crownMesh = new THREE.Mesh(crownGeom, crownMat);
            crownMesh.position.set(-22 + i * 9, 7.5, -28);
            scene.add(crownMesh);
            objects.push(crownMesh);
        }
    }

    function buildChapel() {
        var stoneGray = 0x4a4a4a;
        var darkStone = 0x2a2a2a;

        var chapelWall = new THREE.BoxGeometry(10, 15, 0.5);
        var chapelMat = new THREE.MeshLambertMaterial({ color: stoneGray });
        var chapelMesh = new THREE.Mesh(chapelWall, chapelMat);
        chapelMesh.position.set(-26, 12, 0);
        scene.add(chapelMesh);
        objects.push(chapelMesh);

        var altarBox = new THREE.BoxGeometry(3, 3, 3);
        var altarMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var altarMesh = new THREE.Mesh(altarBox, altarMat);
        altarMesh.position.set(-26, 3, -5);
        scene.add(altarMesh);
        objects.push(altarMesh);

        var crossBar1 = new THREE.BoxGeometry(0.5, 8, 0.5);
        var crossMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        var crossMesh1 = new THREE.Mesh(crossBar1, crossMat);
        crossMesh1.position.set(-26, 8, -7);
        scene.add(crossMesh1);
        objects.push(crossMesh1);

        var crossBar2 = new THREE.BoxGeometry(5, 0.5, 0.5);
        var crossMesh2 = new THREE.Mesh(crossBar2, crossMat);
        crossMesh2.position.set(-26, 6, -7);
        scene.add(crossMesh2);
        objects.push(crossMesh2);

        for (var i = 0; i < 6; i++) {
            var benchBox = new THREE.BoxGeometry(6, 1, 0.8);
            var benchMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var benchMesh = new THREE.Mesh(benchBox, benchMat);
            benchMesh.position.set(-26 + (i % 2) * 8, 2 + (i - i % 2) / 2 * 3, 8 - i * 2);
            scene.add(benchMesh);
            objects.push(benchMesh);
        }

        var cupola = new THREE.CylinderGeometry(3, 3, 2, 8);
        var cupolaMat = new THREE.MeshLambertMaterial({ color: darkStone });
        var cupolaMesh = new THREE.Mesh(cupola, cupolaMat);
        cupolaMesh.position.set(-26, 24, 0);
        scene.add(cupolaMesh);
        objects.push(cupolaMesh);

        var spire = new THREE.ConeGeometry(1.5, 4, 6);
        var spireMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        var spireMesh = new THREE.Mesh(spire, spireMat);
        spireMesh.position.set(-26, 27, 0);
        scene.add(spireMesh);
        objects.push(spireMesh);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var torchLight1 = new THREE.PointLight(0xff6600, 1.5, 30);
        torchLight1.position.set(-22, 22, 25);
        scene.add(torchLight1);
        lights.push(torchLight1);

        var torchLight2 = new THREE.PointLight(0xff6600, 1.5, 30);
        torchLight2.position.set(6, 22, 25);
        scene.add(torchLight2);
        lights.push(torchLight2);

        var torchLight3 = new THREE.PointLight(0xff6600, 1.5, 30);
        torchLight3.position.set(-22, 22, -25);
        scene.add(torchLight3);
        lights.push(torchLight3);

        var torchLight4 = new THREE.PointLight(0xff6600, 1.5, 30);
        torchLight4.position.set(6, 22, -25);
        scene.add(torchLight4);
        lights.push(torchLight4);

        var torchLight5 = new THREE.PointLight(0xff3300, 0.8, 20);
        torchLight5.position.set(20, 22, 25);
        scene.add(torchLight5);
        lights.push(torchLight5);

        var torchLight6 = new THREE.PointLight(0xff3300, 0.8, 20);
        torchLight6.position.set(20, 22, -25);
        scene.add(torchLight6);
        lights.push(torchLight6);

        var dirLight = new THREE.DirectionalLight(0x888888, 0.5);
        dirLight.position.set(10, 40, 10);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        var time = Date.now() * 0.001;

        for (var i = 0; i < torchFlames.length; i++) {
            var torch = torchFlames[i];
            var flicker = 0.8 + 0.2 * Math.sin(time * 3 + torch.offset);
            flicker += 0.1 * Math.random();
            torch.mesh.scale.set(flicker, flicker, flicker);
        }

        for (var i = 0; i < fogClusters.length; i++) {
            var fog = fogClusters[i];
            var drift = Math.sin(time * 0.3 + fog.baseOffset) * 0.5;
            var yDrift = Math.cos(time * 0.2 + fog.baseOffset * 0.7) * 0.3;
            fog.mesh.position.x = fog.originalPos.x + drift;
            fog.mesh.position.y = fog.originalPos.y + yDrift;
            fog.mesh.position.z = fog.originalPos.z + Math.sin(time * 0.4 + fog.baseOffset * 1.5) * 0.4;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        torchFlames = [];
        fogClusters = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
