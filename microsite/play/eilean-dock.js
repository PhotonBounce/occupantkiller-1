window.EileanDock = (function() {
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
        // Rocky island base box
        var islandGeo = new THREE.BoxGeometry(80, 15, 60);
        var islandMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var island = new THREE.Mesh(islandGeo, islandMat);
        island.position.set(0, -8, 0);
        scene.add(island);
        objects.push(island);

        // Hidden submarine pen entrance (box tunnel cut into island)
        var penGeo = new THREE.BoxGeometry(20, 12, 18);
        var penMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var pen = new THREE.Mesh(penGeo, penMat);
        pen.position.set(-25, -2, 0);
        scene.add(pen);
        objects.push(pen);

        // Pontoon dock section 1 (box)
        var pontoon1Geo = new THREE.BoxGeometry(25, 3, 12);
        var pontoonMat = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
        var pontoon1 = new THREE.Mesh(pontoon1Geo, pontoonMat);
        pontoon1.position.set(20, 3, -15);
        scene.add(pontoon1);
        objects.push(pontoon1);

        // Pontoon dock section 2 (box)
        var pontoon2Geo = new THREE.BoxGeometry(25, 3, 12);
        var pontoon2 = new THREE.Mesh(pontoon2Geo, pontoonMat);
        pontoon2.position.set(20, 3, 0);
        scene.add(pontoon2);
        objects.push(pontoon2);

        // Pontoon dock section 3 (box)
        var pontoon3Geo = new THREE.BoxGeometry(25, 3, 12);
        var pontoon3 = new THREE.Mesh(pontoon3Geo, pontoonMat);
        pontoon3.position.set(20, 3, 15);
        scene.add(pontoon3);
        objects.push(pontoon3);

        // Bollard 1 (cylinder)
        var bollardGeo = new THREE.CylinderGeometry(1.5, 1.5, 5, 8);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0xcc6633 });
        var bollard1 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard1.position.set(10, 6, -18);
        scene.add(bollard1);
        objects.push(bollard1);

        // Bollard 2 (cylinder)
        var bollard2 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard2.position.set(30, 6, -18);
        scene.add(bollard2);
        objects.push(bollard2);

        // Bollard 3 (cylinder)
        var bollard3 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard3.position.set(10, 6, 18);
        scene.add(bollard3);
        objects.push(bollard3);

        // Bollard 4 (cylinder)
        var bollard4 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard4.position.set(30, 6, 18);
        scene.add(bollard4);
        objects.push(bollard4);

        // Torpedo store bunker (box)
        var bunkerGeo = new THREE.BoxGeometry(18, 10, 16);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunker.position.set(-20, 2, 20);
        scene.add(bunker);
        objects.push(bunker);

        // Torpedo shape 1 (cylinder)
        var torpedoGeo = new THREE.CylinderGeometry(1, 1, 6, 6);
        var torpedoMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var torpedo1 = new THREE.Mesh(torpedoGeo, torpedoMat);
        torpedo1.position.set(-22, 5, 22);
        torpedo1.rotation.z = Math.PI / 2;
        scene.add(torpedo1);
        objects.push(torpedo1);

        // Torpedo shape 2 (cylinder)
        var torpedo2 = new THREE.Mesh(torpedoGeo, torpedoMat);
        torpedo2.position.set(-18, 5, 22);
        torpedo2.rotation.z = Math.PI / 2;
        scene.add(torpedo2);
        objects.push(torpedo2);

        // Patrol boat berth hull (box)
        var boatGeo = new THREE.BoxGeometry(12, 4, 8);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x1a3a4a });
        var boat = new THREE.Mesh(boatGeo, boatMat);
        boat.position.set(15, 5, -28);
        scene.add(boat);
        objects.push(boat);

        // Patrol boat mast (cylinder)
        var mastGeo = new THREE.CylinderGeometry(0.8, 0.8, 14, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(15, 12, -28);
        scene.add(mast);
        objects.push(mast);

        // Mine cable control hut (box)
        var hutGeo = new THREE.BoxGeometry(8, 6, 8);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x4a4a5a });
        var hut = new THREE.Mesh(hutGeo, hutMat);
        hut.position.set(-15, 3, -22);
        scene.add(hut);
        objects.push(hut);

        // Mine cable control lines (LineSegments)
        var cablePoints = [
            new THREE.Vector3(-15, 9, -22),
            new THREE.Vector3(-8, 0, -15),
            new THREE.Vector3(-8, 0, -15),
            new THREE.Vector3(-2, 1, -10),
            new THREE.Vector3(-2, 1, -10),
            new THREE.Vector3(8, 0, -5)
        ];
        var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var lineMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        var cables = new THREE.LineSegments(cableGeo, lineMat);
        scene.add(cables);
        objects.push(cables);

        // Radar dome (sphere on cylinder pedestal)
        var radarBaseGeo = new THREE.CylinderGeometry(2, 2.5, 4, 8);
        var radarBaseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var radarBase = new THREE.Mesh(radarBaseGeo, radarBaseMat);
        radarBase.position.set(-30, 5, -15);
        scene.add(radarBase);
        objects.push(radarBase);

        // Radar dome sphere
        var radarDomeGeo = new THREE.SphereGeometry(3, 16, 12);
        var radarDomeMat = new THREE.MeshLambertMaterial({ color: 0xddaa55 });
        var radarDome = new THREE.Mesh(radarDomeGeo, radarDomeMat);
        radarDome.position.set(-30, 11, -15);
        scene.add(radarDome);
        objects.push(radarDome);

        // Fuel depot tank 1 (cylinder)
        var tankGeo = new THREE.CylinderGeometry(3, 3, 10, 12);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
        var tank1 = new THREE.Mesh(tankGeo, tankMat);
        tank1.position.set(5, 5, 25);
        scene.add(tank1);
        objects.push(tank1);

        // Fuel depot tank 2 (cylinder)
        var tank2 = new THREE.Mesh(tankGeo, tankMat);
        tank2.position.set(18, 5, 25);
        scene.add(tank2);
        objects.push(tank2);

        // Fuel depot pump house (box)
        var pumpGeo = new THREE.BoxGeometry(12, 6, 10);
        var pumpMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(11, 3, 35);
        scene.add(pump);
        objects.push(pump);

        // Secondary fuel tank (cylinder)
        var tank3Geo = new THREE.CylinderGeometry(2, 2, 8, 10);
        var tank3 = new THREE.Mesh(tank3Geo, tankMat);
        tank3.position.set(-5, 4, 28);
        scene.add(tank3);
        objects.push(tank3);

        // Communication tower base (cone)
        var towerGeo = new THREE.ConeGeometry(2.5, 8, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(25, 8, 28);
        scene.add(tower);
        objects.push(tower);

        // Ammunition storage (box)
        var ammoGeo = new THREE.BoxGeometry(16, 8, 12);
        var ammoMat = new THREE.MeshLambertMaterial({ color: 0x2a3a4a });
        var ammo = new THREE.Mesh(ammoGeo, ammoMat);
        ammo.position.set(-32, 4, 10);
        scene.add(ammo);
        objects.push(ammo);

        // Supply crane pedestal (cylinder)
        var craneGeo = new THREE.CylinderGeometry(1.2, 1.8, 6, 8);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var crane = new THREE.Mesh(craneGeo, craneMat);
        crane.position.set(32, 3, 8);
        scene.add(crane);
        objects.push(crane);

        // Emergency beacon sphere
        var beaconGeo = new THREE.SphereGeometry(1.5, 12, 8);
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(-35, 8, -25);
        scene.add(beacon);
        objects.push(beacon);

        // Directional light
        var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(40, 50, 40);
        scene.add(light1);
        lights.push(light1);

        // Ambient light
        var light2 = new THREE.AmbientLight(0x404040);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Rotate radar dome slowly
        if (objects.length > 19) {
            objects[19].rotation.y += 0.01;
        }
        // Pulse beacon
        if (objects.length > 25) {
            var beaconScale = 1 + 0.15 * Math.sin(Date.now() * 0.003);
            objects[25].scale.set(beaconScale, beaconScale, beaconScale);
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
