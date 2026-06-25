window.TarBase = (function() {
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
        // Tar pool 1 - large dark box surface
        var tarMat1 = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var tarGeo1 = new THREE.BoxGeometry(40, 2, 35);
        var tarMesh1 = new THREE.Mesh(tarGeo1, tarMat1);
        tarMesh1.position.set(-20, 0, 0);
        scene.add(tarMesh1);
        objects.push(tarMesh1);

        // Tar pool 2 - another dark pool
        var tarMat2 = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var tarGeo2 = new THREE.BoxGeometry(35, 2, 30);
        var tarMesh2 = new THREE.Mesh(tarGeo2, tarMat2);
        tarMesh2.position.set(20, 0, -10);
        scene.add(tarMesh2);
        objects.push(tarMesh2);

        // Extraction pump jack base - cylinder
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var baseGeo = new THREE.CylinderGeometry(3, 4, 3, 8);
        var baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(-15, 3, 15);
        scene.add(baseMesh);
        objects.push(baseMesh);

        // Pump jack arm 1 - box
        var armMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var armGeo = new THREE.BoxGeometry(12, 1.5, 2);
        var armMesh = new THREE.Mesh(armGeo, armMat);
        armMesh.position.set(-15, 8, 15);
        armMesh.rotation.z = 0.3;
        scene.add(armMesh);
        objects.push(armMesh);

        // Pump jack vertical support
        var suppGeo = new THREE.BoxGeometry(1, 10, 1);
        var suppMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var suppMesh = new THREE.Mesh(suppGeo, suppMat);
        suppMesh.position.set(-15, 8, 15);
        scene.add(suppMesh);
        objects.push(suppMesh);

        // Storage tank 1 - large cylinder
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var tankGeo = new THREE.CylinderGeometry(5, 5, 12, 16);
        var tankMesh = new THREE.Mesh(tankGeo, tankMat);
        tankMesh.position.set(10, 6, 20);
        scene.add(tankMesh);
        objects.push(tankMesh);

        // Storage tank 2 - medium cylinder
        var tank2Geo = new THREE.CylinderGeometry(4, 4, 10, 16);
        var tank2Mesh = new THREE.Mesh(tankGeo, tankMat);
        tank2Mesh.position.set(25, 5, 15);
        scene.add(tank2Mesh);
        objects.push(tank2Mesh);

        // Processing building 1 - tall box
        var buildMat = new THREE.MeshLambertMaterial({ color: 0x454545 });
        var buildGeo = new THREE.BoxGeometry(8, 15, 6);
        var buildMesh = new THREE.Mesh(buildGeo, buildMat);
        buildMesh.position.set(-25, 7.5, -20);
        scene.add(buildMesh);
        objects.push(buildMesh);

        // Processing building 2 - medium box
        var build2Geo = new THREE.BoxGeometry(6, 10, 8);
        var build2Mesh = new THREE.Mesh(build2Geo, buildMat);
        build2Mesh.position.set(-10, 5, -25);
        scene.add(build2Mesh);
        objects.push(build2Mesh);

        // Pipeline segment 1 - cylinder diagonal
        var pipeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
        var pipeMesh = new THREE.Mesh(pipeGeo, pipeMat);
        pipeMesh.position.set(0, 3, 5);
        pipeMesh.rotation.z = 0.5;
        scene.add(pipeMesh);
        objects.push(pipeMesh);

        // Pipeline segment 2 - horizontal
        var pipe2Mesh = new THREE.Mesh(pipeGeo, pipeMat);
        pipe2Mesh.position.set(15, 4, -5);
        pipe2Mesh.rotation.z = 1.57;
        scene.add(pipe2Mesh);
        objects.push(pipe2Mesh);

        // Pump unit sphere - grimy extraction head
        var headMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        var headGeo = new THREE.SphereGeometry(2.5, 8, 8);
        var headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.set(-15, 12, 15);
        scene.add(headMesh);
        objects.push(headMesh);

        // Cooling tower 1 - cone shape
        var coolMat = new THREE.MeshLambertMaterial({ color: 0x545454 });
        var coolGeo = new THREE.ConeGeometry(4, 10, 8);
        var coolMesh = new THREE.Mesh(coolGeo, coolMat);
        coolMesh.position.set(5, 5, -15);
        scene.add(coolMesh);
        objects.push(coolMesh);

        // Cooling tower 2 - another cone
        var cool2Mesh = new THREE.Mesh(coolGeo, coolMat);
        cool2Mesh.position.set(15, 5, -20);
        scene.add(cool2Mesh);
        objects.push(cool2Mesh);

        // Equipment sphere 1 - separator
        var sepMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var sepGeo = new THREE.SphereGeometry(3, 8, 8);
        var sepMesh = new THREE.Mesh(sepGeo, sepMat);
        sepMesh.position.set(30, 4, 5);
        scene.add(sepMesh);
        objects.push(sepMesh);

        // Equipment sphere 2 - another separator
        var sep2Mesh = new THREE.Mesh(sepGeo, sepMat);
        sep2Mesh.position.set(-30, 3.5, 10);
        scene.add(sep2Mesh);
        objects.push(sep2Mesh);

        // Add ambient light
        var ambLight = new THREE.AmbientLight(0x666666, 0.8);
        scene.add(ambLight);
        lights.push(ambLight);

        // Add directional light for shadows
        var dirLight = new THREE.DirectionalLight(0xcccccc, 1.2);
        dirLight.position.set(30, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate pump jack arm bobbing
        if (objects.length > 3) {
            var bobAmount = Math.sin(Date.now() * 0.001) * 0.3;
            objects[3].rotation.z = 0.3 + bobAmount;
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
