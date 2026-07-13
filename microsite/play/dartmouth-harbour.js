window.DartmouthHarbour = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 9080;
    var OZ = 0;

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {

        // --- 1. Royal Naval College on hill ---
        // Main block
        makebox(40, 12, 12, 0xBB5533, 0, 26, -30);
        // Central clocktower
        makebox(5, 20, 5, 0xBB5533, 0, 36, -30);
        // Clocktower slate roof
        makecone(3, 5, 0x446655, 0, 47.5, -30, 4);
        // Left wing
        makebox(15, 10, 10, 0xBB5533, -27.5, 25, -30);
        // Right wing
        makebox(15, 10, 10, 0xBB5533, 27.5, 25, -30);
        // Left wing roof ridge
        makecone(2, 3, 0x446655, -27.5, 31.5, -30, 4);
        // Right wing roof ridge
        makecone(2, 3, 0x446655, 27.5, 31.5, -30, 4);

        // --- 2. Dart estuary water ---
        makebox(80, 0.5, 40, 0x1A3366, 0, 0, 20);

        // --- 3. Dartmouth Castle ---
        // Main castle wall block
        makebox(15, 8, 12, 0x888870, -35, 4, -5);
        // Round entrance tower
        makecyl(5, 5, 14, 0x888870, -44, 7, -5, 10);
        // Tower battlements top cone
        makecone(3, 3, 0x777760, -44, 15, -5, 8);
        // Cannon port gap left
        makebox(1.5, 1.5, 0.5, 0x333322, -38, 3, -11);
        // Cannon port gap right
        makebox(1.5, 1.5, 0.5, 0x333322, -32, 3, -11);
        // Castle parapet
        makebox(15, 1.5, 1, 0x888870, -35, 8.7, -11);

        // --- 4. Bayard's Cove fort (5 semicircular sections) ---
        makebox(4, 2, 4, 0x888870, -18, 1, 5);
        makebox(4, 2, 4, 0x888870, -14, 1, 3);
        makebox(4, 2, 4, 0x888870, -10, 1, 2);
        makebox(4, 2, 4, 0x888870, -6, 1, 3);
        makebox(4, 2, 4, 0x888870, -2, 1, 5);
        // Embrasure openings (small dark boxes for gun ports)
        makebox(0.8, 0.8, 0.5, 0x222211, -18, 1, 3.2);
        makebox(0.8, 0.8, 0.5, 0x222211, -10, 1, 1.2);
        makebox(0.8, 0.8, 0.5, 0x222211, -2, 1, 3.2);

        // --- 5. Historic quayside - Bayard's Cove ---
        // Cobbled quay
        makebox(25, 0.3, 6, 0x887766, -10, 0.15, 10);
        // Bollard 1
        makecyl(0.4, 0.4, 1.5, 0x554433, -20, 0.75, 8, 8);
        // Bollard 2
        makecyl(0.4, 0.4, 1.5, 0x554433, -15, 0.75, 8, 8);
        // Bollard 3
        makecyl(0.4, 0.4, 1.5, 0x554433, -10, 0.75, 8, 8);
        // Bollard 4
        makecyl(0.4, 0.4, 1.5, 0x554433, -5, 0.75, 8, 8);
        // Historic building 1
        makebox(4, 5, 6, 0xCC9966, -20, 2.5, 15);
        // Historic building 2
        makebox(4, 5, 6, 0xDDCC99, -15, 2.5, 15);
        // Historic building 3
        makebox(4, 5, 6, 0xBBAA77, -10, 2.5, 15);
        // Historic building 4
        makebox(4, 5, 6, 0xCC9966, -5, 2.5, 15);

        // --- 6. Higher Ferry (chain ferry) ---
        // Ferry barge
        makebox(12, 1, 4, 0x778899, 15, 0.5, 18);
        // Chain guide cylinder port side
        makecyl(0.3, 0.3, 2, 0x556677, 9.5, 1.5, 18, 6);
        // Chain guide cylinder starboard side
        makecyl(0.3, 0.3, 2, 0x556677, 20.5, 1.5, 18, 6);
        // Passenger rail posts left
        makecyl(0.15, 0.15, 1.5, 0x445566, 11, 1.5, 16.5, 6);
        // Passenger rail posts right
        makecyl(0.15, 0.15, 1.5, 0x445566, 11, 1.5, 19.5, 6);
        // Passenger rail bar
        makebox(12, 0.15, 0.15, 0x445566, 15, 2.2, 16.5);

        // --- 7. Dartmouth town terraced on hillside ---
        makebox(4, 5, 6, 0xCC9966, 10, 5, -5);
        makebox(4, 5, 6, 0xDDCC99, 15, 6, -8);
        makebox(4, 5, 6, 0xBBAA77, 20, 7, -11);
        makebox(4, 5, 6, 0xCC9966, 25, 8, -14);
        makebox(4, 5, 6, 0xDDCC99, 30, 9, -17);
        makebox(4, 5, 6, 0xBBAA77, 10, 5, -12);
        makebox(4, 5, 6, 0xCC9966, 15, 6, -15);
        makebox(4, 5, 6, 0xDDCC99, 20, 7, -18);
        makebox(4, 5, 6, 0xBBAA77, 25, 8, -21);
        makebox(4, 5, 6, 0xCC9966, 30, 9, -24);

        // --- 8. The Cherub pub (medieval timber-frame) ---
        // Ground floor
        makebox(6, 5, 7, 0x887755, 5, 2.5, 13);
        // Jetted upper floor (slightly wider)
        makebox(6.5, 2, 7, 0x776644, 5, 6, 13);
        // Pub roof
        makecone(4.5, 3, 0x554433, 5, 8.5, 13, 4);
        // Hanging sign post
        makecyl(0.1, 0.1, 2, 0x554433, 2, 6, 10.5, 4);
        // Hanging sign board
        makebox(1.2, 0.6, 0.1, 0x998866, 2, 5.3, 10.5);

        // --- 9. Harbour pontoon and marina ---
        // Main pontoon
        makebox(30, 0.5, 4, 0x778888, 0, 0.25, 35);
        // Boat 1 hull
        makebox(5, 1, 2, 0xEEDDCC, -12, 0.5, 32);
        // Boat 1 mast
        makecyl(0.15, 0.15, 5, 0xBBAA99, -12, 3, 32, 6);
        // Boat 2 hull
        makebox(5, 1, 2, 0xCCDDEE, -6, 0.5, 32);
        // Boat 2 mast
        makecyl(0.15, 0.15, 5, 0xBBAA99, -6, 3, 32, 6);
        // Boat 3 hull
        makebox(5, 1, 2, 0xEECCBB, 0, 0.5, 32);
        // Boat 3 mast
        makecyl(0.15, 0.15, 5, 0xBBAA99, 0, 3, 32, 6);
        // Boat 4 hull
        makebox(5, 1, 2, 0xDDEECC, 6, 0.5, 32);
        // Boat 4 mast
        makecyl(0.15, 0.15, 5, 0xBBAA99, 6, 3, 32, 6);
        // Boat 5 hull
        makebox(5, 1, 2, 0xCCBBDD, 12, 0.5, 32);
        // Boat 5 mast
        makecyl(0.15, 0.15, 5, 0xBBAA99, 12, 3, 32, 6);
        // Boat 6 hull
        makebox(5, 1, 2, 0xBBCCEE, -12, 0.5, 38);
        // Boat 6 mast
        makecyl(0.15, 0.15, 5, 0xBBAA99, -12, 3, 38, 6);

        // --- 10. Kingswear opposite bank ---
        makebox(3, 4, 4, 0xFF6644, 55, 2, 5);
        makebox(3, 4, 4, 0x44AACC, 59, 2, 5);
        makebox(3, 4, 4, 0xFFDD44, 63, 2, 5);
        makebox(3, 4, 4, 0xFF6644, 67, 2, 5);
        makebox(3, 4, 4, 0x44AACC, 71, 2, 5);
        makebox(3, 4, 4, 0xFFDD44, 75, 2, 5);
        makebox(3, 4, 4, 0xFF6644, 79, 2, 5);
        makebox(3, 4, 4, 0x44AACC, 83, 2, 5);
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

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    return { init: init, update: update, reset: reset };
}());
