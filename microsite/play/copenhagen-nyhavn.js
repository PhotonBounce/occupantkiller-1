window.CopenhagenNyhavn = (function() {
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

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var ox = 23080;

        // -------------------------------------------------------
        // GROUND PLANE (as flat box)
        // -------------------------------------------------------
        makeBox(600, 1, 600, 0x4A7A3A, ox, -0.5, 0);

        // -------------------------------------------------------
        // NYHAVN CANAL
        // -------------------------------------------------------
        // Canal water — long rectangular trough
        makeBox(120, 1.5, 22, 0x1A4A6A, ox - 60, 0.2, 0);

        // Canal walls / quay stones
        makeBox(120, 2, 2, 0x888877, ox - 60, 1, 11);
        makeBox(120, 2, 2, 0x888877, ox - 60, 1, -11);

        // Nyhavn townhouses — north side (red, orange, yellow, blue, ochre repeating)
        // House 1 red
        makeBox(10, 16, 12, 0xAA2222, ox - 100, 8, -22);
        makeCone(5, 4, 4, 0x771111, ox - 100, 18, -22);
        // House 2 orange
        makeBox(10, 18, 12, 0xDD6622, ox - 89, 9, -22);
        makeCone(5, 4, 4, 0xBB4411, ox - 89, 20, -22);
        // House 3 yellow
        makeBox(10, 14, 12, 0xDDCC33, ox - 78, 7, -22);
        makeCone(5, 3, 4, 0xBBAA22, ox - 78, 16.5, -22);
        // House 4 blue
        makeBox(10, 17, 12, 0x2255AA, ox - 67, 8.5, -22);
        makeCone(5, 4, 4, 0x113388, ox - 67, 19, -22);
        // House 5 ochre
        makeBox(10, 15, 12, 0xCC9933, ox - 56, 7.5, -22);
        makeCone(5, 3.5, 4, 0xAA7722, ox - 56, 17.25, -22);
        // House 6 red-brown
        makeBox(10, 16, 12, 0x882222, ox - 45, 8, -22);
        makeCone(5, 4, 4, 0x661111, ox - 45, 18, -22);
        // House 7 orange-red
        makeBox(10, 19, 12, 0xCC4411, ox - 34, 9.5, -22);
        makeCone(5, 4.5, 4, 0xAA2200, ox - 34, 21.75, -22);

        // Nyhavn townhouses — south side
        // House 8 green
        makeBox(10, 15, 12, 0x336633, ox - 95, 7.5, 22);
        makeCone(5, 3.5, 4, 0x224422, ox - 95, 17.25, 22);
        // House 9 pink-red
        makeBox(10, 17, 12, 0xCC5566, ox - 84, 8.5, 22);
        makeCone(5, 4, 4, 0xAA3344, ox - 84, 19, 22);
        // House 10 cream
        makeBox(10, 14, 12, 0xEEDDAA, ox - 73, 7, 22);
        makeCone(5, 3, 4, 0xCCBB88, ox - 73, 16.5, 22);
        // House 11 mustard
        makeBox(10, 16, 12, 0xBB9922, ox - 62, 8, 22);
        makeCone(5, 4, 4, 0x997711, ox - 62, 18, 22);

        // Canal boats (flat box silhouettes)
        makeBox(12, 2, 4, 0x553311, ox - 70, 1.5, 2);
        makeBox(10, 2, 3.5, 0x225588, ox - 55, 1.5, -4);
        makeBox(8, 2, 3, 0x882211, ox - 42, 1.5, 5);
        // Boat cabin
        makeBox(4, 3, 3, 0xDDCC99, ox - 70, 3.5, 2);
        makeBox(3, 3, 2.5, 0xDDCC99, ox - 55, 3.5, -4);

        // -------------------------------------------------------
        // LITTLE MERMAID STATUE in harbour
        // -------------------------------------------------------
        var lmx = ox + 180;
        var lmz = -30;
        // Granite boulders base
        makeSphere(4, 8, 6, 0x666666, lmx, 2, lmz);
        makeSphere(2.5, 8, 6, 0x777777, lmx + 2.5, 1.5, lmz + 1.5);
        makeSphere(2, 8, 6, 0x555555, lmx - 2, 1.2, lmz - 1);
        // Mermaid body torso
        makeCyl(1.0, 1.2, 3.5, 8, 0x888888, lmx, 6.75, lmz);
        // Mermaid head
        makeSphere(0.9, 8, 8, 0x888888, lmx, 9, lmz);
        // Mermaid tail (curved approximation)
        makeCyl(0.7, 1.1, 4, 8, 0x888888, lmx + 0.5, 3.5, lmz);
        makeCone(0.6, 2.5, 8, 0x888888, lmx + 1.5, 1.5, lmz + 0.5);
        // Arm
        makeBox(1.5, 0.6, 0.6, 0x888888, lmx + 1.5, 8.5, lmz);
        // Surrounding harbour water
        makeBox(60, 0.8, 60, 0x1A4A6A, lmx, 0, lmz);

        // -------------------------------------------------------
        // TIVOLI GARDENS
        // -------------------------------------------------------
        var tx = ox + 60;
        var tz = 80;
        // Gardens ground
        makeBox(110, 0.5, 90, 0x2E7D32, tx, 0.3, tz);

        // Tivoli entrance gate / fairy-tale castle gate
        makeBox(24, 10, 4, 0xEEDDAA, tx - 30, 5, tz - 44);
        // Gate towers
        makeCyl(3, 3, 14, 8, 0xCC9966, tx - 40, 7, tz - 44);
        makeCone(3, 6, 8, 0xAA2222, tx - 40, 17, tz - 44);
        makeCyl(3, 3, 14, 8, 0xCC9966, tx - 20, 7, tz - 44);
        makeCone(3, 6, 8, 0xAA2222, tx - 20, 17, tz - 44);
        // Gate arch opening (dark box)
        makeBox(8, 7, 4.5, 0x222222, tx - 30, 4, tz - 44);

        // Chinese Pagoda tower — multi-tier
        makeCyl(5, 6, 5, 8, 0xCC3311, tx + 20, 2.5, tz - 10);
        makeCyl(4, 5, 5, 8, 0xCC3311, tx + 20, 7.5, tz - 10);
        makeCyl(3, 4, 5, 8, 0xCC3311, tx + 20, 12.5, tz - 10);
        makeCyl(2, 3, 4, 8, 0xCC3311, tx + 20, 17, tz - 10);
        makeCone(2.5, 5, 8, 0x225522, tx + 20, 21.5, tz - 10);
        // Pagoda roof tiers (flared cones)
        makeCone(7, 2, 8, 0x225522, tx + 20, 5.5, tz - 10);
        makeCone(6, 2, 8, 0x225522, tx + 20, 10.5, tz - 10);
        makeCone(4.5, 2, 8, 0x225522, tx + 20, 15.5, tz - 10);

        // Carousel — circular base + canopy
        makeCyl(8, 8, 1.5, 12, 0xFFDD44, tx - 10, 0.75, tz + 20);
        makeCone(9, 5, 12, 0xDD2244, tx - 10, 4.75, tz + 20);
        makeCyl(0.5, 0.5, 6, 6, 0xDDAA22, tx - 10, 3, tz + 20);

        // Roller coaster structure
        // Support towers
        makeBox(2, 20, 2, 0xAA8844, tx + 40, 10, tz - 20);
        makeBox(2, 15, 2, 0xAA8844, tx + 50, 7.5, tz - 20);
        makeBox(2, 25, 2, 0xAA8844, tx + 55, 12.5, tz - 20);
        makeBox(2, 12, 2, 0xAA8844, tx + 45, 6, tz - 10);
        // Track sections (horizontal beams)
        makeBox(12, 1, 1.5, 0x887755, tx + 45, 20, tz - 20);
        makeBox(7, 1, 1.5, 0x887755, tx + 52, 15, tz - 20);
        makeBox(10, 1, 1.5, 0x887755, tx + 50, 7, tz - 15);
        // Diagonal supports
        makeBox(14, 1, 1, 0x776644, tx + 47, 14, tz - 20);

        // Garden pathways (lighter ground strips)
        makeBox(80, 0.6, 3, 0xC8A86A, tx - 20, 0.4, tz);
        makeBox(3, 0.6, 70, 0xC8A86A, tx, 0.4, tz);

        // Garden hedges/trees
        makeSphere(4, 6, 5, 0x1A6B1A, tx - 40, 4, tz + 10);
        makeSphere(3.5, 6, 5, 0x1A6B1A, tx - 40, 3.5, tz + 25);
        makeSphere(4, 6, 5, 0x1A6B1A, tx - 15, 4, tz + 35);
        makeSphere(3, 6, 5, 0x228822, tx + 30, 3, tz + 35);

        // -------------------------------------------------------
        // CHRISTIANSBORG PALACE
        // -------------------------------------------------------
        var cbx = ox - 100;
        var cbz = -80;
        // Long baroque facade
        makeBox(80, 18, 20, 0x888899, cbx, 9, cbz);
        // Central portico
        makeBox(18, 22, 22, 0x9999AA, cbx, 11, cbz);
        // Copper-green spire tower
        makeCyl(4, 5, 30, 8, 0x778899, cbx, 30, cbz);
        makeCone(3, 22, 8, 0x4A8A6A, cbx, 56, cbz);
        // Wing extensions
        makeBox(20, 14, 18, 0x888899, cbx + 50, 7, cbz);
        makeBox(20, 14, 18, 0x888899, cbx - 50, 7, cbz);
        // Windows strip (darker band)
        makeBox(80, 2, 1, 0x555566, cbx, 10, cbz - 10.5);
        makeBox(80, 2, 1, 0x555566, cbx, 16, cbz - 10.5);

        // -------------------------------------------------------
        // ROSENBORG CASTLE
        // -------------------------------------------------------
        var rbx = ox + 140;
        var rbz = 60;
        // Main castle body
        makeBox(30, 20, 18, 0xC87820, rbx, 10, rbz);
        // Round corner towers
        makeCyl(4, 4, 24, 8, 0xAA6010, rbx - 15, 12, rbz - 9);
        makeCyl(4, 4, 24, 8, 0xAA6010, rbx + 15, 12, rbz - 9);
        makeCyl(4, 4, 24, 8, 0xAA6010, rbx - 15, 12, rbz + 9);
        makeCyl(4, 4, 24, 8, 0xAA6010, rbx + 15, 12, rbz + 9);
        // Tall spires on towers
        makeCone(3, 12, 8, 0x2A5A3A, rbx - 15, 30, rbz - 9);
        makeCone(3, 12, 8, 0x2A5A3A, rbx + 15, 30, rbz - 9);
        makeCone(3, 12, 8, 0x2A5A3A, rbx - 15, 30, rbz + 9);
        makeCone(3, 12, 8, 0x2A5A3A, rbx + 15, 30, rbz + 9);
        // Moat (water strip)
        makeBox(50, 0.8, 6, 0x1A4A6A, rbx, 0.2, rbz - 15);
        makeBox(50, 0.8, 6, 0x1A4A6A, rbx, 0.2, rbz + 15);
        makeBox(6, 0.8, 36, 0x1A4A6A, rbx - 25, 0.2, rbz);
        makeBox(6, 0.8, 36, 0x1A4A6A, rbx + 25, 0.2, rbz);

        // -------------------------------------------------------
        // ROUND TOWER (RUNDETARN)
        // -------------------------------------------------------
        var rtx = ox + 10;
        var rtz = -60;
        // Main cylindrical tower
        makeCyl(7, 7, 36, 16, 0xC8B478, rtx, 18, rtz);
        // Copper dome top
        makeSphere(7.5, 10, 8, 0x4A8A6A, rtx, 38, rtz);
        // Base plinth
        makeCyl(8.5, 8.5, 3, 16, 0xAA9966, rtx, 1.5, rtz);
        // Interior spiral ramp hint (thin rings)
        makeCyl(6, 6, 0.5, 16, 0xBBAA77, rtx, 8, rtz);
        makeCyl(6, 6, 0.5, 16, 0xBBAA77, rtx, 16, rtz);
        makeCyl(6, 6, 0.5, 16, 0xBBAA77, rtx, 24, rtz);

        // -------------------------------------------------------
        // CHURCH OF OUR SAVIOUR
        // -------------------------------------------------------
        var csx = ox - 30;
        var csz = -100;
        // Church nave
        makeBox(28, 18, 16, 0xC8B880, csx, 9, csz);
        // Transept
        makeBox(16, 14, 30, 0xC8B880, csx, 7, csz);
        // Tower base
        makeCyl(5, 5.5, 28, 8, 0xC8B880, csx, 14, csz);
        // Spiral staircase wrapping around spire (approximated with rotated boxes)
        makeCyl(4, 4, 20, 8, 0xC8A860, csx, 38, csz);
        makeBox(2, 1.5, 1.5, 0xAA9955, csx + 4, 30, csz);
        makeBox(2, 1.5, 1.5, 0xAA9955, csx, 33, csz + 4);
        makeBox(2, 1.5, 1.5, 0xAA9955, csx - 4, 36, csz);
        makeBox(2, 1.5, 1.5, 0xAA9955, csx, 39, csz - 4);
        makeBox(2, 1.5, 1.5, 0xAA9955, csx + 3, 42, csz);
        // Spire tip
        makeCone(3.5, 18, 8, 0x4A8A6A, csx, 56, csz);

        // -------------------------------------------------------
        // COPENHAGEN CITY HALL
        // -------------------------------------------------------
        var chx = ox - 10;
        var chz = 50;
        // Main red-brick body
        makeBox(40, 20, 22, 0xC87820, chx, 10, chz);
        // Central tower
        makeCyl(5, 6, 40, 8, 0xAA6010, chx, 20, chz);
        // Copper roof on tower
        makeCone(6, 10, 8, 0x4A7A5A, chx, 45, chz);
        // Side wings
        makeBox(12, 14, 20, 0xC87820, chx - 26, 7, chz);
        makeBox(12, 14, 20, 0xC87820, chx + 26, 7, chz);
        // Arched entrance
        makeBox(10, 8, 5, 0x553300, chx, 4, chz - 11);
        // Clock face (circle on facade)
        makeCyl(2.5, 2.5, 0.5, 12, 0xDDCC88, chx, 18, chz - 11.3);

        // -------------------------------------------------------
        // HARBOUR WATERFRONT — INNER HARBOUR
        // -------------------------------------------------------
        var hwx = ox + 200;
        var hwz = 0;
        // Harbour water
        makeBox(120, 1, 80, 0x1A4A6A, hwx, 0.3, hwz);

        // Opera House — modern curved building
        makeBox(30, 18, 24, 0xCCCCBB, hwx - 20, 9, hwz - 30);
        // Flat overhanging roof
        makeBox(38, 2, 30, 0xAAAA99, hwx - 20, 18.5, hwz - 30);
        // Glass facade strip
        makeBox(30, 14, 1, 0x88AACC, hwx - 20, 9, hwz - 42.5);

        // Playhouse (Skuespilhuset) — red-brick box
        makeBox(22, 14, 18, 0xAA3322, hwx + 20, 7, hwz + 25);
        makeBox(22, 2, 22, 0x882211, hwx + 20, 14.5, hwz + 25);

        // Modern boats in harbour
        makeBox(18, 3, 5, 0xEEEEDD, hwx - 40, 1.5, hwz + 10);
        makeBox(15, 2.5, 4, 0x334455, hwx - 20, 1.5, hwz + 20);
        makeBox(14, 3, 4.5, 0xCCBBAA, hwx, 1.5, hwz - 10);
        // Boat masts
        makeCyl(0.3, 0.3, 12, 4, 0x888877, hwx - 40, 8.5, hwz + 10);
        makeCyl(0.3, 0.3, 10, 4, 0x888877, hwx - 20, 7.5, hwz + 20);

        // -------------------------------------------------------
        // BLACK DIAMOND LIBRARY
        // -------------------------------------------------------
        var bdx = ox + 240;
        var bdz = 20;
        // Main tilted black granite block
        makeBox(28, 24, 20, 0x222222, bdx, 12, bdz);
        // Offset upper section (cantilevered appearance)
        makeBox(32, 8, 22, 0x111111, bdx + 2, 28, bdz);
        // Connecting bridge to old library
        makeBox(12, 4, 4, 0x333333, bdx - 20, 10, bdz);
        // Reflective facade panels
        makeBox(27, 22, 0.5, 0x334455, bdx, 12, bdz - 10.3);
        makeBox(27, 22, 0.5, 0x334455, bdx, 12, bdz + 10.3);

        // -------------------------------------------------------
        // ADDITIONAL STREET FURNITURE & DETAILS
        // -------------------------------------------------------
        // Lamp posts along Nyhavn
        makeCyl(0.2, 0.2, 6, 6, 0x333322, ox - 90, 3, 14);
        makeSphere(0.5, 6, 6, 0xFFFF99, ox - 90, 6.3, 14);
        makeCyl(0.2, 0.2, 6, 6, 0x333322, ox - 70, 3, 14);
        makeSphere(0.5, 6, 6, 0xFFFF99, ox - 70, 6.3, 14);
        makeCyl(0.2, 0.2, 6, 6, 0x333322, ox - 50, 3, 14);
        makeSphere(0.5, 6, 6, 0xFFFF99, ox - 50, 6.3, 14);
        makeCyl(0.2, 0.2, 6, 6, 0x333322, ox - 90, 3, -14);
        makeSphere(0.5, 6, 6, 0xFFFF99, ox - 90, 6.3, -14);
        makeCyl(0.2, 0.2, 6, 6, 0x333322, ox - 70, 3, -14);
        makeSphere(0.5, 6, 6, 0xFFFF99, ox - 70, 6.3, -14);

        // Cobblestone road approximation
        makeBox(120, 0.6, 8, 0x998877, ox - 60, 0.4, 18);
        makeBox(120, 0.6, 8, 0x998877, ox - 60, 0.4, -18);

        // Bridge over canal
        makeBox(8, 1.5, 26, 0xAA9966, ox - 20, 1.5, 0);
        makeBox(8, 2, 2, 0xBBAA77, ox - 20, 2.5, 12);
        makeBox(8, 2, 2, 0xBBAA77, ox - 20, 2.5, -12);

        // Rosenborg garden trees
        makeCyl(1, 1.5, 5, 6, 0x553311, rbx - 35, 2.5, rbz - 25);
        makeSphere(4, 6, 5, 0x228822, rbx - 35, 7.5, rbz - 25);
        makeCyl(1, 1.5, 5, 6, 0x553311, rbx + 35, 2.5, rbz - 25);
        makeSphere(4, 6, 5, 0x228822, rbx + 35, 7.5, rbz - 25);
        makeCyl(1, 1.5, 5, 6, 0x553311, rbx, 2.5, rbz + 25);
        makeSphere(4, 6, 5, 0x228822, rbx, 7.5, rbz + 25);

        // Tivoli fairy lights hint (small spheres)
        makeSphere(0.4, 4, 4, 0xFFFF44, tx - 30, 14, tz - 44);
        makeSphere(0.4, 4, 4, 0xFF4444, tx - 28, 16, tz - 44);
        makeSphere(0.4, 4, 4, 0x44FFFF, tx - 26, 14, tz - 44);

        // Christiansborg courtyard ground
        makeBox(40, 0.6, 20, 0xAAA099, cbx, 0.4, cbz);
        // Flagpoles
        makeCyl(0.3, 0.3, 18, 4, 0x888888, cbx - 30, 9, cbz - 12);
        makeBox(4, 2.5, 0.2, 0xCC1111, cbx - 28, 17, cbz - 12);
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
