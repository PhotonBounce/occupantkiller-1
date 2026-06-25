window.SandKeep = (function() {
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
        // Tan/ochre sandstone material
        var sandMaterial = new THREE.MeshLambertMaterial({ color: 0xC2A77D });
        var darkSandMaterial = new THREE.MeshLambertMaterial({ color: 0x9B8B5C });
        var lightSandMaterial = new THREE.MeshLambertMaterial({ color: 0xD4AF87 });
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a4d7d });
        var palmTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var palmFoliageMaterial = new THREE.MeshLambertMaterial({ color: 0x3d5a2d });

        // Main fortress wall - west side
        var westWallGeo = new THREE.BoxGeometry(3, 8, 25);
        var westWall = new THREE.Mesh(westWallGeo, sandMaterial);
        westWall.position.set(-20, 4, 0);
        scene.add(westWall);
        objects.push(westWall);

        // Main fortress wall - east side
        var eastWallGeo = new THREE.BoxGeometry(3, 8, 25);
        var eastWall = new THREE.Mesh(eastWallGeo, sandMaterial);
        eastWall.position.set(20, 4, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        // Main fortress wall - north side
        var northWallGeo = new THREE.BoxGeometry(25, 8, 3);
        var northWall = new THREE.Mesh(northWallGeo, sandMaterial);
        northWall.position.set(0, 4, -15);
        scene.add(northWall);
        objects.push(northWall);

        // Main fortress wall - south side
        var southWallGeo = new THREE.BoxGeometry(25, 8, 3);
        var southWall = new THREE.Mesh(southWallGeo, sandMaterial);
        southWall.position.set(0, 4, 15);
        scene.add(southWall);
        objects.push(southWall);

        // Northwest tower - cylinder base
        var nwTowerBaseGeo = new THREE.CylinderGeometry(4, 4, 10, 8);
        var nwTowerBase = new THREE.Mesh(nwTowerBaseGeo, darkSandMaterial);
        nwTowerBase.position.set(-18, 5, -14);
        scene.add(nwTowerBase);
        objects.push(nwTowerBase);

        // Northwest tower - dome cap
        var nwDomeGeo = new THREE.SphereGeometry(4, 8, 6);
        var nwDome = new THREE.Mesh(nwDomeGeo, lightSandMaterial);
        nwDome.position.set(-18, 15, -14);
        nwDome.scale.set(1, 0.6, 1);
        scene.add(nwDome);
        objects.push(nwDome);

        // Northeast tower - cylinder base
        var neTowerBaseGeo = new THREE.CylinderGeometry(4, 4, 10, 8);
        var neTowerBase = new THREE.Mesh(neTowerBaseGeo, darkSandMaterial);
        neTowerBase.position.set(18, 5, -14);
        scene.add(neTowerBase);
        objects.push(neTowerBase);

        // Northeast tower - dome cap
        var neDomeGeo = new THREE.SphereGeometry(4, 8, 6);
        var neDome = new THREE.Mesh(neDomeGeo, lightSandMaterial);
        neDome.position.set(18, 15, -14);
        neDome.scale.set(1, 0.6, 1);
        scene.add(neDome);
        objects.push(neDome);

        // Southwest tower - cylinder base
        var swTowerBaseGeo = new THREE.CylinderGeometry(4, 4, 10, 8);
        var swTowerBase = new THREE.Mesh(swTowerBaseGeo, darkSandMaterial);
        swTowerBase.position.set(-18, 5, 14);
        scene.add(swTowerBase);
        objects.push(swTowerBase);

        // Southwest tower - dome cap
        var swDomeGeo = new THREE.SphereGeometry(4, 8, 6);
        var swDome = new THREE.Mesh(swDomeGeo, lightSandMaterial);
        swDome.position.set(-18, 15, 14);
        swDome.scale.set(1, 0.6, 1);
        scene.add(swDome);
        objects.push(swDome);

        // Southeast tower - cylinder base
        var seTowerBaseGeo = new THREE.CylinderGeometry(4, 4, 10, 8);
        var seTowerBase = new THREE.Mesh(seTowerBaseGeo, darkSandMaterial);
        seTowerBase.position.set(18, 5, 14);
        scene.add(seTowerBase);
        objects.push(seTowerBase);

        // Southeast tower - dome cap
        var seDomeGeo = new THREE.SphereGeometry(4, 8, 6);
        var seDome = new THREE.Mesh(seDomeGeo, lightSandMaterial);
        seDome.position.set(18, 15, 14);
        seDome.scale.set(1, 0.6, 1);
        scene.add(seDome);
        objects.push(seDome);

        // Sand dune berms - north
        var duneNorthGeo = new THREE.ConeGeometry(12, 4, 8);
        var duneNorth = new THREE.Mesh(duneNorthGeo, darkSandMaterial);
        duneNorth.position.set(0, 2, -25);
        scene.add(duneNorth);
        objects.push(duneNorth);

        // Sand dune berms - south
        var duneSouthGeo = new THREE.ConeGeometry(12, 4, 8);
        var duneSouth = new THREE.Mesh(duneSouthGeo, darkSandMaterial);
        duneSouth.position.set(0, 2, 25);
        scene.add(duneSouth);
        objects.push(duneSouth);

        // Sand dune berms - west
        var duneWestGeo = new THREE.ConeGeometry(10, 4, 8);
        var duneWest = new THREE.Mesh(duneWestGeo, darkSandMaterial);
        duneWest.position.set(-28, 2, 0);
        scene.add(duneWest);
        objects.push(duneWest);

        // Sand dune berms - east
        var duneEastGeo = new THREE.ConeGeometry(10, 4, 8);
        var duneEast = new THREE.Mesh(duneEastGeo, darkSandMaterial);
        duneEast.position.set(28, 2, 0);
        scene.add(duneEast);
        objects.push(duneEast);

        // Oasis water feature - central pool
        var oasisWaterGeo = new THREE.BoxGeometry(8, 1, 6);
        var oasisWater = new THREE.Mesh(oasisWaterGeo, waterMaterial);
        oasisWater.position.set(0, 0.5, 0);
        scene.add(oasisWater);
        objects.push(oasisWater);

        // Palm tree 1 - trunk
        var palmTrunk1Geo = new THREE.CylinderGeometry(0.8, 1.2, 8, 6);
        var palmTrunk1 = new THREE.Mesh(palmTrunk1Geo, palmTrunkMaterial);
        palmTrunk1.position.set(-10, 4, 5);
        scene.add(palmTrunk1);
        objects.push(palmTrunk1);

        // Palm tree 1 - foliage
        var palmFoliage1Geo = new THREE.ConeGeometry(5, 6, 8);
        var palmFoliage1 = new THREE.Mesh(palmFoliage1Geo, palmFoliageMaterial);
        palmFoliage1.position.set(-10, 11, 5);
        scene.add(palmFoliage1);
        objects.push(palmFoliage1);

        // Palm tree 2 - trunk
        var palmTrunk2Geo = new THREE.CylinderGeometry(0.8, 1.2, 8, 6);
        var palmTrunk2 = new THREE.Mesh(palmTrunk2Geo, palmTrunkMaterial);
        palmTrunk2.position.set(10, 4, -8);
        scene.add(palmTrunk2);
        objects.push(palmTrunk2);

        // Palm tree 2 - foliage
        var palmFoliage2Geo = new THREE.ConeGeometry(5, 6, 8);
        var palmFoliage2 = new THREE.Mesh(palmFoliage2Geo, palmFoliageMaterial);
        palmFoliage2.position.set(10, 11, -8);
        scene.add(palmFoliage2);
        objects.push(palmFoliage2);

        // Central courtyard structure - box
        var courtyardGeo = new THREE.BoxGeometry(14, 0.5, 14);
        var courtyard = new THREE.Mesh(courtyardGeo, lightSandMaterial);
        courtyard.position.set(0, 0.25, 0);
        scene.add(courtyard);
        objects.push(courtyard);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects if needed
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.geometry.type === 'ConeGeometry') {
                obj.rotation.y += delta * 0.1;
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
