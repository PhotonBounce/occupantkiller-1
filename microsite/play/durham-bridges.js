window.DurhamBridges = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 15240;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeLines(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var ls = new THREE.LineSegments(geometry, mat);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function buildCathedral() {
        var cx = X_OFFSET + 0;
        var cz = -200;

        // Main nave body
        var nave = makeMesh(new THREE.BoxGeometry(60, 30, 140), 0x8B7355);
        nave.position.set(cx, 15, cz);

        // Nave roof
        var naveRoof = makeMesh(new THREE.BoxGeometry(64, 10, 144), 0x6B5A3E);
        naveRoof.position.set(cx, 35, cz);

        // Crossing tower (central tower - tallest)
        var crossingTower = makeMesh(new THREE.BoxGeometry(22, 80, 22), 0x7A6548);
        crossingTower.position.set(cx, 55, cz - 10);

        // Crossing tower top battlements
        var crossingTop = makeMesh(new THREE.BoxGeometry(24, 10, 24), 0x6B5A3E);
        crossingTop.position.set(cx, 100, cz - 10);

        // West twin towers (two towers at west end)
        var westTowerLeft = makeMesh(new THREE.BoxGeometry(18, 65, 18), 0x7A6548);
        westTowerLeft.position.set(cx - 22, 47, cz + 70);

        var westTowerRight = makeMesh(new THREE.BoxGeometry(18, 65, 18), 0x7A6548);
        westTowerRight.position.set(cx + 22, 47, cz + 70);

        // West tower tops
        var wtlTop = makeMesh(new THREE.BoxGeometry(20, 8, 20), 0x6B5A3E);
        wtlTop.position.set(cx - 22, 83, cz + 70);

        var wtrTop = makeMesh(new THREE.BoxGeometry(20, 8, 20), 0x6B5A3E);
        wtrTop.position.set(cx + 22, 83, cz + 70);

        // Transepts (north and south)
        var northTransept = makeMesh(new THREE.BoxGeometry(30, 28, 50), 0x8B7355);
        northTransept.position.set(cx - 40, 14, cz - 10);

        var southTransept = makeMesh(new THREE.BoxGeometry(30, 28, 50), 0x8B7355);
        southTransept.position.set(cx + 40, 14, cz - 10);

        // Galilee Chapel (west porch extension)
        var galileeChapel = makeMesh(new THREE.BoxGeometry(48, 18, 24), 0x9C8B6E);
        galileeChapel.position.set(cx, 9, cz + 90);

        // Galilee Chapel roof
        var galileeRoof = makeMesh(new THREE.BoxGeometry(50, 6, 26), 0x7A6B50);
        galileeRoof.position.set(cx, 21, cz + 90);

        // Chapter House (east end)
        var chapterHouse = makeMesh(new THREE.BoxGeometry(32, 22, 32), 0x8B7355);
        chapterHouse.position.set(cx + 44, 11, cz - 60);

        var chapterRoof = makeMesh(new THREE.CylinderGeometry(0, 20, 14, 8), 0x6B5A3E);
        chapterRoof.position.set(cx + 44, 29, cz - 60);

        // Cloister garth (open square south of nave)
        var cloisNorth = makeMesh(new THREE.BoxGeometry(60, 10, 4), 0x7A6548);
        cloisNorth.position.set(cx, 5, cz + 45);

        var cloisSouth = makeMesh(new THREE.BoxGeometry(60, 10, 4), 0x7A6548);
        cloisSouth.position.set(cx, 5, cz + 15);

        var cloisEast = makeMesh(new THREE.BoxGeometry(4, 10, 30), 0x7A6548);
        cloisEast.position.set(cx + 30, 5, cz + 30);

        var cloisWest = makeMesh(new THREE.BoxGeometry(4, 10, 30), 0x7A6548);
        cloisWest.position.set(cx - 30, 5, cz + 30);

        // Flying buttresses north side (pairs)
        var i;
        for (i = 0; i < 4; i++) {
            var buttNorth = makeMesh(new THREE.BoxGeometry(3, 18, 8), 0x7A6548);
            buttNorth.position.set(cx - 34, 18, cz + 40 - i * 25);

            var buttSouth = makeMesh(new THREE.BoxGeometry(3, 18, 8), 0x7A6548);
            buttSouth.position.set(cx + 34, 18, cz + 40 - i * 25);
        }

        // Monks' Door (ornate doorway south nave)
        var monksDoor = makeMesh(new THREE.BoxGeometry(6, 12, 2), 0x4A3728);
        monksDoor.position.set(cx + 30, 6, cz + 10);

        // Apse at east end
        var apse = makeMesh(new THREE.CylinderGeometry(16, 16, 26, 12, 1, false, 0, Math.PI), 0x8B7355);
        apse.position.set(cx, 13, cz - 80);

        var apseRoof = makeMesh(new THREE.CylinderGeometry(0, 18, 12, 12, 1, false, 0, Math.PI), 0x6B5A3E);
        apseRoof.position.set(cx, 31, cz - 80);
    }

    function buildCastle() {
        var cx = X_OFFSET + 60;
        var cz = -150;

        // Motte (earthen mound)
        var motte = makeMesh(new THREE.CylinderGeometry(18, 28, 16, 12), 0x5C4A2A);
        motte.position.set(cx, 8, cz - 60);

        // Keep on top of motte
        var keep = makeMesh(new THREE.BoxGeometry(24, 28, 24), 0x8B7870);
        keep.position.set(cx, 30, cz - 60);

        var keepBattlement = makeMesh(new THREE.BoxGeometry(26, 6, 26), 0x7A6B62);
        keepBattlement.position.set(cx, 45, cz - 60);

        // Keep corner turrets
        var turretNW = makeMesh(new THREE.CylinderGeometry(3, 3, 32, 8), 0x7A6B62);
        turretNW.position.set(cx - 12, 24, cz - 72);

        var turretNE = makeMesh(new THREE.CylinderGeometry(3, 3, 32, 8), 0x7A6B62);
        turretNE.position.set(cx + 12, 24, cz - 72);

        var turretSW = makeMesh(new THREE.CylinderGeometry(3, 3, 32, 8), 0x7A6B62);
        turretSW.position.set(cx - 12, 24, cz - 48);

        var turretSE = makeMesh(new THREE.CylinderGeometry(3, 3, 32, 8), 0x7A6B62);
        turretSE.position.set(cx + 12, 24, cz - 48);

        // Great Hall
        var greatHall = makeMesh(new THREE.BoxGeometry(50, 22, 30), 0x8B7870);
        greatHall.position.set(cx, 11, cz + 10);

        var greatHallRoof = makeMesh(new THREE.BoxGeometry(52, 8, 32), 0x6B5A3E);
        greatHallRoof.position.set(cx, 26, cz + 10);

        // Norman Chapel
        var chapel = makeMesh(new THREE.BoxGeometry(22, 16, 28), 0x8B7870);
        chapel.position.set(cx - 30, 8, cz + 5);

        var chapelApse = makeMesh(new THREE.CylinderGeometry(8, 8, 16, 8, 1, false, 0, Math.PI), 0x8B7870);
        chapelApse.position.set(cx - 30, 8, cz - 10);

        var chapelRoof = makeMesh(new THREE.BoxGeometry(24, 6, 30), 0x6B5A3E);
        chapelRoof.position.set(cx - 30, 19, cz + 5);

        // Curtain wall (perimeter)
        var wallNorth = makeMesh(new THREE.BoxGeometry(90, 14, 4), 0x7A6B62);
        wallNorth.position.set(cx, 7, cz - 85);

        var wallSouth = makeMesh(new THREE.BoxGeometry(90, 14, 4), 0x7A6B62);
        wallSouth.position.set(cx, 7, cz + 45);

        var wallEast = makeMesh(new THREE.BoxGeometry(4, 14, 130), 0x7A6B62);
        wallEast.position.set(cx + 45, 7, cz - 20);

        var wallWest = makeMesh(new THREE.BoxGeometry(4, 14, 130), 0x7A6B62);
        wallWest.position.set(cx - 45, 7, cz - 20);

        // Bishop's Gateway
        var gatewayBase = makeMesh(new THREE.BoxGeometry(20, 20, 10), 0x7A6B62);
        gatewayBase.position.set(cx, 10, cz + 45);

        var gatewayArch = makeMesh(new THREE.BoxGeometry(8, 14, 12), 0x4A3728);
        gatewayArch.position.set(cx, 7, cz + 45);

        var gatewayTop = makeMesh(new THREE.BoxGeometry(22, 8, 12), 0x6B5A3E);
        gatewayTop.position.set(cx, 24, cz + 45);

        // Wall towers
        var towerNE = makeMesh(new THREE.CylinderGeometry(5, 5, 18, 8), 0x7A6B62);
        towerNE.position.set(cx + 45, 9, cz - 85);

        var towerNW = makeMesh(new THREE.CylinderGeometry(5, 5, 18, 8), 0x7A6B62);
        towerNW.position.set(cx - 45, 9, cz - 85);

        var towerSE = makeMesh(new THREE.CylinderGeometry(5, 5, 18, 8), 0x7A6B62);
        towerSE.position.set(cx + 45, 9, cz + 45);

        var towerSW = makeMesh(new THREE.CylinderGeometry(5, 5, 18, 8), 0x7A6B62);
        towerSW.position.set(cx - 45, 9, cz + 45);
    }

    function buildRiverWear() {
        var cx = X_OFFSET;

        // River bed (dark water plane sections forming gorge loop)
        var riverMain = makeMesh(new THREE.BoxGeometry(40, 2, 400), 0x1A2A3A);
        riverMain.position.set(cx - 120, -4, -150);

        var riverEast = makeMesh(new THREE.BoxGeometry(40, 2, 400), 0x1A2A3A);
        riverEast.position.set(cx + 120, -4, -150);

        // River bend south
        var riverBendS = makeMesh(new THREE.BoxGeometry(280, 2, 40), 0x1A2A3A);
        riverBendS.position.set(cx, -4, 80);

        // River bend north
        var riverBendN = makeMesh(new THREE.BoxGeometry(280, 2, 40), 0x1A2A3A);
        riverBendN.position.set(cx, -4, -380);

        // Gorge banks - steep wooded slopes (dark green)
        // West bank
        var bankW1 = makeMesh(new THREE.BoxGeometry(60, 35, 400), 0x1A3A1A);
        bankW1.position.set(cx - 160, 10, -150);

        var bankW2 = makeMesh(new THREE.BoxGeometry(50, 25, 400), 0x2A4A2A);
        bankW2.position.set(cx - 195, 5, -150);

        // East bank
        var bankE1 = makeMesh(new THREE.BoxGeometry(60, 35, 400), 0x1A3A1A);
        bankE1.position.set(cx + 160, 10, -150);

        var bankE2 = makeMesh(new THREE.BoxGeometry(50, 25, 400), 0x2A4A2A);
        bankE2.position.set(cx + 195, 5, -150);

        // Peninsula ground (cathedral/castle sit on this)
        var peninsula = makeMesh(new THREE.BoxGeometry(200, 8, 280), 0x3A5C2A);
        peninsula.position.set(cx + 30, -2, -200);

        // Trees on gorge banks (cylinders for trunks, spheres for canopy)
        var treePositions = [
            [-145, 0, -100], [-150, 0, -160], [-155, 0, -220], [-148, 0, -280],
            [-160, 0, -50], [-165, 0, -120], [-152, 0, -200], [-158, 0, -340],
            [145, 0, -100], [150, 0, -160], [155, 0, -220], [148, 0, -280],
            [160, 0, -50], [165, 0, -120], [152, 0, -200], [158, 0, -340]
        ];

        var t;
        for (t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            var trunk = makeMesh(new THREE.CylinderGeometry(1, 1.5, 12, 6), 0x3B2A1A);
            trunk.position.set(cx + tp[0], 6, tp[2]);

            var canopy = makeMesh(new THREE.SphereGeometry(7, 6, 5), 0x1A3A10);
            canopy.position.set(cx + tp[0], 16, tp[2]);
        }
    }

    function buildFramwellgateBridge() {
        var cx = X_OFFSET - 100;
        var cz = 50;

        // Bridge deck
        var deck = makeMesh(new THREE.BoxGeometry(20, 3, 60), 0x8B7A5A);
        deck.position.set(cx, 8, cz);

        // Arch piers (two spans, three piers)
        var pier1 = makeMesh(new THREE.BoxGeometry(6, 18, 8), 0x7A6B4A);
        pier1.position.set(cx, 0, cz - 22);

        var pier2 = makeMesh(new THREE.BoxGeometry(6, 18, 8), 0x7A6B4A);
        pier2.position.set(cx, 0, cz);

        var pier3 = makeMesh(new THREE.BoxGeometry(6, 18, 8), 0x7A6B4A);
        pier3.position.set(cx, 0, cz + 22);

        // Arch spans (flattened cylinders to suggest arches)
        var arch1 = makeMesh(new THREE.CylinderGeometry(11, 11, 5, 12, 1, false, 0, Math.PI), 0x8B7A5A);
        arch1.rotation.z = Math.PI / 2;
        arch1.position.set(cx, 5, cz - 11);

        var arch2 = makeMesh(new THREE.CylinderGeometry(11, 11, 5, 12, 1, false, 0, Math.PI), 0x8B7A5A);
        arch2.rotation.z = Math.PI / 2;
        arch2.position.set(cx, 5, cz + 11);

        // Parapet walls
        var parapetL = makeMesh(new THREE.BoxGeometry(3, 4, 60), 0x7A6B4A);
        parapetL.position.set(cx - 9, 12, cz);

        var parapetR = makeMesh(new THREE.BoxGeometry(3, 4, 60), 0x7A6B4A);
        parapetR.position.set(cx + 9, 12, cz);

        // Road surface (slightly darker)
        var road = makeMesh(new THREE.BoxGeometry(14, 1, 60), 0x6B5A4A);
        road.position.set(cx, 10, cz);
    }

    function buildElvetBridge() {
        var cx = X_OFFSET + 100;
        var cz = 30;

        // Bridge deck
        var deck = makeMesh(new THREE.BoxGeometry(16, 3, 80), 0x8B7A5A);
        deck.position.set(cx, 8, cz);

        // Multiple piers (multi-span)
        var p;
        for (p = 0; p < 5; p++) {
            var pier = makeMesh(new THREE.BoxGeometry(5, 18, 7), 0x7A6B4A);
            pier.position.set(cx, 0, cz - 35 + p * 17);
        }

        // Arch spans
        var a;
        for (a = 0; a < 4; a++) {
            var arch = makeMesh(new THREE.CylinderGeometry(8, 8, 4, 10, 1, false, 0, Math.PI), 0x8B7A5A);
            arch.rotation.z = Math.PI / 2;
            arch.position.set(cx, 5, cz - 27 + a * 17);
        }

        // Parapets
        var parapetL = makeMesh(new THREE.BoxGeometry(2, 5, 80), 0x7A6B4A);
        parapetL.position.set(cx - 7, 12, cz);

        var parapetR = makeMesh(new THREE.BoxGeometry(2, 5, 80), 0x7A6B4A);
        parapetR.position.set(cx + 7, 12, cz);

        // Shop buildings on bridge (medieval feature)
        var shopPositions = [
            [-28], [-14], [0], [14], [28]
        ];
        var s;
        for (s = 0; s < shopPositions.length; s++) {
            var shopZ = cz + shopPositions[s][0];
            var shopBody = makeMesh(new THREE.BoxGeometry(12, 14, 10), 0x8B6A4A);
            shopBody.position.set(cx, 16, shopZ);

            var shopRoof = makeMesh(new THREE.BoxGeometry(14, 5, 12), 0x5A3A2A);
            shopRoof.position.set(cx, 26, shopZ);
        }

        // Bridge Chapel (at one end)
        var chapelBody = makeMesh(new THREE.BoxGeometry(10, 16, 14), 0x9C8B6E);
        chapelBody.position.set(cx, 16, cz + 42);

        var chapelRoof = makeMesh(new THREE.ConeGeometry(8, 10, 4), 0x6B5A3E);
        chapelRoof.position.set(cx, 29, cz + 42);
        chapelRoof.rotation.y = Math.PI / 4;

        var chapelTower = makeMesh(new THREE.BoxGeometry(6, 24, 6), 0x8B7A5A);
        chapelTower.position.set(cx, 20, cz + 50);

        var chapelTowerTop = makeMesh(new THREE.BoxGeometry(7, 4, 7), 0x7A6B4A);
        chapelTowerTop.position.set(cx, 34, cz + 50);
    }

    function buildPalaceGreen() {
        var cx = X_OFFSET + 20;
        var cz = -100;

        // Palace Green lawn area
        var greenLawn = makeMesh(new THREE.BoxGeometry(100, 1, 80), 0x3A6A2A);
        greenLawn.position.set(cx, 0, cz);

        // University library building on Palace Green
        var library = makeMesh(new THREE.BoxGeometry(28, 14, 20), 0x9C8870);
        library.position.set(cx - 40, 7, cz);

        var libraryRoof = makeMesh(new THREE.BoxGeometry(30, 4, 22), 0x7A6B50);
        libraryRoof.position.set(cx - 40, 16, cz);

        // Bishop Cosin's Library
        var cosinsLib = makeMesh(new THREE.BoxGeometry(22, 16, 18), 0x8B7A60);
        cosinsLib.position.set(cx + 38, 8, cz);

        var cosinsRoof = makeMesh(new THREE.BoxGeometry(24, 5, 20), 0x6B5A40);
        cosinsRoof.position.set(cx + 38, 18, cz);

        // Historic college buildings around Palace Green
        var college1 = makeMesh(new THREE.BoxGeometry(40, 18, 16), 0x8B7A60);
        college1.position.set(cx, 9, cz - 50);

        var college1Roof = makeMesh(new THREE.BoxGeometry(42, 6, 18), 0x6B5A40);
        college1Roof.position.set(cx, 20, cz - 50);

        // College turrets
        var turret1 = makeMesh(new THREE.CylinderGeometry(3, 3, 24, 8), 0x7A6B50);
        turret1.position.set(cx - 18, 12, cz - 58);

        var turret2 = makeMesh(new THREE.CylinderGeometry(3, 3, 24, 8), 0x7A6B50);
        turret2.position.set(cx + 18, 12, cz - 58);
    }

    function buildKingsgatebridge() {
        var cx = X_OFFSET - 20;
        var cz = -320;

        // Kingsgate Bridge - modern concrete pedestrian bridge (1963, Ove Arup)
        // Distinctive two-section bridge that rotates into position

        // Main span deck
        var deck = makeMesh(new THREE.BoxGeometry(8, 2, 70), 0xB0A898);
        deck.position.set(cx, 18, cz);

        // Slim concrete piers
        var pierN = makeMesh(new THREE.CylinderGeometry(2, 2, 22, 8), 0xB0A898);
        pierN.position.set(cx, 10, cz - 30);

        var pierS = makeMesh(new THREE.CylinderGeometry(2, 2, 22, 8), 0xB0A898);
        pierS.position.set(cx, 10, cz + 30);

        // Abutments
        var abutN = makeMesh(new THREE.BoxGeometry(14, 6, 10), 0x9A9088);
        abutN.position.set(cx, 18, cz - 38);

        var abutS = makeMesh(new THREE.BoxGeometry(14, 6, 10), 0x9A9088);
        abutS.position.set(cx, 18, cz + 38);

        // Thin parapets
        var railL = makeMesh(new THREE.BoxGeometry(1, 3, 70), 0xC0B8B0);
        railL.position.set(cx - 4, 21, cz);

        var railR = makeMesh(new THREE.BoxGeometry(1, 3, 70), 0xC0B8B0);
        railR.position.set(cx + 4, 21, cz);
    }

    function buildCityDetail() {
        var cx = X_OFFSET;

        // City centre market place buildings
        var market1 = makeMesh(new THREE.BoxGeometry(30, 16, 20), 0x9A8060);
        market1.position.set(cx + 80, 8, 100);

        var market1Roof = makeMesh(new THREE.BoxGeometry(32, 5, 22), 0x7A6040);
        market1Roof.position.set(cx + 80, 18, 100);

        var market2 = makeMesh(new THREE.BoxGeometry(25, 14, 18), 0x8A7050);
        market2.position.set(cx + 115, 7, 100);

        var market2Roof = makeMesh(new THREE.BoxGeometry(27, 5, 20), 0x6A5030);
        market2Roof.position.set(cx + 115, 16, 100);

        // St Giles church
        var stGiles = makeMesh(new THREE.BoxGeometry(16, 18, 22), 0x8B7A60);
        stGiles.position.set(cx + 140, 9, -80);

        var stGilesTower = makeMesh(new THREE.BoxGeometry(8, 28, 8), 0x7A6B50);
        stGilesTower.position.set(cx + 140, 20, -90);

        var stGilesSpire = makeMesh(new THREE.ConeGeometry(5, 18, 4), 0x6B5A40);
        stGilesSpire.position.set(cx + 140, 43, -90);
        stGilesSpire.rotation.y = Math.PI / 4;

        // St Nicholas church (Market Place)
        var stNicholas = makeMesh(new THREE.BoxGeometry(20, 20, 28), 0x8B7A60);
        stNicholas.position.set(cx + 75, 10, 50);

        var stNicholasTower = makeMesh(new THREE.BoxGeometry(9, 32, 9), 0x7A6B50);
        stNicholasTower.position.set(cx + 75, 22, 38);

        var stNicholasTop = makeMesh(new THREE.BoxGeometry(10, 5, 10), 0x6B5A40);
        stNicholasTop.position.set(cx + 75, 42, 38);

        // Baileygate street buildings
        var b;
        for (b = 0; b < 6; b++) {
            var bldg = makeMesh(new THREE.BoxGeometry(12, 10 + b * 2, 14), 0x8B7060);
            bldg.position.set(cx - 80, 5 + b, -80 + b * 30);

            var bldgRoof = makeMesh(new THREE.BoxGeometry(13, 4, 15), 0x6B5040);
            bldgRoof.position.set(cx - 80, 14 + b * 2, -80 + b * 30);
        }

        // Ground plane for peninsula and city
        var ground = makeMesh(new THREE.BoxGeometry(500, 2, 700), 0x4A6A3A);
        ground.position.set(cx, -1, -150);
    }

    function build() {
        buildRiverWear();
        buildCathedral();
        buildCastle();
        buildFramwellgateBridge();
        buildElvetBridge();
        buildPalaceGreen();
        buildKingsgatebridge();
        buildCityDetail();
    }

    function update(delta) {
        // Static environment - no animation needed
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
