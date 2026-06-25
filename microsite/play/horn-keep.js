window.HornKeep = (function() {
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
        // Central mead hall - large stone structure
        var hallGeom = new THREE.BoxGeometry(25, 12, 35);
        var hallMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var hallMesh = new THREE.Mesh(hallGeom, hallMat);
        hallMesh.position.set(0, 6, 0);
        hallMesh.castShadow = true;
        hallMesh.receiveShadow = true;
        scene.add(hallMesh);
        objects.push(hallMesh);

        // Wooden log wall - front
        var logWallGeom = new THREE.CylinderGeometry(1.5, 1.5, 30, 16);
        var logMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var logWall1 = new THREE.Mesh(logWallGeom, logMat);
        logWall1.rotation.z = Math.PI / 2;
        logWall1.position.set(0, 8, -18);
        logWall1.castShadow = true;
        scene.add(logWall1);
        objects.push(logWall1);

        // Wooden log wall - back
        var logWall2 = new THREE.Mesh(logWallGeom, logMat);
        logWall2.rotation.z = Math.PI / 2;
        logWall2.position.set(0, 8, 18);
        logWall2.castShadow = true;
        scene.add(logWall2);
        objects.push(logWall2);

        // Horn-decorated pole - left front
        var hornPole1Cyl = new THREE.CylinderGeometry(2, 2, 20, 16);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var hornPole1Base = new THREE.Mesh(hornPole1Cyl, stoneMat);
        hornPole1Base.position.set(-18, 10, -12);
        hornPole1Base.castShadow = true;
        scene.add(hornPole1Base);
        objects.push(hornPole1Base);

        // Horn decoration on pole 1
        var hornGeom = new THREE.ConeGeometry(1.2, 6, 12);
        var hornMat = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        var horn1 = new THREE.Mesh(hornGeom, hornMat);
        horn1.rotation.z = Math.PI / 3;
        horn1.position.set(-18, 16, -12);
        horn1.castShadow = true;
        scene.add(horn1);
        objects.push(horn1);

        // Horn-decorated pole - right front
        var hornPole2Base = new THREE.Mesh(hornPole1Cyl, stoneMat);
        hornPole2Base.position.set(18, 10, -12);
        hornPole2Base.castShadow = true;
        scene.add(hornPole2Base);
        objects.push(hornPole2Base);

        // Horn decoration on pole 2
        var horn2 = new THREE.Mesh(hornGeom, hornMat);
        horn2.rotation.z = -Math.PI / 3;
        horn2.position.set(18, 16, -12);
        horn2.castShadow = true;
        scene.add(horn2);
        objects.push(horn2);

        // Longhouse building - left side
        var longhouseGeom = new THREE.BoxGeometry(12, 8, 18);
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var longhouse1 = new THREE.Mesh(longhouseGeom, woodMat);
        longhouse1.position.set(-22, 4, 5);
        longhouse1.castShadow = true;
        scene.add(longhouse1);
        objects.push(longhouse1);

        // Longhouse building - right side
        var longhouse2 = new THREE.Mesh(longhouseGeom, woodMat);
        longhouse2.position.set(22, 4, 5);
        longhouse2.castShadow = true;
        scene.add(longhouse2);
        objects.push(longhouse2);

        // Weapon rack - left structure (LineSegments)
        var weaponRackGeom = new THREE.BufferGeometry();
        var weaponRackPos = new Float32Array([
            -28, 0, -5,  -28, 8, -5,
            -26, 0, -5,  -26, 8, -5,
            -24, 0, -5,  -24, 8, -5,
            -28, 4, -5,  -24, 4, -5
        ]);
        weaponRackGeom.setAttribute('position', new THREE.BufferAttribute(weaponRackPos, 3));
        var lineMat = new THREE.LineBasicMaterial({ color: 0x8b7355 });
        var weaponRack1 = new THREE.LineSegments(weaponRackGeom, lineMat);
        scene.add(weaponRack1);
        objects.push(weaponRack1);

        // Weapon rack - right structure (LineSegments)
        var weaponRackGeom2 = new THREE.BufferGeometry();
        var weaponRackPos2 = new Float32Array([
            26, 0, -5,  26, 8, -5,
            28, 0, -5,  28, 8, -5,
            30, 0, -5,  30, 8, -5,
            26, 4, -5,  30, 4, -5
        ]);
        weaponRackGeom2.setAttribute('position', new THREE.BufferAttribute(weaponRackPos2, 3));
        var weaponRack2 = new THREE.LineSegments(weaponRackGeom2, lineMat);
        scene.add(weaponRack2);
        objects.push(weaponRack2);

        // Animal skull trophy - left
        var skullGeom = new THREE.SphereGeometry(2, 12, 10);
        var boneMat = new THREE.MeshLambertMaterial({ color: 0xf5deb3 });
        var skull1 = new THREE.Mesh(skullGeom, boneMat);
        skull1.position.set(-25, 10, -20);
        skull1.castShadow = true;
        scene.add(skull1);
        objects.push(skull1);

        // Jaw bone for skull 1
        var jawGeom = new THREE.BoxGeometry(2.5, 0.8, 1.5);
        var jaw1 = new THREE.Mesh(jawGeom, boneMat);
        jaw1.position.set(-25, 8, -20);
        jaw1.castShadow = true;
        scene.add(jaw1);
        objects.push(jaw1);

        // Animal skull trophy - right
        var skull2 = new THREE.Mesh(skullGeom, boneMat);
        skull2.position.set(25, 10, -20);
        skull2.castShadow = true;
        scene.add(skull2);
        objects.push(skull2);

        // Jaw bone for skull 2
        var jaw2 = new THREE.Mesh(jawGeom, boneMat);
        jaw2.position.set(25, 8, -20);
        jaw2.castShadow = true;
        scene.add(jaw2);
        objects.push(jaw2);

        // Stone foundation blocks
        var stoneBlockGeom = new THREE.BoxGeometry(4, 2, 4);
        var stoneMat2 = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var stoneBlock1 = new THREE.Mesh(stoneBlockGeom, stoneMat2);
        stoneBlock1.position.set(-15, 1, 15);
        stoneBlock1.castShadow = true;
        scene.add(stoneBlock1);
        objects.push(stoneBlock1);

        var stoneBlock2 = new THREE.Mesh(stoneBlockGeom, stoneMat2);
        stoneBlock2.position.set(15, 1, 15);
        stoneBlock2.castShadow = true;
        scene.add(stoneBlock2);
        objects.push(stoneBlock2);

        // Decorative horn beacon - central top
        var beaconBaseCyl = new THREE.CylinderGeometry(1.8, 1.8, 3, 12);
        var beaconBase = new THREE.Mesh(beaconBaseCyl, stoneMat);
        beaconBase.position.set(0, 19, 0);
        beaconBase.castShadow = true;
        scene.add(beaconBase);
        objects.push(beaconBase);

        // Large horn on beacon
        var beaconHornGeom = new THREE.ConeGeometry(1.4, 8, 14);
        var beaconHorn = new THREE.Mesh(beaconHornGeom, hornMat);
        beaconHorn.position.set(0, 24, 0);
        beaconHorn.castShadow = true;
        scene.add(beaconHorn);
        objects.push(beaconHorn);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 150;
        directionalLight.shadow.camera.left = -60;
        directionalLight.shadow.camera.right = 60;
        directionalLight.shadow.camera.top = 60;
        directionalLight.shadow.camera.bottom = -60;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects if needed
        if (objects.length > 0) {
            // Could add animation here
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

    return { init: init, update: update, reset: reset };
}());
