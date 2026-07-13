window.CheltenhamRacecourse = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 21600;
    var CY = 0;
    var CZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addMesh(mesh);
        return mesh;
    }

    function build() {
        buildRacecourseGround();
        buildTrackOval();
        buildTrackInfield();
        buildGrandstand();
        buildGrandstandTiers();
        buildGrandstandRoof();
        buildWinningPost();
        buildFinishingRail();
        buildCrowdBarriers();
        buildFences();
        buildHurdles();
        buildPaddockArea();
        buildStables();
        buildCheltenhamTownPromenade();
        buildIonicTerracesPromenade();
        buildNeptunesFountain();
        buildOrnamentalGardens();
        buildPittvillePumpRoom();
        buildPittvilleColumns();
        buildPittvilleDome();
        buildGCHQ();
        buildCotswoldsEscarpment();
        buildCleeeHill();
        buildRacecourseCarPark();
        buildMediaCentre();
        buildSaddlingBoxes();
        buildCourseSideFlag();
        buildTownBuildings();
        buildRegencyTerraces();
        buildSpaHotelBuildings();
        buildImperialGardens();
        buildCheltenhamCollegeBuildings();
        buildRacecourseEntranceGates();
    }

    // === RACECOURSE GROUND BASE ===
    function buildRacecourseGround() {
        // Large flat ground base under entire venue
        var geo = new THREE.BoxGeometry(2400, 2, 1600);
        makeMesh(geo, 0x5A7A3A, CX, CY - 1, CZ);
    }

    // === TRACK OVAL — approximated with thick box segments forming an oval ===
    function buildTrackOval() {
        var trackColor = 0x4CAF50;
        var trackW = 30;
        var trackH = 4;

        // North straight
        var geoN = new THREE.BoxGeometry(800, trackH, trackW);
        makeMesh(geoN, trackColor, CX, CY + 2, CZ - 400);

        // South straight
        var geoS = new THREE.BoxGeometry(800, trackH, trackW);
        makeMesh(geoS, trackColor, CX, CY + 2, CZ + 400);

        // East curve — top segment
        var geoCET = new THREE.BoxGeometry(trackW, trackH, 200);
        makeMesh(geoCET, trackColor, CX + 400, CY + 2, CZ - 300);

        // East curve — bottom segment
        var geoCEB = new THREE.BoxGeometry(trackW, trackH, 200);
        makeMesh(geoCEB, trackColor, CX + 400, CY + 2, CZ + 300);

        // East curve — corner box
        var geoCEC = new THREE.BoxGeometry(200, trackH, 200);
        makeMesh(geoCEC, trackColor, CX + 300, CY + 2, CZ);

        // West curve — top segment
        var geoCWT = new THREE.BoxGeometry(trackW, trackH, 200);
        makeMesh(geoCWT, trackColor, CX - 400, CY + 2, CZ - 300);

        // West curve — bottom segment
        var geoCWB = new THREE.BoxGeometry(trackW, trackH, 200);
        makeMesh(geoCWB, trackColor, CX - 400, CY + 2, CZ + 300);

        // West curve — corner box
        var geoCWC = new THREE.BoxGeometry(200, trackH, 200);
        makeMesh(geoCWC, trackColor, CX - 300, CY + 2, CZ);

        // Diagonal connectors NE
        var geoDNE = new THREE.BoxGeometry(200, trackH, trackW + 10);
        var meshDNE = new THREE.MeshLambertMaterial({ color: trackColor });
        var mDNE = new THREE.Mesh(geoDNE, meshDNE);
        mDNE.position.set(CX + 340, CY + 2, CZ - 370);
        mDNE.rotation.y = Math.PI / 4;
        scene.add(mDNE);
        objects.push(mDNE);

        // Diagonal connectors SE
        var geoDSE = new THREE.BoxGeometry(200, trackH, trackW + 10);
        var matDSE = new THREE.MeshLambertMaterial({ color: trackColor });
        var mDSE = new THREE.Mesh(geoDSE, matDSE);
        mDSE.position.set(CX + 340, CY + 2, CZ + 370);
        mDSE.rotation.y = -Math.PI / 4;
        scene.add(mDSE);
        objects.push(mDSE);

        // Diagonal connectors NW
        var geoDNW = new THREE.BoxGeometry(200, trackH, trackW + 10);
        var matDNW = new THREE.MeshLambertMaterial({ color: trackColor });
        var mDNW = new THREE.Mesh(geoDNW, matDNW);
        mDNW.position.set(CX - 340, CY + 2, CZ - 370);
        mDNW.rotation.y = -Math.PI / 4;
        scene.add(mDNW);
        objects.push(mDNW);

        // Diagonal connectors SW
        var geoDSW = new THREE.BoxGeometry(200, trackH, trackW + 10);
        var matDSW = new THREE.MeshLambertMaterial({ color: trackColor });
        var mDSW = new THREE.Mesh(geoDSW, matDSW);
        mDSW.position.set(CX - 340, CY + 2, CZ + 370);
        mDSW.rotation.y = Math.PI / 4;
        scene.add(mDSW);
        objects.push(mDSW);
    }

    // === INFIELD ===
    function buildTrackInfield() {
        var geo = new THREE.BoxGeometry(700, 2, 700);
        makeMesh(geo, 0x3D8B37, CX, CY + 1, CZ);
    }

    // === GRANDSTAND MAIN STRUCTURE ===
    function buildGrandstand() {
        // Main body — large Regency white stand
        var geoBase = new THREE.BoxGeometry(500, 60, 80);
        makeMesh(geoBase, 0xF5F5DC, CX, CY + 30, CZ - 480);

        // Grandstand rear wall — taller section
        var geoRear = new THREE.BoxGeometry(500, 80, 20);
        makeMesh(geoRear, 0xEEEECC, CX, CY + 40, CZ - 530);

        // Grandstand columns row — front facade
        for (var i = 0; i < 10; i++) {
            var col = new THREE.BoxGeometry(6, 55, 6);
            makeMesh(col, 0xF8F8F0, CX - 225 + i * 50, CY + 27, CZ - 442);
        }

        // Grandstand entablature / cornice strip
        var geoCornice = new THREE.BoxGeometry(510, 8, 12);
        makeMesh(geoCornice, 0xDDDDBB, CX, CY + 58, CZ - 444);
    }

    // === GRANDSTAND TIERS ===
    function buildGrandstandTiers() {
        // Three tiers of terracing in grey
        var tierColor = 0xD3D3D3;
        for (var t = 0; t < 4; t++) {
            var geo = new THREE.BoxGeometry(480, 8, 18);
            makeMesh(geo, tierColor, CX, CY + 10 + t * 12, CZ - 462 + t * 10);
        }
        // Tier dividers
        for (var d = 0; d < 8; d++) {
            var divGeo = new THREE.BoxGeometry(4, 40, 70);
            makeMesh(divGeo, 0xBBBBBB, CX - 210 + d * 60, CY + 20, CZ - 470);
        }
    }

    // === GRANDSTAND ROOF ===
    function buildGrandstandRoof() {
        // Flat roof slab
        var geo = new THREE.BoxGeometry(520, 10, 100);
        makeMesh(geo, 0xCCCCCC, CX, CY + 82, CZ - 490);

        // Roof fascia front
        var geoFascia = new THREE.BoxGeometry(520, 15, 6);
        makeMesh(geoFascia, 0xF5F5DC, CX, CY + 76, CZ - 442);

        // Press box raised section on roof
        var geoPressBox = new THREE.BoxGeometry(120, 20, 30);
        makeMesh(geoPressBox, 0xE8E8E8, CX, CY + 97, CZ - 495);

        // Press box windows (dark glass effect)
        var geoWin = new THREE.BoxGeometry(100, 10, 4);
        makeMesh(geoWin, 0x334455, CX, CY + 100, CZ - 482);
    }

    // === WINNING POST ===
    function buildWinningPost() {
        // White post
        var geoPost = new THREE.BoxGeometry(3, 50, 3);
        makeMesh(geoPost, 0xFFFFFF, CX + 50, CY + 25, CZ - 430);

        // Cross arm
        var geoArm = new THREE.BoxGeometry(30, 3, 3);
        makeMesh(geoArm, 0xFFFFFF, CX + 50, CY + 48, CZ - 430);

        // Second post
        var geoPost2 = new THREE.BoxGeometry(3, 50, 3);
        makeMesh(geoPost2, 0xFFFFFF, CX - 50, CY + 25, CZ - 430);

        var geoArm2 = new THREE.BoxGeometry(30, 3, 3);
        makeMesh(geoArm2, 0xFFFFFF, CX - 50, CY + 48, CZ - 430);
    }

    // === FINISHING STRAIGHT WHITE RAILS ===
    function buildFinishingRail() {
        var railColor = 0xFFFFFF;
        // Inner rail along finishing straight (north side)
        for (var r = 0; r < 16; r++) {
            var geoPost = new THREE.BoxGeometry(2, 12, 2);
            makeMesh(geoPost, railColor, CX - 375 + r * 50, CY + 6, CZ - 418);
            // Rail bar connecting posts
            if (r < 15) {
                var geoRail = new THREE.BoxGeometry(50, 2, 2);
                makeMesh(geoRail, railColor, CX - 350 + r * 50, CY + 10, CZ - 418);
            }
        }
        // Outer rail
        for (var ro = 0; ro < 16; ro++) {
            var geoPostO = new THREE.BoxGeometry(2, 12, 2);
            makeMesh(geoPostO, railColor, CX - 375 + ro * 50, CY + 6, CZ - 445);
            if (ro < 15) {
                var geoRailO = new THREE.BoxGeometry(50, 2, 2);
                makeMesh(geoRailO, railColor, CX - 350 + ro * 50, CY + 10, CZ - 445);
            }
        }
    }

    // === CROWD BARRIERS ===
    function buildCrowdBarriers() {
        var barrierColor = 0xBBBBBB;
        for (var b = 0; b < 8; b++) {
            var geo = new THREE.BoxGeometry(25, 8, 6);
            makeMesh(geo, barrierColor, CX - 280 + b * 80, CY + 4, CZ - 460);
        }
    }

    // === FENCES (jump obstacles every 300m around track) ===
    function buildFences() {
        var fenceColor = 0x4A7C2F;
        // Fence 1 — plain fence (open ditch)
        var geo1 = new THREE.BoxGeometry(28, 15, 5);
        makeMesh(geo1, fenceColor, CX - 300, CY + 7, CZ - 380);

        // Fence 2 — back straight fence
        var geo2 = new THREE.BoxGeometry(28, 15, 5);
        makeMesh(geo2, fenceColor, CX - 100, CY + 7, CZ + 420);

        // Fence 3
        var geo3 = new THREE.BoxGeometry(28, 15, 5);
        makeMesh(geo3, fenceColor, CX + 200, CY + 7, CZ + 410);

        // Fence 4 — open ditch with guard rail
        var geo4 = new THREE.BoxGeometry(28, 18, 6);
        makeMesh(geo4, fenceColor, CX + 390, CY + 9, CZ + 150);

        // Ditch marker
        var geoDitch = new THREE.BoxGeometry(28, 3, 12);
        makeMesh(geoDitch, 0x2D5A1A, CX + 390, CY + 1, CZ + 162);

        // Fence 5
        var geo5 = new THREE.BoxGeometry(28, 15, 5);
        makeMesh(geo5, fenceColor, CX + 380, CY + 7, CZ - 200);

        // Fence 6 — water jump
        var geo6 = new THREE.BoxGeometry(28, 12, 5);
        makeMesh(geo6, fenceColor, CX + 200, CY + 6, CZ - 400);

        // Water pool for water jump
        var geoWater = new THREE.BoxGeometry(28, 1, 30);
        makeMesh(geoWater, 0x1A6688, CX + 200, CY + 1, CZ - 380);

        // Fence 7 — home turn fence
        var geo7 = new THREE.BoxGeometry(28, 15, 5);
        makeMesh(geo7, fenceColor, CX - 380, CY + 7, CZ - 100);

        // Fence 8
        var geo8 = new THREE.BoxGeometry(28, 15, 5);
        makeMesh(geo8, fenceColor, CX - 380, CY + 7, CZ + 200);
    }

    // === HURDLES ===
    function buildHurdles() {
        var hurdleColor = 0x5A9E40;
        // Hurdles are lighter obstacles
        var positions = [
            [CX - 200, CZ - 400],
            [CX, CZ - 400],
            [CX + 100, CZ + 400],
            [CX - 150, CZ + 420],
            [CX + 380, CZ + 50],
            [CX - 390, CZ + 50]
        ];
        for (var h = 0; h < positions.length; h++) {
            var geo = new THREE.BoxGeometry(24, 10, 3);
            makeMesh(geo, hurdleColor, positions[h][0], CY + 5, positions[h][1]);
        }
    }

    // === PADDOCK AREA ===
    function buildPaddockArea() {
        // Paddock enclosure
        var geo = new THREE.BoxGeometry(200, 2, 150);
        makeMesh(geo, 0x6B8F47, CX - 550, CY + 1, CZ - 100);

        // Paddock fence
        for (var pf = 0; pf < 6; pf++) {
            var geoRail = new THREE.BoxGeometry(2, 10, 150);
            makeMesh(geoRail, 0xFFFFFF, CX - 650 + pf * 40, CY + 5, CZ - 100);
        }

        // Parade ring centre
        var geoRing = new THREE.BoxGeometry(80, 1, 80);
        makeMesh(geoRing, 0x55773A, CX - 550, CY + 2, CZ - 100);

        // Weigh room
        var geoWeigh = new THREE.BoxGeometry(60, 25, 40);
        makeMesh(geoWeigh, 0xF5F5DC, CX - 650, CY + 12, CZ - 180);
    }

    // === STABLES ===
    function buildStables() {
        var stableColor = 0xD4B483;
        for (var s = 0; s < 6; s++) {
            var geo = new THREE.BoxGeometry(25, 20, 20);
            makeMesh(geo, stableColor, CX - 700 + s * 5, CY + 10, CZ - 270 + s * 35);
            // Stable roof
            var geoRoof = new THREE.BoxGeometry(27, 5, 22);
            makeMesh(geoRoof, 0x8B6914, CX - 700 + s * 5, CY + 22, CZ - 270 + s * 35);
        }

        // Second row of stables
        for (var s2 = 0; s2 < 4; s2++) {
            var geo2 = new THREE.BoxGeometry(25, 20, 20);
            makeMesh(geo2, stableColor, CX - 760, CY + 10, CZ - 220 + s2 * 40);
            var geoRoof2 = new THREE.BoxGeometry(27, 5, 22);
            makeMesh(geoRoof2, 0x8B6914, CX - 760, CY + 22, CZ - 220 + s2 * 40);
        }
    }

    // === CHELTENHAM PROMENADE — MAIN BOULEVARD ===
    function buildCheltenhamTownPromenade() {
        // The wide Promenade boulevard floor (south of racecourse)
        var geo = new THREE.BoxGeometry(600, 2, 60);
        makeMesh(geo, 0xD4C8A0, CX - 200, CY + 1, CZ + 700);

        // Central reservation/garden strip
        var geoStrip = new THREE.BoxGeometry(600, 3, 20);
        makeMesh(geoStrip, 0x5A7A3A, CX - 200, CY + 1, CZ + 700);

        // Pavement surfaces either side
        var geoPathL = new THREE.BoxGeometry(600, 2, 15);
        makeMesh(geoPathL, 0xC8C0B0, CX - 200, CY + 2, CZ + 682);

        var geoPathR = new THREE.BoxGeometry(600, 2, 15);
        makeMesh(geoPathR, 0xC8C0B0, CX - 200, CY + 2, CZ + 718);
    }

    // === IONIC COLONNADES ALONG THE PROMENADE ===
    function buildIonicTerracesPromenade() {
        var terraceColor = 0xF5F0E8;
        var columnColor = 0xEEEADD;

        // Left terrace block
        var geoL = new THREE.BoxGeometry(280, 35, 50);
        makeMesh(geoL, terraceColor, CX - 380, CY + 17, CZ + 660);

        // Right terrace block
        var geoR = new THREE.BoxGeometry(280, 35, 50);
        makeMesh(geoR, terraceColor, CX + 80, CY + 17, CZ + 660);

        // Ionic columns on left terrace
        for (var c = 0; c < 7; c++) {
            var geoCol = new THREE.CylinderGeometry(3, 3.5, 30, 8);
            makeMesh(geoCol, columnColor, CX - 500 + c * 45, CY + 15, CZ + 637);
        }

        // Ionic columns on right terrace
        for (var cr = 0; cr < 7; cr++) {
            var geoColR = new THREE.CylinderGeometry(3, 3.5, 30, 8);
            makeMesh(geoColR, columnColor, CX - 60 + cr * 45, CY + 15, CZ + 637);
        }

        // Pediments / entablatures
        var geoPedL = new THREE.BoxGeometry(285, 8, 10);
        makeMesh(geoPedL, 0xDDD8C8, CX - 380, CY + 33, CZ + 638);

        var geoPedR = new THREE.BoxGeometry(285, 8, 10);
        makeMesh(geoPedR, 0xDDD8C8, CX + 80, CY + 33, CZ + 638);

        // Corner pilasters
        var geoCornerL1 = new THREE.BoxGeometry(6, 35, 6);
        makeMesh(geoCornerL1, columnColor, CX - 518, CY + 17, CZ + 637);

        var geoCornerL2 = new THREE.BoxGeometry(6, 35, 6);
        makeMesh(geoCornerL2, columnColor, CX - 242, CY + 17, CZ + 637);
    }

    // === NEPTUNE'S FOUNTAIN ===
    function buildNeptunesFountain() {
        // Fountain base plinth
        var geoBase = new THREE.CylinderGeometry(18, 20, 5, 16);
        makeMesh(geoBase, 0xBBB0A0, CX - 200, CY + 2, CZ + 700);

        // Fountain lower bowl
        var geoBowlLow = new THREE.CylinderGeometry(14, 16, 4, 16);
        makeMesh(geoBowlLow, 0xCCC5B5, CX - 200, CY + 6, CZ + 700);

        // Fountain middle stem
        var geoStem = new THREE.CylinderGeometry(2.5, 3, 12, 8);
        makeMesh(geoStem, 0xC8C0B0, CX - 200, CY + 12, CZ + 700);

        // Fountain upper bowl
        var geoBowlUp = new THREE.CylinderGeometry(8, 10, 3, 16);
        makeMesh(geoBowlUp, 0xCCC5B5, CX - 200, CY + 18, CZ + 700);

        // Fountain top finial
        var geoFinial = new THREE.SphereGeometry(3, 8, 8);
        makeMesh(geoFinial, 0xD4C8B0, CX - 200, CY + 24, CZ + 700);

        // Water pool surround
        var geoPool = new THREE.CylinderGeometry(22, 22, 2, 16);
        makeMesh(geoPool, 0x1A6688, CX - 200, CY + 1, CZ + 700);
    }

    // === ORNAMENTAL GARDENS ===
    function buildOrnamentalGardens() {
        // Formal garden beds
        var bedColor = 0x4A7A30;
        for (var g = 0; g < 4; g++) {
            var geo = new THREE.BoxGeometry(40, 3, 25);
            makeMesh(geo, bedColor, CX - 350 + g * 100, CY + 1, CZ + 750);
        }

        // Topiary spheres (ornamental hedges)
        for (var t = 0; t < 6; t++) {
            var geoSph = new THREE.SphereGeometry(5, 8, 8);
            makeMesh(geoSph, 0x2D6B20, CX - 300 + t * 80, CY + 5, CZ + 780);
        }

        // Park benches
        for (var bench = 0; bench < 4; bench++) {
            var geoBench = new THREE.BoxGeometry(15, 4, 5);
            makeMesh(geoBench, 0x8B5E3C, CX - 300 + bench * 80, CY + 2, CZ + 730);
        }

        // Ornamental lamp posts
        for (var lp = 0; lp < 8; lp++) {
            var geoLamp = new THREE.CylinderGeometry(0.8, 1.2, 20, 6);
            makeMesh(geoLamp, 0x444444, CX - 350 + lp * 80, CY + 10, CZ + 720);
            // Lamp globe
            var geoGlobe = new THREE.SphereGeometry(2.5, 6, 6);
            makeMesh(geoGlobe, 0xFFFFAA, CX - 350 + lp * 80, CY + 22, CZ + 720);
        }
    }

    // === PITTVILLE PUMP ROOM ===
    function buildPittvillePumpRoom() {
        // Main body of Pump Room
        var geoBody = new THREE.BoxGeometry(120, 50, 80);
        makeMesh(geoBody, 0xF5F5DC, CX + 500, CY + 25, CZ + 600);

        // Upper storey with large windows
        var geoUpper = new THREE.BoxGeometry(100, 30, 70);
        makeMesh(geoUpper, 0xEEEECC, CX + 500, CY + 65, CZ + 600);

        // Front portico base
        var geoPorBase = new THREE.BoxGeometry(80, 8, 20);
        makeMesh(geoPorBase, 0xDDDDBB, CX + 500, CY + 4, CZ + 560);

        // Window cutout effect (dark boxes on facade)
        for (var w = 0; w < 5; w++) {
            var geoWin = new THREE.BoxGeometry(12, 20, 3);
            makeMesh(geoWin, 0x334455, CX + 440 + w * 25, CY + 35, CZ + 561);
        }

        // Upper window row
        for (var wu = 0; wu < 5; wu++) {
            var geoWinU = new THREE.BoxGeometry(10, 15, 3);
            makeMesh(geoWinU, 0x445566, CX + 440 + wu * 25, CY + 62, CZ + 561);
        }
    }

    // === PITTVILLE PUMP ROOM IONIC COLUMNS ===
    function buildPittvilleColumns() {
        var colColor = 0xF0EDDE;
        // Front colonnade
        for (var pc = 0; pc < 6; pc++) {
            var geo = new THREE.CylinderGeometry(3.5, 4, 45, 10);
            makeMesh(geo, colColor, CX + 448 + pc * 22, CY + 22, CZ + 562);
        }
        // Column capitals (box on top)
        for (var pcc = 0; pcc < 6; pcc++) {
            var geoCap = new THREE.BoxGeometry(10, 4, 10);
            makeMesh(geoCap, 0xEAE5D0, CX + 448 + pcc * 22, CY + 46, CZ + 562);
        }
        // Entablature
        var geoEnta = new THREE.BoxGeometry(130, 8, 12);
        makeMesh(geoEnta, 0xDDD8C4, CX + 500, CY + 50, CZ + 563);
    }

    // === PITTVILLE PUMP ROOM DOME ===
    function buildPittvilleDome() {
        // Dome drum
        var geoDrum = new THREE.CylinderGeometry(22, 25, 18, 16);
        makeMesh(geoDrum, 0xEEEECC, CX + 500, CY + 92, CZ + 600);

        // Dome hemisphere
        var geoDome = new THREE.SphereGeometry(22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        makeMesh(geoDome, 0xDDDDBB, CX + 500, CY + 110, CZ + 600);

        // Dome lantern
        var geoLantern = new THREE.CylinderGeometry(5, 7, 10, 8);
        makeMesh(geoLantern, 0xEEEECC, CX + 500, CY + 130, CZ + 600);

        // Lantern top
        var geoLTop = new THREE.ConeGeometry(6, 8, 8);
        makeMesh(geoLTop, 0xCCCCAA, CX + 500, CY + 139, CZ + 600);
    }

    // === GCHQ — CIRCULAR DOUGHNUT HQ ===
    function buildGCHQ() {
        var gchqColor = 0x777777;

        // GCHQ is nicknamed "the doughnut" — approximate with ring of boxes
        var radius = 120;
        var segments = 20;
        for (var gc = 0; gc < segments; gc++) {
            var angle = (gc / segments) * Math.PI * 2;
            var nextAngle = ((gc + 1) / segments) * Math.PI * 2;
            var midAngle = (angle + nextAngle) / 2;
            var x = CX + 800 + Math.cos(midAngle) * radius;
            var z = CZ + 300 + Math.sin(midAngle) * radius;

            var segWidth = 2 * radius * Math.sin(Math.PI / segments) + 5;
            var geo = new THREE.BoxGeometry(segWidth, 35, 45);
            var mat = new THREE.MeshLambertMaterial({ color: gchqColor });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, CY + 17, z);
            mesh.rotation.y = -midAngle;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Inner courtyard / atrium floor
        var geoAtrium = new THREE.CylinderGeometry(75, 75, 2, 20);
        makeMesh(geoAtrium, 0x999999, CX + 800, CY + 1, CZ + 300);

        // GCHQ central security hub
        var geoHub = new THREE.BoxGeometry(30, 20, 30);
        makeMesh(geoHub, 0x666666, CX + 800, CY + 10, CZ + 300);

        // Roof of GCHQ ring
        for (var gr = 0; gr < segments; gr++) {
            var ra = (gr / segments) * Math.PI * 2;
            var rna = ((gr + 1) / segments) * Math.PI * 2;
            var rma = (ra + rna) / 2;
            var rx = CX + 800 + Math.cos(rma) * radius;
            var rz = CZ + 300 + Math.sin(rma) * radius;
            var rsw = 2 * radius * Math.sin(Math.PI / segments) + 5;
            var geoRoof = new THREE.BoxGeometry(rsw, 3, 48);
            var matRoof = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var mRoof = new THREE.Mesh(geoRoof, matRoof);
            mRoof.position.set(rx, CY + 36, rz);
            mRoof.rotation.y = -rma;
            scene.add(mRoof);
            objects.push(mRoof);
        }

        // Security perimeter fence posts
        for (var sp = 0; sp < 16; sp++) {
            var spa = (sp / 16) * Math.PI * 2;
            var spx = CX + 800 + Math.cos(spa) * 165;
            var spz = CZ + 300 + Math.sin(spa) * 165;
            var geoPost = new THREE.BoxGeometry(2, 20, 2);
            makeMesh(geoPost, 0x444444, spx, CY + 10, spz);
        }
    }

    // === COTSWOLDS ESCARPMENT (to the east) ===
    function buildCotswoldsEscarpment() {
        var hillColor = 0xC8B89A;

        // Main escarpment ridge — series of stepped hill boxes
        for (var h = 0; h < 8; h++) {
            var geoHill = new THREE.BoxGeometry(200, 60 + h * 15, 80);
            makeMesh(geoHill, hillColor, CX + 700 + h * 40, CY + 30 + h * 7, CZ - 400 + h * 80);
        }

        // Limestone scarp face — exposed rock sections
        var geoScarp1 = new THREE.BoxGeometry(500, 100, 30);
        makeMesh(geoScarp1, 0xBBA888, CX + 900, CY + 50, CZ - 200);

        var geoScarp2 = new THREE.BoxGeometry(400, 80, 25);
        makeMesh(geoScarp2, 0xC4B090, CX + 950, CY + 40, CZ + 100);

        // Wooded slopes (dark green boxes)
        for (var tree = 0; tree < 12; tree++) {
            var geoTree = new THREE.BoxGeometry(20, 35, 20);
            makeMesh(geoTree, 0x2D5A20, CX + 750 + (tree % 4) * 40, CY + 17, CZ - 300 + tree * 55);
        }
    }

    // === CLEEVE HILL — HIGHEST POINT IN COTSWOLDS ===
    function buildCleeeHill() {
        // Summit plateau
        var geoSummit = new THREE.BoxGeometry(300, 180, 200);
        makeMesh(geoSummit, 0xBBAA90, CX + 1100, CY + 90, CZ - 100);

        // Summit cap
        var geoCap = new THREE.BoxGeometry(150, 30, 100);
        makeMesh(geoCap, 0xCCBBA0, CX + 1100, CY + 195, CZ - 100);

        // Trig point marker at summit
        var geoTrig = new THREE.BoxGeometry(4, 15, 4);
        makeMesh(geoTrig, 0xFFFFFF, CX + 1100, CY + 217, CZ - 100);

        // Footpath on hillside
        var geoPath = new THREE.BoxGeometry(250, 2, 8);
        makeMesh(geoPath, 0xAA9980, CX + 970, CY + 2, CZ - 80);

        // Golf course on hill plateau (Cleeve Hill Golf Course)
        var geoGolf = new THREE.BoxGeometry(200, 3, 150);
        makeMesh(geoGolf, 0x55883A, CX + 1050, CY + 182, CZ - 50);
    }

    // === RACECOURSE CAR PARK ===
    function buildRacecourseCarPark() {
        var geoCP = new THREE.BoxGeometry(400, 1, 200);
        makeMesh(geoCP, 0x666666, CX - 650, CY + 0, CZ + 100);

        // Car park line markings
        for (var cp = 0; cp < 10; cp++) {
            var geoLine = new THREE.BoxGeometry(2, 2, 180);
            makeMesh(geoLine, 0xFFFFFF, CX - 840 + cp * 40, CY + 2, CZ + 100);
        }
    }

    // === MEDIA CENTRE ===
    function buildMediaCentre() {
        var geoMC = new THREE.BoxGeometry(80, 30, 40);
        makeMesh(geoMC, 0x888888, CX + 250, CY + 15, CZ - 500);

        // Media centre roof satellite dishes
        var geoSat1 = new THREE.CylinderGeometry(6, 6, 2, 12);
        makeMesh(geoSat1, 0xAAAAAA, CX + 250, CY + 31, CZ - 500);

        var geoSat2 = new THREE.CylinderGeometry(4, 4, 2, 12);
        makeMesh(geoSat2, 0xAAAAAA, CX + 220, CY + 31, CZ - 495);
    }

    // === SADDLING BOXES ===
    function buildSaddlingBoxes() {
        for (var sb = 0; sb < 5; sb++) {
            var geo = new THREE.BoxGeometry(20, 18, 15);
            makeMesh(geo, 0xD4B483, CX - 580, CY + 9, CZ + 50 + sb * 25);
            // Roof
            var geoR = new THREE.BoxGeometry(22, 4, 17);
            makeMesh(geoR, 0x8B6914, CX - 580, CY + 20, CZ + 50 + sb * 25);
        }
    }

    // === FLAGPOLES AROUND COURSE ===
    function buildCourseSideFlag() {
        var flagPositions = [
            [CX, CZ - 500],
            [CX + 200, CZ - 500],
            [CX - 200, CZ - 500],
            [CX + 450, CZ],
            [CX - 450, CZ]
        ];
        for (var f = 0; f < flagPositions.length; f++) {
            var geoFlagpole = new THREE.CylinderGeometry(1, 1.5, 40, 6);
            makeMesh(geoFlagpole, 0xCCCCCC, flagPositions[f][0], CY + 20, flagPositions[f][1]);
            // Flag
            var geoFlag = new THREE.BoxGeometry(15, 10, 1);
            makeMesh(geoFlag, 0xFF0000, flagPositions[f][0] + 8, CY + 38, flagPositions[f][1]);
        }
    }

    // === CHELTENHAM TOWN BUILDINGS ===
    function buildTownBuildings() {
        var buildingColor = 0xF5F0E8;

        // High Street buildings
        for (var hs = 0; hs < 8; hs++) {
            var h = 25 + (hs % 3) * 15;
            var geo = new THREE.BoxGeometry(35, h, 30);
            makeMesh(geo, buildingColor, CX - 500 + hs * 60, CY + h / 2, CZ + 820);
            // Roofline variation
            var geoParapet = new THREE.BoxGeometry(37, 5, 5);
            makeMesh(geoParapet, 0xDDD5C5, CX - 500 + hs * 60, CY + h + 2, CZ + 807);
        }

        // Suffolk Square terraces
        for (var ss = 0; ss < 5; ss++) {
            var geoT = new THREE.BoxGeometry(45, 35, 35);
            makeMesh(geoT, 0xF0EBE0, CX + 200 + ss * 55, CY + 17, CZ + 820);
        }
    }

    // === REGENCY TERRACES ===
    function buildRegencyTerraces() {
        var terraceColor = 0xF5F0E8;

        // Montpellier Terrace
        var geoMont = new THREE.BoxGeometry(350, 38, 40);
        makeMesh(geoMont, terraceColor, CX + 100, CY + 19, CZ + 900);

        // Colonnade on Montpellier
        for (var mc = 0; mc < 9; mc++) {
            var geoCyl = new THREE.CylinderGeometry(2.5, 3, 28, 8);
            makeMesh(geoCyl, 0xEAE5D5, CX - 75 + mc * 40, CY + 14, CZ + 882);
        }

        // Montpellier entablature
        var geoMEnt = new THREE.BoxGeometry(355, 7, 8);
        makeMesh(geoMEnt, 0xDDD5C5, CX + 100, CY + 37, CZ + 882);

        // Lansdown Road terraces
        var geoLans = new THREE.BoxGeometry(300, 40, 35);
        makeMesh(geoLans, terraceColor, CX - 300, CY + 20, CZ + 860);
    }

    // === SPA HOTEL BUILDINGS ===
    function buildSpaHotelBuildings() {
        // Queens Hotel — grand Regency hotel on Promenade
        var geoQH = new THREE.BoxGeometry(120, 55, 60);
        makeMesh(geoQH, 0xF5F0E0, CX - 200, CY + 27, CZ + 640);

        // Queens Hotel portico
        var geoQHPor = new THREE.BoxGeometry(60, 45, 15);
        makeMesh(geoQHPor, 0xEEE9D8, CX - 200, CY + 22, CZ + 613);

        // Columns on Queens Hotel
        for (var qhc = 0; qhc < 4; qhc++) {
            var geoQHCol = new THREE.CylinderGeometry(3, 3.5, 38, 8);
            makeMesh(geoQHCol, 0xF0EDE0, CX - 222 + qhc * 15, CY + 19, CZ + 612);
        }

        // Hotel roof balustrade
        var geoBalus = new THREE.BoxGeometry(122, 6, 8);
        makeMesh(geoBalus, 0xDDD5C5, CX - 200, CY + 55, CZ + 614);
    }

    // === IMPERIAL GARDENS ===
    function buildImperialGardens() {
        // Garden lawn
        var geoLawn = new THREE.BoxGeometry(200, 2, 150);
        makeMesh(geoLawn, 0x4A7A30, CX + 300, CY + 1, CZ + 780);

        // Flower beds
        for (var fl = 0; fl < 6; fl++) {
            var geoFl = new THREE.BoxGeometry(25, 3, 20);
            makeMesh(geoFl, 0xCC6644, CX + 230 + fl * 30, CY + 2, CZ + 790);
        }

        // Bandstand
        var geoBandBase = new THREE.CylinderGeometry(20, 22, 4, 10);
        makeMesh(geoBandBase, 0xCCC5B5, CX + 380, CY + 2, CZ + 760);

        var geoBandRoof = new THREE.ConeGeometry(24, 15, 10);
        makeMesh(geoBandRoof, 0x228844, CX + 380, CY + 22, CZ + 760);

        // Bandstand columns
        for (var bc = 0; bc < 10; bc++) {
            var bcAngle = (bc / 10) * Math.PI * 2;
            var geoBC = new THREE.CylinderGeometry(1.2, 1.5, 14, 6);
            makeMesh(geoBC, 0xDDD5C0, CX + 380 + Math.cos(bcAngle) * 20, CY + 7, CZ + 760 + Math.sin(bcAngle) * 20);
        }
    }

    // === CHELTENHAM COLLEGE BUILDINGS ===
    function buildCheltenhamCollegeBuildings() {
        // Gothic Revival college main block
        var geoMain = new THREE.BoxGeometry(180, 50, 70);
        makeMesh(geoMain, 0xB8A888, CX - 700, CY + 25, CZ + 700);

        // Chapel tower
        var geoTower = new THREE.BoxGeometry(30, 80, 30);
        makeMesh(geoTower, 0xB8A888, CX - 750, CY + 40, CZ + 685);

        // Tower battlements
        for (var bt = 0; bt < 4; bt++) {
            var geoBT = new THREE.BoxGeometry(8, 12, 8);
            makeMesh(geoBT, 0xB0A080, CX - 762 + bt * 10, CY + 86, CZ + 685);
        }

        // Spire
        var geoSpire = new THREE.ConeGeometry(8, 40, 4);
        makeMesh(geoSpire, 0xAA9870, CX - 750, CY + 100, CZ + 685);

        // College quad wall
        var geoWall = new THREE.BoxGeometry(180, 12, 5);
        makeMesh(geoWall, 0xC8B898, CX - 700, CY + 6, CZ + 650);
    }

    // === RACECOURSE ENTRANCE GATES ===
    function buildRacecourseEntranceGates() {
        // Gate pillars
        var geoPillar1 = new THREE.BoxGeometry(8, 35, 8);
        makeMesh(geoPillar1, 0xF5F5DC, CX - 30, CY + 17, CZ - 550);

        var geoPillar2 = new THREE.BoxGeometry(8, 35, 8);
        makeMesh(geoPillar2, 0xF5F5DC, CX + 30, CY + 17, CZ - 550);

        // Gate arch connecting pillars
        var geoArch = new THREE.BoxGeometry(70, 6, 6);
        makeMesh(geoArch, 0xEEEECC, CX, CY + 34, CZ - 550);

        // Gate pillar orbs
        var geoOrb1 = new THREE.SphereGeometry(5, 8, 8);
        makeMesh(geoOrb1, 0xDDDDBB, CX - 30, CY + 38, CZ - 550);

        var geoOrb2 = new THREE.SphereGeometry(5, 8, 8);
        makeMesh(geoOrb2, 0xDDDDBB, CX + 30, CY + 38, CZ - 550);

        // Entrance road
        var geoRoad = new THREE.BoxGeometry(60, 1, 100);
        makeMesh(geoRoad, 0x888880, CX, CY + 1, CZ - 600);

        // Smaller side gates
        var geoSG1 = new THREE.BoxGeometry(5, 25, 5);
        makeMesh(geoSG1, 0xF5F5DC, CX - 60, CY + 12, CZ - 550);

        var geoSG2 = new THREE.BoxGeometry(5, 25, 5);
        makeMesh(geoSG2, 0xF5F5DC, CX + 60, CY + 12, CZ - 550);

        // Ticket booths
        var geoBooth1 = new THREE.BoxGeometry(15, 15, 12);
        makeMesh(geoBooth1, 0xDDDDBB, CX - 90, CY + 7, CZ - 560);

        var geoBooth2 = new THREE.BoxGeometry(15, 15, 12);
        makeMesh(geoBooth2, 0xDDDDBB, CX + 90, CY + 7, CZ - 560);
    }

    function update(delta) {
        // Static environment — no per-frame updates required
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
