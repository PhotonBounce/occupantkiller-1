window.TotnesCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 9040;
    var OZ = 0;

    function makemesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addobj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var geo, mesh, i;

        // 1. Castle motte — rounded hill, half buried
        geo = new THREE.SphereGeometry(12, 16, 16);
        mesh = makemesh(geo, 0x6A5A30);
        mesh.position.set(OX + 0, -6, OZ + 0);
        addobj(mesh);

        // 2. Norman shell keep — circular curtain wall on motte top
        geo = new THREE.CylinderGeometry(5, 5.5, 6, 16, 1, true);
        mesh = makemesh(geo, 0x888870);
        mesh.position.set(OX + 0, 6 + 3, OZ + 0);
        addobj(mesh);

        // Merlons — 4 box teeth around the rim
        var merlanAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
        for (i = 0; i < 4; i++) {
            geo = new THREE.BoxGeometry(1, 1, 0.5);
            mesh = makemesh(geo, 0x888870);
            var ang = merlanAngles[i];
            mesh.position.set(
                OX + Math.sin(ang) * 5,
                6 + 6 + 0.5,
                OZ + Math.cos(ang) * 5
            );
            addobj(mesh);
        }

        // 3. Butterwalk arcade — 8 columns + box roof
        for (i = 0; i < 8; i++) {
            geo = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
            mesh = makemesh(geo, 0xBBAA88);
            mesh.position.set(OX - 25 + i * 3.5, 2, OZ + 20);
            addobj(mesh);
        }
        // Arcade roof
        geo = new THREE.BoxGeometry(24, 0.4, 4);
        mesh = makemesh(geo, 0xBBAA88);
        mesh.position.set(OX - 11.75, 4.2, OZ + 20);
        addobj(mesh);

        // Shop backs behind arcade — 4 shop boxes
        var shopColors = [0xCC9966, 0xBBAA77, 0x887755, 0xCC9966];
        for (i = 0; i < 4; i++) {
            geo = new THREE.BoxGeometry(5.5, 5, 3);
            mesh = makemesh(geo, shopColors[i % 4]);
            mesh.position.set(OX - 22 + i * 6, 2.5, OZ + 22.5);
            addobj(mesh);
        }

        // 4. High Street buildings — 10 varied medieval/Tudor buildings
        var buildingData = [
            { w: 4, h: 5, d: 6, color: 0xCC9966, x: -10, z: 30 },
            { w: 6, h: 5, d: 7, color: 0xBBAA77, x: -4, z: 31 },
            { w: 5, h: 5, d: 6, color: 0x887755, x: 3, z: 30 },
            { w: 4, h: 5, d: 6, color: 0xCC9966, x: 9, z: 29 },
            { w: 6, h: 5, d: 7, color: 0xBBAA77, x: 16, z: 30 },
            { w: 5, h: 5, d: 6, color: 0x887755, x: -15, z: 38 },
            { w: 4, h: 5, d: 6, color: 0xCC9966, x: -9, z: 39 },
            { w: 6, h: 5, d: 7, color: 0xBBAA77, x: -2, z: 38 },
            { w: 5, h: 5, d: 6, color: 0x887755, x: 5, z: 37 },
            { w: 4, h: 5, d: 6, color: 0xCC9966, x: 12, z: 38 }
        ];
        for (i = 0; i < buildingData.length; i++) {
            var bd = buildingData[i];
            geo = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
            mesh = makemesh(geo, bd.color);
            mesh.position.set(OX + bd.x, bd.h / 2, OZ + bd.z);
            addobj(mesh);
        }

        // 5. Brutus Stone — legendary flat stone in pavement
        geo = new THREE.BoxGeometry(1.5, 0.3, 1);
        mesh = makemesh(geo, 0x888870);
        mesh.position.set(OX + 2, 0.15, OZ + 35);
        addobj(mesh);

        // 6. River Dart — wide flat river box
        geo = new THREE.BoxGeometry(60, 0.5, 25);
        mesh = makemesh(geo, 0x336688);
        mesh.position.set(OX + 0, -0.25, OZ + 70);
        addobj(mesh);

        // Riverside walk — two bank boxes
        geo = new THREE.BoxGeometry(2, 0.3, 20);
        mesh = makemesh(geo, 0x998866);
        mesh.position.set(OX - 31, 0.15, OZ + 65);
        addobj(mesh);

        geo = new THREE.BoxGeometry(2, 0.3, 20);
        mesh = makemesh(geo, 0x998866);
        mesh.position.set(OX + 31, 0.15, OZ + 65);
        addobj(mesh);

        // 7. Steamer quay — long platform
        geo = new THREE.BoxGeometry(20, 0.5, 4);
        mesh = makemesh(geo, 0x887766);
        mesh.position.set(OX + 0, 0.25, OZ + 60);
        addobj(mesh);

        // Paddle steamer hull
        geo = new THREE.BoxGeometry(18, 3, 5);
        mesh = makemesh(geo, 0x887766);
        mesh.position.set(OX + 0, 2, OZ + 63);
        addobj(mesh);

        // Paddle wheel cylinders (port and starboard)
        geo = new THREE.CylinderGeometry(4, 4, 0.5, 12);
        mesh = makemesh(geo, 0x665544);
        mesh.position.set(OX - 9, 2.5, OZ + 63);
        mesh.rotation.z = Math.PI / 2;
        addobj(mesh);

        geo = new THREE.CylinderGeometry(4, 4, 0.5, 12);
        mesh = makemesh(geo, 0x665544);
        mesh.position.set(OX + 9, 2.5, OZ + 63);
        mesh.rotation.z = Math.PI / 2;
        addobj(mesh);

        // 8. Civic Square — Elizabethan guildhall
        geo = new THREE.BoxGeometry(12, 8, 10);
        mesh = makemesh(geo, 0xBBAA88);
        mesh.position.set(OX + 20, 4, OZ + 10);
        addobj(mesh);

        // Open arched ground floor — 6 columns
        for (i = 0; i < 6; i++) {
            geo = new THREE.CylinderGeometry(0.4, 0.4, 3, 8);
            mesh = makemesh(geo, 0xBBAA88);
            mesh.position.set(OX + 15 + i * 2, 1.5, OZ + 5);
            addobj(mesh);
        }

        // Town pump
        geo = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        mesh = makemesh(geo, 0x668866);
        mesh.position.set(OX + 20, 1, OZ + 5);
        addobj(mesh);

        // 9. Alternative shop fronts — 5 colourful small shops
        var altShopData = [
            { color: 0x88AA44, x: -30, z: 30 },
            { color: 0xFF8844, x: -24, z: 30 },
            { color: 0x4488CC, x: -18, z: 30 },
            { color: 0x88AA44, x: -30, z: 36 },
            { color: 0xFF8844, x: -24, z: 36 }
        ];
        for (i = 0; i < 5; i++) {
            var sd = altShopData[i];
            geo = new THREE.BoxGeometry(4, 4, 4);
            mesh = makemesh(geo, sd.color);
            mesh.position.set(OX + sd.x, 2, OZ + sd.z);
            addobj(mesh);

            // Hand-painted signboard
            geo = new THREE.BoxGeometry(3, 0.8, 0.1);
            mesh = makemesh(geo, 0xFFDD88);
            mesh.position.set(OX + sd.x, 4.4, OZ + sd.z - 2.05);
            addobj(mesh);
        }

        // 10. Castle walk path — stone path winding up motte
        geo = new THREE.BoxGeometry(2, 0.2, 30);
        mesh = makemesh(geo, 0x998866);
        mesh.position.set(OX + 8, 0.1, OZ + 0);
        mesh.rotation.y = 0.3;
        addobj(mesh);

        // Handrail posts
        geo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
        mesh = makemesh(geo, 0x665533);
        mesh.position.set(OX + 9, 0.6, OZ - 8);
        addobj(mesh);

        geo = new THREE.BoxGeometry(0.1, 1.2, 0.1);
        mesh = makemesh(geo, 0x665533);
        mesh.position.set(OX + 9, 0.6, OZ + 8);
        addobj(mesh);

        // Handrail box
        geo = new THREE.BoxGeometry(0.1, 0.1, 10);
        mesh = makemesh(geo, 0x665533);
        mesh.position.set(OX + 9, 1.2, OZ + 0);
        addobj(mesh);
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
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
