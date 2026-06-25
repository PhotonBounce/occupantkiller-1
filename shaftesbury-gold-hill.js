window.ShaftesburyGoldHill = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 9720;
    var OZ = 0;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        goldhill();
        abbeyruins();
        abbeymuseum();
        panorama();
        townbuildings();
        stpeterschurch();
        townhall();
        hovisboy();
        castlehill();
        saxonstreet();
    }

    function goldhill() {
        // 8 terraced cobblestone steps descending
        var i;
        for (i = 0; i < 8; i++) {
            makebox(3, 0.4, 4, 0x998866, -10, 0.2 - i * 1.5, i * 4);
        }
        // Buttressed stone wall on one side (20x0.5x5)
        makebox(20, 5, 0.5, 0x888870, -2, 2.5, 14);
        // 6 buttress boxes projecting from wall
        for (i = 0; i < 6; i++) {
            makebox(1, 5, 0.5, 0x777760, -2 + i * 3.5 - 7, 2.5, 14.5);
        }
        // 6 cottages on other side
        for (i = 0; i < 6; i++) {
            makebox(3, 4, 4.5, 0xCC9966, -16, 2.0, i * 5 - 2);
            makecone(2, 2, 0x8B7355, -16, 5.0, i * 5 - 2, 4);
        }
    }

    function abbeyruins() {
        // 3 wall sections, roofless
        makebox(12, 5, 1, 0x888870, 20, 2.5, -20);
        makebox(8, 4, 1, 0x888870, 28, 2.0, -14);
        makebox(6, 3, 1, 0x888870, 24, 1.5, -26);
        // Floor tiles flat
        makebox(15, 0.2, 10, 0x999980, 24, 0.1, -20);
    }

    function abbeymuseum() {
        // Modern building
        makebox(10, 6, 4, 0xEEEEEE, 38, 3.0, -20);
        // Artefact display board outside
        makebox(3, 2, 0.1, 0xCCCCCC, 38, 1.8, -16.5);
    }

    function panorama() {
        // Blackmore Vale green valley panorama
        makebox(80, 0.3, 60, 0x5A8030, 0, -0.15, 50);
    }

    function townbuildings() {
        // 8 buildings along high street
        var colors = [0xBBAA88, 0xCC9966, 0xBBAA88, 0xCC9966, 0xBBAA88, 0xCC9966, 0xBBAA88, 0xCC9966];
        var i;
        for (i = 0; i < 8; i++) {
            makebox(5, 6, 5, colors[i], -30 + i * 6, 3.0, -35);
        }
    }

    function stpeterschurch() {
        // Main church body
        makebox(12, 10, 8, 0x888870, 5, 5.0, -50);
        // Corner tower
        makebox(4, 14, 4, 0x888870, -2, 7.0, -46);
        // Tower cone roof
        makecone(2, 3, 0x777760, -2, 15.5, -46, 4);
    }

    function townhall() {
        // Georgian main building
        makebox(14, 9, 8, 0xDDCC99, -20, 4.5, -50);
        // Classical portico columns (4 cylinders)
        makecylinder(0.4, 0.4, 5, 0xCCBB88, -24, 2.5, -45, 8);
        makecylinder(0.4, 0.4, 5, 0xCCBB88, -21, 2.5, -45, 8);
        makecylinder(0.4, 0.4, 5, 0xCCBB88, -18, 2.5, -45, 8);
        makecylinder(0.4, 0.4, 5, 0xCCBB88, -15, 2.5, -45, 8);
        // Pediment box
        makebox(10, 0.5, 3, 0xDDCC99, -20, 5.25, -45);
    }

    function hovisboy() {
        // Bicycle frame
        makebox(1, 0.5, 0.2, 0x886633, -8, 1.25, 32);
        // Front wheel
        makecylinder(0.8, 0.8, 0.1, 0x444444, -7.4, 0.8, 32, 12);
        // Rear wheel
        makecylinder(0.8, 0.8, 0.1, 0x444444, -8.6, 0.8, 32, 12);
        // Bread basket on back
        makebox(0.4, 0.3, 0.3, 0x886633, -9.0, 1.75, 32);
    }

    function castlehill() {
        // Stone viewing platform wall
        makebox(10, 1.2, 0.5, 0x888870, 15, 0.6, 30);
        // 3 benches
        makebox(2, 0.3, 0.5, 0x886633, 10, 0.3, 28);
        makebox(2, 0.3, 0.5, 0x886633, 15, 0.3, 28);
        makebox(2, 0.3, 0.5, 0x886633, 20, 0.3, 28);
    }

    function saxonstreet() {
        // 3 pairs of low wall boxes creating medieval alley
        makebox(0.4, 2, 8, 0x998866, -42, 1.0, -10);
        makebox(0.4, 2, 8, 0x998866, -38, 1.0, -10);
        makebox(0.4, 2, 8, 0x998866, -42, 1.0, -20);
        makebox(0.4, 2, 8, 0x998866, -38, 1.0, -20);
        makebox(0.4, 2, 8, 0x998866, -42, 1.0, -30);
        makebox(0.4, 2, 8, 0x998866, -38, 1.0, -30);
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
