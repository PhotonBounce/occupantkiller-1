window.BombRange = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var craters = [];
    var targets = [];
    var explosionGlows = [];
    var smokeParticles = [];

    function buildTargets() {
        var targetGrid = 10;
        var spacing = 20;
        var startX = -90;
        var startZ = -80;
        for (var i = 0; i < targetGrid; i++) {
            for (var j = 0; j < targetGrid; j++) {
                var x = startX + (i * spacing);
                var z = startZ + (j * spacing);
                var vehicleBody = new THREE.Mesh(
                    new THREE.BoxGeometry(8, 4, 12),
                    new THREE.MeshLambertMaterial({ color: 0xff8800 })
                );
                vehicleBody.position.set(x, 2, z);
                scene.add(vehicleBody);
                objects.push(vehicleBody);
                targets.push(vehicleBody);
                var vehicleCab = new THREE.Mesh(
                    new THREE.BoxGeometry(4, 3, 5),
                    new THREE.MeshLambertMaterial({ color: 0xffaa22 })
                );
                vehicleCab.position.set(x, 5.5, z - 3);
                scene.add(vehicleCab);
                objects.push(vehicleCab);
                var wheel1 = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.5, 1.5, 2, 16),
                    new THREE.MeshLambertMaterial({ color: 0x333333 })
                );
                wheel1.rotation.z = Math.PI / 2;
                wheel1.position.set(x - 2, 1.5, z - 3);
                scene.add(wheel1);
                objects.push(wheel1);
                var wheel2 = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.5, 1.5, 2, 16),
                    new THREE.MeshLambertMaterial({ color: 0x333333 })
                );
                wheel2.rotation.z = Math.PI / 2;
                wheel2.position.set(x + 2, 1.5, z - 3);
                scene.add(wheel2);
                objects.push(wheel2);
                var wheel3 = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.5, 1.5, 2, 16),
                    new THREE.MeshLambertMaterial({ color: 0x333333 })
                );
                wheel3.rotation.z = Math.PI / 2;
                wheel3.position.set(x - 2, 1.5, z + 3);
                scene.add(wheel3);
                objects.push(wheel3);
                var wheel4 = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.5, 1.5, 2, 16),
                    new THREE.MeshLambertMaterial({ color: 0x333333 })
                );
                wheel4.rotation.z = Math.PI / 2;
                wheel4.position.set(x + 2, 1.5, z + 3);
                scene.add(wheel4);
                objects.push(wheel4);
            }
        }
    }

    function buildBunkers() {
        var bunkerPositions = [
            { x: -150, z: 0 },
            { x: -150, z: 50 },
            { x: 150, z: 0 },
            { x: 150, z: -50 }
        ];
        for (var i = 0; i < bunkerPositions.length; i++) {
            var bpos = bunkerPositions[i];
            var bunkerWall = new THREE.Mesh(
                new THREE.BoxGeometry(40, 20, 20),
                new THREE.MeshLambertMaterial({ color: 0x777777 })
            );
            bunkerWall.position.set(bpos.x, 10, bpos.z);
            scene.add(bunkerWall);
            objects.push(bunkerWall);
            var windowSlit1 = new THREE.Mesh(
                new THREE.BoxGeometry(2, 3, 1),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            windowSlit1.position.set(bpos.x - 8, 12, bpos.z + 10.1);
            scene.add(windowSlit1);
            objects.push(windowSlit1);
            var windowSlit2 = new THREE.Mesh(
                new THREE.BoxGeometry(2, 3, 1),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            windowSlit2.position.set(bpos.x + 8, 12, bpos.z + 10.1);
            scene.add(windowSlit2);
            objects.push(windowSlit2);
            var bunkerRoof = new THREE.Mesh(
                new THREE.BoxGeometry(42, 3, 22),
                new THREE.MeshLambertMaterial({ color: 0x666666 })
            );
            bunkerRoof.position.set(bpos.x, 20.5, bpos.z);
            scene.add(bunkerRoof);
            objects.push(bunkerRoof);
        }
    }

    function buildCraters() {
        var craterPositions = [
            { x: -50, z: 20, size: 15 },
            { x: 30, z: -40, size: 12 },
            { x: -80, z: -60, size: 18 },
            { x: 70, z: 50, size: 14 },
            { x: 0, z: 0, size: 20 },
            { x: -120, z: 80, size: 10 }
        ];
        for (var i = 0; i < craterPositions.length; i++) {
            var cpos = craterPositions[i];
            var craterCone = new THREE.Mesh(
                new THREE.ConeGeometry(cpos.size, 8, 32),
                new THREE.MeshLambertMaterial({ color: 0x5c4033 })
            );
            craterCone.position.set(cpos.x, -1, cpos.z);
            craterCone.scale.z = -1;
            scene.add(craterCone);
            objects.push(craterCone);
            craters.push(craterCone);
            var rubbleRing = new THREE.Mesh(
                new THREE.CylinderGeometry(cpos.size + 2, cpos.size, 0.5, 32),
                new THREE.MeshLambertMaterial({ color: 0x8b7355 })
            );
            rubbleRing.position.set(cpos.x, 0.25, cpos.z);
            scene.add(rubbleRing);
            objects.push(rubbleRing);
            for (var j = 0; j < 5; j++) {
                var angle = (j / 5) * Math.PI * 2;
                var rubbleBlock = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 1, 2),
                    new THREE.MeshLambertMaterial({ color: 0x6b5344 })
                );
                rubbleBlock.position.set(
                    cpos.x + Math.cos(angle) * (cpos.size + 3),
                    1,
                    cpos.z + Math.sin(angle) * (cpos.size + 3)
                );
                rubbleBlock.rotation.set(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                );
                scene.add(rubbleBlock);
                objects.push(rubbleBlock);
            }
        }
    }

    function buildRunway() {
        var runway = new THREE.Mesh(
            new THREE.BoxGeometry(300, 1, 40),
            new THREE.MeshLambertMaterial({ color: 0xcccccc })
        );
        runway.position.set(0, 0.01, -120);
        scene.add(runway);
        objects.push(runway);
        for (var i = 0; i < 30; i++) {
            var marker = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16),
                new THREE.MeshLambertMaterial({ color: 0xff0000 })
            );
            marker.position.set(-140 + (i * 10), 0.5, -120);
            scene.add(marker);
            objects.push(marker);
        }
        var runwayStripe1 = new THREE.Mesh(
            new THREE.BoxGeometry(300, 0.1, 2),
            new THREE.MeshLambertMaterial({ color: 0xffff00 })
        );
        runwayStripe1.position.set(0, 0.08, -118);
        scene.add(runwayStripe1);
        objects.push(runwayStripe1);
        var runwayStripe2 = new THREE.Mesh(
            new THREE.BoxGeometry(300, 0.1, 2),
            new THREE.MeshLambertMaterial({ color: 0xffff00 })
        );
        runwayStripe2.position.set(0, 0.08, -122);
        scene.add(runwayStripe2);
        objects.push(runwayStripe2);
    }

    function buildStorage() {
        var storagePositions = [
            { x: -120, z: 120 },
            { x: -60, z: 140 },
            { x: 0, z: 160 },
            { x: 60, z: 140 },
            { x: 120, z: 120 }
        ];
        for (var i = 0; i < storagePositions.length; i++) {
            var spos = storagePositions[i];
            var iglooDome = new THREE.Mesh(
                new THREE.SphereGeometry(12, 16, 16),
                new THREE.MeshLambertMaterial({ color: 0x999999 })
            );
            iglooDome.position.set(spos.x, 6, spos.z);
            iglooDome.scale.y = 0.6;
            scene.add(iglooDome);
            objects.push(iglooDome);
            var iglooBase = new THREE.Mesh(
                new THREE.BoxGeometry(24, 2, 24),
                new THREE.MeshLambertMaterial({ color: 0x888888 })
            );
            iglooBase.position.set(spos.x, 0.5, spos.z);
            scene.add(iglooBase);
            objects.push(iglooBase);
            var vent = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, 6, 12),
                new THREE.MeshLambertMaterial({ color: 0x777777 })
            );
            vent.position.set(spos.x, 9, spos.z);
            scene.add(vent);
            objects.push(vent);
        }
        for (var i = 0; i < 8; i++) {
            var bombMarker = new THREE.Mesh(
                new THREE.CylinderGeometry(0.8, 1.2, 4, 8),
                new THREE.MeshLambertMaterial({ color: 0xff0000 })
            );
            var angle = (i / 8) * Math.PI * 2;
            bombMarker.position.set(
                Math.cos(angle) * 25,
                2,
                Math.sin(angle) * 25
            );
            scene.add(bombMarker);
            objects.push(bombMarker);
            var bombFin = new THREE.Mesh(
                new THREE.ConeGeometry(0.6, 2, 16),
                new THREE.MeshLambertMaterial({ color: 0xffff00 })
            );
            bombFin.position.set(
                Math.cos(angle) * 25,
                5,
                Math.sin(angle) * 25
            );
            scene.add(bombFin);
            objects.push(bombFin);
        }
    }

    function buildTower() {
        var towerBase = new THREE.Mesh(
            new THREE.BoxGeometry(8, 40, 8),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        towerBase.position.set(180, 20, 80);
        scene.add(towerBase);
        objects.push(towerBase);
        var towerCab = new THREE.Mesh(
            new THREE.BoxGeometry(10, 8, 10),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        towerCab.position.set(180, 45, 80);
        scene.add(towerCab);
        objects.push(towerCab);
        var towerRoof = new THREE.Mesh(
            new THREE.ConeGeometry(6, 4, 4),
            new THREE.MeshLambertMaterial({ color: 0xff0000 })
        );
        towerRoof.position.set(180, 50, 80);
        scene.add(towerRoof);
        objects.push(towerRoof);
        for (var i = 0; i < 4; i++) {
            var window = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 0.5),
                new THREE.MeshLambertMaterial({ color: 0x4da6ff })
            );
            var angle = (i / 4) * Math.PI * 2;
            window.position.set(
                180 + Math.cos(angle) * 5.5,
                45,
                80 + Math.sin(angle) * 5.5
            );
            scene.add(window);
            objects.push(window);
        }
    }

    function buildFence() {
        var fenceLength = 600;
        var fenceRadius = 250;
        for (var i = 0; i < 40; i++) {
            var angle = (i / 40) * Math.PI * 2;
            var x = Math.cos(angle) * fenceRadius;
            var z = Math.sin(angle) * fenceRadius;
            var post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.6, 8, 12),
                new THREE.MeshLambertMaterial({ color: 0xcc0000 })
            );
            post.position.set(x, 4, z);
            scene.add(post);
            objects.push(post);
            if (i < 39) {
                var nextAngle = ((i + 1) / 40) * Math.PI * 2;
                var nextX = Math.cos(nextAngle) * fenceRadius;
                var nextZ = Math.sin(nextAngle) * fenceRadius;
                var railPoints = [
                    new THREE.Vector3(x, 3, z),
                    new THREE.Vector3(nextX, 3, nextZ)
                ];
                var railGeometry = new THREE.BufferGeometry().setFromPoints(railPoints);
                var rail = new THREE.LineSegments(
                    railGeometry,
                    new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 })
                );
                scene.add(rail);
                objects.push(rail);
            }
        }
    }

    function buildTargetboards() {
        var boardPositions = [
            { x: -200, z: 40 },
            { x: -200, z: -40 },
            { x: 200, z: 40 },
            { x: 200, z: -40 }
        ];
        for (var i = 0; i < boardPositions.length; i++) {
            var bpos = boardPositions[i];
            var boardFrame = new THREE.Mesh(
                new THREE.BoxGeometry(20, 30, 1),
                new THREE.MeshLambertMaterial({ color: 0xffffcc })
            );
            boardFrame.position.set(bpos.x, 18, bpos.z);
            scene.add(boardFrame);
            objects.push(boardFrame);
            var ring1 = new THREE.Mesh(
                new THREE.BoxGeometry(16, 26, 0.2),
                new THREE.MeshLambertMaterial({ color: 0xff0000 })
            );
            ring1.position.set(bpos.x, 18, bpos.z + 0.5);
            scene.add(ring1);
            objects.push(ring1);
            var ring2 = new THREE.Mesh(
                new THREE.BoxGeometry(12, 22, 0.2),
                new THREE.MeshLambertMaterial({ color: 0xffff00 })
            );
            ring2.position.set(bpos.x, 18, bpos.z + 0.6);
            scene.add(ring2);
            objects.push(ring2);
            var ring3 = new THREE.Mesh(
                new THREE.BoxGeometry(8, 18, 0.2),
                new THREE.MeshLambertMaterial({ color: 0xff0000 })
            );
            ring3.position.set(bpos.x, 18, bpos.z + 0.7);
            scene.add(ring3);
            objects.push(ring3);
            var bullseye = new THREE.Mesh(
                new THREE.BoxGeometry(4, 8, 0.2),
                new THREE.MeshLambertMaterial({ color: 0xffff00 })
            );
            bullseye.position.set(bpos.x, 18, bpos.z + 0.8);
            scene.add(bullseye);
            objects.push(bullseye);
        }
    }

    function buildDeflectors() {
        var deflectorPositions = [
            { x: -150, z: -100, rot: 0.2 },
            { x: -100, z: -150, rot: 0.3 },
            { x: 150, z: -100, rot: -0.2 },
            { x: 100, z: -150, rot: -0.3 }
        ];
        for (var i = 0; i < deflectorPositions.length; i++) {
            var dpos = deflectorPositions[i];
            var deflector = new THREE.Mesh(
                new THREE.BoxGeometry(30, 15, 3),
                new THREE.MeshLambertMaterial({ color: 0x000000 })
            );
            deflector.position.set(dpos.x, 7.5, dpos.z);
            deflector.rotation.z = dpos.rot;
            scene.add(deflector);
            objects.push(deflector);
        }
    }

    function buildGround() {
        var groundSize = 1000;
        var groundGrid = 50;
        for (var i = 0; i < groundGrid; i++) {
            for (var j = 0; j < groundGrid; j++) {
                var x = -groundSize / 2 + (i * groundSize / groundGrid);
                var z = -groundSize / 2 + (j * groundSize / groundGrid);
                var color = (i + j) % 2 === 0 ? 0xc9a661 : 0xb8956a;
                var groundTile = new THREE.Mesh(
                    new THREE.BoxGeometry(groundSize / groundGrid, 0.1, groundSize / groundGrid),
                    new THREE.MeshLambertMaterial({ color: color })
                );
                groundTile.position.set(x, -0.05, z);
                scene.add(groundTile);
                objects.push(groundTile);
            }
        }
    }

    function setupLighting() {
        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 150, 100);
        sunLight.castShadow = true;
        scene.add(sunLight);
        lights.push(sunLight);
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);
        var pointLight = new THREE.PointLight(0xff6600, 0.3);
        pointLight.position.set(0, 50, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function updateExplosions(delta) {
        for (var i = explosionGlows.length - 1; i >= 0; i--) {
            var glow = explosionGlows[i];
            glow.intensity -= delta * 2;
            if (glow.intensity <= 0) {
                scene.remove(glow);
                explosionGlows.splice(i, 1);
            }
        }
    }

    function updateSmoke(delta) {
        for (var i = smokeParticles.length - 1; i >= 0; i--) {
            var smoke = smokeParticles[i];
            smoke.position.y += delta * 3;
            smoke.scale.x += delta * 0.5;
            smoke.scale.y += delta * 0.5;
            smoke.scale.z += delta * 0.5;
            smoke.material.opacity -= delta * 0.3;
            if (smoke.material.opacity <= 0) {
                scene.remove(smoke);
                smokeParticles.splice(i, 1);
            }
        }
    }

    function createExplosion(position) {
        var glowGeometry = new THREE.SphereGeometry(8, 16, 16);
        var glowMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(position);
        scene.add(glow);
        glow.intensity = 1;
        explosionGlows.push(glow);
        for (var i = 0; i < 3; i++) {
            var smokeGeometry = new THREE.SphereGeometry(5, 8, 8);
            var smokeMaterial = new THREE.MeshLambertMaterial({
                color: 0x888888,
                transparent: true,
                opacity: 0.5
            });
            var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.copy(position);
            smoke.position.x += (Math.random() - 0.5) * 10;
            smoke.position.z += (Math.random() - 0.5) * 10;
            scene.add(smoke);
            smokeParticles.push(smoke);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        craters = [];
        targets = [];
        explosionGlows = [];
        smokeParticles = [];
        buildGround();
        buildTargets();
        buildBunkers();
        buildCraters();
        buildRunway();
        buildStorage();
        buildTower();
        buildFence();
        buildTargetboards();
        buildDeflectors();
        setupLighting();
    }

    function update(delta) {
        updateExplosions(delta);
        updateSmoke(delta);
        for (var i = 0; i < targets.length; i++) {
            targets[i].rotation.y += delta * 0.1;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        for (var i = 0; i < explosionGlows.length; i++) {
            scene.remove(explosionGlows[i]);
        }
        for (var i = 0; i < smokeParticles.length; i++) {
            scene.remove(smokeParticles[i]);
        }
        objects = [];
        lights = [];
        craters = [];
        targets = [];
        explosionGlows = [];
        smokeParticles = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset,
        createExplosion: createExplosion
    };
}());
