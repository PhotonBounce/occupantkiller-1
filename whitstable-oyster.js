window.WhitstableOyster = (function() {
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

    function addmesh(mesh) {
        objects.push(mesh);
        scene.add(mesh);
    }

    function build() {
        var WX = 6400;
        var geo, mat, mesh;

        // 1. Harbour wall
        geo = new THREE.BoxGeometry(60, 3, 2);
        mat = new THREE.MeshLambertMaterial({ color: 0xAA9988 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + 0, 1.5, -20);
        addmesh(mesh);

        // 2. Fishing boats — 4 boats with hull + cabin
        var boatColors = [0xCC4422, 0x2244CC, 0x228844, 0xCC9922];
        var boatPositions = [-24, -12, 0, 12];
        for (var b = 0; b < 4; b++) {
            var bx = WX + boatPositions[b];
            var bz = -18;
            // hull
            geo = new THREE.BoxGeometry(8, 1.5, 3);
            mat = new THREE.MeshLambertMaterial({ color: boatColors[b] });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(bx, 0.75, bz);
            addmesh(mesh);
            // cabin
            geo = new THREE.BoxGeometry(3, 1.5, 2);
            mat = new THREE.MeshLambertMaterial({ color: 0xDDCCBB });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(bx + 1, 2.25, bz);
            addmesh(mesh);
        }

        // 3. Oyster shacks — 6 weatherboard shacks 5x3x4, black tar 0x222222
        for (var s = 0; s < 6; s++) {
            geo = new THREE.BoxGeometry(5, 3, 4);
            mat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(WX - 25 + s * 6, 1.5, -8);
            addmesh(mesh);
        }

        // 4. Oyster storage tanks — 4 rectangular tanks 4x1x3, dark wet 0x334444
        for (var t = 0; t < 4; t++) {
            geo = new THREE.BoxGeometry(4, 1, 3);
            mat = new THREE.MeshLambertMaterial({ color: 0x334444 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(WX - 12 + t * 5, 0.5, -4);
            addmesh(mesh);
        }

        // 5. Whitstable beach huts — 12 huts 2.5x2x3, vivid alternating colors
        var hutColors = [
            0xFF3333, 0x3399FF, 0x33CC33, 0xFFCC00,
            0xFF6699, 0x33CCFF, 0xFF9933, 0x9933FF,
            0x33FF99, 0xFF3399, 0x99FF33, 0x3333FF
        ];
        for (var h = 0; h < 12; h++) {
            geo = new THREE.BoxGeometry(2.5, 2, 3);
            mat = new THREE.MeshLambertMaterial({ color: hutColors[h] });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(WX - 27 + h * 3, 1, 5);
            addmesh(mesh);
        }

        // 6. Beach — flat box 80x0.3x15, sand 0xF4E0A0
        geo = new THREE.BoxGeometry(80, 0.3, 15);
        mat = new THREE.MeshLambertMaterial({ color: 0xF4E0A0 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + 0, 0, 2);
        addmesh(mesh);

        // 7. Sea — flat box 80x0.3x20, 0x4488BB
        geo = new THREE.BoxGeometry(80, 0.3, 20);
        mat = new THREE.MeshLambertMaterial({ color: 0x4488BB });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + 0, 0, -13);
        addmesh(mesh);

        // 8. Neptune pub — 10x8x7, weatherboard 0x1A3A1A dark green
        geo = new THREE.BoxGeometry(10, 8, 7);
        mat = new THREE.MeshLambertMaterial({ color: 0x1A3A1A });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + 22, 4, 12);
        addmesh(mesh);

        // 9. Church (All Saints) — body 14x10x8 + tower 4x4x12 + ConeGeometry spire, flint 0xBBB8A0
        geo = new THREE.BoxGeometry(14, 10, 8);
        mat = new THREE.MeshLambertMaterial({ color: 0xBBB8A0 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX - 30, 5, 18);
        addmesh(mesh);

        geo = new THREE.BoxGeometry(4, 12, 4);
        mat = new THREE.MeshLambertMaterial({ color: 0xBBB8A0 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX - 25, 6, 18);
        addmesh(mesh);

        geo = new THREE.ConeGeometry(2.5, 6, 4);
        mat = new THREE.MeshLambertMaterial({ color: 0x888870 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX - 25, 15, 18);
        addmesh(mesh);

        // 10. Victorian high street — 10 shops 5x6x7, Victorian colors
        var shopColors = [
            0x8B3A2A, 0xCCBBAA, 0x8B3A2A, 0xCCBBAA, 0x8B3A2A,
            0xCCBBAA, 0x8B3A2A, 0xCCBBAA, 0x8B3A2A, 0xCCBBAA
        ];
        for (var sh = 0; sh < 10; sh++) {
            geo = new THREE.BoxGeometry(5, 6, 7);
            mat = new THREE.MeshLambertMaterial({ color: shopColors[sh] });
            mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(WX - 20 + sh * 6, 3, 22);
            addmesh(mesh);
        }

        // 11. Lobster pots — 8 cylinder pots CylinderGeometry r=0.8, h=0.8, 0x8B6914
        for (var lp = 0; lp < 8; lp++) {
            geo = new THREE.CylinderGeometry(0.8, 0.8, 0.8, 8);
            mat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
            mesh = new THREE.Mesh(geo, mat);
            var lpx = WX + 16 + (lp % 4) * 2;
            var lpy = 0.4 + Math.floor(lp / 4) * 0.8;
            var lpz = -16;
            mesh.position.set(lpx, lpy, lpz);
            addmesh(mesh);
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
