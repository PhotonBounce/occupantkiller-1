window.RiverGate = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var waterSpheres = [];
    var chainSegments = [];
    var gateChainY = 0;
    var waterFlowOffset = 0;

    function buildRiverbed() {
        var riverGeom = new THREE.BoxGeometry(25, 0.5, 80);
        var riverMat = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
        var river = new THREE.Mesh(riverGeom, riverMat);
        river.position.z = 0;
        river.position.y = -1;
        scene.add(river);
        objects.push(river);

        var bankLeftGeom = new THREE.BoxGeometry(8, 15, 80);
        var bankMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var bankLeft = new THREE.Mesh(bankLeftGeom, bankMat);
        bankLeft.position.x = -16.5;
        bankLeft.position.y = 7;
        scene.add(bankLeft);
        objects.push(bankLeft);

        var bankRight = new THREE.Mesh(bankLeftGeom, bankMat);
        bankRight.position.x = 16.5;
        bankRight.position.y = 7;
        scene.add(bankRight);
        objects.push(bankRight);
    }

    function buildGateTowers() {
        var towerGeom = new THREE.BoxGeometry(6, 35, 8);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x6b5d54 });

        var towerLeft = new THREE.Mesh(towerGeom, stoneMat);
        towerLeft.position.x = -8;
        towerLeft.position.y = 17;
        towerLeft.position.z = -5;
        scene.add(towerLeft);
        objects.push(towerLeft);

        var towerRight = new THREE.Mesh(towerGeom, stoneMat);
        towerRight.position.x = 8;
        towerRight.position.y = 17;
        towerRight.position.z = -5;
        scene.add(towerRight);
        objects.push(towerRight);

        var archGeom = new THREE.BoxGeometry(16, 4, 8);
        var arch = new THREE.Mesh(archGeom, stoneMat);
        arch.position.z = -5;
        arch.position.y = 34;
        scene.add(arch);
        objects.push(arch);

        var capLeftGeom = new THREE.BoxGeometry(7, 2, 9);
        var capLeft = new THREE.Mesh(capLeftGeom, stoneMat);
        capLeft.position.x = -8;
        capLeft.position.y = 36;
        capLeft.position.z = -5;
        scene.add(capLeft);
        objects.push(capLeft);

        var capRight = new THREE.Mesh(capLeftGeom, stoneMat);
        capRight.position.x = 8;
        capRight.position.y = 36;
        capRight.position.z = -5;
        scene.add(capRight);
        objects.push(capRight);
    }

    function buildFloodgates() {
        var gateGeom = new THREE.BoxGeometry(3, 12, 6);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });

        var gateLeft = new THREE.Mesh(gateGeom, gateMat);
        gateLeft.position.x = -6;
        gateLeft.position.y = -2;
        gateLeft.position.z = 0;
        scene.add(gateLeft);
        objects.push(gateLeft);

        var gateRight = new THREE.Mesh(gateGeom, gateMat);
        gateRight.position.x = 6;
        gateRight.position.y = -2;
        gateRight.position.z = 0;
        scene.add(gateRight);
        objects.push(gateRight);

        var gateCenter = new THREE.Mesh(gateGeom, gateMat);
        gateCenter.position.x = 0;
        gateCenter.position.y = -2;
        gateCenter.position.z = 0;
        scene.add(gateCenter);
        objects.push(gateCenter);

        var gearLeftGeom = new THREE.CylinderGeometry(2, 2, 1, 16);
        var gearMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var gearLeft = new THREE.Mesh(gearLeftGeom, gearMat);
        gearLeft.position.x = -8;
        gearLeft.position.y = 8;
        gearLeft.position.z = 3;
        scene.add(gearLeft);
        objects.push(gearLeft);

        var gearRight = new THREE.Mesh(gearLeftGeom, gearMat);
        gearRight.position.x = 8;
        gearRight.position.y = 8;
        gearRight.position.z = 3;
        scene.add(gearRight);
        objects.push(gearRight);

        var chainShaftLeftGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        var chainMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var chainShaftLeft = new THREE.Mesh(chainShaftLeftGeom, chainMat);
        chainShaftLeft.position.x = -8;
        chainShaftLeft.position.y = 8;
        chainShaftLeft.position.z = 0;
        chainShaftLeft.rotation.z = Math.PI / 2;
        scene.add(chainShaftLeft);
        objects.push(chainShaftLeft);

        var chainShaftRight = new THREE.Mesh(chainShaftLeftGeom, chainMat);
        chainShaftRight.position.x = 8;
        chainShaftRight.position.y = 8;
        chainShaftRight.position.z = 0;
        chainShaftRight.rotation.z = Math.PI / 2;
        scene.add(chainShaftRight);
        objects.push(chainShaftRight);
    }

    function buildBattlements() {
        var battleMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        var parapet1Geom = new THREE.BoxGeometry(7, 3, 1);
        var parapet1 = new THREE.Mesh(parapet1Geom, battleMat);
        parapet1.position.x = -8;
        parapet1.position.y = 35;
        parapet1.position.z = 2;
        scene.add(parapet1);
        objects.push(parapet1);

        var parapet2 = new THREE.Mesh(parapet1Geom, battleMat);
        parapet2.position.x = 8;
        parapet2.position.y = 35;
        parapet2.position.z = 2;
        scene.add(parapet2);
        objects.push(parapet2);

        for (var i = 0; i < 5; i++) {
            var crenelGeom = new THREE.BoxGeometry(0.8, 1.5, 0.8);
            var crenelMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var crenel1 = new THREE.Mesh(crenelGeom, crenelMat);
            crenel1.position.x = -8 + (i * 1.2) - 2.4;
            crenel1.position.y = 37;
            crenel1.position.z = 2;
            scene.add(crenel1);
            objects.push(crenel1);

            var crenel2 = new THREE.Mesh(crenelGeom, crenelMat);
            crenel2.position.x = 8 + (i * 1.2) - 2.4;
            crenel2.position.y = 37;
            crenel2.position.z = 2;
            scene.add(crenel2);
            objects.push(crenel2);
        }

        var crenelBackGeom = new THREE.BoxGeometry(7, 3, 1);
        var crenelBack1 = new THREE.Mesh(crenelBackGeom, battleMat);
        crenelBack1.position.x = -8;
        crenelBack1.position.y = 35;
        crenelBack1.position.z = -3;
        scene.add(crenelBack1);
        objects.push(crenelBack1);

        var crenelBack2 = new THREE.Mesh(crenelBackGeom, battleMat);
        crenelBack2.position.x = 8;
        crenelBack2.position.y = 35;
        crenelBack2.position.z = -3;
        scene.add(crenelBack2);
        objects.push(crenelBack2);
    }

    function buildBoatHarbor() {
        var dockGeom = new THREE.BoxGeometry(12, 0.5, 8);
        var dockMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var dock = new THREE.Mesh(dockGeom, dockMat);
        dock.position.x = 0;
        dock.position.y = -0.8;
        dock.position.z = 25;
        scene.add(dock);
        objects.push(dock);

        var dockSupport1Geom = new THREE.BoxGeometry(1, 4, 1);
        var dockSupMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        for (var i = 0; i < 4; i++) {
            var support = new THREE.Mesh(dockSupport1Geom, dockSupMat);
            support.position.x = -4 + (i * 3);
            support.position.y = -2;
            support.position.z = 25;
            scene.add(support);
            objects.push(support);
        }

        var boatGeom = new THREE.BoxGeometry(6, 1.5, 3);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var boat1 = new THREE.Mesh(boatGeom, boatMat);
        boat1.position.x = -4;
        boat1.position.y = 0.5;
        boat1.position.z = 20;
        scene.add(boat1);
        objects.push(boat1);

        var boat2 = new THREE.Mesh(boatGeom, boatMat);
        boat2.position.x = 4;
        boat2.position.y = 0.5;
        boat2.position.z = 22;
        scene.add(boat2);
        objects.push(boat2);

        var boat3 = new THREE.Mesh(boatGeom, boatMat);
        boat3.position.x = 0;
        boat3.position.y = 0.5;
        boat3.position.z = 24;
        scene.add(boat3);
        objects.push(boat3);
    }

    function buildBarracks() {
        var barrackGeom = new THREE.BoxGeometry(14, 12, 20);
        var barrackMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var barrack = new THREE.Mesh(barrackGeom, barrackMat);
        barrack.position.x = 0;
        barrack.position.y = 6;
        barrack.position.z = -30;
        scene.add(barrack);
        objects.push(barrack);

        var roofGeom = new THREE.BoxGeometry(15, 1, 21);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.x = 0;
        roof.position.y = 13;
        roof.position.z = -30;
        scene.add(roof);
        objects.push(roof);

        for (var i = 0; i < 4; i++) {
            var windowGeom = new THREE.BoxGeometry(1.5, 1.5, 0.2);
            var windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var window1 = new THREE.Mesh(windowGeom, windowMat);
            window1.position.x = -5 + (i * 3);
            window1.position.y = 10;
            window1.position.z = -40;
            scene.add(window1);
            objects.push(window1);
        }

        var doorGeom = new THREE.BoxGeometry(2, 3, 0.2);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        var door = new THREE.Mesh(doorGeom, doorMat);
        door.position.x = 0;
        door.position.y = 4.5;
        door.position.z = -40;
        scene.add(door);
        objects.push(door);
    }

    function buildCrossing() {
        var bridgeRoofGeom = new THREE.BoxGeometry(7, 4, 12);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var bridgeRoof = new THREE.Mesh(bridgeRoofGeom, bridgeMat);
        bridgeRoof.position.x = 0;
        bridgeRoof.position.y = 8;
        bridgeRoof.position.z = 5;
        scene.add(bridgeRoof);
        objects.push(bridgeRoof);

        var bridgeSideGeom = new THREE.BoxGeometry(0.8, 4, 12);
        var bridgeSideMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        var bridgeSide1 = new THREE.Mesh(bridgeSideGeom, bridgeSideMat);
        bridgeSide1.position.x = -3.5;
        bridgeSide1.position.y = 8;
        bridgeSide1.position.z = 5;
        scene.add(bridgeSide1);
        objects.push(bridgeSide1);

        var bridgeSide2 = new THREE.Mesh(bridgeSideGeom, bridgeSideMat);
        bridgeSide2.position.x = 3.5;
        bridgeSide2.position.y = 8;
        bridgeSide2.position.z = 5;
        scene.add(bridgeSide2);
        objects.push(bridgeSide2);

        var deckerGeom = new THREE.BoxGeometry(6, 0.5, 12);
        var deckerMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var decker = new THREE.Mesh(deckerGeom, deckerMat);
        decker.position.x = 0;
        decker.position.y = 5;
        decker.position.z = 5;
        scene.add(decker);
        objects.push(decker);
    }

    function buildWeapons() {
        var catapultFrameGeom = new THREE.BoxGeometry(2, 0.5, 2);
        var cataMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var catFrame = new THREE.Mesh(catapultFrameGeom, cataMat);
        catFrame.position.x = -8;
        catFrame.position.y = 36;
        catFrame.position.z = 3;
        scene.add(catFrame);
        objects.push(catFrame);

        var catapultArmGeom = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
        var catArm = new THREE.Mesh(catapultArmGeom, cataMat);
        catArm.position.x = -8;
        catArm.position.y = 38;
        catArm.position.z = 3;
        scene.add(catArm);
        objects.push(catArm);

        var catapultCupGeom = new THREE.BoxGeometry(1, 0.8, 1);
        var catCup = new THREE.Mesh(catapultCupGeom, cataMat);
        catCup.position.x = -8;
        catCup.position.y = 40;
        catCup.position.z = 3;
        scene.add(catCup);
        objects.push(catCup);

        var catapultBrace1Geom = new THREE.BoxGeometry(0.3, 3, 0.3);
        for (var i = 0; i < 2; i++) {
            var brace = new THREE.Mesh(catapultBrace1Geom, cataMat);
            brace.position.x = -8 + (i * 0.8) - 0.4;
            brace.position.y = 37;
            brace.position.z = 3;
            scene.add(brace);
            objects.push(brace);
        }

        var ballista1Geom = new THREE.BoxGeometry(2, 0.5, 2);
        var ballMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var ballista = new THREE.Mesh(ballista1Geom, ballMat);
        ballista.position.x = 8;
        ballista.position.y = 36;
        ballista.position.z = 3;
        scene.add(ballista);
        objects.push(ballista);

        var ballistaFrameGeom = new THREE.BoxGeometry(0.5, 2, 3);
        var ballistaFrame = new THREE.Mesh(ballistaFrameGeom, ballMat);
        ballistaFrame.position.x = 8;
        ballistaFrame.position.y = 37;
        ballistaFrame.position.z = 3;
        scene.add(ballistaFrame);
        objects.push(ballistaFrame);
    }

    function buildCannonballs() {
        var cannonMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });

        var stack1X = -8;
        var stack1Z = -8;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3 - i; j++) {
                var ballGeom = new THREE.SphereGeometry(0.5, 8, 8);
                var ball = new THREE.Mesh(ballGeom, cannonMat);
                ball.position.x = stack1X + (j * 1.2);
                ball.position.y = 0 + (i * 1.1);
                ball.position.z = stack1Z;
                scene.add(ball);
                objects.push(ball);
            }
        }

        var stack2X = 8;
        var stack2Z = -8;
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3 - i; j++) {
                var ballGeom2 = new THREE.SphereGeometry(0.5, 8, 8);
                var ball2 = new THREE.Mesh(ballGeom2, cannonMat);
                ball2.position.x = stack2X + (j * 1.2);
                ball2.position.y = 0 + (i * 1.1);
                ball2.position.z = stack2Z;
                scene.add(ball2);
                objects.push(ball2);
            }
        }
    }

    function buildSallyports() {
        var doorGeom = new THREE.BoxGeometry(1.5, 2.5, 0.3);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });

        var door1 = new THREE.Mesh(doorGeom, doorMat);
        door1.position.x = -11;
        door1.position.y = 10;
        door1.position.z = 0;
        scene.add(door1);
        objects.push(door1);

        var door2 = new THREE.Mesh(doorGeom, doorMat);
        door2.position.x = 11;
        door2.position.y = 10;
        door2.position.z = 0;
        scene.add(door2);
        objects.push(door2);

        var doorFrame1Geom = new THREE.BoxGeometry(2, 3, 0.2);
        var doorFrameMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var frame1 = new THREE.Mesh(doorFrame1Geom, doorFrameMat);
        frame1.position.x = -11;
        frame1.position.y = 10;
        frame1.position.z = 0.1;
        scene.add(frame1);
        objects.push(frame1);

        var frame2 = new THREE.Mesh(doorFrame1Geom, doorFrameMat);
        frame2.position.x = 11;
        frame2.position.y = 10;
        frame2.position.z = 0.1;
        scene.add(frame2);
        objects.push(frame2);
    }

    function buildWaterEffects() {
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x5a9fcc });

        for (var i = 0; i < 15; i++) {
            var waterGeom = new THREE.SphereGeometry(0.3, 6, 6);
            var water = new THREE.Mesh(waterGeom, waterMat);
            water.position.x = (Math.random() - 0.5) * 15;
            water.position.y = -1 + Math.random() * 2;
            water.position.z = -6 + (i * 0.8);
            scene.add(water);
            waterSpheres.push(water);
            objects.push(water);
        }
    }

    function buildChain() {
        var chainMat = new THREE.LineBasicMaterial({ color: 0x2a2a2a, linewidth: 2 });
        var chainPoints = [];

        for (var i = 0; i < 8; i++) {
            chainPoints.push(new THREE.Vector3(-3, 8 - (i * 1.5), 0));
            chainPoints.push(new THREE.Vector3(3, 8 - (i * 1.5), 0));
        }

        var chainGeom = new THREE.BufferGeometry().setFromPoints(chainPoints);
        var chain = new THREE.LineSegments(chainGeom, chainMat);
        scene.add(chain);
        chainSegments.push(chain);
        objects.push(chain);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var dirLight1 = new THREE.DirectionalLight(0xffffff, 0.6);
        dirLight1.position.set(10, 25, 10);
        scene.add(dirLight1);
        lights.push(dirLight1);

        var dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight2.position.set(-15, 20, -15);
        scene.add(dirLight2);
        lights.push(dirLight2);

        var pointLight1 = new THREE.PointLight(0xffaa88, 0.3, 50);
        pointLight1.position.set(-8, 35, 0);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xffaa88, 0.3, 50);
        pointLight2.position.set(8, 35, 0);
        scene.add(pointLight2);
        lights.push(pointLight2);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        waterSpheres = [];
        chainSegments = [];
        gateChainY = 0;
        waterFlowOffset = 0;

        buildRiverbed();
        buildGateTowers();
        buildFloodgates();
        buildBattlements();
        buildBoatHarbor();
        buildBarracks();
        buildCrossing();
        buildWeapons();
        buildCannonballs();
        buildSallyports();
        buildWaterEffects();
        buildChain();
        setupLighting();
    }

    function update(delta) {
        waterFlowOffset += delta * 2;

        for (var i = 0; i < waterSpheres.length; i++) {
            var water = waterSpheres[i];
            water.position.z = -6 + ((waterFlowOffset + (i * 0.8)) % 35);
            water.position.y = -1 + Math.sin(waterFlowOffset * 2 + i) * 0.5;
        }

        gateChainY = Math.sin(waterFlowOffset * 0.5) * 0.3;
        for (var j = 0; j < chainSegments.length; j++) {
            chainSegments[j].position.y = gateChainY;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        waterSpheres = [];
        chainSegments = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
