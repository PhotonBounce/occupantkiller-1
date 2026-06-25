window.BloodArena = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var torches = [];
    var flags = [];
    var time = 0;

    var ARENA_RADIUS = 30;
    var ARENA_HEIGHT = 40;
    var WALL_HEIGHT = 8;

    function createMaterial(color, emissive) {
        emissive = emissive || 0x000000;
        return new THREE.MeshPhongMaterial({ color: color, emissive: emissive });
    }

    function addObject(mesh) {
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function createArenaWalls() {
        var segments = 8;
        var wallMaterial = createMaterial(0x4a4a4a);
        var wallThickness = 2;

        for (var i = 0; i < segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            var nextAngle = ((i + 1) / segments) * Math.PI * 2;

            var x1 = Math.cos(angle) * ARENA_RADIUS;
            var z1 = Math.sin(angle) * ARENA_RADIUS;
            var x2 = Math.cos(nextAngle) * ARENA_RADIUS;
            var z2 = Math.sin(nextAngle) * ARENA_RADIUS;

            var dx = x2 - x1;
            var dz = z2 - z1;
            var length = Math.sqrt(dx * dx + dz * dz);
            var midX = (x1 + x2) / 2;
            var midZ = (z1 + z2) / 2;
            var rotation = Math.atan2(dz, dx);

            var wallGeometry = new THREE.BoxGeometry(length, WALL_HEIGHT, wallThickness);
            var wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(midX, WALL_HEIGHT / 2, midZ);
            wall.rotation.y = rotation;
            addObject(wall);
        }
    }

    function createTieredSeating() {
        var seatMaterial = createMaterial(0x5a5a5a);
        var tiers = 8;
        var seatsPerTier = 8;

        for (var tier = 0; tier < tiers; tier++) {
            var tierRadius = ARENA_RADIUS + 3 + (tier * 3);
            var tierHeight = WALL_HEIGHT + (tier * 2);

            for (var seat = 0; seat < seatsPerTier; seat++) {
                var angle = (seat / seatsPerTier) * Math.PI * 2;
                var x = Math.cos(angle) * tierRadius;
                var z = Math.sin(angle) * tierRadius;

                var seatGeometry = new THREE.BoxGeometry(2.5, 1.5, 2.5);
                var seatMesh = new THREE.Mesh(seatGeometry, seatMaterial);
                seatMesh.position.set(x, tierHeight, z);
                addObject(seatMesh);
            }
        }
    }

    function createArenaFloor() {
        var floorTiles = 12;
        var tileSize = (ARENA_RADIUS * 2) / floorTiles;
        var bloodMaterial = createMaterial(0x3d0000);
        var sandMaterial = createMaterial(0x4a3a2a);

        for (var x = 0; x < floorTiles; x++) {
            for (var z = 0; z < floorTiles; z++) {
                var posX = -ARENA_RADIUS + (x + 0.5) * tileSize;
                var posZ = -ARENA_RADIUS + (z + 0.5) * tileSize;
                var dist = Math.sqrt(posX * posX + posZ * posZ);

                if (dist > ARENA_RADIUS) continue;

                var tileGeometry = new THREE.BoxGeometry(tileSize, 0.1, tileSize);
                var material = (x + z) % 2 === 0 ? sandMaterial : bloodMaterial;
                var tile = new THREE.Mesh(tileGeometry, material);
                tile.position.set(posX, 0.05, posZ);
                addObject(tile);
            }
        }
    }

    function createGladiatorCages() {
        var cageMaterial = createMaterial(0x2a2a2a);
        var positions = [
            { x: ARENA_RADIUS + 1, z: 0 },
            { x: -ARENA_RADIUS - 1, z: 0 },
            { x: 0, z: ARENA_RADIUS + 1 },
            { x: 0, z: -ARENA_RADIUS - 1 }
        ];

        positions.forEach(function(pos) {
            var cageGeometry = new THREE.BoxGeometry(3, 4, 3);
            var cage = new THREE.Mesh(cageGeometry, cageMaterial);
            cage.position.set(pos.x, 2, pos.z);
            addObject(cage);

            for (var i = 0; i < 8; i++) {
                var barGeometry = new THREE.BoxGeometry(0.2, 4, 0.2);
                var bar = new THREE.Mesh(barGeometry, cageMaterial);
                var angle = (i / 8) * Math.PI * 2;
                var barRadius = 1.5;
                bar.position.set(pos.x + Math.cos(angle) * barRadius, 2, pos.z + Math.sin(angle) * barRadius);
                addObject(bar);
            }
        });
    }

    function createGiantGates() {
        var gateMaterial = createMaterial(0x1a1a1a);
        var gatePositions = [
            { x: ARENA_RADIUS + 2, z: 5, rotY: 0 },
            { x: ARENA_RADIUS + 2, z: -5, rotY: 0 },
            { x: -ARENA_RADIUS - 2, z: 5, rotY: Math.PI },
            { x: -ARENA_RADIUS - 2, z: -5, rotY: Math.PI }
        ];

        gatePositions.forEach(function(pos) {
            var gateGeometry = new THREE.BoxGeometry(2, 6, 4);
            var gate = new THREE.Mesh(gateGeometry, gateMaterial);
            gate.position.set(pos.x, 3, pos.z);
            gate.rotation.y = pos.rotY;
            addObject(gate);

            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 2; j++) {
                    var barGeometry = new THREE.BoxGeometry(0.2, 0.2, 3.5);
                    var bar = new THREE.Mesh(barGeometry, gateMaterial);
                    bar.position.set(pos.x - 0.8 + (i * 0.8), 1 + (j * 2), pos.z);
                    bar.rotation.y = pos.rotY;
                    addObject(bar);
                }
            }
        });
    }

    function createWeaponRacks() {
        var rackMaterial = createMaterial(0x4a4a4a);
        var barrelMaterial = createMaterial(0x3a3a3a);
        var rackPositions = [];

        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            rackPositions.push({
                x: Math.cos(angle) * (ARENA_RADIUS - 3),
                z: Math.sin(angle) * (ARENA_RADIUS - 3),
                angle: angle
            });
        }

        rackPositions.forEach(function(pos) {
            var rackGeometry = new THREE.BoxGeometry(2, 3, 1);
            var rack = new THREE.Mesh(rackGeometry, rackMaterial);
            rack.position.set(pos.x, 1.5, pos.z);
            addObject(rack);

            for (var i = 0; i < 3; i++) {
                for (var j = 0; j < 2; j++) {
                    var barrelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
                    var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
                    barrel.position.set(pos.x - 0.5 + (i * 0.5), 2 + (j * 0.8), pos.z);
                    barrel.rotation.z = Math.PI / 2;
                    addObject(barrel);
                }
            }
        });
    }

    function createTrophySkulls() {
        var poleMaterial = createMaterial(0x5a3a1a);
        var skullMaterial = createMaterial(0xf5e6d3);
        var skullPositions = [];

        for (var i = 0; i < 6; i++) {
            var angle = (i / 6) * Math.PI * 2;
            skullPositions.push({
                x: Math.cos(angle) * (ARENA_RADIUS + 5),
                z: Math.sin(angle) * (ARENA_RADIUS + 5)
            });
        }

        skullPositions.forEach(function(pos) {
            var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
            var pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 4, pos.z);
            addObject(pole);

            for (var i = 0; i < 3; i++) {
                var skullGeometry = new THREE.SphereGeometry(0.6, 8, 8);
                var skull = new THREE.Mesh(skullGeometry, skullMaterial);
                skull.position.set(pos.x, 6 + (i * 1.5), pos.z);
                addObject(skull);
            }
        });
    }

    function createScoreboard() {
        var panelMaterial = createMaterial(0x1a1a1a);
        var pixelMaterial = createMaterial(0xff3333);
        var screenGeometry = new THREE.BoxGeometry(8, 4, 0.5);
        var screen = new THREE.Mesh(screenGeometry, panelMaterial);
        screen.position.set(0, 12, -ARENA_RADIUS - 3);
        addObject(screen);

        var pixelCount = 16;
        var pixelSize = 0.3;
        for (var x = 0; x < pixelCount; x++) {
            for (var y = 0; y < pixelCount / 2; y++) {
                if (Math.random() > 0.3) {
                    var pixelGeometry = new THREE.BoxGeometry(pixelSize, pixelSize, 0.1);
                    var pixel = new THREE.Mesh(pixelGeometry, pixelMaterial);
                    pixel.position.set(-4 + (x * 0.5), 9 + (y * 0.5), -ARENA_RADIUS - 2);
                    addObject(pixel);
                }
            }
        }
    }

    function createVictoryTorches() {
        var poleMaterial = createMaterial(0x5a3a1a);
        var torchPositions = [];

        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            torchPositions.push({
                x: Math.cos(angle) * (ARENA_RADIUS + 8),
                z: Math.sin(angle) * (ARENA_RADIUS + 8),
                angle: angle
            });
        }

        torchPositions.forEach(function(pos) {
            var poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
            var pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 3, pos.z);
            addObject(pole);

            var fireGeometry = new THREE.SphereGeometry(1, 8, 8);
            var fireMaterial = createMaterial(0xff8833, 0xff4411);
            var fire = new THREE.Mesh(fireGeometry, fireMaterial);
            fire.position.set(pos.x, 7, pos.z);
            addObject(fire);

            torches.push({
                mesh: fire,
                baseScale: 1,
                baseIntensity: 0xff8833,
                time: Math.random() * Math.PI * 2
            });
        });
    }

    function createBloodPools() {
        var bloodMaterial = createMaterial(0x330000);
        var poolCount = 8;

        for (var i = 0; i < poolCount; i++) {
            var angle = (i / poolCount) * Math.PI * 2;
            var radius = Math.random() * (ARENA_RADIUS - 5) + 5;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius;

            var poolGeometry = new THREE.BoxGeometry(2 + Math.random() * 2, 0.1, 2 + Math.random() * 2);
            var pool = new THREE.Mesh(poolGeometry, bloodMaterial);
            pool.position.set(x, 0.1, z);
            addObject(pool);
        }
    }

    function createDefensiveCover() {
        var stoneMaterial = createMaterial(0x6a6a6a);
        var coverCount = 10;

        for (var i = 0; i < coverCount; i++) {
            var angle = Math.random() * Math.PI * 2;
            var radius = Math.random() * (ARENA_RADIUS - 8) + 5;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius;

            if (Math.random() > 0.5) {
                var pillarGeometry = new THREE.BoxGeometry(1.5, 3, 1.5);
                var pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
                pillar.position.set(x, 1.5, z);
                addObject(pillar);
            } else {
                var wallGeometry = new THREE.BoxGeometry(3, 1.5, 1);
                var wall = new THREE.Mesh(wallGeometry, stoneMaterial);
                wall.position.set(x, 0.75, z);
                wall.rotation.y = Math.random() * Math.PI;
                addObject(wall);
            }
        }
    }

    function createVIPBox() {
        var platformMaterial = createMaterial(0x8a7a5a);
        var goldMaterial = createMaterial(0xffd700);

        var platformGeometry = new THREE.BoxGeometry(6, 0.5, 4);
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, WALL_HEIGHT + 2, ARENA_RADIUS - 5);
        addObject(platform);

        var throneBackGeometry = new THREE.BoxGeometry(2, 2.5, 0.5);
        var throneBack = new THREE.Mesh(throneBackGeometry, goldMaterial);
        throneBack.position.set(0, WALL_HEIGHT + 3.5, ARENA_RADIUS - 6.5);
        addObject(throneBack);

        var throneSeatGeometry = new THREE.BoxGeometry(2, 1.5, 2);
        var throneSeat = new THREE.Mesh(throneSeatGeometry, goldMaterial);
        throneSeat.position.set(0, WALL_HEIGHT + 2.5, ARENA_RADIUS - 5);
        addObject(throneSeat);

        for (var i = 0; i < 2; i++) {
            var armGeometry = new THREE.BoxGeometry(0.5, 1.5, 1.5);
            var arm = new THREE.Mesh(armGeometry, goldMaterial);
            arm.position.set(-1.5 + (i * 3), WALL_HEIGHT + 2.75, ARENA_RADIUS - 5);
            addObject(arm);
        }
    }

    function createSpectatorFlags() {
        var flagMaterial = createMaterial(0xff3333);
        var poleMaterial = createMaterial(0x5a5a5a);
        var flagPositions = [];

        for (var i = 0; i < 16; i++) {
            var angle = (i / 16) * Math.PI * 2;
            flagPositions.push({
                x: Math.cos(angle) * (ARENA_RADIUS + 12),
                z: Math.sin(angle) * (ARENA_RADIUS + 12),
                angle: angle
            });
        }

        flagPositions.forEach(function(pos) {
            var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
            var pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos.x, 2.5, pos.z);
            addObject(pole);

            var flagGeometry = new THREE.BoxGeometry(2.5, 1.5, 0.2);
            var flag = new THREE.Mesh(flagGeometry, flagMaterial);
            flag.position.set(pos.x + 1.5, 4.5, pos.z);
            addObject(flag);

            flags.push({
                mesh: flag,
                baseX: flag.position.x,
                baseZ: flag.position.z,
                time: Math.random() * Math.PI * 2
            });
        });
    }

    function init(sceneArg, cameraArg) {
        scene = sceneArg;
        camera = cameraArg;
        objects = [];
        torches = [];
        flags = [];
        time = 0;

        createArenaWalls();
        createTieredSeating();
        createArenaFloor();
        createGladiatorCages();
        createGiantGates();
        createWeaponRacks();
        createTrophySkulls();
        createScoreboard();
        createVictoryTorches();
        createBloodPools();
        createDefensiveCover();
        createVIPBox();
        createSpectatorFlags();
    }

    function update(delta) {
        time += delta;

        torches.forEach(function(torch) {
            var flicker = 0.8 + Math.sin(time * 8 + torch.time) * 0.2;
            torch.mesh.scale.set(flicker, flicker, flicker);
            var intensity = Math.floor(torch.baseIntensity * (0.7 + Math.sin(time * 6 + torch.time) * 0.3));
            torch.mesh.material.color.setHex(intensity);
        });

        flags.forEach(function(flag) {
            var wave = Math.sin(time * 3 + flag.time) * 0.3;
            flag.mesh.position.x = flag.baseX + wave;
            var tilt = Math.sin(time * 2 + flag.time) * 0.2;
            flag.mesh.rotation.z = tilt;
        });
    }

    function reset() {
        objects.forEach(function(obj) {
            scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(function(mat) { mat.dispose(); });
                } else {
                    obj.material.dispose();
                }
            }
        });
        objects = [];
        torches = [];
        flags = [];
        time = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
