window.CampbeltownFort = (function() {
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
        // Machrihanish airfield box runway terrain
        var runwayGeom = new THREE.BoxGeometry(80, 2, 40);
        var runwayMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var runway = new THREE.Mesh(runwayGeom, runwayMat);
        runway.position.set(0, 0, -25);
        scene.add(runway);
        objects.push(runway);

        // NATO air base hardened aircraft shelter 1 (box)
        var shelterGeom1 = new THREE.BoxGeometry(25, 12, 20);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x663333 });
        var shelter1 = new THREE.Mesh(shelterGeom1, shelterMat);
        shelter1.position.set(-28, 6, 8);
        scene.add(shelter1);
        objects.push(shelter1);

        // Cylinder blast deflector for shelter 1
        var deflectorGeom1 = new THREE.CylinderGeometry(3, 3, 14, 8);
        var deflectorMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var deflector1 = new THREE.Mesh(deflectorGeom1, deflectorMat);
        deflector1.position.set(-28, 7, 20);
        scene.add(deflector1);
        objects.push(deflector1);

        // NATO air base hardened aircraft shelter 2 (box)
        var shelter2 = new THREE.Mesh(shelterGeom1, shelterMat);
        shelter2.position.set(28, 6, 8);
        scene.add(shelter2);
        objects.push(shelter2);

        // Cylinder blast deflector for shelter 2
        var deflector2 = new THREE.Mesh(deflectorGeom1, deflectorMat);
        deflector2.position.set(28, 7, 20);
        scene.add(deflector2);
        objects.push(deflector2);

        // Campbeltown Loch submarine pen (box concrete pen)
        var penGeom = new THREE.BoxGeometry(35, 15, 30);
        var penMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var pen = new THREE.Mesh(penGeom, penMat);
        pen.position.set(0, 7.5, 25);
        scene.add(pen);
        objects.push(pen);

        // Cylinder conning towers for submarine pen
        var towerGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var tower1 = new THREE.Mesh(towerGeom, towerMat);
        tower1.position.set(-10, 15, 25);
        scene.add(tower1);
        objects.push(tower1);

        var tower2 = new THREE.Mesh(towerGeom, towerMat);
        tower2.position.set(10, 15, 25);
        scene.add(tower2);
        objects.push(tower2);

        // Town center occupation checkpoint - box barriers
        var barrierGeom = new THREE.BoxGeometry(3, 1.5, 2);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var barrier1 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier1.position.set(-15, 0.75, -12);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier2.position.set(-12, 0.75, -12);
        scene.add(barrier2);
        objects.push(barrier2);

        // Cylinder guard tower
        var guardTowerGeom = new THREE.CylinderGeometry(3, 3.5, 9, 10);
        var guardTowerMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var guardTower = new THREE.Mesh(guardTowerGeom, guardTowerMat);
        guardTower.position.set(-13.5, 4.5, -15);
        scene.add(guardTower);
        objects.push(guardTower);

        // Box sandbag positions
        var sandbagGeom = new THREE.BoxGeometry(2, 1, 2);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var sandbag1 = new THREE.Mesh(sandbagGeom, sandbagMat);
        sandbag1.position.set(-10, 0.5, -10);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2 = new THREE.Mesh(sandbagGeom, sandbagMat);
        sandbag2.position.set(-10, 0.5, -14);
        scene.add(sandbag2);
        objects.push(sandbag2);

        // Davaar Island lighthouse OP - cylinder lighthouse tower
        var lightTowerGeom = new THREE.CylinderGeometry(2, 2.5, 20, 12);
        var lightTowerMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var lightTower = new THREE.Mesh(lightTowerGeom, lightTowerMat);
        lightTower.position.set(20, 10, -20);
        scene.add(lightTower);
        objects.push(lightTower);

        // Box keeper cottage
        var cottageGeom = new THREE.BoxGeometry(6, 4, 6);
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        var cottage = new THREE.Mesh(cottageGeom, cottageMat);
        cottage.position.set(20, 2, -25);
        scene.add(cottage);
        objects.push(cottage);

        // LineSegments signal cables
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            20, 20, -20,
            15, 10, -20,
            20, 20, -20,
            25, 10, -20,
            20, 20, -20,
            20, 5, -15
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Old Quay coastal gun battery - box emplacements
        var emplacementGeom = new THREE.BoxGeometry(5, 2, 4);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var emplacement1 = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement1.position.set(10, 1, 28);
        scene.add(emplacement1);
        objects.push(emplacement1);

        var emplacement2 = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement2.position.set(16, 1, 28);
        scene.add(emplacement2);
        objects.push(emplacement2);

        // Cylinder gun barrels facing loch entrance
        var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel1.rotation.z = 0.4;
        barrel1.position.set(10, 4, 32);
        scene.add(barrel1);
        objects.push(barrel1);

        var barrel2 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel2.rotation.z = 0.4;
        barrel2.position.set(16, 4, 32);
        scene.add(barrel2);
        objects.push(barrel2);

        // Beinn Ghuilean hilltop radar station - cylinder radar tower
        var radarTowerGeom = new THREE.CylinderGeometry(1.5, 2, 18, 10);
        var radarTowerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var radarTower = new THREE.Mesh(radarTowerGeom, radarTowerMat);
        radarTower.position.set(-22, 9, -8);
        scene.add(radarTower);
        objects.push(radarTower);

        // Box equipment block
        var equipGeom = new THREE.BoxGeometry(5, 3, 5);
        var equipMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var equip = new THREE.Mesh(equipGeom, equipMat);
        equip.position.set(-22, 1.5, -8);
        scene.add(equip);
        objects.push(equip);

        // Sphere radar dome
        var domeGeom = new THREE.SphereGeometry(3, 16, 12);
        var domeMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var dome = new THREE.Mesh(domeGeom, domeMat);
        dome.position.set(-22, 20, -8);
        scene.add(dome);
        objects.push(dome);

        // Royal Navy fuel depot - box tank farm
        var tankFarmGeom = new THREE.BoxGeometry(25, 1, 20);
        var tankFarmMat = new THREE.MeshLambertMaterial({ color: 0x8B8B00 });
        var tankFarm = new THREE.Mesh(tankFarmGeom, tankFarmMat);
        tankFarm.position.set(-20, 0.5, 5);
        scene.add(tankFarm);
        objects.push(tankFarm);

        // Cylinder fuel tanks
        var fuelTankGeom = new THREE.CylinderGeometry(2.5, 2.5, 6, 8);
        var fuelTankMat = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        var fuelTank1 = new THREE.Mesh(fuelTankGeom, fuelTankMat);
        fuelTank1.position.set(-25, 3, 0);
        scene.add(fuelTank1);
        objects.push(fuelTank1);

        var fuelTank2 = new THREE.Mesh(fuelTankGeom, fuelTankMat);
        fuelTank2.position.set(-20, 3, 0);
        scene.add(fuelTank2);
        objects.push(fuelTank2);

        var fuelTank3 = new THREE.Mesh(fuelTankGeom, fuelTankMat);
        fuelTank3.position.set(-15, 3, 0);
        scene.add(fuelTank3);
        objects.push(fuelTank3);

        // Box pump house
        var pumpHouseGeom = new THREE.BoxGeometry(8, 5, 6);
        var pumpHouseMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var pumpHouse = new THREE.Mesh(pumpHouseGeom, pumpHouseMat);
        pumpHouse.position.set(-20, 2.5, 12);
        scene.add(pumpHouse);
        objects.push(pumpHouse);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
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
