window.HexhamAbbey = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 21120;
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, seg, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildAbbey();
        buildOldGaol();
        buildMarketPlace();
        buildRacecourse();
        buildRiverTyne();
        buildHadriansWall();
        buildDyeHouse();
        buildQueensHall();
        buildTynedaleLandscape();
        buildTyneBridge();
    }

    function buildGround() {
        // Ground platform — large flat box as base terrain
        makeBox(1200, 4, 1200, 0x5a7a40, 0, -2, 0);
        // Town hill rise
        makeBox(600, 20, 600, 0x4a6a30, 0, 8, -80);
        // Lower valley floor
        makeBox(800, 4, 200, 0x3d6b30, 0, -4, 300);
    }

    function buildAbbey() {
        var sandstone = 0xD4C9B0;
        var darkstone = 0xB8A898;
        var roofgrey = 0x7a7a7a;

        // --- NAVE (Early English, long central body) ---
        makeBox(120, 28, 40, sandstone, 0, 14, -60);

        // Nave clerestory upper section
        makeBox(110, 8, 36, sandstone, 0, 32, -60);

        // Nave roof ridge (box standing tall)
        makeBox(112, 6, 4, roofgrey, 0, 38, -60);

        // Nave side aisle north
        makeBox(110, 16, 16, sandstone, 0, 8, -44);
        // Nave side aisle south
        makeBox(110, 16, 16, sandstone, 0, 8, -76);

        // --- TRANSEPTS (cruciform plan) ---
        // North transept
        makeBox(30, 30, 60, sandstone, -30, 15, -60);
        // South transept
        makeBox(30, 30, 60, sandstone, 30, 15, -60);

        // --- CROSSING TOWER (square with pinnacles) ---
        // Tower body
        makeBox(28, 50, 28, sandstone, 0, 25, -60);
        // Tower parapet
        makeBox(30, 4, 30, darkstone, 0, 52, -60);
        // Four corner pinnacles
        makeCyl(1.5, 1.5, 12, 4, sandstone, -13, 58, -73);
        makeCyl(1.5, 1.5, 12, 4, sandstone, 13, 58, -73);
        makeCyl(1.5, 1.5, 12, 4, sandstone, -13, 58, -47);
        makeCyl(1.5, 1.5, 12, 4, sandstone, 13, 58, -47);
        // Pinnacle cone caps
        makeCone(2, 5, 4, darkstone, -13, 65, -73);
        makeCone(2, 5, 4, darkstone, 13, 65, -73);
        makeCone(2, 5, 4, darkstone, -13, 65, -47);
        makeCone(2, 5, 4, darkstone, 13, 65, -47);

        // --- CHANCEL / CHOIR (east end) ---
        makeBox(40, 24, 36, sandstone, -60, 12, -60);
        // Chancel apse east termination
        makeCyl(12, 12, 24, 8, sandstone, -76, 12, -60);

        // --- SAXON CRYPT (underground, low box at east end) ---
        makeBox(20, 8, 18, 0xA09080, -60, -4, -60);
        // Crypt entrance arch stub
        makeBox(6, 5, 4, darkstone, -50, 0, -60);

        // --- NIGHT STAIR (stone staircase, north transept to dormitory) ---
        // Stair flights as stepped boxes
        makeBox(8, 2, 16, darkstone, -30, 2, -40);
        makeBox(8, 4, 14, darkstone, -30, 5, -36);
        makeBox(8, 6, 12, darkstone, -30, 8, -32);
        makeBox(8, 8, 10, darkstone, -30, 11, -28);
        makeBox(8, 10, 8, darkstone, -30, 14, -24);

        // Dormitory block (canon's dormitory above, north side)
        makeBox(30, 16, 20, sandstone, -30, 22, -20);

        // --- WEST FRONT & TOWERS ---
        makeBox(44, 32, 10, sandstone, 40, 16, -60);
        // West door surround
        makeBox(10, 14, 3, darkstone, 40, 7, -55);

        // --- CLOISTERS (square arcade south side) ---
        makeBox(50, 10, 4, sandstone, 15, 5, -82);
        makeBox(4, 10, 46, sandstone, -10, 5, -105);
        makeBox(50, 10, 4, sandstone, 15, 5, -128);
        makeBox(4, 10, 46, sandstone, 40, 5, -105);
        // Cloister garth ground
        makeBox(46, 1, 42, 0x8a9a60, 15, 0, -105);

        // --- BUTTRESSES on nave walls ---
        makeBox(4, 24, 6, darkstone, -10, 12, -42);
        makeBox(4, 24, 6, darkstone, 10, 12, -42);
        makeBox(4, 24, 6, darkstone, -10, 12, -78);
        makeBox(4, 24, 6, darkstone, 10, 12, -78);
    }

    function buildOldGaol() {
        var gaolstone = 0x8B7355;
        var darkgaol = 0x6B5335;

        // Main gaol building — 14th century, compact and grim
        makeBox(30, 24, 22, gaolstone, 90, 12, -50);
        // Gaol upper floor / parapet
        makeBox(32, 4, 24, darkgaol, 90, 25, -50);
        // Gaol corner turrets
        makeCyl(3, 3, 28, 6, gaolstone, 76, 14, -40);
        makeCyl(3, 3, 28, 6, gaolstone, 104, 14, -40);
        makeCyl(3, 3, 28, 6, gaolstone, 76, 14, -60);
        makeCyl(3, 3, 28, 6, gaolstone, 104, 14, -60);
        // Turret cone caps
        makeCone(3.5, 6, 6, darkgaol, 76, 30, -40);
        makeCone(3.5, 6, 6, darkgaol, 104, 30, -40);
        makeCone(3.5, 6, 6, darkgaol, 76, 30, -60);
        makeCone(3.5, 6, 6, darkgaol, 104, 30, -60);
        // Gaol entrance arch block
        makeBox(8, 10, 5, darkgaol, 90, 5, -39);
        // Adjacent gatehouse
        makeBox(12, 18, 12, gaolstone, 106, 9, -46);
    }

    function buildMarketPlace() {
        var vicsandstone = 0xD4C9B0;
        var cobble = 0xA09880;
        var mootgrey = 0x9a9a90;

        // Cobbled Market Place ground surface
        makeBox(80, 1, 80, cobble, 0, 0, 30);

        // --- VICTORIAN SHAMBLES (market hall) ---
        makeBox(40, 12, 18, vicsandstone, -10, 6, 30);
        // Shambles roof
        makeBox(42, 4, 20, 0x7a6a5a, -10, 14, 30);
        // Shambles arcade pillars
        makeCyl(1, 1, 12, 6, vicsandstone, -22, 6, 22);
        makeCyl(1, 1, 12, 6, vicsandstone, -14, 6, 22);
        makeCyl(1, 1, 12, 6, vicsandstone, -6, 6, 22);
        makeCyl(1, 1, 12, 6, vicsandstone, 2, 6, 22);

        // --- MOOT HALL (medieval, prominent tower) ---
        makeBox(18, 20, 14, mootgrey, 30, 10, 20);
        // Moot Hall tower
        makeBox(8, 32, 8, mootgrey, 30, 16, 20);
        // Moot Hall tower parapet
        makeBox(10, 3, 10, 0x7a7a7a, 30, 33, 20);
        makeCone(2, 5, 4, 0x6a6a6a, 30, 37, 20);

        // Market cross / obelisk
        makeBox(2, 14, 2, vicsandstone, 0, 7, 30);
        makeSphere(2, 6, 6, 0xC8B890, 0, 15, 30);

        // Market stall structures (low box rows)
        makeBox(30, 3, 6, 0x8B7355, -10, 1, 15);
        makeBox(30, 3, 6, 0x8B7355, -10, 1, 45);

        // --- ADJACENT TOWN BUILDINGS ---
        // Georgian terrace blocks around square
        makeBox(20, 16, 14, vicsandstone, -50, 8, 22);
        makeBox(20, 16, 14, vicsandstone, -50, 8, 40);
        makeBox(20, 14, 14, 0xC8B890, 46, 7, 22);
        makeBox(20, 14, 14, 0xC8B890, 46, 7, 40);
    }

    function buildRacecourse() {
        var grass = 0x4a7c3f;
        var fence = 0xC8A878;
        var white = 0xE0E0E0;

        // Hilltop base — racecourse sits elevated
        makeBox(400, 10, 200, 0x5a8a4a, 0, 3, -350);

        // Oval track surface (approximated with boxes)
        makeBox(280, 1, 16, grass, 0, 8, -290);
        makeBox(280, 1, 16, grass, 0, 8, -410);
        makeBox(16, 1, 104, grass, -132, 8, -350);
        makeBox(16, 1, 104, grass, 132, 8, -350);

        // Track rail fences (long thin boxes)
        makeBox(280, 2, 1, fence, 0, 9, -282);
        makeBox(280, 2, 1, fence, 0, 9, -418);
        makeBox(1, 2, 104, fence, -140, 9, -350);
        makeBox(1, 2, 104, fence, 140, 9, -350);

        // Grandstand main block
        makeBox(80, 16, 20, white, 60, 16, -290);
        // Grandstand tiered seating (stepped boxes)
        makeBox(78, 6, 8, 0xD0D0D0, 60, 14, -298);
        makeBox(78, 4, 6, 0xC8C8C8, 60, 17, -302);
        // Grandstand roof
        makeBox(82, 2, 22, 0x9a9a9a, 60, 24, -290);
        // Paddock enclosure
        makeBox(30, 1, 30, 0x4a7c3f, -80, 9, -310);
        makeBox(30, 3, 1, fence, -80, 10, -295);
        makeBox(30, 3, 1, fence, -80, 10, -325);

        // Jump fence hurdles (spaced along back straight)
        makeBox(20, 3, 2, 0x8B5E3C, -40, 9, -410);
        makeBox(20, 3, 2, 0x8B5E3C, 40, 9, -410);
        makeBox(20, 3, 2, 0x8B5E3C, 100, 9, -410);

        // Winning post
        makeCyl(0.5, 0.5, 12, 6, white, 100, 14, -282);
    }

    function buildRiverTyne() {
        var water = 0x006994;
        var bankgreen = 0x3d7030;
        var mudbank = 0x8B7050;

        // South Tyne river — wide blue band through valley
        makeBox(600, 2, 30, water, 0, -2, 220);
        makeBox(600, 2, 28, water, 0, -3, 250);
        makeBox(600, 2, 20, water, 0, -4, 275);

        // River banks
        makeBox(600, 6, 20, bankgreen, 0, -1, 200);
        makeBox(600, 6, 20, bankgreen, 0, -1, 290);

        // Mudflat / riverside low ground
        makeBox(200, 2, 14, mudbank, -100, -2, 215);
        makeBox(200, 2, 14, mudbank, 80, -2, 268);

        // River meander bend — extra water boxes at angle approximation
        makeBox(30, 2, 100, water, -240, -2, 248);
        makeBox(30, 2, 100, water, 240, -2, 248);
    }

    function buildTyneBridge() {
        var ironwork = 0x3a3a3a;
        var bridgestone = 0x9a8a7a;

        // Main road bridge deck
        makeBox(14, 3, 80, bridgestone, 0, 4, 248);
        // Bridge piers in river
        makeCyl(4, 5, 16, 6, bridgestone, -12, -4, 248);
        makeCyl(4, 5, 16, 6, bridgestone, 12, -4, 248);
        // Bridge railings
        makeBox(1, 3, 80, ironwork, -7, 7, 248);
        makeBox(1, 3, 80, ironwork, 7, 7, 248);
        // Bridge arch spans (low box approximating arch haunches)
        makeBox(14, 4, 12, ironwork, 0, 2, 218);
        makeBox(14, 4, 12, ironwork, 0, 2, 278);
    }

    function buildHadriansWall() {
        var wallstone = 0xC8B89A;
        var darkwall = 0xA89878;

        // Wall runs east-west on northern ridgeline
        makeBox(600, 6, 4, wallstone, 0, 16, -500);
        // Wall with higher parapet sections
        makeBox(80, 8, 4, wallstone, -200, 16, -500);
        makeBox(80, 8, 4, wallstone, 100, 16, -500);
        // Milecastle tower (small square fort)
        makeBox(12, 10, 12, darkwall, -60, 18, -500);
        makeBox(14, 3, 14, darkwall, -60, 24, -500);
        // Second milecastle
        makeBox(12, 10, 12, darkwall, 120, 18, -500);
        makeBox(14, 3, 14, darkwall, 120, 24, -500);
        // Turret stubs along wall
        makeBox(6, 8, 6, darkwall, 30, 17, -500);
        makeBox(6, 8, 6, darkwall, -150, 17, -500);
        // Northern ditch (vallum) — dark strip
        makeBox(600, 2, 8, 0x3a3020, 0, 13, -512);
        // Ridge terrain rise for wall
        makeBox(700, 14, 80, 0x4a5a30, 0, 6, -510);
    }

    function buildDyeHouse() {
        var brick = 0xCD5C5C;
        var darkbrick = 0xA03030;
        var chimneygrey = 0x808080;

        // Main dye works building — Victorian industrial
        makeBox(36, 18, 24, brick, 130, 9, -20);
        // Upper floor extension
        makeBox(20, 8, 24, brick, 138, 22, -20);
        // Factory chimney stack — tall cylinder
        makeCyl(2.5, 3, 40, 8, chimneygrey, 148, 20, -14);
        // Chimney top flare
        makeCyl(3.5, 2.5, 3, 8, darkbrick, 148, 41, -14);
        // Loading bay lean-to
        makeBox(14, 10, 10, darkbrick, 118, 5, -20);
        // Water tank on roof
        makeCyl(4, 4, 6, 8, 0x6a6a8a, 132, 28, -26);
        // Outbuilding / store
        makeBox(16, 10, 14, brick, 116, 5, -8);
    }

    function buildQueensHall() {
        var concrete = 0xD3D3D3;
        var darkglass = 0x2a3a4a;
        var accent = 0xB0B0B0;

        // Main hall block — arts centre, modernised but Georgian shell
        makeBox(38, 16, 28, concrete, -90, 8, -30);
        // Upper rehearsal room
        makeBox(28, 8, 20, accent, -90, 20, -30);
        // Entrance canopy
        makeBox(16, 3, 8, accent, -90, 15, -18);
        // Entrance pillars
        makeCyl(1.2, 1.2, 14, 6, concrete, -96, 7, -18);
        makeCyl(1.2, 1.2, 14, 6, concrete, -84, 7, -18);
        // Glazed foyer section (dark box)
        makeBox(12, 14, 8, darkglass, -75, 7, -26);
        // Roof parapet detail
        makeBox(40, 2, 30, accent, -90, 16, -30);
        // Side wing
        makeBox(14, 12, 22, concrete, -112, 6, -30);
    }

    function buildTynedaleLandscape() {
        var darkwood = 0x2d5020;
        var midwood = 0x3d6b30;
        var lightwood = 0x4a7c40;
        var hillside = 0x506030;

        // Wooded valley sides — clusters of tree-sphere on cylinder trunk forms

        // North valley side tree line
        makeSphere(8, 6, 6, darkwood, -200, 28, -180);
        makeSphere(9, 6, 6, midwood, -170, 25, -195);
        makeSphere(7, 6, 6, lightwood, -140, 22, -190);
        makeSphere(10, 6, 6, darkwood, -110, 20, -185);
        makeSphere(8, 6, 6, midwood, -80, 18, -180);
        makeSphere(9, 6, 6, darkwood, 80, 18, -175);
        makeSphere(7, 6, 6, lightwood, 120, 22, -185);
        makeSphere(10, 6, 6, midwood, 160, 25, -190);
        makeSphere(8, 6, 6, darkwood, 200, 28, -175);

        // South valley side tree line (near river)
        makeSphere(7, 6, 6, midwood, -180, 16, 160);
        makeSphere(9, 6, 6, darkwood, -150, 14, 165);
        makeSphere(8, 6, 6, lightwood, -120, 12, 160);
        makeSphere(7, 6, 6, midwood, -90, 10, 162);
        makeSphere(9, 6, 6, darkwood, 90, 10, 158);
        makeSphere(8, 6, 6, lightwood, 140, 14, 163);
        makeSphere(7, 6, 6, midwood, 180, 16, 158);

        // Tree trunks for north valley
        makeCyl(1, 1, 16, 5, 0x5a3a1a, -200, 12, -180);
        makeCyl(1, 1, 14, 5, 0x5a3a1a, -170, 10, -195);
        makeCyl(1, 1, 12, 5, 0x5a3a1a, -140, 9, -190);
        makeCyl(1, 1, 12, 5, 0x5a3a1a, 80, 8, -175);
        makeCyl(1, 1, 14, 5, 0x5a3a1a, 160, 10, -190);

        // Valley hillside slope terrain
        makeBox(600, 30, 100, hillside, 0, -8, -250);
        makeBox(600, 20, 80, hillside, 0, -6, 150);

        // Additional farm buildings on hillside
        makeBox(16, 8, 12, 0xC8B090, -180, 10, -220);
        makeBox(10, 5, 20, 0xA89060, -180, 2, -205);

        // Field patterns (low boxes of different greens)
        makeBox(80, 1, 60, 0x5a8a40, -250, 1, -300);
        makeBox(80, 1, 60, 0x4a7a30, -160, 1, -300);
        makeBox(80, 1, 60, 0x60903a, -80, 1, -310);
        makeBox(80, 1, 60, 0x507a35, 0, 1, -305);
        makeBox(80, 1, 60, 0x4a8030, 80, 1, -300);
        makeBox(80, 1, 60, 0x568838, 160, 1, -295);
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
