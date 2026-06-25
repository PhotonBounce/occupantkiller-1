window.OldSarum = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 16280;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeSphere(r, wSeg, hSeg, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, wSeg, hSeg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildHillfortMound() {
        // Outer ring 80x6x80
        var outer = makeBox(80, 6, 80, 0x8B7355, 0, 3, 0);
        addToScene(outer);
        // Mid ring 60x8x60
        var mid = makeBox(60, 8, 60, 0x8B7355, 0, 7, 0);
        addToScene(mid);
        // Inner ring 40x10x40
        var inner = makeBox(40, 10, 40, 0x8B7355, 0, 12, 0);
        addToScene(inner);
    }

    function buildOuterDitch() {
        // Dark ring slightly below ground suggesting excavation
        var ditch = makeBox(80, 6, 80, 0x2C1F0A, 0, -3, 0);
        addToScene(ditch);
    }

    function buildNormanCastleKeep() {
        // Main keep 20x16x20
        var keep = makeBox(20, 16, 20, 0xC4956A, 0, 25, 0);
        addToScene(keep);

        // Corner towers - 4 corners at keep edges
        var towerPositions = [
            [10, 0],
            [-10, 0],
            [0, 10],
            [0, -10]
        ];
        var i;
        for (i = 0; i < towerPositions.length; i++) {
            var tx = towerPositions[i][0];
            var tz = towerPositions[i][1];
            var tower = makeCylinder(3.5, 3.5, 24, 6, 0xB8906A, tx, 29, tz);
            addToScene(tower);
        }

        // Gate passage - dark opening
        var gate = makeBox(5, 10, 8, 0x222222, 0, 22, -14);
        addToScene(gate);
    }

    function buildCathedralRuins() {
        // Foundation walls - 4 low foundations
        var foundationN = makeBox(2, 4, 50, 0xD4C5A9, -25, 2, 0);
        addToScene(foundationN);
        var foundationS = makeBox(2, 4, 50, 0xD4C5A9, 25, 2, 0);
        addToScene(foundationS);
        var foundationE = makeBox(50, 4, 2, 0xD4C5A9, 0, 2, 25);
        addToScene(foundationE);
        var foundationW = makeBox(50, 4, 2, 0xD4C5A9, 0, 2, -25);
        addToScene(foundationW);

        // Standing wall stubs
        var wallStub1 = makeBox(2, 16, 10, 0xC8B890, -25, 10, -20);
        addToScene(wallStub1);
        var wallStub2 = makeBox(2, 16, 8, 0xC8B890, 25, 10, 15);
        addToScene(wallStub2);

        // Fallen column - horizontal (rotated 90 degrees on Z axis)
        var column = makeCylinder(2, 2, 18, 8, 0xD0C0B0, 5, 2, -10);
        column.rotation.z = Math.PI / 2;
        addToScene(column);
    }

    function buildIronAgeRampart() {
        // 3 outer rampart sections forming open-ended fort outline
        var rampart1 = makeBox(2.5, 12, 40, 0x7A6545, -55, 6, 0);
        addToScene(rampart1);
        var rampart2 = makeBox(40, 12, 2.5, 0x7A6545, -35, 6, 20);
        addToScene(rampart2);
        var rampart3 = makeBox(2.5, 12, 30, 0x7A6545, -15, 6, 5);
        addToScene(rampart3);
    }

    function buildViewingPlatform() {
        // Platform base 12x3x8
        var platform = makeBox(12, 3, 8, 0x888888, 35, 1.5, 35);
        addToScene(platform);

        // 8 guardrail posts 0.3x3x0.3
        var postPositions = [
            [-5.5, 35],
            [-3.5, 35],
            [-1.5, 35],
            [0.5, 35],
            [2.5, 35],
            [4.5, 35],
            [-5.5, 39],
            [4.5, 39]
        ];
        var i;
        for (i = 0; i < postPositions.length; i++) {
            var px = postPositions[i][0];
            var pz = postPositions[i][1];
            var post = makeBox(0.3, 3, 0.3, 0xAAAAAA, 35 + px, 4.5, pz);
            addToScene(post);
        }

        // Horizontal rail 12x0.3x0.3
        var rail = makeBox(12, 0.3, 0.3, 0xAAAAAA, 35, 5.9, 35);
        addToScene(rail);
    }

    function buildAncientRoad() {
        // Roman road 6x0.3x80
        var road = makeBox(6, 0.3, 80, 0xA0907A, 0, 0.15, 60);
        addToScene(road);

        // 4 milestones flanking road
        var milestonePositions = [
            [4, 30],
            [4, 50],
            [-4, 40],
            [-4, 70]
        ];
        var i;
        for (i = 0; i < milestonePositions.length; i++) {
            var mx = milestonePositions[i][0];
            var mz = milestonePositions[i][1];
            var milestone = makeCylinder(0.6, 0.6, 3, 8, 0xD4C5A9, mx, 1.5, mz);
            addToScene(milestone);
        }
    }

    function buildStonehengeVista() {
        // 8 standing stones in circle r=18 at z=-80
        var stoneCount = 8;
        var radius = 18;
        var i;
        for (i = 0; i < stoneCount; i++) {
            var angle = (i / stoneCount) * Math.PI * 2;
            var sx = Math.cos(angle) * radius;
            var sz = Math.sin(angle) * radius;
            var stone = makeBox(2, 10, 2, 0x888888, sx, 5, -80 + sz);
            addToScene(stone);
        }

        // 5 lintels across pairs
        var lintelAngles = [0, 1, 2, 3, 4];
        for (i = 0; i < lintelAngles.length; i++) {
            var la = (lintelAngles[i] / stoneCount) * Math.PI * 2;
            var lx = Math.cos(la) * radius;
            var lz = Math.sin(la) * radius;
            var lintel = makeBox(5, 2, 2, 0x888888, lx, 11, -80 + lz);
            addToScene(lintel);
        }

        // Horizon haze sphere r=40 half-buried
        var hazeSphere = makeSphere(40, 16, 16, 0xC8D0D8, 0, -20, -80);
        addToScene(hazeSphere);
    }

    function build() {
        buildHillfortMound();
        buildOuterDitch();
        buildNormanCastleKeep();
        buildCathedralRuins();
        buildIronAgeRampart();
        buildViewingPlatform();
        buildAncientRoad();
        buildStonehengeVista();
    }

    function update(delta) {
        // Static environment - no per-frame updates needed
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
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
