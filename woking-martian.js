window.WokingMartian = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var heatRayBeam = null;
    var heatRayTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObject(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color, emissive) {
        var matOpts = { color: color };
        if (emissive !== undefined) { matOpts.emissive = emissive; }
        var mat = new THREE.MeshLambertMaterial(matOpts);
        return new THREE.Mesh(geo, mat);
    }

    function build() {
        buildHorsellCommon();
        buildBasingstokeCanal();
        buildTownCentre();
        buildWokingStation();
        buildMcLarenTech();
        buildMartianTripod();
    }

    function buildHorsellCommon() {
        var x = 13000;
        var z = -300;

        // Sandy heathland base — flat crater depression
        var craterGeo = new THREE.CylinderGeometry(120, 140, 6, 12);
        var crater = makeMesh(craterGeo, 0xc2a06e);
        crater.position.set(x - 400, -3, z - 100);
        addObject(crater);

        // Scorched earth ring
        var scorchGeo = new THREE.CylinderGeometry(130, 150, 2, 12);
        var scorch = makeMesh(scorchGeo, 0x3a2a1a);
        scorch.position.set(x - 400, 1, z - 100);
        addObject(scorch);

        // Sand pit 1
        var pit1Geo = new THREE.CylinderGeometry(30, 40, 8, 8);
        var pit1 = makeMesh(pit1Geo, 0xd4b483);
        pit1.position.set(x - 480, -4, z - 60);
        addObject(pit1);

        // Sand pit 2
        var pit2Geo = new THREE.CylinderGeometry(20, 28, 6, 8);
        var pit2 = makeMesh(pit2Geo, 0xd4b483);
        pit2.position.set(x - 360, -4, z - 150);
        addObject(pit2);

        // Pine trees — trunks and cones
        var treePosns = [
            [x - 550, z - 50],
            [x - 570, z - 120],
            [x - 540, z - 180],
            [x - 600, z - 80],
            [x - 310, z - 200],
            [x - 330, z - 240],
            [x - 280, z - 180]
        ];
        for (var i = 0; i < treePosns.length; i++) {
            var tx = treePosns[i][0];
            var tz = treePosns[i][1];

            var trunkGeo = new THREE.CylinderGeometry(3, 5, 30, 6);
            var trunk = makeMesh(trunkGeo, 0x5c3a1e);
            trunk.position.set(tx, 15, tz);
            addObject(trunk);

            var topGeo = new THREE.ConeGeometry(18, 40, 6);
            var top = makeMesh(topGeo, 0x1a4a1a);
            top.position.set(tx, 50, tz);
            addObject(top);

            var midGeo = new THREE.ConeGeometry(14, 30, 6);
            var mid = makeMesh(midGeo, 0x1e5c1e);
            mid.position.set(tx, 70, tz);
            addObject(mid);
        }

        // Heathland scrub patches
        var scrubPositions = [
            [x - 420, z - 220],
            [x - 350, z - 280],
            [x - 460, z - 300],
            [x - 500, z - 250]
        ];
        for (var j = 0; j < scrubPositions.length; j++) {
            var sx = scrubPositions[j][0];
            var sz = scrubPositions[j][1];
            var scrubGeo = new THREE.SphereGeometry(12, 6, 4);
            var scrub = makeMesh(scrubGeo, 0x6b7a2a);
            scrub.position.set(sx, 6, sz);
            scrub.scale.y = 0.4;
            addObject(scrub);
        }
    }

    function buildBasingstokeCanal() {
        var x = 13000;
        var z = 200;

        // Canal water channel — long flat box
        var canalGeo = new THREE.BoxGeometry(800, 4, 40);
        var canal = makeMesh(canalGeo, 0x2a5a7a);
        canal.position.set(x - 200, 1, z);
        addObject(canal);

        // Towpath north side
        var towpathGeo = new THREE.BoxGeometry(800, 2, 20);
        var towpath = makeMesh(towpathGeo, 0x9a8060);
        towpath.position.set(x - 200, 2, z - 30);
        addObject(towpath);

        // Towpath south side
        var towpath2Geo = new THREE.BoxGeometry(800, 2, 20);
        var towpath2 = makeMesh(towpath2Geo, 0x9a8060);
        towpath2.position.set(x - 200, 2, z + 30);
        addObject(towpath2);

        // Canal bridge
        var bridgeDeckGeo = new THREE.BoxGeometry(60, 5, 80);
        var bridgeDeck = makeMesh(bridgeDeckGeo, 0x7a6a50);
        bridgeDeck.position.set(x, 8, z);
        addObject(bridgeDeck);

        // Bridge arch left support
        var archL = new THREE.BoxGeometry(8, 20, 80);
        var archLMesh = makeMesh(archL, 0x6a5a40);
        archLMesh.position.set(x - 25, 0, z);
        addObject(archLMesh);

        // Bridge arch right support
        var archR = new THREE.BoxGeometry(8, 20, 80);
        var archRMesh = makeMesh(archR, 0x6a5a40);
        archRMesh.position.set(x + 25, 0, z);
        addObject(archRMesh);

        // Narrowboat 1
        var boat1HullGeo = new THREE.BoxGeometry(70, 10, 16);
        var boat1Hull = makeMesh(boat1HullGeo, 0xc43030);
        boat1Hull.position.set(x - 150, 5, z);
        addObject(boat1Hull);

        var boat1CabinGeo = new THREE.BoxGeometry(50, 8, 14);
        var boat1Cabin = makeMesh(boat1CabinGeo, 0xd4c060);
        boat1Cabin.position.set(x - 150, 13, z);
        addObject(boat1Cabin);

        // Narrowboat 2
        var boat2HullGeo = new THREE.BoxGeometry(65, 10, 16);
        var boat2Hull = makeMesh(boat2HullGeo, 0x2060a0);
        boat2Hull.position.set(x + 200, 5, z);
        addObject(boat2Hull);

        var boat2CabinGeo = new THREE.BoxGeometry(45, 8, 14);
        var boat2Cabin = makeMesh(boat2CabinGeo, 0xffffff);
        boat2Cabin.position.set(x + 200, 13, z);
        addObject(boat2Cabin);

        // Canal bank vegetation
        var vegPositions = [
            [x - 350, z - 25],
            [x - 300, z - 28],
            [x + 100, z - 26],
            [x + 250, z - 24],
            [x + 320, z + 24],
            [x - 100, z + 26]
        ];
        for (var v = 0; v < vegPositions.length; v++) {
            var vx = vegPositions[v][0];
            var vz = vegPositions[v][1];
            var vegGeo = new THREE.SphereGeometry(8, 5, 4);
            var veg = makeMesh(vegGeo, 0x2a6a20);
            veg.position.set(vx, 8, vz);
            veg.scale.y = 0.7;
            addObject(veg);
        }
    }

    function buildTownCentre() {
        var x = 13000;
        var z = -50;

        // The Peacocks Shopping Centre — large box complex
        var peacocksBaseGeo = new THREE.BoxGeometry(200, 40, 150);
        var peacocksBase = makeMesh(peacocksBaseGeo, 0xc8c0b0);
        peacocksBase.position.set(x + 100, 20, z);
        addObject(peacocksBase);

        var peacocksTopGeo = new THREE.BoxGeometry(180, 20, 130);
        var peacocksTop = makeMesh(peacocksTopGeo, 0xd8d0c0);
        peacocksTop.position.set(x + 100, 50, z);
        addObject(peacocksTop);

        // Shopping centre roof features
        var roofBoxGeo = new THREE.BoxGeometry(60, 10, 60);
        var roofBox = makeMesh(roofBoxGeo, 0xa8a090);
        roofBox.position.set(x + 100, 65, z);
        addObject(roofBox);

        // Victoria Square plaza — ground level
        var plazaGeo = new THREE.BoxGeometry(120, 1, 100);
        var plaza = makeMesh(plazaGeo, 0xb0a890);
        plaza.position.set(x - 20, 0.5, z);
        addObject(plaza);

        // H.G. Wells statue plinth
        var plinthGeo = new THREE.BoxGeometry(8, 20, 8);
        var plinth = makeMesh(plinthGeo, 0x888070);
        plinth.position.set(x - 20, 10, z - 30);
        addObject(plinth);

        // H.G. Wells figure on plinth — simple humanoid approximation
        var figBodyGeo = new THREE.BoxGeometry(5, 12, 3);
        var figBody = makeMesh(figBodyGeo, 0x705030);
        figBody.position.set(x - 20, 27, z - 30);
        addObject(figBody);

        var figHeadGeo = new THREE.SphereGeometry(3, 6, 6);
        var figHead = makeMesh(figHeadGeo, 0x806040);
        figHead.position.set(x - 20, 37, z - 30);
        addObject(figHead);

        // Quote inscription panels on plinth sides
        var panel1Geo = new THREE.BoxGeometry(7.5, 6, 0.5);
        var panel1 = makeMesh(panel1Geo, 0x6a6050);
        panel1.position.set(x - 20, 8, z - 34);
        addObject(panel1);

        var panel2Geo = new THREE.BoxGeometry(0.5, 6, 7.5);
        var panel2 = makeMesh(panel2Geo, 0x6a6050);
        panel2.position.set(x - 24, 8, z - 30);
        addObject(panel2);

        // Surrounding buildings — town centre blocks
        var bldgData = [
            [x - 160, 35, z - 60, 80, 70, 60],
            [x - 160, 25, z + 60, 80, 50, 60],
            [x + 250, 30, z - 40, 70, 60, 80],
            [x + 250, 20, z + 60, 60, 40, 70],
            [x - 60, 45, z - 110, 100, 90, 40],
            [x + 80, 25, z - 120, 80, 50, 40]
        ];
        var bldgColors = [0xb8b0a0, 0xc0b8a8, 0xa8a098, 0xb0a8a0, 0xc8c0b8, 0xb8b0a8];
        for (var b = 0; b < bldgData.length; b++) {
            var bd = bldgData[b];
            var bGeo = new THREE.BoxGeometry(bd[3], bd[4], bd[5]);
            var bMesh = makeMesh(bGeo, bldgColors[b]);
            bMesh.position.set(bd[0], bd[1], bd[2]);
            addObject(bMesh);
        }

        // Street lamps in plaza
        var lampPositions = [
            [x - 40, z - 20],
            [x, z - 20],
            [x - 40, z + 20],
            [x, z + 20]
        ];
        for (var l = 0; l < lampPositions.length; l++) {
            var lx = lampPositions[l][0];
            var lz = lampPositions[l][1];
            var poleGeo = new THREE.CylinderGeometry(0.5, 0.7, 18, 5);
            var pole = makeMesh(poleGeo, 0x505050);
            pole.position.set(lx, 9, lz);
            addObject(pole);
            var lampheadGeo = new THREE.SphereGeometry(2, 5, 4);
            var lamphead = makeMesh(lampheadGeo, 0xffffcc, 0xffffaa);
            lamphead.position.set(lx, 19, lz);
            addObject(lamphead);
        }
    }

    function buildWokingStation() {
        var x = 13000;
        var z = 100;

        // Main station building
        var stationBldgGeo = new THREE.BoxGeometry(120, 30, 50);
        var stationBldg = makeMesh(stationBldgGeo, 0xc0b09a);
        stationBldg.position.set(x - 80, 15, z + 80);
        addObject(stationBldg);

        // Station roof — gabled
        var roofGeo = new THREE.CylinderGeometry(0, 65, 20, 4);
        var stationRoof = makeMesh(roofGeo, 0x806050);
        stationRoof.position.set(x - 80, 37, z + 80);
        stationRoof.rotation.y = Math.PI / 4;
        addObject(stationRoof);

        // Platform 1 — main platform
        var plat1Geo = new THREE.BoxGeometry(200, 4, 20);
        var plat1 = makeMesh(plat1Geo, 0xa09080);
        plat1.position.set(x - 50, 2, z + 120);
        addObject(plat1);

        // Platform 2
        var plat2Geo = new THREE.BoxGeometry(200, 4, 20);
        var plat2 = makeMesh(plat2Geo, 0xa09080);
        plat2.position.set(x - 50, 2, z + 155);
        addObject(plat2);

        // Platform canopy 1 — series of columns and roof
        var canopyRoof1Geo = new THREE.BoxGeometry(200, 3, 18);
        var canopyRoof1 = makeMesh(canopyRoof1Geo, 0x607050);
        canopyRoof1.position.set(x - 50, 14, z + 120);
        addObject(canopyRoof1);

        var canopyCol1Positions = [-130, -70, -10, 50, 110];
        for (var cp1 = 0; cp1 < canopyCol1Positions.length; cp1++) {
            var colGeo1 = new THREE.CylinderGeometry(1, 1, 12, 5);
            var col1 = makeMesh(colGeo1, 0x708060);
            col1.position.set(x + canopyCol1Positions[cp1], 6, z + 120);
            addObject(col1);
        }

        // Platform canopy 2
        var canopyRoof2Geo = new THREE.BoxGeometry(200, 3, 18);
        var canopyRoof2 = makeMesh(canopyRoof2Geo, 0x607050);
        canopyRoof2.position.set(x - 50, 14, z + 155);
        addObject(canopyRoof2);

        // Footbridge over platforms
        var footbridgeDeckGeo = new THREE.BoxGeometry(10, 3, 55);
        var footbridgeDeck = makeMesh(footbridgeDeckGeo, 0x808880);
        footbridgeDeck.position.set(x + 20, 22, z + 137);
        addObject(footbridgeDeck);

        // Footbridge support columns
        var fbCol1Geo = new THREE.BoxGeometry(3, 22, 3);
        var fbCol1 = makeMesh(fbCol1Geo, 0x707870);
        fbCol1.position.set(x + 20, 11, z + 115);
        addObject(fbCol1);

        var fbCol2Geo = new THREE.BoxGeometry(3, 22, 3);
        var fbCol2 = makeMesh(fbCol2Geo, 0x707870);
        fbCol2.position.set(x + 20, 11, z + 158);
        addObject(fbCol2);

        // Taxi rank — small flat area with taxis
        var taxiRankGeo = new THREE.BoxGeometry(80, 1, 30);
        var taxiRank = makeMesh(taxiRankGeo, 0x888080);
        taxiRank.position.set(x - 120, 0.5, z + 65);
        addObject(taxiRank);

        // Taxis
        var taxiColors = [0xf0d000, 0xf0d000, 0xf0d000];
        var taxiXs = [x - 140, x - 110, x - 80];
        for (var t = 0; t < taxiColors.length; t++) {
            var taxiBodyGeo = new THREE.BoxGeometry(14, 6, 8);
            var taxiBody = makeMesh(taxiBodyGeo, taxiColors[t]);
            taxiBody.position.set(taxiXs[t], 4, z + 65);
            addObject(taxiBody);

            var taxiTopGeo = new THREE.BoxGeometry(9, 4, 7);
            var taxiTop = makeMesh(taxiTopGeo, taxiColors[t]);
            taxiTop.position.set(taxiXs[t] - 1, 9, z + 65);
            addObject(taxiTop);
        }

        // Station entrance canopy
        var entranceGeo = new THREE.BoxGeometry(40, 8, 15);
        var entrance = makeMesh(entranceGeo, 0x708060);
        entrance.position.set(x - 80, 30, z + 55);
        addObject(entrance);

        // Track rails (simple box strips)
        var rail1Geo = new THREE.BoxGeometry(200, 1, 2);
        var rail1 = makeMesh(rail1Geo, 0x505050);
        rail1.position.set(x - 50, 0.5, z + 132);
        addObject(rail1);

        var rail2Geo = new THREE.BoxGeometry(200, 1, 2);
        var rail2 = makeMesh(rail2Geo, 0x505050);
        rail2.position.set(x - 50, 0.5, z + 143);
        addObject(rail2);
    }

    function buildMcLarenTech() {
        var x = 13000;
        var z = -500;

        // McLaren Technology Centre — futuristic curved glass building
        // Main curved low-rise building silhouette — approximated with boxes and cylinders
        var mainBuildingGeo = new THREE.BoxGeometry(300, 25, 80);
        var mainBuilding = makeMesh(mainBuildingGeo, 0x8aaccc);
        mainBuilding.position.set(x + 500, 12, z);
        addObject(mainBuilding);

        // Curved wing extension
        var wingGeo = new THREE.BoxGeometry(180, 20, 60);
        var wing = makeMesh(wingGeo, 0x9ab8d8);
        wing.position.set(x + 500, 10, z - 70);
        addObject(wing);

        // Circular drum feature — distinctive McLaren rotunda
        var drumGeo = new THREE.CylinderGeometry(40, 42, 18, 12);
        var drum = makeMesh(drumGeo, 0xa0b8d0);
        drum.position.set(x + 500, 9, z + 10);
        addObject(drum);

        // Roof — low glass canopy
        var roofGeo2 = new THREE.BoxGeometry(320, 4, 85);
        var mcRoof = makeMesh(roofGeo2, 0x7090b0);
        mcRoof.position.set(x + 500, 26, z);
        addObject(mcRoof);

        // Reflecting lake in front — McLaren has one
        var lakeGeo = new THREE.CylinderGeometry(80, 80, 2, 12);
        var lake = makeMesh(lakeGeo, 0x4a6a8a);
        lake.position.set(x + 500, 0, z + 100);
        addObject(lake);

        // Security gatehouse
        var gateGeo = new THREE.BoxGeometry(15, 12, 10);
        var gate = makeMesh(gateGeo, 0x909898);
        gate.position.set(x + 360, 6, z + 150);
        addObject(gate);

        // Access road
        var roadGeo = new THREE.BoxGeometry(20, 1, 160);
        var road = makeMesh(roadGeo, 0x404040);
        road.position.set(x + 360, 0.5, z + 80);
        addObject(road);

        // Landscape mounding around building
        var mound1Geo = new THREE.SphereGeometry(50, 8, 4);
        var mound1 = makeMesh(mound1Geo, 0x3a6a2a);
        mound1.position.set(x + 370, -20, z - 50);
        mound1.scale.y = 0.3;
        addObject(mound1);

        var mound2Geo = new THREE.SphereGeometry(60, 8, 4);
        var mound2 = makeMesh(mound2Geo, 0x3a6a2a);
        mound2.position.set(x + 640, -20, z + 30);
        mound2.scale.y = 0.3;
        addObject(mound2);
    }

    function buildMartianTripod() {
        var x = 13000;
        var z = -150;

        // Tripod base height from ground
        var legTopY = 180;
        var bodyY = 200;

        // Three legs — angled outward from top hub
        var legAngles = [0, Math.PI * 2 / 3, Math.PI * 4 / 3];
        var legSpreadX = [80, -40, -40];
        var legSpreadZ = [0, 69, -69];

        for (var leg = 0; leg < 3; leg++) {
            // Upper leg segment
            var upperLegGeo = new THREE.CylinderGeometry(4, 6, 120, 6);
            var upperLeg = makeMesh(upperLegGeo, 0x7a8a6a);
            upperLeg.position.set(
                x + legSpreadX[leg] * 0.4,
                legTopY - 60,
                z + legSpreadZ[leg] * 0.4
            );
            upperLeg.rotation.z = legAngles[leg] === 0 ? 0.25 : (leg === 1 ? -0.15 : -0.15);
            upperLeg.rotation.x = leg === 0 ? 0 : (leg === 1 ? 0.2 : -0.2);
            addObject(upperLeg);

            // Lower leg segment — splayed foot
            var lowerLegGeo = new THREE.CylinderGeometry(3, 8, 100, 6);
            var lowerLeg = makeMesh(lowerLegGeo, 0x7a8a6a);
            lowerLeg.position.set(
                x + legSpreadX[leg] * 0.8,
                50,
                z + legSpreadZ[leg] * 0.8
            );
            lowerLeg.rotation.z = legAngles[leg] === 0 ? 0.4 : (leg === 1 ? -0.3 : -0.3);
            lowerLeg.rotation.x = leg === 0 ? 0 : (leg === 1 ? 0.35 : -0.35);
            addObject(lowerLeg);

            // Foot pad
            var footGeo = new THREE.CylinderGeometry(12, 14, 6, 6);
            var foot = makeMesh(footGeo, 0x6a7a5a);
            foot.position.set(
                x + legSpreadX[leg],
                4,
                z + legSpreadZ[leg]
            );
            addObject(foot);
        }

        // Central hub at top of legs — where legs join body
        var hubGeo = new THREE.SphereGeometry(18, 8, 6);
        var hub = makeMesh(hubGeo, 0x8a9a7a);
        hub.position.set(x, legTopY, z);
        addObject(hub);

        // Body / alien pod — the main ovoid body
        var bodyGeo = new THREE.SphereGeometry(35, 10, 8);
        var body = makeMesh(bodyGeo, 0x7a8a5a);
        body.position.set(x, bodyY, z);
        body.scale.y = 1.4;
        addObject(body);

        // Alien pod dome on top
        var domeGeo = new THREE.SphereGeometry(22, 8, 6);
        var dome = makeMesh(domeGeo, 0x9aaa7a);
        dome.position.set(x, bodyY + 38, z);
        dome.scale.y = 0.6;
        addObject(dome);

        // Heat ray tentacles — thin protrusions from body
        var tentacleData = [
            [20, -10, 0.3, 0],
            [-20, -10, -0.3, 0],
            [10, -15, 0, 0.3],
            [-10, -15, 0, -0.3],
            [15, -5, 0.2, 0.2],
            [-15, -5, -0.2, 0.2]
        ];
        for (var t = 0; t < tentacleData.length; t++) {
            var td = tentacleData[t];
            var tentGeo = new THREE.CylinderGeometry(1, 3, 50, 5);
            var tent = makeMesh(tentGeo, 0x6a7a5a);
            tent.position.set(x + td[0], bodyY + td[1], z);
            tent.rotation.z = td[2];
            tent.rotation.x = td[3];
            addObject(tent);
        }

        // Central heat ray emitter tube beneath body
        var emitterGeo = new THREE.CylinderGeometry(4, 6, 30, 6);
        var emitter = makeMesh(emitterGeo, 0xaabb80);
        emitter.position.set(x, bodyY - 45, z);
        addObject(emitter);

        // Glowing heat ray beam — downward cone of orange/red energy
        var beamGeo = new THREE.CylinderGeometry(0, 25, 160, 8);
        var beamMat = new THREE.MeshLambertMaterial({
            color: 0xff4400,
            emissive: 0xff2200,
            transparent: true,
            opacity: 0.7
        });
        heatRayBeam = new THREE.Mesh(beamGeo, beamMat);
        heatRayBeam.position.set(x, bodyY - 130, z);
        scene.add(heatRayBeam);
        objects.push(heatRayBeam);

        // Heat ray impact glow on ground
        var glowGeo = new THREE.CylinderGeometry(30, 30, 2, 10);
        var glowMat = new THREE.MeshLambertMaterial({
            color: 0xff6600,
            emissive: 0xff3300,
            transparent: true,
            opacity: 0.8
        });
        var glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(x, 1, z);
        scene.add(glow);
        objects.push(glow);

        // Decorative ring around tripod body midriff
        var ringGeo = new THREE.CylinderGeometry(38, 38, 5, 12);
        var ring = makeMesh(ringGeo, 0x9aaa70);
        ring.position.set(x, bodyY - 5, z);
        addObject(ring);

        // Viewport / eye on the body — alien observation port
        var viewportGeo = new THREE.SphereGeometry(8, 6, 5);
        var viewportMat = new THREE.MeshLambertMaterial({
            color: 0xff2200,
            emissive: 0xcc1100
        });
        var viewport = new THREE.Mesh(viewportGeo, viewportMat);
        viewport.position.set(x + 28, bodyY + 10, z);
        scene.add(viewport);
        objects.push(viewport);

        // Secondary viewport
        var viewport2Geo = new THREE.SphereGeometry(6, 6, 5);
        var viewport2Mat = new THREE.MeshLambertMaterial({
            color: 0xff2200,
            emissive: 0xcc1100
        });
        var viewport2 = new THREE.Mesh(viewport2Geo, viewport2Mat);
        viewport2.position.set(x - 26, bodyY + 15, z + 12);
        scene.add(viewport2);
        objects.push(viewport2);

        // Scorched ground circle beneath tripod
        var groundScorchGeo = new THREE.CylinderGeometry(90, 90, 1, 12);
        var groundScorch = makeMesh(groundScorchGeo, 0x2a1a0a);
        groundScorch.position.set(x, 0.5, z);
        addObject(groundScorch);
    }

    function update(delta) {
        if (heatRayBeam) {
            heatRayTime += delta;
            var pulse = 0.5 + 0.5 * Math.sin(heatRayTime * 4.0);
            heatRayBeam.material.opacity = 0.4 + 0.4 * pulse;
            heatRayBeam.scale.x = 0.85 + 0.3 * pulse;
            heatRayBeam.scale.z = 0.85 + 0.3 * pulse;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        heatRayBeam = null;
        heatRayTime = 0;
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
