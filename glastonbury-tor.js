window.GlastonburyTor = (function() {
    'use strict';

    var WX = 3580;
    var WZ = 2200;

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makesphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makecone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function buildtor(scene) {
        // Glastonbury Tor — 6 stacked box tiers forming iconic conical hill
        // Each tier shrinks in footprint and rises 3 units
        // Tier data: [width, depth, y-center, xOffset, zOffset]
        var tiers = [
            [38, 38, 1.5,  0,  0],
            [30, 30, 4.5,  0,  0],
            [23, 23, 7.5,  0,  0],
            [17, 17, 10.5, 0,  0],
            [12, 12, 13.5, 0,  0],
            [ 8,  8, 16.5, 0,  0]
        ];
        for (var i = 0; i < tiers.length; i++) {
            var t = tiers[i];
            makebox(scene, t[0], 3, t[1], 0x5A7A3A, t[3], t[2], t[4]);
        }

        // Terraced paths — thin box ledges spiraling around each tier
        // Each tier gets a ledge on each of 4 faces, offset slightly outward and rotated
        var tierwidths = [38, 30, 23, 17, 12, 8];
        var tierheights = [3, 6, 9, 12, 15, 18];
        for (var j = 0; j < tierwidths.length; j++) {
            var tw = tierwidths[j];
            var th = tierheights[j];
            var ledgey = th + 0.15;
            // North ledge
            makebox(scene, tw + 1, 0.3, 1.2, 0x4A6A2A, 0, ledgey, -(tw / 2 + 0.6));
            // South ledge
            makebox(scene, tw + 1, 0.3, 1.2, 0x4A6A2A, 0, ledgey, (tw / 2 + 0.6));
            // West ledge
            makebox(scene, 1.2, 0.3, tw - 1, 0x4A6A2A, -(tw / 2 + 0.6), ledgey, 0);
            // East ledge
            makebox(scene, 1.2, 0.3, tw - 1, 0x4A6A2A, (tw / 2 + 0.6), ledgey, 0);
        }
    }

    function buildtower(scene) {
        // St Michael's Tower — ruined 14th century church tower on summit
        // Placed at top of tor, y = 18 (top of 6th tier)
        makebox(scene, 4, 14, 4, 0x9A8A78, 0, 18 + 7, 0);
        // Ruined top — partial upper section missing a face
        makebox(scene, 4, 2, 1.5, 0x9A8A78, 0, 18 + 14 + 1, -1.25);
        makebox(scene, 4, 2, 1.5, 0x9A8A78, 0, 18 + 14 + 1,  1.25);
        makebox(scene, 1.5, 2, 4, 0x9A8A78, -1.25, 18 + 14 + 1, 0);
        // Arched doorway recess (dark box)
        makebox(scene, 1.5, 3, 0.5, 0x4A3A2A, 0, 18 + 4, -2.1);
        // Gothic window slits
        makebox(scene, 0.5, 2, 0.3, 0x4A3A2A, -1, 18 + 9, -2.1);
        makebox(scene, 0.5, 2, 0.3, 0x4A3A2A,  1, 18 + 9, -2.1);
        makebox(scene, 0.5, 2, 0.3, 0x4A3A2A, -1, 18 + 9,  2.1);
        makebox(scene, 0.5, 2, 0.3, 0x4A3A2A,  1, 18 + 9,  2.1);
        // Ruined wall fragments at top
        makebox(scene, 1, 3, 4.2, 0x8A7A68, 2.1, 18 + 16, 0);
        makebox(scene, 1, 2, 2,   0x8A7A68, -2.1, 18 + 15, -1);
        // Buttress on south face
        makebox(scene, 1.2, 10, 1.2, 0x8A7A68, 0, 18 + 5, 2.6);
        makebox(scene, 1.2, 10, 1.2, 0x8A7A68, 0, 18 + 5, -2.6);
    }

    function buildabbey(scene) {
        // Glastonbury Abbey ruins — placed to the south-east of the tor
        var ax = 80;
        var az = 60;

        // Main roofless nave — long box, open top suggestion via low walls
        makebox(scene, 35, 8, 12, 0xD4A97A, ax, 4, az);
        // Interior floor
        makebox(scene, 33, 0.3, 10, 0xC09060, ax, 0.15, az);

        // Lady Chapel — smaller box at west end
        makebox(scene, 10, 7, 9, 0xCC9E72, ax - 22, 3.5, az);
        // Lady Chapel pointed arch gable (two boxes forming triangle profile)
        makebox(scene, 10, 1, 0.5, 0xCC9E72, ax - 22, 7.5, az - 4.75);
        makebox(scene, 10, 1, 0.5, 0xCC9E72, ax - 22, 7.5, az + 4.75);
        makebox(scene, 10, 0.5, 0.5, 0xCC9E72, ax - 22, 8.5, az - 4.3);
        makebox(scene, 10, 0.5, 0.5, 0xCC9E72, ax - 22, 8.5, az + 4.3);
        makebox(scene, 10, 0.5, 0.5, 0xBB8E62, ax - 22, 9.3, az - 3.7);
        makebox(scene, 10, 0.5, 0.5, 0xBB8E62, ax - 22, 9.3, az + 3.7);

        // Two pointed arch gables on nave ends
        // West gable
        makebox(scene, 12, 1, 0.5, 0xD4A97A, ax + 17, 8.5, az - 6);
        makebox(scene, 12, 1, 0.5, 0xD4A97A, ax + 17, 8.5, az + 6);
        makebox(scene, 10, 0.8, 0.5, 0xC49A6A, ax + 17, 9.5, az - 5.2);
        makebox(scene, 10, 0.8, 0.5, 0xC49A6A, ax + 17, 9.5, az + 5.2);
        makebox(scene, 7, 0.8, 0.5, 0xB08A5A, ax + 17, 10.4, az - 4.2);
        makebox(scene, 7, 0.8, 0.5, 0xB08A5A, ax + 17, 10.4, az + 4.2);
        // East gable
        makebox(scene, 12, 1, 0.5, 0xD4A97A, ax - 17, 8.5, az - 6);
        makebox(scene, 12, 1, 0.5, 0xD4A97A, ax - 17, 8.5, az + 6);
        makebox(scene, 10, 0.8, 0.5, 0xC49A6A, ax - 17, 9.5, az - 5.2);
        makebox(scene, 10, 0.8, 0.5, 0xC49A6A, ax - 17, 9.5, az + 5.2);
        makebox(scene, 7, 0.8, 0.5, 0xB08A5A, ax - 17, 10.4, az - 4.2);
        makebox(scene, 7, 0.8, 0.5, 0xB08A5A, ax - 17, 10.4, az + 4.2);

        // Pillar stumps lining the nave
        var pillarsx = [-12, -6, 0, 6, 12];
        for (var p = 0; p < pillarsx.length; p++) {
            makecylinder(scene, 0.6, 0.7, 6, 8, 0xC09060, ax + pillarsx[p], 3, az - 5);
            makecylinder(scene, 0.6, 0.7, 6, 8, 0xC09060, ax + pillarsx[p], 3, az + 5);
        }

        // King Arthur's grave marker slab — inside abbey
        makebox(scene, 4, 0.5, 2, 0x9A8A78, ax, 0.5, az + 2);
        // Inscription plaque on slab surface
        makebox(scene, 2.5, 0.15, 1.2, 0x7A6A58, ax, 0.8, az + 2);
        // Small cross above grave
        makebox(scene, 0.2, 2, 0.2, 0x8A7A68, ax, 1.75, az + 2);
        makebox(scene, 1.2, 0.2, 0.2, 0x8A7A68, ax, 2.4, az + 2);

        // Abbey precinct outer wall stubs
        makebox(scene, 70, 3, 1.5, 0xBB9960, ax, 1.5, az - 20);
        makebox(scene, 70, 3, 1.5, 0xBB9960, ax, 1.5, az + 20);
        makebox(scene, 1.5, 3, 40, 0xBB9960, ax - 35, 1.5, az);
        makebox(scene, 1.5, 3, 40, 0xBB9960, ax + 35, 1.5, az);
    }

    function buildchalicelwell(scene) {
        // Chalice Well — ancient holy well garden, south-west of tor
        var cx = -50;
        var cz = 40;

        // Well surround — cylinder base
        makecylinder(scene, 3, 3.2, 1, 16, 0x9A8A78, cx, 0.5, cz);
        // Well shaft (inner dark cylinder)
        makecylinder(scene, 2, 2, 1.2, 16, 0x3A2A1A, cx, 0.6, cz);
        // Well lid/cover frame
        makebox(scene, 5, 0.3, 5, 0x6A5A48, cx, 1.15, cz);
        // Well cover crossbeams
        makebox(scene, 6, 0.4, 0.4, 0x6A5A48, cx, 1.35, cz);
        makebox(scene, 0.4, 0.4, 6, 0x6A5A48, cx, 1.35, cz);

        // Vesica Piscis pattern — two overlapping ellipses suggested via box cross
        makebox(scene, 3, 0.15, 6, 0x8A9A78, cx, 0.08, cz + 8);
        makebox(scene, 3, 0.15, 6, 0x8A9A78, cx, 0.08, cz + 12);
        makebox(scene, 6, 0.15, 0.3, 0x8A9A78, cx, 0.08, cz + 9);
        makebox(scene, 6, 0.15, 0.3, 0x8A9A78, cx, 0.08, cz + 11);
        // Vertical axis line
        makebox(scene, 0.3, 0.15, 8, 0x7A8A68, cx, 0.08, cz + 10);

        // Garden hedges around well
        makebox(scene, 20, 1.5, 1, 0x2D5A27, cx, 0.75, cz - 12);
        makebox(scene, 20, 1.5, 1, 0x2D5A27, cx, 0.75, cz + 18);
        makebox(scene, 1, 1.5, 30, 0x2D5A27, cx - 10, 0.75, cz + 3);
        makebox(scene, 1, 1.5, 30, 0x2D5A27, cx + 10, 0.75, cz + 3);

        // Yew trees near well (cylinder trunk + cone canopy)
        makecylinder(scene, 0.4, 0.5, 4, 8, 0x5A3A1A, cx - 6, 2, cz - 6);
        makecone(scene, 2, 5, 8, 0x1A4A1A, cx - 6, 6.5, cz - 6);
        makecylinder(scene, 0.4, 0.5, 4, 8, 0x5A3A1A, cx + 6, 2, cz - 6);
        makecone(scene, 2, 5, 8, 0x1A4A1A, cx + 6, 6.5, cz - 6);

        // Red Spring water channel (flat box)
        makebox(scene, 0.6, 0.2, 10, 0x8A3A2A, cx, 0.1, cz + 6);
    }

    function buildfestival(scene) {
        // Glastonbury Festival site — Pyramid Stage and surroundings
        // Placed to the north of the tor
        var fx = -60;
        var fz = -80;

        // Pyramid Stage — large triangular-profile structure
        // Main stage body (box approximating pyramid profile)
        makebox(scene, 20, 12, 2, 0x8A8A8A, fx, 6, fz);
        // Pyramid triangular face — stacked shrinking boxes
        makebox(scene, 18, 2, 2.1, 0x9A9A9A, fx, 12, fz);
        makebox(scene, 14, 2, 2.1, 0x9A9A9A, fx, 14, fz);
        makebox(scene, 10, 2, 2.1, 0x9A9A9A, fx, 16, fz);
        makebox(scene, 6, 2, 2.1, 0x9A9A9A, fx, 18, fz);
        makebox(scene, 3, 2, 2.1, 0x9A9A9A, fx, 20, fz);
        // Pyramid peak
        makecone(scene, 2, 3, 4, 0xAAAAA0, fx, 22.5, fz);

        // Stage floor platform
        makebox(scene, 22, 1, 16, 0x6A6A6A, fx, 0.5, fz + 7);
        // Stage back wall
        makebox(scene, 22, 10, 1, 0x5A5A5A, fx, 5, fz + 15);

        // Speaker tower boxes flanking stage
        makebox(scene, 2, 16, 2, 0x5A5A5A, fx - 12, 8, fz + 6);
        makebox(scene, 2, 16, 2, 0x5A5A5A, fx + 12, 8, fz + 6);
        // Speaker cabinets on towers
        makebox(scene, 2.5, 3, 2.5, 0x3A3A3A, fx - 12, 16, fz + 6);
        makebox(scene, 2.5, 3, 2.5, 0x3A3A3A, fx + 12, 16, fz + 6);
        makebox(scene, 2.5, 3, 2.5, 0x3A3A3A, fx - 12, 12, fz + 6);
        makebox(scene, 2.5, 3, 2.5, 0x3A3A3A, fx + 12, 12, fz + 6);

        // Crowd barrier boxes in front of stage
        makebox(scene, 24, 1.2, 0.4, 0x7A7A7A, fx, 0.6, fz - 2);
        makebox(scene, 24, 1.2, 0.4, 0x7A7A7A, fx, 0.6, fz - 8);
        makebox(scene, 24, 1.2, 0.4, 0x7A7A7A, fx, 0.6, fz - 14);
        makebox(scene, 24, 1.2, 0.4, 0x7A7A7A, fx, 0.6, fz - 20);

        // Festival fence perimeter
        makebox(scene, 120, 2, 0.4, 0x5A5A4A, fx, 1, fz - 60);
        makebox(scene, 120, 2, 0.4, 0x5A5A4A, fx, 1, fz + 30);
        makebox(scene, 0.4, 2, 90, 0x5A5A4A, fx - 60, 1, fz - 15);
        makebox(scene, 0.4, 2, 90, 0x5A5A4A, fx + 60, 1, fz - 15);

        // Festival flag/totem poles
        var totempositions = [
            [-80, -70], [-40, -70], [-20, -70], [0, -70], [20, -70],
            [-80, -50], [ 20, -50]
        ];
        for (var i = 0; i < totempositions.length; i++) {
            makecylinder(scene, 0.2, 0.2, 10, 6, 0x8A7A5A,
                fx + totempositions[i][0], 5, fz + totempositions[i][1]);
            makebox(scene, 3, 1.5, 0.15, 0xCC4422,
                fx + totempositions[i][0], 10.5, fz + totempositions[i][1]);
        }

        // Vendor stalls (small boxes) in festival field
        var stalls = [
            [-30, -40], [-20, -40], [-10, -40], [0, -40], [10, -40],
            [-30, -30], [-20, -30], [-10, -30], [0, -30], [10, -30]
        ];
        for (var s = 0; s < stalls.length; s++) {
            makebox(scene, 4, 3, 3, 0xAA8844, fx + stalls[s][0], 1.5, fz + stalls[s][1]);
            makebox(scene, 5, 0.3, 4, 0xCC9933, fx + stalls[s][0], 3.15, fz + stalls[s][1]);
        }

        // Other festival stages (smaller)
        // Other Stage
        makebox(scene, 12, 7, 2, 0x7A8A7A, fx + 50, 3.5, fz - 10);
        makebox(scene, 12, 2, 2.1, 0x8A9A8A, fx + 50, 8.5, fz - 10);
        makebox(scene, 8, 2, 2.1, 0x8A9A8A, fx + 50, 10.5, fz - 10);
        makebox(scene, 4, 2, 2.1, 0x8A9A8A, fx + 50, 12.5, fz - 10);
        // Other Stage platform
        makebox(scene, 14, 1, 10, 0x5A6A5A, fx + 50, 0.5, fz - 5);
    }

    function buildgrounddetails(scene) {
        // Ground plane suggestion — large flat green box
        makebox(scene, 200, 0.5, 200, 0x4A6A2A, 0, -0.25, 0);

        // Scattered standing stones / Arthurian atmosphere
        var stones = [
            [-25, -15, 2, 4, 1.5, 0x7A7A78],
            [-28, -12, 1.5, 3.5, 1.2, 0x7A7A78],
            [25, -20, 1.8, 4.5, 1.6, 0x8A8A88],
            [-30, 30, 2, 3, 1.5, 0x7A7A78],
            [30, 25, 1.5, 4, 1.2, 0x8A8A88]
        ];
        for (var i = 0; i < stones.length; i++) {
            var st = stones[i];
            makebox(scene, st[2], st[3], st[4], st[5], st[0], st[3] / 2, st[1]);
        }

        // Pilgrim path from abbey toward tor base (flat box strips)
        makebox(scene, 3, 0.15, 50, 0xAA9A80, 40, 0.08, 30);

        // Hawthorn trees around site
        var hawthorns = [
            [-15, -25], [18, -20], [-22, 10], [15, 18], [-10, 35]
        ];
        for (var h = 0; h < hawthorns.length; h++) {
            makecylinder(scene, 0.3, 0.4, 3, 6, 0x5A3A1A,
                hawthorns[h][0], 1.5, hawthorns[h][1]);
            makesphere(scene, 2.5, 8, 6, 0x2D5A1A,
                hawthorns[h][0], 4.5, hawthorns[h][1]);
        }

        // Hill base stone perimeter markers
        var perimeter = [
            [20, 0], [-20, 0], [0, 20], [0, -20],
            [14, 14], [-14, 14], [14, -14], [-14, -14]
        ];
        for (var p = 0; p < perimeter.length; p++) {
            makebox(scene, 1.5, 0.6, 1, 0x8A8A78,
                perimeter[p][0], 0.3, perimeter[p][1]);
        }
    }

    function init(scene) {
        buildtor(scene);
        buildtower(scene);
        buildabbey(scene);
        buildchalicelwell(scene);
        buildfestival(scene);
        buildgrounddetails(scene);
    }

    return {
        init: init
    };

}());
