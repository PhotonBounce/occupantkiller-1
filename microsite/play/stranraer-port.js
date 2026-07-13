window.StranraerPort = (function() {
    'use strict';

    var WORLD_X = 2320;
    var WORLD_Z = 2200;

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makesphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makecone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        return mesh;
    }

    function makewirebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(x, y, z);
        scene.add(lines);
        return lines;
    }

    function buildcastle(scene, bx, bz) {
        // Main keep tower house — 8×14×8 stone
        makebox(scene, 8, 14, 8, 0x9A8A78, bx, 7, bz);

        // Crenellations along top of keep
        var i;
        for (i = 0; i < 4; i++) {
            makebox(scene, 1.5, 1.5, 1.5, 0x9A8A78, bx - 3 + i * 2, 14.75, bz - 4);
            makebox(scene, 1.5, 1.5, 1.5, 0x9A8A78, bx - 3 + i * 2, 14.75, bz + 4);
        }
        for (i = 0; i < 4; i++) {
            makebox(scene, 1.5, 1.5, 1.5, 0x9A8A78, bx - 4, 14.75, bz - 3 + i * 2);
            makebox(scene, 1.5, 1.5, 1.5, 0x9A8A78, bx + 4, 14.75, bz - 3 + i * 2);
        }

        // Curtain wall fragments — north
        makebox(scene, 18, 5, 1.2, 0x9A8A78, bx, 2.5, bz - 14);
        // Curtain wall — east fragment
        makebox(scene, 1.2, 5, 12, 0x9A8A78, bx + 12, 2.5, bz - 8);
        // Corner tower — NE
        makebox(scene, 3, 7, 3, 0x8A7A68, bx + 11, 3.5, bz - 14);
        // Corner tower — NW
        makebox(scene, 3, 7, 3, 0x8A7A68, bx - 11, 3.5, bz - 14);

        // Castle gate arch suggestion — south wall gap
        makebox(scene, 5, 5, 1.2, 0x9A8A78, bx - 6, 2.5, bz + 12);
        makebox(scene, 5, 5, 1.2, 0x9A8A78, bx + 6, 2.5, bz + 12);
        // Lintel over gate
        makebox(scene, 4, 1, 1.2, 0x9A8A78, bx, 5, bz + 12);
    }

    function buildferryterminal(scene, bx, bz) {
        // Main shed terminal building 35×8×15 steel grey
        makebox(scene, 35, 8, 15, 0x6A6A6A, bx, 4, bz);

        // Roof ridge detail
        makebox(scene, 35, 1, 2, 0x555555, bx, 8.5, bz);

        // Loading ramp — inclined suggestion (flat box angled into water)
        var ramp = makebox(scene, 12, 0.8, 6, 0x5A5A5A, bx - 20, 1.5, bz);
        ramp.rotation.z = -0.15;

        // Dock arm — left
        makebox(scene, 3, 2, 18, 0x606060, bx - 15, 2, bz + 16);
        // Dock arm — right
        makebox(scene, 3, 2, 18, 0x606060, bx + 15, 2, bz + 16);

        // Control tower on terminal roof
        makebox(scene, 5, 6, 5, 0x707070, bx + 14, 11, bz - 3);
        // Control tower windows (dark boxes)
        makebox(scene, 3, 1.5, 0.3, 0x222244, bx + 14, 13, bz - 5.2);
        makebox(scene, 3, 1.5, 0.3, 0x222244, bx + 14, 13, bz - 0.8);

        // Signage board
        makebox(scene, 10, 2, 0.3, 0x4A4A4A, bx, 9.5, bz - 7.6);

        // Bollards along dock edge
        var i;
        for (i = 0; i < 5; i++) {
            makecylinder(scene, 0.3, 0.3, 1.5, 6, 0x333333, bx - 14 + i * 7, 1.75, bz - 8);
        }
    }

    function buildroroferry(scene, bx, bz) {
        // Massive hull 55×10×18 blue-white
        makebox(scene, 55, 10, 18, 0x3A3A8A, bx, 5, bz);

        // White upper superstructure
        makebox(scene, 40, 6, 14, 0xDDDDDD, bx - 2, 13, bz);

        // Bridge deck
        makebox(scene, 20, 4, 12, 0xCCCCCC, bx - 5, 18, bz);

        // Bridge windows — row of dark boxes
        var i;
        for (i = 0; i < 6; i++) {
            makebox(scene, 2, 1.5, 0.2, 0x112233, bx - 12 + i * 4, 19.5, bz - 6.1);
        }

        // Funnel cylinder — company livery
        makecylinder(scene, 1.8, 2, 7, 10, 0xCC2200, bx + 8, 23.5, bz);
        // Funnel top cap
        makebox(scene, 5, 1, 5, 0x111111, bx + 8, 27.5, bz);

        // Car deck visible openings — bow side boxes (dark)
        makebox(scene, 0.3, 3, 16, 0x111122, bx - 27.4, 5, bz);
        makebox(scene, 0.3, 3, 16, 0x111122, bx + 27.4, 5, bz);

        // Car deck level indicators — thin horizontal strips
        makebox(scene, 54, 0.3, 0.3, 0xFFFFFF, bx, 8, bz - 9.1);
        makebox(scene, 54, 0.3, 0.3, 0xFFFFFF, bx, 4, bz - 9.1);

        // Bow anchor housing
        makebox(scene, 3, 2, 3, 0x2A2A6A, bx - 27, 10, bz);

        // Stern ramp (ro-ro)
        makebox(scene, 14, 0.8, 8, 0x4A4A4A, bx + 30, 2, bz);

        // Lifeboat davits — small cylinders
        makecylinder(scene, 0.2, 0.2, 4, 4, 0x888888, bx - 15, 20, bz - 7);
        makecylinder(scene, 0.2, 0.2, 4, 4, 0x888888, bx - 5, 20, bz - 7);
        makecylinder(scene, 0.2, 0.2, 4, 4, 0x888888, bx + 5, 20, bz - 7);
        // Lifeboats (small orange boxes)
        makebox(scene, 5, 1.5, 2, 0xFF6600, bx - 15, 22.5, bz - 8);
        makebox(scene, 5, 1.5, 2, 0xFF6600, bx - 5, 22.5, bz - 8);
        makebox(scene, 5, 1.5, 2, 0xFF6600, bx + 5, 22.5, bz - 8);
    }

    function buildlochryan(scene, bx, bz) {
        // Loch Ryan water expanse — large flat boxes (very thin)
        makebox(scene, 200, 0.5, 120, 0x1A5A8A, bx + 60, -0.25, bz + 60);
        makebox(scene, 100, 0.5, 80, 0x154A7A, bx - 80, -0.25, bz - 20);
        makebox(scene, 80, 0.5, 60, 0x1A5A8A, bx + 30, -0.25, bz - 80);

        // Naval anchorage marker buoys — small sphere floats
        var buoypositions = [
            [bx + 50, 1, bz + 40],
            [bx + 80, 1, bz + 20],
            [bx + 70, 1, bz + 60],
            [bx + 100, 1, bz + 10],
            [bx + 40, 1, bz + 80],
            [bx - 20, 1, bz + 50],
            [bx + 120, 1, bz + 50]
        ];
        var j;
        for (j = 0; j < buoypositions.length; j++) {
            var bp = buoypositions[j];
            // Float sphere
            makesphere(scene, 0.6, 6, 4, 0xFF4400, bp[0], bp[1], bp[2]);
            // Buoy pole
            makecylinder(scene, 0.08, 0.08, 2.5, 4, 0xFFAA00, bp[0], bp[1] + 2, bp[2]);
        }

        // Mooring posts along waterfront
        var k;
        for (k = 0; k < 6; k++) {
            makecylinder(scene, 0.35, 0.35, 3, 6, 0x444444, bx - 25 + k * 9, 1.5, bz - 5);
        }
    }

    function buildwwiiflyingbase(scene, bx, bz) {
        // Reinforced concrete slipway ramps into loch — inclined boxes
        var ramp1 = makebox(scene, 14, 0.6, 30, 0x9E9E9E, bx - 60, 0.5, bz + 30);
        ramp1.rotation.x = 0.12;

        var ramp2 = makebox(scene, 14, 0.6, 30, 0x9E9E9E, bx - 80, 0.5, bz + 30);
        ramp2.rotation.x = 0.12;

        // Ramp side retaining walls
        makebox(scene, 0.8, 2, 30, 0x8E8E8E, bx - 53, 1, bz + 30);
        makebox(scene, 0.8, 2, 30, 0x8E8E8E, bx - 67, 1, bz + 30);
        makebox(scene, 0.8, 2, 30, 0x8E8E8E, bx - 73, 1, bz + 30);
        makebox(scene, 0.8, 2, 30, 0x8E8E8E, bx - 87, 1, bz + 30);

        // Seaplane hangar 30×10×20
        makebox(scene, 30, 10, 20, 0x7A7A7A, bx - 70, 5, bz + 5);

        // Hangar roof arch suggestion — box ridge
        makebox(scene, 30, 2, 4, 0x6A6A6A, bx - 70, 11, bz + 5);

        // Hangar doors — large dark opening
        makebox(scene, 0.3, 9, 16, 0x222222, bx - 55.1, 4.5, bz + 5);

        // WWII era control shack
        makebox(scene, 8, 4, 6, 0x808070, bx - 90, 2, bz + 5);
        // Shack roof
        makebox(scene, 9, 1, 7, 0x706F60, bx - 90, 4.5, bz + 5);

        // Fuel dump — cylinders
        makecylinder(scene, 2, 2, 5, 8, 0x664400, bx - 95, 2.5, bz - 10);
        makecylinder(scene, 2, 2, 5, 8, 0x664400, bx - 89, 2.5, bz - 10);

        // Windsock pole
        makecylinder(scene, 0.1, 0.1, 8, 4, 0xAAAAAA, bx - 100, 4, bz + 15);
        makecone(scene, 0.6, 2.5, 6, 0xFF6600, bx - 100, 9, bz + 15);

        // Blast walls — low protective boxes
        makebox(scene, 20, 2, 0.8, 0x9E9E9E, bx - 80, 1, bz - 5);
        makebox(scene, 0.8, 2, 20, 0x9E9E9E, bx - 100, 1, bz + 5);

        // Seaplane on ramp suggestion — simplified hull
        makebox(scene, 16, 2, 4, 0xCCCCBB, bx - 60, 1.5, bz + 20);
        // Seaplane wings
        makebox(scene, 28, 0.5, 4, 0xBBBBAA, bx - 60, 3, bz + 20);
        // Seaplane tail fin
        makebox(scene, 0.4, 3, 3, 0xCCCCBB, bx - 68, 3.5, bz + 20);
    }

    function buildtownstreet(scene, bx, bz) {
        // Harbour town buildings — rows of simple boxes
        var i;
        var streetoffsets = [
            [-30, -25, 6, 8, 4, 0xBB9977],
            [-22, -25, 5, 7, 5, 0xAA8866],
            [-15, -25, 7, 6, 4, 0xCC9988],
            [-8, -25, 6, 9, 5, 0x998877],
            [-30, -35, 25, 5, 6, 0x887766],
            [10, -25, 6, 8, 5, 0xBBAA99]
        ];
        for (i = 0; i < streetoffsets.length; i++) {
            var s = streetoffsets[i];
            makebox(scene, s[2], s[3], s[4], s[5], bx + s[0], s[3] / 2, bz + s[1]);
        }

        // Harbour wall — long stone box
        makebox(scene, 80, 3, 2, 0x888878, bx - 10, 1.5, bz - 10);
        makebox(scene, 2, 3, 40, 0x888878, bx - 50, 1.5, bz + 10);

        // Lamp posts along harbour
        for (i = 0; i < 6; i++) {
            makecylinder(scene, 0.1, 0.12, 5, 4, 0x555555, bx - 40 + i * 12, 2.5, bz - 11);
            makesphere(scene, 0.3, 4, 3, 0xFFFF99, bx - 40 + i * 12, 5.5, bz - 11);
        }

        // Pier extending into loch
        makebox(scene, 3, 1.5, 40, 0x776655, bx + 20, 0.75, bz + 20);
        makebox(scene, 10, 1.5, 10, 0x776655, bx + 20, 0.75, bz + 45);
    }

    function buildedgewireframe(scene, bx, bz) {
        // Wireframe outlines for key structures to aid FPS navigation
        makewirebox(scene, 8, 14, 8, 0xFFFFAA, bx, 7, bz);
        makewirebox(scene, 35, 8, 15, 0xAAFFAA, bx + 40, 4, bz + 20);
        makewirebox(scene, 55, 10, 18, 0xAAAAFF, bx + 40, 5, bz + 50);
    }

    function create(scene) {
        var bx = WORLD_X;
        var bz = WORLD_Z;

        // Ground base for port area
        makebox(scene, 300, 0.5, 200, 0x556644, bx, -0.25, bz);

        // Castle of St John — town centre
        buildcastle(scene, bx - 30, bz - 30);

        // Ferry terminal
        buildferryterminal(scene, bx + 40, bz + 20);

        // Ro-Ro ferry in berth
        buildroroferry(scene, bx + 40, bz + 55);

        // Loch Ryan water and buoys
        buildlochryan(scene, bx, bz);

        // WWII flying boat base
        buildwwiiflyingbase(scene, bx, bz);

        // Town street and harbour
        buildtownstreet(scene, bx, bz);

        // Wireframe nav aids
        buildedgewireframe(scene, bx - 30, bz - 30);
    }

    function getspawnpoint() {
        return { x: WORLD_X, y: 2, z: WORLD_Z - 20 };
    }

    return {
        create: create,
        getspawnpoint: getspawnpoint,
        WORLD_X: WORLD_X,
        WORLD_Z: WORLD_Z
    };
}());
