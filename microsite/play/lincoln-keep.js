window.LincolnKeep = (function() {
    'use strict';

    var WX = 2950;
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

    function makesphere(scene, r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
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

    function makewire(scene, geo, color, x, y, z) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var edges = new THREE.EdgesGeometry(geo);
        var line = new THREE.LineSegments(edges, mat);
        line.position.set(WX + x, y, WZ + z);
        scene.add(line);
        return line;
    }

    // -------------------------------------------------------
    // LINCOLN CATHEDRAL
    // -------------------------------------------------------
    function buildcathedral(scene) {
        var STONE = 0xD4D0C0;
        var DARK  = 0xB0A898;
        var ROOF  = 0x7A8A7A;

        // Nave — main body
        makebox(scene, 42, 24, 16, STONE, 0, 12, 0);

        // Choir / chancel extending east
        makebox(scene, 18, 20, 14, STONE, 30, 10, 0);

        // West facade — wider front face with decorative layers
        makebox(scene, 22, 26, 3, STONE, -21, 13, -8);

        // Facade arcading row 1
        makebox(scene, 20, 4, 1, DARK, -21, 6, -9.6);
        makebox(scene, 20, 4, 1, DARK, -21, 12, -9.6);
        makebox(scene, 20, 4, 1, DARK, -21, 18, -9.6);

        // Facade arcading vertical piers
        makebox(scene, 1, 26, 1, DARK, -30, 13, -9.6);
        makebox(scene, 1, 26, 1, DARK, -25, 13, -9.6);
        makebox(scene, 1, 26, 1, DARK, -21, 13, -9.6);
        makebox(scene, 1, 26, 1, DARK, -17, 13, -9.6);
        makebox(scene, 1, 26, 1, DARK, -12, 13, -9.6);

        // West facade rose window outline (box ring)
        makebox(scene, 6, 6, 0.5, DARK, -21, 20, -9.7);
        makebox(scene, 4, 4, 0.5, 0xE8E4D0, -21, 20, -9.75);

        // Twin west towers
        makebox(scene, 8, 28, 8, STONE, -27, 14, -8);
        makebox(scene, 8, 28, 8, STONE, -15, 14, -8);

        // West tower spire caps
        makecone(scene, 4, 8, 8, ROOF, -27, 32, -8);
        makecone(scene, 4, 8, 8, ROOF, -15, 32, -8);

        // West tower battlements
        makebox(scene, 8, 2, 8, DARK, -27, 29, -8);
        makebox(scene, 8, 2, 8, DARK, -15, 29, -8);

        // Crossing / central tower — taller and wider
        makebox(scene, 10, 30, 10, STONE, 0, 15, 0);

        // Central tower upper section
        makebox(scene, 9, 8, 9, DARK, 0, 34, 0);

        // Central tower lantern cap
        makecone(scene, 5, 12, 8, ROOF, 0, 42, 0);

        // Central tower pinnacles
        makecone(scene, 1, 4, 6, ROOF, -5, 38, -5);
        makecone(scene, 1, 4, 6, ROOF,  5, 38, -5);
        makecone(scene, 1, 4, 6, ROOF, -5, 38,  5);
        makecone(scene, 1, 4, 6, ROOF,  5, 38,  5);

        // North transept
        makebox(scene, 12, 22, 10, STONE, 2, 11, -14);
        // South transept
        makebox(scene, 12, 22, 10, STONE, 2, 11,  14);

        // Transept gable ends
        makebox(scene, 12, 3, 2, DARK, 2, 23, -19);
        makebox(scene, 12, 3, 2, DARK, 2, 23,  19);

        // Chapter house — octagonal approximated by box
        makebox(scene, 12, 14, 12, STONE, 18, 7, -14);
        makecone(scene, 7, 6, 8, ROOF, 18, 17, -14);

        // South porch
        makebox(scene, 6, 10, 4, STONE, 8, 5, -12);

        // Cloisters (open arcade approximated)
        makebox(scene, 16, 8, 2, STONE, 14, 4, -10);
        makebox(scene, 2, 8, 16, STONE, 6, 4, -18);
        makebox(scene, 16, 8, 2, STONE, 14, 4, -26);
        makebox(scene, 2, 8, 16, STONE, 22, 4, -18);

        // East end — apse / Lady Chapel
        makebox(scene, 10, 16, 14, STONE, 42, 8, 0);
        makecone(scene, 6, 5, 8, ROOF, 42, 19, 0);

        // Flying buttress suggestion (small leaning boxes)
        makebox(scene, 2, 8, 2, DARK, -8, 14, -10);
        makebox(scene, 2, 8, 2, DARK, -8, 14,  10);
        makebox(scene, 2, 8, 2, DARK,  8, 14, -10);
        makebox(scene, 2, 8, 2, DARK,  8, 14,  10);

        // Nave roof ridge
        makebox(scene, 42, 2, 2, ROOF, 0, 25, 0);

        // Dean's Eye and Bishop's Eye window boxes (north/south)
        makebox(scene, 4, 5, 0.5, DARK, 2, 18, -20.5);
        makebox(scene, 4, 5, 0.5, DARK, 2, 18,  20.5);
    }

    // -------------------------------------------------------
    // LINCOLN CASTLE
    // -------------------------------------------------------
    function buildcastle(scene) {
        var CASTLE = 0x9A8A78;
        var DARK   = 0x7A6A58;
        var GATE   = 0x5A4A38;

        // Main bailey / shell wall — north
        makebox(scene, 26, 10, 2, CASTLE, -80, 5, -12);
        // South curtain wall
        makebox(scene, 26, 10, 2, CASTLE, -80, 5,  12);
        // West curtain wall
        makebox(scene, 2, 10, 26, CASTLE, -93, 5,   0);
        // East curtain wall
        makebox(scene, 2, 10, 26, CASTLE, -67, 5,   0);

        // Keep platform (motte mound)
        makebox(scene, 20, 6, 20, DARK, -80, 3,  0);

        // Main keep / hall building
        makebox(scene, 14, 10, 12, CASTLE, -80, 10, 0);

        // Keep roof
        makebox(scene, 14, 2, 12, DARK, -80, 15, 0);

        // Corner towers on keep
        makebox(scene, 3, 12, 3, DARK, -87, 11, -6);
        makebox(scene, 3, 12, 3, DARK, -73, 11, -6);
        makebox(scene, 3, 12, 3, DARK, -87, 11,  6);
        makebox(scene, 3, 12, 3, DARK, -73, 11,  6);

        // Corner tower caps
        makecone(scene, 2, 4, 6, 0x6A5A48, -87, 17, -6);
        makecone(scene, 2, 4, 6, 0x6A5A48, -73, 17, -6);
        makecone(scene, 2, 4, 6, 0x6A5A48, -87, 17,  6);
        makecone(scene, 2, 4, 6, 0x6A5A48, -73, 17,  6);

        // Observatory Tower — tall square tower on separate motte
        makebox(scene, 8, 20, 8, CASTLE, -95, 10, 10);
        makebox(scene, 8, 2, 8, DARK, -95, 21, 10);
        makecone(scene, 4, 6, 8, 0x6A5A48, -95, 25, 10);

        // Observatory Tower motte
        makebox(scene, 12, 5, 12, DARK, -95, 2.5, 10);

        // Lucy Tower — circular shell keep on second motte
        makecylinder(scene, 5, 5, 14, 12, CASTLE, -95, 7, -10);
        makecylinder(scene, 5.5, 5.5, 1.5, 12, DARK, -95, 14.5, -10);

        // Lucy Tower motte
        makecylinder(scene, 8, 10, 5, 12, DARK, -95, 2.5, -10);

        // East Gatehouse — main entrance
        makebox(scene, 6, 12, 8, DARK, -67, 6, 0);
        makebox(scene, 3, 12, 3, DARK, -68, 11,  5);
        makebox(scene, 3, 12, 3, DARK, -68, 11, -5);
        // Gate arch void (dark box inside)
        makebox(scene, 3, 6, 2, GATE, -67, 4, 0);
        // Gate tower caps
        makecone(scene, 2, 4, 6, 0x6A5A48, -68, 17,  5);
        makecone(scene, 2, 4, 6, 0x6A5A48, -68, 17, -5);

        // West Postern gate
        makebox(scene, 4, 10, 6, DARK, -93, 6, 0);
        makebox(scene, 2, 5, 1.5, GATE, -93, 4, 0);

        // Cobb Hall corner tower (NE)
        makebox(scene, 5, 14, 5, DARK, -68, 7, -12);
        makecone(scene, 3, 5, 8, 0x6A5A48, -68, 16, -12);

        // Wall walk battlements
        makebox(scene, 26, 2, 1, DARK, -80, 11, -12);
        makebox(scene, 26, 2, 1, DARK, -80, 11,  12);
        makebox(scene, 1, 2, 26, DARK, -93, 11,   0);
    }

    // -------------------------------------------------------
    // MAGNA CARTA VAULT
    // -------------------------------------------------------
    function buildmagnacarta(scene) {
        // Secure vault building
        makebox(scene, 10, 6, 8, 0x8A8A8A, -45, 3, -20);
        // Reinforced roof
        makebox(scene, 10, 1, 8, 0x6A6A6A, -45, 6.5, -20);
        // Security door
        makebox(scene, 2, 3, 0.5, 0x4A4A4A, -45, 2, -24.2);
        // Signage slab
        makebox(scene, 6, 2, 0.3, 0xB0B0B0, -45, 5, -24.3);
    }

    // -------------------------------------------------------
    // STEEP HILL
    // -------------------------------------------------------
    function buildsteephill(scene) {
        var COBBLE = 0x9A8A78;
        var i;
        // 10 cobbled segments running north up the hill from town
        for (i = 0; i < 10; i = i + 1) {
            makebox(scene, 4, 1, 6, COBBLE, -55 + (i * 0.5), i * 0.8, 30 + (i * 6));
        }
        // Shopfronts lining Steep Hill (east side)
        makebox(scene, 3, 6, 4, 0xC8B898, -52, 3, 34);
        makebox(scene, 3, 6, 4, 0xB8A888, -52, 3, 40);
        makebox(scene, 3, 6, 4, 0xC8B898, -52, 3, 46);
        makebox(scene, 3, 6, 4, 0xB8A888, -52, 3, 52);

        // Shopfronts lining Steep Hill (west side)
        makebox(scene, 3, 6, 4, 0xD0C0A0, -60, 3, 34);
        makebox(scene, 3, 6, 4, 0xC0B090, -60, 3, 40);
        makebox(scene, 3, 6, 4, 0xD0C0A0, -60, 3, 46);
    }

    // -------------------------------------------------------
    // NEWPORT ARCH
    // -------------------------------------------------------
    function buildnewportarch(scene) {
        var ROMAN = 0x8A8A78;

        // Left pier
        makebox(scene, 3, 9, 3, ROMAN, -35, 4.5, -50);
        // Right pier
        makebox(scene, 3, 9, 3, ROMAN, -29, 4.5, -50);
        // Lintel / arch head
        makebox(scene, 9, 2, 3, ROMAN, -32, 10, -50);
        // Arch voussoir detail (dark strip)
        makebox(scene, 7, 1, 2, 0x6A6A58, -32, 8.5, -50);
        // Road under arch
        makebox(scene, 7, 0.5, 4, 0x7A7A6A, -32, 0.25, -50);
        // Side walls extending from arch
        makebox(scene, 8, 5, 2, ROMAN, -43, 2.5, -50);
        makebox(scene, 8, 5, 2, ROMAN, -21, 2.5, -50);
    }

    // -------------------------------------------------------
    // BRAYFORD WHARF
    // -------------------------------------------------------
    function buildbrayford(scene) {
        var WATER = 0x1A6B8A;
        var WOOD  = 0x6B4A2A;
        var STONE = 0x8A8A78;

        // Brayford Pool — water surface boxes
        makebox(scene, 60, 0.5, 40, WATER, -120, 0, 60);
        makebox(scene, 30, 0.5, 20, WATER, -90,  0, 60);

        // Quayside stone paving
        makebox(scene, 60, 1, 10, STONE, -120, 0.5, 40);

        // Narrowboat 1
        makebox(scene, 14, 2, 3, 0x2A5A2A, -110, 1.5, 55);
        makebox(scene, 12, 1.5, 2.5, 0x1A4A1A, -110, 2.75, 55);
        makebox(scene, 3, 3, 2.5, 0x8B4513, -116, 2, 55);

        // Narrowboat 2
        makebox(scene, 14, 2, 3, 0x8B0000, -130, 1.5, 58);
        makebox(scene, 12, 1.5, 2.5, 0x6B0000, -130, 2.75, 58);
        makebox(scene, 3, 3, 2.5, 0x8B4513, -136, 2, 58);

        // Narrowboat 3 — moored beside wharf
        makebox(scene, 14, 2, 3, 0x00008B, -120, 1.5, 48);
        makebox(scene, 12, 1.5, 2.5, 0x00006B, -120, 2.75, 48);
        makebox(scene, 3, 3, 2.5, 0x8B4513, -126, 2, 48);

        // Waterside warehouse 1
        makebox(scene, 18, 10, 8, 0xC8B898, -110, 5, 35);
        makebox(scene, 18, 2, 8, 0x8B6A4A, -110, 11, 35);

        // Waterside warehouse 2
        makebox(scene, 14, 12, 8, 0xB0A088, -132, 6, 35);
        makebox(scene, 14, 2, 8, 0x8B6A4A, -132, 13, 35);

        // Warehouse loading doors
        makebox(scene, 4, 5, 0.5, 0x4A3A2A, -110, 3.5, 31.3);
        makebox(scene, 4, 5, 0.5, 0x4A3A2A, -132, 3.5, 31.3);

        // Mooring posts
        makecylinder(scene, 0.3, 0.3, 3, 6, WOOD, -115, 1.5, 43);
        makecylinder(scene, 0.3, 0.3, 3, 6, WOOD, -105, 1.5, 43);
        makecylinder(scene, 0.3, 0.3, 3, 6, WOOD, -125, 1.5, 43);
        makecylinder(scene, 0.3, 0.3, 3, 6, WOOD, -135, 1.5, 43);

        // Footbridge over wharf channel
        makebox(scene, 12, 1, 2, STONE, -100, 2, 55);
        makebox(scene, 1, 4, 2, STONE, -94, 2, 55);
        makebox(scene, 1, 4, 2, STONE, -106, 2, 55);

        // Brayford Head pub / cafe building
        makebox(scene, 10, 8, 8, 0xD0C0A0, -145, 4, 35);
        makebox(scene, 10, 2, 8, 0xA08060, -145, 9, 35);
        // Sign board
        makebox(scene, 6, 2, 0.3, 0x8B4513, -145, 9, 31.3);
    }

    // -------------------------------------------------------
    // HILL PLATFORM (terrain rise)
    // -------------------------------------------------------
    function buildhill(scene) {
        // Main hill plateau on which cathedral and castle sit
        makebox(scene, 120, 4, 80, 0x7A8A5A, -40, -2, 0);
        // Hill sides — rough grassy slopes
        makebox(scene, 120, 3, 10, 0x8A9A6A, -40, -4, 42);
        makebox(scene, 120, 3, 10, 0x8A9A6A, -40, -4, -42);
        makebox(scene, 10, 3, 80, 0x8A9A6A, 22, -4, 0);
        makebox(scene, 10, 3, 80, 0x8A9A6A, -102, -4, 0);
    }

    // -------------------------------------------------------
    // MAIN INIT
    // -------------------------------------------------------
    function init(scene) {
        buildhill(scene);
        buildcathedral(scene);
        buildcastle(scene);
        buildmagnacarta(scene);
        buildsteephill(scene);
        buildnewportarch(scene);
        buildbrayford(scene);
    }

    return {
        init: init
    };

}());
