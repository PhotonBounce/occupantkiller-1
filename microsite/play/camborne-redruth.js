window.CamborneRedruth = (function() {
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
        mesh.position.set(8520 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8520 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8520 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8520 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        // 1. Mine engine house cluster — 5 Victorian engine houses
        var enginePositions = [
            [-60, 0, -80],
            [-40, 0, -50],
            [-80, 0, -20],
            [-20, 0, -90],
            [-70, 0, 20]
        ];
        for (var i = 0; i < enginePositions.length; i++) {
            var ep = enginePositions[i];
            // Engine house body 6x10x5 (w,h,d)
            makebox(6, 10, 5, 0x888870, ep[0], 5, ep[2]);
            // Chimney cylinder 1r x 14h
            makecylinder(1, 1, 14, 0x8B4513, ep[0] + 4, 14, ep[2]);
        }

        // 2. Camborne town hall — Victorian civic building 16x10x12
        makebox(16, 10, 12, 0x998870, 0, 5, 0);
        // Clock tower 4x16x4
        makebox(4, 16, 4, 0x998870, 10, 8, 0);
        // Copper cone roof on clock tower
        makecone(2, 4, 0x228B22, 10, 18, 0);

        // 3. Pool industrial estate — 4 large warehouse sheds 20x10x6
        var warehousePositions = [
            [60, 0, -40],
            [85, 0, -40],
            [60, 0, -20],
            [85, 0, -20]
        ];
        for (var j = 0; j < warehousePositions.length; j++) {
            var wp = warehousePositions[j];
            makebox(20, 10, 6, 0x778890, wp[0], 5, wp[2]);
        }

        // 4. Trevithick statue — pedestal + head + body
        // Cylinder pedestal 1.5r x 3h
        makecylinder(1.5, 1.5, 3, 0x888880, 20, 1.5, 30);
        // Body box 1x2x0.5
        makebox(1, 2, 0.5, 0x886655, 20, 4, 30);
        // Head sphere 0.8r
        makesphere(0.8, 0xDDAA88, 20, 5.8, 30);

        // 5. Victorian terraces — 3 rows of 6 houses each
        var rowOffsets = [
            [-30, 0, 40],
            [-30, 0, 55],
            [-30, 0, 70]
        ];
        for (var r = 0; r < rowOffsets.length; r++) {
            var ro = rowOffsets[r];
            for (var h = 0; h < 6; h++) {
                var hx = ro[0] + h * 5;
                // House body 4x5x5
                makebox(4, 5, 5, 0xCC9966, hx, 2.5, ro[2]);
                // Chimney 0.3r x 2h
                makecylinder(0.3, 0.3, 2, 0x885533, hx, 6, ro[2]);
            }
        }

        // 6. Heartlands heritage site — 3 restored engine houses 8x6x10
        var heartlandPositions = [
            [40, 0, 60],
            [52, 0, 60],
            [64, 0, 60]
        ];
        for (var k = 0; k < heartlandPositions.length; k++) {
            var hp = heartlandPositions[k];
            makebox(8, 10, 6, 0x9A8060, hp[0], 5, hp[2]);
        }
        // Exhibition centre 20x12x6
        makebox(20, 12, 6, 0xEEEEEE, 52, 6, 74);

        // 7. Redruth market street — 6 shopfront buildings 5x4x5
        var shopColors = [0xBB9966, 0xCC8855, 0xBB9966, 0xCC8855, 0xBB9966, 0xCC8855];
        for (var s = 0; s < 6; s++) {
            makebox(5, 4, 5, shopColors[s], -60 + s * 7, 2, 50);
        }

        // 8. Pool retail park — big box store 30x15x8
        makebox(30, 15, 8, 0x667788, 80, 7.5, 30);
        // Car park lamp posts: cylinder 0.2r x 6h x 4
        var lampPositions = [
            [65, 0, 20],
            [65, 0, 42],
            [98, 0, 20],
            [98, 0, 42]
        ];
        for (var l = 0; l < lampPositions.length; l++) {
            var lp = lampPositions[l];
            makecylinder(0.2, 0.2, 6, 0x999999, lp[0], 3, lp[2]);
        }

        // 9. Mineral tramway path — 2 parallel rail boxes 0.15x0.1x40
        makebox(0.15, 0.1, 40, 0x333333, -10, 0.05, -30);
        makebox(0.15, 0.1, 40, 0x333333, -11.5, 0.05, -30);

        // 10. Cornish hedge walls — 4 stone earthen banks 10x1.5x0.8
        var wallPositions = [
            [-90, 0, 0],
            [-90, 0, 20],
            [10, 0, -110],
            [30, 0, -110]
        ];
        for (var w = 0; w < wallPositions.length; w++) {
            var wpos = wallPositions[w];
            makebox(10, 1.5, 0.8, 0x887055, wpos[0], 0.75, wpos[2]);
        }
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
