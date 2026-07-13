window.ColchesterRoman = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 12240;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeWireframe(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color, wireframe: false });
        var mesh = new THREE.Mesh(geometry, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildCastle() {
        // Main Norman keep — massive, 26x30 footprint, 14 high
        // Built on Roman temple podium — slightly wider base
        var podiumGeo = new THREE.BoxGeometry(32, 3, 36);
        var podium = makeMesh(podiumGeo, 0xB5651D);
        podium.position.set(OX, 1.5, -60);

        // Keep body — ragstone and Roman brick tile courses
        var keepGeo = new THREE.BoxGeometry(26, 14, 30);
        var keep = makeMesh(keepGeo, 0x9E8B72);
        keep.position.set(OX, 10, -60);

        // Roman red tile lacing courses — horizontal bands
        var tileColors = [0xC04030, 0xC04030, 0xC04030];
        var tileHeights = [4, 8, 12];
        for (var ti = 0; ti < 3; ti++) {
            var tileGeo = new THREE.BoxGeometry(26.2, 0.5, 30.2);
            var tile = makeMesh(tileGeo, tileColors[ti]);
            tile.position.set(OX, tileHeights[ti], -60);
        }

        // Corner buttresses — rounded columns at four corners
        var buttressPositions = [
            [-12, -14], [-12, 14], [12, -14], [12, 14]
        ];
        for (var bi = 0; bi < 4; bi++) {
            var bGeo = new THREE.CylinderGeometry(2, 2.2, 16, 8);
            var b = makeMesh(bGeo, 0x8A7A65);
            b.position.set(OX + buttressPositions[bi][0], 11, -60 + buttressPositions[bi][1]);
        }

        // Mid-wall pilaster buttresses on long faces
        var pilasterZ = [-60 - 15, -60, -60 + 15];
        for (var pi = 0; pi < 3; pi++) {
            var pGeoW = new THREE.BoxGeometry(1.5, 14, 2.5);
            var pW = makeMesh(pGeoW, 0x8A7A65);
            pW.position.set(OX - 13.5, 10, pilasterZ[pi]);
            var pGeoE = new THREE.BoxGeometry(1.5, 14, 2.5);
            var pE = makeMesh(pGeoE, 0x8A7A65);
            pE.position.set(OX + 13.5, 10, pilasterZ[pi]);
        }

        // Small round-headed windows — north and south faces
        var windowData = [
            [OX - 8, 8, -60 - 15.2], [OX, 8, -60 - 15.2], [OX + 8, 8, -60 - 15.2],
            [OX - 8, 8, -60 + 15.2], [OX, 8, -60 + 15.2], [OX + 8, 8, -60 + 15.2],
            [OX - 8, 12, -60 - 15.2], [OX, 12, -60 - 15.2], [OX + 8, 12, -60 - 15.2],
            [OX - 8, 12, -60 + 15.2], [OX, 12, -60 + 15.2], [OX + 8, 12, -60 + 15.2]
        ];
        for (var wi = 0; wi < windowData.length; wi++) {
            var wGeo = new THREE.BoxGeometry(1.5, 2, 0.4);
            var w = makeMesh(wGeo, 0x2A1F10);
            w.position.set(windowData[wi][0], windowData[wi][1], windowData[wi][2]);
        }

        // East face windows
        var eWinData = [
            [OX + 13.2, 8, -60 - 6], [OX + 13.2, 8, -60 + 6],
            [OX + 13.2, 12, -60 - 6], [OX + 13.2, 12, -60 + 6]
        ];
        for (var ewi = 0; ewi < eWinData.length; ewi++) {
            var ewGeo = new THREE.BoxGeometry(0.4, 2, 1.5);
            var ew = makeMesh(ewGeo, 0x2A1F10);
            ew.position.set(eWinData[ewi][0], eWinData[ewi][1], eWinData[ewi][2]);
        }

        // Entrance forebuilding — south face, projecting porch
        var fbGeo = new THREE.BoxGeometry(10, 10, 8);
        var fb = makeMesh(fbGeo, 0x9E8B72);
        fb.position.set(OX, 8, -60 + 19);

        // Forebuilding tile courses
        var fbTileGeo = new THREE.BoxGeometry(10.2, 0.4, 8.2);
        var fbTile = makeMesh(fbTileGeo, 0xC04030);
        fbTile.position.set(OX, 5, -60 + 19);

        // Forebuilding arch opening
        var archGeo = new THREE.BoxGeometry(3, 5, 8.5);
        var arch = makeMesh(archGeo, 0x1A1008);
        arch.position.set(OX, 4, -60 + 19);

        // Castle mound / earthwork
        var moundGeo = new THREE.CylinderGeometry(22, 30, 3.5, 16);
        var mound = makeMesh(moundGeo, 0x5A7A3A);
        mound.position.set(OX, 0.25, -60);
    }

    function buildRomanWalls() {
        // Roman town walls — substantial 4 high, tile-laced
        // Approximate 2-mile circuit as a rectangular loop suggestion
        var wallColor = 0x8C7A5E;
        var tileColor = 0xB03020;

        // Wall segments — N, S, E, W arms of the town circuit
        var wallSegments = [
            // [cx, cz, width, depth]
            [OX + 0, -200, 280, 4],   // North wall
            [OX + 0, 100, 280, 4],    // South wall
            [OX - 140, -52, 4, 304],  // West wall
            [OX + 140, -52, 4, 304]   // East wall
        ];

        for (var ws = 0; ws < wallSegments.length; ws++) {
            var seg = wallSegments[ws];
            var wallGeo = new THREE.BoxGeometry(seg[2], 4, seg[3]);
            var wall = makeMesh(wallGeo, wallColor);
            wall.position.set(seg[0], 2, seg[1]);

            // Tile lacing courses — two bands per wall
            for (var tl = 0; tl < 2; tl++) {
                var tlGeo = new THREE.BoxGeometry(seg[2] + 0.1, 0.35, seg[3] + 0.1);
                var tlMesh = makeMesh(tlGeo, tileColor);
                tlMesh.position.set(seg[0], 1.5 + tl * 2, seg[1]);
            }

            // Wall-walk parapet
            var parapetGeo = new THREE.BoxGeometry(seg[2], 1, seg[3]);
            var parapet = makeMesh(parapetGeo, 0x7A6A50);
            parapet.position.set(seg[0], 4.5, seg[1]);
        }

        // Interval towers along the walls
        var towerPositions = [
            [OX - 70, -200], [OX + 70, -200],
            [OX - 70, 100], [OX + 70, 100],
            [OX - 140, -100], [OX - 140, 0],
            [OX + 140, -100], [OX + 140, 0]
        ];
        for (var tp = 0; tp < towerPositions.length; tp++) {
            var tpGeo = new THREE.BoxGeometry(7, 5.5, 7);
            var tpMesh = makeMesh(tpGeo, wallColor);
            tpMesh.position.set(towerPositions[tp][0], 2.75, towerPositions[tp][1]);

            var tpTileGeo = new THREE.BoxGeometry(7.2, 0.35, 7.2);
            var tpTile = makeMesh(tpTileGeo, tileColor);
            tpTile.position.set(towerPositions[tp][0], 2, towerPositions[tp][1]);
        }

        buildBalkernGate();
    }

    function buildBalkernGate() {
        // Balkerne Gate — largest surviving Roman gateway in Britain
        // Twin carriageway arches flanked by circular towers, at west wall
        var gateX = OX - 140;
        var gateZ = -52;
        var gateColor = 0x9E8B72;
        var gateTile = 0xB03020;

        // Gate structure — main body
        var gateBodyGeo = new THREE.BoxGeometry(20, 6, 12);
        var gateBody = makeMesh(gateBodyGeo, gateColor);
        gateBody.position.set(gateX, 3, gateZ);

        // Tile courses on gate
        for (var gc = 0; gc < 3; gc++) {
            var gcGeo = new THREE.BoxGeometry(20.2, 0.35, 12.2);
            var gcMesh = makeMesh(gcGeo, gateTile);
            gcMesh.position.set(gateX, 1.5 + gc * 1.8, gateZ);
        }

        // Left carriageway arch opening
        var arch1Geo = new THREE.BoxGeometry(4, 5, 12.5);
        var arch1 = makeMesh(arch1Geo, 0x1A1008);
        arch1.position.set(gateX - 4, 2.5, gateZ);

        // Right carriageway arch opening
        var arch2Geo = new THREE.BoxGeometry(4, 5, 12.5);
        var arch2 = makeMesh(arch2Geo, 0x1A1008);
        arch2.position.set(gateX + 4, 2.5, gateZ);

        // Flanking circular towers — south
        var ctSGeo = new THREE.CylinderGeometry(4, 4.5, 7, 12);
        var ctS = makeMesh(ctSGeo, gateColor);
        ctS.position.set(gateX, 3.5, gateZ + 10);

        // Flanking circular towers — north
        var ctNGeo = new THREE.CylinderGeometry(4, 4.5, 7, 12);
        var ctN = makeMesh(ctNGeo, gateColor);
        ctN.position.set(gateX, 3.5, gateZ - 10);

        // Tower tile courses
        for (var tc = 0; tc < 2; tc++) {
            var tcSGeo = new THREE.CylinderGeometry(4.1, 4.1, 0.35, 12);
            var tcS = makeMesh(tcSGeo, gateTile);
            tcS.position.set(gateX, 2 + tc * 2.5, gateZ + 10);

            var tcNGeo = new THREE.CylinderGeometry(4.1, 4.1, 0.35, 12);
            var tcN = makeMesh(tcNGeo, gateTile);
            tcN.position.set(gateX, 2 + tc * 2.5, gateZ - 10);
        }

        // Pedestrian arch openings in towers (smaller)
        var pa1Geo = new THREE.BoxGeometry(4.5, 3.5, 2);
        var pa1 = makeMesh(pa1Geo, 0x1A1008);
        pa1.position.set(gateX, 1.75, gateZ + 9);

        var pa2Geo = new THREE.BoxGeometry(4.5, 3.5, 2);
        var pa2 = makeMesh(pa2Geo, 0x1A1008);
        pa2.position.set(gateX, 1.75, gateZ - 9);
    }

    function buildHighStreet() {
        // High Street — Georgian and Victorian town centre
        var streetColor = 0x888888;
        var streetGeo = new THREE.BoxGeometry(300, 0.2, 10);
        var street = makeMesh(streetGeo, streetColor);
        street.position.set(OX, 0.1, 20);

        // Georgian terraced buildings — north side of High Street
        var georgianColors = [0xC9A87C, 0xB89A6E, 0xD2B48C, 0xBCA882];
        for (var gi = 0; gi < 10; gi++) {
            var gWidth = 12 + (gi % 3) * 2;
            var gHeight = 8 + (gi % 2) * 3;
            var gGeo = new THREE.BoxGeometry(gWidth, gHeight, 10);
            var gMesh = makeMesh(gGeo, georgianColors[gi % 4]);
            gMesh.position.set(OX - 120 + gi * 26, gHeight / 2, 14);

            // Sash windows
            for (var gf = 0; gf < 3; gf++) {
                for (var gw = 0; gw < 2; gw++) {
                    var gwGeo = new THREE.BoxGeometry(2, 2.5, 0.4);
                    var gwMesh = makeMesh(gwGeo, 0x8AB4C8);
                    gwMesh.position.set(OX - 120 + gi * 26 - 3 + gw * 6, 2 + gf * 2.8, 9.3);
                }
            }

            // Roof
            var roofGeo = new THREE.BoxGeometry(gWidth, 1.5, 10);
            var roof = makeMesh(roofGeo, 0x5A3A2A);
            roof.position.set(OX - 120 + gi * 26, gHeight + 0.75, 14);
        }

        // Victorian buildings — south side
        var victorianColors = [0x8B6050, 0x7A5040, 0x9A7060, 0x856045];
        for (var vi = 0; vi < 8; vi++) {
            var vWidth = 14 + (vi % 2) * 3;
            var vHeight = 9 + (vi % 3) * 2;
            var vGeo = new THREE.BoxGeometry(vWidth, vHeight, 10);
            var vMesh = makeMesh(vGeo, victorianColors[vi % 4]);
            vMesh.position.set(OX - 100 + vi * 30, vHeight / 2, 26);

            // Decorative cornice band
            var corniceGeo = new THREE.BoxGeometry(vWidth + 0.5, 0.8, 10.5);
            var cornice = makeMesh(corniceGeo, 0xC8A87E);
            cornice.position.set(OX - 100 + vi * 30, vHeight + 0.4, 26);
        }

        buildTownHall();
        buildWarMemorial();
    }

    function buildTownHall() {
        // Town Hall — elaborate Victorian with tower
        var thX = OX + 20;
        var thZ = 20;

        // Main hall body
        var hallGeo = new THREE.BoxGeometry(30, 12, 20);
        var hall = makeMesh(hallGeo, 0xD4B896);
        hall.position.set(thX, 6, thZ);

        // Colonnaded portico
        var porticoGeo = new THREE.BoxGeometry(20, 10, 6);
        var portico = makeMesh(porticoGeo, 0xDCC8A8);
        portico.position.set(thX, 5, thZ - 13);

        // Columns
        for (var col = 0; col < 5; col++) {
            var colGeo = new THREE.CylinderGeometry(0.6, 0.7, 10, 8);
            var colMesh = makeMesh(colGeo, 0xEEDDCC);
            colMesh.position.set(thX - 8 + col * 4, 5, thZ - 15.5);
        }

        // Tower base
        var tbGeo = new THREE.BoxGeometry(8, 14, 8);
        var tb = makeMesh(tbGeo, 0xD4B896);
        tb.position.set(thX, 12 + 7, thZ);

        // Tower mid section
        var tmGeo = new THREE.BoxGeometry(6, 8, 6);
        var tm = makeMesh(tmGeo, 0xC8A880);
        tm.position.set(thX, 33, thZ);

        // Tower clock stage
        var tcGeo = new THREE.BoxGeometry(5, 5, 5);
        var tc = makeMesh(tcGeo, 0xBCA070);
        tc.position.set(thX, 40.5, thZ);

        // Spire
        var spireGeo = new THREE.ConeGeometry(2.2, 10, 8);
        var spire = makeMesh(spireGeo, 0x556644);
        spire.position.set(thX, 48, thZ);

        // Corner pinnacles on hall
        var pinnaclePos = [
            [-14, 0], [14, 0], [-14, 20], [14, 20]
        ];
        for (var pp = 0; pp < 4; pp++) {
            var ppGeo = new THREE.ConeGeometry(0.8, 4, 4);
            var ppMesh = makeMesh(ppGeo, 0x556644);
            ppMesh.position.set(thX + pinnaclePos[pp][0], 14.5, thZ - 10 + pinnaclePos[pp][1]);
        }
    }

    function buildWarMemorial() {
        // War memorial — obelisk type
        var memX = OX - 30;
        var memZ = 20;

        var baseGeo = new THREE.BoxGeometry(4, 1, 4);
        var base = makeMesh(baseGeo, 0xCCCCCC);
        base.position.set(memX, 0.5, memZ);

        var shaftGeo = new THREE.BoxGeometry(2, 10, 2);
        var shaft = makeMesh(shaftGeo, 0xDDDDDD);
        shaft.position.set(memX, 6, memZ);

        var obeliskGeo = new THREE.ConeGeometry(0.8, 4, 4);
        var obelisk = makeMesh(obeliskGeo, 0xEEEEEE);
        obelisk.position.set(memX, 12.5, memZ);

        // Base steps
        var step1Geo = new THREE.BoxGeometry(7, 0.5, 7);
        var step1 = makeMesh(step1Geo, 0xBBBBBB);
        step1.position.set(memX, 0.25, memZ);

        var step2Geo = new THREE.BoxGeometry(5.5, 0.5, 5.5);
        var step2 = makeMesh(step2Geo, 0xCCCCCC);
        step2.position.set(memX, 0.75, memZ);
    }

    function buildRiverColne() {
        // River Colne — flowing through the valley north-east of centre
        var riverColor = 0x4A7A9E;

        // River course — several segments following the valley
        var riverSegments = [
            [OX + 160, -300, 18, 120],
            [OX + 140, -180, 18, 80],
            [OX + 120, -100, 18, 100],
            [OX + 100, -10, 18, 80]
        ];
        for (var ri = 0; ri < riverSegments.length; ri++) {
            var rs = riverSegments[ri];
            var rGeo = new THREE.BoxGeometry(rs[2], 0.15, rs[3]);
            var rMesh = makeMesh(rGeo, riverColor);
            rMesh.position.set(rs[0], 0.1, rs[1]);
        }

        // River bank terracing
        var bankColor = 0x4A6A35;
        for (var rb = 0; rb < 4; rb++) {
            var rbGeo = new THREE.BoxGeometry(25, 0.3, 50);
            var rbMesh = makeMesh(rbGeo, bankColor);
            rbMesh.position.set(OX + 115 + rb * 4, 0.2, -150 - rb * 40);
        }

        buildDutchQuarter();
    }

    function buildDutchQuarter() {
        // Dutch Quarter — 17th century weavers' cottages, steep gables
        // Located north of the High Street towards the Colne
        var dqX = OX + 60;
        var dqZ = -100;
        var cottageColors = [0xC8A878, 0xB89060, 0xD4B490, 0xAA8858, 0xBCA070];

        for (var di = 0; di < 12; di++) {
            var dRow = Math.floor(di / 4);
            var dCol = di % 4;
            var dcx = dqX + dCol * 14 - 21;
            var dcz = dqZ + dRow * 18;

            // Cottage body — narrow with steep proportions
            var dcGeo = new THREE.BoxGeometry(10, 7, 8);
            var dcMesh = makeMesh(dcGeo, cottageColors[di % 5]);
            dcMesh.position.set(dcx, 3.5, dcz);

            // Distinctive steep Dutch gable — stepped triangular
            var gableH = 6 + (di % 2) * 1;
            var gableGeo = new THREE.BoxGeometry(10, gableH, 1);
            var gable = makeMesh(gableGeo, cottageColors[(di + 2) % 5]);
            gable.position.set(dcx, 7 + gableH / 2, dcz - 3.5);

            // Gable steps — characteristic Dutch profile
            for (var gs = 0; gs < 3; gs++) {
                var gsWidth = 6 - gs * 1.5;
                var gsGeo = new THREE.BoxGeometry(gsWidth, 1.2, 1.2);
                var gsMesh = makeMesh(gsGeo, 0x7A5A3A);
                gsMesh.position.set(dcx, 8.5 + gs * 2, dcz - 3.5);
            }

            // Gable peak
            var gpGeo = new THREE.ConeGeometry(1.8, 3, 4);
            var gpMesh = makeMesh(gpGeo, 0x5A4028);
            gpMesh.position.set(dcx, 7 + gableH + 1.5, dcz - 3.5);

            // Small casement windows
            for (var dw = 0; dw < 2; dw++) {
                var dwGeo = new THREE.BoxGeometry(1.8, 1.8, 0.4);
                var dwMesh = makeMesh(dwGeo, 0x6A9AB0);
                dwMesh.position.set(dcx - 2.5 + dw * 5, 4.5, dcz - 4.2);
            }

            // Chimney stack
            var chimGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
            var chim = makeMesh(chimGeo, 0x6A4A3A);
            chim.position.set(dcx + 2, 9, dcz);

            var chimCapGeo = new THREE.BoxGeometry(2.2, 0.5, 2.2);
            var chimCap = makeMesh(chimCapGeo, 0x4A3A28);
            chimCap.position.set(dcx + 2, 11.25, dcz);
        }
    }

    function buildRomanCircus() {
        // Roman circus — unique chariot-racing track
        // Only one known in Britain — south of the castle
        // Outline of the elongated oval circuit
        var circX = OX - 20;
        var circZ = 150;
        var circusColor = 0x8A7A5A;
        var sandColor = 0xC8B870;

        // Racing surface / arena floor
        var arenaGeo = new THREE.BoxGeometry(90, 0.2, 230);
        var arena = makeMesh(arenaGeo, sandColor);
        arena.position.set(circX, 0.1, circZ);

        // Spina (central barrier dividing the track)
        var spinaGeo = new THREE.BoxGeometry(6, 1.2, 160);
        var spina = makeMesh(spinaGeo, 0xAA9060);
        spina.position.set(circX, 0.7, circZ - 10);

        // Spina decorative elements — turning posts (metae)
        for (var sp = 0; sp < 2; sp++) {
            var metaGeo = new THREE.ConeGeometry(1.5, 5, 6);
            var meta = makeMesh(metaGeo, 0xCCAA40);
            meta.position.set(circX, 3, circZ - 78 + sp * 156);
        }

        // Spina obelisk
        var soGeo = new THREE.BoxGeometry(1, 8, 1);
        var soMesh = makeMesh(soGeo, 0xD4C080);
        soMesh.position.set(circX, 4.5, circZ - 10);

        // Outer circuit wall — long straight sides
        var cwLGeo = new THREE.BoxGeometry(4, 3, 230);
        var cwL = makeMesh(cwLGeo, circusColor);
        cwL.position.set(circX - 47, 1.5, circZ);

        var cwRGeo = new THREE.BoxGeometry(4, 3, 230);
        var cwR = makeMesh(cwRGeo, circusColor);
        cwR.position.set(circX + 47, 1.5, circZ);

        // Curved ends — approximated with box segments
        var endPositions = [
            [circX - 30, circZ - 115], [circX - 10, circZ - 118], [circX + 10, circZ - 118], [circX + 30, circZ - 115],
            [circX - 30, circZ + 115], [circX - 10, circZ + 118], [circX + 10, circZ + 118], [circX + 30, circZ + 115]
        ];
        for (var ep = 0; ep < endPositions.length; ep++) {
            var epGeo = new THREE.BoxGeometry(18, 3, 4);
            var epMesh = makeMesh(epGeo, circusColor);
            epMesh.position.set(endPositions[ep][0], 1.5, endPositions[ep][1]);
        }

        // Starting gates (carceres) — north end, partitioned stalls
        var cgZ = circZ + 115;
        for (var cg = 0; cg < 6; cg++) {
            var cgGeo = new THREE.BoxGeometry(12, 4, 8);
            var cgMesh = makeMesh(cgGeo, 0x9A8A6A);
            cgMesh.position.set(circX - 30 + cg * 12, 2, cgZ + 6);

            // Gate dividers
            var cgDivGeo = new THREE.BoxGeometry(0.8, 4, 8);
            var cgDiv = makeMesh(cgDivGeo, 0x7A6A4A);
            cgDiv.position.set(circX - 24 + cg * 12, 2, cgZ + 6);
        }

        // Spectator banking — simple terraced embankments
        var bankColors2 = [0x6A8A4A, 0x5A7A3A, 0x7A9A5A];
        for (var bk = 0; bk < 3; bk++) {
            var bkLGeo = new THREE.BoxGeometry(6, 1.5, 200);
            var bkL = makeMesh(bkLGeo, bankColors2[bk]);
            bkL.position.set(circX - 52 - bk * 7, 1 + bk * 1.5, circZ);

            var bkRGeo = new THREE.BoxGeometry(6, 1.5, 200);
            var bkR = makeMesh(bkRGeo, bankColors2[bk]);
            bkR.position.set(circX + 52 + bk * 7, 1 + bk * 1.5, circZ);
        }
    }

    function buildGroundPlane() {
        // Local ground — gentle undulation, historic town on low hill
        var groundGeo = new THREE.BoxGeometry(600, 0.5, 700);
        var ground = makeMesh(groundGeo, 0x5A7A3A);
        ground.position.set(OX, -0.25, -50);

        // Castle hill slight elevation
        var hillGeo = new THREE.BoxGeometry(120, 1, 120);
        var hill = makeMesh(hillGeo, 0x4A6A2A);
        hill.position.set(OX, 0.3, -60);

        // Town streets — secondary roads
        var roadColor = 0x7A7A7A;
        var roads = [
            [OX, -130, 8, 300],   // North Hill
            [OX - 80, -30, 160, 8], // East-west cross street
            [OX + 30, 80, 8, 100],  // Southway
            [OX - 20, -250, 8, 100] // North approach
        ];
        for (var rd = 0; rd < roads.length; rd++) {
            var rdGeo = new THREE.BoxGeometry(roads[rd][2], 0.15, roads[rd][3]);
            var rdMesh = makeMesh(rdGeo, roadColor);
            rdMesh.position.set(roads[rd][0], 0.08, roads[rd][1]);
        }

        // Pavement / footways alongside main roads
        var pavGeo = new THREE.BoxGeometry(308, 0.12, 5);
        var pavN = makeMesh(pavGeo, 0x999999);
        pavN.position.set(OX, 0.06, 15);

        var pavGeo2 = new THREE.BoxGeometry(308, 0.12, 5);
        var pavS = makeMesh(pavGeo2, 0x999999);
        pavS.position.set(OX, 0.06, 26);
    }

    function build() {
        buildGroundPlane();
        buildRomanWalls();
        buildCastle();
        buildHighStreet();
        buildRiverColne();
        buildRomanCircus();
    }

    function update(delta) {
        // Static environment — no animation needed
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
