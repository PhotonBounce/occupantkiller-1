window.SouthamptonDocks3 = (function() {
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
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 10120;
        var oz = 0;

        // === 1. CRUISE LINER ===
        // Hull
        makebox(80, 14, 20, 0xEEEEEE, ox + 0, 7, oz + 0);
        // Deck layers x5
        makebox(78, 2, 18, 0xDDDDDD, ox + 0, 15, oz + 0);
        makebox(78, 2, 18, 0xCCCCCC, ox + 0, 18, oz + 0);
        makebox(78, 2, 16, 0xCCCCCC, ox + 0, 21, oz + 0);
        makebox(76, 2, 14, 0xBBBBBB, ox + 0, 24, oz + 0);
        makebox(72, 2, 12, 0xBBBBBB, ox + 0, 27, oz + 0);
        // 4 funnels
        makecylinder(2.5, 2.5, 8, 12, 0xCC4422, ox - 20, 33, oz + 0);
        makecylinder(2.5, 2.5, 8, 12, 0xCC4422, ox - 8, 33, oz + 0);
        makecylinder(2.5, 2.5, 8, 12, 0x2244CC, ox + 8, 33, oz + 0);
        makecylinder(2.5, 2.5, 8, 12, 0x2244CC, ox + 20, 33, oz + 0);
        // Balcony rail strips x6
        makebox(0.1, 1, 78, 0xAAAAAA, ox - 10, 16, oz - 9);
        makebox(0.1, 1, 78, 0xAAAAAA, ox + 10, 16, oz - 9);
        makebox(0.1, 1, 78, 0xAAAAAA, ox - 10, 19, oz - 9);
        makebox(0.1, 1, 78, 0xAAAAAA, ox + 10, 19, oz - 9);
        makebox(0.1, 1, 78, 0xAAAAAA, ox - 10, 22, oz - 9);
        makebox(0.1, 1, 78, 0xAAAAAA, ox + 10, 22, oz - 9);
        // Bow anchor cylinder
        makecylinder(0.3, 0.3, 2, 8, 0x444444, ox - 39, 4, oz + 0);

        // === 2. OCEAN TERMINAL ===
        // Main shed
        makebox(50, 10, 10, 0x667788, ox + 120, 5, oz + 30);
        // Gangway bridges x2
        makebox(2, 1, 8, 0x556677, ox + 105, 8, oz + 26);
        makebox(2, 1, 8, 0x556677, ox + 115, 8, oz + 26);

        // === 3. TITANIC MEMORIAL ===
        // Base
        makebox(3, 1.5, 3, 0x888880, ox - 80, 0.75, oz + 80);
        // Obelisk
        makebox(1, 10, 1, 0x888880, ox - 80, 6.5, oz + 80);
        // Bronze figures x4 (body + head)
        makebox(0.5, 1.5, 0.3, 0xB87333, ox - 82, 2.25, oz + 80);
        makesphere(0.3, 6, 6, 0xB87333, ox - 82, 3.3, oz + 80);
        makebox(0.5, 1.5, 0.3, 0xB87333, ox - 78, 2.25, oz + 80);
        makesphere(0.3, 6, 6, 0xB87333, ox - 78, 3.3, oz + 80);
        makebox(0.5, 1.5, 0.3, 0xB87333, ox - 80, 2.25, oz + 78);
        makesphere(0.3, 6, 6, 0xB87333, ox - 80, 3.3, oz + 78);
        makebox(0.5, 1.5, 0.3, 0xB87333, ox - 80, 2.25, oz + 82);
        makesphere(0.3, 6, 6, 0xB87333, ox - 80, 3.3, oz + 82);
        // Plaque
        makebox(1.5, 0.5, 0.1, 0xB87333, ox - 80, 1.5, oz + 79);

        // === 4. BARGATE ===
        // Main gate tower
        makebox(10, 14, 6, 0x888870, ox - 160, 7, oz + 120);
        // Two circular flanking towers
        makecylinder(3, 3, 12, 12, 0x888870, ox - 167, 6, oz + 120);
        makecylinder(3, 3, 12, 12, 0x888870, ox - 153, 6, oz + 120);
        // Archway passage gap (dark box to suggest void)
        makebox(4, 5, 0.5, 0x222211, ox - 160, 2.5, oz + 117);

        // === 5. SOUTHAMPTON WATER ===
        makebox(100, 0.5, 50, 0x1A3366, ox + 50, -0.25, oz - 60);

        // === 6. CALSHOT SPIT ===
        // Long spit
        makebox(30, 0.5, 8, 0x887766, ox + 200, 0.25, oz - 100);
        // Castle cylinder at tip
        makecylinder(6, 6, 8, 12, 0x888870, ox + 216, 4, oz - 100);

        // === 7. OCEAN VILLAGE MARINA ===
        // 10 berthed yachts (hull + mast)
        makebox(5, 1, 2, 0xFFFFEE, ox + 90, 0.5, oz + 60);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 90, 5, oz + 60);
        makebox(5, 1, 2, 0xFFEEDD, ox + 97, 0.5, oz + 60);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 97, 5, oz + 60);
        makebox(5, 1, 2, 0xEEEEFF, ox + 104, 0.5, oz + 60);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 104, 5, oz + 60);
        makebox(5, 1, 2, 0xFFFFEE, ox + 111, 0.5, oz + 60);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 111, 5, oz + 60);
        makebox(5, 1, 2, 0xEEFFEE, ox + 118, 0.5, oz + 60);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 118, 5, oz + 60);
        makebox(5, 1, 2, 0xFFEEFF, ox + 90, 0.5, oz + 65);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 90, 5, oz + 65);
        makebox(5, 1, 2, 0xFFFFDD, ox + 97, 0.5, oz + 65);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 97, 5, oz + 65);
        makebox(5, 1, 2, 0xDDEEFF, ox + 104, 0.5, oz + 65);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 104, 5, oz + 65);
        makebox(5, 1, 2, 0xFFFFEE, ox + 111, 0.5, oz + 65);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 111, 5, oz + 65);
        makebox(5, 1, 2, 0xEEEEEE, ox + 118, 0.5, oz + 65);
        makecylinder(0.2, 0.2, 8, 6, 0xCCCCCC, ox + 118, 5, oz + 65);
        // Converted warehouses x4
        makebox(15, 8, 6, 0x778899, ox + 90, 4, oz + 50);
        makebox(15, 8, 6, 0x778899, ox + 108, 4, oz + 50);
        makebox(15, 8, 6, 0x778899, ox + 90, 4, oz + 44);
        makebox(15, 8, 6, 0x778899, ox + 108, 4, oz + 44);

        // === 8. TUDOR HOUSE MUSEUM ===
        // Main house
        makebox(10, 6, 9, 0xCC8844, ox - 120, 3, oz + 60);
        // Timber frame strips x4
        makebox(0.2, 8, 0.1, 0x442200, ox - 123, 4, oz + 56);
        makebox(0.2, 8, 0.1, 0x442200, ox - 121, 4, oz + 56);
        makebox(0.2, 8, 0.1, 0x442200, ox - 119, 4, oz + 56);
        makebox(0.2, 8, 0.1, 0x442200, ox - 117, 4, oz + 56);
        // Garden wall behind
        makebox(12, 1.5, 0.3, 0xAA8855, ox - 120, 0.75, oz + 65);

        // === 9. WESTQUAY SHOPPING CENTRE ===
        // Main mall box
        makebox(60, 20, 8, 0x88AABB, ox - 200, 10, oz + 0);
        // Glass facade panels x6
        makebox(8, 18, 0.3, 0x99BBCC, ox - 225, 10, oz - 4);
        makebox(8, 18, 0.3, 0x99BBCC, ox - 215, 10, oz - 4);
        makebox(8, 18, 0.3, 0x99BBCC, ox - 205, 10, oz - 4);
        makebox(8, 18, 0.3, 0x99BBCC, ox - 195, 10, oz - 4);
        makebox(8, 18, 0.3, 0x99BBCC, ox - 185, 10, oz - 4);
        makebox(8, 18, 0.3, 0x99BBCC, ox - 175, 10, oz - 4);
        // Car park structure
        makebox(40, 25, 12, 0x888888, ox - 200, 12.5, oz + 20);

        // === 10. MARCHWOOD MILITARY PORT ===
        // 3 RoRo military vessels (hull + ramp)
        makebox(30, 5, 8, 0x556644, ox + 160, 2.5, oz - 40);
        makebox(4, 0.5, 6, 0x445533, ox + 145, 0.25, oz - 40);
        makebox(30, 5, 8, 0x556644, ox + 160, 2.5, oz - 52);
        makebox(4, 0.5, 6, 0x445533, ox + 145, 0.25, oz - 52);
        makebox(30, 5, 8, 0x556644, ox + 160, 2.5, oz - 64);
        makebox(4, 0.5, 6, 0x445533, ox + 145, 0.25, oz - 64);
        // MOD perimeter fence
        makebox(50, 3, 0.1, 0x555555, ox + 160, 1.5, oz - 30);
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
