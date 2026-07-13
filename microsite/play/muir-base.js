window.MuirBase = (function() {
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
        // Moorland fire base - box berm ring
        var bermGeom = new THREE.BoxGeometry(40, 3, 2);
        var bermMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
        var bermMesh = new THREE.Mesh(bermGeom, bermMat);
        bermMesh.position.set(0, 1.5, 0);
        scene.add(bermMesh);
        objects.push(bermMesh);

        // Cylinder gun positions - position 1
        var gunGeom1 = new THREE.CylinderGeometry(2, 2.5, 1.5, 8);
        var gunMat1 = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var gunMesh1 = new THREE.Mesh(gunGeom1, gunMat1);
        gunMesh1.position.set(-15, 2, -12);
        scene.add(gunMesh1);
        objects.push(gunMesh1);

        // Cylinder gun positions - position 2
        var gunGeom2 = new THREE.CylinderGeometry(2, 2.5, 1.5, 8);
        var gunMat2 = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var gunMesh2 = new THREE.Mesh(gunGeom2, gunMat2);
        gunMesh2.position.set(15, 2, -12);
        scene.add(gunMesh2);
        objects.push(gunMesh2);

        // Cylinder gun positions - position 3
        var gunGeom3 = new THREE.CylinderGeometry(2, 2.5, 1.5, 8);
        var gunMat3 = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var gunMesh3 = new THREE.Mesh(gunGeom3, gunMat3);
        gunMesh3.position.set(0, 2, -25);
        scene.add(gunMesh3);
        objects.push(gunMesh3);

        // Heather-camouflage domed observation post - sphere dome
        var domeGeom = new THREE.SphereGeometry(4, 12, 12);
        var domeMat = new THREE.MeshLambertMaterial({ color: 0x6b5a3a });
        var domeMesh = new THREE.Mesh(domeGeom, domeMat);
        domeMesh.position.set(20, 4, 15);
        scene.add(domeMesh);
        objects.push(domeMesh);

        // Observation post base
        var obsBaseGeom = new THREE.BoxGeometry(8, 2, 8);
        var obsBaseMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var obsBaseMesh = new THREE.Mesh(obsBaseGeom, obsBaseMat);
        obsBaseMesh.position.set(20, 1, 15);
        scene.add(obsBaseMesh);
        objects.push(obsBaseMesh);

        // Peat bank defensive berm - thick box earth walls
        var peatlGeom = new THREE.BoxGeometry(50, 4, 3);
        var peatlMat = new THREE.MeshLambertMaterial({ color: 0x4a3a1a });
        var peatlMesh = new THREE.Mesh(peatlGeom, peatlMat);
        peatlMesh.position.set(-5, 2, 8);
        scene.add(peatlMesh);
        objects.push(peatlMesh);

        // Grouse butt - repurposed firing position left wall
        var grouseLeftGeom = new THREE.BoxGeometry(2, 3, 10);
        var grouseMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
        var grouseLeftMesh = new THREE.Mesh(grouseLeftGeom, grouseMat);
        grouseLeftMesh.position.set(-10, 1.5, -5);
        scene.add(grouseLeftMesh);
        objects.push(grouseLeftMesh);

        // Grouse butt - right wall
        var grouseRightGeom = new THREE.BoxGeometry(2, 3, 10);
        var grouseRightMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
        var grouseRightMesh = new THREE.Mesh(grouseRightGeom, grouseRightMat);
        grouseRightMesh.position.set(-5, 1.5, -5);
        scene.add(grouseRightMesh);
        objects.push(grouseRightMesh);

        // Grouse butt - back wall
        var grouseBackGeom = new THREE.BoxGeometry(5, 3, 2);
        var grouseBackMat = new THREE.MeshLambertMaterial({ color: 0x5a4a2a });
        var grouseBackMesh = new THREE.Mesh(grouseBackGeom, grouseBackMat);
        grouseBackMesh.position.set(-7.5, 1.5, -14);
        scene.add(grouseBackMesh);
        objects.push(grouseBackMesh);

        // Standing stone communications marker - tall box pillar
        var stoneGeom = new THREE.BoxGeometry(1.5, 8, 1.5);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var stoneMesh = new THREE.Mesh(stoneGeom, stoneMat);
        stoneMesh.position.set(8, 4, 22);
        scene.add(stoneMesh);
        objects.push(stoneMesh);

        // Standing stone - LineSegments code cuts
        var stoneCodeGeom = new THREE.BufferGeometry();
        var stoneCodeVerts = new Float32Array([
            8, 0, 1.5,
            8, 8, 1.5,
            8, 4, -1.5,
            8, 4, 1.5
        ]);
        stoneCodeGeom.setAttribute('position', new THREE.BufferAttribute(stoneCodeVerts, 3));
        var stoneLinesIndices = new Uint16Array([0, 1, 2, 3]);
        stoneCodeGeom.setIndex(new THREE.BufferAttribute(stoneLinesIndices, 1));
        var stoneLinesGeom = new THREE.LineSegments(stoneCodeGeom, new THREE.LineBasicMaterial({ color: 0xcccccc }));
        scene.add(stoneLinesGeom);
        objects.push(stoneLinesGeom);

        // Supply drop zone - box pad
        var dropZoneGeom = new THREE.BoxGeometry(15, 0.5, 15);
        var dropZoneMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
        var dropZoneMesh = new THREE.Mesh(dropZoneGeom, dropZoneMat);
        dropZoneMesh.position.set(-20, 0.25, -20);
        scene.add(dropZoneMesh);
        objects.push(dropZoneMesh);

        // Supply drop zone - LineSegments cross markers
        var dropCrossGeom = new THREE.BufferGeometry();
        var dropCrossVerts = new Float32Array([
            -20, 1, -12.5,
            -20, 1, -27.5,
            -12.5, 1, -20,
            -27.5, 1, -20
        ]);
        dropCrossGeom.setAttribute('position', new THREE.BufferAttribute(dropCrossVerts, 3));
        var dropCrossIndices = new Uint16Array([0, 1, 2, 3]);
        dropCrossGeom.setIndex(new THREE.BufferAttribute(dropCrossIndices, 1));
        var dropCrossLines = new THREE.LineSegments(dropCrossGeom, new THREE.LineBasicMaterial({ color: 0xffff00 }));
        scene.add(dropCrossLines);
        objects.push(dropCrossLines);

        // Mountain rescue shelter - box main structure
        var shelterGeom = new THREE.BoxGeometry(12, 4, 10);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var shelterMesh = new THREE.Mesh(shelterGeom, shelterMat);
        shelterMesh.position.set(25, 2, -10);
        scene.add(shelterMesh);
        objects.push(shelterMesh);

        // Mountain rescue shelter - cone roof
        var roofGeom = new THREE.ConeGeometry(7, 3, 8);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var roofMesh = new THREE.Mesh(roofGeom, roofMat);
        roofMesh.position.set(25, 6.5, -10);
        scene.add(roofMesh);
        objects.push(roofMesh);

        // Additional ammo storage box
        var ammoGeom = new THREE.BoxGeometry(6, 3, 6);
        var ammoMat = new THREE.MeshLambertMaterial({ color: 0x4a3a1a });
        var ammoMesh = new THREE.Mesh(ammoGeom, ammoMat);
        ammoMesh.position.set(-28, 1.5, 5);
        scene.add(ammoMesh);
        objects.push(ammoMesh);

        // Watch tower base
        var towerBaseGeom = new THREE.BoxGeometry(4, 2, 4);
        var towerBaseMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var towerBaseMesh = new THREE.Mesh(towerBaseGeom, towerBaseMat);
        towerBaseMesh.position.set(-8, 1, 25);
        scene.add(towerBaseMesh);
        objects.push(towerBaseMesh);

        // Watch tower post
        var towerPostGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 6);
        var towerPostMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var towerPostMesh = new THREE.Mesh(towerPostGeom, towerPostMat);
        towerPostMesh.position.set(-8, 5, 25);
        scene.add(towerPostMesh);
        objects.push(towerPostMesh);

        // Fuel storage sphere
        var fuelGeom = new THREE.SphereGeometry(2.5, 8, 8);
        var fuelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
        var fuelMesh = new THREE.Mesh(fuelGeom, fuelMat);
        fuelMesh.position.set(12, 2.5, 8);
        scene.add(fuelMesh);
        objects.push(fuelMesh);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sun)
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 25, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation loop - rotate standing stone slightly
        if (objects.length > 10) {
            objects[9].rotation.y += 0.01 * delta;
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
