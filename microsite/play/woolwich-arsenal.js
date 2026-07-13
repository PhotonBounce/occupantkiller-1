window.WoolwichArsenal = (function() {
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

    function addbox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(5600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
    }

    function addcylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(5600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
    }

    function addsphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(5600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
    }

    function addcone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(5600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
    }

    function addwire(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var mesh = new THREE.LineSegments(edges, mat);
        mesh.position.set(5600 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
    }

    function build() {
        // --- 1. Georgian Arsenal buildings (6 historic brick buildings) ---
        // Main row of Arsenal buildings along the central parade
        var arsenalPositions = [
            [-60, 3.5, -30],
            [-35, 3.5, -30],
            [-10, 3.5, -30],
            [15, 3.5, -30],
            [40, 3.5, -30],
            [65, 3.5, -30]
        ];
        var i;
        for (i = 0; i < arsenalPositions.length; i++) {
            // Main building body
            addbox(20, 7, 12, 0x9B3A2A,
                arsenalPositions[i][0],
                arsenalPositions[i][1],
                arsenalPositions[i][2]);
            // White window surrounds — front face windows (3 per building)
            addbox(2.5, 2, 0.4, 0xEEEEDD,
                arsenalPositions[i][0] - 5,
                arsenalPositions[i][1] + 1,
                arsenalPositions[i][2] - 6.2);
            addbox(2.5, 2, 0.4, 0xEEEEDD,
                arsenalPositions[i][0],
                arsenalPositions[i][1] + 1,
                arsenalPositions[i][2] - 6.2);
            addbox(2.5, 2, 0.4, 0xEEEEDD,
                arsenalPositions[i][0] + 5,
                arsenalPositions[i][1] + 1,
                arsenalPositions[i][2] - 6.2);
        }

        // --- 2. Dial Square (original Arsenal FC pitch) ---
        // Ground surface marker — flat thin box
        addbox(40, 0.2, 25, 0x4A7A3A, 0, 0.1, 20);
        // Surrounding brick walls — 4 sides, 1 high
        addbox(40, 1, 0.5, 0x9B3A2A, 0, 0.5, 7.5);    // near side
        addbox(40, 1, 0.5, 0x9B3A2A, 0, 0.5, 32.5);   // far side
        addbox(0.5, 1, 25, 0x9B3A2A, -20, 0.5, 20);   // left side
        addbox(0.5, 1, 25, 0x9B3A2A, 20, 0.5, 20);    // right side

        // --- 3. Woolwich Elizabeth Line station ---
        // Modern wedge-shaped canopy — main roof slab
        addbox(35, 2, 12, 0x889999, 0, 8, -65);
        // Station entrance canopy overhang (thinner slab at lower level)
        addbox(35, 0.6, 4, 0x778888, 0, 5, -59);
        // Station platform walls
        addbox(35, 5, 1, 0x667777, 0, 2.5, -71);
        addbox(1, 5, 12, 0x667777, -17.5, 2.5, -65);
        addbox(1, 5, 12, 0x667777, 17.5, 2.5, -65);
        // Station entrance columns (4 steel pillars)
        addbox(0.6, 8, 0.6, 0x556666, -12, 4, -59);
        addbox(0.6, 8, 0.6, 0x556666, -4, 4, -59);
        addbox(0.6, 8, 0.6, 0x556666, 4, 4, -59);
        addbox(0.6, 8, 0.6, 0x556666, 12, 4, -59);

        // --- 4. Thames waterfront retaining wall ---
        addbox(60, 3, 1, 0x777766, 0, 1.5, 80);
        // Stone coping course on top
        addbox(60, 0.4, 1.2, 0x888877, 0, 3.2, 80);
        // Mooring bollards along wall
        addcylinder(0.25, 0.3, 1.2, 0x555544, -20, 3.8, 79.5);
        addcylinder(0.25, 0.3, 1.2, 0x555544, 0, 3.8, 79.5);
        addcylinder(0.25, 0.3, 1.2, 0x555544, 20, 3.8, 79.5);

        // --- 5. Thamesmead towers (3 brutalist towers visible in distance) ---
        addbox(8, 32, 8, 0x888888, -90, 16, 120);
        addbox(8, 32, 8, 0x888888, -75, 16, 130);
        addbox(8, 32, 8, 0x888888, -60, 16, 115);
        // Horizontal balcony bands on each tower
        addbox(8.4, 0.5, 8.4, 0x999999, -90, 8, 120);
        addbox(8.4, 0.5, 8.4, 0x999999, -90, 16, 120);
        addbox(8.4, 0.5, 8.4, 0x999999, -90, 24, 120);
        addbox(8.4, 0.5, 8.4, 0x999999, -75, 8, 130);
        addbox(8.4, 0.5, 8.4, 0x999999, -75, 16, 130);
        addbox(8.4, 0.5, 8.4, 0x999999, -75, 24, 130);
        addbox(8.4, 0.5, 8.4, 0x999999, -60, 8, 115);
        addbox(8.4, 0.5, 8.4, 0x999999, -60, 16, 115);
        addbox(8.4, 0.5, 8.4, 0x999999, -60, 24, 115);

        // --- 6. Old Royal Military Academy (Baroque facade) ---
        // Main building body
        addbox(25, 9, 15, 0xCCBBA0, 90, 4.5, -10);
        // Central projecting portico
        addbox(10, 11, 4, 0xCCBBA0, 90, 5.5, -17.5);
        // Baroque pediment (triangular top — simulated with a low cone)
        addcone(5.5, 3, 0xBBAA90, 90, 12.5, -17.5);
        // Wing extensions
        addbox(6, 7, 15, 0xCCBBA0, 71.5, 3.5, -10);
        addbox(6, 7, 15, 0xCCBBA0, 108.5, 3.5, -10);
        // Decorative dome atop centre
        addsphere(2.5, 0xBBAA90, 90, 15, -17.5);

        // --- 7. Arsenal pub (converted Victorian pub) ---
        addbox(10, 6, 8, 0x2A4A2A, -95, 3, -45);
        // Bay window protrusion
        addbox(3, 4, 1, 0x3A5A3A, -95, 2.5, -49.5);
        // Pub sign board
        addbox(4, 1.5, 0.2, 0xFFDD00, -95, 7.5, -49.6);
        // Chimney stack
        addbox(1.2, 3, 1.2, 0x2A4A2A, -92, 8.5, -44);
        addcylinder(0.4, 0.5, 1, 0x1A3A1A, -92, 10.5, -44);

        // --- 8. Ammunition storage vaults (4 thick-walled brick vaults) ---
        var vaultX = [-55, -40, -25, -10];
        for (i = 0; i < vaultX.length; i++) {
            // Main vault body
            addbox(12, 5, 8, 0x8B4433, vaultX[i], 2.5, 55);
            // Arched roof — a cylinder on top to simulate barrel vault
            addcylinder(4, 4, 12, 0x7A3322, vaultX[i], 6.5, 55);
        }

        // --- 9. Dock cranes (2 cranes) ---
        // Crane 1
        addbox(2, 14, 2, 0x334444, 50, 7, 70);          // vertical mast
        addbox(12, 2, 2, 0x334444, 56, 14, 70);          // horizontal arm (extends right)
        addbox(0.4, 6, 0.4, 0x334444, 62, 11, 70);       // hoist cable/rod
        addcylinder(0.5, 0.5, 2, 0x223333, 62, 8, 70);   // hook block
        // Crane 2
        addbox(2, 14, 2, 0x334444, 75, 7, 68);           // vertical mast
        addbox(12, 2, 2, 0x334444, 81, 14, 68);          // horizontal arm (extends right)
        addbox(0.4, 6, 0.4, 0x334444, 87, 11, 68);       // hoist cable/rod
        addcylinder(0.5, 0.5, 2, 0x223333, 87, 8, 68);   // hook block

        // --- Wire outlines for key structures (LineSegments) ---
        // Arsenal building outlines
        addwire(20, 7, 12, 0x6B2A1A, -60, 3.5, -30);
        addwire(20, 7, 12, 0x6B2A1A, 65, 3.5, -30);
        // Station canopy outline
        addwire(35, 2, 12, 0x667788, 0, 8, -65);
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
