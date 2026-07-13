window.TortureChamber = (function() {
    'use strict';

    var sceneRef = null;
    var cameraRef = null;
    var objects = [];
    var lights = [];
    var animations = [];
    var hudVisible = false;
    var agentsRescued = 0;
    var evidenceDestroyed = 0;
    var facilityExposed = false;
    var lastT = 0;
    var tTimeout = null;

    // Keybind state for T+C (T then C within 400ms)
    var toggleComplete = function() {
        hudVisible = !hudVisible;
        updateHUD();
    };

    var handleKeyDown = function(e) {
        if (e.key === 't' || e.key === 'T') {
            lastT = Date.now();
            if (tTimeout) clearTimeout(tTimeout);
            tTimeout = setTimeout(function() { lastT = 0; }, 400);
        } else if ((e.key === 'c' || e.key === 'C') && lastT > 0 && (Date.now() - lastT) < 400) {
            lastT = 0;
            if (tTimeout) clearTimeout(tTimeout);
            toggleComplete();
        }
    };

    var createCellBlock = function(x, y, z) {
        var geometry = new THREE.BoxGeometry(6, 8, 6);
        var material = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        sceneRef.add(mesh);
        objects.push(mesh);

        // Narrow window
        var windowGeom = new THREE.BoxGeometry(0.5, 2, 0.5);
        var windowMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        var window1 = new THREE.Mesh(windowGeom, windowMat);
        window1.position.set(x - 3, y + 1, z + 3);
        sceneRef.add(window1);
        objects.push(window1);
    };

    var createDoor = function(x, y, z) {
        // Thick metal door
        var doorGeom = new THREE.BoxGeometry(3, 6, 0.3);
        var doorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.2 });
        var door = new THREE.Mesh(doorGeom, doorMat);
        door.position.set(x, y, z);
        door.castShadow = true;
        door.receiveShadow = true;
        sceneRef.add(door);
        objects.push(door);

        // Cylinder bar handle
        var handleGeom = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
        var handleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 });
        var handle = new THREE.Mesh(handleGeom, handleMat);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(x + 1.2, y, z - 0.2);
        sceneRef.add(handle);
        objects.push(handle);
    };

    var createInterrogationTable = function(x, y, z) {
        // Box table
        var tableGeom = new THREE.BoxGeometry(4, 1, 2);
        var tableMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
        var table = new THREE.Mesh(tableGeom, tableMat);
        table.position.set(x, y, z);
        table.castShadow = true;
        table.receiveShadow = true;
        sceneRef.add(table);
        objects.push(table);

        // Restraint straps as LineSegments
        var material = new THREE.LineBasicMaterial({ color: 0x8b4513 });
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -1.5, 0.6, 0, -1.5, 0.8, 0,
            1.5, 0.6, 0, 1.5, 0.8, 0,
            0, 0.6, -0.8, 0, 0.8, -0.8,
            0, 0.6, 0.8, 0, 0.8, 0.8
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var straps = new THREE.LineSegments(geometry, material);
        straps.position.set(x, y, z);
        sceneRef.add(straps);
        objects.push(straps);
    };

    var createInstrumentsPanel = function(x, y, z) {
        // Flat box with emissive controls
        var panelGeom = new THREE.BoxGeometry(4, 3, 0.3);
        var panelMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            emissive: 0x660000,
            emissiveIntensity: 0.3,
            roughness: 0.5
        });
        var panel = new THREE.Mesh(panelGeom, panelMat);
        panel.position.set(x, y, z);
        panel.castShadow = true;
        sceneRef.add(panel);
        objects.push(panel);

        // Small control buttons
        for (var i = 0; i < 6; i++) {
            var btnGeom = new THREE.BoxGeometry(0.3, 0.3, 0.1);
            var btnMat = new THREE.MeshStandardMaterial({ color: 0xaa0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
            var btn = new THREE.Mesh(btnGeom, btnMat);
            btn.position.set(x - 1.5 + (i % 3) * 1.5, y + 0.5 - Math.floor(i / 3) * 1, z - 0.2);
            sceneRef.add(btn);
            objects.push(btn);
        }
    };

    var createOverheadLamp = function(x, y, z) {
        // Cylinder shade
        var shadeGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
        var shadeMat = new THREE.MeshStandardMaterial({ color: 0x664400, roughness: 0.7 });
        var shade = new THREE.Mesh(shadeGeom, shadeMat);
        shade.position.set(x, y, z);
        shade.castShadow = true;
        sceneRef.add(shade);
        objects.push(shade);

        // Bright point light
        var light = new THREE.PointLight(0xffaa00, 2, 30);
        light.position.set(x, y - 0.8, z);
        light.castShadow = true;
        sceneRef.add(light);
        lights.push(light);

        // Store for animation
        animations.push({
            type: 'lamp',
            mesh: shade,
            baseY: y,
            baseRotation: shade.rotation.z
        });
    };

    var createFloorDrain = function(x, y, z) {
        // Flat box drain
        var drainGeom = new THREE.BoxGeometry(1, 0.2, 1);
        var drainMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        var drain = new THREE.Mesh(drainGeom, drainMat);
        drain.position.set(x, y, z);
        drain.receiveShadow = true;
        sceneRef.add(drain);
        objects.push(drain);

        // LineSegments grate
        var material = new THREE.LineBasicMaterial({ color: 0x444444 });
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -0.4, 0.15, -0.4, 0.4, 0.15, -0.4,
            -0.4, 0.15, 0.4, 0.4, 0.15, 0.4,
            -0.4, 0.15, -0.2, 0.4, 0.15, -0.2,
            -0.4, 0.15, 0, 0.4, 0.15, 0,
            -0.4, 0.15, 0.2, 0.4, 0.15, 0.2,
            -0.2, 0.15, -0.4, -0.2, 0.15, 0.4,
            0, 0.15, -0.4, 0, 0.15, 0.4,
            0.2, 0.15, -0.4, 0.2, 0.15, 0.4
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var grate = new THREE.LineSegments(geometry, material);
        grate.position.set(x, y, z);
        sceneRef.add(grate);
        objects.push(grate);
    };

    var createGuardStation = function(x, y, z) {
        // Box desk
        var deskGeom = new THREE.BoxGeometry(4, 1, 2);
        var deskMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
        var desk = new THREE.Mesh(deskGeom, deskMat);
        desk.position.set(x, y, z);
        desk.castShadow = true;
        desk.receiveShadow = true;
        sceneRef.add(desk);
        objects.push(desk);

        // Chair (cylinder)
        var chairGeom = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8);
        var chairMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        var chair = new THREE.Mesh(chairGeom, chairMat);
        chair.position.set(x + 1.5, y + 0.75, z);
        chair.castShadow = true;
        sceneRef.add(chair);
        objects.push(chair);
    };

    var createCCTVCamera = function(x, y, z) {
        // Cylinder camera body
        var bodyGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
        var bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 });
        var body = new THREE.Mesh(bodyGeom, bodyMat);
        body.rotation.z = Math.PI / 4;
        body.position.set(x, y, z);
        body.castShadow = true;
        sceneRef.add(body);
        objects.push(body);

        // Camera lens (sphere)
        var lensGeom = new THREE.SphereGeometry(0.15, 8, 8);
        var lensMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 1, roughness: 0 });
        var lens = new THREE.Mesh(lensGeom, lensMat);
        lens.position.set(x + 0.4, y, z);
        sceneRef.add(lens);
        objects.push(lens);

        // Store for animation
        animations.push({
            type: 'camera',
            mesh: body,
            baseRotation: body.rotation.z
        });
    };

    var createSoundDampeningPanels = function(x, y, z) {
        for (var i = 0; i < 4; i++) {
            var panelGeom = new THREE.BoxGeometry(2, 3, 0.2);
            var panelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
            var panel = new THREE.Mesh(panelGeom, panelMat);
            panel.position.set(x + (i - 1.5) * 2.5, y, z);
            panel.castShadow = true;
            sceneRef.add(panel);
            objects.push(panel);
        }
    };

    var createEvidenceBoxes = function(x, y, z) {
        for (var i = 0; i < 8; i++) {
            var boxGeom = new THREE.BoxGeometry(1, 1, 1);
            var boxMat = new THREE.MeshStandardMaterial({ color: 0x4a4a3a, roughness: 0.8 });
            var box = new THREE.Mesh(boxGeom, boxMat);
            box.position.set(x - 1.5 + (i % 4) * 1.2, y + 0.5 + Math.floor(i / 4) * 1.2, z);
            box.castShadow = true;
            box.receiveShadow = true;
            sceneRef.add(box);
            objects.push(box);
        }
    };

    var createServerRack = function(x, y, z) {
        // Tall box rack
        var rackGeom = new THREE.BoxGeometry(2, 6, 1.5);
        var rackMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.6,
            roughness: 0.3
        });
        var rack = new THREE.Mesh(rackGeom, rackMat);
        rack.position.set(x, y, z);
        rack.castShadow = true;
        rack.receiveShadow = true;
        sceneRef.add(rack);
        objects.push(rack);

        // Emissive blinking lights
        for (var i = 0; i < 10; i++) {
            var lightGeom = new THREE.BoxGeometry(0.15, 0.15, 0.1);
            var lightMat = new THREE.MeshStandardMaterial({
                color: 0x000000,
                emissive: i % 2 === 0 ? 0x00ff00 : 0xff0000,
                emissiveIntensity: 0.8
            });
            var light = new THREE.Mesh(lightGeom, lightMat);
            light.position.set(x - 0.7, y - 2 + i * 0.4, z + 0.8);
            sceneRef.add(light);
            objects.push(light);

            animations.push({
                type: 'led',
                mesh: light,
                originalEmissive: i % 2 === 0 ? 0x00ff00 : 0xff0000,
                index: i
            });
        }
    };

    var createPanicButton = function(x, y, z) {
        // Cylinder button
        var btnGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        var btnMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.4
        });
        var btn = new THREE.Mesh(btnGeom, btnMat);
        btn.position.set(x, y, z);
        btn.castShadow = true;
        sceneRef.add(btn);
        objects.push(btn);
    };

    var createBucketAndMop = function(x, y, z) {
        // Cylinder bucket
        var bucketGeom = new THREE.CylinderGeometry(0.5, 0.6, 1, 8);
        var bucketMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
        var bucket = new THREE.Mesh(bucketGeom, bucketMat);
        bucket.position.set(x, y, z);
        bucket.castShadow = true;
        bucket.receiveShadow = true;
        sceneRef.add(bucket);
        objects.push(bucket);

        // Mop handle (cylinder)
        var handleGeom = new THREE.CylinderGeometry(0.05, 0.05, 2, 4);
        var handleMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47 });
        var handle = new THREE.Mesh(handleGeom, handleMat);
        handle.position.set(x + 0.8, y + 1.2, z + 0.3);
        handle.rotation.z = 0.3;
        sceneRef.add(handle);
        objects.push(handle);
    };

    var createCaptivePrisoner = function(x, y, z) {
        // Box figure body
        var bodyGeom = new THREE.BoxGeometry(0.8, 2, 0.5);
        var bodyMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a });
        var body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.set(x, y + 1.5, z);
        body.castShadow = true;
        sceneRef.add(body);
        objects.push(body);

        // Head (sphere)
        var headGeom = new THREE.SphereGeometry(0.35, 8, 8);
        var headMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
        var head = new THREE.Mesh(headGeom, headMat);
        head.position.set(x, y + 2.7, z);
        head.castShadow = true;
        sceneRef.add(head);
        objects.push(head);

        // Restraint straps
        var material = new THREE.LineBasicMaterial({ color: 0x333333 });
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -0.4, 1.5, 0, 0.4, 1.5, 0,
            -0.4, 2.5, 0, 0.4, 2.5, 0
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var straps = new THREE.LineSegments(geometry, material);
        straps.position.set(x, y, z);
        sceneRef.add(straps);
        objects.push(straps);
    };

    var createEmergencyExitSign = function(x, y, z) {
        // Small emissive box
        var signGeom = new THREE.BoxGeometry(1.5, 0.6, 0.3);
        var signMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0x00ff00,
            emissiveIntensity: 0.6
        });
        var sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(x, y, z);
        sign.castShadow = true;
        sceneRef.add(sign);
        objects.push(sign);

        // Add blinking animation
        animations.push({
            type: 'exit_sign',
            mesh: sign,
            originalEmissive: 0x00ff00
        });
    };

    var createEnemies = function() {
        // Interrogator in suit (box figure)
        var interrogatorGeom = new THREE.BoxGeometry(0.7, 2, 0.5);
        var interrogatorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        var interrogator = new THREE.Mesh(interrogatorGeom, interrogatorMat);
        interrogator.position.set(10, 1, -5);
        interrogator.castShadow = true;
        sceneRef.add(interrogator);
        objects.push(interrogator);

        // Guard in tactical gear (box figure)
        var guardGeom = new THREE.BoxGeometry(0.8, 2.2, 0.6);
        var guardMat = new THREE.MeshStandardMaterial({ color: 0x2a2a3a });
        var guard = new THREE.Mesh(guardGeom, guardMat);
        guard.position.set(-8, 1.1, 10);
        guard.castShadow = true;
        sceneRef.add(guard);
        objects.push(guard);

        // Site commander (larger figure)
        var commanderGeom = new THREE.BoxGeometry(0.9, 2.3, 0.6);
        var commanderMat = new THREE.MeshStandardMaterial({ color: 0x3a3a2a });
        var commander = new THREE.Mesh(commanderGeom, commanderMat);
        commander.position.set(0, 1.15, -15);
        commander.castShadow = true;
        sceneRef.add(commander);
        objects.push(commander);
    };

    var updateHUD = function() {
        var msg = 'HUD ' + (hudVisible ? 'ENABLED' : 'DISABLED');
        console.log(msg);
    };

    var init = function(scene, camera) {
        sceneRef = scene;
        cameraRef = camera;

        // Dark oppressive atmosphere
        scene.fog = new THREE.Fog(0x0a0a0a, 0.1, 50);
        scene.background = new THREE.Color(0x0a0a0a);

        // Dim ambient light
        var ambientLight = new THREE.AmbientLight(0x333333, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Create facility
        createCellBlock(0, 4, -15);
        createCellBlock(12, 4, -15);
        createCellBlock(-12, 4, -15);

        createDoor(0, 4, -8);
        createDoor(12, 4, 5);
        createDoor(-12, 4, 5);

        createInterrogationTable(0, 0.5, 0);
        createInstrumentsPanel(6, 5, 0);
        createOverheadLamp(0, 6, 0);

        createFloorDrain(-5, 0.1, 0);
        createGuardStation(8, 0.5, 8);
        createCCTVCamera(6, 7, -10);
        createSoundDampeningPanels(0, 4, -25);

        createEvidenceBoxes(-15, 0.5, 10);
        createServerRack(15, 3, 10);

        createPanicButton(-20, 5, 0);
        createBucketAndMop(-8, 0.5, 8);
        createCaptivePrisoner(0, 0, 5);
        createEmergencyExitSign(-25, 7, 0);

        createEnemies();

        // Register keybind handler
        document.addEventListener('keydown', handleKeyDown);
    };

    var update = function(delta) {
        // Animate overhead lamp swing
        for (var i = 0; i < animations.length; i++) {
            var anim = animations[i];
            if (anim.type === 'lamp') {
                anim.mesh.rotation.z = anim.baseRotation + Math.sin(Date.now() * 0.001) * 0.15;
            } else if (anim.type === 'camera') {
                anim.mesh.rotation.y = Math.sin(Date.now() * 0.0005) * 0.8;
            } else if (anim.type === 'led') {
                var blink = Math.floor((Date.now() * 0.003) % 2) === 0;
                anim.mesh.material.emissive.setHex(blink ? anim.originalEmissive : 0x000000);
            } else if (anim.type === 'exit_sign') {
                var blink2 = Math.floor((Date.now() * 0.002) % 2) === 0;
                anim.mesh.material.emissive.setHex(blink2 ? anim.originalEmissive : 0x000000);
            }
        }
    };

    var reset = function() {
        // Remove all objects
        for (var i = 0; i < objects.length; i++) {
            sceneRef.remove(objects[i]);
        }
        objects = [];

        // Remove all lights
        for (var i = 0; i < lights.length; i++) {
            sceneRef.remove(lights[i]);
        }
        lights = [];

        // Clear animations
        animations = [];

        // Reset state
        agentsRescued = 0;
        evidenceDestroyed = 0;
        facilityExposed = false;
        hudVisible = false;
        lastT = 0;

        // Clean up event listener
        document.removeEventListener('keydown', handleKeyDown);
    };

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
