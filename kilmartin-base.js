window.KilmartinBase = (function() {
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
        // Kilmartin Castle stronghold
        var castleTowerGeom = new THREE.BoxGeometry(8, 14, 8);
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var castleTower = new THREE.Mesh(castleTowerGeom, castleMat);
        castleTower.position.set(-25, 7, -20);
        scene.add(castleTower);
        objects.push(castleTower);

        var castleCourtGeom = new THREE.BoxGeometry(16, 1, 16);
        var castleCourtMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var castleCourt = new THREE.Mesh(castleCourtGeom, castleCourtMat);
        castleCourt.position.set(-25, 0.5, -20);
        scene.add(castleCourt);
        objects.push(castleCourt);

        var castleTurretGeom = new THREE.ConeGeometry(4, 8, 8);
        var castleTurretMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var castleTurret = new THREE.Mesh(castleTurretGeom, castleTurretMat);
        castleTurret.position.set(-25, 15, -20);
        scene.add(castleTurret);
        objects.push(castleTurret);

        // Carnasserie Castle ruin
        var carnaRuinGeom = new THREE.BoxGeometry(10, 12, 6);
        var carnaMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var carnaRuin = new THREE.Mesh(carnaRuinGeom, carnaMat);
        carnaRuin.position.set(20, 6, -15);
        scene.add(carnaRuin);
        objects.push(carnaRuin);

        var carnaHallGeom = new THREE.BoxGeometry(12, 8, 10);
        var carnaHallMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var carnaHall = new THREE.Mesh(carnaHallGeom, carnaHallMat);
        carnaHall.position.set(20, 4, -25);
        scene.add(carnaHall);
        objects.push(carnaHall);

        var carnaStairGeom = new THREE.CylinderGeometry(3, 3, 10, 8);
        var carnaStairMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var carnaStair = new THREE.Mesh(carnaStairGeom, carnaStairMat);
        carnaStair.position.set(20, 5, -8);
        scene.add(carnaStair);
        objects.push(carnaStair);

        // Kilmartin Glen stone circle OP
        var cairnGeom = new THREE.BoxGeometry(14, 4, 14);
        var cairnMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var cairn = new THREE.Mesh(cairnGeom, cairnMat);
        cairn.position.set(0, 2, 10);
        scene.add(cairn);
        objects.push(cairn);

        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(0, 8, 10);
        scene.add(mast);
        objects.push(mast);

        var sensorGeom = new THREE.SphereGeometry(2, 16, 16);
        var sensorMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var sensor = new THREE.Mesh(sensorGeom, sensorMat);
        sensor.position.set(0, 14, 10);
        scene.add(sensor);
        objects.push(sensor);

        // Nether Largie farm supply base
        var farmhouseGeom = new THREE.BoxGeometry(10, 7, 12);
        var farmMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var farmhouse = new THREE.Mesh(farmhouseGeom, farmMat);
        farmhouse.position.set(-15, 3.5, 20);
        scene.add(farmhouse);
        objects.push(farmhouse);

        var fuelTankGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 8);
        var fuelMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var fuelTank = new THREE.Mesh(fuelTankGeom, fuelMat);
        fuelTank.position.set(-15, 4, 32);
        scene.add(fuelTank);
        objects.push(fuelTank);

        var equipStoreGeom = new THREE.BoxGeometry(8, 6, 10);
        var equipMat = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
        var equipStore = new THREE.Mesh(equipStoreGeom, equipMat);
        equipStore.position.set(-25, 3, 25);
        scene.add(equipStore);
        objects.push(equipStore);

        // Dunchraigaig road ambush
        var roadGeom = new THREE.BoxGeometry(4, 0.5, 25);
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var road = new THREE.Mesh(roadGeom, roadMat);
        road.position.set(0, 0.25, -5);
        scene.add(road);
        objects.push(road);

        var iedGeom = new THREE.SphereGeometry(1.2, 12, 12);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var ied = new THREE.Mesh(iedGeom, iedMat);
        ied.position.set(2, 0.8, 0);
        scene.add(ied);
        objects.push(ied);

        // Tripwire - LineSegments
        var wireGeom = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -2, 0.5, -5,
            2, 0.5, -5,
            -2, 0.5, 5,
            2, 0.5, 5
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var tripwire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(tripwire);
        objects.push(tripwire);

        // Poltalloch estate HQ
        var mansionGeom = new THREE.BoxGeometry(14, 10, 16);
        var mansionMat = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        var mansion = new THREE.Mesh(mansionGeom, mansionMat);
        mansion.position.set(28, 5, 5);
        scene.add(mansion);
        objects.push(mansion);

        var stableGeom = new THREE.BoxGeometry(10, 6, 12);
        var stableMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var stable = new THREE.Mesh(stableGeom, stableMat);
        stable.position.set(28, 3, 20);
        scene.add(stable);
        objects.push(stable);

        var towerGeom = new THREE.CylinderGeometry(3, 3, 12, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x4682B4 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(28, 6, -10);
        scene.add(tower);
        objects.push(tower);

        // Temple Wood relay
        var stoneGeom = new THREE.BoxGeometry(2, 4, 2);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xA0A0A0 });
        var stone1 = new THREE.Mesh(stoneGeom, stoneMat);
        stone1.position.set(-5, 2, 30);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(stoneGeom, stoneMat);
        stone2.position.set(5, 2, 30);
        scene.add(stone2);
        objects.push(stone2);

        var signalMastGeom = new THREE.CylinderGeometry(1, 1, 14, 8);
        var signalMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var signalMast = new THREE.Mesh(signalMastGeom, signalMat);
        signalMast.position.set(0, 9, 30);
        scene.add(signalMast);
        objects.push(signalMast);

        var radomeGeom = new THREE.SphereGeometry(2.5, 16, 16);
        var radiMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var radome = new THREE.Mesh(radomeGeom, radiMat);
        radome.position.set(0, 16, 30);
        scene.add(radome);
        objects.push(radome);

        // Kilmartin church command post
        var churchGeom = new THREE.BoxGeometry(8, 12, 10);
        var churchMat = new THREE.MeshLambertMaterial({ color: 0x800000 });
        var church = new THREE.Mesh(churchGeom, churchMat);
        church.position.set(-10, 6, -30);
        scene.add(church);
        objects.push(church);

        var graveyardGeom = new THREE.BoxGeometry(18, 1, 16);
        var graveMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var graveyard = new THREE.Mesh(graveyardGeom, graveMat);
        graveyard.position.set(-10, 0.5, -30);
        scene.add(graveyard);
        objects.push(graveyard);

        var bellGeom = new THREE.CylinderGeometry(2, 2.5, 8, 8);
        var bellMat = new THREE.MeshLambertMaterial({ color: 0xB8860B });
        var bellTower = new THREE.Mesh(bellGeom, bellMat);
        bellTower.position.set(-10, 14, -30);
        scene.add(bellTower);
        objects.push(bellTower);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(15, 20, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects here if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.1;
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
