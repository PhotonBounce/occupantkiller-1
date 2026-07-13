window.FireRidge = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var fireballss = [];
    var time = 0;

    function buildRidgeTerrain() {
        var terrainColor = 0x2a2a2a;
        var geometry;
        var material = new THREE.MeshLambertMaterial({ color: terrainColor });
        var mesh;
        var heights = [0.5, 1.2, 2.5, 4.0, 5.5, 6.8];
        for (var i = 0; i < heights.length; i++) {
            var scale = 15 - i * 2;
            geometry = new THREE.BoxGeometry(scale, heights[i], 20);
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.z = -10 - i * 8;
            mesh.position.y = heights[i] / 2;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildFireline() {
        var fireColor1 = 0xff3300;
        var fireColor2 = 0xffaa00;
        var positions = [
            [-15, 7.5, -50], [-8, 8.2, -55], [0, 8.8, -60],
            [8, 8.1, -62], [15, 7.9, -58], [-12, 7.3, -48],
            [5, 8.5, -58], [-5, 8.0, -52], [12, 7.6, -61]
        ];
        for (var i = 0; i < positions.length; i++) {
            for (var j = 0; j < 4; j++) {
                var geometry = new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 8, 8);
                var material = new THREE.MeshLambertMaterial({
                    color: j % 2 === 0 ? fireColor1 : fireColor2,
                    emissive: j % 2 === 0 ? 0x660000 : 0x664400
                });
                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.x = positions[i][0] + (Math.random() - 0.5) * 2;
                mesh.position.y = positions[i][1] + j * 0.8;
                mesh.position.z = positions[i][2] + (Math.random() - 0.5) * 1;
                scene.add(mesh);
                objects.push(mesh);
                fireballss.push(mesh);
            }
        }
    }

    function buildTrenchwork() {
        var trenchColor = 0x4a3f2f;
        var trenchDepth = 1.5;
        var positions = [
            [-18, 4.5, -30], [-10, 5.5, -35], [2, 6.5, -42],
            [12, 6.2, -45], [-15, 3.8, -40], [8, 5.8, -38]
        ];
        for (var i = 0; i < positions.length; i++) {
            var geometry = new THREE.BoxGeometry(12, trenchDepth, 3);
            var material = new THREE.MeshLambertMaterial({ color: trenchColor });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = positions[i][0];
            mesh.position.y = positions[i][1] - trenchDepth / 2;
            mesh.position.z = positions[i][2];
            mesh.rotation.y = Math.random() * 0.3;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildArtillery() {
        var barrelColor = 0x8b8b7a;
        var carriageColor = 0x5a5a4a;
        var positions = [
            [-20, 7.0, -70], [-8, 7.2, -72], [6, 7.1, -71], [18, 7.3, -73]
        ];
        for (var i = 0; i < positions.length; i++) {
            var carriageGeometry = new THREE.BoxGeometry(3, 1.5, 4);
            var carriageMaterial = new THREE.MeshLambertMaterial({ color: carriageColor });
            var carriage = new THREE.Mesh(carriageGeometry, carriageMaterial);
            carriage.position.set(positions[i][0], positions[i][1], positions[i][2]);
            scene.add(carriage);
            objects.push(carriage);
            var barrelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 8, 16);
            var barrelMaterial = new THREE.MeshLambertMaterial({ color: barrelColor });
            var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.position.copy(carriage.position);
            barrel.position.y += 1.0;
            barrel.rotation.z = -0.3;
            scene.add(barrel);
            objects.push(barrel);
        }
    }

    function buildForwardBase() {
        var platformColor = 0x6b5a4a;
        var platformGeometry = new THREE.BoxGeometry(10, 0.8, 10);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: platformColor });
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(-25, 8.5, -20);
        scene.add(platform);
        objects.push(platform);
        var supportsPos = [
            [-20, 5.5, -15], [-30, 5.5, -15], [-20, 5.5, -25], [-30, 5.5, -25]
        ];
        for (var i = 0; i < supportsPos.length; i++) {
            var supportGeometry = new THREE.CylinderGeometry(0.4, 0.5, 4, 12);
            var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
            var support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(supportsPos[i][0], supportsPos[i][1], supportsPos[i][2]);
            scene.add(support);
            objects.push(support);
        }
    }

    function buildObservation() {
        var postColor = 0x8b7355;
        var postGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3.5, 12);
        var postMaterial = new THREE.MeshLambertMaterial({ color: postColor });
        var post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(22, 7.5, -15);
        scene.add(post);
        objects.push(post);
        var binocGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.5, 12);
        var binocMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var binoc = new THREE.Mesh(binocGeometry, binocMaterial);
        binoc.position.copy(post.position);
        binoc.position.y += 2.0;
        binoc.rotation.z = Math.PI / 4;
        scene.add(binoc);
        objects.push(binoc);
    }

    function buildCharredTrees() {
        var treePositions = [
            [-35, 3.5, -25], [-28, 3.2, -18], [-22, 3.8, -32],
            [25, 3.4, -35], [32, 3.1, -28], [28, 3.6, -40],
            [-5, 3.3, -10], [15, 3.5, -12], [-18, 3.2, -5],
            [8, 3.4, -25], [-12, 3.1, -38], [20, 3.3, -48],
            [-30, 3.6, -45], [35, 3.2, -55], [-8, 3.5, -65]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var trunkGeometry = new THREE.CylinderGeometry(0.25, 0.35, 4 + Math.random() * 2, 8);
            var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
            var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(treePositions[i][0], treePositions[i][1], treePositions[i][2]);
            trunk.rotation.z = (Math.random() - 0.5) * 0.4;
            scene.add(trunk);
            objects.push(trunk);
        }
    }

    function buildAmmunitionDump() {
        var crateColor = 0x8b7355;
        var positions = [
            [20, 4.0, -50], [22, 4.5, -50], [24, 5.0, -50],
            [20, 4.0, -48], [22, 4.5, -48], [24, 5.0, -48],
            [20, 4.0, -46], [22, 4.5, -46], [24, 5.0, -46]
        ];
        for (var i = 0; i < positions.length; i++) {
            var crateGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
            var crateMaterial = new THREE.MeshLambertMaterial({ color: crateColor });
            var crate = new THREE.Mesh(crateGeometry, crateMaterial);
            crate.position.set(positions[i][0], positions[i][1], positions[i][2]);
            scene.add(crate);
            objects.push(crate);
        }
    }

    function buildBunker() {
        var bunkerColor = 0x6b5a4a;
        var bunkerGeometry = new THREE.BoxGeometry(6, 2.5, 4);
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: bunkerColor });
        var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
        bunker.position.set(-32, 6.5, -55);
        scene.add(bunker);
        objects.push(bunker);
        var sandbagPositions = [
            [-29, 6.0, -57], [-32, 6.0, -57], [-35, 6.0, -57],
            [-29, 6.5, -57], [-32, 6.5, -57], [-35, 6.5, -57]
        ];
        for (var i = 0; i < sandbagPositions.length; i++) {
            var sandbagGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.8);
            var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x9a8a7a });
            var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
            sandbag.position.set(sandbagPositions[i][0], sandbagPositions[i][1], sandbagPositions[i][2]);
            scene.add(sandbag);
            objects.push(sandbag);
        }
    }

    function buildShellCraters() {
        var craterPositions = [
            [-15, 2.8, -28], [5, 3.2, -32], [18, 3.5, -45],
            [-8, 2.9, -50], [12, 3.1, -58], [-22, 3.0, -62]
        ];
        for (var i = 0; i < craterPositions.length; i++) {
            var craterGeometry = new THREE.CylinderGeometry(3, 2.5, 1.5, 16);
            var craterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var crater = new THREE.Mesh(craterGeometry, craterMaterial);
            crater.position.set(craterPositions[i][0], craterPositions[i][1], craterPositions[i][2]);
            crater.scale.y = 0.4;
            scene.add(crater);
            objects.push(crater);
        }
    }

    function buildFallenTrees() {
        var fallenPositions = [
            [-10, 3.8, -38, 0.6], [8, 4.0, -42, -0.5], [-18, 3.5, -48, 0.3],
            [15, 3.9, -35, -0.4], [-25, 3.7, -50, 0.5]
        ];
        for (var i = 0; i < fallenPositions.length; i++) {
            var barkColor = 0x3a3a2a;
            var trunkGeometry = new THREE.CylinderGeometry(0.2, 0.25, 5, 8);
            var trunkMaterial = new THREE.MeshLambertMaterial({ color: barkColor });
            var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(fallenPositions[i][0], fallenPositions[i][1], fallenPositions[i][2]);
            trunk.rotation.z = fallenPositions[i][3];
            scene.add(trunk);
            objects.push(trunk);
        }
    }

    function buildBurningVehicle() {
        var hullColor = 0x4a4a3a;
        var hullGeometry = new THREE.BoxGeometry(2.5, 1.5, 5);
        var hullMaterial = new THREE.MeshLambertMaterial({ color: hullColor });
        var hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.set(35, 3.5, -30);
        scene.add(hull);
        objects.push(hull);
        var wheelPositions = [
            [33.5, 2.5, -27], [36.5, 2.5, -27],
            [33.5, 2.5, -33], [36.5, 2.5, -33]
        ];
        for (var i = 0; i < wheelPositions.length; i++) {
            var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
            var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(wheelPositions[i][0], wheelPositions[i][1], wheelPositions[i][2]);
            wheel.rotation.z = Math.PI / 2;
            scene.add(wheel);
            objects.push(wheel);
        }
        for (var j = 0; j < 5; j++) {
            var fireGeometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.4, 8, 8);
            var fireMaterial = new THREE.MeshLambertMaterial({
                color: j % 2 === 0 ? 0xff3300 : 0xffaa00,
                emissive: j % 2 === 0 ? 0x660000 : 0x664400
            });
            var fire = new THREE.Mesh(fireGeometry, fireMaterial);
            fire.position.set(35 + (Math.random() - 0.5) * 2, 5.0 + j * 0.6, -30 + (Math.random() - 0.5));
            scene.add(fire);
            objects.push(fire);
            fireballss.push(fire);
        }
    }

    function buildSignalFlags() {
        var flagPositions = [
            [-28, 7.0, -35], [16, 7.5, -50], [-10, 6.8, -65]
        ];
        for (var i = 0; i < flagPositions.length; i++) {
            var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4, 8);
            var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
            var pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(flagPositions[i][0], flagPositions[i][1], flagPositions[i][2]);
            scene.add(pole);
            objects.push(pole);
            var flagGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.1);
            var flagColor = [0xff0000, 0x00ff00, 0xffff00][i];
            var flagMaterial = new THREE.MeshLambertMaterial({ color: flagColor });
            var flag = new THREE.Mesh(flagGeometry, flagMaterial);
            flag.position.set(flagPositions[i][0] + 0.8, flagPositions[i][1] + 0.5, flagPositions[i][2]);
            scene.add(flag);
            objects.push(flag);
        }
    }

    function buildSupplyArea() {
        var containerColor = 0x8b7a6a;
        var containerPositions = [
            [28, 3.8, -60], [30, 4.2, -60], [32, 4.6, -60],
            [28, 3.8, -58], [30, 4.2, -58], [32, 4.6, -58]
        ];
        for (var i = 0; i < containerPositions.length; i++) {
            var containerGeometry = new THREE.BoxGeometry(1.5, 1.0, 1.5);
            var containerMaterial = new THREE.MeshLambertMaterial({ color: containerColor });
            var container = new THREE.Mesh(containerGeometry, containerMaterial);
            container.position.set(containerPositions[i][0], containerPositions[i][1], containerPositions[i][2]);
            scene.add(container);
            objects.push(container);
        }
    }

    function buildConeFeatures() {
        var sandheapPositions = [
            [-35, 2.5, -38], [36, 2.8, -42], [-6, 2.3, -55]
        ];
        for (var i = 0; i < sandheapPositions.length; i++) {
            var sandheapGeometry = new THREE.ConeGeometry(2.0, 2.5, 16);
            var sandheapMaterial = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
            var sandheap = new THREE.Mesh(sandheapGeometry, sandheapMaterial);
            sandheap.position.set(sandheapPositions[i][0], sandheapPositions[i][1], sandheapPositions[i][2]);
            scene.add(sandheap);
            objects.push(sandheap);
        }
    }

    function buildSmokePoles() {
        var smokePositions = [
            [-20, 7.5, -70], [5, 7.8, -72], [25, 7.6, -65]
        ];
        for (var i = 0; i < smokePositions.length; i++) {
            var poleGeometry = new THREE.CylinderGeometry(0.2, 0.25, 6, 12);
            var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
            var pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(smokePositions[i][0], smokePositions[i][1], smokePositions[i][2]);
            scene.add(pole);
            objects.push(pole);
            for (var j = 0; j < 3; j++) {
                var smokeGeometry = new THREE.SphereGeometry(0.6 + j * 0.3, 8, 8);
                var smokeMaterial = new THREE.MeshLambertMaterial({
                    color: 0x666666,
                    transparent: true,
                    opacity: 0.4
                });
                var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
                smoke.position.set(smokePositions[i][0], smokePositions[i][1] + 3 + j * 1.5, smokePositions[i][2]);
                scene.add(smoke);
                objects.push(smoke);
                fireballss.push(smoke);
            }
        }
    }

    function buildDefenseLines() {
        var barricadePositions = [
            [12, 4.0, -28], [-12, 4.2, -32], [24, 4.1, -40],
            [-28, 3.9, -48], [18, 4.3, -55]
        ];
        for (var i = 0; i < barricadePositions.length; i++) {
            var barricadeGeometry = new THREE.BoxGeometry(4, 1.2, 0.6);
            var barricadeMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
            var barricade = new THREE.Mesh(barricadeGeometry, barricadeMaterial);
            barricade.position.set(barricadePositions[i][0], barricadePositions[i][1], barricadePositions[i][2]);
            barricade.rotation.y = Math.random() * 0.4;
            scene.add(barricade);
            objects.push(barricade);
        }
    }

    function buildEarthworks() {
        var bunkColor = 0x6a5a4a;
        var bunkPositions = [
            [-6, 5.5, -25], [14, 6.0, -40], [-20, 5.2, -58]
        ];
        for (var i = 0; i < bunkPositions.length; i++) {
            var bunkGeometry = new THREE.BoxGeometry(3.5, 1.8, 3.5);
            var bunkMaterial = new THREE.MeshLambertMaterial({ color: bunkColor });
            var bunk = new THREE.Mesh(bunkGeometry, bunkMaterial);
            bunk.position.set(bunkPositions[i][0], bunkPositions[i][1], bunkPositions[i][2]);
            scene.add(bunk);
            objects.push(bunk);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x666666);
        scene.add(ambientLight);
        lights.push(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 80, 30);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);
        var fireLight1 = new THREE.PointLight(0xff5500, 1.5, 40);
        fireLight1.position.set(-8, 8.5, -55);
        scene.add(fireLight1);
        lights.push(fireLight1);
        var fireLight2 = new THREE.PointLight(0xff3300, 1.2, 35);
        fireLight2.position.set(35, 5.5, -30);
        scene.add(fireLight2);
        lights.push(fireLight2);
    }

    function update(delta) {
        time += delta;
        for (var i = 0; i < fireballss.length; i++) {
            var fireball = fireballss[i];
            var flicker = 0.8 + Math.sin(time * 8 + i) * 0.2;
            fireball.scale.set(flicker, flicker, flicker);
            if (i < 5) {
                fireball.position.y += Math.sin(time * 3 + i) * 0.05;
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
        fireballss = [];
        scene = null;
        camera = null;
        time = 0;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        fireballss = [];
        time = 0;
        buildRidgeTerrain();
        buildFireline();
        buildTrenchwork();
        buildArtillery();
        buildForwardBase();
        buildObservation();
        buildCharredTrees();
        buildAmmunitionDump();
        buildBunker();
        buildShellCraters();
        buildFallenTrees();
        buildBurningVehicle();
        buildSignalFlags();
        buildSupplyArea();
        buildConeFeatures();
        buildSmokePoles();
        buildDefenseLines();
        buildEarthworks();
        setupLighting();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
