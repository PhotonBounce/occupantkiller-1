window.CroaghPatrick = (function() {
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
        buildMountain();
        buildSummitChapel();
        buildPilgrimPath();
        buildPilgrims();
        buildStationRocks();
        buildClewBay();
        buildDrumlinIslands();
        buildMurriskAbbey();
        buildStatueOfPatrick();
        buildVisitorFacilities();
        buildFamineMemorial();
        buildVegetation();
        buildScreeTalus();
    }

    function buildMountain() {
        var cx = 18320;
        var mat0 = makeLambert(0x556B2F);
        var mat1 = makeLambert(0x4A5E29);
        var mat2 = makeLambert(0x808080);
        var mat3 = makeLambert(0x6B6B6B);

        // Base lower green slopes — wide flat box
        var base = new THREE.Mesh(new THREE.BoxGeometry(1200, 60, 900), mat0);
        base.position.set(cx, 30, 0);
        addMesh(base);

        // Lower slope tier 1
        var s1 = new THREE.Mesh(new THREE.BoxGeometry(900, 90, 700), mat0);
        s1.position.set(cx, 105, 0);
        addMesh(s1);

        // Lower slope tier 2
        var s2 = new THREE.Mesh(new THREE.BoxGeometry(700, 100, 560), mat1);
        s2.position.set(cx, 200, 0);
        addMesh(s2);

        // Mid slope tier 3
        var s3 = new THREE.Mesh(new THREE.BoxGeometry(520, 110, 420), mat1);
        s3.position.set(cx, 305, 0);
        addMesh(s3);

        // Upper slope tier 4 — transition to scree
        var s4 = new THREE.Mesh(new THREE.BoxGeometry(380, 100, 310), mat2);
        s4.position.set(cx, 410, 0);
        addMesh(s4);

        // Scree tier 5
        var s5 = new THREE.Mesh(new THREE.BoxGeometry(260, 90, 210), mat2);
        s5.position.set(cx, 505, 0);
        addMesh(s5);

        // Scree tier 6
        var s6 = new THREE.Mesh(new THREE.BoxGeometry(170, 80, 140), mat3);
        s6.position.set(cx, 590, 0);
        addMesh(s6);

        // Near-summit tier 7
        var s7 = new THREE.Mesh(new THREE.BoxGeometry(100, 70, 85), mat3);
        s7.position.set(cx, 665, 0);
        addMesh(s7);

        // Summit cone peak box
        var summit = new THREE.Mesh(new THREE.BoxGeometry(55, 80, 50), mat2);
        summit.position.set(cx, 740, 0);
        addMesh(summit);

        // Very tip cone
        var tip = new THREE.Mesh(new THREE.ConeGeometry(28, 60, 6), mat2);
        tip.position.set(cx, 810, 0);
        addMesh(tip);

        // Flanking buttress left
        var buttressL = new THREE.Mesh(new THREE.BoxGeometry(200, 200, 160), mat1);
        buttressL.position.set(cx - 340, 160, 80);
        addMesh(buttressL);

        // Flanking buttress right
        var buttressR = new THREE.Mesh(new THREE.BoxGeometry(200, 180, 160), mat1);
        buttressR.position.set(cx + 300, 150, -60);
        addMesh(buttressR);

        // South-west ridge
        var ridge = new THREE.Mesh(new THREE.BoxGeometry(300, 60, 80), mat2);
        ridge.position.set(cx - 200, 520, 60);
        ridge.rotation.y = 0.3;
        addMesh(ridge);
    }

    function buildSummitChapel() {
        var cx = 18320;
        var summit_y = 790;
        var matWhite = makeLambert(0xF5F5F5);
        var matGrey = makeLambert(0x909090);
        var matSlate = makeLambert(0x505050);

        // Chapel nave body
        var nave = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 14), matWhite);
        nave.position.set(cx, summit_y + 9, 0);
        addMesh(nave);

        // Chapel stone roof (cone)
        var roof = new THREE.Mesh(new THREE.ConeGeometry(14, 12, 4), matSlate);
        roof.position.set(cx, summit_y + 24, 0);
        roof.rotation.y = Math.PI / 4;
        addMesh(roof);

        // Chapel gable east wall
        var gableE = new THREE.Mesh(new THREE.BoxGeometry(4, 18, 14), matGrey);
        gableE.position.set(cx + 13, summit_y + 9, 0);
        addMesh(gableE);

        // Chapel gable west wall
        var gableW = new THREE.Mesh(new THREE.BoxGeometry(4, 18, 14), matGrey);
        gableW.position.set(cx - 13, summit_y + 9, 0);
        addMesh(gableW);

        // Small bell-cote tower
        var bellcote = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 6), matWhite);
        bellcote.position.set(cx - 11, summit_y + 23, 0);
        addMesh(bellcote);

        // Bell cote cone
        var bellRoof = new THREE.Mesh(new THREE.ConeGeometry(5, 8, 4), matSlate);
        bellRoof.position.set(cx - 11, summit_y + 32, 0);
        bellRoof.rotation.y = Math.PI / 4;
        addMesh(bellRoof);
    }

    function buildPilgrimPath() {
        var cx = 18320;
        var matPath = makeLambert(0x999999);

        // Zigzag path segments up the mountain face — thin box segments
        var segments = [
            { x: cx - 120, y: 80,  z: 80,  rx: 0,    ry: 0.4,  w: 180, h: 6, d: 14 },
            { x: cx - 20,  y: 140, z: 30,  rx: 0.18, ry: -0.3, w: 160, h: 6, d: 14 },
            { x: cx + 100, y: 200, z: -50, rx: 0.22, ry: 0.5,  w: 170, h: 6, d: 14 },
            { x: cx + 20,  y: 265, z: 60,  rx: 0.25, ry: -0.4, w: 155, h: 6, d: 14 },
            { x: cx - 100, y: 330, z: 20,  rx: 0.28, ry: 0.35, w: 150, h: 6, d: 14 },
            { x: cx - 10,  y: 400, z: -40, rx: 0.30, ry: -0.5, w: 140, h: 6, d: 12 },
            { x: cx + 80,  y: 465, z: 10,  rx: 0.32, ry: 0.45, w: 130, h: 6, d: 12 },
            { x: cx,       y: 530, z: 30,  rx: 0.35, ry: -0.3, w: 110, h: 6, d: 12 },
            { x: cx - 60,  y: 595, z: -20, rx: 0.38, ry: 0.3,  w: 100, h: 6, d: 10 },
            { x: cx,       y: 655, z: 10,  rx: 0.40, ry: 0.1,  w: 80,  h: 6, d: 10 }
        ];

        for (var i = 0; i < segments.length; i++) {
            var s = segments[i];
            var seg = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), matPath);
            seg.position.set(s.x, s.y, s.z);
            seg.rotation.x = s.rx;
            seg.rotation.y = s.ry;
            addMesh(seg);
        }
    }

    function buildPilgrims() {
        var cx = 18320;
        var matPilgrim = makeLambert(0x4A3728);
        var matPilgrimAlt = makeLambert(0x2C3E50);
        var matPilgrimLight = makeLambert(0xC8A882);

        var pilgrimData = [
            { x: cx - 130, y: 100, z: 78 },
            { x: cx - 110, y: 105, z: 85 },
            { x: cx - 90,  y: 108, z: 75 },
            { x: cx - 70,  y: 112, z: 82 },
            { x: cx - 30,  y: 148, z: 28 },
            { x: cx - 10,  y: 152, z: 35 },
            { x: cx + 10,  y: 155, z: 22 },
            { x: cx + 85,  y: 208, z: -48 },
            { x: cx + 105, y: 212, z: -55 },
            { x: cx + 120, y: 215, z: -42 },
            { x: cx + 10,  y: 272, z: 58 },
            { x: cx - 10,  y: 276, z: 65 },
            { x: cx - 30,  y: 280, z: 55 },
            { x: cx - 50,  y: 284, z: 62 },
            { x: cx - 110, y: 338, z: 18 },
            { x: cx - 90,  y: 342, z: 25 },
            { x: cx - 70,  y: 346, z: 15 },
            { x: cx - 20,  y: 408, z: -38 },
            { x: cx,       y: 412, z: -45 },
            { x: cx + 20,  y: 416, z: -32 },
            { x: cx + 70,  y: 472, z: 8 },
            { x: cx + 90,  y: 476, z: 15 },
            { x: cx + 55,  y: 538, z: 28 },
            { x: cx + 35,  y: 542, z: 35 },
            { x: cx - 55,  y: 602, z: -18 },
            { x: cx - 35,  y: 606, z: -12 },
            { x: cx - 10,  y: 662, z: 8 },
            { x: cx + 10,  y: 666, z: 14 }
        ];

        for (var i = 0; i < pilgrimData.length; i++) {
            var pd = pilgrimData[i];
            var mat = (i % 3 === 0) ? matPilgrimLight : (i % 2 === 0) ? matPilgrimAlt : matPilgrim;

            // Body
            var body = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 3), mat);
            body.position.set(pd.x, pd.y + 4, pd.z);
            addMesh(body);

            // Head
            var head = new THREE.Mesh(new THREE.SphereGeometry(2, 4, 4), mat);
            head.position.set(pd.x, pd.y + 11, pd.z);
            addMesh(head);
        }
    }

    function buildStationRocks() {
        var cx = 18320;
        var matCairn = makeLambert(0x808080);

        var stations = [
            { x: cx - 140, y: 85,  z: 90 },
            { x: cx + 40,  y: 195, z: -30 },
            { x: cx - 80,  y: 310, z: 40 },
            { x: cx + 50,  y: 430, z: -20 },
            { x: cx - 40,  y: 560, z: 20 },
            { x: cx,       y: 650, z: 5 }
        ];

        for (var i = 0; i < stations.length; i++) {
            var st = stations[i];
            // Cairn base stone
            var c1 = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 7), matCairn);
            c1.position.set(st.x, st.y + 2.5, st.z);
            addMesh(c1);
            // Mid stone
            var c2 = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 5), matCairn);
            c2.position.set(st.x + 0.5, st.y + 7, st.z - 0.5);
            addMesh(c2);
            // Top stone
            var c3 = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4), matCairn);
            c3.position.set(st.x - 0.3, st.y + 11, st.z + 0.3);
            addMesh(c3);
        }
    }

    function buildClewBay() {
        var cx = 18320;
        var matWater = makeLambert(0x1E6BA8);
        var matShallow = makeLambert(0x2980B9);

        // Main Clew Bay body of water
        var bay = new THREE.Mesh(new THREE.BoxGeometry(2200, 8, 1400), matWater);
        bay.position.set(cx - 800, 0, 600);
        addMesh(bay);

        // Inner bay shallows
        var shallows = new THREE.Mesh(new THREE.BoxGeometry(800, 5, 500), matShallow);
        shallows.position.set(cx - 200, 1, 450);
        addMesh(shallows);

        // Killary fjord inlet suggestion
        var inlet = new THREE.Mesh(new THREE.BoxGeometry(400, 6, 160), matWater);
        inlet.position.set(cx + 600, 0, 750);
        addMesh(inlet);
    }

    function buildDrumlinIslands() {
        var cx = 18320;
        var matIsland = makeLambert(0x228B22);
        var matIslandDark = makeLambert(0x1A6B1A);

        // 365 drumlin islands — batch them as clusters of boxes
        var islandPositions = [];
        var seed = 0;
        function pseudoRand() {
            seed = (seed * 1664525 + 1013904223) & 0x7FFFFFFF;
            return seed / 0x7FFFFFFF;
        }

        for (var i = 0; i < 365; i++) {
            var angle = pseudoRand() * Math.PI * 2;
            var radius = 200 + pseudoRand() * 900;
            var ix = (cx - 800) + Math.cos(angle) * radius;
            var iz = 600 + Math.sin(angle) * radius * 0.6;
            var iw = 8 + pseudoRand() * 30;
            var ih = 3 + pseudoRand() * 10;
            var id = 6 + pseudoRand() * 22;
            islandPositions.push({ x: ix, y: ih / 2 + 4, z: iz, w: iw, h: ih, d: id });
        }

        for (var j = 0; j < islandPositions.length; j++) {
            var ip = islandPositions[j];
            var mat = (j % 5 === 0) ? matIslandDark : matIsland;
            var island = new THREE.Mesh(new THREE.BoxGeometry(ip.w, ip.h, ip.d), mat);
            island.position.set(ip.x, ip.y, ip.z);
            addMesh(island);
        }
    }

    function buildMurriskAbbey() {
        var cx = 18320;
        var matRuin = makeLambert(0x8B7355);
        var matRuinDark = makeLambert(0x6B5535);

        // Abbey nave north wall
        var naveN = new THREE.Mesh(new THREE.BoxGeometry(60, 18, 3), matRuin);
        naveN.position.set(cx - 300, 9, 260);
        addMesh(naveN);

        // Abbey nave south wall
        var naveS = new THREE.Mesh(new THREE.BoxGeometry(60, 18, 3), matRuin);
        naveS.position.set(cx - 300, 9, 296);
        addMesh(naveS);

        // Abbey east gable wall
        var gableE = new THREE.Mesh(new THREE.BoxGeometry(3, 22, 36), matRuin);
        gableE.position.set(cx - 270, 11, 278);
        addMesh(gableE);

        // Abbey west gable wall (ruined, shorter)
        var gableW = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 36), matRuinDark);
        gableW.position.set(cx - 330, 7, 278);
        addMesh(gableW);

        // Abbey tower
        var tower = new THREE.Mesh(new THREE.BoxGeometry(14, 35, 14), matRuin);
        tower.position.set(cx - 270, 17, 278);
        addMesh(tower);

        // Tower battlements
        var battlement1 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), matRuinDark);
        battlement1.position.set(cx - 274, 37, 274);
        addMesh(battlement1);
        var battlement2 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), matRuinDark);
        battlement2.position.set(cx - 266, 37, 274);
        addMesh(battlement2);
        var battlement3 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), matRuinDark);
        battlement3.position.set(cx - 274, 37, 282);
        addMesh(battlement3);
        var battlement4 = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 5), matRuinDark);
        battlement4.position.set(cx - 266, 37, 282);
        addMesh(battlement4);

        // Chancel arch remnant
        var archL = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 3), matRuin);
        archL.position.set(cx - 285, 8, 272);
        addMesh(archL);
        var archR = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 3), matRuin);
        archR.position.set(cx - 285, 8, 284);
        addMesh(archR);
        var archTop = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 15), matRuin);
        archTop.position.set(cx - 285, 17, 278);
        addMesh(archTop);

        // Floor rubble
        var rubble = new THREE.Mesh(new THREE.BoxGeometry(50, 2, 28), matRuinDark);
        rubble.position.set(cx - 300, 1, 278);
        addMesh(rubble);
    }

    function buildStatueOfPatrick() {
        var cx = 18320;
        var matBronze = makeLambert(0xC0C0C0);
        var matBase = makeLambert(0x808080);

        // Plinth / base
        var plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 10), matBase);
        plinth.position.set(cx - 180, 3, 200);
        addMesh(plinth);

        // Sub-plinth step
        var step = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 14), matBase);
        step.position.set(cx - 180, 1.5, 200);
        addMesh(step);

        // Body (cylinder)
        var body = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 22, 8), matBronze);
        body.position.set(cx - 180, 17, 200);
        addMesh(body);

        // Head (sphere)
        var head = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), matBronze);
        head.position.set(cx - 180, 32, 200);
        addMesh(head);

        // Mitre/bishop hat
        var mitre = new THREE.Mesh(new THREE.ConeGeometry(3, 7, 4), matBronze);
        mitre.position.set(cx - 180, 38, 200);
        addMesh(mitre);

        // Left arm outstretched
        var armL = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 3), matBronze);
        armL.position.set(cx - 189, 26, 200);
        addMesh(armL);

        // Right arm outstretched (raised blessing gesture — slight angle)
        var armR = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 3), matBronze);
        armR.position.set(cx - 171, 28, 200);
        armR.rotation.z = -0.3;
        addMesh(armR);

        // Crozier staff
        var staff = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 26, 4), matBronze);
        staff.position.set(cx - 185, 19, 200);
        addMesh(staff);
    }

    function buildVisitorFacilities() {
        var cx = 18320;
        var matCentre = makeLambert(0xE0E0E0);
        var matRoof = makeLambert(0x607D8B);
        var matCarpark = makeLambert(0x424242);
        var matRoad = makeLambert(0x555555);

        // Visitor centre main building
        var vcMain = new THREE.Mesh(new THREE.BoxGeometry(55, 12, 30), matCentre);
        vcMain.position.set(cx - 420, 6, 160);
        addMesh(vcMain);

        // Visitor centre roof
        var vcRoof = new THREE.Mesh(new THREE.BoxGeometry(57, 4, 32), matRoof);
        vcRoof.position.set(cx - 420, 14, 160);
        addMesh(vcRoof);

        // Visitor centre annex
        var vcAnnex = new THREE.Mesh(new THREE.BoxGeometry(25, 10, 20), matCentre);
        vcAnnex.position.set(cx - 465, 5, 160);
        addMesh(vcAnnex);

        // Car park surface
        var carpark = new THREE.Mesh(new THREE.BoxGeometry(200, 2, 100), matCarpark);
        carpark.position.set(cx - 540, 1, 160);
        addMesh(carpark);

        // Access road
        var road = new THREE.Mesh(new THREE.BoxGeometry(400, 2, 16), matRoad);
        road.position.set(cx - 300, 1, 120);
        road.rotation.y = 0.15;
        addMesh(road);

        // Toilets/facilities block
        var toilet = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 12), matCentre);
        toilet.position.set(cx - 490, 4, 130);
        addMesh(toilet);
    }

    function buildFamineMemorial() {
        var cx = 18320;
        var matSculpt = makeLambert(0xC0C0C0);
        var matHull = makeLambert(0x9E9E9E);

        // Coffin ship hull — elongated box
        var hull = new THREE.Mesh(new THREE.BoxGeometry(70, 12, 22), matHull);
        hull.position.set(cx - 550, 6, 250);
        addMesh(hull);

        // Hull bow (tapered with cone)
        var bow = new THREE.Mesh(new THREE.ConeGeometry(11, 28, 3), matHull);
        bow.position.set(cx - 515, 6, 250);
        bow.rotation.z = Math.PI / 2;
        addMesh(bow);

        // Mast vertical
        var mast = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.5, 45, 4), matSculpt);
        mast.position.set(cx - 550, 29, 250);
        addMesh(mast);

        // Yard arm horizontal
        var yard = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 2), matSculpt);
        yard.position.set(cx - 550, 44, 250);
        addMesh(yard);

        // Skeletal figure 1 on bow
        var fig1body = new THREE.Mesh(new THREE.BoxGeometry(3, 9, 2), matSculpt);
        fig1body.position.set(cx - 522, 17, 248);
        addMesh(fig1body);
        var fig1head = new THREE.Mesh(new THREE.SphereGeometry(2, 4, 4), matSculpt);
        fig1head.position.set(cx - 522, 27, 248);
        addMesh(fig1head);

        // Skeletal figure 2 hunched
        var fig2body = new THREE.Mesh(new THREE.BoxGeometry(3, 7, 2), matSculpt);
        fig2body.position.set(cx - 538, 17, 246);
        fig2body.rotation.z = 0.4;
        addMesh(fig2body);
        var fig2head = new THREE.Mesh(new THREE.SphereGeometry(1.8, 4, 4), matSculpt);
        fig2head.position.set(cx - 535, 25, 246);
        addMesh(fig2head);

        // Skeletal figure 3 on deck
        var fig3body = new THREE.Mesh(new THREE.BoxGeometry(3, 8, 2), matSculpt);
        fig3body.position.set(cx - 560, 17, 252);
        addMesh(fig3body);
        var fig3head = new THREE.Mesh(new THREE.SphereGeometry(2, 4, 4), matSculpt);
        fig3head.position.set(cx - 560, 26, 252);
        addMesh(fig3head);

        // Informational plinth stone
        var plinth = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 12), matHull);
        plinth.position.set(cx - 550, 2, 280);
        addMesh(plinth);
    }

    function buildVegetation() {
        var cx = 18320;
        var matTree = makeLambert(0x228B22);
        var matTrunk = makeLambert(0x5C3317);
        var matHeather = makeLambert(0x9B5A8A);

        // Trees around visitor centre
        var treePositions = [
            { x: cx - 390, z: 130 },
            { x: cx - 380, z: 195 },
            { x: cx - 475, z: 125 },
            { x: cx - 460, z: 195 },
            { x: cx - 350, z: 150 },
            { x: cx - 500, z: 155 }
        ];

        for (var t = 0; t < treePositions.length; t++) {
            var tp = treePositions[t];
            var trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2, 10, 5), matTrunk);
            trunk.position.set(tp.x, 5, tp.z);
            addMesh(trunk);

            var canopy = new THREE.Mesh(new THREE.SphereGeometry(8, 5, 4), matTree);
            canopy.position.set(tp.x, 18, tp.z);
            addMesh(canopy);
        }

        // Heather patches on lower mountain slopes
        var heatherPatches = [
            { x: cx - 200, z: 40 },
            { x: cx + 150, z: -80 },
            { x: cx - 280, z: -60 },
            { x: cx + 240, z: 100 }
        ];

        for (var h = 0; h < heatherPatches.length; h++) {
            var hp = heatherPatches[h];
            var heather = new THREE.Mesh(new THREE.BoxGeometry(40, 5, 30), matHeather);
            heather.position.set(hp.x, 63, hp.z);
            addMesh(heather);
        }
    }

    function buildScreeTalus() {
        var cx = 18320;
        var matScree = makeLambert(0x757575);
        var matScreeDark = makeLambert(0x5A5A5A);

        // Loose scree / talus boulders on upper mountain face
        var boulderData = [
            { x: cx - 50,  y: 480, z: 30 },
            { x: cx + 80,  y: 500, z: -30 },
            { x: cx - 120, y: 440, z: 50 },
            { x: cx + 30,  y: 520, z: 60 },
            { x: cx - 80,  y: 560, z: -40 },
            { x: cx + 60,  y: 550, z: 20 },
            { x: cx - 20,  y: 610, z: 30 },
            { x: cx + 40,  y: 620, z: -20 }
        ];

        for (var b = 0; b < boulderData.length; b++) {
            var bd = boulderData[b];
            var mat = (b % 2 === 0) ? matScree : matScreeDark;
            var boulderW = 5 + (b % 4) * 2;
            var boulderH = 4 + (b % 3) * 2;
            var boulder = new THREE.Mesh(new THREE.BoxGeometry(boulderW, boulderH, boulderW - 1), mat);
            boulder.position.set(bd.x, bd.y + boulderH / 2, bd.z);
            boulder.rotation.y = b * 0.37;
            addMesh(boulder);
        }

        // Scree field spread (wider area)
        var matScreeField = makeLambert(0x8A8A8A);
        var screeField = new THREE.Mesh(new THREE.BoxGeometry(220, 3, 140), matScreeField);
        screeField.position.set(cx + 20, 425, 0);
        addMesh(screeField);
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
