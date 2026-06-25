window.SurbitonSuburb = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 5920;
    var OZ = 0;

    function addbox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildstation() {
        /* Main Art Deco station building 30x12x8 cream render */
        addbox(30, 12, 8, 0xF5F0E0, 0, 6, 0);

        /* Horizontal window bands - 3 rows of long thin windows */
        addbox(26, 1.0, 0.5, 0x88AABB, 0, 10.5, -4.1);
        addbox(26, 1.0, 0.5, 0x88AABB, 0, 8.0, -4.1);
        addbox(26, 1.0, 0.5, 0x88AABB, 0, 5.5, -4.1);

        /* Geometric corner towers 4x4x10 */
        addbox(4, 10, 4, 0xEDE8D5, -17, 5, 0);
        addbox(4, 10, 4, 0xEDE8D5, 17, 5, 0);

        /* Corner tower caps */
        addbox(5, 0.6, 5, 0xD4CEB8, -17, 10.3, 0);
        addbox(5, 0.6, 5, 0xD4CEB8, 17, 10.3, 0);

        /* Curved canopy overhang - flat box projecting forward */
        addbox(32, 0.6, 4, 0xD8D2C0, 0, 3.5, -6.0);

        /* Canopy support pillars */
        addbox(0.5, 3.5, 0.5, 0xC0BAA8, -12, 1.75, -7.8);
        addbox(0.5, 3.5, 0.5, 0xC0BAA8, 0, 1.75, -7.8);
        addbox(0.5, 3.5, 0.5, 0xC0BAA8, 12, 1.75, -7.8);

        /* Central Art Deco relief panel */
        addbox(6, 4, 0.4, 0xE8E2CC, 0, 9, -4.3);

        /* Station entrance doors - dark recessed box */
        addbox(4, 6, 0.5, 0x553322, 0, 3, -4.2);

        /* Platform edge strip */
        addbox(32, 0.4, 2, 0xCCCCCC, 0, 0.2, -9);
    }

    function buildsemidetached() {
        /* 4 rows x 6 pairs = 24 pairs of semi-detached houses
           Each pair as one unit 8x9x7 alternating pebbledash and brick */
        var rowZ = [30, 55, 80, 105];
        var pairX = [-55, -38, -22, 22, 38, 55];
        var colors = [0xF0E8D8, 0xCC8844, 0xF0E8D8, 0xCC8844, 0xF0E8D8, 0xCC8844];

        for (var r = 0; r < 4; r++) {
            for (var p = 0; p < 6; p++) {
                var bx = pairX[p];
                var bz = rowZ[r];
                var col = colors[p];

                /* Main house body 8x9x7 */
                addbox(8, 7, 7, col, bx, 3.5, bz);

                /* Roof gable - mock Tudor apex via 2 thin angled boxes */
                var gable1 = addbox(4.5, 0.4, 7, 0x886644, bx, 7.2, bz);
                gable1.rotation.z = Math.PI * 0.22;
                var gable2 = addbox(4.5, 0.4, 7, 0x886644, bx, 7.2, bz);
                gable2.rotation.z = -Math.PI * 0.22;

                /* Bay window projecting out front */
                addbox(2, 2.5, 0.5, col, bx - 1.5, 3.5, bz - 3.8);

                /* Chimney stack */
                addbox(1, 3, 1, 0xAA6644, bx + 2.5, 9.5, bz);
            }
        }
    }

    function buildshopparade() {
        /* 8 shops in a row, each 4x5x5, Art Deco trim */
        for (var s = 0; s < 8; s++) {
            var sx = -35 + s * 5;
            /* Shop body */
            addbox(4, 5, 5, 0xE8E0CC, sx, 2.5, 20);
            /* Art Deco fascia trim */
            addbox(4, 0.6, 5.2, 0x444444, sx, 5.3, 20);
            /* Shop window */
            addbox(3, 2.5, 0.4, 0x99BBCC, sx, 2.0, 17.6);
            /* Door */
            addbox(1, 3, 0.4, 0x553322, sx + 1.0, 1.5, 17.6);
        }
        /* Continuous cornice strip above parade */
        addbox(42, 0.4, 0.6, 0x333333, -11.5, 6.0, 17.4);
    }

    function buildpark() {
        /* Claremont Park - ground level implied, trees and benches */

        /* 10 trees: trunk cylinder + foliage sphere */
        var treePositions = [
            [-75, -30], [-68, -22], [-80, -15], [-72, -40],
            [-65, -50], [-85, -35], [-78, -55], [-70, -62],
            [-88, -25], [-62, -38]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = treePositions[t][0];
            var tz = treePositions[t][1];
            /* Trunk */
            addcyl(0.3, 0.4, 3.5, 6, 0x886644, tx, 1.75, tz);
            /* Foliage */
            addsphere(2.5, 7, 6, 0x336622, tx, 5.5, tz);
        }

        /* 2 benches - seat box + back box + 2 leg boxes */
        /* Bench 1 */
        addbox(1.5, 0.2, 0.4, 0x886644, -70, 0.5, -45);
        addbox(1.5, 0.4, 0.1, 0x886644, -70, 0.75, -45.2);
        addbox(0.1, 0.5, 0.4, 0x664422, -70.65, 0.25, -45);
        addbox(0.1, 0.5, 0.4, 0x664422, -69.35, 0.25, -45);

        /* Bench 2 */
        addbox(1.5, 0.2, 0.4, 0x886644, -75, 0.5, -55);
        addbox(1.5, 0.4, 0.1, 0x886644, -75, 0.75, -55.2);
        addbox(0.1, 0.5, 0.4, 0x664422, -75.65, 0.25, -55);
        addbox(0.1, 0.5, 0.4, 0x664422, -74.35, 0.25, -55);

        /* Iron gate - 2 tall pillars */
        addbox(0.4, 4, 0.4, 0x333333, -78, 2, -28);
        addbox(0.4, 4, 0.4, 0x333333, -74, 2, -28);
        /* Gate crossbar */
        addbox(4.4, 0.3, 0.2, 0x333333, -76, 4, -28);
        /* Gate bars */
        addbox(0.15, 3, 0.15, 0x333333, -77.5, 1.5, -28);
        addbox(0.15, 3, 0.15, 0x333333, -76.5, 1.5, -28);
        addbox(0.15, 3, 0.15, 0x333333, -75.5, 1.5, -28);
        addbox(0.15, 3, 0.15, 0x333333, -74.5, 1.5, -28);
    }

    function buildwatertower() {
        /* Victorian water tower: cylinder 5r x 15 tall + dome sphere cap */
        /* Base plinth */
        addbox(12, 1, 12, 0x776655, 60, 0.5, -50);
        /* Main cylinder tower shaft */
        addcyl(5, 5, 15, 12, 0x886644, 60, 8.5, -50);
        /* Tank cylinder on top */
        addcyl(5.5, 5.5, 5, 12, 0x775533, 60, 18.5, -50);
        /* Dome cap */
        addsphere(5.5, 10, 8, 0x664422, 60, 21.5, -50);
        /* Support legs */
        addcyl(0.5, 0.5, 6, 6, 0x665544, 55, 3, -45);
        addcyl(0.5, 0.5, 6, 6, 0x665544, 65, 3, -45);
        addcyl(0.5, 0.5, 6, 6, 0x665544, 55, 3, -55);
        addcyl(0.5, 0.5, 6, 6, 0x665544, 65, 3, -55);
    }

    function buildchurch() {
        /* Victorian church: flint 0xBBB8A0 */
        /* Main nave 15x10x8 */
        addbox(15, 8, 10, 0xBBB8A0, 45, 4, 30);
        /* Chancel extension */
        addbox(7, 7, 7, 0xBBB8A0, 55.5, 3.5, 30);
        /* Flint tower 4x4x14 */
        addbox(4, 14, 4, 0xAAA89A, 36, 7, 30);
        /* Octagonal spire - approximated with cone 8-sided */
        addcone(2.5, 8, 8, 0x998880, 36, 19, 30);
        /* Tower battlements */
        addbox(5, 1, 5, 0x999880, 36, 14.5, 30);
        /* Nave roof ridge */
        addbox(15, 0.5, 0.5, 0x998877, 45, 8.5, 30);
        /* Nave roof slopes - 2 angled slabs */
        var roofL = addbox(7, 0.5, 10.5, 0x998877, 41.5, 8.2, 30);
        roofL.rotation.z = Math.PI * 0.18;
        var roofR = addbox(7, 0.5, 10.5, 0x998877, 48.5, 8.2, 30);
        roofR.rotation.z = -Math.PI * 0.18;
        /* Church windows */
        addbox(1.2, 3, 0.4, 0x88AABB, 40, 4, 25.1);
        addbox(1.2, 3, 0.4, 0x88AABB, 44, 4, 25.1);
        addbox(1.2, 3, 0.4, 0x88AABB, 48, 4, 25.1);
        /* Church door */
        addbox(2, 4, 0.4, 0x553322, 38, 2, 25.1);
        /* Churchyard wall */
        addbox(30, 1.2, 0.5, 0x998877, 47, 0.6, 22);
        addbox(0.5, 1.2, 18, 0x998877, 33, 0.6, 31);
    }

    function build() {
        buildstation();
        buildsemidetached();
        buildshopparade();
        buildpark();
        buildwatertower();
        buildchurch();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
