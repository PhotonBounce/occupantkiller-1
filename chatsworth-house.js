window.ChatsworthHouse = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 21280;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildMainBlock();
        buildWestWing();
        buildEastWing();
        buildRoofParapet();
        buildCentralPediment();
        buildPedimentSculptures();
        buildSouthColonnade();
        buildChimneys();
        buildEmperorFountain();
        buildCanalPond();
        buildCascade();
        buildParklandTrees();
        buildRiverDerwent();
        buildDerwentBridge();
        buildHuntingTower();
        buildEdensorVillage();
        buildGlassConservatory();
        buildPeakDistrictHills();
        buildStables();
        buildGardenWalls();
        buildStatues();
        buildGravelPaths();
        buildHa();
    }

    function buildGround() {
        // Large estate ground — broken into box slabs to avoid PlaneGeometry
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x4a7c3f });
        var groundGeo = new THREE.BoxGeometry(2400, 2, 2400);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(OX, OY - 1, OZ);
        scene.add(ground);
        objects.push(ground);

        // Formal parterre garden south of house — lighter grass
        var partMat = new THREE.MeshLambertMaterial({ color: 0x5a9a4f });
        var partGeo = new THREE.BoxGeometry(300, 1, 200);
        var part = new THREE.Mesh(partGeo, partMat);
        part.position.set(OX, OY + 0.5, OZ + 180);
        scene.add(part);
        objects.push(part);

        // Kitchen garden
        var kitchenGardenGeo = new THREE.BoxGeometry(120, 1, 120);
        var kitchenGarden = new THREE.Mesh(kitchenGardenGeo, new THREE.MeshLambertMaterial({ color: 0x6aab52 }));
        kitchenGarden.position.set(OX - 280, OY + 0.5, OZ - 40);
        scene.add(kitchenGarden);
        objects.push(kitchenGarden);
    }

    function buildMainBlock() {
        // Main house facade — Baroque English country house — 0xD4C9B0
        var stoneColor = 0xD4C9B0;

        // Main body
        var bodyGeo = new THREE.BoxGeometry(200, 40, 60);
        makeMesh(bodyGeo, stoneColor, 0, 20, 0);

        // Upper storey / attic storey
        var upperGeo = new THREE.BoxGeometry(196, 12, 58);
        makeMesh(upperGeo, stoneColor, 0, 46, 0);

        // Rusticated ground floor base
        var baseGeo = new THREE.BoxGeometry(204, 8, 62);
        makeMesh(baseGeo, 0xBFB49A, 0, 4, 0);

        // Central pavilion projection (south front)
        var centreGeo = new THREE.BoxGeometry(60, 44, 8);
        makeMesh(centreGeo, stoneColor, 0, 22, 34);

        // North front central pavilion
        var centreNorthGeo = new THREE.BoxGeometry(60, 44, 8);
        makeMesh(centreNorthGeo, stoneColor, 0, 22, -34);

        // Corner quoins — four corners
        var quoinColor = 0xC8BC9F;
        makeMesh(new THREE.BoxGeometry(8, 44, 62), quoinColor, -96, 22, 0);
        makeMesh(new THREE.BoxGeometry(8, 44, 62), quoinColor, 96, 22, 0);

        // String course between floors
        makeMesh(new THREE.BoxGeometry(202, 3, 62), 0xBFB49A, 0, 21, 0);

        // Window surrounds south front — row of 9 windows across facade
        var windowColor = 0x8899AA;
        var windowFrameColor = 0xD4C9B0;
        for (var w = -4; w <= 4; w++) {
            // ground floor windows
            makeMesh(new THREE.BoxGeometry(10, 12, 2), windowColor, w * 22, 12, 31);
            makeMesh(new THREE.BoxGeometry(12, 14, 1), windowFrameColor, w * 22, 12, 31.5);
            // first floor windows
            makeMesh(new THREE.BoxGeometry(10, 14, 2), windowColor, w * 22, 32, 31);
            makeMesh(new THREE.BoxGeometry(12, 16, 1), windowFrameColor, w * 22, 32, 31.5);
        }
    }

    function buildRoofParapet() {
        var stoneColor = 0xD4C9B0;
        // Balustraded parapet along roofline
        var parapetGeo = new THREE.BoxGeometry(204, 6, 4);
        // South parapet
        makeMesh(parapetGeo, stoneColor, 0, 58, 30);
        // North parapet
        makeMesh(parapetGeo, stoneColor, 0, 58, -30);
        // East parapet
        makeMesh(new THREE.BoxGeometry(4, 6, 64), stoneColor, 100, 58, 0);
        // West parapet
        makeMesh(new THREE.BoxGeometry(4, 6, 64), stoneColor, -100, 58, 0);

        // Balustrade posts along south parapet
        for (var b = -9; b <= 9; b++) {
            makeMesh(new THREE.BoxGeometry(2, 8, 2), 0xC8BC9F, b * 11, 60, 30);
        }
        // Balustrade posts north
        for (var bn = -9; bn <= 9; bn++) {
            makeMesh(new THREE.BoxGeometry(2, 8, 2), 0xC8BC9F, bn * 11, 60, -30);
        }
    }

    function buildCentralPediment() {
        // Triangular central pediment over south front
        // Built from stacked boxes narrowing upward (triangular approximation)
        var stoneColor = 0xD4C9B0;
        makeMesh(new THREE.BoxGeometry(58, 4, 6), stoneColor, 0, 58, 34);
        makeMesh(new THREE.BoxGeometry(46, 4, 6), stoneColor, 0, 62, 34);
        makeMesh(new THREE.BoxGeometry(34, 4, 6), stoneColor, 0, 66, 34);
        makeMesh(new THREE.BoxGeometry(22, 4, 6), stoneColor, 0, 70, 34);
        makeMesh(new THREE.BoxGeometry(10, 4, 6), stoneColor, 0, 74, 34);
        // Pediment cap
        makeMesh(new THREE.BoxGeometry(4, 3, 6), stoneColor, 0, 77, 34);
    }

    function buildPedimentSculptures() {
        // Stone sculptures in tympanum of pediment
        makeMesh(new THREE.SphereGeometry(3, 6, 4), 0xC8BC9F, 0, 66, 37);
        makeMesh(new THREE.SphereGeometry(2, 6, 4), 0xC8BC9F, -8, 63, 37);
        makeMesh(new THREE.SphereGeometry(2, 6, 4), 0xC8BC9F, 8, 63, 37);
        // Rooftop urns and statues on parapet
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 5, 6), 0xC8BC9F, -80, 62, 30);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 5, 6), 0xC8BC9F, -40, 62, 30);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 5, 6), 0xC8BC9F, 0, 62, 30);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 5, 6), 0xC8BC9F, 40, 62, 30);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 5, 6), 0xC8BC9F, 80, 62, 30);
    }

    function buildSouthColonnade() {
        // South front colonnade — row of columns
        var columnColor = 0xD4C9B0;
        for (var c = -3; c <= 3; c++) {
            makeMesh(new THREE.CylinderGeometry(2, 2.5, 20, 8), columnColor, c * 18, 10, 38);
            // Column capital
            makeMesh(new THREE.BoxGeometry(6, 3, 6), columnColor, c * 18, 21, 38);
            // Column base
            makeMesh(new THREE.BoxGeometry(6, 2, 6), columnColor, c * 18, 1, 38);
        }
        // Colonnade entablature
        makeMesh(new THREE.BoxGeometry(120, 5, 8), columnColor, 0, 24, 38);
        // Colonnade roof slab
        makeMesh(new THREE.BoxGeometry(124, 2, 10), columnColor, 0, 27, 38);
    }

    function buildChimneys() {
        var chimneyColor = 0xBFB49A;
        // Pairs of chimneys across the roofline
        for (var ch = -4; ch <= 4; ch += 2) {
            makeMesh(new THREE.BoxGeometry(6, 12, 6), chimneyColor, ch * 22, 65, 0);
            makeMesh(new THREE.CylinderGeometry(2, 2.5, 4, 6), chimneyColor, ch * 22, 75, 0);
        }
    }

    function buildWestWing() {
        var stoneColor = 0xD4C9B0;
        // West wing — long service wing with kitchen court
        makeMesh(new THREE.BoxGeometry(100, 30, 50), stoneColor, -155, 15, -20);
        // Parapet
        makeMesh(new THREE.BoxGeometry(102, 4, 4), stoneColor, -155, 32, -44);
        // Kitchen court inner wall
        makeMesh(new THREE.BoxGeometry(80, 20, 30), 0xC8BC9F, -210, 10, -10);
        // Archway gateway to kitchen court
        makeMesh(new THREE.BoxGeometry(10, 20, 4), stoneColor, -172, 10, -44);
        makeMesh(new THREE.BoxGeometry(20, 6, 4), stoneColor, -172, 22, -44);
        // Windows on west wing
        for (var ww = 0; ww < 4; ww++) {
            makeMesh(new THREE.BoxGeometry(8, 10, 2), 0x8899AA, -115 - ww * 22, 18, -43);
        }
    }

    function buildEastWing() {
        var stoneColor = 0xD4C9B0;
        // East wing — matching wing east side
        makeMesh(new THREE.BoxGeometry(80, 28, 46), stoneColor, 145, 14, -15);
        makeMesh(new THREE.BoxGeometry(82, 4, 4), stoneColor, 145, 30, -37);
        // Orangery / library extension
        makeMesh(new THREE.BoxGeometry(50, 22, 40), stoneColor, 210, 11, 0);
        // Windows east wing
        for (var ew = 0; ew < 3; ew++) {
            makeMesh(new THREE.BoxGeometry(8, 10, 2), 0x8899AA, 115 + ew * 22, 16, -37);
        }
    }

    function buildEmperorFountain() {
        // Emperor Fountain — tallest gravity-fed fountain — in Canal Pond garden
        var fountainColor = 0xA0A0A0;
        // Outer basin rim
        makeMesh(new THREE.CylinderGeometry(22, 24, 3, 12), fountainColor, 0, 1.5, 180);
        // Inner basin
        makeMesh(new THREE.CylinderGeometry(18, 18, 2, 12), 0x006994, 0, 1, 180);
        // Fountain plinth
        makeMesh(new THREE.CylinderGeometry(4, 5, 4, 8), fountainColor, 0, 3, 180);
        // Ornate basin tier
        makeMesh(new THREE.CylinderGeometry(8, 9, 3, 10), fountainColor, 0, 5, 180);
        // Fountain jet — tall thin cylinder (tallest gravity fountain in world — represents ~90m jet)
        makeMesh(new THREE.CylinderGeometry(0.8, 1.2, 80, 6), 0xAADDFF, 0, 48, 180);
        // Upper jet taper
        makeMesh(new THREE.CylinderGeometry(0.2, 0.8, 20, 6), 0xCCEEFF, 0, 98, 180);
        // Spray crown at top
        makeMesh(new THREE.SphereGeometry(3, 6, 4), 0xDDEEFF, 0, 109, 180);
    }

    function buildCanalPond() {
        // Long formal reflecting canal — canal pond in gardens
        // Broken into sections (no PlaneGeometry)
        makeMesh(new THREE.BoxGeometry(40, 1, 300), 0x006994, -80, 0.5, 80);
        // Canal bank edges
        makeMesh(new THREE.BoxGeometry(44, 3, 302), 0x8B8070, -80, -0.5, 80);
        // Decorative end pool
        makeMesh(new THREE.CylinderGeometry(18, 18, 1, 10), 0x006994, -80, 0.8, -75);
        makeMesh(new THREE.CylinderGeometry(18, 18, 1, 10), 0x006994, -80, 0.8, 235);
    }

    function buildCascade() {
        // Stepped cascade descending hillside — stacked box steps
        var cascadeColor = 0x8899AA;
        var waterColor = 0x5599BB;
        for (var s = 0; s < 18; s++) {
            // Stone step riser
            makeMesh(new THREE.BoxGeometry(30, 3, 4), cascadeColor, 160, s * 5 + 2, -120 + s * 8);
            // Water on step
            makeMesh(new THREE.BoxGeometry(28, 0.5, 7), waterColor, 160, s * 5 + 3.5, -118 + s * 8);
        }
        // Cascade header pool at top
        makeMesh(new THREE.BoxGeometry(36, 4, 16), cascadeColor, 160, 93, -12);
        makeMesh(new THREE.BoxGeometry(30, 2, 10), waterColor, 160, 95, -12);
        // Cascade house / temple at top
        makeMesh(new THREE.BoxGeometry(20, 18, 16), 0xD4C9B0, 160, 104, -8);
        makeMesh(new THREE.BoxGeometry(22, 4, 4), 0xD4C9B0, 160, 116, -8);
    }

    function buildParklandTrees() {
        // Capability Brown parkland — clumps of trees, sweeping lawns
        var treeData = [
            [-200, 0, -200], [-220, 0, -160], [-180, 0, -220],
            [200, 0, -250], [220, 0, -230], [240, 0, -260],
            [-300, 0, 100], [-280, 0, 120], [-320, 0, 90],
            [300, 0, 150], [320, 0, 130], [280, 0, 170],
            [-100, 0, -300], [-80, 0, -320], [-120, 0, -280],
            [100, 0, 300], [80, 0, 320], [120, 0, 280],
            [350, 0, -100], [370, 0, -80], [330, 0, -120],
            [-350, 0, -50], [-380, 0, -30], [-330, 0, -70],
            [0, 0, -350], [20, 0, -370], [-20, 0, -360]
        ];
        for (var t = 0; t < treeData.length; t++) {
            var td = treeData[t];
            // Trunk
            makeMesh(new THREE.CylinderGeometry(1.5, 2, 10, 6), 0x5C4033, td[0], 5, td[2]);
            // Canopy
            makeMesh(new THREE.SphereGeometry(12, 6, 5), 0x2E6B2F, td[0], 18, td[2]);
        }
    }

    function buildRiverDerwent() {
        // River Derwent flowing through estate west of house
        makeMesh(new THREE.BoxGeometry(50, 1, 800), 0x006994, -350, 0.5, 0);
        // River banks
        makeMesh(new THREE.BoxGeometry(56, 2, 802), 0x7A6A50, -350, -0.5, 0);
        // Riparian vegetation strips
        makeMesh(new THREE.BoxGeometry(20, 1, 800), 0x3A6030, -328, 1, 0);
        makeMesh(new THREE.BoxGeometry(20, 1, 800), 0x3A6030, -372, 1, 0);
    }

    function buildDerwentBridge() {
        // 3-arch stone bridge over the Derwent
        var bridgeColor = 0x9B8B72;
        // Bridge deck
        makeMesh(new THREE.BoxGeometry(16, 4, 56), bridgeColor, -350, 6, 0);
        // Bridge parapets
        makeMesh(new THREE.BoxGeometry(4, 6, 56), bridgeColor, -358, 10, 0);
        makeMesh(new THREE.BoxGeometry(4, 6, 56), bridgeColor, -342, 10, 0);
        // Three arch piers
        makeMesh(new THREE.BoxGeometry(14, 8, 8), bridgeColor, -350, 2, -18);
        makeMesh(new THREE.BoxGeometry(14, 8, 8), bridgeColor, -350, 2, 0);
        makeMesh(new THREE.BoxGeometry(14, 8, 8), bridgeColor, -350, 2, 18);
        // Arch barrel voids approximated as dark boxes
        makeMesh(new THREE.BoxGeometry(8, 5, 6), 0x333333, -350, 3, -18);
        makeMesh(new THREE.BoxGeometry(8, 5, 6), 0x333333, -350, 3, 0);
        makeMesh(new THREE.BoxGeometry(8, 5, 6), 0x333333, -350, 3, 18);
        // Bridge approach road ramps
        makeMesh(new THREE.BoxGeometry(12, 2, 60), bridgeColor, -310, 2, 0);
        makeMesh(new THREE.BoxGeometry(12, 2, 60), bridgeColor, -390, 2, 0);
    }

    function buildHuntingTower() {
        // Hunting Tower — 16th-century tower on hill in deer park north
        var towerColor = 0x8B7355;
        // Hill mound
        makeMesh(new THREE.CylinderGeometry(40, 60, 25, 8), 0x5C7A45, -60, 12, -350);
        // Tower base
        makeMesh(new THREE.BoxGeometry(18, 50, 18), towerColor, -60, 50, -350);
        // Tower upper section
        makeMesh(new THREE.BoxGeometry(20, 12, 20), towerColor, -60, 81, -350);
        // Tower battlements — four corner turrets
        makeMesh(new THREE.BoxGeometry(5, 10, 5), towerColor, -68, 88, -358);
        makeMesh(new THREE.BoxGeometry(5, 10, 5), towerColor, -52, 88, -358);
        makeMesh(new THREE.BoxGeometry(5, 10, 5), towerColor, -68, 88, -342);
        makeMesh(new THREE.BoxGeometry(5, 10, 5), towerColor, -52, 88, -342);
        // Tower windows
        makeMesh(new THREE.BoxGeometry(3, 6, 1), 0x333344, -60, 55, -340);
        makeMesh(new THREE.BoxGeometry(3, 6, 1), 0x333344, -60, 68, -340);
        makeMesh(new THREE.BoxGeometry(1, 6, 3), 0x333344, -69, 60, -350);
        // Flag mast on top
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 12, 4), 0x5C4033, -60, 99, -350);
        makeMesh(new THREE.BoxGeometry(5, 3, 0.5), 0xCC2222, -57, 102, -350);
    }

    function buildEdensorVillage() {
        // Edensor — model village west of house with varied architectural styles
        var villageColor = 0xF5F0E8;
        // Village church spire
        makeMesh(new THREE.BoxGeometry(12, 20, 12), villageColor, -450, 10, -80);
        makeMesh(new THREE.ConeGeometry(8, 30, 4), 0xBBBBBB, -450, 35, -80);
        // Church porch
        makeMesh(new THREE.BoxGeometry(8, 10, 6), villageColor, -450, 5, -68);
        // Varied cottages — different heights and styles
        makeMesh(new THREE.BoxGeometry(14, 10, 12), villageColor, -440, 5, -60);
        makeMesh(new THREE.BoxGeometry(12, 14, 10), 0xE8E0D0, -460, 7, -55);
        makeMesh(new THREE.BoxGeometry(16, 8, 14), villageColor, -430, 4, -70);
        makeMesh(new THREE.BoxGeometry(10, 12, 10), 0xDDD8CC, -465, 6, -70);
        makeMesh(new THREE.BoxGeometry(14, 10, 12), villageColor, -445, 5, -90);
        makeMesh(new THREE.BoxGeometry(12, 8, 10), 0xE8E0D0, -460, 4, -90);
        // Italian-style villa (Edensor has varied styles)
        makeMesh(new THREE.BoxGeometry(16, 16, 14), 0xEEE8D8, -435, 8, -100);
        makeMesh(new THREE.BoxGeometry(18, 4, 16), 0xDDDDCC, -435, 18, -100);
        // Tudor cottage
        makeMesh(new THREE.BoxGeometry(14, 12, 12), 0xF0EAD8, -470, 6, -100);
        // Village green
        makeMesh(new THREE.BoxGeometry(60, 1, 50), 0x5a9a4f, -450, 0.5, -80);
        // Village walls and hedges
        makeMesh(new THREE.BoxGeometry(80, 4, 2), 0xC8C0B0, -450, 2, -115);
        // Roof details — pitched roofs as triangular box approximations
        makeMesh(new THREE.BoxGeometry(15, 5, 13), 0x888880, -440, 12, -60);
        makeMesh(new THREE.BoxGeometry(13, 6, 11), 0x999990, -460, 14, -55);
    }

    function buildGlassConservatory() {
        // Large Victorian glasshouse — glass walls = light blue boxes
        var glassColor = 0x88AACC;
        var frameColor = 0x5C7A55;
        // Main glasshouse body
        makeMesh(new THREE.BoxGeometry(60, 20, 40), glassColor, 130, 10, 60);
        // Iron frame columns inside
        for (var gc = -2; gc <= 2; gc++) {
            makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 5), frameColor, 130 + gc * 12, 10, 60);
        }
        // Curved roof ridge — approximated with stacked boxes
        makeMesh(new THREE.BoxGeometry(62, 4, 42), 0x99BBDD, 130, 22, 60);
        makeMesh(new THREE.BoxGeometry(50, 6, 30), 0x88AACC, 130, 24, 60);
        makeMesh(new THREE.BoxGeometry(38, 6, 18), 0x99BBDD, 130, 28, 60);
        makeMesh(new THREE.BoxGeometry(24, 4, 8), 0x88AACC, 130, 31, 60);
        // Entrance vestibule
        makeMesh(new THREE.BoxGeometry(16, 18, 12), glassColor, 130, 9, 82);
        makeMesh(new THREE.BoxGeometry(16, 4, 13), 0x99BBDD, 130, 20, 82);
        // Decorative finial on roof ridge
        makeMesh(new THREE.CylinderGeometry(1, 2, 6, 6), frameColor, 130, 35, 60);
        makeMesh(new THREE.SphereGeometry(2, 6, 4), 0xCCCC88, 130, 39, 60);
    }

    function buildPeakDistrictHills() {
        // Eastern Moors / Peak District hills behind the estate
        var moorColor = 0x8B8B8B;
        var heatherColor = 0x7B6B8B;
        // Main hill ridge running north-south behind estate
        makeMesh(new THREE.BoxGeometry(600, 80, 120), moorColor, 500, 40, 0);
        // Secondary peaks
        makeMesh(new THREE.CylinderGeometry(60, 90, 100, 6), moorColor, 480, 50, -150);
        makeMesh(new THREE.CylinderGeometry(50, 80, 90, 6), moorColor, 500, 45, 150);
        makeMesh(new THREE.CylinderGeometry(40, 70, 80, 6), moorColor, 540, 40, 0);
        // Heather moorland colour strip
        makeMesh(new THREE.BoxGeometry(580, 5, 60), heatherColor, 500, 81, 0);
        // Rocky outcrops / edges
        makeMesh(new THREE.BoxGeometry(30, 20, 15), 0x777777, 460, 88, -80);
        makeMesh(new THREE.BoxGeometry(25, 16, 12), 0x777777, 460, 86, 80);
        // Gritstone edge
        makeMesh(new THREE.BoxGeometry(400, 15, 10), 0x6B6B6B, 500, 88, -65);
    }

    function buildStables() {
        // Stables — connected to west wing
        var stableColor = 0xC8BC9F;
        makeMesh(new THREE.BoxGeometry(80, 22, 60), stableColor, -260, 11, -10);
        // Stable yard central cupola
        makeMesh(new THREE.CylinderGeometry(4, 4, 16, 8), stableColor, -260, 30, -10);
        makeMesh(new THREE.ConeGeometry(5, 8, 8), 0x886644, -260, 44, -10);
        // Stable arch gateway
        makeMesh(new THREE.BoxGeometry(14, 18, 4), stableColor, -220, 9, -10);
        makeMesh(new THREE.BoxGeometry(14, 6, 4), stableColor, -220, 20, -10);
        // Stable windows
        for (var sw = 0; sw < 3; sw++) {
            makeMesh(new THREE.BoxGeometry(6, 8, 2), 0x8899AA, -240 - sw * 14, 12, -39);
        }
    }

    function buildGardenWalls() {
        // Garden walls enclosing formal gardens
        var wallColor = 0xC0B090;
        // South forecourt wall
        makeMesh(new THREE.BoxGeometry(250, 6, 4), wallColor, 0, 3, 280);
        // East garden wall
        makeMesh(new THREE.BoxGeometry(4, 6, 200), wallColor, 125, 3, 180);
        // West garden wall
        makeMesh(new THREE.BoxGeometry(4, 6, 200), wallColor, -125, 3, 180);
        // Garden gate posts
        makeMesh(new THREE.BoxGeometry(6, 10, 6), wallColor, -20, 5, 280);
        makeMesh(new THREE.BoxGeometry(6, 10, 6), wallColor, 20, 5, 280);
        // Ha-ha retaining wall (sunken wall)
        makeMesh(new THREE.BoxGeometry(400, 5, 3), 0x9B8B72, 0, -2, 350);
    }

    function buildStatues() {
        // Garden statues and urns on terraces
        var statueColor = 0xC8C0B0;
        // Terrace urns
        var urnPositions = [
            [-90, 1, 95], [-60, 1, 95], [-30, 1, 95],
            [30, 1, 95], [60, 1, 95], [90, 1, 95]
        ];
        for (var u = 0; u < urnPositions.length; u++) {
            var up = urnPositions[u];
            makeMesh(new THREE.CylinderGeometry(2, 3, 5, 8), statueColor, up[0], up[1] + 2, up[2]);
            makeMesh(new THREE.SphereGeometry(2.5, 6, 4), statueColor, up[0], up[1] + 7, up[2]);
        }
        // Larger fountain statue south garden
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 10, 6), statueColor, -80, 5, 120);
        makeMesh(new THREE.SphereGeometry(3, 6, 4), statueColor, -80, 12, 120);
        // Neptune statue by canal
        makeMesh(new THREE.CylinderGeometry(2, 2.5, 12, 6), statueColor, -80, 6, 0);
        makeMesh(new THREE.BoxGeometry(4, 8, 3), statueColor, -80, 16, 0);
    }

    function buildGravelPaths() {
        // Gravel paths through formal gardens
        var gravelColor = 0xD4C4A0;
        // Main south axis path
        makeMesh(new THREE.BoxGeometry(16, 1, 280), gravelColor, 0, 0.5, 180);
        // Cross path east-west
        makeMesh(new THREE.BoxGeometry(300, 1, 16), gravelColor, 0, 0.5, 90);
        // Path to cascade
        makeMesh(new THREE.BoxGeometry(16, 1, 200), gravelColor, 160, 0.5, -90);
        // Path to hunting tower
        makeMesh(new THREE.BoxGeometry(16, 1, 200), gravelColor, -60, 0.5, -240);
        // Path to conservatory
        makeMesh(new THREE.BoxGeometry(150, 1, 12), gravelColor, 60, 0.5, 60);
    }

    function buildHa() {
        // Deer park fence line (pale fence posts)
        var fenceColor = 0x8B7355;
        for (var f = -10; f <= 10; f++) {
            makeMesh(new THREE.BoxGeometry(1.5, 8, 1.5), fenceColor, f * 40, 4, 400);
            makeMesh(new THREE.BoxGeometry(38, 1, 1), fenceColor, f * 40 + 19, 7, 400);
        }
        // Deer park gate piers
        makeMesh(new THREE.BoxGeometry(5, 14, 5), 0xD4C9B0, -20, 7, 400);
        makeMesh(new THREE.BoxGeometry(5, 14, 5), 0xD4C9B0, 20, 7, 400);
        makeMesh(new THREE.SphereGeometry(3.5, 6, 4), 0xD4C9B0, -20, 16, 400);
        makeMesh(new THREE.SphereGeometry(3.5, 6, 4), 0xD4C9B0, 20, 16, 400);
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
