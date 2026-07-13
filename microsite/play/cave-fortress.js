window.CaveFortress = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var dropletsActive = [];
    var crystalPulseTime = 0;
    var waterDropTimer = 0;

    function buildCavewalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

        var wallGeom1 = new THREE.BoxGeometry(50, 30, 40);
        var wall1 = new THREE.Mesh(wallGeom1, wallMaterial);
        wall1.position.set(-60, 0, -80);
        wall1.rotation.z = 0.3;
        scene.add(wall1);
        objects.push(wall1);

        var wallGeom2 = new THREE.BoxGeometry(45, 35, 35);
        var wall2 = new THREE.Mesh(wallGeom2, wallMaterial);
        wall2.position.set(70, 5, -75);
        wall2.rotation.z = -0.25;
        scene.add(wall2);
        objects.push(wall2);

        var wallGeom3 = new THREE.BoxGeometry(40, 28, 45);
        var wall3 = new THREE.Mesh(wallGeom3, wallMaterial);
        wall3.position.set(-75, -8, 60);
        wall3.rotation.z = 0.4;
        scene.add(wall3);
        objects.push(wall3);

        var wallGeom4 = new THREE.BoxGeometry(55, 32, 38);
        var wall4 = new THREE.Mesh(wallGeom4, wallMaterial);
        wall4.position.set(65, 2, 70);
        wall4.rotation.z = -0.35;
        scene.add(wall4);
        objects.push(wall4);

        var wallGeom5 = new THREE.BoxGeometry(48, 30, 42);
        var wall5 = new THREE.Mesh(wallGeom5, wallMaterial);
        wall5.position.set(0, -5, -95);
        wall5.rotation.z = 0.15;
        scene.add(wall5);
        objects.push(wall5);

        var wallGeom6 = new THREE.BoxGeometry(52, 33, 40);
        var wall6 = new THREE.Mesh(wallGeom6, wallMaterial);
        wall6.position.set(-85, 3, 0);
        wall6.rotation.z = -0.2;
        scene.add(wall6);
        objects.push(wall6);
    }

    function buildCaveceiling() {
        var ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

        var ceilingGeom = new THREE.BoxGeometry(180, 8, 200);
        var ceiling = new THREE.Mesh(ceilingGeom, ceilingMaterial);
        ceiling.position.set(0, 80, 0);
        scene.add(ceiling);
        objects.push(ceiling);

        var ceilingGeom2 = new THREE.BoxGeometry(100, 6, 120);
        var ceiling2 = new THREE.Mesh(ceilingGeom2, ceilingMaterial);
        ceiling2.position.set(-50, 85, -40);
        scene.add(ceiling2);
        objects.push(ceiling2);

        var ceilingGeom3 = new THREE.BoxGeometry(110, 7, 100);
        var ceiling3 = new THREE.Mesh(ceilingGeom3, ceilingMaterial);
        ceiling3.position.set(55, 82, 50);
        scene.add(ceiling3);
        objects.push(ceiling3);
    }

    function buildStalactites() {
        var stalMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

        var positions = [
            [-40, 70, -60], [10, 72, -50], [45, 68, -30], [-60, 71, 20],
            [30, 69, 45], [-20, 70, 70], [60, 71, -80], [-50, 73, -20],
            [25, 70, -90], [70, 72, 10], [-75, 69, 50], [0, 71, 60],
            [50, 70, 65], [-65, 72, -40], [15, 69, 80], [80, 71, 25],
            [-30, 70, -85], [35, 73, -15], [-85, 71, 35], [20, 70, -75]
        ];

        for (var i = 0; i < positions.length; i++) {
            var size = 2 + Math.random() * 3;
            var stalGeom = new THREE.ConeGeometry(size * 0.8, size * 4, 8);
            var stalactite = new THREE.Mesh(stalGeom, stalMaterial);
            stalactite.position.set(positions[i][0], positions[i][1], positions[i][2]);
            stalactite.rotation.z = (Math.random() - 0.5) * 0.2;
            stalactite.rotation.x = (Math.random() - 0.5) * 0.15;
            scene.add(stalactite);
            objects.push(stalactite);
        }

        var morePositions = [
            [5, 71, 15], [-35, 70, 40], [55, 72, -50], [-70, 70, -65],
            [40, 69, 30], [-15, 73, -35], [65, 70, 55], [-45, 71, 75]
        ];

        for (var j = 0; j < morePositions.length; j++) {
            var sz = 1.5 + Math.random() * 2.5;
            var sGeom = new THREE.ConeGeometry(sz * 0.7, sz * 3.5, 7);
            var stal = new THREE.Mesh(sGeom, stalMaterial);
            stal.position.set(morePositions[j][0], morePositions[j][1], morePositions[j][2]);
            stal.rotation.z = (Math.random() - 0.5) * 0.25;
            scene.add(stal);
            objects.push(stal);
        }
    }

    function buildUndergroundlake() {
        var lakeMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a1a });

        var lakeGeom = new THREE.BoxGeometry(160, 3, 180);
        var lake = new THREE.Mesh(lakeGeom, lakeMaterial);
        lake.position.set(0, -45, 0);
        scene.add(lake);
        objects.push(lake);

        var lakeEdgeGeom = new THREE.BoxGeometry(162, 2, 182);
        var lakeEdge = new THREE.Mesh(lakeEdgeGeom, new THREE.MeshLambertMaterial({ color: 0x1a1a2a }));
        lakeEdge.position.set(0, -47, 0);
        scene.add(lakeEdge);
        objects.push(lakeEdge);
    }

    function buildBarracks() {
        var barracksMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });

        var positions = [
            [-50, 0, -40], [50, 0, -50], [-60, 0, 30], [65, 0, 50],
            [-35, 0, 70], [40, 0, -80]
        ];

        for (var i = 0; i < positions.length; i++) {
            var barGeom = new THREE.BoxGeometry(20, 18, 25);
            var barracks = new THREE.Mesh(barGeom, barracksMat);
            barracks.position.set(positions[i][0], positions[i][1], positions[i][2]);
            scene.add(barracks);
            objects.push(barracks);

            var roofGeom = new THREE.BoxGeometry(22, 2, 27);
            var roof = new THREE.Mesh(roofGeom, new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
            roof.position.set(positions[i][0], positions[i][1] + 10, positions[i][2]);
            scene.add(roof);
            objects.push(roof);
        }
    }

    function buildAmmunition() {
        var ammoCrateMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });

        var stackPositions = [
            [-45, 0, 20], [45, 0, -30], [-70, 0, -60], [70, 0, 40]
        ];

        for (var i = 0; i < stackPositions.length; i++) {
            for (var j = 0; j < 4; j++) {
                var crateGeom = new THREE.BoxGeometry(8, 6, 10);
                var crate = new THREE.Mesh(crateGeom, ammoCrateMat);
                crate.position.set(stackPositions[i][0] + (j % 2) * 5,
                                   stackPositions[i][1] + 3 + Math.floor(j / 2) * 7,
                                   stackPositions[i][2]);
                scene.add(crate);
                objects.push(crate);
            }

            var cylinderGeom = new THREE.CylinderGeometry(3, 3, 15, 8);
            var cylinder = new THREE.Mesh(cylinderGeom, new THREE.MeshLambertMaterial({ color: 0x4a3a2a }));
            cylinder.position.set(stackPositions[i][0] + 12, stackPositions[i][1] + 8, stackPositions[i][2]);
            scene.add(cylinder);
            objects.push(cylinder);
        }
    }

    function buildRailsystem() {
        var railMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

        var points1 = [
            new THREE.Vector3(-80, 30, -70),
            new THREE.Vector3(0, 35, 0),
            new THREE.Vector3(80, 30, 70)
        ];

        var railGeom1 = new THREE.BufferGeometry().setFromPoints(points1);
        var rail1 = new THREE.LineSegments(railGeom1, new THREE.LineBasicMaterial({ color: 0x6a6a6a, linewidth: 4 }));
        scene.add(rail1);
        objects.push(rail1);

        var points2 = [
            new THREE.Vector3(-75, 30, -75),
            new THREE.Vector3(0, 35, 5),
            new THREE.Vector3(75, 30, 75)
        ];

        var railGeom2 = new THREE.BufferGeometry().setFromPoints(points2);
        var rail2 = new THREE.LineSegments(railGeom2, new THREE.LineBasicMaterial({ color: 0x6a6a6a, linewidth: 4 }));
        scene.add(rail2);
        objects.push(rail2);

        var wheelPositions = [
            [-40, 30, -35], [0, 35, 0], [40, 30, 35], [-70, 31, -65], [70, 29, 65]
        ];

        for (var i = 0; i < wheelPositions.length; i++) {
            var wheelGeom = new THREE.CylinderGeometry(2.5, 2.5, 3, 12);
            var wheel = new THREE.Mesh(wheelGeom, railMat);
            wheel.position.set(wheelPositions[i][0], wheelPositions[i][1], wheelPositions[i][2]);
            wheel.rotation.z = Math.PI / 2;
            scene.add(wheel);
            objects.push(wheel);
        }
    }

    function buildStonebridge() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        var archPositions = [
            [-30, -25, 0], [-10, -20, 0], [10, -20, 0], [30, -25, 0]
        ];

        for (var i = 0; i < archPositions.length; i++) {
            var archGeom = new THREE.BoxGeometry(12, 20, 8);
            var arch = new THREE.Mesh(archGeom, stoneMat);
            arch.position.set(archPositions[i][0], archPositions[i][1], archPositions[i][2]);
            scene.add(arch);
            objects.push(arch);
        }

        var deckGeom = new THREE.BoxGeometry(50, 3, 12);
        var deck = new THREE.Mesh(deckGeom, new THREE.MeshLambertMaterial({ color: 0x6a6a6a }));
        deck.position.set(0, -12, 0);
        scene.add(deck);
        objects.push(deck);

        var railGeom = new THREE.BoxGeometry(50, 2, 1);
        var railLeft = new THREE.Mesh(railGeom, stoneMat);
        railLeft.position.set(0, -11, 6);
        scene.add(railLeft);
        objects.push(railLeft);

        var railRight = new THREE.Mesh(railGeom, stoneMat);
        railRight.position.set(0, -11, -6);
        scene.add(railRight);
        objects.push(railRight);
    }

    function buildGenerator() {
        var genMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });

        var mainGeom = new THREE.BoxGeometry(25, 20, 18);
        var main = new THREE.Mesh(mainGeom, genMat);
        main.position.set(0, 0, 80);
        scene.add(main);
        objects.push(main);

        var exhaust1Geom = new THREE.CylinderGeometry(3, 3, 30, 8);
        var exhaust1 = new THREE.Mesh(exhaust1Geom, new THREE.MeshLambertMaterial({ color: 0x3a3a3a }));
        exhaust1.position.set(-8, 15, 80);
        scene.add(exhaust1);
        objects.push(exhaust1);

        var exhaust2Geom = new THREE.CylinderGeometry(3, 3, 32, 8);
        var exhaust2 = new THREE.Mesh(exhaust2Geom, new THREE.MeshLambertMaterial({ color: 0x3a3a3a }));
        exhaust2.position.set(8, 16, 80);
        scene.add(exhaust2);
        objects.push(exhaust2);

        var pipeGeom = new THREE.CylinderGeometry(1.5, 1.5, 40, 6);
        var pipe = new THREE.Mesh(pipeGeom, new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
        pipe.position.set(0, 5, 80);
        pipe.rotation.z = Math.PI / 2;
        scene.add(pipe);
        objects.push(pipe);
    }

    function buildCrystalformation() {
        var crystalMat = new THREE.MeshLambertMaterial({ color: 0x00ffff, emissive: 0x0088ff });
        var darkCrystalMat = new THREE.MeshLambertMaterial({ color: 0x0099ff, emissive: 0x0055aa });

        var clusterPositions = [
            [-55, -30, -50], [55, -28, 60], [-40, -35, 65], [70, -25, -40],
            [0, -32, -80], [-75, -30, -20], [45, -27, 30]
        ];

        for (var i = 0; i < clusterPositions.length; i++) {
            for (var j = 0; j < 5; j++) {
                var sphereGeom = new THREE.SphereGeometry(2 + Math.random() * 1.5, 16, 16);
                var crystal = new THREE.Mesh(sphereGeom, j % 2 === 0 ? crystalMat : darkCrystalMat);
                crystal.position.set(
                    clusterPositions[i][0] + (Math.random() - 0.5) * 8,
                    clusterPositions[i][1] + (Math.random() - 0.5) * 6,
                    clusterPositions[i][2] + (Math.random() - 0.5) * 8
                );
                scene.add(crystal);
                objects.push(crystal);
            }
        }
    }

    function buildLighting() {
        var lightMat = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xffaa00 });

        var lanternPositions = [
            [-50, 10, -50], [50, 10, 50], [-70, 8, 20], [65, 12, -30],
            [0, 15, -60], [-60, 10, 60], [40, 9, -80]
        ];

        for (var i = 0; i < lanternPositions.length; i++) {
            var lanternGeom = new THREE.BoxGeometry(3, 5, 3);
            var lantern = new THREE.Mesh(lanternGeom, lightMat);
            lantern.position.set(lanternPositions[i][0], lanternPositions[i][1], lanternPositions[i][2]);
            scene.add(lantern);
            objects.push(lantern);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight1 = new THREE.PointLight(0xffaa44, 0.6, 80);
        pointLight1.position.set(0, 30, 0);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0x0088ff, 0.4, 60);
        pointLight2.position.set(-50, -30, -50);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0x0088ff, 0.4, 60);
        pointLight3.position.set(55, -28, 60);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function dropwater(delta) {
        waterDropTimer += delta;

        if (waterDropTimer > 0.5) {
            var dropGeom = new THREE.SphereGeometry(0.3, 8, 8);
            var dropMat = new THREE.MeshLambertMaterial({ color: 0x4488ff, emissive: 0x2244ff });
            var drop = new THREE.Mesh(dropGeom, dropMat);

            var stalPos = [
                [-40, 70, -60], [10, 72, -50], [45, 68, -30], [-60, 71, 20]
            ];
            var randPos = stalPos[Math.floor(Math.random() * stalPos.length)];

            drop.position.set(randPos[0] + (Math.random() - 0.5) * 4, randPos[1] - 5, randPos[2] + (Math.random() - 0.5) * 4);
            scene.add(drop);

            dropletsActive.push({
                mesh: drop,
                velocity: -12,
                startTime: 0
            });

            waterDropTimer = 0;
        }

        for (var i = dropletsActive.length - 1; i >= 0; i--) {
            var droplet = dropletsActive[i];
            droplet.mesh.position.y += droplet.velocity * delta;
            droplet.startTime += delta;

            if (droplet.mesh.position.y < -45) {
                scene.remove(droplet.mesh);
                dropletsActive.splice(i, 1);
            }
        }
    }

    function pulsatecrystals(delta) {
        crystalPulseTime += delta;
        var pulse = Math.sin(crystalPulseTime * 2) * 0.3 + 0.7;

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.material && obj.material.emissive && (obj.material.color.getHex() === 0x00ffff || obj.material.color.getHex() === 0x0099ff)) {
                obj.material.emissiveIntensity = pulse;
            }
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        dropletsActive = [];
        crystalPulseTime = 0;
        waterDropTimer = 0;

        buildCavewalls();
        buildCaveceiling();
        buildStalactites();
        buildUndergroundlake();
        buildBarracks();
        buildAmmunition();
        buildRailsystem();
        buildStonebridge();
        buildGenerator();
        buildCrystalformation();
        buildLighting();
        setupLighting();
    }

    function update(delta) {
        dropwater(delta);
        pulsatecrystals(delta);
    }

    function reset() {
        for (var i = 0; i < dropletsActive.length; i++) {
            scene.remove(dropletsActive[i].mesh);
        }
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        dropletsActive = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
