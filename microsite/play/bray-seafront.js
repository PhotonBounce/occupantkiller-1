window.BraySeafront = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 19120;
    var CY = 0;
    var CZ = 0;

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        buildPromenade();
        buildBeach();
        buildSea();
        buildVictorianBuildings();
        buildBrayHead();
        buildCliffWalkPath();
        buildAmusementArcades();
        buildBandstand();
        buildDartStation();
        buildKilrudderyHouse();
        buildLampPosts();
        buildSeawalls();
        buildBeachHuts();
        buildPierStructure();
        buildRoadsAndSidewalks();
    }

    function buildPromenade() {
        // Main esplanade slab - long grey path
        makeMesh(new THREE.BoxGeometry(600, 1, 22), 0xC0C0C0, CX, CY + 0.5, CZ);

        // Victorian railing posts along north edge of promenade - every 10 units
        for (var i = 0; i < 60; i++) {
            var px = CX - 290 + i * 10;
            makeMesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), 0x808080, px, CY + 1.6, CZ - 10);
        }
        // Top rail along north edge
        makeMesh(new THREE.BoxGeometry(598, 0.15, 0.15), 0x808080, CX, CY + 2.25, CZ - 10);

        // Victorian railing posts along south edge
        for (var j = 0; j < 60; j++) {
            var qx = CX - 290 + j * 10;
            makeMesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), 0x808080, qx, CY + 1.6, CZ + 10);
        }
        // Top rail along south edge
        makeMesh(new THREE.BoxGeometry(598, 0.15, 0.15), 0x808080, CX, CY + 2.25, CZ + 10);

        // Mid-rail north
        makeMesh(new THREE.BoxGeometry(598, 0.1, 0.1), 0x808080, CX, CY + 1.95, CZ - 10);
        // Mid-rail south
        makeMesh(new THREE.BoxGeometry(598, 0.1, 0.1), 0x808080, CX, CY + 1.95, CZ + 10);
    }

    function buildBeach() {
        // Grey shingle/pebble beach - main body
        makeMesh(new THREE.BoxGeometry(600, 0.6, 55), 0x696969, CX, CY + 0.3, CZ - 38);

        // White wave edge strip (nearest water)
        makeMesh(new THREE.BoxGeometry(600, 0.2, 4), 0xFFFAF0, CX, CY + 0.7, CZ - 62);

        // Second wave line slightly further out
        makeMesh(new THREE.BoxGeometry(600, 0.15, 2.5), 0xFFFAF0, CX, CY + 0.5, CZ - 68);

        // Third foam line
        makeMesh(new THREE.BoxGeometry(600, 0.1, 1.5), 0xFFFAF0, CX, CY + 0.35, CZ - 74);

        // Upper beach transition strip (darker pebble near prom)
        makeMesh(new THREE.BoxGeometry(600, 0.5, 8), 0x5A5A5A, CX, CY + 0.75, CZ - 14);

        // Pebble mound low ridge running along beach centre
        makeMesh(new THREE.BoxGeometry(600, 0.4, 6), 0x7A7A7A, CX, CY + 0.8, CZ - 32);
    }

    function buildSea() {
        // Main Irish Sea body
        makeMesh(new THREE.BoxGeometry(700, 0.5, 300), 0x006994, CX, CY + 0.1, CZ - 215);

        // Shallower nearshore tone
        makeMesh(new THREE.BoxGeometry(700, 0.3, 30), 0x1A85AD, CX, CY + 0.25, CZ - 80);

        // Darker deep water further out
        makeMesh(new THREE.BoxGeometry(700, 0.2, 120), 0x004F6E, CX, CY + 0.05, CZ - 300);
    }

    function buildVictorianBuildings() {
        // Array of building configs: [xOffset, width, depth, floors, color, roofColor]
        var bldgs = [
            [-240, 28, 18, 4, 0xCD5C5C, 0xA0522D],
            [-205, 22, 18, 3, 0xF5F0E8, 0x8B7355],
            [-178, 24, 18, 4, 0xDAA520, 0x8B6914],
            [-149, 20, 18, 3, 0xCD5C5C, 0xA0522D],
            [-124, 26, 18, 4, 0xF5F0E8, 0x8B7355],
            [-93,  22, 18, 3, 0xDAA520, 0x8B6914],
            [-66,  24, 18, 4, 0xCD5C5C, 0xA0522D],
            [-37,  20, 18, 3, 0xF5F0E8, 0x8B7355],
            [-10,  26, 18, 4, 0xDAA520, 0x8B6914],
            [ 20,  22, 18, 3, 0xCD5C5C, 0xA0522D],
            [ 48,  24, 18, 4, 0xF5F0E8, 0x8B7355],
            [ 78,  20, 18, 3, 0xDAA520, 0x8B6914],
            [108,  28, 18, 4, 0xCD5C5C, 0xA0522D],
            [142,  22, 18, 3, 0xF5F0E8, 0x8B7355],
            [170,  24, 18, 4, 0xDAA520, 0x8B6914],
            [200,  20, 18, 3, 0xCD5C5C, 0xA0522D],
            [226,  26, 18, 4, 0xF5F0E8, 0x8B7355]
        ];

        for (var b = 0; b < bldgs.length; b++) {
            var cfg = bldgs[b];
            var bx = CX + cfg[0];
            var bw = cfg[1];
            var bd = cfg[2];
            var floorH = 3.5;
            var totalH = cfg[3] * floorH;
            var bcolor = cfg[4];
            var rcolor = cfg[5];
            var bz = CZ + 25;

            // Main building body
            makeMesh(new THREE.BoxGeometry(bw, totalH, bd), bcolor, bx, CY + totalH / 2, bz);

            // Roof parapet
            makeMesh(new THREE.BoxGeometry(bw + 0.6, 0.8, bd + 0.6), rcolor, bx, CY + totalH + 0.4, bz);

            // Ground floor bay windows (box protrusions)
            makeMesh(new THREE.BoxGeometry(bw * 0.45, floorH * 0.7, 1.5), 0xD4C5A0, bx, CY + floorH * 0.35, bz - bd / 2 - 0.75);

            // Door frame
            makeMesh(new THREE.BoxGeometry(2.2, 3.0, 0.3), 0x3D2B1F, bx, CY + 1.5, bz - bd / 2 - 0.15);

            // Chimney stacks
            makeMesh(new THREE.BoxGeometry(1.0, 2.5, 1.0), 0x8B4513, bx - bw * 0.3, CY + totalH + 1.25, bz);
            makeMesh(new THREE.BoxGeometry(1.0, 2.5, 1.0), 0x8B4513, bx + bw * 0.3, CY + totalH + 1.25, bz);
        }
    }

    function buildBrayHead() {
        // Bray Head is south-west of the seafront
        var hx = CX - 280;
        var hz = CZ + 160;

        // Main headland base - large sloping hill approximated with stacked boxes
        makeMesh(new THREE.BoxGeometry(180, 14, 140), 0x556B2F, hx, CY + 7, hz);
        makeMesh(new THREE.BoxGeometry(140, 22, 110), 0x4A5E28, hx - 10, CY + 22, hz + 10);
        makeMesh(new THREE.BoxGeometry(100, 28, 80), 0x3E5020, hx - 18, CY + 41, hz + 20);
        makeMesh(new THREE.BoxGeometry(70, 20, 60), 0x354418, hx - 24, CY + 61, hz + 28);
        makeMesh(new THREE.BoxGeometry(45, 16, 40), 0x2E3B12, hx - 30, CY + 79, hz + 36);
        makeMesh(new THREE.BoxGeometry(28, 12, 25), 0x26300D, hx - 34, CY + 93, hz + 42);
        // Rocky summit cap
        makeMesh(new THREE.BoxGeometry(16, 6, 14), 0x4A4A3A, hx - 36, CY + 103, hz + 46);

        // Summit cross - vertical beam
        var crossX = hx - 36;
        var crossY = CY + 112;
        var crossZ = hz + 46;
        makeMesh(new THREE.BoxGeometry(0.7, 10, 0.7), 0xC0C0C0, crossX, crossY + 5, crossZ);
        // Summit cross - horizontal beam
        makeMesh(new THREE.BoxGeometry(5.5, 0.7, 0.7), 0xC0C0C0, crossX, crossY + 8, crossZ);

        // Cliff face visible on seaward side (steep rocky face)
        makeMesh(new THREE.BoxGeometry(12, 90, 30), 0x6B6B5A, hx + 50, CY + 45, hz - 10);
        makeMesh(new THREE.BoxGeometry(10, 70, 22), 0x5E5E4E, hx + 45, CY + 35, hz - 22);

        // Rocky debris at cliff base
        makeMesh(new THREE.BoxGeometry(60, 3, 12), 0x5A5A4A, hx + 40, CY + 1.5, hz - 28);
        makeMesh(new THREE.BoxGeometry(30, 2, 8), 0x6A6A5A, hx + 55, CY + 1, hz - 32);

        // Hillside lower green slopes
        makeMesh(new THREE.BoxGeometry(80, 8, 60), 0x6B8E3A, hx + 30, CY + 4, hz + 30);
        makeMesh(new THREE.BoxGeometry(60, 5, 45), 0x7A9B45, hx + 50, CY + 2.5, hz + 20);
    }

    function buildCliffWalkPath() {
        // Grey path running along base of Bray Head cliffs, heading south from beach end
        var pwx = CX - 250;
        // Winding path approximated with several box segments
        makeMesh(new THREE.BoxGeometry(3, 0.3, 70), 0x999999, pwx, CY + 0.65, CZ + 70);
        makeMesh(new THREE.BoxGeometry(3, 0.3, 60), 0x999999, pwx - 10, CY + 2, CZ + 120);
        makeMesh(new THREE.BoxGeometry(3, 0.3, 50), 0x999999, pwx - 22, CY + 5, CZ + 162);
        makeMesh(new THREE.BoxGeometry(3, 0.3, 40), 0x999999, pwx - 30, CY + 10, CZ + 196);

        // Cliff walk signpost
        makeMesh(new THREE.BoxGeometry(0.2, 2.5, 0.2), 0x8B6914, pwx, CY + 1.25, CZ + 42);
        makeMesh(new THREE.BoxGeometry(1.8, 0.3, 0.15), 0xF5F0E8, pwx + 1.0, CY + 2.5, CZ + 42);
    }

    function buildAmusementArcades() {
        // Cluster of bright arcade buildings near centre of seafront
        var arcadeConfigs = [
            [CX + 30, CZ + 23, 16, 10, 5.5, 0xFF6B35],
            [CX + 52, CZ + 23, 14, 10, 5.5, 0xFFAA00],
            [CX + 72, CZ + 23, 14, 10, 5.5, 0xFF6B35],
            [CX - 30, CZ + 23, 18, 10, 5.5, 0xFFAA00]
        ];

        for (var a = 0; a < arcadeConfigs.length; a++) {
            var ac = arcadeConfigs[a];
            // Main body
            makeMesh(new THREE.BoxGeometry(ac[2], ac[4], ac[3]), ac[5], ac[0], CY + ac[4] / 2, ac[1]);
            // Facade sign board above door
            makeMesh(new THREE.BoxGeometry(ac[2] - 1, 1.5, 0.3), 0xFFFF00, ac[0], CY + ac[4] + 0.75, ac[1] - ac[3] / 2 - 0.15);
            // Roof edge fascia
            makeMesh(new THREE.BoxGeometry(ac[2] + 0.5, 0.6, ac[3] + 0.5), 0xCC3300, ac[0], CY + ac[4] + 0.3, ac[1]);
            // Awning over entrance
            makeMesh(new THREE.BoxGeometry(ac[2] - 2, 0.3, 2.5), 0xCC3300, ac[0], CY + 3.2, ac[1] - ac[3] / 2 - 1.25);
        }
    }

    function buildBandstand() {
        var bsx = CX - 60;
        var bsz = CZ + 5;

        // Octagonal base platform (approximate with cylinder)
        makeMesh(new THREE.CylinderGeometry(6.5, 6.5, 0.7, 8), 0xC0C0C0, bsx, CY + 0.35, bsz);

        // Raised inner floor
        makeMesh(new THREE.CylinderGeometry(5.5, 5.5, 0.4, 8), 0xD8D8D8, bsx, CY + 0.9, bsz);

        // Eight support columns around perimeter
        for (var k = 0; k < 8; k++) {
            var ang = (k / 8) * Math.PI * 2;
            var cpx = bsx + Math.sin(ang) * 5.0;
            var cpz = bsz + Math.cos(ang) * 5.0;
            makeMesh(new THREE.CylinderGeometry(0.18, 0.18, 4.5, 6), 0xB0B0B0, cpx, CY + 2.6, cpz);
        }

        // Roof cone
        makeMesh(new THREE.ConeGeometry(6.8, 3.2, 8), 0x7B9B40, bsx, CY + 6.6, bsz);

        // Roof finial
        makeMesh(new THREE.SphereGeometry(0.35, 8, 6), 0xDAA520, bsx, CY + 8.35, bsz);

        // Inner railing ring
        makeMesh(new THREE.CylinderGeometry(5.2, 5.2, 0.12, 16), 0x999999, bsx, CY + 2.0, bsz);
        makeMesh(new THREE.CylinderGeometry(5.2, 5.2, 0.12, 16), 0x999999, bsx, CY + 1.4, bsz);

        // Central performance stage box
        makeMesh(new THREE.BoxGeometry(4, 0.35, 4), 0xBCBCBC, bsx, CY + 1.3, bsz);
    }

    function buildDartStation() {
        var stx = CX + 230;
        var stz = CZ + 28;

        // Station main building - Victorian red brick
        makeMesh(new THREE.BoxGeometry(40, 10, 16), 0xCD5C5C, stx, CY + 5, stz);

        // Station roof
        makeMesh(new THREE.BoxGeometry(42, 1, 18), 0x8B4513, stx, CY + 10.5, stz);

        // Platform canopy support posts
        for (var sp = 0; sp < 6; sp++) {
            makeMesh(new THREE.BoxGeometry(0.4, 4.5, 0.4), 0x4A4A4A, stx - 18 + sp * 7, CY + 2.25, stz - 10);
        }
        // Platform canopy roof
        makeMesh(new THREE.BoxGeometry(40, 0.4, 6), 0x5A5A5A, stx, CY + 4.7, stz - 9);

        // Platform surface
        makeMesh(new THREE.BoxGeometry(46, 0.5, 8), 0x808080, stx, CY + 0.25, stz - 8);

        // Ticket hall entrance arch surround (box frame)
        makeMesh(new THREE.BoxGeometry(8, 8, 1.0), 0xA0522D, stx, CY + 4, stz - 8);
        // Arch fill (door void approximation - just a darker box)
        makeMesh(new THREE.BoxGeometry(4, 6, 0.5), 0x2A1A0A, stx, CY + 3.5, stz - 8.3);

        // Station sign board
        makeMesh(new THREE.BoxGeometry(14, 1.8, 0.4), 0x003366, stx, CY + 9, stz - 8.1);

        // Railway tracks (thin boxes)
        makeMesh(new THREE.BoxGeometry(80, 0.2, 0.3), 0x4A4A4A, stx, CY + 0.1, stz - 14);
        makeMesh(new THREE.BoxGeometry(80, 0.2, 0.3), 0x4A4A4A, stx, CY + 0.1, stz - 16.5);

        // Sleepers (cross ties)
        for (var sl = 0; sl < 16; sl++) {
            makeMesh(new THREE.BoxGeometry(0.4, 0.15, 4), 0x5C3D11, stx - 36 + sl * 5, CY + 0.07, stz - 15.25);
        }

        // Station chimney
        makeMesh(new THREE.BoxGeometry(1.5, 3, 1.5), 0x8B4513, stx + 16, CY + 11.5, stz);

        // Station clock tower
        makeMesh(new THREE.BoxGeometry(4, 6, 4), 0xB85C5C, stx - 18, CY + 13, stz);
        makeMesh(new THREE.SphereGeometry(2.1, 8, 6), 0x999999, stx - 18, CY + 16.5, stz);
    }

    function buildKilrudderyHouse() {
        // Elizabethan Revival mansion - visible in distance inland (south/south-west)
        var khx = CX - 160;
        var khz = CZ + 300;

        // Main house body
        makeMesh(new THREE.BoxGeometry(55, 18, 28), 0xF5F0E8, khx, CY + 9, khz);

        // Wing left
        makeMesh(new THREE.BoxGeometry(20, 14, 20), 0xF5F0E8, khx - 37, CY + 7, khz);
        // Wing right
        makeMesh(new THREE.BoxGeometry(20, 14, 20), 0xF5F0E8, khx + 37, CY + 7, khz);

        // Central tower
        makeMesh(new THREE.BoxGeometry(12, 26, 12), 0xEDE8DC, khx, CY + 13, khz);

        // Turrets on corners
        makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 22, 8), 0xF0EBE0, khx - 27.5, CY + 11, khz - 14);
        makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 22, 8), 0xF0EBE0, khx + 27.5, CY + 11, khz - 14);
        makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 22, 8), 0xF0EBE0, khx - 27.5, CY + 11, khz + 14);
        makeMesh(new THREE.CylinderGeometry(2.5, 2.5, 22, 8), 0xF0EBE0, khx + 27.5, CY + 11, khz + 14);

        // Turret caps
        makeMesh(new THREE.ConeGeometry(3.0, 5, 8), 0xB0A898, khx - 27.5, CY + 24, khz - 14);
        makeMesh(new THREE.ConeGeometry(3.0, 5, 8), 0xB0A898, khx + 27.5, CY + 24, khz - 14);
        makeMesh(new THREE.ConeGeometry(3.0, 5, 8), 0xB0A898, khx - 27.5, CY + 24, khz + 14);
        makeMesh(new THREE.ConeGeometry(3.0, 5, 8), 0xB0A898, khx + 27.5, CY + 24, khz + 14);

        // Main roof
        makeMesh(new THREE.BoxGeometry(57, 2, 30), 0xA09080, khx, CY + 19, khz);

        // Formal gardens in front (low hedge boxes)
        makeMesh(new THREE.BoxGeometry(20, 1, 8), 0x3A6B2A, khx - 20, CY + 0.5, khz - 22);
        makeMesh(new THREE.BoxGeometry(20, 1, 8), 0x3A6B2A, khx + 20, CY + 0.5, khz - 22);

        // Driveway gates (pillars)
        makeMesh(new THREE.BoxGeometry(1.5, 5, 1.5), 0xD0C8B8, khx - 8, CY + 2.5, khz - 26);
        makeMesh(new THREE.BoxGeometry(1.5, 5, 1.5), 0xD0C8B8, khx + 8, CY + 2.5, khz - 26);
    }

    function buildLampPosts() {
        // Victorian lamp posts along promenade every 30 units
        for (var lp = 0; lp < 20; lp++) {
            var lpx = CX - 285 + lp * 30;
            // Post shaft
            makeMesh(new THREE.CylinderGeometry(0.12, 0.18, 4.5, 6), 0x2F2F2F, lpx, CY + 2.25, CZ + 2);
            // Lamp globe
            makeMesh(new THREE.SphereGeometry(0.32, 8, 6), 0xFFF8DC, lpx, CY + 4.8, CZ + 2);
            // Lamp arm
            makeMesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), 0x2F2F2F, lpx, CY + 4.5, CZ + 1.6);
        }
    }

    function buildSeawalls() {
        // Seawall / retaining wall between promenade and beach
        makeMesh(new THREE.BoxGeometry(600, 2.5, 1.5), 0xA0A0A0, CX, CY + 1.25, CZ - 12);
        // Seawall face detail - buttress blocks every 50 units
        for (var bk = 0; bk < 12; bk++) {
            makeMesh(new THREE.BoxGeometry(1.2, 2.5, 0.5), 0x888888, CX - 275 + bk * 50, CY + 1.25, CZ - 12.8);
        }

        // Low sea defence rocks at waterline
        for (var rk = 0; rk < 18; rk++) {
            var rkx = CX - 270 + rk * 32;
            makeMesh(new THREE.BoxGeometry(5, 1.2, 4), 0x5A5A4A, rkx, CY + 0.6, CZ - 70);
        }
    }

    function buildBeachHuts() {
        // Colourful beach huts at north end of beach
        var hutColors = [0xE74C3C, 0x3498DB, 0x2ECC71, 0xF39C12, 0x9B59B6, 0x1ABC9C, 0xE67E22, 0xE91E63];
        for (var h = 0; h < 8; h++) {
            var hutx = CX + 160 + h * 8;
            var hutz = CZ - 20;
            // Hut body
            makeMesh(new THREE.BoxGeometry(5.5, 4, 5), hutColors[h], hutx, CY + 2, hutz);
            // Hut roof
            makeMesh(new THREE.BoxGeometry(6, 0.4, 5.5), 0x6B4226, hutx, CY + 4.2, hutz);
            // Hut door
            makeMesh(new THREE.BoxGeometry(1.4, 2.5, 0.25), 0x4A3020, hutx, CY + 1.25, hutz - 2.6);
        }
    }

    function buildPierStructure() {
        // Small jetty/pier extending from centre of promenade into sea
        var pierx = CX;
        var pierStartZ = CZ - 13;

        // Pier deck
        makeMesh(new THREE.BoxGeometry(8, 0.5, 60), 0x8B7355, pierx, CY + 1.25, pierStartZ - 30);

        // Pier support legs
        for (var pl = 0; pl < 6; pl++) {
            var legz = pierStartZ - 8 - pl * 9;
            makeMesh(new THREE.CylinderGeometry(0.25, 0.3, 2.5, 6), 0x6B5535, pierx - 3, CY + 0, legz);
            makeMesh(new THREE.CylinderGeometry(0.25, 0.3, 2.5, 6), 0x6B5535, pierx + 3, CY + 0, legz);
        }

        // Pier railing
        makeMesh(new THREE.BoxGeometry(0.12, 0.9, 58), 0x5A4A2A, pierx - 4, CY + 1.95, pierStartZ - 29);
        makeMesh(new THREE.BoxGeometry(0.12, 0.9, 58), 0x5A4A2A, pierx + 4, CY + 1.95, pierStartZ - 29);

        // End of pier shelter
        makeMesh(new THREE.BoxGeometry(10, 5, 8), 0xDAA520, pierx, CY + 3.5, pierStartZ - 58);
        makeMesh(new THREE.BoxGeometry(11, 0.6, 9), 0xA08020, pierx, CY + 6.3, pierStartZ - 58);
    }

    function buildRoadsAndSidewalks() {
        // Main seafront road running parallel to promenade (behind buildings)
        makeMesh(new THREE.BoxGeometry(600, 0.4, 10), 0x3A3A3A, CX, CY + 0.2, CZ + 47);

        // Road centre line markings
        makeMesh(new THREE.BoxGeometry(598, 0.05, 0.3), 0xFFFF00, CX, CY + 0.43, CZ + 47);

        // Pavement beside road (between buildings and road)
        makeMesh(new THREE.BoxGeometry(600, 0.3, 5), 0xB0B0B0, CX, CY + 0.65, CZ + 40);

        // Cross road at station end
        makeMesh(new THREE.BoxGeometry(10, 0.4, 50), 0x3A3A3A, CX + 250, CY + 0.2, CZ + 20);

        // Zebra crossing stripes
        for (var zc = 0; zc < 5; zc++) {
            makeMesh(new THREE.BoxGeometry(10, 0.05, 1.2), 0xFFFFFF, CX + 250, CY + 0.42, CZ + 10 + zc * 3);
        }

        // Grassy verge strip behind buildings inland
        makeMesh(new THREE.BoxGeometry(600, 0.3, 20), 0x4A7A30, CX, CY + 0.15, CZ + 70);

        // Park bench along promenade (facing sea)
        for (var bn = 0; bn < 10; bn++) {
            var bnx = CX - 240 + bn * 52;
            // Bench seat
            makeMesh(new THREE.BoxGeometry(3.5, 0.2, 0.9), 0x8B6914, bnx, CY + 1.3, CZ + 6);
            // Bench back
            makeMesh(new THREE.BoxGeometry(3.5, 0.7, 0.15), 0x8B6914, bnx, CY + 1.85, CZ + 6.5);
            // Bench legs
            makeMesh(new THREE.BoxGeometry(0.12, 1.1, 0.9), 0x555555, bnx - 1.6, CY + 0.55, CZ + 6);
            makeMesh(new THREE.BoxGeometry(0.12, 1.1, 0.9), 0x555555, bnx + 1.6, CY + 0.55, CZ + 6);
        }
    }

    function update(delta) {
        // Static environment - no per-frame updates needed
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
