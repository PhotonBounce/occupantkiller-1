window.EnniskillenCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 19360;
    var OY = 0;
    var OZ = 0;

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
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildRiverErne();
        buildLoughErne();
        buildCastle();
        buildWatergate();
        buildBawnWalls();
        buildMuseumBuilding();
        buildMainStreet();
        buildColesMonument();
        buildStMichaelsChurch();
        buildStAnnesChurch();
        buildTownClockTower();
        buildWarMemorial();
        buildButtermarket();
        buildFermanaghCouncil();
        buildPortoraRoyalSchool();
        buildTownBuildings();
        buildBridges();
        buildTrees();
        buildForthill();
    }

    function buildGround() {
        // Island base ground
        makeBox(600, 2, 400, 0x4a7c3f, 0, -1, 0);
        // North bank
        makeBox(700, 2, 120, 0x4a7c3f, 0, -1, -300);
        // South bank
        makeBox(700, 2, 120, 0x4a7c3f, 0, -1, 300);
        // Road surface Main Street
        makeBox(220, 0.5, 18, 0x555555, 20, 0.5, 0);
    }

    function buildRiverErne() {
        // North channel of River Erne (between island and north bank)
        makeBox(680, 1, 80, 0x006994, 0, 0, -210);
        // South channel of River Erne
        makeBox(680, 1, 80, 0x006994, 0, 0, 210);
        // River flow ripple suggestion — darker strip centres
        makeBox(640, 0.6, 20, 0x005577, 0, 0.5, -210);
        makeBox(640, 0.6, 20, 0x005577, 0, 0.5, 210);
    }

    function buildLoughErne() {
        // Upper Lough Erne — west
        makeBox(300, 1, 500, 0x006994, -450, 0, 0);
        // Lower Lough Erne — east
        makeBox(300, 1, 500, 0x006994, 450, 0, 0);
        // Shore detail west
        makeBox(40, 1.5, 500, 0x3a6b30, -305, 0, 0);
        // Shore detail east
        makeBox(40, 1.5, 500, 0x3a6b30, 305, 0, 0);
    }

    function buildCastle() {
        // Great Tower Keep — main tall stone tower
        makeBox(22, 48, 22, 0x8B7355, -140, 24, -40);
        // Keep parapet band
        makeBox(24, 4, 24, 0x7a6448, -140, 49, -40);
        // Keep battlements N
        makeBox(5, 4, 3, 0x8B7355, -140, 53, -51);
        makeBox(5, 4, 3, 0x8B7355, -148, 53, -51);
        makeBox(5, 4, 3, 0x8B7355, -132, 53, -51);
        // Keep battlements S
        makeBox(5, 4, 3, 0x8B7355, -140, 53, -29);
        makeBox(5, 4, 3, 0x8B7355, -148, 53, -29);
        makeBox(5, 4, 3, 0x8B7355, -132, 53, -29);
        // Keep battlements E
        makeBox(3, 4, 5, 0x8B7355, -129, 53, -40);
        makeBox(3, 4, 5, 0x8B7355, -129, 53, -47);
        makeBox(3, 4, 5, 0x8B7355, -129, 53, -33);
        // Keep battlements W
        makeBox(3, 4, 5, 0x8B7355, -151, 53, -40);
        makeBox(3, 4, 5, 0x8B7355, -151, 53, -47);
        makeBox(3, 4, 5, 0x8B7355, -151, 53, -33);
        // Keep window slits
        makeBox(2, 4, 1, 0x222211, -140, 30, -51);
        makeBox(2, 4, 1, 0x222211, -140, 15, -51);
        // Castle great hall / lower range
        makeBox(40, 18, 25, 0x8B7355, -115, 9, -40);
        // Hall roof line
        makeBox(42, 3, 27, 0x7a6448, -115, 19.5, -40);
    }

    function buildWatergate() {
        // Watergate arch body
        makeBox(18, 20, 8, 0x8B7355, -140, 10, -20);
        // Arch opening (dark box inset)
        makeBox(7, 10, 9, 0x222211, -140, 7, -20);
        // Left turret of Watergate
        makeCylinder(4, 4.5, 22, 10, 0x8B7355, -150, 11, -20);
        // Left turret cap
        makeCone(4.5, 8, 10, 0x5a3e28, -150, 23, -20);
        // Right turret of Watergate
        makeCylinder(4, 4.5, 22, 10, 0x8B7355, -130, 11, -20);
        // Right turret cap
        makeCone(4.5, 8, 10, 0x5a3e28, -130, 23, -20);
        // Turret window slit left
        makeBox(1.5, 3, 5, 0x222211, -150, 14, -20);
        // Turret window slit right
        makeBox(1.5, 3, 5, 0x222211, -130, 14, -20);
        // Parapet walkway between turrets
        makeBox(18, 3, 8, 0x7a6448, -140, 21, -20);
    }

    function buildBawnWalls() {
        // North bawn wall
        makeBox(80, 10, 3, 0x8B7355, -120, 5, -60);
        // South bawn wall
        makeBox(80, 10, 3, 0x8B7355, -120, 5, -20);
        // East bawn wall
        makeBox(3, 10, 40, 0x8B7355, -80, 5, -40);
        // West bawn wall
        makeBox(3, 10, 40, 0x8B7355, -160, 5, -40);
        // Corner tower NE
        makeCylinder(3.5, 3.5, 12, 8, 0x8B7355, -80, 6, -60);
        makeCone(3.5, 5, 8, 0x5a3e28, -80, 13, -60);
        // Corner tower NW
        makeCylinder(3.5, 3.5, 12, 8, 0x8B7355, -160, 6, -60);
        makeCone(3.5, 5, 8, 0x5a3e28, -160, 13, -60);
        // Corner tower SE
        makeCylinder(3.5, 3.5, 12, 8, 0x8B7355, -80, 6, -20);
        makeCone(3.5, 5, 8, 0x5a3e28, -80, 13, -20);
    }

    function buildMuseumBuilding() {
        // Museum inside the bawn — converted barracks
        makeBox(30, 12, 16, 0x9e8a6e, -110, 6, -42);
        // Museum roof
        makeBox(32, 3, 18, 0x7a6448, -110, 13.5, -42);
        // Museum door
        makeBox(4, 6, 1, 0x3d2b1f, -110, 3, -34);
        // Museum windows
        makeBox(3, 4, 1, 0x88aacc, -100, 7, -34);
        makeBox(3, 4, 1, 0x88aacc, -120, 7, -34);
    }

    function buildMainStreet() {
        // Georgian terrace block A — north side
        makeBox(60, 14, 14, 0xCD5C5C, 30, 7, -20);
        makeBox(60, 3, 16, 0x8B3A3A, 30, 15.5, -20);
        // Georgian terrace block B — south side
        makeBox(60, 14, 14, 0xF5F0E8, 30, 7, 20);
        makeBox(60, 3, 16, 0xd4cfbe, 30, 15.5, 20);
        // Shop frontages A
        makeBox(10, 8, 2, 0xb04040, -20, 4, -13.5);
        makeBox(10, 8, 2, 0xb04040, -8, 4, -13.5);
        makeBox(10, 8, 2, 0xb04040, 4, 4, -13.5);
        // Shop frontages B opposite
        makeBox(10, 8, 2, 0xe0d8c8, -20, 4, 13.5);
        makeBox(10, 8, 2, 0xe0d8c8, -8, 4, 13.5);
        makeBox(10, 8, 2, 0xe0d8c8, 4, 4, 13.5);
        // Terrace windows north side
        makeBox(3, 4, 1, 0x88aacc, 10, 9, -13);
        makeBox(3, 4, 1, 0x88aacc, 20, 9, -13);
        makeBox(3, 4, 1, 0x88aacc, 30, 9, -13);
        makeBox(3, 4, 1, 0x88aacc, 40, 9, -13);
        makeBox(3, 4, 1, 0x88aacc, 50, 9, -13);
        // Terrace windows south side
        makeBox(3, 4, 1, 0x88aacc, 10, 9, 13);
        makeBox(3, 4, 1, 0x88aacc, 20, 9, 13);
        makeBox(3, 4, 1, 0x88aacc, 30, 9, 13);
        makeBox(3, 4, 1, 0x88aacc, 40, 9, 13);
        makeBox(3, 4, 1, 0x88aacc, 50, 9, 13);
    }

    function buildColesMonument() {
        // Forthill Park base platform
        makeBox(50, 4, 50, 0x4a7c3f, 180, 2, -120);
        // Stepped plinth bottom
        makeBox(14, 5, 14, 0xC0C0C0, 180, 4.5, -120);
        // Stepped plinth mid
        makeBox(10, 4, 10, 0xaaaaaa, 180, 9, -120);
        // Doric column shaft — tall cylinder
        makeCylinder(3, 3.5, 60, 12, 0xC0C0C0, 180, 41, -120);
        // Column capital
        makeCylinder(5, 3, 4, 12, 0xaaaaaa, 180, 73, -120);
        // Statue on top — simplified sphere/box figure
        makeCylinder(1.5, 1.5, 8, 8, 0x888888, 180, 81, -120);
        makeSphere(2.2, 8, 8, 0x888888, 180, 86, -120);
        // Spiral staircase suggestion — thin cylinder inside column
        makeCylinder(0.5, 0.5, 58, 6, 0x888888, 180, 40, -120);
        // Park surrounding trees (simple sphere + cylinder)
        makeCylinder(1, 1, 8, 6, 0x3d2b1f, 165, 4, -135);
        makeSphere(5, 7, 7, 0x2d6b2a, 165, 10, -135);
        makeCylinder(1, 1, 8, 6, 0x3d2b1f, 195, 4, -105);
        makeSphere(5, 7, 7, 0x2d6b2a, 195, 10, -105);
    }

    function buildStMichaelsChurch() {
        // St Michael's — Roman Catholic — nave
        makeBox(28, 18, 14, 0xc8b89a, 80, 9, 60);
        // Nave roof
        makeBox(30, 5, 16, 0x8B7355, 80, 20.5, 60);
        // Main tower base
        makeBox(10, 30, 10, 0xc8b89a, 80, 15, 52);
        // Tower spire
        makeCone(5.5, 20, 8, 0x8B7355, 80, 40, 52);
        // Side aisle
        makeBox(28, 12, 8, 0xb8a88a, 80, 6, 70);
        // Church door
        makeBox(4, 7, 1, 0x3d2b1f, 80, 3.5, 53);
        // Stained window suggestion
        makeBox(3, 6, 1, 0x6688aa, 80, 10, 53);
    }

    function buildStAnnesChurch() {
        // St Anne's — Church of Ireland — nave
        makeBox(24, 15, 12, 0xd4c9b0, -40, 7.5, 70);
        // Nave roof
        makeBox(26, 4, 14, 0x8B7355, -40, 17, 70);
        // Square tower
        makeBox(9, 24, 9, 0xd4c9b0, -40, 12, 63);
        // Tower battlements
        makeBox(11, 3, 11, 0xc4b9a0, -40, 25.5, 63);
        makeBox(3, 3, 3, 0xd4c9b0, -35, 28, 58);
        makeBox(3, 3, 3, 0xd4c9b0, -45, 28, 58);
        makeBox(3, 3, 3, 0xd4c9b0, -35, 28, 68);
        makeBox(3, 3, 3, 0xd4c9b0, -45, 28, 68);
        // Church door
        makeBox(3, 6, 1, 0x3d2b1f, -40, 3, 67.5);
        // Windows
        makeBox(2.5, 5, 1, 0x88aacc, -30, 8, 64.5);
        makeBox(2.5, 5, 1, 0x88aacc, -50, 8, 64.5);
    }

    function buildTownClockTower() {
        // Clock tower base — civic focal point
        makeBox(8, 6, 8, 0xd4c9b0, 0, 3, 0);
        // Tower shaft
        makeBox(6, 22, 6, 0xd4c9b0, 0, 14, 0);
        // Clock face band
        makeBox(7, 5, 7, 0xc4b9a0, 0, 24, 0);
        // Clock face N
        makeCylinder(2.5, 2.5, 0.5, 12, 0xffffff, 0, 24, -3.8);
        // Clock face S
        makeCylinder(2.5, 2.5, 0.5, 12, 0xffffff, 0, 24, 3.8);
        // Spire
        makeCone(3.5, 12, 8, 0x8B7355, 0, 32, 0);
        // Finial ball
        makeSphere(0.8, 6, 6, 0xddaa22, 0, 39, 0);
    }

    function buildWarMemorial() {
        // Cenotaph — white stone column in town center
        makeBox(6, 2, 6, 0xf0ece0, -10, 1, 0);
        makeBox(4, 1.5, 4, 0xf0ece0, -10, 2.75, 0);
        makeBox(2.5, 18, 2.5, 0xf0ece0, -10, 11, 0);
        makeBox(4, 1.5, 4, 0xf0ece0, -10, 20.75, 0);
        // Wreath detail top
        makeCylinder(1.8, 1.8, 0.8, 10, 0x228822, -10, 22, 0);
        // Small plaque faces
        makeBox(2, 3, 0.5, 0xe8e4d8, -10, 8, -1.5);
        makeBox(2, 3, 0.5, 0xe8e4d8, -10, 8, 1.5);
    }

    function buildButtermarket() {
        // Victorian marketplace — red brick
        makeBox(35, 12, 22, 0xCD5C5C, 100, 6, -70);
        // Roof
        makeBox(37, 4, 24, 0x8B3A3A, 100, 14, -70);
        // Arcade arches front — suggestion boxes
        makeBox(5, 7, 2, 0x222211, 86, 4.5, -59);
        makeBox(5, 7, 2, 0x222211, 93, 4.5, -59);
        makeBox(5, 7, 2, 0x222211, 100, 4.5, -59);
        makeBox(5, 7, 2, 0x222211, 107, 4.5, -59);
        makeBox(5, 7, 2, 0x222211, 114, 4.5, -59);
        // Central pediment
        makeBox(14, 3, 4, 0xb04040, 100, 17, -59);
        // Chimney stacks
        makeCylinder(0.8, 0.8, 5, 6, 0x8B3A3A, 88, 18, -70);
        makeCylinder(0.8, 0.8, 5, 6, 0x8B3A3A, 112, 18, -70);
    }

    function buildFermanaghCouncil() {
        // Fermanagh District Council civic building
        makeBox(40, 16, 20, 0xF5F0E8, -60, 8, -90);
        // Portico columns
        makeCylinder(1.2, 1.2, 14, 8, 0xddd9cc, -50, 7, -80);
        makeCylinder(1.2, 1.2, 14, 8, 0xddd9cc, -55, 7, -80);
        makeCylinder(1.2, 1.2, 14, 8, 0xddd9cc, -60, 7, -80);
        makeCylinder(1.2, 1.2, 14, 8, 0xddd9cc, -65, 7, -80);
        makeCylinder(1.2, 1.2, 14, 8, 0xddd9cc, -70, 7, -80);
        // Pediment
        makeBox(42, 4, 5, 0xF5F0E8, -60, 18, -80);
        // Roof
        makeBox(44, 4, 22, 0xd4cfbe, -60, 20, -90);
        // Flag pole
        makeCylinder(0.3, 0.3, 12, 5, 0x888888, -60, 28, -80);
        makeSphere(0.6, 5, 5, 0xddaa22, -60, 35, -80);
        // Council door
        makeBox(5, 8, 1, 0x3d2b1f, -60, 4, -80);
    }

    function buildPortoraRoyalSchool() {
        // Portora Royal School — on Lough Erne shore, east side
        makeBox(60, 18, 24, 0xF5F0E8, 240, 9, -60);
        // Central block raised
        makeBox(20, 22, 26, 0xF5F0E8, 240, 11, -60);
        // Roof main
        makeBox(62, 4, 26, 0xd4cfbe, 240, 20, -60);
        // Central pediment
        makeBox(22, 5, 28, 0xe8e4d8, 240, 24.5, -60);
        // Portico columns
        makeCylinder(1, 1, 18, 8, 0xddd9cc, 232, 9, -47);
        makeCylinder(1, 1, 18, 8, 0xddd9cc, 237, 9, -47);
        makeCylinder(1, 1, 18, 8, 0xddd9cc, 243, 9, -47);
        makeCylinder(1, 1, 18, 8, 0xddd9cc, 248, 9, -47);
        // Wings
        makeBox(16, 14, 20, 0xF5F0E8, 210, 7, -60);
        makeBox(16, 14, 20, 0xF5F0E8, 270, 7, -60);
        // School chapel
        makeBox(14, 16, 12, 0xe0dbd0, 240, 8, -78);
        makeCone(7, 10, 8, 0xd4cfbe, 240, 22, -78);
        // Clock tower on school
        makeBox(6, 28, 6, 0xF5F0E8, 240, 14, -47);
        makeCone(3.5, 10, 8, 0xd4cfbe, 240, 33, -47);
        // School grounds boundary wall
        makeBox(80, 3, 2, 0xd4cfbe, 240, 1.5, -40);
        makeBox(80, 3, 2, 0xd4cfbe, 240, 1.5, -100);
    }

    function buildTownBuildings() {
        // Additional Georgian / Victorian terraces filling the island town
        makeBox(25, 12, 11, 0xCD5C5C, -70, 6, 30);
        makeBox(25, 12, 11, 0xF5F0E8, -45, 6, 30);
        makeBox(25, 12, 11, 0xCD5C5C, -20, 6, 30);
        makeBox(25, 12, 11, 0xF5F0E8, 5, 6, 30);
        // Back street row
        makeBox(20, 10, 10, 0xc8a878, -70, 5, 50);
        makeBox(20, 10, 10, 0xb8987a, -48, 5, 50);
        makeBox(20, 10, 10, 0xc8a878, -26, 5, 50);
        // East end civic
        makeBox(30, 14, 14, 0xd4c9b0, 150, 7, 20);
        makeBox(30, 3, 16, 0xc4b9a0, 150, 15.5, 20);
        // North bank buildings
        makeBox(40, 11, 12, 0xCD5C5C, -20, 5.5, -280);
        makeBox(40, 11, 12, 0xF5F0E8, 30, 5.5, -280);
        makeBox(40, 11, 12, 0xCD5C5C, 80, 5.5, -280);
        // South bank buildings
        makeBox(40, 11, 12, 0xF5F0E8, -20, 5.5, 280);
        makeBox(40, 11, 12, 0xCD5C5C, 30, 5.5, 280);
    }

    function buildBridges() {
        // North bridge over River Erne — stone arch bridge
        makeBox(30, 4, 14, 0xb0a090, 0, 2.5, -170);
        makeCylinder(5, 5, 8, 8, 0xa09080, -10, -2, -170);
        makeCylinder(5, 5, 8, 8, 0xa09080, 10, -2, -170);
        // Bridge parapets N
        makeBox(30, 3, 2, 0xb0a090, 0, 4.5, -163);
        makeBox(30, 3, 2, 0xb0a090, 0, 4.5, -177);
        // South bridge over River Erne
        makeBox(30, 4, 14, 0xb0a090, 0, 2.5, 170);
        makeCylinder(5, 5, 8, 8, 0xa09080, -10, -2, 170);
        makeCylinder(5, 5, 8, 8, 0xa09080, 10, -2, 170);
        // Bridge parapets S
        makeBox(30, 3, 2, 0xb0a090, 0, 4.5, 163);
        makeBox(30, 3, 2, 0xb0a090, 0, 4.5, 177);
    }

    function buildTrees() {
        // Scattered trees around town and park
        makeCylinder(0.8, 1, 6, 6, 0x3d2b1f, -200, 3, 80);
        makeSphere(4, 7, 7, 0x2d6b2a, -200, 8, 80);
        makeCylinder(0.8, 1, 6, 6, 0x3d2b1f, -210, 3, 60);
        makeSphere(4, 7, 7, 0x2d6b2a, -210, 8, 60);
        makeCylinder(0.8, 1, 6, 6, 0x3d2b1f, 120, 3, 30);
        makeSphere(4, 7, 7, 0x2d6b2a, 120, 8, 30);
        makeCylinder(0.8, 1, 6, 6, 0x3d2b1f, 130, 3, -30);
        makeSphere(4, 7, 7, 0x2d6b2a, 130, 8, -30);
        makeCylinder(0.8, 1, 7, 6, 0x3d2b1f, 50, 3.5, -90);
        makeSphere(5, 7, 7, 0x2d6b2a, 50, 9.5, -90);
        makeCylinder(0.8, 1, 7, 6, 0x3d2b1f, 70, 3.5, -90);
        makeSphere(5, 7, 7, 0x2d6b2a, 70, 9.5, -90);
    }

    function buildForthill() {
        // Forthill earthwork mound beneath Cole's Monument
        makeBox(60, 8, 60, 0x4a7c3f, 180, 4, -120);
        // Hill slope suggestion — slightly raised surrounding terrace
        makeBox(80, 4, 80, 0x3d6e34, 180, 2, -120);
        // Iron railings suggestion — thin posts around hill perimeter
        makeBox(1, 5, 60, 0x222222, 140, 2.5, -120);
        makeBox(1, 5, 60, 0x222222, 220, 2.5, -120);
        makeBox(60, 5, 1, 0x222222, 180, 2.5, -90);
        makeBox(60, 5, 1, 0x222222, 180, 2.5, -150);
        // Park bench suggestion
        makeBox(4, 1, 1.5, 0x5a3e28, 155, 7, -100);
        makeBox(4, 1, 1.5, 0x5a3e28, 205, 7, -140);
    }

    function update(delta) { }

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
