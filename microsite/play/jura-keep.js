window.JuraKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Craighouse harbour base
        var pierGeom = new THREE.BoxGeometry(8, 2, 4);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(-25, 1, -20);
        scene.add(pier);
        objects.push(pier);

        var boathullGeom = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
        var boathullMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        var boathull = new THREE.Mesh(boathullGeom, boathullMat);
        boathull.position.set(-28, 2, -22);
        boathull.rotation.z = Math.PI / 2;
        scene.add(boathull);
        objects.push(boathull);

        var mooringGeom = new THREE.SphereGeometry(0.8, 12, 12);
        var mooringMat = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
        var mooring1 = new THREE.Mesh(mooringGeom, mooringMat);
        mooring1.position.set(-20, 1, -25);
        scene.add(mooring1);
        objects.push(mooring1);

        var mooring2 = new THREE.Mesh(mooringGeom, mooringMat);
        mooring2.position.set(-30, 1, -25);
        scene.add(mooring2);
        objects.push(mooring2);

        var netGeom = new THREE.BufferGeometry();
        var netVerts = new Float32Array([
            -20, 0, -25, -30, 0, -25,
            -20, 3, -25, -30, 3, -25
        ]);
        netGeom.setAttribute('position', new THREE.BufferAttribute(netVerts, 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x34495e });
        var netLines = new THREE.LineSegments(netGeom, netMat);
        scene.add(netLines);
        objects.push(netLines);

        // Jura House command post
        var mansionGeom = new THREE.BoxGeometry(6, 8, 5);
        var mansionMat = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        var mansion = new THREE.Mesh(mansionGeom, mansionMat);
        mansion.position.set(0, 4, -15);
        scene.add(mansion);
        objects.push(mansion);

        var gardenGeom = new THREE.BoxGeometry(10, 1.5, 8);
        var gardenMat = new THREE.MeshLambertMaterial({ color: 0x27ae60 });
        var garden = new THREE.Mesh(gardenGeom, gardenMat);
        garden.position.set(2, 0.75, -18);
        scene.add(garden);
        objects.push(garden);

        var towerGeom = new THREE.CylinderGeometry(1.2, 1.2, 12, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(6, 6, -10);
        scene.add(tower);
        objects.push(tower);

        // Paps of Jura summit relay
        var shelterGeom = new THREE.BoxGeometry(4, 3, 3);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(15, 2, 10);
        scene.add(shelter);
        objects.push(shelter);

        var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 14, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x34495e });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(18, 7, 12);
        scene.add(mast);
        objects.push(mast);

        var radomeGeom = new THREE.SphereGeometry(1.5, 12, 12);
        var radisMat = new THREE.MeshLambertMaterial({ color: 0xf39c12 });
        var radome = new THREE.Mesh(radomeGeom, radisMat);
        radome.position.set(18, 14, 12);
        scene.add(radome);
        objects.push(radome);

        // Corryvreckan whirlpool OP
        var cliffshelterGeom = new THREE.BoxGeometry(5, 2.5, 4);
        var cliffshelterMat = new THREE.MeshLambertMaterial({ color: 0x16a085 });
        var cliffshelter = new THREE.Mesh(cliffshelterGeom, cliffshelterMat);
        cliffshelter.position.set(25, 1.2, 20);
        scene.add(cliffshelter);
        objects.push(cliffshelter);

        var sensorGeom = new THREE.SphereGeometry(0.6, 10, 10);
        var sensorMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
        var sensor = new THREE.Mesh(sensorGeom, sensorMat);
        sensor.position.set(28, 0.5, 23);
        scene.add(sensor);
        objects.push(sensor);

        var cablenetGeom = new THREE.BufferGeometry();
        var cableVerts = new Float32Array([
            25, 0, 20, 30, 0, 25,
            25, 2, 20, 30, 2, 25
        ]);
        cablenetGeom.setAttribute('position', new THREE.BufferAttribute(cableVerts, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x2c3e50 });
        var cablenet = new THREE.LineSegments(cablenetGeom, cableMat);
        scene.add(cablenet);
        objects.push(cablenet);

        // Keils chapel ruin stronghold
        var chapelGeom = new THREE.BoxGeometry(4, 6, 5);
        var chapelMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var chapel = new THREE.Mesh(chapelGeom, chapelMat);
        chapel.position.set(-15, 3, 5);
        scene.add(chapel);
        objects.push(chapel);

        var graveGeom = new THREE.BoxGeometry(8, 1, 6);
        var graveMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var grave = new THREE.Mesh(graveGeom, graveMat);
        grave.position.set(-18, 0.5, 8);
        scene.add(grave);
        objects.push(grave);

        var belltowerGeom = new THREE.ConeGeometry(1.2, 5, 8);
        var belltowerMat = new THREE.MeshLambertMaterial({ color: 0xa0522d });
        var belltower = new THREE.Mesh(belltowerGeom, belltowerMat);
        belltower.position.set(-12, 4, 2);
        scene.add(belltower);
        objects.push(belltower);

        // Glen Garrisdale valley ambush
        var trackGeom = new THREE.BoxGeometry(12, 0.5, 2);
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x5d4e37 });
        var track = new THREE.Mesh(trackGeom, trackMat);
        track.position.set(-5, 0.25, 25);
        scene.add(track);
        objects.push(track);

        var iedGeom = new THREE.SphereGeometry(0.5, 8, 8);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var ied1 = new THREE.Mesh(iedGeom, iedMat);
        ied1.position.set(-8, 0.5, 25);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeom, iedMat);
        ied2.position.set(-2, 0.5, 25);
        scene.add(ied2);
        objects.push(ied2);

        var tripwireGeom = new THREE.BufferGeometry();
        var tripVerts = new Float32Array([
            -8, 0.5, 25, -2, 0.5, 25,
            -8, 1.2, 25, -2, 1.2, 25
        ]);
        tripwireGeom.setAttribute('position', new THREE.BufferAttribute(tripVerts, 3));
        var tripwireMat = new THREE.LineBasicMaterial({ color: 0x8b0000 });
        var tripwire = new THREE.LineSegments(tripwireGeom, tripwireMat);
        scene.add(tripwire);
        objects.push(tripwire);

        // Feolin Ferry dock
        var ferrypierGeom = new THREE.BoxGeometry(7, 1.5, 3);
        var ferrypierMat = new THREE.MeshLambertMaterial({ color: 0xb8860b });
        var ferrpier = new THREE.Mesh(ferrypierGeom, ferrypierMat);
        ferrpier.position.set(-20, 0.75, 15);
        scene.add(ferrpier);
        objects.push(ferrpier);

        var ferryhullGeom = new THREE.CylinderGeometry(1.2, 1.2, 5, 8);
        var ferryhullMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
        var ferryhull = new THREE.Mesh(ferryhullGeom, ferryhullMat);
        ferryhull.position.set(-23, 1.5, 18);
        ferryhull.rotation.z = Math.PI / 2;
        scene.add(ferryhull);
        objects.push(ferryhull);

        var shedGeom = new THREE.BoxGeometry(4, 3, 3);
        var shedMat = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        var shed = new THREE.Mesh(shedGeom, shedMat);
        shed.position.set(-17, 1.5, 12);
        scene.add(shed);
        objects.push(shed);

        // Ardlussa Estate barracks
        var manorGeom = new THREE.BoxGeometry(7, 5, 6);
        var manorMat = new THREE.MeshLambertMaterial({ color: 0xc0504d });
        var manor = new THREE.Mesh(manorGeom, manorMat);
        manor.position.set(10, 2.5, -5);
        scene.add(manor);
        objects.push(manor);

        var stableGeom = new THREE.BoxGeometry(5, 3.5, 4);
        var stableMat = new THREE.MeshLambertMaterial({ color: 0xd9d9d9 });
        var stable = new THREE.Mesh(stableGeom, stableMat);
        stable.position.set(15, 1.75, 0);
        scene.add(stable);
        objects.push(stable);

        var fueltankGeom = new THREE.CylinderGeometry(1.5, 1.5, 5, 8);
        var fueltankMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var fueltank = new THREE.Mesh(fueltankGeom, fueltankMat);
        fueltank.position.set(8, 2.5, 5);
        scene.add(fueltank);
        objects.push(fueltank);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation logic can be added here
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
