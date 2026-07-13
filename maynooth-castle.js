window.MaynoothCastle = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 19040;
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

    function makeMat(hex, opts) {
        var params = { color: hex };
        if (opts) {
            for (var k in opts) {
                if (opts.hasOwnProperty(k)) params[k] = opts[k];
            }
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function box(w, h, d, hex, x, y, z, opts) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(hex, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function cyl(rTop, rBot, h, segs, hex, x, y, z, opts) {
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
        var mat = makeMat(hex, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, hex, x, y, z, opts) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(hex, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function sphere(r, ws, hs, hex, x, y, z, opts) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(hex, opts);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildMaynoothCastle();
        buildGatehouse();
        buildBawnWalls();
        buildUniversityMainBuildings();
        buildStPatricksCollege();
        buildStPatricksChapel();
        buildStoytHouse();
        buildCartonHouse();
        buildTownMainStreet();
        buildTrainStation();
        buildRiverLiffey();
        buildRoyalCanal();
        buildUniversityQuad();
        buildTrees();
    }

    // -------------------------------------------------------------------------
    // Ground plane approximation using a flat box
    // -------------------------------------------------------------------------
    function buildGround() {
        box(600, 1, 600, 0x4A7C59, 0, -0.5, 0);
        // Road surface — main street
        box(300, 0.6, 18, 0x555555, 0, 0.1, 30);
        // Footpaths
        box(300, 0.6, 4, 0xAAAAAA, 0, 0.1, 21);
        box(300, 0.6, 4, 0xAAAAAA, 0, 0.1, 39);
    }

    // -------------------------------------------------------------------------
    // Maynooth Castle — FitzGerald ruined keep (0x808080)
    // -------------------------------------------------------------------------
    function buildMaynoothCastle() {
        // Main keep — tall ruined tower
        box(18, 28, 18, 0x808080, -120, 14, -80);

        // Battlemented top — series of merlons around perimeter
        // North face merlons
        box(4, 4, 2, 0x808080, -126, 30, -71);
        box(4, 4, 2, 0x808080, -120, 30, -71);
        box(4, 4, 2, 0x808080, -114, 30, -71);
        // South face merlons
        box(4, 4, 2, 0x808080, -126, 30, -89);
        box(4, 4, 2, 0x808080, -120, 30, -89);
        box(4, 4, 2, 0x808080, -114, 30, -89);
        // East face merlons
        box(2, 4, 4, 0x808080, -111, 30, -83);
        box(2, 4, 4, 0x808080, -111, 30, -77);
        // West face merlons
        box(2, 4, 4, 0x808080, -129, 30, -83);
        box(2, 4, 4, 0x808080, -129, 30, -77);

        // Ruined interior wall stubs (broken walls)
        box(18, 12, 2, 0x707070, -120, 6, -80);
        box(2, 20, 10, 0x707070, -130, 10, -80);

        // Keep base rubble
        box(22, 2, 22, 0x666666, -120, 1, -80);

        // Window embrasures
        box(2, 3, 1, 0x333333, -111, 14, -80);
        box(2, 3, 1, 0x333333, -111, 20, -80);
        box(1, 3, 2, 0x333333, -120, 18, -71);
    }

    // -------------------------------------------------------------------------
    // Gatehouse — two flanking box towers
    // -------------------------------------------------------------------------
    function buildGatehouse() {
        // Left tower
        box(8, 16, 8, 0x808080, -104, 8, -80);
        // Right tower
        box(8, 16, 8, 0x808080, -96, 8, -80);
        // Gate arch lintel
        box(8, 3, 3, 0x707070, -100, 10, -77);
        // Gate passage floor
        box(8, 1, 8, 0x555555, -100, 0.5, -80);
        // Left tower battlements
        box(3, 3, 2, 0x808080, -104, 17, -76);
        box(3, 3, 2, 0x808080, -104, 17, -84);
        // Right tower battlements
        box(3, 3, 2, 0x808080, -96, 17, -76);
        box(3, 3, 2, 0x808080, -96, 17, -84);
        // Connecting curtain wall fragment
        box(16, 10, 2, 0x808080, -112, 5, -72);
    }

    // -------------------------------------------------------------------------
    // Bawn walls — enclosure wall fragments
    // -------------------------------------------------------------------------
    function buildBawnWalls() {
        // North bawn wall
        box(60, 5, 2, 0x808080, -120, 2.5, -68);
        // South bawn wall (partial ruin)
        box(40, 5, 2, 0x808080, -130, 2.5, -92);
        // West bawn wall
        box(2, 5, 26, 0x808080, -150, 2.5, -80);
        // Corner tower stump
        box(6, 8, 6, 0x808080, -150, 4, -68);
    }

    // -------------------------------------------------------------------------
    // Maynooth University — Gothic collegiate buildings (0x8B7355)
    // -------------------------------------------------------------------------
    function buildUniversityMainBuildings() {
        // North wing — long Gothic range
        box(80, 14, 12, 0x8B7355, -20, 7, -120);
        // North wing slate roof
        box(82, 5, 14, 0x2F4F4F, -20, 16.5, -120);

        // South wing
        box(80, 14, 12, 0x8B7355, -20, 7, -160);
        box(82, 5, 14, 0x2F4F4F, -20, 16.5, -160);

        // East connecting range (closes quad)
        box(12, 14, 52, 0x8B7355, 20, 7, -140);
        box(14, 5, 54, 0x2F4F4F, 20, 16.5, -140);

        // West connecting range with central archway
        box(5, 14, 18, 0x8B7355, -60, 7, -130);
        box(5, 14, 18, 0x8B7355, -60, 7, -150);
        // Archway lintel
        box(5, 3, 4, 0x7A6545, -60, 9, -140);
        box(7, 5, 56, 0x2F4F4F, -60, 16.5, -140);

        // Gothic tower — square bell tower
        box(10, 26, 10, 0x8B7355, -60, 13, -120);
        box(12, 4, 12, 0x2F4F4F, -60, 28, -120);
        // Tower pinnacles
        cone(1.5, 5, 4, 0x2F4F4F, -56, 32, -116);
        cone(1.5, 5, 4, 0x2F4F4F, -64, 32, -116);
        cone(1.5, 5, 4, 0x2F4F4F, -56, 32, -124);
        cone(1.5, 5, 4, 0x2F4F4F, -64, 32, -124);

        // Gothic window tracery blocks
        box(3, 5, 1, 0x6B5335, -20, 10, -114);
        box(3, 5, 1, 0x6B5335, -30, 10, -114);
        box(3, 5, 1, 0x6B5335, -10, 10, -114);
    }

    // -------------------------------------------------------------------------
    // St Patrick's College seminary buildings
    // -------------------------------------------------------------------------
    function buildStPatricksCollege() {
        // Main seminary range
        box(70, 16, 14, 0x9B8365, 80, 8, -130);
        box(72, 5, 16, 0x2F4F4F, 80, 19, -130);

        // Secondary range
        box(40, 12, 12, 0x9B8365, 80, 6, -155);
        box(42, 4, 14, 0x2F4F4F, 80, 14, -155);

        // College entrance portico
        box(16, 18, 6, 0x8B7355, 80, 9, -123);
        box(18, 4, 8, 0x2F4F4F, 80, 20, -123);

        // Colonnaded portico pillars
        cyl(1, 1, 12, 8, 0xD4C9B0, 74, 6, -123);
        cyl(1, 1, 12, 8, 0xD4C9B0, 78, 6, -123);
        cyl(1, 1, 12, 8, 0xD4C9B0, 82, 6, -123);
        cyl(1, 1, 12, 8, 0xD4C9B0, 86, 6, -123);
    }

    // -------------------------------------------------------------------------
    // St Patrick's College Chapel — Gothic with ConeGeometry spire
    // -------------------------------------------------------------------------
    function buildStPatricksChapel() {
        // Nave
        box(20, 18, 50, 0x8B7355, 50, 9, -145);
        // Chancel
        box(14, 16, 18, 0x8B7355, 50, 8, -120);
        // Transepts
        box(40, 14, 14, 0x8B7355, 50, 7, -140);

        // Slate roofs
        box(22, 6, 52, 0x2F4F4F, 50, 21, -145);
        box(16, 5, 20, 0x2F4F4F, 50, 20, -120);
        box(42, 5, 16, 0x2F4F4F, 50, 19, -140);

        // West tower base
        box(10, 30, 10, 0x8B7355, 50, 15, -168);
        box(12, 4, 12, 0x2F4F4F, 50, 32, -168);

        // Spire — tall ConeGeometry
        cone(5, 40, 8, 0x2F4F4F, 50, 56, -168);

        // Pinnacles flanking tower
        cone(1.5, 8, 4, 0x2F4F4F, 44, 38, -168);
        cone(1.5, 8, 4, 0x2F4F4F, 56, 38, -168);
        cone(1.5, 8, 4, 0x2F4F4F, 50, 38, -162);
        cone(1.5, 8, 4, 0x2F4F4F, 50, 38, -174);

        // Rose window circle (sphere approximation on facade)
        sphere(3, 8, 8, 0x8B6355, 50, 18, -172);

        // Buttresses
        box(3, 16, 4, 0x7A6545, 44, 8, -135);
        box(3, 16, 4, 0x7A6545, 56, 8, -135);
        box(3, 16, 4, 0x7A6545, 44, 8, -150);
        box(3, 16, 4, 0x7A6545, 56, 8, -150);
    }

    // -------------------------------------------------------------------------
    // Stoyte House — Georgian mansion 0xF5F0E8
    // -------------------------------------------------------------------------
    function buildStoytHouse() {
        // Main block
        box(36, 14, 18, 0xF5F0E8, -40, 7, -145);
        // Hipped roof
        box(38, 5, 20, 0x8B7355, -40, 16.5, -145);
        // Pediment / central feature
        box(12, 4, 1, 0xF5F0E8, -40, 18, -135);
        // Chimneys
        box(2, 5, 2, 0xCC9977, -47, 21, -145);
        box(2, 5, 2, 0xCC9977, -33, 21, -145);
        // Sash windows (dark recesses)
        box(3, 4, 1, 0x222233, -48, 10, -135);
        box(3, 4, 1, 0x222233, -40, 10, -135);
        box(3, 4, 1, 0x222233, -32, 10, -135);
        // Doorcase
        box(4, 6, 1, 0xFFFFFF, -40, 5, -135);
        // Wings
        box(10, 10, 14, 0xF5F0E8, -58, 5, -145);
        box(10, 10, 14, 0xF5F0E8, -22, 5, -145);
        box(12, 3, 16, 0x8B7355, -58, 11.5, -145);
        box(12, 3, 16, 0x8B7355, -22, 11.5, -145);
    }

    // -------------------------------------------------------------------------
    // Carton House — distant Georgian Palladian mansion
    // -------------------------------------------------------------------------
    function buildCartonHouse() {
        // Main house block (distant, small)
        box(50, 12, 20, 0xF5F0E8, 180, 6, -200);
        box(52, 4, 22, 0x8B7355, 180, 14, -200);
        // Colonnaded wings
        box(20, 8, 16, 0xF5F0E8, 140, 4, -200);
        box(20, 8, 16, 0xF5F0E8, 220, 4, -200);
        box(22, 3, 18, 0x8B7355, 140, 9.5, -200);
        box(22, 3, 18, 0x8B7355, 220, 9.5, -200);
        // Parkland trees
        cyl(0, 4, 14, 6, 0x228B22, 160, 7, -185);
        cyl(0, 4, 14, 6, 0x228B22, 200, 7, -185);
        cyl(0, 4, 14, 6, 0x228B22, 170, 7, -215);
        cyl(0, 4, 14, 6, 0x228B22, 190, 7, -215);
        // Ha-ha wall
        box(100, 2, 2, 0xAAAAAA, 180, 1, -180);
    }

    // -------------------------------------------------------------------------
    // Maynooth town main street — Georgian buildings 0xCD5C5C, shopfronts
    // -------------------------------------------------------------------------
    function buildTownMainStreet() {
        // North side terrace block A
        box(50, 12, 10, 0xCD5C5C, -60, 6, 16);
        box(52, 4, 12, 0xAA4444, -60, 14, 16);
        // North side terrace block B
        box(50, 12, 10, 0xBB5544, -10, 6, 16);
        box(52, 4, 12, 0x996644, -10, 14, 16);
        // North side terrace block C
        box(50, 12, 10, 0xCC7766, 40, 6, 16);
        box(52, 4, 12, 0xAA5533, 40, 14, 16);

        // South side terrace block A
        box(50, 12, 10, 0xCC6655, -60, 6, 44);
        box(52, 4, 12, 0x9B4444, -60, 14, 44);
        // South side terrace block B
        box(50, 12, 10, 0xDD8877, -10, 6, 44);
        box(52, 4, 12, 0xBB5533, -10, 14, 44);
        // South side terrace block C
        box(50, 12, 10, 0xBB5544, 40, 6, 44);
        box(52, 4, 12, 0x9B4433, 40, 14, 44);

        // Colourful shopfronts on ground floor
        box(10, 4, 1, 0x2255AA, -75, 3, 11);
        box(10, 4, 1, 0xAA2222, -63, 3, 11);
        box(10, 4, 1, 0x229933, -51, 3, 11);
        box(10, 4, 1, 0xCC8800, -15, 3, 11);
        box(10, 4, 1, 0x884499, 35, 3, 11);
        box(10, 4, 1, 0x336699, 47, 3, 11);

        // Town hall / market house
        box(24, 16, 18, 0xF5F0E8, 100, 8, 30);
        box(26, 4, 20, 0x8B7355, 100, 18, 30);
        cyl(2, 2, 20, 8, 0xF5F0E8, 100, 10, 30);
        cone(3, 8, 8, 0x2F4F4F, 100, 24, 30);

        // St Mary's Church of Ireland
        box(16, 14, 30, 0xA09080, 80, 7, 55);
        cone(5, 18, 4, 0x8B7355, 80, 22, 55);
        box(6, 20, 6, 0xA09080, 80, 10, 68);
        cone(3, 10, 4, 0x8B7355, 80, 25, 68);

        // Pub / hotel block
        box(22, 11, 10, 0x335533, -90, 5.5, 16);
        box(24, 3, 12, 0x224422, -90, 13, 16);

        // Chimneys on terraces
        box(2, 4, 2, 0xCC9977, -60, 16, 16);
        box(2, 4, 2, 0xCC9977, -10, 16, 16);
        box(2, 4, 2, 0xCC9977, 40, 16, 16);
        box(2, 4, 2, 0xCC9977, -60, 16, 44);
        box(2, 4, 2, 0xCC9977, 40, 16, 44);
    }

    // -------------------------------------------------------------------------
    // Maynooth Train Station — Victorian red brick
    // -------------------------------------------------------------------------
    function buildTrainStation() {
        // Station building
        box(30, 8, 12, 0xCD5C5C, 140, 4, 60);
        box(32, 3, 14, 0x8B4444, 140, 9.5, 60);
        // Canopy / platform awning
        box(40, 1, 8, 0x888888, 140, 7, 54);
        // Platform
        box(50, 1, 6, 0xAAAAAA, 140, 0.5, 52);
        // Rail tracks (dark strips)
        box(100, 0.3, 2, 0x333333, 140, 0.2, 48);
        box(100, 0.3, 2, 0x333333, 140, 0.2, 44);
        // Station entrance feature
        box(10, 10, 2, 0xCD5C5C, 140, 5, 54);
        // Chimney stacks
        box(2, 5, 2, 0xBB4444, 133, 13, 60);
        box(2, 5, 2, 0xBB4444, 147, 13, 60);
        // Station name board approximation
        box(12, 2, 1, 0xFFFFFF, 140, 7, 54);
        // Signal box
        box(8, 7, 8, 0xCD5C5C, 168, 3.5, 58);
        box(9, 2, 9, 0x666666, 168, 7.5, 58);
    }

    // -------------------------------------------------------------------------
    // River Liffey — 0x006994 blue box strips
    // -------------------------------------------------------------------------
    function buildRiverLiffey() {
        // River course
        box(300, 0.4, 14, 0x006994, 0, 0.2, -30);
        // Stone bridges
        box(20, 2, 16, 0x888888, -80, 1, -30);
        box(20, 2, 16, 0x888888, 60, 1, -30);
        // Bridge parapets
        box(20, 2, 1, 0x999999, -80, 2.5, -23);
        box(20, 2, 1, 0x999999, -80, 2.5, -37);
        box(20, 2, 1, 0x999999, 60, 2.5, -23);
        box(20, 2, 1, 0x999999, 60, 2.5, -37);
        // Riverbank gravel
        box(300, 0.4, 4, 0x9B8865, 0, 0.2, -23);
        box(300, 0.4, 4, 0x9B8865, 0, 0.2, -37);
    }

    // -------------------------------------------------------------------------
    // Royal Canal — 0x006994 with towpath and lock gates
    // -------------------------------------------------------------------------
    function buildRoyalCanal() {
        // Canal waterway
        box(300, 0.4, 10, 0x006994, 0, 0.2, -60);
        // Towpath
        box(300, 0.5, 6, 0xBBAA88, 0, 0.25, -52);
        // Canal bank edging
        box(300, 1, 1, 0x888888, 0, 0.5, -55);
        box(300, 1, 1, 0x888888, 0, 0.5, -65);
        // Lock gates (BoxGeometry pair)
        box(1, 4, 5, 0x5C3317, -150, 2, -60);
        box(1, 4, 5, 0x5C3317, -148, 2, -60);
        box(1, 4, 5, 0x5C3317, 150, 2, -60);
        box(1, 4, 5, 0x5C3317, 148, 2, -60);
        // Lock chamber walls
        box(2, 5, 12, 0x888888, -149, 2.5, -60);
        box(2, 5, 12, 0x888888, 149, 2.5, -60);
        // Lock keeper's cottage
        box(10, 7, 8, 0xFFEEDD, 155, 3.5, -52);
        box(12, 3, 10, 0xCC4444, 155, 8.5, -52);
        box(1.5, 4, 1.5, 0xCC9977, 153, 12, -52);
        // Canal boat approximation
        box(18, 3, 5, 0x2244BB, -50, 1.5, -60);
        box(5, 3, 5, 0xDD3333, -50, 3, -55);
    }

    // -------------------------------------------------------------------------
    // University quadrangle — green lawn, benches, paths
    // -------------------------------------------------------------------------
    function buildUniversityQuad() {
        // Quad lawn
        box(48, 0.4, 48, 0x228B22, -20, 0.2, -140);
        // Quad paths (gravel)
        box(48, 0.5, 3, 0xCCBB99, -20, 0.25, -140);
        box(3, 0.5, 48, 0xCCBB99, -20, 0.25, -140);
        // Central feature / sundial plinth
        box(3, 1.5, 3, 0xCCCCCC, -20, 0.75, -140);
        cyl(0.3, 0.3, 2, 6, 0x888888, -20, 2.5, -140);
        // Benches
        box(4, 0.4, 1.2, 0x5C3317, -30, 0.8, -128);
        box(4, 0.4, 1.2, 0x5C3317, -10, 0.8, -128);
        box(4, 0.4, 1.2, 0x5C3317, -30, 0.8, -152);
        box(4, 0.4, 1.2, 0x5C3317, -10, 0.8, -152);
        // Bench legs
        box(0.5, 1.2, 1.2, 0x5C3317, -32, 0.6, -128);
        box(0.5, 1.2, 1.2, 0x5C3317, -28, 0.6, -128);
        box(0.5, 1.2, 1.2, 0x5C3317, -12, 0.6, -128);
        box(0.5, 1.2, 1.2, 0x5C3317, -8, 0.6, -128);
    }

    // -------------------------------------------------------------------------
    // Trees — CylinderGeometry trunks and SphereGeometry canopies
    // -------------------------------------------------------------------------
    function buildTrees() {
        // Castle grounds trees
        cyl(0.4, 0.6, 5, 6, 0x5C3317, -150, 2.5, -65);
        sphere(3, 7, 7, 0x228B22, -150, 7, -65);
        cyl(0.4, 0.6, 5, 6, 0x5C3317, -145, 2.5, -100);
        sphere(3, 7, 7, 0x2E8B22, -145, 7, -100);
        cyl(0.4, 0.6, 6, 6, 0x5C3317, -100, 3, -65);
        sphere(4, 7, 7, 0x228B22, -100, 8, -65);

        // University avenue trees
        cyl(0.4, 0.6, 7, 6, 0x5C3317, -70, 3.5, -108);
        sphere(4, 7, 7, 0x228B22, -70, 9, -108);
        cyl(0.4, 0.6, 7, 6, 0x5C3317, -60, 3.5, -108);
        sphere(4, 7, 7, 0x228B22, -60, 9, -108);
        cyl(0.4, 0.6, 7, 6, 0x5C3317, -50, 3.5, -108);
        sphere(4, 7, 7, 0x228B22, -50, 9, -108);
        cyl(0.4, 0.6, 7, 6, 0x5C3317, -40, 3.5, -108);
        sphere(4, 7, 7, 0x228B22, -40, 9, -108);

        // Town street trees
        cyl(0.3, 0.4, 5, 6, 0x5C3317, -80, 2.5, 22);
        sphere(2.5, 7, 7, 0x228B22, -80, 6.5, 22);
        cyl(0.3, 0.4, 5, 6, 0x5C3317, -40, 2.5, 22);
        sphere(2.5, 7, 7, 0x228B22, -40, 6.5, 22);
        cyl(0.3, 0.4, 5, 6, 0x5C3317, 20, 2.5, 22);
        sphere(2.5, 7, 7, 0x228B22, 20, 6.5, 22);
        cyl(0.3, 0.4, 5, 6, 0x5C3317, 60, 2.5, 22);
        sphere(2.5, 7, 7, 0x228B22, 60, 6.5, 22);

        // Canal towpath trees
        cyl(0.4, 0.5, 6, 6, 0x5C3317, -120, 3, -52);
        sphere(3, 7, 7, 0x228B22, -120, 7, -52);
        cyl(0.4, 0.5, 6, 6, 0x5C3317, -80, 3, -52);
        sphere(3, 7, 7, 0x228B22, -80, 7, -52);
        cyl(0.4, 0.5, 6, 6, 0x5C3317, -40, 3, -52);
        sphere(3, 7, 7, 0x228B22, -40, 7, -52);
        cyl(0.4, 0.5, 6, 6, 0x5C3317, 0, 3, -52);
        sphere(3, 7, 7, 0x228B22, 0, 7, -52);
        cyl(0.4, 0.5, 6, 6, 0x5C3317, 40, 3, -52);
        sphere(3, 7, 7, 0x228B22, 40, 7, -52);
        cyl(0.4, 0.5, 6, 6, 0x5C3317, 80, 3, -52);
        sphere(3, 7, 7, 0x228B22, 80, 7, -52);
    }

    function update(delta) {
        // no per-frame animation required
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
