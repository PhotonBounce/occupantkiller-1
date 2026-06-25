window.LoughCorrib = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var salmonMeshes = [];
    var salmonTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        salmonMeshes = [];
        salmonTime = 0;
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 18400;

        // -------------------------------------------------------
        // LOUGH CORRIB LAKE — vast blue lake, tiled in sections
        // -------------------------------------------------------
        makeBox(600, 1, 900, 0x006994, cx, -0.5, 0);
        makeBox(400, 1, 600, 0x006994, cx - 400, -0.5, 200);
        makeBox(350, 1, 500, 0x006994, cx + 420, -0.5, -200);
        makeBox(300, 1, 400, 0x006994, cx - 300, -0.5, -300);
        makeBox(280, 1, 380, 0x006994, cx + 200, -0.5, 350);
        makeBox(250, 1, 300, 0x006994, cx - 100, -0.5, -420);
        makeBox(200, 1, 250, 0x006994, cx + 350, -0.5, -440);
        makeBox(320, 1, 420, 0x006994, cx - 500, -0.5, 0);
        makeBox(180, 1, 220, 0x006994, cx + 500, -0.5, 100);

        // -------------------------------------------------------
        // LOUGH CORRIB SHORES — green reedy lakeshore
        // -------------------------------------------------------
        makeBox(700, 2, 30, 0x228B22, cx, 1, 455);
        makeBox(700, 2, 30, 0x228B22, cx, 1, -455);
        makeBox(30, 2, 920, 0x228B22, cx - 315, 1, 0);
        makeBox(30, 2, 920, 0x228B22, cx + 315, 1, 0);

        // Sandy patches on shoreline
        makeBox(80, 2, 20, 0xF5DEB3, cx - 200, 1, 453);
        makeBox(60, 2, 18, 0xF5DEB3, cx + 150, 1, 453);
        makeBox(70, 2, 20, 0xF5DEB3, cx - 200, 1, -453);
        makeBox(50, 2, 15, 0xF5DEB3, cx + 220, 1, -453);
        makeBox(20, 2, 60, 0xF5DEB3, cx - 313, 1, 100);
        makeBox(18, 2, 50, 0xF5DEB3, cx + 313, 1, -80);

        // -------------------------------------------------------
        // LAKE ISLANDS — 365 islands represented by clusters
        // -------------------------------------------------------
        // Cluster A — central-north
        makeBox(18, 3, 22, 0x228B22, cx - 80, 1.5, -120);
        makeBox(12, 3, 14, 0x228B22, cx - 60, 1.5, -140);
        makeBox(25, 3, 20, 0x228B22, cx + 90, 1.5, -100);
        makeBox(10, 2, 10, 0x228B22, cx + 110, 1.5, -90);
        makeBox(16, 3, 18, 0x228B22, cx - 140, 1.5, 80);
        makeBox(14, 2, 12, 0x228B22, cx - 160, 1.5, 90);
        makeBox(20, 3, 16, 0x228B22, cx + 50, 1.5, 140);
        makeBox(11, 2, 13, 0x228B22, cx + 70, 1.5, 150);
        makeBox(30, 3, 28, 0x228B22, cx - 200, 1.5, -200);
        makeBox(8,  2, 9,  0x228B22, cx - 215, 1.5, -185);
        makeBox(22, 3, 19, 0x228B22, cx + 230, 1.5, 200);
        makeBox(15, 2, 14, 0x228B22, cx + 245, 1.5, 215);
        makeBox(18, 3, 20, 0x228B22, cx - 50, 1.5, 250);
        makeBox(12, 2, 10, 0x228B22, cx - 35, 1.5, 265);
        makeBox(24, 3, 22, 0x228B22, cx + 160, 1.5, -260);
        makeBox(9,  2, 11, 0x228B22, cx + 175, 1.5, -245);
        makeBox(17, 3, 15, 0x228B22, cx - 260, 1.5, 160);
        makeBox(13, 2, 12, 0x228B22, cx - 275, 1.5, 175);
        makeBox(19, 3, 21, 0x228B22, cx + 20, 1.5, -320);
        makeBox(10, 2, 10, 0x228B22, cx + 35, 1.5, -305);
        makeBox(26, 3, 24, 0x228B22, cx - 120, 1.5, 320);
        makeBox(14, 2, 13, 0x228B22, cx - 105, 1.5, 335);
        makeBox(21, 3, 19, 0x228B22, cx + 280, 1.5, -120);
        makeBox(9,  2, 8,  0x228B22, cx + 295, 1.5, -108);
        makeBox(15, 3, 17, 0x228B22, cx - 290, 1.5, -100);

        // -------------------------------------------------------
        // INCHAGOILL ISLAND — central island with monastery
        // -------------------------------------------------------
        // Island base
        makeBox(80, 4, 90, 0x228B22, cx, 2, -30);

        // Stone church
        makeBox(24, 10, 14, 0x808080, cx - 5, 7, -30);
        // Church roof
        makeCone(10, 6, 4, 0x696969, cx - 5, 15, -30);
        // Round tower — iconic Irish feature
        makeCylinder(3, 3.5, 30, 8, 0x808080, cx + 22, 17, -20);
        // Tower cap
        makeCone(3.5, 5, 8, 0x696969, cx + 22, 33, -20);
        // Monastic enclosure wall — east
        makeBox(2, 4, 60, 0x808080, cx + 35, 4, -30);
        // Monastic enclosure wall — west
        makeBox(2, 4, 60, 0x808080, cx - 35, 4, -30);
        // Monastic enclosure wall — north
        makeBox(70, 4, 2, 0x808080, cx, 4, 0);
        // Monastic enclosure wall — south
        makeBox(70, 4, 2, 0x808080, cx, 4, -60);
        // Graveyard marker crosses (thin boxes)
        makeBox(1, 5, 3, 0x808080, cx - 10, 6, -50);
        makeBox(3, 1, 1, 0x808080, cx - 10, 8, -50);
        makeBox(1, 5, 3, 0x808080, cx - 16, 6, -48);
        makeBox(3, 1, 1, 0x808080, cx - 16, 8, -48);

        // -------------------------------------------------------
        // CONG VILLAGE — north end, white buildings + abbey
        // -------------------------------------------------------
        var congZ = -420;
        // Village cottages
        makeBox(18, 8, 14, 0xFFFFF0, cx - 40, 6, congZ);
        makeCone(10, 5, 4, 0x8B4513, cx - 40, 13, congZ);
        makeBox(16, 8, 14, 0xFFFFF0, cx - 20, 6, congZ + 20);
        makeCone(9, 5, 4, 0x8B4513, cx - 20, 13, congZ + 20);
        makeBox(18, 8, 14, 0xFFFFF0, cx + 10, 6, congZ - 10);
        makeCone(10, 5, 4, 0x8B4513, cx + 10, 13, congZ - 10);
        makeBox(20, 8, 16, 0xFFFFF0, cx + 35, 6, congZ + 15);
        makeCone(11, 5, 4, 0x8B4513, cx + 35, 13, congZ + 15);

        // Cong Abbey — Romanesque ruins (arched windows as gaps represented by thin side walls)
        makeBox(40, 14, 5, 0x8B7355, cx, 9, congZ - 40);    // Abbey front wall
        makeBox(40, 14, 5, 0x8B7355, cx, 9, congZ - 80);    // Abbey rear wall
        makeBox(5, 14, 40, 0x8B7355, cx - 20, 9, congZ - 60); // Abbey left wall
        makeBox(5, 14, 40, 0x8B7355, cx + 20, 9, congZ - 60); // Abbey right wall
        // Cloister columns
        makeCylinder(1, 1, 8, 6, 0x8B7355, cx - 12, 6, congZ - 50);
        makeCylinder(1, 1, 8, 6, 0x8B7355, cx,      6, congZ - 50);
        makeCylinder(1, 1, 8, 6, 0x8B7355, cx + 12, 6, congZ - 50);
        makeCylinder(1, 1, 8, 6, 0x8B7355, cx - 12, 6, congZ - 70);
        makeCylinder(1, 1, 8, 6, 0x8B7355, cx,      6, congZ - 70);
        makeCylinder(1, 1, 8, 6, 0x8B7355, cx + 12, 6, congZ - 70);
        // Abbey tower remnant
        makeBox(10, 20, 10, 0x8B7355, cx - 18, 12, congZ - 82);

        // -------------------------------------------------------
        // INISHMICATREER ISLAND — medieval castle ruin
        // -------------------------------------------------------
        var iniX = cx + 200;
        var iniZ = 300;
        // Island
        makeBox(50, 3, 50, 0x228B22, iniX, 1.5, iniZ);
        // Ruined tower
        makeBox(14, 22, 14, 0x696969, iniX, 13, iniZ);
        // Crumbled top (offset to look ruined)
        makeBox(12, 5, 6, 0x696969, iniX - 2, 26, iniZ - 2);
        makeBox(6, 4, 10, 0x696969, iniX + 3, 25, iniZ + 1);
        // Castle wall remnant
        makeBox(2, 10, 30, 0x696969, iniX + 8, 7, iniZ);

        // -------------------------------------------------------
        // MOYCULLEN VILLAGE — west shore, Georgian buildings
        // -------------------------------------------------------
        var moyX = cx - 290;
        makeBox(20, 12, 14, 0xCD5C5C, moyX, 8, -60);
        makeCone(11, 4, 4, 0x8B0000, moyX, 16, -60);
        makeBox(18, 12, 14, 0xCD5C5C, moyX, 8, -35);
        makeCone(10, 4, 4, 0x8B0000, moyX, 16, -35);
        makeBox(22, 12, 16, 0xCD5C5C, moyX, 8, -10);
        makeCone(12, 4, 4, 0x8B0000, moyX, 16, -10);
        makeBox(20, 12, 14, 0xCD5C5C, moyX, 8, 20);
        makeCone(11, 4, 4, 0x8B0000, moyX, 16, 20);
        // Georgian church
        makeBox(24, 16, 18, 0xFFFFF0, moyX, 10, 50);
        makeCylinder(2.5, 2.5, 18, 8, 0xFFFFF0, moyX, 21, 50);

        // -------------------------------------------------------
        // GALWAY CITY RIVER — flows south from lake
        // -------------------------------------------------------
        makeBox(20, 1, 200, 0x006994, cx, -0.5, 560);
        makeBox(18, 1, 200, 0x006994, cx + 5, -0.5, 760);
        makeBox(16, 1, 150, 0x006994, cx - 5, -0.5, 950);
        // River banks
        makeBox(5, 2, 550, 0x228B22, cx - 15, 1, 710);
        makeBox(5, 2, 550, 0x228B22, cx + 15, 1, 710);

        // -------------------------------------------------------
        // FISHING BOATS — scattered on the lake
        // -------------------------------------------------------
        buildBoat(cx - 180, 1, 60);
        buildBoat(cx + 120, 1, -80);
        buildBoat(cx - 60, 1, 200);
        buildBoat(cx + 240, 1, 30);
        buildBoat(cx - 100, 1, -250);

        // -------------------------------------------------------
        // SALMON — animated spheres bobbing at the surface
        // -------------------------------------------------------
        buildSalmon(cx - 30, 0, 10);
        buildSalmon(cx + 50, 0, -50);
        buildSalmon(cx - 90, 0, 130);
        buildSalmon(cx + 10, 0, -150);
        buildSalmon(cx + 150, 0, 80);
    }

    function buildBoat(x, y, z) {
        // Hull
        var hull = makeBox(12, 3, 5, 0x5C3317, x, y + 1.5, z);
        // Outboard motor
        var motor = makeBox(2, 3, 2, 0x333333, x + 7, y + 1.5, z);
        // Seat plank
        var seat = makeBox(8, 1, 4, 0x8B5E3C, x, y + 3.5, z);
        hull; motor; seat;
    }

    function buildSalmon(x, y, z) {
        var geo = new THREE.SphereGeometry(1.2, 6, 5);
        var mat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        salmonMeshes.push(mesh);
    }

    function update(delta) {
        salmonTime += delta;
        for (var i = 0; i < salmonMeshes.length; i++) {
            salmonMeshes[i].position.y = Math.sin(salmonTime * 2 + i) * 0.5;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        salmonMeshes = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
