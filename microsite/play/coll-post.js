window.CollPost = (function() {
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
        // Coll sandy box terrain
        var terrainGeom = new THREE.BoxGeometry(100, 2, 80);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Breachacha Castle - old tower
        var oldCastleGeom = new THREE.BoxGeometry(8, 12, 8);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var oldCastle = new THREE.Mesh(oldCastleGeom, stoneMat);
        oldCastle.position.set(-20, 6, -15);
        scene.add(oldCastle);
        objects.push(oldCastle);

        // Breachacha Castle - new castle
        var newCastleGeom = new THREE.BoxGeometry(10, 10, 10);
        var newCastle = new THREE.Mesh(newCastleGeom, stoneMat);
        newCastle.position.set(-20, 5, 5);
        scene.add(newCastle);
        objects.push(newCastle);

        // Breachacha Castle - corner turret 1
        var turretGeom = new THREE.CylinderGeometry(2, 2.5, 15, 16);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var turret1 = new THREE.Mesh(turretGeom, turretMat);
        turret1.position.set(-26, 7.5, -20);
        scene.add(turret1);
        objects.push(turret1);

        // Breachacha Castle - corner turret 2
        var turret2 = new THREE.Mesh(turretGeom, turretMat);
        turret2.position.set(-14, 7.5, -20);
        scene.add(turret2);
        objects.push(turret2);

        // Arinagour village store
        var storeGeom = new THREE.BoxGeometry(6, 5, 5);
        var villMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var store = new THREE.Mesh(storeGeom, villMat);
        store.position.set(15, 2.5, -10);
        scene.add(store);
        objects.push(store);

        // Arinagour fuel dump
        var fuelGeom = new THREE.BoxGeometry(4, 4, 4);
        var fuelMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var fuel = new THREE.Mesh(fuelGeom, fuelMat);
        fuel.position.set(15, 2, 5);
        scene.add(fuel);
        objects.push(fuel);

        // Arinagour water tank
        var tankGeom = new THREE.CylinderGeometry(2.5, 2.5, 6, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(20, 3, 0);
        scene.add(tank);
        objects.push(tank);

        // Feall Bay tetrapod 1
        var tetraGeom = new THREE.BoxGeometry(3, 3, 3);
        var tetraMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var tetra1 = new THREE.Mesh(tetraGeom, tetraMat);
        tetra1.position.set(-25, 1.5, 20);
        scene.add(tetra1);
        objects.push(tetra1);

        // Feall Bay tetrapod 2
        var tetra2 = new THREE.Mesh(tetraGeom, tetraMat);
        tetra2.position.set(-15, 1.5, 25);
        scene.add(tetra2);
        objects.push(tetra2);

        // Feall Bay stake post
        var stakeGeom = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
        var stakeMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var stake1 = new THREE.Mesh(stakeGeom, stakeMat);
        stake1.position.set(-10, 1.5, 28);
        scene.add(stake1);
        objects.push(stake1);

        // Feall Bay mine sphere
        var mineGeom = new THREE.SphereGeometry(1.5, 16, 16);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var mine = new THREE.Mesh(mineGeom, mineMat);
        mine.position.set(0, 1.5, 22);
        scene.add(mine);
        objects.push(mine);

        // Loch Breachacha station building
        var stationGeom = new THREE.BoxGeometry(7, 4, 6);
        var stationMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var station = new THREE.Mesh(stationGeom, stationMat);
        station.position.set(25, 2, 15);
        scene.add(station);
        objects.push(station);

        // Loch Breachacha radome sphere
        var radomeGeom = new THREE.SphereGeometry(3, 16, 16);
        var radiusMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var radome = new THREE.Mesh(radomeGeom, radiusMat);
        radome.position.set(25, 5, 15);
        scene.add(radome);
        objects.push(radome);

        // Loch Breachacha mast
        var mastGeom = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(25, 5, 15);
        scene.add(mast);
        objects.push(mast);

        // Ben Hogh relay tower
        var relayGeom = new THREE.CylinderGeometry(1, 1.2, 18, 16);
        var relayMat = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        var relay = new THREE.Mesh(relayGeom, relayMat);
        relay.position.set(-5, 9, -25);
        scene.add(relay);
        objects.push(relay);

        // Ben Hogh equipment hut
        var hutGeom = new THREE.BoxGeometry(5, 4, 4);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x20B2AA });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(0, 2, -28);
        scene.add(hut);
        objects.push(hut);

        // Fishing patrol vessel hull
        var hullGeom = new THREE.BoxGeometry(8, 4, 20);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x000080 });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(-30, 2, 10);
        scene.add(hull);
        objects.push(hull);

        // Fishing vessel mast
        var vesselMastGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        var vesselMastMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var vesselMast = new THREE.Mesh(vesselMastGeom, vesselMastMat);
        vesselMast.position.set(-30, 4, 10);
        scene.add(vesselMast);
        objects.push(vesselMast);

        // Fishing vessel bow spike
        var spikeGeom = new THREE.ConeGeometry(0.5, 2, 8);
        var spikeMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var spike = new THREE.Mesh(spikeGeom, spikeMat);
        spike.position.set(-30, 1, 18);
        scene.add(spike);
        objects.push(spike);

        // Sea eagle nest rocky crag
        var cragGeom = new THREE.BoxGeometry(6, 8, 6);
        var cragMat = new THREE.MeshLambertMaterial({ color: 0x8B8B83 });
        var crag = new THREE.Mesh(cragGeom, cragMat);
        crag.position.set(10, 4, -20);
        scene.add(crag);
        objects.push(crag);

        // Sea eagle nest elevated platform
        var platformGeom = new THREE.BoxGeometry(4, 1, 4);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(10, 10, -20);
        scene.add(platform);
        objects.push(platform);

        // Observation cable using LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePoints = [
            new THREE.Vector3(10, 10, -20),
            new THREE.Vector3(15, 2, -15),
            new THREE.Vector3(5, 8, -25),
            new THREE.Vector3(10, 10, -20)
        ];
        cableGeom.setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for sun
        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(30, 40, 30);
        scene.add(sunLight);
        lights.push(sunLight);
    }

    function update(delta) {
        // Animate objects if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                if (i % 5 === 0) {
                    objects[i].rotation.y += 0.001;
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
