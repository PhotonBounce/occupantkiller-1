window.SalisburySpire = (function() {
    'use strict';

    var OX = 3880;
    var OZ = 2200;
    var objects = [];
    var group = null;

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(scene, r, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(0, r, h, 8, 1);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs, 1);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildclose(scene) {
        // Cathedral Close: large open green box (0x228B22 grass) surrounding cathedral, 80x80
        makebox(scene, 80, 0.3, 80, 0x228B22, 0, 0.15, 0);
    }

    function buildclosewalls(scene) {
        // The Close wall: medieval Box wall enclosing the close, 80x80 perimeter, 3 tall
        var wallH = 3;
        var halfW = 40;
        var wallT = 1.5;

        // North wall
        makebox(scene, 80, wallH, wallT, 0x999999, 0, wallH / 2, -halfW);
        // South wall
        makebox(scene, 80, wallH, wallT, 0x999999, 0, wallH / 2, halfW);
        // West wall (split for gatehouse)
        makebox(scene, 32, wallH, wallT, 0x999999, -halfW, wallH / 2, 0);
        // East wall
        makebox(scene, 32, wallH, wallT, 0x999999, halfW, wallH / 2, 0);

        // Gatehouse arch west: two pillars flanking gap
        makebox(scene, wallT, wallH + 2, wallT, 0x888888, -halfW, (wallH + 2) / 2, -6);
        makebox(scene, wallT, wallH + 2, wallT, 0x888888, -halfW, (wallH + 2) / 2, 6);
        // Arch lintel west
        makebox(scene, wallT, 1, 12, 0x888888, -halfW, wallH + 2 - 0.5, 0);

        // Gatehouse arch east: two pillars flanking gap
        makebox(scene, wallT, wallH + 2, wallT, 0x888888, halfW, (wallH + 2) / 2, -6);
        makebox(scene, wallT, wallH + 2, wallT, 0x888888, halfW, (wallH + 2) / 2, 6);
        // Arch lintel east
        makebox(scene, wallT, 1, 12, 0x888888, halfW, wallH + 2 - 0.5, 0);
    }

    function buildnave(scene) {
        // Cathedral nave: long Box body, grey limestone 0xC0C0C0, 5 high, 40 long, 14 wide
        makebox(scene, 40, 5, 14, 0xC0C0C0, 0, 2.5, 0);

        // Nave roof ridge (thin box on top)
        makebox(scene, 40, 1.5, 2, 0xA0A0A0, 0, 5 + 0.75, 0);
    }

    function buildcrossingtower(scene) {
        // Crossing tower: 6x6x12 high, dark grey 0x808080
        makebox(scene, 6, 12, 6, 0x808080, 0, 6, 0);

        // Spire: ConeGeometry 4 wide x 28 tall on top of tower
        makecone(scene, 2, 28, 0x808080, 0, 12 + 14, 0);
    }

    function buildtransepts(scene) {
        // Four transept arms: Box wings extending N/S from crossing, 12 long x 8 wide x 8 high
        // North transept
        makebox(scene, 8, 8, 12, 0xC0C0C0, 0, 4, -13);
        // South transept
        makebox(scene, 8, 8, 12, 0xC0C0C0, 0, 4, 13);
        // East arm (choir)
        makebox(scene, 16, 5, 10, 0xC0C0C0, 20, 2.5, 0);
        // West arm (nave extension)
        makebox(scene, 8, 5, 10, 0xC0C0C0, -22, 2.5, 0);
    }

    function buildchapterhouse(scene) {
        // Octagonal room: 8 Box sides arranged in octagon
        var sides = 8;
        var radius = 9;
        var wallH = 6;
        var wallW = 7;
        var wallT = 1;
        var cx = 24;
        var cz = -8;

        for (var i = 0; i < sides; i++) {
            var angle = (i / sides) * Math.PI * 2;
            var nx = cx + Math.cos(angle) * radius;
            var nz = cz + Math.sin(angle) * radius;
            var panel = makebox(scene, wallW, wallH, wallT, 0xB8B8B8, nx, wallH / 2, nz);
            panel.rotation.y = angle;
        }

        // Roof cap
        makecone(scene, 7, 5, 0x909090, cx, wallH + 2.5, cz);

        // Flying buttress brackets for chapter house
        for (var j = 0; j < 8; j++) {
            var ba = (j / 8) * Math.PI * 2;
            var bx = cx + Math.cos(ba) * (radius + 3);
            var bz = cz + Math.sin(ba) * (radius + 3);
            var bpanel = makebox(scene, 0.6, 0.6, 5, 0x999999, bx, wallH * 0.6, bz);
            bpanel.rotation.y = ba;
            bpanel.rotation.z = Math.PI / 4;
        }
    }

    function buildmagnacartaroom(scene) {
        // Magna Carta exhibit: small Box room annex
        makebox(scene, 8, 4, 6, 0xD0C8B0, -26, 2, -6);
        // Door marker
        makebox(scene, 1.5, 3, 0.3, 0x5C4033, -26, 1.5, -9.15);
        // Sign plate (thin box above door)
        makebox(scene, 4, 0.5, 0.3, 0xDAA520, -26, 4.25, -9.15);
    }

    function buildriveravon(scene) {
        // River Avon: blue Box water strip 0x4169E1, east side, 80 long x 6 wide
        makebox(scene, 6, 0.2, 80, 0x4169E1, 46, 0.1, 0);
    }

    function buildbuttresses(scene) {
        // 20 flying buttresses: diagonal Box struts at 45 degrees against nave walls
        var buttressColor = 0xAAAAAA;
        var count = 10;
        var startZ = -17;
        var stepZ = 3.5;

        for (var i = 0; i < count; i++) {
            var bz = startZ + i * stepZ;

            // North side buttress
            var bn = makebox(scene, 0.7, 0.7, 7, buttressColor, -5.5, 4, bz);
            bn.rotation.z = Math.PI / 4;

            // South side buttress
            var bs = makebox(scene, 0.7, 0.7, 7, buttressColor, 5.5, 4, bz);
            bs.rotation.z = -Math.PI / 4;
        }
    }

    function buildbishopspalace(scene) {
        // Bishop's Palace: large Box manor house, red-brick 0x8B3A3A, 20x12x6 high
        makebox(scene, 20, 6, 12, 0x8B3A3A, -28, 3, 20);

        // Roof
        makebox(scene, 20, 1.5, 3, 0x6B2A2A, -28, 6 + 0.75, 20);

        // Front door
        makebox(scene, 2, 4, 0.4, 0x4A2000, -28, 2, 14.2);

        // Windows (small boxes)
        makebox(scene, 2, 1.5, 0.4, 0x87CEEB, -34, 3.5, 14.2);
        makebox(scene, 2, 1.5, 0.4, 0x87CEEB, -22, 3.5, 14.2);
        makebox(scene, 2, 1.5, 0.4, 0x87CEEB, -34, 3.5, 25.8);
        makebox(scene, 2, 1.5, 0.4, 0x87CEEB, -22, 3.5, 25.8);

        // Palace wall
        makebox(scene, 26, 2, 0.5, 0x8B3A3A, -28, 1, 10);
    }

    function buildwindows(scene) {
        // Gothic window slots on nave walls (north and south)
        var navLen = 40;
        var wColor = 0x87CEEB;
        var positions = [-16, -10, -4, 2, 8, 14];

        for (var i = 0; i < positions.length; i++) {
            var wx = positions[i];
            // North wall windows
            makebox(scene, 1.2, 2.5, 0.3, wColor, wx, 3.5, -7.15);
            // South wall windows
            makebox(scene, 1.2, 2.5, 0.3, wColor, wx, 3.5, 7.15);
        }
    }

    function buildtowerwindows(scene) {
        // Tower windows
        var twColor = 0x87CEEB;
        makebox(scene, 0.8, 1.5, 0.3, twColor, 0, 10, -3.05);
        makebox(scene, 0.8, 1.5, 0.3, twColor, 0, 10, 3.05);
        makebox(scene, 0.8, 1.5, 0.3, twColor, -3.05, 10, 0);
        makebox(scene, 0.8, 1.5, 0.3, twColor, 3.05, 10, 0);
    }

    function buildpinnacles(scene) {
        // Small pinnacles at corners of crossing tower
        var pinColor = 0x909090;
        var corners = [
            [-3, -3],
            [3, -3],
            [-3, 3],
            [3, 3]
        ];
        for (var i = 0; i < corners.length; i++) {
            var cx = corners[i][0];
            var cz = corners[i][1];
            makebox(scene, 1, 3, 1, pinColor, cx, 13.5, cz);
            makecone(scene, 0.6, 2, pinColor, cx, 15.5, cz);
        }
    }

    function buildpaththroughclose(scene) {
        // Stone paths within the close
        var pathColor = 0xD2D2D2;
        // Main path north-south
        makebox(scene, 3, 0.1, 70, pathColor, -20, 0.2, 0);
        // Path east-west
        makebox(scene, 70, 0.1, 3, pathColor, 0, 0.2, 20);
    }

    function buildtrees(scene) {
        // Decorative trees in the close (cylinder trunk + cone top)
        var treePositions = [
            [-30, -25],
            [-30, 25],
            [-15, -30],
            [15, -30],
            [-30, -10],
            [-30, 10],
            [35, -25],
            [35, 25]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz = treePositions[i][1];
            makecylinder(scene, 0.4, 0.5, 3, 6, 0x5C3317, tx, 1.5, tz);
            makecone(scene, 1.8, 4, 0x2D6A2D, tx, 5, tz);
        }
    }

    function init(scene) {
        objects = [];

        buildclose(scene);
        buildclosewalls(scene);
        buildnave(scene);
        buildcrossingtower(scene);
        buildtransepts(scene);
        buildchapterhouse(scene);
        buildmagnacartaroom(scene);
        buildriveravon(scene);
        buildbuttresses(scene);
        buildbishopspalace(scene);
        buildwindows(scene);
        buildtowerwindows(scene);
        buildpinnacles(scene);
        buildpaththroughclose(scene);
        buildtrees(scene);
    }

    function update(delta) {
        // Static environment — no animation needed
    }

    function reset(scene) {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) { objects[i].geometry.dispose(); }
            if (objects[i].material) { objects[i].material.dispose(); }
        }
        objects = [];
    }

    return { init: init, update: update, reset: reset };

}());
