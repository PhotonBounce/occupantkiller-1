window.ColeraineTown = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 19800;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(BASE_X + (x || 0), BASE_Y + (y || 0), BASE_Z + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildRiverBann();
        buildColeraineBridge();
        buildTownHall();
        buildDiamond();
        buildStPatricksChurch();
        buildLibraryMuseum();
        buildUniversityOfUlster();
        buildMountsandelFort();
        buildSalmonFishing();
        buildMarketStalls();
        buildGeorgianBuildings();
        buildStreetFurniture();
    }

    function buildGround() {
        // Ground plane using box geometry (very flat)
        makeMesh(new THREE.BoxGeometry(800, 1, 800), 0x556B2F, 0, -0.5, 0);
        // River bank ground strips
        makeMesh(new THREE.BoxGeometry(800, 1, 60), 0x8B7355, 0, -0.5, -80);
        makeMesh(new THREE.BoxGeometry(800, 1, 60), 0x8B7355, 0, -0.5, 80);
        // Road surface through town
        makeMesh(new THREE.BoxGeometry(400, 0.5, 12), 0x333333, 0, 0.25, 0);
        // Cross road
        makeMesh(new THREE.BoxGeometry(12, 0.5, 400), 0x333333, 0, 0.25, 0);
    }

    function buildRiverBann() {
        // Main river body - River Bann flowing through Coleraine
        makeMesh(new THREE.BoxGeometry(800, 2, 60), 0x006994, 0, 0, 0);
        // River shimmer/depth strips
        makeMesh(new THREE.BoxGeometry(800, 0.5, 10), 0x0077AA, 0, 1.1, -10);
        makeMesh(new THREE.BoxGeometry(800, 0.5, 10), 0x0077AA, 0, 1.1, 10);
        makeMesh(new THREE.BoxGeometry(800, 0.5, 8), 0x005577, 0, 1.1, 0);
        // River bank reeds / vegetation strips
        makeMesh(new THREE.BoxGeometry(800, 3, 4), 0x2E8B57, 0, 1.5, -32);
        makeMesh(new THREE.BoxGeometry(800, 3, 4), 0x2E8B57, 0, 1.5, 32);
    }

    function buildColeraineBridge() {
        // Road deck of bridge over River Bann
        makeMesh(new THREE.BoxGeometry(80, 3, 14), 0x808080, 0, 4, 0);
        // Bridge piers - CylinderGeometry as required
        makeMesh(new THREE.CylinderGeometry(2, 2.5, 10, 8), 0x707070, -20, -2, 0);
        makeMesh(new THREE.CylinderGeometry(2, 2.5, 10, 8), 0x707070, 0, -2, 0);
        makeMesh(new THREE.CylinderGeometry(2, 2.5, 10, 8), 0x707070, 20, -2, 0);
        // Bridge side railings
        makeMesh(new THREE.BoxGeometry(80, 1.5, 0.5), 0x909090, 0, 6, -7);
        makeMesh(new THREE.BoxGeometry(80, 1.5, 0.5), 0x909090, 0, 6, 7);
        // Bridge road markings
        makeMesh(new THREE.BoxGeometry(80, 0.1, 1), 0xFFFFFF, 0, 5.6, 0);
        // Abutment blocks at each river bank
        makeMesh(new THREE.BoxGeometry(8, 8, 14), 0x696969, -42, 0, 0);
        makeMesh(new THREE.BoxGeometry(8, 8, 14), 0x696969, 42, 0, 0);
    }

    function buildTownHall() {
        // Main Victorian red brick body
        makeMesh(new THREE.BoxGeometry(28, 18, 20), 0xCD5C5C, 80, 9, -60);
        // Clock tower on top
        makeMesh(new THREE.BoxGeometry(8, 22, 8), 0xB04040, 80, 30, -60);
        // Clock tower top / spire base
        makeMesh(new THREE.BoxGeometry(10, 2, 10), 0x909090, 80, 41.5, -60);
        // Spire
        makeMesh(new THREE.ConeGeometry(3, 16, 4), 0x707070, 80, 53, -60);
        // Entrance portico columns
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), 0xDDCCBB, 74, 5, -52);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), 0xDDCCBB, 78, 5, -52);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), 0xDDCCBB, 82, 5, -52);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), 0xDDCCBB, 86, 5, -52);
        // Portico roof
        makeMesh(new THREE.BoxGeometry(16, 2, 4), 0xCC5050, 80, 11, -52);
        // Clock face (sphere on tower)
        makeMesh(new THREE.SphereGeometry(2.5, 8, 8), 0xF5F5F5, 80, 28, -56);
        // Arched windows (box approximation)
        makeMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x334455, 72, 12, -51);
        makeMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x334455, 80, 12, -51);
        makeMesh(new THREE.BoxGeometry(3, 5, 0.5), 0x334455, 88, 12, -51);
        // Steps at front
        makeMesh(new THREE.BoxGeometry(16, 1, 6), 0xBBBBBB, 80, 0.5, -51);
        makeMesh(new THREE.BoxGeometry(14, 1, 4), 0xBBBBBB, 80, 1.5, -50);
    }

    function buildDiamond() {
        // The Diamond - central paved town square
        makeMesh(new THREE.BoxGeometry(60, 0.5, 60), 0xC0C0C0, 0, 0.25, -60);
        // War Memorial obelisk
        makeMesh(new THREE.BoxGeometry(3, 2, 3), 0xAAAAAA, 0, 1, -60);
        makeMesh(new THREE.BoxGeometry(2, 14, 2), 0xCCCCCC, 0, 9, -60);
        makeMesh(new THREE.ConeGeometry(1.5, 4, 4), 0xBBBBBB, 0, 18, -60);
        // Diamond paving detail strips
        makeMesh(new THREE.BoxGeometry(60, 0.2, 2), 0xAAAAAA, 0, 0.4, -60);
        makeMesh(new THREE.BoxGeometry(2, 0.2, 60), 0xAAAAAA, 0, 0.4, -60);
        // Benches around war memorial
        makeMesh(new THREE.BoxGeometry(4, 0.5, 1), 0x8B4513, -8, 1, -60);
        makeMesh(new THREE.BoxGeometry(4, 0.5, 1), 0x8B4513, 8, 1, -60);
        makeMesh(new THREE.BoxGeometry(1, 0.5, 4), 0x8B4513, 0, 1, -52);
        makeMesh(new THREE.BoxGeometry(1, 0.5, 4), 0x8B4513, 0, 1, -68);
        // Lamp posts on the Diamond
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 8, 6), 0x2F2F2F, -20, 4, -40);
        makeMesh(new THREE.SphereGeometry(0.6, 6, 6), 0xFFDD88, -20, 8.5, -40);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 8, 6), 0x2F2F2F, 20, 4, -40);
        makeMesh(new THREE.SphereGeometry(0.6, 6, 6), 0xFFDD88, 20, 8.5, -40);
    }

    function buildStPatricksChurch() {
        // Ancient Church of Ireland with square tower on the Diamond
        // Main nave
        makeMesh(new THREE.BoxGeometry(24, 12, 14), 0x808080, -40, 6, -60);
        // Square tower - distinctive feature
        makeMesh(new THREE.BoxGeometry(10, 28, 10), 0x757575, -50, 14, -60);
        // Tower battlements
        makeMesh(new THREE.BoxGeometry(12, 3, 12), 0x757575, -50, 29, -60);
        // Tower top cross
        makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0x555555, -50, 33, -60);
        makeMesh(new THREE.BoxGeometry(3, 0.5, 0.5), 0x555555, -50, 35, -60);
        // Church roof (pitched)
        makeMesh(new THREE.BoxGeometry(26, 2, 16), 0x696969, -40, 13, -60);
        // Arched church windows
        makeMesh(new THREE.BoxGeometry(2.5, 4, 0.4), 0x8899AA, -34, 7, -54);
        makeMesh(new THREE.BoxGeometry(2.5, 4, 0.4), 0x8899AA, -40, 7, -54);
        makeMesh(new THREE.BoxGeometry(2.5, 4, 0.4), 0x8899AA, -46, 7, -54);
        // Church entrance porch
        makeMesh(new THREE.BoxGeometry(6, 8, 5), 0x888888, -40, 4, -54);
        // Graveyard wall
        makeMesh(new THREE.BoxGeometry(50, 2, 1), 0x999999, -40, 1, -75);
        makeMesh(new THREE.BoxGeometry(1, 2, 20), 0x999999, -16, 1, -65);
        makeMesh(new THREE.BoxGeometry(1, 2, 20), 0x999999, -64, 1, -65);
        // Gravestone markers
        makeMesh(new THREE.BoxGeometry(1, 2, 0.3), 0xBBBBBB, -30, 1, -68);
        makeMesh(new THREE.BoxGeometry(1, 2, 0.3), 0xBBBBBB, -35, 1, -68);
        makeMesh(new THREE.BoxGeometry(1, 2, 0.3), 0xBBBBBB, -45, 1, -70);
        makeMesh(new THREE.BoxGeometry(1, 2, 0.3), 0xBBBBBB, -52, 1, -68);
    }

    function buildLibraryMuseum() {
        // Coleraine Library - civic stone building
        makeMesh(new THREE.BoxGeometry(22, 12, 18), 0xD2B48C, 120, 6, -60);
        // Library portico
        makeMesh(new THREE.BoxGeometry(14, 10, 5), 0xC8AA88, 120, 5, -52);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 10, 8), 0xDEB887, 114, 5, -52);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 10, 8), 0xDEB887, 120, 5, -52);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 10, 8), 0xDEB887, 126, 5, -52);
        // Library roof
        makeMesh(new THREE.BoxGeometry(24, 2, 20), 0xBBA070, 120, 12.5, -60);
        // Museum building adjacent
        makeMesh(new THREE.BoxGeometry(20, 14, 16), 0xD8C4A0, 148, 7, -60);
        // Museum entrance sign panel
        makeMesh(new THREE.BoxGeometry(10, 3, 0.5), 0x8B6914, 148, 14, -53);
        // Museum display window (dark glass)
        makeMesh(new THREE.BoxGeometry(8, 4, 0.5), 0x223344, 142, 7, -53);
        makeMesh(new THREE.BoxGeometry(8, 4, 0.5), 0x223344, 154, 7, -53);
    }

    function buildUniversityOfUlster() {
        // University of Ulster Coleraine campus - modern buildings
        // Campus ground (green)
        makeMesh(new THREE.BoxGeometry(200, 0.5, 120), 0x228B22, -100, 0.25, 120);
        // Main university block
        makeMesh(new THREE.BoxGeometry(60, 20, 30), 0xF5F5F5, -100, 10, 100);
        // Science building
        makeMesh(new THREE.BoxGeometry(40, 24, 28), 0xEEEEEE, -160, 12, 100);
        // Arts building
        makeMesh(new THREE.BoxGeometry(35, 16, 25), 0xF0F0F0, -50, 8, 130);
        // Library tower
        makeMesh(new THREE.BoxGeometry(18, 36, 18), 0xF5F5F5, -120, 18, 130);
        // Student union
        makeMesh(new THREE.BoxGeometry(30, 10, 22), 0xE8E8E8, -80, 5, 150);
        // Campus paths
        makeMesh(new THREE.BoxGeometry(120, 0.3, 4), 0xCCCCCC, -100, 0.4, 115);
        makeMesh(new THREE.BoxGeometry(4, 0.3, 80), 0xCCCCCC, -100, 0.4, 140);
        // University sports hall
        makeMesh(new THREE.BoxGeometry(50, 12, 35), 0xDDDDDD, -155, 6, 145);
        // Car park
        makeMesh(new THREE.BoxGeometry(60, 0.3, 30), 0x555555, -60, 0.3, 160);
        // Campus trees (cylinders for trunks, spheres for canopy)
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 6, 6), 0x4A3728, -85, 3, 115);
        makeMesh(new THREE.SphereGeometry(3, 7, 7), 0x228B22, -85, 9, 115);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 6, 6), 0x4A3728, -115, 3, 115);
        makeMesh(new THREE.SphereGeometry(3, 7, 7), 0x228B22, -115, 9, 115);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 6, 6), 0x4A3728, -130, 3, 115);
        makeMesh(new THREE.SphereGeometry(3, 7, 7), 0x228B22, -130, 9, 115);
    }

    function buildMountsandelFort() {
        // Mountsandel Fort - prehistoric earthwork mound (oldest known settlement in Ireland, 8000BC)
        // Main earthwork mound
        makeMesh(new THREE.SphereGeometry(30, 10, 10), 0x228B22, 250, -8, 80);
        // Mound base ring
        makeMesh(new THREE.CylinderGeometry(32, 36, 4, 12), 0x2E6B1E, 250, -4, 80);
        // Inner rampart
        makeMesh(new THREE.CylinderGeometry(18, 20, 6, 10), 0x3A7A28, 250, 1, 80);
        // Archaeological marker/information post
        makeMesh(new THREE.BoxGeometry(0.5, 4, 0.5), 0x5C3317, 225, 2, 60);
        makeMesh(new THREE.BoxGeometry(3, 2, 0.2), 0xDEB887, 225, 4, 60);
        // Surrounding ancient woodland - trees
        makeMesh(new THREE.CylinderGeometry(0.6, 0.9, 8, 6), 0x3D2B1F, 230, 4, 65);
        makeMesh(new THREE.SphereGeometry(4, 7, 7), 0x1A5C1A, 230, 11, 65);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.9, 8, 6), 0x3D2B1F, 270, 4, 65);
        makeMesh(new THREE.SphereGeometry(4, 7, 7), 0x1A5C1A, 270, 11, 65);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.9, 10, 6), 0x3D2B1F, 240, 5, 100);
        makeMesh(new THREE.SphereGeometry(5, 7, 7), 0x1A5C1A, 240, 13, 100);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.9, 10, 6), 0x3D2B1F, 260, 5, 100);
        makeMesh(new THREE.SphereGeometry(5, 7, 7), 0x1A5C1A, 260, 13, 100);
        // Path up to mound
        makeMesh(new THREE.BoxGeometry(30, 0.3, 3), 0xAA9977, 235, 0.3, 72);
    }

    function buildSalmonFishing() {
        // Salmon leaping from River Bann - silver salmon (sphere body + cone tail)
        // Salmon 1
        makeMesh(new THREE.SphereGeometry(1.2, 8, 6), 0xC0C0C0, -80, 6, -5);
        makeMesh(new THREE.ConeGeometry(0.8, 1.8, 6), 0xC0C0C0, -80, 4.5, -5, 0, 0, 3.14);
        // Salmon 2
        makeMesh(new THREE.SphereGeometry(1.0, 8, 6), 0xB8B8B8, -60, 5, 8);
        makeMesh(new THREE.ConeGeometry(0.7, 1.5, 6), 0xB8B8B8, -60, 3.5, 8, 0, 0, 3.14);
        // Salmon 3
        makeMesh(new THREE.SphereGeometry(1.3, 8, 6), 0xD0D0D0, -40, 7, -12);
        makeMesh(new THREE.ConeGeometry(0.9, 2.0, 6), 0xD0D0D0, -40, 5.2, -12, 0, 0, 3.14);
        // Salmon 4
        makeMesh(new THREE.SphereGeometry(1.1, 8, 6), 0xC8C8C8, -100, 5.5, 4);
        makeMesh(new THREE.ConeGeometry(0.75, 1.6, 6), 0xC8C8C8, -100, 4, 4, 0, 0, 3.14);
        // Fishing platform on river bank
        makeMesh(new THREE.BoxGeometry(8, 1, 5), 0x8B6914, -70, 1, -36);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 5), 0x5C3317, -70, 4, -36);
        // Second fishing spot
        makeMesh(new THREE.BoxGeometry(8, 1, 5), 0x8B6914, -50, 1, 36);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 5), 0x5C3317, -50, 4, 36);
    }

    function buildMarketStalls() {
        // Coleraine traditional market stalls
        // Stall 1 - produce
        makeMesh(new THREE.BoxGeometry(5, 0.5, 3), 0xDEB887, 30, 2, -80);
        makeMesh(new THREE.BoxGeometry(5, 0.2, 3), 0xCC4422, 30, 4, -80);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x5C3317, 28, 2, -79);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x5C3317, 32, 2, -79);
        // Stall 2 - fish stall (fitting for salmon country)
        makeMesh(new THREE.BoxGeometry(5, 0.5, 3), 0xDEB887, 40, 2, -80);
        makeMesh(new THREE.BoxGeometry(5, 0.2, 3), 0x4444CC, 40, 4, -80);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x5C3317, 38, 2, -79);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x5C3317, 42, 2, -79);
        // Stall 3 - general goods
        makeMesh(new THREE.BoxGeometry(5, 0.5, 3), 0xDEB887, 50, 2, -80);
        makeMesh(new THREE.BoxGeometry(5, 0.2, 3), 0x228B22, 50, 4, -80);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x5C3317, 48, 2, -79);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x5C3317, 52, 2, -79);
        // Stall 4 - bakery
        makeMesh(new THREE.BoxGeometry(5, 0.5, 3), 0xDEB887, 60, 2, -80);
        makeMesh(new THREE.BoxGeometry(5, 0.2, 3), 0xFF8C00, 60, 4, -80);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x5C3317, 58, 2, -79);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 4), 0x5C3317, 62, 2, -79);
        // Market boundary posts
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0x5C3317, 25, 2.5, -86);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), 0x5C3317, 65, 2.5, -86);
        makeMesh(new THREE.BoxGeometry(42, 0.3, 0.3), 0x5C3317, 45, 5, -86);
    }

    function buildGeorgianBuildings() {
        // Georgian buildings surrounding the Diamond
        // North side row
        makeMesh(new THREE.BoxGeometry(18, 16, 12), 0xE8D5B0, -20, 8, -92);
        makeMesh(new THREE.BoxGeometry(18, 14, 12), 0xDDC8A0, -40, 7, -92);
        makeMesh(new THREE.BoxGeometry(16, 16, 12), 0xE0D0B5, 20, 8, -92);
        // South side row (facing river)
        makeMesh(new THREE.BoxGeometry(18, 14, 12), 0xE8D5B0, -20, 7, -30);
        makeMesh(new THREE.BoxGeometry(20, 12, 12), 0xDDC8A0, 20, 6, -30);
        // East side
        makeMesh(new THREE.BoxGeometry(12, 14, 18), 0xE0CEAC, 32, 7, -55);
        makeMesh(new THREE.BoxGeometry(12, 12, 16), 0xDBC9A5, 32, 6, -72);
        // West side
        makeMesh(new THREE.BoxGeometry(12, 14, 18), 0xE5D3AF, -32, 7, -55);
        makeMesh(new THREE.BoxGeometry(12, 12, 16), 0xDFC8A0, -32, 6, -72);
        // Georgian sash windows on north row building 1
        makeMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x334455, -20, 10, -87);
        makeMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x334455, -26, 10, -87);
        makeMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x334455, -14, 10, -87);
        makeMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x334455, -20, 5, -87);
        makeMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x334455, -26, 5, -87);
        makeMesh(new THREE.BoxGeometry(2, 3, 0.3), 0x334455, -14, 5, -87);
        // Shop fronts at ground level
        makeMesh(new THREE.BoxGeometry(6, 3, 0.3), 0x994422, -20, 1.5, -87);
        makeMesh(new THREE.BoxGeometry(6, 3, 0.3), 0x225544, -40, 1.5, -87);
        makeMesh(new THREE.BoxGeometry(6, 3, 0.3), 0x994422, 20, 1.5, -87);
        // Chimney stacks
        makeMesh(new THREE.BoxGeometry(2, 4, 2), 0xCC6644, -20, 18, -92);
        makeMesh(new THREE.BoxGeometry(2, 4, 2), 0xCC6644, -15, 18, -92);
        makeMesh(new THREE.BoxGeometry(2, 4, 2), 0xCC6644, 20, 18, -92);
        makeMesh(new THREE.BoxGeometry(2, 4, 2), 0xCC6644, 25, 18, -92);
    }

    function buildStreetFurniture() {
        // Town lamp posts on main street
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 9, 6), 0x2F2F2F, -60, 4.5, -6);
        makeMesh(new THREE.SphereGeometry(0.7, 6, 6), 0xFFDD88, -60, 9.2, -6);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 9, 6), 0x2F2F2F, 60, 4.5, -6);
        makeMesh(new THREE.SphereGeometry(0.7, 6, 6), 0xFFDD88, 60, 9.2, -6);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 9, 6), 0x2F2F2F, -60, 4.5, 6);
        makeMesh(new THREE.SphereGeometry(0.7, 6, 6), 0xFFDD88, -60, 9.2, 6);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 9, 6), 0x2F2F2F, 60, 4.5, 6);
        makeMesh(new THREE.SphereGeometry(0.7, 6, 6), 0xFFDD88, 60, 9.2, 6);
        // Town parking area
        makeMesh(new THREE.BoxGeometry(40, 0.4, 20), 0x3A3A3A, 100, 0.2, -30);
        // Postbox
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5, 8), 0xCC0000, 10, 0.75, -50);
        makeMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.4, 8), 0xAA0000, 10, 1.7, -50);
        // Telephone box
        makeMesh(new THREE.BoxGeometry(1.2, 2.5, 1.2), 0xCC0000, 16, 1.25, -50);
        makeMesh(new THREE.BoxGeometry(1.4, 0.3, 1.4), 0xAA0000, 16, 2.65, -50);
        // Town notice board
        makeMesh(new THREE.BoxGeometry(3, 2, 0.3), 0x5C3317, -10, 2, -50);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 5), 0x3A2010, -11.5, 1, -50);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 5), 0x3A2010, -8.5, 1, -50);
        // Decorative town planters
        makeMesh(new THREE.BoxGeometry(1.5, 1, 1.5), 0x8B4513, -5, 0.5, -55);
        makeMesh(new THREE.SphereGeometry(1, 6, 6), 0x228B22, -5, 1.8, -55);
        makeMesh(new THREE.BoxGeometry(1.5, 1, 1.5), 0x8B4513, 5, 0.5, -55);
        makeMesh(new THREE.SphereGeometry(1, 6, 6), 0x228B22, 5, 1.8, -55);
        // Riverside walkway railing posts
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 5), 0x777777, -120, 1, -38);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 5), 0x777777, -100, 1, -38);
        makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 5), 0x777777, -80, 1, -38);
        makeMesh(new THREE.BoxGeometry(80, 0.2, 0.2), 0x888888, -100, 2, -38);
        // Riverside walkway surface
        makeMesh(new THREE.BoxGeometry(200, 0.4, 6), 0xBBAA88, 0, 0.2, -38);
    }

    function update(delta) {
        // Future: animate salmon, river ripples etc.
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
        update: update,
        reset: reset
    };
}());
