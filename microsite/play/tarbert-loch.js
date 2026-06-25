window.TarbertLoch = (function() {
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
        buildLoch();
    }

    function buildLoch() {
        var mainLight = new THREE.PointLight(0xffffff, 1, 200);
        mainLight.position.set(0, 50, 0);
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0x888888, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Highland harbor box terrain
        var terrainGeo = new THREE.BoxGeometry(80, 3, 80);
        var terrainMat = new THREE.MeshLambertMaterial({color: 0x4a4a3a});
        var terrain = new THREE.Mesh(terrainGeo, terrainMat);
        terrain.position.set(0, -2, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Tarbert Castle hilltop strongpoint - ruined castle box
        var castleGeo = new THREE.BoxGeometry(20, 8, 20);
        var castleMat = new THREE.MeshLambertMaterial({color: 0x8b7355});
        var castle = new THREE.Mesh(castleGeo, castleMat);
        castle.position.set(-25, 5, -20);
        scene.add(castle);
        objects.push(castle);

        // Castle tower stump - cylinder
        var towerGeo = new THREE.CylinderGeometry(6, 8, 12, 8);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x6b5344});
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(-25, 9, -20);
        scene.add(tower);
        objects.push(tower);

        // Castle bailey wall - box
        var baileyGeo = new THREE.BoxGeometry(35, 4, 2);
        var baileyMat = new THREE.MeshLambertMaterial({color: 0x7a6b56});
        var bailey = new THREE.Mesh(baileyGeo, baileyMat);
        bailey.position.set(-20, 2, -5);
        scene.add(bailey);
        objects.push(bailey);

        // East Loch Tarbert harbor naval base - stone quay box
        var quayGeo = new THREE.BoxGeometry(30, 2, 8);
        var quayMat = new THREE.MeshLambertMaterial({color: 0x5a5a4a});
        var quay = new THREE.Mesh(quayGeo, quayMat);
        quay.position.set(15, 0, 10);
        scene.add(quay);
        objects.push(quay);

        // Patrol vessel 1 - box
        var vesselGeo = new THREE.BoxGeometry(8, 4, 3);
        var vesselMat = new THREE.MeshLambertMaterial({color: 0x2a4a6a});
        var vessel1 = new THREE.Mesh(vesselGeo, vesselMat);
        vessel1.position.set(8, 2, 8);
        scene.add(vessel1);
        objects.push(vessel1);

        // Patrol vessel 2 - box
        var vessel2 = new THREE.Mesh(vesselGeo, vesselMat);
        vessel2.position.set(22, 2, 12);
        scene.add(vessel2);
        objects.push(vessel2);

        // Lighthouse - cylinder
        var lightGeo = new THREE.CylinderGeometry(3, 4, 16, 12);
        var lightMat = new THREE.MeshLambertMaterial({color: 0xcccccc});
        var lighthouse = new THREE.Mesh(lightGeo, lightMat);
        lighthouse.position.set(28, 8, 15);
        scene.add(lighthouse);
        objects.push(lighthouse);

        // West Loch Tarbert ferry ramp - box RoRo ramp
        var rampGeo = new THREE.BoxGeometry(12, 2, 16);
        var rampMat = new THREE.MeshLambertMaterial({color: 0x4a4a3a});
        var ramp = new THREE.Mesh(rampGeo, rampMat);
        ramp.position.set(-15, 0, 25);
        scene.add(ramp);
        objects.push(ramp);

        // Ferry barrier - box
        var barrierGeo = new THREE.BoxGeometry(14, 3, 2);
        var barrierMat = new THREE.MeshLambertMaterial({color: 0xff6b00});
        var barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(-15, 1.5, 32);
        scene.add(barrier);
        objects.push(barrier);

        // Bollard pair - cylinder 1
        var bollardGeo = new THREE.CylinderGeometry(1.5, 2, 4, 8);
        var bollardMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
        var bollard1 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard1.position.set(-8, 2, 32);
        scene.add(bollard1);
        objects.push(bollard1);

        // Bollard pair - cylinder 2
        var bollard2 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard2.position.set(-22, 2, 32);
        scene.add(bollard2);
        objects.push(bollard2);

        // Skipness Road ambush position - stone wall box
        var wallGeo = new THREE.BoxGeometry(25, 2, 2);
        var wallMat = new THREE.MeshLambertMaterial({color: 0x6a5a4a});
        var wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(20, 1, -28);
        scene.add(wall);
        objects.push(wall);

        // Elevated shooting platform - box
        var platformGeo = new THREE.BoxGeometry(12, 3, 10);
        var platformMat = new THREE.MeshLambertMaterial({color: 0x5a5a3a});
        var platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(28, 5, -22);
        scene.add(platform);
        objects.push(platform);

        // Road tripwires - LineSegments
        var wireGeometry = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            15, 2, -28,
            25, 2, -28,
            18, 2, -32,
            22, 2, -24,
            20, 2, -20,
            30, 2, -25
        ]);
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({color: 0xffff00, linewidth: 2});
        var wires = new THREE.LineSegments(wireGeometry, wireMat);
        scene.add(wires);
        objects.push(wires);

        // Kennacraig ferry terminal blockade - terminal building box
        var terminalGeo = new THREE.BoxGeometry(18, 6, 14);
        var terminalMat = new THREE.MeshLambertMaterial({color: 0x7a7a6a});
        var terminal = new THREE.Mesh(terminalGeo, terminalMat);
        terminal.position.set(-30, 3, -5);
        scene.add(terminal);
        objects.push(terminal);

        // Lorry park - box
        var parkGeo = new THREE.BoxGeometry(16, 1, 20);
        var parkMat = new THREE.MeshLambertMaterial({color: 0x4a4a3a});
        var park = new THREE.Mesh(parkGeo, parkMat);
        park.position.set(-28, 0.5, 10);
        scene.add(park);
        objects.push(park);

        // Fuel tank - cylinder
        var tankGeo = new THREE.CylinderGeometry(5, 5, 10, 12);
        var tankMat = new THREE.MeshLambertMaterial({color: 0xff4400});
        var tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(-35, 5, 5);
        scene.add(tank);
        objects.push(tank);

        // Carradale Bay acoustic sensor net - sonar buoys (spheres)
        var buoyGeo = new THREE.SphereGeometry(2, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({color: 0x00aa00});
        var buoy1 = new THREE.Mesh(buoyGeo, buoyMat);
        buoy1.position.set(30, 1, -15);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeo, buoyMat);
        buoy2.position.set(25, 1, -28);
        scene.add(buoy2);
        objects.push(buoy2);

        // Detection cables across bay - LineSegments
        var cableGeometry = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            30, 1, -15,
            25, 1, -28,
            32, 1, -10,
            28, 1, -30
        ]);
        cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({color: 0x00ff00, linewidth: 1});
        var cables = new THREE.LineSegments(cableGeometry, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Ard Mhor hilltop relay station - equipment shelter box
        var shelterGeo = new THREE.BoxGeometry(10, 5, 8);
        var shelterMat = new THREE.MeshLambertMaterial({color: 0x6a6a5a});
        var shelter = new THREE.Mesh(shelterGeo, shelterMat);
        shelter.position.set(-5, 3, -35);
        scene.add(shelter);
        objects.push(shelter);

        // Comms mast - cylinder
        var mastGeo = new THREE.CylinderGeometry(1.5, 2, 18, 8);
        var mastMat = new THREE.MeshLambertMaterial({color: 0x999999});
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(-5, 10, -35);
        scene.add(mast);
        objects.push(mast);

        // Radome - sphere
        var radomeGeo = new THREE.SphereGeometry(3.5, 12, 12);
        var radiomeMat = new THREE.MeshLambertMaterial({color: 0xccccff});
        var radome = new THREE.Mesh(radomeGeo, radiomeMat);
        radome.position.set(-5, 11, -35);
        scene.add(radome);
        objects.push(radome);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.0001;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
