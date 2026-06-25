window.CoalRidge = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var conveyorRotation = 0;
    var winchRotation = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        conveyorRotation = 0;
        winchRotation = 0;
        buildRidgeTerrain();
        buildCoalSeams();
        buildMineEntrance();
        buildConveyors();
        buildProcessing();
        buildHousingBlock();
        buildDefenses();
        buildRailNetwork();
        buildWinchHouse();
        buildSlagHeap();
        buildSupportPillars();
        buildCraters();
        setupLighting();
    }

    function buildRidgeTerrain() {
        var colors = [0x3d2817, 0x4a3520, 0x5c4033, 0x6d4c41];
        var colorIdx = 0;

        for (var x = -60; x < 60; x += 20) {
            for (var z = -100; z < 100; z += 20) {
                var height = 5 + (Math.abs(x) / 30) * 8 + (Math.abs(z) / 50) * 3;
                var color = colors[colorIdx % colors.length];
                colorIdx++;

                var geo = new THREE.BoxGeometry(18, height, 18);
                var mat = new THREE.MeshLambertMaterial({color: color});
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(x, height / 2, z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                objects.push(mesh);
            }
        }

        for (var i = 0; i < 40; i++) {
            var rockGeo = new THREE.BoxGeometry(
                4 + Math.random() * 6,
                3 + Math.random() * 4,
                4 + Math.random() * 6
            );
            var rockMat = new THREE.MeshLambertMaterial({color: 0x8b7355});
            var rockMesh = new THREE.Mesh(rockGeo, rockMat);
            rockMesh.position.set(
                -80 + Math.random() * 160,
                20 + Math.random() * 15,
                -120 + Math.random() * 240
            );
            rockMesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            scene.add(rockMesh);
            objects.push(rockMesh);
        }
    }

    function buildCoalSeams() {
        var coalColors = [0x1a1a1a, 0x0d0d0d, 0x2d2d2d];

        for (var z = -80; z < 80; z += 25) {
            for (var y = 8; y < 28; y += 8) {
                var colorChoice = coalColors[Math.floor(Math.random() * coalColors.length)];
                var geo = new THREE.BoxGeometry(35, 6, 12);
                var mat = new THREE.MeshLambertMaterial({color: colorChoice});
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(45, y, z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                objects.push(mesh);
            }
        }

        for (var i = 0; i < 30; i++) {
            var coalChunkGeo = new THREE.BoxGeometry(
                2 + Math.random() * 4,
                2 + Math.random() * 4,
                2 + Math.random() * 4
            );
            var coalChunkMat = new THREE.MeshLambertMaterial({color: 0x000000});
            var coalChunkMesh = new THREE.Mesh(coalChunkGeo, coalChunkMat);
            coalChunkMesh.position.set(
                40 + Math.random() * 25,
                10 + Math.random() * 20,
                -60 + Math.random() * 120
            );
            coalChunkMesh.castShadow = true;
            coalChunkMesh.receiveShadow = true;
            scene.add(coalChunkMesh);
            objects.push(coalChunkMesh);
        }
    }

    function buildMineEntrance() {
        var archLeftGeo = new THREE.BoxGeometry(2, 20, 12);
        var archMat = new THREE.MeshLambertMaterial({color: 0x8b4513});
        var archLeft = new THREE.Mesh(archLeftGeo, archMat);
        archLeft.position.set(-40, 12, 0);
        archLeft.castShadow = true;
        scene.add(archLeft);
        objects.push(archLeft);

        var archRight = new THREE.Mesh(archLeftGeo, archMat);
        archRight.position.set(-30, 12, 0);
        archRight.castShadow = true;
        scene.add(archRight);
        objects.push(archRight);

        var archTopGeo = new THREE.BoxGeometry(12, 2, 12);
        var archTop = new THREE.Mesh(archTopGeo, archMat);
        archTop.position.set(-35, 23, 0);
        archTop.castShadow = true;
        scene.add(archTop);
        objects.push(archTop);

        var tunnelGeo = new THREE.BoxGeometry(10, 18, 40);
        var tunnelMat = new THREE.MeshLambertMaterial({color: 0x000000});
        var tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
        tunnel.position.set(-35, 11, 20);
        tunnel.castShadow = true;
        scene.add(tunnel);
        objects.push(tunnel);

        for (var i = 0; i < 5; i++) {
            var supportGeo = new THREE.BoxGeometry(8, 1.5, 8);
            var supportMat = new THREE.MeshLambertMaterial({color: 0x654321});
            var support = new THREE.Mesh(supportGeo, supportMat);
            support.position.set(-35, 5 + i * 3, 5 + i * 7);
            support.castShadow = true;
            scene.add(support);
            objects.push(support);
        }
    }

    function buildConveyors() {
        var beltGeo = new THREE.BoxGeometry(8, 1, 50);
        var beltMat = new THREE.MeshLambertMaterial({color: 0x333333});
        var belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.set(0, 15, 30);
        belt.rotation.z = 0.2;
        belt.castShadow = true;
        scene.add(belt);
        objects.push(belt);

        for (var i = 0; i < 4; i++) {
            var drumGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
            var drumMat = new THREE.MeshLambertMaterial({color: 0x444444});
            var drum = new THREE.Mesh(drumGeo, drumMat);
            drum.position.set(i * 12 - 18, 15, 10 + i * 8);
            drum.rotation.z = 0.2;
            drum.castShadow = true;
            drum.receiveShadow = true;
            scene.add(drum);
            objects.push(drum);
        }

        for (var i = 0; i < 3; i++) {
            var supportGeo = new THREE.BoxGeometry(12, 1, 1);
            var supportMat = new THREE.MeshLambertMaterial({color: 0x555555});
            var support = new THREE.Mesh(supportGeo, supportMat);
            support.position.set(0, 10 + i * 2, 10);
            support.castShadow = true;
            scene.add(support);
            objects.push(support);
        }
    }

    function buildProcessing() {
        var mainBuildingGeo = new THREE.BoxGeometry(25, 18, 20);
        var concreteMat = new THREE.MeshLambertMaterial({color: 0xa9a9a9});
        var mainBuilding = new THREE.Mesh(mainBuildingGeo, concreteMat);
        mainBuilding.position.set(25, 10, 50);
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        scene.add(mainBuilding);
        objects.push(mainBuilding);

        for (var i = 0; i < 4; i++) {
            var siloGeo = new THREE.CylinderGeometry(4, 4, 20, 12);
            var siloMat = new THREE.MeshLambertMaterial({color: 0xc0c0c0});
            var silo = new THREE.Mesh(siloGeo, siloMat);
            silo.position.set(20 + i * 8, 12, 60);
            silo.castShadow = true;
            silo.receiveShadow = true;
            scene.add(silo);
            objects.push(silo);
        }

        for (var i = 0; i < 5; i++) {
            var hopperGeo = new THREE.ConeGeometry(3, 6, 8);
            var hopperMat = new THREE.MeshLambertMaterial({color: 0x888888});
            var hopper = new THREE.Mesh(hopperGeo, hopperMat);
            hopper.position.set(18 + i * 7, 16, 65);
            hopper.castShadow = true;
            scene.add(hopper);
            objects.push(hopper);
        }

        for (var i = 0; i < 6; i++) {
            var frameGeo = new THREE.BoxGeometry(2, 15, 2);
            var frameMat = new THREE.MeshLambertMaterial({color: 0x555555});
            var frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(10 + i * 5, 9, 55);
            frame.castShadow = true;
            scene.add(frame);
            objects.push(frame);
        }
    }

    function buildHousingBlock() {
        for (var i = 0; i < 6; i++) {
            var houseGeo = new THREE.BoxGeometry(8, 7, 10);
            var houseMat = new THREE.MeshLambertMaterial({color: 0xb8860b});
            var house = new THREE.Mesh(houseGeo, houseMat);
            house.position.set(-50 + i * 12, 5, -30);
            house.castShadow = true;
            house.receiveShadow = true;
            scene.add(house);
            objects.push(house);

            var roofGeo = new THREE.BoxGeometry(8, 2, 10);
            var roofMat = new THREE.MeshLambertMaterial({color: 0x8b4513});
            var roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.set(-50 + i * 12, 9, -30);
            roof.castShadow = true;
            scene.add(roof);
            objects.push(roof);
        }

        for (var i = 0; i < 12; i++) {
            var windowGeo = new THREE.BoxGeometry(1.5, 1.5, 0.2);
            var windowMat = new THREE.MeshLambertMaterial({color: 0x87ceeb});
            var window = new THREE.Mesh(windowGeo, windowMat);
            window.position.set(-50 + (i % 6) * 12 - 2, 5 + Math.floor(i / 6) * 2.5, -36);
            scene.add(window);
            objects.push(window);
        }
    }

    function buildDefenses() {
        var gateLeftGeo = new THREE.BoxGeometry(2, 8, 1);
        var gateMat = new THREE.MeshLambertMaterial({color: 0x333333});
        var gateLeft = new THREE.Mesh(gateLeftGeo, gateMat);
        gateLeft.position.set(-25, 5, -60);
        gateLeft.castShadow = true;
        scene.add(gateLeft);
        objects.push(gateLeft);

        var gateRight = new THREE.Mesh(gateLeftGeo, gateMat);
        gateRight.position.set(-15, 5, -60);
        gateRight.castShadow = true;
        scene.add(gateRight);
        objects.push(gateRight);

        var gateTopGeo = new THREE.BoxGeometry(12, 1.5, 1);
        var gateTop = new THREE.Mesh(gateTopGeo, gateMat);
        gateTop.position.set(-20, 9, -60);
        gateTop.castShadow = true;
        scene.add(gateTop);
        objects.push(gateTop);

        for (var i = 0; i < 8; i++) {
            var barrierGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 12);
            var barrierMat = new THREE.MeshLambertMaterial({color: 0xff6347});
            var barrier = new THREE.Mesh(barrierGeo, barrierMat);
            barrier.position.set(-50 + i * 10, 1, -55);
            barrier.castShadow = true;
            scene.add(barrier);
            objects.push(barrier);
        }

        for (var i = 0; i < 6; i++) {
            var watchtowerGeo = new THREE.BoxGeometry(4, 12, 4);
            var watchtowerMat = new THREE.MeshLambertMaterial({color: 0x666666});
            var watchtower = new THREE.Mesh(watchtowerGeo, watchtowerMat);
            watchtower.position.set(-60 + i * 20, 8, -50);
            watchtower.castShadow = true;
            scene.add(watchtower);
            objects.push(watchtower);
        }
    }

    function buildRailNetwork() {
        for (var i = 0; i < 8; i++) {
            var railLeftGeo = new THREE.BoxGeometry(1, 0.5, 50);
            var railMat = new THREE.MeshLambertMaterial({color: 0x654321});
            var railLeft = new THREE.Mesh(railLeftGeo, railMat);
            railLeft.position.set(-10 + i * 2.5, 4, 20);
            railLeft.castShadow = true;
            scene.add(railLeft);
            objects.push(railLeft);
        }

        for (var i = 0; i < 12; i++) {
            var tieGeo = new THREE.BoxGeometry(10, 0.3, 1.2);
            var tieMat = new THREE.MeshLambertMaterial({color: 0x8b4513});
            var tie = new THREE.Mesh(tieGeo, tieMat);
            tie.position.set(-5, 4, 10 + i * 4);
            tie.castShadow = true;
            scene.add(tie);
            objects.push(tie);
        }

        var cartBodyGeo = new THREE.BoxGeometry(4, 2.5, 6);
        var cartMat = new THREE.MeshLambertMaterial({color: 0xb8860b});
        var cartBody = new THREE.Mesh(cartBodyGeo, cartMat);
        cartBody.position.set(0, 5.5, 15);
        cartBody.castShadow = true;
        scene.add(cartBody);
        objects.push(cartBody);

        for (var i = 0; i < 4; i++) {
            var wheelGeo = new THREE.CylinderGeometry(1, 1, 0.8, 16);
            var wheelMat = new THREE.MeshLambertMaterial({color: 0x2f4f4f});
            var wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(-1.5 + i * 1.2, 4.5, 12 + (i % 2) * 3);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            scene.add(wheel);
            objects.push(wheel);
        }
    }

    function buildWinchHouse() {
        var winchBuildGeo = new THREE.BoxGeometry(12, 8, 10);
        var winchMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var winchBuild = new THREE.Mesh(winchBuildGeo, winchMat);
        winchBuild.position.set(-50, 5, 40);
        winchBuild.castShadow = true;
        winchBuild.receiveShadow = true;
        scene.add(winchBuild);
        objects.push(winchBuild);

        var drumGeo = new THREE.CylinderGeometry(2.5, 2.5, 10, 16);
        var drumMat = new THREE.MeshLambertMaterial({color: 0x555555});
        var drum = new THREE.Mesh(drumGeo, drumMat);
        drum.position.set(-50, 6, 40);
        drum.rotation.z = Math.PI / 2;
        drum.castShadow = true;
        drum.receiveShadow = true;
        drum.name = 'winchDrum';
        scene.add(drum);
        objects.push(drum);

        for (var i = 0; i < 20; i++) {
            var p1X = -50 + Math.cos(i * 0.31) * 2;
            var p1Y = 6 + Math.sin(i * 0.31) * 2.5;
            var p2X = -30 + Math.random() * 10;
            var p2Y = 25 + Math.random() * 10;

            var points = [
                new THREE.Vector3(p1X, p1Y, 40),
                new THREE.Vector3(p2X, p2Y, 40)
            ];
            var lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            var lineMat = new THREE.LineBasicMaterial({color: 0xaaaaaa, linewidth: 2});
            var cable = new THREE.LineSegments(lineGeo, lineMat);
            scene.add(cable);
            objects.push(cable);
        }
    }

    function buildSlagHeap() {
        for (var i = 0; i < 5; i++) {
            var heapGeo = new THREE.ConeGeometry(15 - i * 2, 8 - i * 1.2, 8);
            var heapMat = new THREE.MeshLambertMaterial({color: 0x808080 + i * 0x0a0a0a});
            var heap = new THREE.Mesh(heapGeo, heapMat);
            heap.position.set(60, 2 + i * 2, -60);
            heap.castShadow = true;
            heap.receiveShadow = true;
            scene.add(heap);
            objects.push(heap);
        }

        for (var i = 0; i < 25; i++) {
            var rockGeo = new THREE.BoxGeometry(
                2 + Math.random() * 3,
                2 + Math.random() * 3,
                2 + Math.random() * 3
            );
            var rockMat = new THREE.MeshLambertMaterial({color: 0x909090});
            var rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(
                50 + Math.random() * 20,
                5 + Math.random() * 8,
                -70 + Math.random() * 20
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildSupportPillars() {
        for (var i = 0; i < 12; i++) {
            var pillarGeo = new THREE.CylinderGeometry(2, 2, 15, 12);
            var pillarMat = new THREE.MeshLambertMaterial({color: 0x696969});
            var pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(
                -60 + Math.random() * 120,
                8,
                -80 + Math.random() * 160
            );
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            scene.add(pillar);
            objects.push(pillar);
        }
    }

    function buildCraters() {
        for (var i = 0; i < 4; i++) {
            var craterDepthGeo = new THREE.BoxGeometry(20, 4, 20);
            var craterMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
            var craterDepth = new THREE.Mesh(craterDepthGeo, craterMat);
            craterDepth.position.set(
                -70 + i * 40,
                2,
                50 + Math.random() * 30
            );
            craterDepth.castShadow = true;
            scene.add(craterDepth);
            objects.push(craterDepth);

            var rimGeo = new THREE.BoxGeometry(24, 0.5, 24);
            var rimMat = new THREE.MeshLambertMaterial({color: 0x3d2817});
            var rim = new THREE.Mesh(rimGeo, rimMat);
            rim.position.set(
                -70 + i * 40,
                5,
                50 + Math.random() * 30
            );
            rim.castShadow = true;
            scene.add(rim);
            objects.push(rim);
        }
    }

    function setupLighting() {
        var ambLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 60, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -150;
        dirLight.shadow.camera.right = 150;
        dirLight.shadow.camera.top = 150;
        dirLight.shadow.camera.bottom = -150;
        scene.add(dirLight);
        lights.push(dirLight);

        var pointLight1 = new THREE.PointLight(0xff8c00, 0.6, 80);
        pointLight1.position.set(20, 20, 50);
        pointLight1.castShadow = true;
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xffa500, 0.5, 60);
        pointLight2.position.set(-40, 15, 30);
        pointLight2.castShadow = true;
        scene.add(pointLight2);
        lights.push(pointLight2);
    }

    function update(delta) {
        conveyorRotation += delta * 2;
        winchRotation += delta * 0.8;

        for (var i = 0; i < objects.length; i++) {
            if (objects[i].name === 'winchDrum') {
                objects[i].rotation.z = winchRotation;
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
