window.CyberGrid = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var dataNodes = [];
    var energyConduits = [];
    var glitchFragments = [];
    var time = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        dataNodes = [];
        energyConduits = [];
        glitchFragments = [];
        time = 0;
        buildGridFloor();
        buildTowers();
        buildDataNodes();
        buildDefenses();
        buildParticles();
        buildConduits();
        buildBarriers();
        buildServerRacks();
        setupLighting();
    }

    function buildGridFloor() {
        var gridSize = 200;
        var cellSize = 10;
        var cellsPerSide = Math.floor(gridSize / cellSize);
        var colors = [0x00FFFF, 0x0099FF, 0x7700FF, 0x1A1A2E];
        var colorIndex = 0;

        for (var x = 0; x < cellsPerSide; x++) {
            for (var z = 0; z < cellsPerSide; z++) {
                colorIndex = (x + z) % colors.length;
                var geometry = new THREE.BoxGeometry(cellSize - 0.5, 0.5, cellSize - 0.5);
                var material = new THREE.MeshLambertMaterial({
                    color: colors[colorIndex],
                    emissive: colors[colorIndex],
                    emissiveIntensity: 0.3
                });
                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    x * cellSize - gridSize / 2,
                    -5,
                    z * cellSize - gridSize / 2
                );
                scene.add(mesh);
                objects.push(mesh);
            }
        }
    }

    function buildTowers() {
        var positions = [
            [-60, 0, -60],
            [60, 0, -60],
            [-60, 0, 60],
            [60, 0, 60],
            [0, 0, -80],
            [0, 0, 80],
            [-80, 0, 0],
            [80, 0, 0]
        ];

        for (var p = 0; p < positions.length; p++) {
            var posX = positions[p][0];
            var posZ = positions[p][2];

            for (var h = 0; h < 5; h++) {
                var scale = 1 - (h * 0.18);
                var width = 12 * scale;
                var depth = 12 * scale;
                var height = 8;

                var geometry = new THREE.BoxGeometry(width, height, depth);
                var material = new THREE.MeshLambertMaterial({
                    color: 0x00FFFF,
                    emissive: 0x00FFFF,
                    emissiveIntensity: 0.4
                });
                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(posX, -4 + h * 8, posZ);
                scene.add(mesh);
                objects.push(mesh);
            }
        }
    }

    function buildDataNodes() {
        var nodePositions = [
            [-40, 20, -40],
            [40, 25, -40],
            [-40, 22, 40],
            [40, 28, 40],
            [0, 30, 0],
            [-70, 15, 0],
            [70, 18, 0],
            [0, 20, -70],
            [0, 24, 70],
            [-50, 35, -50],
            [50, 32, -50],
            [-50, 28, 50],
            [50, 30, 50],
            [20, 22, 20],
            [-20, 25, -20],
            [30, 18, -30],
            [-30, 20, 30]
        ];

        for (var i = 0; i < nodePositions.length; i++) {
            var geometry = new THREE.SphereGeometry(2.5, 16, 16);
            var material = new THREE.MeshLambertMaterial({
                color: 0xFFFFFF,
                emissive: 0x0099FF,
                emissiveIntensity: 0.6
            });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(nodePositions[i][0], nodePositions[i][1], nodePositions[i][2]);
            scene.add(mesh);
            objects.push(mesh);
            dataNodes.push({ mesh: mesh, baseY: nodePositions[i][1] });
        }
    }

    function buildDefenses() {
        var defensePositions = [
            [-50, 5, -50],
            [50, 5, -50],
            [-50, 5, 50],
            [50, 5, 50],
            [0, 5, 0]
        ];

        for (var d = 0; d < defensePositions.length; d++) {
            var posX = defensePositions[d][0];
            var posZ = defensePositions[d][2];

            var baseGeom = new THREE.CylinderGeometry(4, 5, 2, 8);
            var baseMat = new THREE.MeshLambertMaterial({
                color: 0xFF0099,
                emissive: 0xFF0099,
                emissiveIntensity: 0.5
            });
            var baseM = new THREE.Mesh(baseGeom, baseMat);
            baseM.position.set(posX, 1, posZ);
            scene.add(baseM);
            objects.push(baseM);

            var bodyGeom = new THREE.BoxGeometry(3, 6, 3);
            var bodyMat = new THREE.MeshLambertMaterial({
                color: 0x7700FF,
                emissive: 0x7700FF,
                emissiveIntensity: 0.4
            });
            var bodyM = new THREE.Mesh(bodyGeom, bodyMat);
            bodyM.position.set(posX, 5, posZ);
            scene.add(bodyM);
            objects.push(bodyM);

            var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 6);
            var barrelMat = new THREE.MeshLambertMaterial({
                color: 0x00FFFF,
                emissive: 0x00FFFF,
                emissiveIntensity: 0.6
            });
            var barrelM = new THREE.Mesh(barrelGeom, barrelMat);
            barrelM.rotation.z = Math.PI / 4;
            barrelM.position.set(posX + 2, 8, posZ);
            scene.add(barrelM);
            objects.push(barrelM);
        }
    }

    function buildParticles() {
        var fragmentCount = 30;
        for (var f = 0; f < fragmentCount; f++) {
            var size = 1 + Math.random() * 3;
            var geometry = new THREE.BoxGeometry(size, size, size);
            var material = new THREE.MeshLambertMaterial({
                color: 0xFF00FF,
                emissive: 0xFF00FF,
                emissiveIntensity: 0.7
            });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 160,
                5 + Math.random() * 40,
                (Math.random() - 0.5) * 160
            );
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            scene.add(mesh);
            objects.push(mesh);
            glitchFragments.push({
                mesh: mesh,
                rotVelX: (Math.random() - 0.5) * 0.05,
                rotVelY: (Math.random() - 0.5) * 0.05,
                rotVelZ: (Math.random() - 0.5) * 0.05
            });
        }
    }

    function buildConduits() {
        var conduitPositions = [
            [-75, 5, -75],
            [75, 5, -75],
            [-75, 5, 75],
            [75, 5, 75],
            [-40, 5, 0],
            [40, 5, 0],
            [0, 5, -40],
            [0, 5, 40]
        ];

        for (var c = 0; c < conduitPositions.length; c++) {
            var posX = conduitPositions[c][0];
            var posZ = conduitPositions[c][2];

            var cylinderGeom = new THREE.CylinderGeometry(2, 2, 20, 8);
            var conduitMat = new THREE.MeshLambertMaterial({
                color: 0x00FFFF,
                emissive: 0x00FFFF,
                emissiveIntensity: 0.5
            });
            var cylinderM = new THREE.Mesh(cylinderGeom, conduitMat);
            cylinderM.position.set(posX, 10, posZ);
            scene.add(cylinderM);
            objects.push(cylinderM);

            var topGeom = new THREE.SphereGeometry(3, 12, 12);
            var topMat = new THREE.MeshLambertMaterial({
                color: 0x00FFFF,
                emissive: 0x00FFFF,
                emissiveIntensity: 0.7
            });
            var topM = new THREE.Mesh(topGeom, topMat);
            topM.position.set(posX, 20, posZ);
            scene.add(topM);
            objects.push(topM);
            energyConduits.push({ mesh: topM, baseScale: 3 });
        }
    }

    function buildBarriers() {
        var barrierLines = [
            [[-80, 5, -80], [-80, 5, 80]],
            [[80, 5, -80], [80, 5, 80]],
            [[-80, 5, -80], [80, 5, -80]],
            [[-80, 5, 80], [80, 5, 80]]
        ];

        for (var b = 0; b < barrierLines.length; b++) {
            var start = barrierLines[b][0];
            var end = barrierLines[b][1];

            var lineGeom = new THREE.BufferGeometry();
            var points = [
                new THREE.Vector3(start[0], start[1], start[2]),
                new THREE.Vector3(end[0], end[1], end[2])
            ];
            lineGeom.setFromPoints(points);

            var lineMat = new THREE.LineBasicMaterial({ color: 0x00FFFF, linewidth: 3 });
            var line = new THREE.LineSegments(lineGeom, lineMat);
            scene.add(line);
            objects.push(line);
        }

        for (var w = 0; w < 6; w++) {
            var boxGeom = new THREE.BoxGeometry(2, 15, 60);
            var boxMat = new THREE.MeshLambertMaterial({
                color: 0x0099FF,
                emissive: 0x0099FF,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.6
            });
            var boxM = new THREE.Mesh(boxGeom, boxMat);
            if (w < 3) {
                boxM.position.set(-85 + w * 85, 7, 0);
            } else {
                boxM.position.set(0, 7, -85 + (w - 3) * 85);
            }
            scene.add(boxM);
            objects.push(boxM);
        }
    }

    function buildServerRacks() {
        var rackPositions = [
            [-35, 5, -35],
            [35, 5, -35],
            [-35, 5, 35],
            [35, 5, 35],
            [0, 5, -20],
            [0, 5, 20],
            [-20, 5, 0],
            [20, 5, 0]
        ];

        for (var r = 0; r < rackPositions.length; r++) {
            var rX = rackPositions[r][0];
            var rZ = rackPositions[r][2];

            for (var s = 0; s < 4; s++) {
                for (var t = 0; t < 3; t++) {
                    var rackGeom = new THREE.BoxGeometry(6, 4, 4);
                    var rackMat = new THREE.MeshLambertMaterial({
                        color: 0x1A1A2E,
                        emissive: 0x7700FF,
                        emissiveIntensity: 0.2
                    });
                    var rackM = new THREE.Mesh(rackGeom, rackMat);
                    rackM.position.set(rX - 6 + t * 6, 2 + s * 4, rZ);
                    scene.add(rackM);
                    objects.push(rackM);
                }
            }
        }
    }

    function buildPlatforms() {
        var platformHeights = [15, 25, 35, 20, 30];
        var platformPositions = [
            [-60, 0, 0],
            [60, 0, 0],
            [0, 0, -60],
            [0, 0, 60],
            [0, 0, 0]
        ];

        for (var p = 0; p < platformPositions.length; p++) {
            var platGeom = new THREE.BoxGeometry(25, 2, 25);
            var platMat = new THREE.MeshLambertMaterial({
                color: 0x00FFFF,
                emissive: 0x00FFFF,
                emissiveIntensity: 0.4
            });
            var platM = new THREE.Mesh(platGeom, platMat);
            platM.position.set(
                platformPositions[p][0],
                platformHeights[p],
                platformPositions[p][2]
            );
            scene.add(platM);
            objects.push(platM);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
        directionalLight.position.set(50, 80, 50);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0x00FFFF, 1, 200);
        pointLight1.position.set(-70, 30, -70);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xFF00FF, 0.8, 180);
        pointLight2.position.set(70, 25, 70);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0x7700FF, 1, 160);
        pointLight3.position.set(0, 35, 0);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function update(delta) {
        time += delta;

        for (var i = 0; i < dataNodes.length; i++) {
            var node = dataNodes[i];
            node.mesh.rotation.y += 0.01;
            node.mesh.rotation.z += 0.005;
            node.mesh.position.y = node.baseY + Math.sin(time * 2 + i) * 1.5;
        }

        for (var j = 0; j < energyConduits.length; j++) {
            var conduit = energyConduits[j];
            var pulseFactor = 1 + Math.sin(time * 3 + j) * 0.3;
            conduit.mesh.scale.set(pulseFactor, pulseFactor, pulseFactor);
        }

        for (var k = 0; k < glitchFragments.length; k++) {
            var fragment = glitchFragments[k];
            fragment.mesh.rotation.x += fragment.rotVelX;
            fragment.mesh.rotation.y += fragment.rotVelY;
            fragment.mesh.rotation.z += fragment.rotVelZ;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
        }
        objects = [];
        lights = [];
        dataNodes = [];
        energyConduits = [];
        glitchFragments = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
