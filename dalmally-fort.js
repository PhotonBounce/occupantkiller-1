window.DalmallyFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Victorian railway station box
        var stationGeometry = new THREE.BoxGeometry(12, 6, 8);
        var stationMaterial = new THREE.MeshLambertMaterial({ color: 0xc4a478 });
        var station = new THREE.Mesh(stationGeometry, stationMaterial);
        station.position.set(-20, 3, -15);
        scene.add(station);
        objects.push(station);

        // Signal box structure
        var signalGeometry = new THREE.BoxGeometry(4, 8, 4);
        var signalMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var signal = new THREE.Mesh(signalGeometry, signalMaterial);
        signal.position.set(-10, 4, -18);
        scene.add(signal);
        objects.push(signal);

        // Water tower cylinder
        var towerGeometry = new THREE.CylinderGeometry(3, 3.5, 14, 12);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(0, 7, -20);
        scene.add(tower);
        objects.push(tower);

        // Stone bridge structure
        var bridgeGeometry = new THREE.BoxGeometry(10, 2, 5);
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(15, 1, -10);
        scene.add(bridge);
        objects.push(bridge);

        // Explosive charge sphere on bridge
        var chargeGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        var chargeMaterial = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        var charge = new THREE.Mesh(chargeGeometry, chargeMaterial);
        charge.position.set(18, 3, -10);
        scene.add(charge);
        objects.push(charge);

        // Command wire using LineSegments
        var wireGeometry = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            18, 3, -10,
            25, 5, 0
        ]);
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wire);
        objects.push(wire);

        // Church tower cylinder
        var churchTowerGeometry = new THREE.CylinderGeometry(2.5, 2.5, 12, 8);
        var churchMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var churchTower = new THREE.Mesh(churchTowerGeometry, churchMaterial);
        churchTower.position.set(-25, 6, 5);
        scene.add(churchTower);
        objects.push(churchTower);

        // Church nave barracks box
        var naveGeometry = new THREE.BoxGeometry(8, 5, 14);
        var naveMaterial = new THREE.MeshLambertMaterial({ color: 0xa0522d });
        var nave = new THREE.Mesh(naveGeometry, naveMaterial);
        nave.position.set(-20, 2.5, 10);
        scene.add(nave);
        objects.push(nave);

        // Lochside reeds cover box
        var reedsGeometry = new THREE.BoxGeometry(6, 3, 8);
        var reedsMaterial = new THREE.MeshLambertMaterial({ color: 0x6b8e23 });
        var reeds = new THREE.Mesh(reedsGeometry, reedsMaterial);
        reeds.position.set(25, 1.5, 8);
        scene.add(reeds);
        objects.push(reeds);

        // Sniper nest box
        var sniperGeometry = new THREE.BoxGeometry(4, 4, 4);
        var sniperMaterial = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var sniper = new THREE.Mesh(sniperGeometry, sniperMaterial);
        sniper.position.set(28, 3, 12);
        scene.add(sniper);
        objects.push(sniper);

        // Tripwire using LineSegments
        var tripGeometry = new THREE.BufferGeometry();
        var tripPositions = new Float32Array([
            25, 1.2, 15,
            32, 1.2, 15
        ]);
        tripGeometry.setAttribute('position', new THREE.BufferAttribute(tripPositions, 3));
        var tripMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
        var trip = new THREE.LineSegments(tripGeometry, tripMaterial);
        scene.add(trip);
        objects.push(trip);

        // Farmhouse box
        var farmhouseGeometry = new THREE.BoxGeometry(7, 5, 9);
        var farmhouseMaterial = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        var farmhouse = new THREE.Mesh(farmhouseGeometry, farmhouseMaterial);
        farmhouse.position.set(-15, 2.5, 20);
        scene.add(farmhouse);
        objects.push(farmhouse);

        // Barn box
        var barnGeometry = new THREE.BoxGeometry(10, 6, 12);
        var barnMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        var barn = new THREE.Mesh(barnGeometry, barnMaterial);
        barn.position.set(-5, 3, 22);
        scene.add(barn);
        objects.push(barn);

        // Diesel tank cylinder
        var tankGeometry = new THREE.CylinderGeometry(2.5, 2.5, 5, 12);
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.set(5, 2.5, 25);
        scene.add(tank);
        objects.push(tank);

        // Gun emplacement box on hillside
        var gunEmplaceGeometry = new THREE.BoxGeometry(6, 2, 6);
        var gunEmplaceMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var gunEmplace = new THREE.Mesh(gunEmplaceGeometry, gunEmplaceMaterial);
        gunEmplace.position.set(20, 8, 25);
        scene.add(gunEmplace);
        objects.push(gunEmplace);

        // Gun barrel cylinder
        var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(20, 9.5, 25);
        barrel.rotation.z = Math.PI / 6;
        scene.add(barrel);
        objects.push(barrel);

        // Gun crew shelter box
        var crewShelterGeometry = new THREE.BoxGeometry(5, 3, 5);
        var crewShelterMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var crewShelter = new THREE.Mesh(crewShelterGeometry, crewShelterMaterial);
        crewShelter.position.set(28, 7, 28);
        scene.add(crewShelter);
        objects.push(crewShelter);

        // Comms mast cylinder
        var mastGeometry = new THREE.CylinderGeometry(1.2, 1.2, 16, 8);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(-28, 8, -25);
        scene.add(mast);
        objects.push(mast);

        // Equipment block box
        var equipGeometry = new THREE.BoxGeometry(5, 4, 5);
        var equipMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var equip = new THREE.Mesh(equipGeometry, equipMaterial);
        equip.position.set(-28, 2.5, -20);
        scene.add(equip);
        objects.push(equip);

        // Weather sensor sphere
        var sensorGeometry = new THREE.SphereGeometry(0.9, 8, 8);
        var sensorMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        var sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
        sensor.position.set(-28, 24, -25);
        scene.add(sensor);
        objects.push(sensor);

        // Rock wall box
        var rockGeometry = new THREE.BoxGeometry(15, 10, 3);
        var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(10, 5, -28);
        scene.add(rock);
        objects.push(rock);

        // Vehicle wreck box
        var wreckGeometry = new THREE.BoxGeometry(4, 2, 8);
        var wreckMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var wreck = new THREE.Mesh(wreckGeometry, wreckMaterial);
        wreck.position.set(8, 1.2, -22);
        wreck.rotation.z = 0.3;
        scene.add(wreck);
        objects.push(wreck);

        // IED charge sphere
        var iedGeometry = new THREE.SphereGeometry(0.7, 8, 8);
        var iedMaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        var ied = new THREE.Mesh(iedGeometry, iedMaterial);
        ied.position.set(5, 1.5, -25);
        scene.add(ied);
        objects.push(ied);

        // Add directional light for general illumination
        var lightDir = new THREE.DirectionalLight(0xffffff, 0.7);
        lightDir.position.set(30, 30, 30);
        scene.add(lightDir);
        lights.push(lightDir);

        // Add ambient light for fill
        var lightAmb = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(lightAmb);
        lights.push(lightAmb);
    }

    function update(delta) {
        if (!scene) return;
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.05;
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
