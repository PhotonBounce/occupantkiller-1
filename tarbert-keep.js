window.TarbertKeep = (function() {
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
        var geometry;
        var material;
        var mesh;

        // Castle keep - tall box tower at center
        geometry = new THREE.BoxGeometry(12, 20, 12);
        material = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 10, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Curtain wall section 1 - long thin wall
        geometry = new THREE.BoxGeometry(40, 8, 3);
        material = new THREE.MeshLambertMaterial({ color: 0x9B8B7B });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 4, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Curtain wall section 2 - perpendicular wall
        geometry = new THREE.BoxGeometry(3, 8, 30);
        material = new THREE.MeshLambertMaterial({ color: 0x9B8B7B });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(20, 4, -5);
        scene.add(mesh);
        objects.push(mesh);

        // Fishing fleet hull 1 - converted gunboat
        geometry = new THREE.BoxGeometry(8, 5, 16);
        material = new THREE.MeshLambertMaterial({ color: 0x4A4A3A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 2, -28);
        scene.add(mesh);
        objects.push(mesh);

        // Fishing fleet hull 1 mast
        geometry = new THREE.CylinderGeometry(0.8, 0.8, 14, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x3A3A2A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 11, -28);
        scene.add(mesh);
        objects.push(mesh);

        // Fishing fleet hull 2 - converted gunboat
        geometry = new THREE.BoxGeometry(8, 5, 16);
        material = new THREE.MeshLambertMaterial({ color: 0x5A5A4A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-35, 2, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Fishing fleet hull 2 mast
        geometry = new THREE.CylinderGeometry(0.8, 0.8, 14, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x3A3A2A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-35, 11, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Isthmus defense log barrier section 1
        geometry = new THREE.BoxGeometry(20, 3, 2);
        material = new THREE.MeshLambertMaterial({ color: 0x654321 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 1.5, 25);
        scene.add(mesh);
        objects.push(mesh);

        // Isthmus defense log barrier section 2
        geometry = new THREE.BoxGeometry(2, 3, 18);
        material = new THREE.MeshLambertMaterial({ color: 0x654321 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(15, 1.5, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Herring smokehouse ammo dump - long narrow building
        geometry = new THREE.BoxGeometry(6, 5, 20);
        material = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(28, 2.5, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Smokehouse chimney
        geometry = new THREE.CylinderGeometry(1.2, 1.5, 12, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x4A3A2A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(32, 8, 10);
        scene.add(mesh);
        objects.push(mesh);

        // Kennacraig ferry terminal building
        geometry = new THREE.BoxGeometry(14, 6, 10);
        material = new THREE.MeshLambertMaterial({ color: 0x8A7A6A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(30, 3, -10);
        scene.add(mesh);
        objects.push(mesh);

        // Ferry mooring capstan 1
        geometry = new THREE.CylinderGeometry(1.5, 1.8, 3, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x6A5A4A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 1.5, -18);
        scene.add(mesh);
        objects.push(mesh);

        // Ferry mooring capstan 2
        geometry = new THREE.CylinderGeometry(1.5, 1.8, 3, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x6A5A4A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(35, 1.5, -18);
        scene.add(mesh);
        objects.push(mesh);

        // East Loch approach mine 1 - sphere mine
        geometry = new THREE.SphereGeometry(2, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-20, 3, 25);
        scene.add(mesh);
        objects.push(mesh);

        // East Loch approach mine 2 - sphere mine
        geometry = new THREE.SphereGeometry(2, 8, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-10, 3, 30);
        scene.add(mesh);
        objects.push(mesh);

        // Mine cable line segment 1
        var points1 = [
            new THREE.Vector3(-20, 3, 25),
            new THREE.Vector3(-15, 2, 27)
        ];
        var lineGeom1 = new THREE.BufferGeometry().setFromPoints(points1);
        var lineMaterial = new THREE.LineBasicMaterial({ color: 0x2A2A2A });
        var line1 = new THREE.LineSegments(lineGeom1, lineMaterial);
        scene.add(line1);
        objects.push(line1);

        // Mine cable line segment 2
        var points2 = [
            new THREE.Vector3(-10, 3, 30),
            new THREE.Vector3(-5, 2, 28)
        ];
        var lineGeom2 = new THREE.BufferGeometry().setFromPoints(points2);
        var line2 = new THREE.LineSegments(lineGeom2, lineMaterial);
        scene.add(line2);
        objects.push(line2);

        // Cliff-top signal fire beacon platform - box platform
        geometry = new THREE.BoxGeometry(10, 1, 10);
        material = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-28, 25, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Signal fire beacon cone base
        geometry = new THREE.ConeGeometry(4, 6, 8);
        material = new THREE.MeshLambertMaterial({ color: 0x5A4A3A });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-28, 28, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Signal fire glow sphere
        geometry = new THREE.SphereGeometry(3.5, 12, 12);
        material = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-28, 36, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light for beacon glow
        var directionalLight = new THREE.DirectionalLight(0xFF8C00, 0.8);
        directionalLight.position.set(-28, 40, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation placeholder
        if (objects.length > 19 && objects[19]) {
            objects[19].rotation.y += delta * 0.3;
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
