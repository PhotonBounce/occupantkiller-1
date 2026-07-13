window.BileFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var toxicSpheres = [];
    var warningLights = [];

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildFortGround() {
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3A4A1A });
        var groundGeo = new THREE.BoxGeometry(120, 1, 120);
        var groundMesh = addMesh(groundGeo, groundMaterial, 0, 0, 0);
        groundMesh.castShadow = true;
        groundMesh.receiveShadow = true;

        var hazardMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        for (var i = 0; i < 16; i++) {
            for (var j = 0; j < 16; j++) {
                var x = (i - 7.5) * 10;
                var z = (j - 7.5) * 10;
                var hazardBox = new THREE.BoxGeometry(2, 0.5, 2);
                var hazardMesh = addMesh(hazardBox, hazardMaterial, x, 0.1, z);
                hazardMesh.castShadow = true;
                if ((i + j) % 2 === 0) {
                    var xLine = new THREE.LineSegments(
                        new THREE.BufferGeometry().setAttribute('position',
                            new THREE.BufferAttribute(new Float32Array([
                                -1, 0, -1, 1, 0, 1
                            ]), 3)),
                        new THREE.LineBasicMaterial({ color: 0xFF0000 })
                    );
                    xLine.position.set(x, 0.3, z);
                    xLine.scale.set(1, 1, 1);
                    scene.add(xLine);
                    objects.push(xLine);
                }
            }
        }
    }

    function buildContainmentSilos() {
        var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var positions = [[-25, 0, -25], [-25, 0, 25], [25, 0, -25], [25, 0, 25]];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var siloGeo = new THREE.CylinderGeometry(4, 4, 18, 16);
            var siloMesh = addMesh(siloGeo, concreteMaterial, pos[0], 9, pos[2]);
            siloMesh.castShadow = true;
            siloMesh.receiveShadow = true;

            var domeGeo = new THREE.SphereGeometry(4, 16, 8);
            var domeMesh = addMesh(domeGeo, concreteMaterial, pos[0], 18, pos[2]);
            domeMesh.castShadow = true;
            domeMesh.receiveShadow = true;

            var pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
            var pipeMesh = addMesh(pipeGeo, concreteMaterial, pos[0] + 2, 12, pos[2] + 2);
            pipeMesh.castShadow = true;
            pipeMesh.receiveShadow = true;
        }

        for (var i = 0; i < 4; i++) {
            for (var j = i + 1; j < 4; j++) {
                var p1 = positions[i];
                var p2 = positions[j];
                var dx = p2[0] - p1[0];
                var dz = p2[2] - p1[2];
                var dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 60) {
                    var connectorGeo = new THREE.CylinderGeometry(0.5, 0.5, dist, 8);
                    var connectorMesh = new THREE.Mesh(connectorGeo, concreteMaterial);
                    connectorMesh.position.set((p1[0] + p2[0]) / 2, 10, (p1[2] + p2[2]) / 2);
                    connectorMesh.rotation.z = Math.atan2(dz, dx);
                    scene.add(connectorMesh);
                    objects.push(connectorMesh);
                }
            }
        }
    }

    function buildHazmatZone() {
        var yellowMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        var blackMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

        for (var i = -15; i <= 15; i += 5) {
            var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
            var postColor = (Math.abs(i) % 10 === 0) ? blackMaterial : yellowMaterial;
            var post1 = addMesh(postGeo, postColor, i, 1.5, -15);
            var post2 = addMesh(postGeo, postColor, i, 1.5, 15);
            var post3 = addMesh(postGeo, postColor, -15, 1.5, i);
            var post4 = addMesh(postGeo, postColor, 15, 1.5, i);
        }

        var caution = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
        for (var i = -12; i <= 12; i += 4) {
            var sphere1 = addMesh(new THREE.SphereGeometry(0.5, 8, 8), caution, i, 2, -14);
            var sphere2 = addMesh(new THREE.SphereGeometry(0.5, 8, 8), caution, i, 2, 14);
            var sphere3 = addMesh(new THREE.SphereGeometry(0.5, 8, 8), caution, -14, 2, i);
            var sphere4 = addMesh(new THREE.SphereGeometry(0.5, 8, 8), caution, 14, 2, i);
        }

        var tape1 = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -15, 3, -15, 15, 3, 15, -15, 3, 15, 15, 3, -15
                ]), 3)),
            new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 3 })
        );
        scene.add(tape1);
        objects.push(tape1);
    }

    function buildProcessingBuilding() {
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x111133 });

        var baseGeo = new THREE.BoxGeometry(20, 12, 16);
        var baseMesh = addMesh(baseGeo, stoneMaterial, -35, 6, 0);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;

        var roofGeo = new THREE.BoxGeometry(22, 2, 18);
        var roofMesh = addMesh(roofGeo, stoneMaterial, -35, 13, 0);
        roofMesh.castShadow = true;

        for (var i = 0; i < 6; i++) {
            var winGeo = new THREE.BoxGeometry(3, 3, 0.5);
            addMesh(winGeo, windowMaterial, -45 + i * 2, 8, -8.1);
            addMesh(winGeo, windowMaterial, -45 + i * 2, 8, 8.1);
        }

        for (var i = 0; i < 3; i++) {
            var vatGeo = new THREE.CylinderGeometry(2, 2, 8, 12);
            addMesh(vatGeo, new THREE.MeshLambertMaterial({ color: 0x777766 }), -40 + i * 5, 4, 0);
        }

        var grid1 = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -3, -3, 0, 3, 3, 0, -3, 3, 0, 3, -3, 0
                ]), 3)),
            new THREE.LineBasicMaterial({ color: 0x555555 })
        );
        grid1.position.set(-35, 8, -7.5);
        scene.add(grid1);
        objects.push(grid1);

        for (var i = 0; i < 4; i++) {
            var hoodGeo = new THREE.CylinderGeometry(1.5, 2, 1, 8);
            addMesh(hoodGeo, stoneMaterial, -45 + i * 4, 14, -5);
            addMesh(hoodGeo, stoneMaterial, -45 + i * 4, 14, 5);
        }
    }

    function buildDefensiveWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x666655 });

        var northWallGeo = new THREE.BoxGeometry(100, 8, 3);
        addMesh(northWallGeo, wallMaterial, 0, 4, -50);

        var southWallGeo = new THREE.BoxGeometry(100, 8, 3);
        addMesh(southWallGeo, wallMaterial, 0, 4, 50);

        var eastWallGeo = new THREE.BoxGeometry(3, 8, 100);
        addMesh(eastWallGeo, wallMaterial, 50, 4, 0);

        var westWallGeo = new THREE.BoxGeometry(3, 8, 100);
        addMesh(westWallGeo, wallMaterial, -50, 4, 0);

        var cornerPositions = [[-50, 4, -50], [-50, 4, 50], [50, 4, -50], [50, 4, 50]];
        for (var i = 0; i < cornerPositions.length; i++) {
            var corner = cornerPositions[i];
            var towerGeo = new THREE.CylinderGeometry(3, 3, 15, 8);
            addMesh(towerGeo, wallMaterial, corner[0], corner[1] + 7.5, corner[2]);
        }

        var razorWire = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -50, 9, -50, 50, 9, 50,
                    50, 9, -50, -50, 9, 50,
                    -50, 9, 50, 50, 9, 50,
                    -50, 9, -50, -50, 9, 50
                ]), 3)),
            new THREE.LineBasicMaterial({ color: 0xAA0000, linewidth: 2 })
        );
        scene.add(razorWire);
        objects.push(razorWire);
    }

    function buildToxicLeaks() {
        var leakMaterial = new THREE.MeshLambertMaterial({ color: 0x33AA11 });
        var leakPositions = [[-20, 0.5, -20], [20, 0.5, -10], [-10, 0.5, 20], [15, 0.5, -30], [-35, 0.5, 10]];

        for (var i = 0; i < leakPositions.length; i++) {
            var pos = leakPositions[i];
            var leakGeo = new THREE.BoxGeometry(4, 0.5, 4);
            addMesh(leakGeo, leakMaterial, pos[0], pos[1], pos[2]);
        }

        for (var i = 0; i < 5; i++) {
            for (var j = 0; j < 3; j++) {
                var cloudGeo = new THREE.SphereGeometry(1.2 + j * 0.4, 8, 8);
                var cloudMesh = addMesh(cloudGeo, new THREE.MeshLambertMaterial({ color: 0x44BB22 }),
                    leakPositions[i][0] + j * 2 - 2, leakPositions[i][1] + 3 + j, leakPositions[i][2]);
                cloudMesh.userData.toxicCloud = true;
                cloudMesh.userData.baseY = cloudMesh.position.y;
                toxicSpheres.push(cloudMesh);
            }
        }
    }

    function buildDecontamStation() {
        var deconMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

        var boothGeo = new THREE.BoxGeometry(8, 8, 8);
        addMesh(boothGeo, deconMaterial, 35, 4, -25);

        for (var i = 0; i < 4; i++) {
            var showerGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 6);
            addMesh(showerGeo, deconMaterial, 32 + i, 7, -25);
        }

        for (var i = 0; i < 2; i++) {
            var chamberGeo = new THREE.BoxGeometry(4, 5, 4);
            addMesh(chamberGeo, new THREE.MeshLambertMaterial({ color: 0x999988 }), 35 + i * 6, 2.5, -25);
        }

        var showerHeads = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    0, -2, -1, 0, -2, 1, -1, -2, 0, 1, -2, 0
                ]), 3)),
            new THREE.LineBasicMaterial({ color: 0x333333 })
        );
        showerHeads.position.set(33, 8, -25);
        scene.add(showerHeads);
        objects.push(showerHeads);
    }

    function buildWarningSystem() {
        var redMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var yellowMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

        var poles = [[-40, 0, -40], [40, 0, -40], [-40, 0, 40], [40, 0, 40], [0, 0, 0]];

        for (var i = 0; i < poles.length; i++) {
            var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 6);
            addMesh(poleGeo, new THREE.MeshLambertMaterial({ color: 0x555555 }), poles[i][0], 6, poles[i][2]);

            var light1 = addMesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8), redMaterial, poles[i][0], 11, poles[i][2]);
            light1.userData.warningLight = true;
            warningLights.push(light1);

            var light2 = addMesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8), yellowMaterial, poles[i][0], 9.5, poles[i][2]);
            light2.userData.warningLight = true;
            warningLights.push(light2);
        }

        var hazardTape = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -40, 12, -40, 40, 12, 40, -40, 12, 40, 40, 12, -40
                ]), 3)),
            new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 })
        );
        scene.add(hazardTape);
        objects.push(hazardTape);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x3A5A1A, 0.6);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 50, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        addLight(directionalLight);

        var toxicLightPositions = [[-25, 15, -25], [-25, 15, 25], [25, 15, -25], [25, 15, 25], [0, 20, 0]];
        for (var i = 0; i < toxicLightPositions.length; i++) {
            var pos = toxicLightPositions[i];
            var toxicLight = new THREE.PointLight(0x44FF22, 1.5, 40);
            toxicLight.position.set(pos[0], pos[1], pos[2]);
            addLight(toxicLight);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        toxicSpheres = [];
        warningLights = [];

        buildFortGround();
        buildContainmentSilos();
        buildHazmatZone();
        buildProcessingBuilding();
        buildDefensiveWalls();
        buildToxicLeaks();
        buildDecontamStation();
        buildWarningSystem();
        setupLighting();
    }

    function update(delta) {
        for (var i = 0; i < toxicSpheres.length; i++) {
            var sphere = toxicSpheres[i];
            sphere.position.y = sphere.userData.baseY + Math.sin(Date.now() * 0.003 + i) * 2;
        }

        for (var i = 0; i < warningLights.length; i++) {
            var light = warningLights[i];
            light.rotation.y += 3 * delta;
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
        toxicSpheres = [];
        warningLights = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
