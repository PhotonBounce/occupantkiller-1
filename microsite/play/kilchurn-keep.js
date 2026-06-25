window.KilchurnKeep = (function() {
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
        // Kilchurn Castle main tower (central box)
        var mainTowerGeom = new THREE.BoxGeometry(15, 25, 12);
        var mainTowerMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var mainTower = new THREE.Mesh(mainTowerGeom, mainTowerMat);
        mainTower.position.set(0, 12.5, 0);
        scene.add(mainTower);
        objects.push(mainTower);

        // Castle curtain wall (long box)
        var curtainGeom = new THREE.BoxGeometry(40, 8, 3);
        var curtainMat = new THREE.MeshLambertMaterial({ color: 0x9B8B7B });
        var curtain = new THREE.Mesh(curtainGeom, curtainMat);
        curtain.position.set(5, 4, 15);
        scene.add(curtain);
        objects.push(curtain);

        // Barracks range (rectangular box)
        var barracksGeom = new THREE.BoxGeometry(25, 6, 10);
        var barracksMat = new THREE.MeshLambertMaterial({ color: 0x7B6B5B });
        var barracks = new THREE.Mesh(barracksGeom, barracksMat);
        barracks.position.set(-15, 3, -10);
        scene.add(barracks);
        objects.push(barracks);

        // Corner tower 1 (cylinder)
        var cornerTower1Geom = new THREE.CylinderGeometry(4, 5, 20, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var cornerTower1 = new THREE.Mesh(cornerTower1Geom, towerMat);
        cornerTower1.position.set(25, 10, 20);
        scene.add(cornerTower1);
        objects.push(cornerTower1);

        // Corner tower 2 (cylinder)
        var cornerTower2Geom = new THREE.CylinderGeometry(4, 5, 20, 8);
        var cornerTower2 = new THREE.Mesh(cornerTower2Geom, towerMat);
        cornerTower2.position.set(-28, 10, 22);
        scene.add(cornerTower2);
        objects.push(cornerTower2);

        // Castle causeway (box connecting to water)
        var causewayGeom = new THREE.BoxGeometry(8, 2, 20);
        var causewayMat = new THREE.MeshLambertMaterial({ color: 0xAA9988 });
        var causeway = new THREE.Mesh(causewayGeom, causewayMat);
        causeway.position.set(20, 1, -15);
        scene.add(causeway);
        objects.push(causeway);

        // Acoustic sensor buoy 1 (sphere)
        var buoyGeom = new THREE.SphereGeometry(2, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6B35 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(30, 2, -20);
        scene.add(buoy1);
        objects.push(buoy1);

        // Acoustic sensor buoy 2 (sphere)
        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(35, 2, -10);
        scene.add(buoy2);
        objects.push(buoy2);

        // Detection cable (LineSegments)
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            30, 2, -20,
            35, 2, -10,
            32, 2, 0
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Beinn a Chochuill stone shelter (box)
        var shelterGeom = new THREE.BoxGeometry(6, 4, 8);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(-20, 2, 25);
        scene.add(shelter);
        objects.push(shelter);

        // Signal mast (cylinder)
        var mastGeom = new THREE.CylinderGeometry(1, 1.5, 18, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-20, 9, 25);
        scene.add(mast);
        objects.push(mast);

        // Weather sensor (sphere)
        var sensorGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var sensorMat = new THREE.MeshLambertMaterial({ color: 0xFFDD00 });
        var sensor = new THREE.Mesh(sensorGeom, sensorMat);
        sensor.position.set(-20, 18, 25);
        scene.add(sensor);
        objects.push(sensor);

        // Glen road checkpoint concrete barrier (box)
        var barrierGeom = new THREE.BoxGeometry(12, 2, 2);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(15, 1, -25);
        scene.add(barrier);
        objects.push(barrier);

        // Guard post (cylinder)
        var guardGeom = new THREE.CylinderGeometry(3, 4, 12, 8);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var guardPost = new THREE.Mesh(guardGeom, guardMat);
        guardPost.position.set(12, 6, -28);
        scene.add(guardPost);
        objects.push(guardPost);

        // Sandbag position (box)
        var sandbagGeom = new THREE.BoxGeometry(8, 1.5, 6);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xCC8844 });
        var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
        sandbag.position.set(18, 0.75, -30);
        scene.add(sandbag);
        objects.push(sandbag);

        // River Orchy bridge (box)
        var bridgeGeom = new THREE.BoxGeometry(10, 1, 15);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(-25, 0.5, -15);
        scene.add(bridge);
        objects.push(bridge);

        // Explosive charges 1 (sphere)
        var chargeGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var charge1 = new THREE.Mesh(chargeGeom, chargeMat);
        charge1.position.set(-22, 1.5, -10);
        scene.add(charge1);
        objects.push(charge1);

        // Explosive charges 2 (sphere)
        var charge2 = new THREE.Mesh(chargeGeom, chargeMat);
        charge2.position.set(-28, 1.5, -15);
        scene.add(charge2);
        objects.push(charge2);

        // Detonator wire (LineSegments)
        var detonatorGeom = new THREE.BufferGeometry();
        var detonatorPositions = new Float32Array([
            -22, 1.5, -10,
            -28, 1.5, -15,
            -30, 1, -20
        ]);
        detonatorGeom.setAttribute('position', new THREE.BufferAttribute(detonatorPositions, 3));
        var detonatorMat = new THREE.LineBasicMaterial({ color: 0xFF00FF });
        var detonator = new THREE.LineSegments(detonatorGeom, detonatorMat);
        scene.add(detonator);
        objects.push(detonator);

        // Loch-side floating platform (box)
        var platformGeom = new THREE.BoxGeometry(12, 1, 10);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x8B6F47 });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(8, 0.5, 20);
        scene.add(platform);
        objects.push(platform);

        // Fuel drums 1 (cylinder)
        var drumGeom = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
        var drumMat = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        var drum1 = new THREE.Mesh(drumGeom, drumMat);
        drum1.position.set(4, 2, 18);
        scene.add(drum1);
        objects.push(drum1);

        // Fuel drums 2 (cylinder)
        var drum2 = new THREE.Mesh(drumGeom, drumMat);
        drum2.position.set(10, 2, 22);
        scene.add(drum2);
        objects.push(drum2);

        // Camouflage canopy (box)
        var canopyGeom = new THREE.BoxGeometry(14, 2, 12);
        var canopyMat = new THREE.MeshLambertMaterial({ color: 0x3D5C3D });
        var canopy = new THREE.Mesh(canopyGeom, canopyMat);
        canopy.position.set(8, 4, 20);
        scene.add(canopy);
        objects.push(canopy);

        // Glenorchy drove road (box)
        var droveRoadGeom = new THREE.BoxGeometry(6, 0.5, 25);
        var droveRoadMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var droveRoad = new THREE.Mesh(droveRoadGeom, droveRoadMat);
        droveRoad.position.set(-10, 0.25, 0);
        scene.add(droveRoad);
        objects.push(droveRoad);

        // IED charges (sphere)
        var iedGeom = new THREE.SphereGeometry(1, 8, 8);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var ied1 = new THREE.Mesh(iedGeom, iedMat);
        ied1.position.set(-12, 1, 5);
        scene.add(ied1);
        objects.push(ied1);

        // IED charges 2 (sphere)
        var ied2 = new THREE.Mesh(iedGeom, iedMat);
        ied2.position.set(-8, 1, 15);
        scene.add(ied2);
        objects.push(ied2);

        // Command wire through heather (LineSegments)
        var commandWireGeom = new THREE.BufferGeometry();
        var commandWirePositions = new Float32Array([
            -12, 1, 5,
            -8, 1, 15,
            -5, 0.5, 25
        ]);
        commandWireGeom.setAttribute('position', new THREE.BufferAttribute(commandWirePositions, 3));
        var commandWireMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var commandWire = new THREE.LineSegments(commandWireGeom, commandWireMat);
        scene.add(commandWire);
        objects.push(commandWire);

        // Terrain loch base (cone for landscape feature)
        var terrainGeom = new THREE.ConeGeometry(35, 2, 16);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, 0, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
        directionalLight.position.set(20, 30, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate elements if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.001 * delta;
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
