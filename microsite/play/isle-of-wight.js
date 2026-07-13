window.IsleOfWight = (function() {
    'use strict';

    var scene;
    var objects = [];
    var OX = 4040;
    var OZ = 2200;

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

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildneedles() {
        // Stack 1 - tallest needle
        makebox(2, 12, 2, 0xFFFAFA, -120, 6, -80);
        // Stack 2 - medium needle
        makebox(2, 10, 2, 0xFFFAFA, -130, 5, -90);
        // Stack 3 - short needle (outermost)
        makebox(2, 8, 2, 0xFFFAFA, -140, 4, -100);
        // Lighthouse on outermost needle
        makecylinder(1.5, 1.5, 8, 8, 0xFF2222, -140, 12, -100);
        makecylinder(1.5, 1.5, 4, 8, 0xFFFFFF, -140, 18, -100);
        makecylinder(1.0, 1.0, 2, 8, 0xFF2222, -140, 21, -100);
        // Lighthouse lamp housing
        makebox(2.5, 2, 2.5, 0xFFDD00, -140, 23, -100);
        makecone(2, 2, 8, 0xFF2222, -140, 25, -100);
    }

    function buildalumbay() {
        // Coloured cliff bands - red, yellow, white, grey, purple layers
        makebox(40, 3, 8, 0xCC3300, -90, 1.5, -60);
        makebox(40, 3, 8, 0xFFCC00, -90, 4.5, -60);
        makebox(40, 3, 8, 0xF5F5F5, -90, 7.5, -60);
        makebox(40, 3, 8, 0x888888, -90, 10.5, -60);
        makebox(40, 3, 8, 0x7B3F8C, -90, 13.5, -60);
        // Side cliffs
        makebox(8, 15, 30, 0xCC3300, -68, 7.5, -45);
        makebox(8, 12, 30, 0xFFCC00, -68, 6, -45);
    }

    function buildcarisbrooke() {
        // Motte (mound)
        makebox(30, 6, 30, 0x8B7355, 20, 3, 30);
        // Keep (main tower)
        makebox(12, 18, 12, 0xD2B48C, 20, 15, 30);
        // Battlements
        makebox(14, 3, 14, 0xD2B48C, 20, 25.5, 30);
        // Curtain wall - north
        makebox(60, 8, 3, 0xD2B48C, 20, 7, 0);
        // Curtain wall - south
        makebox(60, 8, 3, 0xD2B48C, 20, 7, 60);
        // Curtain wall - west
        makebox(3, 8, 60, 0xD2B48C, -10, 7, 30);
        // Curtain wall - east
        makebox(3, 8, 60, 0xD2B48C, 50, 7, 30);
        // Gate tower left
        makebox(6, 12, 6, 0xD2B48C, 14, 9, 0);
        // Gate tower right
        makebox(6, 12, 6, 0xD2B48C, 26, 9, 0);
        // Portcullis arch
        makebox(8, 8, 3, 0x8B6914, 20, 10, 0);
        // Corner towers
        makebox(6, 12, 6, 0xD2B48C, -10, 9, 0);
        makebox(6, 12, 6, 0xD2B48C, 50, 9, 0);
        makebox(6, 12, 6, 0xD2B48C, -10, 9, 60);
        makebox(6, 12, 6, 0xD2B48C, 50, 9, 60);
    }

    function buildosbornehouse() {
        // Main palace block
        makebox(50, 16, 30, 0xFFF8DC, 80, 8, -40);
        // Left wing
        makebox(20, 12, 20, 0xFFF8DC, 45, 6, -40);
        // Right wing
        makebox(20, 12, 20, 0xFFF8DC, 115, 6, -40);
        // Left Italianate tower
        makebox(10, 30, 10, 0xFFF8DC, 50, 15, -50);
        makecone(6, 6, 4, 0xCCBB99, 50, 32, -50);
        // Right Italianate tower
        makebox(10, 30, 10, 0xFFF8DC, 110, 15, -50);
        makecone(6, 6, 4, 0xCCBB99, 110, 32, -50);
        // Formal garden hedges
        makebox(4, 3, 20, 0x228B22, 65, 1.5, -70);
        makebox(4, 3, 20, 0x228B22, 95, 1.5, -70);
        makebox(30, 3, 4, 0x228B22, 80, 1.5, -80);
        makebox(30, 3, 4, 0x228B22, 80, 1.5, -60);
        makebox(4, 3, 10, 0x228B22, 70, 1.5, -72);
        makebox(4, 3, 10, 0x228B22, 90, 1.5, -72);
    }

    function buildcowesharbour() {
        // Yacht club building
        makebox(20, 10, 15, 0xFFFFFF, -30, 5, -130);
        makebox(20, 3, 15, 0xCC0000, -30, 11.5, -130);
        // Harbour wall
        makebox(80, 4, 4, 0x888888, -10, 2, -120);
        makebox(4, 4, 40, 0x888888, 30, 2, -100);
        // Water area (blue boxes for harbour)
        makebox(70, 1, 30, 0x1E90FF, -5, 0.5, -110);
        // Sailboats (10 boats)
        buildsailboat(-20, -115);
        buildsailboat(-10, -112);
        buildsailboat(0, -108);
        buildsailboat(10, -115);
        buildsailboat(20, -110);
        buildsailboat(-5, -120);
        buildsailboat(5, -118);
        buildsailboat(15, -105);
        buildsailboat(-15, -106);
        buildsailboat(25, -118);
    }

    function buildsailboat(bx, bz) {
        // Hull
        makebox(4, 1.5, 8, 0xDEB887, bx, 1.75, bz);
        // Mast
        makecylinder(0.2, 0.2, 10, 6, 0x8B6914, bx, 7, bz);
        // Sail
        makebox(0.2, 6, 4, 0xFFFFFF, bx, 8, bz - 1);
    }

    function buildrydepier() {
        // 50 segments along pier, each 12 units long = 600 total
        var i;
        for (i = 0; i < 50; i = i + 1) {
            makebox(4, 2, 12, 0x8B4513, 200, 2, -140 + (i * 12));
            // Pier supports every other segment
            if (i % 2 === 0) {
                makecylinder(0.4, 0.4, 4, 4, 0x6B3410, 198, 0, -140 + (i * 12));
                makecylinder(0.4, 0.4, 4, 4, 0x6B3410, 202, 0, -140 + (i * 12));
            }
        }
        // Pier entrance building
        makebox(8, 8, 10, 0x8B4513, 200, 5, -142);
        makebox(12, 3, 12, 0x8B4513, 200, 9.5, -142);
    }

    function buildstcatslighthouse() {
        // Cliff base
        makebox(20, 8, 20, 0x9B8B6B, 40, 4, 140);
        // White tower
        makebox(8, 24, 8, 0xFFFFFF, 40, 20, 140);
        // Black cone top
        makecone(5, 6, 8, 0x111111, 40, 35, 140);
        // Lamp room
        makebox(6, 4, 6, 0xFFDD00, 40, 33, 140);
        // Outbuildings
        makebox(12, 5, 8, 0xFFFFFF, 52, 2.5, 140);
        makebox(12, 5, 8, 0xFFFFFF, 28, 2.5, 140);
    }

    function buildbembridgewindmill() {
        // Stone cylinder tower
        makecylinder(4, 5, 20, 10, 0xC0A882, 120, 10, 80);
        // Cap
        makecone(5, 5, 8, 0x8B6914, 120, 22.5, 80);
        // 4 wooden sails in X pattern
        // Sail 1 - NW diagonal
        makebox(2, 16, 1, 0x8B4513, 116, 22, 79);
        // Sail 2 - NE diagonal
        makebox(16, 2, 1, 0x8B4513, 120, 22, 79);
        // Sail 3 - SW diagonal (same as 1, other side)
        makebox(2, 16, 1, 0x8B4513, 124, 22, 79);
        // Sail 4 - SE diagonal
        makebox(16, 2, 1, 0x8B4513, 120, 18, 79);
    }

    function buildshanklinchine() {
        // Left cliff wall
        makebox(6, 20, 60, 0x228B22, -60, 10, 100);
        // Right cliff wall
        makebox(6, 20, 60, 0x228B22, -40, 10, 100);
        // Deeper inner walls (ravine effect)
        makebox(4, 24, 60, 0x1A6B1A, -58, 12, 100);
        makebox(4, 24, 60, 0x1A6B1A, -42, 12, 100);
        // Rock floor of chine
        makebox(12, 2, 60, 0x7B6B5B, -50, 1, 100);
        // Water trickle
        makebox(3, 2.1, 60, 0x4488CC, -50, 1.1, 100);
        // End cliff face
        makebox(20, 20, 6, 0x228B22, -50, 10, 70);
        // Upper cliff top
        makebox(30, 6, 60, 0x4B7B2B, -50, 23, 100);
    }

    function buildislandbase() {
        // Main island terrain base (several large boxes)
        makebox(300, 4, 200, 0x5B8B3B, 0, -2, 0);
        makebox(200, 4, 150, 0x5B8B3B, -80, -2, -50);
        makebox(150, 4, 100, 0x5B8B3B, 100, -2, 50);
        // Downland hills (central ridge)
        makebox(100, 12, 40, 0x5B8B3B, 30, 6, 10);
        makebox(80, 10, 35, 0x5B8B3B, -20, 5, -10);
        makebox(60, 8, 30, 0x5B8B3B, 80, 4, 20);
        // Sea surrounding (blue)
        makebox(500, 1, 500, 0x006994, 0, -3, 0);
    }

    function buildtrees() {
        var i;
        var treepositions = [
            [10, 0, 50], [30, 0, 45], [-20, 0, 55], [50, 0, 35],
            [15, 0, 70], [-35, 0, 25], [60, 0, 60], [-10, 0, 80],
            [40, 0, 20], [-50, 0, 40], [70, 0, 10], [25, 0, -20],
            [-40, 0, 10], [55, 0, -30], [85, 0, -10]
        ];
        for (i = 0; i < treepositions.length; i = i + 1) {
            var tp = treepositions[i];
            makecylinder(0.5, 0.8, 4, 6, 0x6B4226, tp[0], 2, tp[2]);
            makecone(3, 6, 6, 0x228B22, tp[0], 8, tp[2]);
        }
    }

    function buildroads() {
        // Main road across island (A3054 equivalent)
        makebox(200, 0.5, 6, 0x444444, 50, 0.25, 20);
        // Road to Ryde
        makebox(100, 0.5, 6, 0x444444, 160, 0.25, -20);
        // Road to Newport (centre)
        makebox(6, 0.5, 80, 0x444444, 30, 0.25, 60);
    }

    function init(sceneref) {
        scene = sceneref;
        buildislandbase();
        buildneedles();
        buildalumbay();
        buildcarisbrooke();
        buildosbornehouse();
        buildcowesharbour();
        buildrydepier();
        buildstcatslighthouse();
        buildbembridgewindmill();
        buildshanklinchine();
        buildtrees();
        buildroads();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i = i + 1) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
        scene = null;
    }

    return { init: init, update: update, reset: reset };

}());
