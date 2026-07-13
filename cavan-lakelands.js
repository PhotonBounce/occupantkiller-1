window.CavanLakelands = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18520;
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

    function makeLakeMat() {
        return new THREE.MeshLambertMaterial({ color: 0x006994 });
    }

    function makeGrassMat() {
        return new THREE.MeshLambertMaterial({ color: 0x556B2F });
    }

    function makeForestMat() {
        return new THREE.MeshLambertMaterial({ color: 0x228B22 });
    }

    function makeDarkForestMat() {
        return new THREE.MeshLambertMaterial({ color: 0x2D5A27 });
    }

    function makeStoneMat() {
        return new THREE.MeshLambertMaterial({ color: 0x808080 });
    }

    function makeCastleMat() {
        return new THREE.MeshLambertMaterial({ color: 0x8B7355 });
    }

    function makeTownMat() {
        return new THREE.MeshLambertMaterial({ color: 0xCD5C5C });
    }

    function makeWoodMat() {
        return new THREE.MeshLambertMaterial({ color: 0x5C3317 });
    }

    function makeEarthMat() {
        return new THREE.MeshLambertMaterial({ color: 0x8B6914 });
    }

    function makeRockMat() {
        return new THREE.MeshLambertMaterial({ color: 0x696969 });
    }

    function makeDarkRockMat() {
        return new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    }

    function makeRoofMat() {
        return new THREE.MeshLambertMaterial({ color: 0x555555 });
    }

    function makeWhiteMat() {
        return new THREE.MeshLambertMaterial({ color: 0xF5F5F0 });
    }

    function placeMesh(geo, mat, x, y, z) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function build() {
        buildLakes();
        buildDrumlins();
        buildKillykeenForest();
        buildLoughOughterCastle();
        buildCavanTown();
        buildCathedral();
        buildShannonPot();
        buildBlackPigsDyke();
        buildFishingJetties();
        buildRiverErneSource();
        buildGroundBase();
    }

    // ---------------------------------------------------------------
    // GROUND BASE — large flat green box under everything
    // ---------------------------------------------------------------
    function buildGroundBase() {
        var geo = new THREE.BoxGeometry(2400, 2, 2400);
        var mat = new THREE.MeshLambertMaterial({ color: 0x4A7C3F });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX, OY - 1, OZ);
        addMesh(mesh);
    }

    // ---------------------------------------------------------------
    // LAKES — 30+ blue BoxGeometry water patches scattered around
    // ---------------------------------------------------------------
    function buildLakes() {
        var lakeData = [
            // [x, z, w, d, label]
            [0,    0,   180, 80],    // Lough Oughter main body
            [220,  60,   90, 55],    // Lough Oughter arm
            [-180, 40,  110, 45],    // Lough Oughter west
            [80,   180,  70, 40],    // small lake north
            [-90,  -200, 85, 50],    // Lough Sillan
            [300,  -100, 60, 35],
            [-300, 120,  75, 45],
            [500,  200,  95, 50],    // Lough Ramor
            [-500, -150, 80, 40],
            [650,  -300, 55, 30],
            [-650, 300,  70, 38],
            [400,  -450, 65, 32],
            [-400, 450,  78, 42],
            [700,  500,  55, 28],
            [-700, -500, 60, 33],
            [900,  -100, 85, 44],    // Lough Gowna
            [-900, 200,  70, 36],
            [1050, 350,  90, 48],
            [-1050,-350, 75, 40],
            [200,  -600, 65, 32],
            [-200, 600,  68, 35],
            [1100, -500, 55, 28],
            [-1100, 550, 72, 38],
            [850,  700,  60, 30],
            [-850, -700, 58, 29],
            [150,  850,  80, 42],
            [-150,-850,  75, 38],
            [600,  -800, 62, 31],
            [-600, 800,  66, 34],
            [1000, 900,  50, 26],
            [-1000,-900, 54, 27],
            [350,  1000, 88, 44],
            [-350,-1000, 82, 41],
            [750,  -950, 58, 29],
            [-750, 950,  64, 32]
        ];

        var mat = makeLakeMat();
        for (var i = 0; i < lakeData.length; i++) {
            var d = lakeData[i];
            var geo = new THREE.BoxGeometry(d[2], 1.5, d[3]);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(OX + d[0], OY + 0.2, OZ + d[1]);
            addMesh(mesh);
        }
    }

    // ---------------------------------------------------------------
    // DRUMLINS — green oval hills using scaled SphereGeometry
    // ---------------------------------------------------------------
    function buildDrumlins() {
        var drumlinData = [
            // [x, z, rx, ry, rz]
            [140,  -120, 60, 18, 35],
            [-140, 130,  55, 16, 32],
            [320,  50,   70, 20, 40],
            [-320, -50,  65, 18, 38],
            [460,  -200, 58, 17, 33],
            [-460, 210,  62, 19, 36],
            [600,  100,  75, 22, 42],
            [-600, -100, 68, 20, 39],
            [750,  -350, 55, 16, 31],
            [-750, 360,  60, 18, 34],
            [200,  400,  50, 15, 28],
            [-200, -400, 53, 15, 30],
            [900,  500,  65, 19, 37],
            [-900, -500, 60, 17, 34],
            [100,  700,  72, 21, 41],
            [-100, -700, 67, 20, 38],
            [500,  -650, 58, 17, 33],
            [-500, 660,  54, 16, 31],
            [1100, 200,  80, 24, 45],
            [-1100,-200, 76, 22, 43]
        ];

        var mat = makeGrassMat();
        for (var i = 0; i < drumlinData.length; i++) {
            var d = drumlinData[i];
            var geo = new THREE.SphereGeometry(1, 8, 6);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.scale.set(d[2], d[3], d[4]);
            mesh.position.set(OX + d[0], OY + d[3] * 0.5 - 2, OZ + d[1]);
            addMesh(mesh);
        }
    }

    // ---------------------------------------------------------------
    // KILLYKEEN FOREST PARK
    // ---------------------------------------------------------------
    function buildKillykeenForest() {
        var fx = -80;
        var fz = -380;

        // Forest lake in center
        var lakeGeo = new THREE.BoxGeometry(100, 1.5, 65);
        var lakeMesh = new THREE.Mesh(lakeGeo, makeLakeMat());
        lakeMesh.position.set(OX + fx, OY + 0.2, OZ + fz);
        addMesh(lakeMesh);

        // Trees arranged around the lake
        var treePositions = [
            [-90, -60], [-70, -80], [-50, -60], [-30, -75],
            [90, -60],  [70, -80],  [50, -60],  [30, -75],
            [-90, 60],  [-70, 80],  [-50, 60],  [-30, 75],
            [90, 60],   [70, 80],   [50, 60],   [30, 75],
            [-110, 0],  [110, 0],   [-95, -30], [95, -30],
            [-95, 30],  [95, 30],   [0, -90],   [0, 90],
            [-45, -95], [45, -95],  [-45, 95],  [45, 95],
            [-125, -45],[125, -45], [-125, 45], [125, 45],
            [0, -110],  [0, 110],   [-60, -110],[60, -110],
            [-60, 110], [60, 110]
        ];

        var trunkMat = makeWoodMat();
        var canopy1 = makeForestMat();
        var canopy2 = makeDarkForestMat();

        for (var i = 0; i < treePositions.length; i++) {
            var tp = treePositions[i];
            var tx = fx + tp[0];
            var tz = fz + tp[1];

            var trunkH = 8 + (i % 5) * 2;
            var trunkGeo = new THREE.CylinderGeometry(0.8, 1.2, trunkH, 6);
            var trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
            trunkMesh.position.set(OX + tx, OY + trunkH * 0.5, OZ + tz);
            addMesh(trunkMesh);

            var canopyR = 5 + (i % 4);
            var canopyGeo = new THREE.SphereGeometry(canopyR, 7, 5);
            var canopyMat = (i % 2 === 0) ? canopy1 : canopy2;
            var canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
            canopyMesh.position.set(OX + tx, OY + trunkH + canopyR * 0.6, OZ + tz);
            addMesh(canopyMesh);
        }
    }

    // ---------------------------------------------------------------
    // LOUGH OUGHTER CASTLE — round tower ruin on island
    // ---------------------------------------------------------------
    function buildLoughOughterCastle() {
        var cx = 60;
        var cz = -30;

        // Tiny island
        var islandGeo = new THREE.BoxGeometry(22, 2, 22);
        var islandMesh = new THREE.Mesh(islandGeo, makeGrassMat());
        islandMesh.position.set(OX + cx, OY + 0.8, OZ + cz);
        addMesh(islandMesh);

        // Main round tower
        var towerGeo = new THREE.CylinderGeometry(5, 6, 28, 10);
        var towerMesh = new THREE.Mesh(towerGeo, makeCastleMat());
        towerMesh.position.set(OX + cx, OY + 14, OZ + cz);
        addMesh(towerMesh);

        // Partial collapsed top section (offset to show ruin)
        var ruinGeo = new THREE.CylinderGeometry(4, 5, 8, 8);
        var ruinMesh = new THREE.Mesh(ruinGeo, makeCastleMat());
        ruinMesh.position.set(OX + cx + 1.5, OY + 30, OZ + cz - 1);
        ruinMesh.rotation.z = 0.15;
        addMesh(ruinMesh);

        // Wall fragment 1
        var wall1Geo = new THREE.BoxGeometry(2.5, 14, 7);
        var wall1Mesh = new THREE.Mesh(wall1Geo, makeCastleMat());
        wall1Mesh.position.set(OX + cx + 6, OY + 7, OZ + cz);
        wall1Mesh.rotation.y = 0.3;
        addMesh(wall1Mesh);

        // Wall fragment 2
        var wall2Geo = new THREE.BoxGeometry(2.5, 10, 6);
        var wall2Mesh = new THREE.Mesh(wall2Geo, makeCastleMat());
        wall2Mesh.position.set(OX + cx - 5, OY + 5, OZ + cz + 5);
        wall2Mesh.rotation.y = -0.4;
        addMesh(wall2Mesh);

        // Rubble blocks
        var rubbleGeo = new THREE.BoxGeometry(3, 1.5, 3);
        var rub1 = new THREE.Mesh(rubbleGeo, makeCastleMat());
        rub1.position.set(OX + cx + 4, OY + 1.5, OZ + cz + 3);
        addMesh(rub1);

        var rubble2Geo = new THREE.BoxGeometry(2, 1, 2);
        var rub2 = new THREE.Mesh(rubble2Geo, makeCastleMat());
        rub2.position.set(OX + cx - 4, OY + 1, OZ + cz - 4);
        addMesh(rub2);
    }

    // ---------------------------------------------------------------
    // CAVAN TOWN
    // ---------------------------------------------------------------
    function buildCavanTown() {
        var tx = -350;
        var tz = -50;

        // Main street buildings — a row of small town houses
        var buildingData = [
            [0, 0,    12, 10, 10],
            [16, 0,   10, 8,  10],
            [-16, 0,  11, 9,  10],
            [32, 0,   10, 12, 10],
            [-32, 0,  13, 7,  10],
            [48, 0,   9,  10, 10],
            [-48, 0,  10, 9,  10],
            [0,  15,  11, 8,  10],
            [16, 15,  10, 11, 10],
            [-16, 15, 12, 9,  10],
            [32, 15,  9,  8,  10],
            [-32, 15, 11, 10, 10]
        ];

        var townMat = makeTownMat();
        var roofMat = makeRoofMat();

        for (var i = 0; i < buildingData.length; i++) {
            var b = buildingData[i];
            var bGeo = new THREE.BoxGeometry(b[2], b[3], b[4]);
            var bMesh = new THREE.Mesh(bGeo, townMat);
            bMesh.position.set(OX + tx + b[0], OY + b[3] * 0.5, OZ + tz + b[1]);
            addMesh(bMesh);

            // Roof
            var roofGeo = new THREE.ConeGeometry(b[2] * 0.75, b[3] * 0.4, 4);
            var roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.position.set(OX + tx + b[0], OY + b[3] + b[3] * 0.2, OZ + tz + b[1]);
            roofMesh.rotation.y = Math.PI * 0.25;
            addMesh(roofMesh);
        }

        // County Council offices — larger block
        var councilGeo = new THREE.BoxGeometry(30, 18, 22);
        var councilMesh = new THREE.Mesh(councilGeo, new THREE.MeshLambertMaterial({ color: 0xB0947A }));
        councilMesh.position.set(OX + tx + 80, OY + 9, OZ + tz + 5);
        addMesh(councilMesh);

        // Council roof
        var cRoofGeo = new THREE.BoxGeometry(32, 2, 24);
        var cRoofMesh = new THREE.Mesh(cRoofGeo, makeRoofMat());
        cRoofMesh.position.set(OX + tx + 80, OY + 19, OZ + tz + 5);
        addMesh(cRoofMesh);

        // Market cross / town square feature
        var crossBaseGeo = new THREE.BoxGeometry(6, 1, 6);
        var crossBase = new THREE.Mesh(crossBaseGeo, makeStoneMat());
        crossBase.position.set(OX + tx + 5, OY + 0.5, OZ + tz - 20);
        addMesh(crossBase);

        var crossPostGeo = new THREE.CylinderGeometry(0.5, 0.5, 10, 6);
        var crossPost = new THREE.Mesh(crossPostGeo, makeStoneMat());
        crossPost.position.set(OX + tx + 5, OY + 5.5, OZ + tz - 20);
        addMesh(crossPost);
    }

    // ---------------------------------------------------------------
    // CATHEDRAL OF SS PATRICK AND FELIM — Baroque/Romanesque
    // ---------------------------------------------------------------
    function buildCathedral() {
        var cx = -410;
        var cz = -100;

        var cathedralMat = makeStoneMat();
        var spireCapMat = makeRoofMat();

        // Main nave body
        var naveGeo = new THREE.BoxGeometry(30, 22, 70);
        var naveMesh = new THREE.Mesh(naveGeo, cathedralMat);
        naveMesh.position.set(OX + cx, OY + 11, OZ + cz);
        addMesh(naveMesh);

        // Transept (crosspiece)
        var transeptGeo = new THREE.BoxGeometry(60, 18, 20);
        var transeptMesh = new THREE.Mesh(transeptGeo, cathedralMat);
        transeptMesh.position.set(OX + cx, OY + 9, OZ + cz + 5);
        addMesh(transeptMesh);

        // Apse (rear rounded end) — cylinder half
        var apseGeo = new THREE.CylinderGeometry(14, 14, 16, 8);
        var apseMesh = new THREE.Mesh(apseGeo, cathedralMat);
        apseMesh.position.set(OX + cx, OY + 8, OZ + cz + 40);
        addMesh(apseMesh);

        // Nave roof ridge
        var naveRoofGeo = new THREE.ConeGeometry(17, 12, 4);
        var naveRoofMesh = new THREE.Mesh(naveRoofGeo, spireCapMat);
        naveRoofMesh.position.set(OX + cx, OY + 28, OZ + cz);
        naveRoofMesh.rotation.y = Math.PI * 0.25;
        addMesh(naveRoofMesh);

        // Twin towers at the west front
        var tower1Geo = new THREE.BoxGeometry(10, 36, 10);
        var tower1Mesh = new THREE.Mesh(tower1Geo, cathedralMat);
        tower1Mesh.position.set(OX + cx - 14, OY + 18, OZ + cz - 32);
        addMesh(tower1Mesh);

        var tower2Geo = new THREE.BoxGeometry(10, 36, 10);
        var tower2Mesh = new THREE.Mesh(tower2Geo, cathedralMat);
        tower2Mesh.position.set(OX + cx + 14, OY + 18, OZ + cz - 32);
        addMesh(tower2Mesh);

        // Twin ConeGeometry spires — the signature feature
        var spire1Geo = new THREE.ConeGeometry(5.5, 28, 8);
        var spire1Mesh = new THREE.Mesh(spire1Geo, spireCapMat);
        spire1Mesh.position.set(OX + cx - 14, OY + 50, OZ + cz - 32);
        addMesh(spire1Mesh);

        var spire2Geo = new THREE.ConeGeometry(5.5, 28, 8);
        var spire2Mesh = new THREE.Mesh(spire2Geo, spireCapMat);
        spire2Mesh.position.set(OX + cx + 14, OY + 50, OZ + cz - 32);
        addMesh(spire2Mesh);

        // Central dome / crossing tower
        var domeGeo = new THREE.SphereGeometry(9, 10, 6);
        var domeMesh = new THREE.Mesh(domeGeo, cathedralMat);
        domeMesh.position.set(OX + cx, OY + 30, OZ + cz + 5);
        addMesh(domeMesh);

        // Portico columns (front facade)
        var colPositions = [-8, -3, 3, 8];
        for (var i = 0; i < colPositions.length; i++) {
            var colGeo = new THREE.CylinderGeometry(0.8, 1, 14, 8);
            var colMesh = new THREE.Mesh(colGeo, makeWhiteMat());
            colMesh.position.set(OX + cx + colPositions[i], OY + 7, OZ + cz - 37);
            addMesh(colMesh);
        }

        // Steps at entrance
        var step1Geo = new THREE.BoxGeometry(28, 1, 6);
        var step1 = new THREE.Mesh(step1Geo, makeStoneMat());
        step1.position.set(OX + cx, OY + 0.5, OZ + cz - 39);
        addMesh(step1);

        var step2Geo = new THREE.BoxGeometry(24, 1, 4);
        var step2 = new THREE.Mesh(step2Geo, makeStoneMat());
        step2.position.set(OX + cx, OY + 1.5, OZ + cz - 37);
        addMesh(step2);
    }

    // ---------------------------------------------------------------
    // SHANNON POT — spring source of the Shannon
    // ---------------------------------------------------------------
    function buildShannonPot() {
        var sx = 900;
        var sz = -800;

        // The spring pool
        var poolGeo = new THREE.BoxGeometry(14, 1, 14);
        var poolMesh = new THREE.Mesh(poolGeo, makeLakeMat());
        poolMesh.position.set(OX + sx, OY + 0.4, OZ + sz);
        addMesh(poolMesh);

        // Surrounding turf/grass mound
        var moundGeo = new THREE.SphereGeometry(12, 8, 5);
        var moundMesh = new THREE.Mesh(moundGeo, makeGrassMat());
        moundMesh.scale.set(1, 0.25, 1);
        moundMesh.position.set(OX + sx, OY + 0.5, OZ + sz);
        addMesh(moundMesh);

        // Surrounding rocks
        var rockOffsets = [
            [8, 0], [-8, 0], [0, 8], [0, -8],
            [6, 6], [-6, 6], [6, -6], [-6, -6]
        ];
        var rockMat = makeRockMat();
        for (var i = 0; i < rockOffsets.length; i++) {
            var rSize = 1.5 + (i % 3) * 0.5;
            var rGeo = new THREE.SphereGeometry(rSize, 5, 4);
            var rMesh = new THREE.Mesh(rGeo, rockMat);
            rMesh.position.set(OX + sx + rockOffsets[i][0], OY + rSize * 0.4, OZ + sz + rockOffsets[i][1]);
            addMesh(rMesh);
        }

        // Small outflow channel — thin water strip heading south
        var channelGeo = new THREE.BoxGeometry(3, 0.8, 40);
        var channelMesh = new THREE.Mesh(channelGeo, makeLakeMat());
        channelMesh.position.set(OX + sx, OY + 0.2, OZ + sz + 30);
        addMesh(channelMesh);

        // Sign post
        var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 5);
        var postMesh = new THREE.Mesh(postGeo, makeWoodMat());
        postMesh.position.set(OX + sx + 10, OY + 2.5, OZ + sz - 5);
        addMesh(postMesh);

        var signGeo = new THREE.BoxGeometry(6, 2, 0.4);
        var signMesh = new THREE.Mesh(signGeo, makeWoodMat());
        signMesh.position.set(OX + sx + 10, OY + 5.5, OZ + sz - 5);
        addMesh(signMesh);
    }

    // ---------------------------------------------------------------
    // BLACK PIG'S DYKE — ancient earthwork linear bank/ditch
    // ---------------------------------------------------------------
    function buildBlackPigsDyke() {
        var bx = 200;
        var bz = -300;

        // Main raised bank — series of BoxGeometry segments running NW-SE
        var bankSegments = [
            [0,   0,   12, 5, 200],
            [160, -55, 12, 5, 180],
            [310, -110, 12, 5, 200],
            [460, -160, 12, 5, 190],
            [-150, 55,  12, 5, 170]
        ];

        var bankMat = makeEarthMat();

        for (var i = 0; i < bankSegments.length; i++) {
            var seg = bankSegments[i];
            var bankGeo = new THREE.BoxGeometry(seg[2], seg[3], seg[4]);
            var bankMesh = new THREE.Mesh(bankGeo, bankMat);
            bankMesh.rotation.y = 0.32; // angle the dyke diagonally
            bankMesh.position.set(OX + bx + seg[0], OY + seg[3] * 0.5, OZ + bz + seg[1]);
            addMesh(bankMesh);

            // Ditch alongside (darker depression indicated by a low dark strip)
            var ditchGeo = new THREE.BoxGeometry(8, 2, seg[4]);
            var ditchMesh = new THREE.Mesh(ditchGeo, makeDarkRockMat());
            ditchMesh.rotation.y = 0.32;
            ditchMesh.position.set(OX + bx + seg[0] + 16, OY - 0.5, OZ + bz + seg[1]);
            addMesh(ditchMesh);
        }
    }

    // ---------------------------------------------------------------
    // FISHING JETTIES — wooden plank jetties with boats
    // ---------------------------------------------------------------
    function buildFishingJetties() {
        var jettyData = [
            [120,  30,  0],
            [-80,  -180, 0.5],
            [490,  200, 0.3],
            [-490, -150, 1.1],
            [860,  -100, 0.8]
        ];

        var woodMat = makeWoodMat();
        var boatMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var boatInteriorMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        for (var j = 0; j < jettyData.length; j++) {
            var jd = jettyData[j];
            var jx = jd[0];
            var jz = jd[1];
            var rot = jd[2];

            // Jetty deck
            var deckGeo = new THREE.BoxGeometry(4, 0.4, 16);
            var deckMesh = new THREE.Mesh(deckGeo, woodMat);
            deckMesh.rotation.y = rot;
            deckMesh.position.set(OX + jx, OY + 0.6, OZ + jz);
            addMesh(deckMesh);

            // Jetty support posts
            var postOffsets = [[-1.5, -6], [1.5, -6], [-1.5, 0], [1.5, 0], [-1.5, 6], [1.5, 6]];
            for (var p = 0; p < postOffsets.length; p++) {
                var postGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 5);
                var postMesh = new THREE.Mesh(postGeo, woodMat);
                var px = jx + postOffsets[p][0] * Math.cos(rot) - postOffsets[p][1] * Math.sin(rot);
                var pz = jz + postOffsets[p][0] * Math.sin(rot) + postOffsets[p][1] * Math.cos(rot);
                postMesh.position.set(OX + px, OY + 0.05, OZ + pz);
                addMesh(postMesh);
            }

            // Moored boat (simple hull shape)
            var hullGeo = new THREE.BoxGeometry(2.5, 1, 5);
            var hullMesh = new THREE.Mesh(hullGeo, boatMat);
            hullMesh.rotation.y = rot;
            var bxPos = jx + 5 * Math.sin(rot + Math.PI * 0.5);
            var bzPos = jz + 5 * Math.cos(rot + Math.PI * 0.5);
            hullMesh.position.set(OX + bxPos, OY + 0.7, OZ + bzPos);
            addMesh(hullMesh);

            // Boat interior
            var interiorGeo = new THREE.BoxGeometry(1.8, 0.5, 3.5);
            var interiorMesh = new THREE.Mesh(interiorGeo, boatInteriorMat);
            interiorMesh.rotation.y = rot;
            interiorMesh.position.set(OX + bxPos, OY + 1.45, OZ + bzPos);
            addMesh(interiorMesh);

            // Fishing rods (thin cylinders leaning out)
            var rodGeo = new THREE.CylinderGeometry(0.05, 0.05, 5, 4);
            var rodMesh = new THREE.Mesh(rodGeo, woodMat);
            rodMesh.rotation.z = 0.4;
            rodMesh.position.set(OX + jx + 2, OY + 2.5, OZ + jz + 2);
            addMesh(rodMesh);
        }
    }

    // ---------------------------------------------------------------
    // RIVER ERNE SOURCE — small outflow heading south from a lake
    // ---------------------------------------------------------------
    function buildRiverErneSource() {
        var rx = -220;
        var rz = 50;

        // Source pool
        var sourceGeo = new THREE.BoxGeometry(20, 1.2, 20);
        var sourceMesh = new THREE.Mesh(sourceGeo, makeLakeMat());
        sourceMesh.position.set(OX + rx, OY + 0.3, OZ + rz);
        addMesh(sourceMesh);

        // River channel segments heading south (positive Z)
        var channelSegments = [
            [rx,        rz + 30,  6, 30],
            [rx - 5,    rz + 65,  6, 30],
            [rx - 12,   rz + 100, 6, 30],
            [rx - 20,   rz + 135, 5, 28],
            [rx - 25,   rz + 168, 5, 28],
            [rx - 30,   rz + 200, 5, 26]
        ];

        var riverMat = makeLakeMat();
        for (var i = 0; i < channelSegments.length; i++) {
            var cs = channelSegments[i];
            var cGeo = new THREE.BoxGeometry(cs[2], 0.8, cs[3]);
            var cMesh = new THREE.Mesh(cGeo, riverMat);
            cMesh.position.set(OX + cs[0], OY + 0.2, OZ + cs[1]);
            addMesh(cMesh);
        }

        // Reeds / bankside vegetation along the river
        var reedMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
        var reedPositions = [
            [rx + 5, rz + 28], [rx - 5, rz + 32],
            [rx + 4, rz + 58], [rx - 9, rz + 70],
            [rx - 8, rz + 95], [rx - 16, rz + 105]
        ];

        for (var r = 0; r < reedPositions.length; r++) {
            var rrGeo = new THREE.CylinderGeometry(0.15, 0.2, 2.5, 4);
            var rrMesh = new THREE.Mesh(rrGeo, reedMat);
            rrMesh.position.set(OX + reedPositions[r][0], OY + 1.25, OZ + reedPositions[r][1]);
            addMesh(rrMesh);
        }
    }

    // ---------------------------------------------------------------
    // UPDATE / RESET
    // ---------------------------------------------------------------
    function update(delta) {
        // Static environment — no animation required
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
