window.FogBase = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var radarDish = null;
    var fogSpheres = [];
    var radarDishRotation = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        fogSpheres = [];
        buildFogTerrain();
        buildRadarTowers();
        buildCommCenter();
        buildBarracks();
        buildHelipads();
        buildPerimeter();
        buildVehiclePool();
        buildFuelBowser();
        buildGeneratorShed();
        buildCommandTent();
        buildGuardTowers();
        setupLighting();
    }

    function buildFogTerrain() {
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0xd4d0c8 });

        var groundGeometry = new THREE.BoxGeometry(200, 2, 200);
        var groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.position.y = -1;
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);
        objects.push(groundMesh);

        var fogGeometry1 = new THREE.BoxGeometry(100, 3, 100);
        var fogMaterial = new THREE.MeshLambertMaterial({ color: 0xf0ede5, transparent: true, opacity: 0.3 });
        var fogMesh1 = new THREE.Mesh(fogGeometry1, fogMaterial);
        fogMesh1.position.set(-40, 5, -40);
        scene.add(fogMesh1);
        objects.push(fogMesh1);
        fogSpheres.push(fogMesh1);

        var fogGeometry2 = new THREE.BoxGeometry(80, 2, 80);
        var fogMesh2 = new THREE.Mesh(fogGeometry2, fogMaterial);
        fogMesh2.position.set(50, 3, 50);
        scene.add(fogMesh2);
        objects.push(fogMesh2);
        fogSpheres.push(fogMesh2);

        var fogSphereGeometry1 = new THREE.SphereGeometry(20, 8, 8);
        var fogSphereMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
        var fogSphere1 = new THREE.Mesh(fogSphereGeometry1, fogSphereMaterial);
        fogSphere1.position.set(-60, 12, -60);
        scene.add(fogSphere1);
        objects.push(fogSphere1);
        fogSpheres.push(fogSphere1);

        var fogSphereGeometry2 = new THREE.SphereGeometry(25, 8, 8);
        var fogSphere2 = new THREE.Mesh(fogSphereGeometry2, fogSphereMaterial);
        fogSphere2.position.set(70, 15, 70);
        scene.add(fogSphere2);
        objects.push(fogSphere2);
        fogSpheres.push(fogSphere2);

        var fogSphereGeometry3 = new THREE.SphereGeometry(18, 8, 8);
        var fogSphere3 = new THREE.Mesh(fogSphereGeometry3, fogSphereMaterial);
        fogSphere3.position.set(0, 10, -80);
        scene.add(fogSphere3);
        objects.push(fogSphere3);
        fogSpheres.push(fogSphere3);

        var fogSphereGeometry4 = new THREE.SphereGeometry(22, 8, 8);
        var fogSphere4 = new THREE.Mesh(fogSphereGeometry4, fogSphereMaterial);
        fogSphere4.position.set(80, 11, 0);
        scene.add(fogSphere4);
        objects.push(fogSphere4);
        fogSpheres.push(fogSphere4);
    }

    function buildRadarTowers() {
        var radarMaterial = new THREE.MeshLambertMaterial({ color: 0x7a8a7e });
        var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });

        var tower1Geometry = new THREE.CylinderGeometry(1.5, 1.5, 40, 8);
        var tower1 = new THREE.Mesh(tower1Geometry, radarMaterial);
        tower1.position.set(0, 20, 0);
        tower1.castShadow = true;
        scene.add(tower1);
        objects.push(tower1);

        var dishGeometry = new THREE.BoxGeometry(15, 1, 12);
        radarDish = new THREE.Mesh(dishGeometry, antennaMaterial);
        radarDish.position.set(0, 42, 0);
        radarDish.castShadow = true;
        scene.add(radarDish);
        objects.push(radarDish);

        var tower2Geometry = new THREE.CylinderGeometry(1.2, 1.2, 35, 8);
        var tower2 = new THREE.Mesh(tower2Geometry, radarMaterial);
        tower2.position.set(-60, 18, -80);
        tower2.castShadow = true;
        scene.add(tower2);
        objects.push(tower2);

        var dish2Geometry = new THREE.BoxGeometry(12, 0.8, 10);
        var dish2 = new THREE.Mesh(dish2Geometry, antennaMaterial);
        dish2.position.set(-60, 37, -80);
        dish2.castShadow = true;
        scene.add(dish2);
        objects.push(dish2);

        var tower3Geometry = new THREE.CylinderGeometry(1, 1, 30, 8);
        var tower3 = new THREE.Mesh(tower3Geometry, radarMaterial);
        tower3.position.set(70, 15, 70);
        tower3.castShadow = true;
        scene.add(tower3);
        objects.push(tower3);

        var dish3Geometry = new THREE.BoxGeometry(10, 0.7, 8);
        var dish3 = new THREE.Mesh(dish3Geometry, antennaMaterial);
        dish3.position.set(70, 32, 70);
        dish3.castShadow = true;
        scene.add(dish3);
        objects.push(dish3);

        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var antennaCylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 6);
            var antennaCylinder = new THREE.Mesh(antennaCylinderGeometry, antennaMaterial);
            antennaCylinder.position.set(
                Math.cos(angle) * 5,
                45 + Math.sin(i * 0.5) * 2,
                Math.sin(angle) * 5
            );
            antennaCylinder.rotation.z = angle;
            antennaCylinder.castShadow = true;
            scene.add(antennaCylinder);
            objects.push(antennaCylinder);
        }
    }

    function buildCommCenter() {
        var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x556b4d });
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x3d4d35 });

        var bodyGeometry = new THREE.BoxGeometry(20, 12, 15);
        var body = new THREE.Mesh(bodyGeometry, buildingMaterial);
        body.position.set(-30, 6, 30);
        body.castShadow = true;
        scene.add(body);
        objects.push(body);

        var roofGeometry = new THREE.BoxGeometry(20.5, 1, 15.5);
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(-30, 13, 30);
        roof.castShadow = true;
        scene.add(roof);
        objects.push(roof);

        for (var i = 0; i < 6; i++) {
            var antennaCylinderGeometry = new THREE.CylinderGeometry(0.5, 0.5, 10, 6);
            var antennaCylinder = new THREE.Mesh(antennaCylinderGeometry, new THREE.MeshLambertMaterial({ color: 0x808080 }));
            antennaCylinder.position.set(
                -30 + (i - 2.5) * 3.5,
                22,
                30
            );
            antennaCylinder.castShadow = true;
            scene.add(antennaCylinder);
            objects.push(antennaCylinder);
        }

        for (var i = 0; i < 3; i++) {
            var exhaustGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
            var exhaust = new THREE.Mesh(exhaustGeometry, new THREE.MeshLambertMaterial({ color: 0x404040 }));
            exhaust.position.set(-30 + i * 5, 16, 38);
            exhaust.castShadow = true;
            scene.add(exhaust);
            objects.push(exhaust);
        }
    }

    function buildBarracks() {
        var barracksColor = 0x556b4d;
        var barraksMaterial = new THREE.MeshLambertMaterial({ color: barracksColor });

        for (var i = 0; i < 4; i++) {
            var barracksGeometry = new THREE.BoxGeometry(12, 8, 8);
            var barracks = new THREE.Mesh(barracksGeometry, barraksMaterial);
            barracks.position.set(-50 + i * 15, 4, -50);
            barracks.castShadow = true;
            scene.add(barracks);
            objects.push(barracks);

            for (var j = 0; j < 2; j++) {
                var windowGeometry = new THREE.BoxGeometry(2, 2, 0.3);
                var windowMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
                var window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(
                    -50 + i * 15 - 4 + j * 5,
                    6,
                    -54.2
                );
                scene.add(window);
                objects.push(window);
            }
        }
    }

    function buildHelipads() {
        var helipadColor = 0xffff00;
        var helipadMaterial = new THREE.MeshLambertMaterial({ color: helipadColor });
        var postMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var heliColor = 0x2d5a2d;
        var heliMaterial = new THREE.MeshLambertMaterial({ color: heliColor });

        for (var h = 0; h < 3; h++) {
            var padGeometry = new THREE.BoxGeometry(15, 0.5, 15);
            var pad = new THREE.Mesh(padGeometry, helipadMaterial);
            pad.position.set(30 + h * 35, 0.2, -60);
            pad.receiveShadow = true;
            scene.add(pad);
            objects.push(pad);

            for (var p = 0; p < 4; p++) {
                var postGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 6);
                var post = new THREE.Mesh(postGeometry, postMaterial);
                post.position.set(
                    30 + h * 35 + (p % 2) * 8 - 4,
                    2.5,
                    -60 + Math.floor(p / 2) * 8 - 4
                );
                post.castShadow = true;
                scene.add(post);
                objects.push(post);
            }

            var heliBodyGeometry = new THREE.BoxGeometry(5, 3, 8);
            var heliBody = new THREE.Mesh(heliBodyGeometry, heliMaterial);
            heliBody.position.set(30 + h * 35, 8, -60);
            heliBody.castShadow = true;
            scene.add(heliBody);
            objects.push(heliBody);

            var heliRotorGeometry = new THREE.BoxGeometry(12, 0.5, 1);
            var heliRotor = new THREE.Mesh(heliRotorGeometry, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
            heliRotor.position.set(30 + h * 35, 11, -60);
            heliRotor.castShadow = true;
            scene.add(heliRotor);
            objects.push(heliRotor);

            var tailRotorGeometry = new THREE.BoxGeometry(4, 0.5, 0.8);
            var tailRotor = new THREE.Mesh(tailRotorGeometry, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
            tailRotor.position.set(30 + h * 35 + 1, 9, -60 + 5);
            tailRotor.castShadow = true;
            scene.add(tailRotor);
            objects.push(tailRotor);
        }
    }

    function buildPerimeter() {
        var postMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var fenceColor = 0x808080;

        var postPositions = [
            [-90, -90], [-90, 0], [-90, 90],
            [0, -90], [0, 90],
            [90, -90], [90, 0], [90, 90]
        ];

        var postGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
        for (var i = 0; i < postPositions.length; i++) {
            var post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(postPositions[i][0], 3, postPositions[i][1]);
            post.castShadow = true;
            scene.add(post);
            objects.push(post);
        }

        var fenceLineGeometry = new THREE.BufferGeometry();
        var fenceVertices = new Float32Array([
            -90, 4, -90,
            -90, 4, 90,
            90, 4, 90,
            90, 4, -90,
            -90, 4, -90,
            90, 4, 90,
            -90, 4, 90,
            90, 4, -90
        ]);
        fenceLineGeometry.setAttribute('position', new THREE.BufferAttribute(fenceVertices, 3));
        var fenceLineMaterial = new THREE.LineBasicMaterial({ color: fenceColor, linewidth: 2 });
        var fenceLines = new THREE.LineSegments(fenceLineGeometry, fenceLineMaterial);
        scene.add(fenceLines);
        objects.push(fenceLines);
    }

    function buildVehiclePool() {
        var vehicleColor = 0x556b4d;
        var vehicleMaterial = new THREE.MeshLambertMaterial({ color: vehicleColor });
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

        for (var v = 0; v < 4; v++) {
            var bodyGeometry = new THREE.BoxGeometry(4, 2.5, 8);
            var body = new THREE.Mesh(bodyGeometry, vehicleMaterial);
            body.position.set(-70 + v * 8, 1.5, 20);
            body.castShadow = true;
            scene.add(body);
            objects.push(body);

            var cabGeometry = new THREE.BoxGeometry(3, 2, 3);
            var cab = new THREE.Mesh(cabGeometry, vehicleMaterial);
            cab.position.set(-70 + v * 8 - 1, 3, 18);
            cab.castShadow = true;
            scene.add(cab);
            objects.push(cab);

            for (var w = 0; w < 4; w++) {
                var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 8);
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                var wheelX = w % 2 === 0 ? -1.5 : 1.5;
                var wheelZ = w < 2 ? -2.5 : 2.5;
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(-70 + v * 8 + wheelX, 0.8, 20 + wheelZ);
                wheel.castShadow = true;
                scene.add(wheel);
                objects.push(wheel);
            }
        }
    }

    function buildFuelBowser() {
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0xcc6600 });
        var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });

        var tankGeometry = new THREE.CylinderGeometry(3, 3, 8, 12);
        var tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.rotation.z = Math.PI / 2;
        tank.position.set(50, 2, -40);
        tank.castShadow = true;
        scene.add(tank);
        objects.push(tank);

        var trailerGeometry = new THREE.BoxGeometry(3, 2, 6);
        var trailer = new THREE.Mesh(trailerGeometry, frameMaterial);
        trailer.position.set(50, 1, -40);
        trailer.castShadow = true;
        scene.add(trailer);
        objects.push(trailer);

        for (var i = 0; i < 2; i++) {
            var wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 8);
            var wheel = new THREE.Mesh(wheelGeometry, frameMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(50 + (i * 2 - 1), 0.7, -40);
            wheel.castShadow = true;
            scene.add(wheel);
            objects.push(wheel);
        }

        var exhaustGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 6);
        var exhaust = new THREE.Mesh(exhaustGeometry, new THREE.MeshLambertMaterial({ color: 0x303030 }));
        exhaust.position.set(54, 5, -40);
        exhaust.castShadow = true;
        scene.add(exhaust);
        objects.push(exhaust);
    }

    function buildGeneratorShed() {
        var shedColor = 0x556b4d;
        var shedMaterial = new THREE.MeshLambertMaterial({ color: shedColor });
        var stackMaterial = new THREE.MeshLambertMaterial({ color: 0x303030 });

        var bodyGeometry = new THREE.BoxGeometry(10, 8, 10);
        var body = new THREE.Mesh(bodyGeometry, shedMaterial);
        body.position.set(20, 4, 50);
        body.castShadow = true;
        scene.add(body);
        objects.push(body);

        for (var i = 0; i < 3; i++) {
            var stackGeometry = new THREE.CylinderGeometry(0.6, 0.6, 12, 6);
            var stack = new THREE.Mesh(stackGeometry, stackMaterial);
            stack.position.set(20 - 3 + i * 3, 12, 50);
            stack.castShadow = true;
            scene.add(stack);
            objects.push(stack);
        }

        var doorGeometry = new THREE.BoxGeometry(3, 5, 0.2);
        var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(16, 3.5, 50.1);
        scene.add(door);
        objects.push(door);
    }

    function buildCommandTent() {
        var tentColor = 0x8b7355;
        var tentMaterial = new THREE.MeshLambertMaterial({ color: tentColor });
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x556b4d });

        var roofGeometry = new THREE.ConeGeometry(8, 6, 8);
        var roof = new THREE.Mesh(roofGeometry, tentMaterial);
        roof.position.set(-20, 5, -20);
        roof.castShadow = true;
        scene.add(roof);
        objects.push(roof);

        var baseGeometry = new THREE.BoxGeometry(12, 4, 12);
        var base = new THREE.Mesh(baseGeometry, new THREE.MeshLambertMaterial({ color: 0x6d5d4d }));
        base.position.set(-20, 2, -20);
        base.castShadow = true;
        scene.add(base);
        objects.push(base);

        for (var i = 0; i < 4; i++) {
            var supportGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 6);
            var support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(
                -20 + (i % 2) * 8 - 4,
                2.5,
                -20 + Math.floor(i / 2) * 8 - 4
            );
            support.castShadow = true;
            scene.add(support);
            objects.push(support);
        }
    }

    function buildGuardTowers() {
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var legMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });

        var towerPositions = [
            [-80, 80],
            [80, 80],
            [80, -80],
            [-80, -80]
        ];

        for (var t = 0; t < towerPositions.length; t++) {
            var legGeometry = new THREE.CylinderGeometry(0.8, 1, 12, 8);
            var leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(towerPositions[t][0], 6, towerPositions[t][1]);
            leg.castShadow = true;
            scene.add(leg);
            objects.push(leg);

            var platformGeometry = new THREE.BoxGeometry(6, 0.8, 6);
            var platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(towerPositions[t][0], 13, towerPositions[t][1]);
            platform.castShadow = true;
            scene.add(platform);
            objects.push(platform);

            var railGeometry = new THREE.BoxGeometry(6, 1, 0.3);
            var rail = new THREE.Mesh(railGeometry, legMaterial);
            rail.position.set(towerPositions[t][0], 13.8, towerPositions[t][1] - 3);
            rail.castShadow = true;
            scene.add(rail);
            objects.push(rail);

            var railGeometry2 = new THREE.BoxGeometry(0.3, 1, 6);
            var rail2 = new THREE.Mesh(railGeometry2, legMaterial);
            rail2.position.set(towerPositions[t][0] + 3, 13.8, towerPositions[t][1]);
            rail2.castShadow = true;
            scene.add(rail2);
            objects.push(rail2);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 60, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 150;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var spotLight1 = new THREE.SpotLight(0xffff99, 0.5, 80, Math.PI / 6, 0.8, 2);
        spotLight1.position.set(-30, 20, 30);
        spotLight1.castShadow = true;
        scene.add(spotLight1);
        lights.push(spotLight1);

        var spotLight2 = new THREE.SpotLight(0xffff99, 0.5, 80, Math.PI / 6, 0.8, 2);
        spotLight2.position.set(50, 20, -40);
        spotLight2.castShadow = true;
        scene.add(spotLight2);
        lights.push(spotLight2);

        var fogColor = 0xd4d0c8;
        scene.fog = new THREE.Fog(fogColor, 150, 50);
        scene.background = new THREE.Color(fogColor);
    }

    function update(delta) {
        if (radarDish) {
            radarDishRotation += delta * 0.3;
            radarDish.rotation.y = radarDishRotation;
        }

        for (var i = 0; i < fogSpheres.length; i++) {
            if (fogSpheres[i].position) {
                fogSpheres[i].position.y += Math.sin(Date.now() * 0.0001 + i) * 0.02;
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
        fogSpheres = [];
        radarDish = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
