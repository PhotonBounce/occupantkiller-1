window.GrimPort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var smokeSpheres = [];

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

    function buildPortDistrict() {
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var groundGeo = new THREE.BoxGeometry(45, 0.5, 45);
        addMesh(groundGeo, groundMat, 0, 0, 0);

        var puddleMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var puddleGeo = new THREE.BoxGeometry(3, 0.1, 3);
        addMesh(puddleGeo, puddleMat, -15, 0.05, -15);
        addMesh(puddleGeo, puddleMat, 10, 0.05, -10);
        addMesh(puddleGeo, puddleMat, 5, 0.05, 15);
        addMesh(puddleGeo, puddleMat, -8, 0.05, 5);
        addMesh(puddleGeo, puddleMat, 18, 0.05, 8);
    }

    function buildSunkenShips() {
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x332211 });
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
        var debrisMat = new THREE.MeshLambertMaterial({ color: 0x553322 });

        var hullGeo = new THREE.BoxGeometry(8, 4, 20);
        var mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 8);
        var debrisGeo = new THREE.BoxGeometry(1, 1, 1);

        var ship1 = addMesh(hullGeo, hullMat, -12, -1, 5);
        ship1.rotation.z = 0.6;
        addMesh(mastGeo, mastMat, -12, 5, 5);
        addMesh(debrisGeo, debrisMat, -14, 0.5, 5);
        addMesh(debrisGeo, debrisMat, -10, 0.5, 3);
        addMesh(debrisGeo, debrisMat, -12, 0.5, 7);

        var ship2 = addMesh(hullGeo, hullMat, 10, -1.5, -8);
        ship2.rotation.z = -0.5;
        addMesh(mastGeo, mastMat, 10, 4, -8);
        addMesh(debrisGeo, debrisMat, 12, 0.5, -8);
        addMesh(debrisGeo, debrisMat, 8, 0.5, -6);

        var ship3 = addMesh(hullGeo, hullMat, 15, -0.8, 12);
        ship3.rotation.z = 0.4;
        addMesh(mastGeo, mastMat, 15, 6, 12);
        addMesh(debrisGeo, debrisMat, 17, 0.5, 12);
        addMesh(debrisGeo, debrisMat, 13, 0.5, 10);
    }

    function buildBombardmentCraters() {
        var scorchMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var rimMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
        var scorchGeo = new THREE.SphereGeometry(1.5, 6, 6);
        var rimGeo = new THREE.BoxGeometry(4, 0.3, 4);

        var craters = [
            [-18, 8], [15, -15], [-5, -18], [20, 15],
            [0, -12], [-15, -5], [12, 5], [8, -8]
        ];

        for (var i = 0; i < craters.length; i++) {
            var cx = craters[i][0];
            var cz = craters[i][1];

            var craterDepth = new THREE.BoxGeometry(5, 1.5, 5);
            var depthMat = new THREE.MeshLambertMaterial({ color: 0x222211 });
            addMesh(craterDepth, depthMat, cx, -0.75, cz);

            addMesh(rimGeo, rimMat, cx, 0.2, cz);
            addMesh(scorchGeo, scorchMat, cx, 0.3, cz);
        }
    }

    function buildCollapsedWarehouses() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x664433 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x553322 });
        var beamMat = new THREE.LineBasicMaterial({ color: 0x886644 });

        var wallGeo = new THREE.BoxGeometry(6, 3, 8);
        var roofGeo = new THREE.BoxGeometry(8, 0.5, 10);
        var debrisGeo = new THREE.BoxGeometry(2, 2, 2);

        var locations = [[-20, -12], [18, 10], [-8, 15], [12, -18]];

        for (var i = 0; i < locations.length; i++) {
            var lx = locations[i][0];
            var lz = locations[i][1];

            var wall = addMesh(wallGeo, wallMat, lx, 1.5, lz);
            wall.rotation.z = 0.3 + i * 0.1;

            var roof = addMesh(roofGeo, roofMat, lx + 1, 3.5, lz + 1);
            roof.rotation.z = 0.5;

            addMesh(debrisGeo, roofMat, lx - 2, 2, lz - 2);
            addMesh(debrisGeo, roofMat, lx + 3, 2.5, lz + 3);

            var beamGeo = new THREE.BufferGeometry();
            var positions = new Float32Array([
                lx - 3, 2, lz - 3,
                lx + 3, 4, lz + 3,
                lx - 3, 2, lz + 3,
                lx + 3, 4, lz - 3
            ]);
            beamGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            var beamObj = new THREE.LineSegments(beamGeo, beamMat);
            scene.add(beamObj);
            objects.push(beamObj);
        }
    }

    function buildPortDefenses() {
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x776655 });
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var wireMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });

        var sandGeo = new THREE.BoxGeometry(2, 1, 2);
        var cylinderGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
        var platformGeo = new THREE.BoxGeometry(5, 0.5, 5);

        addMesh(sandGeo, sandbagMat, -15, 0.5, 12);
        addMesh(sandGeo, sandbagMat, -16, 0.5, 12);
        addMesh(sandGeo, sandbagMat, -14, 0.5, 12);

        var platform1 = addMesh(platformGeo, gunMat, 18, 0.25, -10);
        addMesh(cylinderGeo, gunMat, 18, 3, -10);
        var barrelGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
        var barrel = addMesh(barrelGeo, gunMat, 18, 5.5, -10);
        barrel.rotation.x = 0.3;

        var platform2 = addMesh(platformGeo, gunMat, -18, 0.25, -15);
        addMesh(cylinderGeo, gunMat, -18, 3, -15);
        var barrel2 = addMesh(barrelGeo, gunMat, -18, 5.5, -15);
        barrel2.rotation.x = 0.3;

        var wireGeo = new THREE.BufferGeometry();
        var wirePos = new Float32Array([
            -10, 0, 10, -10, 2, 10,
            -10, 2, 10, 10, 2, 10,
            10, 2, 10, 10, 0, 10,
            10, 0, 10, -10, 0, 10
        ]);
        wireGeo.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
        var wireObj = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wireObj);
        objects.push(wireObj);
    }

    function buildSmokePillars() {
        var smokeMat = new THREE.MeshLambertMaterial({ color: 0x555555, transparent: true, opacity: 0.4 });
        var smokeGeo = new THREE.SphereGeometry(2, 6, 6);

        var fireLocations = [[-12, 5], [10, -8], [15, 12], [-8, -10], [5, 5]];

        for (var i = 0; i < fireLocations.length; i++) {
            var fx = fireLocations[i][0];
            var fz = fireLocations[i][1];

            for (var j = 0; j < 3; j++) {
                var smoke = addMesh(smokeGeo, smokeMat, fx, 3 + j * 2.5, fz);
                var smokeData = {
                    mesh: smoke,
                    baseX: fx,
                    baseZ: fz,
                    baseY: 3 + j * 2.5,
                    drift: Math.random() * 0.5
                };
                smokeSpheres.push(smokeData);
            }
        }
    }

    function buildNavalGuns() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

        var platformGeo = new THREE.BoxGeometry(8, 0.8, 8);
        var barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 14, 8);
        var breechGeo = new THREE.SphereGeometry(1.2, 8, 8);

        var gunPositions = [[-20, -18], [20, -18], [0, 20]];

        for (var i = 0; i < gunPositions.length; i++) {
            var gx = gunPositions[i][0];
            var gz = gunPositions[i][1];

            addMesh(platformGeo, concreteMat, gx, 0.4, gz);
            var barrel = addMesh(barrelGeo, gunMat, gx, 2.5, gz);
            barrel.rotation.z = Math.PI / 6;
            addMesh(breechGeo, gunMat, gx, 1.5, gz);
        }
    }

    function buildSurvivorCamp() {
        var canvasMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x775533 });

        var tentGeo = new THREE.BoxGeometry(3, 3, 3);
        var poleGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 6);
        var barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8);
        var crateGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);

        var tent1 = addMesh(tentGeo, canvasMat, -22, 1.5, 18);
        tent1.rotation.z = 0.4;
        addMesh(poleGeo, poleMat, -22, 1.5, 18);

        var tent2 = addMesh(tentGeo, canvasMat, -18, 1.5, 20);
        tent2.rotation.z = -0.3;
        addMesh(poleGeo, poleMat, -18, 1.5, 20);

        addMesh(barrelGeo, metalMat, -20, 0.75, 19);

        addMesh(crateGeo, crateMat, -19, 0.75, 17);
        addMesh(crateGeo, crateMat, -21, 0.75, 17);
        addMesh(crateGeo, crateMat, -23, 0.75, 19);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x442211, 0.5);
        addLight(ambientLight);

        var dirLight = new THREE.DirectionalLight(0x664422, 0.4);
        dirLight.position.set(30, 40, 30);
        addLight(dirLight);

        var fireLocations = [[-12, 3, 5], [10, 3, -8], [15, 3, 12], [-8, 3, -10], [5, 3, 5]];

        for (var i = 0; i < fireLocations.length; i++) {
            var fireLight = new THREE.PointLight(0xff6600, 0.6, 20);
            fireLight.position.set(fireLocations[i][0], fireLocations[i][1], fireLocations[i][2]);
            addLight(fireLight);
        }
    }

    function update(delta) {
        for (var i = 0; i < smokeSpheres.length; i++) {
            var smoke = smokeSpheres[i];
            smoke.mesh.position.y += 1.5 * delta;
            smoke.mesh.position.x += Math.sin(smoke.drift * smoke.mesh.position.y * 0.5) * 0.3 * delta;

            if (smoke.mesh.position.y > 25) {
                smoke.mesh.position.y = smoke.baseY;
                smoke.mesh.position.x = smoke.baseX;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
        objects = [];
        lights = [];
        smokeSpheres = [];
        scene = null;
        camera = null;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        smokeSpheres = [];
        buildPortDistrict();
        buildSunkenShips();
        buildBombardmentCraters();
        buildCollapsedWarehouses();
        buildPortDefenses();
        buildSmokePillars();
        buildNavalGuns();
        buildSurvivorCamp();
        setupLighting();
    }

    return { init: init, update: update, reset: reset };
}());
