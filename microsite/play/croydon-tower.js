window.CroydonTower = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 11080;

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

    function makeCyl(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
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

    function makeCone(r, h, seg, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry();
        var verts = [];
        for (var i = 0; i < points.length; i++) {
            verts.push(points[i][0], points[i][1], points[i][2]);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var ls = new THREE.LineSegments(geo, mat);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function buildTowerCluster() {
        var bx = BASE_X;

        // Leon House — narrow tall slab, dark glass
        makeBox(8, 35, 8, 0x4a6070, bx + 0, 17.5, -20);
        // horizontal banding on Leon House
        makeBox(8.2, 0.4, 8.2, 0x2a3a45, bx + 0, 5, -20);
        makeBox(8.2, 0.4, 8.2, 0x2a3a45, bx + 0, 10, -20);
        makeBox(8.2, 0.4, 8.2, 0x2a3a45, bx + 0, 15, -20);
        makeBox(8.2, 0.4, 8.2, 0x2a3a45, bx + 0, 20, -20);
        makeBox(8.2, 0.4, 8.2, 0x2a3a45, bx + 0, 25, -20);
        makeBox(8.2, 0.4, 8.2, 0x2a3a45, bx + 0, 30, -20);
        // rooftop plant room
        makeBox(4, 2, 4, 0x3a4a55, bx + 0, 36.5, -20);

        // NLA Tower (No.1 Croydon) — squat chamfered top tower, blue-grey
        makeBox(10, 28, 10, 0x5a7080, bx + 15, 14, -15);
        // chamfered appearance — setback top section
        makeBox(7, 6, 7, 0x5a7080, bx + 15, 31, -15);
        makeBox(4, 3, 4, 0x6a8090, bx + 15, 35.5, -15);
        // antenna
        makeCyl(0.1, 0.1, 5, 4, 0xaaaaaa, bx + 15, 39.5, -15);

        // Lunar House — immigration building, white concrete brutalist slab
        makeBox(14, 22, 6, 0xd0cfc8, bx - 14, 11, -10);
        makeBox(14.2, 0.5, 6.2, 0xb0afa8, bx - 14, 5, -10);
        makeBox(14.2, 0.5, 6.2, 0xb0afa8, bx - 14, 11, -10);
        makeBox(14.2, 0.5, 6.2, 0xb0afa8, bx - 14, 17, -10);
        makeBox(14.2, 0.5, 6.2, 0xb0afa8, bx - 14, 22, -10);
        // Lunar House base podium
        makeBox(16, 3, 10, 0xc8c7c0, bx - 14, 1.5, -10);

        // Tower 4 — mid-height glass office block
        makeBox(9, 20, 7, 0x607890, bx + 28, 10, -25);
        makeBox(9.2, 0.4, 7.2, 0x405870, bx + 28, 5, -25);
        makeBox(9.2, 0.4, 7.2, 0x405870, bx + 28, 10, -25);
        makeBox(9.2, 0.4, 7.2, 0x405870, bx + 28, 15, -25);
        makeBox(9.2, 0.4, 7.2, 0x405870, bx + 28, 20, -25);

        // Tower 5 — slender residential/hotel tower
        makeBox(6, 30, 6, 0x8090a0, bx - 28, 15, -18);
        makeBox(6.2, 0.4, 6.2, 0x607080, bx - 28, 7, -18);
        makeBox(6.2, 0.4, 6.2, 0x607080, bx - 28, 14, -18);
        makeBox(6.2, 0.4, 6.2, 0x607080, bx - 28, 21, -18);
        makeBox(6.2, 0.4, 6.2, 0x607080, bx - 28, 28, -18);
        makeCyl(0.15, 0.15, 4, 4, 0xcccccc, bx - 28, 32, -18);

        // Tower 6 — mixed use shorter block
        makeBox(12, 15, 9, 0x708898, bx + 12, 7.5, -40);
        makeBox(8, 4, 7, 0x607888, bx + 12, 17, -40);
        // ground floor retail podium
        makeBox(14, 3, 11, 0x888888, bx + 12, 1.5, -40);

        // Ground floor plaza / pavement
        makeBox(90, 0.4, 60, 0x707070, bx, 0, -20);
    }

    function buildFairfieldHalls() {
        var bx = BASE_X - 20;
        var bz = 30;

        // Main concert hall — curved modernist block (approximated with box + dome)
        makeBox(20, 8, 14, 0xc0b090, bx, 4, bz);
        // Dome over concert hall
        makeSphere(7, 12, 8, 0xb0a080, bx, 11, bz);

        // Ashcroft Theatre wing — lower rectangular block
        makeBox(14, 6, 10, 0xb8a888, bx + 18, 3, bz + 2);
        // Theatre roof — flat with slight pitch suggestion
        makeBox(15, 1, 11, 0xa09878, bx + 18, 6.5, bz + 2);

        // Front colonnade / entrance canopy
        makeBox(22, 1, 3, 0xd0c0a0, bx + 2, 5, bz - 8);
        makeCyl(0.4, 0.4, 5, 6, 0xc0b090, bx - 8, 2.5, bz - 8);
        makeCyl(0.4, 0.4, 5, 6, 0xc0b090, bx - 2, 2.5, bz - 8);
        makeCyl(0.4, 0.4, 5, 6, 0xc0b090, bx + 4, 2.5, bz - 8);
        makeCyl(0.4, 0.4, 5, 6, 0xc0b090, bx + 10, 2.5, bz - 8);

        // Amphitheatre steps / open air area
        makeBox(16, 0.5, 10, 0x909080, bx - 2, 0.25, bz + 16);
        makeBox(14, 0.5, 8, 0x989888, bx - 2, 0.75, bz + 17);
        makeBox(12, 0.5, 6, 0xa0a090, bx - 2, 1.25, bz + 18);

        // Fairfield Plaza pavement
        makeBox(50, 0.3, 30, 0x808070, bx + 5, 0, bz);
    }

    function buildEastCroydonStation() {
        var bx = BASE_X + 40;
        var bz = -5;

        // Main station building
        makeBox(22, 10, 12, 0x909090, bx, 5, bz);
        // Upper floor / bridge link
        makeBox(22, 4, 6, 0xa0a0a0, bx, 12, bz);

        // Long platform canopy — glass steel roof (approximated)
        makeBox(40, 1, 10, 0x80b0c0, bx + 5, 8, bz - 14);
        makeBox(40, 1, 10, 0x80b0c0, bx + 5, 8, bz - 26);

        // Platform 1 surface
        makeBox(38, 0.4, 4, 0xb0b0b0, bx + 5, 0.2, bz - 14);
        // Platform 2 surface
        makeBox(38, 0.4, 4, 0xb0b0b0, bx + 5, 0.2, bz - 26);

        // Canopy support columns
        makeCyl(0.3, 0.3, 8, 6, 0x808080, bx - 12, 4, bz - 14);
        makeCyl(0.3, 0.3, 8, 6, 0x808080, bx, 4, bz - 14);
        makeCyl(0.3, 0.3, 8, 6, 0x808080, bx + 12, 4, bz - 14);
        makeCyl(0.3, 0.3, 8, 6, 0x808080, bx + 22, 4, bz - 14);
        makeCyl(0.3, 0.3, 8, 6, 0x808080, bx - 12, 4, bz - 26);
        makeCyl(0.3, 0.3, 8, 6, 0x808080, bx, 4, bz - 26);
        makeCyl(0.3, 0.3, 8, 6, 0x808080, bx + 12, 4, bz - 26);
        makeCyl(0.3, 0.3, 8, 6, 0x808080, bx + 22, 4, bz - 26);

        // Network Rail train 1 — orange/blue livery
        makeBox(18, 2.5, 2.8, 0x0033aa, bx + 4, 1.65, bz - 14);
        makeBox(18, 0.4, 2.8, 0xf0a000, bx + 4, 3.1, bz - 14);
        makeBox(2, 2.5, 2.8, 0x002288, bx - 6, 1.65, bz - 14);
        // Train windows
        makeBox(14, 0.8, 0.1, 0x88aad0, bx + 5, 2.2, bz - 12.6);
        // Train wheels suggestion
        makeCyl(0.3, 0.3, 2.9, 6, 0x333333, bx - 4, 0.5, bz - 14);
        makeCyl(0.3, 0.3, 2.9, 6, 0x333333, bx + 4, 0.5, bz - 14);
        makeCyl(0.3, 0.3, 2.9, 6, 0x333333, bx + 12, 0.5, bz - 14);

        // Thameslink train 2 — white/pink livery
        makeBox(16, 2.5, 2.8, 0xf0f0ee, bx + 4, 1.65, bz - 26);
        makeBox(16, 0.4, 2.8, 0xcc2255, bx + 4, 3.1, bz - 26);

        // Station entrance canopy
        makeBox(10, 1, 6, 0x70a0b8, bx, 10.5, bz + 4);

        // Taxi rank area
        makeBox(20, 0.3, 8, 0x606060, bx, 0.15, bz + 10);
    }

    function buildTramlink() {
        var bx = BASE_X;
        var bz = 10;

        // Tram track bed
        makeBox(80, 0.3, 3, 0x555550, bx, 0.15, bz);

        // Track rails via LineSegments
        makeLines([
            [bx - 40, 0.4, bz - 0.8], [bx + 40, 0.4, bz - 0.8],
            [bx + 40, 0.4, bz - 0.8], [bx - 40, 0.4, bz - 0.8]
        ], 0x888880);
        makeLines([
            [bx - 40, 0.4, bz + 0.8], [bx + 40, 0.4, bz + 0.8],
            [bx + 40, 0.4, bz + 0.8], [bx - 40, 0.4, bz + 0.8]
        ], 0x888880);

        // Overhead wire poles
        makeCyl(0.12, 0.12, 7, 5, 0x999990, bx - 30, 3.5, bz - 2);
        makeCyl(0.12, 0.12, 7, 5, 0x999990, bx - 10, 3.5, bz - 2);
        makeCyl(0.12, 0.12, 7, 5, 0x999990, bx + 10, 3.5, bz - 2);
        makeCyl(0.12, 0.12, 7, 5, 0x999990, bx + 30, 3.5, bz - 2);

        // Overhead wires
        makeLines([
            [bx - 40, 7, bz], [bx - 30, 7, bz],
            [bx - 30, 7, bz], [bx - 10, 7, bz],
            [bx - 10, 7, bz], [bx + 10, 7, bz],
            [bx + 10, 7, bz], [bx + 30, 7, bz],
            [bx + 30, 7, bz], [bx + 40, 7, bz]
        ], 0xcccc88);

        // Tram car body — Bombardier Flexity Swift style
        makeBox(14, 2.8, 2.6, 0x009966, bx - 5, 1.9, bz);
        // White roof
        makeBox(14, 0.3, 2.6, 0xeeeeee, bx - 5, 3.35, bz);
        // Red/white livery band
        makeBox(14, 0.5, 2.6, 0xdd2222, bx - 5, 2.9, bz);
        // Tram windows
        makeBox(10, 0.9, 0.1, 0x88bbdd, bx - 5, 2.2, bz - 1.3);
        makeBox(10, 0.9, 0.1, 0x88bbdd, bx - 5, 2.2, bz + 1.3);
        // Tram cab nose ends
        makeBox(1.2, 2.8, 2.6, 0x007755, bx - 12.1, 1.9, bz);
        makeBox(1.2, 2.8, 2.6, 0x007755, bx + 2.1, 1.9, bz);
        // Bogies (wheels)
        makeCyl(0.35, 0.35, 2.7, 8, 0x222222, bx - 10, 0.5, bz);
        makeCyl(0.35, 0.35, 2.7, 8, 0x222222, bx - 2, 0.5, bz);
        // Pantograph arm — reaches up to overhead wire
        makeBox(0.1, 3.5, 0.8, 0xaaaaaa, bx - 5, 5.1, bz);
        makeBox(4, 0.15, 0.15, 0xbbbbaa, bx - 5, 6.8, bz);

        // Tram stop platform / shelter
        makeBox(8, 0.3, 2, 0xb0b0a8, bx + 20, 0.15, bz - 3);
        makeBox(8, 3, 0.2, 0x88aabb, bx + 20, 1.5, bz - 4);
        makeBox(8, 0.3, 2, 0x808078, bx + 20, 3.15, bz - 3);
    }

    function buildWhitgiftCentre() {
        var bx = BASE_X - 50;
        var bz = 20;

        // Main mall body — large box
        makeBox(40, 12, 20, 0xd8d0c0, bx, 6, bz);

        // Arched glass roof over central atrium
        makeCyl(10, 10, 40, 8, 0x90c0d8, bx, 18, bz);
        // Flatten the cylinder to act as a barrel vault — scale suggestion via thin box
        makeBox(40, 0.5, 22, 0x80b0cc, bx, 23, bz);

        // Anchor store wing 1 (east end)
        makeBox(16, 10, 22, 0xc8c0b0, bx + 26, 5, bz);
        // Anchor store facade detail
        makeBox(16, 1, 22, 0x404040, bx + 26, 10.5, bz);
        makeBox(12, 8, 0.2, 0x88aac0, bx + 26, 5, bz - 11);

        // Anchor store wing 2 (west end)
        makeBox(14, 10, 22, 0xc8c0b0, bx - 25, 5, bz);
        makeBox(14, 1, 22, 0x404040, bx - 25, 10.5, bz);
        makeBox(10, 8, 0.2, 0x88aac0, bx - 25, 5, bz - 11);

        // High Street pedestrian approach — paved area
        makeBox(50, 0.3, 10, 0xa0a098, bx, 0.15, bz - 16);

        // Street lamp posts along high street
        makeCyl(0.15, 0.15, 5, 5, 0x888880, bx - 18, 2.5, bz - 16);
        makeCyl(0.15, 0.15, 5, 5, 0x888880, bx - 6, 2.5, bz - 16);
        makeCyl(0.15, 0.15, 5, 5, 0x888880, bx + 6, 2.5, bz - 16);
        makeCyl(0.15, 0.15, 5, 5, 0x888880, bx + 18, 2.5, bz - 16);
        // Lamp globes
        makeSphere(0.3, 6, 6, 0xffff99, bx - 18, 5.3, bz - 16);
        makeSphere(0.3, 6, 6, 0xffff99, bx - 6, 5.3, bz - 16);
        makeSphere(0.3, 6, 6, 0xffff99, bx + 6, 5.3, bz - 16);
        makeSphere(0.3, 6, 6, 0xffff99, bx + 18, 5.3, bz - 16);

        // Mall entrance canopy — glass and steel
        makeBox(10, 1, 4, 0x70a8c0, bx, 12.5, bz - 10);
        makeCyl(0.25, 0.25, 12, 6, 0x707068, bx - 4, 6, bz - 10);
        makeCyl(0.25, 0.25, 12, 6, 0x707068, bx + 4, 6, bz - 10);

        // Whitgift Centre clock tower feature
        makeBox(3, 15, 3, 0xc0b8a0, bx - 22, 7.5, bz - 10);
        makeCone(2.5, 3, 4, 0x808070, bx - 22, 16.5, bz - 10);
        // Clock face
        makeCyl(1, 1, 0.2, 8, 0xffffff, bx - 22, 12, bz - 11.5);

        // Ground level floor
        makeBox(80, 0.3, 40, 0x909088, bx, 0, bz);
    }

    function buildGroundPlane() {
        // Main ground plane for the area
        makeBox(200, 0.5, 120, 0x606860, BASE_X, -0.25, 0);
    }

    function buildRoads() {
        var bx = BASE_X;
        // George Street
        makeBox(80, 0.4, 6, 0x404040, bx, 0.2, -2);
        // Station Road / Wellesley Road
        makeBox(6, 0.4, 60, 0x404040, bx + 38, 0.2, -10);
        // High Street
        makeBox(60, 0.4, 6, 0x404040, bx - 35, 0.2, 5);
        // Road markings centre line
        makeLines([
            [bx - 40, 0.45, -2], [bx + 40, 0.45, -2]
        ], 0xffffff);
        makeLines([
            [bx + 38, 0.45, -40], [bx + 38, 0.45, 20]
        ], 0xffffff);
    }

    function build() {
        buildGroundPlane();
        buildRoads();
        buildTowerCluster();
        buildFairfieldHalls();
        buildEastCroydonStation();
        buildTramlink();
        buildWhitgiftCentre();
    }

    function update(delta) {
        // No per-frame animation needed
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
