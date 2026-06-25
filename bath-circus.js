window.BathCircus = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14040;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeMesh(geo, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildCircus() {
        // The Circus: circular arrangement of 33 Georgian townhouses
        // Three curved terraces forming a perfect circle, diameter ~97m
        var circusX = X_OFFSET + 0;
        var circusZ = 0;
        var radius = 48;
        var numSegments = 33;

        for (var i = 0; i < numSegments; i++) {
            var angle = (i / numSegments) * Math.PI * 2;
            var houseX = circusX + Math.cos(angle) * radius;
            var houseZ = circusZ + Math.sin(angle) * radius;

            // Townhouse body - Bath stone golden colour
            var houseGeo = new THREE.BoxGeometry(7, 14, 6);
            var house = makeMesh(houseGeo, 0xd4a853);
            house.position.set(houseX, 7, houseZ);
            house.rotation.y = -angle;

            // Roof parapet
            var parapetGeo = new THREE.BoxGeometry(7.2, 1, 6.2);
            var parapet = makeMesh(parapetGeo, 0xc49840);
            parapet.position.set(houseX, 14.5, houseZ);
            parapet.rotation.y = -angle;

            // Acorn finials on parapet
            for (var f = -1; f <= 1; f += 2) {
                var finialBaseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 6);
                var finialBase = makeMesh(finialBaseGeo, 0xc49840);
                finialBase.position.set(
                    houseX + Math.cos(-angle) * f * 2.8,
                    15.4,
                    houseZ + Math.sin(-angle) * f * 2.8
                );

                var finialTopGeo = new THREE.SphereGeometry(0.25, 6, 6);
                var finialTop = makeMesh(finialTopGeo, 0xb08030);
                finialTop.position.set(
                    houseX + Math.cos(-angle) * f * 2.8,
                    16.05,
                    houseZ + Math.sin(-angle) * f * 2.8
                );

                var acornCapGeo = new THREE.ConeGeometry(0.28, 0.3, 6);
                var acornCap = makeMesh(acornCapGeo, 0x8b6020);
                acornCap.position.set(
                    houseX + Math.cos(-angle) * f * 2.8,
                    16.5,
                    houseZ + Math.sin(-angle) * f * 2.8
                );
            }

            // Doric column at ground floor
            var colGeo = new THREE.CylinderGeometry(0.25, 0.3, 4, 8);
            var col = makeMesh(colGeo, 0xdbb860);
            col.position.set(houseX + Math.cos(-angle + Math.PI * 0.5) * 2, 2, houseZ + Math.sin(-angle + Math.PI * 0.5) * 2);

            // Ionic column at first floor
            var colGeo2 = new THREE.CylinderGeometry(0.22, 0.25, 4, 8);
            var col2 = makeMesh(colGeo2, 0xdbb860);
            col2.position.set(houseX + Math.cos(-angle + Math.PI * 0.5) * 2, 6, houseZ + Math.sin(-angle + Math.PI * 0.5) * 2);

            // Corinthian column at second floor
            var colGeo3 = new THREE.CylinderGeometry(0.18, 0.22, 4, 8);
            var col3 = makeMesh(colGeo3, 0xdbb860);
            col3.position.set(houseX + Math.cos(-angle + Math.PI * 0.5) * 2, 10, houseZ + Math.sin(-angle + Math.PI * 0.5) * 2);
        }

        // Central garden with plane trees
        var gardenGeo = new THREE.CylinderGeometry(40, 40, 0.3, 32);
        var garden = makeMesh(gardenGeo, 0x4a7c3f);
        garden.position.set(circusX, 0.15, circusZ);

        // Plane trees in central garden
        for (var t = 0; t < 5; t++) {
            var treeAngle = (t / 5) * Math.PI * 2;
            var treeR = 18;
            var treeX = circusX + Math.cos(treeAngle) * treeR;
            var treeZ = circusZ + Math.sin(treeAngle) * treeR;

            var trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 8, 8);
            var trunk = makeMesh(trunkGeo, 0x6b4c2a);
            trunk.position.set(treeX, 4, treeZ);

            var canopyGeo = new THREE.SphereGeometry(5, 8, 8);
            var canopy = makeMesh(canopyGeo, 0x3a6b2f);
            canopy.position.set(treeX, 10, treeZ);
        }

        // Center obelisk / lawn feature
        var lawnGeo = new THREE.CylinderGeometry(5, 5, 0.2, 16);
        var lawn = makeMesh(lawnGeo, 0x5a8c4a);
        lawn.position.set(circusX, 0.1, circusZ);
    }

    function buildRoyalCrescent() {
        // Royal Crescent: 30 townhouses in sweeping semi-ellipse
        // Semi-major axis ~120m, semi-minor axis ~60m
        var cresX = X_OFFSET + 30;
        var cresZ = -160;
        var semiA = 115;
        var semiB = 55;
        var numHouses = 30;

        for (var i = 0; i < numHouses; i++) {
            var t = (i / (numHouses - 1)) * Math.PI;
            var hx = cresX - Math.cos(t) * semiA;
            var hz = cresZ - Math.sin(t) * semiB;

            // Direction tangent for house rotation
            var tx2 = Math.sin(t);
            var tz2 = -Math.cos(t) * (semiB / semiA);
            var houseAngle = Math.atan2(tx2, tz2);

            // House body
            var houseGeo = new THREE.BoxGeometry(8, 16, 8);
            var house = makeMesh(houseGeo, 0xd4a853);
            house.position.set(hx, 8, hz);
            house.rotation.y = houseAngle;

            // Roof
            var roofGeo = new THREE.BoxGeometry(8.2, 1.5, 8.2);
            var roof = makeMesh(roofGeo, 0xb8903a);
            roof.position.set(hx, 16.75, hz);
            roof.rotation.y = houseAngle;

            // Ionic columns facade
            for (var c = -1; c <= 1; c += 2) {
                var colOffX = Math.cos(houseAngle + Math.PI * 0.5) * c * 2.5;
                var colOffZ = Math.sin(houseAngle + Math.PI * 0.5) * c * 2.5;
                var ionColGeo = new THREE.CylinderGeometry(0.3, 0.35, 12, 8);
                var ionCol = makeMesh(ionColGeo, 0xdbb860);
                ionCol.position.set(hx + colOffX, 6, hz + colOffZ);
            }
        }

        // No.1 Royal Crescent museum end marker
        var museumSignGeo = new THREE.BoxGeometry(1.5, 3, 0.3);
        var museumSign = makeMesh(museumSignGeo, 0x2233aa);
        museumSign.position.set(cresX + semiA, 1.5, cresZ);

        // Ha-ha lawn in front of crescent
        var hahaGeo = new THREE.BoxGeometry(240, 0.3, 60);
        var haha = makeMesh(hahaGeo, 0x4a7c3f);
        haha.position.set(cresX, 0.15, cresZ + 80);

        // Ha-ha retaining wall
        var hahaWallGeo = new THREE.BoxGeometry(240, 1.5, 1);
        var hahaWall = makeMesh(hahaWallGeo, 0xd4a853);
        hahaWall.position.set(cresX, 0.75, cresZ + 110);

        // Lawn trees
        for (var lt = 0; lt < 4; lt++) {
            var lawnTrunkGeo = new THREE.CylinderGeometry(0.4, 0.5, 7, 8);
            var lawnTrunk = makeMesh(lawnTrunkGeo, 0x5a3a1a);
            lawnTrunk.position.set(cresX - 80 + lt * 50, 3.5, cresZ + 70);

            var lawnCanopyGeo = new THREE.SphereGeometry(4, 8, 6);
            var lawnCanopy = makeMesh(lawnCanopyGeo, 0x3a6b2f);
            lawnCanopy.position.set(cresX - 80 + lt * 50, 9, cresZ + 70);
        }
    }

    function buildPulteneyBridge() {
        // Pulteney Bridge: Robert Adam's Palladian bridge with shops, three arches
        var bridgeX = X_OFFSET + 120;
        var bridgeZ = 200;
        var bridgeLen = 45;
        var bridgeW = 14;

        // Bridge deck
        var deckGeo = new THREE.BoxGeometry(bridgeLen, 1, bridgeW);
        var deck = makeMesh(deckGeo, 0xd4a853);
        deck.position.set(bridgeX, 4, bridgeZ);

        // Three arches beneath
        for (var a = 0; a < 3; a++) {
            var archX = bridgeX - 14 + a * 14;

            // Pier / arch body
            var pierGeo = new THREE.BoxGeometry(3, 5, bridgeW + 2);
            var pier = makeMesh(pierGeo, 0xc4944a);
            pier.position.set(archX - 7, 2.5, bridgeZ);

            // Arch opening represented as darker recess
            var archVoidGeo = new THREE.BoxGeometry(8, 4, bridgeW - 2);
            var archVoid = makeMesh(archVoidGeo, 0x443322);
            archVoid.position.set(archX, 2, bridgeZ);

            // Arch keystone
            var keystoneGeo = new THREE.BoxGeometry(1.5, 1, bridgeW - 2);
            var keystone = makeMesh(keystoneGeo, 0xd4a853);
            keystone.position.set(archX, 4, bridgeZ);
        }

        // Last pier
        var lastPierGeo = new THREE.BoxGeometry(3, 5, bridgeW + 2);
        var lastPier = makeMesh(lastPierGeo, 0xc4944a);
        lastPier.position.set(bridgeX + 14 + 7 - 14, 2.5, bridgeZ);

        // Shops on both sides of bridge deck
        for (var s = 0; s < 5; s++) {
            var shopZ1 = bridgeZ - 4;
            var shopZ2 = bridgeZ + 4;
            var shopX = bridgeX - 18 + s * 9;

            var shopGeo1 = new THREE.BoxGeometry(8, 5, 4);
            var shop1 = makeMesh(shopGeo1, 0xd4a853);
            shop1.position.set(shopX, 7, shopZ1);

            var shopRoof1Geo = new THREE.BoxGeometry(8.2, 1, 4.2);
            var shopRoof1 = makeMesh(shopRoof1Geo, 0xb8903a);
            shopRoof1.position.set(shopX, 9.5, shopZ1);

            var shopGeo2 = new THREE.BoxGeometry(8, 5, 4);
            var shop2 = makeMesh(shopGeo2, 0xd4a853);
            shop2.position.set(shopX, 7, shopZ2);

            var shopRoof2Geo = new THREE.BoxGeometry(8.2, 1, 4.2);
            var shopRoof2 = makeMesh(shopRoof2Geo, 0xb8903a);
            shopRoof2.position.set(shopX, 9.5, shopZ2);
        }

        // Palladian central pavilion on bridge
        var pavilionGeo = new THREE.BoxGeometry(10, 8, 16);
        var pavilion = makeMesh(pavilionGeo, 0xd4a853);
        pavilion.position.set(bridgeX, 9, bridgeZ);

        var pavilionRoofGeo = new THREE.BoxGeometry(10.5, 1.5, 16.5);
        var pavilionRoof = makeMesh(pavilionRoofGeo, 0xb8903a);
        pavilionRoof.position.set(bridgeX, 13.75, bridgeZ);

        // Pediment
        var pedGeo = new THREE.ConeGeometry(5.5, 3, 4);
        var ped = makeMesh(pedGeo, 0xd4a853);
        ped.position.set(bridgeX, 16, bridgeZ);
        ped.rotation.y = Math.PI * 0.25;

        // River Avon surface
        var riverGeo = new THREE.BoxGeometry(200, 0.3, 30);
        var river = makeMesh(riverGeo, 0x1a4a6b);
        river.position.set(bridgeX, 0, bridgeZ);

        // Pulteney Weir: horseshoe stepped weir downstream
        var weirX = bridgeX + 30;
        var weirGeo = new THREE.BoxGeometry(60, 1.5, 5);
        var weir = makeMesh(weirGeo, 0x8c7a5a);
        weir.position.set(weirX, 0.75, bridgeZ);

        // Stepped horseshoe weir sections
        for (var ws = 0; ws < 4; ws++) {
            var weirStepGeo = new THREE.BoxGeometry(60 - ws * 10, 0.5, 4);
            var weirStep = makeMesh(weirStepGeo, 0x9c8a6a);
            weirStep.position.set(weirX, 2 + ws * 0.5, bridgeZ + 5 + ws * 4);
        }

        // Weir spray/foam representation
        var foamGeo = new THREE.BoxGeometry(65, 0.4, 8);
        var foam = makeMesh(foamGeo, 0xddeeff);
        foam.position.set(weirX, 0.2, bridgeZ - 8);
    }

    function buildPumpRoomAndAbbeyYard() {
        // Pump Room and Abbey Churchyard (different from Roman Baths interior)
        var pumpX = X_OFFSET + 80;
        var pumpZ = 120;

        // Pump Room neoclassical facade
        var pumpGeo = new THREE.BoxGeometry(40, 14, 20);
        var pump = makeMesh(pumpGeo, 0xd4a853);
        pump.position.set(pumpX, 7, pumpZ);

        // Pump Room pediment
        var pumpPedGeo = new THREE.ConeGeometry(21, 5, 4);
        var pumpPed = makeMesh(pumpPedGeo, 0xd4a853);
        pumpPed.position.set(pumpX, 16.5, pumpZ);
        pumpPed.rotation.y = Math.PI * 0.25;

        // Pump Room columns
        for (var pc = -2; pc <= 2; pc++) {
            var pumpColGeo = new THREE.CylinderGeometry(0.5, 0.6, 12, 8);
            var pumpCol = makeMesh(pumpColGeo, 0xdbb860);
            pumpCol.position.set(pumpX + pc * 8, 6, pumpZ - 10);
        }

        // Abbey Churchyard paving
        var yardGeo = new THREE.BoxGeometry(80, 0.2, 60);
        var yard = makeMesh(yardGeo, 0xb8a880);
        yard.position.set(pumpX, 0.1, pumpZ + 40);

        // Bath Abbey facade (simplified towers)
        var abbeyX = pumpX - 20;
        var abbeyZ = pumpZ + 50;

        var abbeyBodyGeo = new THREE.BoxGeometry(35, 30, 25);
        var abbeyBody = makeMesh(abbeyBodyGeo, 0xd4a853);
        abbeyBody.position.set(abbeyX, 15, abbeyZ);

        // Abbey towers
        for (var at = -1; at <= 1; at += 2) {
            var towerGeo = new THREE.BoxGeometry(8, 38, 8);
            var tower = makeMesh(towerGeo, 0xd4a853);
            tower.position.set(abbeyX + at * 14, 19, abbeyZ - 5);

            // Tower pinnacles
            for (var tp = -1; tp <= 1; tp += 2) {
                for (var tp2 = -1; tp2 <= 1; tp2 += 2) {
                    var pinnacleGeo = new THREE.ConeGeometry(0.6, 4, 4);
                    var pinnacle = makeMesh(pinnacleGeo, 0xc49840);
                    pinnacle.position.set(abbeyX + at * 14 + tp * 3, 40, abbeyZ - 5 + tp2 * 3);
                }
            }
        }

        // Abbey great window - dark recess
        var windowGeo = new THREE.BoxGeometry(12, 20, 1);
        var window3d = makeMesh(windowGeo, 0x223344);
        window3d.position.set(abbeyX, 18, abbeyZ - 13);

        // Parade Gardens
        var paradeGeo = new THREE.BoxGeometry(100, 0.3, 50);
        var parade = makeMesh(paradeGeo, 0x4a7c3f);
        parade.position.set(pumpX + 30, 0.15, pumpZ + 80);

        // Bandstand in Parade Gardens
        var bandstandGeo = new THREE.CylinderGeometry(5, 5, 0.5, 12);
        var bandstand = makeMesh(bandstandGeo, 0xd4a853);
        bandstand.position.set(pumpX + 30, 0.25, pumpZ + 80);

        var bandstandRoofGeo = new THREE.ConeGeometry(6, 4, 12);
        var bandstandRoof = makeMesh(bandstandRoofGeo, 0x336699);
        bandstandRoof.position.set(pumpX + 30, 4.5, pumpZ + 80);
    }

    function buildThermaeBathSpa() {
        // Thermae Bath Spa: modern glass building adjacent to historic Bath
        var therX = X_OFFSET + 60;
        var therZ = 90;

        // Main contemporary glass tower
        var mainGeo = new THREE.BoxGeometry(28, 22, 28);
        var mainBuild = makeMesh(mainGeo, 0x88aacc);
        mainBuild.position.set(therX, 11, therZ);

        // Glass facade panels - slightly offset to suggest glazing
        var glassFrontGeo = new THREE.BoxGeometry(28.5, 22.5, 0.5);
        var glassFront = makeMesh(glassFrontGeo, 0x99bbdd);
        glassFront.position.set(therX, 11, therZ - 14.2);

        var glassBackGeo = new THREE.BoxGeometry(28.5, 22.5, 0.5);
        var glassBack = makeMesh(glassBackGeo, 0x99bbdd);
        glassBack.position.set(therX, 11, therZ + 14.2);

        var glassSide1Geo = new THREE.BoxGeometry(0.5, 22.5, 28.5);
        var glassSide1 = makeMesh(glassSide1Geo, 0x99bbdd);
        glassSide1.position.set(therX - 14.2, 11, therZ);

        var glassSide2Geo = new THREE.BoxGeometry(0.5, 22.5, 28.5);
        var glassSide2 = makeMesh(glassSide2Geo, 0x99bbdd);
        glassSide2.position.set(therX + 14.2, 11, therZ);

        // Rooftop open-air pool
        var roofPoolSurroundGeo = new THREE.BoxGeometry(30, 1, 30);
        var roofPoolSurround = makeMesh(roofPoolSurroundGeo, 0xd4a853);
        roofPoolSurround.position.set(therX, 22.5, therZ);

        var roofPoolGeo = new THREE.BoxGeometry(20, 0.5, 20);
        var roofPool = makeMesh(roofPoolGeo, 0x2266aa);
        roofPool.position.set(therX, 23, therZ);

        // Pool water shimmer (slightly elevated lighter plane)
        var poolWaterGeo = new THREE.BoxGeometry(19.5, 0.2, 19.5);
        var poolWater = makeMesh(poolWaterGeo, 0x44aacc);
        poolWater.position.set(therX, 23.3, therZ);

        // Rooftop pool edging
        var poolEdgeGeo = new THREE.BoxGeometry(21, 0.8, 1);
        var poolEdge1 = makeMesh(poolEdgeGeo, 0xd4a853);
        poolEdge1.position.set(therX, 23, therZ - 10.5);

        var poolEdge2 = makeMesh(new THREE.BoxGeometry(21, 0.8, 1), 0xd4a853);
        poolEdge2.position.set(therX, 23, therZ + 10.5);

        var poolEdge3 = makeMesh(new THREE.BoxGeometry(1, 0.8, 21), 0xd4a853);
        poolEdge3.position.set(therX - 10.5, 23, therZ);

        var poolEdge4 = makeMesh(new THREE.BoxGeometry(1, 0.8, 21), 0xd4a853);
        poolEdge4.position.set(therX + 10.5, 23, therZ);

        // Cross Bath adjacent historic building
        var crossBathGeo = new THREE.BoxGeometry(15, 10, 15);
        var crossBath = makeMesh(crossBathGeo, 0xd4a853);
        crossBath.position.set(therX - 25, 5, therZ);

        var crossBathDomeGeo = new THREE.SphereGeometry(7, 10, 8);
        var crossBathDome = makeMesh(crossBathDomeGeo, 0xc49840);
        crossBathDome.position.set(therX - 25, 12, therZ);

        // Hot Bath historic building
        var hotBathGeo = new THREE.BoxGeometry(18, 12, 18);
        var hotBath = makeMesh(hotBathGeo, 0xd4a853);
        hotBath.position.set(therX + 30, 6, therZ);
    }

    function buildMilsomStreet() {
        // Milsom Street: Georgian shopping street with Assembly Rooms
        var milsomX = X_OFFSET - 30;
        var milsomZ = -60;

        // Street surface
        var streetGeo = new THREE.BoxGeometry(120, 0.2, 12);
        var street = makeMesh(streetGeo, 0x888877);
        street.position.set(milsomX, 0.1, milsomZ);

        // Terraced Bath stone buildings on both sides
        for (var mb = 0; mb < 8; mb++) {
            var mbx = milsomX - 50 + mb * 14;

            // North side
            var buildN = new THREE.BoxGeometry(13, 12, 10);
            var northBuild = makeMesh(buildN, 0xd4a853);
            northBuild.position.set(mbx, 6, milsomZ - 11);

            var northRoofGeo = new THREE.BoxGeometry(13.2, 1.2, 10.2);
            var northRoof = makeMesh(northRoofGeo, 0xb8903a);
            northRoof.position.set(mbx, 12.6, milsomZ - 11);

            // South side
            var buildS = new THREE.BoxGeometry(13, 12, 10);
            var southBuild = makeMesh(buildS, 0xd4a853);
            southBuild.position.set(mbx, 6, milsomZ + 11);

            var southRoofGeo = new THREE.BoxGeometry(13.2, 1.2, 10.2);
            var southRoof = makeMesh(southRoofGeo, 0xb8903a);
            southRoof.position.set(mbx, 12.6, milsomZ + 11);
        }

        // Assembly Rooms (Fashion Museum) - grander building
        var assemblyX = milsomX - 20;
        var assemblyZ = milsomZ - 80;

        var assemblyGeo = new THREE.BoxGeometry(55, 14, 35);
        var assembly = makeMesh(assemblyGeo, 0xd4a853);
        assembly.position.set(assemblyX, 7, assemblyZ);

        // Assembly Rooms pediment
        var assemblyPedGeo = new THREE.ConeGeometry(28, 6, 4);
        var assemblyPed = makeMesh(assemblyPedGeo, 0xd4a853);
        assemblyPed.position.set(assemblyX, 17, assemblyZ);
        assemblyPed.rotation.y = Math.PI * 0.25;

        // Assembly Rooms columns
        for (var ac = -3; ac <= 3; ac++) {
            var aColGeo = new THREE.CylinderGeometry(0.6, 0.7, 12, 8);
            var aCol = makeMesh(aColGeo, 0xdbb860);
            aCol.position.set(assemblyX + ac * 8, 6, assemblyZ - 18);
        }

        // Assembly Rooms wings
        var wingLGeo = new THREE.BoxGeometry(20, 10, 20);
        var wingL = makeMesh(wingLGeo, 0xd4a853);
        wingL.position.set(assemblyX - 37, 5, assemblyZ);

        var wingRGeo = new THREE.BoxGeometry(20, 10, 20);
        var wingR = makeMesh(wingRGeo, 0xd4a853);
        wingR.position.set(assemblyX + 37, 5, assemblyZ);

        // Bridge Street leading to Pulteney Bridge
        var bridgeStGeo = new THREE.BoxGeometry(12, 0.2, 60);
        var bridgeSt = makeMesh(bridgeStGeo, 0x888877);
        bridgeSt.position.set(milsomX + 50, 0.1, milsomZ + 80);

        // Georgian terraces along Bridge Street
        for (var bs = 0; bs < 4; bs++) {
            var bsGeo = new THREE.BoxGeometry(10, 12, 8);
            var bsBuild = makeMesh(bsGeo, 0xd4a853);
            bsBuild.position.set(milsomX + 44, 6, milsomZ + 20 + bs * 16);

            var bsGeo2 = new THREE.BoxGeometry(10, 12, 8);
            var bsBuild2 = makeMesh(bsGeo2, 0xd4a853);
            bsBuild2.position.set(milsomX + 56, 6, milsomZ + 20 + bs * 16);
        }
    }

    function buildGroundPlane() {
        // Ground plane for this area
        var groundGeo = new THREE.BoxGeometry(600, 0.5, 600);
        var ground = makeMesh(groundGeo, 0x6b8c5a);
        ground.position.set(X_OFFSET, -0.25, 0);

        // Roads connecting features
        // Gay Street connecting Circus to Pump Room
        var roadGeo = new THREE.BoxGeometry(10, 0.2, 120);
        var road = makeMesh(roadGeo, 0x777766);
        road.position.set(X_OFFSET + 40, 0.1, 60);

        // Brock Street connecting Circus to Royal Crescent
        var brockGeo = new THREE.BoxGeometry(80, 0.2, 10);
        var brock = makeMesh(brockGeo, 0x777766);
        brock.position.set(X_OFFSET - 40, 0.1, -80);
    }

    function build() {
        buildGroundPlane();
        buildCircus();
        buildRoyalCrescent();
        buildPulteneyBridge();
        buildPumpRoomAndAbbeyYard();
        buildThermaeBathSpa();
        buildMilsomStreet();
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
