window.IsleWightOsborne = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(10080 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(10080 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(10080 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(10080 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        // ---- 1. Osborne House ----
        // Main range
        makebox(30, 12, 12, 0xEEDDAA, 0, 6, 0);
        // Tower left
        makebox(4, 14, 4, 0xEEDDAA, -17, 7, 0);
        makecone(3, 4, 8, 0xCC9966, -17, 16, 0);
        // Tower right
        makebox(4, 14, 4, 0xEEDDAA, 17, 7, 0);
        makecone(3, 4, 8, 0xCC9966, 17, 16, 0);
        // Loggia arcade roof box
        makebox(18, 0.4, 4, 0xDDCCAA, 0, 4.6, 8);
        // Loggia columns
        makecylinder(0.4, 0.4, 5, 8, 0xDDCCAA, -7.5, 2.5, 8);
        makecylinder(0.4, 0.4, 5, 8, 0xDDCCAA, -4.5, 2.5, 8);
        makecylinder(0.4, 0.4, 5, 8, 0xDDCCAA, -1.5, 2.5, 8);
        makecylinder(0.4, 0.4, 5, 8, 0xDDCCAA, 1.5, 2.5, 8);
        makecylinder(0.4, 0.4, 5, 8, 0xDDCCAA, 4.5, 2.5, 8);
        makecylinder(0.4, 0.4, 5, 8, 0xDDCCAA, 7.5, 2.5, 8);
        // Terrace garden
        makebox(30, 0.4, 6, 0x447730, 0, 0.2, 15);

        // ---- 2. Carisbrooke Castle ----
        // Motte (half buried)
        makesphere(12, 16, 12, 0x998866, -60, -6, -30);
        // Keep
        makebox(10, 16, 8, 0x888870, -60, 12, -30);
        // Gatehouse
        makebox(8, 10, 5, 0x888870, -50, 5, -22);
        // Curtain wall sections
        makebox(10, 5, 1, 0x888870, -65, 2.5, -20);
        makebox(10, 5, 1, 0x888870, -55, 2.5, -38);
        makebox(1, 5, 10, 0x888870, -72, 2.5, -28);
        // Drum towers
        makecylinder(3, 3, 10, 10, 0x888870, -72, 5, -22);
        makecylinder(3, 3, 10, 10, 0x888870, -72, 5, -36);

        // ---- 3. Cowes Harbour ----
        // Quayside
        makebox(30, 0.3, 5, 0x887766, 40, 0.15, 10);
        // Royal Yacht Squadron building
        makebox(14, 8, 8, 0xEEEEEE, 55, 4, 10);
        // Racing yachts - 8 yachts (hull + mast each)
        makebox(6, 1, 2, 0xFFFFFF, 30, 1.5, 18);
        makecylinder(0.2, 0.2, 10, 6, 0xCCCCCC, 30, 7, 18);
        makebox(6, 1, 2, 0xFFFFFF, 38, 1.5, 18);
        makecylinder(0.2, 0.2, 10, 6, 0xCCCCCC, 38, 7, 18);
        makebox(6, 1, 2, 0xFFEECC, 46, 1.5, 18);
        makecylinder(0.2, 0.2, 10, 6, 0xCCCCCC, 46, 7, 18);
        makebox(6, 1, 2, 0xFFFFFF, 54, 1.5, 18);
        makecylinder(0.2, 0.2, 10, 6, 0xCCCCCC, 54, 7, 18);
        makebox(6, 1, 2, 0xEEEEFF, 62, 1.5, 18);
        makecylinder(0.2, 0.2, 10, 6, 0xCCCCCC, 62, 7, 18);
        makebox(6, 1, 2, 0xFFFFCC, 70, 1.5, 18);
        makecylinder(0.2, 0.2, 10, 6, 0xCCCCCC, 70, 7, 18);
        makebox(6, 1, 2, 0xFFFFFF, 34, 1.5, 23);
        makecylinder(0.2, 0.2, 10, 6, 0xCCCCCC, 34, 7, 23);
        makebox(6, 1, 2, 0xCCEEFF, 42, 1.5, 23);
        makecylinder(0.2, 0.2, 10, 6, 0xCCCCCC, 42, 7, 23);

        // ---- 4. Solent Waters ----
        makebox(100, 0.5, 40, 0x1A3366, 0, -0.25, 40);

        // ---- 5. Car Ferry ----
        // Hull
        makebox(50, 8, 14, 0xEEEECC, 0, 4, 50);
        // Car deck row of car shapes
        makebox(3, 1.5, 2, 0xCC4444, -15, 8.75, 50);
        makebox(3, 1.5, 2, 0x4444CC, -9, 8.75, 50);
        makebox(3, 1.5, 2, 0x44CC44, -3, 8.75, 50);
        makebox(3, 1.5, 2, 0x888888, 3, 8.75, 50);
        makebox(3, 1.5, 2, 0xFFCC00, 9, 8.75, 50);
        makebox(3, 1.5, 2, 0xCCCCCC, 15, 8.75, 50);
        // Funnel
        makecylinder(2, 2, 6, 10, 0xCC4422, 18, 12, 50);
        // Bridge superstructure
        makebox(16, 4, 10, 0xDDDDBB, -5, 12, 50);

        // ---- 6. The Needles ----
        // Three chalk stacks
        makebox(2, 15, 3, 0xEEEEDD, -80, 7.5, 30);
        makebox(1, 12, 2, 0xEEEEDD, -85, 6, 32);
        makebox(1, 8, 2, 0xEEEEDD, -90, 4, 34);
        // Lighthouse (red/white striped - using two cylinders stacked)
        makecylinder(1, 1, 6, 10, 0xFFFFFF, -93, 3, 35);
        makecylinder(1, 1, 6, 10, 0xCC2222, -93, 9, 35);

        // ---- 7. Yarmouth Castle ----
        // Main fort
        makebox(15, 3, 8, 0x888870, -40, 1.5, -60);
        // Gun platform
        makebox(12, 0.5, 10, 0x777760, -40, 3.25, -60);
        // Corner bastions x4
        makebox(4, 3, 4, 0x888870, -48, 1.5, -64);
        makebox(4, 3, 4, 0x888870, -32, 1.5, -64);
        makebox(4, 3, 4, 0x888870, -48, 1.5, -56);
        makebox(4, 3, 4, 0x888870, -32, 1.5, -56);

        // ---- 8. Ventnor Town ----
        // 8 terraced buildings on southern cliff
        makebox(4, 5, 6, 0xCC9966, 60, 5, -40);
        makebox(4, 5, 6, 0xCC9966, 65, 6, -44);
        makebox(4, 5, 6, 0xCC9966, 70, 7, -48);
        makebox(4, 5, 6, 0xCC9966, 75, 8, -52);
        makebox(4, 5, 6, 0xBB8855, 80, 9, -56);
        makebox(4, 5, 6, 0xBB8855, 85, 10, -60);
        makebox(4, 5, 6, 0xCC9966, 90, 11, -64);
        makebox(4, 5, 6, 0xCC9966, 95, 12, -68);

        // ---- 9. Steam Railway ----
        // Track rail boxes
        makebox(0.2, 0.1, 40, 0x555555, -20, 0.05, -50);
        makebox(0.2, 0.1, 40, 0x555555, -18, 0.05, -50);
        // Locomotive
        makebox(4, 3, 4, 0x222222, -19, 1.5, -45);
        // Tender
        makebox(3, 2, 3, 0x222222, -19, 1, -40);
        // Havenstreet Station building
        makebox(10, 5, 4, 0x887755, -19, 2.5, -58);
        // Station platform
        makebox(12, 0.5, 3, 0xAA9977, -19, 0.25, -54);

        // ---- 10. Appuldurcombe House ----
        // Parkland
        makebox(40, 0.3, 30, 0x557730, 30, 0.15, -70);
        // Ruined facade sections (roofless shell)
        makebox(8, 10, 1, 0xEEDDAA, 18, 5, -70);
        makebox(8, 10, 1, 0xEEDDAA, 30, 5, -70);
        makebox(8, 10, 1, 0xEEDDAA, 42, 5, -70);
        // Side walls
        makebox(1, 10, 14, 0xEEDDAA, 14, 5, -70);
        makebox(1, 10, 14, 0xEEDDAA, 46, 5, -70);
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
