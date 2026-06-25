window.TarbetBase = (function() {
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
        // Terrain base - narrow land bridge
        var terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var terrainGeom = new THREE.BoxGeometry(60, 2, 15);
        var terrain = new THREE.Mesh(terrainGeom, terrainMaterial);
        terrain.position.set(0, 0, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Vehicle convoy staging area - parked box trucks row 1
        var truckMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var truckGeom = new THREE.BoxGeometry(4, 3, 8);
        var truck1 = new THREE.Mesh(truckGeom, truckMat);
        truck1.position.set(-20, 2, -18);
        scene.add(truck1);
        objects.push(truck1);

        var truck2 = new THREE.Mesh(truckGeom, truckMat);
        truck2.position.set(-10, 2, -18);
        scene.add(truck2);
        objects.push(truck2);

        var truck3 = new THREE.Mesh(truckGeom, truckMat);
        truck3.position.set(0, 2, -18);
        scene.add(truck3);
        objects.push(truck3);

        var truck4 = new THREE.Mesh(truckGeom, truckMat);
        truck4.position.set(10, 2, -18);
        scene.add(truck4);
        objects.push(truck4);

        // APC vehicles row 2
        var apcMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var apcGeom = new THREE.BoxGeometry(3.5, 2.5, 7);
        var apc1 = new THREE.Mesh(apcGeom, apcMat);
        apc1.position.set(-20, 1.8, -8);
        scene.add(apc1);
        objects.push(apc1);

        var apc2 = new THREE.Mesh(apcGeom, apcMat);
        apc2.position.set(-10, 1.8, -8);
        scene.add(apc2);
        objects.push(apc2);

        var apc3 = new THREE.Mesh(apcGeom, apcMat);
        apc3.position.set(0, 1.8, -8);
        scene.add(apc3);
        objects.push(apc3);

        // Fuel bowser station - cylinder tanks
        var tankMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var tankGeom = new THREE.CylinderGeometry(3, 3, 6, 16);
        var tank1 = new THREE.Mesh(tankGeom, tankMat);
        tank1.position.set(20, 4, -15);
        scene.add(tank1);
        objects.push(tank1);

        var tank2 = new THREE.Mesh(tankGeom, tankMat);
        tank2.position.set(25, 4, -10);
        scene.add(tank2);
        objects.push(tank2);

        // Box pump station
        var pumpMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pumpGeom = new THREE.BoxGeometry(2, 2, 2);
        var pump1 = new THREE.Mesh(pumpGeom, pumpMat);
        pump1.position.set(20, 1.5, -8);
        scene.add(pump1);
        objects.push(pump1);

        var pump2 = new THREE.Mesh(pumpGeom, pumpMat);
        pump2.position.set(25, 1.5, -5);
        scene.add(pump2);
        objects.push(pump2);

        // Pontoon bridge sections across gap - box sections
        var pontoonMat = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        var pontoonGeom = new THREE.BoxGeometry(3, 1, 4);
        var pontoon1 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon1.position.set(-15, 2, 8);
        scene.add(pontoon1);
        objects.push(pontoon1);

        var pontoon2 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon2.position.set(-8, 2, 8);
        scene.add(pontoon2);
        objects.push(pontoon2);

        var pontoon3 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon3.position.set(0, 2, 8);
        scene.add(pontoon3);
        objects.push(pontoon3);

        var pontoon4 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon4.position.set(8, 2, 8);
        scene.add(pontoon4);
        objects.push(pontoon4);

        // Pontoon anchors - cylinder anchors
        var anchorMat = new THREE.MeshLambertMaterial({ color: 0x4682B4 });
        var anchorGeom = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
        var anchor1 = new THREE.Mesh(anchorGeom, anchorMat);
        anchor1.position.set(-20, 0.5, 10);
        scene.add(anchor1);
        objects.push(anchor1);

        var anchor2 = new THREE.Mesh(anchorGeom, anchorMat);
        anchor2.position.set(10, 0.5, 10);
        scene.add(anchor2);
        objects.push(anchor2);

        // Bridge cables - LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -20, 4, 10,
            -8, 3, 8,
            8, 3, 8,
            10, 4, 10
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Bridge demolition charge control hut
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var hutGeom = new THREE.BoxGeometry(3, 2.5, 3);
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(15, 2, 6);
        scene.add(hut);
        objects.push(hut);

        // Demolition fuse wires - LineSegments
        var fuseGeom = new THREE.BufferGeometry();
        var fusePositions = new Float32Array([
            15, 3, 6,
            0, 2.5, 8,
            0, 2.5, 8,
            -10, 2, 8
        ]);
        fuseGeom.setAttribute('position', new THREE.BufferAttribute(fusePositions, 3));
        var fuseMat = new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 2 });
        var fuses = new THREE.LineSegments(fuseGeom, fuseMat);
        scene.add(fuses);
        objects.push(fuses);

        // Anti-tank ditch - deep box trench across route
        var ditchMat = new THREE.MeshLambertMaterial({ color: 0x3D3D3D });
        var ditchGeom = new THREE.BoxGeometry(50, 5, 4);
        var ditch = new THREE.Mesh(ditchGeom, ditchMat);
        ditch.position.set(0, -2, 18);
        scene.add(ditch);
        objects.push(ditch);

        // Military police checkpoint barriers - box barriers
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var barrierGeom = new THREE.BoxGeometry(6, 1.2, 0.8);
        var barrier1 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier1.position.set(-15, 1, 25);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier2.position.set(15, 1, 25);
        scene.add(barrier2);
        objects.push(barrier2);

        // Checkpoint bollards - cylinder bollards
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var bollardGeom = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8);
        var bollard1 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard1.position.set(-10, 1, 25);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard2.position.set(0, 1, 25);
        scene.add(bollard2);
        objects.push(bollard2);

        var bollard3 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard3.position.set(10, 1, 25);
        scene.add(bollard3);
        objects.push(bollard3);

        // Helicopter landing pad - box pad
        var padMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var padGeom = new THREE.BoxGeometry(20, 0.5, 20);
        var pad = new THREE.Mesh(padGeom, padMat);
        pad.position.set(-25, 1.2, -25);
        scene.add(pad);
        objects.push(pad);

        // H marker on landing pad - LineSegments
        var hMarkerGeom = new THREE.BufferGeometry();
        var hMarkerPositions = new Float32Array([
            -30, 2, -25,
            -20, 2, -25,
            -25, 2, -25,
            -25, 2, -20
        ]);
        hMarkerGeom.setAttribute('position', new THREE.BufferAttribute(hMarkerPositions, 3));
        var hMarkerMat = new THREE.LineBasicMaterial({ color: 0xFFFFFF, linewidth: 3 });
        var hMarker = new THREE.LineSegments(hMarkerGeom, hMarkerMat);
        scene.add(hMarker);
        objects.push(hMarker);

        // Command sphere on hut roof
        var commandMat = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
        var commandGeom = new THREE.SphereGeometry(1, 8, 8);
        var command = new THREE.Mesh(commandGeom, commandMat);
        command.position.set(15, 4.5, 6);
        scene.add(command);
        objects.push(command);

        // Watch tower cone
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var towerGeom = new THREE.ConeGeometry(2, 6, 8);
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(25, 4, 20);
        scene.add(tower);
        objects.push(tower);

        // Lights
        var ambLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 20, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate elements here if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                // Optional subtle rotation for command sphere
                if (objects[i].geometry && objects[i].geometry.type === 'SphereGeometry') {
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
