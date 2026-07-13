window.FarnboroughAirshow = (function() {
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

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function buildRunway() {
        // Main runway strip - long and wide
        var runwayGeo = new THREE.BoxGeometry(80, 0.1, 2000);
        var runway = makeMesh(runwayGeo, 0x333333);
        runway.position.set(12840, 0.05, 0);
        addObj(runway);

        // Runway centreline markings
        var i;
        for (i = -900; i <= 900; i += 60) {
            var markGeo = new THREE.BoxGeometry(2, 0.15, 20);
            var mark = makeMesh(markGeo, 0xffffff);
            mark.position.set(12840, 0.1, i);
            addObj(mark);
        }

        // Threshold markings - start
        var t;
        for (t = 0; t < 6; t++) {
            var threshGeoA = new THREE.BoxGeometry(8, 0.15, 4);
            var threshA = makeMesh(threshGeoA, 0xffffff);
            threshA.position.set(12810 + t * 8, 0.1, -960);
            addObj(threshA);

            var threshGeoB = new THREE.BoxGeometry(8, 0.15, 4);
            var threshB = makeMesh(threshGeoB, 0xffffff);
            threshB.position.set(12810 + t * 8, 0.1, 960);
            addObj(threshB);
        }

        // Runway edge lights
        var l;
        for (l = -900; l <= 900; l += 80) {
            var lightGeoL = new THREE.SphereGeometry(0.4, 4, 4);
            var lightL = makeMesh(lightGeoL, 0xffffaa);
            lightL.position.set(12800, 0.5, l);
            addObj(lightL);

            var lightGeoR = new THREE.SphereGeometry(0.4, 4, 4);
            var lightR = makeMesh(lightGeoR, 0xffffaa);
            lightR.position.set(12880, 0.5, l);
            addObj(lightR);
        }

        // Touchdown zone lights
        var tz;
        for (tz = 0; tz < 4; tz++) {
            var tzlGeoA = new THREE.SphereGeometry(0.3, 4, 4);
            var tzlA = makeMesh(tzlGeoA, 0xffffff);
            tzlA.position.set(12820 + tz * 10, 0.5, -800);
            addObj(tzlA);

            var tzlGeoB = new THREE.SphereGeometry(0.3, 4, 4);
            var tzlB = makeMesh(tzlGeoB, 0xffffff);
            tzlB.position.set(12820 + tz * 10, 0.5, 800);
            addObj(tzlB);
        }

        // Taxiway
        var taxiGeo = new THREE.BoxGeometry(20, 0.1, 1600);
        var taxi = makeMesh(taxiGeo, 0x444444);
        taxi.position.set(12920, 0.05, 0);
        addObj(taxi);

        // Taxiway centreline
        var tc;
        for (tc = -750; tc <= 750; tc += 40) {
            var tcMarkGeo = new THREE.BoxGeometry(1, 0.15, 15);
            var tcMark = makeMesh(tcMarkGeo, 0xffff00);
            tcMark.position.set(12920, 0.1, tc);
            addObj(tcMark);
        }
    }

    function buildHangars() {
        // Hall 1
        var h1Geo = new THREE.BoxGeometry(120, 30, 80);
        var h1 = makeMesh(h1Geo, 0x8899aa);
        h1.position.set(13060, 15, -300);
        addObj(h1);

        var h1RoofGeo = new THREE.BoxGeometry(122, 2, 82);
        var h1Roof = makeMesh(h1RoofGeo, 0x667788);
        h1Roof.position.set(13060, 31, -300);
        addObj(h1Roof);

        // Hall 1 sign pillar
        var h1SignGeo = new THREE.BoxGeometry(20, 5, 1);
        var h1Sign = makeMesh(h1SignGeo, 0xdddddd);
        h1Sign.position.set(13060, 34, -260);
        addObj(h1Sign);

        // Hall 2
        var h2Geo = new THREE.BoxGeometry(120, 30, 80);
        var h2 = makeMesh(h2Geo, 0x8899aa);
        h2.position.set(13060, 15, -180);
        addObj(h2);

        var h2RoofGeo = new THREE.BoxGeometry(122, 2, 82);
        var h2Roof = makeMesh(h2RoofGeo, 0x667788);
        h2Roof.position.set(13060, 31, -180);
        addObj(h2Roof);

        // Hall 3
        var h3Geo = new THREE.BoxGeometry(120, 28, 80);
        var h3 = makeMesh(h3Geo, 0x7788aa);
        h3.position.set(13060, 14, -60);
        addObj(h3);

        var h3RoofGeo = new THREE.BoxGeometry(122, 2, 82);
        var h3Roof = makeMesh(h3RoofGeo, 0x667788);
        h3Roof.position.set(13060, 29, -60);
        addObj(h3Roof);

        // Hall 4
        var h4Geo = new THREE.BoxGeometry(120, 28, 80);
        var h4 = makeMesh(h4Geo, 0x7788aa);
        h4.position.set(13060, 14, 60);
        addObj(h4);

        var h4RoofGeo = new THREE.BoxGeometry(122, 2, 82);
        var h4Roof = makeMesh(h4RoofGeo, 0x667788);
        h4Roof.position.set(13060, 29, 60);
        addObj(h4Roof);

        // Connecting corridor between halls
        var corrGeo = new THREE.BoxGeometry(10, 20, 360);
        var corr = makeMesh(corrGeo, 0x99aabb);
        corr.position.set(13000, 10, -120);
        addObj(corr);
    }

    function buildStaticDisplayApron() {
        // Apron surface
        var apronGeo = new THREE.BoxGeometry(200, 0.1, 600);
        var apron = makeMesh(apronGeo, 0x555555);
        apron.position.set(12960, 0.05, -150);
        addObj(apron);

        // Concorde silhouette - fuselage
        var concFuseGeo = new THREE.BoxGeometry(5, 4, 60);
        var concFuse = makeMesh(concFuseGeo, 0xdddddd);
        concFuse.position.set(12940, 2, -50);
        addObj(concFuse);

        // Concorde delta wing
        var concWingGeo = new THREE.BoxGeometry(40, 1, 30);
        var concWing = makeMesh(concWingGeo, 0xcccccc);
        concWing.position.set(12940, 1.5, -50);
        addObj(concWing);

        // Concorde nose droop
        var concNoseGeo = new THREE.ConeGeometry(2, 12, 4);
        var concNose = makeMesh(concNoseGeo, 0xdddddd);
        concNose.rotation.x = -Math.PI / 2;
        concNose.position.set(12940, 2.5, -82);
        addObj(concNose);

        // Concorde tail fin
        var concTailGeo = new THREE.BoxGeometry(1, 6, 8);
        var concTail = makeMesh(concTailGeo, 0xdddddd);
        concTail.position.set(12940, 6, -17);
        addObj(concTail);

        // Fighter jet 1 - Typhoon-style
        var fj1FuseGeo = new THREE.BoxGeometry(3, 3, 18);
        var fj1Fuse = makeMesh(fj1FuseGeo, 0x888888);
        fj1Fuse.position.set(12950, 1.5, 0);
        addObj(fj1Fuse);

        var fj1WingGeo = new THREE.BoxGeometry(18, 0.8, 8);
        var fj1Wing = makeMesh(fj1WingGeo, 0x777777);
        fj1Wing.position.set(12950, 1.5, 2);
        addObj(fj1Wing);

        var fj1NoseGeo = new THREE.ConeGeometry(1.2, 6, 4);
        var fj1Nose = makeMesh(fj1NoseGeo, 0x888888);
        fj1Nose.rotation.x = -Math.PI / 2;
        fj1Nose.position.set(12950, 2, -12);
        addObj(fj1Nose);

        var fj1TailGeo = new THREE.BoxGeometry(0.8, 5, 5);
        var fj1Tail = makeMesh(fj1TailGeo, 0x888888);
        fj1Tail.position.set(12950, 4.5, 7);
        addObj(fj1Tail);

        // Fighter jet 2
        var fj2FuseGeo = new THREE.BoxGeometry(3, 3, 18);
        var fj2Fuse = makeMesh(fj2FuseGeo, 0x6688aa);
        fj2Fuse.position.set(12965, 1.5, 30);
        addObj(fj2Fuse);

        var fj2WingGeo = new THREE.BoxGeometry(20, 0.8, 9);
        var fj2Wing = makeMesh(fj2WingGeo, 0x5577aa);
        fj2Wing.position.set(12965, 1.5, 32);
        addObj(fj2Wing);

        var fj2NoseGeo = new THREE.ConeGeometry(1.2, 6, 4);
        var fj2Nose = makeMesh(fj2NoseGeo, 0x6688aa);
        fj2Nose.rotation.x = -Math.PI / 2;
        fj2Nose.position.set(12965, 2, 18);
        addObj(fj2Nose);

        // Transport plane
        var tpFuseGeo = new THREE.BoxGeometry(8, 8, 50);
        var tpFuse = makeMesh(tpFuseGeo, 0xaabbcc);
        tpFuse.position.set(12940, 4, -180);
        addObj(tpFuse);

        var tpWingGeo = new THREE.BoxGeometry(70, 1.5, 20);
        var tpWing = makeMesh(tpWingGeo, 0x99aacc);
        tpWing.position.set(12940, 4, -175);
        addObj(tpWing);

        var tpTailGeo = new THREE.BoxGeometry(1.5, 10, 12);
        var tpTail = makeMesh(tpTailGeo, 0xaabbcc);
        tpTail.position.set(12940, 9, -155);
        addObj(tpTail);

        var tpHorzGeo = new THREE.BoxGeometry(30, 1.5, 8);
        var tpHorz = makeMesh(tpHorzGeo, 0x99aacc);
        tpHorz.position.set(12940, 8, -155);
        addObj(tpHorz);

        // Engine pods on transport
        var eng1Geo = new THREE.CylinderGeometry(2, 2, 12, 6);
        var eng1 = makeMesh(eng1Geo, 0x778899);
        eng1.rotation.x = Math.PI / 2;
        eng1.position.set(12960, 3, -175);
        addObj(eng1);

        var eng2Geo = new THREE.CylinderGeometry(2, 2, 12, 6);
        var eng2 = makeMesh(eng2Geo, 0x778899);
        eng2.rotation.x = Math.PI / 2;
        eng2.position.set(12920, 3, -175);
        addObj(eng2);

        // Small aircraft 1
        var sa1FuseGeo = new THREE.BoxGeometry(2, 2, 10);
        var sa1Fuse = makeMesh(sa1FuseGeo, 0xffdd88);
        sa1Fuse.position.set(12935, 1, 70);
        addObj(sa1Fuse);

        var sa1WingGeo = new THREE.BoxGeometry(16, 0.5, 5);
        var sa1Wing = makeMesh(sa1WingGeo, 0xffcc66);
        sa1Wing.position.set(12935, 1, 72);
        addObj(sa1Wing);
    }

    function buildControlTower() {
        // Tower base - tall square structure
        var towerBaseGeo = new THREE.BoxGeometry(14, 40, 14);
        var towerBase = makeMesh(towerBaseGeo, 0xbbccdd);
        towerBase.position.set(12890, 20, -450);
        addObj(towerBase);

        // Tower mid section
        var towerMidGeo = new THREE.BoxGeometry(12, 10, 12);
        var towerMid = makeMesh(towerMidGeo, 0xaabbcc);
        towerMid.position.set(12890, 45, -450);
        addObj(towerMid);

        // Glass-fronted cab
        var towerCabGeo = new THREE.BoxGeometry(18, 8, 18);
        var towerCab = makeMesh(towerCabGeo, 0x99bbcc);
        towerCab.position.set(12890, 54, -450);
        addObj(towerCab);

        // Cab glass panels (slightly darker)
        var towerGlassGeo = new THREE.BoxGeometry(16, 5, 16);
        var towerGlass = makeMesh(towerGlassGeo, 0x6699bb);
        towerGlass.position.set(12890, 54, -450);
        addObj(towerGlass);

        // Cab roof overhang
        var towerRoofGeo = new THREE.BoxGeometry(22, 1.5, 22);
        var towerRoof = makeMesh(towerRoofGeo, 0x889999);
        towerRoof.position.set(12890, 58.5, -450);
        addObj(towerRoof);

        // Radio masts
        var mast1Geo = new THREE.CylinderGeometry(0.3, 0.3, 20, 5);
        var mast1 = makeMesh(mast1Geo, 0x666666);
        mast1.position.set(12887, 69, -450);
        addObj(mast1);

        var mast2Geo = new THREE.CylinderGeometry(0.3, 0.3, 14, 5);
        var mast2 = makeMesh(mast2Geo, 0x666666);
        mast2.position.set(12893, 66, -450);
        addObj(mast2);

        // Wind vane pole
        var wvPoleGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 5);
        var wvPole = makeMesh(wvPoleGeo, 0x888888);
        wvPole.position.set(12890, 63, -453);
        addObj(wvPole);

        // Wind vane itself
        var wvGeo = new THREE.BoxGeometry(5, 0.5, 0.5);
        var wv = makeMesh(wvGeo, 0xdd4444);
        wv.position.set(12890, 67.5, -453);
        addObj(wv);

        // Wind vane ball tip
        var wvBallGeo = new THREE.SphereGeometry(0.6, 6, 6);
        var wvBall = makeMesh(wvBallGeo, 0xdd4444);
        wvBall.position.set(12892.5, 67.5, -453);
        addObj(wvBall);

        // Radar dish base
        var radarBaseGeo = new THREE.CylinderGeometry(1, 1, 6, 8);
        var radarBase = makeMesh(radarBaseGeo, 0x999999);
        radarBase.position.set(12886, 62, -447);
        addObj(radarBase);

        // Radar dish
        var radarDishGeo = new THREE.CylinderGeometry(4, 0.5, 1.5, 8);
        var radarDish = makeMesh(radarDishGeo, 0xaaaaaa);
        radarDish.position.set(12886, 65.5, -447);
        addObj(radarDish);

        // Tower entrance building
        var entranceGeo = new THREE.BoxGeometry(20, 8, 12);
        var entrance = makeMesh(entranceGeo, 0xbbc0cc);
        entrance.position.set(12890, 4, -440);
        addObj(entrance);

        var entRoofGeo = new THREE.BoxGeometry(22, 1, 14);
        var entRoof = makeMesh(entRoofGeo, 0x99aaaa);
        entRoof.position.set(12890, 8.5, -440);
        addObj(entRoof);
    }

    function buildCodyMemorial() {
        // Stone pillar base - wide plinth
        var plinthGeo = new THREE.BoxGeometry(6, 0.8, 6);
        var plinth = makeMesh(plinthGeo, 0x998877);
        plinth.position.set(12820, 0.4, -700);
        addObj(plinth);

        // Second plinth level
        var plinth2Geo = new THREE.BoxGeometry(4.5, 0.8, 4.5);
        var plinth2 = makeMesh(plinth2Geo, 0x887766);
        plinth2.position.set(12820, 1.2, -700);
        addObj(plinth2);

        // Third plinth level
        var plinth3Geo = new THREE.BoxGeometry(3.5, 0.8, 3.5);
        var plinth3 = makeMesh(plinth3Geo, 0x998877);
        plinth3.position.set(12820, 2, -700);
        addObj(plinth3);

        // Main stone column
        var columnGeo = new THREE.CylinderGeometry(1.2, 1.4, 12, 8);
        var column = makeMesh(columnGeo, 0xaabbaa);
        column.position.set(12820, 8.4, -700);
        addObj(column);

        // Column capital
        var capitalGeo = new THREE.BoxGeometry(3, 1.5, 3);
        var capital = makeMesh(capitalGeo, 0x99aa99);
        capital.position.set(12820, 15.15, -700);
        addObj(capital);

        // Memorial top piece - cross or ornament
        var topGeo = new THREE.BoxGeometry(0.8, 4, 0.8);
        var top = makeMesh(topGeo, 0x888899);
        top.position.set(12820, 17.9, -700);
        addObj(top);

        var topCrossGeo = new THREE.BoxGeometry(3, 0.8, 0.8);
        var topCross = makeMesh(topCrossGeo, 0x888899);
        topCross.position.set(12820, 19, -700);
        addObj(topCross);

        // Plaque panel on column
        var plaqueGeo = new THREE.BoxGeometry(2.5, 3, 0.3);
        var plaque = makeMesh(plaqueGeo, 0xddbb88);
        plaque.position.set(12820, 7, -698.7);
        addObj(plaque);

        // Small commemorative fence posts around memorial
        var fp;
        var fenceX = [12816, 12824, 12816, 12824];
        var fenceZ = [-696, -696, -704, -704];
        for (fp = 0; fp < 4; fp++) {
            var fpGeo = new THREE.CylinderGeometry(0.15, 0.15, 3, 5);
            var fpMesh = makeMesh(fpGeo, 0x555555);
            fpMesh.position.set(fenceX[fp], 1.5, fenceZ[fp]);
            addObj(fpMesh);
        }

        // Chain fence rails
        var fr1Geo = new THREE.BoxGeometry(8, 0.2, 0.2);
        var fr1 = makeMesh(fr1Geo, 0x555555);
        fr1.position.set(12820, 2.5, -696);
        addObj(fr1);

        var fr2Geo = new THREE.BoxGeometry(8, 0.2, 0.2);
        var fr2 = makeMesh(fr2Geo, 0x555555);
        fr2.position.set(12820, 2.5, -704);
        addObj(fr2);

        var fr3Geo = new THREE.BoxGeometry(0.2, 0.2, 8);
        var fr3 = makeMesh(fr3Geo, 0x555555);
        fr3.position.set(12816, 2.5, -700);
        addObj(fr3);

        var fr4Geo = new THREE.BoxGeometry(0.2, 0.2, 8);
        var fr4 = makeMesh(fr4Geo, 0x555555);
        fr4.position.set(12824, 2.5, -700);
        addObj(fr4);
    }

    function buildGrandstands() {
        // Main grandstand structure - east side of runway
        var gs;
        for (gs = 0; gs < 5; gs++) {
            // Tier backing wall
            var gsWallGeo = new THREE.BoxGeometry(80, 15, 4);
            var gsWall = makeMesh(gsWallGeo, 0xcccccc);
            gsWall.position.set(12790, 7.5, -400 + gs * 120);
            addObj(gsWall);

            // Tier seating deck 1
            var gsDeck1Geo = new THREE.BoxGeometry(80, 1, 10);
            var gsDeck1 = makeMesh(gsDeck1Geo, 0x4466aa);
            gsDeck1.position.set(12790, 4, -400 + gs * 120);
            addObj(gsDeck1);

            // Tier seating deck 2
            var gsDeck2Geo = new THREE.BoxGeometry(80, 1, 10);
            var gsDeck2 = makeMesh(gsDeck2Geo, 0x4466aa);
            gsDeck2.position.set(12790, 8, -398 + gs * 120);
            addObj(gsDeck2);

            // Tier seating deck 3
            var gsDeck3Geo = new THREE.BoxGeometry(80, 1, 10);
            var gsDeck3 = makeMesh(gsDeck3Geo, 0x3355aa);
            gsDeck3.position.set(12790, 12, -396 + gs * 120);
            addObj(gsDeck3);

            // Support columns
            var sc;
            for (sc = 0; sc < 5; sc++) {
                var scGeo = new THREE.CylinderGeometry(0.6, 0.6, 15, 6);
                var scMesh = makeMesh(scGeo, 0xaaaaaa);
                scMesh.position.set(12782 + sc * 20, 7.5, -404 + gs * 120);
                addObj(scMesh);
            }

            // Grandstand roof
            var gsRoofGeo = new THREE.BoxGeometry(82, 1.5, 14);
            var gsRoof = makeMesh(gsRoofGeo, 0x99aabb);
            gsRoof.position.set(12790, 16, -396 + gs * 120);
            addObj(gsRoof);
        }

        // Commentary boxes - elevated glass booths
        var cb;
        for (cb = 0; cb < 3; cb++) {
            var cbGeo = new THREE.BoxGeometry(12, 10, 8);
            var cbMesh = makeMesh(cbGeo, 0xaaccdd);
            cbMesh.position.set(12782, 15, -350 + cb * 80);
            addObj(cbMesh);

            var cbRoofGeo = new THREE.BoxGeometry(14, 1.5, 10);
            var cbRoof = makeMesh(cbRoofGeo, 0x889999);
            cbRoof.position.set(12782, 20.5, -350 + cb * 80);
            addObj(cbRoof);
        }

        // Hospitality chalets row
        var ch;
        for (ch = 0; ch < 8; ch++) {
            var chGeo = new THREE.BoxGeometry(18, 6, 14);
            var chMesh = makeMesh(chGeo, 0xffeedd);
            chMesh.position.set(12768, 3, -420 + ch * 70);
            addObj(chMesh);

            var chRoofGeo = new THREE.BoxGeometry(20, 2, 16);
            var chRoof = makeMesh(chRoofGeo, 0xdd9966);
            chRoof.position.set(12768, 7, -420 + ch * 70);
            addObj(chRoof);

            // Chalet sign post
            var chSignGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 4);
            var chSign = makeMesh(chSignGeo, 0x666666);
            chSign.position.set(12759, 2.5, -420 + ch * 70);
            addObj(chSign);
        }

        // PA speaker towers along runway
        var sp;
        for (sp = 0; sp < 6; sp++) {
            var spPoleGeo = new THREE.CylinderGeometry(0.3, 0.3, 12, 5);
            var spPole = makeMesh(spPoleGeo, 0x777777);
            spPole.position.set(12800, 6, -450 + sp * 90);
            addObj(spPole);

            var spSpeakerGeo = new THREE.BoxGeometry(2, 3, 2);
            var spSpeaker = makeMesh(spSpeakerGeo, 0x444444);
            spSpeaker.position.set(12800, 12.5, -450 + sp * 90);
            addObj(spSpeaker);
        }
    }

    function buildAviationMuseum() {
        // Main museum hangar - large preserved aircraft hall
        var hangarGeo = new THREE.BoxGeometry(100, 25, 80);
        var hangar = makeMesh(hangarGeo, 0x99aa88);
        hangar.position.set(13080, 12.5, 400);
        addObj(hangar);

        // Curved hangar roof ridge
        var ridgeGeo = new THREE.CylinderGeometry(8, 8, 100, 8, 1, false, 0, Math.PI);
        var ridge = makeMesh(ridgeGeo, 0x778877);
        ridge.rotation.z = Math.PI / 2;
        ridge.position.set(13080, 28, 400);
        addObj(ridge);

        // Hangar doors - large sliding panels
        var door1Geo = new THREE.BoxGeometry(40, 20, 1.5);
        var door1 = makeMesh(door1Geo, 0x88aa77);
        door1.position.set(13062, 10, 360);
        addObj(door1);

        var door2Geo = new THREE.BoxGeometry(40, 20, 1.5);
        var door2 = makeMesh(door2Geo, 0x88aa77);
        door2.position.set(13098, 10, 360);
        addObj(door2);

        // Museum entrance building
        var entGeo = new THREE.BoxGeometry(30, 10, 15);
        var ent = makeMesh(entGeo, 0xbbccaa);
        ent.position.set(13080, 5, 358);
        addObj(ent);

        var entRoofGeo = new THREE.BoxGeometry(32, 1.5, 17);
        var entRoof = makeMesh(entRoofGeo, 0x99aa88);
        entRoof.position.set(13080, 10.5, 358);
        addObj(entRoof);

        // Historic biplane inside - Cody-era aircraft
        var bpFuseGeo = new THREE.BoxGeometry(2, 2.5, 12);
        var bpFuse = makeMesh(bpFuseGeo, 0xcc9966);
        bpFuse.position.set(13060, 3.25, 400);
        addObj(bpFuse);

        // Biplane lower wing
        var bpLWingGeo = new THREE.BoxGeometry(20, 0.4, 5);
        var bpLWing = makeMesh(bpLWingGeo, 0xbb8855);
        bpLWing.position.set(13060, 2, 399);
        addObj(bpLWing);

        // Biplane upper wing
        var bpUWingGeo = new THREE.BoxGeometry(22, 0.4, 5);
        var bpUWing = makeMesh(bpUWingGeo, 0xbb8855);
        bpUWing.position.set(13060, 5.5, 399);
        addObj(bpUWing);

        // Wing struts
        var ws1Geo = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 4);
        var ws1 = makeMesh(ws1Geo, 0x996644);
        ws1.position.set(13051, 3.75, 400);
        addObj(ws1);

        var ws2Geo = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 4);
        var ws2 = makeMesh(ws2Geo, 0x996644);
        ws2.position.set(13069, 3.75, 400);
        addObj(ws2);

        // Biplane tail
        var bpTailGeo = new THREE.BoxGeometry(0.8, 3, 4);
        var bpTail = makeMesh(bpTailGeo, 0xcc9966);
        bpTail.position.set(13060, 4, 406);
        addObj(bpTail);

        // Historic propeller
        var propGeo = new THREE.BoxGeometry(0.4, 8, 0.8);
        var prop = makeMesh(propGeo, 0x885533);
        prop.position.set(13060, 4, 393.5);
        addObj(prop);

        // WWII spitfire-style display
        var spitFuseGeo = new THREE.BoxGeometry(3, 3, 16);
        var spitFuse = makeMesh(spitFuseGeo, 0x778866);
        spitFuse.position.set(13095, 3.5, 400);
        addObj(spitFuse);

        var spitWingGeo = new THREE.BoxGeometry(25, 0.8, 10);
        var spitWing = makeMesh(spitWingGeo, 0x667755);
        spitWing.position.set(13095, 2.5, 402);
        addObj(spitWing);

        var spitNoseGeo = new THREE.ConeGeometry(1.5, 5, 6);
        var spitNose = makeMesh(spitNoseGeo, 0x778866);
        spitNose.rotation.x = -Math.PI / 2;
        spitNose.position.set(13095, 3.5, 389.5);
        addObj(spitNose);

        var spitTailGeo = new THREE.BoxGeometry(1, 4, 4);
        var spitTail = makeMesh(spitTailGeo, 0x778866);
        spitTail.position.set(13095, 6, 407);
        addObj(spitTail);

        // Museum car park
        var cpGeo = new THREE.BoxGeometry(80, 0.1, 60);
        var cp = makeMesh(cpGeo, 0x444444);
        cp.position.set(13120, 0.05, 400);
        addObj(cp);

        // Museum sign post
        var musSignPoleGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 5);
        var musSignPole = makeMesh(musSignPoleGeo, 0x555555);
        musSignPole.position.set(13060, 4, 355);
        addObj(musSignPole);

        var musSignGeo = new THREE.BoxGeometry(16, 4, 0.5);
        var musSign = makeMesh(musSignGeo, 0x336699);
        musSign.position.set(13060, 8.5, 355);
        addObj(musSign);
    }

    function buildGroundPlane() {
        // Airfield grass areas
        var grassGeo = new THREE.BoxGeometry(800, 0.05, 2200);
        var grass = makeMesh(grassGeo, 0x447744);
        grass.position.set(12900, 0.025, 0);
        addObj(grass);

        // Perimeter road
        var roadGeo = new THREE.BoxGeometry(800, 0.08, 10);
        var road = makeMesh(roadGeo, 0x333333);
        road.position.set(12900, 0.04, -1050);
        addObj(road);

        var road2Geo = new THREE.BoxGeometry(800, 0.08, 10);
        var road2 = makeMesh(road2Geo, 0x333333);
        road2.position.set(12900, 0.04, 1050);
        addObj(road2);

        // Perimeter fence
        var pf;
        for (pf = -1000; pf <= 1000; pf += 50) {
            var pfPostGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 5);
            var pfPost = makeMesh(pfPostGeo, 0x888888);
            pfPost.position.set(12550, 2, pf);
            addObj(pfPost);

            var pfPost2Geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 5);
            var pfPost2 = makeMesh(pfPost2Geo, 0x888888);
            pfPost2.position.set(13250, 2, pf);
            addObj(pfPost2);
        }

        // Windsock pole
        var wsockPoleGeo = new THREE.CylinderGeometry(0.4, 0.4, 15, 6);
        var wsockPole = makeMesh(wsockPoleGeo, 0xffffff);
        wsockPole.position.set(12870, 7.5, 600);
        addObj(wsockPole);

        var wsockGeo = new THREE.ConeGeometry(2, 10, 6);
        var wsock = makeMesh(wsockGeo, 0xff6600);
        wsock.rotation.z = -Math.PI / 2;
        wsock.position.set(12876, 15, 600);
        addObj(wsock);

        // Red and white stripes on windsock
        var wsStripe;
        for (wsStripe = 0; wsStripe < 3; wsStripe++) {
            var wsStripeGeo = new THREE.ConeGeometry(2.1 - wsStripe * 0.3, 2, 6);
            var wsStripeMesh = makeMesh(wsStripeGeo, 0xffffff);
            wsStripeMesh.rotation.z = -Math.PI / 2;
            wsStripeMesh.position.set(12874 + wsStripe * 2, 15, 600);
            addObj(wsStripeMesh);
        }
    }

    function build() {
        buildGroundPlane();
        buildRunway();
        buildHangars();
        buildStaticDisplayApron();
        buildControlTower();
        buildCodyMemorial();
        buildGrandstands();
        buildAviationMuseum();
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
