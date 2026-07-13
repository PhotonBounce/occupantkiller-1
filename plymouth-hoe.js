window.PlymouthHoe = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 8960;
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

    function addcyl(rt, rb, h, color, x, y, z, segs) {
        var s = segs || 16;
        var geo = new THREE.CylinderGeometry(rt, rb, h, s);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 16, 16);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 16);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildtower() {
        // Smeaton's Tower - alternating red/white striped lighthouse
        // 6 sections alternating red/white, each 3h, total 18h
        var base = 0.3;
        // Section 1 - red bottom
        addcyl(2.5, 2.5, 3, 0xCC2222, 0, base + 1.5, 0);
        // Section 2 - white
        addcyl(2.5, 2.5, 3, 0xEEEEEE, 0, base + 4.5, 0);
        // Section 3 - red
        addcyl(2.5, 2.5, 3, 0xCC2222, 0, base + 7.5, 0);
        // Section 4 - white
        addcyl(2.5, 2.5, 3, 0xEEEEEE, 0, base + 10.5, 0);
        // Section 5 - red
        addcyl(2.5, 2.5, 3, 0xCC2222, 0, base + 13.5, 0);
        // Section 6 - white top
        addcyl(2.5, 2.5, 3, 0xEEEEEE, 0, base + 16.5, 0);
        // Lantern room
        addsphere(2, 0xFFDD00, 0, base + 19.5, 0);
        // Base plinth
        addcyl(3.2, 3.5, 0.6, 0x888870, 0, 0.3, 0);
    }

    function buildcitadel() {
        // Royal Citadel - 17th century star fort
        // Perimeter walls - 4 sides of rectangle 60x40
        // North wall
        addbox(60, 5, 2, 0x888870, -20, 2.5, -50);
        // South wall
        addbox(60, 5, 2, 0x888870, -20, 2.5, -20);
        // West wall
        addbox(2, 5, 32, 0x888870, -50, 2.5, -35);
        // East wall
        addbox(2, 5, 32, 0x888870, 10, 2.5, -35);
        // Corner bastions
        addbox(5, 2, 5, 0x888870, -52, 5.5, -52);
        addbox(5, 2, 5, 0x888870, 12, 5.5, -52);
        addbox(5, 2, 5, 0x888870, -52, 5.5, -18);
        addbox(5, 2, 5, 0x888870, 12, 5.5, -18);
        // Gatehouse
        addbox(8, 4, 8, 0x777760, -20, 2, -20);
        // Portcullis - dark arch approximated as box
        addbox(2.5, 3, 0.3, 0x333322, -20, 2, -16.2);
        // Inner building
        addbox(20, 4, 15, 0x888870, -20, 2, -37);
    }

    function buildsound() {
        // Plymouth Sound - wide sea bay
        addbox(100, 0.5, 60, 0x1A3355, 40, -0.25, 30);
    }

    function buildvessel() {
        // Naval frigate in Plymouth Sound
        // Hull
        addbox(35, 4, 8, 0x446677, 40, 2, 25);
        // Superstructure block 1
        addbox(12, 3, 6, 0x557788, 38, 5.5, 25);
        // Superstructure block 2 - bridge
        addbox(6, 3, 5, 0x668899, 41, 8.5, 25);
        // Radar mast cylinder
        addcyl(0.2, 0.2, 5, 0x445566, 44, 11, 25);
        // Radar dish
        addcyl(1, 1, 1, 0x99AABB, 44, 13.5, 25, 8);
        // Gun turret forward
        addcyl(0.8, 0.8, 0.6, 0x334455, 52, 4.3, 25, 8);
        // Gun barrel
        addbox(3, 0.2, 0.2, 0x334455, 54, 4.3, 25);
        // Funnel
        addbox(2, 4, 2, 0x445566, 37, 10, 25);
    }

    function buildlido() {
        // Tinside Lido - art deco outdoor pool approximated as octagon
        // 8 box sections forming octagonal pool edge
        var px = -55;
        var pz = -5;
        var r = 9;
        // Pool water inside (flat box)
        addbox(12, 0.2, 12, 0x44AACC, px, 0.1, pz);
        // 8 surround wall sections forming octagon
        addbox(8, 0.8, 0.8, 0xEEEEEE, px, 0.4, pz - r);
        addbox(8, 0.8, 0.8, 0xEEEEEE, px, 0.4, pz + r);
        addbox(0.8, 0.8, 8, 0xEEEEEE, px - r, 0.4, pz);
        addbox(0.8, 0.8, 8, 0xEEEEEE, px + r, 0.4, pz);
        // Diagonal corners
        addbox(5, 0.8, 0.8, 0xEEEEEE, px - 6, 0.4, pz - 6);
        addbox(5, 0.8, 0.8, 0xEEEEEE, px + 6, 0.4, pz - 6);
        addbox(5, 0.8, 0.8, 0xEEEEEE, px - 6, 0.4, pz + 6);
        addbox(5, 0.8, 0.8, 0xEEEEEE, px + 6, 0.4, pz + 6);
        // Changing rooms art deco building
        addbox(14, 3, 4, 0xEEEEEE, px, 1.5, pz - 14);
    }

    function builddrake() {
        // Drake Statue - Sir Francis Drake on pedestal
        // Pedestal
        addcyl(1.5, 1.5, 3, 0x888880, -30, 1.5, -10);
        // Body
        addbox(0.8, 2, 0.5, 0xB87333, -30, 4.5, -10);
        // Head
        addsphere(0.4, 0xB87333, -30, 5.9, -10);
        // Arm (cloak suggestion)
        addbox(1.5, 0.3, 0.4, 0xB87333, -30, 4.8, -10);
    }

    function builddome() {
        // Plymouth Dome visitor centre - half sphere
        addsphere(8, 0x88AACC, -40, -1, -60);
        // Base ring
        addcyl(8.5, 8.5, 1, 0x888870, -40, -5, -60);
    }

    function buildbarbican() {
        // Waterfront Barbican - medieval quayside buildings
        // 6 historic buildings
        addbox(4, 5, 6, 0x887755, 70, 2.5, -10);
        addbox(4, 6, 6, 0x776644, 76, 3, -10);
        addbox(4, 5, 6, 0x887755, 82, 2.5, -10);
        addbox(4, 7, 6, 0x998866, 88, 3.5, -10);
        addbox(4, 5, 6, 0x887755, 94, 2.5, -10);
        addbox(4, 6, 6, 0x776644, 100, 3, -10);
        // Cobbled quay flat
        addbox(20, 0.3, 8, 0x888877, 85, 0.15, -5);
        // Quay extension
        addbox(10, 0.3, 5, 0x888877, 95, 0.15, 0);
    }

    function buildmayflower() {
        // Mayflower Steps - stone steps descending
        // Three step sections
        addbox(4, 0.4, 2, 0x999988, 65, 0.8, 5);
        addbox(4, 0.4, 2, 0x999988, 65, 0.4, 7);
        addbox(4, 0.4, 2, 0x999988, 65, 0.0, 9);
        // Memorial arch - two pillars and top
        addbox(0.4, 3, 0.4, 0xAAAAAA, 63, 1.5, 4);
        addbox(0.4, 3, 0.4, 0xAAAAAA, 67, 1.5, 4);
        addbox(4, 0.4, 0.4, 0xAAAAAA, 65, 3.0, 4);
        // Memorial plaque box
        addbox(2, 1.5, 0.2, 0xCCBB99, 65, 1.5, 3.7);
    }

    function buildmemorial() {
        // Naval War Memorial - obelisk and plinth
        // Plinth base
        addbox(3, 2, 3, 0x888880, 15, 1, -8);
        // Obelisk shaft
        addbox(1, 15, 1, 0x888880, 15, 9.5, -8);
        // Obelisk cap
        addcone(0.8, 2, 0x888880, 15, 18, -8);
        // 4 corner cannons on plinth
        addcyl(0.3, 0.3, 2, 0x333333, 13, 2.5, -6);
        addcyl(0.3, 0.3, 2, 0x333333, 17, 2.5, -6);
        addcyl(0.3, 0.3, 2, 0x333333, 13, 2.5, -10);
        addcyl(0.3, 0.3, 2, 0x333333, 17, 2.5, -10);
    }

    function buildground() {
        // Headland ground - the Hoe
        addbox(120, 0.5, 80, 0x446633, 0, -0.25, -30);
        // Cliff edge suggestion - raised area
        addbox(10, 2, 80, 0x557744, -50, 1, -30);
        // Promenade path
        addbox(60, 0.3, 4, 0xCCCCBB, 0, 0.15, -12);
    }

    function build() {
        buildground();
        buildtower();
        buildcitadel();
        buildsound();
        buildvessel();
        buildlido();
        builddrake();
        builddome();
        buildbarbican();
        buildmayflower();
        buildmemorial();
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
