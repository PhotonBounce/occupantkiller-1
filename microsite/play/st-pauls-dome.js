window.StPaulsDome = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11760;

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

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function buildGroundPlaza() {
        // Ludgate Hill ground and surrounding area
        makeBox(300, 2, 200, 0x888877, X_OFFSET, -1, 0);
    }

    function buildNavAndTransepts() {
        // Main nave body (long east-west axis)
        makeBox(80, 24, 36, 0xd4c9a8, X_OFFSET, 12, 10);

        // North transept
        makeBox(36, 24, 30, 0xd4c9a8, X_OFFSET - 20, 12, -14);

        // South transept
        makeBox(36, 24, 30, 0xd4c9a8, X_OFFSET + 20, 12, 34);

        // Choir / east end
        makeBox(40, 22, 36, 0xcfc4a3, X_OFFSET + 38, 11, 10);

        // Nave floor/steps base
        makeBox(90, 4, 40, 0xbcb49a, X_OFFSET, 2, 10);
    }

    function buildWestFacade() {
        // Central portico base / steps
        makeBox(36, 6, 12, 0xc8bda0, X_OFFSET - 44, 3, 10);

        // Portico upper level (giant order columns implied by box)
        makeBox(32, 16, 10, 0xd4c9a8, X_OFFSET - 48, 20, 10);

        // 8 Corinthian columns across portico (each column)
        var colSpacing = 4;
        var colStartX = X_OFFSET - 54;
        var i;
        for (i = 0; i < 8; i++) {
            makeCylinder(0.7, 0.7, 20, 8, 0xddd3b4, colStartX + i * colSpacing, 16, 10);
        }

        // Portico pediment (triangular top)
        makeCone(18, 8, 4, 0xc8bda0, X_OFFSET - 48, 34, 10);
    }

    function buildTwinTowers() {
        // North-west bell tower
        makeBox(8, 28, 8, 0xcfc4a3, X_OFFSET - 52, 14, 2);
        // Tower cap / lantern north
        makeCylinder(2.5, 3, 6, 8, 0xb8ad92, X_OFFSET - 52, 31, 2);
        makeCone(2.5, 5, 8, 0xa09580, X_OFFSET - 52, 37, 2);

        // South-west bell tower
        makeBox(8, 28, 8, 0xcfc4a3, X_OFFSET - 52, 14, 18);
        // Tower cap / lantern south
        makeCylinder(2.5, 3, 6, 8, 0xb8ad92, X_OFFSET - 52, 31, 18);
        makeCone(2.5, 5, 8, 0xa09580, X_OFFSET - 52, 37, 18);
    }

    function buildCrossingDrum() {
        // Crossing drum (peristyle base)
        makeCylinder(14, 14, 12, 24, 0xcfc4a3, X_OFFSET, 30, 10);

        // Stone Gallery balcony ring
        makeCylinder(15, 15, 1.5, 24, 0xb0a888, X_OFFSET, 36.5, 10);

        // Peristyle colonnade — 12 columns around drum
        var numCols = 12;
        var drumR = 15.5;
        var j;
        for (j = 0; j < numCols; j++) {
            var angle = (j / numCols) * Math.PI * 2;
            var cx = X_OFFSET + Math.cos(angle) * drumR;
            var cz = 10 + Math.sin(angle) * drumR;
            makeCylinder(0.6, 0.6, 12, 8, 0xddd3b4, cx, 30, cz);
        }

        // Decorative frieze ring atop colonnade
        makeCylinder(14.5, 14.5, 1.5, 24, 0xc8bda0, X_OFFSET, 37.5, 10);
    }

    function buildMainDome() {
        // Large outer dome sphere
        makeSphere(12, 24, 16, 0xc8bda0, X_OFFSET, 52, 10);

        // Golden Gallery ring at base of lantern
        makeCylinder(5, 5, 1.5, 16, 0xd4af37, X_OFFSET, 65, 10);

        // Lantern drum
        makeCylinder(3.5, 3.5, 6, 12, 0xcfc4a3, X_OFFSET, 69, 10);

        // Golden lantern dome top
        makeSphere(3.5, 12, 8, 0xd4af37, X_OFFSET, 76, 10);

        // Ball and cross finial
        makeSphere(1, 8, 6, 0xd4af37, X_OFFSET, 80, 10);
        makeBox(0.3, 5, 0.3, 0xd4af37, X_OFFSET, 84, 10);
        makeBox(3, 0.3, 0.3, 0xd4af37, X_OFFSET, 85.5, 10);
    }

    function buildPaternosquareSquare() {
        // Paternoster Square paving
        makeBox(80, 1, 60, 0x999988, X_OFFSET - 80, 0.5, 10);

        // Temple Bar memorial arch
        makeBox(4, 12, 2, 0xbbaa88, X_OFFSET - 90, 6, 10);
        makeBox(12, 3, 2, 0xbbaa88, X_OFFSET - 90, 13, 10);

        // Column of Remembrance / Paternoster Column
        makeCylinder(0.8, 0.8, 18, 8, 0xd4c9a8, X_OFFSET - 80, 9, -5);
        makeCone(1, 3, 8, 0xc8bda0, X_OFFSET - 80, 19.5, -5);

        // Paternoster Square surrounding buildings
        makeBox(20, 20, 16, 0xaaa090, X_OFFSET - 100, 10, -10);
        makeBox(18, 18, 14, 0xaaa090, X_OFFSET - 100, 9, 28);
        makeBox(22, 16, 18, 0x998f80, X_OFFSET - 70, 8, -18);
    }

    function buildLudgateHill() {
        // Ludgate Hill street surface descending westward
        makeBox(24, 1, 120, 0x777766, X_OFFSET - 60, 0, 10);

        // Historic buildings along Ludgate Hill north side
        makeBox(14, 18, 12, 0x887766, X_OFFSET - 68, 9, -4);
        makeBox(12, 16, 10, 0x998877, X_OFFSET - 82, 8, -4);
        makeBox(16, 20, 14, 0x887766, X_OFFSET - 98, 10, -4);

        // South side buildings
        makeBox(14, 16, 12, 0x887766, X_OFFSET - 68, 8, 24);
        makeBox(12, 14, 10, 0x998877, X_OFFSET - 82, 7, 24);

        // Fleet Street junction marker buildings
        makeBox(16, 22, 16, 0x776655, X_OFFSET - 110, 11, -10);
        makeBox(14, 20, 14, 0x776655, X_OFFSET - 110, 10, 26);

        // Ludgate Circus
        makeBox(30, 1, 30, 0x666655, X_OFFSET - 118, 0.5, 10);
    }

    function buildGherkin() {
        // 30 St Mary Axe — tapered cylinder
        var gx = X_OFFSET + 120;
        var gz = -60;
        makeCylinder(0.1, 8, 80, 12, 0x88aabb, gx, 40, gz);
        makeSphere(8, 12, 8, 0x88aabb, gx, 80, gz);
    }

    function buildHeronTower() {
        // Heron Tower (Salesforce Tower) — setback slab
        var hx = X_OFFSET + 100;
        var hz = -40;
        makeBox(12, 90, 14, 0x99aabb, hx, 45, hz);
        makeBox(8, 20, 10, 0xaabbcc, hx, 100, hz);
    }

    function buildBishopsgate() {
        // 22 Bishopsgate — wide rectangular slab
        var bx = X_OFFSET + 90;
        var bz = -20;
        makeBox(22, 100, 18, 0xaabbcc, bx, 50, bz);
        makeBox(20, 10, 16, 0x99aabb, bx, 105, bz);
    }

    function buildCityBackground() {
        buildGherkin();
        buildHeronTower();
        buildBishopsgate();

        // Generic city background towers
        makeBox(14, 50, 14, 0x889aaa, X_OFFSET + 70, 25, -55);
        makeBox(12, 40, 12, 0x7788aa, X_OFFSET + 50, 20, -65);
        makeBox(16, 60, 16, 0x8899bb, X_OFFSET + 140, 30, -30);
        makeBox(10, 35, 10, 0x778899, X_OFFSET + 160, 17, -50);
        makeBox(18, 45, 14, 0x889aaa, X_OFFSET + 130, 22, -70);
    }

    function build() {
        buildGroundPlaza();
        buildNavAndTransepts();
        buildWestFacade();
        buildTwinTowers();
        buildCrossingDrum();
        buildMainDome();
        buildPaternosquareSquare();
        buildLudgateHill();
        buildCityBackground();
    }

    function update(delta) {
        // static environment — no animation required
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
