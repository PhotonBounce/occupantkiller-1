window.NewcastleTyne = (function() {
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

    function addBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(x, y, z);
        scene.add(lines);
        objects.push(lines);
        return lines;
    }

    function buildRiver() {
        // River Tyne - blue water plane
        addBox(400, 0.5, 80, 0x1a4a7a, 15280, -1, 0);
    }

    function buildTyneBridge() {
        // Iconic green arch bridge - most famous of the seven
        var bx = 15280;
        var bz = -20;
        // Main arch - two pylons
        addBox(4, 40, 4, 0x2d5a1b, bx - 30, 20, bz);
        addBox(4, 40, 4, 0x2d5a1b, bx + 30, 20, bz);
        // Arch top horizontal
        addBox(60, 4, 4, 0x2d5a1b, bx, 42, bz);
        // Arch curve - approximate with angled boxes
        addBox(20, 4, 4, 0x2d5a1b, bx - 20, 36, bz);
        addBox(20, 4, 4, 0x2d5a1b, bx + 20, 36, bz);
        addBox(16, 4, 4, 0x2d5a1b, bx - 10, 28, bz);
        addBox(16, 4, 4, 0x2d5a1b, bx + 10, 28, bz);
        // Road deck
        addBox(62, 2, 10, 0x888888, bx, 10, bz);
        // Suspension cables (boxes)
        var i;
        for (i = -25; i <= 25; i += 5) {
            addBox(1, 32, 1, 0x2d5a1b, bx + i, 26, bz);
        }
        // Approach towers
        addBox(6, 20, 6, 0x555555, bx - 35, 10, bz);
        addBox(6, 20, 6, 0x555555, bx + 35, 10, bz);
    }

    function buildSwingBridge() {
        // Central rotating span - older bridge
        var bx = 15310;
        var bz = -10;
        // Abutments
        addBox(8, 8, 8, 0x8b7355, bx - 22, 4, bz);
        addBox(8, 8, 8, 0x8b7355, bx + 22, 4, bz);
        // Central pivot tower
        addCylinder(3, 3, 14, 8, 0x777777, bx, 7, bz);
        // Rotating deck spans
        addBox(40, 2, 8, 0x999988, bx, 10, bz);
        // Railings
        addBox(40, 3, 1, 0x666666, bx, 12, bz - 4);
        addBox(40, 3, 1, 0x666666, bx, 12, bz + 4);
        // Pivot cap
        addSphere(4, 6, 6, 0x888888, bx, 15, bz);
    }

    function buildHighLevelBridge() {
        // Double deck - railway above, road below (Robert Stephenson)
        var bx = 15255;
        var bz = -15;
        // Six arched piers in river
        var p;
        for (p = -25; p <= 25; p += 10) {
            addBox(4, 20, 8, 0x8b7355, bx + p, 10, bz);
            // Arch between piers
            if (p < 25) {
                addBox(8, 3, 3, 0x8b7355, bx + p + 5, 22, bz);
            }
        }
        // Lower road deck
        addBox(56, 2, 8, 0x777766, bx, 12, bz);
        // Upper railway deck
        addBox(56, 2, 8, 0x666655, bx, 20, bz);
        // Side truss girders
        addBox(56, 8, 2, 0x8b7355, bx, 16, bz - 5);
        addBox(56, 8, 2, 0x8b7355, bx, 16, bz + 5);
    }

    function buildMillenniumBridge() {
        // Tilting eye bridge - modern white
        var bx = 15340;
        var bz = -5;
        // Lower walkway deck (tilted position - letting ships through)
        var deck = addBox(54, 1.5, 6, 0xdddddd, bx, 14, bz);
        deck.rotation.z = 0.4;
        // Upper arch - tall single arc
        addBox(4, 32, 4, 0xeeeeee, bx - 22, 16, bz);
        addBox(4, 32, 4, 0xeeeeee, bx + 22, 16, bz);
        addBox(46, 4, 4, 0xeeeeee, bx, 34, bz);
        // Cable stays from arch to deck
        var c;
        for (c = -18; c <= 18; c += 6) {
            addBox(1, 22, 1, 0xffffff, bx + c, 24, bz);
        }
        // Abutments south and north
        addBox(10, 6, 10, 0xbbbbbb, bx - 30, 3, bz);
        addBox(10, 6, 10, 0xbbbbbb, bx + 30, 3, bz);
    }

    function buildQueenElizabethBridge() {
        // Modern concrete beam bridge
        var bx = 15370;
        var bz = -10;
        // Concrete piers
        addBox(3, 16, 6, 0xaaaaaa, bx - 20, 8, bz);
        addBox(3, 16, 6, 0xaaaaaa, bx, 8, bz);
        addBox(3, 16, 6, 0xaaaaaa, bx + 20, 8, bz);
        // Box girder deck
        addBox(42, 3, 10, 0xbbbbbb, bx, 17, bz);
        // Parapets
        addBox(42, 2, 1, 0xaaaaaa, bx, 19, bz - 5);
        addBox(42, 2, 1, 0xaaaaaa, bx, 19, bz + 5);
    }

    function buildKingEdwardBridge() {
        // Railway bridge - steel girder
        var bx = 15230;
        var bz = -12;
        // Steel piers
        addBox(3, 18, 3, 0x666655, bx - 18, 9, bz);
        addBox(3, 18, 3, 0x666655, bx + 18, 9, bz);
        // Main span truss
        addBox(38, 6, 8, 0x777766, bx, 20, bz);
        addBox(38, 2, 2, 0x555544, bx, 24, bz - 4);
        addBox(38, 2, 2, 0x555544, bx, 24, bz + 4);
        // Railway deck
        addBox(38, 2, 8, 0x888877, bx, 18, bz);
        // Approach spans
        addBox(20, 2, 8, 0x888877, bx - 29, 12, bz);
        addBox(20, 2, 8, 0x888877, bx + 29, 12, bz);
    }

    function buildMetroBridge() {
        // Tyne and Wear Metro bridge - light rail
        var bx = 15210;
        var bz = -8;
        // Concrete box piers
        addBox(4, 14, 4, 0x999999, bx - 15, 7, bz);
        addBox(4, 14, 4, 0x999999, bx + 15, 7, bz);
        // Box beam superstructure
        addBox(32, 4, 7, 0xaaaaaa, bx, 16, bz);
        // Metro track
        addBox(32, 1, 2, 0x555555, bx, 19, bz);
        // Overhead wire poles
        addBox(1, 10, 1, 0x888888, bx - 10, 25, bz);
        addBox(1, 10, 1, 0x888888, bx + 10, 25, bz);
        addBox(22, 1, 1, 0x888888, bx, 30, bz);
    }

    function buildAngelOfNorth() {
        // Massive rusty steel sculpture on hilltop south of Gateshead
        var ax = 15290;
        var az = 80;
        var hillY = 8;
        // Hilltop mound
        addBox(30, 6, 30, 0x5c4a2a, ax, hillY - 3, az);
        // Plinth/base
        addBox(8, 4, 8, 0x7a6040, ax, hillY + 2, az);
        // Torso - massive box body
        addBox(10, 22, 8, 0x8b4513, ax, hillY + 16, az);
        // Head block
        addBox(6, 6, 6, 0x8b4513, ax, hillY + 30, az);
        // Left wing - outstretched horizontal, angled slightly forward
        addBox(60, 3, 8, 0x8b4513, ax - 35, hillY + 20, az);
        // Right wing
        addBox(60, 3, 8, 0x8b4513, ax + 35, hillY + 20, az);
        // Wing tip details - thinner outer sections
        addBox(20, 2, 5, 0x7a3d0f, ax - 65, hillY + 19, az);
        addBox(20, 2, 5, 0x7a3d0f, ax + 65, hillY + 19, az);
        // Shoulder joints
        addBox(6, 8, 6, 0x8b4513, ax - 10, hillY + 20, az);
        addBox(6, 8, 6, 0x8b4513, ax + 10, hillY + 20, az);
        // Legs / lower body
        addBox(4, 10, 5, 0x7a3d0f, ax - 2, hillY + 4, az);
        addBox(4, 10, 5, 0x7a3d0f, ax + 2, hillY + 4, az);
    }

    function buildSageGateshead() {
        // Glass music venue - sweeping curved roof on south bank
        var sx = 15270;
        var sz = 30;
        // Foundation podium
        addBox(70, 4, 40, 0x888888, sx, 2, sz);
        // Main hall box - large
        addBox(50, 18, 30, 0x99bbcc, sx - 8, 13, sz);
        // Second hall - smaller
        addBox(25, 12, 22, 0x88aacc, sx + 22, 9, sz + 2);
        // Sweeping glass roof arch 1
        addBox(52, 5, 5, 0xaaccdd, sx - 8, 24, sz - 14);
        addBox(52, 5, 5, 0xaaccdd, sx - 8, 26, sz - 8);
        addBox(52, 5, 5, 0xaaccdd, sx - 8, 27, sz - 2);
        addBox(52, 5, 5, 0xaaccdd, sx - 8, 26, sz + 4);
        addBox(52, 5, 5, 0xaaccdd, sx - 8, 24, sz + 10);
        // Glass facade south
        addBox(70, 22, 2, 0xbbddee, sx, 12, sz + 21);
        // Silver exterior cladding
        addBox(70, 22, 2, 0xc0c8cc, sx, 12, sz - 20);
        // Curved roof ridges
        addBox(52, 2, 36, 0x99bbcc, sx - 8, 30, sz);
        // Entrance canopy
        addBox(20, 3, 8, 0xaaaaaa, sx, 5, sz + 22);
        // Riverside walkway
        addBox(80, 1, 8, 0x999999, sx, 1, sz + 25);
    }

    function buildBalticCentre() {
        // Former flour mill - tall brick industrial building
        var bax = 15340;
        var baz = 28;
        // Main mill building - tall brick
        addBox(22, 45, 20, 0x8b4513, bax, 22, baz);
        // Upper section slightly narrower
        addBox(18, 10, 16, 0x7a3d11, bax, 49, baz);
        // Observation platform / box extension on top
        addBox(24, 4, 24, 0x555555, bax, 56, baz);
        // Glass box viewing level
        addBox(22, 6, 22, 0x99bbcc, bax, 61, baz);
        // BALTIC sign on building front - represented as dark panel
        addBox(14, 4, 1, 0x222222, bax, 30, baz - 11);
        // Large windows / gallery openings
        addBox(6, 8, 1, 0x99aacc, bax - 6, 20, baz - 11);
        addBox(6, 8, 1, 0x99aacc, bax + 6, 20, baz - 11);
        addBox(6, 8, 1, 0x99aacc, bax - 6, 35, baz - 11);
        addBox(6, 8, 1, 0x99aacc, bax + 6, 35, baz - 11);
        // Riverside dock extension
        addBox(26, 4, 8, 0x777766, bax, 2, baz - 16);
        // Loading bay overhang
        addBox(24, 6, 4, 0x8b4513, bax, 10, baz - 13);
        // Riverside promenade
        addBox(30, 1, 10, 0xaaaaaa, bax, 0.5, baz - 20);
    }

    function buildNewcastleCastleKeep() {
        // Norman square keep on north bank
        var cx = 15260;
        var cz = -50;
        // Castle mound
        addBox(40, 5, 40, 0x5c4a2a, cx, 2, cz);
        // Main Keep - square Norman tower
        addBox(20, 30, 20, 0x888877, cx, 20, cz);
        // Battlements on keep
        addBox(22, 3, 22, 0x999988, cx, 36, cz);
        // Corner turrets
        addBox(4, 6, 4, 0x888877, cx - 10, 39, cz - 10);
        addBox(4, 6, 4, 0x888877, cx + 10, 39, cz - 10);
        addBox(4, 6, 4, 0x888877, cx - 10, 39, cz + 10);
        addBox(4, 6, 4, 0x888877, cx + 10, 39, cz + 10);
        // Black Gate - 13th century gatehouse to north
        addBox(12, 16, 8, 0x777766, cx - 4, 13, cz - 20);
        // Black Gate arch opening
        addBox(4, 6, 8, 0x333322, cx - 4, 5, cz - 20);
        // Railway viaduct arches surrounding castle
        var va;
        for (va = -30; va <= 30; va += 12) {
            addBox(8, 10, 4, 0x888877, cx + va, 5, cz + 18);
            if (va < 30) {
                addBox(10, 3, 3, 0x777766, cx + va + 6, 11, cz + 18);
            }
        }
        // Viaduct deck
        addBox(64, 3, 6, 0x888877, cx, 13, cz + 18);
        // Castle wall fragments
        addBox(30, 8, 2, 0x888877, cx, 7, cz + 12);
        addBox(2, 8, 20, 0x888877, cx - 15, 7, cz + 2);
        addBox(2, 8, 20, 0x888877, cx + 15, 7, cz + 2);
    }

    function buildQuayside() {
        // Georgian/Victorian riverfront buildings on north bank
        var qx = 15280;
        var qz = -35;
        // Guildhall - classical building
        addBox(18, 14, 12, 0xddcc99, qx - 40, 7, qz);
        // Guildhall columns
        addBox(2, 12, 2, 0xccbb88, qx - 47, 6, qz - 5);
        addBox(2, 12, 2, 0xccbb88, qx - 44, 6, qz - 5);
        addBox(2, 12, 2, 0xccbb88, qx - 37, 6, qz - 5);
        addBox(2, 12, 2, 0xccbb88, qx - 34, 6, qz - 5);
        addBox(10, 2, 1, 0xccbb88, qx - 40, 14, qz - 5);
        // Guildhall triangular pediment
        addCone(6, 4, 4, 0xddcc99, qx - 40, 16, qz - 4);
        // Covered market
        addBox(30, 10, 20, 0xcc9966, qx, 5, qz);
        addBox(30, 4, 2, 0x888877, qx, 12, qz - 10);
        // Market roof
        addBox(32, 3, 22, 0xbb8855, qx, 14, qz);
        // Row of Victorian buildings - various heights
        addBox(10, 18, 12, 0xcc9966, qx + 30, 9, qz);
        addBox(8, 14, 12, 0xddaa77, qx + 40, 7, qz);
        addBox(12, 22, 12, 0xbb8855, qx + 52, 11, qz);
        addBox(8, 16, 12, 0xcc9966, qx + 62, 8, qz);
        // Window details on Victorian row
        addBox(2, 3, 1, 0x334455, qx + 29, 12, qz - 6);
        addBox(2, 3, 1, 0x334455, qx + 31, 12, qz - 6);
        addBox(2, 3, 1, 0x334455, qx + 39, 10, qz - 6);
        addBox(2, 3, 1, 0x334455, qx + 41, 10, qz - 6);
        addBox(2, 3, 1, 0x334455, qx + 51, 14, qz - 6);
        addBox(2, 3, 1, 0x334455, qx + 53, 14, qz - 6);
        // Quayside nightlife bars ground floor
        addBox(80, 4, 4, 0x555544, qx + 10, 2, qz - 8);
        // Pub signs / awnings
        addBox(6, 2, 3, 0xaa2222, qx + 28, 4, qz - 9);
        addBox(6, 2, 3, 0x2244aa, qx + 38, 4, qz - 9);
        addBox(6, 2, 3, 0x22aa44, qx + 50, 4, qz - 9);
        // Quayside road surface
        addBox(120, 0.5, 10, 0x444444, qx + 10, 0.25, qz - 14);
        // Riverside walkway/promenade
        addBox(120, 0.5, 8, 0x888888, qx + 10, 0.25, qz - 5);
        // Street lamps
        var l;
        for (l = -30; l <= 80; l += 15) {
            addBox(0.4, 6, 0.4, 0x888888, qx + l, 3, qz - 12);
            addSphere(0.6, 4, 4, 0xffffcc, qx + l, 7, qz - 12);
        }
        // Millennium footbridge approach on quayside
        addBox(10, 2, 10, 0x999999, qx + 60, 1, qz - 2);
    }

    function buildGroundTerrain() {
        // Ground plane - city terrain
        addBox(500, 1, 300, 0x3a5c2a, 15280, -0.5, 0);
        // North bank higher ground
        addBox(200, 3, 80, 0x4a6c3a, 15280, 0.5, -60);
        // South bank Gateshead
        addBox(200, 2, 80, 0x3a5c2a, 15280, 0.5, 60);
    }

    function build() {
        buildGroundTerrain();
        buildRiver();
        buildTyneBridge();
        buildSwingBridge();
        buildHighLevelBridge();
        buildMillenniumBridge();
        buildQueenElizabethBridge();
        buildKingEdwardBridge();
        buildMetroBridge();
        buildAngelOfNorth();
        buildSageGateshead();
        buildBalticCentre();
        buildNewcastleCastleKeep();
        buildQuayside();
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
