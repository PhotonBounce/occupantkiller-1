window.BamburghCastle = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 20920;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function makeMesh(geometry, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildBasaltCrag();
        buildKeep();
        buildKeepTurrets();
        buildKeepBattlements();
        buildCastleComplex();
        buildBeachAndSea();
        buildSandDunes();
        buildVillage();
        buildStAidansChurch();
        buildGraceDarlingMuseum();
        buildFarneIslands();
        buildLindisfarne();
    }

    function buildBasaltCrag() {
        // Main basalt outcrop base — volcanic whinstone dolerite crag
        makeMesh(new THREE.BoxGeometry(120, 18, 90), 0x3a3a3a,
            BASE_X, BASE_Y + 9, BASE_Z);
        // Crag sheer south face — stepped rock faces
        makeMesh(new THREE.BoxGeometry(100, 12, 20), 0x3a3a3a,
            BASE_X, BASE_Y + 4, BASE_Z + 55);
        makeMesh(new THREE.BoxGeometry(80, 8, 14), 0x363636,
            BASE_X, BASE_Y + 2, BASE_Z + 68);
        // West rock face
        makeMesh(new THREE.BoxGeometry(20, 14, 80), 0x3a3a3a,
            BASE_X - 70, BASE_Y + 5, BASE_Z);
        // East rock promontory
        makeMesh(new THREE.BoxGeometry(22, 10, 60), 0x383838,
            BASE_X + 72, BASE_Y + 3, BASE_Z);
        // Rock boulders scattered around base
        makeMesh(new THREE.BoxGeometry(12, 7, 10), 0x404040,
            BASE_X - 55, BASE_Y + 2, BASE_Z + 50);
        makeMesh(new THREE.BoxGeometry(8, 5, 9), 0x3c3c3c,
            BASE_X + 60, BASE_Y + 2, BASE_Z + 45);
        makeMesh(new THREE.BoxGeometry(15, 6, 12), 0x383838,
            BASE_X + 80, BASE_Y + 1, BASE_Z - 20);
        // Crag top platform — basalt surface the castle stands on
        makeMesh(new THREE.BoxGeometry(130, 4, 100), 0x424242,
            BASE_X, BASE_Y + 19, BASE_Z - 5);
    }

    function buildKeep() {
        // Bamburgh Keep — massive Norman keep, tallest in England at 35m
        // Main rectangular keep body
        makeMesh(new THREE.BoxGeometry(32, 36, 26), 0xD4C9B0,
            BASE_X, BASE_Y + 40, BASE_Z - 10);
        // Keep inner core — slightly darker to give depth illusion
        makeMesh(new THREE.BoxGeometry(28, 34, 22), 0xCEC3AA,
            BASE_X, BASE_Y + 40, BASE_Z - 10);
        // Keep base plinth / battered base
        makeMesh(new THREE.BoxGeometry(36, 6, 30), 0xC8BDA4,
            BASE_X, BASE_Y + 24, BASE_Z - 10);
        // Keep entrance tower — forebuilding on south face
        makeMesh(new THREE.BoxGeometry(10, 20, 8), 0xD4C9B0,
            BASE_X, BASE_Y + 31, BASE_Z + 9);
        // Entrance steps / ramp
        makeMesh(new THREE.BoxGeometry(8, 3, 10), 0xC8BDA4,
            BASE_X, BASE_Y + 22, BASE_Z + 17);
        // Keep windows — narrow Norman lancet slits (dark boxes recessed)
        makeMesh(new THREE.BoxGeometry(2, 4, 1), 0x2a2520,
            BASE_X - 8, BASE_Y + 42, BASE_Z - 23);
        makeMesh(new THREE.BoxGeometry(2, 4, 1), 0x2a2520,
            BASE_X + 8, BASE_Y + 42, BASE_Z - 23);
        makeMesh(new THREE.BoxGeometry(2, 4, 1), 0x2a2520,
            BASE_X - 8, BASE_Y + 50, BASE_Z - 23);
        makeMesh(new THREE.BoxGeometry(2, 4, 1), 0x2a2520,
            BASE_X + 8, BASE_Y + 50, BASE_Z - 23);
        // Window slits on east face
        makeMesh(new THREE.BoxGeometry(1, 4, 2), 0x2a2520,
            BASE_X + 17, BASE_Y + 42, BASE_Z - 8);
        makeMesh(new THREE.BoxGeometry(1, 4, 2), 0x2a2520,
            BASE_X + 17, BASE_Y + 50, BASE_Z - 8);
        // Window slits on west face
        makeMesh(new THREE.BoxGeometry(1, 4, 2), 0x2a2520,
            BASE_X - 17, BASE_Y + 42, BASE_Z - 8);
        makeMesh(new THREE.BoxGeometry(1, 4, 2), 0x2a2520,
            BASE_X - 17, BASE_Y + 50, BASE_Z - 8);
    }

    function buildKeepTurrets() {
        // Four corner turrets on the keep — square Norman turrets
        // NW turret
        makeMesh(new THREE.BoxGeometry(8, 40, 8), 0xD4C9B0,
            BASE_X - 20, BASE_Y + 41, BASE_Z - 23);
        // NE turret
        makeMesh(new THREE.BoxGeometry(8, 40, 8), 0xD4C9B0,
            BASE_X + 20, BASE_Y + 41, BASE_Z - 23);
        // SW turret
        makeMesh(new THREE.BoxGeometry(8, 38, 8), 0xD4C9B0,
            BASE_X - 20, BASE_Y + 40, BASE_Z + 3);
        // SE turret
        makeMesh(new THREE.BoxGeometry(8, 38, 8), 0xD4C9B0,
            BASE_X + 20, BASE_Y + 40, BASE_Z + 3);
        // Turret caps — Victorian roofline pyramidal caps
        makeMesh(new THREE.ConeGeometry(6, 6, 4), 0xC0B8A0,
            BASE_X - 20, BASE_Y + 62, BASE_Z - 23);
        makeMesh(new THREE.ConeGeometry(6, 6, 4), 0xC0B8A0,
            BASE_X + 20, BASE_Y + 62, BASE_Z - 23);
        makeMesh(new THREE.ConeGeometry(6, 6, 4), 0xC0B8A0,
            BASE_X - 20, BASE_Y + 60, BASE_Z + 3);
        makeMesh(new THREE.ConeGeometry(6, 6, 4), 0xC0B8A0,
            BASE_X + 20, BASE_Y + 60, BASE_Z + 3);
    }

    function buildKeepBattlements() {
        // Victorian restored roofline battlements — merlons along keep top
        var merlonColor = 0xD4C9B0;
        var keepTopY = BASE_Y + 59;
        // North face merlons
        makeMesh(new THREE.BoxGeometry(5, 4, 3), merlonColor,
            BASE_X - 12, keepTopY, BASE_Z - 23);
        makeMesh(new THREE.BoxGeometry(5, 4, 3), merlonColor,
            BASE_X, keepTopY, BASE_Z - 23);
        makeMesh(new THREE.BoxGeometry(5, 4, 3), merlonColor,
            BASE_X + 12, keepTopY, BASE_Z - 23);
        // South face merlons
        makeMesh(new THREE.BoxGeometry(5, 4, 3), merlonColor,
            BASE_X - 12, keepTopY, BASE_Z + 3);
        makeMesh(new THREE.BoxGeometry(5, 4, 3), merlonColor,
            BASE_X, keepTopY, BASE_Z + 3);
        makeMesh(new THREE.BoxGeometry(5, 4, 3), merlonColor,
            BASE_X + 12, keepTopY, BASE_Z + 3);
        // East face merlons
        makeMesh(new THREE.BoxGeometry(3, 4, 5), merlonColor,
            BASE_X + 17, keepTopY, BASE_Z - 10);
        makeMesh(new THREE.BoxGeometry(3, 4, 5), merlonColor,
            BASE_X + 17, keepTopY, BASE_Z - 2);
        // West face merlons
        makeMesh(new THREE.BoxGeometry(3, 4, 5), merlonColor,
            BASE_X - 17, keepTopY, BASE_Z - 10);
        makeMesh(new THREE.BoxGeometry(3, 4, 5), merlonColor,
            BASE_X - 17, keepTopY, BASE_Z - 2);
        // Keep roof walkway parapet
        makeMesh(new THREE.BoxGeometry(34, 2, 28), 0xC8BDA4,
            BASE_X, keepTopY - 2, BASE_Z - 10);
    }

    function buildCastleComplex() {
        // Great Hall — large range east of keep
        makeMesh(new THREE.BoxGeometry(40, 14, 18), 0xD4C9B0,
            BASE_X + 46, BASE_Y + 28, BASE_Z - 14);
        // Great Hall roof
        makeMesh(new THREE.BoxGeometry(42, 5, 20), 0xBEB5A0,
            BASE_X + 46, BASE_Y + 37, BASE_Z - 14);
        // Great Hall windows
        makeMesh(new THREE.BoxGeometry(1, 5, 3), 0x2a2520,
            BASE_X + 67, BASE_Y + 30, BASE_Z - 14);
        makeMesh(new THREE.BoxGeometry(1, 5, 3), 0x2a2520,
            BASE_X + 67, BASE_Y + 30, BASE_Z - 6);

        // West Wing — long range on west side
        makeMesh(new THREE.BoxGeometry(18, 12, 50), 0xD4C9B0,
            BASE_X - 51, BASE_Y + 27, BASE_Z - 12);
        // West wing battlements
        makeMesh(new THREE.BoxGeometry(3, 3, 45), 0xD4C9B0,
            BASE_X - 60, BASE_Y + 35, BASE_Z - 12);
        makeMesh(new THREE.BoxGeometry(3, 3, 45), 0xD4C9B0,
            BASE_X - 42, BASE_Y + 35, BASE_Z - 12);

        // Chapel — Norman chapel with apse end
        makeMesh(new THREE.BoxGeometry(16, 12, 28), 0xD4C9B0,
            BASE_X + 20, BASE_Y + 27, BASE_Z - 38);
        // Chapel apse (rounded east end approximated with cylinder)
        makeMesh(new THREE.CylinderGeometry(8, 8, 12, 8), 0xD4C9B0,
            BASE_X + 20, BASE_Y + 27, BASE_Z - 52);
        // Chapel tower
        makeMesh(new THREE.BoxGeometry(8, 18, 8), 0xD4C9B0,
            BASE_X + 12, BASE_Y + 30, BASE_Z - 38);
        // Chapel cross on tower
        makeMesh(new THREE.BoxGeometry(1, 5, 1), 0xC0B8A0,
            BASE_X + 12, BASE_Y + 42, BASE_Z - 38);
        makeMesh(new THREE.BoxGeometry(4, 1, 1), 0xC0B8A0,
            BASE_X + 12, BASE_Y + 44, BASE_Z - 38);

        // King's Hall — north range
        makeMesh(new THREE.BoxGeometry(55, 13, 16), 0xD4C9B0,
            BASE_X - 8, BASE_Y + 27, BASE_Z - 48);
        // King's Hall battlements
        makeMesh(new THREE.BoxGeometry(50, 3, 2), 0xD4C9B0,
            BASE_X - 8, BASE_Y + 35, BASE_Z - 56);

        // Curtain wall — north perimeter
        makeMesh(new THREE.BoxGeometry(130, 10, 4), 0xD4C9B0,
            BASE_X, BASE_Y + 26, BASE_Z - 65);
        // Curtain wall — east perimeter
        makeMesh(new THREE.BoxGeometry(4, 10, 80), 0xD4C9B0,
            BASE_X + 70, BASE_Y + 26, BASE_Z - 15);
        // Curtain wall — west perimeter
        makeMesh(new THREE.BoxGeometry(4, 10, 80), 0xD4C9B0,
            BASE_X - 70, BASE_Y + 26, BASE_Z - 15);

        // Gatehouse — main entrance south
        makeMesh(new THREE.BoxGeometry(18, 16, 12), 0xD4C9B0,
            BASE_X, BASE_Y + 29, BASE_Z + 45);
        // Gatehouse archway passage (dark box for tunnel)
        makeMesh(new THREE.BoxGeometry(6, 8, 13), 0x1a1510,
            BASE_X, BASE_Y + 26, BASE_Z + 45);
        // Gatehouse flanking towers
        makeMesh(new THREE.CylinderGeometry(5, 5, 18, 8), 0xD4C9B0,
            BASE_X - 10, BASE_Y + 30, BASE_Z + 45);
        makeMesh(new THREE.CylinderGeometry(5, 5, 18, 8), 0xD4C9B0,
            BASE_X + 10, BASE_Y + 30, BASE_Z + 45);
        // Gatehouse tower caps
        makeMesh(new THREE.ConeGeometry(5.5, 5, 8), 0xBEB5A0,
            BASE_X - 10, BASE_Y + 40, BASE_Z + 45);
        makeMesh(new THREE.ConeGeometry(5.5, 5, 8), 0xBEB5A0,
            BASE_X + 10, BASE_Y + 40, BASE_Z + 45);

        // Armstrong Museum / Armoury range
        makeMesh(new THREE.BoxGeometry(30, 11, 14), 0xD4C9B0,
            BASE_X - 20, BASE_Y + 26, BASE_Z + 30);

        // Water well in courtyard
        makeMesh(new THREE.CylinderGeometry(2, 2, 3, 8), 0x888070,
            BASE_X + 10, BASE_Y + 22, BASE_Z + 5);
    }

    function buildBeachAndSea() {
        // Vast Northumberland golden sand beach stretching south
        makeMesh(new THREE.BoxGeometry(600, 2, 300), 0xE8D5AA,
            BASE_X + 100, BASE_Y - 1, BASE_Z + 200);
        // Beach closer to castle base
        makeMesh(new THREE.BoxGeometry(200, 2, 120), 0xEAD8AD,
            BASE_X, BASE_Y - 1, BASE_Z + 120);
        // North Sea — vast expanse east
        makeMesh(new THREE.BoxGeometry(800, 1, 600), 0x005577,
            BASE_X + 450, BASE_Y - 2, BASE_Z - 100);
        // Sea nearshore — slightly lighter shallows
        makeMesh(new THREE.BoxGeometry(120, 1, 400), 0x006688,
            BASE_X + 160, BASE_Y - 2, BASE_Z + 50);
        // Wave foam line — white strip at waterline
        makeMesh(new THREE.BoxGeometry(500, 1, 6), 0xE8F0F8,
            BASE_X + 250, BASE_Y - 1, BASE_Z + 80);
        // Wet sand intertidal zone
        makeMesh(new THREE.BoxGeometry(300, 1, 30), 0xD4BF90,
            BASE_X + 180, BASE_Y - 1, BASE_Z + 90);
    }

    function buildSandDunes() {
        // Dune ridge system behind beach
        makeMesh(new THREE.BoxGeometry(180, 8, 30), 0xD4B483,
            BASE_X + 60, BASE_Y + 3, BASE_Z + 170);
        makeMesh(new THREE.BoxGeometry(140, 6, 20), 0xCFB07E,
            BASE_X - 20, BASE_Y + 2, BASE_Z + 190);
        makeMesh(new THREE.BoxGeometry(100, 5, 18), 0xD4B483,
            BASE_X + 150, BASE_Y + 1, BASE_Z + 185);
        // Individual dune mounds
        makeMesh(new THREE.SphereGeometry(12, 8, 6), 0xD4B483,
            BASE_X + 30, BASE_Y + 2, BASE_Z + 165);
        makeMesh(new THREE.SphereGeometry(9, 8, 6), 0xCFB07E,
            BASE_X + 80, BASE_Y + 1, BASE_Z + 175);
        makeMesh(new THREE.SphereGeometry(14, 8, 6), 0xD8B888,
            BASE_X - 40, BASE_Y + 3, BASE_Z + 180);
        // Marram grass clumps (thin cylinders)
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 5), 0x8B9B5A,
            BASE_X + 30, BASE_Y + 8, BASE_Z + 163);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 5), 0x7A8B4A,
            BASE_X + 35, BASE_Y + 8, BASE_Z + 167);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 5), 0x8B9B5A,
            BASE_X + 80, BASE_Y + 7, BASE_Z + 173);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 5), 0x7A8B4A,
            BASE_X - 40, BASE_Y + 9, BASE_Z + 178);
    }

    function buildVillage() {
        // Bamburgh village — stone cottages south of castle
        // Village green / road
        makeMesh(new THREE.BoxGeometry(80, 1, 40), 0x8B8060,
            BASE_X - 80, BASE_Y, BASE_Z + 120);
        // Village road surface
        makeMesh(new THREE.BoxGeometry(10, 1, 100), 0x706858,
            BASE_X - 80, BASE_Y + 0.5, BASE_Z + 100);

        // Stone cottages — row of village houses
        makeMesh(new THREE.BoxGeometry(10, 7, 8), 0xF5F0E8,
            BASE_X - 110, BASE_Y + 3, BASE_Z + 110);
        makeMesh(new THREE.BoxGeometry(10, 7, 8), 0xEEE9E0,
            BASE_X - 122, BASE_Y + 3, BASE_Z + 110);
        makeMesh(new THREE.BoxGeometry(10, 7, 8), 0xF5F0E8,
            BASE_X - 134, BASE_Y + 3, BASE_Z + 110);
        makeMesh(new THREE.BoxGeometry(12, 8, 10), 0xECE7DE,
            BASE_X - 148, BASE_Y + 4, BASE_Z + 110);
        // Cottage roofs
        makeMesh(new THREE.BoxGeometry(12, 3, 10), 0x8B7355,
            BASE_X - 110, BASE_Y + 8, BASE_Z + 110);
        makeMesh(new THREE.BoxGeometry(12, 3, 10), 0x7A6445,
            BASE_X - 122, BASE_Y + 8, BASE_Z + 110);
        makeMesh(new THREE.BoxGeometry(12, 3, 10), 0x8B7355,
            BASE_X - 134, BASE_Y + 8, BASE_Z + 110);
        makeMesh(new THREE.BoxGeometry(14, 3, 12), 0x7A6445,
            BASE_X - 148, BASE_Y + 9, BASE_Z + 110);
        // Second row of cottages
        makeMesh(new THREE.BoxGeometry(10, 7, 8), 0xF5F0E8,
            BASE_X - 110, BASE_Y + 3, BASE_Z + 130);
        makeMesh(new THREE.BoxGeometry(10, 7, 8), 0xEEE9E0,
            BASE_X - 122, BASE_Y + 3, BASE_Z + 130);
        makeMesh(new THREE.BoxGeometry(10, 3, 10), 0x8B7355,
            BASE_X - 110, BASE_Y + 8, BASE_Z + 130);
        makeMesh(new THREE.BoxGeometry(10, 3, 10), 0x7A6445,
            BASE_X - 122, BASE_Y + 8, BASE_Z + 130);
        // Lord Crewe Arms Hotel — large village inn
        makeMesh(new THREE.BoxGeometry(24, 9, 14), 0xF0EBE2,
            BASE_X - 60, BASE_Y + 4, BASE_Z + 118);
        makeMesh(new THREE.BoxGeometry(26, 3, 16), 0x7A6445,
            BASE_X - 60, BASE_Y + 10, BASE_Z + 118);
    }

    function buildStAidansChurch() {
        // St Aidan's Church — where Grace Darling is buried
        // Nave
        makeMesh(new THREE.BoxGeometry(14, 10, 28), 0xE8E0D0,
            BASE_X - 170, BASE_Y + 5, BASE_Z + 100);
        // Chancel (east end)
        makeMesh(new THREE.BoxGeometry(10, 9, 12), 0xE0D8C8,
            BASE_X - 170, BASE_Y + 4, BASE_Z + 75);
        // Tower
        makeMesh(new THREE.BoxGeometry(9, 22, 9), 0xE8E0D0,
            BASE_X - 163, BASE_Y + 11, BASE_Z + 114);
        // Tower battlements
        makeMesh(new THREE.BoxGeometry(10, 3, 10), 0xE8E0D0,
            BASE_X - 163, BASE_Y + 23, BASE_Z + 114);
        // Church roof
        makeMesh(new THREE.BoxGeometry(16, 4, 30), 0x808070,
            BASE_X - 170, BASE_Y + 12, BASE_Z + 100);
        // Chancel roof
        makeMesh(new THREE.BoxGeometry(12, 3, 14), 0x808070,
            BASE_X - 170, BASE_Y + 11, BASE_Z + 75);
        // Churchyard wall
        makeMesh(new THREE.BoxGeometry(60, 2, 2), 0xC8C0B0,
            BASE_X - 170, BASE_Y + 1, BASE_Z + 135);
        makeMesh(new THREE.BoxGeometry(2, 2, 80), 0xC8C0B0,
            BASE_X - 145, BASE_Y + 1, BASE_Z + 100);
        // Grace Darling memorial — obelisk/monument
        makeMesh(new THREE.BoxGeometry(3, 1, 3), 0xD0C8B8,
            BASE_X - 180, BASE_Y + 0.5, BASE_Z + 92);
        makeMesh(new THREE.CylinderGeometry(1, 1.5, 8, 4), 0xD0C8B8,
            BASE_X - 180, BASE_Y + 5, BASE_Z + 92);
        makeMesh(new THREE.ConeGeometry(1.2, 3, 4), 0xC8C0B0,
            BASE_X - 180, BASE_Y + 10, BASE_Z + 92);
    }

    function buildGraceDarlingMuseum() {
        // RNLI Grace Darling Museum building in village
        makeMesh(new THREE.BoxGeometry(20, 8, 14), 0xD3D3D3,
            BASE_X - 90, BASE_Y + 4, BASE_Z + 145);
        // Museum roof
        makeMesh(new THREE.BoxGeometry(22, 3, 16), 0xB0B0B0,
            BASE_X - 90, BASE_Y + 9, BASE_Z + 145);
        // Museum entrance porch
        makeMesh(new THREE.BoxGeometry(6, 6, 4), 0xCCCCCC,
            BASE_X - 90, BASE_Y + 3, BASE_Z + 153);
        // Museum sign board
        makeMesh(new THREE.BoxGeometry(8, 3, 0.5), 0x2244AA,
            BASE_X - 90, BASE_Y + 6, BASE_Z + 155);
    }

    function buildFarneIslands() {
        // Farne Islands — dark rocky islands offshore to the east
        // Inner Farne — main island
        makeMesh(new THREE.BoxGeometry(60, 5, 35), 0x3d3d3d,
            BASE_X + 500, BASE_Y - 1, BASE_Z - 80);
        // Inner Farne lighthouse — tall white tower
        makeMesh(new THREE.CylinderGeometry(2.5, 3, 22, 8), 0xF0F0F0,
            BASE_X + 515, BASE_Y + 12, BASE_Z - 82);
        // Lighthouse lamp housing
        makeMesh(new THREE.CylinderGeometry(3.5, 3.5, 4, 8), 0xDDDD00,
            BASE_X + 515, BASE_Y + 24, BASE_Z - 82);
        // Lighthouse lantern top
        makeMesh(new THREE.ConeGeometry(4, 3, 8), 0xC0C0C0,
            BASE_X + 515, BASE_Y + 27, BASE_Z - 82);
        // Staple Island
        makeMesh(new THREE.BoxGeometry(45, 4, 22), 0x3d3d3d,
            BASE_X + 560, BASE_Y - 2, BASE_Z + 20);
        // Brownsman Island
        makeMesh(new THREE.BoxGeometry(30, 3, 18), 0x3d3d3d,
            BASE_X + 490, BASE_Y - 2, BASE_Z - 30);
        // Longstone Rock — where Grace Darling launched rescue
        makeMesh(new THREE.BoxGeometry(20, 3, 12), 0x3d3d3d,
            BASE_X + 600, BASE_Y - 2, BASE_Z - 50);
        // Longstone lighthouse (smaller)
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 14, 8), 0xF0F0F0,
            BASE_X + 605, BASE_Y + 7, BASE_Z - 50);
        // Scattered rocks in sea
        makeMesh(new THREE.BoxGeometry(10, 2, 8), 0x3d3d3d,
            BASE_X + 420, BASE_Y - 2, BASE_Z - 60);
        makeMesh(new THREE.BoxGeometry(8, 2, 6), 0x3d3d3d,
            BASE_X + 450, BASE_Y - 2, BASE_Z + 10);
    }

    function buildLindisfarne() {
        // Holy Island / Lindisfarne — low dark strip on the horizon north
        makeMesh(new THREE.BoxGeometry(200, 3, 30), 0x2a2a2a,
            BASE_X + 200, BASE_Y - 1, BASE_Z - 500);
        // Lindisfarne Castle silhouette (tiny at horizon distance)
        makeMesh(new THREE.BoxGeometry(8, 12, 6), 0x383030,
            BASE_X + 280, BASE_Y + 7, BASE_Z - 510);
        // Lindisfarne Priory ruin silhouette
        makeMesh(new THREE.BoxGeometry(12, 8, 10), 0x383030,
            BASE_X + 220, BASE_Y + 5, BASE_Z - 508);
        // Causeway connecting to mainland (low flat strip)
        makeMesh(new THREE.BoxGeometry(12, 1, 200), 0x555550,
            BASE_X + 150, BASE_Y - 1, BASE_Z - 400);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
