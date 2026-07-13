window.ExmouthSandy = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 9480;
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

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var i, angle, px, pz, mesh;

        // 1. Sandy beach — 100x0.5x30, golden sand
        makebox(100, 0.5, 30, 0xF5E080, 0, 0.25, 0);

        // 2. Exe Estuary mouth — 80x0.5x40, tidal blue
        makebox(80, 0.5, 40, 0x1A3366, 0, 0.0, -50);

        // 3. A La Ronde — 16-sided house approximated
        // Main cylinder body 7r x 8h
        makecyl(7, 7, 8, 16, 0xEEDDBB, 60, 4, -20);
        // Cone roof 6r x 5h
        makecone(6, 5, 16, 0x554433, 60, 10.5, -20);
        // 8 alternating box panels around the cylinder
        for (i = 0; i < 8; i++) {
            angle = (i / 8) * Math.PI * 2;
            px = 60 + Math.cos(angle) * 7.2;
            pz = -20 + Math.sin(angle) * 7.2;
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(2, 8, 0.4),
                new THREE.MeshLambertMaterial({ color: 0xEEDDBB })
            );
            mesh.position.set(OX + px, 4, OZ + pz);
            mesh.rotation.y = angle;
            scene.add(mesh);
            objects.push(mesh);
        }

        // 4. Exmouth Marina
        // Long pontoon
        makebox(40, 0.5, 5, 0x778888, -30, 0.25, -45);
        // Breakwater arm
        makebox(25, 2, 3, 0x556677, -55, 1, -35);
        // 12 sailing yachts: hull + mast
        for (i = 0; i < 12; i++) {
            px = -45 + i * 3.5;
            pz = -48;
            // hull
            makebox(5, 1, 2, 0xCCCCBB, px, 1, pz);
            // mast
            makecyl(0.2, 0.2, 9, 6, 0xBBBBBB, px, 6, pz);
        }

        // 5. Exmouth town — Georgian seafront 10 buildings
        for (i = 0; i < 10; i++) {
            var bcolor = (i % 2 === 0) ? 0xEEDDBB : 0xCCBBAA;
            makebox(5, 6, 7, bcolor, -45 + i * 9, 3, 20);
        }
        // Esplanade promenade
        makebox(80, 0.3, 5, 0x998866, 0, 0.15, 14);

        // 6. Watersports centre — beach hut cluster 4 buildings
        var hcolors = [0x4488CC, 0xFF8844, 0x4488CC, 0xFF8844];
        for (i = 0; i < 4; i++) {
            makebox(5, 4, 3, hcolors[i], -20 + i * 7, 2, -5);
        }
        // Equipment racks: kiteboard shapes (2 sets)
        for (i = 0; i < 3; i++) {
            makebox(0.3, 1.8, 0.8, 0x553322, -20 + i * 3, 1.9, -8);
            makebox(0.2, 0.2, 2, 0x553322, -20 + i * 3, 2.8, -8);
        }

        // 7. Orcombe Point — red sandstone cliff
        makebox(15, 20, 8, 0xBB4422, 70, 10, 10);
        // Geoneedle monument: cylinder base + sphere top
        makecyl(0.3, 0.3, 4, 8, 0x888870, 70, 22, 8);
        makesphere(0.4, 8, 8, 0x888870, 70, 24.4, 8);

        // 8. Lifeboat station — RNLI
        makebox(8, 5, 5, 0xFF8800, 20, 2.5, 20);
        makebox(4, 2, 5, 0x0044BB, 24, 1, 20);
        // Boat launch ramp
        makebox(3, 0.3, 10, 0x888888, 28, 0.15, 20);
        // Ramp piles (4 cylinders)
        for (i = 0; i < 4; i++) {
            makecyl(0.2, 0.2, 1.5, 6, 0x666666, 26 + i * 2, 0.75, 18);
        }

        // 9. Ferris wheel — amusement
        // Two support cylinders
        makecyl(0.5, 0.5, 12, 8, 0x4488CC, -10, 6, 25);
        makecyl(0.5, 0.5, 12, 8, 0x4488CC, -4, 6, 25);
        // Wheel outline (wide flat cylinder)
        mesh = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 0.5, 16),
            new THREE.MeshLambertMaterial({ color: 0x4488CC })
        );
        mesh.position.set(OX + -7, 14, OZ + 25);
        mesh.rotation.x = Math.PI / 2;
        scene.add(mesh);
        objects.push(mesh);
        // 8 gondola boxes around rim
        for (i = 0; i < 8; i++) {
            angle = (i / 8) * Math.PI * 2;
            px = -7 + Math.cos(angle) * 8;
            var py = 14 + Math.sin(angle) * 8;
            makebox(0.8, 0.8, 0.8, 0xFFDD44, px, py, 25);
        }

        // 10. Beach volleyball net
        // Two posts
        makecyl(0.2, 0.2, 3, 6, 0xEEEEEE, -8, 1.5, 5);
        makecyl(0.2, 0.2, 3, 6, 0xEEEEEE, 4, 1.5, 5);
        // Net box
        makebox(12, 0.15, 1, 0xEEEEEE, -2, 3, 5);
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
