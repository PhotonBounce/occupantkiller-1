window.KildareCurragh = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 19000;
    var CY = 0;
    var CZ = 0;

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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function buildGround() {
        // Vast flat Curragh plains - broad grassland using box segments
        makeBox(4000, 2, 4000, 0x3CB371, 0, -1, 0);
        // Inner green of racecourse
        makeBox(900, 1, 500, 0x228B22, 0, 0, 0);
    }

    function buildRacecourse() {
        // Oval track outline built from box segments forming ellipse approximation
        // North straight
        makeBox(900, 4, 18, 0xC8A870, 0, 2, -270);
        // South straight
        makeBox(900, 4, 18, 0xC8A870, 0, 2, 270);
        // East curve segment 1
        makeBox(80, 4, 200, 0xC8A870, 460, 2, -180);
        // East curve segment 2
        makeBox(80, 4, 200, 0xC8A870, 490, 2, 0);
        // East curve segment 3
        makeBox(80, 4, 200, 0xC8A870, 460, 2, 180);
        // West curve segment 1
        makeBox(80, 4, 200, 0xC8A870, -460, 2, -180);
        // West curve segment 2
        makeBox(80, 4, 200, 0xC8A870, -490, 2, 0);
        // West curve segment 3
        makeBox(80, 4, 200, 0xC8A870, -460, 2, 180);

        // White rail fences along track
        // North inner rail
        makeBox(900, 3, 4, 0xF5F5F5, 0, 3, -253);
        // North outer rail
        makeBox(900, 3, 4, 0xF5F5F5, 0, 3, -287);
        // South inner rail
        makeBox(900, 3, 4, 0xF5F5F5, 0, 3, 253);
        // South outer rail
        makeBox(900, 3, 4, 0xF5F5F5, 0, 3, 287);
        // East inner rail posts
        makeBox(4, 3, 180, 0xF5F5F5, 448, 3, -160);
        makeBox(4, 3, 180, 0xF5F5F5, 478, 3, -160);
        makeBox(4, 3, 180, 0xF5F5F5, 448, 3, 160);
        makeBox(4, 3, 180, 0xF5F5F5, 478, 3, 160);
        // West inner rail posts
        makeBox(4, 3, 180, 0xF5F5F5, -448, 3, -160);
        makeBox(4, 3, 180, 0xF5F5F5, -478, 3, -160);
        makeBox(4, 3, 180, 0xF5F5F5, -448, 3, 160);
        makeBox(4, 3, 180, 0xF5F5F5, -478, 3, 160);
    }

    function buildGrandstand() {
        // Grandstand base
        makeBox(400, 20, 60, 0xD3D3D3, -80, 10, -310);
        // Grandstand tier 1 seating
        makeBox(380, 10, 30, 0x4169E1, -80, 25, -295);
        // Grandstand tier 2 seating
        makeBox(360, 10, 30, 0x4169E1, -80, 38, -285);
        // Grandstand tier 3 seating
        makeBox(340, 10, 30, 0x4169E1, -80, 51, -275);
        // Grandstand roof
        makeBox(420, 6, 50, 0xA9A9A9, -80, 62, -285);
        // Press box
        makeBox(80, 15, 20, 0xB0C4DE, -80, 70, -280);

        // Crowd boxes in stands (coloured seating blobs)
        makeBox(60, 5, 10, 0xFF4500, -200, 28, -295);
        makeBox(60, 5, 10, 0x00CED1, -120, 28, -295);
        makeBox(60, 5, 10, 0x9400D3, -40, 28, -295);
        makeBox(60, 5, 10, 0xFF69B4, 40, 28, -295);
        makeBox(60, 5, 10, 0xFFD700, 120, 28, -295);
    }

    function buildHorse(ox, oy, oz) {
        // Body
        makeCyl(8, 8, 40, 8, 0x8B4513, ox, oy + 30, oz);
        // Neck (rotated box approximation)
        makeBox(10, 25, 10, 0x8B4513, ox + 16, oy + 44, oz);
        // Head
        makeSphere(9, 8, 6, 0x8B4513, ox + 22, oy + 56, oz);
        // Front left leg
        makeCyl(3, 3, 28, 6, 0x7A3B1E, ox + 10, oy + 14, oz - 8);
        // Front right leg
        makeCyl(3, 3, 28, 6, 0x7A3B1E, ox + 10, oy + 14, oz + 8);
        // Back left leg
        makeCyl(3, 3, 28, 6, 0x7A3B1E, ox - 10, oy + 14, oz - 8);
        // Back right leg
        makeCyl(3, 3, 28, 6, 0x7A3B1E, ox - 10, oy + 14, oz + 8);
        // Tail
        makeBox(5, 20, 5, 0x4A2500, ox - 22, oy + 34, oz);
    }

    function buildThoroughbreds() {
        // Several horses on training gallops north-east of racecourse
        buildHorse(620, 0, -150);
        buildHorse(680, 0, -80);
        buildHorse(740, 0, -200);
        buildHorse(580, 0, 50);
        buildHorse(800, 0, 30);
    }

    function buildRoundTower() {
        // Kildare Round Tower — Ireland's only one with ground-level door
        // Main tower shaft
        makeCyl(18, 20, 200, 12, 0x8B7355, -700, 100, -700);
        // Conical cap
        makeCone(20, 40, 12, 0x7A6245, -700, 220, -700);
        // Door at ground level (dark box inset)
        makeBox(8, 14, 4, 0x3B2510, -700, 7, -682);
        // Upper window slits
        makeBox(4, 8, 4, 0x3B2510, -700, 80, -682);
        makeBox(4, 8, 4, 0x3B2510, -700, 130, -682);
        makeBox(4, 8, 4, 0x3B2510, -718, 80, -700);
    }

    function buildStBrigidsCathedral() {
        // Cathedral nave
        makeBox(120, 60, 60, 0x9E9E9E, -780, 30, -680);
        // Cathedral chancel
        makeBox(50, 50, 50, 0x9E9E9E, -840, 25, -680);
        // West tower
        makeBox(30, 90, 30, 0x8A8A8A, -720, 45, -680);
        // Nave roof ridge
        makeCone(35, 30, 4, 0x7A7A7A, -780, 68, -680);
        // Chancel roof
        makeCone(28, 25, 4, 0x7A7A7A, -840, 60, -680);
        // Tower battlements
        makeBox(34, 8, 34, 0x8A8A8A, -720, 96, -680);
    }

    function buildIrishNationalStud() {
        // Main stud farm building
        makeBox(200, 30, 80, 0x8B7355, 700, 15, 600);
        // Stud roof
        makeCone(105, 20, 4, 0x6B5A3E, 700, 32, 600);
        // Stable barn 1
        makeBox(80, 20, 60, 0x9E8B6A, 820, 10, 560);
        // Stable barn 2
        makeBox(80, 20, 60, 0x9E8B6A, 820, 10, 650);
        // Stable barn 3
        makeBox(80, 20, 60, 0x9E8B6A, 580, 10, 560);
        // Training gallop track marker (long flat strip)
        makeBox(500, 2, 20, 0xD2B48C, 700, 1, 750);
        // Paddock fence
        makeBox(200, 5, 4, 0xF5F5F5, 700, 3, 520);
        makeBox(4, 5, 100, 0xF5F5F5, 600, 3, 570);
        makeBox(4, 5, 100, 0xF5F5F5, 800, 3, 570);
    }

    function buildJapaneseGardens() {
        // Formal garden hedges (shaped green boxes)
        makeBox(40, 15, 40, 0x228B22, 900, 8, 400);
        makeBox(40, 15, 40, 0x228B22, 960, 8, 400);
        makeBox(40, 15, 40, 0x228B22, 900, 8, 460);
        makeBox(40, 15, 40, 0x228B22, 960, 8, 460);
        makeBox(120, 8, 12, 0x228B22, 930, 5, 370);
        makeBox(12, 8, 100, 0x228B22, 870, 5, 430);
        makeBox(12, 8, 100, 0x228B22, 990, 5, 430);
        // Pond (blue box, slightly recessed)
        makeBox(100, 2, 60, 0x006994, 930, 0, 430);
        // Stone bridge over pond
        makeBox(20, 5, 70, 0xA0A0A0, 930, 3, 430);
        // Bridge arch supports
        makeCyl(4, 4, 8, 6, 0x808080, 920, 3, 410);
        makeCyl(4, 4, 8, 6, 0x808080, 940, 3, 410);
        makeCyl(4, 4, 8, 6, 0x808080, 920, 3, 450);
        makeCyl(4, 4, 8, 6, 0x808080, 940, 3, 450);
        // Ornamental trees (sphere on cylinder)
        makeCyl(3, 3, 20, 6, 0x5C3A1E, 870, 10, 390);
        makeSphere(14, 8, 6, 0x006400, 870, 27, 390);
        makeCyl(3, 3, 20, 6, 0x5C3A1E, 990, 10, 390);
        makeSphere(14, 8, 6, 0x006400, 990, 27, 390);
    }

    function buildSheepOnPlains() {
        // Sheep clusters — small white sphere groups grazing
        makeSphere(10, 6, 4, 0xF0F0F0, -300, 10, 400);
        makeSphere(10, 6, 4, 0xF0F0F0, -280, 10, 420);
        makeSphere(10, 6, 4, 0xF0F0F0, -260, 10, 400);
        makeSphere(8, 6, 4, 0xF0F0F0, -200, 10, 500);
        makeSphere(8, 6, 4, 0xF0F0F0, -180, 10, 520);
        makeSphere(10, 6, 4, 0xF0F0F0, 300, 10, 500);
        makeSphere(10, 6, 4, 0xF0F0F0, 320, 10, 480);
        makeSphere(10, 6, 4, 0xF0F0F0, 340, 10, 510);
        // Sheep heads (tiny spheres)
        makeSphere(5, 4, 3, 0xE8E8E8, -296, 17, 397);
        makeSphere(5, 4, 3, 0xE8E8E8, -276, 17, 417);
        makeSphere(5, 4, 3, 0xE8E8E8, 304, 17, 497);
    }

    function buildCurraghCamp() {
        // Barracks buildings
        makeBox(150, 25, 60, 0xD2B48C, -500, 13, 600);
        makeBox(150, 25, 60, 0xD2B48C, -500, 13, 700);
        makeBox(150, 25, 60, 0xD2B48C, -500, 13, 800);
        makeBox(150, 25, 60, 0xD2B48C, -350, 13, 700);
        // Parade ground (flat sandy surface)
        makeBox(300, 1, 300, 0xC2A870, -425, 0, 750);
        // Flagpole
        makeCyl(2, 2, 80, 6, 0xC0C0C0, -425, 40, 600);
        // Flag (small box at top)
        makeBox(30, 15, 4, 0x009B00, -410, 78, 600);
        // Barracks roofs
        makeCone(80, 15, 4, 0xB8966E, -500, 28, 600);
        makeCone(80, 15, 4, 0xB8966E, -500, 28, 700);
        makeCone(80, 15, 4, 0xB8966E, -500, 28, 800);
        // Guard post
        makeBox(20, 30, 20, 0xC8A87C, -280, 15, 680);
        makeBox(24, 5, 24, 0xB89868, -280, 32, 680);
    }

    function buildStBrigidsWell() {
        // Stone enclosure walls
        makeBox(60, 10, 8, 0x808080, -650, 5, 500);
        makeBox(60, 10, 8, 0x808080, -650, 5, 560);
        makeBox(8, 10, 60, 0x808080, -680, 5, 530);
        makeBox(8, 10, 60, 0x808080, -620, 5, 530);
        // Well water (blue box)
        makeBox(40, 2, 40, 0x006994, -650, 1, 530);
        // Stone lintel over well
        makeBox(50, 6, 6, 0x909090, -650, 16, 530);
        // Votive candle stands (small cylinders)
        makeCyl(2, 2, 8, 5, 0xFFFFE0, -660, 4, 520);
        makeCyl(2, 2, 8, 5, 0xFFFFE0, -640, 4, 520);
        makeCyl(2, 2, 8, 5, 0xFFFFE0, -650, 4, 545);
    }

    function buildNationalStudMuseum() {
        // Museum building
        makeBox(120, 35, 70, 0xC8B89A, 700, 18, 470);
        // Museum roof
        makeCone(65, 20, 4, 0xB0A088, 700, 38, 470);
        // Museum entrance portico columns
        makeCyl(5, 5, 35, 8, 0xE0D5C0, 670, 18, 436);
        makeCyl(5, 5, 35, 8, 0xE0D5C0, 690, 18, 436);
        makeCyl(5, 5, 35, 8, 0xE0D5C0, 710, 18, 436);
        makeCyl(5, 5, 35, 8, 0xE0D5C0, 730, 18, 436);
        // Portico lintel
        makeBox(80, 6, 8, 0xD0C8B0, 700, 38, 436);
        // Signage board
        makeBox(60, 10, 2, 0x4A3728, 700, 28, 433);
    }

    function buildSunriseHorizon() {
        // Sunrise sky effect — distant box strips near horizon
        // Golden glow strip low on horizon (east)
        makeBox(3000, 30, 8, 0xFFD700, 1800, 60, 0);
        // Orange mid-glow strip
        makeBox(3000, 50, 8, 0xFF8C00, 1820, 100, 0);
        // Red-orange upper strip
        makeBox(3000, 40, 8, 0xFF4500, 1840, 160, 0);
        // Pale yellow upper sky strip
        makeBox(3000, 60, 8, 0xFFEA80, 1860, 220, 0);
        // North horizon glow
        makeBox(8, 80, 2000, 0xFFD700, 1800, 80, 0);
        // South horizon glow
        makeBox(8, 60, 2000, 0xFF8C00, 1820, 60, 0);
        // Distant tree line silhouettes (dark boxes)
        makeBox(200, 40, 10, 0x1A3A1A, 1400, 20, -600);
        makeBox(180, 35, 10, 0x1A3A1A, 1400, 18, -400);
        makeBox(220, 45, 10, 0x1A3A1A, 1400, 22, 400);
        makeBox(160, 30, 10, 0x1A3A1A, 1400, 15, 600);
    }

    function buildScatteredTrees() {
        // A few lone trees on the Curragh plains
        makeCyl(4, 5, 30, 7, 0x5C3A1E, -100, 15, 200);
        makeSphere(20, 8, 6, 0x2E6B2E, -100, 40, 200);
        makeCyl(4, 5, 30, 7, 0x5C3A1E, 200, 15, -150);
        makeSphere(20, 8, 6, 0x2E6B2E, 200, 40, -150);
        makeCyl(4, 5, 25, 7, 0x5C3A1E, -400, 13, -300);
        makeSphere(16, 8, 6, 0x2E6B2E, -400, 35, -300);
    }

    function build() {
        buildGround();
        buildRacecourse();
        buildGrandstand();
        buildThoroughbreds();
        buildRoundTower();
        buildStBrigidsCathedral();
        buildIrishNationalStud();
        buildJapaneseGardens();
        buildSheepOnPlains();
        buildCurraghCamp();
        buildStBrigidsWell();
        buildNationalStudMuseum();
        buildSunriseHorizon();
        buildScatteredTrees();
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

    return { init: init, update: update, reset: reset };
}());
