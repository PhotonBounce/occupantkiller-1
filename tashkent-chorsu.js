window.TashkentChorsu = (function() {
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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 16, 12);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 16);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 16);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var bx = 23800;

        // =====================================================================
        // GROUND PLANE (large box as ground)
        // =====================================================================
        makeBox(2000, 2, 2000, 0x8B7355, bx, -1, 0);

        // =====================================================================
        // CHORSU BAZAAR — iconic turquoise domed central market
        // Center: bx + 0, z = -300
        // =====================================================================

        // Main dome base (cylindrical drum)
        makeCylinder(55, 58, 18, 0x5599AA, bx, 9, -300);

        // Main dome (large sphere top half)
        makeSphere(55, 0x5599AA, bx, 36, -300);

        // Dome lantern/finial
        makeCylinder(4, 4, 10, 0x4488AA, bx, 64, -300);
        makeSphere(5, 0x33AABB, bx, 72, -300);

        // Dome decorative band
        makeCylinder(56, 56, 4, 0x4488AA, bx, 19, -300);

        // Supporting arcade arches — 8 pillars around drum
        makeCylinder(3, 3, 20, 0x4488AA, bx + 52, 10, -300);
        makeCylinder(3, 3, 20, 0x4488AA, bx - 52, 10, -300);
        makeCylinder(3, 3, 20, 0x4488AA, bx, 10, -352);
        makeCylinder(3, 3, 20, 0x4488AA, bx, 10, -248);
        makeCylinder(3, 3, 20, 0x4488AA, bx + 37, 10, -337);
        makeCylinder(3, 3, 20, 0x4488AA, bx - 37, 10, -337);
        makeCylinder(3, 3, 20, 0x4488AA, bx + 37, 10, -263);
        makeCylinder(3, 3, 20, 0x4488AA, bx - 37, 10, -263);

        // Market stalls surrounding bazaar — colorful fabric stalls
        // North row
        makeBox(18, 5, 12, 0xCC4422, bx + 80, 2.5, -320);
        makeBox(18, 5, 12, 0xEEAA22, bx + 100, 2.5, -320);
        makeBox(18, 5, 12, 0x44AA44, bx + 120, 2.5, -320);
        makeBox(18, 5, 12, 0xAA2244, bx + 140, 2.5, -320);

        // South row
        makeBox(18, 5, 12, 0xDDAA33, bx + 80, 2.5, -280);
        makeBox(18, 5, 12, 0x558833, bx + 100, 2.5, -280);
        makeBox(18, 5, 12, 0xCC5533, bx + 120, 2.5, -280);
        makeBox(18, 5, 12, 0x9933AA, bx + 140, 2.5, -280);

        // West stalls
        makeBox(12, 5, 18, 0xCC7733, bx - 80, 2.5, -310);
        makeBox(12, 5, 18, 0x3399CC, bx - 80, 2.5, -290);

        // Stall canopies (flat box roofs)
        makeBox(20, 1, 14, 0xFF5500, bx + 80, 6, -320);
        makeBox(20, 1, 14, 0xFFAA00, bx + 100, 6, -320);
        makeBox(20, 1, 14, 0x00AA44, bx + 120, 6, -320);
        makeBox(20, 1, 14, 0xCC2244, bx + 140, 6, -320);

        // Market entrance gate
        makeBox(6, 14, 3, 0x336688, bx + 70, 7, -300);
        makeBox(6, 14, 3, 0x336688, bx + 70, 7, -300);
        makeBox(18, 3, 3, 0x4499AA, bx + 70, 16, -300);

        // =====================================================================
        // INDEPENDENCE SQUARE (Mustaqillik Maydoni)
        // Center: bx + 300, z = 200
        // =====================================================================

        // Vast square paving
        makeBox(300, 1, 250, 0xD4D0C8, bx + 300, 0, 200);

        // Globe monument — globe with Uzbekistan
        makeCylinder(8, 10, 15, 0xB0B0B0, bx + 300, 7.5, 200);
        makeSphere(20, 0x446699, bx + 300, 28, 200);
        // Uzbekistan highlight patch on globe
        makeBox(12, 8, 3, 0x66AA44, bx + 300, 30, 220);

        // Globe pedestal decorative base
        makeBox(22, 3, 22, 0xC8C4B8, bx + 300, 1.5, 200);

        // Amir Timur equestrian statue
        makeCylinder(5, 7, 12, 0x888880, bx + 240, 6, 180);
        makeBox(6, 10, 4, 0x7A7A70, bx + 240, 17, 180);
        makeSphere(4, 0x8A8070, bx + 240, 25, 180);
        // Horse body
        makeBox(5, 7, 10, 0x554433, bx + 240, 21, 180);
        makeCylinder(1.5, 1.5, 8, 0x554433, bx + 240, 15, 184);

        // Eternal flame monument
        makeCylinder(4, 6, 12, 0x999088, bx + 350, 6, 220);
        makeCone(3, 8, 0xFF6600, bx + 350, 16, 220);
        makeSphere(3, 0xFF8800, bx + 350, 20, 220);

        // Tall flagpoles
        makeCylinder(0.5, 0.5, 35, 0xCCCCCC, bx + 270, 17.5, 120);
        makeCylinder(0.5, 0.5, 35, 0xCCCCCC, bx + 330, 17.5, 120);
        makeBox(12, 6, 0.5, 0x22AA44, bx + 271, 30, 120);
        makeBox(12, 6, 0.5, 0x22AA44, bx + 331, 30, 120);

        // Ornamental fountains
        makeCylinder(12, 14, 2, 0x8899AA, bx + 280, 1, 240);
        makeCylinder(1, 1, 8, 0xAABBCC, bx + 280, 5, 240);
        makeSphere(4, 0x88AACC, bx + 280, 9, 240);

        makeCylinder(12, 14, 2, 0x8899AA, bx + 320, 1, 240);
        makeCylinder(1, 1, 8, 0xAABBCC, bx + 320, 5, 240);
        makeSphere(4, 0x88AACC, bx + 320, 9, 240);

        // Government building facade behind square
        makeBox(120, 30, 20, 0xD4D0C8, bx + 300, 15, 100);
        makeBox(100, 5, 22, 0xCCC8BC, bx + 300, 31, 100);
        // Pillars on building
        makeCylinder(2, 2, 30, 0xE0DCD0, bx + 250, 15, 109);
        makeCylinder(2, 2, 30, 0xE0DCD0, bx + 270, 15, 109);
        makeCylinder(2, 2, 30, 0xE0DCD0, bx + 290, 15, 109);
        makeCylinder(2, 2, 30, 0xE0DCD0, bx + 310, 15, 109);
        makeCylinder(2, 2, 30, 0xE0DCD0, bx + 330, 15, 109);
        makeCylinder(2, 2, 30, 0xE0DCD0, bx + 350, 15, 109);

        // =====================================================================
        // KHAST IMAM (KHAZRATI IMAM) COMPLEX
        // Center: bx - 200, z = 200
        // =====================================================================

        // Tillya Sheikh Mosque — main building
        makeBox(70, 15, 50, 0xD4C890, bx - 200, 7.5, 200);

        // Mosque blue dome
        makeCylinder(18, 20, 10, 0xD4C890, bx - 200, 18, 200);
        makeSphere(18, 0x4466BB, bx - 200, 32, 200);

        // Dome finial
        makeCylinder(1.5, 1.5, 8, 0xCCBB44, bx - 200, 46, 200);
        makeSphere(2, 0xDDAA22, bx - 200, 51, 200);

        // Left minaret
        makeCylinder(3, 4, 50, 0xD4C890, bx - 230, 25, 178);
        makeCylinder(4, 3, 5, 0xCCBB55, bx - 230, 52, 178);
        makeCone(3, 10, 0x4466BB, bx - 230, 59, 178);

        // Right minaret
        makeCylinder(3, 4, 50, 0xD4C890, bx - 170, 25, 178);
        makeCylinder(4, 3, 5, 0xCCBB55, bx - 170, 52, 178);
        makeCone(3, 10, 0x4466BB, bx - 170, 59, 178);

        // Mosque entrance iwan portal
        makeBox(20, 25, 5, 0xCCBB66, bx - 200, 12.5, 225);
        makeBox(8, 5, 6, 0x4466BB, bx - 200, 24, 225);

        // Madrasa building
        makeBox(55, 12, 40, 0xC8BA7A, bx - 290, 6, 200);
        makeCylinder(6, 7, 12, 0xC8BA7A, bx - 290, 14, 200);
        makeSphere(6, 0x5577BB, bx - 290, 24, 200);

        // Library — housing oldest Quran manuscript
        makeBox(30, 10, 25, 0xD0C080, bx - 140, 5, 200);
        makeCylinder(5, 6, 10, 0xD0C080, bx - 140, 13, 200);
        makeSphere(5, 0x5588BB, bx - 140, 21, 200);

        // Khast Imam square paving
        makeBox(200, 0.5, 150, 0xCCBB88, bx - 200, 0.25, 200);

        // Courtyard fountain
        makeCylinder(8, 10, 2, 0xBBAA66, bx - 200, 1, 200);
        makeCylinder(1, 1, 6, 0x88AACC, bx - 200, 4, 200);

        // =====================================================================
        // AMIR TIMUR MUSEUM
        // Center: bx + 150, z = -100
        // =====================================================================

        // Six-sided base structure
        makeCylinder(35, 38, 20, 0x5566AA, bx + 150, 10, -100);

        // Blue ribbed dome
        makeSphere(35, 0x5566AA, bx + 150, 32, -100);

        // Golden globe on top
        makeCylinder(4, 4, 8, 0xBBAA22, bx + 150, 52, -100);
        makeSphere(8, 0xDDAA00, bx + 150, 62, -100);

        // Museum decorative arcade base
        makeBox(80, 4, 80, 0x6677BB, bx + 150, 2, -100);

        // Museum entrance columns
        makeCylinder(2, 2, 20, 0x7788CC, bx + 125, 10, -70);
        makeCylinder(2, 2, 20, 0x7788CC, bx + 175, 10, -70);
        makeBox(55, 5, 4, 0x6677BB, bx + 150, 21, -70);

        // =====================================================================
        // TASHKENT TV TOWER
        // Center: bx + 500, z = -200
        // =====================================================================

        // Main concrete shaft — tapered
        makeCylinder(5, 18, 200, 0xCCCCCC, bx + 500, 100, -200);

        // Upper shaft — narrower
        makeCylinder(3, 5, 80, 0xCCCCCC, bx + 500, 240, -200);

        // Observation deck pod
        makeCylinder(18, 18, 20, 0xBBBBBB, bx + 500, 195, -200);
        // Observation deck windows ring
        makeCylinder(19, 19, 6, 0x88AACC, bx + 500, 200, -200);

        // Restaurant pod
        makeCylinder(14, 14, 14, 0xCCCCBB, bx + 500, 165, -200);

        // Antenna
        makeCylinder(0.8, 0.8, 50, 0xAAAAAA, bx + 500, 305, -200);

        // Tower base
        makeBox(50, 8, 50, 0xBBBBBB, bx + 500, 4, -200);

        // Supporting legs (3 legs around base)
        makeCylinder(2.5, 4, 40, 0xCCCCCC, bx + 520, 20, -200);
        makeCylinder(2.5, 4, 40, 0xCCCCCC, bx + 490, 20, -220);
        makeCylinder(2.5, 4, 40, 0xCCCCCC, bx + 490, 20, -180);

        // =====================================================================
        // NAVOIY OPERA AND BALLET THEATRE
        // Center: bx + 50, z = 100
        // =====================================================================

        // Main theatre building — ornate Stalin-era
        makeBox(100, 25, 60, 0xD4C8B0, bx + 50, 12.5, 100);

        // Central dome
        makeCylinder(20, 22, 12, 0xD4C8B0, bx + 50, 30, 100);
        makeSphere(20, 0xC8BC9C, bx + 50, 45, 100);

        // Theatre portico columns — front
        makeCylinder(2.5, 2.5, 25, 0xE0D8C0, bx + 10, 12.5, 130);
        makeCylinder(2.5, 2.5, 25, 0xE0D8C0, bx + 30, 12.5, 130);
        makeCylinder(2.5, 2.5, 25, 0xE0D8C0, bx + 50, 12.5, 130);
        makeCylinder(2.5, 2.5, 25, 0xE0D8C0, bx + 70, 12.5, 130);
        makeCylinder(2.5, 2.5, 25, 0xE0D8C0, bx + 90, 12.5, 130);

        // Portico entablature
        makeBox(100, 5, 8, 0xD0C8A8, bx + 50, 27, 130);

        // Side wings
        makeBox(30, 18, 60, 0xD4C8B0, bx - 65, 9, 100);
        makeBox(30, 18, 60, 0xD4C8B0, bx + 165, 9, 100);

        // Theatre plaza
        makeBox(130, 0.5, 30, 0xC8C4B8, bx + 50, 0.25, 145);

        // =====================================================================
        // ALISHER NAVOIY METRO STATION
        // Center: bx - 50, z = -100
        // =====================================================================

        // Metro station entrance building
        makeBox(40, 8, 20, 0x5588AA, bx - 50, 4, -100);

        // Ornate blue-tiled arch decorations
        makeCylinder(10, 10, 3, 0x4477AA, bx - 50, 9, -100);
        makeCylinder(8, 10, 8, 0x4477AA, bx - 50, 14, -100);
        makeSphere(8, 0x3366AA, bx - 50, 20, -100);

        // Metro entrance arches (two arched portals)
        makeBox(5, 10, 3, 0x3366AA, bx - 65, 5, -90);
        makeBox(12, 3, 3, 0x4488BB, bx - 65, 11, -90);
        makeBox(5, 10, 3, 0x3366AA, bx - 35, 5, -90);
        makeBox(12, 3, 3, 0x4488BB, bx - 35, 11, -90);

        // Decorative Islamic geometric pattern panels
        makeBox(38, 6, 1, 0x5599CC, bx - 50, 6, -110);
        makeBox(1, 6, 18, 0x5599CC, bx - 69, 6, -100);
        makeBox(1, 6, 18, 0x5599CC, bx - 31, 6, -100);

        // =====================================================================
        // BARAK KHAN MADRASAH
        // Center: bx - 350, z = 100
        // =====================================================================

        // Main madrasah body
        makeBox(60, 14, 50, 0xC8A858, bx - 350, 7, 100);

        // Ornate iwan portal
        makeBox(24, 22, 6, 0xC8A858, bx - 350, 11, 125);
        makeBox(10, 6, 7, 0x4466BB, bx - 350, 21, 125);

        // Corner towers (cylindrical)
        makeCylinder(4, 5, 18, 0xBB9944, bx - 321, 9, 75);
        makeCylinder(4, 5, 18, 0xBB9944, bx - 379, 9, 75);
        makeCylinder(4, 5, 18, 0xBB9944, bx - 321, 9, 125);
        makeCylinder(4, 5, 18, 0xBB9944, bx - 379, 9, 125);

        // Tower domes
        makeSphere(4, 0x5577BB, bx - 321, 19, 75);
        makeSphere(4, 0x5577BB, bx - 379, 19, 75);
        makeSphere(4, 0x5577BB, bx - 321, 19, 125);
        makeSphere(4, 0x5577BB, bx - 379, 19, 125);

        // Central courtyard
        makeBox(40, 0.5, 30, 0xCCAA66, bx - 350, 0.25, 100);
        makeCylinder(5, 6, 1.5, 0xBB9944, bx - 350, 0.75, 100);

        // =====================================================================
        // EARTHQUAKE MEMORIAL (1966)
        // Center: bx + 400, z = 100
        // =====================================================================

        // Abstract sculpture — split cracked earth forms
        makeBox(8, 25, 5, 0x888888, bx + 395, 12.5, 100);
        makeBox(8, 20, 5, 0x777777, bx + 405, 10, 100);
        makeBox(5, 15, 8, 0x999999, bx + 400, 7.5, 107);

        // Memorial plaque base
        makeBox(25, 2, 20, 0x666666, bx + 400, 1, 100);

        // Surrounding remembrance elements
        makeSphere(3, 0x555555, bx + 410, 5, 95);
        makeSphere(3, 0x555555, bx + 390, 5, 105);

        // Memorial park benches / elements
        makeBox(10, 2, 4, 0x887766, bx + 420, 1, 115);
        makeBox(10, 2, 4, 0x887766, bx + 380, 1, 85);

        // =====================================================================
        // BOTANICAL GARDEN
        // Center: bx - 500, z = -200
        // =====================================================================

        // Garden boundary walls
        makeBox(180, 4, 3, 0x4A7A3C, bx - 500, 2, -290);
        makeBox(180, 4, 3, 0x4A7A3C, bx - 500, 2, -110);
        makeBox(3, 4, 180, 0x4A7A3C, bx - 590, 2, -200);
        makeBox(3, 4, 180, 0x4A7A3C, bx - 410, 2, -200);

        // Garden ground
        makeBox(180, 0.5, 180, 0x3D7A32, bx - 500, 0.25, -200);

        // Rose collection beds (colored box clusters)
        makeBox(20, 1.5, 12, 0xCC3344, bx - 540, 0.75, -200);
        makeBox(20, 1.5, 12, 0xFF6677, bx - 510, 0.75, -200);
        makeBox(20, 1.5, 12, 0xFFAA22, bx - 480, 0.75, -200);
        makeBox(20, 1.5, 12, 0xFFFFAA, bx - 450, 0.75, -200);

        // Trees (cone on cylinder)
        makeCylinder(1.5, 2, 8, 0x554422, bx - 560, 4, -230);
        makeCone(10, 18, 0x2D6A22, bx - 560, 18, -230);

        makeCylinder(1.5, 2, 8, 0x554422, bx - 440, 4, -230);
        makeCone(10, 18, 0x2D6A22, bx - 440, 18, -230);

        makeCylinder(1.5, 2, 8, 0x554422, bx - 560, 4, -170);
        makeCone(10, 18, 0x2D6A22, bx - 560, 18, -170);

        makeCylinder(1.5, 2, 8, 0x554422, bx - 440, 4, -170);
        makeCone(10, 18, 0x2D6A22, bx - 440, 18, -170);

        makeCylinder(1.5, 2, 8, 0x554422, bx - 500, 4, -240);
        makeCone(10, 18, 0x2D6A22, bx - 500, 18, -240);

        // Canal system — long thin blue boxes
        makeBox(160, 1.5, 6, 0x4488BB, bx - 500, 0.75, -180);
        makeBox(6, 1.5, 160, 0x4488BB, bx - 500, 0.75, -200);

        // Garden pavilion / greenhouse
        makeBox(25, 10, 18, 0x88CCAA, bx - 500, 5, -150);
        makeCylinder(8, 10, 6, 0x88CCAA, bx - 500, 13, -150);
        makeSphere(8, 0xAADDBB, bx - 500, 20, -150);

        // Garden entrance gate columns
        makeCylinder(2.5, 3, 16, 0x6A8C5E, bx - 418, 8, -200);
        makeCylinder(2.5, 3, 16, 0x6A8C5E, bx - 408, 8, -200);
        makeBox(16, 3, 4, 0x4A7A3C, bx - 413, 18, -200);

        // =====================================================================
        // STREET LIGHTING AND INFRASTRUCTURE
        // =====================================================================

        // Street lights along main boulevard
        makeCylinder(0.4, 0.5, 14, 0x888888, bx + 200, 7, -50);
        makeSphere(2, 0xFFFF99, bx + 200, 15, -50);

        makeCylinder(0.4, 0.5, 14, 0x888888, bx + 200, 7, 50);
        makeSphere(2, 0xFFFF99, bx + 200, 15, 50);

        makeCylinder(0.4, 0.5, 14, 0x888888, bx + 100, 7, -50);
        makeSphere(2, 0xFFFF99, bx + 100, 15, -50);

        makeCylinder(0.4, 0.5, 14, 0x888888, bx + 100, 7, 50);
        makeSphere(2, 0xFFFF99, bx + 100, 15, 50);

        // Road surface
        makeBox(600, 0.5, 20, 0x555555, bx + 100, 0.25, 0);

        // Sidewalk strips
        makeBox(600, 0.4, 8, 0xAAAAAA, bx + 100, 0.2, 12);
        makeBox(600, 0.4, 8, 0xAAAAAA, bx + 100, 0.2, -12);
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
