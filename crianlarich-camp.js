window.CrianlarichCamp = (function() {
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
        // Railway Control Box - stone station
        var stationGeo = new THREE.BoxGeometry(8, 6, 6);
        var stationMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var stationMesh = new THREE.Mesh(stationGeo, stationMat);
        stationMesh.position.set(-20, 3, -15);
        scene.add(stationMesh);
        objects.push(stationMesh);

        // Signal Box - stone structure
        var signalBoxGeo = new THREE.BoxGeometry(5, 8, 4);
        var signalBoxMat = new THREE.MeshLambertMaterial({ color: 0x7A6347 });
        var signalBoxMesh = new THREE.Mesh(signalBoxGeo, signalBoxMat);
        signalBoxMesh.position.set(-18, 4, 5);
        scene.add(signalBoxMesh);
        objects.push(signalBoxMesh);

        // Water Tank - cylinder
        var tankGeo = new THREE.CylinderGeometry(4, 4, 10, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var tankMesh = new THREE.Mesh(tankGeo, tankMat);
        tankMesh.position.set(-8, 5, -8);
        scene.add(tankMesh);
        objects.push(tankMesh);

        // River Fillan Bridge - stone structure
        var bridgeGeo = new THREE.BoxGeometry(12, 3, 2);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x6B5344 });
        var bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridgeMesh.position.set(10, 8, -12);
        scene.add(bridgeMesh);
        objects.push(bridgeMesh);

        // Explosive Charges - spheres on bridge
        var charge1Geo = new THREE.SphereGeometry(1.5, 12, 12);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var charge1Mesh = new THREE.Mesh(charge1Geo, chargeMat);
        charge1Mesh.position.set(5, 9, -12);
        scene.add(charge1Mesh);
        objects.push(charge1Mesh);

        var charge2Mesh = new THREE.Mesh(charge1Geo, chargeMat);
        charge2Mesh.position.set(15, 9, -12);
        scene.add(charge2Mesh);
        objects.push(charge2Mesh);

        // Detonator Wire - LineSegments
        var wireGeo = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            5, 10.5, -12,
            0, 2, -5,
            15, 10.5, -12,
            20, 2, -8
        ]);
        wireGeo.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var wireMesh = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wireMesh);
        objects.push(wireMesh);

        // Shelter - box structure
        var shelterGeo = new THREE.BoxGeometry(6, 4, 5);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x3D5C3D });
        var shelterMesh = new THREE.Mesh(shelterGeo, shelterMat);
        shelterMesh.position.set(22, 2, -8);
        scene.add(shelterMesh);
        objects.push(shelterMesh);

        // Ben More Tower - stone box
        var towerGeo = new THREE.BoxGeometry(4, 12, 4);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var towerMesh = new THREE.Mesh(towerGeo, towerMat);
        towerMesh.position.set(-5, 6, 15);
        scene.add(towerMesh);
        objects.push(towerMesh);

        // Signal Mast - cylinder
        var mastGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 12);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var mastMesh = new THREE.Mesh(mastGeo, mastMat);
        mastMesh.position.set(-5, 10, 15);
        scene.add(mastMesh);
        objects.push(mastMesh);

        // Weather Dome - sphere
        var domeGeo = new THREE.SphereGeometry(2.5, 16, 16);
        var domeMat = new THREE.MeshLambertMaterial({ color: 0xB0C4DE });
        var domeMesh = new THREE.Mesh(domeGeo, domeMat);
        domeMesh.position.set(-5, 13, 15);
        scene.add(domeMesh);
        objects.push(domeMesh);

        // Stob Binnein Rocky Ledge - elevated box
        var ledgeGeo = new THREE.BoxGeometry(10, 3, 8);
        var ledgeMat = new THREE.MeshLambertMaterial({ color: 0x8B7765 });
        var ledgeMesh = new THREE.Mesh(ledgeGeo, ledgeMat);
        ledgeMesh.position.set(15, 11, 18);
        scene.add(ledgeMesh);
        objects.push(ledgeMesh);

        // Camouflage Frame - cone
        var camoGeo = new THREE.ConeGeometry(3, 5, 12);
        var camoMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var camoMesh = new THREE.Mesh(camoGeo, camoMat);
        camoMesh.position.set(15, 14, 18);
        scene.add(camoMesh);
        objects.push(camoMesh);

        // Ranging Wire - LineSegments
        var rangeGeo = new THREE.BufferGeometry();
        var rangePositions = new Float32Array([
            15, 15, 18,
            5, 5, 0,
            15, 15, 18,
            25, 8, 25
        ]);
        rangeGeo.setAttribute('position', new THREE.BufferAttribute(rangePositions, 3));
        var rangeMat = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        var rangeMesh = new THREE.LineSegments(rangeGeo, rangeMat);
        scene.add(rangeMesh);
        objects.push(rangeMesh);

        // Auchtertyre Farm Courtyard - box
        var courtGeo = new THREE.BoxGeometry(14, 2, 12);
        var courtMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var courtMesh = new THREE.Mesh(courtGeo, courtMat);
        courtMesh.position.set(5, 1, 25);
        scene.add(courtMesh);
        objects.push(courtMesh);

        // Vehicle Shelter - box
        var vehicleGeo = new THREE.BoxGeometry(8, 5, 6);
        var vehicleMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var vehicleMesh = new THREE.Mesh(vehicleGeo, vehicleMat);
        vehicleMesh.position.set(12, 2.5, 28);
        scene.add(vehicleMesh);
        objects.push(vehicleMesh);

        // Diesel Tank - cylinder
        var dieselGeo = new THREE.CylinderGeometry(3, 3, 7, 16);
        var dieselMat = new THREE.MeshLambertMaterial({ color: 0x2C3E50 });
        var dieselMesh = new THREE.Mesh(dieselGeo, dieselMat);
        dieselMesh.position.set(-2, 3.5, 30);
        scene.add(dieselMesh);
        objects.push(dieselMesh);

        // Loch Iubhair Clifftop OP - box
        var cliffOpGeo = new THREE.BoxGeometry(7, 4, 5);
        var cliffOpMat = new THREE.MeshLambertMaterial({ color: 0x544E4E });
        var cliffOpMesh = new THREE.Mesh(cliffOpGeo, cliffOpMat);
        cliffOpMesh.position.set(-25, 6, 8);
        scene.add(cliffOpMesh);
        objects.push(cliffOpMesh);

        // Buoys - spheres
        var buoyGeo = new THREE.SphereGeometry(1.2, 12, 12);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoy1Mesh = new THREE.Mesh(buoyGeo, buoyMat);
        buoy1Mesh.position.set(-30, 1, 12);
        scene.add(buoy1Mesh);
        objects.push(buoy1Mesh);

        var buoy2Mesh = new THREE.Mesh(buoyGeo, buoyMat);
        buoy2Mesh.position.set(-20, 1, 18);
        scene.add(buoy2Mesh);
        objects.push(buoy2Mesh);

        // Detection Cables - LineSegments
        var cableGeo = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -30, 2, 12,
            -25, 6.5, 8,
            -20, 2, 18,
            -25, 6.5, 8
        ]);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x1E90FF });
        var cableMesh = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cableMesh);
        objects.push(cableMesh);

        // Glen Dochart Road Cutting - box
        var roadGeo = new THREE.BoxGeometry(16, 2, 4);
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var roadMesh = new THREE.Mesh(roadGeo, roadMat);
        roadMesh.position.set(-10, 0.5, -25);
        scene.add(roadMesh);
        objects.push(roadMesh);

        // Vehicle Wreck - box
        var wreckGeo = new THREE.BoxGeometry(5, 3, 3);
        var wreckMat = new THREE.MeshLambertMaterial({ color: 0x4C4C4C });
        var wreckMesh = new THREE.Mesh(wreckGeo, wreckMat);
        wreckMesh.position.set(0, 1.5, -28);
        scene.add(wreckMesh);
        objects.push(wreckMesh);

        // IED Charges - spheres along verge
        var iedGeo = new THREE.SphereGeometry(1.2, 12, 12);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        var ied1Mesh = new THREE.Mesh(iedGeo, iedMat);
        ied1Mesh.position.set(-18, 0.8, -22);
        scene.add(ied1Mesh);
        objects.push(ied1Mesh);

        var ied2Mesh = new THREE.Mesh(iedGeo, iedMat);
        ied2Mesh.position.set(-5, 0.8, -26);
        scene.add(ied2Mesh);
        objects.push(ied2Mesh);

        var ied3Mesh = new THREE.Mesh(iedGeo, iedMat);
        ied3Mesh.position.set(8, 0.8, -24);
        scene.add(ied3Mesh);
        objects.push(ied3Mesh);

        // Lights
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 0.6);
        light1.position.set(20, 25, 20);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xFFFFFF, 0.4);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animation logic here if needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
