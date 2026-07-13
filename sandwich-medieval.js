window.SandwichMedieval = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 6560;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function mesh(geo, mat) {
        var m = new THREE.Mesh(geo, mat);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = mesh(geo, mat);
        m.position.set(OX + x, y, OZ + z);
        return m;
    }

    function cylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = mesh(geo, mat);
        m.position.set(OX + x, y, OZ + z);
        return m;
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = mesh(geo, mat);
        m.position.set(OX + x, y, OZ + z);
        return m;
    }

    function sphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = mesh(geo, mat);
        m.position.set(OX + x, y, OZ + z);
        return m;
    }

    function wire(geo, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: 0x333333, wireframe: false });
        var edges = new THREE.LineSegments(
            new THREE.BoxGeometry(geo[0], geo[1], geo[2]),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        edges.position.set(OX + x, y, OZ + z);
        scene.add(edges);
        objects.push(edges);
        return edges;
    }

    function barbican() {
        var stone = 0xBBAA88;
        var dark = 0x333322;
        // Left tower
        box(6, 12, 6, stone, -5.5, 6, 0);
        // Right tower
        box(6, 12, 6, stone, 5.5, 6, 0);
        // Gate lintel top
        box(5, 2, 1.5, stone, 0, 10, 0);
        // Gate side walls (thin reveals)
        box(1, 8, 1.5, stone, -2.5, 5, 0);
        box(1, 8, 1.5, stone, 2.5, 5, 0);
        // Portcullis recess (dark box inside passage)
        box(3, 6, 0.5, dark, 0, 4, -0.5);
        // Battlements on towers
        for (var i = -2; i <= 2; i++) {
            box(1, 1.5, 1, stone, -5.5 + i, 13, -2.5);
            box(1, 1.5, 1, stone, 5.5 + i, 13, -2.5);
        }
        // Connecting wall above gate
        box(5, 2, 1.5, stone, 0, 12, 0);
    }

    function walls() {
        var c = 0xBBB8A0;
        // North wall
        box(20, 6, 1.5, c, 0, 3, -30);
        // South wall
        box(20, 6, 1.5, c, 0, 3, 30);
        // East wall
        box(1.5, 6, 20, c, 30, 3, 0);
        // West wall partial
        box(1.5, 6, 20, c, -30, 3, 0);
    }

    function stpeters() {
        var flint = 0xBBB8A0;
        // Nave
        box(18, 9, 12, flint, 60, 4.5, -20);
        // Norman round tower
        cylinder(4, 4, 14, 12, flint, 60, 7, -32);
        // Cone cap
        cone(4.5, 5, 12, 0x886644, 60, 16.5, -32);
    }

    function stclements() {
        var flint = 0xBBB8A0;
        // Nave
        box(16, 8, 10, flint, -60, 4, 20);
        // Tower
        box(4, 16, 4, flint, -60, 8, 10);
        // Tower cap
        box(5, 1, 5, flint, -60, 16.5, 10);
    }

    function guildhall() {
        var timber = 0x4A3A2A;
        var plaster = 0xF5EDD0;
        // Main body plaster
        box(15, 7, 10, plaster, 0, 3.5, 60);
        // Timber frame verticals (front)
        for (var i = -2; i <= 2; i++) {
            box(0.4, 7, 0.4, timber, i * 3, 3.5, 55.2);
        }
        // Timber horizontals (front)
        box(15, 0.4, 0.4, timber, 0, 0.5, 55.2);
        box(15, 0.4, 0.4, timber, 0, 3.5, 55.2);
        box(15, 0.4, 0.4, timber, 0, 6.8, 55.2);
        // Jetty overhang
        box(16, 0.5, 1, timber, 0, 3.75, 55);
        // Roof
        box(16, 2, 11, 0x6B4423, 0, 8.5, 60);
    }

    function stour() {
        // River Stour
        box(60, 0.3, 8, 0x4477AA, 0, 0.15, 80);
    }

    function houses() {
        var colors = [0x8B6914, 0xF0EDE0];
        for (var i = 0; i < 10; i++) {
            var c = colors[i % 2];
            var xPos = -22 + i * 5;
            var zPos = -55;
            // Ground floor
            box(5, 4, 7, 0xF0EDE0, xPos, 2, zPos);
            // Jettied upper floor (slightly wider)
            box(5.8, 4, 7.5, c, xPos, 6, zPos);
            // Roof
            box(6, 2, 8, 0x6B4423, xPos, 9, zPos);
            // Timber framing on upper
            box(0.3, 4, 0.3, 0x3A2A1A, xPos - 2.5, 6, zPos - 3.5);
            box(0.3, 4, 0.3, 0x3A2A1A, xPos + 2.5, 6, zPos - 3.5);
        }
    }

    function quay() {
        var stone = 0xBBB8A0;
        // Quay wall
        box(40, 3, 0.5, stone, 0, 1.5, 76);
        // Mooring posts
        for (var i = 0; i < 4; i++) {
            cylinder(0.3, 0.3, 3, 8, 0x5C4033, -15 + i * 10, 1.5, 77);
        }
    }

    function tollgate() {
        var flint = 0xBBB8A0;
        // Ground floor
        box(6, 3, 5, flint, 40, 1.5, 0);
        // Upper floor
        box(6, 3, 5, flint, 40, 4.5, 0);
        // Gate arch (dark recess)
        box(2, 2.5, 0.5, 0x332211, 40, 1.25, -2.5);
        // Roof
        box(7, 1.5, 6, 0x6B4423, 40, 6.75, 0);
    }

    function build() {
        barbican();
        walls();
        stpeters();
        stclements();
        guildhall();
        stour();
        houses();
        quay();
        tollgate();
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
