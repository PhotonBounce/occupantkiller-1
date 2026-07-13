window.DownpatrickSaint = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

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

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildHilltop();
        buildDownCathedral();
        buildSaintPatricksGrave();
        buildMoundOfDown();
        buildSaintPatrickCentre();
        buildDownpatrickTown();
        buildDownMuseum();
        buildInchAbbey();
        buildQuoileRiver();
        buildPilgrims();
        buildSaintPatrickStatue();
    }

    // ---- Hilltop base ----
    function buildHilltop() {
        // Raised hill platform the cathedral sits on
        var hillGeo = new THREE.CylinderGeometry(55, 75, 18, 12);
        var hillMat = makeLambert(0x4a6741);
        var hill = new THREE.Mesh(hillGeo, hillMat);
        hill.position.set(19440, 9, 0);
        addMesh(hill);

        // Graveyard ground
        var yardGeo = new THREE.BoxGeometry(90, 1, 90);
        var yardMat = makeLambert(0x3d5c34);
        var yard = new THREE.Mesh(yardGeo, yardMat);
        yard.position.set(19440, 18.5, 0);
        addMesh(yard);
    }

    // ---- Down Cathedral ----
    function buildDownCathedral() {
        var base = 19;

        // Nave - long central body
        var naveGeo = new THREE.BoxGeometry(20, 14, 48);
        var naveMat = makeLambert(0x808080);
        var nave = new THREE.Mesh(naveGeo, naveMat);
        nave.position.set(19440, base + 7, 0);
        addMesh(nave);

        // Nave roof (pitched)
        var naveRoofGeo = new THREE.CylinderGeometry(0, 11, 7, 4);
        var roofMat = makeLambert(0x606060);
        var naveRoof = new THREE.Mesh(naveRoofGeo, roofMat);
        naveRoof.rotation.y = Math.PI / 4;
        naveRoof.position.set(19440, base + 14 + 3.5, 0);
        addMesh(naveRoof);

        // Chancel - east end
        var chanGeo = new THREE.BoxGeometry(14, 12, 22);
        var chanMat = makeLambert(0x808080);
        var chancel = new THREE.Mesh(chanGeo, chanMat);
        chancel.position.set(19440, base + 6, -35);
        addMesh(chancel);

        var chanRoofGeo = new THREE.CylinderGeometry(0, 8, 6, 4);
        var chanRoof = new THREE.Mesh(chanRoofGeo, chanRoofGeo ? makeLambert(0x606060) : makeLambert(0x606060));
        chanRoof.rotation.y = Math.PI / 4;
        chanRoof.position.set(19440, base + 12 + 3, -35);
        addMesh(chanRoof);

        // Central tower
        var towerGeo = new THREE.BoxGeometry(12, 28, 12);
        var towerMat = makeLambert(0x757575);
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(19440, base + 14, -10);
        addMesh(tower);

        // Tower battlements (4 corner posts)
        var battGeo = new THREE.BoxGeometry(2.5, 3, 2.5);
        var battMat = makeLambert(0x707070);
        var bOffsets = [[-4.5, -4.5], [-4.5, 4.5], [4.5, -4.5], [4.5, 4.5]];
        for (var b = 0; b < bOffsets.length; b++) {
            var batt = new THREE.Mesh(battGeo, battMat);
            batt.position.set(19440 + bOffsets[b][0], base + 28 + 1.5, -10 + bOffsets[b][1]);
            addMesh(batt);
        }

        // Tower top cap
        var tCapGeo = new THREE.CylinderGeometry(0, 6, 5, 4);
        var tCap = new THREE.Mesh(tCapGeo, makeLambert(0x585858));
        tCap.rotation.y = Math.PI / 4;
        tCap.position.set(19440, base + 28 + 2.5, -10);
        addMesh(tCap);

        // North transept
        var ntGeo = new THREE.BoxGeometry(16, 12, 14);
        var ntMat = makeLambert(0x808080);
        var northTransept = new THREE.Mesh(ntGeo, ntMat);
        northTransept.position.set(19440 + 18, base + 6, -5);
        addMesh(northTransept);

        var ntRoofGeo = new THREE.CylinderGeometry(0, 9, 5, 4);
        var ntRoof = new THREE.Mesh(ntRoofGeo, makeLambert(0x606060));
        ntRoof.rotation.y = Math.PI / 4;
        ntRoof.position.set(19440 + 18, base + 12 + 2.5, -5);
        addMesh(ntRoof);

        // South transept
        var stGeo = new THREE.BoxGeometry(16, 12, 14);
        var stMat = makeLambert(0x808080);
        var southTransept = new THREE.Mesh(stGeo, stMat);
        southTransept.position.set(19440 - 18, base + 6, -5);
        addMesh(southTransept);

        var stRoofGeo = new THREE.CylinderGeometry(0, 9, 5, 4);
        var stRoof = new THREE.Mesh(stRoofGeo, makeLambert(0x606060));
        stRoof.rotation.y = Math.PI / 4;
        stRoof.position.set(19440 - 18, base + 12 + 2.5, -5);
        addMesh(stRoof);

        // West facade (entrance)
        var westGeo = new THREE.BoxGeometry(20, 16, 4);
        var westMat = makeLambert(0x787878);
        var westFace = new THREE.Mesh(westGeo, westMat);
        westFace.position.set(19440, base + 8, 26);
        addMesh(westFace);

        // West door arch (dark recess)
        var doorGeo = new THREE.BoxGeometry(4, 7, 1);
        var doorMat = makeLambert(0x333333);
        var door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(19440, base + 3.5, 28.5);
        addMesh(door);

        // Gothic window openings on nave (simple dark boxes)
        var winMat = makeLambert(0x222244);
        var winPositionsZ = [-15, 0, 15];
        for (var w = 0; w < winPositionsZ.length; w++) {
            var winN = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 3), winMat);
            winN.position.set(19440 + 10.5, base + 9, winPositionsZ[w]);
            addMesh(winN);
            var winS = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 3), winMat);
            winS.position.set(19440 - 10.5, base + 9, winPositionsZ[w]);
            addMesh(winS);
        }
    }

    // ---- Saint Patrick's Grave ----
    function buildSaintPatricksGrave() {
        var base = 19;
        // Large granite slab
        var slabGeo = new THREE.BoxGeometry(5, 0.8, 8);
        var slabMat = makeLambert(0x808080);
        var slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.set(19440 + 25, base + 0.9, 12);
        addMesh(slab);

        // "PATRIC" marker stones (small upright stones around slab)
        var markerMat = makeLambert(0x6e6e6e);
        var markerOffsets = [[-2, -4], [0, -4], [2, -4], [-2.5, 0], [2.5, 0]];
        for (var m = 0; m < markerOffsets.length; m++) {
            var mkGeo = new THREE.BoxGeometry(0.8, 1.6, 0.4);
            var mk = new THREE.Mesh(mkGeo, markerMat);
            mk.position.set(19440 + 25 + markerOffsets[m][0], base + 1.3, 12 + markerOffsets[m][1]);
            addMesh(mk);
        }

        // Surrounding low stone kerb
        var kerbMat = makeLambert(0x909090);
        var kerbGeo1 = new THREE.BoxGeometry(7, 0.5, 0.5);
        var kerbN = new THREE.Mesh(kerbGeo1, kerbMat);
        kerbN.position.set(19440 + 25, base + 0.5, 12 - 5);
        addMesh(kerbN);
        var kerbS = new THREE.Mesh(new THREE.BoxGeometry(7, 0.5, 0.5), kerbMat);
        kerbS.position.set(19440 + 25, base + 0.5, 12 + 5);
        addMesh(kerbS);
        var kerbE = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 10), kerbMat);
        kerbE.position.set(19440 + 25 + 3.5, base + 0.5, 12);
        addMesh(kerbE);
        var kerbW = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 10), kerbMat);
        kerbW.position.set(19440 + 25 - 3.5, base + 0.5, 12);
        addMesh(kerbW);

        // A few scattered graveyard headstones
        var headMat = makeLambert(0x7a7a7a);
        var hsPositions = [[10, 20], [15, 30], [-10, 25], [-20, 10], [20, -10], [-15, -20], [5, -28], [-25, -15]];
        for (var h = 0; h < hsPositions.length; h++) {
            var hsGeo = new THREE.BoxGeometry(1, 2.2, 0.4);
            var hs = new THREE.Mesh(hsGeo, headMat);
            hs.position.set(19440 + hsPositions[h][0], base + 1.1, hsPositions[h][1]);
            addMesh(hs);
            // Small top arch cap
            var hCapGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 6);
            var hCap = new THREE.Mesh(hCapGeo, headMat);
            hCap.position.set(19440 + hsPositions[h][0], base + 2.35, hsPositions[h][1]);
            addMesh(hCap);
        }
    }

    // ---- Mound of Down ----
    function buildMoundOfDown() {
        // Large Norman motte - earthen mound
        var motteGeo = new THREE.CylinderGeometry(22, 38, 20, 10);
        var motteMat = makeLambert(0x228B22);
        var motte = new THREE.Mesh(motteGeo, motteMat);
        motte.position.set(19440 + 90, 10, 30);
        addMesh(motte);

        // Flat top plateau
        var plateauGeo = new THREE.CylinderGeometry(20, 20, 1, 10);
        var plateauMat = makeLambert(0x1e7a1e);
        var plateau = new THREE.Mesh(plateauGeo, plateauMat);
        plateau.position.set(19440 + 90, 20.5, 30);
        addMesh(plateau);

        // Small wooden keep remnant on top (ruins)
        var keepGeo = new THREE.BoxGeometry(8, 5, 8);
        var keepMat = makeLambert(0x5c4a2a);
        var keep = new THREE.Mesh(keepGeo, keepMat);
        keep.position.set(19440 + 90, 23.5, 30);
        addMesh(keep);

        // Surrounding ditch (low dark ring)
        var ditchGeo = new THREE.CylinderGeometry(42, 44, 2, 12);
        var ditchMat = makeLambert(0x1a4a1a);
        var ditch = new THREE.Mesh(ditchGeo, ditchMat);
        ditch.position.set(19440 + 90, 0.5, 30);
        addMesh(ditch);
    }

    // ---- Saint Patrick Centre (modern interpretive centre) ----
    function buildSaintPatrickCentre() {
        var base = 0;
        // Modern curved building - main hall
        var hallGeo = new THREE.BoxGeometry(30, 8, 18);
        var hallMat = makeLambert(0xc0c0c8);
        var hall = new THREE.Mesh(hallGeo, hallMat);
        hall.position.set(19440 - 70, base + 4, 60);
        addMesh(hall);

        // Glass-effect facade (lighter)
        var glassFGeo = new THREE.BoxGeometry(30, 8, 1);
        var glassFMat = makeLambert(0x8ab4cc);
        var glassF = new THREE.Mesh(glassFGeo, glassFMat);
        glassF.position.set(19440 - 70, base + 4, 69.5);
        addMesh(glassF);

        // Steel frame columns on front
        var colMat = makeLambert(0xa0a0a0);
        var colXOffsets = [-12, -6, 0, 6, 12];
        for (var c = 0; c < colXOffsets.length; c++) {
            var colGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
            var col = new THREE.Mesh(colGeo, colMat);
            col.position.set(19440 - 70 + colXOffsets[c], base + 4, 70);
            addMesh(col);
        }

        // Roof
        var roofGeo = new THREE.BoxGeometry(32, 1, 20);
        var roofMat = makeLambert(0x909098);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(19440 - 70, base + 8.5, 60);
        addMesh(roof);

        // Entrance canopy
        var canopyGeo = new THREE.BoxGeometry(10, 0.5, 5);
        var canopyMat = makeLambert(0xb0b0b8);
        var canopy = new THREE.Mesh(canopyGeo, canopyMat);
        canopy.position.set(19440 - 70, base + 6.5, 73);
        addMesh(canopy);

        // Signage block
        var signGeo = new THREE.BoxGeometry(8, 2, 0.5);
        var signMat = makeLambert(0x2244aa);
        var sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(19440 - 70, base + 5, 71);
        addMesh(sign);

        // Car park surface
        var parkGeo = new THREE.BoxGeometry(50, 0.3, 30);
        var parkMat = makeLambert(0x555555);
        var park = new THREE.Mesh(parkGeo, parkMat);
        park.position.set(19440 - 70, base + 0.15, 90);
        addMesh(park);
    }

    // ---- Downpatrick Town ----
    function buildDownpatrickTown() {
        var base = 0;
        // English Street - row of Georgian townhouses north side
        var houseMat = makeLambert(0xCD5C5C);
        var roofMat = makeLambert(0x8B3030);
        var winMat = makeLambert(0x9ab8cc);
        var doorMat = makeLambert(0x4a2a0a);

        var engStreetHouses = [
            [19440 - 100, 0, -60],
            [19440 - 116, 0, -60],
            [19440 - 132, 0, -60],
            [19440 - 148, 0, -60],
            [19440 - 164, 0, -60]
        ];
        for (var e = 0; e < engStreetHouses.length; e++) {
            var hGeo = new THREE.BoxGeometry(14, 10, 10);
            var h = new THREE.Mesh(hGeo, houseMat);
            h.position.set(engStreetHouses[e][0], base + 5, engStreetHouses[e][2]);
            addMesh(h);
            // Roof
            var hrGeo = new THREE.CylinderGeometry(0, 8, 4, 4);
            var hr = new THREE.Mesh(hrGeo, roofMat);
            hr.rotation.y = Math.PI / 4;
            hr.position.set(engStreetHouses[e][0], base + 12, engStreetHouses[e][2]);
            addMesh(hr);
            // Windows
            var hw1 = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 2), winMat);
            hw1.position.set(engStreetHouses[e][0] - 4, base + 6, engStreetHouses[e][2] - 5.1);
            addMesh(hw1);
            var hw2 = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 2), winMat);
            hw2.position.set(engStreetHouses[e][0] + 4, base + 6, engStreetHouses[e][2] - 5.1);
            addMesh(hw2);
        }

        // Irish Street - south side
        var irishStreetHouses = [
            [19440 - 100, 0, -80],
            [19440 - 116, 0, -80],
            [19440 - 132, 0, -80],
            [19440 - 148, 0, -80]
        ];
        for (var ir = 0; ir < irishStreetHouses.length; ir++) {
            var ihGeo = new THREE.BoxGeometry(14, 9, 10);
            var ih = new THREE.Mesh(ihGeo, houseMat);
            ih.position.set(irishStreetHouses[ir][0], base + 4.5, irishStreetHouses[ir][2]);
            addMesh(ih);
            var ihrGeo = new THREE.CylinderGeometry(0, 8, 3.5, 4);
            var ihr = new THREE.Mesh(ihrGeo, roofMat);
            ihr.rotation.y = Math.PI / 4;
            ihr.position.set(irishStreetHouses[ir][0], base + 11.25, irishStreetHouses[ir][2]);
            addMesh(ihr);
        }

        // Scotch Street - perpendicular
        var scotchHouses = [
            [19440 - 180, 0, -60],
            [19440 - 180, 0, -73],
            [19440 - 180, 0, -86]
        ];
        for (var sc = 0; sc < scotchHouses.length; sc++) {
            var shGeo = new THREE.BoxGeometry(10, 10, 12);
            var sh = new THREE.Mesh(shGeo, houseMat);
            sh.position.set(scotchHouses[sc][0], base + 5, scotchHouses[sc][2]);
            addMesh(sh);
            var shrGeo = new THREE.CylinderGeometry(0, 7, 4, 4);
            var shr = new THREE.Mesh(shrGeo, roofMat);
            shr.rotation.y = Math.PI / 4;
            shr.position.set(scotchHouses[sc][0], base + 12, scotchHouses[sc][2]);
            addMesh(shr);
        }

        // Market Street pub / commercial block
        var pubGeo = new THREE.BoxGeometry(18, 11, 12);
        var pubMat = makeLambert(0xb04040);
        var pub = new THREE.Mesh(pubGeo, pubMat);
        pub.position.set(19440 - 130, base + 5.5, -96);
        addMesh(pub);
        var pubRoof = new THREE.Mesh(new THREE.BoxGeometry(18, 1.5, 12), makeLambert(0x7a2a2a));
        pubRoof.position.set(19440 - 130, base + 11.75, -96);
        addMesh(pubRoof);

        // Road surface - English Street
        var roadGeo = new THREE.BoxGeometry(100, 0.3, 8);
        var roadMat = makeLambert(0x444444);
        var road = new THREE.Mesh(roadGeo, roadMat);
        road.position.set(19440 - 140, 0.15, -68);
        addMesh(road);

        // Church of Ireland tower (town centre landmark)
        var ciTowerGeo = new THREE.BoxGeometry(9, 22, 9);
        var ciTower = new THREE.Mesh(ciTowerGeo, makeLambert(0x909090));
        ciTower.position.set(19440 - 200, base + 11, -70);
        addMesh(ciTower);
        var ciSpireGeo = new THREE.ConeGeometry(3, 12, 6);
        var ciSpire = new THREE.Mesh(ciSpireGeo, makeLambert(0x606060));
        ciSpire.position.set(19440 - 200, base + 28, -70);
        addMesh(ciSpire);
    }

    // ---- Down Museum (old jail) ----
    function buildDownMuseum() {
        var base = 0;
        // Main jail building - austere Georgian
        var jailGeo = new THREE.BoxGeometry(28, 14, 20);
        var jailMat = makeLambert(0x8a8a7a);
        var jail = new THREE.Mesh(jailGeo, jailMat);
        jail.position.set(19440 - 55, base + 7, -50);
        addMesh(jail);

        // Jail roof
        var jailRoofGeo = new THREE.BoxGeometry(30, 1.5, 22);
        var jailRoof = new THREE.Mesh(jailRoofGeo, makeLambert(0x6a6a5a));
        jailRoof.position.set(19440 - 55, base + 14.75, -50);
        addMesh(jailRoof);

        // Gatehouse / entrance tower
        var gateGeo = new THREE.BoxGeometry(10, 18, 10);
        var gateMat = makeLambert(0x7a7a6a);
        var gate = new THREE.Mesh(gateGeo, gateMat);
        gate.position.set(19440 - 55, base + 9, -38);
        addMesh(gate);

        // Gate arch (dark opening)
        var archGeo = new THREE.BoxGeometry(4, 6, 2);
        var archMat = makeLambert(0x222222);
        var arch = new THREE.Mesh(archGeo, archMat);
        arch.position.set(19440 - 55, base + 3, -33.5);
        addMesh(arch);

        // Museum wings (cell blocks)
        var wingMat = makeLambert(0x888878);
        var wingE = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 20), wingMat);
        wingE.position.set(19440 - 42, base + 5, -50);
        addMesh(wingE);
        var wingW = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 20), wingMat);
        wingW.position.set(19440 - 68, base + 5, -50);
        addMesh(wingW);

        // Museum sign board
        var signGeo = new THREE.BoxGeometry(10, 2.5, 0.5);
        var signMat = makeLambert(0x224466);
        var sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(19440 - 55, base + 4, -32.5);
        addMesh(sign);
    }

    // ---- Inch Abbey (Cistercian ruins across Quoile) ----
    function buildInchAbbey() {
        var base = 0;
        var ax = 19440 + 180;
        var az = -100;

        // Nave walls (ruined - partial height)
        var navWallMat = makeLambert(0x808080);

        var navN = new THREE.Mesh(new THREE.BoxGeometry(40, 8, 2), navWallMat);
        navN.position.set(ax, base + 4, az - 10);
        addMesh(navN);

        var navS = new THREE.Mesh(new THREE.BoxGeometry(40, 6, 2), navWallMat);
        navS.position.set(ax, base + 3, az + 10);
        addMesh(navS);

        // West facade (ruined, partial)
        var westGeo = new THREE.BoxGeometry(2, 10, 22);
        var westWall = new THREE.Mesh(westGeo, navWallMat);
        westWall.position.set(ax - 21, base + 5, az);
        addMesh(westWall);

        // Chancel (east end)
        var chanGeo = new THREE.BoxGeometry(16, 9, 20);
        var chanMat = makeLambert(0x787878);
        var chan = new THREE.Mesh(chanGeo, chanMat);
        chan.position.set(ax + 28, base + 4.5, az);
        addMesh(chan);

        // Chancel east window (ruined Gothic)
        var ewGeo = new THREE.BoxGeometry(2, 6, 5);
        var ewMat = makeLambert(0x3a3a3a);
        var ew = new THREE.Mesh(ewGeo, ewMat);
        ew.position.set(ax + 36.5, base + 5, az);
        addMesh(ew);

        // Cloister columns (N side)
        var cColMat = makeLambert(0x909090);
        for (var cc = 0; cc < 5; cc++) {
            var cColGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 6);
            var cCol = new THREE.Mesh(cColGeo, cColMat);
            cCol.position.set(ax - 10 + cc * 6, base + 2.5, az + 18);
            addMesh(cCol);
        }

        // Cloister ground
        var cloisGeo = new THREE.BoxGeometry(30, 0.4, 12);
        var cloisMat = makeLambert(0x6a6a6a);
        var clois = new THREE.Mesh(cloisGeo, cloisMat);
        clois.position.set(ax, base + 0.2, az + 16);
        addMesh(clois);

        // Ruined tower stub
        var rTowerGeo = new THREE.BoxGeometry(8, 12, 8);
        var rTower = new THREE.Mesh(rTowerGeo, makeLambert(0x6e6e6e));
        rTower.position.set(ax - 5, base + 6, az - 8);
        addMesh(rTower);

        // Scattered rubble stones
        var rubMat = makeLambert(0x888880);
        var rubblePositions = [
            [ax + 10, az + 5],
            [ax - 15, az + 12],
            [ax + 20, az - 15],
            [ax - 5, az - 18],
            [ax + 35, az + 8]
        ];
        for (var r = 0; r < rubblePositions.length; r++) {
            var rubGeo = new THREE.BoxGeometry(1.5 + Math.sin(r) * 0.5, 0.8, 1.2 + Math.cos(r) * 0.4);
            var rub = new THREE.Mesh(rubGeo, rubMat);
            rub.position.set(rubblePositions[r][0], base + 0.4, rubblePositions[r][1]);
            addMesh(rub);
        }
    }

    // ---- Quoile River and Countryside Park ----
    function buildQuoileRiver() {
        // Main river channel - series of flat box sections
        var riverMat = makeLambert(0x006994);

        // River running roughly east-west
        var riv1 = new THREE.Mesh(new THREE.BoxGeometry(300, 0.4, 20), riverMat);
        riv1.position.set(19440 + 80, 0.2, -130);
        addMesh(riv1);

        // Wider estuary section
        var riv2 = new THREE.Mesh(new THREE.BoxGeometry(120, 0.4, 40), riverMat);
        riv2.position.set(19440 + 200, 0.2, -140);
        addMesh(riv2);

        // Quoile Countryside Park - former tidal wetland (flat green expanse)
        var wetMat = makeLambert(0x3a7a3a);
        var wet1 = new THREE.Mesh(new THREE.BoxGeometry(200, 0.3, 80), wetMat);
        wet1.position.set(19440 + 120, 0.15, -170);
        addMesh(wet1);

        var wet2 = new THREE.Mesh(new THREE.BoxGeometry(160, 0.3, 60), wetMat);
        wet2.position.set(19440 + 50, 0.15, -155);
        addMesh(wet2);

        // Quoile Barrier / sluice (rectangular dam structure)
        var barrierGeo = new THREE.BoxGeometry(5, 4, 28);
        var barrierMat = makeLambert(0x505050);
        var barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(19440 + 230, 2, -130);
        addMesh(barrier);

        // Riverside footpath
        var pathGeo = new THREE.BoxGeometry(300, 0.3, 3);
        var pathMat = makeLambert(0x8a7a5a);
        var path = new THREE.Mesh(pathGeo, pathMat);
        path.position.set(19440 + 80, 0.15, -118);
        addMesh(path);

        // Reeds / marsh grass (thin cylinders along bank)
        var reedMat = makeLambert(0x5a8a2a);
        var reedPositions = [
            [19440 + 20, -122], [19440 + 40, -125], [19440 + 60, -121],
            [19440 + 80, -124], [19440 + 100, -122], [19440 + 120, -126],
            [19440 + 150, -123], [19440 + 170, -125]
        ];
        for (var rd = 0; rd < reedPositions.length; rd++) {
            var reedGeo = new THREE.CylinderGeometry(0.2, 0.3, 2.5 + Math.sin(rd) * 0.5, 4);
            var reed = new THREE.Mesh(reedGeo, reedMat);
            reed.position.set(reedPositions[rd][0], 1.25, reedPositions[rd][1]);
            addMesh(reed);
        }
    }

    // ---- St Patrick's Day Pilgrims ----
    function buildPilgrims() {
        var base = 19;
        // Pilgrim path up the hill (box figures)
        var bodyMat = makeLambert(0x8B4513);
        var headMat = makeLambert(0xD2A679);
        var staffMat = makeLambert(0x5c3a10);

        var pilgrimPositions = [
            [19440 + 50, base, 15],
            [19440 + 45, base + 2, 10],
            [19440 + 40, base + 4, 6],
            [19440 + 55, base, 20],
            [19440 + 60, base - 1, 25],
            [19440 + 35, base + 5, 2]
        ];

        for (var p = 0; p < pilgrimPositions.length; p++) {
            var px = pilgrimPositions[p][0];
            var py = pilgrimPositions[p][1];
            var pz = pilgrimPositions[p][2];

            // Body
            var bodyGeo = new THREE.BoxGeometry(1.2, 2.4, 0.8);
            var body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.set(px, py + 1.2, pz);
            addMesh(body);

            // Head
            var headGeo = new THREE.SphereGeometry(0.45, 6, 5);
            var head = new THREE.Mesh(headGeo, headMat);
            head.position.set(px, py + 2.85, pz);
            addMesh(head);

            // Pilgrim staff
            var staffGeo = new THREE.CylinderGeometry(0.07, 0.07, 3.2, 4);
            var staff = new THREE.Mesh(staffGeo, staffMat);
            staff.position.set(px + 0.7, py + 1.6, pz);
            addMesh(staff);
        }
    }

    // ---- Saint Patrick Statue ----
    function buildSaintPatrickStatue() {
        var base = 19;
        // Plinth / pedestal
        var plinthGeo = new THREE.BoxGeometry(3.5, 4, 3.5);
        var plinthMat = makeLambert(0x888888);
        var plinth = new THREE.Mesh(plinthGeo, plinthMat);
        plinth.position.set(19440 - 25, base + 2, -20);
        addMesh(plinth);

        // Lower plinth step
        var stepGeo = new THREE.BoxGeometry(4.5, 1, 4.5);
        var step = new THREE.Mesh(stepGeo, plinthMat);
        step.position.set(19440 - 25, base + 0.5, -20);
        addMesh(step);

        // Body (tall cylinder - robed figure)
        var statBodyGeo = new THREE.CylinderGeometry(0.8, 1.1, 5, 8);
        var statMat = makeLambert(0xC0C0C0);
        var statBody = new THREE.Mesh(statBodyGeo, statMat);
        statBody.position.set(19440 - 25, base + 4 + 2.5, -20);
        addMesh(statBody);

        // Head
        var statHeadGeo = new THREE.SphereGeometry(0.7, 8, 7);
        var statHead = new THREE.Mesh(statHeadGeo, statMat);
        statHead.position.set(19440 - 25, base + 4 + 5.7, -20);
        addMesh(statHead);

        // Bishop's mitre (tall cone on head)
        var mitreGeo = new THREE.ConeGeometry(0.45, 1.4, 6);
        var mitreMat = makeLambert(0xd0d0d0);
        var mitre = new THREE.Mesh(mitreGeo, mitreMat);
        mitre.position.set(19440 - 25, base + 4 + 6.8, -20);
        addMesh(mitre);

        // Left outstretched arm
        var armLGeo = new THREE.BoxGeometry(3.5, 0.5, 0.5);
        var armL = new THREE.Mesh(armLGeo, statMat);
        armL.position.set(19440 - 25 - 2.2, base + 4 + 3.5, -20);
        addMesh(armL);

        // Right outstretched arm
        var armRGeo = new THREE.BoxGeometry(3.5, 0.5, 0.5);
        var armR = new THREE.Mesh(armRGeo, statMat);
        armR.position.set(19440 - 25 + 2.2, base + 4 + 3.5, -20);
        addMesh(armR);

        // Left hand (small box)
        var handLGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        var handL = new THREE.Mesh(handLGeo, statMat);
        handL.position.set(19440 - 25 - 4.1, base + 4 + 3.5, -20);
        addMesh(handL);

        // Right hand (small box)
        var handRGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        var handR = new THREE.Mesh(handRGeo, statMat);
        handR.position.set(19440 - 25 + 4.1, base + 4 + 3.5, -20);
        addMesh(handR);

        // Pastoral staff / crozier in left hand
        var crozGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 4);
        var crozMat = makeLambert(0xaaaaaa);
        var croz = new THREE.Mesh(crozGeo, crozMat);
        croz.position.set(19440 - 25 - 4.1, base + 4 + 6, -20);
        addMesh(croz);

        // Crozier top curl (small sphere)
        var crozTopGeo = new THREE.SphereGeometry(0.25, 5, 4);
        var crozTop = new THREE.Mesh(crozTopGeo, crozMat);
        crozTop.position.set(19440 - 25 - 4.1, base + 4 + 9, -20);
        addMesh(crozTop);

        // Shamrock symbol at base of plinth (three small spheres)
        var shamMat = makeLambert(0x228B22);
        var shamOffsets = [[0, 0.3], [0.3, 0], [-0.3, 0]];
        for (var s = 0; s < shamOffsets.length; s++) {
            var leafGeo = new THREE.SphereGeometry(0.28, 5, 4);
            var leaf = new THREE.Mesh(leafGeo, shamMat);
            leaf.position.set(19440 - 25 + shamOffsets[s][0], base + 0.35, -20 + shamOffsets[s][1]);
            addMesh(leaf);
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
