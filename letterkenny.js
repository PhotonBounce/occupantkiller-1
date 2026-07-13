window.Letterkenny = (function() {
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
        var cx = 18120;

        // ─── GROUND PLANE (using flat box) ───────────────────────────────────────
        makeBox(1200, 0.5, 600, 0x4A7C59, cx, -0.25, 0);

        // ─── RIVER SWILLY ─────────────────────────────────────────────────────────
        makeBox(1200, 0.6, 40, 0x006994, cx, 0.05, -180);

        // River banks
        makeBox(1200, 0.8, 6, 0x8B7355, cx, 0.1, -161);
        makeBox(1200, 0.8, 6, 0x8B7355, cx, 0.1, -199);

        // ─── LOUGH SWILLY ARM (to north) ──────────────────────────────────────────
        makeBox(500, 0.7, 90, 0x1E6BA8, cx + 300, 0.05, -270);
        makeBox(120, 0.7, 180, 0x1E6BA8, cx + 520, 0.05, -220);

        // ─── OLD STONE BRIDGE ─────────────────────────────────────────────────────
        // Bridge deck
        makeBox(30, 2, 40, 0x696969, cx, 1.5, -180);
        // Arch supports (piers)
        makeCylinder(2.5, 2.5, 6, 8, 0x696969, cx - 8, -2, -180);
        makeCylinder(2.5, 2.5, 6, 8, 0x696969, cx,     -2, -180);
        makeCylinder(2.5, 2.5, 6, 8, 0x696969, cx + 8, -2, -180);
        // Bridge parapets
        makeBox(30, 1.2, 1, 0x808080, cx, 2.6, -161);
        makeBox(30, 1.2, 1, 0x808080, cx, 2.6, -199);

        // ─── ST EUNAN'S CATHEDRAL ─────────────────────────────────────────────────
        // Main nave
        makeBox(30, 28, 50, 0x808080, cx, 14, 80);
        // Transept arms
        makeBox(60, 18, 16, 0x808080, cx, 9, 72);
        // Chancel
        makeBox(16, 22, 20, 0x909090, cx, 11, 108);
        // Twin west towers
        makeBox(10, 48, 10, 0x2F4F4F, cx - 16, 24, 58);
        makeBox(10, 48, 10, 0x2F4F4F, cx + 16, 24, 58);
        // Tower spires
        makeCone(5.5, 28, 4, 0x2F4F4F, cx - 16, 62, 58);
        makeCone(5.5, 28, 4, 0x2F4F4F, cx + 16, 62, 58);
        // Nave roof ridge (box as roof)
        makeBox(26, 6, 50, 0x505050, cx, 31, 80);
        // Rose window (west face, glass box)
        makeBox(7, 7, 0.5, 0x87CEEB, cx, 22, 53);
        // Flying buttresses left side
        makeBox(10, 1.5, 1.5, 0x909090, cx - 18, 14, 70);
        makeBox(10, 1.5, 1.5, 0x909090, cx - 18, 14, 82);
        makeBox(10, 1.5, 1.5, 0x909090, cx - 18, 14, 94);
        // Flying buttresses right side
        makeBox(10, 1.5, 1.5, 0x909090, cx + 18, 14, 70);
        makeBox(10, 1.5, 1.5, 0x909090, cx + 18, 14, 82);
        makeBox(10, 1.5, 1.5, 0x909090, cx + 18, 14, 94);
        // Buttress uprights
        makeBox(2, 10, 2, 0x808080, cx - 23, 5, 70);
        makeBox(2, 10, 2, 0x808080, cx - 23, 5, 82);
        makeBox(2, 10, 2, 0x808080, cx - 23, 5, 94);
        makeBox(2, 10, 2, 0x808080, cx + 23, 5, 70);
        makeBox(2, 10, 2, 0x808080, cx + 23, 5, 82);
        makeBox(2, 10, 2, 0x808080, cx + 23, 5, 94);
        // Cathedral entrance porch
        makeBox(12, 8, 5, 0x808080, cx, 4, 54);

        // ─── MAIN STREET SHOPFRONTS ───────────────────────────────────────────────
        // Left side of main street (west)
        makeBox(14, 18, 10, 0xCD5C5C, cx - 30, 9, -20);
        makeBox(14, 20, 10, 0xE8D5B7, cx - 30, 10, -40);
        makeBox(14, 16, 10, 0x7B3F00, cx - 30, 8,  -60);
        makeBox(14, 18, 10, 0xCD5C5C, cx - 30, 9,  -80);
        makeBox(14, 22, 10, 0xE8D5B7, cx - 30, 11, -100);
        makeBox(14, 18, 10, 0x7B3F00, cx - 30, 9,  -120);
        makeBox(14, 16, 10, 0xCD5C5C, cx - 30, 8,  -140);
        makeBox(14, 20, 10, 0xE8D5B7, cx - 30, 10,   0);
        makeBox(14, 18, 10, 0x7B3F00, cx - 30, 9,   20);
        makeBox(14, 16, 10, 0xCD5C5C, cx - 30, 8,   40);

        // Right side of main street (east)
        makeBox(14, 18, 10, 0xE8D5B7, cx + 30, 9,  -20);
        makeBox(14, 22, 10, 0xCD5C5C, cx + 30, 11, -40);
        makeBox(14, 16, 10, 0x7B3F00, cx + 30, 8,  -60);
        makeBox(14, 20, 10, 0xE8D5B7, cx + 30, 10, -80);
        makeBox(14, 18, 10, 0xCD5C5C, cx + 30, 9,  -100);
        makeBox(14, 22, 10, 0x7B3F00, cx + 30, 11, -120);
        makeBox(14, 16, 10, 0xE8D5B7, cx + 30, 8,  -140);
        makeBox(14, 18, 10, 0xCD5C5C, cx + 30, 9,    0);
        makeBox(14, 20, 10, 0xE8D5B7, cx + 30, 10,  20);
        makeBox(14, 16, 10, 0x7B3F00, cx + 30, 8,   40);

        // ─── MARKET SQUARE ────────────────────────────────────────────────────────
        // Cobbled square surface
        makeBox(60, 0.4, 60, 0xC0C0C0, cx, 0.2, -10);
        // Fountain bowl
        makeCylinder(5, 6, 2, 12, 0xA8A8A8, cx, 1.5, -10);
        // Fountain inner bowl
        makeCylinder(2.5, 3, 1.5, 12, 0xB8B8B8, cx, 2.5, -10);
        // Fountain dome top
        makeSphere(1.8, 10, 8, 0xC8C8C8, cx, 3.8, -10);
        // Market square lamp posts
        makeCylinder(0.2, 0.2, 6, 6, 0x333333, cx - 20, 3, -30);
        makeCylinder(0.2, 0.2, 6, 6, 0x333333, cx + 20, 3, -30);
        makeCylinder(0.2, 0.2, 6, 6, 0x333333, cx - 20, 3,  10);
        makeCylinder(0.2, 0.2, 6, 6, 0x333333, cx + 20, 3,  10);
        // Lamp globes
        makeSphere(0.5, 6, 5, 0xFFFF99, cx - 20, 6.5, -30);
        makeSphere(0.5, 6, 5, 0xFFFF99, cx + 20, 6.5, -30);
        makeSphere(0.5, 6, 5, 0xFFFF99, cx - 20, 6.5,  10);
        makeSphere(0.5, 6, 5, 0xFFFF99, cx + 20, 6.5,  10);

        // ─── GENERAL HOSPITAL ─────────────────────────────────────────────────────
        // Main hospital block
        makeBox(60, 20, 40, 0xF5F5F5, cx - 120, 10, -60);
        // Hospital wing
        makeBox(30, 15, 25, 0xF5F5F5, cx - 160, 7.5, -50);
        // Hospital roof plant room
        makeBox(20, 4, 15, 0xE0E0E0, cx - 120, 22, -60);
        // Entrance canopy
        makeBox(16, 4, 6, 0xD0D0D0, cx - 100, 3, -42);
        // Hospital chimney
        makeCylinder(1, 1.2, 10, 6, 0xBBBBBB, cx - 130, 27, -70);
        // Car park
        makeBox(50, 0.3, 30, 0x555555, cx - 120, 0.15, -95);

        // ─── COUNTY COUNCIL OFFICES ───────────────────────────────────────────────
        makeBox(50, 16, 30, 0xE8E8E8, cx + 120, 8, -80);
        makeBox(25, 12, 20, 0xDDDDDD, cx + 150, 6, -75);
        // Council offices glazed atrium
        makeBox(15, 18, 10, 0xB0D4F1, cx + 120, 9, -66);
        // Flag pole
        makeCylinder(0.2, 0.2, 12, 4, 0x888888, cx + 108, 6, -68);
        makeSphere(0.4, 4, 4, 0x009900, cx + 108, 12.4, -68);

        // ─── FACTORY / INDUSTRIAL ESTATE ──────────────────────────────────────────
        makeBox(40, 12, 30, 0xC0C0C0, cx - 200, 6, 60);
        makeBox(35, 10, 25, 0xB8B8B8, cx - 245, 5, 65);
        makeBox(30, 14, 28, 0xC8C8C8, cx - 200, 7, 100);
        // Smokestacks
        makeCylinder(2, 3, 24, 8, 0x909090, cx - 185, 18, 55);
        makeCylinder(2, 3, 24, 8, 0x909090, cx - 215, 18, 55);
        makeCylinder(1.5, 2.5, 20, 8, 0x909090, cx - 240, 15, 100);
        // Factory warehouse roof ridge
        makeBox(36, 3, 26, 0xAAAAAA, cx - 200, 14, 60);
        // Industrial fence posts
        makeCylinder(0.3, 0.3, 4, 4, 0x666666, cx - 170, 2, 48);
        makeCylinder(0.3, 0.3, 4, 4, 0x666666, cx - 160, 2, 48);
        makeCylinder(0.3, 0.3, 4, 4, 0x666666, cx - 150, 2, 48);

        // ─── DONEGAL AIRPORT ROAD ─────────────────────────────────────────────────
        makeBox(400, 0.3, 8, 0x555555, cx - 100, 0.15, 160);
        // Road markings (centre line as narrow box)
        makeBox(400, 0.35, 0.6, 0xFFFFFF, cx - 100, 0.18, 160);
        // Road signpost pole
        makeCylinder(0.3, 0.3, 5, 4, 0x888888, cx - 80, 2.5, 155);
        // Sign board
        makeBox(6, 2.5, 0.3, 0x007700, cx - 80, 5.5, 155);

        // ─── ROLLING HILLS OF DONEGAL ─────────────────────────────────────────────
        // Green hills in background (south)
        makeSphere(80, 10, 6, 0x4A7C59, cx - 300, -20, 250);
        makeSphere(100, 10, 6, 0x4A7C59, cx - 150, -30, 280);
        makeSphere(90,  10, 6, 0x4A7C59, cx,       -25, 300);
        makeSphere(110, 10, 6, 0x4A7C59, cx + 180, -35, 270);
        makeSphere(85,  10, 6, 0x4A7C59, cx + 320, -20, 240);
        // Peat bog patches on hills
        makeSphere(30, 8, 5, 0x8B7355, cx - 280, 20, 250);
        makeSphere(25, 8, 5, 0x8B7355, cx - 100, 30, 295);
        makeSphere(35, 8, 5, 0x8B7355, cx + 200, 25, 265);
        makeSphere(20, 8, 5, 0x8B7355, cx + 350, 22, 235);
        // Hills to north
        makeSphere(70, 10, 6, 0x4A7C59, cx - 250, -25, -320);
        makeSphere(85, 10, 6, 0x4A7C59, cx + 200, -30, -340);

        // ─── TREES / GREENERY ALONG STREET ───────────────────────────────────────
        makeCylinder(0.4, 0.5, 4, 5, 0x5C3B1A, cx - 30, 2, -155);
        makeSphere(3, 7, 6, 0x2D6A2D, cx - 30, 6, -155);
        makeCylinder(0.4, 0.5, 4, 5, 0x5C3B1A, cx + 30, 2, -155);
        makeSphere(3, 7, 6, 0x2D6A2D, cx + 30, 6, -155);
        makeCylinder(0.4, 0.5, 4, 5, 0x5C3B1A, cx - 30, 2, 50);
        makeSphere(3, 7, 6, 0x2D6A2D, cx - 30, 6, 50);
        makeCylinder(0.4, 0.5, 4, 5, 0x5C3B1A, cx + 30, 2, 50);
        makeSphere(3, 7, 6, 0x2D6A2D, cx + 30, 6, 50);

        // ─── ADDITIONAL TOWN BUILDINGS ────────────────────────────────────────────
        // Post office
        makeBox(16, 14, 12, 0xD2B48C, cx - 60, 7, 20);
        // Pub / hotel
        makeBox(18, 16, 12, 0x8B0000, cx + 60, 8, 20);
        // Supermarket
        makeBox(35, 12, 25, 0xF0F0F0, cx - 80, 6, -10);
        // Church hall
        makeBox(22, 10, 18, 0xCCCCCC, cx + 80, 5, 50);
        // Garda station
        makeBox(20, 12, 15, 0x4682B4, cx - 70, 6, -140);
        // School building
        makeBox(45, 14, 25, 0xFFDEAD, cx + 100, 7, 130);
        // School fence post
        makeCylinder(0.3, 0.3, 4, 4, 0x555555, cx + 80,  2, 120);
        makeCylinder(0.3, 0.3, 4, 4, 0x555555, cx + 122, 2, 120);
        // Petrol station canopy
        makeBox(24, 5, 16, 0xE0E0E0, cx + 65, 5, -130);
        makeCylinder(1, 1, 5, 6, 0xCCCCCC, cx + 55, 2.5, -130);
        makeCylinder(1, 1, 5, 6, 0xCCCCCC, cx + 75, 2.5, -130);
        // Pharmacy
        makeBox(12, 14, 10, 0x90EE90, cx - 50, 7, -110);
        // Bank
        makeBox(18, 16, 12, 0xD2691E, cx + 50, 8, -110);

        // ─── ROADWAYS ─────────────────────────────────────────────────────────────
        // Main Street road surface
        makeBox(300, 0.3, 20, 0x444444, cx, 0.15, -50);
        // Side roads
        makeBox(80, 0.3, 10, 0x444444, cx - 60, 0.15, -10);
        makeBox(80, 0.3, 10, 0x444444, cx + 60, 0.15, -10);
        // Pavement / footpath
        makeBox(300, 0.4, 5, 0xAAAAAA, cx, 0.2, -40);
        makeBox(300, 0.4, 5, 0xAAAAAA, cx, 0.2, -60);

        // ─── CHURCH GRAVEYARD WALL ────────────────────────────────────────────────
        makeBox(70, 3, 1.5, 0x808080, cx, 1.5, 52);
        makeBox(1.5, 3, 55, 0x808080, cx - 35, 1.5, 79);
        makeBox(1.5, 3, 55, 0x808080, cx + 35, 1.5, 79);

        // ─── WATER TOWER ──────────────────────────────────────────────────────────
        makeCylinder(0.6, 0.6, 18, 6, 0xAAAAAA, cx + 170, 9, 50);
        makeCylinder(4, 4, 6, 12, 0xBBBBBB, cx + 170, 21, 50);
        makeCone(4.2, 4, 8, 0x999999, cx + 170, 26, 50);
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
