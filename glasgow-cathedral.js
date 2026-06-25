window.GlasgowCathedral = (function() {
    'use strict';

    function createGlasgowCathedral(scene) {
        var group = new THREE.Group();
        var ox = 2080;
        var oz = 2200;

        // ── Glasgow Cathedral ──────────────────────────────────────────────
        // Main nave body
        var navedGeo = new THREE.BoxGeometry(30, 16, 14);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x5A5A6A });
        var nave = new THREE.Mesh(navedGeo, stoneMat);
        nave.position.set(ox, 8, oz);
        scene.add(nave);

        // Chancel extension (east end)
        var chancelGeo = new THREE.BoxGeometry(10, 13, 12);
        var chancel = new THREE.Mesh(chancelGeo, stoneMat);
        chancel.position.set(ox + 20, 6.5, oz);
        scene.add(chancel);

        // West front / entrance porch
        var porchGeo = new THREE.BoxGeometry(8, 10, 4);
        var porch = new THREE.Mesh(porchGeo, stoneMat);
        porch.position.set(ox - 18, 5, oz);
        scene.add(porch);

        // Twin towers — cylinders with cone spires
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x4A4A5A });

        var tower1Geo = new THREE.CylinderGeometry(3, 3, 22, 8);
        var tower1 = new THREE.Mesh(tower1Geo, towerMat);
        tower1.position.set(ox - 16, 11, oz - 5);
        scene.add(tower1);

        var tower2Geo = new THREE.CylinderGeometry(3, 3, 22, 8);
        var tower2 = new THREE.Mesh(tower2Geo, towerMat);
        tower2.position.set(ox - 16, 11, oz + 5);
        scene.add(tower2);

        // Tower cone spires
        var spireMat = new THREE.MeshLambertMaterial({ color: 0x3A3A4A });

        var spire1Geo = new THREE.ConeGeometry(3, 10, 8);
        var spire1 = new THREE.Mesh(spire1Geo, spireMat);
        spire1.position.set(ox - 16, 27, oz - 5);
        scene.add(spire1);

        var spire2Geo = new THREE.ConeGeometry(3, 10, 8);
        var spire2 = new THREE.Mesh(spire2Geo, spireMat);
        spire2.position.set(ox - 16, 27, oz + 5);
        scene.add(spire2);

        // Central tower / crossing tower
        var crossTowerGeo = new THREE.CylinderGeometry(2.5, 2.5, 18, 8);
        var crossTower = new THREE.Mesh(crossTowerGeo, towerMat);
        crossTower.position.set(ox, 9, oz);
        scene.add(crossTower);

        var crossSpireGeo = new THREE.ConeGeometry(2.5, 8, 8);
        var crossSpire = new THREE.Mesh(crossSpireGeo, spireMat);
        crossSpire.position.set(ox, 22, oz);
        scene.add(crossSpire);

        // Rose window — glass box insert on west front
        var glassMat = new THREE.MeshLambertMaterial({ color: 0x6688CC, transparent: true, opacity: 0.7 });
        var roseGeo = new THREE.BoxGeometry(4, 4, 1);
        var roseWindow = new THREE.Mesh(roseGeo, glassMat);
        roseWindow.position.set(ox - 15.5, 9, oz);
        scene.add(roseWindow);

        // Side windows (narrow lancet inserts)
        var lancetMat = new THREE.MeshLambertMaterial({ color: 0x4466AA, transparent: true, opacity: 0.6 });
        var lancetPositions = [
            [ox - 8, 8, oz - 7.1],
            [ox, 8, oz - 7.1],
            [ox + 8, 8, oz - 7.1],
            [ox - 8, 8, oz + 7.1],
            [ox, 8, oz + 7.1],
            [ox + 8, 8, oz + 7.1]
        ];
        for (var wi = 0; wi < lancetPositions.length; wi++) {
            var lancetGeo = new THREE.BoxGeometry(1.5, 4, 0.5);
            var lancet = new THREE.Mesh(lancetGeo, lancetMat);
            lancet.position.set(lancetPositions[wi][0], lancetPositions[wi][1], lancetPositions[wi][2]);
            scene.add(lancet);
        }

        // Flying buttresses — box supports on north and south sides
        var buttressMat = new THREE.MeshLambertMaterial({ color: 0x606070 });
        var buttressXPositions = [ ox - 10, ox - 2, ox + 6 ];
        for (var bi = 0; bi < buttressXPositions.length; bi++) {
            // South buttresses
            var bsGeo = new THREE.BoxGeometry(1.5, 6, 3);
            var bs = new THREE.Mesh(bsGeo, buttressMat);
            bs.position.set(buttressXPositions[bi], 6, oz + 9.5);
            scene.add(bs);

            // North buttresses
            var bnGeo = new THREE.BoxGeometry(1.5, 6, 3);
            var bn = new THREE.Mesh(bnGeo, buttressMat);
            bn.position.set(buttressXPositions[bi], 6, oz - 9.5);
            scene.add(bn);
        }

        // Crypt level step-down
        var cryptGeo = new THREE.BoxGeometry(28, 2, 12);
        var cryptMat = new THREE.MeshLambertMaterial({ color: 0x4A4A58 });
        var crypt = new THREE.Mesh(cryptGeo, cryptMat);
        crypt.position.set(ox, -1, oz);
        scene.add(crypt);

        // ── Necropolis ─────────────────────────────────────────────────────
        // The hill behind (north-east of) the cathedral
        var hillMat = new THREE.MeshLambertMaterial({ color: 0x3A5A3A });

        // Hill represented as stacked boxes to suggest slope
        var hillLevels = [
            { w: 60, h: 2, d: 50, x: ox + 40, y: 1, z: oz - 30 },
            { w: 50, h: 3, d: 40, x: ox + 42, y: 4, z: oz - 32 },
            { w: 38, h: 3, d: 30, x: ox + 44, y: 7, z: oz - 34 },
            { w: 26, h: 3, d: 22, x: ox + 46, y: 10, z: oz - 36 },
            { w: 16, h: 3, d: 14, x: ox + 48, y: 13, z: oz - 38 }
        ];
        for (var hi = 0; hi < hillLevels.length; hi++) {
            var hl = hillLevels[hi];
            var hGeo = new THREE.BoxGeometry(hl.w, hl.h, hl.d);
            var hMesh = new THREE.Mesh(hGeo, hillMat);
            hMesh.position.set(hl.x, hl.y, hl.z);
            scene.add(hMesh);
        }

        // 20 obelisk monuments (tall thin boxes 1×6×1, 0x8A8A8A)
        var obeliskMat = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });
        var obeliskData = [
            [ox + 30, oz - 20],
            [ox + 34, oz - 24],
            [ox + 38, oz - 18],
            [ox + 42, oz - 28],
            [ox + 46, oz - 22],
            [ox + 50, oz - 30],
            [ox + 54, oz - 26],
            [ox + 32, oz - 34],
            [ox + 36, oz - 38],
            [ox + 40, oz - 32],
            [ox + 44, oz - 36],
            [ox + 48, oz - 40],
            [ox + 52, oz - 34],
            [ox + 56, oz - 38],
            [ox + 36, oz - 42],
            [ox + 40, oz - 46],
            [ox + 44, oz - 44],
            [ox + 48, oz - 48],
            [ox + 52, oz - 42],
            [ox + 56, oz - 46]
        ];
        for (var oi = 0; oi < obeliskData.length; oi++) {
            var oGeo = new THREE.BoxGeometry(1, 6, 1);
            var oMesh = new THREE.Mesh(oGeo, obeliskMat);
            var hillY = 3 + Math.floor(oi / 4) * 1.5;
            oMesh.position.set(obeliskData[oi][0], hillY + 3, obeliskData[oi][1]);
            scene.add(oMesh);

            // Tiny cone top for obelisk tip
            var oConeGeo = new THREE.ConeGeometry(0.6, 1.5, 4);
            var oCone = new THREE.Mesh(oConeGeo, obeliskMat);
            oCone.position.set(obeliskData[oi][0], hillY + 6.75, obeliskData[oi][1]);
            scene.add(oCone);
        }

        // 8 domed mausolea (box + sphere dome)
        var mausoleaBaseMat = new THREE.MeshLambertMaterial({ color: 0x9A9AA0 });
        var mausoleaDomeMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var mausoleaData = [
            [ox + 33, oz - 25],
            [ox + 43, oz - 33],
            [ox + 53, oz - 27],
            [ox + 37, oz - 41],
            [ox + 47, oz - 45],
            [ox + 57, oz - 37],
            [ox + 41, oz - 49],
            [ox + 51, oz - 53]
        ];
        for (var mi = 0; mi < mausoleaData.length; mi++) {
            var mBaseGeo = new THREE.BoxGeometry(4, 3, 4);
            var mBase = new THREE.Mesh(mBaseGeo, mausoleaBaseMat);
            var mHillY = 3 + Math.floor(mi / 3) * 2;
            mBase.position.set(mausoleaData[mi][0], mHillY + 1.5, mausoleaData[mi][1]);
            scene.add(mBase);

            var mDomeGeo = new THREE.SphereGeometry(2.2, 8, 6);
            var mDome = new THREE.Mesh(mDomeGeo, mausoleaDomeMat);
            mDome.position.set(mausoleaData[mi][0], mHillY + 3 + 2.2, mausoleaData[mi][1]);
            scene.add(mDome);
        }

        // ── John Knox Statue ───────────────────────────────────────────────
        // Tall cylinder column at Necropolis summit
        var knoxColMat = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });
        var knoxColGeo = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
        var knoxCol = new THREE.Mesh(knoxColGeo, knoxColMat);
        knoxCol.position.set(ox + 50, 26, oz - 42);
        scene.add(knoxCol);

        // Column base
        var knoxBaseGeo = new THREE.BoxGeometry(3, 2, 3);
        var knoxBase = new THREE.Mesh(knoxBaseGeo, knoxColMat);
        knoxBase.position.set(ox + 50, 17, oz - 42);
        scene.add(knoxBase);

        // Knox figure box on top
        var knoxFigMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var knoxFigGeo = new THREE.BoxGeometry(1.2, 2.5, 0.8);
        var knoxFig = new THREE.Mesh(knoxFigGeo, knoxFigMat);
        knoxFig.position.set(ox + 50, 37.25, oz - 42);
        scene.add(knoxFig);

        // Knox head sphere
        var knoxHeadGeo = new THREE.SphereGeometry(0.6, 6, 6);
        var knoxHead = new THREE.Mesh(knoxHeadGeo, knoxFigMat);
        knoxHead.position.set(ox + 50, 39.1, oz - 42);
        scene.add(knoxHead);

        // ── Provand's Lordship ─────────────────────────────────────────────
        // Oldest house in Glasgow — cream/sandstone box
        var provandMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
        var provandGeo = new THREE.BoxGeometry(8, 6, 7);
        var provand = new THREE.Mesh(provandGeo, provandMat);
        provand.position.set(ox - 20, 3, oz + 25);
        scene.add(provand);

        // Provand's roof
        var provandRoofMat = new THREE.MeshLambertMaterial({ color: 0x5A3A2A });
        var provandRoofGeo = new THREE.BoxGeometry(9, 1.5, 8);
        var provandRoof = new THREE.Mesh(provandRoofGeo, provandRoofMat);
        provandRoof.position.set(ox - 20, 6.75, oz + 25);
        scene.add(provandRoof);

        // Timber cross-framing detail boxes (dark beams on facade)
        var timberMat = new THREE.MeshLambertMaterial({ color: 0x3A2010 });
        var timberData = [
            // horizontal beams on south face
            { w: 8.2, h: 0.3, d: 0.3, x: ox - 20, y: 2, z: oz + 21.65 },
            { w: 8.2, h: 0.3, d: 0.3, x: ox - 20, y: 4, z: oz + 21.65 },
            // vertical beams on south face
            { w: 0.3, h: 6.2, d: 0.3, x: ox - 23, y: 3, z: oz + 21.65 },
            { w: 0.3, h: 6.2, d: 0.3, x: ox - 17, y: 3, z: oz + 21.65 },
            // diagonal cross brace (approximated as angled box)
            { w: 0.3, h: 4, d: 0.3, x: ox - 21.5, y: 3, z: oz + 21.65 }
        ];
        for (var ti = 0; ti < timberData.length; ti++) {
            var td = timberData[ti];
            var tGeo = new THREE.BoxGeometry(td.w, td.h, td.d);
            var tMesh = new THREE.Mesh(tGeo, timberMat);
            tMesh.position.set(td.x, td.y, td.z);
            scene.add(tMesh);
        }

        // ── People's Palace ────────────────────────────────────────────────
        // Red sandstone Victorian museum
        var palaceMat = new THREE.MeshLambertMaterial({ color: 0xB05050 });
        var palaceGeo = new THREE.BoxGeometry(20, 10, 12);
        var palace = new THREE.Mesh(palaceGeo, palaceMat);
        palace.position.set(ox - 50, 5, oz + 30);
        scene.add(palace);

        // Palace roof
        var palaceRoofMat = new THREE.MeshLambertMaterial({ color: 0x804040 });
        var palaceRoofGeo = new THREE.BoxGeometry(21, 2, 13);
        var palaceRoof = new THREE.Mesh(palaceRoofGeo, palaceRoofMat);
        palaceRoof.position.set(ox - 50, 11, oz + 30);
        scene.add(palaceRoof);

        // Corner turrets on palace
        var turretMat = new THREE.MeshLambertMaterial({ color: 0xA04848 });
        var turretPositions = [
            [ox - 61, oz + 24],
            [ox - 61, oz + 36],
            [ox - 39, oz + 24],
            [ox - 39, oz + 36]
        ];
        for (var tri = 0; tri < turretPositions.length; tri++) {
            var trGeo = new THREE.CylinderGeometry(1.5, 1.5, 13, 8);
            var trMesh = new THREE.Mesh(trGeo, turretMat);
            trMesh.position.set(turretPositions[tri][0], 6.5, turretPositions[tri][1]);
            scene.add(trMesh);

            var trConeGeo = new THREE.ConeGeometry(1.5, 4, 8);
            var trCone = new THREE.Mesh(trConeGeo, spireMat);
            trCone.position.set(turretPositions[tri][0], 15, turretPositions[tri][1]);
            scene.add(trCone);
        }

        // Winter garden — glass dome sphere on rear of palace
        var winterDomeMat = new THREE.MeshLambertMaterial({ color: 0x88BBDD, transparent: true, opacity: 0.6 });
        var winterDomeGeo = new THREE.SphereGeometry(8, 10, 8);
        var winterDome = new THREE.Mesh(winterDomeGeo, winterDomeMat);
        winterDome.position.set(ox - 50, 8, oz + 46);
        scene.add(winterDome);

        // Winter garden base ring
        var winterBaseMat = new THREE.MeshLambertMaterial({ color: 0x8A6060 });
        var winterBaseGeo = new THREE.CylinderGeometry(8.2, 8.2, 3, 12);
        var winterBase = new THREE.Mesh(winterBaseGeo, winterBaseMat);
        winterBase.position.set(ox - 50, 1.5, oz + 46);
        scene.add(winterBase);

        // Palace entrance steps
        var stepsMat = new THREE.MeshLambertMaterial({ color: 0x909090 });
        var stepsGeo = new THREE.BoxGeometry(8, 1, 3);
        var steps = new THREE.Mesh(stepsGeo, stepsMat);
        steps.position.set(ox - 50, 0.5, oz + 23.5);
        scene.add(steps);

        // ── Road / Bridge of Sighs connecting elements ─────────────────────
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var bridgeGeo = new THREE.BoxGeometry(6, 1, 15);
        var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(ox + 10, 1, oz + 8);
        scene.add(bridge);

        // Bridge arch supports
        var archGeo1 = new THREE.CylinderGeometry(0.5, 0.5, 3, 6);
        var arch1 = new THREE.Mesh(archGeo1, bridgeMat);
        arch1.position.set(ox + 10, 1.5, oz + 10);
        scene.add(arch1);

        var archGeo2 = new THREE.CylinderGeometry(0.5, 0.5, 3, 6);
        var arch2 = new THREE.Mesh(archGeo2, bridgeMat);
        arch2.position.set(ox + 10, 1.5, oz + 6);
        scene.add(arch2);

        // ── Ground plane for precinct ──────────────────────────────────────
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x4A5A3A });
        var groundGeo = new THREE.BoxGeometry(160, 0.5, 120);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(ox + 10, -0.25, oz + 5);
        scene.add(ground);

        // Cobblestone precinct path
        var cobbleMat = new THREE.MeshLambertMaterial({ color: 0x7A7060 });
        var cobbleGeo = new THREE.BoxGeometry(12, 0.3, 40);
        var cobble = new THREE.Mesh(cobbleGeo, cobbleMat);
        cobble.position.set(ox - 5, 0.15, oz + 15);
        scene.add(cobble);

        return group;
    }

    return {
        create: createGlasgowCathedral
    };

}());
