window.CallanderPost = (function() {
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
        // River Teith crossing control
        var bridgeGeom = new THREE.BoxGeometry(12, 2, 8);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(-25, 1, -20);
        scene.add(bridge);
        objects.push(bridge);

        var sandbag1Geom = new THREE.BoxGeometry(2, 3, 2);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x9ACD32 });
        var sandbag1 = new THREE.Mesh(sandbag1Geom, sandbagMat);
        sandbag1.position.set(-20, 1.5, -18);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2 = new THREE.Mesh(sandbag1Geom, sandbagMat);
        sandbag2.position.set(-30, 1.5, -22);
        scene.add(sandbag2);
        objects.push(sandbag2);

        var iedGeom = new THREE.SphereGeometry(0.5, 8, 8);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var ied = new THREE.Mesh(iedGeom, iedMat);
        ied.position.set(-22, 0.5, -25);
        scene.add(ied);
        objects.push(ied);

        var wireGeom = new THREE.BufferGeometry();
        var wirePos = new Float32Array([
            -25, 2, -20,
            -22, 1, -25
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0x000000 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Callander town checkpoint
        var victorian1Geom = new THREE.BoxGeometry(8, 10, 6);
        var victMat = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        var victorian1 = new THREE.Mesh(victorian1Geom, victMat);
        victorian1.position.set(10, 5, 15);
        scene.add(victorian1);
        objects.push(victorian1);

        var victorian2Geom = new THREE.BoxGeometry(6, 9, 5);
        var victorian2 = new THREE.Mesh(victorian2Geom, victMat);
        victorian2.position.set(20, 4.5, 12);
        scene.add(victorian2);
        objects.push(victorian2);

        var barrier1Geom = new THREE.BoxGeometry(3, 2, 0.5);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var barrier1 = new THREE.Mesh(barrier1Geom, barrierMat);
        barrier1.position.set(15, 1, 20);
        scene.add(barrier1);
        objects.push(barrier1);

        var towerGeom = new THREE.CylinderGeometry(2, 2.5, 12, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(25, 6, 18);
        scene.add(tower);
        objects.push(tower);

        // Rob Roy Way militia depot
        var hutGeom = new THREE.BoxGeometry(6, 4, 5);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(-15, 2, 8);
        scene.add(hut);
        objects.push(hut);

        var cacheGeom = new THREE.BoxGeometry(4, 3, 3);
        var cacheMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var cache = new THREE.Mesh(cacheGeom, cacheMat);
        cache.position.set(-8, 1.5, 12);
        scene.add(cache);
        objects.push(cache);

        var tankGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(-10, 3, 5);
        scene.add(tank);
        objects.push(tank);

        // Bracklinn Falls OP
        var hideGeom = new THREE.BoxGeometry(5, 3, 4);
        var hideMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var hide = new THREE.Mesh(hideGeom, hideMat);
        hide.position.set(5, 2, -10);
        scene.add(hide);
        objects.push(hide);

        var rangingWireGeom = new THREE.BufferGeometry();
        var rangingWirePos = new Float32Array([
            5, 3.5, -10,
            15, 0, -5
        ]);
        rangingWireGeom.setAttribute('position', new THREE.BufferAttribute(rangingWirePos, 3));
        var rangingWireMat = new THREE.LineBasicMaterial({ color: 0xFF6347 });
        var rangingWire = new THREE.LineSegments(rangingWireGeom, rangingWireMat);
        scene.add(rangingWire);
        objects.push(rangingWire);

        var observerGeom = new THREE.SphereGeometry(0.6, 6, 6);
        var observerMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var observer = new THREE.Mesh(observerGeom, observerMat);
        observer.position.set(12, 1, -8);
        scene.add(observer);
        objects.push(observer);

        // Callander Craig summit battery
        var platformGeom = new THREE.BoxGeometry(15, 1, 12);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(8, 0.5, 3);
        scene.add(platform);
        objects.push(platform);

        var barrelGeom = new THREE.CylinderGeometry(0.6, 0.5, 8, 6);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(8, 5, 3);
        scene.add(barrel);
        objects.push(barrel);

        var bunkerGeom = new THREE.BoxGeometry(7, 3, 6);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(15, 1.5, 0);
        scene.add(bunker);
        objects.push(bunker);

        // Invertrossachs Estate HQ
        var houseGeom = new THREE.BoxGeometry(10, 8, 8);
        var houseMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var house = new THREE.Mesh(houseGeom, houseMat);
        house.position.set(-5, 4, -5);
        scene.add(house);
        objects.push(house);

        var stableGeom = new THREE.BoxGeometry(6, 5, 5);
        var stableMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var stable = new THREE.Mesh(stableGeom, stableMat);
        stable.position.set(2, 2.5, -2);
        scene.add(stable);
        objects.push(stable);

        var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 15, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-8, 7.5, 0);
        scene.add(mast);
        objects.push(mast);

        // Loch Venacher lakeshore patrol
        var boathouseGeom = new THREE.BoxGeometry(5, 3, 4);
        var boathouseMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var boathouse = new THREE.Mesh(boathouseGeom, boathouseMat);
        boathouse.position.set(-20, 1.5, 25);
        scene.add(boathouse);
        objects.push(boathouse);

        var buoy1Geom = new THREE.SphereGeometry(0.4, 6, 6);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF1493 });
        var buoy1 = new THREE.Mesh(buoy1Geom, buoyMat);
        buoy1.position.set(-15, 0, 28);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoy1Geom, buoyMat);
        buoy2.position.set(-25, 0, 30);
        scene.add(buoy2);
        objects.push(buoy2);

        var sensorCableGeom = new THREE.BufferGeometry();
        var sensorCablePos = new Float32Array([
            -20, 0.5, 25,
            -15, 0, 28,
            -25, 0, 30
        ]);
        sensorCableGeom.setAttribute('position', new THREE.BufferAttribute(sensorCablePos, 3));
        var sensorCableMat = new THREE.LineBasicMaterial({ color: 0x1E90FF });
        var sensorCable = new THREE.LineSegments(sensorCableGeom, sensorCableMat);
        scene.add(sensorCable);
        objects.push(sensorCable);

        // Ben Ledi foothills ambush zone
        var roadGeom = new THREE.BoxGeometry(4, 0.5, 20);
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var road = new THREE.Mesh(roadGeom, roadMat);
        road.position.set(20, 0.25, -15);
        scene.add(road);
        objects.push(road);

        var wallGeom = new THREE.BoxGeometry(0.5, 3, 15);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(25, 1.5, -12);
        scene.add(wall);
        objects.push(wall);

        var mine1Geom = new THREE.SphereGeometry(0.3, 5, 5);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var mine1 = new THREE.Mesh(mine1Geom, mineMat);
        mine1.position.set(18, 0.15, -8);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mine1Geom, mineMat);
        mine2.position.set(22, 0.15, -20);
        scene.add(mine2);
        objects.push(mine2);

        // Lights
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        light1.position.set(20, 30, 20);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xFFFFFF, 0.4);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animation logic here
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
