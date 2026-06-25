window.GlastonburyAbbey = (function() {
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

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildTor() {
        // Main conical hill - large steep cone
        var hillBase = new THREE.CylinderGeometry(80, 120, 120, 8);
        addMesh(hillBase, 0x4a7c3f, 13880, 60, -200);

        // Upper terrace
        var terrace1 = new THREE.CylinderGeometry(50, 80, 20, 8);
        addMesh(terrace1, 0x3d6b34, 13880, 127, -200);

        // Middle terrace
        var terrace2 = new THREE.CylinderGeometry(30, 50, 15, 8);
        addMesh(terrace2, 0x527a45, 13880, 143, -200);

        // Upper terrace 2
        var terrace3 = new THREE.CylinderGeometry(18, 30, 12, 8);
        addMesh(terrace3, 0x4a7c3f, 13880, 156, -200);

        // Summit platform
        var summit = new THREE.CylinderGeometry(12, 18, 6, 8);
        addMesh(summit, 0x8b7355, 13880, 164, -200);

        // St Michael's Tower - square base
        var towerBase = new THREE.BoxGeometry(10, 25, 10);
        addMesh(towerBase, 0xc8b89a, 13880, 179, -200);

        // Tower upper section
        var towerUpper = new THREE.BoxGeometry(8, 15, 8);
        addMesh(towerUpper, 0xb8a888, 13880, 199, -200);

        // Tower top parapet
        var parapet = new THREE.BoxGeometry(10, 4, 10);
        addMesh(parapet, 0xc8b89a, 13880, 209, -200);

        // Corner turrets on tower
        var turret1 = new THREE.BoxGeometry(2, 6, 2);
        addMesh(turret1, 0xd4c4a0, 13875, 210, -205);
        var turret2 = new THREE.BoxGeometry(2, 6, 2);
        addMesh(turret2, 0xd4c4a0, 13885, 210, -205);
        var turret3 = new THREE.BoxGeometry(2, 6, 2);
        addMesh(turret3, 0xd4c4a0, 13875, 210, -195);
        var turret4 = new THREE.BoxGeometry(2, 6, 2);
        addMesh(turret4, 0xd4c4a0, 13885, 210, -195);

        // Gothic arch window representations (thin boxes)
        var win1 = new THREE.BoxGeometry(0.5, 5, 2);
        addMesh(win1, 0x2a2a2a, 13875.5, 185, -200);
        var win2 = new THREE.BoxGeometry(0.5, 5, 2);
        addMesh(win2, 0x2a2a2a, 13884.5, 185, -200);
        var win3 = new THREE.BoxGeometry(2, 5, 0.5);
        addMesh(win3, 0x2a2a2a, 13880, 185, -204.5);
        var win4 = new THREE.BoxGeometry(2, 5, 0.5);
        addMesh(win4, 0x2a2a2a, 13880, 185, -195.5);

        // Terracing detail lines on hillside
        var terrLine1 = new THREE.CylinderGeometry(95, 96, 1, 16);
        addMesh(terrLine1, 0x2d5016, 13880, 90, -200);
        var terrLine2 = new THREE.CylinderGeometry(70, 71, 1, 16);
        addMesh(terrLine2, 0x2d5016, 13880, 110, -200);
        var terrLine3 = new THREE.CylinderGeometry(50, 51, 1, 16);
        addMesh(terrLine3, 0x2d5016, 13880, 128, -200);
    }

    function buildAbbey() {
        var ox = 13880;
        var oz = 100;

        // Ground foundation slab
        var groundSlab = new THREE.BoxGeometry(200, 2, 120);
        addMesh(groundSlab, 0x8b7355, ox, 1, oz);

        // Lady Chapel - most intact Romanesque structure
        // West wall (tall, intact)
        var ladyWestWall = new THREE.BoxGeometry(30, 18, 2);
        addMesh(ladyWestWall, 0xc8b89a, ox - 70, 9, oz - 30);

        // Lady Chapel north wall
        var ladyNorthWall = new THREE.BoxGeometry(2, 16, 25);
        addMesh(ladyNorthWall, 0xc8b89a, ox - 85, 8, oz - 17);

        // Lady Chapel south wall
        var ladySouthWall = new THREE.BoxGeometry(2, 16, 25);
        addMesh(ladySouthWall, 0xc8b89a, ox - 55, 8, oz - 17);

        // Lady Chapel east arch
        var ladyEastArch = new THREE.BoxGeometry(30, 14, 2);
        addMesh(ladyEastArch, 0xb8a888, ox - 70, 7, oz - 5);

        // Romanesque arch columns on Lady Chapel
        var col1 = new THREE.CylinderGeometry(1, 1, 14, 6);
        addMesh(col1, 0xd4c4a0, ox - 62, 7, oz - 30);
        var col2 = new THREE.CylinderGeometry(1, 1, 14, 6);
        addMesh(col2, 0xd4c4a0, ox - 70, 7, oz - 30);
        var col3 = new THREE.CylinderGeometry(1, 1, 14, 6);
        addMesh(col3, 0xd4c4a0, ox - 78, 7, oz - 30);

        // Nave north wall (ruined, partial height)
        var naveNorthA = new THREE.BoxGeometry(60, 20, 2);
        addMesh(naveNorthA, 0xb8a888, ox - 20, 10, oz - 45);
        var naveNorthB = new THREE.BoxGeometry(30, 12, 2);
        addMesh(naveNorthB, 0xc8b89a, ox + 25, 6, oz - 45);

        // Nave south wall (partial)
        var naveSouthA = new THREE.BoxGeometry(50, 18, 2);
        addMesh(naveSouthA, 0xb8a888, ox - 15, 9, oz + 5);
        var naveSouthB = new THREE.BoxGeometry(20, 8, 2);
        addMesh(naveSouthB, 0xc8b89a, ox + 30, 4, oz + 5);

        // Nave piers (columns along nave)
        var i;
        for (i = 0; i < 5; i++) {
            var pier = new THREE.BoxGeometry(3, 16, 3);
            addMesh(pier, 0xc8b89a, ox - 45 + i * 20, 8, oz - 45);
            var pierS = new THREE.BoxGeometry(3, 16, 3);
            addMesh(pierS, 0xc8b89a, ox - 45 + i * 20, 8, oz + 5);
        }

        // North crossing tower (ruined)
        var northTower = new THREE.BoxGeometry(14, 30, 14);
        addMesh(northTower, 0xb8a888, ox + 20, 15, oz - 20);
        // Tower broken top
        var northTowerTop = new THREE.BoxGeometry(14, 8, 14);
        addMesh(northTowerTop, 0x9a8870, ox + 20, 34, oz - 20);

        // South crossing tower (more ruined)
        var southTower = new THREE.BoxGeometry(12, 20, 12);
        addMesh(southTower, 0xb8a888, ox + 20, 10, oz + 20);

        // Chancel walls (east end, heavily ruined)
        var chancelN = new THREE.BoxGeometry(40, 10, 2);
        addMesh(chancelN, 0x9a8870, ox + 60, 5, oz - 15);
        var chancelS = new THREE.BoxGeometry(40, 8, 2);
        addMesh(chancelS, 0x9a8870, ox + 60, 4, oz + 10);
        var chancelE = new THREE.BoxGeometry(2, 12, 25);
        addMesh(chancelE, 0x9a8870, ox + 80, 6, oz);

        // Abbot's Kitchen - octagonal (approximated with cylinder)
        var kitchenBase = new THREE.CylinderGeometry(12, 13, 15, 8);
        addMesh(kitchenBase, 0xb8a888, ox + 50, 7, oz + 60);
        // Kitchen roof (octagonal cone shape)
        var kitchenRoof = new THREE.ConeGeometry(13, 12, 8);
        addMesh(kitchenRoof, 0x808080, ox + 50, 21, oz + 60);
        // Kitchen chimney corners
        var kich1 = new THREE.CylinderGeometry(1.5, 1.5, 8, 6);
        addMesh(kich1, 0x9a9a9a, ox + 50, 30, oz + 60);

        // Ruined arch fragments
        var arch1 = new THREE.BoxGeometry(2, 12, 8);
        addMesh(arch1, 0xc8b89a, ox - 30, 6, oz - 44);
        var arch2 = new THREE.BoxGeometry(8, 4, 2);
        addMesh(arch2, 0xc8b89a, ox - 30, 14, oz - 44);

        // Scattered rubble blocks
        var rubbleColors = [0x9a8870, 0xb8a888, 0xc8b89a, 0x8b7355];
        var rubbleData = [
            [ox - 10, 1, oz + 10, 3, 2, 4],
            [ox + 5, 1, oz - 35, 4, 1, 3],
            [ox + 40, 1, oz + 15, 2, 2, 5],
            [ox - 25, 1, oz + 8, 5, 1, 2],
            [ox + 15, 1, oz + 30, 3, 3, 3],
            [ox - 50, 1, oz + 15, 4, 2, 3],
            [ox + 70, 1, oz - 5, 3, 1, 4]
        ];
        for (i = 0; i < rubbleData.length; i++) {
            var rd = rubbleData[i];
            var rubble = new THREE.BoxGeometry(rd[3], rd[4], rd[5]);
            addMesh(rubble, rubbleColors[i % rubbleColors.length], rd[0], rd[1], rd[2]);
        }
    }

    function buildFestival() {
        var ox = 13880;
        var oz = -600;

        // Pyramid Stage - iconic silver pyramid
        // Main pyramid (ConeGeometry with 4 sides)
        var pyramidMain = new THREE.ConeGeometry(40, 50, 4);
        addMesh(pyramidMain, 0xc0c0c0, ox - 100, 25, oz);

        // Pyramid stage floor/base platform
        var pyramidBase = new THREE.BoxGeometry(90, 4, 60);
        addMesh(pyramidBase, 0x4a4a4a, ox - 100, 2, oz);

        // Pyramid stage wings (sound towers)
        var wingL = new THREE.BoxGeometry(5, 20, 5);
        addMesh(wingL, 0x333333, ox - 148, 10, oz);
        var wingR = new THREE.BoxGeometry(5, 20, 5);
        addMesh(wingR, 0x333333, ox - 52, 10, oz);

        // Pyramid stage front fence/barrier
        var barrier = new THREE.BoxGeometry(90, 3, 1);
        addMesh(barrier, 0x2a2a2a, ox - 100, 1.5, oz + 35);

        // Park Stage - large tent/canopy
        var parkRoof = new THREE.ConeGeometry(35, 20, 6);
        addMesh(parkRoof, 0x8b6914, ox + 150, 10, oz - 50);
        var parkBase = new THREE.CylinderGeometry(35, 35, 6, 6);
        addMesh(parkBase, 0x6b5010, ox + 150, 3, oz - 50);

        // Other Stage
        var otherRoof = new THREE.BoxGeometry(60, 1, 50);
        addMesh(otherRoof, 0x555555, ox + 100, 15, oz + 100);
        var otherFront = new THREE.BoxGeometry(60, 15, 2);
        addMesh(otherFront, 0x444444, ox + 100, 7, oz + 125);
        var otherLeft = new THREE.BoxGeometry(2, 15, 50);
        addMesh(otherLeft, 0x444444, ox + 70, 7, oz + 100);
        var otherRight = new THREE.BoxGeometry(2, 15, 50);
        addMesh(otherRight, 0x444444, ox + 130, 7, oz + 100);

        // Campsite tents - scattered small cones and boxes
        var tentPositions = [
            [ox - 200, oz + 50],
            [ox - 220, oz + 70],
            [ox - 185, oz + 65],
            [ox - 240, oz + 40],
            [ox - 210, oz + 90],
            [ox - 170, oz + 80],
            [ox + 200, oz - 100],
            [ox + 220, oz - 80],
            [ox + 240, oz - 120],
            [ox + 180, oz - 90],
            [ox - 50, oz + 150],
            [ox, oz + 160],
            [ox + 50, oz + 155]
        ];
        var tentColors = [0xff6600, 0x0066ff, 0x00cc00, 0xffff00, 0xff0066, 0x9900cc, 0x00cccc];
        var t;
        for (t = 0; t < tentPositions.length; t++) {
            var tentPos = tentPositions[t];
            var tentBody = new THREE.ConeGeometry(3, 4, 4);
            addMesh(tentBody, tentColors[t % tentColors.length], tentPos[0], 2, tentPos[1]);
        }

        // Stone Circle (in Green Fields area)
        var stoneCount = 12;
        var stoneRadius = 15;
        var s;
        for (s = 0; s < stoneCount; s++) {
            var angle = (s / stoneCount) * Math.PI * 2;
            var sx = ox - 250 + Math.cos(angle) * stoneRadius;
            var sz = oz - 100 + Math.sin(angle) * stoneRadius;
            var stone = new THREE.BoxGeometry(2, 4, 1.5);
            addMesh(stone, 0x777777, sx, 2, sz);
        }

        // Green Fields area - some tree-like structures
        var treePosGF = [
            [ox - 300, oz - 80],
            [ox - 320, oz - 60],
            [ox - 290, oz - 100],
            [ox - 310, oz - 50],
            [ox - 280, oz - 70]
        ];
        var tf;
        for (tf = 0; tf < treePosGF.length; tf++) {
            var treeT = treePosGF[tf];
            var trunk = new THREE.CylinderGeometry(0.8, 1, 6, 6);
            addMesh(trunk, 0x5c3d1e, treeT[0], 3, treeT[1]);
            var canopy = new THREE.SphereGeometry(4, 6, 6);
            addMesh(canopy, 0x2d8a2d, treeT[0], 10, treeT[1]);
        }

        // Festival flags/poles
        var flagPoles = [
            [ox - 100, oz - 60],
            [ox - 60, oz - 60],
            [ox - 140, oz - 60],
            [ox + 150, oz - 90],
            [ox + 100, oz + 70]
        ];
        var fp;
        for (fp = 0; fp < flagPoles.length; fp++) {
            var pole = new THREE.CylinderGeometry(0.3, 0.3, 20, 4);
            addMesh(pole, 0x888888, flagPoles[fp][0], 10, flagPoles[fp][1]);
            var flag = new THREE.BoxGeometry(4, 3, 0.2);
            addMesh(flag, tentColors[fp % tentColors.length], flagPoles[fp][0] + 2, 19, flagPoles[fp][1]);
        }
    }

    function buildChaliceWell() {
        var ox = 13880;
        var oz = 300;

        // Garden surrounding walls
        var wallN = new THREE.BoxGeometry(40, 2, 1);
        addMesh(wallN, 0x8b7355, ox, 1, oz - 20);
        var wallS = new THREE.BoxGeometry(40, 2, 1);
        addMesh(wallS, 0x8b7355, ox, 1, oz + 20);
        var wallE = new THREE.BoxGeometry(1, 2, 40);
        addMesh(wallE, 0x8b7355, ox + 20, 1, oz);
        var wallW = new THREE.BoxGeometry(1, 2, 40);
        addMesh(wallW, 0x8b7355, ox - 20, 1, oz);

        // Well chamber - stone surround
        var wellSurround = new THREE.CylinderGeometry(5, 5, 3, 8);
        addMesh(wellSurround, 0x8b7355, ox, 1.5, oz);

        // Well opening (dark water)
        var wellWater = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 8);
        addMesh(wellWater, 0x8b0000, ox, 3.5, oz);

        // Vesica piscis decorative cover (two overlapping circles = box approximation)
        var coverA = new THREE.BoxGeometry(7, 0.3, 4);
        addMesh(coverA, 0x5c3d1e, ox - 1, 3.8, oz);
        var coverB = new THREE.BoxGeometry(7, 0.3, 4);
        addMesh(coverB, 0x5c3d1e, ox + 1, 3.9, oz);

        // Yew trees around well
        var yewPositions = [
            [ox - 10, oz - 10],
            [ox + 10, oz - 10],
            [ox - 10, oz + 10],
            [ox + 10, oz + 10]
        ];
        var y;
        for (y = 0; y < yewPositions.length; y++) {
            var yp = yewPositions[y];
            var yewTrunk = new THREE.CylinderGeometry(0.6, 0.8, 8, 6);
            addMesh(yewTrunk, 0x3d2b1f, yp[0], 4, yp[1]);
            var yewTop = new THREE.ConeGeometry(3, 6, 6);
            addMesh(yewTop, 0x1a4a1a, yp[0], 11, yp[1]);
        }

        // Red spring water channel (iron-rich red water)
        var channel = new THREE.BoxGeometry(2, 0.3, 15);
        addMesh(channel, 0xcc2200, ox, 0.2, oz + 12);

        // Garden path stones
        var pathStone = new THREE.BoxGeometry(15, 0.2, 3);
        addMesh(pathStone, 0xaaaaaa, ox, 0.2, oz + 5);

        // Flower bed borders
        var bedBorder = new THREE.BoxGeometry(8, 0.5, 0.3);
        addMesh(bedBorder, 0x4a7c3f, ox - 12, 0.3, oz - 5);
        var bedBorder2 = new THREE.BoxGeometry(8, 0.5, 0.3);
        addMesh(bedBorder2, 0x4a7c3f, ox + 12, 0.3, oz - 5);
    }

    function buildTown() {
        var ox = 13880;
        var oz = 500;

        // High Street - road surface
        var road = new THREE.BoxGeometry(12, 0.3, 200);
        addMesh(road, 0x555555, ox, 0.2, oz);

        // George and Pilgrims Inn (large medieval building)
        var innBody = new THREE.BoxGeometry(25, 14, 15);
        addMesh(innBody, 0xc8b89a, ox - 40, 7, oz - 60);
        var innRoof = new THREE.BoxGeometry(27, 4, 17);
        addMesh(innRoof, 0x8b4513, ox - 40, 16, oz - 60);

        // Inn facade detail - mullioned windows
        var innWinRow = new THREE.BoxGeometry(20, 2, 0.3);
        addMesh(innWinRow, 0x4a3a28, ox - 40, 8, oz - 67.7);
        var innWinRow2 = new THREE.BoxGeometry(20, 2, 0.3);
        addMesh(innWinRow2, 0x4a3a28, ox - 40, 12, oz - 67.7);

        // Inn sign post
        var signPost = new THREE.CylinderGeometry(0.2, 0.2, 8, 4);
        addMesh(signPost, 0x5c3d1e, ox - 29, 4, oz - 67);
        var signBoard = new THREE.BoxGeometry(4, 2, 0.2);
        addMesh(signBoard, 0x8b4513, ox - 29, 8, oz - 67);

        // Market Cross - central feature
        var crossBase = new THREE.BoxGeometry(8, 1, 8);
        addMesh(crossBase, 0x888888, ox, 0.5, oz - 20);
        var crossShaft = new THREE.CylinderGeometry(1, 1.5, 8, 6);
        addMesh(crossShaft, 0x888888, ox, 5, oz - 20);
        var crossTop = new THREE.ConeGeometry(1.5, 3, 6);
        addMesh(crossTop, 0x888888, ox, 12, oz - 20);

        // Tribunal (medieval building)
        var tribunalBody = new THREE.BoxGeometry(20, 12, 12);
        addMesh(tribunalBody, 0xb8a888, ox + 35, 6, oz - 40);
        var tribunalRoof = new THREE.BoxGeometry(22, 3, 14);
        addMesh(tribunalRoof, 0x7a5c3a, ox + 35, 13.5, oz - 40);
        // Tribunal windows
        var tribWin1 = new THREE.BoxGeometry(3, 4, 0.3);
        addMesh(tribWin1, 0x2a2a2a, ox + 28, 7, oz - 46.2);
        var tribWin2 = new THREE.BoxGeometry(3, 4, 0.3);
        addMesh(tribWin2, 0x2a2a2a, ox + 35, 7, oz - 46.2);
        var tribWin3 = new THREE.BoxGeometry(3, 4, 0.3);
        addMesh(tribWin3, 0x2a2a2a, ox + 42, 7, oz - 46.2);

        // Mystical/pagan shops along High Street
        var shopData = [
            [ox - 20, oz - 10, 12, 8, 10, 0xd4c4a0],
            [ox - 20, oz + 10, 12, 9, 10, 0xc8b89a],
            [ox + 20, oz - 10, 14, 8, 10, 0xb8a888],
            [ox + 20, oz + 15, 10, 7, 10, 0xd4c4a0],
            [ox - 20, oz + 30, 12, 8, 10, 0xc8b89a],
            [ox + 20, oz + 35, 12, 9, 10, 0xb8a888]
        ];
        var sh;
        for (sh = 0; sh < shopData.length; sh++) {
            var sd = shopData[sh];
            var shopBody = new THREE.BoxGeometry(sd[2], sd[3], sd[4]);
            addMesh(shopBody, sd[5], sd[0], sd[3] / 2, sd[1]);
            var shopRoof = new THREE.BoxGeometry(sd[2] + 1, 2, sd[4] + 1);
            addMesh(shopRoof, 0x8b4513, sd[0], sd[3] + 1, sd[1]);
        }

        // St John's Church tower (visible above town)
        var churchTower = new THREE.BoxGeometry(12, 35, 12);
        addMesh(churchTower, 0xb8a888, ox + 60, 17, oz + 50);
        var churchParapet = new THREE.BoxGeometry(14, 4, 14);
        addMesh(churchParapet, 0xc8b89a, ox + 60, 37, oz + 50);
        var churchSpire = new THREE.ConeGeometry(4, 15, 4);
        addMesh(churchSpire, 0x9a9a9a, ox + 60, 50, oz + 50);
        var churchNavy = new THREE.BoxGeometry(20, 14, 40);
        addMesh(churchNavy, 0xb8a888, ox + 60, 7, oz + 70);
    }

    function buildSedgemoor() {
        var ox = 13880;
        var oz = 900;

        // Flat Somerset Levels ground
        var levels = new THREE.BoxGeometry(600, 0.5, 400);
        addMesh(levels, 0x5a7a3a, ox, 0.3, oz);

        // Peat moors (darker patches)
        var peat1 = new THREE.BoxGeometry(100, 0.4, 80);
        addMesh(peat1, 0x3d2b1f, ox - 150, 0.4, oz - 50);
        var peat2 = new THREE.BoxGeometry(80, 0.4, 100);
        addMesh(peat2, 0x3d2b1f, ox + 100, 0.4, oz + 60);
        var peat3 = new THREE.BoxGeometry(120, 0.4, 60);
        addMesh(peat3, 0x3d2b1f, ox, 0.4, oz + 100);

        // Rhynes (drainage ditches) - long thin blue channels
        var rhyne1 = new THREE.BoxGeometry(400, 0.3, 3);
        addMesh(rhyne1, 0x3a6a8a, ox, 0.5, oz - 80);
        var rhyne2 = new THREE.BoxGeometry(400, 0.3, 3);
        addMesh(rhyne2, 0x3a6a8a, ox, 0.5, oz - 40);
        var rhyne3 = new THREE.BoxGeometry(400, 0.3, 3);
        addMesh(rhyne3, 0x3a6a8a, ox, 0.5, oz + 30);
        var rhyne4 = new THREE.BoxGeometry(400, 0.3, 3);
        addMesh(rhyne4, 0x3a6a8a, ox, 0.5, oz + 80);

        // Cross-rhynes (perpendicular ditches)
        var crhyne1 = new THREE.BoxGeometry(3, 0.3, 300);
        addMesh(crhyne1, 0x3a6a8a, ox - 100, 0.5, oz);
        var crhyne2 = new THREE.BoxGeometry(3, 0.3, 300);
        addMesh(crhyne2, 0x3a6a8a, ox + 80, 0.5, oz);
        var crhyne3 = new THREE.BoxGeometry(3, 0.3, 300);
        addMesh(crhyne3, 0x3a6a8a, ox + 200, 0.5, oz);

        // Willow pollards along rhynes
        var willowPositions = [
            [ox - 180, oz - 80], [ox - 120, oz - 80], [ox - 60, oz - 80],
            [ox, oz - 80], [ox + 60, oz - 80], [ox + 120, oz - 80],
            [ox - 180, oz + 30], [ox - 90, oz + 30], [ox + 30, oz + 30],
            [ox + 120, oz + 30], [ox + 200, oz + 30],
            [ox - 100, oz - 120], [ox - 100, oz - 60], [ox - 100, oz + 10],
            [ox - 100, oz + 80]
        ];
        var w;
        for (w = 0; w < willowPositions.length; w++) {
            var wp = willowPositions[w];
            var willowTrunk = new THREE.CylinderGeometry(0.5, 0.7, 5, 5);
            addMesh(willowTrunk, 0x5c3d1e, wp[0], 2.5, wp[1]);
            // Pollarded top - rounded blob
            var pollardTop = new THREE.SphereGeometry(2.5, 5, 5);
            addMesh(pollardTop, 0x6aaa3a, wp[0], 7, wp[1]);
        }

        // Battle of Sedgemoor site marker (1685)
        var battleMarker = new THREE.CylinderGeometry(0.5, 0.5, 4, 4);
        addMesh(battleMarker, 0x888888, ox - 200, 2, oz + 150);
        var battlePlaque = new THREE.BoxGeometry(3, 2, 0.3);
        addMesh(battlePlaque, 0x666666, ox - 200, 4.5, oz + 149.9);

        // Glastonbury Mump (small hill - similar to Tor, nearby)
        var mumpHill = new THREE.CylinderGeometry(20, 35, 25, 8);
        addMesh(mumpHill, 0x4a7c3f, ox + 250, 12, oz - 150);
        var mumpChurch = new THREE.BoxGeometry(6, 8, 5);
        addMesh(mumpChurch, 0xb8a888, ox + 250, 33, oz - 150);

        // Hay bales in field
        var balePositions = [
            [ox - 50, oz + 130], [ox - 30, oz + 130], [ox - 10, oz + 130],
            [ox + 20, oz + 130], [ox - 40, oz + 150], [ox, oz + 150]
        ];
        var b;
        for (b = 0; b < balePositions.length; b++) {
            var bp = balePositions[b];
            var bale = new THREE.CylinderGeometry(2, 2, 3, 8);
            bale.rotateZ = Math.PI / 2;
            var baleMesh = addMesh(bale, 0xd4aa5a, bp[0], 2, bp[1]);
            baleMesh.rotation.z = Math.PI / 2;
        }

        // King's Sedgemoor Drain (major drainage channel)
        var ksd = new THREE.BoxGeometry(600, 0.5, 8);
        addMesh(ksd, 0x4a7a9a, ox, 0.6, oz + 160);
    }

    function build() {
        buildTor();
        buildAbbey();
        buildFestival();
        buildChaliceWell();
        buildTown();
        buildSedgemoor();
    }

    function update(delta) {
        // Static environment, no animation needed
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
