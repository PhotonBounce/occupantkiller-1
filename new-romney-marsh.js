window.NewRomneyMarsh = (function() {
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

    function build() {
        var ox = 6720;
        var oz = 0;
        var mesh, geo, mat;

        // 1. Dungeness nuclear reactor dome A — SphereGeometry 12r, hemisphere via Y scale 0.5
        geo = new THREE.SphereGeometry(12, 16, 16);
        mat = new THREE.MeshLambertMaterial({ color: 0x778888 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.scale.y = 0.5;
        mesh.position.set(ox + 0, 6, oz + 0);
        scene.add(mesh);
        objects.push(mesh);

        // 2. Dungeness reactor building B — BoxGeometry 20x12x20
        geo = new THREE.BoxGeometry(20, 12, 20);
        mat = new THREE.MeshLambertMaterial({ color: 0x778888 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox + 25, 6, oz + 0);
        scene.add(mesh);
        objects.push(mesh);

        // 3. Power station chimney stacks — 2 tall cylinders
        geo = new THREE.CylinderGeometry(3, 3, 30, 12);
        mat = new THREE.MeshLambertMaterial({ color: 0x888880 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox + 18, 15, oz - 10);
        scene.add(mesh);
        objects.push(mesh);

        geo = new THREE.CylinderGeometry(3, 3, 30, 12);
        mat = new THREE.MeshLambertMaterial({ color: 0x888880 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox + 30, 15, oz - 10);
        scene.add(mesh);
        objects.push(mesh);

        // 4. Shingle beach landscape — flat box 80x0.3x30
        geo = new THREE.BoxGeometry(80, 0.3, 30);
        mat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox + 0, 0, oz + 25);
        scene.add(mesh);
        objects.push(mesh);

        // 5. Sea — 80x0.3x20
        geo = new THREE.BoxGeometry(80, 0.3, 20);
        mat = new THREE.MeshLambertMaterial({ color: 0x4488BB });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox + 0, 0, oz + 50);
        scene.add(mesh);
        objects.push(mesh);

        // 6. Dungeness lighthouse — cylinder + cone cap + white band box
        geo = new THREE.CylinderGeometry(3, 3, 20, 12);
        mat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox - 30, 10, oz + 10);
        scene.add(mesh);
        objects.push(mesh);

        geo = new THREE.ConeGeometry(3.5, 4, 12);
        mat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox - 30, 22, oz + 10);
        scene.add(mesh);
        objects.push(mesh);

        geo = new THREE.BoxGeometry(7, 1.5, 7);
        mat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox - 30, 14, oz + 10);
        scene.add(mesh);
        objects.push(mesh);

        // 7. Fishing boats on shingle — 5 boats (hull + cabin each)
        var boatColors = [0x8B4513, 0x556B2F, 0x8B0000, 0x4682B4, 0x2F4F4F];
        var cabinColors = [0xD2691E, 0x6B8E23, 0xCD5C5C, 0x87CEEB, 0x708090];
        for (var b = 0; b < 5; b++) {
            var bx = ox - 35 + b * 14;
            var bz = oz + 20;

            geo = new THREE.BoxGeometry(8, 1.5, 3);
            mat = new THREE.MeshLambertMaterial({ color: boatColors[b] });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(bx, 0.75, bz);
            scene.add(mesh);
            objects.push(mesh);

            geo = new THREE.BoxGeometry(3, 1.5, 2);
            mat = new THREE.MeshLambertMaterial({ color: cabinColors[b] });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(bx + 1.5, 2.25, bz);
            scene.add(mesh);
            objects.push(mesh);
        }

        // 8. Derek Jarman's Prospect Cottage — tiny cottage 6x4x5, black + yellow windows
        geo = new THREE.BoxGeometry(6, 4, 5);
        mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox - 20, 2, oz + 15);
        scene.add(mesh);
        objects.push(mesh);

        // Yellow window frames
        geo = new THREE.BoxGeometry(1.2, 1.2, 0.2);
        mat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox - 21.5, 2.5, oz + 12.4);
        scene.add(mesh);
        objects.push(mesh);

        geo = new THREE.BoxGeometry(1.2, 1.2, 0.2);
        mat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ox - 19.0, 2.5, oz + 12.4);
        scene.add(mesh);
        objects.push(mesh);

        // 9. Power line pylons — 4 pylons: vertical + cross arm
        for (var p = 0; p < 4; p++) {
            var px = ox - 30 + p * 15;
            var pz = oz - 5;

            // Vertical beam
            geo = new THREE.BoxGeometry(0.3, 6, 0.3);
            mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(px, 3, pz);
            scene.add(mesh);
            objects.push(mesh);

            // Cross arm
            geo = new THREE.BoxGeometry(4, 0.3, 0.3);
            mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(px, 6, pz);
            scene.add(mesh);
            objects.push(mesh);
        }

        // 10. Scattered beach huts/artist studios — 6 small structures 4x3x4
        var hutColors = [0x333322, 0x442233, 0x333322, 0x442233, 0x333322, 0x442233];
        for (var h = 0; h < 6; h++) {
            var hx = ox - 38 + h * 13;
            var hz = oz + 32;

            geo = new THREE.BoxGeometry(4, 3, 4);
            mat = new THREE.MeshLambertMaterial({ color: hutColors[h] });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(hx, 1.5, hz);
            scene.add(mesh);
            objects.push(mesh);
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
