window.AlexandraPalace = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12120;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildPark();
        buildPalace();
        buildBBCMast();
        buildIceRink();
        buildLondonSkyline();
    }

    function buildPark() {
        // Hillside terrain — stacked BoxGeometry slabs rising toward palace
        var terrainMat = makeMaterial(0x4a7c3f);
        var terrainDarkMat = makeMaterial(0x3a6030);
        var pathMat = makeMaterial(0xc8b87a);
        var waterMat = makeMaterial(0x3a6ea8);
        var stoneMat = makeMaterial(0x9e9e8a);

        // Base ground
        var baseGround = new THREE.Mesh(
            new THREE.BoxGeometry(300, 2, 200),
            terrainMat
        );
        baseGround.position.set(X_OFFSET, -1, 80);
        addMesh(baseGround);

        // Hillside — stepped terrain climbing from south
        var steps = [
            { y: 2,  z: 50,  w: 280, d: 40, h: 4  },
            { y: 6,  z: 20,  w: 260, d: 40, h: 4  },
            { y: 10, z: -10, w: 240, d: 40, h: 4  },
            { y: 14, z: -40, w: 220, d: 40, h: 4  },
            { y: 18, z: -65, w: 200, d: 30, h: 4  },
            { y: 22, z: -88, w: 180, d: 30, h: 4  }
        ];

        for (var s = 0; s < steps.length; s++) {
            var st = steps[s];
            var slab = new THREE.Mesh(
                new THREE.BoxGeometry(st.w, st.h, st.d),
                (s % 2 === 0) ? terrainMat : terrainDarkMat
            );
            slab.position.set(X_OFFSET, st.y, st.z);
            addMesh(slab);
        }

        // Hilltop plateau for palace
        var plateau = new THREE.Mesh(
            new THREE.BoxGeometry(200, 6, 60),
            terrainDarkMat
        );
        plateau.position.set(X_OFFSET, 25, -108);
        addMesh(plateau);

        // Path up the hill
        var path = new THREE.Mesh(
            new THREE.BoxGeometry(8, 0.5, 220),
            pathMat
        );
        path.position.set(X_OFFSET + 20, 12, 0);
        addMesh(path);

        // Boating lake
        var lake = new THREE.Mesh(
            new THREE.BoxGeometry(60, 0.5, 40),
            waterMat
        );
        lake.position.set(X_OFFSET - 80, 2.3, 60);
        addMesh(lake);

        // Lake border
        var lakeBorder = new THREE.Mesh(
            new THREE.BoxGeometry(66, 1, 46),
            stoneMat
        );
        lakeBorder.position.set(X_OFFSET - 80, 1.5, 60);
        addMesh(lakeBorder);

        // Bandstand base
        var bandstandBase = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 7, 1.5, 8),
            stoneMat
        );
        bandstandBase.position.set(X_OFFSET + 80, 2.8, 50);
        addMesh(bandstandBase);

        // Bandstand columns (8 columns around perimeter)
        var colMat = makeMaterial(0xccccbb);
        var bandstandAngles = [0, 0.785, 1.571, 2.356, 3.142, 3.927, 4.712, 5.497];
        for (var bc = 0; bc < bandstandAngles.length; bc++) {
            var bx = Math.sin(bandstandAngles[bc]) * 5;
            var bz = Math.cos(bandstandAngles[bc]) * 5;
            var bcol = new THREE.Mesh(
                new THREE.CylinderGeometry(0.3, 0.3, 4, 6),
                colMat
            );
            bcol.position.set(X_OFFSET + 80 + bx, 5.5, 50 + bz);
            addMesh(bcol);
        }

        // Bandstand roof
        var bandstandRoof = new THREE.Mesh(
            new THREE.ConeGeometry(7, 3, 8),
            makeMaterial(0x556b2f)
        );
        bandstandRoof.position.set(X_OFFSET + 80, 9, 50);
        addMesh(bandstandRoof);

        // Formal garden urns — pairs along main axis
        var urnMat = makeMaterial(0xb0a890);
        var urnPositions = [
            [X_OFFSET - 30, 2, -80],
            [X_OFFSET + 30, 2, -80],
            [X_OFFSET - 30, 2, -95],
            [X_OFFSET + 30, 2, -95],
            [X_OFFSET - 15, 2, -100],
            [X_OFFSET + 15, 2, -100]
        ];
        for (var u = 0; u < urnPositions.length; u++) {
            var urnBase = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.8, 1, 8),
                urnMat
            );
            urnBase.position.set(urnPositions[u][0], urnPositions[u][1], urnPositions[u][2]);
            addMesh(urnBase);

            var urnBowl = new THREE.Mesh(
                new THREE.SphereGeometry(0.9, 8, 6),
                urnMat
            );
            urnBowl.position.set(urnPositions[u][0], urnPositions[u][1] + 1.4, urnPositions[u][2]);
            addMesh(urnBowl);
        }

        // Garden hedge rows
        var hedgeMat = makeMaterial(0x2d5a1b);
        var hedgeRows = [
            { x: X_OFFSET - 50, z: -90, w: 4, d: 40 },
            { x: X_OFFSET + 50, z: -90, w: 4, d: 40 }
        ];
        for (var h = 0; h < hedgeRows.length; h++) {
            var hr = hedgeRows[h];
            var hedge = new THREE.Mesh(
                new THREE.BoxGeometry(hr.w, 2.5, hr.d),
                hedgeMat
            );
            hedge.position.set(hr.x, 27, hr.z);
            addMesh(hedge);
        }

        // Trees scattered in park
        var trunkMat = makeMaterial(0x5c3d1e);
        var foliageMat = makeMaterial(0x2e7d32);
        var treePositions = [
            [X_OFFSET - 100, 0, 40],
            [X_OFFSET - 120, 0, 20],
            [X_OFFSET - 110, 0, -10],
            [X_OFFSET + 100, 0, 30],
            [X_OFFSET + 115, 0, 10],
            [X_OFFSET - 60, 0, 70],
            [X_OFFSET + 60, 0, 70],
            [X_OFFSET + 90, 0, -20]
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            var trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.8, 6, 6),
                trunkMat
            );
            trunk.position.set(tp[0], tp[1] + 3, tp[2]);
            addMesh(trunk);

            var foliage = new THREE.Mesh(
                new THREE.SphereGeometry(4, 7, 5),
                foliageMat
            );
            foliage.position.set(tp[0], tp[1] + 9, tp[2]);
            addMesh(foliage);
        }
    }

    function buildPalace() {
        var brickMat = makeMaterial(0xc8a870);
        var stoneMat = makeMaterial(0xd4c9a0);
        var roofMat = makeMaterial(0x7a6a5a);
        var glassMat = makeMaterial(0x88aacc);
        var darkStoneMat = makeMaterial(0xa09070);
        var terracottaMat = makeMaterial(0xb5651d);
        var ironMat = makeMaterial(0x444444);

        var PY = 28; // palace ground Y (on hilltop)
        var PZ = -120;

        // ---- Main long body of palace (Great Hall wing + Concert Hall) ----
        var mainBody = new THREE.Mesh(
            new THREE.BoxGeometry(80, 16, 16),
            brickMat
        );
        mainBody.position.set(X_OFFSET, PY + 8, PZ);
        addMesh(mainBody);

        // Roof of main body (hipped low profile)
        var mainRoof = new THREE.Mesh(
            new THREE.BoxGeometry(82, 3, 18),
            roofMat
        );
        mainRoof.position.set(X_OFFSET, PY + 17, PZ);
        addMesh(mainRoof);

        // ---- Central Italianate tower / projection ----
        var centralTower = new THREE.Mesh(
            new THREE.BoxGeometry(14, 22, 14),
            stoneMat
        );
        centralTower.position.set(X_OFFSET, PY + 11, PZ);
        addMesh(centralTower);

        // Central tower upper stage
        var centralUpper = new THREE.Mesh(
            new THREE.BoxGeometry(10, 8, 10),
            stoneMat
        );
        centralUpper.position.set(X_OFFSET, PY + 26, PZ);
        addMesh(centralUpper);

        // Central tower roof (low pyramid)
        var centralRoof = new THREE.Mesh(
            new THREE.ConeGeometry(7, 5, 4),
            roofMat
        );
        centralRoof.rotation.y = Math.PI / 4;
        centralRoof.position.set(X_OFFSET, PY + 33, PZ);
        addMesh(centralRoof);

        // Italianate rose window (circular — sphere flattened against facade)
        var roseWindow = new THREE.Mesh(
            new THREE.SphereGeometry(3, 10, 8),
            glassMat
        );
        roseWindow.scale.z = 0.2;
        roseWindow.position.set(X_OFFSET, PY + 15, PZ - 8);
        addMesh(roseWindow);

        // Rose window surround ring
        var roseRing = new THREE.Mesh(
            new THREE.CylinderGeometry(3.5, 3.5, 0.8, 12),
            stoneMat
        );
        roseRing.rotation.x = Math.PI / 2;
        roseRing.position.set(X_OFFSET, PY + 15, PZ - 8);
        addMesh(roseRing);

        // ---- East end pavilion ----
        var eastPav = new THREE.Mesh(
            new THREE.BoxGeometry(16, 20, 18),
            brickMat
        );
        eastPav.position.set(X_OFFSET + 48, PY + 10, PZ);
        addMesh(eastPav);

        // East pavilion dome
        var eastDome = new THREE.Mesh(
            new THREE.SphereGeometry(7, 10, 8),
            roofMat
        );
        eastDome.scale.y = 0.6;
        eastDome.position.set(X_OFFSET + 48, PY + 22, PZ);
        addMesh(eastDome);

        // East dome drum
        var eastDrum = new THREE.Mesh(
            new THREE.CylinderGeometry(7, 7, 3, 10),
            stoneMat
        );
        eastDrum.position.set(X_OFFSET + 48, PY + 20, PZ);
        addMesh(eastDrum);

        // East pavilion lantern
        var eastLantern = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 3, 8),
            stoneMat
        );
        eastLantern.position.set(X_OFFSET + 48, PY + 27, PZ);
        addMesh(eastLantern);

        // ---- West end pavilion ----
        var westPav = new THREE.Mesh(
            new THREE.BoxGeometry(16, 20, 18),
            brickMat
        );
        westPav.position.set(X_OFFSET - 48, PY + 10, PZ);
        addMesh(westPav);

        // West pavilion dome
        var westDome = new THREE.Mesh(
            new THREE.SphereGeometry(7, 10, 8),
            roofMat
        );
        westDome.scale.y = 0.6;
        westDome.position.set(X_OFFSET - 48, PY + 22, PZ);
        addMesh(westDome);

        // West dome drum
        var westDrum = new THREE.Mesh(
            new THREE.CylinderGeometry(7, 7, 3, 10),
            stoneMat
        );
        westDrum.position.set(X_OFFSET - 48, PY + 20, PZ);
        addMesh(westDrum);

        // West pavilion lantern
        var westLantern = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 3, 8),
            stoneMat
        );
        westLantern.position.set(X_OFFSET - 48, PY + 27, PZ);
        addMesh(westLantern);

        // ---- Great Hall wing (rear, slightly wider block) ----
        var greatHall = new THREE.Mesh(
            new THREE.BoxGeometry(60, 18, 12),
            brickMat
        );
        greatHall.position.set(X_OFFSET, PY + 9, PZ + 14);
        addMesh(greatHall);

        var greatHallRoof = new THREE.Mesh(
            new THREE.BoxGeometry(62, 4, 14),
            roofMat
        );
        greatHallRoof.position.set(X_OFFSET, PY + 20, PZ + 14);
        addMesh(greatHallRoof);

        // ---- Terrace balustrade (south facade) ----
        var terraceBase = new THREE.Mesh(
            new THREE.BoxGeometry(84, 1.5, 4),
            stoneMat
        );
        terraceBase.position.set(X_OFFSET, PY + 0.75, PZ - 10);
        addMesh(terraceBase);

        // Balustrade top rail
        var balustRail = new THREE.Mesh(
            new THREE.BoxGeometry(84, 0.6, 0.6),
            stoneMat
        );
        balustRail.position.set(X_OFFSET, PY + 2.5, PZ - 10);
        addMesh(balustRail);

        // Individual balusters
        for (var bal = -40; bal <= 40; bal += 2) {
            var baluster = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 2, 4),
                stoneMat
            );
            baluster.position.set(X_OFFSET + bal, PY + 1.5, PZ - 10);
            addMesh(baluster);
        }

        // Terrace steps down from south
        var step1 = new THREE.Mesh(
            new THREE.BoxGeometry(40, 1, 3),
            darkStoneMat
        );
        step1.position.set(X_OFFSET, PY - 0.5, PZ - 12);
        addMesh(step1);

        var step2 = new THREE.Mesh(
            new THREE.BoxGeometry(44, 1, 3),
            darkStoneMat
        );
        step2.position.set(X_OFFSET, PY - 1.5, PZ - 15);
        addMesh(step2);

        // ---- Decorative pilasters on main facade ----
        var pilasterPositions = [-36, -24, -12, 0, 12, 24, 36];
        for (var p = 0; p < pilasterPositions.length; p++) {
            var pilaster = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 16, 1.2),
                stoneMat
            );
            pilaster.position.set(X_OFFSET + pilasterPositions[p], PY + 8, PZ - 8.1);
            addMesh(pilaster);
        }

        // Arched windows along facade (rectangular approximations with arch tops)
        var windowMat = makeMaterial(0x6699bb);
        for (var ww = -35; ww <= 35; ww += 8) {
            var win = new THREE.Mesh(
                new THREE.BoxGeometry(3, 6, 0.4),
                windowMat
            );
            win.position.set(X_OFFSET + ww, PY + 8, PZ - 8.2);
            addMesh(win);

            var winArch = new THREE.Mesh(
                new THREE.SphereGeometry(1.5, 6, 4),
                windowMat
            );
            winArch.scale.y = 0.5;
            winArch.position.set(X_OFFSET + ww, PY + 12, PZ - 8.2);
            addMesh(winArch);
        }

        // ---- Chimneys on roof ----
        var chimneyPositions = [-35, -20, -5, 10, 25, 38];
        for (var ch = 0; ch < chimneyPositions.length; ch++) {
            var chimney = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 4, 1.5),
                brickMat
            );
            chimney.position.set(X_OFFSET + chimneyPositions[ch], PY + 20, PZ);
            addMesh(chimney);

            var chimneyPot = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.6, 1.5, 6),
                terracottaMat
            );
            chimneyPot.position.set(X_OFFSET + chimneyPositions[ch], PY + 23, PZ);
            addMesh(chimneyPot);
        }

        // ---- South-facing clock / decorative medallion on central tower ----
        var clockFace = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 0.3, 12),
            stoneMat
        );
        clockFace.rotation.x = Math.PI / 2;
        clockFace.position.set(X_OFFSET, PY + 20, PZ - 7.1);
        addMesh(clockFace);

        // Iron railings at entrance
        for (var ir = -20; ir <= 20; ir += 2) {
            var railing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 3, 4),
                ironMat
            );
            railing.position.set(X_OFFSET + ir, PY - 0.5, PZ - 18);
            addMesh(railing);
        }

        var railingTop = new THREE.Mesh(
            new THREE.BoxGeometry(40, 0.2, 0.2),
            ironMat
        );
        railingTop.position.set(X_OFFSET, PY + 2, PZ - 18);
        addMesh(railingTop);
    }

    function buildBBCMast() {
        // Famous 100m BBC transmitter mast on roof of palace
        var mastMat = makeMaterial(0x888888);
        var lightMat = makeMaterial(0xff2200);

        var MX = X_OFFSET + 20;
        var MY = 28 + 18; // on top of palace roof
        var MZ = -120;

        // Main vertical legs of lattice tower (4 corner legs)
        var legOffsets = [
            [2, 2],
            [-2, 2],
            [2, -2],
            [-2, -2]
        ];

        for (var leg = 0; leg < legOffsets.length; leg++) {
            // Split each leg into sections for taper
            var lx = legOffsets[leg][0];
            var lz = legOffsets[leg][1];

            // Lower section (0-30m)
            var lower = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 30, 0.4),
                mastMat
            );
            lower.position.set(MX + lx, MY + 15, MZ + lz);
            addMesh(lower);

            // Middle section (30-65m) — slightly inward
            var mid = new THREE.Mesh(
                new THREE.BoxGeometry(0.35, 35, 0.35),
                mastMat
            );
            mid.position.set(MX + lx * 0.7, MY + 47, MZ + lz * 0.7);
            addMesh(mid);

            // Upper section (65-100m) — more tapered
            var upper = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 35, 0.25),
                mastMat
            );
            upper.position.set(MX + lx * 0.3, MY + 82, MZ + lz * 0.3);
            addMesh(upper);
        }

        // Cross-bracing — horizontal rings at intervals
        var braceHeights = [10, 20, 30, 40, 50, 60, 70, 80, 90];
        for (var bh = 0; bh < braceHeights.length; bh++) {
            var hy = MY + braceHeights[bh];
            // tapered offset
            var boff = (braceHeights[bh] < 30) ? 2 : (braceHeights[bh] < 65) ? 1.4 : 0.6;

            // Horizontal cross members (two per level, X and Z directions)
            var hbraceX = new THREE.Mesh(
                new THREE.BoxGeometry(boff * 2, 0.3, 0.3),
                mastMat
            );
            hbraceX.position.set(MX, hy, MZ);
            addMesh(hbraceX);

            var hbraceZ = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, boff * 2),
                mastMat
            );
            hbraceZ.position.set(MX, hy, MZ);
            addMesh(hbraceZ);
        }

        // Diagonal bracing using LineSegments
        var diagGeo = new THREE.BufferGeometry();
        var diagVerts = [];

        // Lower section diagonals
        var lowerDiagPairs = [
            [MX + 2, MY, MZ + 2,      MX - 2, MY + 10, MZ + 2],
            [MX - 2, MY, MZ + 2,      MX + 2, MY + 10, MZ + 2],
            [MX + 2, MY, MZ - 2,      MX - 2, MY + 10, MZ - 2],
            [MX - 2, MY, MZ - 2,      MX + 2, MY + 10, MZ - 2],
            [MX + 2, MY, MZ + 2,      MX + 2, MY + 10, MZ - 2],
            [MX + 2, MY, MZ - 2,      MX + 2, MY + 10, MZ + 2],
            [MX - 2, MY, MZ + 2,      MX - 2, MY + 10, MZ - 2],
            [MX - 2, MY, MZ - 2,      MX - 2, MY + 10, MZ + 2],

            [MX + 2, MY + 10, MZ + 2, MX - 2, MY + 20, MZ + 2],
            [MX - 2, MY + 10, MZ + 2, MX + 2, MY + 20, MZ + 2],
            [MX + 2, MY + 10, MZ - 2, MX - 2, MY + 20, MZ - 2],
            [MX - 2, MY + 10, MZ - 2, MX + 2, MY + 20, MZ - 2],
            [MX + 2, MY + 10, MZ + 2, MX + 2, MY + 20, MZ - 2],
            [MX + 2, MY + 10, MZ - 2, MX + 2, MY + 20, MZ + 2],
            [MX - 2, MY + 10, MZ + 2, MX - 2, MY + 20, MZ - 2],
            [MX - 2, MY + 10, MZ - 2, MX - 2, MY + 20, MZ + 2],

            [MX + 2, MY + 20, MZ + 2, MX - 2, MY + 30, MZ + 2],
            [MX - 2, MY + 20, MZ + 2, MX + 2, MY + 30, MZ + 2],
            [MX + 2, MY + 20, MZ - 2, MX - 2, MY + 30, MZ - 2],
            [MX - 2, MY + 20, MZ - 2, MX + 2, MY + 30, MZ - 2],

            // Mid section diagonals (offset 1.4)
            [MX + 1.4, MY + 30, MZ + 1.4, MX - 1.4, MY + 40, MZ + 1.4],
            [MX - 1.4, MY + 30, MZ + 1.4, MX + 1.4, MY + 40, MZ + 1.4],
            [MX + 1.4, MY + 30, MZ - 1.4, MX - 1.4, MY + 40, MZ - 1.4],
            [MX - 1.4, MY + 30, MZ - 1.4, MX + 1.4, MY + 40, MZ - 1.4],

            [MX + 1.4, MY + 40, MZ + 1.4, MX - 1.4, MY + 50, MZ + 1.4],
            [MX - 1.4, MY + 40, MZ + 1.4, MX + 1.4, MY + 50, MZ + 1.4],
            [MX + 1.4, MY + 40, MZ - 1.4, MX - 1.4, MY + 50, MZ - 1.4],
            [MX - 1.4, MY + 40, MZ - 1.4, MX + 1.4, MY + 50, MZ - 1.4],

            [MX + 1.4, MY + 50, MZ + 1.4, MX - 1.4, MY + 60, MZ + 1.4],
            [MX - 1.4, MY + 50, MZ + 1.4, MX + 1.4, MY + 60, MZ + 1.4],
            [MX + 1.4, MY + 50, MZ - 1.4, MX - 1.4, MY + 60, MZ - 1.4],
            [MX - 1.4, MY + 50, MZ - 1.4, MX + 1.4, MY + 60, MZ - 1.4],

            // Upper section diagonals (offset 0.6)
            [MX + 0.6, MY + 65, MZ + 0.6, MX - 0.6, MY + 75, MZ + 0.6],
            [MX - 0.6, MY + 65, MZ + 0.6, MX + 0.6, MY + 75, MZ + 0.6],
            [MX + 0.6, MY + 65, MZ - 0.6, MX - 0.6, MY + 75, MZ - 0.6],
            [MX - 0.6, MY + 65, MZ - 0.6, MX + 0.6, MY + 75, MZ - 0.6],

            [MX + 0.6, MY + 75, MZ + 0.6, MX - 0.6, MY + 85, MZ + 0.6],
            [MX - 0.6, MY + 75, MZ + 0.6, MX + 0.6, MY + 85, MZ + 0.6],
            [MX + 0.6, MY + 75, MZ - 0.6, MX - 0.6, MY + 85, MZ - 0.6],
            [MX - 0.6, MY + 75, MZ - 0.6, MX + 0.6, MY + 85, MZ - 0.6]
        ];

        for (var dp = 0; dp < lowerDiagPairs.length; dp++) {
            var pair = lowerDiagPairs[dp];
            diagVerts.push(pair[0], pair[1], pair[2], pair[3], pair[4], pair[5]);
        }

        diagGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(diagVerts), 3));
        var diagLines = new THREE.LineSegments(
            diagGeo,
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        scene.add(diagLines);
        objects.push(diagLines);

        // Horizontal arms at various heights (transmitting arrays)
        var armHeights = [MY + 50, MY + 60, MY + 75, MY + 85];
        var armLengths = [12, 10, 8, 6];
        for (var ah = 0; ah < armHeights.length; ah++) {
            // Main horizontal arm
            var arm = new THREE.Mesh(
                new THREE.BoxGeometry(armLengths[ah], 0.4, 0.4),
                mastMat
            );
            arm.position.set(MX, armHeights[ah], MZ);
            addMesh(arm);

            // Cross arm perpendicular
            var armCross = new THREE.Mesh(
                new THREE.BoxGeometry(0.4, 0.4, armLengths[ah] * 0.6),
                mastMat
            );
            armCross.position.set(MX, armHeights[ah], MZ);
            addMesh(armCross);

            // Arm end tips
            var tipL = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 4, 3),
                mastMat
            );
            tipL.position.set(MX - armLengths[ah] / 2, armHeights[ah], MZ);
            addMesh(tipL);

            var tipR = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 4, 3),
                mastMat
            );
            tipR.position.set(MX + armLengths[ah] / 2, armHeights[ah], MZ);
            addMesh(tipR);
        }

        // Aviation warning lights at top (red spheres)
        var lightPositions = [
            [MX, MY + 95, MZ],
            [MX, MY + 88, MZ],
            [MX - 6, MY + 75, MZ],
            [MX + 6, MY + 75, MZ],
            [MX, MY + 60, MZ]
        ];
        for (var li = 0; li < lightPositions.length; li++) {
            var avLight = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 6, 4),
                lightMat
            );
            avLight.position.set(lightPositions[li][0], lightPositions[li][1], lightPositions[li][2]);
            addMesh(avLight);
        }

        // Mast tip spike
        var spike = new THREE.Mesh(
            new THREE.ConeGeometry(0.3, 5, 4),
            mastMat
        );
        spike.position.set(MX, MY + 97, MZ);
        addMesh(spike);

        // Base platform of mast
        var mastBase = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1.5, 8),
            makeMaterial(0x666666)
        );
        mastBase.position.set(MX, MY + 0.75, MZ);
        addMesh(mastBase);
    }

    function buildIceRink() {
        var rinkMat = makeMaterial(0xddeeff);
        var rinkWallMat = makeMaterial(0xaabbcc);
        var roofMat = makeMaterial(0x778899);
        var equipMat = makeMaterial(0x555566);
        var metalMat = makeMaterial(0x888899);

        var RX = X_OFFSET - 50;
        var RY = 28;
        var RZ = -115;

        // Ice rink floor / ice surface
        var iceFloor = new THREE.Mesh(
            new THREE.BoxGeometry(40, 0.5, 25),
            rinkMat
        );
        iceFloor.position.set(RX, RY + 0.25, RZ);
        addMesh(iceFloor);

        // Rink walls (perimeter low boards)
        var boardMat = makeMaterial(0xffffff);
        var boardN = new THREE.Mesh(new THREE.BoxGeometry(40, 1.2, 0.5), boardMat);
        boardN.position.set(RX, RY + 0.6, RZ - 12.5);
        addMesh(boardN);

        var boardS = new THREE.Mesh(new THREE.BoxGeometry(40, 1.2, 0.5), boardMat);
        boardS.position.set(RX, RY + 0.6, RZ + 12.5);
        addMesh(boardS);

        var boardE = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 25), boardMat);
        boardE.position.set(RX + 20, RY + 0.6, RZ);
        addMesh(boardE);

        var boardW = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 25), boardMat);
        boardW.position.set(RX - 20, RY + 0.6, RZ);
        addMesh(boardW);

        // Rink enclosure walls
        var wallN = new THREE.Mesh(
            new THREE.BoxGeometry(46, 7, 1),
            rinkWallMat
        );
        wallN.position.set(RX, RY + 3.5, RZ - 14);
        addMesh(wallN);

        var wallS = new THREE.Mesh(
            new THREE.BoxGeometry(46, 7, 1),
            rinkWallMat
        );
        wallS.position.set(RX, RY + 3.5, RZ + 14);
        addMesh(wallS);

        var wallE = new THREE.Mesh(
            new THREE.BoxGeometry(1, 7, 28),
            rinkWallMat
        );
        wallE.position.set(RX + 23, RY + 3.5, RZ);
        addMesh(wallE);

        var wallW = new THREE.Mesh(
            new THREE.BoxGeometry(1, 7, 28),
            rinkWallMat
        );
        wallW.position.set(RX - 23, RY + 3.5, RZ);
        addMesh(wallW);

        // Flat roof
        var rinkRoof = new THREE.Mesh(
            new THREE.BoxGeometry(48, 1, 30),
            roofMat
        );
        rinkRoof.position.set(RX, RY + 7.5, RZ);
        addMesh(rinkRoof);

        // Cooling plant / equipment units on roof
        var equipPositions = [
            [RX - 15, RY + 9, RZ - 4],
            [RX - 5,  RY + 9, RZ - 4],
            [RX + 5,  RY + 9, RZ - 4],
            [RX + 15, RY + 9, RZ - 4]
        ];
        for (var eq = 0; eq < equipPositions.length; eq++) {
            var unit = new THREE.Mesh(
                new THREE.BoxGeometry(6, 2.5, 4),
                equipMat
            );
            unit.position.set(equipPositions[eq][0], equipPositions[eq][1], equipPositions[eq][2]);
            addMesh(unit);

            // Cooling fan dome on top
            var fanDome = new THREE.Mesh(
                new THREE.CylinderGeometry(1.2, 1.4, 1, 8),
                metalMat
            );
            fanDome.position.set(equipPositions[eq][0], equipPositions[eq][1] + 1.75, equipPositions[eq][2]);
            addMesh(fanDome);
        }

        // Refrigeration pipes on roof
        var pipeNS = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.3, 28),
            metalMat
        );
        pipeNS.position.set(RX - 8, RY + 8.5, RZ);
        addMesh(pipeNS);

        var pipeEW = new THREE.Mesh(
            new THREE.BoxGeometry(44, 0.3, 0.3),
            metalMat
        );
        pipeEW.position.set(RX, RY + 8.5, RZ - 2);
        addMesh(pipeEW);

        // Entrance canopy on south side
        var canopy = new THREE.Mesh(
            new THREE.BoxGeometry(10, 0.5, 4),
            roofMat
        );
        canopy.position.set(RX, RY + 4, RZ + 16);
        addMesh(canopy);

        var canopySupL = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 4, 4),
            metalMat
        );
        canopySupL.position.set(RX - 4, RY + 2, RZ + 17.5);
        addMesh(canopySupL);

        var canopySupR = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 4, 4),
            metalMat
        );
        canopySupR.position.set(RX + 4, RY + 2, RZ + 17.5);
        addMesh(canopySupR);
    }

    function buildLondonSkyline() {
        // Distant London skyline silhouettes visible from Ally Pally hilltop
        // Placed far to the south, low on the horizon
        var SKY = 28; // horizon base Y
        var SZ = 250; // far south distance

        var silMat = makeMaterial(0x334455);
        var domeMat = makeMaterial(0x445566);
        var glassMat = makeMaterial(0x667788);

        // St Paul's Cathedral — dome and towers
        var stPaulBase = new THREE.Mesh(
            new THREE.BoxGeometry(16, 20, 14),
            silMat
        );
        stPaulBase.position.set(X_OFFSET - 60, SKY + 10, SZ);
        addMesh(stPaulBase);

        var stPaulDrum = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 6, 5, 10),
            domeMat
        );
        stPaulDrum.position.set(X_OFFSET - 60, SKY + 23, SZ);
        addMesh(stPaulDrum);

        var stPaulDome = new THREE.Mesh(
            new THREE.SphereGeometry(6.5, 10, 6),
            domeMat
        );
        stPaulDome.scale.y = 0.75;
        stPaulDome.position.set(X_OFFSET - 60, SKY + 29, SZ);
        addMesh(stPaulDome);

        // St Paul's lantern
        var stPaulLantern = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 4, 6),
            domeMat
        );
        stPaulLantern.position.set(X_OFFSET - 60, SKY + 37, SZ);
        addMesh(stPaulLantern);

        // St Paul's west towers (two)
        var spTower1 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 25, 4),
            silMat
        );
        spTower1.position.set(X_OFFSET - 68, SKY + 12.5, SZ);
        addMesh(spTower1);

        var spTower2 = new THREE.Mesh(
            new THREE.BoxGeometry(4, 25, 4),
            silMat
        );
        spTower2.position.set(X_OFFSET - 52, SKY + 12.5, SZ);
        addMesh(spTower2);

        // The Shard — tall tapered glass tower
        var shardBase = new THREE.Mesh(
            new THREE.BoxGeometry(8, 8, 8),
            glassMat
        );
        shardBase.position.set(X_OFFSET + 40, SKY + 4, SZ);
        addMesh(shardBase);

        var shardMid = new THREE.Mesh(
            new THREE.BoxGeometry(6, 30, 6),
            glassMat
        );
        shardMid.position.set(X_OFFSET + 40, SKY + 23, SZ);
        addMesh(shardMid);

        var shardUpper = new THREE.Mesh(
            new THREE.BoxGeometry(4, 25, 4),
            glassMat
        );
        shardUpper.position.set(X_OFFSET + 40, SKY + 50, SZ);
        addMesh(shardUpper);

        var shardSpire = new THREE.Mesh(
            new THREE.ConeGeometry(2, 20, 4),
            glassMat
        );
        shardSpire.position.set(X_OFFSET + 40, SKY + 72, SZ);
        addMesh(shardSpire);

        // The Gherkin (30 St Mary Axe) — oval tapered tower
        var gherkinBase = new THREE.Mesh(
            new THREE.CylinderGeometry(5, 5, 8, 8),
            glassMat
        );
        gherkinBase.position.set(X_OFFSET + 80, SKY + 4, SZ);
        addMesh(gherkinBase);

        var gherkinMid = new THREE.Mesh(
            new THREE.CylinderGeometry(6, 5, 28, 8),
            glassMat
        );
        gherkinMid.position.set(X_OFFSET + 80, SKY + 22, SZ);
        addMesh(gherkinMid);

        var gherkinTop = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 6, 16, 8),
            glassMat
        );
        gherkinTop.position.set(X_OFFSET + 80, SKY + 44, SZ);
        addMesh(gherkinTop);

        var gherkinCap = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 6, 4),
            glassMat
        );
        gherkinCap.position.set(X_OFFSET + 80, SKY + 53, SZ);
        addMesh(gherkinCap);

        // City towers — generic rectangular blocks
        var cityTowers = [
            { x: X_OFFSET - 30, h: 30, w: 8,  d: 8  },
            { x: X_OFFSET - 10, h: 22, w: 6,  d: 6  },
            { x: X_OFFSET + 10, h: 35, w: 10, d: 8  },
            { x: X_OFFSET + 25, h: 18, w: 7,  d: 7  },
            { x: X_OFFSET + 60, h: 28, w: 9,  d: 7  },
            { x: X_OFFSET + 100, h: 20, w: 8, d: 8  },
            { x: X_OFFSET + 115, h: 32, w: 7, d: 7  },
            { x: X_OFFSET - 80, h: 24, w: 8,  d: 8  },
            { x: X_OFFSET - 100, h: 15, w: 6, d: 6  }
        ];

        for (var ct = 0; ct < cityTowers.length; ct++) {
            var tower = cityTowers[ct];
            var towerMesh = new THREE.Mesh(
                new THREE.BoxGeometry(tower.w, tower.h, tower.d),
                silMat
            );
            towerMesh.position.set(tower.x, SKY + tower.h / 2, SZ + (ct % 3) * 10);
            addMesh(towerMesh);
        }

        // Hazy ground layer connecting skyline
        var hazeGround = new THREE.Mesh(
            new THREE.BoxGeometry(400, 4, 40),
            makeMaterial(0x445566)
        );
        hazeGround.position.set(X_OFFSET, SKY + 2, SZ + 5);
        addMesh(hazeGround);
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

    return { init: init, update: update, reset: reset };
}());
