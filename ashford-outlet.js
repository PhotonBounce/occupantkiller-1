window.AshfordOutlet = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 6600;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addbox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcylinder(rt, rb, h, segs, color, x, y, z) {
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

    function addlines(geo, color, x, y, z) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var mesh = new THREE.LineSegments(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function station() {
        // Main building body
        addbox(50, 8, 15, 0x889999, 0, 4, -120);
        // Curved roof approximated by 2 angled boxes on each side (left and right halves)
        var roofLeft = addbox(25, 2, 15, 0x779988, -12.5, 9.5, -120);
        roofLeft.rotation.z = 0.18;
        var roofRight = addbox(25, 2, 15, 0x779988, 12.5, 9.5, -120);
        roofRight.rotation.z = -0.18;
        // Platform canopy
        addbox(50, 1, 6, 0xAABBBB, 0, 8.5, -113);
        // Entrance glazing strip
        addbox(20, 6, 1, 0x99CCCC, 0, 3, -112);
    }

    function train() {
        // Section 1 - nose (TGV yellow)
        addbox(20, 3.5, 3, 0xFFCC00, -40, 2.75, -120);
        // Nose taper box
        var nose = addbox(8, 2.5, 2.5, 0xFFCC00, -52, 2.5, -120);
        nose.rotation.y = 0;
        // Section 2 - body gray
        addbox(20, 3.5, 3, 0x888888, -20, 2.75, -120);
        // Section 3 - body gray
        addbox(20, 3.5, 3, 0x888888, 0, 2.75, -120);
        // Windows strip (dark boxes on each section)
        addbox(18, 0.8, 0.2, 0x333333, -20, 3.8, -121.6);
        addbox(18, 0.8, 0.2, 0x333333, 0, 3.8, -121.6);
        addbox(12, 0.8, 0.2, 0x333333, -38, 3.8, -121.6);
        // Undercarriage
        addbox(60, 0.6, 3.2, 0x555555, -20, 1.1, -120);
    }

    function outlet() {
        // McArthurGlen Designer Outlet - 4 sides of a 60x40 ring, 2 storey
        // North wall
        addbox(50, 8, 3, 0xF5F0E8, 0, 4, 20);
        addbox(50, 1, 3, 0x3355AA, 0, 8.5, 20);
        // South wall
        addbox(50, 8, 3, 0xF5F0E8, 0, 4, 60);
        addbox(50, 1, 3, 0x3355AA, 0, 8.5, 60);
        // West wall
        addbox(3, 8, 36, 0xF5F0E8, -25, 4, 40);
        addbox(3, 1, 36, 0x3355AA, -25, 8.5, 40);
        // East wall
        addbox(3, 8, 36, 0xF5F0E8, 25, 4, 40);
        addbox(3, 1, 36, 0x3355AA, 25, 8.5, 40);
        // Second floor balcony rails (line segments style via thin boxes)
        addbox(50, 0.3, 0.3, 0x3355AA, 0, 5, 19);
        addbox(50, 0.3, 0.3, 0x3355AA, 0, 5, 61);
    }

    function courtyard() {
        // Fountain base cylinder
        addcylinder(1, 1, 0.5, 12, 0x888888, 0, 0.25, 40);
        // Water jet sphere
        addsphere(0.6, 8, 6, 0x6699CC, 0, 1.2, 40);
        // 6 trees around courtyard
        var treePositions = [
            [-15, 30], [15, 30], [-15, 50], [15, 50], [0, 28], [0, 52]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz = treePositions[i][1];
            // Trunk
            addcylinder(0.3, 0.3, 2.5, 6, 0x886644, tx, 1.25, tz);
            // Foliage
            addsphere(1.5, 7, 6, 0x337722, tx, 4, tz);
        }
    }

    function carpark() {
        // 3-level multi-storey structure
        addbox(40, 4, 12, 0x888888, 60, 2, 40);
        addbox(40, 4, 12, 0x888888, 60, 6, 40);
        addbox(40, 4, 12, 0x888888, 60, 10, 40);
        // Ramp suggestion
        addbox(5, 4, 5, 0x777777, 80, 4, 36);
        // Level markers (thin strips)
        addbox(40, 0.2, 12, 0xAAAAAA, 60, 4, 40);
        addbox(40, 0.2, 12, 0xAAAAAA, 60, 8, 40);
    }

    function river() {
        // Stour Valley river
        addbox(60, 0.3, 6, 0x4477AA, 0, 0.15, 100);
        // River banks (slightly lighter)
        addbox(62, 0.3, 1, 0x556644, 0, 0.15, 94);
        addbox(62, 0.3, 1, 0x556644, 0, 0.15, 106);
    }

    function tesco() {
        // Tesco Extra superstore main building
        addbox(50, 8, 20, 0xDDDDDD, -80, 4, 40);
        // Red sign strip across front
        addbox(50, 3, 1, 0xCC0000, -80, 9, 30);
        // Loading bay extension at rear
        addbox(20, 5, 8, 0xBBBBBB, -80, 2.5, 52);
        // Car park in front (ground level markers)
        addbox(50, 0.1, 15, 0x999999, -80, 0.05, 22);
    }

    function blocks() {
        // 4 x 1960s council blocks
        var bpos = [
            [-120, -60], [-95, -60], [-120, -40], [-95, -40]
        ];
        for (var i = 0; i < bpos.length; i++) {
            addbox(20, 15, 10, 0x888880, bpos[i][0], 7.5, bpos[i][1]);
            // Horizontal window bands
            addbox(18, 0.5, 0.5, 0x777770, bpos[i][0], 5, bpos[i][1] - 5);
            addbox(18, 0.5, 0.5, 0x777770, bpos[i][0], 9, bpos[i][1] - 5);
            addbox(18, 0.5, 0.5, 0x777770, bpos[i][0], 13, bpos[i][1] - 5);
        }
    }

    function church() {
        // Nave
        addbox(18, 8, 10, 0xBBB8A0, -50, 4, -60);
        // Tower
        addbox(6, 14, 6, 0xBBB8A0, -62, 7, -60);
        // Spire (ConeGeometry)
        addcone(3, 8, 8, 0xAAA89A, -62, 18, -60);
        // Chancel / apse extension
        addbox(6, 7, 8, 0xBBB8A0, -39, 3.5, -60);
        // Porch
        addbox(4, 5, 4, 0xCCC9B0, -50, 2.5, -65);
        // Arched window suggestion (thin box)
        addbox(2, 4, 0.3, 0x998855, -50, 5, -65.2);
    }

    function wires() {
        // Add some LineSegments as overhead wire guides above the station platform
        var positions = new Float32Array([
            -25, 10, -113,
             25, 10, -113,
             25, 10, -113,
             25, 10, -127,
            -25, 10, -127,
             25, 10, -127,
            -25, 10, -113,
            -25, 10, -127
        ]);
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        addlines(geo, 0x555555, 0, 0, 0);
    }

    function build() {
        station();
        train();
        outlet();
        courtyard();
        carpark();
        river();
        tesco();
        blocks();
        church();
        wires();
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
