window.IsleOfSkye = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var X = 14920;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, mat, x, y, z) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addLines(geo, mat, x, y, z) {
        var ls = new THREE.LineSegments(geo, mat);
        ls.position.set(x, y, z);
        scene.add(ls);
        objects.push(ls);
        return ls;
    }

    function buildCuillin() {
        var darkGabbro = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var darkGrey = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
        var peakData = [
            [X - 200, 0, -300, 12, 80, 12],
            [X - 160, 0, -280, 10, 90, 10],
            [X - 120, 0, -310, 14, 100, 14],
            [X - 80,  0, -290, 8,  85, 8 ],
            [X - 40,  0, -320, 12, 95, 12],
            [X,       0, -300, 16, 110, 10],
            [X + 40,  0, -310, 10, 88, 10],
            [X + 80,  0, -285, 8,  92, 8 ],
            [X + 120, 0, -300, 12, 78, 12],
            [X + 160, 0, -315, 10, 102, 10],
            [X + 200, 0, -290, 8,  86, 8 ]
        ];
        for (var i = 0; i < peakData.length; i++) {
            var pd = peakData[i];
            var geo = new THREE.ConeGeometry(pd[3], pd[4], 5);
            addMesh(geo, darkGabbro, pd[0], pd[4] / 2, pd[2]);
        }
        // Sgurr Alasdair — highest peak
        var sgurr = new THREE.ConeGeometry(18, 130, 6);
        addMesh(sgurr, darkGabbro, X - 50, 65, -340);
        // Inaccessible Pinnacle — vertical slab
        var pinnacleBase = new THREE.BoxGeometry(4, 60, 10);
        addMesh(pinnacleBase, darkGrey, X + 30, 30, -340);
        // Ridge base
        var ridge = new THREE.BoxGeometry(500, 20, 40);
        addMesh(ridge, darkGabbro, X, 10, -300);
        // Corrie — cut valleys
        for (var c = 0; c < 4; c++) {
            var corrie = new THREE.CylinderGeometry(20, 5, 30, 8, 1, true);
            addMesh(corrie, darkGrey, X - 150 + c * 100, 0, -260);
        }
        // Scree slopes
        var screeGeo = new THREE.ConeGeometry(40, 20, 8);
        var screeMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        for (var s = 0; s < 5; s++) {
            addMesh(screeGeo, screeMat, X - 160 + s * 80, 10, -260);
        }
    }

    function buildOldManOfStorr() {
        var basaltMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x4a4242 });
        var hillMat = new THREE.MeshLambertMaterial({ color: 0x3b4a2d });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3a5c });
        // Hillside
        var hillGeo = new THREE.ConeGeometry(120, 80, 8);
        addMesh(hillGeo, hillMat, X + 400, 40, -100);
        // Storr cliff face
        var cliffGeo = new THREE.BoxGeometry(80, 60, 10);
        addMesh(cliffGeo, basaltMat, X + 400, 50, -140);
        // Old Man — main pinnacle
        var oldManGeo = new THREE.CylinderGeometry(4, 7, 55, 6);
        addMesh(oldManGeo, basaltMat, X + 380, 107, -130);
        // Cap stone
        var capGeo = new THREE.ConeGeometry(5, 8, 5);
        addMesh(capGeo, rockMat, X + 380, 139, -130);
        // Surrounding pinnacles
        var pinnaclePositions = [
            [X + 370, -115], [X + 392, -118], [X + 376, -108], [X + 388, -125]
        ];
        for (var p = 0; p < pinnaclePositions.length; p++) {
            var pp = pinnaclePositions[p];
            var pGeo = new THREE.ConeGeometry(3, 20 + p * 4, 5);
            addMesh(pGeo, rockMat, pp[0], 10 + p * 2 + 70, pp[1]);
        }
        // Loch Leathan below
        var lochGeo = new THREE.BoxGeometry(180, 1, 80);
        addMesh(lochGeo, waterMat, X + 420, 0.5, -60);
        // Rocky outcrops
        for (var r = 0; r < 6; r++) {
            var rocGeo = new THREE.BoxGeometry(5 + r, 8 + r * 2, 6 + r);
            addMesh(rocGeo, basaltMat, X + 360 + r * 12, 4 + r, -100 - r * 5);
        }
    }

    function buildDunveganCastle() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x4a4a55 });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3a5c });
        var gardenMat = new THREE.MeshLambertMaterial({ color: 0x2d5a1e });
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var cx = X - 500;
        var cz = 100;
        // Loch Dunvegan
        var lochGeo = new THREE.BoxGeometry(300, 1, 200);
        addMesh(lochGeo, waterMat, cx - 80, 0.5, cz + 60);
        // Main castle body
        var mainBodyGeo = new THREE.BoxGeometry(30, 25, 20);
        addMesh(mainBodyGeo, stoneMat, cx, 12, cz);
        // Tower keep
        var keepGeo = new THREE.CylinderGeometry(8, 9, 40, 8);
        addMesh(keepGeo, stoneMat, cx - 10, 20, cz - 5);
        var keepRoofGeo = new THREE.ConeGeometry(9, 12, 8);
        addMesh(keepRoofGeo, roofMat, cx - 10, 46, cz - 5);
        // Secondary tower
        var tower2Geo = new THREE.CylinderGeometry(5, 6, 30, 8);
        addMesh(tower2Geo, stoneMat, cx + 18, 15, cz - 8);
        var roof2Geo = new THREE.ConeGeometry(6, 8, 8);
        addMesh(roof2Geo, roofMat, cx + 18, 34, cz - 8);
        // Curtain walls
        var wallNGeo = new THREE.BoxGeometry(50, 10, 3);
        addMesh(wallNGeo, wallMat, cx, 5, cz - 18);
        var wallEGeo = new THREE.BoxGeometry(3, 10, 40);
        addMesh(wallEGeo, wallMat, cx + 25, 5, cz);
        // Drawbridge
        var bridgeGeo = new THREE.BoxGeometry(8, 1, 12);
        addMesh(bridgeGeo, new THREE.MeshLambertMaterial({ color: 0x5a4030 }), cx - 30, 1, cz);
        // Gardens
        var gardenGeo = new THREE.BoxGeometry(40, 1, 30);
        addMesh(gardenGeo, gardenMat, cx + 40, 0.5, cz + 20);
        // Garden hedges
        for (var g = 0; g < 4; g++) {
            var hedgeGeo = new THREE.BoxGeometry(2, 4, 25);
            addMesh(hedgeGeo, new THREE.MeshLambertMaterial({ color: 0x1e4a14 }), cx + 25 + g * 10, 2, cz + 20);
        }
        // Battlements
        for (var b = 0; b < 5; b++) {
            var battGeo = new THREE.BoxGeometry(3, 3, 3);
            addMesh(battGeo, stoneMat, cx - 10 + b * 8, 27, cz - 8);
        }
        // Shore rocks
        for (var sr = 0; sr < 5; sr++) {
            var srocGeo = new THREE.SphereGeometry(2 + sr * 0.5, 5, 4);
            addMesh(srocGeo, wallMat, cx - 60 + sr * 10, 1, cz + 30);
        }
    }

    function buildEileanDonan() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x706050 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x3a3a44 });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x162f4a });
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x605040 });
        var islandMat = new THREE.MeshLambertMaterial({ color: 0x4a3e30 });
        var ex = X - 300;
        var ez = 200;
        // Loch Duich
        var lochGeo = new THREE.BoxGeometry(400, 1, 300);
        addMesh(lochGeo, waterMat, ex, 0.3, ez + 50);
        // Small tidal island
        var islandGeo = new THREE.CylinderGeometry(30, 35, 3, 10);
        addMesh(islandGeo, islandMat, ex, 1.5, ez);
        // Main castle keep
        var keepGeo = new THREE.BoxGeometry(22, 30, 18);
        addMesh(keepGeo, stoneMat, ex, 16.5, ez);
        // Keep roof
        var keepRoofGeo = new THREE.ConeGeometry(14, 10, 4);
        addMesh(keepRoofGeo, roofMat, ex, 35, ez);
        // Round tower 1
        var rt1Geo = new THREE.CylinderGeometry(5, 6, 25, 8);
        addMesh(rt1Geo, stoneMat, ex - 12, 13.5, ez - 8);
        var rt1RoofGeo = new THREE.ConeGeometry(6, 8, 8);
        addMesh(rt1RoofGeo, roofMat, ex - 12, 29, ez - 8);
        // Round tower 2
        var rt2Geo = new THREE.CylinderGeometry(4, 5, 20, 8);
        addMesh(rt2Geo, stoneMat, ex + 12, 11, ez + 8);
        var rt2RoofGeo = new THREE.ConeGeometry(5, 7, 8);
        addMesh(rt2RoofGeo, roofMat, ex + 12, 25, ez + 8);
        // Curtain wall around island
        var cwGeo = new THREE.CylinderGeometry(32, 32, 6, 12, 1, true);
        addMesh(cwGeo, stoneMat, ex, 4, ez);
        // Three-arched bridge — three segments
        var arch1Geo = new THREE.BoxGeometry(18, 3, 5);
        addMesh(arch1Geo, bridgeMat, ex - 48, 2.5, ez + 5);
        var arch2Geo = new THREE.BoxGeometry(18, 3, 5);
        addMesh(arch2Geo, bridgeMat, ex - 66, 2.5, ez + 5);
        var arch3Geo = new THREE.BoxGeometry(18, 3, 5);
        addMesh(arch3Geo, bridgeMat, ex - 84, 2.5, ez + 5);
        // Bridge pillars
        for (var bp = 0; bp < 4; bp++) {
            var bpGeo = new THREE.BoxGeometry(4, 6, 6);
            addMesh(bpGeo, bridgeMat, ex - 39 - bp * 18, 1, ez + 5);
        }
        // Shore connection
        var shoreGeo = new THREE.BoxGeometry(10, 2, 5);
        addMesh(shoreGeo, bridgeMat, ex - 98, 2, ez + 5);
        // Battlements on keep
        for (var kb = 0; kb < 6; kb++) {
            var kbGeo = new THREE.BoxGeometry(2.5, 3, 2.5);
            addMesh(kbGeo, stoneMat, ex - 9 + kb * 4, 32, ez - 7);
        }
        // Background hills
        var hillMat = new THREE.MeshLambertMaterial({ color: 0x2e4020 });
        for (var h = 0; h < 5; h++) {
            var hGeo = new THREE.ConeGeometry(50 + h * 10, 60 + h * 8, 7);
            addMesh(hGeo, hillMat, ex - 100 + h * 60, 30 + h * 4, ez + 180);
        }
    }

    function buildSkyeBridge() {
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0xb0a898 });
        var steelMat = new THREE.MeshLambertMaterial({ color: 0x7a8090 });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1a3a5c });
        var bx = X + 600;
        var bz = 300;
        // Narrows water
        var narrowsGeo = new THREE.BoxGeometry(200, 1, 60);
        addMesh(narrowsGeo, waterMat, bx, 0.3, bz);
        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(200, 2, 10);
        addMesh(deckGeo, concreteMat, bx, 10, bz);
        // West pylon
        var pylon1Geo = new THREE.BoxGeometry(5, 50, 5);
        addMesh(pylon1Geo, concreteMat, bx - 40, 25, bz);
        // Pylon crossbar
        var cross1Geo = new THREE.BoxGeometry(14, 3, 3);
        addMesh(cross1Geo, concreteMat, bx - 40, 45, bz);
        // East pylon
        var pylon2Geo = new THREE.BoxGeometry(5, 50, 5);
        addMesh(pylon2Geo, concreteMat, bx + 40, 25, bz);
        var cross2Geo = new THREE.BoxGeometry(14, 3, 3);
        addMesh(cross2Geo, concreteMat, bx + 40, 45, bz);
        // Stay cables — approximated as thin boxes
        var cableAngles = [-20, -10, 0, 10, 20];
        for (var ca = 0; ca < cableAngles.length; ca++) {
            var cabGeo = new THREE.BoxGeometry(1, 30, 1);
            var cab = addMesh(cabGeo, steelMat, bx - 40 + ca * 6, 26, bz);
            cab.rotation.z = cableAngles[ca] * Math.PI / 180;
        }
        for (var ca2 = 0; ca2 < cableAngles.length; ca2++) {
            var cabGeo2 = new THREE.BoxGeometry(1, 30, 1);
            var cab2 = addMesh(cabGeo2, steelMat, bx + 40 - ca2 * 6, 26, bz);
            cab2.rotation.z = -cableAngles[ca2] * Math.PI / 180;
        }
        // Approach ramps
        var ramp1Geo = new THREE.BoxGeometry(60, 2, 10);
        addMesh(ramp1Geo, concreteMat, bx - 130, 6, bz);
        var ramp2Geo = new THREE.BoxGeometry(60, 2, 10);
        addMesh(ramp2Geo, concreteMat, bx + 130, 6, bz);
        // Piers in water
        for (var pi = 0; pi < 3; pi++) {
            var pierGeo = new THREE.CylinderGeometry(3, 4, 12, 6);
            addMesh(pierGeo, concreteMat, bx - 60 + pi * 60, 6, bz);
        }
    }

    function buildPortree() {
        var harbourWaterMat = new THREE.MeshLambertMaterial({ color: 0x1a3a5c });
        var quayMat = new THREE.MeshLambertMaterial({ color: 0x808070 });
        var px = X + 200;
        var pz = 150;
        // Loch Portree
        var lochGeo = new THREE.BoxGeometry(150, 1, 120);
        addMesh(lochGeo, harbourWaterMat, px + 30, 0.3, pz + 30);
        // Harbour quay
        var quayGeo = new THREE.BoxGeometry(80, 2, 8);
        addMesh(quayGeo, quayMat, px, 1, pz);
        // Harbour wall
        var hwGeo = new THREE.BoxGeometry(80, 5, 2);
        addMesh(hwGeo, quayMat, px, 3.5, pz - 4);
        // Colourful harbour buildings
        var buildingColours = [
            0xe8d44d,
            0xe87b4d,
            0x4d9ee8,
            0xe84d6f,
            0x4de8a0,
            0xe8c34d,
            0x9b4de8
        ];
        for (var hb = 0; hb < 7; hb++) {
            var bMat = new THREE.MeshLambertMaterial({ color: buildingColours[hb] });
            var bw = 8 + (hb % 3) * 2;
            var bh = 10 + (hb % 4) * 3;
            var bGeo = new THREE.BoxGeometry(bw, bh, 8);
            addMesh(bGeo, bMat, px - 28 + hb * 10, bh / 2, pz - 14);
            // Roof
            var rMat = new THREE.MeshLambertMaterial({ color: 0x5a3020 });
            var rGeo = new THREE.ConeGeometry(bw * 0.75, 4, 4);
            addMesh(rGeo, rMat, px - 28 + hb * 10, bh + 2, pz - 14);
        }
        // Boats in harbour
        var boatMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var boatHullMat = new THREE.MeshLambertMaterial({ color: 0x2244aa });
        for (var bt = 0; bt < 4; bt++) {
            var hullGeo = new THREE.BoxGeometry(6, 2, 3);
            addMesh(hullGeo, boatHullMat, px - 10 + bt * 14, 1.5, pz + 8 + bt * 5);
            var cabinGeo = new THREE.BoxGeometry(3, 2, 2);
            addMesh(cabinGeo, boatMat, px - 10 + bt * 14, 3.5, pz + 8 + bt * 5);
            // Mast
            var mastGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 4);
            addMesh(mastGeo, new THREE.MeshLambertMaterial({ color: 0x8B6914 }), px - 10 + bt * 14, 5, pz + 8 + bt * 5);
        }
        // Town buildings behind harbour
        var townMat = new THREE.MeshLambertMaterial({ color: 0xd4cfc8 });
        for (var tb = 0; tb < 5; tb++) {
            var tbGeo = new THREE.BoxGeometry(12, 14 + tb * 2, 10);
            addMesh(tbGeo, townMat, px - 20 + tb * 16, 7 + tb, pz - 25 - tb * 3);
        }
        // Church
        var churchGeo = new THREE.BoxGeometry(10, 16, 14);
        addMesh(churchGeo, new THREE.MeshLambertMaterial({ color: 0xc8c0b4 }), px + 60, 8, pz - 20);
        var steepleGeo = new THREE.ConeGeometry(3, 16, 4);
        addMesh(steepleGeo, new THREE.MeshLambertMaterial({ color: 0x6a6060 }), px + 60, 24, pz - 20);
        // Cuillin hills visible in background
        var bgHillMat = new THREE.MeshLambertMaterial({ color: 0x1e1e22 });
        for (var bh2 = 0; bh2 < 5; bh2++) {
            var bhGeo = new THREE.ConeGeometry(30 + bh2 * 8, 50 + bh2 * 10, 6);
            addMesh(bhGeo, bgHillMat, px - 60 + bh2 * 40, 25 + bh2 * 5, pz - 200);
        }
        // Pier / jetty
        var jettyGeo = new THREE.BoxGeometry(4, 1, 30);
        addMesh(jettyGeo, quayMat, px + 45, 1, pz + 15);
        // Lighthouse at pier end
        var ltGeo = new THREE.CylinderGeometry(1.5, 2, 10, 8);
        addMesh(ltGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), px + 45, 5, pz + 28);
        var ltCapGeo = new THREE.ConeGeometry(2, 3, 8);
        addMesh(ltCapGeo, new THREE.MeshLambertMaterial({ color: 0xcc2222 }), px + 45, 11.5, pz + 28);
        // Road along harbour front
        var roadGeo = new THREE.BoxGeometry(100, 0.5, 6);
        addMesh(roadGeo, new THREE.MeshLambertMaterial({ color: 0x555550 }), px, 0.5, pz - 6);
    }

    function build() {
        buildCuillin();
        buildOldManOfStorr();
        buildDunveganCastle();
        buildEileanDonan();
        buildSkyeBridge();
        buildPortree();
    }

    function update(delta) {
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
