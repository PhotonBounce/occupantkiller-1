window.FumeGate = (function() {
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
        buildGate();
    }

    function buildGate() {
        var gate = new THREE.BoxGeometry(20, 15, 2);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var gateMesh = new THREE.Mesh(gate, gateMat);
        gateMesh.position.set(0, 7, 0);
        scene.add(gateMesh);
        objects.push(gateMesh);

        var pipeLeft = new THREE.CylinderGeometry(1, 1, 30, 8);
        var pipeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var pipeLeftMesh = new THREE.Mesh(pipeLeft, pipeMat);
        pipeLeftMesh.position.set(-15, 5, 5);
        pipeLeftMesh.rotation.z = Math.PI / 2;
        scene.add(pipeLeftMesh);
        objects.push(pipeLeftMesh);

        var pipeRight = new THREE.CylinderGeometry(1, 1, 30, 8);
        var pipeRightMesh = new THREE.Mesh(pipeRight, pipeMat);
        pipeRightMesh.position.set(15, 5, 5);
        pipeRightMesh.rotation.z = Math.PI / 2;
        scene.add(pipeRightMesh);
        objects.push(pipeRightMesh);

        var barrelOne = new THREE.CylinderGeometry(2, 2, 4, 16);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
        var barrelOneMesh = new THREE.Mesh(barrelOne, barrelMat);
        barrelOneMesh.position.set(-25, 2, -20);
        scene.add(barrelOneMesh);
        objects.push(barrelOneMesh);

        var barrelTwo = new THREE.CylinderGeometry(2, 2, 4, 16);
        var barrelTwoMesh = new THREE.Mesh(barrelTwo, barrelMat);
        barrelTwoMesh.position.set(25, 2, -20);
        scene.add(barrelTwoMesh);
        objects.push(barrelTwoMesh);

        var barrelThree = new THREE.CylinderGeometry(2, 2, 4, 16);
        var barrelThreeMesh = new THREE.Mesh(barrelThree, barrelMat);
        barrelThreeMesh.position.set(-20, 2, 15);
        scene.add(barrelThreeMesh);
        objects.push(barrelThreeMesh);

        var ventTower = new THREE.CylinderGeometry(3, 3, 20, 12);
        var ventMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var ventTowerMesh = new THREE.Mesh(ventTower, ventMat);
        ventTowerMesh.position.set(28, 10, 25);
        scene.add(ventTowerMesh);
        objects.push(ventTowerMesh);

        var ventCap = new THREE.ConeGeometry(3.5, 3, 12);
        var ventCapMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var ventCapMesh = new THREE.Mesh(ventCap, ventCapMat);
        ventCapMesh.position.set(28, 23, 25);
        scene.add(ventCapMesh);
        objects.push(ventCapMesh);

        var hazmatOne = new THREE.BoxGeometry(4, 4, 4);
        var hazmatMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
        var hazmatOneMesh = new THREE.Mesh(hazmatOne, hazmatMat);
        hazmatOneMesh.position.set(-30, 2, 0);
        scene.add(hazmatOneMesh);
        objects.push(hazmatOneMesh);

        var hazmatTwo = new THREE.BoxGeometry(4, 4, 4);
        var hazmatTwoMesh = new THREE.Mesh(hazmatTwo, hazmatMat);
        hazmatTwoMesh.position.set(30, 2, 0);
        scene.add(hazmatTwoMesh);
        objects.push(hazmatTwoMesh);

        var gasCloudOne = new THREE.SphereGeometry(5, 8, 8);
        var cloudMat = new THREE.MeshLambertMaterial({ color: 0x00FF00, transparent: true });
        var gasCloudOneMesh = new THREE.Mesh(gasCloudOne, cloudMat);
        gasCloudOneMesh.position.set(-10, 12, -25);
        scene.add(gasCloudOneMesh);
        objects.push(gasCloudOneMesh);

        var gasCloudTwo = new THREE.SphereGeometry(6, 8, 8);
        var gasCloudTwoMesh = new THREE.Mesh(gasCloudTwo, cloudMat);
        gasCloudTwoMesh.position.set(10, 10, 28);
        scene.add(gasCloudTwoMesh);
        objects.push(gasCloudTwoMesh);

        var warningPole = new THREE.CylinderGeometry(0.5, 0.5, 8, 6);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var warningPoleMesh = new THREE.Mesh(warningPole, poleMat);
        warningPoleMesh.position.set(-32, 4, 10);
        scene.add(warningPoleMesh);
        objects.push(warningPoleMesh);

        var warningSign = new THREE.BoxGeometry(3, 2, 0.5);
        var signMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var warningSignMesh = new THREE.Mesh(warningSign, signMat);
        warningSignMesh.position.set(-32, 9, 10);
        scene.add(warningSignMesh);
        objects.push(warningSignMesh);

        var pipeVertical = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
        var pipeVerticalMesh = new THREE.Mesh(pipeVertical, pipeMat);
        pipeVerticalMesh.position.set(0, 8, -28);
        scene.add(pipeVerticalMesh);
        objects.push(pipeVerticalMesh);

        var sphereBlob = new THREE.SphereGeometry(2.5, 10, 10);
        var blobMat = new THREE.MeshLambertMaterial({ color: 0x990000 });
        var sphereBlobMesh = new THREE.Mesh(sphereBlob, blobMat);
        sphereBlobMesh.position.set(20, 3, -15);
        scene.add(sphereBlobMesh);
        objects.push(sphereBlobMesh);

        var mainLight = new THREE.PointLight(0xFFFFFF, 1.2, 100);
        mainLight.position.set(0, 20, 0);
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0x888888, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        if (objects.length > 10) {
            objects[10].rotation.y += delta * 0.3;
        }
        if (objects.length > 11) {
            objects[11].rotation.y -= delta * 0.2;
        }
        if (objects.length > 12) {
            objects[12].position.y += Math.sin(Date.now() * 0.001) * 0.02;
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
