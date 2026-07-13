window.CeideFields = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18360;
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildBogGround();
        buildVisitorCentre();
        buildNeolithicWalls();
        buildExcavationTrenches();
        buildStandingStones();
        buildAtlanticCliffs();
        buildSea();
        buildBogCotton();
        buildAncientHuts();
        buildCoastalPath();
        buildFarmland();
        buildDistantHills();
        buildFences();
        buildBoulders();
    }

    function buildBogGround() {
        // Main peat bog surface — large central slab
        makeBox(600, 4, 500, 0x8B4513, 0, -2, 0);
        // Bog texture variation patches
        makeBox(120, 4.2, 100, 0x7A3B10, -80, -2, 60);
        makeBox(90, 4.2, 80, 0x9C5520, 50, -2, -90);
        makeBox(110, 4.2, 70, 0x7A3B10, 120, -2, 40);
        makeBox(80, 4.2, 110, 0x6B3000, -150, -2, -30);
        makeBox(70, 4.2, 60, 0x9C5520, 30, -2, 130);
        makeBox(100, 4.2, 90, 0x7A3B10, -60, -2, -160);
        // Waterlogged bog pool (dark)
        makeBox(30, 4.3, 20, 0x3D1C00, -20, -2, 50);
        makeBox(18, 4.3, 14, 0x3D1C00, 80, -2, -40);
        makeBox(25, 4.3, 18, 0x3D1C00, -100, -2, 80);
    }

    function buildVisitorCentre() {
        // Visitor centre base / plinth
        makeBox(28, 2, 28, 0xD4C89A, 0, 1, -20);
        // Main pyramid body — four tapered box sections stacked
        makeBox(26, 5, 26, 0xE8D5A3, 0, 4.5, -20);
        makeBox(20, 5, 20, 0xE8D5A3, 0, 9.5, -20);
        makeBox(14, 5, 14, 0xE8D5A3, 0, 14.5, -20);
        makeBox(8, 5, 8, 0xE8D5A3, 0, 19.5, -20);
        // Pyramid apex cone
        makeCone(5, 6, 4, 0xE8D5A3, 0, 25, -20);
        // Entrance porch
        makeBox(8, 5, 4, 0xD4C89A, 0, 3.5, -7);
        // Entrance door frame
        makeBox(3, 4, 0.5, 0x5C4033, 0, 3, -5);
        // Visitor centre sign pillar left
        makeBox(1, 6, 1, 0x808080, -5, 4, -5);
        // Visitor centre sign pillar right
        makeBox(1, 6, 1, 0x808080, 5, 4, -5);
        // Flagpole
        makeCylinder(0.15, 0.15, 18, 6, 0xCCCCCC, 16, 9, -20);
        // Flag
        makeBox(4, 2.5, 0.2, 0x009A44, 18, 18.5, -20);
    }

    function buildNeolithicWalls() {
        // Neolithic field walls running N-S and E-W across bog — slightly raised box segments
        // Wall set 1 — long E-W wall
        var i;
        for (i = 0; i < 12; i++) {
            makeBox(10, 1.2, 2, 0x808080, -170 + i * 32, 0.6, 30);
        }
        // Wall set 2 — long E-W wall south
        for (i = 0; i < 10; i++) {
            makeBox(10, 1.2, 2, 0x808080, -130 + i * 32, 0.6, 90);
        }
        // Wall set 3 — N-S wall west
        for (i = 0; i < 8; i++) {
            makeBox(2, 1.2, 10, 0x808080, -120, 0.6, -60 + i * 28);
        }
        // Wall set 4 — N-S wall centre
        for (i = 0; i < 8; i++) {
            makeBox(2, 1.2, 10, 0x808080, -20, 0.6, -60 + i * 28);
        }
        // Wall set 5 — N-S wall east
        for (i = 0; i < 7; i++) {
            makeBox(2, 1.2, 10, 0x808080, 80, 0.6, -50 + i * 28);
        }
        // Short cross walls
        makeBox(18, 1, 2, 0x808080, -70, 0.5, -30);
        makeBox(18, 1, 2, 0x808080, 40, 0.5, 60);
        makeBox(2, 1, 18, 0x808080, 140, 0.5, -10);
    }

    function buildExcavationTrenches() {
        // Open excavation trenches through bog showing wall stumps
        makeBox(60, 3, 8, 0x6B3A2A, -40, -1.5, 30);
        makeBox(8, 3, 50, 0x6B3A2A, -120, -1.5, 20);
        makeBox(50, 3, 8, 0x6B3A2A, 60, -1.5, 90);
        makeBox(8, 3, 40, 0x6B3A2A, 80, -1.5, -30);
        // Trench spoil heap mounds
        makeBox(12, 3, 8, 0x5C3317, -70, 1.5, 30);
        makeBox(12, 3, 8, 0x5C3317, -10, 1.5, 30);
        makeBox(8, 3, 12, 0x5C3317, -120, 1.5, -10);
        makeBox(8, 3, 12, 0x5C3317, -120, 1.5, 50);
    }

    function buildStandingStones() {
        // Upright megalithic standing stones scattered across site
        makeBox(1.5, 8, 2.5, 0x808080, -60, 4, -80);
        makeBox(2, 10, 1.8, 0x777777, 30, 5, -110);
        makeBox(1.8, 7, 2.2, 0x888888, -140, 3.5, 110);
        makeBox(2.5, 12, 2, 0x808080, 110, 6, 70);
        makeBox(1.6, 9, 1.6, 0x797979, -30, 4.5, 170);
        makeBox(2.2, 11, 1.8, 0x888888, 170, 5.5, -60);
        makeBox(1.4, 6, 2, 0x757575, 60, 3, -160);
        // Fallen stone (horizontal)
        makeBox(8, 1.5, 2, 0x808080, 20, 0.75, 140);
        // Stone pair
        makeBox(1.5, 8, 2, 0x808080, -90, 4, -120);
        makeBox(1.8, 9, 2.2, 0x777777, -84, 4.5, -120);
    }

    function buildAtlanticCliffs() {
        // Dramatic cliff face on west edge — tall boxes
        makeBox(20, 100, 30, 0x808080, -280, 48, -200);
        makeBox(25, 95, 30, 0x757575, -280, 45.5, -170);
        makeBox(22, 105, 30, 0x808080, -280, 50.5, -140);
        makeBox(24, 90, 30, 0x787878, -280, 43, -110);
        makeBox(20, 100, 30, 0x808080, -280, 48, -80);
        makeBox(22, 95, 30, 0x757575, -280, 45.5, -50);
        makeBox(25, 110, 30, 0x808080, -280, 53, -20);
        makeBox(20, 100, 30, 0x787878, -280, 48, 10);
        makeBox(22, 95, 30, 0x808080, -280, 45.5, 40);
        makeBox(24, 105, 30, 0x757575, -280, 50.5, 70);
        makeBox(20, 100, 30, 0x808080, -280, 48, 100);
        makeBox(22, 90, 30, 0x787878, -280, 43, 130);
        makeBox(25, 100, 30, 0x808080, -280, 48, 160);
        makeBox(20, 95, 30, 0x757575, -280, 45.5, 190);
        // Cliff top edge rubble
        makeBox(300, 3, 10, 0x909090, -140, 1.5, -20);
        // Cliff face base rock debris
        makeBox(300, 8, 15, 0x6B6B6B, -290, 4, -20);
    }

    function buildSea() {
        // Atlantic ocean visible below cliffs
        makeBox(200, 4, 600, 0x006994, -380, -52, 0);
        // Wave froth strip at cliff base
        makeBox(20, 2, 400, 0xE0F0FF, -300, -48, 0);
    }

    function buildBogCotton() {
        // Bog cotton — white sphere heads on cylinder stems scattered across bog
        var cottonPositions = [
            [-50, 80], [20, 100], [90, -20], [-110, 50], [40, -70],
            [-80, -90], [130, 110], [-160, 20], [70, 140], [-30, -140],
            [160, -80], [-200, 130], [100, -140], [-130, -60], [50, 180],
            [-70, 160], [110, 30], [-190, -50], [0, 60], [180, 50]
        ];
        var j;
        for (j = 0; j < cottonPositions.length; j++) {
            var cx = cottonPositions[j][0];
            var cz = cottonPositions[j][1];
            // Cluster of 3 stems per position
            makeCylinder(0.08, 0.08, 1.2, 4, 0xBDB76B, cx, 0.6, cz);
            makeSphere(0.25, 5, 4, 0xFFFFFE, cx, 1.35, cz);
            makeCylinder(0.08, 0.08, 1.0, 4, 0xBDB76B, cx + 0.4, 0.5, cz + 0.3);
            makeSphere(0.22, 5, 4, 0xFFFFFE, cx + 0.4, 1.1, cz + 0.3);
            makeCylinder(0.08, 0.08, 1.3, 4, 0xBDB76B, cx - 0.35, 0.65, cz - 0.4);
            makeSphere(0.24, 5, 4, 0xFFFFFE, cx - 0.35, 1.4, cz - 0.4);
        }
    }

    function buildAncientHuts() {
        // Neolithic circular hut foundations — rings of box segments
        buildHutRing(50, -60, 5, 7);
        buildHutRing(-90, 70, 4.5, 6);
        buildHutRing(140, -100, 5.5, 7);
        buildHutRing(-160, -80, 4, 6);
    }

    function buildHutRing(cx, cz, radius, count) {
        var k;
        var angleStep = (Math.PI * 2) / count;
        for (k = 0; k < count; k++) {
            var angle = k * angleStep;
            var sx = cx + Math.cos(angle) * radius;
            var sz = cz + Math.sin(angle) * radius;
            makeBox(2.5, 1.8, 1.2, 0x808080, sx, 0.9, sz);
        }
        // Interior floor patch
        makeBox(radius * 1.4, 0.5, radius * 1.4, 0x6B4513, cx, 0.25, cz);
        // Central hearth
        makeBox(1, 0.6, 1, 0x333333, cx, 0.3, cz);
    }

    function buildCoastalPath() {
        // Narrow coastal path along cliff edge running N-S
        var p;
        for (p = 0; p < 14; p++) {
            makeBox(6, 0.5, 18, 0x999999, -250, 0.25, -195 + p * 30);
        }
    }

    function buildFarmland() {
        // Green farmland to east behind the bog
        makeBox(200, 3, 500, 0x228B22, 250, -0.5, 0);
        // Field subdivisions — low stone boundary walls
        makeBox(200, 1.5, 2, 0x888888, 250, 0.75, -100);
        makeBox(200, 1.5, 2, 0x888888, 250, 0.75, 100);
        makeBox(2, 1.5, 200, 0x888888, 170, 0.75, 0);
        makeBox(2, 1.5, 200, 0x888888, 330, 0.75, 0);
        // Farmhouse
        makeBox(12, 7, 8, 0xF5F0E8, 230, 3.5, -60);
        makeCone(8, 5, 4, 0x8B4513, 230, 9.5, -60);
        // Barn
        makeBox(16, 6, 10, 0xC8902A, 260, 3, -80);
        makeCone(10, 4, 4, 0x7A3B10, 260, 8, -80);
        // Farmyard trees
        makeCylinder(0.4, 0.5, 6, 6, 0x5C3317, 220, 3, -50);
        makeSphere(3, 6, 5, 0x2E7D32, 220, 8, -50);
        makeCylinder(0.4, 0.5, 5, 6, 0x5C3317, 225, 2.5, -45);
        makeSphere(2.5, 6, 5, 0x388E3C, 225, 7, -45);
    }

    function buildDistantHills() {
        // Background hills to east and north — large box mounds
        makeBox(200, 40, 80, 0x4A7C59, 350, 18, -180);
        makeBox(180, 35, 70, 0x3D6B4F, 380, 15.5, -100);
        makeBox(220, 45, 90, 0x4A7C59, 400, 20.5, 60);
        makeBox(190, 38, 75, 0x3D6B4F, 360, 17, 150);
        makeBox(160, 30, 65, 0x4A7C59, 320, 13, 220);
        // Northern ridge
        makeBox(400, 30, 60, 0x3D6B4F, 50, 13, -280);
    }

    function buildFences() {
        // Wooden fence posts along site boundary
        var f;
        for (f = 0; f < 16; f++) {
            makeCylinder(0.15, 0.15, 2.5, 4, 0x8B6914, -200 + f * 28, 1.25, -230);
        }
        for (f = 0; f < 10; f++) {
            makeCylinder(0.15, 0.15, 2.5, 4, 0x8B6914, 220, 1.25, -230 + f * 28);
        }
        // Fence rails
        makeBox(440, 0.25, 0.25, 0x8B6914, 20, 2, -230);
        makeBox(440, 0.25, 0.25, 0x8B6914, 20, 1.2, -230);
    }

    function buildBoulders() {
        // Glacial erratic boulders scattered across bog
        makeSphere(3.5, 6, 5, 0x707070, -100, 1.75, -100);
        makeSphere(2.8, 6, 5, 0x7A7A7A, 90, 1.4, 120);
        makeSphere(4, 6, 5, 0x686868, -180, 2, 80);
        makeSphere(2.2, 6, 5, 0x808080, 150, 1.1, -130);
        makeSphere(3.1, 6, 5, 0x727272, -50, 1.55, 200);
        makeSphere(2.5, 6, 5, 0x7A7A7A, 200, 1.25, 150);
        makeSphere(1.8, 6, 5, 0x808080, -220, 0.9, -140);
        makeSphere(3.3, 6, 5, 0x6B6B6B, 70, 1.65, -200);
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
