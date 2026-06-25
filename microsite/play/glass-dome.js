window.GlassDome = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var alarmLights = [];
    var interiorLights = [];
    var flickerTimers = [];

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

    function buildFoundation() {
        var concretemat = new THREE.MeshLambertMaterial({ color: 0x666655 });

        var baseGeo = new THREE.BoxGeometry(40, 1.5, 40);
        addMesh(baseGeo, concretemat, 0, -0.75, 0);

        var lipMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var lipGeo = new THREE.BoxGeometry(42, 0.5, 42);
        addMesh(lipGeo, lipMat, 0, 0.5, 0);

        var cornerGeo = new THREE.BoxGeometry(2, 1.2, 2);
        addMesh(cornerGeo, concretemat, 18, 0, 18);
        addMesh(cornerGeo, concretemat, 18, 0, -18);
        addMesh(cornerGeo, concretemat, -18, 0, 18);
        addMesh(cornerGeo, concretemat, -18, 0, -18);
    }

    function buildDomeStructure() {
        var glassMat = new THREE.MeshLambertMaterial({ color: 0x88AACC });
        var domeRadius = 18;
        var segmentSize = 2.5;

        var segments = [];
        var missing = [];

        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 6; j++) {
                if ((i + j) % 3 === 0 && Math.random() > 0.7) {
                    missing.push(i * 6 + j);
                } else {
                    segments.push([i, j]);
                }
            }
        }

        for (var s = 0; s < segments.length; s++) {
            var si = segments[s][0];
            var sj = segments[s][1];
            var angleX = (si / 8) * Math.PI;
            var angleY = (sj / 6) * Math.PI * 2;
            var x = Math.sin(angleX) * Math.cos(angleY) * domeRadius;
            var y = Math.cos(angleX) * domeRadius + 12;
            var z = Math.sin(angleX) * Math.sin(angleY) * domeRadius;

            var boxGeo = new THREE.BoxGeometry(segmentSize, segmentSize * 0.8, segmentSize);
            var mesh = addMesh(boxGeo, glassMat, x, y, z);
            mesh.rotation.x = angleX;
            mesh.rotation.y = angleY;
        }

        for (var m = 0; m < 4; m++) {
            var crackX = (Math.random() - 0.5) * 20;
            var crackY = Math.random() * 15 + 8;
            var crackZ = (Math.random() - 0.5) * 20;
            var offsetGeo = new THREE.BoxGeometry(segmentSize * 1.2, segmentSize, segmentSize);
            var offsetMat = new THREE.MeshLambertMaterial({ color: 0x4488AA });
            var offsetMesh = addMesh(offsetGeo, offsetMat, crackX, crackY, crackZ);
            offsetMesh.position.x += (Math.random() - 0.5) * 0.8;
            offsetMesh.position.y += (Math.random() - 0.5) * 0.8;
        }
    }

    function buildCrackLines() {
        var crackMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });

        var cracks = [];

        for (var c = 0; c < 8; c++) {
            var points = [];
            var startX = (Math.random() - 0.5) * 35;
            var startZ = (Math.random() - 0.5) * 35;
            var currentX = startX;
            var currentZ = startZ;

            for (var p = 0; p < 10; p++) {
                points.push(new THREE.Vector3(currentX, 8 + Math.random() * 18, currentZ));
                currentX += (Math.random() - 0.5) * 3;
                currentZ += (Math.random() - 0.5) * 3;
            }

            var crackGeo = new THREE.BufferGeometry().setFromPoints(points);
            var crackLine = new THREE.LineSegments(crackGeo, crackMat);
            scene.add(crackLine);
            objects.push(crackLine);
        }
    }

    function buildInteriorLabs() {
        var benchMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var equipMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
        var terminalMat = new THREE.MeshLambertMaterial({ color: 0x113333 });

        var benchGeo = new THREE.BoxGeometry(4, 0.8, 2);
        addMesh(benchGeo, benchMat, -8, 1.5, -6);
        addMesh(benchGeo, benchMat, -8, 1.5, 6);
        addMesh(benchGeo, benchMat, 8, 1.5, -6);
        addMesh(benchGeo, benchMat, 8, 1.5, 6);

        for (var b = 0; b < 8; b++) {
            var equipGeo = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
            var angle = (b / 8) * Math.PI * 2;
            var eqX = Math.cos(angle) * 10;
            var eqZ = Math.sin(angle) * 10;
            addMesh(equipGeo, equipMat, eqX, 3, eqZ);
        }

        var terminalGeo = new THREE.BoxGeometry(0.3, 2, 1.5);
        addMesh(terminalGeo, terminalMat, 0, 2, 0);
        addMesh(terminalGeo, terminalMat, -5, 2, 0);
        addMesh(terminalGeo, terminalMat, 5, 2, 0);
        addMesh(terminalGeo, terminalMat, 0, 2, -5);
        addMesh(terminalGeo, terminalMat, 0, 2, 5);
    }

    function buildSiegePositions() {
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xCCAA88 });
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        for (var s = 0; s < 6; s++) {
            var angle = (s / 6) * Math.PI * 2;
            var distX = Math.cos(angle) * 28;
            var distZ = Math.sin(angle) * 28;

            var sandbagGeo = new THREE.BoxGeometry(3, 1, 3);
            addMesh(sandbagGeo, sandbagMat, distX, 0.5, distZ);
            addMesh(sandbagGeo, sandbagMat, distX + Math.cos(angle + 0.3) * 1.5, 1.2, distZ + Math.sin(angle + 0.3) * 1.5);

            var crateGeo = new THREE.BoxGeometry(2, 2, 2);
            addMesh(crateGeo, crateMat, distX + Math.cos(angle - 0.3) * 2, 1, distZ + Math.sin(angle - 0.3) * 2);
            addMesh(crateGeo, crateMat, distX + Math.cos(angle - 0.3) * 2, 3.2, distZ + Math.sin(angle - 0.3) * 2);

            var gunGeo = new THREE.CylinderGeometry(0.3, 0.4, 2.5, 8);
            var gunMesh = addMesh(gunGeo, gunMat, distX, 2.2, distZ);
            gunMesh.rotation.z = 0.4;
        }
    }

    function buildDefenseWalls() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x777766 });

        var wallGeo = new THREE.BoxGeometry(8, 3, 0.8);
        addMesh(wallGeo, wallMat, 0, 1.5, 15);
        addMesh(wallGeo, wallMat, 15, 1.5, 0);
        addMesh(wallGeo, wallMat, 0, 1.5, -15);
        addMesh(wallGeo, wallMat, -15, 1.5, 0);

        var buttressGeo = new THREE.BoxGeometry(1.2, 2.5, 1.2);
        for (var b = 0; b < 8; b++) {
            var bAngle = (b / 8) * Math.PI * 2;
            var bX = Math.cos(bAngle) * 15;
            var bZ = Math.sin(bAngle) * 15;
            addMesh(buttressGeo, wallMat, bX, 1.25, bZ);
        }
    }

    function buildAirlocks() {
        var airlockFrameMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var chamberMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

        var outerFrame1 = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 12);
        addMesh(outerFrame1, airlockFrameMat, 20, 2.5, 0);

        var innerDoor1 = new THREE.BoxGeometry(1.5, 2.8, 0.2);
        addMesh(innerDoor1, doorMat, 20, 2.5, 1.2);

        var decompChamber1 = new THREE.BoxGeometry(2.2, 2.5, 2.2);
        addMesh(decompChamber1, chamberMat, 20, 2.5, 0.8);

        var outerFrame2 = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 12);
        addMesh(outerFrame2, airlockFrameMat, -20, 2.5, 0);

        var innerDoor2 = new THREE.BoxGeometry(1.5, 2.8, 0.2);
        addMesh(innerDoor2, doorMat, -20, 2.5, 1.2);

        var decompChamber2 = new THREE.BoxGeometry(2.2, 2.5, 2.2);
        addMesh(decompChamber2, chamberMat, -20, 2.5, 0.8);
    }

    function buildDebrisField() {
        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x7799BB });
        var darkDebrisMat = new THREE.MeshLambertMaterial({ color: 0x4466AA });

        for (var d = 0; d < 35; d++) {
            var debrisX = (Math.random() - 0.5) * 45;
            var debrisZ = (Math.random() - 0.5) * 45;
            var debrisSize = Math.random() * 1.2 + 0.3;
            var debrisGeo = new THREE.BoxGeometry(debrisSize, debrisSize * 0.6, debrisSize);
            var debrisMesh = addMesh(debrisGeo, d % 2 === 0 ? debrisMat : darkDebrisMat, debrisX, 0.4 + Math.random() * 0.3, debrisZ);
            debrisMesh.rotation.x = Math.random() * Math.PI;
            debrisMesh.rotation.y = Math.random() * Math.PI;
            debrisMesh.rotation.z = Math.random() * Math.PI;
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x334444, 0.5);
        addLight(ambientLight);

        var alarmColors = [0xFF0000, 0xFF3333, 0xFF6666];
        for (var a = 0; a < 6; a++) {
            var alarmAngle = (a / 6) * Math.PI * 2;
            var alarmX = Math.cos(alarmAngle) * 22;
            var alarmZ = Math.sin(alarmAngle) * 22;
            var alarmLight = new THREE.PointLight(alarmColors[a % 3], 1.2, 40);
            alarmLight.position.set(alarmX, 20, alarmZ);
            addLight(alarmLight);
            alarmLights.push({
                light: alarmLight,
                baseX: alarmX,
                baseZ: alarmZ,
                angle: alarmAngle
            });
        }

        for (var i = 0; i < 4; i++) {
            var interiorLight = new THREE.PointLight(0xCCDDFF, 0.8, 25);
            var iAngle = (i / 4) * Math.PI * 2;
            interiorLight.position.set(Math.cos(iAngle) * 8, 8, Math.sin(iAngle) * 8);
            addLight(interiorLight);
            interiorLights.push({
                light: interiorLight,
                flickering: false,
                flickerTime: 0
            });
        }
    }

    function updateAlarmLights(delta) {
        for (var a = 0; a < alarmLights.length; a++) {
            var alarm = alarmLights[a];
            var rotationSpeed = 0.5 * delta;
            alarm.angle += rotationSpeed;
            alarm.light.position.x = Math.cos(alarm.angle) * 22;
            alarm.light.position.z = Math.sin(alarm.angle) * 22;
        }
    }

    function updateInteriorLights(delta) {
        for (var i = 0; i < interiorLights.length; i++) {
            var interior = interiorLights[i];
            interior.flickerTime += delta;

            if (interior.flickerTime > 0.15) {
                interior.flickering = !interior.flickering;
                interior.flickerTime = 0;
            }

            if (interior.flickering) {
                interior.light.intensity = 0.3;
            } else {
                interior.light.intensity = 0.8;
            }
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        alarmLights = [];
        interiorLights = [];
        flickerTimers = [];

        buildFoundation();
        buildDomeStructure();
        buildCrackLines();
        buildInteriorLabs();
        buildSiegePositions();
        buildDefenseWalls();
        buildAirlocks();
        buildDebrisField();
        setupLighting();
    }

    function update(delta) {
        if (scene !== null) {
            updateAlarmLights(delta);
            updateInteriorLights(delta);
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
        alarmLights = [];
        interiorLights = [];
        flickerTimers = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
