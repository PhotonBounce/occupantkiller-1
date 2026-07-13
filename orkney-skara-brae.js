window.OrkneySkara = (function() {
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

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color, flat) {
        var mat = new THREE.MeshLambertMaterial({ color: color, flatShading: flat ? true : false });
        return new THREE.Mesh(geo, mat);
    }

    function buildSkaraBrae() {
        var ox = 15160;
        var oz = -200;

        // Sand dune covering — large flat mound
        var duneGeo = new THREE.BoxGeometry(60, 4, 50);
        var dune = makeMesh(duneGeo, 0xc2a66b);
        dune.position.set(ox, 2, oz);
        addObj(dune);

        // 8 linked stone hut foundations
        var hutPositions = [
            [-20, -15], [-6, -15], [8, -15], [22, -15],
            [-20, 0],   [-6, 0],   [8, 0],   [22, 0]
        ];
        for (var h = 0; h < hutPositions.length; h++) {
            var hx = ox + hutPositions[h][0];
            var hz = oz + hutPositions[h][1];

            // Hut floor
            var floorGeo = new THREE.BoxGeometry(10, 0.3, 10);
            var floor = makeMesh(floorGeo, 0x8a7a60);
            floor.position.set(hx, 4.2, hz);
            addObj(floor);

            // Hut walls (4 sides, partial height to show interior)
            var wallGeo = new THREE.BoxGeometry(10, 3, 0.6);
            var wallBack = makeMesh(wallGeo, 0x7a6a50);
            wallBack.position.set(hx, 5.7, hz - 4.7);
            addObj(wallBack);

            var wallFront = makeMesh(wallGeo, 0x7a6a50);
            wallFront.position.set(hx, 5.7, hz + 4.7);
            addObj(wallFront);

            var wallSideGeo = new THREE.BoxGeometry(0.6, 3, 10);
            var wallLeft = makeMesh(wallSideGeo, 0x6a5a40);
            wallLeft.position.set(hx - 4.7, 5.7, hz);
            addObj(wallLeft);

            var wallRight = makeMesh(wallSideGeo, 0x6a5a40);
            wallRight.position.set(hx + 4.7, 5.7, hz);
            addObj(wallRight);

            // Stone dresser (back wall shelf)
            var dresserGeo = new THREE.BoxGeometry(5, 1.5, 0.8);
            var dresser = makeMesh(dresserGeo, 0x5a4a30);
            dresser.position.set(hx, 5.4, hz - 4.0);
            addObj(dresser);

            // Stone bed (side alcove)
            var bedGeo = new THREE.BoxGeometry(3, 0.5, 4);
            var bed = makeMesh(bedGeo, 0x6b5b3b);
            bed.position.set(hx - 3.0, 4.6, hz + 1);
            addObj(bed);

            // Central hearth
            var hearthGeo = new THREE.BoxGeometry(1.5, 0.3, 1.5);
            var hearth = makeMesh(hearthGeo, 0x3a2a1a);
            hearth.position.set(hx, 4.4, hz);
            addObj(hearth);
        }

        // Connecting alleyways between huts
        var alleyPositions = [
            [ox - 13, oz - 15], [ox, oz - 15], [ox + 15, oz - 15],
            [ox - 13, oz],      [ox, oz],       [ox + 15, oz]
        ];
        for (var a = 0; a < alleyPositions.length; a++) {
            var alleyGeo = new THREE.BoxGeometry(4, 0.3, 4);
            var alley = makeMesh(alleyGeo, 0x9a8a6a);
            alley.position.set(alleyPositions[a][0], 4.1, alleyPositions[a][1]);
            addObj(alley);
        }

        // Vertical connecting passages
        for (var p = 0; p < 4; p++) {
            var passGeo = new THREE.BoxGeometry(4, 0.3, 15);
            var pass = makeMesh(passGeo, 0x9a8a6a);
            pass.position.set(ox + (-20 + p * 14), 4.1, oz - 7.5);
            addObj(pass);
        }
    }

    function buildRingOfBrodgar() {
        var ox = 15160;
        var oz = 100;
        var radius = 52;
        var numStones = 27;

        // Bank around circle
        var bankGeo = new THREE.CylinderGeometry(radius + 10, radius + 12, 2, 32);
        var bank = makeMesh(bankGeo, 0x6b7a4a);
        bank.position.set(ox, 1, oz);
        addObj(bank);

        // Ditch
        var ditchGeo = new THREE.CylinderGeometry(radius + 4, radius + 4, 1, 32);
        var ditch = makeMesh(ditchGeo, 0x3a4a2a);
        ditch.position.set(ox, 0.3, oz);
        addObj(ditch);

        // Inner grass platform
        var innerGeo = new THREE.CylinderGeometry(radius - 2, radius, 0.5, 32);
        var inner = makeMesh(innerGeo, 0x5a7a3a);
        inner.position.set(ox, 0.2, oz);
        addObj(inner);

        // 27 standing stones in circle
        for (var s = 0; s < numStones; s++) {
            var angle = (s / numStones) * Math.PI * 2;
            var sx = ox + Math.cos(angle) * radius;
            var sz = oz + Math.sin(angle) * radius;
            var stoneH = 2.5 + Math.random() * 2.0;
            var stoneW = 0.5 + Math.random() * 0.4;
            var stoneGeo = new THREE.CylinderGeometry(stoneW * 0.5, stoneW * 0.6, stoneH, 5);
            var stone = makeMesh(stoneGeo, 0x8a8a8a);
            stone.position.set(sx, stoneH * 0.5 + 0.2, sz);
            stone.rotation.y = angle;
            addObj(stone);
        }

        // Loch views — water plane east and west
        var lochGeo = new THREE.BoxGeometry(200, 0.3, 80);
        var loch = makeMesh(lochGeo, 0x2a5a8a);
        loch.position.set(ox, 0, oz + 160);
        addObj(loch);

        var loch2 = makeMesh(lochGeo, 0x2a5a8a);
        loch2.position.set(ox, 0, oz - 160);
        addObj(loch2);
    }

    function buildMaesHowe() {
        var ox = 15160;
        var oz = 300;

        // Surrounding ditch
        var surroundGeo = new THREE.CylinderGeometry(28, 30, 1.5, 20);
        var surround = makeMesh(surroundGeo, 0x3a5a2a);
        surround.position.set(ox, 0.5, oz);
        addObj(surround);

        // Outer bank
        var outerGeo = new THREE.CylinderGeometry(24, 26, 2, 20);
        var outer = makeMesh(outerGeo, 0x5a7a3a);
        outer.position.set(ox, 1.2, oz);
        addObj(outer);

        // Grass mound — large cairn
        var moundGeo = new THREE.CylinderGeometry(0.5, 22, 11, 16);
        var mound = makeMesh(moundGeo, 0x4a6a2a);
        mound.position.set(ox, 5.5, oz);
        addObj(mound);

        // Mound base
        var baseGeo = new THREE.CylinderGeometry(22, 22, 1, 16);
        var base = makeMesh(baseGeo, 0x5a7a3a);
        base.position.set(ox, 1, oz);
        addObj(base);

        // Entrance passage — narrow dark tunnel approach
        var passGeo = new THREE.BoxGeometry(1.8, 1.5, 14);
        var passage = makeMesh(passGeo, 0x2a2a2a);
        passage.position.set(ox, 0.9, oz + 16);
        addObj(passage);

        // Passage lintel stones
        for (var pl = 0; pl < 4; pl++) {
            var lintelGeo = new THREE.BoxGeometry(2.5, 0.5, 0.5);
            var lintel = makeMesh(lintelGeo, 0x7a7a7a);
            lintel.position.set(ox, 1.7, oz + 10 + pl * 2.5);
            addObj(lintel);
        }

        // Inner burial chamber
        var chamberGeo = new THREE.BoxGeometry(8, 5, 8);
        var chamber = makeMesh(chamberGeo, 0x1a1a1a);
        chamber.position.set(ox, 2.5, oz - 1);
        addObj(chamber);

        // Viking runestone carvings on walls (flat stones)
        var runePositions = [[-3, 2, 2], [3, 2, 2], [-3, 2, -2], [3, 2, -2]];
        for (var r = 0; r < runePositions.length; r++) {
            var runeGeo = new THREE.BoxGeometry(1.5, 2, 0.2);
            var rune = makeMesh(runeGeo, 0x3a3a5a);
            rune.position.set(ox + runePositions[r][0], runePositions[r][1], oz + runePositions[r][2]);
            addObj(rune);
        }

        // Corbelled stone ceiling suggestion
        var ceilGeo = new THREE.BoxGeometry(7.5, 0.5, 7.5);
        var ceil = makeMesh(ceilGeo, 0x4a4a4a);
        ceil.position.set(ox, 4.8, oz - 1);
        addObj(ceil);
    }

    function buildItalianChapel() {
        var ox = 15160;
        var oz = 450;

        // Two Nissen hut half-cylinders forming chapel
        for (var ni = 0; ni < 2; ni++) {
            var nz = oz - 7 + ni * 14;
            // Half cylinder body — approximated with CylinderGeometry sections
            var hut1 = makeMesh(new THREE.CylinderGeometry(4.5, 4.5, 12, 8, 1, false, 0, Math.PI), 0x8a8a8a);
            hut1.rotation.z = Math.PI * 0.5;
            hut1.rotation.y = Math.PI * 0.5;
            hut1.position.set(ox, 4.5, nz);
            addObj(hut1);

            // Floor
            var hutFloor = makeMesh(new THREE.BoxGeometry(12, 0.2, 9), 0x5a4a3a);
            hutFloor.position.set(ox, 0.1, nz);
            addObj(hutFloor);
        }

        // Ornate false front facade — facade wall
        var facadeGeo = new THREE.BoxGeometry(10, 9, 0.5);
        var facade = makeMesh(facadeGeo, 0xf0e8d0);
        facade.position.set(ox, 4.5, oz - 14);
        addObj(facade);

        // Facade arch top
        var archGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 8, 1, false, 0, Math.PI);
        var arch = makeMesh(archGeo, 0xe0d8b0);
        arch.rotation.x = Math.PI * 0.5;
        arch.position.set(ox, 8.5, oz - 14);
        addObj(arch);

        // Campanile bell tower
        var towerGeo = new THREE.BoxGeometry(2, 10, 2);
        var tower = makeMesh(towerGeo, 0xf0e8d0);
        tower.position.set(ox, 5, oz - 14.5);
        addObj(tower);

        var towerCapGeo = new THREE.ConeGeometry(1.5, 2, 4);
        var towerCap = makeMesh(towerCapGeo, 0x8a7a6a);
        towerCap.position.set(ox, 11, oz - 14.5);
        addObj(towerCap);

        // 8-pointed star mosaic floor (approximated with box cross)
        var starH = makeMesh(new THREE.BoxGeometry(5, 0.15, 1.5), 0xc0a050);
        starH.position.set(ox, 0.2, oz - 7);
        addObj(starH);

        var starV = makeMesh(new THREE.BoxGeometry(1.5, 0.15, 5), 0xc0a050);
        starV.position.set(ox, 0.2, oz - 7);
        addObj(starV);

        var starD1 = makeMesh(new THREE.BoxGeometry(1.2, 0.15, 4), 0xd0b060);
        starD1.rotation.y = Math.PI * 0.25;
        starD1.position.set(ox, 0.2, oz - 7);
        addObj(starD1);

        var starD2 = makeMesh(new THREE.BoxGeometry(1.2, 0.15, 4), 0xd0b060);
        starD2.rotation.y = -Math.PI * 0.25;
        starD2.position.set(ox, 0.2, oz - 7);
        addObj(starD2);

        // Altar
        var altarGeo = new THREE.BoxGeometry(3, 2, 1);
        var altar = makeMesh(altarGeo, 0xd0c0a0);
        altar.position.set(ox, 1, oz - 19);
        addObj(altar);
    }

    function buildScapaFlow() {
        var ox = 15160;
        var oz = 600;

        // Wide sea anchorage
        var seaGeo = new THREE.BoxGeometry(400, 0.3, 250);
        var sea = makeMesh(seaGeo, 0x1a4a7a);
        sea.position.set(ox, -0.5, oz);
        addObj(sea);

        // Sea floor
        var seaFloorGeo = new THREE.BoxGeometry(400, 0.3, 250);
        var seaFloor = makeMesh(seaFloorGeo, 0x2a3a2a);
        seaFloor.position.set(ox, -8, oz);
        addObj(seaFloor);

        // Churchill Barriers — 4 causeways
        var barrierData = [
            [ox - 80, oz + 80, 8, 60],
            [ox - 40, oz + 90, 8, 50],
            [ox + 30, oz + 85, 8, 55],
            [ox + 80, oz + 75, 8, 45]
        ];
        for (var b = 0; b < barrierData.length; b++) {
            var bGeo = new THREE.BoxGeometry(barrierData[b][2], 2, barrierData[b][3]);
            var barrier = makeMesh(bGeo, 0x6a6a6a);
            barrier.position.set(barrierData[b][0], 0.5, barrierData[b][1]);
            addObj(barrier);
        }

        // German High Seas Fleet wrecks — dark shapes underwater
        var wreckData = [
            [ox - 60, oz - 40],
            [ox + 20, oz - 60],
            [ox + 80, oz - 30],
            [ox - 120, oz + 10],
            [ox + 140, oz - 50]
        ];
        for (var w = 0; w < wreckData.length; w++) {
            // Hull
            var hullGeo = new THREE.BoxGeometry(30, 4, 8);
            var hull = makeMesh(hullGeo, 0x1a1a2a);
            hull.position.set(wreckData[w][0], -6, wreckData[w][1]);
            hull.rotation.y = (w * 0.7);
            addObj(hull);

            // Funnel stump
            var funnelGeo = new THREE.CylinderGeometry(0.8, 1.0, 4, 6);
            var funnel = makeMesh(funnelGeo, 0x2a2a2a);
            funnel.position.set(wreckData[w][0], -3.5, wreckData[w][1]);
            addObj(funnel);

            // Mast lying sideways
            var mastGeo = new THREE.BoxGeometry(0.4, 0.4, 20);
            var mast = makeMesh(mastGeo, 0x2a2a3a);
            mast.position.set(wreckData[w][0] + 5, -4.5, wreckData[w][1]);
            addObj(mast);
        }

        // Blockships in southern passages
        var blockData = [
            [ox - 100, oz + 40],
            [ox + 60, oz + 50]
        ];
        for (var bs = 0; bs < blockData.length; bs++) {
            var blockGeo = new THREE.BoxGeometry(20, 5, 7);
            var block = makeMesh(blockGeo, 0x3a2a1a);
            block.position.set(blockData[bs][0], -4, blockData[bs][1]);
            addObj(block);
        }
    }

    function buildOrkneyMainland() {
        var ox = 15160;
        var oz = -400;

        // Flat windswept terrain base
        var terrainGeo = new THREE.BoxGeometry(500, 0.5, 300);
        var terrain = makeMesh(terrainGeo, 0x5a6a3a);
        terrain.position.set(ox, -0.25, oz);
        addObj(terrain);

        // Peat bog areas — darker patches
        var bogData = [
            [ox - 100, oz - 80], [ox + 60, oz - 60], [ox - 50, oz + 40],
            [ox + 120, oz + 20], [ox - 150, oz + 60]
        ];
        for (var bg = 0; bg < bogData.length; bg++) {
            var bogGeo = new THREE.BoxGeometry(40, 0.3, 30);
            var bog = makeMesh(bogGeo, 0x2a2a1a);
            bog.position.set(bogData[bg][0], 0.2, bogData[bg][1]);
            addObj(bog);
        }

        // Stone walls dividing fields — grid of walls
        var wallsH = [
            [ox - 50, oz - 100, 120],
            [ox + 20, oz - 20, 100],
            [ox - 80, oz + 80, 90]
        ];
        for (var wh = 0; wh < wallsH.length; wh++) {
            var wallHGeo = new THREE.BoxGeometry(wallsH[wh][2], 1.2, 0.8);
            var wallH = makeMesh(wallHGeo, 0x7a7a7a);
            wallH.position.set(wallsH[wh][0], 0.6, wallsH[wh][1]);
            addObj(wallH);
        }

        var wallsV = [
            [ox - 120, oz - 50, 80],
            [ox + 60, oz + 10, 70],
            [ox + 150, oz - 70, 100]
        ];
        for (var wv = 0; wv < wallsV.length; wv++) {
            var wallVGeo = new THREE.BoxGeometry(0.8, 1.2, wallsV[wv][2]);
            var wallV = makeMesh(wallVGeo, 0x7a7a7a);
            wallV.position.set(wallsV[wv][0], 0.6, wallsV[wv][1]);
            addObj(wallV);
        }

        // Highland cattle — 5 cattle scattered
        var cattleData = [
            [ox - 80, oz - 60],
            [ox + 40, oz + 30],
            [ox - 20, oz + 80],
            [ox + 100, oz - 40],
            [ox - 140, oz + 20]
        ];
        for (var c = 0; c < cattleData.length; c++) {
            var cx = cattleData[c][0];
            var cz = cattleData[c][1];

            // Body (cylinder on side)
            var bodyGeo = new THREE.CylinderGeometry(1.0, 1.0, 4, 8);
            var body = makeMesh(bodyGeo, 0x3a2a1a);
            body.rotation.z = Math.PI * 0.5;
            body.position.set(cx, 1.2, cz);
            addObj(body);

            // Head
            var headGeo = new THREE.SphereGeometry(0.7, 6, 5);
            var head = makeMesh(headGeo, 0x3a2a1a);
            head.position.set(cx + 2.8, 1.4, cz);
            addObj(head);

            // Horns
            var hornLGeo = new THREE.CylinderGeometry(0.05, 0.15, 1.5, 4);
            var hornL = makeMesh(hornLGeo, 0xc0b080);
            hornL.rotation.z = Math.PI * 0.4;
            hornL.position.set(cx + 3.1, 2.1, cz - 0.5);
            addObj(hornL);

            var hornRGeo = new THREE.CylinderGeometry(0.05, 0.15, 1.5, 4);
            var hornR = makeMesh(hornRGeo, 0xc0b080);
            hornR.rotation.z = Math.PI * 0.4;
            hornR.position.set(cx + 3.1, 2.1, cz + 0.5);
            addObj(hornR);

            // Legs
            var legPositions = [[-1.2, -0.5], [-1.2, 0.5], [1.2, -0.5], [1.2, 0.5]];
            for (var lg = 0; lg < legPositions.length; lg++) {
                var legGeo = new THREE.CylinderGeometry(0.2, 0.2, 1.2, 5);
                var leg = makeMesh(legGeo, 0x2a1a0a);
                leg.position.set(cx + legPositions[lg][0], 0.4, cz + legPositions[lg][1]);
                addObj(leg);
            }

            // Shaggy fur suggestion — extra sphere overlay
            var furGeo = new THREE.SphereGeometry(1.1, 6, 4);
            var fur = makeMesh(furGeo, 0x4a3a2a);
            fur.scale.set(1.8, 0.9, 0.9);
            fur.position.set(cx, 1.4, cz);
            addObj(fur);
        }

        // Lighthouse on coastal headland
        var headlandGeo = new THREE.BoxGeometry(30, 3, 30);
        var headland = makeMesh(headlandGeo, 0x8a9a6a);
        headland.position.set(ox + 200, 1.5, oz - 120);
        addObj(headland);

        // Lighthouse tower
        var ltGeo = new THREE.CylinderGeometry(2, 2.5, 20, 10);
        var lt = makeMesh(ltGeo, 0xf0f0f0);
        lt.position.set(ox + 200, 13, oz - 120);
        addObj(lt);

        // Lighthouse lantern room
        var lanternGeo = new THREE.CylinderGeometry(2.5, 2.5, 3, 10);
        var lantern = makeMesh(lanternGeo, 0x8a8a8a);
        lantern.position.set(ox + 200, 24.5, oz - 120);
        addObj(lantern);

        // Lighthouse dome
        var domeGeo = new THREE.SphereGeometry(2.5, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var dome = makeMesh(domeGeo, 0x6a6a6a);
        dome.position.set(ox + 200, 26, oz - 120);
        addObj(dome);

        // Lighthouse light (bright sphere)
        var lightGeo = new THREE.SphereGeometry(1.0, 6, 5);
        var light = makeMesh(lightGeo, 0xffff80);
        light.position.set(ox + 200, 25, oz - 120);
        addObj(light);

        // Lighthouse keeper cottage
        var cottageGeo = new THREE.BoxGeometry(8, 4, 6);
        var cottage = makeMesh(cottageGeo, 0xf0f0f0);
        cottage.position.set(ox + 192, 4, oz - 115);
        addObj(cottage);

        var cottageRoofGeo = new THREE.BoxGeometry(9, 0.5, 7);
        var cottageRoof = makeMesh(cottageRoofGeo, 0x5a4a4a);
        cottageRoof.position.set(ox + 192, 6.2, oz - 115);
        addObj(cottageRoof);

        // Coastal cliffs
        var cliffGeo = new THREE.BoxGeometry(300, 8, 5);
        var cliff = makeMesh(cliffGeo, 0x7a6a5a);
        cliff.position.set(ox + 50, 4, oz - 145);
        addObj(cliff);
    }

    function build() {
        buildSkaraBrae();
        buildRingOfBrodgar();
        buildMaesHowe();
        buildItalianChapel();
        buildScapaFlow();
        buildOrkneyMainland();
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
