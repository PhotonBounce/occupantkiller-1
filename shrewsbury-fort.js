window.ShrewsburyFort = (function() {
    'use strict';

    var WX = 3130;
    var WZ = 2200;

    function makeBox(w, h, d, color, x, y, z, scene) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z, scene) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z, scene) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z, scene) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WX + x, y, WZ + z);
        scene.add(mesh);
        return mesh;
    }

    function makeWireBox(w, h, d, color, x, y, z, scene) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var edges = new THREE.EdgesGeometry(geo);
        var mat = new THREE.LineBasicMaterial({ color: color });
        var lines = new THREE.LineSegments(edges, mat);
        lines.position.set(WX + x, y, WZ + z);
        scene.add(lines);
        return lines;
    }

    function buildCastle(scene) {
        // Main castle body — red sandstone
        makeBox(16, 12, 10, 0xB05050, -60, 6, -40, scene);

        // Square keep — taller central tower
        makeBox(8, 18, 8, 0xB05050, -60, 9, -40, scene);
        // Keep battlements top
        makeBox(9, 2, 9, 0xC06060, -60, 18.5, -40, scene);

        // Curtain wall — north side
        makeBox(30, 7, 2, 0xA04848, -60, 3.5, -50, scene);
        // Curtain wall — south side
        makeBox(30, 7, 2, 0xA04848, -60, 3.5, -30, scene);
        // Curtain wall — east side
        makeBox(2, 7, 20, 0xA04848, -45, 3.5, -40, scene);
        // Curtain wall — west side
        makeBox(2, 7, 20, 0xA04848, -75, 3.5, -40, scene);

        // Corner towers
        makeCylinder(2.5, 2.5, 9, 8, 0xA04848, -45, 4.5, -50, scene);
        makeCylinder(2.5, 2.5, 9, 8, 0xA04848, -75, 4.5, -50, scene);
        makeCylinder(2.5, 2.5, 9, 8, 0xA04848, -45, 4.5, -30, scene);
        makeCylinder(2.5, 2.5, 9, 8, 0xA04848, -75, 4.5, -30, scene);

        // Conical caps on corner towers
        makeCone(3, 4, 8, 0x883838, -45, 11, -50, scene);
        makeCone(3, 4, 8, 0x883838, -75, 11, -50, scene);
        makeCone(3, 4, 8, 0x883838, -45, 11, -30, scene);
        makeCone(3, 4, 8, 0x883838, -75, 11, -30, scene);

        // Laura's Tower folly — round cylinder
        makeCylinder(3, 3, 14, 12, 0xB05050, -80, 7, -38, scene);
        makeCone(3.5, 5, 12, 0x883838, -80, 16.5, -38, scene);

        // Castle gatehouse
        makeBox(6, 10, 4, 0x984040, -45, 5, -40, scene);

        // Gatehouse arch hint (narrower dark box)
        makeBox(2, 4, 4.1, 0x111111, -45, 2, -40, scene);

        // Castle outline edges
        makeWireBox(16, 12, 10, 0x8B2020, -60, 6, -40, scene);
    }

    function buildAbbey(scene) {
        // Main abbey nave
        makeBox(25, 14, 10, 0x9A8A78, 20, 7, -60, scene);

        // Abbey chancel (east end)
        makeBox(10, 12, 8, 0x9A8A78, 37, 6, -60, scene);

        // Abbey massive west tower
        makeBox(10, 22, 10, 0x8A7A68, 8, 11, -60, scene);

        // Tower battlements
        makeBox(11, 2, 11, 0x9A8A78, 8, 22.5, -60, scene);

        // Small turrets on tower
        makeCylinder(1.5, 1.5, 6, 8, 0x8A7A68, 3.5, 20, -55, scene);
        makeCylinder(1.5, 1.5, 6, 8, 0x8A7A68, 12.5, 20, -55, scene);
        makeCylinder(1.5, 1.5, 6, 8, 0x8A7A68, 3.5, 20, -65, scene);
        makeCylinder(1.5, 1.5, 6, 8, 0x8A7A68, 12.5, 20, -65, scene);

        // Abbey south transept
        makeBox(8, 13, 15, 0x9A8A78, 20, 6.5, -52, scene);

        // Abbey north transept
        makeBox(8, 13, 15, 0x9A8A78, 20, 6.5, -68, scene);

        // Abbey outline
        makeWireBox(25, 14, 10, 0x6A5A48, 20, 7, -60, scene);

        // Brother Cadfael's herb garden — box plots
        makeBox(4, 0.3, 4, 0x3A7A3A, 25, 0.15, -48, scene);
        makeBox(4, 0.3, 4, 0x4A8A4A, 31, 0.15, -48, scene);
        makeBox(4, 0.3, 4, 0x3A7A3A, 25, 0.15, -42, scene);
        makeBox(4, 0.3, 4, 0x4A8A4A, 31, 0.15, -42, scene);
        makeBox(4, 0.3, 4, 0x3A7A3A, 37, 0.15, -48, scene);
        makeBox(4, 0.3, 4, 0x4A8A4A, 37, 0.15, -42, scene);

        // Garden path
        makeBox(16, 0.2, 1, 0xC8B890, 31, 0.1, -45, scene);
        makeBox(1, 0.2, 12, 0xC8B890, 28, 0.1, -45, scene);
    }

    function buildTimberBuildings(scene) {
        // 8 black-and-white timber-framed buildings in market area
        // Buildings alternate dark frame vs light panel appearance

        // Building 1 — dark frame
        makeBox(7, 9, 5, 0x1A1A1A, -10, 4.5, 10, scene);
        makeBox(5, 7, 3.2, 0xF5F5F5, -10, 4.5, 10, scene);

        // Building 2 — slightly varied
        makeBox(6, 8, 6, 0x1A1A1A, -18, 4, 10, scene);
        makeBox(4, 6, 4.2, 0xF5F5F5, -18, 4, 10, scene);

        // Building 3
        makeBox(8, 10, 5, 0x1A1A1A, -10, 5, 18, scene);
        makeBox(6, 8, 3.2, 0xF5F5F5, -10, 5, 18, scene);

        // Building 4
        makeBox(6, 7, 6, 0x1A1A1A, -18, 3.5, 18, scene);
        makeBox(4.2, 5, 4.2, 0xF5F5F5, -18, 3.5, 18, scene);

        // Building 5 — Bear Steps area
        makeBox(5, 11, 5, 0x1A1A1A, 0, 5.5, 10, scene);
        makeBox(3.2, 9, 3.2, 0xF5F5F5, 0, 5.5, 10, scene);

        // Building 6
        makeBox(7, 8, 5, 0x1A1A1A, 8, 4, 10, scene);
        makeBox(5, 6, 3.2, 0xF5F5F5, 8, 4, 10, scene);

        // Building 7
        makeBox(6, 9, 6, 0x1A1A1A, 0, 4.5, 18, scene);
        makeBox(4, 7, 4.2, 0xF5F5F5, 0, 4.5, 18, scene);

        // Building 8
        makeBox(8, 8, 5, 0x1A1A1A, 8, 4, 18, scene);
        makeBox(6, 6, 3.2, 0xF5F5F5, 8, 4, 18, scene);

        // Bear Steps alley — narrow passage (dark walls)
        makeBox(1, 5, 8, 0x2A2A2A, -4, 2.5, 14, scene);
        makeBox(1, 5, 8, 0x2A2A2A, 4, 2.5, 14, scene);

        // Market square — flat ground area with cobble colour
        makeBox(20, 0.3, 15, 0xB0A090, -5, 0.15, 30, scene);

        // Market cross / column in square
        makeCylinder(0.4, 0.5, 5, 8, 0x9A8A78, -5, 2.5, 30, scene);
        makeBox(2, 0.5, 2, 0x9A8A78, -5, 5.25, 30, scene);

        // Additional street buildings along main road
        makeBox(9, 8, 5, 0x1A1A1A, 20, 4, 10, scene);
        makeBox(7, 6, 3.2, 0xF5F5F5, 20, 4, 10, scene);

        makeBox(7, 10, 5, 0x1A1A1A, 30, 5, 10, scene);
        makeBox(5, 8, 3.2, 0xF5F5F5, 30, 5, 10, scene);
    }

    function buildRiverSevern(scene) {
        // River Severn horseshoe loop — water boxes nearly encircling the town
        // The river forms a near-complete loop; town is on a peninsula

        // North river segment
        makeBox(160, 1, 18, 0x1A6B8A, 0, -0.5, -90, scene);

        // West river segment
        makeBox(18, 1, 120, 0x1A6B8A, -85, -0.5, -20, scene);

        // East river segment
        makeBox(18, 1, 120, 0x1A6B8A, 85, -0.5, -20, scene);

        // South-west curve segment
        makeBox(30, 1, 18, 0x1A6B8A, -70, -0.5, 50, scene);
        makeBox(18, 1, 30, 0x1A6B8A, -76, -0.5, 35, scene);

        // South-east curve segment
        makeBox(30, 1, 18, 0x1A6B8A, 70, -0.5, 50, scene);
        makeBox(18, 1, 30, 0x1A6B8A, 76, -0.5, 35, scene);

        // South gap (the neck of the peninsula — narrow land bridge)
        // River does not fully close here — leave gap at z=60 centre
        makeBox(35, 1, 15, 0x1A6B8A, -52, -0.5, 62, scene);
        makeBox(35, 1, 15, 0x1A6B8A, 52, -0.5, 62, scene);

        // River banks — darker strip
        makeBox(160, 0.5, 3, 0x2A5A3A, 0, 0.25, -81, scene);
        makeBox(3, 0.5, 120, 0x2A5A3A, -76, 0.25, -20, scene);
        makeBox(3, 0.5, 120, 0x2A5A3A, 76, 0.25, -20, scene);
    }

    function buildEnglishBridge(scene) {
        // English Bridge — stone bridge spanning the Severn to the east
        // Bridge deck
        makeBox(30, 3, 5, 0x9A8A78, 85, 1.5, 20, scene);

        // 7 arch piers below
        makeBox(3, 4, 5.5, 0x8A7A68, 71, 0, 20, scene);
        makeBox(3, 4, 5.5, 0x8A7A68, 76, 0, 20, scene);
        makeBox(3, 4, 5.5, 0x8A7A68, 81, 0, 20, scene);
        makeBox(3, 4, 5.5, 0x8A7A68, 86, 0, 20, scene);
        makeBox(3, 4, 5.5, 0x8A7A68, 91, 0, 20, scene);
        makeBox(3, 4, 5.5, 0x8A7A68, 96, 0, 20, scene);
        makeBox(3, 4, 5.5, 0x8A7A68, 101, 0, 20, scene);

        // Bridge parapets
        makeBox(30, 1.5, 1, 0x9A8A78, 85, 3.75, 17, scene);
        makeBox(30, 1.5, 1, 0x9A8A78, 85, 3.75, 23, scene);

        // Bridge outline
        makeWireBox(30, 3, 5, 0x6A5A48, 85, 1.5, 20, scene);
    }

    function buildDarwinStatue(scene) {
        // Darwin statue outside the library / museum
        // Column base
        makeBox(2, 1, 2, 0x8A8A8A, 10, 0.5, -10, scene);

        // Column shaft
        makeCylinder(0.5, 0.6, 5, 12, 0x9A9A9A, 10, 3.5, -10, scene);

        // Figure body (box)
        makeBox(1.2, 2.5, 0.8, 0x3A3A3A, 10, 7.25, -10, scene);

        // Figure head (sphere)
        makeSphere(0.6, 8, 8, 0xC8A878, 10, 9.1, -10, scene);

        // Hat brim on Darwin
        makeCylinder(0.8, 0.8, 0.2, 12, 0x2A2A2A, 10, 9.85, -10, scene);
        makeCylinder(0.5, 0.5, 0.6, 12, 0x2A2A2A, 10, 10.2, -10, scene);

        // Darwin's arms (small boxes)
        makeBox(1.5, 0.4, 0.4, 0x3A3A3A, 9.05, 7.8, -10, scene);
        makeBox(1.5, 0.4, 0.4, 0x3A3A3A, 10.95, 7.8, -10, scene);

        // Library building behind statue
        makeBox(18, 10, 12, 0xC0B090, 10, 5, -22, scene);
        makeBox(6, 12, 12.1, 0xB0A080, 10, 6, -22, scene);
        makeWireBox(18, 10, 12, 0x807060, 10, 5, -22, scene);
    }

    function buildGroundPlane(scene) {
        // Town ground — split into boxes covering the peninsula
        makeBox(160, 0.5, 160, 0x6B8A5A, 0, -0.25, 0, scene);

        // Road surfaces
        makeBox(5, 0.6, 100, 0x808070, 0, 0, -20, scene);
        makeBox(80, 0.6, 5, 0x808070, 0, 0, 0, scene);
        makeBox(5, 0.6, 60, 0x808070, -5, 0, 30, scene);
    }

    function buildCityWalls(scene) {
        // Remnants of medieval town walls
        // North wall segment
        makeBox(40, 6, 2, 0x9A8060, -20, 3, -78, scene);
        // West wall segment
        makeBox(2, 6, 50, 0x9A8060, -78, 3, -30, scene);
        // East wall segment
        makeBox(2, 6, 40, 0x9A8060, 78, 3, -35, scene);

        // Wall towers
        makeCylinder(3, 3, 9, 8, 0x9A8060, -20, 4.5, -78, scene);
        makeCylinder(3, 3, 9, 8, 0x9A8060, 20, 4.5, -78, scene);
        makeCylinder(3, 3, 9, 8, 0x9A8060, -78, 4.5, -30, scene);
        makeCylinder(3, 3, 9, 8, 0x9A8060, 78, 4.5, -35, scene);

        // Tower cone tops
        makeCone(3.5, 4, 8, 0x7A6040, -20, 11, -78, scene);
        makeCone(3.5, 4, 8, 0x7A6040, 20, 11, -78, scene);
        makeCone(3.5, 4, 8, 0x7A6040, -78, 11, -30, scene);
        makeCone(3.5, 4, 8, 0x7A6040, 78, 11, -35, scene);
    }

    function buildShrewsburyFort(scene) {
        buildGroundPlane(scene);
        buildRiverSevern(scene);
        buildCastle(scene);
        buildAbbey(scene);
        buildTimberBuildings(scene);
        buildEnglishBridge(scene);
        buildDarwinStatue(scene);
        buildCityWalls(scene);
    }

    return {
        build: buildShrewsburyFort,
        worldX: WX,
        worldZ: WZ
    };

}());
