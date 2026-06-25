window.MiddlesbroughTransporter = (function() {
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

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        return addMesh(line);
    }

    function build() {
        var cx = 22000;

        // -------------------------------------------------------
        // GROUND PLANE (using BoxGeometry as allowed)
        // -------------------------------------------------------
        makeBox(8000, 2, 8000, 0x5C7A3E, cx, -1, 0);

        // -------------------------------------------------------
        // RIVER TEES — wide industrial river running east-west
        // -------------------------------------------------------
        makeBox(6000, 1, 400, 0x4682B4, cx, 0.5, 0);
        // River surface shimmer strips
        makeBox(5800, 0.5, 30, 0x5A9FD4, cx - 200, 1.2, -60);
        makeBox(5800, 0.5, 30, 0x5A9FD4, cx + 100, 1.2, 80);
        makeBox(5800, 0.5, 30, 0x5A9FD4, cx - 400, 1.2, -20);

        // -------------------------------------------------------
        // TRANSPORTER BRIDGE (1911)
        // Main structure centered at cx, z=0 spanning river
        // -------------------------------------------------------

        // SOUTH TOWER — left bank (z = +220)
        // Tower legs (4 legs forming A-frame)
        makeBox(8, 160, 8, 0x444444, cx - 20, 80, 230);
        makeBox(8, 160, 8, 0x444444, cx + 20, 80, 230);
        makeBox(8, 160, 8, 0x444444, cx - 20, 80, 210);
        makeBox(8, 160, 8, 0x444444, cx + 20, 80, 210);
        // Tower cross-bracing horizontal bands
        makeBox(50, 5, 30, 0x444444, cx, 40, 220);
        makeBox(50, 5, 30, 0x444444, cx, 80, 220);
        makeBox(50, 5, 30, 0x444444, cx, 120, 220);
        // Tower cap
        makeBox(55, 8, 35, 0x444444, cx, 162, 220);
        // Tower diagonal lattice south
        makeBox(4, 80, 4, 0x444444, cx - 10, 80, 222);
        makeBox(4, 80, 4, 0x444444, cx + 10, 80, 218);

        // NORTH TOWER — right bank (z = -220)
        makeBox(8, 160, 8, 0x444444, cx - 20, 80, -230);
        makeBox(8, 160, 8, 0x444444, cx + 20, 80, -230);
        makeBox(8, 160, 8, 0x444444, cx - 20, 80, -210);
        makeBox(8, 160, 8, 0x444444, cx + 20, 80, -210);
        // Tower cross-bracing
        makeBox(50, 5, 30, 0x444444, cx, 40, -220);
        makeBox(50, 5, 30, 0x444444, cx, 80, -220);
        makeBox(50, 5, 30, 0x444444, cx, 120, -220);
        // Tower cap
        makeBox(55, 8, 35, 0x444444, cx, 162, -220);
        // Tower diagonal lattice north
        makeBox(4, 80, 4, 0x444444, cx - 10, 80, -222);
        makeBox(4, 80, 4, 0x444444, cx + 10, 80, -218);

        // HIGH-LEVEL HORIZONTAL TRUSS SPAN (top beam across river)
        makeBox(60, 12, 440, 0x444444, cx, 160, 0);
        // Truss chord bottom
        makeBox(58, 6, 436, 0x555555, cx, 145, 0);
        // Truss verticals (lattice members along span)
        var trussZ = -200;
        while (trussZ <= 200) {
            makeBox(4, 18, 4, 0x3A3A3A, cx - 22, 151, trussZ);
            makeBox(4, 18, 4, 0x3A3A3A, cx + 22, 151, trussZ);
            trussZ += 40;
        }

        // SUSPENSION CABLES / HANGERS from top span to gondola
        // Vertical hanger rods
        makeBox(2, 120, 2, 0x333333, cx - 10, 90, -100);
        makeBox(2, 120, 2, 0x333333, cx + 10, 90, -100);
        makeBox(2, 120, 2, 0x333333, cx - 10, 90, 0);
        makeBox(2, 120, 2, 0x333333, cx + 10, 90, 0);
        makeBox(2, 120, 2, 0x333333, cx - 10, 90, 100);
        makeBox(2, 120, 2, 0x333333, cx + 10, 90, 100);

        // GONDOLA CAR (hangs below span, ferries vehicles across)
        makeBox(44, 14, 80, 0x444444, cx, 28, 0);
        // Gondola floor
        makeBox(40, 2, 76, 0x666666, cx, 22, 0);
        // Gondola side railings
        makeBox(40, 4, 2, 0x555555, cx, 32, 38);
        makeBox(40, 4, 2, 0x555555, cx, 32, -38);
        makeBox(2, 4, 76, 0x555555, cx - 20, 32, 0);
        makeBox(2, 4, 76, 0x555555, cx + 20, 32, 0);
        // Gondola trolley beam above (runs in top span)
        makeBox(46, 6, 84, 0x333333, cx, 36, 0);

        // APPROACH ROAD RAMPS each side
        makeBox(30, 4, 80, 0x888888, cx, 2, 290);
        makeBox(30, 4, 80, 0x888888, cx, 2, -290);

        // -------------------------------------------------------
        // RIVER TEES BANKS & FLOOD WALLS
        // -------------------------------------------------------
        makeBox(6000, 8, 40, 0x888877, cx, 4, 220);
        makeBox(6000, 8, 40, 0x888877, cx, 4, -220);

        // -------------------------------------------------------
        // MIDDLESBROUGH TOWN CENTRE — south of river
        // -------------------------------------------------------

        // Victorian Town Hall (large civic building)
        makeBox(80, 40, 60, 0xC8B89A, cx - 600, 20, 450);
        // Town Hall clock tower
        makeBox(16, 80, 16, 0xBBAA88, cx - 600, 60, 420);
        makeCone(12, 20, 4, 0x884433, cx - 600, 110, 420);
        // Town Hall steps
        makeBox(90, 4, 20, 0xD4C8A8, cx - 600, 2, 490);

        // Shopping Centre (Cleveland Centre style box)
        makeBox(160, 28, 100, 0xCCCCBB, cx - 400, 14, 520);
        makeBox(120, 6, 80, 0xAAAAAA, cx - 400, 28, 520);

        // Office blocks
        makeBox(30, 60, 30, 0xB0A898, cx - 550, 30, 550);
        makeBox(25, 45, 25, 0xB8B0A0, cx - 480, 22, 600);
        makeBox(20, 35, 20, 0xC0B8A8, cx - 620, 17, 540);

        // Bus station / transport interchange
        makeBox(100, 10, 60, 0xAAAAAA, cx - 700, 5, 480);
        makeBox(108, 2, 65, 0x999999, cx - 700, 10, 480);

        // Market / Retail park
        makeBox(80, 14, 50, 0xBBBBBB, cx - 350, 7, 620);

        // -------------------------------------------------------
        // MIMA — Middlesbrough Institute of Modern Art
        // White cube gallery, distinct modern architecture
        // -------------------------------------------------------
        makeBox(70, 30, 70, 0xF5F5DC, cx - 680, 15, 440);
        // MIMA flat roof detail
        makeBox(72, 4, 72, 0xEEEECC, cx - 680, 30, 440);
        // MIMA entrance canopy
        makeBox(30, 6, 8, 0xF0F0E0, cx - 680, 18, 476);
        // MIMA glazed facade strip
        makeBox(68, 16, 2, 0xC8E8F8, cx - 680, 20, 474);

        // -------------------------------------------------------
        // RIVERSIDE STADIUM — Middlesbrough FC
        // -------------------------------------------------------
        // Main stand
        makeBox(200, 35, 60, 0xCCCCCC, cx - 900, 17, 350);
        // East stand
        makeBox(60, 28, 160, 0xCCCCCC, cx - 990, 14, 350);
        // West stand
        makeBox(60, 28, 160, 0xCCCCCC, cx - 810, 14, 350);
        // North stand
        makeBox(200, 30, 50, 0xCCCCCC, cx - 900, 15, 270);
        // Pitch (artificial green)
        makeBox(160, 1, 110, 0x3A7D3A, cx - 900, 2, 350);
        // Stadium roof
        makeBox(220, 6, 10, 0xAAAAAA, cx - 900, 35, 295);
        makeBox(220, 6, 10, 0xAAAAAA, cx - 900, 35, 405);
        // Floodlight pylons
        makeCylinder(1.5, 1.5, 50, 6, 0x888888, cx - 820, 25, 290);
        makeCylinder(1.5, 1.5, 50, 6, 0x888888, cx - 980, 25, 290);
        makeCylinder(1.5, 1.5, 50, 6, 0x888888, cx - 820, 25, 410);
        makeCylinder(1.5, 1.5, 50, 6, 0x888888, cx - 980, 25, 410);

        // -------------------------------------------------------
        // ICI WILTON CHEMICAL COMPLEX (north bank, east)
        // Vast petrochemical plant
        // -------------------------------------------------------

        // Main process buildings
        makeBox(200, 30, 120, 0xD3D3D3, cx + 800, 15, -500);
        makeBox(150, 25, 80, 0xC8C8C8, cx + 700, 12, -400);
        makeBox(180, 20, 100, 0xD0D0D0, cx + 950, 10, -450);

        // Distillation columns (tall cylinders)
        makeCylinder(8, 8, 100, 8, 0xD3D3D3, cx + 780, 50, -480);
        makeCylinder(6, 6, 80, 8, 0xD3D3D3, cx + 810, 40, -480);
        makeCylinder(10, 10, 120, 8, 0xD3D3D3, cx + 840, 60, -500);
        makeCylinder(7, 7, 90, 8, 0xD3D3D3, cx + 760, 45, -520);
        makeCylinder(5, 5, 70, 8, 0xD3D3D3, cx + 870, 35, -520);

        // Storage tanks (spheres and cylinders)
        makeSphere(25, 8, 6, 0xD3D3D3, cx + 900, 25, -600);
        makeSphere(20, 8, 6, 0xD3D3D3, cx + 950, 20, -600);
        makeSphere(30, 8, 6, 0xD3D3D3, cx + 860, 30, -640);
        makeCylinder(20, 20, 20, 8, 0xCCCCCC, cx + 1000, 10, -550);
        makeCylinder(18, 18, 18, 8, 0xCCCCCC, cx + 1050, 9, -580);

        // Flare stacks (tall thin cylinders with cone tips)
        makeCylinder(2, 2, 120, 6, 0xBBBBBB, cx + 750, 60, -600);
        makeCone(4, 8, 6, 0xFF6600, cx + 750, 124, -600);
        makeCylinder(2, 2, 100, 6, 0xBBBBBB, cx + 820, 50, -640);
        makeCone(3, 6, 6, 0xFF4400, cx + 820, 103, -640);
        makeCylinder(2, 2, 140, 6, 0xBBBBBB, cx + 920, 70, -560);
        makeCone(5, 10, 6, 0xFF5500, cx + 920, 145, -560);

        // Pipe racks (low horizontal boxes)
        makeBox(300, 4, 6, 0xAAAAAA, cx + 850, 12, -470);
        makeBox(300, 4, 6, 0xAAAAAA, cx + 850, 18, -470);
        makeBox(6, 4, 200, 0xAAAAAA, cx + 850, 12, -550);

        // Cooling towers (ICI style)
        makeCylinder(15, 20, 50, 8, 0xC8C8C8, cx + 1100, 25, -500);
        makeCylinder(12, 18, 45, 8, 0xC8C8C8, cx + 1140, 22, -500);
        makeCylinder(14, 19, 48, 8, 0xC8C8C8, cx + 1120, 24, -540);

        // -------------------------------------------------------
        // TEESSIDE STEELWORKS — REDCAR (east, now closed)
        // -------------------------------------------------------

        // Blast furnace bodies (large cylinders)
        makeCylinder(25, 25, 80, 8, 0x888888, cx + 1500, 40, 100);
        makeCylinder(22, 22, 70, 8, 0x888888, cx + 1560, 35, 100);
        makeCylinder(20, 20, 65, 8, 0x888888, cx + 1620, 32, 100);

        // Blast furnace stoves (tall narrow cylinders beside furnace)
        makeCylinder(8, 8, 90, 8, 0x777777, cx + 1480, 45, 60);
        makeCylinder(8, 8, 90, 8, 0x777777, cx + 1480, 45, 140);
        makeCylinder(8, 8, 90, 8, 0x777777, cx + 1540, 45, 60);

        // Steel mill main building
        makeBox(400, 25, 150, 0x888888, cx + 1700, 12, 80);
        // Coke ovens building
        makeBox(200, 18, 40, 0x777777, cx + 1600, 9, 200);

        // Slag heaps (flattened cones/spheres)
        makeCone(60, 30, 6, 0x555555, cx + 1400, 15, 200);
        makeCone(45, 22, 6, 0x4A4A4A, cx + 1460, 11, 250);
        makeCone(50, 25, 6, 0x505050, cx + 1350, 12, 180);

        // Steelworks cooling towers
        makeCylinder(18, 24, 60, 8, 0x888888, cx + 1800, 30, 50);
        makeCylinder(16, 22, 55, 8, 0x888888, cx + 1845, 27, 50);
        makeCylinder(17, 23, 58, 8, 0x888888, cx + 1822, 29, 100);

        // Ore stockyard (flat boxes)
        makeBox(120, 15, 80, 0x6B6B6B, cx + 1500, 7, -100);
        makeBox(100, 10, 60, 0x5A5A5A, cx + 1620, 5, -120);

        // Chimney stacks
        makeCylinder(5, 7, 100, 8, 0x666666, cx + 1700, 50, 180);
        makeCylinder(4, 6, 90, 8, 0x666666, cx + 1750, 45, 200);
        makeCylinder(6, 8, 110, 8, 0x666666, cx + 1650, 55, 160);

        // -------------------------------------------------------
        // CARGO FLEET — former steel works site, industrial wasteland
        // -------------------------------------------------------
        makeBox(500, 6, 300, 0x777777, cx + 200, 3, -350);
        // Derelict structures
        makeBox(40, 20, 30, 0x666666, cx + 250, 10, -380);
        makeBox(30, 14, 25, 0x5A5A5A, cx + 320, 7, -360);
        makeBox(20, 18, 20, 0x6A6A6A, cx + 180, 9, -400);
        // Rusted hoppers
        makeCone(12, 15, 6, 0x8B4513, cx + 280, 15, -420);
        makeCone(10, 12, 6, 0x7A3B0F, cx + 240, 12, -440);
        // Wasteland rubble mounds
        makeCone(25, 8, 6, 0x777777, cx + 350, 4, -300);
        makeCone(20, 6, 6, 0x666666, cx + 150, 3, -320);
        // Old conveyor support
        makeBox(4, 30, 4, 0x666666, cx + 200, 15, -300);
        makeBox(4, 30, 4, 0x666666, cx + 260, 15, -300);
        makeBox(80, 4, 4, 0x555555, cx + 230, 30, -300);

        // -------------------------------------------------------
        // CAPTAIN COOK BIRTHPLACE MARKER — Marton village
        // -------------------------------------------------------
        // Memorial cottage
        makeBox(20, 10, 14, 0xDEB887, cx - 1200, 5, 700);
        makeCone(12, 6, 4, 0x8B6914, cx - 1200, 13, 700);
        // Obelisk / monument
        makeCylinder(1.5, 2.5, 25, 4, 0xD2B48C, cx - 1180, 12, 690);
        makeCone(2, 5, 4, 0xC8A878, cx - 1180, 27, 690);
        // Surrounding parkland
        makeBox(100, 1, 80, 0x5C8A3A, cx - 1200, 0.5, 700);
        // Trees (cones on cylinders)
        makeCylinder(1, 1, 8, 6, 0x5C3A1A, cx - 1220, 4, 680);
        makeCone(6, 12, 6, 0x2E6B2E, cx - 1220, 14, 680);
        makeCylinder(1, 1, 8, 6, 0x5C3A1A, cx - 1240, 4, 710);
        makeCone(6, 12, 6, 0x2E6B2E, cx - 1240, 14, 710);
        makeCylinder(1, 1, 8, 6, 0x5C3A1A, cx - 1160, 4, 695);
        makeCone(6, 12, 6, 0x2E6B2E, cx - 1160, 14, 695);

        // -------------------------------------------------------
        // NORTH YORKSHIRE MOORS — moorland escarpment to south
        // -------------------------------------------------------
        makeBox(4000, 80, 200, 0x8B7355, cx, 40, 1200);
        makeBox(3000, 100, 150, 0x7A6345, cx - 300, 50, 1350);
        makeBox(3500, 70, 180, 0x8F7A58, cx + 200, 35, 1180);
        // Moor crests / ridgeline bumps
        makeCone(200, 60, 6, 0x8B7355, cx - 500, 80, 1300);
        makeCone(180, 50, 6, 0x7D6748, cx + 400, 70, 1280);
        makeCone(250, 80, 6, 0x8B7355, cx - 100, 90, 1400);
        makeCone(160, 45, 6, 0x957A5A, cx + 700, 62, 1350);

        // Moorland vegetation patches
        makeBox(800, 3, 300, 0x6B5C3A, cx - 600, 80, 1250);
        makeBox(600, 3, 250, 0x7A6848, cx + 500, 70, 1300);

        // -------------------------------------------------------
        // LATTICE WIRE DETAILS on Transporter Bridge
        // Using LineSegments for structural lattice effect
        // -------------------------------------------------------
        var latticePts = [
            new THREE.Vector3(cx - 25, 0, 220),
            new THREE.Vector3(cx + 25, 160, 220),
            new THREE.Vector3(cx + 25, 0, 220),
            new THREE.Vector3(cx - 25, 160, 220),
            new THREE.Vector3(cx - 25, 0, -220),
            new THREE.Vector3(cx + 25, 160, -220),
            new THREE.Vector3(cx + 25, 0, -220),
            new THREE.Vector3(cx - 25, 160, -220),
            new THREE.Vector3(cx - 25, 140, -220),
            new THREE.Vector3(cx - 25, 140, 220),
            new THREE.Vector3(cx + 25, 140, -220),
            new THREE.Vector3(cx + 25, 140, 220)
        ];
        makeLines(latticePts, 0x333333);

        // Hanger cable lines from top span to gondola
        var hangerPts = [
            new THREE.Vector3(cx, 144, -180),
            new THREE.Vector3(cx, 35, -180),
            new THREE.Vector3(cx, 144, -90),
            new THREE.Vector3(cx, 35, -90),
            new THREE.Vector3(cx, 144, 0),
            new THREE.Vector3(cx, 35, 0),
            new THREE.Vector3(cx, 144, 90),
            new THREE.Vector3(cx, 35, 90),
            new THREE.Vector3(cx, 144, 180),
            new THREE.Vector3(cx, 35, 180)
        ];
        makeLines(hangerPts, 0x222222);

        // -------------------------------------------------------
        // ADDITIONAL MIDDLESBROUGH URBAN DETAIL
        // -------------------------------------------------------

        // Tees Barrage (weir structure upriver)
        makeBox(400, 10, 20, 0x999999, cx - 2000, 5, 0);
        makeCylinder(5, 5, 20, 8, 0x888888, cx - 2000, 10, -30);
        makeCylinder(5, 5, 20, 8, 0x888888, cx - 2000, 10, 30);

        // Road bridge (A66) — simple beam bridge
        makeBox(80, 6, 400, 0x999988, cx - 400, 12, 0);
        // Bridge piers in river
        makeBox(10, 14, 20, 0x888888, cx - 400, 7, -100);
        makeBox(10, 14, 20, 0x888888, cx - 400, 7, 0);
        makeBox(10, 14, 20, 0x888888, cx - 400, 7, 100);

        // Port Clarence jetty (north bank industrial dock)
        makeBox(200, 5, 30, 0x888877, cx + 400, 2, -240);
        makeCylinder(4, 4, 15, 6, 0x666666, cx + 350, 7, -240);
        makeCylinder(4, 4, 15, 6, 0x666666, cx + 450, 7, -240);
        makeCylinder(4, 4, 15, 6, 0x666666, cx + 500, 7, -240);

        // Warehouses along river (north bank)
        makeBox(60, 15, 40, 0x886655, cx + 150, 7, -300);
        makeBox(50, 12, 35, 0x887766, cx + 230, 6, -300);
        makeBox(70, 18, 45, 0x775544, cx + 50, 9, -320);

        // South bank industrial units
        makeBox(80, 14, 50, 0x999988, cx + 100, 7, 350);
        makeBox(60, 10, 40, 0x888877, cx + 200, 5, 370);
        makeBox(90, 16, 55, 0xAA9988, cx - 50, 8, 380);

        // Cemetery / green space (Stewart Park area)
        makeBox(300, 1, 200, 0x4A6E2A, cx - 1100, 0.8, 600);
        makeCylinder(1, 1, 10, 6, 0x4A2A0A, cx - 1080, 5, 570);
        makeCone(5, 10, 6, 0x1E5C1E, cx - 1080, 15, 570);
        makeCylinder(1, 1, 10, 6, 0x4A2A0A, cx - 1060, 5, 610);
        makeCone(5, 10, 6, 0x1E5C1E, cx - 1060, 15, 610);
        makeCylinder(1, 1, 10, 6, 0x4A2A0A, cx - 1130, 5, 590);
        makeCone(5, 10, 6, 0x1E5C1E, cx - 1130, 15, 590);
    }

    function update(delta) {
        // Static environment — no animation required
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
