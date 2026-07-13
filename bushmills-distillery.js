window.BushmillsDistillery = (function () {
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

    function makeCyl(rTop, rBot, h, color, x, y, z, segs) {
        var seg = segs || 12;
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, color, x, y, z, segs) {
        var seg = segs || 8;
        var geo = new THREE.ConeGeometry(r, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 10);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 19720;

        // -------------------------------------------------------
        // GROUND PLANE (built from boxes to avoid PlaneGeometry)
        // -------------------------------------------------------
        // Main courtyard ground
        makeBox(120, 0.4, 100, 0x7A6A50, cx, -0.2, 0);
        // Pastoral countryside extension
        makeBox(300, 0.4, 300, 0x228B22, cx, -0.4, -80);
        makeBox(300, 0.4, 300, 0x228B22, cx, -0.4, 80);
        makeBox(300, 0.4, 300, 0x228B22, cx - 100, -0.4, 0);
        makeBox(300, 0.4, 300, 0x228B22, cx + 100, -0.4, 0);

        // -------------------------------------------------------
        // MAIN DISTILLERY BUILDINGS — red brick Victorian
        // -------------------------------------------------------
        // Building A — main still house (large)
        makeBox(30, 14, 20, 0xCD5C5C, cx - 20, 7, -15);
        // Roof A
        makeBox(32, 2, 22, 0x8B3030, cx - 20, 15, -15);

        // Building B — mash tun house
        makeBox(22, 12, 18, 0xCD5C5C, cx + 18, 6, -12);
        // Roof B
        makeBox(24, 2, 20, 0x8B3030, cx + 18, 13, -12);

        // Building C — spirit safe / filling store
        makeBox(18, 10, 14, 0xCD5C5C, cx - 2, 5, 10);
        // Roof C
        makeBox(20, 2, 16, 0x8B3030, cx - 2, 11, 10);

        // Connecting corridor between A and B
        makeBox(8, 8, 10, 0xCD5C5C, cx + 3, 4, -15);
        makeBox(8, 1, 10, 0x8B3030, cx + 3, 8.5, -15);

        // -------------------------------------------------------
        // PAGODA KILN VENTILATION ROOFS — black cones
        // -------------------------------------------------------
        // Kiln tower 1 — on building A
        makeBox(6, 16, 6, 0x2A2A2A, cx - 26, 8, -15);
        makeCone(3.5, 6, 0x1A1A1A, cx - 26, 19, -15, 8);

        // Kiln tower 2 — on building A (second pagoda)
        makeBox(6, 16, 6, 0x2A2A2A, cx - 14, 8, -15);
        makeCone(3.5, 6, 0x1A1A1A, cx - 14, 19, -15, 8);

        // Kiln tower 3 — on building B
        makeBox(5, 14, 5, 0x2A2A2A, cx + 24, 7, -12);
        makeCone(3, 5, 0x1A1A1A, cx + 24, 17, -12, 8);

        // Chimney stack
        makeCyl(1, 1.2, 20, 0x3A2A2A, cx - 8, 10, -22, 8);

        // -------------------------------------------------------
        // POT STILLS — massive copper inside still house
        // -------------------------------------------------------
        // Still 1
        makeCyl(2, 2.5, 5, 0xB87333, cx - 24, 2.5, -18, 12);
        // Swan neck / lyne arm suggestion (small cylinder on top)
        makeCyl(0.4, 0.6, 3, 0xB87333, cx - 24, 6.5, -18, 8);

        // Still 2
        makeCyl(2, 2.5, 5, 0xB87333, cx - 18, 2.5, -18, 12);
        makeCyl(0.4, 0.6, 3, 0xB87333, cx - 18, 6.5, -18, 8);

        // Still 3 (spirit still — slightly smaller)
        makeCyl(1.6, 2, 4.5, 0xB87333, cx - 24, 2.25, -10, 12);
        makeCyl(0.35, 0.5, 2.5, 0xB87333, cx - 24, 5.5, -10, 8);

        // Still 4
        makeCyl(1.6, 2, 4.5, 0xB87333, cx - 18, 2.25, -10, 12);
        makeCyl(0.35, 0.5, 2.5, 0xB87333, cx - 18, 5.5, -10, 8);

        // -------------------------------------------------------
        // MASH TUN (large copper vessel)
        // -------------------------------------------------------
        makeCyl(3, 3.5, 3, 0xB87333, cx + 20, 1.5, -14, 12);
        // Lid dome
        makeSphere(3.2, 0xA07030, cx + 20, 3.5, -14);

        // -------------------------------------------------------
        // WAREHOUSES — long stone buildings
        // -------------------------------------------------------
        // Warehouse 1
        makeBox(50, 8, 18, 0x808080, cx - 5, 4, 32);
        makeBox(52, 1.5, 20, 0x606060, cx - 5, 8.75, 32);

        // Warehouse 2
        makeBox(50, 8, 18, 0x808080, cx + 50, 4, 32);
        makeBox(52, 1.5, 20, 0x606060, cx + 50, 8.75, 32);

        // Warehouse 3 (bonded warehouse — slightly different shade)
        makeBox(50, 8, 18, 0x909090, cx - 60, 4, 32);
        makeBox(52, 1.5, 20, 0x707070, cx - 60, 8.75, 32);

        // -------------------------------------------------------
        // WHISKEY BARRELS — rows in warehouse 1
        // -------------------------------------------------------
        var bi, bj, bx, bz;
        for (bi = 0; bi < 5; bi++) {
            for (bj = 0; bj < 4; bj++) {
                bx = cx - 22 + bi * 4;
                bz = 27 + bj * 3;
                // Bottom row
                var barrel = makeCyl(0.8, 0.8, 1.2, 0x5C3317, bx, 0.6, bz, 10);
                barrel.rotation.z = Math.PI / 2;
            }
        }

        // Stacked barrels (second layer) in warehouse 2
        for (bi = 0; bi < 4; bi++) {
            bx = cx + 32 + bi * 4;
            bz = 30;
            var barrelStack = makeCyl(0.8, 0.8, 1.2, 0x5C3317, bx, 1.8, bz, 10);
            barrelStack.rotation.z = Math.PI / 2;
        }

        // -------------------------------------------------------
        // RIVER BUSH — blue water strip (boxes approximating flow)
        // -------------------------------------------------------
        makeBox(200, 0.3, 12, 0x006994, cx - 20, 0.05, 55);
        // River bank stones
        makeBox(200, 0.6, 2, 0x8A8A7A, cx - 20, 0.3, 50);
        makeBox(200, 0.6, 2, 0x8A8A7A, cx - 20, 0.3, 61);
        // River ripple suggestion (slightly lighter strip)
        makeBox(200, 0.35, 3, 0x1A8FAA, cx - 20, 0.1, 55);

        // -------------------------------------------------------
        // BUSHMILLS VILLAGE — white painted buildings & pub
        // -------------------------------------------------------
        // Main square building 1 — white
        makeBox(12, 9, 10, 0xFFFFF0, cx + 45, 4.5, -40);
        makeBox(12, 2, 10, 0xD0D0B0, cx + 45, 10, -40);

        // Main square building 2
        makeBox(10, 8, 8, 0xFFFFF0, cx + 60, 4, -40);
        makeBox(10, 1.5, 8, 0xD0D0B0, cx + 60, 9, -40);

        // Main square building 3
        makeBox(10, 8, 8, 0xFFFFF0, cx + 32, 4, -40);
        makeBox(10, 1.5, 8, 0xD0D0B0, cx + 32, 9, -40);

        // Bushmills Hotel / Pub — red brick
        makeBox(18, 11, 14, 0xCD5C5C, cx + 52, 5.5, -55);
        makeBox(20, 2, 16, 0x8B3030, cx + 52, 12, -55);
        // Hotel chimney
        makeCyl(0.5, 0.6, 5, 0x3A2A2A, cx + 48, 16, -55, 6);
        makeCyl(0.5, 0.6, 5, 0x3A2A2A, cx + 56, 16, -55, 6);

        // Village shop — white
        makeBox(9, 7, 8, 0xFFFFF0, cx + 70, 3.5, -42);

        // Village church — white with cross suggestion
        makeBox(10, 12, 8, 0xFFFFF0, cx + 80, 6, -55);
        makeBox(4, 3, 4, 0xFFFFF0, cx + 80, 14, -55);
        makeCone(2.5, 5, 0xC0C0C0, cx + 80, 18, -55, 4);

        // Market square ground
        makeBox(40, 0.4, 30, 0xB0A080, cx + 52, 0.2, -44);

        // -------------------------------------------------------
        // VISITOR CENTRE — modern reception building
        // -------------------------------------------------------
        makeBox(24, 7, 16, 0xE8E0D0, cx + 10, 3.5, -32);
        makeBox(26, 1, 18, 0xC8C0B0, cx + 10, 7.5, -32);
        // Sample bar counter inside (visible through open front)
        makeBox(10, 1.2, 2, 0x8B6914, cx + 10, 1.2, -28);
        // Visitor centre sign post
        makeCyl(0.2, 0.2, 4, 0x555555, cx + 4, 2, -26, 6);
        makeBox(3, 0.8, 0.2, 0x8B0000, cx + 4, 4.4, -26);

        // -------------------------------------------------------
        // GRAIN MILL — millstone equipment and silo
        // -------------------------------------------------------
        // Mill building
        makeBox(16, 11, 14, 0xC0C0C0, cx - 44, 5.5, -20);
        makeBox(18, 2, 16, 0xA0A0A0, cx - 44, 12, -20);

        // Grain silo — tall cylinder
        makeCyl(3.5, 3.5, 18, 0xD0D0D0, cx - 38, 9, -10, 12);
        makeCone(3.6, 3, 0xB0B0B0, cx - 38, 19.5, -10, 12);

        // Second silo
        makeCyl(2.8, 2.8, 15, 0xD0D0D0, cx - 32, 7.5, -10, 12);
        makeCone(2.9, 2.5, 0xB0B0B0, cx - 32, 17, -10, 12);

        // Millstone grinder (flat disk representation)
        makeCyl(2.5, 2.5, 0.6, 0x888888, cx - 44, 1.5, -20, 12);
        makeCyl(2.3, 2.3, 0.4, 0x999999, cx - 44, 2.2, -20, 12);

        // Grain hopper funnel
        makeCone(2, 3, 0xB8B8B8, cx - 44, 5.5, -20, 8);

        // -------------------------------------------------------
        // COOPERAGE — barrel making workshop
        // -------------------------------------------------------
        // Cooperage building
        makeBox(20, 9, 16, 0xA0522D, cx - 50, 4.5, 8);
        makeBox(22, 1.5, 18, 0x7A3820, cx - 50, 9.75, 8);

        // Barrel hoop storage box
        makeBox(3, 1.5, 2, 0x5C3A10, cx - 44, 0.75, 6);
        // Another tool crate
        makeBox(2.5, 1.2, 2, 0x5C3A10, cx - 44, 0.6, 9);

        // Work bench
        makeBox(6, 1, 2, 0x8B6914, cx - 48, 1, 4);
        // Bench legs
        makeCyl(0.15, 0.15, 1, 0x7A5810, cx - 47, 0.5, 3.2, 4);
        makeCyl(0.15, 0.15, 1, 0x7A5810, cx - 49, 0.5, 3.2, 4);
        makeCyl(0.15, 0.15, 1, 0x7A5810, cx - 47, 0.5, 4.8, 4);
        makeCyl(0.15, 0.15, 1, 0x7A5810, cx - 49, 0.5, 4.8, 4);

        // Half-made barrel in cooperage
        makeCyl(0.9, 0.9, 1.4, 0x8B6914, cx - 52, 0.7, 10, 10);

        // -------------------------------------------------------
        // PASTORAL ANTRIM COUNTRYSIDE
        // -------------------------------------------------------
        // Rolling green hills (large spheres half-buried)
        makeSphere(18, 0x228B22, cx - 100, -14, -80);
        makeSphere(14, 0x228B22, cx + 120, -10, -70);
        makeSphere(20, 0x1E7A1E, cx - 80, -15, 70);
        makeSphere(16, 0x2A9A2A, cx + 100, -12, 80);

        // Trees — cone + cylinder (Antrim hedgerow trees)
        var ti, tx, tz;
        var treePositions = [
            [cx - 70, -60], [cx - 65, -70], [cx - 75, -50],
            [cx + 80, -60], [cx + 85, -65],
            [cx - 60, 65], [cx - 55, 70],
            [cx + 90, 70], [cx + 95, 65]
        ];
        for (ti = 0; ti < treePositions.length; ti++) {
            tx = treePositions[ti][0];
            tz = treePositions[ti][1];
            makeCyl(0.4, 0.5, 4, 0x4A2E0A, tx, 2, tz, 6);
            makeCone(2.5, 5, 0x1A6B1A, tx, 7, tz, 6);
        }

        // Stone wall along road
        makeBox(80, 1.2, 0.8, 0x888880, cx - 5, 0.6, -75);
        makeBox(60, 1.2, 0.8, 0x888880, cx + 70, 0.6, -75);

        // Farm gate post
        makeCyl(0.3, 0.3, 3, 0x555548, cx + 35, 1.5, -75, 4);
        makeCyl(0.3, 0.3, 3, 0x555548, cx + 30, 1.5, -75, 4);
        makeBox(5, 0.3, 0.2, 0x7A5A20, cx + 32.5, 2, -75);
        makeBox(5, 0.3, 0.2, 0x7A5A20, cx + 32.5, 2.8, -75);

        // -------------------------------------------------------
        // DISTILLERY SIGNAGE & ENTRANCE GATE
        // -------------------------------------------------------
        // Entrance gate pillars
        makeCyl(0.7, 0.9, 6, 0x888880, cx - 35, 3, -2, 6);
        makeCyl(0.7, 0.9, 6, 0x888880, cx - 35, 3, 2, 6);
        // Gate lintel
        makeBox(0.4, 0.5, 6, 0x808078, cx - 35, 6.5, 0);
        // Sphere finials on gate posts
        makeSphere(0.5, 0x666660, cx - 35, 6.5, -2);
        makeSphere(0.5, 0x666660, cx - 35, 6.5, 2);

        // Distillery name sign board
        makeBox(12, 2, 0.3, 0x8B0000, cx - 20, 7, -28);

        // -------------------------------------------------------
        // COURTYARD FEATURES
        // -------------------------------------------------------
        // Cobblestone courtyard hint (flat box slightly raised)
        makeBox(40, 0.3, 30, 0x9A9080, cx, 0.15, -5);

        // Tasting display barrel cluster (3 barrels near visitor centre)
        makeCyl(0.8, 0.8, 1.2, 0x5C3317, cx + 6, 0.6, -26, 10);
        makeCyl(0.8, 0.8, 1.2, 0x5C3317, cx + 8, 0.6, -26, 10);
        makeCyl(0.8, 0.8, 1.2, 0x5C3317, cx + 7, 1.8, -26, 10);

        // Lamp posts in courtyard
        makeCyl(0.15, 0.15, 5, 0x333333, cx - 10, 2.5, -2, 6);
        makeSphere(0.4, 0xFFFF88, cx - 10, 5.5, -2);
        makeCyl(0.15, 0.15, 5, 0x333333, cx + 5, 2.5, 2, 6);
        makeSphere(0.4, 0xFFFF88, cx + 5, 5.5, 2);

        // Water well (historic feature)
        makeCyl(1, 1.1, 1, 0x888880, cx - 8, 0.5, 8, 10);
        makeCyl(0.1, 0.1, 2.5, 0x444444, cx - 9, 2, 8, 4);
        makeCyl(0.1, 0.1, 2.5, 0x444444, cx - 7, 2, 8, 4);
        makeBox(2.5, 0.2, 0.2, 0x444444, cx - 8, 3.5, 8);

        // -------------------------------------------------------
        // GRAIN DELIVERY ROAD
        // -------------------------------------------------------
        makeBox(8, 0.3, 80, 0xA09880, cx - 35, 0.1, 10);
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
