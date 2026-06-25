window.LiverpoolStreet = (function() {
    'use strict';

    var objects = [];
    var WX = 5240;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z, scene) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z, scene) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z, scene) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z, scene) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildStation(scene) {
        // Main Victorian train shed body
        makeBox(40, 16, 8, 0xD2B48C, 0, 8, 0, scene);
        // Brick facade front
        makeBox(40, 14, 1, 0xC19A6B, 0, 7, -4.5, scene);
        // Arched facade detail (approximated with stacked boxes)
        makeBox(36, 2, 1, 0xA0785A, 0, 15, -4.5, scene);
        // Clock tower
        makeBox(4, 24, 4, 0xC19A6B, -16, 12, -4, scene);
        makeBox(3, 4, 3, 0xD2B48C, -16, 26, -4, scene);
        makeCone(2, 3, 4, 0x888888, -16, 29.5, -4, scene);
        // Clock face sphere on tower
        makeSphere(1.2, 8, 8, 0xFFFFFF, -16, 24, -5.1, scene);
        // Platform canopies
        makeBox(38, 1, 6, 0x88AACC, 0, 4, 4, scene);
        makeBox(38, 1, 6, 0x88AACC, 0, 4, 11, scene);
        makeBox(38, 1, 6, 0x88AACC, 0, 4, 18, scene);
        // Platform floor slabs
        makeBox(38, 0.3, 3, 0xCCCCCC, 0, 0.15, 6, scene);
        makeBox(38, 0.3, 3, 0xCCCCCC, 0, 0.15, 13, scene);
        makeBox(38, 0.3, 3, 0xCCCCCC, 0, 0.15, 20, scene);
        // Train shapes on tracks
        makeBox(18, 3, 2.5, 0x336633, -8, 1.5, 7, scene);
        makeBox(3, 3.5, 2.5, 0x222222, -18, 1.75, 7, scene);
        makeBox(16, 3, 2.5, 0x224499, 5, 1.5, 14, scene);
        makeBox(3, 3.5, 2.5, 0x111133, -4, 1.75, 14, scene);
        // Station entrance canopy
        makeBox(14, 4, 4, 0x99BBCC, 0, 2, -7, scene);
        // Side wings
        makeBox(6, 10, 8, 0xC19A6B, -23, 5, 0, scene);
        makeBox(6, 10, 8, 0xC19A6B, 23, 5, 0, scene);
        // Ground level base
        makeBox(44, 1, 30, 0x888888, 0, 0, 8, scene);
    }

    function buildBroadgate(scene) {
        var bx = 60, bz = -30;
        // Ice rink cylinder
        makeCylinder(10, 10, 0.4, 24, 0xCCEEFF, bx, 0.2, bz, scene);
        // Rink surround wall
        makeCylinder(10.5, 10.5, 1.2, 24, 0xAAAAAA, bx, 0.6, bz, scene);
        // Surrounding office buildings
        makeBox(14, 22, 12, 0x87CEEB, bx - 22, 11, bz - 18, scene);
        makeBox(14, 22, 12, 0x808080, bx + 22, 11, bz - 18, scene);
        makeBox(12, 20, 10, 0x87CEEB, bx - 22, 10, bz + 18, scene);
        makeBox(12, 20, 10, 0x808080, bx + 22, 10, bz + 18, scene);
        makeBox(10, 18, 14, 0x87CEEB, bx - 30, 9, bz, scene);
        makeBox(10, 18, 14, 0x808080, bx + 30, 9, bz, scene);
        // Steel frame accents
        makeBox(14, 0.5, 12, 0x606060, bx - 22, 22, bz - 18, scene);
        makeBox(14, 0.5, 12, 0x606060, bx + 22, 22, bz - 18, scene);
        // Plaza ground
        makeBox(50, 0.3, 50, 0xCCCCCC, bx, 0.15, bz, scene);
    }

    function buildBishopsgate(scene) {
        var bz = -80;
        // Row of skyscrapers along Bishopsgate
        // 22 Bishopsgate - very tall
        makeBox(12, 35, 12, 0x87CEEB, 30, 17.5, bz, scene);
        makeBox(12, 0.5, 12, 0x606060, 30, 35.25, bz, scene);
        // Heron Tower - slanted effect with offset boxes
        makeBox(10, 30, 10, 0x6699BB, 50, 15, bz, scene);
        makeBox(8, 4, 8, 0x6699BB, 51.5, 32, bz, scene);
        makeBox(6, 3, 6, 0x6699BB, 52.5, 35.5, bz, scene);
        // Various glass towers
        makeBox(11, 25, 11, 0x87CEEB, 10, 12.5, bz, scene);
        makeBox(10, 20, 10, 0x88AACC, -10, 10, bz, scene);
        makeBox(9, 18, 9, 0x87CEEB, -28, 9, bz, scene);
        makeBox(8, 22, 8, 0x99BBDD, 70, 11, bz, scene);
        makeBox(10, 15, 9, 0x87CEEB, -46, 7.5, bz, scene);
        // Steel podiums
        makeBox(11, 3, 11, 0x808080, 30, 1.5, bz, scene);
        makeBox(10, 3, 10, 0x808080, 50, 1.5, bz, scene);
        makeBox(11, 3, 11, 0x808080, 10, 1.5, bz, scene);
        // Street level retail boxes
        makeBox(60, 4, 6, 0xCCCCCC, 10, 2, bz + 8, scene);
    }

    function buildSpitalfields(scene) {
        var sx = -60, sz = 40;
        // Victorian covered market structure
        makeBox(30, 6, 16, 0x8B4513, sx, 3, sz, scene);
        // Glass roof
        makeBox(28, 2, 14, 0xCCEEFF, sx, 7, sz, scene);
        // Roof ridge
        makeBox(26, 1.5, 1, 0xAAAAAA, sx, 8.25, sz, scene);
        // Market stalls
        makeBox(4, 2, 3, 0xFFCC88, sx - 10, 1, sz - 4, scene);
        makeBox(4, 2, 3, 0xFF9955, sx - 4, 1, sz - 4, scene);
        makeBox(4, 2, 3, 0xFFCC44, sx + 2, 1, sz - 4, scene);
        makeBox(4, 2, 3, 0xEEBB33, sx + 8, 1, sz - 4, scene);
        makeBox(4, 2, 3, 0xCCEE88, sx - 10, 1, sz + 4, scene);
        makeBox(4, 2, 3, 0x88CCEE, sx - 4, 1, sz + 4, scene);
        makeBox(4, 2, 3, 0xEE8866, sx + 2, 1, sz + 4, scene);
        makeBox(4, 2, 3, 0xBBDD99, sx + 8, 1, sz + 4, scene);
        // Victorian brick facade
        makeBox(30, 8, 1, 0x8B4513, sx, 4, sz - 8.5, scene);
        makeBox(30, 2, 1, 0x6B3010, sx, 9, sz - 8.5, scene);
        // Entry arches approximated
        makeBox(5, 6, 1, 0xAA6633, sx - 10, 3, sz - 8.6, scene);
        makeBox(5, 6, 1, 0xAA6633, sx, 3, sz - 8.6, scene);
        makeBox(5, 6, 1, 0xAA6633, sx + 10, 3, sz - 8.6, scene);
        // Ground
        makeBox(32, 0.3, 18, 0xBBAA99, sx, 0.15, sz, scene);
    }

    function buildPetticoatLane(scene) {
        var px = -80, pz = 60;
        // Victorian terraces along market street
        makeBox(8, 10, 6, 0xCC9966, px - 16, 5, pz - 20, scene);
        makeBox(8, 10, 6, 0xBB8855, px - 6, 5, pz - 20, scene);
        makeBox(8, 10, 6, 0xCC9966, px + 4, 5, pz - 20, scene);
        makeBox(8, 10, 6, 0xAA7744, px + 14, 5, pz - 20, scene);
        makeBox(8, 10, 6, 0xCC9966, px - 16, 5, pz + 20, scene);
        makeBox(8, 10, 6, 0xBB8855, px - 6, 5, pz + 20, scene);
        makeBox(8, 10, 6, 0xCC9966, px + 4, 5, pz + 20, scene);
        makeBox(8, 10, 6, 0xAA7744, px + 14, 5, pz + 20, scene);
        // Market stalls extending across road
        makeBox(5, 2.5, 3, 0xFF8844, px - 14, 1.25, pz - 8, scene);
        makeBox(5, 2.5, 3, 0xFFCC44, px - 7, 1.25, pz - 8, scene);
        makeBox(5, 2.5, 3, 0xEE6622, px, 1.25, pz - 8, scene);
        makeBox(5, 2.5, 3, 0x88CCEE, px + 7, 1.25, pz - 8, scene);
        makeBox(5, 2.5, 3, 0xFF8844, px - 14, 1.25, pz + 8, scene);
        makeBox(5, 2.5, 3, 0xFFCC44, px - 7, 1.25, pz + 8, scene);
        makeBox(5, 2.5, 3, 0xEE6622, px, 1.25, pz + 8, scene);
        makeBox(5, 2.5, 3, 0x88CCEE, px + 7, 1.25, pz + 8, scene);
        // Market awning overhead
        makeBox(40, 0.5, 4, 0xDD9933, px, 3, pz - 8, scene);
        makeBox(40, 0.5, 4, 0xDD9933, px, 3, pz + 8, scene);
        // Street surface
        makeBox(44, 0.3, 44, 0xAAAAAA, px, 0.15, pz, scene);
    }

    function buildBellFoundry(scene) {
        var fx = -50, fz = 100;
        // Georgian building (cream)
        makeBox(16, 10, 12, 0xFFF8DC, fx, 5, fz, scene);
        // Parapet
        makeBox(16, 1.5, 12, 0xEEE8CC, fx, 10.75, fz, scene);
        // Chimney stacks
        makeBox(1.5, 4, 1.5, 0xDDCCBB, fx - 6, 13, fz - 4, scene);
        makeBox(1.5, 4, 1.5, 0xDDCCBB, fx + 6, 13, fz - 4, scene);
        // Commemorative marker
        makeBox(2, 3, 0.3, 0x884422, fx, 1.5, fz - 6.2, scene);
        makeBox(2.5, 0.3, 0.5, 0x666666, fx, 3.15, fz - 6.2, scene);
        // Small bell shape on marker (sphere top)
        makeSphere(0.5, 8, 8, 0xBB9900, fx, 3.5, fz - 6.2, scene);
        // Pavement
        makeBox(20, 0.3, 16, 0xCCBBAA, fx, 0.15, fz, scene);
    }

    function buildBevisMarks(scene) {
        var bx = 20, bz = 80;
        // Classical building body
        makeBox(12, 8, 6, 0xFFF8DC, bx, 4, bz, scene);
        // Classical pediment roof
        makeBox(12, 2, 6, 0xEEE8CC, bx, 9, bz, scene);
        makeCone(5, 3, 4, 0xDDCCBB, bx, 11.5, bz, scene);
        // Columns approximated with cylinders
        makeCylinder(0.4, 0.4, 6, 8, 0xFFFAF0, bx - 4, 3, bz - 3.2, scene);
        makeCylinder(0.4, 0.4, 6, 8, 0xFFFAF0, bx - 2, 3, bz - 3.2, scene);
        makeCylinder(0.4, 0.4, 6, 8, 0xFFFAF0, bx + 2, 3, bz - 3.2, scene);
        makeCylinder(0.4, 0.4, 6, 8, 0xFFFAF0, bx + 4, 3, bz - 3.2, scene);
        // Hidden courtyard walls
        makeBox(0.5, 3, 10, 0xEEE0CC, bx - 8, 1.5, bz, scene);
        makeBox(0.5, 3, 10, 0xEEE0CC, bx + 8, 1.5, bz, scene);
        makeBox(14, 3, 0.5, 0xEEE0CC, bx, 1.5, bz + 6, scene);
        // Courtyard paving
        makeBox(14, 0.3, 12, 0xDDCCBB, bx, 0.15, bz + 2, scene);
    }

    function buildFinsburySquare(scene) {
        var fx = -30, fz = -50;
        // Central garden square
        makeBox(18, 0.5, 18, 0x228B22, fx, 0.25, fz, scene);
        // Garden bushes
        makeSphere(1.5, 8, 8, 0x1A7A1A, fx - 6, 1.5, fz - 6, scene);
        makeSphere(1.5, 8, 8, 0x1A7A1A, fx + 6, 1.5, fz - 6, scene);
        makeSphere(1.5, 8, 8, 0x1A7A1A, fx - 6, 1.5, fz + 6, scene);
        makeSphere(1.5, 8, 8, 0x1A7A1A, fx + 6, 1.5, fz + 6, scene);
        // Central tree trunk
        makeCylinder(0.5, 0.6, 4, 8, 0x5C3A1E, fx, 2, fz, scene);
        makeSphere(3, 8, 8, 0x228B22, fx, 5.5, fz, scene);
        // Georgian terraces around square
        makeBox(20, 12, 7, 0xCC9966, fx - 22, 6, fz, scene);
        makeBox(20, 12, 7, 0xBB8855, fx + 22, 6, fz, scene);
        makeBox(7, 12, 22, 0xCC9966, fx, 6, fz - 22, scene);
        makeBox(7, 12, 22, 0xBB8855, fx, 6, fz + 22, scene);
        // Later office buildings alongside
        makeBox(14, 20, 10, 0x87CEEB, fx - 36, 10, fz - 8, scene);
        makeBox(12, 18, 10, 0x808080, fx + 36, 9, fz + 8, scene);
        // Railing fences (thin boxes)
        makeBox(20, 1.5, 0.3, 0x2A2A2A, fx, 0.75, fz - 9.5, scene);
        makeBox(20, 1.5, 0.3, 0x2A2A2A, fx, 0.75, fz + 9.5, scene);
        makeBox(0.3, 1.5, 20, 0x2A2A2A, fx - 9.5, 0.75, fz, scene);
        makeBox(0.3, 1.5, 20, 0x2A2A2A, fx + 9.5, 0.75, fz, scene);
    }

    function buildMoorfields(scene) {
        var mx = 80, mz = 20;
        // Hospital main building
        makeBox(22, 12, 16, 0xE8E8E8, mx, 6, mz, scene);
        // Wings
        makeBox(10, 10, 10, 0xE8E8E8, mx - 18, 5, mz, scene);
        makeBox(10, 10, 10, 0xE8E8E8, mx + 18, 5, mz, scene);
        // Entrance canopy
        makeBox(8, 3, 4, 0xDDDDDD, mx, 3, mz - 10, scene);
        makeCylinder(0.4, 0.4, 3, 8, 0xCCCCCC, mx - 3.5, 1.5, mz - 11.5, scene);
        makeCylinder(0.4, 0.4, 3, 8, 0xCCCCCC, mx + 3.5, 1.5, mz - 11.5, scene);
        // Red cross marker
        makeBox(0.8, 4, 0.3, 0xCC2222, mx, 2, mz - 10.2, scene);
        makeBox(3, 0.8, 0.3, 0xCC2222, mx, 3, mz - 10.2, scene);
        // Roof detail
        makeBox(22, 1, 16, 0xDDDDDD, mx, 12.5, mz, scene);
        // Hospital signage box
        makeBox(6, 2, 0.3, 0x335599, mx, 9, mz - 8.2, scene);
        // Ground
        makeBox(30, 0.3, 24, 0xBBBBBB, mx, 0.15, mz, scene);
    }

    function buildCityWalls(scene) {
        var sections = [
            [-20, -10, 0],
            [-10, -10, 0],
            [0, -10, 0],
            [30, -10, 0],
            [40, -10, 0],
            [-20, -10, 30],
            [-10, -10, 30],
            [0, -10, 30]
        ];
        var i;
        for (i = 0; i < sections.length; i++) {
            var s = sections[i];
            // Roman stone wall section
            makeBox(8, 5, 1.5, 0x888888, s[0], 2.5, s[1], scene);
            // Rubble/base
            makeBox(9, 1, 2, 0x777777, s[0], 0.5, s[1], scene);
            // Top crenellation
            makeBox(2, 1.5, 1.5, 0x999999, s[0] - 2.5, 5.75, s[1], scene);
            makeBox(2, 1.5, 1.5, 0x999999, s[0] + 2.5, 5.75, s[1], scene);
        }
        // Integration into modern plaza
        makeBox(50, 0.3, 8, 0xCCCCCC, 10, 0.15, -10, scene);
        // Interpretive panel
        makeBox(3, 2, 0.3, 0x553311, -5, 1, -6, scene);
        makeSphere(0.5, 6, 6, 0xBBAA88, -5, 2.25, -6, scene);
    }

    function buildGroundPlane(scene) {
        // Large ground sections using boxes (no PlaneGeometry allowed)
        makeBox(300, 0.3, 300, 0x666666, 0, -0.15, 0, scene);
        // Road markings (lighter boxes on top)
        makeBox(4, 0.05, 200, 0xCCCCCC, -5, 0.02, -20, scene);
        makeBox(4, 0.05, 200, 0xCCCCCC, 5, 0.02, -20, scene);
        makeBox(200, 0.05, 4, 0xCCCCCC, 0, 0.02, 30, scene);
    }

    function buildAmbientStructures(scene) {
        // Additional street furniture and context
        // Street lamps
        var lampPositions = [
            [20, 30], [-20, 30], [20, -20], [-20, -20],
            [40, 0], [-40, 0], [0, -30], [0, 60]
        ];
        var i;
        for (i = 0; i < lampPositions.length; i++) {
            var lp = lampPositions[i];
            makeCylinder(0.2, 0.2, 6, 6, 0x444444, lp[0], 3, lp[1], scene);
            makeSphere(0.6, 6, 6, 0xFFEE99, lp[0], 6.3, lp[1], scene);
        }
        // Telephone box
        makeBox(1.2, 2.5, 1.2, 0xCC2222, -12, 1.25, 25, scene);
        makeBox(1.2, 0.3, 1.2, 0xAA1111, -12, 2.65, 25, scene);
        // Post box
        makeCylinder(0.5, 0.5, 1.2, 8, 0xCC1111, 15, 0.6, 28, scene);
        makeCylinder(0.4, 0.4, 0.3, 8, 0xBB1111, 15, 1.35, 28, scene);
        // Benches
        makeBox(2, 0.2, 0.6, 0x8B6914, -8, 1.1, 32, scene);
        makeBox(0.2, 1, 0.6, 0x8B6914, -9, 0.5, 32, scene);
        makeBox(0.2, 1, 0.6, 0x8B6914, -7, 0.5, 32, scene);
        makeBox(2, 0.2, 0.6, 0x8B6914, 8, 1.1, 32, scene);
        makeBox(0.2, 1, 0.6, 0x8B6914, 7, 0.5, 32, scene);
        makeBox(0.2, 1, 0.6, 0x8B6914, 9, 0.5, 32, scene);
    }

    function init(scene) {
        buildGroundPlane(scene);
        buildStation(scene);
        buildBroadgate(scene);
        buildBishopsgate(scene);
        buildSpitalfields(scene);
        buildPetticoatLane(scene);
        buildBellFoundry(scene);
        buildBevisMarks(scene);
        buildFinsburySquare(scene);
        buildMoorfields(scene);
        buildCityWalls(scene);
        buildAmbientStructures(scene);
    }

    function update(delta, elapsed) {
        // No animated elements in this environment
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].parent) {
                objects[i].parent.remove(objects[i]);
            }
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return { init: init, update: update, reset: reset };
}());
