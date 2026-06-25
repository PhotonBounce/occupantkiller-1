window.VoltDam = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var sparks = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        sparks = [];
        buildDamWall();
        buildSpillwayGates();
        buildPowerhouse();
        buildTransformerYard();
        buildPylons();
        buildControlRoom();
        buildCatwalk();
        buildReservoir();
        buildRiverChannel();
        buildDefenses();
        buildAntiAircraft();
        buildCrane();
        buildSaboteurPath();
        setupLighting();
        initSparks();
    }

    function buildDamWall() {
        var concrete = new THREE.Color(0x888888);
        var mainGeom = new THREE.BoxGeometry(60, 30, 8);
        var mainMat = new THREE.MeshLambertMaterial({ color: concrete });
        var mainMesh = new THREE.Mesh(mainGeom, mainMat);
        mainMesh.position.set(0, 15, 0);
        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
        scene.add(mainMesh);
        objects.push(mainMesh);

        var reinforcementGeom = new THREE.BoxGeometry(62, 2, 10);
        var reinforcementMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var reinforcementMesh = new THREE.Mesh(reinforcementGeom, reinforcementMat);
        reinforcementMesh.position.set(0, 28, 0);
        reinforcementMesh.castShadow = true;
        reinforcementMesh.receiveShadow = true;
        scene.add(reinforcementMesh);
        objects.push(reinforcementMesh);

        var baseGeom = new THREE.BoxGeometry(64, 3, 12);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var baseMesh = new THREE.Mesh(baseGeom, baseMat);
        baseMesh.position.set(0, -2, 0);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        scene.add(baseMesh);
        objects.push(baseMesh);

        var sectionColor = 0x777777;
        for (var i = -2; i <= 2; i++) {
            var sectionGeom = new THREE.BoxGeometry(8, 28, 7);
            var sectionMat = new THREE.MeshLambertMaterial({ color: sectionColor });
            var sectionMesh = new THREE.Mesh(sectionGeom, sectionMat);
            sectionMesh.position.set(i * 12, 15, 0);
            sectionMesh.castShadow = true;
            sectionMesh.receiveShadow = true;
            scene.add(sectionMesh);
            objects.push(sectionMesh);
        }

        for (var j = 0; j < 8; j++) {
            var stripGeom = new THREE.BoxGeometry(58, 3, 8.5);
            var stripMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
            var stripMesh = new THREE.Mesh(stripGeom, stripMat);
            stripMesh.position.set(0, 2 + j * 3.2, 0);
            stripMesh.castShadow = true;
            stripMesh.receiveShadow = true;
            scene.add(stripMesh);
            objects.push(stripMesh);
        }
    }

    function buildSpillwayGates() {
        var gateColor = 0xcccccc;
        for (var i = 0; i < 5; i++) {
            var gateGeom = new THREE.BoxGeometry(10, 20, 2);
            var gateMat = new THREE.MeshLambertMaterial({ color: gateColor });
            var gateMesh = new THREE.Mesh(gateGeom, gateMat);
            gateMesh.position.set(-20 + i * 10, 12, 4.5);
            gateMesh.castShadow = true;
            gateMesh.receiveShadow = true;
            scene.add(gateMesh);
            objects.push(gateMesh);

            var gearGeom = new THREE.CylinderGeometry(1.5, 1.5, 1, 16);
            var gearMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var gearMesh = new THREE.Mesh(gearGeom, gearMat);
            gearMesh.position.set(-20 + i * 10, 25, 5);
            gearMesh.castShadow = true;
            gearMesh.receiveShadow = true;
            scene.add(gearMesh);
            objects.push(gearMesh);
        }
    }

    function buildPowerhouse() {
        var powerhouseGeom = new THREE.BoxGeometry(50, 12, 20);
        var powerhouseMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var powerhouseMesh = new THREE.Mesh(powerhouseGeom, powerhouseMat);
        powerhouseMesh.position.set(0, 6, -18);
        powerhouseMesh.castShadow = true;
        powerhouseMesh.receiveShadow = true;
        scene.add(powerhouseMesh);
        objects.push(powerhouseMesh);

        var roofGeom = new THREE.BoxGeometry(52, 2, 22);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(0, 13, -18);
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        scene.add(roofMesh);
        objects.push(roofMesh);

        for (var i = 0; i < 6; i++) {
            var generatorGeom = new THREE.CylinderGeometry(3, 3, 8, 16);
            var generatorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var generatorMesh = new THREE.Mesh(generatorGeom, generatorMat);
            generatorMesh.position.set(-18 + i * 8, 10, -18);
            generatorMesh.castShadow = true;
            generatorMesh.receiveShadow = true;
            scene.add(generatorMesh);
            objects.push(generatorMesh);

            var motorGeom = new THREE.SphereGeometry(2, 8, 8);
            var motorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var motorMesh = new THREE.Mesh(motorGeom, motorMat);
            motorMesh.position.set(-18 + i * 8, 8, -18);
            motorMesh.castShadow = true;
            motorMesh.receiveShadow = true;
            scene.add(motorMesh);
            objects.push(motorMesh);
        }

        for (var j = 0; j < 3; j++) {
            var doorGeom = new THREE.BoxGeometry(6, 8, 1.5);
            var doorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var doorMesh = new THREE.Mesh(doorGeom, doorMat);
            doorMesh.position.set(-16 + j * 16, 4, -28.5);
            doorMesh.castShadow = true;
            doorMesh.receiveShadow = true;
            scene.add(doorMesh);
            objects.push(doorMesh);
        }
    }

    function buildTransformerYard() {
        var poleHeight = 25;
        for (var i = 0; i < 4; i++) {
            var poleGeom = new THREE.CylinderGeometry(1.2, 1.2, poleHeight, 12);
            var poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var poleMesh = new THREE.Mesh(poleGeom, poleMat);
            poleMesh.position.set(-15 + i * 10, poleHeight / 2, -40);
            poleMesh.castShadow = true;
            poleMesh.receiveShadow = true;
            scene.add(poleMesh);
            objects.push(poleMesh);
        }

        for (var j = 0; j < 3; j++) {
            var lineStart = new THREE.Vector3(-15, 23, -40);
            var lineEnd = new THREE.Vector3(-5, 23, -40);
            var lineGeom = new THREE.BufferGeometry();
            lineGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
                lineStart.x, lineStart.y, lineStart.z,
                lineEnd.x, lineEnd.y, lineEnd.z
            ]), 3));
            var lineMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
            var lineMesh = new THREE.LineSegments(lineGeom, lineMat);
            lineMesh.position.y = j * 2;
            scene.add(lineMesh);
            objects.push(lineMesh);
            sparks.push({ line: lineMesh, positions: [lineStart, lineEnd], sparkCount: 3 });
        }

        for (var k = 0; k < 3; k++) {
            var transformerGeom = new THREE.BoxGeometry(4, 5, 4);
            var transformerMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
            var transformerMesh = new THREE.Mesh(transformerGeom, transformerMat);
            transformerMesh.position.set(-15 + k * 15, 3, -40);
            transformerMesh.castShadow = true;
            transformerMesh.receiveShadow = true;
            scene.add(transformerMesh);
            objects.push(transformerMesh);
        }

        var conduitGeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
        var conduitMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var conduitMesh = new THREE.Mesh(conduitGeom, conduitMat);
        conduitMesh.position.set(-5, 3, -40);
        conduitMesh.rotation.z = Math.PI / 2;
        conduitMesh.castShadow = true;
        conduitMesh.receiveShadow = true;
        scene.add(conduitMesh);
        objects.push(conduitMesh);

        var switchGeom = new THREE.BoxGeometry(3, 6, 2);
        var switchMat = new THREE.MeshLambertMaterial({ color: 0x990000 });
        var switchMesh = new THREE.Mesh(switchGeom, switchMat);
        switchMesh.position.set(5, 4, -40);
        switchMesh.castShadow = true;
        switchMesh.receiveShadow = true;
        scene.add(switchMesh);
        objects.push(switchMesh);
    }

    function buildPylons() {
        for (var i = 0; i < 3; i++) {
            var baseGeom = new THREE.CylinderGeometry(2, 2, 1, 12);
            var baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var baseMesh = new THREE.Mesh(baseGeom, baseMat);
            baseMesh.position.set(-30 + i * 30, 0.5, -60);
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            scene.add(baseMesh);
            objects.push(baseMesh);

            var poleGeom = new THREE.CylinderGeometry(1.5, 1.5, 35, 12);
            var poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var poleMesh = new THREE.Mesh(poleGeom, poleMat);
            poleMesh.position.set(-30 + i * 30, 18, -60);
            poleMesh.castShadow = true;
            poleMesh.receiveShadow = true;
            scene.add(poleMesh);
            objects.push(poleMesh);

            var crossGeom = new THREE.BoxGeometry(20, 3, 3);
            var crossMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var crossMesh = new THREE.Mesh(crossGeom, crossMat);
            crossMesh.position.set(-30 + i * 30, 30, -60);
            crossMesh.castShadow = true;
            crossMesh.receiveShadow = true;
            scene.add(crossMesh);
            objects.push(crossMesh);

            for (var j = 0; j < 2; j++) {
                var armGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
                var armMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
                var armMesh = new THREE.Mesh(armGeom, armMat);
                armMesh.position.set(-30 + i * 30 + (j === 0 ? -7 : 7), 28, -60);
                armMesh.rotation.z = Math.PI / 2.5;
                armMesh.castShadow = true;
                armMesh.receiveShadow = true;
                scene.add(armMesh);
                objects.push(armMesh);
            }
        }
    }

    function buildControlRoom() {
        var mainGeom = new THREE.BoxGeometry(14, 8, 10);
        var mainMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var mainMesh = new THREE.Mesh(mainGeom, mainMat);
        mainMesh.position.set(0, 33, 2);
        mainMesh.castShadow = true;
        mainMesh.receiveShadow = true;
        scene.add(mainMesh);
        objects.push(mainMesh);

        var roofGeom = new THREE.BoxGeometry(16, 2, 12);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(0, 37, 2);
        roofMesh.castShadow = true;
        roofMesh.receiveShadow = true;
        scene.add(roofMesh);
        objects.push(roofMesh);

        for (var i = 0; i < 4; i++) {
            var windowGeom = new THREE.BoxGeometry(2.5, 2.5, 0.3);
            var windowMat = new THREE.MeshLambertMaterial({ color: 0x3399ff, emissive: 0x1166ff });
            var windowMesh = new THREE.Mesh(windowGeom, windowMat);
            windowMesh.position.set(-4 + i * 3, 34, 5.5);
            windowMesh.castShadow = true;
            windowMesh.receiveShadow = true;
            scene.add(windowMesh);
            objects.push(windowMesh);
        }

        for (var j = 0; j < 2; j++) {
            var sideGeom = new THREE.BoxGeometry(1, 8, 5);
            var sideMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var sideMesh = new THREE.Mesh(sideGeom, sideMat);
            sideMesh.position.set(-7.5 + j * 15, 33, 2);
            sideMesh.castShadow = true;
            sideMesh.receiveShadow = true;
            scene.add(sideMesh);
            objects.push(sideMesh);
        }

        var antennaGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
        var antennaMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var antennaMesh = new THREE.Mesh(antennaGeom, antennaMat);
        antennaMesh.position.set(6, 40, 2);
        antennaMesh.castShadow = true;
        antennaMesh.receiveShadow = true;
        scene.add(antennaMesh);
        objects.push(antennaMesh);

        var radomeGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var radiusMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var radialMesh = new THREE.Mesh(radomeGeom, radiusMat);
        radialMesh.position.set(6, 45, 2);
        radialMesh.castShadow = true;
        radialMesh.receiveShadow = true;
        scene.add(radialMesh);
        objects.push(radialMesh);
    }

    function buildCatwalk() {
        var walkwayGeom = new THREE.BoxGeometry(62, 1, 2.5);
        var walkwayMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var walkwayMesh = new THREE.Mesh(walkwayGeom, walkwayMat);
        walkwayMesh.position.set(0, 30.5, 0);
        walkwayMesh.castShadow = true;
        walkwayMesh.receiveShadow = true;
        scene.add(walkwayMesh);
        objects.push(walkwayMesh);

        for (var i = 0; i < 12; i++) {
            var postGeom = new THREE.CylinderGeometry(0.6, 0.6, 3, 12);
            var postMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var postMesh = new THREE.Mesh(postGeom, postMat);
            postMesh.position.set(-28 + i * 5, 32, -1.5);
            postMesh.castShadow = true;
            postMesh.receiveShadow = true;
            scene.add(postMesh);
            objects.push(postMesh);
        }

        for (var j = 0; j < 2; j++) {
            var railGeom = new THREE.CylinderGeometry(0.4, 0.4, 60, 8);
            var railMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var railMesh = new THREE.Mesh(railGeom, railMat);
            railMesh.position.set(0, 32.5 + j * 0.8, j === 0 ? -2 : 2);
            railMesh.rotation.z = Math.PI / 2;
            railMesh.castShadow = true;
            railMesh.receiveShadow = true;
            scene.add(railMesh);
            objects.push(railMesh);
        }
    }

    function buildReservoir() {
        var reservoirGeom = new THREE.BoxGeometry(100, 1, 80);
        var reservoirMat = new THREE.MeshLambertMaterial({ color: 0x001166 });
        var reservoirMesh = new THREE.Mesh(reservoirGeom, reservoirMat);
        reservoirMesh.position.set(0, 32, 30);
        reservoirMesh.castShadow = true;
        reservoirMesh.receiveShadow = true;
        scene.add(reservoirMesh);
        objects.push(reservoirMesh);

        var wallGeom = new THREE.BoxGeometry(102, 3, 2);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var wallMesh = new THREE.Mesh(wallGeom, wallMat);
        wallMesh.position.set(0, 30.5, 70);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        scene.add(wallMesh);
        objects.push(wallMesh);
    }

    function buildRiverChannel() {
        var channelGeom = new THREE.BoxGeometry(80, 1, 40);
        var channelMat = new THREE.MeshLambertMaterial({ color: 0x002244 });
        var channelMesh = new THREE.Mesh(channelGeom, channelMat);
        channelMesh.position.set(0, -8, -25);
        channelMesh.castShadow = true;
        channelMesh.receiveShadow = true;
        scene.add(channelMesh);
        objects.push(channelMesh);

        for (var i = 0; i < 4; i++) {
            var bankGeom = new THREE.BoxGeometry(1, 5, 40);
            var bankMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var bankMesh = new THREE.Mesh(bankGeom, bankMat);
            bankMesh.position.set((i < 2 ? -41 : 41), -5.5, -25);
            bankMesh.castShadow = true;
            bankMesh.receiveShadow = true;
            scene.add(bankMesh);
            objects.push(bankMesh);
        }
    }

    function buildDefenses() {
        for (var i = 0; i < 2; i++) {
            var bunkerGeom = new THREE.BoxGeometry(12, 6, 10);
            var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var bunkerMesh = new THREE.Mesh(bunkerGeom, bunkerMat);
            bunkerMesh.position.set((i === 0 ? -35 : 35), 3, -15);
            bunkerMesh.castShadow = true;
            bunkerMesh.receiveShadow = true;
            scene.add(bunkerMesh);
            objects.push(bunkerMesh);

            var roofBunkerGeom = new THREE.BoxGeometry(14, 1.5, 12);
            var roofBunkerMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var roofBunkerMesh = new THREE.Mesh(roofBunkerGeom, roofBunkerMat);
            roofBunkerMesh.position.set((i === 0 ? -35 : 35), 7.5, -15);
            roofBunkerMesh.castShadow = true;
            roofBunkerMesh.receiveShadow = true;
            scene.add(roofBunkerMesh);
            objects.push(roofBunkerMesh);

            var gunBarrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 12);
            var gunBarrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var gunBarrelMesh = new THREE.Mesh(gunBarrelGeom, gunBarrelMat);
            gunBarrelMesh.position.set((i === 0 ? -35 : 35), 8, -15);
            gunBarrelMesh.rotation.z = -Math.PI / 6;
            gunBarrelMesh.castShadow = true;
            gunBarrelMesh.receiveShadow = true;
            scene.add(gunBarrelMesh);
            objects.push(gunBarrelMesh);

            var mountGeom = new THREE.CylinderGeometry(1.2, 1.2, 2, 12);
            var mountMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var mountMesh = new THREE.Mesh(mountGeom, mountMat);
            mountMesh.position.set((i === 0 ? -35 : 35), 7, -15);
            mountMesh.castShadow = true;
            mountMesh.receiveShadow = true;
            scene.add(mountMesh);
            objects.push(mountMesh);
        }

        for (var j = 0; j < 4; j++) {
            var fortGeom = new THREE.BoxGeometry(8, 4, 8);
            var fortMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var fortMesh = new THREE.Mesh(fortGeom, fortMat);
            fortMesh.position.set(-25 + j * 17, 2, 18);
            fortMesh.castShadow = true;
            fortMesh.receiveShadow = true;
            scene.add(fortMesh);
            objects.push(fortMesh);
        }
    }

    function buildAntiAircraft() {
        var baseGeom = new THREE.CylinderGeometry(2, 2, 1, 12);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var baseMesh = new THREE.Mesh(baseGeom, baseMat);
        baseMesh.position.set(15, 31.5, 0);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        scene.add(baseMesh);
        objects.push(baseMesh);

        var poleAAGeom = new THREE.CylinderGeometry(1, 1, 6, 12);
        var poleAAMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var poleAAMesh = new THREE.Mesh(poleAAGeom, poleAAMat);
        poleAAMesh.position.set(15, 35, 0);
        poleAAMesh.castShadow = true;
        poleAAMesh.receiveShadow = true;
        scene.add(poleAAMesh);
        objects.push(poleAAMesh);

        for (var i = 0; i < 4; i++) {
            var gunGeom = new THREE.CylinderGeometry(0.5, 0.5, 6, 12);
            var gunMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            var gunMesh = new THREE.Mesh(gunGeom, gunMat);
            gunMesh.position.set(15 + 1.5 * Math.cos(i * Math.PI / 2), 36, 0 + 1.5 * Math.sin(i * Math.PI / 2));
            gunMesh.rotation.z = Math.PI / 4;
            gunMesh.castShadow = true;
            gunMesh.receiveShadow = true;
            scene.add(gunMesh);
            objects.push(gunMesh);
        }

        var radarGeom = new THREE.SphereGeometry(2, 8, 8);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        var radarMesh = new THREE.Mesh(radarGeom, radarMat);
        radarMesh.position.set(15, 40, 0);
        radarMesh.castShadow = true;
        radarMesh.receiveShadow = true;
        scene.add(radarMesh);
        objects.push(radarMesh);
    }

    function buildCrane() {
        var boomGeom = new THREE.BoxGeometry(25, 2, 2);
        var boomMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        var boomMesh = new THREE.Mesh(boomGeom, boomMat);
        boomMesh.position.set(-20, 28, -35);
        boomMesh.rotation.z = Math.PI / 8;
        boomMesh.castShadow = true;
        boomMesh.receiveShadow = true;
        scene.add(boomMesh);
        objects.push(boomMesh);

        var basecraneGeom = new THREE.CylinderGeometry(3, 3, 2, 12);
        var basecraniMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var basecranzMesh = new THREE.Mesh(basecraneGeom, basecraniMat);
        basecranzMesh.position.set(-20, 1, -35);
        basecranzMesh.castShadow = true;
        basecranzMesh.receiveShadow = true;
        scene.add(basecranzMesh);
        objects.push(basecranzMesh);

        var polecraneGeom = new THREE.CylinderGeometry(1.5, 1.5, 24, 12);
        var polecranieMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var poleranieMesh = new THREE.Mesh(polecraneGeom, polecranieMat);
        poleranieMesh.position.set(-20, 13, -35);
        poleranieMesh.castShadow = true;
        poleranieMesh.receiveShadow = true;
        scene.add(poleranieMesh);
        objects.push(poleranieMesh);

        var cableGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        var cableMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var cableMesh = new THREE.Mesh(cableGeom, cableMat);
        cableMesh.position.set(-6, 20, -35);
        cableMesh.castShadow = true;
        cableMesh.receiveShadow = true;
        scene.add(cableMesh);
        objects.push(cableMesh);

        var hookGeom = new THREE.SphereGeometry(0.8, 8, 8);
        var hookMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var hookMesh = new THREE.Mesh(hookGeom, hookMat);
        hookMesh.position.set(-6, 11, -35);
        hookMesh.castShadow = true;
        hookMesh.receiveShadow = true;
        scene.add(hookMesh);
        objects.push(hookMesh);
    }

    function buildSaboteurPath() {
        for (var i = 0; i < 8; i++) {
            var stoneGeom = new THREE.BoxGeometry(3, 1, 3);
            var stoneMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var stoneMesh = new THREE.Mesh(stoneGeom, stoneMat);
            stoneMesh.position.set(-30 + i * 10, -7, -50 + Math.sin(i) * 5);
            stoneMesh.castShadow = true;
            stoneMesh.receiveShadow = true;
            scene.add(stoneMesh);
            objects.push(stoneMesh);
        }

        var ropeStartX = -30;
        var ropeStartY = -3;
        var ropeStartZ = -50;
        var ropeEndX = 0;
        var ropeEndY = 8;
        var ropeEndZ = -5;

        for (var j = 0; j < 5; j++) {
            var postGeom = new THREE.CylinderGeometry(0.8, 0.8, 4, 12);
            var postMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
            var postMesh = new THREE.Mesh(postGeom, postMat);
            postMesh.position.set(ropeStartX + (ropeEndX - ropeStartX) * (j / 4), ropeStartY + (ropeEndY - ropeStartY) * (j / 4), ropeStartZ + (ropeEndZ - ropeStartZ) * (j / 4));
            postMesh.castShadow = true;
            postMesh.receiveShadow = true;
            scene.add(postMesh);
            objects.push(postMesh);
        }

        var ropeGeom = new THREE.BufferGeometry();
        ropeGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
            ropeStartX, ropeStartY, ropeStartZ,
            ropeEndX, ropeEndY, ropeEndZ
        ]), 3));
        var ropeMat = new THREE.LineBasicMaterial({ color: 0x8b6914, linewidth: 3 });
        var ropeMesh = new THREE.LineSegments(ropeGeom, ropeMat);
        scene.add(ropeMesh);
        objects.push(ropeMesh);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(30, 40, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xffaa00, 1.2, 50);
        pointLight1.position.set(0, 35, 5);
        pointLight1.castShadow = true;
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0x0066ff, 0.8, 40);
        pointLight2.position.set(0, 34, 3);
        pointLight2.castShadow = true;
        scene.add(pointLight2);
        lights.push(pointLight2);

        var spotLight = new THREE.SpotLight(0xffffff, 2, 100, Math.PI / 6, 0.5, 2);
        spotLight.position.set(20, 35, 20);
        spotLight.target.position.set(0, 0, 0);
        spotLight.castShadow = true;
        scene.add(spotLight);
        lights.push(spotLight);
    }

    function initSparks() {
        for (var i = 0; i < sparks.length; i++) {
            sparks[i].time = 0;
            sparks[i].sparkMeshes = [];
            for (var j = 0; j < sparks[i].sparkCount; j++) {
                var sparkGeom = new THREE.SphereGeometry(0.15, 4, 4);
                var sparkMat = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xffff00 });
                var sparkMesh = new THREE.Mesh(sparkGeom, sparkMat);
                scene.add(sparkMesh);
                objects.push(sparkMesh);
                sparks[i].sparkMeshes.push(sparkMesh);
            }
        }
    }

    function update(delta) {
        for (var i = 0; i < sparks.length; i++) {
            sparks[i].time += delta;
            if (sparks[i].time > 0.5) {
                sparks[i].time = 0;
            }
            for (var j = 0; j < sparks[i].sparkMeshes.length; j++) {
                var sparkMesh = sparks[i].sparkMeshes[j];
                var phase = (sparks[i].time + (j / sparks[i].sparkCount)) % 1;
                var lineStart = sparks[i].positions[0];
                var lineEnd = sparks[i].positions[1];
                sparkMesh.position.x = lineStart.x + (lineEnd.x - lineStart.x) * phase;
                sparkMesh.position.y = lineStart.y + (lineEnd.y - lineStart.y) * phase;
                sparkMesh.position.z = lineStart.z + (lineEnd.z - lineStart.z) * phase;
                var opacity = Math.sin(phase * Math.PI);
                sparkMesh.material.opacity = opacity;
                sparkMesh.visible = (phase > 0.1 && phase < 0.9);
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
        sparks = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
