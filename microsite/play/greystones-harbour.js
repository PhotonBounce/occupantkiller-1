window.GreystonesHarbour = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 19160;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            BASE_X + (x || 0),
            BASE_Y + (y || 0),
            BASE_Z + (z || 0)
        );
        if (rx || ry || rz) {
            mesh.rotation.set(rx || 0, ry || 0, rz || 0);
        }
        if (sx !== undefined) {
            mesh.scale.set(sx || 1, sy || 1, sz || 1);
        }
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildSeabed();
        buildIrishSea();
        buildHarbourBasin();
        buildNorthPierArm();
        buildSouthPierArm();
        buildPierWalls();
        buildShingleBeach();
        buildWaveFroth();
        buildFishingBoats();
        buildHarbourBar();
        buildDartStation();
        buildTownCentre();
        buildHappyPear();
        buildCliffRailwayRemnants();
        buildWicklowMountains();
        buildCharleslandHousing();
        buildSailingYachts();
        buildHarbourLights();
        buildGroyne();
        buildSlipway();
        buildRockyOutcrops();
    }

    function buildSeabed() {
        // Flat seabed under everything using box
        makeMesh(new THREE.BoxGeometry(600, 2, 800), 0x4a7a4a, 0, -1, 0);
    }

    function buildIrishSea() {
        // Main Irish Sea water mass to the east
        makeMesh(new THREE.BoxGeometry(400, 4, 800), 0x1E6BA8, 220, 1, 0);
        // Deeper sea further out
        makeMesh(new THREE.BoxGeometry(200, 4, 800), 0x155a8a, 380, 0.5, 0);
        // Sea surface shimmer strips
        makeMesh(new THREE.BoxGeometry(390, 0.5, 4), 0x4a9fd4, 200, 3.5, -80);
        makeMesh(new THREE.BoxGeometry(390, 0.5, 4), 0x4a9fd4, 200, 3.5, 20);
        makeMesh(new THREE.BoxGeometry(390, 0.5, 4), 0x4a9fd4, 200, 3.5, 120);
    }

    function buildHarbourBasin() {
        // Calm blue harbour water inside pier arms
        makeMesh(new THREE.BoxGeometry(120, 3, 90), 0x006994, 80, 1, 0);
        // Harbour floor mud/silt
        makeMesh(new THREE.BoxGeometry(118, 1, 88), 0x5c4a2a, 80, -0.5, 0);
        // Inner harbour reflection
        makeMesh(new THREE.BoxGeometry(115, 0.3, 85), 0x2288bb, 80, 2, 0);
    }

    function buildNorthPierArm() {
        // Main north pier arm - long stone wall running east
        makeMesh(new THREE.BoxGeometry(130, 6, 12), 0x696969, 65, 3, -52);
        // Pier arm cap stones
        makeMesh(new THREE.BoxGeometry(130, 2, 10), 0x808080, 65, 7, -52);
        // North pier lighthouse base
        makeMesh(new THREE.CylinderGeometry(3, 4, 10, 8), 0x808080, 130, 5, -52);
        // Lighthouse tower
        makeMesh(new THREE.CylinderGeometry(1.5, 3, 8, 8), 0xFFFFFF, 130, 14, -52);
        // Lighthouse light housing
        makeMesh(new THREE.CylinderGeometry(2, 1.5, 2, 8), 0xCC0000, 130, 19, -52);
        // Lighthouse cap
        makeMesh(new THREE.ConeGeometry(2.2, 3, 8), 0x333333, 130, 22, -52);
        // Elbow section of north pier (turns south at head)
        makeMesh(new THREE.BoxGeometry(12, 6, 30), 0x696969, 130, 3, -38);
        makeMesh(new THREE.BoxGeometry(10, 2, 28), 0x808080, 130, 7, -38);
    }

    function buildSouthPierArm() {
        // South pier arm
        makeMesh(new THREE.BoxGeometry(110, 6, 12), 0x696969, 55, 3, 52);
        makeMesh(new THREE.BoxGeometry(110, 2, 10), 0x808080, 55, 7, 52);
        // South pier head with green light
        makeMesh(new THREE.CylinderGeometry(2.5, 3.5, 8, 8), 0x808080, 110, 4, 52);
        makeMesh(new THREE.CylinderGeometry(1.2, 2.5, 6, 8), 0xFFFFFF, 110, 11, 52);
        makeMesh(new THREE.CylinderGeometry(1.8, 1.2, 2, 8), 0x00AA00, 110, 16, 52);
        makeMesh(new THREE.ConeGeometry(2, 2.5, 8), 0x333333, 110, 18.5, 52);
        // Elbow turns north
        makeMesh(new THREE.BoxGeometry(12, 6, 28), 0x696969, 110, 3, 38);
        makeMesh(new THREE.BoxGeometry(10, 2, 26), 0x808080, 110, 7, 38);
    }

    function buildPierWalls() {
        // Western end pier wall connecting north and south
        makeMesh(new THREE.BoxGeometry(12, 6, 50), 0x696969, 0, 3, 0);
        makeMesh(new THREE.BoxGeometry(10, 2, 48), 0x808080, 0, 7, 0);
        // Bollards along north pier
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 6), 0x333333, 30, 8, -52);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 6), 0x333333, 60, 8, -52);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 6), 0x333333, 90, 8, -52);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 6), 0x333333, 120, 8, -52);
        // Bollards along south pier
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 6), 0x333333, 30, 8, 52);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 6), 0x333333, 60, 8, 52);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 6), 0x333333, 90, 8, 52);
    }

    function buildShingleBeach() {
        // Greystones North Beach - shingle/pebble beach running north-south
        makeMesh(new THREE.BoxGeometry(60, 3, 200), 0x696969, -40, 1, 0);
        // Beach texture variation - darker shingle patches
        makeMesh(new THREE.BoxGeometry(20, 0.5, 60), 0x555555, -35, 2.8, -50);
        makeMesh(new THREE.BoxGeometry(15, 0.5, 40), 0x777777, -50, 2.8, 30);
        makeMesh(new THREE.BoxGeometry(25, 0.5, 50), 0x606060, -30, 2.8, 70);
        // Upper beach berm
        makeMesh(new THREE.BoxGeometry(55, 4, 180), 0x706060, -55, 3, 0);
        // Beach access path
        makeMesh(new THREE.BoxGeometry(6, 0.5, 30), 0x8a7a6a, -20, 3, 0);
    }

    function buildWaveFroth() {
        // White wave froth lines on beach
        makeMesh(new THREE.BoxGeometry(60, 0.4, 3), 0xFFFAF0, -40, 2.6, -90);
        makeMesh(new THREE.BoxGeometry(55, 0.4, 2), 0xFFFAF0, -38, 2.6, -70);
        makeMesh(new THREE.BoxGeometry(65, 0.4, 3), 0xFFFAF0, -42, 2.6, -40);
        makeMesh(new THREE.BoxGeometry(60, 0.4, 2), 0xFFFAF0, -40, 2.6, 0);
        makeMesh(new THREE.BoxGeometry(58, 0.4, 3), 0xFFFAF0, -39, 2.6, 50);
        makeMesh(new THREE.BoxGeometry(62, 0.4, 2), 0xFFFAF0, -41, 2.6, 90);
        // Breaking wave caps on sea surface
        makeMesh(new THREE.BoxGeometry(80, 0.4, 3), 0xFFFAF0, 60, 3.5, -110);
        makeMesh(new THREE.BoxGeometry(70, 0.4, 2), 0xFFFAF0, 50, 3.5, 110);
    }

    function buildFishingBoats() {
        // Boat 1 - red fishing trawler
        makeMesh(new THREE.BoxGeometry(14, 3, 5), 0xCC0000, 70, 3.5, -20);
        makeMesh(new THREE.BoxGeometry(12, 1, 4), 0x8B0000, 70, 5.5, -20);
        makeMesh(new THREE.BoxGeometry(4, 5, 3), 0xCCCCCC, 66, 7, -20);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 5), 0x333333, 72, 11, -20);

        // Boat 2 - green trawler
        makeMesh(new THREE.BoxGeometry(12, 3, 5), 0x228B22, 90, 3.5, -10);
        makeMesh(new THREE.BoxGeometry(10, 1, 4), 0x145214, 90, 5.5, -10);
        makeMesh(new THREE.BoxGeometry(3, 4, 3), 0xBBBBBB, 87, 6.5, -10);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 9, 5), 0x444444, 92, 10.5, -10);

        // Boat 3 - blue trawler
        makeMesh(new THREE.BoxGeometry(13, 3, 5), 0x1E6BA8, 75, 3.5, 15);
        makeMesh(new THREE.BoxGeometry(11, 1, 4), 0x124f80, 75, 5.5, 15);
        makeMesh(new THREE.BoxGeometry(3, 4, 3), 0xDDDDDD, 72, 6.5, 15);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 5), 0x555555, 77, 10, 15);

        // Boat 4 - red and white
        makeMesh(new THREE.BoxGeometry(10, 2.5, 4), 0xCC0000, 95, 3.5, 20);
        makeMesh(new THREE.BoxGeometry(8, 1, 3.5), 0xFFFFFF, 95, 5.2, 20);
        makeMesh(new THREE.BoxGeometry(2.5, 3.5, 2.5), 0xCCCCCC, 93, 6, 20);

        // Boat 5 - small green dinghy
        makeMesh(new THREE.BoxGeometry(6, 2, 3), 0x228B22, 85, 3, 30);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 5, 5), 0x8B4513, 85, 7, 30);

        // Mooring ropes (thin boxes)
        makeMesh(new THREE.BoxGeometry(0.2, 0.2, 35), 0x8B4513, 70, 4.5, -2);
        makeMesh(new THREE.BoxGeometry(0.2, 0.2, 28), 0x8B4513, 85, 4.5, 10);
    }

    function buildHarbourBar() {
        // The Harbour Bar - famous pub right on the harbour edge
        // Main building
        makeMesh(new THREE.BoxGeometry(18, 10, 12), 0xCD5C5C, -8, 5, -70);
        // White rendered upper storey
        makeMesh(new THREE.BoxGeometry(18, 5, 12), 0xF5F5DC, -8, 12, -70);
        // Roof
        makeMesh(new THREE.BoxGeometry(20, 2, 14), 0x333333, -8, 15.5, -70);
        // Ridge tiles
        makeMesh(new THREE.BoxGeometry(20, 1, 2), 0x555555, -8, 16.5, -70);
        // Pub sign fascia
        makeMesh(new THREE.BoxGeometry(16, 2, 1), 0x8B0000, -8, 8, -63.5);
        // Chimney stack
        makeMesh(new THREE.BoxGeometry(2, 5, 2), 0xCC5555, 0, 18, -70);
        makeMesh(new THREE.CylinderGeometry(1.2, 1, 1, 8), 0x555555, 0, 21, -70);
        // Pub windows (dark)
        makeMesh(new THREE.BoxGeometry(2.5, 2.5, 0.5), 0x2244AA, -14, 7, -64);
        makeMesh(new THREE.BoxGeometry(2.5, 2.5, 0.5), 0x2244AA, -8, 7, -64);
        makeMesh(new THREE.BoxGeometry(2.5, 2.5, 0.5), 0x2244AA, -2, 7, -64);
        // Pub door
        makeMesh(new THREE.BoxGeometry(2, 4, 0.5), 0x5C3317, -8, 3, -64);
        // Beer garden wall
        makeMesh(new THREE.BoxGeometry(20, 2, 1), 0xCD5C5C, -8, 1.5, -58);
        makeMesh(new THREE.BoxGeometry(1, 2, 8), 0xCD5C5C, -18, 1.5, -62);
        makeMesh(new THREE.BoxGeometry(1, 2, 8), 0xCD5C5C, 2, 1.5, -62);
    }

    function buildDartStation() {
        // Greystones DART station - Victorian red brick
        // Main station building
        makeMesh(new THREE.BoxGeometry(25, 8, 14), 0xCD5C5C, -80, 4, -40);
        // Station canopy roof
        makeMesh(new THREE.BoxGeometry(28, 2, 6), 0x444444, -80, 9, -34);
        // Roof gable
        makeMesh(new THREE.BoxGeometry(25, 4, 2), 0xCD5C5C, -80, 10, -40);
        // Station clock tower
        makeMesh(new THREE.BoxGeometry(5, 14, 5), 0xBB4444, -68, 7, -40);
        makeMesh(new THREE.BoxGeometry(6, 2, 6), 0x333333, -68, 15, -40);
        makeMesh(new THREE.ConeGeometry(3.5, 4, 4), 0x555555, -68, 18, -40);
        // Platform
        makeMesh(new THREE.BoxGeometry(40, 1, 4), 0xAAAAAA, -80, 0.5, -30);
        // Station windows
        makeMesh(new THREE.BoxGeometry(2, 3, 0.5), 0x88AACC, -75, 5, -33);
        makeMesh(new THREE.BoxGeometry(2, 3, 0.5), 0x88AACC, -80, 5, -33);
        makeMesh(new THREE.BoxGeometry(2, 3, 0.5), 0x88AACC, -85, 5, -33);
        // Station entrance arch
        makeMesh(new THREE.BoxGeometry(4, 6, 1), 0xAA3333, -80, 4, -33);
        // Rail tracks (thin boxes)
        makeMesh(new THREE.BoxGeometry(50, 0.3, 1.4), 0x555555, -80, 0.2, -26);
        makeMesh(new THREE.BoxGeometry(50, 0.3, 1.4), 0x555555, -80, 0.2, -23);
        // Sleepers
        makeMesh(new THREE.BoxGeometry(1, 0.4, 6), 0x6B4226, -70, 0.3, -24.5);
        makeMesh(new THREE.BoxGeometry(1, 0.4, 6), 0x6B4226, -80, 0.3, -24.5);
        makeMesh(new THREE.BoxGeometry(1, 0.4, 6), 0x6B4226, -90, 0.3, -24.5);
    }

    function buildTownCentre() {
        // Georgian-Victorian shopfronts along main street
        // Row of shops - south side
        makeMesh(new THREE.BoxGeometry(15, 9, 10), 0xCD5C5C, -100, 4.5, 10);
        makeMesh(new THREE.BoxGeometry(15, 9, 10), 0xBB6644, -115, 4.5, 10);
        makeMesh(new THREE.BoxGeometry(15, 9, 10), 0xCC7766, -130, 4.5, 10);
        makeMesh(new THREE.BoxGeometry(15, 9, 10), 0xAA5555, -145, 4.5, 10);
        // Shop roofs
        makeMesh(new THREE.BoxGeometry(16, 2, 11), 0x333333, -100, 10, 10);
        makeMesh(new THREE.BoxGeometry(16, 2, 11), 0x333333, -115, 10, 10);
        makeMesh(new THREE.BoxGeometry(16, 2, 11), 0x333333, -130, 10, 10);
        makeMesh(new THREE.BoxGeometry(16, 2, 11), 0x333333, -145, 10, 10);
        // Shop awnings
        makeMesh(new THREE.BoxGeometry(14, 1, 3), 0x228B22, -100, 5.5, 6);
        makeMesh(new THREE.BoxGeometry(14, 1, 3), 0xCC0000, -115, 5.5, 6);
        makeMesh(new THREE.BoxGeometry(14, 1, 3), 0x1E6BA8, -130, 5.5, 6);
        // Pavement
        makeMesh(new THREE.BoxGeometry(65, 0.5, 4), 0xCCCCCC, -122, 0.5, 4);
        // Road
        makeMesh(new THREE.BoxGeometry(80, 0.3, 8), 0x444444, -120, 0.2, 0);
        // Chimneys on shops
        makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0xCC5555, -100, 12, 10);
        makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0xCC5555, -115, 12, 10);
        makeMesh(new THREE.BoxGeometry(1.5, 4, 1.5), 0xCC5555, -130, 12, 10);
    }

    function buildHappyPear() {
        // The Happy Pear - famous local organic cafe, distinctive green branding
        // Main cafe building
        makeMesh(new THREE.BoxGeometry(14, 8, 10), 0x556B2F, -100, 4, 40);
        makeMesh(new THREE.BoxGeometry(14, 3, 10), 0xFFFAF0, -100, 9.5, 40);
        // Roof
        makeMesh(new THREE.BoxGeometry(15, 2, 11), 0x333333, -100, 12, 40);
        // Sign board (bright green)
        makeMesh(new THREE.BoxGeometry(12, 2.5, 0.5), 0x2E8B57, -100, 7, 35.2);
        // Outdoor seating area
        makeMesh(new THREE.BoxGeometry(12, 0.4, 10), 0xCCBBAA, -100, 0.3, 28);
        // Table tops
        makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 6), 0x8B4513, -105, 1.5, 26);
        makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 6), 0x8B4513, -100, 1.5, 26);
        makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.4, 6), 0x8B4513, -95, 1.5, 26);
        // Table legs
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 5), 0x555533, -105, 0.8, 26);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 5), 0x555533, -100, 0.8, 26);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 5), 0x555533, -95, 0.8, 26);
        // Plant pots / greenery outside
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 1.2, 6), 0x8B4513, -107, 0.8, 35);
        makeMesh(new THREE.SphereGeometry(1.2, 6, 6), 0x228B22, -107, 2.2, 35);
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 1.2, 6), 0x8B4513, -93, 0.8, 35);
        makeMesh(new THREE.SphereGeometry(1.2, 6, 6), 0x228B22, -93, 2.2, 35);
    }

    function buildCliffRailwayRemnants() {
        // Old Greystones-Bray cliff railway - ruins/remnants on cliff face
        // Cliff face
        makeMesh(new THREE.BoxGeometry(8, 25, 100), 0x888888, 30, 12, -150);
        // Ruined track sections (box remnants on cliff)
        makeMesh(new THREE.BoxGeometry(1, 1, 15), 0x555555, 28, 4, -130);
        makeMesh(new THREE.BoxGeometry(1, 1, 15), 0x555555, 32, 4, -130);
        makeMesh(new THREE.BoxGeometry(1, 1, 15), 0x555555, 28, 8, -155);
        makeMesh(new THREE.BoxGeometry(1, 1, 15), 0x555555, 32, 8, -155);
        makeMesh(new THREE.BoxGeometry(1, 1, 15), 0x555555, 28, 13, -180);
        makeMesh(new THREE.BoxGeometry(1, 1, 15), 0x555555, 32, 13, -180);
        // Ruined sleepers
        makeMesh(new THREE.BoxGeometry(6, 0.5, 1), 0x6B4226, 30, 4, -125);
        makeMesh(new THREE.BoxGeometry(6, 0.5, 1), 0x6B4226, 30, 4, -135);
        makeMesh(new THREE.BoxGeometry(6, 0.5, 1), 0x6B4226, 30, 8, -150);
        makeMesh(new THREE.BoxGeometry(6, 0.5, 1), 0x6B4226, 30, 8, -160);
        // Old retaining wall
        makeMesh(new THREE.BoxGeometry(3, 6, 80), 0x777777, 35, 3, -150);
        // Ruined stone pillar stump
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 4, 6), 0x808080, 30, 2, -115);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 4, 6), 0x808080, 30, 2, -200);
    }

    function buildWicklowMountains() {
        // Wicklow Mountains backdrop - green mountain mass to west/inland
        // Main mountain ridgeline
        makeMesh(new THREE.BoxGeometry(400, 80, 60), 0x556B2F, -200, 40, -60);
        // Secondary peaks
        makeMesh(new THREE.ConeGeometry(50, 90, 6), 0x4a6028, -180, 45, -80);
        makeMesh(new THREE.ConeGeometry(40, 80, 6), 0x4a6028, -230, 40, -50);
        makeMesh(new THREE.ConeGeometry(35, 70, 6), 0x3a5020, -160, 35, -90);
        // Foreground foothills
        makeMesh(new THREE.BoxGeometry(200, 20, 40), 0x556B2F, -200, 10, -30);
        makeMesh(new THREE.BoxGeometry(150, 15, 30), 0x4a6028, -190, 7.5, -10);
        // Darker mountain shadows
        makeMesh(new THREE.BoxGeometry(100, 50, 20), 0x3a5020, -250, 25, -70);
        // Mountain base scrubland
        makeMesh(new THREE.BoxGeometry(300, 5, 50), 0x4a7a4a, -180, 2.5, -20);
    }

    function buildCharleslandHousing() {
        // Modern white housing development visible inland
        // Row of modern houses
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xF5F5F5, -120, 4, -100);
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xF5F5F5, -132, 4, -100);
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xF5F5F5, -144, 4, -100);
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xEEEEEE, -156, 4, -100);
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xF0F0F0, -168, 4, -100);
        // House roofs (slightly dark)
        makeMesh(new THREE.BoxGeometry(11, 1.5, 11), 0x888888, -120, 9, -100);
        makeMesh(new THREE.BoxGeometry(11, 1.5, 11), 0x888888, -132, 9, -100);
        makeMesh(new THREE.BoxGeometry(11, 1.5, 11), 0x888888, -144, 9, -100);
        makeMesh(new THREE.BoxGeometry(11, 1.5, 11), 0x888888, -156, 9, -100);
        makeMesh(new THREE.BoxGeometry(11, 1.5, 11), 0x888888, -168, 9, -100);
        // Roof ridges
        makeMesh(new THREE.BoxGeometry(11, 3, 2), 0x777777, -120, 10.5, -100);
        makeMesh(new THREE.BoxGeometry(11, 3, 2), 0x777777, -132, 10.5, -100);
        makeMesh(new THREE.BoxGeometry(11, 3, 2), 0x777777, -144, 10.5, -100);
        // Second row of houses
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xF5F5F5, -120, 4, -115);
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xEEEEEE, -132, 4, -115);
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xF5F5F5, -144, 4, -115);
        makeMesh(new THREE.BoxGeometry(11, 1.5, 11), 0x888888, -120, 9, -115);
        makeMesh(new THREE.BoxGeometry(11, 1.5, 11), 0x888888, -132, 9, -115);
        makeMesh(new THREE.BoxGeometry(11, 1.5, 11), 0x888888, -144, 9, -115);
        // Access road
        makeMesh(new THREE.BoxGeometry(60, 0.3, 6), 0x444444, -144, 0.2, -93);
    }

    function buildSailingYachts() {
        // Sailing yachts in the Irish Sea - box hulls with cone sails
        // Yacht 1
        makeMesh(new THREE.BoxGeometry(8, 2, 3), 0xFFFFFF, 180, 3, -60);
        makeMesh(new THREE.ConeGeometry(0.2, 14, 4), 0xFFFFFF, 181, 10, -60);
        makeMesh(new THREE.ConeGeometry(3, 10, 4), 0xFFFFFF, 182, 8, -60);
        // Yacht 2
        makeMesh(new THREE.BoxGeometry(7, 2, 2.5), 0xF5F5DC, 220, 3, 40);
        makeMesh(new THREE.ConeGeometry(0.2, 12, 4), 0xF5F5DC, 221, 9, 40);
        makeMesh(new THREE.ConeGeometry(2.5, 9, 4), 0xF5F5DC, 222, 7.5, 40);
        // Yacht 3 (further out)
        makeMesh(new THREE.BoxGeometry(6, 2, 2.5), 0xFFFFFF, 300, 3, -20);
        makeMesh(new THREE.ConeGeometry(0.2, 11, 4), 0xFFFFFF, 301, 8.5, -20);
        makeMesh(new THREE.ConeGeometry(2.2, 8, 4), 0xFFFFFF, 302, 7, -20);
    }

    function buildHarbourLights() {
        // Lamp posts along pier
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 5, 5), 0x333333, 20, 2.5, -52);
        makeMesh(new THREE.SphereGeometry(0.5, 5, 5), 0xFFFFAA, 20, 5.5, -52);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 5, 5), 0x333333, 50, 2.5, -52);
        makeMesh(new THREE.SphereGeometry(0.5, 5, 5), 0xFFFFAA, 50, 5.5, -52);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 5, 5), 0x333333, 80, 2.5, -52);
        makeMesh(new THREE.SphereGeometry(0.5, 5, 5), 0xFFFFAA, 80, 5.5, -52);
        // Lamp posts south pier
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 5, 5), 0x333333, 20, 2.5, 52);
        makeMesh(new THREE.SphereGeometry(0.5, 5, 5), 0xFFFFAA, 20, 5.5, 52);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 5, 5), 0x333333, 60, 2.5, 52);
        makeMesh(new THREE.SphereGeometry(0.5, 5, 5), 0xFFFFAA, 60, 5.5, 52);
    }

    function buildGroyne() {
        // Timber groyne structures on beach (sea defence)
        makeMesh(new THREE.BoxGeometry(1, 4, 30), 0x6B4226, -20, 2, -30);
        makeMesh(new THREE.BoxGeometry(1, 4, 30), 0x6B4226, -25, 2, 30);
        makeMesh(new THREE.BoxGeometry(1, 4, 30), 0x6B4226, -30, 2, 90);
        // Vertical groyne posts
        makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0x5C3317, -20, 2.5, -20);
        makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0x5C3317, -20, 2.5, -30);
        makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0x5C3317, -20, 2.5, -40);
        makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0x5C3317, -25, 2.5, 20);
        makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0x5C3317, -25, 2.5, 30);
        makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0x5C3317, -25, 2.5, 40);
    }

    function buildSlipway() {
        // Concrete slipway into harbour
        makeMesh(new THREE.BoxGeometry(8, 1, 20), 0xAAAAAA, 5, 1, 0);
        // Slipway sides
        makeMesh(new THREE.BoxGeometry(1, 2, 20), 0x999999, 1.5, 1.5, 0);
        makeMesh(new THREE.BoxGeometry(1, 2, 20), 0x999999, 8.5, 1.5, 0);
        // Capstan/winch
        makeMesh(new THREE.CylinderGeometry(1, 1.2, 2, 8), 0x444444, 3, 1.5, -14);
    }

    function buildRockyOutcrops() {
        // Rock outcrops on beach and near water
        makeMesh(new THREE.BoxGeometry(4, 3, 3), 0x707070, -15, 2, -85);
        makeMesh(new THREE.BoxGeometry(3, 2, 4), 0x686868, -12, 1.5, -82);
        makeMesh(new THREE.BoxGeometry(5, 2, 3), 0x727272, -60, 2.5, 95);
        makeMesh(new THREE.BoxGeometry(3, 3, 2), 0x6a6a6a, -55, 2, 100);
        // Rocks near pier base
        makeMesh(new THREE.BoxGeometry(3, 2, 3), 0x606060, -5, 1.5, -46);
        makeMesh(new THREE.BoxGeometry(2, 1.5, 2), 0x686868, -8, 1.5, -50);
        // Larger rock formation on northern headland
        makeMesh(new THREE.BoxGeometry(8, 5, 6), 0x656565, 20, 3, -120);
        makeMesh(new THREE.BoxGeometry(6, 4, 5), 0x6a6a6a, 26, 2.5, -118);
        makeMesh(new THREE.BoxGeometry(4, 3, 4), 0x606060, 16, 2, -125);
    }

    function update(delta) {
        // Static environment - no per-frame animation needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };

}());
