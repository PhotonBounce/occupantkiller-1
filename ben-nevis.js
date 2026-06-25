window.BenNevis = (function() {
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
        var cx = 19840;

        // ----------------------------------------------------------------
        // BEN NEVIS MOUNTAIN — stacked box pyramid, rocky grey
        // ----------------------------------------------------------------
        // Base layer — wide foothills
        makeBox(900, 60, 700, 0x6B6B6B, cx + 200, 30, -80);
        // Lower mountain body
        makeBox(700, 120, 550, 0x7A7A7A, cx + 200, 90, -70);
        // Mid mountain
        makeBox(520, 160, 420, 0x808080, cx + 190, 210, -60);
        // Upper mountain
        makeBox(380, 180, 310, 0x888888, cx + 180, 370, -50);
        // High shoulder east
        makeBox(260, 140, 220, 0x8B8B8B, cx + 170, 510, -40);
        // High shoulder west
        makeBox(200, 100, 180, 0x828282, cx + 120, 500, 60);
        // Near-summit band
        makeBox(180, 100, 160, 0x909090, cx + 165, 620, -35);
        // Summit block
        makeBox(120, 80, 110, 0x8B8B8B, cx + 160, 720, -30);
        // Summit plateau
        makeBox(90, 30, 80, 0x969696, cx + 158, 775, -28);

        // Rocky cliff bands — dark grey horizontal slabs
        makeBox(600, 18, 20, 0x555555, cx + 200, 160, -170);
        makeBox(500, 14, 16, 0x4A4A4A, cx + 190, 290, -150);
        makeBox(380, 12, 14, 0x505050, cx + 180, 430, -130);
        makeBox(260, 10, 12, 0x484848, cx + 170, 560, -110);

        // North face cliff buttress
        makeBox(80, 300, 60, 0x4D4D4D, cx + 160, 400, -200);
        makeBox(60, 200, 40, 0x525252, cx + 140, 500, -210);

        // Snow cap on summit
        makeBox(95, 20, 85, 0xFFFFFF, cx + 158, 800, -28);
        makeBox(70, 14, 65, 0xF5F5FF, cx + 157, 822, -27);
        makeBox(45, 10, 42, 0xFFFFFF, cx + 156, 840, -26);
        // Snow patches on upper faces
        makeBox(50, 12, 30, 0xEEEEFF, cx + 175, 700, -60);
        makeBox(40, 10, 25, 0xF0F0FF, cx + 145, 680, 10);
        makeBox(35, 8, 20, 0xFFFFFF, cx + 165, 650, -90);

        // Summit cairn / trig point
        makeCone(4, 10, 6, 0xAAAAAA, cx + 158, 855, -28);

        // Observatory ruins on summit plateau
        makeBox(18, 12, 16, 0x7A7A7A, cx + 170, 790, -20);
        makeBox(14, 8, 12, 0x888888, cx + 152, 788, -38);

        // ----------------------------------------------------------------
        // MOUNTAIN PATH — winding rocky trail
        // ----------------------------------------------------------------
        makeBox(8, 4, 80, 0xAA9988, cx + 60, 2, 20);
        makeBox(8, 4, 60, 0xAA9988, cx + 70, 30, -30);
        makeBox(8, 4, 70, 0xAA9988, cx + 90, 70, -80);
        makeBox(8, 4, 60, 0xAA9988, cx + 110, 120, -120);
        makeBox(8, 4, 50, 0xAA9988, cx + 130, 175, -140);
        makeBox(8, 4, 40, 0xAA9988, cx + 145, 230, -120);
        makeBox(8, 4, 35, 0xAA9988, cx + 150, 280, -90);
        makeBox(8, 4, 30, 0xAA9988, cx + 155, 330, -70);

        // ----------------------------------------------------------------
        // CIC HUT — climbers' refuge at mountain base
        // ----------------------------------------------------------------
        makeBox(22, 12, 14, 0xC0C0C0, cx + 130, 6, -180);
        // Corrugated metal roof — flattened box
        makeBox(26, 5, 18, 0xA8A8A8, cx + 130, 14, -180);
        // Door
        makeBox(3, 6, 1, 0x6B4E2A, cx + 119, 3, -180);
        // Windows
        makeBox(1, 3, 3, 0x88AACC, cx + 119, 8, -175);
        makeBox(1, 3, 3, 0x88AACC, cx + 119, 8, -185);

        // ----------------------------------------------------------------
        // FORT WILLIAM TOWN — High Street buildings
        // ----------------------------------------------------------------
        // Ground base / road
        makeBox(400, 3, 80, 0x888880, cx - 160, 1, 80);

        // High Street shops — alternating colours
        makeBox(30, 20, 20, 0xCD5C5C, cx - 60, 10, 70);
        makeBox(30, 24, 20, 0xF5F0E8, cx - 30, 12, 70);
        makeBox(30, 18, 20, 0xCC6655, cx, 9, 70);
        makeBox(30, 26, 20, 0xF5F0E8, cx + 30, 13, 70);
        makeBox(30, 20, 20, 0xCD5C5C, cx + 60, 10, 70);
        makeBox(30, 22, 20, 0xE8DDD0, cx + 90, 11, 70);
        makeBox(30, 18, 20, 0xCC6655, cx + 120, 9, 70);
        makeBox(30, 24, 20, 0xF5F0E8, cx + 150, 12, 70);
        makeBox(30, 20, 20, 0xCD5C5C, cx - 90, 10, 70);
        makeBox(30, 16, 20, 0xE0D8C8, cx - 120, 8, 70);
        makeBox(30, 22, 20, 0xCC6655, cx - 150, 11, 70);
        makeBox(30, 18, 20, 0xF5F0E8, cx - 180, 9, 70);

        // Hotels / larger buildings set back
        makeBox(50, 30, 25, 0xDDCCBB, cx - 50, 15, 100);
        makeBox(45, 28, 25, 0xCCBBAA, cx + 80, 14, 100);
        // Roof details
        makeCone(20, 12, 4, 0x886655, cx - 50, 36, 100);
        makeCone(18, 10, 4, 0x886655, cx + 80, 34, 100);

        // Ben Nevis Inn / pub
        makeBox(35, 18, 22, 0xB8860B, cx - 200, 9, 75);
        makeBox(37, 6, 24, 0x8B6914, cx - 200, 21, 75);

        // ----------------------------------------------------------------
        // NEVIS RANGE SKI AREA — gondola station and chair lift pylons
        // ----------------------------------------------------------------
        // Gondola base station — large building
        makeBox(60, 20, 40, 0xD3D3D3, cx + 80, 10, -30);
        makeBox(64, 6, 44, 0xBBBBBB, cx + 80, 23, -30);
        // Station sign box
        makeBox(20, 6, 2, 0x2255AA, cx + 80, 28, -8);

        // Chair lift pylons — CylinderGeometry steel towers
        makeCylinder(1.5, 1.5, 40, 8, 0x777777, cx + 100, 20, -60);
        makeCylinder(1.5, 1.5, 50, 8, 0x777777, cx + 115, 45, -85);
        makeCylinder(1.5, 1.5, 60, 8, 0x777777, cx + 130, 75, -105);
        makeCylinder(1.5, 1.5, 65, 8, 0x777777, cx + 142, 110, -125);
        makeCylinder(1.5, 1.5, 70, 8, 0x777777, cx + 152, 150, -140);
        // Pylon crossarms
        makeBox(14, 3, 3, 0x666666, cx + 100, 41, -60);
        makeBox(14, 3, 3, 0x666666, cx + 115, 71, -85);
        makeBox(14, 3, 3, 0x666666, cx + 130, 106, -105);
        makeBox(14, 3, 3, 0x666666, cx + 142, 143, -125);

        // Gondola cable line segments (represented as thin boxes)
        makeBox(3, 3, 28, 0x555555, cx + 107, 32, -72);
        makeBox(3, 3, 24, 0x555555, cx + 122, 58, -95);
        makeBox(3, 3, 22, 0x555555, cx + 136, 92, -115);

        // Top gondola station
        makeBox(40, 18, 30, 0xC8C8C8, cx + 158, 188, -155);

        // ----------------------------------------------------------------
        // LOCH LINNHE — sea loch
        // ----------------------------------------------------------------
        makeBox(800, 4, 200, 0x006994, cx - 300, -2, -120);
        // Water shimmer patches
        makeBox(200, 2, 60, 0x0077AA, cx - 200, 0, -150);
        makeBox(150, 2, 50, 0x005577, cx - 400, 0, -100);

        // Ferry terminal
        makeBox(40, 8, 20, 0xDDDDCC, cx - 180, 4, -65);
        makeBox(44, 3, 24, 0xCCCCBB, cx - 180, 9, -65);
        // Pier / jetty
        makeBox(6, 4, 90, 0x887766, cx - 180, 2, -110);
        // Bollards on pier
        makeCylinder(1, 1, 4, 6, 0x555544, cx - 180, 4, -75);
        makeCylinder(1, 1, 4, 6, 0x555544, cx - 180, 4, -100);
        // Ferry boat hull
        makeBox(30, 8, 12, 0xCCCCCC, cx - 200, 4, -140);
        makeBox(20, 6, 10, 0xDDDDDD, cx - 200, 13, -140);
        makeCylinder(2, 2, 14, 6, 0x444444, cx - 195, 20, -140);

        // ----------------------------------------------------------------
        // NEPTUNE'S STAIRCASE — Caledonian Canal locks
        // ----------------------------------------------------------------
        // Stone lock walls — 8 lock chambers
        makeBox(12, 8, 180, 0x888888, cx - 260, 4, 20);
        makeBox(12, 8, 180, 0x888888, cx - 240, 4, 20);
        // Lock gate pairs
        makeBox(24, 10, 3, 0x6A5F4B, cx - 250, 5, -70);
        makeBox(24, 10, 3, 0x6A5F4B, cx - 250, 5, -50);
        makeBox(24, 10, 3, 0x6A5F4B, cx - 250, 5, -30);
        makeBox(24, 10, 3, 0x6A5F4B, cx - 250, 5, -10);
        makeBox(24, 10, 3, 0x6A5F4B, cx - 250, 5, 10);
        makeBox(24, 10, 3, 0x6A5F4B, cx - 250, 5, 30);
        makeBox(24, 10, 3, 0x6A5F4B, cx - 250, 5, 50);
        makeBox(24, 10, 3, 0x6A5F4B, cx - 250, 5, 70);
        // Canal water channel
        makeBox(16, 3, 180, 0x2A6A8A, cx - 250, 1, 20);
        // Lock keeper's cottage
        makeBox(16, 12, 14, 0xF5F0E8, cx - 280, 6, 10);
        makeCone(10, 8, 4, 0x885544, cx - 280, 18, 10);

        // ----------------------------------------------------------------
        // OLD FORT RUINS — on promontory
        // ----------------------------------------------------------------
        makeBox(50, 10, 40, 0x7A7060, cx - 220, 5, 55);
        // Ruined walls
        makeBox(6, 18, 40, 0x7A7060, cx - 245, 9, 55);
        makeBox(6, 14, 40, 0x6E6454, cx - 195, 7, 55);
        makeBox(50, 6, 6, 0x7A7060, cx - 220, 8, 35);
        makeBox(50, 10, 6, 0x7A7060, cx - 220, 5, 75);
        // Corner tower stub
        makeCylinder(5, 5, 22, 8, 0x7A7060, cx - 245, 11, 35);
        makeCylinder(5, 5, 16, 8, 0x6E6454, cx - 195, 8, 75);

        // ----------------------------------------------------------------
        // BEN NEVIS DISTILLERY
        // ----------------------------------------------------------------
        // Main distillery building
        makeBox(50, 22, 30, 0xCD5C5C, cx - 20, 11, 135);
        makeBox(54, 5, 34, 0xBB4444, cx - 20, 24, 135);
        // Warehouses
        makeBox(60, 16, 25, 0xAA4444, cx - 90, 8, 140);
        makeBox(55, 14, 22, 0xBB4444, cx + 50, 7, 140);
        // Copper pot stills — CylinderGeometry
        makeCylinder(4, 4, 18, 10, 0xB87333, cx - 10, 9, 130);
        makeCylinder(4, 4, 18, 10, 0xB87333, cx + 5, 9, 130);
        makeCylinder(3, 3, 14, 10, 0xCC8844, cx, 18, 130);
        makeCylinder(3, 3, 14, 10, 0xCC8844, cx + 14, 18, 130);
        // Chimney stack
        makeCylinder(3, 3.5, 28, 8, 0x884444, cx - 30, 14, 130);
        // Distillery sign box
        makeBox(18, 5, 2, 0x4422AA, cx - 20, 26, 120);

        // ----------------------------------------------------------------
        // COW HILL — smaller green hill to west
        // ----------------------------------------------------------------
        makeBox(260, 50, 200, 0x4A7C3F, cx - 320, 25, 50);
        makeBox(180, 80, 140, 0x3D6B34, cx - 320, 75, 40);
        makeBox(120, 60, 90, 0x4A7C3F, cx - 320, 130, 30);
        makeBox(70, 40, 55, 0x3D6B34, cx - 320, 175, 25);
        // Transmitter mast on Cow Hill
        makeCylinder(0.8, 0.8, 60, 6, 0xCCCCCC, cx - 320, 226, 25);
        makeCylinder(0.4, 0.4, 20, 4, 0xCC3333, cx - 320, 286, 25);
        // Mast crossarms
        makeBox(20, 2, 2, 0xBBBBBB, cx - 320, 260, 25);
        makeBox(14, 2, 2, 0xBBBBBB, cx - 320, 275, 25);
        makeBox(8, 2, 2, 0xBBBBBB, cx - 320, 285, 25);

        // ----------------------------------------------------------------
        // ADDITIONAL FORT WILLIAM DETAIL
        // ----------------------------------------------------------------
        // Train station
        makeBox(55, 14, 22, 0xE8E0D0, cx - 240, 7, 140);
        makeBox(59, 4, 26, 0xD0C8B8, cx - 240, 16, 140);
        // Platform
        makeBox(80, 2, 10, 0xCCCCBB, cx - 240, 1, 128);
        // Signal box
        makeBox(10, 12, 10, 0xDDD0A0, cx - 280, 6, 130);

        // Glen Nevis visitor centre
        makeBox(35, 14, 28, 0xE8DDD0, cx + 30, 7, 145);
        makeBox(38, 4, 32, 0xD0C8B8, cx + 30, 16, 145);

        // Road bridge over River Nevis
        makeBox(120, 5, 14, 0xAAAAAA, cx - 80, 3, 30);
        makeCylinder(3, 3, 16, 8, 0x999999, cx - 110, 8, 30);
        makeCylinder(3, 3, 16, 8, 0x999999, cx - 50, 8, 30);

        // Supermarket / large retail
        makeBox(70, 14, 45, 0xDDDDDD, cx - 170, 7, 130);
        makeBox(74, 4, 49, 0xCCCCCC, cx - 170, 16, 130);

        // Petrol station canopy
        makeBox(35, 8, 20, 0xEEEEEE, cx + 160, 4, 100);
        makeBox(4, 8, 2, 0x888888, cx + 148, 4, 100);
        makeBox(4, 8, 2, 0x888888, cx + 172, 4, 100);

        // River Nevis — narrow water body
        makeBox(400, 2, 12, 0x4488AA, cx, 1, 20);

        // Scattered boulders on mountain slope
        makeBox(8, 6, 7, 0x6A6A6A, cx + 80, 3, -50);
        makeBox(6, 5, 6, 0x727272, cx + 100, 3, -70);
        makeBox(10, 7, 9, 0x646464, cx + 60, 3, -30);
        makeBox(7, 5, 8, 0x6E6E6E, cx + 120, 5, -100);
        makeBox(9, 6, 7, 0x686868, cx + 50, 3, -20);
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
