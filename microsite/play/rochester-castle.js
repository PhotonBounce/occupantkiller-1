window.RochesterCastle = (function () {
    'use strict';

    var OX = 4440;
    var OZ = 2200;

    var objects = [];
    var scene = null;

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function addBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildKeep() {
        var grey = 0x888888;
        // Main keep body
        addBox(14, 22, 14, grey, 0, 11, 0);
        // Four corner pilaster buttresses
        addBox(2, 22, 2, grey, -8, 11, -8);
        addBox(2, 22, 2, grey, 8, 11, -8);
        addBox(2, 22, 2, grey, -8, 11, 8);
        addBox(2, 22, 2, grey, 8, 11, 8);
        // Battlements top - row of merlons around parapet
        var i;
        for (i = -6; i <= 6; i += 3) {
            addBox(2, 2, 1, grey, i, 23.5, -7);
            addBox(2, 2, 1, grey, i, 23.5, 7);
            addBox(1, 2, 2, grey, -7, 23.5, i);
            addBox(1, 2, 2, grey, 7, 23.5, i);
        }
    }

    function buildCurtainWall() {
        var grey = 0x888888;
        // North wall
        addBox(40, 5, 1.5, grey, 0, 2.5, -18);
        // South wall
        addBox(40, 5, 1.5, grey, 0, 2.5, 18);
        // East wall
        addBox(1.5, 5, 36, grey, 20, 2.5, 0);
        // West wall
        addBox(1.5, 5, 36, grey, -20, 2.5, 0);
        // Interval towers - corners and midpoints
        var towerColor = 0x888888;
        addCylinder(3, 3, 10, towerColor, -20, 5, -18);
        addCylinder(3, 3, 10, towerColor, 20, 5, -18);
        addCylinder(3, 3, 10, towerColor, -20, 5, 18);
        addCylinder(3, 3, 10, towerColor, 20, 5, 18);
        addCylinder(3, 3, 10, towerColor, 0, 5, -18);
        addCylinder(3, 3, 10, towerColor, 0, 5, 18);
        addCylinder(3, 3, 10, towerColor, -20, 5, 0);
        addCylinder(3, 3, 10, towerColor, 20, 5, 0);
    }

    function buildCathedral() {
        var ragstone = 0x9B9B8E;
        // Nave
        addBox(35, 8, 10, ragstone, 80, 4, -30);
        // Central tower
        addBox(6, 14, 6, ragstone, 80, 7, -30);
        // West front facade
        addBox(12, 10, 2, ragstone, 62.5, 5, -30);
        // Transepts
        addBox(6, 7, 18, ragstone, 80, 3.5, -30);
        // Apse east end
        addBox(8, 6, 8, ragstone, 98, 3, -30);
    }

    function buildMedway() {
        // River running east-west through town
        addBox(80, 0.5, 15, 0x4169E1, 60, 0.1, 40);
    }

    function buildRochesterBridge() {
        var stoneColor = 0xAAAAAA;
        // Bridge deck
        addBox(80, 1.5, 6, stoneColor, 60, 3, 40);
        // 5 pier columns
        var i;
        for (i = 0; i < 5; i++) {
            addBox(3, 5, 4, stoneColor, 20 + i * 16, 2, 40);
        }
    }

    function buildChathamDockyard() {
        var dockColor = 0x8B7355;
        // Dry dock building 1
        addBox(20, 8, 12, dockColor, -60, 4, -80);
        // Dry dock building 2
        addBox(20, 8, 12, dockColor, -40, 4, -80);
        // Dry dock building 3
        addBox(20, 8, 12, dockColor, -20, 4, -80);
        // Warship hull (HMS Victory type)
        addBox(30, 6, 8, 0x4A3728, -50, 3, -60);
        // Masts
        addBox(1, 20, 1, 0x4A3728, -40, 10, -60);
        addBox(1, 15, 1, 0x4A3728, -50, 7.5, -60);
        addBox(1, 18, 1, 0x4A3728, -60, 9, -60);
        // Rope walk (long thin building)
        addBox(60, 4, 4, dockColor, -40, 2, -100);
        // Dock gate / entrance building
        addBox(10, 10, 6, dockColor, -70, 5, -70);
    }

    function buildVictorianTerraces() {
        var brickColor = 0xB05A3A;
        var i;
        // Row of terrace houses
        for (i = 0; i < 6; i++) {
            addBox(5, 8, 8, brickColor, 30 + i * 6, 4, -55);
        }
        // Restoration House (Miss Havisham inspiration)
        addBox(18, 12, 12, 0xD2B48C, 80, 6, -60);
        // Wings of mansion
        addBox(6, 8, 8, 0xD2B48C, 70, 4, -60);
        addBox(6, 8, 8, 0xD2B48C, 90, 4, -60);
        // Gate pillars
        addBox(1.5, 5, 1.5, 0xD2B48C, 76, 2.5, -52);
        addBox(1.5, 5, 1.5, 0xD2B48C, 84, 2.5, -52);
    }

    function buildUpnorCastle() {
        var ragstone = 0xD2B48C;
        // Across river - offset further
        // Gatehouse
        addBox(10, 10, 8, ragstone, 60, 5, 70);
        // Flanking towers
        addBox(4, 12, 4, ragstone, 54, 6, 70);
        addBox(4, 12, 4, ragstone, 66, 6, 70);
        // Artillery platform (wide low structure)
        addBox(30, 3, 15, ragstone, 60, 1.5, 85);
        // Parapet around platform
        addBox(30, 2, 1, ragstone, 60, 3.5, 78);
        addBox(30, 2, 1, ragstone, 60, 3.5, 92);
        addBox(1, 2, 15, ragstone, 45, 3.5, 85);
        addBox(1, 2, 15, ragstone, 75, 3.5, 85);
        // Cannons (box shapes on platform)
        addBox(4, 1.5, 1.5, 0x333333, 50, 3.5, 80);
        addBox(4, 1.5, 1.5, 0x333333, 58, 3.5, 80);
        addBox(4, 1.5, 1.5, 0x333333, 66, 3.5, 80);
        addBox(4, 1.5, 1.5, 0x333333, 74, 3.5, 80);
    }

    function buildMedwayMotorwayBridge() {
        var concreteColor = 0xCCCCCC;
        // Modern motorway bridge alongside historic
        addBox(80, 2, 10, concreteColor, 60, 5, 52);
        // Support piers
        var i;
        for (i = 0; i < 4; i++) {
            addBox(3, 8, 6, concreteColor, 24 + i * 20, 4, 52);
        }
    }

    function buildChathamLines() {
        var earthColor = 0x5C4A1E;
        // Napoleonic earthwork mounds surrounding the area
        // North ridge
        addBox(80, 4, 8, earthColor, 0, 2, -130);
        // East ridge
        addBox(8, 4, 80, earthColor, 130, 2, -80);
        // South-east section
        addBox(60, 3, 8, earthColor, 60, 1.5, 130);
        // West ridge
        addBox(8, 4, 80, earthColor, -100, 2, -80);
        // North-west bastion
        addBox(20, 5, 20, earthColor, -110, 2.5, -120);
        // North-east bastion
        addBox(20, 5, 20, earthColor, 110, 2.5, -120);
        // South bastion
        addBox(20, 5, 20, earthColor, 60, 2.5, 140);
        // Demi-lune outworks
        addBox(15, 3, 10, earthColor, -40, 1.5, -135);
        addBox(15, 3, 10, earthColor, 40, 1.5, -135);
        addBox(10, 3, 15, earthColor, -105, 1.5, -40);
        addBox(10, 3, 15, earthColor, 135, 1.5, -40);
    }

    function init(sceneRef) {
        scene = sceneRef;
        objects = [];
        buildKeep();
        buildCurtainWall();
        buildCathedral();
        buildMedway();
        buildRochesterBridge();
        buildChathamDockyard();
        buildVictorianTerraces();
        buildUpnorCastle();
        buildMedwayMotorwayBridge();
        buildChathamLines();
    }

    function update(delta) {
        // Static environment — no animation needed
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
