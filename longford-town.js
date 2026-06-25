window.LongfordTown = (function() {
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

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var cx = 18480;

        // ---- SKY BOX (large enclosing cube for grey midlands sky) ----
        makeMesh(new THREE.BoxGeometry(2000, 600, 2000), 0xC0C0C0, cx, 250, 0);

        // ---- GROUND / FARMLAND ----
        // Central town ground
        makeMesh(new THREE.BoxGeometry(600, 2, 600), 0x8B8B6B, cx, -1, 0);
        // North farmland
        makeMesh(new THREE.BoxGeometry(800, 2, 400), 0x228B22, cx, -1, -500);
        // South farmland
        makeMesh(new THREE.BoxGeometry(800, 2, 400), 0x228B22, cx, -1, 500);
        // East farmland
        makeMesh(new THREE.BoxGeometry(400, 2, 800), 0x228B22, cx + 500, -1, 0);
        // West farmland
        makeMesh(new THREE.BoxGeometry(400, 2, 800), 0x228B22, cx - 500, -1, 0);

        // ---- HEDGEROWS ----
        makeMesh(new THREE.BoxGeometry(200, 5, 4), 0x5C3317, cx - 350, 2.5, -400);
        makeMesh(new THREE.BoxGeometry(4, 5, 200), 0x5C3317, cx - 250, 2.5, -500);
        makeMesh(new THREE.BoxGeometry(200, 5, 4), 0x5C3317, cx + 300, 2.5, 400);
        makeMesh(new THREE.BoxGeometry(4, 5, 180), 0x5C3317, cx + 400, 2.5, 480);
        makeMesh(new THREE.BoxGeometry(150, 5, 4), 0x5C3317, cx - 100, 2.5, 450);

        // ---- RIVER CAMLIN ----
        // Main channel running east-west through town
        makeMesh(new THREE.BoxGeometry(700, 1.5, 18), 0x006994, cx, 0.5, 80);
        // River bend northward
        makeMesh(new THREE.BoxGeometry(18, 1.5, 120), 0x006994, cx - 340, 0.5, 20);
        // River bank stones
        makeMesh(new THREE.BoxGeometry(700, 1, 4), 0x696969, cx, 0.3, 71);
        makeMesh(new THREE.BoxGeometry(700, 1, 4), 0x696969, cx, 0.3, 89);

        // ---- MARKET SQUARE (central paved area) ----
        makeMesh(new THREE.BoxGeometry(80, 0.5, 80), 0xC0C0C0, cx, 0.25, -20);

        // Oliver Goldsmith Obelisk Monument (Market Square)
        // Base plinth
        makeMesh(new THREE.BoxGeometry(6, 2, 6), 0xA9A9A9, cx, 1, -20);
        // Second tier
        makeMesh(new THREE.BoxGeometry(4, 2, 4), 0xA9A9A9, cx, 3, -20);
        // Obelisk shaft
        makeMesh(new THREE.BoxGeometry(2, 14, 2), 0xC0C0C0, cx, 10, -20);
        // Obelisk tip (cone)
        makeMesh(new THREE.ConeGeometry(1.2, 4, 4), 0xC0C0C0, cx, 19, -20);

        // ---- ST MEL'S CATHEDRAL ----
        // Wide nave body (limestone Classical Revival)
        makeMesh(new THREE.BoxGeometry(40, 28, 70), 0x8B7355, cx - 100, 14, -40);
        // Transept north arm
        makeMesh(new THREE.BoxGeometry(25, 24, 20), 0x8B7355, cx - 100, 12, -70);
        // Transept south arm
        makeMesh(new THREE.BoxGeometry(25, 24, 20), 0x8B7355, cx - 100, 12, -10);
        // Apse east end
        makeMesh(new THREE.BoxGeometry(20, 22, 20), 0x8B7355, cx - 130, 11, -40);
        // Pediment / portico front (BoxGeometry triangular pediment approximated as thin box)
        makeMesh(new THREE.BoxGeometry(42, 6, 4), 0x9B8365, cx - 67, 27, -40);
        // Portico base entablature
        makeMesh(new THREE.BoxGeometry(42, 3, 8), 0x8B7355, cx - 68, 22, -40);
        // 6 Corinthian columns across facade
        makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 22, 8), 0x9B8365, cx - 74, 11, -40);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 22, 8), 0x9B8365, cx - 66, 11, -40);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 22, 8), 0x9B8365, cx - 62, 11, -40);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 22, 8), 0x9B8365, cx - 78, 11, -40);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 22, 8), 0x9B8365, cx - 70, 11, -40);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 22, 8), 0x9B8365, cx - 58, 11, -40);
        // Central lantern tower (tall cylinder)
        makeMesh(new THREE.CylinderGeometry(7, 7, 20, 12), 0x8B7355, cx - 100, 34, -40);
        // Lantern drum cap
        makeMesh(new THREE.CylinderGeometry(5, 7, 4, 12), 0x7B6345, cx - 100, 46, -40);
        // Dome cap on lantern
        makeMesh(new THREE.SphereGeometry(5, 12, 8), 0x7B6345, cx - 100, 52, -40);
        // Cathedral steps
        makeMesh(new THREE.BoxGeometry(42, 1.5, 6), 0x9B8365, cx - 64, 0.75, -40);
        makeMesh(new THREE.BoxGeometry(44, 1, 4), 0x9B8365, cx - 63, 1.5, -40);

        // ---- MAIN STREET — Georgian-Victorian shopfronts ----
        // North side of Main Street row 1
        makeMesh(new THREE.BoxGeometry(14, 16, 12), 0xCD5C5C, cx + 10, 8, -60);
        makeMesh(new THREE.BoxGeometry(14, 18, 12), 0xB85C5C, cx + 26, 9, -60);
        makeMesh(new THREE.BoxGeometry(14, 14, 12), 0xCD5C5C, cx + 42, 7, -60);
        makeMesh(new THREE.BoxGeometry(14, 16, 12), 0xBC6060, cx + 58, 8, -60);
        makeMesh(new THREE.BoxGeometry(14, 18, 12), 0xCD5C5C, cx + 74, 9, -60);
        // South side of Main Street
        makeMesh(new THREE.BoxGeometry(14, 15, 12), 0xCD5C5C, cx + 10, 7.5, -80);
        makeMesh(new THREE.BoxGeometry(14, 17, 12), 0xB85C5C, cx + 26, 8.5, -80);
        makeMesh(new THREE.BoxGeometry(14, 16, 12), 0xCD5C5C, cx + 42, 8, -80);
        makeMesh(new THREE.BoxGeometry(14, 15, 12), 0xBC6060, cx + 58, 7.5, -80);
        // Shop awnings (flat box overhangs)
        makeMesh(new THREE.BoxGeometry(13, 0.8, 3), 0x8B0000, cx + 10, 5, -56);
        makeMesh(new THREE.BoxGeometry(13, 0.8, 3), 0x8B0000, cx + 26, 5, -56);
        makeMesh(new THREE.BoxGeometry(13, 0.8, 3), 0x006400, cx + 42, 5, -56);

        // ---- LONGFORD RAILWAY STATION ----
        // Station main building
        makeMesh(new THREE.BoxGeometry(50, 14, 18), 0xCD5C5C, cx + 180, 7, -30);
        // Station entrance porch
        makeMesh(new THREE.BoxGeometry(14, 10, 8), 0xBC5050, cx + 155, 5, -30);
        // Platform canopy (dark grey flat box)
        makeMesh(new THREE.BoxGeometry(60, 1.5, 14), 0x2F4F4F, cx + 180, 11, -8);
        // Canopy support columns
        makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 11, 6), 0x2F4F4F, cx + 158, 5.5, -10);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 11, 6), 0x2F4F4F, cx + 172, 5.5, -10);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 11, 6), 0x2F4F4F, cx + 186, 5.5, -10);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.5, 11, 6), 0x2F4F4F, cx + 200, 5.5, -10);
        // Water tower (CylinderGeometry)
        makeMesh(new THREE.CylinderGeometry(3, 3, 20, 10), 0xCD5C5C, cx + 215, 10, -30);
        makeMesh(new THREE.CylinderGeometry(3.5, 3, 3, 10), 0xBC5050, cx + 215, 21.5, -30);
        // Platform surface
        makeMesh(new THREE.BoxGeometry(65, 1, 12), 0x808080, cx + 180, 0.5, -10);
        // Railway tracks (thin boxes)
        makeMesh(new THREE.BoxGeometry(300, 0.4, 1.2), 0x4A4A4A, cx + 130, 0.2, -4);
        makeMesh(new THREE.BoxGeometry(300, 0.4, 1.2), 0x4A4A4A, cx + 130, 0.2, 2);

        // ---- LONGFORD CASTLE REMAINS ----
        // Main remnant tower
        makeMesh(new THREE.BoxGeometry(12, 22, 12), 0x808080, cx - 200, 11, 100);
        // Ruined wall section
        makeMesh(new THREE.BoxGeometry(30, 8, 3), 0x707070, cx - 190, 4, 112);
        // Crumbled corner
        makeMesh(new THREE.BoxGeometry(5, 12, 5), 0x808080, cx - 213, 6, 106);
        // Tower battlements
        makeMesh(new THREE.BoxGeometry(12, 3, 3), 0x808080, cx - 200, 24, 106);
        makeMesh(new THREE.BoxGeometry(3, 3, 12), 0x808080, cx - 206, 24, 100);

        // ---- COUNTY COUNCIL OFFICES ----
        // Main modern administrative building
        makeMesh(new THREE.BoxGeometry(55, 20, 22), 0xF5F5F5, cx + 60, 10, 60);
        // Glazed entrance section
        makeMesh(new THREE.BoxGeometry(16, 20, 6), 0xD0E8F0, cx + 40, 10, 49);
        // Side wing
        makeMesh(new THREE.BoxGeometry(20, 16, 22), 0xECECEC, cx + 90, 8, 60);
        // Flat roof parapet
        makeMesh(new THREE.BoxGeometry(57, 1.5, 24), 0xE0E0E0, cx + 60, 20.75, 60);

        // ---- ST JOHN'S CHURCH (Church of Ireland, Gothic Revival) ----
        // Nave
        makeMesh(new THREE.BoxGeometry(14, 14, 30), 0x808080, cx - 30, 7, 50);
        // Chancel
        makeMesh(new THREE.BoxGeometry(10, 12, 10), 0x787878, cx - 30, 6, 68);
        // Tower base
        makeMesh(new THREE.BoxGeometry(10, 20, 10), 0x808080, cx - 22, 10, 36);
        // Spire (ConeGeometry)
        makeMesh(new THREE.ConeGeometry(4, 22, 4), 0x696969, cx - 22, 31, 36);
        // Buttresses
        makeMesh(new THREE.BoxGeometry(3, 14, 4), 0x787878, cx - 25, 7, 40);
        makeMesh(new THREE.BoxGeometry(3, 14, 4), 0x787878, cx - 37, 7, 40);

        // ---- TARMONBARRY LOCK (Shannon-Erne waterway) ----
        // Canal channel
        makeMesh(new THREE.BoxGeometry(20, 2, 80), 0x006994, cx - 280, 1, 30);
        // Lock gate west
        makeMesh(new THREE.BoxGeometry(20, 6, 2), 0x5C3317, cx - 280, 3, -10);
        // Lock gate east
        makeMesh(new THREE.BoxGeometry(20, 6, 2), 0x5C3317, cx - 280, 3, 70);
        // Lock walls
        makeMesh(new THREE.BoxGeometry(2, 5, 80), 0x808080, cx - 291, 2.5, 30);
        makeMesh(new THREE.BoxGeometry(2, 5, 80), 0x808080, cx - 269, 2.5, 30);
        // Lock keeper's cottage
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xCD5C5C, cx - 265, 4, -20);
        makeMesh(new THREE.ConeGeometry(7, 4, 4), 0x8B4513, cx - 265, 10, -20);

        // ---- ADDITIONAL TOWN BUILDINGS ----
        // Pub / hotel on corner
        makeMesh(new THREE.BoxGeometry(16, 16, 14), 0x8B4513, cx - 20, 8, -55);
        // Post office
        makeMesh(new THREE.BoxGeometry(12, 12, 10), 0xF5DEB3, cx + 5, 6, -20);
        // Bank building
        makeMesh(new THREE.BoxGeometry(18, 14, 12), 0xD2B48C, cx + 90, 7, -65);
        // Bank columns
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 12, 8), 0xC8A882, cx + 84, 6, -60);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 12, 8), 0xC8A882, cx + 90, 6, -60);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.9, 12, 8), 0xC8A882, cx + 96, 6, -60);

        // ---- STREET LAMPS ----
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), 0x303030, cx + 15, 4, -50);
        makeMesh(new THREE.SphereGeometry(0.8, 6, 6), 0xFFFF99, cx + 15, 8.5, -50);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), 0x303030, cx + 50, 4, -50);
        makeMesh(new THREE.SphereGeometry(0.8, 6, 6), 0xFFFF99, cx + 50, 8.5, -50);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 6), 0x303030, cx - 15, 4, -50);
        makeMesh(new THREE.SphereGeometry(0.8, 6, 6), 0xFFFF99, cx - 15, 8.5, -50);

        // ---- TREES (ConeGeometry canopy + cylinder trunk) ----
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 6), 0x5C3317, cx + 100, 2.5, 30);
        makeMesh(new THREE.ConeGeometry(4, 8, 6), 0x2D6B2D, cx + 100, 9, 30);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 6), 0x5C3317, cx + 115, 2.5, 30);
        makeMesh(new THREE.ConeGeometry(4, 8, 6), 0x2D6B2D, cx + 115, 9, 30);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 6), 0x5C3317, cx - 50, 2.5, 30);
        makeMesh(new THREE.ConeGeometry(4, 8, 6), 0x2D6B2D, cx - 50, 9, 30);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 5, 6), 0x5C3317, cx - 150, 2.5, -20);
        makeMesh(new THREE.ConeGeometry(4, 8, 6), 0x228B22, cx - 150, 9, -20);

        // ---- ROAD SURFACES ----
        // Main Street road
        makeMesh(new THREE.BoxGeometry(180, 0.3, 20), 0x555555, cx + 50, 0.15, -70);
        // Church road
        makeMesh(new THREE.BoxGeometry(12, 0.3, 60), 0x555555, cx - 30, 0.15, 25);
        // Station road
        makeMesh(new THREE.BoxGeometry(80, 0.3, 12), 0x555555, cx + 140, 0.15, -30);
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
