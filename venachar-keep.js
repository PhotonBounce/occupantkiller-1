window.VenacharKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Highland Reservoir Box Dam Structure (main dam body)
        var damGeometry = new THREE.BoxGeometry(80, 15, 8);
        var damMaterial = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var dam = new THREE.Mesh(damGeometry, damMaterial);
        dam.position.set(0, -5, 0);
        scene.add(dam);
        objects.push(dam);

        // Dam Control Tower - Box tower
        var towerGeometry = new THREE.BoxGeometry(12, 25, 12);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(25, 8, 0);
        scene.add(tower);
        objects.push(tower);

        // Dam Control Tower - Sphere pressure gauge
        var gaugeGeometry = new THREE.SphereGeometry(3, 16, 16);
        var gaugeMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var gauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
        gauge.position.set(25, 28, 0);
        scene.add(gauge);
        objects.push(gauge);

        // Sabotage Prevention Bunker 1 (box emplacement along dam crest)
        var bunker1Geometry = new THREE.BoxGeometry(8, 6, 10);
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var bunker1 = new THREE.Mesh(bunker1Geometry, bunkerMaterial);
        bunker1.position.set(-20, 5, 8);
        scene.add(bunker1);
        objects.push(bunker1);

        // Sabotage Prevention Bunker 2 (box emplacement)
        var bunker2 = new THREE.Mesh(bunker1Geometry, bunkerMaterial);
        bunker2.position.set(-5, 5, -8);
        scene.add(bunker2);
        objects.push(bunker2);

        // Sabotage Prevention Bunker 3 (box emplacement)
        var bunker3 = new THREE.Mesh(bunker1Geometry, bunkerMaterial);
        bunker3.position.set(15, 5, 9);
        scene.add(bunker3);
        objects.push(bunker3);

        // Underwater Intake Valve Access - Cylinder shaft
        var shaftGeometry = new THREE.CylinderGeometry(4, 4, 18, 12);
        var shaftMaterial = new THREE.MeshLambertMaterial({ color: 0x336699 });
        var shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.set(-30, -8, 0);
        scene.add(shaft);
        objects.push(shaft);

        // Underwater Intake Valve Access - Box control room
        var intakeRoomGeometry = new THREE.BoxGeometry(10, 8, 10);
        var intakeRoomMaterial = new THREE.MeshLambertMaterial({ color: 0x556644 });
        var intakeRoom = new THREE.Mesh(intakeRoomGeometry, intakeRoomMaterial);
        intakeRoom.position.set(-30, 2, 0);
        scene.add(intakeRoom);
        objects.push(intakeRoom);

        // Drone Surveillance Nest - Box platform on dam parapet
        var dronePlatformGeometry = new THREE.BoxGeometry(14, 3, 14);
        var dronePlatformMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var dronePlatform = new THREE.Mesh(dronePlatformGeometry, dronePlatformMaterial);
        dronePlatform.position.set(0, 12, 0);
        scene.add(dronePlatform);
        objects.push(dronePlatform);

        // Drone Surveillance Nest - Cone drone
        var droneGeometry = new THREE.ConeGeometry(3, 5, 8);
        var droneMaterial = new THREE.MeshLambertMaterial({ color: 0x00cc00 });
        var drone = new THREE.Mesh(droneGeometry, droneMaterial);
        drone.position.set(0, 18, 0);
        scene.add(drone);
        objects.push(drone);

        // Emergency Power Pylon 1 - Cylinder pylon
        var pylon1Geometry = new THREE.CylinderGeometry(2, 2, 20, 8);
        var pylonMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var pylon1 = new THREE.Mesh(pylon1Geometry, pylonMaterial);
        pylon1.position.set(-25, 5, -20);
        scene.add(pylon1);
        objects.push(pylon1);

        // Emergency Power Pylon 2 - Cylinder pylon
        var pylon2 = new THREE.Mesh(pylon1Geometry, pylonMaterial);
        pylon2.position.set(25, 5, -20);
        scene.add(pylon2);
        objects.push(pylon2);

        // HV Cables between pylons - LineSegments
        var cableGeometry = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -25, 15, -20,
            25, 15, -20
        ]);
        cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMaterial = new THREE.LineBasicMaterial({ color: 0xffcc00, linewidth: 2 });
        var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
        scene.add(cable);
        objects.push(cable);

        // Warden Boat Dock - Box jetty
        var jettyGeometry = new THREE.BoxGeometry(16, 2, 8);
        var jettyMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var jetty = new THREE.Mesh(jettyGeometry, jettyMaterial);
        jetty.position.set(20, -10, 20);
        scene.add(jetty);
        objects.push(jetty);

        // Warden Boat Dock - Box patrol boat hull
        var boatGeometry = new THREE.BoxGeometry(12, 4, 6);
        var boatMaterial = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        var boat = new THREE.Mesh(boatGeometry, boatMaterial);
        boat.position.set(20, -6, 20);
        scene.add(boat);
        objects.push(boat);

        // Downstream Flood-Gate Warning Station 1 - Box hut
        var hutGeometry = new THREE.BoxGeometry(6, 5, 6);
        var hutMaterial = new THREE.MeshLambertMaterial({ color: 0x9966cc });
        var hut1 = new THREE.Mesh(hutGeometry, hutMaterial);
        hut1.position.set(-15, 0, -25);
        scene.add(hut1);
        objects.push(hut1);

        // Downstream Flood-Gate Warning Station 1 - Sphere warning light
        var warningGeometry = new THREE.SphereGeometry(2, 12, 12);
        var warningMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var warning1 = new THREE.Mesh(warningGeometry, warningMaterial);
        warning1.position.set(-15, 6, -25);
        scene.add(warning1);
        objects.push(warning1);

        // Downstream Flood-Gate Warning Station 2 - Box hut
        var hut2 = new THREE.Mesh(hutGeometry, hutMaterial);
        hut2.position.set(0, 0, -28);
        scene.add(hut2);
        objects.push(hut2);

        // Downstream Flood-Gate Warning Station 2 - Sphere warning light
        var warning2 = new THREE.Mesh(warningGeometry, warningMaterial);
        warning2.position.set(0, 6, -28);
        scene.add(warning2);
        objects.push(warning2);

        // Downstream Flood-Gate Warning Station 3 - Box hut
        var hut3 = new THREE.Mesh(hutGeometry, hutMaterial);
        hut3.position.set(18, 0, -26);
        scene.add(hut3);
        objects.push(hut3);

        // Downstream Flood-Gate Warning Station 3 - Sphere warning light
        var warning3 = new THREE.Mesh(warningGeometry, warningMaterial);
        warning3.position.set(18, 6, -26);
        scene.add(warning3);
        objects.push(warning3);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 25, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate drone rotation
        if (objects.length > 9) {
            objects[9].rotation.y += delta * 2;
        }
        // Animate warning lights pulse
        if (objects.length > 20) {
            var pulseValue = Math.sin(delta * 4) * 0.5 + 0.5;
            objects[19].material.color.setHSL(0, 1, pulseValue * 0.6);
            objects[21].material.color.setHSL(0, 1, pulseValue * 0.6);
            objects[23].material.color.setHSL(0, 1, pulseValue * 0.6);
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
