window.LymeRegis = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 3800;
    var OZ = 2200;

    function addbox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildcobb() {
        var i;
        var steps = 40;
        var radius = 60;
        var startAngle = Math.PI * 0.1;
        var endAngle = Math.PI * 1.3;
        var angle, ax, az, nextAngle, nx, nz, dx, dz, len, midX, midZ, ry;
        for (i = 0; i < steps; i++) {
            angle = startAngle + (endAngle - startAngle) * (i / steps);
            nextAngle = startAngle + (endAngle - startAngle) * ((i + 1) / steps);
            ax = Math.cos(angle) * radius;
            az = Math.sin(angle) * radius;
            nx = Math.cos(nextAngle) * radius;
            nz = Math.sin(nextAngle) * radius;
            dx = nx - ax;
            dz = nz - az;
            len = Math.sqrt(dx * dx + dz * dz);
            midX = (ax + nx) * 0.5;
            midZ = (az + nz) * 0.5;
            ry = Math.atan2(dx, dz);
            addbox(len + 0.2, 4, 2, 0x808080, midX, 2, midZ, 0, ry, 0);
            addbox(len + 0.2, 4, 2, 0x808080, midX + Math.sin(angle) * 2.2, 2, midZ + Math.cos(angle) * 2.2, 0, ry, 0);
        }
    }

    function buildwater() {
        var i, j;
        var rows = 8;
        var cols = 8;
        for (i = 0; i < rows; i++) {
            for (j = 0; j < cols; j++) {
                addbox(8, 0.4, 8, 0x1E90FF, -20 + j * 9, 0.2, 10 + i * 9, 0, 0, 0);
            }
        }
    }

    function buildcliffs() {
        var i, j;
        var cliffColors = [0x2F4F4F, 0x363636, 0x2F4F4F, 0x404040, 0x2F4F4F];
        var layers = 5;
        var blocksWide = 20;
        for (i = 0; i < layers; i++) {
            for (j = 0; j < blocksWide; j++) {
                addbox(8, 5, 6, cliffColors[i % cliffColors.length], 120 + j * 8, i * 5 + 2.5, -20, 0, 0, 0);
            }
        }
    }

    function buildshops() {
        var i;
        var shopColors = [0xDEB887, 0xD2B48C, 0xDEB887, 0xC8A87A, 0xDEB887, 0xD2B48C, 0xDEB887];
        var windowColor = 0x8B6914;
        for (i = 0; i < 7; i++) {
            addbox(10, 12, 8, shopColors[i], -60 + i * 12, 6, -30, 0, 0, 0);
            addbox(3, 3, 1, windowColor, -60 + i * 12 - 2, 7, -26.5, 0, 0, 0);
            addbox(3, 3, 1, windowColor, -60 + i * 12 + 2, 7, -26.5, 0, 0, 0);
            addbox(8, 2, 1, 0xDEB887, -60 + i * 12, 12.5, -26.5, 0, 0, 0);
        }
    }

    function buildstatue() {
        addbox(2, 8, 2, 0xFFFAF0, -10, 4, -35, 0, 0, 0);
        addbox(3, 3, 3, 0xFFFAF0, -10, 9.5, -35, 0, 0, 0);
        addbox(1, 3, 0.5, 0xFFFAF0, -10 - 2, 7, -35, 0, 0, 0.4);
        addbox(1, 3, 0.5, 0xFFFAF0, -10 + 2, 7, -35, 0, 0, -0.4);
        addbox(4, 1, 4, 0xC0C0C0, -10, 0.5, -35, 0, 0, 0);
    }

    function buildammonitepavement() {
        var i, j;
        var rows = 6;
        var cols = 10;
        for (i = 0; i < rows; i++) {
            for (j = 0; j < cols; j++) {
                addbox(2, 0.3, 2, 0xB8A898, -50 + j * 3, 0.15, -10 + i * 3, 0, 0, 0);
                addbox(1, 0.35, 1, 0x8B7355, -50 + j * 3, 0.2, -10 + i * 3, 0, (j + i) * 0.5, 0);
            }
        }
    }

    function buildlifeboatstation() {
        addbox(18, 10, 12, 0xCC2200, 58, 5, 80, 0, 0, 0);
        addbox(22, 1, 14, 0xAA1A00, 58, 10.5, 80, 0, 0, 0);
        addbox(6, 10, 1, 0x888888, 58, 5, 73.5, 0, 0, 0);
        addbox(6, 8, 1, 0xCC2200, 50, 4, 73.5, 0, 0, 0);
    }

    function buildchurch() {
        addbox(16, 20, 18, 0x808080, -90, 10, -80, 0, 0, 0);
        addbox(7, 30, 7, 0x909090, -90, 15, -80, 0, 0, 0);
        addbox(9, 2, 9, 0x707070, -90, 30.5, -80, 0, 0, 0);
        addbox(1, 5, 1, 0x707070, -90, 33.5, -80, 0, 0, 0);
        addbox(3, 4, 1, 0x606060, -90, 8, -71.5, 0, 0, 0);
        addbox(2, 5, 1, 0x404040, -90, 8, -71.3, 0, 0, 0);
    }

    function buildlandslide() {
        var i;
        var boulderSizes = [
            [5, 3, 4],
            [3, 2, 3],
            [6, 4, 5],
            [4, 3, 3],
            [7, 5, 6],
            [3, 2, 4],
            [5, 4, 5],
            [4, 2, 3],
            [6, 3, 4],
            [3, 3, 3],
            [5, 2, 4],
            [4, 4, 5]
        ];
        var boulderPositions = [
            [120, 10],
            [128, 8],
            [135, 12],
            [143, 6],
            [150, 14],
            [158, 9],
            [165, 11],
            [173, 7],
            [130, 20],
            [140, 18],
            [155, 22],
            [162, 16]
        ];
        for (i = 0; i < boulderSizes.length; i++) {
            addbox(
                boulderSizes[i][0],
                boulderSizes[i][1],
                boulderSizes[i][2],
                0x2F4F4F,
                boulderPositions[i][0],
                boulderSizes[i][1] * 0.5,
                boulderPositions[i][1],
                0,
                i * 0.3,
                0
            );
        }
    }

    function buildboats() {
        var boatColors = [0xCC0000, 0x0000CC, 0xFFFFFF, 0xDD4400, 0x006600];
        var boatPositions = [
            [10, 40],
            [22, 50],
            [34, 42],
            [46, 55],
            [18, 65]
        ];
        var i;
        for (i = 0; i < 5; i++) {
            addbox(10, 2, 4, boatColors[i], boatPositions[i][0], 1, boatPositions[i][1], 0, 0, 0);
            addbox(8, 1, 3, boatColors[i], boatPositions[i][0], 2.5, boatPositions[i][1], 0, 0, 0);
            addbox(0.4, 6, 0.4, 0xCCCCCC, boatPositions[i][0], 5, boatPositions[i][1], 0, 0, 0);
            addbox(4, 0.2, 0.2, 0xDDDDDD, boatPositions[i][0] - 1, 7, boatPositions[i][1], 0, 0, 0.3);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];

        buildcobb();
        buildwater();
        buildcliffs();
        buildshops();
        buildstatue();
        buildammonitepavement();
        buildlifeboatstation();
        buildchurch();
        buildlandslide();
        buildboats();
    }

    function update(delta) {
        // no animation needed for static environment
        void delta;
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].parent) {
                objects[i].parent.remove(objects[i]);
            }
            if (objects[i].geometry) objects[i].geometry.dispose();
            if (objects[i].material) objects[i].material.dispose();
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };

}());
