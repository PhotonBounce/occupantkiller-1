window.NewcastleQuayside = (function () {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 20800;
    var CY = 0;
    var CZ = 0;

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
        buildRiverTyne();
        buildTyneBridge();
        buildMillenniumBridge();
        buildSageGateshead();
        buildBalticCentre();
        buildCastleKeep();
        buildBlackGate();
        buildStNicholasCathedral();
        buildGreyStreet();
        buildQuaysideBuildings();
        buildExtraBridges();
        buildGroundPlane();
    }

    function buildGroundPlane() {
        // Ground — north bank quayside area (boxes as ground tiles)
        var groundGeo = new THREE.BoxGeometry(1200, 2, 800);
        makeMesh(groundGeo, 0xB0A090, CX, CY - 1, CZ - 200);

        // South bank (Gateshead) ground
        var southGeo = new THREE.BoxGeometry(1200, 2, 600);
        makeMesh(southGeo, 0xA89880, CX, CY - 1, CZ + 250);

        // Quayside paved area
        var paveGeo = new THREE.BoxGeometry(600, 1, 100);
        makeMesh(paveGeo, 0xD4C9B0, CX, CY, CZ - 30);

        // Road along quayside
        var roadGeo = new THREE.BoxGeometry(700, 1, 30);
        makeMesh(roadGeo, 0x444444, CX, CY + 0.5, CZ - 60);
    }

    function buildRiverTyne() {
        // River Tyne — wide flat box running east-west
        var riverGeo = new THREE.BoxGeometry(1400, 1, 220);
        makeMesh(riverGeo, 0x006994, CX, CY - 1, CZ + 60);

        // River surface shimmer strip
        var shimmerGeo = new THREE.BoxGeometry(1380, 0.5, 200);
        makeMesh(shimmerGeo, 0x0077AA, CX, CY - 0.2, CZ + 60);
    }

    function buildTyneBridge() {
        // Tyne Bridge — iconic green steel arch bridge, approx at CX - 50
        var bx = CX - 50;
        var bz = CZ + 60;

        // Road deck
        var deckGeo = new THREE.BoxGeometry(220, 4, 18);
        makeMesh(deckGeo, 0x555555, bx, CY + 22, bz);

        // Deck side barriers
        var barrierGeo1 = new THREE.BoxGeometry(220, 3, 2);
        makeMesh(barrierGeo1, 0x333333, bx, CY + 24, bz - 8);
        var barrierGeo2 = new THREE.BoxGeometry(220, 3, 2);
        makeMesh(barrierGeo2, 0x333333, bx, CY + 24, bz + 8);

        // Main arch — large cylinder rotated to span the river
        var archGeo = new THREE.CylinderGeometry(2.5, 2.5, 230, 12);
        makeMesh(archGeo, 0x228B22, bx, CY + 70, bz, 0, 0, Math.PI / 2);

        // Arch crown top piece (visual apex)
        var crownGeo = new THREE.SphereGeometry(5, 8, 6);
        makeMesh(crownGeo, 0x228B22, bx, CY + 80, bz);

        // North pylon tower
        var pylonNGeo = new THREE.BoxGeometry(14, 80, 14);
        makeMesh(pylonNGeo, 0x228B22, bx - 100, CY + 40, bz);
        var pylonNCapGeo = new THREE.BoxGeometry(20, 8, 20);
        makeMesh(pylonNCapGeo, 0x1A6B1A, bx - 100, CY + 84, bz);
        var pylonNTopGeo = new THREE.ConeGeometry(10, 20, 4);
        makeMesh(pylonNTopGeo, 0x1A6B1A, bx - 100, CY + 98, bz);

        // South pylon tower
        var pylonSGeo = new THREE.BoxGeometry(14, 80, 14);
        makeMesh(pylonSGeo, 0x228B22, bx + 100, CY + 40, bz);
        var pylonSCapGeo = new THREE.BoxGeometry(20, 8, 20);
        makeMesh(pylonSCapGeo, 0x1A6B1A, bx + 100, CY + 84, bz);
        var pylonSTopGeo = new THREE.ConeGeometry(10, 20, 4);
        makeMesh(pylonSTopGeo, 0x1A6B1A, bx + 100, CY + 98, bz);

        // Suspension rods hanging from arch to deck (thin boxes)
        var rodPositions = [-80, -60, -40, -20, 0, 20, 40, 60, 80];
        for (var i = 0; i < rodPositions.length; i++) {
            var rodHeight = 10 + Math.abs(rodPositions[i]) * 0.3;
            var rodGeo = new THREE.BoxGeometry(1.5, rodHeight, 1.5);
            makeMesh(rodGeo, 0x228B22, bx + rodPositions[i], CY + 22 + rodHeight / 2, bz);
        }
    }

    function buildMillenniumBridge() {
        // Gateshead Millennium Bridge — tilting eye pedestrian bridge
        var mx = CX + 120;
        var mz = CZ + 60;

        // Lower deck arc rib (the walking deck)
        var lowerRibGeo = new THREE.CylinderGeometry(1.5, 1.5, 200, 10);
        makeMesh(lowerRibGeo, 0xD3D3D3, mx, CY + 5, mz, 0, 0, Math.PI / 2);

        // Upper arch rib (the elegant leaning arch)
        var upperRibGeo = new THREE.CylinderGeometry(2, 2, 200, 10);
        makeMesh(upperRibGeo, 0xD3D3D3, mx, CY + 36, mz, 0, 0, Math.PI / 2);

        // Arch apex sphere
        var apexGeo = new THREE.SphereGeometry(4, 8, 6);
        makeMesh(apexGeo, 0xD3D3D3, mx, CY + 50, mz);

        // Support cables (thin boxes) between upper and lower ribs
        var cableXPositions = [-70, -50, -30, -10, 10, 30, 50, 70];
        for (var c = 0; c < cableXPositions.length; c++) {
            var cableGeo = new THREE.BoxGeometry(1, 45, 1);
            makeMesh(cableGeo, 0x88AAFF, mx + cableXPositions[c], CY + 22, mz);
        }

        // Deck surface
        var deckGeo = new THREE.BoxGeometry(200, 2, 8);
        makeMesh(deckGeo, 0xBBBBBB, mx, CY + 5, mz);
    }

    function buildSageGateshead() {
        // Sage Gateshead — Norman Foster curved shell music venue on south bank
        var sx = CX + 80;
        var sz = CZ + 200;

        // Main shell body 1 — large hall
        var shell1Geo = new THREE.CylinderGeometry(40, 45, 30, 12);
        makeMesh(shell1Geo, 0xD3D3D3, sx, CY + 15, sz);

        // Shell curved roof over hall 1
        var roof1Geo = new THREE.SphereGeometry(50, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        makeMesh(roof1Geo, 0xC0C0C0, sx, CY + 30, sz);

        // Main shell body 2 — second hall
        var shell2Geo = new THREE.CylinderGeometry(30, 35, 24, 12);
        makeMesh(shell2Geo, 0xD3D3D3, sx + 80, CY + 12, sz);

        // Roof over hall 2
        var roof2Geo = new THREE.SphereGeometry(38, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        makeMesh(roof2Geo, 0xC0C0C0, sx + 80, CY + 24, sz);

        // Linking concourse spine
        var spineGeo = new THREE.BoxGeometry(80, 18, 30);
        makeMesh(spineGeo, 0xB8B8B8, sx + 40, CY + 9, sz);

        // Concourse roof
        var spineRoofGeo = new THREE.CylinderGeometry(16, 18, 80, 8);
        makeMesh(spineRoofGeo, 0xC0C0C0, sx + 40, CY + 18, sz, 0, 0, Math.PI / 2);

        // Glass facade front
        var facadeGeo = new THREE.BoxGeometry(180, 20, 4);
        makeMesh(facadeGeo, 0x88CCEE, sx + 40, CY + 10, sz - 35);

        // Entrance canopy
        var canopyGeo = new THREE.BoxGeometry(40, 3, 20);
        makeMesh(canopyGeo, 0xAAAAAA, sx, CY + 20, sz - 40);
    }

    function buildBalticCentre() {
        // BALTIC Centre for Contemporary Art — converted flour mill
        var bax = CX - 180;
        var baz = CZ + 180;

        // Main tower body — tall yellow brick
        var towerGeo = new THREE.BoxGeometry(38, 90, 32);
        makeMesh(towerGeo, 0xCC8800, bax, CY + 45, baz);

        // Upper section with setback
        var upperGeo = new THREE.BoxGeometry(34, 30, 28);
        makeMesh(upperGeo, 0xBB7700, bax, CY + 105, baz);

        // Roof plant room
        var roofGeo = new THREE.BoxGeometry(30, 10, 24);
        makeMesh(roofGeo, 0xAA6600, bax, CY + 125, baz);

        // Large window openings (dark inset boxes)
        var win1Geo = new THREE.BoxGeometry(26, 18, 2);
        makeMesh(win1Geo, 0x222222, bax, CY + 55, baz - 17);
        var win2Geo = new THREE.BoxGeometry(26, 18, 2);
        makeMesh(win2Geo, 0x222222, bax, CY + 80, baz - 17);

        // Side windows
        var swinGeo1 = new THREE.BoxGeometry(2, 14, 22);
        makeMesh(swinGeo1, 0x222222, bax - 20, CY + 50, baz);
        var swinGeo2 = new THREE.BoxGeometry(2, 14, 22);
        makeMesh(swinGeo2, 0x222222, bax - 20, CY + 75, baz);

        // BALTIC sign base
        var signBaseGeo = new THREE.BoxGeometry(10, 4, 4);
        makeMesh(signBaseGeo, 0xEE9900, bax, CY + 92, baz - 17);

        // Entrance lobby glass box
        var lobbyGeo = new THREE.BoxGeometry(24, 12, 10);
        makeMesh(lobbyGeo, 0x99BBDD, bax, CY + 6, baz - 22);
    }

    function buildCastleKeep() {
        // Newcastle Castle Keep — Norman fortification in city centre
        var kkx = CX - 250;
        var kkz = CZ - 180;

        // Main keep body
        var keepGeo = new THREE.BoxGeometry(28, 50, 28);
        makeMesh(keepGeo, 0x8B7355, kkx, CY + 25, kkz);

        // Corner towers
        var ctGeo1 = new THREE.CylinderGeometry(5, 5, 54, 8);
        makeMesh(ctGeo1, 0x7A6245, kkx - 14, CY + 27, kkz - 14);
        var ctGeo2 = new THREE.CylinderGeometry(5, 5, 54, 8);
        makeMesh(ctGeo2, 0x7A6245, kkx + 14, CY + 27, kkz - 14);
        var ctGeo3 = new THREE.CylinderGeometry(5, 5, 54, 8);
        makeMesh(ctGeo3, 0x7A6245, kkx - 14, CY + 27, kkz + 14);
        var ctGeo4 = new THREE.CylinderGeometry(5, 5, 54, 8);
        makeMesh(ctGeo4, 0x7A6245, kkx + 14, CY + 27, kkz + 14);

        // Corner tower battlements caps
        var cap1 = new THREE.CylinderGeometry(6, 6, 4, 8);
        makeMesh(cap1, 0x6A5235, kkx - 14, CY + 56, kkz - 14);
        var cap2 = new THREE.CylinderGeometry(6, 6, 4, 8);
        makeMesh(cap2, 0x6A5235, kkx + 14, CY + 56, kkz - 14);
        var cap3 = new THREE.CylinderGeometry(6, 6, 4, 8);
        makeMesh(cap3, 0x6A5235, kkx - 14, CY + 56, kkz + 14);
        var cap4 = new THREE.CylinderGeometry(6, 6, 4, 8);
        makeMesh(cap4, 0x6A5235, kkx + 14, CY + 56, kkz + 14);

        // Keep rooftop battlements
        var battleGeo = new THREE.BoxGeometry(30, 6, 30);
        makeMesh(battleGeo, 0x7A6245, kkx, CY + 53, kkz);

        // Keep entrance arch base
        var archBaseGeo = new THREE.BoxGeometry(8, 12, 4);
        makeMesh(archBaseGeo, 0x6A5235, kkx, CY + 6, kkz - 15);

        // Castle mound / earthwork base
        var moundGeo = new THREE.CylinderGeometry(40, 50, 10, 8);
        makeMesh(moundGeo, 0x7A6050, kkx, CY + 5, kkz);
    }

    function buildBlackGate() {
        // Black Gate — medieval barbican gatehouse adjacent to keep
        var bgx = CX - 240;
        var bgz = CZ - 210;

        // Main gatehouse body
        var gateGeo = new THREE.BoxGeometry(18, 28, 16);
        makeMesh(gateGeo, 0x6B5D4F, bgx, CY + 14, bgz);

        // Arch passageway (dark box as gate opening)
        var passGeo = new THREE.BoxGeometry(6, 10, 18);
        makeMesh(passGeo, 0x222222, bgx, CY + 5, bgz);

        // Gate tower on one side
        var gTowerGeo = new THREE.CylinderGeometry(5, 6, 32, 8);
        makeMesh(gTowerGeo, 0x5E5248, bgx + 10, CY + 16, bgz);

        // Rooftop
        var gRoofGeo = new THREE.ConeGeometry(6, 10, 8);
        makeMesh(gRoofGeo, 0x4A4038, bgx + 10, CY + 37, bgz);
    }

    function buildStNicholasCathedral() {
        // St Nicholas Cathedral — Gothic with famous crown/lantern spire
        var cx2 = CX - 210;
        var cz2 = CZ - 150;

        // Main nave body
        var naveGeo = new THREE.BoxGeometry(22, 22, 55);
        makeMesh(naveGeo, 0xC8B89A, cx2, CY + 11, cz2);

        // Nave roof (pitched — two sloped boxes)
        var naveRoofGeo = new THREE.CylinderGeometry(1, 16, 55, 4);
        makeMesh(naveRoofGeo, 0xB8A88A, cx2, CY + 29, cz2, 0, Math.PI / 4);

        // Chancel / choir east end
        var chanGeo = new THREE.BoxGeometry(14, 18, 22);
        makeMesh(chanGeo, 0xC8B89A, cx2 + 22, CY + 9, cz2);

        // Transepts
        var transNGeo = new THREE.BoxGeometry(14, 20, 14);
        makeMesh(transNGeo, 0xC8B89A, cx2, CY + 10, cz2 - 20);
        var transSGeo = new THREE.BoxGeometry(14, 20, 14);
        makeMesh(transSGeo, 0xC8B89A, cx2, CY + 10, cz2 + 20);

        // Central tower
        var towerGeo = new THREE.BoxGeometry(14, 44, 14);
        makeMesh(towerGeo, 0xC0A888, cx2, CY + 22, cz2);

        // Distinctive crown/lantern spire — four flying buttress arches as thin cylinders
        var spireBaseGeo = new THREE.BoxGeometry(10, 8, 10);
        makeMesh(spireBaseGeo, 0xB8A075, cx2, CY + 48, cz2);

        // Crown spire uprights (four corner pinnacles)
        var sp1 = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
        makeMesh(sp1, 0xC0A878, cx2 - 5, CY + 55, cz2 - 5);
        var sp2 = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
        makeMesh(sp2, 0xC0A878, cx2 + 5, CY + 55, cz2 - 5);
        var sp3 = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
        makeMesh(sp3, 0xC0A878, cx2 - 5, CY + 55, cz2 + 5);
        var sp4 = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
        makeMesh(sp4, 0xC0A878, cx2 + 5, CY + 55, cz2 + 5);

        // Crown connecting arches (thin horizontal cylinders)
        var arch1Geo = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
        makeMesh(arch1Geo, 0xC0A878, cx2, CY + 63, cz2 - 5, 0, 0, Math.PI / 2);
        var arch2Geo = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
        makeMesh(arch2Geo, 0xC0A878, cx2, CY + 63, cz2 + 5, 0, 0, Math.PI / 2);
        var arch3Geo = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
        makeMesh(arch3Geo, 0xC0A878, cx2 - 5, CY + 63, cz2, 0, 0, 0);
        var arch4Geo = new THREE.CylinderGeometry(0.8, 0.8, 12, 6);
        makeMesh(arch4Geo, 0xC0A878, cx2 + 5, CY + 63, cz2, 0, 0, 0);

        // Lantern top
        var lanternGeo = new THREE.CylinderGeometry(3, 5, 10, 8);
        makeMesh(lanternGeo, 0xB89860, cx2, CY + 70, cz2);

        // Finial spike at top
        var finialGeo = new THREE.ConeGeometry(2, 8, 6);
        makeMesh(finialGeo, 0xA88850, cx2, CY + 79, cz2);

        // West towers (twin entrance towers)
        var wt1Geo = new THREE.BoxGeometry(8, 30, 8);
        makeMesh(wt1Geo, 0xC0A888, cx2 - 15, CY + 15, cz2);
        var wt2Geo = new THREE.BoxGeometry(8, 30, 8);
        makeMesh(wt2Geo, 0xC0A888, cx2 + 15, CY + 15, cz2);

        // West tower pinnacles
        var wtp1 = new THREE.ConeGeometry(4, 12, 6);
        makeMesh(wtp1, 0xB09070, cx2 - 15, CY + 36, cz2);
        var wtp2 = new THREE.ConeGeometry(4, 12, 6);
        makeMesh(wtp2, 0xB09070, cx2 + 15, CY + 36, cz2);
    }

    function buildGreyStreet() {
        // Grey Street — curved Victorian street running north from quayside
        var gsx = CX - 160;
        var gsz = CZ - 100;

        // Street surface (curved approximation with rotated boxes)
        var street1Geo = new THREE.BoxGeometry(200, 1, 20);
        makeMesh(street1Geo, 0x555555, gsx, CY + 0.5, gsz, 0, 0.15, 0);
        var street2Geo = new THREE.BoxGeometry(200, 1, 20);
        makeMesh(street2Geo, 0x555555, gsx, CY + 0.5, gsz - 40, 0, 0.05, 0);

        // Theatre Royal — neoclassical theatre
        var trGeo = new THREE.BoxGeometry(30, 22, 22);
        makeMesh(trGeo, 0xD4C9B0, gsx - 20, CY + 11, gsz - 60);
        // Portico columns (cylinder pillars)
        var col1 = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
        makeMesh(col1, 0xE0D8C8, gsx - 28, CY + 9, gsz - 72);
        var col2 = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
        makeMesh(col2, 0xE0D8C8, gsx - 24, CY + 9, gsz - 72);
        var col3 = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
        makeMesh(col3, 0xE0D8C8, gsx - 16, CY + 9, gsz - 72);
        // Pediment
        var pedGeo = new THREE.BoxGeometry(30, 6, 4);
        makeMesh(pedGeo, 0xD4C9B0, gsx - 20, CY + 22, gsz - 72);
        var pedTopGeo = new THREE.ConeGeometry(15, 8, 4);
        makeMesh(pedTopGeo, 0xC8BC9C, gsx - 20, CY + 29, gsz - 72, 0, Math.PI / 4);

        // Grey's Monument — tall Doric column with statue on top
        var gmColGeo = new THREE.CylinderGeometry(3, 4, 50, 12);
        makeMesh(gmColGeo, 0xD0C8B8, gsx, CY + 25, gsz - 80);
        // Column base plinth
        var gmBaseGeo = new THREE.BoxGeometry(12, 8, 12);
        makeMesh(gmBaseGeo, 0xC8C0B0, gsx, CY + 4, gsz - 80);
        // Statue sphere on top
        var statueGeo = new THREE.SphereGeometry(3, 8, 6);
        makeMesh(statueGeo, 0xC0B8A0, gsx, CY + 53, gsz - 80);

        // Victorian buildings lining Grey Street (terraced blocks)
        var b1Geo = new THREE.BoxGeometry(24, 28, 16);
        makeMesh(b1Geo, 0xD4C9B0, gsx + 60, CY + 14, gsz - 70);
        var b2Geo = new THREE.BoxGeometry(24, 28, 16);
        makeMesh(b2Geo, 0xCEC4AA, gsx + 88, CY + 14, gsz - 70);
        var b3Geo = new THREE.BoxGeometry(24, 25, 16);
        makeMesh(b3Geo, 0xD8CDB8, gsx - 60, CY + 12, gsz - 70);
        var b4Geo = new THREE.BoxGeometry(24, 26, 16);
        makeMesh(b4Geo, 0xCCC2A8, gsx - 88, CY + 13, gsz - 70);
    }

    function buildQuaysideBuildings() {
        // Mix of converted warehouses and modern apartments along north bank quayside

        // Sandhill historic buildings cluster
        var sh1Geo = new THREE.BoxGeometry(20, 24, 16);
        makeMesh(sh1Geo, 0xF5F0E8, CX - 350, CY + 12, CZ - 80);
        var sh2Geo = new THREE.BoxGeometry(18, 20, 14);
        makeMesh(sh2Geo, 0xEDE8DC, CX - 325, CY + 10, CZ - 80);
        var sh3Geo = new THREE.BoxGeometry(22, 28, 16);
        makeMesh(sh3Geo, 0xF0EBE0, CX - 295, CY + 14, CZ - 80);

        // Converted warehouse — The Cooperage / Broad Chare area
        var wh1Geo = new THREE.BoxGeometry(34, 20, 18);
        makeMesh(wh1Geo, 0xCD5C5C, CX + 200, CY + 10, CZ - 60);
        // Warehouse arched windows
        var ww1Geo = new THREE.BoxGeometry(32, 8, 2);
        makeMesh(ww1Geo, 0x333333, CX + 200, CY + 12, CZ - 70);

        var wh2Geo = new THREE.BoxGeometry(40, 24, 20);
        makeMesh(wh2Geo, 0xC05050, CX + 250, CY + 12, CZ - 55);
        var wh2RoofGeo = new THREE.BoxGeometry(42, 4, 22);
        makeMesh(wh2RoofGeo, 0xAA4040, CX + 250, CY + 26, CZ - 55);

        // Modern apartments north quayside
        var apt1Geo = new THREE.BoxGeometry(22, 38, 18);
        makeMesh(apt1Geo, 0xF5F0E8, CX + 300, CY + 19, CZ - 80);
        var apt1GlassGeo = new THREE.BoxGeometry(20, 36, 2);
        makeMesh(apt1GlassGeo, 0x88AACC, CX + 300, CY + 19, CZ - 90);

        var apt2Geo = new THREE.BoxGeometry(20, 42, 16);
        makeMesh(apt2Geo, 0xEEE8DC, CX + 330, CY + 21, CZ - 80);

        // Waterside pub / restaurant (low Victorian building)
        var pubGeo = new THREE.BoxGeometry(18, 12, 14);
        makeMesh(pubGeo, 0xD2691E, CX - 120, CY + 6, CZ - 50);
        var pubRoofGeo = new THREE.CylinderGeometry(1, 10, 6, 4);
        makeMesh(pubRoofGeo, 0xA0522D, CX - 120, CY + 15, CZ - 50, 0, Math.PI / 4);

        // Exchange Buildings (former corn exchange) — classical dome
        var exGeo = new THREE.BoxGeometry(26, 18, 22);
        makeMesh(exGeo, 0xE0D8C8, CX - 300, CY + 9, CZ - 120);
        var exDomeGeo = new THREE.SphereGeometry(12, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
        makeMesh(exDomeGeo, 0xD0C8B8, CX - 300, CY + 18, CZ - 120);

        // Lamp posts along quayside
        var lp1Geo = new THREE.CylinderGeometry(0.4, 0.6, 10, 6);
        makeMesh(lp1Geo, 0x333333, CX - 80, CY + 5, CZ - 50);
        var lp1TopGeo = new THREE.SphereGeometry(1.2, 6, 4);
        makeMesh(lp1TopGeo, 0xFFFFCC, CX - 80, CY + 10.5, CZ - 50);

        var lp2Geo = new THREE.CylinderGeometry(0.4, 0.6, 10, 6);
        makeMesh(lp2Geo, 0x333333, CX + 40, CY + 5, CZ - 50);
        var lp2TopGeo = new THREE.SphereGeometry(1.2, 6, 4);
        makeMesh(lp2TopGeo, 0xFFFFCC, CX + 40, CY + 10.5, CZ - 50);

        var lp3Geo = new THREE.CylinderGeometry(0.4, 0.6, 10, 6);
        makeMesh(lp3Geo, 0x333333, CX + 160, CY + 5, CZ - 50);
        var lp3TopGeo = new THREE.SphereGeometry(1.2, 6, 4);
        makeMesh(lp3TopGeo, 0xFFFFCC, CX + 160, CY + 10.5, CZ - 50);

        // Tyne Bar / quayside low-rise cluster
        var tb1Geo = new THREE.BoxGeometry(16, 10, 12);
        makeMesh(tb1Geo, 0xCC7733, CX + 360, CY + 5, CZ - 60);
        var tb2Geo = new THREE.BoxGeometry(14, 12, 12);
        makeMesh(tb2Geo, 0xBB6622, CX + 380, CY + 6, CZ - 60);
    }

    function buildExtraBridges() {
        // High Level Bridge — Robert Stephenson double-deck railway/road bridge
        var hlx = CX - 160;
        var hlz = CZ + 60;

        // Main deck structure
        var hlDeckGeo = new THREE.BoxGeometry(240, 5, 14);
        makeMesh(hlDeckGeo, 0x555544, hlx, CY + 32, hlz);

        // Railway level above
        var hlRailGeo = new THREE.BoxGeometry(240, 4, 12);
        makeMesh(hlRailGeo, 0x444433, hlx, CY + 40, hlz);

        // Pier columns
        var pier1Geo = new THREE.BoxGeometry(10, 34, 10);
        makeMesh(pier1Geo, 0x666655, hlx - 80, CY + 16, hlz);
        var pier2Geo = new THREE.BoxGeometry(10, 34, 10);
        makeMesh(pier2Geo, 0x666655, hlx, CY + 16, hlz);
        var pier3Geo = new THREE.BoxGeometry(10, 34, 10);
        makeMesh(pier3Geo, 0x666655, hlx + 80, CY + 16, hlz);

        // King Edward VII Bridge (further west, simplified)
        var kex = CX - 280;
        var kez = CZ + 60;
        var keDeckGeo = new THREE.BoxGeometry(200, 4, 10);
        makeMesh(keDeckGeo, 0x447744, kex, CY + 20, kez);
        var kePier1 = new THREE.BoxGeometry(8, 22, 8);
        makeMesh(kePier1, 0x336633, kex - 70, CY + 11, kez);
        var kePier2 = new THREE.BoxGeometry(8, 22, 8);
        makeMesh(kePier2, 0x336633, kex + 70, CY + 11, kez);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) { }

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
