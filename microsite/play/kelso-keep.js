window.KelsoKeep = (function() {
    'use strict';

    var WX = 2530;
    var WZ = 2200;

    function makeBox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makeCylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makeSphere(scene, r, segs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, segs, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makeCone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makeWireBox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(x, y, z);
        scene.add(lines);
        return lines;
    }

    function buildAbbey(scene) {
        var bx = WX - 60;
        var bz = WZ + 20;
        var stoneColor = 0xD4A97A;
        var darkStone = 0xB08860;

        // Main nave body
        makeBox(scene, 22, 10, 14, stoneColor, bx, 5, bz);

        // Twin Romanesque towers at west front
        makeCylinder(scene, 4, 4, 18, 12, stoneColor, bx - 9, 9, bz - 8);
        makeCylinder(scene, 4, 4, 18, 12, stoneColor, bx + 9, 9, bz - 8);

        // Tower caps (cone roofs)
        makeCone(scene, 4, 5, 12, darkStone, bx - 9, 20, bz - 8);
        makeCone(scene, 4, 5, 12, darkStone, bx + 9, 20, bz - 8);

        // Chancel extension to east
        makeBox(scene, 10, 8, 10, stoneColor, bx + 14, 4, bz);

        // Carved arcade frieze detail boxes along nave
        var i;
        for (i = 0; i < 5; i++) {
            makeBox(scene, 2, 1.5, 0.5, darkStone, bx - 8 + i * 4, 7, bz - 7);
            makeBox(scene, 2, 1.5, 0.5, darkStone, bx - 8 + i * 4, 7, bz + 7);
        }

        // Arcade pillar stubs (collapsed crossing)
        makeCylinder(scene, 1, 1.2, 6, 8, darkStone, bx - 4, 3, bz - 3);
        makeCylinder(scene, 1, 1.2, 6, 8, darkStone, bx + 4, 3, bz - 3);
        makeCylinder(scene, 1, 1.2, 6, 8, darkStone, bx - 4, 3, bz + 3);
        makeCylinder(scene, 1, 1.2, 6, 8, darkStone, bx + 4, 3, bz + 3);

        // Transept arms
        makeBox(scene, 8, 9, 6, stoneColor, bx - 4, 4.5, bz - 14);
        makeBox(scene, 8, 9, 6, stoneColor, bx - 4, 4.5, bz + 14);

        // West doorway arch detail
        makeBox(scene, 4, 5, 1, darkStone, bx, 2.5, bz - 7.5);
        makeBox(scene, 6, 1, 1, darkStone, bx, 5.5, bz - 7.5);

        // Ruined wall stubs
        makeBox(scene, 1.5, 4, 8, darkStone, bx - 11, 2, bz + 5);
        makeBox(scene, 1.5, 3, 6, darkStone, bx + 11, 1.5, bz - 2);

        // Wire outlines for detail
        makeWireBox(scene, 22, 10, 14, 0x8B6A3A, bx, 5, bz);
        makeWireBox(scene, 10, 8, 10, 0x8B6A3A, bx + 14, 4, bz);
    }

    function buildFloorscastle(scene) {
        var bx = WX + 80;
        var bz = WZ - 60;
        var stoneColor = 0xD4A97A;
        var roofColor = 0x6A7A8A;
        var darkStone = 0xA08060;

        // Main palace body — enormous central block
        makeBox(scene, 50, 14, 22, stoneColor, bx, 7, bz);

        // East wing
        makeBox(scene, 24, 12, 18, stoneColor, bx + 36, 6, bz);

        // West wing
        makeBox(scene, 24, 12, 18, stoneColor, bx - 36, 6, bz);

        // Central roof block
        makeBox(scene, 50, 3, 22, roofColor, bx, 15.5, bz);

        // Roofline turrets — approx 20 evenly spaced along entire frontage
        var turretCount = 20;
        var totalWidth = 96;
        var startX = bx - 46;
        var spacing = totalWidth / (turretCount - 1);
        var j;
        for (j = 0; j < turretCount; j++) {
            var tx = startX + j * spacing;
            makeCylinder(scene, 1.2, 1.2, 4, 8, stoneColor, tx, 16, bz - 11);
            makeCone(scene, 1.2, 2, 8, roofColor, tx, 19, bz - 11);
            makeCylinder(scene, 1.2, 1.2, 4, 8, stoneColor, tx, 16, bz + 11);
            makeCone(scene, 1.2, 2, 8, roofColor, tx, 19, bz + 11);
        }

        // Corner towers — larger
        makeCylinder(scene, 3.5, 3.5, 16, 12, stoneColor, bx - 60, 8, bz - 10);
        makeCone(scene, 3.5, 5, 12, roofColor, bx - 60, 18.5, bz - 10);
        makeCylinder(scene, 3.5, 3.5, 16, 12, stoneColor, bx + 60, 8, bz - 10);
        makeCone(scene, 3.5, 5, 12, roofColor, bx + 60, 18.5, bz - 10);
        makeCylinder(scene, 3.5, 3.5, 16, 12, stoneColor, bx - 60, 8, bz + 10);
        makeCone(scene, 3.5, 5, 12, roofColor, bx - 60, 18.5, bz + 10);
        makeCylinder(scene, 3.5, 3.5, 16, 12, stoneColor, bx + 60, 8, bz + 10);
        makeCone(scene, 3.5, 5, 12, roofColor, bx + 60, 18.5, bz + 10);

        // Holly-shaped window detail boxes — tall narrow arched recesses
        var winColor = 0x2A3A4A;
        var k;
        for (k = 0; k < 7; k++) {
            makeBox(scene, 1.5, 4, 0.4, winColor, bx - 18 + k * 6, 8, bz - 11.2);
            makeBox(scene, 1.5, 4, 0.4, winColor, bx - 18 + k * 6, 8, bz + 11.2);
        }

        // Decorative battlements on main block
        var m;
        for (m = 0; m < 8; m++) {
            makeBox(scene, 2.5, 2, 1.5, darkStone, bx - 17.5 + m * 5, 15, bz - 11);
            makeBox(scene, 2.5, 2, 1.5, darkStone, bx - 17.5 + m * 5, 15, bz + 11);
        }

        // Entrance portico
        makeBox(scene, 10, 10, 6, stoneColor, bx, 5, bz - 16);
        makeCylinder(scene, 1.5, 1.5, 10, 8, stoneColor, bx - 4, 5, bz - 18);
        makeCylinder(scene, 1.5, 1.5, 10, 8, stoneColor, bx + 4, 5, bz - 18);

        // Grounds wall
        makeBox(scene, 120, 2, 1.5, darkStone, bx, 1, bz - 30);
        makeBox(scene, 1.5, 2, 30, darkStone, bx - 60, 1, bz - 15);
        makeBox(scene, 1.5, 2, 30, darkStone, bx + 60, 1, bz - 15);

        makeWireBox(scene, 50, 14, 22, 0x8B6A3A, bx, 7, bz);
    }

    function buildRivers(scene) {
        var waterColor = 0x1A6B8A;
        var darkWater = 0x0F4A6A;

        // River Tweed — flows roughly east-west
        makeBox(scene, 180, 0.3, 18, waterColor, WX + 20, 0.15, WZ + 80);
        makeBox(scene, 160, 0.3, 18, waterColor, WX - 40, 0.15, WZ + 80);

        // River Teviot — flows roughly north-south to confluence
        makeBox(scene, 18, 0.3, 120, waterColor, WX - 40, 0.15, WZ + 20);

        // Confluence pool — T-junction widening
        makeBox(scene, 36, 0.3, 36, waterColor, WX - 40, 0.15, WZ + 62);

        // Deeper channel tint
        makeBox(scene, 10, 0.1, 14, darkWater, WX + 20, 0.2, WZ + 80);
        makeBox(scene, 10, 0.1, 14, darkWater, WX - 40, 0.2, WZ + 30);

        // Water ripple lines (LineSegments)
        var rippleGeo = new THREE.BufferGeometry();
        var rippleVerts = [];
        var r;
        for (r = 0; r < 8; r++) {
            rippleVerts.push(WX - 70 + r * 20, 0.4, WZ + 75);
            rippleVerts.push(WX - 70 + r * 20, 0.4, WZ + 85);
        }
        rippleGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(rippleVerts), 3));
        var rippleMat = new THREE.LineBasicMaterial({ color: 0x4A9ABF });
        var rippleLines = new THREE.LineSegments(rippleGeo, rippleMat);
        scene.add(rippleLines);
    }

    function buildKelsoBridge(scene) {
        var bx = WX - 20;
        var bz = WZ + 80;
        var bridgeColor = 0x9A8A78;
        var darkBridge = 0x7A6A58;

        // Main bridge deck
        makeBox(scene, 35, 3, 6, bridgeColor, bx, 3, bz);

        // Five arch piers
        var p;
        for (p = 0; p < 5; p++) {
            var px = bx - 14 + p * 7;
            // Pier body
            makeBox(scene, 2.5, 5, 4.5, darkBridge, px, 0, bz);
            // Arch void cutout suggestion — narrow box above water
            makeBox(scene, 3.5, 2, 2, 0x1A6B8A, px, 2, bz);
        }

        // Bridge parapets
        makeBox(scene, 35, 1.2, 0.6, bridgeColor, bx, 5.1, bz - 3);
        makeBox(scene, 35, 1.2, 0.6, bridgeColor, bx, 5.1, bz + 3);

        // Parapet cap details
        makeBox(scene, 35, 0.4, 0.8, darkBridge, bx, 5.9, bz - 3);
        makeBox(scene, 35, 0.4, 0.8, darkBridge, bx, 5.9, bz + 3);

        // Bridge abutment blocks at each end
        makeBox(scene, 5, 5, 8, darkBridge, bx - 19, 2.5, bz);
        makeBox(scene, 5, 5, 8, darkBridge, bx + 19, 2.5, bz);

        makeWireBox(scene, 35, 3, 6, 0x6A5A48, bx, 3, bz);
    }

    function buildRoxburgh(scene) {
        var bx = WX - 55;
        var bz = WZ + 68;
        var motteColor = 0x5A7A3A;
        var darkMotte = 0x3A5A1A;
        var stoneColor = 0x8A7A6A;

        // Motte hill — large earthen mound
        makeBox(scene, 28, 8, 28, motteColor, bx, 4, bz);
        // Upper mound
        makeBox(scene, 18, 5, 18, motteColor, bx, 10.5, bz);
        makeBox(scene, 10, 3, 10, darkMotte, bx, 14.5, bz);

        // Sphere cap to round off the motte top
        makeSphere(scene, 6, 10, motteColor, bx, 16, bz);

        // Bailey enclosure — fragmentary walls on peninsula
        makeBox(scene, 1.5, 4, 30, stoneColor, bx - 15, 2, bz + 8);
        makeBox(scene, 1.5, 4, 20, stoneColor, bx + 15, 2, bz);
        makeBox(scene, 24, 4, 1.5, stoneColor, bx - 3, 2, bz - 7);

        // Ruined tower stubs
        makeCylinder(scene, 3, 3.5, 7, 8, stoneColor, bx - 13, 3.5, bz - 7);
        makeCylinder(scene, 2.5, 3, 5, 8, stoneColor, bx + 14, 2.5, bz + 5);

        // Overgrown rubble boxes
        makeBox(scene, 6, 1.5, 4, darkMotte, bx - 8, 0.75, bz + 14);
        makeBox(scene, 4, 2, 6, darkMotte, bx + 6, 1, bz - 12);
        makeBox(scene, 3, 1, 5, darkMotte, bx - 2, 0.5, bz + 18);

        // Keep foundation outline
        makeBox(scene, 12, 1, 10, stoneColor, bx, 17.5, bz);

        // Scattered stone fragments on motte slopes
        makeBox(scene, 2, 1, 2, stoneColor, bx - 5, 8.5, bz - 5);
        makeBox(scene, 1.5, 0.8, 2, stoneColor, bx + 6, 7, bz + 4);
        makeBox(scene, 2, 1.2, 1.5, stoneColor, bx - 3, 9, bz + 6);

        // Ditches (dark trenches)
        makeBox(scene, 32, 1, 4, 0x2A3A1A, bx, 0, bz - 18);
        makeBox(scene, 4, 1, 24, 0x2A3A1A, bx - 18, 0, bz + 3);
    }

    function buildTownscape(scene) {
        var townColor = 0xC8B898;
        var roofCol = 0x8A4A3A;
        var darkTown = 0xA09080;

        // Market Square row of buildings
        var n;
        for (n = 0; n < 6; n++) {
            makeBox(scene, 7, 6 + n % 3, 8, townColor, WX - 30 + n * 10, 3 + (n % 3) * 0.5, WZ - 20);
            makeBox(scene, 7, 1.5, 8, roofCol, WX - 30 + n * 10, 7.5 + (n % 3) * 0.5, WZ - 20);
        }

        // Town Cross/Square centrepiece
        makeCylinder(scene, 0.8, 1, 8, 8, darkTown, WX, 4, WZ - 10);
        makeCone(scene, 1, 3, 8, 0xC8B030, WX, 9.5, WZ - 10);

        // Church of John — tall steeple
        makeBox(scene, 10, 12, 10, townColor, WX - 5, 6, WZ - 40);
        makeCylinder(scene, 2, 2.5, 16, 8, darkTown, WX - 5, 20, WZ - 40);
        makeCone(scene, 2, 6, 8, roofCol, WX - 5, 30, WZ - 40);

        // South terrace row
        for (n = 0; n < 4; n++) {
            makeBox(scene, 8, 7, 9, townColor, WX + 20 + n * 10, 3.5, WZ - 30);
            makeBox(scene, 8, 2, 9, roofCol, WX + 20 + n * 10, 8, WZ - 30);
        }
    }

    function buildGrounds(scene) {
        var groundColor = 0x5A7A3A;
        var pathColor = 0xB0A080;

        // Ground plane using boxes
        makeBox(scene, 300, 0.5, 300, groundColor, WX, -0.25, WZ);

        // Paths
        makeBox(scene, 80, 0.6, 3, pathColor, WX - 10, 0.3, WZ);
        makeBox(scene, 3, 0.6, 60, pathColor, WX, 0.3, WZ + 30);

        // Hedgerow boundaries
        makeBox(scene, 60, 2, 2, 0x3A6A2A, WX + 30, 1, WZ - 45);
        makeBox(scene, 2, 2, 40, 0x3A6A2A, WX + 60, 1, WZ - 25);

        // Trees as stacked cylinders + cones
        var treePositions = [
            [WX + 20, WZ - 50],
            [WX - 50, WZ - 55],
            [WX + 70, WZ - 10],
            [WX - 80, WZ - 30],
            [WX + 100, WZ + 40],
            [WX - 90, WZ + 50]
        ];
        var t;
        for (t = 0; t < treePositions.length; t++) {
            var tx2 = treePositions[t][0];
            var tz2 = treePositions[t][1];
            makeCylinder(scene, 0.6, 0.8, 5, 6, 0x5A3A1A, tx2, 2.5, tz2);
            makeCone(scene, 3, 7, 8, 0x2A6A1A, tx2, 8.5, tz2);
            makeCone(scene, 2, 5, 8, 0x3A7A2A, tx2, 12, tz2);
        }
    }

    function init(scene) {
        buildGrounds(scene);
        buildRivers(scene);
        buildAbbey(scene);
        buildFloorscastle(scene);
        buildKelsoBridge(scene);
        buildRoxburgh(scene);
        buildTownscape(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };

}());
