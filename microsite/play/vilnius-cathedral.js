window.VilniusCathedral = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 23480;
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
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        if (sx !== undefined) mesh.scale.set(sx, sy !== undefined ? sy : 1, sz !== undefined ? sz : 1);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildCathedralSquare();
        buildCathedral();
        buildCathedralBellTower();
        buildGediminasHill();
        buildGediminasTower();
        buildHillOfThreeCrosses();
        buildOldTownGround();
        buildGateOfDawn();
        buildStAnnesChurch();
        buildBernadineChurch();
        buildChurchOfStCasimir();
        buildBarbican();
        buildVilniusUniversity();
        buildMuseumOfOccupations();
        buildNeriRiver();
        buildTVTower();
        buildOldTownStreets();
        buildOldTownBuildings();
    }

    // -------------------------------------------------------
    // Cathedral Square
    // -------------------------------------------------------
    function buildCathedralSquare() {
        // Square ground
        makeMesh(new THREE.BoxGeometry(180, 1, 160), 0xC8C0B0, 0, -0.5, 0);

        // Gediminas Column (tall obelisk-style)
        makeMesh(new THREE.BoxGeometry(2, 20, 2), 0xD0C8B8, 0, 10, -60);
        makeMesh(new THREE.CylinderGeometry(0.5, 1.5, 4, 8), 0xD0C8B8, 0, 22, -60);

        // Square paving details — decorative stone rings as thin boxes
        makeMesh(new THREE.BoxGeometry(80, 0.3, 80), 0xB8B0A0, 0, 0.1, -20);
        makeMesh(new THREE.BoxGeometry(60, 0.3, 60), 0xC0B8A8, 0, 0.2, -20);

        // Lamposts around square
        makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 6), 0x444444, -60, 4, -20);
        makeMesh(new THREE.SphereGeometry(0.5, 6, 6), 0xFFFFCC, -60, 8.5, -20);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 6), 0x444444, 60, 4, -20);
        makeMesh(new THREE.SphereGeometry(0.5, 6, 6), 0xFFFFCC, 60, 8.5, -20);
        makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 6), 0x444444, 0, 4, 55);
        makeMesh(new THREE.SphereGeometry(0.5, 6, 6), 0xFFFFCC, 0, 8.5, 55);
    }

    // -------------------------------------------------------
    // Vilnius Cathedral — Neoclassical
    // -------------------------------------------------------
    function buildCathedral() {
        // Main cathedral body
        makeMesh(new THREE.BoxGeometry(70, 20, 40), 0xF0EDE8, 0, 10, -20);

        // Raised roof / pediment
        makeMesh(new THREE.BoxGeometry(70, 2, 40), 0xF0EDE8, 0, 21, -20);

        // Front pediment (triangular facade) — approximated with thin box
        makeMesh(new THREE.BoxGeometry(56, 8, 2), 0xECE9E4, 0, 22, 0);
        makeMesh(new THREE.BoxGeometry(50, 1, 2), 0xE8E5E0, 0, 26, 0);

        // Six facade columns
        for (var ci = 0; ci < 6; ci++) {
            var cx = -25 + ci * 10;
            makeMesh(new THREE.CylinderGeometry(1.2, 1.4, 18, 8), 0xF0EDE8, cx, 9, 2);
            // Column capital
            makeMesh(new THREE.BoxGeometry(3, 1.5, 3), 0xECE9E4, cx, 19, 2);
        }

        // Side walls with pilasters
        for (var pi = 0; pi < 3; pi++) {
            var pz = -10 + pi * 10;
            makeMesh(new THREE.BoxGeometry(2, 18, 2), 0xECE9E4, -36, 9, pz - 20);
            makeMesh(new THREE.BoxGeometry(2, 18, 2), 0xECE9E4, 36, 9, pz - 20);
        }

        // Rear apse (semicircular back end approximated with cylinder half)
        makeMesh(new THREE.CylinderGeometry(14, 14, 20, 8), 0xF0EDE8, 0, 10, -40);

        // Cathedral roof
        makeMesh(new THREE.BoxGeometry(72, 3, 42), 0xD8D4CE, 0, 22, -20);

        // Underground crypt marker — dark base
        makeMesh(new THREE.BoxGeometry(70, 2, 40), 0x8A8070, 0, -1.5, -20);

        // Crypt entrance steps
        makeMesh(new THREE.BoxGeometry(10, 0.5, 6), 0xD0C8B8, 0, 0.2, 2);
        makeMesh(new THREE.BoxGeometry(8, 0.5, 5), 0xD4CCC0, 0, 0.7, 1.5);
        makeMesh(new THREE.BoxGeometry(6, 0.5, 4), 0xD8D0C4, 0, 1.2, 1);

        // Main entrance doors
        makeMesh(new THREE.BoxGeometry(8, 10, 1), 0x5A4030, 0, 5, 1);

        // Cathedral windows — tall arched, approximated as boxes
        makeMesh(new THREE.BoxGeometry(4, 8, 1), 0x8AAABB, -25, 12, 1);
        makeMesh(new THREE.BoxGeometry(4, 8, 1), 0x8AAABB, 25, 12, 1);
        makeMesh(new THREE.BoxGeometry(3, 7, 1), 0x8AAABB, -30, 11, -10);
        makeMesh(new THREE.BoxGeometry(3, 7, 1), 0x8AAABB, 30, 11, -10);
        makeMesh(new THREE.BoxGeometry(3, 7, 1), 0x8AAABB, -30, 11, -30);
        makeMesh(new THREE.BoxGeometry(3, 7, 1), 0x8AAABB, 30, 11, -30);
    }

    // -------------------------------------------------------
    // Cathedral Bell Tower — separate from main body
    // -------------------------------------------------------
    function buildCathedralBellTower() {
        // Base of bell tower
        makeMesh(new THREE.BoxGeometry(14, 30, 14), 0xF0EDE8, -55, 15, -20);
        // Mid section
        makeMesh(new THREE.BoxGeometry(12, 15, 12), 0xECE9E4, -55, 37, -20);
        // Upper belfry
        makeMesh(new THREE.BoxGeometry(10, 8, 10), 0xE8E5E0, -55, 48, -20);
        // Bell tower roof
        makeMesh(new THREE.CylinderGeometry(0.5, 5, 10, 4), 0xC0B8A8, -55, 57, -20);
        // Spire
        makeMesh(new THREE.CylinderGeometry(0.1, 0.5, 8, 6), 0xA89880, -55, 66, -20);

        // Bell tower openings
        makeMesh(new THREE.BoxGeometry(4, 6, 1), 0x5A7080, -55, 49, -13);
        makeMesh(new THREE.BoxGeometry(4, 6, 1), 0x5A7080, -55, 49, -27);
        makeMesh(new THREE.BoxGeometry(1, 6, 4), 0x5A7080, -48, 49, -20);
        makeMesh(new THREE.BoxGeometry(1, 6, 4), 0x5A7080, -62, 49, -20);
    }

    // -------------------------------------------------------
    // Gediminas Hill
    // -------------------------------------------------------
    function buildGediminasHill() {
        // Hill base — large mound
        makeMesh(new THREE.CylinderGeometry(35, 55, 30, 12), 0x4A7040, 120, 15, -80);
        // Hill upper
        makeMesh(new THREE.CylinderGeometry(20, 35, 10, 12), 0x3A6030, 120, 30, -80);
        // Hill top platform
        makeMesh(new THREE.CylinderGeometry(16, 20, 3, 10), 0x5A6848, 120, 37, -80);
    }

    // -------------------------------------------------------
    // Gediminas Tower — 3-tier Gothic
    // -------------------------------------------------------
    function buildGediminasTower() {
        // Tier 1 — wide base
        makeMesh(new THREE.BoxGeometry(20, 14, 18), 0xD4C8A0, 120, 46, -80);
        // Tier 2 — mid section
        makeMesh(new THREE.BoxGeometry(17, 10, 15), 0xCEC2A0, 120, 57, -80);
        // Tier 3 — upper
        makeMesh(new THREE.BoxGeometry(14, 8, 12), 0xC8BCA0, 120, 65, -80);

        // Battlements — merlons on top
        for (var mi = 0; mi < 5; mi++) {
            var mx = -8 + mi * 4;
            makeMesh(new THREE.BoxGeometry(2, 3, 2), 0xD4C8A0, 120 + mx, 72, -74);
            makeMesh(new THREE.BoxGeometry(2, 3, 2), 0xD4C8A0, 120 + mx, 72, -86);
        }
        for (var mj = 0; mj < 4; mj++) {
            var mz = -6 + mj * 4;
            makeMesh(new THREE.BoxGeometry(2, 3, 2), 0xD4C8A0, 114, 72, -80 + mz);
            makeMesh(new THREE.BoxGeometry(2, 3, 2), 0xD4C8A0, 126, 72, -80 + mz);
        }

        // Tower windows — Gothic arched approximated as boxes
        makeMesh(new THREE.BoxGeometry(3, 5, 1), 0x6A7A8A, 120, 57, -73);
        makeMesh(new THREE.BoxGeometry(3, 5, 1), 0x6A7A8A, 120, 57, -87);
        makeMesh(new THREE.BoxGeometry(1, 5, 3), 0x6A7A8A, 113, 57, -80);
        makeMesh(new THREE.BoxGeometry(1, 5, 3), 0x6A7A8A, 127, 57, -80);

        // Lithuanian flag — box as flag panel
        makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 10, 4), 0x888888, 125, 78, -80);
        makeMesh(new THREE.BoxGeometry(5, 1.2, 0.1), 0xFDB913, 127.5, 82.5, -80);
        makeMesh(new THREE.BoxGeometry(5, 1.2, 0.1), 0x006A44, 127.5, 81.3, -80);
        makeMesh(new THREE.BoxGeometry(5, 1.2, 0.1), 0xC1272D, 127.5, 80.1, -80);
    }

    // -------------------------------------------------------
    // Hill of Three Crosses
    // -------------------------------------------------------
    function buildHillOfThreeCrosses() {
        // Small hill
        makeMesh(new THREE.CylinderGeometry(18, 28, 16, 10), 0x4A6840, 180, 8, -100);
        // Three white crosses
        makeMesh(new THREE.BoxGeometry(1.5, 18, 1.5), 0xF0F0F0, 174, 24, -100);
        makeMesh(new THREE.BoxGeometry(7, 1.5, 1.5), 0xF0F0F0, 174, 30, -100);
        makeMesh(new THREE.BoxGeometry(1.5, 18, 1.5), 0xF0F0F0, 181, 24, -100);
        makeMesh(new THREE.BoxGeometry(7, 1.5, 1.5), 0xF0F0F0, 181, 30, -100);
        makeMesh(new THREE.BoxGeometry(1.5, 18, 1.5), 0xF0F0F0, 188, 24, -100);
        makeMesh(new THREE.BoxGeometry(7, 1.5, 1.5), 0xF0F0F0, 188, 30, -100);
    }

    // -------------------------------------------------------
    // Old Town Ground / Streets
    // -------------------------------------------------------
    function buildOldTownGround() {
        // Old town ground plane (box slab)
        makeMesh(new THREE.BoxGeometry(500, 1, 400), 0x8A7A60, 50, -0.5, 100);
        // Cobblestone street color patches
        makeMesh(new THREE.BoxGeometry(8, 0.3, 200), 0x7A6A50, 0, 0.1, 100);
        makeMesh(new THREE.BoxGeometry(8, 0.3, 200), 0x7A6A50, 40, 0.1, 100);
        makeMesh(new THREE.BoxGeometry(8, 0.3, 200), 0x7A6A50, -40, 0.1, 100);
    }

    // -------------------------------------------------------
    // Gate of Dawn — Aušros Vartai
    // -------------------------------------------------------
    function buildGateOfDawn() {
        // Gate archway pillars
        makeMesh(new THREE.BoxGeometry(5, 18, 5), 0xC8B890, -80, 9, 180);
        makeMesh(new THREE.BoxGeometry(5, 18, 5), 0xC8B890, -60, 9, 180);
        // Arch lintel
        makeMesh(new THREE.BoxGeometry(25, 4, 5), 0xC8B890, -70, 19, 180);
        // Chapel above gate
        makeMesh(new THREE.BoxGeometry(20, 12, 10), 0xD4C8A0, -70, 27, 180);
        // Chapel roof
        makeMesh(new THREE.CylinderGeometry(1, 10, 6, 4), 0xA8988A, -70, 36, 180);
        // Small icon niche
        makeMesh(new THREE.BoxGeometry(3, 4, 1), 0xFFD700, -70, 26, 175);
        // Gate wall sections
        makeMesh(new THREE.BoxGeometry(40, 14, 3), 0xC0B080, -90, 7, 180);
        makeMesh(new THREE.BoxGeometry(40, 14, 3), 0xC0B080, -50, 7, 180);
    }

    // -------------------------------------------------------
    // St Anne's Church — Flamboyant Gothic red brick
    // -------------------------------------------------------
    function buildStAnnesChurch() {
        // Main nave
        makeMesh(new THREE.BoxGeometry(22, 28, 36), 0xC8602A, -90, 14, 80);
        // Elaborate facade face
        makeMesh(new THREE.BoxGeometry(22, 30, 2), 0xB8501A, -90, 15, 62);
        // Two slim spires
        makeMesh(new THREE.CylinderGeometry(1, 2.5, 30, 6), 0xC05020, -101, 34, 62);
        makeMesh(new THREE.CylinderGeometry(1, 2.5, 30, 6), 0xC05020, -79, 34, 62);
        // Spire tips
        makeMesh(new THREE.CylinderGeometry(0.1, 1, 8, 6), 0xA04018, -101, 53, 62);
        makeMesh(new THREE.CylinderGeometry(0.1, 1, 8, 6), 0xA04018, -79, 53, 62);
        // Central rose window area
        makeMesh(new THREE.SphereGeometry(3, 8, 8), 0x8AAABB, -90, 22, 61);
        // Buttresses — intricate Gothic detail boxes
        makeMesh(new THREE.BoxGeometry(2, 24, 3), 0xB85020, -102, 12, 72);
        makeMesh(new THREE.BoxGeometry(2, 24, 3), 0xB85020, -78, 12, 72);
        makeMesh(new THREE.BoxGeometry(2, 24, 3), 0xB85020, -102, 12, 90);
        makeMesh(new THREE.BoxGeometry(2, 24, 3), 0xB85020, -78, 12, 90);
        // Decorative pinnacles
        makeMesh(new THREE.CylinderGeometry(0.4, 0.8, 6, 6), 0xC05020, -103, 28, 68);
        makeMesh(new THREE.CylinderGeometry(0.4, 0.8, 6, 6), 0xC05020, -77, 28, 68);
        // Entrance portal
        makeMesh(new THREE.BoxGeometry(6, 12, 2), 0x4A3028, -90, 6, 61);
    }

    // -------------------------------------------------------
    // Bernardine Church — Gothic-Renaissance, adjacent
    // -------------------------------------------------------
    function buildBernadineChurch() {
        // Main body
        makeMesh(new THREE.BoxGeometry(30, 22, 50), 0xD4A870, -55, 11, 80);
        // Tower
        makeMesh(new THREE.BoxGeometry(10, 35, 10), 0xC89850, -40, 17, 65);
        makeMesh(new THREE.CylinderGeometry(1, 5, 8, 8), 0xB88840, -40, 39, 65);
        // Roof
        makeMesh(new THREE.BoxGeometry(30, 4, 50), 0xA08050, -55, 24, 80);
        // Side chapel
        makeMesh(new THREE.BoxGeometry(14, 16, 16), 0xCC9860, -72, 8, 80);
        makeMesh(new THREE.CylinderGeometry(0.5, 7, 6, 8), 0xB08850, -72, 22, 80);
    }

    // -------------------------------------------------------
    // Church of St Casimir — Baroque, first in city
    // -------------------------------------------------------
    function buildChurchOfStCasimir() {
        // Main body
        makeMesh(new THREE.BoxGeometry(26, 24, 44), 0xC8B880, -20, 12, 130);
        // Facade
        makeMesh(new THREE.BoxGeometry(26, 26, 3), 0xC8B880, -20, 13, 108);
        // Twin towers
        makeMesh(new THREE.BoxGeometry(8, 30, 8), 0xBCAA74, -32, 15, 110);
        makeMesh(new THREE.BoxGeometry(8, 30, 8), 0xBCAA74, -8, 15, 110);
        // Tower caps
        makeMesh(new THREE.CylinderGeometry(0.5, 4, 8, 8), 0xA89860, -32, 34, 110);
        makeMesh(new THREE.CylinderGeometry(0.5, 4, 8, 8), 0xA89860, -8, 34, 110);
        // Crown-shaped dome (the signature feature)
        makeMesh(new THREE.SphereGeometry(8, 10, 10), 0xC8B880, -20, 32, 122);
        // Crown points around dome
        for (var ki = 0; ki < 8; ki++) {
            var kangle = (ki / 8) * Math.PI * 2;
            var kr = 8;
            makeMesh(new THREE.CylinderGeometry(0.3, 0.8, 4, 6), 0xD4C488, -20 + Math.cos(kangle) * kr, 40, 122 + Math.sin(kangle) * kr);
        }
        // Small lantern on top of dome
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 5, 8), 0xBCAA74, -20, 40, 122);
        makeMesh(new THREE.CylinderGeometry(0.2, 1.5, 4, 6), 0xA89860, -20, 46, 122);
    }

    // -------------------------------------------------------
    // Barbican — defensive wall tower
    // -------------------------------------------------------
    function buildBarbican() {
        // Main round tower
        makeMesh(new THREE.CylinderGeometry(10, 12, 18, 10), 0x9A8870, -110, 9, 160);
        // Battlements top ring
        makeMesh(new THREE.CylinderGeometry(11, 11, 2, 10), 0x9A8870, -110, 19, 160);
        // Wall sections connecting
        makeMesh(new THREE.BoxGeometry(3, 12, 40), 0x907A60, -122, 6, 148);
        makeMesh(new THREE.BoxGeometry(3, 12, 40), 0x907A60, -98, 6, 148);
        // Gate passage through wall
        makeMesh(new THREE.BoxGeometry(8, 10, 3), 0x4A3820, -110, 5, 145);
        // Wall merlons
        for (var bi = 0; bi < 8; bi++) {
            var bangle = (bi / 8) * Math.PI * 2;
            makeMesh(new THREE.BoxGeometry(2, 3, 2), 0x9A8870, -110 + Math.cos(bangle) * 10, 21, 160 + Math.sin(bangle) * 10);
        }
    }

    // -------------------------------------------------------
    // Vilnius University — 13 courtyards
    // -------------------------------------------------------
    function buildVilniusUniversity() {
        // Main building complex
        makeMesh(new THREE.BoxGeometry(60, 16, 70), 0xD4C0A0, 70, 8, 90);
        // Inner courtyard void suggestion — darker floor patch
        makeMesh(new THREE.BoxGeometry(20, 0.5, 20), 0xB0A080, 70, 0.3, 90);
        makeMesh(new THREE.BoxGeometry(16, 0.5, 16), 0xB0A080, 95, 0.3, 60);
        // Baroque church tower (St John's)
        makeMesh(new THREE.BoxGeometry(8, 40, 8), 0xC8B890, 80, 20, 68);
        makeMesh(new THREE.BoxGeometry(6, 10, 6), 0xBCAA84, 80, 45, 68);
        makeMesh(new THREE.CylinderGeometry(0.3, 3, 8, 8), 0xA89870, 80, 54, 68);
        // Second wing
        makeMesh(new THREE.BoxGeometry(50, 14, 20), 0xD0BC9C, 80, 7, 55);
        // Arcaded corridor boxes
        for (var ui = 0; ui < 6; ui++) {
            makeMesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 6), 0xC8B890, 45 + ui * 6, 5, 60);
        }
    }

    // -------------------------------------------------------
    // Museum of Occupations / KGB headquarters
    // -------------------------------------------------------
    function buildMuseumOfOccupations() {
        // Brutal Soviet building
        makeMesh(new THREE.BoxGeometry(40, 18, 30), 0x888888, 50, 9, -80);
        // Heavy cornice
        makeMesh(new THREE.BoxGeometry(42, 2, 32), 0x787878, 50, 19, -80);
        // Small basement windows — torture chambers
        makeMesh(new THREE.BoxGeometry(4, 2, 1), 0x333333, 35, 2, -65);
        makeMesh(new THREE.BoxGeometry(4, 2, 1), 0x333333, 45, 2, -65);
        makeMesh(new THREE.BoxGeometry(4, 2, 1), 0x333333, 55, 2, -65);
        makeMesh(new THREE.BoxGeometry(4, 2, 1), 0x333333, 65, 2, -65);
        // KGB steps up to entrance
        makeMesh(new THREE.BoxGeometry(14, 0.5, 4), 0x909090, 50, 0.3, -65);
        makeMesh(new THREE.BoxGeometry(12, 0.5, 3), 0x989898, 50, 0.8, -64);
        makeMesh(new THREE.BoxGeometry(10, 0.5, 2), 0xA0A0A0, 50, 1.3, -63);
        // Columns on facade
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 14, 6), 0x909090, 38, 7, -65);
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 14, 6), 0x909090, 50, 7, -65);
        makeMesh(new THREE.CylinderGeometry(0.8, 1, 14, 6), 0x909090, 62, 7, -65);
    }

    // -------------------------------------------------------
    // Neris River with three islands
    // -------------------------------------------------------
    function buildNeriRiver() {
        // River bed (flat slab)
        makeMesh(new THREE.BoxGeometry(500, 1, 50), 0x2A6A8A, 0, -1.5, -140);
        // River darker center
        makeMesh(new THREE.BoxGeometry(500, 0.5, 30), 0x1A5A7A, 0, -1.3, -140);
        // Island 1
        makeMesh(new THREE.CylinderGeometry(12, 14, 1.5, 8), 0x4A7040, -80, 0.5, -140);
        makeMesh(new THREE.CylinderGeometry(8, 10, 1, 8), 0x3A6030, -80, 1, -140);
        // Island 2
        makeMesh(new THREE.CylinderGeometry(8, 10, 1.5, 8), 0x4A7040, 40, 0.5, -145);
        // Island 3
        makeMesh(new THREE.CylinderGeometry(6, 8, 1.5, 8), 0x4A7040, 160, 0.5, -138);
        // River banks
        makeMesh(new THREE.BoxGeometry(500, 2, 8), 0x8A7860, 0, -0.5, -115);
        makeMesh(new THREE.BoxGeometry(500, 2, 8), 0x8A7860, 0, -0.5, -165);
        // Bridge over river
        makeMesh(new THREE.BoxGeometry(80, 2, 10), 0xA09080, 0, 0.5, -140);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 8, 8), 0x908070, -30, 4, -140);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 8, 8), 0x908070, 0, 4, -140);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 8, 8), 0x908070, 30, 4, -140);
    }

    // -------------------------------------------------------
    // TV Tower — 326m Soviet-era
    // -------------------------------------------------------
    function buildTVTower() {
        // Wide base supports
        makeMesh(new THREE.CylinderGeometry(4, 8, 15, 8), 0xCCCCCC, 300, 7, -30);
        makeMesh(new THREE.CylinderGeometry(3, 4, 8, 8), 0xCCCCCC, 300, 19, -30);
        // Tapering main shaft
        makeMesh(new THREE.CylinderGeometry(1.5, 3, 80, 8), 0xCCCCCC, 300, 63, -30);
        makeMesh(new THREE.CylinderGeometry(0.8, 1.5, 80, 8), 0xC8C8C8, 300, 143, -30);
        makeMesh(new THREE.CylinderGeometry(0.5, 0.8, 80, 8), 0xC0C0C0, 300, 223, -30);
        // Revolving restaurant pod
        makeMesh(new THREE.CylinderGeometry(8, 8, 6, 12), 0xBBBBBB, 300, 110, -30);
        makeMesh(new THREE.CylinderGeometry(9, 9, 1.5, 12), 0xAAAAAA, 300, 113.5, -30);
        // Antenna tip
        makeMesh(new THREE.CylinderGeometry(0.1, 0.5, 40, 6), 0xB8B8B8, 300, 283, -30);
        // Tripod legs at base
        makeMesh(new THREE.BoxGeometry(2, 20, 3), 0xCCCCCC, 288, 7, -30, 0, 0, 0.5);
        makeMesh(new THREE.BoxGeometry(2, 20, 3), 0xCCCCCC, 312, 7, -30, 0, 0, -0.5);
        makeMesh(new THREE.BoxGeometry(2, 20, 3), 0xCCCCCC, 300, 7, -18, 0.5, 0, 0);
    }

    // -------------------------------------------------------
    // Old Town Street Buildings — narrow facades
    // -------------------------------------------------------
    function buildOldTownStreets() {
        // Street lamp row
        for (var li = 0; li < 8; li++) {
            makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 5, 5), 0x444444, -70 + li * 20, 2.5, 50);
            makeMesh(new THREE.SphereGeometry(0.35, 5, 5), 0xFFEE88, -70 + li * 20, 5.5, 50);
        }
        // Cobblestone street bands
        makeMesh(new THREE.BoxGeometry(6, 0.2, 260), 0x706050, -30, 0.1, 110);
        makeMesh(new THREE.BoxGeometry(6, 0.2, 260), 0x706050, -10, 0.1, 110);
    }

    // -------------------------------------------------------
    // Old Town Buildings — varied colorful facades
    // -------------------------------------------------------
    function buildOldTownBuildings() {
        var colors = [0xCC8822, 0xBB7730, 0xDD9940, 0xC08028, 0xAA7020, 0xD4A050];
        var roofColors = [0x884420, 0x773310, 0x995530, 0x882200, 0x774422];

        // Row of buildings along main street — left side
        for (var oi = 0; oi < 8; oi++) {
            var ow = 12 + (oi % 3) * 4;
            var oh = 10 + (oi % 4) * 5;
            var oz = 50 + oi * 22;
            var oc = colors[oi % colors.length];
            var orc = roofColors[oi % roofColors.length];
            makeMesh(new THREE.BoxGeometry(ow, oh, 14), oc, -130, oh / 2, oz);
            makeMesh(new THREE.BoxGeometry(ow, 5, 14), orc, -130, oh + 2.5, oz);
        }

        // Row — right side
        for (var ri = 0; ri < 8; ri++) {
            var rw = 10 + (ri % 4) * 3;
            var rh = 12 + (ri % 3) * 4;
            var rz = 55 + ri * 22;
            var rc = colors[(ri + 2) % colors.length];
            var rrc = roofColors[(ri + 1) % roofColors.length];
            makeMesh(new THREE.BoxGeometry(rw, rh, 14), rc, 40, rh / 2, rz);
            makeMesh(new THREE.BoxGeometry(rw, 4, 14), rrc, 40, rh + 2, rz);
        }

        // A few taller corner buildings
        makeMesh(new THREE.BoxGeometry(18, 22, 18), 0xCC8822, -10, 11, 60);
        makeMesh(new THREE.BoxGeometry(18, 6, 18), 0x884420, -10, 25, 60);
        makeMesh(new THREE.BoxGeometry(16, 20, 16), 0xD4A050, 20, 10, 120);
        makeMesh(new THREE.BoxGeometry(16, 5, 16), 0x995530, 20, 22, 120);

        // Courtyard archway
        makeMesh(new THREE.BoxGeometry(3, 10, 3), 0xBB8830, -10, 5, 75);
        makeMesh(new THREE.BoxGeometry(3, 10, 3), 0xBB8830, 2, 5, 75);
        makeMesh(new THREE.BoxGeometry(15, 3, 3), 0xBB8830, -4, 11, 75);
    }

    function update(delta) {
        // No per-frame updates needed
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
