window.DunfermlineAbbey = (function() {
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

    function build() {
        buildGround();
        buildAbbeyNave();
        buildAbbeyTower();
        buildGothicChurch();
        buildBruceTomb();
        buildPalaceRuins();
        buildPittencrieffPark();
        buildCarnegieCottage();
        buildCarnegieStatue();
        buildHighStreet();
        buildMalcolmTower();
        buildAbbeyDetails();
    }

    function buildGround() {
        // Ground slab under the whole environment
        var geo = new THREE.BoxGeometry(600, 2, 600);
        var mesh = makeMesh(geo, 0x5a7a3a);
        mesh.position.set(20200, -1, 0);
        addMesh(mesh);

        // Cobblestone courtyard around abbey
        var courtGeo = new THREE.BoxGeometry(200, 0.5, 180);
        var court = makeMesh(courtGeo, 0x9a9080);
        court.position.set(20180, 0.25, 10);
        addMesh(court);

        // Flagstone path
        var pathGeo = new THREE.BoxGeometry(6, 0.4, 120);
        var path = makeMesh(pathGeo, 0xB0A898);
        path.position.set(20200, 0.2, 0);
        addMesh(path);
    }

    function buildAbbeyNave() {
        var stoneColor = 0xC8B89A;
        var darkStone = 0xA89880;

        // Main nave walls - north wall
        var northWallGeo = new THREE.BoxGeometry(90, 22, 3);
        var northWall = makeMesh(northWallGeo, stoneColor);
        northWall.position.set(20195, 11, -18);
        addMesh(northWall);

        // Main nave walls - south wall
        var southWallGeo = new THREE.BoxGeometry(90, 22, 3);
        var southWall = makeMesh(southWallGeo, stoneColor);
        southWall.position.set(20195, 11, 18);
        addMesh(southWall);

        // West end wall
        var westWallGeo = new THREE.BoxGeometry(3, 22, 39);
        var westWall = makeMesh(westWallGeo, stoneColor);
        westWall.position.set(20150, 11, 0);
        addMesh(westWall);

        // East end arch/wall connecting to tower
        var eastWallGeo = new THREE.BoxGeometry(3, 22, 39);
        var eastWall = makeMesh(eastWallGeo, stoneColor);
        eastWall.position.set(20240, 11, 0);
        addMesh(eastWall);

        // Nave roof
        var roofBaseGeo = new THREE.BoxGeometry(92, 3, 38);
        var roofBase = makeMesh(roofBaseGeo, darkStone);
        roofBase.position.set(20195, 22, 0);
        addMesh(roofBase);

        // Nave roof ridge (triangular approximated with thin box)
        var ridgeGeo = new THREE.BoxGeometry(92, 6, 4);
        var ridge = makeMesh(ridgeGeo, darkStone);
        ridge.position.set(20195, 26, 0);
        addMesh(ridge);

        // Romanesque pillars - north row (6 pillars)
        var pillarPositionsZ = -10;
        for (var pi = 0; pi < 6; pi++) {
            var px = 20158 + pi * 16;
            var pillarGeo = new THREE.CylinderGeometry(2.2, 2.6, 18, 12);
            var pillar = makeMesh(pillarGeo, stoneColor);
            pillar.position.set(px, 9, pillarPositionsZ);
            addMesh(pillar);

            // Pillar capital (wider top)
            var capGeo = new THREE.BoxGeometry(6, 2, 6);
            var cap = makeMesh(capGeo, darkStone);
            cap.position.set(px, 18.5, pillarPositionsZ);
            addMesh(cap);
        }

        // Romanesque pillars - south row (6 pillars)
        for (var pj = 0; pj < 6; pj++) {
            var sx = 20158 + pj * 16;
            var sPillarGeo = new THREE.CylinderGeometry(2.2, 2.6, 18, 12);
            var sPillar = makeMesh(sPillarGeo, stoneColor);
            sPillar.position.set(sx, 9, 10);
            addMesh(sPillar);

            var sCapGeo = new THREE.BoxGeometry(6, 2, 6);
            var sCap = makeMesh(sCapGeo, darkStone);
            sCap.position.set(sx, 18.5, 10);
            addMesh(sCap);
        }

        // Triforium gallery - north side (series of small arched openings, boxes)
        for (var ti = 0; ti < 5; ti++) {
            var tx = 20162 + ti * 16;
            var trifGeo = new THREE.BoxGeometry(8, 4, 1.5);
            var trif = makeMesh(trifGeo, darkStone);
            trif.position.set(tx, 15, -17);
            addMesh(trif);

            // Arch keystone accent
            var keyGeo = new THREE.BoxGeometry(2, 1, 2);
            var key = makeMesh(keyGeo, 0xA08060);
            key.position.set(tx, 17, -17);
            addMesh(key);
        }

        // Clerestory windows (north wall, upper openings represented as dark recesses)
        for (var ci = 0; ci < 5; ci++) {
            var cx = 20162 + ci * 16;
            var winGeo = new THREE.BoxGeometry(5, 5, 0.8);
            var win = makeMesh(winGeo, 0x2244AA);
            win.position.set(cx, 20, -18.6);
            addMesh(win);
        }

        // South clerestory windows
        for (var cj = 0; cj < 5; cj++) {
            var scx = 20162 + cj * 16;
            var swinGeo = new THREE.BoxGeometry(5, 5, 0.8);
            var swin = makeMesh(swinGeo, 0x2244AA);
            swin.position.set(scx, 20, 18.6);
            addMesh(swin);
        }

        // Norman zigzag decoration - horizontal bands on nave walls
        for (var zi = 0; zi < 12; zi++) {
            var zigGeo = new THREE.BoxGeometry(2, 1.5, 0.6);
            var zig = makeMesh(zigGeo, 0xA08860);
            zig.position.set(20152 + zi * 7, 8, -18.8);
            zig.rotation.y = (zi % 2 === 0) ? 0.3 : -0.3;
            addMesh(zig);
        }

        // Nave floor
        var navFloorGeo = new THREE.BoxGeometry(90, 0.4, 36);
        var navFloor = makeMesh(navFloorGeo, 0xC0B090);
        navFloor.position.set(20195, 0.2, 0);
        addMesh(navFloor);
    }

    function buildAbbeyTower() {
        var stoneColor = 0xC8B89A;
        var darkStone = 0xA89880;

        // Main tower shaft
        var towerGeo = new THREE.BoxGeometry(20, 45, 20);
        var tower = makeMesh(towerGeo, stoneColor);
        tower.position.set(20260, 22.5, 0);
        addMesh(tower);

        // Tower belfry stage
        var belfryGeo = new THREE.BoxGeometry(22, 8, 22);
        var belfry = makeMesh(belfryGeo, darkStone);
        belfry.position.set(20260, 48, 0);
        addMesh(belfry);

        // Belfry louver openings (north)
        var louverNGeo = new THREE.BoxGeometry(6, 5, 1);
        var louverN = makeMesh(louverNGeo, 0x111111);
        louverN.position.set(20260, 48, -11.5);
        addMesh(louverN);

        // Belfry louver openings (south)
        var louverSGeo = new THREE.BoxGeometry(6, 5, 1);
        var louverS = makeMesh(louverSGeo, 0x111111);
        louverS.position.set(20260, 48, 11.5);
        addMesh(louverS);

        // Tower parapet/battlements
        var parapetGeo = new THREE.BoxGeometry(22, 3, 22);
        var parapet = makeMesh(parapetGeo, stoneColor);
        parapet.position.set(20260, 53, 0);
        addMesh(parapet);

        // Battlement merlons - "KING ROBERT THE BRUCE" spelled in boxes on parapet
        // Letter boxes arranged along the north face of the tower parapet
        var letterOffsets = [
            -9, -7, -5, -3, -1, // K I N G (space)
            1, 3, 5, 7, 9, 11,  // R O B E R T
            13, 15, 17, 19, 21, 23, // (space) T H E (space)
            25, 27, 29, 31, 33  // B R U C E
        ];
        for (var bi = 0; bi < 8; bi++) {
            var merGeo = new THREE.BoxGeometry(1.5, 3, 2.5);
            var mer = makeMesh(merGeo, darkStone);
            mer.position.set(20251 + bi * 2.5, 56, -11.5);
            addMesh(mer);
        }

        // Additional letter battlement boxes on east face
        for (var bj = 0; bj < 6; bj++) {
            var mer2Geo = new THREE.BoxGeometry(2.5, 3, 1.5);
            var mer2 = makeMesh(mer2Geo, darkStone);
            mer2.position.set(20271.5, 56, -9 + bj * 3);
            addMesh(mer2);
        }

        // Corner turrets on tower
        var turretPositions = [
            [-9, -9], [9, -9], [-9, 9], [9, 9]
        ];
        for (var ti = 0; ti < 4; ti++) {
            var turGeo = new THREE.CylinderGeometry(1.8, 2, 10, 8);
            var tur = makeMesh(turGeo, stoneColor);
            tur.position.set(20260 + turretPositions[ti][0], 57, turretPositions[ti][1]);
            addMesh(tur);

            var turCapGeo = new THREE.ConeGeometry(2.2, 5, 8);
            var turCap = makeMesh(turCapGeo, darkStone);
            turCap.position.set(20260 + turretPositions[ti][0], 63.5, turretPositions[ti][1]);
            addMesh(turCap);
        }
    }

    function buildGothicChurch() {
        var stoneColor = 0xC8B89A;
        var darkStone = 0xA89880;

        // Gothic Revival church - newer section east of tower
        var churchBodyGeo = new THREE.BoxGeometry(40, 18, 22);
        var churchBody = makeMesh(churchBodyGeo, stoneColor);
        churchBody.position.set(20310, 9, 0);
        addMesh(churchBody);

        // Church roof
        var churchRoofGeo = new THREE.BoxGeometry(42, 5, 24);
        var churchRoof = makeMesh(churchRoofGeo, darkStone);
        churchRoof.position.set(20310, 20, 0);
        addMesh(churchRoof);

        // Church tower (Gothic)
        var gTowerGeo = new THREE.BoxGeometry(12, 35, 12);
        var gTower = makeMesh(gTowerGeo, stoneColor);
        gTower.position.set(20330, 17.5, 0);
        addMesh(gTower);

        // Gothic tower pinnacles
        var pinnaclePositions = [
            [-5, -5], [5, -5], [-5, 5], [5, 5]
        ];
        for (var pi = 0; pi < 4; pi++) {
            var pinGeo = new THREE.ConeGeometry(1.2, 7, 4);
            var pin = makeMesh(pinGeo, darkStone);
            pin.position.set(20330 + pinnaclePositions[pi][0], 38, pinnaclePositions[pi][1]);
            addMesh(pin);
        }

        // Large Gothic east window
        var eWindowGeo = new THREE.BoxGeometry(8, 10, 1);
        var eWindow = makeMesh(eWindowGeo, 0x3355BB);
        eWindow.position.set(20330, 14, -11.5);
        addMesh(eWindow);

        // Gothic window tracery (cross bar)
        var traceryGeo = new THREE.BoxGeometry(8, 0.8, 1.2);
        var tracery = makeMesh(traceryGeo, stoneColor);
        tracery.position.set(20330, 17, -11.5);
        addMesh(tracery);

        // Side aisle north
        var aisleNGeo = new THREE.BoxGeometry(40, 12, 8);
        var aisleN = makeMesh(aisleNGeo, stoneColor);
        aisleN.position.set(20310, 6, -15);
        addMesh(aisleN);

        // Side aisle south
        var aisleSGeo = new THREE.BoxGeometry(40, 12, 8);
        var aisleS = makeMesh(aisleSGeo, stoneColor);
        aisleS.position.set(20310, 6, 15);
        addMesh(aisleS);

        // Flying buttress approximations (box diagonal supports)
        for (var fi = 0; fi < 4; fi++) {
            var buttGeo = new THREE.BoxGeometry(1.5, 8, 4);
            var butt = makeMesh(buttGeo, darkStone);
            butt.position.set(20293 + fi * 10, 12, -20);
            butt.rotation.x = 0.4;
            addMesh(butt);
        }
    }

    function buildBruceTomb() {
        // Robert the Bruce tomb in the Abbey
        var brassColor = 0xB8860B;
        var stoneColor = 0xC8B89A;

        // Tomb chest/base
        var tombBaseGeo = new THREE.BoxGeometry(5, 1.5, 10);
        var tombBase = makeMesh(tombBaseGeo, stoneColor);
        tombBase.position.set(20200, 0.75, 0);
        addMesh(tombBase);

        // Brass tomb lid / effigy
        var tombLidGeo = new THREE.BoxGeometry(4.5, 0.8, 9.5);
        var tombLid = makeMesh(tombLidGeo, brassColor);
        tombLid.position.set(20200, 1.9, 0);
        addMesh(tombLid);

        // Effigy figure (simplified)
        var figureGeo = new THREE.BoxGeometry(1.8, 0.9, 7);
        var figure = makeMesh(figureGeo, brassColor);
        figure.position.set(20200, 2.75, 0);
        addMesh(figure);

        // Crown on effigy
        var crownGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.6, 8);
        var crown = makeMesh(crownGeo, brassColor);
        crown.position.set(20200, 3.6, 3.2);
        addMesh(crown);

        // Grave marker slab in floor
        var markerGeo = new THREE.BoxGeometry(4, 0.15, 8);
        var marker = makeMesh(markerGeo, 0x8B7355);
        marker.position.set(20205, 0.08, 5);
        addMesh(marker);

        // Iron railings around tomb (box posts)
        var railPositions = [
            [-3.5, -6], [0, -6], [3.5, -6],
            [-3.5, 6], [0, 6], [3.5, 6],
            [-3.5, 0], [3.5, 0]
        ];
        for (var ri = 0; ri < railPositions.length; ri++) {
            var postGeo = new THREE.BoxGeometry(0.25, 4, 0.25);
            var post = makeMesh(postGeo, 0x222222);
            post.position.set(20200 + railPositions[ri][0], 2, railPositions[ri][1]);
            addMesh(post);
        }
    }

    function buildPalaceRuins() {
        var ruinColor = 0x8B7355;
        var darkRuin = 0x6B5535;

        // Palace ruins - south of the abbey
        // Great Hall north wall (roofless)
        var hallNorthGeo = new THREE.BoxGeometry(55, 16, 3);
        var hallNorth = makeMesh(hallNorthGeo, ruinColor);
        hallNorth.position.set(20185, 8, 55);
        addMesh(hallNorth);

        // Great Hall south wall (partial ruin - shorter)
        var hallSouthGeo = new THREE.BoxGeometry(55, 10, 3);
        var hallSouth = makeMesh(hallSouthGeo, ruinColor);
        hallSouth.position.set(20185, 5, 85);
        addMesh(hallSouth);

        // Great Hall west wall
        var hallWestGeo = new THREE.BoxGeometry(3, 16, 33);
        var hallWest = makeMesh(hallWestGeo, ruinColor);
        hallWest.position.set(20158, 8, 70);
        addMesh(hallWest);

        // Great Hall east wall
        var hallEastGeo = new THREE.BoxGeometry(3, 14, 33);
        var hallEast = makeMesh(hallEastGeo, ruinColor);
        hallEast.position.set(20213, 7, 70);
        addMesh(hallEast);

        // Great Hall windows - large pointed windows
        for (var wi = 0; wi < 3; wi++) {
            var winGeo = new THREE.BoxGeometry(6, 8, 1.5);
            var win = makeMesh(winGeo, 0x4466AA);
            win.position.set(20165 + wi * 18, 10, 54.2);
            addMesh(win);

            // Window hood mould
            var hoodGeo = new THREE.BoxGeometry(7.5, 1, 2);
            var hood = makeMesh(hoodGeo, darkRuin);
            hood.position.set(20165 + wi * 18, 14.5, 54.2);
            addMesh(hood);
        }

        // Vaulted undercroft - lower level
        var undercGeo = new THREE.BoxGeometry(50, 7, 28);
        var underc = makeMesh(undercGeo, 0x6B5535);
        underc.position.set(20185, -3.5, 70);
        addMesh(underc);

        // Undercroft interior ceiling ribs (cylinder arches)
        for (var ui = 0; ui < 4; ui++) {
            var ribGeo = new THREE.CylinderGeometry(0.4, 0.4, 26, 6);
            var rib = makeMesh(ribGeo, darkRuin);
            rib.rotation.z = Math.PI / 2;
            rib.position.set(20165 + ui * 14, 0, 70);
            addMesh(rib);
        }

        // Tumbled ruin rubble piles
        for (var rbi = 0; rbi < 6; rbi++) {
            var rubGeo = new THREE.BoxGeometry(3 + rbi % 3, 1.5 + rbi % 2, 2 + rbi % 3);
            var rub = makeMesh(rubGeo, ruinColor);
            rub.position.set(20160 + rbi * 10, 0.75, 90);
            rub.rotation.y = rbi * 0.4;
            addMesh(rub);
        }

        // Corner turret stump
        var turretGeo = new THREE.CylinderGeometry(3, 3.5, 12, 8);
        var turret = makeMesh(turretGeo, ruinColor);
        turret.position.set(20158, 6, 55);
        addMesh(turret);

        // Palace gateway arch
        var gatewayGeo = new THREE.BoxGeometry(8, 14, 4);
        var gateway = makeMesh(gatewayGeo, ruinColor);
        gateway.position.set(20185, 7, 53);
        addMesh(gateway);

        // Gateway arch opening
        var archOpenGeo = new THREE.BoxGeometry(5, 9, 5);
        var archOpen = makeMesh(archOpenGeo, 0x222222);
        archOpen.position.set(20185, 5, 53);
        addMesh(archOpen);

        // Birthplace room (Charles I born here - small chamber)
        var birthRoomGeo = new THREE.BoxGeometry(12, 10, 10);
        var birthRoom = makeMesh(birthRoomGeo, ruinColor);
        birthRoom.position.set(20220, 5, 62);
        addMesh(birthRoom);
    }

    function buildPittencrieffPark() {
        var parkGreen = 0x4a7c3f;
        var darkGreen = 0x3a6030;
        var pathColor = 0xC8B880;

        // Park lawn
        var lawnGeo = new THREE.BoxGeometry(150, 0.5, 120);
        var lawn = makeMesh(lawnGeo, parkGreen);
        lawn.position.set(20080, 0.25, -120);
        addMesh(lawn);

        // Formal garden beds
        for (var gi = 0; gi < 4; gi++) {
            var bedGeo = new THREE.BoxGeometry(15, 0.6, 10);
            var bed = makeMesh(bedGeo, 0x8B4513);
            bed.position.set(20050 + gi * 20, 0.3, -100);
            addMesh(bed);

            // Flowers/plants in beds
            var plantGeo = new THREE.SphereGeometry(3, 6, 6);
            var plant = makeMesh(plantGeo, 0xFF6644);
            plant.position.set(20050 + gi * 20, 3, -100);
            addMesh(plant);
        }

        // Trees in park (cylinder trunk + sphere canopy)
        var treePositions = [
            [-160, -130], [-140, -110], [-120, -140], [-100, -120],
            [-80, -150], [-60, -130], [-170, -100], [-50, -100]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var trunkGeo = new THREE.CylinderGeometry(0.8, 1.2, 8, 7);
            var trunk = makeMesh(trunkGeo, 0x5C4033);
            trunk.position.set(20200 + treePositions[ti][0], 4, treePositions[ti][1]);
            addMesh(trunk);

            var canopyGeo = new THREE.SphereGeometry(6, 7, 7);
            var canopy = makeMesh(canopyGeo, darkGreen);
            canopy.position.set(20200 + treePositions[ti][0], 12, treePositions[ti][1]);
            addMesh(canopy);
        }

        // Park paths
        var pathGeo = new THREE.BoxGeometry(4, 0.3, 100);
        var path = makeMesh(pathGeo, pathColor);
        path.position.set(20080, 0.15, -120);
        addMesh(path);

        // Pagoda pavilion
        var pagodaBaseGeo = new THREE.BoxGeometry(14, 4, 14);
        var pagodaBase = makeMesh(pagodaBaseGeo, 0xF5E8C0);
        pagodaBase.position.set(20060, 2, -140);
        addMesh(pagodaBase);

        var pagodaRoof1Geo = new THREE.BoxGeometry(16, 2, 16);
        var pagodaRoof1 = makeMesh(pagodaRoof1Geo, 0xCC4422);
        pagodaRoof1.position.set(20060, 5, -140);
        addMesh(pagodaRoof1);

        var pagodaRoof2Geo = new THREE.BoxGeometry(12, 2, 12);
        var pagodaRoof2 = makeMesh(pagodaRoof2Geo, 0xCC4422);
        pagodaRoof2.position.set(20060, 8, -140);
        addMesh(pagodaRoof2);

        var pagodaSpireGeo = new THREE.ConeGeometry(1.5, 5, 4);
        var pagodaSpire = makeMesh(pagodaSpireGeo, 0xCC4422);
        pagodaSpire.position.set(20060, 12, -140);
        addMesh(pagodaSpire);

        // Glen stream (low blue-ish box in depression)
        var streamGeo = new THREE.BoxGeometry(120, 0.4, 5);
        var stream = makeMesh(streamGeo, 0x4488BB);
        stream.position.set(20070, -0.2, -160);
        addMesh(stream);

        // Stream banks
        var bankNGeo = new THREE.BoxGeometry(120, 2, 3);
        var bankN = makeMesh(bankNGeo, 0x6B5030);
        bankN.position.set(20070, 0.5, -163);
        addMesh(bankN);

        var bankSGeo = new THREE.BoxGeometry(120, 2, 3);
        var bankS = makeMesh(bankSGeo, 0x6B5030);
        bankS.position.set(20070, 0.5, -157);
        addMesh(bankS);

        // Carnegie Park gates (iron gate posts)
        var gatePost1Geo = new THREE.BoxGeometry(1.5, 8, 1.5);
        var gatePost1 = makeMesh(gatePost1Geo, 0x222222);
        gatePost1.position.set(20140, 4, -90);
        addMesh(gatePost1);

        var gatePost2Geo = new THREE.BoxGeometry(1.5, 8, 1.5);
        var gatePost2 = makeMesh(gatePost2Geo, 0x222222);
        gatePost2.position.set(20148, 4, -90);
        addMesh(gatePost2);

        // Gate arch
        var gateArchGeo = new THREE.BoxGeometry(10, 1.5, 1.5);
        var gateArch = makeMesh(gateArchGeo, 0x222222);
        gateArch.position.set(20144, 8, -90);
        addMesh(gateArch);
    }

    function buildCarnegieCottage() {
        var cottageColor = 0xF5F0E8;
        var roofColor = 0xCC5555;
        var darkBeam = 0x5C4033;

        // Carnegie birthplace museum - weaver's cottage
        var cottageGeo = new THREE.BoxGeometry(14, 8, 9);
        var cottage = makeMesh(cottageGeo, cottageColor);
        cottage.position.set(20080, 4, -60);
        addMesh(cottage);

        // Cottage roof
        var cottRoofGeo = new THREE.BoxGeometry(15, 4, 10);
        var cottRoof = makeMesh(cottRoofGeo, roofColor);
        cottRoof.position.set(20080, 10, -60);
        addMesh(cottRoof);

        // Chimney
        var chimneyGeo = new THREE.BoxGeometry(2, 5, 2);
        var chimney = makeMesh(chimneyGeo, 0xC8B89A);
        chimney.position.set(20076, 14, -60);
        addMesh(chimney);

        // Windows
        var cWin1Geo = new THREE.BoxGeometry(2.5, 2.5, 0.5);
        var cWin1 = makeMesh(cWin1Geo, 0x88AACC);
        cWin1.position.set(20074, 5, -55.8);
        addMesh(cWin1);

        var cWin2Geo = new THREE.BoxGeometry(2.5, 2.5, 0.5);
        var cWin2 = makeMesh(cWin2Geo, 0x88AACC);
        cWin2.position.set(20082, 5, -55.8);
        addMesh(cWin2);

        // Door
        var doorGeo = new THREE.BoxGeometry(2, 4, 0.5);
        var door = makeMesh(doorGeo, darkBeam);
        door.position.set(20079, 2, -55.8);
        addMesh(door);

        // Museum signboard
        var signGeo = new THREE.BoxGeometry(8, 2, 0.3);
        var sign = makeMesh(signGeo, 0xFFDD88);
        sign.position.set(20080, 9.5, -55.8);
        addMesh(sign);

        // Low wall around cottage
        var lwGeo = new THREE.BoxGeometry(20, 1.5, 1);
        var lw = makeMesh(lwGeo, 0xC8B89A);
        lw.position.set(20080, 0.75, -52);
        addMesh(lw);

        // Loom room extension (weaver's workshop)
        var loomGeo = new THREE.BoxGeometry(10, 7, 8);
        var loom = makeMesh(loomGeo, cottageColor);
        loom.position.set(20095, 3.5, -60);
        addMesh(loom);

        var loomRoofGeo = new THREE.BoxGeometry(11, 3, 9);
        var loomRoof = makeMesh(loomRoofGeo, roofColor);
        loomRoof.position.set(20095, 8, -60);
        addMesh(loomRoof);
    }

    function buildCarnegieStatue() {
        var bronzeColor = 0x8B7355;
        var basaltColor = 0x444444;

        // Statue plinth / pedestal
        var plinthGeo = new THREE.BoxGeometry(4, 6, 4);
        var plinth = makeMesh(plinthGeo, basaltColor);
        plinth.position.set(20130, 3, -70);
        addMesh(plinth);

        // Plinth base step
        var stepGeo = new THREE.BoxGeometry(5.5, 1, 5.5);
        var step = makeMesh(stepGeo, basaltColor);
        step.position.set(20130, 0.5, -70);
        addMesh(step);

        // Carnegie torso
        var torsoGeo = new THREE.BoxGeometry(1.8, 2.8, 1.2);
        var torso = makeMesh(torsoGeo, bronzeColor);
        torso.position.set(20130, 8.4, -70);
        addMesh(torso);

        // Carnegie head
        var headGeo = new THREE.SphereGeometry(0.7, 8, 8);
        var head = makeMesh(headGeo, bronzeColor);
        head.position.set(20130, 10.8, -70);
        addMesh(head);

        // Carnegie legs
        var legGeo = new THREE.BoxGeometry(1.6, 2.2, 1);
        var leg = makeMesh(legGeo, bronzeColor);
        leg.position.set(20130, 6, -70);
        addMesh(leg);

        // Outstretched arm holding book
        var armGeo = new THREE.BoxGeometry(2, 0.4, 0.4);
        var arm = makeMesh(armGeo, bronzeColor);
        arm.position.set(20131.8, 8.8, -70);
        arm.rotation.z = 0.6;
        addMesh(arm);

        // Book in hand
        var bookGeo = new THREE.BoxGeometry(0.8, 0.5, 0.6);
        var book = makeMesh(bookGeo, bronzeColor);
        book.position.set(20133.5, 9.8, -70);
        addMesh(book);
    }

    function buildHighStreet() {
        var streetColor = 0x888880;
        var buildingColor = 0xF5F0E8;
        var darkBrick = 0xCD5C5C;

        // High Street road surface
        var roadGeo = new THREE.BoxGeometry(100, 0.3, 14);
        var road = makeMesh(roadGeo, streetColor);
        road.position.set(20320, 0.15, -40);
        addMesh(road);

        // Pavement/sidewalk
        var pavGeo = new THREE.BoxGeometry(100, 0.2, 5);
        var pav = makeMesh(pavGeo, 0xCCCCBB);
        pav.position.set(20320, 0.1, -50);
        addMesh(pav);

        // Guildhall / town house
        var guildhallGeo = new THREE.BoxGeometry(18, 16, 14);
        var guildhall = makeMesh(guildhallGeo, buildingColor);
        guildhall.position.set(20280, 8, -50);
        addMesh(guildhall);

        // Guildhall clock tower
        var clockTowerGeo = new THREE.BoxGeometry(7, 22, 7);
        var clockTower = makeMesh(clockTowerGeo, buildingColor);
        clockTower.position.set(20278, 11, -50);
        addMesh(clockTower);

        // Clock face
        var clockFaceGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 12);
        var clockFace = makeMesh(clockFaceGeo, 0xF0F0E0);
        clockFace.rotation.x = Math.PI / 2;
        clockFace.position.set(20278, 20, -54);
        addMesh(clockFace);

        // Guildhall roof spire
        var spireGeo = new THREE.ConeGeometry(2, 8, 4);
        var spire = makeMesh(spireGeo, darkBrick);
        spire.position.set(20278, 27, -50);
        addMesh(spire);

        // Row of historic buildings along High Street
        var buildingData = [
            [20300, 12, -50, 14, 12, 12, buildingColor],
            [20318, 10, -50, 12, 10, 12, darkBrick],
            [20334, 14, -50, 14, 14, 12, buildingColor],
            [20350, 10, -50, 10, 10, 12, darkBrick],
            [20365, 12, -50, 12, 12, 12, 0xE0D8C8]
        ];
        for (var bi = 0; bi < buildingData.length; bi++) {
            var bd = buildingData[bi];
            var bGeo = new THREE.BoxGeometry(bd[3], bd[4], bd[5]);
            var bMesh = makeMesh(bGeo, bd[6]);
            bMesh.position.set(bd[0], bd[4] / 2, bd[2]);
            addMesh(bMesh);

            // Shop front window
            var shGeo = new THREE.BoxGeometry(4, 3, 0.5);
            var sh = makeMesh(shGeo, 0x99BBDD);
            sh.position.set(bd[0], 2.5, -44);
            addMesh(sh);
        }

        // Street lamp posts
        for (var li = 0; li < 5; li++) {
            var lampGeo = new THREE.CylinderGeometry(0.2, 0.3, 7, 6);
            var lamp = makeMesh(lampGeo, 0x333333);
            lamp.position.set(20285 + li * 20, 3.5, -47);
            addMesh(lamp);

            var lampTopGeo = new THREE.SphereGeometry(0.6, 6, 6);
            var lampTop = makeMesh(lampTopGeo, 0xFFFF88);
            lampTop.position.set(20285 + li * 20, 7.5, -47);
            addMesh(lampTop);
        }

        // Market cross / mercat cross
        var crossBaseGeo = new THREE.CylinderGeometry(3, 4, 1.5, 8);
        var crossBase = makeMesh(crossBaseGeo, 0xC8B89A);
        crossBase.position.set(20310, 0.75, -40);
        addMesh(crossBase);

        var crossShaftGeo = new THREE.CylinderGeometry(0.5, 0.7, 6, 8);
        var crossShaft = makeMesh(crossShaftGeo, 0xC8B89A);
        crossShaft.position.set(20310, 4.5, -40);
        addMesh(crossShaft);

        var crossTopGeo = new THREE.SphereGeometry(1, 8, 8);
        var crossTop = makeMesh(crossTopGeo, 0xFFDD44);
        crossTop.position.set(20310, 8, -40);
        addMesh(crossTop);
    }

    function buildMalcolmTower() {
        var ancientStone = 0x8B7355;
        var veryDarkStone = 0x5a4530;

        // Malcolm Canmore's Tower - ancient Celtic / Pictish tower ruins
        // Tower base - very thick walls
        var towerBaseGeo = new THREE.CylinderGeometry(9, 11, 6, 10);
        var towerBase = makeMesh(towerBaseGeo, ancientStone);
        towerBase.position.set(20140, 3, -200);
        addMesh(towerBase);

        // Tower middle section
        var towerMidGeo = new THREE.CylinderGeometry(7, 9, 8, 10);
        var towerMid = makeMesh(towerMidGeo, ancientStone);
        towerMid.position.set(20140, 10, -200);
        addMesh(towerMid);

        // Partial top - ruined
        var towerTopGeo = new THREE.CylinderGeometry(5, 7, 4, 10);
        var towerTop = makeMesh(towerTopGeo, veryDarkStone);
        towerTop.position.set(20140, 16, -200);
        addMesh(towerTop);

        // Hollow interior - dark core
        var towerCoreGeo = new THREE.CylinderGeometry(5.5, 6, 17, 10);
        var towerCore = makeMesh(towerCoreGeo, 0x111111);
        towerCore.position.set(20140, 8.5, -200);
        addMesh(towerCore);

        // Tumbled stones around base
        for (var si = 0; si < 7; si++) {
            var stoneGeo = new THREE.BoxGeometry(2 + si % 2, 1 + si % 2, 1.5 + si % 2);
            var stone = makeMesh(stoneGeo, ancientStone);
            stone.position.set(
                20140 + Math.cos(si * 0.9) * 13,
                0.75,
                -200 + Math.sin(si * 0.9) * 13
            );
            stone.rotation.y = si * 0.5;
            addMesh(stone);
        }

        // Wall remnant leading from tower
        var wallRemGeo = new THREE.BoxGeometry(3, 5, 30);
        var wallRem = makeMesh(wallRemGeo, ancientStone);
        wallRem.position.set(20140, 2.5, -178);
        addMesh(wallRem);
    }

    function buildAbbeyDetails() {
        var stoneColor = 0xC8B89A;
        var darkStone = 0xA89880;

        // Abbey exterior steps (west end)
        var step1Geo = new THREE.BoxGeometry(20, 1, 4);
        var step1 = makeMesh(step1Geo, darkStone);
        step1.position.set(20148, 0.5, 0);
        addMesh(step1);

        var step2Geo = new THREE.BoxGeometry(18, 1, 3);
        var step2 = makeMesh(step2Geo, darkStone);
        step2.position.set(20148, 1.5, 0);
        addMesh(step2);

        // West door portal
        var portalGeo = new THREE.BoxGeometry(7, 12, 1.5);
        var portal = makeMesh(portalGeo, 0x8B7000);
        portal.position.set(20150, 6, 0);
        addMesh(portal);

        // Norman portal moulding (concentric boxes)
        var mould1Geo = new THREE.BoxGeometry(9, 14, 0.8);
        var mould1 = makeMesh(mould1Geo, darkStone);
        mould1.position.set(20150, 7, -1);
        addMesh(mould1);

        // Graveyard boundary wall (south side of abbey)
        var graveWallGeo = new THREE.BoxGeometry(120, 2.5, 1.5);
        var graveWall = makeMesh(graveWallGeo, 0xAA9977);
        graveWall.position.set(20220, 1.25, 45);
        addMesh(graveWall);

        // Grave stones
        for (var gvi = 0; gvi < 10; gvi++) {
            var graveGeo = new THREE.BoxGeometry(0.6, 2, 1.2);
            var grave = makeMesh(graveGeo, 0x999977);
            grave.position.set(20165 + gvi * 11, 1, 35);
            grave.rotation.y = (gvi % 2) * 0.15;
            addMesh(grave);
        }

        // Exterior lamp on abbey
        var extLampGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 6);
        var extLamp = makeMesh(extLampGeo, 0x333333);
        extLamp.position.set(20155, 2.5, -20);
        addMesh(extLamp);

        // Piscina niche in south wall (small alcove box)
        var piscinaGeo = new THREE.BoxGeometry(2, 3, 1);
        var piscina = makeMesh(piscinaGeo, 0x4466AA);
        piscina.position.set(20175, 5, 17.6);
        addMesh(piscina);

        // Ambulatory / cloister remnant (partial walls forming square)
        var cloistNGeo = new THREE.BoxGeometry(40, 5, 1.5);
        var cloistN = makeMesh(cloistNGeo, darkStone);
        cloistN.position.set(20200, 2.5, 28);
        addMesh(cloistN);

        var cloistEGeo = new THREE.BoxGeometry(1.5, 5, 20);
        var cloistE = makeMesh(cloistEGeo, darkStone);
        cloistE.position.set(20220, 2.5, 37);
        addMesh(cloistE);

        var cloistWGeo = new THREE.BoxGeometry(1.5, 5, 20);
        var cloistW = makeMesh(cloistWGeo, darkStone);
        cloistW.position.set(20180, 2.5, 37);
        addMesh(cloistW);
    }

    function update(delta) {
        // No animated elements required for static environment
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
