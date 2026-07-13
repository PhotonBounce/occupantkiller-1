window.AyrDock = (function() {
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
        // Ayr Harbour Dock - stone harbour wall
        var wallGeometry = new THREE.BoxGeometry(40, 8, 4);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(-25, 4, -28);
        scene.add(wall);
        objects.push(wall);

        // Ayr Harbour - patrol boat hull
        var boatHullGeometry = new THREE.CylinderGeometry(3, 3.5, 12, 16);
        var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x2C3E50 });
        var boatHull = new THREE.Mesh(boatHullGeometry, boatMaterial);
        boatHull.position.set(5, 2, -20);
        scene.add(boatHull);
        objects.push(boatHull);

        // Mooring buoys
        var buoyGeometry = new THREE.SphereGeometry(1.5, 12, 12);
        var buoyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
        var buoy1 = new THREE.Mesh(buoyGeometry, buoyMaterial);
        buoy1.position.set(12, 1.5, -15);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeometry, buoyMaterial);
        buoy2.position.set(20, 1.5, -18);
        scene.add(buoy2);
        objects.push(buoy2);

        // Net cables (LineSegments)
        var lineGeometry = new THREE.BufferGeometry();
        var linePositions = new Float32Array([
            12, 3, -15,  20, 3, -18,
            5, 5, -20,   12, 3, -15
        ]);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x34495E });
        var cables = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(cables);
        objects.push(cables);

        // Burns Monument - Greek temple box
        var templeGeometry = new THREE.BoxGeometry(10, 12, 8);
        var templeMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        var temple = new THREE.Mesh(templeGeometry, templeMaterial);
        temple.position.set(-18, 6, 8);
        scene.add(temple);
        objects.push(temple);

        // Burns Monument - fortified courtyard
        var courtyardGeometry = new THREE.BoxGeometry(16, 4, 14);
        var courtyardMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var courtyard = new THREE.Mesh(courtyardGeometry, courtyardMaterial);
        courtyard.position.set(-18, 2, 20);
        scene.add(courtyard);
        objects.push(courtyard);

        // Signal mast
        var mastGeometry = new THREE.CylinderGeometry(0.6, 0.8, 16, 8);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(-18, 10, 8);
        scene.add(mast);
        objects.push(mast);

        // Ayr Racecourse FOB - grandstand command center
        var grandstandGeometry = new THREE.BoxGeometry(18, 7, 10);
        var grandstandMaterial = new THREE.MeshLambertMaterial({ color: 0xD4A574 });
        var grandstand = new THREE.Mesh(grandstandGeometry, grandstandMaterial);
        grandstand.position.set(15, 3.5, 10);
        scene.add(grandstand);
        objects.push(grandstand);

        // Stable blocks
        var stableGeometry = new THREE.BoxGeometry(8, 5, 12);
        var stableMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var stable = new THREE.Mesh(stableGeometry, stableMaterial);
        stable.position.set(28, 2.5, 22);
        scene.add(stable);
        objects.push(stable);

        // Fuel tank
        var tankGeometry = new THREE.CylinderGeometry(2.5, 2.5, 8, 12);
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.set(22, 4, 28);
        scene.add(tank);
        objects.push(tank);

        // Auld Brig - medieval stone bridge
        var bridgeGeometry = new THREE.BoxGeometry(20, 6, 4);
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(8, 3, -5);
        scene.add(bridge);
        objects.push(bridge);

        // Explosive charges
        var chargeGeometry = new THREE.SphereGeometry(1, 10, 10);
        var chargeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var charge1 = new THREE.Mesh(chargeGeometry, chargeMaterial);
        charge1.position.set(2, 4, -5);
        scene.add(charge1);
        objects.push(charge1);

        var charge2 = new THREE.Mesh(chargeGeometry, chargeMaterial);
        charge2.position.set(14, 4, -5);
        scene.add(charge2);
        objects.push(charge2);

        // Detonator wire
        var detGeometry = new THREE.BufferGeometry();
        var detPositions = new Float32Array([
            2, 5, -5,  8, 8, -5,  14, 5, -5
        ]);
        detGeometry.setAttribute('position', new THREE.BufferAttribute(detPositions, 3));
        var detMaterial = new THREE.LineBasicMaterial({ color: 0xFFD700 });
        var detonator = new THREE.LineSegments(detGeometry, detMaterial);
        scene.add(detonator);
        objects.push(detonator);

        // Loudoun Hall - 15th century townhouse
        var hallGeometry = new THREE.BoxGeometry(8, 10, 6);
        var hallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var hall = new THREE.Mesh(hallGeometry, hallMaterial);
        hall.position.set(-8, 5, 15);
        scene.add(hall);
        objects.push(hall);

        // Watchtower
        var towerGeometry = new THREE.CylinderGeometry(1.8, 2.2, 14, 10);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(-8, 7, 24);
        scene.add(tower);
        objects.push(tower);

        // Carrick Shore - clifftop emplacement
        var emplaceGeometry = new THREE.BoxGeometry(14, 3, 16);
        var emplaceMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var emplace = new THREE.Mesh(emplaceGeometry, emplaceMaterial);
        emplace.position.set(-30, 1.5, 8);
        scene.add(emplace);
        objects.push(emplace);

        // Gun barrel
        var barrelGeometry = new THREE.CylinderGeometry(0.8, 1, 10, 8);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = Math.PI / 6;
        barrel.position.set(-30, 4, 8);
        scene.add(barrel);
        objects.push(barrel);

        // Magazine
        var magGeometry = new THREE.BoxGeometry(6, 4, 8);
        var magMaterial = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
        var mag = new THREE.Mesh(magGeometry, magMaterial);
        mag.position.set(-30, 2, 20);
        scene.add(mag);
        objects.push(mag);

        // Belleisle Park - Victorian mansion
        var mansionGeometry = new THREE.BoxGeometry(12, 9, 10);
        var mansionMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        var mansion = new THREE.Mesh(mansionGeometry, mansionMaterial);
        mansion.position.set(0, 4.5, 28);
        scene.add(mansion);
        objects.push(mansion);

        // Walled garden
        var gardenGeometry = new THREE.BoxGeometry(10, 2, 12);
        var gardenMaterial = new THREE.MeshLambertMaterial({ color: 0x9ACD32 });
        var garden = new THREE.Mesh(gardenGeometry, gardenMaterial);
        garden.position.set(8, 1, 32);
        scene.add(garden);
        objects.push(garden);

        // Water tank
        var wtankGeometry = new THREE.CylinderGeometry(2, 2, 6, 12);
        var wtankMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var wtank = new THREE.Mesh(wtankGeometry, wtankMaterial);
        wtank.position.set(-8, 3, 32);
        scene.add(wtank);
        objects.push(wtank);

        // River Ayr - river ford
        var fordGeometry = new THREE.BoxGeometry(16, 1, 8);
        var fordMaterial = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
        var ford = new THREE.Mesh(fordGeometry, fordMaterial);
        ford.position.set(22, 0.5, -8);
        scene.add(ford);
        objects.push(ford);

        // Stone wall positions
        var wallPosGeometry = new THREE.BoxGeometry(4, 3, 14);
        var wallPosMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var wallPos = new THREE.Mesh(wallPosGeometry, wallPosMaterial);
        wallPos.position.set(28, 1.5, -8);
        scene.add(wallPos);
        objects.push(wallPos);

        // IED charges
        var iedGeometry = new THREE.SphereGeometry(0.8, 8, 8);
        var iedMaterial = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        var ied1 = new THREE.Mesh(iedGeometry, iedMaterial);
        ied1.position.set(18, 1, -8);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeometry, iedMaterial);
        ied2.position.set(26, 1, -10);
        scene.add(ied2);
        objects.push(ied2);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate mooring buoys bobbing
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry) {
                var originalY = objects[i].userData.originalY || objects[i].position.y;
                objects[i].userData.originalY = originalY;
                objects[i].position.y = originalY + Math.sin(Date.now() * 0.001) * 0.3;
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
