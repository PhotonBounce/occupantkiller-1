window.CardiffBay = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(geo, mat);
        scene.add(lines);
        objects.push(lines);
        return lines;
    }

    function buildSenedd() {
        var ox = 14440;
        var oz = -60;

        // Main building body - slate clad walls
        makeBox(50, 12, 40, 0x708090, ox, 6, oz);

        // Glass facade front
        makeBox(50, 12, 1, 0x87CEEB, ox, 6, oz - 20);

        // Glass facade sides
        makeBox(1, 12, 40, 0x87CEEB, ox - 25, 6, oz);
        makeBox(1, 12, 40, 0x87CEEB, ox + 25, 6, oz);

        // Distinctive roof funnel/lantern - the iconic inverted funnel
        makeCylinder(8, 20, 6, 12, 0x556677, ox, 18, oz);
        makeCylinder(5, 8, 4, 12, 0x87CEEB, ox, 23, oz);

        // Roof lantern top
        makeCylinder(3, 5, 2, 12, 0x445566, ox, 26, oz);

        // Secondary roof section
        makeBox(45, 2, 35, 0x607080, ox, 13, oz);

        // Public plaza - slate inscription area
        makeBox(60, 0.5, 20, 0x556B6B, ox, 0.25, oz - 28);

        // Plaza inscription slate panels
        makeBox(15, 0.3, 0.5, 0x2F4F4F, ox - 10, 0.5, oz - 30);
        makeBox(15, 0.3, 0.5, 0x2F4F4F, ox + 10, 0.5, oz - 30);

        // Steps to entrance
        makeBox(20, 1, 4, 0x708090, ox, 0.5, oz - 22);
        makeBox(18, 2, 3, 0x708090, ox, 1.5, oz - 20);
        makeBox(16, 3, 2, 0x708090, ox, 2.5, oz - 18);

        // Support columns
        makeCylinder(0.8, 0.8, 12, 8, 0x556677, ox - 20, 6, oz - 18);
        makeCylinder(0.8, 0.8, 12, 8, 0x556677, ox - 10, 6, oz - 18);
        makeCylinder(0.8, 0.8, 12, 8, 0x556677, ox, 6, oz - 18);
        makeCylinder(0.8, 0.8, 12, 8, 0x556677, ox + 10, 6, oz - 18);
        makeCylinder(0.8, 0.8, 12, 8, 0x556677, ox + 20, 6, oz - 18);
    }

    function buildWMC() {
        var ox = 14440;
        var oz = 20;

        // Main massive building body - slate and bronze exterior
        makeBox(80, 25, 50, 0x8B6914, ox, 12.5, oz);

        // Bronze steel facade panels
        makeBox(80, 25, 2, 0xCD7F32, ox, 12.5, oz - 25);

        // Massive arched entrance
        makeBox(20, 18, 3, 0x2F2F2F, ox, 9, oz - 26);
        // Arch curve approximation with boxes
        makeBox(22, 2, 3, 0xCD7F32, ox, 18, oz - 26);
        makeBox(2, 8, 3, 0xCD7F32, ox - 10, 14, oz - 26);
        makeBox(2, 8, 3, 0xCD7F32, ox + 10, 14, oz - 26);

        // Side wings
        makeBox(20, 20, 50, 0x7A5C10, ox - 50, 10, oz);
        makeBox(20, 20, 50, 0x7A5C10, ox + 50, 10, oz);

        // Poem inscription box letters on facade (decorative blocks)
        var letterColor = 0xDAA520;
        makeBox(3, 4, 0.5, letterColor, ox - 30, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox - 24, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox - 18, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox - 12, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox - 6, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 6, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 12, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 18, 20, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 24, 20, oz - 25);

        // Second row of inscription letters
        makeBox(3, 4, 0.5, letterColor, ox - 27, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox - 21, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox - 15, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox - 9, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox - 3, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 3, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 9, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 15, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 21, 14, oz - 25);
        makeBox(3, 4, 0.5, letterColor, ox + 27, 14, oz - 25);

        // Slate roof
        makeBox(80, 3, 50, 0x556B6B, ox, 26.5, oz);

        // Opera house roof rise
        makeBox(60, 8, 35, 0x607070, ox, 31, oz);
    }

    function buildPierhead() {
        var ox = 14440 + 80;
        var oz = -80;

        // Main Victorian Gothic building body - red terracotta
        makeBox(25, 18, 20, 0xCC4422, ox, 9, oz);

        // Red brick facade details
        makeBox(25, 18, 1, 0xBB3311, ox, 9, oz - 10);
        makeBox(25, 18, 1, 0xBB3311, ox, 9, oz + 10);

        // Gothic arched windows - left side
        makeBox(4, 8, 0.5, 0x87CEEB, ox - 8, 10, oz - 10.5);
        makeCylinder(2, 2, 0.5, 8, 0x87CEEB, ox - 8, 15, oz - 10.5);
        makeBox(4, 8, 0.5, 0x87CEEB, ox, 10, oz - 10.5);
        makeCylinder(2, 2, 0.5, 8, 0x87CEEB, ox, 15, oz - 10.5);
        makeBox(4, 8, 0.5, 0x87CEEB, ox + 8, 10, oz - 10.5);
        makeCylinder(2, 2, 0.5, 8, 0x87CEEB, ox + 8, 15, oz - 10.5);

        // Tall clock tower
        makeBox(8, 35, 8, 0xCC4422, ox, 17.5, oz);

        // Tower ornate top sections
        makeBox(9, 3, 9, 0xAA3311, ox, 36.5, oz);
        makeBox(8, 3, 8, 0xBB4422, ox, 40, oz);
        makeBox(7, 3, 7, 0xCC4422, ox, 43.5, oz);

        // Clock faces (4 sides)
        makeBox(5, 5, 0.3, 0xFFFFCC, ox, 30, oz - 4);
        makeBox(5, 5, 0.3, 0xFFFFCC, ox, 30, oz + 4);
        makeBox(0.3, 5, 5, 0xFFFFCC, ox - 4, 30, oz);
        makeBox(0.3, 5, 5, 0xFFFFCC, ox + 4, 30, oz);

        // Tower spire
        makeCone(3.5, 10, 4, 0x882200, ox, 51, oz);

        // Corner turrets
        makeCylinder(2, 2, 15, 8, 0xCC4422, ox - 12, 7.5, oz - 8);
        makeCylinder(2, 2, 15, 8, 0xCC4422, ox + 12, 7.5, oz - 8);
        makeCylinder(2, 2, 15, 8, 0xCC4422, ox - 12, 7.5, oz + 8);
        makeCylinder(2, 2, 15, 8, 0xCC4422, ox + 12, 7.5, oz + 8);

        // Turret tops
        makeCone(2, 5, 8, 0x882200, ox - 12, 17.5, oz - 8);
        makeCone(2, 5, 8, 0x882200, ox + 12, 17.5, oz - 8);
        makeCone(2, 5, 8, 0x882200, ox - 12, 17.5, oz + 8);
        makeCone(2, 5, 8, 0x882200, ox + 12, 17.5, oz + 8);

        // Side wings
        makeBox(15, 12, 20, 0xCC4422, ox - 20, 6, oz);
        makeBox(15, 12, 20, 0xCC4422, ox + 20, 6, oz);
    }

    function buildBarrage() {
        var ox = 14440;
        var oz = 200;

        // Main long low dam structure
        makeBox(400, 8, 25, 0x8B7355, ox, 4, oz);

        // Barrage road surface
        makeBox(400, 1, 18, 0x555555, ox, 8.5, oz);

        // Lock gate structures - left lock
        makeBox(20, 12, 30, 0x6B6B6B, ox - 80, 6, oz);
        makeBox(2, 14, 28, 0x555555, ox - 72, 7, oz);
        makeBox(2, 14, 28, 0x555555, ox - 88, 7, oz);

        // Lock gates (moveable appearance)
        makeBox(8, 14, 1.5, 0x444444, ox - 80, 7, oz - 14);
        makeBox(8, 14, 1.5, 0x444444, ox - 80, 7, oz + 14);

        // Lock gate - right lock
        makeBox(20, 12, 30, 0x6B6B6B, ox + 80, 6, oz);
        makeBox(2, 14, 28, 0x555555, ox + 72, 7, oz);
        makeBox(2, 14, 28, 0x555555, ox + 88, 7, oz);
        makeBox(8, 14, 1.5, 0x444444, ox + 80, 7, oz - 14);
        makeBox(8, 14, 1.5, 0x444444, ox + 80, 7, oz + 14);

        // Fish pass structure
        makeBox(15, 8, 20, 0x7A7060, ox - 160, 4, oz);
        makeBox(12, 6, 18, 0x445544, ox - 160, 4, oz);

        // Barrage control buildings
        makeBox(12, 10, 12, 0x888880, ox - 40, 5, oz);
        makeBox(12, 10, 12, 0x888880, ox + 40, 5, oz);
        makeBox(12, 10, 12, 0x888880, ox, 5, oz);

        // Road railings (line of posts)
        var i;
        for (i = -190; i <= 190; i += 20) {
            makeCylinder(0.3, 0.3, 3, 6, 0xAAAAAA, ox + i, 10, oz - 9);
            makeCylinder(0.3, 0.3, 3, 6, 0xAAAAAA, ox + i, 10, oz + 9);
        }

        // Barrage end abutments
        makeBox(20, 15, 30, 0x8B7355, ox - 200, 7.5, oz);
        makeBox(20, 15, 30, 0x8B7355, ox + 200, 7.5, oz);
    }

    function buildMermaidQuay() {
        var ox = 14440 - 60;
        var oz = -30;

        // Main boardwalk
        makeBox(120, 0.5, 12, 0x8B7355, ox, 0.25, oz);

        // Restaurant building 1 with balcony
        makeBox(20, 10, 15, 0xDDCCAA, ox - 40, 5, oz - 15);
        makeBox(22, 1, 6, 0xBBAA88, ox - 40, 10.5, oz - 12);
        makeBox(20, 8, 12, 0xCC7722, ox - 40, 4, oz - 15);

        // Balcony railings
        makeBox(22, 1, 0.2, 0x888880, ox - 40, 11, oz - 9);
        makeBox(22, 1, 0.2, 0x888880, ox - 40, 11, oz - 15);
        makeBox(0.2, 1, 6, 0x888880, ox - 51, 11, oz - 12);
        makeBox(0.2, 1, 6, 0x888880, ox - 29, 11, oz - 12);

        // Restaurant building 2
        makeBox(20, 12, 15, 0xCCBB99, ox - 15, 6, oz - 15);
        makeBox(22, 1, 5, 0xBBAA88, ox - 15, 12.5, oz - 12.5);
        makeBox(20, 10, 12, 0xBB8833, ox - 15, 5, oz - 15);

        // Restaurant building 3
        makeBox(25, 14, 18, 0xDDCC99, ox + 15, 7, oz - 16);
        makeBox(27, 1, 6, 0xBBAA88, ox + 15, 14.5, oz - 13);

        // Restaurant building 4
        makeBox(18, 10, 14, 0xCCBBAA, ox + 40, 5, oz - 15);
        makeBox(20, 1, 5, 0xBBAA88, ox + 40, 10.5, oz - 12.5);

        // Pontoons extending into bay
        makeBox(8, 0.5, 30, 0x8B7355, ox - 30, 0, oz + 20);
        makeBox(8, 0.5, 30, 0x8B7355, ox, 0, oz + 20);
        makeBox(8, 0.5, 30, 0x8B7355, ox + 30, 0, oz + 20);

        // Connecting pontoon walkway
        makeBox(70, 0.5, 4, 0x7A6348, ox, 0, oz + 12);

        // Moored pleasure boats
        makeBox(8, 2, 18, 0xFFFFFF, ox - 30, 1.5, oz + 22);
        makeCylinder(0.3, 0.3, 12, 6, 0xCCCCCC, ox - 28, 8, oz + 20);
        makeBox(6, 2, 14, 0xEEEEEE, ox, 1.5, oz + 22);
        makeCylinder(0.3, 0.3, 10, 6, 0xCCCCCC, ox + 1, 7, oz + 20);
        makeBox(9, 2.5, 20, 0x4488CC, ox + 30, 1.5, oz + 22);
        makeCylinder(0.3, 0.3, 14, 6, 0xCCCCCC, ox + 30, 9, oz + 20);

        // Boat cabins
        makeBox(5, 2, 6, 0xDDDDDD, ox - 30, 3.5, oz + 20);
        makeBox(4, 2, 5, 0xEEEEEE, ox, 3.5, oz + 20);
        makeBox(6, 2.5, 7, 0x3377BB, ox + 30, 4, oz + 20);

        // Waterfront lamp posts
        var j;
        for (j = -50; j <= 50; j += 20) {
            makeCylinder(0.2, 0.2, 6, 6, 0x888880, ox + j, 3, oz);
            makeSphere(0.5, 6, 6, 0xFFFFCC, ox + j, 6.3, oz);
        }
    }

    function buildNorwegianChurch() {
        var ox = 14440 - 100;
        var oz = -50;

        // Main white timber building body
        makeBox(14, 10, 20, 0xF5F5F0, ox, 5, oz);

        // White painted side walls
        makeBox(14, 10, 1, 0xF0F0F0, ox, 5, oz - 10);
        makeBox(14, 10, 1, 0xF0F0F0, ox, 5, oz + 10);
        makeBox(1, 10, 20, 0xF0F0F0, ox - 7, 5, oz);
        makeBox(1, 10, 20, 0xF0F0F0, ox + 7, 5, oz);

        // Roof - triangular gable ends using boxes
        makeBox(14, 1, 20, 0xE8E8E8, ox, 10.5, oz);
        makeBox(12, 1, 20, 0xE8E8E8, ox, 11.5, oz);
        makeBox(10, 1, 20, 0xE8E8E8, ox, 12.5, oz);
        makeBox(8, 1, 20, 0xE8E8E8, ox, 13.5, oz);
        makeBox(6, 1, 20, 0xE8E8E8, ox, 14.5, oz);
        makeBox(4, 1, 20, 0xE8E8E8, ox, 15.5, oz);
        makeBox(2, 1, 20, 0xE8E8E8, ox, 16.5, oz);

        // Bell tower
        makeBox(6, 16, 6, 0xF5F5F0, ox, 8, oz - 12);

        // Tower roof
        makeBox(6, 1, 6, 0xE8E8E8, ox, 16.5, oz - 12);
        makeBox(5, 1, 5, 0xE8E8E8, ox, 17.5, oz - 12);
        makeBox(4, 1, 4, 0xE8E8E8, ox, 18.5, oz - 12);
        makeBox(3, 1, 3, 0xE8E8E8, ox, 19.5, oz - 12);
        makeBox(2, 1, 2, 0xE8E8E8, ox, 20.5, oz - 12);
        makeBox(1, 1, 1, 0xE8E8E8, ox, 21.5, oz - 12);

        // Bell opening in tower
        makeBox(3, 3, 0.5, 0x888880, ox, 13, oz - 15.1);
        makeBox(3, 3, 0.5, 0x888880, ox, 13, oz - 8.9);
        makeBox(0.5, 3, 3, 0x888880, ox - 3.1, 13, oz - 12);
        makeBox(0.5, 3, 3, 0x888880, ox + 3.1, 13, oz - 12);

        // Bell
        makeSphere(0.8, 8, 8, 0xDAA520, ox, 12, oz - 12);

        // Church windows
        makeBox(2, 4, 0.3, 0x87CEEB, ox - 4, 6, oz - 10.3);
        makeBox(2, 4, 0.3, 0x87CEEB, ox, 6, oz - 10.3);
        makeBox(2, 4, 0.3, 0x87CEEB, ox + 4, 6, oz - 10.3);
        makeBox(2, 4, 0.3, 0x87CEEB, ox - 4, 6, oz + 10.3);
        makeBox(2, 4, 0.3, 0x87CEEB, ox, 6, oz + 10.3);
        makeBox(2, 4, 0.3, 0x87CEEB, ox + 4, 6, oz + 10.3);

        // Front entrance door
        makeBox(3, 5, 0.3, 0x8B4513, ox, 2.5, oz - 10.3);

        // Steps
        makeBox(6, 0.5, 2, 0xDDDDDD, ox, 0.25, oz - 12);

        // Cross on tower top
        makeBox(0.4, 3, 0.4, 0xDDAA00, ox, 23.5, oz - 12);
        makeBox(2, 0.4, 0.4, 0xDDAA00, ox, 24.5, oz - 12);

        // Harbour setting - small jetty
        makeBox(4, 0.4, 15, 0x8B7355, ox + 12, 0.2, oz);
        makeCylinder(0.3, 0.3, 3, 6, 0x8B7355, ox + 10, 1.5, oz - 6);
        makeCylinder(0.3, 0.3, 3, 6, 0x8B7355, ox + 10, 1.5, oz + 6);
    }

    function buildBayWater() {
        var ox = 14440;
        // Bay water surface
        makeBox(500, 0.5, 300, 0x1A4A7A, ox, -0.5, 80);

        // Bay seabed/ground plane
        makeBox(600, 1, 500, 0x4A6A3A, ox, -1.5, 80);
    }

    function build() {
        buildBayWater();
        buildSenedd();
        buildWMC();
        buildPierhead();
        buildBarrage();
        buildMermaidQuay();
        buildNorwegianChurch();
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
