window.TintagelPost = (function() {
    'use strict';

    var WX = 3700;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        return mesh;
    }

    function makeWireBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(WX + x, y, WZ + z);
        return lines;
    }

    function buildHeadland(group) {
        // Main headland plateau — dark rock
        group.add(makeBox(120, 18, 80, 0x3A3A4A, -20, 9, 0));
        // Headland nose jutting further out
        group.add(makeBox(40, 14, 30, 0x3A3A4A, -75, 7, -5));
        // Cliff face front
        group.add(makeBox(120, 10, 6, 0x2A2A38, -20, 3, -43));
        // Side cliff west
        group.add(makeBox(6, 10, 80, 0x2A2A38, -83, 3, 0));
        // Rock shelf at base
        group.add(makeBox(30, 4, 20, 0x4A4A5A, -60, 1, -35));
    }

    function buildIsland(group) {
        // Island mass — separated chunk
        group.add(makeBox(70, 16, 55, 0x3A3A4A, 80, 8, -10));
        // Island cliff edge
        group.add(makeBox(70, 8, 5, 0x2A2A38, 80, 4, -35));
        // Island inner slope
        group.add(makeBox(50, 6, 20, 0x3A3A4A, 80, 3, 10));
    }

    function buildMainlandRuins(group) {
        // Great hall long wall fragment
        group.add(makeBox(28, 10, 2, 0x7A6A5A, 0, 5 + 18, -30));
        // Side wall stub east
        group.add(makeBox(2, 8, 14, 0x7A6A5A, 14, 4 + 18, -23));
        // Side wall stub west
        group.add(makeBox(2, 8, 14, 0x7A6A5A, -14, 4 + 18, -23));
        // Corner tower stump north-east
        group.add(makeCylinder(3, 3.5, 12, 8, 0x6A5A4A, 16, 6 + 18, -32));
        // Corner tower stump north-west
        group.add(makeCylinder(3, 3.5, 12, 8, 0x6A5A4A, -16, 6 + 18, -32));
        // Tumbled wall blocks scattered
        group.add(makeBox(5, 3, 3, 0x7A6A5A, -5, 1.5 + 18, -20));
        group.add(makeBox(4, 2, 4, 0x7A6A5A, 8, 1 + 18, -18));
        group.add(makeBox(6, 2.5, 3, 0x6A5A4A, -10, 1.25 + 18, -15));
        // Inner courtyard remnant wall
        group.add(makeBox(18, 6, 2, 0x7A6A5A, 0, 3 + 18, -10));
        // Gate arch base left
        group.add(makeBox(2, 8, 3, 0x7A6A5A, -5, 4 + 18, -10));
        // Gate arch base right
        group.add(makeBox(2, 8, 3, 0x7A6A5A, 5, 4 + 18, -10));
        // Lintel suggestion
        group.add(makeBox(12, 2, 3, 0x7A6A5A, 0, 9 + 18, -10));
    }

    function buildIslandRuins(group) {
        // Island upper hall north wall
        group.add(makeBox(30, 9, 2, 0x7A6A5A, 80, 4.5 + 16, -25));
        // East wall partial
        group.add(makeBox(2, 9, 22, 0x7A6A5A, 95, 4.5 + 16, -14));
        // West wall partial
        group.add(makeBox(2, 7, 16, 0x7A6A5A, 65, 3.5 + 16, -18));
        // Island tower stump
        group.add(makeCylinder(4, 5, 14, 8, 0x6A5A4A, 90, 7 + 16, -20));
        // Tumbled island stones
        group.add(makeBox(4, 2, 4, 0x7A6A5A, 75, 1 + 16, -8));
        group.add(makeBox(5, 3, 3, 0x7A6A5A, 68, 1.5 + 16, -5));
        group.add(makeBox(3, 2, 5, 0x6A5A4A, 85, 1 + 16, 5));
        // Chapel ruin
        group.add(makeBox(14, 6, 10, 0x7A6A5A, 78, 3 + 16, 15));
        group.add(makeBox(14, 2, 2, 0x8A7A6A, 78, 0.5 + 16, 15));
    }

    function buildFootbridge(group) {
        // Bridge deck — single span steel box
        group.add(makeBox(60, 2, 4, 0x888888, 30, 15, -2));
        // Left railing
        group.add(makeBox(60, 1, 0.3, 0x999999, 30, 16.5, 0));
        // Right railing
        group.add(makeBox(60, 1, 0.3, 0x999999, 30, 16.5, -4));
        // Support post west
        group.add(makeBox(1, 14, 1, 0x888888, 0, 8, -2));
        // Support post east
        group.add(makeBox(1, 14, 1, 0x888888, 60, 8, -2));
        // Diagonal brace west left
        group.add(makeBox(10, 0.5, 0.5, 0x888888, 5, 12, 0));
        // Diagonal brace west right
        group.add(makeBox(10, 0.5, 0.5, 0x888888, 5, 12, -4));
        // Diagonal brace east left
        group.add(makeBox(10, 0.5, 0.5, 0x888888, 55, 12, 0));
        // Diagonal brace east right
        group.add(makeBox(10, 0.5, 0.5, 0x888888, 55, 12, -4));
        // Wireframe detail
        group.add(makeWireBox(60, 2, 4, 0x666666, 30, 15, -2));
    }

    function buildMerlinsCave(group) {
        // Cave overhang top block — dark
        group.add(makeBox(22, 8, 18, 0x2A2030, -55, 4 + 0, 40));
        // Cave mouth gap is implied by open space below overhang
        // Cave back wall
        group.add(makeBox(22, 6, 2, 0x1A1828, -55, 3, 50));
        // Cave floor/shelf
        group.add(makeBox(20, 2, 14, 0x3A3040, -55, 0, 43));
        // Left cave wall
        group.add(makeBox(2, 6, 18, 0x2A2030, -67, 3, 40));
        // Right cave wall
        group.add(makeBox(2, 6, 18, 0x2A2030, -43, 3, 40));
        // Stalactite suggestions — cones hanging down from overhang
        group.add(makeCone(0.5, 2, 6, 0x1A1828, -50, 3.5, 42));
        group.add(makeCone(0.5, 1.5, 6, 0x1A1828, -55, 3.5, 44));
        group.add(makeCone(0.5, 2, 6, 0x1A1828, -60, 3.5, 41));
        // Dark water inside cave
        group.add(makeBox(18, 1, 12, 0x0A1A3A, -55, -0.5, 42));
    }

    function buildAtlanticSurf(group) {
        var waveColor = 0x1A5A8A;
        var sprayColor = 0xDDEEFF;

        // Long wave crests — stacked box slabs at cliff base
        group.add(makeBox(100, 3, 8, waveColor, -20, 1.5, 55));
        group.add(makeBox(80, 2, 6, waveColor, -20, 0.8, 48));
        group.add(makeBox(60, 2.5, 7, waveColor, -10, 1.2, 62));
        // Smaller breaking wave boxes
        group.add(makeBox(20, 4, 5, 0x2A6A9A, -50, 2, 52));
        group.add(makeBox(15, 3, 4, 0x2A6A9A, 30, 1.5, 56));
        group.add(makeBox(18, 3.5, 5, 0x2A6A9A, 10, 2, 58));
        // Deep water beyond
        group.add(makeBox(160, 1, 40, 0x0A2A5A, -20, 0, 80));
        // White spray sphere clusters at cliff base
        group.add(makeSphere(3, 6, 5, sprayColor, -40, 4, 48));
        group.add(makeSphere(2.5, 6, 5, sprayColor, -30, 3.5, 50));
        group.add(makeSphere(2, 6, 4, sprayColor, -20, 3, 46));
        group.add(makeSphere(3, 6, 5, sprayColor, 0, 4, 52));
        group.add(makeSphere(2, 6, 4, sprayColor, 20, 3, 49));
        group.add(makeSphere(2.5, 6, 5, sprayColor, -60, 4, 50));
        group.add(makeSphere(1.5, 5, 4, sprayColor, -55, 5, 46));
        group.add(makeSphere(1.5, 5, 4, sprayColor, 10, 5, 53));
        // Island surf
        group.add(makeBox(50, 2, 6, waveColor, 80, 1, 35));
        group.add(makeSphere(2, 6, 4, sprayColor, 65, 3, 32));
        group.add(makeSphere(2.5, 6, 5, sprayColor, 90, 3.5, 33));
    }

    function buildGallosStatue(group) {
        // Gallos — dark bronze silhouette sculpture on headland promontory
        // Body — main torso box 2x8x1
        group.add(makeBox(2, 8, 1, 0x3A3A3A, -72, 4 + 18, -35));
        // Head — small box on top
        group.add(makeBox(1.5, 1.8, 1, 0x3A3A3A, -72, 9.9 + 18, -35));
        // Left arm extended
        group.add(makeBox(4, 0.8, 0.8, 0x3A3A3A, -74.5, 7 + 18, -35));
        // Right arm at side
        group.add(makeBox(0.8, 4, 0.8, 0x3A3A3A, -71, 5 + 18, -35));
        // Legs — two pillars
        group.add(makeBox(0.8, 4, 0.8, 0x3A3A3A, -71.4, 0 + 18, -35));
        group.add(makeBox(0.8, 4, 0.8, 0x3A3A3A, -72.6, 0 + 18, -35));
        // Sword hint — tall thin cone
        group.add(makeCone(0.2, 5, 4, 0x555555, -74, 8.5 + 18, -35));
        // Plinth
        group.add(makeBox(3, 1.5, 2, 0x5A5A5A, -72, 0.75 + 18, -35));
        // Rocky promontory base
        group.add(makeBox(10, 3, 10, 0x3A3A4A, -72, -0.5 + 18, -35));
    }

    function buildAmbient(group) {
        // Scattered coastal rocks around headland
        group.add(makeBox(6, 3, 5, 0x4A4A5A, -30, 1.5 + 18, -38));
        group.add(makeBox(4, 2, 4, 0x3A3A4A, 20, 1 + 18, -35));
        group.add(makeBox(3, 2, 3, 0x4A4A5A, -10, 1 + 18, -36));
        // Narrow ravine cleft between headland and island
        group.add(makeBox(4, 20, 30, 0x1A1A28, 30, 0, -5));
        // Coastal path markers (cylinder posts)
        group.add(makeCylinder(0.2, 0.2, 3, 6, 0x8A8A8A, -25, 1.5 + 18, -25));
        group.add(makeCylinder(0.2, 0.2, 3, 6, 0x8A8A8A, -15, 1.5 + 18, -28));
        group.add(makeCylinder(0.2, 0.2, 3, 6, 0x8A8A8A, -5, 1.5 + 18, -28));
        // Interpretive panel post pair
        group.add(makeCylinder(0.3, 0.3, 4, 6, 0x888888, -35, 2 + 18, -20));
        group.add(makeBox(4, 3, 0.3, 0x886644, -35, 3.5 + 18, -20));
        // Small cairn of stones
        group.add(makeBox(1.5, 1.5, 1.5, 0x6A6A7A, 5, 0.75 + 18, -30));
        group.add(makeBox(1.2, 1, 1.2, 0x5A5A6A, 5, 2 + 18, -30));
        group.add(makeBox(0.8, 0.8, 0.8, 0x6A6A7A, 5, 2.9 + 18, -30));
        // Seabirds — tiny sphere dots
        group.add(makeSphere(0.3, 4, 3, 0xCCCCCC, -40, 35, -50));
        group.add(makeSphere(0.3, 4, 3, 0xCCCCCC, -35, 38, -45));
        group.add(makeSphere(0.3, 4, 3, 0xCCCCCC, 10, 32, -55));
    }

    function build(scene) {
        var group = new THREE.Group();

        buildHeadland(group);
        buildIsland(group);
        buildMainlandRuins(group);
        buildIslandRuins(group);
        buildFootbridge(group);
        buildMerlinsCave(group);
        buildAtlanticSurf(group);
        buildGallosStatue(group);
        buildAmbient(group);

        scene.add(group);
        return group;
    }

    return {
        build: build
    };

}());
