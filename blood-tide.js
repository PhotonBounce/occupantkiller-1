window.BloodTide = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var tideTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        tideTime = 0;
        buildShore();
        buildBloodwater();
        buildWrecks();
        buildDefenses();
        buildTide();
        buildObstacles();
        buildDebris();
        buildCannon();
        setupLighting();
    }

    function buildShore() {
        var sandColor = 0xD2B48C;
        var shoreGeom = new THREE.BoxGeometry(150, 8, 80);
        var shoreMat = new THREE.MeshLambertMaterial({ color: sandColor });
        var shoreMesh = new THREE.Mesh(shoreGeom, shoreMat);
        shoreMesh.position.y = 0;
        shoreMesh.position.z = -40;
        scene.add(shoreMesh);
        objects.push(shoreMesh);

        for (var i = 0; i < 12; i++) {
            var dune = new THREE.Mesh(
                new THREE.BoxGeometry(20 + Math.random() * 15, 4 + Math.random() * 3, 15 + Math.random() * 10),
                new THREE.MeshLambertMaterial({ color: 0xC9A961 })
            );
            dune.position.x = -60 + Math.random() * 120;
            dune.position.y = 3;
            dune.position.z = -30 + Math.random() * 40;
            dune.rotation.z = (Math.random() - 0.5) * 0.3;
            scene.add(dune);
            objects.push(dune);
        }

        for (var i = 0; i < 8; i++) {
            var cliffSegment = new THREE.Mesh(
                new THREE.BoxGeometry(30, 20 + i * 3, 25),
                new THREE.MeshLambertMaterial({ color: 0x808080 })
            );
            cliffSegment.position.x = -80 + i * 25;
            cliffSegment.position.y = 8 + i * 1.5;
            cliffSegment.position.z = 30;
            scene.add(cliffSegment);
            objects.push(cliffSegment);
        }
    }

    function buildBloodwater() {
        var waterColor = 0x660000;
        var waterGeom = new THREE.BoxGeometry(300, 25, 200);
        var waterMat = new THREE.MeshLambertMaterial({ color: waterColor });
        var waterMesh = new THREE.Mesh(waterGeom, waterMat);
        waterMesh.position.y = -10;
        waterMesh.position.z = 60;
        scene.add(waterMesh);
        objects.push(waterMesh);

        for (var i = 0; i < 20; i++) {
            var darkWater = new THREE.Mesh(
                new THREE.BoxGeometry(40 + Math.random() * 30, 2, 35 + Math.random() * 25),
                new THREE.MeshLambertMaterial({ color: 0x4B0000 })
            );
            darkWater.position.x = -140 + Math.random() * 280;
            darkWater.position.y = -12 + Math.random() * 2;
            darkWater.position.z = 20 + Math.random() * 80;
            scene.add(darkWater);
            objects.push(darkWater);
        }
    }

    function buildWrecks() {
        for (var i = 0; i < 4; i++) {
            var hullGeom = new THREE.BoxGeometry(35 + i * 5, 15 + Math.random() * 10, 60 + i * 8);
            var hullMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var hull = new THREE.Mesh(hullGeom, hullMat);
            hull.position.x = -80 + i * 50;
            hull.position.y = -8 + Math.random() * 3;
            hull.position.z = 80 + i * 20;
            hull.rotation.z = (Math.random() - 0.5) * 0.5;
            hull.rotation.x = (Math.random() - 0.5) * 0.3;
            scene.add(hull);
            objects.push(hull);

            for (var j = 0; j < 3; j++) {
                var mast = new THREE.Mesh(
                    new THREE.CylinderGeometry(1.5, 1.5, 25 + j * 5, 8),
                    new THREE.MeshLambertMaterial({ color: 0x222222 })
                );
                mast.position.x = hull.position.x - 10 + j * 10;
                mast.position.y = hull.position.y + 10;
                mast.position.z = hull.position.z;
                mast.rotation.z = (Math.random() - 0.5) * 0.8;
                scene.add(mast);
                objects.push(mast);
            }
        }

        for (var i = 0; i < 6; i++) {
            var landingCraft = new THREE.Mesh(
                new THREE.BoxGeometry(20 + Math.random() * 10, 8, 40 + Math.random() * 15),
                new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
            );
            landingCraft.position.x = -70 + Math.random() * 140;
            landingCraft.position.y = 2;
            landingCraft.position.z = -35 + Math.random() * 20;
            landingCraft.rotation.z = (Math.random() - 0.5) * 0.4;
            scene.add(landingCraft);
            objects.push(landingCraft);

            var ramp = new THREE.Mesh(
                new THREE.BoxGeometry(15, 4, 25),
                new THREE.MeshLambertMaterial({ color: 0x3A3A3A })
            );
            ramp.position.x = landingCraft.position.x;
            ramp.position.y = 5;
            ramp.position.z = landingCraft.position.z - 20;
            ramp.rotation.x = 0.3;
            scene.add(ramp);
            objects.push(ramp);
        }
    }

    function buildDefenses() {
        for (var i = 0; i < 3; i++) {
            var bunker = new THREE.Mesh(
                new THREE.BoxGeometry(25, 12, 30),
                new THREE.MeshLambertMaterial({ color: 0x555555 })
            );
            bunker.position.x = -50 + i * 50;
            bunker.position.y = 15;
            bunker.position.z = 25;
            scene.add(bunker);
            objects.push(bunker);

            var gunport = new THREE.Mesh(
                new THREE.BoxGeometry(8, 6, 3),
                new THREE.MeshLambertMaterial({ color: 0x222222 })
            );
            gunport.position.x = bunker.position.x;
            gunport.position.y = bunker.position.y + 2;
            gunport.position.z = bunker.position.z + 16;
            scene.add(gunport);
            objects.push(gunport);
        }

        for (var i = 0; i < 12; i++) {
            var barricade = new THREE.Mesh(
                new THREE.BoxGeometry(3, 4, 15),
                new THREE.MeshLambertMaterial({ color: 0x8B4513 })
            );
            barricade.position.x = -60 + Math.random() * 120;
            barricade.position.y = 2;
            barricade.position.z = 15 + Math.random() * 20;
            barricade.rotation.y = Math.random() * Math.PI;
            scene.add(barricade);
            objects.push(barricade);
        }

        for (var i = 0; i < 8; i++) {
            var wall = new THREE.Mesh(
                new THREE.BoxGeometry(40, 6, 3),
                new THREE.MeshLambertMaterial({ color: 0x666666 })
            );
            wall.position.x = -60 + i * 30;
            wall.position.y = 3;
            wall.position.z = 8;
            scene.add(wall);
            objects.push(wall);
        }
    }

    function buildTide() {
        var tideColor = 0x8B0000;
        for (var i = 0; i < 25; i++) {
            var tideSphere = new THREE.Mesh(
                new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8),
                new THREE.MeshLambertMaterial({ color: tideColor })
            );
            tideSphere.position.x = -100 + Math.random() * 200;
            tideSphere.position.y = -2;
            tideSphere.position.z = -20 + Math.random() * 40;
            tideSphere.userData.originalY = tideSphere.position.y;
            tideSphere.userData.phase = Math.random() * Math.PI * 2;
            scene.add(tideSphere);
            objects.push(tideSphere);
        }
    }

    function buildObstacles() {
        for (var i = 0; i < 6; i++) {
            var beamX = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 30, 8),
                new THREE.MeshLambertMaterial({ color: 0x444444 })
            );
            beamX.position.x = -60 + i * 25;
            beamX.position.y = 3;
            beamX.position.z = -40;
            beamX.rotation.z = Math.PI / 2;
            scene.add(beamX);
            objects.push(beamX);

            var beamZ = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 25, 8),
                new THREE.MeshLambertMaterial({ color: 0x444444 })
            );
            beamZ.position.x = -60 + i * 25;
            beamZ.position.y = 3;
            beamZ.position.z = -40;
            beamZ.rotation.x = Math.PI / 2;
            scene.add(beamZ);
            objects.push(beamZ);
        }

        for (var i = 0; i < 8; i++) {
            var stake = new THREE.Mesh(
                new THREE.CylinderGeometry(0.8, 0.8, 8, 6),
                new THREE.MeshLambertMaterial({ color: 0x5A4A3A })
            );
            stake.position.x = -70 + Math.random() * 140;
            stake.position.y = 4;
            stake.position.z = -30 + Math.random() * 50;
            scene.add(stake);
            objects.push(stake);
        }
    }

    function buildDebris() {
        for (var i = 0; i < 15; i++) {
            var helmet = new THREE.Mesh(
                new THREE.SphereGeometry(1.5 + Math.random() * 0.5, 8, 8),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            helmet.position.x = -80 + Math.random() * 160;
            helmet.position.y = 1;
            helmet.position.z = -35 + Math.random() * 45;
            helmet.scale.y = 0.7;
            scene.add(helmet);
            objects.push(helmet);
        }

        for (var i = 0; i < 12; i++) {
            var weapon = new THREE.Mesh(
                new THREE.BoxGeometry(1, 4, 30),
                new THREE.MeshLambertMaterial({ color: 0x222222 })
            );
            weapon.position.x = -75 + Math.random() * 150;
            weapon.position.y = 1;
            weapon.position.z = -32 + Math.random() * 42;
            weapon.rotation.z = Math.random() * Math.PI;
            scene.add(weapon);
            objects.push(weapon);
        }

        for (var i = 0; i < 10; i++) {
            var boot = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.5, 3, 6),
                new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
            );
            boot.position.x = -70 + Math.random() * 140;
            boot.position.y = 0.5;
            boot.position.z = -30 + Math.random() * 40;
            boot.rotation.x = (Math.random() - 0.5) * 0.5;
            scene.add(boot);
            objects.push(boot);
        }

        for (var i = 0; i < 8; i++) {
            var ammoBox = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2, 4),
                new THREE.MeshLambertMaterial({ color: 0x2A2A2A })
            );
            ammoBox.position.x = -65 + Math.random() * 130;
            ammoBox.position.y = 1;
            ammoBox.position.z = -28 + Math.random() * 38;
            scene.add(ammoBox);
            objects.push(ammoBox);
        }

        for (var i = 0; i < 9; i++) {
            var shell = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.3, 2, 8),
                new THREE.MeshLambertMaterial({ color: 0x444444 })
            );
            shell.position.x = -60 + Math.random() * 120;
            shell.position.y = 0.8;
            shell.position.z = -25 + Math.random() * 35;
            shell.rotation.x = (Math.random() - 0.5) * Math.PI;
            scene.add(shell);
            objects.push(shell);
        }
    }

    function buildCannon() {
        var platformGeom = new THREE.BoxGeometry(25, 3, 25);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.y = 25;
        platform.position.z = 35;
        platform.position.x = 70;
        scene.add(platform);
        objects.push(platform);

        var barrelGeom = new THREE.CylinderGeometry(1.2, 1.2, 40, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.y = 28;
        barrel.position.z = 35;
        barrel.position.x = 70;
        barrel.rotation.z = 0.4;
        barrel.userData.originalRotation = barrel.rotation.z;
        scene.add(barrel);
        objects.push(barrel);

        var breechGeom = new THREE.SphereGeometry(2.5, 12, 12);
        var breechMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var breech = new THREE.Mesh(breechGeom, breechMat);
        breech.position.y = 27;
        breech.position.z = 35;
        breech.position.x = 70;
        scene.add(breech);
        objects.push(breech);

        var carriage1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 15, 6),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        carriage1.position.y = 16;
        carriage1.position.z = 32;
        carriage1.position.x = 60;
        scene.add(carriage1);
        objects.push(carriage1);

        var carriage2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 15, 6),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        carriage2.position.y = 16;
        carriage2.position.z = 32;
        carriage2.position.x = 80;
        scene.add(carriage2);
        objects.push(carriage2);

        for (var i = 0; i < 4; i++) {
            var roundStack = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 8, 10),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            roundStack.position.x = 65 + i * 5;
            roundStack.position.y = 22;
            roundStack.position.z = 42;
            scene.add(roundStack);
            objects.push(roundStack);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x666666);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
        directionalLight.position.set(100, 100, 50);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xFF6666, 0.5, 200);
        pointLight1.position.set(-50, 30, 50);
        pointLight1.userData.isFlash = true;
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xFF8888, 0.3, 150);
        pointLight2.position.set(50, 40, 70);
        scene.add(pointLight2);
        lights.push(pointLight2);
    }

    function update(delta) {
        tideTime += delta;

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.userData.originalY !== undefined) {
                obj.position.y = obj.userData.originalY + Math.sin(tideTime * 2 + obj.userData.phase) * 1.5;
            }
        }

        for (var i = 0; i < lights.length; i++) {
            var light = lights[i];
            if (light.userData.isFlash) {
                var flashIntensity = 0.5 + Math.sin(tideTime * 3.5) * 0.3;
                if (flashIntensity < 0.3) flashIntensity = 0.3;
                light.intensity = flashIntensity;
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
        tideTime = 0;
    }

    return { init: init, update: update, reset: reset };
}());
