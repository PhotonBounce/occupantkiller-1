// SewersEscape — FPS game module
// Activation: press S then E within 400ms
// Theme: Escape underground sewers hunted by a paramilitary kill squad

window.SewersEscape = (function () {
    'use strict';

    // ─── Core references ─────────────────────────────────────────────────────
    var scene, camera, renderer, clock;
    var gameActive = false;
    var gameWon = false;
    var gameLost = false;
    var hudCanvas, hudCtx;
    var container;

    // ─── Activation key sequence ──────────────────────────────────────────────
    var lastKeyS = 0;
    var activationHandler = null;

    // ─── Player state ─────────────────────────────────────────────────────────
    var player = {
        position: { x: 0, y: 1.7, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        hp: 100,
        maxHp: 100,
        ammo: 90,
        isRunning: false,
        isCrouching: false,
        inShallowWater: false,
        inDeepWater: false,
        oxygen: 100,
        oxygenMax: 100,
        detectionLevel: 0,
        noiseRadius: 5,
        lastShot: 0,
        shootCooldown: 0.25,
        interactCooldown: 0,
        checkpointsPassed: 0,
        dead: false
    };

    // ─── Input state ──────────────────────────────────────────────────────────
    var keys = {};
    var mouseDX = 0, mouseDY = 0;
    var mouseDown = false;
    var pointerLocked = false;

    // ─── Enemies ──────────────────────────────────────────────────────────────
    var enemies = [];

    // ─── Environment ──────────────────────────────────────────────────────────
    var tunnels = [];
    var chambers = [];
    var waterZones = [];
    var valves = [];
    var checkpoints = [];
    var exitManhole = null;
    var walls = [];           // collision boxes
    var floodedSections = []; // indices into waterZones

    // ─── Lights (flashlights carried by soldiers) ─────────────────────────────
    var flashlights = [];

    // ─── HUD ──────────────────────────────────────────────────────────────────
    var hud = {
        detectionAlpha: 0
    };

    // ─── Hunter Prime ─────────────────────────────────────────────────────────
    var hunterPrime = null;
    var hunterPrimeSpawned = false;
    var hunterPrimeDefeated = false;
    var hunterPrimeCheckpointIdx = 0;
    var hunterPrimeLastReveal = 0;

    // ─── Timers / delta ──────────────────────────────────────────────────────
    var totalTime = 0;
    var shootingRaycaster;
    var soundEvents = [];   // { x, y, z, radius, time }

    // ══════════════════════════════════════════════════════════════════════════
    //  INIT
    // ══════════════════════════════════════════════════════════════════════════
    function init(parentContainer) {
        container = parentContainer || document.body;

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050508);
        scene.fog = new THREE.Fog(0x050508, 8, 40);

        // Camera (FPS)
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
        camera.position.set(player.position.x, player.position.y, player.position.z);

        // Clock
        clock = new THREE.Clock();

        // Ambient — very dark sewer
        var ambient = new THREE.AmbientLight(0x111122, 0.3);
        scene.add(ambient);

        // Raycaster for shooting
        shootingRaycaster = new THREE.Raycaster();

        // HUD canvas
        hudCanvas = document.createElement('canvas');
        hudCanvas.width = window.innerWidth;
        hudCanvas.height = window.innerHeight;
        hudCanvas.style.position = 'absolute';
        hudCanvas.style.top = '0';
        hudCanvas.style.left = '0';
        hudCanvas.style.pointerEvents = 'none';
        container.style.position = 'relative';
        container.appendChild(hudCanvas);
        hudCtx = hudCanvas.getContext('2d');

        buildLevel();
        spawnEnemies();
        setupInput();
        setupPointerLock();

        window.addEventListener('resize', onResize);

        gameActive = true;
        gameWon = false;
        gameLost = false;
        player.dead = false;
        hunterPrimeDefeated = false;
        hunterPrimeCheckpointIdx = 0;
        hunterPrimeLastReveal = 0;
        totalTime = 0;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  LEVEL GENERATION
    // ══════════════════════════════════════════════════════════════════════════
    function buildLevel() {
        buildStartChamber();
        buildTunnel(0, 0, -30, 0, 60, 'z');       // Tunnel A (south)
        buildJunctionChamber(0, 0, -60);
        buildTunnel(-30, 0, -60, 60, 0, 'x');      // Tunnel B (east-west)
        buildTunnel(30, 0, -60, 0, 0, 'z');        // Tunnel C continues south
        buildTunnel(30, 0, -100, 0, 0, 'z');
        buildPumpStation(30, 0, -90);
        buildTunnel(-30, 0, -60, 0, 0, 'z');
        buildTunnel(-30, 0, -100, 0, 0, 'z');
        buildOverflowBasin(-30, 0, -85);
        buildJunctionChamber(0, 0, -130);
        buildTunnel(0, 0, -130, 0, 60, 'z');
        buildTunnel(0, 0, -160, 0, 0, 'z');
        buildMaintenanceArea(15, 0, -155);
        buildMaintenanceArea(-15, 0, -155);
        buildJunctionChamber(0, 0, -195);
        buildTunnel(0, 0, -195, 0, 50, 'z');
        buildPumpStation(12, 0, -210);
        buildPumpStation(-12, 0, -210);
        buildOverflowBasin(0, 0, -225);
        buildTunnel(0, 0, -240, 0, 30, 'z');
        buildExitManhole(0, 0, -265);

        buildCheckpoints();
        buildValves();
        buildGratedWalkways();
        buildFloor();
    }

    function buildFloor() {
        var floorGeo = new THREE.BoxGeometry(80, 0.2, 280);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(0, -0.1, -135);
        scene.add(floor);

        // Shallow water layer along main path
        var waterGeo = new THREE.BoxGeometry(4, 0.05, 270);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3a5a, transparent: true, opacity: 0.6 });
        var water = new THREE.Mesh(waterGeo, waterMat);
        water.position.set(0, 0.05, -130);
        scene.add(water);

        waterZones.push({ mesh: water, x: 0, z: -130, w: 4, d: 270, deep: false, flooded: false, floodLevel: 0 });
    }

    function buildStartChamber() {
        var geo = new THREE.BoxGeometry(14, 5, 16);
        var mat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0, 2.5, 0);
        scene.add(mesh);
        chambers.push({ mesh: mesh, x: 0, z: 0 });

        addWallBox(0, 2.5, 0, 14, 5, 16);

        // Spawn player inside
        player.position.x = 0;
        player.position.y = 1.7;
        player.position.z = 5;
    }

    function buildTunnel(cx, cy, cz, wx, wz, axis) {
        var length = (axis === 'z') ? wz || 60 : wx || 60;
        var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x353535 });

        // Arched passage: cylinder on its side
        var archGeo = new THREE.CylinderGeometry(2.5, 2.5, length, 8, 1, true);
        var arch = new THREE.Mesh(archGeo, tunnelMat);
        arch.position.set(cx, cy + 2.5, cz);
        if (axis === 'z') {
            arch.rotation.x = Math.PI / 2;
        }
        scene.add(arch);

        // Tunnel floor
        var floorGeo = new THREE.BoxGeometry(axis === 'z' ? 5 : length, 0.15, axis === 'z' ? length : 5);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(cx, cy, cz);
        scene.add(floor);

        tunnels.push({ mesh: arch, cx: cx, cz: cz, axis: axis, length: length });
        addWallBox(cx, cy + 2.5, cz, axis === 'z' ? 5 : length, 5, axis === 'z' ? length : 5);
    }

    function buildJunctionChamber(cx, cy, cz) {
        var geo = new THREE.BoxGeometry(16, 6, 16);
        var mat = new THREE.MeshLambertMaterial({ color: 0x393939 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cx, cy + 3, cz);
        scene.add(mesh);
        chambers.push({ mesh: mesh, x: cx, z: cz });
        addWallBox(cx, cy + 3, cz, 16, 6, 16);

        // Grated catwalk above water
        var walkGeo = new THREE.BoxGeometry(14, 0.1, 3);
        var walkMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var walk = new THREE.Mesh(walkGeo, walkMat);
        walk.position.set(cx, cy + 1.2, cz);
        scene.add(walk);
    }

    function buildPumpStation(cx, cy, cz) {
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var pumpMat = new THREE.MeshLambertMaterial({ color: 0x556655 });

        // Base platform
        var baseGeo = new THREE.BoxGeometry(10, 0.4, 10);
        var base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(cx, cy + 0.2, cz);
        scene.add(base);

        // Main pump cylinder
        var pumpGeo = new THREE.CylinderGeometry(1.2, 1.5, 4, 12);
        var pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(cx, cy + 2.2, cz);
        scene.add(pump);

        // Horizontal pipe
        var pipeGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        var pipe = new THREE.Mesh(pipeGeo, pumpMat);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(cx, cy + 3, cz);
        scene.add(pipe);

        // Vertical outlet pipe
        var outGeo = new THREE.CylinderGeometry(0.25, 0.25, 3, 8);
        var out = new THREE.Mesh(outGeo, pumpMat);
        out.position.set(cx + 3.5, cy + 2.5, cz);
        scene.add(out);

        // Point light glow on pump (amber)
        var pumpLight = new THREE.PointLight(0xffaa44, 0.8, 10);
        pumpLight.position.set(cx, cy + 4, cz);
        scene.add(pumpLight);
    }

    function buildOverflowBasin(cx, cy, cz) {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x2e2e2e });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x0d2a45, transparent: true, opacity: 0.8 });

        // Basin walls
        var wallN = new THREE.BoxGeometry(12, 5, 0.4);
        var mN = new THREE.Mesh(wallN, wallMat);
        mN.position.set(cx, cy + 2.5, cz - 5);
        scene.add(mN);
        addWallBox(cx, cy + 2.5, cz - 5, 12, 5, 0.4);

        var mS = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.4), wallMat);
        mS.position.set(cx, cy + 2.5, cz + 5);
        scene.add(mS);
        addWallBox(cx, cy + 2.5, cz + 5, 12, 5, 0.4);

        var mW = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 10), wallMat);
        mW.position.set(cx - 6, cy + 2.5, cz);
        scene.add(mW);
        addWallBox(cx - 6, cy + 2.5, cz, 0.4, 5, 10);

        var mE = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 10), wallMat);
        mE.position.set(cx + 6, cy + 2.5, cz);
        scene.add(mE);
        addWallBox(cx + 6, cy + 2.5, cz, 0.4, 5, 10);

        // Deep water fill
        var waterGeo = new THREE.BoxGeometry(11.2, 3.5, 9.2);
        var waterMesh = new THREE.Mesh(waterGeo, waterMat);
        waterMesh.position.set(cx, cy + 1.75, cz);
        scene.add(waterMesh);

        waterZones.push({ mesh: waterMesh, x: cx, z: cz, w: 11.2, d: 9.2, deep: true, flooded: false, floodLevel: 1.75 });
    }

    function buildMaintenanceArea(cx, cy, cz) {
        var mat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
        var roomGeo = new THREE.BoxGeometry(8, 5, 10);
        var room = new THREE.Mesh(roomGeo, mat);
        room.position.set(cx, cy + 2.5, cz);
        scene.add(room);
        addWallBox(cx, cy + 2.5, cz, 8, 5, 10);

        // Ladder frame
        var frameMat = new THREE.MeshLambertMaterial({ color: 0x885533 });
        var frameGeo = new THREE.BoxGeometry(0.1, 4, 0.1);
        var frameL = new THREE.Mesh(frameGeo, frameMat);
        frameL.position.set(cx - 0.4, cy + 2, cz + 3);
        scene.add(frameL);

        var frameR = new THREE.Mesh(frameGeo.clone(), frameMat);
        frameR.position.set(cx + 0.4, cy + 2, cz + 3);
        scene.add(frameR);

        // Ladder rungs
        for (var r = 0; r < 6; r++) {
            var rungGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
            var rung = new THREE.Mesh(rungGeo, frameMat);
            rung.rotation.z = Math.PI / 2;
            rung.position.set(cx, cy + 0.5 + r * 0.6, cz + 3);
            scene.add(rung);
        }

        // Tool storage box
        var storageGeo = new THREE.BoxGeometry(1.5, 1, 2);
        var storageMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
        var storage = new THREE.Mesh(storageGeo, storageMat);
        storage.position.set(cx - 2.5, cy + 0.5, cz - 3);
        scene.add(storage);
    }

    function buildExitManhole(cx, cy, cz) {
        var mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var shaftGeo = new THREE.CylinderGeometry(1.2, 1.2, 8, 12, 1, true);
        var shaft = new THREE.Mesh(shaftGeo, mat);
        shaft.position.set(cx, cy + 4, cz);
        scene.add(shaft);

        // Ladder rungs up the shaft
        for (var i = 0; i < 10; i++) {
            var rungGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 6);
            var rungMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var rung = new THREE.Mesh(rungGeo, rungMat);
            rung.rotation.z = Math.PI / 2;
            rung.position.set(cx, cy + 0.5 + i * 0.8, cz);
            scene.add(rung);
        }

        // Manhole cover (top) glowing with faint light-leak
        var coverGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.15, 12);
        var coverMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var cover = new THREE.Mesh(coverGeo, coverMat);
        cover.position.set(cx, cy + 8.1, cz);
        scene.add(cover);

        // Faint light from above
        var exitLight = new THREE.PointLight(0xaaddff, 1.5, 12);
        exitLight.position.set(cx, cy + 7.5, cz);
        scene.add(exitLight);

        exitManhole = { x: cx, y: cy + 1, z: cz, radius: 2 };
    }

    function buildCheckpoints() {
        var positions = [
            { x: 0, y: 0, z: -65 },
            { x: 0, y: 0, z: -135 },
            { x: 0, y: 0, z: -200 }
        ];
        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            var geo = new THREE.BoxGeometry(4, 4, 0.2);
            var mat = new THREE.MeshLambertMaterial({ color: 0x00ff44, transparent: true, opacity: 0.3 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(p.x, p.y + 2, p.z);
            scene.add(mesh);
            checkpoints.push({ mesh: mesh, x: p.x, y: p.y, z: p.z, passed: false });
        }
    }

    function buildValves() {
        var positions = [
            { x: 5, y: 1, z: -60 },
            { x: -5, y: 1, z: -130 },
            { x: 5, y: 1, z: -200 }
        ];
        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            var handleGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 8);
            var handleMat = new THREE.MeshLambertMaterial({ color: 0xff4400 });
            var handle = new THREE.Mesh(handleGeo, handleMat);
            handle.position.set(p.x, p.y, p.z);
            scene.add(handle);

            var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.05, 8, 1, true);
            var wheel = new THREE.Mesh(wheelGeo, handleMat);
            wheel.position.set(p.x, p.y, p.z);
            scene.add(wheel);

            valves.push({
                mesh: handle,
                x: p.x, y: p.y, z: p.z,
                activated: false,
                activateTimer: 0,
                activating: false,
                linkedWaterZoneIdx: i
            });
        }
    }

    function buildGratedWalkways() {
        // LineSegments for grated walkways in junction chambers
        var positions = [
            { x: 0, y: 1.3, z: -60 },
            { x: 0, y: 1.3, z: -130 },
            { x: 0, y: 1.3, z: -195 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var p = positions[i];
            var pts = [];
            var cols = [];
            // Grid pattern 6x6
            for (var gx = -3; gx <= 3; gx++) {
                pts.push(gx, 0, -3, gx, 0, 3);
                cols.push(0.4, 0.4, 0.4, 0.4, 0.4, 0.4);
            }
            for (var gz = -3; gz <= 3; gz++) {
                pts.push(-3, 0, gz, 3, 0, gz);
                cols.push(0.4, 0.4, 0.4, 0.4, 0.4, 0.4);
            }

            var geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
            var mat = new THREE.LineBasicMaterial({ vertexColors: true });
            var lines = new THREE.LineSegments(geo, mat);
            lines.position.set(p.x, p.y, p.z);
            scene.add(lines);
        }
    }

    function addWallBox(cx, cy, cz, w, h, d) {
        walls.push({ cx: cx, cy: cy, cz: cz, hw: w / 2, hh: h / 2, hd: d / 2 });
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ENEMY SPAWNING
    // ══════════════════════════════════════════════════════════════════════════
    function spawnEnemies() {
        enemies = [];
        flashlights = [];

        // 14 soldiers
        var soldierPositions = [
            { x: 3, z: -15 }, { x: -3, z: -25 }, { x: 2, z: -45 },
            { x: -2, z: -55 }, { x: 4, z: -70 }, { x: -4, z: -85 },
            { x: 2, z: -100 }, { x: -2, z: -115 }, { x: 3, z: -140 },
            { x: -3, z: -158 }, { x: 2, z: -170 }, { x: -2, z: -185 },
            { x: 3, z: -210 }, { x: -3, z: -230 }
        ];

        for (var i = 0; i < 14; i++) {
            var sp = soldierPositions[i];
            var soldier = createSoldier(sp.x, 0, sp.z);
            enemies.push(soldier);
        }

        // 4 attack dogs
        var dogPositions = [
            { x: 2, z: -50 },
            { x: -2, z: -110 },
            { x: 2, z: -170 },
            { x: -2, z: -235 }
        ];

        for (var d = 0; d < 4; d++) {
            var dp = dogPositions[d];
            var dog = createDog(dp.x, 0, dp.z);
            enemies.push(dog);
        }

        // Hunter Prime (initially inactive, spawns at checkpoints)
        hunterPrime = createHunterPrime(-100, -100, -100); // off-screen
        hunterPrime.active = false;
        enemies.push(hunterPrime);
    }

    function createSoldier(x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: 0x334433 });

        // Body
        var bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
        var body = new THREE.Mesh(bodyGeo, mat);
        body.position.set(x, y + 1.0, z);
        scene.add(body);

        // Head
        var headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        var head = new THREE.Mesh(headGeo, mat);
        head.position.set(x, y + 1.7, z);
        scene.add(head);

        // Night-vision goggles (green cylinders)
        var goggleMat = new THREE.MeshLambertMaterial({ color: 0x44ff44 });
        var gogGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.15, 6);
        var gogL = new THREE.Mesh(gogGeo, goggleMat);
        gogL.rotation.x = Math.PI / 2;
        gogL.position.set(x - 0.1, y + 1.75, z - 0.21);
        scene.add(gogL);
        var gogR = new THREE.Mesh(gogGeo.clone(), goggleMat);
        gogR.rotation.x = Math.PI / 2;
        gogR.position.set(x + 0.1, y + 1.75, z - 0.21);
        scene.add(gogR);

        // Flashlight
        var fl = new THREE.PointLight(0xffffff, 1.2, 18);
        fl.position.set(x, y + 1.5, z - 0.3);
        scene.add(fl);
        flashlights.push(fl);

        var enemy = {
            type: 'soldier',
            body: body,
            head: head,
            gogL: gogL,
            gogR: gogR,
            flashlight: fl,
            x: x, y: y, z: z,
            hp: 85,
            maxHp: 85,
            speed: 3.5,
            active: true,
            dead: false,
            state: 'patrol',       // patrol | alert | chase | search
            alertLevel: 0,
            patrolDir: (Math.random() > 0.5) ? 1 : -1,
            patrolTimer: 0,
            detectedPlayer: false,
            lastHeardX: x, lastHeardZ: z,
            angle: Math.random() * Math.PI * 2
        };
        return enemy;
    }

    function createDog(x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: 0x664422 });

        var bodyGeo = new THREE.BoxGeometry(0.7, 0.5, 1.0);
        var body = new THREE.Mesh(bodyGeo, mat);
        body.position.set(x, y + 0.4, z);
        scene.add(body);

        var headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.4);
        var head = new THREE.Mesh(headGeo, mat);
        head.position.set(x, y + 0.75, z - 0.5);
        scene.add(head);

        var enemy = {
            type: 'dog',
            body: body,
            head: head,
            flashlight: null,
            x: x, y: y, z: z,
            hp: 45,
            maxHp: 45,
            speed: 6.5,
            active: true,
            dead: false,
            state: 'patrol',
            alertLevel: 0,
            patrolDir: 1,
            patrolTimer: 0,
            detectedPlayer: false,
            lastHeardX: x, lastHeardZ: z,
            angle: Math.random() * Math.PI * 2,
            attackCooldown: 0
        };
        return enemy;
    }

    function createHunterPrime(x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: 0x223322 });

        var bodyGeo = new THREE.BoxGeometry(0.75, 1.2, 0.5);
        var body = new THREE.Mesh(bodyGeo, mat);
        body.position.set(x, y + 1.2, z);
        scene.add(body);

        var headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        var head = new THREE.Mesh(headGeo, mat);
        head.position.set(x, y + 2.0, z);
        scene.add(head);

        // Thermal visor — red
        var visorMat = new THREE.MeshLambertMaterial({ color: 0xff2200 });
        var visorGeo = new THREE.BoxGeometry(0.5, 0.15, 0.1);
        var visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(x, y + 2.05, z - 0.26);
        scene.add(visor);

        var fl = new THREE.PointLight(0xff4400, 2.0, 25);
        fl.position.set(x, y + 2, z);
        scene.add(fl);
        flashlights.push(fl);

        var hp = {
            type: 'hunter',
            body: body,
            head: head,
            visor: visor,
            flashlight: fl,
            x: x, y: 0, z: z,
            hp: 500,
            maxHp: 500,
            speed: 4.5,
            active: false,
            dead: false,
            state: 'hunt',
            alertLevel: 100,
            detectedPlayer: true,
            lastHeardX: x, lastHeardZ: z,
            angle: 0,
            attackCooldown: 0
        };
        return hp;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  INPUT SETUP
    // ══════════════════════════════════════════════════════════════════════════
    function setupInput() {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);

        activationHandler = function (e) {
            if (e.key === 'S' || e.key === 's') {
                lastKeyS = Date.now();
            } else if ((e.key === 'E' || e.key === 'e') && !gameActive) {
                if (Date.now() - lastKeyS < 400) {
                    // restart
                    reset();
                    init(container);
                }
            }
        };
        document.addEventListener('keydown', activationHandler);
    }

    function setupPointerLock() {
        renderer.domElement.addEventListener('click', function () {
            if (!pointerLocked) {
                renderer.domElement.requestPointerLock();
            }
        });
        document.addEventListener('pointerlockchange', function () {
            pointerLocked = (document.pointerLockElement === renderer.domElement);
        });
    }

    function onKeyDown(e) {
        keys[e.code] = true;
        if (e.code === 'KeyE') {
            tryInteract();
        }
    }

    function onKeyUp(e) {
        keys[e.code] = false;
    }

    function onMouseDown(e) {
        if (e.button === 0) mouseDown = true;
    }

    function onMouseUp(e) {
        if (e.button === 0) mouseDown = false;
    }

    function onMouseMove(e) {
        if (pointerLocked) {
            mouseDX += e.movementX || 0;
            mouseDY += e.movementY || 0;
        }
    }

    function tryInteract() {
        if (!gameActive || player.dead) return;
        // Check valves
        for (var i = 0; i < valves.length; i++) {
            var v = valves[i];
            if (v.activated) continue;
            var dx = player.position.x - v.x;
            var dz = player.position.z - v.z;
            if (Math.sqrt(dx * dx + dz * dz) < 2.5) {
                v.activating = true;
                v.activateTimer = 0;
                break;
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  UPDATE — main loop
    // ══════════════════════════════════════════════════════════════════════════
    function update() {
        if (!gameActive) return;
        var dt = clock.getDelta();
        dt = Math.min(dt, 0.05); // cap delta
        totalTime += dt;

        if (gameLost || gameWon) {
            drawHUD(dt);
            renderer.render(scene, camera);
            return;
        }

        updatePlayer(dt);
        updateSoundEvents(dt);
        updateEnemies(dt);
        updateValves(dt);
        updateWaterMechanics();
        updateCheckpoints();
        updateHunterPrime(dt);
        updateFlashLights();
        checkWinLoss();
        drawHUD(dt);

        renderer.render(scene, camera);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  PLAYER UPDATE
    // ══════════════════════════════════════════════════════════════════════════
    function updatePlayer(dt) {
        if (player.dead) return;

        // Mouse look
        var sensitivity = 0.002;
        player.yaw -= mouseDX * sensitivity;
        player.pitch -= mouseDY * sensitivity;
        player.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, player.pitch));
        mouseDX = 0;
        mouseDY = 0;

        // Movement
        var forward = { x: Math.sin(player.yaw), z: Math.cos(player.yaw) };
        var right = { x: Math.cos(player.yaw), z: -Math.sin(player.yaw) };

        var moveX = 0, moveZ = 0;
        if (keys['KeyW'] || keys['ArrowUp']) { moveX += forward.x; moveZ += forward.z; }
        if (keys['KeyS'] || keys['ArrowDown']) { moveX -= forward.x; moveZ -= forward.z; }
        if (keys['KeyA'] || keys['ArrowLeft']) { moveX -= right.x; moveZ -= right.z; }
        if (keys['KeyD'] || keys['ArrowRight']) { moveX += right.x; moveZ += right.z; }

        var moving = (moveX !== 0 || moveZ !== 0);
        player.isRunning = moving && keys['ShiftLeft'];

        var speed = 5.5;
        if (player.isRunning) speed = 9;
        if (player.inShallowWater) speed *= 0.8;
        if (player.inDeepWater) speed *= 0.45;

        // Noise generation
        if (moving) {
            player.noiseRadius = player.isRunning ? 20 : 5;
            if (player.isRunning || Math.random() < 0.05) {
                soundEvents.push({ x: player.position.x, y: player.position.y, z: player.position.z, radius: player.noiseRadius, time: 0.8 });
            }
        } else {
            player.noiseRadius = 0;
        }

        // Normalize diagonal
        var len = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (len > 0) { moveX /= len; moveZ /= len; }

        var newX = player.position.x + moveX * speed * dt;
        var newZ = player.position.z + moveZ * speed * dt;

        // Simple AABB collision with walls
        if (!collidesWithWalls(newX, player.position.y, player.position.z, 0.35)) {
            player.position.x = newX;
        }
        if (!collidesWithWalls(player.position.x, player.position.y, newZ, 0.35)) {
            player.position.z = newZ;
        }

        // Keep player on floor (simplified)
        player.position.y = 1.7;

        // Shooting
        if (mouseDown && !player.inDeepWater) {
            var now = totalTime;
            if (now - player.lastShot > player.shootCooldown && player.ammo > 0) {
                shoot();
                player.lastShot = now;
                player.ammo--;
                // Shooting makes noise
                soundEvents.push({ x: player.position.x, y: player.position.y, z: player.position.z, radius: 30, time: 2.0 });
            }
        }

        // Update camera
        camera.position.set(player.position.x, player.position.y, player.position.z);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = player.yaw;
        camera.rotation.x = player.pitch;

        // Oxygen tracking in deep water
        if (player.inDeepWater) {
            player.oxygen -= dt * 15;
            if (player.oxygen <= 0) {
                player.oxygen = 0;
                player.hp -= dt * 20;
                if (player.hp <= 0) {
                    player.hp = 0;
                    player.dead = true;
                    gameLost = true;
                }
            }
        } else {
            player.oxygen = Math.min(player.oxygenMax, player.oxygen + dt * 30);
        }

        // Detection level decay
        player.detectionLevel = Math.max(0, player.detectionLevel - dt * 5);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  SHOOTING / COMBAT
    // ══════════════════════════════════════════════════════════════════════════
    function shoot() {
        var dir = new THREE.Vector3(0, 0, -1);
        dir.applyEuler(new THREE.Euler(camera.rotation.x, camera.rotation.y, camera.rotation.z, 'YXZ'));
        shootingRaycaster.set(camera.position, dir);

        var meshes = [];
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (e.dead || !e.active) continue;
            meshes.push(e.body);
            meshes.push(e.head);
        }

        var hits = shootingRaycaster.intersectObjects(meshes, false);
        if (hits.length > 0) {
            var hitObj = hits[0].object;
            for (var j = 0; j < enemies.length; j++) {
                var en = enemies[j];
                if (en.dead) continue;
                if (en.body === hitObj || en.head === hitObj) {
                    var dmg = (hitObj === en.head) ? 50 : 25;
                    en.hp -= dmg;
                    en.state = 'chase';
                    en.detectedPlayer = true;
                    if (en.hp <= 0) {
                        killEnemy(en);
                    }
                    break;
                }
            }
        }
    }

    function killEnemy(e) {
        e.dead = true;
        e.active = false;
        // Hide meshes
        e.body.visible = false;
        if (e.head) e.head.visible = false;
        if (e.gogL) e.gogL.visible = false;
        if (e.gogR) e.gogR.visible = false;
        if (e.visor) e.visor.visible = false;
        if (e.flashlight) e.flashlight.visible = false;

        if (e.type === 'hunter') {
            hunterPrimeDefeated = true;
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  SOUND EVENTS
    // ══════════════════════════════════════════════════════════════════════════
    function updateSoundEvents(dt) {
        for (var i = soundEvents.length - 1; i >= 0; i--) {
            soundEvents[i].time -= dt;
            if (soundEvents[i].time <= 0) {
                soundEvents.splice(i, 1);
            }
        }
    }

    function canHearSound(ex, ez) {
        for (var i = 0; i < soundEvents.length; i++) {
            var se = soundEvents[i];
            var dx = ex - se.x;
            var dz = ez - se.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= se.radius) {
                return { heard: true, sx: se.x, sz: se.z };
            }
        }
        return { heard: false };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ENEMY AI
    // ══════════════════════════════════════════════════════════════════════════
    function updateEnemies(dt) {
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (e.dead || !e.active) continue;
            if (e.type === 'hunter') continue; // handled separately

            updateEnemy(e, dt);
        }
    }

    function updateEnemy(e, dt) {
        var dx = player.position.x - e.x;
        var dy = player.position.y - e.y;
        var dz = player.position.z - e.z;
        var distToPlayer = Math.sqrt(dx * dx + dz * dz);

        // Dogs detect player at 15 units
        if (e.type === 'dog') {
            if (distToPlayer < 15) {
                e.state = 'chase';
                e.detectedPlayer = true;
            }
        }

        // Sound detection
        var soundInfo = canHearSound(e.x, e.z);
        if (soundInfo.heard) {
            e.lastHeardX = soundInfo.sx;
            e.lastHeardZ = soundInfo.sz;
            if (e.state === 'patrol') e.state = 'alert';
        }

        // Line of sight check (soldier only, simplified by distance + angle)
        if (e.type === 'soldier') {
            if (distToPlayer < 12) {
                // Check roughly facing player
                var toPlayerAngle = Math.atan2(dx, dz);
                var angleDiff = Math.abs(normalizeAngle(toPlayerAngle - e.angle));
                if (angleDiff < Math.PI / 2) {
                    e.state = 'chase';
                    e.detectedPlayer = true;
                    e.alertLevel = Math.min(100, e.alertLevel + dt * 50);
                    player.detectionLevel = Math.min(100, player.detectionLevel + dt * 30);
                }
            }
        }

        // State machine
        if (e.state === 'patrol') {
            e.patrolTimer -= dt;
            if (e.patrolTimer <= 0) {
                e.patrolTimer = 2 + Math.random() * 3;
                e.angle += (Math.random() - 0.5) * Math.PI;
            }
            var px = Math.sin(e.angle) * e.speed * dt * 0.5;
            var pz = Math.cos(e.angle) * e.speed * dt * 0.5;
            e.x += px;
            e.z += pz;

        } else if (e.state === 'alert') {
            // Move toward last heard sound
            var hdx = e.lastHeardX - e.x;
            var hdz = e.lastHeardZ - e.z;
            var hdist = Math.sqrt(hdx * hdx + hdz * hdz);
            if (hdist > 1) {
                e.x += (hdx / hdist) * e.speed * dt * 0.7;
                e.z += (hdz / hdist) * e.speed * dt * 0.7;
                e.angle = Math.atan2(hdx, hdz);
            } else {
                e.state = 'patrol';
                e.alertLevel = Math.max(0, e.alertLevel - dt * 10);
            }

        } else if (e.state === 'chase') {
            if (distToPlayer < 0.0001) { distToPlayer = 0.0001; }
            e.x += (dx / distToPlayer) * e.speed * dt;
            e.z += (dz / distToPlayer) * e.speed * dt;
            e.angle = Math.atan2(dx, dz);

            // Attack
            if (e.type === 'dog') {
                e.attackCooldown -= dt;
                if (distToPlayer < 1.5 && e.attackCooldown <= 0) {
                    player.hp -= 15;
                    e.attackCooldown = 1.2;
                    if (player.hp <= 0) { player.dead = true; gameLost = true; }
                }
            } else {
                // Soldier shoots player
                if (distToPlayer < 20) {
                    if (!e.attackCooldown) e.attackCooldown = 0;
                    e.attackCooldown -= dt;
                    if (e.attackCooldown <= 0) {
                        var hitChance = 0.3 - (distToPlayer * 0.01);
                        if (Math.random() < hitChance) {
                            player.hp -= 10;
                            if (player.hp <= 0) { player.dead = true; gameLost = true; }
                        }
                        e.attackCooldown = 1.5;
                    }
                }
            }

            // If player gets far enough and no recent sound, switch to search
            if (distToPlayer > 25) {
                e.state = 'search';
                e.lastHeardX = player.position.x;
                e.lastHeardZ = player.position.z;
            }
        } else if (e.state === 'search') {
            var sdx = e.lastHeardX - e.x;
            var sdz = e.lastHeardZ - e.z;
            var sdist = Math.sqrt(sdx * sdx + sdz * sdz);
            if (sdist > 1) {
                e.x += (sdx / sdist) * e.speed * dt * 0.6;
                e.z += (sdz / sdist) * e.speed * dt * 0.6;
                e.angle = Math.atan2(sdx, sdz);
            } else {
                e.state = 'patrol';
            }
        }

        // Update mesh positions
        e.body.position.set(e.x, e.y + (e.type === 'dog' ? 0.4 : 1.0), e.z);
        if (e.head) e.head.position.set(e.x, e.y + (e.type === 'dog' ? 0.75 : 1.7), e.z - (e.type === 'dog' ? 0.5 : 0));
        if (e.gogL) e.gogL.position.set(e.x - 0.1, e.y + 1.75, e.z - 0.21);
        if (e.gogR) e.gogR.position.set(e.x + 0.1, e.y + 1.75, e.z - 0.21);
        if (e.flashlight) {
            e.flashlight.position.set(e.x, e.y + 1.5, e.z);
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  HUNTER PRIME
    // ══════════════════════════════════════════════════════════════════════════
    function updateHunterPrime(dt) {
        if (!hunterPrime || hunterPrimeDefeated) return;

        // Spawn when player passes first checkpoint
        if (!hunterPrimeSpawned && player.checkpointsPassed >= 1) {
            hunterPrimeSpawned = true;
            hunterPrime.active = true;
            teleportHunter(checkpoints[1].x, 0, checkpoints[1].z - 5);
        }

        if (!hunterPrime.active) return;

        // Thermal vision: every 30s reveal player position to Hunter Prime
        hunterPrimeLastReveal += dt;
        if (hunterPrimeLastReveal >= 30) {
            hunterPrimeLastReveal = 0;
            hunterPrime.lastHeardX = player.position.x;
            hunterPrime.lastHeardZ = player.position.z;
        }

        // Teleport to block checkpoint
        if (player.checkpointsPassed >= 2 && hunterPrimeCheckpointIdx < 2) {
            hunterPrimeCheckpointIdx = 2;
            teleportHunter(checkpoints[2].x, 0, checkpoints[2].z - 8);
        } else if (player.checkpointsPassed >= 1 && hunterPrimeCheckpointIdx < 1) {
            hunterPrimeCheckpointIdx = 1;
            teleportHunter(checkpoints[1].x, 0, checkpoints[1].z - 8);
        }

        // Always chase player
        var dx = player.position.x - hunterPrime.x;
        var dz = player.position.z - hunterPrime.z;
        var dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 0.01) {
            hunterPrime.x += (dx / dist) * hunterPrime.speed * dt;
            hunterPrime.z += (dz / dist) * hunterPrime.speed * dt;
            hunterPrime.angle = Math.atan2(dx, dz);
        }

        // Attack
        hunterPrime.attackCooldown -= dt;
        if (dist < 2 && hunterPrime.attackCooldown <= 0) {
            player.hp -= 30;
            hunterPrime.attackCooldown = 1.0;
            if (player.hp <= 0) { player.dead = true; gameLost = true; }
        }
        // Long-range shot
        if (dist < 20 && hunterPrime.attackCooldown <= 0) {
            if (Math.random() < 0.4) {
                player.hp -= 18;
                if (player.hp <= 0) { player.dead = true; gameLost = true; }
            }
            hunterPrime.attackCooldown = 2.0;
        }

        // Update meshes
        hunterPrime.body.position.set(hunterPrime.x, hunterPrime.y + 1.2, hunterPrime.z);
        hunterPrime.head.position.set(hunterPrime.x, hunterPrime.y + 2.0, hunterPrime.z);
        hunterPrime.visor.position.set(hunterPrime.x, hunterPrime.y + 2.05, hunterPrime.z - 0.26);
        hunterPrime.flashlight.position.set(hunterPrime.x, hunterPrime.y + 2, hunterPrime.z);

        player.detectionLevel = Math.min(100, player.detectionLevel + dt * 3);
    }

    function teleportHunter(x, y, z) {
        hunterPrime.x = x;
        hunterPrime.y = y;
        hunterPrime.z = z;
        hunterPrime.body.position.set(x, y + 1.2, z);
        hunterPrime.head.position.set(x, y + 2.0, z);
        hunterPrime.visor.position.set(x, y + 2.05, z - 0.26);
        hunterPrime.flashlight.position.set(x, y + 2, z);
        hunterPrime.body.visible = true;
        hunterPrime.head.visible = true;
        hunterPrime.visor.visible = true;
        hunterPrime.flashlight.visible = true;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  WATER MECHANICS
    // ══════════════════════════════════════════════════════════════════════════
    function updateWaterMechanics() {
        player.inShallowWater = false;
        player.inDeepWater = false;

        for (var i = 0; i < waterZones.length; i++) {
            var wz = waterZones[i];
            var inX = Math.abs(player.position.x - wz.x) < wz.w / 2;
            var inZ = Math.abs(player.position.z - wz.z) < wz.d / 2;
            if (inX && inZ) {
                if (wz.deep) {
                    player.inDeepWater = true;
                } else {
                    player.inShallowWater = true;
                }
            }
        }

        // Flooded sections push enemies back
        for (var fi = 0; fi < floodedSections.length; fi++) {
            var fwz = waterZones[floodedSections[fi]];
            for (var ei = 0; ei < enemies.length; ei++) {
                var en = enemies[ei];
                if (en.dead || !en.active) continue;
                var ex = Math.abs(en.x - fwz.x) < fwz.w / 2;
                var ez = Math.abs(en.z - fwz.z) < fwz.d / 2;
                if (ex && ez) {
                    // Push enemy away from flood center
                    var pdx = en.x - fwz.x;
                    var pdz = en.z - fwz.z;
                    var pd = Math.sqrt(pdx * pdx + pdz * pdz) + 0.01;
                    en.x += (pdx / pd) * 2;
                    en.z += (pdz / pd) * 2;
                    en.state = 'patrol'; // disrupted
                }
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  VALVE UPDATE
    // ══════════════════════════════════════════════════════════════════════════
    function updateValves(dt) {
        for (var i = 0; i < valves.length; i++) {
            var v = valves[i];
            if (!v.activating || v.activated) continue;

            v.activateTimer += dt;
            // Spin wheel while holding E
            v.mesh.rotation.y += dt * 3;

            if (v.activateTimer >= 2.0) {
                v.activated = true;
                v.activating = false;

                // Flood linked water zone
                var wzIdx = v.linkedWaterZoneIdx;
                if (wzIdx < waterZones.length) {
                    waterZones[wzIdx].flooded = true;
                    waterZones[wzIdx].mesh.scale.y = 3;
                    waterZones[wzIdx].mesh.position.y += 1.5;
                    floodedSections.push(wzIdx);
                }
            }

            // If player releases E, cancel
            if (!keys['KeyE']) {
                v.activating = false;
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  CHECKPOINTS
    // ══════════════════════════════════════════════════════════════════════════
    function updateCheckpoints() {
        for (var i = 0; i < checkpoints.length; i++) {
            var cp = checkpoints[i];
            if (cp.passed) continue;
            var dx = player.position.x - cp.x;
            var dz = player.position.z - cp.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < 3) {
                cp.passed = true;
                player.checkpointsPassed++;
                cp.mesh.material.color.setHex(0xffffff);
                cp.mesh.material.opacity = 0.1;
            }

            // Pulse checkpoint color
            var pulse = 0.3 + 0.2 * Math.sin(totalTime * 3);
            if (!cp.passed) {
                cp.mesh.material.opacity = pulse;
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  FLASHLIGHTS
    // ══════════════════════════════════════════════════════════════════════════
    function updateFlashLights() {
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (!e.flashlight) continue;
            if (e.dead || !e.active) {
                e.flashlight.visible = false;
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  WIN / LOSS
    // ══════════════════════════════════════════════════════════════════════════
    function checkWinLoss() {
        if (player.dead) {
            gameLost = true;
            return;
        }

        // Win: all 3 checkpoints passed + Hunter Prime defeated + reach exit
        if (exitManhole && !gameWon) {
            var dx = player.position.x - exitManhole.x;
            var dz = player.position.z - exitManhole.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < exitManhole.radius && player.checkpointsPassed >= 3 && hunterPrimeDefeated) {
                gameWon = true;
                gameActive = false;
            }
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  COLLISION
    // ══════════════════════════════════════════════════════════════════════════
    function collidesWithWalls(x, y, z, radius) {
        // Very simplified: keep player within the level bounds
        if (x < -8 || x > 8) return true;
        if (z > 8 || z < -270) return true;
        return false;
    }

    function normalizeAngle(a) {
        while (a > Math.PI) a -= 2 * Math.PI;
        while (a < -Math.PI) a += 2 * Math.PI;
        return a;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  HUD
    // ══════════════════════════════════════════════════════════════════════════
    function drawHUD(dt) {
        var w = hudCanvas.width;
        var h = hudCanvas.height;
        hudCtx.clearRect(0, 0, w, h);

        if (gameWon) {
            drawScreen('ESCAPED!', 'You escaped the sewers.', '#00ff88');
            return;
        }
        if (gameLost) {
            drawScreen('YOU DIED', 'The kill squad got you.', '#ff2222');
            return;
        }

        // Crosshair
        hudCtx.strokeStyle = 'rgba(255,255,255,0.8)';
        hudCtx.lineWidth = 1.5;
        hudCtx.beginPath();
        hudCtx.moveTo(w / 2 - 10, h / 2);
        hudCtx.lineTo(w / 2 + 10, h / 2);
        hudCtx.moveTo(w / 2, h / 2 - 10);
        hudCtx.lineTo(w / 2, h / 2 + 10);
        hudCtx.stroke();

        // HP bar
        drawBar(20, h - 80, 200, 18, player.hp / player.maxHp, '#cc2222', '#550000', 'HP');

        // Ammo
        hudCtx.fillStyle = '#dddddd';
        hudCtx.font = '16px monospace';
        hudCtx.fillText('AMMO: ' + player.ammo, 20, h - 45);

        // Checkpoints
        hudCtx.fillStyle = '#00ff88';
        hudCtx.font = 'bold 17px monospace';
        hudCtx.fillText('CHECKPOINTS: ' + player.checkpointsPassed + '/3', w / 2 - 90, 35);

        // Detection level
        drawBar(w - 220, h - 80, 200, 18, player.detectionLevel / 100, '#ff8800', '#442200', 'DETECTION');

        // Hunter Prime status
        if (hunterPrimeSpawned && !hunterPrimeDefeated) {
            hudCtx.fillStyle = '#ff2200';
            hudCtx.font = 'bold 15px monospace';
            hudCtx.fillText('HUNTER PRIME: ACTIVE', w - 220, 35);
            var hpRatio = hunterPrime.hp / hunterPrime.maxHp;
            drawBar(w - 220, 45, 200, 14, hpRatio, '#ff2200', '#440000', 'HP');
        } else if (hunterPrimeDefeated) {
            hudCtx.fillStyle = '#00ff44';
            hudCtx.font = 'bold 15px monospace';
            hudCtx.fillText('HUNTER PRIME: DEFEATED', w - 230, 35);
        } else {
            hudCtx.fillStyle = '#888888';
            hudCtx.font = '13px monospace';
            hudCtx.fillText('HUNTER PRIME: NOT YET DEPLOYED', w - 260, 35);
        }

        // Oxygen bar (only if in deep water)
        if (player.inDeepWater) {
            drawBar(20, h - 110, 200, 14, player.oxygen / player.oxygenMax, '#4488ff', '#002244', 'OXYGEN');
        }

        // Water status
        if (player.inDeepWater) {
            hudCtx.fillStyle = 'rgba(0, 50, 180, 0.4)';
            hudCtx.fillRect(0, 0, w, h);
            hudCtx.fillStyle = '#88aaff';
            hudCtx.font = 'bold 18px monospace';
            hudCtx.fillText('SWIMMING — CANNOT SHOOT', w / 2 - 120, h / 2 - 60);
        } else if (player.inShallowWater) {
            hudCtx.fillStyle = 'rgba(0, 30, 100, 0.15)';
            hudCtx.fillRect(0, 0, w, h);
        }

        // Detection flash
        if (player.detectionLevel > 80) {
            hud.detectionAlpha = Math.min(0.4, hud.detectionAlpha + dt * 2);
        } else {
            hud.detectionAlpha = Math.max(0, hud.detectionAlpha - dt * 2);
        }
        if (hud.detectionAlpha > 0) {
            hudCtx.fillStyle = 'rgba(255, 80, 0, ' + hud.detectionAlpha + ')';
            hudCtx.fillRect(0, 0, w, h);
        }

        // Valve interaction prompt
        for (var i = 0; i < valves.length; i++) {
            var v = valves[i];
            if (v.activated) continue;
            var vdx = player.position.x - v.x;
            var vdz = player.position.z - v.z;
            if (Math.sqrt(vdx * vdx + vdz * vdz) < 2.5) {
                hudCtx.fillStyle = '#ffff00';
                hudCtx.font = '16px monospace';
                var activePct = v.activating ? Math.floor(v.activateTimer / 2.0 * 100) + '%' : '';
                hudCtx.fillText('[E] Hold to turn valve  ' + activePct, w / 2 - 110, h / 2 + 60);
            }
        }

        // Running indicator
        if (player.isRunning) {
            hudCtx.fillStyle = '#ffaa00';
            hudCtx.font = '14px monospace';
            hudCtx.fillText('RUNNING — LOUD', 20, h - 110);
        }

        // Escape progress bottom bar
        hudCtx.fillStyle = 'rgba(0,0,0,0.5)';
        hudCtx.fillRect(w / 2 - 100, h - 30, 200, 22);
        hudCtx.fillStyle = '#00ff88';
        hudCtx.fillRect(w / 2 - 98, h - 28, (200 * player.checkpointsPassed / 3) - 4, 18);
        hudCtx.fillStyle = '#ffffff';
        hudCtx.font = '12px monospace';
        hudCtx.fillText('ESCAPE: ' + Math.floor(player.checkpointsPassed / 3 * 100) + '%', w / 2 - 35, h - 16);
    }

    function drawBar(x, y, bw, bh, ratio, colFill, colBg, label) {
        hudCtx.fillStyle = colBg;
        hudCtx.fillRect(x, y, bw, bh);
        hudCtx.fillStyle = colFill;
        hudCtx.fillRect(x, y, bw * Math.max(0, Math.min(1, ratio)), bh);
        hudCtx.strokeStyle = 'rgba(255,255,255,0.3)';
        hudCtx.lineWidth = 1;
        hudCtx.strokeRect(x, y, bw, bh);
        if (label) {
            hudCtx.fillStyle = '#ffffff';
            hudCtx.font = '11px monospace';
            hudCtx.fillText(label, x + 4, y + bh - 3);
        }
    }

    function drawScreen(title, sub, col) {
        var w = hudCanvas.width;
        var h = hudCanvas.height;
        hudCtx.fillStyle = 'rgba(0,0,0,0.75)';
        hudCtx.fillRect(0, 0, w, h);
        hudCtx.fillStyle = col;
        hudCtx.font = 'bold 64px monospace';
        hudCtx.textAlign = 'center';
        hudCtx.fillText(title, w / 2, h / 2 - 20);
        hudCtx.fillStyle = '#cccccc';
        hudCtx.font = '24px monospace';
        hudCtx.fillText(sub, w / 2, h / 2 + 30);
        hudCtx.fillStyle = '#888888';
        hudCtx.font = '16px monospace';
        hudCtx.fillText('Press S then E to restart', w / 2, h / 2 + 70);
        hudCtx.textAlign = 'left';
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  RESIZE
    // ══════════════════════════════════════════════════════════════════════════
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        hudCanvas.width = window.innerWidth;
        hudCanvas.height = window.innerHeight;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  RESET
    // ══════════════════════════════════════════════════════════════════════════
    function reset() {
        gameActive = false;
        gameWon = false;
        gameLost = false;

        // Remove DOM elements
        if (renderer && renderer.domElement && renderer.domElement.parentNode) {
            renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        if (hudCanvas && hudCanvas.parentNode) {
            hudCanvas.parentNode.removeChild(hudCanvas);
        }

        // Clear scene
        if (scene) {
            while (scene.children.length > 0) {
                scene.remove(scene.children[0]);
            }
        }

        // Remove input listeners
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mousemove', onMouseMove);
        if (activationHandler) {
            document.removeEventListener('keydown', activationHandler);
        }
        window.removeEventListener('resize', onResize);

        // Reset player
        player.position = { x: 0, y: 1.7, z: 5 };
        player.velocity = { x: 0, y: 0, z: 0 };
        player.yaw = 0;
        player.pitch = 0;
        player.hp = 100;
        player.ammo = 90;
        player.isRunning = false;
        player.inShallowWater = false;
        player.inDeepWater = false;
        player.oxygen = 100;
        player.detectionLevel = 0;
        player.checkpointsPassed = 0;
        player.lastShot = 0;
        player.dead = false;

        // Reset arrays
        enemies = [];
        tunnels = [];
        chambers = [];
        waterZones = [];
        valves = [];
        checkpoints = [];
        walls = [];
        flashlights = [];
        floodedSections = [];
        soundEvents = [];
        exitManhole = null;
        hunterPrime = null;
        hunterPrimeSpawned = false;
        hunterPrimeDefeated = false;
        hunterPrimeCheckpointIdx = 0;
        hunterPrimeLastReveal = 0;
        totalTime = 0;
        keys = {};
        mouseDX = 0;
        mouseDY = 0;
        mouseDown = false;
        pointerLocked = false;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  ACTIVATION listener (S then E)
    // ══════════════════════════════════════════════════════════════════════════
    (function setupActivation() {
        document.addEventListener('keydown', function activationCheck(e) {
            if (e.key === 'S' || e.key === 's') {
                lastKeyS = Date.now();
            } else if ((e.key === 'E' || e.key === 'e') && !gameActive) {
                if (Date.now() - lastKeyS < 400) {
                    document.removeEventListener('keydown', activationCheck);
                    init(document.body);
                }
            }
        });
    }());

    return {
        init: init,
        update: update,
        reset: reset
    };

}());
