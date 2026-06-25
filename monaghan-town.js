window.MonaghanTown = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18560;
    var OY = 0;
    var OZ = 0;

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function buildCathedral() {
        // St Macartan's Cathedral - neo-Gothic 0x808080
        // Main nave
        makeBox(18, 14, 40, 0x808080, -60, 7, 0);
        // Chancel (east end)
        makeBox(12, 12, 16, 0x808080, -60, 6, -26);
        // Crossing tower base
        makeBox(10, 20, 10, 0x808080, -60, 10, -4);
        // Crossing tower upper
        makeBox(8, 10, 8, 0x757575, -60, 22, -4);
        // Twin west spires - left
        makeCone(2.5, 22, 4, 0x696969, -68, 30, 22);
        makeBox(5, 14, 5, 0x808080, -68, 16, 22);
        // Twin west spires - right
        makeCone(2.5, 22, 4, 0x696969, -52, 30, 22);
        makeBox(5, 14, 5, 0x808080, -52, 16, 22);
        // Flying buttresses left side
        makeBox(1.2, 1.2, 7, 0x909090, -72, 11, 4);
        makeBox(1.2, 1.2, 7, 0x909090, -72, 11, -4);
        makeBox(1.2, 1.2, 7, 0x909090, -72, 11, -12);
        // Flying buttresses right side
        makeBox(1.2, 1.2, 7, 0x909090, -48, 11, 4);
        makeBox(1.2, 1.2, 7, 0x909090, -48, 11, -4);
        makeBox(1.2, 1.2, 7, 0x909090, -48, 11, -12);
        // Buttress piers left
        makeBox(2, 10, 2, 0x808080, -72, 5, 4);
        makeBox(2, 10, 2, 0x808080, -72, 5, -4);
        makeBox(2, 10, 2, 0x808080, -72, 5, -12);
        // Buttress piers right
        makeBox(2, 10, 2, 0x808080, -48, 5, 4);
        makeBox(2, 10, 2, 0x808080, -48, 5, -4);
        makeBox(2, 10, 2, 0x808080, -48, 5, -12);
        // Roof ridge
        makeCone(3, 8, 4, 0x696969, -60, 21, 0);
        // Chancel roof
        makeCone(2.5, 7, 4, 0x696969, -60, 19, -26);
        // West window above door
        makeBox(4, 4, 0.5, 0x5588AA, -60, 14, 22.5);
        // Cathedral steps
        makeBox(20, 1, 5, 0xA0A0A0, -60, 0.5, 25);
    }

    function buildDiamond() {
        // The Diamond - town square
        // Octagonal stone paving (approximated with cylinders)
        makeCylinder(14, 14, 0.3, 8, 0xB0B0B0, 0, 0.15, 0);
        // Market cross monument base
        makeCylinder(2.5, 3.0, 1.5, 8, 0xC0C0C0, 0, 0.75, 0);
        // Cross shaft
        makeBox(0.8, 8, 0.8, 0xC0C0C0, 0, 5.5, 0);
        // Cross arms
        makeBox(4, 0.8, 0.8, 0xC0C0C0, 0, 9, 0);
        // Cross top
        makeCone(0.5, 2, 4, 0xAAAAAA, 0, 10.5, 0);
        // Monument plinth detail
        makeCylinder(1.5, 2.5, 0.8, 8, 0xB8B8B8, 0, 1.8, 0);

        // Georgian buildings around Diamond - north side
        makeBox(20, 12, 10, 0xC8B89A, 0, 6, -28);
        makeBox(20, 1.5, 10, 0x8B7355, 0, 12.75, -28);
        // Georgian north - windows row
        makeBox(2, 2.5, 0.4, 0x5588AA, -7, 7, -23.2);
        makeBox(2, 2.5, 0.4, 0x5588AA, 0, 7, -23.2);
        makeBox(2, 2.5, 0.4, 0x5588AA, 7, 7, -23.2);

        // Georgian buildings - south side
        makeBox(20, 12, 10, 0xC8AA8A, 0, 6, 28);
        makeBox(20, 1.5, 10, 0x8B7355, 0, 12.75, 28);

        // Georgian buildings - east side
        makeBox(10, 12, 20, 0xBBAA90, 28, 6, 0);
        makeBox(10, 1.5, 20, 0x8B7355, 28, 12.75, 0);

        // Georgian buildings - west side
        makeBox(10, 12, 20, 0xC4AE94, -28, 6, 0);
        makeBox(10, 1.5, 20, 0x8B7355, -28, 12.75, 0);

        // Streetlamps in Diamond
        makeCylinder(0.15, 0.15, 5, 6, 0x333333, 8, 2.5, 8);
        makeSphere(0.4, 6, 6, 0xFFFFCC, 8, 5.3, 8);
        makeCylinder(0.15, 0.15, 5, 6, 0x333333, -8, 2.5, 8);
        makeSphere(0.4, 6, 6, 0xFFFFCC, -8, 5.3, 8);
        makeCylinder(0.15, 0.15, 5, 6, 0x333333, 8, 2.5, -8);
        makeSphere(0.4, 6, 6, 0xFFFFCC, 8, 5.3, -8);
        makeCylinder(0.15, 0.15, 5, 6, 0x333333, -8, 2.5, -8);
        makeSphere(0.4, 6, 6, 0xFFFFCC, -8, 5.3, -8);
    }

    function buildRossmoreMemorial() {
        // Rossmore Memorial - Gothic limestone memorial
        // Base plinth
        makeBox(6, 2, 6, 0x8B7355, 40, 1, -30);
        // Second tier
        makeBox(4.5, 2, 4.5, 0x8B7355, 40, 3, -30);
        // Third tier
        makeBox(3, 2, 3, 0x9C8567, 40, 5, -30);
        // Main spire shaft
        makeCylinder(1.0, 1.4, 12, 8, 0x8B7355, 40, 13, -30);
        // Spire tip
        makeCone(1.0, 6, 8, 0x7A6445, 40, 22, -30);
        // Niche decorations - four sides
        makeBox(1.2, 2, 0.4, 0x9C8567, 40, 6, -27.3);
        makeBox(1.2, 2, 0.4, 0x9C8567, 40, 6, -32.7);
        makeBox(0.4, 2, 1.2, 0x9C8567, 42.7, 6, -30);
        makeBox(0.4, 2, 1.2, 0x9C8567, 37.3, 6, -30);
        // Corner pinnacles
        makeCone(0.4, 3, 4, 0x7A6445, 42, 8.5, -27);
        makeCone(0.4, 3, 4, 0x7A6445, 38, 8.5, -27);
        makeCone(0.4, 3, 4, 0x7A6445, 42, 8.5, -33);
        makeCone(0.4, 3, 4, 0x7A6445, 38, 8.5, -33);
    }

    function buildBlaneyCastle() {
        // Blaney Castle ruins - plantation castle on small hill
        // Drumlin hill mound
        makeSphere(12, 10, 8, 0x5A7A3A, 80, -4, 40);
        // Main tower keep - ruined
        makeBox(8, 16, 8, 0x696969, 80, 8, 40);
        // Ruined wall sections
        makeBox(8, 8, 2, 0x696969, 80, 4, 44);
        makeBox(2, 10, 8, 0x696969, 84, 5, 40);
        makeBox(6, 6, 2, 0x696969, 77, 3, 44);
        // Crumbled top - irregular heights
        makeBox(3, 2, 3, 0x5A5A5A, 82, 17, 38);
        makeBox(2, 3, 2, 0x5A5A5A, 78, 18, 42);
        // Ruined curtain wall
        makeBox(14, 4, 1.5, 0x696969, 74, 2, 44);
        makeBox(1.5, 4, 10, 0x696969, 74, 2, 39);
        // Arrow slit window
        makeBox(0.5, 2, 1, 0x333333, 80, 10, 44.1);
        // Stone rubble pile
        makeBox(4, 1.5, 4, 0x808080, 84, 0.75, 44);
    }

    function buildDrumlinsAndLakes() {
        // County Monaghan drumlin hills - elongated spheres
        // Drumlin 1
        var d1 = new THREE.SphereGeometry(18, 10, 7);
        var mat1 = makeMat(0x4A7A2A);
        var m1 = new THREE.Mesh(d1, mat1);
        m1.scale.set(2.5, 0.6, 1.0);
        m1.position.set(OX + 120, OY - 5, OZ + 60);
        scene.add(m1); objects.push(m1);

        // Drumlin 2
        var d2 = new THREE.SphereGeometry(22, 10, 7);
        var mat2 = makeMat(0x3D6B23);
        var m2 = new THREE.Mesh(d2, mat2);
        m2.scale.set(2.8, 0.55, 1.0);
        m2.position.set(OX - 100, OY - 6, OZ + 80);
        scene.add(m2); objects.push(m2);

        // Drumlin 3
        var d3 = new THREE.SphereGeometry(16, 10, 7);
        var mat3 = makeMat(0x527A32);
        var m3 = new THREE.Mesh(d3, mat3);
        m3.scale.set(2.2, 0.65, 1.0);
        m3.position.set(OX + 50, OY - 5, OZ + 120);
        scene.add(m3); objects.push(m3);

        // Drumlin 4
        var d4 = new THREE.SphereGeometry(20, 10, 7);
        var mat4 = makeMat(0x456A28);
        var m4 = new THREE.Mesh(d4, mat4);
        m4.scale.set(2.6, 0.5, 1.0);
        m4.position.set(OX - 130, OY - 6, OZ - 70);
        scene.add(m4); objects.push(m4);

        // Lakes between drumlins - flat cylinders
        makeCylinder(15, 15, 0.5, 12, 0x006994, 100, 0.25, -20);
        makeCylinder(10, 10, 0.5, 12, 0x006994, -90, 0.25, 50);
        makeCylinder(18, 18, 0.5, 12, 0x006994, 130, 0.25, 90);
        makeCylinder(8, 8, 0.5, 12, 0x005577, -50, 0.25, 100);
    }

    function buildMarketHouse() {
        // Victorian Market House - red brick with clocktower
        // Main hall body
        makeBox(22, 10, 16, 0xCD5C5C, 20, 5, 50);
        // Arched arcade base (solid approximation)
        makeBox(22, 4, 2, 0xB04040, 20, 2, 58.2);
        // Arcade columns approximated
        makeCylinder(0.5, 0.5, 4, 6, 0xAA3333, 10, 2, 58);
        makeCylinder(0.5, 0.5, 4, 6, 0xAA3333, 16, 2, 58);
        makeCylinder(0.5, 0.5, 4, 6, 0xAA3333, 22, 2, 58);
        makeCylinder(0.5, 0.5, 4, 6, 0xAA3333, 28, 2, 58);
        // Roof cornice
        makeBox(23, 1.5, 17, 0xAA4444, 20, 10.75, 50);
        // Clocktower base
        makeBox(6, 18, 6, 0xCD5C5C, 20, 9, 50);
        // Clocktower upper
        makeBox(5, 6, 5, 0xBB4444, 20, 21, 50);
        // Clock face - north
        makeBox(3.5, 3.5, 0.3, 0xF0F0F0, 20, 21, 47.2);
        // Clock face - south
        makeBox(3.5, 3.5, 0.3, 0xF0F0F0, 20, 21, 52.8);
        // Clocktower roof
        makeCone(3, 5, 4, 0x8B3333, 20, 27, 50);
        // Market hall windows
        makeBox(2.5, 3, 0.4, 0x88AACC, 11, 6, 42.2);
        makeBox(2.5, 3, 0.4, 0x88AACC, 18, 6, 42.2);
        makeBox(2.5, 3, 0.4, 0x88AACC, 25, 6, 42.2);
    }

    function buildStPatricksChurch() {
        // St Patrick's Church - cream limestone
        // Main nave
        makeBox(12, 10, 28, 0xF5F0E8, -30, 5, 50);
        // Chancel
        makeBox(8, 9, 10, 0xEEE9DC, -30, 4.5, 65);
        // West front tower
        makeBox(8, 16, 8, 0xF5F0E8, -30, 8, 37);
        // Spire
        makeCone(2.5, 20, 4, 0xE8E0D0, -30, 27, 37);
        // Nave roof ridge
        makeCone(2, 5, 4, 0xD8D0C0, -30, 15, 50);
        // Chancel roof
        makeCone(1.5, 4, 4, 0xD8D0C0, -30, 14, 65);
        // Church porch
        makeBox(5, 5, 4, 0xF0EBE0, -30, 2.5, 34);
        // Church windows
        makeBox(1.5, 3, 0.4, 0x99BBDD, -24.2, 6, 50);
        makeBox(1.5, 3, 0.4, 0x99BBDD, -35.8, 6, 50);
        makeBox(1.5, 3, 0.4, 0x99BBDD, -24.2, 6, 55);
        makeBox(1.5, 3, 0.4, 0x99BBDD, -35.8, 6, 55);
        // Bell opening in tower
        makeBox(2, 2.5, 0.4, 0x888888, -30, 14, 33.2);
        // Churchyard wall
        makeBox(28, 1.8, 1, 0xD0CAB8, -30, 0.9, 28);
        makeBox(1, 1.8, 20, 0xD0CAB8, -16.5, 0.9, 38);
        makeBox(1, 1.8, 20, 0xD0CAB8, -43.5, 0.9, 38);
    }

    function buildCanal() {
        // Erie/Ulster Canal remnant
        // Canal water channel
        makeCylinder(3.5, 3.5, 0.4, 6, 0x006994, 60, 0.2, -60);
        makeCylinder(3.5, 3.5, 0.4, 6, 0x006994, 72, 0.2, -60);
        makeCylinder(3.5, 3.5, 0.4, 6, 0x006994, 84, 0.2, -60);
        // Canal straight sections - using boxes for the trough walls
        makeBox(60, 3, 1.2, 0x888888, 75, 1.5, -56.5);
        makeBox(60, 3, 1.2, 0x888888, 75, 1.5, -63.5);
        // Canal bed
        makeBox(58, 0.4, 6, 0x2A5A70, 75, 0.2, -60);
        // Lock gate structure
        makeBox(7, 4, 1.5, 0x5A4A3A, 60, 2, -60);
        makeBox(1.5, 4, 7, 0x5A4A3A, 60, 2, -60);
        // Lock keeper's cottage
        makeBox(7, 5, 7, 0xC8B48A, 55, 2.5, -72);
        makeCone(2, 3, 4, 0x8B3A2A, 55, 6.5, -72);
        // Towpath stones
        makeBox(40, 0.5, 4, 0xA0906A, 75, 0.25, -55);
    }

    function buildClonesRoad() {
        // Clones Road - leading out of town
        // Road surface sections
        makeBox(8, 0.3, 60, 0x555555, -5, 0.15, -80);
        makeBox(8, 0.3, 40, 0x555555, -8, 0.15, -130);
        // Road markings
        makeBox(0.5, 0.32, 8, 0xFFFFFF, -5, 0.16, -68);
        makeBox(0.5, 0.32, 8, 0xFFFFFF, -5, 0.16, -84);
        makeBox(0.5, 0.32, 8, 0xFFFFFF, -5, 0.16, -100);
        // Roadside trees - left side
        makeCylinder(0.4, 0.5, 5, 6, 0x4A3020, -10, 2.5, -72);
        makeSphere(3, 7, 6, 0x228B22, -10, 7, -72);
        makeCylinder(0.4, 0.5, 5, 6, 0x4A3020, -10, 2.5, -88);
        makeSphere(3, 7, 6, 0x228B22, -10, 7, -88);
        makeCylinder(0.4, 0.5, 5, 6, 0x4A3020, -10, 2.5, -104);
        makeSphere(3, 7, 6, 0x228B22, -10, 7, -104);
        // Roadside trees - right side
        makeCylinder(0.4, 0.5, 5, 6, 0x4A3020, 0, 2.5, -76);
        makeSphere(3, 7, 6, 0x1A7A12, 0, 7, -76);
        makeCylinder(0.4, 0.5, 5, 6, 0x4A3020, 0, 2.5, -92);
        makeSphere(3, 7, 6, 0x1A7A12, 0, 7, -92);
        makeCylinder(0.4, 0.5, 5, 6, 0x4A3020, 0, 2.5, -108);
        makeSphere(3, 7, 6, 0x1A7A12, 0, 7, -108);
        // Drystone wall alongside road
        makeBox(1, 1.5, 50, 0x888888, -14, 0.75, -95);
    }

    function buildPubs() {
        // Colorful pubs around The Diamond and main street
        // Pub 1 - dark red
        makeBox(8, 9, 7, 0x8B0000, 42, 4.5, -20);
        makeBox(8, 1, 7, 0x6A0000, 42, 9.5, -20);
        // Pub 1 signage board
        makeBox(6, 1.8, 0.4, 0xFFDD00, 42, 7.5, -16.8);
        // Hanging sign arm
        makeBox(0.2, 0.2, 1.5, 0x222222, 40, 9, -16.5);
        makeBox(1, 1, 0.2, 0x8B4513, 40, 8.5, -15.8);
        // Pub 1 windows
        makeBox(2, 2, 0.4, 0x88AAAA, 40, 5, -16.8);
        makeBox(2, 2, 0.4, 0x88AAAA, 44, 5, -16.8);
        // Pub 1 door
        makeBox(1.5, 3, 0.4, 0x3A1A00, 42, 2.5, -16.8);

        // Pub 2 - dark green
        makeBox(9, 9, 7, 0x006400, 56, 4.5, -20);
        makeBox(9, 1, 7, 0x004A00, 56, 9.5, -20);
        // Pub 2 signage
        makeBox(7, 1.8, 0.4, 0xFFFFFF, 56, 7.5, -16.8);
        // Hanging sign
        makeBox(0.2, 0.2, 1.5, 0x222222, 54, 9, -16.5);
        makeBox(1, 1, 0.2, 0x004A00, 54, 8.5, -15.8);
        // Pub 2 windows
        makeBox(2, 2, 0.4, 0xAABBAA, 53, 5, -16.8);
        makeBox(2, 2, 0.4, 0xAABBAA, 57, 5, -16.8);
        // Pub 2 door
        makeBox(1.5, 3, 0.4, 0x1A3A00, 56, 2.5, -16.8);

        // Pub 3 - another red pub on the north side
        makeBox(8, 8, 7, 0xAA1111, -42, 4, 22);
        makeBox(8, 1, 7, 0x880000, -42, 8.5, 22);
        makeBox(6, 1.5, 0.4, 0xFFCC00, -42, 6.8, 25.8);
        makeBox(2, 2, 0.4, 0x88AAAA, -44, 4.5, 25.8);
        makeBox(2, 2, 0.4, 0x88AAAA, -40, 4.5, 25.8);
        makeBox(1.5, 3, 0.4, 0x3A1A00, -42, 2.2, 25.8);
    }

    function buildGroundAndSky() {
        // Ground plane approximated with large flat box
        makeBox(400, 0.5, 400, 0x3A5A20, 0, -0.25, 0);
        // Town roads
        makeBox(300, 0.3, 8, 0x555555, 0, 0.15, 0);
        makeBox(8, 0.3, 300, 0x555555, 0, 0.15, 0);
        // Pavement kerbs
        makeBox(300, 0.5, 1, 0xAAAAAA, 0, 0.25, 4.5);
        makeBox(300, 0.5, 1, 0xAAAAAA, 0, 0.25, -4.5);
        makeBox(1, 0.5, 300, 0xAAAAAA, 4.5, 0.25, 0);
        makeBox(1, 0.5, 300, 0xAAAAAA, -4.5, 0.25, 0);
    }

    function build() {
        buildGroundAndSky();
        buildCathedral();
        buildDiamond();
        buildRossmoreMemorial();
        buildBlaneyCastle();
        buildDrumlinsAndLakes();
        buildMarketHouse();
        buildStPatricksChurch();
        buildCanal();
        buildClonesRoad();
        buildPubs();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
