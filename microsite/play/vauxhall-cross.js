window.VauxhallCross = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var X_OFFSET = 11440;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObject(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObject(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObject(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObject(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObject(mesh);
    }

    function buildMI6() {
        var bx = X_OFFSET + 0;
        var bz = -200;
        var cream = 0xd4c89a;
        var green = 0x4a7a5a;
        var darkGreen = 0x2d5a3a;

        // Main base podium
        makeBox(120, 12, 80, cream, bx, 6, bz);

        // Stepped terraces - ziggurat style
        makeBox(110, 10, 70, green, bx, 17, bz);
        makeBox(100, 10, 60, cream, bx, 27, bz);
        makeBox(88, 10, 52, green, bx, 37, bz);
        makeBox(76, 10, 44, cream, bx, 47, bz);
        makeBox(64, 10, 36, green, bx, 57, bz);
        makeBox(52, 10, 28, cream, bx, 67, bz);
        makeBox(40, 10, 22, green, bx, 77, bz);

        // Penthouse / upper block
        makeBox(30, 12, 18, cream, bx, 89, bz);
        makeBox(20, 8, 12, green, bx, 99, bz);

        // Corner cylindrical towers - four corners of base
        var cornerOffsetX = 56;
        var cornerOffsetZ = 36;
        makeCylinder(7, 7, 70, 10, darkGreen, bx - cornerOffsetX, 35, bz - cornerOffsetZ);
        makeCylinder(7, 7, 70, 10, darkGreen, bx + cornerOffsetX, 35, bz - cornerOffsetZ);
        makeCylinder(7, 7, 70, 10, darkGreen, bx - cornerOffsetX, 35, bz + cornerOffsetZ);
        makeCylinder(7, 7, 70, 10, darkGreen, bx + cornerOffsetX, 35, bz + cornerOffsetZ);

        // Tower caps
        makeCylinder(7, 5, 8, 10, cream, bx - cornerOffsetX, 74, bz - cornerOffsetZ);
        makeCylinder(7, 5, 8, 10, cream, bx + cornerOffsetX, 74, bz - cornerOffsetZ);
        makeCylinder(7, 5, 8, 10, cream, bx - cornerOffsetX, 74, bz + cornerOffsetZ);
        makeCylinder(7, 5, 8, 10, cream, bx + cornerOffsetX, 74, bz + cornerOffsetZ);

        // Mid cylindrical towers
        makeCylinder(5, 5, 50, 10, darkGreen, bx - 28, 35, bz - cornerOffsetZ);
        makeCylinder(5, 5, 50, 10, darkGreen, bx + 28, 35, bz - cornerOffsetZ);
        makeCylinder(5, 5, 50, 10, darkGreen, bx - 28, 35, bz + cornerOffsetZ);
        makeCylinder(5, 5, 50, 10, darkGreen, bx + 28, 35, bz + cornerOffsetZ);

        // River frontage terrace - south face
        makeBox(130, 4, 20, cream, bx, 2, bz - 50);
        makeBox(120, 4, 14, green, bx, 6, bz - 50);

        // Decorative vertical fins
        for (var i = -3; i <= 3; i++) {
            makeBox(3, 60, 2, darkGreen, bx + i * 14, 42, bz - 40);
        }

        // Communications mast on top
        makeCylinder(1, 1, 20, 6, 0x888888, bx, 112, bz);
    }

    function buildVauxhallTower() {
        var tx = X_OFFSET + 200;
        var tz = -150;
        var glassBlue = 0x88aacc;
        var darkBlue = 0x4466aa;
        var concrete = 0xaaaaaa;

        // Base podium
        makeBox(40, 6, 40, concrete, tx, 3, tz);

        // Main tower - 50 stories with helical offset suggestion
        // Build floors in groups with slight x/z offset to suggest helical twist
        var floorH = 4;
        var totalFloors = 50;
        var floorW = 22;
        var floorD = 22;

        for (var f = 0; f < totalFloors; f++) {
            var angle = (f / totalFloors) * Math.PI * 2;
            var twist = f * 0.15;
            var fx = tx + Math.sin(angle) * 1.5;
            var fz = tz + Math.cos(angle) * 1.5;
            var fy = 6 + f * floorH + floorH * 0.5;
            var floorColor = (f % 3 === 0) ? darkBlue : glassBlue;
            makeBox(floorW, floorH - 0.5, floorD, floorColor, fx, fy, fz);
        }

        // Rooftop helipad
        var roofY = 6 + totalFloors * floorH;
        makeBox(18, 1, 18, 0xcccccc, tx, roofY + 0.5, tz);
        // Helipad H marking - simplified as thin boxes
        makeBox(2, 0.5, 10, 0xffffff, tx - 3, roofY + 1, tz);
        makeBox(2, 0.5, 10, 0xffffff, tx + 3, roofY + 1, tz);
        makeBox(8, 0.5, 2, 0xffffff, tx, roofY + 1, tz);

        // Rooftop mast
        makeCylinder(0.5, 0.5, 15, 6, 0xaaaaaa, tx, roofY + 8.5, tz);

        // Podium retail at base
        makeBox(50, 10, 20, 0xccbbaa, tx - 20, 5, tz + 30);
        makeBox(30, 8, 15, 0xbbccaa, tx + 25, 4, tz + 25);
    }

    function buildNineElms() {
        var nx = X_OFFSET + 400;
        var nz = -100;
        var glass1 = 0x99bbdd;
        var glass2 = 0xaaccbb;
        var glass3 = 0xddbbaa;
        var glass4 = 0xbbaacc;
        var concrete = 0xbbbbbb;

        // Tower 1 - 28 stories
        makeBox(24, 112, 24, glass1, nx, 56, nz);
        makeBox(22, 4, 22, 0x888888, nx, 113, nz);

        // Tower 2 - 25 stories
        makeBox(20, 100, 20, glass2, nx + 60, 50, nz + 20);
        makeBox(18, 4, 18, 0x888888, nx + 60, 103, nz + 20);

        // Tower 3 - 22 stories
        makeBox(22, 88, 22, glass3, nx + 120, 44, nz - 20);
        makeBox(20, 4, 20, 0x888888, nx + 120, 91, nz - 20);

        // Tower 4 - 30 stories
        makeBox(18, 120, 18, glass4, nx + 180, 60, nz);
        makeBox(16, 4, 16, 0x888888, nx + 180, 123, nz);

        // Tower 5 - 20 stories
        makeBox(26, 80, 20, glass1, nx + 240, 40, nz + 30);
        makeBox(24, 4, 18, 0x888888, nx + 240, 83, nz + 30);

        // Podium connecting bases
        makeBox(280, 8, 60, concrete, nx + 120, 4, nz + 10);

        // US Embassy building - large white rectangular slab
        var ex = nx + 360;
        var ez = nz - 40;
        // Embassy main building - large white fortress-like
        makeBox(120, 50, 80, 0xf0f0f0, ex, 25, ez);
        // Embassy setback upper section
        makeBox(100, 20, 60, 0xe8e8e8, ex, 60, ez);
        // Embassy security perimeter / moat suggestion
        makeBox(160, 2, 120, 0x8899aa, ex, 0.5, ez);
        // Defensive barriers/bollards row
        for (var b = -5; b <= 5; b++) {
            makeCylinder(1.5, 1.5, 4, 8, 0x444444, ex + b * 14, 2, ez - 65);
            makeCylinder(1.5, 1.5, 4, 8, 0x444444, ex + b * 14, 2, ez + 65);
        }
        for (var bs = -4; bs <= 4; bs++) {
            makeCylinder(1.5, 1.5, 4, 8, 0x444444, ex - 75, 2, ez + bs * 14);
            makeCylinder(1.5, 1.5, 4, 8, 0x444444, ex + 75, 2, ez + bs * 14);
        }
        // Flag pole
        makeCylinder(0.5, 0.5, 20, 6, 0xaaaaaa, ex + 40, 10, ez - 60);
    }

    function buildVauxhallBridge() {
        var bx = X_OFFSET + 100;
        var bz = 0;
        var stone = 0x998877;
        var steel = 0x667766;
        var lampColor = 0xccaa44;

        // Bridge deck - 5 spans
        var bridgeWidth = 200;
        var bridgeThick = 4;
        makeBox(bridgeWidth, bridgeThick, 18, steel, bx, 4, bz);

        // 6 stone piers
        for (var p = 0; p <= 5; p++) {
            var px = bx - 100 + p * 40;
            makeCylinder(6, 8, 30, 8, stone, px, -9, bz);
        }

        // Arch suggestion - slightly raised box segments between piers
        for (var a = 0; a < 5; a++) {
            var ax = bx - 80 + a * 40;
            makeBox(36, 3, 16, steel, ax, 7, bz);
        }

        // Railings - north and south edges
        for (var r = 0; r < 10; r++) {
            var rx = bx - 90 + r * 20;
            makeBox(1, 3, 1, 0x555555, rx, 8, bz - 8);
            makeBox(1, 3, 1, 0x555555, rx, 8, bz + 8);
        }
        makeBox(200, 1, 1, 0x555555, bx, 9.5, bz - 8);
        makeBox(200, 1, 1, 0x555555, bx, 9.5, bz + 8);

        // Art deco lamp standards - ornate posts
        for (var l = 0; l < 6; l++) {
            var lx = bx - 90 + l * 36;
            // Lamp post shaft
            makeCylinder(0.8, 1, 12, 6, lampColor, lx, 11, bz - 9);
            makeCylinder(0.8, 1, 12, 6, lampColor, lx, 11, bz + 9);
            // Lamp head
            makeSphere(2, 6, 6, 0xffff88, lx, 18, bz - 9);
            makeSphere(2, 6, 6, 0xffff88, lx, 18, bz + 9);
            // Decorative bracket
            makeBox(3, 1, 2, lampColor, lx, 16, bz - 9);
            makeBox(3, 1, 2, lampColor, lx, 16, bz + 9);
        }

        // Bridge approaches - road on north (south London) side
        makeBox(50, 2, 18, 0x666655, bx - 125, 3.5, bz);
        makeBox(50, 2, 18, 0x666655, bx + 125, 3.5, bz);

        // Sculpted figures suggestion (flat boxes on piers)
        for (var sf = 1; sf <= 4; sf++) {
            var sfx = bx - 100 + sf * 40;
            makeBox(3, 8, 3, 0x887766, sfx - 7, 14, bz);
            makeBox(3, 8, 3, 0x887766, sfx + 7, 14, bz);
        }
    }

    function buildThames() {
        var rx = X_OFFSET + 200;
        var rz = 40;
        var riverColor = 0x1a3a5a;
        var waterShimmer = 0x2255aa;

        // Main river surface
        makeBox(800, 1, 200, riverColor, rx, -1, rz + 60);

        // River surface highlight strips (suggest flow)
        for (var ws = 0; ws < 8; ws++) {
            makeBox(800, 0.5, 4, waterShimmer, rx, 0, rz + ws * 20 - 20);
        }

        // North bank embankment
        makeBox(800, 4, 10, 0x998877, rx, 2, rz - 45);

        // South bank embankment (Vauxhall side)
        makeBox(800, 4, 10, 0x887766, rx, 2, rz + 145);

        // River bus pier (Vauxhall Pier)
        var pierX = X_OFFSET + 60;
        var pierZ = rz - 30;
        makeBox(30, 3, 8, 0x446644, pierX, 1.5, pierZ);
        makeBox(2, 8, 2, 0x224422, pierX - 14, 6, pierZ);
        makeBox(2, 8, 2, 0x224422, pierX + 14, 6, pierZ);
        makeBox(30, 1, 1, 0x224422, pierX, 10, pierZ);
        // Gangway
        makeBox(15, 1, 3, 0x556644, pierX, 2, pierZ + 10);

        // Lambeth Bridge upstream - simplified
        var lbx = X_OFFSET - 300;
        var lbz = rz + 30;
        var lbStone = 0x887755;
        var lbRed = 0x883333;
        makeBox(160, 3, 14, lbRed, lbx, 4, lbz + 30);
        for (var lp = 0; lp <= 4; lp++) {
            makeCylinder(5, 7, 20, 8, lbStone, lbx - 80 + lp * 40, -4, lbz + 30);
        }
        // Lambeth Bridge lamp posts - characteristic obelisk shapes
        for (var ll = 0; ll <= 4; ll++) {
            makeCone(1.5, 6, 4, 0xbbaa55, lbx - 80 + ll * 40, 12, lbz + 22);
            makeCone(1.5, 6, 4, 0xbbaa55, lbx - 80 + ll * 40, 12, lbz + 38);
        }
    }

    function buildGroundPlane() {
        // Ground for the Vauxhall area
        makeBox(1000, 1, 600, 0x444433, X_OFFSET + 200, -0.5, 100);
        // Albert Embankment road
        makeBox(800, 1, 20, 0x333333, X_OFFSET + 200, 0.1, -50);
        // Vauxhall Cross junction
        makeBox(60, 1, 60, 0x333333, X_OFFSET + 100, 0.1, 50);
        // Nine Elms Lane
        makeBox(400, 1, 18, 0x333333, X_OFFSET + 500, 0.1, 60);
        // Pavements
        makeBox(800, 1, 6, 0x888877, X_OFFSET + 200, 0.2, -40);
        makeBox(800, 1, 6, 0x888877, X_OFFSET + 200, 0.2, -60);
    }

    function build() {
        buildGroundPlane();
        buildThames();
        buildVauxhallBridge();
        buildMI6();
        buildVauxhallTower();
        buildNineElms();
    }

    function update(delta) {
        // No animated elements required currently
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
