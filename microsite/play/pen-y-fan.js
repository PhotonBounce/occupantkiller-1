window.PenYFan = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14520;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        return mesh;
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildPenYFan() {
        // Main mountain body
        var bodyGeo = new THREE.BoxGeometry(320, 480, 280);
        var body = makeMesh(bodyGeo, 0x8B4513);
        body.position.set(X_OFFSET, 240, -200);
        addObj(body);

        // Flat plateau top - characteristic flat-topped sandstone summit
        var plateauGeo = new THREE.BoxGeometry(280, 18, 240);
        var plateau = makeMesh(plateauGeo, 0xA0522D);
        plateau.position.set(X_OFFSET, 486, -200);
        addObj(plateau);

        // North escarpment cliff face (sheer vertical drop)
        var cliffGeo = new THREE.BoxGeometry(280, 200, 20);
        var cliff = makeMesh(cliffGeo, 0x6B3410);
        cliff.position.set(X_OFFSET, 390, -78);
        addObj(cliff);

        // Secondary cliff layer for depth
        var cliff2Geo = new THREE.BoxGeometry(260, 140, 16);
        var cliff2 = makeMesh(cliff2Geo, 0x5A2D0C);
        cliff2.position.set(X_OFFSET, 360, -60);
        addObj(cliff2);

        // Trig point - white cylinder on summit
        var trigGeo = new THREE.CylinderGeometry(2, 2.5, 12, 8);
        var trig = makeMesh(trigGeo, 0xFFFFFF);
        trig.position.set(X_OFFSET + 8, 501, -200);
        addObj(trig);

        // Trig top disc
        var trigTopGeo = new THREE.CylinderGeometry(4, 2, 3, 8);
        var trigTop = makeMesh(trigTopGeo, 0xFFFFFF);
        trigTop.position.set(X_OFFSET + 8, 510, -200);
        addObj(trigTop);

        // Rock scatter on plateau
        var r, rockGeo, rock;
        for (r = 0; r < 8; r++) {
            rockGeo = new THREE.BoxGeometry(6 + r * 2, 4 + r, 5 + r);
            rock = makeMesh(rockGeo, 0x7A3B1E);
            rock.position.set(X_OFFSET - 80 + r * 22, 494, -220 + r * 10);
            rock.rotation.y = r * 0.4;
            addObj(rock);
        }
    }

    function buildCornDu() {
        // Corn Du - adjacent flat-topped peak, slightly lower, to the west
        var bodyGeo = new THREE.BoxGeometry(290, 440, 260);
        var body = makeMesh(bodyGeo, 0x8B4513);
        body.position.set(X_OFFSET - 380, 220, -180);
        addObj(body);

        // Corn Du plateau - slightly lower than Pen y Fan
        var plateauGeo = new THREE.BoxGeometry(250, 16, 220);
        var plateau = makeMesh(plateauGeo, 0xA0522D);
        plateau.position.set(X_OFFSET - 380, 444, -180);
        addObj(plateau);

        // North cliff face
        var cliffGeo = new THREE.BoxGeometry(250, 180, 18);
        var cliff = makeMesh(cliffGeo, 0x6B3410);
        cliff.position.set(X_OFFSET - 380, 360, -62);
        addObj(cliff);

        // Connecting ridge between Corn Du and Pen y Fan
        var ridgeGeo = new THREE.BoxGeometry(100, 30, 80);
        var ridge = makeMesh(ridgeGeo, 0x8B4513);
        ridge.position.set(X_OFFSET - 185, 435, -190);
        addObj(ridge);

        // Ridge path stones
        var s;
        for (s = 0; s < 5; s++) {
            var stoneGeo = new THREE.BoxGeometry(8, 3, 12);
            var stone = makeMesh(stoneGeo, 0xA0522D);
            stone.position.set(X_OFFSET - 350 + s * 38, 452, -190);
            addObj(stone);
        }

        // Corn Du summit cairn
        var cairnBaseGeo = new THREE.CylinderGeometry(8, 12, 6, 8);
        var cairnBase = makeMesh(cairnBaseGeo, 0x9E8074);
        cairnBase.position.set(X_OFFSET - 380, 453, -180);
        addObj(cairnBase);
    }

    function buildCribyn() {
        // Cribyn - sharper peak to the east, more pointed
        var baseGeo = new THREE.BoxGeometry(260, 380, 240);
        var base = makeMesh(baseGeo, 0x7B3F00);
        base.position.set(X_OFFSET + 420, 190, -160);
        addObj(base);

        // Stacked boxes to create pointed/tapered peak shape
        var mid1Geo = new THREE.BoxGeometry(200, 60, 180);
        var mid1 = makeMesh(mid1Geo, 0x8B4513);
        mid1.position.set(X_OFFSET + 420, 410, -160);
        addObj(mid1);

        var mid2Geo = new THREE.BoxGeometry(140, 50, 120);
        var mid2 = makeMesh(mid2Geo, 0x964B00);
        mid2.position.set(X_OFFSET + 420, 465, -160);
        addObj(mid2);

        var mid3Geo = new THREE.BoxGeometry(90, 40, 80);
        var mid3 = makeMesh(mid3Geo, 0xA0522D);
        mid3.position.set(X_OFFSET + 420, 510, -160);
        addObj(mid3);

        // Pointed summit top
        var peakGeo = new THREE.ConeGeometry(30, 50, 6);
        var peak = makeMesh(peakGeo, 0xA0522D);
        peak.position.set(X_OFFSET + 420, 555, -160);
        addObj(peak);

        // Cribyn-Pen y Fan connecting ridge
        var ridgeGeo = new THREE.BoxGeometry(100, 25, 70);
        var ridge = makeMesh(ridgeGeo, 0x7B3F00);
        ridge.position.set(X_OFFSET + 200, 420, -180);
        addObj(ridge);
    }

    function buildGlacialCwm() {
        // U-shaped glacial valley floor
        var valleyGeo = new THREE.BoxGeometry(600, 20, 400);
        var valley = makeMesh(valleyGeo, 0x4A7B4A);
        valley.position.set(X_OFFSET, 10, 100);
        addObj(valley);

        // Cwm headwall cliffs - back wall of glacial cirque
        var headwall1Geo = new THREE.BoxGeometry(500, 180, 30);
        var headwall1 = makeMesh(headwall1Geo, 0x5A3A1A);
        headwall1.position.set(X_OFFSET, 100, -80);
        addObj(headwall1);

        // Cwm side walls
        var sidewall1Geo = new THREE.BoxGeometry(30, 140, 300);
        var sidewall1 = makeMesh(sidewall1Geo, 0x5A3A1A);
        sidewall1.position.set(X_OFFSET - 280, 80, 60);
        addObj(sidewall1);

        var sidewall2Geo = new THREE.BoxGeometry(30, 140, 300);
        var sidewall2 = makeMesh(sidewall2Geo, 0x5A3A1A);
        sidewall2.position.set(X_OFFSET + 280, 80, 60);
        addObj(sidewall2);

        // Llyn Cwm Llwch - glacial lake (blue oval using scaled box)
        var lakeGeo = new THREE.BoxGeometry(140, 3, 90);
        var lake = makeMesh(lakeGeo, 0x1E5F8A);
        lake.position.set(X_OFFSET - 60, 14, 140);
        addObj(lake);

        // Lake shore rocks
        var lk;
        for (lk = 0; lk < 6; lk++) {
            var lkRockGeo = new THREE.BoxGeometry(10, 5, 8);
            var lkRock = makeMesh(lkRockGeo, 0x808080);
            lkRock.position.set(X_OFFSET - 120 + lk * 25, 15, 110 + (lk % 2) * 40);
            addObj(lkRock);
        }

        // Moraine deposits - ridges of glacial debris
        var moraine1Geo = new THREE.BoxGeometry(200, 15, 30);
        var moraine1 = makeMesh(moraine1Geo, 0x8B7355);
        moraine1.position.set(X_OFFSET, 17, 220);
        addObj(moraine1);

        var moraine2Geo = new THREE.BoxGeometry(160, 12, 24);
        var moraine2 = makeMesh(moraine2Geo, 0x8B7355);
        moraine2.position.set(X_OFFSET + 40, 16, 260);
        addObj(moraine2);

        // Moraine stones scatter
        var ms;
        for (ms = 0; ms < 10; ms++) {
            var msGeo = new THREE.BoxGeometry(8 + ms, 6 + ms * 0.5, 7 + ms);
            var msObj = makeMesh(msGeo, 0x9E9E7A);
            msObj.position.set(X_OFFSET - 150 + ms * 32, 18, 200 + (ms % 3) * 20);
            msObj.rotation.y = ms * 0.6;
            addObj(msObj);
        }
    }

    function buildMilitaryTraining() {
        // SAS/Para training route markers - stone posts
        var mk;
        for (mk = 0; mk < 6; mk++) {
            var markerGeo = new THREE.CylinderGeometry(3, 3, 20, 6);
            var marker = makeMesh(markerGeo, 0x556B2F);
            marker.position.set(X_OFFSET - 200 + mk * 80, 30, 300 + mk * 30);
            addObj(marker);
        }

        // Log barriers - horizontal logs on posts
        var lb;
        for (lb = 0; lb < 4; lb++) {
            var logGeo = new THREE.BoxGeometry(60, 8, 8);
            var log = makeMesh(logGeo, 0x6B4226);
            log.position.set(X_OFFSET - 100 + lb * 70, 35, 350);
            addObj(log);

            // Support posts
            var postGeo = new THREE.BoxGeometry(6, 30, 6);
            var postL = makeMesh(postGeo, 0x6B4226);
            postL.position.set(X_OFFSET - 128 + lb * 70, 25, 350);
            addObj(postL);

            var postRGeo = new THREE.BoxGeometry(6, 30, 6);
            var postR = makeMesh(postRGeo, 0x6B4226);
            postR.position.set(X_OFFSET - 72 + lb * 70, 25, 350);
            addObj(postR);
        }

        // Rope obstacle course - LineSegments
        var ropePoints = [];
        var rp;
        for (rp = 0; rp < 8; rp++) {
            // Horizontal rope segment
            ropePoints.push(X_OFFSET - 180 + rp * 45, 45, 420);
            ropePoints.push(X_OFFSET - 135 + rp * 45, 45, 420);
            // Diagonal drop rope
            ropePoints.push(X_OFFSET - 135 + rp * 45, 45, 420);
            ropePoints.push(X_OFFSET - 135 + rp * 45, 22, 420);
        }
        var ropeBuf = new THREE.BufferGeometry();
        ropeBuf.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ropePoints), 3));
        var ropeMat = new THREE.LineBasicMaterial({ color: 0x8B6914 });
        var ropes = new THREE.LineSegments(ropeBuf, ropeMat);
        scene.add(ropes);
        objects.push(ropes);

        // Rope vertical poles
        var vp;
        for (vp = 0; vp < 5; vp++) {
            var vpGeo = new THREE.CylinderGeometry(2, 2, 50, 6);
            var vpMesh = makeMesh(vpGeo, 0x4A3728);
            vpMesh.position.set(X_OFFSET - 180 + vp * 88, 25, 420);
            addObj(vpMesh);
        }

        // Military vehicle track (beaten path boxes)
        var tr;
        for (tr = 0; tr < 12; tr++) {
            var trackGeo = new THREE.BoxGeometry(40, 2, 18);
            var track = makeMesh(trackGeo, 0x6B6B6B);
            track.position.set(X_OFFSET + 100 + tr * 42, 12, 380 + (tr % 2) * 8);
            addObj(track);
        }

        // Rucksack training markers - small cairns along route
        var rc;
        for (rc = 0; rc < 5; rc++) {
            var rcGeo = new THREE.SphereGeometry(5, 6, 4);
            var rcObj = makeMesh(rcGeo, 0x808080);
            rcObj.position.set(X_OFFSET - 240 + rc * 60, 22, 480);
            addObj(rcObj);
        }

        // Storey Arms reference - road marker post
        var sarmGeo = new THREE.BoxGeometry(5, 40, 5);
        var sarm = makeMesh(sarmGeo, 0xFFFFFF);
        sarm.position.set(X_OFFSET + 300, 20, 500);
        addObj(sarm);

        var sarmTopGeo = new THREE.BoxGeometry(20, 6, 5);
        var sarmTop = makeMesh(sarmTopGeo, 0x228B22);
        sarmTop.position.set(X_OFFSET + 300, 44, 500);
        addObj(sarmTop);
    }

    function buildTommyJonesObelisk() {
        // Tommy Jones obelisk - Victorian memorial near Pen y Fan summit
        // Located on path between Pen y Fan and Corn Du

        // Cairn pile at base
        var ci;
        for (ci = 0; ci < 7; ci++) {
            var cairnGeo = new THREE.BoxGeometry(10 - ci, 5, 10 - ci);
            var cairnStone = makeMesh(cairnGeo, 0x8A8A8A);
            cairnStone.position.set(X_OFFSET - 160 + (ci % 3) * 8, 21 + ci * 4, -60 + (ci % 2) * 6);
            addObj(cairnStone);
        }

        // Obelisk base slab (inscription stone)
        var slabGeo = new THREE.BoxGeometry(22, 8, 18);
        var slab = makeMesh(slabGeo, 0xC8C8C8);
        slab.position.set(X_OFFSET - 150, 24, -50);
        addObj(slab);

        // Obelisk lower section
        var obeliskLowGeo = new THREE.BoxGeometry(14, 40, 14);
        var obeliskLow = makeMesh(obeliskLowGeo, 0xBEBEBE);
        obeliskLow.position.set(X_OFFSET - 150, 52, -50);
        addObj(obeliskLow);

        // Obelisk middle section - tapering
        var obeliskMidGeo = new THREE.BoxGeometry(10, 50, 10);
        var obeliskMid = makeMesh(obeliskMidGeo, 0xC8C8C8);
        obeliskMid.position.set(X_OFFSET - 150, 97, -50);
        addObj(obeliskMid);

        // Obelisk upper section - further tapering
        var obeliskUpGeo = new THREE.BoxGeometry(7, 40, 7);
        var obeliskUp = makeMesh(obeliskUpGeo, 0xD2D2D2);
        obeliskUp.position.set(X_OFFSET - 150, 142, -50);
        addObj(obeliskUp);

        // Obelisk pyramidal tip
        var obeliskTipGeo = new THREE.ConeGeometry(5, 20, 4);
        var obeliskTip = makeMesh(obeliskTipGeo, 0xD8D8D8);
        obeliskTip.position.set(X_OFFSET - 150, 172, -50);
        addObj(obeliskTip);

        // Additional cairn stones nearby
        var nc;
        for (nc = 0; nc < 5; nc++) {
            var ncGeo = new THREE.BoxGeometry(7 + nc, 5 + nc * 0.5, 7);
            var ncObj = makeMesh(ncGeo, 0x909090);
            ncObj.position.set(X_OFFSET - 130 + nc * 12, 18, -40 + nc * 5);
            ncObj.rotation.y = nc * 0.8;
            addObj(ncObj);
        }
    }

    function buildSummitPath() {
        // Path from Storey Arms up to summit - worn stone path
        var sp;
        for (sp = 0; sp < 20; sp++) {
            var stepGeo = new THREE.BoxGeometry(25, 4, 14);
            var step = makeMesh(stepGeo, 0x7A6A5A);
            step.position.set(X_OFFSET - 30 + (sp % 3) * 10, 14 + sp * 22, 400 - sp * 28);
            addObj(step);
        }
    }

    function buildBaseTerrain() {
        // Base terrain ground plane around the area
        var groundGeo = new THREE.BoxGeometry(1400, 8, 1200);
        var ground = makeMesh(groundGeo, 0x4A7040);
        ground.position.set(X_OFFSET, 0, 150);
        addObj(ground);

        // Approach moorland
        var moorGeo = new THREE.BoxGeometry(1200, 6, 600);
        var moor = makeMesh(moorGeo, 0x5A6A3A);
        moor.position.set(X_OFFSET, 8, 500);
        addObj(moor);

        // Rocky outcrops on moorland
        var ro;
        for (ro = 0; ro < 12; ro++) {
            var roGeo = new THREE.BoxGeometry(15 + ro * 3, 10 + ro * 2, 12 + ro * 2);
            var roObj = makeMesh(roGeo, 0x8B7355);
            roObj.position.set(X_OFFSET - 500 + ro * 90, 14, 350 + (ro % 4) * 50);
            roObj.rotation.y = ro * 0.7;
            addObj(roObj);
        }
    }

    function build() {
        buildBaseTerrain();
        buildPenYFan();
        buildCornDu();
        buildCribyn();
        buildGlacialCwm();
        buildMilitaryTraining();
        buildTommyJonesObelisk();
        buildSummitPath();
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
