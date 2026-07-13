window.BrixhamTrawler = (function() {
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

    function addbox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildbreakwater() {
        // 5 large box sections forming the stone arm
        var bx = 9240 + 0;
        var bz = -60;
        addbox(12, 3, 4, 0x777060, bx + 0,   1.5, bz + 0);
        addbox(12, 3, 4, 0x777060, bx + 12,  1.5, bz - 2);
        addbox(12, 3, 4, 0x777060, bx + 24,  1.5, bz - 4);
        addbox(12, 3, 4, 0x777060, bx + 36,  1.5, bz - 6);
        addbox(12, 3, 4, 0x777060, bx + 48,  1.5, bz - 8);
        // Lighthouse at end
        addcylinder(1.5, 1.5, 12, 0xEEEEEE, bx + 54, 9, bz - 8);
        // Red lantern
        addsphere(1, 0xCC2222, bx + 54, 15.5, bz - 8);
    }

    function buildtrawler(ox, oz, hullcolor) {
        // Hull
        addbox(10, 2.5, 4, hullcolor, ox, 1.25, oz);
        // Wheelhouse
        addbox(3, 2.5, 3, 0x997755, ox + 2, 3.75, oz);
        // Mast
        addcylinder(0.3, 0.3, 8, 0xAA8855, ox, 7, oz);
        // Outrigger boom left
        addbox(0.2, 0.2, 6, 0xAA8855, ox - 2, 4, oz + 5);
        // Outrigger boom right
        addbox(0.2, 0.2, 6, 0xAA8855, ox - 2, 4, oz - 5);
    }

    function buildfleet() {
        var ox = 9240 + 20;
        buildtrawler(ox + 0,   10, 0x225588);
        buildtrawler(ox + 14,  10, 0xCC2222);
        buildtrawler(ox + 28,  10, 0x225588);
        buildtrawler(ox + 0,  -10, 0xCC2222);
        buildtrawler(ox + 14, -10, 0x225588);
        buildtrawler(ox + 28, -10, 0xCC2222);
    }

    function buildgoldenhind() {
        var gx = 9240 + 80;
        var gz = 5;
        // Hull
        addbox(20, 4, 6, 0x6B4423, gx, 2, gz);
        // Three masts
        addcylinder(0.4, 0.4, 14, 0x5C3D1A, gx - 6, 10, gz);
        addcylinder(0.4, 0.4, 14, 0x5C3D1A, gx,     10, gz);
        addcylinder(0.4, 0.4, 14, 0x5C3D1A, gx + 6, 10, gz);
        // Crow's nest on middle mast
        addbox(1.5, 1.5, 1.5, 0x6B4423, gx, 10, gz);
        // Bowsprit projecting forward
        addbox(0.3, 0.3, 8, 0x5C3D1A, gx + 14, 5, gz);
    }

    function buildfishmarket() {
        var mx = 9240 - 20;
        var mz = 30;
        // Main shed
        addbox(30, 8, 6, 0x778888, mx, 4, mz);
        // Six column cylinders
        addcylinder(0.3, 0.3, 5, 0x557777, mx - 12, 2.5, mz - 3);
        addcylinder(0.3, 0.3, 5, 0x557777, mx - 6,  2.5, mz - 3);
        addcylinder(0.3, 0.3, 5, 0x557777, mx,      2.5, mz - 3);
        addcylinder(0.3, 0.3, 5, 0x557777, mx + 6,  2.5, mz - 3);
        addcylinder(0.3, 0.3, 5, 0x557777, mx + 12, 2.5, mz - 3);
        addcylinder(0.3, 0.3, 5, 0x557777, mx + 18, 2.5, mz - 3);
        // Fish auction floor
        addbox(25, 0.2, 6, 0x556666, mx, 0.1, mz);
    }

    function buildwilliamoforange() {
        var wx = 9240 - 40;
        var wz = 0;
        // Pedestal cylinder
        addcylinder(1.5, 1.5, 2.5, 0x888880, wx, 1.25, wz);
        // Body box
        addbox(0.8, 1.8, 0.5, 0x4444AA, wx, 3.65, wz);
        // Head sphere
        addsphere(0.4, 0x4444AA, wx, 5.0, wz);
    }

    function buildquay() {
        var qx = 9240 + 0;
        var qz = -20;
        // Quayside flat
        addbox(40, 0.3, 6, 0x887766, qx, 0.15, qz);
        // Eight bollards
        addcylinder(0.4, 0.4, 1.5, 0x665544, qx - 18, 1.05, qz - 2);
        addcylinder(0.4, 0.4, 1.5, 0x665544, qx - 12, 1.05, qz - 2);
        addcylinder(0.4, 0.4, 1.5, 0x665544, qx - 6,  1.05, qz - 2);
        addcylinder(0.4, 0.4, 1.5, 0x665544, qx,      1.05, qz - 2);
        addcylinder(0.4, 0.4, 1.5, 0x665544, qx + 6,  1.05, qz - 2);
        addcylinder(0.4, 0.4, 1.5, 0x665544, qx + 12, 1.05, qz - 2);
        addcylinder(0.4, 0.4, 1.5, 0x665544, qx + 18, 1.05, qz - 2);
        addcylinder(0.4, 0.4, 1.5, 0x665544, qx - 18, 1.05, qz + 2);
        // Twelve fish crates
        addbox(0.6, 0.4, 0.4, 0x667755, qx - 16, 0.5, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx - 15, 0.5, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx - 14, 0.5, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx - 16, 0.9, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx - 15, 0.9, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx - 14, 0.9, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx + 10, 0.5, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx + 11, 0.5, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx + 12, 0.5, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx + 10, 0.9, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx + 11, 0.9, qz + 1);
        addbox(0.6, 0.4, 0.4, 0x667755, qx + 12, 0.9, qz + 1);
    }

    function buildtown() {
        var tx = 9240 - 60;
        var tz = 40;
        var colors = [0xCC9966, 0xBBAA77];
        // 12 terraced cottages stepping up cliff
        for (var i = 0; i < 12; i++) {
            var col = colors[i % 2];
            var stepx = tx + (i % 6) * 4;
            var stepz = tz + Math.floor(i / 6) * 5;
            var stepy = 2 + Math.floor(i / 2) * 1.5;
            addbox(3, 4, 4, col, stepx, stepy, stepz);
        }
    }

    function buildlobsterpots() {
        var lx = 9240 - 10;
        var lz = -35;
        // 20 small box cages stacked in pyramid
        var count = 0;
        var rows = [7, 6, 4, 3];
        for (var r = 0; r < rows.length; r++) {
            for (var c = 0; c < rows[r]; c++) {
                addbox(0.6, 0.6, 0.4, 0x8B6040, lx + c * 0.65, 0.3 + r * 0.65, lz);
                count++;
                if (count >= 20) break;
            }
            if (count >= 20) break;
        }
    }

    function buildberryhead() {
        var bx = 9240 + 120;
        var bz = -80;
        // Cliff box
        addbox(15, 20, 8, 0x888870, bx, 10, bz);
        // Small lighthouse on top
        addbox(2, 6, 2, 0xEEEEEE, bx, 23, bz);
        // Red lantern sphere
        addsphere(0.6, 0xCC2222, bx, 26.5, bz);
    }

    function buildgulls() {
        var gx = 9240;
        var heights = [12, 15, 18, 10, 20];
        var xoffs = [0, 10, -10, 20, -20];
        var zoffs = [0, 5, -5, -10, 15];
        for (var i = 0; i < 5; i++) {
            var gox = gx + xoffs[i];
            var goy = heights[i];
            var goz = zoffs[i];
            // Body
            addbox(0.4, 0.1, 0.3, 0xEEEEEE, gox, goy, goz);
            // Left wing
            var lwing = addbox(0.5, 0.05, 0.15, 0xEEEEEE, gox - 0.45, goy + 0.05, goz);
            lwing.rotation.z = 0.3;
            // Right wing
            var rwing = addbox(0.5, 0.05, 0.15, 0xEEEEEE, gox + 0.45, goy + 0.05, goz);
            rwing.rotation.z = -0.3;
        }
    }

    function build() {
        buildbreakwater();
        buildfleet();
        buildgoldenhind();
        buildfishmarket();
        buildwilliamoforange();
        buildquay();
        buildtown();
        buildlobsterpots();
        buildberryhead();
        buildgulls();
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
