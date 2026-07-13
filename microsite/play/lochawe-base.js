window.LochAweBase = (function() {
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
        // Loch Awe Hotel naval HQ
        var hotelGeom = new THREE.BoxGeometry(8, 10, 6);
        var hotelMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var hotel = new THREE.Mesh(hotelGeom, hotelMat);
        hotel.position.set(-25, 5, -20);
        scene.add(hotel);
        objects.push(hotel);

        // Hotel jetty extension
        var jettyGeom = new THREE.BoxGeometry(12, 1, 4);
        var jettyMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var jetty = new THREE.Mesh(jettyGeom, jettyMat);
        jetty.position.set(-20, 0.5, -12);
        scene.add(jetty);
        objects.push(jetty);

        // Water tower at hotel
        var towerGeom = new THREE.CylinderGeometry(2, 2.5, 8, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-28, 4, -22);
        scene.add(tower);
        objects.push(tower);

        // Inishail island base
        var islandGeom = new THREE.BoxGeometry(10, 2, 10);
        var islandMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var island = new THREE.Mesh(islandGeom, islandMat);
        island.position.set(20, 1, 5);
        scene.add(island);
        objects.push(island);

        // Castle ruins on island
        var castleGeom = new THREE.BoxGeometry(6, 7, 6);
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
        var castle = new THREE.Mesh(castleGeom, castleMat);
        castle.position.set(20, 3.5, 5);
        scene.add(castle);
        objects.push(castle);

        // Lookout stump on island
        var stumpGeom = new THREE.CylinderGeometry(1.2, 1.5, 5, 12);
        var stumpMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var stump = new THREE.Mesh(stumpGeom, stumpMat);
        stump.position.set(24, 2.5, 8);
        scene.add(stump);
        objects.push(stump);

        // Cable ferry from island
        var cablePoints = [
            new THREE.Vector3(20, 6, 5),
            new THREE.Vector3(10, 5.5, 0)
        ];
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0x333333 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // St Conan's Kirk chapel
        var chapelGeom = new THREE.BoxGeometry(5, 6, 8);
        var chapelMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var chapel = new THREE.Mesh(chapelGeom, chapelMat);
        chapel.position.set(-8, 3, 15);
        scene.add(chapel);
        objects.push(chapel);

        // Kirk round tower
        var kirkTowerGeom = new THREE.CylinderGeometry(1.8, 2, 7, 16);
        var kirkTowerMat = new THREE.MeshLambertMaterial({ color: 0x704214 });
        var kirkTower = new THREE.Mesh(kirkTowerGeom, kirkTowerMat);
        kirkTower.position.set(-12, 3.5, 18);
        scene.add(kirkTower);
        objects.push(kirkTower);

        // Kirk cloister wall
        var cloisterGeom = new THREE.BoxGeometry(10, 3, 1);
        var cloisterMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var cloister = new THREE.Mesh(cloisterGeom, cloisterMat);
        cloister.position.set(-8, 1.5, 22);
        scene.add(cloister);
        objects.push(cloister);

        // Cruachan mountain tunnel entrance
        var tunnelGeom = new THREE.BoxGeometry(5, 4, 3);
        var tunnelMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
        tunnel.position.set(5, 2, 25);
        scene.add(tunnel);
        objects.push(tunnel);

        // Underground chamber
        var chamberGeom = new THREE.BoxGeometry(7, 3, 5);
        var chamberMat = new THREE.MeshLambertMaterial({ color: 0x36454F });
        var chamber = new THREE.Mesh(chamberGeom, chamberMat);
        chamber.position.set(8, 1.5, 28);
        scene.add(chamber);
        objects.push(chamber);

        // Pressure shaft cylinder
        var shaftGeom = new THREE.CylinderGeometry(1, 1.2, 6, 12);
        var shaftMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var shaft = new THREE.Mesh(shaftGeom, shaftMat);
        shaft.position.set(10, 3, 26);
        scene.add(shaft);
        objects.push(shaft);

        // Kilchrenan shore battery emplacement
        var emplacementGeom = new THREE.BoxGeometry(6, 2, 6);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var emplacement = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement.position.set(-15, 1, -8);
        scene.add(emplacement);
        objects.push(emplacement);

        // Gun barrel cylinder
        var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 4, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(-15, 3, -8);
        barrel.rotation.z = 0.3;
        scene.add(barrel);
        objects.push(barrel);

        // Magazine storage
        var magazineGeom = new THREE.BoxGeometry(4, 2, 4);
        var magazineMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var magazine = new THREE.Mesh(magazineGeom, magazineMat);
        magazine.position.set(-12, 1, -5);
        scene.add(magazine);
        objects.push(magazine);

        // Portsonachan slipway
        var slipwayGeom = new THREE.BoxGeometry(8, 1, 6);
        var slipwayMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var slipway = new THREE.Mesh(slipwayGeom, slipwayMat);
        slipway.position.set(2, 0.5, -25);
        scene.add(slipway);
        objects.push(slipway);

        // Patrol boat
        var boatGeom = new THREE.BoxGeometry(4, 2, 3);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x00008B });
        var boat = new THREE.Mesh(boatGeom, boatMat);
        boat.position.set(5, 1.5, -28);
        scene.add(boat);
        objects.push(boat);

        // Buoy markers
        var buoyGeom = new THREE.SphereGeometry(0.5, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var buoy = new THREE.Mesh(buoyGeom, buoyMat);
        buoy.position.set(8, 0.5, -22);
        scene.add(buoy);
        objects.push(buoy);

        // Eredine Forest logging detonator shelter
        var shelterGeom = new THREE.BoxGeometry(3, 2, 3);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(-20, 1, 10);
        scene.add(shelter);
        objects.push(shelter);

        // IED charges
        var iEdGeom = new THREE.SphereGeometry(0.4, 8, 8);
        var iEdMat = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
        var iEd = new THREE.Mesh(iEdGeom, iEdMat);
        iEd.position.set(-18, 0.8, 8);
        scene.add(iEd);
        objects.push(iEd);

        // Command wire
        var wirePoints = [
            new THREE.Vector3(-20, 1.2, 10),
            new THREE.Vector3(-15, 0.8, 6)
        ];
        var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x000000 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Add directional light
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);

        // Add ambient light
        var ambLight = new THREE.AmbientLight(0x404040);
        scene.add(ambLight);
        lights.push(ambLight);
    }

    function update(delta) {
        // Animation updates if needed
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
