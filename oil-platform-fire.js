window.OilPlatformFire = (function() {
    'use strict';

    var scene, camera, renderer, canvas, context2d;
    var sceneObjects = [];
    var clock = new THREE.Clock();
    var hudVisible = true;
    var lastKeyTime = 0;
    var lastKeyPressed = null;
    var workersRescued = 0;
    var wellheadSealed = false;
    var platformIntegrity = 23;

    // Animation state
    var flareFireScale = 1;
    var flareDirection = 1;
    var wellheadHeight = 0;
    var wellheadDirection = 1;
    var helicopterAngle = 0;
    var helicopterDistance = 120;
    var smokeHeight = 0;

    function init(container) {
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x333333);
        scene.fog = new THREE.Fog(0x333333, 500, 1000);

        // Camera
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(80, 50, 100);
        camera.lookAt(0, 20, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(200, 150, 200);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        scene.add(directionalLight);

        // Sea surface (16)
        var seaGeometry = new THREE.BoxGeometry(400, 2, 400);
        var seaMaterial = new THREE.MeshStandardMaterial({ color: 0x1a4d6d, roughness: 0.7 });
        var sea = new THREE.Mesh(seaGeometry, seaMaterial);
        sea.position.y = -40;
        sea.receiveShadow = true;
        scene.add(sea);
        sceneObjects.push(sea);

        // Platform deck (1)
        var deckGeometry = new THREE.BoxGeometry(60, 3, 50);
        var deckMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 });
        var deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.y = 0;
        deck.castShadow = true;
        deck.receiveShadow = true;
        scene.add(deck);
        sceneObjects.push(deck);

        // Derrick drilling tower (2)
        var derrickGroup = new THREE.Group();

        // Main derrick columns
        var derrickGeometry = new THREE.BoxGeometry(4, 60, 4);
        var derrickMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });

        var derrickA = new THREE.Mesh(derrickGeometry, derrickMaterial);
        derrickA.position.set(-8, 30, -8);
        derrickA.castShadow = true;
        derrickGroup.add(derrickA);

        var derrickB = new THREE.Mesh(derrickGeometry, derrickMaterial);
        derrickB.position.set(8, 30, -8);
        derrickB.castShadow = true;
        derrickGroup.add(derrickB);

        var derrickC = new THREE.Mesh(derrickGeometry, derrickMaterial);
        derrickC.position.set(-8, 30, 8);
        derrickC.castShadow = true;
        derrickGroup.add(derrickC);

        var derrickD = new THREE.Mesh(derrickGeometry, derrickMaterial);
        derrickD.position.set(8, 30, 8);
        derrickD.castShadow = true;
        derrickGroup.add(derrickD);

        // Cross-bracing
        var points1 = [
            new THREE.Vector3(-8, 25, -8),
            new THREE.Vector3(8, 35, 8)
        ];
        var line1 = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(points1),
            new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 })
        );
        derrickGroup.add(line1);

        var points2 = [
            new THREE.Vector3(8, 25, -8),
            new THREE.Vector3(-8, 35, 8)
        ];
        var line2 = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(points2),
            new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 })
        );
        derrickGroup.add(line2);

        derrickGroup.position.x = -15;
        scene.add(derrickGroup);
        sceneObjects.push(derrickGroup);

        // Flare boom with massive fire (3)
        var flareGroup = new THREE.Group();

        var flareArmGeometry = new THREE.BoxGeometry(4, 3, 3);
        var flareArmMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        var flareArm = new THREE.Mesh(flareArmGeometry, flareArmMaterial);
        flareArm.position.z = 20;
        flareArm.castShadow = true;
        flareGroup.add(flareArm);

        var fireSphereGeometry = new THREE.SphereGeometry(12, 16, 16);
        var fireSphereMaterial = new THREE.MeshStandardMaterial({
            color: 0xff8800,
            emissive: 0xff4400,
            emissiveIntensity: 2,
            roughness: 0.8
        });
        var fireSphere = new THREE.Mesh(fireSphereGeometry, fireSphereMaterial);
        fireSphere.position.z = 40;
        fireSphere.castShadow = true;
        flareGroup.add(fireSphere);

        flareGroup.position.set(20, 15, 0);
        scene.add(flareGroup);
        sceneObjects.push(flareGroup);

        // Wellhead blowout geyser (4)
        var wellheadGroup = new THREE.Group();

        var wellheadBaseGeometry = new THREE.CylinderGeometry(3, 4, 2, 8);
        var wellheadBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
        var wellheadBase = new THREE.Mesh(wellheadBaseGeometry, wellheadBaseMaterial);
        wellheadBase.castShadow = true;
        wellheadGroup.add(wellheadBase);

        var eruptionGeometry = new THREE.CylinderGeometry(2.5, 3, 30, 8);
        var eruptionMaterial = new THREE.MeshStandardMaterial({
            color: 0xff3300,
            emissive: 0xff0000,
            emissiveIntensity: 2.5,
            roughness: 0.7
        });
        var eruption = new THREE.Mesh(eruptionGeometry, eruptionMaterial);
        eruption.position.y = 15;
        eruption.castShadow = true;
        wellheadGroup.add(eruption);

        wellheadGroup.position.set(-25, 2, 15);
        scene.add(wellheadGroup);
        sceneObjects.push(wellheadGroup);

        // Living quarters module (5)
        var quartersGeometry = new THREE.BoxGeometry(15, 12, 12);
        var quartersMaterial = new THREE.MeshStandardMaterial({ color: 0x666644, roughness: 0.7 });
        var quarters = new THREE.Mesh(quartersGeometry, quartersMaterial);
        quarters.position.set(-20, 8, -20);
        quarters.castShadow = true;
        quarters.receiveShadow = true;
        scene.add(quarters);
        sceneObjects.push(quarters);

        // Fire on quarters
        var quarterFireGeometry = new THREE.SphereGeometry(5, 12, 12);
        var quarterFireMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff3300,
            emissiveIntensity: 2,
            roughness: 0.8
        });
        var quarterFire = new THREE.Mesh(quarterFireGeometry, quarterFireMaterial);
        quarterFire.position.set(-20, 18, -20);
        quarterFire.castShadow = true;
        scene.add(quarterFire);
        sceneObjects.push(quarterFire);

        // Helideck (6)
        var helideckGeometry = new THREE.BoxGeometry(25, 1, 25);
        var helideckMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
        var helideck = new THREE.Mesh(helideckGeometry, helideckMaterial);
        helideck.position.set(25, 20, -15);
        helideck.castShadow = true;
        helideck.receiveShadow = true;
        scene.add(helideck);
        sceneObjects.push(helideck);

        // H marking on helideck
        var hPoints = [
            new THREE.Vector3(20, 20.1, -15),
            new THREE.Vector3(30, 20.1, -15)
        ];
        var hLine1 = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(hPoints),
            new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 })
        );
        scene.add(hLine1);

        var hPoints2 = [
            new THREE.Vector3(25, 20.1, -20),
            new THREE.Vector3(25, 20.1, -10)
        ];
        var hLine2 = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(hPoints2),
            new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 })
        );
        scene.add(hLine2);
        sceneObjects.push(hLine1);
        sceneObjects.push(hLine2);

        // Crane arm (7)
        var craneGeometry = new THREE.BoxGeometry(3, 3, 30);
        var craneMaterial = new THREE.MeshStandardMaterial({ color: 0xff9900, roughness: 0.7 });
        var crane = new THREE.Mesh(craneGeometry, craneMaterial);
        crane.position.set(15, 25, 0);
        crane.castShadow = true;
        scene.add(crane);
        sceneObjects.push(crane);

        // Lifeboat davit (8)
        var lifebootGroup = new THREE.Group();

        var davitGeometry = new THREE.CylinderGeometry(1, 1, 15, 6);
        var davitMaterial = new THREE.MeshStandardMaterial({ color: 0xaa5500, roughness: 0.8 });
        var davit = new THREE.Mesh(davitGeometry, davitMaterial);
        davit.position.set(30, 12, 20);
        davit.rotation.z = Math.PI / 6;
        davit.castShadow = true;
        lifebootGroup.add(davit);

        var lifeboatGeometry = new THREE.BoxGeometry(3, 2, 6);
        var lifeboatMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.6 });
        var lifeboat = new THREE.Mesh(lifeboatGeometry, lifeboatMaterial);
        lifeboat.position.set(32, 5, 28);
        lifeboat.castShadow = true;
        lifebootGroup.add(lifeboat);

        scene.add(lifebootGroup);
        sceneObjects.push(lifebootGroup);

        // Pipe manifold (9)
        var pipeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
        var pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });

        var pipe1 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe1.position.set(-10, 3, 0);
        pipe1.rotation.z = Math.PI / 2;
        pipe1.castShadow = true;
        scene.add(pipe1);
        sceneObjects.push(pipe1);

        var pipe2 = new THREE.Mesh(pipeGeometry, pipeMaterial);
        pipe2.position.set(0, 3, 0);
        pipe2.rotation.z = Math.PI / 2;
        pipe2.castShadow = true;
        scene.add(pipe2);
        sceneObjects.push(pipe2);

        // Control room (10)
        var controlGeometry = new THREE.BoxGeometry(10, 8, 10);
        var controlMaterial = new THREE.MeshStandardMaterial({ color: 0x444433, roughness: 0.7 });
        var control = new THREE.Mesh(controlGeometry, controlMaterial);
        control.position.set(15, 5, 15);
        control.castShadow = true;
        scene.add(control);
        sceneObjects.push(control);

        // Shattered windows on control room
        var windowPoints = [
            new THREE.Vector3(15, 8, 20),
            new THREE.Vector3(17, 10, 22)
        ];
        var windowCrack1 = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints(windowPoints),
            new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 })
        );
        scene.add(windowCrack1);
        sceneObjects.push(windowCrack1);

        // Rescue helicopter (11)
        var helicopterGroup = new THREE.Group();

        var fuselageGeometry = new THREE.BoxGeometry(4, 3, 12);
        var fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.6 });
        var fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        fuselage.castShadow = true;
        helicopterGroup.add(fuselage);

        var rotorGeometry = new THREE.CylinderGeometry(8, 8, 0.5, 4);
        var rotorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
        var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
        rotor.position.y = 3;
        rotor.castShadow = true;
        helicopterGroup.add(rotor);

        helicopterGroup.position.set(0, 80, -80);
        scene.add(helicopterGroup);
        sceneObjects.push(helicopterGroup);

        // Trapped worker figures (12)
        var worker1 = createWorkerFigure(-15, 10, -15);
        scene.add(worker1);
        sceneObjects.push(worker1);

        var worker2 = createWorkerFigure(10, 10, -20);
        scene.add(worker2);
        sceneObjects.push(worker2);

        var worker3 = createWorkerFigure(-5, 10, 10);
        scene.add(worker3);
        sceneObjects.push(worker3);

        var worker4 = createWorkerFigure(20, 10, 5);
        scene.add(worker4);
        sceneObjects.push(worker4);

        // Rescue diver figures (13)
        var diver1 = createDiverFigure(-30, 30, 30);
        scene.add(diver1);
        sceneObjects.push(diver1);

        var diver2 = createDiverFigure(-25, 25, 25);
        scene.add(diver2);
        sceneObjects.push(diver2);

        var diver3 = createDiverFigure(-35, 35, 35);
        scene.add(diver3);
        sceneObjects.push(diver3);

        // Burning fuel fire clusters (14)
        for (var i = 0; i < 6; i++) {
            var fireX = (Math.random() - 0.5) * 40;
            var fireZ = (Math.random() - 0.5) * 40;

            var fireClusterGeometry = new THREE.SphereGeometry(2, 12, 12);
            var fireClusterMaterial = new THREE.MeshStandardMaterial({
                color: 0xff5500,
                emissive: 0xff2200,
                emissiveIntensity: 2.5,
                roughness: 0.7
            });
            var fireCluster = new THREE.Mesh(fireClusterGeometry, fireClusterMaterial);
            fireCluster.position.set(fireX, 1, fireZ);
            fireCluster.castShadow = true;
            scene.add(fireCluster);
            sceneObjects.push(fireCluster);
        }

        // Emergency sprinkler (15)
        var sprinklerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 4);
        var sprinklerMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
        var sprinkler = new THREE.Mesh(sprinklerGeometry, sprinklerMaterial);
        sprinkler.position.set(-30, 10, -25);
        sprinkler.castShadow = true;
        scene.add(sprinkler);
        sceneObjects.push(sprinkler);

        var nozzleGeometry = new THREE.SphereGeometry(0.8, 6, 6);
        var nozzleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6 });
        var nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
        nozzle.position.set(-30, 15, -25);
        nozzle.castShadow = true;
        scene.add(nozzle);
        sceneObjects.push(nozzle);

        // Smoke column (17)
        var smokeGeometry = new THREE.CylinderGeometry(25, 25, 100, 8);
        var smokeMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            transparent: true,
            opacity: 0.3,
            roughness: 0.9
        });
        var smokeColumn = new THREE.Mesh(smokeGeometry, smokeMaterial);
        smokeColumn.position.set(-5, 50, 0);
        scene.add(smokeColumn);
        sceneObjects.push(smokeColumn);

        // HUD canvas setup
        canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        context2d = canvas.getContext('2d');

        var hudTexture = new THREE.CanvasTexture(canvas);
        var hudMaterial = new THREE.MeshBasicMaterial({ map: hudTexture });
        var hudGeometry = new THREE.PlaneGeometry(10, 5);
        var hudMesh = new THREE.Mesh(hudGeometry, hudMaterial);
        hudMesh.position.set(0, 0, -30);
        scene.add(hudMesh);
        sceneObjects.push(hudMesh);

        // Key event handlers
        document.addEventListener('keydown', function(e) {
            var now = Date.now();
            if (e.key === 'o' || e.key === 'O') {
                if (lastKeyPressed === 'o' && now - lastKeyTime < 400) {
                    lastKeyPressed = 'p';
                    lastKeyTime = now;
                } else {
                    lastKeyPressed = 'o';
                    lastKeyTime = now;
                }
            } else if ((e.key === 'p' || e.key === 'P') && lastKeyPressed === 'o' && now - lastKeyTime < 400) {
                hudVisible = !hudVisible;
                lastKeyPressed = null;
            }
        });

        updateHUD();
    }

    function createWorkerFigure(x, y, z) {
        var group = new THREE.Group();

        var bodyGeometry = new THREE.BoxGeometry(1, 2.5, 0.8);
        var bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.6 });
        var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        group.add(body);

        var headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        var headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99, roughness: 0.5 });
        var head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.7;
        head.castShadow = true;
        group.add(head);

        group.position.set(x, y, z);
        group.userData.isWorker = true;
        return group;
    }

    function createDiverFigure(x, y, z) {
        var group = new THREE.Group();

        var suitGeometry = new THREE.BoxGeometry(1.2, 2.8, 0.9);
        var suitMaterial = new THREE.MeshStandardMaterial({ color: 0x0088cc, roughness: 0.7 });
        var suit = new THREE.Mesh(suitGeometry, suitMaterial);
        suit.castShadow = true;
        group.add(suit);

        var helmetGeometry = new THREE.SphereGeometry(0.6, 8, 8);
        var helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x333366, roughness: 0.4 });
        var helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 1.8;
        helmet.castShadow = true;
        group.add(helmet);

        group.position.set(x, y, z);
        group.userData.isDiver = true;
        return group;
    }

    function updateHUD() {
        context2d.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context2d.fillRect(0, 0, canvas.width, canvas.height);

        context2d.fillStyle = '#00ff00';
        context2d.font = 'bold 24px monospace';
        context2d.fillText('WORKERS RESCUED: ' + workersRescued + '/4', 20, 50);
        context2d.fillText('WELLHEAD SEALED: ' + (wellheadSealed ? 'YES' : 'NO'), 20, 100);
        context2d.fillText('PLATFORM INTEGRITY: ' + platformIntegrity + '%', 20, 150);
        context2d.fillText('[O+P] HUD', 20, 200);

        var hudTexture = new THREE.CanvasTexture(canvas);
        scene.children.forEach(function(obj) {
            if (obj.material && obj.material.map === hudTexture) {
                obj.material.map = hudTexture;
                obj.material.map.needsUpdate = true;
            }
        });
    }

    function update() {
        var deltaTime = clock.getDelta();

        // Flare fire animation
        flareScale = 1 + (Math.sin(Date.now() * 0.003) * 0.3);
        var flareGroup = sceneObjects[4];
        if (flareGroup && flareGroup.children[1]) {
            flareGroup.children[1].scale.set(flareScale, flareScale, flareScale);
            flareGroup.children[1].material.emissiveIntensity = 2 + (Math.sin(Date.now() * 0.004) * 1);
        }

        // Wellhead geyser pulsing
        wellheadHeight = 5 + (Math.sin(Date.now() * 0.002) * 4);
        var wellheadGroup = sceneObjects[5];
        if (wellheadGroup && wellheadGroup.children[1]) {
            wellheadGroup.children[1].position.y = wellheadHeight;
            wellheadGroup.children[1].scale.y = 1 + (Math.abs(Math.sin(Date.now() * 0.003)) * 0.5);
        }

        // Helicopter rotor spin
        var helicopterGroup = sceneObjects[13];
        if (helicopterGroup && helicopterGroup.children[1]) {
            helicopterGroup.children[1].rotation.y += deltaTime * 15;
        }

        // Helicopter approach
        helicopterAngle += deltaTime * 0.3;
        if (helicopterGroup) {
            helicopterGroup.position.x = Math.cos(helicopterAngle) * helicopterDistance;
            helicopterGroup.position.z = -80 + (Math.sin(helicopterAngle) * 30);
            if (helicopterDistance > 30) {
                helicopterDistance -= deltaTime * 10;
            }
        }

        // Worker figures wave
        sceneObjects.forEach(function(obj) {
            if (obj.userData && obj.userData.isWorker) {
                obj.position.y = 10 + Math.sin(Date.now() * 0.005) * 1.5;
            }
        });

        // Smoke column expansion
        smokeHeight = 50 + (Math.sin(Date.now() * 0.0005) * 20);
        var smokeIdx = sceneObjects.length - 1;
        var smokeColumn = sceneObjects[smokeIdx];
        if (smokeColumn) {
            smokeColumn.scale.set(1 + (Math.sin(Date.now() * 0.0008) * 0.2), 1, 1 + (Math.sin(Date.now() * 0.0008) * 0.2));
        }

        // Burning fire flicker
        sceneObjects.forEach(function(obj) {
            if (obj.material && obj.material.emissive && !obj.userData.isWorker && !obj.userData.isDiver) {
                if (obj.material.emissiveIntensity !== undefined) {
                    var flicker = 1.5 + Math.random() * 1.5;
                    obj.material.emissiveIntensity = flicker;
                }
            }
        });

        // Sprinkler rotation
        var sprinklerIdx = sceneObjects.findIndex(function(obj) { return obj.position && obj.position.x === -30 && obj.position.y === 10; });
        if (sprinklerIdx !== -1) {
            sceneObjects[sprinklerIdx].rotation.z += deltaTime * 2;
        }

        renderer.render(scene, camera);
    }

    function reset() {
        sceneObjects.forEach(function(obj) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(function(m) { m.dispose(); });
                } else {
                    obj.material.dispose();
                }
            }
        });
        sceneObjects = [];

        if (canvas) canvas = null;
        if (context2d) context2d = null;
        if (scene) scene.clear();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
