window.RockOfCashel = (function() {
    'use strict';

    var WX = 17200;
    var WZ = 0;

    var scene = null;
    var camera = null;
    var objects = [];

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildlimestonerock() {
        // Natural limestone outcrop — 4 BoxGeometry mound layers, slightly offset for craggy silhouette
        makebox(50, 8, 40, 0xC8C0A8, 0, 4, 0);
        makebox(44, 6, 35, 0xC8C0A8, 1, 11, 1);
        makebox(38, 8, 30, 0xC8C0A8, -1, 18, -1);
        makebox(32, 10, 25, 0xC8C0A8, 2, 27, 2);
    }

    function buildcormacschapel() {
        // Romanesque chapel 1127 — main body
        makebox(14, 10, 10, 0xC8C0A8, -8, 37, -10);
        // Twin square towers on north and south rooflines
        makebox(4, 18, 4, 0xC8C0A8, -12, 41, -7);
        makebox(4, 18, 4, 0xC8C0A8, -4, 41, -7);
        // Round arched doorway — dark inset
        makebox(4, 6, 0.5, 0x3A3028, -8, 34, -15.3);
        // Chevron carving strips implied by BoxGeometry zigzag — north side
        makebox(0.3, 0.3, 4, 0xB8B0A0, -6, 34, -15.2);
        makebox(0.3, 0.3, 4, 0xB8B0A0, -7, 34.3, -15.2);
        makebox(0.3, 0.3, 4, 0xB8B0A0, -8, 34, -15.2);
        makebox(0.3, 0.3, 4, 0xB8B0A0, -9, 34.3, -15.2);
        makebox(0.3, 0.3, 4, 0xB8B0A0, -10, 34, -15.2);
        // Chevron row 2
        makebox(0.3, 0.3, 4, 0xB8B0A0, -6, 35.5, -15.2);
        makebox(0.3, 0.3, 4, 0xB8B0A0, -7, 35.8, -15.2);
        makebox(0.3, 0.3, 4, 0xB8B0A0, -8, 35.5, -15.2);
        makebox(0.3, 0.3, 4, 0xB8B0A0, -9, 35.8, -15.2);
        makebox(0.3, 0.3, 4, 0xB8B0A0, -10, 35.5, -15.2);
    }

    function buildcathedralnave() {
        // Gothic 13th century cathedral ruin — roofless
        makebox(40, 22, 16, 0xC0B8A0, 10, 43, 10);
        // Lancet windows — west side (6 windows)
        makebox(3, 12, 0.5, 0x87CEEB, -5, 47, 2);
        makebox(3, 12, 0.5, 0x87CEEB, 0, 47, 2);
        makebox(3, 12, 0.5, 0x87CEEB, 5, 47, 2);
        makebox(3, 12, 0.5, 0x87CEEB, 10, 47, 2);
        makebox(3, 12, 0.5, 0x87CEEB, 15, 47, 2);
        makebox(3, 12, 0.5, 0x87CEEB, 20, 47, 2);
        // Lancet windows — east side (6 windows)
        makebox(3, 12, 0.5, 0x87CEEB, -5, 47, 18);
        makebox(3, 12, 0.5, 0x87CEEB, 0, 47, 18);
        makebox(3, 12, 0.5, 0x87CEEB, 5, 47, 18);
        makebox(3, 12, 0.5, 0x87CEEB, 10, 47, 18);
        makebox(3, 12, 0.5, 0x87CEEB, 15, 47, 18);
        makebox(3, 12, 0.5, 0x87CEEB, 20, 47, 18);
        // Choir stalls — wooden remains
        makebox(2, 1, 12, 0x8B6914, -2, 33, 5);
        makebox(2, 1, 12, 0x8B6914, 22, 33, 5);
    }

    function buildroundtower() {
        // Irish round tower 28m — shaft
        makecylinder(3.5, 3.5, 28, 8, 0xC8C0A8, 28, 46, -5);
        // Conical cap
        makecone(3.5, 8, 8, 0xB8B0A0, 28, 62, -5);
        // Defensive door 2m above ground — dark box
        makebox(1.5, 3, 0.5, 0x2A2018, 28, 35, -8.6);
        // 4 top windows near cap
        makebox(1, 2, 0.3, 0x2A2018, 31.5, 57, -5);
        makebox(1, 2, 0.3, 0x2A2018, 24.5, 57, -5);
        makebox(1, 2, 0.3, 0x2A2018, 28, 57, -1.5);
        makebox(1, 2, 0.3, 0x2A2018, 28, 57, -8.5);
    }

    function buildhallofvicars() {
        // 15th century Hall of the Vicar's Choral
        makebox(22, 14, 12, 0xC0B8A0, -20, 39, 18);
        // 6 traceried windows
        makebox(3, 8, 0.5, 0x87CEEB, -28, 39, 12);
        makebox(3, 8, 0.5, 0x87CEEB, -24, 39, 12);
        makebox(3, 8, 0.5, 0x87CEEB, -20, 39, 12);
        makebox(3, 8, 0.5, 0x87CEEB, -16, 39, 12);
        makebox(3, 8, 0.5, 0x87CEEB, -12, 39, 12);
        makebox(3, 8, 0.5, 0x87CEEB, -8, 39, 12);
        // Stone fireplace
        makebox(6, 5, 1, 0x888888, -20, 36, 11.6);
    }

    function buildcasheltown() {
        // Town visible below the rock — ground level roughly y=0
        // Town square
        makebox(20, 0.5, 20, 0xC0B0A0, -40, 0.25, 60);
        // 8 town buildings — mix of colors and sizes
        makebox(8, 8, 6, 0xCC5500, -50, 4, 50);
        makebox(10, 7, 8, 0xF5DEB3, -36, 3.5, 48);
        makebox(7, 6, 7, 0xD4C5A9, -28, 3, 52);
        makebox(12, 10, 8, 0xCC5500, -52, 5, 65);
        makebox(6, 6, 6, 0xF5DEB3, -38, 3, 68);
        makebox(9, 8, 7, 0xD4C5A9, -44, 4, 55);
        makebox(8, 7, 6, 0xCC5500, -30, 3.5, 65);
        makebox(11, 9, 8, 0xF5DEB3, -56, 4.5, 55);
        // St John's Cathedral steeple — cylinder shaft + cone cap
        makecylinder(3, 3, 20, 8, 0x888888, -40, 10, 75);
        makecone(3, 8, 8, 0x888888, -40, 24, 75);
    }

    function buildhoreabbey() {
        // Ruined Cistercian Hore Abbey — field below rock
        // Three low ruin walls
        makebox(2, 8, 30, 0xC8C0A8, 50, 4, 40);
        makebox(30, 8, 2, 0xC8C0A8, 65, 4, 40);
        makebox(2, 8, 20, 0xC8C0A8, 80, 4, 30);
        // Arched window stub — outer frame
        makebox(8, 12, 2, 0xC8C0A8, 65, 6, 55);
        // Dark arch inset
        makebox(4, 8, 0.5, 0x2A2018, 65, 5, 54.2);
        // Cattle grazing — 4 bovine boxes
        makebox(3, 2, 5, 0x8B5A2B, 55, 1, 60);
        makebox(3, 2, 5, 0x8B5A2B, 63, 1, 58);
        makebox(3, 2, 5, 0x8B5A2B, 72, 1, 62);
        makebox(3, 2, 5, 0x8B5A2B, 60, 1, 70);
    }

    function buildceltichighcross() {
        // Celtic High Cross in cathedral yard
        // Shaft — hexagonal cylinder
        makecylinder(0.8, 0.8, 12, 6, 0xC0B8A8, 5, 38, -5);
        // Ring at y=8 — horizontal flat cylinder
        makecylinder(3, 3, 0.5, 12, 0xC0B8A8, 5, 40, -5);
        // Arms — horizontal box
        makebox(0.8, 0.8, 6, 0xC0B8A8, 5, 40, -5);
        // Vertical arm
        makebox(0.8, 6, 0.8, 0xC0B8A8, 5, 40, -5);
        // Biblical scene relief panels on shaft
        makebox(0.3, 2, 2, 0xB8B0A0, 5.45, 34, -5);
        makebox(0.3, 2, 2, 0xB8B0A0, 5.45, 36.5, -5);
        makebox(0.3, 2, 2, 0xB8B0A0, 5.45, 39, -5);
        makebox(0.3, 2, 2, 0xB8B0A0, 4.55, 34, -5);
        makebox(0.3, 2, 2, 0xB8B0A0, 4.55, 36.5, -5);
        makebox(0.3, 2, 2, 0xB8B0A0, 4.55, 39, -5);
    }

    function build() {
        buildlimestonerock();
        buildcormacschapel();
        buildcathedralnave();
        buildroundtower();
        buildhallofvicars();
        buildcasheltown();
        buildhoreabbey();
        buildceltichighcross();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) {
        // No animated elements
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
