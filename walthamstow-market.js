window.WalthamstowMarket = (function() {
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

    function makemesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var OX = 5480;
        var OZ = 0;
        var i, mesh, geo;

        // 1. Market stalls — 20 units in a long row, each 3×2×2.5 tall
        var stallColors = [0xCC4444, 0x4444CC, 0x44CC44];
        for (i = 0; i < 20; i++) {
            // Stall body
            geo = new THREE.BoxGeometry(3, 2, 2.5);
            mesh = makemesh(geo, 0xDDCCAA);
            mesh.position.set(OX - 30 + i * 3.5, 1, OZ + 5);

            // Awning top
            geo = new THREE.BoxGeometry(3.2, 0.3, 2.7);
            mesh = makemesh(geo, stallColors[i % 3]);
            mesh.position.set(OX - 30 + i * 3.5, 2.25, OZ + 5);
        }

        // 2. Victorian terraced houses — 3 rows of 10 houses each, 5×8×8 tall
        var rowOffsets = [20, 32, 44];
        for (var row = 0; row < 3; row++) {
            for (i = 0; i < 10; i++) {
                // House body
                geo = new THREE.BoxGeometry(5, 8, 8);
                mesh = makemesh(geo, 0x8B3A3A);
                mesh.position.set(OX - 25 + i * 5.5, 4, OZ - rowOffsets[row]);

                // Roof
                geo = new THREE.BoxGeometry(5, 1.5, 8);
                mesh = makemesh(geo, 0x2a2a2a);
                mesh.position.set(OX - 25 + i * 5.5, 8.75, OZ - rowOffsets[row]);
            }
        }

        // 3. Walthamstow Wetlands water towers — 4 cylindrical towers
        var towerPositions = [
            [OX + 80, OZ - 60],
            [OX + 92, OZ - 60],
            [OX + 80, OZ - 75],
            [OX + 92, OZ - 75]
        ];
        for (i = 0; i < 4; i++) {
            geo = new THREE.CylinderGeometry(5, 5, 20, 12);
            mesh = makemesh(geo, 0x778899);
            mesh.position.set(towerPositions[i][0], 10, towerPositions[i][1]);

            // Tower cap
            geo = new THREE.CylinderGeometry(5.5, 5.5, 1, 12);
            mesh = makemesh(geo, 0x556677);
            mesh.position.set(towerPositions[i][0], 20.5, towerPositions[i][1]);
        }

        // 4. Town Hall — 20×15×10 classical facade with 6 columns
        geo = new THREE.BoxGeometry(20, 10, 15);
        mesh = makemesh(geo, 0xD2B48C);
        mesh.position.set(OX + 10, 5, OZ - 10);

        // Pediment top
        geo = new THREE.BoxGeometry(20, 3, 15);
        mesh = makemesh(geo, 0xC4A882);
        mesh.position.set(OX + 10, 11.5, OZ - 10);

        // Town Hall columns — 6 cylinders
        var colSpacing = 3.5;
        for (i = 0; i < 6; i++) {
            geo = new THREE.CylinderGeometry(1, 1, 9, 8);
            mesh = makemesh(geo, 0xE8D5B0);
            mesh.position.set(OX + 1 + i * colSpacing, 4.5, OZ - 3);
        }

        // 5. Underground depot — 50×25×6
        geo = new THREE.BoxGeometry(50, 6, 25);
        mesh = makemesh(geo, 0x667788);
        mesh.position.set(OX - 10, 3, OZ - 100);

        // Depot roof detail
        geo = new THREE.BoxGeometry(50, 0.5, 25);
        mesh = makemesh(geo, 0x556677);
        mesh.position.set(OX - 10, 6.25, OZ - 100);

        // Depot side extension
        geo = new THREE.BoxGeometry(20, 4, 10);
        mesh = makemesh(geo, 0x778899);
        mesh.position.set(OX + 30, 2, OZ - 100);

        // 6. Pub blocks — 6 traditional pub facades, 8×6×6
        var pubPositions = [
            [OX - 60, OZ + 10],
            [OX - 45, OZ + 10],
            [OX + 60, OZ + 10],
            [OX + 75, OZ + 10],
            [OX - 60, OZ - 15],
            [OX + 60, OZ - 15]
        ];
        for (i = 0; i < 6; i++) {
            geo = new THREE.BoxGeometry(8, 6, 6);
            mesh = makemesh(geo, 0x2D4A1E);
            mesh.position.set(pubPositions[i][0], 3, pubPositions[i][1]);

            // Pub sign fascia
            geo = new THREE.BoxGeometry(8, 1, 0.3);
            mesh = makemesh(geo, 0xCC9900);
            mesh.position.set(pubPositions[i][0], 6.5, pubPositions[i][1] - 3.15);
        }

        // 7. Church — St Mary's approximation
        // Main body 15×9×10
        geo = new THREE.BoxGeometry(15, 9, 10);
        mesh = makemesh(geo, 0xBBB8A0);
        mesh.position.set(OX + 40, 4.5, OZ + 30);

        // Church nave roof
        geo = new THREE.BoxGeometry(15, 2, 10);
        mesh = makemesh(geo, 0xA8A590);
        mesh.position.set(OX + 40, 10, OZ + 30);

        // Tower — CylinderGeometry 3r × 16 tall
        geo = new THREE.CylinderGeometry(3, 3, 16, 8);
        mesh = makemesh(geo, 0xBBB8A0);
        mesh.position.set(OX + 33, 8, OZ + 28);

        // Spire — ConeGeometry 3r × 8 tall
        geo = new THREE.ConeGeometry(3, 8, 8);
        mesh = makemesh(geo, 0x8A8878);
        mesh.position.set(OX + 33, 20, OZ + 28);

        // Extra street furniture — lamp posts
        var lampX = [OX - 50, OX - 20, OX + 10, OX + 40, OX + 70];
        for (i = 0; i < 5; i++) {
            geo = new THREE.CylinderGeometry(0.2, 0.2, 7, 6);
            mesh = makemesh(geo, 0x444444);
            mesh.position.set(lampX[i], 3.5, OZ + 2);

            // Lamp head
            geo = new THREE.SphereGeometry(0.5, 6, 6);
            mesh = makemesh(geo, 0xFFFF99);
            mesh.position.set(lampX[i], 7.2, OZ + 2);
        }

        // Ground-level market canopy supports
        for (i = 0; i < 5; i++) {
            geo = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6);
            mesh = makemesh(geo, 0x888888);
            mesh.position.set(OX - 28 + i * 14, 1.25, OZ + 4);
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
