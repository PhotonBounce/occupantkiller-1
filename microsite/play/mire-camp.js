window.MireCamp = (function() {
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
        // Ground mire
        var mireMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a1a });
        var mireGeom = new THREE.BoxGeometry(120, 2, 120);
        var mireMesh = new THREE.Mesh(mireGeom, mireMaterial);
        mireMesh.position.y = -1;
        scene.add(mireMesh);
        objects.push(mireMesh);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0x555555);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0x888888, 0.6);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);

        // Half-submerged military vehicles (boxes)
        var vehicle1 = createHalfSunkenVehicle(0x2a5a2a, -25, 3, -20);
        var vehicle2 = createHalfSunkenVehicle(0x3a6a3a, 15, 3, 10);
        var vehicle3 = createHalfSunkenVehicle(0x2a4a2a, -10, 3, 25);

        // Elevated wooden platforms on stilts
        var platform1 = createElevatedPlatform(-30, 8, -15);
        var platform2 = createElevatedPlatform(25, 8, 20);
        var platform3 = createElevatedPlatform(-5, 8, -28);

        // Supply caches on stilts
        var cache1 = createSupplyCache(10, 7, -25);
        var cache2 = createSupplyCache(-20, 7, 15);

        // Camouflage netting frames (LineSegments)
        var net1 = createNetFrame(-15, 6, 5);
        var net2 = createNetFrame(20, 6, -10);

        // Mud trenches
        var trench1 = createTrench(-30, 1, 10);
        var trench2 = createTrench(28, 1, -20);
        var trench3 = createTrench(5, 1, 30);

        // Fuel drums
        var drum1 = createFuelDrum(0x4a3a1a, -8, 2, 8);
        var drum2 = createFuelDrum(0x5a4a2a, 12, 2, -15);
        var drum3 = createFuelDrum(0x4a3a1a, -25, 2, 5);

        // Guard tower structure
        var tower = createGuardTower(32, 12, -25);

        // Sandbag wall
        var wall = createSandbagWall(-28, 2, 28);

        // Water pool in mire
        var pool = createWaterPool(8, 0.5, -5);
    }

    function createHalfSunkenVehicle(color, x, y, z) {
        var vehicleGeom = new THREE.BoxGeometry(8, 6, 14);
        var vehicleMat = new THREE.MeshLambertMaterial({ color: color });
        var vehicleMesh = new THREE.Mesh(vehicleGeom, vehicleMat);
        vehicleMesh.position.set(x, y, z);
        scene.add(vehicleMesh);
        objects.push(vehicleMesh);
        return vehicleMesh;
    }

    function createElevatedPlatform(x, y, z) {
        // Wood deck
        var deckGeom = new THREE.BoxGeometry(12, 1, 12);
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x6a5a3a });
        var deckMesh = new THREE.Mesh(deckGeom, deckMat);
        deckMesh.position.set(x, y, z);
        scene.add(deckMesh);
        objects.push(deckMesh);

        // Stilts
        var stiltGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
        var stiltMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
        for (var i = 0; i < 4; i++) {
            var stiltMesh = new THREE.Mesh(stiltGeom, stiltMat);
            var offsetX = (i % 2 === 0) ? -4 : 4;
            var offsetZ = (i < 2) ? -4 : 4;
            stiltMesh.position.set(x + offsetX, y - 4, z + offsetZ);
            scene.add(stiltMesh);
            objects.push(stiltMesh);
        }
        return deckMesh;
    }

    function createSupplyCache(x, y, z) {
        // Main crate
        var crateGeom = new THREE.BoxGeometry(6, 5, 6);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x7a6a4a });
        var crateMesh = new THREE.Mesh(crateGeom, crateMat);
        crateMesh.position.set(x, y, z);
        scene.add(crateMesh);
        objects.push(crateMesh);

        // Support stilt
        var stiltGeom = new THREE.CylinderGeometry(0.4, 0.4, 7, 6);
        var stiltMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
        var stiltMesh = new THREE.Mesh(stiltGeom, stiltMat);
        stiltMesh.position.set(x, y - 3.5, z);
        scene.add(stiltMesh);
        objects.push(stiltMesh);

        return crateMesh;
    }

    function createNetFrame(x, y, z) {
        var geometry = new THREE.BufferGeometry();
        var vertices = [
            -5, 0, -5,
            5, 0, -5,
            5, 0, 5,
            -5, 0, 5,
            -5, 0, -5,
            0, 4, 0,
            5, 0, -5,
            0, 4, 0,
            5, 0, 5,
            0, 4, 0,
            -5, 0, 5,
            0, 4, 0
        ];
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        var lineMat = new THREE.LineBasicMaterial({ color: 0x4a6a3a });
        var netMesh = new THREE.LineSegments(geometry, lineMat);
        netMesh.position.set(x, y, z);
        scene.add(netMesh);
        objects.push(netMesh);
        return netMesh;
    }

    function createTrench(x, y, z) {
        var trenchGeom = new THREE.BoxGeometry(3, 1.5, 20);
        var trenchMat = new THREE.MeshLambertMaterial({ color: 0x0a1a0a });
        var trenchMesh = new THREE.Mesh(trenchGeom, trenchMat);
        trenchMesh.position.set(x, y, z);
        scene.add(trenchMesh);
        objects.push(trenchMesh);
        return trenchMesh;
    }

    function createFuelDrum(color, x, y, z) {
        var drumGeom = new THREE.CylinderGeometry(1.2, 1.2, 3, 8);
        var drumMat = new THREE.MeshLambertMaterial({ color: color });
        var drumMesh = new THREE.Mesh(drumGeom, drumMat);
        drumMesh.position.set(x, y, z);
        scene.add(drumMesh);
        objects.push(drumMesh);
        return drumMesh;
    }

    function createGuardTower(x, y, z) {
        // Base platform
        var baseGeom = new THREE.BoxGeometry(4, 1, 4);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x6a5a3a });
        var baseMesh = new THREE.Mesh(baseGeom, baseMat);
        baseMesh.position.set(x, 1, z);
        scene.add(baseMesh);
        objects.push(baseMesh);

        // Main tower post
        var postGeom = new THREE.CylinderGeometry(0.8, 0.8, y, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
        var postMesh = new THREE.Mesh(postGeom, postMat);
        postMesh.position.set(x, y / 2, z);
        scene.add(postMesh);
        objects.push(postMesh);

        // Watch platform
        var watchGeom = new THREE.BoxGeometry(3, 0.5, 3);
        var watchMat = new THREE.MeshLambertMaterial({ color: 0x7a6a4a });
        var watchMesh = new THREE.Mesh(watchGeom, watchMat);
        watchMesh.position.set(x, y - 1, z);
        scene.add(watchMesh);
        objects.push(watchMesh);

        return baseMesh;
    }

    function createSandbagWall(x, y, z) {
        for (var i = 0; i < 5; i++) {
            var bagGeom = new THREE.BoxGeometry(3, 1.5, 1);
            var bagMat = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
            var bagMesh = new THREE.Mesh(bagGeom, bagMat);
            bagMesh.position.set(x + (i * 3.5), y, z);
            scene.add(bagMesh);
            objects.push(bagMesh);
        }
    }

    function createWaterPool(x, y, z) {
        var poolGeom = new THREE.CylinderGeometry(6, 6, 0.3, 16);
        var poolMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
        var poolMesh = new THREE.Mesh(poolGeom, poolMat);
        poolMesh.position.set(x, y, z);
        scene.add(poolMesh);
        objects.push(poolMesh);
        return poolMesh;
    }

    function update(delta) {
        // Placeholder for animation
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
