window.DealCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 6520;
    var OZ = 0;

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

    function add(m) {
        scene.add(m);
        objects.push(m);
        return m;
    }

    function place(m, x, y, z) {
        m.position.set(OX + x, y, OZ + z);
        return m;
    }

    function edges(geo, color) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(new THREE.EdgesGeometry(geo), mat);
        return ls;
    }

    function build() {
        var i, angle, x, z, geo, m;

        // 1. Central keep
        geo = new THREE.CylinderGeometry(6, 6, 8, 12);
        m = mesh(geo, 0xCC9966);
        place(m, 0, 4, 0);
        add(m);

        // 2. Inner ring of 6 bastions around keep
        for (i = 0; i < 6; i++) {
            angle = (i / 6) * Math.PI * 2;
            x = Math.cos(angle) * 11;
            z = Math.sin(angle) * 11;
            geo = new THREE.CylinderGeometry(3, 3, 6, 10);
            m = mesh(geo, 0xCC9966);
            place(m, x, 3, z);
            add(m);
        }

        // 3. Outer ring of 12 bastions
        for (i = 0; i < 12; i++) {
            angle = (i / 12) * Math.PI * 2;
            x = Math.cos(angle) * 22;
            z = Math.sin(angle) * 22;
            geo = new THREE.CylinderGeometry(2, 2, 5, 8);
            m = mesh(geo, 0xBBAA88);
            place(m, x, 2.5, z);
            add(m);
        }

        // 4. Outer wall — 12 box sections between outer bastions
        for (i = 0; i < 12; i++) {
            var a0 = (i / 12) * Math.PI * 2;
            var a1 = ((i + 1) / 12) * Math.PI * 2;
            var x0 = Math.cos(a0) * 22;
            var z0 = Math.sin(a0) * 22;
            var x1 = Math.cos(a1) * 22;
            var z1 = Math.sin(a1) * 22;
            var cx = (x0 + x1) / 2;
            var cz = (z0 + z1) / 2;
            var dx = x1 - x0;
            var dz = z1 - z0;
            var len = Math.sqrt(dx * dx + dz * dz);
            geo = new THREE.BoxGeometry(len, 4, 1.2);
            m = mesh(geo, 0xBBAA88);
            place(m, cx, 2, cz);
            m.rotation.y = -Math.atan2(dz, dx);
            add(m);
        }

        // 5. Dry moat — 4 box sections forming ring
        var moatSegs = [
            [0, 0, 60, 0],
            [0, 0, -60, 0],
            [0, -60, 0, 90],
            [0, 60, 0, 90]
        ];
        for (i = 0; i < moatSegs.length; i++) {
            geo = new THREE.BoxGeometry(60, 0.5, 4);
            m = mesh(geo, 0x553322);
            place(m, moatSegs[i][1], -0.25, moatSegs[i][2]);
            m.rotation.y = moatSegs[i][3] * (Math.PI / 180);
            add(m);
        }

        // 6. Time Ball Tower — cylinder + sphere ball
        geo = new THREE.CylinderGeometry(3, 3, 14, 10);
        m = mesh(geo, 0x333322);
        place(m, 40, 7, -5);
        add(m);

        geo = new THREE.SphereGeometry(2.5, 10, 8);
        m = mesh(geo, 0x222211);
        place(m, 40, 15.5, -5);
        add(m);

        // 7. Deal beach
        geo = new THREE.BoxGeometry(80, 0.3, 18);
        m = mesh(geo, 0x888880);
        place(m, 0, 0.15, 35);
        add(m);

        // 8. Sea
        geo = new THREE.BoxGeometry(80, 0.3, 20);
        m = mesh(geo, 0x4488BB);
        place(m, 0, 0.1, 53);
        add(m);

        // 9. Victorian seafront — 8 hotels/houses
        for (i = 0; i < 8; i++) {
            geo = new THREE.BoxGeometry(10, 9, 8);
            m = mesh(geo, 0xF0EDE0);
            place(m, -35 + i * 10, 4.5, 20);
            add(m);
        }

        // 10. Deal pier entrance — 2 pavilions + pier deck
        geo = new THREE.BoxGeometry(8, 6, 5);
        m = mesh(geo, 0x8B6914);
        place(m, -5, 3, 43);
        add(m);

        geo = new THREE.BoxGeometry(8, 6, 5);
        m = mesh(geo, 0x8B6914);
        place(m, 5, 3, 43);
        add(m);

        geo = new THREE.BoxGeometry(3, 0.8, 50);
        m = mesh(geo, 0x8B6914);
        place(m, 0, 0.4, 68);
        add(m);

        // 11. Naval memorial — obelisk on plinth
        geo = new THREE.BoxGeometry(3, 2, 3);
        m = mesh(geo, 0xCCCCBB);
        place(m, -20, 1, 15);
        add(m);

        geo = new THREE.BoxGeometry(1, 12, 1);
        m = mesh(geo, 0xCCCCBB);
        place(m, -20, 8, 15);
        add(m);
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
