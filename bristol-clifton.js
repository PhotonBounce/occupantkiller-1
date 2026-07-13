window.BristolClifton = (function() {
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

    function buildSuspensionBridge() {
        // Base X offset
        var bx = 14000;
        // Avon Gorge center Z
        var gz = 0;

        // --- Two Egyptian-style limestone towers ---
        // Tower 1 (west cliff)
        // Tower base plinth
        addMesh(new THREE.BoxGeometry(18, 8, 18), 0xd4c5a9, bx - 80, 4, gz);
        // Tower main shaft
        addMesh(new THREE.BoxGeometry(14, 90, 14), 0xd4c5a9, bx - 80, 49, gz);
        // Tower top decorative cornice
        addMesh(new THREE.BoxGeometry(20, 6, 20), 0xc8b89a, bx - 80, 98, gz);
        // Tower capstone
        addMesh(new THREE.BoxGeometry(16, 4, 16), 0xbcac8e, bx - 80, 103, gz);
        // Tower arch opening
        addMesh(new THREE.BoxGeometry(8, 30, 4), 0x6b5e4a, bx - 80, 35, gz - 7);

        // Tower 2 (east cliff)
        addMesh(new THREE.BoxGeometry(18, 8, 18), 0xd4c5a9, bx + 80, 4, gz);
        addMesh(new THREE.BoxGeometry(14, 90, 14), 0xd4c5a9, bx + 80, 49, gz);
        addMesh(new THREE.BoxGeometry(20, 6, 20), 0xc8b89a, bx + 80, 98, gz);
        addMesh(new THREE.BoxGeometry(16, 4, 16), 0xbcac8e, bx + 80, 103, gz);
        addMesh(new THREE.BoxGeometry(8, 30, 4), 0x6b5e4a, bx + 80, 35, gz - 7);

        // --- Bridge deck (76m above gorge floor, gorge floor at y=0, so deck at y=76) ---
        // Main deck span
        addMesh(new THREE.BoxGeometry(200, 3, 12), 0x8a7c6e, bx, 76, gz);
        // Deck railings north
        addMesh(new THREE.BoxGeometry(200, 2, 1), 0x7a6e62, bx, 78, gz - 6);
        // Deck railings south
        addMesh(new THREE.BoxGeometry(200, 2, 1), 0x7a6e62, bx, 78, gz + 6);

        // --- Suspension chains/cables (modeled as angled boxes) ---
        // Cable from west tower top down to deck midpoint and back up to east tower
        // West cable left
        var cableGeoL = new THREE.BoxGeometry(1, 1, 170);
        var cableMatL = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var cableL = new THREE.Mesh(cableGeoL, cableMatL);
        cableL.position.set(bx, 88, gz - 3);
        cableL.rotation.x = Math.atan2(27, 85);
        scene.add(cableL);
        objects.push(cableL);

        // West cable right
        var cableGeoR = new THREE.BoxGeometry(1, 1, 170);
        var cableMatR = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var cableR = new THREE.Mesh(cableGeoR, cableMatR);
        cableR.position.set(bx, 88, gz + 3);
        cableR.rotation.x = Math.atan2(27, 85);
        scene.add(cableR);
        objects.push(cableR);

        // Vertical hangers from cables to deck (simplified as thin boxes)
        var hangerPositions = [-70, -50, -30, -10, 10, 30, 50, 70];
        for (var h = 0; h < hangerPositions.length; h++) {
            var hp = hangerPositions[h];
            var hangerHeight = 10 + Math.abs(hp) * 0.15;
            addMesh(new THREE.BoxGeometry(1, hangerHeight, 1), 0x5a5a5a, bx + hp, 76 + hangerHeight / 2, gz - 3);
            addMesh(new THREE.BoxGeometry(1, hangerHeight, 1), 0x5a5a5a, bx + hp, 76 + hangerHeight / 2, gz + 3);
        }

        // --- Anchorage chambers ---
        // West anchorage
        addMesh(new THREE.BoxGeometry(30, 20, 30), 0xc0b090, bx - 130, 10, gz);
        // East anchorage
        addMesh(new THREE.BoxGeometry(30, 20, 30), 0xc0b090, bx + 130, 10, gz);
    }

    function buildAvonGorge() {
        var bx = 14000;
        var gz = 0;

        // --- Cliff faces on both sides ---
        // West cliff face
        addMesh(new THREE.BoxGeometry(400, 80, 30), 0x8b7355, bx - 130, 40, gz - 80);
        // West cliff top plateau
        addMesh(new THREE.BoxGeometry(400, 10, 60), 0x7a6a4a, bx - 130, 85, gz - 95);
        // East cliff face
        addMesh(new THREE.BoxGeometry(400, 80, 30), 0x8b7355, bx + 130, 40, gz - 80);
        // East cliff top plateau
        addMesh(new THREE.BoxGeometry(400, 10, 60), 0x7a6a4a, bx + 130, 85, gz - 95);

        // Limestone cliff detail bands
        addMesh(new THREE.BoxGeometry(400, 6, 28), 0xa0916e, bx - 130, 25, gz - 80);
        addMesh(new THREE.BoxGeometry(400, 6, 28), 0xa0916e, bx - 130, 55, gz - 80);
        addMesh(new THREE.BoxGeometry(400, 6, 28), 0xa0916e, bx + 130, 25, gz - 80);
        addMesh(new THREE.BoxGeometry(400, 6, 28), 0xa0916e, bx + 130, 55, gz - 80);

        // --- Avon River below ---
        addMesh(new THREE.BoxGeometry(200, 2, 40), 0x3a6f8a, bx, 1, gz - 20);

        // --- Observatory on cliff top (west side) ---
        // Observatory tower base
        addMesh(new THREE.CylinderGeometry(8, 10, 25, 8), 0xd0c0a0, bx - 140, 110, gz - 100);
        // Observatory dome
        addMesh(new THREE.SphereGeometry(8, 8, 6), 0xb8a888, bx - 140, 125, gz - 100);
        // Camera obscura turret
        addMesh(new THREE.CylinderGeometry(3, 4, 6, 8), 0xc8b898, bx - 145, 136, gz - 100);

        // --- Leigh Woods (far side, west) ---
        var treePositions = [
            [-170, gz - 110], [-185, gz - 115], [-195, gz - 105],
            [-175, gz - 125], [-160, gz - 120], [-200, gz - 118],
            [-165, gz - 130], [-190, gz - 130]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tx = bx + treePositions[t][0];
            var tz = treePositions[t][1];
            addMesh(new THREE.CylinderGeometry(0, 7, 14, 6), 0x2d5a1b, tx, 100, tz);
            addMesh(new THREE.CylinderGeometry(0, 6, 12, 6), 0x3a7024, tx, 108, tz);
        }
    }

    function buildCliftonVillage() {
        var bx = 14000;

        // --- Royal York Crescent (largest Regency crescent outside Bath) ---
        // Crescent spans along z, curved in plan — approximated as arc of boxes
        var crescentAngles = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
        for (var c = 0; c < crescentAngles.length; c++) {
            var ang = crescentAngles[c] * Math.PI / 180;
            var cr = 120;
            var cx = bx - 220 + Math.sin(ang) * cr;
            var cz = -300 + Math.cos(ang) * cr - cr;
            var house = addMesh(new THREE.BoxGeometry(18, 22, 14), 0xe8d8b8, cx, 11, cz);
            house.rotation.y = -ang;
            // Roof
            var roof = addMesh(new THREE.BoxGeometry(18, 5, 14), 0xc8a878, cx, 24, cz);
            roof.rotation.y = -ang;
            // Ground floor columns
            addMesh(new THREE.BoxGeometry(16, 4, 12), 0xf0e0c0, cx, 2, cz);
        }

        // --- Cabot Tower on Brandon Hill ---
        // Hill base
        addMesh(new THREE.CylinderGeometry(40, 55, 20, 8), 0x5a7a3a, bx - 300, 10, -400);
        // Tower base
        addMesh(new THREE.BoxGeometry(14, 40, 14), 0xd0c0a0, bx - 300, 40, -400);
        // Tower middle
        addMesh(new THREE.BoxGeometry(11, 20, 11), 0xc8b898, bx - 300, 70, -400);
        // Tower upper
        addMesh(new THREE.BoxGeometry(9, 15, 9), 0xbcac88, bx - 300, 87, -400);
        // Tower spire
        addMesh(new THREE.ConeGeometry(4, 12, 4), 0x8a7a5a, bx - 300, 99, -400);

        // --- Colourful Georgian terraces ---
        var terraceColors = [0xe8c880, 0xd4b070, 0xe0c090, 0xc8a868, 0xd8c088, 0xecd8a0];
        for (var tr = 0; tr < 6; tr++) {
            addMesh(new THREE.BoxGeometry(16, 18, 12), terraceColors[tr], bx - 180 + tr * 20, 9, -240);
            // Pitched roofs
            addMesh(new THREE.BoxGeometry(16, 6, 12), 0x8a6a4a, bx - 180 + tr * 20, 21, -240);
            // Sash windows
            addMesh(new THREE.BoxGeometry(14, 2, 10), 0xf8f8e8, bx - 180 + tr * 20, 14, -240);
        }

        // --- Clifton Down shopping street ---
        addMesh(new THREE.BoxGeometry(200, 12, 20), 0xd8c8a8, bx - 100, 6, -200);
    }

    function buildSSGreatBritain() {
        var bx = 14000;
        var sz = 400;

        // --- Great Western Dockyard ---
        // Dry dock walls
        addMesh(new THREE.BoxGeometry(90, 12, 5), 0x7a6a5a, bx + 200, 6, sz);
        addMesh(new THREE.BoxGeometry(90, 12, 5), 0x7a6a5a, bx + 200, 6, sz + 40);
        addMesh(new THREE.BoxGeometry(5, 12, 40), 0x7a6a5a, bx + 155, 6, sz + 20);

        // --- SS Great Britain iron hull ---
        // Main hull
        addMesh(new THREE.BoxGeometry(80, 14, 20), 0x3a3a4a, bx + 200, 7, sz + 20);
        // Hull bow (tapered)
        addMesh(new THREE.BoxGeometry(15, 12, 16), 0x2a2a3a, bx + 157, 7, sz + 20);
        // Hull stern
        addMesh(new THREE.BoxGeometry(10, 12, 18), 0x2a2a3a, bx + 243, 7, sz + 20);
        // Upper deck
        addMesh(new THREE.BoxGeometry(80, 3, 18), 0x4a4a5a, bx + 200, 15, sz + 20);
        // Superstructure deck house
        addMesh(new THREE.BoxGeometry(30, 8, 14), 0x5a5a6a, bx + 200, 22, sz + 20);

        // --- Masts (3 masts) ---
        addMesh(new THREE.CylinderGeometry(0.8, 1, 35, 6), 0x6a5a4a, bx + 180, 33, sz + 20);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 40, 6), 0x6a5a4a, bx + 200, 36, sz + 20);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 32, 6), 0x6a5a4a, bx + 222, 32, sz + 20);
        // Yard arms
        addMesh(new THREE.BoxGeometry(22, 1, 1), 0x6a5a4a, bx + 180, 42, sz + 20);
        addMesh(new THREE.BoxGeometry(28, 1, 1), 0x6a5a4a, bx + 200, 47, sz + 20);
        addMesh(new THREE.BoxGeometry(20, 1, 1), 0x6a5a4a, bx + 222, 40, sz + 20);

        // --- Funnel ---
        addMesh(new THREE.CylinderGeometry(2.5, 3, 18, 8), 0x1a1a1a, bx + 205, 35, sz + 20);
        // Funnel top rim
        addMesh(new THREE.CylinderGeometry(3, 2.5, 2, 8), 0x2a2a2a, bx + 205, 45, sz + 20);

        // --- Museum building ---
        addMesh(new THREE.BoxGeometry(40, 16, 30), 0xc8b898, bx + 260, 8, sz + 20);
        addMesh(new THREE.BoxGeometry(42, 4, 32), 0xb8a888, bx + 260, 18, sz + 20);
        // Museum entrance portico
        addMesh(new THREE.BoxGeometry(14, 12, 5), 0xd8c8a8, bx + 240, 6, sz + 20);
    }

    function buildBristolOldVic() {
        var bx = 14000;
        var oz = 600;

        // --- King Street Georgian buildings ---
        // Bristol Old Vic theatre building
        addMesh(new THREE.BoxGeometry(35, 22, 20), 0xd0b888, bx + 300, 11, oz);
        // Theatre roof
        addMesh(new THREE.BoxGeometry(37, 5, 22), 0xa08060, bx + 300, 24, oz);
        // Theatre Georgian facade columns
        addMesh(new THREE.BoxGeometry(33, 3, 18), 0xe8d0a8, bx + 300, 2, oz);
        // Pediment
        addMesh(new THREE.BoxGeometry(35, 8, 4), 0xd8c090, bx + 300, 28, oz - 8);
        // Theatre windows (upper)
        addMesh(new THREE.BoxGeometry(33, 4, 3), 0x8898a8, bx + 300, 18, oz - 10);
        // Theatre sign / playbill board
        addMesh(new THREE.BoxGeometry(20, 3, 2), 0x4a3a2a, bx + 300, 12, oz - 11);

        // --- Llandoger Trow pub (17th century timber-framed) ---
        addMesh(new THREE.BoxGeometry(16, 18, 14), 0x8a6a4a, bx + 340, 9, oz);
        // Timber frame dark beams
        addMesh(new THREE.BoxGeometry(14, 1, 12), 0x4a3a2a, bx + 340, 6, oz);
        addMesh(new THREE.BoxGeometry(14, 1, 12), 0x4a3a2a, bx + 340, 12, oz);
        // Gabled dormers
        addMesh(new THREE.BoxGeometry(6, 8, 8), 0x7a5a3a, bx + 337, 22, oz);
        addMesh(new THREE.BoxGeometry(6, 8, 8), 0x7a5a3a, bx + 344, 22, oz);
        // Pub sign
        addMesh(new THREE.BoxGeometry(4, 4, 1), 0x2a1a0a, bx + 332, 14, oz - 8);

        // --- King Street cobbles / street ---
        addMesh(new THREE.BoxGeometry(120, 1, 18), 0x8a8078, bx + 310, 0.5, oz - 15);
    }

    function buildHarbourside() {
        var bx = 14000;
        var hz = 700;

        // --- Floating Harbour water ---
        addMesh(new THREE.BoxGeometry(350, 2, 120), 0x2a5a7a, bx + 100, 1, hz);

        // --- M Shed museum ---
        addMesh(new THREE.BoxGeometry(60, 20, 30), 0xc0c0b8, bx + 80, 10, hz - 50);
        // M Shed roof (industrial shed style)
        addMesh(new THREE.BoxGeometry(62, 4, 32), 0xa0a098, bx + 80, 22, hz - 50);
        // M Shed entrance glass front
        addMesh(new THREE.BoxGeometry(58, 18, 3), 0x88aab8, bx + 80, 9, hz - 66);
        // M Shed sign
        addMesh(new THREE.BoxGeometry(20, 4, 2), 0x3a3a3a, bx + 80, 20, hz - 67);

        // --- Historic cranes ---
        // Crane 1
        addMesh(new THREE.BoxGeometry(4, 30, 4), 0x5a5a4a, bx + 150, 15, hz - 55);
        addMesh(new THREE.BoxGeometry(25, 3, 3), 0x5a5a4a, bx + 163, 30, hz - 55);
        addMesh(new THREE.BoxGeometry(2, 8, 2), 0x4a4a3a, bx + 174, 26, hz - 55);
        // Crane 2
        addMesh(new THREE.BoxGeometry(4, 28, 4), 0x5a5a4a, bx + 170, 14, hz - 55);
        addMesh(new THREE.BoxGeometry(22, 3, 3), 0x5a5a4a, bx + 181, 28, hz - 55);
        addMesh(new THREE.BoxGeometry(2, 7, 2), 0x4a4a3a, bx + 191, 24, hz - 55);

        // --- Historic boats in harbour ---
        // Boat 1 hull
        addMesh(new THREE.BoxGeometry(25, 6, 8), 0x4a3a2a, bx + 40, 4, hz);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 18, 6), 0x5a4a3a, bx + 40, 15, hz);
        // Boat 2 hull
        addMesh(new THREE.BoxGeometry(20, 5, 7), 0x3a4a3a, bx + 120, 3.5, hz + 30);
        addMesh(new THREE.CylinderGeometry(0.7, 0.9, 15, 6), 0x4a5a4a, bx + 120, 13, hz + 30);

        // --- Millennium Square ---
        addMesh(new THREE.BoxGeometry(80, 1, 60), 0x9a9090, bx - 20, 0.5, hz - 90);
        // Square feature / sculpture
        addMesh(new THREE.SphereGeometry(6, 8, 6), 0xc8c8c8, bx - 20, 7, hz - 90);
        addMesh(new THREE.CylinderGeometry(1.5, 2, 12, 8), 0xb8b8b8, bx - 20, 6, hz - 90);

        // --- @Bristol / We The Curious science centre ---
        addMesh(new THREE.BoxGeometry(55, 20, 40), 0x8898c8, bx - 80, 10, hz - 90);
        // Sci centre dome feature
        addMesh(new THREE.SphereGeometry(12, 10, 8), 0x7888b8, bx - 80, 26, hz - 90);
        // Sci centre entrance
        addMesh(new THREE.BoxGeometry(20, 14, 5), 0xa0b0d8, bx - 80, 7, hz - 111);

        // --- Harbour walkway ---
        addMesh(new THREE.BoxGeometry(350, 1, 10), 0x8a8078, bx + 100, 0.5, hz - 62);
    }

    function build() {
        buildSuspensionBridge();
        buildAvonGorge();
        buildCliftonVillage();
        buildSSGreatBritain();
        buildBristolOldVic();
        buildHarbourside();
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
