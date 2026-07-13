window.MaidsonePrison = (function() {
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
        var ox = 6200;
        var oz = 0;

        // ---- HMP Maidstone Prison ----
        // Outer perimeter walls (4 sides, 1.5 thick, 8 tall, footprint 50x50)
        // North wall
        makebox(50, 8, 1.5, 0x886644, ox + 0, 4, oz + 25);
        // South wall
        makebox(50, 8, 1.5, 0x886644, ox + 0, 4, oz - 25);
        // East wall
        makebox(1.5, 8, 50, 0x886644, ox + 25, 4, oz + 0);
        // West wall
        makebox(1.5, 8, 50, 0x886644, ox - 25, 4, oz + 0);

        // 4 corner watchtower boxes 4x4x12
        makebox(4, 12, 4, 0x886644, ox + 25, 6, oz + 25);
        makebox(4, 12, 4, 0x886644, ox - 25, 6, oz + 25);
        makebox(4, 12, 4, 0x886644, ox + 25, 6, oz - 25);
        makebox(4, 12, 4, 0x886644, ox - 25, 6, oz - 25);

        // Main cell block 30x15x12 inside
        makebox(30, 12, 15, 0x886644, ox + 0, 6, oz + 0);

        // Smaller wing blocks 20x8x10
        makebox(20, 10, 8, 0x886644, ox + 0, 5, oz + 18);
        makebox(20, 10, 8, 0x886644, ox + 0, 5, oz - 18);

        // Security lights: 6 small spheres on poles
        var slightPositions = [
            [ox - 18, oz + 20],
            [ox + 18, oz + 20],
            [ox - 18, oz - 20],
            [ox + 18, oz - 20],
            [ox - 22, oz + 0],
            [ox + 22, oz + 0]
        ];
        for (var si = 0; si < slightPositions.length; si++) {
            // pole
            makebox(0.3, 6, 0.3, 0x444444, slightPositions[si][0], 3, slightPositions[si][1]);
            // light sphere
            makesphere(0.5, 6, 6, 0xFFFF99, slightPositions[si][0], 6.5, slightPositions[si][1]);
        }

        // ---- All Saints' Church ----
        // Nave: 25x10x14
        makebox(25, 10, 14, 0xCCAA88, ox + 80, 5, oz + 10);
        // Central tower 8x20x8
        makebox(8, 20, 8, 0xCCAA88, ox + 80, 10, oz + 10);
        // Cone cap on tower
        makecone(5, 6, 8, 0xAA8866, ox + 80, 23, oz + 10);

        // ---- County Hall (Baroque civic 1913) ----
        // Main body: 35x12x20
        makebox(35, 12, 20, 0xE8E0D0, ox + 60, 6, oz - 50);
        // Twin cupola towers on each end: 5x6x5
        makebox(5, 6, 5, 0xE8E0D0, ox + 42, 15, oz - 50);
        makebox(5, 6, 5, 0xE8E0D0, ox + 78, 15, oz - 50);
        // Sphere domes on each cupola
        makesphere(3, 8, 8, 0xD0C8B8, ox + 42, 21, oz - 50);
        makesphere(3, 8, 8, 0xD0C8B8, ox + 78, 21, oz - 50);

        // ---- River Medway ----
        makebox(60, 0.3, 10, 0x336688, ox + 60, 0.15, oz - 80);

        // ---- Maidstone Bridge (5 arches across Medway) ----
        // Roadway deck
        makebox(60, 1, 5, 0xBBAA88, ox + 60, 1, oz - 80);
        // 5 arch piers below deck
        makebox(3, 3, 5, 0xBBAA88, ox + 30, -0.5, oz - 80);
        makebox(3, 3, 5, 0xBBAA88, ox + 45, -0.5, oz - 80);
        makebox(3, 3, 5, 0xBBAA88, ox + 60, -0.5, oz - 80);
        makebox(3, 3, 5, 0xBBAA88, ox + 75, -0.5, oz - 80);
        makebox(3, 3, 5, 0xBBAA88, ox + 90, -0.5, oz - 80);

        // ---- Museum & Art Gallery ----
        makebox(18, 8, 14, 0x885533, ox - 40, 4, oz + 60);

        // ---- High Street shops (12 buildings 5x7x6) ----
        var shopColors = [
            0xCC9966, 0xBB8855, 0xCCAA77, 0xAA8844,
            0xDDBB88, 0xBB9955, 0xCC8844, 0xDDAA66,
            0xBBAA55, 0xCCBB77, 0xAA9944, 0xDDCC88
        ];
        for (var hi = 0; hi < 12; hi++) {
            makebox(5, 7, 6, shopColors[hi], ox - 60 + hi * 7, 3.5, oz + 30);
        }

        // ---- Mote Park ----
        // 6 trees: trunk + foliage
        var treePositions = [
            [ox - 80, oz + 80],
            [ox - 70, oz + 90],
            [ox - 90, oz + 70],
            [ox - 85, oz + 100],
            [ox - 75, oz + 105],
            [ox - 95, oz + 85]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            // trunk
            makecylinder(0.3, 0.4, 4, 6, 0x553300, treePositions[ti][0], 2, treePositions[ti][1]);
            // foliage
            makesphere(2, 7, 7, 0x226622, treePositions[ti][0], 6, treePositions[ti][1]);
        }
        // Ornamental lake: flat blue box 20x0.3x12
        makebox(20, 0.3, 12, 0x336688, ox - 80, 0.15, oz + 90);
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
