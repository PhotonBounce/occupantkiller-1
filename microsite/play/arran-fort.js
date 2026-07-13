window.ArranFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        var i = 0;

        // Brodick Castle command keep - main box tower
        var keepGeometry = new THREE.BoxGeometry(12, 18, 10);
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var keepMesh = new THREE.Mesh(keepGeometry, keepMaterial);
        keepMesh.position.set(-25, 9, -20);
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Brodick Castle battery gardens - fortification box
        var batteryGeometry = new THREE.BoxGeometry(20, 6, 15);
        var batteryMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var batteryMesh = new THREE.Mesh(batteryGeometry, batteryMaterial);
        batteryMesh.position.set(-20, 3, 10);
        scene.add(batteryMesh);
        objects.push(batteryMesh);

        // Brodick Castle corner tower - cylinder
        var cornerTowerGeometry = new THREE.CylinderGeometry(4, 5, 16, 8);
        var cornerTowerMaterial = new THREE.MeshLambertMaterial({ color: 0x9B6B47 });
        var cornerTowerMesh = new THREE.Mesh(cornerTowerGeometry, cornerTowerMaterial);
        cornerTowerMesh.position.set(-35, 8, 5);
        scene.add(cornerTowerMesh);
        objects.push(cornerTowerMesh);

        // Goat Fell summit - stone shelter box
        var shelterGeometry = new THREE.BoxGeometry(8, 5, 8);
        var shelterMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var shelterMesh = new THREE.Mesh(shelterGeometry, shelterMaterial);
        shelterMesh.position.set(15, 2.5, -25);
        scene.add(shelterMesh);
        objects.push(shelterMesh);

        // Goat Fell signal mast - cylinder
        var mastGeometry = new THREE.CylinderGeometry(1.5, 1.5, 22, 8);
        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var mastMesh = new THREE.Mesh(mastGeometry, mastMaterial);
        mastMesh.position.set(20, 11, -30);
        scene.add(mastMesh);
        objects.push(mastMesh);

        // Goat Fell weather radome - sphere
        var radomeGeometry = new THREE.SphereGeometry(3, 16, 12);
        var radomeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var radomeMesh = new THREE.Mesh(radomeGeometry, radomeMaterial);
        radomeMesh.position.set(20, 23, -30);
        scene.add(radomeMesh);
        objects.push(radomeMesh);

        // Brodick Bay sandbag emplacements - box
        var sandbagGeometry = new THREE.BoxGeometry(14, 4, 10);
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var sandbagMesh = new THREE.Mesh(sandbagGeometry, sandbagMaterial);
        sandbagMesh.position.set(0, 2, 25);
        scene.add(sandbagMesh);
        objects.push(sandbagMesh);

        // Brodick Bay mines - sphere
        var mineGeometry = new THREE.SphereGeometry(2, 12, 10);
        var mineMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mineMesh = new THREE.Mesh(mineGeometry, mineMaterial);
        mineMesh.position.set(10, 1, 30);
        scene.add(mineMesh);
        objects.push(mineMesh);

        // Brodick Bay cable net - LineSegments
        var cableGeometry = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -5, 0, 20, 5, 0, 20,
            5, 0, 20, 5, 4, 20,
            5, 4, 20, -5, 4, 20,
            -5, 4, 20, -5, 0, 20
        ]);
        cableGeometry.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableLineMaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
        var cableLines = new THREE.LineSegments(cableGeometry, cableLineMaterial);
        cableLines.position.set(5, 3, 28);
        scene.add(cableLines);
        objects.push(cableLines);

        // King's Cave fortified entrance - box
        var caveGeometry = new THREE.BoxGeometry(10, 8, 6);
        var caveMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var caveMesh = new THREE.Mesh(caveGeometry, caveMaterial);
        caveMesh.position.set(25, 4, -10);
        scene.add(caveMesh);
        objects.push(caveMesh);

        // King's Cave rock pillar - cylinder
        var pillarGeometry = new THREE.CylinderGeometry(3, 4, 14, 12);
        var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pillarMesh = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillarMesh.position.set(32, 7, -8);
        scene.add(pillarMesh);
        objects.push(pillarMesh);

        // King's Cave chain gate - LineSegments
        var chainGeometry = new THREE.BufferGeometry();
        var chainPositions = new Float32Array([
            20, 2, -12, 30, 2, -12,
            30, 2, -12, 30, 8, -12,
            30, 8, -12, 20, 8, -12,
            20, 8, -12, 20, 2, -12
        ]);
        chainGeometry.setAttribute('position', new THREE.BufferAttribute(chainPositions, 3));
        var chainLineMaterial = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 3 });
        var chainLines = new THREE.LineSegments(chainGeometry, chainLineMaterial);
        chainLines.position.set(0, 0, 0);
        scene.add(chainLines);
        objects.push(chainLines);

        // Lochranza Castle L-plan tower - box
        var lorenzaTowerGeometry = new THREE.BoxGeometry(11, 16, 9);
        var lorenzaTowerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var lorenzaTowerMesh = new THREE.Mesh(lorenzaTowerGeometry, lorenzaTowerMaterial);
        lorenzaTowerMesh.position.set(-15, 8, 20);
        scene.add(lorenzaTowerMesh);
        objects.push(lorenzaTowerMesh);

        // Lochranza harbour wall - box
        var harbourGeometry = new THREE.BoxGeometry(18, 7, 4);
        var harbourMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var harbourMesh = new THREE.Mesh(harbourGeometry, harbourMaterial);
        harbourMesh.position.set(-8, 3.5, 28);
        scene.add(harbourMesh);
        objects.push(harbourMesh);

        // Lochranza patrol vessel hull - cylinder
        var vesselGeometry = new THREE.CylinderGeometry(3, 3.5, 13, 10);
        var vesselMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var vesselMesh = new THREE.Mesh(vesselGeometry, vesselMaterial);
        vesselMesh.position.set(0, 6.5, 30);
        scene.add(vesselMesh);
        objects.push(vesselMesh);

        // Machrie Moor standing stones - box arrangement
        var stoneGeometry = new THREE.BoxGeometry(2, 9, 2);
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var stoneMesh = new THREE.Mesh(stoneGeometry, stoneMaterial);
        stoneMesh.position.set(25, 4.5, 15);
        scene.add(stoneMesh);
        objects.push(stoneMesh);

        // Machrie Moor central mast - cylinder
        var machrieMastGeometry = new THREE.CylinderGeometry(1.2, 1.2, 20, 8);
        var machrieMastMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var machrieMastMesh = new THREE.Mesh(machrieMastGeometry, machrieMastMaterial);
        machrieMastMesh.position.set(30, 10, 20);
        scene.add(machrieMastMesh);
        objects.push(machrieMastMesh);

        // Machrie Moor sensor dome - sphere
        var sensorGeometry = new THREE.SphereGeometry(2.5, 14, 10);
        var sensorMaterial = new THREE.MeshLambertMaterial({ color: 0xD3D3D3 });
        var sensorMesh = new THREE.Mesh(sensorGeometry, sensorMaterial);
        sensorMesh.position.set(30, 21, 20);
        scene.add(sensorMesh);
        objects.push(sensorMesh);

        // Drumadoon clifftop emplacement - box
        var clifftopGeometry = new THREE.BoxGeometry(16, 5, 12);
        var clifftopMaterial = new THREE.MeshLambertMaterial({ color: 0xB8860B });
        var clifftopMesh = new THREE.Mesh(clifftopGeometry, clifftopMaterial);
        clifftopMesh.position.set(-10, 2.5, -5);
        scene.add(clifftopMesh);
        objects.push(clifftopMesh);

        // Drumadoon gun barrel - cylinder (cone for tapered appearance)
        var gunBarrelGeometry = new THREE.CylinderGeometry(1.2, 1.8, 11, 8);
        var gunBarrelMaterial = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var gunBarrelMesh = new THREE.Mesh(gunBarrelGeometry, gunBarrelMaterial);
        gunBarrelMesh.rotation.z = Math.PI / 6;
        gunBarrelMesh.position.set(-15, 8, -3);
        scene.add(gunBarrelMesh);
        objects.push(gunBarrelMesh);

        // Drumadoon magazine - box
        var magazineGeometry = new THREE.BoxGeometry(10, 6, 8);
        var magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var magazineMesh = new THREE.Mesh(magazineGeometry, magazineMaterial);
        magazineMesh.position.set(-5, 3, 0);
        scene.add(magazineMesh);
        objects.push(magazineMesh);

        // Glen Sannox highland glen track - box
        var trackGeometry = new THREE.BoxGeometry(24, 2, 6);
        var trackMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
        trackMesh.position.set(0, 1, -15);
        scene.add(trackMesh);
        objects.push(trackMesh);

        // Glen Sannox boulder field - box
        var boulderGeometry = new THREE.BoxGeometry(8, 6, 7);
        var boulderMaterial = new THREE.MeshLambertMaterial({ color: 0x7F7F7F });
        var boulderMesh = new THREE.Mesh(boulderGeometry, boulderMaterial);
        boulderMesh.position.set(15, 3, -20);
        scene.add(boulderMesh);
        objects.push(boulderMesh);

        // Glen Sannox IED charges - sphere
        var iedGeometry = new THREE.SphereGeometry(1.8, 10, 8);
        var iedMaterial = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var iedMesh = new THREE.Mesh(iedGeometry, iedMaterial);
        iedMesh.position.set(-8, 0.9, -18);
        scene.add(iedMesh);
        objects.push(iedMesh);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        directionalLight.castShadow = false;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic - rotate objects slightly
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.1;
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
