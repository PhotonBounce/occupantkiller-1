window.WarRelic = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var dustParticles = [];
    var torches = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        dustParticles = [];
        torches = [];
        buildAncientMonuments();
        buildWWIIRelics();
        buildModernMilitary();
        buildTerrain();
        buildAtmosphere();
        buildTrenches();
        buildArchaeology();
        setupLighting();
    }

    function buildAncientMonuments() {
        var marbleWhite = 0xf5f5dc;
        var mossGreen = 0x7a8d5c;

        for (var i = 0; i < 6; i++) {
            var x = (i - 2.5) * 20;
            var z = -30;
            var columnHeight = 8 + Math.random() * 4;
            var geometry = new THREE.CylinderGeometry(1.5, 1.8, columnHeight, 12);
            var material = new THREE.MeshLambertMaterial({ color: marbleWhite });
            var column = new THREE.Mesh(geometry, material);
            column.position.set(x, columnHeight / 2, z);
            column.castShadow = true;
            column.receiveShadow = true;
            scene.add(column);
            objects.push(column);

            var capGeometry = new THREE.BoxGeometry(3.5, 0.8, 3.5);
            var capMaterial = new THREE.MeshLambertMaterial({ color: marbleWhite });
            var cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.set(x, columnHeight + 0.4, z);
            cap.castShadow = true;
            cap.receiveShadow = true;
            scene.add(cap);
            objects.push(cap);
        }

        for (var i = 0; i < 4; i++) {
            var pillarX = -15 + i * 10;
            var pillarZ = -50;
            var pillarGeometry = new THREE.BoxGeometry(2.5, 12, 2.5);
            var pillarMaterial = new THREE.MeshLambertMaterial({ color: marbleWhite });
            var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pillarX, 6, pillarZ);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            scene.add(pillar);
            objects.push(pillar);
        }

        var archSegments = 8;
        for (var i = 0; i < archSegments; i++) {
            var angle = (i / archSegments) * Math.PI;
            var radius = 6;
            var x = Math.sin(angle) * radius;
            var y = Math.cos(angle) * radius + 8;
            var blockGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.8);
            var blockMaterial = new THREE.MeshLambertMaterial({ color: marbleWhite });
            var block = new THREE.Mesh(blockGeometry, blockMaterial);
            block.position.set(x - 20, y, -40);
            block.castShadow = true;
            block.receiveShadow = true;
            scene.add(block);
            objects.push(block);
        }

        for (var i = 0; i < 8; i++) {
            var wallGeometry = new THREE.BoxGeometry(4, 6, 0.5);
            var wallMaterial = new THREE.MeshLambertMaterial({ color: mossGreen });
            var wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(30 + i * 5, 3, -25 - i * 3);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            objects.push(wall);
        }
    }

    function buildWWIIRelics() {
        var rustBrown = 0x8b4513;
        var darkSteel = 0x2f4f4f;

        var tankGeometry = new THREE.BoxGeometry(3, 2, 6);
        var tankMaterial = new THREE.MeshLambertMaterial({ color: rustBrown });
        var tankHull = new THREE.Mesh(tankGeometry, tankMaterial);
        tankHull.position.set(-25, 1.5, 10);
        tankHull.castShadow = true;
        tankHull.receiveShadow = true;
        scene.add(tankHull);
        objects.push(tankHull);

        var turretGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 8);
        var turretMaterial = new THREE.MeshLambertMaterial({ color: rustBrown });
        var turret = new THREE.Mesh(turretGeometry, turretMaterial);
        turret.position.set(-25, 2.8, 10);
        turret.castShadow = true;
        turret.receiveShadow = true;
        scene.add(turret);
        objects.push(turret);

        var barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: darkSteel });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(-25, 2.8, 14);
        barrel.rotation.z = Math.PI / 6;
        barrel.castShadow = true;
        barrel.receiveShadow = true;
        scene.add(barrel);
        objects.push(barrel);

        for (var i = 0; i < 3; i++) {
            var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.4, 16);
            var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(-25 + (i - 1) * 2, 0.8, 8);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            scene.add(wheel);
            objects.push(wheel);

            var wheel2 = wheel.clone();
            wheel2.position.set(-25 + (i - 1) * 2, 0.8, 12);
            scene.add(wheel2);
            objects.push(wheel2);
        }

        for (var i = 0; i < 4; i++) {
            var gunNestGeometry = new THREE.BoxGeometry(4, 0.6, 4);
            var gunNestMaterial = new THREE.MeshLambertMaterial({ color: 0xa0826d });
            var gunNest = new THREE.Mesh(gunNestGeometry, gunNestMaterial);
            gunNest.position.set(15 + i * 8, 0.3, 20 + i * 5);
            gunNest.castShadow = true;
            gunNest.receiveShadow = true;
            scene.add(gunNest);
            objects.push(gunNest);

            var gunBarrelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3, 8);
            var gunBarrelMaterial = new THREE.MeshLambertMaterial({ color: darkSteel });
            var gunBarrel = new THREE.Mesh(gunBarrelGeometry, gunBarrelMaterial);
            gunBarrel.position.set(15 + i * 8, 1.2, 20 + i * 5);
            gunBarrel.rotation.z = Math.PI / 4;
            gunBarrel.castShadow = true;
            gunBarrel.receiveShadow = true;
            scene.add(gunBarrel);
            objects.push(gunBarrel);
        }

        for (var i = 0; i < 5; i++) {
            var helmetGeometry = new THREE.SphereGeometry(0.6, 8, 6);
            var helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x556b2f });
            var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
            helmet.position.set(5, 0.6 + i * 0.5, -15 - i * 0.3);
            helmet.scale.y = 0.7;
            helmet.castShadow = true;
            helmet.receiveShadow = true;
            scene.add(helmet);
            objects.push(helmet);
        }
    }

    function buildModernMilitary() {
        var oliveDrab = 0x556b2f;
        var concreteGray = 0x808080;

        for (var i = 0; i < 4; i++) {
            var checkpointGeometry = new THREE.BoxGeometry(3, 0.5, 3);
            var checkpointMaterial = new THREE.MeshLambertMaterial({ color: concreteGray });
            var checkpoint = new THREE.Mesh(checkpointGeometry, checkpointMaterial);
            checkpoint.position.set(-35 + i * 12, 0.25, 35);
            checkpoint.castShadow = true;
            checkpoint.receiveShadow = true;
            scene.add(checkpoint);
            objects.push(checkpoint);

            var barrierGeometry = new THREE.BoxGeometry(2, 1.5, 0.4);
            var barrierMaterial = new THREE.MeshLambertMaterial({ color: oliveDrab });
            var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(-35 + i * 12, 0.75, 32);
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            scene.add(barrier);
            objects.push(barrier);
        }

        for (var i = 0; i < 6; i++) {
            var panelGeometry = new THREE.BoxGeometry(2, 3, 0.2);
            var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(-40 + i * 15, 2, 0);
            panel.castShadow = true;
            panel.receiveShadow = true;
            scene.add(panel);
            objects.push(panel);

            var frameGeometry = new THREE.BoxGeometry(2.5, 0.4, 2.5);
            var frameMaterial = new THREE.MeshLambertMaterial({ color: concreteGray });
            var frame = new THREE.Mesh(frameGeometry, frameMaterial);
            frame.position.set(-40 + i * 15, -0.2, 0);
            frame.castShadow = true;
            frame.receiveShadow = true;
            scene.add(frame);
            objects.push(frame);
        }

        for (var i = 0; i < 8; i++) {
            var towerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
            var towerMaterial = new THREE.MeshLambertMaterial({ color: oliveDrab });
            var tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.position.set(40 + i * 10, 3, -45);
            tower.castShadow = true;
            tower.receiveShadow = true;
            scene.add(tower);
            objects.push(tower);

            var searchlightGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            var searchlightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
            var searchlight = new THREE.Mesh(searchlightGeometry, searchlightMaterial);
            searchlight.position.set(40 + i * 10, 5.5, -45);
            searchlight.castShadow = true;
            searchlight.receiveShadow = true;
            scene.add(searchlight);
            objects.push(searchlight);
        }
    }

    function buildTerrain() {
        var baseGeometry = new THREE.BoxGeometry(150, 0.5, 150);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.25;
        base.receiveShadow = true;
        scene.add(base);
        objects.push(base);

        for (var i = 0; i < 20; i++) {
            var rockGeometry = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 6, 6);
            var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
            var rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(-60 + Math.random() * 120, 0.3, -60 + Math.random() * 120);
            rock.castShadow = true;
            rock.receiveShadow = true;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildAtmosphere() {
        for (var i = 0; i < 30; i++) {
            var dustGeometry = new THREE.SphereGeometry(0.05 + Math.random() * 0.05, 4, 4);
            var dustMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
            var dust = new THREE.Mesh(dustGeometry, dustMaterial);
            dust.position.set(-50 + Math.random() * 100, 5 + Math.random() * 15, -50 + Math.random() * 100);
            dust.opacity = 0.5;
            scene.add(dust);
            dustParticles.push({
                mesh: dust,
                startY: dust.position.y,
                speed: 0.5 + Math.random() * 1.5,
                frequency: 2 + Math.random() * 2
            });
            objects.push(dust);
        }

        for (var i = 0; i < 6; i++) {
            var torchStickGeometry = new THREE.CylinderGeometry(0.1, 0.15, 3, 6);
            var torchStickMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
            var torchStick = new THREE.Mesh(torchStickGeometry, torchStickMaterial);
            torchStick.position.set(-40 + i * 15, 1.5, 50);
            torchStick.castShadow = true;
            torchStick.receiveShadow = true;
            scene.add(torchStick);
            objects.push(torchStick);

            var flameGeometry = new THREE.ConeGeometry(0.5, 1.5, 6);
            var flameMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b1a });
            var flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.set(-40 + i * 15, 3.2, 50);
            scene.add(flame);
            torches.push({
                mesh: flame,
                baseScale: 1.0,
                time: Math.random() * Math.PI * 2
            });
            objects.push(flame);
        }
    }

    function buildTrenches() {
        for (var i = 0; i < 3; i++) {
            var trenchLength = 40;
            var wallHeight = 2;

            var ancientWallGeometry = new THREE.BoxGeometry(trenchLength, wallHeight, 0.8);
            var ancientWallMaterial = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
            var ancientWall = new THREE.Mesh(ancientWallGeometry, ancientWallMaterial);
            ancientWall.position.set(0, wallHeight / 2, -60 + i * 8);
            ancientWall.castShadow = true;
            ancientWall.receiveShadow = true;
            scene.add(ancientWall);
            objects.push(ancientWall);

            for (var j = 0; j < 15; j++) {
                var sandbagGeometry = new THREE.BoxGeometry(2, 0.8, 1.2);
                var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xa0826d });
                var sandbag = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
                sandbag.position.set(-20 + j * 3, 0.4, -54 + i * 8);
                sandbag.castShadow = true;
                sandbag.receiveShadow = true;
                scene.add(sandbag);
                objects.push(sandbag);
            }
        }

        for (var i = 0; i < 8; i++) {
            var wireGeometry = new THREE.BoxGeometry(8, 2, 0.1);
            var wireMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var wire = new THREE.Mesh(wireGeometry, wireMaterial);
            wire.position.set(-30 + i * 12, 1, 0);
            wire.castShadow = true;
            wire.receiveShadow = true;
            scene.add(wire);
            objects.push(wire);
        }
    }

    function buildArchaeology() {
        for (var i = 0; i < 4; i++) {
            var pitGeometry = new THREE.BoxGeometry(6, 2, 6);
            var pitMaterial = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
            var pit = new THREE.Mesh(pitGeometry, pitMaterial);
            pit.position.set(-50 + i * 25, -1, -20);
            pit.castShadow = true;
            pit.receiveShadow = true;
            scene.add(pit);
            objects.push(pit);

            for (var j = 0; j < 2; j++) {
                var frameGeometry = new THREE.BoxGeometry(6.5, 0.4, 0.4);
                var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
                var frame = new THREE.Mesh(frameGeometry, frameMaterial);
                frame.position.set(-50 + i * 25, 1 + j * 0.5, -20);
                frame.castShadow = true;
                frame.receiveShadow = true;
                scene.add(frame);
                objects.push(frame);

                var frame2 = frame.clone();
                frame2.rotation.z = Math.PI / 2;
                frame2.scale.x = 1;
                frame2.scale.z = 1;
                scene.add(frame2);
                objects.push(frame2);
            }
        }

        for (var i = 0; i < 10; i++) {
            var sherdGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.6);
            var sherdMaterial = new THREE.MeshLambertMaterial({ color: 0xb8860b });
            var sherd = new THREE.Mesh(sherdGeometry, sherdMaterial);
            sherd.position.set(-50 + Math.random() * 100, 0.2, -20 + Math.random() * 10);
            sherd.castShadow = true;
            sherd.receiveShadow = true;
            scene.add(sherd);
            objects.push(sherd);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 40, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 150;
        directionalLight.shadow.camera.left = -75;
        directionalLight.shadow.camera.right = 75;
        directionalLight.shadow.camera.top = 75;
        directionalLight.shadow.camera.bottom = -75;
        scene.add(directionalLight);
        lights.push(directionalLight);

        for (var i = 0; i < 4; i++) {
            var pointLight = new THREE.PointLight(0xff6b1a, 1, 40);
            pointLight.position.set(-40 + i * 30, 5, 50);
            pointLight.castShadow = true;
            scene.add(pointLight);
            lights.push(pointLight);
        }
    }

    function update(delta) {
        for (var i = 0; i < dustParticles.length; i++) {
            var particle = dustParticles[i];
            particle.time = (particle.time || 0) + delta * particle.frequency;
            particle.mesh.position.y = particle.startY + Math.sin(particle.time) * 0.5;
            particle.mesh.position.x += (Math.sin(particle.time * 0.5) * 0.01);
        }

        for (var i = 0; i < torches.length; i++) {
            var torch = torches[i];
            torch.time += delta * 3;
            var flicker = 0.8 + Math.sin(torch.time) * 0.2 + Math.sin(torch.time * 0.7) * 0.1;
            torch.mesh.scale.y = torch.baseScale * flicker;
            torch.mesh.scale.x = torch.baseScale * (flicker * 0.8);
            torch.mesh.scale.z = torch.baseScale * (flicker * 0.8);
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
        dustParticles = [];
        torches = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
