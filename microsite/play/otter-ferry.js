window.OtterFerry = (function() {
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
        buildFerry();
    }

    function buildFerry() {
        // Loch Fyne shingle shore terrain - base brown boxes
        var terrainGeom = new THREE.BoxGeometry(80, 2, 60);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Otter Ferry slipway - concrete box slipway
        var slipwayGeom = new THREE.BoxGeometry(15, 1, 25);
        var slipwayMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var slipway = new THREE.Mesh(slipwayGeom, slipwayMat);
        slipway.position.set(-20, 0.5, 0);
        scene.add(slipway);
        objects.push(slipway);

        // Control hut - box structure
        var hutGeom = new THREE.BoxGeometry(8, 6, 6);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(-25, 3, -12);
        scene.add(hut);
        objects.push(hut);

        // Mooring bollard pair - cylinders
        var bollardGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var bollard1 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard1.position.set(-15, 2, 5);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard2.position.set(-15, 2, -5);
        scene.add(bollard2);
        objects.push(bollard2);

        // Lephinmore hilltop - stone walled enclosure box
        var wallGeom = new THREE.BoxGeometry(20, 3, 20);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(25, 1.5, -20);
        scene.add(wall);
        objects.push(wall);

        // Signal mast - cylinder
        var mastGeom = new THREE.CylinderGeometry(1, 1, 12, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(25, 6, -20);
        scene.add(mast);
        objects.push(mast);

        // Valley relay - LineSegments to valley
        var relayGeom = new THREE.BufferGeometry();
        var relayPositions = new Float32Array([
            25, 10, -20,
            10, 3, 15
        ]);
        relayGeom.setAttribute('position', new THREE.BufferAttribute(relayPositions, 3));
        var relayMat = new THREE.LineBasicMaterial({ color: 0xFF4500 });
        var relay = new THREE.LineSegments(relayGeom, relayMat);
        scene.add(relay);
        objects.push(relay);

        // Strone Point gun position - box coastal battery
        var batteryGeom = new THREE.BoxGeometry(18, 2, 16);
        var batteryMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var battery = new THREE.Mesh(batteryGeom, batteryMat);
        battery.position.set(20, 0.5, 25);
        scene.add(battery);
        objects.push(battery);

        // Gun barrel - cylinder
        var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 14, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.z = 0.5;
        barrel.position.set(20, 4, 25);
        scene.add(barrel);
        objects.push(barrel);

        // Crew magazine - box
        var magGeom = new THREE.BoxGeometry(10, 5, 8);
        var magMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var magazine = new THREE.Mesh(magGeom, magMat);
        magazine.position.set(15, 2.5, 35);
        scene.add(magazine);
        objects.push(magazine);

        // Glenbranter valley - box steep valley walls
        var valleyWallGeom = new THREE.BoxGeometry(5, 15, 30);
        var valleyMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var valleyWall1 = new THREE.Mesh(valleyWallGeom, valleyMat);
        valleyWall1.position.set(-35, 7.5, -5);
        scene.add(valleyWall1);
        objects.push(valleyWall1);

        var valleyWall2 = new THREE.Mesh(valleyWallGeom, valleyMat);
        valleyWall2.position.set(-45, 7.5, -5);
        scene.add(valleyWall2);
        objects.push(valleyWall2);

        // Vehicle wreck - box blocking road
        var wreckGeom = new THREE.BoxGeometry(6, 3, 12);
        var wreckMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var wreck = new THREE.Mesh(wreckGeom, wreckMat);
        wreck.rotation.z = 0.3;
        wreck.position.set(-40, 1.5, 5);
        scene.add(wreck);
        objects.push(wreck);

        // IED charges - spheres
        var iedGeom = new THREE.SphereGeometry(1.2, 6, 6);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var ied1 = new THREE.Mesh(iedGeom, iedMat);
        ied1.position.set(-38, 2, 8);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeom, iedMat);
        ied2.position.set(-42, 2, 10);
        scene.add(ied2);
        objects.push(ied2);

        // Invernoaden river crossing - box stepping stone ford
        var fordGeom = new THREE.BoxGeometry(4, 1, 20);
        var fordMat = new THREE.MeshLambertMaterial({ color: 0xBC8F8F });
        var ford = new THREE.Mesh(fordGeom, fordMat);
        ford.position.set(5, -0.5, -25);
        scene.add(ford);
        objects.push(ford);

        // Boulders - spheres
        var boulderGeom = new THREE.SphereGeometry(2, 8, 8);
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x4B4B4B });
        var boulder1 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder1.position.set(10, 1, -22);
        scene.add(boulder1);
        objects.push(boulder1);

        var boulder2 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder2.position.set(0, 1, -28);
        scene.add(boulder2);
        objects.push(boulder2);

        // Wire across ford - LineSegments
        var wireGeom = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            0, 2, -25,
            10, 2, -25
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 2 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Whistlefield Inn - box hotel building
        var innGeom = new THREE.BoxGeometry(12, 8, 14);
        var innMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var inn = new THREE.Mesh(innGeom, innMat);
        inn.position.set(-10, 4, 20);
        scene.add(inn);
        objects.push(inn);

        // Generator shed - box
        var shedGeom = new THREE.BoxGeometry(6, 4, 8);
        var shedMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var shed = new THREE.Mesh(shedGeom, shedMat);
        shed.position.set(-5, 2, 28);
        scene.add(shed);
        objects.push(shed);

        // Water tank - cylinder
        var tankGeom = new THREE.CylinderGeometry(3, 3, 8, 8);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(-15, 4, 30);
        scene.add(tank);
        objects.push(tank);

        // Glen Finart torpedo range - spheres (test torpedoes)
        var torpedoGeom = new THREE.SphereGeometry(1.5, 8, 6);
        var torpedoMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var torpedo1 = new THREE.Mesh(torpedoGeom, torpedoMat);
        torpedo1.position.set(15, 1, -15);
        scene.add(torpedo1);
        objects.push(torpedo1);

        var torpedo2 = new THREE.Mesh(torpedoGeom, torpedoMat);
        torpedo2.position.set(22, 1, -12);
        scene.add(torpedo2);
        objects.push(torpedo2);

        // Range cables - LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            10, 3, -10,
            30, 3, -10,
            30, 3, -10,
            30, 3, 5
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0xFFD700 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Scoring hut on shore - box
        var scoreHutGeom = new THREE.BoxGeometry(7, 5, 7);
        var scoreHutMat = new THREE.MeshLambertMaterial({ color: 0xDDA520 });
        var scoreHut = new THREE.Mesh(scoreHutGeom, scoreHutMat);
        scoreHut.position.set(28, 2.5, -8);
        scene.add(scoreHut);
        objects.push(scoreHut);

        // Ambient light
        var ambLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 20, 30);
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
