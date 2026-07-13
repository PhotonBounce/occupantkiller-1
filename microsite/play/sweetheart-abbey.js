window.SweetheartAbbey = (function() {
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

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z, ry) {
        var geo = new THREE.BoxGeometry(w, h, d);
        return makeMesh(geo, color, x, y, z, 0, ry || 0, 0);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z, ry) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 8);
        return makeMesh(geo, color, x, y, z, 0, ry || 0, 0);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws || 8, hs || 8);
        return makeMesh(geo, color, x, y, z, 0, 0, 0);
    }

    function makeCone(r, h, segs, color, x, y, z, ry) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        return makeMesh(geo, color, x, y, z, 0, ry || 0, 0);
    }

    function build() {
        var OX = 20640;
        var SANDSTONE = 0xCD5C5C;
        var SANDSTONE_LIGHT = 0xD4736A;
        var CREAM = 0xF5F0E8;
        var DARK_STONE = 0x8B7355;
        var GRANITE = 0x5a5a5a;
        var WATER = 0x006994;
        var HEADSTONE = 0xC8B89A;
        var GRASS = 0x4a7c3f;
        var WOOD = 0x6B4226;
        var LEAD = 0x888888;
        var EARTH = 0x8B6914;

        // -------------------------------------------------------
        // GROUND PLANE (using thin box to avoid PlaneGeometry)
        // -------------------------------------------------------
        makeBox(600, 0.5, 600, GRASS, OX, -0.25, 0);

        // -------------------------------------------------------
        // ABBEY CHURCH — CROSSING TOWER (intact, prominent)
        // -------------------------------------------------------
        // Tower base — four thick sandstone walls forming the crossing
        makeBox(14, 28, 14, SANDSTONE, OX, 14, 0);
        // Tower upper stage
        makeBox(12, 10, 12, SANDSTONE, OX, 33, 0);
        // Tower parapet crenellations (series of merlons)
        makeBox(2, 3, 2, SANDSTONE, OX - 5, 40, -5);
        makeBox(2, 3, 2, SANDSTONE, OX - 5, 40,  5);
        makeBox(2, 3, 2, SANDSTONE, OX + 5, 40, -5);
        makeBox(2, 3, 2, SANDSTONE, OX + 5, 40,  5);
        makeBox(2, 3, 2, SANDSTONE, OX,     40, -6);
        makeBox(2, 3, 2, SANDSTONE, OX,     40,  6);
        makeBox(2, 3, 2, SANDSTONE, OX - 6, 40,  0);
        makeBox(2, 3, 2, SANDSTONE, OX + 6, 40,  0);

        // -------------------------------------------------------
        // ABBEY CHURCH — NAVE (roofless walls, still standing)
        // -------------------------------------------------------
        // North nave wall
        makeBox(38, 18, 1.5, SANDSTONE, OX - 25, 9, -8);
        // South nave wall
        makeBox(38, 18, 1.5, SANDSTONE, OX - 25, 9,  8);
        // West end wall (with door arch)
        makeBox(16, 18, 1.5, SANDSTONE, OX - 44, 9, 0);
        // West door arch lintel
        makeBox(5, 2, 1.5, SANDSTONE, OX - 44, 4, 0);
        // West door left jamb
        makeBox(1.5, 7, 1.5, SANDSTONE, OX - 44, 1.5, -2.5);
        // West door right jamb
        makeBox(1.5, 7, 1.5, SANDSTONE, OX - 44, 1.5,  2.5);
        // Pointed west door arch (cone approximation)
        makeCone(2.5, 4, 4, SANDSTONE, OX - 44, 7.5, 0);

        // -------------------------------------------------------
        // GOTHIC TRACERY WINDOWS in nave walls (recessed frames)
        // -------------------------------------------------------
        // North wall windows
        makeBox(3, 6, 0.4, SANDSTONE_LIGHT, OX - 30, 11, -8.8);
        makeCone(1.5, 3, 4, SANDSTONE_LIGHT, OX - 30, 15, -8.8);
        makeBox(3, 6, 0.4, SANDSTONE_LIGHT, OX - 22, 11, -8.8);
        makeCone(1.5, 3, 4, SANDSTONE_LIGHT, OX - 22, 15, -8.8);
        makeBox(3, 6, 0.4, SANDSTONE_LIGHT, OX - 14, 11, -8.8);
        makeCone(1.5, 3, 4, SANDSTONE_LIGHT, OX - 14, 15, -8.8);
        // South wall windows
        makeBox(3, 6, 0.4, SANDSTONE_LIGHT, OX - 30, 11,  8.8);
        makeCone(1.5, 3, 4, SANDSTONE_LIGHT, OX - 30, 15,  8.8);
        makeBox(3, 6, 0.4, SANDSTONE_LIGHT, OX - 22, 11,  8.8);
        makeCone(1.5, 3, 4, SANDSTONE_LIGHT, OX - 22, 15,  8.8);
        makeBox(3, 6, 0.4, SANDSTONE_LIGHT, OX - 14, 11,  8.8);
        makeCone(1.5, 3, 4, SANDSTONE_LIGHT, OX - 14, 15,  8.8);

        // -------------------------------------------------------
        // FLYING BUTTRESSES — south nave
        // -------------------------------------------------------
        makeBox(1.2, 1.2, 6, SANDSTONE, OX - 30, 13, 11, 0.35);
        makeBox(1.2, 1.2, 6, SANDSTONE, OX - 22, 13, 11, 0.35);
        makeBox(1.2, 1.2, 6, SANDSTONE, OX - 14, 13, 11, 0.35);
        // Buttress piers (vertical supports)
        makeBox(1.5, 10, 1.5, SANDSTONE, OX - 30, 5, 14);
        makeBox(1.5, 10, 1.5, SANDSTONE, OX - 22, 5, 14);
        makeBox(1.5, 10, 1.5, SANDSTONE, OX - 14, 5, 14);

        // -------------------------------------------------------
        // SOUTH TRANSEPT
        // -------------------------------------------------------
        makeBox(1.5, 20, 16, SANDSTONE, OX + 7, 10, 20);
        makeBox(1.5, 20, 16, SANDSTONE, OX - 7, 10, 20);
        makeBox(14, 20, 1.5, SANDSTONE, OX, 10, 28);
        // South transept gable (pointed)
        makeCone(7, 8, 4, SANDSTONE, OX, 24, 28);

        // -------------------------------------------------------
        // CHANCEL / PRESBYTERY (east end, partial remains)
        // -------------------------------------------------------
        makeBox(1.5, 16, 14, SANDSTONE, OX + 8, 8, -15);
        makeBox(1.5, 16, 14, SANDSTONE, OX - 8, 8, -15);
        makeBox(16, 8, 1.5, SANDSTONE, OX, 8, -22);
        // East window large pointed
        makeCone(4, 7, 4, SANDSTONE_LIGHT, OX, 14, -22.5);

        // -------------------------------------------------------
        // LADY DERVORGILLA TOMB — ornate effigy in nave
        // -------------------------------------------------------
        // Tomb chest
        makeBox(5, 1.5, 2.5, SANDSTONE, OX - 30, 0.75, 0);
        // Effigy figure (lying)
        makeBox(4, 0.8, 1, CREAM, OX - 30, 1.6, 0);
        // Head
        makeSphere(0.5, 8, 8, CREAM, OX - 28, 2.0, 0);
        // Tomb canopy arch
        makeCone(2, 3, 4, SANDSTONE, OX - 30, 3.5, 0);

        // -------------------------------------------------------
        // PRECINCT WALL — massive red sandstone enclosure
        // -------------------------------------------------------
        // North wall
        makeBox(90, 4, 1.8, SANDSTONE, OX - 5, 2, -55);
        // South wall
        makeBox(90, 4, 1.8, SANDSTONE, OX - 5, 2,  55);
        // East wall
        makeBox(1.8, 4, 110, SANDSTONE, OX + 40, 2, 0);
        // West wall
        makeBox(1.8, 4, 110, SANDSTONE, OX - 50, 2, 0);
        // Gatehouse (main entrance)
        makeBox(10, 6, 3, SANDSTONE, OX - 50, 3, 20);
        // Gateway arch
        makeCone(3, 5, 4, SANDSTONE, OX - 50, 8, 20);
        // Precinct wall corner turrets
        makeCyl(1.2, 1.2, 5, 8, SANDSTONE, OX + 40, 2.5, -55);
        makeCyl(1.2, 1.2, 5, 8, SANDSTONE, OX + 40, 2.5,  55);
        makeCyl(1.2, 1.2, 5, 8, SANDSTONE, OX - 50, 2.5, -55);
        makeCyl(1.2, 1.2, 5, 8, SANDSTONE, OX - 50, 2.5,  55);

        // -------------------------------------------------------
        // ABBEY GRAVEYARD — headstones
        // -------------------------------------------------------
        makeBox(0.3, 1.2, 0.8, HEADSTONE, OX - 38, 0.6, -15);
        makeBox(0.3, 1.0, 0.7, HEADSTONE, OX - 38, 0.5, -18);
        makeBox(0.3, 1.3, 0.8, HEADSTONE, OX - 38, 0.65, -21);
        makeBox(0.3, 1.1, 0.7, HEADSTONE, OX - 35, 0.55, -15);
        makeBox(0.3, 1.2, 0.8, HEADSTONE, OX - 35, 0.6, -18);
        makeBox(0.3, 0.9, 0.7, HEADSTONE, OX - 35, 0.45, -21);
        makeBox(0.3, 1.2, 0.8, HEADSTONE, OX - 38, 0.6,  15);
        makeBox(0.3, 1.1, 0.7, HEADSTONE, OX - 38, 0.55, 18);
        makeBox(0.3, 1.3, 0.8, HEADSTONE, OX - 35, 0.65, 15);
        makeBox(0.3, 1.0, 0.7, HEADSTONE, OX - 35, 0.5,  18);
        // Cross-topped headstones (box cross on top)
        makeBox(0.2, 0.5, 0.5, HEADSTONE, OX - 42, 0.25, -12);
        makeBox(0.2, 1.2, 0.15, HEADSTONE, OX - 42, 0.6, -12);
        makeBox(0.2, 0.15, 0.7, HEADSTONE, OX - 42, 0.9, -12);

        // -------------------------------------------------------
        // NEW ABBEY VILLAGE — stone buildings
        // -------------------------------------------------------
        // Village house 1
        makeBox(9, 5, 7, CREAM, OX - 70, 2.5, 30);
        makeCone(4.5, 3.5, 4, SANDSTONE, OX - 70, 6.75, 30);
        // Village house 2
        makeBox(8, 5, 7, CREAM, OX - 82, 2.5, 32);
        makeCone(4, 3, 4, SANDSTONE, OX - 82, 6.5, 32);
        // Village house 3
        makeBox(10, 5.5, 8, CREAM, OX - 65, 2.75, 45);
        makeCone(5, 3.5, 4, SANDSTONE, OX - 65, 7.5, 45);
        // Village house 4
        makeBox(9, 5, 7, CREAM, OX - 78, 2.5, 46);
        makeCone(4.5, 3, 4, SANDSTONE, OX - 78, 6.5, 46);
        // Village inn / larger building
        makeBox(14, 6, 10, CREAM, OX - 60, 3, 60);
        makeCone(7, 4, 4, SANDSTONE, OX - 60, 8, 60);
        // Chimney stacks
        makeCyl(0.4, 0.4, 2, 6, SANDSTONE, OX - 67, 9, 28);
        makeCyl(0.4, 0.4, 2, 6, SANDSTONE, OX - 73, 8.5, 30);
        makeCyl(0.4, 0.4, 2, 6, SANDSTONE, OX - 57, 10, 58);

        // -------------------------------------------------------
        // NEW ABBEY CORN MILL — historic watermill
        // -------------------------------------------------------
        // Mill building
        makeBox(12, 8, 10, DARK_STONE, OX - 55, 4, -35);
        makeCone(6, 4, 4, DARK_STONE, OX - 55, 10, -35);
        // Mill wheel (vertical, large cylinder on side)
        makeCyl(4, 4, 1.2, 16, WOOD, OX - 61, 3, -35, 0);
        // Wheel hub
        makeCyl(0.6, 0.6, 1.4, 8, WOOD, OX - 61, 3, -35, 0);
        // Wheel paddles represented by thin boxes (6 of them around perimeter, approximate)
        makeBox(0.8, 3.5, 1.0, WOOD, OX - 61, 3, -35);
        makeBox(0.8, 3.5, 1.0, WOOD, OX - 61, 3, -35);
        // Mill race / water channel (thin long box)
        makeBox(20, 0.4, 2, WATER, OX - 67, 0.2, -35);
        // Mill lade wall
        makeBox(20, 1.5, 0.5, DARK_STONE, OX - 67, 0.75, -34);
        makeBox(20, 1.5, 0.5, DARK_STONE, OX - 67, 0.75, -36);
        // Mill chimney
        makeCyl(0.5, 0.5, 3, 6, DARK_STONE, OX - 50, 11.5, -33);

        // -------------------------------------------------------
        // LOCH KINDAR — small loch to the east
        // -------------------------------------------------------
        makeBox(60, 0.3, 40, WATER, OX + 80, 0.15, -30);
        // Reed bed edges (dark green/brown strip)
        makeBox(60, 0.8, 3, EARTH, OX + 80, 0.4, -10);
        makeBox(60, 0.8, 3, EARTH, OX + 80, 0.4, -50);
        // Small island
        makeBox(8, 0.6, 6, GRASS, OX + 90, 0.3, -30);

        // -------------------------------------------------------
        // SOLWAY FIRTH — tidal estuary to south
        // -------------------------------------------------------
        makeBox(500, 0.3, 120, WATER, OX, 0.15, 200);
        // Mudflat (tidal) — sandy brown strip at edge
        makeBox(500, 0.4, 20, HEADSTONE, OX, 0.2, 140);

        // -------------------------------------------------------
        // CRIFFEL — granite hill, 569m, behind abbey
        // -------------------------------------------------------
        // Main hill mass (use large cone and cylinder stack)
        makeCyl(60, 90, 80, 16, GRANITE, OX + 150, 40, -180);
        makeCone(60, 100, 16, GRANITE, OX + 150, 120, -180);
        // Secondary ridge
        makeCyl(30, 50, 60, 12, GRANITE, OX + 120, 30, -200);
        makeCone(30, 60, 12, GRANITE, OX + 120, 88, -200);

        // -------------------------------------------------------
        // SHAMBELLIE HOUSE — Victorian mansion, east of village
        // -------------------------------------------------------
        // Main house block
        makeBox(18, 10, 14, CREAM, OX + 60, 5, 50);
        makeCone(9, 5, 4, SANDSTONE, OX + 60, 12.5, 50);
        // Wing
        makeBox(8, 8, 10, CREAM, OX + 73, 4, 50);
        makeCone(4, 4, 4, SANDSTONE, OX + 73, 10, 50);
        // Tower feature
        makeCyl(2.5, 2.5, 14, 8, CREAM, OX + 51, 7, 57);
        makeCone(2.5, 4, 8, SANDSTONE, OX + 51, 15.5, 57);
        // Chimney stacks
        makeCyl(0.5, 0.5, 3, 6, SANDSTONE, OX + 62, 15.5, 48);
        makeCyl(0.5, 0.5, 3, 6, SANDSTONE, OX + 66, 15.5, 48);
        // Garden wall
        makeBox(30, 1.5, 0.4, SANDSTONE, OX + 60, 0.75, 44);

        // -------------------------------------------------------
        // SCATTERED TREES / VEGETATION (sphere canopy + cylinder trunk)
        // -------------------------------------------------------
        makeCyl(0.4, 0.4, 4, 6, WOOD, OX - 45, 2, -40);
        makeSphere(2.5, 8, 8, GRASS, OX - 45, 5.5, -40);
        makeCyl(0.4, 0.4, 4, 6, WOOD, OX - 48, 2, 35);
        makeSphere(2.5, 8, 8, GRASS, OX - 48, 5.5, 35);
        makeCyl(0.4, 0.4, 5, 6, WOOD, OX + 35, 2.5, -45);
        makeSphere(3, 8, 8, GRASS, OX + 35, 6, -45);
        makeCyl(0.4, 0.4, 4, 6, WOOD, OX + 50, 2, 25);
        makeSphere(2.5, 8, 8, GRASS, OX + 50, 5.5, 25);

        // -------------------------------------------------------
        // ADDITIONAL WALL DETAILS — buttress corbels on tower
        // -------------------------------------------------------
        makeBox(3, 2, 15, SANDSTONE, OX - 7, 8, 0);
        makeBox(3, 2, 15, SANDSTONE, OX + 7, 8, 0);
        makeBox(15, 2, 3, SANDSTONE, OX, 8, -7);
        makeBox(15, 2, 3, SANDSTONE, OX, 8, 7);

        // -------------------------------------------------------
        // ROAD through village (flat dark box)
        // -------------------------------------------------------
        makeBox(100, 0.2, 5, 0x555555, OX - 65, 0.1, 38);

        // -------------------------------------------------------
        // LOW AMBIENT STONE BOUNDARY MARKERS
        // -------------------------------------------------------
        makeBox(0.5, 0.8, 0.5, HEADSTONE, OX - 51, 0.4, -54);
        makeBox(0.5, 0.8, 0.5, HEADSTONE, OX - 51, 0.4, 54);
        makeBox(0.5, 0.8, 0.5, HEADSTONE, OX + 39, 0.4, -54);
        makeBox(0.5, 0.8, 0.5, HEADSTONE, OX + 39, 0.4, 54);
    }

    function update(delta) { }

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
