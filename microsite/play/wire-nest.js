window.WireNest = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var radarArm = null;
    var signalLights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        signalLights = [];
        buildTowerFarm();
        buildTransmitters();
        buildBarricades();
        buildBunkers();
        buildSubstation();
        buildAntennae();
        buildCablefield();
        buildRadarDish();
        buildGeneratorBuilding();
        setupLighting();
    }

    function buildTowerFarm() {
        var towerPositions = [
            new THREE.Vector3(-80, 0, -100),
            new THREE.Vector3(-40, 0, -120),
            new THREE.Vector3(0, 0, -140),
            new THREE.Vector3(40, 0, -120),
            new THREE.Vector3(80, 0, -100),
            new THREE.Vector3(-60, 0, 60),
            new THREE.Vector3(60, 0, 60),
            new THREE.Vector3(0, 0, 140)
        ];

        for (var i = 0; i < towerPositions.length; i++) {
            var pos = towerPositions[i];
            buildTowerAt(pos.x, pos.y, pos.z);
        }
    }

    function buildTowerAt(x, y, z) {
        var poleMaterial = new THREE.MeshLambertMaterial({color: 0x444444});
        var poleGeom = new THREE.CylinderGeometry(1.5, 1.5, 120, 16);
        var pole = new THREE.Mesh(poleGeom, poleMaterial);
        pole.position.set(x, 60, z);
        scene.add(pole);
        objects.push(pole);

        var crossarmMat = new THREE.MeshLambertMaterial({color: 0x333333});
        var crossarmGeom = new THREE.BoxGeometry(50, 3, 3);
        var crossarm1 = new THREE.Mesh(crossarmGeom, crossarmMat);
        crossarm1.position.set(x, 85, z);
        scene.add(crossarm1);
        objects.push(crossarm1);

        var crossarm2 = new THREE.Mesh(crossarmGeom, crossarmMat);
        crossarm2.position.set(x, 55, z);
        scene.add(crossarm2);
        objects.push(crossarm2);

        var crossarm3 = new THREE.Mesh(crossarmGeom, crossarmMat);
        crossarm3.position.set(x, 25, z);
        scene.add(crossarm3);
        objects.push(crossarm3);

        var armMount1Geom = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
        var armMount1 = new THREE.Mesh(armMount1Geom, poleMaterial);
        armMount1.position.set(x + 25, 85, z);
        scene.add(armMount1);
        objects.push(armMount1);

        var armMount2 = new THREE.Mesh(armMount1Geom, poleMaterial);
        armMount2.position.set(x - 25, 85, z);
        scene.add(armMount2);
        objects.push(armMount2);

        var eqPod1Geom = new THREE.CylinderGeometry(2, 2, 6, 16);
        var eqPod1 = new THREE.Mesh(eqPod1Geom, crossarmMat);
        eqPod1.position.set(x + 20, 88, z + 8);
        scene.add(eqPod1);
        objects.push(eqPod1);

        var eqBox1Geom = new THREE.BoxGeometry(4, 4, 3);
        var eqBox1 = new THREE.Mesh(eqBox1Geom, crossarmMat);
        eqBox1.position.set(x + 20, 88, z - 8);
        scene.add(eqBox1);
        objects.push(eqBox1);

        var eqPod2 = new THREE.Mesh(eqPod1Geom, crossarmMat);
        eqPod2.position.set(x - 20, 88, z + 8);
        scene.add(eqPod2);
        objects.push(eqPod2);

        var eqBox2 = new THREE.Mesh(eqBox1Geom, crossarmMat);
        eqBox2.position.set(x - 20, 88, z - 8);
        scene.add(eqBox2);
        objects.push(eqBox2);
    }

    function buildAntennae() {
        var towerPositions = [
            new THREE.Vector3(-80, 0, -100),
            new THREE.Vector3(-40, 0, -120),
            new THREE.Vector3(0, 0, -140),
            new THREE.Vector3(40, 0, -120),
            new THREE.Vector3(80, 0, -100),
            new THREE.Vector3(-60, 0, 60),
            new THREE.Vector3(60, 0, 60),
            new THREE.Vector3(0, 0, 140)
        ];

        for (var i = 0; i < towerPositions.length; i++) {
            var pos = towerPositions[i];
            buildDipoleArrayAt(pos.x, pos.y, pos.z);
        }
    }

    function buildDipoleArrayAt(x, y, z) {
        var dipMat = new THREE.MeshLambertMaterial({color: 0xcccccc});

        var positions = [];
        var indices = [];

        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 4; j++) {
                var offsetX = i * 4;
                var offsetZ = j * 3;

                positions.push(x + offsetX - 16, 95, z + offsetZ - 6);
                positions.push(x + offsetX - 16, 105, z + offsetZ - 6);

                var idx = i * 8 + j * 2;
                indices.push(idx, idx + 1);
            }
        }

        var geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geom.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

        var dipoles = new THREE.LineSegments(geom, new THREE.LineBasicMaterial({color: 0xcccccc, linewidth: 2}));
        scene.add(dipoles);
        objects.push(dipoles);
    }

    function buildTransmitters() {
        var transmitterPositions = [
            new THREE.Vector3(-120, 0, 0),
            new THREE.Vector3(120, 0, 0),
            new THREE.Vector3(0, 0, 160)
        ];

        for (var i = 0; i < transmitterPositions.length; i++) {
            var pos = transmitterPositions[i];
            buildTransmitterAt(pos.x, pos.y, pos.z);
        }
    }

    function buildTransmitterAt(x, y, z) {
        var buildMat = new THREE.MeshLambertMaterial({color: 0x555555});
        var buildGeom = new THREE.BoxGeometry(40, 35, 30);
        var building = new THREE.Mesh(buildGeom, buildMat);
        building.position.set(x, 17.5, z);
        scene.add(building);
        objects.push(building);

        var coolMat = new THREE.MeshLambertMaterial({color: 0x666666});
        for (var i = 0; i < 3; i++) {
            var coolGeom = new THREE.CylinderGeometry(2, 2, 15, 16);
            var cooler = new THREE.Mesh(coolGeom, coolMat);
            cooler.position.set(x - 12 + i * 12, 40, z + 18);
            scene.add(cooler);
            objects.push(cooler);
        }

        for (var j = 0; j < 2; j++) {
            var topVentGeom = new THREE.BoxGeometry(35, 4, 25);
            var topVent = new THREE.Mesh(topVentGeom, buildMat);
            topVent.position.set(x, 36 + j * 5, z);
            scene.add(topVent);
            objects.push(topVent);
        }

        var signalGeom = new THREE.SphereGeometry(1.5, 16, 16);
        var signalMat = new THREE.MeshLambertMaterial({color: 0xff4444, emissive: 0xff4444});
        var signal = new THREE.Mesh(signalGeom, signalMat);
        signal.position.set(x, 40, z - 17);
        var pointLight = new THREE.PointLight(0xff4444, 1, 60);
        pointLight.position.copy(signal.position);
        scene.add(signal);
        scene.add(pointLight);
        objects.push(signal);
        lights.push(pointLight);
        signalLights.push({light: pointLight, originalIntensity: 1});
    }

    function buildBarricades() {
        var perimeter = [
            {x: -150, z: -180},
            {x: 150, z: -180},
            {x: 150, z: 180},
            {x: -150, z: 180}
        ];

        for (var i = 0; i < perimeter.length; i++) {
            var p1 = perimeter[i];
            var p2 = perimeter[(i + 1) % perimeter.length];
            buildFenceSegment(p1.x, p1.z, p2.x, p2.z);
        }
    }

    function buildFenceSegment(x1, z1, x2, z2) {
        var postMat = new THREE.MeshLambertMaterial({color: 0x333333});
        var segmentLength = Math.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1));
        var numPosts = Math.ceil(segmentLength / 25);

        for (var i = 0; i <= numPosts; i++) {
            var t = i / numPosts;
            var px = x1 + (x2 - x1) * t;
            var pz = z1 + (z2 - z1) * t;

            var postGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 12);
            var post = new THREE.Mesh(postGeom, postMat);
            post.position.set(px, 4, pz);
            scene.add(post);
            objects.push(post);
        }

        var wirePositions = [];
        var wireIndices = [];
        for (var j = 0; j <= numPosts; j++) {
            var t = j / numPosts;
            var px = x1 + (x2 - x1) * t;
            var pz = z1 + (z2 - z1) * t;

            wirePositions.push(px, 2, pz);
            wirePositions.push(px, 6, pz);

            if (j > 0) {
                var idx = j * 2;
                wireIndices.push(idx - 2, idx);
                wireIndices.push(idx - 1, idx + 1);
            }
        }

        var wireGeom = new THREE.BufferGeometry();
        wireGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wirePositions), 3));
        wireGeom.setIndex(new THREE.BufferAttribute(new Uint32Array(wireIndices), 1));
        var wires = new THREE.LineSegments(wireGeom, new THREE.LineBasicMaterial({color: 0xaa0000, linewidth: 2}));
        scene.add(wires);
        objects.push(wires);
    }

    function buildBunkers() {
        var bunkerPositions = [
            new THREE.Vector3(-100, 0, 100),
            new THREE.Vector3(100, 0, 100)
        ];

        for (var i = 0; i < bunkerPositions.length; i++) {
            var pos = bunkerPositions[i];
            buildBunkerAt(pos.x, pos.y, pos.z);
        }
    }

    function buildBunkerAt(x, y, z) {
        var bunkerMat = new THREE.MeshLambertMaterial({color: 0x444444});
        var wallGeom = new THREE.BoxGeometry(25, 20, 3);

        var wall1 = new THREE.Mesh(wallGeom, bunkerMat);
        wall1.position.set(x, 10, z - 15);
        scene.add(wall1);
        objects.push(wall1);

        var wall2 = new THREE.Mesh(wallGeom, bunkerMat);
        wall2.position.set(x, 10, z + 15);
        scene.add(wall2);
        objects.push(wall2);

        var wall3Geom = new THREE.BoxGeometry(3, 20, 30);
        var wall3 = new THREE.Mesh(wall3Geom, bunkerMat);
        wall3.position.set(x - 15, 10, z);
        scene.add(wall3);
        objects.push(wall3);

        var wall4 = new THREE.Mesh(wall3Geom, bunkerMat);
        wall4.position.set(x + 15, 10, z);
        scene.add(wall4);
        objects.push(wall4);

        var doorMat = new THREE.MeshLambertMaterial({color: 0x222222});
        var doorGeom = new THREE.BoxGeometry(8, 12, 2);
        var door = new THREE.Mesh(doorGeom, doorMat);
        door.position.set(x, 6, z - 16);
        scene.add(door);
        objects.push(door);

        var roofGeom = new THREE.BoxGeometry(30, 2, 35);
        var roof = new THREE.Mesh(roofGeom, bunkerMat);
        roof.position.set(x, 21, z);
        scene.add(roof);
        objects.push(roof);
    }

    function buildSubstation() {
        var transformerMat = new THREE.MeshLambertMaterial({color: 0x555555});

        for (var i = 0; i < 4; i++) {
            var xOffset = -30 + i * 20;
            var platformGeom = new THREE.BoxGeometry(15, 2, 15);
            var platform = new THREE.Mesh(platformGeom, transformerMat);
            platform.position.set(xOffset, 1, 0);
            scene.add(platform);
            objects.push(platform);

            var barrelGeom = new THREE.CylinderGeometry(4, 4, 18, 16);
            var barrel = new THREE.Mesh(barrelGeom, transformerMat);
            barrel.position.set(xOffset, 11, 0);
            scene.add(barrel);
            objects.push(barrel);

            var topCoverGeom = new THREE.CylinderGeometry(4.5, 4.5, 1, 16);
            var topCover = new THREE.Mesh(topCoverGeom, transformerMat);
            topCover.position.set(xOffset, 20, 0);
            scene.add(topCover);
            objects.push(topCover);
        }
    }

    function buildCablefield() {
        var cableMat = new THREE.LineBasicMaterial({color: 0x666666, linewidth: 2});

        for (var row = 0; row < 6; row++) {
            for (var col = 0; col < 4; col++) {
                var xPos = -50 + col * 35;
                var zPos = -80 + row * 30;

                var channelGeom = new THREE.BoxGeometry(30, 2, 8);
                var channel = new THREE.Mesh(channelGeom, new THREE.MeshLambertMaterial({color: 0x777777}));
                channel.position.set(xPos, 0.5, zPos);
                scene.add(channel);
                objects.push(channel);

                var cablePositions = [
                    xPos - 10, 1.5, zPos,
                    xPos + 10, 1.5, zPos,
                    xPos, 1.5, zPos - 5,
                    xPos, 1.5, zPos + 5,
                    xPos - 8, 1.5, zPos - 3,
                    xPos + 8, 1.5, zPos + 3
                ];

                var cableGeom = new THREE.BufferGeometry();
                cableGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cablePositions), 3));
                var cableIndices = [0, 1, 2, 3, 4, 5, 0, 5];
                cableGeom.setIndex(new THREE.BufferAttribute(new Uint32Array(cableIndices), 1));

                var cables = new THREE.LineSegments(cableGeom, cableMat);
                scene.add(cables);
                objects.push(cables);
            }
        }
    }

    function buildRadarDish() {
        var radarMat = new THREE.MeshLambertMaterial({color: 0x555555});

        var pedestalGeom = new THREE.CylinderGeometry(3, 3, 25, 16);
        var pedestal = new THREE.Mesh(pedestalGeom, radarMat);
        pedestal.position.set(-120, 12.5, 120);
        scene.add(pedestal);
        objects.push(pedestal);

        var armGeom = new THREE.BoxGeometry(35, 2, 2);
        radarArm = new THREE.Mesh(armGeom, radarMat);
        radarArm.position.set(-120, 28, 120);
        scene.add(radarArm);
        objects.push(radarArm);

        var dishGeom = new THREE.BoxGeometry(12, 12, 2);
        var dish = new THREE.Mesh(dishGeom, new THREE.MeshLambertMaterial({color: 0x666666}));
        dish.position.set(-120 + 17, 28, 120);
        dish.parent = radarArm;
        radarArm.add(dish);

        var supportGeom = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        var support = new THREE.Mesh(supportGeom, radarMat);
        support.position.set(-120 + 17, 30.5, 120);
        radarArm.add(support);
    }

    function buildGeneratorBuilding() {
        var buildMat = new THREE.MeshLambertMaterial({color: 0x666666});
        var buildGeom = new THREE.BoxGeometry(50, 30, 40);
        var building = new THREE.Mesh(buildGeom, buildMat);
        building.position.set(120, 15, 120);
        scene.add(building);
        objects.push(building);

        var exhaustMat = new THREE.MeshLambertMaterial({color: 0x555555});
        for (var i = 0; i < 3; i++) {
            var stackGeom = new THREE.CylinderGeometry(2, 2, 25, 16);
            var stack = new THREE.Mesh(stackGeom, exhaustMat);
            stack.position.set(120 - 12 + i * 12, 37.5, 120 + 25);
            scene.add(stack);
            objects.push(stack);

            var capGeom = new THREE.ConeGeometry(2.5, 3, 16);
            var cap = new THREE.Mesh(capGeom, exhaustMat);
            cap.position.set(120 - 12 + i * 12, 42, 120 + 25);
            scene.add(cap);
            objects.push(cap);
        }

        var ventGeom = new THREE.BoxGeometry(45, 8, 35);
        var vent = new THREE.Mesh(ventGeom, buildMat);
        vent.position.set(120, 32, 120);
        scene.add(vent);
        objects.push(vent);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 100);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var skyLight = new THREE.DirectionalLight(0x8899ff, 0.3);
        skyLight.position.set(-100, 100, -100);
        scene.add(skyLight);
        lights.push(skyLight);
    }

    function update(delta) {
        if (radarArm) {
            radarArm.rotation.y += delta * 0.5;
        }

        for (var i = 0; i < signalLights.length; i++) {
            var sig = signalLights[i];
            var pulse = Math.sin(Date.now() * 0.005 + i) * 0.5 + 0.5;
            sig.light.intensity = sig.originalIntensity * (0.3 + pulse * 0.7);
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
        signalLights = [];
        radarArm = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
