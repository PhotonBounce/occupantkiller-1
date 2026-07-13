window.LewesCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OFFSET_X = 6880;
    var OFFSET_Z = 0;

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

    function lines(geo, mat) {
        var l = new THREE.LineSegments(geo, mat);
        scene.add(l);
        objects.push(l);
        return l;
    }

    function lambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function box(w, h, d, color, x, y, z) {
        var m = mesh(new THREE.BoxGeometry(w, h, d), lambert(color));
        m.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return m;
    }

    function cylinder(rt, rb, h, segs, color, x, y, z) {
        var m = mesh(new THREE.CylinderGeometry(rt, rb, h, segs), lambert(color));
        m.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return m;
    }

    function cone(r, h, segs, color, x, y, z) {
        var m = mesh(new THREE.ConeGeometry(r, h, segs), lambert(color));
        m.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return m;
    }

    function sphere(r, ws, hs, color, x, y, z) {
        var m = mesh(new THREE.SphereGeometry(r, ws, hs), lambert(color));
        m.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return m;
    }

    function mound() {
        var color = 0x5A4A2A;
        box(28, 3, 28, color, 0, 1.5, 0);
        box(22, 3, 22, color, 0, 4.5, 0);
        box(18, 3, 18, color, 0, 7.5, 0);
        box(14, 3, 14, color, 0, 10.5, 0);
    }

    function keep() {
        var flint = 0xBBB8A0;
        var base = 12;
        var ground = 14;
        box(base, 16, base, flint, 0, ground + 8, 0);
        cylinder(3, 3, 18, 12, flint, -7, ground + 9, -7);
        cylinder(3, 3, 18, 12, flint,  7, ground + 9, -7);
        var merlonColor = flint;
        var merlonY = ground + 17.5;
        var positions = [
            [-5, -6], [-3, -6], [-1, -6], [1, -6], [3, -6], [5, -6],
            [-5,  6], [-3,  6], [-1,  6], [1,  6], [3,  6], [5,  6],
            [-6, -5], [-6, -3], [-6, -1], [-6, 1], [-6, 3], [-6, 5],
            [ 6, -5], [ 6, -3], [ 6, -1], [ 6, 1], [ 6, 3], [ 6, 5]
        ];
        for (var i = 0; i < positions.length; i++) {
            box(1.5, 1.5, 1.5, merlonColor, positions[i][0], merlonY, positions[i][1]);
        }
        var conePts = [[-7, -7], [7, -7]];
        for (var c = 0; c < conePts.length; c++) {
            cone(3.5, 4, 12, 0x886655, conePts[c][0], ground + 19, conePts[c][1]);
        }
    }

    function barbican() {
        var flint = 0xBBB8A0;
        var bx = 0;
        var bz = 22;
        box(5, 12, 5, flint, bx - 5, 6, bz);
        box(5, 12, 5, flint, bx + 5, 6, bz);
        box(12, 2, 3, flint, bx, 11, bz);
        box(3, 8, 3, flint, bx, 4, bz);
    }

    function highstreet() {
        var timber = 0x8B6914;
        var georgian = 0xF0EDE0;
        for (var i = 0; i < 14; i++) {
            var color = (i % 2 === 0) ? timber : georgian;
            var px = -65 + i * 10;
            var pz = 55;
            box(5, 8, 8, color, px, 4, pz);
            box(5.2, 0.5, 8.2, 0x554422, px, 8.25, pz);
            if (i % 2 === 0) {
                box(4.8, 4, 0.2, 0x3B2A0A, px, 6, pz - 4.1);
                box(0.2, 4, 4.8, 0x3B2A0A, px - 2.5, 6, pz);
                box(0.2, 4, 4.8, 0x3B2A0A, px + 2.5, 6, pz);
            }
        }
    }

    function glyndebourne() {
        var flint = 0xBBB8A0;
        var farmColor = 0xD4C5A0;
        var darkGreen = 0x1A3A1A;
        var gx = 120;
        var gz = -80;
        box(30, 10, 20, flint, gx, 5, gz);
        box(15, 8, 12, farmColor, gx - 22, 4, gz + 4);
        box(6, 14, 6, flint, gx + 12, 7, gz - 8);
        box(6, 14, 6, flint, gx - 12, 7, gz - 8);
        cone(4, 5, 4, 0x664422, gx + 12, 16.5, gz - 8);
        cone(4, 5, 4, 0x664422, gx - 12, 16.5, gz - 8);
        for (var h = 0; h < 8; h++) {
            var hx = gx - 30 + h * 8;
            box(3, 2, 3, darkGreen, hx, 1, gz + 16);
        }
    }

    function ouse() {
        box(60, 0.3, 8, 0x4477AA, -30, 0.15, -20);
    }

    function prison() {
        var wall = 0x886644;
        var block = 0x998855;
        var govColor = 0xAA9966;
        var px = -90;
        var pz = -40;
        box(40, 6, 2, wall, px, 3, pz - 20);
        box(40, 6, 2, wall, px, 3, pz + 20);
        box(2, 6, 40, wall, px - 20, 3, pz);
        box(2, 6, 40, wall, px + 20, 3, pz);
        box(2, 8, 2, wall, px - 20, 4, pz - 20);
        box(2, 8, 2, wall, px + 20, 4, pz - 20);
        box(2, 8, 2, wall, px - 20, 4, pz + 20);
        box(2, 8, 2, wall, px + 20, 4, pz + 20);
        box(25, 10, 12, block, px, 5, pz);
        box(12, 7, 10, govColor, px + 10, 3.5, pz - 10);
    }

    function bonfire() {
        var iron = 0x333322;
        var bfx = 40;
        var bfz = 60;
        cylinder(2, 2.5, 3, 12, iron, bfx, 1.5, bfz);
        box(0.4, 5, 0.4, iron, bfx - 2, 2.5, bfz - 1);
        box(0.4, 5, 0.4, iron, bfx + 2, 2.5, bfz - 1);
        box(0.4, 5, 0.4, iron, bfx, 2.5, bfz + 2);
        sphere(1.5, 8, 8, 0xCC4400, bfx, 4, bfz);
    }

    function grange() {
        var darkFlint = 0x555544;
        var gx = 60;
        var gz = -60;
        box(20, 8, 14, darkFlint, gx, 4, gz);
        box(8, 10, 6, darkFlint, gx - 12, 5, gz - 4);
        box(8, 10, 6, darkFlint, gx + 12, 5, gz - 4);
        cone(10, 5, 4, 0x443322, gx, 10.5, gz);
        cone(4, 4, 4, 0x443322, gx - 12, 12, gz - 4);
        cone(4, 4, 4, 0x443322, gx + 12, 12, gz - 4);
        for (var w = 0; w < 6; w++) {
            box(1.5, 4, 0.15, 0x332211, gx - 7.5 + w * 3, 6, gz - 7.1);
        }
    }

    function build() {
        mound();
        keep();
        barbican();
        highstreet();
        glyndebourne();
        ouse();
        prison();
        bonfire();
        grange();
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
