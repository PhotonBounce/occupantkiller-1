window.ArchCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        var archMaterial = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var columnMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xDC143C });
        var cartMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });

        // Arch segment 1 - left curve
        var arch1Geo = new THREE.BoxGeometry(4, 12, 2);
        var arch1 = new THREE.Mesh(arch1Geo, archMaterial);
        arch1.position.set(-20, 8, 0);
        arch1.rotation.z = 0.3;
        scene.add(arch1);
        objects.push(arch1);

        // Arch segment 2 - center top
        var arch2Geo = new THREE.BoxGeometry(8, 4, 2);
        var arch2 = new THREE.Mesh(arch2Geo, archMaterial);
        arch2.position.set(0, 18, 0);
        scene.add(arch2);
        objects.push(arch2);

        // Arch segment 3 - right curve
        var arch3Geo = new THREE.BoxGeometry(4, 12, 2);
        var arch3 = new THREE.Mesh(arch3Geo, archMaterial);
        arch3.position.set(20, 8, 0);
        arch3.rotation.z = -0.3;
        scene.add(arch3);
        objects.push(arch3);

        // Arch segment 4 - left base
        var arch4Geo = new THREE.BoxGeometry(3, 6, 2);
        var arch4 = new THREE.Mesh(arch4Geo, archMaterial);
        arch4.position.set(-22, 2, 0);
        scene.add(arch4);
        objects.push(arch4);

        // Arch segment 5 - right base
        var arch5Geo = new THREE.BoxGeometry(3, 6, 2);
        var arch5 = new THREE.Mesh(arch5Geo, archMaterial);
        arch5.position.set(22, 2, 0);
        scene.add(arch5);
        objects.push(arch5);

        // Column stump 1
        var col1Geo = new THREE.CylinderGeometry(2, 2.2, 5, 8);
        var col1 = new THREE.Mesh(col1Geo, columnMaterial);
        col1.position.set(-15, 2.5, -20);
        scene.add(col1);
        objects.push(col1);

        // Column stump 2
        var col2Geo = new THREE.CylinderGeometry(2, 2.2, 6, 8);
        var col2 = new THREE.Mesh(col2Geo, columnMaterial);
        col2.position.set(15, 3, -18);
        scene.add(col2);
        objects.push(col2);

        // Column stump 3 - partial
        var col3Geo = new THREE.CylinderGeometry(1.8, 2, 3, 8);
        var col3 = new THREE.Mesh(col3Geo, columnMaterial);
        col3.position.set(-10, 1.5, 15);
        scene.add(col3);
        objects.push(col3);

        // Tent 1 - cone
        var tent1Geo = new THREE.ConeGeometry(3, 7, 8);
        var tent1 = new THREE.Mesh(tent1Geo, tentMaterial);
        tent1.position.set(-8, 3.5, 10);
        scene.add(tent1);
        objects.push(tent1);

        // Tent 2 - cone
        var tent2Geo = new THREE.ConeGeometry(3.5, 8, 8);
        var tent2 = new THREE.Mesh(tent2Geo, tentMaterial);
        tent2.position.set(5, 4, 12);
        scene.add(tent2);
        objects.push(tent2);

        // Supply cart 1 - main body
        var cart1Geo = new THREE.BoxGeometry(5, 3, 3);
        var cart1 = new THREE.Mesh(cart1Geo, cartMaterial);
        cart1.position.set(-12, 1.5, 25);
        scene.add(cart1);
        objects.push(cart1);

        // Supply cart 1 - wheel 1
        var wheel1Geo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 12);
        var wheel1 = new THREE.Mesh(wheel1Geo, stoneMaterial);
        wheel1.position.set(-14, 1.5, 23);
        wheel1.rotation.z = Math.PI / 4;
        scene.add(wheel1);
        objects.push(wheel1);

        // Supply cart 1 - wheel 2
        var wheel2Geo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 12);
        var wheel2 = new THREE.Mesh(wheel2Geo, stoneMaterial);
        wheel2.position.set(-14, 1.5, 27);
        wheel2.rotation.z = Math.PI / 4;
        scene.add(wheel2);
        objects.push(wheel2);

        // Dig trench - rectangular depression
        var trenchGeo = new THREE.BoxGeometry(10, 1.5, 15);
        var trench = new THREE.Mesh(trenchGeo, groundMaterial);
        trench.position.set(15, -0.75, 5);
        scene.add(trench);
        objects.push(trench);

        // Stone pile 1
        var stone1Geo = new THREE.SphereGeometry(2, 6, 6);
        var stone1 = new THREE.Mesh(stone1Geo, stoneMaterial);
        stone1.position.set(25, 2, -15);
        scene.add(stone1);
        objects.push(stone1);

        // Stone pile 2
        var stone2Geo = new THREE.SphereGeometry(1.8, 6, 6);
        var stone2 = new THREE.Mesh(stone2Geo, stoneMaterial);
        stone2.position.set(-25, 2, 20);
        scene.add(stone2);
        objects.push(stone2);

        // Campfire marker - cylinder
        var fireGeo = new THREE.CylinderGeometry(1.5, 1.8, 0.5, 8);
        var fire = new THREE.Mesh(fireGeo, new THREE.MeshLambertMaterial({ color: 0x4D4D4D }));
        fire.position.set(0, 0.25, 0);
        scene.add(fire);
        objects.push(fire);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            var i = 0;
            while (i < objects.length) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += delta * 0.05;
                }
                i = i + 1;
            }
        }
    }

    function reset() {
        var i = 0;
        while (i < objects.length) {
            scene.remove(objects[i]);
            i = i + 1;
        }
        i = 0;
        while (i < lights.length) {
            scene.remove(lights[i]);
            i = i + 1;
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
