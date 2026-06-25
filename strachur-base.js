window.StrachurBase = (function() {
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
        // Loch Fyne western shore patrol - boathouse
        var boathouseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var boathouseGeom = new THREE.BoxGeometry(8, 6, 12);
        var boathouse = new THREE.Mesh(boathouseGeom, boathouseMaterial);
        boathouse.position.set(-25, 0, -20);
        scene.add(boathouse);
        objects.push(boathouse);

        // Loch Fyne patrol boat hull
        var boatMaterial = new THREE.MeshLambertMaterial({ color: 0x2C5F4F });
        var boatGeom = new THREE.CylinderGeometry(2, 2.5, 10, 8);
        var boat = new THREE.Mesh(boatGeom, boatMaterial);
        boat.position.set(-20, 1, -15);
        boat.rotation.z = Math.PI / 2;
        scene.add(boat);
        objects.push(boat);

        // Buoys along shore
        var buoyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoyGeom = new THREE.SphereGeometry(0.8, 8, 8);
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy1.position.set(-28, 0.5, -10);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy2.position.set(-15, 0.5, -8);
        scene.add(buoy2);
        objects.push(buoy2);

        // Detection net (LineSegments)
        var netGeom = new THREE.BufferGeometry();
        var netVerts = new Float32Array([
            -25, 0, -25,  -25, 0, -5,
            -15, 0, -25,  -15, 0, -5,
            -25, 0, -25,  -15, 0, -25,
            -25, 0, -5,   -15, 0, -5
        ]);
        netGeom.setAttribute('position', new THREE.BufferAttribute(netVerts, 3));
        var netMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 2 });
        var net = new THREE.LineSegments(netGeom, netMaterial);
        scene.add(net);
        objects.push(net);

        // Creggans Inn command post - stone inn
        var innMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var innGeom = new THREE.BoxGeometry(12, 7, 14);
        var inn = new THREE.Mesh(innGeom, innMaterial);
        inn.position.set(10, 0, 5);
        scene.add(inn);
        objects.push(inn);

        // Creggans stable block
        var stableMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var stableGeom = new THREE.BoxGeometry(10, 5, 8);
        var stable = new THREE.Mesh(stableGeom, stableMaterial);
        stable.position.set(22, 0, 8);
        scene.add(stable);
        objects.push(stable);

        // Creggans comms mast
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 15, 6);
        var mast = new THREE.Mesh(mastGeom, mastMaterial);
        mast.position.set(18, 7, 10);
        scene.add(mast);
        objects.push(mast);

        // Strachur Park Estate HQ - Georgian mansion
        var mansionMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        var mansionGeom = new THREE.BoxGeometry(16, 8, 18);
        var mansion = new THREE.Mesh(mansionGeom, mansionMaterial);
        mansion.position.set(-5, 0, 20);
        scene.add(mansion);
        objects.push(mansion);

        // Walled garden enclosure
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var wallGeom = new THREE.BoxGeometry(14, 3, 14);
        var wall = new THREE.Mesh(wallGeom, wallMaterial);
        wall.position.set(8, 0, 28);
        scene.add(wall);
        objects.push(wall);

        // Water tower
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var towerGeom = new THREE.CylinderGeometry(1.5, 1.8, 12, 8);
        var tower = new THREE.Mesh(towerGeom, towerMaterial);
        tower.position.set(-2, 6, 32);
        scene.add(tower);
        objects.push(tower);

        // Clachan of Glendaruel - highland track
        var trackMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var trackGeom = new THREE.BoxGeometry(6, 0.5, 20);
        var track = new THREE.Mesh(trackGeom, trackMaterial);
        track.position.set(25, 0, 0);
        scene.add(track);
        objects.push(track);

        // Stone wall cover
        var coverMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var coverGeom = new THREE.BoxGeometry(8, 2, 4);
        var cover = new THREE.Mesh(coverGeom, coverMaterial);
        cover.position.set(30, 1, 8);
        scene.add(cover);
        objects.push(cover);

        // IED charges (spheres)
        var iMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var iGeom = new THREE.SphereGeometry(0.6, 8, 8);
        var ied = new THREE.Mesh(iGeom, iMaterial);
        ied.position.set(32, 0.8, 6);
        scene.add(ied);
        objects.push(ied);

        // Beinn Bheula summit relay - stone shelter
        var shelterMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5344 });
        var shelterGeom = new THREE.BoxGeometry(6, 4, 6);
        var shelter = new THREE.Mesh(shelterGeom, shelterMaterial);
        shelter.position.set(-20, 0, 25);
        scene.add(shelter);
        objects.push(shelter);

        // Signal mast
        var sigMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var sigGeom = new THREE.CylinderGeometry(0.3, 0.3, 14, 6);
        var sig = new THREE.Mesh(sigGeom, sigMaterial);
        sig.position.set(-18, 7, 27);
        scene.add(sig);
        objects.push(sig);

        // Weather dome
        var domeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var domeGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var dome = new THREE.Mesh(domeGeom, domeMaterial);
        dome.position.set(-22, 0.5, 25);
        scene.add(dome);
        objects.push(dome);

        // Newton Farm supply depot - stone farm buildings
        var farmMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
        var farmGeom = new THREE.BoxGeometry(10, 5, 9);
        var farm = new THREE.Mesh(farmGeom, farmMaterial);
        farm.position.set(-30, 0, 5);
        scene.add(farm);
        objects.push(farm);

        // Diesel tank
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var tankGeom = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
        var tank = new THREE.Mesh(tankGeom, tankMaterial);
        tank.position.set(-26, 3, 12);
        scene.add(tank);
        objects.push(tank);

        // Vehicle store
        var storeMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var storeGeom = new THREE.BoxGeometry(8, 4, 6);
        var store = new THREE.Mesh(storeGeom, storeMaterial);
        store.position.set(-32, 0, 15);
        scene.add(store);
        objects.push(store);

        // Glenstriven pass checkpoint - concrete barriers
        var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var barrierGeom = new THREE.BoxGeometry(12, 1.5, 2);
        var barrier = new THREE.Mesh(barrierGeom, barrierMaterial);
        barrier.position.set(15, 0.75, 18);
        scene.add(barrier);
        objects.push(barrier);

        // Guard tower
        var guardMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var guardGeom = new THREE.CylinderGeometry(1, 1, 10, 8);
        var guard = new THREE.Mesh(guardGeom, guardMaterial);
        guard.position.set(20, 5, 20);
        scene.add(guard);
        objects.push(guard);

        // Sandbag post
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var sandbagGeom = new THREE.BoxGeometry(4, 1.8, 4);
        var sandbag = new THREE.Mesh(sandbagGeom, sandbagMaterial);
        sandbag.position.set(10, 0.9, 25);
        scene.add(sandbag);
        objects.push(sandbag);

        // Loch Riddon shoreline observation - clifftop OP
        var clifftopMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var clifftopGeom = new THREE.BoxGeometry(7, 3, 7);
        var clifftop = new THREE.Mesh(clifftopGeom, clifftopMaterial);
        clifftop.position.set(5, 0, -25);
        scene.add(clifftop);
        objects.push(clifftop);

        // Float sensors
        var floatMaterial = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
        var floatGeom = new THREE.SphereGeometry(0.7, 8, 8);
        var float1 = new THREE.Mesh(floatGeom, floatMaterial);
        float1.position.set(12, 0.3, -28);
        scene.add(float1);
        objects.push(float1);

        var float2 = new THREE.Mesh(floatGeom, floatMaterial);
        float2.position.set(-5, 0.3, -30);
        scene.add(float2);
        objects.push(float2);

        // Cable grid (LineSegments)
        var cableGeom = new THREE.BufferGeometry();
        var cableVerts = new Float32Array([
            -10, 0, -30,   15, 0, -30,
            0, 0, -32,     0, 0, -22,
            -10, 0, -30,   0, 0, -32,
            15, 0, -30,    0, 0, -32
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cableVerts, 3));
        var cableMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 1 });
        var cable = new THREE.LineSegments(cableGeom, cableMaterial);
        scene.add(cable);
        objects.push(cable);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation && i % 7 === 0) {
                    objects[i].rotation.y += delta * 0.3;
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
