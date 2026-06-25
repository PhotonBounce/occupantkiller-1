window.DuskForge = (function() {
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
        buildForge();
    }

    function buildForge() {
        var furnaceColor = 0xff6600;
        var anvilColor = 0x2a2a2a;
        var bellowColor = 0x4a4a4a;
        var rackColor = 0x444444;
        var barrelColor = 0x3a3a2a;
        var smokeColor = 0xaaaaaa;

        // Main central furnace - large orange box
        var furnaceGeom = new THREE.BoxGeometry(8, 10, 8);
        var furnaceMat = new THREE.MeshLambertMaterial({ color: furnaceColor });
        var furnace = new THREE.Mesh(furnaceGeom, furnaceMat);
        furnace.position.set(0, 5, 0);
        furnace.castShadow = true;
        furnace.receiveShadow = true;
        scene.add(furnace);
        objects.push(furnace);

        // Left secondary furnace
        var furnace2Geom = new THREE.BoxGeometry(6, 8, 6);
        var furnace2Mat = new THREE.MeshLambertMaterial({ color: 0xff4400 });
        var furnace2 = new THREE.Mesh(furnace2Geom, furnace2Mat);
        furnace2.position.set(-20, 4, -15);
        furnace2.castShadow = true;
        furnace2.receiveShadow = true;
        scene.add(furnace2);
        objects.push(furnace2);

        // Right secondary furnace
        var furnace3Geom = new THREE.BoxGeometry(6, 8, 6);
        var furnace3Mat = new THREE.MeshLambertMaterial({ color: 0xff5500 });
        var furnace3 = new THREE.Mesh(furnace3Geom, furnace3Mat);
        furnace3.position.set(20, 4, -15);
        furnace3.castShadow = true;
        furnace3.receiveShadow = true;
        scene.add(furnace3);
        objects.push(furnace3);

        // Anvil station 1 - dark stump
        var anvilGeom = new THREE.BoxGeometry(5, 3, 5);
        var anvilMat = new THREE.MeshLambertMaterial({ color: anvilColor });
        var anvil1 = new THREE.Mesh(anvilGeom, anvilMat);
        anvil1.position.set(-15, 1.5, 10);
        anvil1.castShadow = true;
        anvil1.receiveShadow = true;
        scene.add(anvil1);
        objects.push(anvil1);

        // Anvil station 2
        var anvil2 = new THREE.Mesh(anvilGeom, anvilMat);
        anvil2.position.set(0, 1.5, 15);
        anvil2.castShadow = true;
        anvil2.receiveShadow = true;
        scene.add(anvil2);
        objects.push(anvil2);

        // Anvil station 3
        var anvil3 = new THREE.Mesh(anvilGeom, anvilMat);
        anvil3.position.set(15, 1.5, 10);
        anvil3.castShadow = true;
        anvil3.receiveShadow = true;
        scene.add(anvil3);
        objects.push(anvil3);

        // Bellows mechanism left - pair of boxes
        var bellowsGeom = new THREE.BoxGeometry(4, 6, 4);
        var bellowsMat = new THREE.MeshLambertMaterial({ color: bellowColor });
        var bellows1 = new THREE.Mesh(bellowsGeom, bellowsMat);
        bellows1.position.set(-25, 3, 5);
        bellows1.castShadow = true;
        bellows1.receiveShadow = true;
        scene.add(bellows1);
        objects.push(bellows1);

        // Bellows mechanism right pair
        var bellows2 = new THREE.Mesh(bellowsGeom, bellowsMat);
        bellows2.position.set(-25, 3, 12);
        bellows2.castShadow = true;
        bellows2.receiveShadow = true;
        scene.add(bellows2);
        objects.push(bellows2);

        // Weapon rack structure - tall box
        var rackGeom = new THREE.BoxGeometry(3, 10, 2);
        var rackMat = new THREE.MeshLambertMaterial({ color: rackColor });
        var rack1 = new THREE.Mesh(rackGeom, rackMat);
        rack1.position.set(25, 5, 0);
        rack1.castShadow = true;
        rack1.receiveShadow = true;
        scene.add(rack1);
        objects.push(rack1);

        // Second weapon rack
        var rack2 = new THREE.Mesh(rackGeom, rackMat);
        rack2.position.set(25, 5, 8);
        rack2.castShadow = true;
        rack2.receiveShadow = true;
        scene.add(rack2);
        objects.push(rack2);

        // Water quench barrel 1
        var barrelGeom = new THREE.CylinderGeometry(2.5, 2.5, 4, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: barrelColor });
        var barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel1.position.set(-10, 2, -20);
        barrel1.castShadow = true;
        barrel1.receiveShadow = true;
        scene.add(barrel1);
        objects.push(barrel1);

        // Water quench barrel 2
        var barrel2 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel2.position.set(10, 2, -20);
        barrel2.castShadow = true;
        barrel2.receiveShadow = true;
        scene.add(barrel2);
        objects.push(barrel2);

        // Smoke column 1 - tall thin box
        var smokeGeom = new THREE.BoxGeometry(3, 14, 3);
        var smokeMat = new THREE.MeshLambertMaterial({ color: smokeColor });
        var smoke1 = new THREE.Mesh(smokeGeom, smokeMat);
        smoke1.position.set(-5, 7, 0);
        smoke1.castShadow = true;
        smoke1.receiveShadow = true;
        scene.add(smoke1);
        objects.push(smoke1);

        // Smoke column 2
        var smoke2 = new THREE.Mesh(smokeGeom, smokeMat);
        smoke2.position.set(5, 7, 0);
        smoke2.castShadow = true;
        smoke2.receiveShadow = true;
        scene.add(smoke2);
        objects.push(smoke2);

        // Tool storage box
        var toolGeom = new THREE.BoxGeometry(6, 4, 4);
        var toolMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var toolBox = new THREE.Mesh(toolGeom, toolMat);
        toolBox.position.set(20, 2, 20);
        toolBox.castShadow = true;
        toolBox.receiveShadow = true;
        scene.add(toolBox);
        objects.push(toolBox);

        // Cone structure - smithy roof/hood
        var coneGeom = new THREE.ConeGeometry(6, 8, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var hood = new THREE.Mesh(coneGeom, coneMat);
        hood.position.set(0, 13, 0);
        hood.castShadow = true;
        hood.receiveShadow = true;
        scene.add(hood);
        objects.push(hood);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add point light at main furnace for glow
        var furnaceLight = new THREE.PointLight(0xff6600, 1.5, 40);
        furnaceLight.position.set(0, 8, 0);
        furnaceLight.castShadow = true;
        scene.add(furnaceLight);
        lights.push(furnaceLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            var now = Date.now() * 0.001;
            // Gentle rotation on bellows and racks
            if (objects.length > 7) {
                objects[7].rotation.z += delta * 0.5;
                objects[8].rotation.z -= delta * 0.5;
            }
            // Smoke columns bob up and down
            if (objects.length > 12) {
                objects[12].position.y = 7 + Math.sin(now) * 0.5;
                objects[13].position.y = 7 + Math.sin(now + 1) * 0.5;
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
