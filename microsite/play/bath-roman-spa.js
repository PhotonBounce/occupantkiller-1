window.BathRomanSpa = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 9840;
    var OZ = 0;

    function makebox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, segs, color, x, y, z, ry) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        if (ry) mesh.rotation.y = ry;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildbaths();
        buildabbey();
        buildcrescent();
        buildpulteney();
        buildavon();
        buildpumproom();
        buildcircus();
        buildthermae();
        buildbathstreet();
        buildsallylunn();
    }

    function buildbaths() {
        // Great Bath pool flat box
        makebox(18, 0.3, 12, 0x44AA55, 0, 0.15, 0);
        // Museum building around it
        makebox(30, 12, 8, 0xBBAA88, 0, 6, 0);
        // Entablature box
        makebox(22, 0.5, 2, 0xCCBB99, 0, 5.5, -5);
        // Colonnade columns: 5 on each long side
        var ci;
        for (ci = 0; ci < 5; ci++) {
            makecyl(0.5, 0.5, 5, 8, 0xDDCC99, -8 + ci * 4, 2.5, -6);
            makecyl(0.5, 0.5, 5, 8, 0xDDCC99, -8 + ci * 4, 2.5, 6);
        }
        // Roman lead pipes (small cylinders)
        makecyl(0.2, 0.2, 1, 6, 0x556655, -4, 0.5, 2);
        makecyl(0.2, 0.2, 1, 6, 0x556655, 0, 0.5, 2);
        makecyl(0.2, 0.2, 1, 6, 0x556655, 4, 0.5, 2);
        makecyl(0.2, 0.2, 1, 6, 0x556655, -4, 0.5, -2);
    }

    function buildabbey() {
        var ax = 60;
        var az = 10;
        // Nave
        makebox(32, 16, 12, 0xDDCC99, ax, 8, az);
        // Central tower
        makebox(6, 22, 6, 0xDDCC99, ax, 11, az);
        // West front fan vault niche panels left side
        makebox(3, 4, 0.3, 0xCCBB88, ax - 6, 10, az - 6);
        makebox(3, 4, 0.3, 0xCCBB88, ax - 3, 10, az - 6);
        // West front fan vault niche panels right side
        makebox(3, 4, 0.3, 0xCCBB88, ax + 3, 10, az - 6);
        makebox(3, 4, 0.3, 0xCCBB88, ax + 6, 10, az - 6);
        // Flying buttresses diagonal
        makebox(6, 1, 1, 0xCCBB99, ax - 12, 9, az - 4, 0, 0.5, -0.3);
        makebox(6, 1, 1, 0xCCBB99, ax + 12, 9, az - 4, 0, -0.5, -0.3);
        makebox(6, 1, 1, 0xCCBB99, ax - 12, 9, az + 4, 0, -0.5, 0.3);
        makebox(6, 1, 1, 0xCCBB99, ax + 12, 9, az + 4, 0, 0.5, 0.3);
    }

    function buildcrescent() {
        var rx = -80;
        var rz = -60;
        var ri;
        var angle;
        var rad = 50;
        for (ri = 0; ri < 10; ri++) {
            angle = -0.6 + ri * 0.13;
            var sx = rx + Math.sin(angle) * rad;
            var sz = rz + Math.cos(angle) * rad - rad;
            makebox(8, 10, 10, 0xEEDDAA, sx, 5, sz, 0, angle, 0);
            // Ground floor columns per section (2 per section)
            makecyl(0.4, 0.4, 4, 8, 0xDDCC99, sx + Math.cos(angle) * 2, 2, sz - Math.sin(angle) * 2);
            makecyl(0.4, 0.4, 4, 8, 0xDDCC99, sx - Math.cos(angle) * 2, 2, sz + Math.sin(angle) * 2);
        }
    }

    function buildpulteney() {
        var px = 30;
        var pz = -30;
        // Bridge deck
        makebox(30, 0.5, 8, 0xDDCC99, px, 1.25, pz);
        // Arch shapes below deck
        makebox(4, 3, 1, 0xBBAA88, px - 8, -0.5, pz);
        makebox(4, 3, 1, 0xBBAA88, px, -0.5, pz);
        makebox(4, 3, 1, 0xBBAA88, px + 8, -0.5, pz);
        // Shops on bridge (8 boxes)
        var si;
        for (si = 0; si < 4; si++) {
            makebox(2, 4, 5, 0xEEDDAA, px - 10 + si * 7, 3, pz - 2);
            makebox(2, 4, 5, 0xEEDDAA, px - 10 + si * 7, 3, pz + 2);
        }
    }

    function buildavon() {
        var avx = 20;
        var avz = -50;
        // River
        makebox(80, 0.5, 25, 0x336688, avx, 0, avz);
        // Weir
        makebox(25, 0.5, 3, 0x555555, avx - 5, 0.5, avz + 5);
        // White water foam boxes
        var wi;
        for (wi = 0; wi < 5; wi++) {
            makebox(4, 0.3, 1, 0xEEEEFF, avx - 12 + wi * 6, 0.8, avz + 5);
        }
    }

    function buildpumproom() {
        var prx = -30;
        var prz = 20;
        // Main assembly room building
        makebox(20, 12, 10, 0xEEDDAA, prx, 6, prz);
        // Ionic columns
        makecyl(0.5, 0.5, 7, 8, 0xDDCC99, prx - 6, 3.5, prz - 5);
        makecyl(0.5, 0.5, 7, 8, 0xDDCC99, prx - 2, 3.5, prz - 5);
        makecyl(0.5, 0.5, 7, 8, 0xDDCC99, prx + 2, 3.5, prz - 5);
        makecyl(0.5, 0.5, 7, 8, 0xDDCC99, prx + 6, 3.5, prz - 5);
        // Pediment box
        makebox(16, 0.5, 3, 0xDDCC99, prx, 12.25, prz - 4);
    }

    function buildcircus() {
        var cx = -60;
        var cz = -50;
        var ci;
        var angle;
        var rad = 22;
        for (ci = 0; ci < 6; ci++) {
            angle = ci * (Math.PI * 2 / 6);
            var sx = cx + Math.sin(angle) * rad;
            var sz = cz + Math.cos(angle) * rad;
            makebox(8, 10, 10, 0xEEDDAA, sx, 5, sz, 0, angle, 0);
        }
        // Central plane trees (3 trees)
        makecyl(0.5, 0.5, 8, 8, 0x5B3A22, cx, 4, cz);
        makesphere(5, 8, 6, 0x447730, cx, 10, cz);
        makecyl(0.5, 0.5, 8, 8, 0x5B3A22, cx + 6, 4, cz + 3);
        makesphere(5, 8, 6, 0x447730, cx + 6, 10, cz + 3);
        makecyl(0.5, 0.5, 8, 8, 0x5B3A22, cx - 6, 4, cz - 3);
        makesphere(5, 8, 6, 0x447730, cx - 6, 10, cz - 3);
    }

    function buildthermae() {
        var tx = 10;
        var tz = 40;
        // Modern glass spa building
        makebox(18, 16, 6, 0x44BBCC, tx, 8, tz);
        // Rooftop pool
        makebox(12, 0.3, 8, 0x44AAAA, tx, 16.15, tz);
    }

    function buildbathstreet() {
        var bx = -10;
        var bz = 50;
        // Main colonnaded street building
        makebox(25, 5, 5, 0xDDCC99, bx, 2.5, bz);
        // 10 columns on each side = 20 total
        var ci;
        for (ci = 0; ci < 10; ci++) {
            makecyl(0.3, 0.3, 4, 8, 0xCCBB88, bx - 11 + ci * 2.5, 2, bz - 3);
            makecyl(0.3, 0.3, 4, 8, 0xCCBB88, bx - 11 + ci * 2.5, 2, bz + 3);
        }
    }

    function buildsallylunn() {
        var slx = -50;
        var slz = 30;
        // Sally Lunn's house - 4 storeys
        makebox(4, 8, 4, 0xCC9944, slx, 4, slz);
        // Carved stone detail boxes for each floor
        makebox(3, 0.3, 0.3, 0xBB8833, slx, 2, slz - 2);
        makebox(3, 0.3, 0.3, 0xBB8833, slx, 4, slz - 2);
        makebox(3, 0.3, 0.3, 0xBB8833, slx, 6, slz - 2);
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
