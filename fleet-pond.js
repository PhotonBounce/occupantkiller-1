window.FleetPond = (function() {
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

    function makeMaterial(color, options) {
        var opts = options || {};
        return new THREE.MeshLambertMaterial({
            color: color,
            transparent: opts.transparent || false,
            opacity: opts.opacity !== undefined ? opts.opacity : 1.0
        });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeLineBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(edges, mat);
        ls.position.set(x, y, z);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    // X offset for Fleet
    var OX = 12920;

    function buildPond() {
        // Main lake body — large flattened sphere / wide cylinder representing water surface
        makeCylinder(80, 82, 1.5, 16, 0x2e6ea6, OX + 0, -0.5, -200);

        // Shallow reed-bed margins — darker green rings around edge
        makeCylinder(88, 86, 0.8, 16, 0x4a7c3f, OX + 0, -0.6, -200);
        makeCylinder(82, 80, 0.8, 16, 0x3d6b35, OX + 0, -0.3, -200);

        // Sand/gravel shoreline strip
        makeCylinder(92, 90, 0.5, 16, 0xb8a882, OX + 0, -0.9, -200);

        // Marshy ground surrounding pond
        makeBox(220, 0.4, 220, 0x5a7a45, OX + 0, -1.1, -200);
    }

    function buildReedBeds() {
        // Reed clusters around pond edges — tall thin cylinders in groups
        var reedPositions = [
            [OX - 70, -120], [OX - 75, -130], [OX - 68, -125],
            [OX - 65, -115], [OX - 72, -140], [OX - 78, -145],
            [OX + 65, -120], [OX + 70, -130], [OX + 60, -125],
            [OX + 75, -115], [OX + 68, -140],
            [OX - 40, -285], [OX - 45, -290], [OX - 35, -280],
            [OX + 40, -285], [OX + 35, -290], [OX + 45, -280],
            [OX - 20, -280], [OX + 20, -280], [OX + 10, -285],
            [OX - 60, -200], [OX - 65, -205], [OX - 58, -195],
            [OX + 58, -200], [OX + 62, -205], [OX + 55, -195],
            [OX - 50, -160], [OX + 55, -160], [OX - 30, -290]
        ];
        for (var i = 0; i < reedPositions.length; i++) {
            var rx = reedPositions[i][0];
            var rz = reedPositions[i][1];
            // Main reed stem
            makeCylinder(0.3, 0.4, 5, 5, 0x8b7355, rx, 1.5, rz);
            // Reed head
            makeCylinder(0.6, 0.3, 1.2, 5, 0x5c4a2a, rx, 4.5, rz);
            // Nearby reeds
            makeCylinder(0.3, 0.4, 4.5, 5, 0x8b7355, rx + 1.5, 1.2, rz + 1);
            makeCylinder(0.5, 0.3, 1.0, 5, 0x5c4a2a, rx + 1.5, 4.2, rz + 1);
            makeCylinder(0.3, 0.4, 5.5, 5, 0x7a6545, rx - 1.2, 1.7, rz - 0.8);
            makeCylinder(0.6, 0.3, 1.3, 5, 0x5c4a2a, rx - 1.2, 5.2, rz - 0.8);
        }
    }

    function buildBirdHide() {
        // Wooden bird hide structure near north-west shore
        var hx = OX - 90;
        var hz = -150;
        // Platform base
        makeBox(12, 0.6, 8, 0x8b6914, hx, 0.5, hz);
        // Support posts (4 corners)
        makeCylinder(0.4, 0.4, 2, 5, 0x6b4f10, hx - 5, 0.5, hz - 3);
        makeCylinder(0.4, 0.4, 2, 5, 0x6b4f10, hx + 5, 0.5, hz - 3);
        makeCylinder(0.4, 0.4, 2, 5, 0x6b4f10, hx - 5, 0.5, hz + 3);
        makeCylinder(0.4, 0.4, 2, 5, 0x6b4f10, hx + 5, 0.5, hz + 3);
        // Walls
        makeBox(12, 2.5, 0.4, 0x8b6914, hx, 2, hz - 3.8);
        makeBox(12, 2.5, 0.4, 0x8b6914, hx, 2, hz + 3.8);
        makeBox(0.4, 2.5, 8, 0x8b6914, hx - 5.8, 2, hz);
        makeBox(0.4, 2.5, 8, 0x8b6914, hx + 5.8, 2, hz);
        // Viewing slit in front wall
        makeBox(6, 0.6, 0.4, 0x5c3d0a, hx, 2.2, hz - 3.8);
        // Roof
        makeBox(13, 0.4, 9, 0x6b4f10, hx, 3.3, hz);
        // Access boardwalk from shore
        makeBox(20, 0.3, 2.5, 0x8b7355, hx + 16, 0.3, hz);
        makeBox(15, 0.3, 2.5, 0x8b7355, hx - 17.5, 0.3, hz);
    }

    function buildBoardwalks() {
        // Boardwalk sections over marshy areas
        var bwSegments = [
            [OX - 95, -180, 30, 2.5, 0],
            [OX - 95, -210, 25, 2.5, 0],
            [OX + 90, -160, 28, 2.5, 0],
            [OX - 30, -290, 2.5, 40, 90],
            [OX + 30, -280, 2.5, 35, 90],
            [OX - 60, -270, 2.5, 25, 90]
        ];
        for (var b = 0; b < bwSegments.length; b++) {
            var seg = bwSegments[b];
            var bx = seg[0];
            var bz = seg[1];
            var bw = seg[2];
            var bd = seg[3];
            var brot = seg[4];
            var bwalk = makeBox(bw, 0.3, bd, 0x8b7355, bx, 0.2, bz);
            if (brot !== 0) {
                bwalk.rotation.y = brot * Math.PI / 180;
            }
            // Handrail posts
            makeCylinder(0.15, 0.15, 1.0, 4, 0x6b4f10, bx - bw * 0.4, 0.7, bz - bd * 0.4);
            makeCylinder(0.15, 0.15, 1.0, 4, 0x6b4f10, bx + bw * 0.4, 0.7, bz - bd * 0.4);
            makeCylinder(0.15, 0.15, 1.0, 4, 0x6b4f10, bx - bw * 0.4, 0.7, bz + bd * 0.4);
            makeCylinder(0.15, 0.15, 1.0, 4, 0x6b4f10, bx + bw * 0.4, 0.7, bz + bd * 0.4);
        }
    }

    function buildSwans() {
        // Swan groups on the pond — white sphere clusters
        var swanGroups = [
            [OX - 20, -180], [OX + 25, -185], [OX - 35, -220],
            [OX + 10, -230], [OX - 10, -170], [OX + 40, -200]
        ];
        for (var s = 0; s < swanGroups.length; s++) {
            var sx = swanGroups[s][0];
            var sz = swanGroups[s][1];
            // Body
            makeSphere(2.0, 8, 6, 0xffffff, sx, 1.2, sz);
            // Head
            makeSphere(0.8, 6, 5, 0xffffff, sx + 1.5, 2.5, sz - 0.5);
            // Beak
            makeCone(0.3, 1.0, 5, 0xffa500, sx + 2.3, 2.4, sz - 0.5);
            // Tail raised
            makeSphere(0.9, 6, 5, 0xffffff, sx - 1.8, 2.0, sz);
        }
    }

    function buildSailingDinghies() {
        // Sailing dinghies on pond
        var dinghyPositions = [
            [OX - 30, -160], [OX + 20, -150], [OX + 35, -220],
            [OX - 10, -240], [OX + 15, -170]
        ];
        var hullColors = [0xd04020, 0x2060a0, 0xe0c020, 0x30a040, 0xc04080];
        for (var d = 0; d < dinghyPositions.length; d++) {
            var dx = dinghyPositions[d][0];
            var dz = dinghyPositions[d][1];
            var hcol = hullColors[d % hullColors.length];
            // Hull
            makeBox(4.5, 0.8, 1.6, hcol, dx, 0.8, dz);
            // Cockpit
            makeBox(2.5, 0.4, 1.2, 0xe8e0c0, dx, 1.3, dz);
            // Mast
            makeCylinder(0.12, 0.12, 7, 5, 0xcccccc, dx + 0.3, 4.5, dz);
            // Sail
            makeBox(0.1, 5, 2.5, 0xf5f5f5, dx + 0.3, 5.5, dz);
        }
    }

    function buildNatureReserve() {
        // Gravel paths through nature reserve
        var pathSegs = [
            [OX - 95, -180, 3, 60],
            [OX - 80, -150, 3, 50],
            [OX + 80, -170, 3, 55],
            [OX + 95, -200, 3, 60],
            [OX - 50, -295, 60, 3],
            [OX + 50, -295, 55, 3]
        ];
        for (var p = 0; p < pathSegs.length; p++) {
            makeBox(pathSegs[p][2], 0.25, pathSegs[p][3], 0xc8b89a, pathSegs[p][0], 0.0, pathSegs[p][1]);
        }

        // Interpretation boards — posts with flat panel
        var boardPositions = [
            [OX - 100, -160], [OX + 95, -155], [OX - 55, -300],
            [OX + 60, -300], [OX - 88, -230]
        ];
        for (var bi = 0; bi < boardPositions.length; bi++) {
            var bpx = boardPositions[bi][0];
            var bpz = boardPositions[bi][1];
            // Post
            makeCylinder(0.2, 0.2, 2.2, 5, 0x6b4f10, bpx, 1.1, bpz);
            makeCylinder(0.2, 0.2, 2.2, 5, 0x6b4f10, bpx + 1.2, 1.1, bpz);
            // Board panel
            makeBox(2.5, 1.5, 0.15, 0xd4b44a, bpx + 0.6, 2.5, bpz);
            // Text representation (darker strip)
            makeBox(2.0, 1.0, 0.16, 0x3a5f1a, bpx + 0.6, 2.5, bpz);
        }

        // Dragonfly meadow — low wildflower patches
        var meadowPos = [
            [OX + 110, -180], [OX + 115, -195], [OX + 108, -210],
            [OX + 120, -200], [OX - 108, -175], [OX - 115, -190]
        ];
        for (var mi = 0; mi < meadowPos.length; mi++) {
            makeBox(8, 0.5, 8, 0x6aaa40, meadowPos[mi][0], 0.3, meadowPos[mi][1]);
            makeBox(5, 0.8, 5, 0xd4a020, meadowPos[mi][0] + 1, 0.7, meadowPos[mi][1] - 1);
            makeSphere(0.8, 5, 4, 0xe06030, meadowPos[mi][0] - 1, 1.2, meadowPos[mi][1] + 1);
            makeSphere(0.7, 5, 4, 0x8040c0, meadowPos[mi][0] + 2, 1.0, meadowPos[mi][1] - 2);
        }
    }

    function buildRailwayStation() {
        // Fleet station — z = -350 (south of pond)
        var stx = OX + 0;
        var stz = -350;

        // Ground level approach
        makeBox(80, 0.3, 30, 0x808080, stx, 0.0, stz);

        // Railway tracks (two rails)
        makeBox(80, 0.25, 0.5, 0x555555, stx, 0.2, stz - 5);
        makeBox(80, 0.25, 0.5, 0x555555, stx, 0.2, stz + 5);
        // Sleepers
        for (var sl = -8; sl <= 8; sl++) {
            makeBox(1.0, 0.2, 14, 0x6b4f10, stx + sl * 4.5, 0.1, stz);
        }

        // Platform — island platform between tracks
        makeBox(60, 1.2, 8, 0xd4c8a0, stx, 0.8, stz);
        // Platform edge strips
        makeBox(60, 0.2, 0.5, 0xf0f0f0, stx, 1.45, stz - 3.8);
        makeBox(60, 0.2, 0.5, 0xf0f0f0, stx, 1.45, stz + 3.8);

        // Victorian station building — main structure
        makeBox(20, 6, 12, 0xc8a87a, stx - 15, 3.5, stz - 12);
        // Roof
        makeBox(22, 1.5, 14, 0x8b3a3a, stx - 15, 7.0, stz - 12);
        // Decorative gable
        makeCone(7, 4, 4, 0x8b3a3a, stx - 15, 9.5, stz - 12);
        // Windows
        makeBox(2.5, 3, 0.3, 0x88ccee, stx - 20, 3.5, stz - 6.1);
        makeBox(2.5, 3, 0.3, 0x88ccee, stx - 15, 3.5, stz - 6.1);
        makeBox(2.5, 3, 0.3, 0x88ccee, stx - 10, 3.5, stz - 6.1);
        // Station entrance door
        makeBox(3, 4, 0.3, 0x4a2e0a, stx - 15, 2.5, stz - 6.1);
        // Station name board
        makeBox(8, 1.2, 0.3, 0x003366, stx - 15, 5.5, stz - 6.1);

        // Platform canopy
        makeBox(40, 0.4, 6, 0x8b8b8b, stx + 5, 4.5, stz);
        // Canopy support pillars
        var pillarPositions = [-14, -8, -2, 4, 10, 16, 22];
        for (var pi = 0; pi < pillarPositions.length; pi++) {
            makeCylinder(0.3, 0.3, 4.0, 6, 0x666666, stx + pillarPositions[pi], 2.5, stz - 2.8);
            makeCylinder(0.3, 0.3, 4.0, 6, 0x666666, stx + pillarPositions[pi], 2.5, stz + 2.8);
        }

        // Footbridge over tracks
        makeBox(4, 0.5, 18, 0x888888, stx + 10, 6.5, stz);
        // Footbridge staircase north
        makeBox(3, 4, 3, 0x888888, stx + 10, 4.5, stz - 11);
        // Footbridge staircase south
        makeBox(3, 4, 3, 0x888888, stx + 10, 4.5, stz + 11);
        // Footbridge railings
        makeBox(4, 1.5, 0.2, 0x666666, stx + 10, 7.2, stz - 8.5);
        makeBox(4, 1.5, 0.2, 0x666666, stx + 10, 7.2, stz + 8.5);

        // Signal box
        makeBox(6, 4, 6, 0xc8a87a, stx - 35, 2.5, stz - 12);
        makeBox(6, 0.5, 6, 0x8b3a3a, stx - 35, 5.0, stz - 12);
        // Signal box windows — all around
        makeBox(3, 2, 0.3, 0x88ccee, stx - 35, 3.0, stz - 9.2);
        makeBox(0.3, 2, 3, 0x88ccee, stx - 32.2, 3.0, stz - 12);
        makeBox(0.3, 2, 3, 0x88ccee, stx - 37.8, 3.0, stz - 12);
        // Signal box steps
        makeBox(4, 0.4, 1.5, 0x808080, stx - 35, 0.5, stz - 8.8);
        makeBox(4, 0.4, 1.5, 0x808080, stx - 35, 1.0, stz - 9.5);

        // Semaphore signal
        makeCylinder(0.2, 0.2, 6, 5, 0x333333, stx - 40, 3.5, stz - 5);
        makeBox(3, 0.6, 0.3, 0xcc0000, stx - 38.5, 6.5, stz - 5);
        makeBox(3, 0.6, 0.3, 0xffffff, stx - 38.5, 5.8, stz - 5);

        // Car park beside station
        makeBox(50, 0.2, 30, 0x606060, stx - 35, -0.1, stz + 30);
        // Parked cars (simplified boxes)
        var carZ = stz + 25;
        for (var ci = 0; ci < 5; ci++) {
            makeBox(4, 1.5, 2, 0x446688, stx - 40 + ci * 6, 1.0, carZ);
            makeBox(2.5, 1.0, 1.8, 0x88aacc, stx - 40 + ci * 6, 1.8, carZ);
        }
    }

    function buildTownCentre() {
        // Fleet town centre — z = +100 to +200, north side
        var tcx = OX;
        var tcz = 100;

        // Road surface — Church Road
        makeBox(120, 0.2, 10, 0x444444, tcx, 0.0, tcz + 20);
        // Pavements
        makeBox(120, 0.25, 3, 0xc0b090, tcx, 0.05, tcz + 13);
        makeBox(120, 0.25, 3, 0xc0b090, tcx, 0.05, tcz + 27);

        // Hart Shopping Centre — main block
        makeBox(40, 8, 20, 0xc8c0b0, tcx - 20, 4.5, tcz + 10);
        makeBox(40, 1.5, 20, 0x998877, tcx - 20, 9.0, tcz + 10);
        // Shopping centre glazed facade
        makeBox(30, 6, 0.4, 0x88ccee, tcx - 20, 4.0, tcz + 0.5);
        // Entrance canopy
        makeBox(12, 0.5, 4, 0x999999, tcx - 20, 2.5, tcz - 1);
        // Hart sign
        makeBox(10, 1.5, 0.5, 0x993300, tcx - 20, 7.5, tcz + 0.3);
        // Shop fronts
        makeBox(8, 3, 0.4, 0x88ccee, tcx - 35, 2.0, tcz + 0.5);
        makeBox(8, 3, 0.4, 0x88ccee, tcx - 26, 2.0, tcz + 0.5);
        makeBox(8, 3, 0.4, 0x88ccee, tcx - 14, 2.0, tcz + 0.5);
        makeBox(8, 3, 0.4, 0x88ccee, tcx - 4, 2.0, tcz + 0.5);

        // Church Road Buildings — terraced retail
        var shopColors = [0xb89a6a, 0xc8a878, 0xd4b882, 0xa88860, 0xbc9e72];
        for (var sh = 0; sh < 6; sh++) {
            var shopX = tcx + 15 + sh * 9;
            makeBox(8, 7, 12, shopColors[sh % shopColors.length], shopX, 4.0, tcz + 6);
            makeBox(8.5, 1.0, 12.5, 0x8b3a3a, shopX, 7.6, tcz + 6);
            // Shop window
            makeBox(4.5, 2.5, 0.3, 0x88ccee, shopX, 1.8, tcz + 0.2);
            // Door
            makeBox(1.5, 3, 0.3, 0x5a3a1a, shopX - 2, 1.7, tcz + 0.2);
        }

        // Gurkha restaurant district — distinctive signage
        makeBox(10, 6, 10, 0xd4a060, tcx + 60, 3.5, tcz + 5);
        makeBox(10.5, 0.8, 10.5, 0x8b3a3a, tcx + 60, 7.0, tcz + 5);
        // Gurkha knife motif sign
        makeBox(5, 2, 0.5, 0x882200, tcx + 60, 5.5, tcz + 0.1);
        makeBox(2, 4, 0.5, 0x882200, tcx + 66, 4.0, tcz + 5);
        // Neighbouring restaurants
        makeBox(10, 6, 10, 0xc49060, tcx + 73, 3.5, tcz + 5);
        makeBox(5, 2, 0.5, 0x1a5530, tcx + 73, 5.0, tcz + 0.1);

        // War memorial — central
        makeBox(4, 0.5, 4, 0xa0a0a0, tcx - 5, 0.3, tcz + 35);
        makeCylinder(1.5, 2, 0.6, 8, 0x909090, tcx - 5, 0.9, tcz + 35);
        makeCylinder(0.8, 1.0, 5, 8, 0xc8c8c8, tcx - 5, 3.5, tcz + 35);
        // Cross on top
        makeBox(0.5, 2.5, 0.5, 0xc8c8c8, tcx - 5, 7.2, tcz + 35);
        makeBox(2.0, 0.5, 0.5, 0xc8c8c8, tcx - 5, 8.0, tcz + 35);
        // Memorial plaques
        makeBox(3, 1.8, 0.2, 0xb8a050, tcx - 5, 2.0, tcz + 33.2);
        makeBox(3, 1.8, 0.2, 0xb8a050, tcx - 5, 2.0, tcz + 36.8);

        // Post box and lamp posts along Church Road
        makeCylinder(0.3, 0.3, 4, 6, 0x222222, tcx - 50, 2.2, tcz + 13);
        makeSphere(0.7, 6, 5, 0xffffaa, tcx - 50, 4.5, tcz + 13);
        makeCylinder(0.3, 0.3, 4, 6, 0x222222, tcx - 20, 2.2, tcz + 13);
        makeSphere(0.7, 6, 5, 0xffffaa, tcx - 20, 4.5, tcz + 13);
        makeCylinder(0.3, 0.3, 4, 6, 0x222222, tcx + 20, 2.2, tcz + 13);
        makeSphere(0.7, 6, 5, 0xffffaa, tcx + 20, 4.5, tcz + 13);
        makeCylinder(0.3, 0.3, 4, 6, 0x222222, tcx + 50, 2.2, tcz + 13);
        makeSphere(0.7, 6, 5, 0xffffaa, tcx + 50, 4.5, tcz + 13);
        // Red post box
        makeCylinder(0.6, 0.6, 1.4, 8, 0xcc0000, tcx - 48, 0.8, tcz + 14);
        makeCylinder(0.65, 0.65, 0.3, 8, 0xcc0000, tcx - 48, 1.6, tcz + 14);
    }

    function buildWoodland() {
        // Birch and pine trees around pond edges
        var treeData = [
            // [x, z, type] type 0=birch, 1=pine
            [OX - 110, -130, 0], [OX - 115, -145, 1], [OX - 120, -160, 0],
            [OX - 118, -175, 1], [OX - 112, -190, 0], [OX - 120, -210, 1],
            [OX - 115, -225, 0], [OX - 110, -240, 1], [OX - 118, -255, 0],
            [OX - 112, -270, 1],
            [OX + 110, -130, 1], [OX + 115, -145, 0], [OX + 120, -160, 1],
            [OX + 118, -175, 0], [OX + 112, -190, 1], [OX + 120, -210, 0],
            [OX + 115, -225, 1], [OX + 110, -240, 0], [OX + 118, -255, 1],
            [OX + 112, -270, 0],
            [OX - 80, -300, 0], [OX - 55, -305, 1], [OX - 30, -308, 0],
            [OX - 5, -305, 1], [OX + 20, -308, 0], [OX + 45, -305, 1],
            [OX + 70, -300, 0],
            [OX - 80, -100, 1], [OX - 55, -105, 0], [OX - 30, -108, 1],
            [OX + 20, -105, 0], [OX + 50, -100, 1], [OX + 75, -105, 0]
        ];

        for (var t = 0; t < treeData.length; t++) {
            var tx = treeData[t][0];
            var tz = treeData[t][1];
            var ttype = treeData[t][2];

            if (ttype === 0) {
                // Birch — white trunk, rounded canopy
                makeCylinder(0.5, 0.7, 9, 6, 0xe8e8e0, tx, 4.5, tz);
                makeSphere(5, 7, 6, 0x5a9440, tx, 10.5, tz);
                makeSphere(3.5, 6, 5, 0x4a8030, tx + 2, 12.0, tz - 1);
                // Birch bark markings
                makeBox(0.6, 0.4, 0.6, 0x888878, tx, 3.0, tz);
                makeBox(0.6, 0.4, 0.6, 0x888878, tx, 5.5, tz);
                makeBox(0.6, 0.4, 0.6, 0x888878, tx, 7.5, tz);
            } else {
                // Pine — dark trunk, stacked cone canopy
                makeCylinder(0.6, 0.9, 10, 6, 0x5a3a1a, tx, 5.0, tz);
                makeCone(5, 6, 7, 0x2a6020, tx, 9.5, tz);
                makeCone(4, 5.5, 7, 0x2a7020, tx, 12.5, tz);
                makeCone(3, 5, 7, 0x308030, tx, 15.0, tz);
            }
        }

        // Woodland ground cover
        var groundPatches = [
            [OX - 112, -200, 18, 80], [OX + 112, -200, 18, 80],
            [OX, -310, 160, 18]
        ];
        for (var gp = 0; gp < groundPatches.length; gp++) {
            makeBox(
                groundPatches[gp][2], 0.3, groundPatches[gp][3],
                0x3a6020,
                groundPatches[gp][0], -0.5, groundPatches[gp][1]
            );
        }
    }

    function buildSailingClub() {
        // Fleet Sailing Club — south-east shore
        var scx = OX + 100;
        var scz = -220;

        // Clubhouse
        makeBox(14, 5, 10, 0xc8d4e0, scx, 3.0, scz);
        makeBox(15, 1.0, 11, 0x4a6688, scx, 5.7, scz);
        // Roof ridge
        makeCone(6, 3, 4, 0x3a5678, scx, 7.5, scz);
        // Windows
        makeBox(3, 2, 0.3, 0x88ccee, scx - 4, 3.0, scz - 5.2);
        makeBox(3, 2, 0.3, 0x88ccee, scx + 3, 3.0, scz - 5.2);
        // Door
        makeBox(2, 3, 0.3, 0x4a3a2a, scx, 1.8, scz - 5.2);
        // Club flag post
        makeCylinder(0.2, 0.2, 8, 5, 0xcccccc, scx + 9, 4.5, scz - 3);
        makeBox(3, 2, 0.1, 0x0033aa, scx + 10.5, 7.5, scz - 3);

        // Boat storage rack — A-frame structure
        makeBox(18, 1.2, 4, 0x6b4f10, scx, 0.8, scz + 12);
        // Rack uprights
        for (var ri = 0; ri < 4; ri++) {
            makeCylinder(0.3, 0.3, 2.5, 5, 0x6b4f10, scx - 6 + ri * 4, 1.7, scz + 10);
            makeCylinder(0.3, 0.3, 2.5, 5, 0x6b4f10, scx - 6 + ri * 4, 1.7, scz + 14);
        }
        // Dinghies on rack
        makeBox(4.5, 0.8, 1.6, 0xee4422, scx - 5, 3.0, scz + 12);
        makeBox(4.5, 0.8, 1.6, 0x2244ee, scx, 3.0, scz + 12);
        makeBox(4.5, 0.8, 1.6, 0xeecc22, scx + 5, 3.0, scz + 12);

        // Slipway down to water
        makeBox(6, 0.3, 20, 0xa0a0a0, scx - 8, 0.0, scz - 15);
        // Slipway side walls
        makeBox(0.4, 1.0, 20, 0x888888, scx - 11, 0.5, scz - 15);
        makeBox(0.4, 1.0, 20, 0x888888, scx - 5, 0.5, scz - 15);

        // Moored dinghies on buoys
        makeSphere(0.5, 5, 4, 0xff8800, scx - 15, 0.8, scz - 25);
        makeBox(3.5, 0.7, 1.4, 0xcc3322, scx - 15, 1.4, scz - 25);
        makeCylinder(0.1, 0.1, 5, 4, 0xcccccc, scx - 15, 3.5, scz - 25);

        makeSphere(0.5, 5, 4, 0xff8800, scx - 22, 0.8, scz - 30);
        makeBox(3.5, 0.7, 1.4, 0x2255aa, scx - 22, 1.4, scz - 30);
        makeCylinder(0.1, 0.1, 5, 4, 0xcccccc, scx - 22, 3.5, scz - 30);

        // Club notice board
        makeCylinder(0.2, 0.2, 2.5, 5, 0x6b4f10, scx + 10, 1.4, scz - 4);
        makeCylinder(0.2, 0.2, 2.5, 5, 0x6b4f10, scx + 12, 1.4, scz - 4);
        makeBox(3, 2, 0.2, 0x8b6914, scx + 11, 3.0, scz - 4);
    }

    function buildGroundPlane() {
        // Base terrain for the whole area
        makeBox(400, 0.4, 600, 0x5a7a45, OX, -1.3, -100);
    }

    function build() {
        buildGroundPlane();
        buildPond();
        buildReedBeds();
        buildBirdHide();
        buildBoardwalks();
        buildSwans();
        buildSailingDinghies();
        buildNatureReserve();
        buildRailwayStation();
        buildTownCentre();
        buildWoodland();
        buildSailingClub();
    }

    function update(delta) {
        // No per-frame animation required for static environment
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
