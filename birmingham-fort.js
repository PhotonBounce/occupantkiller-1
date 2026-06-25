window.BirminghamFort = (function() {
    'use strict';

    var WX = 3040;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z, scene) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z, scene) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z, scene) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z, scene) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function buildBTTower(scene) {
        // Main shaft — slender cylinder
        makeCylinder(2, 2, 35, 16, 0x7A7A7A, -60, 17.5, -40, scene);
        // Disc platform box
        makeBox(8, 1.5, 8, 0x6A6A6A, -60, 36, -40, scene);
        // Observation deck
        makeBox(6, 2, 6, 0x8A8A8A, -60, 38, -40, scene);
        // Top mast
        makeCylinder(0.2, 0.2, 6, 8, 0x555555, -60, 43.5, -40, scene);
        // Antenna ball
        makeSphere(0.4, 6, 6, 0x444444, -60, 47, -40, scene);
    }

    function buildCustardFactory(scene) {
        // Main factory building
        makeBox(20, 10, 12, 0xD4A97A, -20, 5, 30, scene);
        // Cadbury-yellow chimney
        makeCylinder(1.2, 1.5, 18, 12, 0xFFD700, -12, 14, 28, scene);
        // Second chimney
        makeCylinder(1.0, 1.2, 14, 12, 0xFFD700, -14, 12, 32, scene);
        // Clock tower box
        makeBox(4, 16, 4, 0xC49060, -22, 13, 30, scene);
        // Clock tower top
        makeCone(2.5, 3, 4, 0x8B6040, -22, 22, 30, scene);
        // Factory wing
        makeBox(12, 8, 10, 0xC89060, -8, 4, 26, scene);
        // Entrance arch box
        makeBox(4, 5, 2, 0xB88050, -20, 2.5, 24, scene);
        // Window boxes decorative
        makeBox(18, 1, 10, 0xE0B888, -20, 10.5, 30, scene);
    }

    function buildSelfridges(scene) {
        // Main body — distinctive blob-like building
        makeBox(18, 12, 14, 0x6A6A8A, 10, 6, -10, scene);
        // Upper section
        makeBox(14, 6, 10, 0x7070A0, 10, 15, -10, scene);
        // Curved base section
        makeBox(20, 4, 16, 0x606080, 10, 2, -10, scene);

        // Disc cladding — 100+ small spheres covering the facade
        var discColor = 0x8888AA;
        var ox = 10;
        var oz = -10;
        var discR = 0.7;
        var discSegs = 6;
        var col, row, layer;
        // Front face discs
        for (row = 0; row < 8; row++) {
            for (col = 0; col < 12; col++) {
                makeSphere(discR, discSegs, discSegs, discColor,
                    ox - 8.5 + col * 1.6, 1.5 + row * 1.6, oz - 7.5, scene);
            }
        }
        // Back face discs
        for (row = 0; row < 8; row++) {
            for (col = 0; col < 12; col++) {
                makeSphere(discR, discSegs, discSegs, discColor,
                    ox - 8.5 + col * 1.6, 1.5 + row * 1.6, oz + 7.5, scene);
            }
        }
        // Side face discs (left)
        for (row = 0; row < 6; row++) {
            for (layer = 0; layer < 5; layer++) {
                makeSphere(discR, discSegs, discSegs, discColor,
                    ox - 9.5, 1.5 + row * 1.6, oz - 5 + layer * 2.5, scene);
            }
        }
        // Side face discs (right)
        for (row = 0; row < 6; row++) {
            for (layer = 0; layer < 5; layer++) {
                makeSphere(discR, discSegs, discSegs, discColor,
                    ox + 9.5, 1.5 + row * 1.6, oz - 5 + layer * 2.5, scene);
            }
        }
        // Top discs
        for (col = 0; col < 6; col++) {
            for (layer = 0; layer < 4; layer++) {
                makeSphere(discR, discSegs, discSegs, discColor,
                    ox - 4.5 + col * 1.6, 18.5, oz - 4.5 + layer * 3, scene);
            }
        }
    }

    function buildBirminghamCathedral(scene) {
        // Main nave body
        makeBox(20, 12, 10, 0xD4D0C0, 40, 6, 10, scene);
        // Chancel
        makeBox(8, 10, 8, 0xCCCCB8, 52, 5, 10, scene);
        // West tower left
        makeBox(4, 16, 4, 0xD0CCC0, 31, 8, 7, scene);
        // West tower right
        makeBox(4, 16, 4, 0xD0CCC0, 31, 8, 13, scene);
        // Tower tops — cones
        makeCone(2.5, 4, 4, 0xB8B4A8, 31, 18, 7, scene);
        makeCone(2.5, 4, 4, 0xB8B4A8, 31, 18, 13, scene);
        // Columns — cylinders along the facade
        makeCylinder(0.5, 0.5, 10, 8, 0xC8C4B8, 33, 5, 6, scene);
        makeCylinder(0.5, 0.5, 10, 8, 0xC8C4B8, 33, 5, 9, scene);
        makeCylinder(0.5, 0.5, 10, 8, 0xC8C4B8, 33, 5, 11, scene);
        makeCylinder(0.5, 0.5, 10, 8, 0xC8C4B8, 33, 5, 14, scene);
        // Dome — sphere on pendentive box
        makeBox(6, 2, 6, 0xD0CCC0, 40, 12, 10, scene);
        makeSphere(3.5, 16, 16, 0xD8D4C8, 40, 16, 10, scene);
        // Dome lantern
        makeCylinder(0.8, 0.8, 2, 8, 0xC8C4B8, 40, 20.5, 10, scene);
        makeSphere(1.0, 8, 8, 0xD0CCC0, 40, 22.5, 10, scene);
        // Portico roof
        makeBox(8, 1, 10, 0xCCC8BC, 33.5, 10.5, 10, scene);
    }

    function buildSpaghettiJunction(scene) {
        // Main elevated decks — 5 crossing boxes at different heights
        makeBox(60, 1.5, 8, 0x9E9E9E, 0, 8, -70, scene);
        makeBox(8, 1.5, 60, 0x9E9E9E, 20, 10, -90, scene);
        makeBox(50, 1.5, 7, 0x9E9E9E, 5, 12, -80, scene);
        makeBox(7, 1.5, 50, 0x9E9E9E, -10, 14, -75, scene);
        makeBox(45, 1.5, 6, 0x9E9E9E, -5, 6, -65, scene);

        // Ramp connector boxes
        makeBox(10, 1.5, 6, 0xA8A8A8, -20, 7, -72, scene);
        makeBox(6, 1.5, 10, 0xA8A8A8, 25, 9, -85, scene);

        // Cylinder pier supports beneath decks
        makeCylinder(0.8, 0.8, 8, 8, 0x888888, -20, 4, -70, scene);
        makeCylinder(0.8, 0.8, 8, 8, 0x888888, 0, 4, -70, scene);
        makeCylinder(0.8, 0.8, 8, 8, 0x888888, 20, 4, -70, scene);
        makeCylinder(0.8, 0.8, 10, 8, 0x888888, 20, 5, -90, scene);
        makeCylinder(0.8, 0.8, 10, 8, 0x888888, 20, 5, -70, scene);
        makeCylinder(0.8, 0.8, 12, 8, 0x888888, 5, 6, -80, scene);
        makeCylinder(0.8, 0.8, 12, 8, 0x888888, 15, 6, -80, scene);
        makeCylinder(0.8, 0.8, 14, 8, 0x888888, -10, 7, -75, scene);
        makeCylinder(0.8, 0.8, 14, 8, 0x888888, -10, 7, -55, scene);
        makeCylinder(0.8, 0.8, 6, 8, 0x888888, -15, 3, -65, scene);
        makeCylinder(0.8, 0.8, 6, 8, 0x888888, 5, 3, -65, scene);

        // Barrier boxes along edges
        makeBox(60, 0.5, 0.5, 0x808080, 0, 8.75, -66, scene);
        makeBox(60, 0.5, 0.5, 0x808080, 0, 8.75, -74, scene);
    }

    function buildGasStreetBasin(scene) {
        // Canal water — water boxes at ground level
        makeBox(30, 0.5, 12, 0x1A6B8A, -40, 0.25, 60, scene);
        makeBox(12, 0.5, 20, 0x1A6B8A, -30, 0.25, 74, scene);
        makeBox(20, 0.5, 8, 0x1A6B8A, -50, 0.25, 55, scene);
        makeBox(10, 0.5, 30, 0x1A6B8A, -44, 0.25, 78, scene);

        // Towpath / bank surrounds
        makeBox(32, 0.4, 2, 0x8B7355, -40, 0.2, 67, scene);
        makeBox(32, 0.4, 2, 0x8B7355, -40, 0.2, 53, scene);

        // Narrowboat 1
        makeBox(7, 1.2, 2, 0xC03030, -46, 1, 58, scene);
        makeBox(5, 1.5, 1.6, 0xA02020, -46, 1.85, 58, scene);
        makeCylinder(0.3, 0.3, 2.5, 6, 0x404040, -44, 2.25, 58, scene);

        // Narrowboat 2
        makeBox(7, 1.2, 2, 0x207020, -36, 1, 64, scene);
        makeBox(5, 1.5, 1.6, 0x185018, -36, 1.85, 64, scene);
        makeCylinder(0.3, 0.3, 2.5, 6, 0x404040, -34, 2.25, 64, scene);

        // Narrowboat 3
        makeBox(7, 1.2, 2, 0x2040B0, -34, 1, 57, scene);
        makeBox(5, 1.5, 1.6, 0x183090, -34, 1.85, 57, scene);
        makeCylinder(0.3, 0.3, 2.5, 6, 0x404040, -32, 2.25, 57, scene);

        // Narrowboat 4
        makeBox(7, 1.2, 2, 0xB07010, -40, 1, 63, scene);
        makeBox(5, 1.5, 1.6, 0x906010, -40, 1.85, 63, scene);
        makeCylinder(0.3, 0.3, 2.5, 6, 0x404040, -38, 2.25, 63, scene);

        // Victorian canal buildings
        makeBox(10, 8, 8, 0x8B6050, -55, 4, 58, scene);
        makeBox(8, 10, 7, 0x7A5040, -55, 5, 68, scene);
        // Chimney on building
        makeCylinder(0.6, 0.8, 6, 8, 0x5A4030, -52, 11, 58, scene);
        makeCylinder(0.6, 0.8, 8, 8, 0x5A4030, -52, 13, 68, scene);
        // Arched warehouse box
        makeBox(14, 6, 10, 0x9A7060, -50, 3, 75, scene);
        makeBox(12, 1, 8, 0x8A6050, -50, 6.5, 75, scene);
        // Lock gate boxes
        makeBox(1, 3, 12, 0x5A4020, -25, 1.5, 68, scene);
        makeBox(1, 3, 12, 0x5A4020, -23, 1.5, 68, scene);
    }

    function buildGroundAndRoads(scene) {
        // Ground base
        makeBox(200, 1, 200, 0x3A3A3A, 0, -0.5, 0, scene);
        // Main road boxes
        makeBox(80, 0.2, 6, 0x2A2A2A, 0, 0.1, 0, scene);
        makeBox(6, 0.2, 80, 0x2A2A2A, 0, 0.1, 0, scene);
        // Road markings
        makeBox(60, 0.05, 0.4, 0xFFFFFF, 0, 0.15, 0, scene);
        makeBox(0.4, 0.05, 60, 0xFFFFFF, 0, 0.15, 0, scene);
    }

    function buildEdgeMarkers(scene) {
        // Corner markers for navigation reference
        makeCone(1, 4, 4, 0xFF4444, -90, 2, -90, scene);
        makeCone(1, 4, 4, 0xFF4444, 90, 2, -90, scene);
        makeCone(1, 4, 4, 0xFF4444, -90, 2, 90, scene);
        makeCone(1, 4, 4, 0xFF4444, 90, 2, 90, scene);
    }

    function build(scene) {
        buildGroundAndRoads(scene);
        buildBTTower(scene);
        buildCustardFactory(scene);
        buildSelfridges(scene);
        buildBirminghamCathedral(scene);
        buildSpaghettiJunction(scene);
        buildGasStreetBasin(scene);
        buildEdgeMarkers(scene);
    }

    return {
        build: build,
        worldX: WX,
        worldZ: WZ,
        name: 'BirminghamFort'
    };
}());
