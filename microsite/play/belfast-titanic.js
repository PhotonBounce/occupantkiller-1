window.BelfastTitanic = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 17000;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeBox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + (x || 0), y || 0, OFFSET_Z + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + (x || 0), y || 0, OFFSET_Z + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, wSegs, hSegs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, wSegs || 8, hSegs || 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + (x || 0), y || 0, OFFSET_Z + (z || 0));
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildTitanicBelfast() {
        // Main body — silver-grey aluminium 40w x 28h x 30d
        makeBox(40, 28, 30, 0xC8C8C8, 0, 14, 0);

        // 4 projecting prow shapes at 45 degrees on each facade corner
        makeBox(8, 8, 28, 0xD0D0D0, 18, 18, 0, 0, Math.PI * 0.25, 0);
        makeBox(8, 8, 28, 0xD0D0D0, -18, 18, 0, 0, -Math.PI * 0.25, 0);
        makeBox(8, 8, 28, 0xD0D0D0, 0, 18, 14, 0, Math.PI * 0.5, 0);
        makeBox(8, 8, 28, 0xD0D0D0, 0, 18, -14, 0, -Math.PI * 0.5, 0);

        // Angled facade cladding panels — 6 BoxGeometry 12x28x0.5
        makeBox(12, 28, 0.5, 0xBBBBBB, -12, 14, 15, Math.PI * 0.05, 0, 0);
        makeBox(12, 28, 0.5, 0xBBBBBB, 12, 14, 15, -Math.PI * 0.05, 0, 0);
        makeBox(12, 28, 0.5, 0xBBBBBB, -12, 14, -15, Math.PI * 0.05, 0, 0);
        makeBox(12, 28, 0.5, 0xBBBBBB, 12, 14, -15, -Math.PI * 0.05, 0, 0);
        makeBox(12, 28, 0.5, 0xBBBBBB, -20, 14, 0, 0, 0, Math.PI * 0.05);
        makeBox(12, 28, 0.5, 0xBBBBBB, 20, 14, 0, 0, 0, -Math.PI * 0.05);
    }

    function buildTitanicProw() {
        var px = 60;
        var pz = 0;
        // 3 stacked boxes angled like ship bow
        makeBox(14, 4, 28, 0x888888, px, 2, pz, -Math.PI * 0.1, 0, 0);
        makeBox(10, 3, 24, 0x888888, px, 5.5, pz - 1, -Math.PI * 0.1, 0, 0);
        makeBox(6, 2, 20, 0x888888, px, 8.5, pz - 2, -Math.PI * 0.1, 0, 0);
        // Red waterline strip
        makeBox(14, 1, 28, 0xCC0000, px, 0.5, pz, -Math.PI * 0.1, 0, 0);
    }

    function buildSSNomadic() {
        var nx = -60;
        var nz = 40;
        // Hull
        makeBox(10, 5, 30, 0x1C3A6B, nx, 2.5, nz);
        // Funnels
        makeCylinder(2, 2, 10, 8, 0xCC5500, nx - 2, 10, nz - 5);
        makeCylinder(2, 2, 10, 8, 0xCC5500, nx + 2, 10, nz + 5);
        // Lifeboats and davit arms — 4 lifeboats
        makeBox(2, 1, 5, 0xF5DEB3, nx - 6, 6, nz - 8);
        makeBox(0.5, 4, 0.5, 0x888888, nx - 6, 8, nz - 8);
        makeBox(2, 1, 5, 0xF5DEB3, nx + 6, 6, nz - 8);
        makeBox(0.5, 4, 0.5, 0x888888, nx + 6, 8, nz - 8);
        makeBox(2, 1, 5, 0xF5DEB3, nx - 6, 6, nz + 8);
        makeBox(0.5, 4, 0.5, 0x888888, nx - 6, 8, nz + 8);
        makeBox(2, 1, 5, 0xF5DEB3, nx + 6, 6, nz + 8);
        makeBox(0.5, 4, 0.5, 0x888888, nx + 6, 8, nz + 8);
    }

    function buildDryDock() {
        var dx = 100;
        var dz = 0;
        // Excavation floor
        makeBox(30, 8, 80, 0x2A2A2A, dx, -4, dz);
        // Dock walls
        makeBox(2, 10, 80, 0x888888, dx - 16, 1, dz);
        makeBox(2, 10, 80, 0x888888, dx + 16, 1, dz);
        // Dock gate at one end
        makeBox(30, 12, 3, 0x555555, dx, 2, dz - 41.5);
    }

    function buildSlipways() {
        var sx = 0;
        var sz = -100;
        // 2 inclined concrete ramps at -5 degrees X
        makeBox(20, 1, 60, 0xAAAAAA, sx - 15, 1, sz, -Math.PI * 0.0873, 0, 0);
        makeBox(20, 1, 60, 0xAAAAAA, sx + 15, 1, sz, -Math.PI * 0.0873, 0, 0);
        // Slip dock cranes — 2 tower cylinders
        makeCylinder(2, 2, 40, 8, 0xCC6600, sx - 15, 20, sz);
        makeCylinder(2, 2, 40, 8, 0xCC6600, sx + 15, 20, sz);
        // Crane arms horizontal at top
        makeBox(2, 2, 30, 0xCC6600, sx - 15, 40, sz);
        makeBox(2, 2, 30, 0xCC6600, sx + 15, 40, sz);
    }

    function buildHarlandWolffCranes() {
        var cx = -100;
        var cz = -80;
        // Samson crane
        makeCylinder(4, 4, 60, 8, 0xFFCC00, cx, 30, cz);
        makeBox(4, 4, 80, 0xFFCC00, cx, 61, cz);
        makeBox(3, 50, 3, 0xFFCC00, cx - 20, 25, cz - 20);
        makeBox(3, 50, 3, 0xFFCC00, cx + 20, 25, cz - 20);
        makeBox(3, 50, 3, 0xFFCC00, cx - 20, 25, cz + 20);
        makeBox(3, 50, 3, 0xFFCC00, cx + 20, 25, cz + 20);

        // Goliath crane
        var cx2 = -100;
        var cz2 = -20;
        makeCylinder(4, 4, 60, 8, 0xFFCC00, cx2, 30, cz2);
        makeBox(4, 4, 80, 0xFFCC00, cx2, 61, cz2);
        makeBox(3, 50, 3, 0xFFCC00, cx2 - 20, 25, cz2 - 20);
        makeBox(3, 50, 3, 0xFFCC00, cx2 + 20, 25, cz2 - 20);
        makeBox(3, 50, 3, 0xFFCC00, cx2 - 20, 25, cz2 + 20);
        makeBox(3, 50, 3, 0xFFCC00, cx2 + 20, 25, cz2 + 20);
    }

    function buildBelfastLough() {
        var wz = 120;
        // 6 water boxes
        makeBox(25, 0.5, 20, 0x1B4E8A, -50, 0, wz);
        makeBox(25, 0.5, 20, 0x1B4E8A, -25, 0, wz);
        makeBox(25, 0.5, 20, 0x1B4E8A, 0, 0, wz);
        makeBox(25, 0.5, 20, 0x1B4E8A, 25, 0, wz);
        makeBox(25, 0.5, 20, 0x1B4E8A, 50, 0, wz);
        makeBox(25, 0.5, 20, 0x1B4E8A, 75, 0, wz);
        // Modern quay wall
        makeBox(100, 4, 4, 0x888888, 12.5, 2, wz - 12);
        // Moored tugboat
        makeBox(6, 3, 14, 0xFF6600, -40, 1.5, wz + 5);
    }

    function buildMemorialGarden() {
        var mx = 80;
        var mz = 80;
        // Dark granite base
        makeBox(20, 0.5, 20, 0x444444, mx, 0.25, mz);
        // 32 memorial paving stones in rows — 8 columns x 4 rows
        var i, j;
        for (i = 0; i < 4; i = i + 1) {
            for (j = 0; j < 8; j = j + 1) {
                makeBox(1.5, 0.2, 1.5, 0x333333,
                    mx - 7 + j * 2,
                    0.6,
                    mz - 3 + i * 2
                );
            }
        }
        // Central obelisk
        makeBox(1, 20, 1, 0x666666, mx, 10.5, mz);
        // Sphere at apex
        makeSphere(1, 8, 8, 0xFFFFFF, mx, 21, mz);
    }

    function build() {
        buildTitanicBelfast();
        buildTitanicProw();
        buildSSNomadic();
        buildDryDock();
        buildSlipways();
        buildHarlandWolffCranes();
        buildBelfastLough();
        buildMemorialGarden();
    }

    function update(delta) {
        // Static environment — no per-frame animation needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i = i + 1) {
            scene.remove(objects[i]);
            if (objects[i].geometry) objects[i].geometry.dispose();
            if (objects[i].material) objects[i].material.dispose();
        }
        objects = [];
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
