window.AshLake = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var gasParticles = [];
    var ashDriftTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        gasParticles = [];
        ashDriftTime = 0;
        buildLakebed();
        buildAshShore();
        buildRuins();
        buildBoats();
        buildSulfurVents();
        buildDeadTrees();
        buildAshDrifts();
        buildObservationPost();
        buildVehicleWreck();
        buildWarningMarkers();
        buildAtmosphere();
        setupLighting();
    }

    function update(delta) {
        ashDriftTime += delta;
        for (var i = 0; i < gasParticles.length; i++) {
            var particle = gasParticles[i];
            particle.position.y += delta * 0.5;
            particle.position.x += Math.sin(ashDriftTime * 0.5 + i) * delta * 0.2;
            particle.position.z += Math.cos(ashDriftTime * 0.3 + i * 0.7) * delta * 0.15;
            particle.scale.x = 1.0 + Math.sin(ashDriftTime + i) * 0.3;
            particle.scale.y = 1.0 + Math.cos(ashDriftTime * 0.8 + i) * 0.3;
            particle.scale.z = 1.0 + Math.sin(ashDriftTime * 0.6 + i) * 0.3;
            if (particle.position.y > 30) {
                particle.position.y = -2;
                particle.position.x = (Math.random() - 0.5) * 200;
                particle.position.z = (Math.random() - 0.5) * 200;
            }
        }
    }

    function buildLakebed() {
        var geometry = new THREE.BoxGeometry(200, 2, 200);
        var material = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var lakebed = new THREE.Mesh(geometry, material);
        lakebed.position.y = -5;
        lakebed.receiveShadow = true;
        scene.add(lakebed);
        objects.push(lakebed);
    }

    function buildAshShore() {
        var shorePositions = [
            { x: -90, z: 0, w: 30, d: 180 },
            { x: 90, z: 0, w: 30, d: 180 },
            { x: 0, z: -90, w: 180, d: 30 },
            { x: 0, z: 90, w: 180, d: 30 }
        ];
        for (var i = 0; i < shorePositions.length; i++) {
            var pos = shorePositions[i];
            var geometry = new THREE.BoxGeometry(pos.w, 1.5, pos.d);
            var material = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
            var shore = new THREE.Mesh(geometry, material);
            shore.position.set(pos.x, -3.5, pos.z);
            shore.receiveShadow = true;
            shore.castShadow = true;
            scene.add(shore);
            objects.push(shore);
        }
        for (var j = 0; j < 12; j++) {
            var angle = (j / 12) * Math.PI * 2;
            var rippleGeometry = new THREE.BoxGeometry(3, 0.3, 80);
            var rippleMaterial = new THREE.MeshLambertMaterial({ color: 0xB0B0B0 });
            var ripple = new THREE.Mesh(rippleGeometry, rippleMaterial);
            ripple.position.set(Math.cos(angle) * 85, -3.0, Math.sin(angle) * 85);
            ripple.rotation.y = angle;
            scene.add(ripple);
            objects.push(ripple);
        }
    }

    function buildRuins() {
        var ruinPositions = [
            { x: -60, z: -50 },
            { x: 40, z: -60 },
            { x: -40, z: 50 },
            { x: 60, z: 40 },
            { x: 0, z: -70 }
        ];
        for (var i = 0; i < ruinPositions.length; i++) {
            var pos = ruinPositions[i];
            var geometry = new THREE.BoxGeometry(12, 3, 15);
            var material = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
            var ruin = new THREE.Mesh(geometry, material);
            ruin.position.set(pos.x, -2, pos.z);
            ruin.receiveShadow = true;
            ruin.castShadow = true;
            scene.add(ruin);
            objects.push(ruin);
            var roofGeometry = new THREE.BoxGeometry(12, 1, 15);
            var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
            var roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(pos.x, 1.5, pos.z);
            roof.castShadow = true;
            scene.add(roof);
            objects.push(roof);
        }
        for (var j = 0; j < 8; j++) {
            var rubbleGeometry = new THREE.BoxGeometry(2 + Math.random() * 3, 1 + Math.random() * 2, 2 + Math.random() * 3);
            var rubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x656565 });
            var rubble = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
            rubble.position.set((Math.random() - 0.5) * 150, 0.5, (Math.random() - 0.5) * 150);
            rubble.rotation.set(Math.random() * 1.5, Math.random() * 6.28, Math.random() * 1.5);
            scene.add(rubble);
            objects.push(rubble);
        }
    }

    function buildBoats() {
        var boatPositions = [
            { x: -70, z: 30 },
            { x: 50, z: -40 },
            { x: 20, z: 60 }
        ];
        for (var i = 0; i < boatPositions.length; i++) {
            var pos = boatPositions[i];
            var hullGeometry = new THREE.BoxGeometry(8, 3, 18);
            var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
            var hull = new THREE.Mesh(hullGeometry, hullMaterial);
            hull.position.set(pos.x, -2, pos.z);
            hull.castShadow = true;
            hull.receiveShadow = true;
            scene.add(hull);
            objects.push(hull);
            var deckGeometry = new THREE.BoxGeometry(8, 0.8, 18);
            var deckMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var deck = new THREE.Mesh(deckGeometry, deckMaterial);
            deck.position.set(pos.x, 1, pos.z);
            deck.castShadow = true;
            scene.add(deck);
            objects.push(deck);
            var mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
            var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x707070 });
            var mast = new THREE.Mesh(mastGeometry, mastMaterial);
            mast.position.set(pos.x, 6, pos.z);
            mast.castShadow = true;
            scene.add(mast);
            objects.push(mast);
        }
    }

    function buildSulfurVents() {
        var ventPositions = [
            { x: -50, z: 20 },
            { x: 70, z: -30 },
            { x: 10, z: -80 },
            { x: -80, z: -50 }
        ];
        for (var i = 0; i < ventPositions.length; i++) {
            var pos = ventPositions[i];
            var ventGeometry = new THREE.CylinderGeometry(1.2, 1.5, 2, 12);
            var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
            var vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.position.set(pos.x, -3, pos.z);
            vent.castShadow = true;
            scene.add(vent);
            objects.push(vent);
            for (var j = 0; j < 3; j++) {
                var cloudGeometry = new THREE.SphereGeometry(2 + j * 0.5, 8, 8);
                var cloudMaterial = new THREE.MeshLambertMaterial({ color: 0xDDDD88, emissive: 0x444400 });
                var cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
                cloud.position.set(pos.x + (Math.random() - 0.5) * 3, 2 + j * 1.5, pos.z + (Math.random() - 0.5) * 3);
                cloud.castShadow = true;
                scene.add(cloud);
                objects.push(cloud);
                gasParticles.push(cloud);
            }
        }
    }

    function buildDeadTrees() {
        var treePositions = [
            { x: -75, z: -70 },
            { x: 65, z: 50 },
            { x: -45, z: 65 },
            { x: 75, z: -20 },
            { x: -30, z: -30 },
            { x: 50, z: 70 }
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var pos = treePositions[i];
            var trunkGeometry = new THREE.CylinderGeometry(0.6, 0.8, 12, 6);
            var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0xD0D0D0 });
            var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(pos.x, 0, pos.z);
            trunk.castShadow = true;
            scene.add(trunk);
            objects.push(trunk);
            var branch1Geometry = new THREE.CylinderGeometry(0.2, 0.2, 6, 4);
            var branchMaterial = new THREE.MeshLambertMaterial({ color: 0xC8C8C8 });
            var branch1 = new THREE.Mesh(branch1Geometry, branchMaterial);
            branch1.position.set(pos.x + 3, 5, pos.z);
            branch1.rotation.z = 0.5;
            branch1.castShadow = true;
            scene.add(branch1);
            objects.push(branch1);
            var branch2 = new THREE.Mesh(branch1Geometry, branchMaterial);
            branch2.position.set(pos.x - 3, 5, pos.z + 2);
            branch2.rotation.z = -0.5;
            branch2.castShadow = true;
            scene.add(branch2);
            objects.push(branch2);
        }
    }

    function buildAshDrifts() {
        var driftPositions = [
            { x: -85, z: -85, r: 4 },
            { x: 85, z: 85, r: 3.5 },
            { x: -75, z: 60, r: 3 },
            { x: 70, z: -70, r: 4.2 },
            { x: 30, z: 30, r: 2.8 },
            { x: -50, z: 80, r: 3.5 },
            { x: 80, z: 20, r: 3.2 },
            { x: -80, z: 0, r: 3.8 }
        ];
        for (var i = 0; i < driftPositions.length; i++) {
            var pos = driftPositions[i];
            var geometry = new THREE.SphereGeometry(pos.r, 12, 12);
            var material = new THREE.MeshLambertMaterial({ color: 0xB8B8B8 });
            var drift = new THREE.Mesh(geometry, material);
            drift.position.set(pos.x, -1, pos.z);
            drift.castShadow = true;
            drift.receiveShadow = true;
            scene.add(drift);
            objects.push(drift);
        }
    }

    function buildObservationPost() {
        var hillGeometry = new THREE.SphereGeometry(25, 16, 16);
        var hillMaterial = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });
        var hill = new THREE.Mesh(hillGeometry, hillMaterial);
        hill.position.set(-95, -2, -95);
        hill.scale.y = 0.6;
        hill.castShadow = true;
        hill.receiveShadow = true;
        scene.add(hill);
        objects.push(hill);
        var platformGeometry = new THREE.BoxGeometry(14, 1.5, 14);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(-95, 13, -95);
        platform.castShadow = true;
        platform.receiveShadow = true;
        scene.add(platform);
        objects.push(platform);
        var towerGeometry = new THREE.CylinderGeometry(1.2, 1.5, 15, 8);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(-95, 21, -95);
        tower.castShadow = true;
        scene.add(tower);
        objects.push(tower);
        var rampGeometry = new THREE.BoxGeometry(10, 1, 20);
        var rampMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var ramp = new THREE.Mesh(rampGeometry, rampMaterial);
        ramp.position.set(-85, 5, -80);
        ramp.rotation.z = 0.3;
        ramp.castShadow = true;
        scene.add(ramp);
        objects.push(ramp);
    }

    function buildVehicleWreck() {
        var chassisGeometry = new THREE.BoxGeometry(8, 2, 14);
        var chassisMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
        chassis.position.set(60, -2, 20);
        chassis.rotation.z = 0.15;
        chassis.castShadow = true;
        scene.add(chassis);
        objects.push(chassis);
        var cabGeometry = new THREE.BoxGeometry(6, 3, 5);
        var cabMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var cab = new THREE.Mesh(cabGeometry, cabMaterial);
        cab.position.set(60, 2, 24);
        cab.castShadow = true;
        scene.add(cab);
        objects.push(cab);
        for (var i = 0; i < 4; i++) {
            var wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.8, 12);
            var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
            var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            var xOff = (i < 2) ? -3 : 3;
            var zOff = (i % 2 === 0) ? -5 : 5;
            wheel.position.set(60 + xOff, -3, 20 + zOff);
            wheel.rotation.z = 1.57;
            wheel.castShadow = true;
            scene.add(wheel);
            objects.push(wheel);
        }
        var bedGeometry = new THREE.BoxGeometry(6, 2, 8);
        var bedMaterial = new THREE.MeshLambertMaterial({ color: 0x656565 });
        var bed = new THREE.Mesh(bedGeometry, bedMaterial);
        bed.position.set(60, 0.5, 13);
        bed.castShadow = true;
        scene.add(bed);
        objects.push(bed);
    }

    function buildWarningMarkers() {
        var markerPositions = [
            { x: -40, z: 0 },
            { x: 40, z: 0 },
            { x: 0, z: -40 },
            { x: 0, z: 40 },
            { x: -28, z: -28 },
            { x: 28, z: 28 }
        ];
        for (var i = 0; i < markerPositions.length; i++) {
            var pos = markerPositions[i];
            var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
            var postMaterial = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
            var post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(pos.x, 0, pos.z);
            post.castShadow = true;
            scene.add(post);
            objects.push(post);
            var flagGeometry = new THREE.BoxGeometry(2, 1.5, 0.2);
            var flagMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
            var flag = new THREE.Mesh(flagGeometry, flagMaterial);
            flag.position.set(pos.x + 1.5, 3, pos.z);
            flag.castShadow = true;
            scene.add(flag);
            objects.push(flag);
        }
    }

    function buildAtmosphere() {
        for (var i = 0; i < 20; i++) {
            var particleGeometry = new THREE.SphereGeometry(0.8, 8, 8);
            var particleMaterial = new THREE.MeshLambertMaterial({ color: 0xE0E0E0, emissive: 0x333333 });
            var particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 200);
            particle.castShadow = true;
            scene.add(particle);
            objects.push(particle);
            gasParticles.push(particle);
        }
        for (var j = 0; j < 15; j++) {
            var driftGeometry = new THREE.SphereGeometry(0.5, 6, 6);
            var driftMaterial = new THREE.MeshLambertMaterial({ color: 0xD8D8D8, emissive: 0x222222 });
            var drift = new THREE.Mesh(driftGeometry, driftMaterial);
            drift.position.set((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 25, (Math.random() - 0.5) * 200);
            scene.add(drift);
            objects.push(drift);
            gasParticles.push(drift);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x808080, 0.8);
        scene.add(ambientLight);
        lights.push(ambientLight);
        var directionalLight = new THREE.DirectionalLight(0xFFFFDD, 0.6);
        directionalLight.position.set(50, 60, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        scene.add(directionalLight);
        lights.push(directionalLight);
        var pointLight1 = new THREE.PointLight(0xFFDD99, 0.4, 60);
        pointLight1.position.set(-50, 5, 20);
        pointLight1.castShadow = true;
        scene.add(pointLight1);
        lights.push(pointLight1);
        var pointLight2 = new THREE.PointLight(0xDDEEFF, 0.3, 50);
        pointLight2.position.set(70, 8, -30);
        scene.add(pointLight2);
        lights.push(pointLight2);
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
        gasParticles = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
