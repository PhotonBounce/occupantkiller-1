window.OilDrum = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var pumpWheels = [];
    var flames = [];

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

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        pumpWheels = [];
        flames = [];

        buildGroundYard();
        buildDrumStacks();
        buildRefineryTower();
        buildPipeGrid();
        buildPumpStations();
        buildControlRoom();
        buildPerimeterFence();
        buildFireHazards();
        setupLighting();
    }

    function buildGroundYard() {
        var concreteGray = new THREE.MeshLambertMaterial({color: 0x444444});
        var darkStain = new THREE.MeshLambertMaterial({color: 0x1a1a1a});

        var groundGeo = new THREE.BoxGeometry(40, 0.5, 40);
        addMesh(groundGeo, concreteGray, 0, -0.25, 0);

        for (var i = 0; i < 8; i++) {
            for (var j = 0; j < 8; j++) {
                if ((i + j) % 3 === 0) {
                    var stainGeo = new THREE.BoxGeometry(4, 0.1, 4);
                    addMesh(stainGeo, darkStain, -16 + i * 5, 0.05, -16 + j * 5);
                }
            }
        }
    }

    function buildDrumStacks() {
        var drumGray = new THREE.MeshLambertMaterial({color: 0x333333});
        var drumRed = new THREE.MeshLambertMaterial({color: 0xCC2200});

        var drumGeo = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
        var bandGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.3, 16);

        var stackPositions = [
            [-15, 0, -15], [-15, 0, -5], [-15, 0, 5], [-15, 0, 15],
            [-5, 0, -15], [-5, 0, -5], [-5, 0, 5], [-5, 0, 15],
            [5, 0, -15], [5, 0, -5], [5, 0, 5], [5, 0, 15],
            [15, 0, -15], [15, 0, -5], [15, 0, 5], [15, 0, 15]
        ];

        for (var s = 0; s < stackPositions.length; s++) {
            var stackX = stackPositions[s][0];
            var stackZ = stackPositions[s][2];

            for (var layer = 0; layer < 4; layer++) {
                for (var col = 0; col < 5; col++) {
                    var offsetX = col * 2.6 - 5.2;
                    var offsetZ = layer * 2.6 - 3.9;
                    var y = 1.5 + layer * 3.2;

                    addMesh(drumGeo, drumGray, stackX + offsetX, y, stackZ + offsetZ);
                    var bandY = y + 1.65;
                    addMesh(bandGeo, drumRed, stackX + offsetX, bandY, stackZ + offsetZ);
                }
            }
        }
    }

    function buildRefineryTower() {
        var steelGray = new THREE.MeshLambertMaterial({color: 0x555555});
        var platformMat = new THREE.MeshLambertMaterial({color: 0x666666});

        var towerGeo = new THREE.CylinderGeometry(3, 3, 30, 24);
        var tower = addMesh(towerGeo, steelGray, 0, 15, 0);

        var platformGeo = new THREE.BoxGeometry(8, 0.5, 8);
        addMesh(platformGeo, platformMat, 0, 10, 0);
        addMesh(platformGeo, platformMat, 0, 15, 0);
        addMesh(platformGeo, platformMat, 0, 20, 0);
        addMesh(platformGeo, platformMat, 0, 25, 0);

        var ladderGeo = new THREE.BoxGeometry(0.3, 25, 0.3);
        addMesh(ladderGeo, steelGray, 3.5, 17.5, 2.5);
        addMesh(ladderGeo, steelGray, -3.5, 17.5, 2.5);

        for (var rung = 0; rung < 20; rung++) {
            var rungY = 2.5 + rung * 1.2;
            var rungGeo = new THREE.BoxGeometry(0.2, 0.2, 3.2);
            addMesh(rungGeo, steelGray, 0, rungY, 2.5);
        }
    }

    function buildPipeGrid() {
        var pipeGray = new THREE.MeshLambertMaterial({color: 0x444444});
        var pipeGeo = new THREE.CylinderGeometry(0.4, 0.4, 1, 12);

        var pipeConfigs = [
            {x: 0, y: 8, z: 0, len: 12, dir: 'z'},
            {x: 0, y: 8, z: 0, len: 12, dir: 'x'},
            {x: 5, y: 12, z: 0, len: 10, dir: 'z'},
            {x: -5, y: 12, z: 0, len: 10, dir: 'z'},
            {x: 0, y: 12, z: 5, len: 10, dir: 'x'},
            {x: 0, y: 12, z: -5, len: 10, dir: 'x'},
            {x: 8, y: 5, z: 0, len: 15, dir: 'z'},
            {x: -8, y: 5, z: 0, len: 15, dir: 'z'},
            {x: 0, y: 5, z: 8, len: 15, dir: 'x'},
            {x: 0, y: 5, z: -8, len: 15, dir: 'x'},
            {x: 10, y: 18, z: 0, len: 20, dir: 'z'},
            {x: -10, y: 18, z: 0, len: 20, dir: 'z'},
            {x: 0, y: 18, z: 10, len: 20, dir: 'x'},
            {x: 0, y: 18, z: -10, len: 20, dir: 'x'}
        ];

        for (var p = 0; p < pipeConfigs.length; p++) {
            var cfg = pipeConfigs[p];
            var segCount = Math.floor(cfg.len / 1.2);

            for (var seg = 0; seg < segCount; seg++) {
                var px = cfg.x;
                var py = cfg.y;
                var pz = cfg.z;

                if (cfg.dir === 'x') {
                    px += -cfg.len / 2 + seg * 1.2;
                } else if (cfg.dir === 'z') {
                    pz += -cfg.len / 2 + seg * 1.2;
                }

                addMesh(pipeGeo, pipeGray, px, py, pz);
            }
        }
    }

    function buildPumpStations() {
        var buildingGray = new THREE.MeshLambertMaterial({color: 0x555555});
        var flywheelGray = new THREE.MeshLambertMaterial({color: 0x333333});
        var pipeGray = new THREE.MeshLambertMaterial({color: 0x444444});

        var pumpPositions = [
            [-12, 0, 12],
            [12, 0, -12],
            [0, 0, -15]
        ];

        for (var pump = 0; pump < pumpPositions.length; pump++) {
            var px = pumpPositions[pump][0];
            var pz = pumpPositions[pump][2];

            var buildingGeo = new THREE.BoxGeometry(4, 4, 4);
            addMesh(buildingGeo, buildingGray, px, 2, pz);

            var roofGeo = new THREE.BoxGeometry(4.5, 0.5, 4.5);
            addMesh(roofGeo, buildingGray, px, 4.5, pz);

            var flywheelGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 20);
            var flywheel = addMesh(flywheelGeo, flywheelGray, px, 3.5, pz);
            pumpWheels.push(flywheel);

            var intakeGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 12);
            addMesh(intakeGeo, pipeGray, px - 2, 1, pz);

            var outputGeo = new THREE.CylinderGeometry(0.3, 0.3, 2, 12);
            addMesh(outputGeo, pipeGray, px + 2, 1, pz);
        }
    }

    function buildControlRoom() {
        var concreteGray = new THREE.MeshLambertMaterial({color: 0x666666});
        var windowBlue = new THREE.MeshLambertMaterial({color: 0x88AACC});
        var roofGray = new THREE.MeshLambertMaterial({color: 0x555555});

        var wallGeo = new THREE.BoxGeometry(6, 5, 8);
        addMesh(wallGeo, concreteGray, -12, 2.5, -8);

        var windowGeo = new THREE.BoxGeometry(2, 2, 0.2);
        addMesh(windowGeo, windowBlue, -9, 3, -12);
        addMesh(windowGeo, windowBlue, -15, 3, -8);

        var roofGeo = new THREE.BoxGeometry(6.5, 0.5, 8.5);
        addMesh(roofGeo, roofGray, -12, 5.5, -8);

        var antennaGeo = new THREE.BoxGeometry(0.2, 3, 0.2);
        addMesh(antennaGeo, roofGray, -12, 8, -8);

        var roofCapGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        addMesh(roofCapGeo, roofGray, -12, 9.2, -8);

        var internalLightMat = new THREE.MeshLambertMaterial({color: 0xFFFFCC});
        var lightGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        addMesh(lightGeo, internalLightMat, -12, 4, -8);
    }

    function buildPerimeterFence() {
        var postGray = new THREE.MeshLambertMaterial({color: 0x444444});
        var wireGray = new THREE.MeshLambertMaterial({color: 0x666666});

        var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 12);
        var fenceRadius = 22;

        for (var i = 0; i < 16; i++) {
            var angle = (i / 16) * Math.PI * 2;
            var px = Math.cos(angle) * fenceRadius;
            var pz = Math.sin(angle) * fenceRadius;
            addMesh(postGeo, postGray, px, 2.5, pz);
        }

        for (var f = 0; f < 16; f++) {
            var angle1 = (f / 16) * Math.PI * 2;
            var angle2 = ((f + 1) / 16) * Math.PI * 2;

            var x1 = Math.cos(angle1) * fenceRadius;
            var z1 = Math.sin(angle1) * fenceRadius;
            var x2 = Math.cos(angle2) * fenceRadius;
            var z2 = Math.sin(angle2) * fenceRadius;

            var midX = (x1 + x2) / 2;
            var midZ = (z1 + z2) / 2;
            var dist = Math.sqrt((x2 - x1) * (x2 - x1) + (z2 - z1) * (z2 - z1));

            var wireGeo = new THREE.BoxGeometry(dist, 0.15, 0.15);
            var wireMesh = addMesh(wireGeo, wireGray, midX, 3, midZ);

            var angle_rad = Math.atan2(z2 - z1, x2 - x1);
            wireMesh.rotation.y = angle_rad;

            for (var h = 1; h <= 3; h++) {
                var wireGeo2 = new THREE.BoxGeometry(dist, 0.15, 0.15);
                var wireMesh2 = addMesh(wireGeo2, wireGray, midX, 0.5 + h * 1.2, midZ);
                wireMesh2.rotation.y = angle_rad;
            }
        }
    }

    function buildFireHazards() {
        var flameRed = new THREE.MeshLambertMaterial({color: 0xFF4400});
        var flameOrange = new THREE.MeshLambertMaterial({color: 0xFF8800});

        var firePositions = [
            [-10, 0, 18],
            [8, 0, -18],
            [18, 0, 8]
        ];

        for (var fire = 0; fire < firePositions.length; fire++) {
            var fx = firePositions[fire][0];
            var fz = firePositions[fire][2];

            var flameGeo = new THREE.SphereGeometry(2, 12, 12);
            var flameMesh = addMesh(flameGeo, flameRed, fx, 4, fz);
            flames.push({mesh: flameMesh, baseY: 4, scale: 1});

            var flameGeo2 = new THREE.SphereGeometry(1.5, 12, 12);
            var flameMesh2 = addMesh(flameGeo2, flameOrange, fx + 0.5, 5.5, fz + 0.5);
            flames.push({mesh: flameMesh2, baseY: 5.5, scale: 1});

            var flameGeo3 = new THREE.SphereGeometry(1, 12, 12);
            var flameMesh3 = addMesh(flameGeo3, flameRed, fx - 0.5, 6.5, fz - 0.5);
            flames.push({mesh: flameMesh3, baseY: 6.5, scale: 1});
        }
    }

    function setupLighting() {
        var directionalLight = new THREE.DirectionalLight(0xFFFFDD, 1.2);
        directionalLight.position.set(20, 30, 20);
        directionalLight.castShadow = true;
        addLight(directionalLight);

        var ambientLight = new THREE.AmbientLight(0xCCBB99, 0.6);
        addLight(ambientLight);

        var fireLight1 = new THREE.PointLight(0xFF6600, 1.5, 25);
        fireLight1.position.set(-10, 5, 18);
        addLight(fireLight1);

        var fireLight2 = new THREE.PointLight(0xFF6600, 1.5, 25);
        fireLight2.position.set(8, 5, -18);
        addLight(fireLight2);

        var fireLight3 = new THREE.PointLight(0xFF6600, 1.5, 25);
        fireLight3.position.set(18, 5, 8);
        addLight(fireLight3);
    }

    function update(delta) {
        for (var w = 0; w < pumpWheels.length; w++) {
            pumpWheels[w].rotation.z += 1.2 * delta;
        }

        for (var f = 0; f < flames.length; f++) {
            var flameObj = flames[f];
            var scaleVariation = 0.8 + 0.4 * Math.sin(Date.now() * 0.005 + f);
            flameObj.mesh.scale.set(scaleVariation, scaleVariation, scaleVariation);
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
        pumpWheels = [];
        flames = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
