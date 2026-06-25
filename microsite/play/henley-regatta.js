window.HenleyRegatta = (function() {
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

    function makeMesh(geo, color, emissive) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        if (emissive !== undefined) {
            mat.emissive = new THREE.Color(emissive);
        }
        return new THREE.Mesh(geo, mat);
    }

    function buildRiver() {
        // Thames river channel — long flat blue strip
        var riverGeo = new THREE.BoxGeometry(2300, 0.5, 120);
        var river = makeMesh(riverGeo, 0x2a6ea6);
        river.position.set(12680, -0.25, 0);
        addObj(river);

        // Riverbed/bank left
        var bankLGeo = new THREE.BoxGeometry(2300, 1, 30);
        var bankL = makeMesh(bankLGeo, 0x5a8a3c);
        bankL.position.set(12680, 0, -75);
        addObj(bankL);

        // Riverbed/bank right
        var bankRGeo = new THREE.BoxGeometry(2300, 1, 30);
        var bankR = makeMesh(bankRGeo, 0x5a8a3c);
        bankR.position.set(12680, 0, 75);
        addObj(bankR);
    }

    function buildRegattaCourse() {
        // 2112m racing lane — buoy markers every ~100m along course
        var buoyCount = 22;
        for (var b = 0; b < buoyCount; b++) {
            var bx = 12680 - 1056 + (b * 96);

            // Left lane buoy (Bucks side)
            var buoyLGeo = new THREE.SphereGeometry(1.2, 6, 6);
            var buoyL = makeMesh(buoyLGeo, 0xff4400);
            buoyL.position.set(bx, 1.5, -28);
            addObj(buoyL);

            // Right lane buoy (Berks side)
            var buoyRGeo = new THREE.SphereGeometry(1.2, 6, 6);
            var buoyR = makeMesh(buoyRGeo, 0xff4400);
            buoyR.position.set(bx, 1.5, 28);
            addObj(buoyR);

            // Buoy pole left
            var poleLGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 5);
            var poleL = makeMesh(poleLGeo, 0xcccccc);
            poleL.position.set(bx, 0.5, -28);
            addObj(poleL);

            // Buoy pole right
            var poleRGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 5);
            var poleR = makeMesh(poleRGeo, 0xcccccc);
            poleR.position.set(bx, 0.5, 28);
            addObj(poleR);
        }

        // Umpire launches — small motor boats along course
        var launchPositions = [
            [12300, 0],
            [12500, 5],
            [12700, -5],
            [12900, 3]
        ];
        for (var l = 0; l < launchPositions.length; l++) {
            var lx = launchPositions[l][0];
            var lz = launchPositions[l][1];
            var launchHullGeo = new THREE.BoxGeometry(8, 1.5, 3);
            var launchHull = makeMesh(launchHullGeo, 0xffffff);
            launchHull.position.set(lx, 1.0, lz);
            addObj(launchHull);

            var launchCabinGeo = new THREE.BoxGeometry(3, 2, 2.5);
            var launchCabin = makeMesh(launchCabinGeo, 0x2255aa);
            launchCabin.position.set(lx + 1, 2.5, lz);
            addObj(launchCabin);
        }

        // Grandstands — tiered seating along Stewards Enclosure (Berks bank)
        for (var g = 0; g < 8; g++) {
            var gx = 12400 + g * 80;

            // Stand base
            var standBaseGeo = new THREE.BoxGeometry(75, 2, 18);
            var standBase = makeMesh(standBaseGeo, 0xd4c8a0);
            standBase.position.set(gx, 1, 68);
            addObj(standBase);

            // Stand tiers
            for (var t = 0; t < 4; t++) {
                var tierGeo = new THREE.BoxGeometry(75, 1.5, 3.5);
                var tier = makeMesh(tierGeo, 0xc8b890);
                tier.position.set(gx, 2 + t * 1.8, 57 + t * 3.5);
                addObj(tier);
            }

            // Stand roof
            var roofGeo = new THREE.BoxGeometry(77, 0.8, 20);
            var roof = makeMesh(roofGeo, 0x336633);
            roof.position.set(gx, 10, 70);
            addObj(roof);

            // Roof supports
            for (var s = 0; s < 4; s++) {
                var suppGeo = new THREE.CylinderGeometry(0.3, 0.3, 8, 5);
                var supp = makeMesh(suppGeo, 0x888888);
                supp.position.set(gx - 30 + s * 20, 6, 79);
                addObj(supp);
            }
        }

        // Finishing post / start line markers
        var startPostGeo = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        var startPost = makeMesh(startPostGeo, 0xffdd00);
        startPost.position.set(12680 - 1056, 6, 0);
        addObj(startPost);

        var finishPostGeo = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        var finishPost = makeMesh(finishPostGeo, 0xff2200);
        finishPost.position.set(12680 + 1056, 6, 0);
        addObj(finishPost);
    }

    function buildHenleyBridge() {
        // 5-arch stone bridge across Thames — positioned at x ~12680 centre
        var bridgeX = 12680;
        var bridgeY = 2;

        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(60, 2, 24);
        var deck = makeMesh(deckGeo, 0xc8a878);
        deck.position.set(bridgeX, bridgeY + 6, 0);
        addObj(deck);

        // Bridge parapet left
        var parapetLGeo = new THREE.BoxGeometry(60, 1.5, 1.5);
        var parapetL = makeMesh(parapetLGeo, 0xd4b888);
        parapetL.position.set(bridgeX, bridgeY + 8, -11.5);
        addObj(parapetL);

        // Bridge parapet right
        var parapetRGeo = new THREE.BoxGeometry(60, 1.5, 1.5);
        var parapetR = makeMesh(parapetRGeo, 0xd4b888);
        parapetR.position.set(bridgeX, bridgeY + 8, 11.5);
        addObj(parapetR);

        // 5 arches — piers between arches
        for (var a = 0; a < 4; a++) {
            var pierX = bridgeX - 24 + a * 12;

            // Pier
            var pierGeo = new THREE.BoxGeometry(3, 8, 22);
            var pier = makeMesh(pierGeo, 0xb89868);
            pier.position.set(pierX, bridgeY + 1, 0);
            addObj(pier);

            // Arch keystone face (Thames / Isis faces)
            var keystoneGeo = new THREE.SphereGeometry(1.2, 8, 6);
            var keystone = makeMesh(keystoneGeo, 0xe0c080);
            keystone.position.set(pierX, bridgeY + 5.5, -12);
            addObj(keystone);

            var keystoneRGeo = new THREE.SphereGeometry(1.2, 8, 6);
            var keystoneR = makeMesh(keystoneRGeo, 0xe0c080);
            keystoneR.position.set(pierX, bridgeY + 5.5, 12);
            addObj(keystoneR);
        }

        // Arch voids (dark boxes under deck)
        for (var av = 0; av < 5; av++) {
            var archX = bridgeX - 30 + av * 12;
            var archGeo = new THREE.BoxGeometry(9, 4, 24);
            var arch = makeMesh(archGeo, 0x1a1a2e);
            arch.position.set(archX, bridgeY + 3, 0);
            addObj(arch);
        }

        // Bridge abutments
        var abutLGeo = new THREE.BoxGeometry(6, 9, 26);
        var abutL = makeMesh(abutLGeo, 0xc8a870);
        abutL.position.set(bridgeX - 33, bridgeY, 0);
        addObj(abutL);

        var abutRGeo = new THREE.BoxGeometry(6, 9, 26);
        var abutR = makeMesh(abutRGeo, 0xc8a870);
        abutR.position.set(bridgeX + 33, bridgeY, 0);
        addObj(abutR);
    }

    function buildLeanderClub() {
        // Famous rowing club — distinctive pink building on Berks bank
        var lx = 12750;
        var lz = 110;

        // Main boathouse building — pink stucco
        var mainGeo = new THREE.BoxGeometry(40, 10, 20);
        var main = makeMesh(mainGeo, 0xf4a0b0);
        main.position.set(lx, 5, lz);
        addObj(main);

        // Upper floor
        var upperGeo = new THREE.BoxGeometry(36, 6, 18);
        var upper = makeMesh(upperGeo, 0xf0a0b8);
        upper.position.set(lx, 13, lz);
        addObj(upper);

        // Roof — hipped tile roof
        var roofGeo = new THREE.ConeGeometry(24, 5, 4);
        var roof = makeMesh(roofGeo, 0x8b3a3a);
        roof.position.set(lx, 19, lz);
        roof.rotation.y = Math.PI / 4;
        addObj(roof);

        // Slipway into river
        var slipGeo = new THREE.BoxGeometry(20, 0.5, 30);
        var slip = makeMesh(slipGeo, 0x888870);
        slip.position.set(lx, 0.25, lz - 35);
        slip.rotation.x = -0.1;
        addObj(slip);

        // Boat storage shed
        var shedGeo = new THREE.BoxGeometry(50, 6, 12);
        var shed = makeMesh(shedGeo, 0xf0a8b0);
        shed.position.set(lx + 5, 3, lz + 18);
        addObj(shed);

        // Shed roof
        var shedRoofGeo = new THREE.BoxGeometry(52, 0.8, 14);
        var shedRoof = makeMesh(shedRoofGeo, 0x9b4a4a);
        shedRoof.position.set(lx + 5, 6.4, lz + 18);
        addObj(shedRoof);

        // Leander hippo emblem pole (club symbol)
        var flagPoleGeo = new THREE.CylinderGeometry(0.2, 0.2, 10, 5);
        var flagPole = makeMesh(flagPoleGeo, 0x666666);
        flagPole.position.set(lx - 22, 5, lz - 5);
        addObj(flagPole);

        var flagGeo = new THREE.BoxGeometry(4, 2.5, 0.2);
        var flag = makeMesh(flagGeo, 0xff69b4);
        flag.position.set(lx - 20, 10, lz - 5);
        addObj(flag);

        // Jetty/pontoon
        var jettyGeo = new THREE.BoxGeometry(3, 0.5, 25);
        var jetty = makeMesh(jettyGeo, 0x8b7355);
        jetty.position.set(lx, 0.5, lz - 22);
        addObj(jetty);

        for (var jp = 0; jp < 5; jp++) {
            var jPileGeo = new THREE.CylinderGeometry(0.3, 0.3, 3, 5);
            var jPile = makeMesh(jPileGeo, 0x6b5335);
            jPile.position.set(lx, -0.5, lz - 10 - jp * 4);
            addObj(jPile);
        }
    }

    function buildRiversideTown() {
        // Georgian and Victorian buildings along Thames Street
        var buildingDefs = [
            { x: 12500, z: -85, w: 18, h: 12, d: 12, color: 0xd4c4a0 },
            { x: 12522, z: -82, w: 14, h: 15, d: 10, color: 0xc8b890 },
            { x: 12540, z: -86, w: 16, h: 10, d: 11, color: 0xe0d0b0 },
            { x: 12558, z: -84, w: 12, h: 14, d: 10, color: 0xd8c8a8 },
            { x: 12578, z: -83, w: 20, h: 11, d: 13, color: 0xc4b488 },
            { x: 12602, z: -85, w: 15, h: 13, d: 11, color: 0xddd0b5 },
            { x: 12620, z: -82, w: 18, h: 16, d: 12, color: 0xc8bca0 },
            { x: 12642, z: -84, w: 14, h: 10, d: 10, color: 0xe4d4b8 },
            { x: 12660, z: -86, w: 16, h: 12, d: 11, color: 0xd0c0a0 },
            { x: 12680, z: -83, w: 20, h: 15, d: 13, color: 0xc8b890 },
            { x: 12702, z: -85, w: 14, h: 11, d: 10, color: 0xdcc8a8 },
            { x: 12720, z: -82, w: 16, h: 14, d: 12, color: 0xe0d0b0 }
        ];

        for (var i = 0; i < buildingDefs.length; i++) {
            var bd = buildingDefs[i];
            var bGeo = new THREE.BoxGeometry(bd.w, bd.h, bd.d);
            var b = makeMesh(bGeo, bd.color);
            b.position.set(bd.x, bd.h / 2, bd.z);
            addObj(b);

            // Simple pitched roof
            var rGeo = new THREE.ConeGeometry(bd.w * 0.75, 3.5, 4);
            var r = makeMesh(rGeo, 0x8b5555);
            r.position.set(bd.x, bd.h + 1.75, bd.z);
            r.rotation.y = Math.PI / 4;
            addObj(r);

            // Chimney
            var chGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
            var ch = makeMesh(chGeo, 0xaa8866);
            ch.position.set(bd.x + 3, bd.h + 4, bd.z - 2);
            addObj(ch);
        }

        // Angel Inn — prominent riverside pub
        var innGeo = new THREE.BoxGeometry(22, 14, 16);
        var inn = makeMesh(innGeo, 0xf0e0c0);
        inn.position.set(12800, 7, -87);
        addObj(inn);

        var innSignGeo = new THREE.BoxGeometry(6, 3, 0.4);
        var innSign = makeMesh(innSignGeo, 0x4422aa);
        innSign.position.set(12800, 8, -79.2);
        addObj(innSign);

        var innRoofGeo = new THREE.BoxGeometry(24, 4, 18);
        var innRoof = makeMesh(innRoofGeo, 0x7a4444);
        innRoof.position.set(12800, 15.5, -87);
        addObj(innRoof);

        // Church tower
        var towerGeo = new THREE.BoxGeometry(10, 30, 10);
        var tower = makeMesh(towerGeo, 0xb8a888);
        tower.position.set(12450, 15, -110);
        addObj(tower);

        // Tower battlements
        var battleGeo = new THREE.BoxGeometry(12, 3, 12);
        var battle = makeMesh(battleGeo, 0xb0a080);
        battle.position.set(12450, 31.5, -110);
        addObj(battle);

        // Church tower clock faces (decorative discs)
        var clockFGeo = new THREE.CylinderGeometry(2, 2, 0.3, 12);
        var clockF = makeMesh(clockFGeo, 0xf0f0e0);
        clockF.rotation.x = Math.PI / 2;
        clockF.position.set(12450, 22, -105);
        addObj(clockF);

        // Church nave
        var naveGeo = new THREE.BoxGeometry(25, 12, 14);
        var nave = makeMesh(naveGeo, 0xc0b090);
        nave.position.set(12470, 6, -112);
        addObj(nave);

        var naveRoofGeo = new THREE.BoxGeometry(26, 0.5, 15);
        var naveRoof = makeMesh(naveRoofGeo, 0x8a6040);
        naveRoof.position.set(12470, 12.5, -112);
        addObj(naveRoof);
    }

    function buildRegattaMarquees() {
        // Large striped canvas tents — Stewards Enclosure and champagne bars
        var marqueeDefs = [
            { x: 12550, z: 110, w: 40, d: 20, h: 8, stripeA: 0x2244aa, stripeB: 0xffffff },
            { x: 12600, z: 140, w: 50, d: 25, h: 9, stripeA: 0xcc2200, stripeB: 0xffffff },
            { x: 12660, z: 115, w: 35, d: 18, h: 7, stripeA: 0x006633, stripeB: 0xffffff },
            { x: 12720, z: 135, w: 45, d: 22, h: 8, stripeA: 0x880088, stripeB: 0xffff00 },
            { x: 12780, z: 118, w: 38, d: 20, h: 7, stripeA: 0xcc6600, stripeB: 0xffffff },
            { x: 12840, z: 142, w: 42, d: 21, h: 8, stripeA: 0x004488, stripeB: 0xffd700 }
        ];

        for (var m = 0; m < marqueeDefs.length; m++) {
            var md = marqueeDefs[m];

            // Tent body
            var tentGeo = new THREE.BoxGeometry(md.w, md.h, md.d);
            var tent = makeMesh(tentGeo, md.stripeA);
            tent.position.set(md.x, md.h / 2, md.z);
            addObj(tent);

            // Tent roof — peaked
            var tentRoofGeo = new THREE.ConeGeometry(md.w * 0.6, md.h * 0.6, 4);
            var tentRoof = makeMesh(tentRoofGeo, md.stripeB);
            tentRoof.position.set(md.x, md.h + md.h * 0.3, md.z);
            tentRoof.rotation.y = Math.PI / 4;
            addObj(tentRoof);

            // Tent poles
            var poleFLGeo = new THREE.CylinderGeometry(0.25, 0.25, md.h, 5);
            var poleFL = makeMesh(poleFLGeo, 0xdddddd);
            poleFL.position.set(md.x - md.w / 2 + 2, md.h / 2, md.z - md.d / 2 + 2);
            addObj(poleFL);

            var poleFRGeo = new THREE.CylinderGeometry(0.25, 0.25, md.h, 5);
            var poleFR = makeMesh(poleFRGeo, 0xdddddd);
            poleFR.position.set(md.x + md.w / 2 - 2, md.h / 2, md.z - md.d / 2 + 2);
            addObj(poleFR);
        }

        // Champagne bar counters inside stewards enclosure
        for (var cb = 0; cb < 4; cb++) {
            var barGeo = new THREE.BoxGeometry(8, 2.5, 2);
            var bar = makeMesh(barGeo, 0x8b6914);
            bar.position.set(12570 + cb * 50, 1.25, 98);
            addObj(bar);
        }

        // Regatta committee room building
        var commGeo = new THREE.BoxGeometry(20, 8, 14);
        var comm = makeMesh(commGeo, 0xf0ead0);
        comm.position.set(12680, 4, 100);
        addObj(comm);

        var commRoofGeo = new THREE.BoxGeometry(22, 2, 16);
        var commRoof = makeMesh(commRoofGeo, 0x336633);
        commRoof.position.set(12680, 9, 100);
        addObj(commRoof);
    }

    function buildRowingBoats() {
        // Sculls and eights on the water
        var boatDefs = [
            { x: 12350, z: -10, length: 16, width: 0.7, color: 0xc8a060, type: 'eight' },
            { x: 12450, z: 8, length: 16, width: 0.7, color: 0x8844aa, type: 'eight' },
            { x: 12600, z: -15, length: 10, width: 0.6, color: 0xcc6633, type: 'four' },
            { x: 12700, z: 12, length: 8, width: 0.5, color: 0x4466cc, type: 'double' },
            { x: 12800, z: -8, length: 7, width: 0.5, color: 0x33aa44, type: 'single' },
            { x: 12900, z: 6, length: 16, width: 0.7, color: 0xdd3311, type: 'eight' },
            { x: 12980, z: -3, length: 10, width: 0.6, color: 0xf0c030, type: 'four' }
        ];

        for (var boat = 0; boat < boatDefs.length; boat++) {
            var bd = boatDefs[boat];

            // Hull
            var hullGeo = new THREE.BoxGeometry(bd.length, 0.5, bd.width);
            var hull = makeMesh(hullGeo, bd.color);
            hull.position.set(bd.x, 0.5, bd.z);
            addObj(hull);

            // Pointed bow
            var bowGeo = new THREE.ConeGeometry(bd.width * 0.6, 2, 4);
            var bow = makeMesh(bowGeo, bd.color);
            bow.rotation.z = -Math.PI / 2;
            bow.position.set(bd.x + bd.length / 2 + 1, 0.5, bd.z);
            addObj(bow);

            // Riggers — oar outriggers
            if (bd.type === 'eight' || bd.type === 'four') {
                var rigCount = bd.type === 'eight' ? 8 : 4;
                var rigSpacing = bd.length / (rigCount + 1);
                for (var rig = 0; rig < rigCount; rig++) {
                    var side = rig % 2 === 0 ? 1 : -1;
                    var rigGeo = new THREE.BoxGeometry(0.2, 0.2, 3);
                    var rigMesh = makeMesh(rigGeo, 0x888888);
                    rigMesh.position.set(
                        bd.x - bd.length / 2 + (rig + 1) * rigSpacing,
                        0.8,
                        bd.z + side * (bd.width / 2 + 1.5)
                    );
                    addObj(rigMesh);

                    // Oar blade
                    var oarGeo = new THREE.BoxGeometry(0.3, 0.15, 1.5);
                    var oar = makeMesh(oarGeo, 0xeedd88);
                    oar.position.set(
                        bd.x - bd.length / 2 + (rig + 1) * rigSpacing,
                        0.6,
                        bd.z + side * (bd.width / 2 + 3.5)
                    );
                    addObj(oar);
                }
            }
        }

        // Wooden rowing skiffs — traditional Thames skiffs
        var skiffPositions = [
            [12480, -45],
            [12560, 55],
            [12650, -50],
            [12750, 50],
            [12850, -42]
        ];

        for (var sk = 0; sk < skiffPositions.length; sk++) {
            var sx = skiffPositions[sk][0];
            var sz = skiffPositions[sk][1];

            var skiffGeo = new THREE.BoxGeometry(5, 0.7, 1.8);
            var skiff = makeMesh(skiffGeo, 0x8b6a3a);
            skiff.position.set(sx, 0.5, sz);
            addObj(skiff);

            // Skiff bow
            var sBowGeo = new THREE.ConeGeometry(0.9, 1.5, 4);
            var sBow = makeMesh(sBowGeo, 0x8b6a3a);
            sBow.rotation.z = -Math.PI / 2;
            sBow.position.set(sx + 3.25, 0.5, sz);
            addObj(sBow);

            // Seat thwarts
            for (var th = 0; th < 2; th++) {
                var thwartGeo = new THREE.BoxGeometry(0.3, 0.3, 1.6);
                var thwart = makeMesh(thwartGeo, 0xaa8855);
                thwart.position.set(sx - 0.5 + th * 2, 0.9, sz);
                addObj(thwart);
            }
        }

        // Cox boats — small coxswain dinghies
        var coxPositions = [
            [12380, 20],
            [12600, -20],
            [12820, 18]
        ];

        for (var cx = 0; cx < coxPositions.length; cx++) {
            var cxPos = coxPositions[cx];
            var coxGeo = new THREE.BoxGeometry(4, 0.6, 1.5);
            var cox = makeMesh(coxGeo, 0x336688);
            cox.position.set(cxPos[0], 0.5, cxPos[1]);
            addObj(cox);

            var coxBowGeo = new THREE.ConeGeometry(0.75, 1.2, 4);
            var coxBow = makeMesh(coxBowGeo, 0x336688);
            coxBow.rotation.z = -Math.PI / 2;
            coxBow.position.set(cxPos[0] + 2.6, 0.5, cxPos[1]);
            addObj(coxBow);
        }
    }

    function buildEnvironmentDetails() {
        // Towpath along Bucks bank
        var towpathGeo = new THREE.BoxGeometry(2200, 0.3, 6);
        var towpath = makeMesh(towpathGeo, 0xc8b870);
        towpath.position.set(12680, 0.3, -78);
        addObj(towpath);

        // Trees along towpath
        for (var tree = 0; tree < 20; tree++) {
            var tx = 12180 + tree * 110;
            var trunkGeo = new THREE.CylinderGeometry(0.6, 0.8, 6, 6);
            var trunk = makeMesh(trunkGeo, 0x6b4226);
            trunk.position.set(tx, 3, -82);
            addObj(trunk);

            var canopyGeo = new THREE.SphereGeometry(4, 7, 6);
            var canopy = makeMesh(canopyGeo, 0x2d6a2d);
            canopy.position.set(tx, 9, -82);
            addObj(canopy);
        }

        // Trees Berks bank side (behind grandstands)
        for (var tree2 = 0; tree2 < 15; tree2++) {
            var tx2 = 12280 + tree2 * 140;
            var trunkGeo2 = new THREE.CylinderGeometry(0.5, 0.7, 5, 6);
            var trunk2 = makeMesh(trunkGeo2, 0x6b4226);
            trunk2.position.set(tx2, 2.5, 160);
            addObj(trunk2);

            var canopyGeo2 = new THREE.SphereGeometry(3.5, 7, 6);
            var canopy2 = makeMesh(canopyGeo2, 0x347a34);
            canopy2.position.set(tx2, 8, 160);
            addObj(canopy2);
        }

        // Finish line camera tower
        var camTowerGeo = new THREE.BoxGeometry(3, 18, 3);
        var camTower = makeMesh(camTowerGeo, 0xaaaaaa);
        camTower.position.set(12680 + 1058, 9, 40);
        addObj(camTower);

        var camPlatGeo = new THREE.BoxGeometry(5, 1, 5);
        var camPlat = makeMesh(camPlatGeo, 0x888888);
        camPlat.position.set(12680 + 1058, 18.5, 40);
        addObj(camPlat);

        // Distance marker boards
        var markerTexts = [500, 1000, 1500];
        for (var mk = 0; mk < markerTexts.length; mk++) {
            var mkx = 12680 - 1056 + markerTexts[mk];
            var mkGeo = new THREE.BoxGeometry(0.3, 4, 3);
            var mkMesh = makeMesh(mkGeo, 0xffffff);
            mkMesh.position.set(mkx, 3, -55);
            addObj(mkMesh);

            var mkPoleGeo = new THREE.CylinderGeometry(0.2, 0.2, 5, 5);
            var mkPole = makeMesh(mkPoleGeo, 0x333333);
            mkPole.position.set(mkx, 2.5, -55);
            addObj(mkPole);
        }

        // Ground plane — meadow area
        var meadowGeo = new THREE.BoxGeometry(2400, 0.5, 300);
        var meadow = makeMesh(meadowGeo, 0x4a7a30);
        meadow.position.set(12680, -0.4, 0);
        addObj(meadow);
    }

    function build() {
        buildRiver();
        buildRegattaCourse();
        buildHenleyBridge();
        buildLeanderClub();
        buildRiversideTown();
        buildRegattaMarquees();
        buildRowingBoats();
        buildEnvironmentDetails();
    }

    function update(delta) {
        // Animate buoys bobbing gently
        var t = Date.now() * 0.001;
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj && obj.geometry && obj.geometry.type === 'SphereGeometry') {
                var params = obj.geometry.parameters;
                if (params && params.radius && params.radius < 2) {
                    obj.position.y = 1.5 + Math.sin(t * 0.8 + i * 0.5) * 0.15;
                }
            }
        }
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
