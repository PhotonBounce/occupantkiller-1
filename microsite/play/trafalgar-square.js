window.TrafalgarSquare = (function() {
    'use strict';

    var objects = [];
    var scene = null;
    var offsetX = 4800;
    var offsetZ = 2200;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(offsetX + x, y, offsetZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(offsetX + x, y, offsetZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(offsetX + x, y, offsetZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(offsetX + x, y, offsetZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildpavement() {
        makebox(50, 0.4, 50, 0x808080, 0, 0.2, 0);
    }

    function buildnelsonscolumn() {
        // Square pedestal base
        makebox(5, 5, 5, 0xD2B48C, 0, 2.5, 0);
        // Tall column shaft
        makecylinder(1.2, 1.4, 38, 12, 0xD2B48C, 0, 24, 0);
        // Capital block at top of column
        makebox(3, 1.5, 3, 0xD2B48C, 0, 43.75, 0);
        // Nelson figure on top
        makebox(1, 3, 1, 0xD2B48C, 0, 46.0, 0);
    }

    function buildlion(lx, lz) {
        // Lion body
        makebox(4, 2, 6, 0x1C1C1C, lx, 5.5 + 1, lz);
        // Lion head
        makebox(2, 2, 2, 0x1C1C1C, lx, 5.5 + 2.5, lz - 2);
        // Lion mane
        makebox(2.6, 2.6, 1, 0x1C1C1C, lx, 5.5 + 2.5, lz - 1.5);
    }

    function buildlions() {
        buildlion(-7, -7);
        buildlion(7, -7);
        buildlion(-7, 7);
        buildlion(7, 7);
    }

    function buildnationalgallery() {
        // Main long facade
        makebox(60, 12, 10, 0xF0EEE4, 0, 6, -45);
        // Central dome drum
        makecylinder(4, 4, 6, 12, 0xF0EEE4, 0, 18, -45);
        // Dome cap sphere
        makesphere(4, 12, 8, 0xF0EEE4, 0, 24, -45);
        // Left wing
        makebox(20, 10, 8, 0xF0EEE4, -22, 5, -45);
        // Right wing
        makebox(20, 10, 8, 0xF0EEE4, 22, 5, -45);
        // Portico columns — 8 columns across central section
        var i;
        for (i = 0; i < 8; i++) {
            makecylinder(0.4, 0.4, 10, 8, 0xF0EEE4, -7 + i * 2, 5, -41);
        }
        // Portico entablature
        makebox(18, 1.5, 2, 0xF0EEE4, 0, 10.75, -41);
        // Portico pediment
        makebox(18, 3, 1, 0xF0EEE4, 0, 13, -41);
    }

    function buildstmartin() {
        // Church nave
        makebox(20, 10, 8, 0xF0EEE4, 40, 5, -35);
        // Steeple tower
        makebox(4, 20, 4, 0xF0EEE4, 40, 10, -35);
        // Spire
        makecone(2, 10, 8, 0xF0EEE4, 40, 25, -35);
        // Portico columns — 4 Corinthian columns
        var i;
        for (i = 0; i < 4; i++) {
            makecylinder(0.35, 0.35, 8, 8, 0xF0EEE4, 36.5 + i * 2.2, 4, -31);
        }
        // Portico entablature
        makebox(10, 1, 2, 0xF0EEE4, 40, 8.5, -31);
    }

    function buildfountains() {
        // West fountain basin
        makebox(12, 0.5, 12, 0x4169E1, -18, 0.65, 0);
        // West fountain basin rim
        makebox(12, 1, 12, 0x808080, -18, 0.35, 0);
        // West central jet
        makecylinder(0.3, 0.5, 4, 8, 0xADD8E6, -18, 2.5, 0);
        makesphere(1, 8, 6, 0xADD8E6, -18, 4.8, 0);
        // East fountain basin
        makebox(12, 0.5, 12, 0x4169E1, 18, 0.65, 0);
        // East fountain basin rim
        makebox(12, 1, 12, 0x808080, 18, 0.35, 0);
        // East central jet
        makecylinder(0.3, 0.5, 4, 8, 0xADD8E6, 18, 2.5, 0);
        makesphere(1, 8, 6, 0xADD8E6, 18, 4.8, 0);
    }

    function buildfourthplinth() {
        // Plinth base
        makebox(3, 4, 3, 0xD2B48C, -20, 2, -20);
        // Contemporary art shape 1 — tall narrow box
        makebox(1.5, 4, 1.5, 0xC0392B, -20, 6, -20);
        // Contemporary art shape 2 — wide flat box
        makebox(3, 0.5, 2, 0x27AE60, -20, 8.25, -20);
        // Contemporary art shape 3 — small cube
        makebox(1, 1, 1, 0x2980B9, -20, 9.0, -20);
    }

    function buildembassies() {
        // Canada House (west side)
        makebox(20, 10, 8, 0xF0EEE4, -40, 5, -10);
        // Canada House columns
        var i;
        for (i = 0; i < 4; i++) {
            makecylinder(0.35, 0.35, 9, 8, 0xF0EEE4, -46 + i * 2.5, 4.5, -6);
        }
        // South Africa House (east side)
        makebox(20, 10, 8, 0xF0EEE4, 40, 5, -10);
        // South Africa House columns
        for (i = 0; i < 4; i++) {
            makecylinder(0.35, 0.35, 9, 8, 0xF0EEE4, 34 + i * 2.5, 4.5, -6);
        }
    }

    function buildcharingcross() {
        // Main Victorian Gothic station building
        makebox(30, 14, 12, 0xD2B48C, 0, 7, 40);
        // Station arched roof ridge
        makebox(30, 3, 1, 0xD2B48C, 0, 14.5, 34);
        // Station facade decorative elements
        makebox(28, 2, 1, 0xD2B48C, 0, 15.5, 34);
        // Eleanor Cross base
        makebox(3, 3, 3, 0xD2B48C, 12, 1.5, 32);
        // Eleanor Cross shaft
        makecylinder(0.5, 0.6, 12, 8, 0xD2B48C, 12, 9, 32);
        // Eleanor Cross spire
        makecone(1.2, 6, 8, 0xD2B48C, 12, 18, 32);
        // Eleanor Cross decorative tier
        makebox(2.5, 1, 2.5, 0xD2B48C, 12, 15.5, 32);
    }

    function buildwhitehall() {
        // Road surface
        makebox(10, 0.3, 60, 0x555555, 0, 0.25, 75);
        // Left ministry building 1
        makebox(20, 10, 8, 0xF0EEE4, -20, 5, 55);
        // Left ministry building 2
        makebox(20, 10, 8, 0xF0EEE4, -20, 5, 75);
        // Left ministry building 3
        makebox(20, 10, 8, 0xF0EEE4, -20, 5, 95);
        // Right ministry building 1
        makebox(20, 10, 8, 0xF0EEE4, 20, 5, 55);
        // Right ministry building 2
        makebox(20, 10, 8, 0xF0EEE4, 20, 5, 75);
        // Right ministry building 3
        makebox(20, 10, 8, 0xF0EEE4, 20, 5, 95);
        // Street lamps (box posts)
        makebox(0.3, 5, 0.3, 0x333333, -6, 2.5, 55);
        makebox(0.3, 5, 0.3, 0x333333, 6, 2.5, 55);
        makebox(0.3, 5, 0.3, 0x333333, -6, 2.5, 75);
        makebox(0.3, 5, 0.3, 0x333333, 6, 2.5, 75);
        makebox(0.3, 5, 0.3, 0x333333, -6, 2.5, 95);
        makebox(0.3, 5, 0.3, 0x333333, 6, 2.5, 95);
    }

    function buildperimeter() {
        // Low perimeter walls around square
        makebox(50, 1, 1, 0x808080, 0, 0.5, -26);
        makebox(50, 1, 1, 0x808080, 0, 0.5, 26);
        makebox(1, 1, 50, 0x808080, -26, 0.5, 0);
        makebox(1, 1, 50, 0x808080, 26, 0.5, 0);
    }

    function init(sceneref) {
        scene = sceneref;
        objects = [];

        buildpavement();
        buildnelsonscolumn();
        buildlions();
        buildnationalgallery();
        buildstmartin();
        buildfountains();
        buildfourthplinth();
        buildembassies();
        buildcharingcross();
        buildwhitehall();
        buildperimeter();
    }

    function update(delta) {
        // No per-frame animation required for static environment
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return { init: init, update: update, reset: reset };
}());
