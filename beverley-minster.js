window.BeverleyMinster = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21360;
    var OY = 0;
    var OZ = 0;

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        return makeMesh(new THREE.BoxGeometry(w, h, d), color, x, y, z);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        return makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color, x, y, z);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        return makeMesh(new THREE.SphereGeometry(r, ws, hs), color, x, y, z);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        return makeMesh(new THREE.ConeGeometry(r, h, segs), color, x, y, z);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        buildGround();
        buildMinster();
        buildNorthBar();
        buildSaturdayMarket();
        buildStMarysChurch();
        buildGuildhall();
        buildFriaryRuins();
        buildBeverleyBeck();
        buildWestwoodCommon();
        buildGeorgianTownhouses();
    }

    function buildGround() {
        // Ground plane via thin box
        makeBox(600, 1, 600, 0x5a7a3a, 0, -0.5, 0);
        // Road surface - main street
        makeBox(10, 0.6, 300, 0x888888, 0, 0, 0);
        // Cross street
        makeBox(300, 0.6, 10, 0x888888, 0, 0, 20);
    }

    function buildMinster() {
        // Beverley Minster - magnificent Gothic church, twin west towers
        // Main nave body - 10 bays, long and tall
        makeBox(22, 18, 60, 0xD4C9B0, -60, 9, -40);
        // Nave roof - pitched
        makeMesh(new THREE.CylinderGeometry(0.1, 11, 70, 4), 0xC0B8A0, -60, 24, -40);

        // Chancel (east end) - Early English, narrower
        makeBox(14, 16, 28, 0xD4C9B0, -60, 8, -90);
        // Chancel roof
        makeCone(7, 10, 4, 0xC0B8A0, -60, 22, -90);

        // Crossing tower - central tower above transepts
        makeBox(12, 30, 12, 0xD4C9B0, -60, 15, -52);
        makeBox(10, 6, 10, 0xD4C9B0, -60, 33, -52);
        makeCone(4, 8, 4, 0xC0B8A0, -60, 40, -52);

        // Twin west towers (most beautiful in England)
        // North west tower
        makeBox(9, 40, 9, 0xD4C9B0, -72, 20, -16);
        makeBox(7, 5, 7, 0xD4C9B0, -72, 42, -16);
        makeCone(4, 12, 8, 0xC0B8A0, -72, 51, -16);
        // Tower window details - north tower
        makeBox(2, 6, 0.5, 0x5a5a7a, -72, 30, -12);
        makeBox(2, 6, 0.5, 0x5a5a7a, -72, 18, -12);

        // South west tower
        makeBox(9, 40, 9, 0xD4C9B0, -48, 20, -16);
        makeBox(7, 5, 7, 0xD4C9B0, -48, 42, -16);
        makeCone(4, 12, 8, 0xC0B8A0, -48, 51, -16);
        // Tower window details - south tower
        makeBox(2, 6, 0.5, 0x5a5a7a, -48, 30, -12);
        makeBox(2, 6, 0.5, 0x5a5a7a, -48, 18, -12);

        // Decorated Gothic west front connecting towers
        makeBox(16, 28, 3, 0xD4C9B0, -60, 14, -13);
        // Great west window
        makeBox(8, 14, 0.5, 0x6a7a9a, -60, 16, -12);
        // West door arch
        makeBox(4, 8, 0.6, 0x8a7a6a, -60, 4, -12);

        // North transept
        makeBox(14, 22, 18, 0xD4C9B0, -74, 11, -48);
        makeCone(6, 8, 4, 0xC0B8A0, -74, 24, -48);

        // South transept
        makeBox(14, 22, 18, 0xD4C9B0, -46, 11, -48);
        makeCone(6, 8, 4, 0xC0B8A0, -46, 24, -48);

        // Percy Canopy tomb - ornate 14th century structure inside (visible through arch)
        makeBox(4, 6, 4, 0xC8B89A, -60, 3, -70);
        makeCone(2, 4, 6, 0xB8A888, -60, 8, -70);

        // Lancet windows - chancel Early English
        makeBox(1.5, 8, 0.5, 0x6a7a9a, -54, 10, -90);
        makeBox(1.5, 8, 0.5, 0x6a7a9a, -56, 10, -90);
        makeBox(1.5, 8, 0.5, 0x6a7a9a, -64, 10, -90);
        makeBox(1.5, 8, 0.5, 0x6a7a9a, -66, 10, -90);

        // Nave buttresses (flying)
        makeBox(2, 14, 4, 0xC8BEA8, -72, 7, -30);
        makeBox(2, 14, 4, 0xC8BEA8, -72, 7, -45);
        makeBox(2, 14, 4, 0xC8BEA8, -48, 7, -30);
        makeBox(2, 14, 4, 0xC8BEA8, -48, 7, -45);

        // Graveyard boundary wall
        makeBox(80, 2, 1, 0xBBB0A0, -60, 1, -5);
        makeBox(1, 2, 100, 0xBBB0A0, -20, 1, -55);
        makeBox(1, 2, 100, 0xBBB0A0, -100, 1, -55);

        // Georgian nave furniture - pew blocks (restored 18th century)
        makeBox(6, 1.5, 2, 0x8B6914, -56, 0.75, -40);
        makeBox(6, 1.5, 2, 0x8B6914, -64, 0.75, -40);
        makeBox(6, 1.5, 2, 0x8B6914, -56, 0.75, -50);
        makeBox(6, 1.5, 2, 0x8B6914, -64, 0.75, -50);
    }

    function buildNorthBar() {
        // North Bar - red brick medieval gate, one of two surviving in England
        // Main gate arch body
        makeBox(10, 14, 6, 0xCD5C5C, 0, 7, -120);
        // Gate arch opening (dark box to simulate tunnel)
        makeBox(4, 8, 7, 0x2a2a2a, 0, 4, -120);
        // Upper storey / battlements level
        makeBox(10, 4, 6, 0xB84040, 0, 16, -120);
        // Merlons (battlement teeth) north bar
        makeBox(2, 2, 1, 0xCD5C5C, -3, 19, -117);
        makeBox(2, 2, 1, 0xCD5C5C, 0, 19, -117);
        makeBox(2, 2, 1, 0xCD5C5C, 3, 19, -117);
        // Side walls of gate passage
        makeBox(2, 14, 6, 0xBB5050, -6, 7, -120);
        makeBox(2, 14, 6, 0xBB5050, 6, 7, -120);
        // Window in upper storey
        makeBox(2, 3, 0.5, 0x6a6a8a, -2, 17, -117);
        makeBox(2, 3, 0.5, 0x6a6a8a, 2, 17, -117);
        // Gate road approach
        makeBox(6, 0.5, 40, 0x777777, 0, 0.25, -140);
    }

    function buildSaturdayMarket() {
        // Saturday Market - grand market place with market cross and Georgian market hall
        // Market place open ground
        makeBox(60, 0.5, 50, 0xCCBB99, 80, 0.25, 10);

        // Market Cross - central monument
        makeCyl(0.4, 0.6, 10, 6, 0xEEE8D0, 80, 5, 10);
        makeSphere(1.2, 8, 6, 0xDDD0B0, 80, 11, 10);

        // Georgian Market Hall - imposing civic building
        makeBox(24, 12, 16, 0xD4C9B0, 80, 6, 30);
        // Market hall roof - hipped
        makeBox(22, 4, 14, 0xC0B8A0, 80, 14, 30);
        // Market hall columns (portico)
        makeCyl(0.5, 0.5, 10, 8, 0xE8E0C8, 70, 5, 24);
        makeCyl(0.5, 0.5, 10, 8, 0xE8E0C8, 74, 5, 24);
        makeCyl(0.5, 0.5, 10, 8, 0xE8E0C8, 78, 5, 24);
        makeCyl(0.5, 0.5, 10, 8, 0xE8E0C8, 82, 5, 24);
        // Market hall pediment
        makeBox(24, 4, 2, 0xD4C9B0, 80, 15, 24);
        // Market hall windows
        makeBox(3, 5, 0.5, 0x6a7a9a, 72, 7, 22);
        makeBox(3, 5, 0.5, 0x6a7a9a, 80, 7, 22);
        makeBox(3, 5, 0.5, 0x6a7a9a, 88, 7, 22);

        // Market stall structures (wooden frames)
        makeBox(4, 3, 4, 0x8B7355, 65, 1.5, 10);
        makeBox(4, 3, 4, 0x8B7355, 65, 1.5, 20);
        makeBox(4, 3, 4, 0x8B7355, 95, 1.5, 10);
        makeBox(4, 3, 4, 0x8B7355, 95, 1.5, 20);
    }

    function buildStMarysChurch() {
        // St Mary's Church - second medieval church, 15th-century nave ceiling
        makeBox(16, 14, 40, 0xD4C9B0, 40, 7, -60);
        // Nave roof
        makeCone(8, 6, 4, 0xC0B8A0, 40, 18, -60);
        // West tower
        makeBox(8, 24, 8, 0xD4C9B0, 40, 12, -42);
        makeCyl(1, 3, 6, 8, 0xC0B8A0, 40, 27, -42);
        makeCone(3, 8, 8, 0xC0B8A0, 40, 33, -42);
        // Chancel
        makeBox(10, 12, 16, 0xD4C9B0, 40, 6, -80);
        makeCone(5, 6, 4, 0xC0B8A0, 40, 14, -80);
        // 15th century nave ceiling detail (decorative box inside)
        makeBox(14, 1, 36, 0xA8905A, 40, 14, -60);
        // Church windows
        makeBox(2, 6, 0.5, 0x6a7a9a, 33, 9, -58);
        makeBox(2, 6, 0.5, 0x6a7a9a, 33, 9, -65);
        makeBox(2, 6, 0.5, 0x6a7a9a, 47, 9, -58);
        // Church wall/boundary
        makeBox(60, 1.5, 1, 0xBBB0A0, 40, 0.75, -40);
    }

    function buildGuildhall() {
        // 18th-century Georgian civic Guildhall
        makeBox(18, 12, 14, 0xD4C9B0, 120, 6, -10);
        // Guildhall roof with parapet
        makeBox(18, 2, 14, 0xC8C0B0, 120, 13, -10);
        makeBox(18, 1, 2, 0xC0B8A8, 120, 14, -17);
        makeBox(18, 1, 2, 0xC0B8A8, 120, 14, -3);
        // Columns
        makeCyl(0.5, 0.5, 10, 8, 0xE8E0C8, 114, 5, -17);
        makeCyl(0.5, 0.5, 10, 8, 0xE8E0C8, 118, 5, -17);
        makeCyl(0.5, 0.5, 10, 8, 0xE8E0C8, 122, 5, -17);
        makeCyl(0.5, 0.5, 10, 8, 0xE8E0C8, 126, 5, -17);
        // Guildhall windows - Georgian sash style
        makeBox(3, 5, 0.5, 0x6a7a9a, 112, 8, -17);
        makeBox(3, 5, 0.5, 0x6a7a9a, 120, 8, -17);
        makeBox(3, 5, 0.5, 0x6a7a9a, 128, 8, -17);
        // Door
        makeBox(3, 6, 0.6, 0x5a4a2a, 120, 3, -17);
        // Cupola on top
        makeCyl(2, 3, 4, 8, 0xD0C8B8, 120, 16, -10);
        makeSphere(1.5, 8, 6, 0xC8C0B0, 120, 19, -10);
    }

    function buildFriaryRuins() {
        // Dominican Friary ruins in parkland - 0x8B7355 brown stone
        // Ruined nave wall - partial standing
        makeBox(20, 8, 1.5, 0x8B7355, -20, 4, 80);
        // Broken wall section (lower, ruined)
        makeBox(8, 4, 1.5, 0x7A6545, -35, 2, 80);
        // Transept ruin stub
        makeBox(1.5, 6, 12, 0x8B7355, -10, 3, 74);
        // Arch remnant - box approximation
        makeBox(6, 10, 1.5, 0x8B7355, -20, 5, 68);
        makeBox(2, 10, 1.5, 0x7A6545, -14, 5, 68);
        // Scattered rubble
        makeBox(2, 1, 2, 0x8B7355, -25, 0.5, 76);
        makeBox(1.5, 0.8, 1.5, 0x8B7355, -18, 0.4, 84);
        makeBox(3, 1.2, 2, 0x7A6545, -30, 0.6, 88);
        // Friary parkland grass
        makeBox(60, 0.3, 50, 0x3d6b30, -20, 0.15, 80);
        // Trees in parkland
        makeCyl(0.5, 0.5, 7, 6, 0x5a3a20, -28, 3.5, 75);
        makeSphere(4, 6, 5, 0x2d6a20, -28, 9, 75);
        makeCyl(0.5, 0.5, 7, 6, 0x5a3a20, -10, 3.5, 90);
        makeSphere(4, 6, 5, 0x2d6a20, -10, 9, 90);
    }

    function buildBeverleyBeck() {
        // Beverley Beck - canal arm linking to Humber
        // Canal channel (water surface as thin blue box)
        makeBox(10, 0.4, 120, 0x006994, 160, 0.2, 20);
        // Canal banks - earthen
        makeBox(3, 1.5, 120, 0x6B8C5A, 154, 0.75, 20);
        makeBox(3, 1.5, 120, 0x6B8C5A, 166, 0.75, 20);
        // Wharf buildings along beck
        makeBox(8, 6, 10, 0xB8855A, 148, 3, -10);
        makeBox(6, 5, 8, 0xB8855A, 148, 2.5, 5);
        // Warehouse
        makeBox(12, 9, 16, 0x8B6A4A, 148, 4.5, 25);
        makeBox(12, 3, 16, 0x7A5A3A, 148, 10, 25);
        // Lock gates - simple box approximation
        makeBox(4, 3, 1.5, 0x5a3a1a, 160, 1.5, -20);
        makeBox(4, 3, 1.5, 0x5a3a1a, 160, 1.5, -18);
        // Moored boat (barge shape)
        makeBox(12, 2, 4, 0x3a5a8a, 162, 1, 10);
        makeBox(10, 1, 2, 0x2a4a7a, 162, 2.5, 10);
    }

    function buildWestwoodCommon() {
        // Westwood Common - open land, racecourse, grazing cattle
        // Common ground
        makeBox(150, 0.4, 100, 0x4a7c3f, -150, 0.2, 60);
        // Racecourse rail - long thin boxes forming oval
        makeBox(100, 1, 1.2, 0xFFFFFF, -150, 0.5, 20);
        makeBox(100, 1, 1.2, 0xFFFFFF, -150, 0.5, 100);
        makeBox(1.2, 1, 80, 0xFFFFFF, -200, 0.5, 60);
        makeBox(1.2, 1, 80, 0xFFFFFF, -100, 0.5, 60);
        // Grandstand basic structure
        makeBox(30, 8, 10, 0xE8DDB8, -150, 4, 18);
        makeBox(30, 3, 8, 0xD8CDA8, -150, 9, 16);
        // Grandstand roof
        makeBox(32, 1.5, 10, 0xC8BDA8, -150, 11, 16);
        // Cattle on common (simple sphere + box animals)
        makeSphere(1.5, 6, 4, 0x8B7355, -130, 1.5, 70);
        makeBox(2.5, 1.5, 1, 0x8B7355, -130, 1, 72);
        makeSphere(1.5, 6, 4, 0x7a6345, -120, 1.5, 75);
        makeBox(2.5, 1.5, 1, 0x7a6345, -120, 1, 77);
        makeSphere(1.5, 6, 4, 0x8B7355, -140, 1.5, 85);
        makeBox(2.5, 1.5, 1, 0x8B7355, -140, 1, 87);
        // Windmill on common (historic feature)
        makeCyl(1, 3, 20, 8, 0xD4C9B0, -170, 10, 50);
        makeBox(2, 1, 12, 0x8B7355, -170, 19, 50);
        makeBox(12, 1, 2, 0x8B7355, -170, 19, 50);
        // Trees along common edge
        makeCyl(0.6, 0.6, 8, 6, 0x5a3a20, -100, 4, 65);
        makeSphere(5, 6, 5, 0x2d6a20, -100, 10, 65);
        makeCyl(0.6, 0.6, 8, 6, 0x5a3a20, -105, 4, 80);
        makeSphere(5, 6, 5, 0x2d6a20, -105, 10, 80);
    }

    function buildGeorgianTownhouses() {
        // Elegant Georgian houses lining Register Square - 0xF5F0E8
        // Register Square terrace - east side
        makeBox(8, 12, 10, 0xF5F0E8, 100, 6, -50);
        makeBox(8, 12, 10, 0xF5F0E8, 110, 6, -50);
        makeBox(8, 12, 10, 0xF5F0E8, 120, 6, -50);
        makeBox(8, 12, 10, 0xF5F0E8, 130, 6, -50);
        // Roofs
        makeBox(8, 3, 10, 0xE0DAC8, 100, 13, -50);
        makeBox(8, 3, 10, 0xE0DAC8, 110, 13, -50);
        makeBox(8, 3, 10, 0xE0DAC8, 120, 13, -50);
        makeBox(8, 3, 10, 0xE0DAC8, 130, 13, -50);
        // Sash windows on each house
        makeBox(2, 3, 0.5, 0x6a8aaa, 97, 9, -45);
        makeBox(2, 3, 0.5, 0x6a8aaa, 103, 9, -45);
        makeBox(2, 3, 0.5, 0x6a8aaa, 107, 9, -45);
        makeBox(2, 3, 0.5, 0x6a8aaa, 113, 9, -45);
        makeBox(2, 3, 0.5, 0x6a8aaa, 117, 9, -45);
        makeBox(2, 3, 0.5, 0x6a8aaa, 123, 9, -45);
        // Doors with fanlights
        makeBox(1.8, 5, 0.6, 0x3a2a1a, 100, 2.5, -45);
        makeBox(1.8, 5, 0.6, 0x3a2a1a, 110, 2.5, -45);
        makeBox(1.8, 5, 0.6, 0x3a2a1a, 120, 2.5, -45);
        makeBox(1.8, 5, 0.6, 0x3a2a1a, 130, 2.5, -45);
        // Fanlight above doors
        makeSphere(1, 6, 4, 0x6a9aba, 100, 6, -45);
        makeSphere(1, 6, 4, 0x6a9aba, 110, 6, -45);
        makeSphere(1, 6, 4, 0x6a9aba, 120, 6, -45);
        // Register Square central garden
        makeBox(20, 0.4, 20, 0x3d7a30, 115, 0.2, -30);
        makeCyl(0.3, 0.3, 6, 6, 0x5a3a20, 115, 3, -30);
        makeSphere(4, 6, 5, 0x2d6a20, 115, 8, -30);
        // Pavement / path
        makeBox(8, 0.4, 40, 0xC8C0B0, 96, 0.2, -50);
        makeBox(8, 0.4, 40, 0xC8C0B0, 140, 0.2, -50);
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
