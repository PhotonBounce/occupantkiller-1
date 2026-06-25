window.LaoisRock = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

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
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 18960;

        // -------------------------------------------------------
        // FARMLAND BASE — broad flat midlands terrain
        // -------------------------------------------------------
        makeBox(2000, 2, 2000, 0x228B22, cx, -1, 0);

        // -------------------------------------------------------
        // ROCK OF DUNAMASE — stacked limestone crag rising 46m
        // -------------------------------------------------------
        // Base rock layers
        makeBox(120, 8,  120,  0x808080, cx,        4,   0);
        makeBox(100, 8,  100,  0x787878, cx,        12,  0);
        makeBox(80,  8,  80,   0x808080, cx,        20,  2);
        makeBox(60,  8,  60,   0x6E6E6E, cx,        28,  1);
        makeBox(45,  8,  45,   0x787878, cx,        36, -1);
        makeBox(32,  6,  32,   0x808080, cx,        43,  0);
        // Rocky surface boulders on the crag
        makeBox(14,  5,  10,   0x707070, cx - 10,   47,  8);
        makeBox(10,  4,  8,    0x696969, cx + 12,   47, -6);
        makeBox(8,   3,  6,    0x808080, cx - 5,    47, -10);
        makeBox(6,   4,  6,    0x757575, cx + 5,    45,  12);
        makeBox(5,   3,  5,    0x6A6A6A, cx - 14,   45,  0);

        // -------------------------------------------------------
        // DUNAMASE CASTLE RUINS atop the rock (~y=46)
        // -------------------------------------------------------
        var by = 46;

        // Perimeter outer curtain wall — four sides, broken
        makeBox(60, 8, 3, 0x696969, cx,      by + 4,  30);  // north wall
        makeBox(60, 8, 3, 0x696969, cx,      by + 4, -30);  // south wall
        makeBox(3,  8, 60, 0x696969, cx + 30, by + 4,  0);  // east wall
        makeBox(3,  8, 60, 0x696969, cx - 30, by + 4,  0);  // west wall

        // Ruined sections — shorter broken segments
        makeBox(18, 4, 3, 0x5E5E5E, cx + 15, by + 2, 30);
        makeBox(10, 5, 3, 0x696969, cx - 20, by + 3, -30);

        // Twin gatehouse towers — north entrance
        makeBox(8, 14, 8, 0x636363, cx - 10, by + 7, 26);
        makeBox(8, 14, 8, 0x636363, cx + 10, by + 7, 26);
        // Gatehouse arch (lintel)
        makeBox(8,  2, 3, 0x5A5A5A, cx,      by + 13, 26);
        // Gatehouse crenellations
        makeBox(2, 2, 2, 0x696969, cx - 12, by + 16, 26);
        makeBox(2, 2, 2, 0x696969, cx -  8, by + 16, 26);
        makeBox(2, 2, 2, 0x696969, cx +  8, by + 16, 26);
        makeBox(2, 2, 2, 0x696969, cx + 12, by + 16, 26);

        // Great Hall foundations — inner ward
        makeBox(28, 3, 16, 0x5A5A5A, cx,      by + 1,  0);
        // Great hall standing walls
        makeBox(28, 8, 2,  0x636363, cx,      by + 6,  8);
        makeBox(28, 6, 2,  0x696969, cx,      by + 5, -8);
        makeBox(2,  8, 16, 0x636363, cx + 14, by + 6,  0);
        // Ruined corner tower NE
        makeBox(7, 12, 7,  0x5E5E5E, cx + 27, by + 6,  27);
        // Ruined corner tower SW
        makeBox(7,  8, 7,  0x696969, cx - 27, by + 4, -27);
        // Inner ward wall fragments
        makeBox(16, 5, 2,  0x636363, cx - 8,  by + 3, -18);
        makeBox(2,  7, 12, 0x5E5E5E, cx - 26, by + 4, -10);

        // -------------------------------------------------------
        // LAOIS COUNTRYSIDE — hedgerows and field divisions
        // -------------------------------------------------------
        // North hedgerows
        makeBox(80, 2, 2, 0x5C3317, cx - 200, 1,  150);
        makeBox(60, 2, 2, 0x5C3317, cx + 100, 1,  300);
        makeBox(2,  2, 80, 0x5C3317, cx + 250, 1,  80);
        makeBox(2,  2, 60, 0x5C3317, cx - 150, 1,  220);
        // South hedgerows
        makeBox(70, 2, 2, 0x5C3317, cx - 180, 1, -200);
        makeBox(50, 2, 2, 0x5C3317, cx + 120, 1, -350);
        makeBox(2,  2, 70, 0x5C3317, cx + 300, 1, -120);
        makeBox(2,  2, 50, 0x5C3317, cx - 300, 1, -80);
        // East hedgerows
        makeBox(90, 2, 2, 0x5C3317, cx + 400, 1,  50);
        makeBox(2,  2, 90, 0x5C3317, cx + 500, 1, -30);
        // West hedgerows
        makeBox(80, 2, 2, 0x5C3317, cx - 400, 1,  100);
        makeBox(2,  2, 80, 0x5C3317, cx - 500, 1,  40);

        // -------------------------------------------------------
        // RAISED BOG PATCHES — brown bog areas between farms
        // -------------------------------------------------------
        makeBox(120, 1, 80,  0x8B4513, cx + 350, 0,  200);
        makeBox(90,  1, 60,  0x7A3B10, cx - 400, 0, -250);
        makeBox(70,  1, 50,  0x8B4513, cx + 180, 0, -400);
        makeBox(100, 1, 70,  0x7A3B10, cx - 200, 0,  450);

        // -------------------------------------------------------
        // PORTLAOISE TOWN — buildings on eastern horizon
        // -------------------------------------------------------
        var tx = cx + 500;
        makeBox(30, 12, 20, 0xCD5C5C, tx,       6,  -60);
        makeBox(20, 8,  15, 0xC04040, tx + 40,  4,  -30);
        makeBox(25, 10, 18, 0xCD5C5C, tx + 80,  5,   10);
        makeBox(15, 14, 12, 0xB03030, tx + 30,  7,   40);
        makeBox(35, 8,  22, 0xCD5C5C, tx - 30,  4,   70);
        makeBox(18, 10, 14, 0xC04040, tx + 60,  5,   80);
        // Church steeple in town
        makeCylinder(1.5, 2, 20, 8, 0x8B8B8B, tx + 50, 10, 20);
        makeCone(2, 6, 8, 0x5A5A5A, tx + 50, 23, 20);

        // -------------------------------------------------------
        // TIMAHOE ROUND TOWER — isolated on horizon NE
        // -------------------------------------------------------
        var towerX = cx + 350;
        var towerZ = -450;
        makeCylinder(1.5, 2, 20, 10, 0xA0917A, towerX, 10, towerZ);
        // Conical cap
        makeCone(2, 4, 10, 0x7A6A5A, towerX, 22, towerZ);
        // Romanesque doorway arch (box representation)
        makeBox(4, 5, 1, 0x8B7B6A, towerX, 4, towerZ - 2);  // door surround
        makeBox(2, 1, 1, 0x8B7B6A, towerX, 7, towerZ - 2);  // arch lintel

        // -------------------------------------------------------
        // ABBEYLEIX DEMESNE — heritage town SW with tree avenues
        // -------------------------------------------------------
        var abx = cx - 500;
        var abz = 350;
        // Town buildings
        makeBox(25, 8,  18, 0x8FBC8F, abx,      4,  abz);
        makeBox(20, 6,  15, 0x7AAD7A, abx + 35, 3,  abz - 20);
        makeBox(18, 10, 14, 0x6A9D6A, abx - 30, 5,  abz + 15);
        // Tree-lined avenues — trunks
        makeCylinder(0.8, 0.8, 8, 6, 0x8B4513, abx - 80, 4, abz - 10);
        makeCylinder(0.8, 0.8, 8, 6, 0x8B4513, abx - 60, 4, abz - 10);
        makeCylinder(0.8, 0.8, 8, 6, 0x8B4513, abx - 40, 4, abz - 10);
        makeCylinder(0.8, 0.8, 8, 6, 0x8B4513, abx - 20, 4, abz - 10);
        makeCylinder(0.8, 0.8, 8, 6, 0x8B4513, abx,      4, abz - 10);
        // Tree canopies above trunks
        makeSphere(4, 6, 6, 0x228B22, abx - 80, 11, abz - 10);
        makeSphere(4, 6, 6, 0x1F7A1F, abx - 60, 11, abz - 10);
        makeSphere(4, 6, 6, 0x228B22, abx - 40, 11, abz - 10);
        makeSphere(4, 6, 6, 0x1F7A1F, abx - 20, 11, abz - 10);
        makeSphere(4, 6, 6, 0x228B22, abx,      11, abz - 10);

        // -------------------------------------------------------
        // LAOIS GAA GROUNDS — pitch and goalposts
        // -------------------------------------------------------
        var gax = cx + 100;
        var gaz = 350;
        // Pitch surface
        makeBox(130, 1, 80, 0x2E8B2E, gax, 0, gaz);
        // Pitch line markings (lighter strips)
        makeBox(130, 1, 2, 0x3AAA3A, gax, 0, gaz);
        makeBox(2,   1, 80, 0x3AAA3A, gax, 0, gaz);
        // Goalposts — near end
        makeCylinder(0.4, 0.4, 8,  6, 0xE0E0E0, gax - 65, 4,  gaz);
        makeCylinder(0.4, 0.4, 10, 6, 0xE0E0E0, gax - 65, 5,  gaz - 3);
        makeCylinder(0.4, 0.4, 10, 6, 0xE0E0E0, gax - 65, 5,  gaz + 3);
        makeBox(6, 0.5, 0.5, 0xE0E0E0, gax - 65, 9, gaz);
        // Goalposts — far end
        makeCylinder(0.4, 0.4, 8,  6, 0xE0E0E0, gax + 65, 4,  gaz);
        makeCylinder(0.4, 0.4, 10, 6, 0xE0E0E0, gax + 65, 5,  gaz - 3);
        makeCylinder(0.4, 0.4, 10, 6, 0xE0E0E0, gax + 65, 5,  gaz + 3);
        makeBox(6, 0.5, 0.5, 0xE0E0E0, gax + 65, 9, gaz);
        // Small stand / terrace
        makeBox(40, 6, 8, 0xA0A0A0, gax, 3, gaz - 50);

        // -------------------------------------------------------
        // STRADBALLY HALL — Georgian house with parkland
        // -------------------------------------------------------
        var shx = cx - 200;
        var shz = -500;
        // Main house body
        makeBox(50, 18, 28, 0xF5F0E8, shx, 9, shz);
        // Wings
        makeBox(16, 12, 18, 0xEDE8DC, shx - 33, 6, shz);
        makeBox(16, 12, 18, 0xEDE8DC, shx + 33, 6, shz);
        // Roof
        makeBox(54, 4, 32, 0xD0C8B8, shx, 20, shz);
        // Chimney stacks
        makeCylinder(1, 1, 6, 4, 0xA09080, shx - 20, 24, shz - 10);
        makeCylinder(1, 1, 6, 4, 0xA09080, shx + 20, 24, shz - 10);
        // Parkland trees
        makeCylinder(0.8, 0.8, 9, 6, 0x8B4513, shx - 80, 4, shz + 30);
        makeSphere(5, 6, 6, 0x2D6A2D, shx - 80, 13, shz + 30);
        makeCylinder(0.8, 0.8, 9, 6, 0x8B4513, shx + 80, 4, shz + 30);
        makeSphere(5, 6, 6, 0x2D6A2D, shx + 80, 13, shz + 30);
        makeCylinder(0.8, 0.8, 9, 6, 0x8B4513, shx - 50, 4, shz - 60);
        makeSphere(5, 6, 6, 0x228B22, shx - 50, 13, shz - 60);
        makeCylinder(0.8, 0.8, 9, 6, 0x8B4513, shx + 50, 4, shz - 60);
        makeSphere(5, 6, 6, 0x228B22, shx + 50, 13, shz - 60);

        // -------------------------------------------------------
        // SLIEVE BLOOM MOUNTAINS — gentle green range to west
        // -------------------------------------------------------
        var mbx = cx - 800;
        makeBox(250, 60, 120, 0x4A7C59, mbx,       30,   0);
        makeBox(180, 50, 100, 0x3E6B4E, mbx - 150, 25,  80);
        makeBox(200, 45, 110, 0x4A7C59, mbx - 100, 22, -90);
        makeBox(140, 35, 90,  0x3E6B4E, mbx + 100, 17,  60);
        makeBox(160, 40, 80,  0x4A7C59, mbx + 80,  20, -70);
        // Foothills
        makeBox(120, 20, 80, 0x5A8C65, mbx + 200, 10,  20);
        makeBox(100, 15, 70, 0x4A7C59, mbx + 220, 7,  -40);
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
