window.HackneyMarshes = (function() {
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

    function makeMesh(geo, color, opts) {
        var params = { color: color };
        if (opts) {
            for (var k in opts) {
                params[k] = opts[k];
            }
        }
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial(params));
    }

    function buildGround() {
        var geo = new THREE.BoxGeometry(2400, 1, 2400);
        var mesh = makeMesh(geo, 0x4a7c3f);
        mesh.position.set(11880, -0.5, 0);
        addObj(mesh);
    }

    function buildFootballPitches() {
        var pitchW = 68;
        var pitchL = 105;
        var rows = 4;
        var cols = 6;
        var spacingX = 80;
        var spacingZ = 120;
        var startX = 11880 - (cols / 2) * spacingX + spacingX / 2;
        var startZ = -300;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var px = startX + c * spacingX;
                var pz = startZ + r * spacingZ;
                buildPitchMarkings(px, pz, pitchW, pitchL);
                buildGoalposts(px, pz - pitchL / 2, pitchW);
                buildGoalposts(px, pz + pitchL / 2, pitchW);
            }
        }

        buildChangingRooms(11880 - 280, 0, -200);
    }

    function buildPitchMarkings(cx, cz, w, l) {
        var lineH = 0.15;
        var lineT = 0.5;

        var topGeo = new THREE.BoxGeometry(w, lineH, lineT);
        var topLine = makeMesh(topGeo, 0xffffff);
        topLine.position.set(cx, 0.1, cz - l / 2);
        addObj(topLine);

        var botLine = makeMesh(new THREE.BoxGeometry(w, lineH, lineT), 0xffffff);
        botLine.position.set(cx, 0.1, cz + l / 2);
        addObj(botLine);

        var leftLine = makeMesh(new THREE.BoxGeometry(lineT, lineH, l), 0xffffff);
        leftLine.position.set(cx - w / 2, 0.1, cz);
        addObj(leftLine);

        var rightLine = makeMesh(new THREE.BoxGeometry(lineT, lineH, l), 0xffffff);
        rightLine.position.set(cx + w / 2, 0.1, cz);
        addObj(rightLine);

        var centreGeo = new THREE.CylinderGeometry(9.15, 9.15, lineH, 24, 1, true);
        var centreLine = makeMesh(centreGeo, 0xffffff);
        centreLine.position.set(cx, 0.1, cz);
        addObj(centreLine);

        var centreSpot = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, lineH, 8), 0xffffff);
        centreSpot.position.set(cx, 0.1, cz);
        addObj(centreSpot);
    }

    function buildGoalposts(cx, cz, pitchW) {
        var goalW = 7.32;
        var postH = 2.44;
        var postR = 0.06;

        var leftPost = makeMesh(new THREE.CylinderGeometry(postR, postR, postH, 8), 0xffffff);
        leftPost.position.set(cx - goalW / 2, postH / 2, cz);
        addObj(leftPost);

        var rightPost = makeMesh(new THREE.CylinderGeometry(postR, postR, postH, 8), 0xffffff);
        rightPost.position.set(cx + goalW / 2, postH / 2, cz);
        addObj(rightPost);

        var crossbar = makeMesh(new THREE.BoxGeometry(goalW + postR * 2, postR * 2, postR * 2), 0xffffff);
        crossbar.position.set(cx, postH, cz);
        addObj(crossbar);
    }

    function buildChangingRooms(cx, cy, cz) {
        var block = makeMesh(new THREE.BoxGeometry(40, 6, 14), 0xcc9966);
        block.position.set(cx, 3, cz);
        addObj(block);

        var roof = makeMesh(new THREE.BoxGeometry(42, 1, 16), 0x888888);
        roof.position.set(cx, 6.5, cz);
        addObj(roof);

        for (var d = 0; d < 5; d++) {
            var door = makeMesh(new THREE.BoxGeometry(2, 4, 0.3), 0x663300);
            door.position.set(cx - 16 + d * 8, 2, cz - 7.2);
            addObj(door);
        }
    }

    function buildRiverLea() {
        var riverGeo = new THREE.BoxGeometry(18, 0.5, 1800);
        var river = makeMesh(riverGeo, 0x2255aa, { transparent: true, opacity: 0.82 });
        river.position.set(11880 + 320, 0.1, 0);
        addObj(river);

        var towpath = makeMesh(new THREE.BoxGeometry(10, 0.3, 1800), 0xbb9955);
        towpath.position.set(11880 + 311, 0.2, 0);
        addObj(towpath);

        var narrowboatColors = [0xcc2200, 0x006633, 0x003399, 0xcc6600, 0x990099, 0x009999];
        for (var b = 0; b < 8; b++) {
            var col = narrowboatColors[b % narrowboatColors.length];
            buildNarrowboat(11880 + 319, 0, -600 + b * 160, col);
        }
    }

    function buildNarrowboat(cx, cy, cz, color) {
        var hull = makeMesh(new THREE.BoxGeometry(3.5, 1.4, 18), color);
        hull.position.set(cx, 1, cz);
        addObj(hull);

        var cabin = makeMesh(new THREE.BoxGeometry(3, 1.2, 13), 0xf5f0e8);
        cabin.position.set(cx, 2.3, cz - 1);
        addObj(cabin);

        var chimney = makeMesh(new THREE.CylinderGeometry(0.12, 0.15, 1.2, 8), 0x222222);
        chimney.position.set(cx, 3.2, cz + 4);
        addObj(chimney);

        var accentStripe = makeMesh(new THREE.BoxGeometry(3.5, 0.25, 18), 0xffdd00);
        accentStripe.position.set(cx, 1.8, cz);
        addObj(accentStripe);

        for (var w = 0; w < 4; w++) {
            var win = makeMesh(new THREE.BoxGeometry(0.6, 0.6, 0.1), 0x99ccff);
            win.position.set(cx + 1.51, 2.3, cz - 4 + w * 2.5);
            addObj(win);
        }
    }

    function buildVictoriaPark() {
        var pkX = 11880 - 80;
        var pkZ = 500;

        var parkGround = makeMesh(new THREE.BoxGeometry(400, 0.4, 350), 0x3d6b2a);
        parkGround.position.set(pkX, 0.2, pkZ);
        addObj(parkGround);

        buildDrinkingFountain(pkX - 100, 0, pkZ - 80);
        buildPagoda(pkX + 60, 0, pkZ - 60);
        buildBoatingLake(pkX - 40, pkZ + 80);
        buildBandstand(pkX + 150, 0, pkZ + 30);

        for (var t = 0; t < 24; t++) {
            var tx = pkX - 180 + (t % 8) * 50;
            var tz = pkZ - 160 + Math.floor(t / 8) * 90;
            buildTree(tx, 0, tz);
        }
    }

    function buildDrinkingFountain(cx, cy, cz) {
        var base = makeMesh(new THREE.CylinderGeometry(0.8, 1.0, 0.4, 12), 0xcccccc);
        base.position.set(cx, 0.2, cz);
        addObj(base);

        var pedestal = makeMesh(new THREE.CylinderGeometry(0.35, 0.45, 1.0, 12), 0xbbbbbb);
        pedestal.position.set(cx, 0.9, cz);
        addObj(pedestal);

        var basin = makeMesh(new THREE.CylinderGeometry(0.7, 0.5, 0.3, 12), 0xaaaaaa);
        basin.position.set(cx, 1.55, cz);
        addObj(basin);

        var top = makeMesh(new THREE.SphereGeometry(0.2, 8, 8), 0x999999);
        top.position.set(cx, 1.9, cz);
        addObj(top);
    }

    function buildPagoda(cx, cy, cz) {
        var tiers = 3;
        for (var t = 0; t < tiers; t++) {
            var tierW = 8 - t * 1.8;
            var tierH = 2.0;
            var tierY = t * (tierH + 0.6);

            var body = makeMesh(new THREE.BoxGeometry(tierW, tierH, tierW), 0xcc3300);
            body.position.set(cx, tierY + tierH / 2, cz);
            addObj(body);

            var roofW = tierW + 3;
            var roof = makeMesh(new THREE.ConeGeometry(roofW * 0.7, 1.2, 4), 0x228833);
            roof.position.set(cx, tierY + tierH + 0.6, cz);
            roof.rotation.y = Math.PI / 4;
            addObj(roof);
        }

        var spire = makeMesh(new THREE.CylinderGeometry(0.1, 0.2, 2.5, 8), 0xffcc00);
        spire.position.set(cx, tiers * 2.6 + 1.25, cz);
        addObj(spire);
    }

    function buildBoatingLake(cx, cz) {
        var lake = makeMesh(new THREE.BoxGeometry(120, 0.4, 80), 0x3377bb, { transparent: true, opacity: 0.78 });
        lake.position.set(cx, 0.3, cz);
        addObj(lake);

        var boat1 = makeMesh(new THREE.BoxGeometry(2.5, 0.6, 4), 0xeeeecc);
        boat1.position.set(cx - 20, 0.7, cz + 10);
        addObj(boat1);

        var boat2 = makeMesh(new THREE.BoxGeometry(2.5, 0.6, 4), 0xffcc88);
        boat2.position.set(cx + 15, 0.7, cz - 8);
        addObj(boat2);
    }

    function buildBandstand(cx, cy, cz) {
        var base = makeMesh(new THREE.CylinderGeometry(6, 6.5, 0.8, 10), 0xddddbb);
        base.position.set(cx, 0.4, cz);
        addObj(base);

        for (var p = 0; p < 10; p++) {
            var angle = (p / 10) * Math.PI * 2;
            var px = cx + Math.cos(angle) * 5.5;
            var pz = cz + Math.sin(angle) * 5.5;
            var pillar = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8), 0xffffff);
            pillar.position.set(px, 2.55, pz);
            addObj(pillar);
        }

        var dome = makeMesh(new THREE.ConeGeometry(7, 2.5, 10), 0x228844);
        dome.position.set(cx, 5.05, cz);
        addObj(dome);

        var stage = makeMesh(new THREE.CylinderGeometry(4.5, 4.5, 0.5, 10), 0xccbb99);
        stage.position.set(cx, 1.05, cz);
        addObj(stage);
    }

    function buildTree(cx, cy, cz) {
        var trunk = makeMesh(new THREE.CylinderGeometry(0.3, 0.45, 3, 8), 0x6b3d1e);
        trunk.position.set(cx, 1.5, cz);
        addObj(trunk);

        var canopy = makeMesh(new THREE.SphereGeometry(2.5, 8, 6), 0x2d6e2d);
        canopy.position.set(cx, 4.8, cz);
        addObj(canopy);
    }

    function buildHackneyWick() {
        var hwX = 11880 + 120;
        var hwZ = -500;

        var warehouseConfigs = [
            { w: 55, h: 12, d: 30, x: hwX, z: hwZ, col: 0x8b5e3c },
            { w: 40, h: 9, d: 25, x: hwX + 75, z: hwZ + 40, col: 0x7a5230 },
            { w: 65, h: 14, d: 35, x: hwX - 70, z: hwZ - 50, col: 0x6d4a28 },
            { w: 45, h: 10, d: 28, x: hwX + 30, z: hwZ - 90, col: 0x9b6e44 }
        ];

        for (var i = 0; i < warehouseConfigs.length; i++) {
            var cfg = warehouseConfigs[i];
            buildWarehouse(cfg.x, cfg.z, cfg.w, cfg.h, cfg.d, cfg.col);
        }

        buildGraffitiMurals(hwX - 30, hwZ + 10);
    }

    function buildWarehouse(cx, cz, w, h, d, brickColor) {
        var body = makeMesh(new THREE.BoxGeometry(w, h, d), brickColor);
        body.position.set(cx, h / 2, cz);
        addObj(body);

        var roof = makeMesh(new THREE.BoxGeometry(w + 1, 1.2, d + 1), 0x555555);
        roof.position.set(cx, h + 0.6, cz);
        addObj(roof);

        var bayCount = Math.floor(w / 14);
        for (var b = 0; b < bayCount; b++) {
            var bx = cx - w / 2 + 7 + b * 14;
            var bay = makeMesh(new THREE.BoxGeometry(5, 5, 0.5), 0x444444);
            bay.position.set(bx, 3.5, cz - d / 2 - 0.3);
            addObj(bay);

            var loadingPlatform = makeMesh(new THREE.BoxGeometry(6, 0.6, 2), 0x888877);
            loadingPlatform.position.set(bx, 0.4, cz - d / 2 - 1.3);
            addObj(loadingPlatform);
        }

        for (var w2 = 0; w2 < 6; w2++) {
            var wx = cx - w / 2 + (w / 7) * (w2 + 0.5);
            var win = makeMesh(new THREE.BoxGeometry(2.5, 2.2, 0.2), 0x88aacc);
            win.position.set(wx, h - 3, cz - d / 2 - 0.1);
            addObj(win);
        }
    }

    function buildGraffitiMurals(cx, cz) {
        var muralColors = [0xff3300, 0xffcc00, 0x00aaff, 0xff00aa, 0x00ff88, 0xcc44ff];
        for (var m = 0; m < 8; m++) {
            var col = muralColors[m % muralColors.length];
            var panel = makeMesh(new THREE.BoxGeometry(6, 4, 0.2), col);
            panel.position.set(cx + m * 8 - 28, 3, cz - 15.2);
            addObj(panel);
        }
    }

    function buildVelodrome() {
        var vx = 11880 + 250;
        var vz = -700;

        var outerShell = makeMesh(new THREE.CylinderGeometry(55, 58, 14, 32, 1, true), 0xddbb88);
        outerShell.position.set(vx, 7, vz);
        addObj(outerShell);

        var floor = makeMesh(new THREE.CylinderGeometry(54, 54, 0.5, 32), 0x4a3520);
        floor.position.set(vx, 0.25, vz);
        addObj(floor);

        var roofRim = makeMesh(new THREE.CylinderGeometry(60, 55, 3, 32, 1, true), 0xcc9966);
        roofRim.position.set(vx, 14.5, vz);
        addObj(roofRim);

        var roofCap = makeMesh(new THREE.CylinderGeometry(0.1, 58, 6, 32), 0xbbaa88);
        roofCap.position.set(vx, 19, vz);
        addObj(roofCap);

        var trackSurface = makeMesh(new THREE.CylinderGeometry(42, 42, 0.3, 32), 0xd4a055);
        trackSurface.position.set(vx, 0.5, vz);
        addObj(trackSurface);

        var innerGround = makeMesh(new THREE.CylinderGeometry(28, 28, 0.3, 32), 0x3d6b2a);
        innerGround.position.set(vx, 0.5, vz);
        addObj(innerGround);

        for (var s = 0; s < 8; s++) {
            var angle = (s / 8) * Math.PI * 2;
            var sx = vx + Math.cos(angle) * 57;
            var sz = vz + Math.sin(angle) * 57;
            var support = makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 15, 8), 0x888888);
            support.position.set(sx, 7.5, sz);
            addObj(support);
        }
    }

    function buildCanalBridge() {
        var bx = 11880 + 320;
        var bz = 100;

        var deck = makeMesh(new THREE.BoxGeometry(25, 0.8, 8), 0x888877);
        deck.position.set(bx, 2.5, bz);
        addObj(deck);

        var leftArch = makeMesh(new THREE.CylinderGeometry(4, 4, 1.5, 12, 1, true), 0x777766);
        leftArch.position.set(bx - 8, 1.5, bz);
        addObj(leftArch);

        var rightArch = makeMesh(new THREE.CylinderGeometry(4, 4, 1.5, 12, 1, true), 0x777766);
        rightArch.position.set(bx + 8, 1.5, bz);
        addObj(rightArch);

        for (var r = 0; r < 10; r++) {
            var railing = makeMesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), 0x555544);
            railing.position.set(bx - 11 + r * 2.5, 3.5, bz - 3.8);
            addObj(railing);

            var railing2 = makeMesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), 0x555544);
            railing2.position.set(bx - 11 + r * 2.5, 3.5, bz + 3.8);
            addObj(railing2);
        }

        var railTop1 = makeMesh(new THREE.BoxGeometry(25, 0.12, 0.12), 0x555544);
        railTop1.position.set(bx, 4.1, bz - 3.8);
        addObj(railTop1);

        var railTop2 = makeMesh(new THREE.BoxGeometry(25, 0.12, 0.12), 0x555544);
        railTop2.position.set(bx, 4.1, bz + 3.8);
        addObj(railTop2);
    }

    function buildStreetFurniture() {
        var lampPositions = [
            [11880 + 305, 0, -400],
            [11880 + 305, 0, -200],
            [11880 + 305, 0, 0],
            [11880 + 305, 0, 200],
            [11880 + 305, 0, 400],
            [11880 - 100, 0, 400],
            [11880 - 100, 0, 500],
            [11880 - 100, 0, 600]
        ];

        for (var i = 0; i < lampPositions.length; i++) {
            buildLamppost(lampPositions[i][0], lampPositions[i][1], lampPositions[i][2]);
        }
    }

    function buildLamppost(cx, cy, cz) {
        var pole = makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 6, 8), 0x444444);
        pole.position.set(cx, 3, cz);
        addObj(pole);

        var arm = makeMesh(new THREE.BoxGeometry(1.5, 0.12, 0.12), 0x444444);
        arm.position.set(cx + 0.75, 6.1, cz);
        addObj(arm);

        var lamp = makeMesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), 0xffffcc);
        lamp.position.set(cx + 1.4, 6.1, cz);
        addObj(lamp);
    }

    function buildParkFencing() {
        var pkX = 11880 - 80;
        var pkZ = 500;
        var fenceW = 400;
        var fenceD = 350;
        var postSpacing = 8;

        var sides = [
            { axis: 'x', count: Math.floor(fenceW / postSpacing), ox: pkX - fenceW / 2, oz: pkZ - fenceD / 2, dx: postSpacing, dz: 0 },
            { axis: 'x', count: Math.floor(fenceW / postSpacing), ox: pkX - fenceW / 2, oz: pkZ + fenceD / 2, dx: postSpacing, dz: 0 },
            { axis: 'z', count: Math.floor(fenceD / postSpacing), ox: pkX - fenceW / 2, oz: pkZ - fenceD / 2, dx: 0, dz: postSpacing },
            { axis: 'z', count: Math.floor(fenceD / postSpacing), ox: pkX + fenceW / 2, oz: pkZ - fenceD / 2, dx: 0, dz: postSpacing }
        ];

        for (var s = 0; s < sides.length; s++) {
            var side = sides[s];
            for (var p = 0; p < side.count; p++) {
                var post = makeMesh(new THREE.BoxGeometry(0.15, 1.5, 0.15), 0x1a5c1a);
                post.position.set(side.ox + p * side.dx, 0.75, side.oz + p * side.dz);
                addObj(post);
            }
        }
    }

    function build() {
        buildGround();
        buildFootballPitches();
        buildRiverLea();
        buildVictoriaPark();
        buildHackneyWick();
        buildVelodrome();
        buildCanalBridge();
        buildStreetFurniture();
        buildParkFencing();
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
