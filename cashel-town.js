window.CashelTown = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18200;
    var OY = 0;
    var OZ = 0;

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
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildMainStreet();
        buildHoreAbbey();
        buildCashelPalaceHotel();
        buildHeritageCenter();
        buildTownWalls();
        buildMarketCross();
        buildGAAPitch();
        buildCashelSchool();
        buildPubsAndBeds();
        buildSaintsRoad();
        buildAmbientDetails();
    }

    function buildGround() {
        // Ground plane using flat boxes
        makeBox(300, 0.5, 200, 0x4a7c3f, 0, -0.25, 0);
        // Road surface — Main Street running along Z axis
        makeBox(12, 0.6, 280, 0x555555, 0, -0.2, 0);
        // Pavements either side
        makeBox(4, 0.7, 280, 0x999988, -8, -0.15, 0);
        makeBox(4, 0.7, 280, 0x999988, 8, -0.15, 0);
    }

    function buildMainStreet() {
        // --- WEST SIDE shopfronts (negative X) ---
        // Shop 1: red Georgian 3-story
        makeBox(10, 12, 8, 0xCD5C5C, -18, 6, -80);
        makeBox(9, 0.6, 7.5, 0x8B0000, -18, 12.3, -80);  // sign board fascia
        makeBox(9, 1.2, 0.3, 0xFFD700, -18, 4.0, -76.0); // shopfront surround bottom
        makeBox(9, 3.5, 0.4, 0xCC4444, -18, 2.5, -76.0); // ground floor shop box

        // Shop 2: cream 4-story
        makeBox(10, 15, 8, 0xFFFACD, -18, 7.5, -68);
        makeBox(9, 0.6, 7.5, 0xDDCCA0, -18, 15.3, -68);
        makeBox(9, 3.5, 0.4, 0x228B22, -18, 2.5, -64.0); // green shopfront

        // Shop 3: blue 3-story
        makeBox(10, 12, 8, 0x4169E1, -18, 6, -56);
        makeBox(9, 0.6, 7.5, 0x27408B, -18, 12.3, -56);
        makeBox(9, 3.5, 0.4, 0x1E90FF, -18, 2.5, -52.0);

        // Shop 4: yellow 3-story
        makeBox(10, 12, 8, 0xDAA520, -18, 6, -44);
        makeBox(9, 0.6, 7.5, 0xB8860B, -18, 12.3, -44);
        makeBox(9, 3.5, 0.4, 0xFFD700, -18, 2.5, -40.0);

        // Shop 5: green 4-story
        makeBox(10, 15, 8, 0x2E8B57, -18, 7.5, -32);
        makeBox(9, 0.6, 7.5, 0x1B5E30, -18, 15.3, -32);
        makeBox(9, 3.5, 0.4, 0x006400, -18, 2.5, -28.0);

        // Shop 6: red brick 3-story
        makeBox(10, 12, 8, 0xCD5C5C, -18, 6, -20);
        makeBox(9, 0.6, 7.5, 0x8B0000, -18, 12.3, -20);

        // Shop 7: cream 3-story
        makeBox(10, 12, 8, 0xFFF8DC, -18, 6, -8);
        makeBox(9, 3.5, 0.4, 0x8B4513, -18, 2.5, -4.0);

        // Shop 8: blue
        makeBox(10, 12, 8, 0x1E3A5F, -18, 6, 4);

        // Shop 9: yellow ochre
        makeBox(10, 15, 8, 0xC8A020, -18, 7.5, 16);
        makeBox(9, 0.6, 7.5, 0xA07010, -18, 15.3, 16);

        // Shop 10: terracotta
        makeBox(10, 12, 8, 0xCC6633, -18, 6, 28);
        makeBox(9, 3.5, 0.4, 0xAA4422, -18, 2.5, 32.0);

        // Shop 11: pale green
        makeBox(10, 12, 8, 0x90C090, -18, 6, 40);
        makeBox(9, 3.5, 0.4, 0x507050, -18, 2.5, 44.0);

        // Shop 12: mustard
        makeBox(10, 12, 8, 0xC8A000, -18, 6, 52);

        // --- EAST SIDE shopfronts (positive X) ---
        // Shop E1: salmon
        makeBox(10, 12, 8, 0xFA8072, 18, 6, -75);
        makeBox(9, 0.6, 7.5, 0xC05040, 18, 12.3, -75);
        makeBox(9, 3.5, 0.4, 0xFF6347, 18, 2.5, -71.0);

        // Shop E2: cream 4-story
        makeBox(10, 15, 8, 0xFFFACD, 18, 7.5, -63);
        makeBox(9, 0.6, 7.5, 0xDDCCA0, 18, 15.3, -63);

        // Shop E3: green 3-story
        makeBox(10, 12, 8, 0x3CB371, 18, 6, -51);
        makeBox(9, 3.5, 0.4, 0x228B22, 18, 2.5, -47.0);

        // Shop E4: blue slate 3-story
        makeBox(10, 12, 8, 0x4682B4, 18, 6, -39);
        makeBox(9, 3.5, 0.4, 0x2050A0, 18, 2.5, -35.0);

        // Shop E5: white render
        makeBox(10, 12, 8, 0xF0F0F0, 18, 6, -27);

        // Shop E6: red brick
        makeBox(10, 12, 8, 0xCD5C5C, 18, 6, -15);
        makeBox(9, 3.5, 0.4, 0x8B0000, 18, 2.5, -11.0);

        // Shop E7: ochre
        makeBox(10, 15, 8, 0xDAA520, 18, 7.5, -3);
        makeBox(9, 0.6, 7.5, 0xB8860B, 18, 15.3, -3);

        // Shop E8: forest green
        makeBox(10, 12, 8, 0x228B22, 18, 6, 9);

        // Shop E9: pink render
        makeBox(10, 12, 8, 0xFFB6C1, 18, 6, 21);

        // Shop E10: dark red
        makeBox(10, 12, 8, 0x8B0000, 18, 6, 33);
        makeBox(9, 3.5, 0.4, 0x660000, 18, 2.5, 37.0);

        // Georgian corner building — larger block
        makeBox(18, 16, 12, 0xCD5C5C, -22, 8, -92);
        makeBox(17, 0.8, 11, 0x8B0000, -22, 16.4, -92);
        // Chimney stacks
        makeBox(1.5, 4, 1.5, 0x8B4513, -24, 19, -92);
        makeBox(1.5, 4, 1.5, 0x8B4513, -20, 19, -92);
    }

    function buildHoreAbbey() {
        // Hore Abbey — Cistercian monastery ruins, roofless walls
        // Located west-southwest of town
        var abx = -90, abz = 60;

        // Nave — long roofless hall, north and south walls
        makeBox(1.5, 8, 42, 0x808080, abx - 10, 4, abz);       // north nave wall
        makeBox(1.5, 8, 42, 0x7A7A7A, abx + 10, 4, abz);       // south nave wall
        // Nave end walls (partial)
        makeBox(20, 8, 1.5, 0x808080, abx, 4, abz - 21);        // west end wall
        makeBox(20, 4, 1.5, 0x7A7A7A, abx, 2, abz + 21);        // east end partial

        // Crossing tower stumps
        makeBox(5, 12, 1.5, 0x808080, abx, 6, abz - 3);
        makeBox(5, 12, 1.5, 0x808080, abx, 6, abz + 3);
        makeBox(1.5, 12, 5, 0x808080, abx - 2, 6, abz);
        makeBox(1.5, 12, 5, 0x7A7A7A, abx + 2, 6, abz);

        // North transept walls
        makeBox(1.5, 7, 14, 0x808080, abx - 17, 3.5, abz - 2);
        makeBox(14, 7, 1.5, 0x7A7A7A, abx - 10, 3.5, abz - 9);
        makeBox(14, 3, 1.5, 0x808080, abx - 10, 1.5, abz + 5);

        // South transept walls
        makeBox(1.5, 7, 14, 0x808080, abx + 17, 3.5, abz - 2);
        makeBox(14, 7, 1.5, 0x7A7A7A, abx + 10, 3.5, abz - 9);

        // Chapter house — eastern range, rectangular
        makeBox(1.2, 5, 16, 0x808080, abx - 10, 2.5, abz + 32);
        makeBox(1.2, 5, 16, 0x7A7A7A, abx + 10, 2.5, abz + 32);
        makeBox(20, 5, 1.2, 0x808080, abx, 2.5, abz + 24);
        makeBox(20, 2, 1.2, 0x808080, abx, 1, abz + 40);

        // Cloister garth — low wall perimeter
        makeBox(28, 2, 1.0, 0x909090, abx, 1, abz + 8);        // north cloister
        makeBox(28, 2, 1.0, 0x909090, abx, 1, abz + 22);       // south cloister
        makeBox(1.0, 2, 14, 0x909090, abx - 14, 1, abz + 15);  // west cloister
        makeBox(1.0, 2, 14, 0x909090, abx + 14, 1, abz + 15);  // east cloister

        // Collapsed arch remnant
        makeBox(6, 6, 1.5, 0x706060, abx - 5, 3, abz + 18);
        makeBox(1.5, 6, 8, 0x706060, abx + 8, 3, abz + 14);

        // Ground rubble spreads
        makeBox(8, 0.8, 6, 0x888880, abx + 5, 0.4, abz - 5);
        makeBox(5, 0.6, 4, 0x888880, abx - 8, 0.3, abz + 10);
        makeBox(6, 0.7, 5, 0x808080, abx + 3, 0.35, abz + 28);
    }

    function buildCashelPalaceHotel() {
        // Queen Anne red brick 1730, wide grand facade
        var px = 30, pz = -60;

        // Main body — wide three-bay mansion
        makeBox(36, 18, 16, 0xCD5C5C, px, 9, pz);
        // Central projecting bay (slightly forward)
        makeBox(12, 20, 3, 0xC04848, px, 10, pz - 9.5);
        // Roof parapet / balustrade strip
        makeBox(37, 1.5, 1.5, 0xAA3333, px, 18.75, pz - 8);
        // Cornice
        makeBox(38, 0.8, 17, 0xAA3333, px, 18.4, pz);

        // Wings — single-story flanking blocks
        makeBox(10, 8, 14, 0xCD5C5C, px - 23, 4, pz);
        makeBox(10, 8, 14, 0xCD5C5C, px + 23, 4, pz);

        // Grand entrance steps
        makeBox(8, 0.5, 4, 0xD0C0A0, px, 0.25, pz - 10);
        makeBox(7, 0.5, 3, 0xD0C0A0, px, 0.75, pz - 9);
        makeBox(6, 0.5, 2, 0xD0C0A0, px, 1.25, pz - 8);

        // Entrance door surround
        makeBox(3, 6, 0.5, 0xEEDDCC, px, 3, pz - 11);
        // Pilasters either side
        makeBox(0.6, 18, 0.6, 0xDDCCBB, px - 4, 9, pz - 8.5);
        makeBox(0.6, 18, 0.6, 0xDDCCBB, px + 4, 9, pz - 8.5);

        // Chimney stacks
        makeCyl(0.6, 0.6, 4, 8, 0x8B4513, px - 12, 22, pz);
        makeCyl(0.6, 0.6, 4, 8, 0x8B4513, px - 6, 22, pz);
        makeCyl(0.6, 0.6, 4, 8, 0x8B4513, px + 6, 22, pz);
        makeCyl(0.6, 0.6, 4, 8, 0x8B4513, px + 12, 22, pz);

        // Hotel garden wall
        makeBox(40, 2, 1, 0xBBAA99, px, 1, pz + 12);
        makeBox(1, 2, 12, 0xBBAA99, px - 20, 1, pz + 6);
        makeBox(1, 2, 12, 0xBBAA99, px + 20, 1, pz + 6);

        // Garden trees (spheres on cylinders)
        makeCyl(0.4, 0.4, 5, 6, 0x5D4037, px - 15, 2.5, pz + 8);
        makeSphere(2.5, 8, 6, 0x2E7D32, px - 15, 7, pz + 8);
        makeCyl(0.4, 0.4, 5, 6, 0x5D4037, px + 15, 2.5, pz + 8);
        makeSphere(2.5, 8, 6, 0x2E7D32, px + 15, 7, pz + 8);
    }

    function buildHeritageCenter() {
        // Cashel Heritage Centre — limestone Georgian
        var hx = -35, hz = -55;

        // Main building body
        makeBox(22, 12, 14, 0xF5F0E8, hx, 6, hz);
        // Roof cornice
        makeBox(23, 1, 15, 0xE8E0D0, hx, 12.5, hz);
        // Entrance porch
        makeBox(6, 8, 4, 0xEEE8DC, hx, 4, hz - 9);
        // Porch columns
        makeCyl(0.3, 0.3, 8, 8, 0xDDD8CC, hx - 2, 4, hz - 11);
        makeCyl(0.3, 0.3, 8, 8, 0xDDD8CC, hx + 2, 4, hz - 11);
        // Pediment above porch
        makeBox(7, 0.5, 4, 0xEEE8DC, hx, 8.25, hz - 9);
        makeCone(3.5, 2.5, 4, 0xE0D8C8, hx, 9.5, hz - 9);

        // Sign board
        makeBox(10, 1.5, 0.4, 0x4A3020, hx, 6.5, hz - 7.1);

        // Extension wing
        makeBox(10, 9, 10, 0xF0EBE0, hx - 16, 4.5, hz);
        makeBox(11, 0.8, 11, 0xE0DBCE, hx - 16, 9.4, hz);

        // Chimneys
        makeBox(1.2, 3, 1.2, 0xCCC0B0, hx - 8, 14, hz);
        makeBox(1.2, 3, 1.2, 0xCCC0B0, hx + 8, 14, hz);
    }

    function buildTownWalls() {
        // Medieval town wall sections
        var wx = 55, wz = 20;

        // Long wall section running north-south
        makeBox(2, 7, 60, 0x808080, wx, 3.5, wz);
        // Merlons (crenellations) along top — alternating blocks
        makeBox(2, 2, 3, 0x808080, wx, 8, wz - 24);
        makeBox(2, 2, 3, 0x808080, wx, 8, wz - 18);
        makeBox(2, 2, 3, 0x808080, wx, 8, wz - 12);
        makeBox(2, 2, 3, 0x808080, wx, 8, wz - 6);
        makeBox(2, 2, 3, 0x808080, wx, 8, wz);
        makeBox(2, 2, 3, 0x808080, wx, 8, wz + 6);
        makeBox(2, 2, 3, 0x808080, wx, 8, wz + 12);
        makeBox(2, 2, 3, 0x808080, wx, 8, wz + 18);
        makeBox(2, 2, 3, 0x808080, wx, 8, wz + 24);

        // Round tower at corner
        makeCyl(3.5, 3.5, 10, 10, 0x808080, wx, 5, wz + 30);
        makeCone(3.5, 4, 10, 0x707070, wx, 12, wz + 30);

        // Wall fragment going east
        makeBox(20, 6, 2, 0x808080, wx + 11, 3, wz + 30);
        makeBox(2, 2, 2, 0x808080, wx + 8, 7, wz + 30);
        makeBox(2, 2, 2, 0x808080, wx + 14, 7, wz + 30);
        makeBox(2, 2, 2, 0x808080, wx + 20, 7, wz + 30);

        // Collapsed section — low rubble
        makeBox(12, 2, 2, 0x888888, wx, 1, wz - 32);
        makeBox(8, 1, 2, 0x777777, wx, 0.5, wz - 42);
    }

    function buildMarketCross() {
        // Market cross / high cross on plinth in town square
        var cx = 0, cz = -5;

        // Square plinth base
        makeBox(3, 1, 3, 0x808080, cx, 0.5, cz);
        makeBox(2, 0.8, 2, 0x808080, cx, 1.4, cz);
        // Shaft
        makeBox(0.5, 4, 0.5, 0x808080, cx, 4, cz);
        // Cross arms
        makeBox(3, 0.5, 0.5, 0x808080, cx, 5.5, cz);
        // Ring (approximated as a box halo)
        makeBox(2, 2, 0.2, 0x707070, cx, 5.5, cz);
        // Capstone
        makeCone(0.5, 1, 6, 0x707070, cx, 8, cz);

        // Plinth inscriptions panel
        makeBox(2.8, 0.8, 0.15, 0x909090, cx, 0.9, cz - 1.5);
    }

    function buildGAAPitch() {
        // GAA Gaelic football / hurling pitch
        var gx = 80, gz = 60;

        // Pitch surface
        makeBox(80, 0.4, 140, 0x228B22, gx, 0.2, gz);
        // White line markings
        makeBox(80, 0.05, 0.3, 0xFFFFFF, gx, 0.45, gz - 60);   // end line
        makeBox(80, 0.05, 0.3, 0xFFFFFF, gx, 0.45, gz + 60);   // end line
        makeBox(80, 0.05, 0.3, 0xFFFFFF, gx, 0.45, gz);         // centre line
        makeBox(0.3, 0.05, 140, 0xFFFFFF, gx - 40, 0.45, gz);  // sideline
        makeBox(0.3, 0.05, 140, 0xFFFFFF, gx + 40, 0.45, gz);  // sideline

        // North goalposts
        makeBox(0.3, 8, 0.3, 0xFFFFFF, gx - 3.5, 4, gz - 62);
        makeBox(0.3, 8, 0.3, 0xFFFFFF, gx + 3.5, 4, gz - 62);
        makeBox(7.3, 0.3, 0.3, 0xFFFFFF, gx, 6, gz - 62);       // crossbar
        makeBox(0.3, 10, 0.3, 0xFFFFFF, gx - 3.5, 11, gz - 62); // uprights
        makeBox(0.3, 10, 0.3, 0xFFFFFF, gx + 3.5, 11, gz - 62);

        // South goalposts
        makeBox(0.3, 8, 0.3, 0xFFFFFF, gx - 3.5, 4, gz + 62);
        makeBox(0.3, 8, 0.3, 0xFFFFFF, gx + 3.5, 4, gz + 62);
        makeBox(7.3, 0.3, 0.3, 0xFFFFFF, gx, 6, gz + 62);
        makeBox(0.3, 10, 0.3, 0xFFFFFF, gx - 3.5, 11, gz + 62);
        makeBox(0.3, 10, 0.3, 0xFFFFFF, gx + 3.5, 11, gz + 62);

        // Terrace stand — east side
        makeBox(80, 4, 6, 0xBBBBBB, gx, 2, gz + 46);
        makeBox(80, 0.4, 0.3, 0x888888, gx, 3.2, gz + 44);
        makeBox(80, 0.4, 0.3, 0x888888, gx, 4.4, gz + 43);

        // Club house
        makeBox(16, 6, 8, 0xCCCCCC, gx - 48, 3, gz);
        makeBox(16, 0.5, 8, 0xAAAAAA, gx - 48, 6.25, gz);
    }

    function buildCashelSchool() {
        // Cashel Community School — modern flat-roof blocks
        var sx = 70, sz = -60;

        // Main block
        makeBox(40, 8, 18, 0xE0E0E0, sx, 4, sz);
        makeBox(41, 0.6, 19, 0xCCCCCC, sx, 8.3, sz);
        // Entrance canopy
        makeBox(12, 3, 4, 0xDDDDDD, sx, 5.5, sz - 11);
        makeBox(0.3, 5, 0.3, 0xAAAAAA, sx - 5, 2.5, sz - 13);
        makeBox(0.3, 5, 0.3, 0xAAAAAA, sx + 5, 2.5, sz - 13);

        // Science block — perpendicular wing
        makeBox(14, 7, 24, 0xD8D8D8, sx + 27, 3.5, sz - 5);
        makeBox(14, 0.5, 24, 0xC8C8C8, sx + 27, 7.25, sz - 5);

        // Sports hall
        makeBox(22, 10, 20, 0xDEDEDE, sx - 31, 5, sz - 4);
        makeBox(23, 0.6, 21, 0xCCCCCC, sx - 31, 10.3, sz - 4);

        // Car park
        makeBox(36, 0.4, 20, 0x666666, sx, 0.2, sz + 18);

        // Fence
        makeBox(0.2, 2, 80, 0xAAAAAA, sx - 22, 1, sz + 10);
        makeBox(0.2, 2, 80, 0xAAAAAA, sx + 22, 1, sz + 10);
    }

    function buildPubsAndBeds() {
        // Pubs — dark red / dark green painted
        // O'Brien's Pub
        makeBox(9, 10, 7, 0x8B0000, -18, 5, 64);
        makeBox(8.5, 0.5, 6.5, 0x660000, -18, 10.25, 64);
        makeBox(8, 2.5, 0.4, 0x8B0000, -18, 2.5, 67.8);
        makeBox(7, 1.0, 0.3, 0xFFD700, -18, 5.8, 67.9); // hanging sign bar
        makeBox(2, 1.5, 0.15, 0xFFD700, -18, 5.0, 68.1);  // hanging sign board

        // The Rathcool Inn (green)
        makeBox(10, 11, 7, 0x006400, 18, 5.5, 56);
        makeBox(9, 0.5, 6.5, 0x004000, 18, 11.25, 56);
        makeBox(9, 3.0, 0.4, 0x005000, 18, 2.5, 59.8);
        makeBox(7, 1.0, 0.3, 0xCCCC00, 18, 6.5, 60.0);
        makeBox(2, 1.5, 0.15, 0xCCCC00, 18, 5.7, 60.2);

        // Brú Ború B&B
        makeBox(11, 9, 8, 0xFFF8DC, -18, 4.5, 76);
        makeBox(10, 0.5, 7.5, 0xDDD8CC, -18, 9.25, 76);
        makeBox(8, 1.0, 0.3, 0x4A3020, -18, 7.0, 80.1);

        // Cashel Lodge B&B
        makeBox(10, 9, 8, 0xF0EBE0, 18, 4.5, 70);
        makeBox(10, 0.5, 8, 0xDED9CE, 18, 9.25, 70);
        makeBox(8, 1.0, 0.3, 0x4A3020, 18, 7.0, 74.1);
    }

    function buildSaintsRoad() {
        // Bothar na Naomh — Saints' Road leading toward Rock
        // Path surface going north-northeast (approximated as angled boxes)
        makeBox(4, 0.3, 60, 0x8B7355, -50, 0.15, -20);
        makeBox(4, 0.3, 40, 0x8B7355, -70, 0.15, -55);
        makeBox(4, 0.3, 30, 0x8B7355, -85, 0.15, -80);

        // Pilgrim waymarker stones along path
        makeBox(0.5, 1.5, 0.5, 0x808080, -48, 0.75, -10);
        makeBox(0.5, 1.5, 0.5, 0x808080, -52, 0.75, -25);
        makeBox(0.5, 1.5, 0.5, 0x808080, -65, 0.75, -45);
        makeBox(0.5, 1.5, 0.5, 0x808080, -72, 0.75, -60);
        makeBox(0.5, 1.5, 0.5, 0x808080, -84, 0.75, -75);

        // Hedgerows either side of path
        makeBox(1, 2.5, 55, 0x2D5A1B, -47, 1.25, -20);
        makeBox(1, 2.5, 55, 0x2D5A1B, -53, 1.25, -20);
        makeBox(1, 2, 35, 0x2D5A1B, -67, 1.0, -55);
        makeBox(1, 2, 35, 0x2D5A1B, -73, 1.0, -55);

        // Small oratory ruin at roadside
        makeBox(6, 5, 5, 0x909090, -60, 2.5, -35);
        makeBox(5.5, 1.5, 4.5, 0x808080, -60, 5.75, -35);
        makeBox(0.8, 5, 5, 0x888888, -63.2, 2.5, -35);
        makeBox(0.8, 5, 5, 0x888888, -56.8, 2.5, -35);
    }

    function buildAmbientDetails() {
        // Street trees along Main Street
        makeCyl(0.3, 0.4, 5, 6, 0x5D4037, -12, 2.5, -50);
        makeSphere(2, 8, 6, 0x2E7D32, -12, 7, -50);
        makeCyl(0.3, 0.4, 5, 6, 0x5D4037, 12, 2.5, -30);
        makeSphere(2, 8, 6, 0x33691E, 12, 7, -30);
        makeCyl(0.3, 0.4, 5, 6, 0x5D4037, -12, 2.5, 10);
        makeSphere(2, 8, 6, 0x388E3C, -12, 7, 10);
        makeCyl(0.3, 0.4, 5, 6, 0x5D4037, 12, 2.5, 40);
        makeSphere(2, 8, 6, 0x2E7D32, 12, 7, 40);

        // Town square — central open space
        makeBox(20, 0.3, 20, 0xBBAA88, 0, 0.15, 0);

        // Bench (simple box)
        makeBox(3, 0.4, 0.8, 0x8B4513, 5, 0.5, -2);
        makeBox(3, 0.4, 0.8, 0x8B4513, -5, 0.5, -2);

        // Post box
        makeCyl(0.4, 0.4, 1.2, 8, 0xCC0000, 7, 0.6, -8);
        makeCyl(0.5, 0.5, 0.2, 8, 0x880000, 7, 1.3, -8);

        // Phone box (green Irish one)
        makeBox(1.2, 2.8, 1.2, 0x006400, -6, 1.4, 6);
        makeBox(1.2, 0.3, 1.2, 0x004000, -6, 2.95, 6);

        // Lamp posts along street
        makeCyl(0.15, 0.15, 6, 6, 0x333333, -10, 3, -60);
        makeCyl(0.08, 0.08, 0.8, 6, 0x333333, -10, 6.4, -60);
        makeSphere(0.25, 6, 4, 0xFFFF88, -10, 6.5, -60);

        makeCyl(0.15, 0.15, 6, 6, 0x333333, 10, 3, -40);
        makeCyl(0.08, 0.08, 0.8, 6, 0x333333, 10, 6.4, -40);
        makeSphere(0.25, 6, 4, 0xFFFF88, 10, 6.5, -40);

        makeCyl(0.15, 0.15, 6, 6, 0x333333, -10, 3, 20);
        makeSphere(0.25, 6, 4, 0xFFFF88, -10, 6.5, 20);

        makeCyl(0.15, 0.15, 6, 6, 0x333333, 10, 3, 48);
        makeSphere(0.25, 6, 4, 0xFFFF88, 10, 6.5, 48);

        // Cashel tourist signpost
        makeBox(0.2, 4, 0.2, 0x1B4F72, 2, 2, -12);
        makeBox(3, 0.6, 0.15, 0x1B4F72, 3.5, 3.8, -12);
        makeBox(3, 0.6, 0.15, 0x1B4F72, 3.5, 3.0, -12);

        // Dry stone field walls (peripheral)
        makeBox(1, 1.5, 60, 0x909090, -110, 0.75, 0);
        makeBox(60, 1.5, 1, 0x909090, -80, 0.75, 30);
        makeBox(60, 1.5, 1, 0x909090, -80, 0.75, -30);

        // Ruined farmhouse at edge of town
        makeBox(8, 4, 6, 0x8B7355, -95, 2, -10);
        makeBox(8.2, 0.5, 6.2, 0x7A6344, -95, 4.25, -10);
        makeBox(0.7, 4, 6, 0x8B7355, -99.7, 2, -10);
        makeBox(0.7, 4, 6, 0x8B7355, -90.3, 2, -10);
        makeBox(8, 4, 0.7, 0x8B7355, -95, 2, -13.7);

        // Rock of Cashel silhouette (distant, on the hill, to the north)
        makeBox(30, 25, 8, 0x707070, -5, 12.5, -200);
        makeCyl(4, 4, 28, 10, 0x6A6A6A, -18, 14, -198);
        makeCone(4.5, 5, 10, 0x606060, -18, 30, -198);
        makeBox(12, 20, 6, 0x686868, 8, 10, -200);
        makeBox(20, 10, 6, 0x6E6E6E, -2, 5, -200);
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
