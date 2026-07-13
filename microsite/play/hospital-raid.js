window.HospitalRaid = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lightObjects = [];
    var animatingObjects = [];

    var init = function(_scene, _camera) {
        scene = _scene;
        camera = _camera;
        objects = [];
        lightObjects = [];
        animatingObjects = [];

        // Set background color
        scene.background = new THREE.Color(0xEEEEEE);
        scene.fog = new THREE.Fog(0xEEEEEE, 300, 500);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);

        // Add directional light
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(100, 150, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        scene.add(directionalLight);

        // Floor
        var floorGeometry = new THREE.BoxGeometry(300, 1, 300);
        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        scene.add(floor);
        objects.push(floor);

        // Ceiling
        var ceilingGeometry = new THREE.BoxGeometry(300, 1, 300);
        var ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceiling.position.y = 59.5;
        ceiling.receiveShadow = true;
        scene.add(ceiling);
        objects.push(ceiling);

        // Wall 1 - North
        var wall1Geometry = new THREE.BoxGeometry(300, 60, 1);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var wall1 = new THREE.Mesh(wall1Geometry, wallMaterial);
        wall1.position.z = -150;
        wall1.position.y = 30;
        wall1.receiveShadow = true;
        scene.add(wall1);
        objects.push(wall1);

        // Wall 2 - South
        var wall2Geometry = new THREE.BoxGeometry(300, 60, 1);
        var wall2 = new THREE.Mesh(wall2Geometry, wallMaterial);
        wall2.position.z = 150;
        wall2.position.y = 30;
        wall2.receiveShadow = true;
        scene.add(wall2);
        objects.push(wall2);

        // Wall 3 - East
        var wall3Geometry = new THREE.BoxGeometry(1, 60, 300);
        var wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
        wall3.position.x = 150;
        wall3.position.y = 30;
        wall3.receiveShadow = true;
        scene.add(wall3);
        objects.push(wall3);

        // Wall 4 - West
        var wall4Geometry = new THREE.BoxGeometry(1, 60, 300);
        var wall4 = new THREE.Mesh(wall4Geometry, wallMaterial);
        wall4.position.x = -150;
        wall4.position.y = 30;
        wall4.receiveShadow = true;
        scene.add(wall4);
        objects.push(wall4);

        // Operating Table 1
        createOperatingTable(0, 5, 0);

        // Operating Table 2
        createOperatingTable(50, 5, 0);

        // Operating Table 3
        createOperatingTable(-50, 5, 0);

        // Hospital Beds - Ward Area
        createHospitalBed(-80, 5, 80);
        createHospitalBed(-30, 5, 80);
        createHospitalBed(20, 5, 80);
        createHospitalBed(70, 5, 80);

        // IV Stands around beds
        createIVStand(-80, 5, 70);
        createIVStand(-30, 5, 70);
        createIVStand(20, 5, 70);
        createIVStand(70, 5, 70);

        // Pharmacy Shelves
        createPharmacyShelf(-100, 5, -80);
        createPharmacyShelf(-60, 5, -80);
        createPharmacyShelf(-20, 5, -80);

        // X-ray Viewers
        createXrayViewer(100, 5, 50);
        createXrayViewer(100, 5, 0);

        // Ambulances outside (visible through window)
        createAmbulance(90, 5, -100);

        // Rooftop Helipad
        createHelipad(0, 50, 0);

        // Emergency Generator
        createGenerator(80, 5, -80);
        createGenerator(-80, 5, -80);

        // Morgue Drawers (underground aesthetic)
        createMorgueDrawer(-120, 5, 50);
        createMorgueDrawer(-120, 5, 80);
        createMorgueDrawer(-120, 5, 110);

        // Vending Machines
        createVendingMachine(130, 5, 100);
        createVendingMachine(130, 5, 130);

        // Nurses Station
        createNursesStation(0, 5, -120);

        // Fluorescent ceiling lights
        createCeilingLights();

        // Heart monitor light (pulsing)
        createHeartMonitorLight(30, 55, 30);
    };

    var createOperatingTable = function(x, y, z) {
        // Table surface
        var tableGeometry = new THREE.BoxGeometry(8, 1, 4);
        var tableMaterial = new THREE.MeshLambertMaterial({ color: 0x00AA44 });
        var table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(x, y, z);
        table.castShadow = true;
        table.receiveShadow = true;
        scene.add(table);
        objects.push(table);

        // Operating light (spherical)
        var lightGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, emissive: 0xFFFFFF });
        var operatingLight = new THREE.Mesh(lightGeometry, lightMaterial);
        operatingLight.position.set(x, y + 8, z);
        operatingLight.castShadow = true;
        scene.add(operatingLight);
        objects.push(operatingLight);

        // Add point light for illumination
        var pointLight = new THREE.PointLight(0xFFFFFF, 1, 30);
        pointLight.position.set(x, y + 8, z);
        scene.add(pointLight);

        // Table legs
        createTableLeg(x - 3, y, z - 1.5);
        createTableLeg(x + 3, y, z - 1.5);
        createTableLeg(x - 3, y, z + 1.5);
        createTableLeg(x + 3, y, z + 1.5);
    };

    var createTableLeg = function(x, y, z) {
        var legGeometry = new THREE.BoxGeometry(0.3, 5, 0.3);
        var legMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(x, y + 2.5, z);
        leg.castShadow = true;
        leg.receiveShadow = true;
        scene.add(leg);
        objects.push(leg);
    };

    var createHospitalBed = function(x, y, z) {
        // Bed frame
        var bedGeometry = new THREE.BoxGeometry(3, 1.5, 6);
        var bedMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var bed = new THREE.Mesh(bedGeometry, bedMaterial);
        bed.position.set(x, y + 0.75, z);
        bed.castShadow = true;
        bed.receiveShadow = true;
        scene.add(bed);
        objects.push(bed);

        // Bed headboard
        var headGeometry = new THREE.BoxGeometry(3, 2, 0.3);
        var headMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var headboard = new THREE.Mesh(headGeometry, headMaterial);
        headboard.position.set(x, y + 3, z - 3);
        headboard.castShadow = true;
        scene.add(headboard);
        objects.push(headboard);

        // Bed legs
        createBedLeg(x - 1.2, y, z - 2.5);
        createBedLeg(x + 1.2, y, z - 2.5);
        createBedLeg(x - 1.2, y, z + 2.5);
        createBedLeg(x + 1.2, y, z + 2.5);
    };

    var createBedLeg = function(x, y, z) {
        var legGeometry = new THREE.BoxGeometry(0.2, 5, 0.2);
        var legMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(x, y + 2.5, z);
        leg.castShadow = true;
        leg.receiveShadow = true;
        scene.add(leg);
        objects.push(leg);
    };

    var createIVStand = function(x, y, z) {
        // Vertical pole
        var poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, y + 2.5, z);
        pole.castShadow = true;
        pole.receiveShadow = true;
        scene.add(pole);
        objects.push(pole);

        // Base
        var baseGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 8);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y + 0.25, z);
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        objects.push(base);

        // Bag hook (small cylinder at top)
        var hookGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        var hookMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var hook = new THREE.Mesh(hookGeometry, hookMaterial);
        hook.position.set(x, y + 5.5, z);
        hook.castShadow = true;
        scene.add(hook);
        objects.push(hook);
    };

    var createPharmacyShelf = function(x, y, z) {
        // Shelf frame
        var frameGeometry = new THREE.BoxGeometry(8, 7, 0.5);
        var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, y + 3.5, z);
        frame.castShadow = true;
        frame.receiveShadow = true;
        scene.add(frame);
        objects.push(frame);

        // Shelves (3 levels)
        var shelfGeometry = new THREE.BoxGeometry(8, 0.3, 0.5);
        var shelfMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var shelf1 = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf1.position.set(x, y + 2, z + 0.3);
        shelf1.castShadow = true;
        scene.add(shelf1);
        objects.push(shelf1);

        var shelf2 = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf2.position.set(x, y + 4, z + 0.3);
        shelf2.castShadow = true;
        scene.add(shelf2);
        objects.push(shelf2);

        var shelf3 = new THREE.Mesh(shelfGeometry, shelfMaterial);
        shelf3.position.set(x, y + 6, z + 0.3);
        shelf3.castShadow = true;
        scene.add(shelf3);
        objects.push(shelf3);

        // Medicine bottles
        for (var i = 0; i < 8; i++) {
            var bottleX = x - 3.5 + (i * 1);
            createMedicineBottle(bottleX, y + 2.2, z + 0.3);
            createMedicineBottle(bottleX, y + 4.2, z + 0.3);
            createMedicineBottle(bottleX, y + 6.2, z + 0.3);
        }
    };

    var createMedicineBottle = function(x, y, z) {
        var bottleGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 6);
        var bottleColor = [0xFF0000, 0x00AA44, 0x0000FF, 0xFFFF00][Math.floor(Math.random() * 4)];
        var bottleMaterial = new THREE.MeshLambertMaterial({ color: bottleColor });
        var bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
        bottle.position.set(x, y, z);
        bottle.castShadow = true;
        scene.add(bottle);
        objects.push(bottle);
    };

    var createXrayViewer = function(x, y, z) {
        // Frame
        var frameGeometry = new THREE.BoxGeometry(2, 3, 0.3);
        var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, y + 1.5, z);
        frame.castShadow = true;
        scene.add(frame);
        objects.push(frame);

        // X-ray film (glowing)
        var filmGeometry = new THREE.BoxGeometry(1.8, 2.8, 0.1);
        var filmMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x444444 });
        var film = new THREE.Mesh(filmGeometry, filmMaterial);
        film.position.set(x, y + 1.5, z + 0.2);
        film.castShadow = true;
        scene.add(film);
        objects.push(film);
        lightObjects.push(film);

        // Light behind viewer
        var viewerLight = new THREE.PointLight(0xAADD88, 1.5, 20);
        viewerLight.position.set(x, y + 1.5, z + 1);
        scene.add(viewerLight);
    };

    var createAmbulance = function(x, y, z) {
        // Body
        var bodyGeometry = new THREE.BoxGeometry(3, 3, 8);
        var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(x, y + 1.5, z);
        body.castShadow = true;
        body.receiveShadow = true;
        scene.add(body);
        objects.push(body);

        // Red cross on side
        createRedCross(x - 2, y + 2.5, z);
        createRedCross(x + 2, y + 2.5, z);

        // Roof
        var roofGeometry = new THREE.BoxGeometry(3, 1, 8);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, y + 4, z);
        roof.castShadow = true;
        scene.add(roof);
        objects.push(roof);

        // Wheels (cylinders)
        createWheel(x - 1.2, y + 0.5, z - 2.5);
        createWheel(x + 1.2, y + 0.5, z - 2.5);
        createWheel(x - 1.2, y + 0.5, z + 2.5);
        createWheel(x + 1.2, y + 0.5, z + 2.5);
    };

    var createRedCross = function(x, y, z) {
        // Horizontal bar
        var hbarGeometry = new THREE.BoxGeometry(1, 0.3, 0.2);
        var crossMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var hbar = new THREE.Mesh(hbarGeometry, crossMaterial);
        hbar.position.set(x, y, z);
        hbar.castShadow = true;
        scene.add(hbar);
        objects.push(hbar);

        // Vertical bar
        var vbarGeometry = new THREE.BoxGeometry(0.3, 1, 0.2);
        var vbar = new THREE.Mesh(vbarGeometry, crossMaterial);
        vbar.position.set(x, y, z);
        vbar.castShadow = true;
        scene.add(vbar);
        objects.push(vbar);
    };

    var createWheel = function(x, y, z) {
        var wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16);
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x, y, z);
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        scene.add(wheel);
        objects.push(wheel);

        // Hub cap
        var hubGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
        var hubMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.rotation.z = Math.PI / 2;
        hub.position.set(x, y, z);
        hub.castShadow = true;
        scene.add(hub);
        objects.push(hub);
    };

    var createHelipad = function(x, y, z) {
        // Helipad platform
        var platformGeometry = new THREE.CylinderGeometry(15, 15, 0.5, 32);
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(x, y, z);
        platform.castShadow = true;
        platform.receiveShadow = true;
        scene.add(platform);
        objects.push(platform);

        // H marking
        createHelipadMarking(x - 3, y + 0.3, z - 1, 2);
        createHelipadMarking(x + 3, y + 0.3, z - 1, 2);
        createHelipadMarking(x - 3, y + 0.3, z + 3, 2);
        createHelipadMarking(x + 3, y + 0.3, z + 3, 2);

        // Helicopter rotor (rotating)
        createHelicopterRotor(x, y + 3, z);

        // Rotor pole
        var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, y + 1.5, z);
        pole.castShadow = true;
        scene.add(pole);
        objects.push(pole);

        // Landing light
        var landingLight = new THREE.PointLight(0xFF4400, 2, 50);
        landingLight.position.set(x, y + 0.5, z);
        scene.add(landingLight);
    };

    var createHelipadMarking = function(x, y, z, size) {
        var markGeometry = new THREE.BoxGeometry(size, 0.05, size);
        var markMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var mark = new THREE.Mesh(markGeometry, markMaterial);
        mark.position.set(x, y, z);
        mark.castShadow = true;
        scene.add(mark);
        objects.push(mark);
    };

    var createHelicopterRotor = function(x, y, z) {
        // 4 rotor blades
        var bladeGeometry = new THREE.BoxGeometry(0.8, 0.15, 8);
        var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        for (var i = 0; i < 4; i++) {
            var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
            blade.position.set(x, y, z);
            blade.rotation.y = (i * Math.PI / 2);
            blade.castShadow = true;
            scene.add(blade);
            animatingObjects.push({
                object: blade,
                type: 'rotor',
                speed: 3
            });
        }

        // Rotor hub
        var hubGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        var hubMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.position.set(x, y, z);
        hub.castShadow = true;
        scene.add(hub);
        objects.push(hub);
    };

    var createGenerator = function(x, y, z) {
        // Large generator box
        var boxGeometry = new THREE.BoxGeometry(5, 4, 5);
        var boxMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(x, y + 2, z);
        box.castShadow = true;
        box.receiveShadow = true;
        scene.add(box);
        objects.push(box);
        animatingObjects.push({
            object: box,
            type: 'generator',
            speed: 0.1,
            originalPosition: new THREE.Vector3(x, y + 2, z)
        });

        // Control panel
        var panelGeometry = new THREE.BoxGeometry(2, 2, 0.3);
        var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(x + 2.5, y + 3, z);
        panel.castShadow = true;
        scene.add(panel);
        objects.push(panel);

        // Warning light
        var lightGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0xFF0000 });
        var warningLight = new THREE.Mesh(lightGeometry, lightMaterial);
        warningLight.position.set(x + 2.5, y + 4, z);
        warningLight.castShadow = true;
        scene.add(warningLight);
        objects.push(warningLight);
        lightObjects.push(warningLight);
        animatingObjects.push({
            object: warningLight,
            type: 'beacon',
            speed: 3
        });
    };

    var createMorgueDrawer = function(x, y, z) {
        // Main drawer
        var drawerGeometry = new THREE.BoxGeometry(4, 1.2, 2.5);
        var drawerMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var drawer = new THREE.Mesh(drawerGeometry, drawerMaterial);
        drawer.position.set(x, y + 0.6, z);
        drawer.castShadow = true;
        drawer.receiveShadow = true;
        scene.add(drawer);
        objects.push(drawer);

        // Handle
        var handleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 6);
        var handleMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(x + 1.5, y + 0.6, z);
        handle.castShadow = true;
        scene.add(handle);
        objects.push(handle);
    };

    var createVendingMachine = function(x, y, z) {
        // Machine body
        var bodyGeometry = new THREE.BoxGeometry(2, 4, 2);
        var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(x, y + 2, z);
        body.castShadow = true;
        body.receiveShadow = true;
        scene.add(body);
        objects.push(body);

        // Display window
        var windowGeometry = new THREE.BoxGeometry(1.8, 3, 0.2);
        var windowMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, emissive: 0x1a1a1a });
        var window_ = new THREE.Mesh(windowGeometry, windowMaterial);
        window_.position.set(x, y + 2, z + 1.1);
        window_.castShadow = true;
        scene.add(window_);
        objects.push(window_);
        lightObjects.push(window_);

        // Coin slot
        var slotGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.3);
        var slotMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var slot = new THREE.Mesh(slotGeometry, slotMaterial);
        slot.position.set(x - 0.8, y + 2, z + 1.1);
        slot.castShadow = true;
        scene.add(slot);
        objects.push(slot);
    };

    var createNursesStation = function(x, y, z) {
        // Desk surface
        var deskGeometry = new THREE.BoxGeometry(12, 1, 4);
        var deskMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(x, y + 1.5, z);
        desk.castShadow = true;
        desk.receiveShadow = true;
        scene.add(desk);
        objects.push(desk);

        // Desk legs
        createTableLeg(x - 5, y, z - 1.5);
        createTableLeg(x + 5, y, z - 1.5);
        createTableLeg(x - 5, y, z + 1.5);
        createTableLeg(x + 5, y, z + 1.5);

        // Computer monitor
        createMonitor(x - 4, y + 2.5, z);
        createMonitor(x, y + 2.5, z);
        createMonitor(x + 4, y + 2.5, z);

        // Overhead display board
        var boardGeometry = new THREE.BoxGeometry(10, 2, 0.3);
        var boardMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var board = new THREE.Mesh(boardGeometry, boardMaterial);
        board.position.set(x, y + 5, z);
        board.castShadow = true;
        scene.add(board);
        objects.push(board);
    };

    var createMonitor = function(x, y, z) {
        // Stand
        var standGeometry = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        var standMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var stand = new THREE.Mesh(standGeometry, standMaterial);
        stand.position.set(x, y - 0.75, z);
        stand.castShadow = true;
        scene.add(stand);
        objects.push(stand);

        // Screen
        var screenGeometry = new THREE.BoxGeometry(2, 1.5, 0.2);
        var screenMaterial = new THREE.MeshPhongMaterial({ color: 0x111111, emissive: 0x222222 });
        var screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(x, y, z);
        screen.castShadow = true;
        scene.add(screen);
        objects.push(screen);
        lightObjects.push(screen);
    };

    var createCeilingLights = function() {
        // 6 fluorescent ceiling lights that flicker
        var positions = [
            [-60, -60], [-60, 0], [-60, 60],
            [60, -60], [60, 0], [60, 60]
        ];

        for (var i = 0; i < positions.length; i++) {
            var lightX = positions[i][0];
            var lightZ = positions[i][1];

            // Light fixture
            var fixtureGeometry = new THREE.BoxGeometry(3, 0.2, 1);
            var fixtureMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
            var fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set(lightX, 58, lightZ);
            fixture.castShadow = true;
            scene.add(fixture);
            objects.push(fixture);

            // Glowing panel
            var panelGeometry = new THREE.BoxGeometry(2.8, 0.1, 0.8);
            var panelMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, emissive: 0xCCCCCC });
            var panel = new THREE.Mesh(panelGeometry, panelMaterial);
            panel.position.set(lightX, 57.9, lightZ);
            panel.castShadow = true;
            scene.add(panel);
            lightObjects.push(panel);
            animatingObjects.push({
                object: panel,
                type: 'fluorescent',
                speed: 2,
                intensity: 1
            });

            // Ceiling light
            var pointLight = new THREE.PointLight(0xFFFFFF, 1.5, 80);
            pointLight.position.set(lightX, 57, lightZ);
            scene.add(pointLight);
        }
    };

    var createHeartMonitorLight = function(x, y, z) {
        var lightGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        var lightMaterial = new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0xFF0000 });
        var heartLight = new THREE.Mesh(lightGeometry, lightMaterial);
        heartLight.position.set(x, y, z);
        heartLight.castShadow = true;
        scene.add(heartLight);
        lightObjects.push(heartLight);
        animatingObjects.push({
            object: heartLight,
            type: 'heartbeat',
            speed: 1.5,
            intensity: 1
        });
    };

    var update = function(delta) {
        // Update all animating objects
        for (var i = 0; i < animatingObjects.length; i++) {
            var anim = animatingObjects[i];

            if (anim.type === 'rotor') {
                // Rotate helicopter rotor
                anim.object.rotation.y += anim.speed * delta;
            } else if (anim.type === 'generator') {
                // Generator vibration
                var vibration = Math.sin(Date.now() * 0.01 * anim.speed) * 0.05;
                anim.object.position.x = anim.originalPosition.x + vibration;
                anim.object.position.z = anim.originalPosition.z + vibration;
            } else if (anim.type === 'beacon') {
                // Beacon flashing
                var intensity = Math.abs(Math.sin(Date.now() * 0.003 * anim.speed));
                anim.object.material.emissive.setHex(Math.round(0xFF0000 * intensity));
            } else if (anim.type === 'fluorescent') {
                // Fluorescent light flicker
                var flicker = 0.7 + Math.random() * 0.3;
                if (anim.object.material.emissive) {
                    var emissiveColor = new THREE.Color(0xFFFFFF);
                    emissiveColor.multiplyScalar(flicker);
                    anim.object.material.emissive = emissiveColor;
                }
            } else if (anim.type === 'heartbeat') {
                // Heart monitor pulsing
                var pulse = 0.3 + Math.sin(Date.now() * 0.005 * anim.speed) * 0.3 + 0.4;
                anim.object.material.emissive.setHex(Math.round(0xFF0000 * pulse));
                anim.object.scale.set(pulse, pulse, pulse);
            }
        }
    };

    var reset = function() {
        // Remove all objects from scene
        for (var i = objects.length - 1; i >= 0; i--) {
            scene.remove(objects[i]);
        }
        objects = [];
        lightObjects = [];
        animatingObjects = [];
    };

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
