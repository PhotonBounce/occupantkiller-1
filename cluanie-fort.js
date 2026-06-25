window.CluanieFort = (function() {
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
        var materialGray = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var materialDarkGray = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var materialConcrete = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var materialRed = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
        var materialYellow = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
        var materialBlue = new THREE.MeshLambertMaterial({ color: 0x0066FF });
        var materialGreen = new THREE.MeshLambertMaterial({ color: 0x00AA00 });

        // Main dam wall - tall concrete box structure
        var damWallGeom = new THREE.BoxGeometry(40, 30, 8);
        var damWall = new THREE.Mesh(damWallGeom, materialConcrete);
        damWall.position.set(0, 15, -20);
        scene.add(damWall);
        objects.push(damWall);

        // Dam buttresses - left
        var buttressLeftGeom = new THREE.BoxGeometry(6, 25, 10);
        var buttressLeft = new THREE.Mesh(buttressLeftGeom, materialGray);
        buttressLeft.position.set(-18, 12, -25);
        scene.add(buttressLeft);
        objects.push(buttressLeft);

        // Dam buttresses - right
        var buttressRightGeom = new THREE.BoxGeometry(6, 25, 10);
        var buttressRight = new THREE.Mesh(buttressRightGeom, materialGray);
        buttressRight.position.set(18, 12, -25);
        scene.add(buttressRight);
        objects.push(buttressRight);

        // Dam road checkpoint gatehouse
        var gatehouseGeom = new THREE.BoxGeometry(12, 8, 10);
        var gatehouse = new THREE.Mesh(gatehouseGeom, materialDarkGray);
        gatehouse.position.set(0, 4, 5);
        scene.add(gatehouse);
        objects.push(gatehouse);

        // Checkpoint bollard - left
        var bollardLeftGeom = new THREE.CylinderGeometry(1.2, 1.2, 4, 8);
        var bollardLeft = new THREE.Mesh(bollardLeftGeom, materialRed);
        bollardLeft.position.set(-8, 2, 10);
        scene.add(bollardLeft);
        objects.push(bollardLeft);

        // Checkpoint bollard - right
        var bollardRightGeom = new THREE.CylinderGeometry(1.2, 1.2, 4, 8);
        var bollardRight = new THREE.Mesh(bollardRightGeom, materialRed);
        bollardRight.position.set(8, 2, 10);
        scene.add(bollardRight);
        objects.push(bollardRight);

        // Turbine hall strongpoint main building
        var turbineHallGeom = new THREE.BoxGeometry(16, 12, 18);
        var turbineHall = new THREE.Mesh(turbineHallGeom, materialGray);
        turbineHall.position.set(-25, 6, 15);
        scene.add(turbineHall);
        objects.push(turbineHall);

        // Turbine 1
        var turbine1Geom = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
        var turbine1 = new THREE.Mesh(turbine1Geom, materialBlue);
        turbine1.position.set(-28, 6, 8);
        scene.add(turbine1);
        objects.push(turbine1);

        // Turbine 2
        var turbine2Geom = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
        var turbine2 = new THREE.Mesh(turbine2Geom, materialBlue);
        turbine2.position.set(-22, 6, 8);
        scene.add(turbine2);
        objects.push(turbine2);

        // Control room box structure
        var controlRoomGeom = new THREE.BoxGeometry(10, 8, 8);
        var controlRoom = new THREE.Mesh(controlRoomGeom, materialDarkGray);
        controlRoom.position.set(20, 4, 0);
        scene.add(controlRoom);
        objects.push(controlRoom);

        // Control room instrument panel sphere 1
        var panelSphere1Geom = new THREE.SphereGeometry(1.5, 8, 8);
        var panelSphere1 = new THREE.Mesh(panelSphere1Geom, materialYellow);
        panelSphere1.position.set(17, 5, 0);
        scene.add(panelSphere1);
        objects.push(panelSphere1);

        // Control room instrument panel sphere 2
        var panelSphere2Geom = new THREE.SphereGeometry(1.5, 8, 8);
        var panelSphere2 = new THREE.Mesh(panelSphere2Geom, materialYellow);
        panelSphere2.position.set(23, 5, 0);
        scene.add(panelSphere2);
        objects.push(panelSphere2);

        // High-voltage pylon 1
        var pylon1Geom = new THREE.CylinderGeometry(1.5, 1.8, 20, 6);
        var pylon1 = new THREE.Mesh(pylon1Geom, materialGreen);
        pylon1.position.set(-30, 10, 25);
        scene.add(pylon1);
        objects.push(pylon1);

        // High-voltage pylon 2
        var pylon2Geom = new THREE.CylinderGeometry(1.5, 1.8, 20, 6);
        var pylon2 = new THREE.Mesh(pylon2Geom, materialGreen);
        pylon2.position.set(30, 10, 25);
        scene.add(pylon2);
        objects.push(pylon2);

        // Power lines - LineSegments from pylon1 to pylon2
        var lineGeom = new THREE.BufferGeometry();
        var linePositions = new Float32Array([
            -30, 20, 25,
            30, 20, 25
        ]);
        lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        var lineMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var powerLine1 = new THREE.LineSegments(lineGeom, lineMat);
        scene.add(powerLine1);
        objects.push(powerLine1);

        // Cliff guard post box on dam wall edge
        var guardPostGeom = new THREE.BoxGeometry(6, 6, 6);
        var guardPost = new THREE.Mesh(guardPostGeom, materialDarkGray);
        guardPost.position.set(-15, 25, -18);
        scene.add(guardPost);
        objects.push(guardPost);

        // Saboteur explosive charge 1 - box
        var explosiveGeom1 = new THREE.BoxGeometry(3, 3, 3);
        var explosive1 = new THREE.Mesh(explosiveGeom1, materialRed);
        explosive1.position.set(-8, 18, -20);
        scene.add(explosive1);
        objects.push(explosive1);

        // Saboteur explosive charge 2 - box
        var explosiveGeom2 = new THREE.BoxGeometry(3, 3, 3);
        var explosive2 = new THREE.Mesh(explosiveGeom2, materialRed);
        explosive2.position.set(8, 18, -20);
        scene.add(explosive2);
        objects.push(explosive2);

        // Detonator wires - LineSegments between explosives and control point
        var detLineGeom = new THREE.BufferGeometry();
        var detLinePositions = new Float32Array([
            -8, 18, -20,
            0, 12, -15,
            8, 18, -20,
            0, 12, -15
        ]);
        detLineGeom.setAttribute('position', new THREE.BufferAttribute(detLinePositions, 3));
        var detLineMat = new THREE.LineBasicMaterial({ color: 0xFF6600 });
        var detLines = new THREE.LineSegments(detLineGeom, detLineMat);
        scene.add(detLines);
        objects.push(detLines);

        // Loch water features - cone shaped water intakes
        var intakeGeom = new THREE.ConeGeometry(2, 5, 8);
        var intake = new THREE.Mesh(intakeGeom, materialBlue);
        intake.position.set(-20, -5, -20);
        scene.add(intake);
        objects.push(intake);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.1;
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
