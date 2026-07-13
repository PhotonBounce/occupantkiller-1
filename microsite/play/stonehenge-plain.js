window.StonehengsPlain = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 9880;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildstonehenge();
        buildplain();
        buildavebury();
        buildwoodhenge();
        buildmilitarycamp();
        buildlongbarrow();
        buildavenue();
        buildvisitorscentre();
        buildsolstice();
        buildcropcircle();
    }

    function buildstonehenge() {
        // Outer sarsen circle — 17 upright stones arranged in 15m radius
        var uprightCount = 17;
        var outerRadius = 15;
        for (var i = 0; i < uprightCount; i++) {
            var angle = (i / uprightCount) * Math.PI * 2;
            var sx = Math.cos(angle) * outerRadius;
            var sz = Math.sin(angle) * outerRadius;
            makecyl(0.8, 0.8, 4, 0x888870, sx, 2, sz);
        }
        // 8 lintel capstones bridging adjacent uprights
        var lintelCount = 8;
        for (var j = 0; j < lintelCount; j++) {
            var la = ((j + 0.5) / uprightCount) * Math.PI * 2;
            var lx = Math.cos(la) * outerRadius;
            var lz = Math.sin(la) * outerRadius;
            var lm = makebox(2.5, 0.8, 0.8, 0x888870, lx, 4.4, lz);
            lm.rotation.y = la;
        }
        // Inner trilithon horseshoe — 5 trilithon sets
        var trilithonAngles = [
            -0.4, 0.0, 0.4, 0.8, -0.8
        ];
        var innerRadius = 7;
        for (var k = 0; k < 5; k++) {
            var ta = trilithonAngles[k];
            var tx1 = Math.cos(ta) * innerRadius + Math.sin(ta) * 1.5;
            var tz1 = Math.sin(ta) * innerRadius - Math.cos(ta) * 1.5;
            var tx2 = Math.cos(ta) * innerRadius - Math.sin(ta) * 1.5;
            var tz2 = Math.sin(ta) * innerRadius + Math.cos(ta) * 1.5;
            makecyl(1, 1, 5.5, 0x888870, tx1, 2.75, tz1);
            makecyl(1, 1, 5.5, 0x888870, tx2, 2.75, tz2);
            var tlx = Math.cos(ta) * innerRadius;
            var tlz = Math.sin(ta) * innerRadius;
            var tlm = makebox(3, 1, 1, 0x888870, tlx, 5.5 + 0.5, tlz);
            tlm.rotation.y = ta;
        }
        // Central Altar Stone
        makebox(1.5, 0.3, 0.7, 0x888870, 0, 0.15, 0);
        // Heel Stone — leaning cylinder slightly offset
        var hm = makecyl(1, 1, 5, 0x888870, 20, 2.5, -2);
        hm.rotation.z = 0.15;
    }

    function buildplain() {
        // Chalk plain ground — Salisbury Plain flat 100×0.5×80
        makebox(100, 0.5, 80, 0xD4D0A0, 0, -0.25, 0);
    }

    function buildavebury() {
        // Avebury village — offset to the north-west of Stonehenge
        var ax = -60;
        var az = -50;
        // Large outer earthwork bank — 4 box sections forming ring
        makebox(15, 1, 3, 0xBBBB99, ax,         0.5, az - 18);
        makebox(15, 1, 3, 0xBBBB99, ax,         0.5, az + 18);
        makebox(3,  1, 39, 0xBBBB99, ax - 18,   0.5, az);
        makebox(3,  1, 39, 0xBBBB99, ax + 18,   0.5, az);
        // 12 standing stones outer ring
        var aveStones = 12;
        var aveRad = 20;
        for (var i = 0; i < aveStones; i++) {
            var a = (i / aveStones) * Math.PI * 2;
            var sx = ax + Math.cos(a) * aveRad;
            var sz = az + Math.sin(a) * aveRad;
            makecyl(0.5, 0.5, 2.5, 0x888870, sx, 1.25, sz);
        }
        // Village pub / houses — 3 buildings inside circle
        makebox(4, 5, 5, 0xCC9966, ax - 8,  2.5, az - 6);
        makebox(4, 5, 5, 0xCC9966, ax,      2.5, az - 6);
        makebox(4, 5, 5, 0xCC9966, ax + 8,  2.5, az - 6);
    }

    function buildwoodhenge() {
        // Woodhenge — timber circle site, offset east of Stonehenge
        var wx = 35;
        var wz = -30;
        // 3 concentric rings of post stumps (6+6+6 = 18 total)
        var radi = [6, 10, 14];
        var countsPerRing = [6, 6, 6];
        for (var r = 0; r < 3; r++) {
            for (var p = 0; p < countsPerRing[r]; p++) {
                var a = (p / countsPerRing[r]) * Math.PI * 2;
                var px = wx + Math.cos(a) * radi[r];
                var pz = wz + Math.sin(a) * radi[r];
                makecyl(0.4, 0.4, 1, 0x8B5E3C, px, 0.5, pz);
            }
        }
        // Central grave marker
        makebox(1, 0.1, 0.6, 0x666655, wx, 0.05, wz);
    }

    function buildmilitarycamp() {
        // Army barracks — south of Stonehenge
        var mx = 20;
        var mz = 30;
        // 4 box barracks buildings
        makebox(15, 5, 4, 0x667755, mx,      2.5, mz);
        makebox(15, 5, 4, 0x667755, mx,      2.5, mz + 8);
        makebox(15, 5, 4, 0x667755, mx,      2.5, mz + 16);
        makebox(15, 5, 4, 0x667755, mx,      2.5, mz + 24);
        // Perimeter fence — 5 sections
        makebox(0.1, 2, 20, 0x555555, mx - 10, 1, mz + 12);
        makebox(0.1, 2, 20, 0x555555, mx + 10, 1, mz + 12);
        makebox(20, 2, 0.1, 0x555555, mx,      1, mz - 2);
        makebox(20, 2, 0.1, 0x555555, mx,      1, mz + 26);
        makebox(0.1, 2, 20, 0x555555, mx,      1, mz + 12);
        // Guard post
        makebox(2, 3, 2, 0x667755, mx - 10, 1.5, mz - 2);
    }

    function buildlongbarrow() {
        // Neolithic long barrow — burial mound, west of Stonehenge
        var bx = -40;
        var bz = 10;
        // Long mound using box
        makebox(20, 2, 8, 0x8A8A70, bx, 1, bz);
        // Entrance facade — 2 uprights + capstone
        makebox(0.4, 1.5, 0.4, 0x888870, bx + 10, 0.75, bz - 1);
        makebox(0.4, 1.5, 0.4, 0x888870, bx + 10, 0.75, bz + 1);
        makebox(2,   0.3, 0.4, 0x888870, bx + 10, 1.65, bz);
    }

    function buildavenue() {
        // Stonehenge Avenue — 2 parallel low banks leading NE to monument
        makebox(0.5, 0.5, 40, 0xCCCC88, 5,  0.25, -25);
        makebox(0.5, 0.5, 40, 0xCCCC88, -5, 0.25, -25);
    }

    function buildvisitorscentre() {
        // Modern visitors centre — north-west approach
        var vx = -30;
        var vz = 25;
        // Main building
        makebox(20, 6, 5, 0xEEEEEE, vx, 3, vz);
        // Cafe annex
        makebox(8, 4, 5, 0xDDDDDD, vx + 14, 2, vz);
        // Exhibition hall
        makebox(10, 5, 8, 0xE8E8E8, vx - 15, 2.5, vz);
        // Carpark
        makebox(30, 0.3, 20, 0x444444, vx, 0.15, vz + 18);
    }

    function buildsolstice() {
        // Solstice sunrise alignment observation point
        // 3 viewing stones aligned toward Heel Stone direction
        makebox(0.4, 1, 0.5, 0x888870, 10, 0.5, -8);
        makebox(0.4, 1, 0.5, 0x888870, 12, 0.5, -10);
        makebox(0.4, 1, 0.5, 0x888870, 14, 0.5, -12);
    }

    function buildcropcircle() {
        // Crop circle — east field
        var cx = 50;
        var cz = -20;
        // 3 concentric ring cylinders (flattened)
        makecyl(8,  8,  0.1, 0xCCCC88, cx, 0.05, cz);
        makecyl(13, 13, 0.1, 0xCCCC88, cx, 0.05, cz);
        makecyl(18, 18, 0.1, 0xCCCC88, cx, 0.05, cz);
        // Centre flat
        makebox(5, 0.1, 5, 0xCCCC88, cx, 0.05, cz);
    }

    function update(delta) { }

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
