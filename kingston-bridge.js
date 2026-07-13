window.KingstonBridge = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 5880;
    var OZ = 0;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildbridge() {
        // 5 arch piers spaced along bridge
        var pierZ = [-20, -10, 0, 10, 20];
        for (var i = 0; i < 5; i++) {
            makebox(3, 8, 2, 0xC8B89A, 0, 4, pierZ[i]);
        }
        // road deck across top
        makebox(50, 1, 6, 0xC8B89A, 0, 8.5, 0);
        // bridge railings
        makebox(50, 1, 0.2, 0xB0A080, 0, 9.5, 3);
        makebox(50, 1, 0.2, 0xB0A080, 0, 9.5, -3);
    }

    function buildembankment() {
        // Thames riverside stone embankment wall
        makebox(60, 1, 2, 0xAA9988, 0, 0.5, 30);
        // additional embankment sections
        makebox(60, 0.3, 1, 0x998877, 0, 1.15, 30);
    }

    function buildmarket() {
        // 6 permanent market buildings in L-shape, each 8x6x5, old brick
        // Row of 4 along x axis
        makebox(8, 5, 6, 0x8B4022, -30, 2.5, -20);
        makebox(8, 5, 6, 0x8B4022, -20, 2.5, -20);
        makebox(8, 5, 6, 0x8B4022, -10, 2.5, -20);
        makebox(8, 5, 6, 0x8B4022, 0, 2.5, -20);
        // 2 more extending along z to form L
        makebox(8, 5, 6, 0x8B4022, 0, 2.5, -28);
        makebox(8, 5, 6, 0x8B4022, 0, 2.5, -36);

        // Central Coronation Stone plinth
        makebox(2, 3, 2, 0x999980, -15, 1.5, -28);
        // capstone on top
        makebox(2.4, 0.4, 2.4, 0x777760, -15, 3.2, -28);
    }

    function buildbentall() {
        // Bentall Centre large mall 45x25x9 modern glass-faced
        makebox(45, 9, 25, 0xAABBCC, 40, 4.5, -15);
        // entrance canopy
        makebox(12, 2, 4, 0x99AABB, 28, 9.5, -2);
        // side wing
        makebox(10, 7, 12, 0xBBCCDD, 63, 3.5, -15);
    }

    function buildguildhall() {
        // Georgian civic building 20x12x7
        makebox(20, 7, 12, 0xD4C9A8, -40, 3.5, -10);
        // clock tower 4x4x12
        makebox(4, 12, 4, 0xD4C9A8, -40, 10, -10);
        // ConeGeometry cap on clock tower
        makecone(3, 4, 6, 0xC4B898, -40, 18, -10);
        // portico columns (simplified as thin boxes)
        makebox(1, 7, 1, 0xE0D8C0, -46, 3.5, -7);
        makebox(1, 7, 1, 0xE0D8C0, -46, 3.5, -13);
    }

    function buildchurch() {
        // Kingston Parish Church 22x14x9 + tower 5x5x18 + spire
        makebox(22, 9, 14, 0xCCBBAA, -60, 4.5, 5);
        // tower
        makebox(5, 18, 5, 0xCCBBAA, -60, 9, 5);
        // ConeGeometry spire
        makecone(3, 10, 6, 0xBBAA99, -60, 23, 5);
        // buttresses
        makebox(2, 9, 2, 0xBBAA99, -66, 4.5, 5);
        makebox(2, 9, 2, 0xBBAA99, -54, 4.5, 5);
    }

    function buildpubs() {
        // 4 Georgian riverside pubs 10x8x7
        makebox(10, 7, 8, 0x2A5A2A, -20, 3.5, 38);
        makebox(10, 7, 8, 0xAA6633, -8, 3.5, 38);
        makebox(10, 7, 8, 0x2A5A2A, 4, 3.5, 38);
        makebox(10, 7, 8, 0xAA6633, 16, 3.5, 38);
        // pub signage boards (small boxes)
        makebox(3, 1, 0.2, 0xFFDD88, -20, 8, 34);
        makebox(3, 1, 0.2, 0xFFDD88, -8, 8, 34);
    }

    function buildboats() {
        // 5 boats on Thames: flat box hull + cabin
        var boatPositions = [
            [-15, 55],
            [-5, 58],
            [5, 52],
            [15, 56],
            [25, 54]
        ];
        for (var i = 0; i < 5; i++) {
            var bx = boatPositions[i][0];
            var bz = boatPositions[i][1];
            var hullColor = (i % 2 === 0) ? 0xCC4433 : 0x3344AA;
            // hull 8x3x1
            makebox(8, 1, 3, hullColor, bx, 0.5, bz);
            // cabin 4x2x1.5
            makebox(4, 1.5, 2, 0xDDCCAA, bx, 1.75, bz);
        }
    }

    function buildhampton() {
        // Hampton Court visible in distance
        // Large rectangular body 40x20x10, brick red
        makebox(40, 10, 20, 0x8B3A2A, 120, 5, -80);
        // 4 Tudor CylinderGeometry chimneys 1r x 8 tall
        makecyl(1, 1, 8, 8, 0x7A2A1A, 108, 14, -72);
        makecyl(1, 1, 8, 8, 0x7A2A1A, 116, 14, -72);
        makecyl(1, 1, 8, 8, 0x7A2A1A, 124, 14, -72);
        makecyl(1, 1, 8, 8, 0x7A2A1A, 132, 14, -72);
        // gatehouse
        makebox(8, 14, 8, 0x8B3A2A, 120, 7, -68);
        // gatehouse turrets
        makecyl(1.2, 1.2, 6, 8, 0x7A2A1A, 116, 17, -68);
        makecyl(1.2, 1.2, 6, 8, 0x7A2A1A, 124, 17, -68);
    }

    function buildextras() {
        // Street lamps along bridge road
        makecyl(0.15, 0.15, 5, 6, 0x888888, -18, 2.5, -3);
        makecyl(0.15, 0.15, 5, 6, 0x888888, -6, 2.5, -3);
        makecyl(0.15, 0.15, 5, 6, 0x888888, 6, 2.5, -3);
        makecyl(0.15, 0.15, 5, 6, 0x888888, 18, 2.5, -3);
        // lamp heads
        makesphere(0.3, 6, 4, 0xFFFFCC, -18, 5.5, -3);
        makesphere(0.3, 6, 4, 0xFFFFCC, -6, 5.5, -3);
        makesphere(0.3, 6, 4, 0xFFFFCC, 6, 5.5, -3);
        makesphere(0.3, 6, 4, 0xFFFFCC, 18, 5.5, -3);
        // Market stalls (temporary boxes)
        makebox(3, 2, 3, 0xCC8844, -25, 1, -25);
        makebox(3, 2, 3, 0x44CC88, -30, 1, -30);
        // Thames river surface markers
        makebox(60, 0.2, 40, 0x2255AA, 0, 0, 55);
        // Riverside benches
        makebox(2, 0.5, 0.6, 0x886633, -10, 0.75, 32);
        makebox(2, 0.5, 0.6, 0x886633, 0, 0.75, 32);
        makebox(2, 0.5, 0.6, 0x886633, 10, 0.75, 32);
    }

    function build() {
        buildbridge();
        buildembankment();
        buildmarket();
        buildbentall();
        buildguildhall();
        buildchurch();
        buildpubs();
        buildboats();
        buildhampton();
        buildextras();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
