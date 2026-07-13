window.LincolnshireFens = (function() {
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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function buildGround() {
        // Lincolnshire Fens flat agricultural land
        makeBox(2000, 1, 2000, 0x7a9e5b, 15640, -0.5, 0);
        // Drainage ditches - long thin dark strips in grid pattern
        makeBox(2000, 0.3, 2, 0x2a4a6a, 15640, 0.2, -200);
        makeBox(2000, 0.3, 2, 0x2a4a6a, 15640, 0.2, -100);
        makeBox(2000, 0.3, 2, 0x2a4a6a, 15640, 0.2, 0);
        makeBox(2000, 0.3, 2, 0x2a4a6a, 15640, 0.2, 100);
        makeBox(2000, 0.3, 2, 0x2a4a6a, 15640, 0.2, 200);
        makeBox(2000, 0.3, 2, 0x2a4a6a, 15640, 0.2, 300);
        // Perpendicular drains
        makeBox(2, 0.3, 2000, 0x2a4a6a, 15540, 0.2, 0);
        makeBox(2, 0.3, 2000, 0x2a4a6a, 15640, 0.2, 0);
        makeBox(2, 0.3, 2000, 0x2a4a6a, 15740, 0.2, 0);
        makeBox(2, 0.3, 2000, 0x2a4a6a, 15440, 0.2, 0);
        // Wide flat fields - different crop colors
        makeBox(90, 0.5, 90, 0xc8a850, 15640, 0.1, 400);
        makeBox(90, 0.5, 90, 0x8aaa40, 15740, 0.1, 400);
        makeBox(90, 0.5, 90, 0xd4b870, 15540, 0.1, 400);
        makeBox(90, 0.5, 90, 0xb0c860, 15640, 0.1, 500);
    }

    function buildLincolnCathedral() {
        // Cathedral sits on hilltop - elevated base
        var hx = 15640;
        var hz = -300;
        var hillY = 20;

        // Hill / plateau
        makeBox(160, 40, 120, 0x8b7355, hx, 20, hz);

        // Main nave body
        makeBox(80, 25, 35, 0xd4c5a0, hx, hillY + 32.5, hz);

        // Nave roof
        makeCone(4, 15, 4, 0xa09070, hx, hillY + 52, hz);

        // Angel Choir / east end
        makeBox(30, 22, 30, 0xcfbf95, hx + 50, hillY + 31, hz);
        makeCone(4, 12, 4, 0xa09070, hx + 50, hillY + 49, hz);

        // Chapter house (polygonal) - approximate with cylinder
        makeCylinder(12, 12, 18, 8, 0xcfbf95, hx + 60, hillY + 29, hz - 25);
        makeCone(14, 10, 8, 0x907060, hx + 60, hillY + 43, hz - 25);

        // West front transept
        makeBox(40, 20, 15, 0xd4c5a0, hx - 50, hillY + 30, hz);

        // Twin west towers (flanking west front)
        makeBox(16, 50, 16, 0xd4c5a0, hx - 60, hillY + 65, hz - 17);
        makeBox(16, 50, 16, 0xd4c5a0, hx - 60, hillY + 65, hz + 17);
        // West tower pinnacles
        makeCone(3, 12, 4, 0xb0a080, hx - 60, hillY + 96, hz - 17);
        makeCone(3, 12, 4, 0xb0a080, hx - 60, hillY + 96, hz + 17);

        // Central tower (tallest - 160m original, the highest medieval tower)
        makeBox(20, 100, 20, 0xd4c5a0, hx, hillY + 100, hz);
        // Central tower upper lantern section
        makeBox(16, 30, 16, 0xbfaf8a, hx, hillY + 165, hz);
        // Central tower pinnacle
        makeCone(4, 20, 4, 0xa09070, hx, hillY + 195, hz);

        // Crossing tower details - small corner turrets
        makeCylinder(2, 2, 15, 6, 0xc4b590, hx - 10, hillY + 107, hz - 10);
        makeCylinder(2, 2, 15, 6, 0xc4b590, hx + 10, hillY + 107, hz - 10);
        makeCylinder(2, 2, 15, 6, 0xc4b590, hx - 10, hillY + 107, hz + 10);
        makeCylinder(2, 2, 15, 6, 0xc4b590, hx + 10, hillY + 107, hz + 10);

        // North transept
        makeBox(20, 30, 40, 0xd4c5a0, hx - 15, hillY + 35, hz - 40);
        // South transept
        makeBox(20, 30, 40, 0xd4c5a0, hx + 15, hillY + 35, hz + 40);

        // Cathedral floor / close
        makeBox(200, 1, 160, 0xc8b898, hx, hillY + 40.5, hz);

        // Lincoln Imp - small decorative sphere (legendary carving)
        makeSphere(1.5, 6, 6, 0x8b6914, hx + 5, hillY + 130, hz);
    }

    function buildLincolnCastle() {
        var cx = 15580;
        var cz = -290;
        var castleY = 20;

        // Castle sits on hill adjacent to cathedral
        makeBox(120, 35, 100, 0x8b7355, cx, castleY + 17.5, cz);

        // Curtain walls - perimeter
        makeBox(120, 12, 4, 0x9a8060, cx, castleY + 41, cz - 50);
        makeBox(120, 12, 4, 0x9a8060, cx, castleY + 41, cz + 50);
        makeBox(4, 12, 100, 0x9a8060, cx - 60, castleY + 41, cz);
        makeBox(4, 12, 100, 0x9a8060, cx + 60, castleY + 41, cz);

        // Lucy Tower - shell keep on western motte (larger motte)
        makeBox(20, 8, 20, 0x6b6348, cx - 30, castleY + 53, cz - 20);
        makeCylinder(10, 12, 6, 8, 0x7a7258, cx - 30, castleY + 62, cz - 20);

        // Observatory Tower on eastern motte
        makeBox(10, 20, 10, 0x8a7060, cx + 30, castleY + 55, cz + 20);
        makeCone(6, 8, 4, 0x706050, cx + 30, castleY + 76, cz + 20);

        // Cobb Hall - northeast tower
        makeCylinder(5, 5, 18, 8, 0x8a7060, cx + 55, castleY + 53, cz - 45);
        makeCone(5.5, 6, 8, 0x706050, cx + 55, castleY + 62, cz - 45);

        // Victorian prison wing (rectangular block)
        makeBox(40, 16, 20, 0x706a5a, cx + 10, castleY + 43, cz);

        // Main gatehouse
        makeBox(24, 18, 12, 0x9a8060, cx - 60, castleY + 44, cz);
        makeCone(8, 6, 4, 0x706050, cx - 60, castleY + 54, cz);

        // Second motte mound
        makeCylinder(16, 20, 10, 8, 0x7a6a4a, cx - 30, castleY + 40, cz - 20);
        makeCylinder(14, 16, 8, 8, 0x7a6a4a, cx + 30, castleY + 40, cz + 20);

        // Magna Carta vault building (small prominent building)
        makeBox(15, 10, 12, 0xc0b090, cx, castleY + 45, cz);
    }

    function buildSteepHill() {
        // Steep Hill - famous medieval street on slope of Lincoln hill
        var sx = 15700;
        var sz = -260;

        // Street surface - narrow, steep
        makeBox(6, 0.5, 80, 0x808080, sx, 10, sz);

        // Jew's House - Norman merchant's house (one of oldest inhabited houses in England)
        makeBox(8, 10, 6, 0xc4a870, sx - 5, 15, sz + 20);
        makeBox(8, 3, 6, 0x9a7a50, sx - 5, 21, sz + 20);
        // Small decorative arched window feature
        makeBox(2, 3, 1, 0x4a3a2a, sx - 5, 15, sz + 17);

        // Row of medieval shops/houses along the hill
        makeBox(6, 8, 5, 0xc8a860, sx - 5, 14, sz + 5);
        makeBox(6, 9, 5, 0xb89850, sx - 5, 14.5, sz - 5);
        makeBox(6, 7, 5, 0xd4b870, sx - 5, 13.5, sz - 15);
        makeBox(6, 8, 5, 0xc0a060, sx + 5, 14, sz + 5);
        makeBox(6, 9, 5, 0xb89850, sx + 5, 14.5, sz - 5);
        makeBox(6, 7, 5, 0xd4b870, sx + 5, 13.5, sz - 15);

        // Overhanging upper stories (jettied)
        makeBox(7, 3, 5.5, 0xd4b870, sx - 5, 19, sz + 5);
        makeBox(7, 3, 5.5, 0xc8a860, sx + 5, 19, sz + 5);

        // Cobblestone street texture hint - small raised strips
        makeBox(5, 0.3, 1, 0x909090, sx, 10.2, sz + 10);
        makeBox(5, 0.3, 1, 0x909090, sx, 10.2, sz);
        makeBox(5, 0.3, 1, 0x909090, sx, 10.2, sz - 10);

        // Antique shop signs (flat boxes)
        makeBox(3, 2, 0.5, 0x8b0000, sx - 5, 19, sz + 1);
        makeBox(3, 2, 0.5, 0x006400, sx + 5, 18, sz - 2);
    }

    function buildBostonStump() {
        // St Botolph's Church, Boston - massive lantern tower visible across the Fens
        var bx = 15800;
        var bz = 350;

        // Church nave body
        makeBox(35, 18, 22, 0xd4c5a0, bx, 9, bz);
        // Nave roof
        makeCone(4, 10, 4, 0xa09070, bx, 24, bz);

        // Side aisles
        makeBox(35, 12, 8, 0xcabfa0, bx, 6, bz - 15);
        makeBox(35, 12, 8, 0xcabfa0, bx, 6, bz + 15);

        // Chancel / east end
        makeBox(18, 16, 18, 0xd0c09a, bx + 28, 8, bz);

        // The famous Boston Stump tower (83m, massive square tower)
        makeBox(22, 60, 22, 0xd4c5a0, bx - 20, 30, bz);

        // Tower middle section with decorative bands
        makeBox(21, 15, 21, 0xcabfa0, bx - 20, 67, bz);

        // Octagonal lantern top - Boston Stump's famous feature
        makeCylinder(9, 10, 18, 8, 0xc8b890, bx - 20, 84, bz);
        // Lantern crown
        makeCylinder(4, 9, 5, 8, 0xb8a880, bx - 20, 95, bz);
        // Pinnacle
        makeCone(3, 8, 8, 0xa09070, bx - 20, 100, bz);

        // Tower corner buttresses
        makeBox(3, 58, 3, 0xc0b090, bx - 30, 29, bz - 10);
        makeBox(3, 58, 3, 0xc0b090, bx - 10, 29, bz - 10);
        makeBox(3, 58, 3, 0xc0b090, bx - 30, 29, bz + 10);
        makeBox(3, 58, 3, 0xc0b090, bx - 10, 29, bz + 10);

        // West porch
        makeBox(12, 10, 8, 0xd0c0a0, bx - 31, 5, bz);

        // Boston town buildings (surrounding the church)
        makeBox(12, 8, 10, 0xc0a870, bx + 30, 4, bz + 20);
        makeBox(10, 6, 8, 0xb89860, bx + 28, 3, bz - 20);
        makeBox(14, 7, 10, 0xc8b070, bx + 45, 3.5, bz);
        makeBox(8, 5, 8, 0xb0a060, bx + 50, 2.5, bz + 25);
        makeBox(8, 5, 8, 0xb0a060, bx + 55, 2.5, bz - 20);
        makeBox(10, 6, 10, 0xc0a870, bx + 60, 3, bz);

        // Market place / town square
        makeBox(50, 0.5, 50, 0xb0a888, bx + 40, 0.3, bz);
    }

    function buildWindmill() {
        // Ellis's Mill - working Lincolnshire tower windmill
        var wx = 15720;
        var wz = 150;

        // White tower mill body (tapered cylinder)
        makeCylinder(4, 6, 22, 8, 0xf0f0e8, wx, 11, wz);

        // Cap (rotating top of mill)
        makeCylinder(3, 4, 4, 8, 0x8b7040, wx, 24, wz);
        makeSphere(3.2, 8, 6, 0x9a8050, wx, 27, wz);

        // Windmill sails - four box arms radiating from hub
        // Sail 1 - vertical up
        makeBox(1.5, 14, 0.8, 0xd4b870, wx, 32, wz);
        // Sail 2 - vertical down
        makeBox(1.5, 14, 0.8, 0xd4b870, wx, 18, wz);
        // Sail 3 - horizontal left
        makeBox(14, 1.5, 0.8, 0xd4b870, wx - 7, 25, wz);
        // Sail 4 - horizontal right
        makeBox(14, 1.5, 0.8, 0xd4b870, wx + 7, 25, wz);

        // Sail frames/ribs cross pieces
        makeBox(0.8, 14, 0.5, 0xc0a060, wx - 3, 25, wz);
        makeBox(0.8, 14, 0.5, 0xc0a060, wx + 3, 25, wz);
        makeBox(14, 0.8, 0.5, 0xc0a060, wx, 28, wz);
        makeBox(14, 0.8, 0.5, 0xc0a060, wx, 22, wz);

        // Miller's cottage (attached to mill)
        makeBox(10, 6, 8, 0xc8a870, wx + 10, 3, wz);
        makeCone(5, 5, 4, 0x8b5030, wx + 10, 8.5, wz);

        // Grain sacks (stacked boxes)
        makeBox(1.5, 1.5, 1.5, 0xd2b48c, wx + 7, 0.75, wz + 3);
        makeBox(1.5, 1.5, 1.5, 0xd2b48c, wx + 7, 2.25, wz + 3);
        makeBox(1.5, 1.5, 1.5, 0xd2b48c, wx + 8.5, 0.75, wz + 3);

        // Second windmill at different location (Lincolnshire had many)
        var wx2 = 15500;
        var wz2 = 250;
        makeCylinder(3.5, 5, 18, 8, 0xf0ede0, wx2, 9, wz2);
        makeCylinder(2.5, 3.5, 3.5, 8, 0x8b7040, wx2, 19.75, wz2);
        makeSphere(2.8, 8, 6, 0x9a8050, wx2, 22.5, wz2);
        // Sails for second mill
        makeBox(1.2, 12, 0.6, 0xd4b870, wx2, 28, wz2);
        makeBox(1.2, 12, 0.6, 0xd4b870, wx2, 16, wz2);
        makeBox(12, 1.2, 0.6, 0xd4b870, wx2 - 6, 22, wz2);
        makeBox(12, 1.2, 0.6, 0xd4b870, wx2 + 6, 22, wz2);
        // Cottage for second mill
        makeBox(8, 5, 7, 0xc0a068, wx2 + 9, 2.5, wz2);
        makeCone(4, 4, 4, 0x7a4828, wx2 + 9, 7, wz2);
    }

    function buildPumpingStations() {
        // Fen drainage pumping stations - essential infrastructure
        var px = 15550;
        var pz = 200;

        // Windpump (smaller, drainage specific)
        makeCylinder(2.5, 3.5, 10, 6, 0xd0c8a0, px, 5, pz);
        makeCylinder(2, 2.5, 2, 6, 0x808060, px, 11, pz);
        // Windpump sails (smaller)
        makeBox(1, 8, 0.5, 0xc8b060, px, 13, pz);
        makeBox(8, 1, 0.5, 0xc8b060, px, 13, pz);

        // Electric pumping station (brick building)
        var epx = 15450;
        var epz = 150;
        makeBox(12, 8, 10, 0x8a6040, epx, 4, epz);
        makeBox(4, 10, 4, 0x706050, epx + 6, 5, epz);
        // Chimney
        makeCylinder(1, 1.2, 12, 6, 0x706050, epx + 6, 11, epz);
        // Sluice gate post
        makeBox(1, 6, 1, 0x404040, epx - 8, 3, epz);
        makeBox(1, 6, 1, 0x404040, epx - 8, 3, epz + 4);
        makeBox(10, 1, 4, 0x505050, epx - 8, 6, epz + 2);
    }

    function buildFenscapeDetails() {
        // Additional flat fenland details

        // Poplar trees lining drainage channels (characteristic of Fens)
        var treePositions = [
            [15600, 0, 50],
            [15600, 0, 100],
            [15600, 0, 150],
            [15620, 0, 50],
            [15620, 0, 100],
            [15620, 0, 150],
            [15680, 0, -50],
            [15680, 0, -100],
            [15700, 0, -50],
            [15700, 0, -100]
        ];

        for (var i = 0; i < treePositions.length; i++) {
            var tp = treePositions[i];
            // Tall thin poplar trunk
            makeCylinder(0.4, 0.5, 12, 5, 0x8b6914, tp[0], tp[1] + 6, tp[2]);
            // Narrow poplar crown
            makeCone(1.5, 10, 5, 0x228b22, tp[0], tp[1] + 17, tp[2]);
        }

        // Isolated farmsteads
        makeBox(12, 6, 10, 0xc8a060, 15480, 3, -50);
        makeCone(7, 5, 4, 0x8b4513, 15480, 8.5, -50);
        makeBox(8, 4, 6, 0xb89050, 15495, 2, -55);

        makeBox(12, 6, 10, 0xc4a058, 15750, 3, 100);
        makeCone(7, 5, 4, 0x7a3c10, 15750, 8.5, 100);

        // Flat horizon - raised embankment (sea bank / Fen bank)
        makeBox(800, 3, 8, 0x6a7a5a, 15640, 1.5, -500);

        // Bridge over drain
        makeBox(8, 1.5, 6, 0xa09080, 15640, 1.2, -200);
        makeBox(0.8, 3, 0.8, 0x909080, 15637, 2.5, -200);
        makeBox(0.8, 3, 0.8, 0x909080, 15643, 2.5, -200);
    }

    function build() {
        buildGround();
        buildLincolnCathedral();
        buildLincolnCastle();
        buildSteepHill();
        buildBostonStump();
        buildWindmill();
        buildPumpingStations();
        buildFenscapeDetails();
    }

    function update(delta) {
        // Static environment - no animation required
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
