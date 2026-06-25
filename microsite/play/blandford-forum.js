window.BlandfordForum = (function() {
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
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeBox(w, h, d, color, x, y, z) {
        var mesh = makeMesh(new THREE.BoxGeometry(w, h, d), color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var mesh = makeMesh(new THREE.CylinderGeometry(rt, rb, h, segs), color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var mesh = makeMesh(new THREE.SphereGeometry(r, ws, hs), color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var mesh = makeMesh(new THREE.ConeGeometry(r, h, segs), color);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeLines(points, color) {
        var geo = new THREE.BufferGeometry().setFromPoints(points);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(geo, mat);
        scene.add(lines);
        objects.push(lines);
        return lines;
    }

    var OX = 13720;

    function buildMarketPlace() {
        // Ground / cobblestone square
        makeBox(80, 0.5, 80, 0x888880, OX, 0.25, 0);

        // Town Hall / Corn Exchange — central Georgian building
        makeBox(30, 14, 14, 0xD4B483, OX, 7.25, -20);
        // Pediment / triangular roof section
        makeCone(16, 5, 4, 0xC8A87A, OX, 19.75, -20);
        // Portico columns (4 ionic columns)
        makeCylinder(0.6, 0.6, 10, 8, 0xF0EAD6, OX - 6, 5, -27);
        makeCylinder(0.6, 0.6, 10, 8, 0xF0EAD6, OX - 2, 5, -27);
        makeCylinder(0.6, 0.6, 10, 8, 0xF0EAD6, OX + 2, 5, -27);
        makeCylinder(0.6, 0.6, 10, 8, 0xF0EAD6, OX + 6, 5, -27);
        // Portico entablature
        makeBox(20, 1.5, 2, 0xE8DCC8, OX, 10.75, -27);
        // Cupola on town hall
        makeCylinder(2.5, 2.5, 4, 8, 0xD4B483, OX, 19, -20);
        makeSphere(2.5, 8, 6, 0x88A0A0, OX, 22.5, -20);

        // Market cross / fire monument (pump monument 1731 fire)
        makeCylinder(0.4, 0.5, 7, 6, 0xC8C8C0, OX, 3.75, 8);
        makeSphere(0.8, 8, 6, 0xC0C0B8, OX, 7.75, 8);
        // Base plinth
        makeBox(2.5, 1, 2.5, 0x888880, OX, 0.5, 8);

        // Georgian townhouses north side
        buildGeorgianRow(OX - 36, 0, -38, 4, true);
        // Georgian townhouses south side
        buildGeorgianRow(OX - 36, 0, 38, 4, true);
        // Georgian townhouses east side
        buildGeorgianRow(OX + 42, 0, -15, 3, false);
        // Georgian townhouses west side
        buildGeorgianRow(OX - 42, 0, -15, 3, false);
    }

    function buildGeorgianRow(startX, startY, startZ, count, alongX) {
        var i;
        for (i = 0; i < count; i++) {
            var px = alongX ? startX + i * 19 : startX;
            var pz = alongX ? startZ : startZ + i * 14;
            buildGeorgianHouse(px, startY, pz, alongX);
        }
    }

    function buildGeorgianHouse(x, y, z, faceZ) {
        // Main body
        makeBox(16, 12, 10, 0xC8836A, x, y + 6, z);
        // Roof
        makeCone(9, 5, 4, 0x604020, x, y + 14.5, z);
        // Sash windows (small boxes)
        if (faceZ) {
            makeBox(2.5, 3, 0.3, 0xC8D8E0, x - 3.5, y + 8, z - 5.15);
            makeBox(2.5, 3, 0.3, 0xC8D8E0, x + 3.5, y + 8, z - 5.15);
            makeBox(2.5, 3, 0.3, 0xC8D8E0, x - 3.5, y + 4.5, z - 5.15);
            makeBox(2.5, 3, 0.3, 0xC8D8E0, x + 3.5, y + 4.5, z - 5.15);
            // Fanlight / door
            makeBox(2, 4.5, 0.3, 0x7090A0, x, y + 2.75, z - 5.15);
            makeSphere(1, 6, 4, 0xC8D8E0, x, y + 5.25, z - 5.15);
        } else {
            makeBox(0.3, 3, 2.5, 0xC8D8E0, x - 8.15, y + 8, z - 2);
            makeBox(0.3, 3, 2.5, 0xC8D8E0, x - 8.15, y + 8, z + 2);
            makeBox(0.3, 4.5, 2, 0x7090A0, x - 8.15, y + 2.75, z);
        }
        // Chimney stacks
        makeCylinder(0.4, 0.4, 3, 4, 0x804030, x - 5, y + 18, z);
        makeCylinder(0.4, 0.4, 3, 4, 0x804030, x + 5, y + 18, z);
    }

    function buildStPeterAndStPaul() {
        var cx = OX + 60;
        var cz = -50;

        // Nave
        makeBox(22, 14, 50, 0xD4C89A, cx, 7, cz);
        // Clerestory
        makeBox(14, 5, 50, 0xD4C89A, cx, 16.5, cz);
        // Chancel
        makeBox(14, 12, 16, 0xD4C89A, cx, 6, cz - 33);
        // Roof nave
        makeCone(12, 6, 4, 0x706050, cx, 21, cz);
        // Roof chancel
        makeCone(8, 5, 4, 0x706050, cx, 17, cz - 33);

        // West front / pedimented facade
        makeBox(22, 18, 3, 0xE8DCC8, cx, 9, cz + 26.5);
        // Pediment
        makeCone(12, 6, 4, 0xDDD0B8, cx, 21, cz + 26.5);
        // Ionic columns west front
        makeCylinder(0.7, 0.7, 14, 8, 0xF0EAD6, cx - 7, 7, cz + 28);
        makeCylinder(0.7, 0.7, 14, 8, 0xF0EAD6, cx - 3, 7, cz + 28);
        makeCylinder(0.7, 0.7, 14, 8, 0xF0EAD6, cx + 3, 7, cz + 28);
        makeCylinder(0.7, 0.7, 14, 8, 0xF0EAD6, cx + 7, 7, cz + 28);
        // Column entablature
        makeBox(20, 1.5, 1.5, 0xE0D4C0, cx, 14.75, cz + 28);

        // Tower — square base
        makeBox(10, 30, 10, 0xD0C490, cx, 15, cz + 20);
        // Tower balustrade
        makeBox(12, 2, 12, 0xD8CC9A, cx, 31, cz + 20);
        // Corner pinnacles
        makeCylinder(0.5, 0.5, 3, 4, 0xD8CC9A, cx - 5.5, 33.5, cz + 14.5);
        makeCylinder(0.5, 0.5, 3, 4, 0xD8CC9A, cx + 5.5, 33.5, cz + 14.5);
        makeCylinder(0.5, 0.5, 3, 4, 0xD8CC9A, cx - 5.5, 33.5, cz + 25.5);
        makeCylinder(0.5, 0.5, 3, 4, 0xD8CC9A, cx + 5.5, 33.5, cz + 25.5);
        // Cupola
        makeCylinder(2, 2, 5, 8, 0xC8BC80, cx, 34.5, cz + 20);
        makeSphere(2, 8, 6, 0x80A090, cx, 38.5, cz + 20);
        // Clock faces (flat boxes)
        makeBox(4, 4, 0.3, 0xF5F0E0, cx, 26, cz + 15.15);
        makeBox(4, 4, 0.3, 0xF5F0E0, cx, 26, cz + 24.85);
        makeBox(0.3, 4, 4, 0xF5F0E0, cx - 5.15, 26, cz + 20);
        makeBox(0.3, 4, 4, 0xF5F0E0, cx + 5.15, 26, cz + 20);

        // Churchyard wall
        makeBox(80, 1.5, 1, 0xA09060, cx, 0.75, cz + 40);
        makeBox(80, 1.5, 1, 0xA09060, cx, 0.75, cz - 50);
        makeBox(1, 1.5, 90, 0xA09060, cx - 40, 0.75, cz - 5);
        makeBox(1, 1.5, 90, 0xA09060, cx + 40, 0.75, cz - 5);
        // Churchyard ground
        makeBox(78, 0.3, 88, 0x3A6030, cx, 0.15, cz - 5);
        // Gravestones
        var g;
        for (g = 0; g < 10; g++) {
            makeBox(0.6, 1.2, 0.15, 0x909088, cx - 30 + g * 6, 0.8, cz + 25);
            makeBox(0.6, 1.2, 0.15, 0x909088, cx - 30 + g * 6, 0.8, cz - 40);
        }
    }

    function buildGeorgianStreets() {
        var i;
        // East Street — heading east from market place
        makeBox(200, 0.3, 16, 0x706858, OX + 140, 0.15, 0);
        // Buildings along East Street north side
        for (i = 0; i < 5; i++) {
            buildGeorgianHouse(OX + 60 + i * 20, 0, -14, true);
        }
        // Buildings along East Street south side
        for (i = 0; i < 5; i++) {
            buildGeorgianHouse(OX + 60 + i * 20, 0, 14, true);
        }

        // West Street — heading west from market place
        makeBox(160, 0.3, 16, 0x706858, OX - 120, 0.15, 0);
        for (i = 0; i < 4; i++) {
            buildGeorgianHouse(OX - 55 - i * 20, 0, -14, true);
        }
        for (i = 0; i < 4; i++) {
            buildGeorgianHouse(OX - 55 - i * 20, 0, 14, true);
        }

        // Salisbury Street — heading north
        makeBox(16, 0.3, 120, 0x706858, OX, 0.15, -100);
        for (i = 0; i < 4; i++) {
            buildGeorgianHouse(OX - 14, 0, -60 - i * 18, false);
            buildGeorgianHouse(OX + 14, 0, -60 - i * 18, false);
        }

        // Pavement / kerb lines
        makeBox(200, 0.2, 2, 0x888880, OX + 140, 0.3, -8);
        makeBox(200, 0.2, 2, 0x888880, OX + 140, 0.3, 8);
    }

    function buildHallAndWoodhouse() {
        var bx = OX - 80;
        var bz = 60;

        // Brewery ground
        makeBox(70, 0.4, 60, 0x604830, bx, 0.2, bz);

        // Main Victorian brewery building
        makeBox(35, 18, 25, 0x8B4513, bx, 9, bz - 10);
        // Pitched roof
        makeCone(20, 7, 4, 0x3C2010, bx, 22.5, bz - 10);
        // Chimney stack
        makeCylinder(1.5, 1.5, 22, 8, 0x604020, bx + 12, 11, bz - 10);
        makeCylinder(2, 1.5, 2, 8, 0x404040, bx + 12, 23, bz - 10);

        // Brewing vessels / copper kettles
        makeCylinder(3, 3, 8, 12, 0xB87333, bx - 6, 4, bz - 5);
        makeSphere(3, 8, 6, 0xB87333, bx - 6, 8.5, bz - 5);
        makeCylinder(3, 3, 8, 12, 0xB87333, bx + 3, 4, bz - 5);
        makeSphere(3, 8, 6, 0xB87333, bx + 3, 8.5, bz - 5);
        makeCylinder(2.5, 2.5, 10, 12, 0x8090A0, bx - 3, 5, bz + 8);
        makeSphere(2.5, 8, 6, 0x8090A0, bx - 3, 10.5, bz + 8);

        // Hop store building
        makeBox(20, 12, 16, 0x7A4520, bx + 22, 6, bz + 18);
        makeCone(11, 5, 4, 0x3C2010, bx + 22, 14.5, bz + 18);

        // Visitor centre — newer building
        makeBox(22, 8, 16, 0xC8B898, bx - 20, 4, bz + 20);
        makeCone(12, 4, 4, 0x604020, bx - 20, 10, bz + 20);
        // Signage board
        makeBox(8, 3, 0.3, 0xD4A020, bx - 20, 5.5, bz + 12.15);

        // Brewery gate / entrance
        makeBox(1, 5, 1, 0x402010, bx - 12, 2.5, bz - 30);
        makeBox(1, 5, 1, 0x402010, bx - 6, 2.5, bz - 30);
        makeBox(10, 1, 1, 0x402010, bx - 9, 5, bz - 30);
    }

    function buildRiverStour() {
        var rx = OX + 10;
        var rz = 80;

        // River channel — long flat water plane
        makeBox(200, 0.2, 22, 0x3060A0, rx, 0.1, rz);

        // River banks — grass
        makeBox(200, 0.5, 8, 0x3A7040, rx, 0.25, rz - 15);
        makeBox(200, 0.5, 8, 0x3A7040, rx, 0.25, rz + 15);

        // Water meadows east
        makeBox(80, 0.4, 50, 0x4A8050, rx + 80, 0.2, rz + 40);
        makeBox(80, 0.4, 50, 0x4A8050, rx - 80, 0.2, rz + 40);

        // Crown Bridge — stone arch bridge
        makeBox(18, 2.5, 28, 0xA09070, rx, 1.25, rz);
        // Bridge arch (box approximation)
        makeBox(10, 4, 4, 0x3060A0, rx, 1.5, rz - 2);
        makeBox(10, 4, 4, 0x3060A0, rx, 1.5, rz + 2);
        // Bridge parapets
        makeBox(18, 1.5, 1, 0xA09070, rx, 3.25, rz - 14);
        makeBox(18, 1.5, 1, 0xA09070, rx, 3.25, rz + 14);
        // Bridge buttresses
        makeCylinder(1.5, 1.8, 4, 6, 0x908060, rx - 6, 2, rz);
        makeCylinder(1.5, 1.8, 4, 6, 0x908060, rx + 6, 2, rz);

        // Riverside walk path
        makeBox(160, 0.3, 4, 0xA09070, rx, 0.15, rz - 18);

        // Riverside trees (cylinders for trunks, spheres for canopy)
        var t;
        for (t = 0; t < 8; t++) {
            makeCylinder(0.4, 0.4, 5, 6, 0x604030, rx - 60 + t * 18, 2.5, rz - 22);
            makeSphere(3, 8, 6, 0x2A6020, rx - 60 + t * 18, 7, rz - 22);
        }
        // Willow trees near bank
        for (t = 0; t < 5; t++) {
            makeCylinder(0.5, 0.5, 6, 6, 0x503820, rx - 40 + t * 22, 3, rz + 20);
            makeSphere(4, 8, 6, 0x3A7030, rx - 40 + t * 22, 8, rz + 20);
        }
    }

    function buildBryanston() {
        var bx = OX - 120;
        var bz = -120;

        // Parkland ground
        makeBox(200, 0.4, 150, 0x3A7040, bx, 0.2, bz);

        // Main Palladian mansion — central block
        makeBox(60, 18, 24, 0xE8D8B0, bx, 9, bz);
        // Roof / parapet
        makeBox(64, 2, 28, 0xD8C8A0, bx, 18.5, bz);
        // Pediment central
        makeCone(20, 7, 4, 0xD0C090, bx, 23.5, bz);

        // Portico — grand entrance
        makeCylinder(0.8, 0.8, 14, 8, 0xF0EAD6, bx - 8, 7, bz - 13);
        makeCylinder(0.8, 0.8, 14, 8, 0xF0EAD6, bx - 2.5, 7, bz - 13);
        makeCylinder(0.8, 0.8, 14, 8, 0xF0EAD6, bx + 2.5, 7, bz - 13);
        makeCylinder(0.8, 0.8, 14, 8, 0xF0EAD6, bx + 8, 7, bz - 13);
        makeBox(22, 1.5, 2, 0xE0D4C0, bx, 14.75, bz - 13);

        // East wing
        makeBox(28, 14, 22, 0xE8D8B0, bx + 44, 7, bz);
        makeBox(30, 1.5, 24, 0xD8C8A0, bx + 44, 14.75, bz);
        // West wing
        makeBox(28, 14, 22, 0xE8D8B0, bx - 44, 7, bz);
        makeBox(30, 1.5, 24, 0xD8C8A0, bx - 44, 14.75, bz);

        // School chapel — smaller classical building
        makeBox(16, 10, 22, 0xD8C8A0, bx + 60, 5, bz - 40);
        makeCone(9, 5, 4, 0xC8B890, bx + 60, 12.5, bz - 40);
        makeCylinder(0.6, 0.6, 8, 8, 0xF0EAD6, bx + 55, 4, bz - 51);
        makeCylinder(0.6, 0.6, 8, 8, 0xF0EAD6, bx + 58, 4, bz - 51);
        makeCylinder(0.6, 0.6, 8, 8, 0xF0EAD6, bx + 62, 4, bz - 51);
        makeCylinder(0.6, 0.6, 8, 8, 0xF0EAD6, bx + 65, 4, bz - 51);
        makeCylinder(2, 2, 8, 8, 0xD8C8A0, bx + 60, 15, bz - 40);
        makeSphere(2, 8, 6, 0x708090, bx + 60, 20, bz - 40);

        // Parkland trees
        var t;
        for (t = 0; t < 10; t++) {
            makeCylinder(0.6, 0.6, 8, 6, 0x503820, bx - 80 + t * 16, 4, bz - 60);
            makeSphere(4.5, 8, 6, 0x2A5520, bx - 80 + t * 16, 10, bz - 60);
        }
        for (t = 0; t < 6; t++) {
            makeCylinder(0.5, 0.5, 7, 6, 0x503820, bx + 30 + t * 12, 3.5, bz + 50);
            makeSphere(3.5, 8, 6, 0x2A5520, bx + 30 + t * 12, 9, bz + 50);
        }
        // Driveway
        makeBox(6, 0.3, 70, 0x9A8A70, bx, 0.15, bz - 47);
    }

    function build() {
        buildMarketPlace();
        buildStPeterAndStPaul();
        buildGeorgianStreets();
        buildHallAndWoodhouse();
        buildRiverStour();
        buildBryanston();
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
