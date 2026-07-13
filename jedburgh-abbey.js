window.JedburghAbbey = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 20280;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + (x || 0), OY + (y || 0), OZ + (z || 0));
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildAbbeyNave();
        buildAbbeyCrossingTower();
        buildAbbeyWestFront();
        buildAbbeyChoir();
        buildAbbeyAisle();
        buildAbbeyChapterHouse();
        buildRiverJed();
        buildStoneFord();
        buildCastleJail();
        buildMaryQueenOfScotsHouse();
        buildHighStreet();
        buildWarMemorial();
        buildMercatCross();
        buildWoodedHillsides();
        buildCallantsDecorations();
        buildAbbeyGraveyard();
        buildTownBridge();
    }

    function buildGround() {
        // Ground plane approximated with large flat box
        makeMesh(new THREE.BoxGeometry(600, 2, 600), 0x7B8B5A, 0, -1, 0);
        // Hill behind castle jail
        makeMesh(new THREE.BoxGeometry(80, 28, 80), 0x6B7B4A, 130, 10, -60);
        // Gentler hill east of town
        makeMesh(new THREE.BoxGeometry(100, 18, 100), 0x6B7B4A, -100, 5, 80);
        // River bank
        makeMesh(new THREE.BoxGeometry(160, 4, 30), 0x8B7355, -80, -1, 110);
    }

    function buildAbbeyNave() {
        // Main nave walls — north wall
        makeMesh(new THREE.BoxGeometry(5, 32, 80), 0xCD5C5C, -2, 16, 0);
        // South wall
        makeMesh(new THREE.BoxGeometry(5, 32, 80), 0xCD5C5C, 22, 16, 0);
        // Nave floor
        makeMesh(new THREE.BoxGeometry(25, 2, 80), 0xB8860B, 10, 1, 0);
        // Nave clerestory — raised upper section north
        makeMesh(new THREE.BoxGeometry(3, 14, 80), 0xCD5C5C, -1, 39, 0);
        // Nave clerestory south
        makeMesh(new THREE.BoxGeometry(3, 14, 80), 0xCD5C5C, 21, 39, 0);
        // Nave roof ridge beam
        makeMesh(new THREE.BoxGeometry(2, 2, 80), 0x8B4513, 10, 48, 0);
        // Romanesque arch piers — series of columns along nave (north side)
        var i;
        for (i = 0; i < 5; i++) {
            makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 28, 8), 0xCD5C5C, 0, 14, -28 + i * 14);
        }
        // South arcade piers
        for (i = 0; i < 5; i++) {
            makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 28, 8), 0xCD5C5C, 20, 14, -28 + i * 14);
        }
        // Arch spandrel boxes between piers — north arcade
        for (i = 0; i < 4; i++) {
            makeMesh(new THREE.BoxGeometry(4, 8, 12), 0xCD5C5C, -1, 26, -21 + i * 14);
        }
        // Arch spandrel boxes south arcade
        for (i = 0; i < 4; i++) {
            makeMesh(new THREE.BoxGeometry(4, 8, 12), 0xCD5C5C, 21, 26, -21 + i * 14);
        }
        // Triforium gallery band north
        makeMesh(new THREE.BoxGeometry(3, 5, 80), 0xB85450, -1, 34, 0);
        // Triforium gallery band south
        makeMesh(new THREE.BoxGeometry(3, 5, 80), 0xB85450, 21, 34, 0);
        // Nave roof gable slabs (approximated as angled boxes)
        makeMesh(new THREE.BoxGeometry(20, 2, 80), 0x8B6355, 10, 46, 0, -0.4, 0, 0);
        makeMesh(new THREE.BoxGeometry(20, 2, 80), 0x8B6355, 10, 46, 0, 0.4, 0, 0);
    }

    function buildAbbeyCrossingTower() {
        // Crossing tower base
        makeMesh(new THREE.BoxGeometry(28, 5, 28), 0xCD5C5C, 10, 2, 42);
        // Tower lower stage
        makeMesh(new THREE.BoxGeometry(28, 24, 28), 0xCD5C5C, 10, 16, 42);
        // Tower upper stage — slightly narrower
        makeMesh(new THREE.BoxGeometry(24, 18, 24), 0xB85450, 10, 38, 42);
        // Tower parapet
        makeMesh(new THREE.BoxGeometry(26, 3, 26), 0xCD5C5C, 10, 48, 42);
        // Tower corner buttresses
        makeMesh(new THREE.BoxGeometry(4, 46, 4), 0xB04040, -3, 23, 29);
        makeMesh(new THREE.BoxGeometry(4, 46, 4), 0xB04040, 23, 23, 29);
        makeMesh(new THREE.BoxGeometry(4, 46, 4), 0xB04040, -3, 23, 55);
        makeMesh(new THREE.BoxGeometry(4, 46, 4), 0xB04040, 23, 23, 55);
        // Tower belfry openings (decorative pillar pairs)
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 6), 0xCD5C5C, 2, 36, 29);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 6), 0xCD5C5C, 18, 36, 29);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 6), 0xCD5C5C, 2, 36, 55);
        makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 6), 0xCD5C5C, 18, 36, 55);
    }

    function buildAbbeyWestFront() {
        // West front wall
        makeMesh(new THREE.BoxGeometry(30, 38, 5), 0xCD5C5C, 10, 19, -40);
        // West front gable above wall
        makeMesh(new THREE.BoxGeometry(30, 14, 4), 0xCD5C5C, 10, 45, -40);
        // Rose window surround (circular approximated with cylinder)
        makeMesh(new THREE.CylinderGeometry(5, 5, 1, 16), 0xB85450, 10, 34, -40, Math.PI / 2, 0, 0);
        // Rose window inner tracery ring
        makeMesh(new THREE.CylinderGeometry(3, 3, 1.2, 12), 0xE8A080, 10, 34, -40, Math.PI / 2, 0, 0);
        // Rose window centre
        makeMesh(new THREE.CylinderGeometry(1, 1, 1.4, 8), 0xFFD0A0, 10, 34, -40, Math.PI / 2, 0, 0);
        // West door arch surround
        makeMesh(new THREE.BoxGeometry(8, 14, 3), 0xB04040, 10, 7, -40);
        // West door inner
        makeMesh(new THREE.BoxGeometry(5, 11, 3.5), 0x3B2A1A, 10, 5, -40);
        // West front twin towers (flanking)
        makeMesh(new THREE.BoxGeometry(7, 44, 7), 0xCD5C5C, -5, 22, -41);
        makeMesh(new THREE.BoxGeometry(7, 44, 7), 0xCD5C5C, 25, 22, -41);
        // Tower pinnacles
        makeMesh(new THREE.ConeGeometry(2, 8, 6), 0xB04040, -5, 48, -41);
        makeMesh(new THREE.ConeGeometry(2, 8, 6), 0xB04040, 25, 48, -41);
        // Buttresses on west front
        makeMesh(new THREE.BoxGeometry(3, 38, 6), 0xB85450, -1, 19, -43);
        makeMesh(new THREE.BoxGeometry(3, 38, 6), 0xB85450, 21, 19, -43);
    }

    function buildAbbeyChoir() {
        // Ruined choir — partial standing walls
        makeMesh(new THREE.BoxGeometry(5, 20, 36), 0xCD5C5C, -2, 10, 74);
        makeMesh(new THREE.BoxGeometry(5, 14, 36), 0xCD5C5C, 22, 7, 74);
        // East end gable (partial ruin)
        makeMesh(new THREE.BoxGeometry(25, 24, 4), 0xCD5C5C, 10, 12, 92);
        // Choir floor
        makeMesh(new THREE.BoxGeometry(25, 1, 36), 0xA09060, 10, 0.5, 74);
        // Choir piers (stumps — ruined)
        makeMesh(new THREE.CylinderGeometry(1.0, 1.2, 12, 8), 0xCD5C5C, 0, 6, 60);
        makeMesh(new THREE.CylinderGeometry(1.0, 1.2, 12, 8), 0xCD5C5C, 20, 6, 60);
        makeMesh(new THREE.CylinderGeometry(1.0, 1.2, 8, 8), 0xCD5C5C, 0, 4, 72);
        makeMesh(new THREE.CylinderGeometry(1.0, 1.2, 8, 8), 0xCD5C5C, 20, 4, 72);
        // Scattered rubble
        makeMesh(new THREE.BoxGeometry(3, 1.5, 2), 0xCD5C5C, 6, 0.75, 80);
        makeMesh(new THREE.BoxGeometry(2, 1, 3), 0xCD5C5C, 14, 0.5, 85);
        makeMesh(new THREE.BoxGeometry(4, 1, 2), 0xB85450, 9, 0.5, 70);
    }

    function buildAbbeyAisle() {
        // North aisle outer wall
        makeMesh(new THREE.BoxGeometry(5, 16, 80), 0xCD5C5C, -14, 8, 0);
        // North aisle roof
        makeMesh(new THREE.BoxGeometry(16, 2, 80), 0x7B4A30, -8, 16, 0);
        // South aisle outer wall
        makeMesh(new THREE.BoxGeometry(5, 16, 80), 0xCD5C5C, 34, 8, 0);
        // South aisle roof
        makeMesh(new THREE.BoxGeometry(16, 2, 80), 0x7B4A30, 28, 16, 0);
        // Aisle window bays (decorative recesses)
        makeMesh(new THREE.BoxGeometry(1, 8, 6), 0x5A2A1A, -13, 9, -18);
        makeMesh(new THREE.BoxGeometry(1, 8, 6), 0x5A2A1A, -13, 9, 4);
        makeMesh(new THREE.BoxGeometry(1, 8, 6), 0x5A2A1A, -13, 9, 22);
    }

    function buildAbbeyChapterHouse() {
        // Chapter house — small square vaulted room off south aisle
        makeMesh(new THREE.BoxGeometry(22, 18, 22), 0xCD5C5C, 50, 9, -10);
        // Chapter house entrance arch
        makeMesh(new THREE.BoxGeometry(5, 8, 4), 0xB04040, 37, 4, -10);
        // Chapter house interior floor
        makeMesh(new THREE.BoxGeometry(18, 1, 18), 0x9A8060, 50, 1, -10);
        // Chapter house vault ribs (approximated as cylinder rods)
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 22, 6), 0xCD5C5C, 50, 14, -10, 0, 0, Math.PI / 2);
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 22, 6), 0xCD5C5C, 50, 14, -10, Math.PI / 2, 0, 0);
        // Chapter house roof
        makeMesh(new THREE.BoxGeometry(23, 3, 23), 0x7B4A30, 50, 19, -10);
        // Chapter house central column
        makeMesh(new THREE.CylinderGeometry(1.0, 1.2, 16, 8), 0xCD5C5C, 50, 9, -10);
        // Chapter house bench niches (wall seats)
        makeMesh(new THREE.BoxGeometry(18, 2, 3), 0xA0806A, 50, 1, -20);
        makeMesh(new THREE.BoxGeometry(18, 2, 3), 0xA0806A, 50, 1, 0);
    }

    function buildRiverJed() {
        // River Jed flowing beside abbey — series of flat blue boxes
        makeMesh(new THREE.BoxGeometry(24, 1, 200), 0x006994, -55, 0.2, 20);
        // River bank stones
        makeMesh(new THREE.BoxGeometry(8, 2, 200), 0x8B7355, -43, 1, 20);
        // Ripple surface bands
        makeMesh(new THREE.BoxGeometry(20, 0.5, 30), 0x1079AA, -55, 0.6, -30);
        makeMesh(new THREE.BoxGeometry(20, 0.5, 40), 0x1079AA, -55, 0.6, 20);
        makeMesh(new THREE.BoxGeometry(20, 0.5, 35), 0x1079AA, -55, 0.6, 70);
        // Riverbed visible boulders
        makeMesh(new THREE.SphereGeometry(1.5, 6, 4), 0x706050, -50, 0.5, 10);
        makeMesh(new THREE.SphereGeometry(1.0, 6, 4), 0x706050, -58, 0.5, 30);
        makeMesh(new THREE.SphereGeometry(1.2, 6, 4), 0x706050, -52, 0.5, 50);
        // River edge reeds (thin cylinders)
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 5), 0x4A6A2A, -44, 1.5, 5);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 4, 5), 0x4A6A2A, -43, 2, 15);
        makeMesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 5), 0x4A6A2A, -44, 1.5, 25);
    }

    function buildStoneFord() {
        // Stone ford crossing the Jed
        makeMesh(new THREE.BoxGeometry(24, 1.5, 8), 0x9A8B7A, -55, 0.5, 80);
        // Ford stepping stones
        makeMesh(new THREE.BoxGeometry(3, 0.5, 3), 0xB0A090, -48, 0.8, 80);
        makeMesh(new THREE.BoxGeometry(3, 0.5, 3), 0xB0A090, -53, 0.8, 80);
        makeMesh(new THREE.BoxGeometry(3, 0.5, 3), 0xB0A090, -59, 0.8, 80);
        makeMesh(new THREE.BoxGeometry(3, 0.5, 3), 0xB0A090, -64, 0.8, 80);
    }

    function buildCastleJail() {
        // Castle Jail — Georgian castle-style on hill
        // Main prison block
        makeMesh(new THREE.BoxGeometry(36, 26, 28), 0xC8B89A, 130, 35, -60);
        // Battlemented parapet
        makeMesh(new THREE.BoxGeometry(38, 4, 30), 0xC8B89A, 130, 50, -60);
        // Parapet merlons (crenellations) north side
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xC8B89A, 118, 53, -46);
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xC8B89A, 126, 53, -46);
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xC8B89A, 134, 53, -46);
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xC8B89A, 142, 53, -46);
        // South merlons
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xC8B89A, 118, 53, -74);
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xC8B89A, 126, 53, -74);
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xC8B89A, 134, 53, -74);
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xC8B89A, 142, 53, -74);
        // Corner towers
        makeMesh(new THREE.CylinderGeometry(5, 5, 32, 8), 0xBEAA8A, 114, 41, -47);
        makeMesh(new THREE.CylinderGeometry(5, 5, 32, 8), 0xBEAA8A, 146, 41, -47);
        makeMesh(new THREE.CylinderGeometry(5, 5, 32, 8), 0xBEAA8A, 114, 41, -73);
        makeMesh(new THREE.CylinderGeometry(5, 5, 32, 8), 0xBEAA8A, 146, 41, -73);
        // Corner tower battlements
        makeMesh(new THREE.CylinderGeometry(5.5, 5.5, 3, 8), 0xC8B89A, 114, 59, -47);
        makeMesh(new THREE.CylinderGeometry(5.5, 5.5, 3, 8), 0xC8B89A, 146, 59, -47);
        makeMesh(new THREE.CylinderGeometry(5.5, 5.5, 3, 8), 0xC8B89A, 114, 59, -73);
        makeMesh(new THREE.CylinderGeometry(5.5, 5.5, 3, 8), 0xC8B89A, 146, 59, -73);
        // Gatehouse entrance
        makeMesh(new THREE.BoxGeometry(12, 20, 10), 0xBEAA8A, 130, 35, -46);
        // Gate arch opening
        makeMesh(new THREE.BoxGeometry(6, 10, 11), 0x2A2018, 130, 28, -46);
        // Flag pole
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 16, 6), 0x8B6914, 130, 60, -60);
        // Flag (box)
        makeMesh(new THREE.BoxGeometry(6, 3, 0.2), 0x00339A, 133, 68, -60);
        // Hill retaining wall
        makeMesh(new THREE.BoxGeometry(80, 8, 5), 0xB8A888, 130, 17, -43);
    }

    function buildMaryQueenOfScotsHouse() {
        // Tower house where Mary stayed in 1566
        // Main tower block
        makeMesh(new THREE.BoxGeometry(14, 30, 16), 0xF5F0E8, 80, 15, -80);
        // Upper storey corbelling
        makeMesh(new THREE.BoxGeometry(15, 4, 17), 0xE8E0D0, 80, 29, -80);
        // Roof parapet
        makeMesh(new THREE.BoxGeometry(15, 3, 17), 0xD8D0C0, 80, 33, -80);
        // Roof
        makeMesh(new THREE.BoxGeometry(14, 6, 16), 0x6A5A4A, 80, 37, -80, 0.25, 0, 0);
        // Corner turret
        makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 20, 8), 0xF0EBE0, 88, 20, -72);
        makeMesh(new THREE.ConeGeometry(2.8, 6, 8), 0x5A4A3A, 88, 33, -72);
        // Ground floor entrance door
        makeMesh(new THREE.BoxGeometry(3, 5, 2), 0x3A2A1A, 80, 2.5, -72);
        // Windows (recessed dark boxes)
        makeMesh(new THREE.BoxGeometry(2, 2.5, 1), 0x2A2A3A, 74, 10, -72);
        makeMesh(new THREE.BoxGeometry(2, 2.5, 1), 0x2A2A3A, 86, 10, -72);
        makeMesh(new THREE.BoxGeometry(2, 2.5, 1), 0x2A2A3A, 74, 20, -72);
        makeMesh(new THREE.BoxGeometry(2, 2.5, 1), 0x2A2A3A, 86, 20, -72);
        // Adjacent lower wing
        makeMesh(new THREE.BoxGeometry(14, 16, 10), 0xEEE8DA, 80, 8, -65);
        // Courtyard wall
        makeMesh(new THREE.BoxGeometry(24, 6, 2), 0xE0DAC8, 80, 3, -56);
        makeMesh(new THREE.BoxGeometry(2, 6, 20), 0xE0DAC8, 69, 3, -68);
    }

    function buildHighStreet() {
        // High Street — market town buildings north to south
        // West side terrace blocks
        makeMesh(new THREE.BoxGeometry(12, 16, 10), 0xF5F0E8, 60, 8, -40);
        makeMesh(new THREE.BoxGeometry(10, 18, 10), 0xE8DDD0, 73, 9, -40);
        makeMesh(new THREE.BoxGeometry(11, 14, 10), 0xCD5C5C, 85, 7, -40);
        makeMesh(new THREE.BoxGeometry(12, 16, 10), 0xF5F0E8, 98, 8, -40);
        makeMesh(new THREE.BoxGeometry(10, 20, 10), 0xDDCCBB, 110, 10, -40);
        // East side buildings
        makeMesh(new THREE.BoxGeometry(11, 15, 10), 0xF0EBE0, 60, 7, -20);
        makeMesh(new THREE.BoxGeometry(13, 17, 10), 0xCD5C5C, 74, 8, -20);
        makeMesh(new THREE.BoxGeometry(10, 14, 10), 0xE8E0D4, 88, 7, -20);
        makeMesh(new THREE.BoxGeometry(12, 16, 10), 0xCCBBAA, 101, 8, -20);
        // Rooflines
        makeMesh(new THREE.BoxGeometry(12, 2, 11), 0x6A5A4A, 60, 17, -40);
        makeMesh(new THREE.BoxGeometry(10, 2, 11), 0x5A4A3A, 73, 19, -40);
        makeMesh(new THREE.BoxGeometry(11, 2, 11), 0x6A4040, 85, 16, -40);
        makeMesh(new THREE.BoxGeometry(12, 2, 11), 0x6A5A4A, 98, 17, -40);
        // High Street surface
        makeMesh(new THREE.BoxGeometry(20, 0.5, 100), 0xBBB0A0, 73, 0.25, -30);
        // Pavement cobblestones (slightly raised strip)
        makeMesh(new THREE.BoxGeometry(4, 0.4, 100), 0xC8C0B0, 62, 0.4, -30);
        makeMesh(new THREE.BoxGeometry(4, 0.4, 100), 0xC8C0B0, 84, 0.4, -30);
        // A close/wynd alley
        makeMesh(new THREE.BoxGeometry(4, 15, 20), 0xDDD4C4, 67, 7, -8);
        makeMesh(new THREE.BoxGeometry(4, 15, 20), 0xDDD4C4, 79, 7, -8);
    }

    function buildWarMemorial() {
        // War Memorial — central plinth with sculpture
        // Base stepped plinth
        makeMesh(new THREE.BoxGeometry(7, 1.5, 7), 0xC0C0C0, 73, 0.75, 10);
        makeMesh(new THREE.BoxGeometry(5.5, 2, 5.5), 0xC0C0C0, 73, 2, 10);
        makeMesh(new THREE.BoxGeometry(4, 2, 4), 0xC0C0C0, 73, 3.5, 10);
        // Shaft
        makeMesh(new THREE.BoxGeometry(2.5, 10, 2.5), 0xB8B8B8, 73, 9.5, 10);
        // Capital
        makeMesh(new THREE.BoxGeometry(3.5, 1.5, 3.5), 0xC0C0C0, 73, 15.25, 10);
        // Sculpture — stylised figure (sphere for head, box for body)
        makeMesh(new THREE.BoxGeometry(1.5, 4, 1), 0xB0B0B0, 73, 18, 10);
        makeMesh(new THREE.SphereGeometry(0.9, 8, 6), 0xB0B0B0, 73, 22.5, 10);
        // Cross finial
        makeMesh(new THREE.BoxGeometry(0.5, 3, 0.5), 0xA8A8A8, 73, 25, 10);
        makeMesh(new THREE.BoxGeometry(2, 0.5, 0.5), 0xA8A8A8, 73, 26.2, 10);
        // Memorial railings (thin posts)
        makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 5), 0x303030, 69, 2, 6);
        makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 5), 0x303030, 69, 2, 10);
        makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 5), 0x303030, 69, 2, 14);
        makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 5), 0x303030, 77, 2, 6);
        makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 5), 0x303030, 77, 2, 10);
        makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 4, 5), 0x303030, 77, 2, 14);
    }

    function buildMercatCross() {
        // Mercat Cross — market cross in High Street
        // Base
        makeMesh(new THREE.BoxGeometry(4, 1, 4), 0xC8B89A, 73, 0.5, -55);
        makeMesh(new THREE.BoxGeometry(3, 1.5, 3), 0xC8B89A, 73, 1.5, -55);
        // Shaft
        makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 8, 8), 0xBAAA8A, 73, 6.5, -55);
        // Capital drum
        makeMesh(new THREE.CylinderGeometry(1.2, 1.0, 1.5, 8), 0xC8B89A, 73, 11, -55);
        // Cross arms
        makeMesh(new THREE.BoxGeometry(3, 0.5, 0.5), 0xC0B090, 73, 12.5, -55);
        makeMesh(new THREE.BoxGeometry(0.5, 3, 0.5), 0xC0B090, 73, 12.5, -55);
        // Unicorn finial (sphere)
        makeMesh(new THREE.SphereGeometry(0.7, 8, 6), 0xD4C8A8, 73, 14.5, -55);
    }

    function buildWoodedHillsides() {
        // Trees on hillsides above town — varied heights and positions
        var treePositions = [
            [150, 30, -100], [158, 28, -90], [165, 32, -110],
            [145, 26, -120], [170, 24, -80], [160, 30, -130],
            [140, 22, -95], [155, 28, -115], [175, 26, -95],
            [148, 32, -105], [162, 24, -85], [172, 30, -120],
            [-90, 12, 60], [-100, 14, 70], [-95, 10, 80],
            [-105, 12, 55], [-88, 14, 75], [-98, 10, 90],
            [135, 18, -50], [145, 20, -55], [155, 22, -45]
        ];
        var i;
        for (i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var ty = treePositions[i][1];
            var tz = treePositions[i][2];
            var th = 6 + (i % 4) * 2;
            // Trunk
            makeMesh(new THREE.CylinderGeometry(0.5, 0.7, th, 6), 0x5B3A1A, tx, ty + th / 2, tz);
            // Canopy (two stacked cones for fullness)
            makeMesh(new THREE.ConeGeometry(3.5, 6, 7), 0x3D6B30, tx, ty + th + 3, tz);
            makeMesh(new THREE.ConeGeometry(2.5, 5, 7), 0x4A7A38, tx, ty + th + 6, tz);
        }
    }

    function buildCallantsDecorations() {
        // Jedburgh Callants Festival — coloured banners/flags on buildings
        var bannerColors = [0xCC2222, 0x2244CC, 0x22AA44, 0xDDAA00, 0xAA22AA, 0xDD6622];
        var bannerPositions = [
            [60, 18, -40], [73, 20, -40], [85, 17, -40],
            [60, 16, -20], [74, 18, -20], [88, 16, -20],
            [98, 18, -40], [110, 21, -40]
        ];
        var i;
        for (i = 0; i < bannerPositions.length; i++) {
            var bx = bannerPositions[i][0];
            var by = bannerPositions[i][1];
            var bz = bannerPositions[i][2];
            var color = bannerColors[i % bannerColors.length];
            // Vertical banner pole
            makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 5), 0x888888, bx, by + 2, bz);
            // Banner cloth
            makeMesh(new THREE.BoxGeometry(2.5, 4, 0.15), color, bx + 1.2, by + 1, bz);
        }
        // Festival bunting line (series of small coloured boxes)
        var j;
        for (j = 0; j < 8; j++) {
            makeMesh(new THREE.BoxGeometry(1.5, 1.5, 0.15), bannerColors[j % bannerColors.length], 60 + j * 6.5, 20, -30);
        }
    }

    function buildAbbeyGraveyard() {
        // Historic graveyard around abbey
        // Graveyard wall
        makeMesh(new THREE.BoxGeometry(120, 3, 3), 0x9A8B7A, 10, 1.5, -50);
        makeMesh(new THREE.BoxGeometry(3, 3, 100), 0x9A8B7A, -50, 1.5, -5);
        // Grave markers (upright thin slabs)
        makeMesh(new THREE.BoxGeometry(1, 4, 0.3), 0x888880, -22, 2, -30);
        makeMesh(new THREE.BoxGeometry(1, 3.5, 0.3), 0x888880, -26, 1.75, -35);
        makeMesh(new THREE.BoxGeometry(1, 4.5, 0.3), 0x888880, -18, 2.25, -38);
        makeMesh(new THREE.BoxGeometry(1, 3.5, 0.3), 0x888880, -30, 1.75, -28);
        makeMesh(new THREE.BoxGeometry(1, 4, 0.3), 0x888880, -34, 2, -34);
        makeMesh(new THREE.BoxGeometry(1, 3.5, 0.3), 0x888880, -22, 1.75, -44);
        makeMesh(new THREE.BoxGeometry(1, 4, 0.3), 0x888880, -28, 2, -20);
        // Table tomb
        makeMesh(new THREE.BoxGeometry(4, 1, 2), 0x909088, -38, 0.5, -22);
        makeMesh(new THREE.BoxGeometry(4.5, 0.5, 2.5), 0x909088, -38, 1.25, -22);
        // Yew tree in graveyard
        makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 8, 6), 0x3B2A1A, -32, 4, -15);
        makeMesh(new THREE.SphereGeometry(3, 8, 6), 0x1A4A18, -32, 9.5, -15);
    }

    function buildTownBridge() {
        // Stone bridge over River Jed
        // Bridge deck
        makeMesh(new THREE.BoxGeometry(10, 2, 28), 0xB0A090, -47, 3, -5);
        // Bridge parapet walls
        makeMesh(new THREE.BoxGeometry(2, 3, 28), 0xA09080, -42, 4, -5);
        makeMesh(new THREE.BoxGeometry(2, 3, 28), 0xA09080, -52, 4, -5);
        // Bridge arch piers (two)
        makeMesh(new THREE.BoxGeometry(6, 6, 6), 0x9A8B7A, -47, 0, -12);
        makeMesh(new THREE.BoxGeometry(6, 6, 6), 0x9A8B7A, -47, 0, 2);
        // Bridge approach road
        makeMesh(new THREE.BoxGeometry(10, 1, 20), 0xC0B8A8, -47, 1, -24);
        makeMesh(new THREE.BoxGeometry(10, 1, 20), 0xC0B8A8, -47, 1, 14);
        // Coping stones on parapet
        makeMesh(new THREE.BoxGeometry(2, 1, 28), 0xC8C0B0, -42, 5.5, -5);
        makeMesh(new THREE.BoxGeometry(2, 1, 28), 0xC8C0B0, -52, 5.5, -5);
    }

    function update(delta) {
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
