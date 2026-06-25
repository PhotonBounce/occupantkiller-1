window.EmberVale = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var smokeVolume = [];
    var coalGlows = [];
    var emberPulse = [];

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

    function buildCharredGround() {
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x1A1A0A });
        var ashMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var boxGeo = new THREE.BoxGeometry(45, 2, 45);

        var groundX = 0;
        var groundY = -1;
        var groundZ = 0;

        addMesh(boxGeo, blackMat, groundX, groundY, groundZ);

        var offsetPattern = [
            [25, 0], [-25, 0], [0, 25], [0, -25],
            [25, 25], [-25, -25], [-25, 25], [25, -25]
        ];

        for (var i = 0; i < offsetPattern.length; i++) {
            var ox = offsetPattern[i][0];
            var oz = offsetPattern[i][1];
            addMesh(boxGeo, ashMat, groundX + ox, groundY - 0.5, groundZ + oz);
        }
    }

    function buildBurnedTrees() {
        var charMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var trunkGeo = new THREE.CylinderGeometry(2.5, 3.5, 22, 8);

        var treePositions = [
            [-35, 0, -35], [-20, 0, -40], [-10, 0, -30], [5, 0, -42],
            [20, 0, -35], [35, 0, -38], [40, 0, -20], [38, 0, 0],
            [35, 0, 20], [20, 0, 35], [5, 0, 38], [-10, 0, 40],
            [-30, 0, 35], [-40, 0, 20], [-42, 0, 5], [-40, 0, -15],
            [-15, 0, -15], [10, 0, 10], [-8, 0, 12], [25, 0, -8],
            [-28, 0, -8], [12, 0, -20], [-5, 0, 25], [30, 0, 15],
            [-35, 0, 15]
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var pos = treePositions[i];
            var trunk = addMesh(trunkGeo, charMat, pos[0], pos[1] + 11, pos[2]);

            var branchMat = new THREE.LineBasicMaterial({ color: 0x1A1A0A });
            var branchGeo = new THREE.BufferGeometry();

            var branchPoints = [
                new THREE.Vector3(0, 22, 0),
                new THREE.Vector3(3, 26, 2),
                new THREE.Vector3(-2, 28, -3),
                new THREE.Vector3(4, 25, -2),
                new THREE.Vector3(-3, 24, 3),
                new THREE.Vector3(1, 27, 1),
                new THREE.Vector3(2, 25, -4)
            ];

            branchGeo.setFromPoints(branchPoints);
            var branchLine = new THREE.LineSegments(branchGeo, branchMat);
            branchLine.position.set(pos[0], pos[1], pos[2]);
            scene.add(branchLine);
            objects.push(branchLine);
        }
    }

    function buildEmberPatches() {
        var emberMat = new THREE.MeshLambertMaterial({ color: 0xFF4400, emissive: 0xFF4400 });
        var emberGeo = new THREE.SphereGeometry(1.2, 6, 6);

        var emberLocs = [
            [-30, 0.1, -35], [-15, 0.1, -30], [0, 0.1, -40], [20, 0.1, -32],
            [35, 0.1, -28], [38, 0.1, -5], [35, 0.1, 18], [20, 0.1, 32],
            [0, 0.1, 35], [-20, 0.1, 30], [-32, 0.1, 20], [-38, 0.1, 5],
            [-35, 0.1, -15], [-12, 0.1, -18], [8, 0.1, 8], [25, 0.1, -10],
            [-18, 0.1, 15], [5, 0.1, -8], [-25, 0.1, -5], [15, 0.1, 25]
        ];

        for (var i = 0; i < emberLocs.length; i++) {
            var loc = emberLocs[i];
            var ember = addMesh(emberGeo, emberMat, loc[0], loc[1], loc[2]);
            emberPulse.push({ mesh: ember, phase: i * 0.3 });
        }
    }

    function buildBurnedVehicles() {
        var vehicleMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x0A0A0A });

        var vehiclePos = [
            { x: -25, z: -20 }, { x: 15, z: -28 }, { x: 28, z: 10 },
            { x: -10, z: 22 }, { x: 32, z: -12 }
        ];

        for (var v = 0; v < vehiclePos.length; v++) {
            var vp = vehiclePos[v];

            var hullGeo = new THREE.BoxGeometry(8, 4, 14);
            addMesh(hullGeo, vehicleMat, vp.x, 2, vp.z);

            var cabGeo = new THREE.BoxGeometry(5, 3, 5);
            addMesh(cabGeo, vehicleMat, vp.x - 2, 4.5, vp.z + 3);

            var wheelGeo = new THREE.CylinderGeometry(2, 2, 1.5, 12);
            addMesh(wheelGeo, wheelMat, vp.x - 4, 1, vp.z - 5);
            addMesh(wheelGeo, wheelMat, vp.x + 4, 1, vp.z - 5);
            addMesh(wheelGeo, wheelMat, vp.x - 4, 1, vp.z + 5);
            addMesh(wheelGeo, wheelMat, vp.x + 4, 1, vp.z + 5);
        }
    }

    function buildFirebreaks() {
        var breakMat = new THREE.MeshLambertMaterial({ color: 0x554433 });
        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x332211 });
        var breakGeo = new THREE.BoxGeometry(60, 1, 5);
        var debrisGeo = new THREE.BoxGeometry(8, 3, 4);

        addMesh(breakGeo, breakMat, 0, -0.8, -30);
        addMesh(debrisGeo, debrisMat, -32, 1, -30);
        addMesh(debrisGeo, debrisMat, 32, 1, -30);

        addMesh(breakGeo, breakMat, -32, -0.8, 0);
        addMesh(debrisGeo, debrisMat, -32, 1, -20);
        addMesh(debrisGeo, debrisMat, -32, 1, 20);
    }

    function buildSurvivingBunker() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x444433 });

        var wallGeo = new THREE.BoxGeometry(12, 6, 14);
        addMesh(wallGeo, concreteMat, -38, 3, 28);

        var roofGeo = new THREE.BoxGeometry(14, 1.5, 16);
        addMesh(roofGeo, roofMat, -38, 9.75, 28);

        var entryGeo = new THREE.BoxGeometry(3, 3, 1);
        var entryMat = new THREE.MeshLambertMaterial({ color: 0x1A1A0A });
        addMesh(entryGeo, entryMat, -38, 3, 35.5);

        var interiorLightGeo = new THREE.SphereGeometry(1, 8, 8);
        var glowMat = new THREE.MeshLambertMaterial({ color: 0xFFBB44, emissive: 0xFFBB44 });
        addMesh(interiorLightGeo, glowMat, -38, 4, 22);
    }

    function buildSmokeColumns() {
        var smokeMat = new THREE.MeshLambertMaterial({ color: 0x444444, transparent: true, opacity: 0.6 });
        var smokeGeo = new THREE.SphereGeometry(3, 8, 8);

        var smokeBasePos = [
            [-30, 0, -35], [0, 0, -40], [20, 0, -32], [35, 0, 20],
            [-32, 0, 20], [-38, 0, 5], [8, 0, 8], [-18, 0, 15],
            [5, 0, -8], [-25, 0, -5], [15, 0, 25], [25, 0, -10],
            [-20, 0, 30], [-10, 0, 40], [-15, 0, -30], [38, 0, 0],
            [32, 0, -12], [28, 0, 10], [-10, 0, 22], [25, 0, -8]
        ];

        for (var s = 0; s < smokeBasePos.length; s++) {
            var base = smokeBasePos[s];
            for (var layer = 0; layer < 6; layer++) {
                var smoke = addMesh(smokeGeo, smokeMat, base[0], base[1] + (layer * 3.5), base[2]);
                smoke.scale.set(1 - layer * 0.15, 1 - layer * 0.15, 1 - layer * 0.15);
                smokeVolume.push({
                    mesh: smoke,
                    baseY: base[1] + (layer * 3.5),
                    baseX: base[0],
                    baseZ: base[2],
                    layer: layer
                });
            }
        }
    }

    function buildGlowingCoals() {
        var coalMat = new THREE.MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF6600 });
        var coalGeo = new THREE.SphereGeometry(0.8, 6, 6);

        var coalPositions = [
            [-35, 0.05, -35], [-25, 0.05, -30], [-15, 0.05, -32], [-8, 0.05, -35],
            [0, 0.05, -40], [8, 0.05, -38], [15, 0.05, -35], [25, 0.05, -32],
            [32, 0.05, -28], [38, 0.05, -20], [40, 0.05, -5], [38, 0.05, 10],
            [32, 0.05, 22], [20, 0.05, 32], [8, 0.05, 35], [-8, 0.05, 38],
            [-20, 0.05, 35], [-32, 0.05, 25], [-38, 0.05, 15], [-40, 0.05, 0],
            [-38, 0.05, -15], [-10, 0.05, -18], [12, 0.05, 8], [-25, 0.05, 10],
            [5, 0.05, -8], [28, 0.05, 8], [-18, 0.05, 18], [18, 0.05, -18],
            [-5, 0.05, 22], [10, 0.05, -22]
        ];

        for (var c = 0; c < coalPositions.length; c++) {
            var cp = coalPositions[c];
            var coal = addMesh(coalGeo, coalMat, cp[0], cp[1], cp[2]);
            coalGlows.push({ mesh: coal, phase: c * 0.15 });

            var glowLight = new THREE.PointLight(0xFF6600, 1.2, 20);
            glowLight.position.set(cp[0], cp[1] + 2, cp[2]);
            addLight(glowLight);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x330A0A, 0.4);
        addLight(ambientLight);

        var dirLight = new THREE.DirectionalLight(0xFF4400, 0.6);
        dirLight.position.set(20, 15, 20);
        addLight(dirLight);

        var bunkerLight = new THREE.PointLight(0xFFBB44, 2, 35);
        bunkerLight.position.set(-38, 5, 22);
        addLight(bunkerLight);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        smokeVolume = [];
        coalGlows = [];
        emberPulse = [];

        buildCharredGround();
        buildBurnedTrees();
        buildEmberPatches();
        buildBurnedVehicles();
        buildFirebreaks();
        buildSurvivingBunker();
        buildSmokeColumns();
        buildGlowingCoals();
        setupLighting();
    }

    function update(delta) {
        var time = Date.now() * 0.001;

        for (var i = 0; i < smokeVolume.length; i++) {
            var smoke = smokeVolume[i];
            smoke.mesh.position.y = smoke.baseY + Math.sin(time + smoke.layer * 0.5) * 1.5;
            smoke.mesh.position.x = smoke.baseX + Math.cos(time * 0.3 + smoke.layer) * 0.8;
            smoke.mesh.position.z = smoke.baseZ + Math.sin(time * 0.35 + smoke.layer * 0.7) * 0.8;
        }

        for (var e = 0; e < emberPulse.length; e++) {
            var ember = emberPulse[e];
            var scale = 0.9 + Math.sin(time * 2.5 + ember.phase) * 0.25;
            ember.mesh.scale.set(scale, scale, scale);
        }

        for (var g = 0; g < coalGlows.length; g++) {
            var coal = coalGlows[g];
            var pulseScale = 0.85 + Math.sin(time * 3.2 + coal.phase) * 0.2;
            coal.mesh.scale.set(pulseScale, pulseScale, pulseScale);
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
        smokeVolume = [];
        coalGlows = [];
        emberPulse = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
