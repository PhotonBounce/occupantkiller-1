window.LynmouthValley = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addbox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9440 + x, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9440 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9440 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9440 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildcliffs() {
        // Three massive cliff sections rising behind village
        addbox(15, 40, 10, 0x777060, -20, 20, -30);
        addbox(20, 35, 12, 0x777060, 0, 17, -38);
        addbox(25, 30, 8, 0x777060, 22, 15, -25);
    }

    function buildrailway() {
        // Cliff railway track rails at 45 degree angle (approximated by offset)
        // Rail 1
        addbox(0.3, 35, 0.3, 0x664422, -8, 10, -20);
        // Rail 2
        addbox(0.3, 35, 0.3, 0x664422, -5, 10, -18);
        // Car 1 - lower position
        var car1 = addbox(3, 2, 1.5, 0x884422, -6, -4, -14);
        car1.rotation.z = Math.PI / 4;
        // Car 2 - upper position
        var car2 = addbox(3, 2, 1.5, 0x884422, -7, 12, -22);
        car2.rotation.z = Math.PI / 4;
    }

    function buildharbour() {
        // Quay wall three sections
        addbox(6, 2, 2.5, 0x888870, 15, 1, 10);
        addbox(6, 2, 2.5, 0x888870, 21, 1, 8);
        addbox(6, 2, 2.5, 0x888870, 18, 1, 4);
        // Mooring boats - hulls
        addbox(3, 0.8, 1.5, 0x553322, 16, 0.4, 12);
        addbox(3, 0.8, 1.5, 0x553322, 19, 0.4, 14);
        addbox(3, 0.8, 1.5, 0x553322, 22, 0.4, 11);
    }

    function buildfloodmemorial() {
        // Memorial slab
        addbox(1.5, 0.1, 1.2, 0x888880, 5, 0.05, 5);
        // Bollards marking high water line
        addcyl(0.15, 0.15, 1.5, 8, 0x444444, 2, 0.75, 5);
        addcyl(0.15, 0.15, 1.5, 8, 0x444444, 3.5, 0.75, 5);
        addcyl(0.15, 0.15, 1.5, 8, 0x444444, 5, 0.75, 5);
        addcyl(0.15, 0.15, 1.5, 8, 0x444444, 6.5, 0.75, 5);
        addcyl(0.15, 0.15, 1.5, 8, 0x444444, 8, 0.75, 5);
    }

    function buildriver() {
        // East Lyn river
        addbox(3, 0.2, 30, 0x336688, -5, 0.1, -5);
        // West Lyn river converging
        addbox(3, 0.2, 25, 0x336688, 5, 0.1, -3);
    }

    function buildlynton() {
        // 8 Victorian buildings high up on cliff top (y=150)
        var colors = [0xCC9966, 0xBBAA77, 0xCC9966, 0xBBAA77, 0xCC9966, 0xBBAA77, 0xCC9966, 0xBBAA77];
        var positions = [
            [-30, 150, -50],
            [-22, 150, -52],
            [-14, 150, -48],
            [-6, 150, -54],
            [2, 150, -50],
            [10, 150, -52],
            [18, 150, -48],
            [26, 150, -50]
        ];
        for (var i = 0; i < 8; i++) {
            addbox(5, 7, 5, colors[i], positions[i][0], positions[i][1], positions[i][2]);
        }
    }

    function buildvalleyofrocks() {
        // 5 rocky tor stacks, each with 3 box sections
        var torpositions = [
            [40, 0, -40],
            [52, 0, -30],
            [60, 0, -45],
            [48, 0, -55],
            [35, 0, -55]
        ];
        for (var i = 0; i < 5; i++) {
            var bx = torpositions[i][0];
            var by = torpositions[i][1];
            var bz = torpositions[i][2];
            addbox(4, 8, 4, 0x888870, bx, by + 4, bz);
            addbox(3, 6, 3, 0x888870, bx + 0.5, by + 11, bz + 0.5);
            addbox(2, 4, 2, 0x888870, bx + 0.5, by + 16, bz + 0.5);
        }
    }

    function buildgoats() {
        // 4 wild goats on the rocky tors
        var goatpositions = [
            [41, 19, -40],
            [53, 19, -30],
            [61, 19, -45],
            [49, 19, -55]
        ];
        for (var i = 0; i < 4; i++) {
            var gx = goatpositions[i][0];
            var gy = goatpositions[i][1];
            var gz = goatpositions[i][2];
            // Body
            addbox(1, 0.7, 0.5, 0xDDDDCC, gx, gy, gz);
            // Head
            addsphere(0.3, 8, 8, 0xDDDDCC, gx, gy + 0.65, gz - 0.5);
            // Horn left
            addcyl(0.05, 0.05, 0.8, 6, 0xCCCCBB, gx - 0.15, gy + 1.0, gz - 0.5);
            // Horn right
            addcyl(0.05, 0.05, 0.8, 6, 0xCCCCBB, gx + 0.15, gy + 1.0, gz - 0.5);
        }
    }

    function buildrhenish() {
        // Rhenish Tower at harbour - round tower with cone roof
        addcyl(2, 2, 8, 12, 0x888870, 25, 4, 8);
        addcone(1.5, 3, 12, 0x666655, 25, 9.5, 8);
    }

    function buildwatersmeet() {
        // Watersmeet junction
        addbox(5, 0.3, 5, 0x44AACC, -10, 0.15, -15);
        // Tea rooms building
        addbox(8, 4, 5, 0x887755, -12, 2, -22);
    }

    function build() {
        buildcliffs();
        buildrailway();
        buildharbour();
        buildfloodmemorial();
        buildriver();
        buildlynton();
        buildvalleyofrocks();
        buildgoats();
        buildrhenish();
        buildwatersmeet();
    }

    function update(delta) {
    }

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
