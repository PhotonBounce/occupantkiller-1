window.LochLomond = (function() {
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

    function addObject(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.emissive !== undefined) params.emissive = opts.emissive;
            if (opts.side !== undefined) params.side = opts.side;
        }
        var mat = new THREE.MeshLambertMaterial(params);
        return new THREE.Mesh(geo, mat);
    }

    function buildLoch() {
        // Main loch body — wide southern basin
        var lochGeoS = new THREE.BoxGeometry(3200, 18, 4200);
        var lochS = makeMesh(lochGeoS, 0x1a3a5c);
        lochS.position.set(15000, -4, 0);
        addObject(lochS);

        // Northern narrow deep section
        var lochGeoN = new THREE.BoxGeometry(900, 18, 5000);
        var lochN = makeMesh(lochGeoN, 0x122844);
        lochN.position.set(14600, -5, -4500);
        addObject(lochN);

        // Mid section connecting south and north
        var lochGeoM = new THREE.BoxGeometry(1800, 18, 2000);
        var lochM = makeMesh(lochGeoM, 0x163350);
        lochM.position.set(14800, -4.5, -2300);
        addObject(lochM);

        // Shallow southern shore shallows
        var shallowGeo = new THREE.BoxGeometry(3600, 8, 600);
        var shallow = makeMesh(shallowGeo, 0x2a5a7c);
        shallow.position.set(15000, -1, 2300);
        addObject(shallow);

        // Water shimmer patches
        var shimmer1 = new THREE.BoxGeometry(800, 2, 800);
        var s1 = makeMesh(shimmer1, 0x2a6a9c);
        s1.position.set(15200, 4, -1000);
        addObject(s1);

        var shimmer2 = new THREE.BoxGeometry(600, 2, 600);
        var s2 = makeMesh(shimmer2, 0x2a6a9c);
        s2.position.set(14700, 4, 500);
        addObject(s2);

        var shimmer3 = new THREE.BoxGeometry(400, 2, 400);
        var s3 = makeMesh(shimmer3, 0x3a7aac);
        s3.position.set(15400, 4, -3500);
        addObject(s3);

        // Loch outline / banks
        var bankColors = [0x3a6b3a, 0x4a7a4a, 0x3a6b3a];
        var bankPositions = [
            [13300, 2, 0, 200, 10, 4200],
            [16700, 2, 0, 200, 10, 4200],
            [15000, 2, 2600, 3400, 10, 200]
        ];
        for (var bi = 0; bi < bankPositions.length; bi++) {
            var bp = bankPositions[bi];
            var bankGeo = new THREE.BoxGeometry(bp[3], bp[4], bp[5]);
            var bank = makeMesh(bankGeo, bankColors[bi % bankColors.length]);
            bank.position.set(bp[0], bp[1], bp[2]);
            addObject(bank);
        }
    }

    function buildBenLomond() {
        // Ben Lomond main peak — 974m, iconic conical mountain east of loch
        var baseGeo = new THREE.CylinderGeometry(0, 1400, 3200, 8);
        var base = makeMesh(baseGeo, 0x5a4a3a);
        base.position.set(16200, 1600, -2800);
        addObject(base);

        // Mid section
        var midGeo = new THREE.CylinderGeometry(0, 900, 2000, 8);
        var mid = makeMesh(midGeo, 0x4a3a2a);
        mid.position.set(16200, 3500, -2800);
        addObject(mid);

        // Upper cone / summit
        var summitGeo = new THREE.ConeGeometry(400, 1400, 7);
        var summit = makeMesh(summitGeo, 0x6a5a4a);
        summit.position.set(16200, 5000, -2800);
        addObject(summit);

        // Snow cap on summit
        var snowGeo = new THREE.ConeGeometry(200, 500, 7);
        var snow = makeMesh(snowGeo, 0xe8e8f0);
        snow.position.set(16200, 5900, -2800);
        addObject(snow);

        // Ptarmigan ridge / shoulder
        var ptarmiganGeo = new THREE.BoxGeometry(600, 400, 1800);
        var ptarmigan = makeMesh(ptarmiganGeo, 0x5a4e3e);
        ptarmigan.position.set(15800, 2800, -3600);
        addObject(ptarmigan);

        // Ridge walk path marker ridge
        var ridgeGeo = new THREE.BoxGeometry(80, 80, 1600);
        var ridge = makeMesh(ridgeGeo, 0x8a7a6a);
        ridge.position.set(16050, 3100, -3200);
        addObject(ridge);

        // Ben Lomond lower slopes — green forest
        var forGeo = new THREE.CylinderGeometry(0, 1600, 800, 8);
        var forSlope = makeMesh(forGeo, 0x2a4a1a);
        forSlope.position.set(16200, 400, -2800);
        addObject(forSlope);

        // Reflection in loch (flat shimmer near east bank)
        var reflGeo = new THREE.BoxGeometry(400, 1, 600);
        var refl = makeMesh(reflGeo, 0x0a1a3a);
        refl.position.set(15700, 0, -2800);
        addObject(refl);
    }

    function buildBalloch() {
        // Balloch — southern town, gateway to loch

        // Ground / town base
        var townBase = new THREE.BoxGeometry(2000, 20, 1200);
        var town = makeMesh(townBase, 0x5a5a4a);
        town.position.set(15000, 10, 3400);
        addObject(town);

        // Balloch Castle Country Park — castle ruins on hill
        var castleHillGeo = new THREE.CylinderGeometry(0, 300, 200, 6);
        var castleHill = makeMesh(castleHillGeo, 0x6a6a5a);
        castleHill.position.set(14400, 100, 3200);
        addObject(castleHill);

        // Castle tower
        var castleTowerGeo = new THREE.BoxGeometry(120, 280, 120);
        var castleTower = makeMesh(castleTowerGeo, 0x888070);
        castleTower.position.set(14400, 340, 3200);
        addObject(castleTower);

        // Castle battlements
        var battGeo = new THREE.BoxGeometry(140, 60, 140);
        var batt = makeMesh(battGeo, 0x7a7060);
        batt.position.set(14400, 510, 3200);
        addObject(batt);

        // Visitor centre — long rectangular building
        var vcGeo = new THREE.BoxGeometry(400, 80, 200);
        var vc = makeMesh(vcGeo, 0x9a8a7a);
        vc.position.set(15000, 40, 3500);
        addObject(vc);

        // Visitor centre roof
        var vcRoofGeo = new THREE.BoxGeometry(420, 40, 220);
        var vcRoof = makeMesh(vcRoofGeo, 0x6a5a4a);
        vcRoof.position.set(15000, 100, 3500);
        addObject(vcRoof);

        // Marina — series of dock planks
        var marinaBaseGeo = new THREE.BoxGeometry(800, 10, 300);
        var marina = makeMesh(marinaBaseGeo, 0x8a6a3a);
        marina.position.set(15200, 5, 2800);
        addObject(marina);

        // Marina dock fingers
        for (var di = 0; di < 5; di++) {
            var dockGeo = new THREE.BoxGeometry(40, 8, 200);
            var dock = makeMesh(dockGeo, 0x7a5a2a);
            dock.position.set(14900 + di * 130, 4, 2700);
            addObject(dock);
        }

        // Boats at marina
        var boatColors = [0xcc2222, 0x2255cc, 0xccaa22, 0x22aa55];
        for (var boi = 0; boi < 4; boi++) {
            var hullGeo = new THREE.BoxGeometry(80, 30, 160);
            var hull = makeMesh(hullGeo, boatColors[boi]);
            hull.position.set(14890 + boi * 130, 20, 2680);
            addObject(hull);

            var cabinGeo = new THREE.BoxGeometry(50, 35, 70);
            var cabin = makeMesh(cabinGeo, 0xeeeecc);
            cabin.position.set(14890 + boi * 130, 50, 2660);
            addObject(cabin);
        }

        // Paddle steamer — steamship pier and vessel
        var pierGeo = new THREE.BoxGeometry(60, 12, 500);
        var pier = makeMesh(pierGeo, 0x7a6a5a);
        pier.position.set(15500, 6, 2550);
        addObject(pier);

        // Paddle steamer hull
        var steamHullGeo = new THREE.BoxGeometry(120, 45, 350);
        var steamHull = makeMesh(steamHullGeo, 0xccccaa);
        steamHull.position.set(15500, 30, 2250);
        addObject(steamHull);

        // Paddle wheel housings
        var paddleGeo = new THREE.CylinderGeometry(60, 60, 40, 8);
        var padL = makeMesh(paddleGeo, 0x8a3a1a);
        padL.rotation.z = Math.PI / 2;
        padL.position.set(15360, 30, 2250);
        addObject(padL);

        var padR = makeMesh(paddleGeo.clone ? paddleGeo.clone() : new THREE.CylinderGeometry(60, 60, 40, 8), 0x8a3a1a);
        padR.rotation.z = Math.PI / 2;
        padR.position.set(15640, 30, 2250);
        addObject(padR);

        // Steamship funnel / smokestack
        var funnelGeo = new THREE.CylinderGeometry(18, 22, 100, 8);
        var funnel = makeMesh(funnelGeo, 0x2a1a1a);
        funnel.position.set(15500, 97, 2200);
        addObject(funnel);

        // Funnel top band (red)
        var bandGeo = new THREE.CylinderGeometry(22, 22, 20, 8);
        var band = makeMesh(bandGeo, 0xcc1111);
        band.position.set(15500, 147, 2200);
        addObject(band);

        // Steamer cabin / deck
        var sCabinGeo = new THREE.BoxGeometry(100, 40, 200);
        var sCabin = makeMesh(sCabinGeo, 0xddddbb);
        sCabin.position.set(15500, 72, 2250);
        addObject(sCabin);

        // Town houses — row of buildings
        var houseColors = [0xcc9966, 0xaa8855, 0xbbaa88, 0x998877, 0xccaa77];
        for (var hi = 0; hi < 8; hi++) {
            var houseGeo = new THREE.BoxGeometry(100, 120, 100);
            var house = makeMesh(houseGeo, houseColors[hi % houseColors.length]);
            house.position.set(14700 + hi * 120, 60, 3700);
            addObject(house);

            var roofGeo = new THREE.ConeGeometry(78, 60, 4);
            var roof = makeMesh(roofGeo, 0x553322);
            roof.rotation.y = Math.PI / 4;
            roof.position.set(14700 + hi * 120, 150, 3700);
            addObject(roof);
        }
    }

    function buildIslands() {
        // Inchmurrin — largest freshwater island in Scotland
        var inchmurrinBase = new THREE.BoxGeometry(1200, 25, 600);
        var inchmurrin = makeMesh(inchmurrinBase, 0x3a6a3a);
        inchmurrin.position.set(14800, 12, 1200);
        addObject(inchmurrin);

        // Inchmurrin terrain hills
        var im1 = new THREE.SphereGeometry(220, 6, 5);
        var imh1 = makeMesh(im1, 0x4a7a3a);
        imh1.position.set(14700, 100, 1100);
        addObject(imh1);

        var im2 = new THREE.SphereGeometry(180, 6, 5);
        var imh2 = makeMesh(im2, 0x4a7a3a);
        imh2.position.set(14950, 90, 1300);
        addObject(imh2);

        // Ruined castle of Lennox on Inchmurrin
        var lennoxGeo = new THREE.BoxGeometry(80, 100, 80);
        var lennox = makeMesh(lennoxGeo, 0x888080);
        lennox.position.set(14700, 112, 1200);
        addObject(lennox);

        var lennoxWallGeo = new THREE.BoxGeometry(160, 60, 20);
        var lennoxWall = makeMesh(lennoxWallGeo, 0x787878);
        lennoxWall.position.set(14700, 80, 1240);
        addObject(lennoxWall);

        // Ruined tower partial
        var lTowerGeo = new THREE.CylinderGeometry(35, 40, 80, 6);
        var lTower = makeMesh(lTowerGeo, 0x909090);
        lTower.position.set(14760, 90, 1170);
        addObject(lTower);

        // Outline box around Inchmurrin (island marker)
        var outlineGeo = new THREE.BoxGeometry(1210, 2, 610);
        var outline = makeMesh(outlineGeo, 0x558855);
        outline.position.set(14800, 26, 1200);
        addObject(outline);

        // Inchcailloch — nature reserve island, old church ruin
        var inchcailBase = new THREE.BoxGeometry(600, 20, 400);
        var inchcail = makeMesh(inchcailBase, 0x2a5a2a);
        inchcail.position.set(15400, 10, -200);
        addObject(inchcail);

        // Church ruin on Inchcailloch
        var churchGeo = new THREE.BoxGeometry(60, 70, 100);
        var church = makeMesh(churchGeo, 0x888888);
        church.position.set(15400, 55, -200);
        addObject(church);

        // Church tower ruined
        var cTowerGeo = new THREE.BoxGeometry(30, 90, 30);
        var cTower = makeMesh(cTowerGeo, 0x7a7a7a);
        cTower.position.set(15370, 65, -170);
        addObject(cTower);

        // Trees on Inchcailloch (nature reserve)
        var treePositions = [
            [15300, -200], [15350, -280], [15430, -130], [15480, -220], [15520, -180]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var tPos = treePositions[ti];
            var trunkGeo = new THREE.CylinderGeometry(8, 12, 60, 5);
            var trunk = makeMesh(trunkGeo, 0x5a3a1a);
            trunk.position.set(tPos[0], 50, tPos[1]);
            addObject(trunk);

            var foliageGeo = new THREE.SphereGeometry(50, 5, 4);
            var foliage = makeMesh(foliageGeo, 0x1a5a1a);
            foliage.position.set(tPos[0], 110, tPos[1]);
            addObject(foliage);
        }

        // Inchmoan — woodland island
        var inchmoanBase = new THREE.BoxGeometry(500, 18, 350);
        var inchmoan = makeMesh(inchmoanBase, 0x2a4a2a);
        inchmoan.position.set(14900, 9, -600);
        addObject(inchmoan);

        // Dense woodland on Inchmoan
        var woodPositions = [
            [14820, -600], [14870, -640], [14920, -570], [14960, -620], [15000, -590]
        ];
        for (var wi = 0; wi < woodPositions.length; wi++) {
            var wPos = woodPositions[wi];
            var wTrunkGeo = new THREE.CylinderGeometry(6, 10, 50, 5);
            var wTrunk = makeMesh(wTrunkGeo, 0x4a2a0a);
            wTrunk.position.set(wPos[0], 43, wPos[1]);
            addObject(wTrunk);

            var wFolGeo = new THREE.ConeGeometry(45, 80, 5);
            var wFol = makeMesh(wFolGeo, 0x0a3a0a);
            wFol.position.set(wPos[0], 110, wPos[1]);
            addObject(wFol);
        }

        // Small unnamed island outline
        var smallIsleGeo = new THREE.BoxGeometry(180, 15, 140);
        var smallIsle = makeMesh(smallIsleGeo, 0x3a5a3a);
        smallIsle.position.set(15100, 7, -900);
        addObject(smallIsle);
    }

    function buildRobRoyCountry() {
        // Crianlarich area — northern end of loch, highland terrain
        var highlandBase = new THREE.BoxGeometry(3000, 30, 2000);
        var highland = makeMesh(highlandBase, 0x4a5a3a);
        highland.position.set(14800, 15, -7500);
        addObject(highland);

        // Hills around Crianlarich
        var hillData = [
            [13800, -7000, 800, 1600],
            [14200, -7800, 700, 1400],
            [15000, -7200, 900, 1800],
            [15600, -7600, 600, 1200]
        ];
        for (var hci = 0; hci < hillData.length; hci++) {
            var hd = hillData[hci];
            var hGeo = new THREE.ConeGeometry(hd[2], hd[3], 7);
            var hm = makeMesh(hGeo, 0x5a5040);
            hm.position.set(hd[0], hd[3] / 2 + 15, hd[1]);
            addObject(hm);
        }

        // Rob Roy's grave marker — Balquhidder churchyard
        var graveGroundGeo = new THREE.BoxGeometry(300, 10, 300);
        var graveGround = makeMesh(graveGroundGeo, 0x4a4a3a);
        graveGround.position.set(14200, 5, -7300);
        addObject(graveGround);

        // Church at Balquhidder
        var bChurchGeo = new THREE.BoxGeometry(100, 80, 160);
        var bChurch = makeMesh(bChurchGeo, 0x9a9080);
        bChurch.position.set(14200, 40, -7350);
        addObject(bChurch);

        var bChurchRoofGeo = new THREE.BoxGeometry(110, 40, 170);
        var bChurchRoof = makeMesh(bChurchRoofGeo, 0x6a6050);
        bChurchRoof.position.set(14200, 100, -7350);
        addObject(bChurchRoof);

        var bTowerGeo = new THREE.BoxGeometry(40, 120, 40);
        var bTower = makeMesh(bTowerGeo, 0x8a8878);
        bTower.position.set(14220, 60, -7260);
        addObject(bTower);

        // Rob Roy grave slab
        var graveSlabGeo = new THREE.BoxGeometry(60, 8, 120);
        var graveSlab = makeMesh(graveSlabGeo, 0x787870);
        graveSlab.position.set(14200, 14, -7300);
        addObject(graveSlab);

        // Grave marker upright stone
        var headstoneGeo = new THREE.BoxGeometry(20, 60, 8);
        var headstone = makeMesh(headstoneGeo, 0x686860);
        headstone.position.set(14200, 47, -7245);
        addObject(headstone);

        // Killin village with Falls of Dochart
        var killinBase = new THREE.BoxGeometry(800, 15, 600);
        var killin = makeMesh(killinBase, 0x5a5a4a);
        killin.position.set(13800, 7, -8500);
        addObject(killinBase);

        // Falls of Dochart — rushing waterfall (stepped box cascade)
        var fallsData = [
            [13800, 80, -8200, 200, 20, 20],
            [13800, 60, -8220, 200, 20, 20],
            [13800, 40, -8240, 200, 20, 20],
            [13800, 20, -8260, 200, 20, 20]
        ];
        for (var fi = 0; fi < fallsData.length; fi++) {
            var fd = fallsData[fi];
            var fallGeo = new THREE.BoxGeometry(fd[3], fd[4], fd[5]);
            var fall = makeMesh(fallGeo, 0x88aacc);
            fall.position.set(fd[0], fd[1], fd[2]);
            addObject(fall);
        }

        // Waterfall base pool
        var poolGeo = new THREE.BoxGeometry(300, 10, 200);
        var pool = makeMesh(poolGeo, 0x2255aa);
        pool.position.set(13800, 5, -8300);
        addObject(pool);

        // River Dochart channel
        var riverGeo = new THREE.BoxGeometry(80, 8, 1000);
        var river = makeMesh(riverGeo, 0x3366bb);
        river.position.set(13800, 4, -8000);
        addObject(river);

        // Breadalbane Folklore Centre
        var bfcGeo = new THREE.BoxGeometry(200, 100, 150);
        var bfc = makeMesh(bfcGeo, 0xaa9988);
        bfc.position.set(13700, 50, -8550);
        addObject(bfc);

        var bfcRoofGeo = new THREE.ConeGeometry(160, 60, 4);
        var bfcRoof = makeMesh(bfcRoofGeo, 0x664433);
        bfcRoof.rotation.y = Math.PI / 4;
        bfcRoof.position.set(13700, 130, -8550);
        addObject(bfcRoof);

        // Killin houses
        for (var ki = 0; ki < 6; ki++) {
            var kHouseGeo = new THREE.BoxGeometry(80, 100, 80);
            var kHouse = makeMesh(kHouseGeo, 0x998877);
            kHouse.position.set(13600 + ki * 100, 50, -8700);
            addObject(kHouse);

            var kRoofGeo = new THREE.ConeGeometry(62, 50, 4);
            var kRoof = makeMesh(kRoofGeo, 0x553322);
            kRoof.rotation.y = Math.PI / 4;
            kRoof.position.set(13600 + ki * 100, 125, -8700);
            addObject(kRoof);
        }
    }

    function buildWestHighlandWay() {
        // West Highland Way — path along loch's east shore
        // Series of waymarker posts (thistle-symbol posts)

        var waypointZ = [3000, 2000, 1000, 0, -1000, -2000, -3000, -4000, -5000];
        for (var wpi = 0; wpi < waypointZ.length; wpi++) {
            var wpz = waypointZ[wpi];
            // Post
            var postGeo = new THREE.CylinderGeometry(6, 6, 100, 5);
            var post = makeMesh(postGeo, 0x8a7a5a);
            post.position.set(16500, 50, wpz);
            addObject(post);

            // Thistle-style cap on post (flared sphere)
            var capGeo = new THREE.SphereGeometry(14, 5, 4);
            var cap = makeMesh(capGeo, 0x7a3a8a);
            cap.position.set(16500, 108, wpz);
            addObject(cap);

            // Direction arrow slab
            var arrowGeo = new THREE.BoxGeometry(60, 8, 20);
            var arrow = makeMesh(arrowGeo, 0xaaaaaa);
            arrow.position.set(16530, 90, wpz);
            addObject(arrow);
        }

        // Footpath — series of path segments
        for (var psi = 0; psi < 16; psi++) {
            var pathGeo = new THREE.BoxGeometry(40, 4, 500);
            var path = makeMesh(pathGeo, 0x8a7a5a);
            path.position.set(16480, 2, 3200 - psi * 620);
            addObject(path);
        }

        // Bridge crossings — small stream bridges
        var bridgePositions = [1800, -500, -2500, -4500];
        for (var bri = 0; bri < bridgePositions.length; bri++) {
            var bridgeZ = bridgePositions[bri];

            // Bridge deck
            var bDeckGeo = new THREE.BoxGeometry(80, 12, 80);
            var bDeck = makeMesh(bDeckGeo, 0x7a6a4a);
            bDeck.position.set(16480, 8, bridgeZ);
            addObject(bDeck);

            // Bridge rails
            var bRailLGeo = new THREE.BoxGeometry(8, 30, 80);
            var bRailL = makeMesh(bRailLGeo, 0x9a8a6a);
            bRailL.position.set(16440, 20, bridgeZ);
            addObject(bRailL);

            var bRailRGeo = new THREE.BoxGeometry(8, 30, 80);
            var bRailR = makeMesh(bRailRGeo, 0x9a8a6a);
            bRailR.position.set(16520, 20, bridgeZ);
            addObject(bRailR);
        }

        // Tent camp sites along the way
        var campPositions = [
            [16600, 800],
            [16550, -1500],
            [16620, -3800]
        ];
        for (var ci = 0; ci < campPositions.length; ci++) {
            var cp = campPositions[ci];

            // Tent — triangular prism approximated with cone
            var tentGeo = new THREE.ConeGeometry(45, 60, 4);
            var tent = makeMesh(tentGeo, 0xcc8833);
            tent.rotation.y = Math.PI / 4;
            tent.position.set(cp[0], 30, cp[1]);
            addObject(tent);

            // Tent entrance slab
            var tentDoorGeo = new THREE.BoxGeometry(20, 30, 5);
            var tentDoor = makeMesh(tentDoorGeo, 0xaa6622);
            tentDoor.position.set(cp[0], 15, cp[1] + 46);
            addObject(tentDoor);

            // Firepit
            var fireGeo = new THREE.CylinderGeometry(15, 20, 10, 6);
            var fire = makeMesh(fireGeo, 0x3a3a3a);
            fire.position.set(cp[0] + 60, 5, cp[1]);
            addObject(fire);
        }

        // Lochside terrain — east shore vegetation
        var shoreVegData = [
            [16200, 0, 200, 300, 80],
            [16300, 0, 1000, 250, 70],
            [16100, 0, -500, 350, 90],
            [16250, 0, -1800, 280, 75]
        ];
        for (var svi = 0; svi < shoreVegData.length; svi++) {
            var svd = shoreVegData[svi];
            var vegGeo = new THREE.SphereGeometry(svd[3], 5, 4);
            var veg = makeMesh(vegGeo, 0x2a5a1a);
            veg.scale.y = 0.4;
            veg.position.set(svd[0], svd[4] * 0.4 / 2, svd[2]);
            addObject(veg);
        }
    }

    function buildAmbience() {
        // Surrounding highland terrain
        var terrainData = [
            [13000, 0, 0, 2000, 30, 12000, 0x4a5a3a],
            [17500, 0, 0, 2000, 30, 12000, 0x4a5a3a],
            [15000, 0, -10000, 6000, 30, 2000, 0x3a4a2a],
            [15000, 0, 5000, 6000, 30, 2000, 0x5a6a4a]
        ];
        for (var tri = 0; tri < terrainData.length; tri++) {
            var td = terrainData[tri];
            var tGeo = new THREE.BoxGeometry(td[3], td[4], td[5]);
            var tm = makeMesh(tGeo, td[6]);
            tm.position.set(td[0], td[1], td[2]);
            addObject(tm);
        }

        // Highland hills — Trossachs area
        var trossachsHills = [
            [13200, 3000, 500, 1000],
            [13500, 1500, 600, 1200],
            [14000, 4500, 400, 800],
            [17000, -1000, 700, 1400],
            [17300, 2000, 550, 1100],
            [16800, 4000, 450, 900]
        ];
        for (var thi = 0; thi < trossachsHills.length; thi++) {
            var th = trossachsHills[thi];
            var thGeo = new THREE.ConeGeometry(th[2], th[3], 7);
            var thm = makeMesh(thGeo, 0x5a6050);
            thm.position.set(th[0], th[3] / 2, th[1]);
            addObject(thm);
        }

        // Heather moorland patches
        var moorData = [
            [13500, 1500, 400, 200],
            [16800, -500, 350, 180],
            [13200, -2000, 300, 150],
            [17000, 3000, 380, 190]
        ];
        for (var mi = 0; mi < moorData.length; mi++) {
            var md = moorData[mi];
            var moorGeo = new THREE.BoxGeometry(md[2], 12, md[3]);
            var moor = makeMesh(moorGeo, 0x7a4a7a);
            moor.position.set(md[0], 6, md[1]);
            addObject(moor);
        }

        // River Falloch — flows into northern loch
        var fallochData = [
            [14700, -6000, 60, 8, 2000],
            [14700, -7000, 60, 8, 2000],
            [14700, -8000, 60, 8, 2000]
        ];
        for (var fali = 0; fali < fallochData.length; fali++) {
            var fald = fallochData[fali];
            var falGeo = new THREE.BoxGeometry(fald[2], fald[3], fald[4]);
            var falm = makeMesh(falGeo, 0x3366bb);
            falm.position.set(fald[0], fald[1] === -6000 ? 3 : (fald[1] === -7000 ? 8 : 15), fald[1]);
            addObject(falm);
        }

        // Loch shore pebble beaches
        var beachData = [
            [15000, 2500, 3200, 15, 200, 0x8a8a7a],
            [13400, 0, 200, 15, 2000, 0x9a9a8a]
        ];
        for (var bei = 0; bei < beachData.length; bei++) {
            var bed = beachData[bei];
            var beGeo = new THREE.BoxGeometry(bed[2], bed[3], bed[4]);
            var bem = makeMesh(beGeo, bed[5]);
            bem.position.set(bed[0], 7, bed[1]);
            addObject(bem);
        }
    }

    function build() {
        buildLoch();
        buildBenLomond();
        buildBalloch();
        buildIslands();
        buildRobRoyCountry();
        buildWestHighlandWay();
        buildAmbience();
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
