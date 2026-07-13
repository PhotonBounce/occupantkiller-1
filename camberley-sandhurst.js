window.CamberleySandhurst = (function() {
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

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildOldBuilding() {
        var ox = 12960, oz = -200;

        // Main central block
        addMesh(new THREE.BoxGeometry(60, 30, 25), 0xd4c5a0, ox, 15, oz);

        // Left wing
        addMesh(new THREE.BoxGeometry(35, 22, 20), 0xd4c5a0, ox - 47, 11, oz);

        // Right wing
        addMesh(new THREE.BoxGeometry(35, 22, 20), 0xd4c5a0, ox + 47, 11, oz);

        // Central portico base
        addMesh(new THREE.BoxGeometry(20, 28, 8), 0xe0d5b5, ox, 14, oz - 14);

        // Portico columns (front row)
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 26, 8), 0xf0ebe0, ox - 7, 13, oz - 17);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 26, 8), 0xf0ebe0, ox - 3, 13, oz - 17);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 26, 8), 0xf0ebe0, ox + 3, 13, oz - 17);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 26, 8), 0xf0ebe0, ox + 7, 13, oz - 17);

        // Portico pediment (triangular top)
        addMesh(new THREE.ConeGeometry(12, 6, 3), 0xe0d5b5, ox, 30, oz - 14);

        // Cupola drum base
        addMesh(new THREE.CylinderGeometry(5, 5, 6, 12), 0xd4c5a0, ox, 36, oz);

        // Cupola dome
        addMesh(new THREE.SphereGeometry(5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xb8a882, ox, 39, oz);

        // Cupola lantern
        addMesh(new THREE.CylinderGeometry(1.5, 2, 3, 8), 0x888870, ox, 45, oz);
        addMesh(new THREE.ConeGeometry(1.5, 3, 8), 0x777760, ox, 48, oz);

        // Wing roofs
        addMesh(new THREE.BoxGeometry(35, 3, 20), 0x887766, ox - 47, 23, oz);
        addMesh(new THREE.BoxGeometry(35, 3, 20), 0x887766, ox + 47, 23, oz);

        // Main roof
        addMesh(new THREE.BoxGeometry(60, 3, 25), 0x887766, ox, 31, oz);

        // Wing corner columns left
        addMesh(new THREE.CylinderGeometry(0.7, 0.7, 20, 8), 0xf0ebe0, ox - 63, 10, oz - 9);
        addMesh(new THREE.CylinderGeometry(0.7, 0.7, 20, 8), 0xf0ebe0, ox - 63, 10, oz + 9);

        // Wing corner columns right
        addMesh(new THREE.CylinderGeometry(0.7, 0.7, 20, 8), 0xf0ebe0, ox + 63, 10, oz - 9);
        addMesh(new THREE.CylinderGeometry(0.7, 0.7, 20, 8), 0xf0ebe0, ox + 63, 10, oz + 9);

        // Parade square ground
        addMesh(new THREE.BoxGeometry(120, 0.3, 80), 0x888880, ox, 0.15, oz + 70);

        // Parade square flagpole
        addMesh(new THREE.CylinderGeometry(0.3, 0.4, 25, 8), 0xcccccc, ox, 12.5, oz + 50);

        // Steps to portico
        addMesh(new THREE.BoxGeometry(22, 1, 3), 0xd0c8b0, ox, 1, oz - 20);
        addMesh(new THREE.BoxGeometry(20, 1, 3), 0xd0c8b0, ox, 2, oz - 22);
        addMesh(new THREE.BoxGeometry(18, 1, 3), 0xd0c8b0, ox, 3, oz - 24);

        // Windows on central block
        addMesh(new THREE.BoxGeometry(4, 6, 0.5), 0x7090b0, ox - 20, 18, oz - 13);
        addMesh(new THREE.BoxGeometry(4, 6, 0.5), 0x7090b0, ox - 12, 18, oz - 13);
        addMesh(new THREE.BoxGeometry(4, 6, 0.5), 0x7090b0, ox + 12, 18, oz - 13);
        addMesh(new THREE.BoxGeometry(4, 6, 0.5), 0x7090b0, ox + 20, 18, oz - 13);

        // Windows left wing
        addMesh(new THREE.BoxGeometry(4, 5, 0.5), 0x7090b0, ox - 55, 14, oz - 11);
        addMesh(new THREE.BoxGeometry(4, 5, 0.5), 0x7090b0, ox - 47, 14, oz - 11);
        addMesh(new THREE.BoxGeometry(4, 5, 0.5), 0x7090b0, ox - 39, 14, oz - 11);

        // Windows right wing
        addMesh(new THREE.BoxGeometry(4, 5, 0.5), 0x7090b0, ox + 39, 14, oz - 11);
        addMesh(new THREE.BoxGeometry(4, 5, 0.5), 0x7090b0, ox + 47, 14, oz - 11);
        addMesh(new THREE.BoxGeometry(4, 5, 0.5), 0x7090b0, ox + 55, 14, oz - 11);
    }

    function buildGrandEntrance() {
        var ox = 12960, oz = 0;

        // Left pillar
        addMesh(new THREE.BoxGeometry(4, 16, 4), 0xc8b890, ox - 14, 8, oz);
        addMesh(new THREE.BoxGeometry(5, 2, 5), 0xb8a880, ox - 14, 17, oz);

        // Right pillar
        addMesh(new THREE.BoxGeometry(4, 16, 4), 0xc8b890, ox + 14, 8, oz);
        addMesh(new THREE.BoxGeometry(5, 2, 5), 0xb8a880, ox + 14, 17, oz);

        // Arch over gateway
        addMesh(new THREE.BoxGeometry(24, 3, 4), 0xc8b890, ox, 15, oz);

        // Arch keystone
        addMesh(new THREE.BoxGeometry(3, 4, 4), 0xb0a070, ox, 17, oz);

        // Left sentry box
        addMesh(new THREE.BoxGeometry(3, 8, 3), 0xc8b890, ox - 20, 4, oz);
        addMesh(new THREE.BoxGeometry(3.5, 1, 3.5), 0x887766, ox - 20, 8.5, oz);
        addMesh(new THREE.ConeGeometry(2.2, 3, 4), 0x776655, ox - 20, 11, oz);

        // Right sentry box
        addMesh(new THREE.BoxGeometry(3, 8, 3), 0xc8b890, ox + 20, 4, oz);
        addMesh(new THREE.BoxGeometry(3.5, 1, 3.5), 0x887766, ox + 20, 8.5, oz);
        addMesh(new THREE.ConeGeometry(2.2, 3, 4), 0x776655, ox + 20, 11, oz);

        // Iron gates (represented as dark vertical bars)
        addMesh(new THREE.BoxGeometry(0.5, 10, 0.5), 0x222222, ox - 8, 5, oz);
        addMesh(new THREE.BoxGeometry(0.5, 10, 0.5), 0x222222, ox - 4, 5, oz);
        addMesh(new THREE.BoxGeometry(0.5, 10, 0.5), 0x222222, ox, 5, oz);
        addMesh(new THREE.BoxGeometry(0.5, 10, 0.5), 0x222222, ox + 4, 5, oz);
        addMesh(new THREE.BoxGeometry(0.5, 10, 0.5), 0x222222, ox + 8, 5, oz);

        // Gate crossbar
        addMesh(new THREE.BoxGeometry(20, 0.5, 0.5), 0x222222, ox, 8, oz);
        addMesh(new THREE.BoxGeometry(20, 0.5, 0.5), 0x222222, ox, 4, oz);

        // Flanking low walls
        addMesh(new THREE.BoxGeometry(20, 5, 2), 0xc8b890, ox - 34, 2.5, oz);
        addMesh(new THREE.BoxGeometry(20, 5, 2), 0xc8b890, ox + 34, 2.5, oz);

        // Ornamental sphere finials on pillars
        addMesh(new THREE.SphereGeometry(1.2, 8, 8), 0xd4c090, ox - 14, 19, oz);
        addMesh(new THREE.SphereGeometry(1.2, 8, 8), 0xd4c090, ox + 14, 19, oz);

        // Drive approach
        addMesh(new THREE.BoxGeometry(24, 0.2, 60), 0x999988, ox, 0.1, oz + 30);
    }

    function buildMemorialChapel() {
        var ox = 12960 + 90, oz = -150;

        // Nave
        addMesh(new THREE.BoxGeometry(16, 14, 40), 0xc8c0b0, ox, 7, oz);

        // Chancel (east end)
        addMesh(new THREE.BoxGeometry(12, 12, 16), 0xc8c0b0, ox, 6, oz - 28);

        // Apse (rounded east end)
        addMesh(new THREE.CylinderGeometry(6, 6, 12, 8, 1, false, 0, Math.PI), 0xc0b8a8, ox, 6, oz - 36);

        // Nave roof (pitched)
        addMesh(new THREE.BoxGeometry(16, 2, 40), 0x998877, ox, 14, oz);
        addMesh(new THREE.CylinderGeometry(0.1, 8, 6, 3), 0x998877, ox, 17, oz);

        // Main spire tower
        addMesh(new THREE.BoxGeometry(8, 20, 8), 0xc0b8a8, ox, 10, oz + 18);

        // Spire
        addMesh(new THREE.ConeGeometry(4, 25, 4), 0x887766, ox, 32, oz + 18);

        // Spire cross (horizontal bar)
        addMesh(new THREE.BoxGeometry(4, 0.5, 0.5), 0xdddddd, ox, 44, oz + 18);

        // Buttresses on nave
        addMesh(new THREE.BoxGeometry(3, 12, 5), 0xb8b0a0, ox - 9, 6, oz - 10);
        addMesh(new THREE.BoxGeometry(3, 12, 5), 0xb8b0a0, ox + 9, 6, oz - 10);
        addMesh(new THREE.BoxGeometry(3, 12, 5), 0xb8b0a0, ox - 9, 6, oz + 5);
        addMesh(new THREE.BoxGeometry(3, 12, 5), 0xb8b0a0, ox + 9, 6, oz + 5);

        // Stained glass windows (coloured panels)
        addMesh(new THREE.BoxGeometry(0.3, 7, 3), 0x4466aa, ox - 8, 9, oz - 5);
        addMesh(new THREE.BoxGeometry(0.3, 7, 3), 0xaa4422, ox - 8, 9, oz + 5);
        addMesh(new THREE.BoxGeometry(0.3, 7, 3), 0x44aa44, ox + 8, 9, oz - 5);
        addMesh(new THREE.BoxGeometry(0.3, 7, 3), 0xaaaa22, ox + 8, 9, oz + 5);

        // West rose window
        addMesh(new THREE.CylinderGeometry(3, 3, 0.3, 12), 0x6688cc, ox, 11, oz + 20);

        // Porch
        addMesh(new THREE.BoxGeometry(8, 8, 5), 0xc0b8a8, ox, 4, oz + 22);
        addMesh(new THREE.ConeGeometry(5, 4, 4), 0x998877, ox, 10, oz + 22);

        // Churchyard path
        addMesh(new THREE.BoxGeometry(4, 0.2, 20), 0xaaaaaa, ox, 0.1, oz + 32);

        // Churchyard low wall
        addMesh(new THREE.BoxGeometry(40, 2, 1), 0xb0a890, ox, 1, oz + 43);
        addMesh(new THREE.BoxGeometry(1, 2, 60), 0xb0a890, ox - 20, 1, oz + 15);
        addMesh(new THREE.BoxGeometry(1, 2, 60), 0xb0a890, ox + 20, 1, oz + 15);
    }

    function buildSandhurstLake() {
        var ox = 12960 - 80, oz = -80;

        // Lake surface
        addMesh(new THREE.BoxGeometry(100, 0.3, 60), 0x3355aa, ox, 0.15, oz);

        // Shallow bank variation
        addMesh(new THREE.BoxGeometry(100, 0.5, 5), 0x446688, ox, 0.25, oz - 30);
        addMesh(new THREE.BoxGeometry(100, 0.5, 5), 0x446688, ox, 0.25, oz + 30);

        // Island in lake
        addMesh(new THREE.BoxGeometry(12, 0.8, 10), 0x558844, ox + 10, 0.4, oz - 5);

        // Trees on island
        addMesh(new THREE.CylinderGeometry(0.4, 0.5, 5, 6), 0x664433, ox + 10, 2.5, oz - 5);
        addMesh(new THREE.SphereGeometry(3, 8, 6), 0x226622, ox + 10, 7, oz - 5);
        addMesh(new THREE.CylinderGeometry(0.3, 0.4, 4, 6), 0x664433, ox + 14, 2, oz - 8);
        addMesh(new THREE.SphereGeometry(2.5, 8, 6), 0x336633, ox + 14, 6, oz - 8);

        // Ornamental bridge
        addMesh(new THREE.BoxGeometry(16, 1.5, 5), 0xc8b890, ox - 20, 1, oz);
        addMesh(new THREE.CylinderGeometry(1, 1, 5, 8), 0xb8a880, ox - 28, 2.5, oz - 2);
        addMesh(new THREE.CylinderGeometry(1, 1, 5, 8), 0xb8a880, ox - 28, 2.5, oz + 2);
        addMesh(new THREE.CylinderGeometry(1, 1, 5, 8), 0xb8a880, ox - 12, 2.5, oz - 2);
        addMesh(new THREE.CylinderGeometry(1, 1, 5, 8), 0xb8a880, ox - 12, 2.5, oz + 2);
        addMesh(new THREE.BoxGeometry(1, 3, 5), 0xb0a070, ox - 28, 3.5, oz);
        addMesh(new THREE.BoxGeometry(1, 3, 5), 0xb0a070, ox - 12, 3.5, oz);
        addMesh(new THREE.BoxGeometry(16, 0.3, 0.3), 0xb0a070, ox - 20, 5, oz - 2);
        addMesh(new THREE.BoxGeometry(16, 0.3, 0.3), 0xb0a070, ox - 20, 5, oz + 2);

        // Boathouse
        addMesh(new THREE.BoxGeometry(12, 5, 10), 0x886644, ox + 40, 2.5, oz - 25);
        addMesh(new THREE.BoxGeometry(12, 2, 10), 0x664433, ox + 40, 6, oz - 25);
        addMesh(new THREE.CylinderGeometry(0.1, 6, 4, 3), 0x554433, ox + 40, 7, oz - 25);

        // Boathouse jetty
        addMesh(new THREE.BoxGeometry(3, 0.4, 12), 0x775533, ox + 40, 0.3, oz - 18);

        // Wildfowl (simplified ducks as small spheres near water edge)
        addMesh(new THREE.SphereGeometry(0.5, 6, 6), 0x553300, ox - 35, 1, oz - 28);
        addMesh(new THREE.SphereGeometry(0.4, 6, 6), 0x553300, ox - 32, 1, oz - 27);
        addMesh(new THREE.SphereGeometry(0.5, 6, 6), 0x553300, ox - 30, 1, oz + 26);
        addMesh(new THREE.SphereGeometry(0.4, 6, 6), 0x553300, ox - 27, 1, oz + 28);

        // Lakeside path
        addMesh(new THREE.BoxGeometry(110, 0.2, 3), 0xaaaaaa, ox, 0.1, oz - 34);

        // Lakeside trees
        addMesh(new THREE.CylinderGeometry(0.4, 0.5, 7, 6), 0x664433, ox - 55, 3.5, oz - 34);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x225522, ox - 55, 9, oz - 34);
        addMesh(new THREE.CylinderGeometry(0.4, 0.5, 7, 6), 0x664433, ox - 45, 3.5, oz - 34);
        addMesh(new THREE.SphereGeometry(3.5, 8, 6), 0x336633, ox - 45, 9, oz - 34);
        addMesh(new THREE.CylinderGeometry(0.4, 0.5, 8, 6), 0x664433, ox + 30, 4, oz - 34);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x225522, ox + 30, 10, oz - 34);
    }

    function buildStaffCollege() {
        var ox = 12960 + 150, oz = -60;

        // Main block - red brick Victorian style
        addMesh(new THREE.BoxGeometry(50, 20, 30), 0x8b3a2a, ox, 10, oz);

        // Left extension
        addMesh(new THREE.BoxGeometry(20, 18, 28), 0x8b3a2a, ox - 35, 9, oz);

        // Right extension
        addMesh(new THREE.BoxGeometry(20, 18, 28), 0x8b3a2a, ox + 35, 9, oz);

        // Central tower
        addMesh(new THREE.BoxGeometry(14, 30, 14), 0x7a3020, ox, 15, oz - 5);

        // Tower battlements
        addMesh(new THREE.BoxGeometry(14, 3, 3), 0x7a3020, ox, 31, oz - 11);
        addMesh(new THREE.BoxGeometry(3, 3, 14), 0x7a3020, ox - 5, 31, oz - 5);
        addMesh(new THREE.BoxGeometry(3, 3, 14), 0x7a3020, ox + 5, 31, oz - 5);

        // Battlements merlons on tower
        addMesh(new THREE.BoxGeometry(3, 3, 3), 0x7a3020, ox - 5, 33, oz - 11);
        addMesh(new THREE.BoxGeometry(3, 3, 3), 0x7a3020, ox + 5, 33, oz - 11);
        addMesh(new THREE.BoxGeometry(3, 3, 3), 0x7a3020, ox - 5, 33, oz + 3);
        addMesh(new THREE.BoxGeometry(3, 3, 3), 0x7a3020, ox + 5, 33, oz + 3);

        // Clock face on tower (circular)
        addMesh(new THREE.CylinderGeometry(3, 3, 0.5, 12), 0xddddcc, ox, 22, oz - 12);

        // Terracotta chimneys
        addMesh(new THREE.CylinderGeometry(0.8, 1, 6, 6), 0x993322, ox - 18, 24, oz - 12);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 6, 6), 0x993322, ox + 18, 24, oz - 12);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 6, 6), 0x993322, ox - 40, 22, oz - 10);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 6, 6), 0x993322, ox + 40, 22, oz - 10);

        // Red brick roof line detail
        addMesh(new THREE.BoxGeometry(50, 2, 30), 0x6a2a1a, ox, 21, oz);
        addMesh(new THREE.BoxGeometry(20, 2, 28), 0x6a2a1a, ox - 35, 19, oz);
        addMesh(new THREE.BoxGeometry(20, 2, 28), 0x6a2a1a, ox + 35, 19, oz);

        // Arched entrance doorway
        addMesh(new THREE.BoxGeometry(5, 8, 1), 0x5a2010, ox, 4, oz - 15.5);
        addMesh(new THREE.SphereGeometry(2.5, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0x5a2010, ox, 8, oz - 15.5);

        // Windows - red brick building style
        addMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x88aabb, ox - 15, 12, oz - 15.5);
        addMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x88aabb, ox - 8, 12, oz - 15.5);
        addMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x88aabb, ox + 8, 12, oz - 15.5);
        addMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x88aabb, ox + 15, 12, oz - 15.5);

        // Upper floor windows
        addMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x88aabb, ox - 15, 18, oz - 15.5);
        addMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x88aabb, ox - 8, 18, oz - 15.5);
        addMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x88aabb, ox + 8, 18, oz - 15.5);
        addMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x88aabb, ox + 15, 18, oz - 15.5);

        // Forecourt
        addMesh(new THREE.BoxGeometry(60, 0.2, 30), 0x999988, ox, 0.1, oz + 30);

        // Ornamental lamp posts
        addMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x333333, ox - 25, 4, oz + 18);
        addMesh(new THREE.SphereGeometry(0.8, 6, 6), 0xffffcc, ox - 25, 8.5, oz + 18);
        addMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x333333, ox + 25, 4, oz + 18);
        addMesh(new THREE.SphereGeometry(0.8, 6, 6), 0xffffcc, ox + 25, 8.5, oz + 18);
    }

    function buildCamberleyTown() {
        var ox = 12960 - 200, oz = 100;

        // The Square shopping precinct - main building
        addMesh(new THREE.BoxGeometry(60, 10, 40), 0xccbbaa, ox, 5, oz);

        // Shopping precinct roof canopy
        addMesh(new THREE.BoxGeometry(62, 1, 42), 0xaaaaaa, ox, 10.5, oz);

        // Precinct entrance canopy
        addMesh(new THREE.BoxGeometry(15, 0.5, 8), 0x999999, ox, 10.8, oz - 21);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 6), 0x888888, ox - 5, 5.5, oz - 24);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 6), 0x888888, ox + 5, 5.5, oz - 24);

        // Shop frontages
        addMesh(new THREE.BoxGeometry(58, 4, 0.5), 0xddccbb, ox, 2, oz - 20.5);

        // Shop windows
        addMesh(new THREE.BoxGeometry(8, 3, 0.3), 0x88aacc, ox - 22, 2, oz - 20.7);
        addMesh(new THREE.BoxGeometry(8, 3, 0.3), 0x88aacc, ox - 10, 2, oz - 20.7);
        addMesh(new THREE.BoxGeometry(8, 3, 0.3), 0x88aacc, ox + 2, 2, oz - 20.7);
        addMesh(new THREE.BoxGeometry(8, 3, 0.3), 0x88aacc, ox + 14, 2, oz - 20.7);
        addMesh(new THREE.BoxGeometry(8, 3, 0.3), 0x88aacc, ox + 24, 2, oz - 20.7);

        // Surrey Heath House (council offices)
        addMesh(new THREE.BoxGeometry(30, 25, 20), 0x8899aa, ox + 60, 12.5, oz - 10);
        addMesh(new THREE.BoxGeometry(32, 2, 22), 0x778899, ox + 60, 25.5, oz - 10);

        // Surrey Heath House - curtain wall windows
        addMesh(new THREE.BoxGeometry(28, 22, 0.5), 0x99aabb, ox + 60, 12, oz - 20.5);

        // Surrey Heath flagpole
        addMesh(new THREE.CylinderGeometry(0.2, 0.3, 12, 6), 0xcccccc, ox + 60, 6, oz - 22);

        // Parish church St Michael
        addMesh(new THREE.BoxGeometry(18, 16, 35), 0xc0b8a8, ox - 50, 8, oz - 20);

        // Church nave roof
        addMesh(new THREE.CylinderGeometry(0.1, 9, 5, 3), 0x887766, ox - 50, 18, oz - 20);

        // Church tower
        addMesh(new THREE.BoxGeometry(9, 24, 9), 0xb8b0a0, ox - 50, 12, oz + 5);

        // Church tower battlements
        addMesh(new THREE.BoxGeometry(9, 2, 2), 0xb0a898, ox - 50, 25, oz + 1);
        addMesh(new THREE.BoxGeometry(2, 2, 9), 0xb0a898, ox - 54, 25, oz + 5);
        addMesh(new THREE.BoxGeometry(2, 2, 9), 0xb0a898, ox - 46, 25, oz + 5);

        // Church porch
        addMesh(new THREE.BoxGeometry(7, 8, 5), 0xb8b0a0, ox - 50, 4, oz - 39);
        addMesh(new THREE.ConeGeometry(4, 3, 4), 0x887766, ox - 50, 9.5, oz - 39);

        // Church windows
        addMesh(new THREE.BoxGeometry(0.4, 6, 3), 0x5566aa, ox - 59, 9, oz - 15);
        addMesh(new THREE.BoxGeometry(0.4, 6, 3), 0x5566aa, ox - 59, 9, oz - 25);
        addMesh(new THREE.BoxGeometry(0.4, 6, 3), 0x5566aa, ox - 41, 9, oz - 15);
        addMesh(new THREE.BoxGeometry(0.4, 6, 3), 0x5566aa, ox - 41, 9, oz - 25);

        // Main road through Camberley
        addMesh(new THREE.BoxGeometry(200, 0.2, 12), 0x555555, ox, 0.1, oz + 50);

        // Pavement
        addMesh(new THREE.BoxGeometry(200, 0.2, 5), 0x888880, ox, 0.15, oz + 55);
        addMesh(new THREE.BoxGeometry(200, 0.2, 5), 0x888880, ox, 0.15, oz + 43);

        // Street lamps along road
        addMesh(new THREE.CylinderGeometry(0.2, 0.3, 7, 6), 0x444444, ox - 60, 3.5, oz + 56);
        addMesh(new THREE.SphereGeometry(0.6, 6, 6), 0xffff99, ox - 60, 7.5, oz + 56);
        addMesh(new THREE.CylinderGeometry(0.2, 0.3, 7, 6), 0x444444, ox - 20, 3.5, oz + 56);
        addMesh(new THREE.SphereGeometry(0.6, 6, 6), 0xffff99, ox - 20, 7.5, oz + 56);
        addMesh(new THREE.CylinderGeometry(0.2, 0.3, 7, 6), 0x444444, ox + 20, 3.5, oz + 56);
        addMesh(new THREE.SphereGeometry(0.6, 6, 6), 0xffff99, ox + 20, 7.5, oz + 56);
        addMesh(new THREE.CylinderGeometry(0.2, 0.3, 7, 6), 0x444444, ox + 60, 3.5, oz + 56);
        addMesh(new THREE.SphereGeometry(0.6, 6, 6), 0xffff99, ox + 60, 7.5, oz + 56);

        // Military training grounds boundary fence
        addMesh(new THREE.BoxGeometry(80, 3, 1), 0x665544, ox + 80, 1.5, oz + 80);
        addMesh(new THREE.BoxGeometry(1, 3, 80), 0x665544, ox + 120, 1.5, oz + 40);
        addMesh(new THREE.BoxGeometry(80, 3, 1), 0x665544, ox + 80, 1.5, oz);

        // Military vehicle shed
        addMesh(new THREE.BoxGeometry(30, 8, 15), 0x668844, ox + 80, 4, oz + 40);
        addMesh(new THREE.BoxGeometry(30, 2, 15), 0x557733, ox + 80, 9, oz + 40);

        // Military vehicles (simplified as boxes)
        addMesh(new THREE.BoxGeometry(6, 3, 10), 0x556633, ox + 75, 1.5, oz + 60);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 8), 0x444422, ox + 73, 3.2, oz + 60);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 8), 0x444422, ox + 77, 3.2, oz + 60);

        addMesh(new THREE.BoxGeometry(5, 2.5, 9), 0x556633, ox + 90, 1.5, oz + 60);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 8), 0x444422, ox + 88, 3, oz + 60);
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 1, 8), 0x444422, ox + 92, 3, oz + 60);

        // Parade/training ground surface
        addMesh(new THREE.BoxGeometry(78, 0.2, 78), 0x778866, ox + 80, 0.1, oz + 40);
    }

    function buildGrounds() {
        var ox = 12960;

        // Main grounds lawn
        addMesh(new THREE.BoxGeometry(400, 0.2, 400), 0x558844, ox, 0, -50);

        // Perimeter road
        addMesh(new THREE.BoxGeometry(400, 0.2, 8), 0x666655, ox, 0.1, 180);
        addMesh(new THREE.BoxGeometry(400, 0.2, 8), 0x666655, ox, 0.1, -280);

        // Ornamental trees lining main drive
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 9, 6), 0x664433, ox - 60, 4.5, -50);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x336622, ox - 60, 11, -50);
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 9, 6), 0x664433, ox - 40, 4.5, -50);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x226622, ox - 40, 11, -50);
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 9, 6), 0x664433, ox + 40, 4.5, -50);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x336622, ox + 40, 11, -50);
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 9, 6), 0x664433, ox + 60, 4.5, -50);
        addMesh(new THREE.SphereGeometry(4, 8, 6), 0x226622, ox + 60, 11, -50);

        // Hedgerows
        addMesh(new THREE.BoxGeometry(80, 3, 2), 0x336622, ox - 100, 1.5, -30);
        addMesh(new THREE.BoxGeometry(2, 3, 60), 0x336622, ox - 140, 1.5, -60);

        // Stone boundary wall
        addMesh(new THREE.BoxGeometry(300, 4, 2), 0xb0a088, ox, 2, 195);
        addMesh(new THREE.BoxGeometry(2, 4, 300), 0xb0a088, ox - 150, 2, 45);
        addMesh(new THREE.BoxGeometry(2, 4, 300), 0xb0a088, ox + 150, 2, 45);
    }

    function build() {
        buildGrounds();
        buildOldBuilding();
        buildGrandEntrance();
        buildMemorialChapel();
        buildSandhurstLake();
        buildStaffCollege();
        buildCamberleyTown();
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
