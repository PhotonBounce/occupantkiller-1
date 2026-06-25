window.SunderlandWearmouth = (function() {
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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCyl(rTop, rBot, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 22160;

        // -------------------------------------------------------
        // GROUND PLANE — built from boxes (no PlaneGeometry)
        // -------------------------------------------------------
        makeBox(2000, 2, 2000, 0x4a6741, cx, -1, 0);           // general ground
        makeBox(600,  2, 600,  0x3d5c34, cx - 400, -1, -200);  // grass south bank
        makeBox(500,  2, 500,  0x3d5c34, cx + 300, -1, 150);   // grass north bank

        // -------------------------------------------------------
        // RIVER WEAR — wide shallow box gorge + water surface
        // -------------------------------------------------------
        makeBox(1200, 4, 180, 0x2a5278, cx, -3, 0);            // river water
        makeBox(1200, 30, 20, 0x5a4a30, cx, -16, 90);          // south gorge wall
        makeBox(1200, 30, 20, 0x5a4a30, cx, -16, -90);         // north gorge wall
        makeBox(20,   30, 180, 0x5a4a30, cx - 600, -16, 0);    // west gorge end
        makeBox(20,   30, 180, 0x5a4a30, cx + 600, -16, 0);    // east gorge end

        // -------------------------------------------------------
        // NORTH SEA — large blue-grey expanse to the east
        // -------------------------------------------------------
        makeBox(1000, 2, 800, 0x006994, cx + 900, -1, 0);      // sea surface
        makeBox(1000, 40, 20, 0x4a6060, cx + 900, -20, -400);  // sea cliff north
        makeBox(1000, 40, 20, 0x4a6060, cx + 900, -20,  400);  // sea cliff south
        makeBox(20,   40, 800, 0x4a6060, cx + 1400, -20, 0);   // sea east wall

        // -------------------------------------------------------
        // WEARMOUTH BRIDGE — 0x888888 steel arch bridge
        // The bridge spans ~200 units over the river at z=0
        // -------------------------------------------------------
        // road deck
        makeBox(200, 4, 30, 0x888888, cx, 12, 0);
        // north abutment
        makeBox(40, 20, 40, 0x777777, cx, 2, -110);
        // south abutment
        makeBox(40, 20, 40, 0x777777, cx, 2,  110);
        // arch ribs — approximate with angled boxes
        makeBox(220, 6, 6, 0x888888, cx, 20, -16);
        makeBox(220, 6, 6, 0x888888, cx, 20,  16);
        makeBox(220, 6, 6, 0x888888, cx, 36, -16);
        makeBox(220, 6, 6, 0x888888, cx, 36,  16);
        // arch crown box (top of arch)
        makeBox(50, 10, 40, 0x999999, cx, 50, 0);
        // vertical hangers (suspenders)
        makeBox(4, 40, 4, 0x888888, cx - 60, 32, -16);
        makeBox(4, 40, 4, 0x888888, cx - 60, 32,  16);
        makeBox(4, 40, 4, 0x888888, cx,      32, -16);
        makeBox(4, 40, 4, 0x888888, cx,      32,  16);
        makeBox(4, 40, 4, 0x888888, cx + 60, 32, -16);
        makeBox(4, 40, 4, 0x888888, cx + 60, 32,  16);
        // parapet rails
        makeBox(200, 3, 2, 0x666666, cx, 14, -15);
        makeBox(200, 3, 2, 0x666666, cx, 14,  15);

        // -------------------------------------------------------
        // MONKWEARMOUTH STATION MUSEUM — neoclassical, north bank
        // centred at cx - 100, z = -200
        // -------------------------------------------------------
        var msX = cx - 100;
        var msZ = -200;
        // main hall body
        makeBox(100, 30, 60, 0xD4C8A0, msX, 15, msZ);
        // portico columns (6 Doric columns across the front)
        makeCyl(3, 3, 24, 8, 0xE8DFC0, msX - 30, 12, msZ - 35);
        makeCyl(3, 3, 24, 8, 0xE8DFC0, msX - 18, 12, msZ - 35);
        makeCyl(3, 3, 24, 8, 0xE8DFC0, msX - 6,  12, msZ - 35);
        makeCyl(3, 3, 24, 8, 0xE8DFC0, msX + 6,  12, msZ - 35);
        makeCyl(3, 3, 24, 8, 0xE8DFC0, msX + 18, 12, msZ - 35);
        makeCyl(3, 3, 24, 8, 0xE8DFC0, msX + 30, 12, msZ - 35);
        // entablature above columns
        makeBox(72, 5, 8, 0xD4C8A0, msX, 26, msZ - 35);
        // pediment triangle — approximate with a flat box
        makeBox(72, 10, 5, 0xD4C8A0, msX, 33, msZ - 36);
        // clock tower
        makeBox(14, 40, 14, 0xD4C8A0, msX + 42, 20, msZ);
        makeCone(8, 12, 8, 0xB0A888, msX + 42, 46, msZ);
        // station roof
        makeBox(100, 6, 60, 0xC8BC98, msX, 33, msZ);
        // platform canopy
        makeBox(80, 4, 20, 0x888888, msX, 10, msZ + 40);

        // -------------------------------------------------------
        // STADIUM OF LIGHT — 0xCCCCCC, large oval arena
        // south of river, cx + 80, z = 300
        // -------------------------------------------------------
        var solX = cx + 80;
        var solZ = 300;
        // outer stadium wall ring — four sides of the bowl
        makeBox(220, 35, 12, 0xCCCCCC, solX, 17, solZ - 100); // north stand
        makeBox(220, 35, 12, 0xCCCCCC, solX, 17, solZ + 100); // south stand
        makeBox(12, 35, 200, 0xCCCCCC, solX - 110, 17, solZ); // west stand
        makeBox(12, 35, 200, 0xCCCCCC, solX + 110, 17, solZ); // east stand
        // corner connectors
        makeBox(28, 35, 28, 0xBBBBBB, solX - 110, 17, solZ - 100);
        makeBox(28, 35, 28, 0xBBBBBB, solX + 110, 17, solZ - 100);
        makeBox(28, 35, 28, 0xBBBBBB, solX - 110, 17, solZ + 100);
        makeBox(28, 35, 28, 0xBBBBBB, solX + 110, 17, solZ + 100);
        // roof cantilever boxes
        makeBox(240, 6, 20, 0xDDDDDD, solX, 38, solZ - 104);
        makeBox(240, 6, 20, 0xDDDDDD, solX, 38, solZ + 104);
        makeBox(20, 6, 220, 0xDDDDDD, solX - 114, 38, solZ);
        makeBox(20, 6, 220, 0xDDDDDD, solX + 114, 38, solZ);
        // floodlight pylons
        makeCyl(2, 2, 50, 6, 0xAAAAAA, solX - 120, 25, solZ - 110);
        makeCyl(2, 2, 50, 6, 0xAAAAAA, solX + 120, 25, solZ - 110);
        makeCyl(2, 2, 50, 6, 0xAAAAAA, solX - 120, 25, solZ + 110);
        makeCyl(2, 2, 50, 6, 0xAAAAAA, solX + 120, 25, solZ + 110);
        // pitch (grass coloured box inside)
        makeBox(180, 1, 120, 0x3a8c3a, solX, 1, solZ);

        // -------------------------------------------------------
        // WEARSIDE SHIPYARDS — 0x666666 cranes and dry docks
        // west of bridge along the river
        // -------------------------------------------------------
        var syX = cx - 350;
        var syZ = 40;
        // dry dock walls
        makeBox(120, 14, 8,  0x555555, syX, 7, syZ - 50);
        makeBox(120, 14, 8,  0x555555, syX, 7, syZ + 50);
        makeBox(8,   14, 100, 0x555555, syX - 60, 7, syZ);
        // shipyard crane 1 — gantry style
        makeBox(4, 60, 4, 0x666666, syX - 40, 30, syZ - 40);
        makeBox(4, 60, 4, 0x666666, syX - 40, 30, syZ + 40);
        makeBox(80, 6, 4, 0x666666, syX - 40, 62, syZ);      // horizontal beam
        makeBox(4, 20, 4, 0x666666, syX - 10, 52, syZ);      // hook/block
        // shipyard crane 2
        makeBox(4, 70, 4, 0x666666, syX + 30, 35, syZ - 30);
        makeBox(4, 70, 4, 0x666666, syX + 30, 35, syZ + 30);
        makeBox(60, 6, 4, 0x666666, syX + 30, 73, syZ);
        // workshops
        makeBox(60, 18, 30, 0x666666, syX - 30, 9, syZ + 80);
        makeBox(40, 14, 25, 0x555555, syX + 50, 7, syZ + 70);
        // chimney stacks
        makeCyl(3, 4, 30, 8, 0x444444, syX - 30, 24, syZ + 80);
        makeCyl(2, 3, 24, 8, 0x444444, syX + 50, 19, syZ + 70);

        // -------------------------------------------------------
        // PENSHAW MONUMENT — Doric temple on hilltop, no roof
        // visible from miles, cx - 500, z = -300, on elevated hill
        // -------------------------------------------------------
        var pmX = cx - 500;
        var pmZ = -300;
        // hill
        makeSphere(80, 12, 8, 0x5a6e40, pmX, -40, pmZ);
        // stylobate (base platform)
        makeBox(90, 6, 44, 0xD4C8A0, pmX, 44, pmZ);
        // colonnade — 9 columns along long sides, 5 along short
        var pCol = 0xE0D6B0;
        // north face columns (9)
        makeCyl(3, 3, 20, 8, pCol, pmX - 36, 57, pmZ - 22);
        makeCyl(3, 3, 20, 8, pCol, pmX - 27, 57, pmZ - 22);
        makeCyl(3, 3, 20, 8, pCol, pmX - 18, 57, pmZ - 22);
        makeCyl(3, 3, 20, 8, pCol, pmX - 9,  57, pmZ - 22);
        makeCyl(3, 3, 20, 8, pCol, pmX,      57, pmZ - 22);
        makeCyl(3, 3, 20, 8, pCol, pmX + 9,  57, pmZ - 22);
        makeCyl(3, 3, 20, 8, pCol, pmX + 18, 57, pmZ - 22);
        makeCyl(3, 3, 20, 8, pCol, pmX + 27, 57, pmZ - 22);
        makeCyl(3, 3, 20, 8, pCol, pmX + 36, 57, pmZ - 22);
        // south face columns (9)
        makeCyl(3, 3, 20, 8, pCol, pmX - 36, 57, pmZ + 22);
        makeCyl(3, 3, 20, 8, pCol, pmX - 27, 57, pmZ + 22);
        makeCyl(3, 3, 20, 8, pCol, pmX - 18, 57, pmZ + 22);
        makeCyl(3, 3, 20, 8, pCol, pmX - 9,  57, pmZ + 22);
        makeCyl(3, 3, 20, 8, pCol, pmX,      57, pmZ + 22);
        makeCyl(3, 3, 20, 8, pCol, pmX + 9,  57, pmZ + 22);
        makeCyl(3, 3, 20, 8, pCol, pmX + 18, 57, pmZ + 22);
        makeCyl(3, 3, 20, 8, pCol, pmX + 27, 57, pmZ + 22);
        makeCyl(3, 3, 20, 8, pCol, pmX + 36, 57, pmZ + 22);
        // east columns (5 short side, excluding corners already done)
        makeCyl(3, 3, 20, 8, pCol, pmX + 36, 57, pmZ - 11);
        makeCyl(3, 3, 20, 8, pCol, pmX + 36, 57, pmZ);
        makeCyl(3, 3, 20, 8, pCol, pmX + 36, 57, pmZ + 11);
        // west columns
        makeCyl(3, 3, 20, 8, pCol, pmX - 36, 57, pmZ - 11);
        makeCyl(3, 3, 20, 8, pCol, pmX - 36, 57, pmZ);
        makeCyl(3, 3, 20, 8, pCol, pmX - 36, 57, pmZ + 11);
        // entablature (no roof — open to sky like Parthenon)
        makeBox(90, 5, 4, 0xD4C8A0, pmX, 68, pmZ - 22);
        makeBox(90, 5, 4, 0xD4C8A0, pmX, 68, pmZ + 22);
        makeBox(4, 5, 44, 0xD4C8A0, pmX - 36, 68, pmZ);
        makeBox(4, 5, 44, 0xD4C8A0, pmX + 36, 68, pmZ);

        // -------------------------------------------------------
        // ROKER PIER — 0x888888 curved pier with lighthouse
        // northeast, jutting into the North Sea
        // -------------------------------------------------------
        var rpX = cx + 700;
        var rpZ = -180;
        // pier body — series of boxes to imply gentle curve
        makeBox(60, 8, 18, 0x888888, rpX,      4, rpZ);
        makeBox(60, 8, 18, 0x888888, rpX + 60, 4, rpZ - 8);
        makeBox(60, 8, 18, 0x888888, rpX + 118, 4, rpZ - 20);
        makeBox(40, 8, 18, 0x888888, rpX + 168, 4, rpZ - 36);
        // pier parapet
        makeBox(260, 3, 2, 0x999999, rpX + 60, 9, rpZ - 14);
        // lighthouse base
        makeCyl(8, 10, 28, 10, 0xFFFFFF, rpX + 178, 18, rpZ - 44);
        // lighthouse lantern room
        makeCyl(7, 7, 8, 10, 0xDD3333, rpX + 178, 36, rpZ - 44);
        // lighthouse top dome
        makeSphere(7, 8, 6, 0xCCCCCC, rpX + 178, 43, rpZ - 44);

        // -------------------------------------------------------
        // SUNDERLAND GLASS INDUSTRY — 0x88CCFF glass-works
        // south bank, west area, cx - 200, z = 200
        // -------------------------------------------------------
        var gwX = cx - 200;
        var gwZ = 200;
        // main glassworks building
        makeBox(80, 22, 50, 0x88CCFF, gwX, 11, gwZ);
        // large kiln/furnace buildings
        makeCyl(12, 14, 28, 10, 0x88AACC, gwX - 50, 14, gwZ);
        makeCyl(10, 12, 24, 10, 0x88AACC, gwX + 50, 12, gwZ + 10);
        // tall chimney
        makeCyl(3, 5, 50, 8, 0x666666, gwX, 25, gwZ - 30);
        // warehouse
        makeBox(50, 14, 30, 0x6699BB, gwX + 70, 7, gwZ);
        // glass storage shed (low, wide)
        makeBox(60, 8, 40, 0x77AABB, gwX - 60, 4, gwZ + 40);

        // -------------------------------------------------------
        // HYLTON CASTLE — 0xAAAAAA medieval castle keep fragment
        // western edge, cx - 700, z = -100
        // -------------------------------------------------------
        var hcX = cx - 700;
        var hcZ = -100;
        // keep walls (gatehouse fragment)
        makeBox(30, 40, 8,  0xAAAAAA, hcX, 20, hcZ);           // front wall
        makeBox(30, 40, 8,  0x999999, hcX, 20, hcZ + 30);      // back wall
        makeBox(8,  40, 30, 0xAAAAAA, hcX - 15, 20, hcZ + 15); // west side
        makeBox(8,  40, 30, 0x999999, hcX + 15, 20, hcZ + 15); // east side
        // corner turrets
        makeCyl(5, 5, 44, 8, 0xBBBBBB, hcX - 15, 22, hcZ);
        makeCyl(5, 5, 44, 8, 0xBBBBBB, hcX + 15, 22, hcZ);
        makeCyl(5, 5, 44, 8, 0xBBBBBB, hcX - 15, 22, hcZ + 30);
        makeCyl(5, 5, 44, 8, 0xBBBBBB, hcX + 15, 22, hcZ + 30);
        // turret conical caps
        makeCone(6, 10, 8, 0x888888, hcX - 15, 47, hcZ);
        makeCone(6, 10, 8, 0x888888, hcX + 15, 47, hcZ);
        makeCone(6, 10, 8, 0x888888, hcX - 15, 47, hcZ + 30);
        makeCone(6, 10, 8, 0x888888, hcX + 15, 47, hcZ + 30);
        // battlement merlon boxes along top
        makeBox(5, 6, 5, 0xAAAAAA, hcX - 10, 43, hcZ - 4);
        makeBox(5, 6, 5, 0xAAAAAA, hcX,      43, hcZ - 4);
        makeBox(5, 6, 5, 0xAAAAAA, hcX + 10, 43, hcZ - 4);
        // castle hill mound
        makeSphere(40, 10, 6, 0x5a6e40, hcX, -30, hcZ + 15);

        // -------------------------------------------------------
        // EXTRA SUNDERLAND DETAILS
        // -------------------------------------------------------
        // Wearmouth rail bridge (parallel to road bridge, slightly upstream)
        makeBox(200, 5, 20, 0x666666, cx - 30, 8, 30);
        makeBox(4, 30, 4, 0x666666, cx - 80, 23, 30);
        makeBox(4, 30, 4, 0x666666, cx + 80, 23, 30);
        makeBox(200, 4, 4, 0x777777, cx - 30, 25, 28);
        makeBox(200, 4, 4, 0x777777, cx - 30, 25, 32);

        // Sunderland town centre blocks (south bank)
        makeBox(40, 20, 30, 0xBBAA99, cx + 30, 10, 180);
        makeBox(30, 28, 24, 0xCCBBAA, cx + 80, 14, 190);
        makeBox(50, 16, 35, 0xAA9988, cx - 60, 8,  200);

        // Sunderland Minster church
        makeBox(20, 24, 14, 0xD4C8A0, cx - 140, 12, 190);
        makeCyl(4, 4, 30, 8, 0xD4C8A0, cx - 140, 27, 190);
        makeCone(4, 12, 8, 0xBB9944, cx - 140, 48, 190);

        // Roker beach coastal road sea wall
        makeBox(200, 8, 8, 0x888888, cx + 800, 4, -310);

        // Port of Sunderland quayside cranes
        makeCyl(3, 3, 40, 8, 0x666666, cx + 500, 20, 60);
        makeBox(40, 4, 4, 0x666666, cx + 520, 42, 60);
        makeCyl(3, 3, 40, 8, 0x666666, cx + 550, 20, 60);
        makeBox(40, 4, 4, 0x666666, cx + 570, 42, 60);

        // Sunderland riverside path / embankment
        makeBox(300, 3, 15, 0x887766, cx, 1, -95);
        makeBox(300, 3, 15, 0x887766, cx, 1,  95);

        // road bridge approach roads
        makeBox(150, 3, 24, 0x555555, cx - 180, 1, 0);
        makeBox(150, 3, 24, 0x555555, cx + 180, 1, 0);
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
