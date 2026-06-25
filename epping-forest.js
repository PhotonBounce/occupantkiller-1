window.EppingForest = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12200;

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

    function makeMaterial(color, options) {
        var opts = options || {};
        var mat = new THREE.MeshLambertMaterial({ color: color });
        if (opts.transparent) mat.transparent = true;
        if (opts.opacity !== undefined) mat.opacity = opts.opacity;
        return mat;
    }

    function buildPollardedHornbeam(x, y, z) {
        var trunkMat = makeMaterial(0x888888);
        var canopyMat = makeMaterial(0x2d5a1b);
        var darkCanopyMat = makeMaterial(0x1e4010);

        // Short stout trunk
        var trunkGeo = new THREE.CylinderGeometry(0.35, 0.45, 2.5, 6);
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 1.25, z);
        addMesh(trunk);

        // Multi-stem crown — several sphere clumps
        var stemOffsets = [
            [0, 0, 0],
            [0.9, 0.3, 0.3],
            [-0.8, 0.2, 0.2],
            [0.2, 0.4, -0.9],
            [-0.3, 0.1, 0.8],
            [0.6, 0.5, -0.6]
        ];
        for (var i = 0; i < stemOffsets.length; i++) {
            var so = stemOffsets[i];
            var stemGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.2, 5);
            var stem = new THREE.Mesh(stemGeo, trunkMat);
            stem.position.set(x + so[0] * 0.8, y + 2.5 + so[1] * 0.4 + 0.6, z + so[2] * 0.8);
            addMesh(stem);

            var clumpRadius = 0.7 + Math.random() * 0.4;
            var clumpGeo = new THREE.SphereGeometry(clumpRadius, 6, 5);
            var clumpMat = (i % 2 === 0) ? canopyMat : darkCanopyMat;
            var clump = new THREE.Mesh(clumpGeo, clumpMat);
            clump.position.set(x + so[0] * 1.1, y + 3.5 + so[1] * 0.6, z + so[2] * 1.1);
            addMesh(clump);
        }

        // Central wide canopy dome
        var mainCanopyGeo = new THREE.SphereGeometry(1.8, 7, 5);
        var mainCanopy = new THREE.Mesh(mainCanopyGeo, canopyMat);
        mainCanopy.position.set(x, y + 4.2, z);
        addMesh(mainCanopy);
    }

    function buildBeechTree(x, y, z) {
        var trunkMat = makeMaterial(0x9a7a5a);
        var canopyMat = makeMaterial(0x3a6b20);

        var trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 5.0, 6);
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 2.5, z);
        addMesh(trunk);

        var canopyGeo = new THREE.SphereGeometry(2.5, 7, 5);
        var canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.set(x, y + 6.5, z);
        addMesh(canopy);

        var canopyGeo2 = new THREE.SphereGeometry(1.8, 6, 5);
        var canopy2 = new THREE.Mesh(canopyGeo2, makeMaterial(0x2e5518));
        canopy2.position.set(x + 1.0, y + 7.5, z - 0.5);
        addMesh(canopy2);
    }

    function buildOakTree(x, y, z) {
        var trunkMat = makeMaterial(0x6b4c2a);
        var canopyMat = makeMaterial(0x2a5c10);

        var trunkGeo = new THREE.CylinderGeometry(0.4, 0.55, 4.5, 7);
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 2.25, z);
        addMesh(trunk);

        var canopyGeo = new THREE.SphereGeometry(3.0, 8, 6);
        var canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.set(x, y + 7.0, z);
        addMesh(canopy);

        var canopyGeo2 = new THREE.SphereGeometry(2.0, 7, 5);
        var canopy2 = new THREE.Mesh(canopyGeo2, makeMaterial(0x1e4a0a));
        canopy2.position.set(x - 1.5, y + 7.5, z + 0.8);
        addMesh(canopy2);

        var canopyGeo3 = new THREE.SphereGeometry(1.6, 6, 5);
        var canopy3 = new THREE.Mesh(canopyGeo3, canopyMat);
        canopy3.position.set(x + 1.2, y + 8.0, z - 1.0);
        addMesh(canopy3);
    }

    function buildForestCanopy() {
        // 30 pollarded hornbeam trees
        var hornbeamPositions = [
            [0, 0, 0], [8, 0, 5], [15, 0, -3], [-6, 0, 8], [22, 0, 10],
            [-12, 0, 15], [30, 0, -8], [5, 0, 20], [-18, 0, -5], [35, 0, 15],
            [12, 0, -15], [-5, 0, -18], [40, 0, 5], [-22, 0, 20], [18, 0, 25],
            [50, 0, -12], [-30, 0, 8], [45, 0, 20], [-8, 0, 30], [28, 0, -20],
            [-35, 0, -10], [55, 0, 12], [-40, 0, 25], [38, 0, -18], [10, 0, 35],
            [-15, 0, -25], [62, 0, -5], [-45, 0, -18], [48, 0, 30], [-25, 0, 35]
        ];

        for (var i = 0; i < hornbeamPositions.length; i++) {
            var hp = hornbeamPositions[i];
            buildPollardedHornbeam(X_OFFSET + hp[0], hp[1], hp[2]);
        }

        // Mixed beech trees
        var beechPositions = [
            [10, 0, 12], [-8, 0, -10], [25, 0, 3], [42, 0, -6], [-20, 0, 28],
            [58, 0, 8], [-38, 0, -14], [32, 0, 22], [-2, 0, -22], [65, 0, 18]
        ];
        for (var b = 0; b < beechPositions.length; b++) {
            var bp = beechPositions[b];
            buildBeechTree(X_OFFSET + bp[0], bp[1], bp[2]);
        }

        // Oak trees
        var oakPositions = [
            [-14, 0, 5], [20, 0, -10], [48, 0, -20], [-28, 0, 12], [70, 0, 5],
            [15, 0, 40], [-50, 0, 20], [35, 0, -30], [-5, 0, 45], [60, 0, 28]
        ];
        for (var o = 0; o < oakPositions.length; o++) {
            var op = oakPositions[o];
            buildOakTree(X_OFFSET + op[0], op[1], op[2]);
        }
    }

    function buildHuntingLodge() {
        var whitePlasterMat = makeMaterial(0xf5f0e8);
        var darkTimberMat = makeMaterial(0x2a1a0a);
        var roofMat = makeMaterial(0x8b4513);
        var floorMat = makeMaterial(0x6b5a3a);

        var lx = X_OFFSET + 80;
        var lz = -40;
        var hillY = 3.0; // on a hill

        // Foundation / stone base
        var foundationGeo = new THREE.BoxGeometry(14, 1.0, 10);
        var foundationMat = makeMaterial(0x7a7060);
        var foundation = new THREE.Mesh(foundationGeo, foundationMat);
        foundation.position.set(lx, hillY + 0.5, lz);
        addMesh(foundation);

        // Ground floor (widest)
        var floor1Geo = new THREE.BoxGeometry(14, 3.5, 10);
        var floor1 = new THREE.Mesh(floor1Geo, whitePlasterMat);
        floor1.position.set(lx, hillY + 2.75, lz);
        addMesh(floor1);

        // Timber frame beams on ground floor - vertical
        var beamPositions = [-6, -3, 0, 3, 6];
        for (var t = 0; t < beamPositions.length; t++) {
            var beamGeo = new THREE.BoxGeometry(0.3, 3.5, 0.3);
            var beam = new THREE.Mesh(beamGeo, darkTimberMat);
            beam.position.set(lx + beamPositions[t], hillY + 2.75, lz + 5.0);
            addMesh(beam);
            var beam2 = new THREE.Mesh(beamGeo, darkTimberMat);
            beam2.position.set(lx + beamPositions[t], hillY + 2.75, lz - 5.0);
            addMesh(beam2);
        }

        // Second floor (jettied — slightly wider, overhangs)
        var floor2Geo = new THREE.BoxGeometry(15, 3.5, 11);
        var floor2 = new THREE.Mesh(floor2Geo, whitePlasterMat);
        floor2.position.set(lx, hillY + 6.25, lz);
        addMesh(floor2);

        // Timber frame on second floor
        for (var t2 = 0; t2 < beamPositions.length; t2++) {
            var beam2Geo = new THREE.BoxGeometry(0.3, 3.5, 0.3);
            var bm2 = new THREE.Mesh(beam2Geo, darkTimberMat);
            bm2.position.set(lx + beamPositions[t2], hillY + 6.25, lz + 5.5);
            addMesh(bm2);
            var bm2b = new THREE.Mesh(beam2Geo, darkTimberMat);
            bm2b.position.set(lx + beamPositions[t2], hillY + 6.25, lz - 5.5);
            addMesh(bm2b);
        }

        // Horizontal cross beams
        var hBeamGeo = new THREE.BoxGeometry(15, 0.3, 0.3);
        var hb1 = new THREE.Mesh(hBeamGeo, darkTimberMat);
        hb1.position.set(lx, hillY + 5.0, lz + 5.5);
        addMesh(hb1);
        var hb2 = new THREE.Mesh(hBeamGeo, darkTimberMat);
        hb2.position.set(lx, hillY + 5.0, lz - 5.5);
        addMesh(hb2);
        var hb3 = new THREE.Mesh(hBeamGeo, darkTimberMat);
        hb3.position.set(lx, hillY + 7.0, lz + 5.5);
        addMesh(hb3);
        var hb4 = new THREE.Mesh(hBeamGeo, darkTimberMat);
        hb4.position.set(lx, hillY + 7.0, lz - 5.5);
        addMesh(hb4);

        // Third floor — Great Standing open gallery (most jettied)
        var floor3Geo = new THREE.BoxGeometry(16, 3.5, 12);
        var floor3 = new THREE.Mesh(floor3Geo, whitePlasterMat);
        floor3.position.set(lx, hillY + 9.75, lz);
        addMesh(floor3);

        // Gallery railings on third floor
        var railingMat = darkTimberMat;
        var railGeo = new THREE.BoxGeometry(16, 0.2, 0.2);
        var rail1 = new THREE.Mesh(railGeo, railingMat);
        rail1.position.set(lx, hillY + 11.2, lz + 6.0);
        addMesh(rail1);
        var rail2 = new THREE.Mesh(railGeo, railingMat);
        rail2.position.set(lx, hillY + 11.2, lz - 6.0);
        addMesh(rail2);

        // Roof — steeply pitched
        var roofGeo = new THREE.ConeGeometry(11, 5, 4);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(lx, hillY + 14.5, lz);
        roof.rotation.y = Math.PI / 4;
        addMesh(roof);

        // Chimney stacks
        var chimneyGeo = new THREE.BoxGeometry(1.2, 3, 1.2);
        var chimney1 = new THREE.Mesh(chimneyGeo, makeMaterial(0x8b4a2a));
        chimney1.position.set(lx + 4, hillY + 17, lz + 1);
        addMesh(chimney1);
        var chimney2 = new THREE.Mesh(chimneyGeo, makeMaterial(0x8b4a2a));
        chimney2.position.set(lx - 4, hillY + 17, lz - 1);
        addMesh(chimney2);

        // Steps up to lodge
        for (var s = 0; s < 4; s++) {
            var stepGeo = new THREE.BoxGeometry(6, 0.3, 1.0);
            var step = new THREE.Mesh(stepGeo, makeMaterial(0x7a7060));
            step.position.set(lx, hillY - 0.2 + s * 0.3, lz + 5.5 + (3 - s) * 1.0);
            addMesh(step);
        }
    }

    function buildForestClearing(cx, cz) {
        var brackenMat = makeMaterial(0x8b6914);
        var soil = makeMaterial(0x5a4a2a);

        // Clearing ground
        var groundGeo = new THREE.BoxGeometry(18, 0.2, 18);
        var ground = new THREE.Mesh(groundGeo, makeMaterial(0x6b8a30));
        ground.position.set(cx, -0.1, cz);
        addMesh(ground);

        // Bracken patches — flat brown boxes
        var brackenOffsets = [
            [2, 0.15, 3], [-3, 0.15, -2], [5, 0.15, -4], [-5, 0.15, 4],
            [0, 0.15, 6], [4, 0.15, 1], [-2, 0.15, -6], [6, 0.15, 5]
        ];
        for (var br = 0; br < brackenOffsets.length; br++) {
            var bof = brackenOffsets[br];
            var brackenGeo = new THREE.BoxGeometry(2.0, 0.3, 1.5);
            var bracken = new THREE.Mesh(brackenGeo, brackenMat);
            bracken.position.set(cx + bof[0], bof[1], cz + bof[2]);
            addMesh(bracken);
        }

        // Wildflowers — tiny colored spheres
        var flowerColors = [0xffff55, 0xff88cc, 0xffffff, 0xff6633, 0xcc44ff];
        var flowerOffsets = [
            [1, 0.3, 2], [-2, 0.3, 1], [3, 0.3, -1], [-1, 0.3, 3],
            [2, 0.3, -3], [-3, 0.3, -1], [0, 0.3, -4], [4, 0.3, 2],
            [-4, 0.3, -3], [1, 0.3, -5], [5, 0.3, 0], [-5, 0.3, 1]
        ];
        for (var f = 0; f < flowerOffsets.length; f++) {
            var fof = flowerOffsets[f];
            var flowerGeo = new THREE.SphereGeometry(0.15, 4, 4);
            var flowerMat = makeMaterial(flowerColors[f % flowerColors.length]);
            var flower = new THREE.Mesh(flowerGeo, flowerMat);
            flower.position.set(cx + fof[0], fof[1], cz + fof[2]);
            addMesh(flower);
        }

        // Deer track — line of small flat boxes
        var trackMat = makeMaterial(0x8b7355);
        for (var d = 0; d < 6; d++) {
            var trackGeo = new THREE.BoxGeometry(0.4, 0.05, 0.6);
            var track = new THREE.Mesh(trackGeo, trackMat);
            track.position.set(cx - 4 + d * 1.4, 0.03, cz + d * 0.5 - 1.5);
            addMesh(track);
        }
    }

    function buildForestClearings() {
        buildForestClearing(X_OFFSET - 30, 50);
        buildForestClearing(X_OFFSET + 40, -60);
        buildForestClearing(X_OFFSET + 100, 20);
    }

    function buildWillow(x, y, z) {
        var trunkMat = makeMaterial(0x5a4a2a);
        var droopMat = makeMaterial(0x4a7a2a);

        var trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 5, 6);
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 2.5, z);
        addMesh(trunk);

        // Drooping canopy
        var canopyGeo = new THREE.SphereGeometry(3.5, 7, 5);
        var canopy = new THREE.Mesh(canopyGeo, droopMat);
        canopy.position.set(x, y + 5.5, z);
        canopy.scale.set(1.0, 0.7, 1.0);
        addMesh(canopy);

        // Drooping branches (thin elongated spheres hanging down)
        var droop1Geo = new THREE.SphereGeometry(0.3, 4, 6);
        for (var dr = 0; dr < 5; dr++) {
            var droop = new THREE.Mesh(droop1Geo, droopMat);
            var angle = dr * (Math.PI * 2 / 5);
            droop.position.set(x + Math.cos(angle) * 2.5, y + 3.0, z + Math.sin(angle) * 2.5);
            droop.scale.set(1.0, 3.5, 1.0);
            addMesh(droop);
        }
    }

    function buildPond(px, pz) {
        // Dark tea-colored water
        var pondGeo = new THREE.BoxGeometry(12, 0.2, 8);
        var pondMat = makeMaterial(0x3d2b1a, { transparent: true, opacity: 0.85 });
        var pond = new THREE.Mesh(pondGeo, pondMat);
        pond.position.set(px, -0.1, pz);
        addMesh(pond);

        // Water lilies — flat discs (cylinders)
        var lilyMat = makeMaterial(0x2a5a10);
        var lilyFlowerMat = makeMaterial(0xfff8dc);
        var lilyPositions = [
            [-3, 0, 1], [1, 0, -2], [3, 0, 2], [-1, 0, 3], [2, 0, -1]
        ];
        for (var l = 0; l < lilyPositions.length; l++) {
            var lp = lilyPositions[l];
            var lilyGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.08, 7);
            var lily = new THREE.Mesh(lilyGeo, lilyMat);
            lily.position.set(px + lp[0], 0.1, pz + lp[2]);
            addMesh(lily);

            // Small flower on some lilies
            if (l % 2 === 0) {
                var flowerGeo = new THREE.SphereGeometry(0.2, 5, 4);
                var flower = new THREE.Mesh(flowerGeo, lilyFlowerMat);
                flower.position.set(px + lp[0], 0.25, pz + lp[2]);
                addMesh(flower);
            }
        }

        // Overhanging willows around pond
        buildWillow(px - 7, 0, pz + 2);
        buildWillow(px + 7, 0, pz - 1);
        buildWillow(px + 2, 0, pz + 5);
    }

    function buildForestPonds() {
        buildPond(X_OFFSET - 50, 10);
        buildPond(X_OFFSET + 55, -50);
    }

    function buildFlintChurch() {
        var flintMat = makeMaterial(0x6a6a5a);
        var mortarMat = makeMaterial(0xc8c0b0);
        var roofMat = makeMaterial(0x4a4a3a);
        var doorMat = makeMaterial(0x3a2010);
        var glassMatl = makeMaterial(0x88aacc);

        var cx = X_OFFSET - 80;
        var cz = -70;

        // Churchyard clearing
        var yardGeo = new THREE.BoxGeometry(30, 0.15, 25);
        var yard = new THREE.Mesh(yardGeo, makeMaterial(0x5a7040));
        yard.position.set(cx, -0.07, cz);
        addMesh(yard);

        // Nave — main body
        var naveGeo = new THREE.BoxGeometry(14, 6, 8);
        var nave = new THREE.Mesh(naveGeo, flintMat);
        nave.position.set(cx, 3.0, cz);
        addMesh(nave);

        // Nave roof — pitched
        var naveRoofGeo = new THREE.CylinderGeometry(0.01, 7.5, 4, 4);
        var naveRoof = new THREE.Mesh(naveRoofGeo, roofMat);
        naveRoof.position.set(cx, 8.0, cz);
        naveRoof.rotation.y = Math.PI / 4;
        addMesh(naveRoof);

        // Tower — square flint tower
        var towerGeo = new THREE.BoxGeometry(5, 12, 5);
        var tower = new THREE.Mesh(towerGeo, flintMat);
        tower.position.set(cx - 9.5, 6.0, cz);
        addMesh(tower);

        // Tower battlements
        var battlementPositions = [
            [-1.5, 0, -1.5], [0, 0, -1.5], [1.5, 0, -1.5],
            [-1.5, 0, 1.5], [0, 0, 1.5], [1.5, 0, 1.5],
            [-1.5, 0, 0], [1.5, 0, 0]
        ];
        for (var bt = 0; bt < battlementPositions.length; bt++) {
            var bp2 = battlementPositions[bt];
            var bGeo = new THREE.BoxGeometry(0.8, 1.0, 0.8);
            var bm = new THREE.Mesh(bGeo, flintMat);
            bm.position.set(cx - 9.5 + bp2[0], 12.5, cz + bp2[2]);
            addMesh(bm);
        }

        // Chancel — eastern end
        var chanGeo = new THREE.BoxGeometry(7, 5, 7);
        var chancel = new THREE.Mesh(chanGeo, flintMat);
        chancel.position.set(cx + 10.5, 2.5, cz);
        addMesh(chancel);

        // Chancel roof
        var chanRoofGeo = new THREE.CylinderGeometry(0.01, 5.5, 3.5, 4);
        var chanRoof = new THREE.Mesh(chanRoofGeo, roofMat);
        chanRoof.position.set(cx + 10.5, 6.75, cz);
        chanRoof.rotation.y = Math.PI / 4;
        addMesh(chanRoof);

        // Door arch
        var doorGeo = new THREE.BoxGeometry(1.8, 3.5, 0.4);
        var door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(cx, 1.75, cz + 4.1);
        addMesh(door);

        // Windows — narrow lancet style
        var windowPositions = [
            [3, 3.5, 4.1], [-3, 3.5, 4.1], [5, 3.5, 4.1], [-5, 3.5, 4.1]
        ];
        for (var w = 0; w < windowPositions.length; w++) {
            var wp = windowPositions[w];
            var winGeo = new THREE.BoxGeometry(0.8, 1.8, 0.3);
            var win = new THREE.Mesh(winGeo, glassMatl);
            win.position.set(cx + wp[0], wp[1], cz + wp[2]);
            addMesh(win);
        }

        // Ancient yew tree in churchyard
        buildAncientYew(cx + 8, 0, cz + 9);

        // Gravestones
        var graveMat = makeMaterial(0x888888);
        var gravePositions = [
            [-5, 0, 8], [-3, 0, 10], [0, 0, 9], [3, 0, 8],
            [5, 0, 10], [-6, 0, -9], [-3, 0, -10], [2, 0, -9]
        ];
        for (var g = 0; g < gravePositions.length; g++) {
            var gp = gravePositions[g];
            var graveGeo = new THREE.BoxGeometry(0.6, 1.2, 0.15);
            var grave = new THREE.Mesh(graveGeo, graveMat);
            grave.position.set(cx + gp[0], 0.6, cz + gp[2]);
            addMesh(grave);
        }

        // Stone boundary wall
        var wallMat = makeMaterial(0x888888);
        var wallGeo1 = new THREE.BoxGeometry(30, 1.2, 0.5);
        var wall1 = new THREE.Mesh(wallGeo1, wallMat);
        wall1.position.set(cx, 0.6, cz + 12.5);
        addMesh(wall1);
        var wall2 = new THREE.Mesh(wallGeo1, wallMat);
        wall2.position.set(cx, 0.6, cz - 12.5);
        addMesh(wall2);
        var wallGeo2 = new THREE.BoxGeometry(0.5, 1.2, 25);
        var wall3 = new THREE.Mesh(wallGeo2, wallMat);
        wall3.position.set(cx + 15, 0.6, cz);
        addMesh(wall3);
        var wall4 = new THREE.Mesh(wallGeo2, wallMat);
        wall4.position.set(cx - 15, 0.6, cz);
        addMesh(wall4);
    }

    function buildAncientYew(x, y, z) {
        var trunkMat = makeMaterial(0x4a2a10);
        var canopyMat = makeMaterial(0x1a3a10);

        // Gnarled trunk
        var trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 4, 6);
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, y + 2.0, z);
        addMesh(trunk);

        // Dense dark canopy
        var mainCanopyGeo = new THREE.SphereGeometry(3.0, 7, 5);
        var mainCanopy = new THREE.Mesh(mainCanopyGeo, canopyMat);
        mainCanopy.position.set(x, y + 6.0, z);
        mainCanopy.scale.set(1.0, 0.9, 1.0);
        addMesh(mainCanopy);

        var sideCanopyGeo = new THREE.SphereGeometry(2.0, 6, 5);
        var sideCanopy1 = new THREE.Mesh(sideCanopyGeo, makeMaterial(0x0e2a08));
        sideCanopy1.position.set(x + 2.0, y + 5.0, z + 1.0);
        addMesh(sideCanopy1);

        var sideCanopy2 = new THREE.Mesh(sideCanopyGeo, canopyMat);
        sideCanopy2.position.set(x - 1.5, y + 5.5, z - 1.5);
        addMesh(sideCanopy2);
    }

    function build() {
        buildForestCanopy();
        buildHuntingLodge();
        buildForestClearings();
        buildForestPonds();
        buildFlintChurch();
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

    return { init: init, update: update, reset: reset };

}());
