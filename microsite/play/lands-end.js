window.LandsEnd = (function() {
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
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color, flatShading: flat ? true : false }));
    }

    function buildCliffs() {
        var X = 14360;
        var cliffColor = 0x2a2a2a;
        var darkGranite = 0x1a1a1e;
        var midGranite = 0x3a3a3e;

        // Main cliff face — long horizontal slab
        var m;
        m = makeMesh(new THREE.BoxGeometry(800, 60, 30), cliffColor, true);
        m.position.set(X, 30, -400);
        addObj(m);

        // Cliff variations — jagged top
        var i;
        for (i = 0; i < 18; i++) {
            var h = 40 + Math.floor(i * 3.7) % 35;
            var w = 30 + (i * 17) % 50;
            m = makeMesh(new THREE.BoxGeometry(w, h, 25 + (i * 7) % 20), darkGranite, true);
            m.position.set(X - 380 + i * 42, h / 2, -388 + (i % 3) * 8);
            addObj(m);
        }

        // Jagged rock outcroppings at base
        for (i = 0; i < 12; i++) {
            var rh = 8 + (i * 11) % 20;
            m = makeMesh(new THREE.ConeGeometry(4 + (i * 3) % 8, rh, 5), midGranite, true);
            m.position.set(X - 300 + i * 55, rh / 2 - 5, -420 - (i % 4) * 15);
            addObj(m);
        }

        // Wave-cut cave arches (dark boxes recessed into cliff)
        for (i = 0; i < 4; i++) {
            m = makeMesh(new THREE.BoxGeometry(15, 12, 10), 0x0a0a0a, true);
            m.position.set(X - 200 + i * 130, 6, -385);
            addObj(m);
        }

        // Sea spray — white sphere clusters at cliff base
        for (i = 0; i < 30; i++) {
            m = makeMesh(new THREE.SphereGeometry(1.5 + (i % 3) * 0.8, 5, 4), 0xffffff, true);
            m.position.set(X - 380 + (i * 27) % 760, 2 + (i % 4), -428 - (i % 5) * 5);
            addObj(m);
        }

        // Cliff top plateau
        m = makeMesh(new THREE.BoxGeometry(850, 3, 200), 0x5a6e3a, true);
        m.position.set(X, 61, -300);
        addObj(m);

        // Lower rocky shelf at water level
        m = makeMesh(new THREE.BoxGeometry(700, 6, 40), midGranite, true);
        m.position.set(X, -3, -440);
        addObj(m);

        // Extra jagged granite spires
        var spireX = [X - 350, X - 180, X + 50, X + 220, X + 370];
        for (i = 0; i < 5; i++) {
            m = makeMesh(new THREE.ConeGeometry(6, 25 + i * 5, 4), cliffColor, true);
            m.position.set(spireX[i], 25 + i * 5 / 2 + 60, -410);
            addObj(m);
        }
    }

    function buildLongshipsLighthouse() {
        var X = 14360;
        // Rocky reef base — 2km offshore (z ~ -2400 scaled)
        var reefZ = -560;
        var lhX = X - 120;

        var reef = makeMesh(new THREE.CylinderGeometry(18, 22, 8, 8), 0x2a2a2a, true);
        reef.position.set(lhX, 4, reefZ);
        addObj(reef);

        // Extra reef rocks
        var m = makeMesh(new THREE.BoxGeometry(12, 5, 10), 0x1a1a1a, true);
        m.position.set(lhX + 14, 2, reefZ - 8);
        addObj(m);

        var m2 = makeMesh(new THREE.BoxGeometry(8, 4, 7), 0x222222, true);
        m2.position.set(lhX - 12, 1, reefZ + 6);
        addObj(m2);

        // Tower base
        var base = makeMesh(new THREE.CylinderGeometry(6, 7, 10, 10), 0xddddcc, true);
        base.position.set(lhX, 13, reefZ);
        addObj(base);

        // Main white tower
        var tower = makeMesh(new THREE.CylinderGeometry(4, 5.5, 35, 10), 0xffffff, true);
        tower.position.set(lhX, 35.5, reefZ);
        addObj(tower);

        // Red band
        var band = makeMesh(new THREE.CylinderGeometry(4.1, 4.1, 5, 10), 0xcc2222, true);
        band.position.set(lhX, 28, reefZ);
        addObj(band);

        // Second red band
        var band2 = makeMesh(new THREE.CylinderGeometry(4.1, 4.1, 3, 10), 0xcc2222, true);
        band2.position.set(lhX, 45, reefZ);
        addObj(band2);

        // Lantern room
        var lantern = makeMesh(new THREE.CylinderGeometry(5, 4, 6, 8), 0x888888, true);
        lantern.position.set(lhX, 56, reefZ);
        addObj(lantern);

        // Lantern dome
        var dome = makeMesh(new THREE.SphereGeometry(4.5, 8, 6), 0xaaaaaa, true);
        dome.position.set(lhX, 62, reefZ);
        addObj(dome);

        // Light beacon sphere
        var light = makeMesh(new THREE.SphereGeometry(2, 6, 5), 0xffffaa, true);
        light.position.set(lhX, 64, reefZ);
        addObj(light);

        // Helicopter landing pad — small flat disc on top
        var pad = makeMesh(new THREE.CylinderGeometry(6, 6, 0.5, 8), 0x888855, true);
        pad.position.set(lhX, 67, reefZ);
        addObj(pad);

        // Pad markings (small box)
        var mark = makeMesh(new THREE.BoxGeometry(8, 0.3, 1), 0xffffff, true);
        mark.position.set(lhX, 67.3, reefZ);
        addObj(mark);
    }

    function buildArmedKnight() {
        var X = 14360;
        var akX = X + 200;
        var akZ = -500;

        // Main rock stack base
        var base = makeMesh(new THREE.CylinderGeometry(12, 18, 20, 6), 0x2a2a2a, true);
        base.position.set(akX, 10, akZ);
        addObj(base);

        // Mid section — narrower
        var mid = makeMesh(new THREE.CylinderGeometry(8, 12, 25, 6), 0x1e1e22, true);
        mid.position.set(akX, 32, akZ);
        addObj(mid);

        // Top pinnacle
        var top = makeMesh(new THREE.ConeGeometry(5, 20, 5), 0x2a2a2a, true);
        top.position.set(akX, 54, akZ);
        addObj(top);

        // Side jagged spires
        var sp1 = makeMesh(new THREE.ConeGeometry(3, 15, 4), 0x1a1a1e, true);
        sp1.position.set(akX + 8, 30, akZ + 5);
        addObj(sp1);

        var sp2 = makeMesh(new THREE.ConeGeometry(2, 12, 4), 0x222226, true);
        sp2.position.set(akX - 7, 25, akZ - 6);
        addObj(sp2);

        // Seabirds on top — small white spheres
        var i;
        for (i = 0; i < 8; i++) {
            var b = makeMesh(new THREE.SphereGeometry(0.6, 4, 3), 0xffffff, true);
            b.position.set(akX - 3 + (i % 4) * 2, 65 + (i % 3), akZ - 2 + Math.floor(i / 4) * 3);
            addObj(b);
        }

        // Sea spray at base
        for (i = 0; i < 10; i++) {
            var sp = makeMesh(new THREE.SphereGeometry(1 + (i % 3) * 0.5, 4, 3), 0xffffff, true);
            sp.position.set(akX - 15 + (i * 4) % 30, 1, akZ - 12 + (i * 3) % 24);
            addObj(sp);
        }
    }

    function buildSignpost() {
        var X = 14360;
        var spX = X + 20;
        var spZ = -250;
        var groundY = 62;

        // Wooden post — vertical cylinder
        var post = makeMesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 6), 0x8B6914, true);
        post.position.set(spX, groundY + 2.5, spZ);
        addObj(post);

        // Sign arms — directional boards
        var armData = [
            [3, 0.5, 0.15, 0.8, 0, 0, 1.6], // New York
            [2.8, 0.5, 0.15, 0.6, 0, 20, -1.0], // John o'Groats
            [3.2, 0.5, 0.15, 1.0, 0, -20, 0.8], // Isles of Scilly
            [2.5, 0.5, 0.15, 0.4, 0, 15, -0.2]  // home town
        ];
        var i;
        for (i = 0; i < armData.length; i++) {
            var d = armData[i];
            var arm = makeMesh(new THREE.BoxGeometry(d[0], d[1], d[2]), 0x8B6914, true);
            arm.position.set(spX + d[6], groundY + 3.5 + d[3], spZ);
            arm.rotation.y = d[5] * Math.PI / 180;
            addObj(arm);
        }

        // Sign board at top — larger painted board
        var board = makeMesh(new THREE.BoxGeometry(2.5, 1.0, 0.12), 0x8B4513, true);
        board.position.set(spX, groundY + 5.2, spZ);
        addObj(board);

        // Tourist crowd around signpost — cylinder people
        var crowdColors = [0xcc4444, 0x4444cc, 0x44aa44, 0xaa44aa, 0xcc8844, 0x44cccc];
        for (i = 0; i < 8; i++) {
            var body = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.7, 6), crowdColors[i % 6], false);
            body.position.set(spX - 3 + (i % 4) * 2, groundY + 0.85, spZ + 2 - Math.floor(i / 4) * 4);
            addObj(body);
            // Head sphere
            var head = makeMesh(new THREE.SphereGeometry(0.35, 5, 4), 0xffddaa, true);
            head.position.set(spX - 3 + (i % 4) * 2, groundY + 2.1, spZ + 2 - Math.floor(i / 4) * 4);
            addObj(head);
        }

        // Photo spot marker — small low box
        var spot = makeMesh(new THREE.BoxGeometry(3, 0.15, 2), 0x888877, true);
        spot.position.set(spX, groundY + 0.08, spZ + 3);
        addObj(spot);
    }

    function buildVisitorComplex() {
        var X = 14360;
        var groundY = 62;

        // Hotel building — main large block
        var hotel = makeMesh(new THREE.BoxGeometry(50, 15, 30), 0xc8b88a, true);
        hotel.position.set(X + 80, groundY + 7.5, -230);
        addObj(hotel);

        // Hotel roof
        var hotelRoof = makeMesh(new THREE.BoxGeometry(52, 3, 32), 0x888877, true);
        hotelRoof.position.set(X + 80, groundY + 16, -230);
        addObj(hotelRoof);

        // Hotel windows — rows of small dark boxes
        var i;
        for (i = 0; i < 6; i++) {
            var win = makeMesh(new THREE.BoxGeometry(4, 3, 0.5), 0x224466, true);
            win.position.set(X + 58 + i * 8, groundY + 10, -215.3);
            addObj(win);
        }
        for (i = 0; i < 6; i++) {
            var win2 = makeMesh(new THREE.BoxGeometry(4, 3, 0.5), 0x224466, true);
            win2.position.set(X + 58 + i * 8, groundY + 4, -215.3);
            addObj(win2);
        }

        // Visitor centre — smaller adjacent building
        var vc = makeMesh(new THREE.BoxGeometry(35, 10, 25), 0xd4c89a, true);
        vc.position.set(X - 30, groundY + 5, -225);
        addObj(vc);

        var vcRoof = makeMesh(new THREE.BoxGeometry(37, 2, 27), 0x777766, true);
        vcRoof.position.set(X - 30, groundY + 11, -225);
        addObj(vcRoof);

        // Dr Syntax Inn — small pub building
        var inn = makeMesh(new THREE.BoxGeometry(22, 9, 18), 0xbb9977, true);
        inn.position.set(X - 100, groundY + 4.5, -240);
        addObj(inn);

        // Inn sign
        var innSign = makeMesh(new THREE.BoxGeometry(5, 2, 0.3), 0x6b4423, true);
        innSign.position.set(X - 100, groundY + 10, -231.2);
        addObj(innSign);

        // Gift shop — small cube building
        var gift = makeMesh(new THREE.BoxGeometry(18, 8, 15), 0xccbb88, true);
        gift.position.set(X - 65, groundY + 4, -200);
        addObj(gift);

        // First and Last pub
        var pub = makeMesh(new THREE.BoxGeometry(20, 10, 18), 0xaa8866, true);
        pub.position.set(X + 140, groundY + 5, -240);
        addObj(pub);

        // Pub chimney
        var chimney = makeMesh(new THREE.CylinderGeometry(1, 1.2, 6, 5), 0x886644, true);
        chimney.position.set(X + 148, groundY + 13, -235);
        addObj(chimney);

        // Car park — flat grey area
        var carpark = makeMesh(new THREE.BoxGeometry(120, 0.3, 60), 0x555555, true);
        carpark.position.set(X + 60, groundY - 0.15, -170);
        addObj(carpark);

        // Parked cars — small boxes in rows
        var carColors = [0x3344cc, 0xcc3333, 0x333333, 0x228844, 0xcccc33, 0xcc7733];
        for (i = 0; i < 12; i++) {
            var car = makeMesh(new THREE.BoxGeometry(4, 2, 2), carColors[i % 6], true);
            car.position.set(X - 10 + (i % 6) * 20, groundY + 1, -165 + Math.floor(i / 6) * 12);
            addObj(car);
        }

        // Entrance path
        var path = makeMesh(new THREE.BoxGeometry(8, 0.2, 40), 0x888877, true);
        path.position.set(X + 20, groundY + 0.1, -195);
        addObj(path);
    }

    function buildCoastalPath() {
        var X = 14360;
        var groundY = 62;

        // South West Coast Path segments — narrow flat boxes hugging cliff edge
        var i;
        for (i = 0; i < 16; i++) {
            var seg = makeMesh(new THREE.BoxGeometry(50, 0.4, 3), 0x998866, true);
            seg.position.set(X - 370 + i * 50, groundY + 0.2, -372 + (i % 3) * 4 - (i % 5) * 2);
            seg.rotation.y = ((i % 5) - 2) * 0.04;
            addObj(seg);
        }

        // Path marker stones
        for (i = 0; i < 6; i++) {
            var stone = makeMesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), 0x777777, true);
            stone.position.set(X - 350 + i * 100, groundY + 0.6, -370);
            addObj(stone);
        }

        // Kissing gate — two small cylinder posts + horizontal bar
        var gateX = X - 100;
        var gateZ = -365;
        var post1 = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 5), 0x664422, true);
        post1.position.set(gateX, groundY + 1, gateZ);
        addObj(post1);

        var post2 = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 5), 0x664422, true);
        post2.position.set(gateX + 2, groundY + 1, gateZ);
        addObj(post2);

        var gateBar = makeMesh(new THREE.BoxGeometry(2.4, 0.2, 0.2), 0x664422, true);
        gateBar.position.set(gateX + 1, groundY + 1.8, gateZ);
        addObj(gateBar);

        // Stone distance marker
        var marker = makeMesh(new THREE.BoxGeometry(0.8, 1.8, 0.4), 0x888888, true);
        marker.position.set(X + 300, groundY + 0.9, -368);
        addObj(marker);

        // Viewpoint flat area
        var viewpoint = makeMesh(new THREE.BoxGeometry(15, 0.3, 12), 0x8a8a6a, true);
        viewpoint.position.set(X - 300, groundY + 0.15, -360);
        addObj(viewpoint);

        // Scilly Isles on distant horizon — low flat shapes
        var scillyColors = [0x446655, 0x3a5544, 0x4a6655];
        for (i = 0; i < 3; i++) {
            var isle = makeMesh(new THREE.BoxGeometry(30 + i * 15, 4 + i * 2, 10), scillyColors[i], true);
            isle.position.set(X - 200 + i * 120, 2, -900 - i * 80);
            addObj(isle);
            // Small hills on isles
            var hill = makeMesh(new THREE.SphereGeometry(8 + i * 3, 5, 4), scillyColors[i], true);
            hill.position.set(X - 200 + i * 120, 7, -900 - i * 80);
            addObj(hill);
        }

        // Coastal grass tufts — small vertical boxes
        for (i = 0; i < 20; i++) {
            var tuft = makeMesh(new THREE.BoxGeometry(2, 1.5, 2), 0x5a7a3a, true);
            tuft.position.set(X - 400 + (i * 41) % 800, groundY + 0.75, -345 - (i * 7) % 40);
            addObj(tuft);
        }

        // Cliff edge warning posts (small red-topped cylinders)
        for (i = 0; i < 8; i++) {
            var wpost = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 5), 0xdddddd, true);
            wpost.position.set(X - 360 + i * 100, groundY + 0.75, -378);
            addObj(wpost);
            var wtop = makeMesh(new THREE.SphereGeometry(0.35, 4, 3), 0xcc2222, true);
            wtop.position.set(X - 360 + i * 100, groundY + 1.6, -378);
            addObj(wtop);
        }
    }

    function buildGroundPlane() {
        var X = 14360;

        // Sea surface
        var sea = makeMesh(new THREE.BoxGeometry(1200, 1, 800), 0x1a4a6e, true);
        sea.position.set(X, -0.5, -600);
        addObj(sea);

        // Clifftop ground
        var cliff_top = makeMesh(new THREE.BoxGeometry(900, 2, 250), 0x4a5e2a, true);
        cliff_top.position.set(X, 61, -280);
        addObj(cliff_top);
    }

    function build() {
        buildGroundPlane();
        buildCliffs();
        buildLongshipsLighthouse();
        buildArmedKnight();
        buildSignpost();
        buildVisitorComplex();
        buildCoastalPath();
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
