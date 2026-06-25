window.LargsBase = (function() {
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
        // Largs Pier - Victorian pier structure
        var pierBoxGeom = new THREE.BoxGeometry(25, 3, 4);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var pierMesh = new THREE.Mesh(pierBoxGeom, pierMat);
        pierMesh.position.set(-20, 1, -15);
        scene.add(pierMesh);
        objects.push(pierMesh);

        // Largs Pier - Support columns (cylinders)
        var pillarGeom = new THREE.CylinderGeometry(0.8, 0.8, 5, 16);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var pillar1 = new THREE.Mesh(pillarGeom, pillarMat);
        pillar1.position.set(-15, 2.5, -15);
        scene.add(pillar1);
        objects.push(pillar1);

        var pillar2 = new THREE.Mesh(pillarGeom, pillarMat);
        pillar2.position.set(-25, 2.5, -15);
        scene.add(pillar2);
        objects.push(pillar2);

        // Patrol boat (cylinder)
        var boatGeom = new THREE.CylinderGeometry(2, 2.5, 8, 16);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var boatMesh = new THREE.Mesh(boatGeom, boatMat);
        boatMesh.position.set(-18, 4, -25);
        scene.add(boatMesh);
        objects.push(boatMesh);

        // Mooring buoys (spheres)
        var buoyGeom = new THREE.SphereGeometry(1.2, 16, 16);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(-10, 2, -30);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(-28, 2, -28);
        scene.add(buoy2);
        objects.push(buoy2);

        // Net cables (LineSegments)
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -10, 2, -30, -28, 2, -28,
            -10, 2, -30, -20, 0.5, -25,
            -28, 2, -28, -20, 0.5, -25
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x228B22 });
        var cableMesh = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cableMesh);
        objects.push(cableMesh);

        // Pencil Monument - Stone obelisk (box)
        var obeliskGeom = new THREE.BoxGeometry(2, 15, 1.5);
        var obeliskMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var obeliskMesh = new THREE.Mesh(obeliskGeom, obeliskMat);
        obeliskMesh.position.set(10, 7.5, -5);
        scene.add(obeliskMesh);
        objects.push(obeliskMesh);

        // Signal mast (cylinder)
        var mastGeom = new THREE.CylinderGeometry(0.4, 0.5, 10, 12);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var mastMesh = new THREE.Mesh(mastGeom, mastMat);
        mastMesh.position.set(12, 5, -5);
        scene.add(mastMesh);
        objects.push(mastMesh);

        // Generator building (box)
        var genGeom = new THREE.BoxGeometry(4, 3, 5);
        var genMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var genMesh = new THREE.Mesh(genGeom, genMat);
        genMesh.position.set(8, 1.5, 0);
        scene.add(genMesh);
        objects.push(genMesh);

        // Kelburn Castle - Medieval castle (box)
        var castleGeom = new THREE.BoxGeometry(12, 8, 12);
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var castleMesh = new THREE.Mesh(castleGeom, castleMat);
        castleMesh.position.set(25, 4, 10);
        scene.add(castleMesh);
        objects.push(castleMesh);

        // Castle courtyard wall (box)
        var wallGeom = new THREE.BoxGeometry(10, 4, 1);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var wallMesh = new THREE.Mesh(wallGeom, wallMat);
        wallMesh.position.set(25, 2, 16);
        scene.add(wallMesh);
        objects.push(wallMesh);

        // Castle turret (cone)
        var turretGeom = new THREE.ConeGeometry(2.5, 6, 8);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var turretMesh = new THREE.Mesh(turretGeom, turretMat);
        turretMesh.position.set(31, 7, 10);
        scene.add(turretMesh);
        objects.push(turretMesh);

        // Haylie Brae AA battery - Gun emplacement (box)
        var emplacementGeom = new THREE.BoxGeometry(8, 2, 8);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var emplacementMesh = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacementMesh.position.set(-5, 1, 15);
        scene.add(emplacementMesh);
        objects.push(emplacementMesh);

        // Twin barrel mount (cylinder)
        var barrelGeom = new THREE.CylinderGeometry(0.6, 0.7, 4, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var barrelMesh = new THREE.Mesh(barrelGeom, barrelMat);
        barrelMesh.position.set(-5, 3, 15);
        barrelMesh.rotation.z = Math.PI / 6;
        scene.add(barrelMesh);
        objects.push(barrelMesh);

        // Magazine storage (box)
        var magGeom = new THREE.BoxGeometry(4, 3, 6);
        var magMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var magMesh = new THREE.Mesh(magGeom, magMat);
        magMesh.position.set(-8, 1.5, 20);
        scene.add(magMesh);
        objects.push(magMesh);

        // Fairlie village checkpoint - Concrete barriers (boxes)
        var barrier1Geom = new THREE.BoxGeometry(3, 1.5, 0.5);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var barrier1 = new THREE.Mesh(barrier1Geom, barrierMat);
        barrier1.position.set(-25, 0.75, 5);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2 = new THREE.Mesh(barrier1Geom, barrierMat);
        barrier2.position.set(-15, 0.75, 5);
        scene.add(barrier2);
        objects.push(barrier2);

        // Guard tower (cylinder)
        var guardTowerGeom = new THREE.CylinderGeometry(1.5, 1.8, 7, 12);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x474747 });
        var guardTowerMesh = new THREE.Mesh(guardTowerGeom, guardMat);
        guardTowerMesh.position.set(-20, 3.5, 10);
        scene.add(guardTowerMesh);
        objects.push(guardTowerMesh);

        // Sandbag positions (box)
        var sandbagGeom = new THREE.BoxGeometry(2, 1, 3);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
        var sandbagMesh = new THREE.Mesh(sandbagGeom, sandbagMat);
        sandbagMesh.position.set(-18, 0.5, 12);
        scene.add(sandbagMesh);
        objects.push(sandbagMesh);

        // Douglas Park barracks - Victorian mansion (box)
        var mansionGeom = new THREE.BoxGeometry(10, 6, 8);
        var mansionMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var mansionMesh = new THREE.Mesh(mansionGeom, mansionMat);
        mansionMesh.position.set(5, 3, 25);
        scene.add(mansionMesh);
        objects.push(mansionMesh);

        // Vehicle compound (box)
        var compoundGeom = new THREE.BoxGeometry(9, 0.5, 10);
        var compoundMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var compoundMesh = new THREE.Mesh(compoundGeom, compoundMat);
        compoundMesh.position.set(12, 0.25, 30);
        scene.add(compoundMesh);
        objects.push(compoundMesh);

        // Water tower (cylinder)
        var towerGeom = new THREE.CylinderGeometry(2, 2.5, 12, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var towerMesh = new THREE.Mesh(towerGeom, towerMat);
        towerMesh.position.set(15, 6, 22);
        scene.add(towerMesh);
        objects.push(towerMesh);

        // Firth approach sensors - Sonar buoys (spheres)
        var sonarGeom = new THREE.SphereGeometry(1, 16, 16);
        var sonarMat = new THREE.MeshLambertMaterial({ color: 0x00CED1 });
        var sonar1 = new THREE.Mesh(sonarGeom, sonarMat);
        sonar1.position.set(-30, 2, 0);
        scene.add(sonar1);
        objects.push(sonar1);

        var sonar2 = new THREE.Mesh(sonarGeom, sonarMat);
        sonar2.position.set(30, 2, 5);
        scene.add(sonar2);
        objects.push(sonar2);

        // Cable net (LineSegments)
        var netGeom = new THREE.BufferGeometry();
        var netPositions = new Float32Array([
            -30, 2, 0, 30, 2, 5,
            -30, 2, 0, 0, 1, 2,
            30, 2, 5, 0, 1, 2,
            -30, 2, 0, 0, 3, 0,
            30, 2, 5, 0, 3, 0
        ]);
        netGeom.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        var netMesh = new THREE.LineSegments(netGeom, netMat);
        scene.add(netMesh);
        objects.push(netMesh);

        // Shore station (box)
        var stationGeom = new THREE.BoxGeometry(5, 2, 6);
        var stationMat = new THREE.MeshLambertMaterial({ color: 0xBCCCDC });
        var stationMesh = new THREE.Mesh(stationGeom, stationMat);
        stationMesh.position.set(0, 1, 8);
        scene.add(stationMesh);
        objects.push(stationMesh);

        // Kaim Hill summit relay - Stone shelter (box)
        var shelterGeom = new THREE.BoxGeometry(6, 4, 7);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
        var shelterMesh = new THREE.Mesh(shelterGeom, shelterMat);
        shelterMesh.position.set(20, 2, -20);
        scene.add(shelterMesh);
        objects.push(shelterMesh);

        // Relay mast (cylinder)
        var relayMastGeom = new THREE.CylinderGeometry(0.5, 0.6, 12, 12);
        var relayMastMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var relayMastMesh = new THREE.Mesh(relayMastGeom, relayMastMat);
        relayMastMesh.position.set(22, 6, -20);
        scene.add(relayMastMesh);
        objects.push(relayMastMesh);

        // Radome (sphere)
        var radomeGeom = new THREE.SphereGeometry(1.8, 16, 16);
        var radiusMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var radiusMesh = new THREE.Mesh(radomeGeom, radiusMat);
        radiusMesh.position.set(22, 13, -20);
        scene.add(radiusMesh);
        objects.push(radiusMesh);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation loop - optional movement
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.y < 0.5) {
                // keep ground objects stationary
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
