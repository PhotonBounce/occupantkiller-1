window.FolkestoneLeas = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 6640;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function mesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = new THREE.Mesh(geometry, mat);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function lines(geometry, color) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(geometry, mat);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function cliff() {
        var i, m, geo;
        for (i = 0; i < 3; i++) {
            geo = new THREE.BoxGeometry(60, 0.3, 12);
            m = mesh(geo, 0xEEEBDA);
            m.position.set(OFFSET_X + 0, 8 + i * 0.3, -6);
        }
    }

    function bandstand() {
        var i, col, geo, m;
        geo = new THREE.CylinderGeometry(5, 5, 1, 16);
        m = mesh(geo, 0x1A4A1A);
        m.position.set(OFFSET_X + 10, 9.5, 5);
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
            col = mesh(geo, 0x1A4A1A);
            col.position.set(
                OFFSET_X + 10 + Math.cos(angle) * 4.5,
                12,
                5 + Math.sin(angle) * 4.5
            );
        }
        geo = new THREE.ConeGeometry(6, 3, 16);
        m = mesh(geo, 0x1A4A1A);
        m.position.set(OFFSET_X + 10, 15.5, 5);
    }

    function shelter() {
        var geo = new THREE.BoxGeometry(30, 4, 5);
        var m = mesh(geo, 0x2A3A2A);
        m.position.set(OFFSET_X - 10, 10, 8);
    }

    function harbour() {
        var geo, m;
        geo = new THREE.BoxGeometry(4, 1, 60);
        m = mesh(geo, 0x888877);
        m.position.set(OFFSET_X + 40, 0.5, 30);

        geo = new THREE.CylinderGeometry(1.5, 1.5, 10, 12);
        m = mesh(geo, 0x888877);
        m.position.set(OFFSET_X + 40, 5.5, 60);

        geo = new THREE.ConeGeometry(2, 3, 12);
        m = mesh(geo, 0xCC2222);
        m.position.set(OFFSET_X + 40, 12, 60);
    }

    function quarter() {
        var colors = [0xCC4422, 0x2244CC, 0x228833, 0xCC4422, 0x2244CC, 0x228833,
                      0xCC4422, 0x2244CC, 0x228833, 0xCC4422, 0x2244CC, 0x228833];
        var i, geo, m;
        for (i = 0; i < 12; i++) {
            geo = new THREE.BoxGeometry(4, 5, 6);
            m = mesh(geo, colors[i]);
            m.position.set(OFFSET_X - 30 + (i % 6) * 6, 2.5, 10 + Math.floor(i / 6) * 8);
        }
    }

    function terminal() {
        var geo = new THREE.BoxGeometry(50, 20, 8);
        var m = mesh(geo, 0x446688);
        m.position.set(OFFSET_X - 60, 10, -20);
    }

    function funicular() {
        var geo, m;
        geo = new THREE.BoxGeometry(2, 20, 2);
        m = mesh(geo, 0x8B6914);
        m.position.set(OFFSET_X + 25, 9, -2);
        m.rotation.z = Math.PI * 0.15;

        geo = new THREE.BoxGeometry(2, 2, 2);
        m = mesh(geo, 0x8B6914);
        m.position.set(OFFSET_X + 24, 18, -2);

        geo = new THREE.BoxGeometry(2, 2, 2);
        m = mesh(geo, 0x8B6914);
        m.position.set(OFFSET_X + 26, 2, -2);
    }

    function hotel() {
        var geo, m, i, angle;
        geo = new THREE.BoxGeometry(30, 15, 10);
        m = mesh(geo, 0xF5F5F0);
        m.position.set(OFFSET_X - 5, 7.5, 18);

        for (i = 0; i < 3; i++) {
            geo = new THREE.SphereGeometry(2, 12, 8);
            m = mesh(geo, 0xF5F5F0);
            m.position.set(OFFSET_X - 10 + i * 10, 16, 18);
        }
    }

    function sea() {
        var geo, m;
        geo = new THREE.BoxGeometry(80, 0.3, 15);
        m = mesh(geo, 0xF4E0A0);
        m.position.set(OFFSET_X, 0, 50);

        geo = new THREE.BoxGeometry(80, 0.3, 20);
        m = mesh(geo, 0x4488BB);
        m.position.set(OFFSET_X, 0, 70);
    }

    function build() {
        cliff();
        bandstand();
        shelter();
        harbour();
        quarter();
        terminal();
        funicular();
        hotel();
        sea();
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
