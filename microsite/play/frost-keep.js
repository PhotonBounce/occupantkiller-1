window.FrostKeep = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animatedObjects = [];
    var searchlightGroup = null;
    var crystalGroup = null;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animatedObjects = [];
        buildKeepWalls();
        buildTowers();
        buildIceFormations();
        buildMilitaryAdditions();
        buildCourtyard();
        buildGate();
        buildMoat();
        buildSnowDrifts();
        setupLighting();
    }

    function buildKeepWalls() {
        var stoneGray = 0x5a5a5a;
        var iceBlue = 0x7bb3d6;

        // Main keep perimeter walls - 4 walls forming square
        var wallGeometry = new THREE.BoxGeometry(60, 15, 2);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: stoneGray });

        // North wall
        var northWall = new THREE.Mesh(wallGeometry, wallMaterial);
        northWall.position.set(0, 7.5, -30);
        scene.add(northWall);
        objects.push(northWall);

        // South wall
        var southWall = new THREE.Mesh(wallGeometry, wallMaterial);
        southWall.position.set(0, 7.5, 30);
        scene.add(southWall);
        objects.push(southWall);

        // East wall
        var eastWallGeometry = new THREE.BoxGeometry(2, 15, 62);
        var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(30, 7.5, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        // West wall
        var westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        westWall.position.set(-30, 7.5, 0);
        scene.add(westWall);
        objects.push(westWall);

        // Add ice patches to walls
        var iceMaterial = new THREE.MeshLambertMaterial({ color: iceBlue });

        for (var i = 0; i < 12; i++) {
            var iceGeometry = new THREE.BoxGeometry(4, 3, 1);
            var icePatch = new THREE.Mesh(iceGeometry, iceMaterial);
            icePatch.position.set(
                Math.random() * 50 - 25,
                Math.random() * 12 + 2,
                -29 + Math.random() * 2
            );
            scene.add(icePatch);
            objects.push(icePatch);
        }

        for (var i = 0; i < 12; i++) {
            var iceGeometry = new THREE.BoxGeometry(4, 3, 1);
            var icePatch = new THREE.Mesh(iceGeometry, iceMaterial);
            icePatch.position.set(
                Math.random() * 50 - 25,
                Math.random() * 12 + 2,
                29 - Math.random() * 2
            );
            scene.add(icePatch);
            objects.push(icePatch);
        }

        for (var i = 0; i < 8; i++) {
            var iceGeometry = new THREE.BoxGeometry(1, 3, 4);
            var icePatch = new THREE.Mesh(iceGeometry, iceMaterial);
            icePatch.position.set(
                29 - Math.random() * 2,
                Math.random() * 12 + 2,
                Math.random() * 50 - 25
            );
            scene.add(icePatch);
            objects.push(icePatch);
        }

        for (var i = 0; i < 8; i++) {
            var iceGeometry = new THREE.BoxGeometry(1, 3, 4);
            var icePatch = new THREE.Mesh(iceGeometry, iceMaterial);
            icePatch.position.set(
                -29 + Math.random() * 2,
                Math.random() * 12 + 2,
                Math.random() * 50 - 25
            );
            scene.add(icePatch);
            objects.push(icePatch);
        }
    }

    function buildTowers() {
        var stoneGray = 0x5a5a5a;
        var iceBlue = 0x7bb3d6;
        var iceMaterial = new THREE.MeshLambertMaterial({ color: iceBlue });
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: stoneGray });

        // 4 corner towers
        var towers = [
            { x: -28, z: -28 },
            { x: 28, z: -28 },
            { x: -28, z: 28 },
            { x: 28, z: 28 }
        ];

        towers.forEach(function(pos) {
            // Tower body - cylinder
            var towerGeometry = new THREE.CylinderGeometry(5, 5.5, 18, 8);
            var tower = new THREE.Mesh(towerGeometry, stoneMaterial);
            tower.position.set(pos.x, 9, pos.z);
            scene.add(tower);
            objects.push(tower);

            // Ice cap - cone on top
            var iceCapGeometry = new THREE.ConeGeometry(5.5, 5, 8);
            var iceCap = new THREE.Mesh(iceCapGeometry, iceMaterial);
            iceCap.position.set(pos.x, 23, pos.z);
            scene.add(iceCap);
            objects.push(iceCap);

            // Ice bands around tower (3 rings)
            for (var b = 0; b < 3; b++) {
                var bandGeometry = new THREE.CylinderGeometry(5.7, 5.7, 1.5, 8);
                var band = new THREE.Mesh(bandGeometry, iceMaterial);
                band.position.set(pos.x, 8 + b * 5, pos.z);
                scene.add(band);
                objects.push(band);
            }

            // Battlements on top (small boxes around tower rim)
            for (var j = 0; j < 4; j++) {
                var angle = j * Math.PI / 2;
                var battleGeometry = new THREE.BoxGeometry(2, 2, 2);
                var battle = new THREE.Mesh(battleGeometry, stoneMaterial);
                battle.position.set(
                    pos.x + Math.cos(angle) * 6,
                    20,
                    pos.z + Math.sin(angle) * 6
                );
                scene.add(battle);
                objects.push(battle);
            }
        });
    }

    function buildIceFormations() {
        var pureWhite = 0xffffff;
        var iceBlue = 0x7bb3d6;
        var lightIce = 0xc0e0ff;
        var iceMaterial = new THREE.MeshLambertMaterial({ color: lightIce });

        crystalGroup = new THREE.Group();

        // Ice stalactites hanging from battlements
        for (var i = 0; i < 16; i++) {
            var stalactiteGeometry = new THREE.ConeGeometry(0.8, 4, 6);
            var stalactite = new THREE.Mesh(stalactiteGeometry, iceMaterial);
            stalactite.position.set(
                Math.random() * 50 - 25,
                18 + Math.random() * 2,
                Math.random() * 50 - 25
            );
            crystalGroup.add(stalactite);
            animatedObjects.push({ obj: stalactite, type: 'shimmer' });
        }

        // Crystal spikes at base corners
        var cornerCrystals = [
            { x: -25, z: -25 },
            { x: 25, z: -25 },
            { x: -25, z: 25 },
            { x: 25, z: 25 }
        ];

        cornerCrystals.forEach(function(pos) {
            for (var c = 0; c < 6; c++) {
                var crystalGeometry = new THREE.SphereGeometry(1.2, 6, 6);
                var crystal = new THREE.Mesh(crystalGeometry, iceMaterial);
                crystal.scale.set(1, 1.5, 1);
                crystal.position.set(
                    pos.x + Math.random() * 2 - 1,
                    0.5 + c * 0.8,
                    pos.z + Math.random() * 2 - 1
                );
                crystalGroup.add(crystal);
                animatedObjects.push({ obj: crystal, type: 'shimmer' });
            }
        });

        // Scattered ice clusters throughout courtyard
        for (var s = 0; s < 12; s++) {
            var clusterGeometry = new THREE.SphereGeometry(1.5, 6, 6);
            var cluster = new THREE.Mesh(clusterGeometry, iceMaterial);
            cluster.position.set(
                Math.random() * 40 - 20,
                1,
                Math.random() * 40 - 20
            );
            crystalGroup.add(cluster);
            animatedObjects.push({ obj: cluster, type: 'shimmer' });
        }

        scene.add(crystalGroup);
        objects.push(crystalGroup);
    }

    function buildMilitaryAdditions() {
        var oliveGreen = 0x556b2f;
        var darkSteel = 0x3a3a3a;
        var gunmetal = 0x4a4a5a;
        var oliveMaterial = new THREE.MeshLambertMaterial({ color: oliveGreen });
        var steelMaterial = new THREE.MeshLambertMaterial({ color: darkSteel });
        var gunmetalMaterial = new THREE.MeshLambertMaterial({ color: gunmetal });

        // Sandbag walls - stacked boxes along perimeter
        for (var i = 0; i < 8; i++) {
            // North side
            var bagGeometry = new THREE.BoxGeometry(4, 2, 2);
            var bag = new THREE.Mesh(bagGeometry, oliveMaterial);
            bag.position.set(-20 + i * 5, 1, -25);
            scene.add(bag);
            objects.push(bag);
        }

        for (var i = 0; i < 8; i++) {
            // South side
            var bagGeometry = new THREE.BoxGeometry(4, 2, 2);
            var bag = new THREE.Mesh(bagGeometry, oliveMaterial);
            bag.position.set(-20 + i * 5, 1, 25);
            scene.add(bag);
            objects.push(bag);
        }

        // Military equipment boxes (cargo containers)
        var containerPositions = [
            { x: -15, z: 0 },
            { x: 15, z: 0 },
            { x: 0, z: -15 },
            { x: 0, z: 15 },
            { x: -10, z: -10 },
            { x: 10, z: -10 },
            { x: -10, z: 10 },
            { x: 10, z: 10 }
        ];

        containerPositions.forEach(function(pos) {
            var containerGeometry = new THREE.BoxGeometry(6, 4, 4);
            var container = new THREE.Mesh(containerGeometry, steelMaterial);
            container.position.set(pos.x, 2, pos.z);
            scene.add(container);
            objects.push(container);
        });

        // Gun emplacements - cylindrical mounts
        for (var g = 0; g < 6; g++) {
            var mountGeometry = new THREE.CylinderGeometry(1.2, 1.5, 2, 8);
            var mount = new THREE.Mesh(mountGeometry, gunmetalMaterial);
            mount.position.set(
                Math.random() * 30 - 15,
                1,
                Math.random() * 30 - 15
            );
            scene.add(mount);
            objects.push(mount);
        }

        // Radar dish on northeast tower
        var dishGeometry = new THREE.SphereGeometry(3, 8, 4);
        var dish = new THREE.Mesh(dishGeometry, gunmetalMaterial);
        dish.scale.set(1, 0.3, 1);
        dish.position.set(28, 26, -28);
        scene.add(dish);
        objects.push(dish);

        // Radar dish pole
        var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 6);
        var pole = new THREE.Mesh(poleGeometry, gunmetalMaterial);
        pole.position.set(28, 24, -28);
        scene.add(pole);
        objects.push(pole);

        // Searchlight on northwest tower
        searchlightGroup = new THREE.Group();
        var lightBaseGeometry = new THREE.CylinderGeometry(1.5, 2, 1, 8);
        var lightBase = new THREE.Mesh(lightBaseGeometry, gunmetalMaterial);
        lightBase.position.set(-28, 24, -28);
        searchlightGroup.add(lightBase);

        var lightBarrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 5, 8);
        var lightBarrel = new THREE.Mesh(lightBarrelGeometry, gunmetalMaterial);
        lightBarrel.position.set(0, 2, 0);
        lightBarrel.rotation.x = 0.3;
        searchlightGroup.add(lightBarrel);

        scene.add(searchlightGroup);
        objects.push(searchlightGroup);

        // Anti-aircraft guns - small cylindrical turrets
        for (var a = 0; a < 4; a++) {
            var gunGeometry = new THREE.CylinderGeometry(0.8, 1, 1.5, 6);
            var gun = new THREE.Mesh(gunGeometry, gunmetalMaterial);
            gun.position.set(
                Math.random() * 40 - 20,
                3,
                Math.random() * 40 - 20
            );
            scene.add(gun);
            objects.push(gun);
        }
    }

    function buildCourtyard() {
        var frostWhite = 0xf0f8ff;
        var darkStone = 0x4a4a4a;
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: darkStone });
        var whiteMaterial = new THREE.MeshLambertMaterial({ color: frostWhite });

        // Courtyard ground - stone with frost
        var groundGeometry = new THREE.BoxGeometry(56, 0.5, 56);
        var ground = new THREE.Mesh(groundGeometry, stoneMaterial);
        ground.position.set(0, 0.25, 0);
        scene.add(ground);
        objects.push(ground);

        // Frost crystals scattered across ground
        for (var f = 0; f < 20; f++) {
            var frostGeometry = new THREE.SphereGeometry(0.5, 4, 4);
            var frost = new THREE.Mesh(frostGeometry, whiteMaterial);
            frost.position.set(
                Math.random() * 50 - 25,
                0.3,
                Math.random() * 50 - 25
            );
            scene.add(frost);
            objects.push(frost);
            animatedObjects.push({ obj: frost, type: 'shimmer' });
        }

        // Central frozen fountain (cylindrical base with spheres)
        var fountainBaseGeometry = new THREE.CylinderGeometry(3, 4, 1.5, 8);
        var fountainBase = new THREE.Mesh(fountainBaseGeometry, stoneMaterial);
        fountainBase.position.set(0, 0.75, 0);
        scene.add(fountainBase);
        objects.push(fountainBase);

        // Fountain ice column
        var columnGeometry = new THREE.CylinderGeometry(2, 2.5, 8, 8);
        var column = new THREE.Mesh(columnGeometry, whiteMaterial);
        column.position.set(0, 5, 0);
        scene.add(column);
        objects.push(column);
    }

    function buildGate() {
        var stoneGray = 0x5a5a5a;
        var darkIron = 0x2a2a2a;
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: stoneGray });
        var ironMaterial = new THREE.MeshLambertMaterial({ color: darkIron });

        // Gate frame - two towers with connecting top
        // Left tower
        var leftGateGeometry = new THREE.BoxGeometry(3, 10, 3);
        var leftGate = new THREE.Mesh(leftGateGeometry, stoneMaterial);
        leftGate.position.set(-5, 5, -30);
        scene.add(leftGate);
        objects.push(leftGate);

        // Right tower
        var rightGateGeometry = new THREE.BoxGeometry(3, 10, 3);
        var rightGate = new THREE.Mesh(rightGateGeometry, stoneMaterial);
        rightGate.position.set(5, 5, -30);
        scene.add(rightGate);
        objects.push(rightGate);

        // Gate lintel (top connecting piece)
        var lintelGeometry = new THREE.BoxGeometry(13, 2, 3);
        var lintel = new THREE.Mesh(lintelGeometry, stoneMaterial);
        lintel.position.set(0, 10, -30);
        scene.add(lintel);
        objects.push(lintel);

        // Portcullis - vertical iron bars
        for (var p = 0; p < 8; p++) {
            var barPoints = [
                new THREE.Vector3(-4 + p * 1, 0, -29),
                new THREE.Vector3(-4 + p * 1, 8, -29)
            ];
            var barGeometry = new THREE.BufferGeometry().setFromPoints(barPoints);
            var bar = new THREE.LineSegments(barGeometry, new THREE.LineBasicMaterial({ color: darkIron, linewidth: 2 }));
            scene.add(bar);
            objects.push(bar);
        }

        // Horizontal portcullis bars
        for (var h = 0; h < 5; h++) {
            var hbarPoints = [
                new THREE.Vector3(-4, h * 2, -29),
                new THREE.Vector3(4, h * 2, -29)
            ];
            var hbarGeometry = new THREE.BufferGeometry().setFromPoints(hbarPoints);
            var hbar = new THREE.LineSegments(hbarGeometry, new THREE.LineBasicMaterial({ color: darkIron, linewidth: 2 }));
            scene.add(hbar);
            objects.push(hbar);
        }
    }

    function buildMoat() {
        var darkBlue = 0x1a3a4a;
        var moatMaterial = new THREE.MeshLambertMaterial({ color: darkBlue });

        // Outer moat walls (forming a ring)
        // North outer moat
        var northMoatGeometry = new THREE.BoxGeometry(70, 3, 4);
        var northMoat = new THREE.Mesh(northMoatGeometry, moatMaterial);
        northMoat.position.set(0, 1.5, -38);
        scene.add(northMoat);
        objects.push(northMoat);

        // South outer moat
        var southMoatGeometry = new THREE.BoxGeometry(70, 3, 4);
        var southMoat = new THREE.Mesh(southMoatGeometry, moatMaterial);
        southMoat.position.set(0, 1.5, 38);
        scene.add(southMoat);
        objects.push(southMoat);

        // East outer moat
        var eastMoatGeometry = new THREE.BoxGeometry(4, 3, 70);
        var eastMoat = new THREE.Mesh(eastMoatGeometry, moatMaterial);
        eastMoat.position.set(38, 1.5, 0);
        scene.add(eastMoat);
        objects.push(eastMoat);

        // West outer moat
        var westMoatGeometry = new THREE.BoxGeometry(4, 3, 70);
        var westMoat = new THREE.Mesh(westMoatGeometry, moatMaterial);
        westMoat.position.set(-38, 1.5, 0);
        scene.add(westMoat);
        objects.push(westMoat);

        // Inner moat water
        var moatWaterGeometry = new THREE.BoxGeometry(66, 0.2, 66);
        var moatWater = new THREE.Mesh(moatWaterGeometry, new THREE.MeshLambertMaterial({ color: 0x0a2a3a }));
        moatWater.position.set(0, 1.1, 0);
        scene.add(moatWater);
        objects.push(moatWater);
    }

    function buildSnowDrifts() {
        var snowWhite = 0xffffff;
        var snowMaterial = new THREE.MeshLambertMaterial({ color: snowWhite });

        // Snow drift mounds against walls
        var driftPositions = [
            { x: -20, z: -31 },
            { x: 0, z: -31 },
            { x: 20, z: -31 },
            { x: -20, z: 31 },
            { x: 0, z: 31 },
            { x: 20, z: 31 },
            { x: -31, z: -15 },
            { x: -31, z: 0 },
            { x: -31, z: 15 },
            { x: 31, z: -15 },
            { x: 31, z: 0 },
            { x: 31, z: 15 }
        ];

        driftPositions.forEach(function(pos) {
            var driftGeometry = new THREE.SphereGeometry(2, 6, 6);
            var drift = new THREE.Mesh(driftGeometry, snowMaterial);
            drift.scale.set(2, 0.8, 1.5);
            drift.position.set(pos.x, 0.5, pos.z);
            scene.add(drift);
            objects.push(drift);
        });

        // Additional scattered snow patches
        for (var n = 0; n < 10; n++) {
            var patchGeometry = new THREE.SphereGeometry(1.5, 5, 5);
            var patch = new THREE.Mesh(patchGeometry, snowMaterial);
            patch.scale.set(1.5, 0.5, 1.2);
            patch.position.set(
                Math.random() * 50 - 25,
                0.3,
                Math.random() * 50 - 25
            );
            scene.add(patch);
            objects.push(patch);
        }
    }

    function setupLighting() {
        // Ambient light for base illumination
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (moonlight through frost)
        var directionalLight = new THREE.DirectionalLight(0xc0e0ff, 0.6);
        directionalLight.position.set(20, 30, 20);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        // Cold blue point lights for ice formations
        var iceLight1 = new THREE.PointLight(0x7bb3d6, 0.4, 30);
        iceLight1.position.set(-25, 15, -25);
        scene.add(iceLight1);
        lights.push(iceLight1);

        var iceLight2 = new THREE.PointLight(0x7bb3d6, 0.4, 30);
        iceLight2.position.set(25, 15, 25);
        scene.add(iceLight2);
        lights.push(iceLight2);

        // Military spotlight from searchlight
        var spotLight = new THREE.SpotLight(0xffffff, 0.8, 60, Math.PI / 6, 0.5, 2);
        spotLight.position.set(-28, 26, -28);
        spotLight.target.position.set(10, 0, 0);
        scene.add(spotLight);
        lights.push(spotLight);
    }

    function update(delta) {
        // Animate ice crystal shimmer
        for (var i = 0; i < animatedObjects.length; i++) {
            var obj = animatedObjects[i].obj;
            if (animatedObjects[i].type === 'shimmer') {
                var shimmer = Math.sin(Date.now() * 0.002 + i) * 0.05 + 1;
                obj.scale.y = shimmer;
            }
        }

        // Rotate searchlight
        if (searchlightGroup) {
            searchlightGroup.rotation.y += delta * 0.3;
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
        scene = null;
        camera = null;
        searchlightGroup = null;
        crystalGroup = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
