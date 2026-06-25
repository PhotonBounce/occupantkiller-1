window.LimeDock = (function() {
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
        var whiteColor = 0xf5f5dc;
        var creamColor = 0xfffdd0;
        var dirtColor = 0xa0a080;
        var darkLimeColor = 0x9acd32;

        // Limestone block 1
        var geom1 = new THREE.BoxGeometry(8, 6, 4);
        var mat1 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var mesh1 = new THREE.Mesh(geom1, mat1);
        mesh1.position.set(-25, 3, -20);
        mesh1.castShadow = true;
        scene.add(mesh1);
        objects.push(mesh1);

        // Limestone block 2
        var geom2 = new THREE.BoxGeometry(10, 7, 5);
        var mat2 = new THREE.MeshLambertMaterial({ color: creamColor });
        var mesh2 = new THREE.Mesh(geom2, mat2);
        mesh2.position.set(20, 3.5, -15);
        mesh2.castShadow = true;
        scene.add(mesh2);
        objects.push(mesh2);

        // Limestone block 3
        var geom3 = new THREE.BoxGeometry(6, 5, 3);
        var mat3 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var mesh3 = new THREE.Mesh(geom3, mat3);
        mesh3.position.set(-8, 2.5, 10);
        mesh3.castShadow = true;
        scene.add(mesh3);
        objects.push(mesh3);

        // Lime kiln 1 (cylinder)
        var geom4 = new THREE.CylinderGeometry(4, 4.5, 12, 16);
        var mat4 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var mesh4 = new THREE.Mesh(geom4, mat4);
        mesh4.position.set(-15, 6, 5);
        mesh4.castShadow = true;
        scene.add(mesh4);
        objects.push(mesh4);

        // Lime kiln 2 (cylinder)
        var geom5 = new THREE.CylinderGeometry(3.5, 4, 10, 16);
        var mat5 = new THREE.MeshLambertMaterial({ color: creamColor });
        var mesh5 = new THREE.Mesh(geom5, mat5);
        mesh5.position.set(12, 5, -5);
        mesh5.castShadow = true;
        scene.add(mesh5);
        objects.push(mesh5);

        // Quarry cart 1 (box on rails)
        var geom6 = new THREE.BoxGeometry(5, 3, 8);
        var mat6 = new THREE.MeshLambertMaterial({ color: dirtColor });
        var mesh6 = new THREE.Mesh(geom6, mat6);
        mesh6.position.set(-30, 1.5, 0);
        mesh6.castShadow = true;
        scene.add(mesh6);
        objects.push(mesh6);

        // Quarry cart 2 (box on rails)
        var geom7 = new THREE.BoxGeometry(5, 3, 8);
        var mat7 = new THREE.MeshLambertMaterial({ color: dirtColor });
        var mesh7 = new THREE.Mesh(geom7, mat7);
        mesh7.position.set(25, 1.5, 20);
        mesh7.castShadow = true;
        scene.add(mesh7);
        objects.push(mesh7);

        // Loading crane arm base (cylinder)
        var geom8 = new THREE.CylinderGeometry(2, 2.5, 18, 12);
        var mat8 = new THREE.MeshLambertMaterial({ color: darkLimeColor });
        var mesh8 = new THREE.Mesh(geom8, mat8);
        mesh8.position.set(0, 9, -25);
        mesh8.castShadow = true;
        scene.add(mesh8);
        objects.push(mesh8);

        // Equipment structure 1 (cone)
        var geom9 = new THREE.ConeGeometry(3, 8, 12);
        var mat9 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var mesh9 = new THREE.Mesh(geom9, mat9);
        mesh9.position.set(-20, 4, -5);
        mesh9.castShadow = true;
        scene.add(mesh9);
        objects.push(mesh9);

        // Dust-covered sphere 1
        var geom10 = new THREE.SphereGeometry(3, 12, 12);
        var mat10 = new THREE.MeshLambertMaterial({ color: creamColor });
        var mesh10 = new THREE.Mesh(geom10, mat10);
        mesh10.position.set(15, 3, 5);
        mesh10.castShadow = true;
        scene.add(mesh10);
        objects.push(mesh10);

        // Equipment structure 2 (cone)
        var geom11 = new THREE.ConeGeometry(2.5, 7, 10);
        var mat11 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var mesh11 = new THREE.Mesh(geom11, mat11);
        mesh11.position.set(5, 3.5, 25);
        mesh11.castShadow = true;
        scene.add(mesh11);
        objects.push(mesh11);

        // Limestone block 4
        var geom12 = new THREE.BoxGeometry(7, 4, 6);
        var mat12 = new THREE.MeshLambertMaterial({ color: whiteColor });
        var mesh12 = new THREE.Mesh(geom12, mat12);
        mesh12.position.set(30, 2, 8);
        mesh12.castShadow = true;
        scene.add(mesh12);
        objects.push(mesh12);

        // Dust-covered sphere 2
        var geom13 = new THREE.SphereGeometry(2.5, 10, 10);
        var mat13 = new THREE.MeshLambertMaterial({ color: creamColor });
        var mesh13 = new THREE.Mesh(geom13, mat13);
        mesh13.position.set(-10, 2.5, -30);
        mesh13.castShadow = true;
        scene.add(mesh13);
        objects.push(mesh13);

        // Rail segment 1 (cylinder rotated)
        var geom14 = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
        var mat14 = new THREE.MeshLambertMaterial({ color: dirtColor });
        var mesh14 = new THREE.Mesh(geom14, mat14);
        mesh14.rotation.z = Math.PI / 2;
        mesh14.position.set(-5, 0.5, 0);
        mesh14.castShadow = true;
        scene.add(mesh14);
        objects.push(mesh14);

        // Rail segment 2 (cylinder rotated)
        var geom15 = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
        var mat15 = new THREE.MeshLambertMaterial({ color: dirtColor });
        var mesh15 = new THREE.Mesh(geom15, mat15);
        mesh15.rotation.z = Math.PI / 2;
        mesh15.position.set(10, 0.5, 15);
        mesh15.castShadow = true;
        scene.add(mesh15);
        objects.push(mesh15);

        // Light 1: Main ambient light
        var light1 = new THREE.PointLight(0xffffff, 0.7, 150);
        light1.position.set(-10, 20, -10);
        scene.add(light1);
        lights.push(light1);

        // Light 2: Secondary light for contrast
        var light2 = new THREE.PointLight(0xffffcc, 0.5, 120);
        light2.position.set(20, 15, 20);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animate quarry carts rolling
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.position.x < -29 || obj.position.x > 26) {
                if (obj.geometry instanceof THREE.BoxGeometry && obj.geometry.parameters.height === 8) {
                    obj.position.x += (Math.random() - 0.5) * 0.1;
                    obj.rotation.y += 0.005;
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
