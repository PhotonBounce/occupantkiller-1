window.CleuchDock = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildDock();
    }

    function buildDock() {
        // Rock face walls - left wall
        var leftWallGeom = new THREE.BoxGeometry(8, 60, 3);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x6b6b6b });
        var leftWall = new THREE.Mesh(leftWallGeom, stoneMat);
        leftWall.position.set(-28, 0, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        scene.add(leftWall);
        objects.push(leftWall);

        // Rock face walls - right wall
        var rightWallGeom = new THREE.BoxGeometry(8, 60, 3);
        var rightWall = new THREE.Mesh(rightWallGeom, stoneMat);
        rightWall.position.set(28, 0, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        scene.add(rightWall);
        objects.push(rightWall);

        // Narrow gorge supply platform
        var platformGeom = new THREE.BoxGeometry(50, 2, 8);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(0, -15, 0);
        platform.castShadow = true;
        platform.receiveShadow = true;
        scene.add(platform);
        objects.push(platform);

        // Rope winch cargo lift - cylinder drum
        var drumGeom = new THREE.CylinderGeometry(3, 3, 6, 16);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var drum = new THREE.Mesh(drumGeom, metalMat);
        drum.position.set(-15, 10, 0);
        drum.rotation.z = Math.PI / 2;
        drum.castShadow = true;
        drum.receiveShadow = true;
        scene.add(drum);
        objects.push(drum);

        // Rope winch sphere pulley
        var pulleyGeom = new THREE.SphereGeometry(2, 16, 16);
        var pulley = new THREE.Mesh(pulleyGeom, metalMat);
        pulley.position.set(-15, 20, 0);
        pulley.castShadow = true;
        pulley.receiveShadow = true;
        scene.add(pulley);
        objects.push(pulley);

        // Rope winch LineSegments rope
        var ropePoints = [
            new THREE.Vector3(-15, 10, 0),
            new THREE.Vector3(-15, 20, 0),
            new THREE.Vector3(-15, 20, 0),
            new THREE.Vector3(-10, 5, 0)
        ];
        var ropeGeom = new THREE.BufferGeometry().setFromPoints(ropePoints);
        var ropeMat = new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 2 });
        var rope = new THREE.LineSegments(ropeGeom, ropeMat);
        scene.add(rope);
        objects.push(rope);

        // Waterfall power turbine - cylinder turbine
        var turbineGeom = new THREE.CylinderGeometry(4, 4, 2, 16);
        var turbine = new THREE.Mesh(turbineGeom, metalMat);
        turbine.position.set(20, -8, 5);
        turbine.rotation.x = Math.PI / 2;
        turbine.castShadow = true;
        turbine.receiveShadow = true;
        scene.add(turbine);
        objects.push(turbine);

        // Waterfall power turbine - cone deflector
        var deflectorGeom = new THREE.ConeGeometry(3, 5, 12);
        var deflector = new THREE.Mesh(deflectorGeom, metalMat);
        deflector.position.set(20, 2, 5);
        deflector.rotation.z = Math.PI / 4;
        deflector.castShadow = true;
        deflector.receiveShadow = true;
        scene.add(deflector);
        objects.push(deflector);

        // Hidden cave storage - box cave mouth
        var caveGeom = new THREE.BoxGeometry(12, 8, 4);
        var caveMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var cave = new THREE.Mesh(caveGeom, caveMat);
        cave.position.set(-20, -10, -20);
        cave.castShadow = true;
        cave.receiveShadow = true;
        scene.add(cave);
        objects.push(cave);

        // Hidden cave storage - LineSegments grid door
        var gridPoints = [];
        for (var i = 0; i < 5; i++) {
            gridPoints.push(new THREE.Vector3(-26 + i * 2.4, -6, -20));
            gridPoints.push(new THREE.Vector3(-26 + i * 2.4, -14, -20));
        }
        for (var i = 0; i < 4; i++) {
            gridPoints.push(new THREE.Vector3(-26, -6 + i * 2.67, -20));
            gridPoints.push(new THREE.Vector3(-14, -6 + i * 2.67, -20));
        }
        var gridGeom = new THREE.BufferGeometry().setFromPoints(gridPoints);
        var gridMat = new THREE.LineBasicMaterial({ color: 0xaa8833, linewidth: 1 });
        var gridDoor = new THREE.LineSegments(gridGeom, gridMat);
        scene.add(gridDoor);
        objects.push(gridDoor);

        // Drone resupply hover pad - flat box pad
        var padGeom = new THREE.BoxGeometry(10, 0.5, 10);
        var padMat = new THREE.MeshLambertMaterial({ color: 0x555599 });
        var pad = new THREE.Mesh(padGeom, padMat);
        pad.position.set(15, 15, 15);
        pad.castShadow = true;
        pad.receiveShadow = true;
        scene.add(pad);
        objects.push(pad);

        // Drone resupply hover pad - LineSegments landing X
        var xPoints = [
            new THREE.Vector3(10, 15, 10),
            new THREE.Vector3(20, 15, 20),
            new THREE.Vector3(20, 15, 10),
            new THREE.Vector3(10, 15, 20)
        ];
        var xGeom = new THREE.BufferGeometry().setFromPoints(xPoints);
        var xMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
        var landingX = new THREE.LineSegments(xGeom, xMat);
        scene.add(landingX);
        objects.push(landingX);

        // Boulder barricade - sphere boulder 1
        var boulderGeom = new THREE.SphereGeometry(3.5, 12, 12);
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var boulder1 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder1.position.set(0, -20, -25);
        boulder1.castShadow = true;
        boulder1.receiveShadow = true;
        scene.add(boulder1);
        objects.push(boulder1);

        // Boulder barricade - sphere boulder 2
        var boulder2 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder2.position.set(-8, -20, -25);
        boulder2.castShadow = true;
        boulder2.receiveShadow = true;
        scene.add(boulder2);
        objects.push(boulder2);

        // Boulder barricade - sphere boulder 3
        var boulder3 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder3.position.set(8, -20, -25);
        boulder3.castShadow = true;
        boulder3.receiveShadow = true;
        scene.add(boulder3);
        objects.push(boulder3);

        // Additional structural support - reinforcement beam
        var beamGeom = new THREE.CylinderGeometry(1, 1, 40, 8);
        var beam = new THREE.Mesh(beamGeom, metalMat);
        beam.position.set(0, -5, -15);
        beam.rotation.z = Math.PI / 3;
        beam.castShadow = true;
        beam.receiveShadow = true;
        scene.add(beam);
        objects.push(beam);

        // Lighting - main ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Lighting - directional light for shadows
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(30, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Rotate the turbine
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.CylinderGeometry &&
                objects[i].position.x === 20 &&
                objects[i].position.y === -8) {
                objects[i].rotation.x += delta * 2;
            }
        }
        // Rotate the drum
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.CylinderGeometry &&
                objects[i].position.x === -15 &&
                objects[i].position.y === 10) {
                objects[i].rotation.x += delta * 1.5;
            }
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
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
