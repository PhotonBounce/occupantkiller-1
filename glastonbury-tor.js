window.GlastonburyTor = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(9600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildtor() {
        // Glastonbury Tor — steep conical hill
        makecone(20, 25, 12, 0x5A7030, 0, 12.5, 0);

        // Terracing — 3 concentric box rings on slopes (north, south, east, west faces)
        // Upper terrace ring
        makebox(14, 0.5, 0.5, 0x4A6020, 0, 19, -6);
        makebox(14, 0.5, 0.5, 0x4A6020, 0, 19, 6);
        makebox(0.5, 0.5, 12, 0x4A6020, -6, 19, 0);
        makebox(0.5, 0.5, 12, 0x4A6020, 6, 19, 0);

        // Middle terrace ring
        makebox(24, 0.5, 0.5, 0x4A6020, 0, 13, -11);
        makebox(24, 0.5, 0.5, 0x4A6020, 0, 13, 11);
        makebox(0.5, 0.5, 22, 0x4A6020, -11, 13, 0);
        makebox(0.5, 0.5, 22, 0x4A6020, 11, 13, 0);

        // Lower terrace ring
        makebox(36, 0.5, 0.5, 0x4A6020, 0, 7, -17);
        makebox(36, 0.5, 0.5, 0x4A6020, 0, 7, 17);
        makebox(0.5, 0.5, 34, 0x4A6020, -17, 7, 0);
        makebox(0.5, 0.5, 34, 0x4A6020, 17, 7, 0);
    }

    function buildtower() {
        // St Michael's Tower on Tor summit — medieval ruined tower
        makebox(4, 12, 4, 0x888870, 0, 31, 0);
        // Roofless — open top suggested by absence
        // Arched window gaps — dark recessed boxes
        makebox(1.5, 2.5, 0.3, 0x222222, 0, 34, -2.1);
        makebox(1.5, 2.5, 0.3, 0x222222, 0, 34, 2.1);
        makebox(0.3, 2.5, 1.5, 0x222222, -2.1, 34, 0);
        makebox(0.3, 2.5, 1.5, 0x222222, 2.1, 34, 0);
    }

    function buildabbeygrounds() {
        // Abbey grounds — flat green area
        makebox(80, 0.5, 50, 0x447730, -80, 0.25, 0);

        // Two massive old yew trees
        makecylinder(0.6, 0.6, 4, 8, 0x3A2010, -72, 2.25, -10);
        makesphere(5, 8, 6, 0x1A3010, -72, 7, -10);
        makecylinder(0.6, 0.6, 4, 8, 0x3A2010, -88, 2.25, 10);
        makesphere(5, 8, 6, 0x1A3010, -88, 7, 10);
    }

    function buildabbeyruins() {
        // Glastonbury Abbey ruins — 3 roofless nave wall sections
        // North nave wall 20x1x10
        makebox(20, 10, 1, 0x998866, -80, 5.5, -15);
        // South nave wall 20x1x10
        makebox(20, 10, 1, 0x998866, -80, 5.5, 15);
        // East transept wall 10x1x8
        makebox(1, 8, 10, 0x998866, -68, 4.5, 0);

        // Lady Chapel 12x1x8
        makebox(12, 8, 1, 0x998866, -98, 4.5, -8);
        makebox(12, 8, 1, 0x998866, -98, 4.5, 8);
        makebox(1, 8, 16, 0x998866, -105, 4.5, 0);

        // Ornate doorway arch — 2 columns + lintel
        makebox(0.8, 6, 0.8, 0x998866, -68, 3.5, -2);
        makebox(0.8, 6, 0.8, 0x998866, -68, 3.5, 2);
        makebox(0.8, 1, 5, 0x998866, -68, 6.5, 0);
    }

    function buildchalicewell() {
        // Chalice Well — sacred spring in garden
        // Stone well head 2x0.5x2
        makebox(2, 0.5, 2, 0x888870, -60, 0.5, -25);
        // Circular pool — 8 box sections forming ring
        makebox(1, 0.4, 4, 0x336688, -60, 0.3, -21);
        makebox(1, 0.4, 4, 0x336688, -60, 0.3, -29);
        makebox(4, 0.4, 1, 0x336688, -56, 0.3, -25);
        makebox(4, 0.4, 1, 0x336688, -64, 0.3, -25);
        makebox(1, 0.4, 2.8, 0x336688, -57.4, 0.3, -22.4);
        makebox(1, 0.4, 2.8, 0x336688, -62.6, 0.3, -22.4);
        makebox(1, 0.4, 2.8, 0x336688, -57.4, 0.3, -27.6);
        makebox(1, 0.4, 2.8, 0x336688, -62.6, 0.3, -27.6);
    }

    function buildfestival() {
        // Festival main stage — Pyramid Stage approximated by 3 box sections forming A-frame
        makebox(20, 0.5, 15, 0x888888, 60, 0.4, -30);
        makebox(20, 0.5, 12, 0x888888, 60, 4, -30);
        makebox(20, 0.5, 8, 0x888888, 60, 7.5, -30);
        // Apex box
        makebox(4, 1, 3, 0x888888, 60, 10, -30);
        // Speaker tower boxes
        makebox(2, 8, 2, 0x888888, 49, 4.25, -30);
        makebox(2, 8, 2, 0x888888, 71, 4.25, -30);

        // Festival site — mud fields
        makebox(60, 0.3, 60, 0x6A5030, 60, 0.15, 10);

        // Tent cluster 1
        makebox(3, 2, 2, 0xCC8844, 48, 1.25, 5);
        makecone(2, 2, 6, 0xBB7733, 48, 3.25, 5);
        makebox(3, 2, 2, 0x8899CC, 44, 1.25, 5);
        makecone(2, 2, 6, 0x7788BB, 44, 3.25, 5);

        // Tent cluster 2
        makebox(3, 2, 2, 0xCC5544, 72, 1.25, 5);
        makecone(2, 2, 6, 0xBB4433, 72, 3.25, 5);
        makebox(3, 2, 2, 0x44CC88, 68, 1.25, 5);
        makecone(2, 2, 6, 0x33BB77, 68, 3.25, 5);

        // Tent cluster 3
        makebox(3, 2, 2, 0xFFCC44, 48, 1.25, 25);
        makecone(2, 2, 6, 0xEEBB33, 48, 3.25, 25);

        // Tent cluster 4
        makebox(3, 2, 2, 0x9966CC, 72, 1.25, 25);
        makecone(2, 2, 6, 0x8855BB, 72, 3.25, 25);
    }

    function buildtown() {
        // Town high street — 8 quirky buildings (crystal shop, tarot, cafes etc.)
        makebox(4, 5, 6, 0x887755, -40, 2.75, -35);
        makebox(4, 5, 6, 0xCC9966, -34, 2.75, -35);
        makebox(4, 5, 6, 0x887755, -28, 2.75, -35);
        makebox(4, 5, 6, 0xCC9966, -22, 2.75, -35);
        makebox(4, 5, 6, 0x887755, -16, 2.75, -35);
        makebox(4, 5, 6, 0xCC9966, -10, 2.75, -35);
        makebox(4, 5, 6, 0x887755, -4, 2.75, -35);
        makebox(4, 5, 6, 0xCC9966, 2, 2.75, -35);
    }

    function buildwearyallhill() {
        // Wearyall Hill — second conical hill
        makecone(12, 12, 10, 0x558830, -50, 6, -55);

        // Holy Thorn tree on Wearyall Hill
        makecylinder(0.4, 0.4, 4, 8, 0x4A3020, -50, 10, -55);
        makesphere(3, 8, 6, 0x3A5510, -50, 14.5, -55);
    }

    function buildsomersetlevels() {
        // Somerset Levels — flat wetlands surrounding the Tor
        makebox(80, 0.3, 40, 0x5A7A30, 0, 0, 30);

        // Drainage rhynes (water channels) — thin flat boxes
        makebox(1, 0.2, 30, 0x44AACC, -20, 0.1, 30);
        makebox(1, 0.2, 30, 0x44AACC, 0, 0.1, 30);
        makebox(1, 0.2, 30, 0x44AACC, 20, 0.1, 30);
    }

    function build() {
        buildtor();
        buildtower();
        buildabbeygrounds();
        buildabbeyruins();
        buildchalicewell();
        buildfestival();
        buildtown();
        buildwearyallhill();
        buildsomersetlevels();
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
