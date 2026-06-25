window.ChathamDockyard = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 6240;
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

    function makecylinder(rt, rb, h, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
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

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makelines(points, color, x, y, z) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        line.position.set(OX + x, y, OZ + z);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildropery() {
        // Great Ropery — 80×8×5 (compressed from 346m real-world)
        makebox(80, 8, 5, 0x8B3A2A, 0, 4, -30);
        // Ropery roof ridge
        makebox(80, 0.5, 0.5, 0x6B2A1A, 0, 8.25, -30);
        // Ropery windows — line segments along facade
        var wpts = [
            new THREE.Vector3(-36, 2, 0), new THREE.Vector3(-36, 5, 0),
            new THREE.Vector3(-28, 2, 0), new THREE.Vector3(-28, 5, 0),
            new THREE.Vector3(-20, 2, 0), new THREE.Vector3(-20, 5, 0),
            new THREE.Vector3(-12, 2, 0), new THREE.Vector3(-12, 5, 0),
            new THREE.Vector3(-4, 2, 0), new THREE.Vector3(-4, 5, 0),
            new THREE.Vector3(4, 2, 0), new THREE.Vector3(4, 5, 0),
            new THREE.Vector3(12, 2, 0), new THREE.Vector3(12, 5, 0),
            new THREE.Vector3(20, 2, 0), new THREE.Vector3(20, 5, 0),
            new THREE.Vector3(28, 2, 0), new THREE.Vector3(28, 5, 0),
            new THREE.Vector3(36, 2, 0), new THREE.Vector3(36, 5, 0)
        ];
        makelines(wpts, 0xAA8866, 0, 0, -27.5);
    }

    function buildslipways() {
        // 4 covered slipways — dark wood shed bodies
        var positions = [ -50, -30, -10, 10 ];
        for (var i = 0; i < 4; i++) {
            var sx = positions[i];
            // Main shed body
            makebox(40, 15, 10, 0x4A3A2A, sx, 7.5, 20);
            // Sawtooth roof — alternating ridges
            for (var j = 0; j < 4; j++) {
                makecone(2.5, 4, 0x3A2A1A, sx - 15 + j * 10, 17.5, 20);
            }
        }
    }

    function buildcommissioners() {
        // Commissioner's House — Georgian mansion
        makebox(25, 15, 8, 0xF5F5F0, -80, 7.5, -20);
        // Pediment / roof
        makecone(15, 4, 0xE0E0DC, -80, 17, -20);
        // Columns — 4 front columns
        for (var c = 0; c < 4; c++) {
            makecylinder(0.4, 0.4, 10, 0xEEEEE8, -80 - 10 + c * 7, 5, -16.5, 0, 0, 0);
        }
        // Steps
        makebox(20, 1, 3, 0xDDDDDA, -80, 0.5, -16);
    }

    function buildsubmarinemuseum() {
        // Submarine Museum building — modern gray
        makebox(20, 15, 6, 0x778888, 60, 7.5, 5);
        // Entrance canopy
        makebox(8, 1, 4, 0x667777, 60, 15.5, 2);
    }

    function buildsubmarine() {
        // HMS Ocelot — forward hull section
        makecylinder(3, 3, 25, 0x223344, 60, 3, 30, 0, 0, Math.PI / 2);
        // HMS Ocelot — aft hull section
        makecylinder(3, 1.5, 10, 0x223344, 82.5, 3, 30, 0, 0, Math.PI / 2);
        // Conning tower
        makebox(3, 6, 3, 0x223344, 55, 9, 30);
        // Periscope
        makecylinder(0.15, 0.15, 5, 0x334455, 55, 14.5, 30, 0, 0, 0);
        // Bow cap
        makecylinder(3, 0.5, 3, 0x1A2A33, 47, 3, 30, 0, 0, Math.PI / 2);
    }

    function buildriver() {
        // Medway river — flat box for water surface
        makebox(80, 0.3, 15, 0x336688, 20, -0.15, 70);
        // River bank near side
        makebox(80, 1, 3, 0x8B7355, 20, 0.5, 62);
        // River bank far side
        makebox(80, 1, 3, 0x8B7355, 20, 0.5, 78);
    }

    function builddocks() {
        // 3 dry docks — brick-lined rectangular pits
        var dockx = [ -60, -35, -10 ];
        for (var d = 0; d < 3; d++) {
            var dx = dockx[d];
            // Back wall
            makebox(20, 4, 1, 0x885533, dx, -1.5, 50);
            // Left wall
            makebox(1, 4, 8, 0x885533, dx - 10, -1.5, 54);
            // Right wall
            makebox(1, 4, 8, 0x885533, dx + 10, -1.5, 54);
            // Floor
            makebox(20, 0.5, 8, 0x664422, dx, -3.75, 54);
        }
    }

    function buildfortamherst() {
        // Fort Amherst on elevated position — earthwork hill base
        makebox(40, 6, 30, 0x887755, -120, 3, -60);
        // Zigzag earthwork wall sections — angled bastions
        makebox(12, 3, 2, 0x998866, -130, 9.5, -70);
        makebox(12, 3, 2, 0x998866, -118, 9.5, -68);
        makebox(12, 3, 2, 0x998866, -106, 9.5, -70);
        makebox(2, 3, 8, 0x998866, -130, 9.5, -66);
        makebox(2, 3, 8, 0x998866, -118, 9.5, -64);
        makebox(2, 3, 8, 0x998866, -106, 9.5, -66);
        // Gun battery — 3 cannon
        makecylinder(0.4, 0.5, 4, 0x555544, -125, 9.5, -62, 0, 0, Math.PI / 2);
        makecylinder(0.4, 0.5, 4, 0x555544, -120, 9.5, -62, 0, 0, Math.PI / 2);
        makecylinder(0.4, 0.5, 4, 0x555544, -115, 9.5, -62, 0, 0, Math.PI / 2);
        // Cannon wheels
        makecylinder(0.8, 0.8, 0.3, 0x443322, -123.5, 8.2, -62, Math.PI / 2, 0, 0);
        makecylinder(0.8, 0.8, 0.3, 0x443322, -118.5, 8.2, -62, Math.PI / 2, 0, 0);
        makecylinder(0.8, 0.8, 0.3, 0x443322, -113.5, 8.2, -62, Math.PI / 2, 0, 0);
        // Powder magazine
        makebox(8, 4, 6, 0x887766, -122, 10, -56);
    }

    function buildcottages() {
        // 3 rows × 8 cottages — workers' terraces
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 8; col++) {
                var cx = -70 + col * 5;
                var cz = 40 + row * 8;
                // Cottage body
                makebox(4, 6, 6, 0x9B3A2A, cx, 3, cz);
                // Roof
                makecone(3.5, 3, 0x5A3020, cx, 7.5, cz);
                // Chimney
                makecylinder(0.3, 0.3, 2, 0x7A3020, cx + 1, 10.5, cz - 1, 0, 0, 0);
            }
        }
    }

    function buildground() {
        // Dockyard ground surface — large flat base
        makebox(300, 0.5, 200, 0x556644, 0, -0.25, 0);
        // Cobblestone yard areas — slightly raised slabs
        makebox(80, 0.3, 40, 0x887766, 0, 0.15, -5);
        makebox(60, 0.3, 30, 0x887766, -70, 0.15, 10);
    }

    function build() {
        buildground();
        buildropery();
        buildslipways();
        buildcommissioners();
        buildsubmarinemuseum();
        buildsubmarine();
        buildriver();
        builddocks();
        buildfortamherst();
        buildcottages();
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
