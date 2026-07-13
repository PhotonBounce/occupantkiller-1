window.FenKeep = (function() {
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
        var keepGeometry = new THREE.BoxGeometry(20, 30, 20);
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var keepMesh = new THREE.Mesh(keepGeometry, keepMaterial);
        keepMesh.position.set(0, 15, 0);
        keepMesh.castShadow = true;
        keepMesh.receiveShadow = true;
        scene.add(keepMesh);
        objects.push(keepMesh);

        var causewayGeometry = new THREE.BoxGeometry(50, 4, 50);
        var causewayMaterial = new THREE.MeshLambertMaterial({ color: 0x9A8B7E });
        var causewayMesh = new THREE.Mesh(causewayGeometry, causewayMaterial);
        causewayMesh.position.set(0, 2, 0);
        causewayMesh.castShadow = true;
        causewayMesh.receiveShadow = true;
        scene.add(causewayMesh);
        objects.push(causewayMesh);

        var windmillBodyGeometry = new THREE.CylinderGeometry(6, 6, 25, 16);
        var windmillMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var windmillBodyMesh = new THREE.Mesh(windmillBodyGeometry, windmillMaterial);
        windmillBodyMesh.position.set(25, 12.5, -20);
        windmillBodyMesh.castShadow = true;
        windmillBodyMesh.receiveShadow = true;
        scene.add(windmillBodyMesh);
        objects.push(windmillBodyMesh);

        var bladeGeometry = new THREE.BoxGeometry(2, 12, 0.5);
        var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var blade1Mesh = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade1Mesh.position.set(25, 22, -20);
        blade1Mesh.rotation.z = Math.PI / 4;
        blade1Mesh.castShadow = true;
        blade1Mesh.receiveShadow = true;
        scene.add(blade1Mesh);
        objects.push(blade1Mesh);

        var blade2Mesh = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade2Mesh.position.set(25, 22, -20);
        blade2Mesh.rotation.z = Math.PI / 4 + Math.PI / 2;
        blade2Mesh.castShadow = true;
        blade2Mesh.receiveShadow = true;
        scene.add(blade2Mesh);
        objects.push(blade2Mesh);

        var reedCluster1Geometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        var reedMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var reed1Mesh = new THREE.Mesh(reedCluster1Geometry, reedMaterial);
        reed1Mesh.position.set(-28, 4, 15);
        reed1Mesh.castShadow = true;
        reed1Mesh.receiveShadow = true;
        scene.add(reed1Mesh);
        objects.push(reed1Mesh);

        var reed2Mesh = new THREE.Mesh(reedCluster1Geometry, reedMaterial);
        reed2Mesh.position.set(-30, 4, 18);
        reed2Mesh.castShadow = true;
        reed2Mesh.receiveShadow = true;
        scene.add(reed2Mesh);
        objects.push(reed2Mesh);

        var reed3Mesh = new THREE.Mesh(reedCluster1Geometry, reedMaterial);
        reed3Mesh.position.set(-26, 4, 17);
        reed3Mesh.castShadow = true;
        reed3Mesh.receiveShadow = true;
        scene.add(reed3Mesh);
        objects.push(reed3Mesh);

        var sluiceHouseGeometry = new THREE.BoxGeometry(12, 8, 10);
        var sluiceMaterial = new THREE.MeshLambertMaterial({ color: 0x704214 });
        var sluiceHouseMesh = new THREE.Mesh(sluiceHouseGeometry, sluiceMaterial);
        sluiceHouseMesh.position.set(-22, 4, -25);
        sluiceHouseMesh.castShadow = true;
        sluiceHouseMesh.receiveShadow = true;
        scene.add(sluiceHouseMesh);
        objects.push(sluiceHouseMesh);

        var bermWallGeometry = new THREE.BoxGeometry(60, 3, 3);
        var bermMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var bermWall1Mesh = new THREE.Mesh(bermWallGeometry, bermMaterial);
        bermWall1Mesh.position.set(0, 1.5, -32);
        bermWall1Mesh.castShadow = true;
        bermWall1Mesh.receiveShadow = true;
        scene.add(bermWall1Mesh);
        objects.push(bermWall1Mesh);

        var bermWall2Mesh = new THREE.Mesh(bermWallGeometry, bermMaterial);
        bermWall2Mesh.position.set(0, 1.5, 32);
        bermWall2Mesh.castShadow = true;
        bermWall2Mesh.receiveShadow = true;
        scene.add(bermWall2Mesh);
        objects.push(bermWall2Mesh);

        var watchtowerGeometry = new THREE.CylinderGeometry(4, 4, 16, 12);
        var watchtowerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var watchtower1Mesh = new THREE.Mesh(watchtowerGeometry, watchtowerMaterial);
        watchtower1Mesh.position.set(15, 8, 15);
        watchtower1Mesh.castShadow = true;
        watchtower1Mesh.receiveShadow = true;
        scene.add(watchtower1Mesh);
        objects.push(watchtower1Mesh);

        var watchtower2Mesh = new THREE.Mesh(watchtowerGeometry, watchtowerMaterial);
        watchtower2Mesh.position.set(-18, 8, -18);
        watchtower2Mesh.castShadow = true;
        watchtower2Mesh.receiveShadow = true;
        scene.add(watchtower2Mesh);
        objects.push(watchtower2Mesh);

        var coneGeometry = new THREE.ConeGeometry(4, 8, 12);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var cone1Mesh = new THREE.Mesh(coneGeometry, coneMaterial);
        cone1Mesh.position.set(15, 16, 15);
        cone1Mesh.castShadow = true;
        cone1Mesh.receiveShadow = true;
        scene.add(cone1Mesh);
        objects.push(cone1Mesh);

        var cone2Mesh = new THREE.Mesh(coneGeometry, coneMaterial);
        cone2Mesh.position.set(-18, 16, -18);
        cone2Mesh.castShadow = true;
        cone2Mesh.receiveShadow = true;
        scene.add(cone2Mesh);
        objects.push(cone2Mesh);

        var hideGeometry = new THREE.BoxGeometry(8, 6, 6);
        var hideMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var hideMesh = new THREE.Mesh(hideGeometry, hideMaterial);
        hideMesh.position.set(28, 3, 22);
        hideMesh.rotation.y = Math.PI / 6;
        hideMesh.castShadow = true;
        hideMesh.receiveShadow = true;
        scene.add(hideMesh);
        objects.push(hideMesh);

        var drainageChannelGeometry = new THREE.CylinderGeometry(1.5, 1.5, 40, 8);
        var drainageMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var drainageMesh = new THREE.Mesh(drainageChannelGeometry, drainageMaterial);
        drainageMesh.position.set(32, 0.5, 0);
        drainageMesh.rotation.z = Math.PI / 2;
        drainageMesh.castShadow = true;
        drainageMesh.receiveShadow = true;
        scene.add(drainageMesh);
        objects.push(drainageMesh);

        var mainLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        mainLight.position.set(20, 30, 20);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        if (objects.length > 3) {
            objects[3].rotation.z += delta * 0.3;
        }
        if (objects.length > 4) {
            objects[4].rotation.z += delta * 0.3;
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
