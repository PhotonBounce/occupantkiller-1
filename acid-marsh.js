window.AcidMarsh = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animatedObjects = [];
    var bubblesArray = [];
    var glowPulseTime = 0;

    var ACID_YELLOW = 0xddff00;
    var TOXIC_LIME = 0x88ff11;
    var RUST_ORANGE = 0x8b4513;
    var DARK_ORANGE = 0x5c2e0f;
    var INDUSTRIAL_GRAY = 0x404040;
    var DARK_GRAY = 0x222222;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animatedObjects = [];
        bubblesArray = [];
        glowPulseTime = 0;

        buildMarshGround();
        buildAcidPools();
        buildCorrodedPipes();
        buildVehicleHusks();
        buildFactoryRuins();
        buildChemicalTrails();
        buildVegetation();
        buildBubbleClusters();
        buildMilitaryBridge();
        buildWarningBuoys();
        buildChemicalBarrels();
        setupLighting();
    }

    function buildMarshGround() {
        var groundGeom = new THREE.BoxGeometry(200, 2, 200);
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x1a1a0a });
        var ground = new THREE.Mesh(groundGeom, groundMat);
        ground.position.set(0, -2, 0);
        scene.add(ground);
        objects.push(ground);

        for (var i = 0; i < 25; i++) {
            var x = (Math.random() - 0.5) * 150;
            var z = (Math.random() - 0.5) * 150;
            var rockGeom = new THREE.BoxGeometry(Math.random() * 3 + 1, Math.random() * 2 + 0.5, Math.random() * 3 + 1);
            var rockMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
            var rock = new THREE.Mesh(rockGeom, rockMat);
            rock.position.set(x, 0, z);
            rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildAcidPools() {
        var poolPositions = [
            [-40, 0, -50],
            [40, 0, 50],
            [0, 0, 0],
            [-60, 0, 20],
            [60, 0, -30],
            [30, 0, -60],
            [-50, 0, 60]
        ];

        for (var p = 0; p < poolPositions.length; p++) {
            var pos = poolPositions[p];
            var poolWidth = Math.random() * 15 + 12;
            var poolDepth = Math.random() * 15 + 12;
            var poolGeom = new THREE.BoxGeometry(poolWidth, 0.8, poolDepth);
            var poolMat = new THREE.MeshLambertMaterial({ color: ACID_YELLOW, emissive: TOXIC_LIME, emissiveIntensity: 0.3 });
            var pool = new THREE.Mesh(poolGeom, poolMat);
            pool.position.set(pos[0], pos[1], pos[2]);
            scene.add(pool);
            objects.push(pool);

            for (var b = 0; b < 8; b++) {
                var bubGeom = new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 8, 8);
                var bubMat = new THREE.MeshLambertMaterial({ color: ACID_YELLOW, emissive: TOXIC_LIME, emissiveIntensity: 0.2 });
                var bubble = new THREE.Mesh(bubGeom, bubMat);
                bubble.position.set(
                    pos[0] + (Math.random() - 0.5) * poolWidth,
                    pos[1] + 0.5,
                    pos[2] + (Math.random() - 0.5) * poolDepth
                );
                bubble.startY = bubble.position.y;
                bubble.riseSpeed = Math.random() * 2 + 1;
                scene.add(bubble);
                objects.push(bubble);
                bubblesArray.push(bubble);
            }
        }
    }

    function buildCorrodedPipes() {
        var pipePositions = [
            [20, 1.5, -40],
            [-30, 1.5, 30],
            [50, 1.5, 20],
            [-50, 1.5, -30],
            [0, 1.5, 40],
            [40, 1.5, 0]
        ];

        for (var p = 0; p < pipePositions.length; p++) {
            var startX = pipePositions[p][0];
            var startY = pipePositions[p][1];
            var startZ = pipePositions[p][2];

            for (var s = 0; s < 6; s++) {
                var pipeGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 12);
                var pipeMat = new THREE.MeshLambertMaterial({ color: RUST_ORANGE });
                var pipe = new THREE.Mesh(pipeGeom, pipeMat);
                var offsetX = Math.cos(p * 0.5 + s * 0.3) * 10;
                var offsetZ = Math.sin(p * 0.5 + s * 0.3) * 10;
                pipe.position.set(startX + offsetX, startY, startZ + offsetZ);
                pipe.rotation.z = Math.random() * 0.5;
                scene.add(pipe);
                objects.push(pipe);

                if (Math.random() > 0.3) {
                    var holeGeom = new THREE.SphereGeometry(0.5, 6, 6);
                    var holeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
                    var hole = new THREE.Mesh(holeGeom, holeMat);
                    hole.position.set(pipe.position.x + 1, pipe.position.y, pipe.position.z);
                    scene.add(hole);
                    objects.push(hole);
                }
            }
        }
    }

    function buildVehicleHusks() {
        var huskPositions = [
            [-25, -0.5, -45],
            [35, -0.5, 25],
            [15, -0.5, -20]
        ];

        for (var h = 0; h < huskPositions.length; h++) {
            var pos = huskPositions[h];
            var huskGeom = new THREE.BoxGeometry(6, 1.5, 3);
            var huskMat = new THREE.MeshLambertMaterial({ color: DARK_ORANGE });
            var husk = new THREE.Mesh(huskGeom, huskMat);
            husk.position.set(pos[0], pos[1], pos[2]);
            husk.rotation.z = Math.random() * 0.3;
            scene.add(husk);
            objects.push(husk);

            for (var p = 0; p < 5; p++) {
                var pieceGeom = new THREE.BoxGeometry(Math.random() * 1.5 + 0.5, Math.random() * 1 + 0.3, Math.random() * 1 + 0.3);
                var pieceMat = new THREE.MeshLambertMaterial({ color: RUST_ORANGE });
                var piece = new THREE.Mesh(pieceGeom, pieceMat);
                piece.position.set(pos[0] + (Math.random() - 0.5) * 8, pos[1] + 1, pos[2] + (Math.random() - 0.5) * 5);
                piece.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                scene.add(piece);
                objects.push(piece);
            }
        }
    }

    function buildFactoryRuins() {
        var wallPositions = [
            [0, 0, -80],
            [80, 0, 0],
            [0, 0, 80],
            [-80, 0, 0]
        ];

        for (var w = 0; w < wallPositions.length; w++) {
            var pos = wallPositions[w];
            var wallGeom = new THREE.BoxGeometry(40, 12, 2);
            var wallMat = new THREE.MeshLambertMaterial({ color: INDUSTRIAL_GRAY });
            var wall = new THREE.Mesh(wallGeom, wallMat);
            wall.position.set(pos[0], pos[1] + 5, pos[2]);
            scene.add(wall);
            objects.push(wall);

            for (var g = 0; g < 8; g++) {
                var gapGeom = new THREE.BoxGeometry(3, 3, 2.5);
                var gapMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
                var gap = new THREE.Mesh(gapGeom, gapMat);
                gap.position.set(pos[0] - 15 + g * 5, pos[1] + 3, pos[2]);
                scene.add(gap);
                objects.push(gap);
            }
        }

        for (var c = 0; c < 20; c++) {
            var colGeom = new THREE.CylinderGeometry(1.2, 1.2, 10, 8);
            var colMat = new THREE.MeshLambertMaterial({ color: RUST_ORANGE });
            var column = new THREE.Mesh(colGeom, colMat);
            var colX = (Math.random() - 0.5) * 100;
            var colZ = (Math.random() - 0.5) * 100;
            column.position.set(colX, 4, colZ);
            scene.add(column);
            objects.push(column);
        }
    }

    function buildChemicalTrails() {
        var trailPaths = [
            { start: [-60, 0, -40], end: [60, 0, 40] },
            { start: [50, 0, -70], end: [-50, 0, -50] },
            { start: [-70, 0, 50], end: [20, 0, 70] }
        ];

        for (var t = 0; t < trailPaths.length; t++) {
            var path = trailPaths[t];
            var segmentCount = 15;
            for (var s = 0; s < segmentCount; s++) {
                var factor = s / segmentCount;
                var x = path.start[0] + (path.end[0] - path.start[0]) * factor;
                var z = path.start[2] + (path.end[2] - path.start[2]) * factor;
                var trailGeom = new THREE.BoxGeometry(1.5, 0.3, 8);
                var trailMat = new THREE.MeshLambertMaterial({ color: ACID_YELLOW, emissive: 0x66ff00, emissiveIntensity: 0.2 });
                var trail = new THREE.Mesh(trailGeom, trailMat);
                trail.position.set(x, 0.2, z);
                scene.add(trail);
                objects.push(trail);
            }
        }
    }

    function buildVegetation() {
        for (var v = 0; v < 30; v++) {
            var x = (Math.random() - 0.5) * 160;
            var z = (Math.random() - 0.5) * 160;
            var plantGeom = new THREE.CylinderGeometry(0.2, 0.15, 3, 6);
            var plantMat = new THREE.MeshLambertMaterial({ color: 0x3a5c2a });
            var plant = new THREE.Mesh(plantGeom, plantMat);
            plant.position.set(x, 1.5, z);
            scene.add(plant);
            objects.push(plant);

            var topGeom = new THREE.SphereGeometry(0.5, 8, 8);
            var topMat = new THREE.MeshLambertMaterial({ color: 0x4a7c3a });
            var top = new THREE.Mesh(topGeom, topMat);
            top.position.set(x, 3.5, z);
            scene.add(top);
            objects.push(top);
        }
    }

    function buildBubbleClusters() {
        var clusterPositions = [
            [-35, 1, -35],
            [45, 1, 45],
            [25, 1, -55],
            [-55, 1, 25]
        ];

        for (var c = 0; c < clusterPositions.length; c++) {
            var cpos = clusterPositions[c];
            for (var b = 0; b < 12; b++) {
                var bubGeom = new THREE.SphereGeometry(Math.random() * 0.4 + 0.2, 8, 8);
                var bubMat = new THREE.MeshLambertMaterial({ color: ACID_YELLOW, emissive: TOXIC_LIME, emissiveIntensity: 0.4 });
                var bubble = new THREE.Mesh(bubGeom, bubMat);
                bubble.position.set(
                    cpos[0] + (Math.random() - 0.5) * 8,
                    cpos[1] + (Math.random() - 0.5) * 6,
                    cpos[2] + (Math.random() - 0.5) * 8
                );
                bubble.startY = bubble.position.y;
                bubble.riseSpeed = Math.random() * 3 + 1.5;
                bubble.maxHeight = bubble.startY + 5;
                scene.add(bubble);
                objects.push(bubble);
                bubblesArray.push(bubble);
            }
        }
    }

    function buildMilitaryBridge() {
        var bridgeX = 0;
        var bridgeY = 2;
        var bridgeZ = -70;

        var mainBeamGeom = new THREE.BoxGeometry(50, 1, 4);
        var beamMat = new THREE.MeshLambertMaterial({ color: INDUSTRIAL_GRAY });
        var mainBeam = new THREE.Mesh(mainBeamGeom, beamMat);
        mainBeam.position.set(bridgeX, bridgeY, bridgeZ);
        scene.add(mainBeam);
        objects.push(mainBeam);

        for (var s = 0; s < 10; s++) {
            var sideX = bridgeX - 22 + s * 5;
            var railGeom = new THREE.BoxGeometry(1, 2, 1);
            var railMat = new THREE.MeshLambertMaterial({ color: RUST_ORANGE });
            var railLeft = new THREE.Mesh(railGeom, railMat);
            railLeft.position.set(sideX, bridgeY + 1.5, bridgeZ - 2.5);
            scene.add(railLeft);
            objects.push(railLeft);

            var railRight = new THREE.Mesh(railGeom, railMat);
            railRight.position.set(sideX, bridgeY + 1.5, bridgeZ + 2.5);
            scene.add(railRight);
            objects.push(railRight);
        }

        var supportGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
        var supportMat = new THREE.MeshLambertMaterial({ color: DARK_ORANGE });
        var supportLeft = new THREE.Mesh(supportGeom, supportMat);
        supportLeft.position.set(bridgeX - 25, bridgeY - 2, bridgeZ);
        scene.add(supportLeft);
        objects.push(supportLeft);

        var supportRight = new THREE.Mesh(supportGeom, supportMat);
        supportRight.position.set(bridgeX + 25, bridgeY - 2, bridgeZ);
        scene.add(supportRight);
        objects.push(supportRight);
    }

    function buildWarningBuoys() {
        var buoyPositions = [
            [-45, 0.5, -45],
            [45, 0.5, 45],
            [-35, 0.5, 35],
            [35, 0.5, -35],
            [0, 0.5, -60],
            [60, 0.5, 0]
        ];

        for (var b = 0; b < buoyPositions.length; b++) {
            var pos = buoyPositions[b];
            var sphereGeom = new THREE.SphereGeometry(0.7, 8, 8);
            var sphereMat = new THREE.MeshLambertMaterial({ color: ACID_YELLOW });
            var sphere = new THREE.Mesh(sphereGeom, sphereMat);
            sphere.position.set(pos[0], pos[1] + 0.7, pos[2]);
            scene.add(sphere);
            objects.push(sphere);

            var cylinderGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
            var cylinderMat = new THREE.MeshLambertMaterial({ color: RUST_ORANGE });
            var cylinder = new THREE.Mesh(cylinderGeom, cylinderMat);
            cylinder.position.set(pos[0], pos[1], pos[2]);
            scene.add(cylinder);
            objects.push(cylinder);
        }
    }

    function buildChemicalBarrels() {
        for (var b = 0; b < 15; b++) {
            var x = (Math.random() - 0.5) * 140;
            var z = (Math.random() - 0.5) * 140;
            var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 2, 12);
            var barrelMat = new THREE.MeshLambertMaterial({ color: ACID_YELLOW });
            var barrel = new THREE.Mesh(barrelGeom, barrelMat);
            barrel.position.set(x, 0.5, z);
            barrel.rotation.z = Math.random() * 0.3;
            scene.add(barrel);
            objects.push(barrel);

            var lidGeom = new THREE.CylinderGeometry(0.65, 0.6, 0.2, 12);
            var lidMat = new THREE.MeshLambertMaterial({ color: RUST_ORANGE });
            var lid = new THREE.Mesh(lidGeom, lidMat);
            lid.position.set(x, 1.6, z);
            scene.add(lid);
            objects.push(lid);

            var spillGeom = new THREE.BoxGeometry(Math.random() * 3 + 1, 0.1, Math.random() * 4 + 1);
            var spillMat = new THREE.MeshLambertMaterial({ color: TOXIC_LIME });
            var spill = new THREE.Mesh(spillGeom, spillMat);
            spill.position.set(x + Math.random() * 3 - 1.5, 0.05, z + Math.random() * 3 - 1.5);
            scene.add(spill);
            objects.push(spill);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var acidLight = new THREE.PointLight(ACID_YELLOW, 1.5, 60);
        acidLight.position.set(-40, 5, -50);
        scene.add(acidLight);
        lights.push(acidLight);
        animatedObjects.push({ light: acidLight, type: 'point' });

        var acidLight2 = new THREE.PointLight(TOXIC_LIME, 1.2, 60);
        acidLight2.position.set(40, 5, 50);
        scene.add(acidLight2);
        lights.push(acidLight2);
        animatedObjects.push({ light: acidLight2, type: 'point' });

        var acidLight3 = new THREE.PointLight(ACID_YELLOW, 1, 50);
        acidLight3.position.set(0, 4, 0);
        scene.add(acidLight3);
        lights.push(acidLight3);
        animatedObjects.push({ light: acidLight3, type: 'point' });

        var distantGlow = new THREE.DirectionalLight(0xff8844, 0.3);
        distantGlow.position.set(80, 20, 80);
        scene.add(distantGlow);
        lights.push(distantGlow);
    }

    function update(delta) {
        glowPulseTime += delta;

        for (var i = 0; i < bubblesArray.length; i++) {
            var bubble = bubblesArray[i];
            bubble.position.y += bubble.riseSpeed * delta;
            if (bubble.position.y > bubble.maxHeight) {
                bubble.position.y = bubble.startY;
            }
            bubble.scale.x += delta * 0.2;
            bubble.scale.y += delta * 0.2;
            bubble.scale.z += delta * 0.2;
            if (bubble.scale.x > 1.5) {
                bubble.scale.set(1, 1, 1);
                bubble.position.y = bubble.startY;
            }
        }

        for (var j = 0; j < animatedObjects.length; j++) {
            var obj = animatedObjects[j];
            if (obj.type === 'point') {
                var pulse = Math.sin(glowPulseTime * 2) * 0.5 + 1;
                obj.light.intensity = 1 * pulse;
            }
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
        animatedObjects = [];
        bubblesArray = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
