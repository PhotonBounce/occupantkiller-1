window.WellsCathedral = (function() {
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

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 9640;
        var oz = 0;

        // Cathedral Close — medieval precinct ground
        makebox(80, 0.5, 60, 0x447730, ox + 0, 0, oz + 0);

        // Wells Cathedral nave
        makebox(38, 16, 14, 0x998866, ox + 0, 8, oz + 0);

        // West front facade
        makebox(22, 20, 1, 0x998866, ox - 19, 10, oz + 0);

        // West front statue niches — 9 box panels in a 3×3 grid
        var nicheColors = [0xAA9977, 0xAA9977, 0xAA9977, 0xAA9977, 0xAA9977, 0xAA9977, 0xAA9977, 0xAA9977, 0xAA9977];
        var nicheRow = 0;
        var nicheCol = 0;
        for (nicheRow = 0; nicheRow < 3; nicheRow++) {
            for (nicheCol = 0; nicheCol < 3; nicheCol++) {
                makebox(3, 3, 0.3, nicheColors[nicheRow * 3 + nicheCol],
                    ox - 19 + (nicheCol - 1) * 6,
                    5 + nicheRow * 6,
                    oz + 0.2);
            }
        }

        // Twin west towers
        makebox(5, 24, 5, 0x998866, ox - 14, 12, oz - 7);
        makebox(5, 24, 5, 0x998866, ox - 14, 12, oz + 7);

        // Central tower
        makebox(6, 22, 6, 0x998866, ox + 0, 11, oz + 0);

        // Two transepts
        makebox(10, 14, 10, 0x998866, ox + 5, 7, oz - 12);
        makebox(10, 14, 10, 0x998866, ox + 5, 7, oz + 12);

        // Chapter House — octagonal: 8 box sides in ring
        var chx = ox + 18;
        var chz = oz + 15;
        var chRadius = 7;
        var i = 0;
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var cx = chx + Math.sin(angle) * chRadius;
            var cz = chz + Math.cos(angle) * chRadius;
            makebox(4, 7, 0.5, 0x998866, cx, 3.5, cz);
        }
        // Chapter House roof cone
        makecone(8, 5, 8, 0x887755, chx, 10.5, chz);

        // Bishop's Palace — main range
        makebox(25, 12, 10, 0x887755, ox - 30, 6, oz + 30);

        // Bishop's Palace tower
        makebox(6, 16, 6, 0x887755, ox - 40, 8, oz + 30);

        // Moat — flat water surface
        makebox(60, 0.5, 8, 0x336688, ox - 30, 0.3, oz + 45);

        // Moat surrounding walls (4 sides)
        makebox(60, 3, 1, 0x887755, ox - 30, 1.5, oz + 49);
        makebox(60, 3, 1, 0x887755, ox - 30, 1.5, oz + 41);
        makebox(1, 3, 8, 0x887755, ox - 60, 1.5, oz + 45);
        makebox(1, 3, 8, 0x887755, ox + 0, 1.5, oz + 45);

        // Swans on moat — 3 swan figures
        var swanPositions = [
            [ox - 20, oz + 45],
            [ox - 30, oz + 44],
            [ox - 40, oz + 46]
        ];
        for (i = 0; i < 3; i++) {
            var sx = swanPositions[i][0];
            var sz = swanPositions[i][1];
            // Swan body
            makesphere(0.5, 8, 8, 0xEEEEEE, sx, 1.5, sz);
            // Swan neck cylinder
            makecylinder(0.1, 0.1, 0.6, 6, 0xEEEEEE, sx, 2.2, sz);
            // Swan head
            makesphere(0.3, 8, 8, 0xEEEEEE, sx, 2.7, sz);
        }

        // Swans bell tower
        makebox(2, 6, 2, 0x887755, ox - 25, 3, oz + 42);
        // Bell
        makecylinder(0.5, 0.5, 0.4, 8, 0xBBAA55, ox - 25, 6.2, oz + 42);
        // Hanging rope
        makebox(0.1, 3, 0.1, 0x886644, ox - 25, 4.5, oz + 42);

        // Vicars' Close — narrow lane
        makebox(2, 0.2, 40, 0x887766, ox + 35, 0.1, oz + 0);

        // Vicars' Close houses — 7 on each side
        var houseIndex = 0;
        for (houseIndex = 0; houseIndex < 7; houseIndex++) {
            var houseZ = oz - 18 + houseIndex * 6;
            makebox(3, 5, 4, 0xCC9966, ox + 32, 2.5, houseZ);
            makebox(3, 5, 4, 0xCC9966, ox + 38, 2.5, houseZ);
        }

        // Vicars' Hall at end of close
        makebox(8, 7, 5, 0xAA8855, ox + 35, 3.5, oz + 25);

        // Market Place — cobbled square
        makebox(25, 0.3, 20, 0x998866, ox + 20, 0.15, oz - 25);

        // Market cross shaft
        makebox(0.4, 5, 0.4, 0x888880, ox + 20, 2.5, oz - 25);
        // Market cross top
        makecylinder(0.8, 0.8, 0.3, 8, 0x888880, ox + 20, 5.15, oz - 25);

        // St Cuthbert's Church — large town church body
        makebox(18, 12, 10, 0x887766, ox + 45, 6, oz - 20);
        // St Cuthbert's tower
        makebox(5, 18, 5, 0x887766, ox + 50, 9, oz - 20);
        // St Cuthbert's roof cone
        makecone(3, 4, 8, 0x776655, ox + 50, 20, oz - 20);

        // Penniless Porch — gateway arch
        makebox(3, 8, 3, 0x888870, ox - 5, 4, oz - 20);
        makebox(3, 8, 3, 0x888870, ox + 5, 4, oz - 20);
        makebox(8, 3, 1, 0x888870, ox + 0, 9.5, oz - 20);
    }

    function update(delta) {
    }

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
