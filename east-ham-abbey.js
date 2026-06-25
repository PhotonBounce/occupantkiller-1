window.EastHamAbbey = (function() {
    'use strict';

    var ROOT_X = 5320;
    var ROOT_Z = 2200;

    var sceneRef = null;
    var allObjects = [];

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ROOT_X + x, y, ROOT_Z + z);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ROOT_X + x, y, ROOT_Z + z);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ROOT_X + x, y, ROOT_Z + z);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(ROOT_X + x, y, ROOT_Z + z);
        return mesh;
    }

    function add(mesh) {
        sceneRef.add(mesh);
        allObjects.push(mesh);
    }

    // -----------------------------------------------------------------------
    // 1. Barking Abbey ruins
    // -----------------------------------------------------------------------
    function buildBarkingAbbey() {
        // Curfew Tower — ruined gate tower 6x6x12
        add(makebox(6, 12, 6, 0x888888, -180, 6, -120));

        // Foundation walls — long stretches of ancient masonry
        add(makebox(40, 2, 2, 0x888888, -170, 1, -110));
        add(makebox(2, 2, 30, 0x888888, -150, 1, -100));
        add(makebox(30, 2, 2, 0x888888, -165, 1, -85));
        add(makebox(2, 2, 20, 0x888888, -185, 1, -100));

        // Partial standing walls
        add(makebox(2, 6, 12, 0x888888, -160, 3, -108));
        add(makebox(2, 8, 8, 0x999999, -152, 4, -95));

        // Graveyard markers — small upright boxes
        add(makebox(0.4, 1.2, 0.2, 0x666666, -172, 0.6, -102));
        add(makebox(0.4, 1.0, 0.2, 0x666666, -169, 0.5, -104));
        add(makebox(0.4, 1.4, 0.2, 0x666666, -166, 0.7, -103));
        add(makebox(0.4, 1.2, 0.2, 0x666666, -163, 0.6, -101));
        add(makebox(0.4, 1.0, 0.2, 0x666666, -174, 0.5, -98));
        add(makebox(0.4, 1.3, 0.2, 0x666666, -170, 0.65, -97));
        add(makebox(0.4, 1.1, 0.2, 0x666666, -167, 0.55, -96));
        add(makebox(0.4, 1.2, 0.2, 0x666666, -164, 0.6, -99));
        add(makebox(0.4, 0.9, 0.2, 0x666666, -161, 0.45, -100));

        // Abbey grounds — low grass area indicator box
        add(makebox(60, 0.2, 50, 0x336622, -165, 0.1, -100));
    }

    // -----------------------------------------------------------------------
    // 2. East Ham Town Hall
    // -----------------------------------------------------------------------
    function buildTownHall() {
        // Main hall block — buff terracotta
        add(makebox(20, 10, 8, 0xD2B48C, -60, 5, -50));

        // Clock tower — taller central block
        add(makebox(5, 20, 5, 0xD2B48C, -60, 10, -50));

        // Dome base cylinder under cone
        add(makecylinder(3, 3.5, 3, 12, 0xD2B48C, -60, 22, -50));

        // Dome cone top
        add(makecone(3, 5, 12, 0xC8A882, -60, 26, -50));

        // Wing extensions
        add(makebox(8, 8, 8, 0xD2B48C, -75, 4, -50));
        add(makebox(8, 8, 8, 0xD2B48C, -45, 4, -50));

        // Entrance portico columns (cylinders)
        add(makecylinder(0.4, 0.4, 8, 8, 0xBEA882, -55, 4, -46));
        add(makecylinder(0.4, 0.4, 8, 8, 0xBEA882, -60, 4, -46));
        add(makecylinder(0.4, 0.4, 8, 8, 0xBEA882, -65, 4, -46));

        // Steps
        add(makebox(12, 0.5, 2, 0xC8C8B4, -60, 0.25, -45));
    }

    // -----------------------------------------------------------------------
    // 3. Stratford High Street — regeneration corridor
    // -----------------------------------------------------------------------
    function buildStratfordHighStreet() {
        // Modern apartment towers
        add(makebox(12, 40, 12, 0xE8E8E8, 20, 20, -30));
        add(makebox(10, 32, 10, 0xE8E8E8, 38, 16, -28));
        add(makebox(14, 28, 12, 0xE8E8E8, 56, 14, -32));

        // Victorian terraces — smaller, warmer brick
        add(makebox(8, 10, 6, 0xAA7755, -10, 5, -30));
        add(makebox(8, 10, 6, 0xAA7755, -20, 5, -30));
        add(makebox(8, 10, 6, 0xAA7755, -30, 5, -30));
        add(makebox(8, 10, 6, 0xAA7755, -40, 5, -30));

        // Mixed development mid-rise
        add(makebox(16, 18, 12, 0xCCBBAA, 8, 9, -30));
        add(makebox(20, 22, 14, 0xDDCCBB, -2, 11, -30));

        // Street-level retail boxes
        add(makebox(60, 4, 6, 0x888888, 10, 2, -22));
    }

    // -----------------------------------------------------------------------
    // 4. Beckton — gas works + housing estate
    // -----------------------------------------------------------------------
    function buildBeckton() {
        // Gasometer frames — large cylinder rings
        add(makecylinder(18, 18, 1, 24, 0x555555, 120, 0.5, 60));
        add(makecylinder(18, 18, 1, 24, 0x555555, 120, 8, 60));
        add(makecylinder(18, 18, 1, 24, 0x555555, 120, 16, 60));

        add(makecylinder(14, 14, 1, 24, 0x555555, 160, 0.5, 55));
        add(makecylinder(14, 14, 1, 24, 0x555555, 160, 7, 55));

        // Gasometer vertical supports (thin cylinders)
        add(makecylinder(0.4, 0.4, 18, 6, 0x444444, 102, 9, 60));
        add(makecylinder(0.4, 0.4, 18, 6, 0x444444, 138, 9, 60));
        add(makecylinder(0.4, 0.4, 18, 6, 0x444444, 120, 9, 42));
        add(makecylinder(0.4, 0.4, 18, 6, 0x444444, 120, 9, 78));

        // Massive industrial gas works building
        add(makebox(40, 15, 20, 0x444444, 120, 7.5, 100));
        add(makebox(20, 25, 20, 0x333333, 140, 12.5, 100));

        // Industrial chimney
        add(makecylinder(2, 3, 30, 8, 0x333333, 155, 15, 110));

        // Beckton housing estate — rows of houses
        add(makebox(8, 8, 6, 0xCC9977, 90, 4, 30));
        add(makebox(8, 8, 6, 0xCC9977, 100, 4, 30));
        add(makebox(8, 8, 6, 0xCC9977, 110, 4, 30));
        add(makebox(8, 8, 6, 0xCC9977, 90, 4, 20));
        add(makebox(8, 8, 6, 0xCC9977, 100, 4, 20));
        add(makebox(8, 8, 6, 0xCC9977, 110, 4, 20));

        // Taller housing blocks
        add(makebox(12, 16, 12, 0xDDBB99, 130, 8, 30));
        add(makebox(12, 20, 12, 0xDDBB99, 148, 10, 30));
    }

    // -----------------------------------------------------------------------
    // 5. Thames Barrier Park
    // -----------------------------------------------------------------------
    function buildThamesBarrierPark() {
        // Park ground
        add(makebox(30, 0.3, 20, 0x228B22, 240, 0.15, -20));

        // Pavilion
        add(makebox(8, 4, 6, 0xE8E8E8, 248, 2, -28));
        add(makebox(8, 0.4, 6, 0xAAAAAA, 248, 4.2, -28));

        // Thames Barrier piers suggestion — cylinders in distance
        add(makecylinder(2, 2, 10, 8, 0xC0C0C0, 240, 5, -50));
        add(makecylinder(2, 2, 10, 8, 0xC0C0C0, 252, 5, -50));
        add(makecylinder(2, 2, 10, 8, 0xC0C0C0, 264, 5, -50));
        add(makecylinder(2, 2, 10, 8, 0xC0C0C0, 228, 5, -50));

        // Barrier rocker arm suggestion (cone tops)
        add(makecone(3, 6, 8, 0xB0B0B0, 240, 12, -50));
        add(makecone(3, 6, 8, 0xB0B0B0, 252, 12, -50));
        add(makecone(3, 6, 8, 0xB0B0B0, 264, 12, -50));
        add(makecone(3, 6, 8, 0xB0B0B0, 228, 12, -50));

        // Park paths (thin boxes)
        add(makebox(2, 0.4, 20, 0xCCBB99, 238, 0.2, -20));
        add(makebox(2, 0.4, 20, 0xCCBB99, 255, 0.2, -20));
        add(makebox(30, 0.4, 2, 0xCCBB99, 240, 0.2, -10));

        // Benches
        add(makebox(2, 0.5, 0.5, 0x886644, 242, 0.25, -18));
        add(makebox(2, 0.5, 0.5, 0x886644, 250, 0.25, -18));
    }

    // -----------------------------------------------------------------------
    // 6. ExCeL London — exhibition centre
    // -----------------------------------------------------------------------
    function buildExCeL() {
        // Main hall — enormous
        add(makebox(50, 20, 6, 0xC0C0C0, 300, 10, 60));

        // East hall extension
        add(makebox(30, 16, 6, 0xC0C0C0, 360, 8, 60));

        // Entrance canopies (thin wide boxes)
        add(makebox(20, 0.5, 8, 0xAAAAAA, 300, 21, 60));
        add(makebox(12, 0.5, 8, 0xAAAAAA, 360, 17, 60));

        // Entrance pillars
        add(makecylinder(0.6, 0.6, 14, 8, 0x999999, 290, 7, 56));
        add(makecylinder(0.6, 0.6, 14, 8, 0x999999, 310, 7, 56));
        add(makecylinder(0.6, 0.6, 14, 8, 0x999999, 330, 7, 56));

        // Dock-facing glass frontage — reflective boxes
        add(makebox(50, 18, 1, 0x88AACC, 300, 9, 57));
        add(makebox(30, 14, 1, 0x88AACC, 360, 7, 57));

        // Loading bays at rear
        add(makebox(8, 6, 4, 0xAAAAAA, 280, 3, 65));
        add(makebox(8, 6, 4, 0xAAAAAA, 296, 3, 65));
        add(makebox(8, 6, 4, 0xAAAAAA, 312, 3, 65));
    }

    // -----------------------------------------------------------------------
    // 7. Royal Victoria Dock
    // -----------------------------------------------------------------------
    function buildRoyalVictoriaDock() {
        // Dock water body
        add(makebox(60, 0.5, 20, 0x4169E1, 300, 0.25, 40));

        // Quayside warehouses — perimeter
        add(makebox(20, 10, 6, 0xAA8866, 270, 5, 34));
        add(makebox(20, 10, 6, 0xAA8866, 294, 5, 34));
        add(makebox(20, 10, 6, 0xAA8866, 318, 5, 34));
        add(makebox(20, 10, 6, 0xAA8866, 270, 5, 52));
        add(makebox(20, 10, 6, 0xAA8866, 294, 5, 52));
        add(makebox(20, 10, 6, 0xAA8866, 318, 5, 52));

        // Dock cranes (box + cylinder combo)
        add(makebox(1, 16, 1, 0x555555, 272, 8, 40));
        add(makebox(8, 1, 1, 0x555555, 276, 16, 40));
        add(makebox(1, 16, 1, 0x555555, 326, 8, 40));
        add(makebox(8, 1, 1, 0x555555, 330, 16, 40));

        // Footbridge over dock
        add(makebox(60, 1, 2, 0xCCCCCC, 300, 12, 40));
        add(makecylinder(0.5, 0.5, 14, 6, 0xBBBBBB, 270, 7, 40));
        add(makecylinder(0.5, 0.5, 14, 6, 0xBBBBBB, 330, 7, 40));

        // Event venue building (Britannia)
        add(makebox(14, 8, 10, 0xDDDDDD, 340, 4, 40));
    }

    // -----------------------------------------------------------------------
    // 8. London City Airport
    // -----------------------------------------------------------------------
    function buildLondonCityAirport() {
        // Terminal building
        add(makebox(30, 6, 12, 0xE8E8E8, 200, 3, 100));

        // Control tower
        add(makecylinder(2, 2, 20, 8, 0xDDDDDD, 218, 10, 100));
        add(makecylinder(3.5, 3.5, 2, 8, 0xCCCCCC, 218, 21, 100));

        // Runway between dock basins — long narrow box
        add(makebox(80, 0.3, 8, 0x444444, 160, 0.15, 100));

        // Runway markings
        add(makebox(4, 0.4, 1, 0xFFFFFF, 120, 0.2, 100));
        add(makebox(4, 0.4, 1, 0xFFFFFF, 130, 0.2, 100));
        add(makebox(4, 0.4, 1, 0xFFFFFF, 140, 0.2, 100));
        add(makebox(4, 0.4, 1, 0xFFFFFF, 190, 0.2, 100));
        add(makebox(4, 0.4, 1, 0xFFFFFF, 200, 0.2, 100));

        // Parked aircraft — fuselage + wings
        add(makebox(14, 2, 2, 0xE8E8E8, 208, 1, 110));
        add(makebox(14, 0.3, 2, 0xDDDDDD, 208, 2.2, 110));
        add(makebox(10, 0.3, 8, 0xDDDDDD, 208, 1.5, 110));

        add(makebox(14, 2, 2, 0xE8E8E8, 200, 1, 115));
        add(makebox(10, 0.3, 8, 0xDDDDDD, 200, 1.5, 115));

        // Apron
        add(makebox(40, 0.2, 20, 0x555555, 200, 0.1, 110));
    }

    // -----------------------------------------------------------------------
    // 9. London Stadium / West Ham United
    // -----------------------------------------------------------------------
    function buildLondonStadium() {
        // Stadium bowl — cylinder
        add(makecylinder(20, 20, 6, 32, 0x7A0B35, 60, 3, 60));

        // Roof ring above bowl
        add(makecylinder(22, 22, 1, 32, 0x1C3F7A, 60, 7, 60));

        // Inner pitch — green
        add(makebox(30, 0.2, 18, 0x228B22, 60, 0.1, 60));

        // Floodlight masts (tall thin cylinders with sphere tops)
        add(makecylinder(0.5, 0.5, 30, 6, 0x888888, 40, 15, 42));
        add(makesphere(2, 8, 6, 0xFFFF99, 40, 32, 42));

        add(makecylinder(0.5, 0.5, 30, 6, 0x888888, 80, 15, 42));
        add(makesphere(2, 8, 6, 0xFFFF99, 80, 32, 42));

        add(makecylinder(0.5, 0.5, 30, 6, 0x888888, 40, 15, 78));
        add(makesphere(2, 8, 6, 0xFFFF99, 40, 32, 78));

        add(makecylinder(0.5, 0.5, 30, 6, 0x888888, 80, 15, 78));
        add(makesphere(2, 8, 6, 0xFFFF99, 80, 32, 78));

        // Surrounding plaza/concourse
        add(makebox(60, 0.3, 60, 0xAAAAAA, 60, 0.15, 60));

        // Ticket offices
        add(makebox(6, 3, 4, 0x7A0B35, 35, 1.5, 55));
        add(makebox(6, 3, 4, 0x7A0B35, 85, 1.5, 55));
    }

    // -----------------------------------------------------------------------
    // 10. Crossrail / Pudding Mill Lane
    // -----------------------------------------------------------------------
    function buildPuddingMillLane() {
        // Station box
        add(makebox(30, 6, 15, 0x9966CC, -20, 3, 50));

        // Crossrail purple roof band
        add(makebox(30, 1, 15, 0x7744AA, -20, 6.5, 50));

        // Station entrance canopies
        add(makebox(10, 0.4, 6, 0xAA88CC, -20, 7, 42));

        // Platform below grade (sunken box)
        add(makebox(28, 3, 6, 0x444455, -20, -1.5, 50));

        // Train tracks (dark narrow boxes)
        add(makebox(60, 0.3, 1.2, 0x222222, -20, 0.15, 49));
        add(makebox(60, 0.3, 1.2, 0x222222, -20, 0.15, 51));

        // Construction crane — box + cylinder
        add(makecylinder(0.8, 0.8, 40, 6, 0xFFAA00, -30, 20, 48));
        add(makebox(20, 0.8, 0.8, 0xFFAA00, -22, 41, 48));
        add(makebox(0.3, 20, 0.3, 0xFFAA00, -14, 31, 48));

        // Construction hoarding (perimeter fence boxes)
        add(makebox(40, 3, 0.3, 0x0055AA, -20, 1.5, 42));
        add(makebox(0.3, 3, 20, 0x0055AA, -40, 1.5, 52));
        add(makebox(0.3, 3, 20, 0x0055AA, 0, 1.5, 52));

        // Elizabeth Line signage sphere
        add(makesphere(1.5, 8, 6, 0x9966CC, -10, 8, 42));

        // Nearby infrastructure — new buildings
        add(makebox(16, 20, 12, 0xE8E8E8, -5, 10, 38));
        add(makebox(12, 14, 10, 0xDDDDDD, -24, 7, 38));
    }

    // -----------------------------------------------------------------------
    // Ground plane (box-based ground, no PlaneGeometry)
    // -----------------------------------------------------------------------
    function buildground() {
        add(makebox(600, 0.5, 600, 0x556644, 0, -0.25, 0));
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------
    function init(scene) {
        sceneRef = scene;
        allObjects = [];

        buildground();
        buildBarkingAbbey();
        buildTownHall();
        buildStratfordHighStreet();
        buildBeckton();
        buildThamesBarrierPark();
        buildExCeL();
        buildRoyalVictoriaDock();
        buildLondonCityAirport();
        buildLondonStadium();
        buildPuddingMillLane();
    }

    function update(delta) {
        // Static environment — nothing to animate
    }

    function reset() {
        var i;
        for (i = 0; i < allObjects.length; i++) {
            sceneRef.remove(allObjects[i]);
            if (allObjects[i].geometry) {
                allObjects[i].geometry.dispose();
            }
            if (allObjects[i].material) {
                allObjects[i].material.dispose();
            }
        }
        allObjects = [];
        sceneRef = null;
    }

    return { init: init, update: update, reset: reset };

}());
