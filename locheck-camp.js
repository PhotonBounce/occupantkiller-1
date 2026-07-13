window.LochEckCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        // Loch Eck narrows lakeshore
        var boathouseGeo = new THREE.BoxGeometry(8, 6, 5);
        var boathouseMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var boathouse = new THREE.Mesh(boathouseGeo, boathouseMat);
        boathouse.position.set(-25, 3, -20);
        scene.add(boathouse);
        objects.push(boathouse);

        var boatGeo = new THREE.CylinderGeometry(1.5, 1.8, 6, 8);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var boat = new THREE.Mesh(boatGeo, boatMat);
        boat.position.set(-20, 1, -22);
        boat.rotation.z = Math.PI / 6;
        scene.add(boat);
        objects.push(boat);

        var buoy1Geo = new THREE.SphereGeometry(1, 16, 16);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoy1 = new THREE.Mesh(buoy1Geo, buoyMat);
        buoy1.position.set(-15, 0.5, -18);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoy1Geo, buoyMat);
        buoy2.position.set(-18, 0.5, -25);
        scene.add(buoy2);
        objects.push(buoy2);

        var netPoints = [new THREE.Vector3(-15, 0.3, -18), new THREE.Vector3(-18, 0.3, -25)];
        var netGeo = new THREE.BufferGeometry().setFromPoints(netPoints);
        var netMat = new THREE.LineBasicMaterial({ color: 0x00AA00 });
        var sensorNet = new THREE.LineSegments(netGeo, netMat);
        scene.add(sensorNet);
        objects.push(sensorNet);

        // Younger Botanic Garden field hospital
        var glasshouseGeo = new THREE.BoxGeometry(12, 7, 8);
        var glasshouseMat = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 });
        var glasshouse = new THREE.Mesh(glasshouseGeo, glasshouseMat);
        glasshouse.position.set(5, 3.5, -15);
        scene.add(glasshouse);
        objects.push(glasshouse);

        var adminGeo = new THREE.BoxGeometry(10, 5, 6);
        var adminMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var admin = new THREE.Mesh(adminGeo, adminMat);
        admin.position.set(12, 2.5, -12);
        scene.add(admin);
        objects.push(admin);

        var tankGeo = new THREE.CylinderGeometry(2, 2.2, 5, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(8, 2.5, -8);
        scene.add(tank);
        objects.push(tank);

        // Bernice pass tactical position
        var roadCutGeo = new THREE.BoxGeometry(14, 4, 3);
        var roadCutMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var roadCut = new THREE.Mesh(roadCutGeo, roadCutMat);
        roadCut.position.set(20, 2, 0);
        scene.add(roadCut);
        objects.push(roadCut);

        var emplacementGeo = new THREE.BoxGeometry(6, 3, 6);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x8B8B00 });
        var emplacement = new THREE.Mesh(emplacementGeo, emplacementMat);
        emplacement.position.set(25, 1.5, 3);
        scene.add(emplacement);
        objects.push(emplacement);

        var chargeGeo = new THREE.SphereGeometry(0.8, 12, 12);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0x4B0000 });
        var charge = new THREE.Mesh(chargeGeo, chargeMat);
        charge.position.set(22, 0.5, 5);
        scene.add(charge);
        objects.push(charge);

        // Whistlefield Inn crossroads post
        var innGeo = new THREE.BoxGeometry(9, 5, 7);
        var innMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var inn = new THREE.Mesh(innGeo, innMat);
        inn.position.set(-5, 2.5, 10);
        scene.add(inn);
        objects.push(inn);

        var barrierGeo = new THREE.BoxGeometry(8, 2, 1);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(-2, 1, 14);
        scene.add(barrier);
        objects.push(barrier);

        var towerGeo = new THREE.CylinderGeometry(1.2, 1.5, 6, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(-8, 3, 12);
        scene.add(tower);
        objects.push(tower);

        // Beinn Mhor summit relay
        var shelterGeo = new THREE.BoxGeometry(7, 4, 5);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var shelter = new THREE.Mesh(shelterGeo, shelterMat);
        shelter.position.set(15, 2, 15);
        scene.add(shelter);
        objects.push(shelter);

        var mastGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(18, 4, 16);
        scene.add(mast);
        objects.push(mast);

        var domeGeo = new THREE.SphereGeometry(1.2, 16, 16);
        var domeMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(18, 8.2, 16);
        scene.add(dome);
        objects.push(dome);

        // Glen Branter forestry ambush
        var forestRoadGeo = new THREE.BoxGeometry(10, 1, 4);
        var forestRoadMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var forestRoad = new THREE.Mesh(forestRoadGeo, forestRoadMat);
        forestRoad.position.set(-15, 0.5, 22);
        scene.add(forestRoad);
        objects.push(forestRoad);

        var barricadeGeo = new THREE.BoxGeometry(5, 3, 2);
        var barricadeMat = new THREE.MeshLambertMaterial({ color: 0x3E2723 });
        var barricade = new THREE.Mesh(barricadeGeo, barricadeMat);
        barricade.position.set(-12, 1.5, 25);
        scene.add(barricade);
        objects.push(barricade);

        var wire1Points = [new THREE.Vector3(-12, 1.2, 25), new THREE.Vector3(-10, 1.2, 26)];
        var wire1Geo = new THREE.BufferGeometry().setFromPoints(wire1Points);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x333333 });
        var tripwire1 = new THREE.LineSegments(wire1Geo, wireMat);
        scene.add(tripwire1);
        objects.push(tripwire1);

        // Stronchullin Farm supply base
        var farmGeo = new THREE.BoxGeometry(11, 5, 8);
        var farmMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var farm = new THREE.Mesh(farmGeo, farmMat);
        farm.position.set(-28, 2.5, 5);
        scene.add(farm);
        objects.push(farm);

        var dieselGeo = new THREE.CylinderGeometry(1.8, 2, 4, 16);
        var dieselMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var diesel = new THREE.Mesh(dieselGeo, dieselMat);
        diesel.position.set(-22, 2, 8);
        scene.add(diesel);
        objects.push(diesel);

        var shedGeo = new THREE.BoxGeometry(8, 4, 6);
        var shedMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var shed = new THREE.Mesh(shedGeo, shedMat);
        shed.position.set(-26, 2, 12);
        scene.add(shed);
        objects.push(shed);

        // Puck's Glen gorge sniper position
        var ledgeGeo = new THREE.BoxGeometry(6, 3, 7);
        var ledgeMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var ledge = new THREE.Mesh(ledgeGeo, ledgeMat);
        ledge.position.set(8, 1.5, 28);
        scene.add(ledge);
        objects.push(ledge);

        var canoopyGeo = new THREE.ConeGeometry(2.5, 3, 8);
        var canopyMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var canopy = new THREE.Mesh(canoopyGeo, canopyMat);
        canopy.position.set(10, 2, 30);
        scene.add(canopy);
        objects.push(canopy);

        var cablePoints = [new THREE.Vector3(8, 2, 28), new THREE.Vector3(12, 2.5, 32)];
        var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var cable = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation placeholder
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
