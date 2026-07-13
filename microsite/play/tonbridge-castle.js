window.TonbridgeCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef; camera = cameraRef;
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

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
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
        var OX = 6120;
        var OZ = 0;

        // --- 1. Gatehouse twin D-shaped towers ---
        // Left tower
        makebox(8, 18, 6, 0xCC9966, OX - 7, 9, OZ + 2);
        // Right tower
        makebox(8, 18, 6, 0xCC9966, OX + 7, 9, OZ + 2);
        // Entrance arch lintel (top of gate passage)
        makebox(6, 2, 6, 0xCC9966, OX, 17, OZ + 2);
        // Gate passage back wall
        makebox(6, 8, 1, 0xCC9966, OX, 4, OZ + 5);

        // Battlements — 8 merlons across both towers (4 per tower)
        makebox(1.5, 2, 1, 0xCC9966, OX - 9,   19.5, OZ + 2);
        makebox(1.5, 2, 1, 0xCC9966, OX - 6.5, 19.5, OZ + 2);
        makebox(1.5, 2, 1, 0xCC9966, OX - 4,   19.5, OZ + 2);
        makebox(1.5, 2, 1, 0xCC9966, OX - 1.5, 19.5, OZ + 2);
        makebox(1.5, 2, 1, 0xCC9966, OX + 1.5, 19.5, OZ + 2);
        makebox(1.5, 2, 1, 0xCC9966, OX + 4,   19.5, OZ + 2);
        makebox(1.5, 2, 1, 0xCC9966, OX + 6.5, 19.5, OZ + 2);
        makebox(1.5, 2, 1, 0xCC9966, OX + 9,   19.5, OZ + 2);
        // Objects so far: 12

        // --- 2. Castle mound (motte) — 4 stacked diminishing boxes ---
        makebox(30, 3, 30, 0x5A4A2A, OX,      1.5,  OZ + 20);
        makebox(24, 3, 24, 0x5A4A2A, OX,      4.5,  OZ + 20);
        makebox(18, 3, 18, 0x5A4A2A, OX,      7.5,  OZ + 20);
        makebox(12, 3, 12, 0x5A4A2A, OX,      10.5, OZ + 20);
        // Objects so far: 16

        // --- 3. Inner bailey walls — 3 curtain wall sections 20×1.5×6 ---
        makebox(20, 6, 1.5, 0xBB9955, OX - 15, 3, OZ + 12);
        makebox(20, 6, 1.5, 0xBB9955, OX + 15, 3, OZ + 12);
        makebox(1.5, 6, 20, 0xBB9955, OX - 24, 3, OZ + 20);
        // Objects so far: 19

        // --- 4. River Medway — blue channel 60×0.3×8 ---
        makebox(60, 0.3, 8, 0x336688, OX, 0.15, OZ - 20);

        // Stone bridge — 3 arch piers + deck
        makebox(3, 3, 8, 0xAA9977, OX - 10, 1.5, OZ - 20);
        makebox(3, 3, 8, 0xAA9977, OX,      1.5, OZ - 20);
        makebox(3, 3, 8, 0xAA9977, OX + 10, 1.5, OZ - 20);
        makebox(34, 0.8, 5, 0xAA9977, OX,   3.4, OZ - 20);
        // Objects so far: 24

        // --- 5. Oast houses — 4 hop-drying kilns ---
        // Each: CylinderGeometry tower + ConeGeometry cap + rectangular kiln room
        var oastPositions = [
            [OX + 40, OZ + 10],
            [OX + 52, OZ + 10],
            [OX + 40, OZ + 22],
            [OX + 52, OZ + 22]
        ];
        for (var oi = 0; oi < oastPositions.length; oi++) {
            var ox2 = oastPositions[oi][0];
            var oz2 = oastPositions[oi][1];
            makecylinder(3, 3, 10, 16, 0xF5F5F5, ox2,     5,    oz2);
            makecone(3,    5,  16,      0xF5F5F5, ox2,     12.5, oz2);
            makebox(8, 6, 6,             0x993322, ox2 + 6, 3,    oz2);
        }
        // Objects so far: 24 + 12 = 36

        // --- 6. Hop garden poles — 8 thin poles in rows ---
        var poleStartX = OX + 30;
        var poleStartZ = OZ + 35;
        for (var pi = 0; pi < 8; pi++) {
            var px = poleStartX + (pi % 4) * 4;
            var pz = poleStartZ + Math.floor(pi / 4) * 5;
            makecylinder(0.2, 0.2, 5, 6, 0x8B6914, px, 2.5, pz);
        }
        // Objects so far: 44

        // --- 7. High Street market town — 8 Victorian shops 5×6×7 ---
        var shopColors = [
            0x993322, 0xBB9955, 0xCC8844, 0xAA7733,
            0xDD9966, 0xF5ECD7, 0xEEDDAA, 0xDDCCBB
        ];
        for (var si = 0; si < 8; si++) {
            var sx = OX - 36 + si * 7;
            var sz = OZ - 8;
            // Shop body
            makebox(5, 7, 6, shopColors[si], sx, 3.5, sz);
            // Shop roof
            makebox(5, 1, 6, 0x886655, sx, 7.5, sz);
        }
        // Objects so far: 44 + 16 = 60

        // --- 8. Parish church St Peter --- (6 objects)
        var cx = OX - 30;
        var cz = OZ + 5;
        // Nave 18×10×8
        makebox(18, 8, 10, 0xBBAA88, cx,      4,  cz);
        // Tower 4×4×14
        makebox(4,  14, 4, 0xBBAA88, cx - 11, 7,  cz);
        // Spire ConeGeometry
        makecone(2.5, 8, 8, 0xBBAA88, cx - 11, 18, cz);
        // Chancel
        makebox(8, 7, 8, 0xBBAA88, cx + 13, 3.5, cz);
        // Roof ridge box
        makebox(18, 2, 2, 0x998877, cx, 9.5, cz);
        // Objects so far: 60 + 5 = 65
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        objects = []; scene = null; camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
