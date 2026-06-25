window.CoalBay = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var craneArms = [];
    var craneRotation = 0;

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

    function buildDockFloor() {
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var tileGeo = new THREE.BoxGeometry(10, 0.5, 10);
        var tileCount = 0;
        for (var x = -25; x < 25; x += 10) {
            for (var z = -15; z < 15; z += 10) {
                addMesh(tileGeo, floorMat, x, 0, z);
                tileCount++;
            }
        }
        var dustMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var dustGeo = new THREE.BoxGeometry(8, 0.1, 8);
        for (var i = 0; i < 12; i++) {
            var rx = Math.random() * 50 - 25;
            var rz = Math.random() * 30 - 15;
            addMesh(dustGeo, dustMat, rx, 0.3, rz);
        }
    }

    function buildCoalPiles() {
        var coalMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var radii = [3, 3.5, 3.2, 3.8, 3.1, 3.6, 3.3, 3.4];
        var positions = [
            [-15, 3, -8],
            [-15, 3, 8],
            [-5, 3, -10],
            [-5, 3, 10],
            [5, 3, -12],
            [5, 3, 12],
            [15, 3, -9],
            [15, 3, 9]
        ];
        for (var i = 0; i < 8; i++) {
            var sphereGeo = new THREE.SphereGeometry(radii[i], 8, 8);
            addMesh(sphereGeo, coalMat, positions[i][0], positions[i][1], positions[i][2]);
        }
        var conveyorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var conveyorGeo = new THREE.BoxGeometry(2, 0.3, 25);
        addMesh(conveyorGeo, conveyorMat, -20, 1, 0);
        addMesh(conveyorGeo, conveyorMat, 20, 1, 0);
        var topGeo = new THREE.BoxGeometry(2, 0.3, 35);
        addMesh(topGeo, conveyorMat, 0, 8, 0);
    }

    function buildLoadingCranes() {
        var steelMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var yellowMat = new THREE.MeshLambertMaterial({ color: 0x888800 });
        var cranePositions = [
            [-18, 0, 0],
            [-6, 0, 0],
            [6, 0, 0]
        ];
        for (var c = 0; c < 3; c++) {
            var cx = cranePositions[c][0];
            var cz = cranePositions[c][2];
            var towerGeo = new THREE.BoxGeometry(2, 20, 2);
            var tower = addMesh(towerGeo, steelMat, cx, 10, cz);
            var topBeamGeo = new THREE.BoxGeometry(3, 1, 2);
            addMesh(topBeamGeo, steelMat, cx, 20, cz);
            var armGeo = new THREE.BoxGeometry(16, 1, 1.5);
            var arm = new THREE.Mesh(armGeo, yellowMat);
            arm.position.set(cx, 20, cz);
            arm.userData.baseY = 20;
            arm.userData.isArm = true;
            scene.add(arm);
            objects.push(arm);
            craneArms.push(arm);
            var cableGeo = new THREE.BoxGeometry(0.1, 15, 0.1);
            addMesh(cableGeo, steelMat, cx + 7, 12.5, cz);
            var hookGeo = new THREE.BoxGeometry(1.5, 2, 1.5);
            addMesh(hookGeo, steelMat, cx + 7, 5, cz);
            var wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 12);
            addMesh(wheelGeo, steelMat, cx - 1, 0.3, cz + 1.5);
            addMesh(wheelGeo, steelMat, cx + 1, 0.3, cz + 1.5);
        }
    }

    function buildWarehouses() {
        var brickMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var positions = [
            [-20, 0, -15],
            [-20, 0, 15],
            [20, 0, -15],
            [20, 0, 15]
        ];
        for (var w = 0; w < 4; w++) {
            var wx = positions[w][0];
            var wz = positions[w][2];
            var wallGeo = new THREE.BoxGeometry(14, 12, 12);
            addMesh(wallGeo, brickMat, wx, 6, wz);
            var roofGeo = new THREE.BoxGeometry(14, 1.5, 12);
            var roofMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            addMesh(roofGeo, roofMat, wx, 13, wz);
            var metalMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            for (var s = 0; s < 8; s++) {
                var stripGeo = new THREE.BoxGeometry(0.3, 12, 0.5);
                addMesh(stripGeo, metalMat, wx - 6.5 + s * 2, 6, wz - 5.5);
                addMesh(stripGeo, metalMat, wx - 6.5 + s * 2, 6, wz + 5.5);
            }
            var doorGeo = new THREE.BoxGeometry(4, 10, 0.3);
            var doorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            addMesh(doorGeo, doorMat, wx + 6.5, 5, wz - 5.8);
        }
    }

    function buildShips() {
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var positions = [
            [-25, 0, -12],
            [25, 0, 12]
        ];
        for (var sh = 0; sh < 2; sh++) {
            var shx = positions[sh][0];
            var shz = positions[sh][1];
            var hullGeo = new THREE.BoxGeometry(25, 8, 6);
            addMesh(hullGeo, hullMat, shx, 4, shz);
            var deckGeo = new THREE.BoxGeometry(25, 1, 6);
            var deckMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            addMesh(deckGeo, deckMat, shx, 8.5, shz);
            var superGeo = new THREE.BoxGeometry(10, 8, 4);
            var superMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            addMesh(superGeo, superMat, shx - 5, 12, shz);
            var stackGeo = new THREE.CylinderGeometry(1.5, 1.5, 10, 16);
            var stackMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            addMesh(stackGeo, stackMat, shx - 3, 18, shz);
            var smokeGeo = new THREE.CylinderGeometry(1.2, 1.2, 2, 16);
            addMesh(smokeGeo, hullMat, shx - 3, 23, shz);
            var mastGeo = new THREE.BoxGeometry(0.4, 15, 0.4);
            addMesh(mastGeo, hullMat, shx + 8, 16, shz);
        }
    }

    function buildBreakwater() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var blockGeo = new THREE.BoxGeometry(4, 3, 3);
        var xStart = -30;
        var xEnd = 30;
        var layers = 3;
        for (var layer = 0; layer < layers; layer++) {
            for (var bx = xStart; bx <= xEnd; bx += 4.5) {
                var byy = layer * 3.2 + 1.5;
                var bzz = -25 - layer * 0.5;
                addMesh(blockGeo, stoneMat, bx, byy, bzz);
            }
        }
        var topGeo = new THREE.BoxGeometry(65, 0.5, 2);
        addMesh(topGeo, stoneMat, 0, 10.5, -25);
        var railMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var railGeo = new THREE.BoxGeometry(0.3, 1.5, 65);
        addMesh(railGeo, railMat, -31, 11.2, -25);
        addMesh(railGeo, railMat, 31, 11.2, -25);
    }

    function buildDefenseTurrets() {
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var positions = [
            [-28, 0, -18],
            [-28, 0, 18],
            [28, 0, -18],
            [28, 0, 18]
        ];
        for (var t = 0; t < 4; t++) {
            var tx = positions[t][0];
            var tz = positions[t][1];
            var baseGeo = new THREE.CylinderGeometry(3, 3.5, 2, 16);
            addMesh(baseGeo, baseMat, tx, 1, tz);
            var towerGeo = new THREE.CylinderGeometry(2, 2, 4, 16);
            addMesh(towerGeo, baseMat, tx, 3, tz);
            var gunAGeo = new THREE.BoxGeometry(0.8, 0.8, 6);
            var gunA = addMesh(gunAGeo, gunMat, tx - 1, 5.5, tz);
            gunA.rotation.z = 0.4;
            var gunBGeo = new THREE.BoxGeometry(0.8, 0.8, 6);
            var gunB = addMesh(gunBGeo, gunMat, tx + 1, 5.5, tz);
            gunB.rotation.z = 0.4;
            var radarGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 12);
            addMesh(radarGeo, gunMat, tx, 6, tz);
        }
    }

    function buildCargoCrates() {
        var crateColors = [0x4a4a3a, 0x5a5a4a, 0x3a3a2a, 0x6a6a5a, 0x4a4a4a];
        var crateMat0 = new THREE.MeshLambertMaterial({ color: crateColors[0] });
        var crateMat1 = new THREE.MeshLambertMaterial({ color: crateColors[1] });
        var crateMat2 = new THREE.MeshLambertMaterial({ color: crateColors[2] });
        var crateMat3 = new THREE.MeshLambertMaterial({ color: crateColors[3] });
        var crateMat4 = new THREE.MeshLambertMaterial({ color: crateColors[4] });
        var crateGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        var crateCount = 0;
        var warehouseAreas = [
            [-20, -15, 6],
            [-20, 15, 6],
            [20, -15, 6],
            [20, 15, 6]
        ];
        for (var wa = 0; wa < 4; wa++) {
            var wax = warehouseAreas[wa][0];
            var waz = warehouseAreas[wa][1];
            for (var cx = -8; cx < 8; cx += 2.7) {
                for (var cz = -5; cz < 5; cz += 2.7) {
                    for (var cy = 0; cy < 3; cy++) {
                        var matIdx = (cx + cz + cy) % 5;
                        var crateMaterial = crateMat0;
                        if (matIdx === 1) crateMaterial = crateMat1;
                        else if (matIdx === 2) crateMaterial = crateMat2;
                        else if (matIdx === 3) crateMaterial = crateMat3;
                        else if (matIdx === 4) crateMaterial = crateMat4;
                        var crateY = 1.25 + cy * 2.6;
                        addMesh(crateGeo, crateMaterial, wax + cx, crateY, waz + cz);
                        crateCount++;
                    }
                }
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x4a3a2a, 0.4);
        addLight(ambientLight);
        var sodiumColor = 0xFFA040;
        var pointLightPositions = [
            [-24, 12, -12],
            [-24, 12, 0],
            [-24, 12, 12],
            [-12, 12, -12],
            [-12, 12, 0],
            [-12, 12, 12],
            [0, 12, -12],
            [0, 12, 0],
            [0, 12, 12],
            [12, 12, -12],
            [12, 12, 0],
            [12, 12, 12],
            [24, 12, -12],
            [24, 12, 0],
            [24, 12, 12]
        ];
        for (var p = 0; p < pointLightPositions.length; p++) {
            var pLight = new THREE.PointLight(sodiumColor, 0.8, 35);
            pLight.position.set(pointLightPositions[p][0], pointLightPositions[p][1], pointLightPositions[p][2]);
            addLight(pLight);
        }
        var dirLight = new THREE.DirectionalLight(0x666666, 0.3);
        dirLight.position.set(15, 25, 20);
        addLight(dirLight);
        var shipRedLight = new THREE.PointLight(0xff4444, 0.6, 15);
        shipRedLight.position.set(-25, 10, -15);
        addLight(shipRedLight);
        var shipGreenLight = new THREE.PointLight(0x44ff44, 0.6, 15);
        shipGreenLight.position.set(-25, 10, -8);
        addLight(shipGreenLight);
        var shipRedLight2 = new THREE.PointLight(0xff4444, 0.6, 15);
        shipRedLight2.position.set(25, 10, 15);
        addLight(shipRedLight2);
        var shipGreenLight2 = new THREE.PointLight(0x44ff44, 0.6, 15);
        shipGreenLight2.position.set(25, 10, 8);
        addLight(shipGreenLight2);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        craneArms = [];
        craneRotation = 0;
        buildDockFloor();
        buildCoalPiles();
        buildLoadingCranes();
        buildWarehouses();
        buildShips();
        buildBreakwater();
        buildDefenseTurrets();
        buildCargoCrates();
        setupLighting();
    }

    function update(delta) {
        craneRotation += 0.2 * delta;
        for (var i = 0; i < craneArms.length; i++) {
            var arm = craneArms[i];
            arm.rotation.y = Math.sin(craneRotation * 0.5) * 0.3;
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
        craneArms = [];
        scene = null;
        camera = null;
        craneRotation = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
