window.InverarayKeep = (function() {
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
        // Inveraray Castle Command HQ - Main box keep
        var keepGeo = new THREE.BoxGeometry(20, 25, 18);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var keepMesh = new THREE.Mesh(keepGeo, keepMat);
        keepMesh.position.set(0, 12, 0);
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Flanking tower left
        var towerLeftGeo = new THREE.BoxGeometry(10, 22, 10);
        var towerLeftMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var towerLeftMesh = new THREE.Mesh(towerLeftGeo, towerLeftMat);
        towerLeftMesh.position.set(-18, 11, -12);
        scene.add(towerLeftMesh);
        objects.push(towerLeftMesh);

        // Flanking tower right
        var towerRightGeo = new THREE.BoxGeometry(10, 22, 10);
        var towerRightMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var towerRightMesh = new THREE.Mesh(towerRightGeo, towerRightMat);
        towerRightMesh.position.set(18, 11, -12);
        scene.add(towerRightMesh);
        objects.push(towerRightMesh);

        // Round corner tower - cylinder
        var cornerTowerGeo = new THREE.CylinderGeometry(7, 7, 24, 16);
        var cornerTowerMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        var cornerTowerMesh = new THREE.Mesh(cornerTowerGeo, cornerTowerMat);
        cornerTowerMesh.position.set(-15, 12, 14);
        scene.add(cornerTowerMesh);
        objects.push(cornerTowerMesh);

        // Inveraray Jail garrison - Main prison box
        var prisonGeo = new THREE.BoxGeometry(18, 16, 16);
        var prisonMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var prisonMesh = new THREE.Mesh(prisonGeo, prisonMat);
        prisonMesh.position.set(25, 8, -20);
        scene.add(prisonMesh);
        objects.push(prisonMesh);

        // Prison courtyard box
        var courtyardGeo = new THREE.BoxGeometry(14, 2, 14);
        var courtyardMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var courtyardMesh = new THREE.Mesh(courtyardGeo, courtyardMat);
        courtyardMesh.position.set(25, 1, -20);
        scene.add(courtyardMesh);
        objects.push(courtyardMesh);

        // Prison watchtower - cylinder
        var watchGeo = new THREE.CylinderGeometry(6, 6, 18, 16);
        var watchMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var watchMesh = new THREE.Mesh(watchGeo, watchMat);
        watchMesh.position.set(35, 9, -12);
        scene.add(watchMesh);
        objects.push(watchMesh);

        // Loch Fyne naval patrol - patrol boat box
        var boatGeo = new THREE.BoxGeometry(12, 5, 8);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x1a3a5a });
        var boatMesh = new THREE.Mesh(boatGeo, boatMat);
        boatMesh.position.set(-30, 3, 25);
        scene.add(boatMesh);
        objects.push(boatMesh);

        // Sonar buoy - sphere
        var buoyGeo = new THREE.SphereGeometry(4, 16, 16);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0x00aa00 });
        var buoyMesh = new THREE.Mesh(buoyGeo, buoyMat);
        buoyMesh.position.set(-28, 5, 32);
        scene.add(buoyMesh);
        objects.push(buoyMesh);

        // Net barrier - LineSegments
        var netGeo = new THREE.BufferGeometry();
        var netVertices = new Float32Array([
            -35, 2, 20,  -25, 2, 20,
            -35, 8, 20,  -25, 8, 20,
            -35, 2, 20,  -35, 8, 20,
            -25, 2, 20,  -25, 8, 20
        ]);
        netGeo.setAttribute('position', new THREE.BufferAttribute(netVertices, 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        var netMesh = new THREE.LineSegments(netGeo, netMat);
        scene.add(netMesh);
        objects.push(netMesh);

        // Aray Bridge demolition - stone bridge box
        var bridgeGeo = new THREE.BoxGeometry(16, 4, 24);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridgeMesh.position.set(-25, 2, -30);
        scene.add(bridgeMesh);
        objects.push(bridgeMesh);

        // Explosive charges - sphere
        var explosiveGeo = new THREE.SphereGeometry(3, 16, 16);
        var explosiveMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var explosiveMesh = new THREE.Mesh(explosiveGeo, explosiveMat);
        explosiveMesh.position.set(-25, 7, -25);
        scene.add(explosiveMesh);
        objects.push(explosiveMesh);

        // Detonator wire - LineSegments
        var detGeo = new THREE.BufferGeometry();
        var detVertices = new Float32Array([
            -28, 7, -30,  -22, 7, -30,
            -25, 7, -28,  -25, 7, -32
        ]);
        detGeo.setAttribute('position', new THREE.BufferAttribute(detVertices, 3));
        var detMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var detMesh = new THREE.LineSegments(detGeo, detMat);
        scene.add(detMesh);
        objects.push(detMesh);

        // Dun na Cuaiche summit relay - signal post box
        var signalGeo = new THREE.BoxGeometry(8, 12, 8);
        var signalMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var signalMesh = new THREE.Mesh(signalGeo, signalMat);
        signalMesh.position.set(25, 6, 20);
        scene.add(signalMesh);
        objects.push(signalMesh);

        // Signal mast - cylinder
        var mastGeo = new THREE.CylinderGeometry(2, 2, 16, 12);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var mastMesh = new THREE.Mesh(mastGeo, mastMat);
        mastMesh.position.set(25, 16, 20);
        scene.add(mastMesh);
        objects.push(mastMesh);

        // Radome - sphere
        var radomeGeo = new THREE.SphereGeometry(3, 16, 16);
        var radiomeMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var radiomeMesh = new THREE.Mesh(radomeGeo, radiomeMat);
        radiomeMesh.position.set(25, 25, 20);
        scene.add(radiomeMesh);
        objects.push(radiomeMesh);

        // Duke's Garden barracks - walled garden perimeter box
        var gardenGeo = new THREE.BoxGeometry(20, 3, 20);
        var gardenMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var gardenMesh = new THREE.Mesh(gardenGeo, gardenMat);
        gardenMesh.position.set(-20, 1.5, 5);
        scene.add(gardenMesh);
        objects.push(gardenMesh);

        // Stable block
        var stableGeo = new THREE.BoxGeometry(12, 8, 10);
        var stableMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var stableMesh = new THREE.Mesh(stableGeo, stableMat);
        stableMesh.position.set(-20, 4, 10);
        scene.add(stableMesh);
        objects.push(stableMesh);

        // Water tank - cylinder
        var tankGeo = new THREE.CylinderGeometry(5, 5, 10, 12);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x2a5a7a });
        var tankMesh = new THREE.Mesh(tankGeo, tankMat);
        tankMesh.position.set(-10, 5, 8);
        scene.add(tankMesh);
        objects.push(tankMesh);

        // Glen Aray ambush - highland glen track box
        var trackGeo = new THREE.BoxGeometry(14, 2, 30);
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var trackMesh = new THREE.Mesh(trackGeo, trackMat);
        trackMesh.position.set(10, 0.5, -5);
        scene.add(trackMesh);
        objects.push(trackMesh);

        // IED charges - sphere
        var iedGeo = new THREE.SphereGeometry(2.5, 16, 16);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
        var iedMesh = new THREE.Mesh(iedGeo, iedMat);
        iedMesh.position.set(10, 2, -8);
        scene.add(iedMesh);
        objects.push(iedMesh);

        // Tripwire - LineSegments
        var wireGeo = new THREE.BufferGeometry();
        var wireVertices = new Float32Array([
            5, 1, -8,  15, 1, -8,
            10, 0.5, -12,  10, 1.5, -12
        ]);
        wireGeo.setAttribute('position', new THREE.BufferAttribute(wireVertices, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
        var wireMesh = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wireMesh);
        objects.push(wireMesh);

        // Inveraray Bell Tower command - tower base box
        var beltowerGeo = new THREE.BoxGeometry(14, 20, 14);
        var beltowerMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var beltowerMesh = new THREE.Mesh(beltowerGeo, beltowerMat);
        beltowerMesh.position.set(-8, 10, -15);
        scene.add(beltowerMesh);
        objects.push(beltowerMesh);

        // Bell chamber - cylinder
        var bellGeo = new THREE.CylinderGeometry(8, 8, 12, 16);
        var bellMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        var bellMesh = new THREE.Mesh(bellGeo, bellMat);
        bellMesh.position.set(-8, 22, -15);
        scene.add(bellMesh);
        objects.push(bellMesh);

        // Spire - cone
        var spireGeo = new THREE.ConeGeometry(6, 14, 16);
        var spireMat = new THREE.MeshLambertMaterial({ color: 0xccaa00 });
        var spireMesh = new THREE.Mesh(spireGeo, spireMat);
        spireMesh.position.set(-8, 33, -15);
        scene.add(spireMesh);
        objects.push(spireMesh);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.0005 * delta;
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
