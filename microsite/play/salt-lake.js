window.SaltLake = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var radarDome = null;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildSaltFlat();
        buildSaltCrusts();
        buildRadarDome();
        buildRadarDishes();
        buildResearchStation();
        buildAircraftWreck();
        buildFuelDepot();
        buildBorderFence();
        buildGuardTowers();
        buildTestMarkers();
        buildRiverbedChannel();
        setupLighting();
    }

    function buildSaltFlat() {
        var flatMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f0 });
        var undergroundMaterial = new THREE.MeshLambertMaterial({ color: 0xe8e8dc });

        var mainFlat = new THREE.Mesh(new THREE.BoxGeometry(400, 2, 400), flatMaterial);
        mainFlat.position.set(0, -1, 0);
        scene.add(mainFlat);
        objects.push(mainFlat);

        var flatSection2 = new THREE.Mesh(new THREE.BoxGeometry(300, 1.5, 250), flatMaterial);
        flatSection2.position.set(150, -0.75, 80);
        scene.add(flatSection2);
        objects.push(flatSection2);

        var flatSection3 = new THREE.Mesh(new THREE.BoxGeometry(280, 1.5, 320), flatMaterial);
        flatSection3.position.set(-140, -0.75, -100);
        scene.add(flatSection3);
        objects.push(flatSection3);

        var flatSection4 = new THREE.Mesh(new THREE.BoxGeometry(200, 1, 280), undergroundMaterial);
        flatSection4.position.set(-80, -0.5, 150);
        scene.add(flatSection4);
        objects.push(flatSection4);

        var flatSection5 = new THREE.Mesh(new THREE.BoxGeometry(350, 1.2, 180), flatMaterial);
        flatSection5.position.set(20, -0.6, -180);
        scene.add(flatSection5);
        objects.push(flatSection5);

        var undergroundLayer = new THREE.Mesh(new THREE.BoxGeometry(500, 3, 500), undergroundMaterial);
        undergroundLayer.position.set(0, -3.5, 0);
        scene.add(undergroundLayer);
        objects.push(undergroundLayer);
    }

    function buildSaltCrusts() {
        var crustMaterial = new THREE.MeshLambertMaterial({ color: 0xfffef0 });
        var darkCrustMaterial = new THREE.MeshLambertMaterial({ color: 0xe0e0d0 });

        var positions = [
            { x: 80, z: 60 },
            { x: -100, z: 120 },
            { x: 140, z: -80 },
            { x: -160, z: -140 },
            { x: 50, z: -200 },
            { x: -200, z: 0 },
            { x: 180, z: 150 },
            { x: -80, z: 200 }
        ];

        for (var i = 0; i < positions.length; i++) {
            var cluster = buildCrustCluster(positions[i].x, positions[i].z, crustMaterial, darkCrustMaterial);
            for (var j = 0; j < cluster.length; j++) {
                objects.push(cluster[j]);
            }
        }
    }

    function buildCrustCluster(baseX, baseZ, brightMat, darkMat) {
        var meshes = [];
        for (var i = 0; i < 6; i++) {
            var offsetX = (Math.random() - 0.5) * 20;
            var offsetZ = (Math.random() - 0.5) * 20;
            var height = 1 + Math.random() * 3;
            var scale = 0.8 + Math.random() * 0.6;
            var mat = Math.random() > 0.5 ? brightMat : darkMat;

            var cone = new THREE.Mesh(new THREE.ConeGeometry(scale * 2, height, 8), mat);
            cone.position.set(baseX + offsetX, height / 2, baseZ + offsetZ);
            scene.add(cone);
            meshes.push(cone);
        }
        return meshes;
    }

    function buildRadarDome() {
        var domeColor = 0xffffff;
        var baseColor = 0xc0c0c0;
        var pedColor = 0x8b8b7a;

        var domeMaterial = new THREE.MeshLambertMaterial({ color: domeColor });
        var baseMaterial = new THREE.MeshLambertMaterial({ color: baseColor });
        var pedMaterial = new THREE.MeshLambertMaterial({ color: pedColor });

        var basePedestal = new THREE.Mesh(new THREE.BoxGeometry(25, 3, 25), pedMaterial);
        basePedestal.position.set(0, 1.5, 0);
        scene.add(basePedestal);
        objects.push(basePedestal);

        var supportBase = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 30), baseMaterial);
        supportBase.position.set(0, 4, 0);
        scene.add(supportBase);
        objects.push(supportBase);

        radarDome = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 24), domeMaterial);
        radarDome.position.set(0, 25, 0);
        scene.add(radarDome);
        objects.push(radarDome);

        var supportLeg1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 18, 8), pedMaterial);
        supportLeg1.position.set(10, 13, 10);
        scene.add(supportLeg1);
        objects.push(supportLeg1);

        var supportLeg2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 18, 8), pedMaterial);
        supportLeg2.position.set(-10, 13, 10);
        scene.add(supportLeg2);
        objects.push(supportLeg2);

        var supportLeg3 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 18, 8), pedMaterial);
        supportLeg3.position.set(10, 13, -10);
        scene.add(supportLeg3);
        objects.push(supportLeg3);

        var supportLeg4 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 18, 8), pedMaterial);
        supportLeg4.position.set(-10, 13, -10);
        scene.add(supportLeg4);
        objects.push(supportLeg4);

        var hatPlatform = new THREE.Mesh(new THREE.BoxGeometry(22, 0.5, 22), baseMaterial);
        hatPlatform.position.set(0, 4.5, 0);
        scene.add(hatPlatform);
        objects.push(hatPlatform);
    }

    function buildRadarDishes() {
        var concreteColor = 0xaaaaaa;
        var silverColor = 0xcccccc;
        var concreteMat = new THREE.MeshLambertMaterial({ color: concreteColor });
        var silverMat = new THREE.MeshLambertMaterial({ color: silverColor });

        var dish1Frame = new THREE.Mesh(new THREE.BoxGeometry(18, 1, 15), concreteMat);
        dish1Frame.position.set(70, 15, -100);
        scene.add(dish1Frame);
        objects.push(dish1Frame);

        var dish1Reflector = new THREE.Mesh(new THREE.SphereGeometry(14, 20, 16), silverMat);
        dish1Reflector.scale.z = 0.4;
        dish1Reflector.position.set(70, 20, -100);
        scene.add(dish1Reflector);
        objects.push(dish1Reflector);

        var dish1Support = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 12, 8), concreteMat);
        dish1Support.position.set(70, 8, -100);
        scene.add(dish1Support);
        objects.push(dish1Support);

        var dish2Frame = new THREE.Mesh(new THREE.BoxGeometry(16, 1, 13), concreteMat);
        dish2Frame.position.set(-80, 12, 120);
        scene.add(dish2Frame);
        objects.push(dish2Frame);

        var dish2Reflector = new THREE.Mesh(new THREE.SphereGeometry(12, 20, 16), silverMat);
        dish2Reflector.scale.z = 0.4;
        dish2Reflector.position.set(-80, 17, 120);
        scene.add(dish2Reflector);
        objects.push(dish2Reflector);

        var dish2Support = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 10, 8), concreteMat);
        dish2Support.position.set(-80, 6, 120);
        scene.add(dish2Support);
        objects.push(dish2Support);

        var dish3Frame = new THREE.Mesh(new THREE.BoxGeometry(14, 0.8, 12), concreteMat);
        dish3Frame.position.set(150, 18, 80);
        scene.add(dish3Frame);
        objects.push(dish3Frame);

        var dish3Reflector = new THREE.Mesh(new THREE.SphereGeometry(11, 18, 14), silverMat);
        dish3Reflector.scale.z = 0.35;
        dish3Reflector.position.set(150, 23, 80);
        scene.add(dish3Reflector);
        objects.push(dish3Reflector);

        var dish3Support = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2, 14, 8), concreteMat);
        dish3Support.position.set(150, 10, 80);
        scene.add(dish3Support);
        objects.push(dish3Support);
    }

    function buildResearchStation() {
        var darkGreen = 0x1a3a1a;
        var concreteGray = 0x888888;
        var greenMat = new THREE.MeshLambertMaterial({ color: darkGreen });
        var concreteMat = new THREE.MeshLambertMaterial({ color: concreteGray });

        var building1 = new THREE.Mesh(new THREE.BoxGeometry(40, 15, 25), greenMat);
        building1.position.set(-150, 7.5, 50);
        scene.add(building1);
        objects.push(building1);

        var building1Vent1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 5, 8), concreteMat);
        building1Vent1.position.set(-140, 15, 55);
        scene.add(building1Vent1);
        objects.push(building1Vent1);

        var building1Vent2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 5, 8), concreteMat);
        building1Vent2.position.set(-160, 15, 55);
        scene.add(building1Vent2);
        objects.push(building1Vent2);

        var building2 = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 20), greenMat);
        building2.position.set(-130, 6, -40);
        scene.add(building2);
        objects.push(building2);

        var building2Vent1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 8), concreteMat);
        building2Vent1.position.set(-120, 12, -35);
        scene.add(building2Vent1);
        objects.push(building2Vent1);

        var building2Vent2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 8), concreteMat);
        building2Vent2.position.set(-140, 12, -35);
        scene.add(building2Vent2);
        objects.push(building2Vent2);

        var building3 = new THREE.Mesh(new THREE.BoxGeometry(35, 14, 22), greenMat);
        building3.position.set(-170, 7, 100);
        scene.add(building3);
        objects.push(building3);

        var building3Vent1 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 4.5, 8), concreteMat);
        building3Vent1.position.set(-160, 14, 105);
        scene.add(building3Vent1);
        objects.push(building3Vent1);

        var building3Vent2 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 4.5, 8), concreteMat);
        building3Vent2.position.set(-180, 14, 105);
        scene.add(building3Vent2);
        objects.push(building3Vent2);

        var hatchFrame = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 12), concreteMat);
        hatchFrame.position.set(-140, 0.1, 60);
        scene.add(hatchFrame);
        objects.push(hatchFrame);

        var hatchCover = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 10), darkGreen);
        hatchCover.position.set(-140, 0.3, 60);
        scene.add(hatchCover);
        objects.push(hatchCover);
    }

    function buildAircraftWreck() {
        var silverMat = new THREE.MeshLambertMaterial({ color: 0xa9a9a9 });
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        var fuselage = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 35), silverMat);
        fuselage.rotation.z = 0.3;
        fuselage.position.set(100, 2.5, -150);
        scene.add(fuselage);
        objects.push(fuselage);

        var cockpit = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), darkMat);
        cockpit.position.set(95, 6, -135);
        scene.add(cockpit);
        objects.push(cockpit);

        var wingLeft = new THREE.Mesh(new THREE.BoxGeometry(25, 1.5, 8), silverMat);
        wingLeft.rotation.x = 0.2;
        wingLeft.position.set(70, 3.5, -155);
        scene.add(wingLeft);
        objects.push(wingLeft);

        var wingRight = new THREE.Mesh(new THREE.BoxGeometry(25, 1.5, 8), silverMat);
        wingRight.rotation.x = -0.2;
        wingRight.position.set(130, 3.5, -145);
        scene.add(wingRight);
        objects.push(wingRight);

        var tailSection = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 8), silverMat);
        tailSection.position.set(100, 2, -175);
        scene.add(tailSection);
        objects.push(tailSection);

        var engineLeft = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 8), darkMat);
        engineLeft.position.set(75, 2.5, -150);
        scene.add(engineLeft);
        objects.push(engineLeft);

        var engineRight = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 8, 8), darkMat);
        engineRight.position.set(125, 2.5, -150);
        scene.add(engineRight);
        objects.push(engineRight);

        var debris1 = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 4), darkMat);
        debris1.position.set(85, 1.5, -145);
        scene.add(debris1);
        objects.push(debris1);

        var debris2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 3), darkMat);
        debris2.position.set(115, 1.5, -160);
        scene.add(debris2);
        objects.push(debris2);
    }

    function buildFuelDepot() {
        var metalColor = 0x808080;
        var pumpColor = 0x4a4a3a;
        var metalMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var pumpMat = new THREE.MeshLambertMaterial({ color: pumpColor });

        var tank1 = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 18, 12), metalMat);
        tank1.position.set(180, 9, 120);
        scene.add(tank1);
        objects.push(tank1);

        var tank1Top = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 8), metalMat);
        tank1Top.position.set(180, 18, 120);
        scene.add(tank1Top);
        objects.push(tank1Top);

        var tank2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 16, 12), metalMat);
        tank2.position.set(200, 8, 130);
        scene.add(tank2);
        objects.push(tank2);

        var tank2Top = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 8), metalMat);
        tank2Top.position.set(200, 16, 130);
        scene.add(tank2Top);
        objects.push(tank2Top);

        var tank3 = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 14, 12), metalMat);
        tank3.position.set(165, 7, 140);
        scene.add(tank3);
        objects.push(tank3);

        var tank3Top = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 8), metalMat);
        tank3Top.position.set(165, 14, 140);
        scene.add(tank3Top);
        objects.push(tank3Top);

        var pumpStation = new THREE.Mesh(new THREE.BoxGeometry(25, 8, 15), pumpMat);
        pumpStation.position.set(175, 4, 160);
        scene.add(pumpStation);
        objects.push(pumpStation);

        var pumpPole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 8), metalMat);
        pumpPole1.position.set(165, 8, 160);
        scene.add(pumpPole1);
        objects.push(pumpPole1);

        var pumpPole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 8), metalMat);
        pumpPole2.position.set(185, 8, 160);
        scene.add(pumpPole2);
        objects.push(pumpPole2);
    }

    function buildBorderFence() {
        var fenceColor = 0x2d5016;
        var wireColor = 0x4a4a4a;
        var fenceMat = new THREE.MeshLambertMaterial({ color: fenceColor });

        var fencePositions = [
            { x: 0, z: 200 },
            { x: 100, z: 180 },
            { x: 200, z: 150 },
            { x: -100, z: 190 },
            { x: -200, z: 170 }
        ];

        for (var i = 0; i < fencePositions.length; i++) {
            var post = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 8, 8), fenceMat);
            post.position.set(fencePositions[i].x, 4, fencePositions[i].z);
            scene.add(post);
            objects.push(post);

            var topCap = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), fenceMat);
            topCap.position.set(fencePositions[i].x, 8, fencePositions[i].z);
            scene.add(topCap);
            objects.push(topCap);
        }

        var wirePoints = [
            new THREE.Vector3(0, 6, 200),
            new THREE.Vector3(100, 6, 180)
        ];
        var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: wireColor, linewidth: 1 });
        var wireLine = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wireLine);
        objects.push(wireLine);

        var wirePoints2 = [
            new THREE.Vector3(100, 6, 180),
            new THREE.Vector3(200, 6, 150)
        ];
        var wireGeom2 = new THREE.BufferGeometry().setFromPoints(wirePoints2);
        var wireLine2 = new THREE.LineSegments(wireGeom2, wireMat);
        scene.add(wireLine2);
        objects.push(wireLine2);
    }

    function buildGuardTowers() {
        var platformColor = 0x5a5a4a;
        var legColor = 0x3a3a2a;
        var platformMat = new THREE.MeshLambertMaterial({ color: platformColor });
        var legMat = new THREE.MeshLambertMaterial({ color: legColor });

        var tower1Platform = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 12), platformMat);
        tower1Platform.position.set(-200, 16, -180);
        scene.add(tower1Platform);
        objects.push(tower1Platform);

        var tower1Leg1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 14, 8), legMat);
        tower1Leg1.position.set(-195, 7, -175);
        scene.add(tower1Leg1);
        objects.push(tower1Leg1);

        var tower1Leg2 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 14, 8), legMat);
        tower1Leg2.position.set(-205, 7, -185);
        scene.add(tower1Leg2);
        objects.push(tower1Leg2);

        var tower2Platform = new THREE.Mesh(new THREE.BoxGeometry(11, 1, 11), platformMat);
        tower2Platform.position.set(220, 14, 160);
        scene.add(tower2Platform);
        objects.push(tower2Platform);

        var tower2Leg1 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 12, 8), legMat);
        tower2Leg1.position.set(226, 6, 166);
        scene.add(tower2Leg1);
        objects.push(tower2Leg1);

        var tower2Leg2 = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 12, 8), legMat);
        tower2Leg2.position.set(214, 6, 154);
        scene.add(tower2Leg2);
        objects.push(tower2Leg2);

        var tower3Platform = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 10), platformMat);
        tower3Platform.position.set(-150, 15, 200);
        scene.add(tower3Platform);
        objects.push(tower3Platform);

        var tower3Leg1 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.3, 13, 8), legMat);
        tower3Leg1.position.set(-145, 6.5, 205);
        scene.add(tower3Leg1);
        objects.push(tower3Leg1);

        var tower3Leg2 = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.3, 13, 8), legMat);
        tower3Leg2.position.set(-155, 6.5, 195);
        scene.add(tower3Leg2);
        objects.push(tower3Leg2);
    }

    function buildTestMarkers() {
        var poleColor = 0x666655;
        var panelColor = 0xff6600;
        var poleMat = new THREE.MeshLambertMaterial({ color: poleColor });
        var panelMat = new THREE.MeshLambertMaterial({ color: panelColor });

        var markerPositions = [
            { x: 50, z: 0 },
            { x: 100, z: 50 },
            { x: 150, z: 0 },
            { x: -50, z: 80 },
            { x: -100, z: -120 },
            { x: 0, z: -100 }
        ];

        for (var i = 0; i < markerPositions.length; i++) {
            var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 10, 8), poleMat);
            pole.position.set(markerPositions[i].x, 5, markerPositions[i].z);
            scene.add(pole);
            objects.push(pole);

            var panel = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 0.5), panelMat);
            panel.position.set(markerPositions[i].x + 2, 9, markerPositions[i].z);
            scene.add(panel);
            objects.push(panel);
        }
    }

    function buildRiverbedChannel() {
        var channelColor = 0xd4a574;
        var channelMat = new THREE.MeshLambertMaterial({ color: channelColor });

        var channelTrench = new THREE.Mesh(new THREE.BoxGeometry(15, 4, 200), channelMat);
        channelTrench.position.set(40, -2, -50);
        channelTrench.rotation.z = 0.15;
        scene.add(channelTrench);
        objects.push(channelTrench);

        var channelSection2 = new THREE.Mesh(new THREE.BoxGeometry(12, 3.5, 150), channelMat);
        channelSection2.position.set(-20, -1.75, 80);
        channelSection2.rotation.z = -0.2;
        scene.add(channelSection2);
        objects.push(channelSection2);

        var rockDebris1 = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 4), channelMat);
        rockDebris1.position.set(35, 0.5, -40);
        scene.add(rockDebris1);
        objects.push(rockDebris1);

        var rockDebris2 = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 3), channelMat);
        rockDebris2.position.set(50, 0.4, -60);
        scene.add(rockDebris2);
        objects.push(rockDebris2);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 80, 100);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var spotLight = new THREE.SpotLight(0xffffff, 0.5);
        spotLight.position.set(-120, 25, 60);
        spotLight.target.position.set(-120, 0, 60);
        scene.add(spotLight);
        lights.push(spotLight);

        var pointLight = new THREE.PointLight(0xffaa00, 0.4);
        pointLight.position.set(180, 20, 120);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        if (radarDome) {
            radarDome.rotation.y += 0.3 * delta;
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
        radarDome = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
