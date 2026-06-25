window.SkipnessDock = (function() {
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
        var geometry, material, mesh;

        // Terrain base - Kilbrannan Sound box terrain
        geometry = new THREE.BoxGeometry(100, 2, 100);
        material = new THREE.MeshLambertMaterial({color: 0x4a6741});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -1, 0);
        scene.add(mesh);
        objects.push(mesh);

        // Skipness Castle tower strongpoint - main tower
        geometry = new THREE.BoxGeometry(15, 25, 15);
        material = new THREE.MeshLambertMaterial({color: 0x8b7355});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 12, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Skipness Castle curtain wall - left section
        geometry = new THREE.BoxGeometry(30, 8, 2);
        material = new THREE.MeshLambertMaterial({color: 0x8b7355});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-35, 4, -35);
        scene.add(mesh);
        objects.push(mesh);

        // Skipness Castle curtain wall - right section
        geometry = new THREE.BoxGeometry(30, 8, 2);
        material = new THREE.MeshLambertMaterial({color: 0x8b7355});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-35, 4, -5);
        scene.add(mesh);
        objects.push(mesh);

        // Chapel ruins - ruined nave walls left
        geometry = new THREE.BoxGeometry(12, 6, 2);
        material = new THREE.MeshLambertMaterial({color: 0x9d8b7e});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(10, 3, -25);
        scene.add(mesh);
        objects.push(mesh);

        // Chapel ruins - ruined nave walls right
        geometry = new THREE.BoxGeometry(12, 6, 2);
        material = new THREE.MeshLambertMaterial({color: 0x9d8b7e});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(10, 3, -15);
        scene.add(mesh);
        objects.push(mesh);

        // Chapel bell cote - cone tower
        geometry = new THREE.ConeGeometry(5, 8, 8);
        material = new THREE.MeshLambertMaterial({color: 0xa0826d});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(10, 6, -20);
        scene.add(mesh);
        objects.push(mesh);

        // Secret submarine resupply dock - concrete pen
        geometry = new THREE.BoxGeometry(20, 10, 15);
        material = new THREE.MeshLambertMaterial({color: 0x6b7280});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(28, 5, 10);
        scene.add(mesh);
        objects.push(mesh);

        // Submarine conning tower - cylinder above water
        geometry = new THREE.CylinderGeometry(4, 4, 6, 8);
        material = new THREE.MeshLambertMaterial({color: 0x2f4f4f});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(28, 12, 10);
        scene.add(mesh);
        objects.push(mesh);

        // Kilbrannan Sound torpedo range buoy 1
        geometry = new THREE.SphereGeometry(2, 8, 8);
        material = new THREE.MeshLambertMaterial({color: 0xdc143c});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(25, 1, 25);
        scene.add(mesh);
        objects.push(mesh);

        // Kilbrannan Sound torpedo range buoy 2
        geometry = new THREE.SphereGeometry(2, 8, 8);
        material = new THREE.MeshLambertMaterial({color: 0xdc143c});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(15, 1, 30);
        scene.add(mesh);
        objects.push(mesh);

        // Kilbrannan Sound torpedo range buoy 3
        geometry = new THREE.SphereGeometry(2, 8, 8);
        material = new THREE.MeshLambertMaterial({color: 0xdc143c});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 1, 28);
        scene.add(mesh);
        objects.push(mesh);

        // Torpedo range tracking cables - line segments
        var buoyPoints = [];
        buoyPoints.push(new THREE.Vector3(25, 1, 25));
        buoyPoints.push(new THREE.Vector3(15, 1, 30));
        buoyPoints.push(new THREE.Vector3(5, 1, 28));
        var lineGeometry = new THREE.BufferGeometry().setFromPoints(buoyPoints);
        material = new THREE.LineBasicMaterial({color: 0x404040});
        mesh = new THREE.LineSegments(lineGeometry, material);
        scene.add(mesh);
        objects.push(mesh);

        // Glenreasdale ambush position - stone wall left flank
        geometry = new THREE.BoxGeometry(2, 6, 20);
        material = new THREE.MeshLambertMaterial({color: 0x696969});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-22, 3, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Glenreasdale ambush position - stone wall right flank
        geometry = new THREE.BoxGeometry(2, 6, 20);
        material = new THREE.MeshLambertMaterial({color: 0x696969});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-8, 3, 15);
        scene.add(mesh);
        objects.push(mesh);

        // Emergency landing field markers - cone 1
        geometry = new THREE.ConeGeometry(2, 4, 6);
        material = new THREE.MeshLambertMaterial({color: 0xffd700});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 2, 5);
        scene.add(mesh);
        objects.push(mesh);

        // Emergency landing field markers - cone 2
        geometry = new THREE.ConeGeometry(2, 4, 6);
        material = new THREE.MeshLambertMaterial({color: 0xffd700});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 2, 20);
        scene.add(mesh);
        objects.push(mesh);

        // Emergency landing field centreline - line segments
        var fieldPoints = [];
        fieldPoints.push(new THREE.Vector3(-30, 2.1, 5));
        fieldPoints.push(new THREE.Vector3(-30, 2.1, 20));
        var fieldLineGeometry = new THREE.BufferGeometry().setFromPoints(fieldPoints);
        material = new THREE.LineBasicMaterial({color: 0xffff00});
        mesh = new THREE.LineSegments(fieldLineGeometry, material);
        scene.add(mesh);
        objects.push(mesh);

        // Salmon river crossing defense - stepping stone platform 1
        geometry = new THREE.BoxGeometry(6, 1, 6);
        material = new THREE.MeshLambertMaterial({color: 0x8b7355});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(5, 0.5, -5);
        scene.add(mesh);
        objects.push(mesh);

        // Salmon river crossing defense - stepping stone platform 2
        geometry = new THREE.BoxGeometry(6, 1, 6);
        material = new THREE.MeshLambertMaterial({color: 0x8b7355});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(15, 0.5, -5);
        scene.add(mesh);
        objects.push(mesh);

        // Salmon river crossing defense - explosive boulder 1 upstream
        geometry = new THREE.SphereGeometry(3, 8, 8);
        material = new THREE.MeshLambertMaterial({color: 0x333333});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(8, 1, -15);
        scene.add(mesh);
        objects.push(mesh);

        // Salmon river crossing defense - explosive boulder 2 upstream
        geometry = new THREE.SphereGeometry(3, 8, 8);
        material = new THREE.MeshLambertMaterial({color: 0x333333});
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(12, 1, -18);
        scene.add(mesh);
        objects.push(mesh);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic can be added here
        // For now, static environment
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
