window.BrixtonElectric = (function() {
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

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 5680;
        var oz = 0;

        // 1. Brixton Academy - Art Deco music venue
        // Main building body
        makebox(35, 12, 25, 0x992222, ox + 0, 6, oz + 0);
        // Ornate facade: 6 decorative pilasters along front face
        makebox(1, 14, 1, 0xAA4444, ox - 14, 7, oz - 12);
        makebox(1, 14, 1, 0xAA4444, ox - 8,  7, oz - 12);
        makebox(1, 14, 1, 0xAA4444, ox - 2,  7, oz - 12);
        makebox(1, 14, 1, 0xAA4444, ox + 4,  7, oz - 12);
        makebox(1, 14, 1, 0xAA4444, ox + 10, 7, oz - 12);
        makebox(1, 14, 1, 0xAA4444, ox + 16, 7, oz - 12);
        // Marquee sign platform
        makebox(30, 2, 4, 0xCCCC33, ox + 0, 13, oz - 13);
        // Parapet / Art Deco top trim
        makebox(37, 1, 2, 0x771111, ox + 0, 12, oz - 12);

        // 2. Electric Avenue - covered market street arched iron structure
        // 20 arch ribs, each 2x1x8, placed every 3 blocks along x-axis
        var archStartX = ox - 55;
        for (var i = 0; i < 20; i++) {
            makebox(2, 1, 8, 0x445566, archStartX + i * 3, 5, oz + 50);
        }
        // Side walls of Electric Avenue
        makebox(60, 5, 1, 0x556677, ox - 25, 2.5, oz + 46);
        makebox(60, 5, 1, 0x556677, ox - 25, 2.5, oz + 54);
        // Road surface (thin box)
        makebox(60, 0.2, 8, 0x333333, ox - 25, 0.1, oz + 50);

        // 3. Brixton Market stalls - Granville Arcade
        // 2 rows x 15 stalls, each 3x4x3, varied colors
        var stallColors = [
            0xCC4422, 0x22CC44, 0x2244CC, 0xCCCC22, 0x22CCCC,
            0xCC22CC, 0xFF8800, 0x00AAFF, 0xFF0055, 0x55FF00,
            0xAA5500, 0x005500, 0x550055, 0xAAAAAA, 0x884400
        ];
        for (var s = 0; s < 15; s++) {
            makebox(3, 4, 3, stallColors[s], ox - 40 + s * 4, 2, oz + 70);
            makebox(3, 4, 3, stallColors[14 - s], ox - 40 + s * 4, 2, oz + 78);
        }

        // 4. Electric Power Station - converted venue
        // Main industrial building
        makebox(20, 10, 15, 0x554433, ox + 60, 5, oz - 20);
        // Brick chimney CylinderGeometry, 2r x 20 tall
        makecyl(2, 2, 20, 8, 0x884422, ox + 72, 10, oz - 20);
        // Loading dock
        makebox(8, 4, 4, 0x443322, ox + 50, 2, oz - 22);

        // 5. David Bowie mural wall
        makebox(10, 8, 1, 0xFF3399, ox + 40, 4, oz + 20);
        // Zigzag lightning bolt accent (thin box)
        makebox(3, 6, 0.2, 0xFFFF00, ox + 40, 4, oz + 19.5);

        // 6. Brixton Police Station - brutalist block
        makebox(15, 9, 12, 0x888877, ox - 30, 4.5, oz - 30);
        // Steps
        makebox(10, 1, 3, 0x777766, ox - 30, 0.5, oz - 36.5);
        // Roof parapet
        makebox(16, 1, 13, 0x666655, ox - 30, 9, oz - 30);

        // 7. Victorian terraces - 4 rows of 8 terraced houses, each 4x7x7
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 8; col++) {
                makebox(4, 7, 7, 0x9B3A2A, ox - 80 + col * 5, 3.5, oz - 60 + row * 10);
            }
        }

        // 8. Windrush Square
        // Low plinth stone
        makebox(8, 1, 8, 0xCCBBAA, ox + 20, 0.5, oz - 50);
        // Tall obelisk BoxGeometry 1x1x8
        makebox(1, 8, 1, 0xBBAA99, ox + 20, 5, oz - 50);
        // Square paving
        makebox(20, 0.2, 20, 0x998877, ox + 20, 0.1, oz - 50);

        // 9. Pop-up market containers - 6 shipping containers repurposed as stalls
        var containerColors = [0x558844, 0x884455, 0x445588, 0x558844, 0x884455, 0x445588];
        for (var c = 0; c < 6; c++) {
            makebox(6, 2.5, 2.5, containerColors[c], ox - 10 + c * 8, 1.25, oz + 95);
        }

        // Extra detail elements to reach 50-65 objects
        // Street lamp posts along Electric Avenue
        makecyl(0.15, 0.15, 6, 6, 0x999999, archStartX + 2, 3, oz + 48);
        makecyl(0.15, 0.15, 6, 6, 0x999999, archStartX + 14, 3, oz + 48);
        makecyl(0.15, 0.15, 6, 6, 0x999999, archStartX + 26, 3, oz + 48);
        makecyl(0.15, 0.15, 6, 6, 0x999999, archStartX + 38, 3, oz + 48);
        // Academy roof dome / central feature
        makecyl(4, 4, 3, 8, 0x881111, ox, 14, oz - 5);
        // Market entrance arch
        makebox(1, 7, 1, 0x334455, ox - 62, 3.5, oz + 50);
        makebox(1, 7, 1, 0x334455, ox - 62, 3.5, oz + 46);
        makebox(5, 1, 5, 0x334455, ox - 62, 7, oz + 48);
        // Power station windows (decorative flat boxes on facade)
        makebox(3, 2, 0.3, 0x222222, ox + 52, 7, oz - 13);
        makebox(3, 2, 0.3, 0x222222, ox + 60, 7, oz - 13);
        makebox(3, 2, 0.3, 0x222222, ox + 68, 7, oz - 13);
        // Windrush Square benches
        makebox(3, 0.5, 0.8, 0x886644, ox + 13, 0.8, oz - 50);
        makebox(3, 0.5, 0.8, 0x886644, ox + 27, 0.8, oz - 50);
        makebox(0.8, 0.5, 3, 0x886644, ox + 20, 0.8, oz - 57);
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
