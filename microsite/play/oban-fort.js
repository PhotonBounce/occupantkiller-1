window.ObanFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // McCaig's Tower hilltop OP - cylinder colosseum ring wall
        var towerRingGeom = new THREE.CylinderGeometry(15, 15, 8, 32);
        var towerRingMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var towerRing = new THREE.Mesh(towerRingGeom, towerRingMat);
        towerRing.position.set(20, 4, 20);
        scene.add(towerRing);
        objects.push(towerRing);

        // McCaig's Tower observation platform - box inside ring
        var platformGeom = new THREE.BoxGeometry(8, 3, 8);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(20, 10, 20);
        scene.add(platform);
        objects.push(platform);

        // Dunollie Castle ruined keep - tall box
        var keepGeom = new THREE.BoxGeometry(12, 18, 12);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var keep = new THREE.Mesh(keepGeom, keepMat);
        keep.position.set(-25, 9, 15);
        scene.add(keep);
        objects.push(keep);

        // Dunollie Castle rocky headland - large box base
        var headlandGeom = new THREE.BoxGeometry(20, 6, 16);
        var headlandMat = new THREE.MeshLambertMaterial({ color: 0x8B7765 });
        var headland = new THREE.Mesh(headlandGeom, headlandMat);
        headland.position.set(-25, 3, 15);
        scene.add(headland);
        objects.push(headland);

        // Dunollie Castle corner tower - cylinder
        var cornerTowerGeom = new THREE.CylinderGeometry(4, 4, 14, 16);
        var cornerTowerMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var cornerTower = new THREE.Mesh(cornerTowerGeom, cornerTowerMat);
        cornerTower.position.set(-32, 7, 22);
        scene.add(cornerTower);
        objects.push(cornerTower);

        // Oban distillery - main pot still cylinder
        var stillGeom = new THREE.CylinderGeometry(5, 6, 12, 24);
        var stillMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var still = new THREE.Mesh(stillGeom, stillMat);
        still.position.set(10, 6, -15);
        scene.add(still);
        objects.push(still);

        // Oban distillery warehouse - box
        var warehouseGeom = new THREE.BoxGeometry(16, 10, 14);
        var warehouseMat = new THREE.MeshLambertMaterial({ color: 0xB8860B });
        var warehouse = new THREE.Mesh(warehouseGeom, warehouseMat);
        warehouse.position.set(10, 5, -30);
        scene.add(warehouse);
        objects.push(warehouse);

        // Oban distillery loading bay - box
        var bayGeom = new THREE.BoxGeometry(12, 6, 8);
        var bayMat = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
        var bay = new THREE.Mesh(bayGeom, bayMat);
        bay.position.set(25, 3, -25);
        scene.add(bay);
        objects.push(bay);

        // North Pier stone pier - large box
        var pierGeom = new THREE.BoxGeometry(24, 4, 6);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(-15, 2, -20);
        scene.add(pier);
        objects.push(pier);

        // North Pier patrol boat hulls - box
        var boatGeom = new THREE.BoxGeometry(6, 4, 4);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x4682B4 });
        var boat = new THREE.Mesh(boatGeom, boatMat);
        boat.position.set(-20, 4, -22);
        scene.add(boat);
        objects.push(boat);

        // North Pier mooring bollard - cylinder
        var bollardGeom = new THREE.CylinderGeometry(2, 2.5, 3, 12);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var bollard = new THREE.Mesh(bollardGeom, bollardMat);
        bollard.position.set(-10, 4, -18);
        scene.add(bollard);
        objects.push(bollard);

        // Pulpit Hill AA emplacement - box
        var aemplaceGeom = new THREE.BoxGeometry(14, 3, 14);
        var aemplaceMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var aemplace = new THREE.Mesh(aemplaceGeom, aemplaceMat);
        aemplace.position.set(5, 15, 5);
        scene.add(aemplace);
        objects.push(aemplace);

        // Pulpit Hill gun mount - cylinder
        var gunMountGeom = new THREE.CylinderGeometry(3, 3, 4, 16);
        var gunMountMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var gunMount = new THREE.Mesh(gunMountGeom, gunMountMat);
        gunMount.position.set(5, 19, 5);
        scene.add(gunMount);
        objects.push(gunMount);

        // Pulpit Hill crew shelter - box
        var shelterGeom = new THREE.BoxGeometry(8, 5, 8);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(5, 5, 10);
        scene.add(shelter);
        objects.push(shelter);

        // Railway pier emplacement - box
        var railEmplaceGeom = new THREE.BoxGeometry(12, 2, 10);
        var railEmplaceMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var railEmplace = new THREE.Mesh(railEmplaceGeom, railEmplaceMat);
        railEmplace.position.set(-22, 1, 5);
        scene.add(railEmplace);
        objects.push(railEmplace);

        // Railway pier gun barrel - cylinder
        var barrelGeom = new THREE.CylinderGeometry(1.5, 1.5, 18, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.z = Math.PI / 6;
        barrel.position.set(-22, 4, 5);
        scene.add(barrel);
        objects.push(barrel);

        // Railway pier range-finder cables - LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -22, 4, 5,
            -10, 12, 5,
            -22, 4, 5,
            -30, 8, -5
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0xFFD700 });
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Dunstaffnage Castle keep - box
        var dstkeepGeom = new THREE.BoxGeometry(16, 20, 16);
        var dstkeepMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var dstkeep = new THREE.Mesh(dstkeepGeom, dstkeepMat);
        dstkeep.position.set(-30, 10, -10);
        scene.add(dstkeep);
        objects.push(dstkeep);

        // Dunstaffnage courtyard - box
        var courtGeom = new THREE.BoxGeometry(20, 1, 20);
        var courtMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var court = new THREE.Mesh(courtGeom, courtMat);
        court.position.set(-30, 0.5, -10);
        scene.add(court);
        objects.push(court);

        // Dunstaffnage flanking tower - cylinder
        var flankerGeom = new THREE.CylinderGeometry(5, 5, 16, 20);
        var flankerMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var flanker = new THREE.Mesh(flankerGeom, flankerMat);
        flanker.position.set(-40, 8, -10);
        scene.add(flanker);
        objects.push(flanker);

        // West Highland bay terrain base - large box
        var terrainGeom = new THREE.BoxGeometry(80, 2, 80);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // animation logic here
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
