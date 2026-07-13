window.ScarboroughCastle = (function() {
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildHeadland() {
        var ox = 15440;
        // Main headland cliff mass — dramatic promontory jutting into sea
        makeBox(180, 60, 220, 0x8B7355, ox + 0, 30, -20);
        // North cliff face
        makeBox(180, 50, 20, 0x7A6545, ox + 0, 25, -130);
        // South cliff face
        makeBox(180, 50, 20, 0x7A6545, ox + 0, 25, 110);
        // East cliff tip
        makeBox(40, 45, 140, 0x7A6545, ox + 90, 22, -20);

        // Castle outer curtain wall — 12th century
        makeBox(120, 12, 4, 0x9E8B72, ox - 10, 63, -60);
        makeBox(120, 12, 4, 0x9E8B72, ox - 10, 63, 60);
        makeBox(4, 12, 124, 0x9E8B72, ox - 70, 63, 0);
        makeBox(4, 12, 124, 0x9E8B72, ox + 50, 63, 0);

        // Wall battlements — merlons
        var bi;
        for (bi = 0; bi < 10; bi++) {
            makeBox(6, 4, 4, 0x9E8B72, ox - 65 + bi * 12, 71, -60);
            makeBox(6, 4, 4, 0x9E8B72, ox - 65 + bi * 12, 71, 60);
        }
        for (bi = 0; bi < 8; bi++) {
            makeBox(4, 4, 6, 0x9E8B72, ox - 70, 71, -42 + bi * 12);
            makeBox(4, 4, 6, 0x9E8B72, ox + 50, 71, -42 + bi * 12);
        }

        // 12th-century keep — half ruined, taller on one side
        makeBox(32, 40, 28, 0x8B7A62, ox + 10, 80, 0);
        // Ruined half — lower broken section
        makeBox(14, 22, 28, 0x7A6B55, ox - 9, 72, 0);
        // Keep battlements on intact portion
        makeBox(6, 5, 4, 0x8B7A62, ox + 16, 102, -10);
        makeBox(6, 5, 4, 0x8B7A62, ox + 16, 102, 0);
        makeBox(6, 5, 4, 0x8B7A62, ox + 16, 102, 10);
        makeBox(6, 5, 5, 0x8B7A62, ox + 10, 102, 13);
        makeBox(6, 5, 5, 0x8B7A62, ox + 10, 102, -13);

        // Corner towers of curtain wall
        makeCylinder(6, 7, 16, 8, 0x9E8B72, ox - 70, 68, -60);
        makeCylinder(6, 7, 16, 8, 0x9E8B72, ox + 50, 68, -60);
        makeCylinder(6, 7, 16, 8, 0x9E8B72, ox - 70, 68, 60);
        makeCylinder(6, 7, 16, 8, 0x9E8B72, ox + 50, 68, 60);

        // Barbican — outer gatehouse passage on south/land side
        makeBox(30, 14, 18, 0x9E8B72, ox - 20, 64, 62);
        makeBox(10, 18, 8, 0x8B7A62, ox - 20, 66, 70);
        // Barbican gate arch (box approximation)
        makeBox(10, 8, 3, 0x6B5A42, ox - 20, 60, 72);

        // Gatehouse flanking towers
        makeCylinder(5, 6, 20, 8, 0x9E8B72, ox - 30, 67, 70);
        makeCylinder(5, 6, 20, 8, 0x9E8B72, ox - 10, 67, 70);

        // Roman signal station remains — northeast corner
        makeBox(14, 4, 14, 0xA09078, ox + 40, 62, -50);
        makeBox(10, 6, 3, 0xA09078, ox + 40, 64, -57);
        makeBox(3, 6, 10, 0xA09078, ox + 47, 64, -50);

        // Collapsed wall sections — rubble piles
        makeBox(18, 3, 8, 0x7A6A52, ox - 30, 61, -30);
        makeBox(12, 2, 10, 0x7A6A52, ox + 30, 61, 40);
        makeBox(10, 2, 6, 0x7A6A52, ox + 20, 61, -55);
    }

    function buildNorthBay() {
        var ox = 15440;
        // North Bay sandy beach — wide expanse north of headland
        makeBox(300, 2, 200, 0xF4D08A, ox - 100, 1, -260);
        // Shallow sea edge
        makeBox(300, 1, 40, 0x7ABFDD, ox - 100, 0, -360);
        // Sea body
        makeBox(500, 2, 300, 0x4A8DB5, ox - 200, -1, -500);

        // North promenade path
        makeBox(300, 2, 12, 0xC8C0A8, ox - 100, 2, -185);

        // Peasholm Park — lake visible as flat blue expanse
        makeBox(80, 1, 60, 0x6AAED6, ox - 200, 3, -200);
        // Park greenery
        makeBox(120, 2, 80, 0x5A9A45, ox - 200, 2, -200);
        // Park trees — cones
        makeCone(5, 14, 8, 0x3A7A30, ox - 180, 10, -190);
        makeCone(5, 14, 8, 0x3A7A30, ox - 190, 10, -205);
        makeCone(6, 16, 8, 0x3A7A30, ox - 175, 11, -215);
        makeCone(5, 14, 8, 0x3A7A30, ox - 210, 10, -195);
        makeCone(5, 14, 8, 0x447A35, ox - 220, 10, -210);
        makeCone(6, 15, 8, 0x3A7A30, ox - 200, 10, -225);
        makeCone(5, 13, 8, 0x447A35, ox - 165, 10, -200);

        // North Bay Railway — miniature railway track along beach
        // Track base
        makeBox(200, 1, 4, 0x8B8070, ox - 120, 3, -195);
        // Railway sleepers suggestion
        var rsi;
        for (rsi = 0; rsi < 10; rsi++) {
            makeBox(4, 1, 6, 0x6B5A40, ox - 195 + rsi * 20, 3, -195);
        }
        // Station building — small
        makeBox(16, 8, 10, 0xCC9966, ox - 60, 7, -198);
        makeBox(18, 2, 12, 0x994422, ox - 60, 12, -198);
        // A miniature locomotive suggestion
        makeBox(10, 5, 5, 0x222222, ox - 120, 6, -195);
        makeCylinder(2, 2, 8, 8, 0x333333, ox - 118, 9, -195);
        makeSphere(2.5, 8, 6, 0xCC2200, ox - 115, 10, -195);

        // Sea Life Centre — aquarium building
        makeBox(40, 14, 30, 0x6699BB, ox - 60, 10, -230);
        makeBox(42, 3, 32, 0x5588AA, ox - 60, 18, -230);
        // Blue dome on top
        makeSphere(8, 12, 8, 0x4477AA, ox - 60, 24, -230);
        // Windows — small boxes
        makeBox(4, 4, 1, 0xAADDFF, ox - 70, 8, -215);
        makeBox(4, 4, 1, 0xAADDFF, ox - 60, 8, -215);
        makeBox(4, 4, 1, 0xAADDFF, ox - 50, 8, -215);
        makeBox(4, 4, 1, 0xAADDFF, ox - 70, 13, -215);
        makeBox(4, 4, 1, 0xAADDFF, ox - 60, 13, -215);
        makeBox(4, 4, 1, 0xAADDFF, ox - 50, 13, -215);

        // Beach huts — colourful small boxes along north beach
        var bhi;
        var bhColors = [0xEE4444, 0x44BB44, 0x4444EE, 0xEEBB00, 0xEE44BB, 0x44EEBB];
        for (bhi = 0; bhi < 6; bhi++) {
            makeBox(6, 7, 6, bhColors[bhi], ox - 160 + bhi * 10, 5, -180);
            makeCone(4, 4, 4, 0xAA3322, ox - 160 + bhi * 10, 11, -180);
        }
    }

    function buildSouthBay() {
        var ox = 15440;
        // South Bay sandy beach
        makeBox(320, 2, 180, 0xF4D08A, ox + 20, 1, 200);
        // Sea edge
        makeBox(320, 1, 40, 0x7ABFDD, ox + 20, 0, 370);
        // Sea body
        makeBox(500, 2, 250, 0x4A8DB5, ox + 50, -1, 500);

        // South promenade — long seafront walkway
        makeBox(320, 3, 14, 0xC8C0A8, ox + 20, 2, 170);
        // Promenade railings suggestion
        makeBox(320, 3, 1, 0xAAAAAA, ox + 20, 4, 162);

        // Amusements arcade buildings along front
        makeBox(30, 10, 20, 0xFF6633, ox - 60, 8, 160);
        makeBox(3, 12, 3, 0xFFAA00, ox - 60, 13, 160);
        makeBox(26, 10, 18, 0xEE5522, ox - 20, 8, 160);
        makeBox(22, 10, 18, 0xFF7744, ox + 20, 8, 160);
        makeBox(28, 10, 18, 0xEE4411, ox + 60, 8, 160);
        // Flashing signs — bright boxes
        makeBox(8, 3, 1, 0xFFFF00, ox - 60, 15, 151);
        makeBox(6, 3, 1, 0xFF00FF, ox - 20, 15, 151);
        makeBox(7, 3, 1, 0x00FFFF, ox + 20, 15, 151);

        // Funfair rides suggestion — cylindrical structures
        makeCylinder(8, 8, 20, 12, 0xFF2222, ox + 100, 13, 165);
        makeCylinder(1, 1, 22, 6, 0xFFFF00, ox + 100, 14, 165);
        makeCylinder(6, 6, 18, 12, 0x2222FF, ox + 120, 12, 168);

        // Scarborough Spa — Victorian concert hall/theatre
        // Main hall building
        makeBox(70, 20, 40, 0xDDCCAA, ox - 100, 13, 270);
        // Grand central dome
        makeCylinder(12, 12, 8, 16, 0xCCBB99, ox - 100, 27, 270);
        makeSphere(12, 16, 10, 0xAA9977, ox - 100, 35, 270);
        // Side wings
        makeBox(20, 14, 30, 0xDDCCAA, ox - 140, 10, 270);
        makeBox(20, 14, 30, 0xDDCCAA, ox - 60, 10, 270);
        // Ornate facade columns
        makeCylinder(1, 1, 18, 6, 0xEEDDBB, ox - 118, 12, 251);
        makeCylinder(1, 1, 18, 6, 0xEEDDBB, ox - 110, 12, 251);
        makeCylinder(1, 1, 18, 6, 0xEEDDBB, ox - 102, 12, 251);
        makeCylinder(1, 1, 18, 6, 0xEEDDBB, ox - 94, 12, 251);
        makeCylinder(1, 1, 18, 6, 0xEEDDBB, ox - 86, 12, 251);
        // Spa pediment
        makeBox(72, 4, 4, 0xCCBBAA, ox - 100, 22, 251);
        // Terrace/gardens in front of spa
        makeBox(70, 1, 20, 0x7AB055, ox - 100, 4, 245);
        makeCone(3, 8, 8, 0x3A7A30, ox - 120, 8, 242);
        makeCone(3, 8, 8, 0x3A7A30, ox - 80, 8, 242);
        // Spa bandstand
        makeCylinder(8, 8, 1, 12, 0xCCBBAA, ox - 100, 5, 235);
        makeBox(1, 6, 1, 0x887766, ox - 100, 8, 235);
        makeCone(9, 5, 12, 0x884422, ox - 100, 13, 235);

        // Beach huts south bay
        var si;
        var southColors = [0xDD3333, 0x33AA33, 0x3333DD, 0xDD9900, 0xAA33AA];
        for (si = 0; si < 5; si++) {
            makeBox(6, 7, 6, southColors[si], ox + 60 + si * 10, 5, 175);
            makeCone(4, 4, 4, 0x993322, ox + 60 + si * 10, 11, 175);
        }
    }

    function buildGrandHotel() {
        var ox = 15440;
        // Grand Hotel — one of the largest Victorian hotels in Europe
        // Main building block — enormous, 12 floors
        makeBox(80, 60, 50, 0xB87044, ox + 80, 33, 90);
        // North wing
        makeBox(20, 55, 50, 0xC07848, ox + 30, 30, 90);
        // South wing
        makeBox(20, 55, 50, 0xC07848, ox + 130, 30, 90);
        // Rear section
        makeBox(80, 50, 20, 0xB87044, ox + 80, 28, 115);

        // Four corner towers with Italianate domes — representing four seasons
        makeCylinder(7, 8, 62, 12, 0xAA6638, ox + 30, 34, 65);
        makeSphere(7, 12, 8, 0x887050, ox + 30, 66, 65);
        makeCylinder(7, 8, 62, 12, 0xAA6638, ox + 130, 34, 65);
        makeSphere(7, 12, 8, 0x887050, ox + 130, 66, 65);
        makeCylinder(7, 8, 62, 12, 0xAA6638, ox + 30, 34, 115);
        makeSphere(7, 12, 8, 0x887050, ox + 30, 66, 115);
        makeCylinder(7, 8, 62, 12, 0xAA6638, ox + 130, 34, 115);
        makeSphere(7, 12, 8, 0x887050, ox + 130, 66, 115);

        // Central tower/lantern
        makeCylinder(5, 6, 15, 12, 0xAA6638, ox + 80, 68, 90);
        makeSphere(5, 12, 8, 0x887050, ox + 80, 77, 90);

        // Window rows — repeating pattern
        var fi, fj;
        for (fi = 0; fi < 6; fi++) {
            for (fj = 0; fj < 7; fj++) {
                makeBox(5, 6, 1, 0xDDCCBB, ox + 40 + fj * 10, 8 + fi * 8, 65);
            }
        }
        // Ground floor entrance
        makeBox(16, 10, 4, 0xCCBBAA, ox + 80, 8, 65);
        makeBox(14, 2, 6, 0xAA9988, ox + 80, 14, 63);
        // Entrance portico columns
        makeCylinder(1, 1, 10, 6, 0xDDCCBB, ox + 72, 8, 63);
        makeCylinder(1, 1, 10, 6, 0xDDCCBB, ox + 80, 8, 63);
        makeCylinder(1, 1, 10, 6, 0xDDCCBB, ox + 88, 8, 63);

        // Ornate cornice / parapet
        makeBox(82, 3, 52, 0x9A5C30, ox + 80, 62, 90);

        // Hotel grounds / forecourt
        makeBox(80, 1, 20, 0xC8C0A8, ox + 80, 4, 72);
    }

    function buildStMarysChurch() {
        var ox = 15440;
        // St Mary's Church — medieval, Anne Brontë buried here
        // Main nave
        makeBox(30, 16, 14, 0x9E9280, ox - 80, 11, 80);
        // Chancel
        makeBox(14, 14, 12, 0x9E9280, ox - 55, 10, 80);
        // Tower — square medieval tower
        makeBox(10, 26, 10, 0x9E9280, ox - 96, 16, 80);
        // Tower battlements
        makeBox(10, 3, 3, 0x9E9280, ox - 96, 30, 75);
        makeBox(10, 3, 3, 0x9E9280, ox - 96, 30, 85);
        makeBox(3, 3, 10, 0x9E9280, ox - 91, 30, 80);
        makeBox(3, 3, 10, 0x9E9280, ox - 101, 30, 80);
        // Nave roof — pitched
        makeBox(30, 4, 1, 0x776655, ox - 80, 20, 73);
        makeBox(30, 4, 1, 0x776655, ox - 80, 20, 87);
        // Ridge
        makeBox(30, 1, 14, 0x665544, ox - 80, 23, 80);
        // Porch
        makeBox(8, 8, 6, 0x9E9280, ox - 80, 7, 73);
        makeCone(5, 6, 4, 0x665544, ox - 80, 14, 73);

        // Churchyard — grassed area with grave markers
        makeBox(80, 1, 60, 0x6A8A55, ox - 75, 4, 88);
        // Grave markers — rows of small upright boxes
        var gi, gj;
        for (gi = 0; gi < 5; gi++) {
            for (gj = 0; gj < 4; gj++) {
                makeBox(2, 4, 1, 0xBBBBBB, ox - 60 + gi * 8, 6, 92 + gj * 8);
            }
        }
        // Anne Bronte grave — slightly larger, distinctive
        makeBox(3, 5, 1, 0xCCCCCC, ox - 60, 6, 96);
        makeBox(5, 1, 3, 0xBBBBBB, ox - 60, 8, 96);
        // Yew trees in churchyard — dark cones
        makeCone(4, 12, 8, 0x1A4A1A, ox - 50, 10, 95);
        makeCone(4, 12, 8, 0x1A4A1A, ox - 90, 10, 100);
        makeCone(3, 10, 8, 0x1A4A1A, ox - 70, 9, 108);
        // Churchyard wall
        makeBox(80, 4, 2, 0x8A7A68, ox - 75, 5, 88);
        makeBox(80, 4, 2, 0x8A7A68, ox - 75, 5, 122);
        makeBox(2, 4, 34, 0x8A7A68, ox - 35, 5, 105);
        makeBox(2, 4, 34, 0x8A7A68, ox - 115, 5, 105);
    }

    function buildHarbour() {
        var ox = 15440;
        // Harbour basin — sheltered water
        makeBox(160, 2, 120, 0x3A7A99, ox + 160, 1, 120);
        // Harbour floor / quay surrounds
        makeBox(200, 3, 20, 0x888070, ox + 160, 3, 65);
        makeBox(20, 3, 120, 0x888070, ox + 70, 3, 120);
        makeBox(20, 3, 120, 0x888070, ox + 250, 3, 120);

        // North pier / breakwater
        makeBox(4, 5, 140, 0x777060, ox + 72, 5, 110);
        // South pier
        makeBox(4, 5, 120, 0x777060, ox + 248, 5, 110);
        // Pier heads
        makeBox(8, 6, 8, 0x777060, ox + 72, 6, 45);
        makeBox(8, 6, 8, 0x777060, ox + 248, 6, 45);

        // Lighthouse on pier head
        makeCylinder(3, 4, 18, 8, 0xEEEEDD, ox + 72, 15, 45);
        makeCylinder(4, 4, 2, 8, 0xCCCC88, ox + 72, 25, 45);
        makeSphere(3, 8, 6, 0xFFFF88, ox + 72, 28, 45);
        makeCone(3, 5, 8, 0xCC3322, ox + 72, 32, 45);

        // Fish quay buildings
        makeBox(28, 10, 14, 0xBBAA88, ox + 90, 8, 68);
        makeBox(22, 8, 14, 0xAABB99, ox + 125, 7, 68);
        makeBox(18, 9, 14, 0xBBAA88, ox + 155, 8, 68);
        // Fish processing shed
        makeBox(30, 12, 20, 0x99AAAA, ox + 200, 9, 68);
        makeBox(30, 3, 22, 0x778888, ox + 200, 16, 68);

        // Lifeboat station — RNLI
        makeBox(20, 12, 24, 0xEEEEEE, ox + 240, 9, 75);
        makeBox(22, 3, 26, 0xFF6600, ox + 240, 16, 75);
        // RNLI orange stripe
        makeBox(22, 3, 1, 0xFF6600, ox + 240, 8, 64);
        // Lifeboat doors — large opening
        makeBox(1, 8, 16, 0xCCCCCC, ox + 229, 7, 75);
        makeBox(1, 8, 16, 0xCCCCCC, ox + 251, 7, 75);
        // Lifeboat on slipway
        makeBox(14, 4, 5, 0xFF6600, ox + 240, 5, 75);
        makeCone(2, 5, 6, 0xDD5500, ox + 233, 6, 75);

        // Fishing boats moored in harbour
        makeBox(16, 4, 6, 0x4455AA, ox + 130, 4, 95);
        makeCone(2, 8, 6, 0x3344AA, ox + 123, 7, 95);
        makeCylinder(1, 1, 14, 6, 0x888888, ox + 130, 11, 95);

        makeBox(14, 3, 5, 0xAA4422, ox + 155, 4, 105);
        makeCone(2, 6, 6, 0x993311, ox + 148, 6, 105);
        makeCylinder(1, 1, 12, 6, 0x777777, ox + 155, 10, 105);

        makeBox(12, 3, 5, 0x338833, ox + 180, 4, 95);
        makeCone(2, 5, 6, 0x226622, ox + 174, 6, 95);
        makeCylinder(1, 1, 12, 6, 0x777777, ox + 180, 10, 95);

        // Lobster pots — small stacked boxes on quay
        makeBox(4, 3, 3, 0x886633, ox + 100, 5, 70);
        makeBox(4, 3, 3, 0x886633, ox + 106, 5, 70);
        makeBox(4, 3, 3, 0x886633, ox + 100, 8, 70);
        makeBox(4, 3, 3, 0x886633, ox + 112, 5, 70);
        makeBox(3, 3, 3, 0x886633, ox + 112, 8, 70);
        makeBox(3, 3, 3, 0x997744, ox + 120, 5, 70);
        makeBox(3, 3, 3, 0x997744, ox + 120, 8, 70);
        makeBox(3, 3, 3, 0x997744, ox + 126, 5, 70);

        // Seagulls — white spheres hovering over harbour
        makeSphere(1.2, 6, 4, 0xFFFFFF, ox + 130, 22, 80);
        makeSphere(1.0, 6, 4, 0xFFFFFF, ox + 150, 28, 70);
        makeSphere(1.2, 6, 4, 0xFFFFFF, ox + 170, 20, 90);
        makeSphere(1.0, 6, 4, 0xFFFFFF, ox + 160, 32, 100);
        makeSphere(1.2, 6, 4, 0xFFFFFF, ox + 140, 25, 110);
        makeSphere(0.9, 6, 4, 0xFFFFFF, ox + 190, 18, 85);
        makeSphere(1.1, 6, 4, 0xFFFFFF, ox + 110, 30, 95);
        makeSphere(1.0, 6, 4, 0xFFFFFF, ox + 200, 24, 75);
        // Seagulls over beach
        makeSphere(1.1, 6, 4, 0xFFFFFF, ox - 30, 18, 210);
        makeSphere(1.0, 6, 4, 0xFFFFFF, ox + 50, 22, 230);
        makeSphere(1.2, 6, 4, 0xFFFFFF, ox + 10, 20, 190);
    }

    function buildGroundAndSea() {
        var ox = 15440;
        // Main ground plane / cliff top
        makeBox(400, 2, 400, 0x6A8A55, ox, 0, 0);
        // Sea to north
        makeBox(600, 2, 300, 0x3A6E99, ox - 50, -3, -450);
        // Sea to south
        makeBox(600, 2, 200, 0x3A6E99, ox + 50, -3, 500);
        // Sea to east (beyond headland)
        makeBox(200, 2, 400, 0x3A6E99, ox + 220, -3, 0);
        // Land approach to west
        makeBox(300, 2, 300, 0x7A9A65, ox - 300, 2, 0);
        // Road approach
        makeBox(16, 1, 200, 0xAAAAAA, ox - 150, 3, 80);
    }

    function build() {
        buildGroundAndSea();
        buildHeadland();
        buildNorthBay();
        buildSouthBay();
        buildGrandHotel();
        buildStMarysChurch();
        buildHarbour();
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
