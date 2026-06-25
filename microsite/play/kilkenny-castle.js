window.KilkennyCastle = (function() {
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

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
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

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 17760;
        var limestone = 0x8B7355;
        var slate = 0x2F4F4F;
        var cobble = 0xDEB887;
        var paleStone = 0xF5F0E8;
        var green = 0x228B22;
        var darkGreen = 0x2D5A27;
        var brown = 0x5C3317;
        var water = 0x1E6BA8;
        var brick = 0xCD5C5C;
        var grey = 0x808080;
        var darkGrey = 0x696969;
        var darkBox = 0x1A1A1A;
        var windowColor = 0x4A4A6A;
        var ironColor = 0x2A2A2A;
        var sandColor = 0xC8A96E;

        // ---- MAIN CASTLE BLOCK ----
        // Central keep: 20 wide, 8 tall, 14 deep
        makebox(20, 8, 14, limestone, cx, 4, 0);

        // Battlements along front (north) edge of main block - merlons
        var i;
        for (i = 0; i < 8; i++) {
            makebox(1.2, 1.2, 0.8, limestone, cx - 8.4 + i * 2.4, 8.6, -7.4);
        }
        // Battlements along back (south) edge
        for (i = 0; i < 8; i++) {
            makebox(1.2, 1.2, 0.8, limestone, cx - 8.4 + i * 2.4, 8.6, 7.4);
        }
        // Battlements along west edge
        for (i = 0; i < 5; i++) {
            makebox(0.8, 1.2, 1.2, limestone, cx - 10.4, 8.6, -5.4 + i * 2.7);
        }
        // Battlements along east edge
        for (i = 0; i < 5; i++) {
            makebox(0.8, 1.2, 1.2, limestone, cx + 10.4, 8.6, -5.4 + i * 2.7);
        }

        // ---- THREE ROUND CORNER TOWERS ----
        // NW tower
        makecyl(3, 3, 12, 12, limestone, cx - 11, 6, -8);
        makecone(3.5, 4, 12, slate, cx - 11, 14, -8);
        // NE tower
        makecyl(3, 3, 12, 12, limestone, cx + 11, 6, -8);
        makecone(3.5, 4, 12, slate, cx + 11, 14, -8);
        // SE tower
        makecyl(3, 3, 12, 12, limestone, cx + 11, 6, 8);
        makecone(3.5, 4, 12, slate, cx + 11, 14, 8);
        // SW tower (no gate tower here - see below)
        makecyl(3, 3, 12, 12, limestone, cx - 11, 6, 8);
        makecone(3.5, 4, 12, slate, cx - 11, 14, 8);

        // Tower battlements rings
        makecyl(3.3, 3.3, 0.6, 12, limestone, cx - 11, 12.3, -8);
        makecyl(3.3, 3.3, 0.6, 12, limestone, cx + 11, 12.3, -8);
        makecyl(3.3, 3.3, 0.6, 12, limestone, cx + 11, 12.3, 8);
        makecyl(3.3, 3.3, 0.6, 12, limestone, cx - 11, 12.3, 8);

        // ---- GATE TOWER (front centre) ----
        makebox(6, 14, 5, limestone, cx, 7, -11);
        // Portcullis arch dark recess
        makebox(2.5, 4, 1.2, darkBox, cx, 2.5, -13.8);
        // Gate tower battlements
        for (i = 0; i < 4; i++) {
            makebox(1.0, 1.2, 0.8, limestone, cx - 2.5 + i * 1.7, 14.6, -13.6);
        }
        makebox(0.8, 1.2, 1.2, limestone, cx - 3.4, 14.6, -12.0);
        makebox(0.8, 1.2, 1.2, limestone, cx + 3.4, 14.6, -12.0);
        // Gate tower cone roof
        makecone(3.8, 3, 4, slate, cx, 16.5, -11);

        // ---- INNER COURTYARD FLOOR ----
        makebox(18, 0.3, 10, cobble, cx, 0.15, 0);

        // Courtyard well
        makecyl(0.8, 0.8, 1.2, 8, grey, cx - 2, 0.6, 2);
        makecyl(0.9, 0.9, 0.25, 8, ironColor, cx - 2, 1.3, 2);

        // ---- LONG GALLERY (Victorian wing - east side) ----
        makebox(24, 6, 5, paleStone, cx + 22, 3, 0);
        // Gallery windows - ornate box frames every 3 units
        for (i = 0; i < 7; i++) {
            makebox(2, 2.5, 0.4, windowColor, cx + 10 + i * 3.3, 3.5, -2.8);
            makebox(2.3, 2.8, 0.15, paleStone, cx + 10 + i * 3.3, 3.5, -2.65);
        }
        // Gallery roof parapet
        makebox(24, 0.8, 0.6, paleStone, cx + 22, 6.4, -2.8);
        makebox(24, 0.8, 0.6, paleStone, cx + 22, 6.4, 2.8);
        // Gallery entrance portico
        makebox(3, 5, 1, paleStone, cx + 10, 2.5, -3.5);
        makecone(2, 2, 4, slate, cx + 10, 7, -3.5);

        // ---- CASTLE GROUNDS - PARKLAND ----
        makebox(60, 0.2, 50, green, cx - 15, 0.1, 20);
        makebox(40, 0.2, 30, green, cx + 30, 0.1, 10);

        // Trees - trunks and canopies
        // Row of trees along the approach
        for (i = 0; i < 5; i++) {
            makebox(0.5, 3, 0.5, brown, cx - 20 + i * 8, 1.5, -25);
            makesphere(2.5, 8, 6, darkGreen, cx - 20 + i * 8, 5.5, -25);
        }
        // Trees east of castle
        makebox(0.5, 4, 0.5, brown, cx + 35, 2, -10);
        makesphere(3, 8, 6, darkGreen, cx + 35, 6.5, -10);
        makebox(0.5, 3.5, 0.5, brown, cx + 40, 1.75, 5);
        makesphere(2.8, 8, 6, darkGreen, cx + 40, 6, 5);
        makebox(0.5, 4.5, 0.5, brown, cx + 45, 2.25, -5);
        makesphere(3.2, 8, 6, darkGreen, cx + 45, 7, -5);
        // Parkland trees south of castle
        makebox(0.5, 3, 0.5, brown, cx - 5, 1.5, 28);
        makesphere(2.5, 8, 6, darkGreen, cx - 5, 5.5, 28);
        makebox(0.5, 3.5, 0.5, brown, cx + 8, 1.75, 32);
        makesphere(3, 8, 6, darkGreen, cx + 8, 6.5, 32);
        makebox(0.5, 4, 0.5, brown, cx - 18, 2, 30);
        makesphere(3.2, 8, 6, darkGreen, cx - 18, 6.5, 30);

        // ---- RIVER NORE (south of castle) ----
        // Main river channel - curved approximation with box segments
        makebox(50, 0.3, 6, water, cx - 5, 0.05, 22);
        makebox(30, 0.3, 6, water, cx + 20, 0.05, 26);
        makebox(20, 0.3, 8, water, cx - 22, 0.05, 26);
        // River bank variation
        makebox(50, 0.2, 1.5, sandColor, cx - 5, 0.1, 19.5);
        makebox(50, 0.2, 1.5, sandColor, cx - 5, 0.1, 25.2);

        // ---- SMITHWICK'S BREWERY (west side) ----
        // Main factory block
        makebox(18, 10, 12, brick, cx - 40, 5, 5);
        // Secondary building
        makebox(10, 7, 8, brick, cx - 50, 3.5, -3);
        // Chimney stacks
        makecyl(1.2, 1.4, 18, 8, brick, cx - 38, 9, 0);
        makecyl(1.0, 1.2, 14, 8, brick, cx - 46, 7, 2);
        // Chimney caps
        makecyl(1.5, 1.5, 0.6, 8, darkGrey, cx - 38, 18.3, 0);
        makecyl(1.3, 1.3, 0.5, 8, darkGrey, cx - 46, 14.3, 2);
        // Brewery windows
        for (i = 0; i < 4; i++) {
            makebox(1.5, 2, 0.3, windowColor, cx - 47 + i * 4, 5.5, -1.2);
        }
        // Loading area / yard
        makebox(16, 0.2, 8, cobble, cx - 40, 0.1, -5);
        // Fence/gate posts
        for (i = 0; i < 5; i++) {
            makebox(0.3, 2, 0.3, ironColor, cx - 32 + i * 1.5, 1, -2);
        }

        // ---- MEDIEVAL CITY WALL (east from castle) ----
        // Wall sections running east
        makebox(15, 5, 1.5, grey, cx + 25, 2.5, -18);
        makebox(15, 5, 1.5, grey, cx + 42, 2.5, -18);
        makebox(10, 5, 1.5, grey, cx + 55, 2.5, -18);
        // Wall battlements
        for (i = 0; i < 6; i++) {
            makebox(1.0, 1.0, 0.8, grey, cx + 18 + i * 2.5, 5.5, -18);
        }
        for (i = 0; i < 6; i++) {
            makebox(1.0, 1.0, 0.8, grey, cx + 35 + i * 2.5, 5.5, -18);
        }
        // Wall towers
        makecyl(2.5, 2.5, 8, 8, grey, cx + 33, 4, -18);
        makecone(2.8, 3, 8, slate, cx + 33, 9.5, -18);
        makecyl(2.5, 2.5, 8, 8, grey, cx + 50, 4, -18);
        makecone(2.8, 3, 8, slate, cx + 50, 9.5, -18);
        // Wall gateway arch
        makebox(5, 5, 1.5, grey, cx + 25, 2.5, -25);
        makebox(2, 4, 1.8, darkBox, cx + 25, 2.2, -25);

        // ---- ST CANICE'S CATHEDRAL (far east end) ----
        // Cathedral nave
        makebox(10, 12, 22, darkGrey, cx + 70, 6, -5);
        // Cathedral transept
        makebox(20, 10, 7, darkGrey, cx + 70, 5, -5);
        // Cathedral chancel (east end)
        makebox(6, 10, 8, darkGrey, cx + 80, 5, -5);
        // West facade towers
        makebox(4, 14, 4, darkGrey, cx + 64, 7, -13);
        makbox_battlements(cx + 64, 14.6, -13, darkGrey);
        makebox(4, 14, 4, darkGrey, cx + 64, 7, 3);
        // Cathedral roof ridge
        makecone(3, 5, 4, slate, cx + 70, 17, -5);
        // Round tower (iconic Kilkenny feature)
        makecyl(2, 2, 22, 10, darkGrey, cx + 60, 11, -18);
        makecone(2.3, 4, 10, slate, cx + 60, 24, -18);
        // Cathedral windows (lancets)
        for (i = 0; i < 4; i++) {
            makebox(1.2, 3, 0.4, windowColor, cx + 65 + i * 3, 7, -16.3);
        }
        // Cathedral doorway
        makebox(2.5, 4, 0.5, darkBox, cx + 61, 2, -13);

        // ---- ADDITIONAL DETAILS ----
        // Castle drawbridge (flat boards)
        makebox(4, 0.4, 5, brown, cx, 0.2, -16.5);
        // Moat / dry ditch suggestion
        makebox(30, 0.3, 3, 0x3A2A1A, cx, 0.05, -16);

        // Flag/pole on gate tower
        makecyl(0.1, 0.1, 5, 4, ironColor, cx + 1, 19, -11);
        makebox(2, 1, 0.1, 0xCC0000, cx + 2, 21, -11);

        // Decorative urns on gallery parapet
        for (i = 0; i < 5; i++) {
            makecyl(0.3, 0.4, 0.8, paleStone, cx + 10 + i * 6, 7.0, -2.8);
        }

        // Path leading to castle
        makebox(4, 0.2, 20, sandColor, cx, 0.1, -24);

        // Lamp posts along path
        makecyl(0.1, 0.1, 3, 4, ironColor, cx - 3, 1.5, -20);
        makesphere(0.4, 6, 4, 0xFFFFCC, cx - 3, 3.2, -20);
        makecyl(0.1, 0.1, 3, 4, ironColor, cx + 3, 1.5, -20);
        makesphere(0.4, 6, 4, 0xFFFFCC, cx + 3, 3.2, -20);

        // Information sign / notice board
        makebox(1.5, 1.2, 0.1, brown, cx - 8, 1.5, -18);
        makebox(0.1, 1.5, 0.1, brown, cx - 8.4, 0.75, -18);
        makebox(0.1, 1.5, 0.1, brown, cx - 7.6, 0.75, -18);

        // Benches in the grounds
        makebox(2, 0.2, 0.6, brown, cx - 12, 0.6, -20);
        makebox(0.15, 0.6, 0.5, brown, cx - 13, 0.3, -20);
        makebox(0.15, 0.6, 0.5, brown, cx - 11, 0.3, -20);

        makebox(2, 0.2, 0.6, brown, cx + 5, 0.6, -20);
        makebox(0.15, 0.6, 0.5, brown, cx + 4, 0.3, -20);
        makebox(0.15, 0.6, 0.5, brown, cx + 6, 0.3, -20);

        // Brewery signage wall
        makebox(6, 3, 0.2, 0xCC0000, cx - 38, 9, -6.2);

        // Castle garden / rose bed
        makebox(4, 0.3, 4, 0x228B22, cx - 6, 0.15, -20);
        makesphere(0.4, 6, 4, 0xFF3366, cx - 7, 0.7, -20);
        makesphere(0.4, 6, 4, 0xFF3366, cx - 5, 0.7, -21);
        makesphere(0.4, 6, 4, 0xFF3366, cx - 6, 0.7, -19);

        // East castle wall connecting towers
        makebox(1.5, 6, 14, limestone, cx + 14, 3, 0);
        // West castle wall connecting towers
        makebox(1.5, 6, 14, limestone, cx - 14, 3, 0);
        // North castle wall (with gate gap)
        makebox(6, 6, 1.5, limestone, cx - 8, 3, -14);
        makebox(6, 6, 1.5, limestone, cx + 8, 3, -14);
        // South castle wall
        makebox(22, 6, 1.5, limestone, cx, 3, 14);

        // South wall battlements
        for (i = 0; i < 9; i++) {
            makebox(1.2, 1.2, 0.8, limestone, cx - 9.6 + i * 2.4, 6.6, 14.8);
        }
    }

    function makbox_battlements(x, y, z, color) {
        for (var i = 0; i < 3; i++) {
            makebox(1, 1, 0.8, color, x - 1 + i * 1.0, y, z + 2.2);
            makebox(0.8, 1, 1, color, x + 2.2, y, z - 1 + i * 1.0);
        }
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
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
