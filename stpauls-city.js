window.StPaulsCity = (function() {
    'use strict';

    var OFFSET_X = 4640;
    var OFFSET_Z = 2200;
    var objects = [];
    var scene = null;

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function addBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCylinder(rTop, rBottom, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rTop, rBottom, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addSphere(r, widthSegs, heightSegs, phiStart, phiLen, thetaStart, thetaLen, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, widthSegs, heightSegs, phiStart, phiLen, thetaStart, thetaLen);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildStPauls() {
        var stone = 0xF0EEE4;
        // Nave
        addBox(40, 12, 18, stone, 0, 6, 0);
        // West tower left
        addBox(6, 18, 6, stone, -17, 9, -6);
        // West tower right
        addBox(6, 18, 6, stone, 17, 9, -6);
        // Central drum
        addCylinder(6, 6, 6, 16, stone, 0, 15, 4);
        // Large dome (top hemisphere)
        addSphere(7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2, stone, 0, 18, 4);
        // Golden lantern
        addCylinder(1.5, 1.5, 4, 12, 0xFFD700, 0, 25, 4);
    }

    function buildGherkin() {
        var glass = 0x87CEEB;
        var dark = 0x1A3A4A;
        var baseX = 80;
        var baseZ = -60;
        var widths = [8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2];
        var numFloors = widths.length;
        var floorH = 28 / numFloors;
        for (var i = 0; i < numFloors; i++) {
            var w = widths[i];
            var y = floorH / 2 + i * floorH;
            addBox(w, floorH, w, glass, baseX, y, baseZ);
        }
        // Diagonal stripe accents
        for (var j = 0; j < 6; j++) {
            var sw = widths[j * 2] * 0.3;
            var sy = floorH / 2 + j * 2 * floorH;
            addBox(sw, floorH * 0.4, sw, dark, baseX, sy, baseZ);
        }
    }

    function buildWalkieTalkie() {
        var glass = 0x87CEEB;
        var baseX = 100;
        var baseZ = -20;
        // Lower section
        addBox(10, 15, 10, glass, baseX, 7.5, baseZ);
        // Upper section (wider, bulging)
        addBox(14, 10, 14, glass, baseX, 20, baseZ);
    }

    function buildCheesegrater() {
        var steel = 0xC0C0C0;
        var baseX = 90;
        var baseZ = -40;
        var numFloors = 12;
        var floorH = 30 / numFloors;
        for (var i = 0; i < numFloors; i++) {
            var w = 12 - i * (10 / numFloors);
            if (w < 2) { w = 2; }
            var y = floorH / 2 + i * floorH;
            var offsetX = -i * (10 / numFloors) * 0.3;
            addBox(w, floorH, 8, steel, baseX + offsetX, y, baseZ);
        }
    }

    function buildBankOfEngland() {
        var stone = 0xFAFAF0;
        var baseX = 50;
        var baseZ = -30;
        // Main fortress building
        addBox(20, 8, 20, stone, baseX, 4, baseZ);
        // Facade columns (decorative boxes)
        for (var i = 0; i < 5; i++) {
            addBox(1, 9, 1, stone, baseX - 8 + i * 4, 4.5, baseZ - 10);
        }
        // Parapet / top trim
        addBox(22, 1, 22, stone, baseX, 8.5, baseZ);
    }

    function buildMillenniumBridge() {
        var silver = 0xC0C0C0;
        // Bridge deck from St Paul's side to Tate Modern side
        // St Paul's is near 0,0; Tate Modern is at ~-30, 60 in local coords
        var bridgeX = -20;
        var bridgeZ = 30;
        // Main deck
        addBox(40, 0.5, 3, silver, bridgeX, 2, bridgeZ);
        // Support arch trusses
        addBox(36, 1, 1, silver, bridgeX, 1.5, bridgeZ - 1);
        addBox(36, 1, 1, silver, bridgeX, 1.5, bridgeZ + 1);
        // Truss verticals
        for (var i = 0; i < 6; i++) {
            addBox(0.5, 2, 0.5, silver, bridgeX - 15 + i * 6, 1, bridgeZ - 1);
            addBox(0.5, 2, 0.5, silver, bridgeX - 15 + i * 6, 1, bridgeZ + 1);
        }
    }

    function buildTateModern() {
        var brick = 0x8B4513;
        var baseX = -30;
        var baseZ = 60;
        // Main gallery building
        addBox(30, 10, 12, brick, baseX, 5, baseZ);
        // Chimney
        addCylinder(3, 3, 30, 12, 0x5C3317, baseX, 15, baseZ);
        // Turbine hall roof extension
        addBox(30, 3, 4, brick, baseX, 12, baseZ - 8);
    }

    function buildMonument() {
        var portlandBase = 0xD2B48C;
        var baseX = 70;
        var baseZ = -10;
        // Base pedestal
        addBox(4, 3, 4, portlandBase, baseX, 1.5, baseZ);
        // Column
        addCylinder(1, 1, 28, 12, portlandBase, baseX, 17, baseZ);
        // Flame top
        addCone(1.5, 4, 8, 0xFFD700, baseX, 33, baseZ);
    }

    function buildLloyds() {
        var steel = 0xC0C0C0;
        var baseX = 75;
        var baseZ = -50;
        // Main body
        addBox(12, 20, 12, steel, baseX, 10, baseZ);
        // External service ducts (pipes) on exterior faces
        addCylinder(0.6, 0.6, 20, 8, 0x909090, baseX + 7, 10, baseZ);
        addCylinder(0.6, 0.6, 20, 8, 0x909090, baseX - 7, 10, baseZ);
        addCylinder(0.6, 0.6, 20, 8, 0x909090, baseX, 10, baseZ + 7);
        addCylinder(0.6, 0.6, 20, 8, 0x909090, baseX, 10, baseZ - 7);
        addCylinder(0.6, 0.6, 20, 8, 0x909090, baseX + 5, 10, baseZ + 7);
        addCylinder(0.6, 0.6, 20, 8, 0x909090, baseX - 5, 10, baseZ - 7);
    }

    function buildBarbican() {
        var concrete = 0x808080;
        var baseX = -50;
        var baseZ = -70;
        // Three tall residential towers
        addBox(8, 25, 8, concrete, baseX - 12, 12.5, baseZ);
        addBox(8, 25, 8, concrete, baseX, 12.5, baseZ + 10);
        addBox(8, 25, 8, concrete, baseX + 12, 12.5, baseZ - 5);
        // Elevated walkways connecting towers
        addBox(16, 1, 2, concrete, baseX - 6, 8, baseZ + 1);
        addBox(16, 1, 2, concrete, baseX + 6, 8, baseZ + 2);
        // Podium base
        addBox(36, 4, 30, concrete, baseX, 2, baseZ);
    }

    function buildGroundPlane() {
        // City streets and plazas using flat box slabs
        var asphalt = 0x444444;
        var pavement = 0x999988;
        // Main plaza around St Paul's
        addBox(80, 0.3, 80, pavement, 0, 0.15, 0);
        // Financial district floor
        addBox(120, 0.3, 120, asphalt, 80, 0.15, -40);
        // South bank area
        addBox(80, 0.3, 60, pavement, -20, 0.15, 50);
        // Thames riverbed (dark water suggestion)
        addBox(200, 0.2, 30, 0x1A3A6A, 0, -0.1, 45);
    }

    function buildStreetDetail() {
        var lamp = 0x333333;
        var base = 0x666666;
        // Street lamps along main road
        for (var i = 0; i < 8; i++) {
            addBox(0.3, 5, 0.3, lamp, -30 + i * 10, 2.5, -5);
            addBox(0.8, 0.3, 0.8, base, -30 + i * 10, 0.15, -5);
        }
        // Some smaller generic city blocks
        addBox(8, 6, 8, 0xAA9988, -40, 3, -20);
        addBox(10, 7, 6, 0xBBAA99, -55, 3.5, -10);
        addBox(6, 9, 10, 0xCCBBAA, -40, 4.5, -40);
        addBox(12, 5, 8, 0x998877, -60, 2.5, -60);
        addBox(7, 8, 7, 0xAABBAA, 30, 4, 20);
        addBox(9, 6, 9, 0xBBAA88, 20, 3, 30);
    }

    function init(sceneRef) {
        scene = sceneRef;
        objects = [];

        buildGroundPlane();
        buildStPauls();
        buildGherkin();
        buildWalkieTalkie();
        buildCheesegrater();
        buildBankOfEngland();
        buildMillenniumBridge();
        buildTateModern();
        buildMonument();
        buildLloyds();
        buildBarbican();
        buildStreetDetail();
    }

    function update(delta) {
        // Static environment — no animation needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
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
