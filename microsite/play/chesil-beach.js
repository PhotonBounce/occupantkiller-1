window.CheslBeach = (function() {
    'use strict';

    var OFFSET_X = 3840;
    var OFFSET_Z = 2200;
    var objects = [];
    var scene = null;

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, mat);
    }

    function addMesh(mesh, x, y, z) {
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildRidge() {
        var i, j, mesh, geo;
        for (i = 0; i < 80; i++) {
            for (j = 0; j < 4; j++) {
                geo = new THREE.BoxGeometry(1, 3, 1);
                mesh = makeMesh(geo, 0x9E9E9E);
                addMesh(mesh, i * 1.1, 1.5, j * 1.1);
            }
        }
    }

    function buildGradedPebbles() {
        var i, height, geo, mesh;
        for (i = 0; i < 40; i++) {
            height = 0.5 + (i / 40) * 2.5;
            geo = new THREE.BoxGeometry(1.2, height, 1.2);
            mesh = makeMesh(geo, 0x7E7E7E);
            addMesh(mesh, i * 2.2 + 1, height / 2, -2);
        }
    }

    function buildFleetLagoon() {
        var geo, mesh;
        geo = new THREE.BoxGeometry(88, 0.4, 22);
        mesh = makeMesh(geo, 0x3CB371);
        addMesh(mesh, 43, 0.2, -16);
    }

    function buildWeymouthBay() {
        var geo, mesh;
        geo = new THREE.BoxGeometry(120, 0.4, 30);
        mesh = makeMesh(geo, 0x1E90FF);
        addMesh(mesh, 40, 0.2, 20);
    }

    function buildLighthouse() {
        var i, geo, mesh;
        for (i = 0; i < 18; i++) {
            geo = new THREE.BoxGeometry(3, 1, 3);
            if (i === 6 || i === 7) {
                mesh = makeMesh(geo, 0xFF2222);
            } else {
                mesh = makeMesh(geo, 0xFFFFFF);
            }
            addMesh(mesh, 90, i + 0.5, 2);
        }
        geo = new THREE.CylinderGeometry(1.8, 1.8, 1, 8);
        mesh = makeMesh(geo, 0xFFDD00);
        addMesh(mesh, 90, 18.5, 2);
    }

    function buildSwannery() {
        var i, angle, sx, sz, geo, mesh;
        geo = new THREE.BoxGeometry(8, 3, 6);
        mesh = makeMesh(geo, 0xC8A878);
        addMesh(mesh, -40, 1.5, -20);

        geo = new THREE.BoxGeometry(6, 0.3, 6);
        mesh = makeMesh(geo, 0x3CB371);
        addMesh(mesh, -40, 0.15, -12);

        for (i = 0; i < 6; i++) {
            angle = (i / 6) * Math.PI * 2;
            sx = Math.cos(angle) * 4;
            sz = Math.sin(angle) * 4;
            geo = new THREE.BoxGeometry(1, 1, 2);
            mesh = makeMesh(geo, 0xFFFFFF);
            addMesh(mesh, -40 + sx, 0.5, -12 + sz);
            geo = new THREE.SphereGeometry(0.6, 6, 6);
            mesh = makeMesh(geo, 0xFFFFFF);
            addMesh(mesh, -40 + sx, 1.3, -12 + sz);
        }
    }

    function buildChapel() {
        var geo, mesh;
        geo = new THREE.BoxGeometry(5, 6, 7);
        mesh = makeMesh(geo, 0x808080);
        addMesh(mesh, -60, 3, -40);

        geo = new THREE.BoxGeometry(2, 4, 2);
        mesh = makeMesh(geo, 0x808080);
        addMesh(mesh, -60, 8, -41);

        geo = new THREE.ConeGeometry(1.5, 3, 4);
        mesh = makeMesh(geo, 0x505050);
        addMesh(mesh, -60, 12.5, -41);

        geo = new THREE.BoxGeometry(6, 1, 8);
        mesh = makeMesh(geo, 0x6A6A6A);
        addMesh(mesh, -60, 0.5, -40);
    }

    function buildPortlandCastle() {
        var i, geo, mesh;
        geo = new THREE.BoxGeometry(16, 5, 14);
        mesh = makeMesh(geo, 0xD2B48C);
        addMesh(mesh, 80, 2.5, -10);

        geo = new THREE.BoxGeometry(8, 8, 8);
        mesh = makeMesh(geo, 0xC8A882);
        addMesh(mesh, 80, 4, -10);

        for (i = 0; i < 4; i++) {
            geo = new THREE.BoxGeometry(3, 4, 3);
            mesh = makeMesh(geo, 0xD2B48C);
            var cx = (i % 2 === 0) ? 70 : 90;
            var cz = (i < 2) ? -16 : -4;
            addMesh(mesh, cx, 6, cz);

            geo = new THREE.BoxGeometry(1, 1, 2);
            mesh = makeMesh(geo, 0x4A4A4A);
            addMesh(mesh, cx, 8.5, cz);
        }

        geo = new THREE.BoxGeometry(3, 4, 16);
        mesh = makeMesh(geo, 0xD2B48C);
        addMesh(mesh, 66, 2, -10);
    }

    function buildVisitorCentre() {
        var geo, mesh;
        geo = new THREE.BoxGeometry(12, 4, 8);
        mesh = makeMesh(geo, 0xB0C4DE);
        addMesh(mesh, 10, 2, -30);

        geo = new THREE.BoxGeometry(14, 0.5, 9);
        mesh = makeMesh(geo, 0x8090A0);
        addMesh(mesh, 10, 4.25, -30);

        geo = new THREE.BoxGeometry(2, 4, 0.2);
        mesh = makeMesh(geo, 0x8B7355);
        addMesh(mesh, 14, 2, -30);

        geo = new THREE.BoxGeometry(10, 2, 0.2);
        mesh = makeMesh(geo, 0x4169E1);
        addMesh(mesh, 10, 3, -34.1);

        geo = new THREE.BoxGeometry(3, 2, 0.2);
        mesh = makeMesh(geo, 0x228B22);
        addMesh(mesh, 16, 3, -34.1);
    }

    function buildPulpitRock() {
        var geo, mesh;
        geo = new THREE.BoxGeometry(3, 8, 3);
        mesh = makeMesh(geo, 0x808080);
        addMesh(mesh, 100, 4, 5);

        geo = new THREE.BoxGeometry(3, 8, 3);
        mesh = makeMesh(geo, 0x808080);
        addMesh(mesh, 100, 4, -1);

        geo = new THREE.BoxGeometry(3, 3, 9);
        mesh = makeMesh(geo, 0x707070);
        addMesh(mesh, 100, 9.5, 2);

        geo = new THREE.BoxGeometry(5, 5, 11);
        mesh = makeMesh(geo, 0x909090);
        addMesh(mesh, 100, 2.5, 2);

        geo = new THREE.BoxGeometry(2, 2, 5);
        mesh = makeMesh(geo, 0x101010);
        addMesh(mesh, 100, 2.5, 2);
    }

    function buildGroundBase() {
        var geo, mesh;
        geo = new THREE.BoxGeometry(260, 0.5, 100);
        mesh = makeMesh(geo, 0xB8A898);
        addMesh(mesh, 30, -0.25, -5);
    }

    function init(sceneRef) {
        scene = sceneRef;
        objects = [];

        buildGroundBase();
        buildRidge();
        buildGradedPebbles();
        buildFleetLagoon();
        buildWeymouthBay();
        buildLighthouse();
        buildSwannery();
        buildChapel();
        buildPortlandCastle();
        buildVisitorCentre();
        buildPulpitRock();
    }

    function update(delta) {
        void delta;
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (scene) {
                scene.remove(objects[i]);
            }
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
        scene = null;
    }

    return { init: init, update: update, reset: reset };
}());
