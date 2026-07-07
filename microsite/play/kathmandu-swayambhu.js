window.KathmanduSwayambhu = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24400;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildSwayambhunath();
        buildPashupatinath();
        buildKathmanduDurbarSquare();
        buildBoudhanath();
        buildHimalayanPeaks();
        buildThamel();
        buildFreakStreet();
        buildBagmatiRiver();
        buildPatan();
        buildNagarjunForest();
    }

    function buildGround() {
        // Ground platform — city base using boxes
        var groundGeo = new THREE.BoxGeometry(2400, 4, 2400);
        makeMesh(groundGeo, 0x8B7D6B, BASE_X, BASE_Y - 2, BASE_Z);

        // Valley floor
        var valleyGeo = new THREE.BoxGeometry(1800, 2, 1800);
        makeMesh(valleyGeo, 0x7A8B5A, BASE_X, BASE_Y, BASE_Z + 100);
    }

    // -------------------------------------------------------
    // SWAYAMBHUNATH (Monkey Temple) — northwest hill
    // -------------------------------------------------------
    function buildSwayambhunath() {
        var ox = BASE_X - 600;
        var oz = BASE_Z - 400;

        // Hill
        var hillGeo = new THREE.CylinderGeometry(180, 280, 140, 8);
        makeMesh(hillGeo, 0x5A7A3A, ox, BASE_Y + 70, oz);

        // 365 stone steps — represented as a series of flat boxes up the hill slope
        for (var s = 0; s < 18; s++) {
            var stepGeo = new THREE.BoxGeometry(40, 4, 10);
            makeMesh(stepGeo, 0xA89880, ox - 80 + s * 2, BASE_Y + 8 + s * 7, oz + 100 - s * 6);
        }

        // Stupa base platform
        var baseGeo = new THREE.CylinderGeometry(90, 100, 12, 8);
        makeMesh(baseGeo, 0xE8E0D0, ox, BASE_Y + 146, oz);

        // Stupa dome (white hemisphere — SphereGeometry top half)
        var domeGeo = new THREE.SphereGeometry(70, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        makeMesh(domeGeo, 0xF5F5F5, ox, BASE_Y + 158, oz);

        // Dome base ring
        var domeBaseGeo = new THREE.CylinderGeometry(72, 72, 10, 16);
        makeMesh(domeBaseGeo, 0xF0EAE0, ox, BASE_Y + 153, oz);

        // Harmika (square box with Buddha eyes on all 4 sides)
        var harmikaGeo = new THREE.BoxGeometry(44, 44, 44);
        makeMesh(harmikaGeo, 0xF5F5F5, ox, BASE_Y + 234, oz);

        // Buddha eyes — colored boxes on each face of harmika
        // North face eyes
        var eyeNL = new THREE.BoxGeometry(7, 5, 3);
        makeMesh(eyeNL, 0x1A1A00, ox - 8, BASE_Y + 238, oz - 22);
        var eyeNR = new THREE.BoxGeometry(7, 5, 3);
        makeMesh(eyeNR, 0x1A1A00, ox + 8, BASE_Y + 238, oz - 22);
        var noseN = new THREE.BoxGeometry(5, 5, 3);
        makeMesh(noseN, 0xD4A830, ox, BASE_Y + 232, oz - 22);

        // South face eyes
        var eyeSL = new THREE.BoxGeometry(7, 5, 3);
        makeMesh(eyeSL, 0x1A1A00, ox - 8, BASE_Y + 238, oz + 22);
        var eyeSR = new THREE.BoxGeometry(7, 5, 3);
        makeMesh(eyeSR, 0x1A1A00, ox + 8, BASE_Y + 238, oz + 22);
        var noseS = new THREE.BoxGeometry(5, 5, 3);
        makeMesh(noseS, 0xD4A830, ox, BASE_Y + 232, oz + 22);

        // East face eyes
        var eyeEL = new THREE.BoxGeometry(3, 5, 7);
        makeMesh(eyeEL, 0x1A1A00, ox + 22, BASE_Y + 238, oz - 8);
        var eyeER = new THREE.BoxGeometry(3, 5, 7);
        makeMesh(eyeER, 0x1A1A00, ox + 22, BASE_Y + 238, oz + 8);
        var noseE = new THREE.BoxGeometry(3, 5, 5);
        makeMesh(noseE, 0xD4A830, ox + 22, BASE_Y + 232, oz);

        // West face eyes
        var eyeWL = new THREE.BoxGeometry(3, 5, 7);
        makeMesh(eyeWL, 0x1A1A00, ox - 22, BASE_Y + 238, oz - 8);
        var eyeWR = new THREE.BoxGeometry(3, 5, 7);
        makeMesh(eyeWR, 0x1A1A00, ox - 22, BASE_Y + 238, oz + 8);
        var noseW = new THREE.BoxGeometry(3, 5, 5);
        makeMesh(noseW, 0xD4A830, ox - 22, BASE_Y + 232, oz);

        // Golden spire — 13 rings (CylinderGeometry stacked, tapering)
        for (var r = 0; r < 13; r++) {
            var rTop = 14 - r * 0.9;
            var rBot = 16 - r * 0.9;
            var ringGeo = new THREE.CylinderGeometry(rTop, rBot, 10, 8);
            makeMesh(ringGeo, 0xFFD700, ox, BASE_Y + 262 + r * 11, oz);
        }

        // Spire tip
        var spireTipGeo = new THREE.ConeGeometry(4, 20, 8);
        makeMesh(spireTipGeo, 0xFFD700, ox, BASE_Y + 410, oz);

        // Prayer flags — horizontal colored boxes stretching from spire
        var flagColors = [0xFF0000, 0xFFFFFF, 0xFFFF00, 0x00CC00, 0x0000CC];
        for (var f = 0; f < 5; f++) {
            var flagGeo = new THREE.BoxGeometry(80, 2, 2);
            makeMesh(flagGeo, flagColors[f], ox + 40 + f * 2, BASE_Y + 370 - f * 8, oz + f * 4, 0, 0.2 * f);
        }
        for (var f2 = 0; f2 < 5; f2++) {
            var flagGeo2 = new THREE.BoxGeometry(80, 2, 2);
            makeMesh(flagGeo2, flagColors[f2], ox - 40 - f2 * 2, BASE_Y + 370 - f2 * 8, oz - f2 * 4, 0, -0.2 * f2);
        }

        // Surrounding small shrines
        for (var sh = 0; sh < 6; sh++) {
            var angle = (sh / 6) * Math.PI * 2;
            var shrineGeo = new THREE.BoxGeometry(12, 18, 12);
            makeMesh(shrineGeo, 0xD4C8B0, ox + Math.cos(angle) * 110, BASE_Y + 155, oz + Math.sin(angle) * 110);
            var shrineroofGeo = new THREE.ConeGeometry(9, 12, 4);
            makeMesh(shrineroofGeo, 0xC8A030, ox + Math.cos(angle) * 110, BASE_Y + 173, oz + Math.sin(angle) * 110);
        }
    }

    // -------------------------------------------------------
    // PASHUPATINATH TEMPLE — east of center, Bagmati river
    // -------------------------------------------------------
    function buildPashupatinath() {
        var ox = BASE_X + 300;
        var oz = BASE_Z - 100;

        // Main temple base
        var baseGeo = new THREE.BoxGeometry(80, 20, 80);
        makeMesh(baseGeo, 0xD4A870, ox, BASE_Y + 10, oz);

        // Temple podium
        var podiumGeo = new THREE.BoxGeometry(70, 16, 70);
        makeMesh(podiumGeo, 0xC89860, ox, BASE_Y + 28, oz);

        // Main sanctum
        var sanctumGeo = new THREE.BoxGeometry(50, 50, 50);
        makeMesh(sanctumGeo, 0xD4A870, ox, BASE_Y + 61, oz);

        // Gold-plated lower roof (pagoda tier 1)
        var roof1Geo = new THREE.BoxGeometry(70, 12, 70);
        makeMesh(roof1Geo, 0xFFD700, ox, BASE_Y + 90, oz);
        var roof1TrimGeo = new THREE.CylinderGeometry(50, 55, 8, 4);
        makeMesh(roof1TrimGeo, 0xDAA520, ox, BASE_Y + 96, oz, 0, Math.PI / 4);

        // Pagoda tier 2
        var roof2Geo = new THREE.BoxGeometry(54, 10, 54);
        makeMesh(roof2Geo, 0xFFD700, ox, BASE_Y + 112, oz);
        var roof2TrimGeo = new THREE.CylinderGeometry(38, 42, 7, 4);
        makeMesh(roof2TrimGeo, 0xDAA520, ox, BASE_Y + 117, oz, 0, Math.PI / 4);

        // Pagoda tier 3
        var roof3Geo = new THREE.BoxGeometry(38, 9, 38);
        makeMesh(roof3Geo, 0xFFD700, ox, BASE_Y + 130, oz);

        // Temple spire
        var spireGeo = new THREE.CylinderGeometry(4, 8, 40, 8);
        makeMesh(spireGeo, 0xFFD700, ox, BASE_Y + 155, oz);
        var spireTopGeo = new THREE.SphereGeometry(6, 8, 6);
        makeMesh(spireTopGeo, 0xFFD700, ox, BASE_Y + 178, oz);

        // Secondary temple to the south
        var sec1Geo = new THREE.BoxGeometry(30, 36, 30);
        makeMesh(sec1Geo, 0xD4A870, ox + 70, BASE_Y + 28, oz + 30);
        var sec1RoofGeo = new THREE.ConeGeometry(24, 18, 4);
        makeMesh(sec1RoofGeo, 0xFFD700, ox + 70, BASE_Y + 55, oz + 30, 0, Math.PI / 4);

        // Cremation ghats along river (flat platforms)
        for (var g = 0; g < 5; g++) {
            var ghatGeo = new THREE.BoxGeometry(30, 4, 20);
            makeMesh(ghatGeo, 0xB0A090, ox - 100 + g * 35, BASE_Y + 2, oz + 140);
        }

        // Funeral pyres (small boxes on ghats)
        for (var p = 0; p < 3; p++) {
            var pyreGeo = new THREE.BoxGeometry(8, 6, 8);
            makeMesh(pyreGeo, 0x8B4513, ox - 65 + p * 35, BASE_Y + 7, oz + 140);
        }
    }

    // -------------------------------------------------------
    // KATHMANDU DURBAR SQUARE — city center
    // -------------------------------------------------------
    function buildKathmanduDurbarSquare() {
        var ox = BASE_X;
        var oz = BASE_Z + 100;

        // Palace courtyard base
        var courtGeo = new THREE.BoxGeometry(200, 6, 200);
        makeMesh(courtGeo, 0xC8B870, ox, BASE_Y + 3, oz);

        // Hanuman Dhoka Palace — main facade
        var palaceGeo = new THREE.BoxGeometry(120, 60, 40);
        makeMesh(palaceGeo, 0xC8B464, ox, BASE_Y + 33, oz - 80);

        // Palace upper wing
        var palaceUpperGeo = new THREE.BoxGeometry(80, 30, 35);
        makeMesh(palaceUpperGeo, 0xD4C070, ox, BASE_Y + 78, oz - 80);

        // Palace roof
        var palaceRoofGeo = new THREE.BoxGeometry(90, 8, 42);
        makeMesh(palaceRoofGeo, 0xA0783C, ox, BASE_Y + 97, oz - 80);

        // Taleju Temple — 12-tiered tower
        var talejuBaseGeo = new THREE.BoxGeometry(30, 30, 30);
        makeMesh(talejuBaseGeo, 0xC8A050, ox + 80, BASE_Y + 18, oz - 60);
        for (var t = 0; t < 12; t++) {
            var tw = 28 - t * 1.8;
            var talejuTierGeo = new THREE.BoxGeometry(tw, 10, tw);
            makeMesh(talejuTierGeo, 0xD4AA54, ox + 80, BASE_Y + 48 + t * 12, oz - 60);
            var talejuRoofGeo = new THREE.BoxGeometry(tw + 8, 5, tw + 8);
            makeMesh(talejuRoofGeo, 0x8B6020, ox + 80, BASE_Y + 57 + t * 12, oz - 60);
        }
        var talejuSpireGeo = new THREE.ConeGeometry(4, 22, 4);
        makeMesh(talejuSpireGeo, 0xFFD700, ox + 80, BASE_Y + 210, oz - 60, 0, Math.PI / 4);

        // Kasthamandap wooden pavilion
        var kasthGeo = new THREE.BoxGeometry(38, 28, 38);
        makeMesh(kasthGeo, 0x8B6040, ox - 80, BASE_Y + 17, oz + 50);
        var kasthRoof1Geo = new THREE.ConeGeometry(28, 16, 4);
        makeMesh(kasthRoof1Geo, 0x6B4820, ox - 80, BASE_Y + 39, oz + 50, 0, Math.PI / 4);
        var kasthRoof2Geo = new THREE.ConeGeometry(16, 12, 4);
        makeMesh(kasthRoof2Geo, 0x6B4820, ox - 80, BASE_Y + 55, oz + 50, 0, Math.PI / 4);

        // Kumari Ghar (living goddess house)
        var kumariGeo = new THREE.BoxGeometry(34, 36, 30);
        makeMesh(kumariGeo, 0xC8A050, ox + 30, BASE_Y + 21, oz + 60);
        var kumariRoofGeo = new THREE.BoxGeometry(40, 8, 36);
        makeMesh(kumariRoofGeo, 0x7A5A20, ox + 30, BASE_Y + 43, oz + 60);
        var kumariRoof2Geo = new THREE.BoxGeometry(28, 7, 26);
        makeMesh(kumariRoof2Geo, 0x7A5A20, ox + 30, BASE_Y + 55, oz + 60);

        // Stone Shiva lingam pillars in square
        for (var pl = 0; pl < 4; pl++) {
            var pillarGeo = new THREE.CylinderGeometry(3, 4, 30, 6);
            makeMesh(pillarGeo, 0x909090, ox - 40 + pl * 26, BASE_Y + 18, oz + 10);
        }

        // Trailokya Mohan Narayan Temple
        var trailGeo = new THREE.BoxGeometry(24, 40, 24);
        makeMesh(trailGeo, 0xC8B060, ox - 50, BASE_Y + 23, oz - 30);
        var trailRoofGeo = new THREE.ConeGeometry(18, 14, 4);
        makeMesh(trailRoofGeo, 0xA0780A, ox - 50, BASE_Y + 50, oz - 30, 0, Math.PI / 4);
    }

    // -------------------------------------------------------
    // BOUDHANATH STUPA — northeast, UNESCO site
    // -------------------------------------------------------
    function buildBoudhanath() {
        var ox = BASE_X + 500;
        var oz = BASE_Z - 300;

        // Massive circular base platform
        var platform1Geo = new THREE.CylinderGeometry(160, 170, 10, 16);
        makeMesh(platform1Geo, 0xE8E0D0, ox, BASE_Y + 5, oz);

        // Stepped mandala base layers
        var base1Geo = new THREE.CylinderGeometry(140, 150, 14, 16);
        makeMesh(base1Geo, 0xEAE2D2, ox, BASE_Y + 17, oz);

        var base2Geo = new THREE.CylinderGeometry(118, 128, 12, 16);
        makeMesh(base2Geo, 0xF0E8D8, ox, BASE_Y + 30, oz);

        // Dome — large white sphere
        var domeGeo = new THREE.SphereGeometry(95, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2);
        makeMesh(domeGeo, 0xFFFFFF, ox, BASE_Y + 42, oz);

        // Dome base ring
        var domeRingGeo = new THREE.CylinderGeometry(97, 97, 14, 20);
        makeMesh(domeRingGeo, 0xF0EAE0, ox, BASE_Y + 35, oz);

        // Harmika — square tower with Buddha eyes
        var harmikaGeo = new THREE.BoxGeometry(54, 54, 54);
        makeMesh(harmikaGeo, 0xFFFFFF, ox, BASE_Y + 152, oz);

        // Buddha eyes on all 4 faces of Boudhanath harmika
        var eyeData = [
            [ox - 8, oz - 27, 0, 0],
            [ox + 8, oz - 27, 0, 0],
            [ox - 8, oz + 27, 0, 0],
            [ox + 8, oz + 27, 0, 0],
            [ox + 27, oz - 8, 0, 0],
            [ox + 27, oz + 8, 0, 0],
            [ox - 27, oz - 8, 0, 0],
            [ox - 27, oz + 8, 0, 0]
        ];
        for (var e = 0; e < eyeData.length; e++) {
            var eyeGeo = new THREE.BoxGeometry(8, 6, 3);
            makeMesh(eyeGeo, 0x111100, eyeData[e][0], BASE_Y + 158, eyeData[e][1]);
        }

        // Golden spire rings
        for (var gr = 0; gr < 13; gr++) {
            var grTop = 16 - gr;
            var grBot = 18 - gr;
            var grGeo = new THREE.CylinderGeometry(grTop, grBot, 11, 8);
            makeMesh(grGeo, 0xFFD700, ox, BASE_Y + 184 + gr * 13, oz);
        }

        // Spire crown
        var crownGeo = new THREE.SphereGeometry(8, 8, 6);
        makeMesh(crownGeo, 0xFFD700, ox, BASE_Y + 358, oz);

        // Prayer wheel row around base (small cylinders)
        for (var pw = 0; pw < 20; pw++) {
            var pwAngle = (pw / 20) * Math.PI * 2;
            var pwGeo = new THREE.CylinderGeometry(4, 4, 14, 6);
            makeMesh(pwGeo, 0xDAA520, ox + Math.cos(pwAngle) * 155, BASE_Y + 9, oz + Math.sin(pwAngle) * 155, 0, pwAngle);
        }

        // Tibetan monasteries surrounding (multi-story boxes)
        for (var mon = 0; mon < 6; mon++) {
            var monAngle = (mon / 6) * Math.PI * 2;
            var monGeo = new THREE.BoxGeometry(40, 50, 30);
            makeMesh(monGeo, 0xD4C0A0, ox + Math.cos(monAngle) * 220, BASE_Y + 28, oz + Math.sin(monAngle) * 220);
            var monRoofGeo = new THREE.BoxGeometry(44, 8, 34);
            makeMesh(monRoofGeo, 0x8B4513, ox + Math.cos(monAngle) * 220, BASE_Y + 57, oz + Math.sin(monAngle) * 220);
            // Monastery upper floor
            var monUp = new THREE.BoxGeometry(36, 22, 26);
            makeMesh(monUp, 0xC8B498, ox + Math.cos(monAngle) * 220, BASE_Y + 72, oz + Math.sin(monAngle) * 220);
        }
    }

    // -------------------------------------------------------
    // HIMALAYAN PEAKS — distant horizon silhouette
    // -------------------------------------------------------
    function buildHimalayanPeaks() {
        // Everest silhouette far north
        var everestGeo = new THREE.ConeGeometry(120, 500, 6);
        makeMesh(everestGeo, 0xFFFFFF, BASE_X - 200, BASE_Y + 250, BASE_Z - 1400);

        var everestBase = new THREE.CylinderGeometry(120, 180, 200, 6);
        makeMesh(everestBase, 0xC8D4E8, BASE_X - 200, BASE_Y + 100, BASE_Z - 1400);

        // Lhotse
        var lhotseGeo = new THREE.ConeGeometry(90, 420, 6);
        makeMesh(lhotseGeo, 0xFFFFFF, BASE_X + 100, BASE_Y + 210, BASE_Z - 1380);

        // Langtang range — series of peaks
        var peakHeights = [320, 380, 280, 350, 300, 260, 310];
        var peakWidths = [80, 100, 70, 90, 75, 65, 85];
        for (var pk = 0; pk < 7; pk++) {
            var pkGeo = new THREE.ConeGeometry(peakWidths[pk], peakHeights[pk], 5);
            makeMesh(pkGeo, 0xF8F8FF, BASE_X - 800 + pk * 240, BASE_Y + peakHeights[pk] / 2, BASE_Z - 1200);
            var pkBase = new THREE.CylinderGeometry(peakWidths[pk], peakWidths[pk] + 40, 120, 5);
            makeMesh(pkBase, 0xB0C4D8, BASE_X - 800 + pk * 240, BASE_Y + 60, BASE_Z - 1200);
        }

        // Snow on nearer ridgeline
        var ridgeGeo = new THREE.BoxGeometry(1800, 60, 80);
        makeMesh(ridgeGeo, 0xE8EEF8, BASE_X, BASE_Y + 180, BASE_Z - 1000);
    }

    // -------------------------------------------------------
    // THAMEL — tourist district
    // -------------------------------------------------------
    function buildThamel() {
        var ox = BASE_X - 200;
        var oz = BASE_Z + 200;

        // Dense building blocks — trekking shops, guesthouses
        var thamelBuildings = [
            [0, 0, 24, 38, 22, 0xC8A870],
            [34, 0, 26, 44, 20, 0xBFA060],
            [66, 0, 28, 32, 24, 0xD4B070],
            [0, 36, 22, 36, 18, 0xB89858],
            [34, 36, 24, 42, 22, 0xC8A870],
            [66, 36, 20, 38, 20, 0xBFA060],
            [0, 70, 26, 40, 24, 0xC8A870],
            [34, 70, 22, 44, 20, 0xD4B070],
            [66, 70, 24, 36, 22, 0xC09860]
        ];

        for (var b = 0; b < thamelBuildings.length; b++) {
            var bd = thamelBuildings[b];
            var bGeo = new THREE.BoxGeometry(bd[2], bd[3], bd[4]);
            makeMesh(bGeo, bd[5], ox + bd[0], BASE_Y + bd[3] / 2, oz + bd[1]);

            // Roof
            var bRoofGeo = new THREE.BoxGeometry(bd[2] + 4, 5, bd[4] + 4);
            makeMesh(bRoofGeo, 0x8B5A20, ox + bd[0], BASE_Y + bd[3] + 4, oz + bd[1]);
        }

        // Colorful signage boxes
        var signColors = [0xFF4444, 0x44AAFF, 0xFFDD00, 0x44DD44, 0xFF8800];
        for (var sg = 0; sg < 5; sg++) {
            var sgGeo = new THREE.BoxGeometry(14, 4, 1);
            makeMesh(sgGeo, signColors[sg], ox + sg * 22, BASE_Y + 28, oz - 14);
        }
    }

    // -------------------------------------------------------
    // FREAK STREET — historic hippie district
    // -------------------------------------------------------
    function buildFreakStreet() {
        var ox = BASE_X - 60;
        var oz = BASE_Z + 180;

        // Old market stalls — low narrow buildings
        for (var ms = 0; ms < 8; ms++) {
            var stallGeo = new THREE.BoxGeometry(16, 22, 12);
            makeMesh(stallGeo, 0x888877, ox + ms * 20, BASE_Y + 11, oz);
            var stallRoofGeo = new THREE.BoxGeometry(18, 4, 14);
            makeMesh(stallRoofGeo, 0x6A6658, ox + ms * 20, BASE_Y + 24, oz);
        }

        // Street-level awnings
        for (var aw = 0; aw < 4; aw++) {
            var awGeo = new THREE.BoxGeometry(16, 2, 8);
            makeMesh(awGeo, 0x4A8A4A, ox + aw * 40, BASE_Y + 18, oz - 10);
        }
    }

    // -------------------------------------------------------
    // BAGMATI RIVER — sacred river through city
    // -------------------------------------------------------
    function buildBagmatiRiver() {
        // River channel — thin wide box
        var riverGeo = new THREE.BoxGeometry(800, 3, 40);
        makeMesh(riverGeo, 0x5A6A7A, BASE_X, BASE_Y + 1, BASE_Z + 80);

        // River banks
        var bankNGeo = new THREE.BoxGeometry(800, 5, 20);
        makeMesh(bankNGeo, 0x8B7B6B, BASE_X, BASE_Y + 2, BASE_Z + 58);

        var bankSGeo = new THREE.BoxGeometry(800, 5, 20);
        makeMesh(bankSGeo, 0x8B7B6B, BASE_X, BASE_Y + 2, BASE_Z + 102);

        // Bridges — box spans across river
        for (var br = 0; br < 3; br++) {
            var bridgeGeo = new THREE.BoxGeometry(20, 5, 60);
            makeMesh(bridgeGeo, 0x909080, BASE_X - 200 + br * 200, BASE_Y + 5, BASE_Z + 80);
        }

        // Ghat steps along north bank
        for (var gs = 0; gs < 8; gs++) {
            var gsGeo = new THREE.BoxGeometry(25, 3, 8);
            makeMesh(gsGeo, 0xA09080, BASE_X - 140 + gs * 40, BASE_Y + 2 + gs * 0.5, BASE_Z + 62 + gs * 2);
        }
    }

    // -------------------------------------------------------
    // PATAN (LALITPUR) DURBAR SQUARE — south of Bagmati
    // -------------------------------------------------------
    function buildPatan() {
        var ox = BASE_X + 100;
        var oz = BASE_Z + 280;

        // Patan square base
        var patanBaseGeo = new THREE.BoxGeometry(180, 5, 160);
        makeMesh(patanBaseGeo, 0xD4C8A0, ox, BASE_Y + 2, oz);

        // Krishna Mandir — stone temple (all-stone appearance)
        var krishnaGeo = new THREE.BoxGeometry(30, 60, 30);
        makeMesh(krishnaGeo, 0xC8B898, ox, BASE_Y + 33, oz);

        // Krishna Mandir tiered shikhara spire
        for (var kt = 0; kt < 6; kt++) {
            var ktw = 26 - kt * 3;
            var ktGeo = new THREE.BoxGeometry(ktw, 14, ktw);
            makeMesh(ktGeo, 0xC0B090, ox, BASE_Y + 66 + kt * 14, oz);
        }
        var krishnaTopGeo = new THREE.SphereGeometry(6, 8, 6);
        makeMesh(krishnaTopGeo, 0xD4C0A0, ox, BASE_Y + 158, oz);

        // Vishwanath Temple
        var vishGeo = new THREE.BoxGeometry(26, 42, 26);
        makeMesh(vishGeo, 0xD4C8A0, ox + 70, BASE_Y + 24, oz - 40);
        var vishRoofGeo = new THREE.ConeGeometry(22, 18, 4);
        makeMesh(vishRoofGeo, 0xB4A070, ox + 70, BASE_Y + 54, oz - 40, 0, Math.PI / 4);

        // Sunken garden (Manga Hiti) — lowered box
        var gardenGeo = new THREE.BoxGeometry(50, 6, 50);
        makeMesh(gardenGeo, 0x5A7A3A, ox - 60, BASE_Y - 1, oz + 40);

        // Garden water channel
        var waterGeo = new THREE.BoxGeometry(30, 2, 30);
        makeMesh(waterGeo, 0x4A6A8A, ox - 60, BASE_Y, oz + 40);

        // Bhimsen Temple
        var bhimGeo = new THREE.BoxGeometry(22, 50, 22);
        makeMesh(bhimGeo, 0xC8B888, ox - 60, BASE_Y + 28, oz - 40);
        var bhimRoofGeo = new THREE.BoxGeometry(28, 8, 28);
        makeMesh(bhimRoofGeo, 0xA09050, ox - 60, BASE_Y + 57, oz - 40);
        var bhimRoof2Geo = new THREE.BoxGeometry(20, 7, 20);
        makeMesh(bhimRoof2Geo, 0xA09050, ox - 60, BASE_Y + 69, oz - 40);
        var bhimSpireGeo = new THREE.CylinderGeometry(2, 4, 18, 6);
        makeMesh(bhimSpireGeo, 0xFFD700, ox - 60, BASE_Y + 85, oz - 40);
    }

    // -------------------------------------------------------
    // NAGARJUN FOREST RESERVE — northwest forested hill
    // -------------------------------------------------------
    function buildNagarjunForest() {
        var ox = BASE_X - 900;
        var oz = BASE_Z - 200;

        // Forested hill cone
        var hillGeo = new THREE.ConeGeometry(160, 220, 8);
        makeMesh(hillGeo, 0x2D6A2D, ox, BASE_Y + 110, oz);

        var hillBaseGeo = new THREE.CylinderGeometry(160, 200, 60, 8);
        makeMesh(hillBaseGeo, 0x3A7A3A, ox, BASE_Y + 30, oz);

        // Forest trees — scattered cones over hill
        var treePositions = [
            [-60, 80, -40], [40, 90, -30], [-20, 100, 50],
            [60, 70, 30], [-40, 60, 60], [20, 110, -60],
            [-70, 50, 20], [50, 60, -60], [0, 120, 10]
        ];
        for (var tr = 0; tr < treePositions.length; tr++) {
            var tp = treePositions[tr];
            var treeGeo = new THREE.ConeGeometry(18, 30, 6);
            makeMesh(treeGeo, 0x1A5A1A, ox + tp[0], BASE_Y + tp[1], oz + tp[2]);
            var treeTrunkGeo = new THREE.CylinderGeometry(4, 5, 16, 6);
            makeMesh(treeTrunkGeo, 0x5A3A1A, ox + tp[0], BASE_Y + tp[1] - 22, oz + tp[2]);
        }

        // Ancient stupa atop forested cone
        var nagBaseGeo = new THREE.CylinderGeometry(22, 26, 8, 8);
        makeMesh(nagBaseGeo, 0xE8E0D0, ox, BASE_Y + 222, oz);

        var nagDomeGeo = new THREE.SphereGeometry(18, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        makeMesh(nagDomeGeo, 0xF0F0F0, ox, BASE_Y + 230, oz);

        var nagSpireGeo = new THREE.CylinderGeometry(2, 5, 30, 8);
        makeMesh(nagSpireGeo, 0xFFD700, ox, BASE_Y + 258, oz);

        var nagTopGeo = new THREE.SphereGeometry(4, 6, 4);
        makeMesh(nagTopGeo, 0xFFD700, ox, BASE_Y + 275, oz);
    }

    function update(delta) {
        // Reserved for future animation (prayer flags, etc.)
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
