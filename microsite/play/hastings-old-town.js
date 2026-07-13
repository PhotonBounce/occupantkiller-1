window.HastingsOldTown = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10440;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildCastleRuins() {
        var clifftopY = 60;
        var wallMat = makeMaterial(0x8B7355);
        var stoneMat = makeMaterial(0x9E8B6E);

        // West Hill backdrop cliff
        var hillGeo = new THREE.BoxGeometry(120, 80, 40);
        var hillMesh = new THREE.Mesh(hillGeo, makeMaterial(0x4A6741));
        hillMesh.position.set(X_OFFSET - 60, clifftopY - 20, -80);
        addMesh(hillMesh);

        // Main castle platform / curtain wall base
        var baseGeo = new THREE.BoxGeometry(80, 8, 60);
        var baseMesh = new THREE.Mesh(baseGeo, stoneMat);
        baseMesh.position.set(X_OFFSET, clifftopY, -60);
        addMesh(baseMesh);

        // North wall (standing ruin)
        var wallNGeo = new THREE.BoxGeometry(80, 28, 4);
        var wallNMesh = new THREE.Mesh(wallNGeo, wallMat);
        wallNMesh.position.set(X_OFFSET, clifftopY + 18, -88);
        addMesh(wallNMesh);

        // South wall (partial ruin)
        var wallSGeo = new THREE.BoxGeometry(50, 16, 4);
        var wallSMesh = new THREE.Mesh(wallSGeo, wallMat);
        wallSMesh.position.set(X_OFFSET - 10, clifftopY + 12, -32);
        addMesh(wallSMesh);

        // East wall
        var wallEGeo = new THREE.BoxGeometry(4, 22, 60);
        var wallEMesh = new THREE.Mesh(wallEGeo, wallMat);
        wallEMesh.position.set(X_OFFSET + 40, clifftopY + 15, -60);
        addMesh(wallEMesh);

        // West wall (ruined, shorter)
        var wallWGeo = new THREE.BoxGeometry(4, 14, 60);
        var wallWMesh = new THREE.Mesh(wallWGeo, wallMat);
        wallWMesh.position.set(X_OFFSET - 40, clifftopY + 11, -60);
        addMesh(wallWMesh);

        // Corner tower NE
        var towerNEGeo = new THREE.CylinderGeometry(6, 7, 36, 8);
        var towerNEMesh = new THREE.Mesh(towerNEGeo, stoneMat);
        towerNEMesh.position.set(X_OFFSET + 38, clifftopY + 22, -86);
        addMesh(towerNEMesh);

        // Corner tower NW (ruined, shorter)
        var towerNWGeo = new THREE.CylinderGeometry(5, 6, 20, 8);
        var towerNWMesh = new THREE.Mesh(towerNWGeo, stoneMat);
        towerNWMesh.position.set(X_OFFSET - 38, clifftopY + 14, -86);
        addMesh(towerNWMesh);

        // Arch window left post
        var archL1Geo = new THREE.BoxGeometry(3, 12, 2);
        var archL1Mesh = new THREE.Mesh(archL1Geo, makeMaterial(0x5C4A32));
        archL1Mesh.position.set(X_OFFSET - 10, clifftopY + 18, -87);
        addMesh(archL1Mesh);

        // Arch window right post
        var archR1Geo = new THREE.BoxGeometry(3, 12, 2);
        var archR1Mesh = new THREE.Mesh(archR1Geo, makeMaterial(0x5C4A32));
        archR1Mesh.position.set(X_OFFSET - 2, clifftopY + 18, -87);
        addMesh(archR1Mesh);

        // Arch window lintel
        var archT1Geo = new THREE.BoxGeometry(11, 3, 2);
        var archT1Mesh = new THREE.Mesh(archT1Geo, makeMaterial(0x5C4A32));
        archT1Mesh.position.set(X_OFFSET - 6, clifftopY + 25, -87);
        addMesh(archT1Mesh);

        // Second arch
        var archL2Geo = new THREE.BoxGeometry(3, 12, 2);
        var archL2Mesh = new THREE.Mesh(archL2Geo, makeMaterial(0x5C4A32));
        archL2Mesh.position.set(X_OFFSET + 6, clifftopY + 18, -87);
        addMesh(archL2Mesh);

        var archR2Geo = new THREE.BoxGeometry(3, 12, 2);
        var archR2Mesh = new THREE.Mesh(archR2Geo, makeMaterial(0x5C4A32));
        archR2Mesh.position.set(X_OFFSET + 14, clifftopY + 18, -87);
        addMesh(archR2Mesh);

        var archT2Geo = new THREE.BoxGeometry(11, 3, 2);
        var archT2Mesh = new THREE.Mesh(archT2Geo, makeMaterial(0x5C4A32));
        archT2Mesh.position.set(X_OFFSET + 10, clifftopY + 25, -87);
        addMesh(archT2Mesh);

        // Rubble pile
        var rubble1Geo = new THREE.BoxGeometry(12, 4, 10);
        var rubble1Mesh = new THREE.Mesh(rubble1Geo, stoneMat);
        rubble1Mesh.position.set(X_OFFSET + 20, clifftopY + 6, -50);
        rubble1Mesh.rotation.y = 0.3;
        addMesh(rubble1Mesh);

        var rubble2Geo = new THREE.BoxGeometry(8, 3, 6);
        var rubble2Mesh = new THREE.Mesh(rubble2Geo, stoneMat);
        rubble2Mesh.position.set(X_OFFSET - 20, clifftopY + 5, -55);
        rubble2Mesh.rotation.y = -0.5;
        addMesh(rubble2Mesh);
    }

    function buildNetShops() {
        var shedMat = makeMaterial(0x1A1A1A);
        var roofMat = makeMaterial(0x0D0D0D);
        var positions = [
            [0, 0], [6, 0], [12, 0], [18, 0],
            [0, 8], [6, 8], [12, 8], [18, 8]
        ];

        for (var i = 0; i < positions.length; i++) {
            var px = X_OFFSET + 20 + positions[i][0];
            var pz = 20 + positions[i][1];

            // Main shed body — very tall, narrow
            var bodyGeo = new THREE.BoxGeometry(2, 12, 2);
            var bodyMesh = new THREE.Mesh(bodyGeo, shedMat);
            bodyMesh.position.set(px, 6, pz);
            addMesh(bodyMesh);

            // Pointed roof
            var roofGeo = new THREE.ConeGeometry(1.8, 3, 4);
            var roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.position.set(px, 13.5, pz);
            roofMesh.rotation.y = Math.PI / 4;
            addMesh(roofMesh);

            // Door
            var doorGeo = new THREE.BoxGeometry(0.8, 2, 0.1);
            var doorMesh = new THREE.Mesh(doorGeo, makeMaterial(0x2B1A0A));
            doorMesh.position.set(px, 1, pz - 1.05);
            addMesh(doorMesh);
        }

        // Ground planks between sheds
        var groundGeo = new THREE.BoxGeometry(26, 0.2, 18);
        var groundMesh = new THREE.Mesh(groundGeo, makeMaterial(0x3D2B1A));
        groundMesh.position.set(X_OFFSET + 29, 0, 28);
        addMesh(groundMesh);
    }

    function buildFishingBeach() {
        // Beach surface
        var beachGeo = new THREE.BoxGeometry(200, 1, 40);
        var beachMesh = new THREE.Mesh(beachGeo, makeMaterial(0xC2A96A));
        beachMesh.position.set(X_OFFSET, -0.5, 60);
        addMesh(beachMesh);

        // Fishing boats — box hulls with color variety
        var boatColors = [0xCC3333, 0x3366CC, 0x22AA44, 0xCC8800, 0x9933CC, 0x22BBBB];
        var boatPositions = [
            [-60, 50], [-40, 55], [-20, 52], [0, 58], [20, 50], [40, 55]
        ];

        for (var b = 0; b < boatPositions.length; b++) {
            var bx = X_OFFSET + boatPositions[b][0];
            var bz = boatPositions[b][1];
            var bColor = boatColors[b % boatColors.length];

            // Hull
            var hullGeo = new THREE.BoxGeometry(10, 3, 4);
            var hullMesh = new THREE.Mesh(hullGeo, makeMaterial(bColor));
            hullMesh.position.set(bx, 1.5, bz);
            addMesh(hullMesh);

            // Cabin
            var cabinGeo = new THREE.BoxGeometry(4, 3, 3);
            var cabinMesh = new THREE.Mesh(cabinGeo, makeMaterial(0xEEEECC));
            cabinMesh.position.set(bx + 2, 4.5, bz);
            addMesh(cabinMesh);

            // Mast
            var mastGeo = new THREE.CylinderGeometry(0.15, 0.2, 10, 6);
            var mastMesh = new THREE.Mesh(mastGeo, makeMaterial(0x8B6914));
            mastMesh.position.set(bx - 2, 8, bz);
            addMesh(mastMesh);
        }

        // Capstans (winches)
        var capstanPositions = [[-70, 62], [-50, 65], [-30, 62], [10, 65]];
        for (var c = 0; c < capstanPositions.length; c++) {
            var cx = X_OFFSET + capstanPositions[c][0];
            var cz = capstanPositions[c][1];

            var capGeo = new THREE.CylinderGeometry(1, 1.3, 2.5, 8);
            var capMesh = new THREE.Mesh(capGeo, makeMaterial(0x5C3A1E));
            capMesh.position.set(cx, 1.25, cz);
            addMesh(capMesh);

            // Capstan top
            var capTopGeo = new THREE.CylinderGeometry(1.4, 1, 0.5, 8);
            var capTopMesh = new THREE.Mesh(capTopGeo, makeMaterial(0x4A2E10));
            capTopMesh.position.set(cx, 2.75, cz);
            addMesh(capTopMesh);
        }

        // Coiled rope piles
        var ropePositions = [[-65, 68], [-45, 70], [5, 68], [25, 71]];
        for (var r = 0; r < ropePositions.length; r++) {
            var rx = X_OFFSET + ropePositions[r][0];
            var rz = ropePositions[r][1];

            var ropeGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 12);
            var ropeMesh = new THREE.Mesh(ropeGeo, makeMaterial(0xC8A050));
            ropeMesh.position.set(rx, 0.4, rz);
            addMesh(ropeMesh);

            var ropeTopGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.5, 12);
            var ropeTopMesh = new THREE.Mesh(ropeTopGeo, makeMaterial(0xB89040));
            ropeTopMesh.position.set(rx, 1.05, rz);
            addMesh(ropeTopMesh);
        }

        // Fish crates stacked
        var crateGeo = new THREE.BoxGeometry(2, 1, 1.5);
        var crateMat = makeMaterial(0x8B6914);
        for (var cr = 0; cr < 6; cr++) {
            var crMesh = new THREE.Mesh(crateGeo, crateMat);
            crMesh.position.set(X_OFFSET + 60 + (cr % 3) * 2.5, 0.5 + Math.floor(cr / 3), 65);
            addMesh(crMesh);
        }
    }

    function buildRockANoreRoad() {
        // Road surface
        var roadGeo = new THREE.BoxGeometry(200, 0.3, 12);
        var roadMesh = new THREE.Mesh(roadGeo, makeMaterial(0x555555));
        roadMesh.position.set(X_OFFSET, 0.15, 10);
        addMesh(roadMesh);

        // Seafront building row
        var buildingData = [
            { x: -80, w: 18, h: 12, d: 10, color: 0xE8D5B0 },
            { x: -56, w: 14, h: 16, d: 10, color: 0xCCBFA0 },
            { x: -38, w: 12, h: 10, d: 10, color: 0xDDCCAA },
            { x: -22, w: 20, h: 14, d: 12, color: 0xE0D0B8 },
            { x: 4,   w: 16, h: 12, d: 10, color: 0xD5C5A5 },
            { x: 24,  w: 14, h: 18, d: 10, color: 0xBBAA90 },
            { x: 42,  w: 18, h: 12, d: 10, color: 0xE8D8B8 },
            { x: 64,  w: 20, h: 15, d: 12, color: 0xD8C8A8 }
        ];

        for (var bd = 0; bd < buildingData.length; bd++) {
            var bld = buildingData[bd];
            var bldGeo = new THREE.BoxGeometry(bld.w, bld.h, bld.d);
            var bldMesh = new THREE.Mesh(bldGeo, makeMaterial(bld.color));
            bldMesh.position.set(X_OFFSET + bld.x, bld.h / 2, 5);
            addMesh(bldMesh);

            // Roof
            var bldRoofGeo = new THREE.BoxGeometry(bld.w + 1, 1.5, bld.d + 1);
            var bldRoofMesh = new THREE.Mesh(bldRoofGeo, makeMaterial(0x884422));
            bldRoofMesh.position.set(X_OFFSET + bld.x, bld.h + 0.75, 5);
            addMesh(bldRoofMesh);
        }

        // Aquarium dome — Hastings Rock-a-Nore aquarium
        var aquaBaseGeo = new THREE.CylinderGeometry(12, 13, 8, 16);
        var aquaBaseMesh = new THREE.Mesh(aquaBaseGeo, makeMaterial(0x336688));
        aquaBaseMesh.position.set(X_OFFSET + 80, 4, 5);
        addMesh(aquaBaseMesh);

        var aquaDomeGeo = new THREE.SphereGeometry(12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        var aquaDomeMesh = new THREE.Mesh(aquaDomeGeo, makeMaterial(0x44AACC));
        aquaDomeMesh.position.set(X_OFFSET + 80, 8, 5);
        addMesh(aquaDomeMesh);

        // Aquarium entrance pillars
        var pillar1Geo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        var pillar1Mesh = new THREE.Mesh(pillar1Geo, makeMaterial(0x225566));
        pillar1Mesh.position.set(X_OFFSET + 72, 4, -2);
        addMesh(pillar1Mesh);

        var pillar2Geo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        var pillar2Mesh = new THREE.Mesh(pillar2Geo, makeMaterial(0x225566));
        pillar2Mesh.position.set(X_OFFSET + 72, 4, 12);
        addMesh(pillar2Mesh);

        // Fish market stalls
        var stallPositions = [-40, -26, -12, 2];
        for (var st = 0; st < stallPositions.length; st++) {
            var sx = X_OFFSET + stallPositions[st];

            // Stall counter
            var stallGeo = new THREE.BoxGeometry(10, 1.2, 4);
            var stallMesh = new THREE.Mesh(stallGeo, makeMaterial(0xDDCCAA));
            stallMesh.position.set(sx, 1.2, 22);
            addMesh(stallMesh);

            // Stall canopy
            var canopyGeo = new THREE.BoxGeometry(11, 0.3, 5);
            var canopyMesh = new THREE.Mesh(canopyGeo, makeMaterial(0xCC3333));
            canopyMesh.position.set(sx, 3.5, 22);
            addMesh(canopyMesh);

            // Canopy support poles
            var pole1Geo = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 6);
            var pole1Mesh = new THREE.Mesh(pole1Geo, makeMaterial(0x888888));
            pole1Mesh.position.set(sx - 4.5, 1.75, 19.5);
            addMesh(pole1Mesh);

            var pole2Geo = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 6);
            var pole2Mesh = new THREE.Mesh(pole2Geo, makeMaterial(0x888888));
            pole2Mesh.position.set(sx + 4.5, 1.75, 19.5);
            addMesh(pole2Mesh);
        }

        // Street lamps along road
        var lampPositions = [-70, -40, -10, 20, 50, 70];
        for (var lp = 0; lp < lampPositions.length; lp++) {
            var lpx = X_OFFSET + lampPositions[lp];

            var poleGeo = new THREE.CylinderGeometry(0.2, 0.25, 8, 6);
            var poleMesh = new THREE.Mesh(poleGeo, makeMaterial(0x444444));
            poleMesh.position.set(lpx, 4, 14);
            addMesh(poleMesh);

            var lampGeo = new THREE.SphereGeometry(0.6, 8, 6);
            var lampMesh = new THREE.Mesh(lampGeo, makeMaterial(0xFFFFCC));
            lampMesh.position.set(lpx, 8.2, 14);
            addMesh(lampMesh);
        }
    }

    function buildEastHillCliff() {
        // Main cliff face — steep tall box
        var cliffGeo = new THREE.BoxGeometry(80, 100, 20);
        var cliffMesh = new THREE.Mesh(cliffGeo, makeMaterial(0x7A6B52));
        cliffMesh.position.set(X_OFFSET + 90, 50, -20);
        addMesh(cliffMesh);

        // Cliff face texture layers
        var layer1Geo = new THREE.BoxGeometry(80, 20, 2);
        var layer1Mesh = new THREE.Mesh(layer1Geo, makeMaterial(0x8A7B62));
        layer1Mesh.position.set(X_OFFSET + 90, 20, -10);
        addMesh(layer1Mesh);

        var layer2Geo = new THREE.BoxGeometry(80, 15, 2);
        var layer2Mesh = new THREE.Mesh(layer2Geo, makeMaterial(0x6A5B42));
        layer2Mesh.position.set(X_OFFSET + 90, 50, -10);
        addMesh(layer2Mesh);

        var layer3Geo = new THREE.BoxGeometry(80, 10, 2);
        var layer3Mesh = new THREE.Mesh(layer3Geo, makeMaterial(0x9A8B72));
        layer3Mesh.position.set(X_OFFSET + 90, 78, -10);
        addMesh(layer3Mesh);

        // Clifftop greenery
        var topGeo = new THREE.BoxGeometry(90, 6, 30);
        var topMesh = new THREE.Mesh(topGeo, makeMaterial(0x4A7A3A));
        topMesh.position.set(X_OFFSET + 90, 102, -25);
        addMesh(topMesh);

        // Funicular track — cliff railway
        // Lower station building
        var lowerStationGeo = new THREE.BoxGeometry(8, 6, 6);
        var lowerStationMesh = new THREE.Mesh(lowerStationGeo, makeMaterial(0xBBA880));
        lowerStationMesh.position.set(X_OFFSET + 70, 3, -8);
        addMesh(lowerStationMesh);

        var lowerRoofGeo = new THREE.BoxGeometry(9, 1, 7);
        var lowerRoofMesh = new THREE.Mesh(lowerRoofGeo, makeMaterial(0x884422));
        lowerRoofMesh.position.set(X_OFFSET + 70, 6.5, -8);
        addMesh(lowerRoofMesh);

        // Upper station building
        var upperStationGeo = new THREE.BoxGeometry(8, 6, 6);
        var upperStationMesh = new THREE.Mesh(upperStationGeo, makeMaterial(0xBBA880));
        upperStationMesh.position.set(X_OFFSET + 85, 97, -18);
        addMesh(upperStationMesh);

        var upperRoofGeo = new THREE.BoxGeometry(9, 1, 7);
        var upperRoofMesh = new THREE.Mesh(upperRoofGeo, makeMaterial(0x884422));
        upperRoofMesh.position.set(X_OFFSET + 85, 100.5, -18);
        addMesh(upperRoofMesh);

        // Track rails (LineSegments)
        var trackPoints = [];
        var segments = 20;
        for (var tk = 0; tk <= segments; tk++) {
            var t = tk / segments;
            trackPoints.push(X_OFFSET + 70 + t * 18);
            trackPoints.push(6 + t * 91);
            trackPoints.push(-10 - t * 10);
        }

        // Left rail
        var leftRailGeo = new THREE.BufferGeometry();
        var leftRailPositions = new Float32Array(trackPoints.length);
        for (var lri = 0; lri < trackPoints.length; lri++) {
            leftRailPositions[lri] = trackPoints[lri];
        }
        leftRailGeo.setAttribute('position', new THREE.BufferAttribute(leftRailPositions, 3));
        var railMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var leftRailLine = new THREE.LineSegments(leftRailGeo, railMat);
        addMesh(leftRailLine);

        // Right rail offset slightly
        var rightRailGeo = new THREE.BufferGeometry();
        var rightPoints = new Float32Array(trackPoints.length);
        for (var rri = 0; rri < trackPoints.length; rri++) {
            rightPoints[rri] = trackPoints[rri];
            if (rri % 3 === 2) {
                rightPoints[rri] = trackPoints[rri] + 3;
            }
        }
        rightRailGeo.setAttribute('position', new THREE.BufferAttribute(rightPoints, 3));
        var rightRailLine = new THREE.LineSegments(rightRailGeo, railMat);
        addMesh(rightRailLine);

        // Funicular car (box on the cliff)
        var carGeo = new THREE.BoxGeometry(3, 4, 3);
        var carMesh = new THREE.Mesh(carGeo, makeMaterial(0xCC2222));
        carMesh.position.set(X_OFFSET + 76, 38, -13);
        addMesh(carMesh);

        // Rock fall / scree at cliff base
        var scree1Geo = new THREE.BoxGeometry(20, 3, 8);
        var scree1Mesh = new THREE.Mesh(scree1Geo, makeMaterial(0x9A8B72));
        scree1Mesh.position.set(X_OFFSET + 88, 1.5, -5);
        addMesh(scree1Mesh);

        var scree2Geo = new THREE.BoxGeometry(12, 2, 5);
        var scree2Mesh = new THREE.Mesh(scree2Geo, makeMaterial(0x8A7B62));
        scree2Mesh.position.set(X_OFFSET + 100, 1, -3);
        addMesh(scree2Mesh);
    }

    function build() {
        buildCastleRuins();
        buildNetShops();
        buildFishingBeach();
        buildRockANoreRoad();
        buildEastHillCliff();
    }

    function update(delta) { }

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
