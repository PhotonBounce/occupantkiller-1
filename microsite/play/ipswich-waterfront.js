window.IpswichWaterfront = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 22040;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildRiverOrwell();
        buildOrwellBridge();
        buildWaterfrontDock();
        buildDockWarehouses();
        buildMarina();
        buildWillisBuilding();
        buildPortmanRoad();
        buildAncientHouse();
        buildStClementsChurch();
        buildChristchurchMansion();
        buildSuffolkCountryside();
        buildTownStreets();
        buildHarbourEdge();
    }

    function buildGround() {
        // Main ground slab - using box geometry as PlaneGeometry is forbidden
        addMesh(new THREE.BoxGeometry(2400, 2, 2400), 0x8AB55A, 0, -1, 0);
        // Waterfront concrete quayside
        addMesh(new THREE.BoxGeometry(600, 1, 300), 0xAAAAAA, -60, 0, 80);
        // Town centre paving
        addMesh(new THREE.BoxGeometry(400, 1, 400), 0xCCBBA0, 200, 0, -100);
    }

    function buildRiverOrwell() {
        // Main river body - wide stretch heading south
        addMesh(new THREE.BoxGeometry(800, 1, 360), 0x4682B4, -200, -0.5, 260);
        // River channel deeper blue
        addMesh(new THREE.BoxGeometry(400, 2, 180), 0x2A5F8F, -200, -1, 260);
        // River estuary widening
        addMesh(new THREE.BoxGeometry(1000, 1, 500), 0x4682B4, -500, -1, 500);
        // Mud flat / foreshore either side
        addMesh(new THREE.BoxGeometry(200, 1, 360), 0x8B7355, 200, -0.5, 260);
        addMesh(new THREE.BoxGeometry(200, 1, 360), 0x8B7355, -600, -0.5, 260);
    }

    function buildOrwellBridge() {
        // Long concrete box-girder deck
        addMesh(new THREE.BoxGeometry(1000, 6, 28), 0xCCCCCC, -400, 28, 460);
        // Bridge piers - tall tapered pylons
        addMesh(new THREE.BoxGeometry(8, 56, 8), 0xBBBBBB, -100, 0, 460);
        addMesh(new THREE.BoxGeometry(8, 56, 8), 0xBBBBBB, -200, 0, 460);
        addMesh(new THREE.BoxGeometry(8, 56, 8), 0xBBBBBB, -300, 0, 460);
        addMesh(new THREE.BoxGeometry(8, 56, 8), 0xBBBBBB, -400, 0, 460);
        addMesh(new THREE.BoxGeometry(8, 56, 8), 0xBBBBBB, -500, 0, 460);
        addMesh(new THREE.BoxGeometry(8, 56, 8), 0xBBBBBB, -600, 0, 460);
        addMesh(new THREE.BoxGeometry(8, 56, 8), 0xBBBBBB, -700, 0, 460);
        // Bridge approach ramps
        addMesh(new THREE.BoxGeometry(200, 4, 28), 0xCCCCCC, 0, 14, 460);
        addMesh(new THREE.BoxGeometry(200, 4, 28), 0xCCCCCC, -800, 14, 460);
        // Parapet railings represented as thin boxes
        addMesh(new THREE.BoxGeometry(1000, 3, 2), 0xAAAAAA, -400, 32, 446);
        addMesh(new THREE.BoxGeometry(1000, 3, 2), 0xAAAAAA, -400, 32, 474);
    }

    function buildWaterfrontDock() {
        // Victorian wet dock water basin
        addMesh(new THREE.BoxGeometry(320, 2, 220), 0x4682B4, -80, -1, 60);
        // Dock walls / quay perimeter
        addMesh(new THREE.BoxGeometry(320, 4, 6), 0x8B7D6B, -80, 2, -50);
        addMesh(new THREE.BoxGeometry(320, 4, 6), 0x8B7D6B, -80, 2, 170);
        addMesh(new THREE.BoxGeometry(6, 4, 220), 0x8B7D6B, -245, 2, 60);
        addMesh(new THREE.BoxGeometry(6, 4, 220), 0x8B7D6B, 85, 2, 60);
        // Lock gate towers
        addMesh(new THREE.BoxGeometry(10, 18, 10), 0x6B5E4B, 85, 9, 40);
        addMesh(new THREE.BoxGeometry(10, 18, 10), 0x6B5E4B, 85, 9, 80);
        // Dock floor texture suggestion - dark water
        addMesh(new THREE.BoxGeometry(300, 1, 200), 0x2E5F7A, -80, -1.5, 60);
    }

    function buildDockWarehouses() {
        // Converted Victorian red-brick warehouses along north quay
        // Warehouse A - long converted block
        addMesh(new THREE.BoxGeometry(80, 28, 30), 0xC8B89A, -180, 14, -68);
        // White gabled facade elements
        addMesh(new THREE.BoxGeometry(14, 8, 2), 0xF0F0F0, -180, 32, -83);
        addMesh(new THREE.ConeGeometry(8, 10, 4), 0xF0F0F0, -180, 42, -83, 0, 0, 0.785);
        // Warehouse B
        addMesh(new THREE.BoxGeometry(70, 24, 28), 0xC0A882, -90, 12, -66);
        addMesh(new THREE.BoxGeometry(12, 7, 2), 0xF0F0F0, -90, 27, -80);
        addMesh(new THREE.ConeGeometry(7, 9, 4), 0xF0F0F0, -90, 36, -80, 0, 0, 0.785);
        // Warehouse C - east side, offices now
        addMesh(new THREE.BoxGeometry(60, 22, 26), 0xBEAA86, 20, 11, -65);
        addMesh(new THREE.BoxGeometry(10, 6, 2), 0xF0F0F0, 20, 25, -78);
        addMesh(new THREE.ConeGeometry(6, 8, 4), 0xF0F0F0, 20, 33, -78, 0, 0, 0.785);
        // Chimney stacks - remnant industrial
        addMesh(new THREE.CylinderGeometry(2, 3, 22, 8), 0x8B6B4B, -170, 25, -70);
        addMesh(new THREE.CylinderGeometry(2, 3, 18, 8), 0x8B6B4B, -60, 22, -68);
        // Restaurant / bar conversion ground floor trim
        addMesh(new THREE.BoxGeometry(80, 4, 4), 0xF5E6C8, -180, 2, -53);
        addMesh(new THREE.BoxGeometry(70, 4, 4), 0xF5E6C8, -90, 2, -52);
    }

    function buildMarina() {
        // Pontoons
        addMesh(new THREE.BoxGeometry(100, 1, 6), 0xCCBB99, -80, 1, -20);
        addMesh(new THREE.BoxGeometry(100, 1, 6), 0xCCBB99, -80, 1, 0);
        addMesh(new THREE.BoxGeometry(100, 1, 6), 0xCCBB99, -80, 1, 20);
        // Cross-pontoon spine
        addMesh(new THREE.BoxGeometry(6, 1, 56), 0xCCBB99, -30, 1, 0);
        addMesh(new THREE.BoxGeometry(6, 1, 56), 0xCCBB99, -130, 1, 0);
        // Yacht hulls (simplified as elongated boxes)
        addMesh(new THREE.BoxGeometry(16, 4, 4), 0xFFFFFF, -55, 3, -18);
        addMesh(new THREE.BoxGeometry(14, 3, 3), 0xEEDDCC, -75, 2, -18);
        addMesh(new THREE.BoxGeometry(18, 4, 4), 0xFFFFFF, -100, 3, -18);
        addMesh(new THREE.BoxGeometry(16, 4, 4), 0xF8F8F8, -55, 3, 2);
        addMesh(new THREE.BoxGeometry(14, 3, 3), 0xDDEEFF, -100, 2, 2);
        // Yacht masts
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 28, 6), 0xAAAAAA, -55, 16, -18);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 24, 6), 0xAAAAAA, -75, 14, -18);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 28, 6), 0xAAAAAA, -100, 16, -18);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 26, 6), 0xAAAAAA, -55, 15, 2);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 24, 6), 0xAAAAAA, -100, 14, 2);
        // Harbourmaster office
        addMesh(new THREE.BoxGeometry(12, 10, 10), 0xC8B89A, 60, 5, -20);
        addMesh(new THREE.BoxGeometry(14, 2, 12), 0x887766, 60, 11, -20);
    }

    function buildWillisBuilding() {
        // Norman Foster 1975 - Lloyds-style glass office - raised on pilotis
        // Main glazed box body
        addMesh(new THREE.BoxGeometry(40, 36, 40), 0xF5F5DC, 180, 18, -80);
        // Green-tinted glazing cladding suggestion (thin layer)
        addMesh(new THREE.BoxGeometry(42, 36, 2), 0xC8D8A0, 180, 18, -101);
        addMesh(new THREE.BoxGeometry(42, 36, 2), 0xC8D8A0, 180, 18, -59);
        addMesh(new THREE.BoxGeometry(2, 36, 42), 0xC8D8A0, 159, 18, -80);
        addMesh(new THREE.BoxGeometry(2, 36, 42), 0xC8D8A0, 201, 18, -80);
        // Pilotis / columns lifting it off ground
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 8), 0xE0E0D0, 162, 4, -63);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 8), 0xE0E0D0, 198, 4, -63);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 8), 0xE0E0D0, 162, 4, -97);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 8), 0xE0E0D0, 198, 4, -97);
        // Rooftop plant room
        addMesh(new THREE.BoxGeometry(30, 6, 30), 0xD0D0C0, 180, 39, -80);
        // External service towers (Lloyds style)
        addMesh(new THREE.BoxGeometry(6, 40, 6), 0xD8D8C0, 162, 20, -80);
        addMesh(new THREE.BoxGeometry(6, 40, 6), 0xD8D8C0, 198, 20, -80);
    }

    function buildPortmanRoad() {
        // Ipswich Town FC - Portman Road Stadium
        // Main pitch base
        addMesh(new THREE.BoxGeometry(110, 1, 74), 0x2E7D32, 300, 0, -80);
        // North stand
        addMesh(new THREE.BoxGeometry(114, 20, 18), 0x0044BB, 300, 10, -128);
        // South stand
        addMesh(new THREE.BoxGeometry(114, 18, 16), 0x0044BB, 300, 9, -32);
        // East stand
        addMesh(new THREE.BoxGeometry(18, 22, 78), 0x0044BB, 354, 11, -80);
        // West stand (Cobbold Stand - larger)
        addMesh(new THREE.BoxGeometry(18, 26, 78), 0x0044BB, 246, 13, -80);
        // Roof trusses north and south (light grey)
        addMesh(new THREE.BoxGeometry(114, 3, 12), 0xCCCCCC, 300, 22, -122);
        addMesh(new THREE.BoxGeometry(114, 3, 12), 0xCCCCCC, 300, 20, -38);
        // Floodlight towers at corners
        addMesh(new THREE.CylinderGeometry(0.8, 1.2, 36, 6), 0x888888, 248, 18, -132);
        addMesh(new THREE.CylinderGeometry(0.8, 1.2, 36, 6), 0x888888, 352, 18, -132);
        addMesh(new THREE.CylinderGeometry(0.8, 1.2, 36, 6), 0x888888, 248, 18, -28);
        addMesh(new THREE.CylinderGeometry(0.8, 1.2, 36, 6), 0x888888, 352, 18, -28);
        // Floodlight heads
        addMesh(new THREE.BoxGeometry(8, 3, 5), 0xFFEE88, 248, 37, -132);
        addMesh(new THREE.BoxGeometry(8, 3, 5), 0xFFEE88, 352, 37, -132);
        addMesh(new THREE.BoxGeometry(8, 3, 5), 0xFFEE88, 248, 37, -28);
        addMesh(new THREE.BoxGeometry(8, 3, 5), 0xFFEE88, 352, 37, -28);
    }

    function buildAncientHouse() {
        // Jacobean pargeted house in Tavern Street
        // Main body
        addMesh(new THREE.BoxGeometry(18, 16, 12), 0xC8A870, 220, 8, -145);
        // Upper jettied storey (overhangs slightly)
        addMesh(new THREE.BoxGeometry(20, 5, 14), 0xC4A065, 220, 16, -145);
        // Ornate gabled roofline
        addMesh(new THREE.BoxGeometry(20, 2, 14), 0xB89060, 220, 19, -145);
        addMesh(new THREE.ConeGeometry(5, 7, 4), 0xA07850, 210, 24, -145, 0, 0.785, 0);
        addMesh(new THREE.ConeGeometry(5, 7, 4), 0xA07850, 220, 24, -145, 0, 0.785, 0);
        addMesh(new THREE.ConeGeometry(5, 7, 4), 0xA07850, 230, 24, -145, 0, 0.785, 0);
        // Oriel window protrusion
        addMesh(new THREE.BoxGeometry(4, 6, 3), 0xD4B87A, 220, 10, -152);
        // Decorative pargeting panels (lighter plaster panels)
        addMesh(new THREE.BoxGeometry(16, 8, 1), 0xE0C898, 220, 8, -151);
        // Chimney stacks
        addMesh(new THREE.CylinderGeometry(0.8, 1, 10, 6), 0x9B7B5B, 215, 24, -142);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 10, 6), 0x9B7B5B, 225, 24, -142);
    }

    function buildStClementsChurch() {
        // Medieval flint church
        // Nave
        addMesh(new THREE.BoxGeometry(30, 18, 16), 0xD4C8A0, 130, 9, -170);
        // Chancel (east end, slightly narrower)
        addMesh(new THREE.BoxGeometry(14, 15, 12), 0xD0C49C, 151, 7, -170);
        // West tower - square flint
        addMesh(new THREE.BoxGeometry(12, 32, 12), 0xC8BC98, 108, 16, -170);
        // Battlemented parapet on tower
        addMesh(new THREE.BoxGeometry(14, 3, 14), 0xCCC0A0, 108, 33, -170);
        // Tower corner pinnacles
        addMesh(new THREE.ConeGeometry(1, 6, 4), 0xCCC0A0, 101, 38, -163);
        addMesh(new THREE.ConeGeometry(1, 6, 4), 0xCCC0A0, 115, 38, -163);
        addMesh(new THREE.ConeGeometry(1, 6, 4), 0xCCC0A0, 101, 38, -177);
        addMesh(new THREE.ConeGeometry(1, 6, 4), 0xCCC0A0, 115, 38, -177);
        // Nave roof pitch
        addMesh(new THREE.BoxGeometry(30, 2, 18), 0xB0A080, 130, 19, -170);
        // Porch
        addMesh(new THREE.BoxGeometry(6, 10, 8), 0xD0C49C, 130, 5, -162);
        addMesh(new THREE.ConeGeometry(4, 5, 4), 0xB0A080, 130, 14, -162, 0, 0.785, 0);
        // Churchyard low wall
        addMesh(new THREE.BoxGeometry(60, 3, 2), 0xC0B898, 125, 1, -155);
        addMesh(new THREE.BoxGeometry(60, 3, 2), 0xC0B898, 125, 1, -188);
        addMesh(new THREE.BoxGeometry(2, 3, 36), 0xC0B898, 95, 1, -171);
        addMesh(new THREE.BoxGeometry(2, 3, 36), 0xC0B898, 155, 1, -171);
    }

    function buildChristchurchMansion() {
        // Tudor mansion in Christchurch Park
        // Main hall range
        addMesh(new THREE.BoxGeometry(50, 24, 22), 0xDEB887, 100, 12, -260);
        // East wing
        addMesh(new THREE.BoxGeometry(18, 20, 22), 0xD4AD82, 134, 10, -260);
        // West wing
        addMesh(new THREE.BoxGeometry(18, 20, 22), 0xD4AD82, 66, 10, -260);
        // Central gatehouse tower
        addMesh(new THREE.BoxGeometry(12, 32, 12), 0xCC9966, 100, 16, -260);
        // Tudor gabled roofline main block
        addMesh(new THREE.BoxGeometry(50, 4, 24), 0xAA7744, 100, 26, -260);
        // Chimneys - Tudor style, multiple stacks
        addMesh(new THREE.CylinderGeometry(1, 1.4, 14, 6), 0xBB8855, 88, 33, -256);
        addMesh(new THREE.CylinderGeometry(1, 1.4, 14, 6), 0xBB8855, 94, 33, -256);
        addMesh(new THREE.CylinderGeometry(1, 1.4, 14, 6), 0xBB8855, 106, 33, -256);
        addMesh(new THREE.CylinderGeometry(1, 1.4, 14, 6), 0xBB8855, 112, 33, -256);
        // Park trees (sphere canopies on cylinder trunks)
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 8, 6), 0x5B4530, 70, 4, -230);
        addMesh(new THREE.SphereGeometry(7, 8, 6), 0x2D6A2D, 70, 13, -230);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 9, 6), 0x5B4530, 140, 4, -240);
        addMesh(new THREE.SphereGeometry(8, 8, 6), 0x2D6A2D, 140, 14, -240);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 10, 6), 0x4B3820, 80, 5, -290);
        addMesh(new THREE.SphereGeometry(9, 8, 6), 0x3A7A3A, 80, 16, -290);
        addMesh(new THREE.CylinderGeometry(0.6, 0.8, 8, 6), 0x5B4530, 120, 4, -290);
        addMesh(new THREE.SphereGeometry(7, 8, 6), 0x3A7A3A, 120, 13, -290);
        // Park boundary wall
        addMesh(new THREE.BoxGeometry(100, 4, 2), 0xC0A878, 100, 2, -220);
    }

    function buildSuffolkCountryside() {
        // Gentle rolling farmland - Constable Country feel
        // Rolling ground undulations (raised field boxes)
        addMesh(new THREE.BoxGeometry(300, 4, 200), 0x8AB55A, -500, 2, -200);
        addMesh(new THREE.BoxGeometry(200, 6, 150), 0x7AAA48, -700, 3, -100);
        addMesh(new THREE.BoxGeometry(250, 3, 180), 0x90BE60, -600, 1, -350);
        // Hedgerows (long low boxes)
        addMesh(new THREE.BoxGeometry(200, 5, 4), 0x3D7A28, -520, 2, -280);
        addMesh(new THREE.BoxGeometry(4, 5, 160), 0x3D7A28, -420, 2, -200);
        addMesh(new THREE.BoxGeometry(180, 5, 4), 0x2D6A18, -680, 2, -180);
        addMesh(new THREE.BoxGeometry(4, 5, 180), 0x3D7A28, -780, 2, -120);
        // Farmhouse in countryside
        addMesh(new THREE.BoxGeometry(16, 10, 12), 0xDEB887, -580, 5, -220);
        addMesh(new THREE.BoxGeometry(16, 2, 14), 0xCC9944, -580, 11, -220);
        addMesh(new THREE.CylinderGeometry(1, 1.4, 8, 6), 0xAA7733, -574, 15, -218);
        // Barn
        addMesh(new THREE.BoxGeometry(24, 12, 14), 0xC08040, -620, 6, -240);
        addMesh(new THREE.BoxGeometry(26, 2, 16), 0x8B6030, -620, 13, -240);
        // Countryside trees
        addMesh(new THREE.CylinderGeometry(0.7, 1, 9, 6), 0x4B3020, -550, 4, -260);
        addMesh(new THREE.SphereGeometry(8, 8, 6), 0x2A5E1A, -550, 14, -260);
        addMesh(new THREE.CylinderGeometry(0.7, 1, 11, 6), 0x4B3020, -640, 5, -180);
        addMesh(new THREE.SphereGeometry(9, 8, 6), 0x2A6A1A, -640, 16, -180);
        addMesh(new THREE.CylinderGeometry(0.7, 1, 8, 6), 0x5B4030, -700, 4, -300);
        addMesh(new THREE.SphereGeometry(7, 8, 6), 0x3A7A2A, -700, 13, -300);
    }

    function buildTownStreets() {
        // Tavern Street / town centre roads
        addMesh(new THREE.BoxGeometry(200, 0.5, 10), 0x555555, 200, 0.2, -145);
        addMesh(new THREE.BoxGeometry(10, 0.5, 120), 0x555555, 175, 0.2, -145);
        // Cornhill area - central market square
        addMesh(new THREE.BoxGeometry(60, 0.5, 60), 0xBBAA99, 200, 0.3, -200);
        // Town Hall building on Cornhill
        addMesh(new THREE.BoxGeometry(26, 18, 16), 0xCCBB99, 200, 9, -200);
        addMesh(new THREE.BoxGeometry(28, 3, 18), 0xDDCCAA, 200, 19, -200);
        addMesh(new THREE.CylinderGeometry(2, 2, 20, 8), 0xBBAA88, 200, 28, -200);
        addMesh(new THREE.SphereGeometry(2.5, 8, 6), 0xBBAA88, 200, 39, -200);
        // Side street terraced buildings
        addMesh(new THREE.BoxGeometry(60, 12, 10), 0xC8A888, 155, 6, -145);
        addMesh(new THREE.BoxGeometry(60, 12, 10), 0xC8A888, 260, 6, -145);
        // Quayside restaurant strip
        addMesh(new THREE.BoxGeometry(90, 8, 14), 0xD4B890, -60, 4, -58);
        addMesh(new THREE.BoxGeometry(90, 2, 16), 0xAA8866, -60, 9, -58);
        // Lamp posts along waterfront
        addMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x444444, -100, 4, -52);
        addMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x444444, -60, 4, -52);
        addMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x444444, -20, 4, -52);
        addMesh(new THREE.SphereGeometry(0.8, 6, 4), 0xFFFF88, -100, 9, -52);
        addMesh(new THREE.SphereGeometry(0.8, 6, 4), 0xFFFF88, -60, 9, -52);
        addMesh(new THREE.SphereGeometry(0.8, 6, 4), 0xFFFF88, -20, 9, -52);
    }

    function buildHarbourEdge() {
        // Tidal surge barrier gate (simplified)
        addMesh(new THREE.BoxGeometry(30, 10, 6), 0x888888, -245, 5, 170);
        // Navigation marker buoys
        addMesh(new THREE.SphereGeometry(2, 6, 4), 0xFF4400, -200, 3, 200);
        addMesh(new THREE.SphereGeometry(2, 6, 4), 0x00AA44, -160, 3, 220);
        // Dock crane structure
        addMesh(new THREE.CylinderGeometry(1, 2, 30, 8), 0x777777, -230, 15, 170);
        addMesh(new THREE.BoxGeometry(40, 3, 3), 0x666666, -210, 31, 170);
        // Crane hook/counterweight
        addMesh(new THREE.BoxGeometry(6, 6, 6), 0x555555, -194, 31, 170);
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
