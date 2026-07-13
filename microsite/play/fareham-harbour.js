window.FarehamHarbour = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X = 13360;

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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeSphere(r, wsegs, hsegs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, wsegs, hsegs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeLineBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var ls = new THREE.LineSegments(edges, mat);
        ls.position.set(x, y, z);
        return addObj(ls);
    }

    // ---- Fareham Creek ----
    function buildFarehamCreek() {
        var bx = X + 0;
        var bz = 200;

        // Water channel — tidal inlet blue-grey
        makeBox(200, 1, 400, 0x4a7c8a, bx, -0.5, bz);

        // Mudflats either side — brownish grey
        makeBox(80, 0.5, 400, 0x7a6a50, bx - 140, 0, bz);
        makeBox(80, 0.5, 400, 0x7a6a50, bx + 140, 0, bz);

        // Harbour walls — stone grey
        makeBox(8, 4, 400, 0x8a8a7a, bx - 100, 2, bz);
        makeBox(8, 4, 400, 0x8a8a7a, bx + 100, 2, bz);

        // Old quay — wooden platform
        makeBox(30, 2, 18, 0x5a3a1a, bx - 80, 1, bz - 80);
        // Quay bollards
        var i;
        for (i = 0; i < 4; i++) {
            makeCylinder(0.6, 0.6, 2.5, 6, 0x2a1a0a, bx - 90 + i * 6, 2.5, bz - 80);
        }

        // Moored yachts
        buildYacht(bx - 60, 0.5, bz - 60);
        buildYacht(bx - 50, 0.5, bz - 30);
        buildYacht(bx + 55, 0.5, bz - 50);

        // Motor boats
        buildMotorboat(bx - 65, 0.5, bz + 20);
        buildMotorboat(bx + 60, 0.5, bz + 40);

        // Sailing club building
        makeBox(24, 8, 14, 0xd4c8a8, bx + 110, 4, bz - 100);
        // Roof
        var roofGeo = new THREE.BoxGeometry(26, 3, 16);
        var roofMat = makeMaterial(0xc04020);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(bx + 110, 9.5, bz - 100);
        addObj(roof);

        // Flagpole at sailing club
        makeCylinder(0.2, 0.2, 14, 6, 0xdddddd, bx + 122, 7, bz - 100);
        // Flag
        makeBox(5, 2.5, 0.3, 0xcc2222, bx + 124.5, 13, bz - 100);

        // Pontoon / jetty
        makeBox(6, 0.8, 60, 0x7a5a3a, bx + 105, 0.4, bz - 50);
    }

    function buildYacht(x, y, z) {
        // Hull
        makeBox(14, 2.5, 4, 0xeeeedd, x, y + 1.25, z);
        // Cabin
        makeBox(6, 2, 3, 0xffffff, x - 1, y + 3.5, z);
        // Mast
        makeCylinder(0.18, 0.18, 18, 6, 0xccccbb, x + 1, y + 10.5, z);
        // Boom
        makeBox(8, 0.3, 0.3, 0xbbbbaa, x - 1, y + 3, z);
        // Sail approximation
        makeBox(0.2, 10, 5, 0xf0f0e0, x + 1, y + 9.5, z);
    }

    function buildMotorboat(x, y, z) {
        // Hull
        makeBox(10, 2, 3.5, 0x336699, x, y + 1, z);
        // Wheelhouse
        makeBox(4, 2.5, 3, 0xaaccee, x + 1, y + 3.25, z);
    }

    // ---- Fort Wallington ----
    function buildFortWallington() {
        var bx = X + 350;
        var bz = -200;

        // Earthwork ramparts — large grassy mounds (polygonal shape approximated with boxes)
        var sides = 8;
        var rampartR = 90;
        var rampartW = 18;
        var rampartH = 7;
        var k;
        for (k = 0; k < sides; k++) {
            var angle = (k / sides) * Math.PI * 2;
            var nextAngle = ((k + 1) / sides) * Math.PI * 2;
            var midAngle = (angle + nextAngle) / 2;
            var rx = bx + Math.cos(midAngle) * rampartR;
            var rz = bz + Math.sin(midAngle) * rampartR;
            var seg = new THREE.Mesh(
                new THREE.BoxGeometry(rampartW, rampartH, 50),
                makeMaterial(0x5a7a3a)
            );
            seg.position.set(rx, rampartH / 2, rz);
            seg.rotation.y = -midAngle;
            addObj(seg);
        }

        // Defensive ditch — darker strip around perimeter
        var ditchR = 80;
        var j;
        for (j = 0; j < sides; j++) {
            var da = (j / sides) * Math.PI * 2;
            var na = ((j + 1) / sides) * Math.PI * 2;
            var ma = (da + na) / 2;
            var dx = bx + Math.cos(ma) * ditchR;
            var dz = bz + Math.sin(ma) * ditchR;
            var dseg = new THREE.Mesh(
                new THREE.BoxGeometry(14, 2, 46),
                makeMaterial(0x3a3020)
            );
            dseg.position.set(dx, -1, dz);
            dseg.rotation.y = -ma;
            addObj(dseg);
        }

        // Brick fort core — Victorian red brick
        makeBox(70, 9, 70, 0x8b3a2a, bx, 4.5, bz);

        // Fort parade ground / interior courtyard
        makeBox(40, 0.5, 40, 0xb0a080, bx, 0.25, bz);

        // Caponiers — flanking galleries projecting into ditch (2 opposite corners)
        makeBox(16, 5, 8, 0x8b3a2a, bx + 60, 2.5, bz);
        makeBox(16, 5, 8, 0x8b3a2a, bx - 60, 2.5, bz);
        makeBox(8, 5, 16, 0x8b3a2a, bx, 2.5, bz + 60);
        makeBox(8, 5, 16, 0x8b3a2a, bx, 2.5, bz - 60);

        // Main gate archway
        makeBox(10, 9, 4, 0x6a2a1a, bx, 4.5, bz - 36);
        makeBox(3, 4, 4, 0x3a1a0a, bx, 2, bz - 36);

        // Corner towers (bastions)
        makeCylinder(8, 9, 11, 8, 0x7a3020, bx + 34, 5.5, bz + 34);
        makeCylinder(8, 9, 11, 8, 0x7a3020, bx - 34, 5.5, bz + 34);
        makeCylinder(8, 9, 11, 8, 0x7a3020, bx + 34, 5.5, bz - 34);
        makeCylinder(8, 9, 11, 8, 0x7a3020, bx - 34, 5.5, bz - 34);

        // Flagpole
        makeCylinder(0.3, 0.3, 16, 6, 0xddddcc, bx, 17, bz);
        makeBox(6, 2.5, 0.3, 0x003366, bx + 3, 23, bz);
    }

    // ---- Cams Hall ----
    function buildCamsHall() {
        var bx = X + 200;
        var bz = -600;

        // Main Georgian mansion block
        makeBox(60, 16, 30, 0xe8d8b0, bx, 8, bz);

        // Colonnaded portico front
        var col;
        for (col = 0; col < 6; col++) {
            makeCylinder(1.0, 1.0, 12, 8, 0xf0e8d0, bx - 12 + col * 5, 6, bz - 16);
        }
        // Portico entablature
        makeBox(30, 3, 3, 0xe8d8b0, bx - 2.5, 13, bz - 16);
        // Triangular pediment
        makeBox(30, 0.5, 3, 0xe8d8b0, bx - 2.5, 14.5, bz - 16);
        makeCone(12, 7, 4, 0xe0d0a0, bx - 2.5, 17.5, bz - 16);

        // Wings either side
        makeBox(20, 12, 25, 0xe0d0a0, bx - 40, 6, bz);
        makeBox(20, 12, 25, 0xe0d0a0, bx + 40, 6, bz);

        // Roof / parapet
        makeBox(62, 2, 32, 0xd0c090, bx, 17, bz);

        // Chimney stacks
        makeCylinder(1.2, 1.2, 6, 4, 0xc0a070, bx - 20, 22, bz);
        makeCylinder(1.2, 1.2, 6, 4, 0xc0a070, bx + 20, 22, bz);

        // Estate wall
        makeBox(200, 5, 2.5, 0xc8b880, bx, 2.5, bz + 80);
        makeBox(2.5, 5, 200, 0xc8b880, bx - 100, 2.5, bz);
        makeBox(2.5, 5, 200, 0xc8b880, bx + 100, 2.5, bz);

        // Gate piers
        makeCylinder(2, 2, 8, 8, 0xd0c080, bx - 8, 4, bz + 80);
        makeCylinder(2, 2, 8, 8, 0xd0c080, bx + 8, 4, bz + 80);
        makeSphere(2.5, 8, 8, 0xd0c080, bx - 8, 8.5, bz + 80);
        makeSphere(2.5, 8, 8, 0xd0c080, bx + 8, 8.5, bz + 80);

        // Mature estate trees
        var treePositions = [
            [bx - 60, bz - 40],
            [bx - 70, bz + 20],
            [bx + 65, bz - 35],
            [bx + 75, bz + 25],
            [bx - 40, bz + 60],
            [bx + 45, bz + 55],
            [bx, bz - 80],
            [bx - 80, bz - 70],
            [bx + 80, bz - 70]
        ];
        var t;
        for (t = 0; t < treePositions.length; t++) {
            buildTree(treePositions[t][0], 0, treePositions[t][1], 8, 14);
        }

        // Formal lawn / grounds
        makeBox(180, 0.4, 160, 0x5a8a3a, bx, 0.2, bz);
        // Gravel driveway
        makeBox(12, 0.5, 80, 0xc8b890, bx, 0.25, bz + 40);
    }

    function buildTree(x, y, z, trunkH, canopyR) {
        makeCylinder(0.8, 1.2, trunkH, 6, 0x4a2a0a, x, y + trunkH / 2, z);
        makeSphere(canopyR, 8, 8, 0x2a6a1a, x, y + trunkH + canopyR * 0.7, z);
    }

    // ---- Fareham Town Centre ----
    function buildFarehamTown() {
        var bx = X - 200;
        var bz = -100;

        // Ground plane / road surface
        makeBox(400, 0.4, 200, 0x7a7a7a, bx, 0, bz);

        // West Street — one of England's longest high streets
        // Road itself
        makeBox(16, 0.5, 350, 0x555555, bx, 0.25, bz);
        // Pavement
        makeBox(8, 0.5, 350, 0x999988, bx - 12, 0.25, bz);
        makeBox(8, 0.5, 350, 0x999988, bx + 12, 0.25, bz);

        // Terrace of shops along West Street
        var s;
        for (s = 0; s < 10; s++) {
            makeBox(14, 9, 10, 0xc8a878, bx - 25, 4.5, bz - 150 + s * 30);
            // Shop window
            makeBox(8, 4, 0.5, 0x88aacc, bx - 25, 3, bz - 150 + s * 30 - 5.2);
            // Parapet
            makeBox(15, 1.5, 10.5, 0xb89858, bx - 25, 9.75, bz - 150 + s * 30);
        }

        for (s = 0; s < 10; s++) {
            makeBox(14, 9, 10, 0xc09070, bx + 25, 4.5, bz - 150 + s * 30);
            makeBox(8, 4, 0.5, 0x88aacc, bx + 25, 3, bz - 150 + s * 30 + 5.2);
            makeBox(15, 1.5, 10.5, 0xb08060, bx + 25, 9.75, bz - 150 + s * 30);
        }

        // Shopping centre (Fareham Shopping Centre)
        makeBox(120, 14, 60, 0xd0c8b8, bx + 180, 7, bz - 30);
        // Shopping centre roof
        makeBox(122, 2, 62, 0xb8b0a0, bx + 180, 15, bz - 30);
        // Entrance canopy
        makeBox(30, 5, 8, 0x88aacc, bx + 120, 10, bz - 30);

        // Parish Church of St Peter and St Paul
        buildChurch(bx - 80, 0, bz + 60);

        // Street lamps along West Street
        var lp;
        for (lp = 0; lp < 8; lp++) {
            makeCylinder(0.2, 0.2, 8, 6, 0x222222, bx - 17, 4, bz - 135 + lp * 40);
            makeSphere(0.8, 6, 6, 0xffeeaa, bx - 17, 8.5, bz - 135 + lp * 40);
            makeCylinder(0.2, 0.2, 8, 6, 0x222222, bx + 17, 4, bz - 135 + lp * 40);
            makeSphere(0.8, 6, 6, 0xffeeaa, bx + 17, 8.5, bz - 135 + lp * 40);
        }
    }

    function buildChurch(x, y, z) {
        // Nave
        makeBox(24, 14, 50, 0xc0b090, x, y + 7, z);
        // Chancel
        makeBox(14, 12, 20, 0xb8a888, x, y + 6, z - 35);
        // Nave roof
        makeBox(25, 4, 52, 0x808070, x, y + 16, z);
        // Tower
        makeBox(12, 28, 12, 0xb0a080, x + 10, y + 14, z + 30);
        // Tower battlements
        makeBox(13, 2, 13, 0xa09070, x + 10, y + 29, z + 30);
        // Tower pinnacles
        makeCone(1.2, 4, 4, 0x909060, x + 4, y + 32, z + 24);
        makeCone(1.2, 4, 4, 0x909060, x + 16, y + 32, z + 24);
        makeCone(1.2, 4, 4, 0x909060, x + 4, y + 32, z + 36);
        makeCone(1.2, 4, 4, 0x909060, x + 16, y + 32, z + 36);
        // Porch
        makeBox(8, 7, 6, 0xb8a888, x, y + 3.5, z + 28);
        // Churchyard trees
        buildTree(x - 20, y, z + 10, 7, 10);
        buildTree(x + 20, y, z - 20, 8, 12);
        buildTree(x - 15, y, z - 30, 6, 9);
    }

    // ---- Titchfield Village ----
    function buildTitchfield() {
        var bx = X - 400;
        var bz = -500;

        // Village green
        makeBox(60, 0.4, 50, 0x5a8a3a, bx, 0, bz);

        // Village street
        makeBox(10, 0.5, 200, 0x666655, bx, 0.25, bz);

        // Titchfield Abbey ruins — gatehouse standing
        buildAbbeyGatehouse(bx - 20, 0, bz - 100);

        // Abbey ruins walls — partial standing walls
        makeBox(3, 8, 60, 0xb0a070, bx - 60, 4, bz - 110);
        makeBox(60, 8, 3, 0xb0a070, bx - 30, 4, bz - 130);
        makeBox(3, 5, 30, 0xa89860, bx + 10, 2.5, bz - 110);
        // Ruined arch remnant
        makeBox(3, 12, 3, 0xb0a070, bx - 20, 6, bz - 130);
        makeBox(3, 12, 3, 0xb0a070, bx - 6, 6, bz - 130);
        makeBox(14, 3, 3, 0xb0a070, bx - 13, 12.5, bz - 130);

        // Village houses — row of cottages
        var h;
        for (h = 0; h < 5; h++) {
            makeBox(10, 7, 9, 0xd4b880, bx + 14, 3.5, bz - 60 + h * 22);
            // Cottage roof
            makeBox(11, 3, 10, 0xc05020, bx + 14, 8.5, bz - 60 + h * 22);
            // Window
            makeBox(2.5, 2, 0.5, 0x88aacc, bx + 14, 4, bz - 60 + h * 22 - 4.8);
        }
        for (h = 0; h < 5; h++) {
            makeBox(10, 7, 9, 0xcca870, bx - 14, 3.5, bz - 60 + h * 22);
            makeBox(11, 3, 10, 0xb04818, bx - 14, 8.5, bz - 60 + h * 22);
            makeBox(2.5, 2, 0.5, 0x88aacc, bx - 14, 4, bz - 60 + h * 22 + 4.8);
        }

        // River Meon — meandering water strip
        makeBox(14, 0.6, 200, 0x3a6a8a, bx - 80, 0.3, bz);
        // River bank grass
        makeBox(8, 0.5, 200, 0x4a7a2a, bx - 92, 0.2, bz);
        makeBox(8, 0.5, 200, 0x4a7a2a, bx - 68, 0.2, bz);

        // Bridge over Meon
        makeBox(20, 2, 10, 0xb0a080, bx - 80, 1, bz + 30);
        makeCylinder(1.5, 1.8, 5, 8, 0xa09070, bx - 88, 2.5, bz + 25);
        makeCylinder(1.5, 1.8, 5, 8, 0xa09070, bx - 72, 2.5, bz + 25);
        makeCylinder(1.5, 1.8, 5, 8, 0xa09070, bx - 88, 2.5, bz + 35);
        makeCylinder(1.5, 1.8, 5, 8, 0xa09070, bx - 72, 2.5, bz + 35);

        // Village pub
        makeBox(16, 9, 12, 0xc8a060, bx + 30, 4.5, bz + 40);
        makeBox(17, 3.5, 13, 0x883010, bx + 30, 10.75, bz + 40);
        // Pub sign
        makeCylinder(0.2, 0.2, 6, 6, 0x3a1a0a, bx + 21, 3, bz + 34);
        makeBox(4, 2.5, 0.3, 0xcc6622, bx + 21, 6.5, bz + 34);

        // Village trees
        buildTree(bx + 5, 0, bz - 10, 9, 12);
        buildTree(bx - 5, 0, bz + 50, 7, 10);
        buildTree(bx + 40, 0, bz - 40, 8, 11);
        buildTree(bx - 100, 0, bz - 20, 10, 13);
    }

    function buildAbbeyGatehouse(x, y, z) {
        // Left tower
        makeBox(10, 22, 10, 0xa89860, x - 8, y + 11, z);
        // Right tower
        makeBox(10, 22, 10, 0xa89860, x + 8, y + 11, z);
        // Archway over gate passage
        makeBox(6, 8, 10, 0x907850, x, y + 4, z);
        // Upper gatehouse chamber
        makeBox(22, 10, 10, 0xa89860, x, y + 18, z);
        // Machicolation / battlement top
        makeBox(24, 2, 12, 0x907840, x, y + 24, z);
        // Arrow slit windows approximated
        makeBox(1, 5, 0.5, 0x303020, x - 8, y + 10, z - 5.2);
        makeBox(1, 5, 0.5, 0x303020, x + 8, y + 10, z - 5.2);
        // Remaining arch pilasters
        makeCylinder(1, 1, 22, 8, 0x907840, x - 5, y + 11, z);
        makeCylinder(1, 1, 22, 8, 0x907840, x + 5, y + 11, z);
    }

    // ---- Solent Views ----
    function buildSolentViews() {
        var bx = X + 100;
        var bz = 600;

        // Portsmouth Harbour entrance distant water
        makeBox(600, 0.5, 300, 0x2a5a7a, bx, -0.5, bz + 100);

        // Shoreline / pebble beach
        makeBox(600, 1, 30, 0xa09880, bx, 0.5, bz - 30);

        // Gosport ferry track / wake lines
        makeBox(4, 0.8, 200, 0xddeeff, bx - 60, 0.4, bz + 80);
        makeBox(4, 0.8, 200, 0xddeeff, bx + 60, 0.4, bz + 80);

        // Small ferry boat
        buildFerry(bx, 1, bz + 80);

        // HMS Victory mast visible in distance — tall masts on Portsmouth side
        buildVictoryMasts(bx + 200, 0, bz + 250);

        // Gosport distant shoreline
        makeBox(400, 4, 20, 0x809070, bx, 2, bz + 320);

        // Fort Blockhouse on Gosport (distant silhouette)
        makeBox(60, 12, 20, 0x607060, bx - 100, 6, bz + 315);

        // Harbour entrance markers / buoys
        makeSphere(2, 8, 8, 0xcc2222, bx - 80, 1.5, bz + 30);
        makeSphere(2, 8, 8, 0x228822, bx + 80, 1.5, bz + 30);
        makeCone(1, 4, 4, 0xcc2222, bx - 80, 5, bz + 30);
        makeCone(1, 4, 4, 0x228822, bx + 80, 5, bz + 30);
    }

    function buildFerry(x, y, z) {
        // Ferry hull
        makeBox(20, 3, 7, 0xffffff, x, y + 1.5, z);
        // Superstructure
        makeBox(16, 3, 6, 0xdddddd, x, y + 4.5, z);
        // Bridge
        makeBox(8, 2.5, 6, 0xcccccc, x + 2, y + 7.25, z);
        // Funnel
        makeCylinder(1, 1.2, 4, 8, 0xcc2222, x - 3, y + 9, z);
    }

    function buildVictoryMasts(x, y, z) {
        // Three masts of HMS Victory — distant silhouettes
        // Fore mast
        makeCylinder(0.5, 0.7, 50, 6, 0x3a2a1a, x - 15, y + 25, z);
        makeBox(18, 0.6, 2, 0x3a2a1a, x - 15, y + 30, z);
        makeBox(14, 0.6, 2, 0x3a2a1a, x - 15, y + 40, z);
        makeCylinder(0.3, 0.4, 20, 6, 0x3a2a1a, x - 15, y + 60, z);
        // Main mast
        makeCylinder(0.6, 0.8, 58, 6, 0x3a2a1a, x, y + 29, z);
        makeBox(22, 0.6, 2, 0x3a2a1a, x, y + 36, z);
        makeBox(16, 0.6, 2, 0x3a2a1a, x, y + 48, z);
        makeCylinder(0.3, 0.4, 22, 6, 0x3a2a1a, x, y + 69, z);
        // Mizzen mast
        makeCylinder(0.4, 0.6, 42, 6, 0x3a2a1a, x + 12, y + 21, z);
        makeBox(14, 0.6, 2, 0x3a2a1a, x + 12, y + 28, z);
        makeBox(10, 0.6, 2, 0x3a2a1a, x + 12, y + 36, z);
        makeCylinder(0.25, 0.35, 16, 6, 0x3a2a1a, x + 12, y + 50, z);
        // Hull of Victory (distant box)
        makeBox(70, 10, 18, 0x2a1a0a, x, y + 5, z);
        // Gun ports
        var gp;
        for (gp = 0; gp < 6; gp++) {
            makeBox(2, 2, 0.5, 0x111111, x - 28 + gp * 10, y + 4, z - 9.3);
            makeBox(2, 2, 0.5, 0x111111, x - 28 + gp * 10, y + 7, z - 9.3);
        }
    }

    // ---- Ground terrain ----
    function buildTerrain() {
        // Base ground
        makeBox(1200, 1, 1400, 0x6a8a5a, X, -0.5, 0);
        // Coastal/harbour area
        makeBox(400, 0.5, 200, 0x8a7a5a, X + 100, 0, 350);
    }

    // ---- Roads ----
    function buildRoads() {
        var bx = X;
        // A27 trunk road
        makeBox(12, 0.6, 800, 0x555555, bx + 100, 0.3, -100);
        // Road markings
        makeBox(1, 0.65, 800, 0xffff88, bx + 100, 0.33, -100);
        // Local road to Titchfield
        makeBox(8, 0.6, 300, 0x606060, bx - 300, 0.3, -300);
        // Road to fort
        makeBox(7, 0.6, 200, 0x606060, bx + 280, 0.3, -130);
    }

    function build() {
        buildTerrain();
        buildRoads();
        buildFarehamCreek();
        buildFortWallington();
        buildCamsHall();
        buildFarehamTown();
        buildTitchfield();
        buildSolentViews();
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
