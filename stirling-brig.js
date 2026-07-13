window.StirlingBrig = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14760;

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

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function buildAbbeyCraig() {
        // Main rocky hill body
        var hillGeo = new THREE.CylinderGeometry(60, 90, 80, 8);
        var hill = makeMesh(hillGeo, 0x6b6b4a);
        hill.position.set(X_OFFSET + 0, 40, -200);
        addObj(hill);

        // Upper crag
        var cragGeo = new THREE.CylinderGeometry(30, 55, 40, 7);
        var crag = makeMesh(cragGeo, 0x5a5a3a);
        crag.position.set(X_OFFSET + 0, 95, -200);
        addObj(crag);

        // South cliff face
        var cliffGeo = new THREE.BoxGeometry(80, 60, 10);
        var cliff = makeMesh(cliffGeo, 0x4a4a30);
        cliff.position.set(X_OFFSET + 0, 50, -155);
        addObj(cliff);

        // Woodland blobs on hill
        var treePositions = [
            [-30, 120, -220],
            [20, 118, -215],
            [-15, 122, -185],
            [35, 115, -195],
            [-40, 112, -200]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            var tGeo = new THREE.SphereGeometry(8, 6, 5);
            var tree = makeMesh(tGeo, 0x2d5a1b);
            tree.position.set(X_OFFSET + tp[0], tp[1], tp[2]);
            addObj(tree);
        }
    }

    function buildWallaceMonument() {
        var bx = X_OFFSET + 0;
        var bz = -200;
        var hillTop = 115;

        // Stage 1 — base
        var stage1Geo = new THREE.BoxGeometry(18, 20, 18);
        var stage1 = makeMesh(stage1Geo, 0xb5651d);
        stage1.position.set(bx, hillTop + 10, bz);
        addObj(stage1);

        // Stage 2
        var stage2Geo = new THREE.BoxGeometry(15, 18, 15);
        var stage2 = makeMesh(stage2Geo, 0xb5651d);
        stage2.position.set(bx, hillTop + 29, bz);
        addObj(stage2);

        // Stage 3
        var stage3Geo = new THREE.BoxGeometry(13, 16, 13);
        var stage3 = makeMesh(stage3Geo, 0xaa5c1a);
        stage3.position.set(bx, hillTop + 46, bz);
        addObj(stage3);

        // Stage 4 — upper with corbels
        var stage4Geo = new THREE.BoxGeometry(11, 10, 11);
        var stage4 = makeMesh(stage4Geo, 0xaa5c1a);
        stage4.position.set(bx, hillTop + 59, bz);
        addObj(stage4);

        // Corbelled parapet — slightly wider
        var corbGeo = new THREE.BoxGeometry(14, 4, 14);
        var corb = makeMesh(corbGeo, 0x8b4513);
        corb.position.set(bx, hillTop + 66, bz);
        addObj(corb);

        // Crown / battlements — four corner merlons
        var merlon = [[-5, -5], [5, -5], [-5, 5], [5, 5]];
        for (var m = 0; m < merlon.length; m++) {
            var mGeo = new THREE.BoxGeometry(3, 4, 3);
            var mer = makeMesh(mGeo, 0x8b4513);
            mer.position.set(bx + merlon[m][0], hillTop + 72, bz + merlon[m][1]);
            addObj(mer);
        }

        // Small windows each stage — narrow slits
        var windowData = [
            [bx + 9, hillTop + 12, bz, 2, 4, 1],
            [bx - 9, hillTop + 12, bz, 2, 4, 1],
            [bx, hillTop + 12, bz + 9, 1, 4, 2],
            [bx, hillTop + 12, bz - 9, 1, 4, 2],
            [bx + 8, hillTop + 30, bz, 2, 3, 1],
            [bx - 8, hillTop + 30, bz, 2, 3, 1],
            [bx, hillTop + 30, bz + 8, 1, 3, 2],
            [bx, hillTop + 30, bz - 8, 1, 3, 2],
            [bx + 7, hillTop + 47, bz, 2, 3, 1],
            [bx - 7, hillTop + 47, bz, 2, 3, 1]
        ];
        for (var w = 0; w < windowData.length; w++) {
            var wd = windowData[w];
            var winGeo = new THREE.BoxGeometry(wd[3], wd[4], wd[5]);
            var win = makeMesh(winGeo, 0x1a1a1a);
            win.position.set(wd[0], wd[1], wd[2]);
            addObj(win);
        }

        // Spiral stair interior hint — thin cylinder inside
        var stairGeo = new THREE.CylinderGeometry(1.5, 1.5, 60, 6);
        var stair = makeMesh(stairGeo, 0x6b3a10);
        stair.position.set(bx, hillTop + 30, bz);
        addObj(stair);
    }

    function buildRiverForth() {
        // Main river channel — wide flat box, blue
        var riverGeo = new THREE.BoxGeometry(400, 1, 60);
        var river = makeMesh(riverGeo, 0x2a6db5);
        river.position.set(X_OFFSET + 20, 0.5, 80);
        addObj(river);

        // Serpentine bend 1 — rotated segment
        var bend1Geo = new THREE.BoxGeometry(80, 1, 60);
        var bend1 = makeMesh(bend1Geo, 0x2a6db5);
        bend1.position.set(X_OFFSET + 230, 0.5, 50);
        bend1.rotation.y = 0.4;
        addObj(bend1);

        // Serpentine bend 2
        var bend2Geo = new THREE.BoxGeometry(80, 1, 60);
        var bend2 = makeMesh(bend2Geo, 0x2a6db5);
        bend2.position.set(X_OFFSET - 200, 0.5, 100);
        bend2.rotation.y = -0.3;
        addObj(bend2);

        // Flood plain — flat grassy area
        var plainGeo = new THREE.BoxGeometry(500, 0.5, 200);
        var plain = makeMesh(plainGeo, 0x5a7a3a);
        plain.position.set(X_OFFSET + 10, 0.2, 80);
        addObj(plain);
    }

    function buildOldStirlingBridge() {
        var bx = X_OFFSET + 30;
        var bz = 80;

        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(10, 2, 60);
        var deck = makeMesh(deckGeo, 0x9e8b6a);
        deck.position.set(bx, 4, bz);
        addObj(deck);

        // Pier 1 — central pier in river
        var pier1Geo = new THREE.BoxGeometry(4, 6, 6);
        var pier1 = makeMesh(pier1Geo, 0x8b7a5a);
        pier1.position.set(bx, 3, bz);
        addObj(pier1);

        // Pier 2 — south bank
        var pier2Geo = new THREE.BoxGeometry(4, 5, 5);
        var pier2 = makeMesh(pier2Geo, 0x8b7a5a);
        pier2.position.set(bx, 2.5, bz - 25);
        addObj(pier2);

        // Pier 3 — north bank
        var pier3Geo = new THREE.BoxGeometry(4, 5, 5);
        var pier3 = makeMesh(pier3Geo, 0x8b7a5a);
        pier3.position.set(bx, 2.5, bz + 25);
        addObj(pier3);

        // Arch 1 — south span (half-cylinder approximation with box)
        var arch1Geo = new THREE.CylinderGeometry(11, 11, 5, 8, 1, false, 0, Math.PI);
        var arch1 = makeMesh(arch1Geo, 0x8b7a5a);
        arch1.position.set(bx, 2, bz - 13);
        arch1.rotation.z = Math.PI / 2;
        arch1.rotation.y = Math.PI / 2;
        addObj(arch1);

        // Arch 2 — north span
        var arch2Geo = new THREE.CylinderGeometry(11, 11, 5, 8, 1, false, 0, Math.PI);
        var arch2 = makeMesh(arch2Geo, 0x8b7a5a);
        arch2.position.set(bx, 2, bz + 13);
        arch2.rotation.z = Math.PI / 2;
        arch2.rotation.y = Math.PI / 2;
        addObj(arch2);

        // Parapet walls
        var parapNGeo = new THREE.BoxGeometry(2, 2, 60);
        var parapN = makeMesh(parapNGeo, 0x9e8b6a);
        parapN.position.set(bx + 5, 6, bz);
        addObj(parapN);

        var parapSGeo = new THREE.BoxGeometry(2, 2, 60);
        var parapS = makeMesh(parapSGeo, 0x9e8b6a);
        parapS.position.set(bx - 5, 6, bz);
        addObj(parapS);
    }

    function buildBannockburn() {
        var bx = X_OFFSET - 150;
        var bz = 300;

        // Battlefield ground — wide flat area
        var fieldGeo = new THREE.BoxGeometry(300, 0.5, 200);
        var field = makeMesh(fieldGeo, 0x4a6b2a);
        field.position.set(bx, 0.2, bz);
        addObj(field);

        // Visitor centre — rectangular building
        var centreGeo = new THREE.BoxGeometry(40, 8, 25);
        var centre = makeMesh(centreGeo, 0xc8b89a);
        centre.position.set(bx, 4, bz - 60);
        addObj(centre);

        // Visitor centre roof
        var vcRoofGeo = new THREE.BoxGeometry(42, 2, 27);
        var vcRoof = makeMesh(vcRoofGeo, 0x8b7a5a);
        vcRoof.position.set(bx, 9, bz - 60);
        addObj(vcRoof);

        // Rotunda heritage centre — cylinder
        var rotGeo = new THREE.CylinderGeometry(18, 18, 6, 16);
        var rot = makeMesh(rotGeo, 0xd4c4a0);
        rot.position.set(bx + 60, 3, bz - 20);
        addObj(rot);

        // Rotunda roof — cone
        var rotRoofGeo = new THREE.ConeGeometry(20, 8, 16);
        var rotRoof = makeMesh(rotRoofGeo, 0x7a6a4a);
        rotRoof.position.set(bx + 60, 9, bz - 20);
        addObj(rotRoof);

        // Equestrian statue base — plinth
        var plinthGeo = new THREE.BoxGeometry(8, 5, 8);
        var plinth = makeMesh(plinthGeo, 0x6b6b6b);
        plinth.position.set(bx, 2.5, bz);
        addObj(plinth);

        // Horse body — cylinder
        var horseGeo = new THREE.CylinderGeometry(2, 2, 8, 8);
        var horse = makeMesh(horseGeo, 0x3a3a2a);
        horse.position.set(bx, 9, bz);
        horse.rotation.z = Math.PI / 2;
        addObj(horse);

        // Horse head
        var hHeadGeo = new THREE.BoxGeometry(2, 2, 3);
        var hHead = makeMesh(hHeadGeo, 0x3a3a2a);
        hHead.position.set(bx, 9, bz - 5);
        addObj(hHead);

        // Rider torso
        var riderGeo = new THREE.BoxGeometry(2, 4, 2);
        var rider = makeMesh(riderGeo, 0x2a2a4a);
        rider.position.set(bx, 13, bz);
        addObj(rider);

        // Rider head
        var rHeadGeo = new THREE.SphereGeometry(1, 6, 5);
        var rHead = makeMesh(rHeadGeo, 0xc8a87a);
        rHead.position.set(bx, 16, bz);
        addObj(rHead);

        // Flagpoles — Saltire flags
        var flagPoles = [
            [bx - 20, bz - 30],
            [bx + 20, bz - 30],
            [bx - 20, bz + 30],
            [bx + 20, bz + 30]
        ];
        for (var f = 0; f < flagPoles.length; f++) {
            var fp = flagPoles[f];
            var poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 20, 6);
            var pole = makeMesh(poleGeo, 0xaaaaaa);
            pole.position.set(fp[0], 10, fp[1]);
            addObj(pole);

            // Flag — blue Saltire
            var flagGeo = new THREE.BoxGeometry(5, 3, 0.2);
            var flag = makeMesh(flagGeo, 0x003f8a);
            flag.position.set(fp[0] + 2.5, 19, fp[1]);
            addObj(flag);
        }
    }

    function buildCambuskennethAbbey() {
        var bx = X_OFFSET + 200;
        var bz = 50;

        // Ruined nave walls — long low broken walls
        var naveWall1Geo = new THREE.BoxGeometry(60, 6, 2);
        var naveWall1 = makeMesh(naveWall1Geo, 0xb5a07a);
        naveWall1.position.set(bx, 3, bz - 20);
        addObj(naveWall1);

        var naveWall2Geo = new THREE.BoxGeometry(60, 6, 2);
        var naveWall2 = makeMesh(naveWall2Geo, 0xb5a07a);
        naveWall2.position.set(bx, 3, bz + 20);
        addObj(naveWall2);

        // West end wall — partially standing
        var westWallGeo = new THREE.BoxGeometry(2, 8, 42);
        var westWall = makeMesh(westWallGeo, 0xb5a07a);
        westWall.position.set(bx - 30, 4, bz);
        addObj(westWall);

        // Ruined section — shorter broken wall
        var ruin1Geo = new THREE.BoxGeometry(15, 4, 2);
        var ruin1 = makeMesh(ruin1Geo, 0xa09070);
        ruin1.position.set(bx + 20, 2, bz - 20);
        addObj(ruin1);

        var ruin2Geo = new THREE.BoxGeometry(10, 3, 2);
        var ruin2 = makeMesh(ruin2Geo, 0xa09070);
        ruin2.position.set(bx + 15, 1.5, bz + 20);
        addObj(ruin2);

        // Free-standing bell tower — the distinctive separate tower
        var towerBaseGeo = new THREE.BoxGeometry(10, 2, 10);
        var towerBase = makeMesh(towerBaseGeo, 0xc8b07a);
        towerBase.position.set(bx - 50, 1, bz);
        addObj(towerBase);

        var tower1Geo = new THREE.BoxGeometry(9, 18, 9);
        var tower1 = makeMesh(tower1Geo, 0xc8b07a);
        tower1.position.set(bx - 50, 11, bz);
        addObj(tower1);

        var tower2Geo = new THREE.BoxGeometry(10, 10, 10);
        var tower2 = makeMesh(tower2Geo, 0xc0a870);
        tower2.position.set(bx - 50, 24, bz);
        addObj(tower2);

        // Bell tower belfry openings
        var belfryOpenings = [
            [bx - 50 + 5, 25, bz],
            [bx - 50 - 5, 25, bz],
            [bx - 50, 25, bz + 5],
            [bx - 50, 25, bz - 5]
        ];
        for (var b = 0; b < belfryOpenings.length; b++) {
            var bo = belfryOpenings[b];
            var bOGeo = new THREE.BoxGeometry(1, 4, 3);
            var bO = makeMesh(bOGeo, 0x1a1a1a);
            bO.position.set(bo[0], bo[1], bo[2]);
            addObj(bO);
        }

        // Tower roof — pyramidal
        var tRoofGeo = new THREE.ConeGeometry(7, 6, 4);
        var tRoof = makeMesh(tRoofGeo, 0x8a7060);
        tRoof.position.set(bx - 50, 32, bz);
        tRoof.rotation.y = Math.PI / 4;
        addObj(tRoof);

        // Abbey gatehouse
        var gateGeo = new THREE.BoxGeometry(14, 10, 8);
        var gate = makeMesh(gateGeo, 0xb5a07a);
        gate.position.set(bx - 30, 5, bz + 40);
        addObj(gate);

        // Gatehouse arch opening
        var archGeo = new THREE.BoxGeometry(4, 6, 9);
        var arch = makeMesh(archGeo, 0x1a1a1a);
        arch.position.set(bx - 30, 4, bz + 40);
        addObj(arch);

        // Gatehouse roof
        var gRoofGeo = new THREE.BoxGeometry(16, 3, 10);
        var gRoof = makeMesh(gRoofGeo, 0x8a7060);
        gRoof.position.set(bx - 30, 11, bz + 40);
        addObj(gRoof);

        // Rubble / foundation traces
        var rubblePositions = [
            [bx + 30, bz - 15],
            [bx + 10, bz + 18],
            [bx - 10, bz - 18],
            [bx + 25, bz + 5]
        ];
        for (var r = 0; r < rubblePositions.length; r++) {
            var rp = rubblePositions[r];
            var rubGeo = new THREE.BoxGeometry(5, 1, 4);
            var rub = makeMesh(rubGeo, 0x9a8a6a);
            rub.position.set(rp[0], 0.5, rp[1]);
            addObj(rub);
        }
    }

    function buildGroundPlane() {
        var groundGeo = new THREE.BoxGeometry(800, 0.5, 700);
        var ground = makeMesh(groundGeo, 0x5a7a3a);
        ground.position.set(X_OFFSET + 30, 0, 80);
        addObj(ground);
    }

    function build() {
        buildGroundPlane();
        buildRiverForth();
        buildAbbeyCraig();
        buildWallaceMonument();
        buildOldStirlingBridge();
        buildBannockburn();
        buildCambuskennethAbbey();
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
