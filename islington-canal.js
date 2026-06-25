window.IslingtonCanal = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 11960;

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

    function makeMaterial(color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.transparent !== undefined) params.transparent = opts.transparent;
            if (opts.opacity !== undefined) params.opacity = opts.opacity;
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function makeBox(w, h, d, color, x, y, z, opts) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z, opts) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z, opts) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color, opts);
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

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(geo, mat);
        scene.add(lines);
        objects.push(lines);
        return lines;
    }

    function buildGround() {
        // Main ground plane for the area
        makeBox(600, 1, 600, 0x888866, OX, -0.5, 0);
        // Upper Street road surface
        makeBox(18, 0.3, 400, 0x444444, OX + 40, 0.2, 100);
        // Pavement strips either side of Upper Street
        makeBox(6, 0.25, 400, 0xaaaaaa, OX + 31, 0.15, 100);
        makeBox(6, 0.25, 400, 0xaaaaaa, OX + 52, 0.15, 100);
    }

    function buildRegentsCanal() {
        // Canal water — blue, slightly below ground
        makeBox(16, 0.8, 350, 0x1a5276, OX - 120, -0.1, -50);

        // Towpath north side
        makeBox(8, 0.4, 350, 0xb5a642, OX - 104, 0.2, -50);
        // Towpath south side
        makeBox(8, 0.4, 350, 0xb5a642, OX - 136, 0.2, -50);

        // Canal retaining walls
        makeBox(1.5, 3, 350, 0x8b4513, OX - 112, 1.0, -50);
        makeBox(1.5, 3, 350, 0x8b4513, OX - 128, 1.0, -50);

        // Islington Tunnel portal — brick arch entrance (north end)
        // Arch surround — large brick face
        makeBox(22, 12, 4, 0x8b3a1a, OX - 120, 5, -220);
        // Tunnel opening inside arch (darker box to represent void)
        makeBox(14, 8, 3.5, 0x111111, OX - 120, 4, -220);
        // Keystone above arch
        makeBox(4, 2, 3, 0x6b2a0a, OX - 120, 9.5, -220);
        // Side pillars of portal
        makeBox(3, 14, 4, 0x7a3318, OX - 130, 6, -220);
        makeBox(3, 14, 4, 0x7a3318, OX - 110, 6, -220);
        // Portal coping stones
        makeBox(26, 1.5, 4, 0x999999, OX - 120, 13, -220);

        // Narrowboats — 6 colored boats moored along towpath
        buildNarrowboat(0xff3300, OX - 122, 1.0, -60, true);
        buildNarrowboat(0x2244cc, OX - 122, 1.0, -90, true);
        buildNarrowboat(0x22aa44, OX - 122, 1.0, -120, true);
        buildNarrowboat(0xddaa00, OX - 122, 1.0, -150, false);
        buildNarrowboat(0xcc2266, OX - 122, 1.0, -170, false);
        buildNarrowboat(0x884400, OX - 122, 1.0, -190, false);
    }

    function buildNarrowboat(hullColor, x, y, z, facingLeft) {
        // Hull
        makeBox(3, 2, 18, hullColor, x, y, z);
        // Cabin
        makeBox(2.5, 2, 12, 0xfafafa, x, y + 2, z);
        // Roof
        makeBox(2.4, 0.4, 12, 0x333333, x, y + 3.2, z);
        // Tiller end rounded
        makeSphere(1.4, 6, 6, hullColor, x, y, z + (facingLeft ? 9 : -9));
        // Chimney
        makeCylinder(0.2, 0.2, 1.5, 6, 0x111111, x, y + 4, z + (facingLeft ? 3 : -3));
        // Bow fender rope hint
        makeBox(0.4, 0.4, 0.4, 0xddddaa, x, y + 1.2, z + (facingLeft ? 10 : -10));
    }

    function buildAngelTube() {
        // Station entrance building — art deco influenced
        // Main entrance box
        makeBox(30, 14, 16, 0xcc3300, OX + 20, 7, -10);
        // Upper section setback
        makeBox(22, 6, 12, 0xaa2800, OX + 20, 17, -10);
        // Cornice detail
        makeBox(32, 1.5, 18, 0x881800, OX + 20, 14.5, -10);
        // Entrance canopy
        makeBox(18, 1, 6, 0x444444, OX + 20, 2.5, -3);
        // Entrance pillars
        makeBox(1.5, 5, 1.5, 0xcc3300, OX + 12, 2.5, -3);
        makeBox(1.5, 5, 1.5, 0xcc3300, OX + 28, 2.5, -3);
        // Roundel sign (simplified disk + bar)
        makeCylinder(2.5, 2.5, 0.4, 12, 0x003399, OX + 20, 11, 0);
        makeBox(6, 1, 0.3, 0xdd0000, OX + 20, 11, 0);
        // Station name board
        makeBox(10, 2, 0.5, 0x003399, OX + 20, 8, 1);

        // Escalators — 3 parallel escalator shafts descending underground
        // Represented as angled long boxes going downward
        buildEscalator(OX + 17, 0, -8, -1);
        buildEscalator(OX + 20, 0, -8, -1);
        buildEscalator(OX + 23, 0, -8, -1);

        // Deep-level shaft hint — dark vertical cylinder
        makeCylinder(4, 4, 30, 10, 0x222222, OX + 20, -14, -12);

        // Upper Street surface above station (road)
        makeBox(20, 0.4, 30, 0x444444, OX + 20, 0.3, -5);
    }

    function buildEscalator(x, y, z, dir) {
        // Angled escalator shaft
        var geo = new THREE.BoxGeometry(2, 1, 24);
        var mat = makeMaterial(0x999999);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y - 6, z - 12);
        mesh.rotation.x = 0.45 * dir;
        scene.add(mesh);
        objects.push(mesh);

        // Handrail strips (dark)
        var geoR = new THREE.BoxGeometry(0.2, 0.3, 24);
        var matR = makeMaterial(0x333333);
        var rLeft = new THREE.Mesh(geoR, matR);
        rLeft.position.set(x - 0.9, y - 5.5, z - 12);
        rLeft.rotation.x = 0.45 * dir;
        scene.add(rLeft);
        objects.push(rLeft);

        var rRight = new THREE.Mesh(geoR, matR);
        rRight.position.set(x + 0.9, y - 5.5, z - 12);
        rRight.rotation.x = 0.45 * dir;
        scene.add(rRight);
        objects.push(rRight);
    }

    function buildChapelMarket() {
        // Chapel Market — narrow street running E-W
        makeBox(12, 0.3, 180, 0x555555, OX - 20, 0.2, 80);

        // Market stalls — alternating along both sides
        var stallColors = [0xee4422, 0x44aaee, 0x22cc66, 0xffaa00, 0xcc44cc, 0x88ccff];
        for (var i = 0; i < 12; i++) {
            var zPos = 10 + i * 14;
            var col = stallColors[i % stallColors.length];
            // Stall frame
            makeBox(4, 2.4, 3, 0x888888, OX - 14, 1.2, zPos);
            // Stall canopy
            makeBox(5, 0.3, 4, col, OX - 14, 2.7, zPos);
            // Opposite side stall
            makeBox(4, 2.4, 3, 0x888888, OX - 26, 1.2, zPos + 5);
            makeBox(5, 0.3, 4, stallColors[(i + 2) % stallColors.length], OX - 26, 2.7, zPos + 5);
        }

        // Covered market section — roof over central section
        makeBox(14, 0.5, 60, 0xaaaaaa, OX - 20, 5, 80);
        // Support posts for covered section
        for (var j = 0; j < 5; j++) {
            makeBox(0.5, 5, 0.5, 0x666666, OX - 13, 2.5, 55 + j * 15);
            makeBox(0.5, 5, 0.5, 0x666666, OX - 27, 2.5, 55 + j * 15);
        }

        // Victorian pub — east end of market
        makeBox(16, 14, 12, 0x883322, OX - 5, 7, 10);
        makeBox(18, 1.5, 14, 0x662211, OX - 5, 14.8, 10);
        // Pub windows
        makeBox(2.5, 3, 0.4, 0xaaddff, OX - 10, 8, 4.2);
        makeBox(2.5, 3, 0.4, 0xaaddff, OX, 8, 4.2);
        // Pub sign
        makeBox(4, 2, 0.3, 0xffcc00, OX - 5, 11, 4.2);

        // Victorian pub — west end of market
        makeBox(16, 14, 12, 0x883322, OX - 35, 7, 160);
        makeBox(18, 1.5, 14, 0x662211, OX - 35, 14.8, 160);
        makeBox(2.5, 3, 0.4, 0xaaddff, OX - 40, 8, 154.2);
        makeBox(2.5, 3, 0.4, 0xaaddff, OX - 30, 8, 154.2);
    }

    function buildSaddlersWells() {
        // Sadler's Wells Theatre — modern glass box with curved lobby
        // Main theatre block
        makeBox(50, 22, 40, 0x334455, OX + 100, 11, 200);
        // Glass facade front (slightly lighter)
        makeBox(50, 22, 1, 0x6699bb, OX + 100, 11, 180.5);
        // Curved lobby atrium — use sphere halved (approximated with cylinder + sphere)
        makeCylinder(12, 12, 14, 16, 0x557799, OX + 100, 7, 174);
        makeSphere(12, 16, 8, 0x6699aa, OX + 100, 14, 174);
        // Lobby glass walls
        makeBox(26, 14, 1, 0x88aabb, OX + 88, 7, 174);
        makeBox(26, 14, 1, 0x88aabb, OX + 112, 7, 174);
        // Theatre signage band
        makeBox(52, 2.5, 1, 0xffcc00, OX + 100, 22.5, 180.4);
        // Fly tower (tall back section)
        makeBox(36, 36, 30, 0x223344, OX + 100, 18, 210);
        // Stage door side
        makeBox(8, 10, 6, 0x445566, OX + 78, 5, 198);
        // Entrance steps
        makeBox(30, 1, 8, 0xcccccc, OX + 100, 0.5, 177);
        makeBox(24, 0.7, 6, 0xdddddd, OX + 100, 1.2, 173);
        // Exterior lighting columns
        makeCylinder(0.3, 0.3, 8, 6, 0x888888, OX + 85, 4, 179);
        makeCylinder(0.3, 0.3, 8, 6, 0x888888, OX + 115, 4, 179);
        makeSphere(0.8, 6, 6, 0xffffaa, OX + 85, 8.5, 179);
        makeSphere(0.8, 6, 6, 0xffffaa, OX + 115, 8.5, 179);
    }

    function buildUpperStreet() {
        // Upper Street main road surface
        makeBox(16, 0.3, 500, 0x333333, OX + 42, 0.2, 100);
        // White centre line markings (boxes)
        for (var i = 0; i < 20; i++) {
            makeBox(0.3, 0.35, 6, 0xffffff, OX + 42, 0.36, -100 + i * 26);
        }

        // Georgian terraces — repeated along Upper Street
        buildGeorgianTerrace(OX + 60, 0, -80);
        buildGeorgianTerrace(OX + 60, 0, -30);
        buildGeorgianTerrace(OX + 60, 0, 20);
        buildGeorgianTerrace(OX + 60, 0, 70);
        buildGeorgianTerrace(OX + 60, 0, 120);
        buildGeorgianTerrace(OX + 60, 0, 170);

        // Gastropubs with large signage
        buildGastroPub(OX + 55, 0, -100);
        buildGastroPub(OX + 55, 0, 200);

        // Essex Road junction
        makeBox(16, 0.3, 80, 0x333333, OX + 42, 0.2, -160);
        makeBox(0.3, 0.35, 6, 0xffffff, OX + 42, 0.36, -160);
        // Junction kerbs
        makeBox(1, 0.5, 80, 0x888888, OX + 34.5, 0.35, -160);
        makeBox(1, 0.5, 80, 0x888888, OX + 49.5, 0.35, -160);

        // Church spire — St Mary's style
        buildChurchSpire(OX + 80, 0, -200);
    }

    function buildGeorgianTerrace(x, y, z) {
        // Base terrace block
        makeBox(18, 18, 10, 0xddccaa, x, y + 9, z);
        // Stucco ground floor
        makeBox(18, 5, 10.2, 0xf0ece0, x, y + 2.5, z);
        // Sash windows — upper floors
        makeBox(2.5, 3, 0.5, 0x88aacc, x - 5, y + 13, z - 5.1);
        makeBox(2.5, 3, 0.5, 0x88aacc, x, y + 13, z - 5.1);
        makeBox(2.5, 3, 0.5, 0x88aacc, x + 5, y + 13, z - 5.1);
        // Ground floor sash windows
        makeBox(2.5, 3.5, 0.5, 0x88aacc, x - 5, y + 7, z - 5.1);
        makeBox(2.5, 3.5, 0.5, 0x88aacc, x + 5, y + 7, z - 5.1);
        // Door
        makeBox(2, 4, 0.5, 0x3a2210, x, y + 2, z - 5.1);
        // Parapet / cornice
        makeBox(19, 1, 11, 0xccbba0, x, y + 18.5, z);
    }

    function buildGastroPub(x, y, z) {
        // Victorian pub building
        makeBox(20, 16, 12, 0x774422, x, y + 8, z);
        makeBox(22, 2, 14, 0x552200, x, y + 17, z);
        // Decorative pilasters
        makeBox(1.2, 16, 1.2, 0x886644, x - 9, y + 8, z - 6.1);
        makeBox(1.2, 16, 1.2, 0x886644, x - 3, y + 8, z - 6.1);
        makeBox(1.2, 16, 1.2, 0x886644, x + 3, y + 8, z - 6.1);
        makeBox(1.2, 16, 1.2, 0x886644, x + 9, y + 8, z - 6.1);
        // Large pub windows
        makeBox(5, 6, 0.5, 0xaaccee, x - 6, y + 7, z - 6.2);
        makeBox(5, 6, 0.5, 0xaaccee, x + 6, y + 7, z - 6.2);
        // Pub sign hanging
        makeBox(4, 3, 0.3, 0xffaa00, x, y + 12, z - 6.2);
        // Hanging basket hints
        makeSphere(0.6, 6, 6, 0xee5599, x - 4, y + 11, z - 6.5);
        makeSphere(0.6, 6, 6, 0xee5599, x + 4, y + 11, z - 6.5);
    }

    function buildChurchSpire(x, y, z) {
        // Church nave
        makeBox(24, 14, 36, 0xddccbb, x, y + 7, z);
        // Tower base
        makeBox(10, 28, 10, 0xccbbaa, x, y + 14, z + 14);
        // Buttresses
        makeBox(2.5, 28, 2.5, 0xccbbaa, x - 4, y + 14, z + 14);
        makeBox(2.5, 28, 2.5, 0xccbbaa, x + 4, y + 14, z + 14);
        // Belfry openings
        makeBox(2, 4, 0.5, 0x222222, x, y + 24, z + 19.1);
        makeBox(0.5, 4, 2, 0x222222, x - 5.1, y + 24, z + 14);
        makeBox(0.5, 4, 2, 0x222222, x + 5.1, y + 24, z + 14);
        // Spire cone
        makeCone(5, 28, 8, 0x888877, x, y + 42, z + 14);
        // Clock faces
        makeBox(3, 3, 0.4, 0xeeeecc, x, y + 22, z + 19.2);
        makeBox(0.4, 3, 3, 0xeeeecc, x - 5.2, y + 22, z + 14);
        // Nave windows
        makeBox(2.5, 5, 0.4, 0x88aabb, x - 8, y + 9, z - 14.2);
        makeBox(2.5, 5, 0.4, 0x88aabb, x - 2, y + 9, z - 14.2);
        makeBox(2.5, 5, 0.4, 0x88aabb, x + 4, y + 9, z - 14.2);
        // Arched door
        makeBox(3, 5, 0.4, 0x553311, x, y + 2.5, z - 14.2);
        makeSphere(1.5, 8, 4, 0x553311, x, y + 5.5, z - 14.2);
    }

    function buildStreetFurniture() {
        // Lamp posts along Upper Street
        for (var i = 0; i < 10; i++) {
            var lz = -120 + i * 40;
            makeCylinder(0.2, 0.3, 8, 6, 0x444444, OX + 36, 4, lz);
            makeSphere(0.5, 6, 6, 0xffffaa, OX + 36, 8.5, lz);
            makeCylinder(0.2, 0.3, 8, 6, 0x444444, OX + 50, 4, lz + 18);
            makeSphere(0.5, 6, 6, 0xffffaa, OX + 50, 8.5, lz + 18);
        }

        // Towpath lamp posts along canal
        for (var j = 0; j < 8; j++) {
            var cz = -60 - j * 20;
            makeCylinder(0.15, 0.15, 5, 6, 0x336633, OX - 106, 2.5, cz);
            makeSphere(0.4, 6, 6, 0xffffbb, OX - 106, 5.5, cz);
        }

        // Canal towpath bollards
        for (var k = 0; k < 12; k++) {
            var bz = -55 - k * 14;
            makeCylinder(0.25, 0.3, 1.2, 6, 0x222222, OX - 101, 0.6, bz);
        }

        // Pedestrian bridge over canal
        makeBox(16, 0.8, 4, 0x888888, OX - 120, 2.2, -30);
        makeBox(0.5, 3, 4, 0x888888, OX - 112, 1, -30);
        makeBox(0.5, 3, 4, 0x888888, OX - 128, 1, -30);
        // Bridge railings
        makeBox(16, 0.3, 0.3, 0x888888, OX - 120, 3.3, -28.5);
        makeBox(16, 0.3, 0.3, 0x888888, OX - 120, 3.3, -31.5);

        // Bike racks
        makeCylinder(0.1, 0.1, 1, 6, 0x444444, OX + 28, 0.5, 0);
        makeCylinder(0.1, 0.1, 1, 6, 0x444444, OX + 30, 0.5, 0);
        makeCylinder(0.1, 0.1, 1, 6, 0x444444, OX + 32, 0.5, 0);
        makeBox(6, 0.2, 0.2, 0x444444, OX + 30, 1.1, 0);

        // Rubbish bins
        makeCylinder(0.4, 0.4, 1, 8, 0x225522, OX + 35, 0.5, 30);
        makeCylinder(0.4, 0.4, 1, 8, 0x225522, OX + 35, 0.5, -50);
        makeCylinder(0.4, 0.4, 1, 8, 0x225522, OX + 48, 0.5, 80);

        // Bus stop shelter near Angel
        makeBox(0.2, 3, 3, 0x88aacc, OX + 34, 1.5, 5);
        makeBox(4, 0.2, 3, 0x88aacc, OX + 36, 3, 5);
        makeBox(0.2, 3, 3, 0x88aacc, OX + 38, 1.5, 5);
    }

    function buildTrees() {
        // Trees along canal towpath
        var towpathTreeZ = [-55, -80, -105, -130, -155, -185];
        for (var i = 0; i < towpathTreeZ.length; i++) {
            makeCylinder(0.3, 0.4, 4, 6, 0x4a2c0a, OX - 100, 2, towpathTreeZ[i]);
            makeSphere(2.5, 8, 6, 0x226622, OX - 100, 6, towpathTreeZ[i]);
        }

        // Trees along Upper Street
        var upperTreeZ = [-100, -60, -20, 20, 60, 100, 140, 180];
        for (var j = 0; j < upperTreeZ.length; j++) {
            makeCylinder(0.3, 0.4, 4, 6, 0x4a2c0a, OX + 33, 2, upperTreeZ[j]);
            makeSphere(2, 7, 6, 0x338833, OX + 33, 6.5, upperTreeZ[j]);
        }

        // Trees outside Sadler's Wells
        makeCylinder(0.4, 0.5, 5, 6, 0x4a2c0a, OX + 86, 2.5, 178);
        makeSphere(3, 8, 6, 0x33aa33, OX + 86, 8, 178);
        makeCylinder(0.4, 0.5, 5, 6, 0x4a2c0a, OX + 114, 2.5, 178);
        makeSphere(3, 8, 6, 0x33aa33, OX + 114, 8, 178);
    }

    function buildLineDetails() {
        // Road markings as LineSegments
        var pts = [];
        // Zebra crossing near Angel
        for (var i = 0; i < 6; i++) {
            pts.push(new THREE.Vector3(OX + 35, 0.4, 8 + i * 1.4));
            pts.push(new THREE.Vector3(OX + 49, 0.4, 8 + i * 1.4));
        }
        makeLines(pts, 0xffffff);

        // Canal edge lines
        var canalPts = [];
        canalPts.push(new THREE.Vector3(OX - 112, 1.0, -225));
        canalPts.push(new THREE.Vector3(OX - 112, 1.0, -30));
        canalPts.push(new THREE.Vector3(OX - 128, 1.0, -225));
        canalPts.push(new THREE.Vector3(OX - 128, 1.0, -30));
        makeLines(canalPts, 0x5a3010);
    }

    function build() {
        buildGround();
        buildRegentsCanal();
        buildAngelTube();
        buildChapelMarket();
        buildSaddlersWells();
        buildUpperStreet();
        buildStreetFurniture();
        buildTrees();
        buildLineDetails();
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
