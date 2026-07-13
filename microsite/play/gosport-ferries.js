window.GosportFerries = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makelines(points, color, x, y, z) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var mesh = new THREE.LineSegments(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function buildFerryTerminal() {
        var bx = 13400;
        var bz = -200;

        // Pontoon jetty - long floating platform
        makebox(80, 2, 12, 0x888888, bx, 1, bz);
        makebox(60, 2, 10, 0x777777, bx - 30, 1, bz - 18);

        // Jetty support piles
        makecylinder(0.5, 0.5, 6, 6, 0x555555, bx - 35, -2, bz);
        makecylinder(0.5, 0.5, 6, 6, 0x555555, bx - 15, -2, bz);
        makecylinder(0.5, 0.5, 6, 6, 0x555555, bx + 5, -2, bz);
        makecylinder(0.5, 0.5, 6, 6, 0x555555, bx + 25, -2, bz);
        makecylinder(0.5, 0.5, 6, 6, 0x555555, bx + 35, -2, bz);

        // Ferry waiting room / terminal building
        makebox(40, 10, 20, 0xddccaa, bx, 5, bz + 25);
        // Roof
        makebox(42, 2, 22, 0x884422, bx, 11, bz + 25);
        // Terminal windows
        makebox(6, 4, 1, 0x88bbff, bx - 14, 6, bz + 15);
        makebox(6, 4, 1, 0x88bbff, bx - 6, 6, bz + 15);
        makebox(6, 4, 1, 0x88bbff, bx + 2, 6, bz + 15);
        makebox(6, 4, 1, 0x88bbff, bx + 10, 6, bz + 15);
        // Terminal entrance canopy
        makebox(20, 2, 8, 0x999999, bx, 8, bz + 14);

        // Catamaran Ferry 1 - at terminal
        buildCatamaran(bx - 10, 2, bz - 6, 0);

        // Catamaran Ferry 2 - crossing harbour (mid crossing)
        buildCatamaran(bx + 120, 2, bz - 80, 0.3);

        // Navigation marker buoys
        makesphere(1.5, 6, 6, 0xff4400, bx + 60, 3, bz - 40);
        makesphere(1.5, 6, 6, 0x00aa00, bx + 60, 3, bz - 20);
    }

    function buildCatamaran(x, y, z, rotY) {
        // Port hull
        var hullPort = makebox(28, 3, 5, 0xffffff, x - 5, y + 1.5, z);
        hullPort.rotation.y = rotY;

        // Starboard hull
        var hullStbd = makebox(28, 3, 5, 0xffffff, x + 5, y + 1.5, z);
        hullStbd.rotation.y = rotY;

        // Cross beams connecting hulls
        var beam1 = makebox(12, 1.5, 3, 0xdddddd, x, y + 3, z - 8);
        beam1.rotation.y = rotY;
        var beam2 = makebox(12, 1.5, 3, 0xdddddd, x, y + 3, z + 6);
        beam2.rotation.y = rotY;

        // Superstructure / passenger cabin
        var cabin = makebox(22, 5, 8, 0xeeeeff, x, y + 6.5, z);
        cabin.rotation.y = rotY;

        // Bridge / wheelhouse
        var bridge = makebox(10, 3, 6, 0xccddee, x, y + 10, z - 2);
        bridge.rotation.y = rotY;

        // Funnel / exhaust
        var funnel = makecylinder(0.8, 1.0, 3, 8, 0x222222, x, y + 13, z - 4);
        funnel.rotation.y = rotY;

        // Navigation mast
        var mast = makecylinder(0.2, 0.2, 6, 4, 0xaaaaaa, x, y + 14, z - 2);
        mast.rotation.y = rotY;

        // Ferry blue livery stripe
        var stripe = makebox(28, 1, 5.2, 0x0044cc, x - 5, y + 3.5, z);
        stripe.rotation.y = rotY;
        var stripe2 = makebox(28, 1, 5.2, 0x0044cc, x + 5, y + 3.5, z);
        stripe2.rotation.y = rotY;
    }

    function buildHaslarHospital() {
        var bx = 13400;
        var bz = 200;

        // Main hospital facade - the famously long brick building
        makebox(200, 18, 20, 0xaa6633, bx, 9, bz);

        // Central tower / main entrance block - taller
        makebox(30, 30, 25, 0xbb7744, bx, 15, bz);
        // Tower top
        makebox(28, 4, 23, 0x995522, bx, 32, bz);
        makecone(10, 12, 4, 0x884411, bx, 42, bz);

        // East wing extension
        makebox(80, 16, 18, 0xaa6633, bx + 140, 8, bz);
        makebox(20, 22, 20, 0xbb7744, bx + 180, 11, bz);

        // West wing extension
        makebox(80, 16, 18, 0xaa6633, bx - 140, 8, bz);
        makebox(20, 22, 20, 0xbb7744, bx - 180, 11, bz);

        // Hospital chapel - smaller building with pointed roof
        makebox(20, 14, 15, 0xcc8855, bx + 60, 7, bz + 50);
        makecone(8, 12, 4, 0x993311, bx + 60, 20, bz + 50);
        // Chapel windows (tall lancet)
        makebox(3, 8, 1, 0x88aacc, bx + 60, 10, bz + 43);
        makebox(3, 8, 1, 0x88aacc, bx + 54, 10, bz + 43);
        makebox(3, 8, 1, 0x88aacc, bx + 66, 10, bz + 43);

        // Hospital garden paths
        makebox(4, 0.5, 80, 0xccbbaa, bx - 20, 0.3, bz + 80);
        makebox(4, 0.5, 80, 0xccbbaa, bx + 20, 0.3, bz + 80);
        makebox(80, 0.5, 4, 0xccbbaa, bx, 0.3, bz + 120);

        // Garden trees
        makecylinder(0.6, 0.6, 6, 6, 0x442200, bx - 40, 3, bz + 80);
        makesphere(4, 6, 6, 0x226611, bx - 40, 9, bz + 80);
        makecylinder(0.6, 0.6, 6, 6, 0x442200, bx + 40, 3, bz + 80);
        makesphere(4, 6, 6, 0x226611, bx + 40, 9, bz + 80);
        makecylinder(0.6, 0.6, 6, 6, 0x442200, bx, 3, bz + 100);
        makesphere(4, 6, 6, 0x226611, bx, 9, bz + 100);

        // Walled grounds - perimeter wall
        makebox(260, 5, 3, 0xaa7744, bx, 2.5, bz + 160);
        makebox(260, 5, 3, 0xaa7744, bx, 2.5, bz - 25);
        makebox(3, 5, 190, 0xaa7744, bx - 130, 2.5, bz + 68);
        makebox(3, 5, 190, 0xaa7744, bx + 130, 2.5, bz + 68);

        // Gate posts
        makebox(4, 8, 4, 0xbb8855, bx - 12, 4, bz - 25);
        makebox(4, 8, 4, 0xbb8855, bx + 12, 4, bz - 25);
        makebox(4, 8, 4, 0xbb8855, bx - 12, 4, bz + 160);
        makebox(4, 8, 4, 0xbb8855, bx + 12, 4, bz + 160);

        // Victorian chimneys along roofline
        makecylinder(0.8, 1, 5, 6, 0x993322, bx - 80, 23, bz);
        makecylinder(0.8, 1, 5, 6, 0x993322, bx - 60, 23, bz);
        makecylinder(0.8, 1, 5, 6, 0x993322, bx + 60, 23, bz);
        makecylinder(0.8, 1, 5, 6, 0x993322, bx + 80, 23, bz);

        // Windows along main facade
        makebox(5, 7, 1, 0x88aacc, bx - 80, 10, bz - 11);
        makebox(5, 7, 1, 0x88aacc, bx - 60, 10, bz - 11);
        makebox(5, 7, 1, 0x88aacc, bx - 40, 10, bz - 11);
        makebox(5, 7, 1, 0x88aacc, bx - 20, 10, bz - 11);
        makebox(5, 7, 1, 0x88aacc, bx + 20, 10, bz - 11);
        makebox(5, 7, 1, 0x88aacc, bx + 40, 10, bz - 11);
        makebox(5, 7, 1, 0x88aacc, bx + 60, 10, bz - 11);
        makebox(5, 7, 1, 0x88aacc, bx + 80, 10, bz - 11);
    }

    function buildFortBrockhurst() {
        var bx = 13400;
        var bz = 500;

        // Earthwork ramparts - polygon approximated with boxes
        // North rampart
        makebox(120, 8, 18, 0x556633, bx, 4, bz - 70);
        // South rampart
        makebox(120, 8, 18, 0x556633, bx, 4, bz + 70);
        // East rampart
        makebox(18, 8, 140, 0x556633, bx + 70, 4, bz);
        // West rampart
        makebox(18, 8, 140, 0x556633, bx - 70, 4, bz);
        // Corner bastions
        makecylinder(18, 20, 8, 8, 0x667744, bx - 60, 4, bz - 60);
        makecylinder(18, 20, 8, 8, 0x667744, bx + 60, 4, bz - 60);
        makecylinder(18, 20, 8, 8, 0x667744, bx - 60, 4, bz + 60);
        makecylinder(18, 20, 8, 8, 0x667744, bx + 60, 4, bz + 60);

        // Caponier - projecting defensive work in moat
        makebox(20, 5, 30, 0x888866, bx - 80, 2.5, bz);
        makebox(20, 5, 30, 0x888866, bx + 80, 2.5, bz);

        // Moat - water level suggestion (dark blue)
        makebox(180, 1, 180, 0x2244aa, bx, -0.5, bz);
        // Inner ground within moat
        makebox(120, 0.5, 120, 0x448833, bx, 0.3, bz);

        // Keep tower - central circular brick tower
        makecylinder(12, 14, 22, 10, 0x886644, bx, 11, bz);
        // Keep battlements
        makecylinder(13, 13, 3, 10, 0x775533, bx, 23, bz);

        // Barracks building within fort
        makebox(50, 10, 15, 0x997755, bx + 25, 5, bz + 20);
        makebox(50, 10, 15, 0x997755, bx - 25, 5, bz - 20);

        // Drawbridge over moat - main entrance
        makebox(8, 1, 28, 0x885533, bx, 0.8, bz - 84);
        // Gatehouse
        makebox(14, 14, 10, 0x886644, bx, 7, bz - 72);
        makebox(16, 2, 12, 0x775533, bx, 15, bz - 72);
        // Gateway arch suggestion
        makebox(6, 8, 1, 0x443311, bx, 4, bz - 67);

        // Flag pole
        makecylinder(0.3, 0.3, 16, 4, 0xaaaaaa, bx, 30, bz);
        makebox(5, 3, 0.5, 0xcc0000, bx + 2.5, 37, bz);
    }

    function buildSubmarineMuseum() {
        var bx = 13400;
        var bz = 700;

        // Museum main building
        makebox(60, 12, 35, 0xbbccdd, bx, 6, bz);
        // Roof
        makebox(62, 3, 37, 0x778899, bx, 13.5, bz);
        // Museum entrance porch
        makebox(18, 10, 8, 0xaabbcc, bx, 5, bz - 22);
        makebox(20, 1.5, 10, 0x667788, bx, 11, bz - 22);

        // Museum sign / board
        makebox(16, 4, 0.5, 0x002244, bx, 14, bz - 26);

        // HMS Alliance submarine hull - outside on display
        // Main pressure hull - elongated cylinder
        makecylinder(4, 4, 70, 10, 0x334455, bx, 4, bz + 80);
        // Alliance - rotate to horizontal
        var sub = objects[objects.length - 1];
        sub.rotation.z = Math.PI / 2;
        sub.position.set(bx + 10, 4, bz + 80);

        // Submarine bow (tapered)
        makecylinder(0.5, 4, 8, 10, 0x334455, bx + 44, 4, bz + 80);
        var subBow = objects[objects.length - 1];
        subBow.rotation.z = Math.PI / 2;

        // Submarine stern (tapered)
        makecylinder(4, 0.5, 8, 10, 0x334455, bx - 26, 4, bz + 80);
        var subStern = objects[objects.length - 1];
        subStern.rotation.z = Math.PI / 2;

        // Conning tower / sail
        makebox(6, 8, 4, 0x334455, bx + 10, 10, bz + 80);
        makebox(5, 2, 3, 0x445566, bx + 10, 15, bz + 80);

        // Periscopes
        makecylinder(0.3, 0.3, 10, 4, 0x556677, bx + 8, 18, bz + 80);
        makecylinder(0.3, 0.3, 8, 4, 0x556677, bx + 12, 16, bz + 80);

        // Torpedo tube openings (front of sub)
        makecylinder(1.2, 1.2, 2, 8, 0x223344, bx + 48, 5.5, bz + 80);
        makecylinder(1.2, 1.2, 2, 8, 0x223344, bx + 48, 2.5, bz + 80);

        // Support cradles for sub
        makebox(8, 4, 6, 0x777777, bx - 15, 1, bz + 80);
        makebox(8, 4, 6, 0x777777, bx + 10, 1, bz + 80);
        makebox(8, 4, 6, 0x777777, bx + 35, 1, bz + 80);

        // Museum car park / forecourt
        makebox(100, 0.3, 40, 0x555555, bx, 0.2, bz - 45);

        // Information boards (vertical panels)
        makebox(0.5, 5, 8, 0xeeddcc, bx - 20, 2.5, bz + 55);
        makebox(0.5, 5, 8, 0xeeddcc, bx - 20, 2.5, bz + 65);

        // Torpedo on static display
        makecylinder(1, 1, 18, 8, 0x888899, bx - 30, 1, bz + 55);
        var torp = objects[objects.length - 1];
        torp.rotation.z = Math.PI / 2;
    }

    function buildGosportTownCentre() {
        var bx = 13400;
        var bz = -500;

        // High Street buildings - varied heights
        makebox(20, 14, 16, 0xcc9966, bx - 80, 7, bz);
        makebox(16, 18, 14, 0xbbaa88, bx - 58, 9, bz);
        makebox(24, 12, 15, 0xddbb99, bx - 34, 6, bz);
        makebox(18, 16, 14, 0xcc9977, bx - 12, 8, bz);
        makebox(20, 10, 15, 0xbbccaa, bx + 10, 5, bz);
        makebox(16, 14, 14, 0xddaa88, bx + 28, 7, bz);
        makebox(22, 18, 16, 0xcc9955, bx + 50, 9, bz);
        makebox(20, 12, 15, 0xbbaa77, bx + 72, 6, bz);

        // High Street road
        makebox(200, 0.3, 12, 0x444444, bx, 0.2, bz);
        // Pavement
        makebox(200, 0.3, 5, 0x888877, bx, 0.2, bz + 10);
        makebox(200, 0.3, 5, 0x888877, bx, 0.2, bz - 10);

        // Bus station - large covered area
        makebox(50, 8, 30, 0xaabbcc, bx + 120, 4, bz);
        // Bus station canopy
        makebox(55, 1.5, 35, 0x889988, bx + 120, 9, bz);
        // Bus station columns
        makecylinder(0.8, 0.8, 8, 6, 0x888888, bx + 95, 4, bz - 15);
        makecylinder(0.8, 0.8, 8, 6, 0x888888, bx + 145, 4, bz - 15);
        makecylinder(0.8, 0.8, 8, 6, 0x888888, bx + 95, 4, bz + 15);
        makecylinder(0.8, 0.8, 8, 6, 0x888888, bx + 145, 4, bz + 15);

        // Gosport Discovery Centre - modern community building
        makebox(40, 10, 25, 0xeeeedd, bx - 120, 5, bz);
        // Modern flat roof with parapet
        makebox(42, 2, 27, 0xddddcc, bx - 120, 11, bz);
        // Large windows
        makebox(1, 7, 18, 0x99ccee, bx - 100, 6, bz - 5);
        makebox(1, 7, 18, 0x99ccee, bx - 140, 6, bz - 5);

        // Falklands Memorial Gardens
        // Garden area - green
        makebox(40, 0.3, 30, 0x55aa44, bx, 0.2, bz - 80);
        // Memorial obelisk/monument
        makebox(3, 3, 3, 0xaaaaaa, bx, 1.5, bz - 80);
        makebox(2, 2, 2, 0xaaaaaa, bx, 4, bz - 80);
        makebox(1.5, 1.5, 1.5, 0xaaaaaa, bx, 5.75, bz - 80);
        makecone(1, 3, 4, 0x888888, bx, 7.5, bz - 80);
        // Garden benches
        makebox(4, 0.8, 1, 0x885522, bx - 10, 0.5, bz - 75);
        makebox(4, 0.8, 1, 0x885522, bx + 10, 0.5, bz - 75);
        // Garden trees
        makecylinder(0.4, 0.4, 5, 6, 0x442200, bx - 15, 2.5, bz - 90);
        makesphere(3, 6, 6, 0x338822, bx - 15, 7, bz - 90);
        makecylinder(0.4, 0.4, 5, 6, 0x442200, bx + 15, 2.5, bz - 90);
        makesphere(3, 6, 6, 0x338822, bx + 15, 7, bz - 90);
        // Flower beds
        makebox(8, 0.4, 4, 0xff6644, bx - 8, 0.3, bz - 68);
        makebox(8, 0.4, 4, 0xffaa22, bx + 8, 0.3, bz - 68);

        // Street furniture
        makecylinder(0.3, 0.3, 7, 6, 0x333333, bx - 60, 3.5, bz - 5);
        makesphere(1, 6, 6, 0xffffaa, bx - 60, 7.5, bz - 5);
        makecylinder(0.3, 0.3, 7, 6, 0x333333, bx + 30, 3.5, bz - 5);
        makesphere(1, 6, 6, 0xffffaa, bx + 30, 7.5, bz - 5);
    }

    function buildPortsmouthHarbourView() {
        var bx = 13400;
        var bz = -350;

        // Portsmouth waterfront visible across harbour
        // Spinnaker Tower - iconic sail-shaped structure
        var spx = bx + 180;
        var spz = bz - 120;

        // Main tower shaft
        makecylinder(3, 4, 80, 8, 0xffffff, spx, 40, spz);
        // Second leg
        makecylinder(2.5, 3, 60, 8, 0xffffff, spx + 8, 30, spz);
        // Viewing pod
        makecylinder(12, 10, 5, 12, 0xeeeeff, spx + 4, 68, spz);
        // Upper viewing deck
        makecylinder(8, 8, 3, 12, 0xffffff, spx + 4, 75, spz);
        // Sail-like arch connecting the two legs at top
        makebox(14, 5, 3, 0xffffff, spx + 4, 65, spz);

        // Portsmouth Naval Base waterfront buildings
        makebox(60, 12, 20, 0xbbaa99, bx + 160, 6, spz + 30);
        makebox(40, 16, 18, 0xccbbaa, bx + 220, 8, spz + 30);

        // Historic warships in dockyard (silhouettes)
        // Ship hull
        makebox(60, 8, 14, 0x444466, bx + 200, 4, spz - 20);
        // Masts
        makecylinder(0.5, 0.5, 30, 4, 0x666655, bx + 185, 20, spz - 20);
        makecylinder(0.5, 0.5, 25, 4, 0x666655, bx + 215, 18, spz - 20);
        // Yards (horizontal spars)
        makebox(20, 0.5, 0.5, 0x666655, bx + 185, 28, spz - 20);
        makebox(16, 0.5, 0.5, 0x666655, bx + 215, 26, spz - 20);

        // Harbour water surface
        makebox(300, 0.5, 200, 0x1155aa, bx + 80, 0.0, bz - 60);

        // Harbour navigation lights on poles
        makecylinder(0.2, 0.2, 6, 4, 0x999999, bx + 50, 3, bz - 60);
        makesphere(0.8, 6, 6, 0xff0000, bx + 50, 6.5, bz - 60);
        makecylinder(0.2, 0.2, 6, 4, 0x999999, bx + 100, 3, bz - 60);
        makesphere(0.8, 6, 6, 0x00ff00, bx + 100, 6.5, bz - 60);
    }

    function buildHarbourWater() {
        var bx = 13400;
        // Main harbour water body
        makebox(600, 1, 300, 0x114488, bx + 50, -0.5, -280);
    }

    function build() {
        buildHarbourWater();
        buildFerryTerminal();
        buildHaslarHospital();
        buildFortBrockhurst();
        buildSubmarineMuseum();
        buildGosportTownCentre();
        buildPortsmouthHarbourView();
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
