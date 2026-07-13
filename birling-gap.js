window.BirlingGap = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 16560;
    var OFFSET_Z = 0;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeCylinder(rTop, rBot, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, seg);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 16, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildLighthouse() {
        // Main tower shaft
        var shaft = makeCylinder(6, 6, 24, 12, 0xFFFFF0, 0, 12, -20);
        addToScene(shaft);

        // Three windows up the shaft
        var win1 = makeCylinder(1.2, 1.2, 0.5, 12, 0x87CEEB, 0, 5, -14);
        addToScene(win1);
        var win2 = makeCylinder(1.2, 1.2, 0.5, 12, 0x87CEEB, 0, 12, -14);
        addToScene(win2);
        var win3 = makeCylinder(1.2, 1.2, 0.5, 12, 0x87CEEB, 0, 19, -14);
        addToScene(win3);

        // Black lantern room
        var lantern = makeCylinder(7, 7, 4, 12, 0x222222, 0, 26, -20);
        addToScene(lantern);

        // Glass light inside lantern
        var glass = makeCylinder(6.5, 6.5, 2, 12, 0x87CEEB, 0, 26, -20);
        addToScene(glass);

        // Dome atop
        var dome = makeSphere(4, 0x333333, 0, 29, -20);
        addToScene(dome);
    }

    function buildChalkCliff() {
        // Main cliff faces
        var cliff1 = makeBox(40, 28, 14, 0xFFFFF0, -10, 14, -30);
        addToScene(cliff1);
        var cliff2 = makeBox(30, 22, 10, 0xFFFFF0, 20, 11, -28);
        addToScene(cliff2);

        // Rubble fall at cliff base — 8 irregular chunks
        var rubbleData = [
            [6, 3, 3, -15, 1.5, -18],
            [4, 2, 2, -8, 1, -16],
            [8, 4, 4, 2, 2, -19],
            [5, 2, 3, 10, 1, -15],
            [3, 2, 2, -20, 1, -20],
            [7, 5, 3, -5, 2.5, -14],
            [4, 3, 4, 16, 1.5, -17],
            [6, 2, 3, 25, 1, -18]
        ];
        for (var i = 0; i < rubbleData.length; i++) {
            var r = rubbleData[i];
            var chunk = makeBox(r[0], r[1], r[2], 0xEEEEE0, r[3], r[4], r[5]);
            chunk.rotation.y = i * 0.4;
            chunk.rotation.z = (i % 3) * 0.2;
            addToScene(chunk);
        }
    }

    function buildBeachSteps() {
        // 8 step treads descending the cliff face
        for (var s = 0; s < 8; s++) {
            var tread = makeBox(4, 0.5, 2, 0x8B6914, -35, 18 - s * 2.5, -26 + s * 0.8);
            addToScene(tread);
        }

        // Handrail angled down
        var handrail = makeBox(0.3, 0.3, 20, 0x4A2C0A, -33, 13, -22);
        handrail.rotation.x = 0.45;
        addToScene(handrail);
    }

    function buildShingleBeach() {
        // 6 flat shingle tiles
        var shingleData = [
            [20, 0.8, 12, -20, 0.4, 5],
            [20, 0.8, 12, 0, 0.4, 5],
            [20, 0.8, 12, 20, 0.4, 5],
            [20, 0.8, 12, -20, 0.4, 17],
            [20, 0.8, 12, 0, 0.4, 17],
            [20, 0.8, 12, 20, 0.4, 17]
        ];
        for (var i = 0; i < shingleData.length; i++) {
            var sd = shingleData[i];
            var tile = makeBox(sd[0], sd[1], sd[2], 0x9A9090, sd[3], sd[4], sd[5]);
            addToScene(tile);
        }

        // Sea — 4 boxes
        var seaData = [
            [-25, 0.25, 30, 25, 0.25, 15],
            [-25, 0.25, 30, 0, 0.25, 30],
            [25, 0.25, 15, -25, 0.25, 25],
            [25, 0.25, 15, 25, 0.25, 35]
        ];
        for (var j = 0; j < seaData.length; j++) {
            var sea = makeBox(seaData[j][0], seaData[j][1], seaData[j][2], 0x006994, seaData[j][3], seaData[j][4], seaData[j][5]);
            addToScene(sea);
        }

        // 2 rock pools inset in shingle
        var pool1 = makeCylinder(3, 3, 0.5, 16, 0x1A5F9A, -10, 0.25, 8);
        addToScene(pool1);
        var pool2 = makeCylinder(3, 3, 0.5, 16, 0x1A5F9A, 12, 0.25, 12);
        addToScene(pool2);
    }

    function buildVisitorCentre() {
        // Main NT building
        var building = makeBox(16, 8, 5, 0xD4C5A9, 30, 4, -10);
        addToScene(building);

        // Green sedum roof
        var roof = makeBox(17, 1, 9, 0x4A8A4A, 30, 8.5, -10);
        addToScene(roof);

        // Car park
        var carPark = makeBox(30, 0.3, 20, 0xAAAAAA, 38, 0.15, -5);
        addToScene(carPark);
    }

    function buildBinoculars() {
        // 3 coin-operated viewfinders
        var bPositions = [
            [-15, -25],
            [-5, -25],
            [5, -25]
        ];
        for (var i = 0; i < bPositions.length; i++) {
            var bx = bPositions[i][0];
            var bz = bPositions[i][1];

            // Metal housing box
            var housing = makeBox(0.8, 1, 0.8, 0x888888, bx, 5.5, bz);
            addToScene(housing);

            // Pedestal post
            var post = makeCylinder(0.4, 0.4, 5, 8, 0x888888, bx, 2.5, bz);
            addToScene(post);

            // Viewfinder tube tilted 20 degrees toward sea
            var tube = makeCylinder(0.6, 0.6, 4, 12, 0x666666, bx, 5.8, bz - 0.5);
            tube.rotation.x = 0.349; // ~20 degrees in radians
            addToScene(tube);
        }
    }

    function buildFishingBoats() {
        // 3 Sussex fishing boats hauled up on beach
        var boatX = [-30, -20, -10];
        for (var i = 0; i < 3; i++) {
            var bx = boatX[i];

            // Boat hull
            var hull = makeBox(2, 1, 7, 0x6B3A1F, bx, 0.5, 5);
            hull.rotation.y = 0.15 * i;
            addToScene(hull);

            // Net pile
            var nets = makeSphere(1.5, 0x8B7355, bx + 1, 1.5, 2 + i * 0.5);
            addToScene(nets);

            // Outboard motor
            var motor = makeBox(0.8, 2, 1, 0x444444, bx + 0.5, 1.5, 8 + i * 0.3);
            addToScene(motor);
        }
    }

    function buildDownsBackdrop() {
        // 4 large rolling hill shapes — half-buried spheres
        var hillData = [
            [-40, -20, -60],
            [-15, -18, -65],
            [15, -22, -62],
            [40, -19, -60]
        ];
        for (var i = 0; i < hillData.length; i++) {
            var hill = makeSphere(20, 0x4A8A3A, hillData[i][0], hillData[i][1], hillData[i][2]);
            addToScene(hill);
        }

        // Chalk path winding up one hill
        var path = makeBox(2, 0.5, 30, 0xFFFFF0, -15, 2, -50);
        path.rotation.y = 0.15;
        addToScene(path);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function build() {
        buildLighthouse();
        buildChalkCliff();
        buildBeachSteps();
        buildShingleBeach();
        buildVisitorCentre();
        buildBinoculars();
        buildFishingBoats();
        buildDownsBackdrop();
    }

    function update(delta) {
        // static environment — no per-frame updates needed
        void delta;
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
            if (scene) {
                scene.remove(objects[i]);
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
