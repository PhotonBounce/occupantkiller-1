window.PragueCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 22760;
    var CY = 0;
    var CZ = 0;

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = makeMesh(geo, color);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function sph(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mesh = makeMesh(geo, color);
        mesh.position.set(CX + x, CY + y, CZ + z);
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
        buildVltavaRiver();
        buildPragueCastle();
        buildStVitusCathedral();
        buildRoyalPalace();
        buildStGeorgeBasilica();
        buildGoldenLane();
        buildCharlesBridge();
        buildOldTownSquare();
        buildAstronomicalClock();
        buildTynChurch();
        buildPowderTower();
        buildWenceslasSquare();
        buildVysehrad();
        buildLesserTown();
        buildSwans();
    }

    function buildGround() {
        // Ground plane made of large boxes
        box(2000, 2, 1200, 0x4A7C4A, 0, -1, 0);
        // Cobblestone streets - dark grey base
        box(800, 1, 400, 0x696969, -100, 0, 50);
        box(600, 1, 200, 0x707070, 200, 0, -100);
    }

    function buildVltavaRiver() {
        // Main river body
        box(1200, 3, 80, 0x4682B4, -50, -1, 20);
        // River banks
        box(1200, 4, 12, 0x8B7355, -50, -1, -20);
        box(1200, 4, 12, 0x8B7355, -50, -1, 62);
        // River shimmer surface
        box(1200, 1, 78, 0x5B92C0, -50, 1, 21);
        // Wider bend section
        box(200, 3, 110, 0x4682B4, 300, -1, 15);
        box(200, 3, 110, 0x5B92C0, 300, 0, 15);
    }

    function buildSwans() {
        // White swans on the Vltava
        sph(1.5, 6, 6, 0xFFFFFF, -200, 2, 22);
        cyl(0.4, 0.3, 2.5, 6, 0xFFFFFF, -200, 3.5, 22);
        sph(0.8, 5, 5, 0xFFFFFF, -200, 4.8, 22);
        sph(1.5, 6, 6, 0xFFFFFF, -190, 2, 26);
        cyl(0.4, 0.3, 2.5, 6, 0xFFFFFF, -190, 3.5, 26);
        sph(0.8, 5, 5, 0xFFFFFF, -190, 4.8, 26);
        sph(1.5, 6, 6, 0xFFFFFF, -210, 2, 18);
        cyl(0.4, 0.3, 2.5, 6, 0xFFFFFF, -210, 3.5, 18);
        sph(0.8, 5, 5, 0xFFFFFF, -210, 4.8, 18);
    }

    function buildPragueCastle() {
        // Castle hill base
        box(280, 30, 160, 0xA89060, -300, 14, -100);
        // Main castle outer wall north
        box(280, 18, 6, 0xD4C8A0, -300, 24, -178);
        // Main castle outer wall south
        box(280, 18, 6, 0xD4C8A0, -300, 24, -22);
        // Main castle outer wall west
        box(6, 18, 162, 0xD4C8A0, -441, 24, -100);
        // Main castle outer wall east
        box(6, 18, 162, 0xD4C8A0, -159, 24, -100);
        // Castle courtyard ground
        box(260, 2, 140, 0xC8B88A, -300, 30, -100);
        // Corner towers
        cyl(5, 6, 24, 8, 0xD4C8A0, -440, 41, -177);
        cone(5.5, 10, 8, 0x8B0000, -440, 53, -177);
        cyl(5, 6, 24, 8, 0xD4C8A0, -160, 41, -177);
        cone(5.5, 10, 8, 0x8B0000, -160, 53, -177);
        cyl(5, 6, 24, 8, 0xD4C8A0, -440, 41, -23);
        cone(5.5, 10, 8, 0x8B0000, -440, 53, -23);
        cyl(5, 6, 24, 8, 0xD4C8A0, -160, 41, -23);
        cone(5.5, 10, 8, 0x8B0000, -160, 53, -23);
        // Castle gate arch
        box(22, 18, 6, 0xD4C8A0, -300, 38, -22);
        box(8, 12, 6, 0x222222, -300, 35, -22);
        // Main keep
        box(60, 35, 50, 0xD4C8A0, -280, 47, -100);
        // Keep battlements
        box(62, 5, 4, 0xD4C8A0, -280, 67, -75);
        box(62, 5, 4, 0xD4C8A0, -280, 67, -125);
        box(4, 5, 50, 0xD4C8A0, -249, 67, -100);
        box(4, 5, 50, 0xD4C8A0, -311, 67, -100);
    }

    function buildStVitusCathedral() {
        // Nave body
        box(90, 50, 40, 0xC8C0A0, -330, 54, -110);
        // Choir apse
        box(30, 45, 30, 0xC8C0A0, -385, 51, -110);
        // Transept arms
        box(30, 40, 70, 0xC8C0A0, -340, 49, -110);
        // Central crossing tower
        box(18, 70, 18, 0xC8C0A0, -330, 64, -110);
        cone(9, 28, 8, 0x556B2F, -330, 99, -110);
        // NORTH Gothic spire (twin)
        cyl(4, 5, 80, 8, 0xB8B0A0, -312, 69, -90);
        cone(4, 22, 8, 0x556B2F, -312, 109, -90);
        // SOUTH Gothic spire (twin)
        cyl(4, 5, 80, 8, 0xB8B0A0, -312, 69, -130);
        cone(4, 22, 8, 0x556B2F, -312, 109, -130);
        // Flying buttress stubs north side
        box(6, 4, 14, 0xB8B0A0, -318, 62, -92);
        box(6, 4, 14, 0xB8B0A0, -330, 62, -92);
        box(6, 4, 14, 0xB8B0A0, -342, 62, -92);
        // Flying buttress stubs south side
        box(6, 4, 14, 0xB8B0A0, -318, 62, -128);
        box(6, 4, 14, 0xB8B0A0, -330, 62, -128);
        box(6, 4, 14, 0xB8B0A0, -342, 62, -128);
        // Gargoyle stubs
        box(3, 3, 8, 0x888888, -315, 68, -96);
        box(3, 3, 8, 0x888888, -315, 68, -124);
        box(3, 3, 8, 0x888888, -350, 68, -96);
        box(3, 3, 8, 0x888888, -350, 68, -124);
        // Rose window circle
        cyl(6, 6, 2, 16, 0x4466AA, -284, 68, -110);
    }

    function buildRoyalPalace() {
        // Main palace block
        box(80, 28, 40, 0xD4C8A0, -240, 43, -100);
        // Palace roof
        box(82, 8, 42, 0x8B4513, -240, 57, -100);
        // Palace windows (dark boxes)
        box(5, 7, 2, 0x223344, -220, 43, -80);
        box(5, 7, 2, 0x223344, -235, 43, -80);
        box(5, 7, 2, 0x223344, -250, 43, -80);
        box(5, 7, 2, 0x223344, -265, 43, -80);
        // Wing extensions
        box(30, 22, 25, 0xD4C8A0, -195, 40, -100);
        box(30, 22, 25, 0xD4C8A0, -285, 40, -100);
    }

    function buildStGeorgeBasilica() {
        // Romanesque nave
        box(45, 24, 22, 0xC87020, -210, 41, -155);
        // Apse
        cyl(8, 9, 22, 10, 0xC87020, -232, 40, -155);
        // North tower
        box(10, 40, 10, 0xC87020, -195, 49, -148);
        cone(5, 12, 6, 0xB06010, -195, 69, -148);
        // South tower
        box(10, 40, 10, 0xC87020, -195, 49, -162);
        cone(5, 12, 6, 0xB06010, -195, 69, -162);
        // Romanesque arched entrance
        box(12, 15, 3, 0xC87020, -188, 36, -155);
    }

    function buildGoldenLane() {
        // Row of tiny colourful houses along castle wall
        box(12, 10, 10, 0xFFD700, -380, 34, -25);
        box(12, 10, 10, 0xFF6B35, -367, 34, -25);
        box(12, 10, 10, 0x6DB33F, -354, 34, -25);
        box(12, 10, 10, 0x4FC3F7, -341, 34, -25);
        box(12, 10, 10, 0xFF8C94, -328, 34, -25);
        box(12, 10, 10, 0xFFD700, -315, 34, -25);
        // Tiny roofs
        box(13, 4, 11, 0x8B4513, -380, 39, -25);
        box(13, 4, 11, 0xAA3311, -367, 39, -25);
        box(13, 4, 11, 0x556B2F, -354, 39, -25);
        box(13, 4, 11, 0x1A6B8A, -341, 39, -25);
        box(13, 4, 11, 0xAA2244, -328, 39, -25);
        box(13, 4, 11, 0x8B4513, -315, 39, -25);
    }

    function buildCharlesBridge() {
        // Bridge deck
        box(400, 5, 18, 0x888888, -50, 2, 21);
        // Bridge arches (pylons represented as boxes below deck)
        box(8, 8, 20, 0x777777, -130, -2, 21);
        box(8, 8, 20, 0x777777, -90, -2, 21);
        box(8, 8, 20, 0x777777, -50, -2, 21);
        box(8, 8, 20, 0x777777, -10, -2, 21);
        box(8, 8, 20, 0x777777, 30, -2, 21);
        box(8, 8, 20, 0x777777, 70, -2, 21);
        box(8, 8, 20, 0x777777, 110, -2, 21);
        box(8, 8, 20, 0x777777, 150, -2, 21);
        // Old Town bridge tower
        box(12, 40, 12, 0x666666, 148, 22, 21);
        box(16, 6, 16, 0x666666, 148, 42, 21);
        cone(7, 16, 6, 0x444444, 148, 50, 21);
        // Lesser Town bridge tower (smaller/older)
        box(10, 34, 10, 0x777777, -148, 19, 21);
        cone(6, 14, 6, 0x555555, -148, 43, 21);
        // Bridge railings
        box(400, 3, 1, 0x999999, -50, 6, 12);
        box(400, 3, 1, 0x999999, -50, 6, 30);
        // Baroque statues on bridge (simplified as cylinders with spheres)
        box(2, 8, 2, 0x999999, -120, 7, 13);
        sph(1.5, 5, 5, 0x999999, -120, 12, 13);
        box(2, 8, 2, 0x999999, -80, 7, 13);
        sph(1.5, 5, 5, 0x999999, -80, 12, 13);
        box(2, 8, 2, 0x999999, -40, 7, 13);
        sph(1.5, 5, 5, 0x999999, -40, 12, 13);
        box(2, 8, 2, 0x999999, 0, 7, 13);
        sph(1.5, 5, 5, 0x999999, 0, 12, 13);
        box(2, 8, 2, 0x999999, 40, 7, 13);
        sph(1.5, 5, 5, 0x999999, 40, 12, 13);
        box(2, 8, 2, 0x999999, 80, 7, 13);
        sph(1.5, 5, 5, 0x999999, 80, 12, 13);
        box(2, 8, 2, 0x999999, 120, 7, 13);
        sph(1.5, 5, 5, 0x999999, 120, 12, 13);
        // Cruciform lanterns
        box(1, 14, 1, 0xCCAA44, -100, 11, 21);
        box(5, 1, 1, 0xCCAA44, -100, 16, 21);
        box(1, 14, 1, 0xCCAA44, 20, 11, 21);
        box(5, 1, 1, 0xCCAA44, 20, 16, 21);
    }

    function buildOldTownSquare() {
        // Square paving
        box(120, 1, 120, 0xDEB887, 200, 0.5, 80);
        // Old Town Hall tower (for Orloj)
        box(14, 60, 14, 0xCDAA7D, 190, 30, 80);
        box(18, 5, 18, 0xCDAA7D, 190, 62, 80);
        // Hall building
        box(60, 22, 18, 0xDEB887, 220, 11, 80);
        // Surrounding buildings
        box(30, 20, 14, 0xE8C890, 160, 10, 55);
        box(25, 18, 12, 0xD4A870, 155, 9, 100);
        box(35, 24, 15, 0xE0C080, 250, 12, 62);
        box(28, 20, 15, 0xDDB870, 252, 10, 100);
        // Jan Hus monument in square center
        box(6, 2, 6, 0x888888, 200, 1.5, 80);
        cyl(1, 1.5, 12, 6, 0x777777, 200, 8, 80);
        sph(2.5, 7, 7, 0x888888, 200, 15, 80);
    }

    function buildAstronomicalClock() {
        // Clock face on Old Town Hall
        cyl(5, 5, 1, 24, 0x1A3A8A, 190, 28, 66);
        // Outer zodiac ring
        cyl(6.5, 6.5, 0.5, 24, 0xB8860B, 190, 28, 66);
        // Inner solar dial
        cyl(3, 3, 0.8, 16, 0xFFD700, 190, 28, 66);
        // Clock hands
        box(0.5, 5, 0.5, 0xFFD700, 190, 31, 66);
        box(0.5, 4, 0.5, 0xFF4444, 190, 29, 66);
        // Upper smaller calendar dial
        cyl(4, 4, 0.8, 20, 0x2244AA, 190, 36, 66);
        cyl(5, 5, 0.4, 20, 0xB8860B, 190, 36, 66);
        // Death skeleton figure
        box(1.5, 5, 1.5, 0xFFFFCC, 184, 26, 66);
        sph(1, 5, 5, 0xFFFFCC, 184, 29, 66);
        // Tower top spire
        cone(7, 14, 6, 0x556B2F, 190, 68, 80);
    }

    function buildTynChurch() {
        // Church nave
        box(50, 32, 28, 0xAAAAAA, 230, 16, 68);
        // North tower
        cyl(5, 6, 70, 8, 0xAAAAAA, 215, 35, 58);
        cone(5, 20, 8, 0x888888, 215, 71, 58);
        // Gold finial north
        sph(1.5, 5, 5, 0xFFD700, 215, 82, 58);
        // South tower
        cyl(5, 6, 70, 8, 0xAAAAAA, 215, 35, 78);
        cone(5, 20, 8, 0x888888, 215, 71, 78);
        // Gold finial south
        sph(1.5, 5, 5, 0xFFD700, 215, 82, 78);
        // Apse east end
        box(16, 26, 26, 0xAAAAAA, 255, 13, 68);
        // Gothic window tracery suggestion
        box(4, 14, 2, 0x334466, 230, 16, 54);
        box(4, 14, 2, 0x334466, 230, 16, 82);
    }

    function buildPowderTower() {
        // Gate tower
        box(20, 55, 20, 0x888888, 320, 27, 70);
        // Tower cap
        box(24, 6, 24, 0x777777, 320, 57, 70);
        // Gothic spire crown
        cone(10, 28, 8, 0x666666, 320, 74, 70);
        // Corner turrets
        cyl(3, 3.5, 20, 6, 0x888888, 310, 37, 60);
        cone(3, 9, 6, 0x666666, 310, 48, 60);
        cyl(3, 3.5, 20, 6, 0x888888, 330, 37, 60);
        cone(3, 9, 6, 0x666666, 330, 48, 60);
        cyl(3, 3.5, 20, 6, 0x888888, 310, 37, 80);
        cone(3, 9, 6, 0x666666, 310, 48, 80);
        cyl(3, 3.5, 20, 6, 0x888888, 330, 37, 80);
        cone(3, 9, 6, 0x666666, 330, 48, 80);
        // Gate passage
        box(10, 16, 22, 0x333333, 320, 27, 70);
    }

    function buildWenceslasSquare() {
        // Boulevard paving (long rectangle)
        box(250, 1, 60, 0xDEB887, 450, 0.5, 60);
        // Median strip
        box(240, 1, 14, 0x4A7C4A, 450, 1, 60);
        // National Museum at top end
        box(80, 35, 45, 0xE8D8A0, 570, 17, 60);
        // Museum dome
        cyl(12, 14, 12, 12, 0xD4C090, 570, 40, 60);
        sph(8, 10, 10, 0xC8B880, 570, 48, 60);
        // Museum stairs
        box(84, 5, 12, 0xD8C890, 570, 2, 40);
        // Wenceslas statue
        box(4, 3, 4, 0x888888, 480, 1, 60);
        cyl(1.2, 1.5, 10, 6, 0x777777, 480, 7, 60);
        sph(2, 6, 6, 0x888888, 480, 13, 60);
        // Street trees
        cyl(1, 1, 8, 6, 0x4A2800, 420, 5, 50);
        sph(4, 6, 6, 0x228B22, 420, 11, 50);
        cyl(1, 1, 8, 6, 0x4A2800, 450, 5, 50);
        sph(4, 6, 6, 0x228B22, 450, 11, 50);
        cyl(1, 1, 8, 6, 0x4A2800, 480, 5, 70);
        sph(4, 6, 6, 0x228B22, 480, 11, 70);
        // Buildings lining the boulevard
        box(25, 22, 18, 0xE0C870, 360, 11, 42);
        box(30, 26, 18, 0xD4B860, 395, 13, 42);
        box(25, 20, 18, 0xE8D080, 360, 10, 78);
        box(30, 24, 18, 0xCCAA50, 395, 12, 78);
    }

    function buildVysehrad() {
        // Vysehrad hill
        box(200, 25, 120, 0x8B7355, 500, 11, -150);
        // Fortress walls
        box(200, 12, 5, 0xD4C8A0, 500, 30, -195);
        box(200, 12, 5, 0xD4C8A0, 500, 30, -95);
        box(5, 12, 100, 0xD4C8A0, 401, 30, -145);
        box(5, 12, 100, 0xD4C8A0, 599, 30, -145);
        // SS Peter and Paul church
        box(35, 30, 20, 0xD4C8A0, 500, 42, -145);
        // North spire
        cyl(3.5, 4, 45, 8, 0xD4C8A0, 492, 57, -137);
        cone(3.5, 16, 8, 0x445522, 492, 80, -137);
        // South spire
        cyl(3.5, 4, 45, 8, 0xD4C8A0, 492, 57, -153);
        cone(3.5, 16, 8, 0x445522, 492, 80, -153);
        // Church apse
        cyl(8, 9, 24, 10, 0xD4C8A0, 518, 42, -145);
        // Corner rotunda stub
        cyl(6, 7, 18, 10, 0xC8B890, 530, 35, -170);
        cone(6, 10, 10, 0x8B4513, 530, 49, -170);
    }

    function buildLesserTown() {
        // Mala Strana - orange-roofed Baroque district below castle
        // Main district ground
        box(160, 2, 100, 0xC87020, -200, 1, -50);
        // Baroque houses
        box(22, 18, 14, 0xD4882A, -160, 9, -30);
        box(22, 6, 15, 0xC87020, -160, 21, -30);
        box(22, 18, 14, 0xCC8020, -182, 9, -30);
        box(22, 6, 15, 0xB87018, -182, 21, -30);
        box(22, 18, 14, 0xDA9030, -204, 9, -30);
        box(22, 6, 15, 0xC88020, -204, 21, -30);
        box(22, 18, 14, 0xD08030, -226, 9, -30);
        box(22, 6, 15, 0xBB7010, -226, 21, -30);
        // St Nicholas Church dome
        box(30, 25, 25, 0xD4C8A0, -200, 12, -70);
        cyl(10, 12, 15, 16, 0x88AA44, -200, 32, -70);
        sph(8, 12, 12, 0x6B9930, -200, 42, -70);
        // Lantern top
        cyl(3, 3, 8, 8, 0xD4C8A0, -200, 49, -70);
        cone(3, 6, 8, 0x88AA44, -200, 55, -70);
        // Baroque towers
        cyl(4, 5, 38, 8, 0xCDBB90, -186, 19, -70);
        cone(4, 12, 8, 0x88AA44, -186, 38, -70);
        cyl(4, 5, 38, 8, 0xCDBB90, -214, 19, -70);
        cone(4, 12, 8, 0x88AA44, -214, 38, -70);
        // Cobbled lanes
        box(120, 1, 10, 0x707070, -200, 1, -25);
        box(10, 1, 80, 0x686868, -160, 1, -65);
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
