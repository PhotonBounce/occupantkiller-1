window.LouthVillage = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18800;
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildKnockArdHill();
        buildLouthVillage();
        buildStMochtasHouse();
        buildVillageCross();
        buildHolyWell();
        buildOldChurchRuins();
        buildGraveyard();
        buildLouthFarm();
        buildGAAgrounds();
        buildRavensdalForest();
        buildCuchulainnMarker();
        buildSlieveGullion();
        buildStPetersChurchDrogheda();
        buildRoads();
        buildHedgerows();
    }

    function buildGround() {
        // Ground plane built from box geometry (flat box)
        makebox(800, 1, 800, 0x4A7C3F, 0, -0.5, 0);
        // Surrounding farmland patches
        makebox(200, 0.8, 150, 0x5A8C30, -150, -0.4, 80);
        makebox(160, 0.8, 180, 0x4E7A28, 120, -0.4, -100);
        makebox(140, 0.8, 120, 0x527B35, -200, -0.4, -80);
        makebox(180, 0.8, 100, 0x3D6B22, 80, -0.4, 200);
    }

    function buildKnockArdHill() {
        // Main hill mass — layered spheres and cones to approximate hill
        makesphere(55, 10, 8, 0x556B2F, -80, 18, -60);
        makesphere(45, 10, 8, 0x4E6228, -78, 32, -58);
        makesphere(30, 8, 7, 0x476027, -76, 42, -56);
        makesphere(18, 7, 6, 0x4A6430, -75, 50, -55);
        // Hill base skirt boxes
        makebox(100, 20, 90, 0x4A6832, -80, 10, -60);
        makebox(70, 35, 60, 0x4D6A30, -80, 17, -60);
        // Slope front
        makebox(80, 12, 40, 0x527035, -60, 6, -40);
    }

    function buildLouthVillage() {
        // White-washed cottages cluster
        buildCottage(0xFFFFF0, 0, 2, 0);
        buildCottage(0xFFFFF0, 18, 2, -5);
        buildCottage(0xFFFFF0, -18, 2, 8);
        buildCottage(0xFFFFF0, 36, 2, 2);
        buildCottage(0xFFFFF0, -36, 2, -4);

        // Brick cottages
        buildCottage(0xCD5C5C, 10, 2, 30);
        buildCottage(0xCD5C5C, -12, 2, 35);
        buildCottage(0xCD5C5C, 28, 2, 28);
        buildCottage(0xCD5C5C, -30, 2, 38);

        // A couple slightly larger village houses
        makebox(14, 8, 10, 0xFFFFF0, 50, 4, 10);
        makebox(14, 1, 11, 0x8B8682, 50, 8.5, 10);
        makecone(8, 5, 4, 0x8B8682, 50, 11, 10);

        makebox(12, 7, 9, 0xDEB887, -50, 3.5, 15);
        makecone(7, 4, 4, 0x8B4513, -50, 9.5, 15);

        // Village pub / shop — slightly taller
        makebox(16, 9, 12, 0xFFFFF0, 5, 4.5, -30);
        makebox(16, 1, 13, 0x696969, 5, 9.5, -30);
        // Sign
        makebox(6, 2, 0.3, 0x8B0000, 5, 7, -36.5);

        // Windows and doors (small dark boxes on cottage faces)
        makebox(2, 2, 0.3, 0x4A4A8A, 5, 5, -36.7);
        makebox(2, 2, 0.3, 0x4A4A8A, -3, 5, -36.7);
        makebox(1.5, 3, 0.3, 0x5C3317, 5, 3, -36.7);
    }

    function buildCottage(wallcolor, x, y, z) {
        // Walls
        makebox(10, 5, 8, wallcolor, x, y + 2.5, z);
        // Roof — gabled (two sloped boxes)
        makebox(11, 1, 4.5, 0x8B8682, x, y + 5.8, z - 1.7);
        makebox(11, 1, 4.5, 0x8B8682, x, y + 5.8, z + 1.7);
        // Door
        makebox(1.5, 2.5, 0.3, 0x5C3317, x, y + 1.25, z - 4.15);
        // Window
        makebox(2, 1.5, 0.3, 0x87CEEB, x + 3, y + 3, z - 4.15);
    }

    function buildStMochtasHouse() {
        // Tiny early medieval stone oratory — a famous landmark
        // Stone walls — thick and squat
        makebox(8, 5, 7, 0x808080, -60, 2.5, 20);
        // Corbelled roof — ConeGeometry approximation of stone corbelling
        makecone(5, 6, 6, 0x696969, -60, 8, 20);
        // Door arch — dark recess
        makebox(1.5, 2.5, 0.5, 0x2F2F2F, -60, 1.25, 16.8);
        // Small window slit
        makebox(0.5, 1.5, 0.5, 0x2F2F2F, -60, 3.5, 16.8);
        // Stone surround
        makebox(10, 0.5, 9, 0x909090, -60, 0.25, 20);
    }

    function buildVillageCross() {
        // Stone high cross — base cylinder, shaft box, arms box
        makecyl(1.2, 1.5, 1.5, 8, 0x808080, 5, 0.75, -10);
        makebox(1.0, 5, 1.0, 0x808080, 5, 3.5, -10);
        // Arms of cross
        makebox(4, 1, 1, 0x808080, 5, 5.5, -10);
        // Ring of high cross
        makecyl(1.5, 1.5, 0.4, 8, 0x909090, 5, 5.5, -10);
        // Capstone
        makebox(1.2, 0.8, 1.2, 0x808080, 5, 6.4, -10);
    }

    function buildHolyWell() {
        // Stone-walled circular well
        makecyl(2.5, 2.5, 1.0, 10, 0x808080, 20, 0.5, -10);
        makecyl(2.0, 2.0, 0.8, 10, 0x1A1A2E, 20, 0.6, -10);
        // Well cap / lintel box
        makebox(5, 0.4, 0.4, 0x909090, 20, 1.2, -10);
        // Small wooden post either side
        makecyl(0.2, 0.2, 2, 6, 0x5C3317, 18, 1, -10);
        makecyl(0.2, 0.2, 2, 6, 0x5C3317, 22, 1, -10);
    }

    function buildOldChurchRuins() {
        // Ruined medieval nave — partial walls
        // North wall — partial height
        makebox(30, 6, 1.5, 0x808080, -120, 3, -20);
        // South wall — lower, more ruined
        makebox(30, 3, 1.5, 0x808080, -120, 1.5, -34);
        // East gable wall — still standing
        makebox(1.5, 8, 14, 0x808080, -105, 4, -27);
        // Pointed window opening in gable
        makebox(2, 4, 0.5, 0x2F2F2F, -104.8, 5, -27);
        // West wall — mostly collapsed
        makebox(1.5, 3, 10, 0x696969, -135, 1.5, -27);
        // Fallen stones scattered
        makebox(2, 0.8, 1.5, 0x707070, -125, 0.4, -32);
        makebox(1.5, 0.6, 2, 0x787878, -118, 0.3, -35);
        makebox(1.8, 0.7, 1.2, 0x686868, -110, 0.35, -22);
    }

    function buildGraveyard() {
        // Gravestones — boxes of varying heights
        var gx = -120;
        var gz = -27;
        // Row 1
        makebox(0.8, 2.5, 0.3, 0x696969, gx + 5, 1.25, gz + 6);
        makebox(0.7, 2.0, 0.3, 0x6E6E6E, gx + 8, 1.0, gz + 6);
        makebox(0.9, 1.8, 0.3, 0x646464, gx + 11, 0.9, gz + 6);
        makebox(0.6, 2.2, 0.3, 0x707070, gx + 14, 1.1, gz + 6);
        makebox(0.8, 1.5, 0.3, 0x6A6A6A, gx + 17, 0.75, gz + 6);
        // Row 2
        makebox(0.7, 2.8, 0.3, 0x696969, gx + 5, 1.4, gz + 10);
        makebox(0.8, 2.1, 0.3, 0x686868, gx + 9, 1.05, gz + 10);
        makebox(0.6, 1.9, 0.3, 0x727272, gx + 13, 0.95, gz + 10);
        makebox(0.9, 2.4, 0.3, 0x6C6C6C, gx + 17, 1.2, gz + 10);
        // Chest tombs
        makebox(2.5, 1.0, 1.2, 0x787878, gx + 6, 0.5, gz + 14);
        makebox(2.2, 0.9, 1.0, 0x747474, gx + 12, 0.45, gz + 14);
        // Yew tree (sphere on cylinder)
        makecyl(0.4, 0.4, 4, 6, 0x2F4F2F, gx + 20, 2, gz + 10);
        makesphere(3, 7, 6, 0x1A3A1A, gx + 20, 6, gz + 10);
    }

    function buildLouthFarm() {
        // Main farmhouse
        makebox(16, 7, 10, 0xCD5C5C, 150, 3.5, 60);
        makecone(9, 5, 4, 0x8B3A3A, 150, 10, 60);
        // Stone outbuildings
        makebox(12, 5, 8, 0x5C3317, 170, 2.5, 75);
        makecone(7, 4, 4, 0x4A2A10, 170, 7, 75);
        makebox(10, 4, 7, 0x5C3317, 165, 2, 50);
        makecone(6, 3.5, 4, 0x4A2A10, 165, 5.75, 50);
        // Barn — larger
        makebox(20, 8, 14, 0x5C3317, 200, 4, 65);
        makebox(21, 1, 15, 0x4A2A10, 200, 8.5, 65);
        // Hay bales (cylinders on side — approximated as cylinders)
        makecyl(2, 2, 3, 8, 0xDAA520, 210, 2, 55);
        makecyl(2, 2, 3, 8, 0xDAA520, 216, 2, 55);
        // Field fence posts
        makecyl(0.3, 0.3, 3, 5, 0x5C3317, 130, 1.5, 80);
        makecyl(0.3, 0.3, 3, 5, 0x5C3317, 140, 1.5, 80);
        makecyl(0.3, 0.3, 3, 5, 0x5C3317, 150, 1.5, 80);
        makecyl(0.3, 0.3, 3, 5, 0x5C3317, 160, 1.5, 80);
        // Water trough
        makebox(4, 1, 1.5, 0x808080, 145, 0.5, 68);
        // Farmyard wall
        makebox(40, 2, 1, 0x707070, 160, 1, 40);
        makebox(1, 2, 30, 0x707070, 140, 1, 55);
    }

    function buildGAAgrounds() {
        // GAA pitch surface
        makebox(140, 0.5, 90, 0x228B22, 100, 0.25, -150);
        // Pitch markings (white lines as flat boxes)
        makebox(140, 0.3, 1, 0xF5F5F5, 100, 0.4, -150);
        makebox(1, 0.3, 90, 0xF5F5F5, 100, 0.4, -150);
        makebox(1, 0.3, 90, 0xF5F5F5, 30, 0.4, -150);
        makebox(1, 0.3, 90, 0xF5F5F5, 170, 0.4, -150);
        // Goal posts — north end
        // Two upright posts
        makecyl(0.4, 0.4, 10, 6, 0xF5F5F5, 83, 5, -195);
        makecyl(0.4, 0.4, 10, 6, 0xF5F5F5, 117, 5, -195);
        // Crossbar
        makebox(34, 0.8, 0.8, 0xF5F5F5, 100, 10.4, -195);
        // Outer posts
        makecyl(0.3, 0.3, 12, 6, 0xF5F5F5, 70, 6, -195);
        makecyl(0.3, 0.3, 12, 6, 0xF5F5F5, 130, 6, -195);
        // Goal posts — south end
        makecyl(0.4, 0.4, 10, 6, 0xF5F5F5, 83, 5, -105);
        makecyl(0.4, 0.4, 10, 6, 0xF5F5F5, 117, 5, -105);
        makebox(34, 0.8, 0.8, 0xF5F5F5, 100, 10.4, -105);
        makecyl(0.3, 0.3, 12, 6, 0xF5F5F5, 70, 6, -105);
        makecyl(0.3, 0.3, 12, 6, 0xF5F5F5, 130, 6, -105);
        // Spectator bank — low earthen mound
        makebox(160, 4, 15, 0x4A7C3F, 100, 2, -210);
        makebox(160, 4, 15, 0x4A7C3F, 100, 2, -90);
        // Dugouts / benches
        makebox(8, 2, 4, 0x808080, 60, 1, -150);
        makebox(8, 2, 4, 0x808080, 140, 1, -150);
    }

    function buildRavensdalForest() {
        // Dense conifer forest on hillside — rows of cone trees on hill base
        var fx = -200;
        var fz = -200;
        var treePositions = [
            [0, 0], [15, 5], [30, -5], [45, 8], [60, -3],
            [8, 20], [22, 18], [38, 22], [52, 16], [68, 24],
            [5, 40], [18, 38], [35, 42], [50, 36], [65, 40],
            [12, 60], [28, 58], [44, 62], [58, 55], [72, 60],
            [-5, 15], [-12, 30], [-8, 48], [-15, 62], [-3, 75]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            var tx = fx + tp[0];
            var tz = fz + tp[1];
            var th = 8 + (t % 5) * 2;
            var hillrise = (t < 12) ? (t * 1.5) : 15;
            // Trunk
            makecyl(0.5, 0.7, 3, 6, 0x5C3317, tx, 1.5 + hillrise * 0.1, tz);
            // Foliage cone
            makecone(3, th, 7, 0x2D5A27, tx, 3 + th / 2 + hillrise * 0.1, tz);
            // Second foliage layer
            makecone(2, th * 0.7, 7, 0x265224, tx, 3 + th * 0.6 + hillrise * 0.1, tz);
        }
        // Hill behind forest
        makesphere(60, 10, 8, 0x3A5A3A, fx + 35, 12, fz + 40);
        makebox(120, 25, 100, 0x3D5C30, fx + 35, 12, fz + 40);
    }

    function buildCuchulainnMarker() {
        // Stone monument commemorating Cuchulainn — pillar with flat cap
        makecyl(1.5, 2, 1.5, 8, 0x808080, 80, 0.75, -60);
        makebox(2, 6, 2, 0x808080, 80, 4, -60);
        makebox(3, 0.6, 3, 0x909090, 80, 7.3, -60);
        // Inscription plaque
        makebox(1.8, 1.2, 0.3, 0xB8860B, 80, 4, -58.9);
        // Small surrounding stones
        makebox(1, 0.6, 1, 0x707070, 77, 0.3, -58);
        makebox(1, 0.5, 1, 0x747474, 83, 0.25, -58);
        makebox(1, 0.4, 1, 0x6E6E6E, 77, 0.2, -62);
        makebox(1, 0.55, 1, 0x727272, 83, 0.27, -62);
        // Low hedge surround
        makebox(12, 1, 1, 0x2D5A27, 80, 0.5, -56);
        makebox(1, 1, 8, 0x2D5A27, 74, 0.5, -60);
        makebox(1, 1, 8, 0x2D5A27, 86, 0.5, -60);
    }

    function buildSlieveGullion() {
        // Large dark mountain mass on southern horizon
        makesphere(120, 12, 8, 0x4A4A4A, -30, 25, -380);
        makesphere(80, 10, 7, 0x404040, 40, 15, -370);
        makesphere(60, 8, 6, 0x383838, -80, 12, -360);
        makebox(300, 50, 80, 0x4A4A4A, -30, 25, -380);
        makebox(200, 30, 60, 0x424242, -30, 40, -380);
        // Summit cone
        makecone(50, 40, 8, 0x3C3C3C, -30, 75, -380);
        // Snow patch near top (light sphere)
        makesphere(12, 6, 5, 0xF0F0F0, -25, 90, -382);
        // Foothills
        makebox(180, 18, 60, 0x4E5040, 80, 9, -340);
        makebox(140, 14, 50, 0x4E5040, -150, 7, -330);
    }

    function buildStPetersChurchDrogheda() {
        // Twin-spired church visible to the south
        // Main nave
        makebox(30, 20, 16, 0x808080, 50, 10, -280);
        // Nave roof
        makebox(31, 2, 9, 0x696969, 50, 21, -276.5);
        makebox(31, 2, 9, 0x696969, 50, 21, -283.5);
        // West facade
        makebox(32, 22, 2, 0x808080, 50, 11, -288);
        // Twin towers on west facade
        makebox(9, 35, 8, 0x808080, 39, 17.5, -288);
        makebox(9, 35, 8, 0x808080, 61, 17.5, -288);
        // Spires on towers
        makecone(5, 20, 4, 0x696969, 39, 45, -288);
        makecone(5, 20, 4, 0x696969, 61, 45, -288);
        // Rose window — circle of cylinders
        makecyl(4, 4, 0.5, 10, 0x8B8EAA, 50, 22, -287.8);
        // Doorway arch
        makebox(5, 8, 0.5, 0x5A5A5A, 50, 4, -287.8);
        // Buttresses
        makebox(3, 20, 4, 0x787878, 35, 10, -285);
        makebox(3, 20, 4, 0x787878, 35, 10, -275);
        makebox(3, 20, 4, 0x787878, 65, 10, -285);
        makebox(3, 20, 4, 0x787878, 65, 10, -275);
        // Churchyard wall
        makebox(60, 3, 1, 0x808080, 50, 1.5, -263);
        makebox(1, 3, 30, 0x808080, 20, 1.5, -278);
        makebox(1, 3, 30, 0x808080, 80, 1.5, -278);
    }

    function buildRoads() {
        // Main road through village — N-S axis
        makebox(8, 0.3, 300, 0x555555, 0, 0.15, 0);
        // E-W lane
        makebox(200, 0.3, 6, 0x555555, 0, 0.15, 0);
        // Farm track
        makebox(4, 0.2, 120, 0x6B5A3E, 130, 0.1, 80);
        // Grass verges beside main road
        makebox(4, 0.25, 300, 0x4A7C3F, 6, 0.12, 0);
        makebox(4, 0.25, 300, 0x4A7C3F, -6, 0.12, 0);
    }

    function buildHedgerows() {
        // Field boundary hedgerows — elongated sphere clumps on low box bases
        // West field hedgerow
        makebox(1, 2, 80, 0x2D5A27, -70, 1, 40);
        makesphere(5, 7, 5, 0x3A7A20, -70, 3.5, 10);
        makesphere(5, 7, 5, 0x325A1A, -70, 3.5, 30);
        makesphere(5, 7, 5, 0x3A7A20, -70, 3.5, 50);
        makesphere(5, 7, 5, 0x325A1A, -70, 3.5, 70);
        // East field hedgerow
        makebox(1, 2, 80, 0x2D5A27, 70, 1, 40);
        makesphere(5, 7, 5, 0x3A7A20, 70, 3.5, 10);
        makesphere(5, 7, 5, 0x325A1A, 70, 3.5, 30);
        makesphere(5, 7, 5, 0x3A7A20, 70, 3.5, 50);
        // North boundary hedge
        makebox(150, 2, 1, 0x2D5A27, 0, 1, 100);
        makesphere(4, 7, 5, 0x3A7A20, -60, 3, 100);
        makesphere(4, 7, 5, 0x325A1A, -20, 3, 100);
        makesphere(4, 7, 5, 0x3A7A20, 20, 3, 100);
        makesphere(4, 7, 5, 0x325A1A, 60, 3, 100);
        // Stone wall sections
        makebox(30, 1.5, 1, 0x707070, -100, 0.75, 10);
        makebox(1, 1.5, 20, 0x707070, -100, 0.75, 20);
        makebox(1, 1.5, 20, 0x6C6C6C, 100, 0.75, 30);
        makebox(25, 1.5, 1, 0x707070, 110, 0.75, 30);
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
