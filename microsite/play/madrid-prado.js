window.MadridPrado = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 22560;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildPradoMuseum();
        buildRoyalPalace();
        buildPuertaDelSol();
        buildGranVia();
        buildRetiroPark();
        buildBernabeuStadium();
        buildMetroEntrances();
        buildSierraGuadarrama();
        buildPlazaMayor();
    }

    function buildGround() {
        // Ground plane via flat box
        var geo = new THREE.BoxGeometry(3000, 1, 3000);
        var m = makeMesh(geo, 0x8B7355);
        m.position.set(CX, -0.5, 0);

        // Road surfaces - Gran Via main road
        var road1 = new THREE.BoxGeometry(800, 0.3, 22);
        var rm1 = makeMesh(road1, 0x444444);
        rm1.position.set(CX + 200, 0.15, 300);

        // Secondary road
        var road2 = new THREE.BoxGeometry(22, 0.3, 600);
        var rm2 = makeMesh(road2, 0x444444);
        rm2.position.set(CX, 0.15, 0);
    }

    // =====================================================================
    // PRADO MUSEUM — neoclassical, 0xD4A870
    // =====================================================================
    function buildPradoMuseum() {
        var C = 0xD4A870;

        // Main long body — enormous neoclassical hall
        var body = new THREE.BoxGeometry(140, 22, 38);
        var bm = makeMesh(body, C);
        bm.position.set(CX - 200, 11, -80);

        // Roof cornice slab
        var cornice = new THREE.BoxGeometry(144, 2.5, 42);
        var cm = makeMesh(cornice, 0xC49860);
        cm.position.set(CX - 200, 23, -80);

        // Left wing
        var leftWing = new THREE.BoxGeometry(28, 22, 38);
        var lw = makeMesh(leftWing, C);
        lw.position.set(CX - 276, 11, -80);

        // Right wing
        var rightWing = new THREE.BoxGeometry(28, 22, 38);
        var rw = makeMesh(rightWing, C);
        rw.position.set(CX - 124, 11, -80);

        // Left corner tower
        var lt = new THREE.BoxGeometry(14, 28, 14);
        var ltm = makeMesh(lt, C);
        ltm.position.set(CX - 293, 14, -80);

        // Right corner tower
        var rt = new THREE.BoxGeometry(14, 28, 14);
        var rtm = makeMesh(rt, C);
        rtm.position.set(CX - 107, 14, -80);

        // Left tower roof
        var ltr = new THREE.BoxGeometry(16, 4, 16);
        var ltrm = makeMesh(ltr, 0xAA8850);
        ltrm.position.set(CX - 293, 29, -80);

        // Right tower roof
        var rtr = new THREE.BoxGeometry(16, 4, 16);
        var rtrm = makeMesh(rtr, 0xAA8850);
        rtrm.position.set(CX - 107, 29, -80);

        // Velazquez portal — grand entrance portico
        var portal = new THREE.BoxGeometry(20, 26, 8);
        var pm = makeMesh(portal, 0xC49860);
        pm.position.set(CX - 200, 13, -60);

        // Portal pediment (triangular effect via thin box)
        var pediment = new THREE.BoxGeometry(22, 5, 2);
        var ped = makeMesh(pediment, 0xB88848);
        ped.position.set(CX - 200, 27, -60);

        // Doric columns along facade — 8 columns
        for (var col = 0; col < 8; col++) {
            var colGeo = new THREE.CylinderGeometry(0.7, 0.8, 20, 8);
            var colM = makeMesh(colGeo, 0xDDB878);
            colM.position.set(CX - 260 + col * 18, 10, -62);
        }

        // Window frames on main body — 6 tall windows each side
        for (var w = 0; w < 6; w++) {
            var winGeo = new THREE.BoxGeometry(4, 8, 0.4);
            var win = makeMesh(winGeo, 0x334455);
            win.position.set(CX - 258 + w * 22, 14, -61.2);
        }

        // Stepped entrance stairs
        var stair1 = new THREE.BoxGeometry(24, 1.5, 10);
        var s1 = makeMesh(stair1, 0xC0A070);
        s1.position.set(CX - 200, 0.75, -55);

        var stair2 = new THREE.BoxGeometry(20, 1, 7);
        var s2 = makeMesh(stair2, 0xB89060);
        s2.position.set(CX - 200, 2, -54);

        // Museum rear annex
        var rear = new THREE.BoxGeometry(90, 18, 20);
        var rm = makeMesh(rear, C);
        rm.position.set(CX - 200, 9, -102);
    }

    // =====================================================================
    // ROYAL PALACE — Palacio Real, 0xF5F5DC
    // =====================================================================
    function buildRoyalPalace() {
        var C = 0xF5F5DC;

        // Massive main palace block — 140m facade
        var main = new THREE.BoxGeometry(140, 38, 90);
        var mm = makeMesh(main, C);
        mm.position.set(CX + 300, 19, 100);

        // Palace roof / balustrade band
        var roof = new THREE.BoxGeometry(144, 5, 94);
        var rm = makeMesh(roof, 0xE8E8CC);
        rm.position.set(CX + 300, 40, 100);

        // North wing
        var nw = new THREE.BoxGeometry(90, 38, 32);
        var nwm = makeMesh(nw, C);
        nwm.position.set(CX + 300, 19, 61);

        // South wing
        var sw = new THREE.BoxGeometry(90, 38, 32);
        var swm = makeMesh(sw, C);
        swm.position.set(CX + 300, 19, 139);

        // NW corner tower
        var nwt = new THREE.BoxGeometry(18, 45, 18);
        var nwtm = makeMesh(nwt, C);
        nwtm.position.set(CX + 232, 22.5, 48);

        // NE corner tower
        var net = new THREE.BoxGeometry(18, 45, 18);
        var netm = makeMesh(net, C);
        netm.position.set(CX + 368, 22.5, 48);

        // SW corner tower
        var swt = new THREE.BoxGeometry(18, 45, 18);
        var swtm = makeMesh(swt, C);
        swtm.position.set(CX + 232, 22.5, 152);

        // SE corner tower
        var set2 = new THREE.BoxGeometry(18, 45, 18);
        var set2m = makeMesh(set2, C);
        set2m.position.set(CX + 368, 22.5, 152);

        // Grand entrance portico on south facade
        var entry = new THREE.BoxGeometry(30, 42, 12);
        var em = makeMesh(entry, 0xEEEED0);
        em.position.set(CX + 300, 21, 97);

        // Entry columns — 4 Baroque columns
        for (var ec = 0; ec < 4; ec++) {
            var ecg = new THREE.CylinderGeometry(1.2, 1.4, 36, 10);
            var ecm = makeMesh(ecg, 0xF0F0DA);
            ecm.position.set(CX + 287 + ec * 9, 18, 92);
        }

        // Courtyard fountain — base
        var fbase = new THREE.CylinderGeometry(8, 9, 2, 12);
        var fbm = makeMesh(fbase, 0xD0D0B8);
        fbm.position.set(CX + 300, 1, 100);

        // Fountain column
        var fcol = new THREE.CylinderGeometry(0.8, 1.0, 10, 8);
        var fcolm = makeMesh(fcol, 0xE0E0C8);
        fcolm.position.set(CX + 300, 6, 100);

        // Fountain top sphere
        var ftop = new THREE.SphereGeometry(2, 8, 8);
        var ftm = makeMesh(ftop, 0xC8C8B0);
        ftm.position.set(CX + 300, 12, 100);

        // Palace gardens — hedge boxes
        var hedge1 = new THREE.BoxGeometry(40, 4, 4);
        var hm1 = makeMesh(hedge1, 0x2D6B35);
        hm1.position.set(CX + 260, 2, 185);

        var hedge2 = new THREE.BoxGeometry(40, 4, 4);
        var hm2 = makeMesh(hedge2, 0x2D6B35);
        hm2.position.set(CX + 340, 2, 185);

        // Statue on pedestal in front
        var ped = new THREE.BoxGeometry(4, 5, 4);
        var pedm = makeMesh(ped, 0xC8C0A8);
        pedm.position.set(CX + 300, 2.5, 82);

        var statue = new THREE.CylinderGeometry(0.8, 1.0, 6, 6);
        var stam = makeMesh(statue, 0xB8B0A0);
        stam.position.set(CX + 300, 9, 82);
    }

    // =====================================================================
    // PUERTA DEL SOL — semicircular plaza, 0xDEB887
    // =====================================================================
    function buildPuertaDelSol() {
        var C = 0xDEB887;

        // Plaza ground surface
        var plaza = new THREE.BoxGeometry(120, 0.4, 80);
        var pm = makeMesh(plaza, 0xD2B48C);
        pm.position.set(CX + 80, 0.2, -200);

        // Famous clock tower (Casa de Correos) — main building
        var mainBldg = new THREE.BoxGeometry(55, 24, 22);
        var mb = makeMesh(mainBldg, C);
        mb.position.set(CX + 80, 12, -215);

        // Clock tower top section
        var tower = new THREE.BoxGeometry(16, 14, 16);
        var tm = makeMesh(tower, 0xCDA870);
        tm.position.set(CX + 80, 29, -215);

        // Clock tower spire
        var spire = new THREE.ConeGeometry(4, 10, 8);
        var sm = makeMesh(spire, 0x888866);
        sm.position.set(CX + 80, 41, -215);

        // Clock face (dark circle inset)
        var clock = new THREE.CylinderGeometry(3, 3, 0.3, 12);
        var clockM = makeMesh(clock, 0x333333);
        clockM.rotation.x = Math.PI / 2;
        clockM.position.set(CX + 80, 34, -208);

        // Flanking wings of Casa de Correos
        var leftWing = new THREE.BoxGeometry(20, 22, 22);
        var lw = makeMesh(leftWing, C);
        lw.position.set(CX + 47, 11, -215);

        var rightWing = new THREE.BoxGeometry(20, 22, 22);
        var rw = makeMesh(rightWing, C);
        rw.position.set(CX + 113, 11, -215);

        // Bear and Strawberry Tree statue — famous Madrid symbol
        var bearBase = new THREE.BoxGeometry(4, 2, 4);
        var bbm = makeMesh(bearBase, 0xAA8866);
        bbm.position.set(CX + 60, 1, -195);

        var bearBody = new THREE.SphereGeometry(2.5, 8, 6);
        var bBody = makeMesh(bearBody, 0x8B6914);
        bBody.position.set(CX + 60, 5, -195);

        var bearHead = new THREE.SphereGeometry(1.5, 8, 6);
        var bHead = makeMesh(bearHead, 0x8B6914);
        bHead.position.set(CX + 60, 8.5, -195);

        // Strawberry tree trunk
        var treeTrunk = new THREE.CylinderGeometry(0.4, 0.6, 5, 6);
        var ttm = makeMesh(treeTrunk, 0x5C3A1E);
        ttm.position.set(CX + 62, 2.5, -195);

        var treeTop = new THREE.SphereGeometry(2.5, 8, 6);
        var ttop = makeMesh(treeTop, 0x2E7D32);
        ttop.position.set(CX + 62, 7, -195);

        // Kilometer Zero marker (flat disc)
        var kzero = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12);
        var kzm = makeMesh(kzero, 0x888888);
        kzm.position.set(CX + 80, 0.35, -200);

        // Surrounding buildings of the semicircular plaza
        var bldg1 = new THREE.BoxGeometry(22, 20, 15);
        var b1 = makeMesh(bldg1, 0xD2A060);
        b1.position.set(CX + 30, 10, -170);

        var bldg2 = new THREE.BoxGeometry(22, 18, 15);
        var b2 = makeMesh(bldg2, 0xC8986A);
        b2.position.set(CX + 130, 9, -170);
    }

    // =====================================================================
    // GRAN VIA — 0xC8B89A
    // =====================================================================
    function buildGranVia() {
        var C = 0xC8B89A;

        // Metropolis Building — ornate corner building with dome
        var metroBase = new THREE.BoxGeometry(22, 35, 22);
        var mb = makeMesh(metroBase, 0xD4C4A0);
        mb.position.set(CX + 120, 17.5, 250);

        // Metropolis drum / upper section
        var metroDrum = new THREE.CylinderGeometry(7, 8, 10, 12);
        var md = makeMesh(metroDrum, 0xC8C0A0);
        md.position.set(CX + 120, 40, 250);

        // Metropolis dome
        var metroDome = new THREE.SphereGeometry(7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var mdom = makeMesh(metroDome, 0x6B8E6B);
        mdom.position.set(CX + 120, 50, 250);

        // Dome lantern spire
        var metSpire = new THREE.ConeGeometry(1.5, 8, 8);
        var msm = makeMesh(metSpire, 0x8B7355);
        msm.position.set(CX + 120, 58, 250);

        // Gran Via boulevard buildings — early 20th century facades
        var bldgA = new THREE.BoxGeometry(18, 30, 18);
        var bA = makeMesh(bldgA, C);
        bA.position.set(CX + 160, 15, 240);

        var bldgB = new THREE.BoxGeometry(20, 28, 18);
        var bB = makeMesh(bldgB, 0xBCAA92);
        bB.position.set(CX + 185, 14, 240);

        var bldgC = new THREE.BoxGeometry(18, 32, 18);
        var bC = makeMesh(bldgC, 0xC4B496);
        bC.position.set(CX + 210, 16, 240);

        var bldgD = new THREE.BoxGeometry(22, 38, 18);
        var bD = makeMesh(bldgD, C);
        bD.position.set(CX + 238, 19, 240);

        // Telefonica Building — tall early skyscraper
        var telBase = new THREE.BoxGeometry(18, 50, 18);
        var tb = makeMesh(telBase, 0xE8E0D0);
        tb.position.set(CX + 270, 25, 240);

        var telTop = new THREE.BoxGeometry(10, 16, 10);
        var tt = makeMesh(telTop, 0xDDD5C5);
        tt.position.set(CX + 270, 58, 240);

        // South side buildings
        var bldgE = new THREE.BoxGeometry(20, 26, 18);
        var bE = makeMesh(bldgE, 0xC0AA88);
        bE.position.set(CX + 160, 13, 264);

        var bldgF = new THREE.BoxGeometry(18, 29, 18);
        var bF = makeMesh(bldgF, C);
        bF.position.set(CX + 185, 14.5, 264);

        var bldgG = new THREE.BoxGeometry(24, 34, 18);
        var bG = makeMesh(bldgG, 0xBBAA90);
        bG.position.set(CX + 218, 17, 264);
    }

    // =====================================================================
    // RETIRO PARK — 0x3A7D44
    // =====================================================================
    function buildRetiroPark() {
        var C = 0x3A7D44;

        // Park ground
        var ground = new THREE.BoxGeometry(220, 0.5, 180);
        var gm = makeMesh(ground, 0x4A8F54);
        gm.position.set(CX - 80, 0.25, 200);

        // Trees — groups of cylinders + spheres
        for (var t = 0; t < 8; t++) {
            var tx = CX - 160 + t * 28;
            var tz = 170 + (t % 3) * 20;

            var trunk = new THREE.CylinderGeometry(0.8, 1.0, 8, 6);
            var trunkM = makeMesh(trunk, 0x5C3A1E);
            trunkM.position.set(tx, 4, tz);

            var canopy = new THREE.SphereGeometry(5, 8, 6);
            var canM = makeMesh(canopy, C);
            canM.position.set(tx, 12, tz);
        }

        // Palacio de Cristal — glass greenhouse (box approximation)
        var crystalBase = new THREE.BoxGeometry(28, 16, 18);
        var cbm = makeMesh(crystalBase, 0xAADDBB);
        cbm.position.set(CX - 80, 8, 210);

        // Crystal palace roof dome
        var crystalRoof = new THREE.SphereGeometry(10, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var crm = makeMesh(crystalRoof, 0x88CCAA);
        crm.position.set(CX - 80, 16, 210);

        // Boating lake (flat blue box)
        var lake = new THREE.BoxGeometry(60, 0.3, 40);
        var lm = makeMesh(lake, 0x2277AA);
        lm.position.set(CX - 20, 0.15, 230);

        // Alfonso XII monument column
        var monPed = new THREE.CylinderGeometry(6, 7, 4, 12);
        var monPedM = makeMesh(monPed, 0xCCBB99);
        monPedM.position.set(CX - 20, 2, 242);

        var monCol = new THREE.CylinderGeometry(1.5, 2, 18, 10);
        var monColM = makeMesh(monCol, 0xBBAA88);
        monColM.position.set(CX - 20, 13, 242);

        var monTop = new THREE.SphereGeometry(2.5, 8, 8);
        var monTopM = makeMesh(monTop, 0xAA9977);
        monTopM.position.set(CX - 20, 23, 242);

        // Park paths
        var path1 = new THREE.BoxGeometry(180, 0.2, 4);
        var p1m = makeMesh(path1, 0xD2C4A8);
        p1m.position.set(CX - 80, 0.6, 200);

        var path2 = new THREE.BoxGeometry(4, 0.2, 140);
        var p2m = makeMesh(path2, 0xD2C4A8);
        p2m.position.set(CX - 80, 0.6, 200);
    }

    // =====================================================================
    // SANTIAGO BERNABEU STADIUM — 0xD3D3D3
    // =====================================================================
    function buildBernabeuStadium() {
        var C = 0xD3D3D3;

        // Outer oval ring
        var outerRing = new THREE.CylinderGeometry(62, 64, 36, 16, 1, true);
        var orm = makeMesh(outerRing, C);
        orm.position.set(CX - 400, 18, 200);

        // Base/foundation ring
        var base = new THREE.CylinderGeometry(65, 68, 6, 16);
        var bm = makeMesh(base, 0xC0C0C0);
        bm.position.set(CX - 400, 3, 200);

        // Roof ring
        var roof = new THREE.CylinderGeometry(65, 62, 4, 16, 1, true);
        var rm = makeMesh(roof, 0xBBBBBB);
        rm.position.set(CX - 400, 38, 200);

        // Inner field (green)
        var field = new THREE.BoxGeometry(90, 0.5, 55);
        var fm = makeMesh(field, 0x2D8C3C);
        fm.position.set(CX - 400, 0.75, 200);

        // Field white lines
        var line1 = new THREE.BoxGeometry(90, 0.1, 1);
        var l1m = makeMesh(line1, 0xFFFFFF);
        l1m.position.set(CX - 400, 1.05, 200);

        var line2 = new THREE.BoxGeometry(1, 0.1, 55);
        var l2m = makeMesh(line2, 0xFFFFFF);
        l2m.position.set(CX - 400, 1.05, 200);

        // Upper tier outer skin panels
        var panelA = new THREE.BoxGeometry(40, 18, 4);
        var pa = makeMesh(panelA, 0xE0E0E0);
        pa.position.set(CX - 400, 30, 136);

        var panelB = new THREE.BoxGeometry(40, 18, 4);
        var pb = makeMesh(panelB, 0xE0E0E0);
        pb.position.set(CX - 400, 30, 264);
    }

    // =====================================================================
    // MADRID METRO ENTRANCES — 0x555555
    // =====================================================================
    function buildMetroEntrances() {
        var C = 0x555555;

        // Metro entrance 1 — near Sol
        var ent1base = new THREE.BoxGeometry(5, 0.5, 5);
        var e1b = makeMesh(ent1base, 0x666666);
        e1b.position.set(CX + 50, 0.25, -180);

        // Cast iron arch
        var arch1 = new THREE.BoxGeometry(5, 5, 0.6);
        var a1 = makeMesh(arch1, C);
        a1.position.set(CX + 50, 2.5, -177.7);

        var arch1top = new THREE.SphereGeometry(2.5, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        var a1t = makeMesh(arch1top, C);
        a1t.position.set(CX + 50, 5, -177.7);

        // Metro entrance 2 — near Gran Via
        var ent2base = new THREE.BoxGeometry(5, 0.5, 5);
        var e2b = makeMesh(ent2base, 0x666666);
        e2b.position.set(CX + 145, 0.25, 248);

        var arch2 = new THREE.BoxGeometry(5, 5, 0.6);
        var a2 = makeMesh(arch2, C);
        a2.position.set(CX + 145, 2.5, 248);

        var arch2top = new THREE.SphereGeometry(2.5, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
        var a2t = makeMesh(arch2top, C);
        a2t.position.set(CX + 145, 5, 248);

        // Metro sign poles
        var pole1 = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
        var p1m = makeMesh(pole1, 0xCC2222);
        p1m.position.set(CX + 53, 2.5, -180);

        var sign1 = new THREE.BoxGeometry(2, 2, 0.2);
        var s1m = makeMesh(sign1, 0xCC2222);
        s1m.position.set(CX + 53, 5.5, -180);
    }

    // =====================================================================
    // SIERRA DE GUADARRAMA — 0x888888
    // =====================================================================
    function buildSierraGuadarrama() {
        var C = 0x888888;

        // Mountain range visible to NW — series of peaks
        var peak1 = new THREE.ConeGeometry(80, 120, 8);
        var p1 = makeMesh(peak1, C);
        p1.position.set(CX - 800, 60, -400);

        var peak2 = new THREE.ConeGeometry(100, 150, 8);
        var p2 = makeMesh(peak2, 0x777777);
        p2.position.set(CX - 950, 75, -350);

        var peak3 = new THREE.ConeGeometry(70, 100, 8);
        var p3 = makeMesh(peak3, 0x999999);
        p3.position.set(CX - 700, 50, -450);

        var peak4 = new THREE.ConeGeometry(90, 130, 8);
        var p4 = makeMesh(peak4, 0x888888);
        p4.position.set(CX - 1100, 65, -300);

        var peak5 = new THREE.ConeGeometry(60, 90, 8);
        var p5 = makeMesh(peak5, 0xAAAAAA);
        p5.position.set(CX - 600, 45, -500);

        // Snow caps on highest peaks
        var snow1 = new THREE.ConeGeometry(30, 35, 8);
        var sn1 = makeMesh(snow1, 0xEEEEEE);
        sn1.position.set(CX - 950, 148, -350);

        var snow2 = new THREE.ConeGeometry(25, 28, 8);
        var sn2 = makeMesh(snow2, 0xEEEEEE);
        sn2.position.set(CX - 800, 118, -400);

        // Mountain base ridge
        var ridge = new THREE.BoxGeometry(700, 40, 80);
        var rm = makeMesh(ridge, 0x6A6A6A);
        rm.position.set(CX - 850, 20, -380);
    }

    // =====================================================================
    // PLAZA MAYOR — red-brick baroque, 0xC87020
    // =====================================================================
    function buildPlazaMayor() {
        var C = 0xC87020;

        // Plaza paved surface
        var plazaGround = new THREE.BoxGeometry(237, 0.4, 129);
        var pgm = makeMesh(plazaGround, 0xBB9955);
        pgm.position.set(CX - 50, 0.2, 50);

        // North arcade building
        var north = new THREE.BoxGeometry(237, 20, 14);
        var nm = makeMesh(north, C);
        nm.position.set(CX - 50, 10, -14.5);

        // South arcade building
        var south = new THREE.BoxGeometry(237, 20, 14);
        var som = makeMesh(south, C);
        som.position.set(CX - 50, 10, 114.5);

        // East arcade building
        var east = new THREE.BoxGeometry(14, 20, 101);
        var em = makeMesh(east, C);
        em.position.set(CX + 116.5, 10, 50);

        // West arcade building
        var west = new THREE.BoxGeometry(14, 20, 101);
        var wm = makeMesh(west, C);
        wm.position.set(CX - 216.5, 10, 50);

        // NW corner tower (Casa de la Panaderia style)
        var nwt = new THREE.BoxGeometry(18, 26, 18);
        var nwtm = makeMesh(nwt, C);
        nwtm.position.set(CX - 216, 13, -14);

        var nwtSpire = new THREE.ConeGeometry(5, 12, 8);
        var nwtSm = makeMesh(nwtSpire, 0x8B4500);
        nwtSm.position.set(CX - 216, 32, -14);

        // NE corner tower
        var net = new THREE.BoxGeometry(18, 26, 18);
        var netm = makeMesh(net, C);
        netm.position.set(CX + 116, 13, -14);

        var netSpire = new THREE.ConeGeometry(5, 12, 8);
        var netSm = makeMesh(netSpire, 0x8B4500);
        netSm.position.set(CX + 116, 32, -14);

        // SW corner tower
        var swt = new THREE.BoxGeometry(18, 26, 18);
        var swtm = makeMesh(swt, C);
        swtm.position.set(CX - 216, 13, 114);

        // SE corner tower
        var set3 = new THREE.BoxGeometry(18, 26, 18);
        var set3m = makeMesh(set3, C);
        set3m.position.set(CX + 116, 13, 114);

        // Felipe III equestrian statue in center
        var statBase = new THREE.BoxGeometry(5, 3, 5);
        var sbm = makeMesh(statBase, 0xAA8855);
        sbm.position.set(CX - 50, 1.5, 50);

        var horse = new THREE.BoxGeometry(3, 4, 5);
        var hm = makeMesh(horse, 0x886633);
        hm.position.set(CX - 50, 6, 50);

        var rider = new THREE.SphereGeometry(1.2, 6, 6);
        var rm = makeMesh(rider, 0x775522);
        rm.position.set(CX - 50, 9.5, 50);

        // Arcade arches on N side — 6 arched openings (represented as darker insets)
        for (var arc = 0; arc < 6; arc++) {
            var archHole = new THREE.BoxGeometry(6, 8, 1);
            var ahm = makeMesh(archHole, 0x552200);
            ahm.position.set(CX - 190 + arc * 28, 6, -7.6);
        }

        // Rooftop dormers N side
        for (var dorm = 0; dorm < 4; dorm++) {
            var dormer = new THREE.BoxGeometry(4, 4, 3);
            var dm = makeMesh(dormer, 0xAA5500);
            dm.position.set(CX - 170 + dorm * 40, 22, -7);
        }
    }

    function update(delta) {
        // No animation needed for static environment
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
