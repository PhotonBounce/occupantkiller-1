window.SykeCamp = (function() {
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
        // Stream (represented as blue line segments)
        var streamGeometry = new THREE.BufferGeometry();
        var streamPositions = new Float32Array([
            -40, 0, -30,
            -30, 0, -20,
            -20, 0, -10,
            -10, 0, 0,
            0, 0, 10,
            10, 0, 20,
            20, 0, 30,
            30, 0, 35,
            40, 0, 40
        ]);
        streamGeometry.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
        var streamMaterial = new THREE.LineBasicMaterial({ color: 0x0066cc });
        var streamLines = new THREE.LineSegments(streamGeometry, streamMaterial);
        objects.push(streamLines);
        scene.add(streamLines);

        // Obstacle Course: Box Hurdles
        var hurdle1 = createBoxHurdle(-25, 0, -25, 8, 2, 1, 0xff6600);
        var hurdle2 = createBoxHurdle(-15, 0, -20, 8, 2.5, 1, 0xff8800);
        var hurdle3 = createBoxHurdle(-5, 0, -15, 8, 2, 1, 0xff6600);
        var hurdle4 = createBoxHurdle(5, 0, -10, 8, 2.2, 1, 0xff8800);

        // Climbing Poles (cylinders)
        var pole1 = createClimbingPole(-30, 0, 5, 4);
        var pole2 = createClimbingPole(-10, 0, 10, 4.5);
        var pole3 = createClimbingPole(15, 0, 15, 4);

        // Rope Crawl Net (line segments forming net pattern)
        var net = createRopeCrawlNet(25, 0, -5);

        // Training Barracks Row (box buildings)
        var barracks1 = createBarracks(-35, 0, 20, 0xcc8844);
        var barracks2 = createBarracks(-20, 0, 22, 0xbb7733);
        var barracks3 = createBarracks(-5, 0, 20, 0xcc8844);

        // Weapon Cleaning Station (benches made of boxes)
        var bench1 = createBench(10, 0, 25);
        var bench2 = createBench(25, 0, 25);

        // Parade Ground Bollards (box posts)
        var bollard1 = createBollard(-15, 0, -5, 0x444444);
        var bollard2 = createBollard(0, 0, 0, 0x555555);
        var bollard3 = createBollard(15, 0, -5, 0x444444);
        var bollard4 = createBollard(-15, 0, 5, 0x555555);

        // NCO Command Tent (cone top + box base)
        var tent = createCommandTent(0, 0, 35);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        lights.push(ambientLight);
        scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 40, 40);
        lights.push(directionalLight);
        scene.add(directionalLight);
    }

    function createBoxHurdle(x, y, z, width, height, depth, color) {
        var geometry = new THREE.BoxGeometry(width, height, depth);
        var material = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + height / 2, z);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function createClimbingPole(x, y, z, height) {
        var geometry = new THREE.CylinderGeometry(0.3, 0.3, height, 16);
        var material = new THREE.MeshLambertMaterial({ color: 0x664400 });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + height / 2, z);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function createRopeCrawlNet(x, y, z) {
        var netGeometry = new THREE.BufferGeometry();
        var netPositions = new Float32Array([
            x - 3, y + 2, z, x + 3, y + 2, z,
            x - 3, y + 2, z + 3, x + 3, y + 2, z + 3,
            x - 3, y + 2, z + 6, x + 3, y + 2, z + 6,
            x - 3, y + 2, z, x - 3, y + 2, z + 6,
            x + 3, y + 2, z, x + 3, y + 2, z + 6,
            x - 2, y + 2, z, x - 2, y + 2, z + 6,
            x, y + 2, z, x, y + 2, z + 6,
            x + 2, y + 2, z, x + 2, y + 2, z + 6
        ]);
        netGeometry.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));
        var netMaterial = new THREE.LineBasicMaterial({ color: 0x999999 });
        var netLines = new THREE.LineSegments(netGeometry, netMaterial);
        objects.push(netLines);
        scene.add(netLines);
        return netLines;
    }

    function createBarracks(x, y, z, color) {
        var geometry = new THREE.BoxGeometry(10, 3, 5);
        var material = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 1.5, z);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function createBench(x, y, z) {
        var geometry = new THREE.BoxGeometry(6, 0.5, 1.5);
        var material = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 0.25, z);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function createBollard(x, y, z, color) {
        var geometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
        var material = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y + 0.75, z);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function createCommandTent(x, y, z) {
        // Cone top
        var coneGeometry = new THREE.ConeGeometry(3, 4, 16);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0x663333 });
        var cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.set(x, y + 4, z);
        objects.push(cone);
        scene.add(cone);

        // Box base
        var baseGeometry = new THREE.BoxGeometry(6, 2, 6);
        var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x775544 });
        var base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, y + 1, z);
        objects.push(base);
        scene.add(base);

        return { cone: cone, base: base };
    }

    function update(delta) {
        // Animation logic here if needed
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
