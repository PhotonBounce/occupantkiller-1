window.HerneBay = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 6360;
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

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function clocktower() {
        // Main tower shaft 4x4x18
        makebox(4, 18, 4, 0xCCBBAA, 0, 9, 0);
        // Clock faces — 4 small white boxes near top, one per side
        makebox(2, 2, 0.3, 0xFFFFFF, 0, 16, 2.2);  // south face
        makebox(2, 2, 0.3, 0xFFFFFF, 0, 16, -2.2); // north face
        makebox(0.3, 2, 2, 0xFFFFFF, 2.2, 16, 0);  // east face
        makebox(0.3, 2, 2, 0xFFFFFF, -2.2, 16, 0); // west face
        // Cone cap
        makecone(2.5, 3, 8, 0x998877, 0, 19.5, 0);
    }

    function pier() {
        // Short stub near shore
        makebox(4, 0.8, 80, 0x8B6914, 30, 0.9, -80);
        // Gap — nothing placed, gap is implied
        // Pier head building in the distance
        makebox(15, 10, 6, 0x888888, 30, 5.4, -200);
        // Pier head roof
        makebox(15, 1, 6, 0x666666, 30, 10.9, -200);
    }

    function seaandbeach() {
        // Water
        makebox(80, 0.3, 20, 0x4488BB, 30, 0.1, -100);
        // Second water strip further out
        makebox(80, 0.3, 80, 0x3377AA, 30, 0.0, -160);
        // Sand strip
        makebox(80, 0.3, 10, 0xF4E0A0, 30, 0.1, -55);
        // Sand continuation near shore
        makebox(80, 0.3, 10, 0xF4E0A0, 30, 0.1, -45);
    }

    function beachhuts() {
        var colors = [ 0xCC4422, 0x3366AA, 0x33AA44, 0xAAAA22 ];
        for (var i = 0; i < 20; i++) {
            var col = colors[i % 4];
            var hx = -30 + i * 3.5;
            // Hut body
            makebox(2.5, 2, 3, col, hx, 1.3, -40);
            // Hut roof (cone-ish with box)
            makebox(2.8, 0.5, 3.3, 0x553322, hx, 2.55, -40);
        }
    }

    function bandstand() {
        var bx = 15;
        var bz = -30;
        // Base cylinder
        makecylinder(5, 5, 1, 16, 0x1A4A1A, bx, 0.5, bz);
        // 8 thin columns arranged in circle
        var numcols = 8;
        for (var i = 0; i < numcols; i++) {
            var angle = (i / numcols) * Math.PI * 2;
            var cx = bx + Math.cos(angle) * 4.2;
            var cz = bz + Math.sin(angle) * 4.2;
            makecylinder(0.3, 0.3, 3.5, 6, 0x1A4A1A, cx - bx, 2.25, cz - bz);
            // adjust absolute
            objects[objects.length - 1].position.set(OX + cx, 2.25, OZ + cz);
        }
        // Cone roof
        makecone(6, 3, 16, 0x1A4A1A, bx, 5, bz);
    }

    function hotels() {
        var hotelPositions = [
            -50, -30, -10, 10, 30
        ];
        for (var i = 0; i < 5; i++) {
            var hx = hotelPositions[i];
            // Hotel body
            makebox(12, 10, 9, 0xF5F0E0, hx, 5.3, -20);
            // Bay windows — front protrusions
            makebox(3, 6, 1, 0xE8E0D0, hx - 3.5, 4.3, -15.0);
            makebox(3, 6, 1, 0xE8E0D0, hx + 3.5, 4.3, -15.0);
            // Roof parapet
            makebox(12.5, 0.8, 9.5, 0xDDD8C8, hx, 10.7, -20);
        }
    }

    function arcade() {
        // Amusement arcade building
        makebox(20, 10, 5, 0xCC2200, -40, 5.3, -22);
        // Bright sign strip on top
        makebox(20, 1.5, 1, 0xFF4400, -40, 10.8, -19.7);
        // Entrance canopy
        makebox(6, 0.5, 3, 0xFF3300, -40, 3.0, -19.3);
    }

    function lifeboatstation() {
        // Main building
        makebox(15, 8, 4, 0x003399, -20, 4.3, -62);
        // Slipway ramp extending to sea edge
        makebox(6, 0.5, 15, 0x554433, -20, 0.5, -72);
        // Doors (dark box)
        makebox(5, 4, 0.3, 0x001166, -20, 2.3, -60.2);
    }

    function breakwater() {
        // Neptune's Arm groyne
        makebox(3, 1, 30, 0x777766, 55, 0.8, -80);
        // Second groyne segment
        makebox(3, 0.9, 20, 0x666655, 55, 0.7, -110);
    }

    function seafrontroad() {
        // Promenade / road surface
        makebox(100, 0.2, 8, 0x999988, 0, 0.15, -15);
        // Kerb
        makebox(100, 0.4, 0.5, 0xBBBBAA, 0, 0.35, -11.2);
    }

    function extras() {
        // Lamp posts along promenade — cylinders
        var lampx = [ -40, -25, -10, 5, 20, 35 ];
        for (var i = 0; i < 6; i++) {
            makecylinder(0.15, 0.2, 5, 6, 0x333333, lampx[i], 2.5, -12);
            // Lamp globe sphere approx with small box
            makebox(0.5, 0.5, 0.5, 0xFFFFCC, lampx[i], 5.3, -12);
        }
        // Seawall
        makebox(100, 1.5, 1, 0xAAA999, 0, 0.9, -50);
        // Bench boxes along front
        makebox(2, 0.3, 0.6, 0x664422, -20, 0.55, -13);
        makebox(2, 0.3, 0.6, 0x664422, 0, 0.55, -13);
        makebox(2, 0.3, 0.6, 0x664422, 20, 0.55, -13);
    }

    function build() {
        clocktower();
        pier();
        seaandbeach();
        beachhuts();
        bandstand();
        hotels();
        arcade();
        lifeboatstation();
        breakwater();
        seafrontroad();
        extras();
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
