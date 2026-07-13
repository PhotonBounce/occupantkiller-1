window.BodminTown = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 8760;
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

    function makecyl(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 10);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 10);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildgaol() {
        // Main wall 30x4x8
        makebox(30, 4, 8, 0x777060, 0, 2, 0);
        // Central gatehouse 8x6x14
        makebox(8, 6, 14, 0x777060, 0, 3, 0);
        // 4 corner turret cylinders 2r x 12h
        makecyl(2, 2, 12, 0x666050, -14, 6, -3);
        makecyl(2, 2, 12, 0x666050, 14, 6, -3);
        makecyl(2, 2, 12, 0x666050, -14, 6, 3);
        makecyl(2, 2, 12, 0x666050, 14, 6, 3);
    }

    function buildcellblocks() {
        // Cell block 1
        makebox(25, 5, 8, 0x666055, 0, 2.5, 18);
        // Cell block 2
        makebox(25, 5, 8, 0x666055, 0, 2.5, -18);
        // Barred windows block 1 - 6 per block
        makebox(0.8, 1.2, 0.1, 0x333333, -10, 3.5, 14);
        makebox(0.8, 1.2, 0.1, 0x333333, -6, 3.5, 14);
        makebox(0.8, 1.2, 0.1, 0x333333, -2, 3.5, 14);
        makebox(0.8, 1.2, 0.1, 0x333333, 2, 3.5, 14);
        makebox(0.8, 1.2, 0.1, 0x333333, 6, 3.5, 14);
        makebox(0.8, 1.2, 0.1, 0x333333, 10, 3.5, 14);
        // Barred windows block 2 - 6 per block
        makebox(0.8, 1.2, 0.1, 0x333333, -10, 3.5, -14);
        makebox(0.8, 1.2, 0.1, 0x333333, -6, 3.5, -14);
        makebox(0.8, 1.2, 0.1, 0x333333, -2, 3.5, -14);
        makebox(0.8, 1.2, 0.1, 0x333333, 2, 3.5, -14);
        makebox(0.8, 1.2, 0.1, 0x333333, 6, 3.5, -14);
        makebox(0.8, 1.2, 0.1, 0x333333, 10, 3.5, -14);
    }

    function buildchurch() {
        // Main nave 16x10x12
        makebox(16, 10, 12, 0x888870, 60, 5, 0);
        // Tower 6x6x18
        makebox(6, 18, 6, 0x888870, 68, 9, 0);
        // 4 buttress boxes 2x1x12
        makebox(2, 12, 1, 0x777760, 52, 6, -5);
        makebox(2, 12, 1, 0x777760, 52, 6, 5);
        makebox(2, 12, 1, 0x777760, 60, 6, -6);
        makebox(2, 12, 1, 0x777760, 60, 6, 6);
        // 3-window apse end
        makebox(1.2, 2, 0.1, 0x555560, 52, 6, -2);
        makebox(1.2, 2, 0.1, 0x555560, 52, 6, 0);
        makebox(1.2, 2, 0.1, 0x555560, 52, 6, 2);
    }

    function buildcourt() {
        // Classical Georgian building 18x12x9
        makebox(18, 12, 9, 0xCCBB99, -50, 6, 0);
        // 4 column cylinders 1r x 8h on portico
        makecyl(1, 1, 8, 0xDDCC99, -41, 4, -3);
        makecyl(1, 1, 8, 0xDDCC99, -41, 4, -1);
        makecyl(1, 1, 8, 0xDDCC99, -41, 4, 1);
        makecyl(1, 1, 8, 0xDDCC99, -41, 4, 3);
    }

    function buildmuseum() {
        // DCLI Museum former barracks 20x10x6
        makebox(20, 10, 6, 0x887766, -50, 5, 30);
        // Flag poles cylinder 0.15r x 6h x 2
        makecyl(0.15, 0.15, 6, 0x555544, -44, 3, 30);
        makecyl(0.15, 0.15, 6, 0x555544, -56, 3, 30);
        // Flag boxes
        makebox(2, 1, 0.1, 0xCC2222, -43, 5.5, 30);
        makebox(2, 1, 0.1, 0x2222CC, -55, 5.5, 30);
    }

    function buildrailway() {
        // Station building 15x6x5
        makebox(15, 6, 5, 0xCC7744, 0, 3, 50);
        // Platform boxes
        makebox(20, 0.5, 3, 0xAA9977, 0, 0.25, 55);
        makebox(15, 0.3, 2, 0xBBAA88, 0, 0.15, 48);
        // Signal post cylinder 0.2r x 5h
        makecyl(0.2, 0.2, 5, 0x444444, 10, 2.5, 50);
        // Signal arm box 0.2x0.3x2
        makebox(2, 0.3, 0.2, 0xDD3333, 11, 4.7, 50);
    }

    function buildtowncentre() {
        // 8 Georgian commercial buildings around cobbled square
        // alternating 0xBBAA88 / 0xDDCC99
        makebox(6, 5, 7, 0xBBAA88, 30, 2.5, -20);
        makebox(6, 5, 7, 0xDDCC99, 40, 2.5, -20);
        makebox(6, 5, 7, 0xBBAA88, 50, 2.5, -20);
        makebox(6, 5, 7, 0xDDCC99, 30, 2.5, -30);
        makebox(6, 5, 7, 0xBBAA88, 40, 2.5, -30);
        makebox(6, 5, 7, 0xDDCC99, 50, 2.5, -30);
        makebox(6, 5, 7, 0xBBAA88, 24, 2.5, -25);
        makebox(6, 5, 7, 0xDDCC99, 56, 2.5, -25);
    }

    function buildmemorial() {
        // Plinth 3x1x3
        makebox(3, 1, 3, 0x888880, 20, 0.5, -50);
        // Obelisk 1.5x8x1.5
        makebox(1.5, 8, 1.5, 0x888880, 20, 5, -50);
    }

    function buildberrytower() {
        // Ancient tower remnant box 4x4x10
        makebox(4, 10, 4, 0x888870, -20, 5, -50);
        // Partial roof cone 2r x 3h
        makecone(2, 3, 0x777760, -20, 11.5, -50);
    }

    function buildpark() {
        // 4 mature trees: trunk cylinder 0.4r x 5h + canopy sphere 4r
        // Tree 1
        makecyl(0.4, 0.4, 5, 0x554433, 30, 2.5, 30);
        makesphere(4, 0x447730, 30, 7, 30);
        // Tree 2
        makecyl(0.4, 0.4, 5, 0x554433, 38, 2.5, 30);
        makesphere(4, 0x447730, 38, 7, 30);
        // Tree 3
        makecyl(0.4, 0.4, 5, 0x554433, 30, 2.5, 38);
        makesphere(4, 0x447730, 30, 7, 38);
        // Tree 4
        makecyl(0.4, 0.4, 5, 0x554433, 38, 2.5, 38);
        makesphere(4, 0x447730, 38, 7, 38);
    }

    function build() {
        buildgaol();
        buildcellblocks();
        buildchurch();
        buildcourt();
        buildmuseum();
        buildrailway();
        buildtowncentre();
        buildmemorial();
        buildberrytower();
        buildpark();
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
