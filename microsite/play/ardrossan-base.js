window.ArdrossanBase = (function() {
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
        // Ardrossan ferry port base - concrete pier
        var pierGeometry = new THREE.BoxGeometry(20, 2, 8);
        var pierMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var pier = new THREE.Mesh(pierGeometry, pierMaterial);
        pier.position.set(-20, 0, 0);
        scene.add(pier);
        objects.push(pier);

        // Ferry dock crane - vertical cylinder
        var craneBaseGeometry = new THREE.CylinderGeometry(1, 1, 15, 16);
        var craneMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var craneBase = new THREE.Mesh(craneBaseGeometry, craneMaterial);
        craneBase.position.set(-15, 7.5, 0);
        scene.add(craneBase);
        objects.push(craneBase);

        // Harbor master shed - box
        var shedGeometry = new THREE.BoxGeometry(6, 4, 5);
        var shedMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var shed = new THREE.Mesh(shedGeometry, shedMaterial);
        shed.position.set(-10, 2, -8);
        scene.add(shed);
        objects.push(shed);

        // Ferry hull - large cylinder
        var ferryGeometry = new THREE.CylinderGeometry(4, 4, 18, 16);
        var ferryMaterial = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
        var ferry = new THREE.Mesh(ferryGeometry, ferryMaterial);
        ferry.position.set(5, 8, 0);
        scene.add(ferry);
        objects.push(ferry);

        // Underwater mines - spheres
        var mineGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        var mineMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F2F });
        var mine1 = new THREE.Mesh(mineGeometry, mineMaterial);
        mine1.position.set(8, -5, 3);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeometry, mineMaterial);
        mine2.position.set(2, -6, -4);
        scene.add(mine2);
        objects.push(mine2);

        // Net barrier - LineSegments
        var netGeometry = new THREE.BufferGeometry();
        var netPoints = [
            new THREE.Vector3(-5, 0, 5),
            new THREE.Vector3(-5, -3, 5),
            new THREE.Vector3(5, 0, 5),
            new THREE.Vector3(5, -3, 5),
            new THREE.Vector3(-5, 0, -5),
            new THREE.Vector3(-5, -3, -5),
            new THREE.Vector3(5, 0, -5),
            new THREE.Vector3(5, -3, -5)
        ];
        netGeometry.setFromPoints(netPoints);
        var netMaterial = new THREE.LineBasicMaterial({ color: 0x808080 });
        var netBarrier = new THREE.LineSegments(netGeometry, netMaterial);
        netBarrier.position.set(15, 5, 0);
        scene.add(netBarrier);
        objects.push(netBarrier);

        // Ardrossan Castle ruin - ruined keep box
        var keepGeometry = new THREE.BoxGeometry(8, 12, 7);
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var keep = new THREE.Mesh(keepGeometry, keepMaterial);
        keep.position.set(-25, 6, 15);
        scene.add(keep);
        objects.push(keep);

        // Castle outer wall - box
        var wallGeometry = new THREE.BoxGeometry(20, 4, 1.5);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var wall = new THREE.Mesh(wallGeometry, wallMaterial);
        wall.position.set(-20, 2, 22);
        scene.add(wall);
        objects.push(wall);

        // Castle turret stump - cone
        var turretGeometry = new THREE.ConeGeometry(2.5, 5, 16);
        var turretMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var turret = new THREE.Mesh(turretGeometry, turretMaterial);
        turret.position.set(-30, 12, 18);
        scene.add(turret);
        objects.push(turret);

        // Hunterston nuclear power station - reactor dome
        var reactorGeometry = new THREE.BoxGeometry(12, 8, 10);
        var reactorMaterial = new THREE.MeshLambertMaterial({ color: 0xDCDCDC });
        var reactor = new THREE.Mesh(reactorGeometry, reactorMaterial);
        reactor.position.set(20, 4, 20);
        scene.add(reactor);
        objects.push(reactor);

        // Cooling tower - cylinder
        var towerGeometry = new THREE.CylinderGeometry(3.5, 3.5, 20, 16);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(30, 10, 18);
        scene.add(tower);
        objects.push(tower);

        // Control building - box
        var controlGeometry = new THREE.BoxGeometry(7, 5, 6);
        var controlMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var control = new THREE.Mesh(controlGeometry, controlMaterial);
        control.position.set(18, 2.5, 30);
        scene.add(control);
        objects.push(control);

        // Stevenston industrial sabotage - explosives factory ruins
        var factoryGeometry = new THREE.BoxGeometry(15, 6, 12);
        var factoryMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var factory = new THREE.Mesh(factoryGeometry, factoryMaterial);
        factory.position.set(-30, 3, -20);
        scene.add(factory);
        objects.push(factory);

        // Secure vault - box
        var vaultGeometry = new THREE.BoxGeometry(4, 5, 4);
        var vaultMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var vault = new THREE.Mesh(vaultGeometry, vaultMaterial);
        vault.position.set(-22, 2.5, -28);
        scene.add(vault);
        objects.push(vault);

        // Water tower - cylinder
        var waterGeometry = new THREE.CylinderGeometry(2, 2, 14, 16);
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4682B4 });
        var waterTower = new THREE.Mesh(waterGeometry, waterMaterial);
        waterTower.position.set(-35, 7, -15);
        scene.add(waterTower);
        objects.push(waterTower);

        // Saltcoats shore battery - clifftop emplacement
        var batteryGeometry = new THREE.BoxGeometry(10, 3, 8);
        var batteryMaterial = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var battery = new THREE.Mesh(batteryGeometry, batteryMaterial);
        battery.position.set(0, 1.5, -25);
        scene.add(battery);
        objects.push(battery);

        // Gun barrel - cylinder
        var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 10, 12);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.rotation.z = 0.4;
        barrel.position.set(2, 4, -22);
        scene.add(barrel);
        objects.push(barrel);

        // Magazine - box
        var magGeometry = new THREE.BoxGeometry(5, 4, 6);
        var magMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var magazine = new THREE.Mesh(magGeometry, magMaterial);
        magazine.position.set(-4, 2, -30);
        scene.add(magazine);
        objects.push(magazine);

        // Beith Hill summit relay - stone shelter
        var shelterGeometry = new THREE.BoxGeometry(5, 3, 4);
        var shelterMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var shelter = new THREE.Mesh(shelterGeometry, shelterMaterial);
        shelter.position.set(15, 1.5, 25);
        scene.add(shelter);
        objects.push(shelter);

        // Signal mast - cylinder
        var mastGeometry = new THREE.CylinderGeometry(0.6, 0.6, 16, 12);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(18, 8, 28);
        scene.add(mast);
        objects.push(mast);

        // Radome - sphere
        var radomeGeometry = new THREE.SphereGeometry(2, 16, 16);
        var radiMaterial = new THREE.MeshLambertMaterial({ color: 0xFFA500 });
        var radome = new THREE.Mesh(radomeGeometry, radiMaterial);
        radome.position.set(18, 16, 28);
        scene.add(radome);
        objects.push(radome);

        // Caledonian Road ambush - narrow road
        var roadGeometry = new THREE.BoxGeometry(3, 0.5, 20);
        var roadMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.position.set(-5, 0.25, 5);
        scene.add(road);
        objects.push(road);

        // Stone wall cover - box
        var coverGeometry = new THREE.BoxGeometry(0.8, 2, 8);
        var coverMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var cover = new THREE.Mesh(coverGeometry, coverMaterial);
        cover.position.set(-3, 1, 12);
        scene.add(cover);
        objects.push(cover);

        // IED charges - spheres
        var iedGeometry = new THREE.SphereGeometry(0.8, 12, 12);
        var iedMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var ied1 = new THREE.Mesh(iedGeometry, iedMaterial);
        ied1.position.set(-6, 0.8, 8);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeometry, iedMaterial);
        ied2.position.set(-2, 0.8, 15);
        scene.add(ied2);
        objects.push(ied2);

        // Wire barrier - LineSegments
        var wireGeometry = new THREE.BufferGeometry();
        var wirePoints = [
            new THREE.Vector3(-7, 0.5, 0),
            new THREE.Vector3(-7, 2.5, 0),
            new THREE.Vector3(7, 0.5, 0),
            new THREE.Vector3(7, 2.5, 0),
            new THREE.Vector3(-7, 0.5, 10),
            new THREE.Vector3(-7, 2.5, 10),
            new THREE.Vector3(7, 0.5, 10),
            new THREE.Vector3(7, 2.5, 10)
        ];
        wireGeometry.setFromPoints(wirePoints);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var wireBarrier = new THREE.LineSegments(wireGeometry, wireMaterial);
        wireBarrier.position.set(0, 0, -5);
        scene.add(wireBarrier);
        objects.push(wireBarrier);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects if needed
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += 0.0005;
                }
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
