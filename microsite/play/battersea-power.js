window.BatterseaPower = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var pig = null;
    var pigTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        pig = null;
        pigTime = 0;
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.emissive !== undefined) params.emissive = opts.emissive;
            if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addObj(mesh);
    }

    function buildPowerStation(ox, oz) {
        var brickColor = 0x8B3A22;
        var whiteColor = 0xF5F5F0;
        var darkColor = 0x3A1A08;
        var glassColor = 0x88CCEE;
        var steelColor = 0x9AAABB;

        // Main turbine hall body
        makeBox(60, 20, 30, brickColor, ox, 10, oz);

        // Side wings (boiler houses)
        makeBox(18, 16, 28, brickColor, ox - 39, 8, oz);
        makeBox(18, 16, 28, brickColor, ox + 39, 8, oz);

        // Decorative Art Deco stepped parapet along top
        makeBox(62, 2, 3, darkColor, ox, 21, oz - 13.5);
        makeBox(62, 2, 3, darkColor, ox, 21, oz + 13.5);
        makeBox(32, 2, 3, darkColor, ox, 21, oz - 13.5);

        // Cornice detail strips
        makeBox(60, 1, 30.5, darkColor, ox, 20.5, oz);
        makeBox(60, 1, 30.5, darkColor, ox, 18, oz);

        // Art Deco vertical pilasters on facade
        for (var p = -5; p <= 5; p++) {
            makeBox(1, 20, 0.8, darkColor, ox + p * 5, 10, oz - 15.5);
            makeBox(1, 20, 0.8, darkColor, ox + p * 5, 10, oz + 15.5);
        }

        // Arched window bays (dark recesses) on south facade
        for (var w = -4; w <= 4; w++) {
            makeBox(3.5, 8, 0.5, darkColor, ox + w * 6, 8, oz - 15.6);
            makeBox(1.5, 2.5, 0.5, 0x4488AA, ox + w * 6, 13, oz - 15.6);
        }

        // Riverside east facade windows
        for (var ew = -3; ew <= 3; ew++) {
            makeBox(0.5, 8, 3.5, darkColor, ox + 30.5, 8, oz + ew * 4);
        }

        // Glass atrium roof (central section)
        makeBox(40, 1, 20, glassColor, ox, 21.5, oz);
        makeBox(38, 3, 18, glassColor, ox, 23, oz);

        // Atrium steel frame ribs
        for (var ar = -4; ar <= 4; ar++) {
            makeBox(0.4, 4, 20, steelColor, ox + ar * 4.5, 22, oz);
        }
        for (var ac = -3; ac <= 3; ac++) {
            makeBox(40, 4, 0.4, steelColor, ox, 22, oz + ac * 2.8);
        }

        // 4 chimneys at corners
        var chimH = 35;
        var chimR = 2.5;
        var cx1 = ox - 26;
        var cx2 = ox + 26;
        var cz1 = oz - 12;
        var cz2 = oz + 12;
        var chimBase = chimH / 2;

        makeCyl(chimR, chimR + 0.3, chimH, 16, whiteColor, cx1, chimBase, cz1);
        makeCyl(chimR, chimR + 0.3, chimH, 16, whiteColor, cx2, chimBase, cz1);
        makeCyl(chimR, chimR + 0.3, chimH, 16, whiteColor, cx1, chimBase, cz2);
        makeCyl(chimR, chimR + 0.3, chimH, 16, whiteColor, cx2, chimBase, cz2);

        // Chimney cap rings
        makeCyl(chimR + 0.6, chimR + 0.3, 1.5, 16, darkColor, cx1, chimH + 0.75, cz1);
        makeCyl(chimR + 0.6, chimR + 0.3, 1.5, 16, darkColor, cx2, chimH + 0.75, cz1);
        makeCyl(chimR + 0.6, chimR + 0.3, 1.5, 16, darkColor, cx1, chimH + 0.75, cz2);
        makeCyl(chimR + 0.6, chimR + 0.3, 1.5, 16, darkColor, cx2, chimH + 0.75, cz2);

        // Chimney inner flue top
        makeCyl(chimR - 0.8, chimR - 0.8, 2, 12, darkColor, cx1, chimH + 1, cz1);
        makeCyl(chimR - 0.8, chimR - 0.8, 2, 12, darkColor, cx2, chimH + 1, cz1);
        makeCyl(chimR - 0.8, chimR - 0.8, 2, 12, darkColor, cx1, chimH + 1, cz2);
        makeCyl(chimR - 0.8, chimR - 0.8, 2, 12, darkColor, cx2, chimH + 1, cz2);

        // Main entrance canopy (south side)
        makeBox(20, 1.5, 5, steelColor, ox, 5, oz - 18);
        makeBox(20, 6, 0.5, glassColor, ox, 7.5, oz - 18);

        // Entrance columns
        for (var ec = -2; ec <= 2; ec++) {
            makeCyl(0.6, 0.6, 6, 8, steelColor, ox + ec * 4.5, 3, oz - 17.5);
        }

        // Loading bays / industrial doors on east side
        makeBox(8, 6, 0.5, darkColor, ox + 28, 3, oz - 5);
        makeBox(8, 6, 0.5, darkColor, ox + 28, 3, oz + 5);

        // Ground level plinth/base
        makeBox(62, 1.5, 32, 0x5A2D12, ox, 0.75, oz);
    }

    function buildFlyingPig(ox, oz) {
        var pigColor = 0xFFAABB;
        var pinkDark = 0xDD7799;
        var eyeColor = 0x111111;

        // Pig body as stretched sphere (use scale after creation)
        var bodyGeo = new THREE.SphereGeometry(5, 16, 12);
        var bodyMat = makeMat(pigColor);
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.scale.set(1.6, 1.0, 1.0);
        body.position.set(ox, 44, oz);
        scene.add(body);
        objects.push(body);
        pig = body;

        // Snout
        makeCone(1.5, 2.5, 12, pinkDark, ox + 8.5, 44, oz);
        var snoutObj = objects[objects.length - 1];
        snoutObj.rotation.z = -Math.PI / 2;

        // Nostrils
        makeCyl(0.3, 0.3, 0.6, 8, 0x993355, ox + 9.6, 44.5, oz - 0.6);
        makeCyl(0.3, 0.3, 0.6, 8, 0x993355, ox + 9.6, 44.5, oz + 0.6);
        var n1 = objects[objects.length - 2];
        var n2 = objects[objects.length - 1];
        n1.rotation.z = Math.PI / 2;
        n2.rotation.z = Math.PI / 2;

        // Eyes
        makeSphere(0.5, 8, 8, eyeColor, ox + 7, 46, oz - 2.5);
        makeSphere(0.5, 8, 8, eyeColor, ox + 7, 46, oz + 2.5);

        // Ears
        makeCone(1.2, 2, 8, pinkDark, ox + 5, 49.5, oz - 2);
        makeCone(1.2, 2, 8, pinkDark, ox + 5, 49.5, oz + 2);

        // Tail (curled approximation with small boxes)
        makeBox(1.5, 0.5, 0.5, pinkDark, ox - 9, 44, oz);
        makeBox(1, 0.5, 0.5, pinkDark, ox - 10, 45, oz);
        makeBox(0.8, 0.5, 0.5, pinkDark, ox - 10.5, 46, oz);

        // Wings (left and right)
        var wGeo1 = new THREE.BoxGeometry(1.5, 0.5, 5);
        var wMat = makeMat(pinkDark);
        var wing1 = new THREE.Mesh(wGeo1, wMat);
        wing1.position.set(ox - 1, 47, oz - 7.5);
        wing1.rotation.z = -0.3;
        scene.add(wing1);
        objects.push(wing1);

        var wGeo2 = new THREE.BoxGeometry(1.5, 0.5, 5);
        var wing2 = new THREE.Mesh(wGeo2, wMat);
        wing2.position.set(ox - 1, 47, oz + 7.5);
        wing2.rotation.z = 0.3;
        scene.add(wing2);
        objects.push(wing2);

        // Wing secondaries
        makeBox(1, 0.4, 3, pinkDark, ox - 2.5, 46.2, oz - 9);
        makeBox(1, 0.4, 3, pinkDark, ox - 2.5, 46.2, oz + 9);

        // Tether rope approximation (thin boxes going down to chimney)
        makeBox(0.2, 10, 0.2, 0x888877, ox - 26, 37.5, oz - 12);
        makeBox(0.2, 10, 0.2, 0x888877, ox + 26, 37.5, oz - 12);
    }

    function buildBatterseaPark(ox, oz) {
        var grassColor = 0x3A7D2C;
        var darkGrass = 0x2A5D1C;
        var waterColor = 0x1A5588;
        var pathColor = 0xBBAA88;
        var stoneColor = 0xCCBB99;
        var pagodaWhite = 0xF8F4E8;
        var pagodaRed = 0xCC2200;
        var treeGreen = 0x2D6B1A;
        var treeTrunk = 0x5C3317;

        // Main park lawn
        makeBox(120, 0.3, 80, grassColor, ox, 0.15, oz);

        // Boating lake
        makeBox(35, 0.2, 25, waterColor, ox - 20, 0.1, oz - 20);

        // Lake edge
        makeBox(37, 0.5, 1, stoneColor, ox - 20, 0.25, oz - 32.5);
        makeBox(37, 0.5, 1, stoneColor, ox - 20, 0.25, oz - 7.5);
        makeBox(1, 0.5, 27, stoneColor, ox - 38.5, 0.25, oz - 20);
        makeBox(1, 0.5, 27, stoneColor, ox - 1.5, 0.25, oz - 20);

        // Paths through park
        makeBox(80, 0.25, 3, pathColor, ox, 0.13, oz + 10);
        makeBox(3, 0.25, 60, pathColor, ox, 0.13, oz - 10);
        makeBox(3, 0.25, 60, pathColor, ox + 30, 0.13, oz - 10);
        makeBox(60, 0.25, 3, pathColor, ox, 0.13, oz - 28);

        // Japanese Peace Pagoda (multi-tiered)
        makeCyl(0.5, 0.5, 8, 8, pagodaWhite, ox + 30, 4, oz - 25);

        // Pagoda tier 1 (base)
        makeBox(10, 1.2, 10, pagodaWhite, ox + 30, 1, oz - 25);
        makeBox(11, 0.6, 11, pagodaRed, ox + 30, 1.9, oz - 25);
        makeCone(6.5, 1.5, 4, pagodaRed, ox + 30, 2.95, oz - 25);

        // Pagoda tier 2
        makeBox(8, 1.2, 8, pagodaWhite, ox + 30, 4, oz - 25);
        makeBox(9, 0.6, 9, pagodaRed, ox + 30, 4.9, oz - 25);
        makeCone(5.5, 1.5, 4, pagodaRed, ox + 30, 5.95, oz - 25);

        // Pagoda tier 3
        makeBox(6, 1.2, 6, pagodaWhite, ox + 30, 7, oz - 25);
        makeBox(7, 0.6, 7, pagodaRed, ox + 30, 7.9, oz - 25);
        makeCone(4.5, 1.5, 4, pagodaRed, ox + 30, 8.95, oz - 25);

        // Pagoda spire
        makeCyl(0.3, 0.3, 4, 8, pagodaWhite, ox + 30, 11.5, oz - 25);
        makeCone(0.8, 2, 8, pagodaRed, ox + 30, 14, oz - 25);

        // Bandstand
        makeCyl(0.4, 0.4, 4, 8, stoneColor, ox + 45, 2, oz + 15);
        makeCyl(0.4, 0.4, 4, 8, stoneColor, ox + 45, 2, oz + 20);
        makeCyl(0.4, 0.4, 4, 8, stoneColor, ox + 50, 2, oz + 15);
        makeCyl(0.4, 0.4, 4, 8, stoneColor, ox + 50, 2, oz + 20);
        makeCyl(0.4, 0.4, 4, 8, stoneColor, ox + 47.5, 2, oz + 13);
        makeCyl(0.4, 0.4, 4, 8, stoneColor, ox + 47.5, 2, oz + 22);
        makeCone(6, 3, 8, 0x116622, ox + 47.5, 6.5, oz + 17.5);
        makeBox(9, 0.4, 12, 0x8B6914, ox + 47.5, 0.5, oz + 17.5);

        // Park pump house building
        makeBox(12, 6, 8, 0x8B5A2B, ox - 45, 3, oz + 25);
        makeBox(12, 1, 9, 0x6B4A1B, ox - 45, 6.5, oz + 25);
        makeCone(4, 3, 4, 0x5A3A0B, ox - 45, 8.5, oz + 25);
        makeBox(2, 4, 0.5, 0x3A1A05, ox - 45, 2, oz + 21);
        makeBox(2, 2.5, 0.5, 0x4488AA, ox - 45, 2, oz + 29);

        // Tree avenues (trunks + canopy)
        var treePositions = [
            [ox - 10, oz + 10], [ox - 10, oz + 20], [ox - 10, oz + 30],
            [ox + 10, oz + 10], [ox + 10, oz + 20], [ox + 10, oz + 30],
            [ox + 20, oz - 15], [ox + 20, oz - 5], [ox + 20, oz + 5],
            [ox - 5, oz - 15], [ox - 5, oz - 5], [ox - 5, oz + 5],
            [ox + 40, oz + 5], [ox + 40, oz + 20], [ox + 40, oz + 30],
            [ox - 35, oz + 5], [ox - 35, oz + 20], [ox - 40, oz - 10],
            [ox + 55, oz - 10], [ox + 55, oz + 5], [ox + 55, oz + 20]
        ];

        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0];
            var tz = treePositions[t][1];
            makeCyl(0.4, 0.5, 4, 6, treeTrunk, tx, 2, tz);
            makeSphere(3, 8, 8, treeGreen, tx, 6.5, tz);
        }

        // Riverside esplanade wall
        makeBox(130, 2, 1.5, stoneColor, ox, 1, oz + 42);
        makeBox(130, 0.5, 2, stoneColor, ox, 2.25, oz + 42);

        // Benches along path
        for (var b = -3; b <= 3; b++) {
            makeBox(3, 0.5, 1, 0x8B6914, ox + b * 15, 0.8, oz + 8);
            makeBox(0.2, 1.2, 1, 0x5C3317, ox + b * 15 - 1.2, 0.6, oz + 8);
            makeBox(0.2, 1.2, 1, 0x5C3317, ox + b * 15 + 1.2, 0.6, oz + 8);
        }

        // Flower bed patches
        makeBox(8, 0.4, 5, 0xFF6688, ox + 20, 0.2, oz + 25);
        makeBox(8, 0.4, 5, 0xFFAA22, ox + 8, 0.2, oz + 28);
        makeBox(6, 0.4, 4, 0xCC44FF, ox - 15, 0.2, oz + 30);
    }

    function buildTubeStation(ox, oz) {
        var tubeBlue = 0x003399;
        var concColor = 0xCCCCBB;
        var glassColor = 0x88BBDD;
        var steelColor = 0x8899AA;
        var darkSteel = 0x445566;

        // Station entrance pod 1 (main)
        makeBox(10, 5, 8, concColor, ox, 2.5, oz);
        makeBox(10.5, 1, 8.5, steelColor, ox, 5.25, oz);
        // Curved roof approximation using stacked boxes
        makeBox(9, 1.5, 7, concColor, ox, 5.75, oz);
        makeBox(7, 1.5, 6, concColor, ox, 6.75, oz);
        makeBox(5, 1.5, 5, concColor, ox, 7.5, oz);
        makeBox(3, 1, 4, concColor, ox, 8.25, oz);

        // Glass front wall
        makeBox(0.4, 4.5, 7.5, glassColor, ox - 5, 2.5, oz);

        // Entry doors
        makeBox(0.2, 3, 2, darkSteel, ox - 5.2, 1.5, oz - 1.5);
        makeBox(0.2, 3, 2, darkSteel, ox - 5.2, 1.5, oz + 1.5);

        // Tube roundel sign
        makeCyl(1.5, 1.5, 0.3, 16, 0xFF0000, ox - 5.5, 5, oz);
        makeCyl(0.8, 0.8, 0.4, 16, 0xFFFFFF, ox - 5.5, 5, oz);
        makeBox(3.5, 0.6, 0.4, tubeBlue, ox - 5.5, 5, oz);

        // Station entrance pod 2 (secondary)
        makeBox(7, 4, 6, concColor, ox + 18, 2, oz + 5);
        makeBox(7.4, 0.8, 6.4, steelColor, ox + 18, 4.4, oz + 5);
        makeBox(6, 1.2, 5.5, concColor, ox + 18, 5.4, oz + 5);
        makeBox(4, 1.2, 4.5, concColor, ox + 18, 6.2, oz + 5);

        // Ventilation shafts
        makeBox(3, 8, 3, concColor, ox + 30, 4, oz - 5);
        makeBox(3.5, 0.5, 3.5, darkSteel, ox + 30, 8.25, oz - 5);
        makeBox(3, 8, 3, concColor, ox + 35, 4, oz - 5);
        makeBox(3.5, 0.5, 3.5, darkSteel, ox + 35, 8.25, oz - 5);

        // Vent grilles
        makeBox(0.2, 6, 2.5, darkSteel, ox + 28.5, 4, oz - 5);
        makeBox(0.2, 6, 2.5, darkSteel, ox + 31.5, 4, oz - 5);
        makeBox(0.2, 6, 2.5, darkSteel, ox + 33.5, 4, oz - 5);
        makeBox(0.2, 6, 2.5, darkSteel, ox + 36.5, 4, oz - 5);

        // Station canopy walkway
        makeBox(25, 0.4, 8, steelColor, ox + 10, 4.5, oz);
        for (var sc = 0; sc <= 4; sc++) {
            makeCyl(0.3, 0.3, 4.5, 6, darkSteel, ox + sc * 5 + 2, 2.25, oz - 3);
            makeCyl(0.3, 0.3, 4.5, 6, darkSteel, ox + sc * 5 + 2, 2.25, oz + 3);
        }

        // Wayfinding signage boxes
        makeBox(4, 1.5, 0.3, tubeBlue, ox - 8, 3.5, oz - 4.1);
        makeBox(4, 1.5, 0.3, tubeBlue, ox - 8, 3.5, oz + 4.1);

        // Ground level platform area
        makeBox(40, 0.3, 16, 0xAAAAAA, ox + 10, 0.15, oz);
    }

    function buildElectricBoulevard(ox, oz) {
        var concColor = 0xDDCCBB;
        var glassColor = 0x99CCEE;
        var shopColor = 0xEEDDBB;
        var steelColor = 0x8899AA;
        var residColor = 0xCCBBA9;
        var darkColor = 0x334455;
        var brickColor = 0x9B5B3A;
        var accentColor = 0x227733;

        // Main boulevard (wide pedestrianized street)
        makeBox(90, 0.3, 18, concColor, ox, 0.15, oz);

        // Central median with planting
        makeBox(80, 0.5, 3, accentColor, ox, 0.25, oz);

        // Median trees
        for (var mt = -4; mt <= 4; mt++) {
            makeCyl(0.3, 0.4, 3, 6, 0x5C3317, ox + mt * 9, 1.5, oz);
            makeSphere(2, 8, 6, 0x2D7A1A, ox + mt * 9, 4.5, oz);
        }

        // Street lamps along boulevard
        for (var sl = -4; sl <= 4; sl++) {
            makeCyl(0.2, 0.2, 6, 6, 0x444455, ox + sl * 10, 3, oz - 7);
            makeSphere(0.6, 6, 6, 0xFFFFCC, ox + sl * 10, 6.2, oz - 7);
            makeCyl(0.2, 0.2, 6, 6, 0x444455, ox + sl * 10, 3, oz + 7);
            makeSphere(0.6, 6, 6, 0xFFFFCC, ox + sl * 10, 6.2, oz + 7);
        }

        // South side shops (ground floor retail)
        makeBox(80, 5, 8, shopColor, ox, 2.5, oz - 13);
        makeBox(80, 0.5, 8.5, steelColor, ox, 5.25, oz - 13);
        // Shop window glazing
        for (var sw = -4; sw <= 4; sw++) {
            makeBox(7, 3.5, 0.3, glassColor, ox + sw * 9, 2, oz - 17.1);
        }
        // Shop signage band
        makeBox(80, 1.5, 0.4, 0x2244AA, ox, 4.5, oz - 17.1);

        // North side shops
        makeBox(80, 5, 8, shopColor, ox, 2.5, oz + 13);
        makeBox(80, 0.5, 8.5, steelColor, ox, 5.25, oz + 13);
        for (var nw = -4; nw <= 4; nw++) {
            makeBox(7, 3.5, 0.3, glassColor, ox + nw * 9, 2, oz + 17.1);
        }
        makeBox(80, 1.5, 0.4, 0x2244AA, ox, 4.5, oz + 17.1);

        // Residential tower south (18 floors)
        makeBox(20, 54, 14, residColor, ox - 50, 27, oz - 20);
        // Tower facade grid
        for (var tf = 0; tf <= 17; tf++) {
            makeBox(20.2, 0.4, 14.2, darkColor, ox - 50, tf * 3 + 1, oz - 20);
        }
        for (var tc = -3; tc <= 3; tc++) {
            makeBox(0.4, 54, 14.2, darkColor, ox - 50 + tc * 3, 27, oz - 20);
        }
        // Tower roof feature
        makeBox(20, 3, 14, 0x6688AA, ox - 50, 55.5, oz - 20);
        makeBox(12, 2, 6, glassColor, ox - 50, 57.5, oz - 20);
        makeCyl(0.8, 0.8, 6, 8, steelColor, ox - 50, 60, oz - 20);

        // Residential tower north
        makeBox(20, 48, 14, residColor, ox - 50, 24, oz + 20);
        for (var nf = 0; nf <= 15; nf++) {
            makeBox(20.2, 0.4, 14.2, darkColor, ox - 50, nf * 3 + 1, oz + 20);
        }
        for (var nc = -3; nc <= 3; nc++) {
            makeBox(0.4, 48, 14.2, darkColor, ox - 50 + nc * 3, 24, oz + 20);
        }
        makeBox(20, 3, 14, 0x6688AA, ox - 50, 49.5, oz + 20);

        // East end residential towers (framing the approach)
        makeBox(18, 60, 12, residColor, ox + 50, 30, oz - 18);
        for (var ef = 0; ef <= 19; ef++) {
            makeBox(18.2, 0.4, 12.2, darkColor, ox + 50, ef * 3 + 1, oz - 18);
        }
        makeBox(18, 60, 12, residColor, ox + 50, 30, oz + 18);
        for (var enf = 0; enf <= 19; enf++) {
            makeBox(18.2, 0.4, 12.2, darkColor, ox + 50, enf * 3 + 1, oz + 18);
        }

        // Tower podium bases
        makeBox(22, 3, 16, brickColor, ox - 50, 1.5, oz - 20);
        makeBox(22, 3, 16, brickColor, ox - 50, 1.5, oz + 20);
        makeBox(20, 3, 14, brickColor, ox + 50, 1.5, oz - 18);
        makeBox(20, 3, 14, brickColor, ox + 50, 1.5, oz + 18);

        // Plaza feature: large circular artwork plinth
        makeCyl(6, 6, 0.8, 16, stoneColorBlvd(), ox, 0.4, oz);
        makeCyl(4, 4, 2.5, 16, 0xCCBBAA, ox, 1.65, oz);
        makeCyl(1.5, 1.5, 5, 12, 0x334455, ox, 4.5, oz);
        makeSphere(2.5, 12, 12, 0xFFCC00, ox, 7.5, oz);

        // Outdoor seating areas
        for (var seat = -3; seat <= 3; seat++) {
            makeBox(2, 0.5, 1.2, 0x8B6914, ox + seat * 12, 0.5, oz - 5);
            makeBox(2, 0.5, 1.2, 0x8B6914, ox + seat * 12, 0.5, oz + 5);
        }

        // Cycle lane marking (slight color variation)
        makeBox(80, 0.32, 2.5, 0xCCBB99, ox, 0.16, oz - 8);
        makeBox(80, 0.32, 2.5, 0xCCBB99, ox, 0.16, oz + 8);
    }

    function stoneColorBlvd() {
        return 0xBBAA99;
    }

    function buildGroundPlane(ox, oz) {
        // Thames riverbed approximation
        makeBox(200, 0.2, 60, 0x1A4A77, ox, -0.1, oz + 80);
        // Riverside path
        makeBox(200, 0.3, 12, 0xCCBBAA, ox, 0.1, oz + 45);
    }

    function build() {
        var ox = 11480;

        // Ground / Thames
        buildGroundPlane(ox, 0);

        // Power station at centre
        buildPowerStation(ox, 0);

        // Flying pig floating between chimneys
        buildFlyingPig(ox, 0);

        // Battersea Park to the east along riverside
        buildBatterseaPark(ox + 90, -10);

        // Northern line extension station to the north
        buildTubeStation(ox - 30, -65);

        // Electric Boulevard leading up from Nine Elms
        buildElectricBoulevard(ox - 100, -55);
    }

    function update(delta) {
        if (pig) {
            pigTime += delta;
            // Gentle bobbing and slow rotation
            pig.position.y = 44 + Math.sin(pigTime * 0.4) * 1.2;
            pig.rotation.y = Math.sin(pigTime * 0.15) * 0.12;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        pig = null;
        pigTime = 0;
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
