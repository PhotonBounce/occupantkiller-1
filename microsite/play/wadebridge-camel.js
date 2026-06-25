window.WadebridgeCamel = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 8680;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addobj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        addobj(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        addobj(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        addobj(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        addobj(mesh);
        return mesh;
    }

    function build() {
        buildriver();
        buildbridge();
        buildtown();
        buildtownhall();
        buildtrail();
        buildstation();
        buildmarket();
        buildtollbooth();
        buildwillows();
        buildhireshop();
    }

    function buildriver() {
        // River Camel — wide river flat 80x20x0.5, dark blue
        makebox(80, 0.5, 20, 0x225577, 0, -0.25, 0);
    }

    function buildbridge() {
        // Camel medieval bridge — represent every 3rd arch: 6 arch sections + 12 support cylinders
        // Arches span across the river (z-axis), bridge runs along x-axis
        // 6 arch box sections 3x4x4
        var archPositions = [-12, -7, -2, 3, 8, 13];
        for (var i = 0; i < archPositions.length; i++) {
            makebox(3, 4, 4, 0x998866, archPositions[i], 2.5, 0);
        }
        // 2 cylinder supports under each arch = 12 cylinders
        for (var j = 0; j < archPositions.length; j++) {
            makecyl(1, 1, 3, 8, 0x887755, archPositions[j] - 1, 0.5, 1);
            makecyl(1, 1, 3, 8, 0x887755, archPositions[j] + 1, 0.5, -1);
        }
    }

    function buildtown() {
        // Wadebridge town centre — 10 market buildings
        var buildings = [
            { w: 5, h: 5, d: 5, color: 0xBB9977, x: -30, z: -20 },
            { w: 6, h: 5, d: 5, color: 0xCC9966, x: -22, z: -20 },
            { w: 7, h: 5, d: 5, color: 0x887766, x: -14, z: -22 },
            { w: 5, h: 5, d: 6, color: 0xBB9977, x: -6,  z: -20 },
            { w: 8, h: 5, d: 5, color: 0xCC9966, x: 4,   z: -22 },
            { w: 5, h: 5, d: 6, color: 0x887766, x: 14,  z: -20 },
            { w: 6, h: 5, d: 5, color: 0xBB9977, x: 22,  z: -22 },
            { w: 7, h: 5, d: 5, color: 0xCC9966, x: -30, z: -30 },
            { w: 5, h: 5, d: 6, color: 0x887766, x: -20, z: -30 },
            { w: 8, h: 5, d: 5, color: 0xBB9977, x: -10, z: -30 }
        ];
        for (var i = 0; i < buildings.length; i++) {
            var b = buildings[i];
            makebox(b.w, b.h, b.d, b.color, b.x, b.h / 2, b.z);
        }
    }

    function buildtownhall() {
        // Civic building 12x8x10
        makebox(12, 8, 10, 0xBBAA88, 30, 4, -25);
        // Clock tower 3x3x14
        makebox(3, 14, 3, 0xBBAA88, 30, 7, -22);
        // Cone roof on tower
        makecone(1.5, 3, 8, 0x887766, 30, 15.5, -22);
    }

    function buildtrail() {
        // Camel Trail cycle path — 3 box sections 3x0.2x30, tarmac
        makebox(3, 0.2, 30, 0x444444, -50, 0.1, 0);
        makebox(3, 0.2, 30, 0x444444, -50, 0.1, 30);
        makebox(3, 0.2, 30, 0x444444, -50, 0.1, 60);
        // Wooden marker posts along trail
        var postPositions = [-10, 0, 10, -10, 0, 10];
        var postZ = [0, 0, 0, 30, 30, 30];
        for (var i = 0; i < postPositions.length; i++) {
            makecyl(0.1, 0.1, 1.5, 6, 0x885533, -48 + postPositions[i] * 0.1, 0.75, postZ[i]);
        }
    }

    function buildstation() {
        // Old railway station — converted station building 20x8x5
        makebox(20, 8, 5, 0xBBAA88, -60, 4, -15);
        // Platform canopy: thin box 16x0.3x4 on 4 pillars 0.3x0.3x3
        makebox(16, 0.3, 4, 0xAA9977, -60, 8.15, -11);
        makecyl(0.15, 0.15, 3, 6, 0x887766, -67, 1.5, -11);
        makecyl(0.15, 0.15, 3, 6, 0x887766, -61, 1.5, -11);
        makecyl(0.15, 0.15, 3, 6, 0x887766, -55, 1.5, -11);
        makecyl(0.15, 0.15, 3, 6, 0x887766, -49, 1.5, -11);
    }

    function buildmarket() {
        // Farmers market stalls — 5 green canopy stalls
        var stallX = [-5, 0, 5, 10, 15];
        var stallZ = [-40, -40, -40, -40, -40];
        for (var i = 0; i < 5; i++) {
            var sx = stallX[i];
            var sz = stallZ[i];
            // Canopy box 3x0.2x3
            makebox(3, 0.2, 3, 0x336622, sx, 2.6, sz);
            // 4 cylinder poles 0.2r x 2.5h
            makecyl(0.1, 0.1, 2.5, 6, 0x885533, sx - 1.3, 1.25, sz - 1.3);
            makecyl(0.1, 0.1, 2.5, 6, 0x885533, sx + 1.3, 1.25, sz - 1.3);
            makecyl(0.1, 0.1, 2.5, 6, 0x885533, sx - 1.3, 1.25, sz + 1.3);
            makecyl(0.1, 0.1, 2.5, 6, 0x885533, sx + 1.3, 1.25, sz + 1.3);
        }
    }

    function buildtollbooth() {
        // Bridge toll booth ruin — small stone booth 2x2x3
        makebox(2, 3, 2, 0x998866, -16, 1.5, -3);
    }

    function buildwillows() {
        // Riverside willow trees — 5 trees
        var treeX = [20, 28, 36, -20, -28];
        var treeZ = [12, 10, 13, 11, 12];
        for (var i = 0; i < 5; i++) {
            // Trunk CylinderGeometry 0.3r x 5h
            makecyl(0.3, 0.3, 5, 8, 0x665533, treeX[i], 2.5, treeZ[i]);
            // Canopy SphereGeometry 4r
            makesphere(4, 8, 6, 0x558833, treeX[i], 7, treeZ[i]);
        }
    }

    function buildhireshop() {
        // Cycle hire shop — converted building 8x6x4
        makebox(8, 6, 4, 0x4488AA, -42, 3, -15);
        // Bicycle rack: bar box 2x0.1x0.5 on 2 post cylinders 0.1r x 0.8h
        makebox(2, 0.1, 0.5, 0x666666, -42, 0.85, -12);
        makecyl(0.1, 0.1, 0.8, 6, 0x666666, -43, 0.4, -12);
        makecyl(0.1, 0.1, 0.8, 6, 0x666666, -41, 0.4, -12);
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
