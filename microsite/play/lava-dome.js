window.LavaDome = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lavaTime = 0;
    var steamVents = [];
    var conduits = [];
    var geothermalLights = [];

    function buildWalls() {
        var wallGeometry = new THREE.BoxGeometry(200, 150, 10);
        var wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x330000
        });

        var northWall = new THREE.Mesh(wallGeometry, wallMaterial);
        northWall.position.set(0, 75, -100);
        scene.add(northWall);
        objects.push(northWall);

        var southWall = new THREE.Mesh(wallGeometry, wallMaterial);
        southWall.position.set(0, 75, 100);
        scene.add(southWall);
        objects.push(southWall);

        var eastWall = new THREE.BoxGeometry(10, 150, 220);
        var eastMesh = new THREE.Mesh(eastWall, wallMaterial);
        eastMesh.position.set(100, 75, 0);
        scene.add(eastMesh);
        objects.push(eastMesh);

        var westWall = new THREE.Mesh(eastWall, wallMaterial);
        westWall.position.set(-100, 75, 0);
        scene.add(westWall);
        objects.push(westWall);
    }

    function buildPlatforms() {
        var platformGeo = new THREE.BoxGeometry(40, 2, 40);
        var platformMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.9,
            roughness: 0.2
        });

        var positions = [
            [-40, 40, -40],
            [40, 45, -30],
            [-50, 35, 20],
            [45, 50, 35],
            [0, 30, -50],
            [-30, 55, 45]
        ];

        positions.forEach(function(pos) {
            var platform = new THREE.Mesh(platformGeo, platformMat);
            platform.position.set(pos[0], pos[1], pos[2]);
            platform.castShadow = true;
            platform.receiveShadow = true;
            scene.add(platform);
            objects.push(platform);
        });
    }

    function buildSteamVents() {
        var ventGeo = new THREE.CylinderGeometry(3, 4, 8, 16);
        var ventMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.4
        });

        var ventPositions = [
            [-60, 2, -60],
            [60, 2, -40],
            [50, 2, 60],
            [-50, 2, 50],
            [0, 2, 0]
        ];

        ventPositions.forEach(function(pos) {
            var vent = new THREE.Mesh(ventGeo, ventMat);
            vent.position.set(pos[0], pos[1], pos[2]);
            scene.add(vent);
            objects.push(vent);
            steamVents.push({
                mesh: vent,
                baseScale: 1.0,
                phase: Math.random() * Math.PI * 2
            });
        });
    }

    function buildConduits() {
        var conduitGeo = new THREE.CylinderGeometry(2, 2, 60, 12);
        var conduitMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            metalness: 0.6,
            roughness: 0.5,
            emissive: 0xFF6600
        });

        var conduit1 = new THREE.Mesh(conduitGeo, conduitMat);
        conduit1.position.set(-70, 20, 0);
        conduit1.rotation.z = Math.PI / 2.5;
        scene.add(conduit1);
        objects.push(conduit1);
        conduits.push(conduit1);

        var conduit2 = new THREE.Mesh(conduitGeo, conduitMat);
        conduit2.position.set(70, 25, 0);
        conduit2.rotation.z = -Math.PI / 2.5;
        scene.add(conduit2);
        objects.push(conduit2);
        conduits.push(conduit2);
    }

    function buildGeothermalPlant() {
        var plantGeo = new THREE.BoxGeometry(50, 60, 30);
        var plantMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a2e,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x1a3a3a
        });

        var plant = new THREE.Mesh(plantGeo, plantMat);
        plant.position.set(0, 30, -80);
        plant.castShadow = true;
        plant.receiveShadow = true;
        scene.add(plant);
        objects.push(plant);

        var turbineGeo = new THREE.CylinderGeometry(8, 8, 20, 8);
        var turbineMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.9,
            roughness: 0.1
        });

        var turbine = new THREE.Mesh(turbineGeo, turbineMat);
        turbine.position.set(0, 70, -80);
        scene.add(turbine);
        objects.push(turbine);
    }

    function buildLavaLake() {
        var lavaGeo = new THREE.CylinderGeometry(120, 120, 2, 64);
        var lavaMat = new THREE.MeshStandardMaterial({
            color: 0xFF4500,
            emissive: 0xFF6600,
            metalness: 0.4,
            roughness: 0.6
        });

        var lava = new THREE.Mesh(lavaGeo, lavaMat);
        lava.position.y = 0;
        lava.receiveShadow = true;
        scene.add(lava);
        objects.push(lava);
    }

    function buildMiningRig() {
        var rigGeo = new THREE.BoxGeometry(20, 80, 15);
        var rigMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a3a,
            metalness: 0.85,
            roughness: 0.25
        });

        var rig = new THREE.Mesh(rigGeo, rigMat);
        rig.position.set(-75, 40, -70);
        rig.castShadow = true;
        scene.add(rig);
        objects.push(rig);

        var boomGeo = new THREE.CylinderGeometry(1.5, 1.5, 50, 8);
        var boom = new THREE.Mesh(boomGeo, rigMat);
        boom.position.set(-75, 70, -45);
        boom.rotation.z = Math.PI / 4;
        scene.add(boom);
        objects.push(boom);
    }

    function buildLights() {
        var ambientLight = new THREE.AmbientLight(0x664444, 0.5);
        scene.add(ambientLight);

        var mainLight = new THREE.DirectionalLight(0xFFAA66, 0.8);
        mainLight.position.set(100, 100, 100);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        scene.add(mainLight);

        var lavaGlow = new THREE.PointLight(0xFF6600, 1.5, 200);
        lavaGlow.position.set(0, 10, 0);
        scene.add(lavaGlow);
        geothermalLights.push(lavaGlow);

        var vent1Light = new THREE.PointLight(0xFF4500, 0.8, 80);
        vent1Light.position.set(-60, 15, -60);
        scene.add(vent1Light);
        geothermalLights.push(vent1Light);

        var vent2Light = new THREE.PointLight(0xFF4500, 0.8, 80);
        vent2Light.position.set(50, 15, 60);
        scene.add(vent2Light);
        geothermalLights.push(vent2Light);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        steamVents = [];
        conduits = [];
        geothermalLights = [];

        buildLavaLake();
        buildWalls();
        buildPlatforms();
        buildSteamVents();
        buildConduits();
        buildGeothermalPlant();
        buildMiningRig();
        buildLights();

        camera.position.set(0, 50, 80);
        camera.lookAt(0, 40, 0);
    }

    function update(delta) {
        lavaTime += delta;

        steamVents.forEach(function(vent) {
            var scale = 1.0 + Math.sin(lavaTime * 3.5 + vent.phase) * 0.3;
            vent.mesh.scale.y = scale;
        });

        conduits.forEach(function(conduit) {
            conduit.rotation.x += delta * 0.3;
        });

        geothermalLights.forEach(function(light, index) {
            light.intensity = 0.5 + Math.sin(lavaTime * 2.0 + index) * 0.4;
        });

        if (objects[0]) {
            objects[0].rotation.y += delta * 0.1;
        }
    }

    function reset() {
        objects.forEach(function(obj) {
            scene.remove(obj);
        });
        objects = [];
        steamVents = [];
        conduits = [];
        geothermalLights = [];
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
