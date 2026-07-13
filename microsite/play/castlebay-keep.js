window.CastlebayKeep = (function() {
    'use strict';

    var WX = 1630;
    var WZ = 2200;

    function makeBox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeBoxEdges(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(WX + x, y, WZ + z);
        scene.add(lines);
        return lines;
    }

    function buildWater(scene) {
        // Bay water surface around the castle island — several box slabs
        var waterColor = 0x1A6B8A;
        makeBox(scene, 60, 1, 60, waterColor,  0, -0.5,  0);
        makeBox(scene, 20, 1, 20, waterColor,  0, -0.5, -20);
        makeBox(scene, 20, 1, 20, waterColor, 20, -0.5,  0);
        makeBox(scene, 20, 1, 20, waterColor, -20, -0.5,  0);
        makeBox(scene, 20, 1, 20, waterColor,  0, -0.5, 20);
    }

    function buildKisimulCastle(scene) {
        var stoneGrey = 0x8A8A8A;
        var wallGrey  = 0x9A9A9A;

        // Castle island base
        makeBox(scene, 16, 1, 16, 0x6B6B5A, 0, 0, 0);

        // Main tower keep — 10×14×10
        makeBox(scene, 10, 14, 10, stoneGrey, 0, 7, 0);

        // Outline edges on the keep
        makeBoxEdges(scene, 10, 14, 10, 0x555555, 0, 7, 0);

        // Curtain wall — 4 box sides, 8×4×2
        // North wall
        makeBox(scene, 18, 4, 2, wallGrey,  0, 2, -9);
        // South wall
        makeBox(scene, 18, 4, 2, wallGrey,  0, 2,  9);
        // East wall
        makeBox(scene, 2, 4, 18, wallGrey,  9, 2,  0);
        // West wall
        makeBox(scene, 2, 4, 18, wallGrey, -9, 2,  0);

        // Corner towers (small cylinders replaced by boxes per rules)
        var cGeo = new THREE.CylinderGeometry(1.2, 1.2, 5, 8);
        var cMat = new THREE.MeshLambertMaterial({ color: stoneGrey });
        var corners = [
            [-9, -9],
            [ 9, -9],
            [-9,  9],
            [ 9,  9]
        ];
        for (var i = 0; i < corners.length; i++) {
            var c = new THREE.Mesh(cGeo, cMat);
            c.position.set(WX + corners[i][0], 2.5, WZ + corners[i][1]);
            scene.add(c);
        }

        // Battlements on top of keep (small boxes)
        var merlonPositions = [
            [-4, -5], [-2, -5], [0, -5], [2, -5], [4, -5],
            [-4,  5], [-2,  5], [0,  5], [2,  5], [4,  5],
            [-5, -4], [-5, -2], [-5, 0], [-5, 2], [-5, 4],
            [ 5, -4], [ 5, -2], [ 5, 0], [ 5, 2], [ 5, 4]
        ];
        for (var j = 0; j < merlonPositions.length; j++) {
            makeBox(scene, 1, 1, 1, stoneGrey,
                merlonPositions[j][0], 14.5, merlonPositions[j][1]);
        }
    }

    function buildFerryTerminal(scene) {
        var concreteColor = 0x888888;

        // Main pier — 30×2×6
        makeBox(scene, 30, 2, 6, concreteColor, -40, 1, 10);

        // Pier ramp — sloped approach (approximated as flattened box)
        makeBox(scene, 8, 1, 6, 0x999999, -24, 0.5, 10);

        // Bollards along pier
        for (var b = 0; b < 5; b++) {
            var bx = -50 + b * 6;
            makeBox(scene, 0.5, 1.5, 0.5, 0x555555, bx, 2.75, 7.5);
            makeBox(scene, 0.5, 1.5, 0.5, 0x555555, bx, 2.75, 12.5);
        }

        // Waiting shelter — roof and walls
        makeBox(scene, 10, 0.5, 6, 0x777777, -22, 5.25, 10); // roof slab
        makeBox(scene, 0.5, 4,  6, 0xAAAAAA, -17, 3,    10); // east side wall
        makeBox(scene, 0.5, 4,  6, 0xAAAAAA, -27, 3,    10); // west side wall
        makeBox(scene, 10, 4, 0.5, 0xAAAAAA, -22, 3,    13); // back wall

        // Ferry berth marker poles
        var poleGeo = new THREE.CylinderGeometry(0.2, 0.2, 4, 6);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0xDD3333 });
        var poleXs = [-30, -25, -55, -60];
        for (var p = 0; p < poleXs.length; p++) {
            var pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(WX + poleXs[p], 3, WZ + 10);
            scene.add(pole);
        }
    }

    function buildBarraBeach(scene) {
        var sandColor  = 0xD4B483;
        var whiteColor = 0xFFFFFF;

        // Tidal sand flat — large box slab
        makeBox(scene, 80, 0.3, 30, sandColor, 30, 0.15, -40);

        // Beach runway — white box marker posts along runway centreline
        // Posts at intervals, alternating sides
        var postCount = 12;
        for (var r = 0; r < postCount; r++) {
            var rx = -5 + r * 7;
            // Left marker
            makeBox(scene, 0.4, 1.5, 0.4, whiteColor, rx, 0.75, -30);
            // Right marker
            makeBox(scene, 0.4, 1.5, 0.4, whiteColor, rx, 0.75, -50);
        }

        // Runway threshold marker boards (flat white panels)
        makeBox(scene, 0.4, 0.8, 6, whiteColor, -6,  0.4, -40);
        makeBox(scene, 0.4, 0.8, 6, whiteColor, 79,  0.4, -40);

        // Wind cone / sock pole
        var wcGeo = new THREE.CylinderGeometry(0.15, 0.15, 6, 6);
        var wcMat = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
        var wc = new THREE.Mesh(wcGeo, wcMat);
        wc.position.set(WX + 40, 3, WZ - 55);
        scene.add(wc);

        var coneGeo = new THREE.ConeGeometry(0.6, 2, 6);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var cone = new THREE.Mesh(coneGeo, coneMat);
        cone.rotation.z = Math.PI / 2;
        cone.position.set(WX + 41, 6, WZ - 55);
        scene.add(cone);
    }

    function buildCottages(scene) {
        var wallColor  = 0xF0F0F0;
        var roofColor  = 0x8B4513;
        var doorColor  = 0x5C3A1E;
        var windowColor = 0x87CEEB;

        // 4 cottages in a row along the bay
        for (var k = 0; k < 4; k++) {
            var cx = -60 + k * 18;
            var cz = 30;

            // Cottage body — 6×4×5
            makeBox(scene, 6, 4, 5, wallColor, cx, 2, cz);

            // Roof (pitched approximation — two sloped boxes)
            var rGeo = new THREE.BoxGeometry(7, 1, 6);
            var rMat = new THREE.MeshLambertMaterial({ color: roofColor });
            var roof = new THREE.Mesh(rGeo, rMat);
            roof.position.set(WX + cx, 4.5, WZ + cz);
            scene.add(roof);

            // Ridge
            makeBox(scene, 7, 0.5, 0.6, 0x5A2D0C, cx, 5.25, cz);

            // Door
            makeBox(scene, 1, 2, 0.2, doorColor, cx, 1, cz - 2.6);

            // Windows (x2)
            makeBox(scene, 1.2, 1, 0.2, windowColor, cx - 2, 2.5, cz - 2.6);
            makeBox(scene, 1.2, 1, 0.2, windowColor, cx + 2, 2.5, cz - 2.6);

            // Chimney
            makeBox(scene, 0.8, 2, 0.8, 0xCC8866, cx + 2, 6, cz - 1);
        }
    }

    function buildGroundAndRoads(scene) {
        // Village ground
        makeBox(scene, 200, 0.5, 150, 0x5A7A3A, 0, -0.25, 10);

        // Simple road — flat dark box strip
        makeBox(scene, 120, 0.1, 5, 0x444444, -30, 0.1, 25);

        // Road kerb lines
        makeBox(scene, 120, 0.15, 0.3, 0xFFFFFF, -30, 0.15, 22.5);
        makeBox(scene, 120, 0.15, 0.3, 0xFFFFFF, -30, 0.15, 27.5);
    }

    function buildLampPosts(scene) {
        var postGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 6);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var lampGeo = new THREE.SphereGeometry(0.3, 6, 6);
        var lampMat = new THREE.MeshLambertMaterial({ color: 0xFFFF99 });

        var lampXs = [-55, -40, -25, -10, 5, 20];
        for (var l = 0; l < lampXs.length; l++) {
            var post = new THREE.Mesh(postGeo, postMat);
            post.position.set(WX + lampXs[l], 2.5, WZ + 22);
            scene.add(post);

            var lamp = new THREE.Mesh(lampGeo, lampMat);
            lamp.position.set(WX + lampXs[l], 5.3, WZ + 22);
            scene.add(lamp);
        }
    }

    function buildHarbourWall(scene) {
        // Harbour retaining wall along the seafront
        makeBox(scene, 100, 3, 2, 0x8A7A6A, -20, 1.5, 5);

        // Stone steps down to water
        makeBox(scene, 4, 0.5, 1.5, 0x9A8A7A, -30, 0.75, 4);
        makeBox(scene, 4, 0.5, 1.5, 0x9A8A7A, -30, 0.25, 2.5);
        makeBox(scene, 4, 0.5, 1.5, 0x9A8A7A, -30, -0.25, 1);
    }

    function init(scene) {
        buildGroundAndRoads(scene);
        buildWater(scene);
        buildKisimulCastle(scene);
        buildFerryTerminal(scene);
        buildBarraBeach(scene);
        buildCottages(scene);
        buildLampPosts(scene);
        buildHarbourWall(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };

}());
