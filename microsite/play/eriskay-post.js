window.EriskayPost = (function() {
    'use strict';

    var WX = 1600;
    var WZ = 2200;

    function makeBox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeSphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function buildWreckMemorial(scene) {
        // Main rusted hull — long box
        makeBox(scene, 20, 3, 5, 0x3D1C02, 0, 1.5, 0);

        // Broken mast 1 — leaning cylinder
        var mast1geo = new THREE.CylinderGeometry(0.2, 0.3, 7, 6);
        var mastmat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var mast1 = new THREE.Mesh(mast1geo, mastmat);
        mast1.position.set(WX + (-5), 6, WZ + 0);
        mast1.rotation.z = 0.3;
        scene.add(mast1);

        // Broken mast 2
        var mast2geo = new THREE.CylinderGeometry(0.2, 0.3, 5, 6);
        var mast2 = new THREE.Mesh(mast2geo, mastmat);
        mast2.position.set(WX + 4, 4.5, WZ + 0);
        mast2.rotation.z = -0.25;
        scene.add(mast2);

        // Hull prow raised section
        makeBox(scene, 3, 4, 5, 0x3D1C02, -9, 2, 0);

        // Hull stern section
        makeBox(scene, 3, 2.5, 4.5, 0x4A2008, 9, 1.25, 0);

        // Rust streaks / hull side detail
        makeBox(scene, 18, 0.5, 0.3, 0x6B2D0A, 0, 3.1, -2.6);
        makeBox(scene, 18, 0.5, 0.3, 0x6B2D0A, 0, 3.1, 2.6);

        // Scattered whisky crates around hull
        var cratepositions = [
            [-12, 2, 3],
            [-14, 2, -2],
            [11, 2, 4],
            [13, 2, -3],
            [-11, 2, -5],
            [10, 2, -5],
            [-8, 2, 6],
            [6, 2, 7]
        ];

        for (var i = 0; i < cratepositions.length; i++) {
            var cp = cratepositions[i];
            makeBox(scene, 1.2, 1.2, 1.2, 0x8B6914, cp[0], cp[1], cp[2]);
        }

        // Memorial marker plaque box
        makeBox(scene, 1.5, 2, 0.2, 0xCCCCCC, -20, 1, 0);
        makeBox(scene, 0.1, 2, 0.1, 0x888888, -20.8, 1, 0);
    }

    function buildCauseway(scene) {
        // Long narrow stone causeway — series of boxes representing the bridge sections
        var bridgesegs = [
            [-60, 0, 0, 20, 1, 6],
            [-35, 0, 0, 20, 1, 6],
            [-10, 0, 0, 20, 1, 6],
            [15, 0, 0, 20, 1, 6],
            [40, 0, 0, 20, 1, 6],
            [65, 0, 0, 20, 1, 6]
        ];

        for (var i = 0; i < bridgesegs.length; i++) {
            var s = bridgesegs[i];
            makeBox(scene, s[3], s[4], s[5], 0x888888, s[0], s[1], s[2]);
        }

        // Causeway guard rails / kerb stones — small boxes on edges
        for (var j = -70; j <= 80; j += 10) {
            makeBox(scene, 1, 0.8, 0.4, 0x777777, j, 1, -3.2);
            makeBox(scene, 1, 0.8, 0.4, 0x777777, j, 1,  3.2);
        }

        // Causeway piers — cylinders supporting the road over water
        var pierpositions = [
            [-60, 0],
            [-35, 0],
            [-10, 0],
            [15, 0],
            [40, 0],
            [65, 0]
        ];

        for (var k = 0; k < pierpositions.length; k++) {
            var pp = pierpositions[k];
            makeCylinder(scene, 0.8, 1.0, 4, 6, 0x6E6E6E, pp[0], -2, pp[1] - 3);
            makeCylinder(scene, 0.8, 1.0, 4, 6, 0x6E6E6E, pp[0], -2, pp[1] + 3);
        }
    }

    function buildChurch(scene) {
        // Main chapel body
        makeBox(scene, 8, 6, 5, 0xF5F5F5, 30, 3, -20);

        // Roof — cone on top
        makeCone(scene, 4.5, 3, 4, 0xB0B0B0, 30, 7.5, -20);

        // Bell tower — taller cylinder
        makeCylinder(scene, 1.2, 1.4, 9, 8, 0xEEEEEE, 34.5, 4.5, -20);

        // Bell tower cap cone
        makeCone(scene, 1.5, 2.5, 8, 0xAAAAAA, 34.5, 10, -20);

        // Bell — small sphere inside tower opening
        makeSphere(scene, 0.4, 6, 6, 0x8B7355, 34.5, 8.5, -20);

        // Arched doorway gap representation — dark inset box
        makeBox(scene, 1.5, 2.5, 0.4, 0x222222, 26, 1.25, -17.8);

        // Side windows — dark recessed boxes
        makeBox(scene, 0.8, 1.2, 0.3, 0x444444, 26.5, 4, -17.85);
        makeBox(scene, 0.8, 1.2, 0.3, 0x444444, 29.0, 4, -17.85);
        makeBox(scene, 0.8, 1.2, 0.3, 0x444444, 31.5, 4, -17.85);

        // Cross on roof peak — two thin boxes
        makeBox(scene, 0.3, 2.5, 0.15, 0xDDDDDD, 30, 9.5, -20);
        makeBox(scene, 1.5, 0.3, 0.15, 0xDDDDDD, 30, 10.5, -20);

        // Low stone wall around churchyard
        makeBox(scene, 14, 1.2, 0.4, 0xAAAAAA, 30, 0.6, -25.5);
        makeBox(scene, 14, 1.2, 0.4, 0xAAAAAA, 30, 0.6, -14.5);
        makeBox(scene, 0.4, 1.2, 11, 0xAAAAAA, 23.3, 0.6, -20);
        makeBox(scene, 0.4, 1.2, 11, 0xAAAAAA, 36.7, 0.6, -20);
    }

    function buildPillbox(scene) {
        // Squat concrete bunker body
        makeBox(scene, 5, 2, 4, 0x9E9E9E, -30, 1, 25);

        // Roof slab
        makeBox(scene, 5.6, 0.4, 4.6, 0x8E8E8E, -30, 2.2, 25);

        // Gun slit — dark narrow box inset in front face
        makeBox(scene, 2, 0.35, 0.2, 0x1A1A1A, -30, 1.3, 22.9);

        // Entry step
        makeBox(scene, 2, 0.3, 0.8, 0x999999, -30, 0.15, 27.5);

        // Rear entrance gap representation
        makeBox(scene, 1.2, 1.6, 0.2, 0x333333, -30, 0.8, 27.1);

        // Blast wall in front of gun slit
        makeBox(scene, 0.4, 2, 2.5, 0x888888, -26, 1, 24);
        makeBox(scene, 0.4, 2, 2.5, 0x888888, -34, 1, 24);

        // Surrounding earthen berm — low wide boxes
        makeBox(scene, 8, 0.6, 1.5, 0x6B6B4E, -30, 0.3, 23.5);
        makeBox(scene, 8, 0.6, 1.5, 0x6B6B4E, -30, 0.3, 26.5);
        makeBox(scene, 1.5, 0.6, 5, 0x6B6B4E, -34.5, 0.3, 25);
        makeBox(scene, 1.5, 0.6, 5, 0x6B6B4E, -25.5, 0.3, 25);
    }

    function buildRockyBeach(scene) {
        // Boulder scatter pattern along shoreline
        var boulders = [
            [-40, 0.7, 30, 2.0, 1.4, 1.8],
            [-35, 0.5, 35, 1.5, 1.0, 1.6],
            [-28, 0.6, 32, 2.5, 1.2, 2.0],
            [-20, 0.5, 38, 1.8, 0.9, 1.5],
            [-15, 0.7, 34, 2.2, 1.5, 1.9],
            [-8,  0.4, 40, 1.2, 0.8, 1.4],
            [0,   0.6, 36, 2.0, 1.1, 1.7],
            [8,   0.5, 42, 1.6, 1.0, 1.3],
            [15,  0.7, 37, 2.3, 1.4, 2.0],
            [22,  0.4, 43, 1.4, 0.9, 1.6],
            [30,  0.6, 39, 1.9, 1.2, 1.8],
            [38,  0.5, 45, 2.1, 1.1, 1.5],
            [-45, 0.5, 28, 1.7, 0.9, 1.4],
            [45,  0.6, 33, 1.5, 1.0, 1.6],
            [-50, 0.7, 35, 2.0, 1.3, 1.7],
            [50,  0.4, 40, 2.4, 1.2, 2.0],
            [-42, 0.5, 44, 1.3, 0.8, 1.2],
            [42,  0.6, 47, 1.8, 1.1, 1.5]
        ];

        for (var i = 0; i < boulders.length; i++) {
            var b = boulders[i];
            makeBox(scene, b[3], b[4], b[5], 0x7A7A7A, b[0], b[1], b[2]);
        }

        // Second row of smaller pebble clusters
        var pebbles = [
            [-38, 0.3, 27, 0.8, 0.5, 0.7],
            [-25, 0.3, 29, 0.9, 0.4, 0.8],
            [-12, 0.3, 33, 0.7, 0.4, 0.6],
            [3,   0.3, 31, 0.8, 0.5, 0.7],
            [18,  0.3, 28, 0.9, 0.4, 0.8],
            [32,  0.3, 30, 0.7, 0.4, 0.7],
            [48,  0.3, 35, 0.8, 0.5, 0.6]
        ];

        for (var j = 0; j < pebbles.length; j++) {
            var p = pebbles[j];
            makeBox(scene, p[3], p[4], p[5], 0x6E6E6E, p[0], p[1], p[2]);
        }
    }

    function buildWireframes(scene) {
        // Edge highlight on the wreck hull using LineSegments
        var hullgeo = new THREE.BoxGeometry(20, 3, 5);
        var edgesgeo = new THREE.EdgesGeometry(hullgeo);
        var edgesmat = new THREE.LineBasicMaterial({ color: 0x5C3010 });
        var edges = new THREE.LineSegments(edgesgeo, edgesmat);
        edges.position.set(WX + 0, 1.5, WZ + 0);
        scene.add(edges);
    }

    function init(scene) {
        buildWreckMemorial(scene);
        buildCauseway(scene);
        buildChurch(scene);
        buildPillbox(scene);
        buildRockyBeach(scene);
        buildWireframes(scene);
    }

    return {
        init: init
    };

}());
