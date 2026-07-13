window.SmugglersDen = (function() {
    'use strict';

    var scene, camera;
    var objects = [];
    var guards = [];
    var deaTeam = [];
    var animationState = {
        deaAdvancing: false,
        guardsScattering: false,
        lightsFlashing: false,
        tunnelActive: false,
        generatorVibrating: false,
        panelSparking: false,
        screensFlickering: false
    };
    var emergencyLights = [];
    var hud = null;
    var hudState = {
        productSeized: 0,
        cartelDown: 0,
        evidenceSecured: false
    };
    var keyPressLog = [];
    var lastHWToggleTime = 0;

    function init(_scene, _camera) {
        scene = _scene;
        camera = _camera;
        objects = [];
        guards = [];
        deaTeam = [];
        emergencyLights = [];
        keyPressLog = [];
        hudState = {
            productSeized: 0,
            cartelDown: 0,
            evidenceSecured: false
        };

        // 1. Warehouse floor - dark concrete box
        var floorGeom = new THREE.BoxGeometry(400, 0.3, 400);
        var floorMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        var floor = new THREE.Mesh(floorGeom, floorMat);
        floor.position.y = -0.15;
        scene.add(floor);
        objects.push(floor);

        // 2. Perimeter walls - dark box walls
        var wallMat = new THREE.MeshPhongMaterial({ color: 0x222222 });

        // Front wall
        var frontWall = new THREE.Mesh(new THREE.BoxGeometry(400, 300, 10), wallMat);
        frontWall.position.set(0, 150, -200);
        scene.add(frontWall);
        objects.push(frontWall);

        // Back wall
        var backWall = new THREE.Mesh(new THREE.BoxGeometry(400, 300, 10), wallMat);
        backWall.position.set(0, 150, 200);
        scene.add(backWall);
        objects.push(backWall);

        // Left wall
        var leftWall = new THREE.Mesh(new THREE.BoxGeometry(10, 300, 400), wallMat);
        leftWall.position.set(-200, 150, 0);
        scene.add(leftWall);
        objects.push(leftWall);

        // Right wall
        var rightWall = new THREE.Mesh(new THREE.BoxGeometry(10, 300, 400), wallMat);
        rightWall.position.set(200, 150, 0);
        scene.add(rightWall);
        objects.push(rightWall);

        // 3. Drug bale stacks - white/green wrapped boxes stacked 3 high
        var baleColors = [0xFFFFFF, 0x00AA00];
        var balePositions = [
            { x: -120, z: -100 },
            { x: -120, z: 0 },
            { x: -120, z: 100 },
            { x: 80, z: -100 },
            { x: 80, z: 0 },
            { x: 80, z: 100 }
        ];

        balePositions.forEach(function(pos, idx) {
            for (var layer = 0; layer < 3; layer++) {
                var colorIdx = (idx + layer) % 2;
                var baleGeom = new THREE.BoxGeometry(30, 25, 20);
                var baleMat = new THREE.MeshPhongMaterial({ color: baleColors[colorIdx] });
                var bale = new THREE.Mesh(baleGeom, baleMat);
                bale.position.set(pos.x, 12.5 + layer * 25, pos.z);
                scene.add(bale);
                objects.push(bale);
            }
        });

        // 4. Weapons crates - military green boxes
        var crateMat = new THREE.MeshPhongMaterial({ color: 0x2a5a2a });
        var cratePositions = [
            { x: -150, z: -150 },
            { x: -150, z: -50 },
            { x: 150, z: -150 },
            { x: 150, z: -50 }
        ];

        cratePositions.forEach(function(pos) {
            var crateGeom = new THREE.BoxGeometry(40, 35, 40);
            var crate = new THREE.Mesh(crateGeom, crateMat);
            crate.position.set(pos.x, 17.5, pos.z);
            scene.add(crate);
            objects.push(crate);
        });

        // 5. Counting table - long flat box table with cash stacks
        var tableGeom = new THREE.BoxGeometry(150, 2, 50);
        var tableMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        var table = new THREE.Mesh(tableGeom, tableMat);
        table.position.set(0, 75, 0);
        scene.add(table);
        objects.push(table);

        // Cash bundles on table
        for (var i = 0; i < 8; i++) {
            var cashGeom = new THREE.BoxGeometry(15, 8, 10);
            var cashMat = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
            var cash = new THREE.Mesh(cashGeom, cashMat);
            cash.position.set(-50 + i * 18, 79, 0);
            scene.add(cash);
            objects.push(cash);
        }

        // 6. Cartel guard figures - 6 dark clothing boxes
        for (var i = 0; i < 6; i++) {
            var guardGeom = new THREE.BoxGeometry(12, 35, 8);
            var guardMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
            var guard = new THREE.Mesh(guardGeom, guardMat);
            var angle = (i / 6) * Math.PI * 2;
            guard.position.x = Math.cos(angle) * 130;
            guard.position.y = 17.5;
            guard.position.z = Math.sin(angle) * 130;
            guard.userData.patrolAngle = angle;
            guard.userData.patrolRadius = 130;
            scene.add(guard);
            objects.push(guard);
            guards.push(guard);
        }

        // 7. DEA breach team - 4 blue raid jacket boxes entering from stairwell
        var deaMat = new THREE.MeshPhongMaterial({ color: 0x003366 });
        for (var i = 0; i < 4; i++) {
            var deaGeom = new THREE.BoxGeometry(12, 35, 8);
            var dea = new THREE.Mesh(deaGeom, deaMat);
            dea.position.set(-180 + i * 15, 17.5 + i * 5, -180);
            dea.userData.startX = dea.position.x;
            dea.userData.startY = dea.position.y;
            dea.userData.startZ = dea.position.z;
            dea.userData.targetX = -20 + i * 20;
            dea.userData.targetZ = -20;
            scene.add(dea);
            objects.push(dea);
            deaTeam.push(dea);
        }

        // 8. Emergency generator - large gray box + exhaust pipe cylinder
        var genGeom = new THREE.BoxGeometry(60, 50, 40);
        var genMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
        var generator = new THREE.Mesh(genGeom, genMat);
        generator.position.set(160, 25, 160);
        scene.add(generator);
        objects.push(generator);

        // Exhaust pipe
        var pipeGeom = new THREE.CylinderGeometry(8, 8, 100, 16);
        var pipeMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
        var pipe = new THREE.Mesh(pipeGeom, pipeMat);
        pipe.position.set(160, 100, 160);
        scene.add(pipe);
        objects.push(pipe);

        // 9. Red emergency lighting - 4 red emissive spheres
        var lightPositions = [
            { x: -150, z: -150 },
            { x: 150, z: -150 },
            { x: -150, z: 150 },
            { x: 150, z: 150 }
        ];

        lightPositions.forEach(function(pos) {
            var lightGeom = new THREE.SphereGeometry(8, 16, 16);
            var lightMat = new THREE.MeshPhongMaterial({
                color: 0xFF0000,
                emissive: 0xFF0000,
                emissiveIntensity: 0
            });
            var light = new THREE.Mesh(lightGeom, lightMat);
            light.position.set(pos.x, 250, pos.z);
            light.userData.normalIntensity = 0;
            light.userData.flashIntensity = 1.0;
            scene.add(light);
            objects.push(light);
            emergencyLights.push(light);
        });

        // 10. Secret escape tunnel - dark rectangular passage in far wall with rail track
        var tunnelGeom = new THREE.BoxGeometry(60, 80, 120);
        var tunnelMat = new THREE.MeshPhongMaterial({ color: 0x0a0a0a });
        var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnel.position.set(0, 40, 200);
        scene.add(tunnel);
        objects.push(tunnel);

        // Rail track in tunnel
        var railGeom = new THREE.BoxGeometry(50, 2, 120);
        var railMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
        var rail = new THREE.Mesh(railGeom, railMat);
        rail.position.set(0, 5, 200);
        scene.add(rail);
        objects.push(rail);

        // 11. Surveillance monitor bank - wall-mounted boxes with emissive screen glow
        var monitorGeom = new THREE.BoxGeometry(20, 25, 5);
        var monitorFrameMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });

        for (var i = 0; i < 4; i++) {
            var monitor = new THREE.Mesh(monitorGeom, monitorFrameMat);
            monitor.position.set(-80 + i * 50, 180, -195);
            scene.add(monitor);
            objects.push(monitor);

            // Screen glow
            var screenGeom = new THREE.BoxGeometry(18, 23, 0.1);
            var screenMat = new THREE.MeshPhongMaterial({
                color: 0x00FF00,
                emissive: 0x00FF00,
                emissiveIntensity: 0.5
            });
            var screen = new THREE.Mesh(screenGeom, screenMat);
            screen.position.set(-80 + i * 50, 180, -192);
            screen.userData.flickerPhase = Math.random();
            scene.add(screen);
            objects.push(screen);
        }

        // 12. Smuggling boat in water channel - flat hull box in recessed channel
        var channelGeom = new THREE.BoxGeometry(200, 5, 60);
        var channelMat = new THREE.MeshPhongMaterial({ color: 0x1a3a52 });
        var waterChannel = new THREE.Mesh(channelGeom, channelMat);
        waterChannel.position.set(0, 2.5, 50);
        scene.add(waterChannel);
        objects.push(waterChannel);

        // Boat hull
        var boatGeom = new THREE.BoxGeometry(80, 15, 30);
        var boatMat = new THREE.MeshPhongMaterial({ color: 0x333366 });
        var boat = new THREE.Mesh(boatGeom, boatMat);
        boat.position.set(0, 10, 50);
        scene.add(boat);
        objects.push(boat);

        // 13. Product scale and weigh station - box table + cylinder scale base
        var scaleTableGeom = new THREE.BoxGeometry(50, 2, 50);
        var scaleTableMat = new THREE.MeshPhongMaterial({ color: 0x696969 });
        var scaleTable = new THREE.Mesh(scaleTableGeom, scaleTableMat);
        scaleTable.position.set(-120, 75, 160);
        scene.add(scaleTable);
        objects.push(scaleTable);

        // Scale base cylinder
        var scaleBaseGeom = new THREE.CylinderGeometry(15, 20, 30, 16);
        var scaleBaseMat = new THREE.MeshPhongMaterial({ color: 0x556B2F });
        var scaleBase = new THREE.Mesh(scaleBaseGeom, scaleBaseMat);
        scaleBase.position.set(-120, 15, 160);
        scene.add(scaleBase);
        objects.push(scaleBase);

        // 14. Armored vault door - thick box door in wall
        var vaultDoorGeom = new THREE.BoxGeometry(80, 100, 15);
        var vaultMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a });
        var vaultDoor = new THREE.Mesh(vaultDoorGeom, vaultMat);
        vaultDoor.position.set(-190, 50, 0);
        scene.add(vaultDoor);
        objects.push(vaultDoor);

        // Hinges on vault door
        for (var i = 0; i < 3; i++) {
            var hingeGeom = new THREE.BoxGeometry(10, 10, 20);
            var hingeMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
            var hinge = new THREE.Mesh(hingeGeom, hingeMat);
            hinge.position.set(-195, 20 + i * 30, 0);
            scene.add(hinge);
            objects.push(hinge);
        }

        // 15. Electrical panel - wall box with breaker elements
        var panelGeom = new THREE.BoxGeometry(40, 60, 8);
        var panelMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        var panel = new THREE.Mesh(panelGeom, panelMat);
        panel.position.set(190, 100, -195);
        scene.add(panel);
        objects.push(panel);

        // Breaker boxes
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 4; col++) {
                var breakerGeom = new THREE.BoxGeometry(8, 8, 5);
                var breakerMat = new THREE.MeshPhongMaterial({ color: 0xFFFF00 });
                var breaker = new THREE.Mesh(breakerGeom, breakerMat);
                breaker.position.set(180 + col * 10, 70 + row * 15, -191);
                scene.add(breaker);
                objects.push(breaker);
            }
        }

        // 16. Ventilation ducting - box ducts on ceiling
        var ductMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
        var ductPositions = [
            { x: -100, z: -100 },
            { x: 100, z: -100 },
            { x: -100, z: 100 },
            { x: 100, z: 100 }
        ];

        ductPositions.forEach(function(pos) {
            var ductGeom = new THREE.BoxGeometry(30, 15, 30);
            var duct = new THREE.Mesh(ductGeom, ductMat);
            duct.position.set(pos.x, 280, pos.z);
            scene.add(duct);
            objects.push(duct);
        });

        // HUD setup
        createHUD();

        // Keyboard event listener for HUD toggle
        document.addEventListener('keydown', function(e) {
            keyPressLog.push(e.key.toLowerCase());
            if (keyPressLog.length > 10) {
                keyPressLog.shift();
            }

            var now = Date.now();
            if (keyPressLog.length >= 2) {
                var recent = keyPressLog.slice(-2).join('');
                if (recent === 'hw') {
                    if (now - lastHWToggleTime < 400) {
                        toggleHUD();
                        lastHWToggleTime = 0;
                        keyPressLog = [];
                    } else {
                        lastHWToggleTime = now;
                    }
                }
            }
        });
    }

    function createHUD() {
        if (hud) {
            document.body.removeChild(hud);
        }

        hud = document.createElement('div');
        hud.id = 'smugglers-hud';
        hud.style.position = 'absolute';
        hud.style.top = '20px';
        hud.style.left = '20px';
        hud.style.color = '#00FF00';
        hud.style.fontFamily = 'monospace';
        hud.style.fontSize = '14px';
        hud.style.zIndex = '9999';
        hud.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        hud.style.padding = '10px';
        hud.style.border = '1px solid #00FF00';

        updateHUDText();
        document.body.appendChild(hud);
    }

    function updateHUDText() {
        if (!hud) return;

        var evidenceText = hudState.evidenceSecured ? 'YES' : 'NO';
        hud.innerHTML =
            'PRODUCT SEIZED: ' + hudState.productSeized + '%<br>' +
            'CARTEL DOWN: ' + hudState.cartelDown + '/6<br>' +
            'EVIDENCE SECURED: ' + evidenceText;
    }

    function toggleHUD() {
        if (!hud) return;
        if (hud.style.display === 'none') {
            hud.style.display = 'block';
        } else {
            hud.style.display = 'none';
        }
    }

    function update(delta) {
        // DEA team advancement
        if (!animationState.deaAdvancing) {
            animationState.deaAdvancing = true;
        }

        deaTeam.forEach(function(dea) {
            var targetX = dea.userData.targetX;
            var targetZ = dea.userData.targetZ;
            var speed = 50;

            var dx = targetX - dea.position.x;
            var dz = targetZ - dea.position.z;
            var dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 1) {
                var moveX = (dx / dist) * speed * delta;
                var moveZ = (dz / dist) * speed * delta;
                dea.position.x += moveX;
                dea.position.z += moveZ;
            }
        });

        // Cartel guards scatter/evade
        guards.forEach(function(guard) {
            var angle = guard.userData.patrolAngle;
            var radius = guard.userData.patrolRadius;

            // Oscillate radius as if scattering
            radius += Math.sin(Date.now() * 0.001) * 30;
            guard.position.x = Math.cos(angle) * radius;
            guard.position.z = Math.sin(angle) * radius;

            angle += 0.5 * delta;
            guard.userData.patrolAngle = angle;
            guard.userData.patrolRadius = radius;
        });

        // Emergency lights flash red (power cut animation)
        var flashCycle = (Date.now() % 1000) / 1000;
        var flashIntensity = flashCycle < 0.5 ? flashCycle * 2 : (1 - flashCycle) * 2;

        emergencyLights.forEach(function(light) {
            light.material.emissiveIntensity = flashIntensity;
        });

        // Surveillance screens flicker
        var screenFlicker = Math.random() > 0.95 ? 0.3 : 0.5;
        var screens = scene.children.filter(function(obj) {
            return obj.userData.flickerPhase !== undefined;
        });
        screens.forEach(function(screen) {
            screen.material.emissiveIntensity = screenFlicker + Math.random() * 0.2;
        });

        // Generator vibration
        var generatorVib = Math.sin(Date.now() * 0.01) * 2;
        var generator = scene.children.find(function(obj) {
            return obj.geometry && obj.geometry.type === 'BoxGeometry' && obj.position.x === 160 && obj.position.z === 160;
        });
        if (generator) {
            generator.position.y = 25 + generatorVib;
        }

        // Secret tunnel activation (emissive glow)
        var tunnelGlow = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
        var tunnel = scene.children.find(function(obj) {
            return obj.geometry && obj.geometry.type === 'BoxGeometry' && obj.position.z === 200;
        });
        if (tunnel && tunnel.position.x === 0) {
            tunnel.material.emissiveIntensity = tunnelGlow * 0.3;
        }

        // Electrical panel sparking (visual effect with random colors)
        var panelSparkCycle = (Date.now() % 800) / 800;
        var breakers = scene.children.filter(function(obj) {
            return obj.material && obj.material.color && obj.position.x > 180 && obj.position.x < 200 && obj.position.y > 50;
        });
        breakers.forEach(function(breaker) {
            if (Math.random() > 0.85) {
                breaker.material.color.setHex(0xFF6600);
            } else {
                breaker.material.color.setHex(0xFFFF00);
            }
        });

        // Update HUD state gradually
        if (hudState.productSeized < 75) {
            hudState.productSeized += delta * 5;
        }
        if (hudState.cartelDown < 6) {
            hudState.cartelDown = Math.min(6, hudState.cartelDown + delta * 0.5);
        }
        if (!hudState.evidenceSecured && Math.random() > 0.995) {
            hudState.evidenceSecured = true;
        }

        updateHUDText();
    }

    function reset() {
        // Reset animation states
        animationState = {
            deaAdvancing: false,
            guardsScattering: false,
            lightsFlashing: false,
            tunnelActive: false,
            generatorVibrating: false,
            panelSparking: false,
            screensFlickering: false
        };

        // Reset HUD state
        hudState = {
            productSeized: 0,
            cartelDown: 0,
            evidenceSecured: false
        };

        updateHUDText();

        // Reset all DEA team positions
        deaTeam.forEach(function(dea, idx) {
            dea.position.x = -180 + idx * 15;
            dea.position.y = 17.5 + idx * 5;
            dea.position.z = -180;
        });

        // Reset guard angles
        guards.forEach(function(guard, idx) {
            guard.userData.patrolAngle = (idx / guards.length) * Math.PI * 2;
            guard.userData.patrolRadius = 130;
        });

        // Reset emergency lights
        emergencyLights.forEach(function(light) {
            light.material.emissiveIntensity = 0;
        });

        // Reset panel breakers
        var breakers = scene.children.filter(function(obj) {
            return obj.material && obj.material.color && obj.position.x > 180 && obj.position.x < 200 && obj.position.y > 50;
        });
        breakers.forEach(function(breaker) {
            breaker.material.color.setHex(0xFFFF00);
        });
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
