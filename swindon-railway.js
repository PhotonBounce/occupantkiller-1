window.SwindonRailway = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + 10200, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + 10200, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 12, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x + 10200, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildmuseum();
        buildlocomotives();
        buildvillage();
        buildroundabout();
        buildstation();
        buildcanal();
        buildsignalbox();
        buildoutlets();
        buildkinggeoргev();
        buildbrunel();
    }

    function buildmuseum() {
        // Main building 60x15x12
        makebox(60, 15, 12, 0x777766, 0, 7.5, 0);
        // Clerestory roof raised central box 50x4x4
        makebox(50, 4, 4, 0x777766, 0, 17, 0);
        // 6 chimney cylinders 1r x 15h
        makecyl(1, 1, 15, 0x8B4513, -22, 22.5, 0, 0, 0, 0);
        makecyl(1, 1, 15, 0x8B4513, -13, 22.5, 0, 0, 0, 0);
        makecyl(1, 1, 15, 0x8B4513, -4, 22.5, 0, 0, 0, 0);
        makecyl(1, 1, 15, 0x8B4513, 5, 22.5, 0, 0, 0, 0);
        makecyl(1, 1, 15, 0x8B4513, 14, 22.5, 0, 0, 0, 0);
        makecyl(1, 1, 15, 0x8B4513, 23, 22.5, 0, 0, 0, 0);
    }

    function buildlocomotive(ox, oy, oz) {
        // Boiler cylinder 1.5r x 10h rotated to horizontal
        makecyl(1.5, 1.5, 10, 0x111111, ox, oy + 1.5, oz, 0, 0, Math.PI / 2);
        // Cab box 3x3x4
        makebox(3, 3, 4, 0x111111, ox + 4.5, oy + 1.5, oz);
        // Tender box 3x2x4
        makebox(3, 2, 4, 0x111111, ox - 6, oy + 1, oz);
        // 4 drive wheel cylinders 1.5r x 0.3h
        makecyl(1.5, 1.5, 0.3, 0x111111, ox - 2, oy, oz - 2.2, Math.PI / 2, 0, 0);
        makecyl(1.5, 1.5, 0.3, 0x111111, ox - 2, oy, oz + 2.2, Math.PI / 2, 0, 0);
        makecyl(1.5, 1.5, 0.3, 0x111111, ox + 1, oy, oz - 2.2, Math.PI / 2, 0, 0);
        makecyl(1.5, 1.5, 0.3, 0x111111, ox + 1, oy, oz + 2.2, Math.PI / 2, 0, 0);
        // Driving rod box 0.1x0.1x6
        makebox(6, 0.1, 0.1, 0x111111, ox - 0.5, oy + 1.0, oz - 2.2);
        makebox(6, 0.1, 0.1, 0x111111, ox - 0.5, oy + 1.0, oz + 2.2);
    }

    function buildlocomotives() {
        buildlocomotive(-15, 0, 2);
        buildlocomotive(0, 0, 2);
        buildlocomotive(15, 0, 2);
    }

    function buildvillage() {
        // 3 terraced rows of 5 houses each 3x4x4, 0xCC8866
        var row, col, rx, rz;
        for (row = 0; row < 3; row++) {
            for (col = 0; col < 5; col++) {
                rx = -50 + col * 4;
                rz = 30 + row * 6;
                makebox(3, 4, 4, 0xCC8866, rx, 2, rz);
                // Roof cone
                makecyl(0, 2, 2, 0xAA6644, rx, 5, rz, 0, 0, 0);
            }
        }
        // Village Institute 10x6x7 with clock tower
        makebox(10, 7, 6, 0xCC8866, -30, 3.5, 42);
        // Clock tower
        makebox(3, 5, 3, 0xBB7755, -30, 9.5, 42);
        makecyl(0, 1.5, 2, 0xAA6644, -30, 13, 42, 0, 0, 0);
    }

    function buildroundabout() {
        // Central island cylinder 5r x 2h (flat)
        makecyl(5, 5, 2, 0x888844, 60, 1, 0);
        // 5 mini roundabout circles cylinder 2r x 0.3h
        var angle, mx, mz;
        for (var i = 0; i < 5; i++) {
            angle = (i / 5) * Math.PI * 2;
            mx = 60 + Math.cos(angle) * 12;
            mz = Math.sin(angle) * 12;
            makecyl(2, 2, 0.3, 0x888844, mx - 10200, 0.15, mz);
            // Road boxes 2x0.1x12 radiating out
            makebox(2, 0.1, 12, 0x666655, mx - 10200 + Math.cos(angle) * 6, 0.05, mz + Math.sin(angle) * 6);
        }
    }

    function buildstation() {
        // Long platform 3x0.5x50
        makebox(3, 0.5, 50, 0x888870, 80, 0.25, 0);
        // Brunel overall roof box 40x0.5x15 on columns
        makebox(40, 0.5, 15, 0x888870, 80, 7, 0);
        // 8 cylinder columns 0.5r x 6h
        var ci;
        for (ci = 0; ci < 8; ci++) {
            makecyl(0.5, 0.5, 6, 0x777760, 62 + ci * 5.7, 3.5, 7, 0, 0, 0);
            makecyl(0.5, 0.5, 6, 0x777760, 62 + ci * 5.7, 3.5, -7, 0, 0, 0);
        }
        // Station building 20x8x8
        makebox(20, 8, 8, 0x888870, 70, 4, -14);
    }

    function buildcanal() {
        // Canal flat 3x0.2x60 (using box since PlaneGeometry is forbidden)
        makebox(3, 0.2, 60, 0x44AACC, -80, 0.1, 0);
        // Stone wharf 8x0.5x4
        makebox(8, 0.5, 4, 0x887766, -76, 0.25, 10);
        // Narrowboat hull 10x1x2.5
        makebox(10, 1, 2.5, 0x4466AA, -80, 0.7, 0);
    }

    function buildsignalbox() {
        // 4 stilts 0.3x0.3x3
        makebox(0.3, 3, 0.3, 0x8B4513, -90, 1.5, 20);
        makebox(0.3, 3, 0.3, 0x8B4513, -85, 1.5, 20);
        makebox(0.3, 3, 0.3, 0x8B4513, -90, 1.5, 24);
        makebox(0.3, 3, 0.3, 0x8B4513, -85, 1.5, 24);
        // Raised box 5x4x4
        makebox(5, 4, 4, 0x8B4513, -87.5, 5, 22);
        // Signal post cylinder 0.2r x 6h
        makecyl(0.2, 0.2, 6, 0x444433, -92, 3, 21, 0, 0, 0);
        // Signal arm box 0.2x0.3x2
        makebox(2, 0.3, 0.2, 0xCC2222, -91, 6, 21);
    }

    function buildoutlets() {
        // 4 converted railway shed buildings 20x6x6
        var si;
        for (si = 0; si < 4; si++) {
            makebox(20, 6, 6, 0x4477AA, 30 + si * 22, 3, 50);
            // Glass frontage flat box 0.2 deep
            makebox(20, 5, 0.2, 0x88BBDD, 30 + si * 22, 3.5, 47);
        }
    }

    function buildkinggeoргev() {
        // Plinth 15x0.5x4
        makebox(15, 0.5, 4, 0x777777, 0, 0.25, -25);
        // Main boiler cylinder 2r x 12h horizontal
        makecyl(2, 2, 12, 0x111111, 0, 3, -25, 0, 0, Math.PI / 2);
        // Cab box 4x3.5x4
        makebox(4, 3.5, 4, 0x111111, 5, 3, -25);
        // 6 drive wheel cylinders 1.8r x 0.3h
        makecyl(1.8, 1.8, 0.3, 0x111111, -3, 1.8, -27.5, Math.PI / 2, 0, 0);
        makecyl(1.8, 1.8, 0.3, 0x111111, -3, 1.8, -22.5, Math.PI / 2, 0, 0);
        makecyl(1.8, 1.8, 0.3, 0x111111, 0, 1.8, -27.5, Math.PI / 2, 0, 0);
        makecyl(1.8, 1.8, 0.3, 0x111111, 0, 1.8, -22.5, Math.PI / 2, 0, 0);
        makecyl(1.8, 1.8, 0.3, 0x111111, 3, 1.8, -27.5, Math.PI / 2, 0, 0);
        makecyl(1.8, 1.8, 0.3, 0x111111, 3, 1.8, -22.5, Math.PI / 2, 0, 0);
    }

    function buildbrunel() {
        // Pedestal cylinder 1.5r x 2h
        makecyl(1.5, 1.5, 2, 0x888880, 20, 1, -20);
        // Body box
        makebox(1, 2, 0.6, 0xB87333, 20, 3.5, -20);
        // Head sphere
        makesphere(0.4, 0xB87333, 20, 5, -20);
        // Top hat box 0.5x0.8x0.5
        makebox(0.5, 0.8, 0.5, 0x111111, 20, 5.8, -20);
    }

    function update(delta) {
    }

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
