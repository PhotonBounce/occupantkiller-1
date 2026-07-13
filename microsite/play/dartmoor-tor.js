window.DartmoorTor = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 9000;
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

    function makecylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 6);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function haytor() {
        // Main pillar
        makebox(8, 15, 6, 0x888870, 0, 7.5, 0);
        // Secondary pillar
        makebox(6, 12, 5, 0x888870, 10, 6, 0);
        // Cap boulders
        makebox(3, 2, 4, 0x888870, -1, 16, 1);
        makebox(4, 3, 3, 0x888870, 2, 17.5, -1);
        makebox(3, 2, 3, 0x888870, 10, 13.5, 1);
        makebox(2, 2, 2, 0x888870, 8, 14, -2);
    }

    function moorland() {
        makebox(100, 0.5, 80, 0x5A6A30, 0, -0.25, 0);
    }

    function grimspound() {
        var cx = -30;
        var cz = 20;
        var radius = 12;
        // 8 wall sections forming a ring
        var angles = [0, 45, 90, 135, 180, 225, 270, 315];
        for (var i = 0; i < angles.length; i++) {
            var ang = angles[i] * Math.PI / 180;
            var wx = cx + Math.cos(ang) * radius;
            var wz = cz + Math.sin(ang) * radius;
            var geo = new THREE.BoxGeometry(1.5, 1, 2);
            var mat = new THREE.MeshLambertMaterial({ color: 0x998866 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(OX + wx, 0.5, OZ + wz);
            mesh.rotation.y = ang;
            scene.add(mesh);
            objects.push(mesh);
        }
        // 6 hut circles inside
        var hutPositions = [
            [-32, 18], [-28, 22], [-30, 15],
            [-34, 24], [-26, 18], [-31, 26]
        ];
        for (var h = 0; h < hutPositions.length; h++) {
            var hx = hutPositions[h][0];
            var hz = hutPositions[h][1];
            // 8 arc box sections for each hut circle
            for (var s = 0; s < 8; s++) {
                var sang = s * 45 * Math.PI / 180;
                var sr = 2;
                var sx = hx + Math.cos(sang) * sr;
                var sz = hz + Math.sin(sang) * sr;
                var hgeo = new THREE.BoxGeometry(0.4, 0.6, 0.9);
                var hmat = new THREE.MeshLambertMaterial({ color: 0x998866 });
                var hmesh = new THREE.Mesh(hgeo, hmat);
                hmesh.position.set(OX + sx, 0.3, OZ + sz);
                hmesh.rotation.y = sang;
                scene.add(hmesh);
                objects.push(hmesh);
            }
        }
    }

    function ponies() {
        var ponydata = [
            [15, 5], [17, 8], [13, 11],
            [20, 3], [22, 7], [18, 12]
        ];
        for (var p = 0; p < ponydata.length; p++) {
            var px = ponydata[p][0];
            var pz = ponydata[p][1];
            // Body
            makebox(1.5, 0.9, 0.7, 0x4A3020, px, 0.7, pz);
            // Neck
            makecylinder(0.25, 0.25, 0.6, 0x4A3020, px + 0.6, 1.35, pz);
            // Head
            makesphere(0.35, 0x4A3020, px + 0.85, 1.75, pz);
            // 4 legs
            makecylinder(0.15, 0.15, 0.7, 0x4A3020, px - 0.4, 0.15, pz - 0.2);
            makecylinder(0.15, 0.15, 0.7, 0x4A3020, px + 0.4, 0.15, pz - 0.2);
            makecylinder(0.15, 0.15, 0.7, 0x4A3020, px - 0.4, 0.15, pz + 0.2);
            makecylinder(0.15, 0.15, 0.7, 0x4A3020, px + 0.4, 0.15, pz + 0.2);
        }
    }

    function stonerow() {
        // 12 standing stones in a 30m straight row
        var stonewidths = [0.3, 0.4, 0.3, 0.5, 0.4, 0.3, 0.5, 0.4, 0.3, 0.4, 0.5, 0.3];
        var stoneheights = [1.5, 2.0, 1.8, 2.5, 1.6, 2.2, 1.9, 2.4, 1.5, 2.1, 2.3, 1.7];
        for (var i = 0; i < 12; i++) {
            var sw = stonewidths[i];
            var sh = stoneheights[i];
            makebox(sw, sh, sw, 0x998866, -40 + i * 2.7, sh / 2, -10);
        }
    }

    function rangewarning() {
        var postpos = [
            [5, 30], [-5, 32], [8, 25],
            [12, 28], [0, 35], [-8, 27]
        ];
        for (var i = 0; i < postpos.length; i++) {
            var px = postpos[i][0];
            var pz = postpos[i][1];
            // Red post
            makecylinder(0.15, 0.15, 2, 0xCC2222, px, 1, pz);
            // White stripe
            makecylinder(0.16, 0.16, 0.3, 0xFFFFFF, px, 1.8, pz);
            // Danger sign (flat box)
            makebox(0.6, 0.4, 0.05, 0xCC2222, px, 2.3, pz);
        }
    }

    function prison() {
        // Main prison block
        makebox(30, 12, 8, 0x666655, -10, 6, -35);
        // Perimeter wall
        makebox(40, 5, 0.5, 0x666655, -10, 2.5, -30);
        makebox(40, 5, 0.5, 0x666655, -10, 2.5, -42);
        makebox(0.5, 5, 12, 0x666655, 10, 2.5, -36);
        makebox(0.5, 5, 12, 0x666655, -30, 2.5, -36);
        // Guard towers at corners
        makebox(4, 8, 4, 0x666655, 10, 4, -30);
        makebox(4, 8, 4, 0x666655, -30, 4, -30);
        makebox(4, 8, 4, 0x666655, 10, 4, -42);
        makebox(4, 8, 4, 0x666655, -30, 4, -42);
    }

    function stream() {
        // 3 stream sections
        makebox(2, 0.2, 20, 0x445577, 35, 0.1, -5);
        makebox(2, 0.2, 20, 0x445577, 37, 0.1, 15);
        makebox(2, 0.2, 20, 0x445577, 36, 0.1, 35);
        // 4 stepping stones
        makebox(0.8, 0.3, 0.8, 0x888877, 35.5, 0.25, 3);
        makebox(0.8, 0.3, 0.8, 0x888877, 36, 0.25, 5);
        makebox(0.8, 0.3, 0.8, 0x888877, 36.5, 0.25, 7);
        makebox(0.8, 0.3, 0.8, 0x888877, 37, 0.25, 9);
    }

    function kistvaen() {
        // 4 upright stones
        makebox(0.3, 0.8, 0.3, 0x777066, -50, 0.4, 15);
        makebox(0.3, 0.8, 0.3, 0x777066, -50, 0.4, 16.5);
        makebox(0.3, 0.8, 0.3, 0x777066, -48.5, 0.4, 15);
        makebox(0.3, 0.8, 0.3, 0x777066, -48.5, 0.4, 16.5);
        // Flat cap slab
        makebox(2, 0.3, 1.5, 0x777066, -49.25, 1.05, 15.75);
    }

    function tramway() {
        // 12 stone rail blocks spaced along track
        for (var i = 0; i < 12; i++) {
            makebox(1, 0.3, 2, 0x777066, -20 + i * 3.5, 0.15, -20);
        }
    }

    function build() {
        moorland();
        haytor();
        grimspound();
        ponies();
        stonerow();
        rangewarning();
        prison();
        stream();
        kistvaen();
        tramway();
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        objects = [];
        scene = null;
        camera = null;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    return { init: init, update: update, reset: reset };
}());
