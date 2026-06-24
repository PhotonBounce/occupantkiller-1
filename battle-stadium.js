window.BattleStadium = (function() {
    'use strict';

    var sceneObjects = [];
    var camera;
    var scene;
    var state = {
        captivesFreed: 0,
        guardsDown: 0,
        warlordEliminated: false,
        elapsedTime: 0,
        lastBKeyPress: -1000,
        keybindActive: false,
        hudNotification: '',
        hudNotificationTime: 0
    };

    function init(inputScene, inputCamera) {
        scene = inputScene;
        camera = inputCamera;

        // Set up lighting
        var ambientLight = new THREE.AmbientLight(0x333333);
        scene.add(ambientLight);
        sceneObjects.push(ambientLight);

        // Dark evening sky
        var skyColor = new THREE.Color(0x0a0a1a);
        scene.background = skyColor;

        // Create stadium structure
        createStadiumBowl();
        createPlayingField();
        createScoreboard();
        createFloodlights();
        createVIPBox();
        createPlayerTunnel();
        createPenaltyArc();
        createGoalPosts();
        createPerimeterBarrier();
        createMedicalStation();
        createAnnouncerBooth();
        createCageRingOnField();
        createCrowdSilhouettes();
        createCorporateBanner();
        createScoreboardTicker();

        // Set up keybind listener
        document.addEventListener('keydown', handleKeyDown);

        return {
            captivesFreed: 0,
            guardsDown: 0,
            warlordEliminated: false
        };
    }

    function handleKeyDown(event) {
        if (event.key === 'b' || event.key === 'B') {
            var now = Date.now();
            if (now - state.lastBKeyPress < 400) {
                // B pressed twice, check for next S press
            }
            state.lastBKeyPress = now;
        }
        if (event.key === 's' || event.key === 'S') {
            var now = Date.now();
            if (now - state.lastBKeyPress < 400) {
                // B+S within 400ms
                state.keybindActive = !state.keybindActive;
                state.hudNotification = state.keybindActive ? 'HUD ENABLED' : 'HUD DISABLED';
                state.hudNotificationTime = 3;
                state.lastBKeyPress = -1000;
            }
        }
    }

    function createStadiumBowl() {
        // Massive circular ring of tiered seating boxes
        var levels = 6;
        var boxesPerLevel = 24;
        var baseRadius = 80;

        for (var level = 0; level < levels; level++) {
            var radius = baseRadius + (level * 8);
            var height = 6 + (level * 2);
            var yPos = level * 10;

            for (var i = 0; i < boxesPerLevel; i++) {
                var angle = (i / boxesPerLevel) * Math.PI * 2;
                var xPos = Math.cos(angle) * radius;
                var zPos = Math.sin(angle) * radius;

                var geometry = new THREE.BoxGeometry(12, height, 8);
                var material = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
                var box = new THREE.Mesh(geometry, material);
                box.position.set(xPos, yPos, zPos);
                box.castShadow = true;
                box.receiveShadow = true;
                scene.add(box);
                sceneObjects.push(box);
            }
        }
    }

    function createPlayingField() {
        // Flat box ground - the main field
        var geometry = new THREE.BoxGeometry(120, 1, 80);
        var material = new THREE.MeshStandardMaterial({ color: 0x1a4d1a });
        var field = new THREE.Mesh(geometry, material);
        field.position.y = -0.5;
        field.castShadow = true;
        field.receiveShadow = true;
        scene.add(field);
        sceneObjects.push(field);
    }

    function createScoreboard() {
        // Large flat box with emissive display
        var geometry = new THREE.BoxGeometry(60, 20, 2);
        var material = new THREE.MeshStandardMaterial({
            color: 0x222222,
            emissive: 0x00ff00,
            emissiveIntensity: 0.3
        });
        var scoreboard = new THREE.Mesh(geometry, material);
        scoreboard.position.set(0, 50, -70);
        scoreboard.castShadow = true;
        scoreboard.receiveShadow = true;
        scene.add(scoreboard);
        sceneObjects.push(scoreboard);

        // Add a spot light to illuminate scoreboard area
        var scoreboardLight = new THREE.SpotLight(0x00ff00, 1.5, 200, Math.PI / 6, 0.5, 1);
        scoreboardLight.position.set(0, 60, -50);
        scoreboardLight.target.position.set(0, 50, -70);
        scene.add(scoreboardLight);
        scene.add(scoreboardLight.target);
        sceneObjects.push(scoreboardLight);
        sceneObjects.push(scoreboardLight.target);
    }

    function createFloodlights() {
        // 4 very tall cylinder poles + box array lamp heads
        var positions = [
            { x: 60, z: 40 },
            { x: -60, z: 40 },
            { x: 60, z: -40 },
            { x: -60, z: -40 }
        ];

        positions.forEach(function(pos) {
            // Tall pole
            var poleGeo = new THREE.CylinderGeometry(2, 2, 100, 8);
            var poleMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            var pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(pos.x, 50, pos.z);
            pole.castShadow = true;
            pole.receiveShadow = true;
            scene.add(pole);
            sceneObjects.push(pole);

            // Lamp head array (3x3 boxes)
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    var lampGeo = new THREE.BoxGeometry(4, 4, 4);
                    var lampMat = new THREE.MeshStandardMaterial({
                        color: 0xffff99,
                        emissive: 0xffff99,
                        emissiveIntensity: 0.7
                    });
                    var lamp = new THREE.Mesh(lampGeo, lampMat);
                    lamp.position.set(pos.x + (i * 6), 105 + (j * 3), pos.z);
                    lamp.castShadow = true;
                    lamp.receiveShadow = true;
                    scene.add(lamp);
                    sceneObjects.push(lamp);

                    // Spotlight from lamp
                    var light = new THREE.SpotLight(0xffff99, 2, 300, Math.PI / 4, 0.3, 1);
                    light.position.set(pos.x + (i * 6), 105, pos.z);
                    light.target.position.set(pos.x, 0, pos.z);
                    light.castShadow = true;
                    scene.add(light);
                    scene.add(light.target);
                    sceneObjects.push(light);
                    sceneObjects.push(light.target);
                }
            }
        });
    }

    function createVIPBox() {
        // Elevated box enclosure with glass wall
        var geometry = new THREE.BoxGeometry(20, 15, 25);
        var material = new THREE.MeshStandardMaterial({
            color: 0x4a1a1a,
            metalness: 0.5,
            roughness: 0.3
        });
        var vipBox = new THREE.Mesh(geometry, material);
        vipBox.position.set(0, 65, 50);
        vipBox.castShadow = true;
        vipBox.receiveShadow = true;
        scene.add(vipBox);
        sceneObjects.push(vipBox);

        // Glass window
        var windowGeo = new THREE.BoxGeometry(18, 12, 0.5);
        var windowMat = new THREE.MeshStandardMaterial({
            color: 0xccccff,
            transparent: true,
            opacity: 0.3,
            metalness: 0.8,
            roughness: 0.1,
            emissive: 0x6666ff,
            emissiveIntensity: 0.4
        });
        var window = new THREE.Mesh(windowGeo, windowMat);
        window.position.set(0, 65, 63);
        scene.add(window);
        sceneObjects.push(window);
    }

    function createPlayerTunnel() {
        // Box arch entrance
        var archGeo = new THREE.BoxGeometry(15, 20, 5);
        var archMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
        var arch = new THREE.Mesh(archGeo, archMat);
        arch.position.set(0, 10, -65);
        arch.castShadow = true;
        arch.receiveShadow = true;
        scene.add(arch);
        sceneObjects.push(arch);
    }

    function createPenaltyArc() {
        // LineSegments on field
        var points = [];
        var arcRadius = 15;
        var segments = 20;
        for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * Math.PI;
            var x = Math.cos(angle) * arcRadius;
            var z = Math.sin(arcRadius * 0.3) + (i / segments) * 20;
            points.push(new THREE.Vector3(x, 0.1, z - 10));
        }
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        var arc = new THREE.LineSegments(geometry, material);
        arc.position.set(0, 0, 0);
        scene.add(arc);
        sceneObjects.push(arc);
    }

    function createGoalPosts() {
        // Cylinder uprights + crossbar
        var positions = [{ z: 35 }, { z: -35 }];
        positions.forEach(function(pos) {
            // Left upright
            var leftGeo = new THREE.CylinderGeometry(1, 1, 30, 8);
            var upMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            var leftUp = new THREE.Mesh(leftGeo, upMat);
            leftUp.position.set(-8, 15, pos.z);
            leftUp.castShadow = true;
            leftUp.receiveShadow = true;
            scene.add(leftUp);
            sceneObjects.push(leftUp);

            // Right upright
            var rightUp = new THREE.Mesh(leftGeo, upMat);
            rightUp.position.set(8, 15, pos.z);
            rightUp.castShadow = true;
            rightUp.receiveShadow = true;
            scene.add(rightUp);
            sceneObjects.push(rightUp);

            // Crossbar
            var barGeo = new THREE.CylinderGeometry(0.8, 0.8, 16, 8);
            var bar = new THREE.Mesh(barGeo, upMat);
            bar.rotation.z = Math.PI / 2;
            bar.position.set(0, 30, pos.z);
            bar.castShadow = true;
            bar.receiveShadow = true;
            scene.add(bar);
            sceneObjects.push(bar);
        });
    }

    function createPerimeterBarrier() {
        // Flat box track around field
        var fenceHeight = 8;
        var fenceThickness = 1;

        // Along X axis
        for (var i = -50; i < 50; i += 10) {
            // Front barrier
            var fenceGeo = new THREE.BoxGeometry(10, fenceHeight, fenceThickness);
            var fenceMat = new THREE.MeshStandardMaterial({ color: 0x333366 });
            var frontFence = new THREE.Mesh(fenceGeo, fenceMat);
            frontFence.position.set(i, 4, 45);
            frontFence.castShadow = true;
            frontFence.receiveShadow = true;
            scene.add(frontFence);
            sceneObjects.push(frontFence);

            // Back barrier
            var backFence = new THREE.Mesh(fenceGeo, fenceMat);
            backFence.position.set(i, 4, -45);
            backFence.castShadow = true;
            backFence.receiveShadow = true;
            scene.add(backFence);
            sceneObjects.push(backFence);
        }

        // Along Z axis
        for (var j = -35; j < 35; j += 10) {
            // Left barrier
            var fenceGeo = new THREE.BoxGeometry(fenceThickness, fenceHeight, 10);
            var fenceMat = new THREE.MeshStandardMaterial({ color: 0x333366 });
            var leftFence = new THREE.Mesh(fenceGeo, fenceMat);
            leftFence.position.set(-55, 4, j);
            leftFence.castShadow = true;
            leftFence.receiveShadow = true;
            scene.add(leftFence);
            sceneObjects.push(leftFence);

            // Right barrier
            var rightFence = new THREE.Mesh(fenceGeo, fenceMat);
            rightFence.position.set(55, 4, j);
            rightFence.castShadow = true;
            rightFence.receiveShadow = true;
            scene.add(rightFence);
            sceneObjects.push(rightFence);
        }
    }

    function createMedicalStation() {
        // Box tent with red cross
        var tentGeo = new THREE.BoxGeometry(12, 10, 10);
        var tentMat = new THREE.MeshStandardMaterial({ color: 0xff6666 });
        var tent = new THREE.Mesh(tentGeo, tentMat);
        tent.position.set(-40, 5, -50);
        tent.castShadow = true;
        tent.receiveShadow = true;
        scene.add(tent);
        sceneObjects.push(tent);

        // Red cross on tent
        var crossMatH = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.5 });
        var crossH = new THREE.BoxGeometry(8, 2, 0.5);
        var crossHMesh = new THREE.Mesh(crossH, crossMatH);
        crossHMesh.position.set(-40, 5, -39.8);
        scene.add(crossHMesh);
        sceneObjects.push(crossHMesh);

        var crossV = new THREE.BoxGeometry(2, 8, 0.5);
        var crossVMesh = new THREE.Mesh(crossV, crossMatH);
        crossVMesh.position.set(-40, 5, -39.8);
        scene.add(crossVMesh);
        sceneObjects.push(crossVMesh);
    }

    function createAnnouncerBooth() {
        // Elevated small box
        var boothGeo = new THREE.BoxGeometry(10, 8, 8);
        var boothMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a });
        var booth = new THREE.Mesh(boothGeo, boothMat);
        booth.position.set(45, 55, 45);
        booth.castShadow = true;
        booth.receiveShadow = true;
        scene.add(booth);
        sceneObjects.push(booth);

        // Booth light blinks (animated via light)
        var boothLight = new THREE.PointLight(0xffff00, 1, 100);
        boothLight.position.set(45, 62, 45);
        scene.add(boothLight);
        sceneObjects.push(boothLight);
    }

    function createCageRingOnField() {
        // LineSegments cage
        var cageRadius = 20;
        var cageHeight = 25;
        var segments = 12;

        // Bottom ring
        var bottomPoints = [];
        for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            var x = Math.cos(angle) * cageRadius;
            var z = Math.sin(angle) * cageRadius;
            bottomPoints.push(new THREE.Vector3(x, 0.5, z));
        }
        var bottomGeo = new THREE.BufferGeometry().setFromPoints(bottomPoints);
        var cageMat = new THREE.LineBasicMaterial({ color: 0xffcc00, linewidth: 3 });
        var bottomCage = new THREE.LineSegments(bottomGeo, cageMat);
        bottomCage.position.set(0, 0, 0);
        scene.add(bottomCage);
        sceneObjects.push(bottomCage);

        // Top ring
        var topPoints = [];
        for (var i = 0; i <= segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            var x = Math.cos(angle) * cageRadius;
            var z = Math.sin(angle) * cageRadius;
            topPoints.push(new THREE.Vector3(x, cageHeight, z));
        }
        var topGeo = new THREE.BufferGeometry().setFromPoints(topPoints);
        var topCage = new THREE.LineSegments(topGeo, cageMat);
        topCage.position.set(0, 0, 0);
        scene.add(topCage);
        sceneObjects.push(topCage);

        // Vertical bars
        for (var i = 0; i < segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            var x = Math.cos(angle) * cageRadius;
            var z = Math.sin(angle) * cageRadius;
            var barPoints = [
                new THREE.Vector3(x, 0.5, z),
                new THREE.Vector3(x, cageHeight, z)
            ];
            var barGeo = new THREE.BufferGeometry().setFromPoints(barPoints);
            var bar = new THREE.LineSegments(barGeo, cageMat);
            bar.position.set(0, 0, 0);
            scene.add(bar);
            sceneObjects.push(bar);
        }

        // Cage door (swingable)
        var doorPoints = [
            new THREE.Vector3(cageRadius - 2, 0.5, 0),
            new THREE.Vector3(cageRadius - 2, cageHeight, 0),
            new THREE.Vector3(cageRadius, 0.5, 0),
            new THREE.Vector3(cageRadius, cageHeight, 0)
        ];
        var doorGeo = new THREE.BufferGeometry().setFromPoints(doorPoints);
        var door = new THREE.LineSegments(doorGeo, cageMat);
        door.position.set(0, 0, 0);
        scene.add(door);
        sceneObjects.push(door);
    }

    function createCrowdSilhouettes() {
        // Grid of small box shapes in stands
        var rows = 8;
        var cols = 8;
        var spacing = 15;
        var startX = -rows / 2 * spacing;
        var startZ = -cols / 2 * spacing;

        for (var i = 0; i < rows; i++) {
            for (var j = 0; j < cols; j++) {
                var crowdGeo = new THREE.BoxGeometry(3, 8, 3);
                var crowdMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
                var crowd = new THREE.Mesh(crowdGeo, crowdMat);
                crowd.position.set(startX + (i * spacing), 75, startZ + (j * spacing));
                crowd.castShadow = true;
                crowd.receiveShadow = true;
                scene.add(crowd);
                sceneObjects.push(crowd);
            }
        }
    }

    function createCorporateBanner() {
        // Flat box hanging from roof
        var bannerGeo = new THREE.BoxGeometry(80, 15, 2);
        var bannerMat = new THREE.MeshStandardMaterial({
            color: 0x003366,
            emissive: 0x0066ff,
            emissiveIntensity: 0.4
        });
        var banner = new THREE.Mesh(bannerGeo, bannerMat);
        banner.position.set(0, 110, 0);
        banner.castShadow = true;
        banner.receiveShadow = true;
        scene.add(banner);
        sceneObjects.push(banner);
    }

    function createScoreboardTicker() {
        // Emissive box strip
        var tickerGeo = new THREE.BoxGeometry(100, 3, 1);
        var tickerMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0xff0000,
            emissiveIntensity: 0.6
        });
        var ticker = new THREE.Mesh(tickerGeo, tickerMat);
        ticker.position.set(0, 35, -72);
        scene.add(ticker);
        sceneObjects.push(ticker);
    }

    function update(delta) {
        state.elapsedTime += delta;

        // Animate floodlights sweep
        var sweepIndex = Math.floor((state.elapsedTime % 4) * 10);
        var lights = scene.children.filter(function(obj) { return obj instanceof THREE.SpotLight; });
        lights.forEach(function(light, idx) {
            if (light.target) {
                var angle = (state.elapsedTime * 0.3) + (idx * 0.5);
                light.target.position.x = Math.sin(angle) * 50;
                light.target.position.z = Math.cos(angle) * 50;
            }
        });

        // Animate scoreboard (emissive pattern cycle)
        sceneObjects.forEach(function(obj) {
            if (obj.material && obj.material.emissive && obj.geometry) {
                if (obj.geometry.parameters && obj.geometry.parameters.width > 50) {
                    var pulse = Math.sin(state.elapsedTime * 2) * 0.5 + 0.5;
                    obj.material.emissiveIntensity = pulse * 0.6;
                }
            }
        });

        // Animate crowd boxes ripple in wave pattern
        var crowdBoxes = sceneObjects.filter(function(obj) {
            return obj instanceof THREE.Mesh && obj.geometry instanceof THREE.BoxGeometry &&
                   obj.position.y > 70;
        });
        crowdBoxes.forEach(function(box, idx) {
            var waveOffset = state.elapsedTime + (idx * 0.1);
            var ripple = Math.sin(waveOffset) * 2;
            box.position.y = 75 + ripple;
        });

        // Cage ring door swings
        var cageLines = sceneObjects.filter(function(obj) {
            return obj instanceof THREE.LineSegments;
        });
        cageLines.forEach(function(line) {
            var swingAngle = Math.sin(state.elapsedTime) * 0.3;
            line.rotation.y = swingAngle;
        });

        // VIP box window glows
        sceneObjects.forEach(function(obj) {
            if (obj.material && obj.material.transparent && obj.position.y > 60) {
                var glow = Math.sin(state.elapsedTime * 1.5) * 0.2 + 0.3;
                obj.material.opacity = glow;
            }
        });

        // Announcer booth light blinks
        var pointLights = scene.children.filter(function(obj) { return obj instanceof THREE.PointLight; });
        pointLights.forEach(function(light) {
            if (light.position.y > 50) {
                var blink = Math.abs(Math.sin(state.elapsedTime * 3)) > 0.5 ? 1 : 0.3;
                light.intensity = blink;
            }
        });

        // Update HUD notification timer
        if (state.hudNotificationTime > 0) {
            state.hudNotificationTime -= delta;
        }
    }

    function reset() {
        // Remove all scene objects
        sceneObjects.forEach(function(obj) {
            if (obj.parent) {
                obj.parent.remove(obj);
            }
        });
        sceneObjects = [];

        // Reset state
        state.captivesFreed = 0;
        state.guardsDown = 0;
        state.warlordEliminated = false;
        state.elapsedTime = 0;
        state.lastBKeyPress = -1000;
        state.keybindActive = false;
        state.hudNotification = '';
        state.hudNotificationTime = 0;
    }

    function getHUDData() {
        return {
            captivesFreed: state.captivesFreed,
            guardsDown: state.guardsDown,
            warlordEliminated: state.warlordEliminated,
            notification: state.hudNotification,
            notificationActive: state.hudNotificationTime > 0,
            keybindActive: state.keybindActive
        };
    }

    return {
        init: init,
        update: update,
        reset: reset,
        getHUDData: getHUDData
    };
}());
