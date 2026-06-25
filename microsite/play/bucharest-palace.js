window.BucharestPalace = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 23320;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        buildGround();
        buildPalaceOfParliament();
        buildArculDeTriumf();
        buildOldTown();
        buildPatriarchalCathedral();
        buildRomanianAthenaeum();
        buildNationalMilitaryCircle();
        buildDambovitaRiver();
        buildHerastrauPark();
        buildRevolutionSquare();
        buildCaleaVictoriei();
    }

    function buildGround() {
        // Large flat ground using thin boxes — no PlaneGeometry allowed
        makeBox(2000, 1, 2000, 0x5A5040, 0, -0.5, 0);
        // Road network base
        makeBox(2000, 0.5, 30, 0x3A3830, 0, 0.25, 0);
        makeBox(30, 0.5, 2000, 0x3A3830, 0, 0.25, 0);
    }

    function buildPalaceOfParliament() {
        var pc = 0xD4D0C8;
        var pdark = 0xB8B4AC;
        var pwindow = 0x4A6878;
        var stone = 0xC8C4BC;

        // Main enormous body — 270m wide, 86m tall
        makeBox(270, 86, 120, pc, 0, 43, -300);

        // Side wings extending the facade
        makeBox(60, 70, 80, pc, -165, 35, -300);
        makeBox(60, 70, 80, pc, 165, 35, -300);

        // Rear extension
        makeBox(200, 60, 60, pc, 0, 30, -370);

        // Grand central portico — elevated entrance
        makeBox(60, 86, 20, stone, 0, 43, -240);

        // Portico columns — 8 columns across
        makeCyl(2.5, 2.5, 50, 8, 0xE8E4DC, -35, 25, -231);
        makeCyl(2.5, 2.5, 50, 8, 0xE8E4DC, -25, 25, -231);
        makeCyl(2.5, 2.5, 50, 8, 0xE8E4DC, -15, 25, -231);
        makeCyl(2.5, 2.5, 50, 8, 0xE8E4DC, -5, 25, -231);
        makeCyl(2.5, 2.5, 50, 8, 0xE8E4DC, 5, 25, -231);
        makeCyl(2.5, 2.5, 50, 8, 0xE8E4DC, 15, 25, -231);
        makeCyl(2.5, 2.5, 50, 8, 0xE8E4DC, 25, 25, -231);
        makeCyl(2.5, 2.5, 50, 8, 0xE8E4DC, 35, 25, -231);

        // Portico pediment / entablature
        makeBox(80, 6, 14, stone, 0, 53, -231);

        // Flat roof parapet
        makeBox(280, 4, 130, pdark, 0, 88, -300);

        // Rows of windows on main facade — lower row
        var wi = -120;
        while (wi <= 120) {
            makeBox(7, 10, 2, pwindow, wi, 20, -241);
            wi += 18;
        }
        // Middle window row
        wi = -120;
        while (wi <= 120) {
            makeBox(7, 10, 2, pwindow, wi, 40, -241);
            wi += 18;
        }
        // Upper window row
        wi = -120;
        while (wi <= 120) {
            makeBox(7, 10, 2, pwindow, wi, 60, -241);
            wi += 18;
        }

        // Side facade windows — left wing
        makeBox(2, 8, 6, pwindow, -196, 20, -270);
        makeBox(2, 8, 6, pwindow, -196, 20, -290);
        makeBox(2, 8, 6, pwindow, -196, 20, -310);
        makeBox(2, 8, 6, pwindow, -196, 40, -270);
        makeBox(2, 8, 6, pwindow, -196, 40, -290);
        makeBox(2, 8, 6, pwindow, -196, 40, -310);

        // Side facade windows — right wing
        makeBox(2, 8, 6, pwindow, 196, 20, -270);
        makeBox(2, 8, 6, pwindow, 196, 20, -290);
        makeBox(2, 8, 6, pwindow, 196, 20, -310);
        makeBox(2, 8, 6, pwindow, 196, 40, -270);
        makeBox(2, 8, 6, pwindow, 196, 40, -290);
        makeBox(2, 8, 6, pwindow, 196, 40, -310);

        // Grand staircase leading to portico
        makeBox(80, 2, 20, stone, 0, 1, -220);
        makeBox(70, 4, 16, stone, 0, 3, -222);
        makeBox(60, 6, 12, stone, 0, 5, -224);
        makeBox(50, 8, 8, stone, 0, 7, -226);

        // Decorative attic story
        makeBox(270, 12, 8, pdark, 0, 90, -244);

        // Flanking decorative towers at corners
        makeBox(20, 96, 20, pc, -130, 48, -245);
        makeBox(20, 96, 20, pc, 130, 48, -245);
        makeBox(24, 4, 24, pdark, -130, 98, -245);
        makeBox(24, 4, 24, pdark, 130, 98, -245);

        // Parliament plaza / esplanade
        makeBox(320, 0.5, 100, 0xC0B8A8, 0, 0.25, -170);

        // Plaza lamp posts
        makeCyl(0.5, 0.5, 12, 6, 0x808080, -60, 6, -180);
        makeCyl(0.5, 0.5, 12, 6, 0x808080, -30, 6, -180);
        makeCyl(0.5, 0.5, 12, 6, 0x808080, 0, 6, -180);
        makeCyl(0.5, 0.5, 12, 6, 0x808080, 30, 6, -180);
        makeCyl(0.5, 0.5, 12, 6, 0x808080, 60, 6, -180);
    }

    function buildArculDeTriumf() {
        var ac = 0xD4C8A0;
        var adark = 0xB8AC88;

        // Arch base piers — left
        makeBox(12, 27, 8, ac, -310, 13.5, 200);
        // Arch base piers — right
        makeBox(12, 27, 8, ac, -276, 13.5, 200);

        // Arch keystone / top connecting block
        makeBox(36, 6, 8, ac, -293, 27, 200);

        // Arch opening void is implied by surrounding geometry
        // Inner decorative relief band
        makeBox(34, 2, 2, adark, -293, 24, 196);

        // Attic story above arch
        makeBox(38, 8, 9, ac, -293, 32, 200);

        // Carved relief panels on attic
        makeBox(10, 5, 1, adark, -305, 32, 196);
        makeBox(10, 5, 1, adark, -281, 32, 196);

        // Cornice / top cap
        makeBox(40, 3, 10, adark, -293, 37, 200);

        // Boulevard flanking the arch
        makeBox(300, 0.5, 20, 0x3A3830, -150, 0.25, 200);
        makeBox(300, 0.5, 20, 0x3A3830, -450, 0.25, 200);

        // Lamp posts along boulevard
        makeCyl(0.4, 0.4, 10, 6, 0x606060, -200, 5, 193);
        makeCyl(0.4, 0.4, 10, 6, 0x606060, -230, 5, 193);
        makeCyl(0.4, 0.4, 10, 6, 0x606060, -260, 5, 193);
        makeCyl(0.4, 0.4, 10, 6, 0x606060, -200, 5, 207);
        makeCyl(0.4, 0.4, 10, 6, 0x606060, -230, 5, 207);
        makeCyl(0.4, 0.4, 10, 6, 0x606060, -260, 5, 207);

        // Roundabout base around arch
        makeCyl(35, 35, 0.5, 16, 0xC0B0A0, -293, 0.25, 200);

        // Decorative side pilasters
        makeBox(3, 27, 2, adark, -299, 13.5, 196);
        makeBox(3, 27, 2, adark, -287, 13.5, 196);
    }

    function buildOldTown() {
        var baroque = 0xCC8833;
        var artnouveau = 0xCC9944;
        var stone = 0xBB7722;
        var road = 0x3C3020;
        var cobble = 0x8A7A60;

        // Cobbled pedestrian zone
        makeBox(120, 0.5, 80, cobble, 200, 0.25, 100);

        // Narrow streets (slightly raised markers)
        makeBox(8, 0.3, 80, road, 180, 0.4, 100);
        makeBox(8, 0.3, 80, road, 220, 0.4, 100);

        // Row of baroque facades — left side
        makeBox(18, 22, 12, baroque, 165, 11, 80);
        makeBox(18, 18, 12, 0xBB6622, 165, 9, 105);
        makeBox(18, 25, 12, 0xDD9944, 165, 12.5, 125);

        // Ornate cornices on baroque buildings
        makeBox(20, 2, 14, 0xEEAA55, 165, 23, 80);
        makeBox(20, 2, 14, 0xEEAA55, 165, 19, 105);
        makeBox(20, 2, 14, 0xEEAA55, 165, 26, 125);

        // Row of Art Nouveau facades — right side
        makeBox(18, 20, 12, artnouveau, 235, 10, 80);
        makeBox(18, 24, 12, 0xCC7733, 235, 12, 105);
        makeBox(18, 16, 12, 0xDD8833, 235, 8, 125);

        // Art Nouveau ornamental tops
        makeCone(4, 6, 4, 0xBB6600, 235, 23, 80);
        makeCone(4, 6, 4, 0xBB6600, 235, 27, 105);

        // Central building block — larger historic inn / han
        makeBox(30, 18, 20, 0xBB7733, 200, 9, 90);
        makeBox(32, 2, 22, 0xAA6622, 200, 19, 90);

        // Small Orthodox chapel in Old Town
        makeBox(10, 14, 10, 0xD4C8A0, 200, 7, 135);
        makeCyl(3, 3, 8, 8, 0xC8BC98, 200, 18, 135);
        makeSphere(3, 8, 6, 0xB8AC88, 200, 25, 135);
        // Chapel cross
        makeBox(0.5, 5, 0.5, 0xC0A030, 200, 29, 135);
        makeBox(3, 0.5, 0.5, 0xC0A030, 200, 31, 135);

        // Windows on Old Town buildings
        makeBox(3, 4, 1, 0x223344, 165, 14, 74);
        makeBox(3, 4, 1, 0x223344, 170, 14, 74);
        makeBox(3, 4, 1, 0x223344, 235, 12, 74);
        makeBox(3, 4, 1, 0x223344, 240, 12, 74);

        // Terrace furniture / outdoor seating suggestion
        makeBox(3, 1, 3, 0x553311, 193, 0.5, 75);
        makeBox(3, 1, 3, 0x553311, 205, 0.5, 75);
        makeBox(3, 1, 3, 0x553311, 197, 0.5, 75);
    }

    function buildPatriarchalCathedral() {
        var white = 0xD4C8A0;
        var dome = 0xB8AC88;
        var gold = 0xC8A820;

        // Cathedral sits on a hill — raised base
        makeCyl(30, 35, 8, 0x9A8870, 350, 4, -100);

        // Main cathedral body
        makeBox(40, 20, 30, white, 350, 14, -100);

        // Side aisles
        makeBox(12, 14, 30, white, 325, 11, -100);
        makeBox(12, 14, 30, white, 375, 11, -100);

        // Apse / sanctuary extension
        makeBox(20, 16, 12, white, 350, 12, -118);

        // Central drum and dome
        makeCyl(8, 8, 10, 10, white, 350, 30, -100);
        makeSphere(10, 12, 8, dome, 350, 42, -100);

        // Smaller flanking domes
        makeSphere(5, 10, 8, dome, 330, 28, -95);
        makeSphere(5, 10, 8, dome, 370, 28, -95);

        // Belfry tower
        makeBox(8, 35, 8, white, 360, 17.5, -80);
        makeCyl(5, 5, 5, 8, dome, 360, 37.5, -80);
        makeCone(5, 8, 8, dome, 360, 43, -80);

        // Gold Orthodox crosses
        makeBox(0.6, 6, 0.6, gold, 350, 53, -100);
        makeBox(4, 0.6, 0.6, gold, 350, 55, -100);
        makeBox(0.6, 4, 0.6, gold, 360, 49, -80);
        makeBox(3, 0.6, 0.6, gold, 360, 51, -80);

        // Portico entrance
        makeBox(20, 14, 8, white, 350, 7, -72);
        makeCyl(1.5, 1.5, 12, 8, 0xE0D8C0, 342, 6, -68);
        makeCyl(1.5, 1.5, 12, 8, 0xE0D8C0, 350, 6, -68);
        makeCyl(1.5, 1.5, 12, 8, 0xE0D8C0, 358, 6, -68);

        // Cathedral steps
        makeBox(50, 2, 10, 0xC0B898, 350, 1, -66);
        makeBox(46, 4, 6, 0xC0B898, 350, 3, -64);
    }

    function buildRomanianAthenaeum() {
        var marble = 0xF0EDE8;
        var gdome = 0x5A8040;
        var column = 0xE8E4E0;

        // Circular rotunda base
        makeCyl(22, 24, 4, marble, 100, 2, 50);

        // Main circular body
        makeCyl(20, 20, 18, 14, marble, 100, 13, 50);

        // Drum / attic above body
        makeCyl(18, 18, 6, 14, 0xE0DDD8, 100, 25, 50);

        // Iconic green dome
        makeSphere(18, 14, 10, gdome, 100, 36, 50);

        // Lantern on top of dome
        makeCyl(3, 3, 6, 8, gdome, 100, 52, 50);
        makeCone(3, 5, 8, 0x4A7030, 100, 58, 50);

        // Neoclassical portico with columns
        makeBox(24, 18, 8, marble, 100, 9, 30);
        makeBox(26, 3, 10, marble, 100, 19, 30);

        // Portico columns — 6 Ionic columns
        makeCyl(1.5, 1.5, 16, 8, column, 88, 8, 26);
        makeCyl(1.5, 1.5, 16, 8, column, 93, 8, 26);
        makeCyl(1.5, 1.5, 16, 8, column, 98, 8, 26);
        makeCyl(1.5, 1.5, 16, 8, column, 103, 8, 26);
        makeCyl(1.5, 1.5, 16, 8, column, 108, 8, 26);
        makeCyl(1.5, 1.5, 16, 8, column, 113, 8, 26);

        // Steps
        makeBox(30, 2, 6, marble, 100, 1, 27);
        makeBox(28, 4, 4, marble, 100, 3, 25);

        // Wrought iron fence
        makeBox(60, 4, 1, 0x303030, 100, 2, 18);
    }

    function buildNationalMilitaryCircle() {
        var facade = 0xF0EDE0;
        var ornate = 0xE0D8C8;
        var dark = 0xC8C0A8;

        // Main palace block
        makeBox(50, 28, 30, facade, -100, 14, 50);

        // Grand ballroom wing — taller
        makeBox(24, 32, 20, facade, -120, 16, 40);

        // Ornate facade articulation
        makeBox(52, 4, 32, dark, -100, 28, 50);
        makeBox(26, 4, 22, dark, -120, 32, 40);

        // Corner towers
        makeBox(8, 34, 8, ornate, -75, 17, 35);
        makeBox(8, 34, 8, ornate, -125, 17, 35);
        makeBox(8, 34, 8, ornate, -75, 17, 65);

        // Roof detail — mansard style with small dormers
        makeCyl(3, 3, 5, 4, dark, -80, 37, 35);
        makeCyl(3, 3, 5, 4, dark, -120, 37, 35);
        makeCone(4, 5, 4, 0xC0A870, -80, 42, 35);
        makeCone(4, 5, 4, 0xC0A870, -120, 42, 35);

        // Entrance portico
        makeBox(20, 22, 8, facade, -100, 11, 37);
        makeCyl(2, 2, 18, 8, 0xF0EDE0, -92, 9, 33);
        makeCyl(2, 2, 18, 8, 0xF0EDE0, -100, 9, 33);
        makeCyl(2, 2, 18, 8, 0xF0EDE0, -108, 9, 33);

        // Balcony on facade
        makeBox(20, 2, 4, dark, -100, 20, 36);

        // Windows
        makeBox(4, 6, 1, 0x334455, -88, 14, 36);
        makeBox(4, 6, 1, 0x334455, -100, 14, 36);
        makeBox(4, 6, 1, 0x334455, -112, 14, 36);
    }

    function buildDambovitaRiver() {
        var water = 0x2A6A8A;
        var concrete = 0x808878;

        // River channel — long channelled section through city
        makeBox(600, 3, 20, water, -100, -1.5, 0);

        // Concrete embankment — north bank
        makeBox(600, 4, 6, concrete, -100, 2, -13);
        // Concrete embankment — south bank
        makeBox(600, 4, 6, concrete, -100, 2, 13);

        // Riverbank walkway — north
        makeBox(600, 0.5, 8, 0x9A9080, -100, 0.25, -20);
        // Riverbank walkway — south
        makeBox(600, 0.5, 8, 0x9A9080, -100, 0.25, 20);

        // Bridges over river
        makeBox(30, 3, 22, 0x9090A0, -50, 2.5, 0);
        makeBox(2, 8, 4, concrete, -55, 4, -8);
        makeBox(2, 8, 4, concrete, -45, 4, -8);

        makeBox(30, 3, 22, 0x9090A0, 150, 2.5, 0);
        makeBox(2, 8, 4, concrete, 145, 4, -8);
        makeBox(2, 8, 4, concrete, 155, 4, -8);

        makeBox(30, 3, 22, 0x9090A0, -250, 2.5, 0);
    }

    function buildHerastrauPark() {
        var grass = 0x3D7A32;
        var water = 0x2A5A7A;
        var path = 0xA09080;
        var wood = 0x8B6040;

        // Park ground
        makeBox(300, 0.5, 200, grass, 300, 0.25, 300);

        // Lake — large body of water
        makeBox(150, 0.3, 100, water, 300, 0.15, 300);

        // Park paths
        makeBox(200, 0.4, 5, path, 300, 0.35, 260);
        makeBox(5, 0.4, 200, path, 250, 0.35, 300);

        // Trees — clusters around the park
        makeCyl(2, 2, 12, 6, wood, 240, 6, 260);
        makeSphere(6, 6, 6, 0x2A6A20, 240, 15, 260);

        makeCyl(2, 2, 14, 6, wood, 260, 7, 270);
        makeSphere(7, 6, 6, 0x3A7A28, 260, 17, 270);

        makeCyl(2, 2, 10, 6, wood, 280, 5, 260);
        makeSphere(5, 6, 6, 0x2A6A20, 280, 13, 260);

        makeCyl(2, 2, 13, 6, wood, 350, 6.5, 260);
        makeSphere(6, 6, 6, 0x3A7A28, 350, 16, 260);

        makeCyl(2, 2, 11, 6, wood, 370, 5.5, 280);
        makeSphere(6, 6, 6, 0x2A6A20, 370, 14, 280);

        makeCyl(2, 2, 12, 6, wood, 320, 6, 350);
        makeSphere(6, 6, 6, 0x3A7A28, 320, 16, 350);

        makeCyl(2, 2, 10, 6, wood, 270, 5, 340);
        makeSphere(5, 6, 6, 0x2A6A20, 270, 13, 340);

        // Outdoor amphitheatre
        makeCyl(20, 25, 2, 0xC0B8A0, 380, 1, 350);
        makeBox(8, 4, 6, 0xD0C8B0, 380, 2, 338);

        // Boat dock
        makeBox(20, 1, 4, wood, 320, 0.5, 250);
        makeBox(2, 3, 2, wood, 314, 1.5, 250);

        // Park restaurant building
        makeBox(20, 8, 14, 0xD4C8A0, 400, 4, 280);
        makeBox(22, 2, 16, 0xC4B890, 400, 9, 280);
    }

    function buildRevolutionSquare() {
        var facade = 0xD4C8C0;
        var square = 0xC8BCA8;
        var monument = 0xE0D8D0;

        // Square pavement
        makeBox(120, 0.5, 100, square, -150, 0.25, 100);

        // Former Communist Party HQ building (now Senate)
        makeBox(80, 40, 30, facade, -150, 20, 80);
        // Stalinist neoclassical details
        makeBox(82, 4, 32, 0xC0B4A8, -150, 41, 80);
        makeBox(82, 4, 32, 0xC0B4A8, -150, 20, 80);

        // The famous balcony where Ceausescu gave last speech
        makeBox(16, 2, 4, 0xD0C8C0, -150, 28, 66);
        makeBox(18, 4, 2, 0xB8B0A8, -150, 26, 64);

        // Stalinist tower on top
        makeBox(20, 20, 20, facade, -150, 52, 80);
        makeBox(12, 10, 12, facade, -150, 67, 80);
        makeCyl(4, 6, 8, 8, 0xC8C0B8, -150, 76, 80);
        makeCone(5, 10, 8, 0xB8B0A8, -150, 82, 80);

        // Memorial of Rebirth monument — column with spike
        makeCyl(3, 3, 25, 8, monument, -150, 12.5, 120);
        makeCone(5, 12, 4, monument, -150, 27.5, 120);
        makeBox(1, 8, 1, 0xFFFFFF, -150, 35, 120);

        // University Library flanking building
        makeBox(40, 22, 20, 0xD0C8BC, -110, 11, 85);
        makeBox(42, 4, 22, 0xC0B8AC, -110, 23, 85);

        // Royal Palace / National Art Museum
        makeBox(50, 20, 24, 0xE0D8D0, -190, 10, 85);
        makeBox(52, 4, 26, 0xD0C8C0, -190, 21, 85);
        // Neoclassical columns on museum
        makeCyl(1.5, 1.5, 16, 8, 0xECE8E4, -178, 8, 74);
        makeCyl(1.5, 1.5, 16, 8, 0xECE8E4, -185, 8, 74);
        makeCyl(1.5, 1.5, 16, 8, 0xECE8E4, -192, 8, 74);
        makeCyl(1.5, 1.5, 16, 8, 0xECE8E4, -199, 8, 74);
    }

    function buildCaleaVictoriei() {
        var blvd = 0xD0C8B8;
        var stalinist = 0xB0A898;
        var artnouveau = 0xD4B888;
        var road = 0x3A3828;

        // The famous boulevard — runs north-south through city center
        makeBox(20, 0.5, 500, road, 0, 0.25, 100);

        // Sidewalks flanking boulevard
        makeBox(8, 0.4, 500, blvd, -14, 0.35, 100);
        makeBox(8, 0.4, 500, blvd, 14, 0.35, 100);

        // Stalinist-era residential blocks — massive repetitive blocks
        makeBox(40, 30, 20, stalinist, -40, 15, 50);
        makeBox(40, 28, 20, stalinist, -40, 14, 120);
        makeBox(40, 32, 20, stalinist, -40, 16, 190);
        makeBox(40, 30, 20, stalinist, 40, 15, 50);
        makeBox(40, 28, 20, stalinist, 40, 14, 120);
        makeBox(40, 32, 20, stalinist, 40, 16, 190);

        // Art Nouveau palaces interspersed
        makeBox(24, 20, 16, artnouveau, -40, 10, -40);
        makeBox(2, 22, 18, 0xC8A870, -28, 11, -40);
        makeCone(6, 8, 4, 0xBB9950, -40, 25, -40);

        makeBox(22, 18, 16, artnouveau, 40, 9, -40);
        makeCone(6, 8, 4, 0xBB9950, 40, 23, -40);

        // Lamp posts along Calea Victoriei
        makeCyl(0.5, 0.5, 9, 6, 0x707070, -10, 4.5, 20);
        makeCyl(0.5, 0.5, 9, 6, 0x707070, -10, 4.5, 80);
        makeCyl(0.5, 0.5, 9, 6, 0x707070, -10, 4.5, 140);
        makeCyl(0.5, 0.5, 9, 6, 0x707070, 10, 4.5, 20);
        makeCyl(0.5, 0.5, 9, 6, 0x707070, 10, 4.5, 80);
        makeCyl(0.5, 0.5, 9, 6, 0x707070, 10, 4.5, 140);

        // Lamp globes
        makeSphere(0.8, 6, 6, 0xFFFFCC, -10, 9.5, 20);
        makeSphere(0.8, 6, 6, 0xFFFFCC, -10, 9.5, 80);
        makeSphere(0.8, 6, 6, 0xFFFFCC, 10, 9.5, 20);
        makeSphere(0.8, 6, 6, 0xFFFFCC, 10, 9.5, 80);

        // Cercul Militar / grand hotel on boulevard
        makeBox(30, 24, 18, 0xE8E0D4, -45, 12, -80);
        makeBox(32, 4, 20, 0xD8D0C4, -45, 25, -80);
        makeCyl(1.8, 1.8, 20, 8, 0xECE8E4, -38, 10, -72);
        makeCyl(1.8, 1.8, 20, 8, 0xECE8E4, -45, 10, -72);
        makeCyl(1.8, 1.8, 20, 8, 0xECE8E4, -52, 10, -72);
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
