window.HelensburghBase = (function() {
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
        // Clyde waterfront defensive line
        // Victorian pier (box)
        var pierGeom = new THREE.BoxGeometry(8, 2, 20);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(-25, 1, 0);
        scene.add(pier);
        objects.push(pier);

        // Harbor crane (cylinder)
        var craneGeom = new THREE.CylinderGeometry(1.5, 1.5, 18, 16);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var crane = new THREE.Mesh(craneGeom, craneMat);
        crane.position.set(-20, 9, 5);
        scene.add(crane);
        objects.push(crane);

        // Customs shed (box)
        var shedGeom = new THREE.BoxGeometry(10, 6, 12);
        var shedMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var shed = new THREE.Mesh(shedGeom, shedMat);
        shed.position.set(-18, 3, -12);
        scene.add(shed);
        objects.push(shed);

        // Hill House elevated command post
        // Charles Rennie Mackintosh mansion (box)
        var mansionGeom = new THREE.BoxGeometry(14, 10, 16);
        var mansionMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        var mansion = new THREE.Mesh(mansionGeom, mansionMat);
        mansion.position.set(8, 5, -18);
        scene.add(mansion);
        objects.push(mansion);

        // Water tower (cylinder)
        var towerGeom = new THREE.CylinderGeometry(2, 2.5, 22, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(12, 11, -8);
        scene.add(tower);
        objects.push(tower);

        // Garage block (box)
        var garageGeom = new THREE.BoxGeometry(10, 5, 14);
        var garageMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
        var garage = new THREE.Mesh(garageGeom, garageMat);
        garage.position.set(15, 2.5, -22);
        scene.add(garage);
        objects.push(garage);

        // Helensburgh Central Station control
        // Stone station building (box)
        var stationGeom = new THREE.BoxGeometry(16, 8, 12);
        var stationMat = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
        var station = new THREE.Mesh(stationGeom, stationMat);
        station.position.set(5, 4, 15);
        scene.add(station);
        objects.push(station);

        // Signal cabin (box)
        var cabinGeom = new THREE.BoxGeometry(6, 5, 6);
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.position.set(15, 2.5, 18);
        scene.add(cabin);
        objects.push(cabin);

        // Tank engine (cylinder)
        var engineGeom = new THREE.CylinderGeometry(1.8, 1.8, 16, 12);
        var engineMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var engine = new THREE.Mesh(engineGeom, engineMat);
        engine.position.set(-5, 0.9, 12);
        scene.add(engine);
        objects.push(engine);

        // Rhu marina naval patrol
        // Stone breakwater (box)
        var breakwaterGeom = new THREE.BoxGeometry(24, 4, 6);
        var breakwaterMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var breakwater = new THREE.Mesh(breakwaterGeom, breakwaterMat);
        breakwater.position.set(0, 2, 28);
        scene.add(breakwater);
        objects.push(breakwater);

        // Patrol boat hull (cylinder)
        var boatGeom = new THREE.CylinderGeometry(1.2, 1.5, 10, 16);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x191970 });
        var boat = new THREE.Mesh(boatGeom, boatMat);
        boat.position.set(-8, 0.75, 32);
        scene.add(boat);
        objects.push(boat);

        // Mooring buoys (sphere)
        var buoyGeom = new THREE.SphereGeometry(0.8, 12, 12);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(6, 0.8, 34);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(14, 0.8, 36);
        scene.add(buoy2);
        objects.push(buoy2);

        // Net cables (LineSegments)
        var netGeom = new THREE.BufferGeometry();
        var netVerts = new Float32Array([
            -8, 1, 32,   6, 1, 34,
            6, 1, 34,    14, 1, 36,
            14, 1, 36,   -8, 1, 32,
            -8, 0.5, 32, 14, 0.5, 36
        ]);
        netGeom.setAttribute('position', new THREE.BufferAttribute(netVerts, 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x00CED1 });
        var nets = new THREE.LineSegments(netGeom, netMat);
        scene.add(nets);
        objects.push(nets);

        // Loch Lomond Road checkpoint
        // Concrete barriers (box)
        var barrierGeom = new THREE.BoxGeometry(12, 2, 3);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(-28, 1, 8);
        scene.add(barrier);
        objects.push(barrier);

        // Guard tower (cylinder)
        var guardGeom = new THREE.CylinderGeometry(1.2, 1.2, 14, 10);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var guard = new THREE.Mesh(guardGeom, guardMat);
        guard.position.set(-20, 7, 15);
        scene.add(guard);
        objects.push(guard);

        // Sandbag bunker (box)
        var bunkerGeom = new THREE.BoxGeometry(8, 4, 10);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(-32, 2, 12);
        scene.add(bunker);
        objects.push(bunker);

        // Gareloch approach sensors
        // Sonar floats (sphere)
        var sonarGeom = new THREE.SphereGeometry(0.6, 10, 10);
        var sonarMat = new THREE.MeshLambertMaterial({ color: 0x20B2AA });
        var sonar1 = new THREE.Mesh(sonarGeom, sonarMat);
        sonar1.position.set(25, 0.6, -15);
        scene.add(sonar1);
        objects.push(sonar1);

        var sonar2 = new THREE.Mesh(sonarGeom, sonarMat);
        sonar2.position.set(30, 0.6, -5);
        scene.add(sonar2);
        objects.push(sonar2);

        // Cable grid (LineSegments)
        var cableGeom = new THREE.BufferGeometry();
        var cableVerts = new Float32Array([
            25, 1, -15, 30, 1, -5,
            30, 1, -5,  28, 1, 5,
            28, 1, 5,   25, 1, -15,
            25, 0.5, -15, 28, 0.5, 5
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cableVerts, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x00BFFF });
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Clifftop hut (box)
        var hutGeom = new THREE.BoxGeometry(6, 5, 8);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(28, 2.5, -2);
        scene.add(hut);
        objects.push(hut);

        // Ardencaple Castle ruin stronghold
        // Ruined keep (box)
        var keepGeom = new THREE.BoxGeometry(12, 16, 10);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var keep = new THREE.Mesh(keepGeom, keepMat);
        keep.position.set(-10, 8, -28);
        scene.add(keep);
        objects.push(keep);

        // Courtyard wall (box)
        var wallGeom = new THREE.BoxGeometry(20, 6, 2);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(-8, 3, -20);
        scene.add(wall);
        objects.push(wall);

        // Turret (cone)
        var turretGeom = new THREE.ConeGeometry(2, 10, 12);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
        var turret = new THREE.Mesh(turretGeom, turretMat);
        turret.position.set(-5, 5, -32);
        scene.add(turret);
        objects.push(turret);

        // Clyde submarine approach minefield
        // Mines (sphere)
        var mineGeom = new THREE.SphereGeometry(0.9, 14, 14);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var mine1 = new THREE.Mesh(mineGeom, mineMat);
        mine1.position.set(20, 0.9, -25);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeom, mineMat);
        mine2.position.set(22, 0.9, -18);
        scene.add(mine2);
        objects.push(mine2);

        // Perimeter wire (LineSegments)
        var wireGeom = new THREE.BufferGeometry();
        var wireVerts = new Float32Array([
            20, 1, -25, 22, 1, -18,
            22, 1, -18, 25, 1, -22,
            25, 1, -22, 20, 1, -25,
            20, 0.5, -25, 25, 0.5, -22
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xFF4500 });
        var wires = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wires);
        objects.push(wires);

        // Clifftop OP (box)
        var opGeom = new THREE.BoxGeometry(5, 4, 7);
        var opMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var op = new THREE.Mesh(opGeom, opMat);
        op.position.set(26, 2, -28);
        scene.add(op);
        objects.push(op);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(15, 20, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.05;
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
