window.DartfordCrossing = (function() {
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
        if (emissive !== undefined) mat.emissive = new THREE.Color(emissive);
        return new THREE.Mesh(geo, mat);
    }

    function buildRiverThames() {
        // River Thames — 60 units wide, grey-brown water
        var riverGeo = new THREE.BoxGeometry(60, 0.5, 200);
        var river = makeMesh(riverGeo, 0x5a6a5a);
        river.position.set(10920, -0.25, 0);
        addObj(river);

        // Container barge
        var bargeHullGeo = new THREE.BoxGeometry(18, 1.5, 5);
        var bargeHull = makeMesh(bargeHullGeo, 0x334455);
        bargeHull.position.set(10910, 1.0, 10);
        addObj(bargeHull);

        var bargeContainerGeo = new THREE.BoxGeometry(3, 2, 4.5);
        var colors = [0xcc3333, 0x3366cc, 0x228833, 0xccaa00, 0x884422];
        for (var i = 0; i < 5; i++) {
            var bc = makeMesh(bargeContainerGeo, colors[i]);
            bc.position.set(10903 + i * 3.2, 2.5, 10);
            addObj(bc);
        }
    }

    function buildQEIIBridge() {
        var ox = 10920;
        // Road deck spanning the Thames
        var deckGeo = new THREE.BoxGeometry(80, 0.8, 12);
        var deck = makeMesh(deckGeo, 0xaaaaaa);
        deck.position.set(ox, 8, 0);
        addObj(deck);

        // Approach road (north)
        var northRoadGeo = new THREE.BoxGeometry(12, 0.5, 60);
        var northRoad = makeMesh(northRoadGeo, 0x888888);
        northRoad.position.set(ox, 0.25, -70);
        addObj(northRoad);

        // Approach road (south)
        var southRoadGeo = new THREE.BoxGeometry(12, 0.5, 60);
        var southRoad = makeMesh(southRoadGeo, 0x888888);
        southRoad.position.set(ox, 0.25, 70);
        addObj(southRoad);

        // West pylon — A-frame: two legs + crossbeam
        var pylonLegGeo = new THREE.BoxGeometry(1.2, 30, 1.2);

        var wLegL = makeMesh(pylonLegGeo, 0xcccccc);
        wLegL.position.set(ox - 22, 15, -3);
        wLegL.rotation.z = 0.10;
        addObj(wLegL);

        var wLegR = makeMesh(pylonLegGeo, 0xcccccc);
        wLegR.position.set(ox - 22, 15, 3);
        wLegR.rotation.z = 0.10;
        addObj(wLegR);

        var wCrossGeo = new THREE.BoxGeometry(1.2, 8, 1.2);
        var wCross = makeMesh(wCrossGeo, 0xcccccc);
        wCross.position.set(ox - 22, 22, 0);
        wCross.rotation.x = Math.PI / 2;
        addObj(wCross);

        // East pylon — A-frame
        var eLegL = makeMesh(pylonLegGeo, 0xcccccc);
        eLegL.position.set(ox + 22, 15, -3);
        eLegL.rotation.z = -0.10;
        addObj(eLegL);

        var eLegR = makeMesh(pylonLegGeo, 0xcccccc);
        eLegR.position.set(ox + 22, 15, 3);
        eLegR.rotation.z = -0.10;
        addObj(eLegR);

        var eCrossGeo = new THREE.BoxGeometry(1.2, 8, 1.2);
        var eCross = makeMesh(eCrossGeo, 0xcccccc);
        eCross.position.set(ox + 22, 22, 0);
        eCross.rotation.x = Math.PI / 2;
        addObj(eCross);

        // Cable fans — west pylon LineSegments
        var wCableVerts = [];
        var pylonTopWX = ox - 22;
        var pylonTopY = 30;
        for (var ci = 0; ci < 8; ci++) {
            var anchorX = ox - 38 + ci * 4;
            wCableVerts.push(pylonTopWX, pylonTopY, 0);
            wCableVerts.push(anchorX, 8, 0);
        }
        var wCableGeo = new THREE.BufferGeometry();
        wCableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(wCableVerts), 3));
        var wCableMat = new THREE.LineBasicMaterial({ color: 0x999999 });
        var wCables = new THREE.LineSegments(wCableGeo, wCableMat);
        scene.add(wCables);
        objects.push(wCables);

        // Cable fans — east pylon LineSegments
        var eCableVerts = [];
        var pylonTopEX = ox + 22;
        for (var ei = 0; ei < 8; ei++) {
            var eAnchorX = ox + 6 + ei * 4;
            eCableVerts.push(pylonTopEX, pylonTopY, 0);
            eCableVerts.push(eAnchorX, 8, 0);
        }
        var eCableGeo = new THREE.BufferGeometry();
        eCableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(eCableVerts), 3));
        var eCableMat = new THREE.LineBasicMaterial({ color: 0x999999 });
        var eCables = new THREE.LineSegments(eCableGeo, eCableMat);
        scene.add(eCables);
        objects.push(eCables);

        // Deck barrier rails (north side)
        var railGeo = new THREE.BoxGeometry(80, 0.4, 0.2);
        var railN = makeMesh(railGeo, 0x778899);
        railN.position.set(ox, 8.6, -5.8);
        addObj(railN);

        var railS = makeMesh(railGeo, 0x778899);
        railS.position.set(ox, 8.6, 5.8);
        addObj(railS);
    }

    function buildDartfordTunnels() {
        var ox = 10920;
        var tz = -120;

        // Tunnel portal boxes (north approach)
        var portalGeo = new THREE.BoxGeometry(14, 8, 3);
        var portalN = makeMesh(portalGeo, 0x999988);
        portalN.position.set(ox, 4, tz);
        addObj(portalN);

        // Portal opening cut-out suggestion — dark box inside
        var openingGeo = new THREE.BoxGeometry(10, 5.5, 0.5);
        var opening = makeMesh(openingGeo, 0x111111);
        opening.position.set(ox, 3.5, tz - 1.8);
        addObj(opening);

        // Second tunnel tube portal
        var portal2Geo = new THREE.BoxGeometry(14, 8, 3);
        var portal2 = makeMesh(portal2Geo, 0x999988);
        portal2.position.set(ox + 16, 4, tz);
        addObj(portal2);

        var opening2Geo = new THREE.BoxGeometry(10, 5.5, 0.5);
        var opening2 = makeMesh(opening2Geo, 0x111111);
        opening2.position.set(ox + 16, 3.5, tz - 1.8);
        addObj(opening2);

        // Approach road lanes
        var approachGeo = new THREE.BoxGeometry(30, 0.3, 50);
        var approach = makeMesh(approachGeo, 0x777777);
        approach.position.set(ox + 8, 0.15, tz - 28);
        addObj(approach);

        // Lane dividers
        for (var li = 0; li < 3; li++) {
            var divGeo = new THREE.BoxGeometry(0.3, 0.3, 50);
            var div = makeMesh(divGeo, 0xffffff);
            div.position.set(ox - 2 + li * 6, 0.32, tz - 28);
            addObj(div);
        }

        // Toll booth canopy
        var canopyGeo = new THREE.BoxGeometry(32, 0.5, 8);
        var canopy = makeMesh(canopyGeo, 0xddddcc);
        canopy.position.set(ox + 8, 5, tz - 40);
        addObj(canopy);

        // Toll booth canopy supports
        for (var ti = 0; ti < 5; ti++) {
            var suppGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 6);
            var supp = makeMesh(suppGeo, 0xaaaaaa);
            supp.position.set(ox - 8 + ti * 8, 2.5, tz - 40);
            addObj(supp);
        }

        // Toll booth kiosks
        for (var ki = 0; ki < 4; ki++) {
            var kioskGeo = new THREE.BoxGeometry(2.5, 3, 3);
            var kiosk = makeMesh(kioskGeo, 0x88aacc);
            kiosk.position.set(ox - 4 + ki * 6, 1.5, tz - 40);
            addObj(kiosk);
        }

        // Signage gantry over road
        var gantryBarGeo = new THREE.BoxGeometry(32, 0.8, 0.6);
        var gantryBar = makeMesh(gantryBarGeo, 0x999999);
        gantryBar.position.set(ox + 8, 7, tz - 18);
        addObj(gantryBar);

        var gantryPostLGeo = new THREE.CylinderGeometry(0.4, 0.4, 7, 6);
        var gantryPostL = makeMesh(gantryPostLGeo, 0x999999);
        gantryPostL.position.set(ox - 8, 3.5, tz - 18);
        addObj(gantryPostL);

        var gantryPostRGeo = new THREE.CylinderGeometry(0.4, 0.4, 7, 6);
        var gantryPostR = makeMesh(gantryPostRGeo, 0x999999);
        gantryPostR.position.set(ox + 24, 3.5, tz - 18);
        addObj(gantryPostR);

        // Signage panels on gantry
        for (var si = 0; si < 4; si++) {
            var signGeo = new THREE.BoxGeometry(5, 1.5, 0.2);
            var sign = makeMesh(signGeo, 0x003399);
            sign.position.set(ox - 4 + si * 7, 7.8, tz - 18);
            addObj(sign);
        }
    }

    function buildBluewater() {
        var ox = 10920;
        var bz = 160;

        // Main atrium dome suggestion — large flattened sphere
        var atriumGeo = new THREE.SphereGeometry(18, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
        var atrium = makeMesh(atriumGeo, 0xaaccee);
        atrium.position.set(ox, 0, bz);
        addObj(atrium);

        // Atrium base ring
        var baseRingGeo = new THREE.CylinderGeometry(18, 18, 1, 12);
        var baseRing = makeMesh(baseRingGeo, 0xdddddd);
        baseRing.position.set(ox, 0.5, bz);
        addObj(baseRing);

        // Anchor store boxes (3 large)
        var anchorPositions = [
            [ox - 30, 0, bz - 20],
            [ox + 30, 0, bz - 20],
            [ox, 0, bz + 30]
        ];
        var anchorColors = [0xccbbaa, 0xbbccaa, 0xaabbcc];
        for (var ai = 0; ai < 3; ai++) {
            var anchorGeo = new THREE.BoxGeometry(22, 10, 18);
            var anchor = makeMesh(anchorGeo, anchorColors[ai]);
            anchor.position.set(anchorPositions[ai][0], 5, anchorPositions[ai][2]);
            addObj(anchor);

            // Anchor store roof detail
            var roofGeo = new THREE.BoxGeometry(22, 0.8, 18);
            var roof = makeMesh(roofGeo, 0x998877);
            roof.position.set(anchorPositions[ai][0], 10.4, anchorPositions[ai][2]);
            addObj(roof);
        }

        // Connecting retail wings
        var wingEGeo = new THREE.BoxGeometry(12, 7, 40);
        var wingE = makeMesh(wingEGeo, 0xccccbb);
        wingE.position.set(ox + 20, 3.5, bz + 5);
        addObj(wingE);

        var wingWGeo = new THREE.BoxGeometry(12, 7, 40);
        var wingW = makeMesh(wingWGeo, 0xccccbb);
        wingW.position.set(ox - 20, 3.5, bz + 5);
        addObj(wingW);

        // Car park multi-story — north side
        var cpLevels = 4;
        for (var cl = 0; cl < cpLevels; cl++) {
            var cpGeo = new THREE.BoxGeometry(40, 2.8, 20);
            var cp = makeMesh(cpGeo, 0xbbbbbb);
            cp.position.set(ox, 1.4 + cl * 3, bz + 60);
            addObj(cp);

            // Car park level edge barrier
            var barrierGeo = new THREE.BoxGeometry(40, 0.6, 0.3);
            var barrier = makeMesh(barrierGeo, 0x999999);
            barrier.position.set(ox, 2.8 + cl * 3, bz + 50.2);
            addObj(barrier);
        }

        // Car park ramp
        var rampGeo = new THREE.BoxGeometry(6, 0.3, 14);
        var ramp = makeMesh(rampGeo, 0xaaaaaa);
        ramp.rotation.x = -0.25;
        ramp.position.set(ox + 18, 1.5, bz + 53);
        addObj(ramp);

        // Entrance canopies
        for (var eci = 0; eci < 3; eci++) {
            var ecGeo = new THREE.BoxGeometry(8, 0.4, 5);
            var ec = makeMesh(ecGeo, 0x99bbdd);
            ec.position.set(ox - 10 + eci * 10, 4.5, bz - 35);
            addObj(ec);

            var ecPostGeo = new THREE.CylinderGeometry(0.25, 0.25, 4.5, 6);
            var ecPostL = makeMesh(ecPostGeo, 0x888888);
            ecPostL.position.set(ox - 13 + eci * 10, 2.25, bz - 37);
            addObj(ecPostL);

            var ecPostR = makeMesh(ecPostGeo, 0x888888);
            ecPostR.position.set(ox - 7 + eci * 10, 2.25, bz - 37);
            addObj(ecPostR);
        }

        // Ground-level car park area
        var cpGroundGeo = new THREE.BoxGeometry(80, 0.2, 50);
        var cpGround = makeMesh(cpGroundGeo, 0x888888);
        cpGround.position.set(ox, 0.1, bz + 45);
        addObj(cpGround);
    }

    function buildEbbsfleet() {
        var ox = 10920;
        var ez = 260;

        // Station main building — modern long box
        var stationGeo = new THREE.BoxGeometry(60, 10, 22);
        var station = makeMesh(stationGeo, 0xddddee);
        station.position.set(ox, 5, ez);
        addObj(station);

        // Station roof — flat with slight overhang
        var stRoofGeo = new THREE.BoxGeometry(66, 1, 26);
        var stRoof = makeMesh(stRoofGeo, 0x99aabb);
        stRoof.position.set(ox, 10.5, ez);
        addObj(stRoof);

        // Glazed facade panels (front)
        for (var gfi = 0; gfi < 8; gfi++) {
            var gfGeo = new THREE.BoxGeometry(6, 7, 0.3);
            var gf = makeMesh(gfGeo, 0x88bbdd);
            gf.position.set(ox - 24.5 + gfi * 7, 4.5, ez - 11.2);
            addObj(gf);
        }

        // Station canopy over platforms
        var platformCanopyGeo = new THREE.BoxGeometry(65, 0.5, 18);
        var platformCanopy = makeMesh(platformCanopyGeo, 0xaabbcc);
        platformCanopy.position.set(ox, 7, ez + 20);
        addObj(platformCanopy);

        // Platform canopy supports
        for (var psi = 0; psi < 8; psi++) {
            var psGeo = new THREE.CylinderGeometry(0.35, 0.35, 7, 6);
            var ps = makeMesh(psGeo, 0xaaaaaa);
            ps.position.set(ox - 28 + psi * 8, 3.5, ez + 20);
            addObj(ps);
        }

        // Platforms (two tracks)
        var platGeo = new THREE.BoxGeometry(60, 0.5, 3.5);
        var platN = makeMesh(platGeo, 0xbbbbbb);
        platN.position.set(ox, 0.25, ez + 14);
        addObj(platN);

        var platS = makeMesh(platGeo, 0xbbbbbb);
        platS.position.set(ox, 0.25, ez + 26);
        addObj(platS);

        // Eurostar train suggestion — sleek long box
        var trainBodyGeo = new THREE.BoxGeometry(55, 3.5, 3);
        var trainBody = makeMesh(trainBodyGeo, 0x334488);
        trainBody.position.set(ox + 2, 2.25, ez + 14);
        addObj(trainBody);

        // Train nose cone (front)
        var trainNoseGeo = new THREE.ConeGeometry(2.2, 5, 4);
        var trainNose = makeMesh(trainNoseGeo, 0x334488);
        trainNose.rotation.z = -Math.PI / 2;
        trainNose.position.set(ox + 30, 2.25, ez + 14);
        addObj(trainNose);

        // Train windows stripe
        var windowStripeGeo = new THREE.BoxGeometry(48, 1, 0.1);
        var windowStripe = makeMesh(windowStripeGeo, 0x88aadd);
        windowStripe.position.set(ox - 1, 2.8, ez + 12.45);
        addObj(windowStripe);

        // Train yellow nose tip
        var noseYellowGeo = new THREE.BoxGeometry(2, 1.5, 2.5);
        var noseYellow = makeMesh(noseYellowGeo, 0xddcc00);
        noseYellow.position.set(ox + 28, 2.25, ez + 14);
        addObj(noseYellow);

        // Approach tracks (rail lines)
        var trackSpacingGeo = new THREE.BoxGeometry(60, 0.1, 0.4);
        for (var tri = 0; tri < 2; tri++) {
            var trackL = makeMesh(trackSpacingGeo, 0x555555);
            trackL.position.set(ox, 0.3, ez + 13 + tri * 12 - 0.7);
            addObj(trackL);

            var trackR = makeMesh(trackSpacingGeo, 0x555555);
            trackR.position.set(ox, 0.3, ez + 13 + tri * 12 + 0.7);
            addObj(trackR);
        }

        // Station forecourt
        var forecGeo = new THREE.BoxGeometry(70, 0.2, 20);
        var forec = makeMesh(forecGeo, 0x999999);
        forec.position.set(ox, 0.1, ez - 22);
        addObj(forec);

        // Taxi/bus pull-in bays
        var bayGeo = new THREE.BoxGeometry(20, 0.2, 6);
        var bay = makeMesh(bayGeo, 0x888888);
        bay.position.set(ox - 20, 0.12, ez - 30);
        addObj(bay);

        // Station signage pylon
        var signPylonGeo = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
        var signPylon = makeMesh(signPylonGeo, 0x336699);
        signPylon.position.set(ox - 28, 6, ez - 14);
        addObj(signPylon);

        var signBoardGeo = new THREE.BoxGeometry(8, 2.5, 0.3);
        var signBoard = makeMesh(signBoardGeo, 0x003366);
        signBoard.position.set(ox - 28, 12, ez - 14);
        addObj(signBoard);
    }

    function buildGroundPlane() {
        var ox = 10920;

        // Local ground patch
        var groundGeo = new THREE.BoxGeometry(160, 0.3, 500);
        var ground = makeMesh(groundGeo, 0x447744);
        ground.position.set(ox, -0.15, 100);
        addObj(ground);

        // Road connecting tunnel to bridge (north approach)
        var connRoadGeo = new THREE.BoxGeometry(12, 0.35, 30);
        var connRoad = makeMesh(connRoadGeo, 0x777777);
        connRoad.position.set(ox, 0.175, -100);
        addObj(connRoad);

        // Road connecting bridge to south (south approach)
        var southConnGeo = new THREE.BoxGeometry(12, 0.35, 30);
        var southConn = makeMesh(southConnGeo, 0x777777);
        southConn.position.set(ox, 0.175, 45);
        addObj(southConn);

        // A2/M25 road suggestion — wide road heading into distance
        var motorwayGeo = new THREE.BoxGeometry(24, 0.35, 120);
        var motorway = makeMesh(motorwayGeo, 0x666666);
        motorway.position.set(ox, 0.175, 200);
        addObj(motorway);

        // Central reservation
        var resGeo = new THREE.BoxGeometry(1.5, 0.4, 120);
        var res = makeMesh(resGeo, 0x449944);
        res.position.set(ox, 0.375, 200);
        addObj(res);

        // Motorway lane markings
        for (var mi = 0; mi < 10; mi++) {
            var markGeo = new THREE.BoxGeometry(0.3, 0.4, 6);
            var markL = makeMesh(markGeo, 0xffffff);
            markL.position.set(ox - 5, 0.37, 150 + mi * 12);
            addObj(markL);

            var markR = makeMesh(markGeo, 0xffffff);
            markR.position.set(ox + 5, 0.37, 150 + mi * 12);
            addObj(markR);
        }
    }

    function buildStreetFurniture() {
        var ox = 10920;

        // Street lamps along bridge approach
        for (var li = 0; li < 6; li++) {
            var lampPostGeo = new THREE.CylinderGeometry(0.15, 0.2, 8, 6);
            var lampPost = makeMesh(lampPostGeo, 0x888899);
            lampPost.position.set(ox + 7, 4, -90 + li * 20);
            addObj(lampPost);

            var lampHeadGeo = new THREE.BoxGeometry(1, 0.4, 0.4);
            var lampHead = makeMesh(lampHeadGeo, 0xffffcc);
            lampHead.position.set(ox + 7.5, 8, -90 + li * 20);
            addObj(lampHead);
        }

        // Crash barriers alongside road
        for (var bi = 0; bi < 8; bi++) {
            var barrierSegGeo = new THREE.BoxGeometry(0.3, 0.8, 6);
            var barrierSeg = makeMesh(barrierSegGeo, 0xaaaaaa);
            barrierSeg.position.set(ox + 8, 0.4, -70 + bi * 9);
            addObj(barrierSeg);
        }

        // Overhead gantry sign on motorway
        var ogBarGeo = new THREE.BoxGeometry(26, 0.8, 0.5);
        var ogBar = makeMesh(ogBarGeo, 0x888888);
        ogBar.position.set(ox, 9, 140);
        addObj(ogBar);

        var ogPostLGeo = new THREE.CylinderGeometry(0.4, 0.4, 9, 6);
        var ogPostL = makeMesh(ogPostLGeo, 0x888888);
        ogPostL.position.set(ox - 13, 4.5, 140);
        addObj(ogPostL);

        var ogPostRGeo = new THREE.CylinderGeometry(0.4, 0.4, 9, 6);
        var ogPostR = makeMesh(ogPostRGeo, 0x888888);
        ogPostR.position.set(ox + 13, 4.5, 140);
        addObj(ogPostR);

        // Direction sign panels
        var dSignGeo = new THREE.BoxGeometry(10, 2, 0.2);
        var dSignL = makeMesh(dSignGeo, 0x004400);
        dSignL.position.set(ox - 7, 9.8, 140);
        addObj(dSignL);

        var dSignR = makeMesh(dSignGeo, 0x004400);
        dSignR.position.set(ox + 7, 9.8, 140);
        addObj(dSignR);
    }

    function build() {
        buildGroundPlane();
        buildRiverThames();
        buildQEIIBridge();
        buildDartfordTunnels();
        buildBluewater();
        buildEbbsfleet();
        buildStreetFurniture();
    }

    function update(delta) {
        // Static environment — no per-frame updates required
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
