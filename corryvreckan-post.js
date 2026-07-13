window.CorryvreckanPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Underwater pinnacle sonar anchor station
        var pinnacleGeom = new THREE.CylinderGeometry(4, 6, 18, 12);
        var pinnacleMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var pinnacle = new THREE.Mesh(pinnacleGeom, pinnacleMat);
        pinnacle.position.set(-25, -8, -20);
        scene.add(pinnacle);
        objects.push(pinnacle);

        // Sphere sensor node on pinnacle
        var sensorGeom = new THREE.SphereGeometry(2, 16, 16);
        var sensorMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        var sensor = new THREE.Mesh(sensorGeom, sensorMat);
        sensor.position.set(-25, 10, -20);
        scene.add(sensor);
        objects.push(sensor);

        // LineSegments sensor array radiating from sensor
        var sensorArrayGeom = new THREE.BufferGeometry();
        var sensorPositions = new Float32Array([
            -25, 10, -20,  -20, 12, -18,
            -25, 10, -20,  -30, 12, -22,
            -25, 10, -20,  -25, 12, -15,
            -25, 10, -20,  -25, 12, -25
        ]);
        sensorArrayGeom.setAttribute('position', new THREE.BufferAttribute(sensorPositions, 3));
        var sensorArrayMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        var sensorArray = new THREE.LineSegments(sensorArrayGeom, sensorArrayMat);
        scene.add(sensorArray);
        objects.push(sensorArray);

        // Standing wave artillery ranging post - box clifftop observation tower
        var towerGeom = new THREE.BoxGeometry(5, 12, 5);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(20, 6, 15);
        scene.add(tower);
        objects.push(tower);

        // Cylinder range finder on tower
        var rangeFinderGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 12);
        var rangeFinderMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var rangeFinder = new THREE.Mesh(rangeFinderGeom, rangeFinderMat);
        rangeFinder.position.set(20, 14, 15);
        rangeFinder.rotation.z = Math.PI / 6;
        scene.add(rangeFinder);
        objects.push(rangeFinder);

        // Box plotting table
        var plotTableGeom = new THREE.BoxGeometry(8, 2, 6);
        var plotTableMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var plotTable = new THREE.Mesh(plotTableGeom, plotTableMat);
        plotTable.position.set(20, 0, 15);
        scene.add(plotTable);
        objects.push(plotTable);

        // Jura/Scarba channel blockade post - box clifftop gun position
        var gunPosGeom = new THREE.BoxGeometry(6, 3, 8);
        var gunPosMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var gunPos = new THREE.Mesh(gunPosGeom, gunPosMat);
        gunPos.position.set(-10, 8, 22);
        scene.add(gunPos);
        objects.push(gunPos);

        // Cylinder gun barrel
        var gunBarrelGeom = new THREE.CylinderGeometry(1, 1.2, 10, 12);
        var gunBarrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var gunBarrel = new THREE.Mesh(gunBarrelGeom, gunBarrelMat);
        gunBarrel.position.set(-10, 12, 22);
        gunBarrel.rotation.z = Math.PI / 5;
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        // LineSegments aiming cables
        var aimingCablesGeom = new THREE.BufferGeometry();
        var aimingPositions = new Float32Array([
            -10, 12, 22,  -5, 15, 20,
            -10, 12, 22,  -15, 15, 24,
            -10, 12, 22,  -10, 8, 27
        ]);
        aimingCablesGeom.setAttribute('position', new THREE.BufferAttribute(aimingPositions, 3));
        var aimingMat = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
        var aimingCables = new THREE.LineSegments(aimingCablesGeom, aimingMat);
        scene.add(aimingCables);
        objects.push(aimingCables);

        // Underwater tunnel entrance - box concrete arch
        var archGeom = new THREE.BoxGeometry(8, 6, 3);
        var archMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var arch = new THREE.Mesh(archGeom, archMat);
        arch.position.set(5, -5, -25);
        scene.add(arch);
        objects.push(arch);

        // Box tunnel section 1
        var tunnelGeom = new THREE.BoxGeometry(7, 5, 10);
        var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var tunnel1 = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnel1.position.set(5, -5, -35);
        scene.add(tunnel1);
        objects.push(tunnel1);

        // Cylinder support ring
        var supportGeom = new THREE.CylinderGeometry(4, 4, 1, 12);
        var supportMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var support = new THREE.Mesh(supportGeom, supportMat);
        support.position.set(5, -9, -30);
        scene.add(support);
        objects.push(support);

        // Whirlpool current generator - cylinder turbine housing in water
        var turbineGeom = new THREE.CylinderGeometry(3, 3, 8, 16);
        var turbineMat = new THREE.MeshLambertMaterial({ color: 0x1a472a });
        var turbine = new THREE.Mesh(turbineGeom, turbineMat);
        turbine.position.set(-15, -2, 0);
        scene.add(turbine);
        objects.push(turbine);

        // Box power station
        var powerStationGeom = new THREE.BoxGeometry(10, 8, 6);
        var powerStationMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var powerStation = new THREE.Mesh(powerStationGeom, powerStationMat);
        powerStation.position.set(-15, 5, 0);
        scene.add(powerStation);
        objects.push(powerStation);

        // LineSegments power cables
        var powerCablesGeom = new THREE.BufferGeometry();
        var powerPositions = new Float32Array([
            -15, 2, 0,  -15, 1, 6,
            -15, 2, 0,  -15, 1, -6,
            -15, 2, 0,  -10, 0, 0,
            -15, 2, 0,  -20, 0, 0
        ]);
        powerCablesGeom.setAttribute('position', new THREE.BufferAttribute(powerPositions, 3));
        var powerMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
        var powerCables = new THREE.LineSegments(powerCablesGeom, powerMat);
        scene.add(powerCables);
        objects.push(powerCables);

        // George Orwell cottage OP - box cottage converted HQ
        var cottageGeom = new THREE.BoxGeometry(12, 6, 10);
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var cottage = new THREE.Mesh(cottageGeom, cottageMat);
        cottage.position.set(25, 3, -5);
        scene.add(cottage);
        objects.push(cottage);

        // Box outbuilding
        var outbuildingGeom = new THREE.BoxGeometry(6, 4, 8);
        var outbuildingMat = new THREE.MeshLambertMaterial({ color: 0x9a7a63 });
        var outbuilding = new THREE.Mesh(outbuildingGeom, outbuildingMat);
        outbuilding.position.set(32, 2, -5);
        scene.add(outbuilding);
        objects.push(outbuilding);

        // Cylinder water pump
        var pumpGeom = new THREE.CylinderGeometry(1.5, 2, 6, 12);
        var pumpMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var pump = new THREE.Mesh(pumpGeom, pumpMat);
        pump.position.set(28, 2, -10);
        scene.add(pump);
        objects.push(pump);

        // Emergency evacuation pier - box floating pier
        var pierGeom = new THREE.BoxGeometry(14, 2, 4);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(0, -1, 28);
        scene.add(pier);
        objects.push(pier);

        // Sphere rescue buoys
        var buoyGeom = new THREE.SphereGeometry(1.5, 12, 12);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(-5, 0, 28);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(5, 0, 28);
        scene.add(buoy2);
        objects.push(buoy2);

        // LineSegments lifeline
        var lifelineGeom = new THREE.BufferGeometry();
        var lifelinePositions = new Float32Array([
            -5, 0, 28,  -5, 2, 25,
            5, 0, 28,  5, 2, 25,
            -7, 0, 28,  7, 0, 28
        ]);
        lifelineGeom.setAttribute('position', new THREE.BufferAttribute(lifelinePositions, 3));
        var lifelineMat = new THREE.LineBasicMaterial({ color: 0xffa500, linewidth: 2 });
        var lifeline = new THREE.LineSegments(lifelineGeom, lifelineMat);
        scene.add(lifeline);
        objects.push(lifeline);

        // Additional cone observation post
        var coneGeom = new THREE.ConeGeometry(2, 5, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x6b4c3a });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(-20, 4, 10);
        scene.add(cone);
        objects.push(cone);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate turbine rotation
        if (objects.length > 13) {
            objects[13].rotation.y += 0.01;
        }
        // Gentle buoy bobbing
        if (objects.length > 21) {
            objects[21].position.y = -0.3 + Math.sin(Date.now() * 0.001) * 0.5;
        }
        if (objects.length > 22) {
            objects[22].position.y = -0.3 + Math.sin(Date.now() * 0.001 + 1) * 0.5;
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
