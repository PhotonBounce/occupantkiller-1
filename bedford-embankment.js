window.BedfordEmbankment = (function() {
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

    function makeLambert(color, opts) {
        var params = { color: color };
        if (opts) {
            for (var k in opts) {
                if (opts.hasOwnProperty(k)) params[k] = opts[k];
            }
        }
        return new THREE.MeshLambertMaterial(params);
    }

    function buildRiver() {
        var riverGeo = new THREE.BoxGeometry(600, 1, 80);
        var riverMat = makeLambert(0x2255aa, { transparent: true, opacity: 0.75 });
        var river = new THREE.Mesh(riverGeo, riverMat);
        river.position.set(12520, -1, 0);
        addMesh(river);

        // Weir structure
        var weirGeo = new THREE.BoxGeometry(80, 3, 80);
        var weirMat = makeLambert(0x888888);
        var weir = new THREE.Mesh(weirGeo, weirMat);
        weir.position.set(12420, 0.5, 0);
        addMesh(weir);

        // Weir drop edge
        var weirEdgeGeo = new THREE.BoxGeometry(80, 1, 4);
        var weirEdgeMat = makeLambert(0xaaaacc);
        var weirEdge = new THREE.Mesh(weirEdgeGeo, weirEdgeMat);
        weirEdge.position.set(12420, 2, 40);
        addMesh(weirEdge);
    }

    function buildPromenade() {
        // Embankment path
        var pathGeo = new THREE.BoxGeometry(600, 0.5, 20);
        var pathMat = makeLambert(0xbbaa88);
        var path = new THREE.Mesh(pathGeo, pathMat);
        path.position.set(12520, 0, 55);
        addMesh(path);

        // Grass strip along embankment
        var grassGeo = new THREE.BoxGeometry(600, 0.4, 30);
        var grassMat = makeLambert(0x448833);
        var grass = new THREE.Mesh(grassGeo, grassMat);
        grass.position.set(12520, 0, 80);
        addMesh(grass);

        // Trees along promenade
        var treePositions = [
            12320, 12360, 12400, 12440, 12480,
            12520, 12560, 12600, 12640, 12680, 12720
        ];
        for (var t = 0; t < treePositions.length; t++) {
            var trunkGeo = new THREE.CylinderGeometry(0.5, 0.7, 5, 6);
            var trunkMat = makeLambert(0x5c3a1a);
            var trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(treePositions[t], 2.5, 70);
            addMesh(trunk);

            var canopyGeo = new THREE.SphereGeometry(4, 7, 5);
            var canopyMat = makeLambert(0x336622);
            var canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.set(treePositions[t], 8, 70);
            addMesh(canopy);
        }

        // Rowing boats on river
        var boatColors = [0xcc4422, 0x2244cc, 0x228833, 0xccaa22];
        var boatXPositions = [12460, 12500, 12540, 12580];
        for (var b = 0; b < 4; b++) {
            var boatGeo = new THREE.BoxGeometry(6, 1.5, 2);
            var boatMat = makeLambert(boatColors[b]);
            var boat = new THREE.Mesh(boatGeo, boatMat);
            boat.position.set(boatXPositions[b], 0.5, (b % 2 === 0) ? -10 : -20);
            addMesh(boat);

            // Oar
            var oarGeo = new THREE.BoxGeometry(8, 0.2, 0.2);
            var oarMat = makeLambert(0xaa8855);
            var oar = new THREE.Mesh(oarGeo, oarMat);
            oar.position.set(boatXPositions[b], 1.5, (b % 2 === 0) ? -10 : -20);
            oar.rotation.y = 0.3;
            addMesh(oar);
        }

        // Benches
        var benchXPositions = [12350, 12450, 12550, 12650];
        for (var bn = 0; bn < 4; bn++) {
            var seatGeo = new THREE.BoxGeometry(3, 0.3, 1);
            var seatMat = makeLambert(0x7a5c3a);
            var seat = new THREE.Mesh(seatGeo, seatMat);
            seat.position.set(benchXPositions[bn], 1.2, 58);
            addMesh(seat);

            var legGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
            var legMat = makeLambert(0x555555);
            for (var lg = 0; lg < 2; lg++) {
                var leg = new THREE.Mesh(legGeo, legMat);
                leg.position.set(benchXPositions[bn] + (lg === 0 ? -1 : 1), 0.6, 58);
                addMesh(leg);
            }
        }
    }

    function buildCastleMound() {
        // Norman earthwork mound
        var moundGeo = new THREE.CylinderGeometry(20, 35, 18, 12);
        var moundMat = makeLambert(0x6b5a3e);
        var mound = new THREE.Mesh(moundGeo, moundMat);
        mound.position.set(12300, 9, 130);
        addMesh(mound);

        // Grass on mound top
        var moundTopGeo = new THREE.CylinderGeometry(18, 20, 1, 12);
        var moundTopMat = makeLambert(0x4a7a30);
        var moundTop = new THREE.Mesh(moundTopGeo, moundTopMat);
        moundTop.position.set(12300, 18.5, 130);
        addMesh(moundTop);

        // Ruined keep walls — four wall sections
        var wallSegments = [
            { x: 12300, z: 115, rx: 0, ry: 0, wx: 20, wz: 2 },
            { x: 12300, z: 145, rx: 0, ry: 0, wx: 20, wz: 2 },
            { x: 12288, z: 130, rx: 0, ry: 0, wx: 2, wz: 30 },
            { x: 12312, z: 130, rx: 0, ry: 0, wx: 2, wz: 30 }
        ];
        for (var w = 0; w < wallSegments.length; w++) {
            var ws = wallSegments[w];
            var wallGeo = new THREE.BoxGeometry(ws.wx, 8, ws.wz);
            var wallMat = makeLambert(0x888070);
            var wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(ws.x, 23, ws.z);
            addMesh(wall);
        }

        // Ruined corner towers (partial)
        var cornerOffsets = [
            { dx: -10, dz: -15 },
            { dx: 10, dz: -15 },
            { dx: -10, dz: 15 },
            { dx: 10, dz: 15 }
        ];
        for (var c = 0; c < 4; c++) {
            var co = cornerOffsets[c];
            var towerGeo = new THREE.CylinderGeometry(2.5, 2.5, 10, 7);
            var towerMat = makeLambert(0x777060);
            var tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.set(12300 + co.dx, 24, 130 + co.dz);
            addMesh(tower);
        }

        // Castle path up mound
        var pathUpGeo = new THREE.BoxGeometry(4, 0.3, 38);
        var pathUpMat = makeLambert(0xaa9977);
        var pathUp = new THREE.Mesh(pathUpGeo, pathUpMat);
        pathUp.position.set(12300, 9.2, 110);
        pathUp.rotation.x = -0.25;
        addMesh(pathUp);
    }

    function buildBunyanMuseum() {
        // Main building body
        var bodyGeo = new THREE.BoxGeometry(22, 10, 15);
        var bodyMat = makeLambert(0xc8b89a);
        var body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(12600, 5, 130);
        addMesh(body);

        // Roof
        var roofGeo = new THREE.BoxGeometry(24, 2, 17);
        var roofMat = makeLambert(0x8a6a4a);
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(12600, 11, 130);
        addMesh(roof);

        // Gable ends (triangular approximation with a thin box)
        var gableFrontGeo = new THREE.ConeGeometry(12, 5, 4);
        var gableMat = makeLambert(0xc8b89a);
        var gableFront = new THREE.Mesh(gableFrontGeo, gableMat);
        gableFront.rotation.y = Math.PI / 4;
        gableFront.position.set(12600, 15, 122);
        addMesh(gableFront);

        // Bronze doors (dark bronze colour)
        var doorGeo = new THREE.BoxGeometry(3, 5, 0.4);
        var doorMat = makeLambert(0x5a4010);
        var door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(12600, 2.5, 122.2);
        addMesh(door);

        // Door panel relief (Pilgrim's Progress scenes represented as raised panels)
        var panelPositions = [-0.8, 0.8];
        for (var p = 0; p < 2; p++) {
            var panelGeo = new THREE.BoxGeometry(1, 1.5, 0.15);
            var panelMat = makeLambert(0x7a5a20);
            var panel = new THREE.Mesh(panelGeo, panelMat);
            panel.position.set(12600 + panelPositions[p], 2.8, 122.0);
            addMesh(panel);
        }

        // Windows
        var winXPositions = [12589, 12600, 12611];
        for (var wi = 0; wi < 3; wi++) {
            var winGeo = new THREE.BoxGeometry(2.5, 3, 0.3);
            var winMat = makeLambert(0xaaccee);
            var win = new THREE.Mesh(winGeo, winMat);
            win.position.set(winXPositions[wi], 6, 122.2);
            addMesh(win);
        }

        // Sign above door
        var signGeo = new THREE.BoxGeometry(8, 1.2, 0.2);
        var signMat = makeLambert(0x3a2a0a);
        var sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(12600, 10.5, 122.2);
        addMesh(sign);

        // Steps up to entrance
        var stepWidths = [5, 4, 3];
        var stepDepths = [1.5, 1.5, 1.5];
        for (var s = 0; s < 3; s++) {
            var stepGeo = new THREE.BoxGeometry(stepWidths[s], 0.4, stepDepths[s]);
            var stepMat = makeLambert(0xbbaa88);
            var step = new THREE.Mesh(stepGeo, stepMat);
            step.position.set(12600, 0.4 * (s + 1) - 0.2, 122 - (s * 1.5));
            addMesh(step);
        }
    }

    function buildTownBridge() {
        // Main bridge deck
        var deckGeo = new THREE.BoxGeometry(20, 1.5, 80);
        var deckMat = makeLambert(0xaaaaaa);
        var deck = new THREE.Mesh(deckGeo, deckMat);
        deck.position.set(12520, 1.5, 0);
        addMesh(deck);

        // Stone bridge piers in the river
        var pierXPositions = [12510, 12520, 12530];
        for (var pr = 0; pr < 3; pr++) {
            var pierGeo = new THREE.BoxGeometry(3, 5, 6);
            var pierMat = makeLambert(0x999988);
            var pier = new THREE.Mesh(pierGeo, pierMat);
            pier.position.set(pierXPositions[pr], -0.5, 0);
            addMesh(pier);
        }

        // Suspension towers
        var towerXPositions = [12508, 12532];
        for (var st = 0; st < 2; st++) {
            var suspTowerGeo = new THREE.BoxGeometry(2, 16, 2);
            var suspTowerMat = makeLambert(0x666655);
            var suspTower = new THREE.Mesh(suspTowerGeo, suspTowerMat);
            suspTower.position.set(towerXPositions[st], 9, 0);
            addMesh(suspTower);

            // Tower cap
            var capGeo = new THREE.BoxGeometry(4, 1.5, 4);
            var capMat = makeLambert(0x555544);
            var cap = new THREE.Mesh(capGeo, capMat);
            cap.position.set(towerXPositions[st], 17.5, 0);
            addMesh(cap);
        }

        // Suspension cables (represented as thin elongated boxes)
        var cableGeo = new THREE.BoxGeometry(26, 0.3, 0.3);
        var cableMat = makeLambert(0x444444);
        var cableLeft = new THREE.Mesh(cableGeo, cableMat);
        cableLeft.position.set(12520, 16, -2);
        addMesh(cableLeft);

        var cableRight = new THREE.Mesh(cableGeo.clone(), cableMat);
        cableRight.position.set(12520, 16, 2);
        addMesh(cableRight);

        // Handrails
        var railGeo = new THREE.BoxGeometry(20, 0.3, 0.3);
        var railMat = makeLambert(0x555555);
        var railLeft = new THREE.Mesh(railGeo, railMat);
        railLeft.position.set(12520, 2.5, -9);
        addMesh(railLeft);

        var railRight = new THREE.Mesh(railGeo.clone(), railMat);
        railRight.position.set(12520, 2.5, 9);
        addMesh(railRight);

        // Ornate ironwork posts along the bridge
        var postXPositions = [12512, 12516, 12520, 12524, 12528];
        for (var ip = 0; ip < postXPositions.length; ip++) {
            var postLeftGeo = new THREE.CylinderGeometry(0.2, 0.2, 2, 5);
            var postMat = makeLambert(0x333333);
            var postLeft = new THREE.Mesh(postLeftGeo, postMat);
            postLeft.position.set(postXPositions[ip], 2.3, -9);
            addMesh(postLeft);

            var postRight = new THREE.Mesh(postLeftGeo.clone(), postMat);
            postRight.position.set(postXPositions[ip], 2.3, 9);
            addMesh(postRight);
        }

        // Road approach south
        var approachSGeo = new THREE.BoxGeometry(20, 0.5, 30);
        var approachMat = makeLambert(0x999988);
        var approachS = new THREE.Mesh(approachSGeo, approachMat);
        approachS.position.set(12520, 0.25, -55);
        addMesh(approachS);

        // Road approach north
        var approachNGeo = new THREE.BoxGeometry(20, 0.5, 30);
        var approachN = new THREE.Mesh(approachNGeo, approachMat);
        approachN.position.set(12520, 0.25, 55);
        addMesh(approachN);
    }

    function buildTownCentre() {
        // Ground plane for town centre
        var groundGeo = new THREE.BoxGeometry(200, 0.5, 120);
        var groundMat = makeLambert(0xbbaa88);
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.set(12520, -0.25, 170);
        addMesh(ground);

        // St Paul's Square — open paved area
        var squareGeo = new THREE.BoxGeometry(60, 0.3, 60);
        var squareMat = makeLambert(0xccbbaa);
        var square = new THREE.Mesh(squareGeo, squareMat);
        square.position.set(12520, 0.15, 150);
        addMesh(square);

        // St Paul's Church in the square
        var churchBodyGeo = new THREE.BoxGeometry(16, 14, 22);
        var churchMat = makeLambert(0xd4c8b0);
        var churchBody = new THREE.Mesh(churchBodyGeo, churchMat);
        churchBody.position.set(12520, 7, 150);
        addMesh(churchBody);

        var churchTowerGeo = new THREE.BoxGeometry(7, 22, 7);
        var churchTowerMat = makeLambert(0xc8bc9a);
        var churchTower = new THREE.Mesh(churchTowerGeo, churchTowerMat);
        churchTower.position.set(12520, 11, 139);
        addMesh(churchTower);

        var spireGeo = new THREE.ConeGeometry(3, 10, 4);
        var spireMat = makeLambert(0xb0a48c);
        var spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.set(12520, 27, 139);
        addMesh(spire);

        // Corn Exchange building
        var cornExGeo = new THREE.BoxGeometry(25, 12, 20);
        var cornExMat = makeLambert(0xe0d0b0);
        var cornEx = new THREE.Mesh(cornExGeo, cornExMat);
        cornEx.position.set(12570, 6, 175);
        addMesh(cornEx);

        // Corn Exchange dome
        var domeGeo = new THREE.SphereGeometry(8, 10, 6);
        var domeMat = makeLambert(0x778866);
        var dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(12570, 18, 175);
        addMesh(dome);

        // Portico columns on Corn Exchange
        var colXPositions = [12558, 12562, 12566, 12570, 12574, 12578, 12582];
        for (var col = 0; col < 7; col++) {
            var colGeo = new THREE.CylinderGeometry(0.6, 0.6, 10, 6);
            var colMat = makeLambert(0xddcfae);
            var column = new THREE.Mesh(colGeo, colMat);
            column.position.set(colXPositions[col], 5, 164);
            addMesh(column);
        }

        // Georgian buildings row north side of square
        var georgianWidths = [18, 14, 16, 18];
        var georgianXStarts = [12470, 12490, 12506, 12524];
        var georgianHeights = [10, 11, 9, 10];
        for (var g = 0; g < 4; g++) {
            var geoG = new THREE.BoxGeometry(georgianWidths[g], georgianHeights[g], 14);
            var matG = makeLambert(0xddccaa);
            var gBuilding = new THREE.Mesh(geoG, matG);
            gBuilding.position.set(georgianXStarts[g] + georgianWidths[g] / 2, georgianHeights[g] / 2, 200);
            addMesh(gBuilding);

            // Roofline
            var roofGG = new THREE.BoxGeometry(georgianWidths[g] + 1, 1.5, 15);
            var roofMatG = makeLambert(0x998877);
            var roofG = new THREE.Mesh(roofGG, roofMatG);
            roofG.position.set(georgianXStarts[g] + georgianWidths[g] / 2, georgianHeights[g] + 0.75, 200);
            addMesh(roofG);

            // Windows two rows
            for (var wr = 0; wr < 2; wr++) {
                for (var wc = 0; wc < 3; wc++) {
                    var gwGeo = new THREE.BoxGeometry(2, 2.5, 0.3);
                    var gwMat = makeLambert(0x99bbdd);
                    var gw = new THREE.Mesh(gwGeo, gwMat);
                    gw.position.set(
                        georgianXStarts[g] + 3 + wc * (georgianWidths[g] / 3.5),
                        2.5 + wr * 3.5,
                        193.1
                    );
                    addMesh(gw);
                }
            }
        }

        // Market stalls in the square
        var stallXPositions = [12500, 12515, 12530, 12545];
        var stallColors = [0xcc5522, 0x2255cc, 0x55aa22, 0xaaaa22];
        for (var ms = 0; ms < 4; ms++) {
            var stallGeo = new THREE.BoxGeometry(5, 0.3, 3);
            var stallMat = makeLambert(0xdddddd);
            var stall = new THREE.Mesh(stallGeo, stallMat);
            stall.position.set(stallXPositions[ms], 1.5, 160);
            addMesh(stall);

            // Stall canopy
            var canopyGeo = new THREE.BoxGeometry(6, 0.2, 4);
            var canopyMat = makeLambert(stallColors[ms]);
            var stallCanopy = new THREE.Mesh(canopyGeo, canopyMat);
            stallCanopy.position.set(stallXPositions[ms], 2.8, 160);
            addMesh(stallCanopy);

            // Stall legs
            for (var sl = 0; sl < 4; sl++) {
                var slegGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 4);
                var slegMat = makeLambert(0x777777);
                var sleg = new THREE.Mesh(slegGeo, slegMat);
                sleg.position.set(
                    stallXPositions[ms] + (sl % 2 === 0 ? -2 : 2),
                    0.5,
                    160 + (sl < 2 ? -1 : 1)
                );
                addMesh(sleg);
            }
        }

        // Street lamps in town centre
        var lampPositions = [
            { x: 12490, z: 155 },
            { x: 12555, z: 155 },
            { x: 12490, z: 185 },
            { x: 12555, z: 185 }
        ];
        for (var lp = 0; lp < lampPositions.length; lp++) {
            var lampPostGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 5);
            var lampPostMat = makeLambert(0x444444);
            var lampPost = new THREE.Mesh(lampPostGeo, lampPostMat);
            lampPost.position.set(lampPositions[lp].x, 4, lampPositions[lp].z);
            addMesh(lampPost);

            var lampHeadGeo = new THREE.SphereGeometry(0.8, 6, 4);
            var lampHeadMat = makeLambert(0xffffcc);
            var lampHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
            lampHead.position.set(lampPositions[lp].x, 8.5, lampPositions[lp].z);
            addMesh(lampHead);
        }
    }

    function build() {
        buildRiver();
        buildPromenade();
        buildCastleMound();
        buildBunyanMuseum();
        buildTownBridge();
        buildTownCentre();
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
