window.TiranaSkanderbeg = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 23600;
    var CY = 0;
    var CZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        if (sx !== undefined) mesh.scale.set(sx, sy, sz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        buildSquareGround();
        buildSkanderbegMonument();
        buildPlazaTiles();
        buildEthemBeyMosque();
        buildClockTower();
        buildNationalHistoryMuseum();
        buildPyramidOfTirana();
        buildBunkArt();
        buildDajtiMountain();
        buildLanaRiver();
        buildColorfulBlocks();
        buildGrandPark();
        buildStreetLamps();
        buildFountain();
    }

    function buildSquareGround() {
        // Main vast square surface
        var squareGeo = new THREE.BoxGeometry(400, 1, 400);
        makeMesh(squareGeo, 0xD4C8C0, CX, CY - 0.5, CZ);

        // Secondary plaza layer slight raise
        var innerGeo = new THREE.BoxGeometry(200, 1.2, 200);
        makeMesh(innerGeo, 0xCCBDB4, CX, CY - 0.4, CZ);

        // Walkway north-south
        var walkNSGeo = new THREE.BoxGeometry(20, 1.3, 380);
        makeMesh(walkNSGeo, 0xBBAA9C, CX, CY - 0.35, CZ);

        // Walkway east-west
        var walkEWGeo = new THREE.BoxGeometry(380, 1.3, 20);
        makeMesh(walkEWGeo, 0xBBAA9C, CX, CY - 0.35, CZ);
    }

    function buildPlazaTiles() {
        // Concentric ring decorations — use flat boxes for tile bands
        var colors = [0xE8D8C8, 0xC0A898, 0xD8C4B0, 0xB89880, 0xDDD0C0];
        var sizes = [160, 130, 100, 70, 40];
        for (var i = 0; i < sizes.length; i++) {
            var sz = sizes[i];
            var ringGeo = new THREE.BoxGeometry(sz, 1.4, sz);
            makeMesh(ringGeo, colors[i], CX, CY - 0.3, CZ);
            // Inner cutout illusion — darker ring inset
            var innerSz = sz - 12;
            if (innerSz > 0) {
                var innerRingGeo = new THREE.BoxGeometry(innerSz, 1.5, innerSz);
                makeMesh(innerRingGeo, 0xD4C8C0, CX, CY - 0.25, CZ);
            }
        }
        // Colored tile accent strips radiating out
        var accentColors = [0xFF6644, 0x4488FF, 0xFFCC00, 0x44AA66];
        for (var j = 0; j < 4; j++) {
            var angle = (j / 4) * Math.PI * 2;
            var ax = CX + Math.cos(angle) * 60;
            var az = CZ + Math.sin(angle) * 60;
            var accentGeo = new THREE.BoxGeometry(8, 1.6, 60);
            makeMesh(accentGeo, accentColors[j], ax, CY - 0.2, az, 0, angle, 0);
        }
    }

    function buildSkanderbegMonument() {
        // Pedestal base — wide stone block
        var baseGeo = new THREE.BoxGeometry(14, 6, 14);
        makeMesh(baseGeo, 0x888870, CX, CY + 3, CZ);

        // Pedestal upper tier
        var pedGeo = new THREE.BoxGeometry(10, 8, 10);
        makeMesh(pedGeo, 0x998866, CX, CY + 10, CZ);

        // Pedestal top cap
        var capGeo = new THREE.BoxGeometry(11, 1.5, 11);
        makeMesh(capGeo, 0x776655, CX, CY + 14.75, CZ);

        // Horse body
        var horseBodyGeo = new THREE.BoxGeometry(5, 4, 9);
        makeMesh(horseBodyGeo, 0x553311, CX, CY + 20, CZ);

        // Horse head
        var horseHeadGeo = new THREE.BoxGeometry(2, 3, 4);
        makeMesh(horseHeadGeo, 0x553311, CX, CY + 23, CZ - 4);

        // Horse neck
        var horseNeckGeo = new THREE.CylinderGeometry(1, 1.5, 3, 6);
        makeMesh(horseNeckGeo, 0x553311, CX, CY + 21, CZ - 3, 0.3, 0, 0);

        // Horse front legs raised
        var legFRGeo = new THREE.CylinderGeometry(0.6, 0.6, 4, 6);
        makeMesh(legFRGeo, 0x553311, CX + 1.2, CY + 17.5, CZ - 3.5, -0.6, 0, 0);
        var legFLGeo = new THREE.CylinderGeometry(0.6, 0.6, 4, 6);
        makeMesh(legFLGeo, 0x553311, CX - 1.2, CY + 17.5, CZ - 3.5, -0.6, 0, 0);

        // Horse rear legs
        var legRRGeo = new THREE.CylinderGeometry(0.6, 0.6, 5, 6);
        makeMesh(legRRGeo, 0x553311, CX + 1.2, CY + 17, CZ + 3, 0, 0, 0);
        var legRLGeo = new THREE.CylinderGeometry(0.6, 0.6, 5, 6);
        makeMesh(legRLGeo, 0x553311, CX - 1.2, CY + 17, CZ + 3, 0, 0, 0);

        // Rider torso
        var riderTorsoGeo = new THREE.BoxGeometry(3, 4, 2.5);
        makeMesh(riderTorsoGeo, 0x336633, CX, CY + 25, CZ - 1);

        // Rider head with helmet
        var riderHeadGeo = new THREE.SphereGeometry(1.2, 8, 6);
        makeMesh(riderHeadGeo, 0xDDAA77, CX, CY + 29, CZ - 1);

        // Skanderbeg helmet — goat horns iconic
        var helmetGeo = new THREE.CylinderGeometry(0.8, 1.2, 1.5, 8);
        makeMesh(helmetGeo, 0x665522, CX, CY + 30.3, CZ - 1);
        var hornLGeo = new THREE.ConeGeometry(0.3, 2, 6);
        makeMesh(hornLGeo, 0x887744, CX - 1.2, CY + 31.5, CZ - 1, 0, 0, 0.5);
        var hornRGeo = new THREE.ConeGeometry(0.3, 2, 6);
        makeMesh(hornRGeo, 0x887744, CX + 1.2, CY + 31.5, CZ - 1, 0, 0, -0.5);

        // Sword raised
        var swordGeo = new THREE.BoxGeometry(0.4, 8, 0.2);
        makeMesh(swordGeo, 0xCCCCCC, CX + 2.5, CY + 28, CZ - 1, 0, 0, 0.4);
    }

    function buildEthemBeyMosque() {
        var MX = CX - 80;
        var MZ = CZ - 60;

        // Main mosque hall body
        var hallGeo = new THREE.BoxGeometry(30, 16, 28);
        makeMesh(hallGeo, 0xD4C890, MX, CY + 8, MZ);

        // Porch portico
        var porchGeo = new THREE.BoxGeometry(30, 10, 8);
        makeMesh(porchGeo, 0xDDD0A0, MX, CY + 5, MZ + 16);

        // Portico columns
        for (var pc = -1; pc <= 1; pc++) {
            var colGeo = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
            makeMesh(colGeo, 0xEEE8D0, MX + pc * 10, CY + 5, MZ + 19);
        }

        // Main dome — onion shape via stacked cylinders
        var domeBaseGeo = new THREE.CylinderGeometry(12, 12, 3, 12);
        makeMesh(domeBaseGeo, 0xCCBE80, MX, CY + 17, MZ);
        var domeLowerGeo = new THREE.CylinderGeometry(11, 12, 4, 12);
        makeMesh(domeLowerGeo, 0xC8BA78, MX, CY + 21, MZ);
        var domeMidGeo = new THREE.CylinderGeometry(8, 11, 5, 12);
        makeMesh(domeMidGeo, 0xC4B670, MX, CY + 26, MZ);
        var domeUpperGeo = new THREE.CylinderGeometry(4, 8, 4, 12);
        makeMesh(domeUpperGeo, 0xC0B268, MX, CY + 31, MZ);
        var domeTopGeo = new THREE.ConeGeometry(4, 5, 12);
        makeMesh(domeTopGeo, 0xBCAE60, MX, CY + 35.5, MZ);
        // Finial
        var finialGeo = new THREE.CylinderGeometry(0.3, 0.5, 3, 6);
        makeMesh(finialGeo, 0xBB9900, MX, CY + 39, MZ);

        // Minaret — tall slim tower
        var minaretBaseGeo = new THREE.CylinderGeometry(2.5, 3, 30, 8);
        makeMesh(minaretBaseGeo, 0xD4C890, MX + 20, CY + 15, MZ - 5);
        var minaretShaftGeo = new THREE.CylinderGeometry(1.8, 2.5, 18, 8);
        makeMesh(minaretShaftGeo, 0xCEBE82, MX + 20, CY + 39, MZ - 5);
        // Balcony ring
        var balconyGeo = new THREE.CylinderGeometry(3.5, 3.5, 1.5, 12);
        makeMesh(balconyGeo, 0xAA9966, MX + 20, CY + 49, MZ - 5);
        // Minaret cap
        var minaretCapGeo = new THREE.ConeGeometry(1.8, 8, 8);
        makeMesh(minaretCapGeo, 0xBB9944, MX + 20, CY + 54, MZ - 5);

        // Mosque garden wall
        var gardenWallN = new THREE.BoxGeometry(60, 4, 1.5);
        makeMesh(gardenWallN, 0xCCBB88, MX, CY + 2, MZ - 22);
        var gardenWallS = new THREE.BoxGeometry(60, 4, 1.5);
        makeMesh(gardenWallS, 0xCCBB88, MX, CY + 2, MZ + 30);
        var gardenWallE = new THREE.BoxGeometry(1.5, 4, 54);
        makeMesh(gardenWallE, 0xCCBB88, MX + 30, CY + 2, MZ + 4);
        var gardenWallW = new THREE.BoxGeometry(1.5, 4, 54);
        makeMesh(gardenWallW, 0xCCBB88, MX - 30, CY + 2, MZ + 4);

        // Garden trees (cone + cylinder)
        var treePositions = [
            [MX - 20, MZ - 10],
            [MX + 20, MZ - 10],
            [MX - 22, MZ + 18],
            [MX + 22, MZ + 18]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            var trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 4, 6);
            makeMesh(trunkGeo, 0x664422, tp[0], CY + 2, tp[1]);
            var canopyGeo = new THREE.ConeGeometry(3, 6, 8);
            makeMesh(canopyGeo, 0x336622, tp[0], CY + 7, tp[1]);
        }
    }

    function buildClockTower() {
        var TX = CX - 55;
        var TZ = CZ - 60;

        // Tower base — narrow Baroque column
        var towerBaseGeo = new THREE.BoxGeometry(8, 4, 8);
        makeMesh(towerBaseGeo, 0xC8B880, TX, CY + 2, TZ);

        // Tower shaft — tall and slim
        var towerShaftGeo = new THREE.BoxGeometry(6, 40, 6);
        makeMesh(towerShaftGeo, 0xD0C088, TX, CY + 24, TZ);

        // Decorative banding every 10m
        for (var b = 0; b < 4; b++) {
            var bandGeo = new THREE.BoxGeometry(7.5, 1, 7.5);
            makeMesh(bandGeo, 0xAA9966, TX, CY + 10 + b * 10, TZ);
        }

        // Clock face — box with different color
        var clockFaceGeo = new THREE.BoxGeometry(5, 5, 0.5);
        makeMesh(clockFaceGeo, 0xEEEECC, TX, CY + 38, TZ - 3.3);
        var clockFace2Geo = new THREE.BoxGeometry(5, 5, 0.5);
        makeMesh(clockFace2Geo, 0xEEEECC, TX, CY + 38, TZ + 3.3);

        // Clock tower belfry
        var belfryGeo = new THREE.BoxGeometry(9, 6, 9);
        makeMesh(belfryGeo, 0xBBAA70, TX, CY + 47, TZ);

        // Pyramidal roof
        var towerRoofGeo = new THREE.ConeGeometry(6, 10, 4);
        makeMesh(towerRoofGeo, 0x885544, TX, CY + 55, TZ, 0, Math.PI / 4, 0);

        // Spire
        var spireGeo = new THREE.CylinderGeometry(0.2, 0.5, 8, 6);
        makeMesh(spireGeo, 0x776644, TX, CY + 64, TZ);
    }

    function buildNationalHistoryMuseum() {
        var HX = CX + 10;
        var HZ = CZ - 130;

        // Main museum building — massive Soviet block
        var museumGeo = new THREE.BoxGeometry(120, 28, 50);
        makeMesh(museumGeo, 0x333344, HX, CY + 14, HZ);

        // Wing left
        var wingLGeo = new THREE.BoxGeometry(30, 22, 50);
        makeMesh(wingLGeo, 0x2E2E40, HX - 75, CY + 11, HZ);

        // Wing right
        var wingRGeo = new THREE.BoxGeometry(30, 22, 50);
        makeMesh(wingRGeo, 0x2E2E40, HX + 75, CY + 11, HZ);

        // Mosaic mural — colorful tessellated figures across entire facade
        // Represented as a series of bright colored panels on front face
        var muralColors = [
            0xFF2222, 0xFF8800, 0xFFDD00, 0x44BB44,
            0x2244FF, 0xFF44AA, 0xFFFFFF, 0xCC2200,
            0x00AAFF, 0xFF6600, 0x880088, 0x00CC88
        ];
        for (var m = 0; m < 12; m++) {
            var col = m % 6;
            var row = Math.floor(m / 6);
            var panelGeo = new THREE.BoxGeometry(18, 10, 0.6);
            makeMesh(panelGeo, muralColors[m],
                HX - 50 + col * 20,
                CY + 10 + row * 12,
                HZ - 25.3);
        }
        // Figurative shapes on mural — abstract silhouettes
        var figColors = [0xFFDD00, 0xFF4400, 0x0055FF, 0xFFFFFF];
        for (var f = 0; f < 4; f++) {
            // Figure body
            var figBodyGeo = new THREE.BoxGeometry(4, 8, 0.7);
            makeMesh(figBodyGeo, figColors[f], HX - 30 + f * 20, CY + 14, HZ - 25.4);
            // Figure head
            var figHeadGeo = new THREE.SphereGeometry(2, 6, 5);
            makeMesh(figHeadGeo, figColors[f], HX - 30 + f * 20, CY + 21, HZ - 25.4);
        }

        // Grand staircase
        for (var s = 0; s < 5; s++) {
            var stepGeo = new THREE.BoxGeometry(80, 1.5, 4);
            makeMesh(stepGeo, 0x444455, HX, CY + s * 1.5, HZ - 25 - s * 4);
        }

        // Columns at entrance
        for (var c = -2; c <= 2; c++) {
            var colGeo = new THREE.CylinderGeometry(1.5, 1.5, 26, 8);
            makeMesh(colGeo, 0x444466, HX + c * 18, CY + 13, HZ - 23);
        }

        // Roof parapet boxes — socialist ornamentation
        var parapetGeo = new THREE.BoxGeometry(125, 3, 5);
        makeMesh(parapetGeo, 0x222233, HX, CY + 29.5, HZ);
    }

    function buildPyramidOfTirana() {
        var PX = CX + 80;
        var PZ = CZ + 30;

        // Pyramid main structure — concrete triangular
        // Built from BoxGeometry slabs stacked to approximate pyramid
        var numLayers = 12;
        for (var layer = 0; layer < numLayers; layer++) {
            var fraction = 1 - (layer / numLayers);
            var layerSize = 60 * fraction;
            var layerH = 4;
            var layerY = CY + layer * layerH + layerH * 0.5;
            var pyramidLayerGeo = new THREE.BoxGeometry(layerSize, layerH, layerSize * 0.7);
            makeMesh(pyramidLayerGeo, 0x999999, PX, layerY, PZ);
        }

        // Side ramp panels — the famous climbable sides
        var rampLGeo = new THREE.BoxGeometry(2, 50, 68);
        makeMesh(rampLGeo, 0x888888, PX - 22, CY + 25, PZ, 0, 0, 0.7);
        var rampRGeo = new THREE.BoxGeometry(2, 50, 68);
        makeMesh(rampRGeo, 0x888888, PX + 22, CY + 25, PZ, 0, 0, -0.7);

        // Graffiti color patches (urban art on repurposed pyramid)
        var graffitiColors = [0xFF2244, 0x44FFAA, 0xFF8800, 0x4488FF];
        for (var g = 0; g < 4; g++) {
            var grafGeo = new THREE.BoxGeometry(8, 5, 0.4);
            makeMesh(grafGeo, graffitiColors[g], PX - 16 + g * 10, CY + 8 + g * 4, PZ - 21.1);
        }

        // Interior ramps and levels hint — windows as dark boxes
        var winGeo = new THREE.BoxGeometry(6, 4, 0.5);
        makeMesh(winGeo, 0x111111, PX, CY + 15, PZ - 21.1);
    }

    function buildBunkArt() {
        var BX = CX - 160;
        var BZ = CZ + 40;

        // Above-ground bunker entrance building
        var entranceGeo = new THREE.BoxGeometry(40, 12, 30);
        makeMesh(entranceGeo, 0x888888, BX, CY + 6, BZ);

        // Entrance reinforced door frame
        var doorFrameGeo = new THREE.BoxGeometry(8, 10, 2);
        makeMesh(doorFrameGeo, 0x555555, BX, CY + 5, BZ - 15);
        var doorGeo = new THREE.BoxGeometry(6, 9, 1);
        makeMesh(doorGeo, 0x222222, BX, CY + 4.5, BZ - 16);

        // Bunker blast doors sides
        var blastLGeo = new THREE.BoxGeometry(2, 9, 3);
        makeMesh(blastLGeo, 0x666666, BX - 4, CY + 4.5, BZ - 15);
        var blastRGeo = new THREE.BoxGeometry(2, 9, 3);
        makeMesh(blastRGeo, 0x666666, BX + 4, CY + 4.5, BZ - 15);

        // Underground bunker levels — shown as deeper buried blocks
        // Level indicators on ground surface
        var b1Geo = new THREE.BoxGeometry(38, 2, 28);
        makeMesh(b1Geo, 0x777777, BX, CY - 3, BZ);
        var b2Geo = new THREE.BoxGeometry(36, 2, 26);
        makeMesh(b2Geo, 0x666666, BX, CY - 7, BZ);
        var b3Geo = new THREE.BoxGeometry(34, 2, 24);
        makeMesh(b3Geo, 0x555555, BX, CY - 11, BZ);
        var b4Geo = new THREE.BoxGeometry(32, 2, 22);
        makeMesh(b4Geo, 0x444444, BX, CY - 15, BZ);
        var b5Geo = new THREE.BoxGeometry(30, 2, 20);
        makeMesh(b5Geo, 0x333333, BX, CY - 19, BZ);

        // Ventilation shafts sticking up
        for (var v = -1; v <= 1; v++) {
            var ventGeo = new THREE.CylinderGeometry(1.2, 1.5, 6, 8);
            makeMesh(ventGeo, 0x777777, BX + v * 12, CY + 3, BZ + 12);
            var ventCapGeo = new THREE.CylinderGeometry(2, 1.2, 1.5, 8);
            makeMesh(ventCapGeo, 0x666666, BX + v * 12, CY + 6.5, BZ + 12);
        }

        // Museum signage panel (colorful art installation on facade)
        var signGeo = new THREE.BoxGeometry(35, 8, 0.5);
        makeMesh(signGeo, 0xFF4400, BX, CY + 10, BZ - 15.3);
        var signTextGeo = new THREE.BoxGeometry(20, 5, 0.6);
        makeMesh(signTextGeo, 0xFFFFFF, BX, CY + 10, BZ - 15.4);

        // Sandbag barrier remnants
        for (var sb = 0; sb < 5; sb++) {
            var sandGeo = new THREE.BoxGeometry(3, 1.5, 2);
            makeMesh(sandGeo, 0xAA9966, BX - 10 + sb * 4, CY + 0.75, BZ - 18);
        }
    }

    function buildDajtiMountain() {
        var DX = CX + 260;
        var DZ = CZ - 50;

        // Main mountain mass — eastern horizon
        var mtnMainGeo = new THREE.BoxGeometry(200, 180, 150);
        makeMesh(mtnMainGeo, 0x4A6A3A, DX, CY + 90, DZ);

        // Rocky peak
        var peakGeo = new THREE.ConeGeometry(40, 80, 8);
        makeMesh(peakGeo, 0x7A6A5A, DX + 20, CY + 210, DZ - 10);

        // Secondary peak
        var peak2Geo = new THREE.ConeGeometry(25, 55, 8);
        makeMesh(peak2Geo, 0x6A5A4A, DX - 40, CY + 195, DZ + 20);

        // Snow cap hint
        var snowGeo = new THREE.ConeGeometry(18, 25, 8);
        makeMesh(snowGeo, 0xEEEEFF, DX + 20, CY + 238, DZ - 10);

        // Forested lower slopes — dark green boxes
        var forestGeo = new THREE.BoxGeometry(180, 40, 130);
        makeMesh(forestGeo, 0x3A5A2A, DX, CY + 20, DZ);

        // Cable car station — mountain top
        var stationTopGeo = new THREE.BoxGeometry(15, 8, 12);
        makeMesh(stationTopGeo, 0xCC8833, DX + 15, CY + 220, DZ - 5);
        var stationRoofGeo = new THREE.BoxGeometry(16, 2, 13);
        makeMesh(stationRoofGeo, 0x993322, DX + 15, CY + 225, DZ - 5);

        // Cable car station — valley base
        var stationBaseGeo = new THREE.BoxGeometry(15, 8, 12);
        makeMesh(stationBaseGeo, 0xCC8833, CX + 180, CY + 4, CZ - 30);

        // Cable car gondola (simplified box on the cable line)
        var gondolaGeo = new THREE.BoxGeometry(5, 4, 3);
        makeMesh(gondolaGeo, 0xFF4400, CX + 220, CY + 80, CZ - 36);

        // Cable support pylons
        var pylon1Geo = new THREE.CylinderGeometry(1, 1.5, 30, 6);
        makeMesh(pylon1Geo, 0x888888, CX + 195, CY + 15, CZ - 33);
        var pylon2Geo = new THREE.CylinderGeometry(1, 1.5, 60, 6);
        makeMesh(pylon2Geo, 0x888888, CX + 230, CY + 30, CZ - 39);

        // Mountain restaurant
        var restaurantGeo = new THREE.BoxGeometry(20, 7, 14);
        makeMesh(restaurantGeo, 0xDD9944, DX - 15, CY + 168, DZ + 5);
        var restaurantRoofGeo = new THREE.ConeGeometry(14, 6, 4);
        makeMesh(restaurantRoofGeo, 0x882222, DX - 15, CY + 174, DZ + 5, 0, Math.PI / 4, 0);

        // Forest tree clusters on slopes
        var treeSlope = [
            [DX - 80, DZ + 30],
            [DX - 60, DZ - 20],
            [DX - 90, DZ - 30]
        ];
        for (var ts = 0; ts < treeSlope.length; ts++) {
            var tsp = treeSlope[ts];
            var stTrunkGeo = new THREE.CylinderGeometry(1, 1.5, 10, 6);
            makeMesh(stTrunkGeo, 0x553311, tsp[0], CY + 25, tsp[1]);
            var stCanopyGeo = new THREE.ConeGeometry(7, 16, 7);
            makeMesh(stCanopyGeo, 0x2A5A1A, tsp[0], CY + 36, tsp[1]);
        }
    }

    function buildLanaRiver() {
        // Lana River running east-west through city
        var riverGeo = new THREE.BoxGeometry(600, 0.8, 14);
        makeMesh(riverGeo, 0x2A6A8A, CX, CY + 0.4, CZ + 70);

        // River banks — slightly raised dirt strips
        var bankNGeo = new THREE.BoxGeometry(600, 1, 5);
        makeMesh(bankNGeo, 0x887755, CX, CY + 0.5, CZ + 62);
        var bankSGeo = new THREE.BoxGeometry(600, 1, 5);
        makeMesh(bankSGeo, 0x887755, CX, CY + 0.5, CZ + 78);

        // Bridge over river — concrete box
        var bridgeGeo = new THREE.BoxGeometry(30, 2, 16);
        makeMesh(bridgeGeo, 0xAAA898, CX + 20, CY + 2, CZ + 70);

        // Bridge railings
        var railNGeo = new THREE.BoxGeometry(30, 2, 0.8);
        makeMesh(railNGeo, 0x999888, CX + 20, CY + 3.5, CZ + 63);
        var railSGeo = new THREE.BoxGeometry(30, 2, 0.8);
        makeMesh(railSGeo, 0x999888, CX + 20, CY + 3.5, CZ + 77);

        // Second bridge further west
        var bridge2Geo = new THREE.BoxGeometry(25, 2, 16);
        makeMesh(bridge2Geo, 0xAAA898, CX - 100, CY + 2, CZ + 70);
    }

    function buildColorfulBlocks() {
        // Edi Rama's colorful painted Soviet-era apartment blocks
        var blockData = [
            { x: CX + 120, z: CZ - 60, color: 0xFFCC00, h: 32, stripeColor: 0xFF6600 },
            { x: CX + 145, z: CZ - 55, color: 0xFF6600, h: 38, stripeColor: 0xFFCC00 },
            { x: CX + 170, z: CZ - 50, color: 0x3366FF, h: 28, stripeColor: 0xFF6600 },
            { x: CX + 120, z: CZ + 40, color: 0xFF3366, h: 35, stripeColor: 0xFFFF00 },
            { x: CX + 148, z: CZ + 45, color: 0x33CC66, h: 30, stripeColor: 0xFF4400 },
            { x: CX - 140, z: CZ - 80, color: 0xFFCC00, h: 36, stripeColor: 0x4466FF },
            { x: CX - 165, z: CZ - 75, color: 0xFF6600, h: 40, stripeColor: 0x00CCFF }
        ];
        for (var bd = 0; bd < blockData.length; bd++) {
            var blk = blockData[bd];
            // Main apartment block
            var blkGeo = new THREE.BoxGeometry(22, blk.h, 18);
            makeMesh(blkGeo, blk.color, blk.x, CY + blk.h * 0.5, blk.z);
            // Geometric stripe band — signature Edi Rama style
            var stripeGeo = new THREE.BoxGeometry(23, 4, 18.2);
            makeMesh(stripeGeo, blk.stripeColor, blk.x, CY + blk.h * 0.3, blk.z);
            // Balcony boxes
            for (var fl = 0; fl < 6; fl++) {
                var balcGeo = new THREE.BoxGeometry(22, 1.5, 2);
                makeMesh(balcGeo, 0xCCCCCC, blk.x, CY + 6 + fl * 5, blk.z - 9.5);
            }
        }
    }

    function buildGrandPark() {
        var GX = CX - 50;
        var GZ = CZ + 170;

        // Park ground
        var parkGeo = new THREE.BoxGeometry(220, 0.8, 180);
        makeMesh(parkGeo, 0x3D7A32, GX, CY + 0.4, GZ);

        // Artificial lake — Liqeni Artificial
        var lakeGeo = new THREE.BoxGeometry(120, 0.6, 90);
        makeMesh(lakeGeo, 0x2A5A88, GX, CY + 0.8, GZ);

        // Lake island
        var islandGeo = new THREE.BoxGeometry(20, 1.2, 15);
        makeMesh(islandGeo, 0x4A8A40, GX + 10, CY + 1.0, GZ + 10);

        // Park pathways
        var path1Geo = new THREE.BoxGeometry(6, 1.0, 180);
        makeMesh(path1Geo, 0x998877, GX - 70, CY + 0.9, GZ);
        var path2Geo = new THREE.BoxGeometry(220, 1.0, 6);
        makeMesh(path2Geo, 0x998877, GX, CY + 0.9, GZ - 40);

        // Summer restaurant / terrace
        var restaurantParkGeo = new THREE.BoxGeometry(25, 6, 16);
        makeMesh(restaurantParkGeo, 0xEEDD99, GX + 80, CY + 3, GZ - 50);
        var restRoofGeo = new THREE.BoxGeometry(27, 1.5, 18);
        makeMesh(restRoofGeo, 0xCC6622, GX + 80, CY + 6.75, GZ - 50);

        // Park trees — several clusters
        var parkTrees = [
            [GX - 80, GZ - 60],
            [GX - 60, GZ + 60],
            [GX + 70, GZ + 70],
            [GX + 80, GZ - 60],
            [GX - 30, GZ + 60],
            [GX + 30, GZ - 70],
            [GX - 90, GZ + 20],
            [GX + 90, GZ - 20]
        ];
        for (var pt = 0; pt < parkTrees.length; pt++) {
            var ptp = parkTrees[pt];
            var pkTrunkGeo = new THREE.CylinderGeometry(0.8, 1.1, 7, 7);
            makeMesh(pkTrunkGeo, 0x5C3D1E, ptp[0], CY + 3.5, ptp[1]);
            var pkCanopyGeo = new THREE.SphereGeometry(6, 7, 6);
            makeMesh(pkCanopyGeo, 0x2A6A22, ptp[0], CY + 11, ptp[1]);
        }

        // Pedalo boat dock
        var dockGeo = new THREE.BoxGeometry(15, 1.5, 4);
        makeMesh(dockGeo, 0x885522, GX - 40, CY + 1.5, GZ - 40);

        // Pedalo boat
        var boatGeo = new THREE.BoxGeometry(4, 1.5, 2.5);
        makeMesh(boatGeo, 0xFF4488, GX - 38, CY + 1.8, GZ - 36);
    }

    function buildStreetLamps() {
        // Line of street lamps along main square perimeter
        var lampPositions = [
            [CX - 80, CZ - 80],
            [CX - 40, CZ - 80],
            [CX + 0, CZ - 80],
            [CX + 40, CZ - 80],
            [CX + 80, CZ - 80],
            [CX - 80, CZ + 80],
            [CX - 40, CZ + 80],
            [CX + 0, CZ + 80],
            [CX + 40, CZ + 80],
            [CX + 80, CZ + 80]
        ];
        for (var lp = 0; lp < lampPositions.length; lp++) {
            var lpos = lampPositions[lp];
            // Pole
            var poleGeo = new THREE.CylinderGeometry(0.3, 0.5, 12, 6);
            makeMesh(poleGeo, 0x555555, lpos[0], CY + 6, lpos[1]);
            // Lamp head
            var lampGeo = new THREE.SphereGeometry(1, 7, 5);
            makeMesh(lampGeo, 0xFFFFAA, lpos[0], CY + 12.5, lpos[1]);
        }
    }

    function buildFountain() {
        // Central fountain in Skanderbeg Square — offset slightly from monument
        var FX = CX + 30;
        var FZ = CZ + 30;

        // Fountain basin outer ring
        var basinOuterGeo = new THREE.CylinderGeometry(12, 12, 2, 16);
        makeMesh(basinOuterGeo, 0xB8AAAA, FX, CY + 1, FZ);

        // Fountain basin water
        var basinWaterGeo = new THREE.CylinderGeometry(11, 11, 1.5, 16);
        makeMesh(basinWaterGeo, 0x4488BB, FX, CY + 1.5, FZ);

        // Fountain center column
        var fountainColGeo = new THREE.CylinderGeometry(1, 2, 6, 8);
        makeMesh(fountainColGeo, 0xAA9999, FX, CY + 4, FZ);

        // Fountain top sphere / spray
        var sprayGeo = new THREE.SphereGeometry(2, 8, 6);
        makeMesh(sprayGeo, 0x88BBDD, FX, CY + 8, FZ);

        // Decorative outer fountain edge detail
        var edgeGeo = new THREE.CylinderGeometry(12.5, 12.5, 0.8, 16);
        makeMesh(edgeGeo, 0x998888, FX, CY + 2.2, FZ);
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
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
