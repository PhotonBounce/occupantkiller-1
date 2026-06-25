window.StJustCape = (function() {
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
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 6);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 8480;
        var oz = 0;

        // 1. Cape Cornwall headland — 3 large granite boxes jutting seaward
        addbox(20, 8, 15, 0x777065, ox - 30, 4, oz - 60);
        addbox(15, 10, 12, 0x777065, ox - 42, 5, oz - 72);
        addbox(10, 12, 8,  0x777065, ox - 52, 6, oz - 82);

        // 2. Cape Cornwall chimney — Victorian chimney stack at headland apex
        addcylinder(1.5, 1.5, 18, 0x8B4513, ox - 50, 9, oz - 80);

        // 3. Botallack mine engine houses — 2 ruined stone towers
        addbox(5, 4, 8, 0x888870, ox - 20, 2, oz - 90);
        addcone(3, 3, 0x665544, ox - 20, 5.5, oz - 90);
        addbox(5, 4, 8, 0x888870, ox - 30, 2, oz - 100);
        addcone(3, 3, 0x665544, ox - 30, 5.5, oz - 100);

        // 4. Mine shaft headframes — 2 A-frame structures (4 boxes each, X-shape)
        addbox(0.3, 8, 0.3, 0x555544, ox - 22, 4, oz - 85);
        addbox(0.3, 8, 0.3, 0x555544, ox - 18, 4, oz - 85);
        addbox(0.3, 0.3, 8, 0x555544, ox - 20, 7.5, oz - 85);
        addbox(8, 0.3, 0.3, 0x555544, ox - 20, 7.5, oz - 85);

        addbox(0.3, 8, 0.3, 0x555544, ox - 32, 4, oz - 95);
        addbox(0.3, 8, 0.3, 0x555544, ox - 28, 4, oz - 95);
        addbox(0.3, 0.3, 8, 0x555544, ox - 30, 7.5, oz - 95);
        addbox(8, 0.3, 0.3, 0x555544, ox - 30, 7.5, oz - 95);

        // 5. St Just town square — 8 granite buildings around central square
        addbox(5, 6, 5, 0x887060, ox + 10, 3, oz + 10);
        addbox(6, 6, 5, 0x887060, ox + 18, 3, oz + 10);
        addbox(7, 6, 6, 0x887060, ox + 10, 3, oz + 18);
        addbox(5, 6, 6, 0x887060, ox + 18, 3, oz + 18);
        addbox(6, 6, 5, 0x887060, ox + 10, 3, oz - 5);
        addbox(5, 6, 5, 0x887060, ox + 18, 3, oz - 5);
        addbox(7, 6, 6, 0x887060, ox + 27, 3, oz + 10);
        addbox(6, 6, 5, 0x887060, ox + 27, 3, oz + 18);

        // War memorial obelisk in town square center
        addbox(0.8, 6, 0.8, 0x999080, ox + 18, 3, oz + 14);

        // 6. Methodist chapel
        addbox(12, 8, 10, 0x7A6A55, ox - 5, 4, oz + 14);
        // Arched windows (box approximations)
        addbox(1.2, 2, 0.2, 0x5A4A35, ox - 5, 5, oz + 9);
        addbox(1.2, 2, 0.2, 0x5A4A35, ox - 9, 5, oz + 9);
        addbox(1.2, 2, 0.2, 0x5A4A35, ox - 1, 5, oz + 9);
        // Square tower
        addbox(4, 12, 4, 0x7A6A55, ox - 13, 6, oz + 14);

        // 7. The Star Inn — low pub
        addbox(10, 6, 5, 0x6B5040, ox + 5, 3, oz - 15);
        // Low-hanging sign
        addbox(2, 0.3, 0.1, 0x4A3020, ox + 5, 6.5, oz - 12.4);
        // Small chimney
        addcylinder(0.4, 0.4, 3, 0x555555, ox + 8, 8, oz - 15);

        // 8. Cot Valley stream — 3 stone bridge arch boxes
        addbox(3, 1, 2, 0x888070, ox - 10, 0.5, oz + 35);
        addbox(3, 1, 2, 0x888070, ox - 7,  0.5, oz + 35);
        addbox(3, 1, 2, 0x888070, ox - 4,  0.5, oz + 35);

        // 9. Wind-carved gorse — 6 bush clusters (cylinder stem + sphere top)
        addcylinder(1, 1, 1.5, 0x3D7A1A, ox - 15, 0.75, oz + 5);
        addsphere(2, 0x3D7A1A, ox - 13, 2.5, oz + 4);

        addcylinder(1, 1, 1.5, 0x3D7A1A, ox - 8, 0.75, oz - 20);
        addsphere(2, 0x3D7A1A, ox - 6, 2.5, oz - 21);

        addcylinder(1, 1, 1.5, 0x3D7A1A, ox + 35, 0.75, oz - 10);
        addsphere(2, 0x3D7A1A, ox + 37, 2.5, oz - 11);

        addcylinder(1, 1, 1.5, 0x3D7A1A, ox + 40, 0.75, oz + 5);
        addsphere(2, 0x3D7A1A, ox + 42, 2.5, oz + 4);

        addcylinder(1, 1, 1.5, 0x3D7A1A, ox - 40, 0.75, oz - 5);
        addsphere(2, 0x3D7A1A, ox - 42, 2.5, oz - 4);

        addcylinder(1, 1, 1.5, 0x3D7A1A, ox + 25, 0.75, oz - 30);
        addsphere(2, 0x3D7A1A, ox + 27, 2.5, oz - 31);

        // 10. Atlantic view bench — 2 benches facing west toward Cape
        // Bench 1 seat
        addbox(2, 0.3, 0.5, 0x8B6914, ox - 20, 1.15, oz + 10);
        // Bench 1 legs
        addbox(0.2, 0.6, 0.5, 0x8B6914, ox - 21, 0.6, oz + 10);
        addbox(0.2, 0.6, 0.5, 0x8B6914, ox - 19, 0.6, oz + 10);

        // Bench 2 seat
        addbox(2, 0.3, 0.5, 0x8B6914, ox - 20, 1.15, oz + 14);
        // Bench 2 legs
        addbox(0.2, 0.6, 0.5, 0x8B6914, ox - 21, 0.6, oz + 14);
        addbox(0.2, 0.6, 0.5, 0x8B6914, ox - 19, 0.6, oz + 14);
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
