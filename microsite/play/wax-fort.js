window.WaxFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var dripSpheres = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        dripSpheres = [];
        buildFortBase();
        buildWalls();
        buildCandleTowers();
        buildInnerCourtyard();
        buildArmory();
        buildTunnels();
        buildSiegeDefenses();
        buildMoat();
        setupLighting();
    }

    function buildFortBase() {
        var platformGeometry = new THREE.BoxGeometry(120, 8, 120);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.y = -4;
        scene.add(platform);
        objects.push(platform);

        var baseGeometry = new THREE.BoxGeometry(100, 20, 100);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a38 });
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 10;
        scene.add(base);
        objects.push(base);

        var cornerBox1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 25, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a2a18 })
        );
        cornerBox1.position.set(46, 12, 46);
        scene.add(cornerBox1);
        objects.push(cornerBox1);

        var cornerBox2 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 25, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a2a18 })
        );
        cornerBox2.position.set(-46, 12, 46);
        scene.add(cornerBox2);
        objects.push(cornerBox2);

        var cornerBox3 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 25, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a2a18 })
        );
        cornerBox3.position.set(46, 12, -46);
        scene.add(cornerBox3);
        objects.push(cornerBox3);

        var cornerBox4 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 25, 8),
            new THREE.MeshLambertMaterial({ color: 0x3a2a18 })
        );
        cornerBox4.position.set(-46, 12, -46);
        scene.add(cornerBox4);
        objects.push(cornerBox4);
    }

    function buildWalls() {
        var wallThickness = 4;
        var wallHeight = 50;

        var northWallGeometry = new THREE.BoxGeometry(100, wallHeight, wallThickness);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x6b5d52 });
        var northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
        northWall.position.set(0, 25, 50);
        scene.add(northWall);
        objects.push(northWall);

        var southWallGeometry = new THREE.BoxGeometry(100, wallHeight, wallThickness);
        var southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
        southWall.position.set(0, 25, -50);
        scene.add(southWall);
        objects.push(southWall);

        var eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 100);
        var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(50, 25, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        var westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, 100);
        var westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
        westWall.position.set(-50, 25, 0);
        scene.add(westWall);
        objects.push(westWall);

        addWaxDrips(northWall, 0, 50, 'north');
        addWaxDrips(southWall, 0, -50, 'south');
        addWaxDrips(eastWall, 50, 0, 'east');
        addWaxDrips(westWall, -50, 0, 'west');
    }

    function addWaxDrips(wallMesh, xPos, zPos, direction) {
        var dripCount = 12;
        var waxColor = 0xf5deb3;

        for (var i = 0; i < dripCount; i++) {
            var sphere = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 8, 8),
                new THREE.MeshLambertMaterial({ color: waxColor })
            );

            if (direction === 'north' || direction === 'south') {
                sphere.position.set(
                    xPos + (Math.random() - 0.5) * 80,
                    40 - i * 2,
                    zPos
                );
            } else {
                sphere.position.set(
                    xPos,
                    40 - i * 2,
                    zPos + (Math.random() - 0.5) * 80
                );
            }

            scene.add(sphere);
            objects.push(sphere);
            dripSpheres.push({
                mesh: sphere,
                baseY: sphere.position.y,
                direction: direction
            });
        }
    }

    function buildCandleTowers() {
        var positions = [
            [35, 0, 35],
            [-35, 0, 35],
            [35, 0, -35],
            [-35, 0, -35]
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];

            var cylinderGeometry = new THREE.CylinderGeometry(3, 3, 60, 16);
            var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
            var tower = new THREE.Mesh(cylinderGeometry, stoneMaterial);
            tower.position.set(pos[0], 30, pos[2]);
            scene.add(tower);
            objects.push(tower);

            var topCapGeometry = new THREE.CylinderGeometry(4, 3, 3, 16);
            var capMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
            var topCap = new THREE.Mesh(topCapGeometry, capMaterial);
            topCap.position.set(pos[0], 61, pos[2]);
            scene.add(topCap);
            objects.push(topCap);

            addCandleWax(pos[0], pos[2]);
        }
    }

    function addCandleWax(xPos, zPos) {
        var waxColor = 0xf5deb3;
        var clusterSize = 8;

        for (var i = 0; i < clusterSize; i++) {
            var waxSphere = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 8, 8),
                new THREE.MeshLambertMaterial({ color: waxColor })
            );

            waxSphere.position.set(
                xPos + (Math.random() - 0.5) * 6,
                62 + Math.random() * 8,
                zPos + (Math.random() - 0.5) * 6
            );

            scene.add(waxSphere);
            objects.push(waxSphere);
            dripSpheres.push({
                mesh: waxSphere,
                baseY: waxSphere.position.y,
                direction: 'candle'
            });
        }
    }

    function buildInnerCourtyard() {
        var floorGeometry = new THREE.BoxGeometry(80, 1, 80);
        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = 10.5;
        scene.add(floor);
        objects.push(floor);

        var waxPoolColor = 0xe8d4a8;
        var poolCount = 20;

        for (var i = 0; i < poolCount; i++) {
            var poolSphere = new THREE.Mesh(
                new THREE.SphereGeometry(2, 10, 10),
                new THREE.MeshLambertMaterial({ color: waxPoolColor })
            );

            poolSphere.position.set(
                (Math.random() - 0.5) * 70,
                11,
                (Math.random() - 0.5) * 70
            );

            scene.add(poolSphere);
            objects.push(poolSphere);
            dripSpheres.push({
                mesh: poolSphere,
                baseY: poolSphere.position.y,
                direction: 'pool'
            });
        }
    }

    function buildArmory() {
        var armoryGeometry = new THREE.BoxGeometry(30, 25, 25);
        var armoryMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var armory = new THREE.Mesh(armoryGeometry, armoryMaterial);
        armory.position.set(0, 12, 0);
        scene.add(armory);
        objects.push(armory);

        var roofGeometry = new THREE.ConeGeometry(20, 8, 8);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, 33, 0);
        scene.add(roof);
        objects.push(roof);

        var doorGeometry = new THREE.BoxGeometry(4, 8, 2);
        var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        var door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, 15, 12.5);
        scene.add(door);
        objects.push(door);

        var doorHandle = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xdaa520 })
        );
        doorHandle.position.set(1.5, 15, 13);
        scene.add(doorHandle);
        objects.push(doorHandle);
    }

    function buildTunnels() {
        var tunnel1Geometry = new THREE.BoxGeometry(60, 12, 6);
        var tunnelMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        var tunnel1 = new THREE.Mesh(tunnel1Geometry, tunnelMaterial);
        tunnel1.position.set(0, -6, 0);
        scene.add(tunnel1);
        objects.push(tunnel1);

        var tunnel2Geometry = new THREE.BoxGeometry(6, 12, 60);
        var tunnel2 = new THREE.Mesh(tunnel2Geometry, tunnelMaterial);
        tunnel2.position.set(0, -6, 0);
        scene.add(tunnel2);
        objects.push(tunnel2);

        var braceCount = 10;
        for (var i = 0; i < braceCount; i++) {
            var braceGeometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
            var braceMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
            var brace = new THREE.Mesh(braceGeometry, braceMaterial);
            brace.position.set(-20 + i * 5, -6, 0);
            scene.add(brace);
            objects.push(brace);
        }

        for (var j = 0; j < braceCount; j++) {
            var brace2Geometry = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
            var brace2 = new THREE.Mesh(brace2Geometry, braceMaterial);
            brace2.position.set(0, -6, -20 + j * 5);
            scene.add(brace2);
            objects.push(brace2);
        }
    }

    function buildSiegeDefenses() {
        buildBatteringRam();
        buildSiegeLadders();
        addBurnedWaxSections();
        addWaxWaterfall();
    }

    function buildBatteringRam() {
        var logGeometry = new THREE.CylinderGeometry(2, 2, 35, 12);
        var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var log = new THREE.Mesh(logGeometry, woodMaterial);
        log.rotation.z = Math.PI / 2.2;
        log.position.set(-65, 15, -55);
        scene.add(log);
        objects.push(log);

        var frameGeometry = new THREE.BoxGeometry(40, 12, 12);
        var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(-65, 20, -55);
        scene.add(frame);
        objects.push(frame);

        var wheel1Geometry = new THREE.CylinderGeometry(4, 4, 2, 16);
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var wheel1 = new THREE.Mesh(wheel1Geometry, wheelMaterial);
        wheel1.rotation.z = Math.PI / 2;
        wheel1.position.set(-75, 8, -52);
        scene.add(wheel1);
        objects.push(wheel1);

        var wheel2 = new THREE.Mesh(wheel1Geometry, wheelMaterial);
        wheel2.rotation.z = Math.PI / 2;
        wheel2.position.set(-75, 8, -58);
        scene.add(wheel2);
        objects.push(wheel2);

        var wheel3 = new THREE.Mesh(wheel1Geometry, wheelMaterial);
        wheel3.rotation.z = Math.PI / 2;
        wheel3.position.set(-55, 8, -52);
        scene.add(wheel3);
        objects.push(wheel3);

        var wheel4 = new THREE.Mesh(wheel1Geometry, wheelMaterial);
        wheel4.rotation.z = Math.PI / 2;
        wheel4.position.set(-55, 8, -58);
        scene.add(wheel4);
        objects.push(wheel4);
    }

    function buildSiegeLadders() {
        var ladderCount = 3;
        var baseXPositions = [-60, -40, 60];

        for (var i = 0; i < ladderCount; i++) {
            var xBase = baseXPositions[i];

            var sideRail1Geometry = new THREE.BoxGeometry(2, 30, 2);
            var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
            var sideRail1 = new THREE.Mesh(sideRail1Geometry, woodMaterial);
            sideRail1.position.set(xBase - 4, 15, 48);
            sideRail1.rotation.z = Math.PI / 6;
            scene.add(sideRail1);
            objects.push(sideRail1);

            var sideRail2 = new THREE.Mesh(sideRail1Geometry, woodMaterial);
            sideRail2.position.set(xBase + 4, 15, 48);
            sideRail2.rotation.z = -Math.PI / 6;
            scene.add(sideRail2);
            objects.push(sideRail2);

            var rungCount = 8;
            for (var j = 0; j < rungCount; j++) {
                var points = [
                    new THREE.Vector3(xBase - 3, 5 + j * 3, 48),
                    new THREE.Vector3(xBase + 3, 5 + j * 3, 48)
                ];
                var geometry = new THREE.BufferGeometry().setFromPoints(points);
                var material = new THREE.LineBasicMaterial({ color: 0x654321, linewidth: 2 });
                var line = new THREE.LineSegments(geometry, material);
                scene.add(line);
                objects.push(line);
            }
        }
    }

    function addBurnedWaxSections() {
        var burnColor = 0xff8c00;
        var burnPositions = [
            [45, 30, 48],
            [-45, 35, 48],
            [48, 28, 0],
            [-48, 32, -25]
        ];

        for (var i = 0; i < burnPositions.length; i++) {
            var pos = burnPositions[i];
            var burnClusterSize = 6;

            for (var j = 0; j < burnClusterSize; j++) {
                var burnSphere = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5, 8, 8),
                    new THREE.MeshLambertMaterial({ color: burnColor })
                );

                burnSphere.position.set(
                    pos[0] + (Math.random() - 0.5) * 4,
                    pos[1] + (Math.random() - 0.5) * 3,
                    pos[2] + (Math.random() - 0.5) * 4
                );

                scene.add(burnSphere);
                objects.push(burnSphere);
                dripSpheres.push({
                    mesh: burnSphere,
                    baseY: burnSphere.position.y,
                    direction: 'burn'
                });
            }
        }
    }

    function addWaxWaterfall() {
        var waterfallX = -48;
        var waterfallZ = 20;
        var waterfallLength = 15;
        var waxColor = 0xf5deb3;

        for (var i = 0; i < waterfallLength; i++) {
            var sphere = new THREE.Mesh(
                new THREE.SphereGeometry(1, 8, 8),
                new THREE.MeshLambertMaterial({ color: waxColor })
            );

            sphere.position.set(
                waterfallX,
                50 - i * 2.5,
                waterfallZ + (Math.random() - 0.5) * 1.5
            );

            scene.add(sphere);
            objects.push(sphere);
            dripSpheres.push({
                mesh: sphere,
                baseY: sphere.position.y,
                direction: 'waterfall'
            });
        }
    }

    function buildMoat() {
        var moatInnerGeometry = new THREE.BoxGeometry(110, 8, 110);
        var moatMaterial = new THREE.MeshLambertMaterial({ color: 0x2a3a4a });
        var moatInner = new THREE.Mesh(moatInnerGeometry, moatMaterial);
        moatInner.position.set(0, -3, 0);
        scene.add(moatInner);
        objects.push(moatInner);

        var moatOuterGeometry = new THREE.BoxGeometry(130, 3, 130);
        var moatOuter = new THREE.Mesh(moatOuterGeometry, new THREE.MeshLambertMaterial({ color: 0x1a2a3a }));
        moatOuter.position.set(0, -6, 0);
        scene.add(moatOuter);
        objects.push(moatOuter);

        var bridgeGeometry = new THREE.BoxGeometry(8, 2, 20);
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(0, -1, 60);
        scene.add(bridge);
        objects.push(bridge);

        var palisadeCount = 12;
        for (var i = 0; i < palisadeCount; i++) {
            var angle = (i / palisadeCount) * Math.PI * 2;
            var radius = 65;
            var palisadeGeometry = new THREE.BoxGeometry(3, 15, 3);
            var palisadeMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var palisade = new THREE.Mesh(palisadeGeometry, palisadeMaterial);

            palisade.position.set(
                Math.cos(angle) * radius,
                5,
                Math.sin(angle) * radius
            );

            scene.add(palisade);
            objects.push(palisade);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(50, 80, 50);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xffaa55, 0.5, 100);
        pointLight1.position.set(-40, 35, 40);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xffaa55, 0.5, 100);
        pointLight2.position.set(40, 35, -40);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0xff9944, 0.6, 80);
        pointLight3.position.set(-60, 15, -55);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function update(delta) {
        for (var i = 0; i < dripSpheres.length; i++) {
            var dripData = dripSpheres[i];
            var mesh = dripData.mesh;

            mesh.position.y = dripData.baseY - Math.sin((Date.now() * 0.001) + i * 0.5) * 2;
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
        dripSpheres = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
