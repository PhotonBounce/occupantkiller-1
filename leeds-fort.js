window.LeedsFort = (function() {
    'use strict';

    var WX = 2830;
    var WZ = 2200;

    function makebox(scene, w, h, d, x, y, z, color) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, x, y, z, color) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makesphere(scene, r, ws, hs, x, y, z, color) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makecone(scene, r, h, segs, x, y, z, color) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makelines(scene, points, x, y, z, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var ls = new THREE.LineSegments(geo, mat);
        ls.position.set(WX + x, y, WZ + z);
        scene.add(ls);
        return ls;
    }

    // -------------------------------------------------------
    // Kirkstall Abbey — Cistercian ruins, sandstone 0x9A8A78
    // -------------------------------------------------------
    function buildabbey(scene) {
        var stone = 0x9A8A78;
        var darkstone = 0x7A6A58;
        var ivygreen = 0x4A6A3A;

        // Main nave — long ruined body of the church
        makebox(scene, 35, 14, 12, -180, 7, -60, stone);
        // Nave north wall — partial ruin
        makebox(scene, 35, 10, 1.5, -180, 5, -54, stone);
        // Nave south wall
        makebox(scene, 35, 8, 1.5, -180, 4, -66, stone);

        // Intact tower — central crossing tower
        makebox(scene, 8, 22, 8, -168, 11, -60, stone);
        makebox(scene, 6, 4, 6, -168, 24, -60, darkstone);
        // Tower battlements
        makebox(scene, 2, 2, 2, -171, 24, -62, stone);
        makebox(scene, 2, 2, 2, -165, 24, -62, stone);
        makebox(scene, 2, 2, 2, -171, 24, -58, stone);
        makebox(scene, 2, 2, 2, -165, 24, -58, stone);

        // Transepts — crossing arms
        makebox(scene, 8, 12, 18, -168, 6, -60, stone);
        // North transept wall
        makebox(scene, 1.5, 10, 18, -173, 5, -60, stone);

        // Chapter house — east end, square chamber
        makebox(scene, 14, 8, 14, -155, 4, -55, stone);
        makebox(scene, 14, 1, 14, -155, 8.5, -55, darkstone);
        // Chapter house walls (partial ruins — north and east)
        makebox(scene, 1.5, 8, 14, -148, 4, -55, stone);
        makebox(scene, 14, 8, 1.5, -155, 4, -48, stone);

        // Refectory — long south range
        makebox(scene, 28, 7, 10, -175, 3.5, -80, stone);
        makebox(scene, 28, 7, 1.5, -175, 3.5, -74, stone);
        makebox(scene, 28, 7, 1.5, -175, 3.5, -85, stone);
        // Refectory end wall
        makebox(scene, 1.5, 7, 10, -189, 3.5, -80, stone);

        // West range — guest range
        makebox(scene, 1.5, 9, 30, -195, 4.5, -68, stone);
        makebox(scene, 10, 9, 1.5, -191, 4.5, -53, stone);

        // Abbey gateway arch — entrance
        makebox(scene, 6, 10, 2, -200, 5, -60, stone);
        makebox(scene, 2, 4, 2, -200, 12, -60, darkstone);

        // Scattered ruin rubble mounds
        makebox(scene, 4, 2, 3, -185, 1, -70, darkstone);
        makebox(scene, 3, 1.5, 2, -178, 0.75, -73, darkstone);
        makebox(scene, 5, 2.5, 4, -160, 1.25, -68, darkstone);
        makebox(scene, 2, 1, 3, -170, 0.5, -76, darkstone);

        // Cloister garth outline — low walls
        makebox(scene, 16, 2, 1, -172, 1, -72, stone);
        makebox(scene, 16, 2, 1, -172, 1, -62, stone);
        makebox(scene, 1, 2, 10, -164, 1, -67, stone);
        makebox(scene, 1, 2, 10, -180, 1, -67, stone);

        // Abbey grounds — low perimeter wall
        makebox(scene, 80, 3, 1.5, -180, 1.5, -40, stone);
        makebox(scene, 80, 3, 1.5, -180, 1.5, -100, stone);
        makebox(scene, 1.5, 3, 60, -220, 1.5, -70, stone);
        makebox(scene, 1.5, 3, 60, -140, 1.5, -70, stone);

        // Ivy-covered section on north wall
        makebox(scene, 12, 6, 0.5, -174, 3, -54.5, ivygreen);
    }

    // -------------------------------------------------------
    // Leeds Town Hall — Victorian civic, 0xD4A97A
    // -------------------------------------------------------
    function buildtownhall(scene) {
        var civic = 0xD4A97A;
        var dome = 0x888888;
        var dark = 0xB07A50;
        var white = 0xF0EAD6;

        // Main body of town hall
        makebox(scene, 24, 16, 14, 0, 8, 0, civic);

        // Portico steps/plinth
        makebox(scene, 28, 3, 16, 0, 1.5, 0, dark);

        // Corinthian columns across facade — front (south face)
        var ci;
        for (ci = 0; ci < 6; ci = ci + 1) {
            makecylinder(scene, 0.7, 0.7, 14, 8, -10 + ci * 4, 7, 8, white);
        }
        // Column capitals (box tops)
        for (ci = 0; ci < 6; ci = ci + 1) {
            makebox(scene, 1.8, 1, 1.8, -10 + ci * 4, 14.5, 8, white);
        }
        // Back columns
        for (ci = 0; ci < 6; ci = ci + 1) {
            makecylinder(scene, 0.7, 0.7, 14, 8, -10 + ci * 4, 7, -8, white);
        }
        // Side columns east
        for (ci = 0; ci < 4; ci = ci + 1) {
            makecylinder(scene, 0.7, 0.7, 14, 8, 12, 7, -6 + ci * 3.5, white);
        }
        // Side columns west
        for (ci = 0; ci < 4; ci = ci + 1) {
            makecylinder(scene, 0.7, 0.7, 14, 8, -12, 7, -6 + ci * 3.5, white);
        }

        // Pediment triangular frieze
        makebox(scene, 24, 3, 1.5, 0, 18, 8, civic);
        makebox(scene, 24, 3, 1.5, 0, 18, -8, civic);

        // Dome drum base
        makecylinder(scene, 5, 5.5, 6, 12, 0, 22, 0, dome);
        // Great dome
        makesphere(scene, 5.5, 16, 12, 0, 27, 0, dome);
        // Dome lantern
        makecylinder(scene, 1.2, 1.5, 3, 8, 0, 30.5, 0, dark);
        makecone(scene, 1.2, 2, 8, 0, 33, 0, dome);

        // Clock tower — north side
        makebox(scene, 5, 24, 5, 0, 12, -10, civic);
        // Clock faces (box placeholders)
        makebox(scene, 5, 4, 0.3, 0, 20, -7.5, white);
        makebox(scene, 5, 4, 0.3, 0, 20, -12.5, white);
        makebox(scene, 0.3, 4, 5, -2.5, 20, -10, white);
        makebox(scene, 0.3, 4, 5, 2.5, 20, -10, white);
        // Clock tower top
        makebox(scene, 5.5, 3, 5.5, 0, 25.5, -10, dark);
        makecone(scene, 2.5, 6, 4, 0, 30, -10, dome);

        // Entrance steps
        makebox(scene, 20, 0.8, 3, 0, 0.4, 11, dark);
        makebox(scene, 18, 0.8, 2.5, 0, 1.2, 10, dark);

        // Wing extensions
        makebox(scene, 8, 12, 10, 16, 6, 0, civic);
        makebox(scene, 8, 12, 10, -16, 6, 0, civic);
    }

    // -------------------------------------------------------
    // Tetley's Brewery — dark red brick Victorian, 0x8A3A2A
    // -------------------------------------------------------
    function buildbrewery(scene) {
        var brick = 0x8A3A2A;
        var darkbrick = 0x6A2A1A;
        var metal = 0x5A5A5A;
        var copper = 0xA06A20;

        // Main brewery block
        makebox(scene, 30, 18, 20, 80, 9, 40, brick);
        // Secondary production block
        makebox(scene, 20, 14, 16, 110, 7, 35, brick);
        // Malt house — long low block
        makebox(scene, 40, 10, 12, 70, 5, 60, darkbrick);
        // Cooperage
        makebox(scene, 16, 8, 12, 105, 4, 55, darkbrick);
        // Warehouse
        makebox(scene, 22, 16, 18, 90, 8, 20, brick);

        // Main chimney — tall cylinder
        makecylinder(scene, 2.2, 3, 38, 12, 80, 19, 45, darkbrick);
        // Chimney top cap
        makecylinder(scene, 2.4, 2.2, 2, 8, 80, 39, 45, metal);

        // Secondary chimney
        makecylinder(scene, 1.5, 2, 28, 10, 108, 14, 38, darkbrick);
        makecylinder(scene, 1.6, 1.5, 1.5, 8, 108, 29, 38, metal);

        // Fermenting vessels — large copper cylinders (outdoor)
        makecylinder(scene, 3.5, 3.5, 6, 12, 95, 3, 48, copper);
        makecylinder(scene, 3.5, 3.5, 6, 12, 103, 3, 48, copper);
        makecylinder(scene, 3.5, 3.5, 6, 12, 95, 3, 56, copper);
        makecylinder(scene, 3.5, 3.5, 6, 12, 103, 3, 56, copper);
        // Vessel domed tops
        makesphere(scene, 3.6, 8, 6, 95, 6.5, 48, copper);
        makesphere(scene, 3.6, 8, 6, 103, 6.5, 48, copper);
        makesphere(scene, 3.6, 8, 6, 95, 6.5, 56, copper);
        makesphere(scene, 3.6, 8, 6, 103, 6.5, 56, copper);

        // Brewery gate / entrance arch
        makebox(scene, 8, 10, 2, 80, 5, 28, darkbrick);
        makebox(scene, 4, 3, 2, 80, 11.5, 28, darkbrick);

        // Loading dock platform
        makebox(scene, 30, 1.5, 5, 80, 0.75, 10, darkbrick);

        // Boundary wall
        makebox(scene, 70, 4, 1.5, 85, 2, 5, darkbrick);
        makebox(scene, 70, 4, 1.5, 85, 2, 72, darkbrick);
        makebox(scene, 1.5, 4, 70, 52, 2, 38, darkbrick);
        makebox(scene, 1.5, 4, 70, 120, 2, 38, darkbrick);
    }

    // -------------------------------------------------------
    // Headingley Cricket & Rugby Ground
    // -------------------------------------------------------
    function buildheadingley(scene) {
        var stand = 0x888888;
        var seat = 0x2244AA;
        var turf = 0x2D6A2D;
        var light = 0xCCCCCC;
        var board = 0x111111;

        // Pitch / outfield (low flat box)
        makebox(scene, 80, 0.3, 60, -80, 0.15, 120, turf);

        // Main stand — south (long)
        makebox(scene, 80, 12, 8, -80, 6, 153, stand);
        makebox(scene, 78, 6, 4, -80, 3, 149, seat);
        // Roof over main stand
        makebox(scene, 82, 1.5, 12, -80, 12.5, 151, stand);

        // North stand
        makebox(scene, 80, 8, 6, -80, 4, 90, stand);
        makebox(scene, 78, 4, 3, -80, 2, 93, seat);

        // East terrace
        makebox(scene, 6, 8, 55, -37, 4, 121, stand);
        makebox(scene, 3, 4, 52, -40, 2, 121, seat);

        // West terrace
        makebox(scene, 6, 8, 55, -123, 4, 121, stand);
        makebox(scene, 3, 4, 52, -120, 2, 121, seat);

        // Corner sections
        makebox(scene, 12, 6, 12, -45, 3, 148, stand);
        makebox(scene, 12, 6, 12, -115, 3, 148, stand);
        makebox(scene, 12, 6, 12, -45, 3, 94, stand);
        makebox(scene, 12, 6, 12, -115, 3, 94, stand);

        // Scoreboard — south-east corner
        makebox(scene, 10, 14, 2, -40, 7, 158, board);
        makebox(scene, 8, 10, 0.5, -40, 7, 157, 0x222222);
        // Scoreboard frame
        makebox(scene, 10, 1, 2, -40, 14.5, 158, stand);

        // Second scoreboard — north end
        makebox(scene, 8, 10, 2, -80, 5, 85, board);

        // Floodlight towers — 4 corners
        // SW tower
        makecylinder(scene, 0.4, 0.5, 30, 6, -120, 15, 148, light);
        makebox(scene, 4, 1, 4, -120, 30.5, 148, light);
        // SE tower
        makecylinder(scene, 0.4, 0.5, 30, 6, -42, 15, 148, light);
        makebox(scene, 4, 1, 4, -42, 30.5, 148, light);
        // NW tower
        makecylinder(scene, 0.4, 0.5, 30, 6, -120, 15, 94, light);
        makebox(scene, 4, 1, 4, -120, 30.5, 94, light);
        // NE tower
        makecylinder(scene, 0.4, 0.5, 30, 6, -42, 15, 94, light);
        makebox(scene, 4, 1, 4, -42, 30.5, 94, light);

        // Floodlight arms on each tower
        makebox(scene, 6, 0.5, 0.5, -120, 31, 148, light);
        makebox(scene, 6, 0.5, 0.5, -42, 31, 148, light);
        makebox(scene, 6, 0.5, 0.5, -120, 31, 94, light);
        makebox(scene, 6, 0.5, 0.5, -42, 31, 94, light);

        // Pavilion / players area
        makebox(scene, 16, 10, 8, -80, 5, 145, 0xD4C0A0);
        makebox(scene, 16, 1, 10, -80, 10.5, 143, 0xD4C0A0);
    }

    // -------------------------------------------------------
    // M1 Motorway Viaduct bridge
    // -------------------------------------------------------
    function buildmotorway(scene) {
        var concrete = 0x9E9E9E;
        var dark = 0x787878;
        var barrier = 0xBBBBBB;

        // Main elevated deck — long viaduct crossing city
        makebox(scene, 120, 3, 14, 20, 12, -20, concrete);

        // Support piers — regularly spaced
        var pi;
        for (pi = 0; pi < 10; pi = pi + 1) {
            makebox(scene, 3, 12, 6, -34 + pi * 12, 6, -20, dark);
        }
        // Pier caps
        for (pi = 0; pi < 10; pi = pi + 1) {
            makebox(scene, 5, 1.5, 8, -34 + pi * 12, 12.5, -20, concrete);
        }

        // Road surface top layer
        makebox(scene, 120, 0.5, 12, 20, 13.75, -20, dark);

        // Crash barriers — both sides
        makebox(scene, 120, 1, 0.5, 20, 14.5, -14, barrier);
        makebox(scene, 120, 1, 0.5, 20, 14.5, -26, barrier);

        // Central reservation
        makebox(scene, 120, 0.8, 0.8, 20, 14.4, -20, 0xFF6600);

        // Approach ramp — east
        makebox(scene, 20, 3, 14, 82, 6, -20, concrete);
        makebox(scene, 3, 6, 6, 78, 3, -20, dark);

        // Approach ramp — west
        makebox(scene, 20, 3, 14, -42, 6, -20, concrete);
        makebox(scene, 3, 6, 6, -38, 3, -20, dark);

        // Motorway sign gantry
        makecylinder(scene, 0.4, 0.4, 16, 6, 10, 8, -30, dark);
        makecylinder(scene, 0.4, 0.4, 16, 6, 30, 8, -30, dark);
        makebox(scene, 24, 2, 1.5, 20, 17, -30, dark);
        makebox(scene, 20, 3, 1, 20, 17, -30, 0x006633);
    }

    // -------------------------------------------------------
    // River Aire and Leeds-Liverpool Canal
    // -------------------------------------------------------
    function buildriver(scene) {
        var water = 0x1A6B8A;
        var deepwater = 0x124A66;
        var bank = 0x6B5A3A;
        var lockstone = 0x888878;
        var towpath = 0xAA9977;

        // River Aire — main channel flowing east-west through city
        makebox(scene, 200, 0.5, 16, -10, 0.25, -130, water);
        makebox(scene, 200, 0.5, 12, -10, 0.25, -110, deepwater);

        // River banks / embankment walls
        makebox(scene, 200, 3, 2, -10, 1.5, -120, bank);
        makebox(scene, 200, 3, 2, -10, 1.5, -140, bank);

        // River bend section — curving south
        makebox(scene, 50, 0.5, 16, 110, 0.25, -105, water);
        makebox(scene, 50, 0.5, 10, 110, 0.25, -88, water);

        // Leeds-Liverpool Canal — parallel channel
        makebox(scene, 180, 0.5, 10, -20, 0.25, -155, water);
        makebox(scene, 180, 0.5, 8, -20, 0.25, -145, 0x1E7A9A);

        // Canal towpath
        makebox(scene, 180, 0.3, 5, -20, 0.15, -162, towpath);

        // Canal lock — north side
        makebox(scene, 14, 4, 1.5, 30, 2, -152, lockstone);
        makebox(scene, 14, 4, 1.5, 30, 2, -160, lockstone);
        makebox(scene, 1.5, 4, 10, 23, 2, -156, lockstone);
        makebox(scene, 1.5, 4, 10, 37, 2, -156, lockstone);
        // Lock gates (dark wooden boxes)
        makebox(scene, 0.8, 4, 4, 26, 2, -154, 0x3A2A1A);
        makebox(scene, 0.8, 4, 4, 34, 2, -154, 0x3A2A1A);
        // Lock water level inside
        makebox(scene, 12, 0.5, 8, 30, 0.5, -156, deepwater);

        // Second canal lock
        makebox(scene, 14, 4, 1.5, -30, 2, -152, lockstone);
        makebox(scene, 14, 4, 1.5, -30, 2, -160, lockstone);
        makebox(scene, 1.5, 4, 10, -37, 2, -156, lockstone);
        makebox(scene, 1.5, 4, 10, -23, 2, -156, lockstone);
        makebox(scene, 0.8, 4, 4, -34, 2, -154, 0x3A2A1A);
        makebox(scene, 0.8, 4, 4, -26, 2, -154, 0x3A2A1A);
        makebox(scene, 12, 0.5, 8, -30, 0.5, -156, deepwater);

        // Footbridge over river
        makebox(scene, 1, 4, 20, 60, 5, -130, 0x666666);
        makebox(scene, 8, 0.5, 20, 60, 7, -130, 0x888888);
        makebox(scene, 1, 4, 20, 68, 5, -130, 0x666666);

        // Road bridge over river — Briggate bridge
        makebox(scene, 3, 10, 20, -60, 5, -130, lockstone);
        makebox(scene, 3, 10, 20, -68, 5, -130, lockstone);
        makebox(scene, 18, 2, 22, -64, 10, -130, lockstone);

        // Riverside warehouse buildings
        makebox(scene, 20, 12, 10, 40, 6, -118, 0x6A4A3A);
        makebox(scene, 16, 10, 8, 65, 5, -118, 0x7A5A4A);
        makebox(scene, 18, 14, 10, -50, 7, -118, 0x6A4A3A);
    }

    // -------------------------------------------------------
    // City centre streets and urban fill
    // -------------------------------------------------------
    function buildcitycentre(scene) {
        var tarmac = 0x333333;
        var pavement = 0x999988;
        var shopfront = 0xC8B89A;
        var glass = 0x4488AA;
        var modern = 0x9AB0B0;

        // Main roads — Briggate (north-south)
        makebox(scene, 8, 0.2, 160, -64, 0.1, 20, tarmac);
        makebox(scene, 4, 0.2, 160, -68, 0.1, 20, pavement);
        makebox(scene, 4, 0.2, 160, -60, 0.1, 20, pavement);

        // The Headrow — east-west
        makebox(scene, 140, 0.2, 10, -10, 0.1, -30, tarmac);
        makebox(scene, 140, 0.2, 4, -10, 0.1, -26, pavement);
        makebox(scene, 140, 0.2, 4, -10, 0.1, -34, pavement);

        // Victorian shopping arcade
        makebox(scene, 6, 12, 30, -55, 6, -15, shopfront);
        makebox(scene, 6, 12, 0.5, -55, 6, 0, glass);
        makebox(scene, 6, 12, 0.5, -55, 6, -30, glass);
        // Arcade roof glazing
        makebox(scene, 6, 0.5, 30, -55, 12.5, -15, glass);

        // Office blocks — city centre
        makebox(scene, 14, 20, 12, -42, 10, -45, modern);
        makebox(scene, 12, 28, 10, -28, 14, -42, glass);
        makebox(scene, 10, 24, 10, -20, 12, -55, modern);
        makebox(scene, 16, 18, 14, 10, 9, -50, shopfront);

        // Leeds market — Kirkgate Market
        makebox(scene, 28, 10, 20, -35, 5, 15, shopfront);
        makebox(scene, 28, 0.5, 20, -35, 10.5, 15, 0x887766);
        // Market towers / pinnacles
        makecone(scene, 2, 5, 4, -48, 15, 5, 0xAA9977);
        makecone(scene, 2, 5, 4, -22, 15, 5, 0xAA9977);
        makecone(scene, 2, 5, 4, -48, 15, 25, 0xAA9977);
        makecone(scene, 2, 5, 4, -22, 15, 25, 0xAA9977);

        // Leeds station — large train shed
        makebox(scene, 50, 14, 30, 50, 7, -50, 0x888880);
        makebox(scene, 52, 1, 28, 50, 14.5, -50, glass);
        // Station platform boxes
        makebox(scene, 45, 1, 5, 50, 1, -42, pavement);
        makebox(scene, 45, 1, 5, 50, 1, -55, pavement);
        makebox(scene, 45, 1, 5, 50, 1, -62, pavement);

        // Leeds Parish Church — medieval tower
        makebox(scene, 12, 8, 16, -100, 4, -10, 0xC8B090);
        makebox(scene, 6, 20, 6, -100, 10, -16, 0xB89878);
        makebox(scene, 7, 2, 7, -100, 21, -16, 0xB89878);
        makecone(scene, 3, 6, 4, -100, 25, -16, 0x888878);

        // Merrion Centre — brutalist concrete
        makebox(scene, 30, 16, 20, 20, 8, -10, 0xA0A090);
        makebox(scene, 30, 2, 20, 20, 16.5, -10, 0x888880);

        // Assorted street buildings north
        makebox(scene, 12, 10, 10, -90, 5, 35, shopfront);
        makebox(scene, 10, 8, 12, -75, 4, 30, 0xC0A888);
        makebox(scene, 14, 14, 10, -85, 7, 55, modern);
        makebox(scene, 10, 12, 14, -95, 6, 70, shopfront);
    }

    // -------------------------------------------------------
    // Public entry point
    // -------------------------------------------------------
    function build(scene) {
        buildabbey(scene);
        buildtownhall(scene);
        buildbrewery(scene);
        buildheadingley(scene);
        buildmotorway(scene);
        buildriver(scene);
        buildcitycentre(scene);
    }

    return {
        build: build,
        worldX: WX,
        worldZ: WZ
    };

}());
