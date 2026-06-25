window.GloucesterCathedral = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21480;
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildCathedralNave();
        buildCentralTower();
        buildWestTowers();
        buildTransepts();
        buildChoir();
        buildGreatEastWindow();
        buildCloisters();
        buildChapterHouse();
        buildBishopsPalace();
        buildCathedralClose();
        buildGloucesterDocks();
        buildGloucesterCross();
        buildRomanWalls();
        buildRiverSevern();
        buildCityStreets();
        buildCityBuildings();
    }

    function buildGround() {
        // Cathedral precinct ground
        makebox(400, 1, 400, 0x8B8B6E, 0, -0.5, 0);
        // Cathedral close paved area
        makebox(180, 0.5, 160, 0xC8C0A0, 0, 0.3, 0);
        // Grassed garth within cloisters
        makebox(38, 0.5, 38, 0x4A7C4E, 0, 0.4, 38);
    }

    function buildCathedralNave() {
        // Main nave body — long and wide Norman/Gothic structure
        makebox(34, 26, 100, 0xD4C8A0, 0, 13, 0);
        // Nave clerestory upper section
        makebox(30, 10, 96, 0xD4C8A0, 0, 31, 0);
        // Nave roof pitched
        makebox(36, 8, 104, 0x9A9070, 0, 40, 0);
        // Nave north aisle
        makebox(10, 18, 100, 0xCFC3A0, -22, 9, 0);
        // Nave south aisle
        makebox(10, 18, 100, 0xCFC3A0, 22, 9, 0);
        // Nave north aisle roof
        makebox(12, 4, 104, 0x9A9070, -22, 21, 0);
        // Nave south aisle roof
        makebox(12, 4, 104, 0x9A9070, 22, 21, 0);
        // West front facade
        makebox(58, 36, 5, 0xD0C49A, 0, 18, -52);
        // West doorway arch surround
        makebox(8, 14, 3, 0xB8AC88, 0, 7, -55);
        // West window tracery
        makebox(16, 12, 2, 0xE0D8B8, 0, 26, -55);
        // Nave buttresses north side
        makebox(4, 28, 6, 0xC8BC9C, -18, 14, -30);
        makebox(4, 28, 6, 0xC8BC9C, -18, 14, 0);
        makebox(4, 28, 6, 0xC8BC9C, -18, 14, 30);
        // Nave buttresses south side
        makebox(4, 28, 6, 0xC8BC9C, 18, 14, -30);
        makebox(4, 28, 6, 0xC8BC9C, 18, 14, 0);
        makebox(4, 28, 6, 0xC8BC9C, 18, 14, 30);
    }

    function buildCentralTower() {
        // Central tower — 69m tall, placed over crossing
        makebox(22, 69, 22, 0xD4C8A0, 0, 34.5, 62);
        // Tower upper stage with openings
        makebox(20, 18, 20, 0xDDD0A8, 0, 78, 62);
        // Tower parapet
        makebox(24, 3, 24, 0xC8BC9C, 0, 98, 62);
        // Tower corner pinnacles x4
        makecyl(1.2, 1.5, 14, 8, 0xD4C8A0, -10, 96, 52);
        makecone(1.5, 5, 8, 0xB8AC88, -10, 106, 52);
        makecyl(1.2, 1.5, 14, 8, 0xD4C8A0, 10, 96, 52);
        makecone(1.5, 5, 8, 0xB8AC88, 10, 106, 52);
        makecyl(1.2, 1.5, 14, 8, 0xD4C8A0, -10, 96, 72);
        makecone(1.5, 5, 8, 0xB8AC88, -10, 106, 72);
        makecyl(1.2, 1.5, 14, 8, 0xD4C8A0, 10, 96, 72);
        makecone(1.5, 5, 8, 0xB8AC88, 10, 106, 72);
        // Tower belfry louvres as thin boxes
        makebox(18, 3, 1, 0xAA9E7E, 0, 72, 51);
        makebox(18, 3, 1, 0xAA9E7E, 0, 72, 73);
        makebox(1, 3, 18, 0xAA9E7E, -11, 72, 62);
        makebox(1, 3, 18, 0xAA9E7E, 11, 72, 62);
    }

    function buildWestTowers() {
        // North west tower
        makebox(14, 42, 14, 0xD4C8A0, -20, 21, -52);
        makecyl(1, 1.2, 10, 8, 0xD4C8A0, -26, 41, -58);
        makecone(1.5, 6, 8, 0xB8AC88, -26, 50, -58);
        makecyl(1, 1.2, 10, 8, 0xD4C8A0, -14, 41, -58);
        makecone(1.5, 6, 8, 0xB8AC88, -14, 50, -58);
        // South west tower
        makebox(14, 42, 14, 0xD4C8A0, 20, 21, -52);
        makecyl(1, 1.2, 10, 8, 0xD4C8A0, 26, 41, -58);
        makecone(1.5, 6, 8, 0xB8AC88, 26, 50, -58);
        makecyl(1, 1.2, 10, 8, 0xD4C8A0, 14, 41, -58);
        makecone(1.5, 6, 8, 0xB8AC88, 14, 50, -58);
    }

    function buildTransepts() {
        // North transept
        makebox(40, 30, 28, 0xD4C8A0, -37, 15, 62);
        makebox(38, 10, 26, 0xD4C8A0, -37, 35, 62);
        makebox(42, 5, 30, 0x9A9070, -37, 42, 62);
        // North transept gable
        makebox(42, 10, 4, 0xD4C8A0, -37, 37, 48);
        // South transept
        makebox(40, 30, 28, 0xD4C8A0, 37, 15, 62);
        makebox(38, 10, 26, 0xD4C8A0, 37, 35, 62);
        makebox(42, 5, 30, 0x9A9070, 37, 42, 62);
        // South transept gable
        makebox(42, 10, 4, 0xD4C8A0, 37, 37, 48);
    }

    function buildChoir() {
        // Choir and presbytery east of crossing
        makebox(30, 26, 50, 0xD4C8A0, 0, 13, 95);
        makebox(28, 10, 48, 0xD4C8A0, 0, 31, 95);
        makebox(32, 5, 52, 0x9A9070, 0, 39, 95);
        // Lady chapel at east end
        makebox(20, 20, 20, 0xDDD0B8, 0, 10, 130);
        makebox(22, 4, 22, 0x9A9070, 0, 22, 130);
        // Choir aisles
        makebox(8, 18, 50, 0xCFC3A0, -19, 9, 95);
        makebox(8, 18, 50, 0xCFC3A0, 19, 9, 95);
    }

    function buildGreatEastWindow() {
        // Great East Window — largest medieval stained glass in England
        // Main glass panel
        makebox(22, 24, 1, 0x88BBFF, 0, 20, 120);
        // Window tracery subdivisions — thin stone mullions
        makebox(1, 24, 1, 0xD4C8A0, -7, 20, 121);
        makebox(1, 24, 1, 0xD4C8A0, 0, 20, 121);
        makebox(1, 24, 1, 0xD4C8A0, 7, 20, 121);
        makebox(22, 1, 1, 0xD4C8A0, 0, 14, 121);
        makebox(22, 1, 1, 0xD4C8A0, 0, 22, 121);
        makebox(22, 1, 1, 0xD4C8A0, 0, 30, 121);
        // Window arch head
        makebox(22, 4, 2, 0xD4C8A0, 0, 33, 120);
    }

    function buildCloisters() {
        // Perpendicular Gothic cloisters on south side of nave
        // Four walls of cloister arcade
        // North walk (against nave south wall)
        makebox(46, 12, 5, 0xE8DFC0, 0, 6, 28);
        // South walk
        makebox(46, 12, 5, 0xE8DFC0, 0, 6, 50);
        // East walk
        makebox(5, 12, 24, 0xE8DFC0, 23, 6, 39);
        // West walk
        makebox(5, 12, 24, 0xE8DFC0, -23, 6, 39);
        // Cloister roofs
        makebox(48, 3, 7, 0x9A9070, 0, 13, 28);
        makebox(48, 3, 7, 0x9A9070, 0, 13, 50);
        makebox(7, 3, 26, 0x9A9070, 23, 13, 39);
        makebox(7, 3, 26, 0x9A9070, -23, 13, 39);
        // Fan vault rib simulations — horizontal box ribs
        makebox(3, 0.5, 5, 0xF0E8C8, -18, 12, 28);
        makebox(3, 0.5, 5, 0xF0E8C8, -10, 12, 28);
        makebox(3, 0.5, 5, 0xF0E8C8, -2, 12, 28);
        makebox(3, 0.5, 5, 0xF0E8C8, 6, 12, 28);
        makebox(3, 0.5, 5, 0xF0E8C8, 14, 12, 28);
        // Cloister garden (garth) — already added in ground
        // Cloister lavatorium (washing place)
        makebox(8, 3, 8, 0xD4C8A0, 0, 1.5, 39);
        makecyl(3, 3, 2, 12, 0x888877, 0, 2, 39);
    }

    function buildChapterHouse() {
        // Octagonal chapter house east of cloisters
        makecyl(14, 14, 18, 8, 0xD4C8A0, 30, 9, 35);
        makecone(14, 6, 8, 0x9A9070, 30, 21, 35);
        // Chapter house vestibule
        makebox(8, 10, 12, 0xD4C8A0, 20, 5, 35);
    }

    function buildBishopsPalace() {
        // Bishop's Palace — multi-range medieval building
        makebox(30, 14, 20, 0xD4C8A0, -50, 7, 20);
        makebox(32, 4, 22, 0x9A9070, -50, 15, 20);
        makebox(14, 12, 30, 0xD4C8A0, -62, 6, 10);
        makebox(14, 3, 30, 0x9A9070, -62, 13, 10);
        // Palace gateway
        makebox(6, 10, 3, 0xC8BC9C, -50, 5, 9);
        makebox(6, 2, 3, 0xC8BC9C, -50, 11, 9);
    }

    function buildCathedralClose() {
        // Deanery building
        makebox(20, 10, 14, 0xD4C8A0, 42, 5, 20);
        makebox(22, 3, 16, 0x9A9070, 42, 11.5, 20);
        // Infirmary ruins
        makebox(18, 6, 10, 0xC0B890, 42, 3, -10);
        // Misericord building
        makebox(14, 8, 12, 0xCDC0A0, -42, 4, -20);
        // Gatehouse — main cathedral gate
        makebox(10, 16, 8, 0xD4C8A0, 0, 8, -80);
        makebox(10, 2, 8, 0x9A9070, 0, 17, -80);
        // Gate archway opening
        makebox(4, 8, 9, 0x222222, 0, 4, -80);
    }

    function buildGloucesterDocks() {
        // Gloucester Docks — Victorian inland port, canal basin
        // Main canal basin water
        makebox(80, 1, 60, 0x4682B4, -160, 0, -80);
        // Dock walls
        makebox(82, 4, 3, 0x8B6914, -160, 2, -112);
        makebox(82, 4, 3, 0x8B6914, -160, 2, -50);
        makebox(3, 4, 62, 0x8B6914, -121, 2, -81);
        makebox(3, 4, 62, 0x8B6914, -201, 2, -81);
        // Victorian red brick warehouses — North warehouse row
        makebox(22, 18, 14, 0x8B2500, -130, 9, -120);
        makebox(22, 18, 14, 0x8B2500, -156, 9, -120);
        makebox(22, 18, 14, 0x8B2500, -182, 9, -120);
        // Warehouse roofs
        makebox(24, 4, 16, 0x5A1A00, -130, 20, -120);
        makebox(24, 4, 16, 0x5A1A00, -156, 20, -120);
        makebox(24, 4, 16, 0x5A1A00, -182, 20, -120);
        // South warehouse row
        makebox(22, 18, 14, 0x8B2500, -130, 9, -42);
        makebox(22, 16, 14, 0x8B2500, -156, 8, -42);
        makebox(24, 4, 16, 0x5A1A00, -130, 20, -42);
        makebox(24, 3, 16, 0x5A1A00, -156, 17.5, -42);
        // Crane — iron frame
        makebox(3, 20, 3, 0x444444, -120, 10, -112);
        makebox(16, 2, 2, 0x444444, -112, 21, -112);
        // Barges in basin
        makebox(14, 2, 5, 0x5A3A1A, -148, 1, -81);
        makebox(14, 2, 5, 0x5A3A1A, -168, 1, -75);
        makebox(12, 2, 4, 0x6A4A2A, -155, 1, -90);
        // Lock gate
        makebox(40, 3, 3, 0x6A5020, -160, 1.5, -113);
        // Customs house
        makebox(16, 12, 12, 0x8B2500, -210, 6, -70);
        makebox(18, 3, 14, 0x5A1A00, -210, 13.5, -70);
        // Pillar / column at dock entrance
        makecyl(1.5, 1.5, 12, 8, 0x888877, -119, 6, -81);
        makecyl(1.5, 1.5, 12, 8, 0x888877, -201, 6, -81);
    }

    function buildGloucesterCross() {
        // Gloucester Cross — medieval city monument / gate in center
        // Base plinth
        makebox(8, 1.5, 8, 0xCCCCCC, 60, 0.75, -150);
        // Shaft
        makecyl(1.2, 1.8, 12, 8, 0xCCCCCC, 60, 7.5, -150);
        // Cross head
        makebox(6, 1.5, 1.5, 0xBBBBBB, 60, 14, -150);
        makebox(1.5, 4, 1.5, 0xBBBBBB, 60, 14.5, -150);
        // Steps
        makebox(10, 0.5, 10, 0xBBBBBB, 60, 0.5, -150);
        makebox(12, 0.3, 12, 0xBBBBBB, 60, 0.3, -150);
        // Surrounding gate arch remnants
        makebox(4, 14, 3, 0xCCCCCC, 54, 7, -150);
        makebox(4, 14, 3, 0xCCCCCC, 66, 7, -150);
        makebox(16, 3, 3, 0xCCCCCC, 60, 15, -150);
    }

    function buildRomanWalls() {
        // Roman wall remnants — northeast and east sides of Roman city
        // North wall section
        makebox(60, 5, 3, 0xBBB8A0, 40, 2.5, -200);
        makebox(3, 5, 3, 0xBBB8A0, 72, 2.5, -200);
        makebox(3, 8, 3, 0xBBB8A0, 70, 4, -200);
        // East wall section
        makebox(3, 5, 80, 0xBBB8A0, 100, 2.5, -150);
        // Bastion (semi-circular tower) on north wall
        makecyl(5, 5, 6, 12, 0xBBB8A0, 40, 3, -200);
        makecyl(5, 5, 6, 12, 0xBBB8A0, 70, 3, -200);
        // East gate remnant
        makebox(8, 10, 3, 0xBBB8A0, 100, 5, -120);
        makebox(4, 3, 3, 0xBBB8A0, 100, 11.5, -120);
    }

    function buildRiverSevern() {
        // River Severn — wide tidal river to the west
        makebox(120, 1, 400, 0x4682B4, -260, 0, -50);
        // River banks
        makebox(10, 2, 400, 0x8B7355, -200, 1, -50);
        makebox(10, 2, 400, 0x8B7355, -320, 1, -50);
        // Ham (flood plain) between docks and river
        makebox(50, 0.5, 120, 0x6B8C5A, -230, 0.3, -50);
    }

    function buildCityStreets() {
        // Medieval street grid — Northgate, Southgate, Eastgate, Westgate
        // Northgate Street (N-S axis, north)
        makebox(8, 0.5, 120, 0x555555, 60, 0.3, -170);
        // Southgate Street (N-S axis, south)
        makebox(8, 0.5, 120, 0x555555, 60, 0.3, -270);
        // Westgate Street (E-W, west)
        makebox(120, 0.5, 8, 0x555555, 0, 0.3, -150);
        // Eastgate Street (E-W, east)
        makebox(80, 0.5, 8, 0x555555, 120, 0.3, -150);
        // College Street / Westgate area
        makebox(60, 0.5, 6, 0x555555, 30, 0.3, -180);
        // Barbican lane
        makebox(6, 0.5, 50, 0x555555, 90, 0.3, -175);
    }

    function buildCityBuildings() {
        // Medieval city buildings along streets — generic rows
        // Buildings along Westgate Street north side
        makebox(12, 8, 10, 0xBB9977, -20, 4, -140);
        makebox(12, 10, 10, 0xAA8866, -36, 5, -140);
        makebox(12, 9, 10, 0xCC9966, -52, 4.5, -140);
        // South side Westgate
        makebox(12, 8, 10, 0xBBA080, -20, 4, -162);
        makebox(12, 9, 10, 0xAA9070, -36, 4.5, -162);
        // Northgate Street buildings
        makebox(10, 9, 12, 0xBB9977, 50, 4.5, -160);
        makebox(10, 8, 12, 0xCC9966, 72, 4, -160);
        // Eastgate buildings
        makebox(10, 9, 10, 0xBBA080, 80, 4.5, -142);
        makebox(10, 8, 10, 0xAA9070, 96, 4, -142);
        makebox(10, 9, 10, 0xBB9977, 112, 4.5, -142);
        // Southgate area
        makebox(10, 8, 10, 0xCC9966, 50, 4, -240);
        makebox(10, 9, 10, 0xBBA080, 72, 4.5, -240);
        // Inn of Court building near cathedral
        makebox(16, 12, 18, 0xD4C8A0, -30, 6, -70);
        makebox(18, 3, 20, 0x9A9070, -30, 13.5, -70);
        // Church of St Mary de Crypt
        makebox(12, 14, 22, 0xD0C49A, 80, 7, -155);
        makebox(6, 20, 6, 0xD0C49A, 80, 10, -165);
        makecone(3, 8, 8, 0x9A9070, 80, 23, -165);
        // New Inn — medieval galleried inn
        makebox(20, 12, 16, 0xAA8855, 40, 6, -200);
        makebox(22, 3, 18, 0x8B6914, 40, 13.5, -200);
        // Blackfriars priory remnants
        makebox(24, 12, 16, 0xD0C8A0, -80, 6, -140);
        makebox(10, 16, 10, 0xD0C8A0, -88, 8, -130);
        makecone(4, 8, 4, 0x9A9070, -88, 20, -130);
        // Greyfriars church
        makebox(20, 12, 30, 0xD0C8A0, 30, 6, -230);
        makebox(6, 18, 6, 0xD0C8A0, 38, 9, -225);
        makecone(3, 7, 4, 0x9A9070, 38, 21.5, -225);
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
