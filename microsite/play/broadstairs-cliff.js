window.BroadstairsCliff = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 6440;
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

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
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

    function build() {
        cliffs();
        harbour();
        bleakhouse();
        beach();
        sea();
        huts();
        cottages();
        pub();
        lifeboat();
        kiosk();
        jetty();
    }

    function cliffs() {
        // 3 stacked stepped sections forming white chalk cliff, height 14, z=-10
        // Bottom section - widest
        makebox(80, 4, 10, 0xFFFAF0, 0, 2, -10);
        // Middle section - stepped in
        makebox(75, 5, 8, 0xFFFAF0, 0, 6.5, -11);
        // Top section - stepped in further
        makebox(70, 5, 6, 0xFFFAF0, 0, 11.5, -12);
    }

    function harbour() {
        // 4 BoxGeometry sections angled to form L-shape harbour arm, stone 0xAA9988
        var arm = new THREE.Mesh(
            new THREE.BoxGeometry(3, 1.5, 30),
            new THREE.MeshLambertMaterial({ color: 0xAA9988 })
        );
        arm.position.set(OX + 35, 0.75, OZ + 5);
        scene.add(arm);
        objects.push(arm);

        var elbow = new THREE.Mesh(
            new THREE.BoxGeometry(3, 1.5, 3),
            new THREE.MeshLambertMaterial({ color: 0xAA9988 })
        );
        elbow.position.set(OX + 35, 0.75, OZ + -10);
        scene.add(elbow);
        objects.push(elbow);

        var side = new THREE.Mesh(
            new THREE.BoxGeometry(16, 1.5, 3),
            new THREE.MeshLambertMaterial({ color: 0xAA9988 })
        );
        side.position.set(OX + 27, 0.75, OZ + -11.5);
        scene.add(side);
        objects.push(side);

        var tip = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2.5, 4),
            new THREE.MeshLambertMaterial({ color: 0xAA9988 })
        );
        tip.position.set(OX + 19, 1.25, OZ + -11);
        scene.add(tip);
        objects.push(tip);
    }

    function bleakhouse() {
        // Gothic mansion on clifftop: 20x12x10 dark flint
        makebox(20, 12, 10, 0x555544, 0, 20, -15);

        // 3 pointed gable dormers on roof
        makebox(4, 2, 2, 0x555544, -6, 27, -14);
        makecone(2, 4, 4, 0x443333, -6, 30, -14);

        makebox(4, 2, 2, 0x555544, 0, 27, -14);
        makecone(2, 4, 4, 0x443333, 0, 30, -14);

        makebox(4, 2, 2, 0x555544, 6, 27, -14);
        makecone(2, 4, 4, 0x443333, 6, 30, -14);

        // 2 chimneys
        makecylinder(0.4, 0.4, 4, 6, 0x444433, -5, 30, -17);
        makecylinder(0.4, 0.4, 4, 6, 0x444433, 5, 30, -17);
    }

    function beach() {
        // 80x0.3x18, sand 0xF4E0A0
        makebox(80, 0.3, 18, 0xF4E0A0, 0, 0.15, 0);
    }

    function sea() {
        // 80x0.3x20, 0x4488BB
        makebox(80, 0.3, 20, 0x4488BB, 0, 0.1, 19);
    }

    function huts() {
        // 10 beach huts 2.5x2x3, rainbow colors
        var colors = [
            0xFF0000, 0xFF7700, 0xFFFF00, 0x00CC00, 0x0000FF,
            0x8B00FF, 0xFF69B4, 0x00FFFF, 0xFF4500, 0x7FFF00
        ];
        for (var i = 0; i < 10; i++) {
            var hx = -22.5 + i * 5;
            makebox(2.5, 2, 3, colors[i], hx, 1.15, -5);
            makebox(2.5, 0.8, 3.2, colors[i], hx, 2.55, -5);
        }
    }

    function cottages() {
        // 8 whitewashed cottages 5x6x7, 0xF5F5F0 with dark 0x223322 roofs
        for (var i = 0; i < 8; i++) {
            var cx = -17.5 + i * 5;
            makebox(5, 6, 7, 0xF5F5F0, cx, 3, -18);
            makebox(5.4, 1, 7.4, 0x223322, cx, 6.5, -18);
            makecone(3, 3, 4, 0x223322, cx, 8.5, -18);
        }
    }

    function pub() {
        // 10x8x6, painted 0x1A3A55 navy blue
        makebox(10, 8, 6, 0x1A3A55, -28, 4, -5);
        makebox(10.4, 1, 6.4, 0x112233, -28, 8.5, -5);
        makecone(5.5, 2.5, 4, 0x112233, -28, 10, -5);
        // sign
        makebox(4, 1.5, 0.2, 0xFFCC00, -28, 5, -1.9);
    }

    function lifeboat() {
        // 12x8x5, RNLI 0x003399
        makebox(12, 8, 5, 0x003399, 20, 4, -5);
        makebox(12.4, 1, 5.4, 0x002266, 20, 8.5, -5);
        // large door opening suggestion via dark box
        makebox(4, 5, 0.3, 0x001144, 20, 2.5, -2.35);
        // roof ridge
        makecylinder(0.3, 0.3, 12, 6, 0x002266, 20, 9.5, -5);
    }

    function kiosk() {
        // 3x2x3, white 0xFFFFFF + pink sign
        makebox(3, 2, 3, 0xFFFFFF, 10, 1.15, -3);
        makebox(3, 0.4, 3.2, 0xFF99BB, 10, 2.35, -3);
        // awning
        makebox(4, 0.2, 1.5, 0xFF66AA, 10, 2.2, -1.25);
    }

    function jetty() {
        // 3x1x40 extending into sea, 0x888877
        makebox(3, 1, 40, 0x888877, -35, 0.5, 9);
        // bollards along jetty
        for (var i = 0; i < 5; i++) {
            makecylinder(0.2, 0.2, 1.5, 6, 0x666655, -33.5, 1.75, -11 + i * 10);
            makecylinder(0.2, 0.2, 1.5, 6, 0x666655, -36.5, 1.75, -11 + i * 10);
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
