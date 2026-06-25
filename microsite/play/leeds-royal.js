window.LeedsRoyal = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 15520;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
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

    function buildRoyalArmouries() {
        var bx = X_OFFSET + 0;
        var bz = -200;

        // Main five-storey building body
        makeBox(60, 50, 30, 0x8899aa, bx, 25, bz);

        // Second section – slightly taller modern wing
        makeBox(25, 60, 30, 0x7788aa, bx + 42, 30, bz);

        // Tower of London replica section – darker stone
        makeBox(20, 45, 20, 0x998877, bx - 45, 22, bz + 5);
        // Battlements row
        for (var i = 0; i < 4; i++) {
            makeBox(4, 5, 4, 0x887766, bx - 55 + i * 7, 46, bz + 5);
        }

        // Glass atrium between wings (lighter colour)
        makeBox(18, 55, 28, 0xaabbcc, bx + 15, 27, bz);
        makeWireBox(18, 55, 28, 0x66aaff, bx + 15, 27, bz);

        // Riverside waterfront terrace
        makeBox(90, 3, 20, 0x556677, bx, 1, bz + 25);

        // Armour display boxes visible through windows
        for (var j = 0; j < 5; j++) {
            makeBox(5, 6, 4, 0xccaa55, bx - 20 + j * 10, 10 + j * 8, bz - 10);
        }

        // Entrance canopy
        makeBox(20, 4, 10, 0x334455, bx, 5, bz + 20);

        // River Aire – blue strip
        makeBox(200, 1, 30, 0x2244aa, bx, 0, bz + 50);
    }

    function buildLeedsTownHall() {
        var bx = X_OFFSET + 150;
        var bz = 100;

        // Base plinth / steps
        makeBox(80, 4, 60, 0xddccbb, bx, 2, bz);
        makeBox(74, 2, 54, 0xddccbb, bx, 5, bz);

        // Main hall body
        makeBox(70, 30, 50, 0xccbbaa, bx, 20, bz);

        // Eight-column portico – front columns
        for (var c = 0; c < 8; c++) {
            makeCylinder(1.2, 1.2, 28, 8, 0xeeddcc, bx - 28 + c * 8, 16, bz + 30);
        }
        // Portico pediment
        makeBox(66, 6, 8, 0xddccbb, bx, 36, bz + 28);

        // Massive dome on top
        makeSphere(18, 16, 12, 0xbbaa99, bx, 48, bz);
        // Dome drum cylinder
        makeCylinder(18, 18, 10, 16, 0xccbbaa, bx, 38, bz);

        // Clock tower – square tower at side
        makeBox(12, 55, 12, 0xccbbaa, bx + 40, 27, bz);
        // Clock faces (flat squares)
        makeBox(10, 10, 2, 0xffffff, bx + 40, 50, bz + 7);
        makeBox(10, 10, 2, 0xffffff, bx + 40, 50, bz - 7);
        makeBox(2, 10, 10, 0xffffff, bx + 47, 50, bz);
        // Tower spire
        makeCone(5, 15, 4, 0x998877, bx + 40, 62, bz);

        // Victoria Square ground
        makeBox(120, 1, 90, 0x888888, bx, 0, bz + 20);

        // Victoria statue
        makeCylinder(1, 1, 10, 6, 0x999999, bx, 5, bz + 40);
        makeSphere(3, 8, 6, 0xbbbbbb, bx, 12, bz + 40);

        // Side wings
        makeBox(20, 20, 50, 0xccbbaa, bx - 50, 10, bz);
        makeBox(20, 20, 50, 0xccbbaa, bx + 50, 10, bz);
    }

    function buildHeadingley() {
        var bx = X_OFFSET + 350;
        var bz = -100;

        // Cricket pitch – green square
        makeBox(60, 1, 60, 0x336622, bx, 0, bz);
        // Pitch strip (lighter)
        makeBox(4, 1.1, 20, 0x99bb55, bx, 0, bz);

        // Outfield surrounding pitch
        makeBox(160, 1, 160, 0x447733, bx, -0.5, bz);

        // Victorian pavilion – main building
        makeBox(50, 15, 20, 0xcc9966, bx - 70, 7, bz);
        // Pavilion roof
        makeBox(52, 4, 22, 0x884422, bx - 70, 17, bz);
        // Pavilion veranda columns
        for (var vc = 0; vc < 6; vc++) {
            makeCylinder(0.8, 0.8, 8, 6, 0xddccbb, bx - 90 + vc * 8, 4, bz + 11);
        }
        // Pavilion second storey balcony
        makeBox(50, 8, 18, 0xbb8855, bx - 70, 19, bz);

        // Four floodlight towers
        var floodPositions = [
            [bx + 70, bz + 70],
            [bx - 70, bz + 70],
            [bx + 70, bz - 70],
            [bx - 70, bz - 70]
        ];
        for (var fi = 0; fi < 4; fi++) {
            var fx = floodPositions[fi][0];
            var fz = floodPositions[fi][1];
            // Tower mast
            makeCylinder(1, 1.5, 40, 4, 0xaaaaaa, fx, 20, fz);
            // Light array platform
            makeBox(12, 3, 8, 0x888888, fx, 41, fz);
            // Individual light units
            for (var lp = 0; lp < 4; lp++) {
                makeBox(2, 2, 2, 0xffffee, fx - 4 + lp * 2.5, 43, fz);
            }
        }

        // Terraced seating stands – north and south
        for (var ts = 0; ts < 8; ts++) {
            makeBox(140, 3 + ts * 1.5, 5, 0x6688aa, bx, 1.5 + ts * 2.5, bz + 45 + ts * 5);
            makeBox(140, 3 + ts * 1.5, 5, 0x6688aa, bx, 1.5 + ts * 2.5, bz - 45 - ts * 5);
        }
        // East stand
        for (var es = 0; es < 6; es++) {
            makeBox(5, 3 + es * 1.5, 120, 0x5577aa, bx + 55 + es * 5, 1.5 + es * 2.5, bz);
        }

        // Scoreboard
        makeBox(20, 12, 3, 0x222222, bx + 85, 7, bz + 30);
        makeBox(18, 10, 1, 0x004400, bx + 85, 7, bz + 31);
    }

    function buildKirkstallAbbey() {
        var bx = X_OFFSET - 200;
        var bz = 200;

        // Ground / park grass
        makeBox(180, 1, 130, 0x557744, bx, -0.5, bz);

        // Nave walls – roofless tall stone walls
        // North wall
        makeBox(100, 25, 4, 0x887766, bx, 12, bz - 30);
        // South wall
        makeBox(100, 22, 4, 0x887766, bx, 11, bz + 30);
        // West gable end
        makeBox(4, 28, 60, 0x887766, bx - 50, 14, bz);
        // East end (partially ruined – shorter)
        makeBox(4, 18, 60, 0x998877, bx + 50, 9, bz);

        // Lancet window openings (represented as dark inset boxes)
        for (var nw = 0; nw < 5; nw++) {
            makeBox(4, 10, 2, 0x333322, bx - 35 + nw * 17, 15, bz - 29);
            makeBox(4, 10, 2, 0x333322, bx - 35 + nw * 17, 15, bz + 29);
        }

        // Central tower (mostly intact)
        makeBox(16, 40, 16, 0x887766, bx + 10, 20, bz);
        // Tower battlements
        for (var tb = 0; tb < 4; tb++) {
            makeBox(4, 5, 4, 0x776655, bx + 4, 41, bz - 6 + tb * 4);
            makeBox(4, 5, 4, 0x776655, bx + 16, 41, bz - 6 + tb * 4);
        }
        for (var tb2 = 0; tb2 < 4; tb2++) {
            makeBox(4, 5, 4, 0x776655, bx + 4 + tb2 * 4, 41, bz - 6);
            makeBox(4, 5, 4, 0x776655, bx + 4 + tb2 * 4, 41, bz + 6);
        }

        // Chapter house – rounded east end (use cylinder)
        makeCylinder(14, 14, 8, 8, 0x998877, bx + 70, 4, bz + 50);
        makeBox(20, 8, 15, 0x887766, bx + 60, 4, bz + 50);

        // Gatehouse – entrance to abbey
        makeBox(16, 18, 12, 0x887766, bx - 75, 9, bz);
        // Gate arch (dark opening)
        makeBox(6, 10, 4, 0x222211, bx - 75, 5, bz);

        // Cloister wall remnants
        makeBox(60, 6, 3, 0x998877, bx - 15, 3, bz + 18);
        makeBox(3, 6, 40, 0x998877, bx - 45, 3, bz + 0);

        // River Aire beside abbey
        makeBox(200, 1, 20, 0x2255aa, bx, 0, bz + 80);
    }

    function buildLeedsLiverpoolCanal() {
        var bx = X_OFFSET - 50;
        var bz = 50;

        // Canal water channel
        makeBox(300, 1, 18, 0x336699, bx, 0, bz);

        // Canal towpath – north bank
        makeBox(300, 1, 8, 0x886644, bx, 0.5, bz - 13);
        // Canal towpath – south bank
        makeBox(300, 1, 8, 0x886644, bx, 0.5, bz + 13);

        // Canal banks
        makeBox(300, 3, 4, 0x557744, bx, 1.5, bz - 17);
        makeBox(300, 3, 4, 0x557744, bx, 1.5, bz + 17);

        // Granary Wharf basin – wider area
        makeBox(60, 1, 40, 0x2244aa, bx - 80, 0, bz + 10);
        // Basin quay edge
        makeBox(60, 3, 4, 0x554433, bx - 80, 1.5, bz + 30);

        // Canal lock – pair of gates
        makeBox(20, 4, 2, 0x553311, bx + 40, 2, bz - 8);
        makeBox(20, 4, 2, 0x553311, bx + 40, 2, bz + 8);
        // Lock balance beams
        makeBox(14, 2, 2, 0x442200, bx + 40 - 3, 5, bz - 8);
        makeBox(14, 2, 2, 0x442200, bx + 40 - 3, 5, bz + 8);
        // Lock chamber walls
        makeBox(2, 5, 18, 0x665544, bx + 30, 2.5, bz);
        makeBox(2, 5, 18, 0x665544, bx + 50, 2.5, bz);

        // Narrowboats moored along canal
        var boatColors = [0xcc3333, 0x3355cc, 0x228833, 0xcc8822, 0x882288];
        for (var nb = 0; nb < 5; nb++) {
            var boatX = bx - 60 + nb * 28;
            // Hull
            makeBox(20, 3, 5, boatColors[nb], boatX, 1.5, bz - 9);
            // Cabin
            makeBox(14, 4, 4, boatColors[nb], boatX, 5, bz - 9);
            // Roof
            makeBox(14, 1, 4, 0x222222, boatX, 7.5, bz - 9);
        }

        // Victorian warehouses at Granary Wharf
        makeBox(40, 25, 20, 0xaa8866, bx - 100, 12, bz + 45);
        makeBox(30, 22, 20, 0x997755, bx - 55, 11, bz + 45);
        makeBox(35, 28, 20, 0xaa8866, bx - 25, 14, bz + 45);
        // Warehouse loading bays
        for (var wb = 0; wb < 3; wb++) {
            makeBox(8, 12, 2, 0x332211, bx - 100 + wb * 38, 6, bz + 36);
        }
        // Warehouse windows – upper floors
        for (var ww = 0; ww < 4; ww++) {
            makeBox(5, 6, 2, 0xccaa77, bx - 115 + ww * 12, 18, bz + 36);
        }
    }

    function buildLeedsCityCentre() {
        var bx = X_OFFSET + 80;
        var bz = -50;

        // Corn Exchange – oval building
        makeCylinder(28, 28, 18, 12, 0xbbaa88, bx, 9, bz);
        // Corn Exchange dome roof
        makeSphere(28, 12, 8, 0x998866, bx, 24, bz);
        // Corn Exchange entrance portico
        makeBox(20, 10, 10, 0xccbbaa, bx + 30, 5, bz);

        // Grand Theatre – ornate Victorian
        makeBox(45, 28, 30, 0xbbaa88, bx + 120, 14, bz - 60);
        // Theatre facade columns
        for (var tc = 0; tc < 6; tc++) {
            makeCylinder(1, 1, 22, 6, 0xddccbb, bx + 103 + tc * 7, 11, bz - 46);
        }
        // Theatre dome
        makeSphere(12, 10, 8, 0x998877, bx + 120, 36, bz - 60);
        // Theatre pediment
        makeBox(46, 5, 6, 0xccbbaa, bx + 120, 30, bz - 46);

        // Merrion Centre – 1960s brutalist block
        makeBox(70, 40, 50, 0x888888, bx - 80, 20, bz - 80);
        // Merrion concrete sunshades
        for (var ms = 0; ms < 8; ms++) {
            makeBox(70, 2, 4, 0x777777, bx - 80, 8 + ms * 5, bz - 58);
        }

        // Trinity Leeds – modern shopping centre
        makeBox(80, 20, 60, 0xaabbcc, bx + 50, 10, bz + 60);
        // Trinity glass roof
        makeBox(80, 8, 60, 0x99aacc, bx + 50, 22, bz + 60);
        makeWireBox(80, 8, 60, 0x6688ff, bx + 50, 22, bz + 60);
        // Trinity entrance
        makeBox(20, 15, 6, 0xbbccdd, bx + 50, 7, bz + 32);

        // The Calls – waterfront regeneration
        // Converted warehouse apartments
        makeBox(35, 20, 15, 0xcc9955, bx - 40, 10, bz + 80);
        makeBox(28, 18, 15, 0xbb8844, bx - 5, 9, bz + 80);
        makeBox(32, 22, 15, 0xcc9955, bx + 30, 11, bz + 80);
        // The Calls windows
        for (var cw = 0; cw < 5; cw++) {
            makeBox(4, 5, 2, 0x334455, bx - 50 + cw * 17, 12, bz + 73);
            makeBox(4, 5, 2, 0x334455, bx - 50 + cw * 17, 19, bz + 73);
        }
        // Waterfront walkway
        makeBox(120, 1, 10, 0x777766, bx, 0.5, bz + 73);

        // General city streets and ground
        makeBox(400, 1, 300, 0x555555, bx, -1, bz);

        // Street blocks – generic Victorian terraces
        for (var sb = 0; sb < 6; sb++) {
            makeBox(25, 15, 20, 0xaa8855, bx - 180 + sb * 45, 7.5, bz - 130);
        }
        for (var sb2 = 0; sb2 < 5; sb2++) {
            makeBox(20, 12, 20, 0x997744, bx - 150 + sb2 * 45, 6, bz + 130);
        }

        // Street lamps along main road
        for (var sl = 0; sl < 10; sl++) {
            makeCylinder(0.3, 0.3, 8, 4, 0x555555, bx - 180 + sl * 40, 4, bz + 5);
            makeSphere(1.5, 6, 4, 0xffffee, bx - 180 + sl * 40, 9, bz + 5);
        }
    }

    function build() {
        buildRoyalArmouries();
        buildLeedsTownHall();
        buildHeadingley();
        buildKirkstallAbbey();
        buildLeedsLiverpoolCanal();
        buildLeedsCityCentre();
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
