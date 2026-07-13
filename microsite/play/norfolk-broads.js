window.NorfolkBroads = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var sailGroup = null;
    var OFFSET_X = 16080;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        return mesh;
    }

    function buildBroad() {
        var positions = [
            [0, 0],
            [20, 0],
            [-20, 0],
            [0, 20],
            [0, -20]
        ];
        var i;
        for (i = 0; i < positions.length; i++) {
            var geo = new THREE.BoxGeometry(20, 0.4, 20);
            var mesh = makeMesh(geo, 0x1B6CA8);
            mesh.position.set(OFFSET_X + positions[i][0], 0.2, OFFSET_Z + positions[i][1]);
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildReedBed(cx, cz, count, side) {
        var i;
        for (i = 0; i < count; i++) {
            var geo = new THREE.CylinderGeometry(0.3, 0.3, 3, 6);
            var mesh = makeMesh(geo, 0x8B7355);
            var spread = (i - count / 2) * 2.8;
            var offset = side * 3.5;
            mesh.position.set(OFFSET_X + cx + offset, 1.5, OFFSET_Z + cz + spread);
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildDykeNetwork() {
        var dykes = [
            [40, 0, 4, 0.4, 30],
            [-40, 0, 4, 0.4, 30],
            [0, 40, 4, 0.4, 30],
            [0, -40, 4, 0.4, 30],
            [35, 30, 4, 0.4, 30],
            [-35, -30, 4, 0.4, 30]
        ];
        var i;
        for (i = 0; i < dykes.length; i++) {
            var d = dykes[i];
            var geo = new THREE.BoxGeometry(d[2], d[3], d[4]);
            var mesh = makeMesh(geo, 0x1A5F9A);
            mesh.position.set(OFFSET_X + d[0], 0.2, OFFSET_Z + d[1]);
            scene.add(mesh);
            objects.push(mesh);
            buildReedBed(d[0], d[1], 10, 1);
            buildReedBed(d[0], d[1], 10, -1);
        }
    }

    function buildWindmill(cx, cz, radius, height, capRadius, capHeight, brickColor, capColor, isDerelict) {
        var towerGeo = new THREE.CylinderGeometry(radius, radius, height, 8);
        var tower = makeMesh(towerGeo, brickColor);
        tower.position.set(OFFSET_X + cx, height / 2, OFFSET_Z + cz);
        scene.add(tower);
        objects.push(tower);

        if (!isDerelict) {
            var capGeo = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 8);
            var cap = makeMesh(capGeo, capColor);
            cap.position.set(OFFSET_X + cx, height + capHeight / 2, OFFSET_Z + cz);
            scene.add(cap);
            objects.push(cap);
        } else {
            var flatCapGeo = new THREE.BoxGeometry(7, 1, 7);
            var flatCap = makeMesh(flatCapGeo, 0x555555);
            flatCap.position.set(OFFSET_X + cx, height + 0.5, OFFSET_Z + cz);
            scene.add(flatCap);
            objects.push(flatCap);
        }

        var group = new THREE.Group();
        group.position.set(OFFSET_X + cx, height + capHeight, OFFSET_Z + cz);

        var sailCount = isDerelict ? 2 : 4;
        var sailAngles = isDerelict ? [0, Math.PI / 2] : [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
        var j;
        for (j = 0; j < sailCount; j++) {
            var sailGeo = new THREE.BoxGeometry(1, 1, 20);
            var sail = makeMesh(sailGeo, 0x5C4A1E);
            var angle = sailAngles[j];
            sail.position.set(Math.sin(angle) * 10, Math.cos(angle) * 10, 0);
            sail.rotation.z = angle;
            group.add(sail);
        }

        scene.add(group);
        objects.push(group);
        return group;
    }

    function buildWindmills() {
        sailGroup = buildWindmill(60, 10, 5, 24, 5, 4, 0x8B4513, 0x2C2C2C, false);
        buildWindmill(90, -20, 3.5, 18, 0, 0, 0x7A3B0D, 0x555555, true);
    }

    function buildCruiser(cx, cz) {
        var hullGeo = new THREE.BoxGeometry(3, 2, 10);
        var hull = makeMesh(hullGeo, 0x1C5C9E);
        hull.position.set(OFFSET_X + cx, 1, OFFSET_Z + cz);
        scene.add(hull);
        objects.push(hull);

        var cabinGeo = new THREE.BoxGeometry(3, 2, 5);
        var cabin = makeMesh(cabinGeo, 0xF5F5F5);
        cabin.position.set(OFFSET_X + cx, 3, OFFSET_Z + cz - 1);
        scene.add(cabin);
        objects.push(cabin);

        var windscreenGeo = new THREE.BoxGeometry(3, 1.5, 0.3);
        var windscreen = makeMesh(windscreenGeo, 0x87CEEB);
        windscreen.position.set(OFFSET_X + cx, 3.75, OFFSET_Z + cz + 1.5);
        scene.add(windscreen);
        objects.push(windscreen);
    }

    function buildCruiserFleet() {
        var positions = [
            [-10, 10],
            [-10, 25],
            [-10, -5],
            [-10, -20]
        ];
        var i;
        for (i = 0; i < positions.length; i++) {
            buildCruiser(positions[i][0], positions[i][1]);
        }
    }

    function buildBoathouse() {
        var bx = -30;
        var bz = 30;

        var wallGeo = new THREE.BoxGeometry(16, 10, 10);
        var wall = makeMesh(wallGeo, 0x6B3A1F);
        wall.position.set(OFFSET_X + bx, 5, OFFSET_Z + bz);
        scene.add(wall);
        objects.push(wall);

        var roofGeo = new THREE.BoxGeometry(18, 2, 12);
        var roof = makeMesh(roofGeo, 0x888888);
        roof.position.set(OFFSET_X + bx, 11, OFFSET_Z + bz);
        scene.add(roof);
        objects.push(roof);

        var dockGeo = new THREE.BoxGeometry(6, 0.4, 8);
        var dock = makeMesh(dockGeo, 0x1B6CA8);
        dock.position.set(OFFSET_X + bx, 0.2, OFFSET_Z + bz + 9);
        scene.add(dock);
        objects.push(dock);
    }

    function buildTree(cx, cz) {
        var trunkGeo = new THREE.CylinderGeometry(1.2, 1.2, 10, 8);
        var trunk = makeMesh(trunkGeo, 0x4A2C0A);
        trunk.position.set(OFFSET_X + cx, 5, OFFSET_Z + cz);
        scene.add(trunk);
        objects.push(trunk);

        var canopyGeo = new THREE.SphereGeometry(6, 8, 8);
        var canopy = makeMesh(canopyGeo, 0x2D6B2D);
        canopy.position.set(OFFSET_X + cx, 13, OFFSET_Z + cz);
        scene.add(canopy);
        objects.push(canopy);
    }

    function buildBullrush(cx, cz) {
        var stemGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 6);
        var stem = makeMesh(stemGeo, 0x4A3728);
        stem.position.set(OFFSET_X + cx, 2.5, OFFSET_Z + cz);
        scene.add(stem);
        objects.push(stem);

        var headGeo = new THREE.SphereGeometry(1, 6, 6);
        var head = makeMesh(headGeo, 0x4A3728);
        head.position.set(OFFSET_X + cx, 5.5, OFFSET_Z + cz);
        scene.add(head);
        objects.push(head);
    }

    function buildMarshland() {
        var treePositions = [
            [-50, 10],
            [-55, 25],
            [-45, -5],
            [-60, 40],
            [-48, -30],
            [20, 55],
            [35, -55],
            [-25, 55],
            [10, -60],
            [50, 50]
        ];
        var i;
        for (i = 0; i < treePositions.length; i++) {
            buildTree(treePositions[i][0], treePositions[i][1]);
        }

        var bullrushPositions = [
            [15, 35],
            [18, 38],
            [-15, -35],
            [-18, -38],
            [35, 15],
            [38, 18],
            [-35, -15],
            [-38, -18]
        ];
        for (i = 0; i < bullrushPositions.length; i++) {
            buildBullrush(bullrushPositions[i][0], bullrushPositions[i][1]);
        }
    }

    function buildWherry(cx, cz) {
        var hullGeo = new THREE.BoxGeometry(4, 2, 16);
        var hull = makeMesh(hullGeo, 0x2C1810);
        hull.position.set(OFFSET_X + cx, 1, OFFSET_Z + cz);
        scene.add(hull);
        objects.push(hull);

        var mastGeo = new THREE.BoxGeometry(0.5, 0.5, 20);
        var mast = makeMesh(mastGeo, 0x3B2210);
        mast.position.set(OFFSET_X + cx, 12, OFFSET_Z + cz);
        scene.add(mast);
        objects.push(mast);

        var sailGeo = new THREE.BoxGeometry(8, 12, 0.3);
        var sail = makeMesh(sailGeo, 0xF5DEB3);
        sail.position.set(OFFSET_X + cx, 10, OFFSET_Z + cz);
        scene.add(sail);
        objects.push(sail);
    }

    function buildWherries() {
        buildWherry(-5, -55);
        buildWherry(10, -75);
    }

    function build() {
        buildBroad();
        buildDykeNetwork();
        buildWindmills();
        buildCruiserFleet();
        buildBoathouse();
        buildMarshland();
        buildWherries();
    }

    function update(delta) {
        if (sailGroup) {
            sailGroup.rotation.z += delta * 0.5;
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i] && objects[i].parent) {
                objects[i].parent.remove(objects[i]);
            }
        }
        objects = [];
        sailGroup = null;
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
