window.RosslynChapel = (function() {
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

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var mesh = makeMesh(new THREE.BoxGeometry(w, h, d), color);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var mesh = makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var mesh = makeMesh(new THREE.ConeGeometry(r, h, segs), color);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var mesh = makeMesh(new THREE.SphereGeometry(r, ws, hs), color);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    var CX = 20000;
    var CY = 0;
    var CZ = 0;

    var SANDSTONE   = 0xC8B89A;
    var WOOD        = 0x8B5E3C;
    var STONE_DARK  = 0x888888;
    var CASTLE_STONE= 0x8B7355;
    var RIVER_BLUE  = 0x006994;
    var FOREST_GREEN= 0x2d6b2a;
    var GRAVE_GREY  = 0xC0C0C0;
    var VISITOR_GREY= 0xD3D3D3;
    var VILLAGE_CREAM=0xF5F0E8;
    var SOIL_BROWN  = 0x5C4A2A;
    var DARK_GREEN  = 0x1A4A1A;
    var GLASS_BLUE  = 0xADD8E6;
    var IRON_GREY   = 0x555555;
    var LEAF_GREEN  = 0x3A7A1A;
    var BARK_BROWN  = 0x6B4226;

    function build() {
        buildGround();
        buildChapelCrypt();
        buildChapelNave();
        buildLadyChapel();
        buildSacristy();
        buildFlyingButtresses();
        buildPinnacles();
        buildApprenticePillar();
        buildInteriorColumns();
        buildChoirStalls();
        buildCollegiateGraveyard();
        buildRosslynCastle();
        buildNorthEskGorge();
        buildRoslinGlen();
        buildVisitorCentre();
        buildRoslinVillage();
    }

    function buildGround() {
        // Ground platform — large flat box (BoxGeometry allowed)
        makeBox(2000, 4, 2000, SOIL_BROWN, CX, CY - 2, CZ);
        // Stone forecourt around chapel
        makeBox(120, 1, 200, STONE_DARK, CX, CY + 0.5, CZ);
    }

    function buildChapelCrypt() {
        // Crypt — lower stone level below chapel floor
        makeBox(36, 6, 22, STONE_DARK, CX, CY - 3, CZ);
        // Crypt interior dividing walls
        makeBox(1, 5, 22, STONE_DARK, CX - 8, CY - 3, CZ);
        makeBox(1, 5, 22, STONE_DARK, CX + 8, CY - 3, CZ);
        // Crypt entrance arch sides
        makeBox(2, 6, 3, STONE_DARK, CX - 19, CY - 3, CZ);
        makeBox(2, 6, 3, STONE_DARK, CX + 19, CY - 3, CZ);
    }

    function buildChapelNave() {
        // Main nave body — tall central box
        makeBox(34, 22, 20, SANDSTONE, CX, CY + 11, CZ);
        // Nave roof — pitched roof represented by angled boxes
        var roofMesh = makeMesh(new THREE.BoxGeometry(36, 4, 22), SANDSTONE);
        roofMesh.position.set(CX, CY + 24, CZ);
        roofMesh.rotation.z = Math.PI * 0.08;
        scene.add(roofMesh);
        objects.push(roofMesh);
        // Nave clerestory windows — recessed boxes along walls
        makeBox(4, 5, 1, STONE_DARK, CX - 10, CY + 14, CZ - 10.5);
        makeBox(4, 5, 1, STONE_DARK, CX,      CY + 14, CZ - 10.5);
        makeBox(4, 5, 1, STONE_DARK, CX + 10, CY + 14, CZ - 10.5);
        makeBox(4, 5, 1, STONE_DARK, CX - 10, CY + 14, CZ + 10.5);
        makeBox(4, 5, 1, STONE_DARK, CX,      CY + 14, CZ + 10.5);
        makeBox(4, 5, 1, STONE_DARK, CX + 10, CY + 14, CZ + 10.5);
        // West front entrance wall with decorative detail
        makeBox(34, 22, 2, SANDSTONE, CX - 18, CY + 11, CZ);
        // West doorway arch
        makeBox(6, 10, 2.1, STONE_DARK, CX - 18, CY + 5, CZ);
        // West gable
        makeBox(20, 6, 2, SANDSTONE, CX - 18, CY + 24, CZ);
        // North and south aisles
        makeBox(34, 14, 8, SANDSTONE, CX, CY + 7, CZ - 14);
        makeBox(34, 14, 8, SANDSTONE, CX, CY + 7, CZ + 14);
        // Aisle roofs
        makeBox(36, 2, 8, SANDSTONE, CX, CY + 15, CZ - 14);
        makeBox(36, 2, 8, SANDSTONE, CX, CY + 15, CZ + 14);
    }

    function buildLadyChapel() {
        // Lady Chapel — east end, semi-circular apse form built with boxes
        makeBox(20, 20, 10, SANDSTONE, CX + 22, CY + 10, CZ);
        makeBox(14, 20, 8,  SANDSTONE, CX + 28, CY + 10, CZ - 5);
        makeBox(14, 20, 8,  SANDSTONE, CX + 28, CY + 10, CZ + 5);
        makeBox(10, 20, 6,  SANDSTONE, CX + 32, CY + 10, CZ);
        // Lady Chapel roof
        makeBox(18, 3, 12, SANDSTONE, CX + 22, CY + 21, CZ);
        // Ornate east window
        makeBox(6, 9, 1, STONE_DARK, CX + 33, CY + 10, CZ);
        // Three aisles of Lady Chapel separated by columns
        makeCyl(0.8, 0.8, 18, 8, SANDSTONE, CX + 19, CY + 9, CZ - 4);
        makeCyl(0.8, 0.8, 18, 8, SANDSTONE, CX + 19, CY + 9, CZ + 4);
        makeCyl(0.8, 0.8, 18, 8, SANDSTONE, CX + 24, CY + 9, CZ - 4);
        makeCyl(0.8, 0.8, 18, 8, SANDSTONE, CX + 24, CY + 9, CZ + 4);
    }

    function buildSacristy() {
        // Sacristy — tower-like addition on south side
        makeBox(10, 24, 10, SANDSTONE, CX + 8, CY + 12, CZ + 22);
        // Sacristy battlements
        makeBox(2, 3, 10, SANDSTONE, CX + 3,  CY + 26, CZ + 22);
        makeBox(2, 3, 10, SANDSTONE, CX + 8,  CY + 26, CZ + 22);
        makeBox(2, 3, 10, SANDSTONE, CX + 13, CY + 26, CZ + 22);
        // Sacristy door
        makeBox(3, 6, 1.1, STONE_DARK, CX + 8, CY + 3, CZ + 17);
        // Sacristy window
        makeBox(2, 4, 1.1, STONE_DARK, CX + 8, CY + 14, CZ + 17);
    }

    function buildFlyingButtresses() {
        // Flying buttresses along nave — angled boxes
        var bColor = SANDSTONE;
        // North side buttresses
        var buttressData = [
            [CX - 12, CY + 10, CZ - 18],
            [CX,      CY + 10, CZ - 18],
            [CX + 12, CY + 10, CZ - 18]
        ];
        for (var i = 0; i < buttressData.length; i++) {
            var b = makeMesh(new THREE.BoxGeometry(2, 12, 3), bColor);
            b.position.set(buttressData[i][0], buttressData[i][1], buttressData[i][2]);
            b.rotation.x = 0.35;
            scene.add(b);
            objects.push(b);
        }
        // South side buttresses
        var buttressDataS = [
            [CX - 12, CY + 10, CZ + 18],
            [CX,      CY + 10, CZ + 18],
            [CX + 12, CY + 10, CZ + 18]
        ];
        for (var j = 0; j < buttressDataS.length; j++) {
            var bs = makeMesh(new THREE.BoxGeometry(2, 12, 3), bColor);
            bs.position.set(buttressDataS[j][0], buttressDataS[j][1], buttressDataS[j][2]);
            bs.rotation.x = -0.35;
            scene.add(bs);
            objects.push(bs);
        }
        // Buttress piers on north side
        makeBox(3, 18, 3, SANDSTONE, CX - 12, CY + 9, CZ - 22);
        makeBox(3, 18, 3, SANDSTONE, CX,      CY + 9, CZ - 22);
        makeBox(3, 18, 3, SANDSTONE, CX + 12, CY + 9, CZ - 22);
        // Buttress piers on south side
        makeBox(3, 18, 3, SANDSTONE, CX - 12, CY + 9, CZ + 22);
        makeBox(3, 18, 3, SANDSTONE, CX,      CY + 9, CZ + 22);
        makeBox(3, 18, 3, SANDSTONE, CX + 12, CY + 9, CZ + 22);
    }

    function buildPinnacles() {
        // Dense pinnacles on roof — CylinderGeometry shafts + ConeGeometry tops
        var pinPos = [
            [CX - 16, CZ - 10],
            [CX - 8,  CZ - 10],
            [CX,      CZ - 10],
            [CX + 8,  CZ - 10],
            [CX + 16, CZ - 10],
            [CX - 16, CZ + 10],
            [CX - 8,  CZ + 10],
            [CX,      CZ + 10],
            [CX + 8,  CZ + 10],
            [CX + 16, CZ + 10],
            [CX - 16, CZ],
            [CX + 16, CZ],
            [CX - 12, CZ - 22],
            [CX,      CZ - 22],
            [CX + 12, CZ - 22],
            [CX - 12, CZ + 22],
            [CX,      CZ + 22],
            [CX + 12, CZ + 22]
        ];
        for (var i = 0; i < pinPos.length; i++) {
            var px = pinPos[i][0];
            var pz = pinPos[i][1];
            makeCyl(0.5, 0.7, 5, 6, SANDSTONE, px, CY + 29, pz);
            makeCone(0.6, 3, 6, SANDSTONE, px, CY + 33, pz);
        }
    }

    function buildApprenticePillar() {
        // Apprentice Pillar — famous elaborately carved pillar
        makeCyl(1.1, 1.3, 20, 12, SANDSTONE, CX + 16, CY + 10, CZ - 6);
        // Spiral decoration suggested by wrapping boxes around the pillar
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var spiralMesh = makeMesh(new THREE.BoxGeometry(0.5, 2.5, 0.5), SANDSTONE);
            spiralMesh.position.set(
                CX + 16 + Math.cos(angle) * 1.2,
                CY + 3 + i * 2,
                CZ - 6 + Math.sin(angle) * 1.2
            );
            spiralMesh.rotation.y = angle;
            scene.add(spiralMesh);
            objects.push(spiralMesh);
        }
        // Pillar base
        makeCyl(1.6, 1.6, 1.5, 8, SANDSTONE, CX + 16, CY + 0.75, CZ - 6);
        // Pillar capital
        makeCyl(1.8, 1.1, 2, 8, SANDSTONE, CX + 16, CY + 21, CZ - 6);
    }

    function buildInteriorColumns() {
        // Nave columns — ornate cylindrical pillars lining the nave
        var colPositions = [
            [CX - 12, CZ - 5],
            [CX - 4,  CZ - 5],
            [CX + 4,  CZ - 5],
            [CX + 12, CZ - 5],
            [CX - 12, CZ + 5],
            [CX - 4,  CZ + 5],
            [CX + 4,  CZ + 5],
            [CX + 12, CZ + 5]
        ];
        for (var i = 0; i < colPositions.length; i++) {
            var cx2 = colPositions[i][0];
            var cz2 = colPositions[i][1];
            makeCyl(0.9, 0.9, 20, 10, SANDSTONE, cx2, CY + 10, cz2);
            // Column capital
            makeCyl(1.2, 0.9, 1.5, 8, SANDSTONE, cx2, CY + 20.5, cz2);
            // Column base
            makeCyl(1.1, 1.1, 1, 8, SANDSTONE, cx2, CY + 0.5, cz2);
        }
    }

    function buildChoirStalls() {
        // Choir stalls — wooden pew boxes
        var pewPositions = [
            [CX - 8, CZ - 3],
            [CX - 4, CZ - 3],
            [CX,     CZ - 3],
            [CX + 4, CZ - 3],
            [CX - 8, CZ + 3],
            [CX - 4, CZ + 3],
            [CX,     CZ + 3],
            [CX + 4, CZ + 3]
        ];
        for (var i = 0; i < pewPositions.length; i++) {
            makeBox(3, 1.2, 1, WOOD, pewPositions[i][0], CY + 0.6, pewPositions[i][1]);
            // Pew back
            makeBox(3, 2, 0.2, WOOD, pewPositions[i][0], CY + 1.5, pewPositions[i][1] + 0.4);
        }
        // Altar table
        makeBox(8, 1.2, 3, WOOD, CX + 18, CY + 0.6, CZ);
        // Altar steps
        makeBox(10, 0.5, 4, SANDSTONE, CX + 14, CY + 0.25, CZ);
    }

    function buildCollegiateGraveyard() {
        // Grave headstones surrounding the chapel
        var gravePositions = [
            [CX - 30, CZ - 15],
            [CX - 30, CZ - 5],
            [CX - 30, CZ + 5],
            [CX - 30, CZ + 15],
            [CX - 25, CZ - 22],
            [CX - 15, CZ - 28],
            [CX - 5,  CZ - 28],
            [CX + 5,  CZ - 28],
            [CX + 15, CZ - 28],
            [CX - 25, CZ + 25],
            [CX - 15, CZ + 30],
            [CX - 5,  CZ + 30],
            [CX + 5,  CZ + 30],
            [CX + 15, CZ + 30],
            [CX - 38, CZ - 10],
            [CX - 38, CZ],
            [CX - 38, CZ + 10],
            [CX - 35, CZ - 20],
            [CX - 35, CZ + 20]
        ];
        for (var i = 0; i < gravePositions.length; i++) {
            var gx = gravePositions[i][0];
            var gz = gravePositions[i][1];
            // Headstone
            makeBox(1.2, 2.5, 0.3, GRAVE_GREY, gx, CY + 1.25, gz);
            // Grave slab
            makeBox(2, 0.2, 1, GRAVE_GREY, gx, CY + 0.1, gz + 1.5);
        }
        // Large ornate tomb
        makeBox(5, 3, 4, GRAVE_GREY, CX - 36, CY + 1.5, CZ - 5);
        makeCone(2.5, 3, 8, GRAVE_GREY, CX - 36, CY + 4.5, CZ - 5);
        // Churchyard boundary wall
        makeBox(120, 3, 1, SANDSTONE, CX - 20, CY + 1.5, CZ - 40);
        makeBox(120, 3, 1, SANDSTONE, CX - 20, CY + 1.5, CZ + 40);
        makeBox(1, 3, 80, SANDSTONE, CX - 80, CY + 1.5, CZ);
    }

    function buildRosslynCastle() {
        // Rosslyn Castle ruins on cliff to the south
        var castleX = CX + 60;
        var castleZ = CZ + 120;
        // Main tower ruin
        makeBox(16, 28, 16, CASTLE_STONE, castleX, CY + 14, castleZ);
        // Tower wall gaps (ruined sections)
        makeBox(6, 12, 2, STONE_DARK, castleX, CY + 20, castleZ + 8);
        makeBox(6, 12, 2, STONE_DARK, castleX, CY + 20, castleZ - 8);
        // Ruined south wall
        makeBox(30, 14, 2, CASTLE_STONE, castleX + 10, CY + 7, castleZ + 8);
        // Ruined east wall fragment
        makeBox(2, 18, 20, CASTLE_STONE, castleX + 18, CY + 9, castleZ);
        // Crumbled corner
        makeBox(8, 8, 8, CASTLE_STONE, castleX - 10, CY + 4, castleZ + 10);
        // Cliff edge rock formation
        makeBox(80, 8, 10, CASTLE_STONE, castleX, CY - 4, castleZ + 20);
        // Castle gatehouse
        makeBox(12, 16, 8, CASTLE_STONE, castleX - 20, CY + 8, castleZ);
        makeBox(4, 6, 8.1, STONE_DARK, castleX - 20, CY + 3, castleZ);
        // Battlement remnants
        makeBox(16, 3, 2, CASTLE_STONE, castleX, CY + 29, castleZ - 7);
        makeBox(2, 4, 2, CASTLE_STONE, castleX - 6, CY + 31, castleZ - 7);
        makeBox(2, 4, 2, CASTLE_STONE, castleX,     CY + 31, castleZ - 7);
        makeBox(2, 4, 2, CASTLE_STONE, castleX + 6, CY + 31, castleZ - 7);
    }

    function buildNorthEskGorge() {
        // River North Esk winding through gorge — series of flat river boxes
        var riverColor = RIVER_BLUE;
        var riverSegments = [
            [CX + 80,  CZ + 60,  40, 20],
            [CX + 100, CZ + 90,  20, 40],
            [CX + 80,  CZ + 120, 50, 20],
            [CX + 50,  CZ + 140, 20, 30],
            [CX + 20,  CZ + 160, 60, 18],
            [CX - 20,  CZ + 180, 20, 40],
            [CX - 50,  CZ + 170, 50, 18]
        ];
        for (var i = 0; i < riverSegments.length; i++) {
            var rx = riverSegments[i][0];
            var rz = riverSegments[i][1];
            var rw = riverSegments[i][2];
            var rd = riverSegments[i][3];
            makeBox(rw, 1, rd, riverColor, rx, CY - 10, rz);
        }
        // Gorge walls
        makeBox(200, 30, 8, CASTLE_STONE, CX + 20, CY - 5, CZ + 80);
        makeBox(200, 30, 8, CASTLE_STONE, CX + 20, CY - 5, CZ + 200);
        // Gorge floor
        makeBox(200, 4, 120, SOIL_BROWN, CX + 20, CY - 18, CZ + 140);
    }

    function buildRoslinGlen() {
        // Dense woodland on gorge sides — tree clusters
        var treePositions = [
            [CX + 30,  CZ + 60],
            [CX + 50,  CZ + 70],
            [CX + 70,  CZ + 60],
            [CX + 90,  CZ + 80],
            [CX + 110, CZ + 100],
            [CX + 115, CZ + 130],
            [CX + 100, CZ + 150],
            [CX + 70,  CZ + 160],
            [CX + 40,  CZ + 175],
            [CX + 10,  CZ + 185],
            [CX - 20,  CZ + 195],
            [CX - 45,  CZ + 180],
            [CX - 60,  CZ + 165],
            [CX + 25,  CZ + 95],
            [CX + 45,  CZ + 110],
            [CX + 65,  CZ + 125],
            [CX - 10,  CZ + 75],
            [CX + 10,  CZ + 65],
            [CX + 80,  CZ + 55],
            [CX + 60,  CZ + 50]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz = treePositions[i][1];
            // Trunk
            makeCyl(0.8, 1.0, 8, 6, BARK_BROWN, tx, CY + 4, tz);
            // Canopy — layered spheres for deciduous look
            makeSphere(4, 7, 6, FOREST_GREEN, tx, CY + 11, tz);
            makeSphere(3, 7, 6, LEAF_GREEN, tx + 1.5, CY + 13, tz + 1);
            makeSphere(3, 7, 6, DARK_GREEN, tx - 1, CY + 13, tz - 1.5);
        }
        // Undergrowth scrub boxes
        makeBox(200, 3, 20, FOREST_GREEN, CX + 20, CY + 1.5, CZ + 70);
        makeBox(20,  3, 140, FOREST_GREEN, CX + 120, CY + 1.5, CZ + 130);
    }

    function buildVisitorCentre() {
        // Modern visitor centre — low stone and glass building
        var vcX = CX - 60;
        var vcZ = CZ - 20;
        // Main building body
        makeBox(30, 5, 18, VISITOR_GREY, vcX, CY + 2.5, vcZ);
        // Roof overhang
        makeBox(34, 0.6, 22, VISITOR_GREY, vcX, CY + 5.3, vcZ);
        // Glass facade panels
        makeBox(12, 4, 0.4, GLASS_BLUE, vcX - 6, CY + 2, vcZ - 9);
        makeBox(12, 4, 0.4, GLASS_BLUE, vcX + 6, CY + 2, vcZ - 9);
        // Entrance canopy
        makeBox(10, 0.5, 6, VISITOR_GREY, vcX, CY + 4, vcZ - 12);
        makeBox(0.4, 4, 0.4, IRON_GREY, vcX - 4, CY + 2, vcZ - 14);
        makeBox(0.4, 4, 0.4, IRON_GREY, vcX + 4, CY + 2, vcZ - 14);
        // Visitor centre car park surface
        makeBox(60, 0.3, 30, STONE_DARK, vcX - 20, CY + 0.15, vcZ - 30);
        // Ticket office kiosk
        makeBox(6, 4, 5, VISITOR_GREY, vcX + 20, CY + 2, vcZ - 8);
        // Gift shop extension
        makeBox(14, 5, 10, VISITOR_GREY, vcX, CY + 2.5, vcZ + 14);
    }

    function buildRoslinVillage() {
        // Roslin village — stone cottages, village green, war memorial
        var vilX = CX - 100;
        var vilZ = CZ;

        // Cottages
        var cottageData = [
            [vilX,       vilZ - 30],
            [vilX - 15,  vilZ - 30],
            [vilX + 15,  vilZ - 30],
            [vilX,       vilZ + 30],
            [vilX - 15,  vilZ + 30],
            [vilX + 15,  vilZ + 30],
            [vilX - 40,  vilZ - 20],
            [vilX - 40,  vilZ],
            [vilX - 40,  vilZ + 20]
        ];
        for (var i = 0; i < cottageData.length; i++) {
            var cttX = cottageData[i][0];
            var cttZ = cottageData[i][1];
            // Cottage body
            makeBox(10, 6, 8, VILLAGE_CREAM, cttX, CY + 3, cttZ);
            // Cottage roof
            var roofC = makeMesh(new THREE.BoxGeometry(12, 3, 10), CASTLE_STONE);
            roofC.position.set(cttX, CY + 7.5, cttZ);
            scene.add(roofC);
            objects.push(roofC);
            // Chimney
            makeBox(1.2, 4, 1.2, CASTLE_STONE, cttX + 3, CY + 11, cttZ);
            // Door
            makeBox(2, 3, 0.4, WOOD, cttX, CY + 1.5, cttZ - 4);
            // Window
            makeBox(2, 1.8, 0.4, GLASS_BLUE, cttX + 3, CY + 3, cttZ - 4);
        }
        // Village green
        makeBox(40, 0.5, 40, FOREST_GREEN, vilX - 10, CY + 0.25, vilZ);
        // War memorial — stone column with cone top
        makeCyl(1.0, 1.2, 10, 8, GRAVE_GREY, vilX - 10, CY + 5, vilZ);
        makeCyl(1.4, 1.4, 1.5, 8, GRAVE_GREY, vilX - 10, CY + 10.75, vilZ);
        makeCone(1.2, 3, 8, GRAVE_GREY, vilX - 10, CY + 13, vilZ);
        // Memorial base
        makeBox(5, 1.5, 5, GRAVE_GREY, vilX - 10, CY + 0.75, vilZ);
        // Village pub / inn
        makeBox(14, 7, 10, VILLAGE_CREAM, vilX + 20, CY + 3.5, vilZ - 35);
        var pubRoof = makeMesh(new THREE.BoxGeometry(16, 3, 12), CASTLE_STONE);
        pubRoof.position.set(vilX + 20, CY + 8.5, vilZ - 35);
        scene.add(pubRoof);
        objects.push(pubRoof);
        makeBox(1.5, 5, 1.5, CASTLE_STONE, vilX + 22, CY + 12, vilZ - 35);
        // Village road
        makeBox(12, 0.4, 200, STONE_DARK, vilX - 10, CY + 0.2, vilZ);
        // Road to chapel
        makeBox(160, 0.4, 8, STONE_DARK, CX - 80, CY + 0.2, CZ - 5);
        // Street lamp posts
        makeCyl(0.2, 0.2, 6, 6, IRON_GREY, vilX - 10, CY + 3, vilZ - 15);
        makeCyl(0.2, 0.2, 6, 6, IRON_GREY, vilX - 10, CY + 3, vilZ + 15);
        // Lamp heads
        makeSphere(0.5, 5, 4, 0xFFFF99, vilX - 10, CY + 6.3, vilZ - 15);
        makeSphere(0.5, 5, 4, 0xFFFF99, vilX - 10, CY + 6.3, vilZ + 15);
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
