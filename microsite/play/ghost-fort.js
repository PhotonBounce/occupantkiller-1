window.GhostFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var ghostSpheres = [];
    var torchLights = [];

    var STONE_GRAY = 0x888888;
    var DARK_GRAY = 0x444444;
    var IVY_GREEN = 0x2d5016;
    var TORCH_ORANGE = 0xff8c42;
    var DARK_BROWN = 0x5c4033;

    function buildWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: STONE_GRAY });
        var northWall = new THREE.Mesh(new THREE.BoxGeometry(120, 15, 4), wallMaterial);
        northWall.position.set(0, 8, -60);
        scene.add(northWall);
        objects.push(northWall);

        var southWall = new THREE.Mesh(new THREE.BoxGeometry(120, 15, 4), wallMaterial);
        southWall.position.set(0, 8, 60);
        scene.add(southWall);
        objects.push(southWall);

        var eastWall = new THREE.Mesh(new THREE.BoxGeometry(4, 15, 120), wallMaterial);
        eastWall.position.set(60, 8, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        var westWall = new THREE.Mesh(new THREE.BoxGeometry(4, 15, 120), wallMaterial);
        westWall.position.set(-60, 8, 0);
        scene.add(westWall);
        objects.push(westWall);

        var crenelMaterial = new THREE.MeshLambertMaterial({ color: DARK_GRAY });
        for (var i = 0; i < 6; i++) {
            var crennel1 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 4), crenelMaterial);
            crennel1.position.set(-50 + i * 20, 16, -60);
            scene.add(crennel1);
            objects.push(crennel1);

            var crennel2 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 4), crenelMaterial);
            crennel2.position.set(-50 + i * 20, 16, 60);
            scene.add(crennel2);
            objects.push(crennel2);
        }

        for (var j = 0; j < 6; j++) {
            var crennel3 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 8), crenelMaterial);
            crennel3.position.set(60, 16, -50 + j * 20);
            scene.add(crennel3);
            objects.push(crennel3);

            var crennel4 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 8), crenelMaterial);
            crennel4.position.set(-60, 16, -50 + j * 20);
            scene.add(crennel4);
            objects.push(crennel4);
        }
    }

    function buildTowers() {
        var towerMaterial = new THREE.MeshLambertMaterial({ color: STONE_GRAY });
        var capMaterial = new THREE.MeshLambertMaterial({ color: DARK_GRAY });

        var positions = [
            { x: -50, z: -50 },
            { x: 50, z: -50 },
            { x: 50, z: 50 },
            { x: -50, z: 50 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            var towerCyl = new THREE.Mesh(new THREE.CylinderGeometry(8, 10, 20, 16), towerMaterial);
            towerCyl.position.set(pos.x, 10, pos.z);
            scene.add(towerCyl);
            objects.push(towerCyl);

            var cap = new THREE.Mesh(new THREE.ConeGeometry(9, 6, 16), capMaterial);
            cap.position.set(pos.x, 20, pos.z);
            scene.add(cap);
            objects.push(cap);

            for (var j = 0; j < 4; j++) {
                var embrasure = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 3), towerMaterial);
                var angle = (j * Math.PI / 2);
                embrasure.position.set(pos.x + Math.cos(angle) * 8.5, 10 + j * 3, pos.z + Math.sin(angle) * 8.5);
                scene.add(embrasure);
                objects.push(embrasure);
            }
        }
    }

    function buildRuins() {
        var rubbleMaterial = new THREE.MeshLambertMaterial({ color: DARK_GRAY });

        var ruinPositions = [
            { x: 20, z: 10, size: 8 },
            { x: -25, z: -30, size: 10 },
            { x: 35, z: -20, size: 7 },
            { x: -15, z: 25, size: 9 },
            { x: 10, z: -40, size: 6 },
            { x: -40, z: 15, size: 8 }
        ];

        for (var i = 0; i < ruinPositions.length; i++) {
            var ruin = ruinPositions[i];
            for (var j = 0; j < 8; j++) {
                var rubble = new THREE.Mesh(new THREE.SphereGeometry(ruin.size * (0.5 + Math.random() * 0.5), 6, 6), rubbleMaterial);
                rubble.position.set(ruin.x + (Math.random() - 0.5) * ruin.size * 3, 2 + Math.random() * ruin.size, ruin.z + (Math.random() - 0.5) * ruin.size * 3);
                scene.add(rubble);
                objects.push(rubble);
            }
        }
    }

    function buildVines() {
        var vineMaterial = new THREE.MeshLambertMaterial({ color: IVY_GREEN });

        var vineWallPositions = [
            { x: 0, z: -60, axis: 'x', length: 100 },
            { x: 60, z: 0, axis: 'z', length: 100 },
            { x: -55, z: 10, axis: 'z', length: 60 }
        ];

        for (var i = 0; i < vineWallPositions.length; i++) {
            var pos = vineWallPositions[i];
            for (var j = 0; j < 5; j++) {
                var vineCluster = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), vineMaterial);
                if (pos.axis === 'x') {
                    vineCluster.position.set(-40 + j * 20, 6, pos.z + (Math.random() - 0.5) * 3);
                } else {
                    vineCluster.position.set(pos.x + (Math.random() - 0.5) * 3, 6, -40 + j * 20);
                }
                scene.add(vineCluster);
                objects.push(vineCluster);
            }
        }
    }

    function buildCourtyard() {
        var equipMaterial = new THREE.MeshLambertMaterial({ color: DARK_BROWN });

        var crate1 = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), equipMaterial);
        crate1.position.set(-10, 3, 5);
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), equipMaterial);
        crate2.position.set(15, 2, -15);
        scene.add(crate2);
        objects.push(crate2);

        var crate3 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 10), equipMaterial);
        crate3.position.set(-20, 2.5, -10);
        scene.add(crate3);
        objects.push(crate3);

        var weaponRack = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 2), equipMaterial);
        weaponRack.position.set(30, 4, 20);
        scene.add(weaponRack);
        objects.push(weaponRack);

        var barrels = [
            { x: -35, z: -5 },
            { x: -30, z: -5 },
            { x: -25, z: -5 }
        ];

        for (var i = 0; i < barrels.length; i++) {
            var barrel = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 4, 8), equipMaterial);
            barrel.position.set(barrels[i].x, 2, barrels[i].z);
            scene.add(barrel);
            objects.push(barrel);
        }
    }

    function buildHauntings() {
        var ghostMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc, transparent: true, opacity: 0.4 });

        var hauntingPositions = [
            { x: 0, y: 8, z: 0 },
            { x: 30, y: 6, z: -20 },
            { x: -25, y: 7, z: 25 },
            { x: 15, y: 5, z: 40 },
            { x: -40, y: 6, z: -35 }
        ];

        for (var i = 0; i < hauntingPositions.length; i++) {
            var pos = hauntingPositions[i];
            for (var j = 0; j < 4; j++) {
                var ghostSphere = new THREE.Mesh(new THREE.SphereGeometry(1.5 + Math.random(), 8, 8), ghostMaterial);
                ghostSphere.position.set(pos.x + (Math.random() - 0.5) * 8, pos.y + j * 2, pos.z + (Math.random() - 0.5) * 8);
                ghostSphere.userData.speed = 0.3 + Math.random() * 0.3;
                ghostSphere.userData.offset = Math.random() * Math.PI * 2;
                scene.add(ghostSphere);
                objects.push(ghostSphere);
                ghostSpheres.push(ghostSphere);
            }
        }
    }

    function buildGate() {
        var gateMaterial = new THREE.MeshLambertMaterial({ color: DARK_GRAY });
        var hinges = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), gateMaterial);
        hinges.position.set(0, 8, -60);
        scene.add(hinges);
        objects.push(hinges);

        var gateLeft = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 1), gateMaterial);
        gateLeft.position.set(-8, 8, -60);
        scene.add(gateLeft);
        objects.push(gateLeft);

        var gateRight = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 1), gateMaterial);
        gateRight.position.set(8, 8, -60);
        scene.add(gateRight);
        objects.push(gateRight);

        var fortification = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 3), gateMaterial);
        fortification.position.set(0, 14, -60);
        scene.add(fortification);
        objects.push(fortification);
    }

    function buildDungeon() {
        var dungeonMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var hatchFrame = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 8), dungeonMaterial);
        hatchFrame.position.set(-30, 0.5, 30);
        scene.add(hatchFrame);
        objects.push(hatchFrame);

        var stairStep1 = new THREE.Mesh(new THREE.BoxGeometry(7, 1.5, 7), dungeonMaterial);
        stairStep1.position.set(-30, -2, 30);
        scene.add(stairStep1);
        objects.push(stairStep1);

        var stairStep2 = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.5, 6.5), dungeonMaterial);
        stairStep2.position.set(-30, -4, 30);
        scene.add(stairStep2);
        objects.push(stairStep2);

        var stairStep3 = new THREE.Mesh(new THREE.BoxGeometry(6, 1.5, 6), dungeonMaterial);
        stairStep3.position.set(-30, -6, 30);
        scene.add(stairStep3);
        objects.push(stairStep3);

        var dungeonGate = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 1), dungeonMaterial);
        dungeonGate.position.set(-30, -3, 33);
        scene.add(dungeonGate);
        objects.push(dungeonGate);
    }

    function buildEmbrasures() {
        var embrasureMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        var embrasurePositions = [
            { x: 60, y: 10, z: -30 },
            { x: 60, y: 10, z: 0 },
            { x: 60, y: 10, z: 30 },
            { x: -60, y: 10, z: -30 },
            { x: -60, y: 10, z: 0 },
            { x: -60, y: 10, z: 30 },
            { x: -20, y: 10, z: -60 },
            { x: 20, y: 10, z: -60 }
        ];

        for (var i = 0; i < embrasurePositions.length; i++) {
            var pos = embrasurePositions[i];
            var slitWindow = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 3), embrasureMaterial);
            slitWindow.position.set(pos.x, pos.y, pos.z);
            scene.add(slitWindow);
            objects.push(slitWindow);

            var gunMounting = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 4), embrasureMaterial);
            gunMounting.position.set(pos.x, pos.y - 2, pos.z);
            scene.add(gunMounting);
            objects.push(gunMounting);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(50, 50, 50);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var torchPositions = [
            { x: -45, y: 8, z: -50 },
            { x: 45, y: 8, z: -50 },
            { x: 45, y: 8, z: 50 },
            { x: -45, y: 8, z: 50 },
            { x: 0, y: 8, z: -60 },
            { x: -60, y: 8, z: 0 },
            { x: 60, y: 8, z: 0 }
        ];

        for (var i = 0; i < torchPositions.length; i++) {
            var pos = torchPositions[i];
            var torchLight = new THREE.PointLight(TORCH_ORANGE, 1.2, 30);
            torchLight.position.set(pos.x, pos.y, pos.z);
            torchLight.userData.baseIntensity = 1.2;
            torchLight.userData.phase = Math.random() * Math.PI * 2;
            scene.add(torchLight);
            lights.push(torchLight);
            torchLights.push(torchLight);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        ghostSpheres = [];
        torchLights = [];

        buildWalls();
        buildTowers();
        buildRuins();
        buildVines();
        buildCourtyard();
        buildHauntings();
        buildGate();
        buildDungeon();
        buildEmbrasures();
        setupLighting();
    }

    function update(delta) {
        for (var i = 0; i < ghostSpheres.length; i++) {
            var ghost = ghostSpheres[i];
            var time = performance.now() * 0.0005;
            ghost.position.y += Math.sin(time * ghost.userData.speed + ghost.userData.offset) * delta * 2;
            ghost.position.x += Math.cos(time * ghost.userData.speed * 0.7 + ghost.userData.offset) * delta;
            ghost.position.z += Math.sin(time * ghost.userData.speed * 0.5 + ghost.userData.offset) * delta;
        }

        for (var j = 0; j < torchLights.length; j++) {
            var torch = torchLights[j];
            var flicker = Math.sin(performance.now() * 0.003 + torch.userData.phase) * 0.3 + 0.7;
            torch.intensity = torch.userData.baseIntensity * flicker;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
        }
        objects = [];
        lights = [];
        ghostSpheres = [];
        torchLights = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
