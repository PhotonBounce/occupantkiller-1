window.StrangfordLough = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildLough();
        buildTidalNarrows();
        buildDrumlinIslands();
        buildScraboTower();
        buildCastleWard();
        buildStrangfordVillage();
        buildPortaferry();
        buildNendrumMonasticSite();
        buildTidalMill();
        buildSeals();
        buildShoreFeatures();
    }

    // --- Strangford Lough water body ---
    function buildLough() {
        // Main lough body — large flat box for water surface
        var waterGeo = new THREE.BoxGeometry(3200, 2, 2400);
        var waterMat = makeMat(0x1E6BA8);
        var water = new THREE.Mesh(waterGeo, waterMat);
        water.position.set(19400, -1, 0);
        addMesh(water);

        // Inner lough extensions
        var innerGeo = new THREE.BoxGeometry(800, 2, 600);
        var inner = new THREE.Mesh(innerGeo, makeMat(0x1A5F96));
        inner.position.set(19800, -1, -500);
        addMesh(inner);

        var shallowGeo = new THREE.BoxGeometry(1200, 2, 400);
        var shallow = new THREE.Mesh(shallowGeo, makeMat(0x2A7EC0));
        shallow.position.set(18800, -1, 600);
        addMesh(shallow);

        // Lough floor/bed visible at edges
        var bedGeo = new THREE.BoxGeometry(3400, 4, 2600);
        var bed = new THREE.Mesh(bedGeo, makeMat(0x4A3728));
        bed.position.set(19400, -4, 0);
        addMesh(bed);
    }

    // --- Tidal narrows at south ---
    function buildTidalNarrows() {
        // The narrow strait between Strangford and Portaferry
        var narrowsGeo = new THREE.BoxGeometry(200, 2, 500);
        var narrows = new THREE.Mesh(narrowsGeo, makeMat(0x0D4F82));
        narrows.position.set(19400, -1, 1100);
        addMesh(narrows);

        // Tidal race markers — rocky outcrops
        var rock1Geo = new THREE.BoxGeometry(20, 8, 20);
        var rock1 = new THREE.Mesh(rock1Geo, makeMat(0x555555));
        rock1.position.set(19350, 2, 1050);
        addMesh(rock1);

        var rock2Geo = new THREE.BoxGeometry(16, 6, 16);
        var rock2 = new THREE.Mesh(rock2Geo, makeMat(0x555555));
        rock2.position.set(19450, 1, 1080);
        addMesh(rock2);

        // Current swirl representation — dark patches
        var swirlGeo = new THREE.CylinderGeometry(40, 50, 1, 8);
        var swirl = new THREE.Mesh(swirlGeo, makeMat(0x0A3D6B));
        swirl.position.set(19400, 0, 1120);
        addMesh(swirl);
    }

    // --- Drumlin islands in the lough ---
    function buildDrumlinIslands() {
        var islandData = [
            [19200, 200],
            [19600, -300],
            [18900, -100],
            [19100, 400],
            [19700, 300],
            [18700, 500],
            [19500, -600],
            [19300, -800],
            [18800, -700]
        ];

        for (var i = 0; i < islandData.length; i++) {
            var ix = islandData[i][0];
            var iz = islandData[i][1];
            var size = 40 + (i % 4) * 20;
            var height = 8 + (i % 3) * 4;

            // Drumlin base — elongated box
            var baseGeo = new THREE.BoxGeometry(size * 2, height, size);
            var base = new THREE.Mesh(baseGeo, makeMat(0x228B22));
            base.position.set(ix, height / 2, iz);
            addMesh(base);

            // Drumlin top rounded hump — cylinder
            var humpGeo = new THREE.CylinderGeometry(size * 0.4, size * 0.8, height * 0.6, 8);
            var hump = new THREE.Mesh(humpGeo, makeMat(0x2E9B30));
            hump.position.set(ix, height + height * 0.2, iz);
            addMesh(hump);
        }
    }

    // --- Scrabo Tower on hilltop ---
    function buildScraboTower() {
        var bx = 18200;
        var bz = -900;

        // Scrabo Hill
        var hillGeo = new THREE.CylinderGeometry(180, 260, 60, 10);
        var hill = new THREE.Mesh(hillGeo, makeMat(0x4A7A3A));
        hill.position.set(bx, 30, bz);
        addMesh(hill);

        // Hill top plateau
        var plateauGeo = new THREE.CylinderGeometry(100, 180, 10, 10);
        var plateau = new THREE.Mesh(plateauGeo, makeMat(0x3D6B30));
        plateau.position.set(bx, 62, bz);
        addMesh(plateau);

        // Scrabo Tower shaft — tall dark basalt cylinder
        var towerGeo = new THREE.CylinderGeometry(8, 10, 100, 12);
        var tower = new THREE.Mesh(towerGeo, makeMat(0x808080));
        tower.position.set(bx, 118, bz);
        addMesh(tower);

        // Tower battlements top — slightly wider ring
        var battleGeo = new THREE.CylinderGeometry(12, 8, 10, 12);
        var battle = new THREE.Mesh(battleGeo, makeMat(0x707070));
        battle.position.set(bx, 173, bz);
        addMesh(battle);

        // Conical cap
        var capGeo = new THREE.ConeGeometry(13, 20, 12);
        var cap = new THREE.Mesh(capGeo, makeMat(0x5A5A5A));
        cap.position.set(bx, 190, bz);
        addMesh(cap);

        // Tower base plinth
        var plinthGeo = new THREE.BoxGeometry(26, 8, 26);
        var plinth = new THREE.Mesh(plinthGeo, makeMat(0x909090));
        plinth.position.set(bx, 71, bz);
        addMesh(plinth);

        // Country park trees
        var treePositions = [
            [bx + 40, bz + 30],
            [bx - 50, bz + 20],
            [bx + 60, bz - 40],
            [bx - 30, bz - 60],
            [bx + 80, bz + 60]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0];
            var tz = treePositions[t][1];
            var trunkGeo = new THREE.CylinderGeometry(2, 3, 14, 6);
            var trunk = new THREE.Mesh(trunkGeo, makeMat(0x5C3A1E));
            trunk.position.set(tx, 74, tz);
            addMesh(trunk);

            var canopyGeo = new THREE.SphereGeometry(10, 8, 6);
            var canopy = new THREE.Mesh(canopyGeo, makeMat(0x2E7D32));
            canopy.position.set(tx, 90, tz);
            addMesh(canopy);
        }
    }

    // --- Castle Ward ---
    function buildCastleWard() {
        var bx = 19000;
        var bz = -700;

        // Grounds / lawn
        var groundGeo = new THREE.BoxGeometry(300, 2, 200);
        var ground = new THREE.Mesh(groundGeo, makeMat(0x4A7A3A));
        ground.position.set(bx, 1, bz);
        addMesh(ground);

        // Main house body — Classical Palladian facade (west)
        var classGeo = new THREE.BoxGeometry(80, 40, 50);
        var classBody = new THREE.Mesh(classGeo, makeMat(0xF5F0E8));
        classBody.position.set(bx - 20, 21, bz);
        addMesh(classBody);

        // Classical portico columns
        for (var col = 0; col < 4; col++) {
            var colGeo = new THREE.CylinderGeometry(2, 2, 30, 8);
            var colMesh = new THREE.Mesh(colGeo, makeMat(0xEEE8D8));
            colMesh.position.set(bx - 62 + col * 8, 17, bz);
            addMesh(colMesh);
        }

        // Classical pediment triangle
        var pedGeo = new THREE.ConeGeometry(18, 10, 3);
        var ped = new THREE.Mesh(pedGeo, makeMat(0xF5F0E8));
        ped.rotation.y = Math.PI / 6;
        ped.position.set(bx - 48, 43, bz);
        addMesh(ped);

        // Gothic east facade — pointed arch windows represented as tall thin boxes
        var gothicBodyGeo = new THREE.BoxGeometry(80, 40, 50);
        var gothicBody = new THREE.Mesh(gothicBodyGeo, makeMat(0xEDE8D5));
        gothicBody.position.set(bx + 40, 21, bz);
        addMesh(gothicBody);

        // Gothic turret on corner
        var turretGeo = new THREE.CylinderGeometry(5, 6, 50, 8);
        var turret = new THREE.Mesh(turretGeo, makeMat(0xDDD8C5));
        turret.position.set(bx + 82, 26, bz - 22);
        addMesh(turret);

        var turretCapGeo = new THREE.ConeGeometry(6, 12, 8);
        var turretCap = new THREE.Mesh(turretCapGeo, makeMat(0xC0B8A0));
        turretCap.position.set(bx + 82, 57, bz - 22);
        addMesh(turretCap);

        // Gothic window arches (decorative boxes)
        for (var w = 0; w < 3; w++) {
            var winGeo = new THREE.BoxGeometry(6, 14, 3);
            var win = new THREE.Mesh(winGeo, makeMat(0x8B7355));
            win.position.set(bx + 20 + w * 14, 24, bz + 26);
            addMesh(win);

            var winTopGeo = new THREE.ConeGeometry(3, 6, 3);
            var winTop = new THREE.Mesh(winTopGeo, makeMat(0x8B7355));
            winTop.position.set(bx + 20 + w * 14, 35, bz + 26);
            addMesh(winTop);
        }

        // House roof
        var roofGeo = new THREE.BoxGeometry(170, 8, 54);
        var roof = new THREE.Mesh(roofGeo, makeMat(0x808080));
        roof.position.set(bx + 5, 42, bz);
        addMesh(roof);

        // Walled garden walls
        var wallNGeo = new THREE.BoxGeometry(120, 10, 4);
        var wallN = new THREE.Mesh(wallNGeo, makeMat(0xC8C0A0));
        wallN.position.set(bx, 6, bz - 80);
        addMesh(wallN);

        var wallSGeo = new THREE.BoxGeometry(120, 10, 4);
        var wallS = new THREE.Mesh(wallSGeo, makeMat(0xC8C0A0));
        wallS.position.set(bx, 6, bz + 80);
        addMesh(wallS);
    }

    // --- Strangford village ---
    function buildStrangfordVillage() {
        var bx = 19500;
        var bz = 900;

        // Shore terrace — a row of white cottages
        var houseData = [
            [bx - 60, bz],
            [bx - 30, bz],
            [bx, bz],
            [bx + 30, bz],
            [bx + 60, bz]
        ];
        for (var h = 0; h < houseData.length; h++) {
            var hx = houseData[h][0];
            var hz = houseData[h][1];

            var houseGeo = new THREE.BoxGeometry(24, 18, 16);
            var house = new THREE.Mesh(houseGeo, makeMat(0xFFFFF0));
            house.position.set(hx, 10, hz);
            addMesh(house);

            var roofGeo = new THREE.BoxGeometry(26, 6, 18);
            var roof = new THREE.Mesh(roofGeo, makeMat(0x8B4513));
            roof.position.set(hx, 22, hz);
            addMesh(roof);
        }

        // Strangford Castle — tower house ruin
        var castleGeo = new THREE.CylinderGeometry(7, 8, 30, 8);
        var castle = new THREE.Mesh(castleGeo, makeMat(0x808080));
        castle.position.set(bx + 90, 16, bz - 30);
        addMesh(castle);

        var castleTopGeo = new THREE.CylinderGeometry(9, 7, 6, 8);
        var castleTop = new THREE.Mesh(castleTopGeo, makeMat(0x707070));
        castleTop.position.set(bx + 90, 34, bz - 30);
        addMesh(castleTop);

        // Ferry terminal — jetty
        var jettyGeo = new THREE.BoxGeometry(16, 4, 80);
        var jetty = new THREE.Mesh(jettyGeo, makeMat(0x8B7355));
        jetty.position.set(bx + 120, 2, bz + 20);
        addMesh(jetty);

        // Ferry terminal building
        var termGeo = new THREE.BoxGeometry(30, 14, 20);
        var term = new THREE.Mesh(termGeo, makeMat(0xFFFFF0));
        term.position.set(bx + 100, 8, bz - 10);
        addMesh(term);

        // Village pub / shop
        var pubGeo = new THREE.BoxGeometry(28, 20, 18);
        var pub = new THREE.Mesh(pubGeo, makeMat(0xFFF8DC));
        pub.position.set(bx - 100, 11, bz - 20);
        addMesh(pub);

        // Village road — flat box
        var roadGeo = new THREE.BoxGeometry(200, 1, 12);
        var road = new THREE.Mesh(roadGeo, makeMat(0x555555));
        road.position.set(bx, 1, bz - 30);
        addMesh(road);
    }

    // --- Portaferry ---
    function buildPortaferry() {
        var bx = 19300;
        var bz = 1050;

        // Georgian terraces — larger town
        var terrace1Geo = new THREE.BoxGeometry(100, 22, 18);
        var terrace1 = new THREE.Mesh(terrace1Geo, makeMat(0xCD5C5C));
        terrace1.position.set(bx - 60, 12, bz);
        addMesh(terrace1);

        var terrace2Geo = new THREE.BoxGeometry(80, 22, 18);
        var terrace2 = new THREE.Mesh(terrace2Geo, makeMat(0xC04848));
        terrace2.position.set(bx + 60, 12, bz);
        addMesh(terrace2);

        // Portaferry Castle — small tower house
        var castleGeo = new THREE.BoxGeometry(20, 28, 20);
        var castle = new THREE.Mesh(castleGeo, makeMat(0x808080));
        castle.position.set(bx + 120, 15, bz - 20);
        addMesh(castle);

        var castleBattleGeo = new THREE.BoxGeometry(24, 5, 24);
        var castleBattle = new THREE.Mesh(castleBattleGeo, makeMat(0x707070));
        castleBattle.position.set(bx + 120, 31, bz - 20);
        addMesh(castleBattle);

        // Market square
        var squareGeo = new THREE.BoxGeometry(50, 1, 50);
        var square = new THREE.Mesh(squareGeo, makeMat(0x999980));
        square.position.set(bx, 1, bz - 50);
        addMesh(square);

        // Portaferry Hotel / larger building
        var hotelGeo = new THREE.BoxGeometry(40, 24, 22);
        var hotel = new THREE.Mesh(hotelGeo, makeMat(0xB8A898));
        hotel.position.set(bx - 130, 13, bz - 10);
        addMesh(hotel);

        // Ferry slip on Portaferry side
        var slipGeo = new THREE.BoxGeometry(14, 3, 60);
        var slip = new THREE.Mesh(slipGeo, makeMat(0x8B7355));
        slip.position.set(bx - 160, 1, bz + 20);
        addMesh(slip);

        // Aquarium building (Portaferry has a famous aquarium)
        var aquaGeo = new THREE.BoxGeometry(50, 16, 30);
        var aqua = new THREE.Mesh(aquaGeo, makeMat(0x7BA7BC));
        aqua.position.set(bx - 80, 9, bz + 40);
        addMesh(aqua);
    }

    // --- Nendrum Monastic Site on Mahee Island ---
    function buildNendrumMonasticSite() {
        var bx = 18900;
        var bz = -200;

        // Mahee Island base
        var islandGeo = new THREE.BoxGeometry(160, 6, 120);
        var island = new THREE.Mesh(islandGeo, makeMat(0x5A8A3A));
        island.position.set(bx, 3, bz);
        addMesh(island);

        // Three concentric enclosure walls
        var enclosureSizes = [
            [140, 3, 100, 0xAA9977],
            [100, 5, 70, 0x998866],
            [60, 7, 40, 0x887755]
        ];
        for (var e = 0; e < enclosureSizes.length; e++) {
            var ew = enclosureSizes[e][0];
            var eh = enclosureSizes[e][1];
            var ed = enclosureSizes[e][2];
            var ec = enclosureSizes[e][3];

            // North wall
            var wallNGeo = new THREE.BoxGeometry(ew, eh, 3);
            var wallN = new THREE.Mesh(wallNGeo, makeMat(ec));
            wallN.position.set(bx, eh / 2 + 6, bz - ed / 2);
            addMesh(wallN);

            // South wall
            var wallSGeo = new THREE.BoxGeometry(ew, eh, 3);
            var wallS = new THREE.Mesh(wallSGeo, makeMat(ec));
            wallS.position.set(bx, eh / 2 + 6, bz + ed / 2);
            addMesh(wallS);

            // East wall
            var wallEGeo = new THREE.BoxGeometry(3, eh, ed);
            var wallE = new THREE.Mesh(wallEGeo, makeMat(ec));
            wallE.position.set(bx + ew / 2, eh / 2 + 6, bz);
            addMesh(wallE);

            // West wall
            var wallWGeo = new THREE.BoxGeometry(3, eh, ed);
            var wallW = new THREE.Mesh(wallWGeo, makeMat(ec));
            wallW.position.set(bx - ew / 2, eh / 2 + 6, bz);
            addMesh(wallW);
        }

        // Round tower stump — Nendrum's famous feature
        var roundTowerGeo = new THREE.CylinderGeometry(4, 5, 22, 10);
        var roundTower = new THREE.Mesh(roundTowerGeo, makeMat(0x887755));
        roundTower.position.set(bx, 17, bz);
        addMesh(roundTower);

        // Church ruin walls
        var churchGeo = new THREE.BoxGeometry(24, 10, 14);
        var church = new THREE.Mesh(churchGeo, makeMat(0x9A8866));
        church.position.set(bx + 10, 11, bz + 10);
        addMesh(church);
    }

    // --- Tidal Mill ---
    function buildTidalMill() {
        var bx = 18950;
        var bz = 100;

        // Mill building — stone structure
        var millGeo = new THREE.BoxGeometry(30, 20, 22);
        var mill = new THREE.Mesh(millGeo, makeMat(0x8B7355));
        mill.position.set(bx, 11, bz);
        addMesh(mill);

        // Mill roof
        var millRoofGeo = new THREE.BoxGeometry(32, 6, 24);
        var millRoof = new THREE.Mesh(millRoofGeo, makeMat(0x5C4A2E));
        millRoof.position.set(bx, 24, bz);
        addMesh(millRoof);

        // Mill pond — water retention area
        var pondGeo = new THREE.BoxGeometry(80, 2, 60);
        var pond = new THREE.Mesh(pondGeo, makeMat(0x1E6BA8));
        pond.position.set(bx - 50, 0, bz + 20);
        addMesh(pond);

        // Mill dam / causeway
        var damGeo = new THREE.BoxGeometry(80, 6, 8);
        var dam = new THREE.Mesh(damGeo, makeMat(0x8B7355));
        dam.position.set(bx - 50, 3, bz - 10);
        addMesh(dam);

        // Millwheel pit
        var pitGeo = new THREE.BoxGeometry(8, 14, 22);
        var pit = new THREE.Mesh(pitGeo, makeMat(0x6A5A3A));
        pit.position.set(bx - 19, 7, bz);
        addMesh(pit);
    }

    // --- Seals on rocks ---
    function buildSeals() {
        var sealData = [
            [19550, 800],
            [19580, 820],
            [19530, 790],
            [19600, 810],
            [19560, 840]
        ];

        for (var s = 0; s < sealData.length; s++) {
            var sx = sealData[s][0];
            var sz = sealData[s][1];

            // Rock
            var rockGeo = new THREE.BoxGeometry(10 + s * 2, 3, 8 + s);
            var rock = new THREE.Mesh(rockGeo, makeMat(0x555555));
            rock.position.set(sx, 1, sz);
            addMesh(rock);

            // Seal body — elongated sphere
            var bodyGeo = new THREE.SphereGeometry(4, 8, 6);
            var body = new THREE.Mesh(bodyGeo, makeMat(0x808080));
            body.scale.set(1.8, 0.7, 0.9);
            body.position.set(sx, 6, sz);
            addMesh(body);

            // Seal head
            var headGeo = new THREE.SphereGeometry(2, 8, 6);
            var head = new THREE.Mesh(headGeo, makeMat(0x909090));
            head.position.set(sx + 5, 7, sz);
            addMesh(head);
        }
    }

    // --- Shore features, mudflats, vegetation ---
    function buildShoreFeatures() {
        // Western shore mudflats
        var mudGeo = new THREE.BoxGeometry(80, 1, 400);
        var mud = new THREE.Mesh(mudGeo, makeMat(0x6B5040));
        mud.position.set(17860, 0, 0);
        addMesh(mud);

        // Eastern shore
        var mudEGeo = new THREE.BoxGeometry(80, 1, 400);
        var mudE = new THREE.Mesh(mudEGeo, makeMat(0x6B5040));
        mudE.position.set(20940, 0, 0);
        addMesh(mudE);

        // Reeds / vegetation clusters on shore (cylinders)
        var reedData = [
            [18000, -400],
            [18050, -350],
            [18020, -420],
            [20800, 200],
            [20820, 180]
        ];
        for (var r = 0; r < reedData.length; r++) {
            var reedGeo = new THREE.CylinderGeometry(0.5, 1, 6 + (r % 3), 5);
            var reed = new THREE.Mesh(reedGeo, makeMat(0x6B8E23));
            reed.position.set(reedData[r][0], 3, reedData[r][1]);
            addMesh(reed);
        }

        // Rocky outcrops along shore
        var outcropData = [
            [18100, 600, 0x666666, 16, 5, 12],
            [18200, -600, 0x555555, 20, 4, 16],
            [20600, 400, 0x666666, 14, 6, 10],
            [20700, -500, 0x555555, 18, 5, 14]
        ];
        for (var o = 0; o < outcropData.length; o++) {
            var od = outcropData[o];
            var ocGeo = new THREE.BoxGeometry(od[3], od[4], od[5]);
            var oc = new THREE.Mesh(ocGeo, makeMat(od[2]));
            oc.position.set(od[0], od[4] / 2, od[1]);
            addMesh(oc);
        }

        // Hillside terrain behind Strangford village
        var hillGeo = new THREE.BoxGeometry(400, 30, 200);
        var hill = new THREE.Mesh(hillGeo, makeMat(0x4A7A3A));
        hill.position.set(19500, 16, 1150);
        addMesh(hill);

        // Farmland patches on County Down slopes
        var farm1Geo = new THREE.BoxGeometry(300, 2, 200);
        var farm1 = new THREE.Mesh(farm1Geo, makeMat(0x7CBA5A));
        farm1.position.set(18400, 1, -800);
        addMesh(farm1);

        var farm2Geo = new THREE.BoxGeometry(250, 2, 180);
        var farm2 = new THREE.Mesh(farm2Geo, makeMat(0x6AAA48));
        farm2.position.set(18600, 1, -1050);
        addMesh(farm2);

        // Hedgerow dividers
        var hedge1Geo = new THREE.BoxGeometry(200, 4, 4);
        var hedge1 = new THREE.Mesh(hedge1Geo, makeMat(0x2D6A2D));
        hedge1.position.set(18400, 3, -700);
        addMesh(hedge1);

        var hedge2Geo = new THREE.BoxGeometry(4, 4, 180);
        var hedge2 = new THREE.Mesh(hedge2Geo, makeMat(0x2D6A2D));
        hedge2.position.set(18300, 3, -800);
        addMesh(hedge2);

        // Newtownards town hint — distant blocks
        var townGeo = new THREE.BoxGeometry(200, 15, 150);
        var town = new THREE.Mesh(townGeo, makeMat(0xBBBBBB));
        town.position.set(18000, 8, -1100);
        addMesh(town);

        // Quoile river estuary channel
        var quoileGeo = new THREE.BoxGeometry(20, 2, 300);
        var quoile = new THREE.Mesh(quoileGeo, makeMat(0x2A7EC0));
        quoile.position.set(19350, 0, -950);
        addMesh(quoile);

        // Killyleagh castle hint (south-west shore)
        var killGeo = new THREE.CylinderGeometry(6, 7, 35, 8);
        var kill = new THREE.Mesh(killGeo, makeMat(0x909090));
        kill.position.set(18500, 18, 700);
        addMesh(kill);

        var killCapGeo = new THREE.ConeGeometry(7, 14, 8);
        var killCap = new THREE.Mesh(killCapGeo, makeMat(0x707070));
        killCap.position.set(18500, 42, 700);
        addMesh(killCap);

        // Sunken boat wreck in shallows
        var boatHullGeo = new THREE.BoxGeometry(16, 4, 6);
        var boatHull = new THREE.Mesh(boatHullGeo, makeMat(0x4A3020));
        boatHull.position.set(19150, 1, 300);
        boatHull.rotation.y = 0.4;
        addMesh(boatHull);

        // Fishing boat moored at Strangford
        var fishBoatGeo = new THREE.BoxGeometry(18, 5, 7);
        var fishBoat = new THREE.Mesh(fishBoatGeo, makeMat(0x4466AA));
        fishBoat.position.set(19540, 3, 870);
        addMesh(fishBoat);

        var fishMastGeo = new THREE.CylinderGeometry(0.5, 0.5, 20, 5);
        var fishMast = new THREE.Mesh(fishMastGeo, makeMat(0xCCCCCC));
        fishMast.position.set(19540, 13, 870);
        addMesh(fishMast);
    }

    function update(delta) { }

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
