window.AlmatyMedeu = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var BASE_X = 23840;
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
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        if (sx || sy || sz) mesh.scale.set(sx || 1, sy || 1, sz || 1);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildMedeuRink();
        buildMedeuDam();
        buildShymbulak();
        buildZenkovCathedral();
        buildKokTobe();
        buildAlmatyTower();
        buildCentralMuseum();
        buildBigAlmatyLake();
        buildRepublicSquare();
        buildGreenMarket();
        buildIleAlatauMountains();
    }

    // =====================
    // MEDEU ICE RINK
    // =====================
    function buildMedeuRink() {
        // Rink floor - massive oval (approximated with flat box)
        makeMesh(new THREE.BoxGeometry(120, 1, 70), 0x88CCEE, -200, 2, 0);

        // Rink surface ice sheen inner
        makeMesh(new THREE.BoxGeometry(100, 0.5, 55), 0xAADDFF, -200, 3, 0);

        // Rink surrounding walls/boards - north
        makeMesh(new THREE.BoxGeometry(122, 3, 2), 0x99BBCC, -200, 4, -36);
        // south
        makeMesh(new THREE.BoxGeometry(122, 3, 2), 0x99BBCC, -200, 4, 36);
        // east
        makeMesh(new THREE.BoxGeometry(2, 3, 72), 0x99BBCC, -138, 4, 0);
        // west
        makeMesh(new THREE.BoxGeometry(2, 3, 72), 0x99BBCC, -262, 4, 0);

        // Spectator stands - north side tiered
        makeMesh(new THREE.BoxGeometry(110, 6, 15), 0x778899, -200, 6, -52);
        makeMesh(new THREE.BoxGeometry(100, 5, 12), 0x667788, -200, 10, -60);
        makeMesh(new THREE.BoxGeometry(90, 4, 10), 0x778899, -200, 14, -67);

        // Spectator stands - south side tiered
        makeMesh(new THREE.BoxGeometry(110, 6, 15), 0x778899, -200, 6, 52);
        makeMesh(new THREE.BoxGeometry(100, 5, 12), 0x667788, -200, 10, 60);
        makeMesh(new THREE.BoxGeometry(90, 4, 10), 0x778899, -200, 14, 67);

        // Rink roof canopy support columns - north side
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), 0x556677, -240, 10, -50);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), 0x556677, -200, 10, -50);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), 0x556677, -160, 10, -50);

        // Rink roof canopy support columns - south side
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), 0x556677, -240, 10, 50);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), 0x556677, -200, 10, 50);
        makeMesh(new THREE.CylinderGeometry(0.8, 0.8, 20, 8), 0x556677, -160, 10, 50);

        // Roof canopy slabs
        makeMesh(new THREE.BoxGeometry(110, 1.5, 18), 0x445566, -200, 21, -55);
        makeMesh(new THREE.BoxGeometry(110, 1.5, 18), 0x445566, -200, 21, 55);

        // Entry building / main pavilion
        makeMesh(new THREE.BoxGeometry(20, 12, 15), 0x889AAB, -138, 6, 0);
        // Pavilion roof
        makeMesh(new THREE.BoxGeometry(22, 2, 17), 0x667788, -138, 13, 0);

        // Floodlight poles at corners
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 25, 6), 0xCCCCCC, -245, 12, -40);
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 25, 6), 0xCCCCCC, -155, 12, -40);
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 25, 6), 0xCCCCCC, -245, 12, 40);
        makeMesh(new THREE.CylinderGeometry(0.4, 0.4, 25, 6), 0xCCCCCC, -155, 12, 40);

        // Floodlight heads
        makeMesh(new THREE.BoxGeometry(4, 1.5, 2), 0xFFFFCC, -245, 25, -40);
        makeMesh(new THREE.BoxGeometry(4, 1.5, 2), 0xFFFFCC, -155, 25, -40);
        makeMesh(new THREE.BoxGeometry(4, 1.5, 2), 0xFFFFCC, -245, 25, 40);
        makeMesh(new THREE.BoxGeometry(4, 1.5, 2), 0xFFFFCC, -155, 25, 40);
    }

    // =====================
    // MEDEU DAM EMBANKMENT
    // =====================
    function buildMedeuDam() {
        // Dam main body - massive earthen embankment
        makeMesh(new THREE.BoxGeometry(180, 40, 30), 0x776655, -200, 20, -110);
        // Dam top walkway
        makeMesh(new THREE.BoxGeometry(180, 2, 8), 0x998877, -200, 41, -110);
        // Dam face sloped retaining wall (approximated)
        makeMesh(new THREE.BoxGeometry(180, 35, 8), 0x887766, -200, 18, -98);
        // Gate structure on dam
        makeMesh(new THREE.BoxGeometry(12, 45, 12), 0x665544, -200, 23, -110);
        makeMesh(new THREE.BoxGeometry(16, 4, 14), 0x554433, -200, 46, -110);
    }

    // =====================
    // SHYMBULAK SKI RESORT
    // =====================
    function buildShymbulak() {
        // Base lodge building
        makeMesh(new THREE.BoxGeometry(30, 10, 20), 0x8B6914, -300, 55, -20);
        // Lodge roof A-frame
        makeMesh(new THREE.BoxGeometry(32, 8, 22), 0x5C3D0A, -300, 64, -20, 0.4);
        // Lodge upper floor
        makeMesh(new THREE.BoxGeometry(24, 6, 16), 0x9B7924, -300, 66, -20);

        // Upper station building
        makeMesh(new THREE.BoxGeometry(20, 8, 14), 0x8B6914, -380, 120, -15);
        makeMesh(new THREE.BoxGeometry(22, 6, 16), 0x5C3D0A, -380, 127, -15, 0.3);

        // Gondola lift towers (tall pylons)
        makeMesh(new THREE.BoxGeometry(3, 35, 3), 0x888888, -315, 68, -10);
        makeMesh(new THREE.BoxGeometry(3, 40, 3), 0x888888, -330, 79, -10);
        makeMesh(new THREE.BoxGeometry(3, 45, 3), 0x888888, -345, 93, -10);
        makeMesh(new THREE.BoxGeometry(3, 50, 3), 0x888888, -360, 110, -10);

        // Tower crossbars
        makeMesh(new THREE.BoxGeometry(8, 2, 2), 0x666666, -315, 85, -10);
        makeMesh(new THREE.BoxGeometry(8, 2, 2), 0x666666, -330, 99, -10);
        makeMesh(new THREE.BoxGeometry(8, 2, 2), 0x666666, -345, 115, -10);
        makeMesh(new THREE.BoxGeometry(8, 2, 2), 0x666666, -360, 132, -10);

        // Gondola cabins on lift line
        makeMesh(new THREE.BoxGeometry(4, 5, 3), 0xDD3333, -322, 78, -10);
        makeMesh(new THREE.BoxGeometry(4, 5, 3), 0xDD3333, -338, 90, -10);
        makeMesh(new THREE.BoxGeometry(4, 5, 3), 0xDD3333, -354, 104, -10);

        // Snow-covered ski run terrain markers
        makeMesh(new THREE.BoxGeometry(1.5, 8, 1.5), 0xFF6600, -308, 60, 5);
        makeMesh(new THREE.BoxGeometry(1.5, 8, 1.5), 0xFF6600, -325, 70, 8);
        makeMesh(new THREE.BoxGeometry(1.5, 8, 1.5), 0xFF6600, -342, 82, 5);
        makeMesh(new THREE.BoxGeometry(1.5, 8, 1.5), 0xFF6600, -360, 96, 2);

        // Snow-covered ski slopes (wide white boxes)
        makeMesh(new THREE.BoxGeometry(60, 2, 25), 0xEEEEFF, -340, 88, 12, -0.3);
        makeMesh(new THREE.BoxGeometry(50, 2, 20), 0xDDDDEE, -310, 68, 15, -0.25);

        // Resort trees (conifers)
        makeMesh(new THREE.ConeGeometry(5, 14, 7), 0x2A4A1A, -290, 62, 30);
        makeMesh(new THREE.ConeGeometry(4, 12, 7), 0x2A4A1A, -285, 60, 40);
        makeMesh(new THREE.ConeGeometry(5, 14, 7), 0x4A6A3A, -295, 63, 45);
        makeMesh(new THREE.ConeGeometry(3.5, 10, 7), 0x3A5A2A, -303, 61, 35);
        makeMesh(new THREE.ConeGeometry(5, 14, 7), 0x2A4A1A, -310, 62, 50);
        makeMesh(new THREE.ConeGeometry(4, 12, 7), 0x4A6A3A, -320, 65, 45);
    }

    // =====================
    // ZENKOV CATHEDRAL
    // =====================
    function buildZenkovCathedral() {
        // Main cathedral base / ground floor
        makeMesh(new THREE.BoxGeometry(28, 14, 22), 0xD4A850, 100, 7, 0);
        // Second tier
        makeMesh(new THREE.BoxGeometry(20, 10, 16), 0xD4A850, 100, 19, 0);
        // Third tier
        makeMesh(new THREE.BoxGeometry(13, 8, 10), 0xD4A850, 100, 27, 0);

        // Bell tower - left
        makeMesh(new THREE.BoxGeometry(7, 22, 7), 0xC89840, 84, 11, 0);
        // Bell tower top
        makeMesh(new THREE.BoxGeometry(8, 3, 8), 0xBB8830, 84, 23, 0);
        // Bell tower octagonal belfry
        makeMesh(new THREE.CylinderGeometry(3.5, 3.5, 6, 8), 0xD4A850, 84, 27, 0);

        // Main onion dome - central (large)
        makeMesh(new THREE.SphereGeometry(5, 10, 8), 0x4A6AB8, 100, 38, 0);
        // Dome neck
        makeMesh(new THREE.CylinderGeometry(2, 2, 5, 8), 0xD4A850, 100, 32, 0);
        // Cross atop central dome
        makeMesh(new THREE.BoxGeometry(0.5, 6, 0.5), 0xFFDD00, 100, 45, 0);
        makeMesh(new THREE.BoxGeometry(3, 0.5, 0.5), 0xFFDD00, 100, 47, 0);

        // Small flanking onion dome - north
        makeMesh(new THREE.SphereGeometry(3, 8, 7), 0x4A6AB8, 100, 34, -8);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 8), 0xD4A850, 100, 30, -8);

        // Small flanking onion dome - south
        makeMesh(new THREE.SphereGeometry(3, 8, 7), 0x4A6AB8, 100, 34, 8);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 4, 8), 0xD4A850, 100, 30, 8);

        // Bell tower large onion dome
        makeMesh(new THREE.SphereGeometry(4, 8, 7), 0x4A6AB8, 84, 33, 0);
        makeMesh(new THREE.BoxGeometry(0.5, 5, 0.5), 0xFFDD00, 84, 39, 0);
        makeMesh(new THREE.BoxGeometry(2.5, 0.5, 0.5), 0xFFDD00, 84, 41, 0);

        // Cathedral porch / entrance steps
        makeMesh(new THREE.BoxGeometry(10, 1.5, 5), 0xBBAA80, 113, 1, 0);
        makeMesh(new THREE.BoxGeometry(8, 1, 4), 0xBBAA80, 115, 2, 0);

        // Panfilov Park trees around cathedral
        makeMesh(new THREE.SphereGeometry(5, 7, 6), 0x2A6A2A, 130, 10, 20);
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 12, 6), 0x5C3D0A, 130, 6, 20);
        makeMesh(new THREE.SphereGeometry(4, 7, 6), 0x2A7A2A, 130, 10, -20);
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 12, 6), 0x5C3D0A, 130, 6, -20);
        makeMesh(new THREE.SphereGeometry(5, 7, 6), 0x3A7A3A, 80, 10, 25);
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 12, 6), 0x5C3D0A, 80, 6, 25);
        makeMesh(new THREE.SphereGeometry(4, 7, 6), 0x2A6A2A, 80, 10, -25);
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 12, 6), 0x5C3D0A, 80, 6, -25);

        // Park pathway
        makeMesh(new THREE.BoxGeometry(60, 0.5, 4), 0xCCBBAA, 100, 0.5, 0);
        makeMesh(new THREE.BoxGeometry(4, 0.5, 60), 0xCCBBAA, 100, 0.5, 0);
    }

    // =====================
    // KOK-TOBE HILL
    // =====================
    function buildKokTobe() {
        // Hill main mass
        makeMesh(new THREE.ConeGeometry(60, 90, 10), 0x4A7A3A, 250, 45, 50);
        // Hill upper section
        makeMesh(new THREE.ConeGeometry(30, 50, 8), 0x3A6A2A, 250, 95, 50);

        // Cable car lower station
        makeMesh(new THREE.BoxGeometry(10, 6, 8), 0x888888, 210, 3, 30);
        // Cable car upper station
        makeMesh(new THREE.BoxGeometry(10, 6, 8), 0x888888, 245, 85, 48);

        // Cable car pylon
        makeMesh(new THREE.CylinderGeometry(1, 1, 30, 6), 0x999999, 225, 15, 38);
        // Cable car cabin
        makeMesh(new THREE.BoxGeometry(4, 4, 3), 0xFF4444, 230, 22, 42);

        // Kok-Tobe summit platform
        makeMesh(new THREE.BoxGeometry(25, 2, 25), 0xAAAAAA, 250, 121, 50);
        // Summit observation area fence posts
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 5), 0x888888, 263, 123, 50);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 5), 0x888888, 237, 123, 50);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 5), 0x888888, 250, 123, 63);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 5), 0x888888, 250, 123, 37);
    }

    // =====================
    // ALMATY TV TOWER (372m)
    // =====================
    function buildAlmatyTower() {
        // Tower main shaft - lower wide base
        makeMesh(new THREE.CylinderGeometry(6, 9, 60, 10), 0xCCCCCC, 250, 151, 50);
        // Tower mid section
        makeMesh(new THREE.CylinderGeometry(3.5, 6, 80, 10), 0xBBBBBB, 250, 221, 50);
        // Tower upper section
        makeMesh(new THREE.CylinderGeometry(2, 3.5, 80, 8), 0xCCCCCC, 250, 301, 50);
        // Observation deck ring
        makeMesh(new THREE.CylinderGeometry(10, 10, 8, 12), 0xDDDDDD, 250, 346, 50);
        // Observation deck roof
        makeMesh(new THREE.ConeGeometry(10, 12, 12), 0xBBBBBB, 250, 354, 50);
        // Antenna mast
        makeMesh(new THREE.CylinderGeometry(0.5, 1.2, 40, 6), 0xCCCCCC, 250, 378, 50);
        // Tower guy wire anchors (small spheres as joints)
        makeMesh(new THREE.SphereGeometry(1.5, 6, 5), 0x999999, 250, 260, 50);
        // Tower support legs at base
        makeMesh(new THREE.BoxGeometry(3, 25, 3), 0xBBBBBB, 258, 133, 58);
        makeMesh(new THREE.BoxGeometry(3, 25, 3), 0xBBBBBB, 242, 133, 58);
        makeMesh(new THREE.BoxGeometry(3, 25, 3), 0xBBBBBB, 258, 133, 42);
        makeMesh(new THREE.BoxGeometry(3, 25, 3), 0xBBBBBB, 242, 133, 42);
    }

    // =====================
    // CENTRAL STATE MUSEUM
    // =====================
    function buildCentralMuseum() {
        // Museum main hall base
        makeMesh(new THREE.BoxGeometry(50, 12, 40), 0xC8B8A0, 50, 6, 80);
        // Museum wings - east
        makeMesh(new THREE.BoxGeometry(18, 8, 25), 0xC8B8A0, 75, 4, 80);
        // Museum wings - west
        makeMesh(new THREE.BoxGeometry(18, 8, 25), 0xC8B8A0, 25, 4, 80);
        // Yurt-inspired dome (main)
        makeMesh(new THREE.SphereGeometry(18, 10, 6), 0xBBAA90, 50, 24, 80);
        // Dome base ring
        makeMesh(new THREE.CylinderGeometry(18, 18, 4, 12), 0xC8B8A0, 50, 13, 80);
        // Museum portico columns
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 8), 0xDDCCBB, 40, 6, 58);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 8), 0xDDCCBB, 50, 6, 58);
        makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 12, 8), 0xDDCCBB, 60, 6, 58);
        // Portico roof
        makeMesh(new THREE.BoxGeometry(30, 2, 6), 0xBBAA90, 50, 13, 58);
        // Museum entrance steps
        makeMesh(new THREE.BoxGeometry(20, 1.5, 5), 0xCCBBAA, 50, 1, 55);
        makeMesh(new THREE.BoxGeometry(16, 1, 4), 0xCCBBAA, 50, 2, 53);
        // Flagpoles
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 15, 5), 0xCCCCCC, 35, 8, 56);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 15, 5), 0xCCCCCC, 65, 8, 56);
    }

    // =====================
    // BIG ALMATY LAKE
    // =====================
    function buildBigAlmatyLake() {
        // Lake body (turquoise)
        makeMesh(new THREE.BoxGeometry(80, 1, 55), 0x2A6A9A, -500, 80, 30);
        // Lake inner deeper color
        makeMesh(new THREE.BoxGeometry(60, 0.5, 38), 0x1A5A8A, -500, 81, 30);
        // Lake shore rocky edges - north
        makeMesh(new THREE.BoxGeometry(85, 5, 8), 0x776655, -500, 78, 7);
        // Lake shore rocky edges - south
        makeMesh(new THREE.BoxGeometry(85, 5, 8), 0x776655, -500, 78, 53);
        // Lake shore west
        makeMesh(new THREE.BoxGeometry(8, 5, 55), 0x776655, -542, 78, 30);
        // Lake shore east
        makeMesh(new THREE.BoxGeometry(8, 5, 55), 0x776655, -458, 78, 30);
        // Rocky outcrops
        makeMesh(new THREE.SphereGeometry(6, 7, 5), 0x887766, -510, 80, 10);
        makeMesh(new THREE.SphereGeometry(4, 6, 5), 0x998877, -488, 80, 48);
        makeMesh(new THREE.SphereGeometry(5, 7, 5), 0x776655, -540, 82, 28);
        // Small waterfall/inlet
        makeMesh(new THREE.BoxGeometry(4, 15, 3), 0x88AACC, -542, 86, 30);
    }

    // =====================
    // REPUBLIC SQUARE
    // =====================
    function buildRepublicSquare() {
        // Main square paved area
        makeMesh(new THREE.BoxGeometry(120, 0.5, 90), 0xD4D0C8, 0, 0.5, 80);
        // Square decorative center
        makeMesh(new THREE.BoxGeometry(30, 0.3, 30), 0xCCCCBB, 0, 0.8, 80);

        // Independence Monument base
        makeMesh(new THREE.BoxGeometry(8, 3, 8), 0xBBB8A8, 0, 2, 80);
        makeMesh(new THREE.BoxGeometry(6, 3, 6), 0xCCCAAA, 0, 4, 80);
        // Monument shaft - tall
        makeMesh(new THREE.CylinderGeometry(1.5, 2.5, 80, 8), 0xCCCAAA, 0, 45, 80);
        // Monument shaft upper taper
        makeMesh(new THREE.CylinderGeometry(0.8, 1.5, 20, 8), 0xCCCAAA, 0, 95, 80);
        // Golden Man warrior figure (sphere body approximation)
        makeMesh(new THREE.SphereGeometry(2.5, 7, 6), 0xFFCC00, 0, 108, 80);
        // Golden Man headdress/crown
        makeMesh(new THREE.ConeGeometry(2, 5, 7), 0xFFAA00, 0, 113, 80);
        // Golden Man spear
        makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 12, 5), 0xDD9900, 2, 112, 80);

        // Square perimeter buildings - government row north
        makeMesh(new THREE.BoxGeometry(40, 20, 15), 0xCCBBA0, 0, 10, 120);
        makeMesh(new THREE.BoxGeometry(42, 3, 17), 0xBBAA90, 0, 21, 120);
        // Government building columns
        makeMesh(new THREE.CylinderGeometry(1, 1, 20, 8), 0xDDCCBB, -10, 10, 110);
        makeMesh(new THREE.CylinderGeometry(1, 1, 20, 8), 0xDDCCBB, 0, 10, 110);
        makeMesh(new THREE.CylinderGeometry(1, 1, 20, 8), 0xDDCCBB, 10, 10, 110);

        // Square fountains
        makeMesh(new THREE.CylinderGeometry(6, 7, 1.5, 10), 0xCCBBAA, -30, 1, 80);
        makeMesh(new THREE.CylinderGeometry(3, 3, 3, 10), 0x88AACC, -30, 3, 80);
        makeMesh(new THREE.CylinderGeometry(6, 7, 1.5, 10), 0xCCBBAA, 30, 1, 80);
        makeMesh(new THREE.CylinderGeometry(3, 3, 3, 10), 0x88AACC, 30, 3, 80);

        // Square lampposts
        makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x333333, -40, 4, 65);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x333333, 40, 4, 65);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x333333, -40, 4, 95);
        makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 6), 0x333333, 40, 4, 95);
    }

    // =====================
    // GREEN MARKET (ZELYONY BAZAR)
    // =====================
    function buildGreenMarket() {
        // Main market hall base
        makeMesh(new THREE.BoxGeometry(55, 8, 40), 0xCC8833, 150, 4, 80);
        // Main domed roof - Soviet era dome
        makeMesh(new THREE.SphereGeometry(20, 10, 6), 0xBB7722, 150, 18, 80);
        // Dome base ring
        makeMesh(new THREE.CylinderGeometry(20, 20, 3, 12), 0xCC8833, 150, 9, 80);

        // East market hall
        makeMesh(new THREE.BoxGeometry(25, 6, 30), 0xCC8833, 180, 3, 80);
        makeMesh(new THREE.SphereGeometry(10, 8, 5), 0xBB7722, 180, 13, 80);

        // West market hall
        makeMesh(new THREE.BoxGeometry(25, 6, 30), 0xCC8833, 120, 3, 80);
        makeMesh(new THREE.SphereGeometry(10, 8, 5), 0xBB7722, 120, 13, 80);

        // Market entrance archway
        makeMesh(new THREE.BoxGeometry(16, 10, 3), 0xAA6622, 150, 5, 57);
        makeMesh(new THREE.SphereGeometry(7, 7, 4), 0xBB7722, 150, 12, 57);

        // Market stall awning frames
        makeMesh(new THREE.BoxGeometry(50, 1, 8), 0xFF8833, 150, 9, 62);
        makeMesh(new THREE.BoxGeometry(50, 1, 8), 0xFF6622, 150, 9, 98);

        // Market outdoor stalls
        makeMesh(new THREE.BoxGeometry(6, 3, 4), 0xDD9944, 135, 2, 62);
        makeMesh(new THREE.BoxGeometry(6, 3, 4), 0xCC8833, 145, 2, 62);
        makeMesh(new THREE.BoxGeometry(6, 3, 4), 0xDD9944, 155, 2, 62);
        makeMesh(new THREE.BoxGeometry(6, 3, 4), 0xCC8833, 165, 2, 62);

        // Surrounding low wall
        makeMesh(new THREE.BoxGeometry(65, 3, 2), 0xAA8855, 150, 2, 56);
        makeMesh(new THREE.BoxGeometry(65, 3, 2), 0xAA8855, 150, 2, 104);
        makeMesh(new THREE.BoxGeometry(2, 3, 50), 0xAA8855, 183, 2, 80);
        makeMesh(new THREE.BoxGeometry(2, 3, 50), 0xAA8855, 117, 2, 80);
    }

    // =====================
    // ILE-ALATAU MOUNTAINS
    // =====================
    function buildIleAlatauMountains() {
        // Major mountain peaks - Tian Shan range backdrop
        // Peak 1 - central massive peak
        makeMesh(new THREE.ConeGeometry(120, 280, 8), 0x8899AA, -150, 140, -250);
        // Snow cap peak 1
        makeMesh(new THREE.ConeGeometry(40, 80, 7), 0xEEEEFF, -150, 320, -250);

        // Peak 2 - left shoulder
        makeMesh(new THREE.ConeGeometry(90, 230, 8), 0x7788AA, -350, 115, -280);
        makeMesh(new THREE.ConeGeometry(30, 65, 7), 0xDDDDEE, -350, 260, -280);

        // Peak 3 - right shoulder
        makeMesh(new THREE.ConeGeometry(100, 250, 8), 0x8899AA, 50, 125, -280);
        makeMesh(new THREE.ConeGeometry(35, 70, 7), 0xEEEEFF, 50, 275, -280);

        // Peak 4 - far right
        makeMesh(new THREE.ConeGeometry(80, 200, 7), 0x99AABB, 250, 100, -300);
        makeMesh(new THREE.ConeGeometry(25, 55, 6), 0xDDDDFF, 250, 225, -300);

        // Peak 5 - far left
        makeMesh(new THREE.ConeGeometry(75, 190, 7), 0x7788AA, -500, 95, -290);
        makeMesh(new THREE.ConeGeometry(22, 50, 6), 0xEEEEFF, -500, 215, -290);

        // Rocky mid ridgeline
        makeMesh(new THREE.BoxGeometry(400, 40, 60), 0x8899AA, -150, 30, -220);
        makeMesh(new THREE.BoxGeometry(300, 25, 50), 0x9AABB8, -150, 48, -215);

        // Glacier/snowfield on slopes
        makeMesh(new THREE.BoxGeometry(80, 5, 40), 0xDDEEFF, -150, 170, -250, -0.3);
        makeMesh(new THREE.BoxGeometry(60, 4, 30), 0xCCDDFF, -300, 130, -265, -0.25);

        // Foothills - closer to rink level
        makeMesh(new THREE.ConeGeometry(50, 80, 7), 0x778899, -200, 40, -175);
        makeMesh(new THREE.ConeGeometry(40, 65, 7), 0x668899, -100, 33, -170);
        makeMesh(new THREE.ConeGeometry(45, 72, 7), 0x778899, -300, 36, -165);

        // Forested lower mountain slopes
        makeMesh(new THREE.BoxGeometry(250, 30, 40), 0x3A6A2A, -150, 15, -155);
        makeMesh(new THREE.BoxGeometry(200, 20, 30), 0x2A5A1A, -200, 8, -140);

        // Ground base terrain
        makeMesh(new THREE.BoxGeometry(700, 2, 500), 0x556644, -100, -1, -100);
    }

    function update(delta) {
        // Static environment — no per-frame update needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
