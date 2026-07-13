window.YorkKeep = (function() {
    'use strict';

    var WX = 2800;
    var WZ = 2200;

    function makemat(color, transparent, opacity) {
        if (transparent) {
            return new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: opacity });
        }
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makebox(w, h, d, color) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makemat(color, false, 1.0);
        return new THREE.Mesh(geo, mat);
    }

    function makecyl(rt, rb, h, segs, color) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makemat(color, false, 1.0);
        return new THREE.Mesh(geo, mat);
    }

    function makesphere(r, ws, hs, color) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makemat(color, false, 1.0);
        return new THREE.Mesh(geo, mat);
    }

    function makecone(r, h, segs, color) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makemat(color, false, 1.0);
        return new THREE.Mesh(geo, mat);
    }

    function makeglass(w, h, d) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makemat(0x4488AA, true, 0.6);
        return new THREE.Mesh(geo, mat);
    }

    function buildminster(scene) {
        var CREAM = 0xD4D0C0;
        var DARK = 0xA09888;

        // Main nave body
        var nave = makebox(45, 22, 18, CREAM);
        nave.position.set(WX, 11, WZ);
        scene.add(nave);

        // Nave roof ridge
        var naveroof = makebox(45, 3, 2, DARK);
        naveroof.position.set(WX, 23.5, WZ);
        scene.add(naveroof);

        // West twin towers
        var wt1 = makebox(8, 30, 8, CREAM);
        wt1.position.set(WX - 18.5, 15, WZ - 9);
        scene.add(wt1);

        var wt2 = makebox(8, 30, 8, CREAM);
        wt2.position.set(WX + 18.5, 15, WZ - 9);
        scene.add(wt2);

        // West tower pinnacles
        var wt1pin = makecone(2, 6, 4, DARK);
        wt1pin.position.set(WX - 18.5, 33, WZ - 9);
        scene.add(wt1pin);

        var wt2pin = makecone(2, 6, 4, DARK);
        wt2pin.position.set(WX + 18.5, 33, WZ - 9);
        scene.add(wt2pin);

        // Central crossing tower
        var ctower = makebox(10, 28, 10, CREAM);
        ctower.position.set(WX, 14, WZ);
        scene.add(ctower);

        var ctpin = makecone(3, 8, 4, DARK);
        ctpin.position.set(WX, 32, WZ);
        scene.add(ctpin);

        // Transepts (north and south arms)
        var ntransept = makebox(12, 18, 16, CREAM);
        ntransept.position.set(WX, 9, WZ - 14);
        scene.add(ntransept);

        var stransept = makebox(12, 18, 16, CREAM);
        stransept.position.set(WX, 9, WZ + 14);
        scene.add(stransept);

        // Chapter house (octagonal approximated as box)
        var chapter = makebox(10, 12, 10, CREAM);
        chapter.position.set(WX + 26, 6, WZ - 8);
        scene.add(chapter);

        var chappin = makecone(4, 6, 8, DARK);
        chappin.position.set(WX + 26, 15, WZ - 8);
        scene.add(chappin);

        // East end (choir and presbytery)
        var choir = makebox(20, 18, 14, CREAM);
        choir.position.set(WX, 9, WZ + 20);
        scene.add(choir);

        // Great East Window — 3x4 grid of glass inserts
        var gcols = 3;
        var grows = 4;
        var gw = 2.5;
        var gh = 3.0;
        var gpad = 0.5;
        var startx = WX - ((gcols - 1) * (gw + gpad)) / 2;
        var starty = 6;
        var gz = WZ + 27.5;
        var gi, gj, glass, gx, gy;
        for (gi = 0; gi < grows; gi = gi + 1) {
            for (gj = 0; gj < gcols; gj = gj + 1) {
                gx = startx + gj * (gw + gpad);
                gy = starty + gi * (gh + 0.3);
                glass = makeglass(gw, gh, 0.3);
                glass.position.set(gx, gy, gz);
                scene.add(glass);
            }
        }

        // Buttresses along nave
        var bx, bz, butt;
        var buttpos = [
            [WX - 23, WZ - 6],
            [WX - 23, WZ],
            [WX - 23, WZ + 6],
            [WX + 23, WZ - 6],
            [WX + 23, WZ],
            [WX + 23, WZ + 6]
        ];
        var bi;
        for (bi = 0; bi < buttpos.length; bi = bi + 1) {
            bx = buttpos[bi][0];
            bz = buttpos[bi][1];
            butt = makebox(2, 16, 3, CREAM);
            butt.position.set(bx, 8, bz);
            scene.add(butt);
        }
    }

    function buildmultangular(scene) {
        var ROMAN = 0x9A8A78;
        var MED = 0x7A6A58;

        // Polygonal base — approximate multi-sided tower with stacked boxes
        var base1 = makebox(9, 4, 9, ROMAN);
        base1.position.set(WX - 80, 2, WZ + 60);
        scene.add(base1);

        var base2 = makebox(8, 4, 11, ROMAN);
        base2.position.set(WX - 80, 2, WZ + 60);
        scene.add(base2);

        var base3 = makebox(11, 4, 8, ROMAN);
        base3.position.set(WX - 80, 2, WZ + 60);
        scene.add(base3);

        // Second tier Roman
        var tier2a = makebox(7, 4, 7, ROMAN);
        tier2a.position.set(WX - 80, 6, WZ + 60);
        scene.add(tier2a);

        var tier2b = makebox(6, 4, 9, ROMAN);
        tier2b.position.set(WX - 80, 6, WZ + 60);
        scene.add(tier2b);

        var tier2c = makebox(9, 4, 6, ROMAN);
        tier2c.position.set(WX - 80, 6, WZ + 60);
        scene.add(tier2c);

        // Medieval addition on top
        var medtop = makebox(7, 5, 7, MED);
        medtop.position.set(WX - 80, 12.5, WZ + 60);
        scene.add(medtop);

        var medpin = makecone(2.5, 5, 6, MED);
        medpin.position.set(WX - 80, 17.5, WZ + 60);
        scene.add(medpin);

        // Connecting section of Roman wall
        var rwall = makebox(20, 5, 2, ROMAN);
        rwall.position.set(WX - 90, 2.5, WZ + 60);
        scene.add(rwall);
    }

    function buildwalls(scene) {
        var WALL = 0x9A9A8A;
        var MERLONS = 0x888888;

        // Wall sections — crenelated walls around city
        // North wall segment
        var nwall = makebox(60, 5, 2, WALL);
        nwall.position.set(WX - 30, 2.5, WZ - 80);
        scene.add(nwall);

        // North wall merlons (crenellations)
        var ni, nmx, nmerlon;
        for (ni = 0; ni < 12; ni = ni + 1) {
            nmx = (WX - 55) + ni * 5;
            nmerlon = makebox(2, 1.5, 2, MERLONS);
            nmerlon.position.set(nmx, 5.75, WZ - 80);
            scene.add(nmerlon);
        }

        // South wall segment
        var swall = makebox(60, 5, 2, WALL);
        swall.position.set(WX + 30, 2.5, WZ + 80);
        scene.add(swall);

        var si, smx, smerlon;
        for (si = 0; si < 12; si = si + 1) {
            smx = (WX + 5) + si * 5;
            smerlon = makebox(2, 1.5, 2, MERLONS);
            smerlon.position.set(smx, 5.75, WZ + 80);
            scene.add(smerlon);
        }

        // West wall segment
        var wwall = makebox(2, 5, 60, WALL);
        wwall.position.set(WX - 80, 2.5, WZ - 20);
        scene.add(wwall);

        var wi, wmz, wmerlon;
        for (wi = 0; wi < 12; wi = wi + 1) {
            wmz = (WZ - 55) + wi * 5;
            wmerlon = makebox(2, 1.5, 2, MERLONS);
            wmerlon.position.set(WX - 80, 5.75, wmz);
            scene.add(wmerlon);
        }

        // East wall segment
        var ewall = makebox(2, 5, 60, WALL);
        ewall.position.set(WX + 80, 2.5, WZ + 20);
        scene.add(ewall);

        var ei, emz, emerlon;
        for (ei = 0; ei < 12; ei = ei + 1) {
            emz = (WZ - 5) + ei * 5;
            emerlon = makebox(2, 1.5, 2, MERLONS);
            emerlon.position.set(WX + 80, 5.75, emz);
            scene.add(emerlon);
        }

        // Second north wall section
        var nwall2 = makebox(60, 5, 2, WALL);
        nwall2.position.set(WX + 50, 2.5, WZ - 80);
        scene.add(nwall2);

        var ni2, nmx2, nmerlon2;
        for (ni2 = 0; ni2 < 12; ni2 = ni2 + 1) {
            nmx2 = (WX + 25) + ni2 * 5;
            nmerlon2 = makebox(2, 1.5, 2, MERLONS);
            nmerlon2.position.set(nmx2, 5.75, WZ - 80);
            scene.add(nmerlon2);
        }

        // Bar gatehouses — 4 of them
        buildgatehouse(scene, WX - 30, WZ - 80, false);
        buildgatehouse(scene, WX + 30, WZ + 80, false);
        buildgatehouse(scene, WX - 80, WZ - 20, true);
        buildgatehouse(scene, WX + 80, WZ + 20, true);
    }

    function buildgatehouse(scene, gx, gz, rotated) {
        var WALL = 0x9A9A8A;
        var DARK = 0x7A7A6A;

        var gw, gd;
        if (rotated) {
            gw = 6;
            gd = 8;
        } else {
            gw = 8;
            gd = 6;
        }

        // Main gatehouse body
        var body = makebox(gw, 12, gd, WALL);
        body.position.set(gx, 6, gz);
        scene.add(body);

        // Arch gap (darker box inset)
        var archw, archd;
        if (rotated) {
            archw = 3;
            archd = 9;
        } else {
            archw = 9;
            archd = 3;
        }
        var arch = makebox(archw, 5, archd, DARK);
        arch.position.set(gx, 3, gz);
        scene.add(arch);

        // Battlements on gatehouse
        var bt1 = makebox(2, 2, 2, WALL);
        bt1.position.set(gx - 2.5, 13, gz - 2);
        scene.add(bt1);

        var bt2 = makebox(2, 2, 2, WALL);
        bt2.position.set(gx + 2.5, 13, gz - 2);
        scene.add(bt2);

        var bt3 = makebox(2, 2, 2, WALL);
        bt3.position.set(gx - 2.5, 13, gz + 2);
        scene.add(bt3);

        var bt4 = makebox(2, 2, 2, WALL);
        bt4.position.set(gx + 2.5, 13, gz + 2);
        scene.add(bt4);
    }

    function buildclifford(scene) {
        var STONE = 0xD4A97A;
        var DARK = 0xB08A5A;

        // Motte (earthen mound) — cylinder
        var motte = makecyl(10, 12, 5, 12, 0x8A7A5A);
        motte.position.set(WX + 60, 2.5, WZ + 40);
        scene.add(motte);

        // Quatrefoil keep — 4 overlapping cylinders arranged in cloverleaf
        var offsets = [
            [0, -3.5],
            [0, 3.5],
            [-3.5, 0],
            [3.5, 0]
        ];
        var qi, qx, qz, qcyl;
        for (qi = 0; qi < offsets.length; qi = qi + 1) {
            qx = WX + 60 + offsets[qi][0];
            qz = WZ + 40 + offsets[qi][1];
            qcyl = makecyl(5, 5, 10, 12, STONE);
            qcyl.position.set(qx, 10, qz);
            scene.add(qcyl);
        }

        // Central connecting core
        var core = makecyl(3, 3, 10, 8, DARK);
        core.position.set(WX + 60, 10, WZ + 40);
        scene.add(core);

        // Wall tops / crenellations around keep
        var capoffsets = [
            [0, -3.5],
            [0, 3.5],
            [-3.5, 0],
            [3.5, 0]
        ];
        var ci2, cx2, cz2, cap;
        for (ci2 = 0; ci2 < capoffsets.length; ci2 = ci2 + 1) {
            cx2 = WX + 60 + capoffsets[ci2][0];
            cz2 = WZ + 40 + capoffsets[ci2][1];
            cap = makebox(3, 1.5, 3, DARK);
            cap.position.set(cx2, 15.75, cz2);
            scene.add(cap);
        }

        // Entrance steps
        var steps = makebox(3, 1, 5, 0x8A7A5A);
        steps.position.set(WX + 60, 5.5, WZ + 47);
        scene.add(steps);
    }

    function buildshambles(scene) {
        var TIMBER = 0xD4B05A;
        var DARK = 0xA08040;
        var PLASTER = 0xF0E8D0;

        // 6 medieval buildings leaning toward each other down the street
        var shamblepos = [
            [WX - 50, WZ - 20],
            [WX - 50, WZ - 14],
            [WX - 50, WZ - 8],
            [WX - 44, WZ - 20],
            [WX - 44, WZ - 14],
            [WX - 44, WZ - 8]
        ];

        var si2, bx2, bz2, ground, jetty, roof, tframe1, tframe2;
        for (si2 = 0; si2 < shamblepos.length; si2 = si2 + 1) {
            bx2 = shamblepos[si2][0];
            bz2 = shamblepos[si2][1];

            // Ground floor
            ground = makebox(6, 4, 5, PLASTER);
            ground.position.set(bx2, 2, bz2);
            scene.add(ground);

            // Jettied upper floor — overhangs by 0.7 on each side
            jetty = makebox(6.8, 4, 5.8, TIMBER);
            jetty.position.set(bx2, 6.2, bz2);

            // Lean buildings on left side toward right
            if (si2 < 3) {
                jetty.rotation.z = 0.06;
            } else {
                jetty.rotation.z = -0.06;
            }
            scene.add(jetty);

            // Roof
            roof = makebox(7, 2.5, 5.5, DARK);
            roof.position.set(bx2, 9.5, bz2);
            scene.add(roof);

            // Timber frame details
            tframe1 = makebox(0.3, 8, 0.3, DARK);
            tframe1.position.set(bx2 - 2.5, 4, bz2 - 2.2);
            scene.add(tframe1);

            tframe2 = makebox(0.3, 8, 0.3, DARK);
            tframe2.position.set(bx2 + 2.5, 4, bz2 - 2.2);
            scene.add(tframe2);
        }

        // Street sign post (thin box)
        var signpost = makebox(0.2, 4, 0.2, DARK);
        signpost.position.set(WX - 47, 2, WZ - 25);
        scene.add(signpost);

        var sign = makebox(3, 1, 0.2, TIMBER);
        sign.position.set(WX - 47, 4.5, WZ - 25);
        scene.add(sign);
    }

    function buildextras(scene) {
        // St Mary's Abbey ruins — partial walls
        var RUIN = 0xB0A890;
        var abwall1 = makebox(25, 8, 2, RUIN);
        abwall1.position.set(WX - 55, 4, WZ + 20);
        scene.add(abwall1);

        var abwall2 = makebox(2, 8, 20, RUIN);
        abwall2.position.set(WX - 55, 4, WZ + 30);
        scene.add(abwall2);

        // Broken top section
        var abtop = makebox(15, 3, 2, RUIN);
        abtop.position.set(WX - 48, 9.5, WZ + 20);
        scene.add(abtop);

        // Clifford Street area — small guild hall
        var guild = makebox(12, 7, 8, 0xD4C0A0);
        guild.position.set(WX + 40, 3.5, WZ - 30);
        scene.add(guild);

        var guildroof = makebox(13, 2, 9, 0x8A6040);
        guildroof.position.set(WX + 40, 8, WZ - 30);
        scene.add(guildroof);

        // Ouse Bridge area — stone bridge piers
        var pier1 = makebox(3, 5, 6, 0x888878);
        pier1.position.set(WX + 10, 2.5, WZ + 55);
        scene.add(pier1);

        var pier2 = makebox(3, 5, 6, 0x888878);
        pier2.position.set(WX + 20, 2.5, WZ + 55);
        scene.add(pier2);

        var span = makebox(14, 1.5, 6, 0x999989);
        span.position.set(WX + 15, 5.75, WZ + 55);
        scene.add(span);
    }

    function build(scene) {
        buildminster(scene);
        buildmultangular(scene);
        buildwalls(scene);
        buildclifford(scene);
        buildshambles(scene);
        buildextras(scene);
    }

    return {
        build: build,
        worldX: WX,
        worldZ: WZ
    };
}());
