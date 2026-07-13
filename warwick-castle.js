window.WarwickCastle = (function() {
    'use strict';

    var WX = 3100;
    var WZ = 2200;

    function makeMesh(geometry, color, scene) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        scene.add(mesh);
        return mesh;
    }

    function makeWireframe(geometry, color, scene) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), mat);
        scene.add(lines);
        return lines;
    }

    function placeBox(w, h, d, color, x, y, z, scene) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mesh = makeMesh(geo, color, scene);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function placeCylinder(rt, rb, h, segs, color, x, y, z, scene) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mesh = makeMesh(geo, color, scene);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function placeCone(r, h, segs, color, x, y, z, scene) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mesh = makeMesh(geo, color, scene);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function placeSphere(r, ws, hs, color, x, y, z, scene) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mesh = makeMesh(geo, color, scene);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildMainKeep(scene) {
        // Massive sandstone main block
        placeBox(30, 14, 20, 0xD4A97A, WX, 7, WZ, scene);

        // Battlements along the top - small merlons
        var i;
        for (i = 0; i < 6; i++) {
            placeBox(3, 2, 2, 0xC49860, WX - 12 + i * 5, 15, WZ - 10, scene);
            placeBox(3, 2, 2, 0xC49860, WX - 12 + i * 5, 15, WZ + 10, scene);
        }
        for (i = 0; i < 4; i++) {
            placeBox(2, 2, 3, 0xC49860, WX - 15, 15, WZ - 8 + i * 5, scene);
            placeBox(2, 2, 3, 0xC49860, WX + 15, 15, WZ - 8 + i * 5, scene);
        }
    }

    function buildCaesarsTower(scene) {
        // Caesar's Tower — southwest corner, taller
        placeCylinder(4, 4.5, 24, 12, 0xC8935A, WX - 18, 12, WZ - 12, scene);
        // Conical roof
        placeCone(5, 8, 12, 0x8B4513, WX - 18, 28, WZ - 12, scene);
        // Tower battlements ring
        var i;
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var tx = WX - 18 + Math.cos(angle) * 4.2;
            var tz = WZ - 12 + Math.sin(angle) * 4.2;
            placeBox(1.5, 2, 1.5, 0xC49860, tx, 25, tz, scene);
        }
    }

    function buildGuysTower(scene) {
        // Guy's Tower — northeast corner
        placeCylinder(4, 4.5, 22, 12, 0xC8935A, WX + 18, 11, WZ + 12, scene);
        // Conical roof
        placeCone(5, 8, 12, 0x8B4513, WX + 18, 26, WZ + 12, scene);
        // Tower battlements ring
        var i;
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var tx = WX + 18 + Math.cos(angle) * 4.2;
            var tz = WZ + 12 + Math.sin(angle) * 4.2;
            placeBox(1.5, 2, 1.5, 0xC49860, tx, 23, tz, scene);
        }
    }

    function buildGatehouse(scene) {
        // Connecting passage box
        placeBox(10, 12, 8, 0xBF8C6A, WX, 6, WZ + 14, scene);

        // Left drum tower
        placeCylinder(3, 3.5, 16, 10, 0xC8935A, WX - 6, 8, WZ + 18, scene);
        placeCone(4, 6, 10, 0x8B4513, WX - 6, 19, WZ + 18, scene);

        // Right drum tower
        placeCylinder(3, 3.5, 16, 10, 0xC8935A, WX + 6, 8, WZ + 18, scene);
        placeCone(4, 6, 10, 0x8B4513, WX + 6, 19, WZ + 18, scene);

        // Portcullis slot — dark recess box
        placeBox(3, 8, 1, 0x2A1A0A, WX, 5, WZ + 18, scene);

        // Gatehouse battlements
        var i;
        for (i = 0; i < 4; i++) {
            placeBox(2, 2, 2, 0xC49860, WX - 4 + i * 3, 13, WZ + 18, scene);
        }
    }

    function buildCurtainWalls(scene) {
        // North curtain wall
        placeBox(40, 8, 2, 0xBF8C6A, WX, 4, WZ - 22, scene);
        // South curtain wall
        placeBox(40, 8, 2, 0xBF8C6A, WX, 4, WZ + 24, scene);
        // East curtain wall
        placeBox(2, 8, 44, 0xBF8C6A, WX + 20, 4, WZ + 1, scene);
        // West curtain wall
        placeBox(2, 8, 44, 0xBF8C6A, WX - 20, 4, WZ + 1, scene);

        // Wall walk merlons — north wall
        var i;
        for (i = 0; i < 10; i++) {
            placeBox(2, 2, 1.5, 0xC49860, WX - 18 + i * 4, 9, WZ - 22, scene);
        }
        // Wall walk merlons — south wall
        for (i = 0; i < 10; i++) {
            placeBox(2, 2, 1.5, 0xC49860, WX - 18 + i * 4, 9, WZ + 24, scene);
        }
        // Wall walk merlons — east wall
        for (i = 0; i < 10; i++) {
            placeBox(1.5, 2, 2, 0xC49860, WX + 20, 9, WZ - 18 + i * 4, scene);
        }
        // Wall walk merlons — west wall
        for (i = 0; i < 10; i++) {
            placeBox(1.5, 2, 2, 0xC49860, WX - 20, 9, WZ - 18 + i * 4, scene);
        }
    }

    function buildMound(scene) {
        // Artificial earth mound — Ethelfleda's mound
        placeBox(14, 8, 14, 0x5A7A3A, WX - 30, 4, WZ - 10, scene);
        // Slope sides
        placeBox(18, 4, 18, 0x4A6A2A, WX - 30, 1, WZ - 10, scene);

        // Shell keep wall ring on top of mound
        var j;
        for (j = 0; j < 10; j++) {
            var ang = (j / 10) * Math.PI * 2;
            var kx = WX - 30 + Math.cos(ang) * 6;
            var kz = WZ - 10 + Math.sin(ang) * 6;
            placeBox(2.5, 4, 2.5, 0xC8935A, kx, 10, kz, scene);
        }

        // Shell keep interior well
        placeCylinder(1.5, 1.5, 3, 8, 0x5A3A2A, WX - 30, 9.5, WZ - 10, scene);
    }

    function buildRiverAvon(scene) {
        // River Avon — water boxes along cliff base (west side)
        placeBox(60, 1, 8, 0x1A6B8A, WX - 38, 0, WZ + 5, scene);
        placeBox(40, 1, 8, 0x1A6B8A, WX - 52, 0, WZ - 10, scene);
        placeBox(30, 1, 8, 0x1A6B8A, WX - 45, 0, WZ - 28, scene);

        // Riverbank — cliff base
        placeBox(4, 5, 60, 0x5A4A2A, WX - 25, 2.5, WZ + 5, scene);

        // Water shimmer highlights
        placeBox(50, 0.5, 4, 0x2A8BAA, WX - 38, 0.7, WZ + 3, scene);
    }

    function buildTrebuchet(scene) {
        // Trebuchet on north battlement
        var tx = WX + 10;
        var ty = 9;
        var tz = WZ - 22;

        // Base frame — two uprights
        placeBox(1, 5, 1, 0x5A3A1A, tx - 1, ty + 2.5, tz, scene);
        placeBox(1, 5, 1, 0x5A3A1A, tx + 1, ty + 2.5, tz, scene);

        // Pivot axle cylinder
        placeCylinder(0.4, 0.4, 3, 8, 0x4A2A0A, tx, ty + 5, tz, scene);

        // Throwing arm — long box (angled via position approximation)
        placeBox(3, 12, 2, 0x6A4A2A, tx, ty + 5, tz, scene);

        // Counterweight sphere
        placeSphere(1.5, 8, 6, 0x5A5A5A, tx, ty + 1, tz, scene);

        // Sling cup
        placeBox(1, 1, 1, 0x7A5A3A, tx, ty + 11, tz, scene);

        // Projectile stone
        placeSphere(0.5, 6, 4, 0x888888, tx, ty + 12.5, tz, scene);

        // Wheel for winching
        placeCylinder(1.2, 1.2, 0.5, 10, 0x5A3A1A, tx - 2, ty + 1, tz, scene);
    }

    function buildPeacockGarden(scene) {
        // Formal Victorian garden — southeast of castle
        var gx = WX + 30;
        var gz = WZ + 20;

        // Box hedge maze outer border
        placeBox(20, 1.5, 1, 0x2A6A2A, gx, 1, gz - 10, scene);
        placeBox(20, 1.5, 1, 0x2A6A2A, gx, 1, gz + 10, scene);
        placeBox(1, 1.5, 20, 0x2A6A2A, gx - 10, 1, gz, scene);
        placeBox(1, 1.5, 20, 0x2A6A2A, gx + 10, 1, gz, scene);

        // Inner maze hedges
        placeBox(8, 1.5, 1, 0x2A6A2A, gx - 4, 1, gz - 4, scene);
        placeBox(8, 1.5, 1, 0x2A6A2A, gx + 3, 1, gz + 4, scene);
        placeBox(1, 1.5, 8, 0x2A6A2A, gx - 4, 1, gz + 2, scene);
        placeBox(1, 1.5, 8, 0x2A6A2A, gx + 4, 1, gz - 2, scene);

        // Central fountain — cylinder basin
        placeCylinder(3, 3.5, 1, 12, 0xAA9977, gx, 0.5, gz, scene);
        // Fountain column
        placeCylinder(0.4, 0.6, 3, 8, 0xAA9977, gx, 2, gz, scene);
        // Fountain top bowl
        placeCylinder(1.2, 0.4, 0.5, 10, 0xAA9977, gx, 3.5, gz, scene);
        // Water sphere
        placeSphere(0.6, 8, 6, 0x1A6B8A, gx, 4.2, gz, scene);

        // Flower beds — colored boxes
        placeBox(3, 0.3, 3, 0xCC4444, gx - 5, 0.2, gz - 5, scene);
        placeBox(3, 0.3, 3, 0xFFAA00, gx + 5, 0.2, gz - 5, scene);
        placeBox(3, 0.3, 3, 0xCC44CC, gx - 5, 0.2, gz + 5, scene);
        placeBox(3, 0.3, 3, 0xFFFF44, gx + 5, 0.2, gz + 5, scene);

        // Peacock birds — two peacocks
        buildPeacock(gx - 7, gz - 7, scene);
        buildPeacock(gx + 7, gz + 7, scene);

        // Garden benches
        placeBox(3, 0.3, 1, 0x8B4513, gx - 8, 0.5, gz, scene);
        placeBox(3, 0.3, 1, 0x8B4513, gx + 8, 0.5, gz, scene);
        // Bench legs
        placeBox(0.3, 1, 0.8, 0x6B3510, gx - 9, 0.5, gz, scene);
        placeBox(0.3, 1, 0.8, 0x6B3510, gx - 7, 0.5, gz, scene);
    }

    function buildPeacock(px, pz, scene) {
        // Peacock body — sphere
        placeSphere(0.6, 8, 6, 0x226644, px, 0.8, pz, scene);
        // Peacock head — small sphere
        placeSphere(0.25, 6, 4, 0x114433, px, 1.55, pz, scene);
        // Neck
        placeCylinder(0.15, 0.2, 0.6, 6, 0x226644, px, 1.2, pz, scene);
        // Tail fan — cone
        placeCone(1.8, 2.5, 8, 0x44AA66, px, 0.9, pz + 0.8, scene);
        // Tail eye spots — small spheres
        placeSphere(0.2, 5, 4, 0x0044CC, px - 0.4, 1.2, pz + 1.5, scene);
        placeSphere(0.2, 5, 4, 0x0044CC, px + 0.4, 1.2, pz + 1.5, scene);
        placeSphere(0.2, 5, 4, 0x0044CC, px, 1.6, pz + 1.3, scene);
        // Legs
        placeCylinder(0.07, 0.07, 0.6, 5, 0x888844, px - 0.2, 0.3, pz, scene);
        placeCylinder(0.07, 0.07, 0.6, 5, 0x888844, px + 0.2, 0.3, pz, scene);
    }

    function buildGroundwork(scene) {
        // Courtyard ground — inner castle yard
        placeBox(36, 0.5, 40, 0x9A8060, WX, 0, WZ, scene);

        // Outer ward — grassy area
        placeBox(80, 0.5, 80, 0x4A6A2A, WX, -0.3, WZ, scene);

        // Cliff base rocky edge
        placeBox(5, 6, 80, 0x5A4A2A, WX - 24, 3, WZ, scene);

        // Drawbridge over the moat
        placeBox(6, 0.5, 5, 0x8B5E3C, WX, 0.3, WZ + 22, scene);

        // Moat — water on south approach
        placeBox(50, 1, 8, 0x1A6B8A, WX, 0, WZ + 28, scene);
    }

    function buildDecorativeDetails(scene) {
        // Flag poles on towers
        placeCylinder(0.15, 0.15, 5, 5, 0x8B5E3C, WX - 18, 34, WZ - 12, scene);
        placeCylinder(0.15, 0.15, 5, 5, 0x8B5E3C, WX + 18, 32, WZ + 12, scene);
        // Flag banners — small boxes
        placeBox(2, 1.5, 0.1, 0xCC1111, WX - 17, 36.5, WZ - 12, scene);
        placeBox(2, 1.5, 0.1, 0xCC1111, WX + 19, 34.5, WZ + 12, scene);

        // Great Hall windows — recessed dark boxes
        placeBox(2, 2, 0.5, 0x1A1A2A, WX - 8, 8, WZ - 10, scene);
        placeBox(2, 2, 0.5, 0x1A1A2A, WX, 8, WZ - 10, scene);
        placeBox(2, 2, 0.5, 0x1A1A2A, WX + 8, 8, WZ - 10, scene);

        // Butting towers along east wall
        placeCylinder(2, 2.5, 12, 8, 0xC8935A, WX + 20, 6, WZ - 10, scene);
        placeCone(2.5, 5, 8, 0x8B4513, WX + 20, 14, WZ - 10, scene);

        // Arrow slits — thin dark boxes in curtain walls
        var i;
        for (i = 0; i < 4; i++) {
            placeBox(0.5, 1.5, 0.3, 0x0A0A0A, WX - 10 + i * 7, 5, WZ - 22, scene);
        }

        // Stables building — south ward
        placeBox(12, 4, 6, 0xAA8855, WX + 10, 2, WZ - 16, scene);
        placeCylinder(0.2, 0.2, 4, 5, 0x5A3A1A, WX + 4, 4, WZ - 16, scene);
        placeCylinder(0.2, 0.2, 4, 5, 0x5A3A1A, WX + 16, 4, WZ - 16, scene);
    }

    function buildScene(scene) {
        buildGroundwork(scene);
        buildCurtainWalls(scene);
        buildMainKeep(scene);
        buildCaesarsTower(scene);
        buildGuysTower(scene);
        buildGatehouse(scene);
        buildMound(scene);
        buildRiverAvon(scene);
        buildTrebuchet(scene);
        buildPeacockGarden(scene);
        buildDecorativeDetails(scene);
    }

    return {
        buildScene: buildScene,
        worldX: WX,
        worldZ: WZ,
        name: 'Warwick Castle'
    };
}());
