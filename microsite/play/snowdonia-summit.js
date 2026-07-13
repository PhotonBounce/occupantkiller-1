window.SnowdoniaSummit = (function() {
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

    function makeMaterial(hex, opts) {
        var params = { color: hex };
        if (opts) {
            if (opts.transparent !== undefined) params.transparent = opts.transparent;
            if (opts.opacity !== undefined) params.opacity = opts.opacity;
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function buildSnowdonSummit() {
        var ox = 14640;
        var matRock = makeMaterial(0x6b6b6b);
        var matBrown = makeMaterial(0x7a6a52);
        var matGrey = makeMaterial(0x8a8a8a);
        var matWhite = makeMaterial(0xffffff);
        var matGlass = makeMaterial(0xaaccee, { transparent: true, opacity: 0.6 });

        // Base mountain tier 1
        var geo1 = new THREE.BoxGeometry(600, 80, 600);
        var tier1 = new THREE.Mesh(geo1, matBrown);
        tier1.position.set(ox, 40, -200);
        addMesh(tier1);

        // Tier 2
        var geo2 = new THREE.BoxGeometry(460, 100, 460);
        var tier2 = new THREE.Mesh(geo2, matRock);
        tier2.position.set(ox, 130, -200);
        addMesh(tier2);

        // Tier 3
        var geo3 = new THREE.BoxGeometry(320, 120, 320);
        var tier3 = new THREE.Mesh(geo3, matGrey);
        tier3.position.set(ox, 250, -200);
        addMesh(tier3);

        // Tier 4
        var geo4 = new THREE.BoxGeometry(200, 100, 200);
        var tier4 = new THREE.Mesh(geo4, matRock);
        tier4.position.set(ox, 360, -200);
        addMesh(tier4);

        // Tier 5 upper
        var geo5 = new THREE.BoxGeometry(120, 80, 120);
        var tier5 = new THREE.Mesh(geo5, matGrey);
        tier5.position.set(ox, 450, -200);
        addMesh(tier5);

        // Summit cone
        var summitGeo = new THREE.ConeGeometry(60, 120, 6);
        var summit = new THREE.Mesh(summitGeo, matRock);
        summit.position.set(ox, 560, -200);
        addMesh(summit);

        // Trig point cylinder (white)
        var trigGeo = new THREE.CylinderGeometry(3, 3, 12, 8);
        var trig = new THREE.Mesh(trigGeo, matWhite);
        trig.position.set(ox, 628, -200);
        addMesh(trig);

        // Hafod Eryri visitor centre - main body
        var hvGeo = new THREE.BoxGeometry(60, 14, 24);
        var hv = new THREE.Mesh(hvGeo, makeMaterial(0xcccccc));
        hv.position.set(ox + 20, 502, -196);
        addMesh(hv);

        // Hafod Eryri roof (curved approximation via low cylinder)
        var hvRoofGeo = new THREE.CylinderGeometry(14, 14, 60, 8, 1, false, 0, Math.PI);
        var hvRoof = new THREE.Mesh(hvRoofGeo, makeMaterial(0xbbbbbb));
        hvRoof.rotation.z = Math.PI / 2;
        hvRoof.position.set(ox + 20, 512, -196);
        addMesh(hvRoof);

        // Hafod Eryri glass front
        var hvGlassGeo = new THREE.BoxGeometry(4, 12, 22);
        var hvGlass = new THREE.Mesh(hvGlassGeo, matGlass);
        hvGlass.position.set(ox - 11, 502, -196);
        addMesh(hvGlass);

        // Scree slopes around base
        var screedMat = makeMaterial(0x9a8878);
        for (var si = 0; si < 16; si++) {
            var angle = (si / 16) * Math.PI * 2;
            var radius = 260 + Math.sin(si * 3.7) * 40;
            var scrGeo = new THREE.BoxGeometry(30 + Math.random() * 20, 20, 30 + Math.random() * 20);
            var scr = new THREE.Mesh(scrGeo, screedMat);
            scr.position.set(
                ox + Math.cos(angle) * radius,
                80,
                -200 + Math.sin(angle) * radius
            );
            scr.rotation.y = angle;
            addMesh(scr);
        }
    }

    function buildSnowdonRailway() {
        var ox = 14640;
        var matRail = makeMaterial(0x888888);
        var matTie = makeMaterial(0x5c3d1e);
        var matWall = makeMaterial(0x777777);
        var matLoco = makeMaterial(0x222244);
        var matLocoRed = makeMaterial(0xcc2222);
        var matStation = makeMaterial(0xbb9944);

        // Rails run up the mountain in segments - zigzag up z axis
        var segCount = 20;
        for (var ri = 0; ri < segCount; ri++) {
            var t = ri / segCount;
            var rx = ox - 80 + Math.sin(t * Math.PI * 2) * 30;
            var ry = t * 490 + 10;
            var rz = -200 + (1 - t) * 380;

            // Left rail
            var leftGeo = new THREE.BoxGeometry(4, 6, 28);
            var leftRail = new THREE.Mesh(leftGeo, matRail);
            leftRail.position.set(rx - 10, ry, rz);
            addMesh(leftRail);

            // Right rail
            var rightGeo = new THREE.BoxGeometry(4, 6, 28);
            var rightRail = new THREE.Mesh(rightGeo, matRail);
            rightRail.position.set(rx + 10, ry, rz);
            addMesh(rightRail);

            // Tie/sleeper
            var tieGeo = new THREE.BoxGeometry(26, 4, 8);
            var tie = new THREE.Mesh(tieGeo, matTie);
            tie.position.set(rx, ry - 2, rz);
            addMesh(tie);

            // Rack rail between rails (LineSegments)
            var rackPoints = [];
            rackPoints.push(rx, ry + 2, rz - 10);
            rackPoints.push(rx, ry + 2, rz + 10);
            var rackBuf = new THREE.BufferGeometry();
            rackBuf.setAttribute('position', new THREE.Float32BufferAttribute(rackPoints, 3));
            var rack = new THREE.LineSegments(rackBuf, new THREE.LineBasicMaterial({ color: 0xaaaaaa }));
            scene.add(rack);
            objects.push(rack);

            // Retaining wall on left side
            if (ri % 3 === 0) {
                var wGeo = new THREE.BoxGeometry(8, 24, 28);
                var wall = new THREE.Mesh(wGeo, matWall);
                wall.position.set(rx - 24, ry, rz);
                addMesh(wall);
            }
        }

        // Small steam locomotive
        var locoBase = new THREE.BoxGeometry(24, 12, 40);
        var loco = new THREE.Mesh(locoBase, matLoco);
        loco.position.set(ox - 80, 140, 60);
        addMesh(loco);

        var boilerGeo = new THREE.CylinderGeometry(7, 7, 38, 8);
        var boiler = new THREE.Mesh(boilerGeo, matLocoRed);
        boiler.rotation.x = Math.PI / 2;
        boiler.position.set(ox - 80, 150, 60);
        addMesh(boiler);

        var chimneyGeo = new THREE.CylinderGeometry(3, 2, 10, 6);
        var chimney = new THREE.Mesh(chimneyGeo, matLoco);
        chimney.position.set(ox - 80, 163, 78);
        addMesh(chimney);

        var cabGeo = new THREE.BoxGeometry(20, 14, 16);
        var cab = new THREE.Mesh(cabGeo, matLocoRed);
        cab.position.set(ox - 80, 153, 44);
        addMesh(cab);

        // Llanberis base station
        var baseStnGeo = new THREE.BoxGeometry(60, 20, 40);
        var baseStn = new THREE.Mesh(baseStnGeo, matStation);
        baseStn.position.set(ox - 80, 10, 180);
        addMesh(baseStn);

        var baseStnRoofGeo = new THREE.BoxGeometry(64, 8, 44);
        var baseStnRoof = new THREE.Mesh(baseStnRoofGeo, makeMaterial(0x8b6914));
        baseStnRoof.position.set(ox - 80, 24, 180);
        addMesh(baseStnRoof);

        // Summit station
        var sumStnGeo = new THREE.BoxGeometry(40, 16, 30);
        var sumStn = new THREE.Mesh(sumStnGeo, matStation);
        sumStn.position.set(ox - 80, 498, -190);
        addMesh(sumStn);

        var sumStnRoofGeo = new THREE.BoxGeometry(44, 6, 34);
        var sumStnRoof = new THREE.Mesh(sumStnRoofGeo, makeMaterial(0x8b6914));
        sumStnRoof.position.set(ox - 80, 511, -190);
        addMesh(sumStnRoof);
    }

    function buildLlanberisPass() {
        var ox = 14640;
        var matRock = makeMaterial(0x6e6e6e);
        var matGrass = makeMaterial(0x4a7a3a);
        var matWater = makeMaterial(0x2255aa, { transparent: true, opacity: 0.75 });
        var matRoad = makeMaterial(0x444444);
        var matConcrete = makeMaterial(0xaaaaaa);

        // Valley floor
        var floorGeo = new THREE.BoxGeometry(300, 8, 700);
        var floor = new THREE.Mesh(floorGeo, matGrass);
        floor.position.set(ox + 200, -4, 50);
        addMesh(floor);

        // Left valley wall
        var lWallGeo = new THREE.BoxGeometry(80, 300, 700);
        var lWall = new THREE.Mesh(lWallGeo, matRock);
        lWall.position.set(ox + 80, 130, 50);
        addMesh(lWall);

        // Right valley wall
        var rWallGeo = new THREE.BoxGeometry(80, 280, 700);
        var rWall = new THREE.Mesh(rWallGeo, matRock);
        rWall.position.set(ox + 320, 120, 50);
        addMesh(rWall);

        // A4086 road through pass
        var roadGeo = new THREE.BoxGeometry(14, 2, 700);
        var road = new THREE.Mesh(roadGeo, matRoad);
        road.position.set(ox + 200, 1, 50);
        addMesh(road);

        // Llyn Peris lake
        var perisGeo = new THREE.BoxGeometry(180, 4, 200);
        var peris = new THREE.Mesh(perisGeo, matWater);
        peris.position.set(ox + 200, 0, 220);
        addMesh(peris);

        // Llyn Padarn lake
        var padarnGeo = new THREE.BoxGeometry(200, 4, 240);
        var padarn = new THREE.Mesh(padarnGeo, matWater);
        padarn.position.set(ox + 200, 0, 430);
        addMesh(padarn);

        // Electric Mountain pumped hydro facility
        var emGeo = new THREE.BoxGeometry(70, 30, 50);
        var em = new THREE.Mesh(emGeo, matConcrete);
        em.position.set(ox + 200, 15, 310);
        addMesh(em);

        var emRoofGeo = new THREE.BoxGeometry(74, 6, 54);
        var emRoof = new THREE.Mesh(emRoofGeo, makeMaterial(0x888888));
        emRoof.position.set(ox + 200, 33, 310);
        addMesh(emRoof);

        // Pipe penstock from mountain to facility
        var penstockGeo = new THREE.CylinderGeometry(4, 4, 200, 6);
        var penstock = new THREE.Mesh(penstockGeo, makeMaterial(0x555555));
        penstock.rotation.z = Math.PI / 3;
        penstock.position.set(ox + 155, 80, 310);
        addMesh(penstock);

        // Pass rocky crags
        for (var ci = 0; ci < 8; ci++) {
            var cragGeo = new THREE.BoxGeometry(20 + ci * 5, 40 + ci * 10, 20 + ci * 5);
            var crag = new THREE.Mesh(cragGeo, matRock);
            crag.position.set(
                ox + 90 + ci * 12,
                160 + ci * 8,
                -60 + ci * 20
            );
            crag.rotation.y = ci * 0.3;
            addMesh(crag);
        }
    }

    function buildCauseway() {
        var ox = 14640;
        var matStone = makeMaterial(0x888877);
        var matWater = makeMaterial(0x336699, { transparent: true, opacity: 0.7 });
        var matRuin = makeMaterial(0x6b5b4e);
        var matOre = makeMaterial(0x886655);

        // Llyn Llydaw lake
        var lakeGeo = new THREE.BoxGeometry(260, 4, 180);
        var lake = new THREE.Mesh(lakeGeo, matWater);
        lake.position.set(ox - 200, 298, -380);
        addMesh(lake);

        // Stone causeway across lake
        var cwGeo = new THREE.BoxGeometry(16, 6, 180);
        var cw = new THREE.Mesh(cwGeo, matStone);
        cw.position.set(ox - 200, 302, -380);
        addMesh(cw);

        // Causeway stone pillars
        for (var pi = 0; pi < 6; pi++) {
            var pillarGeo = new THREE.CylinderGeometry(3, 4, 10, 6);
            var pillar = new THREE.Mesh(pillarGeo, matStone);
            pillar.position.set(ox - 200, 296, -290 + pi * 24);
            addMesh(pillar);
        }

        // Copper mine ruins on far shore
        var ruin1Geo = new THREE.BoxGeometry(30, 20, 24);
        var ruin1 = new THREE.Mesh(ruin1Geo, matRuin);
        ruin1.position.set(ox - 200, 308, -470);
        addMesh(ruin1);

        var ruin2Geo = new THREE.BoxGeometry(20, 14, 18);
        var ruin2 = new THREE.Mesh(ruin2Geo, matRuin);
        ruin2.position.set(ox - 230, 305, -490);
        addMesh(ruin2);

        // Partial walls of ruins
        var wallAGeo = new THREE.BoxGeometry(30, 12, 4);
        var wallA = new THREE.Mesh(wallAGeo, matRuin);
        wallA.position.set(ox - 200, 304, -458);
        addMesh(wallA);

        var wallBGeo = new THREE.BoxGeometry(4, 12, 24);
        var wallB = new THREE.Mesh(wallBGeo, matRuin);
        wallB.position.set(ox - 215, 304, -470);
        addMesh(wallB);

        // Ore processing buildings
        var proc1Geo = new THREE.BoxGeometry(36, 18, 28);
        var proc1 = new THREE.Mesh(proc1Geo, matOre);
        proc1.position.set(ox - 160, 306, -490);
        addMesh(proc1);

        var proc1RoofGeo = new THREE.BoxGeometry(40, 10, 30);
        var proc1Roof = new THREE.Mesh(proc1RoofGeo, makeMaterial(0x5c3d1e));
        proc1Roof.position.set(ox - 160, 320, -490);
        addMesh(proc1Roof);

        var proc2Geo = new THREE.BoxGeometry(24, 14, 20);
        var proc2 = new THREE.Mesh(proc2Geo, matOre);
        proc2.position.set(ox - 240, 306, -480);
        addMesh(proc2);

        // Spoil heap
        var heapGeo = new THREE.ConeGeometry(28, 20, 6);
        var heap = new THREE.Mesh(heapGeo, makeMaterial(0x7a6a52));
        heap.position.set(ox - 280, 308, -470);
        addMesh(heap);
    }

    function buildDinorwigQuarry() {
        var ox = 14640;
        var matSlate = makeMaterial(0x4a5055);
        var matSpoil = makeMaterial(0x6a6a6a);
        var matBuilding = makeMaterial(0x7a7a80);
        var matGreen = makeMaterial(0x3a5a2a);

        // Main quarry cut into mountainside - multiple terraces
        var terraceCount = 8;
        for (var ti = 0; ti < terraceCount; ti++) {
            var tw = 220 - ti * 10;
            var th = 18;
            var td = 40;
            var terraceGeo = new THREE.BoxGeometry(tw, th, td);
            var terrace = new THREE.Mesh(terraceGeo, matSlate);
            terrace.position.set(ox + 440, 20 + ti * 22, 200 + ti * 30);
            addMesh(terrace);

            // Terrace face/cliff
            var faceGeo = new THREE.BoxGeometry(tw, 22, 8);
            var face = new THREE.Mesh(faceGeo, makeMaterial(0x3a3f44));
            face.position.set(ox + 440, 30 + ti * 22, 180 + ti * 30);
            addMesh(face);
        }

        // Large spoil tips
        for (var sti = 0; sti < 5; sti++) {
            var spoilGeo = new THREE.ConeGeometry(30 + sti * 8, 40 + sti * 10, 5);
            var spoil = new THREE.Mesh(spoilGeo, matSpoil);
            spoil.position.set(ox + 380 + sti * 40, 30, 110 + sti * 20);
            addMesh(spoil);
        }

        // Quarry floor
        var qFloorGeo = new THREE.BoxGeometry(240, 6, 160);
        var qFloor = new THREE.Mesh(qFloorGeo, matSlate);
        qFloor.position.set(ox + 440, 3, 130);
        addMesh(qFloor);

        // Quarry buildings
        var qb1Geo = new THREE.BoxGeometry(30, 18, 20);
        var qb1 = new THREE.Mesh(qb1Geo, matBuilding);
        qb1.position.set(ox + 400, 9, 130);
        addMesh(qb1);

        var qb1RoofGeo = new THREE.BoxGeometry(32, 6, 22);
        var qb1Roof = new THREE.Mesh(qb1RoofGeo, makeMaterial(0x5a5a5a));
        qb1Roof.position.set(ox + 400, 21, 130);
        addMesh(qb1Roof);

        var qb2Geo = new THREE.BoxGeometry(24, 14, 18);
        var qb2 = new THREE.Mesh(qb2Geo, matBuilding);
        qb2.position.set(ox + 440, 7, 130);
        addMesh(qb2);

        var qb2RoofGeo = new THREE.BoxGeometry(26, 5, 20);
        var qb2Roof = new THREE.Mesh(qb2RoofGeo, makeMaterial(0x5a5a5a));
        qb2Roof.position.set(ox + 440, 17, 130);
        addMesh(qb2Roof);

        // Slate processing mill chimney
        var chimneyGeo = new THREE.CylinderGeometry(4, 6, 40, 8);
        var chimney = new THREE.Mesh(chimneyGeo, matBuilding);
        chimney.position.set(ox + 480, 26, 130);
        addMesh(chimney);

        // Surrounding hillside green
        var hillGeo = new THREE.BoxGeometry(300, 40, 200);
        var hill = new THREE.Mesh(hillGeo, matGreen);
        hill.position.set(ox + 440, -14, 340);
        addMesh(hill);
    }

    function buildRhydDduPath() {
        var ox = 14640;
        var matPath = makeMaterial(0x8a7a6a);
        var matPost = makeMaterial(0xcc9944);
        var matHill = makeMaterial(0x4a6a3a);
        var matRidge = makeMaterial(0x6e6e6e);

        // Hillside base for path
        var hillGeo = new THREE.BoxGeometry(200, 60, 400);
        var hill = new THREE.Mesh(hillGeo, matHill);
        hill.position.set(ox - 300, 10, -50);
        addMesh(hill);

        // Nantlle Ridge backdrop
        var ridgeGeo = new THREE.BoxGeometry(400, 200, 60);
        var ridge = new THREE.Mesh(ridgeGeo, matRidge);
        ridge.position.set(ox - 450, 100, -100);
        addMesh(ridge);

        // Ridge peaks
        for (var rpi = 0; rpi < 5; rpi++) {
            var peakGeo = new THREE.ConeGeometry(30, 60, 5);
            var peak = new THREE.Mesh(peakGeo, makeMaterial(0x5a5a5a));
            peak.position.set(ox - 550 + rpi * 80, 200, -100);
            addMesh(peak);
        }

        // Zigzag path segments up the hillside
        var pathSegments = 10;
        for (var ps = 0; ps < pathSegments; ps++) {
            var side = (ps % 2 === 0) ? 1 : -1;
            var pGeo = new THREE.BoxGeometry(70, 3, 10);
            var pathSeg = new THREE.Mesh(pGeo, matPath);
            pathSeg.position.set(
                ox - 300 + side * 40,
                ps * 12 + 44,
                -50 + ps * 20 - 100
            );
            pathSeg.rotation.y = (ps % 2 === 0) ? -0.4 : 0.4;
            addMesh(pathSeg);

            // Waymarker post every other segment
            if (ps % 2 === 0) {
                var postGeo = new THREE.CylinderGeometry(1, 1, 8, 4);
                var post = new THREE.Mesh(postGeo, matPost);
                post.position.set(
                    ox - 265 + side * 30,
                    ps * 12 + 50,
                    -50 + ps * 20 - 100
                );
                addMesh(post);

                // Waymarker top
                var topGeo = new THREE.BoxGeometry(4, 3, 4);
                var top = new THREE.Mesh(topGeo, matPost);
                top.position.set(
                    ox - 265 + side * 30,
                    ps * 12 + 55,
                    -50 + ps * 20 - 100
                );
                addMesh(top);
            }
        }

        // Stone steps at path start
        for (var ss = 0; ss < 8; ss++) {
            var stepGeo = new THREE.BoxGeometry(12, 3, 6);
            var step = new THREE.Mesh(stepGeo, makeMaterial(0x888878));
            step.position.set(ox - 300, 32 + ss * 3, 40 + ss * 5);
            addMesh(step);
        }

        // Rhyd Ddu village suggestion at path base
        var villGeo = new THREE.BoxGeometry(40, 14, 30);
        var vill = new THREE.Mesh(villGeo, makeMaterial(0x998877));
        vill.position.set(ox - 300, 7, 140);
        addMesh(vill);

        var villRoofGeo = new THREE.BoxGeometry(44, 10, 34);
        var villRoof = new THREE.Mesh(villRoofGeo, makeMaterial(0x7a6644));
        villRoof.position.set(ox - 300, 19, 140);
        addMesh(villRoof);
    }

    function build() {
        buildSnowdonSummit();
        buildSnowdonRailway();
        buildLlanberisPass();
        buildCauseway();
        buildDinorwigQuarry();
        buildRhydDduPath();
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
