window.SouthendSeafront = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12320;

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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry();
        var verts = new Float32Array(points);
        geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
        var mat = new THREE.LineBasicMaterial({ color: color });
        var mesh = new THREE.LineSegments(geo, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildEstuary() {
        // Wide grey-green tidal water base
        makeBox(8000, 2, 14000, 0x4a6b5a, X_OFFSET, -1, 1000);
        // Tidal wet sand / mudflat strips
        makeBox(800, 1, 14000, 0x8a7c60, X_OFFSET - 1600, 0, 1000);
        makeBox(600, 1, 14000, 0x9a8c70, X_OFFSET - 2400, 0, 1000);
    }

    function buildBeach() {
        // Golden sandy beach strip along seafront
        makeBox(600, 2, 3000, 0xd4b870, X_OFFSET - 200, 0.5, 0);
        // Beach promenade / esplanade
        makeBox(80, 3, 3000, 0xccbbaa, X_OFFSET + 220, 1, 0);
        // Seawall
        makeBox(20, 8, 3000, 0x888880, X_OFFSET + 265, 3, 0);
    }

    function buildPier() {
        // -------------------------------------------------------
        // Southend Pier — world's longest at 7km
        // Extending south (positive Z) into the Thames Estuary
        // -------------------------------------------------------

        var PX = X_OFFSET + 50;
        var PZ_START = 200;
        var PIER_LEN = 7000;

        // Pier deck — main walkway platform
        makeBox(20, 3, PIER_LEN, 0x8b7355, PX, 1.5, PZ_START + PIER_LEN / 2);

        // Pier support legs every 100m along the pier
        for (var pi = 0; pi < 70; pi++) {
            var pz = PZ_START + pi * 100 + 50;
            // Left leg
            makeCylinder(0.8, 0.8, 12, 6, 0x666655, PX - 8, -5, pz);
            // Right leg
            makeCylinder(0.8, 0.8, 12, 6, 0x666655, PX + 8, -5, pz);
            // Cross-brace
            var bracePoints = [
                PX - 8, -4, pz,  PX + 8, -4, pz,
                PX - 8, -10, pz, PX + 8, -10, pz,
                PX - 8, -4, pz,  PX - 8, -10, pz,
                PX + 8, -4, pz,  PX + 8, -10, pz
            ];
            makeLines(bracePoints, 0x555544);
        }

        // Pier railway tracks (LineSegments)
        var railPoints = [];
        var RAIL_SEGS = 140;
        for (var ri = 0; ri < RAIL_SEGS; ri++) {
            var rz1 = PZ_START + ri * 50;
            var rz2 = PZ_START + (ri + 1) * 50;
            // Left rail
            railPoints.push(PX - 4, 3.5, rz1, PX - 4, 3.5, rz2);
            // Right rail
            railPoints.push(PX + 4, 3.5, rz1, PX + 4, 3.5, rz2);
            // Sleepers every 50m segment
            railPoints.push(PX - 4, 3.5, rz1 + 10, PX + 4, 3.5, rz1 + 10);
            railPoints.push(PX - 4, 3.5, rz1 + 30, PX + 4, 3.5, rz1 + 30);
        }
        makeLines(railPoints, 0x444433);

        // Pier-head complex at far end
        var PHZ = PZ_START + PIER_LEN - 80;
        // Main pavilion building
        makeBox(80, 16, 60, 0xddccaa, PX, 8, PHZ);
        // Pavilion roof
        makeBox(90, 4, 70, 0x8b3a3a, PX, 17, PHZ);
        // Pavilion windows — decorative strips
        makeBox(70, 6, 2, 0x99ccdd, PX, 10, PHZ - 30);
        makeBox(70, 6, 2, 0x99ccdd, PX, 10, PHZ + 30);
        // Lifeboat station on pier-head
        makeBox(30, 12, 40, 0xee5522, PX + 60, 6, PHZ);
        makeCylinder(2, 2, 20, 8, 0xff2200, PX + 60, 16, PHZ);
        // Pier-head jetty extension
        makeBox(120, 2, 20, 0x7a6345, PX, 1.5, PHZ + 110);
        // Signal mast
        makeCylinder(0.5, 0.5, 25, 6, 0x334455, PX, 14, PHZ - 20);
        // Mast crossbar
        makeBox(20, 1, 1, 0x334455, PX, 24, PHZ - 20);
    }

    function buildAdventureIsland() {
        // -------------------------------------------------------
        // Adventure Island — seafront funfair
        // Located west of pier, on the seafront
        // -------------------------------------------------------

        var AIX = X_OFFSET - 600;
        var AIZ = -400;

        // Perimeter fence / boundary
        makeBox(500, 6, 4, 0xee4444, AIX, 3, AIZ - 200);
        makeBox(500, 6, 4, 0xee4444, AIX, 3, AIZ + 200);
        makeBox(4, 6, 400, 0xee4444, AIX - 250, 3, AIZ);
        makeBox(4, 6, 400, 0xee4444, AIX + 250, 3, AIZ);

        // Entrance arch
        makeBox(80, 3, 8, 0xff6600, AIX, 16, AIZ - 202);
        makeCylinder(3, 3, 18, 8, 0xff6600, AIX - 40, 9, AIZ - 202);
        makeCylinder(3, 3, 18, 8, 0xff6600, AIX + 40, 9, AIZ - 202);

        // ----- Big Wheel -----
        var BWX = AIX + 100;
        var BWZ = AIZ - 80;
        // Wheel rim — horizontal ring approximated as cylinder shell
        makeCylinder(40, 40, 3, 24, 0x2255cc, BWX, 45, BWZ);
        // Hub
        makeCylinder(5, 5, 4, 8, 0xdddddd, BWX, 45, BWZ);
        // Spokes as LineSegments
        var spokePoints = [];
        for (var s = 0; s < 12; s++) {
            var ang = (s / 12) * Math.PI * 2;
            var sx = BWX + Math.cos(ang) * 38;
            var sy = 45 + Math.sin(ang) * 38;
            spokePoints.push(BWX, 45, BWZ, sx, sy, BWZ);
        }
        makeLines(spokePoints, 0xaaaacc);
        // Wheel support legs
        makeCylinder(2, 2, 50, 6, 0x444466, BWX - 18, 25, BWZ + 4);
        makeCylinder(2, 2, 50, 6, 0x444466, BWX + 18, 25, BWZ + 4);

        // ----- Roller Coaster Frame -----
        var RCX = AIX - 100;
        var RCZ = AIZ + 50;
        // Vertical support towers
        makeBox(5, 50, 5, 0xcc8833, RCX - 60, 25, RCZ);
        makeBox(5, 50, 5, 0xcc8833, RCX - 60, 25, RCZ + 80);
        makeBox(5, 50, 5, 0xcc8833, RCX + 60, 25, RCZ);
        makeBox(5, 50, 5, 0xcc8833, RCX + 60, 25, RCZ + 80);
        makeBox(5, 40, 5, 0xcc8833, RCX, 20, RCZ);
        makeBox(5, 40, 5, 0xcc8833, RCX, 20, RCZ + 80);
        // Horizontal track beams
        makeBox(130, 4, 5, 0xaa6622, RCX, 50, RCZ);
        makeBox(130, 4, 5, 0xaa6622, RCX, 50, RCZ + 80);
        makeBox(5, 4, 90, 0xaa6622, RCX - 60, 50, RCZ + 40);
        makeBox(5, 4, 90, 0xaa6622, RCX + 60, 50, RCZ + 40);
        // Coaster frame X-bracing
        var rcBrace = [
            RCX - 60, 0, RCZ, RCX - 60, 50, RCZ + 80,
            RCX - 60, 50, RCZ, RCX - 60, 0, RCZ + 80,
            RCX + 60, 0, RCZ, RCX + 60, 50, RCZ + 80,
            RCX + 60, 50, RCZ, RCX + 60, 0, RCZ + 80
        ];
        makeLines(rcBrace, 0x996611);
        // Mid-height cross supports
        for (var rc = 0; rc < 6; rc++) {
            var rcz = RCZ + rc * 16;
            makeBox(130, 3, 3, 0xbb7722, RCX, 26 + rc * 4, rcz);
        }

        // ----- Log Flume (winding channel) -----
        var LFX = AIX + 60;
        var LFZ = AIZ + 100;
        // Water channel sections
        makeBox(10, 4, 120, 0x2266aa, LFX, 2, LFZ);
        makeBox(10, 4, 120, 0x2266aa, LFX + 60, 2, LFZ + 120);
        makeBox(60, 4, 10, 0x2266aa, LFX + 30, 2, LFZ + 60);
        // Flume channel walls
        makeBox(4, 6, 120, 0x885533, LFX - 7, 3, LFZ);
        makeBox(4, 6, 120, 0x885533, LFX + 7, 3, LFZ);
        makeBox(4, 6, 120, 0x885533, LFX + 53, 3, LFZ + 120);
        makeBox(4, 6, 120, 0x885533, LFX + 67, 3, LFZ + 120);
        // Lift hill
        makeBox(10, 4, 80, 0x2266aa, LFX, 12, LFZ - 100);
        makeBox(5, 30, 5, 0x775522, LFX - 6, 15, LFZ - 140);
        makeBox(5, 30, 5, 0x775522, LFX + 6, 15, LFZ - 140);
        // Splash pool at bottom
        makeBox(50, 3, 30, 0x1155aa, LFX + 25, 0.5, LFZ + 200);

        // ----- Dodgem Building -----
        var DBX = AIX - 180;
        var DBZ = AIZ - 100;
        makeBox(80, 14, 70, 0xdd2244, DBX, 7, DBZ);
        // Roof with coloured panels
        makeBox(86, 3, 76, 0xffcc00, DBX, 15, DBZ);
        // Entrance sign area
        makeBox(30, 8, 3, 0xff4488, DBX, 12, DBZ - 37);
        // Internal floor
        makeBox(70, 2, 60, 0x333355, DBX, 1, DBZ);

        // ----- Carousel -----
        var CRX = AIX + 180;
        var CRZ = AIZ + 130;
        // Carousel base platform
        makeCylinder(20, 20, 3, 16, 0xcc8855, CRX, 1.5, CRZ);
        // Central pole
        makeCylinder(1.5, 1.5, 22, 8, 0xddaa00, CRX, 12, CRZ);
        // Carousel canopy
        makeCone(24, 12, 16, 0xff6699, CRX, 26, CRZ);
        // Decorative rim
        makeCylinder(22, 22, 2, 24, 0xffdd44, CRX, 13, CRZ);
        // Horse posts (simplified cylinders)
        for (var ch = 0; ch < 8; ch++) {
            var ca = (ch / 8) * Math.PI * 2;
            var chx = CRX + Math.cos(ca) * 14;
            var chz = CRZ + Math.sin(ca) * 14;
            makeCylinder(0.5, 0.5, 10, 6, 0xffffff, chx, 7, chz);
        }
    }

    function buildSeafront() {
        // -------------------------------------------------------
        // Seafront — arcades, fish & chips, cockle stalls, funicular
        // -------------------------------------------------------

        var SFZ = -600;

        // Amusement Arcades row
        var arcadeColors = [0xff3399, 0x33ccff, 0xffcc00, 0xff6600, 0x00ff88];
        for (var ai = 0; ai < 5; ai++) {
            var ax = X_OFFSET + 300 + ai * 90 - 200;
            makeBox(70, 20, 30, arcadeColors[ai], ax, 10, SFZ);
            // Neon sign strips
            makeBox(65, 5, 2, 0xffffff, ax, 22, SFZ - 16);
            // Awning
            makeBox(76, 3, 10, arcadeColors[ai], ax, 21, SFZ - 20);
        }

        // Fish & chip shops
        for (var fi = 0; fi < 3; fi++) {
            var fx = X_OFFSET - 300 + fi * 100;
            makeBox(60, 18, 30, 0xddcc99, fx, 9, SFZ);
            // Chimney / extractor
            makeCylinder(2, 2, 12, 6, 0x888888, fx + 20, 20, SFZ - 5);
            // Shop front sign
            makeBox(55, 6, 2, 0xee8822, fx, 18, SFZ - 16);
            // Awning
            makeBox(65, 2, 12, 0x8b3a1a, fx, 16, SFZ - 21);
        }

        // Cockle stalls
        for (var ci = 0; ci < 4; ci++) {
            var cx = X_OFFSET + 150 + ci * 70;
            makeBox(30, 10, 20, 0x99aa55, cx, 5, SFZ + 80);
            makeCone(18, 8, 8, 0x887733, cx, 14, SFZ + 80);
        }

        // Victorian Cliff Railway Funicular
        var CLX = X_OFFSET + 600;
        var CLZ = SFZ;
        // Lower station
        makeBox(20, 16, 20, 0xcc9966, CLX, 8, CLZ);
        // Upper station (on cliff top)
        makeBox(20, 16, 20, 0xcc9966, CLX, 40, CLZ - 30);
        // Cliff body / embankment
        makeBox(30, 60, 40, 0x7a6a50, CLX, 30, CLZ - 15);
        // Funicular track rails on cliff face
        var funPoints = [
            CLX - 4, 4, CLZ - 2,   CLX - 4, 56, CLZ - 34,
            CLX + 4, 4, CLZ - 2,   CLX + 4, 56, CLZ - 34
        ];
        makeLines(funPoints, 0x555544);
        // Funicular car (lower position)
        makeBox(12, 10, 10, 0xee3333, CLX, 12, CLZ - 8);
        // Cliff top path
        makeBox(300, 3, 20, 0xaaaaaa, CLX - 100, 58, CLZ - 35);
    }

    function buildCockleShedsLeighOnSea() {
        // -------------------------------------------------------
        // Chalkwell / Leigh-on-Sea — cockle sheds, boats, whelk stands
        // -------------------------------------------------------

        var LEX = X_OFFSET - 1800;
        var LEZ = -200;

        // Cockle sheds — black weatherboard buildings
        for (var si = 0; si < 6; si++) {
            var sx = LEX + si * 80;
            // Main shed body (dark weatherboard)
            makeBox(60, 18, 40, 0x111111, sx, 9, LEZ);
            // Shed roof — pitched
            makeCone(34, 10, 4, 0x222222, sx, 22, LEZ);
            // Shed door
            makeBox(12, 14, 2, 0x553311, sx, 7, LEZ - 21);
            // Smoke/steam pipe
            makeCylinder(1, 1, 14, 6, 0x444444, sx + 20, 22, LEZ - 10);
        }

        // Cockle boats moored at quayside
        for (var bi = 0; bi < 4; bi++) {
            var bx = LEX + 50 + bi * 120;
            var bz = LEZ + 100;
            // Boat hull
            makeBox(25, 8, 60, 0x334455, bx, 1, bz);
            // Wheelhouse
            makeBox(12, 10, 14, 0x667788, bx - 4, 9, bz - 15);
            // Mast
            makeCylinder(0.5, 0.5, 22, 6, 0xaaaa88, bx, 15, bz - 10);
            // Boom
            makeBox(16, 1, 1, 0xaaaa88, bx + 8, 22, bz - 10);
            // Nets/catch box on deck
            makeBox(10, 6, 20, 0x885522, bx + 5, 7, bz + 10);
        }

        // Whelk stands / seafood stalls on quayside
        for (var wi = 0; wi < 3; wi++) {
            var wx = LEX + wi * 150 + 30;
            var wz = LEZ - 30;
            makeBox(20, 8, 16, 0x885533, wx, 4, wz);
            makeCone(12, 6, 6, 0x443322, wx, 11, wz);
            // Display trays on front
            makeBox(22, 2, 6, 0xddccaa, wx, 8, wz - 9);
        }

        // Quayside / jetty
        makeBox(700, 4, 30, 0x8a7a60, LEX + 250, 1, LEZ + 60);
        // Bollards
        for (var boi = 0; boi < 8; boi++) {
            makeCylinder(1.5, 1.5, 8, 6, 0x333322, LEX + boi * 90 + 20, 5, LEZ + 46);
        }
    }

    function buildCanveyAndRefinery() {
        // -------------------------------------------------------
        // Far bank — Canvey Island, oil refinery chimneys
        // -------------------------------------------------------

        var FAR_Z = 8000;

        // Canvey Island low landmass
        makeBox(3000, 6, 600, 0x6b7a5a, X_OFFSET + 500, 0, FAR_Z);

        // Oil refinery structures on far bank
        var REF_X = X_OFFSET + 1200;
        // Refinery chimney stacks
        for (var ri = 0; ri < 6; ri++) {
            makeCylinder(6, 8, 80 + ri * 15, 8, 0xaaaaaa, REF_X + ri * 120, 40 + ri * 7, FAR_Z - 100);
            // Flame at top (cone)
            makeCone(5, 10, 8, 0xff4400, REF_X + ri * 120, 85 + ri * 15, FAR_Z - 100);
        }
        // Storage tanks
        for (var ti = 0; ti < 5; ti++) {
            makeCylinder(25, 25, 30, 12, 0xddddcc, REF_X - 200 + ti * 80, 15, FAR_Z - 150);
        }
        // Refinery main building
        makeBox(300, 40, 80, 0xccccbb, REF_X + 250, 20, FAR_Z - 200);

        // Oil tanker on estuary
        makeBox(180, 16, 50, 0x334455, X_OFFSET + 800, 4, FAR_Z - 1500);
        makeBox(40, 18, 30, 0x445566, X_OFFSET + 840, 15, FAR_Z - 1530);
        makeCylinder(3, 3, 35, 8, 0x444455, X_OFFSET + 820, 30, FAR_Z - 1520);

        // Distant Canvey low buildings
        for (var cbi = 0; cbi < 8; cbi++) {
            makeBox(40, 12, 30, 0x9a9a88, X_OFFSET - 600 + cbi * 180, 6, FAR_Z + 50);
        }
    }

    function buildMiscDetails() {
        // Lampposts along promenade
        for (var li = 0; li < 20; li++) {
            var lx = X_OFFSET + 270;
            var lz = -900 + li * 100;
            makeCylinder(0.5, 0.5, 16, 6, 0x888880, lx, 8, lz);
            makeSphere(2, 6, 4, 0xffffee, lx, 17, lz);
        }

        // Benches along seafront
        for (var bni = 0; bni < 12; bni++) {
            var bnx = X_OFFSET + 240;
            var bnz = -850 + bni * 150;
            makeBox(12, 2, 4, 0x886644, bnx, 4, bnz);
            makeBox(2, 8, 4, 0x886644, bnx - 5, 5, bnz);
            makeBox(2, 8, 4, 0x886644, bnx + 5, 5, bnz);
        }

        // Clifftop hotels / Victorian terraces
        for (var hi = 0; hi < 10; hi++) {
            var hx = X_OFFSET + 400 + hi * 120;
            makeBox(80, 45, 40, 0xeeddcc, hx, 80, -700);
            // Bay windows
            makeBox(20, 35, 8, 0xddd0bb, hx - 20, 78, -722);
            makeBox(20, 35, 8, 0xddd0bb, hx + 20, 78, -722);
            // Roof
            makeBox(85, 8, 46, 0x776655, hx, 103, -700);
            // Chimneys
            makeCylinder(2, 2, 14, 6, 0x887766, hx - 25, 110, -690);
            makeCylinder(2, 2, 14, 6, 0x887766, hx + 25, 110, -690);
        }

        // Seagulls (small white spheres floating above beach)
        for (var gi = 0; gi < 12; gi++) {
            var gx = X_OFFSET - 100 + gi * 60;
            var gz = -100 + gi * 40;
            makeSphere(1, 6, 4, 0xffffff, gx, 25 + gi * 2, gz);
        }

        // Kiosk / ice cream van
        makeBox(20, 14, 16, 0xffeecc, X_OFFSET + 200, 7, -50);
        makeCylinder(3, 3, 4, 6, 0xffcc00, X_OFFSET + 200, 16, -50);
        // Deckchairs area
        for (var di = 0; di < 8; di++) {
            makeBox(6, 2, 10, 0xff6633 - di * 0x001100, X_OFFSET + 50 + di * 20, 3, 50 + di * 15);
        }

        // Water taxi / small ferry on estuary
        makeBox(40, 10, 15, 0xee4422, X_OFFSET - 100, 2, 3000);
        makeCylinder(2, 2, 20, 8, 0x333322, X_OFFSET - 100, 12, 2995);
    }

    function build() {
        buildEstuary();
        buildBeach();
        buildPier();
        buildAdventureIsland();
        buildSeafront();
        buildCockleShedsLeighOnSea();
        buildCanveyAndRefinery();
        buildMiscDetails();
    }

    function update(delta) {
        // Static environment — no per-frame updates required
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
