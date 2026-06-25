window.SherborneAbbey = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 9680;
    var OZ = 0;

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
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildabbey() {
        // Cruciform nave 32x12x14
        makebox(32, 14, 12, 0xCC9944, 0, 7, 0);
        // Transepts
        makebox(12, 13, 24, 0xCC9944, 0, 6.5, 0);
        // Central tower 7x7x20
        makebox(7, 20, 7, 0xCC9944, 0, 10, 0);
        // Pinnacles at tower corners
        makecyl(0.5, 0.5, 3, 8, 0xCC9944, -3.5, 21.5, -3.5);
        makecyl(0.5, 0.5, 3, 8, 0xCC9944, 3.5, 21.5, -3.5);
        makecyl(0.5, 0.5, 3, 8, 0xCC9944, -3.5, 21.5, 3.5);
        makecyl(0.5, 0.5, 3, 8, 0xCC9944, 3.5, 21.5, 3.5);
        // West front towers
        makebox(5, 18, 5, 0xCC9944, -13.5, 9, -6);
        makebox(5, 18, 5, 0xCC9944, -13.5, 9, 6);
        // West front connecting wall
        makebox(5, 15, 8, 0xCC9944, -13.5, 7.5, 0);
        // Fan vault ceiling spheres inside nave
        makesphere(5, 16, 16, 0xEEEEDD, -10, 12, 0);
        makesphere(5, 16, 16, 0xEEEEDD, 0, 12, 0);
        makesphere(5, 16, 16, 0xEEEEDD, 10, 12, 0);
    }

    function buildoldcastle() {
        // Old Castle ruin - Roger de Caen's Norman castle
        // Ruined keep 12x8x14 (partial walls)
        makebox(12, 14, 1.2, 0x888870, -80, 7, -60);
        makebox(1.2, 14, 8, 0x888870, -74.4, 7, -60);
        makebox(1.2, 10, 8, 0x888870, -85.6, 5, -60);
        makebox(12, 14, 1.2, 0x888870, -80, 7, -68);
        // Ruined keep floor
        makebox(12, 1, 8, 0x888870, -80, 0.5, -64);
        // Gatehouse 8x5x10
        makebox(8, 10, 5, 0x888870, -68, 5, -64);
        // Gatehouse arch (box cutout approximation - just a dark box)
        makebox(3, 5, 5.2, 0x555550, -68, 2.5, -64);
        // Curtain wall fragments - 3 sections 8x1x5
        makebox(8, 5, 1, 0x888870, -90, 2.5, -56);
        makebox(1, 5, 8, 0x888870, -94, 2.5, -64);
        makebox(8, 4, 1, 0x888870, -90, 2, -72);
    }

    function buildnewcastle() {
        // Sherborne Castle - Sir Walter Raleigh's mansion
        // Main mansion 25x10x12
        makebox(25, 12, 12, 0xCC9944, 60, 6, 30);
        // Hexagonal turrets at corners (cylinders)
        makecyl(3, 3, 10, 6, 0xCC9944, 47.5, 5, 24);
        makecyl(3, 3, 10, 6, 0xCC9944, 72.5, 5, 24);
        makecyl(3, 3, 10, 6, 0xCC9944, 47.5, 5, 36);
        makecyl(3, 3, 10, 6, 0xCC9944, 72.5, 5, 36);
        // Turret cone roofs
        makecone(3.5, 4, 6, 0x886633, 47.5, 12, 24);
        makecone(3.5, 4, 6, 0x886633, 72.5, 12, 24);
        makecone(3.5, 4, 6, 0x886633, 47.5, 12, 36);
        makecone(3.5, 4, 6, 0x886633, 72.5, 12, 36);
        // Ornate windows 2x3x0.3 x 6
        makebox(2, 3, 0.3, 0x997733, 52, 6, 24.15);
        makebox(2, 3, 0.3, 0x997733, 57, 6, 24.15);
        makebox(2, 3, 0.3, 0x997733, 62, 6, 24.15);
        makebox(2, 3, 0.3, 0x997733, 67, 6, 24.15);
        makebox(2, 3, 0.3, 0x997733, 55, 6, 35.85);
        makebox(2, 3, 0.3, 0x997733, 65, 6, 35.85);
    }

    function buildlake() {
        // Castle lake 60x0.5x40
        makebox(60, 0.5, 40, 0x336688, 60, 0, 70);
        // Cascade waterfall terraces
        makebox(4, 0.5, 3, 0x4488AA, 85, 1.5, 65);
        makebox(4, 0.5, 3, 0x4488AA, 85, 3.0, 62);
    }

    function buildtown() {
        // Ham stone market town - 10 buildings 5x5x7
        var townpositions = [
            [-30, 0, 30],
            [-38, 0, 30],
            [-46, 0, 30],
            [-30, 0, 38],
            [-38, 0, 38],
            [-30, 0, 46],
            [-46, 0, 46],
            [-54, 0, 36],
            [-54, 0, 44],
            [-22, 0, 36]
        ];
        for (var i = 0; i < townpositions.length; i++) {
            makebox(5, 7, 5, 0xCC9944, townpositions[i][0], 3.5, townpositions[i][2]);
            // Roof
            makecone(3.7, 3, 4, 0x996633, townpositions[i][0], 8.5, townpositions[i][2]);
        }
        // Market place flat 20x0.3x15
        makebox(20, 0.3, 15, 0xBBAA88, -38, 0.15, 54);
        // Market cross 0.5x0.5x5
        makebox(0.5, 5, 0.5, 0x998866, -38, 2.5, 54);
        // Market cross top cylinder 1r x 0.4h
        makecyl(1, 1, 0.4, 8, 0x998866, -38, 5.2, 54);
    }

    function buildconduit() {
        // Medieval water conduit - hexagonal structure
        // 6 box sides 1x0.5x3 forming hexagon
        var hexr = 2.5;
        for (var i = 0; i < 6; i++) {
            var angle = (i / 6) * Math.PI * 2;
            var cx = Math.cos(angle) * hexr;
            var cz = Math.sin(angle) * hexr;
            var mesh = new THREE.Mesh(
                new THREE.BoxGeometry(1, 2.5, 0.5),
                new THREE.MeshLambertMaterial({ color: 0x998866 })
            );
            mesh.position.set(OX + (-20) + cx, 1.25, OZ + 54 + cz);
            mesh.rotation.y = angle;
            scene.add(mesh);
            objects.push(mesh);
        }
        // Cone roof 3r x 3h
        makecone(3, 3, 6, 0x998866, -20, 4, 54);
    }

    function buildalmshouse() {
        // Medieval almshouse 16x6x7
        makebox(16, 7, 6, 0xCC9944, 20, 3.5, 50);
        // Cloistered courtyard columns
        makecyl(0.3, 0.3, 3, 8, 0xBBAA88, 14, 1.5, 46);
        makecyl(0.3, 0.3, 3, 8, 0xBBAA88, 18, 1.5, 46);
        makecyl(0.3, 0.3, 3, 8, 0xBBAA88, 22, 1.5, 46);
        makecyl(0.3, 0.3, 3, 8, 0xBBAA88, 26, 1.5, 46);
        // Covered walkway beams
        makebox(14, 0.3, 2, 0xBBAA88, 20, 3.1, 46);
    }

    function builddigbyhotel() {
        // The Digby Hotel main 18x8x9
        makebox(18, 9, 8, 0xBBAA77, 30, 4.5, -30);
        // Coaching inn courtyard walls 3 sides
        makebox(15, 4, 0.5, 0xBBAA77, 30, 2, -38.25);
        makebox(0.5, 4, 8, 0xBBAA77, 22.75, 2, -34);
        makebox(0.5, 4, 8, 0xBBAA77, 37.25, 2, -34);
        // Arch entrance - top beam
        makebox(5, 0.7, 0.6, 0xBBAA77, 30, 4.35, -38.3);
    }

    function buildabbeyclose() {
        // Abbey Close grassy precinct 40x0.3x30
        makebox(40, 0.3, 30, 0x447730, 0, 0.15, -30);
        // Cedar trees x3
        var treepositions = [
            [-14, 0, -25],
            [0, 0, -38],
            [14, 0, -25]
        ];
        for (var i = 0; i < treepositions.length; i++) {
            var tx = treepositions[i][0];
            var tz = treepositions[i][2];
            // Trunk
            makecyl(0.5, 0.5, 8, 8, 0x553322, tx, 4, tz);
            // 3 layered sphere canopy
            makesphere(5, 12, 12, 0x226622, tx, 9, tz);
            makesphere(4, 12, 12, 0x226622, tx, 12, tz);
            makesphere(3, 12, 12, 0x226622, tx, 14.5, tz);
        }
    }

    function buildrailway() {
        // Railway station - golden stone 15x6x5
        makebox(15, 6, 5, 0xCC9944, -60, 3, -20);
        // Platform box
        makebox(20, 0.7, 4, 0xBBAA88, -60, 0.35, -15);
        // Canopy
        makebox(18, 0.4, 5, 0x888877, -60, 6.2, -17.5);
        // Victorian ironwork posts (cylinders)
        makecyl(0.2, 0.2, 6, 6, 0x445544, -52, 3, -17.5);
        makecyl(0.2, 0.2, 6, 6, 0x445544, -58, 3, -17.5);
        makecyl(0.2, 0.2, 6, 6, 0x445544, -64, 3, -17.5);
        makecyl(0.2, 0.2, 6, 6, 0x445544, -68, 3, -17.5);
    }

    function build() {
        buildabbey();
        buildoldcastle();
        buildnewcastle();
        buildlake();
        buildtown();
        buildconduit();
        buildalmshouse();
        builddigbyhotel();
        buildabbeyclose();
        buildrailway();
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
