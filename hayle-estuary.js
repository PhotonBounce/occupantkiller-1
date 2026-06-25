window.HayleEstuary = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 8560;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 6);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildestuary();
        buildhides();
        buildreeds();
        buildbridge();
        buildfoundry();
        buildquay();
        buildestate();
        buildbirds();
        buildbeach();
        buildrailway();
    }

    function buildestuary() {
        // Large tidal flat at low tide
        makebox(80, 0.5, 50, 0xA09070, 0, -0.25, 0);
    }

    function buildhides() {
        // 3 observation hides along the estuary edge
        var hidePositions = [
            [-25, 20],
            [0, 22],
            [25, 20]
        ];
        for (var i = 0; i < hidePositions.length; i++) {
            var hx = hidePositions[i][0];
            var hz = hidePositions[i][1];
            // Main hide body
            makebox(3, 2.5, 2, 0x5A3820, hx, 1.25, hz);
            // Observation slot
            makebox(1.5, 0.2, 0.3, 0x3A2010, hx, 1.8, hz - 1.0);
            // Ramp approach
            makebox(1.5, 0.15, 1.5, 0x6A4830, hx, 0.075, hz + 1.75);
        }
    }

    function buildreeds() {
        // 12 reed clusters in tidal pools
        var reedSpots = [
            [-30, -10], [-20, -5], [-10, -12], [5, -8],
            [15, -15], [25, -6], [-35, 5], [-15, 8],
            [0, 10], [20, 3], [30, 8], [-5, -18]
        ];
        for (var i = 0; i < reedSpots.length; i++) {
            var rx = reedSpots[i][0];
            var rz = reedSpots[i][1];
            // Reed stem
            makecylinder(0.1, 0.1, 2.5, 0x5A4A20, rx, 1.25, rz);
            // Bulrush top
            makesphere(0.3, 0x5A4A20, rx, 2.65, rz);
        }
    }

    function buildbridge() {
        // Stone arch bridge over the estuary
        // 3 main box sections
        makebox(8, 2, 3, 0x887060, -10, 1.0, -25);
        makebox(8, 2, 3, 0x887060, 0, 1.0, -25);
        makebox(8, 2, 3, 0x887060, 10, 1.0, -25);
        // 2 arch-support cylinders
        makecylinder(1.5, 1.5, 3, 0x887060, -5, 1.5, -25);
        makecylinder(1.5, 1.5, 3, 0x887060, 5, 1.5, -25);
    }

    function buildfoundry() {
        // Harvey's Foundry ruins - roofless stone walls
        // Outer shell wall sections (no roof, just walls)
        makebox(20, 6, 1, 0x777060, 0, 3.0, -40);
        makebox(20, 6, 1, 0x777060, 0, 3.0, -50);
        makebox(1, 6, 10, 0x777060, -10, 3.0, -45);
        makebox(1, 6, 10, 0x777060, 10, 3.0, -45);
        // Inner partition
        makebox(15, 6, 1, 0x777060, 0, 3.0, -44);
        makebox(8, 5, 1, 0x777060, -6, 2.5, -47);
        // Rusting metal roof remnants
        makebox(8, 0.3, 4, 0x664433, -5, 6.15, -41);
        makebox(6, 0.3, 3, 0x664433, 4, 6.15, -49);
    }

    function buildquay() {
        // Stone quay wall
        makebox(30, 2, 2, 0x666655, 0, 1.0, -30);
        // 4 bollard cylinders on the quay
        var bollardX = [-12, -4, 4, 12];
        for (var i = 0; i < 4; i++) {
            makecylinder(0.4, 0.4, 1.5, 0x444444, bollardX[i], 2.75, -30);
        }
    }

    function buildestate() {
        // Causeway trading estate - 4 modern box units
        var unitPositions = [
            [-30, -55],
            [-14, -55],
            [2, -55],
            [18, -55]
        ];
        for (var i = 0; i < unitPositions.length; i++) {
            makebox(15, 5, 8, 0x889988, unitPositions[i][0], 2.5, unitPositions[i][1]);
        }
    }

    function buildbirds() {
        // 6 wading bird figures in estuary mud
        var birdSpots = [
            [-8, 5], [2, -3], [12, 7],
            [-18, -2], [8, -10], [-3, 12]
        ];
        for (var i = 0; i < birdSpots.length; i++) {
            var bx = birdSpots[i][0];
            var bz = birdSpots[i][1];
            // Bird body sphere
            makesphere(0.2, 0xCCCCCC, bx, 1.1, bz);
            // Two legs
            makecylinder(0.05, 0.05, 1.5, 0xCCCCCC, bx - 0.1, 0.35, bz);
            makecylinder(0.05, 0.05, 1.5, 0xCCCCCC, bx + 0.1, 0.35, bz);
        }
    }

    function buildbeach() {
        // St Ives Bay beach pale sand strip at estuary mouth
        makebox(60, 0.5, 15, 0xF5E6A0, 5, -0.25, 30);
    }

    function buildrailway() {
        // Coastal railway line - 2 parallel rails
        makebox(0.2, 0.1, 60, 0x555555, -0.5, 0.1, -20);
        makebox(0.2, 0.1, 60, 0x555555, 0.5, 0.1, -20);
        // Sleeper boxes every 2 units along 60 unit length
        for (var i = 0; i < 30; i++) {
            makebox(1.5, 0.15, 0.3, 0x664422, 0, 0.075, -49 + i * 2);
        }
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
