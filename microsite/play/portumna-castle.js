window.PortumnaCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 18840;
    var OY = 0;
    var OZ = 0;

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
        buildGround();
        buildPortumnaCastle();
        buildWalledGarden();
        buildDominicanFriary();
        buildPortumnaForestPark();
        buildLoughDerg();
        buildPortumnaBridge();
        buildPortumnaTown();
        buildCruisers();
        buildShannonCallows();
        buildTerryglass();
        buildDromineerCastle();
    }

    function buildGround() {
        // Ground base — large flat terrain using stacked box slabs
        // Main ground plane as a very flat box
        var groundGeo = new THREE.BoxGeometry(3000, 2, 3000);
        makeMesh(groundGeo, 0x4A7C3F, OX, OY - 1, OZ);

        // Shannon river/estuary channel floor
        var riverBedGeo = new THREE.BoxGeometry(80, 1, 1200);
        makeMesh(riverBedGeo, 0x005577, OX - 200, OY - 1.5, OZ);
    }

    function buildPortumnaCastle() {
        // Main castle body — wide 3-storey Jacobean mansion
        var bodyGeo = new THREE.BoxGeometry(60, 24, 30);
        makeMesh(bodyGeo, 0x8B7355, OX, OY + 12, OZ);

        // Second storey string course / belt course
        var stringGeo = new THREE.BoxGeometry(62, 1.5, 32);
        makeMesh(stringGeo, 0x7A6245, OX, OY + 16, OZ);

        // Third storey parapet
        var parapetGeo = new THREE.BoxGeometry(62, 3, 32);
        makeMesh(parapetGeo, 0x7A6245, OX, OY + 25, OZ);

        // Crenellations along parapet front — 8 merlons
        for (var cm = 0; cm < 8; cm++) {
            var merlonGeo = new THREE.BoxGeometry(5, 3, 2);
            makeMesh(merlonGeo, 0x8B7355, OX - 26 + cm * 7.5, OY + 28, OZ - 17);
        }
        // Crenellations along parapet back
        for (var cmb = 0; cmb < 8; cmb++) {
            var merlonBackGeo = new THREE.BoxGeometry(5, 3, 2);
            makeMesh(merlonBackGeo, 0x8B7355, OX - 26 + cmb * 7.5, OY + 28, OZ + 17);
        }

        // Corner turrets — 4 square towers (BoxGeometry)
        var turretPositions = [
            [OX - 35, OZ - 18],
            [OX + 35, OZ - 18],
            [OX - 35, OZ + 18],
            [OX + 35, OZ + 18]
        ];
        for (var t = 0; t < turretPositions.length; t++) {
            var tx = turretPositions[t][0];
            var tz = turretPositions[t][1];
            // Turret body
            var turretGeo = new THREE.BoxGeometry(14, 30, 14);
            makeMesh(turretGeo, 0x8B7355, tx, OY + 15, tz);
            // Turret parapet
            var tParapetGeo = new THREE.BoxGeometry(15, 3, 15);
            makeMesh(tParapetGeo, 0x7A6245, tx, OY + 31, tz);
            // Turret conical roof
            var turretRoofGeo = new THREE.ConeGeometry(8, 10, 4);
            makeMesh(turretRoofGeo, 0x5C4827, tx, OY + 38, tz, 0, Math.PI / 4, 0);
            // Arrow slit windows (thin box cuts shown as dark boxes)
            var slitGeo = new THREE.BoxGeometry(1.5, 5, 0.5);
            makeMesh(slitGeo, 0x222222, tx, OY + 20, tz - 7.1);
            makeMesh(slitGeo, 0x222222, tx, OY + 10, tz - 7.1);
        }

        // Entrance porch / gatehouse on south face
        var porchGeo = new THREE.BoxGeometry(12, 18, 8);
        makeMesh(porchGeo, 0x9B8365, OX, OY + 9, OZ - 19);
        // Porch arch (represented as dark box doorway)
        var archGeo = new THREE.BoxGeometry(4, 8, 1);
        makeMesh(archGeo, 0x222222, OX, OY + 5, OZ - 23.1);
        // Porch pediment
        var pedGeo = new THREE.ConeGeometry(7, 4, 3);
        makeMesh(pedGeo, 0x8B7355, OX, OY + 20, OZ - 19, 0, Math.PI / 6, 0);

        // Windows on main body front face — 3 rows of 5
        for (var wr = 0; wr < 3; wr++) {
            for (var wc = 0; wc < 5; wc++) {
                var winGeo = new THREE.BoxGeometry(3, 4, 0.5);
                makeMesh(winGeo, 0x1A1A2E, OX - 18 + wc * 9, OY + 6 + wr * 8, OZ - 15.3);
            }
        }

        // Chimneys on roof
        for (var ch = 0; ch < 4; ch++) {
            var chimneyGeo = new THREE.BoxGeometry(3, 6, 3);
            makeMesh(chimneyGeo, 0x6B5B45, OX - 20 + ch * 14, OY + 30, OZ - 5);
            var chimPotGeo = new THREE.CylinderGeometry(0.8, 1, 3, 6);
            makeMesh(chimPotGeo, 0x5A4A35, OX - 20 + ch * 14, OY + 35, OZ - 5);
        }
    }

    function buildWalledGarden() {
        // Ornate geometric walled garden in front of castle
        // Perimeter walls
        var wallNGeo = new THREE.BoxGeometry(100, 5, 2);
        makeMesh(wallNGeo, 0x9B8365, OX, OY + 2.5, OZ - 70);
        var wallSGeo = new THREE.BoxGeometry(100, 5, 2);
        makeMesh(wallSGeo, 0x9B8365, OX, OY + 2.5, OZ - 30);
        var wallEGeo = new THREE.BoxGeometry(2, 5, 40);
        makeMesh(wallEGeo, 0x9B8365, OX + 50, OY + 2.5, OZ - 50);
        var wallWGeo = new THREE.BoxGeometry(2, 5, 40);
        makeMesh(wallWGeo, 0x9B8365, OX - 50, OY + 2.5, OZ - 50);

        // Internal geometric partitions — cross pattern
        var partitionHGeo = new THREE.BoxGeometry(96, 3, 1.5);
        makeMesh(partitionHGeo, 0x8B7355, OX, OY + 1.5, OZ - 50);
        var partitionVGeo = new THREE.BoxGeometry(1.5, 3, 36);
        makeMesh(partitionVGeo, 0x8B7355, OX, OY + 1.5, OZ - 50);

        // Garden hedges (dark green boxes in quadrants)
        var hedgePositions = [
            [OX - 25, OZ - 60],
            [OX + 25, OZ - 60],
            [OX - 25, OZ - 40],
            [OX + 25, OZ - 40]
        ];
        for (var h = 0; h < hedgePositions.length; h++) {
            var hedgeGeo = new THREE.BoxGeometry(18, 4, 8);
            makeMesh(hedgeGeo, 0x1A5C1A, hedgePositions[h][0], OY + 2, hedgePositions[h][1]);
        }

        // Garden gate pillars
        var pillarGeo = new THREE.BoxGeometry(3, 8, 3);
        makeMesh(pillarGeo, 0xB8A882, OX - 6, OY + 4, OZ - 30);
        makeMesh(pillarGeo, 0xB8A882, OX + 6, OY + 4, OZ - 30);

        // Pillar caps
        var capGeo = new THREE.ConeGeometry(2.2, 3, 4);
        makeMesh(capGeo, 0xA09070, OX - 6, OY + 10, OZ - 30);
        makeMesh(capGeo, 0xA09070, OX + 6, OY + 10, OZ - 30);
    }

    function buildDominicanFriary() {
        // Dominican Friary ruins — Gothic remains northeast of castle
        var fX = OX + 120;
        var fZ = OZ - 30;

        // Nave north wall
        var naveNGeo = new THREE.BoxGeometry(50, 12, 2);
        makeMesh(naveNGeo, 0x808080, fX, OY + 6, fZ - 20);
        // Nave south wall (partial ruin — shorter)
        var naveSGeo = new THREE.BoxGeometry(50, 7, 2);
        makeMesh(naveSGeo, 0x777777, fX, OY + 3.5, fZ + 20);
        // East gable wall with window tracery
        var gableGeo = new THREE.BoxGeometry(2, 14, 42);
        makeMesh(gableGeo, 0x808080, fX + 26, OY + 7, fZ);
        // Gothic window tracery (thin bar cross)
        var winBarHGeo = new THREE.BoxGeometry(0.5, 1, 8);
        makeMesh(winBarHGeo, 0x555555, fX + 27, OY + 10, fZ);
        var winBarVGeo = new THREE.BoxGeometry(0.5, 6, 1);
        makeMesh(winBarVGeo, 0x555555, fX + 27, OY + 10, fZ);
        // West wall fragment
        var westFragGeo = new THREE.BoxGeometry(2, 10, 20);
        makeMesh(westFragGeo, 0x808080, fX - 26, OY + 5, fZ - 5);
        // Tower stump
        var towerStumpGeo = new THREE.BoxGeometry(8, 18, 8);
        makeMesh(towerStumpGeo, 0x787878, fX - 18, OY + 9, fZ - 25);
        // Chancel arch fragment
        var archFragGeo = new THREE.BoxGeometry(2, 10, 2);
        makeMesh(archFragGeo, 0x808080, fX + 5, OY + 5, fZ - 10);
        makeMesh(archFragGeo, 0x808080, fX - 5, OY + 5, fZ - 10);
        // Horizontal arch lintel
        var lintGeo = new THREE.BoxGeometry(12, 2, 2);
        makeMesh(lintGeo, 0x808080, fX, OY + 11, fZ - 10);
    }

    function buildPortumnaForestPark() {
        // Dense forest to the west and southwest
        var treeData = [
            [-180, -120], [-160, -80], [-200, -60], [-220, -140],
            [-240, -100], [-180, -40], [-200, 20], [-160, 40],
            [-240, 60], [-220, 0], [-260, -50], [-300, -80],
            [-280, -120], [-320, -40], [-300, 20], [-260, 80],
            [-280, 100], [-240, 120], [-200, 100], [-220, 60],
            [-180, 80], [-160, 120], [-140, 60], [-140, 100],
            [-320, -120], [-340, -60], [-360, 0], [-340, 60]
        ];
        for (var tr = 0; tr < treeData.length; tr++) {
            var treeX = OX + treeData[tr][0];
            var treeZ = OZ + treeData[tr][1];
            var trunkH = 6 + Math.floor(tr % 4) * 2;
            var trunkGeo = new THREE.CylinderGeometry(1, 1.5, trunkH, 5);
            makeMesh(trunkGeo, 0x4A2F1A, treeX, OY + trunkH / 2, treeZ);
            var canopyGeo = new THREE.ConeGeometry(5 + (tr % 3), 10 + (tr % 4) * 2, 6);
            makeMesh(canopyGeo, 0x228B22, treeX, OY + trunkH + 6, treeZ);
            // Some trees with second canopy tier
            if (tr % 3 === 0) {
                var canopy2Geo = new THREE.ConeGeometry(3.5, 7, 6);
                makeMesh(canopy2Geo, 0x1E7B1E, treeX, OY + trunkH + 11, treeZ);
            }
        }

        // Forest park visitor centre — small building
        var vcGeo = new THREE.BoxGeometry(15, 6, 10);
        makeMesh(vcGeo, 0xD2B48C, OX - 130, OY + 3, OZ - 60);
        var vcRoofGeo = new THREE.BoxGeometry(16, 2, 11);
        makeMesh(vcRoofGeo, 0x8B4513, OX - 130, OY + 7, OZ - 60);

        // Forest trail — line of low dark ground markers
        for (var ft = 0; ft < 6; ft++) {
            var trailGeo = new THREE.BoxGeometry(6, 0.3, 2);
            makeMesh(trailGeo, 0x5C4A2A, OX - 90 - ft * 20, OY + 0.2, OZ - 50);
        }
    }

    function buildLoughDerg() {
        // Lough Derg — massive lake to the south and southeast
        // Main lake body (several large slabs to give expanse)
        var lakeMain = new THREE.BoxGeometry(800, 1, 1200);
        makeMesh(lakeMain, 0x006994, OX + 400, OY - 0.5, OZ + 300);

        // Lake surface shimmer tiles (lighter panels)
        var shimmer1 = new THREE.BoxGeometry(200, 0.3, 300);
        makeMesh(shimmer1, 0x1A7FAD, OX + 300, OY + 0.2, OZ + 100);
        var shimmer2 = new THREE.BoxGeometry(150, 0.3, 250);
        makeMesh(shimmer2, 0x0080AA, OX + 500, OY + 0.2, OZ + 400);
        var shimmer3 = new THREE.BoxGeometry(300, 0.3, 200);
        makeMesh(shimmer3, 0x1A8FBD, OX + 350, OY + 0.2, OZ + 650);

        // Shoreline banks — low earth strips
        var shoreWGeo = new THREE.BoxGeometry(20, 2, 1200);
        makeMesh(shoreWGeo, 0x8B7355, OX + 5, OY + 0.5, OZ + 300);
        var shoreNGeo = new THREE.BoxGeometry(820, 2, 20);
        makeMesh(shoreNGeo, 0x8B7355, OX + 400, OY + 0.5, OZ - 290);

        // Rocky outcrops in lake
        var rock1Geo = new THREE.BoxGeometry(8, 3, 6);
        makeMesh(rock1Geo, 0x6B6B6B, OX + 200, OY + 1, OZ + 150);
        var rock2Geo = new THREE.BoxGeometry(5, 2, 4);
        makeMesh(rock2Geo, 0x727272, OX + 350, OY + 1, OZ + 350);
        var rock3Geo = new THREE.BoxGeometry(10, 4, 7);
        makeMesh(rock3Geo, 0x696969, OX + 600, OY + 1, OZ + 550);
    }

    function buildPortumnaBridge() {
        // Long road bridge across Shannon at mouth of Lough Derg
        var bX = OX - 60;
        var bZ = OZ + 80;

        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(240, 3, 14);
        makeMesh(deckGeo, 0x808080, bX, OY + 5, bZ);

        // Bridge piers — 8 columns
        for (var bp = 0; bp < 8; bp++) {
            var pierGeo = new THREE.BoxGeometry(6, 12, 8);
            makeMesh(pierGeo, 0x6E6E6E, bX - 105 + bp * 30, OY + 0, bZ);
        }

        // Bridge railings north side
        var railNGeo = new THREE.BoxGeometry(240, 2, 1);
        makeMesh(railNGeo, 0x999999, bX, OY + 7.5, bZ - 7.5);
        // Bridge railings south side
        var railSGeo = new THREE.BoxGeometry(240, 2, 1);
        makeMesh(railSGeo, 0x999999, bX, OY + 7.5, bZ + 7.5);

        // Road approach ramps
        var rampEGeo = new THREE.BoxGeometry(60, 1, 14);
        makeMesh(rampEGeo, 0x777777, bX + 150, OY + 3, bZ);
        var rampWGeo = new THREE.BoxGeometry(60, 1, 14);
        makeMesh(rampWGeo, 0x777777, bX - 150, OY + 3, bZ);

        // Approach road markings (white lines)
        var markGeo = new THREE.BoxGeometry(3, 0.2, 1);
        for (var rm = 0; rm < 6; rm++) {
            makeMesh(markGeo, 0xFFFFFF, bX + 120 + rm * 8, OY + 4, bZ);
        }
    }

    function buildPortumnaTown() {
        // Portumna town — small market town buildings east of castle
        var townX = OX + 80;
        var townZ = OZ - 60;

        // Market square buildings — row of townhouses
        var houseColors = [0xCD5C5C, 0xC04040, 0xB83030, 0xD06060, 0xBB4444];
        for (var hb = 0; hb < 5; hb++) {
            var houseGeo = new THREE.BoxGeometry(10, 12, 8);
            makeMesh(houseGeo, houseColors[hb], townX + hb * 12, OY + 6, townZ);
            var houseRoofGeo = new THREE.BoxGeometry(11, 3, 9);
            makeMesh(houseRoofGeo, 0x8B3A3A, townX + hb * 12, OY + 13.5, townZ);
        }

        // Church with spire
        var churchGeo = new THREE.BoxGeometry(14, 14, 24);
        makeMesh(churchGeo, 0xB0B0B0, townX + 30, OY + 7, townZ - 30);
        var churchTowerGeo = new THREE.BoxGeometry(8, 22, 8);
        makeMesh(churchTowerGeo, 0xA0A0A0, townX + 33, OY + 11, townZ - 40);
        var spireGeo = new THREE.ConeGeometry(3, 14, 4);
        makeMesh(spireGeo, 0x909090, townX + 33, OY + 29, townZ - 40);

        // Pier / harbour quay walls
        var quayNGeo = new THREE.BoxGeometry(60, 4, 4);
        makeMesh(quayNGeo, 0x696969, OX + 20, OY + 2, OZ + 40);
        var quayEGeo = new THREE.BoxGeometry(4, 4, 30);
        makeMesh(quayEGeo, 0x696969, OX + 48, OY + 2, OZ + 55);
        var quayWGeo = new THREE.BoxGeometry(4, 4, 30);
        makeMesh(quayWGeo, 0x696969, OX - 8, OY + 2, OZ + 55);

        // Harbour master building
        var harborBuildGeo = new THREE.BoxGeometry(8, 7, 8);
        makeMesh(harborBuildGeo, 0xCD5C5C, OX + 52, OY + 3.5, OZ + 42);
        var harborRoofGeo = new THREE.ConeGeometry(5.5, 5, 4);
        makeMesh(harborRoofGeo, 0x8B3A3A, OX + 52, OY + 9.5, OZ + 42, 0, Math.PI / 4, 0);

        // Lighthouse / navigation marker
        var lighthouseGeo = new THREE.CylinderGeometry(1.5, 2, 12, 8);
        makeMesh(lighthouseGeo, 0xFFFFFF, OX + 55, OY + 6, OZ + 70);
        var lightCapGeo = new THREE.ConeGeometry(2.5, 4, 8);
        makeMesh(lightCapGeo, 0xCC2222, OX + 55, OY + 14, OZ + 70);

        // Road through town
        var roadGeo = new THREE.BoxGeometry(8, 0.3, 120);
        makeMesh(roadGeo, 0x444444, townX, OY + 0.2, OZ);
    }

    function buildCruisers() {
        // Several white river cruiser boats on Lough Derg
        var cruiserData = [
            [OX + 100, OZ + 120, 0],
            [OX + 200, OZ + 200, 0.3],
            [OX + 350, OZ + 150, -0.2],
            [OX + 450, OZ + 300, 0.5],
            [OX + 150, OZ + 350, -0.4]
        ];
        for (var cr = 0; cr < cruiserData.length; cr++) {
            var crX = cruiserData[cr][0];
            var crZ = cruiserData[cr][1];
            var crRY = cruiserData[cr][2];
            // Hull
            var hullGeo = new THREE.BoxGeometry(14, 3, 5);
            makeMesh(hullGeo, 0xFFFFF0, crX, OY + 2, crZ, 0, crRY, 0);
            // Cabin
            var cabinGeo = new THREE.BoxGeometry(8, 3, 4);
            makeMesh(cabinGeo, 0xFFFFF0, crX + 1, OY + 5, crZ, 0, crRY, 0);
            // Cabin roof
            var cRoofGeo = new THREE.BoxGeometry(9, 1, 4.5);
            makeMesh(cRoofGeo, 0xDDDDCC, crX + 1, OY + 6.8, crZ, 0, crRY, 0);
            // Mast
            var mastGeo = new THREE.CylinderGeometry(0.2, 0.2, 6, 4);
            makeMesh(mastGeo, 0xCCCCCC, crX + 3, OY + 10, crZ);
        }
    }

    function buildShannonCallows() {
        // Shannon Callows — flat floodplain meadows north of town
        var calX = OX - 100;
        var calZ = OZ - 200;

        // Flat meadow ground slabs
        var meadow1Geo = new THREE.BoxGeometry(300, 0.5, 150);
        makeMesh(meadow1Geo, 0x3CB371, calX, OY + 0.3, calZ);
        var meadow2Geo = new THREE.BoxGeometry(200, 0.5, 100);
        makeMesh(meadow2Geo, 0x2E9B5F, calX + 80, OY + 0.4, calZ - 100);

        // Drainage ditches (dark strips)
        var ditch1Geo = new THREE.BoxGeometry(250, 0.5, 3);
        makeMesh(ditch1Geo, 0x005577, calX, OY + 0.6, calZ - 30);
        var ditch2Geo = new THREE.BoxGeometry(250, 0.5, 3);
        makeMesh(ditch2Geo, 0x005577, calX, OY + 0.6, calZ + 30);
        var ditch3Geo = new THREE.BoxGeometry(3, 0.5, 150);
        makeMesh(ditch3Geo, 0x005577, calX - 80, OY + 0.6, calZ);
        var ditch4Geo = new THREE.BoxGeometry(3, 0.5, 150);
        makeMesh(ditch4Geo, 0x005577, calX + 80, OY + 0.6, calZ);

        // Hedgerow boundaries
        var hedge1Geo = new THREE.BoxGeometry(180, 3, 2);
        makeMesh(hedge1Geo, 0x1A5C1A, calX, OY + 1.5, calZ - 60);
        var hedge2Geo = new THREE.BoxGeometry(2, 3, 120);
        makeMesh(hedge2Geo, 0x1A5C1A, calX - 100, OY + 1.5, calZ);

        // Flooded marsh pools
        var pool1Geo = new THREE.BoxGeometry(20, 0.4, 14);
        makeMesh(pool1Geo, 0x4488AA, calX - 40, OY + 0.7, calZ + 50);
        var pool2Geo = new THREE.BoxGeometry(12, 0.4, 18);
        makeMesh(pool2Geo, 0x3D7F9F, calX + 60, OY + 0.7, calZ - 50);

        // Cattle (low box shapes)
        var cowGeo = new THREE.BoxGeometry(3, 2, 5);
        makeMesh(cowGeo, 0x3A2A1A, calX - 20, OY + 1.5, calZ + 10);
        makeMesh(cowGeo, 0x2A1A0A, calX + 10, OY + 1.5, calZ + 20);
    }

    function buildTerryglass() {
        // Terryglass — pretty village on east shore of Lough Derg
        var tgX = OX + 700;
        var tgZ = OZ + 200;

        // White cottage cluster
        var cottageColors = [0xFFFFF0, 0xFFFAE6, 0xFFFFF0, 0xF5F5DC];
        for (var cg = 0; cg < 4; cg++) {
            var cottageGeo = new THREE.BoxGeometry(9, 7, 8);
            makeMesh(cottageGeo, cottageColors[cg], tgX + cg * 14, OY + 3.5, tgZ);
            var cRoofGeo = new THREE.BoxGeometry(10, 4, 9);
            makeMesh(cRoofGeo, 0xCC8866, tgX + cg * 14, OY + 9, tgZ);
        }

        // Village pub / bar
        var pubGeo = new THREE.BoxGeometry(12, 9, 10);
        makeMesh(pubGeo, 0x228844, tgX + 55, OY + 4.5, tgZ);
        var pubRoofGeo = new THREE.BoxGeometry(13, 3, 11);
        makeMesh(pubRoofGeo, 0x1A6633, tgX + 55, OY + 10.5, tgZ);

        // Terryglass Castle tower remnant
        var tgTowerGeo = new THREE.BoxGeometry(10, 16, 10);
        makeMesh(tgTowerGeo, 0x7A7A7A, tgX - 20, OY + 8, tgZ - 30);
        var tgTowerTopGeo = new THREE.BoxGeometry(11, 2, 11);
        makeMesh(tgTowerTopGeo, 0x6A6A6A, tgX - 20, OY + 17, tgZ - 30);

        // Shoreline at Terryglass
        var tgShoreGeo = new THREE.BoxGeometry(80, 2, 10);
        makeMesh(tgShoreGeo, 0x8B7355, tgX + 20, OY + 0.8, tgZ + 30);

        // Small jetty
        var jettyGeo = new THREE.BoxGeometry(3, 1, 20);
        makeMesh(jettyGeo, 0x5C4A2A, tgX + 30, OY + 1, tgZ + 40);
    }

    function buildDromineerCastle() {
        // Dromineer Castle — small tower house ruin at Dromineer Bay
        var drX = OX + 300;
        var drZ = OZ + 450;

        // Main tower
        var drTowerGeo = new THREE.BoxGeometry(10, 20, 10);
        makeMesh(drTowerGeo, 0x808080, drX, OY + 10, drZ);

        // Battered base plinth
        var drPlinthGeo = new THREE.BoxGeometry(13, 3, 13);
        makeMesh(drPlinthGeo, 0x757575, drX, OY + 1.5, drZ);

        // Ruined wall stubs
        var drWall1Geo = new THREE.BoxGeometry(2, 8, 20);
        makeMesh(drWall1Geo, 0x787878, drX - 8, OY + 4, drZ + 5);
        var drWall2Geo = new THREE.BoxGeometry(18, 6, 2);
        makeMesh(drWall2Geo, 0x808080, drX, OY + 3, drZ + 15);

        // Crenellated top
        for (var dc = 0; dc < 3; dc++) {
            var drMerlonGeo = new THREE.BoxGeometry(2.5, 3, 2);
            makeMesh(drMerlonGeo, 0x808080, drX - 3 + dc * 3, OY + 22, drZ - 5.1);
        }

        // Reflection on water — slightly transparent-looking (same colour, lower)
        var drReflectionGeo = new THREE.BoxGeometry(10, 1, 10);
        makeMesh(drReflectionGeo, 0x4A4A5F, drX, OY - 0.5, drZ + 5);

        // Dromineer Bay water
        var drBayGeo = new THREE.BoxGeometry(150, 0.8, 120);
        makeMesh(drBayGeo, 0x006994, drX + 50, OY - 0.2, drZ + 40);

        // Dromineer pier
        var drPierGeo = new THREE.BoxGeometry(3, 2, 35);
        makeMesh(drPierGeo, 0x696969, drX + 10, OY + 1, drZ + 30);

        // Small village buildings at Dromineer
        for (var dv = 0; dv < 3; dv++) {
            var dvGeo = new THREE.BoxGeometry(8, 7, 7);
            makeMesh(dvGeo, 0xFFFFF0, drX + 30 + dv * 11, OY + 3.5, drZ - 10);
            var dvRoofGeo = new THREE.BoxGeometry(9, 3, 8);
            makeMesh(dvRoofGeo, 0xCC8866, drX + 30 + dv * 11, OY + 8.5, drZ - 10);
        }
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
