window.AlltBase = (function() {
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
        // Riverbank sandbag emplacements (BoxGeometry)
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        var sandbag1 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 6), sandbagMaterial);
        sandbag1.position.set(-25, 0.5, -20);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 6), sandbagMaterial);
        sandbag2.position.set(-10, 0.5, -25);
        scene.add(sandbag2);
        objects.push(sandbag2);

        var sandbag3 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 6), sandbagMaterial);
        sandbag3.position.set(15, 0.5, -22);
        scene.add(sandbag3);
        objects.push(sandbag3);

        // Ford crossing defense bollards (CylinderGeometry)
        var bollardMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });

        var bollard1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 8), bollardMaterial);
        bollard1.position.set(-15, 2, 5);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 8), bollardMaterial);
        bollard2.position.set(0, 2, 8);
        scene.add(bollard2);
        objects.push(bollard2);

        var bollard3 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 8), bollardMaterial);
        bollard3.position.set(15, 2, 6);
        scene.add(bollard3);
        objects.push(bollard3);

        // Chain barrier between bollards (LineSegments)
        var chainGeometry = new THREE.BufferGeometry();
        var chainVertices = new Float32Array([
            -15, 3, 5,   0, 3, 8,
            0, 3, 8,     15, 3, 6
        ]);
        chainGeometry.setAttribute('position', new THREE.BufferAttribute(chainVertices, 3));
        var chainMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
        var chainLine = new THREE.LineSegments(chainGeometry, chainMaterial);
        scene.add(chainLine);
        objects.push(chainLine);

        // Water-mill building (BoxGeometry)
        var millMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        var millBuilding = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 10), millMaterial);
        millBuilding.position.set(25, 4, 15);
        scene.add(millBuilding);
        objects.push(millBuilding);

        // Mill wheel (CylinderGeometry)
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });

        var millWheel = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 1.5, 16), wheelMaterial);
        millWheel.position.set(25, 5, 26);
        millWheel.rotation.z = Math.PI / 4;
        scene.add(millWheel);
        objects.push(millWheel);

        // Flash flood warning tripwire (LineSegments)
        var tripwireGeometry = new THREE.BufferGeometry();
        var tripwireVertices = new Float32Array([
            -30, 1, 20,   30, 1, 20,
            -30, 1, 20,   -28, 2, 22,
            30, 1, 20,    28, 2, 22
        ]);
        tripwireGeometry.setAttribute('position', new THREE.BufferAttribute(tripwireVertices, 3));
        var tripwireMaterial = new THREE.LineBasicMaterial({ color: 0xFF6347 });
        var tripwireLine = new THREE.LineSegments(tripwireGeometry, tripwireMaterial);
        scene.add(tripwireLine);
        objects.push(tripwireLine);

        // Flash flood warning float (SphereGeometry)
        var floatMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });

        var warningFloat = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), floatMaterial);
        warningFloat.position.set(25, 0.8, 20);
        scene.add(warningFloat);
        objects.push(warningFloat);

        // Submerged weapons cache (BoxGeometry below zero Y)
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });

        var weaponsCache = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), crateMaterial);
        weaponsCache.position.set(-18, -3, 12);
        scene.add(weaponsCache);
        objects.push(weaponsCache);

        // Stepping stone patrol route (small boxes across stream)
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });

        var stone1 = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 4), stoneMaterial);
        stone1.position.set(-20, 0.3, 0);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 4), stoneMaterial);
        stone2.position.set(0, 0.3, -2);
        scene.add(stone2);
        objects.push(stone2);

        var stone3 = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 4), stoneMaterial);
        stone3.position.set(20, 0.3, 1);
        scene.add(stone3);
        objects.push(stone3);

        // Pump-house water supply building (BoxGeometry)
        var pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });

        var pumpHouse = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 8), pumpMaterial);
        pumpHouse.position.set(-30, 3.5, -10);
        scene.add(pumpHouse);
        objects.push(pumpHouse);

        // Pump pipes (CylinderGeometry)
        var pipeMaterial = new THREE.MeshLambertMaterial({ color: 0x4F4F4F });

        var pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 6, 8), pipeMaterial);
        pipe1.position.set(-32, 6, -10);
        pipe1.rotation.z = Math.PI / 3;
        scene.add(pipe1);
        objects.push(pipe1);

        var pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 6, 8), pipeMaterial);
        pipe2.position.set(-28, 6, -12);
        pipe2.rotation.z = Math.PI / 3;
        scene.add(pipe2);
        objects.push(pipe2);

        // Ammunition cone storage (ConeGeometry)
        var ammoConeGeometry = new THREE.ConeGeometry(2, 5, 8);
        var ammoMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });

        var ammoCone = new THREE.Mesh(ammoConeGeometry, ammoMaterial);
        ammoCone.position.set(8, 2.5, -15);
        scene.add(ammoCone);
        objects.push(ammoCone);

        // Guard tower observation cone (ConeGeometry)
        var towerCone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4, 8), ammoMaterial);
        towerCone.position.set(-28, 5, 25);
        scene.add(towerCone);
        objects.push(towerCone);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows and atmosphere
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate mill wheel rotation
        if (objects.length > 6) {
            objects[6].rotation.y += delta * 0.5;
        }
        // Animate warning float bobbing
        if (objects.length > 9) {
            objects[9].position.y = 0.8 + Math.sin(Date.now() * 0.001) * 0.3;
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
