window.WimbledonCourts = (function() {
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

    function makeLineSegments(points, color) {
        var geo = new THREE.BufferGeometry();
        var positions = [];
        for (var i = 0; i < points.length; i++) {
            positions.push(points[i].x, points[i].y, points[i].z);
        }
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(geo, mat);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function buildCentreCourt(ox, oz) {
        // Ground base / pitch apron
        makeBox(120, 1, 160, 0x2d5a1b, ox, 0.5, oz);

        // Grass court surface
        makeBox(36, 0.3, 78, 0x3a7d2c, ox, 1.2, oz);

        // Court white lines (using LineSegments)
        var lx = ox;
        var ly = 1.5;
        var lz = oz;
        // Outer boundary lines
        makeLineSegments([
            { x: lx - 18, y: ly, z: lz - 39 }, { x: lx + 18, y: ly, z: lz - 39 },
            { x: lx + 18, y: ly, z: lz - 39 }, { x: lx + 18, y: ly, z: lz + 39 },
            { x: lx + 18, y: ly, z: lz + 39 }, { x: lx - 18, y: ly, z: lz + 39 },
            { x: lx - 18, y: ly, z: lz + 39 }, { x: lx - 18, y: ly, z: lz - 39 }
        ], 0xffffff);
        // Service boxes
        makeLineSegments([
            { x: lx - 13.5, y: ly, z: lz - 18 }, { x: lx + 13.5, y: ly, z: lz - 18 },
            { x: lx - 13.5, y: ly, z: lz + 18 }, { x: lx + 13.5, y: ly, z: lz + 18 },
            { x: lx, y: ly, z: lz - 18 }, { x: lx, y: ly, z: lz + 18 }
        ], 0xffffff);
        // Baseline singles lines
        makeLineSegments([
            { x: lx - 13.5, y: ly, z: lz - 39 }, { x: lx - 13.5, y: ly, z: lz + 39 },
            { x: lx + 13.5, y: ly, z: lz - 39 }, { x: lx + 13.5, y: ly, z: lz + 39 }
        ], 0xffffff);

        // Net posts
        makeBox(0.5, 3, 0.5, 0xcccccc, ox - 18.5, 2.5, oz);
        makeBox(0.5, 3, 0.5, 0xcccccc, ox + 18.5, 2.5, oz);
        // Net (LineSegments)
        var netPoints = [];
        for (var ni = 0; ni <= 20; ni++) {
            var nx = ox - 18.5 + ni * (37 / 20);
            netPoints.push({ x: nx, y: 1.1, z: oz });
            netPoints.push({ x: nx, y: 3.0, z: oz });
        }
        makeLineSegments(netPoints, 0xffffff);
        // Net top wire
        makeLineSegments([
            { x: ox - 18.5, y: 3.0, z: oz },
            { x: ox + 18.5, y: 3.0, z: oz }
        ], 0xffffff);

        // Umpire chair
        makeBox(1.5, 5, 1.5, 0x8b6914, ox + 20, 3.5, oz);
        makeBox(2.5, 0.3, 2, 0x5c4510, ox + 20, 6.1, oz);

        // Retractable roof panels (open position - slid back to sides)
        // North roof panels
        makeBox(55, 2, 25, 0x8a8a8a, ox - 30, 42, oz - 55);
        makeBox(55, 2, 25, 0x8a8a8a, ox + 30, 42, oz - 55);
        // South roof panels
        makeBox(55, 2, 25, 0x8a8a8a, ox - 30, 42, oz + 55);
        makeBox(55, 2, 25, 0x8a8a8a, ox + 30, 42, oz + 55);
        // Roof support trusses
        makeBox(3, 40, 3, 0x666666, ox - 55, 22, oz - 65);
        makeBox(3, 40, 3, 0x666666, ox + 55, 22, oz - 65);
        makeBox(3, 40, 3, 0x666666, ox - 55, 22, oz + 65);
        makeBox(3, 40, 3, 0x666666, ox + 55, 22, oz + 65);
        // Roof cross beam
        makeBox(115, 2, 3, 0x555555, ox, 43, oz - 65);
        makeBox(115, 2, 3, 0x555555, ox, 43, oz + 65);

        // Stadium tiered stands - 4 sides
        // South stand (main stand)
        makeBox(130, 18, 28, 0xc8b89a, ox, 10, oz + 68);
        makeBox(130, 14, 22, 0xd4c4a8, ox, 8, oz + 58);
        makeBox(130, 10, 16, 0xddd0b8, ox, 6, oz + 50);
        // North stand
        makeBox(130, 18, 28, 0xc8b89a, ox, 10, oz - 68);
        makeBox(130, 14, 22, 0xd4c4a8, ox, 8, oz - 58);
        makeBox(130, 10, 16, 0xddd0b8, ox, 6, oz - 50);
        // East stand
        makeBox(28, 18, 120, 0xc8b89a, ox + 68, 10, oz);
        makeBox(22, 14, 120, 0xd4c4a8, ox + 58, 8, oz);
        makeBox(16, 10, 120, 0xddd0b8, ox + 50, 6, oz);
        // West stand
        makeBox(28, 18, 120, 0xc8b89a, ox - 68, 10, oz);
        makeBox(22, 14, 120, 0xd4c4a8, ox - 58, 8, oz);
        makeBox(16, 10, 120, 0xddd0b8, ox - 50, 6, oz);

        // Corner towers / facade elements
        makeBox(20, 45, 20, 0xb8a888, ox - 65, 23, oz - 70);
        makeBox(20, 45, 20, 0xb8a888, ox + 65, 23, oz - 70);
        makeBox(20, 45, 20, 0xb8a888, ox - 65, 23, oz + 70);
        makeBox(20, 45, 20, 0xb8a888, ox + 65, 23, oz + 70);

        // Press/commentary boxes on top
        makeBox(30, 5, 8, 0x776655, ox, 21, oz + 82);
    }

    function buildNoOneCourt(ox, oz) {
        // Grass court
        makeBox(36, 0.3, 78, 0x3a7d2c, ox, 1.2, oz);
        makeBox(90, 0.8, 120, 0x2d5a1b, ox, 0.5, oz);

        // Court lines
        var ly = 1.5;
        makeLineSegments([
            { x: ox - 18, y: ly, z: oz - 39 }, { x: ox + 18, y: ly, z: oz - 39 },
            { x: ox + 18, y: ly, z: oz - 39 }, { x: ox + 18, y: ly, z: oz + 39 },
            { x: ox + 18, y: ly, z: oz + 39 }, { x: ox - 18, y: ly, z: oz + 39 },
            { x: ox - 18, y: ly, z: oz + 39 }, { x: ox - 18, y: ly, z: oz - 39 }
        ], 0xffffff);
        makeLineSegments([
            { x: ox - 13.5, y: ly, z: oz - 18 }, { x: ox + 13.5, y: ly, z: oz - 18 },
            { x: ox - 13.5, y: ly, z: oz + 18 }, { x: ox + 13.5, y: ly, z: oz + 18 },
            { x: ox, y: ly, z: oz - 18 }, { x: ox, y: ly, z: oz + 18 }
        ], 0xffffff);

        // Net posts
        makeBox(0.5, 3, 0.5, 0xcccccc, ox - 18.5, 2.5, oz);
        makeBox(0.5, 3, 0.5, 0xcccccc, ox + 18.5, 2.5, oz);
        makeLineSegments([
            { x: ox - 18.5, y: 3.0, z: oz },
            { x: ox + 18.5, y: 3.0, z: oz }
        ], 0xffffff);

        // Circular bowl stands — use cylinders for bowl shape
        makeCylinder(65, 70, 22, 24, 0xc8b89a, ox, 11, oz);
        makeCylinder(58, 63, 16, 24, 0xd4c4a8, ox, 8, oz);
        makeCylinder(50, 55, 10, 24, 0xddd0b8, ox, 5, oz);
        // Inner gap (remove illusion — just stack shorter cylinders for seating tiers)
        makeCylinder(46, 48, 3, 24, 0x2d5a1b, ox, 2, oz);

        // Umpire chair
        makeBox(1.5, 4, 1.5, 0x8b6914, ox + 20, 3, oz);

        // Outer facade ring
        makeCylinder(75, 78, 30, 24, 0xb8a888, ox, 15, oz);
    }

    function buildOuterCourt(ox, oz, idx) {
        // Grass surface
        makeBox(20, 0.2, 50, 0x3a7d2c, ox, 0.6, oz);
        // Ground
        makeBox(28, 0.4, 60, 0x2d5a1b, ox, 0.3, oz);

        // Court lines
        var ly = 0.9;
        makeLineSegments([
            { x: ox - 8, y: ly, z: oz - 23 }, { x: ox + 8, y: ly, z: oz - 23 },
            { x: ox + 8, y: ly, z: oz - 23 }, { x: ox + 8, y: ly, z: oz + 23 },
            { x: ox + 8, y: ly, z: oz + 23 }, { x: ox - 8, y: ly, z: oz + 23 },
            { x: ox - 8, y: ly, z: oz + 23 }, { x: ox - 8, y: ly, z: oz - 23 }
        ], 0xffffff);
        makeLineSegments([
            { x: ox - 6, y: ly, z: oz - 10 }, { x: ox + 6, y: ly, z: oz - 10 },
            { x: ox - 6, y: ly, z: oz + 10 }, { x: ox + 6, y: ly, z: oz + 10 },
            { x: ox, y: ly, z: oz - 10 }, { x: ox, y: ly, z: oz + 10 }
        ], 0xffffff);

        // Net posts
        makeBox(0.3, 2, 0.3, 0xcccccc, ox - 8.5, 1.5, oz);
        makeBox(0.3, 2, 0.3, 0xcccccc, ox + 8.5, 1.5, oz);
        makeLineSegments([
            { x: ox - 8.5, y: 2.0, z: oz },
            { x: ox + 8.5, y: 2.0, z: oz }
        ], 0xffffff);

        // Small spectator benches / barriers
        makeBox(18, 0.8, 1.5, 0x8b7355, ox, 1.2, oz - 26);
        makeBox(18, 0.8, 1.5, 0x8b7355, ox, 1.2, oz + 26);
        makeBox(1, 1.5, 48, 0x8b7355, ox - 11, 1.5, oz);
        makeBox(1, 1.5, 48, 0x8b7355, ox + 11, 1.5, oz);
    }

    function buildWimbledonCommon(ox, oz) {
        // Heathland ground
        makeBox(400, 1, 350, 0x7a9b3c, ox, 0.5, oz);
        // Scattered heath shrubs (clusters of spheres/boxes)
        var shrubPositions = [
            [-60, 30], [-40, 80], [20, -60], [80, 40], [-80, -30],
            [100, -80], [-100, 60], [30, 120], [-30, -120], [70, 100]
        ];
        for (var si = 0; si < shrubPositions.length; si++) {
            var sp = shrubPositions[si];
            makeSphere(4, 6, 6, 0x4a7a1e, ox + sp[0], 4, oz + sp[1]);
            makeSphere(3, 5, 5, 0x3d6618, ox + sp[0] + 5, 3.5, oz + sp[1] + 4);
            makeSphere(3.5, 5, 5, 0x527c22, ox + sp[0] - 4, 3, oz + sp[1] - 3);
        }

        // Path across common
        makeBox(6, 0.3, 300, 0x9b8b6a, ox + 20, 1.2, oz);
        makeBox(200, 0.3, 6, 0x9b8b6a, ox, 1.2, oz + 30);

        // Historic windmill (wooden post mill)
        // Tower/main body
        makeCylinder(4, 5, 18, 8, 0x8b6914, ox + 80, 10, oz - 80);
        // Cap on top
        makeCone(5, 6, 8, 0x6b4f10, ox + 80, 21, oz - 80);
        // Mill door
        makeBox(1.5, 3, 0.3, 0x5a3c0a, ox + 80, 3, oz - 75.2);
        // Four sails (blades) — use boxes rotated conceptually via position offset
        // Sail 1 - top vertical
        makeBox(2, 20, 0.5, 0x7a5c18, ox + 80, 29, oz - 80);
        // Sail 2 - bottom vertical
        makeBox(2, 20, 0.5, 0x7a5c18, ox + 80, 11, oz - 80);
        // Sail 3 - left horizontal
        makeBox(20, 2, 0.5, 0x7a5c18, ox + 70, 20, oz - 80);
        // Sail 4 - right horizontal
        makeBox(20, 2, 0.5, 0x7a5c18, ox + 90, 20, oz - 80);
        // Hub center
        makeSphere(1.5, 6, 6, 0x5a3c0a, ox + 80, 20, oz - 79.5);
        // Base platform
        makeBox(12, 2, 12, 0x6b5028, ox + 80, 1, oz - 80);

        // Pond / Caesar's Well area
        makeCylinder(15, 15, 0.5, 16, 0x2255aa, ox - 60, 0.8, oz + 80);
        // Pond edge
        makeCylinder(17, 17, 1, 16, 0x7a6b4a, ox - 60, 0.5, oz + 80);

        // Trees around common edge
        var treePositions = [
            [-150, -100], [-130, 50], [-110, 150], [130, -120], [150, 80], [120, 160],
            [-80, -150], [80, -160], [0, 170], [-160, 0]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var tp = treePositions[ti];
            makeCylinder(0.8, 1, 10, 6, 0x5c3d1e, ox + tp[0], 6, oz + tp[1]);
            makeSphere(6, 7, 7, 0x2d6b1a, ox + tp[0], 14, oz + tp[1]);
        }
    }

    function buildWimbledonVillage(ox, oz) {
        // High Street ground
        makeBox(80, 0.5, 200, 0x8a8070, ox, 0.3, oz);
        // Pavement sides
        makeBox(6, 0.4, 200, 0xb0a898, ox - 43, 0.3, oz);
        makeBox(6, 0.4, 200, 0xb0a898, ox + 43, 0.3, oz);
        // Road markings
        makeLineSegments([
            { x: ox, y: 0.6, z: oz - 100 }, { x: ox, y: 0.6, z: oz + 100 }
        ], 0xffffff);

        // Dog & Fox pub
        makeBox(18, 10, 14, 0x8b2020, ox - 30, 6, oz - 60);
        makeBox(18, 2, 14, 0x6b1818, ox - 30, 12, oz - 60);
        // Pub sign
        makeBox(6, 4, 0.3, 0x3d1a00, ox - 21.5, 8, oz - 60);
        // Pub windows
        makeBox(3, 2.5, 0.2, 0x88ccff, ox - 26, 7, oz - 53.2);
        makeBox(3, 2.5, 0.2, 0x88ccff, ox - 34, 7, oz - 53.2);
        // Pub chimney
        makeCylinder(0.6, 0.7, 5, 6, 0x6b5028, ox - 33, 16, oz - 60);

        // Victorian houses - row on west side
        var houseColors = [0xc4956a, 0xa07850, 0xb88c60, 0xd4a878, 0xba9060];
        for (var hi = 0; hi < 5; hi++) {
            var hz = oz - 20 + hi * 30;
            makeBox(14, 12, 16, houseColors[hi], ox - 30, 7, hz);
            // Roof
            makeCone(10, 7, 4, 0x6b3c1e, ox - 30, 14.5, hz);
            // Door
            makeBox(2.5, 4, 0.2, 0x3d1a00, ox - 30, 3, hz - 8.1);
            // Windows (2 per house)
            makeBox(2.5, 2.5, 0.2, 0x88ccff, ox - 26, 8, hz - 8.1);
            makeBox(2.5, 2.5, 0.2, 0x88ccff, ox - 34, 8, hz - 8.1);
            // Chimney
            makeBox(2, 5, 2, 0x8b6040, ox - 28, 17.5, hz - 5);
        }

        // Victorian houses - row on east side
        for (var hi2 = 0; hi2 < 5; hi2++) {
            var hz2 = oz - 20 + hi2 * 30;
            makeBox(14, 12, 16, houseColors[(hi2 + 2) % 5], ox + 30, 7, hz2);
            makeCone(10, 7, 4, 0x6b3c1e, ox + 30, 14.5, hz2);
            makeBox(2.5, 4, 0.2, 0x3d1a00, ox + 30, 3, hz2 - 8.1);
            makeBox(2.5, 2.5, 0.2, 0x88ccff, ox + 26, 8, hz2 - 8.1);
            makeBox(2.5, 2.5, 0.2, 0x88ccff, ox + 34, 8, hz2 - 8.1);
            makeBox(2, 5, 2, 0x8b6040, ox + 28, 17.5, hz2 - 5);
        }

        // War memorial — central column with stone base
        makeBox(10, 1.5, 10, 0xc8c0b0, ox, 0.75, oz + 80);
        makeBox(8, 1.5, 8, 0xbbb0a0, ox, 2.25, oz + 80);
        makeBox(6, 1.5, 6, 0xaaa090, ox, 3.75, oz + 80);
        makeCylinder(1.2, 1.5, 12, 8, 0x999080, ox, 10.5, oz + 80);
        makeCone(1.5, 3, 8, 0x888070, ox, 17.5, oz + 80);
        // Memorial cross top
        makeBox(4, 0.5, 0.5, 0x888070, ox, 18.5, oz + 80);
        makeBox(0.5, 3, 0.5, 0x888070, ox, 18, oz + 80);

        // Street lamps
        var lampPositions = [-80, -50, -20, 10, 40, 70];
        for (var li = 0; li < lampPositions.length; li++) {
            var lz = oz + lampPositions[li];
            // West side lamp
            makeCylinder(0.2, 0.2, 5, 6, 0x333333, ox - 40, 3, lz);
            makeBox(0.2, 0.2, 3, 0x333333, ox - 38.5, 5.5, lz);
            makeSphere(0.5, 5, 5, 0xffffaa, ox - 37, 5.5, lz);
            // East side lamp
            makeCylinder(0.2, 0.2, 5, 6, 0x333333, ox + 40, 3, lz);
            makeBox(0.2, 0.2, 3, 0x333333, ox + 38.5, 5.5, lz);
            makeSphere(0.5, 5, 5, 0xffffaa, ox + 37, 5.5, lz);
        }

        // Additional shops/businesses on high street
        // Cafe
        makeBox(12, 8, 12, 0xddc090, ox - 30, 5, oz + 10);
        makeBox(12, 1.5, 12, 0xcc9933, ox - 30, 9.25, oz + 10);
        makeBox(10, 3, 0.2, 0x88ccff, ox - 30, 5.5, oz + 4.1);
        // Post office
        makeBox(12, 8, 12, 0xcc2222, ox + 30, 5, oz - 70);
        makeBox(12, 1.5, 12, 0xaa1111, ox + 30, 9.25, oz - 70);
        // Post box
        makeCylinder(0.8, 0.8, 2.5, 8, 0xcc0000, ox + 35, 1.5, oz - 78);
        makeCylinder(0.9, 0.9, 0.5, 8, 0xaa0000, ox + 35, 2.75, oz - 78);
    }

    function build() {
        var xOffset = 11120;

        // Ground plane around the whole complex
        makeBox(1200, 1, 1200, 0x4a6b28, xOffset, -0.5, 0);

        // 1. Centre Court — at x+11120, z=0
        buildCentreCourt(xOffset, 0);

        // 2. No. 1 Court — adjacent, south-east of Centre Court
        buildNoOneCourt(xOffset + 220, 200);

        // 3. Outer courts — row of 6 grass courts
        for (var ci = 0; ci < 6; ci++) {
            buildOuterCourt(xOffset - 180 + ci * 55, 350, ci);
        }

        // 4. Wimbledon Common — north-west
        buildWimbledonCommon(xOffset - 400, -350);

        // 5. Wimbledon Village — south approach road
        buildWimbledonVillage(xOffset + 100, 600);
    }

    function update(delta) {
        // No animated elements
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
