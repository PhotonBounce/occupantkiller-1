window.PadstowHarbour = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makeline(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var line = new THREE.LineSegments(geo, mat);
        return addMesh(line);
    }

    function buildHarbour() {
        var ox = 14240;

        // Harbour seabed / water surface
        makebox(180, 1, 120, 0x4a7fa5, ox, -1, 20);

        // Inner harbour floor (muddy at low tide)
        makebox(80, 0.5, 60, 0x8b7355, ox - 10, 0, 15);

        // Outer harbour water
        makebox(100, 0.5, 80, 0x3a6f95, ox + 40, 0, 5);

        // Main harbour wall - west arm
        makebox(6, 5, 100, 0x8b8680, ox - 55, 2.5, 10);

        // Main harbour wall - east arm
        makebox(6, 5, 80, 0x8b8680, ox + 55, 2.5, 20);

        // Harbour wall - north connecting section
        makebox(120, 5, 6, 0x8b8680, ox, 2.5, -30);

        // Inner harbour wall
        makebox(6, 4, 60, 0x9b9690, ox - 20, 2, 20);
        makebox(50, 4, 6, 0x9b9690, ox - 5, 2, 50);

        // Quayside - main stone quay
        makebox(100, 2, 20, 0xb0a898, ox, 1, 55);

        // Quayside - fish quay
        makebox(60, 2, 15, 0xa8a098, ox - 20, 1, 70);

        // Lighthouse on harbour wall end
        makecylinder(2, 2.5, 14, 8, 0xf5f5f0, ox + 55, 7, -30);
        makecylinder(1.5, 1.5, 2, 8, 0xe8d44d, ox + 55, 14.5, -30);
        makecone(2, 3, 8, 0xcc2222, ox + 55, 17, -30);

        // Lighthouse lamp room
        makecylinder(0.5, 0.5, 1, 6, 0xffffaa, ox + 55, 14.5, -30);
    }

    function buildFishingBoats() {
        var ox = 14240;

        // Boat 1 - small fishing vessel hull
        makebox(12, 3, 5, 0x4466aa, ox - 30, 1.5, 10);
        makebox(10, 1, 4, 0xeeeedd, ox - 30, 3.5, 10);
        makecylinder(0.3, 0.3, 10, 6, 0x553322, ox - 28, 7, 10);

        // Boat 2
        makebox(10, 2.5, 4, 0x884422, ox + 10, 1.5, 5);
        makebox(8, 1, 3.5, 0xddccbb, ox + 10, 3.5, 5);
        makecylinder(0.25, 0.25, 8, 6, 0x553322, ox + 12, 6, 5);

        // Boat 3 - smaller
        makebox(8, 2, 3.5, 0x336644, ox - 5, 1.5, -15);
        makecylinder(0.2, 0.2, 7, 6, 0x553322, ox - 3, 5, -15);

        // Boat 4 - moored at quay
        makebox(14, 3, 6, 0x224488, ox + 30, 1.5, 40);
        makebox(12, 1.5, 5, 0xeee8d5, ox + 30, 4, 40);
        makecylinder(0.35, 0.35, 12, 6, 0x444433, ox + 32, 7.5, 40);

        // Boat 5 - rusting old trawler
        makebox(16, 3.5, 7, 0x8b5a2b, ox - 45, 1.5, 5);
        makebox(14, 2, 6, 0x7a6a5a, ox - 45, 4, 5);
        makecylinder(0.4, 0.4, 14, 6, 0x333322, ox - 42, 8, 5);
    }

    function buildCrabPots() {
        var ox = 14240;
        var i;

        // Stacked crab pots on quayside - rows of boxes
        for (i = 0; i < 6; i++) {
            makebox(2, 1.5, 1.5, 0x5a7a3a, ox - 40 + i * 3.5, 2, 58);
            makebox(2, 1.5, 1.5, 0x4a6a2a, ox - 40 + i * 3.5, 3.5, 58);
            makebox(2, 1.5, 1.5, 0x3a5a1a, ox - 40 + i * 3.5, 5, 58);
        }

        // Lobster pots - slightly different colour
        for (i = 0; i < 4; i++) {
            makebox(1.8, 1.2, 1.2, 0x6a4a2a, ox + 5 + i * 2.5, 2, 62);
            makebox(1.8, 1.2, 1.2, 0x5a3a1a, ox + 5 + i * 2.5, 3.2, 62);
        }

        // Net loft storage building
        makebox(15, 8, 10, 0x6a6258, ox - 50, 4, 68);
        makebox(15, 0.5, 10, 0x4a4240, ox - 50, 8, 68);
        makecone(0, 0.1, 4, 0x3a3230, ox - 50, 8.05, 68);

        // Ice house - low stone building
        makebox(12, 5, 10, 0x9a9088, ox - 68, 2.5, 60);
        makebox(12, 0.5, 10, 0x7a7068, ox - 68, 5, 60);
    }

    function buildRickStein() {
        var ox = 14240;

        // Main Seafood Restaurant building
        makebox(22, 9, 14, 0xf0ece0, ox - 15, 4.5, 85);
        makebox(22, 0.5, 14, 0x8b7355, ox - 15, 9, 85);
        // Restaurant sign band
        makebox(22, 2, 0.5, 0x1a3a6a, ox - 15, 7, 78.2);
        // Windows
        makebox(3, 3, 0.3, 0x88aacc, ox - 20, 4, 78.1);
        makebox(3, 3, 0.3, 0x88aacc, ox - 15, 4, 78.1);
        makebox(3, 3, 0.3, 0x88aacc, ox - 10, 4, 78.1);

        // Fishmonger shop
        makebox(14, 7, 10, 0xeae6da, ox + 10, 3.5, 82);
        makebox(14, 0.4, 10, 0x7a6a58, ox + 10, 7, 82);
        makebox(4, 2.5, 0.3, 0x99bbdd, ox + 8, 3.5, 77.1);
        makebox(4, 2.5, 0.3, 0x99bbdd, ox + 13, 3.5, 77.1);

        // Deli
        makebox(10, 7, 8, 0xece8dc, ox + 26, 3.5, 80);
        makebox(3, 2.5, 0.3, 0x99bbdd, ox + 25, 3.5, 76.1);

        // Fish and chip shop - corner building
        makebox(12, 7, 10, 0xe8e4d8, ox + 38, 3.5, 78);
        makebox(12, 0.4, 10, 0x6a5a48, ox + 38, 7, 78);

        // Outdoor seating area - tables and chairs
        makebox(3, 0.5, 2, 0xc8b89a, ox - 5, 1.5, 76);
        makebox(3, 0.5, 2, 0xc8b89a, ox + 1, 1.5, 76);
        makebox(3, 0.5, 2, 0xc8b89a, ox - 5, 1.5, 73);
        makebox(3, 0.5, 2, 0xc8b89a, ox + 1, 1.5, 73);
        // Parasols
        makecylinder(0.1, 0.1, 4, 6, 0xaa8866, ox - 4, 3.5, 76);
        makecone(2.5, 1, 8, 0xcc2233, ox - 4, 5.5, 76);
        makecylinder(0.1, 0.1, 4, 6, 0xaa8866, ox + 2, 3.5, 73);
        makecone(2.5, 1, 8, 0x2244aa, ox + 2, 5.5, 73);
    }

    function buildCamelEstuary() {
        var ox = 14240;

        // Wide estuary - sandy/muddy tidal flats
        makebox(250, 0.3, 200, 0xc2aa88, ox + 100, -0.5, -80);

        // Deeper channel water
        makebox(60, 1, 200, 0x4a7fa5, ox + 80, 0, -80);

        // Sand banks
        makebox(40, 0.8, 60, 0xd4bc96, ox + 50, 0.2, -60);
        makebox(30, 0.6, 40, 0xc8b088, ox + 120, 0.2, -100);

        // Rock village across water - distant low buildings
        makebox(8, 4, 6, 0xe8e0d0, ox + 180, 2, -80);
        makebox(10, 5, 7, 0xddd8c8, ox + 194, 2.5, -85);
        makebox(6, 3, 5, 0xe0d8c8, ox + 178, 1.5, -92);
        makebox(7, 4, 6, 0xd8d0c0, ox + 192, 2, -95);
        makebox(9, 5, 7, 0xe4dcc8, ox + 185, 2.5, -105);
        // Rock church tower distant
        makebox(4, 10, 4, 0xc8c0b0, ox + 200, 5, -90);
        makecone(3, 4, 4, 0x888078, ox + 200, 12, -90);

        // Ferry boat crossing
        makebox(8, 1.5, 4, 0xddccaa, ox + 100, 1, -60);
        makebox(6, 1, 3.5, 0xeeeecc, ox + 100, 2.5, -60);
        makecylinder(0.2, 0.2, 5, 6, 0x555544, ox + 102, 4, -60);

        // Camel Trail path alongside estuary
        makebox(250, 0.3, 4, 0xb8a888, ox + 50, 0.4, -30);
    }

    function buildPrideauxPlace() {
        var ox = 14240;

        // Hill raising - ground platform
        makebox(120, 10, 100, 0x6a7a4a, ox - 80, 5, 140);

        // E-plan manor house - central range
        makebox(40, 12, 14, 0xc8b890, ox - 80, 11, 140);
        // E-plan - wings
        makebox(14, 12, 8, 0xc8b890, ox - 97, 11, 135);
        makebox(14, 12, 8, 0xc8b890, ox - 63, 11, 135);
        // Middle projection of E
        makebox(8, 12, 6, 0xc8b890, ox - 80, 11, 133);
        // Gabled roof - central
        makecone(0, 0.01, 4, 0x8a7a6a, ox - 80, 17.5, 140);
        makebox(42, 2, 0.5, 0x9a8a7a, ox - 80, 17, 140);

        // Manor chimneys
        makecylinder(0.4, 0.4, 5, 6, 0xaa9a88, ox - 88, 20, 138);
        makecylinder(0.4, 0.4, 5, 6, 0xaa9a88, ox - 78, 20, 138);
        makecylinder(0.4, 0.4, 5, 6, 0xaa9a88, ox - 68, 20, 138);
        makecylinder(0.4, 0.4, 5, 6, 0xaa9a88, ox - 58, 20, 138);

        // Manor windows
        makebox(2.5, 3, 0.3, 0x88aacc, ox - 90, 11, 133.1);
        makebox(2.5, 3, 0.3, 0x88aacc, ox - 84, 11, 133.1);
        makebox(2.5, 3, 0.3, 0x88aacc, ox - 78, 11, 133.1);
        makebox(2.5, 3, 0.3, 0x88aacc, ox - 72, 11, 133.1);
        makebox(2.5, 3, 0.3, 0x88aacc, ox - 66, 11, 133.1);

        // Gatehouse
        makebox(8, 10, 6, 0xbaa888, ox - 80, 10, 108);
        makebox(3, 10, 3, 0xbaa888, ox - 86, 10, 108);
        makebox(3, 10, 3, 0xbaa888, ox - 74, 10, 108);
        makecone(2, 3, 4, 0x8a7a6a, ox - 86, 16, 108);
        makecone(2, 3, 4, 0x8a7a6a, ox - 74, 16, 108);
        // Gate arch
        makebox(8, 1, 1, 0xaaa090, ox - 80, 14, 108);

        // Gardens - topiary hedges
        makebox(6, 3, 6, 0x3a6a2a, ox - 70, 11.5, 122);
        makebox(6, 3, 6, 0x3a6a2a, ox - 90, 11.5, 122);
        makebox(8, 2, 4, 0x4a7a3a, ox - 80, 11, 125);

        // Deer park grass
        makebox(80, 0.5, 50, 0x5a7a40, ox - 80, 10.2, 118);

        // Some deer (simple shapes)
        makebox(2, 1, 0.8, 0x8a6a4a, ox - 75, 11, 115);
        makecylinder(0.2, 0.3, 1.5, 5, 0x9a7a5a, ox - 75, 12, 115);
        makebox(2, 1, 0.8, 0x8a6a4a, ox - 68, 11, 118);
        makecylinder(0.2, 0.3, 1.5, 5, 0x9a7a5a, ox - 68, 12, 118);
    }

    function buildTownCentre() {
        var ox = 14240;

        // Ground - town streets base
        makebox(120, 0.5, 80, 0xb0a898, ox - 20, 0.2, 95);

        // Narrow street cottages - pastel coloured
        // Row 1 - harbour front
        makebox(7, 7, 6, 0xf9d5d5, ox - 60, 3.5, 85);
        makebox(7, 8, 6, 0xd5e8f9, ox - 52, 4, 85);
        makebox(7, 7, 6, 0xd5f9d5, ox - 44, 3.5, 85);
        makebox(7, 9, 6, 0xf9f2d5, ox - 36, 4.5, 85);
        makebox(7, 7, 6, 0xf9d5f9, ox - 28, 3.5, 85);
        makebox(7, 8, 6, 0xd5d5f9, ox - 22, 4, 85);

        // Row 2 - behind harbour
        makebox(6, 7, 5, 0xfae8e8, ox - 58, 3.5, 93);
        makebox(6, 8, 5, 0xe8f4fa, ox - 51, 4, 93);
        makebox(6, 7, 5, 0xe8fae8, ox - 44, 3.5, 93);
        makebox(6, 8, 5, 0xfaf6e8, ox - 37, 4, 93);
        makebox(6, 7, 5, 0xfae8fa, ox - 30, 3.5, 93);

        // Row 3 - up the hill
        makebox(6, 8, 5, 0xf8e0e0, ox - 55, 4, 101);
        makebox(6, 9, 5, 0xe0f2f8, ox - 48, 4.5, 101);
        makebox(6, 8, 5, 0xe0f8e0, ox - 41, 4, 101);
        makebox(6, 7, 5, 0xf8f4e0, ox - 34, 3.5, 101);

        // Rooftops - slate grey
        makebox(7, 0.5, 6, 0x787068, ox - 60, 7, 85);
        makebox(7, 0.5, 6, 0x787068, ox - 52, 8, 85);
        makebox(7, 0.5, 6, 0x787068, ox - 44, 7, 85);
        makebox(7, 0.5, 6, 0x787068, ox - 36, 9, 85);
        makebox(7, 0.5, 6, 0x787068, ox - 28, 7, 85);
        makebox(7, 0.5, 6, 0x787068, ox - 22, 8, 85);

        // Market Place - open square
        makebox(20, 0.5, 18, 0xc0b8a8, ox + 5, 0.5, 90);

        // Market cross / column
        makecylinder(0.3, 0.5, 6, 6, 0xaaa090, ox + 5, 3.5, 90);
        makebox(2, 0.3, 2, 0xbbb0a0, ox + 5, 6.5, 90);

        // Abbey House
        makebox(18, 10, 12, 0xd8c8a0, ox + 20, 5, 88);
        makebox(18, 0.5, 12, 0xa89878, ox + 20, 10, 88);

        // St Petroc's Church - medieval tower
        makebox(10, 18, 10, 0x9a9088, ox + 40, 9, 95);
        makebox(10, 0.5, 10, 0x8a8078, ox + 40, 18, 95);
        // Tower battlements
        makebox(2, 2, 2, 0x9a9088, ox + 36, 19.5, 91);
        makebox(2, 2, 2, 0x9a9088, ox + 44, 19.5, 91);
        makebox(2, 2, 2, 0x9a9088, ox + 36, 19.5, 99);
        makebox(2, 2, 2, 0x9a9088, ox + 44, 19.5, 99);
        // Church nave
        makebox(18, 10, 22, 0xa0988a, ox + 40, 5, 108);
        makecone(0, 0.01, 4, 0x8a8278, ox + 40, 10.5, 108);
        // Church windows - lancets
        makebox(1.5, 4, 0.3, 0x88aacc, ox + 40, 5, 97.1);
        makebox(1.5, 4, 0.3, 0x88aacc, ox + 36, 5, 97.1);
        makebox(1.5, 4, 0.3, 0x88aacc, ox + 44, 5, 97.1);

        // Narrow streets - alleyways between buildings
        makebox(3, 0.3, 50, 0xa8a098, ox - 63, 0.3, 95);
        makebox(60, 0.3, 3, 0xa8a098, ox - 33, 0.3, 88);
    }

    function buildMayDay() {
        var ox = 14240;

        // Maypole in Market Place
        makecylinder(0.25, 0.25, 12, 8, 0xcc2222, ox + 5, 6.5, 88);
        // Pole top disc
        makecylinder(1.5, 1.5, 0.4, 12, 0xeecc00, ox + 5, 12.5, 88);

        // Ribbon streamers from maypole top - thin cylinders angling out
        makecylinder(0.08, 0.08, 8, 4, 0xcc2222, ox + 1, 9.5, 85);
        makecylinder(0.08, 0.08, 8, 4, 0x2244cc, ox + 3, 9.5, 84);
        makecylinder(0.08, 0.08, 8, 4, 0x22cc44, ox + 7, 9.5, 84);
        makecylinder(0.08, 0.08, 8, 4, 0xcccc22, ox + 9, 9.5, 85);
        makecylinder(0.08, 0.08, 8, 4, 0xcc22cc, ox + 9, 9.5, 91);
        makecylinder(0.08, 0.08, 8, 4, 0xcc8822, ox + 7, 9.5, 92);
        makecylinder(0.08, 0.08, 8, 4, 0x22cccc, ox + 3, 9.5, 92);
        makecylinder(0.08, 0.08, 8, 4, 0xcc4422, ox + 1, 9.5, 91);

        // Blue flag bunting strings - LineSegments across streets
        // Bunting line 1 - across harbour front
        var buntingPoints1 = [
            new THREE.Vector3(ox - 60, 9, 84),
            new THREE.Vector3(ox - 52, 10, 84),
            new THREE.Vector3(ox - 52, 10, 84),
            new THREE.Vector3(ox - 44, 9, 84),
            new THREE.Vector3(ox - 44, 9, 84),
            new THREE.Vector3(ox - 36, 10, 84),
            new THREE.Vector3(ox - 36, 10, 84),
            new THREE.Vector3(ox - 28, 9, 84),
            new THREE.Vector3(ox - 28, 9, 84),
            new THREE.Vector3(ox - 20, 10, 84)
        ];
        makeline(buntingPoints1, 0x1a44bb);

        // Bunting line 2 - across market place
        var buntingPoints2 = [
            new THREE.Vector3(ox - 5, 10, 90),
            new THREE.Vector3(ox + 2, 11, 90),
            new THREE.Vector3(ox + 2, 11, 90),
            new THREE.Vector3(ox + 9, 10, 90),
            new THREE.Vector3(ox + 9, 10, 90),
            new THREE.Vector3(ox + 16, 11, 90),
            new THREE.Vector3(ox + 16, 11, 90),
            new THREE.Vector3(ox + 23, 10, 90)
        ];
        makeline(buntingPoints2, 0x1a44bb);

        // Bunting line 3 - diagonal across quayside
        var buntingPoints3 = [
            new THREE.Vector3(ox - 50, 8, 60),
            new THREE.Vector3(ox - 40, 9, 58),
            new THREE.Vector3(ox - 40, 9, 58),
            new THREE.Vector3(ox - 30, 8, 60),
            new THREE.Vector3(ox - 30, 8, 60),
            new THREE.Vector3(ox - 20, 9, 58),
            new THREE.Vector3(ox - 20, 9, 58),
            new THREE.Vector3(ox - 10, 8, 60)
        ];
        makeline(buntingPoints3, 0x2255cc);

        // Red and white bunting on quay
        var buntingPoints4 = [
            new THREE.Vector3(ox - 50, 6, 55),
            new THREE.Vector3(ox - 40, 7, 55),
            new THREE.Vector3(ox - 40, 7, 55),
            new THREE.Vector3(ox - 30, 6, 55),
            new THREE.Vector3(ox - 30, 6, 55),
            new THREE.Vector3(ox - 20, 7, 55),
            new THREE.Vector3(ox - 20, 7, 55),
            new THREE.Vector3(ox - 10, 6, 55)
        ];
        makeline(buntingPoints4, 0xcc2233);

        // Obby Oss blue flag decorations on buildings
        makebox(3, 2, 0.2, 0x1a44bb, ox - 60, 8, 82.1);
        makebox(3, 2, 0.2, 0x1a44bb, ox - 44, 8, 82.1);
        makebox(3, 2, 0.2, 0x1a44bb, ox - 28, 8, 82.1);
        makebox(3, 2, 0.2, 0xcc2233, ox - 52, 9, 82.1);
        makebox(3, 2, 0.2, 0xcc2233, ox - 36, 9, 82.1);
    }

    function build() {
        buildHarbour();
        buildFishingBoats();
        buildCrabPots();
        buildRickStein();
        buildCamelEstuary();
        buildPrideauxPlace();
        buildTownCentre();
        buildMayDay();
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
