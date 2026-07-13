window.GirvanBase = (function() {
    'use strict';

    var WX = 2290;
    var WZ = 2200;

    function makebox(scene, w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function makecylinder(scene, rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function makesphere(scene, r, wsegs, hsegs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, wsegs, hsegs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function makecone(scene, r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    }

    function buildlighthouse(scene) {
        // Main lighthouse tower — white cylinder r=2, h=22
        makecylinder(scene, 2, 2, 22, 12, 0xF5F5F5, -120, 11, -80);

        // Keeper's cottage — box at base
        makebox(scene, 8, 5, 6, 0xF5F5F5, -114, 2.5, -80);
        // Cottage roof
        makecone(scene, 5, 3, 4, 0xCC4444, -114, 6.5, -80);

        // Red lantern room cylinder at top
        makecylinder(scene, 2.5, 2.5, 3, 12, 0xCC2222, -120, 24.5, -80);

        // Lantern dome
        makesphere(scene, 2, 8, 6, 0xDDDDDD, -120, 27, -80);

        // Headland ground mound
        makebox(scene, 20, 3, 20, 0x6B7C4A, -120, -0.5, -80);

        // Lighthouse wire-frame detail lines
        var ledgegeo = new THREE.CylinderGeometry(2.8, 2.8, 0.4, 12);
        var edgemat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var ledge = new THREE.Mesh(ledgegeo, edgemat);
        ledge.position.set(WX + -120, 23, WZ + -80);
        scene.add(ledge);
    }

    function buildcastleruins(scene) {
        // Crumbling clifftop tower — irregular box fragments 0x7A7A7A
        // Main broken tower body
        makebox(scene, 7, 14, 7, 0x7A7A7A, -105, 7, -95);
        // Broken upper chunk
        makebox(scene, 5, 5, 4, 0x6E6E6E, -103, 16, -94);
        // Fallen wall fragment
        makebox(scene, 8, 3, 2, 0x7A7A7A, -110, 1.5, -90);
        // Rubble pile
        makebox(scene, 5, 2, 5, 0x6A6A6A, -108, 1, -97);
        // Side wall remnant
        makebox(scene, 2, 9, 6, 0x7A7A7A, -101, 4.5, -95);
        // Clifftop base
        makebox(scene, 25, 4, 20, 0x5A6B3A, -105, -2, -95);
        // Stone scatter
        makebox(scene, 2, 1, 2, 0x808080, -115, 0.5, -88);
        makebox(scene, 1.5, 1, 1.5, 0x787878, -112, 0.5, -100);
        makebox(scene, 1, 1.5, 1, 0x7A7A7A, -100, 0.5, -101);
    }

    function buildharbour(scene) {
        // Stone pier — box 30x3x6
        makebox(scene, 30, 3, 6, 0x888888, 0, 1.5, 20);

        // Breakwater arm
        makebox(scene, 5, 3, 22, 0x888888, 14.5, 1.5, 9);

        // Harbour wall sides
        makebox(scene, 30, 2, 1, 0x777777, 0, 3.5, 17);
        makebox(scene, 30, 2, 1, 0x777777, 0, 3.5, 23);

        // Mooring posts
        makecylinder(scene, 0.3, 0.3, 3, 6, 0x555555, -12, 3, 17);
        makecylinder(scene, 0.3, 0.3, 3, 6, 0x555555, -6, 3, 17);
        makecylinder(scene, 0.3, 0.3, 3, 6, 0x555555, 0, 3, 17);
        makecylinder(scene, 0.3, 0.3, 3, 6, 0x555555, 6, 3, 17);
        makecylinder(scene, 0.3, 0.3, 3, 6, 0x555555, 12, 3, 17);

        // Fishing boat 1 — hull box 8x2x3
        makebox(scene, 8, 2, 3, 0x2255AA, -10, 2, 15);
        // Boat 1 cabin
        makebox(scene, 3, 2, 2.5, 0xCCCCCC, -9, 4, 15);
        // Boat 1 mast
        makecylinder(scene, 0.15, 0.15, 8, 6, 0x885522, -10, 7, 15);

        // Fishing boat 2
        makebox(scene, 8, 2, 3, 0x22AA55, -1, 2, 15);
        // Boat 2 cabin
        makebox(scene, 3, 2, 2.5, 0xDDDDCC, 0, 4, 15);
        // Boat 2 mast
        makecylinder(scene, 0.15, 0.15, 8, 6, 0x885522, -1, 7, 15);

        // Fishing boat 3
        makebox(scene, 8, 2, 3, 0xAA5522, 8, 2, 15);
        makebox(scene, 3, 2, 2.5, 0xCCCCBB, 9, 4, 15);
        makecylinder(scene, 0.15, 0.15, 8, 6, 0x885522, 8, 7, 15);

        // Fish market shed
        makebox(scene, 18, 5, 10, 0xAAAAAA, -5, 2.5, 30);
        // Shed roof
        makebox(scene, 19, 1, 11, 0x666666, -5, 5.5, 30);
        // Shed door
        makebox(scene, 3, 4, 0.5, 0x884422, -5, 2, 25.5);

        // Harbour beacon
        makecylinder(scene, 0.4, 0.4, 5, 6, 0xFF4444, 16, 4.5, 8);
        makesphere(scene, 0.6, 6, 4, 0xFF2222, 16, 7.5, 8);
    }

    function buildballantrae(scene) {
        // Row of whitewashed cottages along coastal road
        var cottagepositions = [
            [-60, 50],
            [-48, 50],
            [-36, 50],
            [-24, 50],
            [-12, 50],
            [0, 50]
        ];
        var i;
        for (i = 0; i < cottagepositions.length; i++) {
            var cx = cottagepositions[i][0];
            var cz = cottagepositions[i][1];
            // Cottage body
            makebox(scene, 9, 5, 7, 0xF0F0F0, cx, 2.5, cz);
            // Cottage roof
            makebox(scene, 9.5, 1, 7.5, 0x884444, cx, 5.5, cz);
            makecone(scene, 5, 3, 4, 0x884444, cx, 7.5, cz);
            // Chimney
            makecylinder(scene, 0.4, 0.4, 3, 6, 0x888888, cx + 2.5, 8.5, cz);
            // Door
            makebox(scene, 1.5, 3, 0.3, 0x664422, cx, 1.5, cz - 3.5);
            // Windows
            makebox(scene, 1.5, 1.5, 0.3, 0x88AACC, cx - 2.5, 3, cz - 3.5);
            makebox(scene, 1.5, 1.5, 0.3, 0x88AACC, cx + 2.5, 3, cz - 3.5);
        }

        // Coastal road
        makebox(scene, 80, 0.3, 6, 0x555555, -36, 0.15, 56);

        // Bridge over River Stinchar
        makebox(scene, 14, 1.5, 6, 0x888888, -36, 0.75, 70);
        // Bridge arch supports
        makebox(scene, 1.5, 3, 6, 0x777777, -40, -0.5, 70);
        makebox(scene, 1.5, 3, 6, 0x777777, -32, -0.5, 70);
        // Bridge railings
        makebox(scene, 14, 1, 0.3, 0x666666, -36, 1.75, 67);
        makebox(scene, 14, 1, 0.3, 0x666666, -36, 1.75, 73);

        // River Stinchar channel (dark box representing water surface)
        makebox(scene, 16, 0.2, 10, 0x336688, -36, 0.1, 70);

        // Village shop
        makebox(scene, 11, 6, 8, 0xEEEEDD, 14, 3, 50);
        makebox(scene, 11.5, 1, 8.5, 0x666644, 14, 6.5, 50);
        // Shop sign board
        makebox(scene, 7, 1.5, 0.3, 0xFFCC44, 14, 5, 46.1);
    }

    function buildseastack(scene) {
        // Bennane Head sea stack — dramatic rock column box stack 3x18x3
        makebox(scene, 3, 18, 3, 0x5A5A5A, 60, 9, -30);
        // Stack top cap (slightly wider for drama)
        makebox(scene, 4, 2, 4, 0x4A4A4A, 60, 19, -30);
        // Stack base (wider at sea level)
        makebox(scene, 5, 4, 5, 0x5A5A5A, 60, 2, -30);
        // Sea foam / rock scatter at base
        makebox(scene, 7, 0.5, 7, 0xCCCCCC, 60, -0.25, -30);
        // Nearby smaller stacks
        makebox(scene, 1.5, 8, 1.5, 0x5A5A5A, 64, 4, -28);
        makebox(scene, 1, 5, 1, 0x5A5A5A, 57, 2.5, -33);
        // Clifftop headland connection
        makebox(scene, 12, 3, 8, 0x4A5A3A, 53, 1.5, -30);
    }

    function buildswallowcave(scene) {
        // Swallow cave — coastal sea cave with overhanging rock box and dark gap
        // Main cliff overhang
        makebox(scene, 14, 8, 6, 0x666666, 40, 4, -10);
        // Cave roof overhang extending forward
        makebox(scene, 14, 3, 4, 0x5A5A5A, 40, 6.5, -13);
        // Dark cave interior (very dark box)
        makebox(scene, 10, 5, 3, 0x111111, 40, 2.5, -8);
        // Cave floor
        makebox(scene, 12, 0.5, 5, 0x555555, 40, 0.25, -10);
        // Stalactite-like formations (small cones hanging)
        makecone(scene, 0.4, 2, 6, 0x555555, 38, 5.5, -9);
        makecone(scene, 0.3, 1.5, 6, 0x555555, 40, 6, -9);
        makecone(scene, 0.35, 1.8, 6, 0x555555, 42, 5.5, -9);
        // Smugglers' landing ledge (flat box inside)
        makebox(scene, 6, 0.4, 2, 0x4A4A4A, 40, 1.2, -7);
        // Rock scatter at cave mouth
        makebox(scene, 2, 1, 2, 0x666666, 34, 0.5, -12);
        makebox(scene, 1.5, 0.8, 1.5, 0x606060, 46, 0.4, -12);
        makebox(scene, 1, 1.2, 1, 0x5A5A5A, 36, 0.6, -8);
    }

    function buildcoastalterrain(scene) {
        // Coastal cliff edge sections
        makebox(scene, 80, 6, 12, 0x4A5A3A, -20, 3, -20);
        makebox(scene, 60, 4, 10, 0x3A4A2A, 40, 2, -20);
        // Sea surface (dark blue-green)
        makebox(scene, 200, 0.4, 80, 0x1A4466, 0, -0.2, -60);
        // Coastal scrubland
        makebox(scene, 100, 0.5, 40, 0x4A6A3A, -20, 0.25, 10);
        // Beach strip
        makebox(scene, 60, 0.3, 8, 0xCCBB99, -10, 0.15, -5);
        // Scattered coastal rocks
        makebox(scene, 3, 2, 3, 0x5A5A5A, 20, 1, -8);
        makebox(scene, 2, 1.5, 2, 0x606060, 30, 0.75, -5);
        makebox(scene, 4, 2.5, 3, 0x585858, -30, 1.25, -12);
        makebox(scene, 2, 1, 2, 0x5A5A5A, 50, 0.5, -6);
    }

    function init(scene) {
        buildcoastalterrain(scene);
        buildlighthouse(scene);
        buildcastleruins(scene);
        buildharbour(scene);
        buildballantrae(scene);
        buildseastack(scene);
        buildswallowcave(scene);
    }

    return {
        init: init,
        worldX: WX,
        worldZ: WZ
    };

}());
