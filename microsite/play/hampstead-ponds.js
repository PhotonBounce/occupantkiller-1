window.HampsteadPonds = (function() {
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

    function makeMesh(geo, mat) {
        return new THREE.Mesh(geo, mat);
    }

    function build() {
        buildParliamentHill();
        buildSwimmingPonds();
        buildKenwoodHouse();
        buildHeathWoodland();
        buildSpaniardsInn();
    }

    // ─── 1. Parliament Hill ───────────────────────────────────────────────────

    function buildParliamentHill() {
        var hillMat = new THREE.MeshLambertMaterial({ color: 0x5a8c3c });
        var hillDarkMat = new THREE.MeshLambertMaterial({ color: 0x4a7a2e });

        // Stepped terrain — largest base
        var base = makeMesh(new THREE.BoxGeometry(120, 8, 120), hillMat);
        base.position.set(12040, 4, -80);
        addMesh(base);

        var mid = makeMesh(new THREE.BoxGeometry(80, 10, 80), hillMat);
        mid.position.set(12040, 13, -80);
        addMesh(mid);

        var upper = makeMesh(new THREE.BoxGeometry(50, 9, 50), hillDarkMat);
        upper.position.set(12040, 26.5, -80);
        addMesh(upper);

        var peak = makeMesh(new THREE.BoxGeometry(24, 7, 24), hillDarkMat);
        peak.position.set(12040, 37.5, -80);
        addMesh(peak);

        var cap = makeMesh(new THREE.BoxGeometry(10, 4, 10), new THREE.MeshLambertMaterial({ color: 0x6aaa40 }));
        cap.position.set(12040, 43, -80);
        addMesh(cap);

        // Paths up the hill
        buildHillPaths();

        // Kite flyers
        buildKiteFlyers();

        // London view backdrop — distant skyline silhouette
        buildLondonBackdrop();

        // Benches at top
        buildParlHillBenches();
    }

    function buildHillPaths() {
        var pathMat = new THREE.MeshLambertMaterial({ color: 0xc8a46e });
        var p1 = makeMesh(new THREE.BoxGeometry(4, 0.5, 60), pathMat);
        p1.position.set(12020, 18, -80);
        p1.rotation.z = -0.18;
        addMesh(p1);

        var p2 = makeMesh(new THREE.BoxGeometry(4, 0.5, 50), pathMat);
        p2.position.set(12060, 16, -80);
        p2.rotation.z = 0.18;
        addMesh(p2);
    }

    function buildKiteFlyers() {
        var kitePositions = [
            [12035, 46, -88],
            [12045, 46, -74],
            [12028, 44, -82]
        ];
        var kiteColors = [0xff2222, 0xffdd00, 0x2255ff];

        for (var i = 0; i < kitePositions.length; i++) {
            var kp = kitePositions[i];
            var kc = kiteColors[i];

            // Kite body — thin flat box
            var kiteMat = new THREE.MeshLambertMaterial({ color: kc });
            var kite = makeMesh(new THREE.BoxGeometry(2.0, 2.6, 0.12), kiteMat);
            kite.position.set(kp[0], kp[1] + 14, kp[2]);
            kite.rotation.z = 0.22;
            addMesh(kite);

            // Kite cross spars
            var sparMat = new THREE.MeshLambertMaterial({ color: 0x4a3200 });
            var sparH = makeMesh(new THREE.BoxGeometry(2.1, 0.18, 0.18), sparMat);
            sparH.position.set(kp[0], kp[1] + 14, kp[2] - 0.06);
            sparH.rotation.z = 0.22;
            addMesh(sparH);

            var sparV = makeMesh(new THREE.BoxGeometry(0.18, 2.7, 0.18), sparMat);
            sparV.position.set(kp[0], kp[1] + 14, kp[2] - 0.06);
            sparV.rotation.z = 0.22;
            addMesh(sparV);

            // String — LineSegments from flyer hand to kite
            var strGeo = new THREE.BufferGeometry();
            var strPts = new Float32Array([
                kp[0], kp[1], kp[2],
                kp[0], kp[1] + 14, kp[2]
            ]);
            strGeo.setAttribute('position', new THREE.BufferAttribute(strPts, 3));
            var strLine = new THREE.LineSegments(strGeo, new THREE.MeshLambertMaterial({ color: 0xdddddd }));
            scene.add(strLine);
            objects.push(strLine);

            // Tail
            var tailGeo = new THREE.BufferGeometry();
            var tailPts = new Float32Array([
                kp[0], kp[1] + 13, kp[2],
                kp[0] - 1, kp[1] + 10, kp[2],
                kp[0] - 1, kp[1] + 10, kp[2],
                kp[0] - 0.5, kp[1] + 8, kp[2]
            ]);
            tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPts, 3));
            var tailLine = new THREE.LineSegments(tailGeo, new THREE.MeshLambertMaterial({ color: kc }));
            scene.add(tailLine);
            objects.push(tailLine);

            // Flyer body (tiny cylinder)
            var flyerMat = new THREE.MeshLambertMaterial({ color: 0x336699 });
            var flyer = makeMesh(new THREE.CylinderGeometry(0.3, 0.3, 1.8, 6), flyerMat);
            flyer.position.set(kp[0], kp[1] + 0.9, kp[2]);
            addMesh(flyer);

            // Flyer head
            var headMat = new THREE.MeshLambertMaterial({ color: 0xf0c080 });
            var head = makeMesh(new THREE.SphereGeometry(0.35, 6, 6), headMat);
            head.position.set(kp[0], kp[1] + 2.2, kp[2]);
            addMesh(head);
        }
    }

    function buildLondonBackdrop() {
        // Distant skyline silhouette boxes — muted grey-blue
        var skyMat = new THREE.MeshLambertMaterial({ color: 0x8899aa });
        var skyData = [
            [12080, 20, -180, 18, 40, 6],
            [12095, 20, -180, 10, 60, 6],
            [12060, 20, -180, 14, 30, 6],
            [12040, 20, -180, 20, 25, 6],
            [12020, 20, -180, 12, 35, 6],
            [12000, 20, -180, 16, 28, 6],
            [11980, 20, -180, 22, 20, 6],
            [12110, 20, -180, 8, 50, 6]
        ];
        for (var i = 0; i < skyData.length; i++) {
            var d = skyData[i];
            var b = makeMesh(new THREE.BoxGeometry(d[3], d[4], d[5]), skyMat);
            b.position.set(d[0], d[1] + d[4] / 2, d[2]);
            addMesh(b);
        }
        // Shard-like tall spike
        var shardMat = new THREE.MeshLambertMaterial({ color: 0xaabbcc });
        var shard = makeMesh(new THREE.ConeGeometry(3, 55, 4), shardMat);
        shard.position.set(12085, 57.5, -180);
        addMesh(shard);
    }

    function buildParlHillBenches() {
        var benchMat = new THREE.MeshLambertMaterial({ color: 0x7a5c30 });
        var benchPos = [
            [12038, 42, -88],
            [12044, 42, -74]
        ];
        for (var i = 0; i < benchPos.length; i++) {
            var bp = benchPos[i];
            var seat = makeMesh(new THREE.BoxGeometry(3.5, 0.2, 1.0), benchMat);
            seat.position.set(bp[0], bp[1] + 0.8, bp[2]);
            addMesh(seat);
            var leg1 = makeMesh(new THREE.BoxGeometry(0.2, 0.8, 1.0), benchMat);
            leg1.position.set(bp[0] - 1.5, bp[1] + 0.4, bp[2]);
            addMesh(leg1);
            var leg2 = makeMesh(new THREE.BoxGeometry(0.2, 0.8, 1.0), benchMat);
            leg2.position.set(bp[0] + 1.5, bp[1] + 0.4, bp[2]);
            addMesh(leg2);
            var back = makeMesh(new THREE.BoxGeometry(3.5, 0.8, 0.15), benchMat);
            back.position.set(bp[0], bp[1] + 1.3, bp[2] - 0.45);
            addMesh(back);
        }
    }

    // ─── 2. Swimming Ponds ───────────────────────────────────────────────────

    function buildSwimmingPonds() {
        // Three ponds at different positions
        buildPond(12040, 0.1, 40, 28, 16, 0x2e7d7a, 'mens');
        buildPond(12080, 0.1, 65, 24, 14, 0x2a8c6e, 'ladies');
        buildPond(12000, 0.1, 50, 30, 18, 0x1e6e70, 'mixed');
    }

    function buildPond(cx, cy, cz, ww, wd, color, type) {
        var waterMat = new THREE.MeshLambertMaterial({ color: color });
        var bankMat = new THREE.MeshLambertMaterial({ color: 0x7a9c50 });
        var mudMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });

        // Bank
        var bank = makeMesh(new THREE.BoxGeometry(ww + 6, 1.0, wd + 6), bankMat);
        bank.position.set(cx, cy - 0.5, cz);
        addMesh(bank);

        // Water surface
        var water = makeMesh(new THREE.BoxGeometry(ww, 0.5, wd), waterMat);
        water.position.set(cx, cy, cz);
        addMesh(water);

        // Muddy shallow edges
        var mud = makeMesh(new THREE.BoxGeometry(ww + 2, 0.3, wd + 2), mudMat);
        mud.position.set(cx, cy - 0.1, cz);
        addMesh(mud);

        // Lily pads — flat green discs (CylinderGeometry, very flat)
        buildLilyPads(cx, cy, cz, ww, wd);

        // Changing huts
        buildChangingHuts(cx, cy, cz, ww, wd);

        // Lifeguard platform
        buildLifeguardPlatform(cx, cy, cz, ww);
    }

    function buildLilyPads(cx, cy, cz, ww, wd) {
        var lilyMat = new THREE.MeshLambertMaterial({ color: 0x3a8c28 });
        var flowerMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var positions = [
            [cx - ww * 0.3, cy + 0.3, cz - wd * 0.3],
            [cx + ww * 0.25, cy + 0.3, cz - wd * 0.25],
            [cx - ww * 0.1, cy + 0.3, cz + wd * 0.3],
            [cx + ww * 0.35, cy + 0.3, cz + wd * 0.2],
            [cx - ww * 0.4, cy + 0.3, cz + wd * 0.1]
        ];
        for (var i = 0; i < positions.length; i++) {
            var lp = positions[i];
            var pad = makeMesh(new THREE.CylinderGeometry(1.2, 1.2, 0.12, 8), lilyMat);
            pad.position.set(lp[0], lp[1], lp[2]);
            addMesh(pad);
            // Small white flower on some
            if (i % 2 === 0) {
                var flower = makeMesh(new THREE.SphereGeometry(0.3, 5, 4), flowerMat);
                flower.position.set(lp[0], lp[1] + 0.3, lp[2]);
                addMesh(flower);
            }
        }
    }

    function buildChangingHuts(cx, cy, cz, ww, wd) {
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x6b4a10 });
        var hutOffsets = [
            [cx - ww / 2 - 5, cz - wd / 2 - 3],
            [cx - ww / 2 - 5, cz - wd / 2 + 3],
            [cx - ww / 2 - 5, cz + wd / 2 - 3]
        ];
        for (var i = 0; i < hutOffsets.length; i++) {
            var ho = hutOffsets[i];
            var hut = makeMesh(new THREE.BoxGeometry(3.5, 3.0, 2.5), hutMat);
            hut.position.set(ho[0], cy + 1.5, ho[1]);
            addMesh(hut);
            var roof = makeMesh(new THREE.BoxGeometry(3.8, 0.4, 2.8), roofMat);
            roof.position.set(ho[0], cy + 3.2, ho[1]);
            addMesh(roof);
            // Door
            var doorMat = new THREE.MeshLambertMaterial({ color: 0x4a3000 });
            var door = makeMesh(new THREE.BoxGeometry(0.9, 2.0, 0.15), doorMat);
            door.position.set(ho[0], cy + 1.0, ho[1] + 1.28);
            addMesh(door);
        }
    }

    function buildLifeguardPlatform(cx, cy, cz, ww) {
        var platMat = new THREE.MeshLambertMaterial({ color: 0xcc3300 });
        var woodMat = new THREE.MeshLambertMaterial({ color: 0xb8882a });

        // Platform legs
        var legPos = [
            [cx + ww / 2 + 2, cy + 1.5, cz - 2],
            [cx + ww / 2 + 2, cy + 1.5, cz + 2],
            [cx + ww / 2 + 6, cy + 1.5, cz - 2],
            [cx + ww / 2 + 6, cy + 1.5, cz + 2]
        ];
        for (var i = 0; i < legPos.length; i++) {
            var lp = legPos[i];
            var leg = makeMesh(new THREE.BoxGeometry(0.3, 3.0, 0.3), woodMat);
            leg.position.set(lp[0], lp[1], lp[2]);
            addMesh(leg);
        }
        // Platform floor
        var floor = makeMesh(new THREE.BoxGeometry(4.5, 0.3, 4.5), woodMat);
        floor.position.set(cx + ww / 2 + 4, cy + 3.15, cz);
        addMesh(floor);
        // Chair
        var chair = makeMesh(new THREE.BoxGeometry(1.2, 1.6, 1.0), platMat);
        chair.position.set(cx + ww / 2 + 4, cy + 4.1, cz);
        addMesh(chair);
        // Umbrella pole
        var poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var pole = makeMesh(new THREE.CylinderGeometry(0.1, 0.1, 3.5, 6), poleMat);
        pole.position.set(cx + ww / 2 + 4, cy + 5.9, cz);
        addMesh(pole);
        var umbrella = makeMesh(new THREE.ConeGeometry(2.2, 0.8, 8), platMat);
        umbrella.position.set(cx + ww / 2 + 4, cy + 7.8, cz);
        addMesh(umbrella);
    }

    // ─── 3. Kenwood House ────────────────────────────────────────────────────

    function buildKenwoodHouse() {
        var kx = 12100;
        var kz = -30;

        buildKenwoodMain(kx, kz);
        buildKenwoodLibraryWing(kx, kz);
        buildKenwoodColumns(kx, kz);
        buildKenwoodLawn(kx, kz);
        buildKenwoodHaha(kx, kz);
        buildKenwoodBridge(kx, kz);
        buildKenwoodOrnamentalPond(kx, kz);
    }

    function buildKenwoodMain(kx, kz) {
        var stuccoMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var windowMat = new THREE.MeshLambertMaterial({ color: 0x8899bb });
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0xddddcc });

        // Main body
        var main = makeMesh(new THREE.BoxGeometry(40, 14, 18), stuccoMat);
        main.position.set(kx, 7, kz);
        addMesh(main);

        // Roof
        var roof = makeMesh(new THREE.BoxGeometry(41, 2.5, 19), roofMat);
        roof.position.set(kx, 15.25, kz);
        addMesh(roof);

        // Pediment / triangular gable centre
        var pedMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0 });
        var pediment = makeMesh(new THREE.BoxGeometry(14, 3, 2), pedMat);
        pediment.position.set(kx, 16.5, kz - 9.5);
        addMesh(pediment);

        // Windows — front facade
        for (var wi = 0; wi < 5; wi++) {
            var wx = kx - 16 + wi * 8;
            var win = makeMesh(new THREE.BoxGeometry(2.5, 4.0, 0.3), windowMat);
            win.position.set(wx, 8, kz - 9.15);
            addMesh(win);
            // Window surround
            var surMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
            var sur = makeMesh(new THREE.BoxGeometry(3.0, 4.6, 0.2), surMat);
            sur.position.set(wx, 8, kz - 9.25);
            addMesh(sur);
        }

        // Door — grand entrance
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a0a });
        var door = makeMesh(new THREE.BoxGeometry(3.0, 6.0, 0.3), doorMat);
        door.position.set(kx, 3.0, kz - 9.15);
        addMesh(door);

        // Chimneys
        var chimPos = [
            [kx - 16, 20, kz],
            [kx + 16, 20, kz],
            [kx - 8, 20, kz],
            [kx + 8, 20, kz]
        ];
        for (var ci = 0; ci < chimPos.length; ci++) {
            var cp = chimPos[ci];
            var chim = makeMesh(new THREE.BoxGeometry(1.5, 5.0, 1.5), chimneyMat);
            chim.position.set(cp[0], cp[1], cp[2]);
            addMesh(chim);
        }
    }

    function buildKenwoodLibraryWing(kx, kz) {
        var wingMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var winMat = new THREE.MeshLambertMaterial({ color: 0x8899bb });

        // Left wing (library)
        var lw = makeMesh(new THREE.BoxGeometry(16, 12, 16), wingMat);
        lw.position.set(kx - 28, 6, kz);
        addMesh(lw);
        var lwRoof = makeMesh(new THREE.BoxGeometry(17, 2, 17), roofMat);
        lwRoof.position.set(kx - 28, 13, kz);
        addMesh(lwRoof);
        // Bow window on library end
        var bowWin = makeMesh(new THREE.CylinderGeometry(3, 3, 10, 6), wingMat);
        bowWin.position.set(kx - 36.5, 6, kz);
        addMesh(bowWin);
        // Library windows
        for (var i = 0; i < 3; i++) {
            var lwin = makeMesh(new THREE.BoxGeometry(2.0, 4.0, 0.3), winMat);
            lwin.position.set(kx - 33 + i * 5, 7, kz - 8.15);
            addMesh(lwin);
        }

        // Right wing
        var rw = makeMesh(new THREE.BoxGeometry(16, 12, 16), wingMat);
        rw.position.set(kx + 28, 6, kz);
        addMesh(rw);
        var rwRoof = makeMesh(new THREE.BoxGeometry(17, 2, 17), roofMat);
        rwRoof.position.set(kx + 28, 13, kz);
        addMesh(rwRoof);
        for (var j = 0; j < 3; j++) {
            var rwin = makeMesh(new THREE.BoxGeometry(2.0, 4.0, 0.3), winMat);
            rwin.position.set(kx + 23 + j * 5, 7, kz - 8.15);
            addMesh(rwin);
        }
    }

    function buildKenwoodColumns(kx, kz) {
        var colMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        // Portico — 6 columns
        for (var ci = 0; ci < 6; ci++) {
            var cx = kx - 10 + ci * 4;
            var col = makeMesh(new THREE.CylinderGeometry(0.55, 0.65, 12, 8), colMat);
            col.position.set(cx, 6, kz - 12);
            addMesh(col);
        }
        // Entablature above columns
        var entabMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
        var entab = makeMesh(new THREE.BoxGeometry(22, 1.5, 1.5), entabMat);
        entab.position.set(kx, 12.75, kz - 12);
        addMesh(entab);
    }

    function buildKenwoodLawn(kx, kz) {
        var lawnMat = new THREE.MeshLambertMaterial({ color: 0x4a9c30 });
        var lawn = makeMesh(new THREE.BoxGeometry(120, 0.4, 80), lawnMat);
        lawn.position.set(kx, -0.2, kz + 40);
        addMesh(lawn);
        // Gravel path
        var gravelMat = new THREE.MeshLambertMaterial({ color: 0xc8b880 });
        var path = makeMesh(new THREE.BoxGeometry(6, 0.2, 60), gravelMat);
        path.position.set(kx, 0.1, kz + 20);
        addMesh(path);
        // Topiary spheres
        buildTopiary(kx, kz);
    }

    function buildTopiary(kx, kz) {
        var topiaryMat = new THREE.MeshLambertMaterial({ color: 0x2a6e20 });
        var stalkMat = new THREE.MeshLambertMaterial({ color: 0x5a3a10 });
        var topiaryPos = [
            [kx - 6, 0, kz - 14],
            [kx + 6, 0, kz - 14],
            [kx - 16, 0, kz - 14],
            [kx + 16, 0, kz - 14]
        ];
        for (var i = 0; i < topiaryPos.length; i++) {
            var tp = topiaryPos[i];
            var stalk = makeMesh(new THREE.CylinderGeometry(0.25, 0.3, 2.5, 6), stalkMat);
            stalk.position.set(tp[0], tp[1] + 1.25, tp[2]);
            addMesh(stalk);
            var ball = makeMesh(new THREE.SphereGeometry(1.5, 7, 6), topiaryMat);
            ball.position.set(tp[0], tp[1] + 4.0, tp[2]);
            addMesh(ball);
        }
    }

    function buildKenwoodHaha(kx, kz) {
        // Ha-ha — hidden retaining wall keeping deer out
        var hahaMat = new THREE.MeshLambertMaterial({ color: 0x9e8866 });
        var hahaWall = makeMesh(new THREE.BoxGeometry(120, 1.8, 1.0), hahaMat);
        hahaWall.position.set(kx, 0.9, kz + 70);
        addMesh(hahaWall);
    }

    function buildKenwoodOrnamentalPond(kx, kz) {
        var pondMat = new THREE.MeshLambertMaterial({ color: 0x3a6e8c });
        var pond = makeMesh(new THREE.BoxGeometry(30, 0.5, 20), pondMat);
        pond.position.set(kx, 0.25, kz + 30);
        addMesh(pond);
        var bankMat = new THREE.MeshLambertMaterial({ color: 0x5a8040 });
        var bank = makeMesh(new THREE.BoxGeometry(34, 0.3, 24), bankMat);
        bank.position.set(kx, 0.1, kz + 30);
        addMesh(bank);
    }

    function buildKenwoodBridge(kx, kz) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xccbbaa });
        // Bridge deck
        var deck = makeMesh(new THREE.BoxGeometry(6, 0.6, 8), stoneMat);
        deck.position.set(kx, 1.0, kz + 18);
        addMesh(deck);
        // Bridge side rails
        var railMat = new THREE.MeshLambertMaterial({ color: 0xbbaa99 });
        var rail1 = makeMesh(new THREE.BoxGeometry(0.4, 1.2, 8), railMat);
        rail1.position.set(kx - 3.2, 1.9, kz + 18);
        addMesh(rail1);
        var rail2 = makeMesh(new THREE.BoxGeometry(0.4, 1.2, 8), railMat);
        rail2.position.set(kx + 3.2, 1.9, kz + 18);
        addMesh(rail2);
        // Arch supports (decorative)
        var arch1 = makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8), stoneMat);
        arch1.position.set(kx - 2.5, 0.75, kz + 18);
        addMesh(arch1);
        var arch2 = makeMesh(new THREE.CylinderGeometry(0.6, 0.8, 1.5, 8), stoneMat);
        arch2.position.set(kx + 2.5, 0.75, kz + 18);
        addMesh(arch2);
    }

    // ─── 4. Heath Woodland ───────────────────────────────────────────────────

    function buildHeathWoodland() {
        // Ancient oak areas — spread across the heath
        var oakData = [
            [11960, 0, -20],
            [11975, 0, -40],
            [11950, 0, -60],
            [11968, 0, 10],
            [11940, 0, -30],
            [11985, 0, -55],
            [11958, 0, 20],
            [12010, 0, -110],
            [12025, 0, -120],
            [12005, 0, -100],
            [11930, 0, -50],
            [11945, 0, -70],
            [12035, 0, -130],
            [11920, 0, -40]
        ];
        for (var i = 0; i < oakData.length; i++) {
            buildOakTree(oakData[i][0], oakData[i][1], oakData[i][2]);
        }
        // Bluebell clusters
        buildBluebellClusters();
    }

    function buildOakTree(tx, ty, tz) {
        var trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
        var barkMat = new THREE.MeshLambertMaterial({ color: 0x5c4028 });
        var canopyMat = new THREE.MeshLambertMaterial({ color: 0x2e5c1a });
        var canopyDarkMat = new THREE.MeshLambertMaterial({ color: 0x234814 });

        // Gnarled trunk — slightly irregular using two offset boxes
        var trunkH = 6 + Math.floor(tx * 0.0031 + tz * 0.007) % 4;
        var trunk = makeMesh(new THREE.CylinderGeometry(0.55, 0.8, trunkH, 7), trunkMat);
        trunk.position.set(tx, ty + trunkH / 2, tz);
        addMesh(trunk);

        // Branch offshoot
        var branch = makeMesh(new THREE.CylinderGeometry(0.2, 0.35, 3.5, 5), barkMat);
        branch.position.set(tx + 1.0, ty + trunkH - 0.5, tz + 0.5);
        branch.rotation.z = 0.6;
        addMesh(branch);

        // Large main canopy
        var canopyR = 5.5 + (Math.abs(tx * 0.007 + tz * 0.003) % 2.5);
        var canopy = makeMesh(new THREE.SphereGeometry(canopyR, 7, 6), canopyMat);
        canopy.position.set(tx, ty + trunkH + canopyR * 0.6, tz);
        addMesh(canopy);

        // Secondary canopy lobe
        var canopy2 = makeMesh(new THREE.SphereGeometry(canopyR * 0.7, 6, 5), canopyDarkMat);
        canopy2.position.set(tx + 2.5, ty + trunkH + canopyR * 0.4, tz + 1.5);
        addMesh(canopy2);

        // Third lobe on other side
        var canopy3 = makeMesh(new THREE.SphereGeometry(canopyR * 0.6, 6, 5), canopyMat);
        canopy3.position.set(tx - 2.0, ty + trunkH + canopyR * 0.35, tz - 1.0);
        addMesh(canopy3);
    }

    function buildBluebellClusters() {
        var blueMat = new THREE.MeshLambertMaterial({ color: 0x5555cc });
        var stemMat = new THREE.MeshLambertMaterial({ color: 0x3a6e30 });
        var clusterPositions = [
            [11955, 0, -35],
            [11970, 0, -50],
            [11942, 0, -62],
            [11988, 0, -58],
            [11962, 0, 15],
            [12008, 0, -112]
        ];
        for (var ci = 0; ci < clusterPositions.length; ci++) {
            var cp = clusterPositions[ci];
            // 6-8 bluebells per cluster
            for (var bi = 0; bi < 7; bi++) {
                var ox = (bi * 37 % 7) - 3.0;
                var oz = (bi * 53 % 7) - 3.0;
                var stem = makeMesh(new THREE.CylinderGeometry(0.05, 0.07, 0.6, 4), stemMat);
                stem.position.set(cp[0] + ox, cp[1] + 0.3, cp[2] + oz);
                addMesh(stem);
                var bell = makeMesh(new THREE.SphereGeometry(0.18, 5, 4), blueMat);
                bell.position.set(cp[0] + ox, cp[1] + 0.72, cp[2] + oz);
                addMesh(bell);
            }
        }
    }

    // ─── 5. Spaniards Inn ───────────────────────────────────────────────────

    function buildSpaniardsInn() {
        var sx = 11900;
        var sz = -10;

        buildSpaniardsBuilding(sx, sz);
        buildTollGate(sx, sz);
        buildInnSignPost(sx, sz);
        buildInnGarden(sx, sz);
    }

    function buildSpaniardsBuilding(sx, sz) {
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xf8f8f0 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x5c4020 });
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0xddbb88 });
        var winMat = new THREE.MeshLambertMaterial({ color: 0x6688aa });
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x2a1a00 });

        // Low main building — 18th-century inn is long and low
        var main = makeMesh(new THREE.BoxGeometry(28, 8, 12), whiteMat);
        main.position.set(sx, 4, sz);
        addMesh(main);

        // Roof — slightly pitched suggestion
        var roof = makeMesh(new THREE.BoxGeometry(29, 2, 13), roofMat);
        roof.position.set(sx, 9, sz);
        addMesh(roof);

        // Side extension
        var ext = makeMesh(new THREE.BoxGeometry(10, 7, 10), whiteMat);
        ext.position.set(sx + 19, 3.5, sz + 1);
        addMesh(ext);
        var extRoof = makeMesh(new THREE.BoxGeometry(11, 1.8, 11), roofMat);
        extRoof.position.set(sx + 19, 8.4, sz + 1);
        addMesh(extRoof);

        // Chimneys — multiple, as befits an old inn
        var chimPos = [
            [sx - 10, 12, sz],
            [sx, 12, sz],
            [sx + 10, 12, sz],
            [sx + 19, 11, sz]
        ];
        for (var ci = 0; ci < chimPos.length; ci++) {
            var cp = chimPos[ci];
            var chim = makeMesh(new THREE.BoxGeometry(1.2, 4.5, 1.2), chimneyMat);
            chim.position.set(cp[0], cp[1], cp[2]);
            addMesh(chim);
            var chimPot = makeMesh(new THREE.CylinderGeometry(0.3, 0.45, 1.2, 6), chimneyMat);
            chimPot.position.set(cp[0], cp[1] + 3.1, cp[2]);
            addMesh(chimPot);
        }

        // Windows
        var winData = [
            [sx - 9, 5.5, sz - 6.15],
            [sx - 3, 5.5, sz - 6.15],
            [sx + 3, 5.5, sz - 6.15],
            [sx + 9, 5.5, sz - 6.15]
        ];
        for (var wi = 0; wi < winData.length; wi++) {
            var wd = winData[wi];
            var win = makeMesh(new THREE.BoxGeometry(2.0, 2.5, 0.2), winMat);
            win.position.set(wd[0], wd[1], wd[2]);
            addMesh(win);
            // Sash divider
            var divMat = new THREE.MeshLambertMaterial({ color: 0xf8f8f0 });
            var div = makeMesh(new THREE.BoxGeometry(2.0, 0.12, 0.22), divMat);
            div.position.set(wd[0], wd[1], wd[2]);
            addMesh(div);
        }

        // Front door
        var door = makeMesh(new THREE.BoxGeometry(2.2, 4.0, 0.2), doorMat);
        door.position.set(sx, 2.0, sz - 6.15);
        addMesh(door);

        // Door surround / lintel
        var lintelMat = new THREE.MeshLambertMaterial({ color: 0xe8e8e0 });
        var lintel = makeMesh(new THREE.BoxGeometry(2.8, 0.4, 0.3), lintelMat);
        lintel.position.set(sx, 4.2, sz - 6.15);
        addMesh(lintel);

        // Fanlight above door
        var fanMat = new THREE.MeshLambertMaterial({ color: 0x8899bb });
        var fan = makeMesh(new THREE.SphereGeometry(0.9, 6, 4), fanMat);
        fan.position.set(sx, 4.8, sz - 6.1);
        addMesh(fan);
    }

    function buildTollGate(sx, sz) {
        // Historic toll gate arch beside the inn
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xccbbaa });
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x1a1a0a });

        // Left post
        var post1 = makeMesh(new THREE.BoxGeometry(1.5, 8, 1.5), stoneMat);
        post1.position.set(sx + 30, 4, sz);
        addMesh(post1);
        // Right post
        var post2 = makeMesh(new THREE.BoxGeometry(1.5, 8, 1.5), stoneMat);
        post2.position.set(sx + 36, 4, sz);
        addMesh(post2);
        // Arch top
        var arch = makeMesh(new THREE.BoxGeometry(9, 1.5, 1.5), stoneMat);
        arch.position.set(sx + 33, 8.75, sz);
        addMesh(arch);
        // Gate itself
        var gate = makeMesh(new THREE.BoxGeometry(5, 5, 0.2), gateMat);
        gate.position.set(sx + 33, 2.5, sz);
        addMesh(gate);
        // Toll booth — tiny building beside
        var boothMat = new THREE.MeshLambertMaterial({ color: 0xf8f8f0 });
        var booth = makeMesh(new THREE.BoxGeometry(3.5, 6, 3.5), boothMat);
        booth.position.set(sx + 38, 3, sz);
        addMesh(booth);
        var boothRoof = makeMesh(new THREE.BoxGeometry(4.0, 1.5, 4.0), new THREE.MeshLambertMaterial({ color: 0x5c4020 }));
        boothRoof.position.set(sx + 38, 6.75, sz);
        addMesh(boothRoof);
    }

    function buildInnSignPost(sx, sz) {
        var postMat = new THREE.MeshLambertMaterial({ color: 0x3a2800 });
        var signMat = new THREE.MeshLambertMaterial({ color: 0x1a0f00 });

        var post = makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 6, 6), postMat);
        post.position.set(sx - 16, 3, sz - 7);
        addMesh(post);

        var arm = makeMesh(new THREE.BoxGeometry(3.0, 0.2, 0.2), postMat);
        arm.position.set(sx - 14.5, 5.8, sz - 7);
        addMesh(arm);

        var sign = makeMesh(new THREE.BoxGeometry(2.5, 1.5, 0.15), signMat);
        sign.position.set(sx - 13.25, 5.5, sz - 7);
        addMesh(sign);
    }

    function buildInnGarden(sx, sz) {
        var tableMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var umbMat = new THREE.MeshLambertMaterial({ color: 0xcc3300 });
        var poleMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });

        // Beer garden tables
        var tablePos = [
            [sx - 5, 0, sz + 10],
            [sx + 5, 0, sz + 10],
            [sx + 15, 0, sz + 10]
        ];
        for (var ti = 0; ti < tablePos.length; ti++) {
            var tp = tablePos[ti];
            // Table top
            var table = makeMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 8), tableMat);
            table.position.set(tp[0], tp[1] + 1.2, tp[2]);
            addMesh(table);
            // Table leg
            var tleg = makeMesh(new THREE.CylinderGeometry(0.12, 0.14, 1.2, 6), tableMat);
            tleg.position.set(tp[0], tp[1] + 0.6, tp[2]);
            addMesh(tleg);
            // Umbrella
            var upole = makeMesh(new THREE.CylinderGeometry(0.08, 0.08, 3.0, 5), poleMat);
            upole.position.set(tp[0], tp[1] + 2.7, tp[2]);
            addMesh(upole);
            var umbrella = makeMesh(new THREE.ConeGeometry(2.0, 0.7, 8), umbMat);
            umbrella.position.set(tp[0], tp[1] + 4.55, tp[2]);
            addMesh(umbrella);
            // Benches around table
            for (var bi = 0; bi < 4; bi++) {
                var bAngle = bi * Math.PI / 2;
                var bx = tp[0] + Math.cos(bAngle) * 2.2;
                var bz = tp[2] + Math.sin(bAngle) * 2.2;
                var bench = makeMesh(new THREE.BoxGeometry(2.0, 0.2, 0.5), tableMat);
                bench.position.set(bx, tp[1] + 0.75, bz);
                bench.rotation.y = bAngle;
                addMesh(bench);
            }
        }

        // Pub wall garden hedge
        var hedgeMat = new THREE.MeshLambertMaterial({ color: 0x2a5c18 });
        var hedge = makeMesh(new THREE.BoxGeometry(30, 1.8, 1.0), hedgeMat);
        hedge.position.set(sx + 7, 0.9, sz + 18);
        addMesh(hedge);
    }

    // ─── update / reset ──────────────────────────────────────────────────────

    function update(delta) {
        // Static environment — no per-frame animation needed
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
