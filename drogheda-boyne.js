window.DroghedaBoyne = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 18640;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, mat) {
        var mesh = new THREE.Mesh(geo, mat);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildRiverBoyne();
        buildMillmountFort();
        buildStLaurenceGate();
        buildDroghedaViaduct();
        buildStPetersChurch();
        buildBattleOfBoyneSite();
        buildDroghedaTownscape();
        buildOldWalls();
        buildNewgrange();
        buildBoyneFarmland();
    }

    // -----------------------------------------------------------------------
    // River Boyne — wide 0x006994 river with quay walls
    // -----------------------------------------------------------------------
    function buildRiverBoyne() {
        var matWater = makeLambert(0x006994);
        var matQuay = makeLambert(0x8B7355);

        // Main river channel — built from box slabs side by side
        var i;
        for (i = 0; i < 8; i++) {
            var riverSlab = makeMesh(
                new THREE.BoxGeometry(300, 2, 30),
                matWater
            );
            riverSlab.position.set(BASE_X - 200 + i * 300, BASE_Y - 1, BASE_Z);
        }

        // North quay wall
        var northQuay = makeMesh(
            new THREE.BoxGeometry(2400, 6, 8),
            matQuay
        );
        northQuay.position.set(BASE_X + 800, BASE_Y + 3, BASE_Z - 19);

        // South quay wall
        var southQuay = makeMesh(
            new THREE.BoxGeometry(2400, 6, 8),
            matQuay
        );
        southQuay.position.set(BASE_X + 800, BASE_Y + 3, BASE_Z + 19);

        // Quay wall buttresses north
        for (i = 0; i < 6; i++) {
            var buttN = makeMesh(
                new THREE.BoxGeometry(6, 8, 5),
                matQuay
            );
            buttN.position.set(BASE_X - 400 + i * 400, BASE_Y + 4, BASE_Z - 22);
        }

        // Quay wall buttresses south
        for (i = 0; i < 6; i++) {
            var buttS = makeMesh(
                new THREE.BoxGeometry(6, 8, 5),
                matQuay
            );
            buttS.position.set(BASE_X - 400 + i * 400, BASE_Y + 4, BASE_Z + 22);
        }
    }

    // -----------------------------------------------------------------------
    // Millmount Fort — artificial hill with Martello tower, star walls
    // -----------------------------------------------------------------------
    function buildMillmountFort() {
        var matHill = makeLambert(0x556B2F);
        var matTower = makeLambert(0x808080);
        var matWall = makeLambert(0x696969);

        var cx = BASE_X - 600;
        var cz = BASE_Z - 120;

        // The artificial mound — stack of shrinking cylinders
        var mound1 = makeMesh(new THREE.CylinderGeometry(55, 70, 14, 8), matHill);
        mound1.position.set(cx, BASE_Y + 7, cz);

        var mound2 = makeMesh(new THREE.CylinderGeometry(40, 55, 10, 8), matHill);
        mound2.position.set(cx, BASE_Y + 19, cz);

        var mound3 = makeMesh(new THREE.CylinderGeometry(26, 40, 8, 8), matHill);
        mound3.position.set(cx, BASE_Y + 28, cz);

        // Martello tower on top
        var tower = makeMesh(new THREE.CylinderGeometry(10, 12, 20, 12), matTower);
        tower.position.set(cx, BASE_Y + 42, cz);

        // Tower parapet ring
        var parapet = makeMesh(new THREE.CylinderGeometry(12, 12, 3, 12), matTower);
        parapet.position.set(cx, BASE_Y + 53, cz);

        // Tower cap dome
        var cap = makeMesh(new THREE.SphereGeometry(10, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), matTower);
        cap.position.set(cx, BASE_Y + 55, cz);

        // Star-shaped fortification walls — 8 angled wall segments
        var wallMat = makeLambert(0x5C5C5C);
        var angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
                      Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
        var i;
        for (i = 0; i < 8; i++) {
            var wallSeg = makeMesh(new THREE.BoxGeometry(45, 7, 5), wallMat);
            var ang = angles[i];
            wallSeg.position.set(
                cx + Math.cos(ang) * 68,
                BASE_Y + 3,
                cz + Math.sin(ang) * 68
            );
            wallSeg.rotation.y = ang + Math.PI / 2;
        }

        // Star bastion corner mounds
        for (i = 0; i < 4; i++) {
            var bastion = makeMesh(new THREE.BoxGeometry(14, 9, 14), wallMat);
            var bang = i * (Math.PI / 2) + Math.PI / 8;
            bastion.position.set(
                cx + Math.cos(bang) * 80,
                BASE_Y + 4,
                cz + Math.sin(bang) * 80
            );
        }
    }

    // -----------------------------------------------------------------------
    // St Laurence Gate — twin-towered medieval barbican gate
    // -----------------------------------------------------------------------
    function buildStLaurenceGate() {
        var matStone = makeLambert(0x8B7355);
        var matDark = makeLambert(0x5C4033);

        var gx = BASE_X - 100;
        var gz = BASE_Z - 200;

        // Left tower
        var leftTower = makeMesh(new THREE.CylinderGeometry(9, 11, 40, 10), matStone);
        leftTower.position.set(gx - 18, BASE_Y + 20, gz);

        // Right tower
        var rightTower = makeMesh(new THREE.CylinderGeometry(9, 11, 40, 10), matStone);
        rightTower.position.set(gx + 18, BASE_Y + 20, gz);

        // Left tower battlements
        var leftBattle = makeMesh(new THREE.CylinderGeometry(10, 10, 5, 10), matStone);
        leftBattle.position.set(gx - 18, BASE_Y + 42, gz);

        // Right tower battlements
        var rightBattle = makeMesh(new THREE.CylinderGeometry(10, 10, 5, 10), matStone);
        rightBattle.position.set(gx + 18, BASE_Y + 42, gz);

        // Left tower conical cap
        var leftCap = makeMesh(new THREE.ConeGeometry(10, 10, 10), matDark);
        leftCap.position.set(gx - 18, BASE_Y + 50, gz);

        // Right tower conical cap
        var rightCap = makeMesh(new THREE.ConeGeometry(10, 10, 10), matDark);
        rightCap.position.set(gx + 18, BASE_Y + 50, gz);

        // Connecting arch passage wall (above gate)
        var archWall = makeMesh(new THREE.BoxGeometry(36, 18, 6), matStone);
        archWall.position.set(gx, BASE_Y + 30, gz);

        // Gate passage floor
        var gateFloor = makeMesh(new THREE.BoxGeometry(14, 2, 20), matStone);
        gateFloor.position.set(gx, BASE_Y + 1, gz);

        // Portcullis slot indicators (thin dark bars)
        var portLeft = makeMesh(new THREE.BoxGeometry(2, 16, 3), matDark);
        portLeft.position.set(gx - 6, BASE_Y + 14, gz);

        var portRight = makeMesh(new THREE.BoxGeometry(2, 16, 3), matDark);
        portRight.position.set(gx + 6, BASE_Y + 14, gz);

        // Side wall extensions
        var wallLeft = makeMesh(new THREE.BoxGeometry(20, 20, 5), matStone);
        wallLeft.position.set(gx - 35, BASE_Y + 10, gz);

        var wallRight = makeMesh(new THREE.BoxGeometry(20, 20, 5), matStone);
        wallRight.position.set(gx + 35, BASE_Y + 10, gz);
    }

    // -----------------------------------------------------------------------
    // Drogheda Viaduct — 18-arch Victorian railway viaduct
    // -----------------------------------------------------------------------
    function buildDroghedaViaduct() {
        var matPier = makeLambert(0x808080);
        var matSpan = makeLambert(0x909090);
        var matArch = makeLambert(0x707070);

        var vx = BASE_X + 400;
        var vz = BASE_Z + 80;
        var archSpacing = 22;
        var pierHeight = 38;
        var i;

        // 18 piers
        for (i = 0; i < 18; i++) {
            var pier = makeMesh(
                new THREE.BoxGeometry(6, pierHeight, 8),
                matPier
            );
            pier.position.set(vx + i * archSpacing, BASE_Y + pierHeight / 2, vz);

            // Pier capital widening
            var cap = makeMesh(
                new THREE.BoxGeometry(9, 4, 11),
                matPier
            );
            cap.position.set(vx + i * archSpacing, BASE_Y + pierHeight + 2, vz);
        }

        // 17 arch spans between piers
        for (i = 0; i < 17; i++) {
            // Span beam
            var span = makeMesh(
                new THREE.BoxGeometry(archSpacing - 2, 5, 7),
                matSpan
            );
            span.position.set(vx + i * archSpacing + archSpacing / 2, BASE_Y + pierHeight + 4, vz);

            // Arch voussoir (lower curve approximated with two angled boxes)
            var archLeft = makeMesh(
                new THREE.BoxGeometry(6, 4, 6),
                matArch
            );
            archLeft.position.set(
                vx + i * archSpacing + 4,
                BASE_Y + pierHeight - 4,
                vz
            );
            archLeft.rotation.z = 0.3;

            var archRight = makeMesh(
                new THREE.BoxGeometry(6, 4, 6),
                matArch
            );
            archRight.position.set(
                vx + i * archSpacing + archSpacing - 4,
                BASE_Y + pierHeight - 4,
                vz
            );
            archRight.rotation.z = -0.3;
        }

        // Deck / parapet running along top
        var deck = makeMesh(
            new THREE.BoxGeometry(17 * archSpacing + 6, 3, 10),
            matPier
        );
        deck.position.set(vx + (17 * archSpacing) / 2, BASE_Y + pierHeight + 7, vz);

        // Parapet rail
        var parapet = makeMesh(
            new THREE.BoxGeometry(17 * archSpacing + 6, 2, 2),
            matSpan
        );
        parapet.position.set(vx + (17 * archSpacing) / 2, BASE_Y + pierHeight + 10, vz);
    }

    // -----------------------------------------------------------------------
    // St Peter's Church (Catholic) — Gothic-Revival basilica with twin spires
    // -----------------------------------------------------------------------
    function buildStPetersChurch() {
        var matChurch = makeLambert(0x808080);
        var matRoof = makeLambert(0x505050);
        var matSpire = makeLambert(0x606060);

        var px = BASE_X + 100;
        var pz = BASE_Z - 280;

        // Main nave body
        var nave = makeMesh(new THREE.BoxGeometry(24, 24, 60), matChurch);
        nave.position.set(px, BASE_Y + 12, pz);

        // Nave roof ridge
        var naveRoof = makeMesh(new THREE.CylinderGeometry(0, 14, 14, 4), matRoof);
        naveRoof.position.set(px, BASE_Y + 31, pz);
        naveRoof.rotation.y = Math.PI / 4;

        // Chancel (east end)
        var chancel = makeMesh(new THREE.BoxGeometry(16, 20, 22), matChurch);
        chancel.position.set(px, BASE_Y + 10, pz - 41);

        // Chancel roof
        var chancelRoof = makeMesh(new THREE.CylinderGeometry(0, 10, 10, 4), matRoof);
        chancelRoof.position.set(px, BASE_Y + 27, pz - 41);
        chancelRoof.rotation.y = Math.PI / 4;

        // Left tower (west facade)
        var towerL = makeMesh(new THREE.BoxGeometry(12, 50, 12), matChurch);
        towerL.position.set(px - 18, BASE_Y + 25, pz + 24);

        // Right tower (west facade)
        var towerR = makeMesh(new THREE.BoxGeometry(12, 50, 12), matChurch);
        towerR.position.set(px + 18, BASE_Y + 25, pz + 24);

        // Left spire
        var spireL = makeMesh(new THREE.ConeGeometry(7, 30, 8), matSpire);
        spireL.position.set(px - 18, BASE_Y + 65, pz + 24);

        // Right spire
        var spireR = makeMesh(new THREE.ConeGeometry(7, 30, 8), matSpire);
        spireR.position.set(px + 18, BASE_Y + 65, pz + 24);

        // Transept left arm
        var transL = makeMesh(new THREE.BoxGeometry(22, 20, 20), matChurch);
        transL.position.set(px - 23, BASE_Y + 10, pz - 5);

        // Transept right arm
        var transR = makeMesh(new THREE.BoxGeometry(22, 20, 20), matChurch);
        transR.position.set(px + 23, BASE_Y + 10, pz - 5);

        // Central crossing tower
        var crossing = makeMesh(new THREE.BoxGeometry(16, 36, 16), matChurch);
        crossing.position.set(px, BASE_Y + 18, pz - 5);

        // Crossing spire/pinnacle
        var crossSpire = makeMesh(new THREE.ConeGeometry(5, 18, 8), matSpire);
        crossSpire.position.set(px, BASE_Y + 54, pz - 5);

        // Rose window face (decorative box inset)
        var roseWin = makeMesh(new THREE.BoxGeometry(10, 10, 2), matRoof);
        roseWin.position.set(px, BASE_Y + 28, pz + 30);

        // Steps up to entrance
        var steps1 = makeMesh(new THREE.BoxGeometry(28, 2, 6), matChurch);
        steps1.position.set(px, BASE_Y + 1, pz + 33);

        var steps2 = makeMesh(new THREE.BoxGeometry(26, 2, 4), matChurch);
        steps2.position.set(px, BASE_Y + 3, pz + 31);
    }

    // -----------------------------------------------------------------------
    // Battle of the Boyne site — flat battle field south of river
    // -----------------------------------------------------------------------
    function buildBattleOfBoyneSite() {
        var matField = makeLambert(0x228B22);
        var matMarker = makeLambert(0xC0C0C0);

        var bx = BASE_X + 500;
        var bz = BASE_Z + 220;

        // Large flat battlefield terrain slabs
        var i;
        for (i = 0; i < 6; i++) {
            var fieldSlab = makeMesh(
                new THREE.BoxGeometry(200, 1, 150),
                matField
            );
            fieldSlab.position.set(bx + i * 200 - 300, BASE_Y, bz);
        }

        // Battle monument obelisk
        var obeliskBase = makeMesh(new THREE.BoxGeometry(8, 4, 8), matMarker);
        obeliskBase.position.set(bx, BASE_Y + 2, bz - 50);

        var obeliskShaft = makeMesh(new THREE.BoxGeometry(4, 30, 4), matMarker);
        obeliskShaft.position.set(bx, BASE_Y + 19, bz - 50);

        var obeliskTop = makeMesh(new THREE.ConeGeometry(3, 8, 4), matMarker);
        obeliskTop.position.set(bx, BASE_Y + 38, bz - 50);

        // Scattered stones / earthworks
        var matEarth = makeLambert(0x8B6914);
        for (i = 0; i < 5; i++) {
            var earthwork = makeMesh(
                new THREE.BoxGeometry(30, 3, 10),
                matEarth
            );
            earthwork.position.set(bx - 200 + i * 80, BASE_Y + 1, bz + 30);
            earthwork.rotation.y = i * 0.4;
        }
    }

    // -----------------------------------------------------------------------
    // Drogheda townscape — stepped hillside with Georgian buildings
    // -----------------------------------------------------------------------
    function buildDroghedaTownscape() {
        var matGeorgian = makeLambert(0xCD5C5C);
        var matRoof = makeLambert(0x4A3728);
        var matWindow = makeLambert(0x87CEEB);

        var tx = BASE_X - 200;
        var tz = BASE_Z - 350;
        var i;

        // Row of Georgian terraces on hillside — 10 buildings
        for (i = 0; i < 10; i++) {
            var height = 14 + (i % 3) * 4;
            var yOffset = Math.floor(i / 3) * 5;

            var bldg = makeMesh(
                new THREE.BoxGeometry(18, height, 14),
                matGeorgian
            );
            bldg.position.set(tx + i * 22, BASE_Y + yOffset + height / 2, tz);

            // Roof
            var bldgRoof = makeMesh(
                new THREE.CylinderGeometry(0, 11, 6, 4),
                matRoof
            );
            bldgRoof.position.set(tx + i * 22, BASE_Y + yOffset + height + 3, tz);
            bldgRoof.rotation.y = Math.PI / 4;
        }

        // Second row further up the hill
        for (i = 0; i < 6; i++) {
            var hgt2 = 12 + (i % 2) * 3;
            var bldg2 = makeMesh(
                new THREE.BoxGeometry(16, hgt2, 12),
                matGeorgian
            );
            bldg2.position.set(tx + 30 + i * 28, BASE_Y + 15 + hgt2 / 2, tz - 30);

            var roof2 = makeMesh(
                new THREE.CylinderGeometry(0, 10, 5, 4),
                matRoof
            );
            roof2.position.set(tx + 30 + i * 28, BASE_Y + 15 + hgt2 + 2, tz - 30);
            roof2.rotation.y = Math.PI / 4;
        }
    }

    // -----------------------------------------------------------------------
    // Old medieval town walls with towers along the ridge
    // -----------------------------------------------------------------------
    function buildOldWalls() {
        var matWall = makeLambert(0x8B7355);
        var matTower = makeLambert(0x7A6248);

        var wx = BASE_X - 500;
        var wz = BASE_Z - 160;
        var i;

        // Wall sections running east-west along ridge
        for (i = 0; i < 7; i++) {
            var wallSec = makeMesh(
                new THREE.BoxGeometry(60, 10, 5),
                matWall
            );
            wallSec.position.set(wx + i * 65, BASE_Y + 5, wz);
        }

        // Mural towers at intervals
        for (i = 0; i < 4; i++) {
            var muralTower = makeMesh(
                new THREE.CylinderGeometry(7, 8, 16, 8),
                matTower
            );
            muralTower.position.set(wx + i * 130, BASE_Y + 8, wz);

            // Tower battlements
            var tBattle = makeMesh(
                new THREE.CylinderGeometry(8, 8, 3, 8),
                matTower
            );
            tBattle.position.set(wx + i * 130, BASE_Y + 17, wz);
        }

        // South wall section (perpendicular run)
        for (i = 0; i < 4; i++) {
            var wallS = makeMesh(
                new THREE.BoxGeometry(5, 10, 55),
                matWall
            );
            wallS.position.set(wx, BASE_Y + 5, wz + i * 60);
        }

        // Corner tower south-west
        var cornerTower = makeMesh(
            new THREE.CylinderGeometry(8, 9, 18, 8),
            matTower
        );
        cornerTower.position.set(wx, BASE_Y + 9, wz + 180);
    }

    // -----------------------------------------------------------------------
    // Newgrange — megalithic passage tomb mound visible to west
    // -----------------------------------------------------------------------
    function buildNewgrange() {
        var matMound = makeLambert(0x556B2F);
        var matKerb = makeLambert(0xC0C0C0);
        var matQuartz = makeLambert(0xF5F5F5);

        var nx = BASE_X - 1400;
        var nz = BASE_Z - 60;

        // Main mound — large flattened hemisphere
        var mound = makeMesh(
            new THREE.SphereGeometry(50, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            matMound
        );
        mound.position.set(nx, BASE_Y, nz);

        // Mound top flattening cap
        var moundTop = makeMesh(
            new THREE.CylinderGeometry(48, 48, 8, 12),
            matMound
        );
        moundTop.position.set(nx, BASE_Y + 18, nz);

        // White quartz facade facing south
        var quartz = makeMesh(
            new THREE.BoxGeometry(70, 22, 4),
            matQuartz
        );
        quartz.position.set(nx, BASE_Y + 11, nz + 48);

        // Entrance stone (decorated)
        var entrance = makeMesh(
            new THREE.BoxGeometry(12, 5, 5),
            matKerb
        );
        entrance.position.set(nx, BASE_Y + 2, nz + 51);

        // Kerb stones around perimeter (12 stones)
        var i;
        for (i = 0; i < 12; i++) {
            var kerbAng = (i / 12) * Math.PI * 2;
            var kerb = makeMesh(
                new THREE.BoxGeometry(4, 4, 3),
                matKerb
            );
            kerb.position.set(
                nx + Math.cos(kerbAng) * 54,
                BASE_Y + 2,
                nz + Math.sin(kerbAng) * 54
            );
            kerb.rotation.y = kerbAng;
        }

        // Standing stones nearby
        var matStone = makeLambert(0xA0A0A0);
        var stonePositions = [
            [nx + 80, nz + 20],
            [nx - 80, nz - 10],
            [nx + 60, nz - 70],
            [nx - 70, nz + 60]
        ];
        for (i = 0; i < stonePositions.length; i++) {
            var stoneH = 6 + i * 1.5;
            var standStone = makeMesh(
                new THREE.BoxGeometry(2, stoneH, 2),
                matStone
            );
            standStone.position.set(stonePositions[i][0], BASE_Y + stoneH / 2, stonePositions[i][1]);
        }
    }

    // -----------------------------------------------------------------------
    // Boyne Valley farmland — pastoral fields and hedgerows
    // -----------------------------------------------------------------------
    function buildBoyneFarmland() {
        var matFieldLight = makeLambert(0x228B22);
        var matFieldDark = makeLambert(0x1A6B1A);
        var matHedge = makeLambert(0x5C3317);
        var matTree = makeLambert(0x2D5A1B);
        var matTreeTrunk = makeLambert(0x5C3317);

        var fx = BASE_X + 900;
        var fz = BASE_Z + 60;
        var i;

        // Field patches alternating shades
        for (i = 0; i < 8; i++) {
            var fieldMat = (i % 2 === 0) ? matFieldLight : matFieldDark;
            var fieldPatch = makeMesh(
                new THREE.BoxGeometry(120, 1, 100),
                fieldMat
            );
            fieldPatch.position.set(fx + (i % 4) * 125, BASE_Y, fz + Math.floor(i / 4) * 105);
        }

        // Hedgerows between fields
        for (i = 0; i < 5; i++) {
            var hedgeRow = makeMesh(
                new THREE.BoxGeometry(4, 5, 100),
                matHedge
            );
            hedgeRow.position.set(fx + 60 + i * 125, BASE_Y + 2, fz + 50);
        }

        // Horizontal hedgerows
        for (i = 0; i < 3; i++) {
            var hedgeH = makeMesh(
                new THREE.BoxGeometry(500, 5, 4),
                matHedge
            );
            hedgeH.position.set(fx + 250, BASE_Y + 2, fz + i * 105);
        }

        // Scattered trees (trunk + foliage sphere)
        var treeSpots = [
            [fx + 50, fz + 30],
            [fx + 200, fz + 80],
            [fx + 350, fz + 20],
            [fx + 150, fz + 140],
            [fx + 450, fz + 160],
            [fx + 70, fz + 170]
        ];
        for (i = 0; i < treeSpots.length; i++) {
            var trunk = makeMesh(
                new THREE.CylinderGeometry(1.2, 1.8, 8, 6),
                matTreeTrunk
            );
            trunk.position.set(treeSpots[i][0], BASE_Y + 4, treeSpots[i][1]);

            var canopy = makeMesh(
                new THREE.SphereGeometry(5 + i * 0.5, 8, 6),
                matTree
            );
            canopy.position.set(treeSpots[i][0], BASE_Y + 12 + i * 0.3, treeSpots[i][1]);
        }

        // Farm outbuilding
        var matBarn = makeLambert(0xA0522D);
        var barn = makeMesh(new THREE.BoxGeometry(20, 10, 14), matBarn);
        barn.position.set(fx + 300, BASE_Y + 5, fz + 50);

        var barnRoof = makeMesh(new THREE.CylinderGeometry(0, 12, 7, 4), matBarn);
        barnRoof.position.set(fx + 300, BASE_Y + 13, fz + 50);
        barnRoof.rotation.y = Math.PI / 4;
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
