window.ManchesterSpinningfields = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 21240;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = makeMesh(geo, color);
        mesh.position.set(BASE_X + x, BASE_Y + y + h / 2, BASE_Z + z);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(BASE_X + x, BASE_Y + y + h / 2, BASE_Z + z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(BASE_X + x, BASE_Y + y + r, BASE_Z + z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(BASE_X + x, BASE_Y + y + h / 2, BASE_Z + z);
        return mesh;
    }

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(edges, mat);
        ls.position.set(BASE_X + x, BASE_Y + y + h / 2, BASE_Z + z);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function build() {
        buildGround();
        buildTownHall();
        buildJohnRylands();
        buildSpinningfields();
        buildRiverIrwell();
        buildManchesterCathedral();
        buildBeethamTower();
        buildBridgewaterCanal();
        buildCastlefieldFort();
        buildVictoriaStation();
        buildTheLowry();
        buildStreetGrid();
    }

    // ---------- Ground ----------
    function buildGround() {
        // Ground plane via flat boxes
        makeBox(1200, 2, 1200, 0x556644, 0, -1, 0);
        // Pavement areas — Albert Square
        makeBox(120, 1, 120, 0x999988, -80, 0, 20);
    }

    // ---------- Manchester Town Hall ----------
    // Albert Square, neo-Gothic 1877
    function buildTownHall() {
        var col = 0x7a7a6a;
        var darkCol = 0x5a5a4a;

        // Main body of town hall
        makeBox(80, 28, 60, col, -80, 0, 20);

        // Great Hall wing — rear
        makeBox(80, 20, 30, col, -80, 0, 65);

        // Albert Clock Tower — central tower
        makeBox(16, 60, 16, col, -80, 0, 10);
        makeBox(14, 10, 14, darkCol, -80, 60, 10);
        // Tower spire
        makeCone(7, 25, 4, darkCol, -80, 70, 10);
        // Pinnacles on tower
        makeCone(2, 10, 4, darkCol, -87, 60, 3);
        makeCone(2, 10, 4, darkCol, -73, 60, 3);
        makeCone(2, 10, 4, darkCol, -87, 60, 17);
        makeCone(2, 10, 4, darkCol, -73, 60, 17);

        // Corner turrets on main block
        makeCyl(3, 3, 30, 8, col, -118, 0, -10);
        makeCyl(3, 3, 30, 8, col, -42, 0, -10);
        makeCyl(3, 3, 30, 8, col, -118, 0, 50);
        makeCyl(3, 3, 30, 8, col, -42, 0, 50);

        // Turret spires
        makeCone(4, 14, 4, darkCol, -118, 30, -10);
        makeCone(4, 14, 4, darkCol, -42, 30, -10);
        makeCone(4, 14, 4, darkCol, -118, 30, 50);
        makeCone(4, 14, 4, darkCol, -42, 30, 50);

        // Gothic arched entrance portico
        makeBox(20, 18, 8, darkCol, -80, 0, -10);

        // Row of pointed windows — represented as indented boxes
        makeBox(5, 12, 2, darkCol, -98, 8, -30);
        makeBox(5, 12, 2, darkCol, -88, 8, -30);
        makeBox(5, 12, 2, darkCol, -78, 8, -30);
        makeBox(5, 12, 2, darkCol, -68, 8, -30);
        makeBox(5, 12, 2, darkCol, -58, 8, -30);

        // Clock face detail on tower
        makeBox(10, 10, 1, 0xcccccc, -80, 42, 1);
        makeBox(10, 10, 1, 0xcccccc, -80, 42, 19);

        // Roof ridge line
        makeBox(82, 4, 6, darkCol, -80, 28, 20);
    }

    // ---------- John Rylands Library ----------
    // Deansgate, Gothic Revival 1900
    function buildJohnRylands() {
        var col = 0x7a6a5a;
        var darkCol = 0x5a4a3a;

        // Main library block
        makeBox(50, 30, 40, col, 10, 0, -120);

        // Central tower
        makeBox(14, 55, 14, col, 10, 0, -115);
        makeCone(6, 20, 4, darkCol, 10, 55, -115);

        // Corner towers
        makeCyl(3.5, 3.5, 35, 8, col, -15, 0, -100);
        makeCyl(3.5, 3.5, 35, 8, col, 35, 0, -100);
        makeCyl(3.5, 3.5, 35, 8, col, -15, 0, -140);
        makeCyl(3.5, 3.5, 35, 8, col, 35, 0, -140);

        makeCone(4, 12, 4, darkCol, -15, 35, -100);
        makeCone(4, 12, 4, darkCol, 35, 35, -100);
        makeCone(4, 12, 4, darkCol, -15, 35, -140);
        makeCone(4, 12, 4, darkCol, 35, 35, -140);

        // Gothic window tracery — thin vertical boxes
        makeBox(3, 18, 2, darkCol, -5, 8, -99);
        makeBox(3, 18, 2, darkCol, 5, 8, -99);
        makeBox(3, 18, 2, darkCol, 15, 8, -99);
        makeBox(3, 18, 2, darkCol, 25, 8, -99);

        // Gargoyle protrusions (small boxes projecting from corners)
        makeBox(3, 2, 3, darkCol, -16, 20, -101);
        makeBox(3, 2, 3, darkCol, 36, 20, -101);

        // Entrance arch
        makeBox(14, 20, 6, darkCol, 10, 0, -100);

        // Reading room annex
        makeBox(30, 22, 20, col, 10, 0, -155);
    }

    // ---------- Spinningfields District ----------
    // Modern glass towers, NW1 Deansgate area
    function buildSpinningfields() {
        var glassCol = 0xD3D3D3;
        var glassCol2 = 0xAAAAAA;
        var steelCol = 0x888899;

        // No.1 Deansgate — signature triangular glass tower
        makeBox(22, 100, 22, glassCol, 60, 0, -30);
        makeWireBox(22, 100, 22, 0x9999BB, 60, 0, -30);
        // Top section set back
        makeBox(16, 30, 16, glassCol2, 60, 100, -30);
        makeCone(4, 12, 4, steelCol, 60, 130, -30);

        // Allied London No.3 Hardman Street
        makeBox(30, 70, 25, glassCol, 100, 0, -20);
        makeWireBox(30, 70, 25, 0x9999BB, 100, 0, -20);

        // 1 Spinningfields Square — office block
        makeBox(35, 55, 30, glassCol2, 145, 0, -40);

        // Hardman Square — public plaza, low plinth
        makeBox(60, 2, 60, 0xAAAAAA, 100, 0, -80);

        // XYZ Building — angled modern
        makeBox(28, 65, 25, steelCol, 170, 0, -20);
        makeWireBox(28, 65, 25, 0x6666AA, 170, 0, -20);

        // Leftbank apartment tower
        makeBox(20, 85, 20, glassCol, 55, 0, -90);

        // Street-level retail podium
        makeBox(140, 10, 20, 0xBBBBAA, 110, 0, 10);
    }

    // ---------- River Irwell ----------
    function buildRiverIrwell() {
        var waterCol = 0x006994;

        // Main river channel — flat elongated box
        makeBox(30, 2, 500, waterCol, -200, -1, 0);

        // Trinity Bridge — narrow crossing
        makeBox(36, 4, 10, 0x888880, -200, 2, 20);
        makeCyl(2, 2, 16, 6, 0x888880, -214, 0, 20);
        makeCyl(2, 2, 16, 6, 0x888880, -186, 0, 20);

        // Blackfriars Bridge
        makeBox(36, 4, 10, 0x888870, -200, 2, -80);

        // River bank embankments
        makeBox(10, 4, 500, 0x667755, -210, -1, 0);
        makeBox(10, 4, 500, 0x667755, -190, -1, 0);

        // Salford side — low boxes suggesting buildings
        makeBox(80, 18, 40, 0x888878, -270, 0, -10);
        makeBox(50, 25, 30, 0x998877, -260, 0, 60);
    }

    // ---------- Manchester Cathedral ----------
    // Victoria Street, 15th century
    function buildManchesterCathedral() {
        var col = 0xD4C9B0;
        var darkCol = 0xB4A990;

        // Nave — widest in England
        makeBox(90, 22, 30, col, -10, 0, 140);

        // Central tower
        makeBox(18, 50, 18, col, -10, 0, 130);
        makeBox(16, 8, 16, darkCol, -10, 50, 130);
        // Battlements on tower
        makeBox(18, 4, 4, darkCol, -10, 58, 122);
        makeBox(18, 4, 4, darkCol, -10, 58, 138);
        makeBox(4, 4, 18, darkCol, -18, 58, 130);
        makeBox(4, 4, 18, darkCol, -2, 58, 130);

        // West front with large window
        makeBox(30, 24, 6, col, -10, 0, 126);
        makeBox(16, 18, 2, darkCol, -10, 3, 123);

        // Lady Chapel — east end
        makeBox(20, 16, 20, col, -10, 0, 175);
        makeCone(8, 10, 4, darkCol, -10, 16, 175);

        // North porch
        makeBox(16, 20, 10, col, -50, 0, 140);
        makeCone(5, 12, 4, darkCol, -50, 20, 140);

        // South porch
        makeBox(16, 20, 10, col, 30, 0, 140);
        makeCone(5, 12, 4, darkCol, 30, 20, 140);

        // Choir stalls area — slightly elevated floor
        makeBox(40, 4, 20, 0xC4B9A0, -10, 0, 145);

        // Flying buttress hints
        makeBox(3, 18, 8, darkCol, -54, 0, 130);
        makeBox(3, 18, 8, darkCol, 34, 0, 130);
        makeBox(3, 18, 8, darkCol, -54, 0, 150);
        makeBox(3, 18, 8, darkCol, 34, 0, 150);
    }

    // ---------- Beetham Tower / Hilton Hotel ----------
    // 47 storeys, iconic cantilevered top
    function buildBeethamTower() {
        var col = 0x5588AA;
        var lightCol = 0x88AABB;

        // Main tower shaft
        makeBox(28, 140, 20, col, 220, 0, 30);
        makeWireBox(28, 140, 20, 0x3366AA, 220, 0, 30);

        // Iconic cantilevered top section — extends beyond main tower
        makeBox(40, 20, 20, lightCol, 220, 140, 30);
        makeWireBox(40, 20, 20, 0x4477BB, 220, 140, 30);

        // Roof plant / comms mast
        makeCyl(1, 1, 20, 6, 0xAAAAAA, 220, 160, 30);

        // Hotel podium base
        makeBox(40, 12, 30, 0x667788, 220, 0, 30);

        // Adjacent lower building
        makeBox(25, 35, 22, 0x7799AA, 260, 0, 30);
    }

    // ---------- Bridgewater Canal ----------
    // First true canal, 1761
    function buildBridgewaterCanal() {
        var waterCol = 0x006994;
        var bankCol = 0x5a5040;

        // Canal channel
        makeBox(12, 2, 600, waterCol, -50, -1, 250);

        // Canal banks
        makeBox(6, 3, 600, bankCol, -56, -1, 250);
        makeBox(6, 3, 600, bankCol, -44, -1, 250);

        // Narrowboat 1
        makeBox(4, 4, 20, 0xCC3322, -50, 1, 220);
        makeBox(3, 3, 3, 0x886644, -50, 5, 215);

        // Narrowboat 2
        makeBox(4, 4, 20, 0x224488, -50, 1, 280);
        makeBox(3, 3, 3, 0x886644, -50, 5, 275);

        // Canal-side warehouses (former cotton warehouses)
        makeBox(40, 20, 25, 0x8B7060, -22, 0, 220);
        makeBox(40, 20, 25, 0x8B7060, -22, 0, 270);
        makeBox(40, 20, 25, 0x7A6050, -22, 0, 320);

        // Locks / lock gate hints
        makeBox(16, 5, 4, bankCol, -50, 1, 200);
    }

    // ---------- Castlefield Roman Fort ----------
    // Mamucium, 79 AD
    function buildCastlefieldFort() {
        var col = 0x8B7355;
        var lightCol = 0xAA9977;

        // Fort rampart walls — perimeter
        makeBox(80, 8, 6, col, -140, 0, 240);   // North wall
        makeBox(80, 8, 6, col, -140, 0, 320);   // South wall
        makeBox(6, 8, 80, col, -180, 0, 280);   // West wall
        makeBox(6, 8, 80, col, -100, 0, 280);   // East wall

        // Corner towers
        makeCyl(5, 5, 14, 8, col, -179, 0, 239);
        makeCyl(5, 5, 14, 8, col, -101, 0, 239);
        makeCyl(5, 5, 14, 8, col, -179, 0, 321);
        makeCyl(5, 5, 14, 8, col, -101, 0, 321);

        // Reconstructed arched gateway — north gate
        makeBox(10, 14, 6, lightCol, -130, 0, 240);
        makeBox(10, 14, 6, lightCol, -150, 0, 240);
        makeBox(22, 6, 6, lightCol, -140, 14, 240);
        // Gateway arch top rounded via sphere
        makeSphere(5, 8, 6, lightCol, -140, 18, 240);

        // Internal Principia (headquarters building)
        makeBox(30, 6, 20, col, -140, 0, 280);

        // Granary
        makeBox(20, 5, 14, 0x9A8364, -155, 0, 300);

        // Barrack blocks
        makeBox(50, 5, 10, col, -140, 0, 260);
        makeBox(50, 5, 10, col, -140, 0, 300);

        // Vicus (civilian settlement) — low boxes outside east wall
        makeBox(18, 5, 12, 0x9A8055, -80, 0, 260);
        makeBox(18, 5, 12, 0x9A8055, -80, 0, 285);
    }

    // ---------- Victoria Railway Station ----------
    function buildVictoriaStation() {
        var col = 0xD4C9B0;
        var roofCol = 0x999988;
        var brickCol = 0xAA8866;

        // Station trainshed — large arched roof structure
        makeBox(120, 28, 60, roofCol, -30, 0, 200);

        // Victorian facade
        makeBox(120, 30, 10, brickCol, -30, 0, 172);

        // Clock tower on facade
        makeBox(12, 44, 12, col, -30, 0, 172);
        makeBox(10, 5, 10, 0x888877, -30, 44, 172);
        makeCone(5, 14, 4, 0x888877, -30, 49, 172);

        // Platform canopies — thin wide boxes
        makeBox(110, 6, 8, roofCol, -30, 10, 185);
        makeBox(110, 6, 8, roofCol, -30, 10, 210);
        makeBox(110, 6, 8, roofCol, -30, 10, 235);

        // Entrance portico
        makeBox(30, 20, 8, col, -30, 0, 170);

        // Station hotel wing
        makeBox(40, 35, 30, brickCol, -80, 0, 175);
        makeCyl(4, 4, 40, 8, brickCol, -95, 0, 170);
        makeCone(5, 14, 4, 0x887766, -95, 40, 170);
    }

    // ---------- The Lowry Arts Complex ----------
    // Salford Quays, 2000
    function buildTheLowry() {
        var col = 0xD3D3D3;
        var metalCol = 0xBBBBCC;
        var darkMetal = 0x888899;

        // Main theatre building — irregular modern form
        makeBox(70, 25, 55, col, -300, 0, -100);

        // Lyric Theatre drum — cylindrical
        makeCyl(18, 18, 30, 16, metalCol, -300, 0, -80);
        makeCyl(16, 16, 8, 16, darkMetal, -300, 30, -80);

        // Quays Theatre block — lower
        makeBox(40, 18, 35, metalCol, -330, 0, -120);

        // Entrance canopy / foyer glass box
        makeBox(30, 16, 20, col, -285, 0, -120);
        makeWireBox(30, 16, 20, 0xAAAABB, -285, 0, -120);

        // Metallic roof cladding shapes
        makeBox(70, 6, 55, darkMetal, -300, 25, -100);

        // Lowry footbridge
        makeBox(6, 4, 90, metalCol, -350, 4, -80);
        makeCyl(2, 2, 25, 6, metalCol, -350, 4, -80);

        // MediaCityUK nearby tower
        makeBox(25, 55, 25, 0xAAAAAA, -340, 0, -170);
        makeWireBox(25, 55, 25, 0x9999AA, -340, 0, -170);

        // Waterfront promenade low deck
        makeBox(160, 3, 20, 0x999988, -300, -1, -60);
    }

    // ---------- Street Grid ----------
    function buildStreetGrid() {
        var roadCol = 0x333330;
        var pavementCol = 0x888880;

        // Deansgate — main N-S artery
        makeBox(14, 1, 600, roadCol, 30, 0, 0);
        // St Peter's Square
        makeBox(80, 1, 80, pavementCol, 0, 0, 60);
        // Peter Street
        makeBox(600, 1, 12, roadCol, 0, 0, 0);
        // Quay Street
        makeBox(300, 1, 12, roadCol, -60, 0, -60);
        // King Street
        makeBox(400, 1, 10, roadCol, 0, 0, -140);
        // Victoria Street
        makeBox(300, 1, 10, roadCol, -20, 0, 170);

        // Lamp posts — thin cylinders at intervals
        makeCyl(0.5, 0.5, 10, 6, 0xCCCC88, 30, 0, -100);
        makeCyl(0.5, 0.5, 10, 6, 0xCCCC88, 30, 0, -50);
        makeCyl(0.5, 0.5, 10, 6, 0xCCCC88, 30, 0, 50);
        makeCyl(0.5, 0.5, 10, 6, 0xCCCC88, 30, 0, 100);
        makeCyl(0.5, 0.5, 10, 6, 0xCCCC88, -80, 0, -50);
        makeCyl(0.5, 0.5, 10, 6, 0xCCCC88, -80, 0, 50);
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
