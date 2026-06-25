window.SouthendBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        // Mull of Kintyre cliff box terrain
        var terrainGeom = new THREE.BoxGeometry(80, 15, 60);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -8, 0);
        terrain.castShadow = true;
        terrain.receiveShadow = true;
        scene.add(terrain);
        objects.push(terrain);

        // Mull lighthouse cylinder
        var lighthouseGeom = new THREE.CylinderGeometry(8, 8, 35, 16);
        var lighthouseMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var lighthouse = new THREE.Mesh(lighthouseGeom, lighthouseMat);
        lighthouse.position.set(15, 12, -20);
        lighthouse.castShadow = true;
        scene.add(lighthouse);
        objects.push(lighthouse);

        // Lighthouse lantern room box
        var lanternGeom = new THREE.BoxGeometry(12, 8, 12);
        var lanternMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var lantern = new THREE.Mesh(lanternGeom, lanternMat);
        lantern.position.set(15, 31, -20);
        lantern.castShadow = true;
        scene.add(lantern);
        objects.push(lantern);

        // Lighthouse keepers house box
        var keepersGeom = new THREE.BoxGeometry(18, 10, 16);
        var keepersMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var keepers = new THREE.Mesh(keepersGeom, keepersMat);
        keepers.position.set(15, 5, 0);
        keepers.castShadow = true;
        scene.add(keepers);
        objects.push(keepers);

        // Dunaverty Rock cylinder rocky stack
        var rockGeom = new THREE.CylinderGeometry(12, 15, 25, 12);
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var rock = new THREE.Mesh(rockGeom, rockMat);
        rock.position.set(-25, -5, 15);
        rock.castShadow = true;
        scene.add(rock);
        objects.push(rock);

        // Dunaverty castle box on rock
        var castleGeom = new THREE.BoxGeometry(16, 12, 16);
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var castle = new THREE.Mesh(castleGeom, castleMat);
        castle.position.set(-25, 18, 15);
        castle.castShadow = true;
        scene.add(castle);
        objects.push(castle);

        // Clifftop observation post box
        var opGeom = new THREE.BoxGeometry(10, 8, 10);
        var opMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var op = new THREE.Mesh(opGeom, opMat);
        op.position.set(-10, 8, -28);
        op.castShadow = true;
        scene.add(op);
        objects.push(op);

        // Acoustic sensor sphere
        var sensorGeom = new THREE.SphereGeometry(5, 16, 16);
        var sensorMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
        var sensor = new THREE.Mesh(sensorGeom, sensorMat);
        sensor.position.set(-10, 18, -28);
        sensor.castShadow = true;
        scene.add(sensor);
        objects.push(sensor);

        // LineSegments buoy markers
        var buoyGeo = new THREE.BufferGeometry();
        var buoyPos = new Float32Array([
            -20, -2, -35,  -20, 3, -35,
            -30, -2, -40,  -30, 3, -40
        ]);
        buoyGeo.setAttribute('position', new THREE.BufferAttribute(buoyPos, 3));
        var buoyLine = new THREE.LineSegments(buoyGeo, new THREE.LineBasicMaterial({ color: 0xFF0000 }));
        scene.add(buoyLine);
        objects.push(buoyLine);

        // Carskey Bay patrol hut box
        var hutGeom = new THREE.BoxGeometry(12, 7, 14);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(22, 2, 25);
        hut.castShadow = true;
        scene.add(hut);
        objects.push(hut);

        // Carskey Bay watchtower cylinder
        var towerGeom = new THREE.CylinderGeometry(6, 6, 20, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(22, 10, 20);
        tower.castShadow = true;
        scene.add(tower);
        objects.push(tower);

        // Viking longship wreck hull ribs box
        var hullGeom = new THREE.BoxGeometry(18, 6, 8);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x4B3621 });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(28, -6, -15);
        hull.receiveShadow = true;
        scene.add(hull);
        objects.push(hull);

        // Viking mast stub cylinder
        var mastGeom = new THREE.CylinderGeometry(3, 3, 12, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(28, 0, -15);
        mast.castShadow = true;
        scene.add(mast);
        objects.push(mast);

        // Underground ROF ammunition store roof box
        var storageGeom = new THREE.BoxGeometry(20, 6, 25);
        var storageMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var storage = new THREE.Mesh(storageGeom, storageMat);
        storage.position.set(-5, -12, 10);
        storage.castShadow = true;
        scene.add(storage);
        objects.push(storage);

        // ROF ventilation shaft cylinder
        var ventGeom = new THREE.CylinderGeometry(4, 4, 18, 10);
        var ventMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var vent = new THREE.Mesh(ventGeom, ventMat);
        vent.position.set(-5, -6, 10);
        vent.castShadow = true;
        scene.add(vent);
        objects.push(vent);

        // ROF entrance hatch box
        var hatchGeom = new THREE.BoxGeometry(8, 6, 4);
        var hatchMat = new THREE.MeshLambertMaterial({ color: 0x3D3D3D });
        var hatch = new THREE.Mesh(hatchGeom, hatchMat);
        hatch.position.set(-5, -9, 23);
        hatch.castShadow = true;
        scene.add(hatch);
        objects.push(hatch);

        // Cliff path stone wall box
        var wallGeom = new THREE.BoxGeometry(50, 4, 3);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(0, 3, -30);
        wall.castShadow = true;
        scene.add(wall);
        objects.push(wall);

        // Tripwire LineSegments across path
        var tripGeo = new THREE.BufferGeometry();
        var tripPos = new Float32Array([
            -15, 3, -29,  15, 3, -29,
            -10, 3, -28,  10, 3, -28
        ]);
        tripGeo.setAttribute('position', new THREE.BufferAttribute(tripPos, 3));
        var tripLine = new THREE.LineSegments(tripGeo, new THREE.LineBasicMaterial({ color: 0x8B4513, linewidth: 2 }));
        scene.add(tripLine);
        objects.push(tripLine);

        // Add directional light
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(20, 30, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        scene.add(dirLight);
        lights.push(dirLight);

        // Add ambient light
        var ambLight = new THREE.AmbientLight(0x606060, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);
    }

    function update(delta) {
        // Animation placeholder
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
