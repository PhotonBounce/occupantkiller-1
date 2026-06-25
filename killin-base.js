window.KillinBase = (function() {
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
        // Falls of Dochart tactical position - stone bridge
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var bridgeGeom = new THREE.BoxGeometry(20, 2, 4);
        var bridgeMesh = new THREE.Mesh(bridgeGeom, bridgeMaterial);
        bridgeMesh.position.set(-25, 5, -20);
        scene.add(bridgeMesh);
        objects.push(bridgeMesh);
        // Bridge charges - spheres on bridge
        var chargeMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B6B });
        var chargeGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var charge1 = new THREE.Mesh(chargeGeom, chargeMaterial);
        charge1.position.set(-30, 7, -20);
        scene.add(charge1);
        objects.push(charge1);
        var charge2 = new THREE.Mesh(chargeGeom, chargeMaterial);
        charge2.position.set(-20, 7, -20);
        scene.add(charge2);
        objects.push(charge2);
        // Bridge detonator wire - LineSegments
        var wireGeom = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -30, 7, -20,
            -30, 10, -15,
            -20, 7, -20,
            -20, 10, -15
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0xFFFF00 });
        var wireSegments = new THREE.LineSegments(wireGeom, wireMaterial);
        scene.add(wireSegments);
        objects.push(wireSegments);
        // Killin Kirk cemetery - stone church
        var churchMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var churchGeom = new THREE.BoxGeometry(12, 14, 8);
        var churchMesh = new THREE.Mesh(churchGeom, churchMaterial);
        churchMesh.position.set(10, 7, 0);
        scene.add(churchMesh);
        objects.push(churchMesh);
        // Cemetery graveyard wall
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var wallGeom = new THREE.BoxGeometry(20, 3, 1);
        var wall1 = new THREE.Mesh(wallGeom, wallMaterial);
        wall1.position.set(10, 2, -12);
        scene.add(wall1);
        objects.push(wall1);
        var wall2 = new THREE.Mesh(wallGeom, wallMaterial);
        wall2.position.set(10, 2, 12);
        scene.add(wall2);
        objects.push(wall2);
        // Bell tower
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var towerGeom = new THREE.CylinderGeometry(2, 2, 10, 8);
        var towerMesh = new THREE.Mesh(towerGeom, towerMaterial);
        towerMesh.position.set(10, 8, 0);
        scene.add(towerMesh);
        objects.push(towerMesh);
        // Breadalbane Folklore Centre - cottage
        var cottageMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        var cottageGeom = new THREE.BoxGeometry(10, 8, 10);
        var cottageMesh = new THREE.Mesh(cottageGeom, cottageMaterial);
        cottageMesh.position.set(-15, 4, 15);
        scene.add(cottageMesh);
        objects.push(cottageMesh);
        // Hidden basement hatch
        var hatchMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var hatchGeom = new THREE.BoxGeometry(3, 1, 3);
        var hatchMesh = new THREE.Mesh(hatchGeom, hatchMaterial);
        hatchMesh.position.set(-15, 0.5, 15);
        scene.add(hatchMesh);
        objects.push(hatchMesh);
        // Disguised ventilation cylinder
        var ventMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var ventGeom = new THREE.CylinderGeometry(1, 1, 5, 6);
        var ventMesh = new THREE.Mesh(ventGeom, ventMaterial);
        ventMesh.position.set(-15, 5, 20);
        scene.add(ventMesh);
        objects.push(ventMesh);
        // Loch Tay shoreline - clifftop OP
        var clifftopMaterial = new THREE.MeshLambertMaterial({ color: 0x4A5568 });
        var clifftopGeom = new THREE.BoxGeometry(15, 3, 10);
        var clifftopMesh = new THREE.Mesh(clifftopGeom, clifftopMaterial);
        clifftopMesh.position.set(25, 15, -10);
        scene.add(clifftopMesh);
        objects.push(clifftopMesh);
        // Marker buoys on water
        var buoyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var buoyGeom = new THREE.SphereGeometry(1, 8, 8);
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy1.position.set(20, 1, 5);
        scene.add(buoy1);
        objects.push(buoy1);
        var buoy2 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy2.position.set(30, 1, 5);
        scene.add(buoy2);
        objects.push(buoy2);
        // Sensor net LineSegments
        var sensorGeom = new THREE.BufferGeometry();
        var sensorPositions = new Float32Array([
            20, 1, 5,
            25, 3, 10,
            30, 1, 5,
            25, 3, 10
        ]);
        sensorGeom.setAttribute('position', new THREE.BufferAttribute(sensorPositions, 3));
        var sensorMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        var sensorSegments = new THREE.LineSegments(sensorGeom, sensorMaterial);
        scene.add(sensorSegments);
        objects.push(sensorSegments);
        // Ben Lawers mountain relay - summit shelter
        var shelterMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var shelterGeom = new THREE.BoxGeometry(8, 6, 8);
        var shelterMesh = new THREE.Mesh(shelterGeom, shelterMaterial);
        shelterMesh.position.set(-5, 25, 20);
        scene.add(shelterMesh);
        objects.push(shelterMesh);
        // Signal mast
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var mastGeom = new THREE.CylinderGeometry(0.5, 0.5, 15, 6);
        var mastMesh = new THREE.Mesh(mastGeom, mastMaterial);
        mastMesh.position.set(-5, 20, 20);
        scene.add(mastMesh);
        objects.push(mastMesh);
        // Weather dome
        var domeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var domeGeom = new THREE.SphereGeometry(2, 8, 8);
        var domeMesh = new THREE.Mesh(domeGeom, domeMaterial);
        domeMesh.position.set(-5, 30, 20);
        scene.add(domeMesh);
        objects.push(domeMesh);
        // Morenish Farm logistic hub - farm buildings
        var farmMaterial = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        var farmGeom = new THREE.BoxGeometry(12, 8, 10);
        var farm1 = new THREE.Mesh(farmGeom, farmMaterial);
        farm1.position.set(15, 4, 25);
        scene.add(farm1);
        objects.push(farm1);
        // Diesel tank
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x191970 });
        var tankGeom = new THREE.CylinderGeometry(2, 2, 6, 8);
        var tankMesh = new THREE.Mesh(tankGeom, tankMaterial);
        tankMesh.position.set(20, 3, 30);
        scene.add(tankMesh);
        objects.push(tankMesh);
        // Equipment store
        var storeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var storeGeom = new THREE.BoxGeometry(8, 6, 8);
        var storeMesh = new THREE.Mesh(storeGeom, storeMaterial);
        storeMesh.position.set(25, 3, 25);
        scene.add(storeMesh);
        objects.push(storeMesh);
        // Acharn Forest ambush lanes - conifer tree masses
        var treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var treeGeom = new THREE.ConeGeometry(3, 10, 8);
        var tree1 = new THREE.Mesh(treeGeom, treeMaterial);
        tree1.position.set(-20, 5, 5);
        scene.add(tree1);
        objects.push(tree1);
        var tree2 = new THREE.Mesh(treeGeom, treeMaterial);
        tree2.position.set(-25, 5, 10);
        scene.add(tree2);
        objects.push(tree2);
        // Sunken track
        var trackMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var trackGeom = new THREE.BoxGeometry(4, 1, 12);
        var trackMesh = new THREE.Mesh(trackGeom, trackMaterial);
        trackMesh.position.set(-22, 0.5, 8);
        scene.add(trackMesh);
        objects.push(trackMesh);
        // IED charges in forest
        var iedMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var iedGeom = new THREE.SphereGeometry(1, 8, 8);
        var ied1 = new THREE.Mesh(iedGeom, iedMaterial);
        ied1.position.set(-18, 2, 5);
        scene.add(ied1);
        objects.push(ied1);
        // Finlarig Castle ruin command post - ruined tower keep
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var keepGeom = new THREE.BoxGeometry(10, 16, 10);
        var keepMesh = new THREE.Mesh(keepGeom, keepMaterial);
        keepMesh.position.set(5, 8, -25);
        scene.add(keepMesh);
        objects.push(keepMesh);
        // Courtyard wall
        var courtWallMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var courtWallGeom = new THREE.BoxGeometry(20, 4, 1);
        var courtWall1 = new THREE.Mesh(courtWallGeom, courtWallMaterial);
        courtWall1.position.set(5, 2, -35);
        scene.add(courtWall1);
        objects.push(courtWall1);
        var courtWall2 = new THREE.Mesh(courtWallGeom, courtWallMaterial);
        courtWall2.position.set(5, 2, -15);
        scene.add(courtWall2);
        objects.push(courtWall2);
        // Watchtower cap cone
        var capMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var capGeom = new THREE.ConeGeometry(3, 6, 8);
        var capMesh = new THREE.Mesh(capGeom, capMaterial);
        capMesh.position.set(5, 18, -25);
        scene.add(capMesh);
        objects.push(capMesh);
        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
        // Directional light
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }
    function update(delta) {
        // Animate objects if needed
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
