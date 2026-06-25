window.ZurichOldTown = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 23120;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            BASE_X + (x || 0),
            BASE_Y + (y || 0),
            BASE_Z + (z || 0)
        );
        if (rx || ry || rz) {
            mesh.rotation.set(rx || 0, ry || 0, rz || 0);
        }
        if (sx || sy || sz) {
            mesh.scale.set(sx || 1, sy || 1, sz || 1);
        }
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addWireframe(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var edges = new THREE.EdgesGeometry(geo);
        var line = new THREE.LineSegments(edges, mat);
        line.position.set(
            BASE_X + (x || 0),
            BASE_Y + (y || 0),
            BASE_Z + (z || 0)
        );
        if (rx || ry || rz) {
            line.rotation.set(rx || 0, ry || 0, rz || 0);
        }
        scene.add(line);
        objects.push(line);
        return line;
    }

    function buildGroundPlate() {
        // Ground slab using BoxGeometry (PlaneGeometry forbidden)
        addMesh(new THREE.BoxGeometry(1200, 1, 1200), 0x8B7355, 0, -0.5, 0);
        // Hill terrain base (Lindenhugel)
        addMesh(new THREE.CylinderGeometry(80, 110, 35, 8), 0x6B8C42, -180, 17, -60);
        // Uetliberg mountain base
        addMesh(new THREE.ConeGeometry(140, 180, 8), 0x5A7A4A, -480, 90, 200);
        // Uetliberg upper cone
        addMesh(new THREE.ConeGeometry(60, 80, 8), 0x4A6A3A, -480, 200, 200);
    }

    function buildGrossmuenster() {
        // Main nave body
        addMesh(new THREE.BoxGeometry(30, 28, 55), 0xD4C8A0, 0, 14, 0);
        // Nave roof
        addMesh(new THREE.CylinderGeometry(0, 18, 20, 4), 0xB8A880, 0, 38, 0);
        // Left tower base
        addMesh(new THREE.BoxGeometry(12, 52, 12), 0xC8BC94, -12, 26, -18);
        // Right tower base
        addMesh(new THREE.BoxGeometry(12, 52, 12), 0xC8BC94, 12, 26, -18);
        // Left tower copper dome
        addMesh(new THREE.CylinderGeometry(0, 7, 14, 8), 0x4A7A5A, -12, 59, -18);
        // Right tower copper dome
        addMesh(new THREE.CylinderGeometry(0, 7, 14, 8), 0x4A7A5A, 12, 59, -18);
        // Tower lantern left
        addMesh(new THREE.CylinderGeometry(3, 3, 6, 8), 0xC8BC94, -12, 53, -18);
        // Tower lantern right
        addMesh(new THREE.CylinderGeometry(3, 3, 6, 8), 0xC8BC94, 12, 53, -18);
        // Rose window facade — sphere inset suggestion
        addMesh(new THREE.CylinderGeometry(5, 5, 1, 16), 0x8899AA, 0, 22, -27);
        // Transept arm left
        addMesh(new THREE.BoxGeometry(20, 20, 18), 0xD4C8A0, -20, 10, 5);
        // Transept arm right
        addMesh(new THREE.BoxGeometry(20, 20, 18), 0xD4C8A0, 20, 10, 5);
        // Apse — semicircular choir end
        addMesh(new THREE.CylinderGeometry(12, 12, 22, 8), 0xD0C4A0, 0, 11, 24);
        // Apse roof cone
        addMesh(new THREE.ConeGeometry(12, 10, 8), 0xB8A880, 0, 27, 24);
        // Buttress left rear
        addMesh(new THREE.BoxGeometry(4, 24, 6), 0xC0B498, -16, 12, 16);
        // Buttress right rear
        addMesh(new THREE.BoxGeometry(4, 24, 6), 0xC0B498, 16, 12, 16);
        // Portal arch over entrance
        addMesh(new THREE.CylinderGeometry(6, 6, 3, 8), 0xBCB090, 0, 6, -27.5);
        // Wireframe detail on towers
        addWireframe(new THREE.BoxGeometry(12, 52, 12), 0x9A8E70, -12, 26, -18);
        addWireframe(new THREE.BoxGeometry(12, 52, 12), 0x9A8E70, 12, 26, -18);
    }

    function buildFraumuenster() {
        // Main nave body
        addMesh(new THREE.BoxGeometry(22, 24, 42), 0xC8B880, -80, 12, -20);
        // Nave pitched roof
        addMesh(new THREE.CylinderGeometry(0, 13, 16, 4), 0xB0A060, -80, 32, -20);
        // Slender blue-green copper spire — tallest element
        addMesh(new THREE.CylinderGeometry(0, 5, 70, 8), 0x3A8A6A, -80, 59, -26);
        // Spire base cylinder
        addMesh(new THREE.CylinderGeometry(5, 7, 18, 8), 0x5A9A7A, -80, 27, -26);
        // Gothic apse
        addMesh(new THREE.CylinderGeometry(9, 9, 18, 6), 0xC8B880, -80, 9, 0);
        // Apse roof
        addMesh(new THREE.ConeGeometry(9, 12, 6), 0xB0A060, -80, 24, 0);
        // Chagall window blue glass representation — left
        addMesh(new THREE.BoxGeometry(2, 10, 1), 0x3366CC, -88, 12, -2);
        // Chagall window blue glass — right
        addMesh(new THREE.BoxGeometry(2, 10, 1), 0x2255BB, -72, 12, -2);
        // Chagall window blue glass — centre
        addMesh(new THREE.BoxGeometry(2, 10, 1), 0x4477DD, -80, 12, -1);
        // Small transept
        addMesh(new THREE.BoxGeometry(14, 18, 12), 0xC0B070, -80, 9, -18);
        // West facade wall
        addMesh(new THREE.BoxGeometry(22, 26, 2), 0xC8B880, -80, 13, -41);
    }

    function buildStPetersChurch() {
        // Nave body
        addMesh(new THREE.BoxGeometry(20, 20, 38), 0xF0EDE0, -50, 10, 60);
        // Nave roof
        addMesh(new THREE.CylinderGeometry(0, 12, 14, 4), 0xD8D4C0, -50, 27, 60);
        // Round clock tower — distinctive wide cylinder
        addMesh(new THREE.CylinderGeometry(10, 10, 38, 16), 0xECE8D8, -50, 19, 35);
        // Clock tower cap
        addMesh(new THREE.ConeGeometry(10, 14, 16), 0xD0CCC0, -50, 40, 35);
        // Clock face — large disc (CylinderGeometry very flat)
        addMesh(new THREE.CylinderGeometry(8, 8, 0.5, 16), 0xFFFFEE, -59, 24, 35);
        // Clock face back
        addMesh(new THREE.CylinderGeometry(8, 8, 0.5, 16), 0xFFFFEE, -41, 24, 35);
        // Clock hour hand suggestion
        addMesh(new THREE.BoxGeometry(0.5, 5, 0.3), 0x222222, -59.5, 24, 35);
        // Apse east end
        addMesh(new THREE.CylinderGeometry(7, 7, 16, 8), 0xF0EDE0, -50, 8, 76);
        addMesh(new THREE.ConeGeometry(7, 10, 8), 0xD8D4C0, -50, 22, 76);
    }

    function buildLindenhuegel() {
        // Hill already added in ground plate
        // Roman fort ruins wall segment A
        addMesh(new THREE.BoxGeometry(18, 4, 2), 0x9A8870, -172, 37, -68);
        // Roman fort ruins wall segment B
        addMesh(new THREE.BoxGeometry(2, 4, 16), 0x9A8870, -163, 37, -62);
        // Roman fort corner tower ruin
        addMesh(new THREE.CylinderGeometry(3, 4, 6, 8), 0x8A7A60, -162, 40, -68);
        // Lookout bench/platform top of hill
        addMesh(new THREE.BoxGeometry(14, 1, 8), 0x7A6A50, -180, 36, -60);
        // Trees on hill (cone shapes)
        addMesh(new THREE.ConeGeometry(5, 14, 6), 0x2D5A27, -195, 47, -70);
        addMesh(new THREE.CylinderGeometry(1, 1, 8, 6), 0x5A3A20, -195, 40, -70);
        addMesh(new THREE.ConeGeometry(5, 14, 6), 0x3A6A2A, -168, 43, -52);
        addMesh(new THREE.CylinderGeometry(1, 1, 8, 6), 0x5A3A20, -168, 36, -52);
        addMesh(new THREE.ConeGeometry(4, 12, 6), 0x2A5020, -185, 44, -55);
        addMesh(new THREE.CylinderGeometry(1, 1, 7, 6), 0x5A3A20, -185, 37, -55);
    }

    function buildLakeZurich() {
        // Lake — large flat box (PlaneGeometry forbidden)
        addMesh(new THREE.BoxGeometry(600, 1, 320), 0x4A7A9A, 200, -0.8, 200);
        // Lake shimmer highlight strip
        addMesh(new THREE.BoxGeometry(580, 0.2, 10), 0x6A9ABA, 200, -0.2, 180);
        // Sailboat hull 1
        addMesh(new THREE.BoxGeometry(6, 2, 14), 0xEEEEDD, 120, 0.5, 160);
        // Sailboat mast 1
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 18, 6), 0xC8B890, 120, 10, 160);
        // Sailboat sail 1
        addMesh(new THREE.ConeGeometry(0, 5, 4), 0xFFFFFF, 120, 16, 160);
        // Sailboat hull 2
        addMesh(new THREE.BoxGeometry(5, 2, 12), 0xDDDDCC, 160, 0.5, 180);
        // Sailboat mast 2
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 16, 6), 0xC8B890, 160, 9, 180);
        // Swan 1 body
        addMesh(new THREE.SphereGeometry(2, 8, 8), 0xFFFFFF, 100, 1.5, 155);
        // Swan 1 neck
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 3, 6), 0xFFFFFF, 100, 4, 153);
        // Swan 2 body
        addMesh(new THREE.SphereGeometry(2, 8, 8), 0xFFFFFF, 108, 1.5, 162);
        // Quay/dock wall
        addMesh(new THREE.BoxGeometry(120, 3, 4), 0xC8B898, 200, 1.5, 140);
        // Dock pier 1
        addMesh(new THREE.BoxGeometry(3, 2, 20), 0xC0AA88, 170, 0.5, 150);
        // Dock pier 2
        addMesh(new THREE.BoxGeometry(3, 2, 20), 0xC0AA88, 230, 0.5, 150);
    }

    function buildLimmatRiver() {
        // River channel — long flat box
        addMesh(new THREE.BoxGeometry(30, 0.8, 400), 0x4A6A8A, 0, -0.5, 0);
        // Guild house row left bank A
        addMesh(new THREE.BoxGeometry(12, 18, 10), 0xC89058, -18, 9, -80);
        addMesh(new THREE.CylinderGeometry(0, 7, 10, 4), 0xA87040, -18, 23, -80);
        // Guild house left bank B
        addMesh(new THREE.BoxGeometry(12, 16, 10), 0xD4A870, -32, 8, -80);
        addMesh(new THREE.CylinderGeometry(0, 7, 8, 4), 0xB88040, -32, 21, -80);
        // Guild house right bank A
        addMesh(new THREE.BoxGeometry(12, 20, 10), 0xBC8850, 18, 10, -80);
        addMesh(new THREE.CylinderGeometry(0, 7, 10, 4), 0xA07040, 18, 25, -80);
        // Guild house right bank B
        addMesh(new THREE.BoxGeometry(10, 15, 10), 0xC89A60, 30, 7.5, -80);
        addMesh(new THREE.CylinderGeometry(0, 6, 8, 4), 0xAA8050, 30, 19, -80);
        // River bridge
        addMesh(new THREE.BoxGeometry(34, 2, 8), 0xB0A090, 0, 1.5, -40);
        // Bridge parapet left
        addMesh(new THREE.BoxGeometry(34, 1.5, 1), 0xC0B0A0, 0, 3, -44);
        // Bridge parapet right
        addMesh(new THREE.BoxGeometry(34, 1.5, 1), 0xC0B0A0, 0, 3, -36);
    }

    function buildNiederdorf() {
        // Medieval quarter narrow buildings
        // Row A
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xD4A870, 60, 7, -60);
        addMesh(new THREE.CylinderGeometry(0, 5, 8, 4), 0xBC9060, 60, 18, -60);
        addMesh(new THREE.BoxGeometry(8, 12, 10), 0xC8986A, 70, 6, -60);
        addMesh(new THREE.CylinderGeometry(0, 5, 7, 4), 0xAA8050, 70, 16, -60);
        addMesh(new THREE.BoxGeometry(8, 16, 10), 0xDAAA72, 80, 8, -60);
        addMesh(new THREE.CylinderGeometry(0, 5, 9, 4), 0xC29060, 80, 21, -60);
        // Row B — alley behind
        addMesh(new THREE.BoxGeometry(8, 13, 10), 0xD0A46A, 60, 6.5, -72);
        addMesh(new THREE.BoxGeometry(8, 15, 10), 0xCA9C64, 70, 7.5, -72);
        addMesh(new THREE.BoxGeometry(8, 11, 10), 0xD8B078, 80, 5.5, -72);
        // Fountain in square
        addMesh(new THREE.CylinderGeometry(4, 5, 1.5, 12), 0xC0B090, 70, 1.5, -50);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 8), 0xA09070, 70, 3.5, -50);
        addMesh(new THREE.SphereGeometry(1, 8, 8), 0x4A7A9A, 70, 7, -50);
        // Cobblestone street suggestion
        addMesh(new THREE.BoxGeometry(60, 0.2, 12), 0x9A8A7A, 70, 0.1, -66);
        // Alleyway arch
        addMesh(new THREE.CylinderGeometry(4, 4, 2, 12), 0xB8A880, 65, 8, -66);
    }

    function buildBahnhofstrasse() {
        // Wide boulevard base
        addMesh(new THREE.BoxGeometry(20, 0.3, 320), 0xD0C8B8, -140, 0.2, -50);
        // Pavement strips
        addMesh(new THREE.BoxGeometry(8, 0.2, 320), 0xE0D8C8, -150, 0.25, -50);
        addMesh(new THREE.BoxGeometry(8, 0.2, 320), 0xE0D8C8, -130, 0.25, -50);
        // Department store A
        addMesh(new THREE.BoxGeometry(30, 22, 20), 0xD8D0C0, -162, 11, -60);
        addMesh(new THREE.BoxGeometry(30, 2, 22), 0xC8C0B0, -162, 23, -60);
        // Department store B
        addMesh(new THREE.BoxGeometry(28, 20, 18), 0xDCD4C4, -162, 10, -30);
        // Bank building — imposing columns
        addMesh(new THREE.BoxGeometry(26, 24, 16), 0xE8E4D8, -162, 12, -90);
        // Bank columns
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 22, 8), 0xF0EDE0, -155, 11, -83);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 22, 8), 0xF0EDE0, -162, 11, -83);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 22, 8), 0xF0EDE0, -169, 11, -83);
        // Street lamp post A
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), 0x444444, -145, 4, -50);
        addMesh(new THREE.SphereGeometry(0.8, 8, 8), 0xFFEE88, -145, 8.5, -50);
        // Street lamp post B
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), 0x444444, -145, 4, -90);
        addMesh(new THREE.SphereGeometry(0.8, 8, 8), 0xFFEE88, -145, 8.5, -90);
        // Street lamp post C
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), 0x444444, -135, 4, -70);
        addMesh(new THREE.SphereGeometry(0.8, 8, 8), 0xFFEE88, -135, 8.5, -70);
        // Tram line tracks suggestion
        addMesh(new THREE.BoxGeometry(1, 0.1, 320), 0x888888, -138, 0.3, -50);
        addMesh(new THREE.BoxGeometry(1, 0.1, 320), 0x888888, -142, 0.3, -50);
    }

    function buildSwissNationalMuseum() {
        // Main castle-like museum body
        addMesh(new THREE.BoxGeometry(50, 28, 36), 0x9A9A9A, -260, 14, -30);
        // Central tower — tall Gothic Revival
        addMesh(new THREE.BoxGeometry(14, 44, 14), 0x9A9A9A, -260, 22, -30);
        addMesh(new THREE.ConeGeometry(8, 18, 4), 0x888888, -260, 53, -30);
        // Left turret
        addMesh(new THREE.CylinderGeometry(5, 5, 32, 8), 0x9A9A9A, -278, 16, -42);
        addMesh(new THREE.ConeGeometry(5, 12, 8), 0x888888, -278, 38, -42);
        // Right turret
        addMesh(new THREE.CylinderGeometry(5, 5, 32, 8), 0x9A9A9A, -242, 16, -42);
        addMesh(new THREE.ConeGeometry(5, 12, 8), 0x888888, -242, 38, -42);
        // Corner turret rear left
        addMesh(new THREE.CylinderGeometry(4, 4, 26, 8), 0x9A9A9A, -278, 13, -18);
        addMesh(new THREE.ConeGeometry(4, 10, 8), 0x888888, -278, 31, -18);
        // Corner turret rear right
        addMesh(new THREE.CylinderGeometry(4, 4, 26, 8), 0x9A9A9A, -242, 13, -18);
        addMesh(new THREE.ConeGeometry(4, 10, 8), 0x888888, -242, 31, -18);
        // Museum entrance portico
        addMesh(new THREE.BoxGeometry(18, 12, 6), 0xAAAAAA, -260, 6, -49);
        addMesh(new THREE.CylinderGeometry(0, 10, 8, 4), 0x999999, -260, 16, -49);
        // Courtyard wall stub
        addMesh(new THREE.BoxGeometry(50, 5, 2), 0x9A9A9A, -260, 2.5, -52);
        // Wireframe accent on main body
        addWireframe(new THREE.BoxGeometry(50, 28, 36), 0x777777, -260, 14, -30);
    }

    function buildUetliberg() {
        // Mountain already in ground plate
        // TV tower mast base
        addMesh(new THREE.CylinderGeometry(3, 5, 30, 8), 0xCCCCCC, -480, 270, 200);
        // TV tower mast upper section
        addMesh(new THREE.CylinderGeometry(1.5, 3, 30, 8), 0xBBBBBB, -480, 315, 200);
        // TV tower antenna spike
        addMesh(new THREE.CylinderGeometry(0, 1, 20, 6), 0xAAAAAA, -480, 340, 200);
        // TV tower observation deck ring
        addMesh(new THREE.CylinderGeometry(8, 8, 4, 12), 0xCCCCCC, -480, 292, 200);
        // TV tower disc dish
        addMesh(new THREE.CylinderGeometry(6, 6, 1, 12), 0xDDDDDD, -480, 296, 200);
        // Cable car station building
        addMesh(new THREE.BoxGeometry(16, 10, 12), 0xBBBBB0, -480, 185, 200);
        addMesh(new THREE.CylinderGeometry(0, 9, 7, 4), 0xAAAEA8, -480, 192, 200);
        // Cable car pylon
        addMesh(new THREE.CylinderGeometry(1, 1.5, 40, 6), 0x999999, -420, 130, 200);
        // Cable car cabin hint
        addMesh(new THREE.BoxGeometry(4, 5, 3), 0xCC3333, -440, 120, 200);
        // Alpine trees on mountain
        addMesh(new THREE.ConeGeometry(6, 18, 6), 0x2A5020, -500, 195, 185);
        addMesh(new THREE.CylinderGeometry(1, 1, 10, 6), 0x5A3A20, -500, 185, 185);
        addMesh(new THREE.ConeGeometry(5, 14, 6), 0x3A6020, -462, 190, 215);
        addMesh(new THREE.CylinderGeometry(1, 1, 8, 6), 0x5A3A20, -462, 183, 215);
    }

    function buildExtraDetails() {
        // Rathaus (City Hall) near river
        addMesh(new THREE.BoxGeometry(22, 18, 16), 0xDDC890, 8, 9, -100);
        addMesh(new THREE.CylinderGeometry(0, 12, 10, 4), 0xCCB880, 8, 23, -100);
        // Clock on rathaus
        addMesh(new THREE.CylinderGeometry(2.5, 2.5, 0.4, 12), 0xFFFFCC, 8, 18, -108);
        // Lindenhugel path steps
        addMesh(new THREE.BoxGeometry(5, 1, 30), 0x8A7A60, -170, 8, -60);
        // Lake promenade railing posts
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), 0x666666, 140, 2, 143);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), 0x666666, 155, 2, 143);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), 0x666666, 170, 2, 143);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), 0x666666, 185, 2, 143);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), 0x666666, 200, 2, 143);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), 0x666666, 215, 2, 143);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), 0x666666, 230, 2, 143);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 3, 6), 0x666666, 245, 2, 143);
        // Niederdorf well
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 2, 10), 0xAA9977, 85, 1, -50);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x8A7755, 83, 3, -50);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), 0x8A7755, 87, 3, -50);
        addMesh(new THREE.BoxGeometry(6, 0.5, 0.5), 0x8A7755, 85, 5, -50);
        // Grossmuenster steps
        addMesh(new THREE.BoxGeometry(20, 1, 6), 0xC0B898, 0, 0.5, -31);
        addMesh(new THREE.BoxGeometry(18, 2, 5), 0xC0B898, 0, 2, -30);
        // Fraumuenster garden wall
        addMesh(new THREE.BoxGeometry(30, 3, 1.5), 0xC0A860, -80, 1.5, 6);
    }

    function build() {
        buildGroundPlate();
        buildGrossmuenster();
        buildFraumuenster();
        buildStPetersChurch();
        buildLindenhuegel();
        buildLakeZurich();
        buildLimmatRiver();
        buildNiederdorf();
        buildBahnhofstrasse();
        buildSwissNationalMuseum();
        buildUetliberg();
        buildExtraDetails();
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
