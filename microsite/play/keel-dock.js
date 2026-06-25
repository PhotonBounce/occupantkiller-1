window.KeelDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        // Dry dock pit floor (large sunken box)
        var pitGeometry = new THREE.BoxGeometry(80, 8, 60);
        var pitMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var pitMesh = new THREE.Mesh(pitGeometry, pitMaterial);
        pitMesh.position.set(0, -6, 0);
        scene.add(pitMesh);
        objects.push(pitMesh);

        // Pit walls - left side
        var wallLeftGeometry = new THREE.BoxGeometry(4, 12, 60);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var wallLeft = new THREE.Mesh(wallLeftGeometry, wallMaterial);
        wallLeft.position.set(-42, 0, 0);
        scene.add(wallLeft);
        objects.push(wallLeft);

        // Pit walls - right side
        var wallRightGeometry = new THREE.BoxGeometry(4, 12, 60);
        var wallRight = new THREE.Mesh(wallRightGeometry, wallMaterial);
        wallRight.position.set(42, 0, 0);
        scene.add(wallRight);
        objects.push(wallRight);

        // Pit walls - front side
        var wallFrontGeometry = new THREE.BoxGeometry(80, 12, 4);
        var wallFront = new THREE.Mesh(wallFrontGeometry, wallMaterial);
        wallFront.position.set(0, 0, -32);
        scene.add(wallFront);
        objects.push(wallFront);

        // Pit walls - back side
        var wallBackGeometry = new THREE.BoxGeometry(80, 12, 4);
        var wallBack = new THREE.Mesh(wallBackGeometry, wallMaterial);
        wallBack.position.set(0, 0, 32);
        scene.add(wallBack);
        objects.push(wallBack);

        // Large ship keel frame - main spine cylinder
        var keelSpineGeometry = new THREE.CylinderGeometry(3, 3, 50, 8);
        var keelMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var keelSpine = new THREE.Mesh(keelSpineGeometry, keelMaterial);
        keelSpine.position.set(0, 2, 0);
        keelSpine.rotation.z = Math.PI / 2;
        scene.add(keelSpine);
        objects.push(keelSpine);

        // Keel support frame left
        var supportLeftGeometry = new THREE.BoxGeometry(6, 15, 4);
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var supportLeft = new THREE.Mesh(supportLeftGeometry, supportMaterial);
        supportLeft.position.set(-15, -2, -12);
        scene.add(supportLeft);
        objects.push(supportLeft);

        // Keel support frame right
        var supportRightGeometry = new THREE.BoxGeometry(6, 15, 4);
        var supportRight = new THREE.Mesh(supportRightGeometry, supportMaterial);
        supportRight.position.set(15, -2, -12);
        scene.add(supportRight);
        objects.push(supportRight);

        // Wooden scaffolding tower left
        var scaffoldLeftGeometry = new THREE.CylinderGeometry(2, 2, 35, 6);
        var scaffoldMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var scaffoldLeft = new THREE.Mesh(scaffoldLeftGeometry, scaffoldMaterial);
        scaffoldLeft.position.set(-25, 8, 15);
        scene.add(scaffoldLeft);
        objects.push(scaffoldLeft);

        // Wooden scaffolding tower right
        var scaffoldRightGeometry = new THREE.CylinderGeometry(2, 2, 35, 6);
        var scaffoldRight = new THREE.Mesh(scaffoldRightGeometry, scaffoldMaterial);
        scaffoldRight.position.set(25, 8, 15);
        scene.add(scaffoldRight);
        objects.push(scaffoldRight);

        // Scaffolding crossbeam
        var crossbeamGeometry = new THREE.BoxGeometry(55, 1.5, 2);
        var crossbeamMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var crossbeam = new THREE.Mesh(crossbeamGeometry, crossbeamMaterial);
        crossbeam.position.set(0, 20, 15);
        scene.add(crossbeam);
        objects.push(crossbeam);

        // Rivet station - cone shape (work platform)
        var rivetConeGeometry = new THREE.ConeGeometry(8, 3, 8);
        var rivetMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var rivetCone = new THREE.Mesh(rivetConeGeometry, rivetMaterial);
        rivetCone.position.set(-20, 5, -18);
        scene.add(rivetCone);
        objects.push(rivetCone);

        // Hull plating stack left
        var platingStack1Geometry = new THREE.BoxGeometry(8, 12, 20);
        var platingMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var platingStack1 = new THREE.Mesh(platingStack1Geometry, platingMaterial);
        platingStack1.position.set(-30, 8, -20);
        scene.add(platingStack1);
        objects.push(platingStack1);

        // Hull plating stack right
        var platingStack2Geometry = new THREE.BoxGeometry(8, 12, 20);
        var platingStack2 = new THREE.Mesh(platingStack2Geometry, platingMaterial);
        platingStack2.position.set(30, 8, -20);
        scene.add(platingStack2);
        objects.push(platingStack2);

        // Metal sphere weight/anchor object
        var weightGeometry = new THREE.SphereGeometry(4, 8, 8);
        var weightMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var weight = new THREE.Mesh(weightGeometry, weightMaterial);
        weight.position.set(0, -2, 25);
        scene.add(weight);
        objects.push(weight);

        // Support cylinder detail
        var detailCylinderGeometry = new THREE.CylinderGeometry(2.5, 2.5, 8, 6);
        var detailMaterial = new THREE.MeshLambertMaterial({ color: 0xB8860B });
        var detailCylinder = new THREE.Mesh(detailCylinderGeometry, detailMaterial);
        detailCylinder.position.set(0, 12, -10);
        scene.add(detailCylinder);
        objects.push(detailCylinder);

        // Add lights
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        light1.position.set(50, 40, 30);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.PointLight(0xFFA500, 0.6);
        light2.position.set(-30, 25, -20);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Optional: Add animation here
        // Example: rotate some objects slowly
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry) {
                objects[i].rotation.x += 0.3 * delta;
                objects[i].rotation.y += 0.2 * delta;
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
