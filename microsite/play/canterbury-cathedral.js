window.CanterburyCathedral = (function() {
    'use strict';

    var OFFSET_X = 4320;
    var OFFSET_Z = 2200;
    var objects = [];
    var scene = null;

    function makeBox(w, h, d, color, ox, oy, oz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + ox, oy, OFFSET_Z + oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, ox, oy, oz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + ox, oy, OFFSET_Z + oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function makeCone(r, h, segs, color, ox, oy, oz) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + ox, oy, OFFSET_Z + oz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildCathedral() {
        var stone = 0xC8C8B0;

        // Long nave
        addToScene(makeBox(45, 10, 14, stone, 0, 5, 0));

        // Central Bell Harry Tower
        addToScene(makeBox(8, 24, 8, stone, 0, 12, 0));

        // Pinnacles on Bell Harry Tower
        addToScene(makeCone(1.5, 5, 4, stone, -3, 26, -3));
        addToScene(makeCone(1.5, 5, 4, stone,  3, 26, -3));
        addToScene(makeCone(1.5, 5, 4, stone, -3, 26,  3));
        addToScene(makeCone(1.5, 5, 4, stone,  3, 26,  3));

        // Twin west towers
        addToScene(makeBox(5, 18, 5, stone, -20, 9, 0));
        addToScene(makeBox(5, 18, 5, stone,  20, 9, 0));

        // West tower pinnacles
        addToScene(makeCone(1.2, 4, 4, stone, -20, 20, 0));
        addToScene(makeCone(1.2, 4, 4, stone,  20, 20, 0));

        // Transepts
        addToScene(makeBox(12, 8, 30, stone, 0, 4, 0));

        // Choir
        addToScene(makeBox(20, 9, 10, stone, 20, 4.5, 0));

        // Apse / east end
        addToScene(makeBox(10, 8, 10, stone, 27, 4, 0));

        // Chapter house (octagonal approximated with cylinder)
        addToScene(makeCylinder(6, 6, 7, 8, stone, -18, 3.5, 18));

        // Cloisters - four walls
        addToScene(makeBox(20, 4, 1, stone, -8, 2,  14));
        addToScene(makeBox(20, 4, 1, stone, -8, 2,  30));
        addToScene(makeBox(1, 4, 16, stone, -18, 2, 22));
        addToScene(makeBox(1, 4, 16, stone,   2, 2, 22));

        // Ground plinth
        addToScene(makeBox(50, 1, 20, stone, 0, 0, 0));
    }

    function buildChristChurchGate() {
        var cream = 0xFFF8DC;
        var heraldic = 0xC0A030;

        // Main gatehouse body
        addToScene(makeBox(16, 8, 5, cream, -40, 4, -25));

        // Gate arch (dark void approximated by dark box inset)
        addToScene(makeBox(4, 5, 6, 0x333322, -40, 2.5, -25));

        // Flanking turrets
        addToScene(makeCylinder(2, 2, 10, 8, cream, -48, 5, -25));
        addToScene(makeCylinder(2, 2, 10, 8, cream, -32, 5, -25));

        // Turret caps
        addToScene(makeCone(2.5, 4, 8, heraldic, -48, 12, -25));
        addToScene(makeCone(2.5, 4, 8, heraldic, -32, 12, -25));

        // Heraldic panel above gate
        addToScene(makeBox(6, 2, 0.5, heraldic, -40, 7.5, -22.5));

        // Battlements
        addToScene(makeBox(2, 1, 1, cream, -44, 8.5, -22.5));
        addToScene(makeBox(2, 1, 1, cream, -40, 8.5, -22.5));
        addToScene(makeBox(2, 1, 1, cream, -36, 8.5, -22.5));
    }

    function buildCityWalls() {
        var wallColor = 0x9A8870;
        var wallH = 4;
        var wallT = 2;
        var halfSide = 30;

        // North wall
        addToScene(makeBox(60, wallH, wallT, wallColor, 0, wallH / 2, -halfSide));
        // South wall
        addToScene(makeBox(60, wallH, wallT, wallColor, 0, wallH / 2,  halfSide));
        // West wall
        addToScene(makeBox(wallT, wallH, 60, wallColor, -halfSide, wallH / 2, 0));
        // East wall
        addToScene(makeBox(wallT, wallH, 60, wallColor,  halfSide, wallH / 2, 0));

        // Interval towers — north wall
        addToScene(makeCylinder(2, 2, 6, 8, wallColor, -15, 3, -halfSide));
        addToScene(makeCylinder(2, 2, 6, 8, wallColor,   0, 3, -halfSide));
        addToScene(makeCylinder(2, 2, 6, 8, wallColor,  15, 3, -halfSide));

        // Interval towers — south wall
        addToScene(makeCylinder(2, 2, 6, 8, wallColor, -15, 3, halfSide));
        addToScene(makeCylinder(2, 2, 6, 8, wallColor,   0, 3, halfSide));
        addToScene(makeCylinder(2, 2, 6, 8, wallColor,  15, 3, halfSide));

        // Interval towers — west wall
        addToScene(makeCylinder(2, 2, 6, 8, wallColor, -halfSide, 3, -15));
        addToScene(makeCylinder(2, 2, 6, 8, wallColor, -halfSide, 3,   0));
        addToScene(makeCylinder(2, 2, 6, 8, wallColor, -halfSide, 3,  15));

        // Interval towers — east wall
        addToScene(makeCylinder(2, 2, 6, 8, wallColor, halfSide, 3, -15));
        addToScene(makeCylinder(2, 2, 6, 8, wallColor, halfSide, 3,   0));
        addToScene(makeCylinder(2, 2, 6, 8, wallColor, halfSide, 3,  15));
    }

    function buildWestgateTowers() {
        var gateColor = 0x808080;

        // Twin drum towers
        addToScene(makeCylinder(4, 4, 12, 12, gateColor, -55, 6, 0));
        addToScene(makeCylinder(4, 4, 12, 12, gateColor, -47, 6, 0));

        // Gate arch box
        addToScene(makeBox(8, 8, 5, gateColor, -51, 4, 0));

        // Gate passage (dark)
        addToScene(makeBox(4, 6, 6, 0x222222, -51, 3, 0));

        // Crenellations on towers
        addToScene(makeCone(4.5, 3, 12, gateColor, -55, 13.5, 0));
        addToScene(makeCone(4.5, 3, 12, gateColor, -47, 13.5, 0));

        // Portcullis slot suggestion
        addToScene(makeBox(4, 0.5, 0.5, 0x444444, -51, 7, -2));
    }

    function buildRiverStour() {
        var waterColor = 0x4169E1;
        var boatColor = 0x8B6914;

        // Main river strip running north-south
        addToScene(makeBox(3, 0.4, 50, waterColor, 10, 0.2, 0));

        // Punting boats
        addToScene(makeBox(1.5, 0.5, 4, boatColor, 10, 0.65, -8));
        addToScene(makeBox(1.5, 0.5, 4, boatColor, 10, 0.65,  5));
        addToScene(makeBox(1.5, 0.5, 4, boatColor, 10, 0.65, 18));

        // Punt poles
        addToScene(makeBox(0.1, 4, 0.1, 0x5C3A1E, 10.5, 2.5, -8));
        addToScene(makeBox(0.1, 4, 0.1, 0x5C3A1E, 10.5, 2.5,  5));

        // River bank low walls
        addToScene(makeBox(0.5, 1, 50, 0x9A8870, 8, 0.5, 0));
        addToScene(makeBox(0.5, 1, 50, 0x9A8870, 12, 0.5, 0));
    }

    function buildStAugustinesAbbey() {
        var ruinColor = 0xD2B48C;

        // Main foundation slab
        addToScene(makeBox(30, 0.5, 18, ruinColor, 35, 0.25, 20));

        // North foundation wall
        addToScene(makeBox(30, 2.5, 1, ruinColor, 35, 1.25,  11));
        // South foundation wall (ruined, shorter)
        addToScene(makeBox(30, 1.5, 1, ruinColor, 35, 0.75,  29));
        // West wall
        addToScene(makeBox(1, 3, 18, ruinColor, 20, 1.5, 20));
        // East wall (partial ruin)
        addToScene(makeBox(1, 2, 18, ruinColor, 50, 1, 20));

        // Ruined arch piers (pairs of boxes)
        addToScene(makeBox(1.5, 5, 1.5, ruinColor, 25, 2.5, 15));
        addToScene(makeBox(1.5, 5, 1.5, ruinColor, 25, 2.5, 25));
        addToScene(makeBox(1.5, 5, 1.5, ruinColor, 32, 2.5, 15));
        addToScene(makeBox(1.5, 5, 1.5, ruinColor, 32, 2.5, 25));
        addToScene(makeBox(1.5, 4, 1.5, ruinColor, 39, 2, 15));
        addToScene(makeBox(1.5, 4, 1.5, ruinColor, 39, 2, 25));

        // Arch lintels
        addToScene(makeBox(9, 1, 1, ruinColor, 28.5, 5.5, 15));
        addToScene(makeBox(9, 1, 1, ruinColor, 28.5, 5.5, 25));

        // Tower stump
        addToScene(makeCylinder(3, 3.5, 8, 8, ruinColor, 48, 4, 15));
    }

    function buildMarloweTheatre() {
        var concrete = 0x808080;
        var glass = 0x88AACC;

        // Main theatre volume
        addToScene(makeBox(20, 10, 15, concrete, -20, 5, 35));

        // Fly tower
        addToScene(makeBox(12, 18, 10, concrete, -20, 9, 35));

        // Foyer glazing suggestion
        addToScene(makeBox(20, 6, 3, glass, -20, 3, 28));

        // Entrance canopy
        addToScene(makeBox(10, 0.5, 4, concrete, -20, 6.5, 27));

        // Signage box (dark)
        addToScene(makeBox(8, 1.5, 0.3, 0x222222, -20, 7.5, 27.5));
    }

    function buildButtermarket() {
        var paving = 0xCCBBA0;
        var timber = 0x6B4226;
        var stallColor = 0xFFE0A0;
        var monument = 0xBBBBBB;

        // Open plaza
        addToScene(makeBox(25, 0.3, 25, paving, -40, 0.15, 10));

        // Market stalls
        addToScene(makeBox(4, 2.5, 3, stallColor, -48, 1.25, 5));
        addToScene(makeBox(4, 2.5, 3, stallColor, -42, 1.25, 5));
        addToScene(makeBox(4, 2.5, 3, stallColor, -36, 1.25, 5));
        addToScene(makeBox(4, 2.5, 3, stallColor, -48, 1.25, 15));
        addToScene(makeBox(4, 2.5, 3, stallColor, -42, 1.25, 15));
        addToScene(makeBox(4, 2.5, 3, stallColor, -36, 1.25, 15));

        // Stall awning frames
        addToScene(makeBox(4.5, 0.2, 3.5, timber, -48, 2.8, 5));
        addToScene(makeBox(4.5, 0.2, 3.5, timber, -42, 2.8, 5));
        addToScene(makeBox(4.5, 0.2, 3.5, timber, -36, 2.8, 5));

        // Central column monument
        addToScene(makeCylinder(0.4, 0.5, 6, 8, monument, -40, 3, 10));
        addToScene(makeCone(0.7, 1.5, 8, monument, -40, 7.25, 10));
        addToScene(makeBox(2, 0.5, 2, monument, -40, 0.5, 10));
    }

    function buildGreyfriarsChapel() {
        var chapelColor = 0xB8A888;
        var waterColor = 0x4169E1;

        // River section beneath chapel
        addToScene(makeBox(6, 0.4, 10, waterColor, 18, 0.2, 35));

        // Bridge support piers in river
        addToScene(makeBox(1.5, 2, 1.5, 0x9A8870, 16, 1, 35));
        addToScene(makeBox(1.5, 2, 1.5, 0x9A8870, 20, 1, 35));

        // Bridge deck
        addToScene(makeBox(8, 0.5, 3, 0x9A8870, 18, 2.25, 35));

        // Chapel body (sitting over river)
        addToScene(makeBox(8, 5, 10, chapelColor, 18, 5, 35));

        // Chapel roof ridge
        addToScene(makeBox(8, 0.5, 10, chapelColor, 18, 7.8, 35));

        // Gable ends (triangular approximated with cone)
        addToScene(makeCone(5, 4, 4, chapelColor, 18, 9.5, 30));
        addToScene(makeCone(5, 4, 4, chapelColor, 18, 9.5, 40));

        // Small windows (dark insets)
        addToScene(makeBox(1, 1.5, 0.3, 0x332200, 15, 4, 32));
        addToScene(makeBox(1, 1.5, 0.3, 0x332200, 15, 4, 38));
        addToScene(makeBox(1, 1.5, 0.3, 0x332200, 21, 4, 32));
        addToScene(makeBox(1, 1.5, 0.3, 0x332200, 21, 4, 38));

        // Doorway
        addToScene(makeBox(1.5, 2.5, 0.3, 0x222222, 18, 1.75, 30));
    }

    function buildCanterburyTales() {
        var darkTimber = 0x8B4513;
        var plaster = 0xFFF8DC;
        var roofColor = 0x5C3A1E;

        // Ground floor — plaster
        addToScene(makeBox(12, 4, 10, plaster, -55, 2, 25));

        // Upper floor — timber framed (darker)
        addToScene(makeBox(12, 3.5, 10, darkTimber, -55, 5.75, 25));

        // Jettied overhang
        addToScene(makeBox(13, 0.4, 11, darkTimber, -55, 4.2, 25));

        // Roof
        addToScene(makeBox(13, 0.5, 11, roofColor, -55, 9.75, 25));

        // Roof gables (cone approximation)
        addToScene(makeCone(7, 4, 4, roofColor, -55, 11.75, 25));

        // Timber framing verticals
        addToScene(makeBox(0.4, 3.5, 0.4, darkTimber, -61, 5.75, 20));
        addToScene(makeBox(0.4, 3.5, 0.4, darkTimber, -55, 5.75, 20));
        addToScene(makeBox(0.4, 3.5, 0.4, darkTimber, -49, 5.75, 20));
        addToScene(makeBox(0.4, 3.5, 0.4, darkTimber, -61, 5.75, 30));
        addToScene(makeBox(0.4, 3.5, 0.4, darkTimber, -55, 5.75, 30));
        addToScene(makeBox(0.4, 3.5, 0.4, darkTimber, -49, 5.75, 30));

        // Timber framing horizontals
        addToScene(makeBox(12, 0.4, 0.4, darkTimber, -55, 7.5, 20));
        addToScene(makeBox(12, 0.4, 0.4, darkTimber, -55, 7.5, 30));

        // Sign board
        addToScene(makeBox(5, 1, 0.2, darkTimber, -55, 5, 19.9));

        // Entrance door
        addToScene(makeBox(1.8, 3, 0.3, 0x5C3A1E, -55, 1.5, 19.9));

        // Ground floor windows
        addToScene(makeBox(1.5, 1.5, 0.3, 0x88AACC, -58, 2.5, 19.9));
        addToScene(makeBox(1.5, 1.5, 0.3, 0x88AACC, -52, 2.5, 19.9));
    }

    function buildGround() {
        var grassColor = 0x5A7A3A;
        var roadColor = 0x666655;
        var cobbleColor = 0xBBAA99;

        // Cathedral green
        addToScene(makeBox(80, 0.3, 80, grassColor, 0, 0.15, 0));

        // Main road east-west
        addToScene(makeBox(80, 0.35, 5, roadColor, -10, 0.2, -35));

        // Main road north-south
        addToScene(makeBox(5, 0.35, 80, roadColor, -10, 0.2, 0));

        // Cobbled area near Buttermarket
        addToScene(makeBox(30, 0.32, 30, cobbleColor, -40, 0.16, 10));

        // Cathedral precinct paving
        addToScene(makeBox(55, 0.32, 25, cobbleColor, 0, 0.16, 0));
    }

    function init(sceneRef) {
        scene = sceneRef;
        buildGround();
        buildCathedral();
        buildChristChurchGate();
        buildCityWalls();
        buildWestgateTowers();
        buildRiverStour();
        buildStAugustinesAbbey();
        buildMarloweTheatre();
        buildButtermarket();
        buildGreyfriarsChapel();
        buildCanterburyTales();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
        void delta;
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].parent) {
                objects[i].parent.remove(objects[i]);
            }
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
        scene = null;
    }

    return { init: init, update: update, reset: reset };
}());
