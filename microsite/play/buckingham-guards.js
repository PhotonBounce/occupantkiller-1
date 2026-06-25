window.BuckinghamGuards = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11560;

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

    function makeMesh(geometry, material) {
        return new THREE.Mesh(geometry, material);
    }

    function buildPalace() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xf0ece0 });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0xd4cfc0 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xb0a898 });
        var ironMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var goldMat = new THREE.MeshLambertMaterial({ color: 0xd4aa00 });

        // Central range (long main block)
        var centralRange = makeMesh(new THREE.BoxGeometry(80, 16, 16), stoneMat);
        centralRange.position.set(X_OFFSET, 8, 0);
        addMesh(centralRange);

        // Central range roof
        var centralRoof = makeMesh(new THREE.BoxGeometry(80, 2, 16), roofMat);
        centralRoof.position.set(X_OFFSET, 17, 0);
        addMesh(centralRoof);

        // East wing facade (wider front block)
        var eastWing = makeMesh(new THREE.BoxGeometry(82, 18, 8), stoneMat);
        eastWing.position.set(X_OFFSET, 9, -12);
        addMesh(eastWing);

        // East wing roof
        var eastWingRoof = makeMesh(new THREE.BoxGeometry(82, 2, 8), roofMat);
        eastWingRoof.position.set(X_OFFSET, 19, -12);
        addMesh(eastWingRoof);

        // Left side wing
        var leftWing = makeMesh(new THREE.BoxGeometry(12, 16, 22), stoneMat);
        leftWing.position.set(X_OFFSET - 46, 8, -3);
        addMesh(leftWing);

        // Right side wing
        var rightWing = makeMesh(new THREE.BoxGeometry(12, 16, 22), stoneMat);
        rightWing.position.set(X_OFFSET + 46, 8, -3);
        addMesh(rightWing);

        // Central pediment (triangular top)
        var pedimentBase = makeMesh(new THREE.BoxGeometry(24, 2, 2), stoneMat);
        pedimentBase.position.set(X_OFFSET, 20, -16);
        addMesh(pedimentBase);

        var pedimentLeft = makeMesh(new THREE.BoxGeometry(12, 6, 2), stoneMat);
        pedimentLeft.position.set(X_OFFSET - 6, 23, -16);
        addMesh(pedimentLeft);

        var pedimentRight = makeMesh(new THREE.BoxGeometry(12, 6, 2), stoneMat);
        pedimentRight.position.set(X_OFFSET + 6, 23, -16);
        addMesh(pedimentRight);

        var pedimentTop = makeMesh(new THREE.BoxGeometry(4, 4, 2), stoneMat);
        pedimentTop.position.set(X_OFFSET, 27, -16);
        addMesh(pedimentTop);

        // Balcony (central)
        var balcony = makeMesh(new THREE.BoxGeometry(10, 1, 3), darkStoneMat);
        balcony.position.set(X_OFFSET, 11, -16.5);
        addMesh(balcony);

        var balconyRail = makeMesh(new THREE.BoxGeometry(10, 2, 0.3), ironMat);
        balconyRail.position.set(X_OFFSET, 12.5, -18);
        addMesh(balconyRail);

        // Pilasters along facade (columns)
        for (var pi = -3; pi <= 3; pi++) {
            var pilaster = makeMesh(new THREE.BoxGeometry(1.2, 18, 1.2), stoneMat);
            pilaster.position.set(X_OFFSET + pi * 6, 9, -16.5);
            addMesh(pilaster);
        }

        // Wrought-iron gates and railings
        // Gate posts
        var gatePostMat = ironMat;
        for (var gp = -4; gp <= 4; gp++) {
            var gatePost = makeMesh(new THREE.BoxGeometry(0.8, 6, 0.8), gatePostMat);
            gatePost.position.set(X_OFFSET + gp * 8, 3, -24);
            addMesh(gatePost);

            var gateOrb = makeMesh(new THREE.SphereGeometry(0.6, 6, 6), goldMat);
            gateOrb.position.set(X_OFFSET + gp * 8, 6.6, -24);
            addMesh(gateOrb);
        }

        // Gate railings (horizontal bars)
        for (var gr = 0; gr < 5; gr++) {
            var railing = makeMesh(new THREE.BoxGeometry(64, 0.3, 0.3), ironMat);
            railing.position.set(X_OFFSET, 1 + gr * 1.0, -24);
            addMesh(railing);
        }

        // Gate vertical bars
        for (var gv = -16; gv <= 16; gv++) {
            var bar = makeMesh(new THREE.BoxGeometry(0.2, 5, 0.2), ironMat);
            bar.position.set(X_OFFSET + gv * 2, 2.5, -24);
            addMesh(bar);
        }

        // Forecourt ground
        var forecourt = makeMesh(new THREE.BoxGeometry(90, 0.5, 20), darkStoneMat);
        forecourt.position.set(X_OFFSET, 0.25, -14);
        addMesh(forecourt);
    }

    function buildVictoriaMemorial() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
        var goldMat = new THREE.MeshLambertMaterial({ color: 0xd4aa00 });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x4488aa });
        var bronzeMat = new THREE.MeshLambertMaterial({ color: 0x7a6040 });

        // Base circular platform
        var base = makeMesh(new THREE.CylinderGeometry(14, 15, 1.5, 16), stoneMat);
        base.position.set(X_OFFSET, 0.75, -38);
        addMesh(base);

        // Water basin (outer ring)
        var basin = makeMesh(new THREE.CylinderGeometry(13, 13, 0.8, 16), waterMat);
        basin.position.set(X_OFFSET, 1.4, -38);
        addMesh(basin);

        // Inner basin wall
        var basinWall = makeMesh(new THREE.CylinderGeometry(10, 10, 1.2, 16), stoneMat);
        basinWall.position.set(X_OFFSET, 1.1, -38);
        addMesh(basinWall);

        // Main pedestal (octagonal approximated)
        var pedestal1 = makeMesh(new THREE.CylinderGeometry(6, 7, 4, 8), stoneMat);
        pedestal1.position.set(X_OFFSET, 3.5, -38);
        addMesh(pedestal1);

        var pedestal2 = makeMesh(new THREE.CylinderGeometry(4.5, 6, 3, 8), stoneMat);
        pedestal2.position.set(X_OFFSET, 7, -38);
        addMesh(pedestal2);

        var pedestal3 = makeMesh(new THREE.CylinderGeometry(3, 4.5, 3, 8), stoneMat);
        pedestal3.position.set(X_OFFSET, 10, -38);
        addMesh(pedestal3);

        // Victoria statue (seated figure approximated)
        var victoriaBody = makeMesh(new THREE.BoxGeometry(3, 4, 3), bronzeMat);
        victoriaBody.position.set(X_OFFSET, 13.5, -38);
        addMesh(victoriaBody);

        var victoriaHead = makeMesh(new THREE.SphereGeometry(0.9, 8, 8), bronzeMat);
        victoriaHead.position.set(X_OFFSET, 16.4, -38);
        addMesh(victoriaHead);

        // Crown on Victoria
        var crown = makeMesh(new THREE.CylinderGeometry(0.5, 0.7, 0.8, 8), goldMat);
        crown.position.set(X_OFFSET, 17.2, -38);
        addMesh(crown);

        // Tall column above Victoria
        var column = makeMesh(new THREE.CylinderGeometry(1.2, 1.5, 8, 8), stoneMat);
        column.position.set(X_OFFSET, 22, -38);
        addMesh(column);

        // Victory figure at top
        var victoryBody = makeMesh(new THREE.CylinderGeometry(0.6, 0.9, 3, 8), goldMat);
        victoryBody.position.set(X_OFFSET, 27.5, -38);
        addMesh(victoryBody);

        var victoryHead = makeMesh(new THREE.SphereGeometry(0.5, 8, 8), goldMat);
        victoryHead.position.set(X_OFFSET, 29.5, -38);
        addMesh(victoryHead);

        // Gold orb
        var orb = makeMesh(new THREE.SphereGeometry(0.7, 8, 8), goldMat);
        orb.position.set(X_OFFSET, 31, -38);
        addMesh(orb);

        // Allegorical groups around base (4 groups)
        var groupAngles = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
        for (var ag = 0; ag < groupAngles.length; ag++) {
            var angle = groupAngles[ag];
            var gx = X_OFFSET + Math.sin(angle) * 8;
            var gz = -38 + Math.cos(angle) * 8;

            var figBody = makeMesh(new THREE.BoxGeometry(1.5, 3, 1.5), bronzeMat);
            figBody.position.set(gx, 2.5, gz);
            addMesh(figBody);

            var figHead = makeMesh(new THREE.SphereGeometry(0.5, 6, 6), bronzeMat);
            figHead.position.set(gx, 4.5, gz);
            addMesh(figHead);
        }
    }

    function buildGuards() {
        var redMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var skinMat = new THREE.MeshLambertMaterial({ color: 0xf5c8a0 });
        var navyMat = new THREE.MeshLambertMaterial({ color: 0x222244 });
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xd4cfc0 });
        var darkWoodMat = new THREE.MeshLambertMaterial({ color: 0x5c3a1e });

        // 8 Foot Guards in a row
        for (var g = 0; g < 8; g++) {
            var gx = X_OFFSET - 21 + g * 6;
            var gz = -20;

            // Legs (navy trousers)
            var legs = makeMesh(new THREE.BoxGeometry(1.0, 3, 1.0), navyMat);
            legs.position.set(gx, 1.5, gz);
            addMesh(legs);

            // Body (red tunic)
            var body = makeMesh(new THREE.BoxGeometry(1.4, 3.5, 1.0), redMat);
            body.position.set(gx, 4.75, gz);
            addMesh(body);

            // White belt
            var belt = makeMesh(new THREE.BoxGeometry(1.5, 0.3, 1.1), new THREE.MeshLambertMaterial({ color: 0xffffff }));
            belt.position.set(gx, 3.8, gz);
            addMesh(belt);

            // Head (face)
            var head = makeMesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), skinMat);
            head.position.set(gx, 7.0, gz);
            addMesh(head);

            // Bearskin hat
            var bearBase = makeMesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 8), blackMat);
            bearBase.position.set(gx, 7.65, gz);
            addMesh(bearBase);

            var bearTall = makeMesh(new THREE.CylinderGeometry(0.5, 0.55, 2.2, 8), blackMat);
            bearTall.position.set(gx, 8.75, gz);
            addMesh(bearTall);

            var bearTop = makeMesh(new THREE.CylinderGeometry(0.3, 0.5, 0.3, 8), blackMat);
            bearTop.position.set(gx, 9.95, gz);
            addMesh(bearTop);

            // Rifle (approximated)
            var rifle = makeMesh(new THREE.BoxGeometry(0.15, 4, 0.15), darkWoodMat);
            rifle.position.set(gx + 0.8, 4.5, gz);
            addMesh(rifle);
        }

        // Sentry boxes (3)
        var sentryPositions = [
            { x: X_OFFSET - 26, z: -20 },
            { x: X_OFFSET, z: -20 },
            { x: X_OFFSET + 26, z: -20 }
        ];

        for (var sb = 0; sb < sentryPositions.length; sb++) {
            var sx = sentryPositions[sb].x;
            var sz = sentryPositions[sb].z;

            // Box body
            var boxBody = makeMesh(new THREE.BoxGeometry(3, 7, 3), stoneMat);
            boxBody.position.set(sx, 3.5, sz);
            addMesh(boxBody);

            // Roof
            var boxRoof = makeMesh(new THREE.ConeGeometry(2.4, 2, 4), blackMat);
            boxRoof.position.set(sx, 8, sz);
            addMesh(boxRoof);

            // Door arch (dark cutout approximated)
            var door = makeMesh(new THREE.BoxGeometry(1.4, 4, 0.3), blackMat);
            door.position.set(sx, 2.5, sz - 1.6);
            addMesh(door);
        }
    }

    function buildStJamesPark() {
        var grassMat = new THREE.MeshLambertMaterial({ color: 0x4a7c3f });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x3366aa });
        var pathMat = new THREE.MeshLambertMaterial({ color: 0xc8b89a });
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var beigeBeakMat = new THREE.MeshLambertMaterial({ color: 0xffaa44 });
        var trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4226 });
        var leafMat = new THREE.MeshLambertMaterial({ color: 0x2d6a2d });
        var lampMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        // Park ground
        var parkGround = makeMesh(new THREE.BoxGeometry(160, 0.5, 70), grassMat);
        parkGround.position.set(X_OFFSET + 20, 0.25, -80);
        addMesh(parkGround);

        // Lake (ornate, irregular approximated with overlapping boxes)
        var lakeMain = makeMesh(new THREE.BoxGeometry(60, 0.4, 30), waterMat);
        lakeMain.position.set(X_OFFSET + 20, 0.45, -80);
        addMesh(lakeMain);

        var lakeLeft = makeMesh(new THREE.BoxGeometry(20, 0.4, 20), waterMat);
        lakeLeft.position.set(X_OFFSET - 10, 0.45, -75);
        addMesh(lakeLeft);

        var lakeRight = makeMesh(new THREE.BoxGeometry(20, 0.4, 20), waterMat);
        lakeRight.position.set(X_OFFSET + 50, 0.45, -85);
        addMesh(lakeRight);

        // Blue Bridge over lake
        var bridgeDeck = makeMesh(new THREE.BoxGeometry(8, 0.6, 34), bridgeMat);
        bridgeDeck.position.set(X_OFFSET + 20, 1.3, -80);
        addMesh(bridgeDeck);

        // Bridge railings
        var bridgeRailLeft = makeMesh(new THREE.BoxGeometry(0.4, 1.2, 34), new THREE.MeshLambertMaterial({ color: 0x555577 }));
        bridgeRailLeft.position.set(X_OFFSET + 16, 2.3, -80);
        addMesh(bridgeRailLeft);

        var bridgeRailRight = makeMesh(new THREE.BoxGeometry(0.4, 1.2, 34), new THREE.MeshLambertMaterial({ color: 0x555577 }));
        bridgeRailRight.position.set(X_OFFSET + 24, 2.3, -80);
        addMesh(bridgeRailRight);

        // Pelicans (3)
        var pelicanPositions = [
            { x: X_OFFSET - 5, z: -70 },
            { x: X_OFFSET + 10, z: -72 },
            { x: X_OFFSET + 35, z: -88 }
        ];

        for (var pl = 0; pl < pelicanPositions.length; pl++) {
            var px = pelicanPositions[pl].x;
            var pz = pelicanPositions[pl].z;

            // Body
            var pelBody = makeMesh(new THREE.SphereGeometry(1.2, 8, 8), whiteMat);
            pelBody.position.set(px, 1.7, pz);
            addMesh(pelBody);

            // Head
            var pelHead = makeMesh(new THREE.SphereGeometry(0.6, 8, 8), whiteMat);
            pelHead.position.set(px, 3.0, pz);
            addMesh(pelHead);

            // Beak (elongated)
            var pelBeak = makeMesh(new THREE.BoxGeometry(0.2, 0.3, 1.5), beigeBeakMat);
            pelBeak.position.set(px, 2.9, pz - 1.2);
            addMesh(pelBeak);
        }

        // Weeping willow trees (5)
        var willowPositions = [
            { x: X_OFFSET - 30, z: -62 },
            { x: X_OFFSET - 10, z: -95 },
            { x: X_OFFSET + 40, z: -65 },
            { x: X_OFFSET + 55, z: -95 },
            { x: X_OFFSET + 70, z: -75 }
        ];

        for (var wt = 0; wt < willowPositions.length; wt++) {
            var wx = willowPositions[wt].x;
            var wz = willowPositions[wt].z;

            // Trunk
            var trunk = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, 7, 6), trunkMat);
            trunk.position.set(wx, 3.5, wz);
            addMesh(trunk);

            // Canopy (drooping approximated with wide flat sphere)
            var canopy = makeMesh(new THREE.SphereGeometry(5, 8, 6), leafMat);
            canopy.scale.set(1.0, 0.6, 1.0);
            canopy.position.set(wx, 8, wz);
            addMesh(canopy);

            // Drooping fronds (lower sphere)
            var fronds = makeMesh(new THREE.SphereGeometry(4, 8, 6), leafMat);
            fronds.scale.set(1.2, 0.4, 1.2);
            fronds.position.set(wx, 5.5, wz);
            addMesh(fronds);
        }

        // Park paths
        var pathH = makeMesh(new THREE.BoxGeometry(160, 0.3, 4), pathMat);
        pathH.position.set(X_OFFSET + 20, 0.4, -62);
        addMesh(pathH);

        var pathV = makeMesh(new THREE.BoxGeometry(4, 0.3, 70), pathMat);
        pathV.position.set(X_OFFSET - 40, 0.4, -80);
        addMesh(pathV);

        var pathV2 = makeMesh(new THREE.BoxGeometry(4, 0.3, 70), pathMat);
        pathV2.position.set(X_OFFSET + 70, 0.4, -80);
        addMesh(pathV2);

        // Lamp posts along path
        var lampPositions = [
            X_OFFSET - 30, X_OFFSET - 10, X_OFFSET + 10, X_OFFSET + 30, X_OFFSET + 50, X_OFFSET + 70
        ];

        for (var lp = 0; lp < lampPositions.length; lp++) {
            var lpx = lampPositions[lp];

            // Post
            var post = makeMesh(new THREE.CylinderGeometry(0.15, 0.2, 6, 6), lampMat);
            post.position.set(lpx, 3, -62);
            addMesh(post);

            // Crown ornament
            var lampCrown = makeMesh(new THREE.CylinderGeometry(0.4, 0.15, 0.6, 6), new THREE.MeshLambertMaterial({ color: 0xd4aa00 }));
            lampCrown.position.set(lpx, 6.3, -62);
            addMesh(lampCrown);

            // Light globe
            var globe = makeMesh(new THREE.SphereGeometry(0.3, 6, 6), new THREE.MeshLambertMaterial({ color: 0xffffc0 }));
            globe.position.set(lpx, 6.8, -62);
            addMesh(globe);
        }
    }

    function buildTheMall() {
        var tarmacMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var redMat = new THREE.MeshLambertMaterial({ color: 0xaa2222 });
        var lampMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var goldMat = new THREE.MeshLambertMaterial({ color: 0xd4aa00 });
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

        // Wide ceremonial avenue base
        var mallBase = makeMesh(new THREE.BoxGeometry(200, 0.4, 24), tarmacMat);
        mallBase.position.set(X_OFFSET - 100, 0.2, -50);
        addMesh(mallBase);

        // Central red surface (the famous red tarmac)
        var mallRed = makeMesh(new THREE.BoxGeometry(200, 0.3, 10), redMat);
        mallRed.position.set(X_OFFSET - 100, 0.35, -50);
        addMesh(mallRed);

        // White line markings on edges
        var lineLeft = makeMesh(new THREE.BoxGeometry(200, 0.1, 0.4), whiteMat);
        lineLeft.position.set(X_OFFSET - 100, 0.46, -45);
        addMesh(lineLeft);

        var lineRight = makeMesh(new THREE.BoxGeometry(200, 0.1, 0.4), whiteMat);
        lineRight.position.set(X_OFFSET - 100, 0.46, -55);
        addMesh(lineRight);

        // Lamp posts with crowns along The Mall (both sides)
        for (var mi = 0; mi < 10; mi++) {
            var mlx = X_OFFSET - 180 + mi * 40;

            // Left side post
            var postL = makeMesh(new THREE.CylinderGeometry(0.2, 0.25, 8, 6), lampMat);
            postL.position.set(mlx, 4, -44);
            addMesh(postL);

            var crownL = makeMesh(new THREE.CylinderGeometry(0.5, 0.2, 0.8, 6), goldMat);
            crownL.position.set(mlx, 8.4, -44);
            addMesh(crownL);

            var globeL = makeMesh(new THREE.SphereGeometry(0.35, 6, 6), new THREE.MeshLambertMaterial({ color: 0xffffc0 }));
            globeL.position.set(mlx, 9.1, -44);
            addMesh(globeL);

            // Right side post
            var postR = makeMesh(new THREE.CylinderGeometry(0.2, 0.25, 8, 6), lampMat);
            postR.position.set(mlx, 4, -56);
            addMesh(postR);

            var crownR = makeMesh(new THREE.CylinderGeometry(0.5, 0.2, 0.8, 6), goldMat);
            crownR.position.set(mlx, 8.4, -56);
            addMesh(crownR);

            var globeR = makeMesh(new THREE.SphereGeometry(0.35, 6, 6), new THREE.MeshLambertMaterial({ color: 0xffffc0 }));
            globeR.position.set(mlx, 9.1, -56);
            addMesh(globeR);
        }

        // Flag poles at start of Mall (near palace)
        var flagPoleMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var flagMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });

        for (var fp = 0; fp < 3; fp++) {
            var fpx = X_OFFSET - 20 + fp * 20;

            var flagPole = makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 14, 6), flagPoleMat);
            flagPole.position.set(fpx, 7, -46);
            addMesh(flagPole);

            var flag = makeMesh(new THREE.BoxGeometry(3, 2, 0.1), flagMat);
            flag.position.set(fpx + 1.5, 13.5, -46);
            addMesh(flag);
        }
    }

    function buildGroundPlane() {
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x5a7a4a });

        var ground = makeMesh(new THREE.BoxGeometry(300, 0.5, 200), groundMat);
        ground.position.set(X_OFFSET, 0, -60);
        addMesh(ground);
    }

    function build() {
        buildGroundPlane();
        buildTheMall();
        buildPalace();
        buildVictoriaMemorial();
        buildGuards();
        buildStJamesPark();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
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
