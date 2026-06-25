window.StoneBay = (function() {
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
        buildBay();
    }

    function buildBay() {
        var graniteColor = 0x808080;
        var darkGraniteColor = 0x505050;
        var lightGraniteColor = 0xa0a0a0;
        var tidalColor = 0x1a1a2e;
        var sandColor = 0xc2b280;
        var woodColor = 0x5a4a3a;

        var material1 = new THREE.MeshLambertMaterial({ color: graniteColor });
        var material2 = new THREE.MeshLambertMaterial({ color: darkGraniteColor });
        var material3 = new THREE.MeshLambertMaterial({ color: lightGraniteColor });
        var material4 = new THREE.MeshLambertMaterial({ color: tidalColor });
        var material5 = new THREE.MeshLambertMaterial({ color: sandColor });
        var material6 = new THREE.MeshLambertMaterial({ color: woodColor });

        var largeBox1 = new THREE.BoxGeometry(15, 20, 12);
        var mesh1 = new THREE.Mesh(largeBox1, material1);
        mesh1.position.set(-25, 10, -20);
        mesh1.rotation.z = 0.3;
        scene.add(mesh1);
        objects.push(mesh1);

        var largeBox2 = new THREE.BoxGeometry(18, 22, 14);
        var mesh2 = new THREE.Mesh(largeBox2, material2);
        mesh2.position.set(20, 11, -15);
        mesh2.rotation.z = -0.25;
        scene.add(mesh2);
        objects.push(mesh2);

        var largeBox3 = new THREE.BoxGeometry(12, 18, 10);
        var mesh3 = new THREE.Mesh(largeBox3, material3);
        mesh3.position.set(-10, 9, 8);
        mesh3.rotation.z = 0.15;
        scene.add(mesh3);
        objects.push(mesh3);

        var largeBox4 = new THREE.BoxGeometry(16, 21, 13);
        var mesh4 = new THREE.Mesh(largeBox4, material1);
        mesh4.position.set(25, 10.5, 18);
        mesh4.rotation.z = -0.2;
        scene.add(mesh4);
        objects.push(mesh4);

        var mediumBox1 = new THREE.BoxGeometry(8, 12, 7);
        var mesh5 = new THREE.Mesh(mediumBox1, material2);
        mesh5.position.set(-15, 6, -8);
        mesh5.rotation.z = 0.4;
        scene.add(mesh5);
        objects.push(mesh5);

        var mediumBox2 = new THREE.BoxGeometry(9, 14, 8);
        var mesh6 = new THREE.Mesh(mediumBox2, material3);
        mesh6.position.set(8, 7, -25);
        mesh6.rotation.z = -0.35;
        scene.add(mesh6);
        objects.push(mesh6);

        var caveEntrance1 = new THREE.BoxGeometry(6, 8, 5);
        var mesh7 = new THREE.Mesh(caveEntrance1, material4);
        mesh7.position.set(-5, 4, 15);
        scene.add(mesh7);
        objects.push(mesh7);

        var caveEntrance2 = new THREE.BoxGeometry(7, 9, 6);
        var mesh8 = new THREE.Mesh(caveEntrance2, material4);
        mesh8.position.set(18, 4.5, -30);
        scene.add(mesh8);
        objects.push(mesh8);

        var tidalPool1 = new THREE.BoxGeometry(4, 2, 4);
        var mesh9 = new THREE.Mesh(tidalPool1, material4);
        mesh9.position.set(-30, 1, 5);
        scene.add(mesh9);
        objects.push(mesh9);

        var tidalPool2 = new THREE.BoxGeometry(3.5, 1.8, 3.5);
        var mesh10 = new THREE.Mesh(tidalPool2, material4);
        mesh10.position.set(15, 0.9, 25);
        scene.add(mesh10);
        objects.push(mesh10);

        var tidalPool3 = new THREE.BoxGeometry(4.5, 2.2, 4.5);
        var mesh11 = new THREE.Mesh(tidalPool3, material4);
        mesh11.position.set(-8, 1.1, -20);
        scene.add(mesh11);
        objects.push(mesh11);

        var lighthouseTower = new THREE.CylinderGeometry(2, 2.2, 20, 16);
        var mesh12 = new THREE.Mesh(lighthouseTower, material5);
        mesh12.position.set(-28, 10, 28);
        scene.add(mesh12);
        objects.push(mesh12);

        var lighthouseLamp = new THREE.ConeGeometry(3, 4, 16);
        var mesh13 = new THREE.Mesh(lighthouseLamp, material1);
        mesh13.position.set(-28, 22, 28);
        scene.add(mesh13);
        objects.push(mesh13);

        var wreckage1 = new THREE.BoxGeometry(10, 3, 2.5);
        var mesh14 = new THREE.Mesh(wreckage1, material6);
        mesh14.position.set(28, 1.5, -25);
        mesh14.rotation.z = 0.5;
        mesh14.rotation.y = 0.3;
        scene.add(mesh14);
        objects.push(mesh14);

        var wreckage2 = new THREE.BoxGeometry(5, 2, 1.5);
        var mesh15 = new THREE.Mesh(wreckage2, material6);
        mesh15.position.set(32, 1, -28);
        mesh15.rotation.z = -0.4;
        scene.add(mesh15);
        objects.push(mesh15);

        var wreckage3 = new THREE.BoxGeometry(8, 2.5, 2);
        var mesh16 = new THREE.Mesh(wreckage3, material6);
        mesh16.position.set(25, 1.2, -22);
        mesh16.rotation.z = 0.6;
        mesh16.rotation.y = -0.2;
        scene.add(mesh16);
        objects.push(mesh16);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 30, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        if (objects.length > 12) {
            objects[12].rotation.y += delta * 0.3;
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
