window.LymeRegisCobb = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 9320;
        var oz = 0;

        // 1. The Cobb — 6 box sections forming S-curve, each 8x2.5x3
        var cobbPositions = [
            [0, 1.25, 0, 0],
            [7, 1.25, -3, 0.3],
            [14, 1.25, -8, 0.8],
            [19, 1.25, -14, 1.2],
            [22, 1.25, -21, 0.5],
            [20, 1.25, -28, 0]
        ];
        for (var i = 0; i < cobbPositions.length; i++) {
            var cp = cobbPositions[i];
            var wallMesh = makebox(8, 2.5, 3, 0x888870, ox + cp[0], cp[1], oz + cp[2]);
            wallMesh.rotation.y = cp[3];
            // Upper walkway on top of each section
            makebox(6, 0.4, 3, 0x999980, ox + cp[0], 2.7, oz + cp[2]);
        }

        // 2. Harbour basin — flat 40x0.5x30, 0x336688
        makebox(40, 0.5, 30, 0x336688, ox - 10, 0.0, oz - 15);

        // 3. Fossil-bearing cliff — 2 large box sections
        makebox(20, 18, 6, 0x5A5A70, ox - 30, 9, oz + 10);
        makebox(30, 22, 8, 0x5A5A70, ox - 55, 11, oz + 8);

        // Fossil spiral shapes — 8 cylinders embedded in cliff face
        var fossilPositions = [
            [-28, 5, 7], [-32, 9, 7], [-36, 14, 7],
            [-24, 12, 7], [-40, 7, 7], [-44, 18, 7],
            [-50, 11, 11], [-54, 16, 11]
        ];
        for (var fi = 0; fi < fossilPositions.length; fi++) {
            var fp = fossilPositions[fi];
            makecylinder(0.3, 0.3, 0.1, 12, 0x8A7A60, ox + fp[0], fp[1], oz + fp[2]);
        }

        // 4. Mary Anning fossil shop — historic building 8x5x5
        makebox(8, 5, 5, 0x887755, ox - 5, 2.5, oz + 25);
        // Museum extension 10x6x4
        makebox(10, 6, 4, 0x997766, ox + 5, 3, oz + 27);
        // Ammonite display sphere 0.8r outside
        makesphere(0.8, 8, 8, 0xAA9966, ox + 1, 1.3, oz + 23);
        // Spiral box beside sphere
        makebox(0.4, 0.4, 0.3, 0x998855, ox + 2.5, 0.8, oz + 23);

        // 5. Town beach — Jurassic shingle: flat 50x0.5x15
        makebox(50, 0.5, 15, 0x8A8060, ox + 5, -0.25, oz + 40);

        // 6. Lyme Regis town — 8 Georgian/Regency buildings up steep hill
        var townColors = [0xCC9966, 0xBBAA77, 0xCC9966, 0xBBAA77, 0xCC9966, 0xBBAA77, 0xCC9966, 0xBBAA77];
        var townPositions = [
            [-15, 3, 30], [-8, 3.5, 35], [-1, 4, 38], [6, 4.5, 41],
            [13, 5, 44], [20, 5.5, 47], [27, 6, 50], [34, 6.5, 53]
        ];
        for (var ti = 0; ti < townPositions.length; ti++) {
            var tp = townPositions[ti];
            makebox(5, 6, 5, townColors[ti], ox + tp[0], tp[1], oz + tp[2]);
        }

        // 7. Marine Theatre — art deco seafront venue: 15x8x7
        makebox(15, 8, 7, 0xEEDDBB, ox + 20, 4, oz + 15);
        // Curved facade boxes
        makebox(4, 8, 1.5, 0xDDCCAA, ox + 13, 4, oz + 12);
        makebox(4, 8, 1.5, 0xDDCCAA, ox + 27, 4, oz + 12);
        // Poster boards outside
        makebox(2, 3, 0.2, 0xFFEECC, ox + 14, 2, oz + 11);
        makebox(2, 3, 0.2, 0xFFEECC, ox + 26, 2, oz + 11);

        // 8. The Pilot Boat pub — traditional 7x5x6
        makebox(7, 6, 5, 0x776655, ox + 8, 3, oz - 5);
        // Anchor cylinder at harbour entrance
        makecylinder(0.3, 0.3, 1.0, 8, 0x444444, ox + 12, 0.5, oz - 8);
        // Chain boxes (nautical themed props)
        makebox(0.3, 0.3, 0.3, 0x555555, ox + 12.5, 0.15, oz - 8.5);
        makebox(0.3, 0.3, 0.3, 0x555555, ox + 13.0, 0.15, oz - 9.0);
        makebox(0.3, 0.3, 0.3, 0x555555, ox + 13.5, 0.15, oz - 9.5);

        // 9. Rock Pool beach area — 3 flat box water sections 4x0.2x3
        var poolPositions = [
            [ox - 20, 0.1, oz + 48],
            [ox - 15, 0.1, oz + 50],
            [ox - 10, 0.1, oz + 47]
        ];
        for (var pi = 0; pi < poolPositions.length; pi++) {
            var pp = poolPositions[pi];
            makebox(4, 0.2, 3, 0x44AACC, pp[0], pp[1], pp[2]);
        }
        // Rock boxes 1x0.5x1 x8 surrounding pools
        var rockPositions = [
            [-22, 0.25, 47], [-22, 0.25, 51], [-18, 0.25, 46],
            [-18, 0.25, 52], [-12, 0.25, 46], [-8, 0.25, 46],
            [-8, 0.25, 51], [-12, 0.25, 52]
        ];
        for (var ri = 0; ri < rockPositions.length; ri++) {
            var rp = rockPositions[ri];
            makebox(1, 0.5, 1, 0x666655, ox + rp[0], rp[1], oz + rp[2]);
        }

        // 10. Jane Austen bench — bench box 2x0.3x0.5 + 2 legs + plaque
        makebox(2, 0.3, 0.5, 0x997744, ox - 25, 1.3, oz + 20);
        // Left leg
        makebox(0.1, 0.8, 0.1, 0x886633, ox - 26, 0.8, oz + 20);
        // Right leg
        makebox(0.1, 0.8, 0.1, 0x886633, ox - 24, 0.8, oz + 20);
        // Plaque box
        makebox(0.5, 0.1, 0.3, 0xCCAA55, ox - 25, 1.5, oz + 19.7);
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
