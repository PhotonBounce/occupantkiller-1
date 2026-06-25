window.HolmCamp = (function() {
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
        var brownMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var darkGrayMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var grayMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var darkBrownMaterial = new THREE.MeshLambertMaterial({ color: 0x3D2817 });
        var rustMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        // Palisade walls - island perimeter (4 log sections)
        var logGeometry1 = new THREE.BoxGeometry(40, 3, 1.5);
        var log1 = new THREE.Mesh(logGeometry1, brownMaterial);
        log1.position.set(0, 1.5, -22);
        log1.rotation.y = 0;
        scene.add(log1);
        objects.push(log1);

        var logGeometry2 = new THREE.BoxGeometry(40, 3, 1.5);
        var log2 = new THREE.Mesh(logGeometry2, brownMaterial);
        log2.position.set(0, 1.5, 22);
        log2.rotation.y = 0;
        scene.add(log2);
        objects.push(log2);

        var logGeometry3 = new THREE.BoxGeometry(1.5, 3, 40);
        var log3 = new THREE.Mesh(logGeometry3, brownMaterial);
        log3.position.set(-22, 1.5, 0);
        log3.rotation.y = 0;
        scene.add(log3);
        objects.push(log3);

        var logGeometry4 = new THREE.BoxGeometry(1.5, 3, 40);
        var log4 = new THREE.Mesh(logGeometry4, brownMaterial);
        log4.position.set(22, 1.5, 0);
        log4.rotation.y = 0;
        scene.add(log4);
        objects.push(log4);

        // Viking-era longhouse barracks (main structure)
        var roofGeometry = new THREE.ConeGeometry(12, 8, 4);
        var roof = new THREE.Mesh(roofGeometry, darkBrownMaterial);
        roof.position.set(-8, 8, 5);
        roof.rotation.y = Math.PI / 4;
        scene.add(roof);
        objects.push(roof);

        var wallGeometry = new THREE.BoxGeometry(24, 6, 14);
        var wall = new THREE.Mesh(wallGeometry, brownMaterial);
        wall.position.set(-8, 3, 5);
        scene.add(wall);
        objects.push(wall);

        var floorGeometry = new THREE.BoxGeometry(24, 0.5, 14);
        var floor = new THREE.Mesh(floorGeometry, darkGrayMaterial);
        floor.position.set(-8, 0.25, 5);
        scene.add(floor);
        objects.push(floor);

        // Norse runestone weapons cache (upright stone slab)
        var runestoneGeometry = new THREE.BoxGeometry(3, 9, 1);
        var runestone = new THREE.Mesh(runestoneGeometry, stoneMaterial);
        runestone.position.set(12, 4.5, -8);
        runestone.rotation.z = 0.1;
        scene.add(runestone);
        objects.push(runestone);

        // Cache base (stone platform)
        var cacheBaseGeometry = new THREE.BoxGeometry(6, 1.5, 6);
        var cacheBase = new THREE.Mesh(cacheBaseGeometry, grayMaterial);
        cacheBase.position.set(12, 0.75, -8);
        scene.add(cacheBase);
        objects.push(cacheBase);

        // Weapon storage container
        var weaponBoxGeometry = new THREE.BoxGeometry(5, 4, 5);
        var weaponBox = new THREE.Mesh(weaponBoxGeometry, rustMaterial);
        weaponBox.position.set(12, 2.5, -8);
        scene.add(weaponBox);
        objects.push(weaponBox);

        // Ship-launching ramp into sea (inclined structure)
        var rampGeometry = new THREE.BoxGeometry(12, 2, 20);
        var ramp = new THREE.Mesh(rampGeometry, brownMaterial);
        ramp.position.set(15, 2, 15);
        ramp.rotation.z = -0.3;
        scene.add(ramp);
        objects.push(ramp);

        // Ramp support logs
        var supportGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
        var support1 = new THREE.Mesh(supportGeometry, darkBrownMaterial);
        support1.position.set(10, 3, 20);
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(supportGeometry, darkBrownMaterial);
        support2.position.set(20, 3, 20);
        scene.add(support2);
        objects.push(support2);

        // Norse siege catapult arm (box beam on cylinder axle)
        var axleGeometry = new THREE.CylinderGeometry(1.2, 1.2, 8, 12);
        var axle = new THREE.Mesh(axleGeometry, grayMaterial);
        axle.position.set(-18, 3, -15);
        axle.rotation.z = Math.PI / 2;
        scene.add(axle);
        objects.push(axle);

        var armGeometry = new THREE.BoxGeometry(3, 2, 16);
        var arm = new THREE.Mesh(armGeometry, darkBrownMaterial);
        arm.position.set(-18, 5, -15);
        arm.rotation.z = 0.4;
        scene.add(arm);
        objects.push(arm);

        // Catapult base (wooden platform)
        var catapultBaseGeometry = new THREE.BoxGeometry(14, 1.5, 14);
        var catapultBase = new THREE.Mesh(catapultBaseGeometry, brownMaterial);
        catapultBase.position.set(-18, 0.75, -15);
        scene.add(catapultBase);
        objects.push(catapultBase);

        // Island terrain (ground sphere - central elevation)
        var islandGeometry = new THREE.SphereGeometry(35, 16, 8);
        var island = new THREE.Mesh(islandGeometry, new THREE.MeshLambertMaterial({ color: 0x7CB342 }));
        island.position.set(0, -20, 0);
        island.scale.set(1, 0.4, 1);
        scene.add(island);
        objects.push(island);

        // Water around island (large sphere below)
        var waterGeometry = new THREE.SphereGeometry(50, 12, 4);
        var water = new THREE.Mesh(waterGeometry, new THREE.MeshLambertMaterial({ color: 0x1A5F7A }));
        water.position.set(0, -30, 0);
        water.scale.set(1, 0.2, 1);
        scene.add(water);
        objects.push(water);

        // Torches/lighting posts (cylinders with cone tops)
        var torchStandGeometry = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
        var torch1 = new THREE.Mesh(torchStandGeometry, darkGrayMaterial);
        torch1.position.set(-12, 2.5, 18);
        scene.add(torch1);
        objects.push(torch1);

        var torch2 = new THREE.Mesh(torchStandGeometry, darkGrayMaterial);
        torch2.position.set(8, 2.5, 18);
        scene.add(torch2);
        objects.push(torch2);

        // Fire cone (glow effect)
        var fireGeometry = new THREE.ConeGeometry(1.2, 2, 8);
        var fire1 = new THREE.Mesh(fireGeometry, new THREE.MeshLambertMaterial({ color: 0xFF6B00 }));
        fire1.position.set(-12, 6, 18);
        scene.add(fire1);
        objects.push(fire1);

        var fire2 = new THREE.Mesh(fireGeometry, new THREE.MeshLambertMaterial({ color: 0xFF6B00 }));
        fire2.position.set(8, 6, 18);
        scene.add(fire2);
        objects.push(fire2);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 25, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xFF9900, 1.2, 25);
        pointLight1.position.set(-12, 7, 18);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xFF9900, 1.2, 25);
        pointLight2.position.set(8, 7, 18);
        scene.add(pointLight2);
        lights.push(pointLight2);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                var angularVelocity = Math.sin(Date.now() * 0.001 + i) * 0.3;
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
