window.TorquayRiviera = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 9160;
    var OZ = 0;

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
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 10);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        // 1. Torquay Harbour — stone pier and inner quay
        // Main stone pier arm
        makebox(30, 2, 3, 0x888870, 0, 1, -30);
        // Inner harbour quay
        makebox(25, 1.5, 2.5, 0x888870, 10, 0.75, -10);
        // Harbour light — cylinder mast
        makecyl(0.5, 0.5, 6, 0x888870, 14, 4, -8);
        // Harbour light — sphere cap
        makesphere(0.7, 0xFFFF88, 14, 7.5, -8);

        // 2. Marina boats — 8 pleasure yachts
        var boatPositions = [
            [-8, -20], [-2, -20], [4, -20], [10, -20],
            [-8, -24], [-2, -24], [4, -24], [10, -24]
        ];
        for (var b = 0; b < boatPositions.length; b++) {
            var bx = boatPositions[b][0];
            var bz = boatPositions[b][1];
            // Hull
            makebox(5, 1, 2, 0xF5F0DC, bx, 0.5, bz);
            // Mast
            makecyl(0.2, 0.2, 8, 0xEEEEEE, bx, 5, bz);
            // Boom
            makebox(4, 0.1, 0.1, 0xEEEEEE, bx, 3.5, bz);
        }

        // 3. Imperial Hotel — grand Victorian clifftop hotel
        // Main building body
        makebox(35, 12, 14, 0xEEDDBB, 0, 6, 30);
        // Ornate facade columns x4
        makecyl(0.5, 0.5, 10, 0xDDCCAA, -13, 5, 24);
        makecyl(0.5, 0.5, 10, 0xDDCCAA, -4, 5, 24);
        makecyl(0.5, 0.5, 10, 0xDDCCAA, 5, 5, 24);
        makecyl(0.5, 0.5, 10, 0xDDCCAA, 14, 5, 24);
        // Wide veranda
        makebox(35, 0.5, 4, 0xCCBB99, 0, 0.25, 22);
        // Window boxes — row of small boxes on facade
        for (var w = 0; w < 6; w++) {
            makebox(2.5, 1.5, 0.3, 0xDDCCBB, -12.5 + w * 5, 8, 23.1);
        }
        for (var w2 = 0; w2 < 6; w2++) {
            makebox(2.5, 1.5, 0.3, 0xDDCCBB, -12.5 + w2 * 5, 4, 23.1);
        }

        // 4. Torre Abbey — medieval abbey ruin
        // L-shaped ruined walls — long arm
        makebox(20, 1.5, 6, 0x888870, -60, 0.75, 20);
        // L-shaped ruined walls — short arm
        makebox(10, 1.5, 6, 0x888870, -70, 0.75, 8);
        // Gatehouse
        makebox(8, 5, 10, 0x888870, -60, 2.5, 14);
        // Tithe barn
        makebox(25, 8, 7, 0x997755, -60, 4, 35);

        // 5. Kents Cavern — prehistoric cave entrance
        // Cliff face box
        makebox(5, 4, 3, 0x222222, -40, 2, -50);
        // Visitor centre
        makebox(10, 6, 5, 0xBBAA88, -30, 3, -50);

        // 6. Torquay seafront promenade
        // Prom deck
        makebox(60, 0.3, 5, 0x998866, 30, 0.15, 0);
        // Palm trees x4 along prom
        var palmPositions = [10, 20, 30, 40];
        for (var p = 0; p < palmPositions.length; p++) {
            var px = palmPositions[p];
            // Trunk
            makecyl(0.3, 0.3, 6, 0x886644, px, 3, 0);
            // Canopy sphere
            makesphere(3, 0x225522, px, 6.5, 0);
        }

        // 7. Agatha Christie Mile — memorial statue on promenade
        // Pedestal cylinder
        makecyl(1.5, 1.5, 2, 0xB87333, 50, 1, 0);
        // Figure body box
        makebox(0.8, 1.8, 0.4, 0xB87333, 50, 3, 0);
        // Head sphere
        makesphere(0.4, 0xB87333, 50, 4.3, 0);

        // 8. Princess Pier — Victorian iron pier
        // Pier deck
        makebox(40, 0.5, 6, 0x334455, 80, 0.25, 0);
        // 8 cylinder supports
        var supportPositions = [-18, -14, -10, -6, -2, 2, 6, 10];
        for (var s = 0; s < supportPositions.length; s++) {
            makecyl(0.4, 0.4, 5, 0x334455, 80 + supportPositions[s], -2.5, 0);
        }
        // Pavilion at end of pier
        makebox(8, 6, 8, 0x445566, 98, 3, 0);

        // 9. Spanish Barn — 16th century barn
        // Barn walls
        makebox(16, 8, 8, 0x887755, -80, 4, 20);
        // Terracotta tile roof approximated by ConeGeometry
        makecone(9, 3, 0x884422, -80, 9.5, 20);

        // 10. Palm-lined harbour road — 5 road palm trees
        var roadPalmPositions = [-20, -10, 0, 10, 20];
        for (var rp = 0; rp < roadPalmPositions.length; rp++) {
            var rpx = roadPalmPositions[rp];
            // Trunk cylinder
            makecyl(0.2, 0.2, 5, 0x997755, rpx, 2.5, -5);
            // Frond cone
            makecone(3, 2, 0x226622, rpx, 6, -5);
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
