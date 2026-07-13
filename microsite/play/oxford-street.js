window.OxfordStreet = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11680;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObject(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMesh(geometry, color, options) {
        var matOpts = { color: color };
        if (options && options.emissive !== undefined) matOpts.emissive = options.emissive;
        var mat = new THREE.MeshLambertMaterial(matOpts);
        return new THREE.Mesh(geometry, mat);
    }

    function buildRoad() {
        var roadGeo = new THREE.BoxGeometry(40, 0.2, 2000);
        var road = makeMesh(roadGeo, 0x333333);
        road.position.set(X_OFFSET, 0, 0);
        addObject(road);

        var lineGeo = new THREE.BoxGeometry(0.3, 0.25, 2000);
        var lineMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var line1 = new THREE.Mesh(lineGeo, lineMat);
        line1.position.set(X_OFFSET - 2, 0.1, 0);
        addObject(line1);
        var line2 = new THREE.Mesh(lineGeo, lineMat);
        line2.position.set(X_OFFSET + 2, 0.1, 0);
        addObject(line2);

        var pavementGeo = new THREE.BoxGeometry(12, 0.3, 2000);
        var pavementMat = new THREE.MeshLambertMaterial({ color: 0xbbbbaa });
        var pave1 = new THREE.Mesh(pavementGeo, pavementMat);
        pave1.position.set(X_OFFSET - 26, 0.15, 0);
        addObject(pave1);
        var pave2 = new THREE.Mesh(pavementGeo, pavementMat);
        pave2.position.set(X_OFFSET + 26, 0.15, 0);
        addObject(pave2);
    }

    function buildShopBlock(xPos, zPos, width, depth, floors, color) {
        var floorH = 3.5;
        var totalH = floors * floorH;
        var bodyGeo = new THREE.BoxGeometry(width, totalH, depth);
        var body = makeMesh(bodyGeo, color);
        body.position.set(xPos, totalH / 2, zPos);
        addObject(body);

        var windowColor = 0x88bbdd;
        var wRows = floors;
        var wCols = Math.max(2, Math.floor(width / 3));
        for (var r = 0; r < wRows; r++) {
            for (var c = 0; c < wCols; c++) {
                var wx = xPos - (width / 2) + (c + 0.5) * (width / wCols) + 0.2;
                var wy = (r + 0.5) * floorH;
                var wz = zPos + depth / 2 + 0.01;
                var winGeo = new THREE.BoxGeometry(width / wCols - 0.6, floorH - 0.8, 0.1);
                var win = makeMesh(winGeo, windowColor);
                win.position.set(wx, wy, wz);
                addObject(win);
            }
        }
        return totalH;
    }

    function buildSelfridges() {
        var zPos = -500;
        var xPos = X_OFFSET - 35;
        var width = 80;
        var depth = 20;
        var floors = 9;
        var floorH = 3.5;
        var totalH = floors * floorH;

        var bodyGeo = new THREE.BoxGeometry(width, totalH, depth);
        var body = makeMesh(bodyGeo, 0xd4c5a0);
        body.position.set(xPos, totalH / 2, zPos);
        addObject(body);

        var numCols = 20;
        for (var c = 0; c < numCols; c++) {
            var cx = xPos - width / 2 + (c + 0.5) * (width / numCols);
            var colGeo = new THREE.BoxGeometry(0.6, totalH + 1, 0.6);
            var col = makeMesh(colGeo, 0xe8dcc8);
            col.position.set(cx, totalH / 2, zPos + depth / 2 + 0.3);
            addObject(col);
        }

        for (var row = 0; row < floors; row++) {
            for (var wc = 0; wc < numCols - 1; wc++) {
                var wwx = xPos - width / 2 + (wc + 1) * (width / numCols);
                var wwy = (row + 0.5) * floorH;
                var wwz = zPos + depth / 2 + 0.02;
                var wwGeo = new THREE.BoxGeometry(width / numCols - 0.7, floorH - 0.6, 0.1);
                var wwin = makeMesh(wwGeo, 0x99ccee);
                wwin.position.set(wwx, wwy, wwz);
                addObject(wwin);
            }
        }

        var signGeo = new THREE.BoxGeometry(30, 2, 0.5);
        var sign = makeMesh(signGeo, 0xffd700);
        sign.position.set(xPos, totalH + 1.5, zPos + depth / 2 + 0.3);
        addObject(sign);
    }

    function buildJohnLewis() {
        var zPos = 200;
        var xPos = X_OFFSET + 35;
        var width = 60;
        var depth = 18;
        var floors = 8;
        var floorH = 3.5;
        var totalH = floors * floorH;

        var bodyGeo = new THREE.BoxGeometry(width, totalH, depth);
        var body = makeMesh(bodyGeo, 0x7a8a9a);
        body.position.set(xPos, totalH / 2, zPos);
        addObject(body);

        var horizCount = floors;
        for (var h = 0; h <= horizCount; h++) {
            var bandGeo = new THREE.BoxGeometry(width + 0.2, 0.4, depth + 0.2);
            var band = makeMesh(bandGeo, 0x5a6a7a);
            band.position.set(xPos, h * floorH, zPos);
            addObject(band);
        }

        var wColsJL = 8;
        for (var rr = 0; rr < floors; rr++) {
            for (var cc = 0; cc < wColsJL; cc++) {
                var wxx = xPos - width / 2 + (cc + 0.5) * (width / wColsJL) + 0.2;
                var wyy = (rr + 0.5) * floorH;
                var wzz = zPos + depth / 2 + 0.01;
                var wgeo = new THREE.BoxGeometry(width / wColsJL - 0.8, floorH - 0.8, 0.1);
                var wmesh = makeMesh(wgeo, 0xaaccee);
                wmesh.position.set(wxx, wyy, wzz);
                addObject(wmesh);
            }
        }

        var signGeo = new THREE.BoxGeometry(20, 1.8, 0.5);
        var sign = makeMesh(signGeo, 0x336699);
        sign.position.set(xPos, totalH + 1.2, zPos + depth / 2 + 0.3);
        addObject(sign);
    }

    function buildShops() {
        var shopColors = [
            0xcc9977, 0x997755, 0xaabb99, 0x8899aa,
            0xbbaa88, 0x99aabb, 0xcc8866, 0xaa9988,
            0x88aacc, 0xbbccaa
        ];

        var zPositions = [
            -900, -750, -600, -400, -250,
            -100, 50, 150, 350, 500,
            650, 750, 850
        ];

        var widths = [
            22, 18, 25, 20, 28,
            16, 22, 19, 24, 21,
            18, 23, 20
        ];

        var depthArr = [
            14, 12, 16, 13, 15,
            12, 14, 13, 15, 14,
            12, 15, 13
        ];

        var floorCounts = [
            8, 6, 9, 7, 10,
            6, 8, 7, 9, 8,
            6, 9, 7
        ];

        var i;
        for (i = 0; i < zPositions.length; i++) {
            var col = shopColors[i % shopColors.length];
            buildShopBlock(X_OFFSET - 37, zPositions[i], widths[i], depthArr[i], floorCounts[i], col);
        }

        var zPositions2 = [
            -850, -700, -550, -350, -200,
            -50, 100, 250, 400, 600,
            700, 800, 950
        ];

        var widths2 = [
            20, 24, 17, 22, 19,
            25, 18, 21, 23, 16,
            22, 20, 18
        ];

        var depth2 = [
            13, 15, 12, 14, 13,
            16, 12, 14, 15, 12,
            14, 13, 12
        ];

        var floors2 = [
            7, 9, 6, 8, 7,
            10, 6, 8, 9, 6,
            8, 7, 6
        ];

        for (i = 0; i < zPositions2.length; i++) {
            var col2 = shopColors[(i + 3) % shopColors.length];
            buildShopBlock(X_OFFSET + 37, zPositions2[i], widths2[i], depth2[i], floors2[i], col2);
        }
    }

    function buildMarbleArch() {
        var ax = X_OFFSET - 5;
        var az = -950;
        var ay = 0;

        var baseGeo = new THREE.BoxGeometry(22, 1, 12);
        var base = makeMesh(baseGeo, 0xe8e0d0);
        base.position.set(ax, ay + 0.5, az);
        addObject(base);

        var atticGeo = new THREE.BoxGeometry(22, 4, 12);
        var attic = makeMesh(atticGeo, 0xe8e0d0);
        attic.position.set(ax, ay + 12, az);
        addObject(attic);

        var topGeo = new THREE.BoxGeometry(22, 1.5, 12);
        var top = makeMesh(topGeo, 0xd8d0c0);
        top.position.set(ax, ay + 14.5, az);
        addObject(top);

        var leftPierGeo = new THREE.BoxGeometry(4, 11, 12);
        var leftPier = makeMesh(leftPierGeo, 0xe0d8c8);
        leftPier.position.set(ax - 9, ay + 5.5 + 1, az);
        addObject(leftPier);

        var rightPierGeo = new THREE.BoxGeometry(4, 11, 12);
        var rightPier = makeMesh(rightPierGeo, 0xe0d8c8);
        rightPier.position.set(ax + 9, ay + 5.5 + 1, az);
        addObject(rightPier);

        var midLeftPierGeo = new THREE.BoxGeometry(2, 8, 12);
        var midLeftPier = makeMesh(midLeftPierGeo, 0xe0d8c8);
        midLeftPier.position.set(ax - 3, ay + 4 + 1, az);
        addObject(midLeftPier);

        var midRightPierGeo = new THREE.BoxGeometry(2, 8, 12);
        var midRightPier = makeMesh(midRightPierGeo, 0xe0d8c8);
        midRightPier.position.set(ax + 3, ay + 4 + 1, az);
        addObject(midRightPier);

        var archFillGeo = new THREE.BoxGeometry(4, 3, 12);
        var archFill = makeMesh(archFillGeo, 0xe0d8c8);
        archFill.position.set(ax, ay + 9.5 + 1, az);
        addObject(archFill);

        var colPositions = [-10, -7, -1, 1, 7, 10];
        var ci;
        for (ci = 0; ci < colPositions.length; ci++) {
            var cGeo = new THREE.CylinderGeometry(0.4, 0.45, 10, 8);
            var cMesh = makeMesh(cGeo, 0xf0ead8);
            cMesh.position.set(ax + colPositions[ci], ay + 6 + 1, az + 6);
            addObject(cMesh);

            var capGeo = new THREE.BoxGeometry(1.2, 0.5, 1.2);
            var cap = makeMesh(capGeo, 0xe8e0d0);
            cap.position.set(ax + colPositions[ci], ay + 11.5, az + 6);
            addObject(cap);
        }

        var islandGeo = new THREE.CylinderGeometry(18, 18, 0.3, 16);
        var island = makeMesh(islandGeo, 0x889977);
        island.position.set(ax, ay + 0.15, az);
        addObject(island);
    }

    function buildOxfordCircus() {
        var cx = X_OFFSET;
        var cz = 0;

        var junctionGeo = new THREE.BoxGeometry(80, 0.25, 80);
        var junction = makeMesh(junctionGeo, 0x2d2d2d);
        junction.position.set(cx, 0.1, cz);
        addObject(junction);

        var cornerData = [
            { dx: -30, dz: -30 },
            { dx:  30, dz: -30 },
            { dx: -30, dz:  30 },
            { dx:  30, dz:  30 }
        ];

        var ci2;
        for (ci2 = 0; ci2 < cornerData.length; ci2++) {
            var cd = cornerData[ci2];
            var buildH = 8 * 3.5;
            var bGeo = new THREE.BoxGeometry(18, buildH, 18);
            var bMesh = makeMesh(bGeo, 0x8899aa);
            bMesh.position.set(cx + cd.dx, buildH / 2, cz + cd.dz);
            addObject(bMesh);

            var cornerTrimGeo = new THREE.CylinderGeometry(4, 4, buildH, 6);
            var cornerTrim = makeMesh(cornerTrimGeo, 0x7788aa);
            cornerTrim.position.set(cx + cd.dx, buildH / 2, cz + cd.dz);
            addObject(cornerTrim);

            var entrGeo = new THREE.BoxGeometry(5, 4, 3);
            var entr = makeMesh(entrGeo, 0x223344);
            entr.position.set(cx + cd.dx * 0.6, 2, cz + cd.dz * 0.6);
            addObject(entr);

            var signGeo = new THREE.BoxGeometry(4, 1, 0.3);
            var sign = makeMesh(signGeo, 0xff0000);
            sign.position.set(cx + cd.dx * 0.6, 4.5, cz + cd.dz * 0.6 + 1.5);
            addObject(sign);

            var tubeCircleGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
            var tubeCircle = makeMesh(tubeCircleGeo, 0xee3311);
            tubeCircle.position.set(cx + cd.dx * 0.6, 5.2, cz + cd.dz * 0.6 + 1.5);
            addObject(tubeCircle);

            var barGeo = new THREE.BoxGeometry(1.6, 0.2, 0.2);
            var bar = makeMesh(barGeo, 0x003399);
            bar.position.set(cx + cd.dx * 0.6, 5.2, cz + cd.dz * 0.6 + 1.5);
            addObject(bar);
        }

        var pedestrianPositions = [
            { x: -5, z: -5 }, { x: 5, z: -5 }, { x: -5, z: 5 }, { x: 5, z: 5 },
            { x: -10, z: 0 }, { x: 10, z: 0 }, { x: 0, z: -10 }, { x: 0, z: 10 },
            { x: -3, z: 3 }, { x: 3, z: -3 }
        ];
        var pi;
        for (pi = 0; pi < pedestrianPositions.length; pi++) {
            var pd = pedestrianPositions[pi];
            var bodyG = new THREE.CylinderGeometry(0.15, 0.15, 1.6, 6);
            var bodyM = makeMesh(bodyG, 0x445566 + (pi * 0x111111) % 0x333333);
            bodyM.position.set(cx + pd.x, 0.8, cz + pd.z);
            addObject(bodyM);

            var headG = new THREE.SphereGeometry(0.18, 6, 6);
            var headM = makeMesh(headG, 0xddaa88);
            headM.position.set(cx + pd.x, 1.8, cz + pd.z);
            addObject(headM);
        }
    }

    function buildChristmasLights() {
        var numStrings = 30;
        var streetLen = 1800;
        var startZ = -900;
        var streetWidth = 30;
        var lightHeight = 9;
        var poleHeight = 8;
        var poleSpacing = 60;
        var numPoles = Math.floor(streetLen / poleSpacing) + 1;

        var pi2;
        for (pi2 = 0; pi2 < numPoles; pi2++) {
            var pz = startZ + pi2 * poleSpacing;

            var pole1Geo = new THREE.CylinderGeometry(0.15, 0.18, poleHeight, 6);
            var pole1 = makeMesh(pole1Geo, 0x445544);
            pole1.position.set(X_OFFSET - streetWidth / 2 - 1, poleHeight / 2, pz);
            addObject(pole1);

            var pole2Geo = new THREE.CylinderGeometry(0.15, 0.18, poleHeight, 6);
            var pole2 = makeMesh(pole2Geo, 0x445544);
            pole2.position.set(X_OFFSET + streetWidth / 2 + 1, poleHeight / 2, pz);
            addObject(pole2);
        }

        var si;
        for (si = 0; si < numStrings; si++) {
            var sz = startZ + (si / numStrings) * streetLen + 30;
            var pts = [];
            var numSegPoints = 16;
            var ki;
            for (ki = 0; ki <= numSegPoints; ki++) {
                var t = ki / numSegPoints;
                var lx = (X_OFFSET - streetWidth / 2) + t * streetWidth;
                var lz = sz;
                var sag = 4 * t * (1 - t) * 2.0;
                var ly = lightHeight - sag;
                pts.push(lx, ly, lz);
            }

            var ptsArray = new Float32Array(pts);
            var lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.BufferAttribute(ptsArray, 3));

            var indices = [];
            var ij;
            for (ij = 0; ij < numSegPoints; ij++) {
                indices.push(ij, ij + 1);
            }
            lineGeo.setIndex(indices);

            var lineMat = new THREE.MeshLambertMaterial({ color: 0xffdd44, emissive: 0x886600 });
            var lineSegs = new THREE.LineSegments(lineGeo, lineMat);
            scene.add(lineSegs);
            objects.push(lineSegs);

            var numBulbs = 8;
            var bi;
            for (bi = 0; bi < numBulbs; bi++) {
                var bt = (bi + 0.5) / numBulbs;
                var bx = (X_OFFSET - streetWidth / 2) + bt * streetWidth;
                var bsag = 4 * bt * (1 - bt) * 2.0;
                var by = lightHeight - bsag - 0.3;
                var bz = sz;

                var bulbColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff];
                var bulbColor = bulbColors[bi % bulbColors.length];

                var bulbGeo = new THREE.SphereGeometry(0.18, 6, 6);
                var bulb = makeMesh(bulbGeo, bulbColor, { emissive: bulbColor });
                bulb.position.set(bx, by, bz);
                addObject(bulb);
            }
        }

        var decorPatterns = [
            { z: -700, color: 0xff2200 },
            { z: -300, color: 0xffffff },
            { z:  100, color: 0x00aaff },
            { z:  500, color: 0xffaa00 }
        ];

        var di;
        for (di = 0; di < decorPatterns.length; di++) {
            var dp = decorPatterns[di];
            var starGeo = new THREE.SphereGeometry(0.5, 8, 8);
            var star = makeMesh(starGeo, dp.color, { emissive: dp.color });
            star.position.set(X_OFFSET, lightHeight + 1.5, dp.z);
            addObject(star);
        }
    }

    function buildDoubleDecker(xPos, zPos, angle) {
        var busGroup = new THREE.Object3D();
        busGroup.position.set(xPos, 0, zPos);
        busGroup.rotation.y = angle;

        var lowerGeo = new THREE.BoxGeometry(10, 3, 3.5);
        var lower = new THREE.Mesh(lowerGeo, new THREE.MeshLambertMaterial({ color: 0xcc0000 }));
        lower.position.set(0, 1.5, 0);
        busGroup.add(lower);

        var upperGeo = new THREE.BoxGeometry(9.5, 2.8, 3.3);
        var upper = new THREE.Mesh(upperGeo, new THREE.MeshLambertMaterial({ color: 0xcc0000 }));
        upper.position.set(-0.25, 4.4, 0);
        busGroup.add(upper);

        var roofGeo = new THREE.BoxGeometry(9.5, 0.3, 3.3);
        var roof = new THREE.Mesh(roofGeo, new THREE.MeshLambertMaterial({ color: 0xaa0000 }));
        roof.position.set(-0.25, 5.95, 0);
        busGroup.add(roof);

        var frontWinGeo = new THREE.BoxGeometry(0.15, 2.4, 2.8);
        var frontWin = new THREE.Mesh(frontWinGeo, new THREE.MeshLambertMaterial({ color: 0x99ccee }));
        frontWin.position.set(5.08, 4.4, 0);
        busGroup.add(frontWin);

        var lowerFrontWinGeo = new THREE.BoxGeometry(0.15, 2.0, 2.8);
        var lowerFrontWin = new THREE.Mesh(lowerFrontWinGeo, new THREE.MeshLambertMaterial({ color: 0x99ccee }));
        lowerFrontWin.position.set(5.08, 1.8, 0);
        busGroup.add(lowerFrontWin);

        var wheelPositions = [
            { x: -3.5, z: -1.9 }, { x: -3.5, z:  1.9 },
            { x:  3.5, z: -1.9 }, { x:  3.5, z:  1.9 }
        ];
        var wi;
        for (wi = 0; wi < wheelPositions.length; wi++) {
            var wp = wheelPositions[wi];
            var wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 10);
            var wheel = new THREE.Mesh(wheelGeo, new THREE.MeshLambertMaterial({ color: 0x111111 }));
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(wp.x, 0.6, wp.z);
            busGroup.add(wheel);
        }

        var routeNumGeo = new THREE.BoxGeometry(2, 1, 0.2);
        var routeNum = new THREE.Mesh(routeNumGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }));
        routeNum.position.set(5.1, 5.4, 0);
        busGroup.add(routeNum);

        var headlightGeo = new THREE.BoxGeometry(0.2, 0.4, 0.6);
        var headlight = new THREE.Mesh(headlightGeo, new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0x887744 }));
        headlight.position.set(5.1, 1, 1.2);
        busGroup.add(headlight);

        var headlight2Geo = new THREE.BoxGeometry(0.2, 0.4, 0.6);
        var headlight2 = new THREE.Mesh(headlight2Geo, new THREE.MeshLambertMaterial({ color: 0xffffcc, emissive: 0x887744 }));
        headlight2.position.set(5.1, 1, -1.2);
        busGroup.add(headlight2);

        scene.add(busGroup);
        objects.push(busGroup);
    }

    function buildBuses() {
        buildDoubleDecker(X_OFFSET - 8, -400, 0);
        buildDoubleDecker(X_OFFSET - 8, -100, 0);
        buildDoubleDecker(X_OFFSET + 8, 200, Math.PI);
        buildDoubleDecker(X_OFFSET + 8, 600, Math.PI);
    }

    function buildStreetLights() {
        var lightPositions = [];
        var li;
        for (li = -10; li <= 10; li++) {
            lightPositions.push({ x: X_OFFSET - 22, z: li * 100 });
            lightPositions.push({ x: X_OFFSET + 22, z: li * 100 });
        }

        var lii;
        for (lii = 0; lii < lightPositions.length; lii++) {
            var lp = lightPositions[lii];

            var poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 7, 6);
            var pole = makeMesh(poleGeo, 0x666666);
            pole.position.set(lp.x, 3.5, lp.z);
            addObject(pole);

            var armGeo = new THREE.BoxGeometry(2, 0.1, 0.1);
            var arm = makeMesh(armGeo, 0x666666);
            var armX = lp.x < X_OFFSET ? lp.x + 1 : lp.x - 1;
            arm.position.set(armX, 7, lp.z);
            addObject(arm);

            var lampGeo = new THREE.SphereGeometry(0.3, 8, 6);
            var lamp = makeMesh(lampGeo, 0xffffdd, { emissive: 0x998833 });
            var lampX = lp.x < X_OFFSET ? lp.x + 2 : lp.x - 2;
            lamp.position.set(lampX, 6.8, lp.z);
            addObject(lamp);
        }
    }

    function buildUndergroundSignage() {
        var positions = [
            { x: X_OFFSET - 22, z: -50 },
            { x: X_OFFSET + 22, z: -50 },
            { x: X_OFFSET - 22, z: 50 },
            { x: X_OFFSET + 22, z: 50 }
        ];

        var ui;
        for (ui = 0; ui < positions.length; ui++) {
            var up = positions[ui];

            var postGeo = new THREE.CylinderGeometry(0.08, 0.08, 3, 6);
            var post = makeMesh(postGeo, 0x888888);
            post.position.set(up.x, 1.5, up.z);
            addObject(post);

            var ringGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.25, 12);
            var ring = makeMesh(ringGeo, 0xee2211);
            ring.position.set(up.x, 3, up.z);
            addObject(ring);

            var innerGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.26, 12);
            var inner = makeMesh(innerGeo, 0x003399);
            inner.position.set(up.x, 3, up.z);
            addObject(inner);

            var barGeo = new THREE.BoxGeometry(1.8, 0.28, 0.2);
            var barMesh = makeMesh(barGeo, 0x003399);
            barMesh.position.set(up.x, 3, up.z);
            addObject(barMesh);
        }
    }

    function build() {
        buildRoad();
        buildShops();
        buildSelfridges();
        buildJohnLewis();
        buildMarbleArch();
        buildOxfordCircus();
        buildChristmasLights();
        buildBuses();
        buildStreetLights();
        buildUndergroundSignage();
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
