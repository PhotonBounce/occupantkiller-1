window.CrystalPalacePark = (function() {
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

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildPalaceRuins();
        buildTransmitterTower();
        buildDinosaurSculptures();
        buildNationalSportsCentre();
        buildTerracedGardens();
    }

    function buildPalaceRuins() {
        var ox = 11040;
        var oz = 0;

        // Ground footprint slab — ghost outline of the glass palace
        var footprintGeo = new THREE.BoxGeometry(280, 0.4, 80);
        var footprintMat = makeMaterial(0x8899aa);
        var footprint = new THREE.Mesh(footprintGeo, footprintMat);
        footprint.position.set(ox, 0.2, oz);
        addMesh(footprint);

        // Iron column stumps along the nave — two rows
        var columnMat = makeMaterial(0x556677);
        var columnPositionsZ = [-30, -20, -10, 0, 10, 20, 30];
        for (var i = 0; i < columnPositionsZ.length; i++) {
            // Left row
            var colGeoL = new THREE.CylinderGeometry(0.5, 0.6, 3, 8);
            var colL = new THREE.Mesh(colGeoL, columnMat);
            colL.position.set(ox - 120, 1.5, oz + columnPositionsZ[i]);
            addMesh(colL);
            // Right row
            var colGeoR = new THREE.CylinderGeometry(0.5, 0.6, 3, 8);
            var colR = new THREE.Mesh(colGeoR, columnMat);
            colR.position.set(ox + 120, 1.5, oz + columnPositionsZ[i]);
            addMesh(colR);
            // Inner left row
            var colGeoIL = new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8);
            var colIL = new THREE.Mesh(colGeoIL, columnMat);
            colIL.position.set(ox - 60, 1.25, oz + columnPositionsZ[i]);
            addMesh(colIL);
            // Inner right row
            var colGeoIR = new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8);
            var colIR = new THREE.Mesh(colGeoIR, columnMat);
            colIR.position.set(ox + 60, 1.25, oz + columnPositionsZ[i]);
            addMesh(colIR);
        }

        // Surviving stone terrace steps — three tiers at the north end
        var stepMat = makeMaterial(0xc8bfaa);
        for (var s = 0; s < 5; s++) {
            var stepGeo = new THREE.BoxGeometry(200 - s * 10, 0.6, 4);
            var step = new THREE.Mesh(stepGeo, stepMat);
            step.position.set(ox, 0.3 + s * 0.6, oz - 45 - s * 4);
            addMesh(step);
        }
        // South terrace steps
        for (var ss = 0; ss < 5; ss++) {
            var stepGeoS = new THREE.BoxGeometry(200 - ss * 10, 0.6, 4);
            var stepS = new THREE.Mesh(stepGeoS, stepMat);
            stepS.position.set(ox, 0.3 + ss * 0.6, oz + 45 + ss * 4);
            addMesh(stepS);
        }

        // Bronze sphinx statues at entrance (simplified box + cone head)
        var sphinxMat = makeMaterial(0x8b7355);
        var sphinxPositions = [
            [ox - 150, oz - 42],
            [ox + 150, oz - 42],
            [ox - 150, oz + 42],
            [ox + 150, oz + 42]
        ];
        for (var sp = 0; sp < sphinxPositions.length; sp++) {
            var sphinxBody = new THREE.BoxGeometry(5, 3, 8);
            var sphinxMesh = new THREE.Mesh(sphinxBody, sphinxMat);
            sphinxMesh.position.set(sphinxPositions[sp][0], 1.5, sphinxPositions[sp][1]);
            addMesh(sphinxMesh);
            var sphinxHead = new THREE.SphereGeometry(1.2, 8, 6);
            var sphinxHeadMesh = new THREE.Mesh(sphinxHead, sphinxMat);
            sphinxHeadMesh.position.set(sphinxPositions[sp][0], 3.8, sphinxPositions[sp][1] - 3.5);
            addMesh(sphinxHeadMesh);
        }
    }

    function buildTransmitterTower() {
        var ox = 11040;
        var oz = -200;
        var towerHeight = 50;
        var towerBase = 8;

        // Lattice tower using LineSegments
        var towerVerts = [];
        var segments = 10;
        var segH = towerHeight / segments;
        for (var i = 0; i < segments; i++) {
            var y0 = i * segH;
            var y1 = (i + 1) * segH;
            var t0 = 1 - i / segments;
            var t1 = 1 - (i + 1) / segments;
            var w0 = towerBase * t0 * 0.5;
            var w1 = towerBase * t1 * 0.5;

            // Four vertical legs
            towerVerts.push(ox - w0, y0, oz - w0, ox - w1, y1, oz - w1);
            towerVerts.push(ox + w0, y0, oz - w0, ox + w1, y1, oz - w1);
            towerVerts.push(ox - w0, y0, oz + w0, ox - w1, y1, oz + w1);
            towerVerts.push(ox + w0, y0, oz + w0, ox + w1, y1, oz + w1);

            // Horizontal ring at bottom of each segment
            towerVerts.push(ox - w0, y0, oz - w0, ox + w0, y0, oz - w0);
            towerVerts.push(ox + w0, y0, oz - w0, ox + w0, y0, oz + w0);
            towerVerts.push(ox + w0, y0, oz + w0, ox - w0, y0, oz + w0);
            towerVerts.push(ox - w0, y0, oz + w0, ox - w0, y0, oz - w0);

            // Diagonal cross braces on each face
            towerVerts.push(ox - w0, y0, oz - w0, ox + w1, y1, oz - w1);
            towerVerts.push(ox + w0, y0, oz - w0, ox - w1, y1, oz - w1);
            towerVerts.push(ox + w0, y0, oz - w0, ox + w1, y1, oz + w1);
            towerVerts.push(ox + w0, y0, oz + w0, ox + w1, y1, oz - w1);
            towerVerts.push(ox + w0, y0, oz + w0, ox - w1, y1, oz + w1);
            towerVerts.push(ox - w0, y0, oz + w0, ox + w1, y1, oz + w1);
            towerVerts.push(ox - w0, y0, oz - w0, ox - w1, y1, oz + w1);
            towerVerts.push(ox - w0, y0, oz + w0, ox - w1, y1, oz - w1);
        }

        var towerGeo = new THREE.BufferGeometry();
        towerGeo.setAttribute('position', new THREE.Float32BufferAttribute(towerVerts, 3));
        var towerMat = new THREE.LineBasicMaterial({ color: 0xcc3300 });
        var towerLines = new THREE.LineSegments(towerGeo, towerMat);
        scene.add(towerLines);
        objects.push(towerLines);

        // Antenna mast at top
        var antGeo = new THREE.CylinderGeometry(0.15, 0.25, 12, 6);
        var antMat = new THREE.MeshLambertMaterial({ color: 0xcc3300 });
        var ant = new THREE.Mesh(antGeo, antMat);
        ant.position.set(ox, towerHeight + 6, oz);
        scene.add(ant);
        objects.push(ant);

        // Antenna dish
        var dishGeo = new THREE.CylinderGeometry(2, 0.3, 1, 8);
        var dishMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
        var dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(ox, towerHeight + 11, oz);
        scene.add(dish);
        objects.push(dish);

        // Guy wire cables as LineSegments
        var guyVerts = [];
        var guyAnchorY = towerHeight * 0.6;
        var guyAnchorW = towerBase * 0.5 * (1 - 0.6);
        var guyRadius = 30;
        var guyAnchors = [
            [ox + guyRadius, 0, oz],
            [ox - guyRadius, 0, oz],
            [ox, 0, oz + guyRadius],
            [ox, 0, oz - guyRadius]
        ];
        for (var g = 0; g < guyAnchors.length; g++) {
            guyVerts.push(ox, guyAnchorY, oz,
                guyAnchors[g][0], guyAnchors[g][1], guyAnchors[g][2]);
        }
        var guyGeo = new THREE.BufferGeometry();
        guyGeo.setAttribute('position', new THREE.Float32BufferAttribute(guyVerts, 3));
        var guyMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var guyLines = new THREE.LineSegments(guyGeo, guyMat);
        scene.add(guyLines);
        objects.push(guyLines);

        // Tower base concrete footings
        var footMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var footPositions = [
            [ox - 4, oz - 4],
            [ox + 4, oz - 4],
            [ox - 4, oz + 4],
            [ox + 4, oz + 4]
        ];
        for (var f = 0; f < footPositions.length; f++) {
            var footGeo = new THREE.BoxGeometry(2, 1, 2);
            var footMesh = new THREE.Mesh(footGeo, footMat);
            footMesh.position.set(footPositions[f][0], 0.5, footPositions[f][1]);
            scene.add(footMesh);
            objects.push(footMesh);
        }
    }

    function buildDinosaurSculptures() {
        var ox = 11040;

        // Island lake — blue water surface
        var lakeMat = new THREE.MeshLambertMaterial({ color: 0x1a6b8a });
        var lakeGeo = new THREE.BoxGeometry(60, 0.3, 40);
        var lake = new THREE.Mesh(lakeGeo, lakeMat);
        lake.position.set(ox + 180, 0.15, 120);
        scene.add(lake);
        objects.push(lake);

        // Lake island
        var islandMat = new THREE.MeshLambertMaterial({ color: 0x5a7a3a });
        var islandGeo = new THREE.BoxGeometry(20, 0.5, 16);
        var island = new THREE.Mesh(islandGeo, islandMat);
        island.position.set(ox + 180, 0.4, 120);
        scene.add(island);
        objects.push(island);

        // Iguanodon — box body with cylinder neck and sphere head
        var dinoMat = new THREE.MeshLambertMaterial({ color: 0x7a8a6a });
        // Body
        var iguBodyGeo = new THREE.BoxGeometry(7, 4, 4);
        var iguBody = new THREE.Mesh(iguBodyGeo, dinoMat);
        iguBody.position.set(ox + 175, 2.5, 115);
        scene.add(iguBody);
        objects.push(iguBody);
        // Neck
        var iguNeckGeo = new THREE.CylinderGeometry(0.7, 1.0, 4, 8);
        var iguNeck = new THREE.Mesh(iguNeckGeo, dinoMat);
        iguNeck.position.set(ox + 172, 5.5, 115);
        iguNeck.rotation.z = 0.4;
        scene.add(iguNeck);
        objects.push(iguNeck);
        // Head
        var iguHeadGeo = new THREE.BoxGeometry(2.5, 1.8, 1.8);
        var iguHead = new THREE.Mesh(iguHeadGeo, dinoMat);
        iguHead.position.set(ox + 170, 7.8, 115);
        scene.add(iguHead);
        objects.push(iguHead);
        // Tail
        var iguTailGeo = new THREE.ConeGeometry(0.8, 5, 6);
        var iguTail = new THREE.Mesh(iguTailGeo, dinoMat);
        iguTail.rotation.z = -Math.PI / 2;
        iguTail.position.set(ox + 181, 2.2, 115);
        scene.add(iguTail);
        objects.push(iguTail);
        // Legs
        var iguLegMat = new THREE.MeshLambertMaterial({ color: 0x6a7a5a });
        var legPositions = [
            [ox + 173, 115 - 1.5],
            [ox + 173, 115 + 1.5],
            [ox + 178, 115 - 1.5],
            [ox + 178, 115 + 1.5]
        ];
        for (var li = 0; li < legPositions.length; li++) {
            var legGeo = new THREE.CylinderGeometry(0.5, 0.6, 2.5, 6);
            var legMesh = new THREE.Mesh(legGeo, iguLegMat);
            legMesh.position.set(legPositions[li][0], 1.0, legPositions[li][1]);
            scene.add(legMesh);
            objects.push(legMesh);
        }

        // Megalosaurus — larger carnivore, box body, cone head
        var megaMat = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
        var megaBodyGeo = new THREE.BoxGeometry(8, 3.5, 3.5);
        var megaBody = new THREE.Mesh(megaBodyGeo, megaMat);
        megaBody.position.set(ox + 185, 3.0, 125);
        scene.add(megaBody);
        objects.push(megaBody);
        // Megalosaurus head/snout
        var megaHeadGeo = new THREE.BoxGeometry(3, 1.8, 2);
        var megaHead = new THREE.Mesh(megaHeadGeo, megaMat);
        megaHead.position.set(ox + 180, 4.5, 125);
        scene.add(megaHead);
        objects.push(megaHead);
        // Megalosaurus tail
        var megaTailGeo = new THREE.ConeGeometry(1.0, 6, 6);
        var megaTail = new THREE.Mesh(megaTailGeo, megaMat);
        megaTail.rotation.z = -Math.PI / 2;
        megaTail.position.set(ox + 192, 2.8, 125);
        scene.add(megaTail);
        objects.push(megaTail);
        // Megalosaurus hind legs (large)
        var megaLegMat = new THREE.MeshLambertMaterial({ color: 0x7a6a4a });
        var megaLegPos = [
            [ox + 183, 125 - 1.5],
            [ox + 183, 125 + 1.5],
            [ox + 188, 125 - 1.5],
            [ox + 188, 125 + 1.5]
        ];
        for (var ml = 0; ml < megaLegPos.length; ml++) {
            var megaLegGeo = new THREE.CylinderGeometry(0.6, 0.7, 2.8, 6);
            var megaLegMesh = new THREE.Mesh(megaLegGeo, megaLegMat);
            megaLegMesh.position.set(megaLegPos[ml][0], 1.1, megaLegPos[ml][1]);
            scene.add(megaLegMesh);
            objects.push(megaLegMesh);
        }

        // Plesiosaurus — in the water, long neck aquatic creature
        var plesiMat = new THREE.MeshLambertMaterial({ color: 0x4a6a7a });
        var plesiBodyGeo = new THREE.BoxGeometry(6, 2, 3);
        var plesiBody = new THREE.Mesh(plesiBodyGeo, plesiMat);
        plesiBody.position.set(ox + 180, 0.6, 120);
        scene.add(plesiBody);
        objects.push(plesiBody);
        // Long neck
        var plesiNeckGeo = new THREE.CylinderGeometry(0.4, 0.8, 5, 8);
        var plesiNeck = new THREE.Mesh(plesiNeckGeo, plesiMat);
        plesiNeck.rotation.z = 0.6;
        plesiNeck.position.set(ox + 177, 3.5, 120);
        scene.add(plesiNeck);
        objects.push(plesiNeck);
        // Plesi head
        var plesiHeadGeo = new THREE.SphereGeometry(0.7, 8, 6);
        var plesiHead = new THREE.Mesh(plesiHeadGeo, plesiMat);
        plesiHead.position.set(ox + 175, 5.8, 120);
        scene.add(plesiHead);
        objects.push(plesiHead);
        // Flippers
        var flipperMat = new THREE.MeshLambertMaterial({ color: 0x3a5a6a });
        var flipperPositions = [
            [ox + 179, 120 - 2.5],
            [ox + 179, 120 + 2.5],
            [ox + 182, 120 - 2.5],
            [ox + 182, 120 + 2.5]
        ];
        for (var fp = 0; fp < flipperPositions.length; fp++) {
            var flipperGeo = new THREE.BoxGeometry(2.5, 0.4, 1.2);
            var flipperMesh = new THREE.Mesh(flipperGeo, flipperMat);
            flipperMesh.position.set(flipperPositions[fp][0], 0.5, flipperPositions[fp][1]);
            scene.add(flipperMesh);
            objects.push(flipperMesh);
        }
    }

    function buildNationalSportsCentre() {
        var ox = 11040;
        var oz = 80;

        // Main stadium building — 1960s brutalist concrete box
        var stadiumMat = new THREE.MeshLambertMaterial({ color: 0xb0a898 });
        var stadiumGeo = new THREE.BoxGeometry(100, 12, 60);
        var stadium = new THREE.Mesh(stadiumGeo, stadiumMat);
        stadium.position.set(ox - 80, 6, oz);
        scene.add(stadium);
        objects.push(stadium);

        // Roof cantilever overhang
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x9a9288 });
        var roofGeo = new THREE.BoxGeometry(110, 1.5, 70);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(ox - 80, 12.8, oz);
        scene.add(roof);
        objects.push(roof);

        // Running track outline — flat oval approximated with boxes
        var trackMat = new THREE.MeshLambertMaterial({ color: 0xcc4422 });
        // Long straight sides
        var trackSideGeo1 = new THREE.BoxGeometry(60, 0.1, 4);
        var trackSide1 = new THREE.Mesh(trackSideGeo1, trackMat);
        trackSide1.position.set(ox + 40, 0.1, oz - 18);
        scene.add(trackSide1);
        objects.push(trackSide1);

        var trackSide2 = new THREE.Mesh(trackSideGeo1.clone(), trackMat);
        trackSide2.position.set(ox + 40, 0.1, oz + 18);
        scene.add(trackSide2);
        objects.push(trackSide2);

        // Short curved ends (approximated as boxes)
        var trackEndGeo = new THREE.BoxGeometry(4, 0.1, 36);
        var trackEnd1 = new THREE.Mesh(trackEndGeo, trackMat);
        trackEnd1.position.set(ox + 10, 0.1, oz);
        scene.add(trackEnd1);
        objects.push(trackEnd1);

        var trackEnd2 = new THREE.Mesh(trackEndGeo.clone(), trackMat);
        trackEnd2.position.set(ox + 70, 0.1, oz);
        scene.add(trackEnd2);
        objects.push(trackEnd2);

        // Infield grass
        var infieldMat = new THREE.MeshLambertMaterial({ color: 0x3a7a3a });
        var infieldGeo = new THREE.BoxGeometry(60, 0.15, 32);
        var infield = new THREE.Mesh(infieldGeo, infieldMat);
        infield.position.set(ox + 40, 0.08, oz);
        scene.add(infield);
        objects.push(infield);

        // Spectator stands — tiered seating boxes on each long side
        var standMat = new THREE.MeshLambertMaterial({ color: 0xaaa090 });
        for (var row = 0; row < 4; row++) {
            var standGeoN = new THREE.BoxGeometry(60, 2.5, 6);
            var standN = new THREE.Mesh(standGeoN, standMat);
            standN.position.set(ox + 40, 1.25 + row * 2.5, oz - 25 - row * 5);
            scene.add(standN);
            objects.push(standN);

            var standS = new THREE.Mesh(standGeoN.clone(), standMat);
            standS.position.set(ox + 40, 1.25 + row * 2.5, oz + 25 + row * 5);
            scene.add(standS);
            objects.push(standS);
        }

        // Floodlight pylons
        var pylonMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var pylonPositions = [
            [ox + 10, oz - 42],
            [ox + 70, oz - 42],
            [ox + 10, oz + 42],
            [ox + 70, oz + 42]
        ];
        for (var py = 0; py < pylonPositions.length; py++) {
            var pylonGeo = new THREE.CylinderGeometry(0.3, 0.5, 18, 6);
            var pylon = new THREE.Mesh(pylonGeo, pylonMat);
            pylon.position.set(pylonPositions[py][0], 9, pylonPositions[py][1]);
            scene.add(pylon);
            objects.push(pylon);

            var lightBarGeo = new THREE.BoxGeometry(6, 0.5, 0.5);
            var lightBarMat = new THREE.MeshLambertMaterial({ color: 0xffee88 });
            var lightBar = new THREE.Mesh(lightBarGeo, lightBarMat);
            lightBar.position.set(pylonPositions[py][0], 18.3, pylonPositions[py][1]);
            scene.add(lightBar);
            objects.push(lightBar);
        }
    }

    function buildTerracedGardens() {
        var ox = 11040;

        // Main terrace ground levels descending down the hill
        var terraceMat = new THREE.MeshLambertMaterial({ color: 0xd4c9a8 });
        var grassMat = new THREE.MeshLambertMaterial({ color: 0x4a8a4a });
        var balustradeMat = new THREE.MeshLambertMaterial({ color: 0xe8dfc8 });

        for (var t = 0; t < 6; t++) {
            var terH = 0.8;
            var terY = t * 1.8;
            var terZ = 160 + t * 20;

            // Terrace paving platform
            var terGeo = new THREE.BoxGeometry(160, terH, 16);
            var ter = new THREE.Mesh(terGeo, terraceMat);
            ter.position.set(ox, terY + terH / 2, terZ);
            scene.add(ter);
            objects.push(ter);

            // Grass panel behind each terrace
            var grassGeo = new THREE.BoxGeometry(150, 0.2, 12);
            var grass = new THREE.Mesh(grassGeo, grassMat);
            grass.position.set(ox, terY + terH, terZ + 14);
            scene.add(grass);
            objects.push(grass);

            // Stone balustrade along front edge — series of pillars
            for (var b = -7; b <= 7; b++) {
                var balGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.2, 6);
                var bal = new THREE.Mesh(balGeo, balustradeMat);
                bal.position.set(ox + b * 10, terY + terH + 0.6, terZ - 6);
                scene.add(bal);
                objects.push(bal);
            }

            // Balustrade top rail
            var railGeo = new THREE.BoxGeometry(160, 0.3, 0.6);
            var rail = new THREE.Mesh(railGeo, balustradeMat);
            rail.position.set(ox, terY + terH + 1.35, terZ - 6);
            scene.add(rail);
            objects.push(rail);
        }

        // Central fountain basin
        var basinMat = new THREE.MeshLambertMaterial({ color: 0xccbbaa });
        var basinGeo = new THREE.CylinderGeometry(8, 9, 0.8, 12);
        var basin = new THREE.Mesh(basinGeo, basinMat);
        basin.position.set(ox, 0.4, 155);
        scene.add(basin);
        objects.push(basin);

        // Fountain water
        var fountainWaterMat = new THREE.MeshLambertMaterial({ color: 0x4488bb });
        var fountainWaterGeo = new THREE.CylinderGeometry(7, 7, 0.3, 12);
        var fountainWater = new THREE.Mesh(fountainWaterGeo, fountainWaterMat);
        fountainWater.position.set(ox, 0.65, 155);
        scene.add(fountainWater);
        objects.push(fountainWater);

        // Fountain central column
        var fountainColGeo = new THREE.CylinderGeometry(0.4, 0.6, 3, 8);
        var fountainColMat = new THREE.MeshLambertMaterial({ color: 0xd8c8a8 });
        var fountainCol = new THREE.Mesh(fountainColGeo, fountainColMat);
        fountainCol.position.set(ox, 2.3, 155);
        scene.add(fountainCol);
        objects.push(fountainCol);

        // Fountain top bowl
        var fountainBowlGeo = new THREE.CylinderGeometry(2, 0.5, 0.5, 10);
        var fountainBowl = new THREE.Mesh(fountainBowlGeo, basinMat);
        fountainBowl.position.set(ox, 3.8, 155);
        scene.add(fountainBowl);
        objects.push(fountainBowl);

        // Ornamental flower beds — coloured box patches
        var bedMat1 = new THREE.MeshLambertMaterial({ color: 0xdd4466 });
        var bedMat2 = new THREE.MeshLambertMaterial({ color: 0xddaa22 });
        var bedMat3 = new THREE.MeshLambertMaterial({ color: 0x8844cc });
        var bedMats = [bedMat1, bedMat2, bedMat3];
        var bedZones = [168, 188, 208, 228];
        for (var bz = 0; bz < bedZones.length; bz++) {
            for (var bx = -3; bx <= 3; bx++) {
                var bedGeo = new THREE.BoxGeometry(6, 0.4, 4);
                var bed = new THREE.Mesh(bedGeo, bedMats[Math.abs(bx + bz) % 3]);
                bed.position.set(ox + bx * 14, bz * 1.8 + 0.3, bedZones[bz]);
                scene.add(bed);
                objects.push(bed);
            }
        }

        // Stone urns on terrace corners
        var urnMat = new THREE.MeshLambertMaterial({ color: 0xc8bfaa });
        var urnZones = [160, 180, 200, 220];
        for (var uz = 0; uz < urnZones.length; uz++) {
            var urnXs = [ox - 75, ox + 75];
            for (var ux = 0; ux < urnXs.length; ux++) {
                var urnStemGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.0, 8);
                var urnStem = new THREE.Mesh(urnStemGeo, urnMat);
                urnStem.position.set(urnXs[ux], uz * 1.8 + 0.5, urnZones[uz] - 6);
                scene.add(urnStem);
                objects.push(urnStem);

                var urnBowlGeo = new THREE.CylinderGeometry(0.7, 0.3, 0.8, 8);
                var urnBowl = new THREE.Mesh(urnBowlGeo, urnMat);
                urnBowl.position.set(urnXs[ux], uz * 1.8 + 1.4, urnZones[uz] - 6);
                scene.add(urnBowl);
                objects.push(urnBowl);
            }
        }
    }

    function update(delta) {
        // No animated elements
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
