window.GrimYard = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function buildGround() {
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var groundGeo = new THREE.BoxGeometry(200, 1, 200);
        var ground = new THREE.Mesh(groundGeo, groundMaterial);
        ground.position.y = -0.5;
        scene.add(ground);
        objects.push(ground);
    }

    function buildWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var wireTopMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        var positions = [
            { x: 0, z: -95, rx: 0, rz: 0 },
            { x: 0, z: 95, rx: 0, rz: 0 },
            { x: -95, z: 0, rx: 0, rz: Math.PI / 2 },
            { x: 95, z: 0, rx: 0, rz: Math.PI / 2 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var wallGeo = new THREE.BoxGeometry(200, 25, 4);
            var wall = new THREE.Mesh(wallGeo, wallMaterial);
            wall.position.set(pos.x, 12.5, pos.z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            objects.push(wall);

            var wireGeo = new THREE.BoxGeometry(200, 3, 4);
            var wire = new THREE.Mesh(wireGeo, wireTopMaterial);
            wire.position.set(pos.x, 26, pos.z);
            scene.add(wire);
            objects.push(wire);

            for (var j = -90; j < 90; j += 10) {
                var spikeGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
                var spike = new THREE.Mesh(spikeGeo, wireTopMaterial);
                if (pos.rx === 0) {
                    spike.position.set(pos.x + j, 28, pos.z);
                } else {
                    spike.position.set(pos.x, 28, pos.z + j);
                }
                scene.add(spike);
                objects.push(spike);
            }
        }
    }

    function buildTowers() {
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var searchlightMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        var corners = [
            { x: -95, z: -95 },
            { x: 95, z: -95 },
            { x: -95, z: 95 },
            { x: 95, z: 95 }
        ];

        for (var i = 0; i < corners.length; i++) {
            var corner = corners[i];

            var towerGeo = new THREE.BoxGeometry(8, 35, 8);
            var tower = new THREE.Mesh(towerGeo, towerMaterial);
            tower.position.set(corner.x, 17.5, corner.z);
            tower.castShadow = true;
            scene.add(tower);
            objects.push(tower);

            var searchlightGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
            var searchlight = new THREE.Mesh(searchlightGeo, searchlightMaterial);
            searchlight.position.set(corner.x, 37, corner.z);
            searchlight.castShadow = true;
            scene.add(searchlight);
            objects.push(searchlight);

            var lensGeo = new THREE.SphereGeometry(1.2, 16, 16);
            var lensMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
            var lens = new THREE.Mesh(lensGeo, lensMaterial);
            lens.position.set(corner.x, 39.5, corner.z);
            scene.add(lens);
            objects.push(lens);

            var platformGeo = new THREE.BoxGeometry(12, 1, 12);
            var platform = new THREE.Mesh(platformGeo, towerMaterial);
            platform.position.set(corner.x, 36, corner.z);
            scene.add(platform);
            objects.push(platform);

            for (var j = 0; j < 4; j++) {
                var railGeo = new THREE.BoxGeometry(0.3, 2, 10);
                var rail = new THREE.Mesh(railGeo, towerMaterial);
                rail.position.set(corner.x + (j % 2 === 0 ? -5 : 5), 37, corner.z + (j < 2 ? -5 : 5));
                scene.add(rail);
                objects.push(rail);
            }
        }
    }

    function buildCages() {
        var barMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });

        var cagePositions = [
            { x: -50, z: -40 },
            { x: -50, z: 0 },
            { x: -50, z: 40 },
            { x: 0, z: -40 },
            { x: 0, z: 40 },
            { x: 50, z: -40 },
            { x: 50, z: 0 },
            { x: 50, z: 40 }
        ];

        for (var i = 0; i < cagePositions.length; i++) {
            var cagePos = cagePositions[i];

            var baseGeo = new THREE.BoxGeometry(10, 0.5, 10);
            var base = new THREE.Mesh(baseGeo, baseMaterial);
            base.position.set(cagePos.x, 0.25, cagePos.z);
            scene.add(base);
            objects.push(base);

            for (var j = 0; j < 12; j++) {
                var angle = (j / 12) * Math.PI * 2;
                var barGeo = new THREE.CylinderGeometry(0.2, 0.2, 6, 8);
                var bar = new THREE.Mesh(barGeo, barMaterial);
                var radius = 4;
                bar.position.set(
                    cagePos.x + Math.cos(angle) * radius,
                    3,
                    cagePos.z + Math.sin(angle) * radius
                );
                scene.add(bar);
                objects.push(bar);
            }

            for (var k = 0; k < 8; k++) {
                var topBarGeo = new THREE.BoxGeometry(8, 0.3, 0.3);
                var topBar = new THREE.Mesh(topBarGeo, barMaterial);
                topBar.position.set(cagePos.x + (k < 4 ? -3 : 3), 6.5, cagePos.z + (k % 2 === 0 ? -3 : 3));
                scene.add(topBar);
                objects.push(topBar);
            }
        }
    }

    function buildGallows() {
        var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var ropeMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });

        var platformGeo = new THREE.BoxGeometry(12, 2, 12);
        var platform = new THREE.Mesh(platformGeo, woodMaterial);
        platform.position.set(0, 5, 0);
        platform.castShadow = true;
        scene.add(platform);
        objects.push(platform);

        var postGeo = new THREE.BoxGeometry(1.5, 15, 1.5);
        var posts = [
            { x: -5, z: -5 },
            { x: 5, z: -5 },
            { x: -5, z: 5 },
            { x: 5, z: 5 }
        ];

        for (var i = 0; i < posts.length; i++) {
            var post = new THREE.Mesh(postGeo, woodMaterial);
            post.position.set(posts[i].x, 10.5, posts[i].z);
            post.castShadow = true;
            scene.add(post);
            objects.push(post);
        }

        var beamGeo = new THREE.BoxGeometry(14, 1, 1);
        var beam = new THREE.Mesh(beamGeo, woodMaterial);
        beam.position.set(0, 22, -4);
        scene.add(beam);
        objects.push(beam);

        var ropeGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 8);
        for (var j = -3; j <= 3; j += 3) {
            var rope = new THREE.Mesh(ropeGeo, ropeMaterial);
            rope.position.set(j, 16, -4);
            scene.add(rope);
            objects.push(rope);
        }

        var noosePoleGeo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
        var noosePole = new THREE.Mesh(noosePoleGeo, ropeMaterial);
        noosePole.position.set(0, 14, -4);
        scene.add(noosePole);
        objects.push(noosePole);
    }

    function buildBarracks() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

        var buildingGeo = new THREE.BoxGeometry(30, 15, 20);
        var building = new THREE.Mesh(buildingGeo, wallMaterial);
        building.position.set(-60, 7.5, -65);
        building.castShadow = true;
        scene.add(building);
        objects.push(building);

        var roofGeo = new THREE.BoxGeometry(32, 2, 22);
        var roof = new THREE.Mesh(roofGeo, roofMaterial);
        roof.position.set(-60, 17, -65);
        scene.add(roof);
        objects.push(roof);

        for (var i = 0; i < 6; i++) {
            var windowGeo = new THREE.BoxGeometry(3, 3, 0.5);
            var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var window = new THREE.Mesh(windowGeo, windowMaterial);
            window.position.set(-75 + (i * 6), 10, -64.8);
            scene.add(window);
            objects.push(window);
        }

        var doorGeo = new THREE.BoxGeometry(4, 8, 0.5);
        var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var door = new THREE.Mesh(doorGeo, doorMaterial);
        door.position.set(-60, 4, -75.1);
        scene.add(door);
        objects.push(door);
    }

    function buildTribunal() {
        var seatMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });

        var levels = [
            { y: 1, rows: 2, scale: 1.0 },
            { y: 4, rows: 2, scale: 0.85 },
            { y: 7, rows: 2, scale: 0.7 }
        ];

        for (var l = 0; l < levels.length; l++) {
            var level = levels[l];
            for (var r = 0; r < level.rows; r++) {
                var seatGeo = new THREE.BoxGeometry(20 * level.scale, 1, 3);
                var seat = new THREE.Mesh(seatGeo, seatMaterial);
                seat.position.set(65, level.y, -30 + (r * 5));
                scene.add(seat);
                objects.push(seat);
            }
        }

        var podiumGeo = new THREE.BoxGeometry(8, 3, 6);
        var podium = new THREE.Mesh(podiumGeo, seatMaterial);
        podium.position.set(65, 1.5, -15);
        scene.add(podium);
        objects.push(podium);
    }

    function buildDefenses() {
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xb8a852 });
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var nests = [
            { x: -70, z: -50 },
            { x: 70, z: -50 },
            { x: -70, z: 50 },
            { x: 70, z: 50 }
        ];

        for (var i = 0; i < nests.length; i++) {
            var nest = nests[i];

            for (var j = 0; j < 4; j++) {
                for (var k = 0; k < 3; k++) {
                    var bagGeo = new THREE.BoxGeometry(2, 1, 2);
                    var bag = new THREE.Mesh(bagGeo, sandbagMaterial);
                    bag.position.set(nest.x + (j * 2.2), k + 0.5, nest.z + (j * 2.2));
                    scene.add(bag);
                    objects.push(bag);
                }
            }

            var gunBarrelGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
            var barrel = new THREE.Mesh(gunBarrelGeo, barrelMaterial);
            barrel.position.set(nest.x, 3.5, nest.z);
            barrel.rotation.z = Math.PI / 6;
            scene.add(barrel);
            objects.push(barrel);

            var receiverGeo = new THREE.BoxGeometry(1, 1, 3);
            var receiver = new THREE.Mesh(receiverGeo, barrelMaterial);
            receiver.position.set(nest.x, 3, nest.z);
            scene.add(receiver);
            objects.push(receiver);
        }
    }

    function buildStorage() {
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });

        var positions = [
            { x: 60, z: 40 },
            { x: 60, z: 60 },
            { x: -60, z: 60 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];

            for (var j = 0; j < 3; j++) {
                for (var k = 0; k < 2; k++) {
                    var crateGeo = new THREE.BoxGeometry(5, 5, 5);
                    var crate = new THREE.Mesh(crateGeo, crateMaterial);
                    crate.position.set(pos.x + (j * 5.5), 2.5 + (k * 5), pos.z + (j * 5.5));
                    crate.castShadow = true;
                    scene.add(crate);
                    objects.push(crate);
                }
            }
        }
    }

    function buildVehicles() {
        var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        var vehicles = [
            { x: -80, z: 0 },
            { x: 80, z: 0 },
            { x: 0, z: -75 }
        ];

        for (var i = 0; i < vehicles.length; i++) {
            var veh = vehicles[i];

            var hullGeo = new THREE.BoxGeometry(8, 5, 15);
            var hull = new THREE.Mesh(hullGeo, hullMaterial);
            hull.position.set(veh.x, 2.5, veh.z);
            hull.castShadow = true;
            scene.add(hull);
            objects.push(hull);

            var gunBarrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
            var gunBarrel = new THREE.Mesh(gunBarrelGeo, wheelMaterial);
            gunBarrel.position.set(veh.x, 5, veh.z);
            gunBarrel.rotation.z = Math.PI / 8;
            scene.add(gunBarrel);
            objects.push(gunBarrel);

            var turretGeo = new THREE.CylinderGeometry(2, 2, 3, 16);
            var turret = new THREE.Mesh(turretGeo, hullMaterial);
            turret.position.set(veh.x, 5, veh.z);
            scene.add(turret);
            objects.push(turret);

            for (var w = 0; w < 4; w++) {
                var wheelGeo = new THREE.CylinderGeometry(1.5, 1.5, 2, 16);
                var wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
                var wheelX = veh.x + (w < 2 ? -4 : 4);
                var wheelZ = veh.z + (w % 2 === 0 ? -6 : 6);
                wheel.position.set(wheelX, 1.5, wheelZ);
                wheel.rotation.z = Math.PI / 2;
                scene.add(wheel);
                objects.push(wheel);
            }
        }
    }

    function buildTrees() {
        var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });

        var treePositions = [
            { x: -85, z: 20 },
            { x: -85, z: -20 },
            { x: 85, z: 20 },
            { x: 85, z: -20 },
            { x: -20, z: 85 },
            { x: 20, z: 85 },
            { x: -20, z: -85 },
            { x: 20, z: -85 }
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var pos = treePositions[i];

            var trunkGeo = new THREE.CylinderGeometry(1.5, 2, 20, 8);
            var trunk = new THREE.Mesh(trunkGeo, trunkMaterial);
            trunk.position.set(pos.x, 10, pos.z);
            trunk.castShadow = true;
            scene.add(trunk);
            objects.push(trunk);

            for (var j = 0; j < 3; j++) {
                var branchGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
                var branch = new THREE.Mesh(branchGeo, trunkMaterial);
                var branchAngle = (j / 3) * Math.PI * 2;
                branch.position.set(pos.x + Math.cos(branchAngle) * 3, 15 + j, pos.z + Math.sin(branchAngle) * 3);
                branch.rotation.z = Math.PI / 6;
                scene.add(branch);
                objects.push(branch);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(50, 80, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var spotLight1 = new THREE.SpotLight(0xffff66, 0.4);
        spotLight1.position.set(-95, 37, -95);
        spotLight1.target.position.set(-50, 0, -50);
        spotLight1.angle = Math.PI / 6;
        scene.add(spotLight1);
        scene.add(spotLight1.target);
        lights.push(spotLight1);

        var spotLight2 = new THREE.SpotLight(0xffff66, 0.4);
        spotLight2.position.set(95, 37, 95);
        spotLight2.target.position.set(50, 0, 50);
        spotLight2.angle = Math.PI / 6;
        scene.add(spotLight2);
        scene.add(spotLight2.target);
        lights.push(spotLight2);

        var spotLight3 = new THREE.SpotLight(0xffff66, 0.4);
        spotLight3.position.set(-95, 37, 95);
        spotLight3.target.position.set(-50, 0, 50);
        spotLight3.angle = Math.PI / 6;
        scene.add(spotLight3);
        scene.add(spotLight3.target);
        lights.push(spotLight3);

        var spotLight4 = new THREE.SpotLight(0xffff66, 0.4);
        spotLight4.position.set(95, 37, -95);
        spotLight4.target.position.set(50, 0, -50);
        spotLight4.angle = Math.PI / 6;
        scene.add(spotLight4);
        scene.add(spotLight4.target);
        lights.push(spotLight4);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildGround();
        buildWalls();
        buildTowers();
        buildCages();
        buildGallows();
        buildBarracks();
        buildTribunal();
        buildDefenses();
        buildStorage();
        buildVehicles();
        buildTrees();
        setupLighting();
    }

    function update(delta) {
        for (var i = 0; i < lights.length; i++) {
            if (lights[i].isSpotLight) {
                lights[i].target.position.x += Math.sin(Date.now() * 0.001) * 0.5;
                lights[i].target.position.z += Math.cos(Date.now() * 0.001) * 0.5;
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
