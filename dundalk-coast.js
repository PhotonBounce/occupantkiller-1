window.DundalkCoast = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18600;
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

    function box(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function cyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function cone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function sphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildDundalkBay();
        buildCarlingfordLough();
        buildCooleyMountains();
        buildDundalkTown();
        buildStPatricksCathedral();
        buildMBNAStadium();
        buildPortDundalk();
        buildProleekDolmen();
        buildCuchulainnStatue();
        buildCarlingfordTown();
        buildNarrowWaterCastle();
    }

    function buildGround() {
        // Large flat ground base as thin box slabs (BoxGeometry only)
        // Main terrain ground slab
        box(2400, 6, 2400, 0x5D7C3F, 0, -3, 0);

        // Coastal flat land strip near bay
        box(800, 4, 600, 0x8B9D5A, -300, -1, 300);

        // Inland agricultural fields
        box(600, 4, 400, 0x6A8C3E, 200, -1, -100);
        box(500, 4, 350, 0x7A9E4A, 400, -1, 200);
        box(450, 4, 300, 0x5E7A32, -100, -1, -300);
    }

    function buildDundalkBay() {
        // Wide tidal bay — big flat box for water surface
        box(900, 8, 700, 0x006994, -500, -4, 500);

        // Mudflats at low tide — brown flat areas around bay edges
        box(300, 5, 200, 0x8B7355, -280, -3, 480);
        box(250, 5, 180, 0x8B7355, -460, -3, 350);
        box(200, 5, 150, 0x9E8B6A, -350, -3, 620);

        // Sea surface shimmer — layered thin slabs
        box(400, 3, 300, 0x1A7FA8, -520, -2, 520);
        box(200, 3, 150, 0x0A6080, -600, -2, 450);

        // Shoreline edge — low ridge box
        box(700, 12, 20, 0x9C8A6B, -200, 3, 180);

        // Beach / strand strip
        box(600, 5, 60, 0xC2B280, -250, -1, 210);
    }

    function buildCarlingfordLough() {
        // Main lough body stretching south
        box(300, 8, 1200, 0x1E6BA8, 500, -4, 400);

        // Northern inlet
        box(200, 6, 300, 0x1A5E96, 420, -3, -100);

        // Southern mouth widening
        box(450, 8, 400, 0x1E6BA8, 560, -4, 800);

        // Lough surface detail
        box(150, 4, 500, 0x246EB0, 480, -2, 500);

        // Mourne mountains silhouette on far shore (east side of lough)
        box(400, 220, 60, 0x4A5840, 760, 106, 400);
        box(300, 180, 50, 0x3E4E34, 820, 86, 200);
        box(350, 200, 55, 0x4A5840, 800, 96, 650);
    }

    function buildCooleyMountains() {
        // Main mountain ridge — series of overlapping box masses
        // Slieve Foye — tallest and most prominent peak
        box(300, 420, 260, 0x556B2F, 320, 207, -400);
        // Slieve Foye upper peak cap
        box(120, 100, 100, 0x4A5E28, 320, 457, -400);
        cone(55, 80, 6, 0x3D4F22, 320, 537, -400);

        // Ridge extending west
        box(250, 320, 200, 0x4E6128, 100, 157, -380);
        box(200, 280, 180, 0x4A5C26, -60, 137, -360);
        box(180, 240, 160, 0x506630, -200, 117, -340);

        // Ridge extending east towards Carlingford
        box(220, 360, 200, 0x4D622A, 480, 177, -380);
        box(200, 300, 180, 0x495E26, 620, 147, -340);

        // Foothills and lower slopes
        box(400, 120, 300, 0x607838, 200, 57, -200);
        box(350, 90, 280, 0x5A7032, 50, 42, -180);
        box(300, 70, 250, 0x648040, 380, 32, -180);

        // Mountain vegetation texture — scattered sphere clumps
        sphere(30, 6, 5, 0x3D6020, 280, 250, -430);
        sphere(25, 6, 5, 0x4A7030, 340, 280, -420);
        sphere(20, 6, 5, 0x395C1E, 250, 220, -410);

        // Heather moorland plateau
        box(280, 30, 200, 0x7B6B8A, 300, 330, -440);
    }

    function buildDundalkTown() {
        // Georgian / Victorian streetscapes — rows of terrace blocks

        // Main Street north row
        box(200, 28, 22, 0xCD5C5C, 0, 11, 10);
        box(180, 24, 20, 0xB85555, -180, 9, 12);
        box(160, 30, 22, 0xCC6060, 160, 12, 10);

        // Main Street south row
        box(200, 26, 22, 0xD06060, 0, 10, -10);
        box(150, 28, 20, 0xC85858, -160, 11, -12);
        box(170, 24, 22, 0xBF5252, 170, 9, -12);

        // Market Square area
        box(120, 22, 120, 0xC0585A, -20, 8, 80);

        // Cross street terraces
        box(22, 26, 160, 0xD05E5E, -120, 10, 100);
        box(22, 24, 140, 0xC85C5C, 120, 9, 100);

        // Town hall / civic building
        box(70, 38, 55, 0xB0B0A8, -20, 17, 60);
        // Portico columns
        cyl(3, 3, 30, 8, 0xD8D8D0, -35, 13, 30);
        cyl(3, 3, 30, 8, 0xD8D8D0, -20, 13, 30);
        cyl(3, 3, 30, 8, 0xD8D8D0, -5, 13, 30);
        // Dome
        sphere(18, 8, 6, 0xA8A8A0, -20, 42, 58);

        // Georgian townhouses
        box(40, 32, 16, 0xC85050, -260, 13, 20);
        box(40, 32, 16, 0xD06060, -300, 13, 20);
        box(40, 32, 16, 0xBF5050, -340, 13, 20);

        // Victorian commercial block
        box(90, 36, 30, 0x9E5050, 220, 15, 60);

        // Narrow back streets — thin wall blocks
        box(12, 18, 80, 0xA85050, 70, 6, 90);
        box(80, 18, 12, 0xB05252, 80, 6, 130);
    }

    function buildStPatricksCathedral() {
        // Main nave — bold Gothic body
        box(55, 65, 120, 0x808080, 60, 30, -80);

        // Transepts
        box(110, 50, 28, 0x808080, 60, 22, -60);

        // Choir / chancel
        box(38, 55, 45, 0x858585, 60, 25, -125);

        // West tower — tall central tower
        box(22, 110, 22, 0x787878, 60, 53, -35);
        // Tower battlements cap
        box(28, 8, 28, 0x787878, 60, 112, -35);

        // Twin front facade towers
        box(16, 90, 16, 0x808080, 38, 43, -28);
        box(16, 90, 16, 0x808080, 82, 43, -28);

        // Gothic spires on front towers
        cone(9, 55, 4, 0x707070, 38, 100, -28);
        cone(9, 55, 4, 0x707070, 82, 100, -28);

        // Main central spire
        cone(12, 75, 4, 0x686868, 60, 122, -35);

        // Nave buttresses
        box(8, 50, 8, 0x7A7A7A, 40, 23, -70);
        box(8, 50, 8, 0x7A7A7A, 80, 23, -70);
        box(8, 50, 8, 0x7A7A7A, 40, 23, -100);
        box(8, 50, 8, 0x7A7A7A, 80, 23, -100);

        // Rose window recess (thin box inset)
        box(14, 14, 3, 0x5A5A5A, 60, 70, -25);
    }

    function buildMBNAStadium() {
        // MBNA Oriel Park — football stadium
        // Main stand (west)
        box(180, 22, 24, 0xC0C0C0, -180, 9, -180);
        // East stand
        box(180, 18, 20, 0xB8B8B8, -180, 7, -230);
        // North stand
        box(20, 16, 55, 0xC0C0C0, -265, 6, -205);
        // South stand
        box(20, 16, 55, 0xC0C0C0, -95, 6, -205);

        // Pitch (green box)
        box(168, 2, 105, 0x2E8B2E, -180, -1, -205);
        // Pitch markings (thin white strips)
        box(168, 1, 2, 0xFFFFFF, -180, 1, -205);
        box(2, 1, 105, 0xFFFFFF, -180, 1, -205);

        // Floodlight pylons
        box(4, 48, 4, 0xA0A0A0, -268, 22, -168);
        box(4, 48, 4, 0xA0A0A0, -92, 22, -168);
        box(4, 48, 4, 0xA0A0A0, -268, 22, -242);
        box(4, 48, 4, 0xA0A0A0, -92, 22, -242);
        // Lamp heads
        box(14, 4, 8, 0xE8E8B0, -268, 48, -168);
        box(14, 4, 8, 0xE8E8B0, -92, 48, -168);
        box(14, 4, 8, 0xE8E8B0, -268, 48, -242);
        box(14, 4, 8, 0xE8E8B0, -92, 48, -242);

        // Stadium roof canopy (thin overhang boxes)
        box(184, 4, 10, 0xD8D8D8, -180, 22, -183);
        box(184, 4, 8, 0xD0D0D0, -180, 19, -227);
    }

    function buildPortDundalk() {
        // Commercial harbour / port area

        // Quay wall — long stone revetment
        box(500, 14, 18, 0x696969, -400, 4, 200);

        // Harbour basin water
        box(250, 6, 180, 0x1A5580, -380, -3, 140);

        // Container crane 1 — lattice tower from BoxGeometry
        box(8, 80, 8, 0xFF8C00, -320, 38, 195);
        box(8, 80, 8, 0xFF8C00, -360, 38, 195);
        // Crane cross beam
        box(60, 6, 6, 0xFF8C00, -340, 80, 195);
        // Crane jib extending seaward
        box(40, 5, 5, 0xE07800, -300, 82, 195);
        // Crane cabin
        box(14, 12, 12, 0xCC6600, -340, 68, 195);
        // Hoist cable box
        box(3, 30, 3, 0x888888, -312, 66, 195);

        // Container crane 2
        box(8, 70, 8, 0xFF8C00, -450, 33, 200);
        box(8, 70, 8, 0xFF8C00, -490, 33, 200);
        box(60, 5, 5, 0xFF8C00, -470, 72, 200);
        box(3, 25, 3, 0x888888, -442, 59, 200);

        // Warehouse sheds
        box(80, 20, 40, 0x808080, -350, 8, 240);
        box(70, 18, 40, 0x787878, -440, 7, 240);

        // Container stacks (colourful boxes)
        box(22, 12, 10, 0xCC2200, -370, 4, 225);
        box(22, 12, 10, 0x2255CC, -370, 16, 225);
        box(22, 12, 10, 0x22AA44, -393, 4, 225);
        box(22, 12, 10, 0xDD9900, -393, 16, 225);

        // Moored vessel hull
        box(90, 14, 22, 0x444444, -500, 2, 175);
        // Vessel superstructure
        box(30, 18, 20, 0xBBBBBB, -480, 14, 175);
        // Funnel
        cyl(4, 5, 16, 8, 0x222222, -476, 26, 175);
    }

    function buildProleekDolmen() {
        // Neolithic portal tomb — Proleek Dolmen
        // Two upright portal stones
        box(18, 38, 14, 0x707070, 380, 17, -280);
        box(18, 38, 14, 0x707070, 418, 17, -280);
        // Back stone (smaller)
        box(14, 28, 12, 0x6A6A6A, 399, 12, -296);
        // Massive 46-tonne capstone — huge flat slab
        box(70, 14, 55, 0x5A5A5A, 399, 44, -282);
        // Ground mound
        box(120, 10, 100, 0x7A8060, 399, 3, -282);
    }

    function buildCuchulainnStatue() {
        // Bronze warrior sculpture near town centre
        // Plinth / base
        box(20, 18, 20, 0x888888, 30, 7, 30);
        // Body torso
        box(10, 24, 8, 0x8B7355, 30, 28, 30);
        // Head
        sphere(5, 7, 6, 0x8B7355, 30, 44, 30);
        // Spear arm raised
        box(3, 28, 3, 0x7A6040, 38, 36, 30);
        // Shield arm
        box(8, 12, 3, 0x7A6040, 22, 30, 30);
        // Legs
        box(4, 16, 4, 0x8B7355, 27, 10, 30);
        box(4, 16, 4, 0x8B7355, 33, 10, 30);
        // Helmet / crest
        cone(4, 8, 5, 0x8B7355, 30, 48, 30);
        // Cloak
        box(12, 20, 4, 0x6B5535, 30, 30, 27);
    }

    function buildCarlingfordTown() {
        // Medieval town on lough shore

        // King John's Castle — Norman fragments
        // Main tower keep
        box(36, 55, 36, 0x808080, 560, 25, -320);
        // Battlement cap
        box(40, 8, 40, 0x787878, 560, 56, -320);
        // Corner turrets
        box(10, 65, 10, 0x808080, 543, 30, -303);
        box(10, 65, 10, 0x808080, 577, 30, -303);
        box(10, 65, 10, 0x808080, 543, 30, -337);
        box(10, 65, 10, 0x808080, 577, 30, -337);
        // Turret cone tops
        cone(7, 16, 6, 0x707070, 543, 68, -303);
        cone(7, 16, 6, 0x707070, 577, 68, -303);
        cone(7, 16, 6, 0x707070, 543, 68, -337);
        cone(7, 16, 6, 0x707070, 577, 68, -337);
        // Castle curtain wall
        box(80, 22, 8, 0x787878, 560, 9, -298);
        box(8, 22, 60, 0x787878, 522, 9, -320);

        // Tholsel gate tower
        box(20, 44, 20, 0x6E6E6E, 530, 20, -360);
        box(26, 8, 26, 0x686868, 530, 46, -360);
        cone(10, 24, 4, 0x666666, 530, 58, -360);
        // Arch through gate tower
        box(10, 18, 6, 0x404040, 530, 7, -352);

        // Colorful village pub facades on main street
        box(22, 20, 14, 0xCD5C5C, 510, 8, -375);
        box(22, 20, 14, 0xDAA520, 532, 8, -375);
        box(22, 20, 14, 0xCD5C5C, 554, 8, -375);
        box(22, 20, 14, 0x228B22, 576, 8, -375);

        // Pub signage bar
        box(20, 4, 3, 0xF5DEB3, 510, 17, -369);
        box(20, 4, 3, 0xF5DEB3, 532, 17, -369);

        // Carlingford town houses row
        box(120, 18, 16, 0xC87040, 540, 7, -400);
        box(100, 16, 14, 0xB86030, 540, 6, -416);

        // Holy Trinity Heritage Centre
        box(35, 28, 28, 0x909090, 600, 12, -360);
        cone(12, 20, 6, 0x808080, 600, 36, -360);

        // Town harbour wall
        box(180, 10, 12, 0x6A6A6A, 550, 3, -300);

        // Carlingford ground
        box(200, 5, 200, 0x6A7A50, 550, -3, -360);
    }

    function buildNarrowWaterCastle() {
        // Small plantation castle on lough shore, south
        // Tower house
        box(22, 38, 22, 0x808080, 620, 17, 200);
        // Battlements
        box(26, 6, 26, 0x787878, 620, 38, 200);
        // Corner merlons
        box(5, 8, 5, 0x787878, 609, 42, 189);
        box(5, 8, 5, 0x787878, 631, 42, 189);
        box(5, 8, 5, 0x787878, 609, 42, 211);
        box(5, 8, 5, 0x787878, 631, 42, 211);
        // Bawn wall
        box(60, 12, 8, 0x696969, 620, 4, 185);
        box(8, 12, 40, 0x696969, 591, 4, 205);
        box(8, 12, 40, 0x696969, 649, 4, 205);
        // Lough shore at castle
        box(100, 4, 30, 0x8B7355, 620, -2, 220);
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
