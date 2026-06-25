window.PeakDistrict = (function() {
    'use strict';

    var WORLD_X = 2890;
    var WORLD_Z = 2200;

    function createMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function createBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function createCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function createSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function createCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = createMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildKinderScout(group) {
        var ox = WORLD_X - 120;
        var oz = WORLD_Z - 80;
        // Base plateau — large dark gritstone moorland
        group.add(createBox(200, 8, 140, 0x4A3A2A, ox, 4, oz));
        // Stacked gritstone slabs
        group.add(createBox(60, 6, 40, 0x4A3A2A, ox - 50, 11, oz - 10));
        group.add(createBox(40, 5, 30, 0x3A2A1A, ox - 52, 18, oz - 12));
        group.add(createBox(25, 4, 20, 0x4A3A2A, ox - 54, 24, oz - 14));
        // Rock outcrops on plateau
        group.add(createBox(15, 5, 10, 0x3A2A1A, ox + 20, 11, oz + 10));
        group.add(createBox(10, 4, 8, 0x4A3A2A, ox + 40, 11, oz - 20));
        group.add(createBox(12, 6, 9, 0x3A2A1A, ox - 20, 11, oz + 30));
        group.add(createBox(8, 3, 6, 0x4A3A2A, ox + 60, 11, oz + 15));
        group.add(createBox(20, 4, 14, 0x3A2A1A, ox + 10, 11, oz - 40));
        // Moorland heather mounds (dark purple-brown)
        group.add(createBox(30, 2, 20, 0x5A3A4A, ox + 30, 9, oz + 20));
        group.add(createBox(25, 2, 18, 0x5A3A4A, ox - 30, 9, oz - 25));
        group.add(createBox(20, 2, 15, 0x4A2A3A, ox + 50, 9, oz - 10));
    }

    function buildChatsworthHouse(group) {
        var ox = WORLD_X + 60;
        var oz = WORLD_Z - 20;
        // Main house body
        group.add(createBox(40, 14, 20, 0xD4D0A8, ox, 7, oz));
        // Wings
        group.add(createBox(12, 10, 16, 0xD4D0A8, ox - 26, 5, oz));
        group.add(createBox(12, 10, 16, 0xD4D0A8, ox + 26, 5, oz));
        // Roof line features
        group.add(createBox(38, 2, 4, 0xC4C09A, ox, 15, oz - 8));
        group.add(createBox(38, 2, 4, 0xC4C09A, ox, 15, oz + 8));
        // Chimneys
        group.add(createBox(2, 6, 2, 0xB4B090, ox - 14, 20, oz - 8));
        group.add(createBox(2, 6, 2, 0xB4B090, ox + 14, 20, oz - 8));
        group.add(createBox(2, 6, 2, 0xB4B090, ox - 14, 20, oz + 8));
        group.add(createBox(2, 6, 2, 0xB4B090, ox + 14, 20, oz + 8));
        // Fountain jet — central cylinder for water spout
        group.add(createCylinder(0.3, 0.5, 18, 6, 0xAADDEE, ox, 16, oz + 30));
        group.add(createCylinder(3, 3, 0.5, 12, 0x8899AA, ox, 0.25, oz + 30));
        // Parkland trees
        var treePositions = [
            [ox - 30, oz + 20],
            [ox - 40, oz + 35],
            [ox - 25, oz + 45],
            [ox + 30, oz + 20],
            [ox + 45, oz + 30],
            [ox + 35, oz + 45],
            [ox - 55, oz - 10],
            [ox + 55, oz - 10]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0];
            var tz = treePositions[t][1];
            group.add(createCylinder(0.4, 0.6, 5, 6, 0x5A3A1A, tx, 2.5, tz));
            group.add(createSphere(3, 7, 6, 0x2A5A1A, tx, 8, tz));
        }
        // River Derwent — flat blue box
        group.add(createBox(80, 0.4, 8, 0x2A6A9A, ox - 20, 0.2, oz + 60));
        // Bridge over river
        group.add(createBox(12, 1.5, 8, 0xD4D0A8, ox, 1.0, oz + 60));
        group.add(createBox(1.5, 4, 8, 0xC4C09A, ox - 5, 2, oz + 60));
        group.add(createBox(1.5, 4, 8, 0xC4C09A, ox + 5, 2, oz + 60));
    }

    function buildPeverilCastle(group) {
        var ox = WORLD_X + 180;
        var oz = WORLD_Z + 100;
        // Sheer cliff base
        group.add(createBox(30, 28, 24, 0x4A4A4A, ox, 14, oz));
        // Castle keep
        group.add(createBox(8, 12, 6, 0x9A8A78, ox, 40, oz));
        // Battlements
        group.add(createBox(8, 2, 1, 0x9A8A78, ox, 48, oz - 2.5));
        group.add(createBox(8, 2, 1, 0x9A8A78, ox, 48, oz + 2.5));
        group.add(createBox(1, 2, 6, 0x9A8A78, ox - 3.5, 48, oz));
        group.add(createBox(1, 2, 6, 0x9A8A78, ox + 3.5, 48, oz));
        // Merlon gaps (darker boxes for shadow effect)
        group.add(createBox(2, 1.5, 1, 0x7A6A58, ox - 2, 48.5, oz - 2.5));
        group.add(createBox(2, 1.5, 1, 0x7A6A58, ox + 2, 48.5, oz - 2.5));
        // Curtain wall
        group.add(createBox(20, 6, 2, 0x9A8A78, ox - 12, 33, oz - 3));
        group.add(createBox(2, 6, 18, 0x9A8A78, ox - 21, 33, oz + 6));
        // Gate tower
        group.add(createBox(5, 8, 5, 0x8A7A68, ox - 21, 37, oz - 5));
    }

    function buildBlueJohnCavern(group) {
        var ox = WORLD_X + 150;
        var oz = WORLD_Z - 120;
        // Hillside around cavern
        group.add(createBox(40, 20, 35, 0x5A4A3A, ox, 10, oz));
        // Dark overhang above cave entrance
        group.add(createBox(14, 6, 4, 0x2A2A2A, ox - 2, 12, oz - 15));
        // Cave opening — recessed dark box
        group.add(createBox(8, 7, 6, 0x1A1A1A, ox - 2, 7, oz - 14));
        // Fluorite crystal cluster — purple spheres of various sizes
        group.add(createSphere(1.8, 7, 6, 0x8A5A9A, ox - 4, 3, oz - 12));
        group.add(createSphere(1.2, 7, 6, 0x9A6AAA, ox - 1, 2.5, oz - 11));
        group.add(createSphere(2.2, 7, 6, 0x7A4A8A, ox + 2, 4, oz - 11));
        group.add(createSphere(1.0, 7, 6, 0xAA7ABB, ox - 5, 2, oz - 10));
        group.add(createSphere(1.5, 7, 6, 0x8A5A9A, ox + 4, 3, oz - 10));
        group.add(createSphere(0.8, 6, 5, 0x9A6AAA, ox + 1, 2, oz - 13));
        group.add(createSphere(1.3, 7, 6, 0x7A4A8A, ox - 3, 5, oz - 9));
    }

    function buildDoveDaleStepping(group) {
        var ox = WORLD_X - 50;
        var oz = WORLD_Z + 150;
        // Stream — clear water
        group.add(createBox(6, 0.4, 80, 0x2A8AAA, ox, 0.2, oz));
        // Stepping stones across the stream
        var numStones = 10;
        for (var s = 0; s < numStones; s++) {
            var stoneZ = oz - 35 + s * 7;
            group.add(createBox(2.5, 0.5, 1.8, 0x9A8A78, ox, 0.5, stoneZ));
        }
        // Limestone valley sides
        group.add(createBox(6, 18, 80, 0xB0A898, ox - 10, 9, oz));
        group.add(createBox(6, 22, 80, 0xA09888, ox + 10, 11, oz));
        // Rock formations at valley sides
        group.add(createBox(4, 8, 6, 0x9A8878, ox - 12, 22, oz - 20));
        group.add(createBox(3, 6, 5, 0x9A8878, ox + 11, 24, oz + 15));
        group.add(createBox(5, 10, 4, 0x8A7868, ox - 12, 26, oz + 10));
    }

    function buildMamTor(group) {
        var ox = WORLD_X + 30;
        var oz = WORLD_Z + 220;
        // Main hill mass
        group.add(createBox(60, 30, 50, 0x6A5A48, ox, 15, oz));
        // Landslip cliff face — crumbling layers
        group.add(createBox(50, 22, 8, 0x5A4A3A, ox, 20, oz - 28));
        group.add(createBox(44, 16, 6, 0x4A3A2A, ox - 2, 22, oz - 30));
        group.add(createBox(38, 10, 5, 0x5A4A3A, ox + 1, 24, oz - 32));
        // Debris scatter at base of landslip
        var debrisPos = [
            [ox - 20, oz - 38, 6, 2, 4],
            [ox - 10, oz - 40, 4, 1.5, 3],
            [ox, oz - 42, 5, 1.8, 5],
            [ox + 12, oz - 39, 3, 1.2, 3],
            [ox + 22, oz - 37, 7, 2, 4],
            [ox - 25, oz - 44, 4, 1, 3],
            [ox + 18, oz - 45, 6, 1.5, 5],
            [ox - 5, oz - 46, 3, 1, 2],
            [ox + 8, oz - 43, 5, 1.6, 4],
            [ox - 15, oz - 41, 4, 1.3, 3]
        ];
        for (var d = 0; d < debrisPos.length; d++) {
            var dx = debrisPos[d][0];
            var dz = debrisPos[d][1];
            var dw = debrisPos[d][2];
            var dh = debrisPos[d][3];
            var dd = debrisPos[d][4];
            group.add(createBox(dw, dh, dd, 0x5A4A3A, dx, dh / 2, dz));
        }
        // Shivering Mountain summit
        group.add(createBox(20, 6, 18, 0x6A5A48, ox, 33, oz));
        group.add(createCone(8, 8, 6, 0x5A4A3A, ox, 40, oz));
        // Trig point
        group.add(createCylinder(0.4, 0.6, 2, 5, 0xCCCCCC, ox, 45, oz));
    }

    function init(scene) {
        var group = new THREE.Group();

        buildKinderScout(group);
        buildChatsworthHouse(group);
        buildPeverilCastle(group);
        buildBlueJohnCavern(group);
        buildDoveDaleStepping(group);
        buildMamTor(group);

        scene.add(group);
        return group;
    }

    return {
        init: init
    };
}());
