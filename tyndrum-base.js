window.TyndrumBase = (function() {
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
        // Highland road junction box terrain - concrete barriers
        var barrierGeom1 = new THREE.BoxGeometry(8, 2, 1.5);
        var barrierMat1 = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var barrier1 = new THREE.Mesh(barrierGeom1, barrierMat1);
        barrier1.position.set(-25, 1, -20);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrierGeom2 = new THREE.BoxGeometry(8, 2, 1.5);
        var barrierMat2 = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var barrier2 = new THREE.Mesh(barrierGeom2, barrierMat2);
        barrier2.position.set(20, 1, -15);
        scene.add(barrier2);
        objects.push(barrier2);

        // Guard tower - cylinder
        var towerGeom = new THREE.CylinderGeometry(3, 3.5, 12, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x4d4d4d });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-15, 6, 10);
        scene.add(tower);
        objects.push(tower);

        // Station building - box
        var stationGeom = new THREE.BoxGeometry(15, 8, 10);
        var stationMat = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var station = new THREE.Mesh(stationGeom, stationMat);
        station.position.set(10, 4, 20);
        scene.add(station);
        objects.push(station);

        // Signal cabin - small box
        var signalGeom = new THREE.BoxGeometry(4, 5, 4);
        var signalMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var signal = new THREE.Mesh(signalGeom, signalMat);
        signal.position.set(28, 2.5, 22);
        scene.add(signal);
        objects.push(signal);

        // Water tower - cylinder
        var waterGeom = new THREE.CylinderGeometry(2.5, 2.8, 14, 8);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var water = new THREE.Mesh(waterGeom, waterMat);
        water.position.set(5, 7, 32);
        scene.add(water);
        objects.push(water);

        // Mine entrance - box
        var mineGeom = new THREE.BoxGeometry(12, 8, 6);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
        var mine = new THREE.Mesh(mineGeom, mineMat);
        mine.position.set(-20, 4, -10);
        scene.add(mine);
        objects.push(mine);

        // Tunnel section - box
        var tunnelGeom = new THREE.BoxGeometry(6, 5, 20);
        var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnel.position.set(-30, 2.5, 0);
        scene.add(tunnel);
        objects.push(tunnel);

        // Ventilation shaft - cylinder
        var ventGeom = new THREE.CylinderGeometry(1.5, 1.8, 8, 8);
        var ventMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var vent = new THREE.Mesh(ventGeom, ventMat);
        vent.position.set(-25, 4, -8);
        scene.add(vent);
        objects.push(vent);

        // Clifton Hotel building - box
        var hotelGeom = new THREE.BoxGeometry(18, 10, 14);
        var hotelMat = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        var hotel = new THREE.Mesh(hotelGeom, hotelMat);
        hotel.position.set(0, 5, -25);
        scene.add(hotel);
        objects.push(hotel);

        // Generator hut - small box
        var genGeom = new THREE.BoxGeometry(6, 4, 5);
        var genMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var gen = new THREE.Mesh(genGeom, genMat);
        gen.position.set(18, 2, -28);
        scene.add(gen);
        objects.push(gen);

        // Comms mast - cylinder
        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 20, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-12, 10, -18);
        scene.add(mast);
        objects.push(mast);

        // Stone wall along A82 - box
        var wallGeom = new THREE.BoxGeometry(40, 2, 1);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8b8680 });
        var wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(5, 1, 0);
        scene.add(wall);
        objects.push(wall);

        // IED sphere charges
        var iedGeom = new THREE.SphereGeometry(0.6, 8, 8);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var ied1 = new THREE.Mesh(iedGeom, iedMat);
        ied1.position.set(-5, 0.8, 1);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeom, iedMat);
        ied2.position.set(8, 0.8, 0.5);
        scene.add(ied2);
        objects.push(ied2);

        // Command wire - LineSegments
        var wireGeom = new THREE.BufferGeometry();
        var wirePos = new Float32Array([
            -5, 1.5, 1,
            8, 1.5, 0.5
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Cononish Farm buildings - box
        var farmGeom = new THREE.BoxGeometry(10, 6, 8);
        var farmMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var farm = new THREE.Mesh(farmGeom, farmMat);
        farm.position.set(-8, 3, 15);
        scene.add(farm);
        objects.push(farm);

        // Diesel tank - cylinder
        var tankGeom = new THREE.CylinderGeometry(2, 2.2, 6, 8);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(2, 3, 18);
        scene.add(tank);
        objects.push(tank);

        // Equipment store - box
        var storeGeom = new THREE.BoxGeometry(8, 5, 7);
        var storeMat = new THREE.MeshLambertMaterial({ color: 0x7a5c3a });
        var store = new THREE.Mesh(storeGeom, storeMat);
        store.position.set(-2, 2.5, 28);
        scene.add(store);
        objects.push(store);

        // Beinn Odhar helipad platform - box
        var heliGeom = new THREE.BoxGeometry(20, 1, 20);
        var heliMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var heli = new THREE.Mesh(heliGeom, heliMat);
        heli.position.set(25, 0.5, 10);
        scene.add(heli);
        objects.push(heli);

        // H marker - LineSegments
        var hmarkerGeom = new THREE.BufferGeometry();
        var hpos = new Float32Array([
            20, 1.2, 5,
            30, 1.2, 5,
            25, 1.2, 0,
            25, 1.2, 10
        ]);
        hmarkerGeom.setAttribute('position', new THREE.BufferAttribute(hpos, 3));
        var hmat = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var hmarker = new THREE.LineSegments(hmarkerGeom, hmat);
        scene.add(hmarker);
        objects.push(hmarker);

        // Wind sock - cone
        var sockGeom = new THREE.ConeGeometry(1.5, 4, 8);
        var sockMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var sock = new THREE.Mesh(sockGeom, sockMat);
        sock.position.set(22, 2.5, 15);
        sock.rotation.z = Math.PI / 6;
        scene.add(sock);
        objects.push(sock);

        // Sandbag position - box
        var sandGeom = new THREE.BoxGeometry(5, 1.5, 4);
        var sandMat = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
        var sand1 = new THREE.Mesh(sandGeom, sandMat);
        sand1.position.set(-28, 0.75, -5);
        scene.add(sand1);
        objects.push(sand1);

        var sand2 = new THREE.Mesh(sandGeom, sandMat);
        sand2.position.set(12, 0.75, 5);
        scene.add(sand2);
        objects.push(sand2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 10);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Rotation animations for towers and masts
        if (objects.length > 2) {
            if (objects[2]) {
                objects[2].rotation.y += 0.005;
            }
            if (objects[11]) {
                objects[11].rotation.y += 0.008;
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
