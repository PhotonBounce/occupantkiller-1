window.ArbroathBase = (function() {
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
        build();
    }

    function build() {
        var baseX = 280;
        var baseZ = 200;

        // Abbey ruins - 4 tall broken wall sections (sandstone 0xD2B48C)
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });

        var wallNorth = new THREE.Mesh(new THREE.BoxGeometry(60, 25, 4), wallMaterial);
        wallNorth.position.set(baseX, 12.5, baseZ - 40);
        wallNorth.castShadow = true;
        wallNorth.receiveShadow = true;
        scene.add(wallNorth);
        objects.push(wallNorth);

        var wallSouth = new THREE.Mesh(new THREE.BoxGeometry(60, 25, 4), wallMaterial);
        wallSouth.position.set(baseX, 12.5, baseZ + 40);
        wallSouth.castShadow = true;
        wallSouth.receiveShadow = true;
        scene.add(wallSouth);
        objects.push(wallSouth);

        var wallEast = new THREE.Mesh(new THREE.BoxGeometry(4, 25, 80), wallMaterial);
        wallEast.position.set(baseX + 40, 12.5, baseZ);
        wallEast.castShadow = true;
        wallEast.receiveShadow = true;
        scene.add(wallEast);
        objects.push(wallEast);

        var wallWest = new THREE.Mesh(new THREE.BoxGeometry(4, 25, 80), wallMaterial);
        wallWest.position.set(baseX - 40, 12.5, baseZ);
        wallWest.castShadow = true;
        wallWest.receiveShadow = true;
        scene.add(wallWest);
        objects.push(wallWest);

        // Abbey tower remains (CylinderGeometry, partial height, sandstone)
        var towerGeo = new THREE.CylinderGeometry(8, 10, 18, 16);
        var tower = new THREE.Mesh(towerGeo, wallMaterial);
        tower.position.set(baseX - 25, 9, baseZ - 30);
        tower.castShadow = true;
        tower.receiveShadow = true;
        scene.add(tower);
        objects.push(tower);

        // Modern FOB inside abbey courtyard (BoxGeometry HQ building, military green)
        var hqMaterial = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
        var hqBuilding = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 15), hqMaterial);
        hqBuilding.position.set(baseX + 5, 5, baseZ + 10);
        hqBuilding.castShadow = true;
        hqBuilding.receiveShadow = true;
        scene.add(hqBuilding);
        objects.push(hqBuilding);

        // Fishing harbour wall (long BoxGeometry pier, gray stone)
        var harborMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var pier = new THREE.Mesh(new THREE.BoxGeometry(80, 4, 6), harborMaterial);
        pier.position.set(baseX + 60, 2, baseZ + 50);
        pier.castShadow = true;
        pier.receiveShadow = true;
        scene.add(pier);
        objects.push(pier);

        // Mortar position in abbey nave (BoxGeometry mortar crew position)
        var mortarMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var mortarPos = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 8), mortarMaterial);
        mortarPos.position.set(baseX - 10, 1.5, baseZ - 5);
        mortarPos.castShadow = true;
        mortarPos.receiveShadow = true;
        scene.add(mortarPos);
        objects.push(mortarPos);

        // Stone archway gate - 2 pillars + arch lintel
        var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });

        var pillarLeft = new THREE.Mesh(new THREE.BoxGeometry(3, 20, 3), pillarMaterial);
        pillarLeft.position.set(baseX - 20, 10, baseZ + 25);
        pillarLeft.castShadow = true;
        pillarLeft.receiveShadow = true;
        scene.add(pillarLeft);
        objects.push(pillarLeft);

        var pillarRight = new THREE.Mesh(new THREE.BoxGeometry(3, 20, 3), pillarMaterial);
        pillarRight.position.set(baseX + 20, 10, baseZ + 25);
        pillarRight.castShadow = true;
        pillarRight.receiveShadow = true;
        scene.add(pillarRight);
        objects.push(pillarRight);

        var lintel = new THREE.Mesh(new THREE.BoxGeometry(42, 3, 3), pillarMaterial);
        lintel.position.set(baseX, 19.5, baseZ + 25);
        lintel.castShadow = true;
        lintel.receiveShadow = true;
        scene.add(lintel);
        objects.push(lintel);

        // Communications mast (CylinderGeometry pole + SphereGeometry antenna)
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mastGeo = new THREE.CylinderGeometry(0.5, 0.5, 35, 8);
        var mast = new THREE.Mesh(mastGeo, mastMaterial);
        mast.position.set(baseX - 50, 17.5, baseZ - 45);
        mast.castShadow = true;
        mast.receiveShadow = true;
        scene.add(mast);
        objects.push(mast);

        var antennaMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
        var antennaGeo = new THREE.SphereGeometry(1.2, 8, 8);
        var antenna = new THREE.Mesh(antennaGeo, antennaMaterial);
        antenna.position.set(baseX - 50, 36, baseZ - 45);
        antenna.castShadow = true;
        antenna.receiveShadow = true;
        scene.add(antenna);
        objects.push(antenna);

        // Supply crates around abbey perimeter (6 small BoxGeometry crates)
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        var crate1 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMaterial);
        crate1.position.set(baseX - 35, 2, baseZ - 50);
        crate1.castShadow = true;
        crate1.receiveShadow = true;
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMaterial);
        crate2.position.set(baseX + 35, 2, baseZ - 50);
        crate2.castShadow = true;
        crate2.receiveShadow = true;
        scene.add(crate2);
        objects.push(crate2);

        var crate3 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMaterial);
        crate3.position.set(baseX - 50, 2, baseZ + 20);
        crate3.castShadow = true;
        crate3.receiveShadow = true;
        scene.add(crate3);
        objects.push(crate3);

        var crate4 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMaterial);
        crate4.position.set(baseX + 50, 2, baseZ + 20);
        crate4.castShadow = true;
        crate4.receiveShadow = true;
        scene.add(crate4);
        objects.push(crate4);

        var crate5 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMaterial);
        crate5.position.set(baseX, 2, baseZ + 60);
        crate5.castShadow = true;
        crate5.receiveShadow = true;
        scene.add(crate5);
        objects.push(crate5);

        var crate6 = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 4), crateMaterial);
        crate6.position.set(baseX - 15, 2, baseZ - 60);
        crate6.castShadow = true;
        crate6.receiveShadow = true;
        scene.add(crate6);
        objects.push(crate6);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(baseX + 50, 30, baseZ - 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.far = 200;
        dirLight.shadow.camera.left = -150;
        dirLight.shadow.camera.right = 150;
        dirLight.shadow.camera.top = 150;
        dirLight.shadow.camera.bottom = -150;
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation logic here if needed
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
