window.IronShore = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var waveIndex = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        waveIndex = 0;
        buildCoastline();
        buildIronCliffs();
        buildFortification();
        buildBeachHead();
        buildNavalGuns();
        buildBunkers();
        buildSupplyRoute();
        buildObservationDeck();
        buildAntiTank();
        setupLighting();
    }

    function buildCoastline() {
        var seawallGeom = new THREE.BoxGeometry(200, 15, 8);
        var seawallMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var seawall = new THREE.Mesh(seawallGeom, seawallMat);
        seawall.position.set(0, 2, -85);
        scene.add(seawall);
        objects.push(seawall);

        var beachGeom = new THREE.BoxGeometry(200, 2, 60);
        var beachMat = new THREE.MeshLambertMaterial({ color: 0xCDB892 });
        var beach = new THREE.Mesh(beachGeom, beachMat);
        beach.position.set(0, 0.5, -30);
        scene.add(beach);
        objects.push(beach);

        for (var i = 0; i < 8; i++) {
            var waveGeom = new THREE.SphereGeometry(3, 8, 8);
            var waveMat = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
            var wave = new THREE.Mesh(waveGeom, waveMat);
            wave.position.set(-80 + i * 25, 1, -95);
            wave.userData.waveOffset = i;
            scene.add(wave);
            objects.push(wave);
        }
    }

    function buildIronCliffs() {
        var cliffHeight = 80;
        var colors = [0x8B3A3A, 0xA0522D, 0x7A3C2B, 0x9B4444, 0x8B4513];

        for (var layer = 0; layer < 5; layer++) {
            for (var col = 0; col < 4; col++) {
                var cliffGeom = new THREE.BoxGeometry(45, cliffHeight / 5, 35);
                var cliffMat = new THREE.MeshLambertMaterial({ color: colors[layer] });
                var cliff = new THREE.Mesh(cliffGeom, cliffMat);
                cliff.position.set(-75 + col * 50, 40 + layer * 16, 20);
                scene.add(cliff);
                objects.push(cliff);
            }
        }

        for (var i = 0; i < 12; i++) {
            var oreGeom = new THREE.SphereGeometry(2 + Math.random() * 2, 6, 6);
            var oreMat = new THREE.MeshLambertMaterial({ color: 0xCD5C5C });
            var ore = new THREE.Mesh(oreGeom, oreMat);
            ore.position.set(-90 + Math.random() * 180, 30 + Math.random() * 60, 10 + Math.random() * 20);
            scene.add(ore);
            objects.push(ore);
        }
    }

    function buildFortification() {
        var gun1Geom = new THREE.BoxGeometry(35, 25, 25);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var gun1 = new THREE.Mesh(gun1Geom, gunMat);
        gun1.position.set(-60, 65, 15);
        scene.add(gun1);
        objects.push(gun1);

        var gun2 = new THREE.Mesh(gun1Geom, gunMat);
        gun2.position.set(0, 70, 20);
        scene.add(gun2);
        objects.push(gun2);

        var gun3 = new THREE.Mesh(gun1Geom, gunMat);
        gun3.position.set(60, 65, 15);
        scene.add(gun3);
        objects.push(gun3);

        var barrel1Geom = new THREE.CylinderGeometry(3, 3, 45, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var barrel1 = new THREE.Mesh(barrel1Geom, barrelMat);
        barrel1.rotation.z = Math.PI / 8;
        barrel1.position.set(-60, 75, 45);
        scene.add(barrel1);
        objects.push(barrel1);

        var barrel2 = new THREE.Mesh(barrel1Geom, barrelMat);
        barrel2.rotation.z = Math.PI / 8;
        barrel2.position.set(0, 80, 50);
        scene.add(barrel2);
        objects.push(barrel2);

        var barrel3 = new THREE.Mesh(barrel1Geom, barrelMat);
        barrel3.rotation.z = Math.PI / 8;
        barrel3.position.set(60, 75, 45);
        scene.add(barrel3);
        objects.push(barrel3);
    }

    function buildBeachHead() {
        for (var i = 0; i < 6; i++) {
            var obstacleGeom = new THREE.BoxGeometry(15, 10, 15);
            var obstacleMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
            var obstacle = new THREE.Mesh(obstacleGeom, obstacleMat);
            obstacle.position.set(-70 + i * 30, 5, -50);
            scene.add(obstacle);
            objects.push(obstacle);
        }

        for (var i = 0; i < 8; i++) {
            var crossGeom = new THREE.BoxGeometry(20, 8, 4);
            var crossMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
            var cross1 = new THREE.Mesh(crossGeom, crossMat);
            cross1.rotation.z = Math.PI / 4;
            cross1.position.set(-80 + i * 25, 4, -20);
            scene.add(cross1);
            objects.push(cross1);

            var cross2 = new THREE.Mesh(crossGeom, crossMat);
            cross2.rotation.z = -Math.PI / 4;
            cross2.position.set(-80 + i * 25, 4, -20);
            scene.add(cross2);
            objects.push(cross2);
        }

        for (var i = 0; i < 10; i++) {
            var spikeGeom = new THREE.CylinderGeometry(1.5, 1, 8, 8);
            var spikeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var spike = new THREE.Mesh(spikeGeom, spikeMat);
            spike.position.set(-85 + i * 20, 4, -15);
            scene.add(spike);
            objects.push(spike);
        }
    }

    function buildNavalGuns() {
        var baseGeom = new THREE.CylinderGeometry(20, 20, 8, 16);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x5C5C5C });
        var base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(30, 12, -10);
        scene.add(base);
        objects.push(base);

        var housingGeom = new THREE.BoxGeometry(25, 18, 30);
        var housingMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var housing = new THREE.Mesh(housingGeom, housingMat);
        housing.position.set(30, 25, -10);
        scene.add(housing);
        objects.push(housing);

        var turretGeom = new THREE.CylinderGeometry(12, 12, 6, 16);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var turret = new THREE.Mesh(turretGeom, turretMat);
        turret.position.set(30, 35, -10);
        scene.add(turret);
        objects.push(turret);

        var gunBarrelGeom = new THREE.CylinderGeometry(2.5, 2.5, 40, 10);
        var gunBarrelMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        var gunBarrel = new THREE.Mesh(gunBarrelGeom, gunBarrelMat);
        gunBarrel.rotation.z = Math.PI / 12;
        gunBarrel.position.set(40, 40, -10);
        scene.add(gunBarrel);
        objects.push(gunBarrel);
    }

    function buildBunkers() {
        for (var i = 0; i < 5; i++) {
            var bunkerGeom = new THREE.BoxGeometry(25, 18, 30);
            var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
            var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
            bunker.position.set(-70 + i * 35, 35, 45);
            scene.add(bunker);
            objects.push(bunker);
        }

        for (var i = 0; i < 7; i++) {
            var embrasureGeom = new THREE.BoxGeometry(8, 8, 4);
            var embrasureMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
            var embrasure = new THREE.Mesh(embrasureGeom, embrasureMat);
            embrasure.position.set(-60 + i * 30, 40, 62);
            scene.add(embrasure);
            objects.push(embrasure);
        }
    }

    function buildSupplyRoute() {
        for (var i = 0; i < 10; i++) {
            var crateGeom = new THREE.BoxGeometry(12, 10, 12);
            var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
            var crate = new THREE.Mesh(crateGeom, crateMat);
            crate.position.set(-85 + i * 18, 5 + i * 2, 30);
            scene.add(crate);
            objects.push(crate);
        }

        var elevatorGeom = new THREE.BoxGeometry(15, 80, 15);
        var elevatorMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var elevator = new THREE.Mesh(elevatorGeom, elevatorMat);
        elevator.position.set(-85, 45, 60);
        scene.add(elevator);
        objects.push(elevator);

        for (var i = 0; i < 6; i++) {
            var platformGeom = new THREE.BoxGeometry(20, 3, 20);
            var platformMat = new THREE.MeshLambertMaterial({ color: 0x5C5C5C });
            var platform = new THREE.Mesh(platformGeom, platformMat);
            platform.position.set(-85, 20 + i * 12, 60);
            scene.add(platform);
            objects.push(platform);
        }
    }

    function buildObservationDeck() {
        var supportGeom = new THREE.BoxGeometry(8, 50, 8);
        var supportMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var support1 = new THREE.Mesh(supportGeom, supportMat);
        support1.position.set(70, 40, 50);
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(supportGeom, supportMat);
        support2.position.set(85, 40, 50);
        scene.add(support2);
        objects.push(support2);

        var deckGeom = new THREE.BoxGeometry(35, 4, 30);
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x5C5C5C });
        var deck = new THREE.Mesh(deckGeom, deckMat);
        deck.position.set(77.5, 75, 50);
        scene.add(deck);
        objects.push(deck);

        var railingGeom = new THREE.BoxGeometry(2, 8, 35);
        var railingMat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var railing1 = new THREE.Mesh(railingGeom, railingMat);
        railing1.position.set(55, 72, 50);
        scene.add(railing1);
        objects.push(railing1);

        var railing2 = new THREE.Mesh(railingGeom, railingMat);
        railing2.position.set(100, 72, 50);
        scene.add(railing2);
        objects.push(railing2);
    }

    function buildAntiTank() {
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 4; col++) {
                var x1Geom = new THREE.BoxGeometry(20, 12, 4);
                var xMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
                var x1 = new THREE.Mesh(x1Geom, xMat);
                x1.rotation.z = Math.PI / 4;
                x1.position.set(-60 + col * 35, 6, -45 + row * 15);
                scene.add(x1);
                objects.push(x1);

                var x2 = new THREE.Mesh(x1Geom, xMat);
                x2.rotation.z = -Math.PI / 4;
                x2.position.set(-60 + col * 35, 6, -45 + row * 15);
                scene.add(x2);
                objects.push(x2);
            }
        }
    }

    function buildCrashedCraft() {
        var hullGeom = new THREE.BoxGeometry(40, 20, 60);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.rotation.z = Math.PI / 12;
        hull.position.set(-60, 8, -60);
        scene.add(hull);
        objects.push(hull);

        var propGeom = new THREE.CylinderGeometry(3, 3, 25, 10);
        var propMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
        var propeller = new THREE.Mesh(propGeom, propMat);
        propeller.rotation.x = Math.PI / 4;
        propeller.position.set(-30, 5, -85);
        scene.add(propeller);
        objects.push(propeller);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(100, 120, 80);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var spotLight = new THREE.SpotLight(0xFFFFFF, 0.5);
        spotLight.position.set(0, 100, 0);
        spotLight.castShadow = true;
        scene.add(spotLight);
        lights.push(spotLight);
    }

    function update(delta) {
        waveIndex = (waveIndex + delta) % (Math.PI * 2);
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].userData.waveOffset !== undefined) {
                objects[i].position.y = 1 + Math.sin(waveIndex + objects[i].userData.waveOffset) * 0.3;
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

    buildCrashedCraft();

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
