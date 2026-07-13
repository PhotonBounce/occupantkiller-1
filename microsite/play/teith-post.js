window.TeithPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Wallace Monument OP - tall octagonal box tower
        var tower = new THREE.Mesh(
            new THREE.BoxGeometry(8, 24, 8),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        tower.position.set(0, 12, 0);
        scene.add(tower);
        objects.push(tower);

        // Observation dome - sphere on top
        var dome = new THREE.Mesh(
            new THREE.SphereGeometry(5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        dome.position.set(0, 28, 0);
        scene.add(dome);
        objects.push(dome);

        // River crossing ford defense - sandbag wall 1
        var sandbag1 = new THREE.Mesh(
            new THREE.BoxGeometry(20, 3, 2),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        sandbag1.position.set(-15, 1.5, -20);
        scene.add(sandbag1);
        objects.push(sandbag1);

        // River crossing ford defense - sandbag wall 2
        var sandbag2 = new THREE.Mesh(
            new THREE.BoxGeometry(20, 3, 2),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        sandbag2.position.set(15, 1.5, -20);
        scene.add(sandbag2);
        objects.push(sandbag2);

        // Cavalry obstacle ditch - anti-horse trench
        var ditch = new THREE.Mesh(
            new THREE.BoxGeometry(30, 2, 4),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        ditch.position.set(0, 0.8, 15);
        scene.add(ditch);
        objects.push(ditch);

        // Archer firing position - crenellated battlements 1
        var battlement1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        battlement1.position.set(-18, 2, 8);
        scene.add(battlement1);
        objects.push(battlement1);

        // Archer firing position - crenellated battlements 2
        var battlement2 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        battlement2.position.set(18, 2, 8);
        scene.add(battlement2);
        objects.push(battlement2);

        // Highland pony supply train - cart 1
        var cart1 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        cart1.position.set(-25, 1.5, -10);
        scene.add(cart1);
        objects.push(cart1);

        // Highland pony supply train - cart 2
        var cart2 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        cart2.position.set(-20, 1.5, -10);
        scene.add(cart2);
        objects.push(cart2);

        // Highland pony supply train - cart 3
        var cart3 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        cart3.position.set(-15, 1.5, -10);
        scene.add(cart3);
        objects.push(cart3);

        // Signal fire relay tower 1
        var firetower1 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 10, 6),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        firetower1.position.set(-25, 5, 25);
        scene.add(firetower1);
        objects.push(firetower1);

        // Signal fire relay - fire sphere on tower 1
        var fire1 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        fire1.position.set(-25, 12, 25);
        scene.add(fire1);
        objects.push(fire1);

        // Signal fire relay tower 2
        var firetower2 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 10, 6),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        firetower2.position.set(25, 5, 25);
        scene.add(firetower2);
        objects.push(firetower2);

        // Signal fire relay - fire sphere on tower 2
        var fire2 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        fire2.position.set(25, 12, 25);
        scene.add(fire2);
        objects.push(fire2);

        // Bannockburn-style schiltron pike formation - ring of pikes
        var pikePositions = [
            [0, 0], [10, 0], [-10, 0], [0, 10], [0, -10],
            [7, 7], [-7, 7], [7, -7], [-7, -7]
        ];

        for (var i = 0; i < pikePositions.length; i++) {
            var pike = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 14, 8),
                new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
            );
            pike.position.set(pikePositions[i][0] - 30, 7, pikePositions[i][1]);
            scene.add(pike);
            objects.push(pike);
        }

        // Forth valley approach cone marker
        var cone1 = new THREE.Mesh(
            new THREE.ConeGeometry(3, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        cone1.position.set(30, 4, -30);
        scene.add(cone1);
        objects.push(cone1);

        // Forth valley approach cone marker 2
        var cone2 = new THREE.Mesh(
            new THREE.ConeGeometry(3, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        cone2.position.set(-30, 4, 30);
        scene.add(cone2);
        objects.push(cone2);

        // Main ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for tower
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Rotate fire spheres
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry instanceof THREE.SphereGeometry) {
                    if (objects[i].position.y > 10) {
                        objects[i].rotation.x += 0.02;
                        objects[i].rotation.y += 0.03;
                    }
                }
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

    return { init: init, update: update, reset: reset };
}());
