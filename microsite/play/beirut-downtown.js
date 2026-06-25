window.BeirutDowntown = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 24080;

        // ============================================================
        // GROUND PLANE (built from boxes — PlaneGeometry is forbidden)
        // ============================================================
        // City ground slab
        makebox(600, 1, 600, 0xB0A898, cx, -0.5, 0);

        // ============================================================
        // MEDITERRANEAN SEA — blue-green water surface + depth
        // ============================================================
        makebox(600, 2, 200, 0x1A5A8A, cx, -1, -280);
        makebox(600, 4, 20, 0x1A5A8A, cx, -2, -200);
        // Shallow coastal shelf
        makebox(600, 1, 30, 0x1E6A9A, cx, -0.8, -185);

        // ============================================================
        // BEIRUT CORNICHE — coastal promenade
        // ============================================================
        // Promenade surface
        makebox(600, 0.5, 18, 0x8A9090, cx, 0, -175);
        // Railing posts along corniche
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx - 280, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx - 230, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx - 180, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx - 130, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx - 80, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx - 30, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx + 30, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx + 80, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx + 130, 0.6, -175);
        makecyl(0.15, 0.15, 1.2, 6, 0x555555, cx + 180, 0.6, -175);
        // Palm trees along corniche
        makecyl(0.4, 0.5, 8, 8, 0x7A5C30, cx - 250, 4, -168);
        makecone(3, 4, 8, 0x2D5A1E, cx - 250, 10, -168);
        makecyl(0.4, 0.5, 8, 8, 0x7A5C30, cx - 150, 4, -168);
        makecone(3, 4, 8, 0x2D5A1E, cx - 150, 10, -168);
        makecyl(0.4, 0.5, 8, 8, 0x7A5C30, cx - 50, 4, -168);
        makecone(3, 4, 8, 0x2D5A1E, cx - 50, 10, -168);
        makecyl(0.4, 0.5, 8, 8, 0x7A5C30, cx + 50, 4, -168);
        makecone(3, 4, 8, 0x2D5A1E, cx + 50, 10, -168);
        makecyl(0.4, 0.5, 8, 8, 0x7A5C30, cx + 150, 4, -168);
        makecone(3, 4, 8, 0x2D5A1E, cx + 150, 10, -168);
        makecyl(0.4, 0.5, 8, 8, 0x7A5C30, cx + 250, 4, -168);
        makecone(3, 4, 8, 0x2D5A1E, cx + 250, 10, -168);

        // ============================================================
        // FISHING BOATS at the corniche
        // ============================================================
        makebox(6, 1.2, 2.5, 0xAA6633, cx - 200, -0.2, -210);
        makebox(5, 1.0, 2.0, 0x9955AA, cx - 180, -0.2, -215);
        makecyl(0.15, 0.15, 5, 6, 0x886644, cx - 200, 2.5, -210);

        // ============================================================
        // PIGEON ROCKS (RAOUCHE) — two massive sea stack arches
        // ============================================================
        // Left sea stack — main body
        makebox(18, 45, 14, 0x888888, cx - 180, 22, -240);
        // Left arch left pillar
        makebox(5, 30, 6, 0x888888, cx - 192, 15, -245);
        // Left arch right pillar
        makebox(5, 30, 6, 0x888888, cx - 168, 15, -245);
        // Left arch top bridge
        makebox(24, 5, 6, 0x888888, cx - 180, 30, -245);
        // Left rock top cap — irregular
        makebox(20, 8, 16, 0x7A7A7A, cx - 180, 47, -240);
        makecyl(6, 8, 6, 8, 0x888888, cx - 180, 52, -240);

        // Right sea stack — larger
        makebox(22, 52, 18, 0x888888, cx - 120, 26, -245);
        // Right arch opening
        makebox(6, 22, 7, 0x888888, cx - 132, 11, -250);
        makebox(6, 22, 7, 0x888888, cx - 108, 11, -250);
        makebox(26, 5, 7, 0x888888, cx - 120, 22, -250);
        // Right rock craggy top
        makecyl(7, 10, 10, 7, 0x888888, cx - 120, 57, -245);
        makecone(5, 6, 7, 0x7A7A7A, cx - 120, 63, -245);

        // Rocky coastline rubble
        makebox(12, 3, 8, 0x888888, cx - 155, 1, -215);
        makebox(8, 2, 5, 0x888888, cx - 145, 0.8, -220);
        makebox(10, 4, 7, 0x888888, cx - 200, 1.5, -205);

        // ============================================================
        // MOHAMED AL-AMIN MOSQUE (Blue Mosque) — Ottoman style
        // ============================================================
        var mox = cx + 50;
        var moz = 40;
        // Main travertine marble base platform
        makebox(70, 3, 70, 0xE8E0D0, mox, 1.5, moz);
        // Main mosque body
        makebox(50, 22, 50, 0xE0D8C8, mox, 12, moz);
        // Upper mosque drum for dome
        makecyl(14, 14, 6, 12, 0xD8D0C0, mox, 25, moz);
        // CENTRAL BLUE DOME — the iconic feature
        makesphere(14, 16, 12, 0x4466AA, mox, 34, moz);
        // Dome highlight band
        makecyl(14.2, 14.2, 2, 12, 0x3355AA, mox, 26, moz);
        // Secondary half-domes (Ottoman style)
        makesphere(7, 12, 10, 0x4466AA, mox + 18, 22, moz);
        makesphere(7, 12, 10, 0x4466AA, mox - 18, 22, moz);
        makesphere(7, 12, 10, 0x4466AA, mox, 22, moz + 18);
        makesphere(7, 12, 10, 0x4466AA, mox, 22, moz - 18);
        // Mosque facade arched entrance
        makebox(10, 14, 2, 0xD4C8B0, mox, 9, moz - 26);
        makecyl(5, 5, 2, 12, 0xD4C8B0, mox, 16, moz - 26);
        // Side arcade arches (left)
        makebox(8, 8, 2, 0xD8D0C0, mox - 18, 6, moz - 26);
        makebox(8, 8, 2, 0xD8D0C0, mox + 18, 6, moz - 26);
        // 4 MINARETS — one at each corner
        // Minaret 1 — NW
        makecyl(1.8, 2.0, 38, 8, 0xE0D8C8, mox - 28, 19, moz - 28);
        makecyl(2.5, 2.5, 2, 8, 0xD0C8B8, mox - 28, 38, moz - 28);
        makecyl(1.0, 1.0, 3, 8, 0xDDD5C5, mox - 28, 40, moz - 28);
        makecone(1.2, 5, 8, 0x4466AA, mox - 28, 43.5, moz - 28);
        // Minaret 2 — NE
        makecyl(1.8, 2.0, 38, 8, 0xE0D8C8, mox + 28, 19, moz - 28);
        makecyl(2.5, 2.5, 2, 8, 0xD0C8B8, mox + 28, 38, moz - 28);
        makecyl(1.0, 1.0, 3, 8, 0xDDD5C5, mox + 28, 40, moz - 28);
        makecone(1.2, 5, 8, 0x4466AA, mox + 28, 43.5, moz - 28);
        // Minaret 3 — SW
        makecyl(1.8, 2.0, 38, 8, 0xE0D8C8, mox - 28, 19, moz + 28);
        makecyl(2.5, 2.5, 2, 8, 0xD0C8B8, mox - 28, 38, moz + 28);
        makecyl(1.0, 1.0, 3, 8, 0xDDD5C5, mox - 28, 40, moz + 28);
        makecone(1.2, 5, 8, 0x4466AA, mox - 28, 43.5, moz + 28);
        // Minaret 4 — SE
        makecyl(1.8, 2.0, 38, 8, 0xE0D8C8, mox + 28, 19, moz + 28);
        makecyl(2.5, 2.5, 2, 8, 0xD0C8B8, mox + 28, 38, moz + 28);
        makecyl(1.0, 1.0, 3, 8, 0xDDD5C5, mox + 28, 40, moz + 28);
        makecone(1.2, 5, 8, 0x4466AA, mox + 28, 43.5, moz + 28);

        // ============================================================
        // MARTYRS' SQUARE — central public square
        // ============================================================
        var sqx = cx;
        var sqz = -20;
        // Square paving
        makebox(100, 0.3, 80, 0xD4C8C0, sqx, 0.15, sqz);
        // Martyrs' Statue — central monument riddled with civil war bullet holes
        // Base pedestal
        makebox(6, 4, 6, 0xB0A090, sqx, 2, sqz);
        // Statue column
        makecyl(1.5, 1.8, 8, 8, 0xA89888, sqx, 8, sqz);
        // Figure torso
        makebox(2.5, 4, 1.5, 0xA89888, sqx, 13.5, sqz);
        // Bullet-hole scarred head (sphere)
        makesphere(1.2, 8, 6, 0xA09080, sqx, 16, sqz);
        // Outstretched arm (the statue's famous gesture)
        makebox(5, 0.8, 0.8, 0xA89888, sqx - 2, 13, sqz);
        // Square benches
        makebox(8, 0.8, 1.5, 0xC8B898, sqx - 30, 0.4, sqz - 20);
        makebox(8, 0.8, 1.5, 0xC8B898, sqx + 30, 0.4, sqz - 20);
        makebox(8, 0.8, 1.5, 0xC8B898, sqx - 30, 0.4, sqz + 20);
        makebox(8, 0.8, 1.5, 0xC8B898, sqx + 30, 0.4, sqz + 20);
        // Renovated modern buildings flanking the square (east side)
        makebox(28, 30, 18, 0xCCBFB0, sqx + 65, 15, sqz - 15);
        makebox(22, 36, 16, 0xC0B8A8, sqx + 65, 18, sqz + 20);
        // Renovated buildings (west side)
        makebox(26, 28, 18, 0xD0C8B8, sqx - 65, 14, sqz - 15);
        makebox(24, 32, 16, 0xC8C0B0, sqx - 65, 16, sqz + 18);

        // ============================================================
        // SAINT GEORGE CATHEDRAL — Greek Orthodox / Maronite
        // ============================================================
        var sgx = cx - 60;
        var sgz = 20;
        // Cathedral body
        makebox(28, 20, 40, 0xD4C8A0, sgx, 10, sgz);
        // Bell tower left
        makebox(7, 30, 7, 0xD0C4A0, sgx - 14, 15, sgz - 15);
        makecone(4, 8, 8, 0xB89060, sgx - 14, 31, sgz - 15);
        // Bell tower right
        makebox(7, 30, 7, 0xD0C4A0, sgx + 14, 15, sgz - 15);
        makecone(4, 8, 8, 0xB89060, sgx + 14, 31, sgz - 15);
        // Central apse dome
        makesphere(7, 10, 8, 0xC4B890, sgx, 22, sgz + 15);
        // Ornate facade details
        makebox(14, 10, 2, 0xDDD0A8, sgx, 10, sgz - 21);
        makecyl(1.5, 1.5, 10, 8, 0xC8BC98, sgx - 8, 5, sgz - 21);
        makecyl(1.5, 1.5, 10, 8, 0xC8BC98, sgx + 8, 5, sgz - 21);
        makecyl(1.5, 1.5, 10, 8, 0xC8BC98, sgx, 5, sgz - 21);

        // ============================================================
        // ROMAN HIPPODROME RUINS — ancient site in city centre
        // ============================================================
        var rhx = cx - 30;
        var rhz = 80;
        // Roman column ruins — exposed ancient columns
        makecyl(1.2, 1.4, 10, 10, 0xD4A870, rhx - 20, 5, rhz);
        makecyl(1.2, 1.4, 7, 10, 0xD4A870, rhx - 10, 3.5, rhz);
        makecyl(1.2, 1.4, 12, 10, 0xD4A870, rhx, 6, rhz);
        makecyl(1.2, 1.4, 9, 10, 0xD4A870, rhx + 10, 4.5, rhz);
        makecyl(1.2, 1.4, 11, 10, 0xD4A870, rhx + 20, 5.5, rhz);
        // Column capitals
        makebox(3, 1.5, 3, 0xCC9E60, rhx - 20, 10.7, rhz);
        makebox(3, 1.5, 3, 0xCC9E60, rhx, 12.7, rhz);
        makebox(3, 1.5, 3, 0xCC9E60, rhx + 20, 11.7, rhz);
        // Mosaic floor remnants
        makebox(50, 0.3, 30, 0xD4A870, rhx, 0.15, rhz + 10);
        makebox(16, 0.4, 16, 0xC8904A, rhx - 10, 0.2, rhz + 8);
        makebox(10, 0.4, 10, 0xC89050, rhx + 12, 0.2, rhz + 15);
        // Partial remaining wall
        makebox(30, 6, 2, 0xCC9E60, rhx, 3, rhz + 22);
        makebox(2, 8, 20, 0xCC9E60, rhx - 16, 4, rhz + 12);

        // ============================================================
        // BEIRUT SOUKS — reconstructed traditional market
        // ============================================================
        var bsx = cx + 30;
        var bsz = 100;
        // Main souk building modern complex
        makebox(60, 14, 40, 0xD4C8B0, bsx, 7, bsz);
        // Souk arcade roof — series of vaulted sections (boxes + cylinders)
        makecyl(6, 6, 60, 10, 0xDDD0BA, bsx, 15, bsz);
        // Side wings
        makebox(20, 10, 20, 0xCCC0A8, bsx - 38, 5, bsz);
        makebox(20, 10, 20, 0xCCC0A8, bsx + 38, 5, bsz);
        // Interior light well (decorative box top)
        makebox(18, 4, 18, 0xE0D4BC, bsx, 16, bsz);
        // Market stalls outside
        makebox(6, 3, 4, 0xBBAA90, bsx - 15, 1.5, bsz - 22);
        makebox(6, 3, 4, 0xBBAA90, bsx - 5, 1.5, bsz - 22);
        makebox(6, 3, 4, 0xBBAA90, bsx + 5, 1.5, bsz - 22);
        makebox(6, 3, 4, 0xBBAA90, bsx + 15, 1.5, bsz - 22);
        // Awning top strips
        makebox(6, 0.3, 4, 0xCC4444, bsx - 15, 3, bsz - 22);
        makebox(6, 0.3, 4, 0xCCAA00, bsx - 5, 3, bsz - 22);
        makebox(6, 0.3, 4, 0xCC4444, bsx + 5, 3, bsz - 22);
        makebox(6, 0.3, 4, 0x44CC66, bsx + 15, 3, bsz - 22);

        // ============================================================
        // PORT OF BEIRUT — industrial port and grain silos
        // ============================================================
        var pox = cx + 150;
        var poz = -120;
        // Port quay / dock surface
        makebox(120, 2, 60, 0x888899, pox, 0, poz);
        // GRAIN SILOS — iconic cylindrical structures, damaged 2020 explosion
        // Main silo cluster — tall cylinders, partially collapsed/damaged tops
        makecyl(5, 5, 50, 10, 0x999AAA, pox - 30, 25, poz - 10);
        makecyl(5, 5, 50, 10, 0x999AAA, pox - 20, 25, poz - 10);
        makecyl(5, 5, 50, 10, 0x9A9BAB, pox - 10, 25, poz - 10);
        makecyl(5, 5, 45, 10, 0x999AAA, pox, 22.5, poz - 10);
        makecyl(5, 5, 42, 10, 0x888899, pox + 10, 21, poz - 10);
        // Silo damage — slumped top section
        makecyl(6, 5, 8, 8, 0x777788, pox - 10, 47, poz - 10);
        makebox(10, 6, 10, 0x888890, pox - 10, 50, poz - 10);
        // Port cranes
        // Crane 1 base
        makecyl(2, 2.5, 20, 8, 0xCC7700, pox + 35, 10, poz - 5);
        // Crane 1 arm horizontal
        makebox(30, 2, 2, 0xCC7700, pox + 20, 21, poz - 5);
        // Crane 2 base
        makecyl(2, 2.5, 24, 8, 0xCC7700, pox + 50, 12, poz - 5);
        makebox(30, 2, 2, 0xCC7700, pox + 35, 24, poz - 5);
        // Container stacks on dock
        makebox(8, 3, 4, 0xCC3333, pox + 20, 1.5, poz + 15);
        makebox(8, 3, 4, 0x3333CC, pox + 29, 1.5, poz + 15);
        makebox(8, 3, 4, 0x33CC33, pox + 38, 1.5, poz + 15);
        makebox(8, 3, 4, 0xCCCC33, pox + 20, 4.5, poz + 15);
        makebox(8, 3, 4, 0xCC3333, pox + 29, 4.5, poz + 15);
        // Container ship hull
        makebox(80, 10, 18, 0x555566, pox + 10, -4, poz - 30);
        // Ship superstructure
        makebox(16, 14, 14, 0xAAAAAA, pox + 40, 9, poz - 30);
        // Ship funnel/smokestack
        makecyl(2, 2.5, 8, 8, 0x333344, pox + 40, 18, poz - 30);

        // ============================================================
        // HAMRA STREET — Art Deco + modern commercial district
        // ============================================================
        var hax = cx - 120;
        var haz = 60;
        // Art Deco building 1
        makebox(20, 28, 18, 0xC8C0B0, hax, 14, haz);
        // Art Deco stepped top
        makebox(14, 4, 12, 0xBEB6A6, hax, 30, haz);
        makebox(8, 4, 6, 0xB4AC9C, hax, 34, haz);
        // Art Deco building 2
        makebox(22, 22, 20, 0xCCC4B4, hax - 30, 11, haz);
        makebox(10, 6, 10, 0xC0B8A8, hax - 30, 25, haz);
        // Modern building 1
        makebox(18, 40, 16, 0xBBBBAA, hax + 30, 20, haz);
        // Glass curtain wall suggestion — lighter color strip
        makebox(16, 38, 1, 0xCCCCBB, hax + 30, 20, haz - 8.5);
        // Modern building 2
        makebox(20, 35, 18, 0xAAAAAA, hax - 60, 17.5, haz);
        // Street level shops
        makebox(80, 4, 3, 0xBBB0A0, hax - 15, 2, haz - 12);
        // Road surface along Hamra
        makebox(120, 0.2, 14, 0x444440, hax - 15, 0.1, haz - 20);
        // Sidewalk trees
        makecyl(0.3, 0.4, 6, 6, 0x7A5C30, hax - 50, 3, haz - 14);
        makecone(2, 3, 7, 0x2D5A1E, hax - 50, 7.5, haz - 14);
        makecyl(0.3, 0.4, 6, 6, 0x7A5C30, hax - 20, 3, haz - 14);
        makecone(2, 3, 7, 0x2D5A1E, hax - 20, 7.5, haz - 14);
        makecyl(0.3, 0.4, 6, 6, 0x7A5C30, hax + 10, 3, haz - 14);
        makecone(2, 3, 7, 0x2D5A1E, hax + 10, 7.5, haz - 14);

        // ============================================================
        // ADDITIONAL DOWNTOWN BEIRUT BUILDINGS — fill the city
        // ============================================================
        // Central Bank / business district towers
        makebox(24, 55, 22, 0xAAABA0, cx + 100, 27.5, 80);
        makebox(18, 45, 18, 0x9A9B90, cx + 130, 22.5, 60);
        makebox(20, 38, 20, 0xABB0AA, cx + 120, 19, 100);
        // Downtown low rise mixed use
        makebox(16, 12, 14, 0xC8BBA8, cx - 10, 6, 130);
        makebox(18, 16, 14, 0xD0C4B0, cx + 20, 8, 130);
        makebox(20, 20, 16, 0xC4BBAA, cx - 40, 10, 130);
        // Residential buildings
        makebox(14, 24, 12, 0xD4CAB8, cx - 90, 12, -50);
        makebox(16, 20, 12, 0xD0C6B4, cx - 110, 10, -30);
        makebox(12, 28, 10, 0xCCC2B0, cx - 95, 14, -10);
        // UN House / embassies area
        makebox(22, 18, 20, 0xD8D2C8, cx + 80, 9, -60);
        makebox(16, 14, 14, 0xD0CAC0, cx + 100, 7, -40);
        // Street lights on main roads
        makecyl(0.15, 0.15, 7, 6, 0x666660, cx - 5, 3.5, -5);
        makecyl(0.15, 0.15, 7, 6, 0x666660, cx + 45, 3.5, -5);
        makecyl(0.15, 0.15, 7, 6, 0x666660, cx - 55, 3.5, -5);
        // Street road surfaces
        makebox(300, 0.2, 12, 0x444440, cx, 0.1, 0);
        makebox(12, 0.2, 300, 0x444440, cx + 10, 0.1, 50);
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
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
