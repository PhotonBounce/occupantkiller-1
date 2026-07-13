window.SligoAbbey = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 18000;

        // ---- GROUND BASE ----
        // Ground plane approximated with a large flat box
        makeBox(4000, 2, 4000, 0x4a7c4e, cx, -1, 0);

        // ---- SLIGO ABBEY RUINS ----
        // Abbey nave north wall
        makeBox(80, 18, 3, 0x808080, cx - 20, 9, -60);
        // Abbey nave south wall
        makeBox(80, 18, 3, 0x808080, cx - 20, 9, -100);
        // Abbey nave west wall
        makeBox(3, 18, 43, 0x808080, cx - 60, 9, -80);
        // Abbey chancel east wall
        makeBox(3, 20, 43, 0x808080, cx + 40, 10, -80);
        // Chancel north wall
        makeBox(40, 20, 3, 0x808080, cx + 20, 10, -60);
        // Chancel south wall
        makeBox(40, 20, 3, 0x808080, cx + 20, 10, -100);
        // Altar base inside chancel
        makeBox(10, 4, 6, 0x909090, cx + 35, 2, -80);
        // Abbey tower (15th century square tower)
        makeBox(16, 50, 16, 0x707070, cx - 52, 25, -80);
        // Tower parapet top
        makeBox(18, 3, 18, 0x656565, cx - 52, 51, -80);
        // Tower battlement block 1
        makeBox(4, 5, 4, 0x656565, cx - 58, 55, -86);
        // Tower battlement block 2
        makeBox(4, 5, 4, 0x656565, cx - 46, 55, -86);
        // Tower battlement block 3
        makeBox(4, 5, 4, 0x656565, cx - 58, 55, -74);
        // Tower battlement block 4
        makeBox(4, 5, 4, 0x656565, cx - 46, 55, -74);

        // Cloister arcade — decorative arched boxes simulating arches
        makeBox(8, 10, 3, 0x7a7a7a, cx - 10, 5, -115);
        makeBox(8, 10, 3, 0x7a7a7a, cx + 2, 5, -115);
        makeBox(8, 10, 3, 0x7a7a7a, cx + 14, 5, -115);
        makeBox(8, 10, 3, 0x7a7a7a, cx + 26, 5, -115);
        // Cloister lintel over arches
        makeBox(40, 3, 3, 0x7a7a7a, cx + 8, 11, -115);
        // Cloister east wall segment
        makeBox(3, 10, 30, 0x7a7a7a, cx + 30, 5, -130);
        // Cloister garth (garden area floor)
        makeBox(38, 1, 28, 0x556b2f, cx + 8, 0.5, -130);
        // Broken wall fragment 1
        makeBox(12, 8, 3, 0x808080, cx - 20, 4, -120);
        // Broken wall fragment 2
        makeBox(6, 5, 3, 0x808080, cx + 10, 2.5, -58);
        // Window opening frame (decorative box simulating Gothic window)
        makeBox(5, 8, 1, 0x606060, cx - 10, 12, -60);
        makeBox(5, 8, 1, 0x606060, cx + 5, 12, -60);

        // ---- BENBULBEN MOUNTAIN ----
        // Massive flat-topped plateau (tabletop)
        makeBox(600, 120, 300, 0x808080, cx + 800, 60, -600);
        // Green top layer
        makeBox(580, 12, 280, 0x556b2f, cx + 800, 126, -600);
        // Left cliff face reinforcement
        makeBox(30, 140, 300, 0x757575, cx + 500, 70, -600);
        // Right cliff face
        makeBox(30, 140, 300, 0x757575, cx + 1100, 70, -600);
        // Foothills left
        makeBox(200, 40, 200, 0x6b7c5f, cx + 580, 20, -500);
        // Foothills right
        makeBox(200, 40, 200, 0x6b7c5f, cx + 1020, 20, -500);
        // Additional rocky outcrop
        makeBox(80, 60, 60, 0x757070, cx + 750, 30, -460);

        // ---- GARAVOGUE RIVER ----
        // River channel through town — series of flat blue boxes
        makeBox(600, 1, 30, 0x006994, cx - 200, 0.1, 20);
        makeBox(200, 1, 40, 0x006994, cx + 50, 0.1, 35);
        makeBox(300, 1, 25, 0x006994, cx + 250, 0.1, 50);
        // River bank stone wall north
        makeBox(600, 3, 4, 0x999988, cx - 200, 1.5, 5);
        // River bank south
        makeBox(600, 3, 4, 0x999988, cx - 200, 1.5, 35);

        // ---- SLIGO TOWN CENTER ----
        // Victorian shopfronts — north side of main street
        makeBox(18, 20, 12, 0xcd5c5c, cx - 150, 10, 70);
        makeBox(18, 22, 12, 0xb84a4a, cx - 130, 11, 70);
        makeBox(18, 18, 12, 0xcd5c5c, cx - 110, 9, 70);
        makeBox(18, 24, 12, 0xc05050, cx - 90, 12, 70);
        makeBox(18, 20, 12, 0xd46060, cx - 70, 10, 70);
        makeBox(18, 22, 12, 0xcd5c5c, cx - 50, 11, 70);
        // South side shopfronts
        makeBox(18, 20, 12, 0xb05040, cx - 150, 10, 110);
        makeBox(18, 18, 12, 0xcd5c5c, cx - 130, 9, 110);
        makeBox(18, 22, 12, 0xc86060, cx - 110, 11, 110);
        makeBox(18, 20, 12, 0xb84a4a, cx - 90, 10, 110);
        makeBox(18, 16, 12, 0xcd5c5c, cx - 70, 8, 110);
        makeBox(18, 24, 12, 0xc05050, cx - 50, 12, 110);

        // Yeats Statue Plaza — open paved area
        makeBox(50, 1, 50, 0x999980, cx - 30, 0.5, 88);
        // Plaza decorative trees (cone shrubs)
        makeCone(3, 10, 6, 0x228b22, cx - 15, 5, 75);
        makeCone(3, 10, 6, 0x228b22, cx - 45, 5, 75);
        makeCone(3, 10, 6, 0x228b22, cx - 15, 5, 100);
        makeCone(3, 10, 6, 0x228b22, cx - 45, 5, 100);

        // W.B. Yeats Memorial — tall abstract silver sculpture
        makeBox(3, 30, 3, 0xc0c0c0, cx - 30, 15, 88);
        // Abstract top piece
        makeSphere(5, 8, 6, 0xc0c0c0, cx - 30, 32, 88);
        // Plinth base
        makeBox(10, 4, 10, 0xa0a0a0, cx - 30, 2, 88);
        // Angled arm of sculpture
        makeBox(2, 16, 2, 0xc0c0c0, cx - 28, 22, 86);

        // ---- SLIGO CATHEDRAL (Cathedral of the Immaculate Conception) ----
        // Main nave body
        makeBox(30, 30, 60, 0x808080, cx + 120, 15, 80);
        // Twin towers
        makeBox(12, 55, 12, 0x787878, cx + 108, 27, 52);
        makeBox(12, 55, 12, 0x787878, cx + 132, 27, 52);
        // Tower spires
        makeCone(7, 25, 4, 0x707070, cx + 108, 67, 52);
        makeCone(7, 25, 4, 0x707070, cx + 132, 67, 52);
        // Apse (east end)
        makeBox(20, 28, 16, 0x808080, cx + 120, 14, 112);
        // Nave roof ridge
        makeBox(32, 8, 62, 0x6a6a6a, cx + 120, 34, 80);
        // Gothic window decorations on facade
        makeBox(4, 12, 1, 0x707070, cx + 114, 22, 51);
        makeBox(4, 12, 1, 0x707070, cx + 120, 22, 51);
        makeBox(4, 12, 1, 0x707070, cx + 126, 22, 51);
        // Cathedral entrance steps
        makeBox(22, 2, 8, 0x909090, cx + 120, 1, 48);

        // ---- LOUGH GILL ----
        // Lake body
        makeBox(500, 1, 300, 0x006994, cx + 600, 0.05, 200);
        // Lake shore pebble fringe
        makeBox(520, 2, 10, 0xaaaaaa, cx + 600, 0.5, 52);
        makeBox(520, 2, 10, 0xaaaaaa, cx + 600, 0.5, 348);

        // Isle of Innisfree — small green island in the lake
        makeBox(25, 3, 20, 0x228b22, cx + 680, 1.5, 220);
        // Trees on Innisfree
        makeCone(4, 12, 6, 0x1a6e1a, cx + 678, 9, 218);
        makeCone(3, 9, 6, 0x228b22, cx + 688, 7.5, 224);

        // ---- CARROWMORE MEGALITHIC CEMETERY ----
        // Stone circle 1 — dolmen capstone
        makeBox(6, 2, 5, 0x909090, cx - 300, 3, 300);
        // Dolmen upright stones
        makeBox(1.5, 4, 1.5, 0x909090, cx - 303, 2, 298);
        makeBox(1.5, 4, 1.5, 0x909090, cx - 297, 2, 302);
        // Stone circle 2 surrounding stones
        makeBox(2, 3, 2, 0x858585, cx - 320, 1.5, 280);
        makeBox(2, 3, 2, 0x858585, cx - 310, 1.5, 275);
        makeBox(2, 3, 2, 0x858585, cx - 300, 1.5, 273);
        makeBox(2, 3, 2, 0x858585, cx - 290, 1.5, 275);
        makeBox(2, 3, 2, 0x858585, cx - 280, 1.5, 280);
        // Passage tomb mound
        makeBox(20, 6, 20, 0x556b2f, cx - 350, 3, 320);
        // Mound capstone
        makeBox(8, 2, 7, 0x909090, cx - 350, 7, 320);
        // Scattered standing stones
        makeBox(2, 5, 1.5, 0x909090, cx - 270, 2.5, 310);
        makeBox(1.5, 4, 1.5, 0x909090, cx - 340, 2, 290);
        makeBox(2, 6, 1.5, 0x808080, cx - 260, 3, 330);
        // Field grass around cemetery
        makeBox(200, 1, 150, 0x4e7c3a, cx - 310, 0.2, 305);

        // ---- SURFING BEACH ----
        // Sandy beach area
        makeBox(300, 2, 80, 0xf5deb3, cx - 500, 0.5, -300);
        // White wave surf line
        makeBox(300, 3, 10, 0xffffff, cx - 500, 1, -340);
        // Second wave
        makeBox(250, 2, 6, 0xe8e8e8, cx - 510, 0.8, -330);
        // Sea water
        makeBox(300, 1, 200, 0x006994, cx - 500, 0, -430);
        // Beach dune
        makeBox(60, 6, 20, 0xe8c97f, cx - 420, 3, -265);
        makeBox(80, 5, 18, 0xeacf8a, cx - 560, 2.5, -268);
        // Dune grass tufts (cone)
        makeCone(2, 5, 5, 0x6aaa3a, cx - 430, 8.5, -268);
        makeCone(2, 5, 5, 0x6aaa3a, cx - 415, 8.5, -262);

        // ---- EXTRA TOWN DETAILS ----
        // Road surface through town
        makeBox(600, 0.5, 20, 0x444444, cx - 150, 0, 90);
        // Bridge over Garavogue
        makeBox(30, 3, 30, 0x888877, cx + 60, 2, 20);
        // Bridge railings
        makeBox(30, 4, 1, 0x777766, cx + 60, 3.5, 6);
        makeBox(30, 4, 1, 0x777766, cx + 60, 3.5, 34);
        // Market cross / old cross pillar in town
        makeCylinder(0.8, 0.8, 14, 6, 0x888888, cx - 200, 7, 90);
        makeBox(6, 1.5, 1.5, 0x888888, cx - 200, 13.5, 90);
        // Town clock tower
        makeBox(8, 36, 8, 0x9a8a7a, cx + 0, 18, 90);
        makeCone(5, 12, 4, 0x7a6a5a, cx + 0, 42, 90);
        // Pub sign cylinder
        makeCylinder(1, 1, 1.5, 8, 0x8b4513, cx - 160, 18, 66);

        // ---- ROLLING COUNTRYSIDE HILLS ----
        // Hillocks to the south
        makeSphere(60, 8, 6, 0x4e7c3a, cx - 100, -20, 400);
        makeSphere(80, 8, 6, 0x4e7c3a, cx + 200, -30, 450);
        makeSphere(50, 8, 6, 0x4a7840, cx + 500, -25, 380);
        // Far hill range
        makeBox(800, 60, 100, 0x3d6b35, cx + 100, 10, 550);

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
