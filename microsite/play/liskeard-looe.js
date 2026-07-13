window.LiskeardLooe = (function() {
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

    function addobj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addobj(mesh);
    }

    function makecyl(r, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(r, r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addobj(mesh);
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 10, 10);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addobj(mesh);
    }

    function build() {
        var ox = 8840;
        var oz = 0;

        // 1. Looe seven-arch bridge — 7 arch sections + 14 pier cylinders
        var bridgeZ = oz + 10;
        var i;
        for (i = 0; i < 7; i++) {
            makebox(4, 3, 3.5, 0x998866, ox - 30 + i * 9, 1.5, bridgeZ);
        }
        for (i = 0; i < 14; i++) {
            makecyl(0.8, 3, 0x887755, ox - 34 + i * 4.5, 1.5, bridgeZ);
        }

        // 2. East Looe town — 8 buildings climbing hillside (stepped)
        var eastColors = [0xCC9966, 0xBB8855, 0xCC9966, 0xBB8855, 0xCC9966, 0xBB8855, 0xCC9966, 0xBB8855];
        for (i = 0; i < 8; i++) {
            makebox(4, 5, 5, eastColors[i], ox + 10 + (i % 4) * 6, 2.5 + Math.floor(i / 4) * 2, oz + 20 + Math.floor(i / 4) * 6);
        }

        // 3. West Looe town — 6 buildings on opposite bank
        for (i = 0; i < 6; i++) {
            makebox(4, 4, 4, 0xAA8844, ox - 10 - (i % 3) * 6, 2, oz + 20 + Math.floor(i / 3) * 6);
        }

        // 4. Looe Island — offshore island mound + stone buildings
        makesphere(12, 0x447733, ox + 60, 2, oz - 40);
        makebox(4, 3, 4, 0x887766, ox + 58, 14, oz - 38);
        makebox(4, 3, 4, 0x887766, ox + 64, 14, oz - 42);

        // 5. Fishing harbour — stone quay
        makebox(20, 1.5, 2, 0x888870, ox + 5, 0.75, oz + 5);
        // 5 fishing boats: hull + mast
        for (i = 0; i < 5; i++) {
            makebox(4, 1, 2, 0x556677, ox - 5 + i * 5, 0.5, oz + 3);
            makecyl(0.15, 5, 0x885533, ox - 5 + i * 5, 3, oz + 3);
        }
        // lobster pot stacks — 8 small boxes in 2 clusters
        for (i = 0; i < 8; i++) {
            makebox(0.5, 0.5, 0.5, 0x887755, ox + 12 + (i % 4) * 0.7, 0.25 + Math.floor(i / 4) * 0.5, oz + 4 + Math.floor(i / 4) * 1.5);
        }

        // 6. Liskeard town — 6 Georgian buildings + town hall + clock tower
        for (i = 0; i < 6; i++) {
            makebox(6, 5, 7, 0xBBAA88, ox - 50 + (i % 3) * 10, 2.5, oz - 20 + Math.floor(i / 3) * 10);
        }
        // town hall
        makebox(14, 10, 10, 0xBBAA88, ox - 60, 5, oz - 30);
        // clock tower
        makebox(4, 14, 4, 0xBBAA88, ox - 60, 17, oz - 30);

        // 7. Stuart House — Tudor merchant's house + timber frame strips
        makebox(8, 6, 7, 0x776655, ox - 45, 3, oz - 45);
        for (i = 0; i < 5; i++) {
            makebox(0.2, 6, 0.1, 0x443322, ox - 47 + i * 2, 3, oz - 41.5);
        }

        // 8. Shark angling club — waterfront building + trophy shark jaw
        makebox(6, 4, 4, 0x4477AA, ox + 20, 2, oz + 2);
        makesphere(1, 0xCCCCCC, ox + 20, 7, oz + 2);
        makebox(1.5, 0.3, 0.8, 0xCCCCCC, ox + 20, 5.7, oz + 2);

        // 9. Tidal estuary — flat water + exposed mud banks
        makebox(60, 0.5, 30, 0x336688, ox - 5, 0, oz + 12);
        makebox(15, 0.3, 8, 0x9A8A70, ox - 15, 0.15, oz + 8);
        makebox(15, 0.3, 8, 0x9A8A70, ox + 10, 0.15, oz + 18);

        // 10. Shark angling boat — larger vessel + fighting chair + outrigger poles
        makebox(8, 2, 3, 0x223355, ox + 30, 1, oz + 5);
        // fighting chair seat
        makebox(0.6, 1, 0.6, 0x443322, ox + 29, 2.5, oz + 5);
        // fighting chair back
        makebox(0.5, 0.8, 0.1, 0x443322, ox + 29, 3.1, oz + 4.7);
        // outrigger poles
        makecyl(0.1, 6, 0x888855, ox + 28, 4, oz + 5);
        makecyl(0.1, 6, 0x888855, ox + 32, 4, oz + 5);
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
