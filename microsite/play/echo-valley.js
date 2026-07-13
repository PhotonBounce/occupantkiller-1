window.EchoValley = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var debrisParticles = [];
    var waterSurfaces = [];
    var animationTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        debrisParticles = [];
        waterSurfaces = [];
        animationTime = 0;
        buildValleyWalls();
        buildSettlement();
        buildAmbushPoints();
        buildRiver();
        buildVegetation();
        buildCheckpoint();
        buildBridgeStructure();
        buildBoulderField();
        setupLighting();
    }

    function buildValleyWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xA0825D });

        var leftWallGeom = new THREE.BoxGeometry(15, 120, 200);
        var leftWall = new THREE.Mesh(leftWallGeom, wallMaterial);
        leftWall.position.set(-80, 60, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        scene.add(leftWall);
        objects.push(leftWall);

        var rightWallGeom = new THREE.BoxGeometry(15, 120, 200);
        var rightWall = new THREE.Mesh(rightWallGeom, wallMaterial);
        rightWall.position.set(80, 60, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        scene.add(rightWall);
        objects.push(rightWall);

        var rockDetailMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        for (var i = 0; i < 12; i++) {
            var rockGeom = new THREE.SphereGeometry(3 + Math.random() * 5, 6, 6);
            var rock = new THREE.Mesh(rockGeom, rockDetailMat);
            rock.position.set(-75 + Math.random() * 10, 20 + Math.random() * 80, -80 + i * 15);
            rock.castShadow = true;
            scene.add(rock);
            objects.push(rock);
        }

        for (var i = 0; i < 12; i++) {
            var rockGeom = new THREE.SphereGeometry(3 + Math.random() * 5, 6, 6);
            var rock = new THREE.Mesh(rockGeom, rockDetailMat);
            rock.position.set(75 - Math.random() * 10, 20 + Math.random() * 80, -80 + i * 15);
            rock.castShadow = true;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildSettlement() {
        var buildingMat = new THREE.MeshLambertMaterial({ color: 0xB8956A });
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x4A3C28 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xA0694A });

        var buildingPositions = [
            { x: -40, y: 0, z: 20 },
            { x: -15, y: 0, z: 30 },
            { x: 15, y: 0, z: 15 },
            { x: 40, y: 0, z: 25 },
            { x: -30, y: 0, z: -20 },
            { x: 25, y: 0, z: -15 }
        ];

        for (var i = 0; i < buildingPositions.length; i++) {
            var pos = buildingPositions[i];
            var width = 12 + Math.random() * 8;
            var height = 10 + Math.random() * 8;
            var depth = 12 + Math.random() * 8;

            var buildGeom = new THREE.BoxGeometry(width, height, depth);
            var building = new THREE.Mesh(buildGeom, buildingMat);
            building.position.set(pos.x, height / 2, pos.z);
            building.castShadow = true;
            building.receiveShadow = true;
            scene.add(building);
            objects.push(building);

            var doorGeom = new THREE.BoxGeometry(2, 5, 0.5);
            var door = new THREE.Mesh(doorGeom, doorMat);
            door.position.set(pos.x - width / 2 + 2, height / 2 - 1, pos.z + depth / 2 + 0.3);
            scene.add(door);
            objects.push(door);

            var roofGeom = new THREE.ConeGeometry((width + 2) / 2, 5, 4);
            var roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.set(pos.x, height + 2.5, pos.z);
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            scene.add(roof);
            objects.push(roof);

            var damage = Math.random();
            if (damage > 0.6) {
                var crackGeom = new THREE.BoxGeometry(width + 2, 3, 1);
                var crackMat = new THREE.MeshLambertMaterial({ color: 0x3D2817 });
                var crack = new THREE.Mesh(crackGeom, crackMat);
                crack.position.set(pos.x, height / 2, pos.z + depth / 2 + 0.5);
                scene.add(crack);
                objects.push(crack);
            }
        }
    }

    function buildAmbushPoints() {
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x7A6B54 });

        var leftLedges = [
            { x: -70, y: 70, z: -60 },
            { x: -72, y: 85, z: -20 },
            { x: -75, y: 95, z: 40 }
        ];

        for (var i = 0; i < leftLedges.length; i++) {
            var pos = leftLedges[i];
            var ledgeGeom = new THREE.BoxGeometry(8, 2, 12);
            var ledge = new THREE.Mesh(ledgeGeom, platformMat);
            ledge.position.set(pos.x, pos.y, pos.z);
            ledge.castShadow = true;
            ledge.receiveShadow = true;
            scene.add(ledge);
            objects.push(ledge);

            var wallGeom = new THREE.BoxGeometry(8, 8, 1);
            var wallMat = new THREE.MeshLambertMaterial({ color: 0x6A5B44 });
            var wall = new THREE.Mesh(wallGeom, wallMat);
            wall.position.set(pos.x, pos.y + 4, pos.z - 6);
            scene.add(wall);
            objects.push(wall);
        }

        var rightLedges = [
            { x: 70, y: 72, z: -50 },
            { x: 75, y: 88, z: 0 },
            { x: 73, y: 98, z: 50 }
        ];

        for (var i = 0; i < rightLedges.length; i++) {
            var pos = rightLedges[i];
            var ledgeGeom = new THREE.BoxGeometry(8, 2, 12);
            var ledge = new THREE.Mesh(ledgeGeom, platformMat);
            ledge.position.set(pos.x, pos.y, pos.z);
            ledge.castShadow = true;
            ledge.receiveShadow = true;
            scene.add(ledge);
            objects.push(ledge);

            var wallGeom = new THREE.BoxGeometry(8, 8, 1);
            var wallMat = new THREE.MeshLambertMaterial({ color: 0x6A5B44 });
            var wall = new THREE.Mesh(wallGeom, wallMat);
            wall.position.set(pos.x, pos.y + 4, pos.z + 6);
            scene.add(wall);
            objects.push(wall);
        }

        var goatTrailMat = new THREE.MeshLambertMaterial({ color: 0x9B8B7A });
        for (var i = 0; i < 5; i++) {
            var trailGeom = new THREE.BoxGeometry(2, 1, 20);
            var trail = new THREE.Mesh(trailGeom, goatTrailMat);
            trail.position.set(-65 + Math.random() * 30, 40 + i * 8, -80 + i * 30);
            trail.rotation.z = Math.random() * 0.3;
            scene.add(trail);
            objects.push(trail);
        }
    }

    function buildRiver() {
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A3A52 });

        var riverSegments = [
            { x: 0, z: -80, w: 4, d: 30 },
            { x: -5, z: -50, w: 5, d: 35 },
            { x: 8, z: -15, w: 4.5, d: 40 },
            { x: -8, z: 20, w: 5, d: 35 },
            { x: 6, z: 55, w: 4, d: 30 },
            { x: 0, z: 85, w: 5.5, d: 35 }
        ];

        for (var i = 0; i < riverSegments.length; i++) {
            var seg = riverSegments[i];
            var riverGeom = new THREE.BoxGeometry(seg.w, 1.5, seg.d);
            var river = new THREE.Mesh(riverGeom, waterMat);
            river.position.set(seg.x, 0.75, seg.z);
            river.receiveShadow = true;
            scene.add(river);
            objects.push(river);
            waterSurfaces.push(river);
        }

        var rockMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        for (var i = 0; i < 8; i++) {
            var rockGeom = new THREE.SphereGeometry(2 + Math.random() * 3, 6, 6);
            var rock = new THREE.Mesh(rockGeom, rockMat);
            rock.position.set(-20 + Math.random() * 40, 0.8, -80 + i * 25);
            rock.castShadow = true;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildVegetation() {
        var trunkMat = new THREE.MeshLambertMaterial({ color: 0x5C4A3D });
        var foliageMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });

        var treePositions = [
            { x: -50, z: -40 },
            { x: -35, z: 10 },
            { x: 45, z: -30 },
            { x: 30, z: 35 },
            { x: -55, z: 50 },
            { x: 50, z: 60 }
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var pos = treePositions[i];
            var trunkGeom = new THREE.CylinderGeometry(0.8, 1.2, 15, 8);
            var trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.set(pos.x, 7.5, pos.z);
            trunk.castShadow = true;
            scene.add(trunk);
            objects.push(trunk);

            var foliageGeom = new THREE.SphereGeometry(8, 6, 6);
            var foliage = new THREE.Mesh(foliageGeom, foliageMat);
            foliage.position.set(pos.x, 18, pos.z);
            foliage.castShadow = true;
            foliage.receiveShadow = true;
            scene.add(foliage);
            objects.push(foliage);

            var foliageGeom2 = new THREE.ConeGeometry(6, 8, 8);
            var foliage2 = new THREE.Mesh(foliageGeom2, foliageMat);
            foliage2.position.set(pos.x, 22, pos.z);
            foliage2.castShadow = true;
            scene.add(foliage2);
            objects.push(foliage2);
        }

        var shrubMat = new THREE.MeshLambertMaterial({ color: 0x7A9B3D });
        for (var i = 0; i < 15; i++) {
            var shrubGeom = new THREE.SphereGeometry(2 + Math.random() * 2, 4, 4);
            var shrub = new THREE.Mesh(shrubGeom, shrubMat);
            shrub.position.set(-60 + Math.random() * 120, 1, -70 + Math.random() * 150);
            scene.add(shrub);
            objects.push(shrub);
        }
    }

    function buildCheckpoint() {
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xD2A679 });
        var barricadeMat = new THREE.MeshLambertMaterial({ color: 0x654321 });

        for (var i = 0; i < 8; i++) {
            var bagGeom = new THREE.BoxGeometry(1.5, 0.8, 1.5);
            var bag = new THREE.Mesh(bagGeom, sandbagMat);
            bag.position.set(-3 + i * 1.2, 0.4, -95);
            bag.castShadow = true;
            scene.add(bag);
            objects.push(bag);
        }

        for (var i = 0; i < 2; i++) {
            var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
            var pole = new THREE.Mesh(poleGeom, barricadeMat);
            pole.position.set(-8 + i * 16, 4, -95);
            pole.castShadow = true;
            scene.add(pole);
            objects.push(pole);
        }

        var barGeom = new THREE.BoxGeometry(15, 0.5, 0.5);
        var bar = new THREE.Mesh(barGeom, barricadeMat);
        bar.position.set(0, 4.5, -95);
        bar.castShadow = true;
        scene.add(bar);
        objects.push(bar);

        for (var i = 0; i < 3; i++) {
            var cartGeom = new THREE.BoxGeometry(3, 2, 2);
            var cart = new THREE.Mesh(cartGeom, sandbagMat);
            cart.position.set(-15 + i * 15, 1, -85);
            cart.castShadow = true;
            scene.add(cart);
            objects.push(cart);
        }
    }

    function buildBridgeStructure() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xA89968 });
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x8B7D6B });

        var archGeom = new THREE.CylinderGeometry(12, 12, 2, 16);
        var arch = new THREE.Mesh(archGeom, stoneMat);
        arch.position.set(0, 8, 45);
        arch.rotation.z = Math.PI / 2;
        arch.castShadow = true;
        arch.receiveShadow = true;
        scene.add(arch);
        objects.push(arch);

        var deckGeom = new THREE.BoxGeometry(6, 1, 18);
        var deck = new THREE.Mesh(deckGeom, deckMat);
        deck.position.set(0, 10, 45);
        deck.castShadow = true;
        deck.receiveShadow = true;
        scene.add(deck);
        objects.push(deck);

        for (var i = 0; i < 4; i++) {
            var railGeom = new THREE.CylinderGeometry(0.4, 0.4, 20, 6);
            var rail = new THREE.Mesh(railGeom, stoneMat);
            rail.position.set(-2.5 + i * 1.7, 11, 45);
            rail.rotation.z = Math.PI / 2;
            scene.add(rail);
            objects.push(rail);
        }

        var supportGeom = new THREE.BoxGeometry(2, 16, 2);
        var support1 = new THREE.Mesh(supportGeom, stoneMat);
        support1.position.set(-8, 8, 45);
        support1.castShadow = true;
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(supportGeom, stoneMat);
        support2.position.set(8, 8, 45);
        support2.castShadow = true;
        scene.add(support2);
        objects.push(support2);
    }

    function buildBoulderField() {
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x6B5D52 });

        for (var i = 0; i < 25; i++) {
            var boulderGeom = new THREE.SphereGeometry(3 + Math.random() * 5, 8, 8);
            var boulder = new THREE.Mesh(boulderGeom, boulderMat);
            boulder.position.set(-40 + Math.random() * 80, 3 + Math.random() * 4, -40 + Math.random() * 80);
            boulder.castShadow = true;
            boulder.receiveShadow = true;
            scene.add(boulder);
            objects.push(boulder);
        }

        for (var i = 0; i < 15; i++) {
            var smallRockGeom = new THREE.SphereGeometry(1 + Math.random() * 2, 4, 4);
            var smallRock = new THREE.Mesh(smallRockGeom, boulderMat);
            smallRock.position.set(-50 + Math.random() * 100, 0.8, -50 + Math.random() * 100);
            scene.add(smallRock);
            objects.push(smallRock);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(100, 80, 50);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.left = -150;
        sunLight.shadow.camera.right = 150;
        sunLight.shadow.camera.top = 150;
        sunLight.shadow.camera.bottom = -150;
        sunLight.shadow.camera.far = 500;
        scene.add(sunLight);
        lights.push(sunLight);

        var canyonLight = new THREE.PointLight(0xFF9999, 0.8, 150);
        canyonLight.position.set(-70, 50, 0);
        scene.add(canyonLight);
        lights.push(canyonLight);

        var canyonLight2 = new THREE.PointLight(0x9999FF, 0.6, 150);
        canyonLight2.position.set(70, 50, 0);
        scene.add(canyonLight2);
        lights.push(canyonLight2);
    }

    function update(delta) {
        animationTime += delta;

        for (var i = 0; i < waterSurfaces.length; i++) {
            var water = waterSurfaces[i];
            water.position.y = 0.75 + Math.sin(animationTime * 2 + i) * 0.1;
        }

        for (var i = 0; i < debrisParticles.length; i++) {
            var debris = debrisParticles[i];
            debris.position.y += debris.velocity.y;
            debris.position.x += Math.sin(animationTime * 3 + i) * 0.05;
            debris.position.z += debris.velocity.z;
            debris.rotation.x += debris.velocity.y * 0.5;
            debris.rotation.y += 0.02;

            if (debris.position.y < 0) {
                debris.position.y = 100;
            }
        }
    }

    function createDebris() {
        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x8B7D6B });

        for (var i = 0; i < 10; i++) {
            var debrisGeom = new THREE.BoxGeometry(
                0.5 + Math.random() * 1,
                0.3 + Math.random() * 0.8,
                0.5 + Math.random() * 1
            );
            var debris = new THREE.Mesh(debrisGeom, debrisMat);
            debris.position.set(
                -50 + Math.random() * 100,
                80 + Math.random() * 30,
                -60 + Math.random() * 120
            );
            debris.velocity = {
                y: -0.15 - Math.random() * 0.3,
                z: -0.05 + Math.random() * 0.1
            };
            scene.add(debris);
            debrisParticles.push(debris);
            objects.push(debris);
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
        debrisParticles = [];
        waterSurfaces = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
