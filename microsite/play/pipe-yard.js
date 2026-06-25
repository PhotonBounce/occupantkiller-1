window.PipeYard = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var sparkSpheres = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        sparkSpheres = [];
        buildGround();
        buildPipeStacks();
        buildWelding();
        buildCranes();
        buildWarehouse();
        buildDefenses();
        buildVehicles();
        buildScrapPile();
        buildVerticalPipes();
        buildFences();
        buildFloodlights();
        setupLighting();
    }

    function update(delta) {
        for (var i = 0; i < sparkSpheres.length; i++) {
            var spark = sparkSpheres[i];
            var baseScale = spark.userData.baseScale;
            var flicker = 0.7 + 0.3 * Math.sin(Date.now() * 0.01 + i);
            spark.scale.set(baseScale * flicker, baseScale * flicker, baseScale * flicker);
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
        sparkSpheres = [];
        scene = null;
        camera = null;
    }

    function buildGround() {
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x6b5344 });

        for (var x = -80; x < 80; x += 20) {
            for (var z = -80; z < 80; z += 20) {
                var groundGeom = new THREE.BoxGeometry(20, 1, 20);
                var groundMesh = new THREE.Mesh(groundGeom, groundMaterial);
                groundMesh.position.set(x + 10, -0.5, z + 10);
                scene.add(groundMesh);
                objects.push(groundMesh);
            }
        }
    }

    function buildPipeStacks() {
        var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0xcc6600 });

        var stackPositions = [
            [-40, -50], [-40, -20], [-40, 10],
            [0, -50], [0, -20], [0, 10],
            [40, -50], [40, -20], [40, 10]
        ];

        for (var s = 0; s < stackPositions.length; s++) {
            var stackX = stackPositions[s][0];
            var stackZ = stackPositions[s][1];

            for (var row = 0; row < 3; row++) {
                for (var col = 0; col < 5; col++) {
                    var pipeGeom = new THREE.CylinderGeometry(3, 3, 15, 16);
                    var pipeMesh = new THREE.Mesh(pipeGeom, pipeMaterial);
                    var offsetX = (col - 2) * 7;
                    var offsetZ = (row - 1) * 7;
                    pipeMesh.rotation.z = Math.PI / 2;
                    pipeMesh.position.set(stackX + offsetX, 5 + row * 8, stackZ + offsetZ);
                    scene.add(pipeMesh);
                    objects.push(pipeMesh);
                }
            }
        }
    }

    function buildWelding() {
        var tableGeom = new THREE.BoxGeometry(12, 1, 8);
        var tableMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var welderPositions = [[-30, 20], [10, 40], [50, 25]];

        for (var w = 0; w < welderPositions.length; w++) {
            var wx = welderPositions[w][0];
            var wz = welderPositions[w][1];

            var tableMesh = new THREE.Mesh(tableGeom, tableMaterial);
            tableMesh.position.set(wx, 3, wz);
            scene.add(tableMesh);
            objects.push(tableMesh);

            var sparkMaterial = new THREE.MeshLambertMaterial({
                color: 0xffaa00,
                emissive: 0xff6600
            });

            for (var s = 0; s < 8; s++) {
                var sparkGeom = new THREE.SphereGeometry(0.4, 6, 6);
                var sparkMesh = new THREE.Mesh(sparkGeom, sparkMaterial);
                var rx = (Math.random() - 0.5) * 8;
                var rz = (Math.random() - 0.5) * 6;
                var ry = 4 + Math.random() * 2;
                sparkMesh.position.set(wx + rx, ry, wz + rz);
                sparkMesh.userData.baseScale = 0.4;
                scene.add(sparkMesh);
                objects.push(sparkMesh);
                sparkSpheres.push(sparkMesh);
            }
        }
    }

    function buildCranes() {
        var boltMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var cableMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

        var cranePositions = [[-20, 0], [30, -30]];

        for (var c = 0; c < cranePositions.length; c++) {
            var cx = cranePositions[c][0];
            var cz = cranePositions[c][1];

            var boomGeom = new THREE.BoxGeometry(40, 2, 2);
            var boomMesh = new THREE.Mesh(boomGeom, boltMaterial);
            boomMesh.position.set(cx, 18, cz);
            scene.add(boomMesh);
            objects.push(boomMesh);

            for (var p = 0; p < 4; p++) {
                var cableGeom = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
                var cableMesh = new THREE.Mesh(cableGeom, cableMaterial);
                var px = cx - 15 + p * 10;
                cableMesh.position.set(px, 12, cz);
                scene.add(cableMesh);
                objects.push(cableMesh);
            }

            var hookGeom = new THREE.BoxGeometry(2, 3, 2);
            var hookMesh = new THREE.Mesh(hookGeom, boltMaterial);
            hookMesh.position.set(cx, 8, cz);
            scene.add(hookMesh);
            objects.push(hookMesh);

            var legGeom = new THREE.CylinderGeometry(1, 1, 16, 12);
            var legMesh1 = new THREE.Mesh(legGeom, boltMaterial);
            legMesh1.position.set(cx - 15, 8, cz);
            scene.add(legMesh1);
            objects.push(legMesh1);

            var legMesh2 = new THREE.Mesh(legGeom, boltMaterial);
            legMesh2.position.set(cx + 15, 8, cz);
            scene.add(legMesh2);
            objects.push(legMesh2);
        }
    }

    function buildWarehouse() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        var wallFrontGeom = new THREE.BoxGeometry(60, 15, 2);
        var wallFront = new THREE.Mesh(wallFrontGeom, wallMaterial);
        wallFront.position.set(0, 7.5, 60);
        scene.add(wallFront);
        objects.push(wallFront);

        var wallBackGeom = new THREE.BoxGeometry(60, 15, 2);
        var wallBack = new THREE.Mesh(wallBackGeom, wallMaterial);
        wallBack.position.set(0, 7.5, -60);
        scene.add(wallBack);
        objects.push(wallBack);

        var wallLeftGeom = new THREE.BoxGeometry(2, 15, 120);
        var wallLeft = new THREE.Mesh(wallLeftGeom, wallMaterial);
        wallLeft.position.set(-30, 7.5, 0);
        scene.add(wallLeft);
        objects.push(wallLeft);

        var wallRightGeom = new THREE.BoxGeometry(2, 15, 120);
        var wallRight = new THREE.Mesh(wallRightGeom, wallMaterial);
        wallRight.position.set(30, 7.5, 0);
        scene.add(wallRight);
        objects.push(wallRight);

        for (var d = 0; d < 3; d++) {
            var doorGeom = new THREE.BoxGeometry(14, 12, 1);
            var doorMesh = new THREE.Mesh(doorGeom, doorMaterial);
            var doorX = -20 + d * 20;
            doorMesh.position.set(doorX, 6, 60.5);
            scene.add(doorMesh);
            objects.push(doorMesh);
        }

        var roofGeom = new THREE.BoxGeometry(60, 2, 120);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var roofMesh = new THREE.Mesh(roofGeom, roofMaterial);
        roofMesh.position.set(0, 16, 0);
        scene.add(roofMesh);
        objects.push(roofMesh);
    }

    function buildDefenses() {
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var postMaterial = new THREE.MeshLambertMaterial({ color: 0x556633 });

        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var distRadius = 70;
            var sbX = Math.cos(angle) * distRadius;
            var sbZ = Math.sin(angle) * distRadius;

            for (var j = 0; j < 3; j++) {
                var sbGeom = new THREE.BoxGeometry(4, 1.5, 4);
                var sbMesh = new THREE.Mesh(sbGeom, sandbagMaterial);
                sbMesh.position.set(sbX, 0.75 + j * 1.5, sbZ);
                scene.add(sbMesh);
                objects.push(sbMesh);
            }

            var postGeom = new THREE.CylinderGeometry(0.8, 0.8, 5, 10);
            var postMesh = new THREE.Mesh(postGeom, postMaterial);
            postMesh.position.set(sbX, 2.5, sbZ);
            scene.add(postMesh);
            objects.push(postMesh);
        }
    }

    function buildVehicles() {
        var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x446644 });
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var forkMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

        var vehiclePositions = [[-50, 30], [20, 50], [60, -40]];

        for (var v = 0; v < vehiclePositions.length; v++) {
            var vx = vehiclePositions[v][0];
            var vz = vehiclePositions[v][1];

            var bodyGeom = new THREE.BoxGeometry(4, 3, 8);
            var bodyMesh = new THREE.Mesh(bodyGeom, bodyMaterial);
            bodyMesh.position.set(vx, 2, vz);
            scene.add(bodyMesh);
            objects.push(bodyMesh);

            for (var w = 0; w < 4; w++) {
                var wheelGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 16);
                var wheelMesh = new THREE.Mesh(wheelGeom, wheelMaterial);
                var wheelX = vx + (w < 2 ? -1.5 : 1.5);
                var wheelZ = vz + (w % 2 === 0 ? -2.5 : 2.5);
                wheelMesh.rotation.z = Math.PI / 2;
                wheelMesh.position.set(wheelX, 1.2, wheelZ);
                scene.add(wheelMesh);
                objects.push(wheelMesh);
            }

            var forkGeom = new THREE.BoxGeometry(0.3, 4, 8);
            var forkMesh1 = new THREE.Mesh(forkGeom, forkMaterial);
            forkMesh1.position.set(vx - 1, 2, vz + 5);
            scene.add(forkMesh1);
            objects.push(forkMesh1);

            var forkMesh2 = new THREE.Mesh(forkGeom, forkMaterial);
            forkMesh2.position.set(vx + 1, 2, vz + 5);
            scene.add(forkMesh2);
            objects.push(forkMesh2);
        }
    }

    function buildScrapPile() {
        var scrapMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var center = { x: -60, z: -40 };

        for (var i = 0; i < 20; i++) {
            if (Math.random() > 0.5) {
                var scrapGeom = new THREE.BoxGeometry(
                    2 + Math.random() * 4,
                    1 + Math.random() * 3,
                    2 + Math.random() * 4
                );
                var scrapMesh = new THREE.Mesh(scrapGeom, scrapMaterial);
                scrapMesh.position.set(
                    center.x + (Math.random() - 0.5) * 20,
                    2 + Math.random() * 8,
                    center.z + (Math.random() - 0.5) * 20
                );
                scrapMesh.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                scene.add(scrapMesh);
                objects.push(scrapMesh);
            } else {
                var sphereGeom = new THREE.SphereGeometry(1 + Math.random() * 2, 8, 8);
                var sphereMesh = new THREE.Mesh(sphereGeom, scrapMaterial);
                sphereMesh.position.set(
                    center.x + (Math.random() - 0.5) * 20,
                    3 + Math.random() * 6,
                    center.z + (Math.random() - 0.5) * 20
                );
                scene.add(sphereMesh);
                objects.push(sphereMesh);
            }
        }
    }

    function buildVerticalPipes() {
        var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0xcc6600 });

        var verticalPositions = [
            [-65, -65], [65, -65], [-65, 65], [65, 65],
            [-40, -75], [40, -75], [-75, -40], [75, -40]
        ];

        for (var p = 0; p < verticalPositions.length; p++) {
            var px = verticalPositions[p][0];
            var pz = verticalPositions[p][1];

            var pipeGeom = new THREE.CylinderGeometry(2, 2, 20, 16);
            var pipeMesh = new THREE.Mesh(pipeGeom, pipeMaterial);
            pipeMesh.position.set(px, 10, pz);
            scene.add(pipeMesh);
            objects.push(pipeMesh);
        }
    }

    function buildFences() {
        var postMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var wirePositions = [];

        for (var f = 0; f < 40; f++) {
            var angle = (f / 40) * Math.PI * 2;
            var fenceRadius = 85;
            var fx = Math.cos(angle) * fenceRadius;
            var fz = Math.sin(angle) * fenceRadius;

            var postGeom = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
            var postMesh = new THREE.Mesh(postGeom, postMaterial);
            postMesh.position.set(fx, 3, fz);
            scene.add(postMesh);
            objects.push(postMesh);

            wirePositions.push(new THREE.Vector3(fx, 5, fz));
        }

        wirePositions.push(wirePositions[0]);
        var wireGeom = new THREE.BufferGeometry();
        wireGeom.setFromPoints(wirePositions);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x999999 });
        var wireLines = new THREE.LineSegments(wireGeom, wireMaterial);
        scene.add(wireLines);
        objects.push(wireLines);
    }

    function buildFloodlights() {
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var lightHousingMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

        var floodPositions = [
            [-70, -70], [70, -70], [-70, 70], [70, 70],
            [0, -80], [0, 80], [-80, 0], [80, 0]
        ];

        for (var f = 0; f < floodPositions.length; f++) {
            var fx = floodPositions[f][0];
            var fz = floodPositions[f][1];

            var poleGeom = new THREE.CylinderGeometry(0.6, 0.6, 25, 10);
            var poleMesh = new THREE.Mesh(poleGeom, poleMaterial);
            poleMesh.position.set(fx, 12.5, fz);
            scene.add(poleMesh);
            objects.push(poleMesh);

            var housingGeom = new THREE.BoxGeometry(3, 2, 3);
            var housingMesh = new THREE.Mesh(housingGeom, lightHousingMaterial);
            housingMesh.position.set(fx, 26, fz);
            scene.add(housingMesh);
            objects.push(housingMesh);
        }
    }

    function setupLighting() {
        var ambLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambLight);
        lights.push(ambLight);

        var directLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directLight.position.set(50, 40, 50);
        directLight.castShadow = true;
        scene.add(directLight);
        lights.push(directLight);

        var pointLight1 = new THREE.PointLight(0xffaa00, 0.3);
        pointLight1.position.set(-30, 8, 20);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xffaa00, 0.3);
        pointLight2.position.set(10, 8, 40);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0xffaa00, 0.3);
        pointLight3.position.set(50, 8, 25);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
