window.OrchyBase = (function() {
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
        var riverColor = 0x4A90E2;
        var stoneColor = 0x808080;
        var woodColor = 0x8B4513;
        var metalColor = 0x606060;
        var redColor = 0xFF0000;
        var tan = 0xD2B48C;

        // River terrain (valley bottom) - long box
        var terrainGeo = new THREE.BoxGeometry(80, 2, 60);
        var terrainMat = new THREE.MeshLambertMaterial({ color: riverColor });
        var terrain = new THREE.Mesh(terrainGeo, terrainMat);
        terrain.position.set(0, -5, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Valley walls - left side
        var wallLeftGeo = new THREE.BoxGeometry(10, 20, 60);
        var wallMat = new THREE.MeshLambertMaterial({ color: stoneColor });
        var wallLeft = new THREE.Mesh(wallLeftGeo, wallMat);
        wallLeft.position.set(-45, 0, 0);
        scene.add(wallLeft);
        objects.push(wallLeft);

        // Valley walls - right side
        var wallRightGeo = new THREE.BoxGeometry(10, 20, 60);
        var wallRight = new THREE.Mesh(wallRightGeo, wallMat);
        wallRight.position.set(45, 0, 0);
        scene.add(wallRight);
        objects.push(wallRight);

        // Bridge of Orchy - box structure (deck)
        var bridgeDeckGeo = new THREE.BoxGeometry(12, 1, 20);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: woodColor });
        var bridgeDeck = new THREE.Mesh(bridgeDeckGeo, bridgeMat);
        bridgeDeck.position.set(0, 0, -15);
        scene.add(bridgeDeck);
        objects.push(bridgeDeck);

        // Bridge support left - cylinder arch
        var bridgeSupLGeo = new THREE.CylinderGeometry(3, 3, 8, 16);
        var metalMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var bridgeSupL = new THREE.Mesh(bridgeSupLGeo, metalMat);
        bridgeSupL.position.set(-6, -3, -15);
        scene.add(bridgeSupL);
        objects.push(bridgeSupL);

        // Bridge support right - cylinder arch
        var bridgeSupRGeo = new THREE.CylinderGeometry(3, 3, 8, 16);
        var bridgeSupR = new THREE.Mesh(bridgeSupRGeo, metalMat);
        bridgeSupR.position.set(6, -3, -15);
        scene.add(bridgeSupR);
        objects.push(bridgeSupR);

        // Forward operating base perimeter wall
        var perimWallGeo = new THREE.BoxGeometry(60, 3, 1);
        var perimMat = new THREE.MeshLambertMaterial({ color: stoneColor });
        var perimWallN = new THREE.Mesh(perimWallGeo, perimMat);
        perimWallN.position.set(0, 1.5, -25);
        scene.add(perimWallN);
        objects.push(perimWallN);

        var perimWallS = new THREE.Mesh(perimWallGeo, perimMat);
        perimWallS.position.set(0, 1.5, 25);
        scene.add(perimWallS);
        objects.push(perimWallS);

        // Barracks building 1 (box)
        var barrack1Geo = new THREE.BoxGeometry(15, 6, 12);
        var barrMat = new THREE.MeshLambertMaterial({ color: tan });
        var barrack1 = new THREE.Mesh(barrack1Geo, barrMat);
        barrack1.position.set(-15, 3, 5);
        scene.add(barrack1);
        objects.push(barrack1);

        // Barracks building 2 (box)
        var barrack2Geo = new THREE.BoxGeometry(15, 6, 12);
        var barrack2 = new THREE.Mesh(barrack2Geo, barrMat);
        barrack2.position.set(-15, 3, -5);
        scene.add(barrack2);
        objects.push(barrack2);

        // Mortar line tube 1 (cylinder)
        var mortarTube1Geo = new THREE.CylinderGeometry(1, 1.2, 8, 12);
        var mortarMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var mortarTube1 = new THREE.Mesh(mortarTube1Geo, mortarMat);
        mortarTube1.position.set(-5, 4, 15);
        scene.add(mortarTube1);
        objects.push(mortarTube1);

        // Mortar line tube 2 (cylinder)
        var mortarTube2Geo = new THREE.CylinderGeometry(1, 1.2, 8, 12);
        var mortarTube2 = new THREE.Mesh(mortarTube2Geo, mortarMat);
        mortarTube2.position.set(5, 4, 15);
        scene.add(mortarTube2);
        objects.push(mortarTube2);

        // Mortar bipod stand 1 (box)
        var bipod1Geo = new THREE.BoxGeometry(8, 2, 6);
        var bipodMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var bipod1 = new THREE.Mesh(bipod1Geo, bipodMat);
        bipod1.position.set(-5, 0.5, 15);
        scene.add(bipod1);
        objects.push(bipod1);

        // Mortar bipod stand 2 (box)
        var bipod2Geo = new THREE.BoxGeometry(8, 2, 6);
        var bipod2 = new THREE.Mesh(bipod2Geo, bipodMat);
        bipod2.position.set(5, 0.5, 15);
        scene.add(bipod2);
        objects.push(bipod2);

        // Vehicle park APC 1 (box)
        var apc1Geo = new THREE.BoxGeometry(8, 5, 14);
        var apcMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var apc1 = new THREE.Mesh(apc1Geo, apcMat);
        apc1.position.set(15, 2.5, -15);
        scene.add(apc1);
        objects.push(apc1);

        // Vehicle park APC 2 (box)
        var apc2Geo = new THREE.BoxGeometry(8, 5, 14);
        var apc2 = new THREE.Mesh(apc2Geo, apcMat);
        apc2.position.set(25, 2.5, -15);
        scene.add(apc2);
        objects.push(apc2);

        // Vehicle park APC 3 (box)
        var apc3Geo = new THREE.BoxGeometry(8, 5, 14);
        var apc3 = new THREE.Mesh(apc3Geo, apcMat);
        apc3.position.set(35, 2.5, -15);
        scene.add(apc3);
        objects.push(apc3);

        // Command post bunker (box, half-buried effect)
        var bunkerGeo = new THREE.BoxGeometry(20, 4, 16);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x4B4B4B });
        var bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunker.position.set(-25, 1, -10);
        scene.add(bunker);
        objects.push(bunker);

        // Command post ventilation (cylinder)
        var ventGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 12);
        var ventMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.set(-18, 4, -10);
        scene.add(vent);
        objects.push(vent);

        // Satellite dish pedestal (box)
        var satPedestalGeo = new THREE.BoxGeometry(5, 8, 5);
        var satMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var satPedestal = new THREE.Mesh(satPedestalGeo, satMat);
        satPedestal.position.set(30, 4, 10);
        scene.add(satPedestal);
        objects.push(satPedestal);

        // Satellite dish support (cylinder)
        var dishSuppGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 12);
        var dishSupp = new THREE.Mesh(dishSuppGeo, ventMat);
        dishSupp.position.set(30, 10, 10);
        scene.add(dishSupp);
        objects.push(dishSupp);

        // Medical triage tent (box)
        var tentGeo = new THREE.BoxGeometry(18, 5, 12);
        var tentMat = new THREE.MeshLambertMaterial({ color: 0xFFF8DC });
        var tent = new THREE.Mesh(tentGeo, tentMat);
        tent.position.set(10, 2.5, 20);
        scene.add(tent);
        objects.push(tent);

        // Red medical cross marker (sphere)
        var crossSphereGeo = new THREE.SphereGeometry(2, 16, 16);
        var crossMat = new THREE.MeshLambertMaterial({ color: redColor });
        var crossSphere = new THREE.Mesh(crossSphereGeo, crossMat);
        crossSphere.position.set(10, 8, 20);
        scene.add(crossSphere);
        objects.push(crossSphere);

        // Oxygen tank 1 (cylinder)
        var oxygen1Geo = new THREE.CylinderGeometry(0.8, 0.8, 5, 12);
        var oxygenMat = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
        var oxygen1 = new THREE.Mesh(oxygen1Geo, oxygenMat);
        oxygen1.position.set(2, 2.5, 25);
        scene.add(oxygen1);
        objects.push(oxygen1);

        // Oxygen tank 2 (cylinder)
        var oxygen2Geo = new THREE.CylinderGeometry(0.8, 0.8, 5, 12);
        var oxygen2 = new THREE.Mesh(oxygen2Geo, oxygenMat);
        oxygen2.position.set(8, 2.5, 25);
        scene.add(oxygen2);
        objects.push(oxygen2);

        // Oxygen tank 3 (cylinder)
        var oxygen3Geo = new THREE.CylinderGeometry(0.8, 0.8, 5, 12);
        var oxygen3 = new THREE.Mesh(oxygen3Geo, oxygenMat);
        oxygen3.position.set(14, 2.5, 25);
        scene.add(oxygen3);
        objects.push(oxygen3);

        // Cone observation post (for visual interest)
        var obsPostGeo = new THREE.ConeGeometry(2, 6, 12);
        var obsMat = new THREE.MeshLambertMaterial({ color: stoneColor });
        var obsPost = new THREE.Mesh(obsPostGeo, obsMat);
        obsPost.position.set(-30, 3, 20);
        scene.add(obsPost);
        objects.push(obsPost);

        // Add lights
        var ambLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(40, 30, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Rotate some objects for animation
        for (var i = 0; i < objects.length; i++) {
            if (i % 7 === 0) {
                objects[i].rotation.y += 0.3 * delta;
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
