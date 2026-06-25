window.WellsBishop = (function() {
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

    function makeMat(color, options) {
        var opts = options || {};
        opts.color = color;
        return new THREE.MeshLambertMaterial(opts);
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

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(edges, mat);
        line.position.set(x, y, z);
        scene.add(line);
        objects.push(line);
        return line;
    }

    function build() {
        buildGround();
        buildBishopsPalace();
        buildVicarsClose();
        buildWestFront();
        buildMarketPlace();
        buildStCuthberts();
        buildMendipHills();
    }

    function buildGround() {
        makeBox(2400, 2, 2400, 0x6b8c45, 13920, -1, 0);
        // Moat water area
        makeBox(500, 1, 400, 0x2255aa, 13920, 0.5, -200);
    }

    function buildBishopsPalace() {
        var bx = 13920;
        var bz = -200;

        // Outer battlemented curtain wall - south
        makeBox(420, 14, 6, 0x9e8b6e, bx, 7, bz + 180);
        // Outer curtain wall - north
        makeBox(420, 14, 6, 0x9e8b6e, bx, 7, bz - 180);
        // Outer curtain wall - west
        makeBox(6, 14, 360, 0x9e8b6e, bx - 210, 7, bz);
        // Outer curtain wall - east
        makeBox(6, 14, 360, 0x9e8b6e, bx + 210, 7, bz);

        // Battlements on south wall - series of merlons
        for (var mi = 0; mi < 14; mi++) {
            makeBox(12, 4, 5, 0x9e8b6e, bx - 182 + mi * 28, 17, bz + 180);
        }
        // Battlements on north wall
        for (var ni = 0; ni < 14; ni++) {
            makeBox(12, 4, 5, 0x9e8b6e, bx - 182 + ni * 28, 17, bz - 180);
        }

        // Gatehouse - main entrance tower
        makeBox(40, 30, 18, 0x8c7a5e, bx + 210, 15, bz + 60);
        makeBox(20, 36, 22, 0x8c7a5e, bx + 210, 18, bz + 60);
        // Gatehouse archway (darker inset)
        makeBox(8, 14, 6, 0x3a2e1e, bx + 213, 7, bz + 60);
        // Gatehouse turrets
        makeCyl(5, 5, 38, 8, 0x8c7a5e, bx + 199, 19, bz + 49);
        makeCyl(5, 5, 38, 8, 0x8c7a5e, bx + 221, 19, bz + 49);
        makeCyl(5, 5, 38, 8, 0x8c7a5e, bx + 199, 19, bz + 71);
        makeCyl(5, 5, 38, 8, 0x8c7a5e, bx + 221, 19, bz + 71);
        makeCone(5, 10, 8, 0x6b5a3e, bx + 199, 43, bz + 49);
        makeCone(5, 10, 8, 0x6b5a3e, bx + 221, 43, bz + 49);
        makeCone(5, 10, 8, 0x6b5a3e, bx + 199, 43, bz + 71);
        makeCone(5, 10, 8, 0x6b5a3e, bx + 221, 43, bz + 71);

        // Drawbridge (lowered)
        makeBox(12, 1.5, 22, 0x6b4e2e, bx + 218, 0.8, bz + 60);

        // Main Palace building
        makeBox(120, 28, 70, 0x9e8b6e, bx + 60, 14, bz - 60);
        makeBox(120, 4, 70, 0x8c7a5e, bx + 60, 29, bz - 60);

        // Bishop's Palace Hall
        makeBox(80, 22, 45, 0xa08870, bx - 40, 11, bz - 80);
        // Hall roof
        makeBox(82, 8, 47, 0x7a6655, bx - 40, 25, bz - 80);

        // 14th Century Chapel
        makeBox(55, 26, 32, 0x9e8b6e, bx - 130, 13, bz - 40);
        // Chapel east window (Gothic arch shape using stacked boxes)
        makeBox(10, 20, 2, 0x2233aa, bx - 157, 13, bz - 40);
        makeBox(8, 4, 2, 0x2233aa, bx - 157, 24, bz - 40);
        // Chapel roof
        makeBox(57, 10, 34, 0x7a6655, bx - 130, 30, bz - 40);
        makeCyl(3, 3, 28, 6, 0x8c7a5e, bx - 128, 13, bz - 56);
        makeCyl(3, 3, 28, 6, 0x8c7a5e, bx - 128, 13, bz - 24);

        // Ruined Great Hall - partial walls only
        makeBox(90, 18, 4, 0x8c7a5e, bx + 20, 9, bz + 90);
        makeBox(90, 8, 4, 0x8c7a5e, bx + 20, 4, bz + 20);
        makeBox(4, 18, 74, 0x8c7a5e, bx - 25, 9, bz + 55);
        makeBox(4, 12, 74, 0x8c7a5e, bx + 65, 6, bz + 55);
        // Ruined wall tops - jagged feel via smaller boxes
        makeBox(20, 5, 4, 0x7a6a5a, bx - 10, 20, bz + 90);
        makeBox(15, 8, 4, 0x7a6a5a, bx + 30, 22, bz + 90);
        makeBox(18, 3, 4, 0x7a6a5a, bx + 55, 19, bz + 90);

        // Moat - water surface boxes
        makeBox(480, 1, 40, 0x1a4499, bx, 0, bz + 200);
        makeBox(480, 1, 40, 0x1a4499, bx, 0, bz - 200);
        makeBox(40, 1, 360, 0x1a4499, bx - 230, 0, bz);
        makeBox(40, 1, 360, 0x1a4499, bx + 230, 0, bz);

        // Swans in the moat - white spheres (famous bell-ringing swans)
        makeSphere(3.5, 8, 6, 0xffffff, bx + 240, 3, bz + 150);
        makeSphere(3.5, 8, 6, 0xffffff, bx + 245, 3, bz + 130);
        makeSphere(3.5, 8, 6, 0xffffff, bx + 238, 3, bz + 110);
        makeSphere(3.5, 8, 6, 0xffffff, bx + 243, 3, bz + 90);
        makeSphere(3.5, 8, 6, 0xffffff, bx - 242, 3, bz + 140);
        makeSphere(3.5, 8, 6, 0xffffff, bx - 238, 3, bz + 110);
        // Swan necks (elongated spheres tilted - approximate with small cylinder)
        makeCyl(1, 0.8, 5, 6, 0xffffff, bx + 240, 6, bz + 148);
        makeCyl(1, 0.8, 5, 6, 0xffffff, bx + 245, 6, bz + 128);
        makeCyl(1, 0.8, 5, 6, 0xffffff, bx + 238, 6, bz + 108);

        // Garden walls
        makeBox(160, 8, 4, 0x9e8b6e, bx - 80, 4, bz - 170);
        makeBox(4, 8, 100, 0x9e8b6e, bx - 160, 4, bz - 120);
        makeBox(4, 8, 100, 0x9e8b6e, bx, 4, bz - 120);
        // Garden hedge / lawn
        makeBox(156, 1, 96, 0x4a7a30, bx - 80, 1, bz - 120);

        // Corner towers on curtain wall
        makeCyl(8, 8, 20, 8, 0x9e8b6e, bx - 210, 10, bz + 180);
        makeCyl(8, 8, 20, 8, 0x9e8b6e, bx + 210, 10, bz + 180);
        makeCyl(8, 8, 20, 8, 0x9e8b6e, bx - 210, 10, bz - 180);
        makeCyl(8, 8, 20, 8, 0x9e8b6e, bx + 210, 10, bz - 180);
        makeCone(8, 16, 8, 0x7a6655, bx - 210, 27, bz + 180);
        makeCone(8, 16, 8, 0x7a6655, bx + 210, 27, bz + 180);
        makeCone(8, 16, 8, 0x7a6655, bx - 210, 27, bz - 180);
        makeCone(8, 16, 8, 0x7a6655, bx + 210, 27, bz - 180);
    }

    function buildVicarsClose() {
        var vx = 13920;
        var vz = 220;
        var streetLen = 540;
        var houseW = 14;
        var houseH = 22;
        var houseD = 18;
        var houseSpacing = 20;
        var numHouses = 27;

        // Cobbled street surface
        makeBox(18, 0.5, streetLen, 0x887766, vx, 0.3, vz + streetLen / 2);

        // Chain Gate link to cathedral (north end)
        makeBox(22, 14, 10, 0x9e8b6e, vx, 7, vz);
        makeBox(10, 10, 6, 0x3a2e1e, vx, 5, vz);
        makeBox(22, 4, 10, 0x8c7a5e, vx, 15, vz);

        // 27 Gothic houses in two rows
        for (var hi = 0; hi < numHouses; hi++) {
            var hz = vz + 20 + hi * houseSpacing;

            // West row houses
            var wxOff = vx - 24;
            // House body
            makeBox(houseW, houseH, houseD, 0xc8aa77, wxOff, houseH / 2, hz);
            // Roof
            makeBox(houseW + 2, 7, houseD + 2, 0x7a5a3a, wxOff, houseH + 3, hz);
            // Chimney
            makeCyl(1.5, 1.5, 8, 4, 0x8a6a4a, wxOff - 3, houseH + 8, hz - 4);
            makeCyl(1.5, 1.5, 8, 4, 0x8a6a4a, wxOff + 3, houseH + 8, hz + 4);
            // Gothic window (tall narrow)
            makeBox(3, 9, 1, 0x2244aa, wxOff - 7, houseH / 2 + 2, hz);
            makeBox(3, 2, 1, 0x2244aa, wxOff - 7, houseH / 2 + 8, hz);
            // Door
            makeBox(4, 8, 1, 0x5a3a1a, wxOff - 7, 4, hz - 4);

            // East row houses
            var exOff = vx + 24;
            makeBox(houseW, houseH, houseD, 0xc8aa77, exOff, houseH / 2, hz);
            makeBox(houseW + 2, 7, houseD + 2, 0x7a5a3a, exOff, houseH + 3, hz);
            makeCyl(1.5, 1.5, 8, 4, 0x8a6a4a, exOff - 3, houseH + 8, hz - 4);
            makeCyl(1.5, 1.5, 8, 4, 0x8a6a4a, exOff + 3, houseH + 8, hz + 4);
            makeBox(3, 9, 1, 0x2244aa, exOff + 7, houseH / 2 + 2, hz);
            makeBox(3, 2, 1, 0x2244aa, exOff + 7, houseH / 2 + 8, hz);
            makeBox(4, 8, 1, 0x5a3a1a, exOff + 7, 4, hz + 4);
        }

        // End chapel at north end of Vicars Close
        makeBox(30, 18, 20, 0x9e8b6e, vx, 9, vz + 15 + numHouses * houseSpacing);
        makeBox(32, 6, 22, 0x8a7a5e, vx, 20, vz + 15 + numHouses * houseSpacing);
    }

    function buildWestFront() {
        var wx = 13920;
        var wz = 120;

        // West facade base — great screen width
        makeBox(280, 5, 16, 0xd4c4a0, wx, 2.5, wz);

        // Central nave section of west front
        makeBox(100, 70, 14, 0xd4c4a0, wx, 35, wz);

        // North aisle / tower base
        makeBox(80, 55, 14, 0xd4c4a0, wx - 130, 27, wz);
        // South aisle / tower base
        makeBox(80, 55, 14, 0xd4c4a0, wx + 130, 27, wz);

        // Twin towers above
        makeBox(68, 80, 18, 0xc8b890, wx - 130, 95, wz);
        makeBox(68, 80, 18, 0xc8b890, wx + 130, 95, wz);

        // Pointed spires on towers
        makeCone(22, 60, 8, 0xb8a880, wx - 130, 165, wz);
        makeCone(22, 60, 8, 0xb8a880, wx + 130, 165, wz);

        // Pinnacles on tower corners
        makeCone(4, 18, 6, 0xb8a880, wx - 161, 140, wz - 6);
        makeCone(4, 18, 6, 0xb8a880, wx - 99, 140, wz - 6);
        makeCone(4, 18, 6, 0xb8a880, wx - 161, 140, wz + 6);
        makeCone(4, 18, 6, 0xb8a880, wx - 99, 140, wz + 6);
        makeCone(4, 18, 6, 0xb8a880, wx + 99, 140, wz - 6);
        makeCone(4, 18, 6, 0xb8a880, wx + 161, 140, wz - 6);
        makeCone(4, 18, 6, 0xb8a880, wx + 99, 140, wz + 6);
        makeCone(4, 18, 6, 0xb8a880, wx + 161, 140, wz + 6);

        // Great west screen — sculpture niches (300+ medieval figures approximated)
        // Three horizontal bands of niches
        for (var si = 0; si < 18; si++) {
            // Lower tier sculptures
            makeBox(5, 9, 2, 0xc4b498, wx - 126 + si * 14, 12, wz - 7);
            makeBox(3, 3, 2, 0xaa9878, wx - 126 + si * 14, 23, wz - 7);
        }
        for (var sj = 0; sj < 18; sj++) {
            // Middle tier
            makeBox(5, 9, 2, 0xc4b498, wx - 126 + sj * 14, 30, wz - 7);
            makeBox(3, 3, 2, 0xaa9878, wx - 126 + sj * 14, 41, wz - 7);
        }
        for (var sk = 0; sk < 16; sk++) {
            // Upper tier (narrower central section)
            makeBox(5, 9, 2, 0xc4b498, wx - 112 + sk * 14, 48, wz - 7);
        }
        // Side wing sculptures
        for (var sl = 0; sl < 5; sl++) {
            makeBox(5, 9, 2, 0xc4b498, wx - 168 + sl * 14, 20, wz - 7);
            makeBox(5, 9, 2, 0xc4b498, wx + 102 + sl * 14, 20, wz - 7);
        }

        // Central doorway - triple portal
        makeBox(14, 22, 5, 0x3a3020, wx - 18, 11, wz - 8);
        makeBox(14, 22, 5, 0x3a3020, wx, 11, wz - 8);
        makeBox(14, 22, 5, 0x3a3020, wx + 18, 11, wz - 8);
        // Pointed arches over doors
        makeCone(7, 10, 4, 0xc4b498, wx - 18, 25, wz - 7);
        makeCone(7, 10, 4, 0xc4b498, wx, 25, wz - 7);
        makeCone(7, 10, 4, 0xc4b498, wx + 18, 25, wz - 7);
        // Tympanum over central door
        makeBox(14, 8, 3, 0xb4a488, wx, 32, wz - 7);

        // Great west window
        makeBox(30, 24, 3, 0x2255aa, wx, 56, wz - 7);
        // Tracery dividers
        makeBox(2, 24, 3, 0xd4c4a0, wx - 8, 56, wz - 7);
        makeBox(2, 24, 3, 0xd4c4a0, wx + 8, 56, wz - 7);

        // Scissor arches visible through doorway (interior glimpse)
        makeBox(50, 4, 3, 0xc4b498, wx, 40, wz + 10);
        makeBox(4, 30, 3, 0xc4b498, wx - 25, 25, wz + 10);
        makeBox(4, 30, 3, 0xc4b498, wx + 25, 25, wz + 10);
        // Crossing diagonal members (scissor arch shape)
        makeBox(55, 4, 3, 0xb4a488, wx, 35, wz + 12);

        // Cathedral nave behind west front
        makeBox(100, 65, 200, 0xc8b890, wx, 32, wz + 110);
        makeBox(80, 40, 200, 0xc0b088, wx - 90, 20, wz + 110);
        makeBox(80, 40, 200, 0xc0b088, wx + 90, 20, wz + 110);
        // Nave roof
        makeBox(102, 14, 202, 0xaa9878, wx, 71, wz + 110);

        // Chapter House (octagonal approximation)
        makeCyl(40, 40, 40, 8, 0xc8b890, wx + 140, 20, wz + 160);
        makeCyl(38, 38, 6, 8, 0xb8a880, wx + 140, 43, wz + 160);
        makeCone(35, 30, 8, 0xaa9870, wx + 140, 61, wz + 160);

        // Cloisters
        makeBox(140, 20, 8, 0xc0b080, wx - 60, 10, wz + 200);
        makeBox(8, 20, 120, 0xc0b080, wx - 130, 10, wz + 145);
    }

    function buildMarketPlace() {
        var mx = 13920;
        var mz = 600;

        // Market square paving
        makeBox(240, 0.5, 200, 0xaaa090, mx, 0.3, mz);

        // Town Hall - Georgian
        makeBox(60, 28, 40, 0xd4c8a8, mx - 70, 14, mz - 80);
        // Portico columns
        makeCyl(2.5, 2.5, 22, 8, 0xe0d8c0, mx - 84, 11, mz - 100);
        makeCyl(2.5, 2.5, 22, 8, 0xe0d8c0, mx - 76, 11, mz - 100);
        makeCyl(2.5, 2.5, 22, 8, 0xe0d8c0, mx - 68, 11, mz - 100);
        makeCyl(2.5, 2.5, 22, 8, 0xe0d8c0, mx - 60, 11, mz - 100);
        makeCyl(2.5, 2.5, 22, 8, 0xe0d8c0, mx - 52, 11, mz - 100);
        // Town Hall pediment
        makeBox(64, 10, 6, 0xd4c8a8, mx - 70, 31, mz - 100);
        makeCone(32, 16, 4, 0xd4c8a8, mx - 70, 39, mz - 100);
        // Clock tower
        makeBox(14, 50, 14, 0xc8bc9c, mx - 70, 25, mz - 80);
        makeBox(16, 4, 16, 0xb8ac8c, mx - 70, 52, mz - 80);
        makeCyl(6, 6, 10, 4, 0xc0b490, mx - 70, 59, mz - 80);
        makeCone(6, 14, 4, 0xaa9878, mx - 70, 68, mz - 80);

        // Crown Hotel
        makeBox(50, 24, 36, 0xd4b888, mx + 80, 12, mz - 78);
        makeBox(52, 6, 38, 0xc4a878, mx + 80, 26, mz - 78);
        // Hotel windows
        for (var hwi = 0; hwi < 4; hwi++) {
            makeBox(5, 8, 2, 0x4488cc, mx + 58 + hwi * 12, 16, mz - 96);
            makeBox(5, 8, 2, 0x4488cc, mx + 58 + hwi * 12, 26, mz - 96);
        }
        // Hotel sign / entrance
        makeBox(12, 12, 2, 0x3a2e1e, mx + 80, 6, mz - 97);
        makeBox(16, 4, 38, 0xc4a878, mx + 80, 14, mz - 60);

        // Market Cross monument (medieval hexagonal structure)
        makeCyl(14, 16, 4, 6, 0xd8c8a8, mx + 10, 2, mz);
        makeCyl(10, 12, 3, 6, 0xd8c8a8, mx + 10, 6, mz);
        // Six columns of market cross
        for (var mci = 0; mci < 6; mci++) {
            var mcAngle = mci * Math.PI / 3;
            makeCyl(1.5, 1.5, 18, 6, 0xc8b898, mx + 10 + Math.cos(mcAngle) * 10, 11, mz + Math.sin(mcAngle) * 10);
        }
        makeBox(22, 4, 22, 0xc8b898, mx + 10, 22, mz);
        makeCone(10, 24, 6, 0xb8a888, mx + 10, 34, mz);
        // Cross on top
        makeBox(2, 12, 2, 0xa8987a, mx + 10, 49, mz);
        makeBox(8, 2, 2, 0xa8987a, mx + 10, 54, mz);

        // Georgian shops - north side of square
        for (var gsi = 0; gsi < 6; gsi++) {
            makeBox(34, 20, 28, 0xd4c0a0, mx - 110 + gsi * 36, 10, mz - 86);
            makeBox(36, 3, 30, 0xc4b090, mx - 110 + gsi * 36, 21, mz - 86);
            // Shop window
            makeBox(16, 10, 2, 0x88aabb, mx - 110 + gsi * 36, 6, mz - 100);
            // Upper windows
            makeBox(6, 7, 2, 0x88aabb, mx - 118 + gsi * 36, 15, mz - 100);
            makeBox(6, 7, 2, 0x88aabb, mx - 104 + gsi * 36, 15, mz - 100);
        }

        // East side shops
        for (var esi = 0; esi < 4; esi++) {
            makeBox(28, 20, 32, 0xd0bc9c, mx + 140, 10, mz - 80 + esi * 34);
            makeBox(30, 3, 34, 0xc0ac8c, mx + 140, 21, mz - 80 + esi * 34);
            makeBox(14, 10, 2, 0x88aabb, mx + 155, 6, mz - 80 + esi * 34);
        }
    }

    function buildStCuthberts() {
        var sx = 13920;
        var sz = 800;

        // Nave
        makeBox(90, 30, 55, 0xccc0a0, sx, 15, sz);
        // Aisles
        makeBox(90, 22, 22, 0xc0b498, sx - 56, 11, sz);
        makeBox(90, 22, 22, 0xc0b498, sx + 56, 11, sz);

        // Chancel
        makeBox(50, 28, 40, 0xccc0a0, sx, 14, sz + 60);
        // Choir
        makeBox(40, 24, 30, 0xc4b89a, sx, 12, sz + 95);

        // Nave roof
        makeBox(92, 12, 57, 0xaa9878, sx, 37, sz);
        // Chancel roof
        makeBox(52, 10, 42, 0xaa9878, sx, 34, sz + 60);

        // Perpendicular Tower - Somerset style, very elaborate
        makeBox(32, 90, 32, 0xccc0a0, sx, 45, sz - 35);
        // Tower buttresses
        makeBox(8, 90, 8, 0xc0b490, sx - 20, 45, sz - 55);
        makeBox(8, 90, 8, 0xc0b490, sx + 20, 45, sz - 55);
        makeBox(8, 90, 8, 0xc0b490, sx - 20, 45, sz - 15);
        makeBox(8, 90, 8, 0xc0b490, sx + 20, 45, sz - 15);
        // Tower stages / string courses
        makeBox(36, 3, 36, 0xb8ac8c, sx, 35, sz - 35);
        makeBox(36, 3, 36, 0xb8ac8c, sx, 55, sz - 35);
        makeBox(36, 3, 36, 0xb8ac8c, sx, 72, sz - 35);
        // Tower belfry windows
        makeBox(6, 14, 2, 0x2244aa, sx - 16, 64, sz - 51);
        makeBox(6, 14, 2, 0x2244aa, sx + 16, 64, sz - 51);
        makeBox(2, 14, 6, 0x2244aa, sx - 17, 64, sz - 35);
        makeBox(2, 14, 6, 0x2244aa, sx + 17, 64, sz - 35);
        // Tower top battlements
        for (var tbi = 0; tbi < 4; tbi++) {
            makeBox(6, 6, 5, 0xc0b490, sx - 12 + tbi * 8, 94, sz - 51);
            makeBox(5, 6, 6, 0xc0b490, sx - 17, 94, sz - 46 + tbi * 8);
            makeBox(5, 6, 6, 0xc0b490, sx + 17, 94, sz - 46 + tbi * 8);
        }
        // Corner pinnacles on tower
        makeCone(4, 20, 6, 0xb0a480, sx - 20, 102, sz - 55);
        makeCone(4, 20, 6, 0xb0a480, sx + 20, 102, sz - 55);
        makeCone(4, 20, 6, 0xb0a480, sx - 20, 102, sz - 15);
        makeCone(4, 20, 6, 0xb0a480, sx + 20, 102, sz - 15);

        // Rood screen (carved, visible through chancel arch)
        makeBox(70, 22, 3, 0xaa8855, sx, 11, sz + 40);
        // Rood screen tracery details
        for (var rsi = 0; rsi < 8; rsi++) {
            makeBox(4, 20, 2, 0xc8a870, sx - 30 + rsi * 8, 11, sz + 40);
        }
        makeBox(70, 3, 3, 0xaa8855, sx, 23, sz + 40);

        // Porch
        makeBox(24, 22, 18, 0xc8bc9c, sx - 45, 11, sz - 38);
        makeBox(26, 4, 20, 0xb8ac8c, sx - 45, 23, sz - 38);
        makeCone(12, 14, 4, 0xaa9878, sx - 45, 29, sz - 38);

        // Nave windows - Perpendicular Gothic
        for (var nwi = 0; nwi < 5; nwi++) {
            makeBox(10, 18, 2, 0x4477bb, sx - 30 + nwi * 14, 18, sz - 27);
            makeBox(10, 18, 2, 0x4477bb, sx - 30 + nwi * 14, 18, sz + 27);
            makeBox(8, 4, 2, 0x4477bb, sx - 30 + nwi * 14, 28, sz - 27);
            makeBox(8, 4, 2, 0x4477bb, sx - 30 + nwi * 14, 28, sz + 27);
        }
    }

    function buildMendipHills() {
        var hx = 13920;
        var hz = 1200;

        // Main Mendip ridge - limestone hills
        for (var ri = 0; ri < 12; ri++) {
            var rOffset = ri * 100 - 550;
            var rHeight = 80 + Math.sin(ri * 0.8) * 40;
            var rWidth = 140 + Math.cos(ri * 0.5) * 20;
            makeBox(rWidth, rHeight, 180, 0x9aaa88, hx + rOffset, rHeight / 2, hz);
        }

        // Wookey Hole caves entrance area
        var cx = hx - 350;
        var cz = hz - 60;
        // Cave mouth hillside
        makeBox(120, 70, 100, 0x8a9878, cx, 35, cz);
        // Cave entrance arch
        makeBox(24, 26, 8, 0x2a2a2a, cx, 13, cz - 50);
        makeBox(30, 6, 8, 0x3a3a3a, cx, 26, cz - 50);
        makeSphere(12, 8, 6, 0x1a1a2a, cx, 20, cz - 50);
        // Cave cliffs above
        makeBox(100, 50, 20, 0x8a9070, cx, 60, cz - 55);
        // Stalactites visible at entrance
        makeCone(2, 8, 5, 0x9a9a8a, cx - 8, 22, cz - 46);
        makeCone(2, 8, 5, 0x9a9a8a, cx, 22, cz - 46);
        makeCone(2, 8, 5, 0x9a9a8a, cx + 8, 22, cz - 46);

        // Paper mill building by the River Axe
        makeBox(50, 18, 35, 0xd4c8a0, cx + 60, 9, cz + 30);
        makeBox(52, 3, 37, 0xc4b890, cx + 60, 19, cz + 30);
        // Mill chimney
        makeCyl(4, 5, 35, 8, 0xaa9980, cx + 75, 17, cz + 20);
        makeCyl(4, 3, 4, 8, 0x888878, cx + 75, 37, cz + 20);
        // Mill wheel area
        makeCyl(14, 14, 5, 16, 0x6a5a4a, cx + 35, 9, cz + 12);

        // Tourist centre / visitor buildings
        makeBox(40, 10, 30, 0xd4d0c0, cx + 20, 5, cz + 70);
        makeBox(42, 2, 32, 0xc0bca8, cx + 20, 11, cz + 70);
        makeBox(40, 10, 30, 0xd4d0c0, cx + 65, 5, cz + 70);
        makeBox(42, 2, 32, 0xc0bca8, cx + 65, 11, cz + 70);
        // Car park surface
        makeBox(130, 0.4, 50, 0x808078, cx + 40, 0.2, cz + 110);

        // Ebbor Gorge - rocky outcrop to east
        makeBox(80, 60, 60, 0x9a9888, hx + 300, 30, hz - 30);
        makeBox(50, 40, 40, 0x8a8878, hx + 360, 50, hz - 40);
        makeCone(20, 30, 6, 0x9a9888, hx + 360, 80, hz - 40);

        // Farmhouses dotted on hillside
        makeBox(22, 10, 16, 0xd0c8a8, hx - 100, 85, hz - 20);
        makeBox(24, 4, 18, 0x9a8a6a, hx - 100, 93, hz - 20);
        makeBox(22, 10, 16, 0xd0c8a8, hx + 160, 68, hz - 30);
        makeBox(24, 4, 18, 0x9a8a6a, hx + 160, 76, hz - 30);

        // Limestone outcrop features
        makeBox(30, 15, 20, 0xb0aa98, hx - 200, 97, hz - 40);
        makeBox(18, 20, 14, 0xa8a290, hx - 220, 100, hz - 20);
        makeBox(25, 12, 18, 0xb0aa98, hx + 280, 82, hz - 35);

        // Sheep on hillside (small white sphere clusters)
        makeSphere(2, 5, 4, 0xeeeeee, hx - 80, 78, hz - 50);
        makeSphere(2, 5, 4, 0xeeeeee, hx - 70, 78, hz - 45);
        makeSphere(2, 5, 4, 0xeeeeee, hx - 90, 80, hz - 52);
        makeSphere(2, 5, 4, 0xeeeeee, hx + 100, 70, hz - 48);
        makeSphere(2, 5, 4, 0xeeeeee, hx + 110, 72, hz - 44);
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
