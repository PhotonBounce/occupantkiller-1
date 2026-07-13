/* ───────────────────────────────────────────────────────────────────────
   FAVERSHAM CREEK — Faversham gunpowder mills, medieval town, Thames Estuary marshes
   World offset: x = +6320, z = 0
   Depends on: THREE (global)
   ─────────────────────────────────────────────────────────────────────── */
window.FavershamCreek = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 6320;
    var OZ = 0;

    function addmesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        return addmesh(mesh);
    }

    function cylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        return addmesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        return addmesh(mesh);
    }

    function build() {

        // 1. Faversham Abbey Gatehouse Ruins
        // Two pillar piers 3x3x8
        box(3, 8, 3, 0xBBB8A0, -30, 4, -60);
        box(3, 8, 3, 0xBBB8A0, -18, 4, -60);
        // Surviving arch lintel 12x2x2
        box(12, 2, 2, 0xBBB8A0, -24, 9, -60);

        // 2. Guildhall — 1574 timber-framed market hall
        // 8 open pillar boxes 1x1x4 (support columns at ground level)
        box(1, 4, 1, 0x5C4A1A, 0, 2,   0);
        box(1, 4, 1, 0x5C4A1A, 5, 2,   0);
        box(1, 4, 1, 0x5C4A1A, 10, 2,  0);
        box(1, 4, 1, 0x5C4A1A, 15, 2,  0);
        box(1, 4, 1, 0x5C4A1A, 0, 2,   6);
        box(1, 4, 1, 0x5C4A1A, 5, 2,   6);
        box(1, 4, 1, 0x5C4A1A, 10, 2,  6);
        box(1, 4, 1, 0x5C4A1A, 15, 2,  6);
        // Main body raised above ground on pillars: 15x10x6 at y=9 (4 pillars + half body height)
        box(15, 6, 10, 0x8B6914, 7.5, 7, 3);

        // 3. Shepherd Neame Brewery
        // Main building 25x20x10
        box(25, 10, 20, 0x885533, 60, 5, -10);
        // Chimney CylinderGeometry 3r x 22 tall
        cylinder(3, 3, 22, 10, 0x663322, 70, 11, -5);
        // 3 fermentation tanks CylinderGeometry 4r x 6 tall
        cylinder(4, 4, 6, 12, 0x774422, 50, 3, -15);
        cylinder(4, 4, 6, 12, 0x774422, 50, 3, -5);
        cylinder(4, 4, 6, 12, 0x774422, 50, 3,  5);

        // 4. Faversham Creek — tidal creek 60x0.3x8
        box(60, 0.3, 8, 0x447799, 30, 0.15, 30);

        // 5. Creek barges — 3 flat-bottomed Thames barges
        // Barge 1
        box(16, 1.5, 4, 0x4A3520, 10, 0.75, 30);
        box(4, 2, 2,  0x5A4030, 8,  2.5,  30);
        box(2, 5, 0.5, 0xCC3333, 10, 4,   29);
        box(2, 5, 0.5, 0xCC3333, 10, 4,   31);

        // Barge 2
        box(16, 1.5, 4, 0x4A3520, 30, 0.75, 30);
        box(4, 2, 2,  0x5A4030, 28, 2.5,  30);
        box(2, 5, 0.5, 0xCC3333, 30, 4,   29);
        box(2, 5, 0.5, 0xCC3333, 30, 4,   31);

        // Barge 3
        box(16, 1.5, 4, 0x4A3520, 50, 0.75, 30);
        box(4, 2, 2,  0x5A4030, 48, 2.5,  30);
        box(2, 5, 0.5, 0xCC3333, 50, 4,   29);
        box(2, 5, 0.5, 0xCC3333, 50, 4,   31);

        // 6. Gunpowder Mill — Chart Mills: 5 circular mill buildings CylinderGeometry 5r x 4 tall
        cylinder(5, 5, 4, 14, 0xAA9977, -50, 2, -20);
        cylinder(5, 5, 4, 14, 0xAA9977, -38, 2, -20);
        cylinder(5, 5, 4, 14, 0xAA9977, -26, 2, -20);
        cylinder(5, 5, 4, 14, 0xAA9977, -50, 2, -32);
        cylinder(5, 5, 4, 14, 0xAA9977, -38, 2, -32);
        // Roof cone caps for each mill
        cone(5.2, 3, 14, 0x887755, -50, 5.5, -20);
        cone(5.2, 3, 14, 0x887755, -38, 5.5, -20);
        cone(5.2, 3, 14, 0x887755, -26, 5.5, -20);
        cone(5.2, 3, 14, 0x887755, -50, 5.5, -32);
        cone(5.2, 3, 14, 0x887755, -38, 5.5, -32);

        // 7. Medieval market street — 5 timber-framed houses 5x7x8 jettied
        // Ground floor 5x4x8, upper floor slightly wider (jettied) 6x3x8, roof cone
        var houseX = [-80, -74, -68, -62, -56];
        var houseZ = [-5, -5, -5, -5, -5];
        for (var i = 0; i < 5; i++) {
            // Ground floor
            box(5, 4, 8, 0x8B6914, houseX[i], 2, houseZ[i]);
            // Upper floor (jettied, slightly wider)
            box(6, 3, 8, 0x8B6914, houseX[i], 5.5, houseZ[i]);
            // Roof
            cone(4.5, 3, 4, 0x5C3A1E, houseX[i], 8.5, houseZ[i]);
        }

        // 8. Marsh reed beds — 10 thin pole cylinders 0.3r x 2.5 tall clustered
        var reedPositions = [
            [80, 40], [82, 42], [78, 44], [84, 38], [81, 46],
            [86, 43], [79, 41], [83, 45], [77, 39], [85, 41]
        ];
        for (var j = 0; j < reedPositions.length; j++) {
            cylinder(0.3, 0.3, 2.5, 5, 0x8B7355, reedPositions[j][0], 1.25, reedPositions[j][1]);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
