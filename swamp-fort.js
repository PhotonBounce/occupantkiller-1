window.SwampFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animationState = { debrisOffset: 0, lightAngle: 0 };

    function buildWaterBase() {
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a2e });
        var waterGeometry = new THREE.BoxGeometry(200, 2, 200);
        var waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        waterMesh.position.y = -15;
        waterMesh.receiveShadow = true;
        scene.add(waterMesh);
        objects.push(waterMesh);
    }

    function buildWoodenPlatforms() {
        var platforms = [
            { x: -40, y: -5, z: 0, w: 40, h: 2, d: 30 },
            { x: 40, y: -5, z: 0, w: 40, h: 2, d: 30 },
            { x: 0, y: -5, z: -50, w: 30, h: 2, d: 40 },
            { x: 0, y: -5, z: 50, w: 30, h: 2, d: 40 },
            { x: -60, y: -5, z: 50, w: 25, h: 2, d: 25 },
            { x: 60, y: -5, z: -50, w: 25, h: 2, d: 25 }
        ];
        var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2511 });
        for (var i = 0; i < platforms.length; i++) {
            var p = platforms[i];
            var geom = new THREE.BoxGeometry(p.w, p.h, p.d);
            var mesh = new THREE.Mesh(geom, woodMaterial);
            mesh.position.set(p.x, p.y, p.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildPlatformSupports() {
        var supportPositions = [
            { x: -40, z: 0 },
            { x: 40, z: 0 },
            { x: 0, z: -50 },
            { x: 0, z: 50 },
            { x: -60, z: 50 },
            { x: 60, z: -50 }
        ];
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x3d1f0f });
        for (var i = 0; i < supportPositions.length; i++) {
            var pos = supportPositions[i];
            var geom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
            var mesh = new THREE.Mesh(geom, supportMaterial);
            mesh.position.set(pos.x, -15, pos.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildSandbagWalls() {
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var sandbagPositions = [
            { x: -40, z: -12 },
            { x: -40, z: 12 },
            { x: 40, z: -12 },
            { x: 40, z: 12 },
            { x: -12, z: -50 },
            { x: 12, z: -50 },
            { x: -12, z: 50 },
            { x: 12, z: 50 }
        ];
        for (var i = 0; i < sandbagPositions.length; i++) {
            var pos = sandbagPositions[i];
            for (var j = 0; j < 5; j++) {
                var geom = new THREE.BoxGeometry(3, 1.5, 2);
                var mesh = new THREE.Mesh(geom, sandbagMaterial);
                mesh.position.set(pos.x + (j % 2) * 4, -3 + j * 1.5, pos.z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                objects.push(mesh);
            }
        }
    }

    function buildGuardTowers() {
        var towerPositions = [
            { x: -70, z: -70 },
            { x: 70, z: -70 },
            { x: -70, z: 70 },
            { x: 70, z: 70 }
        ];
        var stilmaterial = new THREE.MeshLambertMaterial({ color: 0x3d1f0f });
        var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0x5c3d2e });

        for (var i = 0; i < towerPositions.length; i++) {
            var pos = towerPositions[i];

            // Stilt legs (4 per tower)
            for (var j = 0; j < 4; j++) {
                var legGeom = new THREE.CylinderGeometry(0.8, 0.8, 22, 6);
                var legMesh = new THREE.Mesh(legGeom, stilmaterial);
                var offset = j % 2 === 0 ? 3 : -3;
                var offsetZ = j < 2 ? 3 : -3;
                legMesh.position.set(pos.x + offset, -6, pos.z + offsetZ);
                legMesh.castShadow = true;
                scene.add(legMesh);
                objects.push(legMesh);
            }

            // Cabin box
            var cabinGeom = new THREE.BoxGeometry(10, 8, 10);
            var cabinMesh = new THREE.Mesh(cabinGeom, cabinMaterial);
            cabinMesh.position.set(pos.x, 6, pos.z);
            cabinMesh.castShadow = true;
            cabinMesh.receiveShadow = true;
            scene.add(cabinMesh);
            objects.push(cabinMesh);

            // Roof cone
            var roofGeom = new THREE.ConeGeometry(7, 6, 8);
            var roofMesh = new THREE.Mesh(roofGeom, new THREE.MeshLambertMaterial({ color: 0x2d5a3d }));
            roofMesh.position.set(pos.x, 14, pos.z);
            roofMesh.castShadow = true;
            scene.add(roofMesh);
            objects.push(roofMesh);
        }
    }

    function buildCypressTrees() {
        var treePositions = [
            { x: -50, z: -80 },
            { x: 50, z: -85 },
            { x: -55, z: 75 },
            { x: 55, z: 80 },
            { x: 0, z: -90 },
            { x: -90, z: 0 },
            { x: 90, z: 5 },
            { x: 30, z: -70 }
        ];
        var barkMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a3d });

        for (var i = 0; i < treePositions.length; i++) {
            var pos = treePositions[i];

            // Trunk
            var trunkGeom = new THREE.CylinderGeometry(1.2, 1.8, 18, 6);
            var trunkMesh = new THREE.Mesh(trunkGeom, barkMaterial);
            trunkMesh.position.set(pos.x, 0, pos.z);
            trunkMesh.castShadow = true;
            scene.add(trunkMesh);
            objects.push(trunkMesh);

            // Foliage clusters (cone and sphere)
            var foliageGeom1 = new THREE.ConeGeometry(4, 10, 6);
            var foliageMesh1 = new THREE.Mesh(foliageGeom1, foliageMaterial);
            foliageMesh1.position.set(pos.x, 8, pos.z);
            foliageMesh1.castShadow = true;
            scene.add(foliageMesh1);
            objects.push(foliageMesh1);

            var foliageGeom2 = new THREE.SphereGeometry(3.5, 6, 6);
            var foliageMesh2 = new THREE.Mesh(foliageGeom2, foliageMaterial);
            foliageMesh2.position.set(pos.x, 14, pos.z);
            foliageMesh2.castShadow = true;
            scene.add(foliageMesh2);
            objects.push(foliageMesh2);
        }
    }

    function buildRopeBridges() {
        var bridgeSegments = [
            { x1: -40, z1: 0, x2: 0, z2: -50, count: 12 },
            { x1: 40, z1: 0, x2: 0, z2: 50, count: 12 },
            { x1: -60, z1: 50, x2: 0, z2: 0, count: 10 }
        ];
        var plankMaterial = new THREE.MeshLambertMaterial({ color: 0x5c3d2e });
        var ropeMaterial = new THREE.MeshLambertMaterial({ color: 0x2d2416 });

        for (var i = 0; i < bridgeSegments.length; i++) {
            var bridge = bridgeSegments[i];
            var dx = (bridge.x2 - bridge.x1) / bridge.count;
            var dz = (bridge.z2 - bridge.z1) / bridge.count;

            for (var j = 0; j < bridge.count; j++) {
                var x = bridge.x1 + dx * j;
                var z = bridge.z1 + dz * j;

                // Plank
                var plankGeom = new THREE.BoxGeometry(2, 0.3, 3);
                var plankMesh = new THREE.Mesh(plankGeom, plankMaterial);
                plankMesh.position.set(x, 0, z);
                plankMesh.castShadow = true;
                scene.add(plankMesh);
                objects.push(plankMesh);

                // Rope posts (cylinders)
                var ropeGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 4);
                var ropeMesh = new THREE.Mesh(ropeGeom, ropeMaterial);
                ropeMesh.position.set(x - 1.2, 3, z);
                scene.add(ropeMesh);
                objects.push(ropeMesh);

                var ropeGeom2 = new THREE.CylinderGeometry(0.3, 0.3, 6, 4);
                var ropeMesh2 = new THREE.Mesh(ropeGeom2, ropeMaterial);
                ropeMesh2.position.set(x + 1.2, 3, z);
                scene.add(ropeMesh2);
                objects.push(ropeMesh2);
            }
        }
    }

    function buildAlligators() {
        var alligatorPositions = [
            { x: -80, z: 30 },
            { x: 70, z: -40 },
            { x: -20, z: 80 },
            { x: 85, z: 60 }
        ];
        var skinMaterial = new THREE.MeshLambertMaterial({ color: 0x1a4d2e });

        for (var i = 0; i < alligatorPositions.length; i++) {
            var pos = alligatorPositions[i];

            // Body
            var bodyGeom = new THREE.BoxGeometry(3, 1.5, 8);
            var bodyMesh = new THREE.Mesh(bodyGeom, skinMaterial);
            bodyMesh.position.set(pos.x, -12, pos.z);
            bodyMesh.castShadow = true;
            scene.add(bodyMesh);
            objects.push(bodyMesh);

            // Head
            var headGeom = new THREE.BoxGeometry(2, 1, 3);
            var headMesh = new THREE.Mesh(headGeom, skinMaterial);
            headMesh.position.set(pos.x, -12, pos.z + 5.5);
            headMesh.castShadow = true;
            scene.add(headMesh);
            objects.push(headMesh);

            // Tail
            var tailGeom = new THREE.BoxGeometry(1.2, 0.8, 6);
            var tailMesh = new THREE.Mesh(tailGeom, skinMaterial);
            tailMesh.position.set(pos.x, -12.5, pos.z - 6);
            tailMesh.castShadow = true;
            tailMesh.rotation.z = 0.2;
            scene.add(tailMesh);
            objects.push(tailMesh);

            // Bumps along back
            for (var j = 0; j < 5; j++) {
                var bumpGeom = new THREE.SphereGeometry(0.5, 4, 4);
                var bumpMesh = new THREE.Mesh(bumpGeom, skinMaterial);
                bumpMesh.position.set(pos.x, -10.5, pos.z - 2 + j * 2);
                scene.add(bumpMesh);
                objects.push(bumpMesh);
            }
        }
    }

    function buildCamouflageNetting() {
        var netPositions = [
            { x: -70, z: -70, size: 5 },
            { x: 70, z: 70, size: 5 },
            { x: -60, z: 50, size: 4 },
            { x: 60, z: -50, size: 4 },
            { x: 0, z: 0, size: 3 }
        ];
        var camoMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5f3f });

        for (var i = 0; i < netPositions.length; i++) {
            var net = netPositions[i];
            for (var j = 0; j < 6; j++) {
                var sphereGeom = new THREE.SphereGeometry(net.size / 1.5, 5, 5);
                var sphereMesh = new THREE.Mesh(sphereGeom, camoMaterial);
                var offsetX = (j % 3) * net.size;
                var offsetZ = Math.floor(j / 3) * net.size;
                sphereMesh.position.set(net.x + offsetX - net.size, 10 + j * 0.5, net.z + offsetZ - net.size);
                scene.add(sphereMesh);
                objects.push(sphereMesh);
            }
        }
    }

    function buildSupplyCrates() {
        var cratePositions = [
            { x: -35, z: 5 },
            { x: 35, z: -5 },
            { x: -5, z: -45 },
            { x: 5, z: 45 },
            { x: -65, z: 50 },
            { x: 65, z: -45 },
            { x: -30, z: 30 },
            { x: 25, z: -40 }
        ];
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });

        for (var i = 0; i < cratePositions.length; i++) {
            var pos = cratePositions[i];
            for (var j = 0; j < 3; j++) {
                var crateGeom = new THREE.BoxGeometry(3, 2, 3);
                var crateMesh = new THREE.Mesh(crateGeom, crateMaterial);
                crateMesh.position.set(pos.x + j * 3.5, -3 + j * 2, pos.z);
                crateMesh.castShadow = true;
                crateMesh.receiveShadow = true;
                scene.add(crateMesh);
                objects.push(crateMesh);
            }
        }
    }

    function buildAmmunitionBoxes() {
        var ammoPosisions = [
            { x: -40, z: 0 },
            { x: 40, z: 0 },
            { x: 0, z: -50 },
            { x: 0, z: 50 },
            { x: -25, z: -25 },
            { x: 25, z: 25 }
        ];
        var ammoMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        for (var i = 0; i < ammoPosisions.length; i++) {
            var pos = ammoPosisions[i];
            for (var j = 0; j < 4; j++) {
                var boxGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
                var boxMesh = new THREE.Mesh(boxGeom, ammoMaterial);
                var offsetX = (j % 2) * 2;
                var offsetZ = Math.floor(j / 2) * 2;
                boxMesh.position.set(pos.x + offsetX - 1, -2, pos.z + offsetZ - 1);
                boxMesh.castShadow = true;
                boxMesh.receiveShadow = true;
                scene.add(boxMesh);
                objects.push(boxMesh);
            }
        }
    }

    function buildFloatingDebris() {
        var debrisMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3f2f });
        var debrisCount = 15;

        for (var i = 0; i < debrisCount; i++) {
            var x = Math.random() * 160 - 80;
            var z = Math.random() * 160 - 80;
            var debrisGeom = new THREE.BoxGeometry(1 + Math.random() * 2, 0.5, 1 + Math.random() * 2);
            var debrisMesh = new THREE.Mesh(debrisGeom, debrisMaterial);
            debrisMesh.position.set(x, -13 + Math.random() * 2, z);
            debrisMesh.rotation.z = Math.random() * Math.PI;
            debrisMesh.castShadow = true;
            scene.add(debrisMesh);
            objects.push(debrisMesh);
        }
    }

    function buildGuardLights() {
        var lightPositions = [
            { x: -70, z: -70 },
            { x: 70, z: -70 },
            { x: -70, z: 70 },
            { x: 70, z: 70 }
        ];

        for (var i = 0; i < lightPositions.length; i++) {
            var pos = lightPositions[i];
            var light = new THREE.PointLight(0xffcc66, 0.6, 40);
            light.position.set(pos.x, 12, pos.z);
            light.castShadow = true;
            scene.add(light);
            lights.push(light);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animationState = { debrisOffset: 0, lightAngle: 0 };

        buildWaterBase();
        buildWoodenPlatforms();
        buildPlatformSupports();
        buildSandbagWalls();
        buildGuardTowers();
        buildCypressTrees();
        buildRopeBridges();
        buildAlligators();
        buildCamouflageNetting();
        buildSupplyCrates();
        buildAmmunitionBoxes();
        buildFloatingDebris();
        buildGuardLights();

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        animationState.debrisOffset += delta * 0.3;
        animationState.lightAngle += delta * 0.5;

        // Animate floating debris
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].userData && objects[i].userData.isDebris) {
                objects[i].position.y = objects[i].userData.baseY + Math.sin(animationState.debrisOffset + i) * 0.5;
            }
        }

        // Rotate guard lights slightly
        for (var i = 0; i < lights.length; i++) {
            if (lights[i] instanceof THREE.PointLight) {
                lights[i].position.x += Math.sin(animationState.lightAngle + i) * 0.02;
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
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
