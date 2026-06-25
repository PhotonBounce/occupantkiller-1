window.GustKeep = (function() {
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
        // Lighthouse keep tower (central cylinder)
        var keepGeometry = new THREE.CylinderGeometry(6, 7, 35, 16);
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var keepTower = new THREE.Mesh(keepGeometry, keepMaterial);
        keepTower.position.set(0, 17.5, 0);
        scene.add(keepTower);
        objects.push(keepTower);

        // Sphere lens housing at top of keep
        var lensGeometry = new THREE.SphereGeometry(5, 16, 16);
        var lensMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var lensHousing = new THREE.Mesh(lensGeometry, lensMaterial);
        lensHousing.position.set(0, 38, 0);
        scene.add(lensHousing);
        objects.push(lensHousing);

        // Storm shutter barricade 1 (angled box panel)
        var shutterGeometry1 = new THREE.BoxGeometry(8, 12, 1.5);
        var shutterMaterial1 = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var shutter1 = new THREE.Mesh(shutterGeometry1, shutterMaterial1);
        shutter1.position.set(-15, 8, 12);
        shutter1.rotation.z = 0.4;
        shutter1.rotation.x = 0.3;
        scene.add(shutter1);
        objects.push(shutter1);

        // Storm shutter barricade 2 (angled box panel opposite side)
        var shutterGeometry2 = new THREE.BoxGeometry(8, 12, 1.5);
        var shutterMaterial2 = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var shutter2 = new THREE.Mesh(shutterGeometry2, shutterMaterial2);
        shutter2.position.set(15, 8, -12);
        shutter2.rotation.z = -0.4;
        shutter2.rotation.x = -0.3;
        scene.add(shutter2);
        objects.push(shutter2);

        // Storm shutter barricade 3
        var shutterGeometry3 = new THREE.BoxGeometry(10, 10, 1.5);
        var shutterMaterial3 = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var shutter3 = new THREE.Mesh(shutterGeometry3, shutterMaterial3);
        shutter3.position.set(-18, 12, -8);
        shutter3.rotation.z = -0.5;
        shutter3.rotation.y = 0.2;
        scene.add(shutter3);
        objects.push(shutter3);

        // Anemometer tower main support cylinder
        var anemometerSupport = new THREE.CylinderGeometry(0.8, 0.8, 28, 8);
        var anemometerMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var anemometerTower = new THREE.Mesh(anemometerSupport, anemometerMaterial);
        anemometerTower.position.set(25, 14, 20);
        scene.add(anemometerTower);
        objects.push(anemometerTower);

        // Anemometer cup sphere 1
        var cupGeometry1 = new THREE.SphereGeometry(2, 12, 12);
        var cupMaterial1 = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var cup1 = new THREE.Mesh(cupGeometry1, cupMaterial1);
        cup1.position.set(25, 28, 25);
        scene.add(cup1);
        objects.push(cup1);

        // Anemometer cup sphere 2
        var cupGeometry2 = new THREE.SphereGeometry(2, 12, 12);
        var cupMaterial2 = new THREE.MeshLambertMaterial({ color: 0xFF7F50 });
        var cup2 = new THREE.Mesh(cupGeometry2, cupMaterial2);
        cup2.position.set(32, 28, 20);
        scene.add(cup2);
        objects.push(cup2);

        // Anemometer cup sphere 3
        var cupGeometry3 = new THREE.SphereGeometry(2, 12, 12);
        var cupMaterial3 = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var cup3 = new THREE.Mesh(cupGeometry3, cupMaterial3);
        cup3.position.set(25, 28, 15);
        scene.add(cup3);
        objects.push(cup3);

        // Artillery battery cylinder dug into cliff
        var batteryGeometry = new THREE.CylinderGeometry(5, 6, 4, 12);
        var batteryMaterial = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        var battery = new THREE.Mesh(batteryGeometry, batteryMaterial);
        battery.position.set(-28, 2, -25);
        scene.add(battery);
        objects.push(battery);

        // Artillery barrel support cylinder (angled)
        var barrelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(-28, 6, -25);
        barrel.rotation.z = 0.6;
        scene.add(barrel);
        objects.push(barrel);

        // Emergency rescue signal fire pit 1
        var firepitGeometry1 = new THREE.CylinderGeometry(3, 4, 2, 10);
        var firepitMaterial1 = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var firepit1 = new THREE.Mesh(firepitGeometry1, firepitMaterial1);
        firepit1.position.set(-10, 1, 28);
        scene.add(firepit1);
        objects.push(firepit1);

        // Fire pit flames (cone)
        var flameGeometry1 = new THREE.ConeGeometry(2.5, 8, 10);
        var flameMaterial1 = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var flame1 = new THREE.Mesh(flameGeometry1, flameMaterial1);
        flame1.position.set(-10, 6, 28);
        scene.add(flame1);
        objects.push(flame1);

        // Emergency rescue signal fire pit 2
        var firepitGeometry2 = new THREE.CylinderGeometry(3, 4, 2, 10);
        var firepitMaterial2 = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var firepit2 = new THREE.Mesh(firepitGeometry2, firepitMaterial2);
        firepit2.position.set(12, 1, -28);
        scene.add(firepit2);
        objects.push(firepit2);

        // Fire pit flames (cone)
        var flameGeometry2 = new THREE.ConeGeometry(2.5, 8, 10);
        var flameMaterial2 = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var flame2 = new THREE.Mesh(flameGeometry2, flameMaterial2);
        flame2.position.set(12, 6, -28);
        scene.add(flame2);
        objects.push(flame2);

        // Cliff face supporting structure (large box)
        var cliffGeometry = new THREE.BoxGeometry(50, 15, 40);
        var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7765 });
        var cliffFace = new THREE.Mesh(cliffGeometry, cliffMaterial);
        cliffFace.position.set(0, -7.5, 0);
        scene.add(cliffFace);
        objects.push(cliffFace);

        // Add directional light
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        // Animate spinning anemometer cup spheres
        if (objects.length > 6) {
            objects[6].rotation.y += 0.02;
            objects[7].rotation.y += 0.02;
            objects[8].rotation.y += 0.02;
        }
        // Animate rotating flames
        if (objects.length > 14) {
            objects[13].rotation.y += 0.03;
            objects[15].rotation.y += 0.03;
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
