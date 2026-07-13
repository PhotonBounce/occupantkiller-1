window.DeargFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildFort();
    }

    function buildFort() {
        // Red granite mountaintop plateau
        var plateauGeo = new THREE.BoxGeometry(80, 12, 80);
        var plateauMat = new THREE.MeshLambertMaterial({ color: 0xaa3333 });
        var plateau = new THREE.Mesh(plateauGeo, plateauMat);
        plateau.position.set(0, -6, 0);
        scene.add(plateau);
        objects.push(plateau);

        // Pictish symbol stone 1 - tall monolith with spiral carving
        var stoneGeo1 = new THREE.BoxGeometry(4, 18, 3);
        var stoneMat1 = new THREE.MeshLambertMaterial({ color: 0x993333 });
        var stone1 = new THREE.Mesh(stoneGeo1, stoneMat1);
        stone1.position.set(-20, 10, -15);
        stone1.rotation.z = 0.1;
        scene.add(stone1);
        objects.push(stone1);

        // Spiral carving on stone 1
        var spiralGeo1 = new THREE.BufferGeometry();
        var spiralPoints1 = [];
        for (var i = 0; i < 30; i++) {
            var angle = i * 0.4;
            var radius = 1 + i * 0.05;
            spiralPoints1.push(
                new THREE.Vector3(
                    Math.cos(angle) * radius - 20,
                    i * 0.5 + 8,
                    Math.sin(angle) * radius - 15
                )
            );
        }
        spiralGeo1.setFromPoints(spiralPoints1);
        var spiralMat1 = new THREE.LineBasicMaterial({ color: 0xffeecc });
        var spiral1 = new THREE.LineSegments(spiralGeo1, spiralMat1);
        scene.add(spiral1);
        objects.push(spiral1);

        // Pictish symbol stone 2 - another monolith
        var stoneGeo2 = new THREE.BoxGeometry(3, 20, 4);
        var stoneMat2 = new THREE.MeshLambertMaterial({ color: 0xbb4444 });
        var stone2 = new THREE.Mesh(stoneGeo2, stoneMat2);
        stone2.position.set(18, 12, 20);
        stone2.rotation.z = -0.15;
        scene.add(stone2);
        objects.push(stone2);

        // Spiral carving on stone 2
        var spiralGeo2 = new THREE.BufferGeometry();
        var spiralPoints2 = [];
        for (var i = 0; i < 28; i++) {
            var angle = i * 0.35;
            var radius = 1.2 + i * 0.04;
            spiralPoints2.push(
                new THREE.Vector3(
                    Math.cos(angle) * radius + 18,
                    i * 0.55 + 10,
                    Math.sin(angle) * radius + 20
                )
            );
        }
        spiralGeo2.setFromPoints(spiralPoints2);
        var spiralMat2 = new THREE.LineBasicMaterial({ color: 0xffeecc });
        var spiral2 = new THREE.LineSegments(spiralGeo2, spiralMat2);
        scene.add(spiral2);
        objects.push(spiral2);

        // Summit fire cairn - stacked sphere boulders
        var cairnSphere1Geo = new THREE.SphereGeometry(5, 12, 12);
        var cairnMat = new THREE.MeshLambertMaterial({ color: 0xcc6666 });
        var cairnSphere1 = new THREE.Mesh(cairnSphere1Geo, cairnMat);
        cairnSphere1.position.set(5, 6, -5);
        scene.add(cairnSphere1);
        objects.push(cairnSphere1);

        var cairnSphere2Geo = new THREE.SphereGeometry(4, 12, 12);
        var cairnSphere2 = new THREE.Mesh(cairnSphere2Geo, cairnMat);
        cairnSphere2.position.set(5, 16, -5);
        scene.add(cairnSphere2);
        objects.push(cairnSphere2);

        var cairnSphere3Geo = new THREE.SphereGeometry(3, 12, 12);
        var cairnMat3 = new THREE.MeshLambertMaterial({ color: 0xff8844 });
        var cairnSphere3 = new THREE.Mesh(cairnSphere3Geo, cairnMat3);
        cairnSphere3.position.set(5, 23, -5);
        scene.add(cairnSphere3);
        objects.push(cairnSphere3);

        // Fire sphere at top of cairn
        var fireGeo = new THREE.SphereGeometry(2.5, 10, 10);
        var fireMat = new THREE.MeshLambertMaterial({ color: 0xffaa44 });
        var fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.set(5, 29, -5);
        scene.add(fire);
        objects.push(fire);

        // High-altitude AA gun position on box mount
        var gunMountGeo = new THREE.BoxGeometry(8, 6, 8);
        var gunMountMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var gunMount = new THREE.Mesh(gunMountGeo, gunMountMat);
        gunMount.position.set(25, 8, 10);
        scene.add(gunMount);
        objects.push(gunMount);

        // AA gun barrel - tall cylinder pointing skyward
        var gunGeo = new THREE.CylinderGeometry(1, 1, 20, 8);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var gun = new THREE.Mesh(gunGeo, gunMat);
        gun.position.set(25, 21, 10);
        gun.rotation.z = 0.3;
        scene.add(gun);
        objects.push(gun);

        // Cloud-obscured sniper hide - box position behind sphere boulders
        var cloudSphere1Geo = new THREE.SphereGeometry(8, 12, 12);
        var cloudMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var cloudSphere1 = new THREE.Mesh(cloudSphere1Geo, cloudMat);
        cloudSphere1.position.set(-25, 12, 15);
        scene.add(cloudSphere1);
        objects.push(cloudSphere1);

        var cloudSphere2Geo = new THREE.SphereGeometry(7, 12, 12);
        var cloudSphere2 = new THREE.Mesh(cloudSphere2Geo, cloudMat);
        cloudSphere2.position.set(-30, 18, 18);
        scene.add(cloudSphere2);
        objects.push(cloudSphere2);

        // Hide box behind clouds
        var hideGeo = new THREE.BoxGeometry(6, 5, 5);
        var hideMat = new THREE.MeshLambertMaterial({ color: 0x774444 });
        var hide = new THREE.Mesh(hideGeo, hideMat);
        hide.position.set(-26, 15, 20);
        scene.add(hide);
        objects.push(hide);

        // Weather monitoring station - box hut
        var weatherHutGeo = new THREE.BoxGeometry(10, 8, 10);
        var weatherHutMat = new THREE.MeshLambertMaterial({ color: 0x882222 });
        var weatherHut = new THREE.Mesh(weatherHutGeo, weatherHutMat);
        weatherHut.position.set(-10, 4, -20);
        scene.add(weatherHut);
        objects.push(weatherHut);

        // Cylinder anemometer on hut
        var anemometerGeo = new THREE.CylinderGeometry(2, 2, 12, 8);
        var anemometerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var anemometer = new THREE.Mesh(anemometerGeo, anemometerMat);
        anemometer.position.set(-10, 16, -20);
        scene.add(anemometer);
        objects.push(anemometer);

        // Wires from anemometer
        var wireGeo = new THREE.BufferGeometry();
        var wirePoints = [
            new THREE.Vector3(-10, 28, -20),
            new THREE.Vector3(-10, 15, -20),
            new THREE.Vector3(-15, 15, -20),
            new THREE.Vector3(-10, 15, -20),
            new THREE.Vector3(-5, 15, -20),
            new THREE.Vector3(-10, 15, -20),
            new THREE.Vector3(-10, 15, -25),
            new THREE.Vector3(-10, 15, -20),
            new THREE.Vector3(-10, 15, -15)
        ];
        wireGeo.setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var wires = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wires);
        objects.push(wires);

        // Emergency oxygen cache - cylinder tanks in box shelter
        var cacheBoxGeo = new THREE.BoxGeometry(8, 6, 8);
        var cacheBoxMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
        var cacheBox = new THREE.Mesh(cacheBoxGeo, cacheBoxMat);
        cacheBox.position.set(15, 4, -22);
        scene.add(cacheBox);
        objects.push(cacheBox);

        // Oxygen tanks - three cylinders
        var tankGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4488cc });
        for (var t = 0; t < 3; t++) {
            var tank = new THREE.Mesh(tankGeo, tankMat);
            tank.position.set(12 + t * 2.5, 8, -22);
            scene.add(tank);
            objects.push(tank);
        }

        // Summit flag pole - tall cylinder
        var flagPoleGeo = new THREE.CylinderGeometry(1.2, 1.2, 25, 8);
        var flagPoleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var flagPole = new THREE.Mesh(flagPoleGeo, flagPoleMat);
        flagPole.position.set(30, 16, -10);
        scene.add(flagPole);
        objects.push(flagPole);

        // Flag - box at top of pole
        var flagGeo = new THREE.BoxGeometry(6, 4, 0.5);
        var flagMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var flag = new THREE.Mesh(flagGeo, flagMat);
        flag.position.set(33, 31, -10);
        flag.rotation.y = 0.3;
        scene.add(flag);
        objects.push(flag);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffdd99, 0.8);
        directionalLight.position.set(40, 30, 40);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var fireLight = new THREE.PointLight(0xff8844, 0.5);
        fireLight.position.set(5, 32, -5);
        scene.add(fireLight);
        lights.push(fireLight);
    }

    function update(delta) {
        // Animate fire sphere - gentle bobbing
        if (objects.length > 8) {
            var fireObj = objects[8];
            if (fireObj && fireObj.position) {
                fireObj.position.y = 29 + Math.sin(Date.now() * 0.003) * 0.8;
            }
        }

        // Rotate anemometer
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] && objects[i].position.x === -10 && objects[i].position.y === 16) {
                objects[i].rotation.y += 0.03;
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
