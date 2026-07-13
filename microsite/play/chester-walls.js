window.ChesterWalls = (function() {
    'use strict';

    var WORLD_X = 3190;
    var WORLD_Z = 2200;

    function makemat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makebox(w, h, d, color, x, y, z, parent) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makemat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, segs, color, x, y, z, parent) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makemat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z, parent) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makemat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z, parent) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makemat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        parent.add(mesh);
        return mesh;
    }

    function buildwalls(group) {
        var wx = WORLD_X;
        var wz = WORLD_Z;
        var wallcolor = 0xB05050;
        var wallH = 6;
        var wallT = 2;
        var halfW = 30;
        var halfD = 40;

        // North wall
        makebox(halfW * 2, wallH, wallT, wallcolor, wx, wallH / 2, wz - halfD, group);
        // South wall
        makebox(halfW * 2, wallH, wallT, wallcolor, wx, wallH / 2, wz + halfD, group);
        // West wall
        makebox(wallT, wallH, halfD * 2, wallcolor, wx - halfW, wallH / 2, wz, group);
        // East wall
        makebox(wallT, wallH, halfD * 2, wallcolor, wx + halfW, wallH / 2, wz, group);

        // Crenellations — north wall
        var i;
        var crenW = 2;
        var crenH = 1.5;
        var crenCount = 10;
        for (i = 0; i < crenCount; i++) {
            var cx = wx - halfW + 3 + i * 6;
            makebox(crenW, crenH, wallT, wallcolor, cx, wallH + crenH / 2, wz - halfD, group);
        }
        // Crenellations — south wall
        for (i = 0; i < crenCount; i++) {
            var scx = wx - halfW + 3 + i * 6;
            makebox(crenW, crenH, wallT, wallcolor, scx, wallH + crenH / 2, wz + halfD, group);
        }
        // Crenellations — west wall
        var crenCountZ = 13;
        for (i = 0; i < crenCountZ; i++) {
            var czz = wz - halfD + 3 + i * 6;
            makebox(wallT, crenH, crenW, wallcolor, wx - halfW, wallH + crenH / 2, czz, group);
        }
        // Crenellations — east wall
        for (i = 0; i < crenCountZ; i++) {
            var eczz = wz - halfD + 3 + i * 6;
            makebox(wallT, crenH, crenW, wallcolor, wx + halfW, wallH + crenH / 2, eczz, group);
        }

        // Corner towers
        var towerR = 3;
        var towerH = 9;
        var corners = [
            [wx - halfW, wz - halfD],
            [wx + halfW, wz - halfD],
            [wx - halfW, wz + halfD],
            [wx + halfW, wz + halfD]
        ];
        for (i = 0; i < corners.length; i++) {
            makecyl(towerR, towerR, towerH, 8, wallcolor, corners[i][0], towerH / 2, corners[i][1], group);
        }
    }

    function buildcathedral(group) {
        var cx = WORLD_X - 20;
        var cz = WORLD_Z - 20;
        var catcolor = 0xB04040;
        var stonecolor = 0xC06060;

        // Main nave body
        makebox(28, 16, 12, catcolor, cx, 8, cz, group);

        // Central tower
        makebox(8, 22, 8, catcolor, cx, 11, cz, group);
        // Tower spire
        makecone(4, 8, 8, catcolor, cx, 26, cz, group);

        // Transepts
        makebox(8, 12, 20, catcolor, cx, 6, cz, group);

        // Apse east end
        makebox(8, 12, 8, catcolor, cx + 18, 6, cz, group);

        // Cloisters garden — square of low walls
        makebox(14, 3, 1, stonecolor, cx - 18, 1.5, cz - 8, group);
        makebox(14, 3, 1, stonecolor, cx - 18, 1.5, cz + 8, group);
        makebox(1, 3, 14, stonecolor, cx - 25, 1.5, cz, group);
        makebox(1, 3, 14, stonecolor, cx - 11, 1.5, cz, group);

        // Flying buttresses — pairs along nave
        var buttcolor = 0xA03838;
        var j;
        var buttOffsets = [-4, 0, 4];
        for (j = 0; j < buttOffsets.length; j++) {
            makebox(3, 1, 1, buttcolor, cx - 15, 10, cz + buttOffsets[j], group);
            makebox(3, 1, 1, buttcolor, cx + 15, 10, cz + buttOffsets[j], group);
        }
    }

    function buildrows(group) {
        var rx = WORLD_X + 15;
        var rz = WORLD_Z + 10;
        var buildingcolor = 0xD4D4D4;
        var walkcolor = 0xBBBBBB;
        var i;
        var count = 6;
        var spacing = 9;

        for (i = 0; i < count; i++) {
            var bx = rx + i * spacing;
            // Ground floor block
            makebox(8, 8, 6, buildingcolor, bx, 4, rz, group);
        }

        // Covered first-floor walkway running the length of the row
        var walkLen = count * spacing;
        makebox(walkLen, 0.5, 3, walkcolor, rx + (walkLen / 2) - spacing / 2, 8, rz - 3, group);

        // Walkway support pillars
        for (i = 0; i < count + 1; i++) {
            var px = rx + i * spacing - spacing / 2;
            makecyl(0.3, 0.3, 4, 6, walkcolor, px, 6, rz - 4, group);
        }
    }

    function buildeasggateclock(group) {
        var ex = WORLD_X + 0;
        var ez = WORLD_Z - 40;
        var gatecolor = 0xD4A030;
        var archcolor = 0xC09020;

        // Gate arch base
        makebox(6, 10, 4, archcolor, ex, 5, ez, group);
        // Arch opening — hollow appearance via two side pillars
        makebox(2, 8, 4, gatecolor, ex - 2, 4, ez, group);
        makebox(2, 8, 4, gatecolor, ex + 2, 4, ez, group);
        // Lintel
        makebox(6, 2, 4, gatecolor, ex, 9, ez, group);

        // Clock tower above gate
        makebox(5, 5, 3, gatecolor, ex, 13, ez, group);

        // Clock face — cylinder (flat disc)
        makecyl(2, 2, 0.3, 12, 0xFFFFEE, ex, 15.5, ez - 1.7, group);

        // Gilded sphere finial
        makesphere(0.8, 8, 6, 0xFFD700, ex, 16.5, ez, group);
    }

    function buildamphitheatre(group) {
        var ax = WORLD_X + 30;
        var az = WORLD_Z + 25;
        var stonecolor = 0x9A9A8A;

        // Outer ring — box approximation (half-excavated, sits low)
        makebox(30, 3, 30, stonecolor, ax, 0, az, group);
        // Inner cut — slightly raised inner platform
        makebox(20, 2, 20, 0x7A7A6A, ax, 1.5, az, group);
        // North seating bank
        makebox(30, 4, 5, stonecolor, ax, 2, az - 15, group);
        // South seating bank
        makebox(30, 4, 5, stonecolor, ax, 2, az + 15, group);
        // West seating bank
        makebox(5, 4, 20, stonecolor, ax - 15, 2, az, group);
        // East seating bank (partially missing — half-excavated)
        makebox(5, 2, 20, stonecolor, ax + 15, 1, az, group);

        // Entry tunnels — dark box insets
        makebox(4, 3, 6, 0x555555, ax, 1, az - 12, group);
        makebox(4, 3, 6, 0x555555, ax, 1, az + 12, group);
    }

    function buildgrosvenorbridge(group) {
        var bx = WORLD_X - 35;
        var bz = WORLD_Z + 50;
        var bridgecolor = 0xD4A97A;

        // Main bridge deck
        makebox(35, 4, 6, bridgecolor, bx, 5, bz, group);

        // Single massive arch below deck centre
        makebox(20, 5, 5, bridgecolor, bx, 2, bz, group);

        // Arch supports — abutments at each end
        makebox(5, 7, 6, bridgecolor, bx - 15, 3.5, bz, group);
        makebox(5, 7, 6, bridgecolor, bx + 15, 3.5, bz, group);

        // Parapet railings
        makebox(35, 1, 0.5, bridgecolor, bx, 7.5, bz - 3, group);
        makebox(35, 1, 0.5, bridgecolor, bx, 7.5, bz + 3, group);
    }

    function build(scene) {
        var group = new THREE.Group();

        buildwalls(group);
        buildcathedral(group);
        buildrows(group);
        buildeasggateclock(group);
        buildamphitheatre(group);
        buildgrosvenorbridge(group);

        scene.add(group);
        return group;
    }

    return {
        build: build
    };
}());
