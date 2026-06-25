window.CliffsOfMoher = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 17160;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, seg, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, seg);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OFFSET_X + x, y, OFFSET_Z + z);
        return mesh;
    }

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildCliffFace() {
        var sections = [
            { w: 20, h: 50, d: 12, x: 0,   y: 25,  z: 0 },
            { w: 18, h: 45, d: 10, x: 17,  y: 22.5, z: 2 },
            { w: 22, h: 48, d: 14, x: -18, y: 24,  z: -1 },
            { w: 16, h: 40, d: 10, x: 35,  y: 20,  z: 1 },
            { w: 24, h: 52, d: 12, x: -36, y: 26,  z: 0 }
        ];
        var i, s, mesh;
        for (i = 0; i < sections.length; i++) {
            s = sections[i];
            mesh = makeBox(s.w, s.h, s.d, 0x5A4A3A, s.x, s.y, s.z);
            addToScene(mesh);
        }

        var strataXPositions = [0, 17, -18, 35, -36];
        var strataYOffsets = [10, 20, 30, 40];
        var j, sx, sy;
        for (i = 0; i < strataXPositions.length; i++) {
            sx = strataXPositions[i];
            for (j = 0; j < strataYOffsets.length; j++) {
                sy = strataYOffsets[j];
                mesh = makeBox(0.5, 0.5, 20, 0x4A3A2A, sx, sy, 0);
                addToScene(mesh);
            }
        }
    }

    function buildCliffEdgeGrass() {
        var i, mesh;
        var grassPositions = [
            { x: 0,   z: -8 },
            { x: 17,  z: -8 },
            { x: -18, z: -8 },
            { x: 35,  z: -8 },
            { x: -36, z: -8 },
            { x: -10, z: -8 }
        ];
        for (i = 0; i < grassPositions.length; i++) {
            mesh = makeBox(20, 1, 8, 0x4A8A4A, grassPositions[i].x, 51, grassPositions[i].z);
            addToScene(mesh);
        }

        var barrier = makeBox(0.3, 1.5, 80, 0x888888, 0, 52, -14);
        addToScene(barrier);
    }

    function buildAtlanticOcean() {
        var i, mesh;
        var waterPositions = [
            { x: 0,   z: 30 },
            { x: 25,  z: 30 },
            { x: -25, z: 30 },
            { x: 0,   z: 50 },
            { x: 25,  z: 50 },
            { x: -25, z: 50 }
        ];
        for (i = 0; i < waterPositions.length; i++) {
            mesh = makeBox(25, 0.5, 20, 0x1A3A6A, waterPositions[i].x, 0, waterPositions[i].z);
            addToScene(mesh);
        }

        var foamPositions = [
            { x: -20, z: 14 },
            { x: -8,  z: 12 },
            { x: 5,   z: 15 },
            { x: 18,  z: 13 },
            { x: 30,  z: 14 }
        ];
        for (i = 0; i < foamPositions.length; i++) {
            mesh = makeSphere(2.5, 0xFFFFFF, foamPositions[i].x, 2, foamPositions[i].z);
            addToScene(mesh);
        }
    }

    function buildOBriensTower() {
        var tower = makeCylinder(5, 5, 14, 8, 0x888888, 60, 57, -20);
        addToScene(tower);

        var i, mesh, angle;
        for (i = 0; i < 8; i++) {
            angle = (i / 8) * Math.PI * 2;
            var bx = 60 + Math.cos(angle) * 5;
            var bz = -20 + Math.sin(angle) * 5;
            mesh = makeBox(1.5, 3, 1.5, 0x888888, bx - OFFSET_X, 65.5, bz - OFFSET_Z);
            addToScene(mesh);
        }

        var doorway = makeBox(2, 4, 0.5, 0x222222, 60, 52, -15);
        addToScene(doorway);

        var platform = makeCylinder(6, 6, 1, 8, 0x777777, 60, 64.5, -20);
        addToScene(platform);
    }

    function buildSeaStacks() {
        var stack1 = makeCylinder(5, 5, 30, 6, 0x5A4A3A, -60, 15, 40);
        addToScene(stack1);
        var foam1 = makeSphere(3, 0xEEEEEE, -60, 1, 40);
        addToScene(foam1);

        var stack2 = makeCylinder(4, 4, 25, 6, 0x5A4A3A, -45, 12.5, 55);
        addToScene(stack2);
        var foam2 = makeSphere(3, 0xEEEEEE, -45, 1, 55);
        addToScene(foam2);

        var stack3 = makeCylinder(6, 6, 20, 6, 0x5A4A3A, -75, 10, 50);
        addToScene(stack3);
        var foam3 = makeSphere(3, 0xEEEEEE, -75, 1, 50);
        addToScene(foam3);
    }

    function buildPuffinColony() {
        var puffinPositions = [
            { x: -5,  y: 35, z: -6 },
            { x: -2,  y: 38, z: -7 },
            { x: 2,   y: 30, z: -6 },
            { x: 8,   y: 33, z: -7 },
            { x: -10, y: 28, z: -6 },
            { x: 15,  y: 36, z: -7 },
            { x: 20,  y: 31, z: -6 },
            { x: -15, y: 40, z: -7 },
            { x: 25,  y: 34, z: -6 },
            { x: -20, y: 26, z: -7 },
            { x: 30,  y: 38, z: -6 },
            { x: -25, y: 32, z: -7 }
        ];
        var i, p, body, head, beak, cheek;
        for (i = 0; i < puffinPositions.length; i++) {
            p = puffinPositions[i];
            body = makeSphere(0.8, 0x111111, p.x, p.y, p.z);
            addToScene(body);

            head = makeSphere(0.5, 0x111111, p.x, p.y + 1.1, p.z);
            addToScene(head);

            beak = makeBox(0.6, 0.3, 0.8, 0xFF6600, p.x, p.y + 1.1, p.z - 0.9);
            addToScene(beak);

            cheek = makeBox(0.6, 0.5, 0.3, 0xFFFFFF, p.x, p.y + 1.0, p.z - 0.5);
            addToScene(cheek);
        }
    }

    function buildVisitorCentre() {
        var centre = makeBox(30, 8, 15, 0x888888, 80, 4, -30);
        addToScene(centre);

        var roof = makeBox(32, 2, 17, 0x3A7A3A, 80, 9, -30);
        addToScene(roof);

        var tunnel = makeBox(4, 3, 8, 0x666666, 80, 1.5, -21);
        addToScene(tunnel);

        var glass = makeBox(4, 3, 0.5, 0x87CEEB, 80, 1.5, -17);
        addToScene(glass);
    }

    function buildBurrenLandscape() {
        var pavementPositions = [
            { x: 100, z: -20 },
            { x: 120, z: -20 },
            { x: 140, z: -20 },
            { x: 100, z: -35 },
            { x: 120, z: -35 },
            { x: 140, z: -35 }
        ];
        var i, mesh;
        for (i = 0; i < pavementPositions.length; i++) {
            mesh = makeBox(20, 0.5, 15, 0xC8C0B0, pavementPositions[i].x, 0.25, pavementPositions[i].z);
            addToScene(mesh);
        }

        var boulders = [
            { r: 3,   x: 110, y: 3,   z: -25 },
            { r: 2.5, x: 130, y: 2.5, z: -28 },
            { r: 4,   x: 150, y: 4,   z: -22 }
        ];
        for (i = 0; i < boulders.length; i++) {
            mesh = makeSphere(boulders[i].r, 0xC0B8A8, boulders[i].x, boulders[i].y, boulders[i].z);
            addToScene(mesh);
        }

        var treePositions = [
            { x: 105, z: -40 },
            { x: 120, z: -42 },
            { x: 135, z: -40 },
            { x: 150, z: -43 }
        ];
        var trunk, canopy;
        for (i = 0; i < treePositions.length; i++) {
            trunk = makeCylinder(0.5, 0.7, 5, 6, 0x5A3A1A, treePositions[i].x, 2.5, treePositions[i].z);
            addToScene(trunk);

            canopy = makeSphere(4, 0x4A8A4A, treePositions[i].x, 7.5, treePositions[i].z);
            canopy.rotation.z = 0.3;
            addToScene(canopy);
        }
    }

    function build() {
        buildCliffFace();
        buildCliffEdgeGrass();
        buildAtlanticOcean();
        buildOBriensTower();
        buildSeaStacks();
        buildPuffinColony();
        buildVisitorCentre();
        buildBurrenLandscape();
    }

    function update(delta) {
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
