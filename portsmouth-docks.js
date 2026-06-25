window.PortsmouthDocks = (function() {
    'use strict';

    var OX = 4000;
    var OZ = 2200;
    var objects = [];
    var scene = null;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        return mesh;
    }

    function add(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildspinnakertower() {
        // Main tall column
        var column = makebox(4, 32, 4, 0xFFFFFF, 0, 16, 0);
        add(column);

        // Left sail wing spreading outward and upward
        var leftsail = makebox(12, 20, 1, 0xFFFFFF, -7, 22, 0);
        leftsail.rotation.z = 0.35;
        add(leftsail);

        // Right sail wing spreading outward and upward
        var rightsail = makebox(12, 20, 1, 0xFFFFFF, 7, 22, 0);
        rightsail.rotation.z = -0.35;
        add(rightsail);

        // Base podium
        var base = makebox(10, 3, 10, 0xCCCCCC, 0, 1.5, 0);
        add(base);

        // Observation deck near top
        var deck = makebox(8, 2, 8, 0xEEEEEE, 0, 30, 0);
        add(deck);
    }

    function buildhmsVictory() {
        var bx = 80;
        var bz = 60;

        // Main hull
        var hull = makebox(30, 6, 8, 0x5C4033, bx, 3, bz);
        add(hull);

        // Bow section (front tapering block)
        var bow = makebox(6, 5, 7, 0x5C4033, bx + 17, 2.5, bz);
        add(bow);

        // Stern section
        var stern = makebox(6, 7, 8, 0x5C4033, bx - 17, 3.5, bz);
        add(stern);

        // Deck superstructure
        var deck = makebox(28, 2, 6, 0x6B4C3B, bx, 7, bz);
        add(deck);

        // Forecastle
        var forecastle = makebox(8, 3, 6, 0x7A5C4A, bx + 10, 8.5, bz);
        add(forecastle);

        // Quarterdeck
        var quarterdeck = makebox(10, 3, 6, 0x7A5C4A, bx - 10, 8.5, bz);
        add(quarterdeck);

        // Foremast
        var foremast = makecylinder(0.3, 0.5, 22, 8, 0x8B7355, bx + 8, 19, bz);
        add(foremast);

        // Mainmast
        var mainmast = makecylinder(0.4, 0.6, 28, 8, 0x8B7355, bx, 22, bz);
        add(mainmast);

        // Mizzenmast
        var mizzenmast = makecylinder(0.3, 0.4, 20, 8, 0x8B7355, bx - 9, 18, bz);
        add(mizzenmast);

        // Fore yard spar
        var foreyard = makebox(14, 0.4, 0.4, 0x8B7355, bx + 8, 26, bz);
        add(foreyard);

        // Main yard spar
        var mainyard = makebox(18, 0.4, 0.4, 0x8B7355, bx, 32, bz);
        add(mainyard);

        // Mizzen yard spar
        var mizzenyard = makebox(12, 0.4, 0.4, 0x8B7355, bx - 9, 24, bz);
        add(mizzenyard);

        // Lower fore yard
        var lowerforeyard = makebox(12, 0.4, 0.4, 0x8B7355, bx + 8, 18, bz);
        add(lowerforeyard);

        // Lower main yard
        var lowermainyard = makebox(16, 0.4, 0.4, 0x8B7355, bx, 22, bz);
        add(lowermainyard);

        // Gun ports row 1 (port side boxes representing ports)
        var i;
        for (i = 0; i < 5; i++) {
            var gp1 = makebox(1.5, 1, 0.4, 0x2A1A0A, bx - 8 + i * 4, 3, bz + 4.2);
            add(gp1);
        }

        // Gun ports row 2 starboard side
        for (i = 0; i < 5; i++) {
            var gp2 = makebox(1.5, 1, 0.4, 0x2A1A0A, bx - 8 + i * 4, 3, bz - 4.2);
            add(gp2);
        }

        // Upper gun ports port side
        for (i = 0; i < 4; i++) {
            var ugp1 = makebox(1.5, 1, 0.4, 0x2A1A0A, bx - 6 + i * 4, 6.5, bz + 4.2);
            add(ugp1);
        }

        // Upper gun ports starboard
        for (i = 0; i < 4; i++) {
            var ugp2 = makebox(1.5, 1, 0.4, 0x2A1A0A, bx - 6 + i * 4, 6.5, bz - 4.2);
            add(ugp2);
        }
    }

    function buildhmsWarrior() {
        var bx = -80;
        var bz = 50;

        // Main iron hull
        var hull = makebox(35, 5, 7, 0x1C1C1C, bx, 2.5, bz);
        add(hull);

        // Bow block
        var bow = makebox(7, 4, 6, 0x1C1C1C, bx + 20, 2, bz);
        add(bow);

        // Stern block
        var stern = makebox(5, 6, 7, 0x1C1C1C, bx - 19, 3, bz);
        add(stern);

        // Armoured citadel amidships
        var citadel = makebox(18, 4, 6, 0x2C2C2C, bx, 7, bz);
        add(citadel);

        // Deck
        var deck = makebox(33, 1, 6, 0x333333, bx, 5.5, bz);
        add(deck);

        // Forward smokestack
        var smokestack1 = makecylinder(1, 1.2, 12, 10, 0x111111, bx + 5, 12, bz);
        add(smokestack1);

        // Aft smokestack
        var smokestack2 = makecylinder(1, 1.2, 10, 10, 0x111111, bx - 5, 11, bz);
        add(smokestack2);

        // Smokestack caps
        var cap1 = makecylinder(1.4, 1, 1, 10, 0x0A0A0A, bx + 5, 18.5, bz);
        add(cap1);
        var cap2 = makecylinder(1.4, 1, 1, 10, 0x0A0A0A, bx - 5, 16.5, bz);
        add(cap2);

        // Foremast
        var foremast = makecylinder(0.3, 0.5, 20, 8, 0x8B7355, bx + 12, 16, bz);
        add(foremast);

        // Mainmast
        var mainmast = makecylinder(0.3, 0.5, 22, 8, 0x8B7355, bx - 10, 17, bz);
        add(mainmast);

        // Fore yard
        var foreyard = makebox(14, 0.4, 0.4, 0x8B7355, bx + 12, 22, bz);
        add(foreyard);

        // Main yard
        var mainyard = makebox(14, 0.4, 0.4, 0x8B7355, bx - 10, 24, bz);
        add(mainyard);

        // Side gun port row
        var i;
        for (i = 0; i < 6; i++) {
            var gp = makebox(1.5, 1.2, 0.4, 0x0A0A0A, bx - 12 + i * 4, 4.5, bz + 3.7);
            add(gp);
        }
    }

    function buildmaryRoseMuseum() {
        var bx = 50;
        var bz = 90;

        // Main museum building — distinctive angular charcoal structure
        var mainbldg = makebox(30, 12, 18, 0x444444, bx, 6, bz);
        add(mainbldg);

        // Angled roof section giving the distinctive silhouette
        var roof1 = makebox(30, 4, 10, 0x3A3A3A, bx, 14, bz - 4);
        roof1.rotation.x = 0.3;
        add(roof1);

        // Side wing
        var sidewing = makebox(12, 10, 18, 0x4A4A4A, bx + 21, 5, bz);
        add(sidewing);

        // Entrance canopy
        var canopy = makebox(10, 1, 6, 0x555555, bx - 16, 4, bz);
        add(canopy);

        // Entrance pillars
        var pillar1 = makecylinder(0.5, 0.5, 4, 6, 0x666666, bx - 19, 2, bz + 2);
        add(pillar1);
        var pillar2 = makecylinder(0.5, 0.5, 4, 6, 0x666666, bx - 19, 2, bz - 2);
        add(pillar2);

        // Signage block
        var sign = makebox(14, 2, 0.5, 0x333333, bx, 13, bz + 9.3);
        add(sign);
    }

    function buildportsmouthharbour() {
        // Harbour water surface — blue flat box
        var water = makebox(80, 0.5, 40, 0x1E90FF, -40, 0.25, 30);
        add(water);

        // Harbour wall port side
        var wall1 = makebox(80, 3, 2, 0x888888, -40, 1.5, 10);
        add(wall1);

        // Harbour wall far side
        var wall2 = makebox(80, 3, 2, 0x888888, -40, 1.5, 50);
        add(wall2);

        // Harbour wall end
        var wall3 = makebox(2, 3, 40, 0x888888, 0, 1.5, 30);
        add(wall3);

        // Quayside dock blocks
        var dock1 = makebox(15, 1, 5, 0x999999, -20, 0.5, 10);
        add(dock1);
        var dock2 = makebox(15, 1, 5, 0x999999, -50, 0.5, 10);
        add(dock2);

        // Mooring bollards
        var i;
        for (i = 0; i < 6; i++) {
            var bollard = makecylinder(0.4, 0.5, 1.5, 6, 0x444444, -15 - i * 10, 1.75, 11);
            add(bollard);
        }
    }

    function buildhistoricdockyardgates() {
        var bx = -10;
        var bz = -20;

        // Main gatehouse block
        var gatehouse = makebox(20, 14, 8, 0x8B4513, bx, 7, bz);
        add(gatehouse);

        // Gatehouse roof
        var roof = makebox(22, 3, 10, 0x7A3B10, bx, 15.5, bz);
        add(roof);

        // Left tower flanking gate
        var ltower = makebox(6, 18, 6, 0x8B4513, bx - 13, 9, bz);
        add(ltower);

        // Right tower flanking gate
        var rtower = makebox(6, 18, 6, 0x8B4513, bx + 13, 9, bz);
        add(rtower);

        // Left tower cap
        var lcap = new THREE.Mesh(
            new THREE.ConeGeometry(4.5, 5, 4),
            new THREE.MeshLambertMaterial({ color: 0x5C2E00 })
        );
        lcap.position.set(OX + bx - 13, 20, OZ + bz);
        add(lcap);

        // Right tower cap
        var rcap = new THREE.Mesh(
            new THREE.ConeGeometry(4.5, 5, 4),
            new THREE.MeshLambertMaterial({ color: 0x5C2E00 })
        );
        rcap.position.set(OX + bx + 13, 20, OZ + bz);
        add(rcap);

        // Gate arch suggestion — dark lintel
        var arch = makebox(8, 2, 8.2, 0x5C2E00, bx, 8, bz);
        add(arch);

        // Gate opening (dark box inset)
        var opening = makebox(6, 7, 8.4, 0x1A0A00, bx, 4.5, bz);
        add(opening);

        // Decorative windows left tower
        var win1 = makebox(1.5, 2, 0.5, 0x2A1A00, bx - 13, 12, bz + 3.3);
        add(win1);
        var win2 = makebox(1.5, 2, 0.5, 0x2A1A00, bx - 13, 6, bz + 3.3);
        add(win2);

        // Decorative windows right tower
        var win3 = makebox(1.5, 2, 0.5, 0x2A1A00, bx + 13, 12, bz + 3.3);
        add(win3);
        var win4 = makebox(1.5, 2, 0.5, 0x2A1A00, bx + 13, 6, bz + 3.3);
        add(win4);
    }

    function buildroundtower() {
        var bx = -60;
        var bz = -10;

        // Main round tower body
        var tower = makecylinder(8, 9, 10, 16, 0x888888, bx, 5, bz);
        add(tower);

        // Tower top parapet ring
        var parapet = makecylinder(8.5, 8, 2, 16, 0x777777, bx, 11, bz);
        add(parapet);

        // Tower base foundation
        var base = makecylinder(10, 10, 2, 16, 0x999999, bx, 1, bz);
        add(base);

        // Battlements — small boxes around top
        var i;
        var radius = 8;
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var bx2 = bx + Math.cos(angle) * radius;
            var bz2 = bz + Math.sin(angle) * radius;
            var battlement = makebox(2, 2, 2, 0x777777, bx2, 13, bz2);
            add(battlement);
        }
    }

    function buildsquaretower() {
        var bx = -45;
        var bz = -15;

        // Main tower body
        var tower = makebox(10, 12, 10, 0x808080, bx, 6, bz);
        add(tower);

        // Parapet top
        var parapet = makebox(12, 2, 12, 0x707070, bx, 13, bz);
        add(parapet);

        // Corner merlons
        var corners = [
            [-5, -5], [5, -5], [-5, 5], [5, 5]
        ];
        var i;
        for (i = 0; i < corners.length; i++) {
            var cx = corners[i][0];
            var cz = corners[i][1];
            var merlon = makebox(3, 3, 3, 0x707070, bx + cx, 15.5, bz + cz);
            add(merlon);
        }

        // Window slots
        var winN = makebox(2, 3, 0.5, 0x444444, bx, 7, bz + 5.3);
        add(winN);
        var winS = makebox(2, 3, 0.5, 0x444444, bx, 7, bz - 5.3);
        add(winS);
        var winE = makebox(0.5, 3, 2, 0x444444, bx + 5.3, 7, bz);
        add(winE);
        var winW = makebox(0.5, 3, 2, 0x444444, bx - 5.3, 7, bz);
        add(winW);

        // Base plinth
        var plinth = makebox(12, 2, 12, 0x909090, bx, 1, bz);
        add(plinth);
    }

    function buildgunwharfquays() {
        var bz = -60;
        var i;

        // Row of modern retail/residential buildings
        var buildingdefs = [
            { x: -70, w: 14, h: 16, d: 12 },
            { x: -52, w: 12, h: 20, d: 12 },
            { x: -36, w: 16, h: 14, d: 12 },
            { x: -16, w: 14, h: 18, d: 12 },
            { x: 2,   w: 12, h: 22, d: 12 },
            { x: 18,  w: 16, h: 16, d: 12 },
            { x: 36,  w: 14, h: 20, d: 12 },
            { x: 54,  w: 12, h: 15, d: 12 }
        ];

        for (i = 0; i < buildingdefs.length; i++) {
            var bd = buildingdefs[i];
            var bldg = makebox(bd.w, bd.h, bd.d, 0xE8E8E8, bd.x, bd.h / 2, bz);
            add(bldg);

            // Roof detail
            var roofdetail = makebox(bd.w - 2, 1.5, bd.d - 2, 0xD0D0D0, bd.x, bd.h + 0.75, bz);
            add(roofdetail);

            // Ground floor darker retail strip
            var retail = makebox(bd.w, 3, bd.d + 0.2, 0xCCCCCC, bd.x, 1.5, bz);
            add(retail);
        }

        // Waterfront promenade
        var promenade = makebox(160, 0.5, 8, 0xBBBBBB, -10, 0.25, bz + 10);
        add(promenade);

        // Lamp posts along promenade
        for (i = 0; i < 8; i++) {
            var post = makecylinder(0.15, 0.15, 5, 6, 0x555555, -70 + i * 20, 2.5, bz + 13);
            add(post);
            var lamp = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 6, 6),
                new THREE.MeshLambertMaterial({ color: 0xFFFF99 })
            );
            lamp.position.set(OX + (-70 + i * 20), 5.4, OZ + bz + 13);
            add(lamp);
        }

        // The tower (Spinnaker) is already close — add a plaza
        var plaza = makebox(20, 0.3, 20, 0xAAAAAA, 0, 0.15, -40);
        add(plaza);
    }

    function builddaymuseum() {
        var bx = 130;
        var bz = 20;

        // Main D-Day museum building
        var mainbldg = makebox(28, 10, 20, 0x5A6A5A, bx, 5, bz);
        add(mainbldg);

        // Front entrance wing
        var entrance = makebox(10, 8, 8, 0x4A5A4A, bx - 19, 4, bz);
        add(entrance);

        // Overlord embroidery gallery wing (longer flat wing)
        var gallery = makebox(35, 7, 10, 0x607060, bx + 20, 3.5, bz + 5);
        add(gallery);

        // Flat roof over main building
        var roof = makebox(30, 1, 22, 0x4A5A4A, bx, 10.5, bz);
        add(roof);

        // Roof over entrance
        var entranceroof = makebox(12, 1, 10, 0x3A4A3A, bx - 19, 8.5, bz);
        add(entranceroof);

        // Memorial sculpture plinth
        var plinth = makebox(4, 2, 4, 0x888888, bx - 30, 1, bz);
        add(plinth);
        var sculpture = makebox(2, 4, 2, 0x777777, bx - 30, 4, bz);
        add(sculpture);

        // Flagpoles
        var flag1 = makecylinder(0.15, 0.15, 8, 6, 0x888888, bx - 10, 4, bz + 10.3);
        add(flag1);
        var flag2 = makecylinder(0.15, 0.15, 8, 6, 0x888888, bx - 5, 4, bz + 10.3);
        add(flag2);
        var flag3 = makecylinder(0.15, 0.15, 8, 6, 0x888888, bx, 4, bz + 10.3);
        add(flag3);

        // Flag blocks at top of poles
        var fb1 = makebox(2.5, 1.2, 0.2, 0x0000CC, bx - 10 + 1.25, 8.4, bz + 10.3);
        add(fb1);
        var fb2 = makebox(2.5, 1.2, 0.2, 0xCC0000, bx - 5 + 1.25, 8.4, bz + 10.3);
        add(fb2);
        var fb3 = makebox(2.5, 1.2, 0.2, 0xFFFFFF, bx + 1.25, 8.4, bz + 10.3);
        add(fb3);

        // Entrance steps
        var step1 = makebox(8, 0.5, 2, 0x999999, bx - 19, 0.25, bz - 5);
        add(step1);
        var step2 = makebox(8, 0.5, 2, 0x999999, bx - 19, 0.75, bz - 3);
        add(step2);
        var step3 = makebox(8, 0.5, 2, 0x999999, bx - 19, 1.25, bz - 1);
        add(step3);

        // Information signboard
        var signboard = makebox(6, 3, 0.4, 0x2A4A2A, bx - 34, 2.5, bz - 3);
        add(signboard);
    }

    function buildgroundplane() {
        // Ground area using boxes (PlaneGeometry forbidden)
        var ground = makebox(400, 0.5, 300, 0x556B44, 30, -0.25, 20);
        add(ground);

        // Cobblestone historic dockyard areas
        var cobble1 = makebox(80, 0.3, 60, 0x8A7A6A, 30, 0.15, 40);
        add(cobble1);

        // Road/path surface
        var road1 = makebox(120, 0.3, 6, 0x555555, 0, 0.15, -5);
        add(road1);
        var road2 = makebox(6, 0.3, 100, 0x555555, 30, 0.15, 20);
        add(road2);
    }

    function buildextras() {
        // Crane structures in dockyard — box frames
        var craneboom = makebox(2, 20, 2, 0xCC6600, -30, 10, 80);
        add(craneboom);
        var cranearm = makebox(15, 1.5, 1.5, 0xCC6600, -22.5, 20, 80);
        add(cranearm);
        var cranecable = makecylinder(0.2, 0.2, 12, 4, 0x888888, -22, 14, 80);
        add(cranecable);

        // Warehouse buildings along dockyard
        var i;
        for (i = 0; i < 3; i++) {
            var warehouse = makebox(20, 10, 15, 0x8A7A6A, 70 + i * 26, 5, 80);
            add(warehouse);
            // Roof ridge
            var ridge = makebox(20, 2, 1, 0x7A6A5A, 70 + i * 26, 11, 80);
            add(ridge);
        }

        // Anchor monument
        var anchor = makebox(1, 8, 1, 0x333333, 20, 4, -30);
        add(anchor);
        var anchorcross = makebox(5, 1, 1, 0x333333, 20, 6, -30);
        add(anchorcross);
        var anchorrings = makecylinder(1.5, 1.5, 0.5, 8, 0x333333, 20, 8.5, -30);
        add(anchorrings);

        // Submarine exhibit (simplified)
        var subhull = makebox(25, 4, 4, 0x2A3A2A, -100, 2, 60);
        add(subhull);
        var conning = makebox(4, 4, 3, 0x2A3A2A, -105, 6, 60);
        add(conning);
    }

    function init(sceneref) {
        scene = sceneref;
        objects = [];

        buildgroundplane();
        buildspinnakertower();
        buildhmsVictory();
        buildhmsWarrior();
        buildmaryRoseMuseum();
        buildportsmouthharbour();
        buildhistoricdockyardgates();
        buildroundtower();
        buildsquaretower();
        buildgunwharfquays();
        builddaymuseum();
        buildextras();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) { objects[i].geometry.dispose(); }
            if (objects[i].material) { objects[i].material.dispose(); }
        }
        objects = [];
    }

    return { init: init, update: update, reset: reset };
}());
