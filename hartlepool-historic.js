window.HartlepoolHistoric = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 22200;
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
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildNorthSea();
        buildSandyBeach();
        buildHistoricQuay();
        buildHMSTrincomalee();
        buildMarina();
        buildLighthouse();
        buildHeughBattery();
        buildHeadlandChurch();
        buildPowerStation();
        buildWestDocks();
        buildPeriodDocksBuildings();
        buildRigging();
        buildWaves();
    }

    function buildGround() {
        // Limestone headland ground base
        makeBox(600, 4, 600, 0xF5F0E8, 0, -2, 0);
        // Headland promontory raised limestone shelf
        makeBox(220, 6, 180, 0xD4C5A9, -60, 1, -80);
        // Dock area flat ground
        makeBox(300, 2, 200, 0x555555, 80, -1, 60);
    }

    function buildNorthSea() {
        // Main sea surface — cold grey North Sea
        makeBox(800, 2, 400, 0x006994, 200, -3, -120);
        // Sea to north
        makeBox(500, 2, 200, 0x005577, -100, -3, -200);
        // Darker deep water
        makeBox(400, 2, 300, 0x004466, 350, -3, -50);
        // Harbour mouth water
        makeBox(120, 2, 80, 0x1A7A9E, 30, -2.5, 40);
        // Marina basin water
        makeBox(90, 2, 70, 0x2A6B8A, -20, -2.5, 100);
    }

    function buildSandyBeach() {
        // Seaton Carew beach — long strip south
        makeBox(500, 2, 60, 0xF4E0A0, 150, -2, 200);
        // Beach dunes
        makeBox(80, 5, 20, 0xE8D090, 100, 0, 195);
        makeBox(60, 4, 18, 0xE8D090, 200, 0, 200);
        makeBox(70, 6, 22, 0xDDC880, 280, 0, 195);
        // Tideline dark sand strip
        makeBox(500, 1, 10, 0xC8B870, 150, -2, 175);
    }

    function buildHistoricQuay() {
        // Historic Quay dock wall — long stone quay
        makeBox(180, 10, 8, 0x8B6914, -40, 5, 20);
        makeBox(8, 10, 60, 0x8B6914, -130, 5, -10);
        makeBox(8, 10, 60, 0x8B6914, 50, 5, -10);
        // Cobblestone quay surface
        makeBox(180, 2, 50, 0x9A7B2F, -40, 1, -5);

        // Chandlery building
        makeBox(30, 18, 20, 0x8B7355, -90, 9, -10);
        makeCone(16, 8, 4, 0x6B4C2A, -90, 22, -10);
        // Chandlery windows (dark recesses)
        makeBox(4, 5, 1, 0x3A2D1A, -80, 10, -1);
        makeBox(4, 5, 1, 0x3A2D1A, -100, 10, -1);

        // Sailor's Tavern — larger building
        makeBox(40, 20, 25, 0x7A5C30, -20, 10, -5);
        makeCone(22, 9, 4, 0x5A3D1E, -20, 24, -5);
        // Tavern chimney
        makeBox(4, 12, 4, 0x6A5040, -10, 26, -5);
        makeBox(6, 3, 6, 0x5A4030, -10, 33, -5);
        // Tavern sign board
        makeBox(12, 5, 1, 0x4A3010, -20, 18, 8);

        // Period dock warehouse
        makeBox(50, 22, 30, 0x7B6B4A, 20, 11, -10);
        makeCone(27, 10, 4, 0x5B4B2A, 20, 26, -10);
        // Warehouse loading doors
        makeBox(8, 10, 1, 0x3A2D1A, 8, 8, 5);
        makeBox(8, 10, 1, 0x3A2D1A, 32, 8, 5);
        // Warehouse arched windows
        makeBox(5, 6, 1, 0x2A1D0A, 20, 15, 5);

        // Museum entrance archway pillars
        makeCyl(2.5, 2.5, 16, 8, 0x9A8B6A, -55, 8, 5);
        makeCyl(2.5, 2.5, 16, 8, 0x9A8B6A, -45, 8, 5);
        makeBox(14, 3, 3, 0x9A8B6A, -50, 17, 5);

        // Mooring bollards
        makeCyl(1.2, 1.5, 4, 8, 0x4A4030, -60, 2, 18);
        makeCyl(1.2, 1.5, 4, 8, 0x4A4030, -30, 2, 18);
        makeCyl(1.2, 1.5, 4, 8, 0x4A4030, 0, 2, 18);
        makeCyl(1.2, 1.5, 4, 8, 0x4A4030, 30, 2, 18);

        // Dock crane (period wooden)
        makeBox(3, 30, 3, 0x6B5030, -115, 15, -5);
        makeBox(25, 3, 3, 0x6B5030, -103, 30, -5);
        makeBox(2, 20, 2, 0x5A4020, -90, 20, -5);
    }

    function buildHMSTrincomalee() {
        // HMS Trincomalee 1817 frigate — hull
        makeBox(55, 12, 14, 0x8B4513, -40, 6, 38);
        // Hull sides with gun ports — lower hull darker
        makeBox(55, 6, 2, 0x6B2503, -40, 4, 45);
        makeBox(55, 6, 2, 0x6B2503, -40, 4, 31);
        // Bow and stern curves approximated with cylinders
        makeCyl(7, 3, 12, 8, 0x7A3510, -67, 6, 38);
        makeCyl(8, 4, 12, 8, 0x8B4010, -14, 6, 38);

        // Gun ports — row of dark squares
        makeBox(3, 3, 1, 0x2A1000, -62, 6, 45);
        makeBox(3, 3, 1, 0x2A1000, -52, 6, 45);
        makeBox(3, 3, 1, 0x2A1000, -42, 6, 45);
        makeBox(3, 3, 1, 0x2A1000, -32, 6, 45);
        makeBox(3, 3, 1, 0x2A1000, -22, 6, 45);
        makeBox(3, 3, 1, 0x2A1000, -62, 6, 31);
        makeBox(3, 3, 1, 0x2A1000, -42, 6, 31);
        makeBox(3, 3, 1, 0x2A1000, -22, 6, 31);

        // Deck
        makeBox(55, 2, 14, 0xC8A068, -40, 13, 38);
        // Deck cabin
        makeBox(18, 8, 12, 0xA07840, -25, 18, 38);

        // Foremast
        makeCyl(0.9, 1.2, 50, 8, 0x6B5030, -55, 38, 38);
        // Mainmast
        makeCyl(1.2, 1.5, 60, 8, 0x6B5030, -38, 43, 38);
        // Mizzenmast
        makeCyl(0.8, 1.0, 42, 8, 0x6B5030, -20, 35, 38);

        // Yard arms foremast
        makeBox(30, 1.5, 1.5, 0x5A4020, -55, 46, 38);
        makeBox(22, 1.2, 1.2, 0x5A4020, -55, 56, 38);

        // Yard arms mainmast
        makeBox(38, 1.5, 1.5, 0x5A4020, -38, 50, 38);
        makeBox(28, 1.2, 1.2, 0x5A4020, -38, 63, 38);

        // Yard arms mizzenmast
        makeBox(22, 1.2, 1.2, 0x5A4020, -20, 44, 38);

        // Bowsprit
        makeBox(20, 1.2, 1.2, 0x6B5030, -73, 16, 38);
    }

    function buildMarina() {
        // Marina basin walls
        makeBox(100, 8, 5, 0x4682B4, -20, 4, 130);
        makeBox(100, 8, 5, 0x4682B4, -20, 4, 80);
        makeBox(5, 8, 55, 0x4682B4, -70, 4, 105);
        makeBox(5, 8, 55, 0x4682B4, 30, 4, 105);
        // Marina water
        makeBox(90, 1, 45, 0x2A6B8A, -20, 0, 105);

        // Marina office building
        makeBox(20, 12, 15, 0x5A8AB4, 50, 6, 90);
        makeCone(12, 6, 4, 0x3A6A94, 50, 15, 90);

        // Yacht 1 — hull + mast
        makeBox(12, 4, 4, 0xFFFFFF, -10, 2, 100);
        makeCyl(0.4, 0.5, 22, 6, 0xCCCCCC, -10, 13, 100);
        makeBox(8, 1, 1, 0xCCCCCC, -10, 18, 100);

        // Yacht 2
        makeBox(10, 4, 4, 0xFF4444, 5, 2, 108);
        makeCyl(0.4, 0.5, 20, 6, 0xAAAAAA, 5, 12, 108);

        // Yacht 3
        makeBox(14, 5, 5, 0xFFDD88, -30, 2.5, 112);
        makeCyl(0.5, 0.6, 26, 6, 0xBBBBBB, -30, 15, 112);

        // Pontoon walkways
        makeBox(60, 1.5, 3, 0xC8B896, -20, 1, 95);
        makeBox(60, 1.5, 3, 0xC8B896, -20, 1, 115);
        makeBox(3, 1.5, 22, 0xC8B896, -20, 1, 105);
        makeBox(3, 1.5, 22, 0xC8B896, 10, 1, 105);

        // Harbour master's watch tower
        makeCyl(4, 4, 20, 8, 0x4A7AA4, 35, 10, 125);
        makeCyl(5, 5, 3, 8, 0x3A6A94, 35, 21, 125);
        makeBox(8, 6, 8, 0x5A8AB4, 35, 24, 125);
        makeCone(5, 5, 4, 0x2A5A84, 35, 30, 125);
    }

    function buildLighthouse() {
        // Lighthouse tower
        makeCyl(5, 7, 60, 12, 0xF5F5DC, -130, 30, -50);
        // Light housing
        makeCyl(6, 6, 6, 12, 0xDDDDCC, -130, 63, -50);
        makeCone(6, 8, 12, 0xCCCCBB, -130, 70, -50);
        // Light lens dome
        makeSphere(4, 10, 8, 0xFFFF88, -130, 63, -50);
        // Lighthouse gallery rail
        makeCyl(6.5, 6.5, 1.5, 12, 0xAAAAAA, -130, 61, -50);

        // Keeper's cottage
        makeBox(22, 12, 18, 0xE8DDD0, -148, 6, -48);
        makeCone(13, 7, 4, 0x8B6B50, -148, 16, -48);
        // Cottage chimney
        makeBox(3, 8, 3, 0xB09070, -143, 19, -48);
        // Cottage door
        makeBox(4, 7, 1, 0x5A3A20, -148, 4, -40);
        // Cottage windows
        makeBox(5, 4, 1, 0x8BB0CC, -155, 8, -40);
        makeBox(5, 4, 1, 0x8BB0CC, -141, 8, -40);

        // Lighthouse wall enclosure
        makeBox(50, 5, 3, 0xD5C5A0, -140, 2.5, -35);
        makeBox(50, 5, 3, 0xD5C5A0, -140, 2.5, -65);
        makeBox(3, 5, 32, 0xD5C5A0, -115, 2.5, -50);
        makeBox(3, 5, 32, 0xD5C5A0, -165, 2.5, -50);
    }

    function buildHeughBattery() {
        // Heugh Battery — WWI gun emplacement
        // Battery wall — thick concrete
        makeBox(80, 8, 12, 0x666666, -120, 4, 20);
        // Battery merlons (notched parapet)
        makeBox(8, 5, 12, 0x777777, -155, 10, 20);
        makeBox(8, 5, 12, 0x777777, -140, 10, 20);
        makeBox(8, 5, 12, 0x777777, -125, 10, 20);
        makeBox(8, 5, 12, 0x777777, -110, 10, 20);
        makeBox(8, 5, 12, 0x777777, -95, 10, 20);
        makeBox(8, 5, 12, 0x777777, -80, 10, 20);

        // Gun emplacements — two main 6-inch guns
        makeCyl(5, 6, 3, 12, 0x555555, -140, 9, 14);
        makeBox(18, 3, 4, 0x4A4A4A, -140, 11, 14);
        makeCyl(1.5, 1.5, 20, 8, 0x3A3A3A, -131, 13, 14);

        makeCyl(5, 6, 3, 12, 0x555555, -110, 9, 14);
        makeBox(18, 3, 4, 0x4A4A4A, -110, 11, 14);
        makeCyl(1.5, 1.5, 20, 8, 0x3A3A3A, -101, 13, 14);

        // Battery observation post
        makeBox(12, 14, 12, 0x5A5A5A, -160, 7, 15);
        makeBox(14, 3, 14, 0x4A4A4A, -160, 15, 15);

        // Barracks building
        makeBox(40, 10, 20, 0x707070, -130, 5, -5);
        makeCone(22, 5, 4, 0x5A5A5A, -130, 13, -5);

        // Shell storage bunker
        makeBox(18, 6, 18, 0x4A4A4A, -155, 3, -5);
        makeBox(18, 3, 18, 0x555555, -155, 7.5, -5);

        // Flagpole
        makeCyl(0.5, 0.6, 22, 6, 0xAAAAAA, -170, 11, 15);
        makeBox(8, 4, 1, 0xCC2222, -165, 21, 15);
    }

    function buildHeadlandChurch() {
        // St Hilda's Church — Norman church on headland
        // Nave
        makeBox(40, 22, 18, 0xD4C8B0, -80, 11, -90);
        // Chancel
        makeBox(20, 20, 16, 0xC8BCA4, -108, 10, -90);
        // Norman tower — prominent
        makeBox(16, 42, 16, 0xC0B498, -65, 21, -90);
        // Tower battlements
        makeBox(18, 4, 18, 0xB8AC90, -65, 44, -90);
        makeBox(4, 5, 4, 0xB0A488, -72, 47, -97);
        makeBox(4, 5, 4, 0xB0A488, -58, 47, -97);
        makeBox(4, 5, 4, 0xB0A488, -72, 47, -83);
        makeBox(4, 5, 4, 0xB0A488, -58, 47, -83);
        // Spire atop tower
        makeCone(10, 22, 4, 0xA09888, -65, 57, -90);

        // Arched windows (narrow Norman style)
        makeBox(3, 8, 1, 0x3A3020, -80, 14, -81);
        makeBox(3, 8, 1, 0x3A3020, -90, 14, -81);
        makeBox(3, 8, 1, 0x3A3020, -65, 22, -82);

        // Porch
        makeBox(10, 14, 8, 0xC8BCA4, -62, 7, -81);
        makeCone(6, 6, 4, 0xB8AC90, -62, 17, -81);

        // Churchyard wall
        makeBox(80, 4, 3, 0xA09080, -80, 2, -75);
        makeBox(3, 4, 50, 0xA09080, -120, 2, -90);
        makeBox(3, 4, 50, 0xA09080, -40, 2, -90);
        // Grave markers
        makeBox(2, 4, 0.5, 0xC0B8A8, -75, 2, -80);
        makeBox(2, 4, 0.5, 0xC0B8A8, -85, 2, -80);
        makeBox(2, 4, 0.5, 0xC0B8A8, -95, 2, -80);
        makeBox(2, 5, 0.5, 0xB8B0A0, -70, 2.5, -80);
    }

    function buildPowerStation() {
        // Hartlepool Power Station — twin AGR domes
        // Main reactor building 1
        makeBox(40, 30, 40, 0x999999, 200, 15, 80);
        // Dome 1
        makeSphere(22, 16, 12, 0x888888, 200, 42, 80);
        // Main reactor building 2
        makeBox(40, 30, 40, 0x999999, 260, 15, 80);
        // Dome 2
        makeSphere(22, 16, 12, 0x888888, 260, 42, 80);
        // Turbine hall connecting block
        makeBox(60, 25, 50, 0xAAAAAA, 230, 12, 90);
        // Administration block
        makeBox(30, 16, 20, 0x888888, 175, 8, 70);
        // Chimney stacks
        makeCyl(3, 4, 55, 8, 0x777777, 190, 27.5, 65);
        makeCyl(3, 4, 55, 8, 0x777777, 275, 27.5, 65);
        // Security fence
        makeBox(150, 6, 2, 0x666666, 225, 3, 55);
        makeBox(150, 6, 2, 0x666666, 225, 3, 115);
        makeBox(2, 6, 62, 0x666666, 148, 3, 86);
        makeBox(2, 6, 62, 0x666666, 302, 3, 86);
        // Warning sign post
        makeCyl(0.8, 0.8, 10, 6, 0xFFAA00, 155, 5, 58);
        makeBox(6, 4, 0.5, 0xFFAA00, 155, 11, 58);
    }

    function buildWestDocks() {
        // Victorian dock complex
        // Dock basin walls
        makeBox(200, 10, 8, 0x555555, 100, 5, 60);
        makeBox(200, 10, 8, 0x555555, 100, 5, 150);
        makeBox(8, 10, 98, 0x555555, 198, 5, 105);
        makeBox(8, 10, 98, 0x555555, 2, 5, 105);

        // Warehouse 1 — large Victorian
        makeBox(60, 24, 30, 0x4A4A4A, 70, 12, 55);
        makeCone(32, 10, 4, 0x3A3A3A, 70, 29, 55);
        // Warehouse windows
        makeBox(6, 5, 1, 0x222222, 55, 16, 40);
        makeBox(6, 5, 1, 0x222222, 70, 16, 40);
        makeBox(6, 5, 1, 0x222222, 85, 16, 40);

        // Warehouse 2
        makeBox(50, 20, 28, 0x4A4040, 150, 10, 55);
        makeCone(28, 9, 4, 0x3A3030, 150, 24, 55);

        // Dock cranes — Victorian iron cranes
        makeBox(4, 28, 4, 0x3A3A3A, 50, 14, 62);
        makeBox(22, 3, 3, 0x3A3A3A, 61, 28, 62);
        makeBox(2, 20, 2, 0x444444, 72, 18, 62);
        makeCyl(1, 1, 16, 6, 0x3A3A3A, 72, 8, 62);

        makeBox(4, 28, 4, 0x3A3A3A, 130, 14, 62);
        makeBox(22, 3, 3, 0x3A3A3A, 141, 28, 62);
        makeBox(2, 20, 2, 0x444444, 152, 18, 62);

        makeBox(4, 28, 4, 0x3A3A3A, 170, 14, 62);
        makeBox(22, 3, 3, 0x3A3A3A, 181, 28, 62);
        makeBox(2, 20, 2, 0x444444, 192, 18, 62);

        // Dock office
        makeBox(20, 14, 18, 0x5A5050, 10, 7, 58);
        makeCone(12, 7, 4, 0x4A4040, 10, 18, 58);
        // Flagpole on office
        makeCyl(0.5, 0.5, 16, 6, 0xAAAAAA, 10, 29, 58);
    }

    function buildPeriodDocksBuildings() {
        // Additional period buildings along quay
        // Rope walk building (long and narrow)
        makeBox(80, 10, 10, 0x7A6B4A, -40, 5, -25);
        makeCone(42, 5, 4, 0x6A5B3A, -40, 13, -25);

        // Cooperage
        makeBox(22, 16, 18, 0x8B7355, 45, 8, -20);
        makeCone(13, 7, 4, 0x7B6345, 45, 20, -20);

        // Sail loft — tall building
        makeBox(28, 28, 22, 0x7B6B4A, -5, 14, -15);
        makeCone(16, 10, 4, 0x6B5B3A, -5, 33, -15);
        // Sail loft hoist beam
        makeBox(12, 2, 2, 0x5A4A2A, 7, 32, -15);

        // Smithy / Forge
        makeBox(18, 14, 15, 0x6A5A40, -110, 7, -25);
        makeCone(10, 8, 4, 0x5A4A30, -110, 19, -25);
        // Smithy chimney
        makeBox(3, 14, 3, 0x4A3A20, -107, 22, -25);
        makeBox(5, 3, 5, 0x3A2A10, -107, 30, -25);

        // Ship's chandler storefront
        makeBox(20, 14, 16, 0x9A8B6A, -75, 7, -15);
        makeCone(12, 7, 4, 0x8A7B5A, -75, 18, -15);
    }

    function buildRigging() {
        // Rigging on HMS Trincomalee using LineSegments
        var riggingPoints = [];
        // Forestay foremast to bowsprit
        riggingPoints.push(-55 + OX, 62 + OY, 38 + OZ);
        riggingPoints.push(-80 + OX, 16 + OY, 38 + OZ);
        // Main stay mainmast to foremast
        riggingPoints.push(-38 + OX, 73 + OY, 38 + OZ);
        riggingPoints.push(-55 + OX, 62 + OY, 38 + OZ);
        // Mizzen stay
        riggingPoints.push(-20 + OX, 56 + OY, 38 + OZ);
        riggingPoints.push(-38 + OX, 63 + OY, 38 + OZ);
        // Backstays foremast
        riggingPoints.push(-55 + OX, 62 + OY, 38 + OZ);
        riggingPoints.push(-32 + OX, 14 + OY, 48 + OZ);
        riggingPoints.push(-55 + OX, 62 + OY, 38 + OZ);
        riggingPoints.push(-32 + OX, 14 + OY, 28 + OZ);
        // Backstays mainmast
        riggingPoints.push(-38 + OX, 73 + OY, 38 + OZ);
        riggingPoints.push(-14 + OX, 14 + OY, 48 + OZ);
        riggingPoints.push(-38 + OX, 73 + OY, 38 + OZ);
        riggingPoints.push(-14 + OX, 14 + OY, 28 + OZ);
        // Shrouds foremast
        riggingPoints.push(-55 + OX, 46 + OY, 38 + OZ);
        riggingPoints.push(-55 + OX, 14 + OY, 46 + OZ);
        riggingPoints.push(-55 + OX, 46 + OY, 38 + OZ);
        riggingPoints.push(-55 + OX, 14 + OY, 30 + OZ);
        // Braces foremast yard
        riggingPoints.push(-70 + OX, 46 + OY, 38 + OZ);
        riggingPoints.push(-55 + OX, 50 + OY, 38 + OZ);
        riggingPoints.push(-40 + OX, 46 + OY, 38 + OZ);
        riggingPoints.push(-55 + OX, 50 + OY, 38 + OZ);

        var riggingGeo = new THREE.BufferGeometry();
        var riggingVerts = new Float32Array(riggingPoints);
        riggingGeo.setAttribute('position', new THREE.BufferAttribute(riggingVerts, 3));
        var riggingMat = new THREE.LineBasicMaterial({ color: 0x4A3010 });
        var riggingLines = new THREE.LineSegments(riggingGeo, riggingMat);
        scene.add(riggingLines);
        objects.push(riggingLines);
    }

    function buildWaves() {
        // Sea waves — flattened boxes at slight angles suggesting wave crests
        makeBox(80, 1, 6, 0x1A8AB4, 180, -1.5, -130);
        makeBox(80, 1, 6, 0x1A8AB4, 160, -1.5, -155);
        makeBox(80, 1, 6, 0x1A8AB4, 220, -1.5, -110);
        makeBox(60, 1, 4, 0x2A9AC4, 300, -1.5, -90);
        makeBox(60, 1, 4, 0x2A9AC4, 280, -1.5, -140);
        makeBox(100, 1, 5, 0x1A8AB4, 130, -1.5, -180);
        // Surf line at beach
        makeBox(500, 1.5, 5, 0xCCEEFF, 150, -1.5, 165);
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
