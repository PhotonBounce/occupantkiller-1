window.FogValley = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animationOffsets = [];

    function buildFogSpheres() {
        var fogSpheres = [];
        for (var i = 0; i < 150; i++) {
            var radius = Math.random() * 8 + 3;
            var geometry = new THREE.SphereGeometry(radius, 8, 8);
            var material = new THREE.MeshLambertMaterial({
                color: 0xd0d0d0,
                transparent: true,
                opacity: 0.15,
                emissive: 0x404040
            });
            var sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(
                Math.random() * 400 - 200,
                Math.random() * 200 - 50,
                Math.random() * 400 - 200
            );
            scene.add(sphere);
            objects.push(sphere);
            fogSpheres.push(sphere);
            animationOffsets.push({
                x: Math.random() * Math.PI * 2,
                y: Math.random() * Math.PI * 2,
                z: Math.random() * Math.PI * 2,
                speedX: (Math.random() - 0.5) * 0.0003,
                speedY: (Math.random() - 0.5) * 0.0003,
                speedZ: (Math.random() - 0.5) * 0.0003
            });
        }
        return fogSpheres;
    }

    function buildMountainRidges() {
        var ridgeBoxes = [];
        for (var i = 0; i < 12; i++) {
            var height = Math.random() * 60 + 40;
            var width = Math.random() * 30 + 20;
            var depth = Math.random() * 40 + 30;
            var geometry = new THREE.BoxGeometry(width, height, depth);
            var colorChoice = Math.random();
            var color;
            if (colorChoice < 0.4) {
                color = 0x5a5a5a;
            } else if (colorChoice < 0.7) {
                color = 0x6b5a4a;
            } else {
                color = 0x4a5a4a;
            }
            var material = new THREE.MeshLambertMaterial({ color: color });
            var box = new THREE.Mesh(geometry, material);
            box.position.set(
                Math.random() * 350 - 175,
                height / 2 + Math.random() * 20,
                Math.random() * 350 - 175
            );
            box.castShadow = true;
            box.receiveShadow = true;
            scene.add(box);
            objects.push(box);
            ridgeBoxes.push(box);
        }
        return ridgeBoxes;
    }

    function buildMilitaryBunkers() {
        var bunkers = [];
        var bunkerPositions = [
            { x: -80, z: -100 },
            { x: 100, z: 80 },
            { x: 40, z: -150 }
        ];
        for (var i = 0; i < bunkerPositions.length; i++) {
            var pos = bunkerPositions[i];
            var mainGeometry = new THREE.BoxGeometry(25, 15, 30);
            var mainMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var mainBox = new THREE.Mesh(mainGeometry, mainMaterial);
            mainBox.position.set(pos.x, 8, pos.z);
            mainBox.castShadow = true;
            mainBox.receiveShadow = true;
            scene.add(mainBox);
            objects.push(mainBox);
            bunkers.push(mainBox);

            for (var j = 0; j < 3; j++) {
                var roofGeometry = new THREE.BoxGeometry(12, 3, 8);
                var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
                var roofBox = new THREE.Mesh(roofGeometry, roofMaterial);
                roofBox.position.set(
                    pos.x - 8 + j * 8,
                    18,
                    pos.z - 12
                );
                scene.add(roofBox);
                objects.push(roofBox);
                bunkers.push(roofBox);
            }

            for (var k = 0; k < 4; k++) {
                var sandbagGeometry = new THREE.BoxGeometry(4, 2, 4);
                var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x6b7a5a });
                var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
                sandbag.position.set(
                    pos.x - 10 + k * 6,
                    11,
                    pos.z + 15
                );
                scene.add(sandbag);
                objects.push(sandbag);
                bunkers.push(sandbag);
            }
        }
        return bunkers;
    }

    function buildWatchtowers() {
        var towers = [];
        var towerPositions = [
            { x: -120, z: 120 },
            { x: 130, z: -140 }
        ];
        for (var i = 0; i < towerPositions.length; i++) {
            var pos = towerPositions[i];
            var baseGeometry = new THREE.CylinderGeometry(6, 8, 3, 12);
            var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var baseBox = new THREE.Mesh(baseGeometry, baseMaterial);
            baseBox.position.set(pos.x, 2, pos.z);
            scene.add(baseBox);
            objects.push(baseBox);
            towers.push(baseBox);

            for (var j = 0; j < 5; j++) {
                var poleGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
                var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
                var pole = new THREE.Mesh(poleGeometry, poleMaterial);
                pole.position.set(
                    pos.x - 4 + j * 2,
                    12,
                    pos.z
                );
                scene.add(pole);
                objects.push(pole);
                towers.push(pole);
            }

            var platformGeometry = new THREE.BoxGeometry(18, 2, 18);
            var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(pos.x, 21, pos.z);
            scene.add(platform);
            objects.push(platform);
            towers.push(platform);

            var radarGeometry = new THREE.SphereGeometry(4, 8, 8);
            var radarMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a, emissive: 0x333333 });
            var radar = new THREE.Mesh(radarGeometry, radarMaterial);
            radar.position.set(pos.x, 27, pos.z);
            scene.castShadow = true;
            scene.add(radar);
            objects.push(radar);
            towers.push(radar);
        }
        return towers;
    }

    function buildMilitaryVehicles() {
        var vehicles = [];
        var vehiclePositions = [
            { x: -60, z: -80, type: 'jeep' },
            { x: 70, z: 100, type: 'apc' },
            { x: 20, z: -120, type: 'jeep' },
            { x: -100, z: 40, type: 'apc' }
        ];
        for (var i = 0; i < vehiclePositions.length; i++) {
            var vpos = vehiclePositions[i];
            var bodyGeometry = new THREE.BoxGeometry(8, 6, 14);
            var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5a3a });
            var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.position.set(vpos.x, 3, vpos.z);
            body.castShadow = true;
            scene.add(body);
            objects.push(body);
            vehicles.push(body);

            for (var w = 0; w < 4; w++) {
                var wheelGeometry = new THREE.CylinderGeometry(2, 2, 2, 8);
                var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                var wheelX = (w < 2) ? -3 : 3;
                var wheelZ = (w % 2 === 0) ? -5 : 5;
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(vpos.x + wheelX, 2, vpos.z + wheelZ);
                scene.add(wheel);
                objects.push(wheel);
                vehicles.push(wheel);
            }

            var cabinGeometry = new THREE.BoxGeometry(6, 5, 8);
            var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
            var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
            cabin.position.set(vpos.x, 8, vpos.z - 3);
            scene.add(cabin);
            objects.push(cabin);
            vehicles.push(cabin);

            if (vpos.type === 'apc') {
                var turretGeometry = new THREE.SphereGeometry(2.5, 8, 8);
                var turretMaterial = new THREE.MeshLambertMaterial({ color: 0x2a3a2a });
                var turret = new THREE.Mesh(turretGeometry, turretMaterial);
                turret.position.set(vpos.x, 11, vpos.z);
                scene.add(turret);
                objects.push(turret);
                vehicles.push(turret);

                var gunGeometry = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
                var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
                var gun = new THREE.Mesh(gunGeometry, gunMaterial);
                gun.rotation.z = Math.PI / 2.2;
                gun.position.set(vpos.x + 5, 12, vpos.z);
                scene.add(gun);
                objects.push(gun);
                vehicles.push(gun);
            }
        }
        return vehicles;
    }

    function buildBridges() {
        var bridges = [];
        var bridgePositions = [
            { x: 0, z: 0 },
            { x: -80, z: 60 },
            { x: 90, z: -70 }
        ];
        for (var i = 0; i < bridgePositions.length; i++) {
            var bpos = bridgePositions[i];
            var deckGeometry = new THREE.BoxGeometry(12, 1, 35);
            var deckMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var deck = new THREE.Mesh(deckGeometry, deckMaterial);
            deck.position.set(bpos.x, 20, bpos.z);
            deck.castShadow = true;
            deck.receiveShadow = true;
            scene.add(deck);
            objects.push(deck);
            bridges.push(deck);

            for (var j = 0; j < 3; j++) {
                var supportGeometry = new THREE.CylinderGeometry(1.2, 1.2, 25, 8);
                var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
                var support = new THREE.Mesh(supportGeometry, supportMaterial);
                support.position.set(
                    bpos.x - 4 + j * 4,
                    7.5,
                    bpos.z
                );
                scene.add(support);
                objects.push(support);
                bridges.push(support);
            }

            for (var k = 0; k < 5; k++) {
                var railGeometry = new THREE.BoxGeometry(1, 2, 35);
                var railMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
                var rail = new THREE.Mesh(railGeometry, railMaterial);
                rail.position.set(
                    bpos.x - 5 + k * 2.5,
                    21.5,
                    bpos.z
                );
                scene.add(rail);
                objects.push(rail);
                bridges.push(rail);
            }
        }
        return bridges;
    }

    function buildCreeperVines() {
        var vines = [];
        var vinePositions = [
            { x: -100, z: -60 },
            { x: 80, z: 90 },
            { x: 40, z: 50 }
        ];
        for (var i = 0; i < vinePositions.length; i++) {
            var vpos = vinePositions[i];
            for (var j = 0; j < 4; j++) {
                var stalkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 18, 6);
                var stalkMaterial = new THREE.MeshLambertMaterial({ color: 0x3a5a3a });
                var stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
                stalk.rotation.z = Math.random() * 0.4 - 0.2;
                stalk.position.set(
                    vpos.x - 3 + j * 2,
                    12,
                    vpos.z
                );
                scene.add(stalk);
                objects.push(stalk);
                vines.push(stalk);

                for (var l = 0; l < 3; l++) {
                    var leafGeometry = new THREE.SphereGeometry(1.5, 6, 6);
                    var leafMaterial = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
                    var leaf = new THREE.Mesh(leafGeometry, leafMaterial);
                    leaf.position.set(
                        vpos.x - 3 + j * 2 + Math.random() * 2 - 1,
                        18 - l * 5,
                        vpos.z + Math.random() * 2 - 1
                    );
                    scene.add(leaf);
                    objects.push(leaf);
                    vines.push(leaf);
                }
            }
        }
        return vines;
    }

    function buildRockFormations() {
        var rocks = [];
        var rockPositions = [];
        for (var r = 0; r < 30; r++) {
            rockPositions.push({
                x: Math.random() * 300 - 150,
                y: Math.random() * 15,
                z: Math.random() * 300 - 150
            });
        }
        for (var i = 0; i < rockPositions.length; i++) {
            var rpos = rockPositions[i];
            var rockGeometry = new THREE.SphereGeometry(Math.random() * 2 + 1, 6, 6);
            var rockColor = [0x6a6a6a, 0x5a5a5a, 0x7a7a7a][Math.floor(Math.random() * 3)];
            var rockMaterial = new THREE.MeshLambertMaterial({ color: rockColor });
            var rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(rpos.x, rpos.y, rpos.z);
            rock.castShadow = true;
            rock.receiveShadow = true;
            scene.add(rock);
            objects.push(rock);
            rocks.push(rock);
        }
        return rocks;
    }

    function buildLights() {
        var ambientLight = new THREE.AmbientLight(0x505050);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var dirLight = new THREE.DirectionalLight(0x808080, 0.6);
        dirLight.position.set(200, 150, 200);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -300;
        dirLight.shadow.camera.right = 300;
        dirLight.shadow.camera.top = 300;
        dirLight.shadow.camera.bottom = -300;
        scene.add(dirLight);
        lights.push(dirLight);

        var mistLight = new THREE.PointLight(0x707080, 0.4, 200);
        mistLight.position.set(-100, 50, -100);
        scene.add(mistLight);
        lights.push(mistLight);

        var mistLight2 = new THREE.PointLight(0x707080, 0.3, 180);
        mistLight2.position.set(120, 40, 110);
        scene.add(mistLight2);
        lights.push(mistLight2);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animationOffsets = [];

        scene.background = new THREE.Color(0x3a4a5a);
        scene.fog = new THREE.Fog(0x5a6a7a, 200, 500);

        buildLights();
        buildFogSpheres();
        buildMountainRidges();
        buildMilitaryBunkers();
        buildWatchtowers();
        buildMilitaryVehicles();
        buildBridges();
        buildCreeperVines();
        buildRockFormations();
    }

    function update(delta) {
        for (var i = 0; i < objects.length && i < animationOffsets.length; i++) {
            if (i < 150) {
                var offset = animationOffsets[i];
                var obj = objects[i];
                var originalX = Math.random() * 400 - 200;
                var originalY = Math.random() * 200 - 50;
                var originalZ = Math.random() * 400 - 200;
                offset.x += offset.speedX * delta * 1000;
                offset.y += offset.speedY * delta * 1000;
                offset.z += offset.speedZ * delta * 1000;
                obj.position.x += Math.sin(offset.x) * 0.001 * delta * 1000;
                obj.position.y += Math.sin(offset.y) * 0.0005 * delta * 1000;
                obj.position.z += Math.sin(offset.z) * 0.001 * delta * 1000;
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
        animationOffsets = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
