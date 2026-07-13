window.KerreraBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        // Gylen Castle - ruined tower on cliff
        var castleTowerGeom = new THREE.BoxGeometry(8, 12, 8);
        var castleTowerMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var castleTower = new THREE.Mesh(castleTowerGeom, castleTowerMat);
        castleTower.position.set(-25, 6, -25);
        scene.add(castleTower);
        objects.push(castleTower);

        // Gylen Castle - outer wall segment 1
        var wallGeom = new THREE.BoxGeometry(15, 4, 1);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x7A6344 });
        var wall1 = new THREE.Mesh(wallGeom, wallMat);
        wall1.position.set(-20, 2, -32);
        scene.add(wall1);
        objects.push(wall1);

        // Gylen Castle - outer wall segment 2
        var wall2 = new THREE.Mesh(wallGeom, wallMat);
        wall2.position.set(-30, 2, -15);
        wall2.rotation.y = Math.PI / 2;
        scene.add(wall2);
        objects.push(wall2);

        // Gylen Castle - collapsed turret cone
        var turretGeom = new THREE.ConeGeometry(3, 6, 8);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var turret = new THREE.Mesh(turretGeom, turretMat);
        turret.position.set(-25, 12, -25);
        turret.rotation.x = 0.3;
        scene.add(turret);
        objects.push(turret);

        // Oban Ferry Terminal - terminal building
        var terminalGeom = new THREE.BoxGeometry(12, 5, 10);
        var terminalMat = new THREE.MeshLambertMaterial({ color: 0x4A90E2 });
        var terminal = new THREE.Mesh(terminalGeom, terminalMat);
        terminal.position.set(20, 2.5, -20);
        scene.add(terminal);
        objects.push(terminal);

        // Oban Ferry Terminal - RoRo ramp
        var rampGeom = new THREE.BoxGeometry(10, 1, 8);
        var rampMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var ramp = new THREE.Mesh(rampGeom, rampMat);
        ramp.position.set(25, 1.5, -10);
        ramp.rotation.z = 0.2;
        scene.add(ramp);
        objects.push(ramp);

        // Oban Ferry Terminal - dock crane cylinder
        var craneGeom = new THREE.CylinderGeometry(1, 1.2, 15, 8);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var crane = new THREE.Mesh(craneGeom, craneMat);
        crane.position.set(18, 7.5, -25);
        scene.add(crane);
        objects.push(crane);

        // Hutcheson's Monument - pillar cylinder
        var pillarGeom = new THREE.CylinderGeometry(1.5, 1.8, 10, 12);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
        var pillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillar.position.set(-5, 5, 20);
        scene.add(pillar);
        objects.push(pillar);

        // Hutcheson's Monument - plinth
        var plinthGeom = new THREE.BoxGeometry(4, 1.5, 4);
        var plinthMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var plinth = new THREE.Mesh(plinthGeom, plinthMat);
        plinth.position.set(-5, 0.75, 20);
        scene.add(plinth);
        objects.push(plinth);

        // Hutcheson's Monument - signal lamp sphere
        var lampGeom = new THREE.SphereGeometry(1, 12, 12);
        var lampMat = new THREE.MeshLambertMaterial({ color: 0xFFFACD });
        var lamp = new THREE.Mesh(lampGeom, lampMat);
        lamp.position.set(-5, 11, 20);
        scene.add(lamp);
        objects.push(lamp);

        // Horse Shoe Bay - camouflaged depot
        var depotGeom = new THREE.BoxGeometry(10, 3, 8);
        var depotMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var depot = new THREE.Mesh(depotGeom, depotMat);
        depot.position.set(15, 1.5, 18);
        scene.add(depot);
        objects.push(depot);

        // Horse Shoe Bay - fuel tank cylinder
        var tankGeom = new THREE.CylinderGeometry(2, 2, 6, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(10, 3, 25);
        scene.add(tank);
        objects.push(tank);

        // Horse Shoe Bay - supply boats (small boxes)
        var boatGeom = new THREE.BoxGeometry(3, 2, 5);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0xCD5C5C });
        var boat1 = new THREE.Mesh(boatGeom, boatMat);
        boat1.position.set(22, 1, 20);
        scene.add(boat1);
        objects.push(boat1);

        var boat2 = new THREE.Mesh(boatGeom, boatMat);
        boat2.position.set(26, 1, 28);
        scene.add(boat2);
        objects.push(boat2);

        // Ardantrive Bay - concrete quay
        var quayGeom = new THREE.BoxGeometry(20, 1, 3);
        var quayMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var quay = new THREE.Mesh(quayGeom, quayMat);
        quay.position.set(-10, 0.5, -5);
        scene.add(quay);
        objects.push(quay);

        // Ardantrive Bay - submarine conning tower cylinder
        var subGeom = new THREE.CylinderGeometry(1.2, 1.2, 4, 12);
        var subMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var sub = new THREE.Mesh(subGeom, subMat);
        sub.position.set(-15, 2, 0);
        scene.add(sub);
        objects.push(sub);

        // Ardantrive Bay - sensor buoy sphere
        var buoyGeom = new THREE.SphereGeometry(0.8, 10, 10);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(-5, 1, 8);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(0, 1, 5);
        scene.add(buoy2);
        objects.push(buoy2);

        // Hilltop Helipad - flat pad
        var helipadGeom = new THREE.BoxGeometry(12, 0.2, 12);
        var helipadMat = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
        var helipad = new THREE.Mesh(helipadGeom, helipadMat);
        helipad.position.set(-30, 8, 10);
        scene.add(helipad);
        objects.push(helipad);

        // Hilltop Helipad - H marking with LineSegments
        var hPoints = [
            new THREE.Vector3(-36, 8.1, 10),
            new THREE.Vector3(-36, 8.1, 4),
            new THREE.Vector3(-36, 8.1, 10),
            new THREE.Vector3(-30, 8.1, 10),
            new THREE.Vector3(-30, 8.1, 4),
            new THREE.Vector3(-30, 8.1, 10)
        ];
        var hGeom = new THREE.BufferGeometry().setFromPoints(hPoints);
        var hMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });
        var hMarking = new THREE.LineSegments(hGeom, hMat);
        scene.add(hMarking);
        objects.push(hMarking);

        // Hilltop Helipad - windsock cone
        var windsockGeom = new THREE.ConeGeometry(1, 4, 8);
        var windsockMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var windsock = new THREE.Mesh(windsockGeom, windsockMat);
        windsock.position.set(-24, 10, 10);
        windsock.rotation.z = Math.PI / 2;
        scene.add(windsock);
        objects.push(windsock);

        // Barr-nam-Boc Cliff - cliff face box
        var cliffGeom = new THREE.BoxGeometry(15, 10, 1);
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var cliff = new THREE.Mesh(cliffGeom, cliffMat);
        cliff.position.set(5, 5, -30);
        scene.add(cliff);
        objects.push(cliff);

        // Barr-nam-Boc Cliff - explosive sphere
        var explosiveGeom = new THREE.SphereGeometry(1.2, 12, 12);
        var explosiveMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var explosive = new THREE.Mesh(explosiveGeom, explosiveMat);
        explosive.position.set(5, 8, -29);
        scene.add(explosive);
        objects.push(explosive);

        // Barr-nam-Boc Cliff - command wire LineSegments
        var wirePoints = [
            new THREE.Vector3(-5, 8, -29),
            new THREE.Vector3(5, 8, -29),
            new THREE.Vector3(5, 8, -29),
            new THREE.Vector3(15, 8, -29)
        ];
        var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate windsock rotation
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].position && objects[i].position.y > 9 && objects[i].position.y < 11) {
                    if (objects[i].geometry instanceof THREE.ConeGeometry) {
                        objects[i].rotation.x += delta * 0.5;
                    }
                }
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

    return { init: init, update: update, reset: reset };
}());
