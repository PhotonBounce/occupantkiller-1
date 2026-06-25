window.SouthwarkBridge = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11280;

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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildTateModern() {
        // Main turbine hall building - long brick structure
        var hallGeo = new THREE.BoxGeometry(80, 24, 30);
        var hallMat = makeMaterial(0x8B4513);
        var hall = new THREE.Mesh(hallGeo, hallMat);
        hall.position.set(X_OFFSET + 0, 12, -40);
        addMesh(hall);

        // Turbine hall glass roof structure
        var roofGeo = new THREE.BoxGeometry(80, 8, 32);
        var roofMat = makeMaterial(0x87CEEB);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(X_OFFSET + 0, 28, -40);
        addMesh(roof);

        // Massive industrial chimney tower (4x4 cross section, 40 high)
        var chimneyGeo = new THREE.BoxGeometry(4, 40, 4);
        var chimneyMat = makeMaterial(0x6B3A2A);
        var chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
        chimney.position.set(X_OFFSET + 20, 20, -40);
        addMesh(chimney);

        // Chimney cap
        var chimneyCapGeo = new THREE.BoxGeometry(5, 2, 5);
        var chimneyCapMat = makeMaterial(0x5A2D1A);
        var chimneyCap = new THREE.Mesh(chimneyCapGeo, chimneyCapMat);
        chimneyCap.position.set(X_OFFSET + 20, 41, -40);
        addMesh(chimneyCap);

        // Switch House extension - pyramid-topped tower
        var switchHouseGeo = new THREE.BoxGeometry(20, 30, 20);
        var switchHouseMat = makeMaterial(0x708090);
        var switchHouse = new THREE.Mesh(switchHouseGeo, switchHouseMat);
        switchHouse.position.set(X_OFFSET - 48, 15, -40);
        addMesh(switchHouse);

        // Switch House pyramid top
        var pyramidGeo = new THREE.ConeGeometry(14, 12, 4);
        var pyramidMat = makeMaterial(0x607080);
        var pyramid = new THREE.Mesh(pyramidGeo, pyramidMat);
        pyramid.position.set(X_OFFSET - 48, 36, -40);
        pyramid.rotation.y = Math.PI / 4;
        addMesh(pyramid);

        // Riverside terrace - wide flat platform
        var terraceGeo = new THREE.BoxGeometry(100, 1.5, 12);
        var terraceMat = makeMaterial(0xC0C0A0);
        var terrace = new THREE.Mesh(terraceGeo, terraceMat);
        terrace.position.set(X_OFFSET - 5, 0.75, -22);
        addMesh(terrace);

        // Terrace railing posts
        for (var i = 0; i < 20; i++) {
            var postGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
            var postMat = makeMaterial(0x808080);
            var post = new THREE.Mesh(postGeo, postMat);
            post.position.set(X_OFFSET - 48 + i * 5, 1.9, -16.5);
            addMesh(post);
        }
    }

    function buildGlobeTheatre() {
        var gx = X_OFFSET + 60;
        var gz = -70;

        // Outer circular timber-frame wall
        var outerWallGeo = new THREE.CylinderGeometry(18, 18, 10, 20, 1, true);
        var outerWallMat = makeMaterial(0xDEB887);
        var outerWall = new THREE.Mesh(outerWallGeo, outerWallMat);
        outerWall.position.set(gx, 5, gz);
        addMesh(outerWall);

        // Outer wall floor fill
        var floorGeo = new THREE.CylinderGeometry(18, 18, 0.5, 20);
        var floorMat = makeMaterial(0xC8A870);
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(gx, 0.25, gz);
        addMesh(floor);

        // Inner gallery ring (raised seating levels) - first tier
        var tier1Geo = new THREE.CylinderGeometry(16, 16, 3, 20, 1, true);
        var tier1Mat = makeMaterial(0xC8A060);
        var tier1 = new THREE.Mesh(tier1Geo, tier1Mat);
        tier1.position.set(gx, 11.5, gz);
        addMesh(tier1);

        // Second gallery tier
        var tier2Geo = new THREE.CylinderGeometry(17, 17, 3, 20, 1, true);
        var tier2Mat = makeMaterial(0xBE9050);
        var tier2 = new THREE.Mesh(tier2Geo, tier2Mat);
        tier2.position.set(gx, 14.5, gz);
        addMesh(tier2);

        // Third gallery tier / upper wall
        var tier3Geo = new THREE.CylinderGeometry(17.5, 17, 3, 20, 1, true);
        var tier3Mat = makeMaterial(0xB48040);
        var tier3 = new THREE.Mesh(tier3Geo, tier3Mat);
        tier3.position.set(gx, 17.5, gz);
        addMesh(tier3);

        // Thatched roof ring - suggestion of thatch overhang
        var thatchGeo = new THREE.CylinderGeometry(20, 18, 2, 20, 1, true);
        var thatchMat = makeMaterial(0xD2A050);
        var thatch = new THREE.Mesh(thatchGeo, thatchMat);
        thatch.position.set(gx, 19.5, gz);
        addMesh(thatch);

        // Thatched roof top cap
        var roofCapGeo = new THREE.CylinderGeometry(19, 20, 1.5, 20);
        var roofCapMat = makeMaterial(0xC89040);
        var roofCap = new THREE.Mesh(roofCapGeo, roofCapMat);
        roofCap.position.set(gx, 20.75, gz);
        addMesh(roofCap);

        // Open-air yard (circular ground inside)
        var yardGeo = new THREE.CylinderGeometry(12, 12, 0.3, 20);
        var yardMat = makeMaterial(0x9B8060);
        var yard = new THREE.Mesh(yardGeo, yardMat);
        yard.position.set(gx, 0.15, gz);
        addMesh(yard);

        // Stage projecting into yard - rectangular platform
        var stageGeo = new THREE.BoxGeometry(12, 1.2, 8);
        var stageMat = makeMaterial(0xA07040);
        var stage = new THREE.Mesh(stageGeo, stageMat);
        stage.position.set(gx, 0.6, gz + 10);
        addMesh(stage);

        // Stage front fascia
        var stageFasciaGeo = new THREE.BoxGeometry(12, 1.5, 0.4);
        var stageFasciaMat = makeMaterial(0x8B6030);
        var stageFascia = new THREE.Mesh(stageFasciaGeo, stageFasciaMat);
        stageFascia.position.set(gx, 0.75, gz + 14.2);
        addMesh(stageFascia);

        // Tiring house wall behind stage
        var tiringGeo = new THREE.BoxGeometry(14, 12, 3);
        var tiringMat = makeMaterial(0xCEB080);
        var tiring = new THREE.Mesh(tiringGeo, tiringMat);
        tiring.position.set(gx, 6, gz + 5.5);
        addMesh(tiring);

        // Tiring house roof
        var tiringRoofGeo = new THREE.BoxGeometry(15, 1, 4);
        var tiringRoofMat = makeMaterial(0xC09040);
        var tiringRoof = new THREE.Mesh(tiringRoofGeo, tiringRoofMat);
        tiringRoof.position.set(gx, 12, gz + 5.5);
        addMesh(tiringRoof);
    }

    function buildSouthwarkBridge() {
        var bx = X_OFFSET + 10;
        var bz = 20;
        var bridgeLength = 90;
        var bridgeWidth = 12;

        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(bridgeLength, 1.2, bridgeWidth);
        var deckMat = makeMaterial(0x9C9C8C);
        var deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(bx, 6, bz);
        addMesh(deck);

        // Five stone arch spans - piers between arches
        var archColors = [0x8C8C7C, 0x848478, 0x7C7C70];
        for (var a = 0; a < 4; a++) {
            var pierGeo = new THREE.BoxGeometry(4, 8, bridgeWidth + 2);
            var pierMat = makeMaterial(archColors[a % 3]);
            var pier = new THREE.Mesh(pierGeo, pierMat);
            pier.position.set(bx - 36 + a * 18, 4, bz);
            addMesh(pier);
        }

        // Arch fill (simplified box arches under deck)
        for (var b = 0; b < 5; b++) {
            var archGeo = new THREE.BoxGeometry(14, 6, bridgeWidth - 2);
            var archMat = makeMaterial(0x7A7A6A);
            var arch = new THREE.Mesh(archGeo, archMat);
            arch.position.set(bx - 45 + b * 18, 3, bz);
            addMesh(arch);
        }

        // Stone parapet balustrade - north side
        var parapetNGeo = new THREE.BoxGeometry(bridgeLength, 1.2, 0.6);
        var parapetNMat = makeMaterial(0xAAAAAA);
        var parapetN = new THREE.Mesh(parapetNGeo, parapetNMat);
        parapetN.position.set(bx, 7.3, bz - 5.7);
        addMesh(parapetN);

        // Stone parapet balustrade - south side
        var parapetSGeo = new THREE.BoxGeometry(bridgeLength, 1.2, 0.6);
        var parapetSMat = makeMaterial(0xAAAAAA);
        var parapetS = new THREE.Mesh(parapetSGeo, parapetSMat);
        parapetS.position.set(bx, 7.3, bz + 5.7);
        addMesh(parapetS);

        // Lamp posts along bridge
        for (var l = 0; l < 8; l++) {
            var lampPostGeo = new THREE.CylinderGeometry(0.15, 0.2, 4, 6);
            var lampPostMat = makeMaterial(0x404040);
            var lampPost = new THREE.Mesh(lampPostGeo, lampPostMat);
            lampPost.position.set(bx - 42 + l * 12, 9.4, bz - 5.4);
            addMesh(lampPost);

            var lampGeo = new THREE.SphereGeometry(0.35, 6, 6);
            var lampMat = makeMaterial(0xFFFF99);
            var lamp = new THREE.Mesh(lampGeo, lampMat);
            lamp.position.set(bx - 42 + l * 12, 11.5, bz - 5.4);
            addMesh(lamp);

            // South side lamps
            var lampPost2Geo = new THREE.CylinderGeometry(0.15, 0.2, 4, 6);
            var lampPost2Mat = makeMaterial(0x404040);
            var lampPost2 = new THREE.Mesh(lampPost2Geo, lampPost2Mat);
            lampPost2.position.set(bx - 42 + l * 12, 9.4, bz + 5.4);
            addMesh(lampPost2);

            var lamp2Geo = new THREE.SphereGeometry(0.35, 6, 6);
            var lamp2Mat = makeMaterial(0xFFFF99);
            var lamp2 = new THREE.Mesh(lamp2Geo, lamp2Mat);
            lamp2.position.set(bx - 42 + l * 12, 11.5, bz + 5.4);
            addMesh(lamp2);
        }

        // Bridge abutments / approaches
        var abutNGeo = new THREE.BoxGeometry(10, 8, bridgeWidth);
        var abutNMat = makeMaterial(0x888878);
        var abutN = new THREE.Mesh(abutNGeo, abutNMat);
        abutN.position.set(bx - 50, 4, bz);
        addMesh(abutN);

        var abutSGeo = new THREE.BoxGeometry(10, 8, bridgeWidth);
        var abutSMat = makeMaterial(0x888878);
        var abutS = new THREE.Mesh(abutSGeo, abutSMat);
        abutS.position.set(bx + 50, 4, bz);
        addMesh(abutS);
    }

    function buildCardinalsWharf() {
        var wx = X_OFFSET + 100;
        var wz = -30;

        // Row of 17th-century timber-frame houses - Cardinal's Wharf
        var houseData = [
            { dx: 0,  w: 8,  h: 10, d: 7, color: 0xC8A878 },
            { dx: 10, w: 7,  h: 12, d: 7, color: 0xBE9868 },
            { dx: 19, w: 9,  h: 11, d: 7, color: 0xD4B080 },
            { dx: 30, w: 8,  h: 13, d: 7, color: 0xC0A070 }
        ];

        for (var h = 0; h < houseData.length; h++) {
            var hd = houseData[h];

            // House body
            var houseGeo = new THREE.BoxGeometry(hd.w, hd.h, hd.d);
            var houseMat = makeMaterial(hd.color);
            var house = new THREE.Mesh(houseGeo, houseMat);
            house.position.set(wx + hd.dx, hd.h / 2, wz);
            addMesh(house);

            // Timber frame verticals (dark strips)
            var frameVGeo = new THREE.BoxGeometry(0.3, hd.h, 0.4);
            var frameVMat = makeMaterial(0x3C2010);
            var frameVL = new THREE.Mesh(frameVGeo, frameVMat);
            frameVL.position.set(wx + hd.dx - hd.w / 2 + 0.5, hd.h / 2, wz - hd.d / 2 - 0.1);
            addMesh(frameVL);

            var frameVR = new THREE.Mesh(frameVGeo.clone(), frameVMat);
            frameVR.position.set(wx + hd.dx + hd.w / 2 - 0.5, hd.h / 2, wz - hd.d / 2 - 0.1);
            addMesh(frameVR);

            // Timber frame horizontals
            var frameHGeo = new THREE.BoxGeometry(hd.w, 0.3, 0.4);
            var frameHMat = makeMaterial(0x3C2010);
            var frameHM = new THREE.Mesh(frameHGeo, frameHMat);
            frameHM.position.set(wx + hd.dx, hd.h / 2, wz - hd.d / 2 - 0.1);
            addMesh(frameHM);

            // Roof - pitched gable
            var roofGeo = new THREE.CylinderGeometry(0, hd.w * 0.7, 4, 4);
            var roofMat = makeMaterial(0x8B4513);
            var roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.position.set(wx + hd.dx, hd.h + 2, wz);
            roofMesh.rotation.y = Math.PI / 4;
            addMesh(roofMesh);

            // Chimney stack
            var cStackGeo = new THREE.BoxGeometry(1.2, 4, 1.2);
            var cStackMat = makeMaterial(0x8C5030);
            var cStack = new THREE.Mesh(cStackGeo, cStackMat);
            cStack.position.set(wx + hd.dx + 1, hd.h + 5, wz);
            addMesh(cStack);

            // Windows - front facade
            for (var ww = 0; ww < 2; ww++) {
                var winGeo = new THREE.BoxGeometry(1.4, 1.8, 0.2);
                var winMat = makeMaterial(0x87CEEB);
                var win = new THREE.Mesh(winGeo, winMat);
                win.position.set(wx + hd.dx - 1.8 + ww * 3.6, hd.h * 0.6, wz - hd.d / 2 - 0.05);
                addMesh(win);
            }
        }

        // Shared cobblestone path in front
        var pathGeo = new THREE.BoxGeometry(38, 0.2, 4);
        var pathMat = makeMaterial(0xA09080);
        var path = new THREE.Mesh(pathGeo, pathMat);
        path.position.set(wx + 15, 0.1, wz - 6);
        addMesh(path);
    }

    function buildMillenniumBridge() {
        var mx = X_OFFSET - 40;
        var mz = 40;
        var deckLen = 70;
        var deckWidth = 6;

        // Bridge deck - narrow pedestrian footbridge
        var mDeckGeo = new THREE.BoxGeometry(deckLen, 0.5, deckWidth);
        var mDeckMat = makeMaterial(0xB0B0B0);
        var mDeck = new THREE.Mesh(mDeckGeo, mDeckMat);
        mDeck.position.set(mx, 5, mz);
        addMesh(mDeck);

        // Two Y-shaped support structures (pylons)
        // Support 1 - left pylon
        var p1x = mx - 20;
        // Vertical stem
        var stem1Geo = new THREE.CylinderGeometry(0.5, 0.7, 8, 6);
        var stem1Mat = makeMaterial(0x909090);
        var stem1 = new THREE.Mesh(stem1Geo, stem1Mat);
        stem1.position.set(p1x, 4, mz);
        addMesh(stem1);

        // Y-arms for pylon 1 - left arm
        var arm1LGeo = new THREE.CylinderGeometry(0.35, 0.45, 7, 6);
        var arm1LMat = makeMaterial(0x909090);
        var arm1L = new THREE.Mesh(arm1LGeo, arm1LMat);
        arm1L.position.set(p1x - 2.5, 9, mz - 2);
        arm1L.rotation.z = Math.PI / 6;
        arm1L.rotation.x = -Math.PI / 10;
        addMesh(arm1L);

        // Y-arms for pylon 1 - right arm
        var arm1RGeo = new THREE.CylinderGeometry(0.35, 0.45, 7, 6);
        var arm1RMat = makeMaterial(0x909090);
        var arm1R = new THREE.Mesh(arm1RGeo, arm1RMat);
        arm1R.position.set(p1x + 2.5, 9, mz + 2);
        arm1R.rotation.z = -Math.PI / 6;
        arm1R.rotation.x = Math.PI / 10;
        addMesh(arm1R);

        // Support 2 - right pylon
        var p2x = mx + 20;
        var stem2Geo = new THREE.CylinderGeometry(0.5, 0.7, 8, 6);
        var stem2Mat = makeMaterial(0x909090);
        var stem2 = new THREE.Mesh(stem2Geo, stem2Mat);
        stem2.position.set(p2x, 4, mz);
        addMesh(stem2);

        // Y-arms for pylon 2 - left arm
        var arm2LGeo = new THREE.CylinderGeometry(0.35, 0.45, 7, 6);
        var arm2LMat = makeMaterial(0x909090);
        var arm2L = new THREE.Mesh(arm2LGeo, arm2LMat);
        arm2L.position.set(p2x - 2.5, 9, mz - 2);
        arm2L.rotation.z = Math.PI / 6;
        arm2L.rotation.x = -Math.PI / 10;
        addMesh(arm2L);

        // Y-arms for pylon 2 - right arm
        var arm2RGeo = new THREE.CylinderGeometry(0.35, 0.45, 7, 6);
        var arm2RMat = makeMaterial(0x909090);
        var arm2R = new THREE.Mesh(arm2RGeo, arm2RMat);
        arm2R.position.set(p2x + 2.5, 9, mz + 2);
        arm2R.rotation.z = -Math.PI / 6;
        arm2R.rotation.x = Math.PI / 10;
        addMesh(arm2R);

        // Lateral cables - LineSegments along each side of deck
        var cablePoints = [];
        var cableSegments = 14;
        for (var c = 0; c < cableSegments; c++) {
            var cx1 = mx - deckLen / 2 + c * (deckLen / cableSegments);
            var cy1 = 5.2;
            var cx2 = mx - deckLen / 2 + (c + 1) * (deckLen / cableSegments);
            var cy2 = 5.2;
            // North cable
            cablePoints.push(cx1, cy1, mz - deckWidth / 2 - 0.2);
            cablePoints.push(cx2, cy2, mz - deckWidth / 2 - 0.2);
            // South cable
            cablePoints.push(cx1, cy1, mz + deckWidth / 2 + 0.2);
            cablePoints.push(cx2, cy2, mz + deckWidth / 2 + 0.2);
        }

        // Vertical cable hangers
        var hangerCount = 12;
        for (var hh = 0; hh < hangerCount; hh++) {
            var hx = mx - deckLen / 2 + (hh + 0.5) * (deckLen / hangerCount);
            cablePoints.push(hx, 5.2, mz - deckWidth / 2 - 0.2);
            cablePoints.push(hx, 3.5, mz - deckWidth / 2 - 0.2);
            cablePoints.push(hx, 5.2, mz + deckWidth / 2 + 0.2);
            cablePoints.push(hx, 3.5, mz + deckWidth / 2 + 0.2);
        }

        var cablePositions = new Float32Array(cablePoints);
        var cableGeo = new THREE.BufferGeometry();
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x808080 });
        var cableLines = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cableLines);
        objects.push(cableLines);

        // Deck edge rails - north and south
        var railNGeo = new THREE.BoxGeometry(deckLen, 0.8, 0.15);
        var railNMat = makeMaterial(0x808080);
        var railN = new THREE.Mesh(railNGeo, railNMat);
        railN.position.set(mx, 5.65, mz - deckWidth / 2);
        addMesh(railN);

        var railSGeo = new THREE.BoxGeometry(deckLen, 0.8, 0.15);
        var railSMat = makeMaterial(0x808080);
        var railS = new THREE.Mesh(railSGeo, railSMat);
        railS.position.set(mx, 5.65, mz + deckWidth / 2);
        addMesh(railS);
    }

    function buildBanksideContext() {
        // Thames Riverbank embankment wall
        var embankGeo = new THREE.BoxGeometry(300, 3, 4);
        var embankMat = makeMaterial(0x9090A0);
        var embank = new THREE.Mesh(embankGeo, embankMat);
        embank.position.set(X_OFFSET, 1.5, -10);
        addMesh(embank);

        // Bankside ground plane
        var groundGeo = new THREE.BoxGeometry(300, 0.5, 120);
        var groundMat = makeMaterial(0x706050);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(X_OFFSET, -0.25, -70);
        addMesh(ground);

        // River surface suggestion
        var riverGeo = new THREE.BoxGeometry(300, 0.3, 40);
        var riverMat = makeMaterial(0x2F5F8F);
        var river = new THREE.Mesh(riverGeo, riverMat);
        river.position.set(X_OFFSET, 0.15, 15);
        addMesh(river);

        // Bankside street
        var streetGeo = new THREE.BoxGeometry(300, 0.3, 8);
        var streetMat = makeMaterial(0x555555);
        var street = new THREE.Mesh(streetGeo, streetMat);
        street.position.set(X_OFFSET, 0.15, -18);
        addMesh(street);

        // General Bankside warehouse buildings (background fill)
        var warehouseData = [
            { dx: -110, w: 30, h: 14, z: -60 },
            { dx: -75,  w: 20, h: 10, z: -58 },
            { dx: 110,  w: 25, h: 16, z: -60 },
            { dx: 140,  w: 18, h: 12, z: -58 }
        ];

        for (var ww = 0; ww < warehouseData.length; ww++) {
            var wd = warehouseData[ww];
            var wGeo = new THREE.BoxGeometry(wd.w, wd.h, 18);
            var wMat = makeMaterial(0x8A6050);
            var wMesh = new THREE.Mesh(wGeo, wMat);
            wMesh.position.set(X_OFFSET + wd.dx, wd.h / 2, wd.z);
            addMesh(wMesh);
        }
    }

    function build() {
        buildBanksideContext();
        buildTateModern();
        buildGlobeTheatre();
        buildSouthwarkBridge();
        buildCardinalsWharf();
        buildMillenniumBridge();
    }

    function update(delta) {
        // Static environment - no animation needed
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
