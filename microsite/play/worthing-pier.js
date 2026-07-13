window.WorthingPier = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 6960;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function mesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = new THREE.Mesh(geo, mat);
        return m;
    }

    function add(m, x, y, z) {
        m.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function pier() {
        // Approach pavilion 12x8x6
        var approachPavilion = mesh(new THREE.BoxGeometry(12, 6, 8), 0x8B6914);
        add(approachPavilion, 0, 3, -5);

        // Pier deck 3x0.8x60
        var deck = mesh(new THREE.BoxGeometry(3, 0.8, 60), 0x8B6914);
        add(deck, 0, 5.4, -39);

        // 10 iron support legs CylinderGeometry 0.4r x 5
        for (var i = 0; i < 10; i++) {
            var leg = mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), 0x555544);
            add(leg, -1, 2.5, -12 - i * 5);
            var leg2 = mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), 0x555544);
            add(leg2, 1, 2.5, -12 - i * 5);
        }

        // Pier head pavilion 20x10x7
        var headPavilion = mesh(new THREE.BoxGeometry(20, 7, 10), 0x8B6914);
        add(headPavilion, 0, 8.5, -74);
    }

    function seafront() {
        // Beach shingle 80x0.3x18
        var beach = mesh(new THREE.BoxGeometry(80, 0.3, 18), 0x888877);
        add(beach, 0, 0.15, 9);

        // Sea 80x0.3x25
        var sea = mesh(new THREE.BoxGeometry(80, 0.3, 25), 0x4488BB);
        add(sea, 0, 0.0, -12.5);
    }

    function huts() {
        var colors = [0xFF4444, 0x4444FF, 0x44BB44, 0xFFAA00, 0xFF44AA, 0x44FFFF, 0xAA44FF];
        for (var i = 0; i < 14; i++) {
            var color = colors[i % colors.length];
            var hut = mesh(new THREE.BoxGeometry(2.5, 2, 3), color);
            add(hut, -32 + i * 5, 1, 17);

            // Roof cone
            var roof = mesh(new THREE.ConeGeometry(2, 1.5, 4), color);
            add(roof, -32 + i * 5, 3.75, 17);
        }
    }

    function townhall() {
        // Main building 25x18x8 cream
        var body = mesh(new THREE.BoxGeometry(25, 8, 18), 0xF0EDE0);
        add(body, 40, 4, 40);

        // Drum for dome 5x4x5
        var drum = mesh(new THREE.BoxGeometry(5, 4, 5), 0xF0EDE0);
        add(drum, 40, 10, 40);

        // Green copper dome SphereGeometry r5
        var dome = mesh(new THREE.SphereGeometry(5, 12, 8), 0x4A8A6A);
        add(dome, 40, 16, 40);
    }

    function library() {
        // Worthing Library brutalist 20x15x9
        var lib = mesh(new THREE.BoxGeometry(20, 9, 15), 0x888880);
        add(lib, 75, 4.5, 45);
    }

    function terraces() {
        // 3 rows x 8 houses 6x9x10 cream stucco
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 8; col++) {
                var house = mesh(new THREE.BoxGeometry(6, 9, 10), 0xF5F0E0);
                add(house, -50 + col * 7, 4.5, 30 + row * 12);

                // Roof
                var rooftop = mesh(new THREE.BoxGeometry(6, 2, 10), 0xCC9966);
                add(rooftop, -50 + col * 7, 10, 30 + row * 12);
            }
        }
    }

    function cissbury() {
        // Raised hill: 4 stacked boxes forming mound
        var base = mesh(new THREE.BoxGeometry(80, 6, 60), 0x7A6B4A);
        add(base, 120, 3, -120);

        var mid = mesh(new THREE.BoxGeometry(60, 5, 45), 0x7A6B4A);
        add(mid, 120, 8.5, -120);

        var upper = mesh(new THREE.BoxGeometry(45, 4, 34), 0x7A6B4A);
        add(upper, 120, 13, -120);

        var top = mesh(new THREE.BoxGeometry(30, 3, 22), 0x7A6B4A);
        add(top, 120, 17.5, -120);

        // Iron Age rampart walls inner ring 30x1.5x2
        var innerFront = mesh(new THREE.BoxGeometry(30, 1.5, 2), 0x6B5A3A);
        add(innerFront, 120, 20, -109);

        var innerBack = mesh(new THREE.BoxGeometry(30, 1.5, 2), 0x6B5A3A);
        add(innerBack, 120, 20, -131);

        var innerLeft = mesh(new THREE.BoxGeometry(2, 1.5, 20), 0x6B5A3A);
        add(innerLeft, 105, 20, -120);

        var innerRight = mesh(new THREE.BoxGeometry(2, 1.5, 20), 0x6B5A3A);
        add(innerRight, 135, 20, -120);

        // Outer ring 40x1.5x2
        var outerFront = mesh(new THREE.BoxGeometry(40, 1.5, 2), 0x6B5A3A);
        add(outerFront, 120, 19, -101);

        var outerBack = mesh(new THREE.BoxGeometry(40, 1.5, 2), 0x6B5A3A);
        add(outerBack, 120, 19, -139);

        var outerLeft = mesh(new THREE.BoxGeometry(2, 1.5, 36), 0x6B5A3A);
        add(outerLeft, 100, 19, -120);

        var outerRight = mesh(new THREE.BoxGeometry(2, 1.5, 36), 0x6B5A3A);
        add(outerRight, 140, 19, -120);
    }

    function retailpark() {
        // Lyons Farm retail park: 4 retail warehouses 30x15x7
        for (var i = 0; i < 4; i++) {
            var warehouse = mesh(new THREE.BoxGeometry(30, 7, 15), 0x446699);
            add(warehouse, -60 + i * 35, 3.5, 80);
        }
    }

    function church() {
        // Goring-by-Sea parish church 12x8x7
        var nave = mesh(new THREE.BoxGeometry(12, 7, 8), 0xBBB8A0);
        add(nave, -90, 3.5, 50);

        // Tower 3x3x10
        var tower = mesh(new THREE.BoxGeometry(3, 10, 3), 0xBBB8A0);
        add(tower, -84, 5, 50);

        // Tower pinnacle
        var pinnacle = mesh(new THREE.ConeGeometry(2, 3, 4), 0xBBB8A0);
        add(pinnacle, -84, 11.5, 50);
    }

    function edges(obj) {
        var geo = new THREE.EdgesGeometry(obj.geometry);
        var line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.15, transparent: true }));
        line.position.copy(obj.position);
        scene.add(line);
        objects.push(line);
    }

    function build() {
        pier();
        seafront();
        huts();
        townhall();
        library();
        terraces();
        cissbury();
        retailpark();
        church();
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
