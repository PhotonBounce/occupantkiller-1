window.MiltonKeynesGrid = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 12560;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geometry, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geometry, mat);
        mesh.position.set(x, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildGroundPlane() {
        var geo = new THREE.BoxGeometry(3000, 1, 3000);
        makeMesh(geo, 0x7aab5a, X_OFFSET, -0.5, 0, 0, 0, 0);
    }

    function buildGridRoads() {
        var i;
        var roadColor = 0x555566;
        var lineColor = 0xddddcc;
        var kerb = 0x888888;

        // Horizontal grid roads (V-roads) spaced 1km apart
        var hRoadZ = [-600, -400, -200, 0, 200, 400, 600];
        for (i = 0; i < hRoadZ.length; i++) {
            var hRoadGeo = new THREE.BoxGeometry(3000, 0.5, 32);
            makeMesh(hRoadGeo, roadColor, X_OFFSET, 0.25, hRoadZ[i], 0, 0, 0);
            // Central reservation
            var hResGeo = new THREE.BoxGeometry(3000, 1, 3);
            makeMesh(hResGeo, 0x336633, X_OFFSET, 0.5, hRoadZ[i], 0, 0, 0);
            // White centre lines
            var hLineGeo = new THREE.BoxGeometry(3000, 0.6, 0.5);
            makeMesh(hLineGeo, lineColor, X_OFFSET, 0.3, hRoadZ[i] - 8, 0, 0, 0);
            makeMesh(hLineGeo.clone(), lineColor, X_OFFSET, 0.3, hRoadZ[i] + 8, 0, 0, 0);
        }

        // Vertical grid roads (H-roads) spaced 1km apart
        var vRoadX = [-600, -400, -200, 0, 200, 400, 600];
        for (i = 0; i < vRoadX.length; i++) {
            var vRoadGeo = new THREE.BoxGeometry(32, 0.5, 3000);
            makeMesh(vRoadGeo, roadColor, X_OFFSET + vRoadX[i], 0.25, 0, 0, 0, 0);
            // Central reservation
            var vResGeo = new THREE.BoxGeometry(3, 1, 3000);
            makeMesh(vResGeo, 0x336633, X_OFFSET + vRoadX[i], 0.5, 0, 0, 0, 0);
            // White centre lines
            var vLineGeoA = new THREE.BoxGeometry(0.5, 0.6, 3000);
            makeMesh(vLineGeoA, lineColor, X_OFFSET + vRoadX[i] - 8, 0.3, 0, 0, 0, 0);
            makeMesh(vLineGeoA.clone(), lineColor, X_OFFSET + vRoadX[i] + 8, 0.3, 0, 0, 0, 0);
        }

        // Roundabouts at major intersections
        var roundaboutPositions = [
            [0, 0], [0, 200], [0, -200],
            [200, 0], [-200, 0], [200, 200],
            [-200, -200], [400, 400], [-400, -400]
        ];
        for (i = 0; i < roundaboutPositions.length; i++) {
            var rpx = roundaboutPositions[i][0];
            var rpz = roundaboutPositions[i][1];
            var roundBase = new THREE.CylinderGeometry(22, 22, 0.6, 16);
            makeMesh(roundBase, roadColor, X_OFFSET + rpx, 0.3, rpz, 0, 0, 0);
            var roundIsland = new THREE.CylinderGeometry(10, 10, 1.2, 16);
            makeMesh(roundIsland, 0x559944, X_OFFSET + rpx, 0.6, rpz, 0, 0, 0);
            // Roundabout kerb ring
            var roundKerb = new THREE.CylinderGeometry(12, 12, 0.8, 16);
            makeMesh(roundKerb, kerb, X_OFFSET + rpx, 0.4, rpz, 0, 0, 0);
        }

        // Underpass structures (MK is famous for underpasses for pedestrians)
        var underpasses = [
            [100, -300], [-100, 300], [300, 100], [-300, -100]
        ];
        for (i = 0; i < underpasses.length; i++) {
            var upx = underpasses[i][0];
            var upz = underpasses[i][1];
            var upWallA = new THREE.BoxGeometry(6, 5, 30);
            makeMesh(upWallA, 0x8899aa, X_OFFSET + upx - 10, 2.5, upz, 0, 0, 0);
            makeMesh(upWallA.clone(), 0x8899aa, X_OFFSET + upx + 10, 2.5, upz, 0, 0, 0);
            var upRoof = new THREE.BoxGeometry(26, 1.5, 30);
            makeMesh(upRoof, 0x7788aa, X_OFFSET + upx, 5.5, upz, 0, 0, 0);
        }

        // Street lamp posts along main roads
        var lampPositions = [
            [0, -250], [0, -50], [0, 150], [0, 350],
            [-250, 0], [-50, 0], [150, 0], [350, 0]
        ];
        for (i = 0; i < lampPositions.length; i++) {
            var lx = lampPositions[i][0];
            var lz = lampPositions[i][1];
            var lampPost = new THREE.CylinderGeometry(0.4, 0.5, 12, 6);
            makeMesh(lampPost, 0xaaaacc, X_OFFSET + lx + 18, 6, lz, 0, 0, 0);
            var lampHead = new THREE.BoxGeometry(3, 1, 1.5);
            makeMesh(lampHead, 0xffffee, X_OFFSET + lx + 18, 12.2, lz, 0, 0, 0);

            makeMesh(lampPost.clone(), 0xaaaacc, X_OFFSET + lx - 18, 6, lz, 0, 0, 0);
            makeMesh(lampHead.clone(), 0xffffee, X_OFFSET + lx - 18, 12.2, lz, 0, 0, 0);
        }
    }

    function buildConcreteCows() {
        // Liz Leyh's 1978 concrete cow sculpture in Bancroft area
        var cowField = new THREE.BoxGeometry(80, 0.3, 60);
        makeMesh(cowField, 0x99cc77, X_OFFSET - 350, 0.15, -450, 0, 0, 0);

        var cowPositions = [
            [-370, -460], [-355, -445], [-340, -468],
            [-360, -430], [-345, -455], [-375, -440],
            [-330, -462], [-385, -452], [-350, -472]
        ];

        var i;
        for (i = 0; i < cowPositions.length; i++) {
            var cx = cowPositions[i][0];
            var cz = cowPositions[i][1];
            var angle = (i * 0.7);

            // Cow body — main torso
            var body = new THREE.BoxGeometry(8, 5, 12);
            makeMesh(body, 0xddddcc, X_OFFSET + cx, 4.5, cz, 0, angle, 0);

            // Cow head
            var head = new THREE.BoxGeometry(4, 4, 5);
            makeMesh(head, 0xddddcc, X_OFFSET + cx + Math.cos(angle) * 7, 6.5, cz + Math.sin(angle) * 7, 0, angle, 0);

            // Cow nose
            var nose = new THREE.BoxGeometry(2.5, 2, 3);
            makeMesh(nose, 0xccbbaa, X_OFFSET + cx + Math.cos(angle) * 9.5, 5.8, cz + Math.sin(angle) * 9.5, 0, angle, 0);

            // Four legs
            var legGeo = new THREE.BoxGeometry(1.5, 3.5, 1.5);
            makeMesh(legGeo, 0xccccbb, X_OFFSET + cx + 2.5, 1.8, cz + 3.5, 0, angle, 0);
            makeMesh(legGeo.clone(), 0xccccbb, X_OFFSET + cx - 2.5, 1.8, cz + 3.5, 0, angle, 0);
            makeMesh(legGeo.clone(), 0xccccbb, X_OFFSET + cx + 2.5, 1.8, cz - 3.5, 0, angle, 0);
            makeMesh(legGeo.clone(), 0xccccbb, X_OFFSET + cx - 2.5, 1.8, cz - 3.5, 0, angle, 0);

            // Horns
            var hornGeo = new THREE.ConeGeometry(0.4, 2.5, 4);
            makeMesh(hornGeo, 0xeeeedd, X_OFFSET + cx + Math.cos(angle) * 7 + 1.5, 9, cz + Math.sin(angle) * 7, 0, 0, 0.4);
            makeMesh(hornGeo.clone(), 0xeeeedd, X_OFFSET + cx + Math.cos(angle) * 7 - 1.5, 9, cz + Math.sin(angle) * 7, 0, 0, -0.4);

            // Udder (on some cows)
            if (i % 2 === 0) {
                var udder = new THREE.SphereGeometry(1.5, 6, 4);
                makeMesh(udder, 0xffcccc, X_OFFSET + cx, 1.8, cz, 0, 0, 0);
            }

            // Paint spots — black blotches
            var spot = new THREE.BoxGeometry(2.5, 1, 3.5);
            makeMesh(spot, 0x111111, X_OFFSET + cx + 2, 7.3, cz + 2, 0, angle, 0);
            makeMesh(spot.clone(), 0x111111, X_OFFSET + cx - 1.5, 7.3, cz - 2.5, 0, angle, 0);
        }

        // Interpretive sign near the cows
        var signPost = new THREE.CylinderGeometry(0.3, 0.3, 3.5, 6);
        makeMesh(signPost, 0x664422, X_OFFSET - 310, 1.75, -420, 0, 0, 0);
        var signBoard = new THREE.BoxGeometry(8, 3.5, 0.4);
        makeMesh(signBoard, 0x225522, X_OFFSET - 310, 4.5, -420, 0, 0, 0);
    }

    function buildCampbellPark() {
        // Central park — green space in heart of MK
        var parkGround = new THREE.BoxGeometry(350, 0.4, 450);
        makeMesh(parkGround, 0x55aa44, X_OFFSET + 50, 0.2, 200, 0, 0, 0);

        // Midsummer Boulevard axis — long straight path
        var boulevard = new THREE.BoxGeometry(16, 0.6, 450);
        makeMesh(boulevard, 0xcc9966, X_OFFSET + 50, 0.3, 200, 0, 0, 0);

        // Amphitheatre — tiered semicircular seating
        var i;
        for (i = 0; i < 5; i++) {
            var tierRadius = 30 + i * 8;
            var tierGeo = new THREE.CylinderGeometry(tierRadius, tierRadius + 3, 1.5, 24, 1, false, 0, Math.PI);
            makeMesh(tierGeo, 0xbbaa88, X_OFFSET + 50, i * 1.5 + 0.75, 100, 0, 0, 0);
        }
        // Stage area
        var stage = new THREE.BoxGeometry(40, 2, 20);
        makeMesh(stage, 0x997755, X_OFFSET + 50, 1, 68, 0, 0, 0);
        // Stage canopy roof
        var canopy = new THREE.BoxGeometry(44, 1, 22);
        makeMesh(canopy, 0x555566, X_OFFSET + 50, 10, 68, 0, 0, 0);
        // Canopy supports
        var supportGeo = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
        makeMesh(supportGeo, 0x444455, X_OFFSET + 28, 5, 68, 0, 0, 0);
        makeMesh(supportGeo.clone(), 0x444455, X_OFFSET + 72, 5, 68, 0, 0, 0);

        // Public art — abstract sculpture
        var artBase = new THREE.CylinderGeometry(4, 5, 2, 8);
        makeMesh(artBase, 0x888899, X_OFFSET + 50, 1, 180, 0, 0, 0);
        var artPillar = new THREE.CylinderGeometry(1.2, 1.8, 18, 8);
        makeMesh(artPillar, 0x9999aa, X_OFFSET + 50, 10, 180, 0, 0, 0);
        var artTop = new THREE.SphereGeometry(5, 10, 8);
        makeMesh(artTop, 0xaaaacc, X_OFFSET + 50, 21, 180, 0, 0, 0);

        // Trees — simple cones on cylinders
        var treePositions = [
            [-80, 120], [-60, 160], [-70, 200], [-75, 260], [-65, 300],
            [180, 120], [170, 170], [175, 220], [168, 280], [182, 330],
            [-80, 350], [180, 350], [50, 380]
        ];
        for (i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz = treePositions[i][1];
            var trunk = new THREE.CylinderGeometry(1, 1.3, 8, 6);
            makeMesh(trunk, 0x553311, X_OFFSET + tx, 4, tz, 0, 0, 0);
            var canopyCone = new THREE.ConeGeometry(7, 14, 7);
            makeMesh(canopyCone, 0x336622, X_OFFSET + tx, 15, tz, 0, 0, 0);
        }

        // Park benches
        var benchPositions = [
            [10, 130], [90, 130], [10, 260], [90, 260]
        ];
        for (i = 0; i < benchPositions.length; i++) {
            var bx = benchPositions[i][0];
            var bz = benchPositions[i][1];
            var benchSeat = new THREE.BoxGeometry(5, 0.5, 1.5);
            makeMesh(benchSeat, 0x885533, X_OFFSET + bx, 1.5, bz, 0, 0, 0);
            var benchLeg = new THREE.BoxGeometry(0.5, 1.5, 1.5);
            makeMesh(benchLeg, 0x666666, X_OFFSET + bx - 2, 0.75, bz, 0, 0, 0);
            makeMesh(benchLeg.clone(), 0x666666, X_OFFSET + bx + 2, 0.75, bz, 0, 0, 0);
        }

        // Fountain at park centre
        var fountainBase = new THREE.CylinderGeometry(12, 14, 1.5, 12);
        makeMesh(fountainBase, 0x888899, X_OFFSET + 50, 0.75, 320, 0, 0, 0);
        var fountainPool = new THREE.CylinderGeometry(10, 10, 0.8, 12);
        makeMesh(fountainPool, 0x6688aa, X_OFFSET + 50, 1.4, 320, 0, 0, 0);
        var fountainPillar = new THREE.CylinderGeometry(1, 1.5, 8, 8);
        makeMesh(fountainPillar, 0x999aaa, X_OFFSET + 50, 5.5, 320, 0, 0, 0);
        var fountainTop = new THREE.SphereGeometry(3, 8, 6);
        makeMesh(fountainTop, 0xaabbcc, X_OFFSET + 50, 10.5, 320, 0, 0, 0);
    }

    function buildStadiumMK() {
        // Stadium MK — Dons FC home, modern bowl design built 2007
        var stadX = X_OFFSET + 450;
        var stadZ = -300;

        // Pitch / playing surface
        var pitch = new THREE.BoxGeometry(115, 0.5, 78);
        makeMesh(pitch, 0x33aa44, stadX, 0.25, stadZ, 0, 0, 0);
        // Pitch markings
        var pitchLine = new THREE.BoxGeometry(115, 0.6, 1);
        makeMesh(pitchLine, 0xffffff, stadX, 0.3, stadZ - 39, 0, 0, 0);
        makeMesh(pitchLine.clone(), 0xffffff, stadX, 0.3, stadZ + 39, 0, 0, 0);
        var halfLine = new THREE.BoxGeometry(1, 0.6, 78);
        makeMesh(halfLine, 0xffffff, stadX, 0.3, stadZ, 0, 0, 0);
        var centreCircle = new THREE.CylinderGeometry(9.15, 9.15, 0.6, 20, 1, true);
        makeMesh(centreCircle, 0xffffff, stadX, 0.3, stadZ, 0, 0, 0);

        // Four stands — tiered bowl design
        // North Stand
        var northStand = new THREE.BoxGeometry(130, 22, 28);
        makeMesh(northStand, 0x99aabb, stadX, 11, stadZ - 55, 0, 0, 0);
        // North stand seating tiers
        var i;
        for (i = 0; i < 6; i++) {
            var nTier = new THREE.BoxGeometry(128, 2, 4);
            makeMesh(nTier, 0x4466aa, stadX, i * 3 + 2, stadZ - 52 + i * 2, 0, 0, 0);
        }
        // North roof
        var nRoof = new THREE.BoxGeometry(134, 2, 10);
        makeMesh(nRoof, 0x8899bb, stadX, 23, stadZ - 58, 0, 0, 0);

        // South Stand
        var southStand = new THREE.BoxGeometry(130, 22, 28);
        makeMesh(southStand, 0x99aabb, stadX, 11, stadZ + 55, 0, 0, 0);
        for (i = 0; i < 6; i++) {
            var sTier = new THREE.BoxGeometry(128, 2, 4);
            makeMesh(sTier, 0x4466aa, stadX, i * 3 + 2, stadZ + 52 - i * 2, 0, 0, 0);
        }
        var sRoof = new THREE.BoxGeometry(134, 2, 10);
        makeMesh(sRoof, 0x8899bb, stadX, 23, stadZ + 58, 0, 0, 0);

        // East Stand (main stand)
        var eastStand = new THREE.BoxGeometry(28, 28, 85);
        makeMesh(eastStand, 0x8899aa, stadX + 65, 14, stadZ, 0, 0, 0);
        for (i = 0; i < 8; i++) {
            var eTier = new THREE.BoxGeometry(4, 2.5, 83);
            makeMesh(eTier, 0x4466aa, stadX + 62 - i * 2, i * 3 + 2, stadZ, 0, 0, 0);
        }
        var eRoof = new THREE.BoxGeometry(12, 2, 90);
        makeMesh(eRoof, 0x7788aa, stadX + 70, 30, stadZ, 0, 0, 0);

        // West Stand
        var westStand = new THREE.BoxGeometry(28, 24, 85);
        makeMesh(westStand, 0x99aabb, stadX - 65, 12, stadZ, 0, 0, 0);
        for (i = 0; i < 7; i++) {
            var wTier = new THREE.BoxGeometry(4, 2.5, 83);
            makeMesh(wTier, 0x4466aa, stadX - 62 + i * 2, i * 3 + 2, stadZ, 0, 0, 0);
        }
        var wRoof = new THREE.BoxGeometry(12, 2, 90);
        makeMesh(wRoof, 0x7788aa, stadX - 70, 26, stadZ, 0, 0, 0);

        // Corner sections
        var corners = [
            [stadX + 65, stadZ - 55],
            [stadX + 65, stadZ + 55],
            [stadX - 65, stadZ - 55],
            [stadX - 65, stadZ + 55]
        ];
        for (i = 0; i < corners.length; i++) {
            var corner = new THREE.BoxGeometry(18, 20, 18);
            makeMesh(corner, 0x8899aa, corners[i][0], 10, corners[i][1], 0, 0, 0);
        }

        // Floodlight pylons
        var pylonPositions = [
            [stadX + 75, stadZ - 65],
            [stadX + 75, stadZ + 65],
            [stadX - 75, stadZ - 65],
            [stadX - 75, stadZ + 65]
        ];
        for (i = 0; i < pylonPositions.length; i++) {
            var pylonX = pylonPositions[i][0];
            var pylonZ = pylonPositions[i][1];
            var pylon = new THREE.CylinderGeometry(1.2, 2, 40, 8);
            makeMesh(pylon, 0xcccccc, pylonX, 20, pylonZ, 0, 0, 0);
            var light = new THREE.BoxGeometry(8, 2, 6);
            makeMesh(light, 0xffffee, pylonX, 41, pylonZ, 0, 0, 0);
        }

        // Stadium exterior wall / perimeter
        var perimN = new THREE.BoxGeometry(145, 3, 2);
        makeMesh(perimN, 0x7788aa, stadX, 1.5, stadZ - 72, 0, 0, 0);
        makeMesh(perimN.clone(), 0x7788aa, stadX, 1.5, stadZ + 72, 0, 0, 0);
        var perimE = new THREE.BoxGeometry(2, 3, 144);
        makeMesh(perimE, 0x7788aa, stadX + 82, 1.5, stadZ, 0, 0, 0);
        makeMesh(perimE.clone(), 0x7788aa, stadX - 82, 1.5, stadZ, 0, 0, 0);
    }

    function buildThePoint() {
        // The Point — iconic 1980s red pyramid entertainment complex
        // Opened 1985, first multiplex cinema in UK, distinctive ziggurat shape
        var px = X_OFFSET - 200;
        var pz = -500;

        // Ground plaza
        var plaza = new THREE.BoxGeometry(120, 0.5, 120);
        makeMesh(plaza, 0x888899, px, 0.25, pz, 0, 0, 0);

        // Main pyramid structure — tiered red pyramid (ziggurat)
        var tier1 = new THREE.BoxGeometry(100, 8, 100);
        makeMesh(tier1, 0xcc2222, px, 4, pz, 0, 0, 0);

        var tier2 = new THREE.BoxGeometry(80, 8, 80);
        makeMesh(tier2, 0xbb1111, px, 12, pz, 0, 0, 0);

        var tier3 = new THREE.BoxGeometry(60, 8, 60);
        makeMesh(tier3, 0xcc2222, px, 20, pz, 0, 0, 0);

        var tier4 = new THREE.BoxGeometry(40, 8, 40);
        makeMesh(tier4, 0xbb1111, px, 28, pz, 0, 0, 0);

        var tier5 = new THREE.BoxGeometry(20, 8, 20);
        makeMesh(tier5, 0xcc2222, px, 36, pz, 0, 0, 0);

        // Pyramid apex
        var apex = new THREE.ConeGeometry(8, 10, 4);
        makeMesh(apex, 0xdd3333, px, 45, pz, 0, Math.PI / 4, 0);

        // Entrance canopy
        var entranceCanopy = new THREE.BoxGeometry(30, 2, 15);
        makeMesh(entranceCanopy, 0x993333, px, 9, pz + 58, 0, 0, 0);
        var entrancePillarL = new THREE.CylinderGeometry(1, 1.2, 9, 6);
        makeMesh(entrancePillarL, 0xaaaaaa, px - 12, 4.5, pz + 60, 0, 0, 0);
        makeMesh(entrancePillarL.clone(), 0xaaaaaa, px + 12, 4.5, pz + 60, 0, 0, 0);

        // Signage on tier 1 face
        var signage = new THREE.BoxGeometry(20, 4, 0.5);
        makeMesh(signage, 0xffff00, px, 6, pz + 50.3, 0, 0, 0);

        // Windows / glazing on tiers
        var i;
        for (i = 0; i < 4; i++) {
            var winGeo = new THREE.BoxGeometry(10, 4, 0.5);
            makeMesh(winGeo, 0x99ccff, px - 20 + i * 14, 5.5, pz + 50.3, 0, 0, 0);
            makeMesh(winGeo.clone(), 0x99ccff, px - 20 + i * 14, 13.5, pz + 40.3, 0, 0, 0);
        }

        // Car park area
        var carpark = new THREE.BoxGeometry(200, 0.3, 80);
        makeMesh(carpark, 0x666677, px - 60, 0.15, pz - 70, 0, 0, 0);
        // Car park lines
        for (i = 0; i < 10; i++) {
            var lineGeo = new THREE.BoxGeometry(0.5, 0.4, 18);
            makeMesh(lineGeo, 0xcccccc, px - 155 + i * 20, 0.2, pz - 70, 0, 0, 0);
        }
    }

    function buildShoppingCentre() {
        // intu Milton Keynes (The Centre:MK) — large covered mall in central MK
        var sx = X_OFFSET - 150;
        var sz = 450;

        // Main mall structure — enormous rectangular building
        var mainMall = new THREE.BoxGeometry(400, 22, 120);
        makeMesh(mainMall, 0xccccbb, sx, 11, sz, 0, 0, 0);

        // Glass atrium roof panels along the length
        var i;
        for (i = 0; i < 8; i++) {
            var atrium = new THREE.BoxGeometry(40, 3, 90);
            makeMesh(atrium, 0xaaccee, sx - 175 + i * 50, 23, sz, 0, 0, 0);
        }

        // Atrium ridge spine
        var ridge = new THREE.BoxGeometry(400, 2, 8);
        makeMesh(ridge, 0x99aacc, sx, 25, sz, 0, 0, 0);

        // Side wings
        var wingA = new THREE.BoxGeometry(100, 18, 60);
        makeMesh(wingA, 0xbbbbaa, sx, 9, sz + 90, 0, 0, 0);
        var wingB = new THREE.BoxGeometry(100, 18, 60);
        makeMesh(wingB, 0xbbbbaa, sx, 9, sz - 90, 0, 0, 0);

        // Wing atrium tops
        var wingAtrium = new THREE.BoxGeometry(100, 2, 60);
        makeMesh(wingAtrium, 0xaaccee, sx, 20, sz + 90, 0, 0, 0);
        makeMesh(wingAtrium.clone(), 0xaaccee, sx, 20, sz - 90, 0, 0, 0);

        // Store entrances along north face
        var entrances = [-150, -75, 0, 75, 150];
        for (i = 0; i < entrances.length; i++) {
            var entEx = entrances[i];
            var entranceGeo = new THREE.BoxGeometry(18, 8, 4);
            makeMesh(entranceGeo, 0x99bbcc, sx + entEx, 4, sz + 62, 0, 0, 0);
        }

        // Store entrances along south face
        for (i = 0; i < entrances.length; i++) {
            var entEx2 = entrances[i];
            var entranceGeo2 = new THREE.BoxGeometry(18, 8, 4);
            makeMesh(entranceGeo2, 0x99bbcc, sx + entEx2, 4, sz - 62, 0, 0, 0);
        }

        // Anchor department stores at each end
        var anchorA = new THREE.BoxGeometry(60, 28, 130);
        makeMesh(anchorA, 0xbbbbcc, sx + 210, 14, sz, 0, 0, 0);
        var anchorB = new THREE.BoxGeometry(60, 28, 130);
        makeMesh(anchorB, 0xbbbbcc, sx - 210, 14, sz, 0, 0, 0);

        // Exterior cladding detail stripes
        for (i = 0; i < 6; i++) {
            var stripe = new THREE.BoxGeometry(400, 1.5, 1);
            makeMesh(stripe, 0xaaaaaa, sx, 4 + i * 3, sz + 60.5, 0, 0, 0);
        }

        // Car park structure — multi-storey
        var carParkA = new THREE.BoxGeometry(180, 25, 80);
        makeMesh(carParkA, 0x999988, sx + 250, 12.5, sz, 0, 0, 0);
        var carParkB = new THREE.BoxGeometry(180, 25, 80);
        makeMesh(carParkB, 0x999988, sx - 250, 12.5, sz, 0, 0, 0);

        // Car park decks
        for (i = 0; i < 4; i++) {
            var deckA = new THREE.BoxGeometry(178, 0.6, 78);
            makeMesh(deckA, 0x888877, sx + 250, 5 + i * 6, sz, 0, 0, 0);
            makeMesh(deckA.clone(), 0x888877, sx - 250, 5 + i * 6, sz, 0, 0, 0);
        }

        // Pedestrian bridges connecting car parks to mall
        var bridgeA = new THREE.BoxGeometry(32, 4, 20);
        makeMesh(bridgeA, 0xaaaacc, sx + 155, 14, sz, 0, 0, 0);
        var bridgeB = new THREE.BoxGeometry(32, 4, 20);
        makeMesh(bridgeB, 0xaaaacc, sx - 155, 14, sz, 0, 0, 0);

        // Outdoor mall plaza / pedestrian precinct
        var precinct = new THREE.BoxGeometry(250, 0.4, 40);
        makeMesh(precinct, 0xccbb99, sx, 0.2, sz + 80, 0, 0, 0);

        // Lamp columns in precinct
        for (i = 0; i < 6; i++) {
            var precinctLamp = new THREE.CylinderGeometry(0.4, 0.5, 9, 6);
            makeMesh(precinctLamp, 0xccccaa, sx - 125 + i * 50, 4.5, sz + 80, 0, 0, 0);
            var lampHead2 = new THREE.SphereGeometry(1.5, 6, 5);
            makeMesh(lampHead2, 0xffffcc, sx - 125 + i * 50, 9.5, sz + 80, 0, 0, 0);
        }

        // Planters
        for (i = 0; i < 4; i++) {
            var planter = new THREE.BoxGeometry(6, 2, 6);
            makeMesh(planter, 0x887766, sx - 75 + i * 50, 1, sz + 80, 0, 0, 0);
            var plantTop = new THREE.SphereGeometry(3, 6, 5);
            makeMesh(plantTop, 0x44aa33, sx - 75 + i * 50, 4, sz + 80, 0, 0, 0);
        }
    }

    function buildSurroundingBuildings() {
        // Typical MK commercial / residential blocks
        var i;
        var buildingData = [
            // [x, z, w, h, d, color]
            [-500, 300, 45, 30, 40, 0xccbbaa],
            [-450, 380, 35, 18, 30, 0xaabbcc],
            [-520, 420, 50, 22, 35, 0xbbccaa],
            [350, 400, 60, 35, 45, 0xaabbcc],
            [420, 350, 40, 20, 40, 0xccbbbb],
            [480, 430, 55, 28, 50, 0xbbaacc],
            [-480, -350, 45, 25, 40, 0xccccbb],
            [-420, -430, 60, 32, 45, 0xaabbaa],
            [300, -450, 50, 20, 35, 0xbbcccc],
            [380, -380, 40, 38, 40, 0xccaabb],
            [-250, 550, 80, 14, 70, 0xbbbbcc],
            [200, 550, 90, 18, 60, 0xaabbbb],
            [500, -500, 45, 24, 40, 0xccbbcc],
            [-500, -500, 55, 30, 50, 0xbbaaaa],
            [600, 300, 40, 15, 35, 0xccccaa],
            [-600, 300, 42, 20, 38, 0xaaccbb]
        ];
        for (i = 0; i < buildingData.length; i++) {
            var bd = buildingData[i];
            var bGeo = new THREE.BoxGeometry(bd[2], bd[3], bd[4]);
            makeMesh(bGeo, bd[5], X_OFFSET + bd[0], bd[3] / 2, bd[1], 0, 0, 0);
        }
    }

    function build() {
        buildGroundPlane();
        buildGridRoads();
        buildConcreteCows();
        buildCampbellPark();
        buildStadiumMK();
        buildThePoint();
        buildShoppingCentre();
        buildSurroundingBuildings();
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
