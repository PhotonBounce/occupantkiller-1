window.WatfordJunction = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12440;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makecyl(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makecone(r, h, seg, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makelines(pts, color) {
        var geo = new THREE.BufferGeometry();
        var verts = new Float32Array(pts);
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var ls = new THREE.LineSegments(geo, mat);
        return addObj(ls);
    }

    function buildWBStudioTour() {
        var bx = X_OFFSET + 0;
        var bz = -200;

        // Main massive shed building — grey steel cladding
        makebox(200, 30, 100, 0x888888, bx, 15, bz);
        // Roof ridge
        makebox(202, 4, 6, 0x666666, bx, 32, bz);

        // Secondary shed wing
        makebox(120, 25, 80, 0x777777, bx + 140, 12.5, bz + 10);

        // WB Shield / logo plinth on facade
        makebox(20, 20, 2, 0x003399, bx - 80, 22, bz - 50);
        // WB letters (gold panel)
        makebox(14, 12, 1, 0xFFD700, bx - 80, 22, bz - 51);

        // Entrance canopy
        makebox(40, 6, 10, 0xcccccc, bx - 80, 6, bz - 55);
        // Entrance columns
        makecyl(0.6, 0.6, 8, 8, 0xaaaaaa, bx - 96, 4, bz - 55);
        makecyl(0.6, 0.6, 8, 8, 0xaaaaaa, bx - 64, 4, bz - 55);

        // Hogwarts Great Hall facade (inside — visible through large doorway suggestion)
        // Stone-grey gothic arch suggestion: tall box
        makebox(30, 28, 3, 0x999977, bx - 20, 14, bz - 48);
        // Gothic pinnacles on great hall facade
        makecone(1.5, 8, 6, 0x888866, bx - 32, 32, bz - 48);
        makecone(1.5, 8, 6, 0x888866, bx - 8, 32, bz - 48);
        makecone(1.5, 8, 6, 0x888866, bx + 8, 32, bz - 48);

        // Flying Ford Anglia — suspended car body (blue)
        makebox(4, 1.6, 8, 0x1155AA, bx + 30, 22, bz - 20);
        // Car roof
        makebox(3.2, 1, 4, 0x1155AA, bx + 30, 23.3, bz - 20);
        // Wheels (4 small spheres)
        makesphere(0.7, 6, 4, 0x222222, bx + 32, 20.5, bz - 17);
        makesphere(0.7, 6, 4, 0x222222, bx + 28, 20.5, bz - 17);
        makesphere(0.7, 6, 4, 0x222222, bx + 32, 20.5, bz - 23);
        makesphere(0.7, 6, 4, 0x222222, bx + 28, 20.5, bz - 23);
        // Suspension wire suggestion (vertical line segment pair)
        makelines([
            bx + 30, 30, bz - 20,
            bx + 30, 23, bz - 20
        ], 0xffffff);

        // Diagon Alley set — row of narrow shopfront boxes
        var diax = bx + 50;
        var diaz = bz + 20;
        var shopColors = [0xcc9933, 0x996622, 0xaa7744, 0xbb8833, 0x8855aa, 0x229966];
        for (var s = 0; s < 6; s++) {
            makebox(8, 14, 6, shopColors[s], diax + s * 9, 7, diaz);
            // Shop sign boards
            makebox(6, 2, 0.5, 0x443311, diax + s * 9, 13, diaz - 3);
            // Chimney pots
            makecyl(0.4, 0.4, 3, 6, 0x554433, diax + s * 9, 18.5, diaz - 1);
        }
        // Cobblestone ground strip for Diagon Alley
        makebox(60, 0.3, 8, 0x887766, diax + 22, 0.15, diaz + 5);

        // Car park / forecourt
        makebox(200, 0.2, 60, 0x444444, bx, 0.1, bz - 80);
        // Light poles in car park
        for (var lp = 0; lp < 5; lp++) {
            makecyl(0.2, 0.2, 10, 6, 0x555555, bx - 80 + lp * 40, 5, bz - 100);
            makebox(3, 0.5, 0.5, 0xffffcc, bx - 80 + lp * 40, 10.5, bz - 100);
        }
    }

    function buildVicarageRoad() {
        var sx = X_OFFSET + 300;
        var sz = 100;

        // Pitch (green)
        makebox(105, 0.3, 68, 0x22aa44, sx, 0.15, sz);

        // Pitch markings (white lines) — centre circle area and lines
        makelines([
            sx, 0.4, sz - 34,
            sx, 0.4, sz + 34,
            sx - 52, 0.4, sz - 34,
            sx - 52, 0.4, sz + 34,
            sx - 52, 0.4, sz - 34,
            sx + 52, 0.4, sz - 34,
            sx + 52, 0.4, sz - 34,
            sx + 52, 0.4, sz + 34,
            sx + 52, 0.4, sz + 34,
            sx - 52, 0.4, sz + 34,
            sx, 0.4, sz - 34,
            sx, 0.4, sz + 34
        ], 0xffffff);

        // Rookery End (north stand) — yellow seats
        makebox(110, 12, 14, 0xFFD700, sx, 6, sz - 48);
        // Rookery roof
        makebox(110, 2, 14, 0x888888, sx, 13, sz - 48);
        // Rookery back wall
        makebox(110, 14, 2, 0xeeeeee, sx, 7, sz - 55);

        // Rous Stand (east) — yellow seats, larger two-tier
        makebox(14, 16, 72, 0xFFD700, sx + 60, 8, sz);
        makebox(14, 2, 72, 0x888888, sx + 60, 17, sz);
        makebox(2, 18, 72, 0xeeeeee, sx + 67, 9, sz);

        // Vicarage Road End (south stand) — yellow seats
        makebox(110, 10, 12, 0xFFD700, sx, 5, sz + 46);
        makebox(110, 2, 12, 0x888888, sx, 11, sz + 46);
        makebox(110, 12, 2, 0xdddddd, sx, 6, sz + 52);

        // Graham Taylor Stand (west) — yellow seats, main stand
        makebox(14, 18, 72, 0xFFD700, sx - 60, 9, sz);
        makebox(14, 2, 72, 0x888888, sx - 60, 19, sz);
        makebox(2, 20, 72, 0xeeeeee, sx - 67, 10, sz);

        // Floodlight pylons (4 corners)
        var pylonPositions = [
            [sx - 55, sz - 38],
            [sx + 55, sz - 38],
            [sx - 55, sz + 38],
            [sx + 55, sz + 38]
        ];
        for (var p = 0; p < 4; p++) {
            makecyl(0.5, 0.5, 22, 6, 0x888888, pylonPositions[p][0], 11, pylonPositions[p][1]);
            makebox(4, 1, 4, 0xffffaa, pylonPositions[p][0], 23, pylonPositions[p][1]);
        }

        // Club shop building
        makebox(20, 6, 12, 0xFFD700, sx - 60, 3, sz - 70);
        makebox(20, 1, 12, 0x888888, sx - 60, 6.5, sz - 70);

        // Stadium exterior surrounds
        makebox(140, 1.5, 130, 0x666655, sx, 0.75, sz);
    }

    function buildGrandUnionCanal() {
        var cx = X_OFFSET + 150;
        var cz = 300;

        // Canal water (blue)
        makebox(600, 0.4, 12, 0x1166bb, cx + 50, 0.2, cz);

        // Canal banks / towpath
        makebox(600, 0.6, 5, 0x998866, cx + 50, 0.3, cz - 10);
        makebox(600, 0.6, 5, 0x998866, cx + 50, 0.3, cz + 10);

        // Towpath surface (gravel)
        makebox(600, 0.2, 8, 0xbbaa88, cx + 50, 0.1, cz - 14);

        // Narrowboat 1 — traditional red/green livery
        makebox(18, 2.2, 3.8, 0xcc2200, cx - 50, 1.3, cz);
        makebox(16, 1.2, 3.4, 0x224400, cx - 50, 2.7, cz);
        // Cabin windows
        makebox(1.5, 1, 0.3, 0x88aacc, cx - 52, 2.5, cz - 1.9);
        makebox(1.5, 1, 0.3, 0x88aacc, cx - 48, 2.5, cz - 1.9);
        // Chimney
        makecyl(0.25, 0.25, 2, 6, 0x222222, cx - 44, 4.2, cz);

        // Narrowboat 2 — blue livery
        makebox(20, 2.2, 3.8, 0x1144aa, cx + 80, 1.3, cz);
        makebox(18, 1.2, 3.4, 0x553311, cx + 80, 2.7, cz);
        makebox(1.5, 1, 0.3, 0x88aacc, cx + 78, 2.5, cz - 1.9);
        makebox(1.5, 1, 0.3, 0x88aacc, cx + 82, 2.5, cz - 1.9);
        makecyl(0.25, 0.25, 2, 6, 0x222222, cx + 86, 4.2, cz);

        // Cassiobury Park Locks — lock gates (pairs of beams)
        var lx = cx + 200;
        // Lock chamber walls
        makebox(2, 4, 16, 0x886644, lx, 2, cz);
        makebox(2, 4, 16, 0x886644, lx + 12, 2, cz);
        // Lock gate beams
        makebox(8, 0.8, 0.6, 0x554422, lx + 5, 3.5, cz - 6);
        makebox(8, 0.8, 0.6, 0x554422, lx + 5, 3.5, cz + 6);
        // Lock gate paddles
        makebox(1.2, 3, 0.4, 0x443322, lx + 2, 2.5, cz - 6);
        makebox(1.2, 3, 0.4, 0x443322, lx + 2, 2.5, cz + 6);
        // Balance beams (long arms)
        makebox(10, 0.5, 0.5, 0x332211, lx + 9, 4.5, cz - 6);
        makebox(10, 0.5, 0.5, 0x332211, lx + 9, 4.5, cz + 6);

        // Bridge over canal
        makebox(18, 1.5, 20, 0x888877, cx + 130, 2.5, cz);
        // Bridge parapets
        makebox(18, 2, 1, 0x777766, cx + 130, 3.5, cz - 10);
        makebox(18, 2, 1, 0x777766, cx + 130, 3.5, cz + 10);
        // Bridge arch under
        makecyl(6, 6, 18, 8, 0x999988, cx + 130, -0.5, cz);

        // Trees along towpath
        for (var t = 0; t < 10; t++) {
            var tx = cx - 100 + t * 60;
            makecyl(0.4, 0.4, 7, 6, 0x553300, tx, 3.5, cz - 18);
            makesphere(3, 6, 4, 0x226622, tx, 9, cz - 18);
        }
    }

    function buildWatfordHighStreet() {
        var hx = X_OFFSET + 500;
        var hz = 0;

        // Main high street ground
        makebox(200, 0.2, 18, 0x555544, hx, 0.1, hz);

        // Row of town centre buildings — north side
        var buildingData = [
            { w: 14, h: 16, d: 12, col: 0xcc9966 },
            { w: 10, h: 20, d: 12, col: 0xddbb88 },
            { w: 18, h: 12, d: 12, col: 0xbb8855 },
            { w: 12, h: 18, d: 12, col: 0xcc9977 },
            { w: 16, h: 14, d: 12, col: 0xaabb99 },
            { w: 10, h: 22, d: 12, col: 0xcc8866 },
            { w: 14, h: 16, d: 12, col: 0xddaa77 },
            { w: 12, h: 14, d: 12, col: 0xbbaa88 }
        ];

        var runx = hx - 90;
        for (var b = 0; b < buildingData.length; b++) {
            var bd = buildingData[b];
            makebox(bd.w, bd.h, bd.d, bd.col, runx + bd.w / 2, bd.h / 2, hz - 15);
            // Roofline details
            makebox(bd.w, 1, bd.d, 0x888877, runx + bd.w / 2, bd.h + 0.5, hz - 15);
            runx += bd.w + 2;
        }

        // Row of buildings — south side
        var runx2 = hx - 90;
        var buildingData2 = [
            { w: 16, h: 14, d: 12, col: 0xcc9955 },
            { w: 12, h: 18, d: 12, col: 0xddcc99 },
            { w: 10, h: 12, d: 12, col: 0xbbaa77 },
            { w: 14, h: 16, d: 12, col: 0xccbb88 },
            { w: 18, h: 10, d: 12, col: 0xaa9966 },
            { w: 10, h: 20, d: 12, col: 0xddaa88 },
            { w: 12, h: 14, d: 12, col: 0xcc9966 },
            { w: 14, h: 16, d: 12, col: 0xbbaa77 }
        ];
        for (var b2 = 0; b2 < buildingData2.length; b2++) {
            var bd2 = buildingData2[b2];
            makebox(bd2.w, bd2.h, bd2.d, bd2.col, runx2 + bd2.w / 2, bd2.h / 2, hz + 15);
            makebox(bd2.w, 1, bd2.d, 0x888877, runx2 + bd2.w / 2, bd2.h + 0.5, hz + 15);
            runx2 += bd2.w + 2;
        }

        // The Harlequin Shopping Centre — large retail shed with colourful facade
        var hqx = hx + 100;
        var hqz = hz + 60;
        makebox(80, 18, 50, 0xee4422, hqx, 9, hqz);
        // Multi-coloured facade panels (harlequin pattern suggestion)
        makebox(18, 16, 1, 0xffcc00, hqx - 28, 9, hqz - 25);
        makebox(18, 16, 1, 0x6633cc, hqx - 8, 9, hqz - 25);
        makebox(18, 16, 1, 0x22aaee, hqx + 12, 9, hqz - 25);
        makebox(18, 16, 1, 0xee2244, hqx + 32, 9, hqz - 25);
        // Roof parapet
        makebox(82, 2, 52, 0xcc3311, hqx, 19, hqz);
        // Entrance atrium
        makebox(20, 18, 6, 0x88ccee, hqx - 30, 9, hqz - 28);

        // Watford Museum — Victorian building
        var mx = hx - 60;
        var mz = hz - 80;
        makebox(22, 14, 16, 0xcc9966, mx, 7, mz);
        // Museum classical columns
        for (var mc = 0; mc < 4; mc++) {
            makecyl(0.6, 0.6, 10, 8, 0xddccaa, mx - 9 + mc * 6, 5, mz - 8);
        }
        // Museum pediment (triangular suggestion via thin sloped boxes)
        makebox(22, 3, 2, 0xcc9966, mx, 15.5, mz - 7);
        makebox(14, 1, 2, 0xcc9966, mx, 17, mz - 7);
        // Museum roof
        makebox(24, 1, 18, 0x887755, mx, 14.5, mz);

        // Market stalls in town centre
        for (var ms = 0; ms < 6; ms++) {
            makebox(4, 0.2, 3, 0xffee88, hx - 60 + ms * 22, 1.2, hz);
            // Stall canopy
            makebox(4.5, 0.3, 3.5, 0xee4422, hx - 60 + ms * 22, 2.5, hz);
            // Stall post
            makecyl(0.1, 0.1, 2.5, 4, 0x888888, hx - 62 + ms * 22, 1.25, hz - 1.5);
            makecyl(0.1, 0.1, 2.5, 4, 0x888888, hx - 58 + ms * 22, 1.25, hz - 1.5);
        }

        // Street furniture: benches, bins
        for (var sf = 0; sf < 5; sf++) {
            makebox(3, 0.4, 0.8, 0x886633, hx - 80 + sf * 40, 0.7, hz - 8);
            makecyl(0.4, 0.4, 1.2, 6, 0x444444, hx - 70 + sf * 40, 0.6, hz - 9);
        }

        // Clock tower / Watford Town Hall suggestion
        var ctx = hx - 20;
        var ctz = hz - 120;
        makebox(18, 20, 18, 0xcc9966, ctx, 10, ctz);
        makebox(8, 28, 8, 0xddaa77, ctx, 14, ctz);
        makecyl(3, 3, 6, 8, 0x886644, ctx, 31, ctz);
        makecone(2.5, 6, 8, 0x665533, ctx, 37, ctz);
        // Clock face
        makebox(4, 4, 0.5, 0xffffff, ctx, 26, ctz - 4);
    }

    function buildCassioburyPark() {
        var px = X_OFFSET - 100;
        var pz = 450;

        // Park ground (green)
        makebox(300, 0.3, 200, 0x44aa33, px, 0.15, pz);

        // Ornate Victorian gateposts (surviving from Cassiobury House)
        // Left gatepost — stone pillar with decorative cap
        makebox(3, 9, 3, 0xddccaa, px - 60, 4.5, pz - 100);
        makecyl(1.6, 1.6, 2, 8, 0xccbb99, px - 60, 10, pz - 100);
        makecone(1.4, 3, 8, 0xbbaa88, px - 60, 12.5, pz - 100);
        // Right gatepost
        makebox(3, 9, 3, 0xddccaa, px - 54, 4.5, pz - 100);
        makecyl(1.6, 1.6, 2, 8, 0xccbb99, px - 54, 10, pz - 100);
        makecone(1.4, 3, 8, 0xbbaa88, px - 54, 12.5, pz - 100);
        // Flanking lower plinths
        makebox(2, 5, 2, 0xddccaa, px - 65, 2.5, pz - 100);
        makebox(2, 5, 2, 0xddccaa, px - 49, 2.5, pz - 100);
        // Gate ironwork suggestion
        makebox(8, 5, 0.3, 0x222222, px - 57, 4, pz - 100);

        // Park entrance path
        makebox(8, 0.2, 40, 0xccbb88, px - 57, 0.1, pz - 80);

        // River Gade — winding blue strip
        makebox(160, 0.4, 6, 0x2255aa, px + 10, 0.2, pz - 20);
        makebox(80, 0.4, 6, 0x2255aa, px + 80, 0.2, pz + 10);
        makebox(60, 0.4, 6, 0x2255aa, px + 120, 0.2, pz + 30);

        // River bank vegetation
        for (var rv = 0; rv < 8; rv++) {
            makecyl(0.3, 0.3, 5, 5, 0x554400, px - 50 + rv * 22, 2.5, pz - 18);
            makesphere(2, 5, 4, 0x336622, px - 50 + rv * 22, 7, pz - 18);
        }

        // Miniature railway — track loop suggestion
        // Track sleepers
        for (var tr = 0; tr < 20; tr++) {
            makebox(5, 0.3, 0.8, 0x664422, px - 20 + tr * 8, 0.3, pz + 50);
        }
        // Track rails
        makebox(160, 0.2, 0.3, 0x888888, px + 60, 0.5, pz + 49);
        makebox(160, 0.2, 0.3, 0x888888, px + 60, 0.5, pz + 51);

        // Miniature locomotive (small red engine)
        makebox(5, 1.8, 1.8, 0xcc2200, px + 20, 1.3, pz + 50);
        makebox(2, 1.4, 1.8, 0x882200, px + 19, 2.2, pz + 50);
        makecyl(0.5, 0.6, 2.5, 8, 0xcc2200, px + 22, 2, pz + 50);
        // Smoke stack
        makecyl(0.3, 0.25, 1.2, 6, 0x333333, px + 23, 3, pz + 50);
        // Carriage
        makebox(6, 1.4, 1.8, 0x004499, px + 14, 1.2, pz + 50);
        makebox(6, 0.8, 1.8, 0x003388, px + 14, 2.1, pz + 50);

        // Mature park trees — oaks, beeches
        var treePositions = [
            [px - 80, pz + 20], [px - 60, pz + 60], [px - 40, pz - 40],
            [px + 20, pz + 80], [px + 60, pz + 70], [px + 100, pz - 50],
            [px + 140, pz + 90], [px - 100, pz + 80], [px + 40, pz - 70],
            [px - 120, pz - 30], [px + 80, pz - 80], [px + 120, pz + 60]
        ];
        for (var tp = 0; tp < treePositions.length; tp++) {
            var tpx = treePositions[tp][0];
            var tpz = treePositions[tp][1];
            makecyl(0.5, 0.7, 8, 7, 0x553300, tpx, 4, tpz);
            makesphere(4, 7, 5, 0x228833, tpx, 11, tpz);
        }

        // Bandstand — Victorian octagonal structure
        var bsx = px + 30;
        var bsz = pz + 30;
        makecyl(6, 6, 0.6, 8, 0x888866, bsx, 0.3, bsz);
        // Bandstand columns (8)
        for (var bc = 0; bc < 8; bc++) {
            var angle = bc * Math.PI * 2 / 8;
            var bcx = bsx + Math.cos(angle) * 5;
            var bcz = bsz + Math.sin(angle) * 5;
            makecyl(0.2, 0.2, 4, 6, 0x998866, bcx, 2, bcz);
        }
        // Bandstand roof
        makecone(6.5, 4, 8, 0x886644, bsx, 6.5, bsz);
        // Roof finial
        makecyl(0.2, 0.2, 1.2, 6, 0x665533, bsx, 9, bsz);

        // Park benches along main path
        for (var pb = 0; pb < 6; pb++) {
            makebox(2.5, 0.3, 0.7, 0x774422, px - 55 + pb * 18, 0.7, pz - 90 + pb * 2);
        }

        // Former Cassiobury House footprint suggestion (ruins / planting beds)
        makebox(40, 0.4, 30, 0x886633, px + 60, 0.2, pz - 60);
        makebox(42, 0.6, 2, 0x997744, px + 60, 0.3, pz - 75);
        makebox(42, 0.6, 2, 0x997744, px + 60, 0.3, pz - 45);
        makebox(2, 0.6, 32, 0x997744, px + 39, 0.3, pz - 60);
        makebox(2, 0.6, 32, 0x997744, px + 81, 0.3, pz - 60);
    }

    function build() {
        buildWBStudioTour();
        buildVicarageRoad();
        buildGrandUnionCanal();
        buildWatfordHighStreet();
        buildCassioburyPark();
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
