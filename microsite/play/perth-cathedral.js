window.PerthCathedral = (function() {
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

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildStJohnsKirk();
        buildRiverTay();
        buildPerthBridge();
        buildPerthConcertHall();
        buildBalhoussieCastle();
        buildSconePalace();
        buildFairMaidsHouse();
        buildNorthInch();
        buildKinnoulHill();
        buildVictorianHighStreet();
        buildPerthMuseum();
        buildBellsSportsCentre();
        buildCityStreets();
    }

    // ---- GROUND ----
    function buildGround() {
        var geo, mesh;

        // Main ground plane using boxes
        geo = new THREE.BoxGeometry(2000, 2, 2000);
        mesh = makeMesh(geo, 0x8B8B6E);
        mesh.position.set(20160, -1, 0);
        addMesh(mesh);

        // Riverside ground strip (west bank, low)
        geo = new THREE.BoxGeometry(600, 1.5, 2000);
        mesh = makeMesh(geo, 0x6B8B4E);
        mesh.position.set(20000, -0.5, 0);
        addMesh(mesh);
    }

    // ---- ST JOHN'S KIRK ----
    function buildStJohnsKirk() {
        var geo, mesh;
        var base = 20160;

        // Nave (main long body, west-east)
        geo = new THREE.BoxGeometry(30, 18, 70);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 0, 9, 0);
        addMesh(mesh);

        // Transepts (north-south cross arms)
        geo = new THREE.BoxGeometry(70, 16, 22);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 0, 8, 0);
        addMesh(mesh);

        // Central tower base
        geo = new THREE.BoxGeometry(20, 36, 20);
        mesh = makeMesh(geo, 0xBDAA8C);
        mesh.position.set(base + 0, 18, 0);
        addMesh(mesh);

        // Tower parapet (square crenellated cap)
        geo = new THREE.BoxGeometry(22, 4, 22);
        mesh = makeMesh(geo, 0xBDAA8C);
        mesh.position.set(base + 0, 38, 0);
        addMesh(mesh);

        // Tower corner turrets (4 corners)
        geo = new THREE.CylinderGeometry(2.5, 2.5, 8, 6);
        mesh = makeMesh(geo, 0xBDAA8C);
        mesh.position.set(base - 9, 40, -9);
        addMesh(mesh);

        geo = new THREE.CylinderGeometry(2.5, 2.5, 8, 6);
        mesh = makeMesh(geo, 0xBDAA8C);
        mesh.position.set(base + 9, 40, -9);
        addMesh(mesh);

        geo = new THREE.CylinderGeometry(2.5, 2.5, 8, 6);
        mesh = makeMesh(geo, 0xBDAA8C);
        mesh.position.set(base - 9, 40, 9);
        addMesh(mesh);

        geo = new THREE.CylinderGeometry(2.5, 2.5, 8, 6);
        mesh = makeMesh(geo, 0xBDAA8C);
        mesh.position.set(base + 9, 40, 9);
        addMesh(mesh);

        // Choir / chancel (east end, slightly narrower)
        geo = new THREE.BoxGeometry(22, 15, 30);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 0, 7.5, 45);
        addMesh(mesh);

        // Chancel apse (east end rounded cap using cylinder)
        geo = new THREE.CylinderGeometry(11, 11, 15, 8, 1, false, 0, Math.PI);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 0, 7.5, 60);
        mesh.rotation.y = Math.PI / 2;
        addMesh(mesh);

        // West porch
        geo = new THREE.BoxGeometry(14, 10, 8);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 0, 5, -40);
        addMesh(mesh);

        // Nave roof (pitched, approximated by thin tall box + cone sections)
        geo = new THREE.BoxGeometry(28, 4, 68);
        mesh = makeMesh(geo, 0x9A8B78);
        mesh.position.set(base + 0, 20, 0);
        addMesh(mesh);

        // Flying buttresses north nave (3)
        geo = new THREE.BoxGeometry(2, 8, 10);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base - 20, 10, -20);
        mesh.rotation.z = 0.35;
        addMesh(mesh);

        geo = new THREE.BoxGeometry(2, 8, 10);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base - 20, 10, 0);
        mesh.rotation.z = 0.35;
        addMesh(mesh);

        geo = new THREE.BoxGeometry(2, 8, 10);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base - 20, 10, 20);
        mesh.rotation.z = 0.35;
        addMesh(mesh);

        // Flying buttresses south nave (3)
        geo = new THREE.BoxGeometry(2, 8, 10);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 20, 10, -20);
        mesh.rotation.z = -0.35;
        addMesh(mesh);

        geo = new THREE.BoxGeometry(2, 8, 10);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 20, 10, 0);
        mesh.rotation.z = -0.35;
        addMesh(mesh);

        geo = new THREE.BoxGeometry(2, 8, 10);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 20, 10, 20);
        mesh.rotation.z = -0.35;
        addMesh(mesh);

        // Gothic window details (dark recesses in north wall)
        geo = new THREE.BoxGeometry(0.8, 5, 4);
        mesh = makeMesh(geo, 0x3A3A5A);
        mesh.position.set(base - 15.5, 10, -22);
        addMesh(mesh);

        geo = new THREE.BoxGeometry(0.8, 5, 4);
        mesh = makeMesh(geo, 0x3A3A5A);
        mesh.position.set(base - 15.5, 10, 0);
        addMesh(mesh);

        geo = new THREE.BoxGeometry(0.8, 5, 4);
        mesh = makeMesh(geo, 0x3A3A5A);
        mesh.position.set(base - 15.5, 10, 22);
        addMesh(mesh);

        // Kirkyard boundary wall
        geo = new THREE.BoxGeometry(120, 3, 2);
        mesh = makeMesh(geo, 0xA09080);
        mesh.position.set(base + 0, 1.5, -75);
        addMesh(mesh);

        geo = new THREE.BoxGeometry(120, 3, 2);
        mesh = makeMesh(geo, 0xA09080);
        mesh.position.set(base + 0, 1.5, 75);
        addMesh(mesh);

        geo = new THREE.BoxGeometry(2, 3, 150);
        mesh = makeMesh(geo, 0xA09080);
        mesh.position.set(base - 60, 1.5, 0);
        addMesh(mesh);

        geo = new THREE.BoxGeometry(2, 3, 150);
        mesh = makeMesh(geo, 0xA09080);
        mesh.position.set(base + 60, 1.5, 0);
        addMesh(mesh);
    }

    // ---- RIVER TAY ----
    function buildRiverTay() {
        var geo, mesh;
        var base = 20160;

        // Main river channel (wide, east of city)
        geo = new THREE.BoxGeometry(160, 0.5, 2000);
        mesh = makeMesh(geo, 0x006994);
        mesh.position.set(base + 300, 0.2, 0);
        addMesh(mesh);

        // River surface shimmer strip
        geo = new THREE.BoxGeometry(150, 0.3, 2000);
        mesh = makeMesh(geo, 0x1A7FAA);
        mesh.position.set(base + 300, 0.4, 0);
        addMesh(mesh);

        // East bank
        geo = new THREE.BoxGeometry(200, 2, 2000);
        mesh = makeMesh(geo, 0x6B8040);
        mesh.position.set(base + 430, -0.5, 0);
        addMesh(mesh);
    }

    // ---- PERTH BRIDGE ----
    function buildPerthBridge() {
        var geo, mesh, i;
        var base = 20160;
        var bridgeZ = 100;

        // Bridge deck
        geo = new THREE.BoxGeometry(165, 3, 18);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 300, 4, bridgeZ);
        addMesh(mesh);

        // 9 arches (piers between arches)
        for (i = 0; i < 9; i++) {
            // Pier
            geo = new THREE.BoxGeometry(6, 10, 14);
            mesh = makeMesh(geo, 0xBDAA8C);
            mesh.position.set(base + 225 + i * 18, 0, bridgeZ);
            addMesh(mesh);

            // Arch opening (dark box inset)
            geo = new THREE.BoxGeometry(10, 5, 3);
            mesh = makeMesh(geo, 0x2A2A2A);
            mesh.position.set(base + 225 + i * 18, 2, bridgeZ);
            addMesh(mesh);
        }

        // Bridge parapets
        geo = new THREE.BoxGeometry(165, 2, 2);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 300, 6.5, bridgeZ - 9);
        addMesh(mesh);

        geo = new THREE.BoxGeometry(165, 2, 2);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(base + 300, 6.5, bridgeZ + 9);
        addMesh(mesh);
    }

    // ---- PERTH CONCERT HALL ----
    function buildPerthConcertHall() {
        var geo, mesh;
        var base = 20160;
        var cx = base - 80;
        var cz = -120;

        // Main hall volume
        geo = new THREE.BoxGeometry(60, 20, 45);
        mesh = makeMesh(geo, 0xD3D3D3);
        mesh.position.set(cx, 10, cz);
        addMesh(mesh);

        // Glass curtain wall facade (dark blue-grey)
        geo = new THREE.BoxGeometry(61, 18, 2);
        mesh = makeMesh(geo, 0x5A7A8A);
        mesh.position.set(cx, 9, cz - 23.5);
        addMesh(mesh);

        // Foyer wing
        geo = new THREE.BoxGeometry(25, 12, 20);
        mesh = makeMesh(geo, 0xC8C8C8);
        mesh.position.set(cx - 42, 6, cz);
        addMesh(mesh);

        // Foyer glass front
        geo = new THREE.BoxGeometry(2, 10, 18);
        mesh = makeMesh(geo, 0x7A9AAA);
        mesh.position.set(cx - 54.5, 6, cz);
        addMesh(mesh);

        // Roof feature box
        geo = new THREE.BoxGeometry(55, 4, 40);
        mesh = makeMesh(geo, 0xB8B8B8);
        mesh.position.set(cx, 22, cz);
        addMesh(mesh);

        // Steps at entrance
        geo = new THREE.BoxGeometry(20, 1.5, 6);
        mesh = makeMesh(geo, 0xA8A8A8);
        mesh.position.set(cx, 0.75, cz - 26);
        addMesh(mesh);
    }

    // ---- BALHOUSIE CASTLE ----
    function buildBalhoussieCastle() {
        var geo, mesh;
        var base = 20160;
        var cx = base - 150;
        var cz = 200;

        // Main L-plan tower house body
        geo = new THREE.BoxGeometry(22, 28, 18);
        mesh = makeMesh(geo, 0x8B7355);
        mesh.position.set(cx, 14, cz);
        addMesh(mesh);

        // L-plan wing
        geo = new THREE.BoxGeometry(16, 22, 14);
        mesh = makeMesh(geo, 0x8B7355);
        mesh.position.set(cx + 18, 11, cz - 8);
        addMesh(mesh);

        // Victorian addition block
        geo = new THREE.BoxGeometry(30, 18, 16);
        mesh = makeMesh(geo, 0x9B8060);
        mesh.position.set(cx - 26, 9, cz + 4);
        addMesh(mesh);

        // Tower top battlements
        geo = new THREE.BoxGeometry(24, 3, 20);
        mesh = makeMesh(geo, 0x7A6345);
        mesh.position.set(cx, 29.5, cz);
        addMesh(mesh);

        // Corner turret north-east
        geo = new THREE.CylinderGeometry(3, 3, 10, 6);
        mesh = makeMesh(geo, 0x8B7355);
        mesh.position.set(cx + 11, 32, cz - 9);
        addMesh(mesh);

        // Turret conical cap
        geo = new THREE.ConeGeometry(3.5, 5, 6);
        mesh = makeMesh(geo, 0x5A4535);
        mesh.position.set(cx + 11, 39, cz - 9);
        addMesh(mesh);

        // Corner turret south-west
        geo = new THREE.CylinderGeometry(3, 3, 8, 6);
        mesh = makeMesh(geo, 0x8B7355);
        mesh.position.set(cx - 11, 30, cz + 9);
        addMesh(mesh);

        geo = new THREE.ConeGeometry(3.5, 4, 6);
        mesh = makeMesh(geo, 0x5A4535);
        mesh.position.set(cx - 11, 36, cz + 9);
        addMesh(mesh);

        // Grounds wall
        geo = new THREE.BoxGeometry(90, 2.5, 2);
        mesh = makeMesh(geo, 0x7A6A55);
        mesh.position.set(cx, 1.25, cz - 30);
        addMesh(mesh);
    }

    // ---- SCONE PALACE ----
    function buildSconePalace() {
        var geo, mesh;
        var base = 20160;
        var cx = base + 180;
        var cz = -250;

        // Main central block
        geo = new THREE.BoxGeometry(55, 24, 30);
        mesh = makeMesh(geo, 0xCD5C5C);
        mesh.position.set(cx, 12, cz);
        addMesh(mesh);

        // Left (north) castellated wing
        geo = new THREE.BoxGeometry(20, 20, 26);
        mesh = makeMesh(geo, 0xCD5C5C);
        mesh.position.set(cx - 37, 10, cz);
        addMesh(mesh);

        // Right (south) castellated wing
        geo = new THREE.BoxGeometry(20, 20, 26);
        mesh = makeMesh(geo, 0xCD5C5C);
        mesh.position.set(cx + 37, 10, cz);
        addMesh(mesh);

        // Battlements main block
        geo = new THREE.BoxGeometry(57, 3, 32);
        mesh = makeMesh(geo, 0xBB4A4A);
        mesh.position.set(cx, 25.5, cz);
        addMesh(mesh);

        // Battlements left wing
        geo = new THREE.BoxGeometry(22, 3, 28);
        mesh = makeMesh(geo, 0xBB4A4A);
        mesh.position.set(cx - 37, 21.5, cz);
        addMesh(mesh);

        // Battlements right wing
        geo = new THREE.BoxGeometry(22, 3, 28);
        mesh = makeMesh(geo, 0xBB4A4A);
        mesh.position.set(cx + 37, 21.5, cz);
        addMesh(mesh);

        // Central tower
        geo = new THREE.BoxGeometry(14, 32, 14);
        mesh = makeMesh(geo, 0xBB4A4A);
        mesh.position.set(cx, 16, cz);
        addMesh(mesh);

        // Tower parapet
        geo = new THREE.BoxGeometry(16, 3, 16);
        mesh = makeMesh(geo, 0xAA3A3A);
        mesh.position.set(cx, 33.5, cz);
        addMesh(mesh);

        // Entrance portico
        geo = new THREE.BoxGeometry(16, 12, 8);
        mesh = makeMesh(geo, 0xD06060);
        mesh.position.set(cx, 6, cz - 19);
        addMesh(mesh);

        // Grounds lawn
        geo = new THREE.BoxGeometry(160, 0.5, 100);
        mesh = makeMesh(geo, 0x4A7C3F);
        mesh.position.set(cx, 0.2, cz + 20);
        addMesh(mesh);
    }

    // ---- FAIR MAID'S HOUSE ----
    function buildFairMaidsHouse() {
        var geo, mesh;
        var base = 20160;
        var cx = base + 40;
        var cz = -60;

        // Main medieval house body
        geo = new THREE.BoxGeometry(14, 9, 10);
        mesh = makeMesh(geo, 0xF5F0E8);
        mesh.position.set(cx, 4.5, cz);
        addMesh(mesh);

        // Jettied upper storey (overhanging)
        geo = new THREE.BoxGeometry(15, 5, 11);
        mesh = makeMesh(geo, 0xEDE8DC);
        mesh.position.set(cx, 11.5, cz);
        addMesh(mesh);

        // Pitched roof
        geo = new THREE.BoxGeometry(15, 3, 11);
        mesh = makeMesh(geo, 0x8B7355);
        mesh.position.set(cx, 15.5, cz);
        addMesh(mesh);

        // Chimney stack
        geo = new THREE.BoxGeometry(2, 5, 2);
        mesh = makeMesh(geo, 0xC8B89A);
        mesh.position.set(cx + 4, 19, cz - 3);
        addMesh(mesh);

        // Small outbuilding
        geo = new THREE.BoxGeometry(8, 6, 7);
        mesh = makeMesh(geo, 0xF0EBE0);
        mesh.position.set(cx + 13, 3, cz + 2);
        addMesh(mesh);
    }

    // ---- NORTH INCH ----
    function buildNorthInch() {
        var geo, mesh, i;
        var base = 20160;
        var cx = base + 200;
        var cz = 180;

        // Main parkland
        geo = new THREE.BoxGeometry(200, 0.5, 300);
        mesh = makeMesh(geo, 0x4A7C3F);
        mesh.position.set(cx, 0.2, cz);
        addMesh(mesh);

        // Golf course fairway strips
        geo = new THREE.BoxGeometry(30, 0.6, 120);
        mesh = makeMesh(geo, 0x5A9048);
        mesh.position.set(cx - 50, 0.3, cz - 60);
        addMesh(mesh);

        geo = new THREE.BoxGeometry(30, 0.6, 120);
        mesh = makeMesh(geo, 0x5A9048);
        mesh.position.set(cx + 50, 0.3, cz + 60);
        addMesh(mesh);

        // Park trees (cylinders + spheres)
        for (i = 0; i < 8; i++) {
            // Trunk
            geo = new THREE.CylinderGeometry(0.8, 1, 8, 5);
            mesh = makeMesh(geo, 0x5C4A2A);
            mesh.position.set(cx - 80 + i * 22, 4, cz - 100);
            addMesh(mesh);

            // Canopy
            geo = new THREE.SphereGeometry(5, 6, 5);
            mesh = makeMesh(geo, 0x3A6B2A);
            mesh.position.set(cx - 80 + i * 22, 11, cz - 100);
            addMesh(mesh);
        }

        // Sports pavilion
        geo = new THREE.BoxGeometry(25, 6, 12);
        mesh = makeMesh(geo, 0xE8E0D0);
        mesh.position.set(cx, 3, cz + 130);
        addMesh(mesh);

        geo = new THREE.BoxGeometry(27, 2, 14);
        mesh = makeMesh(geo, 0x8B7355);
        mesh.position.set(cx, 7, cz + 130);
        addMesh(mesh);
    }

    // ---- KINNOULL HILL ----
    function buildKinnoulHill() {
        var geo, mesh, i;
        var base = 20160;
        var cx = base + 500;
        var cz = 0;

        // Main hill mass (large wedge approximated with scaled boxes)
        geo = new THREE.BoxGeometry(250, 80, 300);
        mesh = makeMesh(geo, 0x3D6B30);
        mesh.position.set(cx, 40, cz);
        addMesh(mesh);

        // Cliff face (east, darker)
        geo = new THREE.BoxGeometry(30, 70, 120);
        mesh = makeMesh(geo, 0x5A5A4A);
        mesh.position.set(cx - 120, 35, cz);
        addMesh(mesh);

        // Hilltop plateau
        geo = new THREE.BoxGeometry(120, 10, 140);
        mesh = makeMesh(geo, 0x4A7A38);
        mesh.position.set(cx + 20, 82, cz);
        addMesh(mesh);

        // Kinnoull Tower folly (perched on cliff edge)
        geo = new THREE.CylinderGeometry(5, 6, 22, 8);
        mesh = makeMesh(geo, 0xB8A888);
        mesh.position.set(cx - 100, 92, cz - 30);
        addMesh(mesh);

        // Tower conical roof
        geo = new THREE.ConeGeometry(6, 8, 8);
        mesh = makeMesh(geo, 0x7A6A5A);
        mesh.position.set(cx - 100, 107, cz - 30);
        addMesh(mesh);

        // Wooded slope trees
        for (i = 0; i < 6; i++) {
            geo = new THREE.CylinderGeometry(0.8, 1.2, 10, 5);
            mesh = makeMesh(geo, 0x4A3A1A);
            mesh.position.set(cx - 60 + i * 20, 85, cz + 20 - i * 15);
            addMesh(mesh);

            geo = new THREE.ConeGeometry(5, 12, 6);
            mesh = makeMesh(geo, 0x2A5A1A);
            mesh.position.set(cx - 60 + i * 20, 97, cz + 20 - i * 15);
            addMesh(mesh);
        }
    }

    // ---- VICTORIAN HIGH STREET ----
    function buildVictorianHighStreet() {
        var geo, mesh, i;
        var base = 20160;
        var cz = -30;

        // Row of Victorian commercial buildings (north side)
        for (i = 0; i < 6; i++) {
            // Main building body
            geo = new THREE.BoxGeometry(18, 16 + i % 3 * 3, 14);
            mesh = makeMesh(geo, i % 2 === 0 ? 0xF5F0E8 : 0xCD5C5C);
            mesh.position.set(base - 110 + i * 22, (16 + i % 3 * 3) / 2, cz - 30);
            addMesh(mesh);

            // Cornicing strip
            geo = new THREE.BoxGeometry(19, 1.5, 2);
            mesh = makeMesh(geo, 0xE0D8C8);
            mesh.position.set(base - 110 + i * 22, 16 + i % 3 * 3, cz - 37.5);
            addMesh(mesh);

            // Ground floor shopfront
            geo = new THREE.BoxGeometry(14, 5, 1.5);
            mesh = makeMesh(geo, 0x3A3A4A);
            mesh.position.set(base - 110 + i * 22, 2.5, cz - 37.4);
            addMesh(mesh);
        }

        // Row of Victorian buildings (south side)
        for (i = 0; i < 5; i++) {
            geo = new THREE.BoxGeometry(20, 14 + i % 2 * 4, 13);
            mesh = makeMesh(geo, i % 2 === 0 ? 0xEDE5D5 : 0xD4A8A0);
            mesh.position.set(base - 100 + i * 24, (14 + i % 2 * 4) / 2, cz + 30);
            addMesh(mesh);

            // Upper ornamentation band
            geo = new THREE.BoxGeometry(21, 2, 2);
            mesh = makeMesh(geo, 0xCCC4B4);
            mesh.position.set(base - 100 + i * 24, 14 + i % 2 * 4, cz + 23);
            addMesh(mesh);
        }
    }

    // ---- PERTH MUSEUM ----
    function buildPerthMuseum() {
        var geo, mesh;
        var base = 20160;
        var cx = base - 30;
        var cz = -160;

        // Main neoclassical block
        geo = new THREE.BoxGeometry(40, 16, 25);
        mesh = makeMesh(geo, 0xD4C9B0);
        mesh.position.set(cx, 8, cz);
        addMesh(mesh);

        // Pediment / triangular gable
        geo = new THREE.BoxGeometry(42, 6, 4);
        mesh = makeMesh(geo, 0xC8BC9C);
        mesh.position.set(cx, 19, cz - 12.5);
        addMesh(mesh);

        // Columns (6 in portico)
        var colPositions = [-15, -9, -3, 3, 9, 15];
        for (var i = 0; i < colPositions.length; i++) {
            geo = new THREE.CylinderGeometry(1.2, 1.4, 14, 7);
            mesh = makeMesh(geo, 0xE0D5BB);
            mesh.position.set(cx + colPositions[i], 7, cz - 14);
            addMesh(mesh);
        }

        // Entablature frieze
        geo = new THREE.BoxGeometry(44, 3, 3);
        mesh = makeMesh(geo, 0xD4C9B0);
        mesh.position.set(cx, 15.5, cz - 14);
        addMesh(mesh);

        // Steps
        geo = new THREE.BoxGeometry(30, 1.5, 5);
        mesh = makeMesh(geo, 0xC0B898);
        mesh.position.set(cx, 0.75, cz - 16);
        addMesh(mesh);

        // Side wing extension
        geo = new THREE.BoxGeometry(14, 12, 22);
        mesh = makeMesh(geo, 0xD0C5AC);
        mesh.position.set(cx + 27, 6, cz);
        addMesh(mesh);
    }

    // ---- BELL'S SPORTS CENTRE ----
    function buildBellsSportsCentre() {
        var geo, mesh;
        var base = 20160;
        var cx = base + 80;
        var cz = 220;

        // Main sports hall
        geo = new THREE.BoxGeometry(70, 14, 50);
        mesh = makeMesh(geo, 0xC8C8C8);
        mesh.position.set(cx, 7, cz);
        addMesh(mesh);

        // Swimming pool wing (slightly lower)
        geo = new THREE.BoxGeometry(40, 10, 35);
        mesh = makeMesh(geo, 0xB0B8C0);
        mesh.position.set(cx - 55, 5, cz);
        addMesh(mesh);

        // Entrance canopy
        geo = new THREE.BoxGeometry(25, 3, 10);
        mesh = makeMesh(geo, 0xD8D8D8);
        mesh.position.set(cx, 10, cz - 30);
        addMesh(mesh);

        // Support pillars for canopy
        geo = new THREE.CylinderGeometry(0.8, 0.8, 10, 5);
        mesh = makeMesh(geo, 0xB8B8B8);
        mesh.position.set(cx - 10, 5, cz - 30);
        addMesh(mesh);

        geo = new THREE.CylinderGeometry(0.8, 0.8, 10, 5);
        mesh = makeMesh(geo, 0xB8B8B8);
        mesh.position.set(cx + 10, 5, cz - 30);
        addMesh(mesh);

        // Roof plant/equipment box
        geo = new THREE.BoxGeometry(15, 4, 8);
        mesh = makeMesh(geo, 0xA8A8A8);
        mesh.position.set(cx + 20, 16, cz);
        addMesh(mesh);

        // Car park surface
        geo = new THREE.BoxGeometry(100, 0.4, 40);
        mesh = makeMesh(geo, 0x5A5A5A);
        mesh.position.set(cx, 0.2, cz - 55);
        addMesh(mesh);
    }

    // ---- CITY STREETS ----
    function buildCityStreets() {
        var geo, mesh;
        var base = 20160;

        // Main north-south street (High Street)
        geo = new THREE.BoxGeometry(12, 0.4, 400);
        mesh = makeMesh(geo, 0x4A4A4A);
        mesh.position.set(base - 60, 0.2, 0);
        addMesh(mesh);

        // George Street (east-west)
        geo = new THREE.BoxGeometry(350, 0.4, 12);
        mesh = makeMesh(geo, 0x4A4A4A);
        mesh.position.set(base - 60, 0.2, -160);
        addMesh(mesh);

        // South Methven Street
        geo = new THREE.BoxGeometry(12, 0.4, 300);
        mesh = makeMesh(geo, 0x4A4A4A);
        mesh.position.set(base + 60, 0.2, -80);
        addMesh(mesh);

        // Marshall Place (riverside road)
        geo = new THREE.BoxGeometry(250, 0.4, 10);
        mesh = makeMesh(geo, 0x4A4A4A);
        mesh.position.set(base + 150, 0.2, 80);
        addMesh(mesh);

        // Footpath to Kirk
        geo = new THREE.BoxGeometry(4, 0.5, 30);
        mesh = makeMesh(geo, 0xA09070);
        mesh.position.set(base, 0.3, -57);
        addMesh(mesh);

        // Roundabout (approximated with flat cylinder)
        geo = new THREE.CylinderGeometry(12, 12, 0.5, 10);
        mesh = makeMesh(geo, 0x4A6A30);
        mesh.position.set(base - 60, 0.3, -30);
        addMesh(mesh);

        // Lamp posts along High Street (cylinders)
        for (var i = 0; i < 5; i++) {
            geo = new THREE.CylinderGeometry(0.3, 0.4, 7, 5);
            mesh = makeMesh(geo, 0x2A2A3A);
            mesh.position.set(base - 66, 3.5, -100 + i * 50);
            addMesh(mesh);

            // Lamp head
            geo = new THREE.SphereGeometry(0.8, 5, 4);
            mesh = makeMesh(geo, 0xFFFFCC);
            mesh.position.set(base - 66, 7.5, -100 + i * 50);
            addMesh(mesh);
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
