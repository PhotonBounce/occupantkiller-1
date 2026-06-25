window.WembleyStadium = (function() {
    'use strict';

    var OX = 4920;
    var OZ = 2200;
    var sceneRef = null;
    var allObjects = [];

    function makeBox(w, h, d, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z, rx, ry, rz) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 16);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        return mesh;
    }

    function addToScene(mesh) {
        sceneRef.add(mesh);
        allObjects.push(mesh);
        return mesh;
    }

    function buildWembleyStadium() {
        // Main stadium body
        addToScene(makeCylinder(22, 22, 8, 32, 0xFFFFFF, 0, 4, 0));

        // Stadium roof ring
        addToScene(makeCylinder(23, 23, 1, 32, 0xC0C0C0, 0, 8.5, 0));

        // Stadium base ring
        addToScene(makeCylinder(23, 24, 2, 32, 0xAAAAAA, 0, 1, 0));

        // Wembley Arch - parabolic curve built with stacked angled Boxes
        // Arch spans over the stadium, rising 52 blocks high
        // Left base of arch
        addToScene(makeBox(4, 4, 4, 0xC0C0C0, -22, 2, 0));
        // Right base of arch
        addToScene(makeBox(4, 4, 4, 0xC0C0C0, 22, 2, 0));

        // Parabolic arch segments - stacked angled boxes forming the curve
        var archPoints = [
            { x: -20, y: 6,  rz:  0.22 },
            { x: -17, y: 14, rz:  0.18 },
            { x: -13, y: 22, rz:  0.12 },
            { x: -8,  y: 30, rz:  0.06 },
            { x: -3,  y: 38, rz:  0.02 },
            { x:  0,  y: 52, rz:  0.00 },
            { x:  3,  y: 38, rz: -0.02 },
            { x:  8,  y: 30, rz: -0.06 },
            { x:  13, y: 22, rz: -0.12 },
            { x:  17, y: 14, rz: -0.18 },
            { x:  20, y: 6,  rz: -0.22 }
        ];

        for (var ai = 0; ai < archPoints.length; ai++) {
            var ap = archPoints[ai];
            addToScene(makeBox(4, 4, 4, 0xC0C0C0, ap.x, ap.y, 0, 0, 0, ap.rz));
        }

        // Arch cable hangers
        for (var ci = 0; ci < 8; ci++) {
            var cx = -16 + ci * 5;
            addToScene(makeBox(0.3, 8, 0.3, 0xAAAAAA, cx, 8, 0));
        }
    }

    function buildWembleyPitch() {
        // Football pitch - inside the stadium
        addToScene(makeBox(30, 0.2, 20, 0x228B22, 0, 0.1, 0));

        // Pitch markings - white boxes
        // Centre circle outline (approximated with box strips)
        addToScene(makeBox(0.3, 0.3, 20, 0xFFFFFF, 0, 0.3, 0));   // centre line
        addToScene(makeBox(30, 0.3, 0.3, 0xFFFFFF, 0, 0.3, 0));    // halfway line
        // Penalty boxes
        addToScene(makeBox(0.3, 0.3, 8, 0xFFFFFF, -12, 0.3, 0));   // left penalty box left
        addToScene(makeBox(0.3, 0.3, 8, 0xFFFFFF, -7,  0.3, 0));   // left penalty box right
        addToScene(makeBox(5, 0.3, 0.3, 0xFFFFFF, -9.5, 0.3, 4));  // left penalty box top
        addToScene(makeBox(5, 0.3, 0.3, 0xFFFFFF, -9.5, 0.3, -4)); // left penalty box bottom
        addToScene(makeBox(0.3, 0.3, 8, 0xFFFFFF, 12, 0.3, 0));    // right penalty box left
        addToScene(makeBox(0.3, 0.3, 8, 0xFFFFFF, 7,  0.3, 0));    // right penalty box right
        addToScene(makeBox(5, 0.3, 0.3, 0xFFFFFF, 9.5, 0.3, 4));   // right penalty box top
        addToScene(makeBox(5, 0.3, 0.3, 0xFFFFFF, 9.5, 0.3, -4));  // right penalty box bottom
        // Goalposts
        addToScene(makeBox(0.3, 2, 0.3, 0xFFFFFF, -15, 1, -1.5));
        addToScene(makeBox(0.3, 2, 0.3, 0xFFFFFF, -15, 1,  1.5));
        addToScene(makeBox(0.3, 0.3, 3, 0xFFFFFF, -15, 2,  0));
        addToScene(makeBox(0.3, 2, 0.3, 0xFFFFFF, 15, 1, -1.5));
        addToScene(makeBox(0.3, 2, 0.3, 0xFFFFFF, 15, 1,  1.5));
        addToScene(makeBox(0.3, 0.3, 3, 0xFFFFFF, 15, 2,  0));
    }

    function buildBobbyMooreStatue() {
        // Statue at Wembley entrance (south side)
        // Plinth
        addToScene(makeBox(2, 1.5, 2, 0x888888, -26, 0.75, 18));
        // Body
        addToScene(makeBox(1, 2, 0.8, 0x666666, -26, 2.5, 18));
        // Head
        addToScene(makeBox(0.7, 0.7, 0.7, 0x888888, -26, 3.85, 18));
        // Left arm down
        addToScene(makeBox(0.4, 1.2, 0.4, 0x666666, -26.7, 2.4, 18));
        // Right arm raised holding trophy
        addToScene(makeBox(0.4, 1.2, 0.4, 0x666666, -25.3, 3.2, 18, 0, 0, -0.8));
        // World Cup trophy (box)
        addToScene(makeBox(0.5, 0.7, 0.5, 0xFFD700, -25.0, 4.2, 18));
        // Trophy base
        addToScene(makeBox(0.6, 0.2, 0.6, 0xFFD700, -25.0, 3.85, 18));
    }

    function buildOlympicStadium() {
        // Olympic Stadium (Stratford) - offset from Wembley
        var sx = 180;
        var sz = 80;

        // Main oval body
        addToScene(makeCylinder(18, 18, 6, 32, 0xFFFFFF, sx, 3, sz));

        // Orange roof support masts
        var mastPositions = [
            { x: sx - 15, z: sz - 10 },
            { x: sx + 15, z: sz - 10 },
            { x: sx - 15, z: sz + 10 },
            { x: sx + 15, z: sz + 10 },
            { x: sx,      z: sz - 18 },
            { x: sx,      z: sz + 18 }
        ];
        for (var mi = 0; mi < mastPositions.length; mi++) {
            addToScene(makeCylinder(0.6, 0.6, 20, 8, 0xFF6600,
                mastPositions[mi].x, 10, mastPositions[mi].z));
        }

        // Roof ring
        addToScene(makeCylinder(19, 19, 0.8, 32, 0xCC4400, sx, 16, sz));

        // Stadium inner field
        addToScene(makeBox(28, 0.2, 18, 0x228B22, sx, 0.1, sz));

        // Running track surrounds (orange)
        addToScene(makeBox(36, 0.2, 26, 0xFF6600, sx, 0.05, sz));
    }

    function buildArcelorMittalOrbit() {
        // Main column
        var cx = 195;
        var cz = 90;
        addToScene(makeCylinder(1.5, 1.5, 28, 12, 0xFF0000, cx, 14, cz));

        // Observation platform at top
        addToScene(makeBox(8, 1.5, 8, 0xFF0000, cx, 28.5, cz));
        addToScene(makeBox(6, 3, 6, 0xCC0000, cx, 30, cz));

        // Helical rings spiraling around the column (box loops)
        var ringCount = 7;
        for (var ri = 0; ri < ringCount; ri++) {
            var ry = 4 + ri * 3.5;
            var angle = ri * (Math.PI * 2 / ringCount);
            var rx2 = Math.cos(angle) * 5;
            var rz2 = Math.sin(angle) * 5;
            // Ring segment A
            addToScene(makeBox(3, 0.8, 0.8, 0xFF0000, cx + rx2, ry, cz + rz2, 0, angle, 0));
            // Ring segment B (opposite)
            addToScene(makeBox(3, 0.8, 0.8, 0xFF0000, cx - rx2, ry, cz - rz2, 0, angle, 0));
        }
    }

    function buildAquaticsCentre() {
        // Main body - Zaha Hadid design
        var ax = 210;
        var az = 60;
        addToScene(makeBox(30, 6, 16, 0x4488CC, ax, 3, az));

        // Wave-like roof as curved box stack (Zaha Hadid signature)
        var roofSegments = [
            { dx: -12, dy: 9,  dz: 0, rx: -0.25 },
            { dx:  -8, dy: 10, dz: 0, rx: -0.15 },
            { dx:  -4, dy: 11, dz: 0, rx: -0.05 },
            { dx:   0, dy: 11.5, dz: 0, rx:  0.00 },
            { dx:   4, dy: 11, dz: 0, rx:  0.05 },
            { dx:   8, dy: 10, dz: 0, rx:  0.15 },
            { dx:  12, dy: 9,  dz: 0, rx:  0.25 }
        ];
        for (var rsi = 0; rsi < roofSegments.length; rsi++) {
            var rs = roofSegments[rsi];
            addToScene(makeBox(5, 0.8, 17, 0xC0C0C0, ax + rs.dx, rs.dy, az + rs.dz, rs.rx, 0, 0));
        }

        // Side facades
        addToScene(makeBox(0.5, 6, 16, 0x6699BB, ax - 15, 3, az));
        addToScene(makeBox(0.5, 6, 16, 0x6699BB, ax + 15, 3, az));
    }

    function buildOlympicPark() {
        var px = 190;
        var pz = 50;

        // Parkland base
        addToScene(makeBox(60, 0.3, 40, 0x228B22, px, 0.15, pz));

        // Water features (blue boxes - canals/ponds)
        addToScene(makeBox(20, 0.4, 3, 0x1144AA, px - 15, 0.2, pz - 10));
        addToScene(makeBox(3, 0.4, 15, 0x1144AA, px - 25, 0.2, pz));
        addToScene(makeBox(12, 0.4, 2, 0x1144AA, px + 10, 0.2, pz + 12));

        // Plaza areas (light stone)
        addToScene(makeBox(15, 0.4, 10, 0xDDCCAA, px, 0.2, pz - 5));
        addToScene(makeBox(10, 0.4, 10, 0xDDCCAA, px + 15, 0.2, pz + 5));

        // Path/walkways
        addToScene(makeBox(40, 0.4, 2, 0xCCBB99, px, 0.2, pz));
        addToScene(makeBox(2, 0.4, 30, 0xCCBB99, px, 0.2, pz));

        // Trees (cylinder trunk + sphere-like box top)
        var treePositions = [
            { x: px - 20, z: pz - 15 },
            { x: px - 20, z: pz + 15 },
            { x: px + 20, z: pz - 15 },
            { x: px + 20, z: pz + 15 },
            { x: px - 10, z: pz + 15 },
            { x: px + 10, z: pz - 15 }
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var tp = treePositions[ti];
            addToScene(makeCylinder(0.3, 0.3, 3, 6, 0x553311, tp.x, 1.5, tp.z));
            addToScene(makeBox(2.5, 2.5, 2.5, 0x336622, tp.x, 4, tp.z));
        }
    }

    function buildStratfordStation() {
        var stx = 160;
        var stz = 30;

        // Main station building
        addToScene(makeBox(30, 8, 14, 0xE8E8E8, stx, 4, stz));

        // Glass facade panels
        for (var fi = 0; fi < 6; fi++) {
            addToScene(makeBox(4, 6, 0.4, 0x88BBDD, stx - 12 + fi * 5, 4, stz - 7.2));
        }

        // Roof canopy
        addToScene(makeBox(34, 0.5, 16, 0x999999, stx, 8.25, stz));

        // Train platforms
        addToScene(makeBox(25, 1, 4, 0xCCCCCC, stx - 2, 0.5, stz - 12));
        addToScene(makeBox(25, 1, 4, 0xCCCCCC, stx - 2, 0.5, stz - 18));
        addToScene(makeBox(25, 1, 4, 0xCCCCCC, stx - 2, 0.5, stz - 24));

        // Platform shelters
        for (var pi = 0; pi < 3; pi++) {
            addToScene(makeBox(25, 0.4, 4, 0x888888, stx - 2, 3.2, stz - 12 - pi * 6));
            addToScene(makeBox(0.4, 3, 0.4, 0x888888, stx - 13, 1.6, stz - 12 - pi * 6));
            addToScene(makeBox(0.4, 3, 0.4, 0x888888, stx + 9,  1.6, stz - 12 - pi * 6));
        }

        // Station entrance canopy
        addToScene(makeBox(16, 0.4, 5, 0xAAAAAA, stx, 9.5, stz + 9));
        addToScene(makeBox(0.4, 6, 0.4, 0xAAAAAA, stx - 7, 6, stz + 9));
        addToScene(makeBox(0.4, 6, 0.4, 0xAAAAAA, stx + 7, 6, stz + 9));
    }

    function buildWestfieldStratford() {
        var wx = 140;
        var wz = -20;

        // Main shopping centre complex
        addToScene(makeBox(40, 8, 20, 0xFFFFFF, wx, 4, wz));

        // Large glass atrium
        addToScene(makeBox(12, 12, 12, 0x99CCEE, wx, 6, wz));

        // Atrium roof pyramid-ish (box layers)
        addToScene(makeBox(10, 1, 10, 0x77AACC, wx, 12.5, wz));
        addToScene(makeBox(7, 1, 7, 0x77AACC, wx, 13.5, wz));
        addToScene(makeBox(4, 1, 4, 0x77AACC, wx, 14.5, wz));

        // Side wings
        addToScene(makeBox(10, 6, 20, 0xEEEEEE, wx - 25, 3, wz));
        addToScene(makeBox(10, 6, 20, 0xEEEEEE, wx + 25, 3, wz));

        // Car park structure
        addToScene(makeBox(20, 10, 15, 0xCCCCCC, wx - 30, 5, wz - 18));

        // Entrance facade panels
        for (var ei = 0; ei < 8; ei++) {
            addToScene(makeBox(4, 8, 0.4, 0x88BBDD, wx - 16 + ei * 5, 4, wz + 10.2));
        }

        // Roof plant room
        addToScene(makeBox(8, 3, 8, 0xAAAAAA, wx + 14, 9.5, wz));
    }

    function buildVeloPark() {
        var vx = 230;
        var vz = 30;

        // Main velodrome building (oval box)
        addToScene(makeBox(25, 6, 15, 0x446688, vx, 3, vz));

        // Distinctive curved roof
        var velRoofSegs = [
            { dx: -10, dy: 7.5, rx: -0.20 },
            { dx: -5,  dy: 8.5, rx: -0.08 },
            { dx:  0,  dy: 9.0, rx:  0.00 },
            { dx:  5,  dy: 8.5, rx:  0.08 },
            { dx:  10, dy: 7.5, rx:  0.20 }
        ];
        for (var vri = 0; vri < velRoofSegs.length; vri++) {
            var vrs = velRoofSegs[vri];
            addToScene(makeBox(5.5, 0.6, 16, 0xC0C0C0, vx + vrs.dx, vrs.dy, vz, vrs.rx, 0, 0));
        }

        // Internal banked cycling track (infield)
        addToScene(makeBox(18, 0.3, 10, 0xCCBB88, vx, 0.15, vz));

        // Side entrance
        addToScene(makeBox(6, 4, 0.4, 0x88AACC, vx, 2, vz + 7.7));

        // Roof support columns
        for (var vci = 0; vci < 4; vci++) {
            addToScene(makeCylinder(0.4, 0.4, 9, 8, 0x888888,
                vx - 10 + vci * 7, 4.5, vz - 7));
        }
    }

    function buildGroundPlane() {
        // Ground/terrain base for the whole area
        addToScene(makeBox(400, 0.5, 300, 0x4A7C59, 100, -0.25, 40));

        // Roads/paths around Wembley
        addToScene(makeBox(6, 0.4, 80, 0x555555, -30, 0.2, 10));  // Olympic Way
        addToScene(makeBox(80, 0.4, 6, 0x555555, 10, 0.2, 26));   // Cross road

        // Car parks
        addToScene(makeBox(30, 0.4, 20, 0x888888, 35, 0.2, 25));
        addToScene(makeBox(30, 0.4, 20, 0x888888, 35, 0.2, -5));

        // Path from Wembley to Olympic Park
        addToScene(makeBox(4, 0.4, 100, 0x777777, 80, 0.2, 50));
    }

    function init(scene) {
        sceneRef = scene;
        buildGroundPlane();
        buildWembleyStadium();
        buildWembleyPitch();
        buildBobbyMooreStatue();
        buildOlympicStadium();
        buildArcelorMittalOrbit();
        buildAquaticsCentre();
        buildOlympicPark();
        buildStratfordStation();
        buildWestfieldStratford();
        buildVeloPark();
    }

    function update(delta) {
        // Static environment - no per-frame updates needed
    }

    function reset() {
        for (var i = 0; i < allObjects.length; i++) {
            var obj = allObjects[i];
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
            if (sceneRef) sceneRef.remove(obj);
        }
        allObjects = [];
        sceneRef = null;
    }

    return { init: init, update: update, reset: reset };

}());
