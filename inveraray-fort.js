window.InverarayFort = (function() {
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
        // Inveraray Castle main keep - large box
        var castleKeepGeom = new THREE.BoxGeometry(20, 25, 18);
        var castleKeepMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var castleKeep = new THREE.Mesh(castleKeepGeom, castleKeepMat);
        castleKeep.position.set(0, 12.5, 0);
        scene.add(castleKeep);
        objects.push(castleKeep);

        // Castle left flanking tower
        var towerLeftGeom = new THREE.BoxGeometry(10, 20, 10);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x7A6C5D});
        var towerLeft = new THREE.Mesh(towerLeftGeom, towerMat);
        towerLeft.position.set(-15, 10, -10);
        scene.add(towerLeft);
        objects.push(towerLeft);

        // Castle right flanking tower
        var towerRight = new THREE.Mesh(towerLeftGeom, towerMat);
        towerRight.position.set(15, 10, -10);
        scene.add(towerRight);
        objects.push(towerRight);

        // Castle corner turret - front left
        var turretGeom = new THREE.CylinderGeometry(6, 6, 16, 16);
        var turretMat = new THREE.MeshLambertMaterial({color: 0x696060});
        var turretFL = new THREE.Mesh(turretGeom, turretMat);
        turretFL.position.set(-12, 8, -12);
        scene.add(turretFL);
        objects.push(turretFL);

        // Castle corner turret - front right
        var turretFR = new THREE.Mesh(turretGeom, turretMat);
        turretFR.position.set(12, 8, -12);
        scene.add(turretFR);
        objects.push(turretFR);

        // Castle corner turret - back left
        var turretBL = new THREE.Mesh(turretGeom, turretMat);
        turretBL.position.set(-12, 8, 10);
        scene.add(turretBL);
        objects.push(turretBL);

        // Castle corner turret - back right
        var turretBR = new THREE.Mesh(turretGeom, turretMat);
        turretBR.position.set(12, 8, 10);
        scene.add(turretBR);
        objects.push(turretBR);

        // Tower caps - cone roofs on turrets
        var capGeom = new THREE.ConeGeometry(6.5, 6, 16);
        var capMat = new THREE.MeshLambertMaterial({color: 0x444444});
        var capFL = new THREE.Mesh(capGeom, capMat);
        capFL.position.set(-12, 22, -12);
        scene.add(capFL);
        objects.push(capFL);

        var capFR = new THREE.Mesh(capGeom, capMat);
        capFR.position.set(12, 22, -12);
        scene.add(capFR);
        objects.push(capFR);

        // Inveraray town checkpoint - whitewashed townhouses
        var housesGeom = new THREE.BoxGeometry(8, 10, 6);
        var housesMat = new THREE.MeshLambertMaterial({color: 0xF5F5DC});
        var townHouse1 = new THREE.Mesh(housesGeom, housesMat);
        townHouse1.position.set(-25, 5, -20);
        scene.add(townHouse1);
        objects.push(townHouse1);

        var townHouse2 = new THREE.Mesh(housesGeom, housesMat);
        townHouse2.position.set(-25, 5, -5);
        scene.add(townHouse2);
        objects.push(townHouse2);

        // Vehicle barrier
        var barrierGeom = new THREE.BoxGeometry(12, 3, 1.5);
        var barrierMat = new THREE.MeshLambertMaterial({color: 0xA9A9A9});
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(-25, 1.5, 5);
        scene.add(barrier);
        objects.push(barrier);

        // Guard post cylinder
        var guardPostGeom = new THREE.CylinderGeometry(4, 4, 8, 12);
        var guardPostMat = new THREE.MeshLambertMaterial({color: 0xA0826D});
        var guardPost = new THREE.Mesh(guardPostGeom, guardPostMat);
        guardPost.position.set(-28, 4, 12);
        scene.add(guardPost);
        objects.push(guardPost);

        // Inveraray Jail - Georgian jail box
        var jailGeom = new THREE.BoxGeometry(14, 12, 10);
        var jailMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var jailMain = new THREE.Mesh(jailGeom, jailMat);
        jailMain.position.set(22, 6, -18);
        scene.add(jailMain);
        objects.push(jailMain);

        // Jail cell block
        var cellsGeom = new THREE.BoxGeometry(10, 8, 8);
        var cellsMat = new THREE.MeshLambertMaterial({color: 0x5C3D2E});
        var cells = new THREE.Mesh(cellsGeom, cellsMat);
        cells.position.set(30, 4, -15);
        scene.add(cells);
        objects.push(cells);

        // Jail guard tower cylinder
        var jailTowerGeom = new THREE.CylinderGeometry(5, 5, 14, 12);
        var jailTowerMat = new THREE.MeshLambertMaterial({color: 0x4A3728});
        var jailTower = new THREE.Mesh(jailTowerGeom, jailTowerMat);
        jailTower.position.set(28, 7, -5);
        scene.add(jailTower);
        objects.push(jailTower);

        // Loch Fyne naval pier - stone box
        var pierGeom = new THREE.BoxGeometry(18, 2, 6);
        var pierMat = new THREE.MeshLambertMaterial({color: 0x808080});
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(5, 1, 25);
        scene.add(pier);
        objects.push(pier);

        // Patrol boats - small boxes
        var boatGeom = new THREE.BoxGeometry(4, 2, 2);
        var boatMat = new THREE.MeshLambertMaterial({color: 0x1C1C3C});
        var boat1 = new THREE.Mesh(boatGeom, boatMat);
        boat1.position.set(-5, 2.5, 28);
        scene.add(boat1);
        objects.push(boat1);

        var boat2 = new THREE.Mesh(boatGeom, boatMat);
        boat2.position.set(8, 2.5, 28);
        scene.add(boat2);
        objects.push(boat2);

        // Davit crane cylinder
        var davitGeom = new THREE.CylinderGeometry(1.5, 1.5, 12, 8);
        var davitMat = new THREE.MeshLambertMaterial({color: 0x696060});
        var davit = new THREE.Mesh(davitGeom, davitMat);
        davit.position.set(-8, 6, 22);
        scene.add(davit);
        objects.push(davit);

        // Cherry Park artillery - gun emplacement box
        var emplacementGeom = new THREE.BoxGeometry(10, 1.5, 10);
        var emplacementMat = new THREE.MeshLambertMaterial({color: 0x556B2F});
        var emplacement = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement.position.set(-20, 0.75, 18);
        scene.add(emplacement);
        objects.push(emplacement);

        // Gun barrel cylinder
        var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
        var barrelMat = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(-20, 3, 18);
        barrel.rotation.z = Math.PI / 6;
        scene.add(barrel);
        objects.push(barrel);

        // Crew shelter box
        var shelterGeom = new THREE.BoxGeometry(8, 4, 6);
        var shelterMat = new THREE.MeshLambertMaterial({color: 0x6B5D4F});
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(-20, 2, 8);
        scene.add(shelter);
        objects.push(shelter);

        // All Saints Church - tower cylinder
        var churchTowerGeom = new THREE.CylinderGeometry(5, 5, 18, 12);
        var churchMat = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var churchTower = new THREE.Mesh(churchTowerGeom, churchMat);
        churchTower.position.set(25, 9, 5);
        scene.add(churchTower);
        objects.push(churchTower);

        // Church nave converted to barracks box
        var naveGeom = new THREE.BoxGeometry(12, 8, 16);
        var naveMat = new THREE.MeshLambertMaterial({color: 0x8B6F47});
        var nave = new THREE.Mesh(naveGeom, naveMat);
        nave.position.set(25, 4, 18);
        scene.add(nave);
        objects.push(nave);

        // Royal Highland Fusiliers barracks block
        var barracksGeom = new THREE.BoxGeometry(16, 10, 12);
        var barracksMat = new THREE.MeshLambertMaterial({color: 0xCD5C5C});
        var barracks = new THREE.Mesh(barracksGeom, barracksMat);
        barracks.position.set(-10, 5, -28);
        scene.add(barracks);
        objects.push(barracks);

        // Armory box
        var armoryGeom = new THREE.BoxGeometry(10, 8, 8);
        var armoryMat = new THREE.MeshLambertMaterial({color: 0xA0522D});
        var armory = new THREE.Mesh(armoryGeom, armoryMat);
        armory.position.set(5, 4, -28);
        scene.add(armory);
        objects.push(armory);

        // Perimeter fence using LineSegments
        var fenceGeom = new THREE.BufferGeometry();
        var fencePoints = [];
        var fenceCorners = [
            [-35, -35],
            [35, -35],
            [35, 35],
            [-35, 35],
            [-35, -35]
        ];
        for (var i = 0; i < fenceCorners.length; i++) {
            fencePoints.push(fenceCorners[i][0], 0, fenceCorners[i][1]);
            fencePoints.push(fenceCorners[i][0], 3, fenceCorners[i][1]);
        }
        fenceGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePoints), 3));
        var fenceMat = new THREE.LineBasicMaterial({color: 0x444444, linewidth: 2});
        var fence = new THREE.LineSegments(fenceGeom, fenceMat);
        scene.add(fence);
        objects.push(fence);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(20, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation logic if needed
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
