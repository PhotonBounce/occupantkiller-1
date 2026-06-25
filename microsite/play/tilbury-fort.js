window.TilburyFort = (function() {
    'use strict';

    var group = null;
    var OFFSET_X = 4520;
    var OFFSET_Z = 2200;

    function makeBox(w, h, d, color, x, y, z, parent) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        parent.add(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, color, x, y, z, parent) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        parent.add(mesh);
        return mesh;
    }

    function buildFortCourtyard(parent) {
        makeBox(20, 4, 20, 0xD2B48C, 0, 2, 0, parent);
        makeBox(20, 6, 2, 0xD2B48C, 0, 3, -11, parent);
        makeBox(20, 6, 2, 0xD2B48C, 0, 3, 11, parent);
        makeBox(2, 6, 20, 0xD2B48C, -11, 3, 0, parent);
        makeBox(2, 6, 20, 0xD2B48C, 11, 3, 0, parent);
    }

    function buildBastion(parent, bx, bz, angle) {
        var geo = new THREE.BoxGeometry(8, 5, 8);
        var mat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + bx, 2.5, OFFSET_Z + bz);
        mesh.rotation.y = angle;
        parent.add(mesh);
        var tipGeo = new THREE.BoxGeometry(3, 4, 3);
        var tipMat = new THREE.MeshLambertMaterial({ color: 0xC4A882 });
        var tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(OFFSET_X + bx, 5, OFFSET_Z + bz);
        tip.rotation.y = angle;
        parent.add(tip);
    }

    function buildFortBastions(parent) {
        buildBastion(parent, 0, -20, 0);
        buildBastion(parent, 19, -10, Math.PI * 0.2);
        buildBastion(parent, 19, 10, -Math.PI * 0.2);
        buildBastion(parent, -19, -10, Math.PI * 0.8);
        buildBastion(parent, -19, 10, -Math.PI * 0.8);
    }

    function buildMoat(parent) {
        makeBox(60, 1, 60, 0x4682B4, 0, 0.5, 0, parent);
        makeBox(50, 0.2, 50, 0x1E5F8A, 0, 0.6, 0, parent);
    }

    function buildWaterGate(parent) {
        makeBox(10, 8, 1, 0xFFF8DC, 0, 4, -35, parent);
        makeBox(6, 8, 0.5, 0xEEE8AA, 0, 4, -35.1, parent);
        makeBox(2, 10, 1, 0xFFF8DC, -6, 5, -35, parent);
        makeBox(2, 10, 1, 0xFFF8DC, 6, 5, -35, parent);
        makeBox(1, 2, 1, 0xFFD700, -6, 10.5, -35, parent);
        makeBox(1, 2, 1, 0xFFD700, 6, 10.5, -35, parent);
        makeBox(1, 2, 1, 0xFFD700, 0, 9.5, -35, parent);
        makeBox(12, 1, 2, 0xFFF8DC, 0, 8.5, -35, parent);
    }

    function buildArmadaspeechmonument(parent) {
        makeBox(3, 0.5, 3, 0x808080, 30, 0.25, -15, parent);
        makeBox(1, 4, 1, 0x999999, 30, 2.5, -15, parent);
        makeBox(2, 0.5, 2, 0xAAAAAA, 30, 4.75, -15, parent);
        var textGeo = new THREE.BoxGeometry(2.5, 1.5, 0.2);
        var textMat = new THREE.MeshLambertMaterial({ color: 0xC8C8C8 });
        var plaque = new THREE.Mesh(textGeo, textMat);
        plaque.position.set(OFFSET_X + 30, 1.5, OFFSET_Z - 15.5);
        parent.add(plaque);
    }

    function buildContainerport(parent) {
        var colors = [0xFF0000, 0x0000FF, 0x008000, 0xFF6600, 0xFFFF00, 0x8B008B];
        var ci = 0;
        var row, col;
        for (row = 0; row < 6; row++) {
            for (col = 0; col < 10; col++) {
                var cx = 80 + col * 7;
                var cz = -60 + row * 5;
                var clr = colors[ci % colors.length];
                ci++;
                makeBox(6, 3, 4, clr, cx, 1.5, cz, parent);
                if (row % 2 === 0) {
                    makeBox(6, 3, 4, colors[(ci + 2) % colors.length], cx, 4.5, cz, parent);
                    ci++;
                }
            }
        }
    }

    function buildCranegantry(parent, gx, gz) {
        makeBox(2, 20, 2, 0x808080, gx - 15, 10, gz, parent);
        makeBox(2, 20, 2, 0x808080, gx + 15, 10, gz, parent);
        makeBox(32, 2, 2, 0x808080, gx, 21, gz, parent);
        makeBox(2, 4, 2, 0x606060, gx, 23, gz, parent);
        makeBox(1, 12, 1, 0xA0A0A0, gx - 8, 15, gz, parent);
        makeBox(1, 12, 1, 0xA0A0A0, gx + 8, 15, gz, parent);
    }

    function buildCranegantries(parent) {
        buildCranegantry(parent, 90, -80);
        buildCranegantry(parent, 130, -80);
        buildCranegantry(parent, 170, -80);
    }

    function buildThames(parent) {
        makeBox(200, 1, 80, 0x4169E1, 60, 0.1, 40, parent);
        makeBox(200, 0.3, 76, 0x3158C4, 60, 0.4, 40, parent);
        makeBox(200, 0.1, 72, 0x28488E, 60, 0.5, 40, parent);
    }

    function buildPowerstationchimneys(parent) {
        makeCylinder(2, 2.5, 28, 0xC0C0C0, 200, 14, -20, parent);
        makeCylinder(2, 2.5, 28, 0xC0C0C0, 214, 14, -20, parent);
        makeBox(30, 12, 20, 0xB0B0B0, 207, 6, -20, parent);
        makeBox(28, 8, 18, 0xA8A8A8, 207, 4, -20, parent);
    }

    function buildQE2bridge(parent) {
        var bx = 50;
        var bz = 60;
        makeBox(4, 24, 4, 0xD0D0D0, bx - 20, 12, bz, parent);
        makeBox(4, 24, 4, 0xD0D0D0, bx + 20, 12, bz, parent);
        makeBox(44, 2, 8, 0xC8C8C8, bx, 5, bz, parent);
        makeBox(1, 18, 1, 0xB0B0B0, bx - 14, 18, bz, parent);
        makeBox(1, 14, 1, 0xB0B0B0, bx - 8, 20, bz, parent);
        makeBox(1, 10, 1, 0xB0B0B0, bx - 2, 20, bz, parent);
        makeBox(1, 14, 1, 0xB0B0B0, bx + 8, 20, bz, parent);
        makeBox(1, 18, 1, 0xB0B0B0, bx + 14, 18, bz, parent);
        makeBox(1, 10, 1, 0xB0B0B0, bx + 2, 20, bz, parent);
        makeBox(2, 26, 2, 0xE0E0E0, bx - 20, 13, bz, parent);
        makeBox(2, 26, 2, 0xE0E0E0, bx + 20, 13, bz, parent);
    }

    function buildGravesend(parent) {
        var gz = 100;
        makeBox(6, 16, 6, 0xDEB887, -20, 8, gz, parent);
        makeBox(5, 5, 5, 0xC8A87A, -20, 18.5, gz, parent);
        makeBox(2, 4, 2, 0xB8987A, -20, 23, gz, parent);
        var i;
        for (i = 0; i < 8; i++) {
            makeBox(8, 10, 7, 0xCD853F, -50 + i * 12, 5, gz, parent);
            makeBox(8, 2, 7, 0x8B6914, -50 + i * 12, 11, gz, parent);
            makeBox(1.5, 3, 0.3, 0xB8860B, -53 + i * 12, 6, gz - 3.5, parent);
            makeBox(1.5, 3, 0.3, 0xB8860B, -47 + i * 12, 6, gz - 3.5, parent);
        }
        makeBox(200, 2, 10, 0x556B2F, 0, 1, gz - 5, parent);
    }

    function buildWWIIgunemplacements(parent) {
        makeBox(8, 1, 8, 0x556B2F, -25, 0.5, -25, parent);
        makeCylinder(0.5, 0.8, 6, 0x556B2F, -25, 4, -25, parent);
        makeBox(3, 1.5, 3, 0x4A5E28, -25, 1.5, -25, parent);
        makeBox(8, 1, 8, 0x556B2F, 25, 0.5, -25, parent);
        makeCylinder(0.5, 0.8, 6, 0x556B2F, 25, 4, -25, parent);
        makeBox(3, 1.5, 3, 0x4A5E28, 25, 1.5, -25, parent);
        makeBox(8, 1, 8, 0x556B2F, -25, 0.5, 25, parent);
        makeCylinder(0.5, 0.8, 6, 0x556B2F, -25, 4, 25, parent);
        makeBox(3, 1.5, 3, 0x4A5E28, -25, 1.5, 25, parent);
    }

    function buildSailingbarge(parent, bx, bz) {
        makeBox(12, 2, 4, 0x8B4513, bx, 1.5, bz, parent);
        makeBox(10, 1, 3, 0x7A3B10, bx, 2.5, bz, parent);
        makeBox(0.5, 8, 0.5, 0x5C3317, bx - 2, 6, bz, parent);
        makeBox(4, 6, 0.2, 0xCC2200, bx, 6, bz, parent);
        makeBox(0.5, 6, 0.5, 0x5C3317, bx + 3, 5, bz, parent);
        makeBox(3, 5, 0.2, 0xBB1100, bx + 4.5, 5, bz, parent);
        makeBox(12, 0.5, 1, 0x6B3410, bx, 2.8, bz - 1.5, parent);
        makeBox(12, 0.5, 1, 0x6B3410, bx, 2.8, bz + 1.5, parent);
    }

    function buildSailingbarges(parent) {
        buildSailingbarge(parent, -30, 20);
        buildSailingbarge(parent, -45, 25);
        buildSailingbarge(parent, -15, 22);
    }

    function buildGround(parent) {
        makeBox(400, 0.5, 300, 0x7CBA6A, 50, -0.25, 0, parent);
    }

    function init(scene) {
        group = new THREE.Group();
        buildGround(group);
        buildMoat(group);
        buildFortCourtyard(group);
        buildFortBastions(group);
        buildWaterGate(group);
        buildArmadaspeechmonument(group);
        buildContainerport(group);
        buildCranegantries(group);
        buildThames(group);
        buildPowerstationchimneys(group);
        buildQE2bridge(group);
        buildGravesend(group);
        buildWWIIgunemplacements(group);
        buildSailingbarges(group);
        scene.add(group);
    }

    function update(delta) {
    }

    function reset() {
        if (group) {
            var i;
            for (i = group.children.length - 1; i >= 0; i--) {
                var child = group.children[i];
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    child.material.dispose();
                }
                group.remove(child);
            }
        }
    }

    return { init: init, update: update, reset: reset };
}());
