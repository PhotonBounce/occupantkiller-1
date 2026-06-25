window.LisbonAlfama = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 23200;
    var CY = 0;
    var CZ = 0;

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
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildTagusRiver();
        buildAlfamaDistrict();
        buildSaoJorgeCastle();
        buildBelemTower();
        buildJeronimosMonastery();
        buildCristoRei();
        buildVascoGamaBridge();
        build25DeAbrilBridge();
        buildPracaDoComercio();
        buildBairroAlto();
        buildLisbonCathedral();
        buildRossioSquare();
        buildGeneralGround();
    }

    function buildTagusRiver() {
        // Tagus river — wide estuary represented as a flat box extending south
        makeBox(2000, 2, 800, 0x2A5A8A, 0, -1, 300);
        // River shimmer highlights
        makeBox(1800, 1, 600, 0x3A7AAA, 0, 0, 350);
        makeBox(600, 1, 200, 0x4A8ABB, -200, 0.5, 320);
        makeBox(400, 1, 150, 0x4A8ABB, 300, 0.5, 380);
    }

    function buildAlfamaDistrict() {
        // Alfama: terraced Moorish hillside — warm oranges, yellows, whites
        // Hill base ramp
        makeBox(280, 40, 180, 0xCC7722, -120, 20, -80);
        makeBox(220, 60, 140, 0xBB6611, -120, 30, -110);
        makeBox(160, 80, 110, 0xCC7722, -120, 40, -140);
        // Row of terraced houses lower tier
        makeBox(28, 22, 18, 0xEECC88, -180, 11, -60);
        makeBox(28, 26, 18, 0xFFDDAA, -148, 13, -60);
        makeBox(28, 20, 18, 0xEEBB77, -116, 10, -60);
        makeBox(28, 24, 18, 0xFFEEBB, -84, 12, -60);
        makeBox(28, 22, 18, 0xDDAA66, -52, 11, -60);
        // Rooftop terracotta tiles
        makeCone(16, 6, 4, 0xAA4422, -180, 25, -60);
        makeCone(16, 6, 4, 0xAA4422, -148, 27, -60);
        makeCone(16, 6, 4, 0xAA4422, -116, 24, -60);
        // Mid-tier houses
        makeBox(24, 20, 16, 0xFFEECC, -190, 32, -95);
        makeBox(24, 22, 16, 0xEECC99, -162, 34, -95);
        makeBox(24, 18, 16, 0xFFDDAA, -134, 31, -95);
        makeBox(24, 22, 16, 0xEEBB88, -106, 33, -95);
        // Upper-tier houses climbing hill
        makeBox(22, 18, 14, 0xFFEECC, -175, 52, -128);
        makeBox(22, 20, 14, 0xEECC99, -150, 54, -128);
        makeBox(22, 18, 14, 0xFFDDAA, -125, 51, -128);
        makeBox(22, 20, 14, 0xDDAA77, -100, 53, -128);
        // Narrow winding streets (dark ground strips)
        makeBox(280, 1, 6, 0x554433, -120, 1, -75);
        makeBox(280, 1, 6, 0x554433, -120, 1, -110);
        makeBox(6, 1, 120, 0x554433, -155, 1, -88);
        makeBox(6, 1, 120, 0x554433, -95, 1, -88);
        // Miradouro (viewpoint) platform
        makeBox(40, 5, 30, 0xDDBB88, -120, 63, -155);
        makeBox(40, 2, 4, 0xCC9966, -120, 65, -140);
    }

    function buildSaoJorgeCastle() {
        // São Jorge Castle at hilltop — fortress walls and towers
        var hx = -120;
        var hy = 80;
        var hz = -185;
        // Main curtain wall
        makeBox(120, 18, 8, 0xAA9977, hx, hy + 9, hz);
        makeBox(8, 18, 90, 0xAA9977, hx - 56, hy + 9, hz + 45);
        makeBox(8, 18, 90, 0xAA9977, hx + 56, hy + 9, hz + 45);
        makeBox(120, 18, 8, 0xBBAA88, hx, hy + 9, hz + 90);
        // Corner towers
        makeCyl(9, 9, 30, 8, 0x998866, hx - 56, hy + 15, hz);
        makeCyl(9, 9, 30, 8, 0x998866, hx + 56, hy + 15, hz);
        makeCyl(9, 9, 30, 8, 0x998866, hx - 56, hy + 15, hz + 90);
        makeCyl(9, 9, 30, 8, 0x998866, hx + 56, hy + 15, hz + 90);
        // Tower caps
        makeCone(10, 12, 8, 0x776655, hx - 56, hy + 36, hz);
        makeCone(10, 12, 8, 0x776655, hx + 56, hy + 36, hz);
        makeCone(10, 12, 8, 0x776655, hx - 56, hy + 36, hz + 90);
        makeCone(10, 12, 8, 0x776655, hx + 56, hy + 36, hz + 90);
        // Keep/donjon — main tower
        makeBox(28, 40, 28, 0x887755, hx, hy + 20, hz + 45);
        makeCone(16, 14, 4, 0x665544, hx, hy + 47, hz + 45);
        // Battlements strip
        makeBox(120, 4, 4, 0x998866, hx, hy + 20, hz - 2);
        makeBox(4, 120, 4, 0x998866, hx - 54, hy + 20, hz + 44);
        // Inner courtyard ground
        makeBox(108, 2, 86, 0xBBAA88, hx, hy + 1, hz + 45);
    }

    function buildBelemTower() {
        // Torre de Belém — standing in Tagus, Manueline style
        var bx = 160;
        var by = 0;
        var bz = 220;
        // Foundation / water platform
        makeBox(36, 4, 60, 0xC8BC7A, bx, by + 2, bz);
        // Main tower body — 4 stories
        makeBox(18, 12, 18, 0xD4C890, bx, by + 10, bz - 8);
        makeBox(18, 12, 18, 0xC8BC80, bx, by + 22, bz - 8);
        makeBox(16, 12, 16, 0xD4C890, bx, by + 34, bz - 8);
        makeBox(14, 10, 14, 0xC8BC80, bx, by + 44, bz - 8);
        // Battlements top
        makeBox(18, 4, 18, 0xB8AA70, bx, by + 52, bz - 8);
        // Corner turrets (4 small round towers)
        makeCyl(3, 3, 28, 6, 0xC0B478, bx - 10, by + 20, bz - 18);
        makeCyl(3, 3, 28, 6, 0xC0B478, bx + 10, by + 20, bz - 18);
        makeCyl(3, 3, 28, 6, 0xC0B478, bx - 10, by + 20, bz + 2);
        makeCyl(3, 3, 28, 6, 0xC0B478, bx + 10, by + 20, bz + 2);
        // Turret caps
        makeCone(4, 6, 6, 0xA09060, bx - 10, by + 35, bz - 18);
        makeCone(4, 6, 6, 0xA09060, bx + 10, by + 35, bz - 18);
        makeCone(4, 6, 6, 0xA09060, bx - 10, by + 35, bz + 2);
        makeCone(4, 6, 6, 0xA09060, bx + 10, by + 35, bz + 2);
        // Gothic loggia / terrace on north face
        makeBox(18, 8, 6, 0xD4C890, bx, by + 10, bz + 10);
        makeBox(18, 4, 6, 0xC0B478, bx, by + 6, bz + 10);
        // Manueline ornament spheres on parapet
        makeSphere(1.5, 6, 6, 0xA09060, bx - 6, by + 55, bz - 14);
        makeSphere(1.5, 6, 6, 0xA09060, bx, by + 55, bz - 14);
        makeSphere(1.5, 6, 6, 0xA09060, bx + 6, by + 55, bz - 14);
        // Watchtower top cone
        makeCone(8, 10, 8, 0x908050, bx, by + 58, bz - 8);
    }

    function buildJeronimosMonastery() {
        // Jerónimos Monastery — vast Manueline complex near Belém
        var jx = 80;
        var jy = 0;
        var jz = 140;
        // Main church nave
        makeBox(140, 28, 36, 0xF0EDE8, jx, jy + 14, jz);
        // Church facade
        makeBox(140, 38, 6, 0xE8E4DC, jx, jy + 19, jz - 21);
        // Great south portal (ornate entrance) represented as a deeper box
        makeBox(18, 28, 8, 0xD4CFC0, jx - 30, jy + 14, jz - 24);
        makeBox(18, 28, 8, 0xD4CFC0, jx + 30, jy + 14, jz - 24);
        // Bell towers flanking facade
        makeCyl(7, 7, 50, 8, 0xE0DCD0, jx - 66, jy + 25, jz - 18);
        makeCyl(7, 7, 50, 8, 0xE0DCD0, jx + 66, jy + 25, jz - 18);
        makeCone(8, 14, 8, 0xC8C4B8, jx - 66, jy + 57, jz - 18);
        makeCone(8, 14, 8, 0xC8C4B8, jx + 66, jy + 57, jz - 18);
        // Cloister wings — two-storey arcaded
        makeBox(140, 14, 30, 0xF0EDE8, jx, jy + 7, jz + 50);
        makeBox(30, 14, 80, 0xECE8E0, jx - 85, jy + 7, jz + 15);
        makeBox(30, 14, 80, 0xECE8E0, jx + 85, jy + 7, jz + 15);
        // Upper cloister storey
        makeBox(140, 8, 30, 0xE8E4DC, jx, jy + 19, jz + 50);
        makeBox(30, 8, 80, 0xE8E4DC, jx - 85, jy + 19, jz + 15);
        makeBox(30, 8, 80, 0xE8E4DC, jx + 85, jy + 19, jz + 15);
        // Cloister inner garden
        makeBox(80, 1, 50, 0x88AA66, jx, jy + 0.5, jz + 50);
        // Carved column rows (simplified as thin cylinders)
        makeCyl(1.2, 1.2, 10, 6, 0xD8D4C8, jx - 60, jy + 5, jz + 36);
        makeCyl(1.2, 1.2, 10, 6, 0xD8D4C8, jx - 40, jy + 5, jz + 36);
        makeCyl(1.2, 1.2, 10, 6, 0xD8D4C8, jx - 20, jy + 5, jz + 36);
        makeCyl(1.2, 1.2, 10, 6, 0xD8D4C8, jx, jy + 5, jz + 36);
        makeCyl(1.2, 1.2, 10, 6, 0xD8D4C8, jx + 20, jy + 5, jz + 36);
        makeCyl(1.2, 1.2, 10, 6, 0xD8D4C8, jx + 40, jy + 5, jz + 36);
        makeCyl(1.2, 1.2, 10, 6, 0xD8D4C8, jx + 60, jy + 5, jz + 36);
        // Chapter house dome
        makeSphere(14, 8, 8, 0xD8D4C4, jx + 85, jy + 22, jz - 10);
        // Refectory building
        makeBox(50, 18, 28, 0xE4E0D8, jx - 95, jy + 9, jz - 10);
    }

    function buildCristoRei() {
        // Cristo Rei — Christ the King statue on south bank across Tagus
        var cx = 40;
        var cy = 0;
        var cz = 520;
        // Hilltop base
        makeBox(60, 30, 60, 0xBBBBAA, cx, cy + 15, cz);
        // Concrete pedestal
        makeBox(20, 60, 20, 0xDDDDCC, cx, cy + 60, cz);
        // Upper plinth
        makeBox(24, 12, 24, 0xCCCCBB, cx, cy + 96, cz);
        // Christ figure torso
        makeBox(8, 20, 8, 0xEEEEEE, cx, cy + 116, cz);
        // Head sphere
        makeSphere(4, 8, 8, 0xEEEEEE, cx, cy + 129, cz);
        // Arms spread wide
        makeBox(50, 5, 5, 0xEEEEEE, cx, cy + 122, cz);
    }

    function buildVascoGamaBridge() {
        // Vasco da Gama Bridge — long low cable-stayed bridge crossing Tagus
        var vx = 400;
        var vy = 6;
        var vz = 300;
        // Bridge deck
        makeBox(800, 4, 18, 0xBBB8A8, vx, vy, vz);
        // Central pylons — tall cable-stayed towers
        makeBox(6, 70, 6, 0xCCCCCC, vx - 100, vy + 35, vz);
        makeBox(6, 70, 6, 0xCCCCCC, vx + 100, vy + 35, vz);
        // Pylon crossbeam
        makeBox(20, 5, 6, 0xCCCCCC, vx - 100, vy + 68, vz);
        makeBox(20, 5, 6, 0xCCCCCC, vx + 100, vy + 68, vz);
        // Approach spans
        makeBox(400, 3, 14, 0xB0ADA0, vx - 500, vy - 1, vz);
        makeBox(400, 3, 14, 0xB0ADA0, vx + 500, vy - 1, vz);
        // Road surface line markings
        makeBox(800, 1, 1, 0xFFFFEE, vx, vy + 2.5, vz);
        // Support pillars under deck
        makeCyl(3, 3, 8, 6, 0xAAAAAA, vx - 200, vy - 4, vz);
        makeCyl(3, 3, 8, 6, 0xAAAAAA, vx, vy - 4, vz);
        makeCyl(3, 3, 8, 6, 0xAAAAAA, vx + 200, vy - 4, vz);
    }

    function build25DeAbrilBridge() {
        // 25 de Abril Bridge — red suspension bridge resembling Golden Gate
        var ax = -200;
        var ay = 12;
        var az = 380;
        // Bridge deck
        makeBox(500, 5, 20, 0xCC3322, ax, ay, az);
        // Main suspension towers
        makeBox(10, 120, 10, 0xBB2211, ax - 150, ay + 60, az);
        makeBox(10, 120, 10, 0xBB2211, ax + 150, ay + 60, az);
        // Tower crossbeams
        makeBox(20, 8, 10, 0xCC3322, ax - 150, ay + 90, az);
        makeBox(20, 8, 10, 0xCC3322, ax + 150, ay + 90, az);
        makeBox(20, 8, 10, 0xCC3322, ax - 150, ay + 110, az);
        makeBox(20, 8, 10, 0xCC3322, ax + 150, ay + 110, az);
        // Main cables (approximated as thin boxes angled)
        makeBox(320, 3, 3, 0xAA2211, ax, ay + 60, az - 8);
        makeBox(320, 3, 3, 0xAA2211, ax, ay + 60, az + 8);
        // Road deck railing strips
        makeBox(500, 2, 1, 0x884433, ax, ay + 3, az - 9);
        makeBox(500, 2, 1, 0x884433, ax, ay + 3, az + 9);
        // Approach land anchors
        makeBox(60, 20, 24, 0xBB3322, ax - 280, ay + 10, az);
        makeBox(60, 20, 24, 0xBB3322, ax + 280, ay + 10, az);
    }

    function buildPracaDoComercio() {
        // Praça do Comércio — grand waterfront square
        var px = -40;
        var py = 0;
        var pz = 60;
        // Square ground / cobblestone
        makeBox(140, 1, 120, 0xF0EDE0, px, py, pz);
        // Yellow arcaded buildings north wing
        makeBox(140, 22, 16, 0xE8D870, px, py + 11, pz - 56);
        // East and west arcade wings
        makeBox(16, 22, 120, 0xE8D870, px - 62, py + 11, pz);
        makeBox(16, 22, 120, 0xE8D870, px + 62, py + 11, pz);
        // Triumphal arch (Arco da Rua Augusta)
        makeBox(20, 36, 8, 0xD8CDA0, px, py + 18, pz - 48);
        makeBox(10, 36, 8, 0xC8BD90, px, py + 18, pz - 48);
        // Arch opening
        makeBox(8, 20, 10, 0x404030, px, py + 12, pz - 47);
        // Equestrian statue of José I
        makeCyl(2, 2, 16, 8, 0xAA8833, px, py + 8, pz + 20);
        makeSphere(5, 8, 8, 0xBB9944, px, py + 20, pz + 20);
        makeCyl(4, 3, 5, 6, 0x998822, px, py + 24, pz + 20);
        // Waterfront quay wall
        makeBox(140, 5, 8, 0xCCBB88, px, py + 2.5, pz + 56);
        // Fountains (cylinders)
        makeCyl(5, 5, 2, 10, 0xCCCCBB, px - 30, py + 1, pz);
        makeCyl(5, 5, 2, 10, 0xCCCCBB, px + 30, py + 1, pz);
        makeSphere(2, 6, 6, 0xAABBCC, px - 30, py + 4, pz);
        makeSphere(2, 6, 6, 0xAABBCC, px + 30, py + 4, pz);
    }

    function buildBairroAlto() {
        // Bairro Alto — hilly residential district with Elevador de Santa Justa
        var bx = -220;
        var by = 0;
        var bz = -20;
        // Hill terrain
        makeBox(180, 35, 150, 0xCC8833, bx, by + 17, bz);
        // Residential block rows
        makeBox(30, 20, 16, 0xFFCC88, bx - 60, by + 28, bz - 30);
        makeBox(30, 22, 16, 0xEEBB77, bx - 26, by + 30, bz - 30);
        makeBox(30, 18, 16, 0xFFDDAA, bx + 8, by + 27, bz - 30);
        makeBox(30, 22, 16, 0xDDAA66, bx + 42, by + 29, bz - 30);
        // Upper row pastel facades
        makeBox(28, 18, 14, 0xFFCCBB, bx - 55, by + 38, bz - 55);
        makeBox(28, 20, 14, 0xBBDDFF, bx - 24, by + 40, bz - 55);
        makeBox(28, 16, 14, 0xDDFFCC, bx + 8, by + 37, bz - 55);
        makeBox(28, 20, 14, 0xFFEEBB, bx + 40, by + 39, bz - 55);
        // Elevador de Santa Justa — iron Gothic tower lift
        var ex = bx + 80;
        var ez = bz + 20;
        makeBox(8, 60, 8, 0x887755, ex, by + 30, ez);
        makeBox(12, 4, 12, 0x776644, ex, by + 61, ez);
        makeBox(10, 12, 10, 0x887755, ex, by + 68, ez);
        makeCone(6, 10, 8, 0x665533, ex, by + 79, ez);
        // Lift cabin
        makeBox(5, 8, 5, 0x998866, ex, by + 20, ez);
        // Stairs/walkway bridge
        makeBox(40, 3, 5, 0x776644, ex - 20, by + 62, ez);
        // Chimneys on houses
        makeCyl(1, 1, 6, 4, 0x664433, bx - 60, by + 50, bz - 30);
        makeCyl(1, 1, 6, 4, 0x664433, bx - 20, by + 53, bz - 30);
        makeCyl(1, 1, 6, 4, 0x664433, bx + 10, by + 48, bz - 30);
    }

    function buildLisbonCathedral() {
        // Sé de Lisboa — Romanesque cathedral with two fortified towers
        var cx = -80;
        var cy = 0;
        var cz = -30;
        // Main nave body
        makeBox(60, 30, 40, 0xD4C8A0, cx, cy + 15, cz);
        // Transept crossing
        makeBox(80, 26, 22, 0xC8BC94, cx, cy + 13, cz);
        // Chancel / apse
        makeBox(28, 28, 24, 0xD4C8A0, cx + 40, cy + 14, cz);
        // Two fortified facade towers
        makeBox(16, 44, 16, 0xBBAA88, cx - 22, cy + 22, cz - 28);
        makeBox(16, 44, 16, 0xBBAA88, cx + 22, cy + 22, cz - 28);
        // Tower battlements
        makeBox(20, 6, 20, 0xAA9977, cx - 22, cy + 47, cz - 28);
        makeBox(20, 6, 20, 0xAA9977, cx + 22, cy + 47, cz - 28);
        // Rose window (circular) — sphere approximation on facade
        makeSphere(6, 8, 8, 0xDDD8C0, cx, cy + 24, cz - 28);
        // Main portal arch
        makeBox(16, 14, 6, 0xBBAA88, cx, cy + 7, cz - 30);
        // Bell in tower top
        makeCyl(3, 3, 4, 8, 0x887744, cx - 22, cy + 52, cz - 28);
        makeCyl(3, 3, 4, 8, 0x887744, cx + 22, cy + 52, cz - 28);
        // Flying buttresses
        makeBox(8, 6, 4, 0xBBAA88, cx - 35, cy + 10, cz);
        makeBox(8, 6, 4, 0xBBAA88, cx + 35, cy + 10, cz);
    }

    function buildRossioSquare() {
        // Rossio Square — Lisbon's main square
        var rx = -50;
        var ry = 0;
        var rz = 30;
        // Wavy black-and-white cobblestone plaza
        makeBox(100, 1, 80, 0xF0EDE8, rx, ry, rz);
        makeBox(100, 0.3, 80, 0xE0DDD8, rx, ry + 0.5, rz);
        // Nacional Theatre — north end
        makeBox(60, 24, 18, 0xF4F0E8, rx, ry + 12, rz - 48);
        // Theatre portico columns
        makeCyl(2, 2, 18, 6, 0xEEEAE0, rx - 20, ry + 9, rz - 40);
        makeCyl(2, 2, 18, 6, 0xEEEAE0, rx, ry + 9, rz - 40);
        makeCyl(2, 2, 18, 6, 0xEEEAE0, rx + 20, ry + 9, rz - 40);
        // Theatre pediment
        makeBox(64, 10, 8, 0xEEEAE0, rx, ry + 27, rz - 48);
        // King João I monument / fountain
        makeCyl(4, 4, 3, 10, 0xCCBBAA, rx, ry + 1.5, rz + 10);
        makeCyl(2, 2, 18, 8, 0xBBAA99, rx, ry + 9, rz + 10);
        makeSphere(4, 8, 8, 0xBBAA99, rx, ry + 20, rz + 10);
        // Second fountain south
        makeCyl(4, 4, 3, 10, 0xCCBBAA, rx, ry + 1.5, rz - 10);
        makeCyl(2, 2, 18, 8, 0xBBAA99, rx, ry + 9, rz - 10);
        makeSphere(4, 8, 8, 0xBBAA99, rx, ry + 20, rz - 10);
        // Surrounding arcade buildings east and west
        makeBox(12, 18, 80, 0xF4F0E4, rx - 56, ry + 9, rz);
        makeBox(12, 18, 80, 0xF4F0E4, rx + 56, ry + 9, rz);
    }

    function buildGeneralGround() {
        // General Lisbon ground plane — broken into boxes to avoid PlaneGeometry
        makeBox(2000, 2, 200, 0xC8B888, 0, -1, -100);
        makeBox(2000, 2, 200, 0xBBA870, 0, -1, 100);
        makeBox(2000, 2, 100, 0xC8B888, 0, -1, 230);
        // Roads
        makeBox(800, 1, 10, 0x555544, 0, 0.5, 0);
        makeBox(10, 1, 400, 0x555544, 0, 0.5, -100);
        makeBox(10, 1, 400, 0x555544, -100, 0.5, -100);
        makeBox(10, 1, 400, 0x555544, 100, 0.5, -100);
        // Road centre lines
        makeBox(800, 0.5, 1, 0xFFFFAA, 0, 1, 0);
        // Distant hills silhouette
        makeBox(300, 50, 40, 0x778866, -500, 25, -250);
        makeBox(400, 60, 40, 0x667755, -200, 30, -280);
        makeBox(300, 45, 40, 0x778866, 100, 22, -260);
        // South bank terrain
        makeBox(600, 15, 150, 0xBBB080, 100, 7, 480);
    }

    function update(delta) {
        // No per-frame animation required
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
