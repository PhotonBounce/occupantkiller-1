window.RyeMarsh = (function() {
    'use strict';

    var scene = null;
    var objects = [];
    var OFFSET_X = 4240;
    var OFFSET_Z = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildHill() {
        // Base of hill — wide low blocks
        makeBox(60, 2, 60, 0x8B7355, 0, 1, 0);
        makeBox(48, 2, 48, 0x8B7355, 0, 3, 0);
        makeBox(36, 2, 36, 0x9C8060, 0, 5, 0);
        makeBox(26, 2, 26, 0x9C8060, 0, 7, 0);
        makeBox(18, 2, 18, 0xA08B6A, 0, 9, 0);
        // Central peak
        makeBox(10, 2, 10, 0xA08B6A, 0, 11, 0);
    }

    function buildYpresTower() {
        // Main tower body 6x14x6 sandstone-grey
        makeBox(6, 14, 6, 0x888888, -18, 17, -8);
        // Battlements — row of merlons on top
        makeBox(2, 2, 2, 0x888888, -20, 25, -10);
        makeBox(2, 2, 2, 0x888888, -18, 25, -10);
        makeBox(2, 2, 2, 0x888888, -16, 25, -10);
        makeBox(2, 2, 2, 0x888888, -20, 25, -6);
        makeBox(2, 2, 2, 0x888888, -16, 25, -6);
        makeBox(2, 2, 2, 0x888888, -20, 25, -8);
        makeBox(2, 2, 2, 0x888888, -16, 25, -8);
        // Gateway arch base
        makeBox(3, 4, 1, 0x888888, -18, 14, -5);
    }

    function buildStMarysChurch() {
        // Nave
        makeBox(14, 8, 8, 0xD2B48C, 4, 16, -6);
        // Chancel
        makeBox(6, 6, 6, 0xD2B48C, 13, 15, -6);
        // Tower 6x18x6
        makeBox(6, 18, 6, 0xD2B48C, -3, 21, -6);
        // Spire on tower
        makeCone(3, 8, 4, 0xC4A882, -3, 31, -6);
        // Buttresses
        makeBox(2, 8, 2, 0xC8A87C, 0, 16, -10);
        makeBox(2, 8, 2, 0xC8A87C, 8, 16, -10);
        makeBox(2, 8, 2, 0xC8A87C, 0, 16, -2);
        makeBox(2, 8, 2, 0xC8A87C, 8, 16, -2);
        // Clock face marker on tower (Quarter Boys)
        makeBox(2, 2, 1, 0xF0E68C, -3, 27, -3);
    }

    function buildMermaidStreet() {
        var i;
        // Row of timber-framed houses along cobbled street
        for (i = 0; i < 6; i++) {
            // White plaster infill
            makeBox(5, 8, 5, 0xFFF8DC, 20 + i * 7, 16, -12);
            // Dark timber framing overlay — front face
            makeBox(5, 1, 1, 0x2F1B0A, 20 + i * 7, 20, -10);
            makeBox(5, 1, 1, 0x2F1B0A, 20 + i * 7, 17, -10);
            makeBox(1, 8, 1, 0x2F1B0A, 17 + i * 7, 16, -10);
            makeBox(1, 8, 1, 0x2F1B0A, 23 + i * 7, 16, -10);
            // Roof
            makeBox(5, 2, 5, 0x5C3D1A, 20 + i * 7, 21, -12);
        }
        // Cobbled street surface
        makeBox(45, 1, 4, 0x8B7D6B, 37, 12, -16);
    }

    function buildRyeHarbour() {
        // Harbour water
        makeBox(40, 1, 20, 0x4169E1, 10, 10, 35);
        // Harbour walls
        makeBox(40, 3, 2, 0x808080, 10, 11, 25);
        makeBox(2, 3, 20, 0x808080, -10, 11, 35);
        makeBox(2, 3, 20, 0x808080, 30, 11, 35);
        // Fishing boat 1
        makeBox(6, 2, 2, 0xA0522D, -2, 12, 30);
        makeBox(1, 4, 1, 0x8B4513, -2, 15, 30);
        // Fishing boat 2
        makeBox(5, 2, 2, 0x8B6914, 12, 12, 38);
        makeBox(1, 3, 1, 0x6B4423, 12, 15, 38);
        // Fishing boat 3
        makeBox(4, 2, 2, 0xCD853F, 22, 12, 32);
    }

    function buildRomneyMarsh() {
        // Flat marsh ground — muted green
        makeBox(80, 1, 30, 0x6B8E6B, 60, 10, 60);
        // Drainage ditches running east-west
        makeBox(80, 1, 1, 0x4169E1, 60, 10, 50);
        makeBox(80, 1, 1, 0x4169E1, 60, 10, 55);
        makeBox(80, 1, 1, 0x4169E1, 60, 10, 65);
        makeBox(80, 1, 1, 0x4169E1, 60, 10, 70);
        makeBox(80, 1, 1, 0x4169E1, 60, 10, 75);
        // Drainage ditches running north-south
        makeBox(1, 1, 30, 0x4169E1, 30, 10, 60);
        makeBox(1, 1, 30, 0x4169E1, 50, 10, 60);
        makeBox(1, 1, 30, 0x4169E1, 70, 10, 60);
        makeBox(1, 1, 30, 0x4169E1, 90, 10, 60);
        makeBox(1, 1, 30, 0x4169E1, 110, 10, 60);
        // Marsh vegetation clumps (dark tufts)
        makeBox(3, 2, 3, 0x4A7C59, 25, 11, 52);
        makeBox(3, 2, 3, 0x4A7C59, 45, 11, 63);
        makeBox(3, 2, 3, 0x4A7C59, 75, 11, 58);
        makeBox(3, 2, 3, 0x4A7C59, 95, 11, 68);
    }

    function buildDungeness() {
        // Shingle headland base
        makeBox(50, 1, 30, 0xB8A898, 120, 10, 70);
        // Reactor building 1
        makeBox(12, 18, 12, 0x808080, 118, 19, 72);
        // Reactor building 2
        makeBox(12, 18, 12, 0x808080, 136, 19, 72);
        // Chimney stack
        makeCylinder(2, 2, 28, 8, 0x707070, 128, 24, 80);
        // Secondary chimney
        makeCylinder(1.5, 1.5, 22, 8, 0x707070, 142, 21, 80);
        // Turbine hall
        makeBox(30, 10, 16, 0x909090, 128, 15, 62);
        // Security fence posts
        makeBox(1, 4, 1, 0x505050, 110, 12, 60);
        makeBox(1, 4, 1, 0x505050, 130, 12, 60);
        makeBox(1, 4, 1, 0x505050, 150, 12, 60);
        // Warning lights on reactor tops (red)
        makeBox(1, 1, 1, 0xFF0000, 118, 29, 72);
        makeBox(1, 1, 1, 0xFF0000, 136, 29, 72);
    }

    function buildRomneyRailway() {
        // Track — thin Box rails running through marsh
        makeBox(80, 1, 1, 0x5C5C5C, 60, 11, 57);
        // Sleepers
        var i;
        for (i = 0; i < 16; i++) {
            makeBox(3, 1, 2, 0x4A3728, 25 + i * 5, 11, 57);
        }
        // Miniature locomotive
        makeBox(4, 3, 2, 0x8B0000, 35, 13, 57);
        makeBox(3, 2, 2, 0x6B0000, 39, 12, 57);
        // Smoke stack on loco
        makeCylinder(0.5, 0.5, 2, 6, 0x333333, 36, 15, 57);
        // Passenger car 1
        makeBox(5, 2, 2, 0xDAA520, 28, 13, 57);
        // Passenger car 2
        makeBox(5, 2, 2, 0xDAA520, 22, 13, 57);
        // Passenger car 3
        makeBox(5, 2, 2, 0xCD853F, 16, 13, 57);
    }

    function buildMartellos() {
        // 4 Martello towers spaced along coast
        // Tower 1
        makeCylinder(5, 6, 8, 12, 0xFAFAF0, -30, 14, 45);
        makeBox(10, 2, 10, 0xE8E8DC, -30, 19, 45);
        // Tower 2
        makeCylinder(5, 6, 8, 12, 0xFAFAF0, 20, 14, 45);
        makeBox(10, 2, 10, 0xE8E8DC, 20, 19, 45);
        // Tower 3
        makeCylinder(5, 6, 8, 12, 0xFAFAF0, 70, 14, 45);
        makeBox(10, 2, 10, 0xE8E8DC, 70, 19, 45);
        // Tower 4
        makeCylinder(5, 6, 8, 12, 0xFAFAF0, 120, 14, 45);
        makeBox(10, 2, 10, 0xE8E8DC, 120, 19, 45);
    }

    function buildCamberCastle() {
        // Shingle base
        makeBox(30, 1, 30, 0xB8A898, -40, 10, 20);
        // Central circular tower
        makeCylinder(8, 8, 6, 16, 0xC8B89A, -40, 13, 20);
        // Parapet on central tower
        makeCylinder(8.5, 8.5, 2, 16, 0xB8A88A, -40, 17, 20);
        // 4 semicircular bastions around central tower
        makeCylinder(4, 4, 5, 8, 0xC8B89A, -40, 12, 8);
        makeCylinder(4, 4, 5, 8, 0xC8B89A, -40, 12, 32);
        makeCylinder(4, 4, 5, 8, 0xC8B89A, -52, 12, 20);
        makeCylinder(4, 4, 5, 8, 0xC8B89A, -28, 12, 20);
        // Gate passage
        makeBox(3, 4, 5, 0xA89878, -40, 12, 14);
    }

    function buildCoastalWater() {
        // Sea / Rother estuary
        makeBox(200, 1, 20, 0x2E5FA3, 0, 9, 40);
    }

    function buildTownWalls() {
        // Remnants of medieval town walls around Rye hill
        makeBox(40, 4, 2, 0x888888, 0, 13, -22);
        makeBox(2, 4, 30, 0x888888, -20, 13, -8);
        makeBox(2, 4, 30, 0x888888, 20, 13, -8);
        // Wall towers at corners
        makeBox(4, 6, 4, 0x888888, -20, 15, -22);
        makeBox(4, 6, 4, 0x888888, 20, 15, -22);
    }

    function buildLandgate() {
        // Medieval gate archway into town
        makeBox(4, 10, 3, 0x888888, -8, 16, -22);
        makeBox(4, 10, 3, 0x888888, 2, 16, -22);
        // Arch top
        makeBox(10, 3, 3, 0x888888, -3, 22, -22);
        // Gate chamber
        makeBox(4, 8, 4, 0x777777, -3, 20, -22);
    }

    function buildWindmill() {
        // Old windmill near town
        makeCylinder(3, 4, 12, 8, 0xE8D8C0, -35, 18, -15);
        // Cap
        makeCone(3.5, 4, 8, 0x8B6914, -35, 26, -15);
        // Sails (4 rectangular boxes at angles)
        makeBox(1, 8, 1, 0xD2B48C, -35, 26, -15);
        makeBox(8, 1, 1, 0xD2B48C, -35, 26, -15);
    }

    function buildAnchorInn() {
        // Famous pub on cobbled street
        makeBox(7, 7, 5, 0xFFF8DC, 14, 15, -14);
        makeBox(7, 1, 5, 0x2F1B0A, 14, 19, -14);
        makeBox(1, 7, 5, 0x2F1B0A, 11, 15, -14);
        makeBox(1, 7, 5, 0x2F1B0A, 17, 15, -14);
        makeBox(7, 2, 5, 0x5C3D1A, 14, 20, -14);
        // Inn sign post
        makeBox(1, 5, 1, 0x4A3728, 11, 16, -12);
        makeBox(4, 1, 1, 0x8B6914, 12, 18, -12);
    }

    function init(sceneRef) {
        scene = sceneRef;
        objects = [];

        buildHill();
        buildTownWalls();
        buildLandgate();
        buildYpresTower();
        buildStMarysChurch();
        buildMermaidStreet();
        buildAnchorInn();
        buildWindmill();
        buildRyeHarbour();
        buildCoastalWater();
        buildRomneyMarsh();
        buildMartellos();
        buildCamberCastle();
        buildRomneyRailway();
        buildDungeness();
    }

    function update(delta) {
        // Static environment — no per-frame update needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
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
