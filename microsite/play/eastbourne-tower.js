window.EastbourneTower = (function() {
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

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = mesh(geo, mat);
        m.position.set(x, y, z);
        return m;
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = mesh(geo, mat);
        m.position.set(x, y, z);
        return m;
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var m = mesh(geo, mat);
        m.position.set(x, y, z);
        return m;
    }

    function build() {
        var ox = 6840;
        var oz = 0;

        // --- Beach ---
        box(80, 0.3, 18, 0x888877, ox + 0, 0, oz + 8);

        // --- Sea ---
        box(80, 0.3, 25, 0x4488BB, ox + 0, -0.1, oz - 14);

        // --- Eastbourne Pier ---
        // Approach building
        box(15, 8, 7, 0x8B6914, ox + 0, 4, oz + 15);
        // Pier deck
        box(3, 0.8, 80, 0xA08020, ox + 0, 2.4, oz - 23);
        // 8 support legs under deck
        var legPositions = [-35, -28, -21, -14, -7, 0, 7, 14];
        for (var i = 0; i < legPositions.length; i++) {
            cyl(0.5, 0.5, 5, 8, 0x7A6010, ox + 0, 0, oz + legPositions[i]);
        }
        // Pier head theatre at end
        box(15, 10, 7, 0x8B6914, ox + 0, 5, oz - 59);

        // --- Beachy Head Lighthouse ---
        var lhx = ox + 28;
        var lhz = oz - 5;
        // White main tower
        cyl(3, 3, 22, 12, 0xF5F5F5, lhx, 11, lhz);
        // Red horizontal stripe bands
        box(7, 2.5, 7, 0xCC2222, lhx, 5, lhz);
        box(7, 2.5, 7, 0xCC2222, lhx, 11, lhz);
        box(7, 2.5, 7, 0xCC2222, lhx, 17, lhz);
        // Lantern cap
        cone(2, 3, 8, 0x333333, lhx, 24, lhz);
        // Lantern room (sphere-like with cylinder)
        cyl(2.2, 2.2, 2, 12, 0x88CCFF, lhx, 23, lhz);

        // --- Beachy Head Chalk Cliff ---
        var cliffZ = oz - 15;
        box(60, 0.3, 16, 0xEEEBDA, ox - 10, 0.15, cliffZ);
        box(60, 5, 12, 0xEEEBDA, ox - 10, 3, cliffZ - 1);
        box(60, 10, 8, 0xEEEBDA, ox - 10, 9, cliffZ - 2);
        box(60, 15, 5, 0xEEEBDA, ox - 10, 19, cliffZ - 3);

        // --- Seafront Grand Parade — 5 Victorian hotels ---
        var hotelPositions = [-36, -18, 0, 18, 36];
        for (var j = 0; j < hotelPositions.length; j++) {
            box(20, 15, 11, 0xF5F5F0, ox + hotelPositions[j], 7.5, oz + 24);
        }

        // --- Bandstand ---
        var bsx = ox + 22;
        var bsz = oz + 10;
        cyl(6, 6, 1, 5, 0x1A4A1A, bsx, 0.5, bsz);
        // Columns (5-sided, one per side)
        for (var k = 0; k < 5; k++) {
            var angle = (k / 5) * Math.PI * 2;
            var cx = bsx + Math.cos(angle) * 5;
            var cz = bsz + Math.sin(angle) * 5;
            cyl(0.2, 0.2, 3, 6, 0x2A6A2A, cx, 2.5, cz);
        }
        // Conical roof
        cone(7, 3, 5, 0x1A4A1A, bsx, 5.5, bsz);

        // --- Eastbourne Town Hall ---
        box(25, 18, 12, 0xE8E0D0, ox - 22, 9, oz + 30);
        // Baroque dome
        cyl(3, 3, 4, 12, 0xD8D0C0, ox - 22, 20, oz + 30);
        cone(3, 5, 12, 0xC8C0B0, ox - 22, 24, oz + 30);
        // Portico columns
        for (var tc = 0; tc < 4; tc++) {
            cyl(0.3, 0.3, 6, 8, 0xF0E8D8, ox - 30 + tc * 3, 3, oz + 24);
        }

        // --- Congress Theatre ---
        box(22, 18, 8, 0x778899, ox + 18, 9, oz + 30);
        // Flat roof detail
        box(24, 0.5, 10, 0x667788, ox + 18, 18.25, oz + 30);
        // Window bands
        box(20, 2, 0.5, 0xAABBCC, ox + 18, 8, oz + 26);
        box(20, 2, 0.5, 0xAABBCC, ox + 18, 13, oz + 26);

        // --- Lifeboat Station ---
        box(12, 8, 5, 0x003399, ox - 32, 4, oz + 10);
        // RNLI orange trim
        box(12, 0.5, 5, 0xFF6600, ox - 32, 8.25, oz + 10);
        // Slipway
        box(4, 0.3, 8, 0x666655, ox - 32, 0.15, oz + 5);
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
