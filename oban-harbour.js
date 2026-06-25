window.ObanHarbour = (function() {
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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(edges, mat);
        ls.position.set(x, y, z);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    // McCaig's Tower — Colosseum-like granite folly on Battery Hill
    function buildMccaigsT() {
        var ox = 20120 - 60;
        var oz = -180;
        var granite = 0xD4C9B0;
        var darkGranite = 0xA89E8A;
        var hillGreen = 0x4a7c3f;

        // Battery Hill ground mound
        makeBox(120, 12, 120, hillGreen, ox, 6, oz);
        makeBox(90, 6, 90, hillGreen, ox, 15, oz);

        // Outer wall ring — built from 16 wall segments around circle
        var radius = 36;
        var wallH = 22;
        var wallW = 14;
        var wallD = 5;
        for (var wi = 0; wi < 16; wi++) {
            var ang = (wi / 16) * Math.PI * 2;
            var wx = ox + Math.cos(ang) * radius;
            var wz = oz + Math.sin(ang) * radius;
            var wallSeg = makeBox(wallW, wallH, wallD, granite, wx, wallH / 2 + 18, wz);
            wallSeg.rotation.y = ang;
        }

        // Inner arch ring — arched openings represented as tall narrow boxes
        // Each arch: two pillars + lintel box, forming colosseum arch shape
        var archRadius = 30;
        for (var ai = 0; ai < 12; ai++) {
            var aang = (ai / 12) * Math.PI * 2;
            var ax = ox + Math.cos(aang) * archRadius;
            var az = oz + Math.sin(aang) * archRadius;
            // Left pillar
            var leftAng = aang - 0.12;
            var leftX = ox + Math.cos(leftAng) * archRadius;
            var leftZ = oz + Math.sin(leftAng) * archRadius;
            var pillarL = makeBox(3, 16, 3, darkGranite, leftX, 26, leftZ);
            pillarL.rotation.y = aang;
            // Right pillar
            var rightAng = aang + 0.12;
            var rightX = ox + Math.cos(rightAng) * archRadius;
            var rightZ = oz + Math.sin(rightAng) * archRadius;
            var pillarR = makeBox(3, 16, 3, darkGranite, rightX, 26, rightZ);
            pillarR.rotation.y = aang;
            // Arch lintel
            var lintel = makeBox(7, 3, 3, darkGranite, ax, 35, az);
            lintel.rotation.y = aang;
            // Arch keystone
            var keystone = makeBox(2, 2, 2.5, granite, ax, 38, az);
            keystone.rotation.y = aang;
        }

        // Parapet on top of outer wall
        for (var pi = 0; pi < 16; pi++) {
            var pang = (pi / 16) * Math.PI * 2;
            var px = ox + Math.cos(pang) * radius;
            var pz = oz + Math.sin(pang) * radius;
            var parapet = makeBox(14, 3, 6, granite, px, 40 + 18, pz);
            parapet.rotation.y = pang;
        }

        // Crenellations on parapet
        for (var ci = 0; ci < 24; ci++) {
            var cang = (ci / 24) * Math.PI * 2;
            var cx = ox + Math.cos(cang) * radius;
            var cz = oz + Math.sin(cang) * radius;
            var cren = makeBox(4, 3, 5, granite, cx, 62, cz);
            cren.rotation.y = cang;
        }

        // Internal hollow floor
        makeBox(60, 1, 60, 0x8B7355, ox, 18.5, oz);
    }

    // Oban Harbour — natural bay with stone quays and CalMac terminal
    function buildHarbour() {
        var ox = 20120 + 0;
        var oz = 60;
        var waterBlue = 0x006994;
        var stoneGrey = 0x8a9098;
        var darkStone = 0x5a6268;
        var metalGrey = 0x6a7278;

        // Harbour water basin
        makeBox(260, 1, 160, waterBlue, ox, -1, oz);

        // North quay wall
        makeBox(220, 7, 9, stoneGrey, ox - 10, 3.5, oz - 85);
        // South quay wall
        makeBox(180, 7, 9, stoneGrey, ox - 10, 3.5, oz + 85);
        // West quay (shore side)
        makeBox(9, 7, 160, stoneGrey, ox - 120, 3.5, oz);
        // East breakwater
        makeBox(9, 5, 200, darkStone, ox + 110, 2.5, oz);

        // North Pier extending into bay
        makeBox(9, 6, 80, stoneGrey, ox + 60, 3, oz - 85);
        makeBox(20, 6, 9, stoneGrey, ox + 60, 3, oz - 45);

        // CalMac ferry terminal building
        makeBox(50, 12, 28, 0xE8E0D0, ox - 80, 6, oz - 85);
        makeBox(50, 3, 28, metalGrey, ox - 80, 13.5, oz - 85);
        // Terminal entrance canopy
        makeBox(30, 6, 5, 0xD0D0D0, ox - 80, 9, oz - 72);
        // Terminal signage block
        makeBox(20, 4, 1, 0xCC0000, ox - 80, 14, oz - 72);
        // Terminal loading ramp
        makeBox(20, 1.5, 12, darkStone, ox - 80, 0.75, oz - 78);

        // Bollards along north quay
        for (var bi = -100; bi <= 80; bi += 18) {
            makeCylinder(1, 1, 2.5, 8, darkStone, ox + bi, 1.25, oz - 81);
        }

        // Bollards along south quay
        for (var bj = -80; bj <= 60; bj += 18) {
            makeCylinder(1, 1, 2.5, 8, darkStone, ox + bj, 1.25, oz + 81);
        }

        // Harbour master office
        makeBox(14, 10, 12, stoneGrey, ox + 80, 5, oz - 80);
        makeBox(14, 2, 12, 0x604020, ox + 80, 11, oz - 80);
        makeCone(7, 4, 4, 0x604020, ox + 80, 14, oz - 80);

        // Lighthouse at pier end
        makeCylinder(2.5, 3, 18, 10, 0xE8E8E8, ox + 65, 9, oz - 42);
        makeCylinder(2, 2, 3, 10, metalGrey, ox + 65, 19.5, oz - 42);
        makeCone(1.5, 4, 10, 0xCC2200, ox + 65, 23, oz - 42);

        // Stone slipway
        makeBox(12, 0.5, 30, darkStone, ox - 100, 0.25, oz + 60);
    }

    // CalMac ferry — white Caledonian MacBrayne vessel
    function buildCalMacFerry() {
        var ox = 20120 - 20;
        var oz = 20;
        var white = 0xFFFFFF;
        var hullBlack = 0x1A1A2A;
        var deckGrey = 0xC8C8C8;
        var funnelYellow = 0xFFCC00;
        var funnelBlack = 0x111111;
        var red = 0xCC0000;

        // Ferry hull
        makeBox(80, 8, 22, hullBlack, ox, 3, oz);
        // Hull waterline stripe — red CalMac stripe
        makeBox(80, 2, 22, red, ox, 7.5, oz);

        // Main vehicle deck
        makeBox(78, 3, 20, deckGrey, ox, 10, oz);

        // Superstructure — passenger decks
        // Lower passenger deck
        makeBox(60, 6, 18, white, ox + 2, 14.5, oz);
        // Upper passenger deck
        makeBox(50, 6, 16, white, ox + 2, 21, oz);
        // Bridge deck
        makeBox(28, 5, 14, white, ox + 6, 26.5, oz);
        // Bridge wings
        makeBox(6, 2, 14, deckGrey, ox + 20, 28.5, oz);
        makeBox(6, 2, 14, deckGrey, ox - 8, 28.5, oz);

        // Funnels — twin CalMac yellow funnels with black tops
        makeCylinder(4, 4.5, 12, 12, funnelYellow, ox + 8, 33, oz - 4);
        makeCylinder(4, 4, 4, 12, funnelBlack, ox + 8, 40, oz - 4);
        makeCylinder(3.5, 4, 10, 12, funnelYellow, ox + 8, 32, oz + 4);
        makeCylinder(3.5, 3.5, 3.5, 12, funnelBlack, ox + 8, 38.5, oz + 4);

        // Bow ramp
        makeBox(14, 1.5, 18, deckGrey, ox - 43, 5.5, oz);
        // Stern
        makeBox(8, 6, 20, 0x2A2A3A, ox + 42, 3, oz);

        // Mast
        makeCylinder(0.4, 0.4, 16, 6, deckGrey, ox + 6, 37, oz);
        makeBox(12, 0.6, 0.6, deckGrey, ox + 6, 45, oz);

        // Lifeboat davits
        makeBox(8, 3, 4, funnelYellow, ox + 16, 23, oz - 10);
        makeBox(8, 3, 4, funnelYellow, ox + 16, 23, oz + 10);
        makeBox(8, 3, 4, funnelYellow, ox - 4, 23, oz - 10);
        makeBox(8, 3, 4, funnelYellow, ox - 4, 23, oz + 10);

        // Anchor chain fairing
        makeCylinder(0.8, 1.2, 4, 8, deckGrey, ox - 36, 6.5, oz - 8);
        makeCylinder(0.8, 1.2, 4, 8, deckGrey, ox - 36, 6.5, oz + 8);
    }

    // Seafront Esplanade — Victorian hotels and guest houses
    function buildEsplanade() {
        var ox = 20120 - 110;
        var oz = -30;
        var cream = 0xF5F0E8;
        var terracotta = 0xCD5C5C;
        var slateGrey = 0x708090;
        var darkSlate = 0x506070;

        // Corran Esplanade road
        makeBox(160, 0.4, 14, 0x606060, ox + 60, 0.2, oz);

        // Grand Hotel — large 3-storey Victorian
        makeBox(40, 28, 18, cream, ox, 14, oz - 20);
        makeBox(40, 3, 18, slateGrey, ox, 29, oz - 20);
        // Roof dormers
        makeBox(8, 8, 5, cream, ox - 12, 33, oz - 25);
        makeBox(8, 8, 5, cream, ox, 33, oz - 25);
        makeBox(8, 8, 5, cream, ox + 12, 33, oz - 25);
        makeCone(4, 5, 4, darkSlate, ox - 12, 39, oz - 25);
        makeCone(4, 5, 4, darkSlate, ox, 39, oz - 25);
        makeCone(4, 5, 4, darkSlate, ox + 12, 39, oz - 25);

        // Bay window projections on Grand Hotel
        makeBox(6, 24, 4, cream, ox - 14, 14, oz - 30);
        makeBox(6, 24, 4, cream, ox + 14, 14, oz - 30);

        // Alexandra Hotel — next along
        makeBox(30, 26, 16, cream, ox + 50, 13, oz - 20);
        makeBox(30, 3, 16, slateGrey, ox + 50, 27, oz - 20);
        // Corner tower feature
        makeBox(8, 32, 8, cream, ox + 65, 16, oz - 20);
        makeCone(5, 8, 4, darkSlate, ox + 65, 36, oz - 20);

        // Row of guest houses
        makeBox(20, 20, 14, cream, ox + 90, 10, oz - 20);
        makeBox(20, 3, 14, terracotta, ox + 90, 21.5, oz - 20);
        makeBox(20, 20, 14, cream, ox + 112, 10, oz - 20);
        makeBox(20, 3, 14, terracotta, ox + 112, 21.5, oz - 20);
        makeBox(20, 22, 14, cream, ox + 134, 11, oz - 20);
        makeBox(20, 3, 14, terracotta, ox + 134, 23.5, oz - 20);

        // Seafront railings (small boxes as posts)
        for (var ri = -110; ri <= 90; ri += 8) {
            makeBox(1, 4, 1, 0x303040, ox + ri + 60, 2, oz - 7);
        }
        makeBox(160, 0.6, 0.6, 0x404050, ox + 60, 4, oz - 7);

        // Seafront paving
        makeBox(160, 0.4, 10, 0xD0C8B8, ox + 60, 0.2, oz - 12);

        // Georgian terrace continuation
        makeBox(32, 24, 16, cream, ox - 50, 12, oz - 20);
        makeBox(32, 3, 16, slateGrey, ox - 50, 25, oz - 20);
        makeBox(8, 30, 8, cream, ox - 66, 15, oz - 20);
        makeCone(4, 6, 4, darkSlate, ox - 66, 33, oz - 20);

        // Seafront benches
        makeBox(4, 1, 1.5, 0x8B6040, ox + 20, 0.5, oz - 6);
        makeBox(4, 1, 1.5, 0x8B6040, ox + 40, 0.5, oz - 6);
        makeBox(4, 1, 1.5, 0x8B6040, ox + 60, 0.5, oz - 6);

        // Lamp posts along esplanade
        for (var li = -80; li <= 80; li += 20) {
            makeCylinder(0.3, 0.3, 7, 6, 0x303030, ox + li + 60, 3.5, oz - 7);
            makeSphere(0.8, 6, 6, 0xFFEE88, ox + li + 60, 7.5, oz - 7);
        }
    }

    // St Columba's Cathedral — pink granite Catholic cathedral
    function buildStColumba() {
        var ox = 20120 + 100;
        var oz = -100;
        var pinkGranite = 0xC8B89A;
        var darkGranite = 0x9A8870;
        var leadGrey = 0x707880;

        // Cathedral nave body
        makeBox(28, 22, 54, pinkGranite, ox, 11, oz);
        makeBox(28, 3, 54, darkGranite, ox, 23.5, oz);

        // Chancel (east end)
        makeBox(20, 18, 16, pinkGranite, ox, 9, oz - 38);
        makeBox(20, 3, 16, darkGranite, ox, 19.5, oz - 38);

        // Main tower — imposing square tower
        makeBox(16, 46, 16, pinkGranite, ox - 6, 23, oz + 34);
        makeBox(18, 4, 18, darkGranite, ox - 6, 47, oz + 34);
        // Tower belfry stage
        makeBox(14, 8, 14, pinkGranite, ox - 6, 52, oz + 34);
        // Tower pinnacles
        makeCone(2.5, 8, 4, leadGrey, ox - 14, 59, oz + 26);
        makeCone(2.5, 8, 4, leadGrey, ox + 2, 59, oz + 26);
        makeCone(2.5, 8, 4, leadGrey, ox - 14, 59, oz + 42);
        makeCone(2.5, 8, 4, leadGrey, ox + 2, 59, oz + 42);
        // Tower spire
        makeCone(5, 18, 4, leadGrey, ox - 6, 64, oz + 34);

        // Side aisles
        makeBox(8, 16, 54, pinkGranite, ox - 18, 8, oz);
        makeBox(8, 16, 54, pinkGranite, ox + 18, 8, oz);

        // Gothic buttresses
        makeBox(4, 22, 4, darkGranite, ox - 20, 11, oz - 20);
        makeBox(4, 22, 4, darkGranite, ox + 20, 11, oz - 20);
        makeBox(4, 22, 4, darkGranite, ox - 20, 11, oz);
        makeBox(4, 22, 4, darkGranite, ox + 20, 11, oz);
        makeBox(4, 22, 4, darkGranite, ox - 20, 11, oz + 20);
        makeBox(4, 22, 4, darkGranite, ox + 20, 11, oz + 20);

        // Cathedral steps and entrance
        makeBox(22, 1.5, 5, darkGranite, ox - 6, 0.75, oz + 62);
        makeBox(22, 3, 3, darkGranite, ox - 6, 4, oz + 63);
        // Entrance arch posts
        makeBox(3, 14, 3, darkGranite, ox - 12, 7, oz + 62);
        makeBox(3, 14, 3, darkGranite, ox, 7, oz + 62);
        // Rose window box
        makeCylinder(4, 4, 1, 12, 0x8899AA, ox - 6, 20, oz + 30);
    }

    // Oban Distillery — 1794 original distillery in town centre
    function buildDistillery() {
        var ox = 20120 + 50;
        var oz = -20;
        var stoneColor = 0xC8B89A;
        var darkStone = 0x9A8870;
        var brickRed = 0x8B4040;
        var copperColor = 0xB87333;

        // Main distillery building
        makeBox(36, 16, 24, stoneColor, ox, 8, oz);
        makeBox(36, 2, 24, darkStone, ox, 17, oz);

        // Still house extension
        makeBox(22, 20, 18, stoneColor, ox + 28, 10, oz);
        makeBox(22, 2, 18, darkStone, ox + 28, 21, oz);

        // Pagoda roof kiln — signature distillery pagoda
        // Pagoda base tower
        makeBox(12, 24, 12, stoneColor, ox - 14, 12, oz);
        // Pagoda lower tier
        makeBox(16, 3, 16, darkStone, ox - 14, 25.5, oz);
        // Pagoda upper cone
        makeCone(7, 10, 8, darkStone, ox - 14, 31, oz);
        // Pagoda top needle
        makeCylinder(0.6, 0.6, 6, 6, 0x404040, ox - 14, 37, oz);

        // Pot stills — classic copper pot stills
        makeCylinder(3.5, 4, 12, 10, copperColor, ox + 20, 7, oz - 4);
        makeCylinder(2, 3, 6, 10, copperColor, ox + 20, 16, oz - 4);
        makeCone(2, 4, 10, copperColor, ox + 20, 21, oz - 4);
        // Second pot still
        makeCylinder(3, 3.5, 11, 10, copperColor, ox + 32, 6.5, oz - 4);
        makeCylinder(1.8, 2.8, 5, 10, copperColor, ox + 32, 15, oz - 4);
        makeCone(1.8, 3.5, 10, copperColor, ox + 32, 19.5, oz - 4);

        // Warehouse building
        makeBox(44, 12, 20, stoneColor, ox - 20, 6, oz + 30);
        makeBox(44, 2, 20, brickRed, ox - 20, 13, oz + 30);

        // Visitor centre / shop front
        makeBox(16, 10, 10, stoneColor, ox + 14, 5, oz - 18);
        makeBox(16, 2, 10, darkStone, ox + 14, 11, oz - 18);

        // Distillery gate post
        makeBox(2, 8, 2, darkStone, ox - 36, 4, oz - 15);
        makeBox(2, 8, 2, darkStone, ox - 36, 4, oz - 5);
        makeBox(14, 1.5, 2, darkStone, ox - 36, 8.5, oz - 10);
    }

    // Railway Station — Victorian terminal station with train shed
    function buildRailwayStation() {
        var ox = 20120 + 140;
        var oz = 30;
        var sandStone = 0xD4C9B0;
        var darkSand = 0xA89E8A;
        var metalGrey = 0x707878;
        var glassBlue = 0x8899AA;

        // Station main building — Victorian facade
        makeBox(52, 18, 16, sandStone, ox, 9, oz - 14);
        makeBox(52, 3, 16, darkSand, ox, 19.5, oz - 14);

        // Station frontage — clock tower centrepiece
        makeBox(12, 28, 12, sandStone, ox, 14, oz - 14);
        makeBox(14, 4, 14, darkSand, ox, 30, oz - 14);
        // Clock faces (box panels)
        makeBox(1, 4, 4, glassBlue, ox - 7, 32, oz - 14);
        makeBox(1, 4, 4, glassBlue, ox + 7, 32, oz - 14);
        makeBox(4, 4, 1, glassBlue, ox, 32, oz - 21);
        // Clock tower spire
        makeCone(4, 10, 4, darkSand, ox, 36, oz - 14);

        // Train shed — large arched glass and iron roof
        makeBox(60, 2, 50, metalGrey, ox, 18, oz + 14);
        makeBox(2, 18, 50, metalGrey, ox - 30, 9, oz + 14);
        makeBox(2, 18, 50, metalGrey, ox + 30, 9, oz + 14);
        // Arched roof sections (box approximation)
        makeBox(60, 8, 4, glassBlue, ox, 22, oz - 10);
        makeBox(60, 8, 4, glassBlue, ox, 22, oz + 10);
        makeBox(60, 8, 4, glassBlue, ox, 22, oz + 30);

        // Platform
        makeBox(60, 1, 14, 0xC0B8A8, ox, 0.5, oz + 14);
        makeBox(60, 1, 14, 0xC0B8A8, ox, 0.5, oz - 2);

        // Station building wings
        makeBox(16, 14, 16, sandStone, ox - 34, 7, oz - 14);
        makeBox(16, 14, 16, sandStone, ox + 34, 7, oz - 14);
        makeBox(16, 2, 16, darkSand, ox - 34, 15, oz - 14);
        makeBox(16, 2, 16, darkSand, ox + 34, 15, oz - 14);

        // Ticket office kiosk
        makeBox(8, 8, 8, sandStone, ox - 16, 4, oz + 8);
        makeCone(5, 4, 4, darkSand, ox - 16, 10, oz + 8);

        // Signal box
        makeBox(8, 10, 8, sandStone, ox + 40, 5, oz + 28);
        makeBox(8, 3, 8, glassBlue, ox + 40, 11.5, oz + 28);
        makeCone(4, 3, 4, darkSand, ox + 40, 15, oz + 28);
    }

    // Dunollie Castle ruins — ruined tower on headland
    function buildDunollie() {
        var ox = 20120 + 160;
        var oz = -220;
        var ruinStone = 0x8B7355;
        var darkRuin = 0x6B5335;
        var headlandGreen = 0x4a7c3f;

        // Headland hill
        makeBox(80, 16, 70, headlandGreen, ox, 8, oz);
        makeBox(50, 8, 40, headlandGreen, ox, 20, oz);

        // Main keep — ruined tower
        // Lower section — mostly intact
        makeBox(14, 28, 14, ruinStone, ox, 30, oz);
        // Upper section — broken, irregular
        makeBox(8, 10, 14, ruinStone, ox - 3, 49, oz);
        makeBox(14, 8, 6, ruinStone, ox, 46, oz + 4);
        // Ruined wall fragments
        makeBox(10, 16, 3, ruinStone, ox + 10, 32, oz - 4);
        makeBox(3, 22, 12, ruinStone, ox - 9, 33, oz);
        // Broken parapet pieces
        makeBox(5, 5, 5, ruinStone, ox + 3, 55, oz - 5);
        makeBox(4, 4, 4, darkRuin, ox - 2, 56, oz + 3);
        makeBox(3, 8, 3, ruinStone, ox - 4, 50, oz - 6);

        // Outer barmkin wall — ruined curtain wall
        makeBox(30, 8, 3, ruinStone, ox - 16, 26, oz - 18);
        makeBox(3, 10, 20, ruinStone, ox - 30, 27, oz - 8);
        // Broken wall sections
        makeBox(16, 5, 3, darkRuin, ox + 14, 24, oz - 18);
        makeBox(3, 7, 14, darkRuin, ox + 22, 25, oz - 11);

        // Collapsed masonry rubble (small boxes)
        makeBox(6, 2, 4, darkRuin, ox + 10, 24.5, oz + 8);
        makeBox(4, 3, 5, darkRuin, ox - 12, 24.5, oz + 10);
        makeBox(5, 2, 3, ruinStone, ox + 6, 24.5, oz - 28);
    }

    // Isle of Kerrera — green island protecting the harbour
    function buildKerrera() {
        var ox = 20120 - 180;
        var oz = 100;
        var islandGreen = 0x3d6b30;
        var hillGreen = 0x2d5b20;
        var ruinStone = 0x8B7355;
        var darkRuin = 0x6B5335;
        var rockGrey = 0x606858;

        // Island main body — low hills
        makeBox(160, 14, 80, islandGreen, ox, 7, oz);
        makeBox(100, 10, 50, hillGreen, ox - 20, 19, oz - 10);
        makeBox(60, 8, 40, hillGreen, ox + 60, 17, oz + 10);

        // North hill
        makeBox(40, 12, 30, hillGreen, ox - 60, 20, oz);

        // Rocky shoreline edges
        makeBox(160, 4, 6, rockGrey, ox, 16, oz + 43);
        makeBox(160, 4, 6, rockGrey, ox, 16, oz - 43);

        // Gylen Castle ruins on south tip
        var gx = ox + 70;
        var gz = oz + 30;
        // Castle tower
        makeBox(10, 22, 10, ruinStone, gx, 28, gz);
        makeBox(6, 8, 10, ruinStone, gx + 4, 43, gz);
        // Curtain wall
        makeBox(20, 12, 3, ruinStone, gx - 12, 27, gz - 7);
        makeBox(3, 12, 14, ruinStone, gx - 21, 27, gz);
        // Wall fragment
        makeBox(10, 7, 3, darkRuin, gx + 6, 25, gz - 7);
        // Collapsed rubble
        makeBox(5, 3, 4, darkRuin, gx + 14, 23, gz + 2);

        // Kerrera Sound — narrow strip of water between island and mainland
        makeBox(60, 1, 40, 0x006994, ox - 140, -0.5, oz - 10);

        // Small island jetty
        makeBox(3, 3, 20, rockGrey, ox - 60, 16.5, oz + 40);
    }

    // Pulpit Hill — grassy viewpoint with panoramic views
    function buildPulpitHill() {
        var ox = 20120 + 80;
        var oz = -320;
        var grassGreen = 0x4a7c3f;
        var darkGrass = 0x3a6b2f;
        var rockGrey = 0x706858;
        var pathColor = 0xC8B898;

        // Main hill — large grassy mound
        makeBox(100, 30, 80, grassGreen, ox, 15, oz);
        makeBox(70, 20, 60, grassGreen, ox, 35, oz);
        makeBox(40, 14, 36, darkGrass, ox, 47, oz);

        // Summit cairn
        makeCylinder(4, 5, 6, 10, rockGrey, ox, 56, oz);
        makeCylinder(2.5, 3, 3, 10, rockGrey, ox, 61, oz);
        makeSphere(1.5, 8, 8, rockGrey, ox, 63.5, oz);

        // Winding footpath up hill
        makeBox(4, 0.5, 60, pathColor, ox - 10, 20, oz + 20);
        makeBox(4, 0.5, 40, pathColor, ox + 10, 34, oz + 5);
        makeBox(4, 0.5, 30, pathColor, ox, 44, oz - 8);

        // Viewpoint trig point / marker post
        makeBox(1, 6, 1, 0xC0C0C0, ox, 55, oz - 5);

        // Trees on lower slopes
        for (var ti = 0; ti < 6; ti++) {
            var tx = ox - 40 + ti * 14;
            var tz = oz + 32;
            makeCylinder(0.8, 1, 8, 6, 0x5A4020, tx, 18, tz);
            makeCone(5, 14, 8, 0x2d5b20, tx, 28, tz);
        }
    }

    // Fishing boats at harbour quay
    function buildFishingBoats() {
        var ox = 20120 - 40;
        var oz = 55;
        var woodWhite = 0xF5F0E8;
        var woodRed = 0xCC4444;
        var darkHull = 0x4A3A2A;
        var cabinBlue = 0x4466AA;
        var metalGrey = 0x808888;

        // Fishing boat 1 — wooden creel boat
        makeBox(18, 4, 6, woodRed, ox, 1.5, oz);
        makeBox(6, 5, 5, cabinBlue, ox + 4, 5.5, oz);
        makeCylinder(0.6, 0.6, 12, 6, metalGrey, ox + 4, 11, oz);
        // Wheelhouse windows
        makeBox(1, 2, 3, 0x88AACC, ox + 8, 6, oz);
        // Nets/equipment on deck
        makeBox(4, 1.5, 4, 0x887060, ox - 4, 4.5, oz);

        // Fishing boat 2 — white hull boat
        makeBox(22, 4.5, 7, woodWhite, ox + 34, 2, oz - 5);
        makeBox(7, 6, 6, woodWhite, ox + 42, 6, oz - 5);
        makeCylinder(0.5, 0.5, 10, 6, metalGrey, ox + 42, 11, oz - 5);
        makeBox(1.5, 6, 3, metalGrey, ox + 26, 6, oz - 5);
        // Boom arm
        makeBox(12, 1, 1, metalGrey, ox + 34, 10, oz - 5);
        // Buoys alongside
        makeSphere(1.5, 6, 6, 0xFF6622, ox + 22, 1.5, oz - 2);
        makeSphere(1.5, 6, 6, 0xFF6622, ox + 22, 1.5, oz - 8);

        // Fishing boat 3 — small creel boat
        makeBox(14, 3.5, 5, woodRed, ox - 36, 1.5, oz + 8);
        makeBox(5, 4.5, 4.5, darkHull, ox - 30, 5, oz + 8);
        makeCylinder(0.5, 0.5, 8, 6, metalGrey, ox - 30, 9, oz + 8);

        // Creels / lobster pots stacked on quay
        makeBox(3, 2, 3, 0x887060, ox - 10, 1, oz + 78);
        makeBox(3, 2, 3, 0x887060, ox - 6, 1, oz + 78);
        makeBox(3, 2, 3, 0x706050, ox - 10, 3, oz + 78);
        makeBox(3, 2, 3, 0x706050, ox - 6, 3, oz + 78);
        makeBox(3, 2, 3, 0x887060, ox - 10, 5, oz + 78);

        // Fuel jetty pump
        makeBox(3, 6, 3, metalGrey, ox + 60, 3, oz + 70);
        makeBox(5, 1.5, 1, metalGrey, ox + 62, 6.5, oz + 70);
    }

    // Ground terrain — harbour surroundings
    function buildTerrain() {
        var ox = 20120;
        var oz = 0;
        var townStone = 0xB0A890;
        var roadGrey = 0x505060;
        var pavingGrey = 0x706858;
        var grassGreen = 0x4a7c3f;

        // Town ground base
        makeBox(360, 0.4, 280, townStone, ox, 0.2, oz - 60);
        // Harbour road
        makeBox(200, 0.5, 12, roadGrey, ox - 10, 0.3, oz - 58);
        // Secondary road
        makeBox(12, 0.5, 180, roadGrey, ox + 60, 0.3, oz - 30);
        // George Street
        makeBox(120, 0.5, 10, roadGrey, ox + 60, 0.3, oz - 130);

        // Town hillside slope — terraced levels
        makeBox(200, 8, 60, 0x8B7B6B, ox, 4, oz - 150);
        makeBox(200, 10, 40, 0x706858, ox, 13, oz - 190);

        // Grassy open area
        makeBox(60, 0.5, 40, grassGreen, ox - 40, 0.3, oz - 130);

        // Waterfront promenade
        makeBox(180, 0.5, 8, pavingGrey, ox - 10, 0.3, oz - 52);
    }

    function build() {
        buildTerrain();
        buildMccaigsT();
        buildHarbour();
        buildCalMacFerry();
        buildEsplanade();
        buildStColumba();
        buildDistillery();
        buildRailwayStation();
        buildDunollie();
        buildKerrera();
        buildPulpitHill();
        buildFishingBoats();
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
