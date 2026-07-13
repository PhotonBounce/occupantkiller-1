window.PlymouthFort = (function() {
    'use strict';

    var WORLD_X = 3670;
    var WORLD_Z = 2200;

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeEdges(mesh, color) {
        var edges = new THREE.EdgesGeometry(mesh.geometry);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.copy(mesh.position);
        lines.rotation.copy(mesh.rotation);
        return lines;
    }

    function buildRoyalCitadel(scene) {
        var cx = WORLD_X + 0;
        var cz = WORLD_Z + 0;

        // Outer perimeter walls — 4 sides of the pentagon approximation
        var wallColor = 0x9A8A78;
        var wallH = 5;

        // North wall
        scene.add(makeBox(60, wallH, 3, wallColor, cx, wallH / 2, cz - 28));
        // South wall
        scene.add(makeBox(60, wallH, 3, wallColor, cx, wallH / 2, cz + 28));
        // East wall
        scene.add(makeBox(3, wallH, 56, wallColor, cx + 28, wallH / 2, cz));
        // West wall
        scene.add(makeBox(3, wallH, 56, wallColor, cx - 28, wallH / 2, cz));
        // Northwest angled wall
        var nw = makeBox(30, wallH, 3, wallColor, cx - 18, wallH / 2, cz - 20);
        nw.rotation.y = Math.PI / 6;
        scene.add(nw);

        // Inner courtyard floor
        scene.add(makeBox(50, 0.5, 50, 0x7A6A58, cx, 0.25, cz));

        // 5 bastion corners (pentagonal fort style)
        var bastionColor = 0x8A7A68;
        var bastionSize = 8;
        var bastionH = 6;
        var radius = 30;
        var i;
        for (i = 0; i < 5; i++) {
            var angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            var bx = cx + Math.cos(angle) * radius;
            var bz = cz + Math.sin(angle) * radius;
            scene.add(makeBox(bastionSize, bastionH, bastionSize, bastionColor, bx, bastionH / 2, bz));
        }

        // Garrison building inside
        scene.add(makeBox(20, 4, 10, 0x9A8A78, cx, 2, cz - 5));
        scene.add(makeBox(20, 4, 10, 0x9A8A78, cx, 2, cz + 5));

        // Guns pointing INTO the town (west-facing, toward Plymouth)
        var gunColor = 0x3A3A3A;
        var gunPositions = [
            [cx - 24, 5.5, cz - 10],
            [cx - 24, 5.5, cz],
            [cx - 24, 5.5, cz + 10]
        ];
        for (i = 0; i < gunPositions.length; i++) {
            var gp = gunPositions[i];
            var barrel = makeCylinder(0.3, 0.3, 4, 8, gunColor, gp[0], gp[1], gp[2]);
            barrel.rotation.z = Math.PI / 2;
            scene.add(barrel);
            scene.add(makeBox(1, 0.8, 1.2, 0x5A4A3A, gp[0] + 1.5, gp[1] - 0.4, gp[2]));
        }

        // Gatehouse
        scene.add(makeBox(8, 7, 4, 0x8A7A68, cx, 3.5, cz + 30));
        // Gate arch suggestion — two pillars
        scene.add(makeBox(1.5, 7, 1.5, 0x7A6A58, cx - 2.5, 3.5, cz + 30));
        scene.add(makeBox(1.5, 7, 1.5, 0x7A6A58, cx + 2.5, 3.5, cz + 30));
        // Lintel
        scene.add(makeBox(6, 1, 1.5, 0x7A6A58, cx, 7, cz + 30));
    }

    function buildSmeatonsLighthouse(scene) {
        // Smeaton's Tower on Plymouth Hoe — original Eddystone lighthouse
        var lx = WORLD_X + 50;
        var lz = WORLD_Z - 40;
        var baseY = 0;

        // Stone base plinth
        scene.add(makeBox(6, 2, 6, 0x9A8A78, lx, 1, lz));

        // Alternating red/white bands (cylinder stacked)
        var bandColors = [0xFF4040, 0xFFFFFF, 0xFF4040, 0xFFFFFF, 0xFF4040, 0xFFFFFF];
        var bandH = 2.5;
        var i;
        for (i = 0; i < bandColors.length; i++) {
            var bandY = baseY + 2 + (i * bandH) + bandH / 2;
            var topR = 2 - (i * 0.06);
            var botR = 2 - ((i - 1) * 0.06);
            if (i === 0) { botR = 2; }
            scene.add(makeCylinder(topR, botR, bandH, 12, bandColors[i], lx, bandY, lz));
        }

        // Lantern room
        var lanternY = baseY + 2 + (6 * bandH) + 1.5;
        scene.add(makeCylinder(1.8, 1.8, 3, 12, 0x888888, lx, lanternY, lz));
        // Lantern glass
        scene.add(makeCylinder(1.4, 1.4, 2.2, 12, 0xCCEEFF, lx, lanternY, lz));
        // Lantern top cone cap
        scene.add(makeCone(2, 2, 12, 0x555555, lx, lanternY + 2.5, lz));

        // Balcony ring
        scene.add(makeCylinder(2.4, 2.4, 0.3, 12, 0x666666, lx, lanternY - 1.5, lz));
    }

    function buildFrancisDrakeStatue(scene) {
        // Bronze statue of Francis Drake on Plymouth Hoe
        var sx = WORLD_X + 30;
        var sz = WORLD_Z - 50;
        var bronzeColor = 0x7A5A2A;

        // Plinth / pedestal
        scene.add(makeBox(4, 5, 4, 0x9A8A78, sx, 2.5, sz));
        scene.add(makeBox(3.5, 0.5, 3.5, 0x8A7A68, sx, 5.25, sz));

        // Figure base (boots/legs area)
        scene.add(makeCylinder(0.3, 0.35, 2.5, 6, bronzeColor, sx - 0.2, 7.25, sz));
        scene.add(makeCylinder(0.3, 0.35, 2.5, 6, bronzeColor, sx + 0.2, 7.25, sz));

        // Body (torso)
        scene.add(makeBox(1.2, 2.0, 0.7, bronzeColor, sx, 9.5, sz));

        // Cape / cloak draped back
        scene.add(makeBox(1.8, 1.8, 0.4, bronzeColor, sx, 9.0, sz + 0.3));

        // Head
        scene.add(makeSphere(0.45, 8, 6, bronzeColor, sx, 11.1, sz));

        // Hat (cone)
        scene.add(makeCone(0.5, 0.8, 8, 0x5A3A0A, sx, 11.8, sz));

        // Outstretched arm
        var arm = makeBox(1.5, 0.25, 0.25, bronzeColor, sx + 0.9, 10.2, sz);
        arm.rotation.z = -0.3;
        scene.add(arm);

        // Cannon — Drake's symbol
        scene.add(makeBox(2.5, 0.6, 0.6, 0x3A3A3A, sx + 0.5, 5.6, sz + 0.8));
        scene.add(makeBox(0.8, 0.8, 0.8, 0x3A3A3A, sx - 0.7, 5.6, sz + 0.8));
    }

    function buildPlymouthSound(scene) {
        // Plymouth Sound harbour — wide deep water
        var i;
        var waterColor = 0x1A4A7A;
        var seafloor = 0x0A2A4A;

        // Main harbour basin
        scene.add(makeBox(200, 1, 120, waterColor, WORLD_X - 80, -0.5, WORLD_Z + 80));

        // Deeper channel
        scene.add(makeBox(60, 2, 80, seafloor, WORLD_X - 60, -1.5, WORLD_Z + 100));

        // Sound breakwater/pier arms
        scene.add(makeBox(80, 2, 4, 0x8A8A8A, WORLD_X - 40, 1, WORLD_Z + 140));
        scene.add(makeBox(4, 2, 40, 0x8A8A8A, WORLD_X - 80, 1, WORLD_Z + 120));

        // Royal Navy warships at anchor
        var shipColor = 0x5A6A6A;
        var deckColor = 0x6A7A7A;
        var shipData = [
            [WORLD_X - 60, WORLD_Z + 90],
            [WORLD_X - 90, WORLD_Z + 110],
            [WORLD_X - 50, WORLD_Z + 130]
        ];

        for (i = 0; i < shipData.length; i++) {
            var sd = shipData[i];
            var shipX = sd[0];
            var shipZ = sd[1];
            // Hull
            scene.add(makeBox(30, 4, 8, shipColor, shipX, 1.5, shipZ));
            // Deck superstructure
            scene.add(makeBox(10, 3, 7, deckColor, shipX + 5, 5, shipZ));
            // Bridge tower
            scene.add(makeBox(4, 4, 4, deckColor, shipX + 5, 8.5, shipZ));
            // Funnel
            scene.add(makeCylinder(0.6, 0.8, 4, 8, 0x222222, shipX + 4, 10.5, shipZ));
            // Gun turret fore
            scene.add(makeCylinder(1.5, 1.5, 1, 8, shipColor, shipX - 8, 4.5, shipZ));
            // Gun barrel
            var turretBarrel = makeCylinder(0.2, 0.2, 5, 6, 0x222222, shipX - 8, 4.5, shipZ);
            turretBarrel.rotation.z = Math.PI / 2;
            scene.add(turretBarrel);
            // Mast
            scene.add(makeCylinder(0.15, 0.15, 12, 6, 0x8A8A8A, shipX + 5, 14, shipZ));
            // Anchor chain suggestion
            scene.add(makeCylinder(0.1, 0.1, 6, 4, 0x4A4A4A, shipX - 13, -1, shipZ));
        }
    }

    function buildMayflowerSteps(scene) {
        // Mayflower Steps — where Pilgrims departed 1620
        var mx = WORLD_X - 30;
        var mz = WORLD_Z + 55;
        var stoneColor = 0x9A8A78;

        // Steps leading down to water
        scene.add(makeBox(8, 0.4, 2, stoneColor, mx, 0.2, mz));
        scene.add(makeBox(8, 0.4, 2, stoneColor, mx, 0.6, mz - 2));
        scene.add(makeBox(8, 0.4, 2, stoneColor, mx, 1.0, mz - 4));
        scene.add(makeBox(8, 0.4, 2, stoneColor, mx, 1.4, mz - 6));

        // Stone arch monument
        // Left pillar
        scene.add(makeBox(1.5, 8, 1.5, stoneColor, mx - 3.5, 4, mz - 8));
        // Right pillar
        scene.add(makeBox(1.5, 8, 1.5, stoneColor, mx + 3.5, 4, mz - 8));
        // Arch lintel
        scene.add(makeBox(9, 1.2, 1.5, stoneColor, mx, 8.6, mz - 8));
        // Arch keystone
        scene.add(makeSphere(0.8, 6, 5, 0x8A7A68, mx, 9.5, mz - 8));

        // Memorial plaque face
        scene.add(makeBox(3, 2, 0.2, 0x7A6A58, mx, 4, mz - 8.8));

        // Surrounding bollards
        var bollardPositions = [
            [mx - 5, mz - 5], [mx - 5, mz - 10],
            [mx + 5, mz - 5], [mx + 5, mz - 10],
            [mx - 5, mz - 2], [mx + 5, mz - 2]
        ];
        var i;
        for (i = 0; i < bollardPositions.length; i++) {
            var bp = bollardPositions[i];
            scene.add(makeCylinder(0.2, 0.2, 1.5, 6, 0x6A6A6A, bp[0], 0.75, bp[1]));
        }

        // Commemorative plaque on ground
        scene.add(makeBox(4, 0.1, 3, 0x8A7A68, mx, 0.05, mz + 2));
    }

    function buildDevonportDockyard(scene) {
        // Devonport Royal Dockyard — massive naval complex
        var dx = WORLD_X - 140;
        var dz = WORLD_Z + 20;
        var buildingColor = 0x6A6A6A;
        var i;

        // Perimeter dock wall
        scene.add(makeBox(80, 4, 3, 0x7A7A7A, dx, 2, dz - 40));
        scene.add(makeBox(80, 4, 3, 0x7A7A7A, dx, 2, dz + 40));
        scene.add(makeBox(3, 4, 80, 0x7A7A7A, dx - 40, 2, dz));
        scene.add(makeBox(3, 4, 80, 0x7A7A7A, dx + 40, 2, dz));

        // Large dry dock buildings
        var buildingDefs = [
            [30, 8, 15, dx - 20, 4, dz - 20],
            [25, 6, 12, dx + 10, 3, dz - 15],
            [20, 10, 10, dx - 15, 5, dz + 15],
            [18, 5, 14, dx + 15, 2.5, dz + 20],
            [35, 7, 8,  dx,      3.5, dz]
        ];
        for (i = 0; i < buildingDefs.length; i++) {
            var bd = buildingDefs[i];
            scene.add(makeBox(bd[0], bd[1], bd[2], buildingColor, bd[3], bd[4], bd[5]));
            // Roof ridge
            scene.add(makeCone(bd[0] * 0.5, 3, 4, 0x5A5A5A, bd[3], bd[4] * 2 + 1.5, bd[5]));
        }

        // Dry docks — rectangular pits
        var dockDefs = [
            [dx - 25, dz + 30],
            [dx + 10, dz + 30]
        ];
        for (i = 0; i < dockDefs.length; i++) {
            var dd = dockDefs[i];
            // Dock floor (water/dark)
            scene.add(makeBox(20, 0.5, 50, 0x1A3A5A, dd[0], -0.25, dd[1]));
            // Dock walls
            scene.add(makeBox(20, 3, 2, 0x8A8A8A, dd[0], 1.5, dd[1] - 26));
            scene.add(makeBox(20, 3, 2, 0x8A8A8A, dd[0], 1.5, dd[1] + 26));
            scene.add(makeBox(2, 3, 50, 0x8A8A8A, dd[0] - 11, 1.5, dd[1]));
            scene.add(makeBox(2, 3, 50, 0x8A8A8A, dd[0] + 11, 1.5, dd[1]));
        }

        // Submarine pen — covered dock
        scene.add(makeBox(40, 0.5, 20, 0x0A2A3A, dx + 25, -0.25, dz - 35));
        scene.add(makeBox(40, 8, 2, 0x6A6A6A, dx + 25, 4, dz - 45));
        scene.add(makeBox(40, 8, 2, 0x6A6A6A, dx + 25, 4, dz - 25));
        scene.add(makeBox(2, 8, 20, 0x6A6A6A, dx + 5, 4, dz - 35));
        // Pen roof
        scene.add(makeBox(42, 2, 22, 0x5A5A5A, dx + 25, 9, dz - 35));

        // Submarine hull in pen
        var subColor = 0x2A3A2A;
        scene.add(makeBox(25, 3, 5, subColor, dx + 25, 1, dz - 35));
        scene.add(makeSphere(2.5, 8, 6, subColor, dx + 25 + 12, 1, dz - 35));
        // Conning tower
        scene.add(makeBox(3, 3, 3, subColor, dx + 25, 3.5, dz - 35));

        // Dockyard cranes
        var cranePositions = [
            [dx - 30, dz + 5],
            [dx + 5, dz + 5]
        ];
        for (i = 0; i < cranePositions.length; i++) {
            var cp = cranePositions[i];
            // Crane tower
            scene.add(makeCylinder(0.5, 0.8, 18, 6, 0x8A8A5A, cp[0], 9, cp[1]));
            // Crane arm
            var craneArm = makeBox(14, 0.5, 0.5, 0x8A8A5A, cp[0] + 5, 18.5, cp[1]);
            scene.add(craneArm);
        }

        // Administration building
        scene.add(makeBox(15, 12, 10, 0x8A8A78, dx - 35, 6, dz - 30));
        // Windows suggestion — darker boxes
        var winColor = 0x334455;
        var r;
        for (r = 0; r < 3; r++) {
            var winY = 3 + r * 3.5;
            scene.add(makeBox(1.5, 1.5, 0.2, winColor, dx - 38, winY, dz - 26));
            scene.add(makeBox(1.5, 1.5, 0.2, winColor, dx - 35, winY, dz - 26));
            scene.add(makeBox(1.5, 1.5, 0.2, winColor, dx - 32, winY, dz - 26));
        }

        // Flagpole
        scene.add(makeCylinder(0.1, 0.15, 15, 5, 0xAAAAAA, dx - 35, 7.5, dz - 24));
        // Flag
        scene.add(makeBox(3, 2, 0.1, 0xFF0000, dx - 33.5, 14.5, dz - 24));
    }

    function buildHoePark(scene) {
        // Plymouth Hoe — the coastal promenade area
        var hx = WORLD_X + 10;
        var hz = WORLD_Z - 60;
        var i;

        // Hoe plateau base
        scene.add(makeBox(100, 1, 40, 0x5A7A4A, hx, 0.5, hz));

        // Promenade path
        scene.add(makeBox(100, 0.2, 5, 0x9A9A8A, hx, 1.1, hz + 15));

        // Bandstand — octagonal suggestion using cylinder + cone
        scene.add(makeCylinder(5, 5, 0.4, 8, 0xCCBBAA, hx - 20, 1.2, hz - 5));
        scene.add(makeCylinder(5, 5, 2.5, 8, 0x888878, hx - 20, 2.65, hz - 5));
        scene.add(makeCone(6, 3, 8, 0x6A5A4A, hx - 20, 5.5, hz - 5));
        // Bandstand pillars
        var bAngle;
        for (i = 0; i < 8; i++) {
            bAngle = (i / 8) * Math.PI * 2;
            scene.add(makeCylinder(0.2, 0.2, 2.5, 6, 0xCCBBAA,
                hx - 20 + Math.cos(bAngle) * 4.5, 2.65, hz - 5 + Math.sin(bAngle) * 4.5));
        }

        // War memorial — tall obelisk
        scene.add(makeBox(3, 0.8, 3, 0xBBAA99, hx + 20, 1.4, hz - 10));
        scene.add(makeBox(2.5, 0.5, 2.5, 0xBBAA99, hx + 20, 2.05, hz - 10));
        scene.add(makeBox(1.5, 20, 1.5, 0xBBAA99, hx + 20, 12, hz - 10));
        scene.add(makeCone(1.2, 3, 4, 0xBBAA99, hx + 20, 23, hz - 10));

        // Lawn trees (cone/cylinder)
        var treePositions = [
            [hx - 35, hz - 15], [hx - 40, hz - 5], [hx + 35, hz - 15],
            [hx + 40, hz], [hx - 10, hz - 18], [hx + 10, hz - 18]
        ];
        for (i = 0; i < treePositions.length; i++) {
            var tp = treePositions[i];
            scene.add(makeCylinder(0.2, 0.3, 3, 5, 0x5A3A1A, tp[0], 1.5, tp[1]));
            scene.add(makeCone(1.5, 4, 7, 0x2A5A2A, tp[0], 5, tp[1]));
        }

        // Benches
        var benchPositions = [
            [hx - 10, hz + 14], [hx, hz + 14], [hx + 10, hz + 14],
            [hx + 20, hz + 14], [hx - 20, hz + 14]
        ];
        for (i = 0; i < benchPositions.length; i++) {
            var bep = benchPositions[i];
            scene.add(makeBox(2.5, 0.2, 0.8, 0x7A5A2A, bep[0], 1.3, bep[1]));
            scene.add(makeCylinder(0.1, 0.1, 1.2, 4, 0x5A3A1A, bep[0] - 1, 0.7, bep[1]));
            scene.add(makeCylinder(0.1, 0.1, 1.2, 4, 0x5A3A1A, bep[0] + 1, 0.7, bep[1]));
        }
    }

    function buildDrakesGreen(scene) {
        // Drake's bowling green where he famously finished his game before defeating Armada
        var gx = WORLD_X - 10;
        var gz = WORLD_Z - 80;

        // The green itself
        scene.add(makeBox(30, 0.15, 20, 0x2A7A2A, gx, 0.075, gz));

        // Green edge border
        scene.add(makeBox(32, 0.3, 1, 0x8A8A78, gx, 0.15, gz - 10.5));
        scene.add(makeBox(32, 0.3, 1, 0x8A8A78, gx, 0.15, gz + 10.5));
        scene.add(makeBox(1, 0.3, 20, 0x8A8A78, gx - 15.5, 0.15, gz));
        scene.add(makeBox(1, 0.3, 20, 0x8A8A78, gx + 15.5, 0.15, gz));

        // Bowls (spheres) on the green — historically accurate detail
        var bowlPositions = [
            [gx - 3, gz - 2], [gx + 2, gz + 3], [gx - 1, gz + 1],
            [gx + 5, gz - 4], [gx - 5, gz + 2]
        ];
        var i;
        for (i = 0; i < bowlPositions.length; i++) {
            var bwp = bowlPositions[i];
            scene.add(makeSphere(0.15, 6, 5, 0x1A1A1A, bwp[0], 0.3, bwp[1]));
        }
        // Jack (small target ball)
        scene.add(makeSphere(0.08, 5, 4, 0xFFFFCC, gx, 0.23, gz));

        // Pavilion / clubhouse
        scene.add(makeBox(12, 3, 6, 0xCCBBAA, gx, 1.5, gz - 17));
        scene.add(makeBox(12, 0.3, 6, 0x8A8A78, gx, 3.15, gz - 17));
        scene.add(makeCone(7, 2, 4, 0x7A6A58, gx, 4.3, gz - 17));

        // Information plaque
        scene.add(makeBox(2, 1.5, 0.15, 0x8A7A68, gx, 1, gz + 13));
    }

    function create(scene) {
        buildRoyalCitadel(scene);
        buildSmeatonsLighthouse(scene);
        buildFrancisDrakeStatue(scene);
        buildPlymouthSound(scene);
        buildMayflowerSteps(scene);
        buildDevonportDockyard(scene);
        buildHoePark(scene);
        buildDrakesGreen(scene);
    }

    return {
        create: create,
        WORLD_X: WORLD_X,
        WORLD_Z: WORLD_Z
    };

}());
