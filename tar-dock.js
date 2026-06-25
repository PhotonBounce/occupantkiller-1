window.TarDock = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var craneArms = [];
    var tarBubbles = [];
    var animationData = [];

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function addLine(points, color) {
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
        var mat = new THREE.LineBasicMaterial({ color: color, linewidth: 2 });
        var line = new THREE.LineSegments(geo, mat);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildDockPlatform() {
        var tarMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var ironMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var platformGeo = new THREE.BoxGeometry(50, 2, 30);
        var platform = addMesh(platformGeo, tarMat, 0, 0, 0);

        var pilingGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
        addMesh(pilingGeo, ironMat, -20, -4, -10);
        addMesh(pilingGeo, ironMat, -20, -4, 10);
        addMesh(pilingGeo, ironMat, 0, -4, -10);
        addMesh(pilingGeo, ironMat, 0, -4, 10);
        addMesh(pilingGeo, ironMat, 20, -4, -10);
        addMesh(pilingGeo, ironMat, 20, -4, 10);
    }

    function buildTarPits() {
        var pitMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var pitGeo = new THREE.BoxGeometry(8, 3, 8);

        var pit1 = addMesh(pitGeo, pitMat, -15, -2, -8);
        var pit2 = addMesh(pitGeo, pitMat, -15, -2, 8);
        var pit3 = addMesh(pitGeo, pitMat, 15, -2, -8);
        var pit4 = addMesh(pitGeo, pitMat, 15, -2, 8);

        var bubbleMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var bubbleGeo = new THREE.SphereGeometry(0.6, 8, 8);

        for (var i = 0; i < 12; i++) {
            var bubble = addMesh(bubbleGeo, bubbleMat, -15 + (i % 2) * 30, 1, -8 + Math.floor(i / 6) * 16);
            tarBubbles.push({
                mesh: bubble,
                baseY: 1 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5
            });
        }
    }

    function buildShipYard() {
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x442211 });
        var supportMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

        var hull1Geo = new THREE.BoxGeometry(25, 8, 6);
        var hull1 = addMesh(hull1Geo, hullMat, -15, 4, -15);

        var support1Geo = new THREE.CylinderGeometry(1, 1, 12, 8);
        addMesh(support1Geo, supportMat, -25, 2, -15);
        addMesh(support1Geo, supportMat, -5, 2, -15);

        var hull2Geo = new THREE.BoxGeometry(20, 7, 5);
        var hull2 = addMesh(hull2Geo, hullMat, 10, 3.5, -15);

        addMesh(support1Geo, supportMat, 0, 2, -15);
        addMesh(support1Geo, supportMat, 20, 2, -15);

        var crateGeo = new THREE.BoxGeometry(2, 2, 2);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
        addMesh(crateGeo, crateMat, 10, 11, -15);
        addMesh(crateGeo, crateMat, 12, 11, -15);
        addMesh(crateGeo, crateMat, 14, 11, -15);
    }

    function buildCraneArms() {
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

        var craneBase1Geo = new THREE.BoxGeometry(3, 15, 3);
        var crane1Base = addMesh(craneBase1Geo, baseMat, -20, 7.5, 15);

        var craneArm1Geo = new THREE.BoxGeometry(20, 2, 2);
        var crane1Arm = addMesh(craneArm1Geo, boomMat, -10, 16, 15);
        crane1Arm.rotation.order = 'YXZ';
        craneArms.push({ mesh: crane1Arm, parent: crane1Base });

        var cargoGeo = new THREE.BoxGeometry(3, 3, 3);
        var cargoMat = new THREE.MeshLambertMaterial({ color: 0xDD4422 });
        var cargo1 = addMesh(cargoGeo, cargoMat, -10, 13, 15);
        animationData.push({ type: 'cargo', mesh: cargo1, craneArm: crane1Arm });

        var cablePts = [
            -10, 16, 15,
            -10, 13, 15
        ];
        addLine(cablePts, 0xCCCCCC);

        var craneBase2Geo = new THREE.BoxGeometry(3, 15, 3);
        var crane2Base = addMesh(craneBase2Geo, baseMat, 20, 7.5, 15);

        var craneArm2Geo = new THREE.BoxGeometry(18, 2, 2);
        var crane2Arm = addMesh(craneArm2Geo, boomMat, 11, 16, 15);
        crane2Arm.rotation.order = 'YXZ';
        craneArms.push({ mesh: crane2Arm, parent: crane2Base });

        var cargo2 = addMesh(cargoGeo, cargoMat, 11, 13, 15);
        animationData.push({ type: 'cargo', mesh: cargo2, craneArm: crane2Arm });

        var cable2Pts = [
            11, 16, 15,
            11, 13, 15
        ];
        addLine(cable2Pts, 0xCCCCCC);
    }

    function buildStorageBuildings() {
        var buildingMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

        var b1Geo = new THREE.BoxGeometry(12, 10, 8);
        var b1 = addMesh(b1Geo, buildingMat, -30, 5, -15);

        var b2Geo = new THREE.BoxGeometry(12, 10, 8);
        var b2 = addMesh(b2Geo, buildingMat, -30, 5, 5);

        var b3Geo = new THREE.BoxGeometry(12, 10, 8);
        var b3 = addMesh(b3Geo, buildingMat, 30, 5, -15);

        var b4Geo = new THREE.BoxGeometry(12, 10, 8);
        var b4 = addMesh(b4Geo, buildingMat, 30, 5, 5);

        var b5Geo = new THREE.BoxGeometry(10, 10, 12);
        var b5 = addMesh(b5Geo, buildingMat, 0, 5, 20);

        var doorGeo = new THREE.BoxGeometry(3, 6, 0.2);
        addMesh(doorGeo, doorMat, -30, 3, -19);
        addMesh(doorGeo, doorMat, -30, 3, 9);
        addMesh(doorGeo, doorMat, 30, 3, -19);
        addMesh(doorGeo, doorMat, 30, 3, 9);
        addMesh(doorGeo, doorMat, 0, 3, 24);

        var windowBarMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
        var windowBars = [
            -30, 8, -19, -30, 2, -19,
            -30, 8, 9, -30, 2, 9,
            30, 8, -19, 30, 2, -19,
            30, 8, 9, 30, 2, 9
        ];
        addLine(windowBars, 0x444444);
    }

    function buildSmugglersCache() {
        var chamberMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d });
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
        var ammoBulletMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        var chamberGeo = new THREE.BoxGeometry(15, 6, 12);
        var chamber = addMesh(chamberGeo, chamberMat, -5, -4, -8);

        var crateStackGeo = new THREE.BoxGeometry(3, 3, 3);
        addMesh(crateStackGeo, crateMat, -8, -2, -6);
        addMesh(crateStackGeo, crateMat, -5, -2, -6);
        addMesh(crateStackGeo, crateMat, -2, -2, -6);
        addMesh(crateStackGeo, crateMat, -8, 1, -6);
        addMesh(crateStackGeo, crateMat, -5, 1, -6);

        var ammoBoxGeo = new THREE.BoxGeometry(2, 1, 2);
        addMesh(ammoBoxGeo, ammoBulletMat, 2, -2, -6);
        addMesh(ammoBoxGeo, ammoBulletMat, 4, -2, -6);
        addMesh(ammoBoxGeo, ammoBulletMat, 2, -2, -4);
        addMesh(ammoBoxGeo, ammoBulletMat, 4, -2, -4);
    }

    function buildGuardPosts() {
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var lightMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var tower1Geo = new THREE.BoxGeometry(4, 10, 4);
        var tower1 = addMesh(tower1Geo, towerMat, -24, 5, -20);

        var roof1Geo = new THREE.ConeGeometry(3, 2, 8);
        addMesh(roof1Geo, roofMat, -24, 16, -20);

        var light1Geo = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
        addMesh(light1Geo, lightMat, -24, 18, -20);

        var tower2Geo = new THREE.BoxGeometry(4, 10, 4);
        var tower2 = addMesh(tower2Geo, towerMat, 24, 5, -20);

        var roof2Geo = new THREE.ConeGeometry(3, 2, 8);
        addMesh(roof2Geo, roofMat, 24, 16, -20);

        var light2Geo = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
        addMesh(light2Geo, lightMat, 24, 18, -20);

        var tower3Geo = new THREE.BoxGeometry(4, 10, 4);
        var tower3 = addMesh(tower3Geo, towerMat, -24, 5, 20);

        var roof3Geo = new THREE.ConeGeometry(3, 2, 8);
        addMesh(roof3Geo, roofMat, -24, 16, 20);

        var light3Geo = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
        addMesh(light3Geo, lightMat, -24, 18, 20);

        var tower4Geo = new THREE.BoxGeometry(4, 10, 4);
        var tower4 = addMesh(tower4Geo, towerMat, 24, 5, 20);

        var roof4Geo = new THREE.ConeGeometry(3, 2, 8);
        addMesh(roof4Geo, roofMat, 24, 16, 20);

        var light4Geo = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
        addMesh(light4Geo, lightMat, 24, 18, 20);
    }

    function buildPipeNetwork() {
        var pipeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var valveMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

        var pipeGeo = new THREE.CylinderGeometry(0.4, 0.4, 20, 12);
        var hpipe1 = addMesh(pipeGeo, pipeMat, 0, 8, -8);
        hpipe1.rotation.z = Math.PI / 2;

        var hpipe2 = addMesh(pipeGeo, pipeMat, 0, 12, 0);
        hpipe2.rotation.z = Math.PI / 2;

        var hpipe3 = addMesh(pipeGeo, pipeMat, 0, 8, 8);
        hpipe3.rotation.z = Math.PI / 2;

        var vpipeGeo = new THREE.CylinderGeometry(0.4, 0.4, 12, 12);
        var vpipe1 = addMesh(vpipeGeo, pipeMat, -20, 6, 0);
        var vpipe2 = addMesh(vpipeGeo, pipeMat, 20, 6, 0);

        var valveGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
        for (var i = 0; i < 8; i++) {
            addMesh(valveGeo, valveMat, -16 + i * 8, 8, -8);
            addMesh(valveGeo, valveMat, -16 + i * 8, 12, 0);
            addMesh(valveGeo, valveMat, -16 + i * 8, 8, 8);
        }

        var jointGeo = new THREE.SphereGeometry(0.6, 8, 8);
        addMesh(jointGeo, valveMat, -20, 8, -8);
        addMesh(jointGeo, valveMat, 20, 8, -8);
        addMesh(jointGeo, valveMat, -20, 12, 0);
        addMesh(jointGeo, valveMat, 20, 12, 0);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x111122, 0.4);
        addLight(ambientLight);

        for (var i = -24; i <= 24; i += 8) {
            for (var j = -20; j <= 20; j += 8) {
                var pointLight = new THREE.PointLight(0xFFAA00, 0.8, 30);
                pointLight.position.set(i, 12, j);
                addLight(pointLight);
            }
        }

        var redWarn1 = new THREE.PointLight(0xFF0000, 0.6, 15);
        redWarn1.position.set(-25, 2, -18);
        addLight(redWarn1);

        var redWarn2 = new THREE.PointLight(0xFF0000, 0.6, 15);
        redWarn2.position.set(25, 2, -18);
        addLight(redWarn2);

        var redWarn3 = new THREE.PointLight(0xFF0000, 0.6, 15);
        redWarn3.position.set(-25, 2, 18);
        addLight(redWarn3);

        var redWarn4 = new THREE.PointLight(0xFF0000, 0.6, 15);
        redWarn4.position.set(25, 2, 18);
        addLight(redWarn4);
    }

    function update(delta) {
        for (var i = 0; i < tarBubbles.length; i++) {
            var bubble = tarBubbles[i];
            bubble.phase += bubble.speed * delta;
            var yPos = bubble.baseY + Math.sin(bubble.phase) * 3;
            bubble.mesh.position.y = yPos;
            bubble.mesh.scale.set(
                1 + Math.sin(bubble.phase * 1.5) * 0.3,
                1 + Math.sin(bubble.phase * 1.5) * 0.3,
                1 + Math.sin(bubble.phase * 1.5) * 0.3
            );
        }

        for (var i = 0; i < craneArms.length; i++) {
            craneArms[i].mesh.rotation.y += 0.15 * delta;
        }

        for (var i = 0; i < animationData.length; i++) {
            var anim = animationData[i];
            if (anim.type === 'cargo') {
                anim.mesh.position.y = 13 + Math.sin(anim.craneArm.rotation.y) * 0.5;
            }
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        craneArms = [];
        tarBubbles = [];
        animationData = [];

        buildDockPlatform();
        buildTarPits();
        buildShipYard();
        buildCraneArms();
        buildStorageBuildings();
        buildSmugglersCache();
        buildGuardPosts();
        buildPipeNetwork();
        setupLighting();
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
        craneArms = [];
        tarBubbles = [];
        animationData = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
