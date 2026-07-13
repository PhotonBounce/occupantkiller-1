window.RichmondDeer = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var X_OFFSET = 11160;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMesh(geometry, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function buildTerrain() {
        // Large rolling parkland base
        var baseGeo = new THREE.BoxGeometry(2000, 4, 2000);
        var base = makeMesh(baseGeo, 0x4a7c35, X_OFFSET, 0, 0);
        addToScene(base);

        // Gentle undulations using box slabs
        var undulations = [
            [400, 3, -200, 600, 2, 400],
            [-300, 2.5, 300, 500, 1.5, 350],
            [200, 2, 500, 700, 2, 500],
            [-500, 3.5, -400, 450, 3, 300],
            [600, 2, -500, 400, 2, 600],
            [-200, 1.5, -600, 600, 1, 400],
            [100, 3, -100, 800, 2.5, 600]
        ];
        for (var u = 0; u < undulations.length; u++) {
            var ud = undulations[u];
            var geo = new THREE.BoxGeometry(ud[3], ud[4], ud[5]);
            var mesh = makeMesh(geo, 0x5a8c40, X_OFFSET + ud[0], ud[1], ud[2]);
            addToScene(mesh);
        }
    }

    function buildOakTree(x, y, z, trunkH, canopyR) {
        // Gnarled trunk
        var trunkGeo = new THREE.CylinderGeometry(0.4, 0.7, trunkH, 7);
        var trunk = makeMesh(trunkGeo, 0x5c3d1e, x, y + trunkH / 2, z);
        addToScene(trunk);

        // Lower branch mass
        var lowGeo = new THREE.SphereGeometry(canopyR * 0.7, 7, 6);
        var low = makeMesh(lowGeo, 0x2d5a1b, x, y + trunkH * 0.7, z);
        addToScene(low);

        // Main wide canopy
        var canopyGeo = new THREE.SphereGeometry(canopyR, 8, 6);
        var canopy = makeMesh(canopyGeo, 0x3a6b22, x, y + trunkH + canopyR * 0.6, z);
        addToScene(canopy);

        // Secondary canopy blob
        var can2Geo = new THREE.SphereGeometry(canopyR * 0.6, 7, 5);
        var can2 = makeMesh(can2Geo, 0x2e5a1a, x + canopyR * 0.5, y + trunkH + canopyR * 0.4, z + canopyR * 0.3);
        addToScene(can2);
    }

    function buildAncientOaks() {
        var oaks = [
            [-400, 2, -300, 5, 8],
            [-380, 2, -250, 4.5, 7],
            [-420, 2, -350, 6, 9],
            [300, 3, 400, 5, 7.5],
            [320, 3, 440, 4, 6.5],
            [-100, 2, 500, 5.5, 8],
            [-80, 2, 540, 4.5, 7],
            [600, 2, 200, 4, 7],
            [620, 2, 230, 5, 8],
            [-600, 2, 100, 5, 9],
            [-620, 2, 80, 4.5, 7.5],
            [100, 3, -500, 5, 8],
            [80, 3, -530, 4, 7],
            [-200, 2, 200, 6, 9],
            [450, 2, -400, 5, 8],
            [-350, 2, 450, 4.5, 7],
            [700, 2, 350, 5, 8],
            [-700, 2, -200, 5.5, 8.5],
            [150, 3, 300, 4, 6.5],
            [250, 3, -300, 5, 7.5],
            [-500, 2, 300, 4.5, 7],
            [400, 2, 100, 5, 8],
            [-100, 2, -400, 4, 7],
            [500, 3, 500, 5.5, 9],
            [-450, 2, -100, 4, 7],
            [350, 2, -200, 5, 8],
            [-300, 2, 600, 4.5, 7.5],
            [200, 2, 650, 5, 8],
            [-650, 2, 400, 4, 7],
            [650, 2, -300, 5, 8.5]
        ];
        for (var o = 0; o < oaks.length; o++) {
            var ok = oaks[o];
            buildOakTree(X_OFFSET + ok[0], ok[1], ok[2], ok[3], ok[4]);
        }
    }

    function buildGrassPatches() {
        // Open grassland patches of slightly varied colour
        var patches = [
            [0, 0, 0, 300, 200],
            [200, 0, 100, 250, 180],
            [-100, 0, -100, 200, 220],
            [400, 0, -100, 280, 200],
            [-300, 0, 200, 320, 180]
        ];
        for (var p = 0; p < patches.length; p++) {
            var pt = patches[p];
            var geo = new THREE.BoxGeometry(pt[3], 0.5, pt[4]);
            var m = makeMesh(geo, 0x6aab42, X_OFFSET + pt[0], pt[1] + 2.1, pt[2]);
            addToScene(m);
        }
    }

    function buildDeer(x, y, z, isMale) {
        // Body
        var bodyGeo = new THREE.BoxGeometry(0.8, 0.5, 1.5);
        var body = makeMesh(bodyGeo, 0x8b4513, x, y + 1.1, z);
        addToScene(body);

        // Neck
        var neckGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.5, 6);
        var neck = makeMesh(neckGeo, 0x8b4513, x, y + 1.55, z - 0.4);
        neck.rotation.x = -0.4;
        addToScene(neck);

        // Head
        var headGeo = new THREE.SphereGeometry(0.18, 6, 5);
        var head = makeMesh(headGeo, 0x8b4513, x, y + 1.8, z - 0.65);
        addToScene(head);

        // Snout
        var snoutGeo = new THREE.BoxGeometry(0.14, 0.1, 0.2);
        var snout = makeMesh(snoutGeo, 0x7a3a0e, x, y + 1.74, z - 0.8);
        addToScene(snout);

        // Legs x4
        var legPositions = [
            [0.25, 0, 0.45],
            [-0.25, 0, 0.45],
            [0.25, 0, -0.45],
            [-0.25, 0, -0.45]
        ];
        for (var l = 0; l < legPositions.length; l++) {
            var lp = legPositions[l];
            var legGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.7, 5);
            var leg = makeMesh(legGeo, 0x7a3a0e, x + lp[0], y + 0.55, z + lp[1]);
            addToScene(leg);

            // Lower leg
            var lowerGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 5);
            var lower = makeMesh(lowerGeo, 0x6b2e0a, x + lp[0], y + 0.15, z + lp[1]);
            addToScene(lower);
        }

        // Tail
        var tailGeo = new THREE.BoxGeometry(0.15, 0.12, 0.1);
        var tail = makeMesh(tailGeo, 0xf5e6d0, x, y + 1.2, z + 0.8);
        addToScene(tail);

        // Antlers for males using LineSegments
        if (isMale) {
            var antlerPoints = [
                // Left antler main beam
                0, 0, 0,   -0.1, 0.5, -0.1,
                -0.1, 0.5, -0.1,   -0.3, 0.9, 0,
                -0.3, 0.9, 0,   -0.5, 1.2, -0.1,
                // Left brow tine
                -0.1, 0.5, -0.1,   -0.3, 0.7, -0.3,
                // Left bez tine
                -0.3, 0.9, 0,   -0.5, 1.0, -0.3,
                // Right antler main beam
                0, 0, 0,   0.1, 0.5, -0.1,
                0.1, 0.5, -0.1,   0.3, 0.9, 0,
                0.3, 0.9, 0,   0.5, 1.2, -0.1,
                // Right brow tine
                0.1, 0.5, -0.1,   0.3, 0.7, -0.3,
                // Right bez tine
                0.3, 0.9, 0,   0.5, 1.0, -0.3
            ];
            var antlerBuf = new THREE.Float32BufferAttribute(antlerPoints, 3);
            var antlerGeo = new THREE.BufferGeometry();
            antlerGeo.setAttribute('position', antlerBuf);
            var antlerMat = new THREE.LineBasicMaterial({ color: 0x5c3a10 });
            var antlers = new THREE.LineSegments(antlerGeo, antlerMat);
            antlers.position.set(x, y + 1.78, z - 0.65);
            scene.add(antlers);
            objects.push(antlers);
        }
    }

    function buildDeerHerd() {
        // 20 deer scattered naturally, 12 males with antlers, 8 females
        var herdData = [
            [50, 2, 50, true],
            [60, 2, 70, false],
            [40, 2, 30, true],
            [80, 2, 40, false],
            [30, 2, 80, true],
            [-50, 2, 60, false],
            [-60, 2, 40, true],
            [-40, 2, 80, false],
            [100, 2, 20, true],
            [-100, 2, 30, false],
            [0, 2, 100, true],
            [20, 2, -50, false],
            [-20, 2, -60, true],
            [70, 2, -30, false],
            [-70, 2, -40, true],
            [90, 2, 90, true],
            [-90, 2, 70, false],
            [110, 2, -10, true],
            [-110, 2, 10, true],
            [55, 2, -80, false]
        ];
        for (var d = 0; d < herdData.length; d++) {
            var dd = herdData[d];
            buildDeer(X_OFFSET + dd[0], dd[1], dd[2], dd[3]);
        }
    }

    function buildWildfowl(x, y, z) {
        // Simple duck shape: box body, sphere head
        var bodyGeo = new THREE.BoxGeometry(0.3, 0.15, 0.5);
        var body = makeMesh(bodyGeo, 0x2c5f2e, x, y, z);
        addToScene(body);

        var headGeo = new THREE.SphereGeometry(0.1, 5, 4);
        var head = makeMesh(headGeo, 0x1a3d1c, x, y + 0.15, z - 0.18);
        addToScene(head);
    }

    function buildPenPonds() {
        // Two rectangular ponds
        var pond1Geo = new THREE.BoxGeometry(120, 0.3, 80);
        var pond1 = makeMesh(pond1Geo, 0x2e6fa3, X_OFFSET - 200, 2.2, 150);
        addToScene(pond1);

        var pond2Geo = new THREE.BoxGeometry(100, 0.3, 70);
        var pond2 = makeMesh(pond2Geo, 0x2e6fa3, X_OFFSET - 200, 2.2, 260);
        addToScene(pond2);

        // Pond banks
        var bank1Geo = new THREE.BoxGeometry(130, 1.5, 90);
        var bank1 = makeMesh(bank1Geo, 0x5a7a3a, X_OFFSET - 200, 1.5, 150);
        addToScene(bank1);

        var bank2Geo = new THREE.BoxGeometry(110, 1.5, 80);
        var bank2 = makeMesh(bank2Geo, 0x5a7a3a, X_OFFSET - 200, 1.5, 260);
        addToScene(bank2);

        // Connecting channel
        var channelGeo = new THREE.BoxGeometry(8, 0.3, 30);
        var channel = makeMesh(channelGeo, 0x2e6fa3, X_OFFSET - 200, 2.2, 205);
        addToScene(channel);

        // Fishing platforms
        var plat1Geo = new THREE.BoxGeometry(8, 0.3, 4);
        var plat1 = makeMesh(plat1Geo, 0x8b6914, X_OFFSET - 255, 2.4, 150);
        addToScene(plat1);

        var plat2Geo = new THREE.BoxGeometry(8, 0.3, 4);
        var plat2 = makeMesh(plat2Geo, 0x8b6914, X_OFFSET - 145, 2.4, 260);
        addToScene(plat2);

        // Wildfowl on ponds
        buildWildfowl(X_OFFSET - 180, 2.5, 140);
        buildWildfowl(X_OFFSET - 210, 2.5, 160);
        buildWildfowl(X_OFFSET - 195, 2.5, 145);
        buildWildfowl(X_OFFSET - 190, 2.5, 265);
        buildWildfowl(X_OFFSET - 215, 2.5, 255);
        buildWildfowl(X_OFFSET - 205, 2.5, 270);

        // Reed beds at pond edges
        for (var r = 0; r < 8; r++) {
            var reedGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 4);
            var reed = makeMesh(reedGeo, 0x7a6a20, X_OFFSET - 255 + r * 8, 3, 120);
            addToScene(reed);

            var reed2Geo = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 4);
            var reed2 = makeMesh(reed2Geo, 0x6a5a18, X_OFFSET - 255 + r * 8, 3, 290);
            addToScene(reed2);
        }
    }

    function buildPembrokeLodge() {
        var px = X_OFFSET + 300;
        var pz = -300;
        var py = 5;

        // Main mansion building
        var mansionGeo = new THREE.BoxGeometry(40, 14, 22);
        var mansion = makeMesh(mansionGeo, 0xf0e8d5, px, py + 7, pz);
        addToScene(mansion);

        // Roof
        var roofGeo = new THREE.BoxGeometry(42, 4, 24);
        var roof = makeMesh(roofGeo, 0xc0a060, px, py + 16, pz);
        addToScene(roof);

        // Attic / upper section
        var atticGeo = new THREE.BoxGeometry(30, 5, 20);
        var attic = makeMesh(atticGeo, 0xe8dfc8, px, py + 20, pz);
        addToScene(attic);

        // Chimneys
        var chim1Geo = new THREE.BoxGeometry(2, 6, 2);
        var chim1 = makeMesh(chim1Geo, 0xb08050, px - 12, py + 24, pz - 6);
        addToScene(chim1);

        var chim2Geo = new THREE.BoxGeometry(2, 6, 2);
        var chim2 = makeMesh(chim2Geo, 0xb08050, px + 12, py + 24, pz - 6);
        addToScene(chim2);

        // Columned terrace
        var terraceGeo = new THREE.BoxGeometry(50, 1.2, 10);
        var terrace = makeMesh(terraceGeo, 0xe0d8c0, px, py + 0.6, pz - 16);
        addToScene(terrace);

        // Columns x6
        for (var c = 0; c < 6; c++) {
            var colGeo = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
            var col = makeMesh(colGeo, 0xf5f0e8, px - 12 + c * 5, py + 4.6, pz - 16);
            addToScene(col);
        }

        // Column tops (capitals)
        for (var ct = 0; ct < 6; ct++) {
            var capGeo = new THREE.BoxGeometry(1.2, 0.5, 1.2);
            var cap = makeMesh(capGeo, 0xf0ebe0, px - 12 + ct * 5, py + 9, pz - 16);
            addToScene(cap);
        }

        // Tea room wing (east side)
        var tearoomGeo = new THREE.BoxGeometry(14, 8, 18);
        var tearoom = makeMesh(tearoomGeo, 0xf0e8d5, px + 27, py + 4, pz);
        addToScene(tearoom);

        var tearoofGeo = new THREE.BoxGeometry(15, 2, 19);
        var tearoof = makeMesh(tearoofGeo, 0xb8a050, px + 27, py + 9, pz);
        addToScene(tearoof);

        // Formal garden paths (light paths between hedges)
        var path1Geo = new THREE.BoxGeometry(4, 0.2, 30);
        var path1 = makeMesh(path1Geo, 0xd4c89a, px - 10, py + 0.2, pz - 35);
        addToScene(path1);

        var path2Geo = new THREE.BoxGeometry(4, 0.2, 30);
        var path2 = makeMesh(path2Geo, 0xd4c89a, px + 10, py + 0.2, pz - 35);
        addToScene(path2);

        // Cross path
        var pathCGeo = new THREE.BoxGeometry(30, 0.2, 4);
        var pathC = makeMesh(pathCGeo, 0xd4c89a, px, py + 0.2, pz - 35);
        addToScene(pathC);

        // Garden hedges (box hedging)
        var hedge1Geo = new THREE.BoxGeometry(25, 2, 2);
        var hedge1 = makeMesh(hedge1Geo, 0x2a5c1a, px, py + 1, pz - 25);
        addToScene(hedge1);

        var hedge2Geo = new THREE.BoxGeometry(25, 2, 2);
        var hedge2 = makeMesh(hedge2Geo, 0x2a5c1a, px, py + 1, pz - 45);
        addToScene(hedge2);

        var hedge3Geo = new THREE.BoxGeometry(2, 2, 20);
        var hedge3 = makeMesh(hedge3Geo, 0x2a5c1a, px - 12, py + 1, pz - 35);
        addToScene(hedge3);

        var hedge4Geo = new THREE.BoxGeometry(2, 2, 20);
        var hedge4 = makeMesh(hedge4Geo, 0x2a5c1a, px + 12, py + 1, pz - 35);
        addToScene(hedge4);

        // View terrace wall (over Thames valley)
        var wallGeo = new THREE.BoxGeometry(60, 2, 2);
        var wall = makeMesh(wallGeo, 0xd0c8a8, px, py + 1, pz - 55);
        addToScene(wall);

        // Terrace viewing area
        var vtGeo = new THREE.BoxGeometry(60, 0.5, 12);
        var vt = makeMesh(vtGeo, 0xc8c0a0, px, py + 0.25, pz - 49);
        addToScene(vt);

        // Lawn in front
        var lawnGeo = new THREE.BoxGeometry(70, 0.3, 30);
        var lawn = makeMesh(lawnGeo, 0x5ab830, px, py + 0.15, pz - 38);
        addToScene(lawn);
    }

    function buildKingHenryMound() {
        var mx = X_OFFSET - 350;
        var mz = -500;
        var my = 2;

        // Base cylinder of historic mound
        var baseGeo = new THREE.CylinderGeometry(22, 30, 8, 12);
        var base = makeMesh(baseGeo, 0x4a7c35, mx, my + 4, mz);
        addToScene(base);

        // Middle tier
        var midGeo = new THREE.CylinderGeometry(14, 22, 5, 10);
        var mid = makeMesh(midGeo, 0x5a8c40, mx, my + 10, mz);
        addToScene(mid);

        // Top cone
        var topGeo = new THREE.ConeGeometry(10, 6, 10);
        var top = makeMesh(topGeo, 0x6a9c45, mx, my + 16, mz);
        addToScene(top);

        // Summit flat viewing area
        var summitGeo = new THREE.CylinderGeometry(5, 5, 0.5, 10);
        var summit = makeMesh(summitGeo, 0xd0c890, mx, my + 19.5, mz);
        addToScene(summit);

        // Viewing shelter / gazebo
        var shelterGeo = new THREE.BoxGeometry(4, 3, 4);
        var shelter = makeMesh(shelterGeo, 0x8b6914, mx, my + 22, mz);
        addToScene(shelter);

        var shelterRoofGeo = new THREE.ConeGeometry(3.5, 2, 4);
        var shelterRoof = makeMesh(shelterRoofGeo, 0x6a4a10, mx, my + 25, mz);
        addToScene(shelterRoof);

        // Axial view alignment: gap in trees leading to distant London Eye
        // Trees flanking the view corridor (pairs either side)
        var corridorTrees = [
            [-20, 0],
            [20, 0],
            [-22, 60],
            [22, 60],
            [-25, 130],
            [25, 130],
            [-28, 200],
            [28, 200]
        ];
        for (var ct2 = 0; ct2 < corridorTrees.length; ct2++) {
            var ctr = corridorTrees[ct2];
            buildOakTree(mx + ctr[0], my, mz - ctr[1], 5, 7);
        }

        // London Eye silhouette in the far distance (simplified as large ring)
        var eyeX = mx;
        var eyeZ = mz - 2500;
        var eyeY = my + 80;

        // Outer ring using sphere approximation segments
        var eyeRimGeo = new THREE.CylinderGeometry(30, 30, 2, 16);
        var eyeRim = makeMesh(eyeRimGeo, 0xc0c0c8, eyeX, eyeY, eyeZ);
        eyeRim.rotation.x = Math.PI / 2;
        addToScene(eyeRim);

        // Support legs of London Eye
        var leg1Geo = new THREE.BoxGeometry(2, 60, 2);
        var leg1 = makeMesh(leg1Geo, 0xa0a0b0, eyeX - 10, eyeY - 45, eyeZ);
        addToScene(leg1);

        var leg2Geo = new THREE.BoxGeometry(2, 60, 2);
        var leg2 = makeMesh(leg2Geo, 0xa0a0b0, eyeX + 10, eyeY - 45, eyeZ);
        addToScene(leg2);

        // Centre hub
        var hubGeo = new THREE.SphereGeometry(3, 6, 5);
        var hub = makeMesh(hubGeo, 0xb0b0c0, eyeX, eyeY, eyeZ);
        addToScene(hub);

        // Spokes as LineSegments
        var spokePoints = [];
        for (var s = 0; s < 16; s++) {
            var angle = (s / 16) * Math.PI * 2;
            spokePoints.push(0, 0, 0);
            spokePoints.push(Math.cos(angle) * 30, Math.sin(angle) * 30, 0);
        }
        var spokeBuf = new THREE.Float32BufferAttribute(spokePoints, 3);
        var spokeGeo = new THREE.BufferGeometry();
        spokeGeo.setAttribute('position', spokeBuf);
        var spokeMat = new THREE.LineBasicMaterial({ color: 0xc8c8d8 });
        var spokes = new THREE.LineSegments(spokeGeo, spokeMat);
        spokes.position.set(eyeX, eyeY, eyeZ);
        spokes.rotation.x = Math.PI / 2;
        scene.add(spokes);
        objects.push(spokes);
    }

    function buildIsabellaPlantation() {
        // Wooded garden enclosure south-east area
        var ipx = X_OFFSET + 450;
        var ipz = 350;
        var ipy = 2;

        // Boundary hedge/wall
        var bounds = [
            [0, 0, 0, 80, 2, 2],
            [0, 0, 80, 80, 2, 2],
            [-40, 0, 40, 2, 2, 80],
            [40, 0, 40, 2, 2, 80]
        ];
        for (var b = 0; b < bounds.length; b++) {
            var bd = bounds[b];
            var bGeo = new THREE.BoxGeometry(bd[3], bd[4], bd[5]);
            var bm = makeMesh(bGeo, 0x2a4a1a, ipx + bd[0], ipy + bd[4] / 2, ipz + bd[2]);
            addToScene(bm);
        }

        // Rhododendron shrubs (colourful sphere clusters)
        var rhodoColors = [0xe83030, 0xe87020, 0xe0e030, 0xd040d0, 0xff69b4, 0xff9900];
        var rhodoPos = [
            [-25, 25], [-10, 30], [5, 20], [20, 35],
            [-20, 55], [0, 60], [15, 50], [30, 45],
            [-30, 40], [25, 20]
        ];
        for (var rh = 0; rh < rhodoPos.length; rh++) {
            var rp = rhodoPos[rh];
            var rGeo = new THREE.SphereGeometry(3 + (rh % 3), 6, 5);
            var rMat = new THREE.MeshLambertMaterial({ color: rhodoColors[rh % rhodoColors.length] });
            var rMesh = new THREE.Mesh(rGeo, rMat);
            rMesh.position.set(ipx + rp[0], ipy + 2, ipz + rp[1]);
            scene.add(rMesh);
            objects.push(rMesh);
        }

        // Stream through plantation
        var streamGeo = new THREE.BoxGeometry(3, 0.2, 60);
        var stream = makeMesh(streamGeo, 0x4a90c4, ipx - 5, ipy + 0.3, ipz + 40);
        addToScene(stream);

        // Pond in centre
        var ipPondGeo = new THREE.BoxGeometry(18, 0.2, 14);
        var ipPond = makeMesh(ipPondGeo, 0x3a80b4, ipx, ipy + 0.25, ipz + 40);
        addToScene(ipPond);

        // Woodland trees inside
        var woodTrees = [
            [-15, 15], [10, 10], [-5, 55], [20, 60],
            [-25, 30], [30, 35], [0, 25], [25, 50]
        ];
        for (var wt = 0; wt < woodTrees.length; wt++) {
            var wp = woodTrees[wt];
            buildOakTree(ipx + wp[0], ipy, ipz + wp[1], 4, 5);
        }
    }

    function buildParkInfrastructure() {
        // Car park near Pembroke Lodge
        var cpGeo = new THREE.BoxGeometry(60, 0.3, 40);
        var cp = makeMesh(cpGeo, 0x606060, X_OFFSET + 360, 2.2, -230);
        addToScene(cp);

        // A few parked cars (box shapes)
        for (var car = 0; car < 6; car++) {
            var carGeo = new THREE.BoxGeometry(4, 2, 8);
            var carMesh = makeMesh(carGeo, car % 2 === 0 ? 0x2244aa : 0xaa2222, X_OFFSET + 340 + car * 10, 3.2, -225);
            addToScene(carMesh);
        }

        // Park road / track
        var road1Geo = new THREE.BoxGeometry(8, 0.3, 600);
        var road1 = makeMesh(road1Geo, 0x808060, X_OFFSET + 450, 2.2, 0);
        addToScene(road1);

        var road2Geo = new THREE.BoxGeometry(600, 0.3, 8);
        var road2 = makeMesh(road2Geo, 0x808060, X_OFFSET, 2.2, -200);
        addToScene(road2);

        // Park gate / entrance
        var gate1Geo = new THREE.BoxGeometry(2, 6, 1);
        var gate1 = makeMesh(gate1Geo, 0x5c3d1e, X_OFFSET - 995, 5, 0);
        addToScene(gate1);

        var gate2Geo = new THREE.BoxGeometry(2, 6, 1);
        var gate2 = makeMesh(gate2Geo, 0x5c3d1e, X_OFFSET - 985, 5, 0);
        addToScene(gate2);

        var gateTopGeo = new THREE.BoxGeometry(12, 1, 1);
        var gateTop = makeMesh(gateTopGeo, 0x5c3d1e, X_OFFSET - 990, 8.5, 0);
        addToScene(gateTop);

        // Perimeter brick wall
        var wall1Geo = new THREE.BoxGeometry(1800, 3, 3);
        var wall1 = makeMesh(wall1Geo, 0xa07850, X_OFFSET, 3.5, -950);
        addToScene(wall1);

        var wall2Geo = new THREE.BoxGeometry(1800, 3, 3);
        var wall2 = makeMesh(wall2Geo, 0xa07850, X_OFFSET, 3.5, 950);
        addToScene(wall2);

        var wall3Geo = new THREE.BoxGeometry(3, 3, 1900);
        var wall3 = makeMesh(wall3Geo, 0xa07850, X_OFFSET - 900, 3.5, 0);
        addToScene(wall3);

        var wall4Geo = new THREE.BoxGeometry(3, 3, 1900);
        var wall4 = makeMesh(wall4Geo, 0xa07850, X_OFFSET + 900, 3.5, 0);
        addToScene(wall4);
    }

    function build() {
        buildTerrain();
        buildAncientOaks();
        buildGrassPatches();
        buildDeerHerd();
        buildPenPonds();
        buildPembrokeLodge();
        buildKingHenryMound();
        buildIsabellaPlantation();
        buildParkInfrastructure();
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
