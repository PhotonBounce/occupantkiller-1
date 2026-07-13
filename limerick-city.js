window.LimerickCity = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 17880;
    var OY = 0;
    var OZ = 0;

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        return addMesh(mesh);
    }

    function buildKingJohnsCastle() {
        // Main limestone body
        makeBox(18, 8, 14, 0x8B7355, -60, 4, 0);
        // Battlements top strip
        makeBox(18, 1.5, 14, 0x7A6345, -60, 8.75, 0);
        // Merlons along top front
        makeBox(2, 2, 1, 0x8B7355, -66, 9.5, -7.5);
        makeBox(2, 2, 1, 0x8B7355, -62, 9.5, -7.5);
        makeBox(2, 2, 1, 0x8B7355, -58, 9.5, -7.5);
        makeBox(2, 2, 1, 0x8B7355, -54, 9.5, -7.5);
        // Corner towers — NW, NE, SW, SE
        makeCylinder(2.5, 2.5, 10, 8, 0x8B7355, -70, 5, -7);
        makeCylinder(2.5, 2.5, 10, 8, 0x8B7355, -50, 5, -7);
        makeCylinder(2.5, 2.5, 10, 8, 0x8B7355, -70, 5, 7);
        makeCylinder(2.5, 2.5, 10, 8, 0x8B7355, -50, 5, 7);
        // Gate tower front centre
        makeCylinder(2.5, 2.5, 10, 8, 0x8B7355, -60, 5, -8);
        // Cone roofs on all five towers
        makeCone(2.8, 4, 8, 0x5C4A2A, -70, 12, -7);
        makeCone(2.8, 4, 8, 0x5C4A2A, -50, 12, -7);
        makeCone(2.8, 4, 8, 0x5C4A2A, -70, 12, 7);
        makeCone(2.8, 4, 8, 0x5C4A2A, -50, 12, 7);
        makeCone(2.8, 4, 8, 0x5C4A2A, -60, 12, -8);
        // Gatehouse arch recess (dark box)
        makeBox(3, 4, 1, 0x2B2208, -60, 3, -7.6);
        // Inner courtyard ground
        makeBox(12, 0.5, 8, 0x7A6A50, -60, 0.25, 0);
        // Inner well
        makeCylinder(0.8, 0.8, 1.2, 8, 0x5A5040, -60, 0.6, 2);
    }

    function buildTreatyStone() {
        // Pedestal base
        makeBox(2, 0.8, 2, 0x808080, 10, 0.4, 30);
        // Stone block on top
        makeBox(1.4, 1, 1.4, 0x909090, 10, 1.3, 30);
        // Small plaque box
        makeBox(0.6, 0.4, 0.1, 0xA0A0A0, 10, 1.2, 29.4);
        // Decorative railing posts
        makeCylinder(0.05, 0.05, 1.2, 6, 0x333333, 9.2, 0.6, 29.2);
        makeCylinder(0.05, 0.05, 1.2, 6, 0x333333, 10.8, 0.6, 29.2);
        makeCylinder(0.05, 0.05, 1.2, 6, 0x333333, 9.2, 0.6, 30.8);
        makeCylinder(0.05, 0.05, 1.2, 6, 0x333333, 10.8, 0.6, 30.8);
        // Horizontal rail
        makeBox(2.4, 0.1, 0.1, 0x333333, 10, 1.15, 29.2);
        makeBox(2.4, 0.1, 0.1, 0x333333, 10, 1.15, 30.8);
    }

    function buildStMaraysCathedral() {
        // Nave
        makeBox(20, 10, 10, 0x808080, -10, 5, 40);
        // Crossing tower
        makeBox(6, 16, 6, 0x757575, -10, 8, 40);
        // West front tower left
        makeBox(4, 14, 4, 0x808080, -19, 7, 40);
        // West front tower right
        makeBox(4, 14, 4, 0x808080, -1, 7, 40);
        // Cone spires on towers
        makeCone(2.2, 6, 8, 0x5A5A5A, -19, 17, 40);
        makeCone(2.2, 6, 8, 0x5A5A5A, -1, 17, 40);
        makeCone(3, 7, 8, 0x5A5A5A, -10, 19.5, 40);
        // Transept arms
        makeBox(6, 10, 16, 0x808080, -10, 5, 40);
        // Romanesque window recesses on nave
        makeBox(1.5, 2.5, 0.5, 0x404040, -6, 6, 34.8);
        makeBox(1.5, 2.5, 0.5, 0x404040, -14, 6, 34.8);
        // Norman doorway recess
        makeBox(3, 5, 0.5, 0x303030, -10, 3, 34.8);
        // Chancel east end
        makeBox(8, 9, 6, 0x808080, -3, 4.5, 45);
        // Apse (approximated with cylinder)
        makeCylinder(3, 3, 9, 8, 0x787878, 1, 4.5, 45);
    }

    function buildRiverShannon() {
        // Wide river body
        makeBox(200, 0.4, 30, 0x006994, 0, 0.2, 20);
        // North quay wall
        makeBox(200, 2, 2, 0x696969, 0, 1, 5);
        // South quay wall
        makeBox(200, 2, 2, 0x696969, 0, 1, 35);
        // River bank stones north
        makeBox(200, 0.6, 3, 0x5A5A5A, 0, 0.3, 3.5);
        // River bank stones south
        makeBox(200, 0.6, 3, 0x5A5A5A, 0, 0.3, 36.5);
        // Thomond Bridge piers (cylinder columns in river)
        makeCylinder(1, 1, 3, 8, 0x808080, -40, 1.5, 20);
        makeCylinder(1, 1, 3, 8, 0x808080, -30, 1.5, 20);
        makeCylinder(1, 1, 3, 8, 0x808080, -20, 1.5, 20);
        // Bridge deck
        makeBox(32, 0.8, 6, 0x909090, -30, 2.8, 20);
        // Sarsfield Bridge piers
        makeCylinder(1, 1, 3, 8, 0x808080, 20, 1.5, 20);
        makeCylinder(1, 1, 3, 8, 0x808080, 30, 1.5, 20);
        // Sarsfield Bridge deck
        makeBox(22, 0.8, 6, 0x909090, 25, 2.8, 20);
    }

    function buildThomondPark() {
        // Ground level pitch area
        makeBox(68, 0.5, 44, 0x3A8C3A, 80, 0.25, -60);
        // Main stand (west)
        makeBox(70, 12, 10, 0xC0C0C0, 80, 6, -81);
        // East stand
        makeBox(70, 8, 8, 0xC0C0C0, 80, 4, -39);
        // North stand
        makeBox(10, 8, 44, 0xC0C0C0, 45, 4, -60);
        // South stand
        makeBox(10, 8, 44, 0xC0C0C0, 115, 4, -60);
        // Roof sections (lighter grey)
        makeBox(70, 1, 10, 0xD3D3D3, 80, 12.5, -81);
        makeBox(70, 1, 8, 0xD3D3D3, 80, 8.5, -39);
        makeBox(10, 1, 44, 0xD3D3D3, 45, 8.5, -60);
        makeBox(10, 1, 44, 0xD3D3D3, 115, 8.5, -60);
        // Floodlight masts
        makeCylinder(0.3, 0.3, 22, 6, 0xAAAAAA, 47, 11, -80);
        makeCylinder(0.3, 0.3, 22, 6, 0xAAAAAA, 113, 11, -80);
        makeCylinder(0.3, 0.3, 22, 6, 0xAAAAAA, 47, 11, -40);
        makeCylinder(0.3, 0.3, 22, 6, 0xAAAAAA, 113, 11, -40);
        // Floodlight heads (boxes on top of masts)
        makeBox(3, 1, 3, 0xFFFFCC, 47, 22.5, -80);
        makeBox(3, 1, 3, 0xFFFFCC, 113, 22.5, -80);
        makeBox(3, 1, 3, 0xFFFFCC, 47, 22.5, -40);
        makeBox(3, 1, 3, 0xFFFFCC, 113, 22.5, -40);
    }

    function buildGeorgianNewtownPery() {
        // Row of Georgian townhouses — 4-storey red brick terrace
        var i;
        for (i = 0; i < 5; i++) {
            // House body
            makeBox(6, 14, 8, 0xCD5C5C, 30 + i * 8, 7, -10 + i * 0.5);
            // Sash window recesses front (3 rows of 2 windows)
            makeBox(1.2, 1.8, 0.3, 0x1A2A3A, 27.5 + i * 8, 11, -14.2);
            makeBox(1.2, 1.8, 0.3, 0x1A2A3A, 30.5 + i * 8, 11, -14.2);
            makeBox(1.2, 1.8, 0.3, 0x1A2A3A, 27.5 + i * 8, 7.5, -14.2);
            makeBox(1.2, 1.8, 0.3, 0x1A2A3A, 30.5 + i * 8, 7.5, -14.2);
            // Fanlight door
            makeBox(1.5, 2.5, 0.3, 0x2C2C2C, 29 + i * 8, 2, -14.2);
        }
        // Parapet / cornice strip
        makeBox(42, 1, 8, 0xB85050, 46, 14.5, -11.5);
        // Pavement strip
        makeBox(42, 0.4, 4, 0xAAAAAA, 46, 0.2, -16);
    }

    function buildHuntMuseum() {
        // Main Palladian mansion body
        makeBox(24, 10, 14, 0xF5F0E8, 60, 5, 60);
        // Pedimented central portico
        makeBox(8, 11, 3, 0xEDE8DC, 60, 5.5, 53.5);
        // Pediment triangle (approximated with thin box)
        makeBox(8, 3, 1, 0xEDE8DC, 60, 12, 53.5);
        // Portico columns
        makeCylinder(0.5, 0.5, 10, 8, 0xF0EBE0, 57, 5, 53);
        makeCylinder(0.5, 0.5, 10, 8, 0xF0EBE0, 60, 5, 53);
        makeCylinder(0.5, 0.5, 10, 8, 0xF0EBE0, 63, 5, 53);
        // Wings left and right
        makeBox(6, 8, 14, 0xF5F0E8, 45, 4, 60);
        makeBox(6, 8, 14, 0xF5F0E8, 75, 4, 60);
        // Chimneys
        makeCylinder(0.4, 0.4, 3, 6, 0xCCC8BC, 55, 15.5, 58);
        makeCylinder(0.4, 0.4, 3, 6, 0xCCC8BC, 65, 15.5, 58);
        // Front steps
        makeBox(6, 0.5, 3, 0xE0DBD0, 60, 0.25, 51);
        makeBox(5, 0.5, 2, 0xE0DBD0, 60, 0.75, 50);
        // Gravel driveway
        makeBox(20, 0.3, 8, 0xC8BFA8, 60, 0.15, 46);
    }

    function buildMilkMarket() {
        // Market hall walls
        makeBox(24, 7, 18, 0xCD5C5C, -30, 3.5, -50);
        // Roof structure (slightly wider)
        makeBox(26, 1, 20, 0x8B4513, -30, 7.5, -50);
        // Iron columns inside (CylinderGeometry)
        makeCylinder(0.4, 0.4, 7, 8, 0x444444, -37, 3.5, -55);
        makeCylinder(0.4, 0.4, 7, 8, 0x444444, -30, 3.5, -55);
        makeCylinder(0.4, 0.4, 7, 8, 0x444444, -23, 3.5, -55);
        makeCylinder(0.4, 0.4, 7, 8, 0x444444, -37, 3.5, -45);
        makeCylinder(0.4, 0.4, 7, 8, 0x444444, -30, 3.5, -45);
        makeCylinder(0.4, 0.4, 7, 8, 0x444444, -23, 3.5, -45);
        // Market entrance arch recess
        makeBox(4, 6, 0.5, 0x333333, -30, 3.5, -59.3);
        // Market stall canopies (coloured box)
        makeBox(5, 0.3, 3, 0xB85050, -37, 3, -57);
        makeBox(5, 0.3, 3, 0x5B8B5B, -30, 3, -57);
        makeBox(5, 0.3, 3, 0xB8A030, -23, 3, -57);
    }

    function buildRowingClubs() {
        // Clubhouse A
        makeBox(10, 4, 6, 0x8B6914, -55, 2, 38);
        makeBox(10, 0.5, 6, 0x7A5C10, -55, 4.25, 38);
        // Clubhouse B
        makeBox(8, 4, 5, 0x9B7920, -75, 2, 38);
        makeBox(8, 0.5, 5, 0x8B6914, -75, 4.25, 38);
        // Boat storage shed
        makeBox(14, 3, 5, 0xA07830, -90, 1.5, 38);
        // Jetty / pontoon
        makeBox(2, 0.3, 12, 0x7A6040, -60, 0.3, 31);
        makeBox(2, 0.3, 12, 0x7A6040, -70, 0.3, 31);
        // Mooring posts
        makeCylinder(0.2, 0.2, 2, 6, 0x5A4A30, -60, 1, 25);
        makeCylinder(0.2, 0.2, 2, 6, 0x5A4A30, -70, 1, 25);
    }

    function buildGAAGrounds() {
        // Main pitch area
        makeBox(90, 0.4, 56, 0x228B22, 150, 0.2, 60);
        // Pitch markings (slightly lighter green boxes)
        makeBox(90, 0.05, 0.5, 0x2DB52D, 150, 0.45, 60);
        makeBox(0.5, 0.05, 56, 0x2DB52D, 150, 0.45, 60);
        // Goalposts — left end (2 uprights + crossbar)
        makeCylinder(0.2, 0.2, 10, 6, 0xF5F5F5, 105, 5, 57);
        makeCylinder(0.2, 0.2, 10, 6, 0xF5F5F5, 105, 5, 63);
        makeBox(6.5, 0.3, 0.3, 0xF5F5F5, 105, 3, 60);
        // Goalposts — right end
        makeCylinder(0.2, 0.2, 10, 6, 0xF5F5F5, 195, 5, 57);
        makeCylinder(0.2, 0.2, 10, 6, 0xF5F5F5, 195, 5, 63);
        makeBox(6.5, 0.3, 0.3, 0xF5F5F5, 195, 3, 60);
        // Covered stand (one side)
        makeBox(80, 8, 8, 0xB0B0B0, 150, 4, 72);
        makeBox(82, 1, 9, 0xC8C8C8, 150, 8.5, 72);
        // Terrace bank opposite side
        makeBox(80, 4, 6, 0x888888, 150, 2, 48);
    }

    function buildGroundPlane() {
        // City ground / street level (using a very thin box as substitute for plane)
        makeBox(400, 0.2, 200, 0x6B6B6B, 60, -0.1, 20);
    }

    function buildStreetFurniture() {
        // Lamp posts along quay
        makeCylinder(0.15, 0.15, 5, 6, 0x2A2A2A, -80, 2.5, 4);
        makeCylinder(0.15, 0.15, 5, 6, 0x2A2A2A, -60, 2.5, 4);
        makeCylinder(0.15, 0.15, 5, 6, 0x2A2A2A, -40, 2.5, 4);
        makeCylinder(0.15, 0.15, 5, 6, 0x2A2A2A, -20, 2.5, 4);
        makeCylinder(0.15, 0.15, 5, 6, 0x2A2A2A, 0, 2.5, 4);
        // Lamp globe tops
        makeSphere(0.3, 6, 6, 0xFFFFCC, -80, 5.3, 4);
        makeSphere(0.3, 6, 6, 0xFFFFCC, -60, 5.3, 4);
        makeSphere(0.3, 6, 6, 0xFFFFCC, -40, 5.3, 4);
        makeSphere(0.3, 6, 6, 0xFFFFCC, -20, 5.3, 4);
        makeSphere(0.3, 6, 6, 0xFFFFCC, 0, 5.3, 4);
    }

    function build() {
        buildGroundPlane();
        buildRiverShannon();
        buildKingJohnsCastle();
        buildTreatyStone();
        buildStMaraysCathedral();
        buildThomondPark();
        buildGeorgianNewtownPery();
        buildHuntMuseum();
        buildMilkMarket();
        buildRowingClubs();
        buildGAAGrounds();
        buildStreetFurniture();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
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
