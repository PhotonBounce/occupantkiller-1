window.CroftCamp = (function() {
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
        var geometry;
        var material;
        var mesh;

        // Blackhouse - long box with thick walls
        geometry = new THREE.BoxGeometry(20, 8, 12);
        material = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 4, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Blackhouse door frame
        geometry = new THREE.BoxGeometry(4, 6, 0.5);
        material = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 3, 6.5);
        scene.add(mesh);
        objects.push(mesh);

        // Turf byre/barn box structure
        geometry = new THREE.BoxGeometry(15, 7, 10);
        material = new THREE.MeshLambertMaterial({ color: 0x6b5d47 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(10, 3.5, -8);
        scene.add(mesh);
        objects.push(mesh);

        // Hay pile sphere inside byre
        geometry = new THREE.SphereGeometry(4, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(10, 6, -8);
        scene.add(mesh);
        objects.push(mesh);

        // Peat stack barricade - stacked boxes
        geometry = new THREE.BoxGeometry(8, 3, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x3a3a2e });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 1.5, 15);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.BoxGeometry(8, 3, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x4a4a3e });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 4.5, 15);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.BoxGeometry(8, 3, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x3a3a2e });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 7.5, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Kail yard vegetable garden - minefield box plots
        geometry = new THREE.BoxGeometry(3, 0.5, 3);
        material = new THREE.MeshLambertMaterial({ color: 0x5a6b3a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-10, 0.25, 10);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.BoxGeometry(3, 0.5, 3);
        material = new THREE.MeshLambertMaterial({ color: 0x6a7b4a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-5, 0.25, 10);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.BoxGeometry(3, 0.5, 3);
        material = new THREE.MeshLambertMaterial({ color: 0x5a6b3a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 0.25, 10);
        scene.add(mesh);
        objects.push(mesh);

        // Kail yard fence using LineSegments
        var fenceGeometry = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -12, 1, 8,    8, 1, 8,
            8, 1, 8,      8, 1, 12,
            8, 1, 12,     -12, 1, 12,
            -12, 1, 12,   -12, 1, 8
        ]);
        fenceGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x8b7355 });
        var fence = new THREE.LineSegments(fenceGeometry, lineMaterial);
        scene.add(fence);
        objects.push(fence);

        // Stone dyke wall - box sections
        geometry = new THREE.BoxGeometry(6, 4, 1);
        material = new THREE.MeshLambertMaterial({ color: 0x7a7a70 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 2, -20);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.BoxGeometry(6, 4, 1);
        material = new THREE.MeshLambertMaterial({ color: 0x8a8a80 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-15, 2, -20);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.BoxGeometry(6, 4, 1);
        material = new THREE.MeshLambertMaterial({ color: 0x7a7a70 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-5, 2, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Hand well - cylinder shaft
        geometry = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x555555 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 3, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Hand well - box coping top
        geometry = new THREE.BoxGeometry(4, 1, 4);
        material = new THREE.MeshLambertMaterial({ color: 0x6b6b5f });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 6.5, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Hidden weapons cellar hatch - below ground
        geometry = new THREE.BoxGeometry(5, 0.5, 5);
        material = new THREE.MeshLambertMaterial({ color: 0x3a3a32 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-5, -0.5, -10);
        scene.add(mesh);
        objects.push(mesh);

        // Cellar entrance box frame
        geometry = new THREE.BoxGeometry(5.5, 4, 0.8);
        material = new THREE.MeshLambertMaterial({ color: 0x2a2a22 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-5, -2.5, -10.5);
        scene.add(mesh);
        objects.push(mesh);

        // Potato pit ammunition store - sphere mounds
        geometry = new THREE.SphereGeometry(3, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 3, -15);
        scene.add(mesh);
        objects.push(mesh);

        geometry = new THREE.SphereGeometry(2.5, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x9b8365 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(30, 2.5, -12);
        scene.add(mesh);
        objects.push(mesh);

        // Lookout post roof chimney - cylinder
        geometry = new THREE.CylinderGeometry(1, 1.2, 8, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x5a5a50 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 8, 8);
        scene.add(mesh);
        objects.push(mesh);

        // Lookout post crow's nest - box platform
        geometry = new THREE.BoxGeometry(5, 2, 5);
        material = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 12, 8);
        scene.add(mesh);
        objects.push(mesh);

        // Crow's nest railing using LineSegments
        var railGeometry = new THREE.BufferGeometry();
        var railPositions = new Float32Array([
            -22.5, 13, 5.5,    -22.5, 13, 10.5,
            -22.5, 13, 10.5,   -17.5, 13, 10.5,
            -17.5, 13, 10.5,   -17.5, 13, 5.5,
            -17.5, 13, 5.5,    -22.5, 13, 5.5
        ]);
        railGeometry.setAttribute('position', new THREE.BufferAttribute(railPositions, 3));
        var railMaterial = new THREE.LineBasicMaterial({ color: 0xb8860b });
        var railing = new THREE.LineSegments(railGeometry, railMaterial);
        scene.add(railing);
        objects.push(railing);

        // Cone ammunition pile near cellar
        geometry = new THREE.ConeGeometry(2, 4, 6);
        material = new THREE.MeshLambertMaterial({ color: 0x3a3a32 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-8, 2, -5);
        scene.add(mesh);
        objects.push(mesh);

        // Supply crate storage area - box
        geometry = new THREE.BoxGeometry(12, 3, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(12, 1.5, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Point light near lookout post
        var pointLight = new THREE.PointLight(0xffff99, 0.8, 40);
        pointLight.position.set(-20, 14, 8);
        scene.add(pointLight);
        lights.push(pointLight);
    }
    function update(delta) {
        // Animate objects if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                // Subtle rotation for certain objects
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
