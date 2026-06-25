window.HumberBridge = (function() {
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

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildRiverBed();
        buildNorthBank();
        buildSouthBank();
        buildBridgeDeck();
        buildNorthTower();
        buildSouthTower();
        buildSuspensionCables();
        buildApproachViaducts();
        buildHessleHaven();
        buildHullCity();
        buildCleethorpes();
        buildSpurnPoint();
        buildShipping();
        buildSkyElements();
    }

    // === RIVER HUMBER ===
    function buildRiverBed() {
        // Main estuary water surface — wide tidal estuary (approx 5km wide at bridge)
        var waterGeo = new THREE.BoxGeometry(3000, 2, 5200);
        var waterMesh = new THREE.Mesh(waterGeo, makeMat(0x006994));
        waterMesh.position.set(21400, -1, 0);
        addMesh(waterMesh);

        // Deeper channel in middle — darker teal
        var channelGeo = new THREE.BoxGeometry(1200, 2, 5200);
        var channelMesh = new THREE.Mesh(channelGeo, makeMat(0x005580));
        channelMesh.position.set(21400, -0.5, 0);
        addMesh(channelMesh);

        // Mudflat north side
        var mudNorthGeo = new THREE.BoxGeometry(600, 1, 5200);
        var mudNorthMesh = new THREE.Mesh(mudNorthGeo, makeMat(0x8B7355));
        mudNorthMesh.position.set(21400 + 1650, -1.5, 0);
        addMesh(mudNorthMesh);

        // Mudflat south side
        var mudSouthGeo = new THREE.BoxGeometry(600, 1, 5200);
        var mudSouthMesh = new THREE.Mesh(mudSouthGeo, makeMat(0x8B7355));
        mudSouthMesh.position.set(21400 - 1650, -1.5, 0);
        addMesh(mudSouthMesh);

        // Tidal ripple strips
        var ripple1Geo = new THREE.BoxGeometry(2800, 0.5, 12);
        var ripple1 = new THREE.Mesh(ripple1Geo, makeMat(0x0077AA));
        ripple1.position.set(21400, 0, 200);
        addMesh(ripple1);

        var ripple2Geo = new THREE.BoxGeometry(2800, 0.5, 12);
        var ripple2 = new THREE.Mesh(ripple2Geo, makeMat(0x0077AA));
        ripple2.position.set(21400, 0, -200);
        addMesh(ripple2);

        var ripple3Geo = new THREE.BoxGeometry(2800, 0.5, 12);
        var ripple3 = new THREE.Mesh(ripple3Geo, makeMat(0x0077AA));
        ripple3.position.set(21400, 0, 600);
        addMesh(ripple3);

        var ripple4Geo = new THREE.BoxGeometry(2800, 0.5, 12);
        var ripple4 = new THREE.Mesh(ripple4Geo, makeMat(0x0077AA));
        ripple4.position.set(21400, 0, -600);
        addMesh(ripple4);
    }

    // === NORTH BANK — Hessle chalk cliffs ===
    function buildNorthBank() {
        // North bank ground — Hessle chalk
        var northGroundGeo = new THREE.BoxGeometry(2000, 8, 5200);
        var northGround = new THREE.Mesh(northGroundGeo, makeMat(0xF5F0E8));
        northGround.position.set(21400 + 2500, -4, 0);
        addMesh(northGround);

        // Chalk cliff face at waterline
        var cliffGeo = new THREE.BoxGeometry(40, 30, 5200);
        var cliff = new THREE.Mesh(cliffGeo, makeMat(0xF0EAD6));
        cliff.position.set(21400 + 1480, 8, 0);
        addMesh(cliff);

        // Cliff top ledge
        var cliffTopGeo = new THREE.BoxGeometry(80, 6, 5200);
        var cliffTop = new THREE.Mesh(cliffTopGeo, makeMat(0xE8E2D0));
        cliffTop.position.set(21400 + 1540, 22, 0);
        addMesh(cliffTop);

        // Hessle town — row of houses north bank
        for (var i = 0; i < 8; i++) {
            var houseGeo = new THREE.BoxGeometry(20, 14, 18);
            var house = new THREE.Mesh(houseGeo, makeMat(0xC8B89A));
            house.position.set(21400 + 1700 + i * 30, 10, -80 + i * 20);
            addMesh(house);

            var roofGeo = new THREE.ConeGeometry(16, 8, 4);
            var roof = new THREE.Mesh(roofGeo, makeMat(0x8B4513));
            roof.position.set(21400 + 1700 + i * 30, 20, -80 + i * 20);
            roof.rotation.y = Math.PI / 4;
            addMesh(roof);
        }

        // Country Road on north bank
        var northRoadGeo = new THREE.BoxGeometry(16, 0.5, 1200);
        var northRoad = new THREE.Mesh(northRoadGeo, makeMat(0x555555));
        northRoad.position.set(21400 + 1560, 5, 0);
        addMesh(northRoad);

        // Trees on north bank
        for (var t = 0; t < 6; t++) {
            var trunkGeo = new THREE.CylinderGeometry(1.5, 2, 12, 6);
            var trunk = new THREE.Mesh(trunkGeo, makeMat(0x4A3728));
            trunk.position.set(21400 + 1620 + t * 40, 10, -300 + t * 90);
            addMesh(trunk);

            var canopyGeo = new THREE.SphereGeometry(8, 6, 5);
            var canopy = new THREE.Mesh(canopyGeo, makeMat(0x2D6A2D));
            canopy.position.set(21400 + 1620 + t * 40, 20, -300 + t * 90);
            addMesh(canopy);
        }
    }

    // === SOUTH BANK — Barton-upon-Humber ===
    function buildSouthBank() {
        // South bank ground — Lincolnshire lowlands
        var southGroundGeo = new THREE.BoxGeometry(2000, 8, 5200);
        var southGround = new THREE.Mesh(southGroundGeo, makeMat(0x888888));
        southGround.position.set(21400 - 2500, -4, 0);
        addMesh(southGround);

        // Barton-upon-Humber — village buildings
        for (var b = 0; b < 6; b++) {
            var bldGeo = new THREE.BoxGeometry(18, 12, 16);
            var bld = new THREE.Mesh(bldGeo, makeMat(0xAA9977));
            bld.position.set(21400 - 1700 - b * 28, 9, 60 - b * 25);
            addMesh(bld);
        }

        // St. Peter's Church tower (landmark in Barton)
        var churchTowerGeo = new THREE.BoxGeometry(14, 28, 14);
        var churchTower = new THREE.Mesh(churchTowerGeo, makeMat(0xC8BEA0));
        churchTower.position.set(21400 - 1800, 17, 150);
        addMesh(churchTower);

        var churchSpireGeo = new THREE.ConeGeometry(5, 18, 4);
        var churchSpire = new THREE.Mesh(churchSpireGeo, makeMat(0xAAAAAA));
        churchSpire.position.set(21400 - 1800, 36, 150);
        churchSpire.rotation.y = Math.PI / 4;
        addMesh(churchSpire);

        // South bank road
        var southRoadGeo = new THREE.BoxGeometry(16, 0.5, 1200);
        var southRoad = new THREE.Mesh(southRoadGeo, makeMat(0x555555));
        southRoad.position.set(21400 - 1560, 5, 0);
        addMesh(southRoad);

        // A15 embankment approach
        var embankGeo = new THREE.BoxGeometry(22, 6, 400);
        var embank = new THREE.Mesh(embankGeo, makeMat(0x777777));
        embank.position.set(21400 - 1400, 6, 0);
        addMesh(embank);
    }

    // === MAIN BRIDGE DECK ===
    function buildBridgeDeck() {
        // Main suspension span deck — 1410m central span
        // Scaled: 1m real = ~0.2 units approx, so 1410m ~ 282 units central span
        // For visual clarity using larger scale
        var mainSpanGeo = new THREE.BoxGeometry(3000, 6, 22);
        var mainSpan = new THREE.Mesh(mainSpanGeo, makeMat(0xD3D3D3));
        mainSpan.position.set(21400, 60, 0);
        addMesh(mainSpan);

        // Road surface on deck — dual carriageway
        var deckRoadGeo = new THREE.BoxGeometry(3000, 1, 14);
        var deckRoad = new THREE.Mesh(deckRoadGeo, makeMat(0x444444));
        deckRoad.position.set(21400, 63.5, 0);
        addMesh(deckRoad);

        // Central reservation / barrier
        var centralResGeo = new THREE.BoxGeometry(3000, 2, 1.5);
        var centralRes = new THREE.Mesh(centralResGeo, makeMat(0xFFFFFF));
        centralRes.position.set(21400, 64.5, 0);
        addMesh(centralRes);

        // Bridge deck edge beams (stiffening girder) — north side
        var edgeNGeo = new THREE.BoxGeometry(3000, 4, 2);
        var edgeN = new THREE.Mesh(edgeNGeo, makeMat(0xBBBBBB));
        edgeN.position.set(21400, 58, 11);
        addMesh(edgeN);

        // Bridge deck edge beams — south side
        var edgeSGeo = new THREE.BoxGeometry(3000, 4, 2);
        var edgeS = new THREE.Mesh(edgeSGeo, makeMat(0xBBBBBB));
        edgeS.position.set(21400, 58, -11);
        addMesh(edgeS);

        // Deck cross-bracings (visible from side)
        for (var xb = 0; xb < 12; xb++) {
            var xbraceGeo = new THREE.BoxGeometry(2, 4, 22);
            var xbrace = new THREE.Mesh(xbraceGeo, makeMat(0xC0C0C0));
            xbrace.position.set(21400 - 1350 + xb * 245, 58, 0);
            addMesh(xbrace);
        }

        // Footway panels on either side of carriageway
        var footNGeo = new THREE.BoxGeometry(3000, 0.5, 3);
        var footN = new THREE.Mesh(footNGeo, makeMat(0xCCCCCC));
        footN.position.set(21400, 63.5, 8.5);
        addMesh(footN);

        var footSGeo = new THREE.BoxGeometry(3000, 0.5, 3);
        var footS = new THREE.Mesh(footSGeo, makeMat(0xCCCCCC));
        footS.position.set(21400, 63.5, -8.5);
        addMesh(footSGeo);
    }

    // === BRIDGE TOWERS ===
    // North tower — at Hessle
    function buildNorthTower() {
        // Tower legs — slightly diverging (Earth curvature effect ~36mm separation at top)
        // North tower: position x=21400+700 (on north side)
        var ntLegAGeo = new THREE.BoxGeometry(8, 155, 8);
        var ntLegA = new THREE.Mesh(ntLegAGeo, makeMat(0xD3D3D3));
        // Legs diverge slightly outward in Z
        ntLegA.position.set(21400 + 700, 77.5, 8);
        ntLegA.rotation.z = 0.003;
        addMesh(ntLegA);

        var ntLegBGeo = new THREE.BoxGeometry(8, 155, 8);
        var ntLegB = new THREE.Mesh(ntLegBGeo, makeMat(0xD3D3D3));
        ntLegB.position.set(21400 + 700, 77.5, -8);
        ntLegB.rotation.z = -0.003;
        addMesh(ntLegB);

        // Cross beams on north tower
        var ntBeam1Geo = new THREE.BoxGeometry(8, 5, 20);
        var ntBeam1 = new THREE.Mesh(ntBeam1Geo, makeMat(0xCCCCCC));
        ntBeam1.position.set(21400 + 700, 130, 0);
        addMesh(ntBeam1);

        var ntBeam2Geo = new THREE.BoxGeometry(8, 5, 20);
        var ntBeam2 = new THREE.Mesh(ntBeam2Geo, makeMat(0xCCCCCC));
        ntBeam2.position.set(21400 + 700, 70, 0);
        addMesh(ntBeam2);

        var ntBeam3Geo = new THREE.BoxGeometry(8, 5, 20);
        var ntBeam3 = new THREE.Mesh(ntBeam3Geo, makeMat(0xCCCCCC));
        ntBeam3.position.set(21400 + 700, 30, 0);
        addMesh(ntBeam3);

        // Tower caps / saddles
        var ntCapGeo = new THREE.BoxGeometry(14, 8, 22);
        var ntCap = new THREE.Mesh(ntCapGeo, makeMat(0xBBBBBB));
        ntCap.position.set(21400 + 700, 158, 0);
        addMesh(ntCap);

        // Tower foundation blocks
        var ntFoundGeo = new THREE.BoxGeometry(22, 10, 22);
        var ntFound = new THREE.Mesh(ntFoundGeo, makeMat(0xAAAAAA));
        ntFound.position.set(21400 + 700, -5, 0);
        addMesh(ntFound);
    }

    // South tower — at Barton side
    function buildSouthTower() {
        var stLegAGeo = new THREE.BoxGeometry(8, 155, 8);
        var stLegA = new THREE.Mesh(stLegAGeo, makeMat(0xD3D3D3));
        stLegA.position.set(21400 - 700, 77.5, 8);
        stLegA.rotation.z = 0.003;
        addMesh(stLegA);

        var stLegBGeo = new THREE.BoxGeometry(8, 155, 8);
        var stLegB = new THREE.Mesh(stLegBGeo, makeMat(0xD3D3D3));
        stLegB.position.set(21400 - 700, 77.5, -8);
        stLegB.rotation.z = -0.003;
        addMesh(stLegB);

        // Cross beams
        var stBeam1Geo = new THREE.BoxGeometry(8, 5, 20);
        var stBeam1 = new THREE.Mesh(stBeam1Geo, makeMat(0xCCCCCC));
        stBeam1.position.set(21400 - 700, 130, 0);
        addMesh(stBeam1);

        var stBeam2Geo = new THREE.BoxGeometry(8, 5, 20);
        var stBeam2 = new THREE.Mesh(stBeam2Geo, makeMat(0xCCCCCC));
        stBeam2.position.set(21400 - 700, 70, 0);
        addMesh(stBeam2);

        var stBeam3Geo = new THREE.BoxGeometry(8, 5, 20);
        var stBeam3 = new THREE.Mesh(stBeam3Geo, makeMat(0xCCCCCC));
        stBeam3.position.set(21400 - 700, 30, 0);
        addMesh(stBeam3);

        // Tower cap
        var stCapGeo = new THREE.BoxGeometry(14, 8, 22);
        var stCap = new THREE.Mesh(stCapGeo, makeMat(0xBBBBBB));
        stCap.position.set(21400 - 700, 158, 0);
        addMesh(stCap);

        // Tower foundation
        var stFoundGeo = new THREE.BoxGeometry(22, 10, 22);
        var stFound = new THREE.Mesh(stFoundGeo, makeMat(0xAAAAAA));
        stFound.position.set(21400 - 700, -5, 0);
        addMesh(stFound);
    }

    // === SUSPENSION CABLES ===
    function buildSuspensionCables() {
        // Main cables — catenary curve approximated with angled box segments
        // North main cable segments (north Z side)
        var cableSegments = [
            // [x-center, y-center, length, x-angle (catenary)]
            // from north tower top to mid-span (sag ~30m scale)
            { xOff: -350, y: 150, xRot: 0.12 },
            { xOff: -100, y: 132, xRot: 0.04 },
            { xOff: 100, y: 132, xRot: -0.04 },
            { xOff: 350, y: 150, xRot: -0.12 }
        ];

        for (var cs = 0; cs < cableSegments.length; cs++) {
            var seg = cableSegments[cs];
            // North side Z=10
            var cableNGeo = new THREE.BoxGeometry(300, 2, 2);
            var cableN = new THREE.Mesh(cableNGeo, makeMat(0x888888));
            cableN.position.set(21400 + seg.xOff, seg.y, 10);
            cableN.rotation.z = seg.xRot;
            addMesh(cableN);

            // South side Z=-10
            var cableSGeo = new THREE.BoxGeometry(300, 2, 2);
            var cableS = new THREE.Mesh(cableSGeo, makeMat(0x888888));
            cableS.position.set(21400 + seg.xOff, seg.y, -10);
            cableS.rotation.z = seg.xRot;
            addMesh(cableS);
        }

        // Back-stay cables — from tower tops to anchor blocks
        // North tower north backstay
        var bsNN1Geo = new THREE.BoxGeometry(360, 2, 2);
        var bsNN1 = new THREE.Mesh(bsNN1Geo, makeMat(0x888888));
        bsNN1.position.set(21400 + 880, 100, 10);
        bsNN1.rotation.z = -0.5;
        addMesh(bsNN1);

        var bsNN2Geo = new THREE.BoxGeometry(360, 2, 2);
        var bsNN2 = new THREE.Mesh(bsNN2Geo, makeMat(0x888888));
        bsNN2.position.set(21400 + 880, 100, -10);
        bsNN2.rotation.z = -0.5;
        addMesh(bsNN2);

        // South tower south backstay
        var bsSS1Geo = new THREE.BoxGeometry(360, 2, 2);
        var bsSS1 = new THREE.Mesh(bsSS1Geo, makeMat(0x888888));
        bsSS1.position.set(21400 - 880, 100, 10);
        bsSS1.rotation.z = 0.5;
        addMesh(bsSS1);

        var bsSS2Geo = new THREE.BoxGeometry(360, 2, 2);
        var bsSS2 = new THREE.Mesh(bsSS2Geo, makeMat(0x888888));
        bsSS2.position.set(21400 - 880, 100, -10);
        bsSS2.rotation.z = 0.5;
        addMesh(bsSS2);

        // Vertical hangers — suspenders from main cable to deck
        var hangerPositions = [-550, -400, -280, -160, -60, 60, 160, 280, 400, 550];
        for (var h = 0; h < hangerPositions.length; h++) {
            var hx = hangerPositions[h];
            // Approx hanger heights (catenary profile)
            var cableY = 130 + Math.pow(hx / 700, 2) * 30;
            var hangerHeight = cableY - 63;

            var hangerNGeo = new THREE.BoxGeometry(1.5, hangerHeight, 1.5);
            var hangerN = new THREE.Mesh(hangerNGeo, makeMat(0x999999));
            hangerN.position.set(21400 + hx, 63 + hangerHeight / 2, 10);
            addMesh(hangerN);

            var hangerSGeo = new THREE.BoxGeometry(1.5, hangerHeight, 1.5);
            var hangerS = new THREE.Mesh(hangerSGeo, makeMat(0x999999));
            hangerS.position.set(21400 + hx, 63 + hangerHeight / 2, -10);
            addMesh(hangerS);
        }

        // Anchor blocks — massive concrete blocks at each end
        var anchorNGeo = new THREE.BoxGeometry(50, 30, 40);
        var anchorN = new THREE.Mesh(anchorNGeo, makeMat(0xAAAAAA));
        anchorN.position.set(21400 + 1200, 15, 0);
        addMesh(anchorN);

        var anchorSGeo = new THREE.BoxGeometry(50, 30, 40);
        var anchorS = new THREE.Mesh(anchorSGeo, makeMat(0xAAAAAA));
        anchorS.position.set(21400 - 1200, 15, 0);
        addMesh(anchorSGeo);
    }

    // === APPROACH VIADUCTS ===
    function buildApproachViaducts() {
        // North approach viaduct — from anchor to north bank (Hessle)
        var northViadGeo = new THREE.BoxGeometry(600, 5, 20);
        var northViad = new THREE.Mesh(northViadGeo, makeMat(0xD3D3D3));
        northViad.position.set(21400 + 1500, 45, 0);
        northViad.rotation.z = -0.07; // slopes down to ground level
        addMesh(northViad);

        // North viaduct piers
        for (var np = 0; np < 4; np++) {
            var npGeo = new THREE.BoxGeometry(6, 45 - np * 8, 6);
            var npMesh = new THREE.Mesh(npGeo, makeMat(0xCCCCCC));
            npMesh.position.set(21400 + 1280 + np * 80, (45 - np * 8) / 2, 0);
            addMesh(npMesh);
        }

        // South approach viaduct
        var southViadGeo = new THREE.BoxGeometry(600, 5, 20);
        var southViad = new THREE.Mesh(southViadGeo, makeMat(0xD3D3D3));
        southViad.position.set(21400 - 1500, 45, 0);
        southViad.rotation.z = 0.07;
        addMesh(southViad);

        // South viaduct piers
        for (var sp = 0; sp < 4; sp++) {
            var spGeo = new THREE.BoxGeometry(6, 45 - sp * 8, 6);
            var spMesh = new THREE.Mesh(spGeo, makeMat(0xCCCCCC));
            spMesh.position.set(21400 - 1280 - sp * 80, (45 - sp * 8) / 2, 0);
            addMesh(spMesh);
        }

        // Toll booths on south bank approach
        for (var tb = 0; tb < 3; tb++) {
            var tollGeo = new THREE.BoxGeometry(5, 8, 5);
            var toll = new THREE.Mesh(tollGeo, makeMat(0xEEEECC));
            toll.position.set(21400 - 1380, 7, -6 + tb * 6);
            addMesh(toll);
        }
    }

    // === HESSLE HAVEN — north bank marina ===
    function buildHessleHaven() {
        // Marina basin
        var havenGeo = new THREE.BoxGeometry(150, 1, 120);
        var haven = new THREE.Mesh(havenGeo, makeMat(0x005580));
        haven.position.set(21400 + 1550, 0, -400);
        addMesh(haven);

        // Marina jetty
        var jettyGeo = new THREE.BoxGeometry(4, 2, 100);
        var jetty = new THREE.Mesh(jettyGeo, makeMat(0x8B6914));
        jetty.position.set(21400 + 1490, 1, -400);
        addMesh(jetty);

        // Cross jetty
        var jetty2Geo = new THREE.BoxGeometry(80, 2, 4);
        var jetty2 = new THREE.Mesh(jetty2Geo, makeMat(0x8B6914));
        jetty2.position.set(21400 + 1530, 1, -350);
        addMesh(jetty2);

        // Moored boats in haven (small box shapes)
        for (var b2 = 0; b2 < 4; b2++) {
            var boatGeo = new THREE.BoxGeometry(14, 3, 5);
            var boat = new THREE.Mesh(boatGeo, makeMat(0xFFFFFF));
            boat.position.set(21400 + 1510 + b2 * 18, 2, -385 + b2 * 15);
            addMesh(boat);

            // Boat hull
            var hullGeo = new THREE.BoxGeometry(14, 2, 5);
            var hull = new THREE.Mesh(hullGeo, makeMat(0x1144AA));
            hull.position.set(21400 + 1510 + b2 * 18, 0.5, -385 + b2 * 15);
            addMesh(hull);
        }

        // Harbour master building
        var harbourBldGeo = new THREE.BoxGeometry(20, 10, 16);
        var harbourBld = new THREE.Mesh(harbourBldGeo, makeMat(0xD4C8A0));
        harbourBld.position.set(21400 + 1620, 8, -440);
        addMesh(harbourBld);
    }

    // === HULL CITY on horizon (north bank) ===
    function buildHullCity() {
        // Kingston upon Hull skyline — cluster of buildings in distance
        var hullBuildings = [
            { x: 21400 + 2200, h: 80, w: 40, d: 35, color: 0xC8B89A },
            { x: 21400 + 2280, h: 120, w: 30, d: 30, color: 0xD3D3D3 },
            { x: 21400 + 2350, h: 60, w: 50, d: 40, color: 0xBBAA88 },
            { x: 21400 + 2420, h: 95, w: 25, d: 25, color: 0xD3D3D3 },
            { x: 21400 + 2500, h: 50, w: 60, d: 45, color: 0xC8C8C8 },
            { x: 21400 + 2580, h: 70, w: 35, d: 30, color: 0xC8B89A },
            { x: 21400 + 2650, h: 110, w: 28, d: 28, color: 0xD3D3D3 }
        ];

        for (var hb = 0; hb < hullBuildings.length; hb++) {
            var hbData = hullBuildings[hb];
            var hbGeo = new THREE.BoxGeometry(hbData.w, hbData.h, hbData.d);
            var hbMesh = new THREE.Mesh(hbGeo, makeMat(hbData.color));
            hbMesh.position.set(hbData.x, hbData.h / 2, 200 + hb * 20);
            addMesh(hbMesh);
        }

        // Hull Minster / Holy Trinity visible on horizon
        var minsterGeo = new THREE.BoxGeometry(20, 50, 30);
        var minster = new THREE.Mesh(minsterGeo, makeMat(0xD4C8A0));
        minster.position.set(21400 + 2450, 25, 350);
        addMesh(minster);

        var minsterTowerGeo = new THREE.BoxGeometry(12, 70, 12);
        var minsterTower = new THREE.Mesh(minsterTowerGeo, makeMat(0xD4C8A0));
        minsterTower.position.set(21400 + 2445, 65, 345);
        addMesh(minsterTower);
    }

    // === CLEETHORPES — south bank resort ===
    function buildCleethorpes() {
        // Cleethorpes ground
        var cleethGeo = new THREE.BoxGeometry(800, 4, 600);
        var cleeth = new THREE.Mesh(cleethGeo, makeMat(0xF5F0E8));
        cleeth.position.set(21400 - 2200, 0, -600);
        addMesh(cleeth);

        // Beach strip
        var beachGeo = new THREE.BoxGeometry(800, 2, 80);
        var beach = new THREE.Mesh(beachGeo, makeMat(0xF4E0A0));
        beach.position.set(21400 - 2200, 0, -1000);
        addMesh(beach);

        // Cleethorpes pier
        var pierGeo = new THREE.BoxGeometry(6, 3, 200);
        var pier = new THREE.Mesh(pierGeo, makeMat(0x8B6914));
        pier.position.set(21400 - 2200, 2, -1100);
        addMesh(pier);

        // Pier end platform
        var pierEndGeo = new THREE.BoxGeometry(30, 3, 20);
        var pierEnd = new THREE.Mesh(pierEndGeo, makeMat(0x8B6914));
        pierEnd.position.set(21400 - 2200, 2, -1200);
        addMesh(pierEnd);

        // Amusement park — big wheel represented as thin cylinder
        var bigWheelAxleGeo = new THREE.CylinderGeometry(1, 1, 4, 8);
        var bigWheelAxle = new THREE.Mesh(bigWheelAxleGeo, makeMat(0x888888));
        bigWheelAxle.position.set(21400 - 2100, 35, -620);
        bigWheelAxle.rotation.z = Math.PI / 2;
        addMesh(bigWheelAxle);

        var bigWheelRimGeo = new THREE.CylinderGeometry(30, 30, 2, 16);
        var bigWheelRim = new THREE.Mesh(bigWheelRimGeo, makeMat(0xFF4444));
        bigWheelRim.position.set(21400 - 2100, 35, -620);
        bigWheelRim.rotation.z = Math.PI / 2;
        addMesh(bigWheelRim);

        // Amusement park buildings
        for (var ap = 0; ap < 5; ap++) {
            var amusGeo = new THREE.BoxGeometry(18, 12, 16);
            var amusMesh = new THREE.Mesh(amusGeo, makeMat(0xFF8844));
            amusMesh.position.set(21400 - 2150 + ap * 25, 9, -640 + ap * 10);
            addMesh(amusMesh);
        }

        // Promenade road
        var promGeo = new THREE.BoxGeometry(800, 0.5, 12);
        var prom = new THREE.Mesh(promGeo, makeMat(0x888888));
        prom.position.set(21400 - 2200, 2.5, -970);
        addMesh(prom);
    }

    // === SPURN POINT — long sand spit ===
    function buildSpurnPoint() {
        // Spurn Point stretches ~5.5km SE into the Humber mouth
        // Rendered as a long tapering box
        var spurnBodyGeo = new THREE.BoxGeometry(1200, 3, 40);
        var spurnBody = new THREE.Mesh(spurnBodyGeo, makeMat(0xD4B483));
        spurnBody.position.set(21400 + 1400, 0, -1800);
        spurnBody.rotation.y = -0.3; // angled into estuary
        addMesh(spurnBody);

        // Spurn tip — narrower
        var spurnTipGeo = new THREE.BoxGeometry(500, 2, 15);
        var spurnTip = new THREE.Mesh(spurnTipGeo, makeMat(0xC8A870));
        spurnTip.position.set(21400 + 1900, 0, -2200);
        spurnTip.rotation.y = -0.4;
        addMesh(spurnTip);

        // Spurn Point lighthouse
        var lighthouseGeo = new THREE.CylinderGeometry(5, 7, 36, 8);
        var lighthouse = new THREE.Mesh(lighthouseGeo, makeMat(0xFFFFFF));
        lighthouse.position.set(21400 + 1800, 18, -2150);
        addMesh(lighthouse);

        // Lighthouse lamp housing
        var lampGeo = new THREE.CylinderGeometry(6, 6, 6, 8);
        var lamp = new THREE.Mesh(lampGeo, makeMat(0xFFDD00));
        lamp.position.set(21400 + 1800, 39, -2150);
        addMesh(lamp);

        // Lifeboat station on Spurn
        var lifeboatGeo = new THREE.BoxGeometry(20, 8, 14);
        var lifeboat = new THREE.Mesh(lifeboatGeo, makeMat(0xCC4400));
        lifeboat.position.set(21400 + 1760, 6, -2120);
        addMesh(lifeboat);
    }

    // === SHIPPING — container ships on estuary ===
    function buildShipping() {
        // Large container ship 1 — heading west upriver toward Hull
        var ship1HullGeo = new THREE.BoxGeometry(200, 20, 35);
        var ship1Hull = new THREE.Mesh(ship1HullGeo, makeMat(0x222222));
        ship1Hull.position.set(21400 - 300, 8, -600);
        addMesh(ship1Hull);

        var ship1DeckGeo = new THREE.BoxGeometry(200, 4, 35);
        var ship1Deck = new THREE.Mesh(ship1DeckGeo, makeMat(0x555555));
        ship1Deck.position.set(21400 - 300, 19, -600);
        addMesh(ship1Deck);

        // Containers on ship 1
        for (var c = 0; c < 6; c++) {
            var contGeo = new THREE.BoxGeometry(26, 10, 30);
            var cont = new THREE.Mesh(contGeo, makeMat(c % 2 === 0 ? 0x1166BB : 0xBB2222));
            cont.position.set(21400 - 420 + c * 30, 26, -600);
            addMesh(cont);
        }

        // Ship 1 bridge / superstructure
        var ship1BridgeGeo = new THREE.BoxGeometry(25, 22, 30);
        var ship1Bridge = new THREE.Mesh(ship1BridgeGeo, makeMat(0xDDDDCC));
        ship1Bridge.position.set(21400 - 390, 31, -600);
        addMesh(ship1Bridge);

        // Ship 1 funnel
        var funnelGeo = new THREE.CylinderGeometry(4, 5, 14, 8);
        var funnel = new THREE.Mesh(funnelGeo, makeMat(0xCC2200));
        funnel.position.set(21400 - 395, 44, -600);
        addMesh(funnel);

        // Container ship 2 — smaller, heading east (outbound)
        var ship2HullGeo = new THREE.BoxGeometry(150, 16, 28);
        var ship2Hull = new THREE.Mesh(ship2HullGeo, makeMat(0x334455));
        ship2Hull.position.set(21400 + 200, 6, 500);
        addMesh(ship2Hull);

        var ship2DeckGeo = new THREE.BoxGeometry(150, 3, 28);
        var ship2Deck = new THREE.Mesh(ship2DeckGeo, makeMat(0x444466));
        ship2Deck.position.set(21400 + 200, 15, 500);
        addMesh(ship2Deck);

        // Ship 2 containers
        for (var c2 = 0; c2 < 4; c2++) {
            var cont2Geo = new THREE.BoxGeometry(28, 9, 24);
            var cont2 = new THREE.Mesh(cont2Geo, makeMat(c2 % 2 === 0 ? 0x228844 : 0xCC8800));
            cont2.position.set(21400 + 140 + c2 * 30, 22, 500);
            addMesh(cont2);
        }

        // Ship 2 superstructure
        var ship2BridgeGeo = new THREE.BoxGeometry(20, 18, 24);
        var ship2Bridge = new THREE.Mesh(ship2BridgeGeo, makeMat(0xCCCCAA));
        ship2Bridge.position.set(21400 + 280, 24, 500);
        addMesh(ship2Bridge);

        // Small tugboat
        var tugGeo = new THREE.BoxGeometry(40, 10, 14);
        var tug = new THREE.Mesh(tugGeo, makeMat(0xCC4400));
        tug.position.set(21400 + 100, 4, -200);
        addMesh(tug);

        var tugCabinGeo = new THREE.BoxGeometry(14, 10, 12);
        var tugCabin = new THREE.Mesh(tugCabinGeo, makeMat(0xFFFFEE));
        tugCabin.position.set(21400 + 120, 12, -200);
        addMesh(tugCabin);
    }

    // === SKY ELEMENTS — clouds, atmospheric detail ===
    function buildSkyElements() {
        // Overcast English sky represented as high box with light grey
        var skyGeo = new THREE.BoxGeometry(8000, 20, 8000);
        var sky = new THREE.Mesh(skyGeo, makeMat(0xBBCCDD));
        sky.position.set(21400, 400, 0);
        addMesh(sky);

        // Cloud puffs
        var cloudPositions = [
            { x: 21200, y: 250, z: 800 },
            { x: 21600, y: 280, z: -500 },
            { x: 21000, y: 260, z: 200 },
            { x: 21800, y: 270, z: 1000 },
            { x: 21400, y: 300, z: -1200 }
        ];

        for (var cl = 0; cl < cloudPositions.length; cl++) {
            var cp = cloudPositions[cl];
            var cloud1Geo = new THREE.SphereGeometry(60, 6, 4);
            var cloud1 = new THREE.Mesh(cloud1Geo, makeMat(0xF0F0F0));
            cloud1.position.set(cp.x, cp.y, cp.z);
            cloud1.scale.set(1.8, 0.7, 1.0);
            addMesh(cloud1);

            var cloud2Geo = new THREE.SphereGeometry(45, 6, 4);
            var cloud2 = new THREE.Mesh(cloud2Geo, makeMat(0xE8E8E8));
            cloud2.position.set(cp.x + 50, cp.y + 10, cp.z);
            cloud2.scale.set(1.4, 0.6, 0.9);
            addMesh(cloud2);
        }
    }

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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
