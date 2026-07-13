window.BreconBeacons = (function() {
    'use strict';

    var WORLD_X = 3460;
    var WORLD_Z = 2200;

    function buildPenYFan(scene) {
        var lowerMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
        var upperMat = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });

        var lowerGeo = new THREE.BoxGeometry(16, 12, 10);
        var lowerMesh = new THREE.Mesh(lowerGeo, lowerMat);
        lowerMesh.position.set(WORLD_X + 0, 6, WORLD_Z - 300);
        scene.add(lowerMesh);

        var upperGeo = new THREE.BoxGeometry(20, 4, 12);
        var upperMesh = new THREE.Mesh(upperGeo, upperMat);
        upperMesh.position.set(WORLD_X + 0, 14, WORLD_Z - 300);
        scene.add(upperMesh);
    }

    function buildBreconCathedral(scene) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });

        var navGeo = new THREE.BoxGeometry(24, 12, 10);
        var navMesh = new THREE.Mesh(navGeo, stoneMat);
        navMesh.position.set(WORLD_X + 80, 6, WORLD_Z + 50);
        scene.add(navMesh);

        var towerGeo = new THREE.BoxGeometry(8, 20, 8);
        var towerMesh = new THREE.Mesh(towerGeo, stoneMat);
        towerMesh.position.set(WORLD_X + 96, 10, WORLD_Z + 50);
        scene.add(towerMesh);

        var graveGeo = new THREE.BoxGeometry(2, 1, 0.5);
        var graveMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var graveOffsets = [
            [-8, 0, 10],
            [-5, 0, 10],
            [-2, 0, 10],
            [-8, 0, 14],
            [-5, 0, 14]
        ];
        for (var i = 0; i < graveOffsets.length; i++) {
            var graveMesh = new THREE.Mesh(graveGeo, graveMat);
            graveMesh.position.set(
                WORLD_X + 80 + graveOffsets[i][0],
                0.5,
                WORLD_Z + 50 + graveOffsets[i][2]
            );
            scene.add(graveMesh);
        }
    }

    function buildPontneddfechanWaterfalls(scene) {
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });
        var sprayMat = new THREE.MeshLambertMaterial({ color: 0xE0E8F0, transparent: true, opacity: 0.7 });

        var steps = [
            [0, 2, 0, 8, 4, 6],
            [0, 6, -6, 7, 4, 5],
            [0, 10, -12, 6, 4, 5],
            [0, 14, -18, 5, 4, 4]
        ];
        for (var i = 0; i < steps.length; i++) {
            var s = steps[i];
            var stepGeo = new THREE.BoxGeometry(s[3], s[4], s[5]);
            var stepMesh = new THREE.Mesh(stepGeo, rockMat);
            stepMesh.position.set(WORLD_X + 160 + s[0], s[1], WORLD_Z + 100 + s[2]);
            scene.add(stepMesh);
        }

        var sprayPositions = [
            [0, 4, 0],
            [0, 8, -6],
            [0, 12, -12],
            [0, 16, -18]
        ];
        for (var j = 0; j < sprayPositions.length; j++) {
            var sp = sprayPositions[j];
            var sprayGeo = new THREE.SphereGeometry(1.5, 6, 6);
            var sprayMesh = new THREE.Mesh(sprayGeo, sprayMat);
            sprayMesh.position.set(WORLD_X + 160 + sp[0], sp[1], WORLD_Z + 100 + sp[2]);
            scene.add(sprayMesh);
        }

        var gorgeLeft = new THREE.BoxGeometry(4, 14, 30);
        var gorgeRight = new THREE.BoxGeometry(4, 14, 30);
        var gorgeMat = new THREE.MeshLambertMaterial({ color: 0x9A9A9A });
        var gorgeLeftMesh = new THREE.Mesh(gorgeLeft, gorgeMat);
        gorgeLeftMesh.position.set(WORLD_X + 150, 7, WORLD_Z + 91);
        scene.add(gorgeLeftMesh);
        var gorgeRightMesh = new THREE.Mesh(gorgeRight, gorgeMat);
        gorgeRightMesh.position.set(WORLD_X + 170, 7, WORLD_Z + 91);
        scene.add(gorgeRightMesh);
    }

    function buildSASCairn(scene) {
        var cairnMat = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });

        var cairnLayers = [
            [0, 1, 0, 3.0, 2, 3.0],
            [0, 3, 0, 2.2, 2, 2.2],
            [0, 5, 0, 1.4, 2, 1.4],
            [0, 7, 0, 0.7, 2, 0.7]
        ];
        for (var i = 0; i < cairnLayers.length; i++) {
            var c = cairnLayers[i];
            var layerGeo = new THREE.BoxGeometry(c[3], c[4], c[5]);
            var layerMesh = new THREE.Mesh(layerGeo, cairnMat);
            layerMesh.position.set(WORLD_X - 120 + c[0], c[1], WORLD_Z - 200 + c[2]);
            scene.add(layerMesh);
        }
    }

    function buildLlangorseLake(scene) {
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x2A5A8A });
        var crannogMat = new THREE.MeshLambertMaterial({ color: 0x6A5A40 });

        var lakeGeo = new THREE.BoxGeometry(120, 1, 80);
        var lakeMesh = new THREE.Mesh(lakeGeo, waterMat);
        lakeMesh.position.set(WORLD_X + 260, 0, WORLD_Z + 180);
        scene.add(lakeMesh);

        var crannogBaseGeo = new THREE.BoxGeometry(14, 1.5, 14);
        var crannogBaseMesh = new THREE.Mesh(crannogBaseGeo, crannogMat);
        crannogBaseMesh.position.set(WORLD_X + 260, 1.25, WORLD_Z + 180);
        scene.add(crannogBaseMesh);

        var crannogHutGeo = new THREE.BoxGeometry(8, 4, 8);
        var crannogHutMesh = new THREE.Mesh(crannogHutGeo, crannogMat);
        crannogHutMesh.position.set(WORLD_X + 260, 4, WORLD_Z + 180);
        scene.add(crannogHutMesh);

        var roofGeo = new THREE.ConeGeometry(6, 3, 4);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(WORLD_X + 260, 7.5, WORLD_Z + 180);
        scene.add(roofMesh);
    }

    function buildAbergavennyCastle(scene) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x7A6A58 });

        var hillGeo = new THREE.BoxGeometry(30, 8, 30);
        var hillMesh = new THREE.Mesh(hillGeo, darkStoneMat);
        hillMesh.position.set(WORLD_X - 200, 4, WORLD_Z + 120);
        scene.add(hillMesh);

        var keepGeo = new THREE.BoxGeometry(14, 8, 10);
        var keepMesh = new THREE.Mesh(keepGeo, stoneMat);
        keepMesh.position.set(WORLD_X - 200, 12, WORLD_Z + 120);
        scene.add(keepMesh);

        var towerAGeo = new THREE.CylinderGeometry(3, 3.5, 12, 8);
        var towerAMesh = new THREE.Mesh(towerAGeo, stoneMat);
        towerAMesh.position.set(WORLD_X - 208, 14, WORLD_Z + 116);
        scene.add(towerAMesh);

        var towerBGeo = new THREE.CylinderGeometry(3, 3.5, 12, 8);
        var towerBMesh = new THREE.Mesh(towerBGeo, stoneMat);
        towerBMesh.position.set(WORLD_X - 192, 14, WORLD_Z + 116);
        scene.add(towerBMesh);

        var wallGeo = new THREE.BoxGeometry(22, 6, 2);
        var wallMesh = new THREE.Mesh(wallGeo, stoneMat);
        wallMesh.position.set(WORLD_X - 200, 11, WORLD_Z + 112);
        scene.add(wallMesh);

        var wallRearGeo = new THREE.BoxGeometry(22, 6, 2);
        var wallRearMesh = new THREE.Mesh(wallRearGeo, stoneMat);
        wallRearMesh.position.set(WORLD_X - 200, 11, WORLD_Z + 128);
        scene.add(wallRearMesh);
    }

    function buildMountainRidge(scene) {
        var ridgeMat = new THREE.MeshLambertMaterial({ color: 0x4A3D30 });
        var ridgeSegments = [
            [-60, 5, -260, 30, 10, 20],
            [0, 5, -280, 28, 12, 18],
            [60, 5, -260, 32, 10, 22],
            [120, 5, -240, 26, 8, 20],
            [-120, 5, -240, 24, 8, 18]
        ];
        for (var i = 0; i < ridgeSegments.length; i++) {
            var r = ridgeSegments[i];
            var ridgeGeo = new THREE.BoxGeometry(r[3], r[4], r[5]);
            var ridgeMesh = new THREE.Mesh(ridgeGeo, ridgeMat);
            ridgeMesh.position.set(WORLD_X + r[0], r[1], WORLD_Z + r[2]);
            scene.add(ridgeMesh);
        }
    }

    function buildForestCover(scene) {
        var trunkMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var canopyMat = new THREE.MeshLambertMaterial({ color: 0x2D5A27 });

        var treePositions = [
            [40, 0, 60],
            [55, 0, 80],
            [30, 0, 90],
            [70, 0, 70],
            [-40, 0, 80],
            [-55, 0, 60],
            [200, 0, -80],
            [220, 0, -60],
            [210, 0, -100]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var tp = treePositions[i];
            var trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 6);
            var trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
            trunkMesh.position.set(WORLD_X + tp[0], 2, WORLD_Z + tp[1]);
            scene.add(trunkMesh);

            var canopyGeo = new THREE.SphereGeometry(3, 6, 6);
            var canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
            canopyMesh.position.set(WORLD_X + tp[0], 7, WORLD_Z + tp[1]);
            scene.add(canopyMesh);
        }
    }

    function buildHeathland(scene) {
        var heathMat = new THREE.MeshLambertMaterial({ color: 0x6B4E3D });
        var moorMat = new THREE.MeshLambertMaterial({ color: 0x5A6B3A });

        var heathPatches = [
            [-80, 0, -100, 40, 1, 30],
            [40, 0, -150, 35, 1, 25],
            [-20, 0, 150, 50, 1, 35],
            [100, 0, 80, 45, 1, 40],
            [-100, 0, 50, 38, 1, 28]
        ];
        for (var i = 0; i < heathPatches.length; i++) {
            var h = heathPatches[i];
            var mat = (i % 2 === 0) ? heathMat : moorMat;
            var heathGeo = new THREE.BoxGeometry(h[3], h[4], h[5]);
            var heathMesh = new THREE.Mesh(heathGeo, mat);
            heathMesh.position.set(WORLD_X + h[0], h[1], WORLD_Z + h[2]);
            scene.add(heathMesh);
        }
    }

    function buildEdgeMarkers(scene) {
        var markerMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var markerPositions = [
            [300, 0, 300],
            [-300, 0, 300],
            [300, 0, -300],
            [-300, 0, -300],
            [0, 0, 350],
            [0, 0, -350]
        ];
        for (var i = 0; i < markerPositions.length; i++) {
            var mp = markerPositions[i];
            var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
            var postMesh = new THREE.Mesh(postGeo, markerMat);
            postMesh.position.set(WORLD_X + mp[0], 1.5, WORLD_Z + mp[1]);
            scene.add(postMesh);
        }
    }

    function create(scene) {
        buildPenYFan(scene);
        buildBreconCathedral(scene);
        buildPontneddfechanWaterfalls(scene);
        buildSASCairn(scene);
        buildLlangorseLake(scene);
        buildAbergavennyCastle(scene);
        buildMountainRidge(scene);
        buildForestCover(scene);
        buildHeathland(scene);
        buildEdgeMarkers(scene);
    }

    return {
        create: create
    };
}());
