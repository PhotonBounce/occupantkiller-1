window.DustPit = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var dustClouds = [];
    var time = 0;

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildArenaFloor() {
        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0xC2A35E });
        var floorGeo = new THREE.BoxGeometry(120, 2, 120);
        var floor = addMesh(floorGeo, floorMaterial, 0, -1, 0);
        floor.castShadow = true;
        floor.receiveShadow = true;

        var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
        for (var i = 0; i < 15; i++) {
            var rx = (Math.random() - 0.5) * 100;
            var rz = (Math.random() - 0.5) * 100;
            var rockGeo = new THREE.SphereGeometry(0.8 + Math.random() * 1.2, 8, 8);
            var rock = addMesh(rockGeo, rockMaterial, rx, 0, rz);
            rock.castShadow = true;
        }
    }

    function buildWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xD4A55A });
        var wallHeight = 15;
        var wallThickness = 3;
        var arenaDim = 120;

        var northGeo = new THREE.BoxGeometry(arenaDim, wallHeight, wallThickness);
        addMesh(northGeo, wallMaterial, 0, wallHeight / 2, -arenaDim / 2);

        var southGeo = new THREE.BoxGeometry(arenaDim, wallHeight, wallThickness);
        addMesh(southGeo, wallMaterial, 0, wallHeight / 2, arenaDim / 2);

        var eastGeo = new THREE.BoxGeometry(wallThickness, wallHeight, arenaDim);
        addMesh(eastGeo, wallMaterial, arenaDim / 2, wallHeight / 2, 0);

        var westGeo = new THREE.BoxGeometry(wallThickness, wallHeight, arenaDim);
        addMesh(westGeo, wallMaterial, -arenaDim / 2, wallHeight / 2, 0);

        for (var i = 0; i < 8; i++) {
            var gapGeo = new THREE.BoxGeometry(4, 3, wallThickness);
            addMesh(gapGeo, wallMaterial, -50 + i * 15, 12, -arenaDim / 2);
        }
    }

    function buildSpectatorStands() {
        var standMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var blockSize = 8;

        for (var tier = 0; tier < 4; tier++) {
            var height = tier * 4 + 2;
            var depth = 8 + tier * 2;
            var stairGeo = new THREE.BoxGeometry(60, 2, depth);
            var eastStand = addMesh(stairGeo, standMaterial, -65, height, 0);
            eastStand.castShadow = true;

            var westStand = addMesh(stairGeo, standMaterial, 65, height, 0);
            westStand.castShadow = true;
        }

        for (var i = 0; i < 5; i++) {
            var damageGeo = new THREE.BoxGeometry(4, 3, 2);
            addMesh(damageGeo, standMaterial, -60 + i * 8, 8 + i * 2, 5);
        }
    }

    function buildObstacles() {
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xA4845A });
        for (var i = 0; i < 6; i++) {
            var posX = -40 + i * 15;
            var sandbagGeo = new THREE.BoxGeometry(8, 2, 3);
            addMesh(sandbagGeo, sandbagMaterial, posX, 1, -20);
            addMesh(sandbagGeo, sandbagMaterial, posX + 3, 1, 25);
        }

        var rockOutcropMaterial = new THREE.MeshLambertMaterial({ color: 0x7A6B54 });
        for (var i = 0; i < 4; i++) {
            var cx = -30 + i * 25;
            var cz = 10;
            var rockClusterGeo = new THREE.SphereGeometry(2.5, 8, 8);
            addMesh(rockClusterGeo, rockOutcropMaterial, cx, 2.5, cz);
            addMesh(rockClusterGeo, rockOutcropMaterial, cx + 3, 2, cz + 2);
            addMesh(rockClusterGeo, rockOutcropMaterial, cx - 2, 1.5, cz - 3);
        }

        var vehicleBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var vehicleGeo = new THREE.BoxGeometry(15, 6, 8);
        addMesh(vehicleGeo, vehicleBodyMaterial, 0, 3, -35);

        var wheelGeo = new THREE.CylinderGeometry(2, 2, 3, 12);
        addMesh(wheelGeo, vehicleBodyMaterial, -5, 2, -32);
        addMesh(wheelGeo, vehicleBodyMaterial, 5, 2, -32);
        addMesh(wheelGeo, vehicleBodyMaterial, -5, 2, -38);
        addMesh(wheelGeo, vehicleBodyMaterial, 5, 2, -38);

        var stakesMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        for (var i = 0; i < 8; i++) {
            var stz = 20 + i * 5;
            var stakeGeo = new THREE.BoxGeometry(0.5, 4, 0.5);
            addMesh(stakeGeo, stakesMaterial, 35, 2, stz);
            addMesh(stakeGeo, stakesMaterial, 38, 2, stz);
            addMesh(stakeGeo, stakesMaterial, 36.5, 2, stz - 1);
        }
    }

    function buildTowers() {
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0xC9A876 });
        var topMaterial = new THREE.MeshLambertMaterial({ color: 0xB8956A });
        var capMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });

        var towerPositions = [
            { x: -55, z: -55 },
            { x: 55, z: -55 },
            { x: 55, z: 55 },
            { x: -55, z: 55 }
        ];

        for (var t = 0; t < 4; t++) {
            var tp = towerPositions[t];
            var baseGeo = new THREE.CylinderGeometry(5, 6, 12, 16);
            addMesh(baseGeo, baseMaterial, tp.x, 6, tp.z);

            var topGeo = new THREE.BoxGeometry(10, 5, 10);
            addMesh(topGeo, topMaterial, tp.x, 16, tp.z);

            var capGeo = new THREE.ConeGeometry(6, 4, 16);
            addMesh(capGeo, capMaterial, tp.x, 21, tp.z);

            for (var i = 0; i < 4; i++) {
                var loopGeo = new THREE.BoxGeometry(0.4, 4, 8);
                var loopAngle = (i / 4) * Math.PI * 2;
                var loopX = tp.x + Math.cos(loopAngle) * 7;
                var loopZ = tp.z + Math.sin(loopAngle) * 7;
                addMesh(loopGeo, topMaterial, loopX, 15, loopZ);
            }
        }
    }

    function buildGates() {
        var gateMaterial = new THREE.MeshLambertMaterial({ color: 0xB8956A });
        var barMaterial = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });

        var northFrameGeo = new THREE.BoxGeometry(35, 18, 2);
        var northGate = addMesh(northFrameGeo, gateMaterial, 0, 9, -58);
        northGate.castShadow = true;

        for (var i = 0; i < 12; i++) {
            var barX = -17 + i * 3;
            var barGeo = new THREE.BoxGeometry(0.6, 15, 0.6);
            addMesh(barGeo, barMaterial, barX, 8.5, -58);
        }

        var southFrameGeo = new THREE.BoxGeometry(35, 18, 2);
        var southGate = addMesh(southFrameGeo, gateMaterial, 0, 9, 58);
        southGate.castShadow = true;

        for (var i = 0; i < 12; i++) {
            var barX = -17 + i * 3;
            var barGeo = new THREE.BoxGeometry(0.6, 15, 0.6);
            addMesh(barGeo, barMaterial, barX, 8.5, 58);
        }
    }

    function buildWeaponRacks() {
        var rackMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var swordMaterial = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });

        var rackPositions = [
            { x: -40, z: -40 },
            { x: 40, z: -40 },
            { x: 40, z: 40 },
            { x: -40, z: 40 }
        ];

        for (var r = 0; r < 4; r++) {
            var rp = rackPositions[r];
            var rackFrameGeo = new THREE.BoxGeometry(5, 4, 5);
            addMesh(rackFrameGeo, rackMaterial, rp.x, 2, rp.z);

            for (var i = 0; i < 3; i++) {
                var rodGeo = new THREE.BoxGeometry(4, 0.3, 0.3);
                addMesh(rodGeo, rackMaterial, rp.x, 1.5 + i * 1.2, rp.z);
            }

            for (var i = 0; i < 6; i++) {
                var swordGeo = new THREE.BoxGeometry(0.3, 2.5, 0.1);
                var swordX = rp.x - 2 + i * 0.8;
                addMesh(swordGeo, swordMaterial, swordX, 2, rp.z);
            }

            for (var i = 0; i < 3; i++) {
                var gunGeo = new THREE.BoxGeometry(2, 0.5, 0.3);
                addMesh(gunGeo, swordMaterial, rp.x, 3.2 + i * 0.4, rp.z - 1.5);
            }
        }
    }

    function buildDustClouds() {
        var dustMaterial = new THREE.MeshLambertMaterial({
            color: 0xC2A35E,
            transparent: true,
            opacity: 0.4
        });

        for (var i = 0; i < 40; i++) {
            var dx = (Math.random() - 0.5) * 100;
            var dz = (Math.random() - 0.5) * 100;
            var dy = Math.random() * 3;
            var size = 0.5 + Math.random() * 1;
            var dustGeo = new THREE.SphereGeometry(size, 6, 6);
            var dust = addMesh(dustGeo, dustMaterial, dx, dy, dz);
            dustClouds.push({
                mesh: dust,
                baseX: dx,
                baseZ: dz,
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.7
            });
        }
    }

    function setupLighting() {
        var sunLight = new THREE.DirectionalLight(0xFFFFA0, 1.2);
        sunLight.position.set(40, 40, 40);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        addLight(sunLight);

        var ambientLight = new THREE.AmbientLight(0x8B6914, 0.6);
        addLight(ambientLight);

        var cornerPositions = [
            { x: -50, z: -50 },
            { x: 50, z: -50 },
            { x: 50, z: 50 },
            { x: -50, z: 50 }
        ];

        for (var i = 0; i < 4; i++) {
            var torch = new THREE.PointLight(0xFFA500, 0.8, 50);
            torch.position.set(cornerPositions[i].x, 20, cornerPositions[i].z);
            addLight(torch);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        dustClouds = [];
        time = 0;

        buildArenaFloor();
        buildWalls();
        buildSpectatorStands();
        buildObstacles();
        buildTowers();
        buildGates();
        buildWeaponRacks();
        buildDustClouds();
        setupLighting();
    }

    function update(delta) {
        time += delta;
        for (var i = 0; i < dustClouds.length; i++) {
            var dc = dustClouds[i];
            var offsetX = Math.sin(time * dc.speed + dc.phase) * 5;
            var offsetZ = Math.cos(time * dc.speed + dc.phase) * 5;
            dc.mesh.position.x = dc.baseX + offsetX;
            dc.mesh.position.z = dc.baseZ + offsetZ;
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
        dustClouds = [];
        scene = null;
        camera = null;
        time = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
