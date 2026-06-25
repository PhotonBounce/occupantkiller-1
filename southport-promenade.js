window.SouthportPromenade = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X = 22280;

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

    function mat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function build() {
        buildGround();
        buildBeach();
        buildIrishSea();
        buildMarineLake();
        buildPromenade();
        buildPier();
        buildLordStreet();
        buildAtkinsonGallery();
        buildTownHall();
        buildPleasureland();
        buildGolfCourse();
        buildSandDunes();
        buildStreetFurniture();
        buildVictorianGasLamps();
    }

    function buildGround() {
        // Base ground slab — large flat area
        var groundMat = mat(0x7A9E5A);
        var ground = new THREE.Mesh(
            new THREE.BoxGeometry(1200, 2, 1200),
            groundMat
        );
        ground.position.set(X, -1, 0);
        addMesh(ground);
    }

    function buildBeach() {
        // Sandy beach — wide and flat, west of promenade toward the sea
        var sandMat = mat(0xF4E0A0);
        var beach = new THREE.Mesh(
            new THREE.BoxGeometry(400, 1, 700),
            sandMat
        );
        beach.position.set(X - 350, 0.5, 50);
        addMesh(beach);

        // Tidal sand ripples (long low ridges)
        var rippleMat = mat(0xEDD898);
        var rippleOffsets = [-300, -260, -220, -180, -140, -100];
        for (var r = 0; r < rippleOffsets.length; r++) {
            var ripple = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.3, 650),
                rippleMat
            );
            ripple.position.set(X + rippleOffsets[r], 0.8, 50);
            addMesh(ripple);
        }

        // Seaweed / debris line at tide mark
        var debrisMat = mat(0x8B7355);
        var debris = new THREE.Mesh(
            new THREE.BoxGeometry(400, 0.3, 2),
            debrisMat
        );
        debris.position.set(X - 200, 0.65, 50);
        addMesh(debris);

        // Beach hut row — colourful small boxes
        var hutColors = [0xE53935, 0x1E88E5, 0x43A047, 0xFB8C00, 0x8E24AA, 0x00ACC1];
        for (var h = 0; h < 6; h++) {
            var hut = new THREE.Mesh(
                new THREE.BoxGeometry(3, 3, 3),
                mat(hutColors[h])
            );
            hut.position.set(X - 170 + h * 10, 1.5, -80);
            addMesh(hut);

            var hutRoof = new THREE.Mesh(
                new THREE.ConeGeometry(2.4, 1.5, 4),
                mat(0x5C3317)
            );
            hutRoof.rotation.y = Math.PI / 4;
            hutRoof.position.set(X - 170 + h * 10, 4, -80);
            addMesh(hutRoof);
        }
    }

    function buildIrishSea() {
        // Irish Sea — far west horizon water
        var seaMat = mat(0x006994);
        var sea = new THREE.Mesh(
            new THREE.BoxGeometry(600, 1, 1000),
            seaMat
        );
        sea.position.set(X - 750, 0.2, 50);
        addMesh(sea);

        // Shallow intertidal flats (lighter blue-grey)
        var flatsMat = mat(0x4A8FA8);
        var flats = new THREE.Mesh(
            new THREE.BoxGeometry(200, 0.5, 900),
            flatsMat
        );
        flats.position.set(X - 480, 0.25, 50);
        addMesh(flats);

        // Distant horizon haze bar
        var hazeMat = mat(0x3A6B80);
        var haze = new THREE.Mesh(
            new THREE.BoxGeometry(700, 8, 10),
            hazeMat
        );
        haze.position.set(X - 800, 4, 50);
        addMesh(haze);
    }

    function buildMarineLake() {
        // Marine Lake — artificial boating lake beside promenade
        var lakeMat = mat(0x4682B4);
        var lake = new THREE.Mesh(
            new THREE.BoxGeometry(120, 0.8, 200),
            lakeMat
        );
        lake.position.set(X - 90, 0.4, 80);
        addMesh(lake);

        // Lake perimeter stone wall
        var wallMat = mat(0x999988);

        var wallN = new THREE.Mesh(new THREE.BoxGeometry(130, 2, 2), wallMat);
        wallN.position.set(X - 90, 1, -20);
        addMesh(wallN);

        var wallS = new THREE.Mesh(new THREE.BoxGeometry(130, 2, 2), wallMat);
        wallS.position.set(X - 90, 1, 180);
        addMesh(wallS);

        var wallE = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 200), wallMat);
        wallE.position.set(X - 28, 1, 80);
        addMesh(wallE);

        var wallW = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 200), wallMat);
        wallW.position.set(X - 152, 1, 80);
        addMesh(wallW);

        // Boathouse — small lakeside building
        var boathouseMat = mat(0xC8A870);
        var boathouse = new THREE.Mesh(
            new THREE.BoxGeometry(14, 5, 10),
            boathouseMat
        );
        boathouse.position.set(X - 145, 2.5, 130);
        addMesh(boathouse);

        var boathouseRoof = new THREE.Mesh(
            new THREE.BoxGeometry(16, 2, 12),
            mat(0x7A5230)
        );
        boathouseRoof.position.set(X - 145, 6, 130);
        addMesh(boathouseRoof);

        // Rowing boats on the lake (small box shapes)
        var boatMat = mat(0xD2691E);
        var boatPositions = [
            [X - 70, 0.8, 60],
            [X - 100, 0.8, 100],
            [X - 120, 0.8, 140]
        ];
        for (var b = 0; b < boatPositions.length; b++) {
            var boat = new THREE.Mesh(
                new THREE.BoxGeometry(4, 1, 2),
                boatMat
            );
            boat.position.set(boatPositions[b][0], boatPositions[b][1], boatPositions[b][2]);
            addMesh(boat);
        }
    }

    function buildPromenade() {
        // Wide Victorian promenade boulevard running north-south
        var promMat = mat(0xD3D3D3);
        var promenade = new THREE.Mesh(
            new THREE.BoxGeometry(30, 0.6, 700),
            promMat
        );
        promenade.position.set(X - 25, 0.3, 50);
        addMesh(promenade);

        // Paving detail — lighter squares
        var pavingMat = mat(0xBFBFBF);
        for (var p = -300; p < 400; p += 20) {
            var paving = new THREE.Mesh(
                new THREE.BoxGeometry(28, 0.1, 1),
                pavingMat
            );
            paving.position.set(X - 25, 0.61, p);
            addMesh(paving);
        }

        // Central reservation / ornamental garden strip
        var gardenMat = mat(0x4A7C3F);
        var reservation = new THREE.Mesh(
            new THREE.BoxGeometry(4, 0.5, 600),
            gardenMat
        );
        reservation.position.set(X - 25, 0.55, 50);
        addMesh(reservation);

        // Promenade shelter — ornate Victorian iron and glass shelter
        var shelterMat = mat(0x444444);
        var shelterRoofMat = mat(0x006633);

        var shelter = new THREE.Mesh(
            new THREE.BoxGeometry(20, 4, 6),
            mat(0xEEEEEE)
        );
        shelter.position.set(X - 25, 2, -50);
        addMesh(shelter);

        var shelterRoof = new THREE.Mesh(
            new THREE.BoxGeometry(22, 1, 8),
            shelterRoofMat
        );
        shelterRoof.position.set(X - 25, 4.5, -50);
        addMesh(shelterRoof);

        // Shelter columns
        var shelterColPositions = [-9, -3, 3, 9];
        for (var sc = 0; sc < shelterColPositions.length; sc++) {
            var scol = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 4, 6),
                shelterMat
            );
            scol.position.set(X - 25 + shelterColPositions[sc], 2, -53);
            addMesh(scol);
        }

        // Second shelter further south
        var shelter2 = new THREE.Mesh(
            new THREE.BoxGeometry(20, 4, 6),
            mat(0xEEEEEE)
        );
        shelter2.position.set(X - 25, 2, 200);
        addMesh(shelter2);

        var shelterRoof2 = new THREE.Mesh(
            new THREE.BoxGeometry(22, 1, 8),
            shelterRoofMat
        );
        shelterRoof2.position.set(X - 25, 4.5, 200);
        addMesh(shelterRoof2);

        for (var sc2 = 0; sc2 < shelterColPositions.length; sc2++) {
            var scol2 = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 4, 6),
                shelterMat
            );
            scol2.position.set(X - 25 + shelterColPositions[sc2], 2, 197);
            addMesh(scol2);
        }

        // Promenade wall / sea wall edge
        var seaWallMat = mat(0xAAAAAA);
        var seaWall = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.5, 700),
            seaWallMat
        );
        seaWall.position.set(X - 42, 0.75, 50);
        addMesh(seaWall);
    }

    function buildPier() {
        // Southport Pier — second longest in England, 1.1 km
        // Victorian iron structure, running west into the sea from promenade
        var pierDeckMat = mat(0x8B6914);
        var ironMat = mat(0x555544);
        var railMat = mat(0x666655);

        // Pier deck — long wooden/iron deck
        var pierDeck = new THREE.Mesh(
            new THREE.BoxGeometry(550, 1.2, 8),
            pierDeckMat
        );
        pierDeck.position.set(X - 315, 1.6, -120);
        addMesh(pierDeck);

        // Pier support legs — rows of iron columns into the sea floor
        for (var pl = 0; pl < 28; pl++) {
            var legX = X - 40 - pl * 19;
            // Port leg
            var legPort = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 5, 6),
                ironMat
            );
            legPort.position.set(legX, -1, -123.5);
            addMesh(legPort);

            // Starboard leg
            var legStarboard = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.5, 5, 6),
                ironMat
            );
            legStarboard.position.set(legX, -1, -116.5);
            addMesh(legStarboard);

            // Cross brace between legs
            var brace = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.3, 7),
                ironMat
            );
            brace.position.set(legX, 0, -120);
            addMesh(brace);
        }

        // Pier railings along both sides
        var railN = new THREE.Mesh(
            new THREE.BoxGeometry(550, 0.4, 0.3),
            railMat
        );
        railN.position.set(X - 315, 2.6, -124.2);
        addMesh(railN);

        var railS = new THREE.Mesh(
            new THREE.BoxGeometry(550, 0.4, 0.3),
            railMat
        );
        railS.position.set(X - 315, 2.6, -115.8);
        addMesh(railS);

        // Pier railing posts
        for (var rp = 0; rp < 30; rp++) {
            var postX = X - 40 - rp * 18;
            var postN = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 1.2, 4),
                railMat
            );
            postN.position.set(postX, 2.2, -124.2);
            addMesh(postN);

            var postS = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 1.2, 4),
                railMat
            );
            postS.position.set(postX, 2.2, -115.8);
            addMesh(postS);
        }

        // Pier entrance building — ornate Victorian pavilion at landward end
        var entranceMat = mat(0xC8A870);
        var entranceBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(12, 8, 14),
            entranceMat
        );
        entranceBuilding.position.set(X - 40, 4, -120);
        addMesh(entranceBuilding);

        var entranceRoof = new THREE.Mesh(
            new THREE.ConeGeometry(8, 5, 4),
            mat(0x336633)
        );
        entranceRoof.rotation.y = Math.PI / 4;
        entranceRoof.position.set(X - 40, 11, -120);
        addMesh(entranceRoof);

        // Entrance clock tower finial
        var clockTower = new THREE.Mesh(
            new THREE.BoxGeometry(4, 6, 4),
            entranceMat
        );
        clockTower.position.set(X - 40, 17, -120);
        addMesh(clockTower);

        var clockDome = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 8, 6),
            mat(0x336633)
        );
        clockDome.position.set(X - 40, 22, -120);
        addMesh(clockDome);

        // Pier head pavilion — large structure at seaward end
        var headMat = mat(0xC8B870);
        var pierHead = new THREE.Mesh(
            new THREE.BoxGeometry(20, 7, 20),
            headMat
        );
        pierHead.position.set(X - 590, 4, -120);
        addMesh(pierHead);

        var pierHeadRoof = new THREE.Mesh(
            new THREE.BoxGeometry(22, 2, 22),
            mat(0x336633)
        );
        pierHeadRoof.position.set(X - 590, 8, -120);
        addMesh(pierHeadRoof);

        var pierHeadTower = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2.5, 8, 8),
            headMat
        );
        pierHeadTower.position.set(X - 590, 13, -120);
        addMesh(pierHeadTower);

        var pierHeadDome = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 8, 6),
            mat(0x336633)
        );
        pierHeadDome.position.set(X - 590, 18, -120);
        addMesh(pierHeadDome);

        // Miniature railway track along pier — two rails
        var trackMat = mat(0x777766);
        var trackN = new THREE.Mesh(
            new THREE.BoxGeometry(540, 0.2, 0.4),
            trackMat
        );
        trackN.position.set(X - 310, 2.2, -121.5);
        addMesh(trackN);

        var trackS = new THREE.Mesh(
            new THREE.BoxGeometry(540, 0.2, 0.4),
            trackMat
        );
        trackS.position.set(X - 310, 2.2, -118.5);
        addMesh(trackS);

        // Miniature railway train — small locomotive and carriage
        var loco = new THREE.Mesh(
            new THREE.BoxGeometry(5, 2.5, 2),
            mat(0xCC2200)
        );
        loco.position.set(X - 200, 3.45, -120);
        addMesh(loco);

        var locoStack = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 1.5, 6),
            mat(0x333322)
        );
        locoStack.position.set(X - 198, 5, -120);
        addMesh(locoStack);

        var carriage = new THREE.Mesh(
            new THREE.BoxGeometry(6, 2, 2),
            mat(0xCC8800)
        );
        carriage.position.set(X - 207, 3.2, -120);
        addMesh(carriage);

        // Pier lamp posts
        var lampMat = mat(0x444433);
        for (var lp = 0; lp < 10; lp++) {
            var lamp = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.15, 4, 5),
                lampMat
            );
            lamp.position.set(X - 80 - lp * 50, 3, -124);
            addMesh(lamp);

            var lampHead = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 6, 4),
                mat(0xFFFF99)
            );
            lampHead.position.set(X - 80 - lp * 50, 5.2, -124);
            addMesh(lampHead);
        }
    }

    function buildLordStreet() {
        // Lord Street — famous Victorian boulevard with canopied glass-and-iron arcades
        // French Baroque style, Napoleon III connection
        var roadMat = mat(0xD4C8A0);
        var arcadeMat = mat(0xC8B890);
        var ironCanopyMat = mat(0x336644);
        var glassMat = mat(0x88AACC);
        var stoneMat = mat(0xE8DCC8);

        // Lord Street road surface — runs east-west
        var lordStreet = new THREE.Mesh(
            new THREE.BoxGeometry(400, 0.5, 20),
            roadMat
        );
        lordStreet.position.set(X + 150, 0.25, -200);
        addMesh(lordStreet);

        // Pavement / sidewalk either side
        var pavMat = mat(0xC8C0A0);
        var pavNorth = new THREE.Mesh(
            new THREE.BoxGeometry(400, 0.4, 10),
            pavMat
        );
        pavNorth.position.set(X + 150, 0.2, -215);
        addMesh(pavNorth);

        var pavSouth = new THREE.Mesh(
            new THREE.BoxGeometry(400, 0.4, 10),
            pavMat
        );
        pavSouth.position.set(X + 150, 0.2, -185);
        addMesh(pavSouth);

        // Glass-and-iron canopied arcade — north side
        // Continuous arcade: columns + canopy roof panels
        for (var a = 0; a < 16; a++) {
            var ax = X - 20 + a * 25;

            // Arcade column (iron)
            var arcCol = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.4, 5, 6),
                mat(0x444433)
            );
            arcCol.position.set(ax, 2.5, -220);
            addMesh(arcCol);

            // Canopy panel (glass effect)
            var canopyPanel = new THREE.Mesh(
                new THREE.BoxGeometry(23, 0.3, 5),
                glassMat
            );
            canopyPanel.position.set(ax + 12.5, 5.2, -218);
            addMesh(canopyPanel);
        }

        // Canopy ridge beam running full length
        var canopyRidge = new THREE.Mesh(
            new THREE.BoxGeometry(400, 0.5, 0.5),
            mat(0x444433)
        );
        canopyRidge.position.set(X + 150, 5.5, -220);
        addMesh(canopyRidge);

        // Lord Street Victorian shopfronts — south side arcade buildings
        var shopColors = [0xD4C8A0, 0xC8B890, 0xDDD0B0, 0xCABD98];
        for (var sf = 0; sf < 8; sf++) {
            var shopX = X - 40 + sf * 46;

            var shopFront = new THREE.Mesh(
                new THREE.BoxGeometry(44, 10, 12),
                mat(shopColors[sf % 4])
            );
            shopFront.position.set(shopX + 22, 5, -177);
            addMesh(shopFront);

            var shopRoof = new THREE.Mesh(
                new THREE.BoxGeometry(46, 2, 14),
                mat(0xAA9977)
            );
            shopRoof.position.set(shopX + 22, 11, -177);
            addMesh(shopRoof);

            // Ornate cornice / pediment on alternate shops
            if (sf % 2 === 0) {
                var pediment = new THREE.Mesh(
                    new THREE.BoxGeometry(40, 3, 2),
                    stoneMat
                );
                pediment.position.set(shopX + 22, 12, -171);
                addMesh(pediment);
            }
        }

        // Central garden / boulevard median with flower beds
        var medianMat = mat(0x4A7C3F);
        var median = new THREE.Mesh(
            new THREE.BoxGeometry(350, 0.5, 6),
            medianMat
        );
        median.position.set(X + 130, 0.25, -200);
        addMesh(median);

        // Ornamental flowerbeds on median
        var flowerMat = mat(0xFF6699);
        var flowerPositions = [-40, -10, 20, 50, 80, 110];
        for (var f = 0; f < flowerPositions.length; f++) {
            var flowerBed = new THREE.Mesh(
                new THREE.BoxGeometry(12, 0.4, 4),
                flowerMat
            );
            flowerBed.position.set(X + flowerPositions[f] + 50, 0.45, -200);
            addMesh(flowerBed);
        }
    }

    function buildAtkinsonGallery() {
        // Atkinson Art Gallery — classical building on Lord Street
        var stoneMat = mat(0xF5F5DC);
        var roofMat = mat(0xCCBB99);
        var columnMat = mat(0xEEEEDD);
        var accentMat = mat(0xDDD0B0);

        var AX = X + 240;
        var AZ = -250;

        // Main gallery body
        var galleryMain = new THREE.Mesh(
            new THREE.BoxGeometry(50, 14, 30),
            stoneMat
        );
        galleryMain.position.set(AX, 7, AZ);
        addMesh(galleryMain);

        // Portico / entrance columns — classical front
        var colPositions = [-18, -9, 0, 9, 18];
        for (var c = 0; c < colPositions.length; c++) {
            var col = new THREE.Mesh(
                new THREE.CylinderGeometry(0.8, 0.9, 12, 8),
                columnMat
            );
            col.position.set(AX + colPositions[c], 6, AZ - 16);
            addMesh(col);
        }

        // Triangular pediment over portico
        var pediment = new THREE.Mesh(
            new THREE.BoxGeometry(42, 1, 2),
            stoneMat
        );
        pediment.position.set(AX, 13.5, AZ - 16);
        addMesh(pediment);

        var pedimentPeak = new THREE.Mesh(
            new THREE.ConeGeometry(22, 4, 3),
            stoneMat
        );
        pedimentPeak.rotation.y = Math.PI / 6;
        pedimentPeak.position.set(AX, 16, AZ - 16);
        addMesh(pedimentPeak);

        // Roof balustrade
        var balMat = mat(0xE8DCC8);
        var balustrade = new THREE.Mesh(
            new THREE.BoxGeometry(52, 1.5, 1),
            balMat
        );
        balustrade.position.set(AX, 15.5, AZ - 15);
        addMesh(balustrade);

        // Gallery roof
        var galleryRoof = new THREE.Mesh(
            new THREE.BoxGeometry(52, 2, 32),
            roofMat
        );
        galleryRoof.position.set(AX, 15, AZ);
        addMesh(galleryRoof);

        // Side wings
        var wingL = new THREE.Mesh(
            new THREE.BoxGeometry(12, 10, 28),
            accentMat
        );
        wingL.position.set(AX - 31, 5, AZ);
        addMesh(wingL);

        var wingR = new THREE.Mesh(
            new THREE.BoxGeometry(12, 10, 28),
            accentMat
        );
        wingR.position.set(AX + 31, 5, AZ);
        addMesh(wingR);

        // Steps at entrance
        var stepsMat = mat(0xDDCC99);
        for (var st = 0; st < 3; st++) {
            var step = new THREE.Mesh(
                new THREE.BoxGeometry(30, 0.5, 2),
                stepsMat
            );
            step.position.set(AX, 0.5 + st * 0.5, AZ - 17 - st * 2);
            addMesh(step);
        }
    }

    function buildTownHall() {
        // Southport Town Hall — neoclassical building on Lord Street
        var stoneMat = mat(0xF5F5DC);
        var roofMat = mat(0xBBAA88);
        var columnMat = mat(0xEEEEDD);
        var domeMat = mat(0xCCBB99);

        var TX = X + 80;
        var TZ = -260;

        // Main town hall body
        var hallMain = new THREE.Mesh(
            new THREE.BoxGeometry(40, 16, 25),
            stoneMat
        );
        hallMain.position.set(TX, 8, TZ);
        addMesh(hallMain);

        // Grand portico columns
        var thColPositions = [-14, -7, 0, 7, 14];
        for (var tc = 0; tc < thColPositions.length; tc++) {
            var thCol = new THREE.Mesh(
                new THREE.CylinderGeometry(0.9, 1.0, 14, 8),
                columnMat
            );
            thCol.position.set(TX + thColPositions[tc], 7, TZ - 14);
            addMesh(thCol);
        }

        // Pediment over portico
        var thPediment = new THREE.Mesh(
            new THREE.BoxGeometry(32, 1.5, 2),
            stoneMat
        );
        thPediment.position.set(TX, 15.5, TZ - 14);
        addMesh(thPediment);

        // Central cupola / dome
        var cupola = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 5, 5, 10),
            stoneMat
        );
        cupola.position.set(TX, 19.5, TZ);
        addMesh(cupola);

        var cupolaDome = new THREE.Mesh(
            new THREE.SphereGeometry(4.5, 10, 7),
            domeMat
        );
        cupolaDome.scale.y = 0.7;
        cupolaDome.position.set(TX, 24, TZ);
        addMesh(cupolaDome);

        var cupolaLantern = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.5, 3, 8),
            stoneMat
        );
        cupolaLantern.position.set(TX, 28, TZ);
        addMesh(cupolaLantern);

        var cupolaFlag = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 0.1),
            mat(0xCC0000)
        );
        cupolaFlag.position.set(TX + 1.5, 32, TZ);
        addMesh(cupolaFlag);

        // Town Hall roof
        var hallRoof = new THREE.Mesh(
            new THREE.BoxGeometry(42, 2, 27),
            roofMat
        );
        hallRoof.position.set(TX, 17, TZ);
        addMesh(hallRoof);

        // Entrance steps
        var thStepsMat = mat(0xDDCC99);
        for (var ths = 0; ths < 4; ths++) {
            var thStep = new THREE.Mesh(
                new THREE.BoxGeometry(22, 0.4, 1.8),
                thStepsMat
            );
            thStep.position.set(TX, 0.4 + ths * 0.4, TZ - 15 - ths * 1.8);
            addMesh(thStep);
        }
    }

    function buildPleasureland() {
        // Pleasureland — Southport's famous amusement park
        var groundMat = mat(0xAA8855);
        var PX = X + 150;
        var PZ = 150;

        // Pleasureland ground
        var plGround = new THREE.Mesh(
            new THREE.BoxGeometry(200, 0.5, 200),
            groundMat
        );
        plGround.position.set(PX, 0.25, PZ);
        addMesh(plGround);

        // Perimeter fence
        var fenceMat = mat(0x886633);
        var fenceN = new THREE.Mesh(new THREE.BoxGeometry(202, 2, 0.5), fenceMat);
        fenceN.position.set(PX, 1, PZ - 100);
        addMesh(fenceN);

        var fenceS = new THREE.Mesh(new THREE.BoxGeometry(202, 2, 0.5), fenceMat);
        fenceS.position.set(PX, 1, PZ + 100);
        addMesh(fenceS);

        var fenceE = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 200), fenceMat);
        fenceE.position.set(PX + 100, 1, PZ);
        addMesh(fenceE);

        var fenceW = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2, 200), fenceMat);
        fenceW.position.set(PX - 100, 1, PZ);
        addMesh(fenceW);

        // Roller coaster — zig-zag box approximation of the Cyclone
        // Supports / legs
        var rcMat = mat(0xFF8844);
        var rcSteelMat = mat(0xCC6622);
        var legHeights = [20, 12, 22, 8, 18, 14, 24, 10, 16];
        for (var lg = 0; lg < legHeights.length; lg++) {
            var rcLeg = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, legHeights[lg], 1.5),
                rcSteelMat
            );
            rcLeg.position.set(PX - 60 + lg * 12, legHeights[lg] / 2, PZ - 40);
            addMesh(rcLeg);
        }

        // Roller coaster track sections — zig-zag
        var trackMat = mat(0xFFAA55);
        var rcTracks = [
            { x: PX - 60, y: 20, z: PZ - 40, w: 14, h: 1, d: 3, ry: 0 },
            { x: PX - 46, y: 12, z: PZ - 40, w: 14, h: 1, d: 3, ry: 0 },
            { x: PX - 32, y: 22, z: PZ - 40, w: 14, h: 1, d: 3, ry: 0 },
            { x: PX - 18, y: 8, z: PZ - 40,  w: 14, h: 1, d: 3, ry: 0 },
            { x: PX - 4,  y: 18, z: PZ - 40, w: 14, h: 1, d: 3, ry: 0 },
            { x: PX + 10, y: 14, z: PZ - 40, w: 14, h: 1, d: 3, ry: 0 },
            { x: PX + 24, y: 24, z: PZ - 40, w: 14, h: 1, d: 3, ry: 0 },
            { x: PX + 38, y: 10, z: PZ - 40, w: 14, h: 1, d: 3, ry: 0 }
        ];
        for (var rt = 0; rt < rcTracks.length; rt++) {
            var rct = rcTracks[rt];
            var rcTrack = new THREE.Mesh(
                new THREE.BoxGeometry(rct.w, rct.h, rct.d),
                trackMat
            );
            rcTrack.position.set(rct.x, rct.y, rct.z);
            addMesh(rcTrack);
        }

        // Big wheel — approximated with CylinderGeometry ring and spokes
        var wheelMat = mat(0xDD4422);
        var spokeMat = mat(0xCC3311);
        var WX = PX + 60;
        var WZ = PZ + 40;

        // Wheel outer ring — thin cylinder (ring approximation)
        var wheelOuter = new THREE.Mesh(
            new THREE.CylinderGeometry(18, 18, 1.5, 16),
            wheelMat
        );
        wheelOuter.rotation.x = Math.PI / 2;
        wheelOuter.position.set(WX, 20, WZ);
        addMesh(wheelOuter);

        // Wheel hub
        var wheelHub = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 2, 8),
            spokeMat
        );
        wheelHub.rotation.x = Math.PI / 2;
        wheelHub.position.set(WX, 20, WZ);
        addMesh(wheelHub);

        // Wheel spokes (8 spokes)
        var spokeAngles = [0, 0.393, 0.785, 1.178, 1.571, 1.963, 2.356, 2.749];
        for (var sp = 0; sp < spokeAngles.length; sp++) {
            var spoke = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 36, 0.6),
                spokeMat
            );
            spoke.rotation.z = spokeAngles[sp];
            spoke.position.set(WX, 20, WZ);
            addMesh(spoke);
        }

        // Wheel support legs (A-frame)
        var legMat = mat(0x884422);
        var legLift = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 24, 1.5),
            legMat
        );
        legLift.position.set(WX - 8, 12, WZ);
        addMesh(legLift);

        var legRift = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 24, 1.5),
            legMat
        );
        legRift.position.set(WX + 8, 12, WZ);
        addMesh(legRift);

        // Gondolas on the wheel (small boxes)
        var gondolaMat = mat(0xFFCC00);
        var gondolaRadius = 16;
        var gondolaAngles = [0, 1.047, 2.094, 3.142, 4.189, 5.236];
        for (var g = 0; g < gondolaAngles.length; g++) {
            var gx = WX + Math.sin(gondolaAngles[g]) * gondolaRadius;
            var gy = 20 + Math.cos(gondolaAngles[g]) * gondolaRadius;
            var gondola = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 2, 1.5),
                gondolaMat
            );
            gondola.position.set(gx, gy, WZ);
            addMesh(gondola);
        }

        // Carousel / roundabout structure
        var carouselMat = mat(0xFF4499);
        var carousel = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 0.5, 12),
            carouselMat
        );
        carousel.position.set(PX - 40, 0.5, PZ + 50);
        addMesh(carousel);

        var carouselRoof = new THREE.Mesh(
            new THREE.ConeGeometry(10, 6, 12),
            mat(0xFF2266)
        );
        carouselRoof.position.set(PX - 40, 7, PZ + 50);
        addMesh(carouselRoof);

        var carouselPole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.4, 8, 6),
            mat(0xFFCC00)
        );
        carouselPole.position.set(PX - 40, 4, PZ + 50);
        addMesh(carouselPole);

        // Bumper car arena
        var bumperMat = mat(0x444488);
        var bumperArena = new THREE.Mesh(
            new THREE.BoxGeometry(24, 0.5, 18),
            bumperMat
        );
        bumperArena.position.set(PX + 30, 0.5, PZ + 60);
        addMesh(bumperArena);

        var bumperWall = new THREE.Mesh(
            new THREE.BoxGeometry(26, 3, 0.5),
            mat(0x5555AA)
        );
        bumperWall.position.set(PX + 30, 1.5, PZ + 51);
        addMesh(bumperWall);

        // Arcade building
        var arcadeMat = mat(0xFF5533);
        var arcadeBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(30, 8, 16),
            arcadeMat
        );
        arcadeBuilding.position.set(PX - 70, 4, PZ + 20);
        addMesh(arcadeBuilding);

        var arcadeSign = new THREE.Mesh(
            new THREE.BoxGeometry(32, 3, 1),
            mat(0xFFAA00)
        );
        arcadeSign.position.set(PX - 70, 10, PZ + 12);
        addMesh(arcadeSign);
    }

    function buildGolfCourse() {
        // Royal Birkdale Golf Club — links course visible to north
        var linksMat = mat(0x4CAF50);
        var roughMat = mat(0x388E3C);
        var fairwayMat = mat(0x66BB6A);
        var sandMat = mat(0xF4E0A0);
        var clubhouseMat = mat(0xEEDDB0);

        var GX = X + 100;
        var GZ = -350;

        // Golf course ground (links-style)
        var linksGround = new THREE.Mesh(
            new THREE.BoxGeometry(300, 0.5, 250),
            linksMat
        );
        linksGround.position.set(GX, 0.25, GZ);
        addMesh(linksGround);

        // Fairway strips (slightly lighter green)
        var fairwayPositions = [
            [GX - 80, GZ - 80, 60, 100],
            [GX + 20, GZ + 20, 55, 110],
            [GX + 100, GZ - 50, 60, 90]
        ];
        for (var fw = 0; fw < fairwayPositions.length; fw++) {
            var fairway = new THREE.Mesh(
                new THREE.BoxGeometry(fairwayPositions[fw][2], 0.3, fairwayPositions[fw][3]),
                fairwayMat
            );
            fairway.position.set(fairwayPositions[fw][0], 0.4, fairwayPositions[fw][1]);
            addMesh(fairway);
        }

        // Sand bunkers (multiple)
        var bunkerPositions = [
            [GX - 50, GZ - 60, 14, 10],
            [GX + 60, GZ + 30, 12, 9],
            [GX + 90, GZ - 90, 10, 8],
            [GX - 20, GZ + 60, 11, 10]
        ];
        for (var bk = 0; bk < bunkerPositions.length; bk++) {
            var bunker = new THREE.Mesh(
                new THREE.BoxGeometry(bunkerPositions[bk][2], 0.3, bunkerPositions[bk][3]),
                sandMat
            );
            bunker.position.set(bunkerPositions[bk][0], 0.4, bunkerPositions[bk][1]);
            addMesh(bunker);
        }

        // Flag pins on greens
        var pinMat = mat(0xDD2200);
        var pinPositions = [
            [GX - 80, GZ - 80],
            [GX + 20, GZ + 20],
            [GX + 100, GZ - 50]
        ];
        for (var pin = 0; pin < pinPositions.length; pin++) {
            var pinPole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 3, 4),
                mat(0xFFFFFF)
            );
            pinPole.position.set(pinPositions[pin][0], 1.5, pinPositions[pin][1]);
            addMesh(pinPole);

            var pinFlag = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.8, 0.1),
                pinMat
            );
            pinFlag.position.set(pinPositions[pin][0] + 0.75, 2.8, pinPositions[pin][1]);
            addMesh(pinFlag);
        }

        // Clubhouse — distinguished Victorian/Edwardian building
        var clubhouse = new THREE.Mesh(
            new THREE.BoxGeometry(40, 10, 20),
            clubhouseMat
        );
        clubhouse.position.set(GX + 80, 5, GZ - 100);
        addMesh(clubhouse);

        var clubhouseRoof = new THREE.Mesh(
            new THREE.BoxGeometry(42, 4, 22),
            mat(0x996644)
        );
        clubhouseRoof.position.set(GX + 80, 12, GZ - 100);
        addMesh(clubhouseRoof);

        var clubhouseChimneyL = new THREE.Mesh(
            new THREE.BoxGeometry(2, 5, 2),
            mat(0xCC9966)
        );
        clubhouseChimneyL.position.set(GX + 65, 16, GZ - 100);
        addMesh(clubhouseChimneyL);

        var clubhouseChimneyR = new THREE.Mesh(
            new THREE.BoxGeometry(2, 5, 2),
            mat(0xCC9966)
        );
        clubhouseChimneyR.position.set(GX + 95, 16, GZ - 100);
        addMesh(clubhouseChimneyR);
    }

    function buildSandDunes() {
        // Sand dunes to the north of the beach
        var duneMat = mat(0xEDD898);
        var duneGrassMat = mat(0x8BC34A);

        var duneData = [
            { x: X - 280, z: -200, w: 60, h: 8,  d: 30 },
            { x: X - 320, z: -250, w: 50, h: 12, d: 35 },
            { x: X - 260, z: -300, w: 70, h: 7,  d: 28 },
            { x: X - 340, z: -180, w: 45, h: 10, d: 32 },
            { x: X - 300, z: -150, w: 55, h: 6,  d: 25 },
            { x: X - 250, z: -350, w: 80, h: 14, d: 40 },
            { x: X - 370, z: -320, w: 50, h: 9,  d: 30 }
        ];

        for (var d = 0; d < duneData.length; d++) {
            var dd = duneData[d];
            var dune = new THREE.Mesh(
                new THREE.BoxGeometry(dd.w, dd.h, dd.d),
                duneMat
            );
            dune.position.set(dd.x, dd.h / 2 - 0.5, dd.z);
            addMesh(dune);

            // Marram grass tuft on top of dune
            var grass = new THREE.Mesh(
                new THREE.BoxGeometry(dd.w * 0.6, 1.5, dd.d * 0.6),
                duneGrassMat
            );
            grass.position.set(dd.x, dd.h + 0.5, dd.z);
            addMesh(grass);
        }

        // Dune path / boardwalk
        var boardwalkMat = mat(0xA0826D);
        var boardwalk = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.3, 200),
            boardwalkMat
        );
        boardwalk.position.set(X - 220, 0.65, -260);
        addMesh(boardwalk);
    }

    function buildStreetFurniture() {
        // Park benches along promenade
        var benchMat = mat(0x5C3317);
        var benchPositions = [
            [X - 15, -30],
            [X - 15, 0],
            [X - 15, 30],
            [X - 15, 60],
            [X - 15, 90],
            [X - 15, 120]
        ];
        for (var bn = 0; bn < benchPositions.length; bn++) {
            var benchSeat = new THREE.Mesh(
                new THREE.BoxGeometry(3, 0.3, 1),
                benchMat
            );
            benchSeat.position.set(benchPositions[bn][0], 1, benchPositions[bn][1]);
            addMesh(benchSeat);

            var benchLegL = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 1, 1),
                benchMat
            );
            benchLegL.position.set(benchPositions[bn][0] - 1.3, 0.5, benchPositions[bn][1]);
            addMesh(benchLegL);

            var benchLegR = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 1, 1),
                benchMat
            );
            benchLegR.position.set(benchPositions[bn][0] + 1.3, 0.5, benchPositions[bn][1]);
            addMesh(benchLegR);
        }

        // Ice cream kiosk
        var kioskMat = mat(0xFFFFCC);
        var kiosk = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 4),
            kioskMat
        );
        kiosk.position.set(X - 15, 2, 170);
        addMesh(kiosk);

        var kioskRoof = new THREE.Mesh(
            new THREE.ConeGeometry(3.5, 2, 4),
            mat(0xFF6699)
        );
        kioskRoof.rotation.y = Math.PI / 4;
        kioskRoof.position.set(X - 15, 5, 170);
        addMesh(kioskRoof);

        // Postcard / gift shop kiosk
        var giftShop = new THREE.Mesh(
            new THREE.BoxGeometry(5, 5, 4),
            mat(0xFFEECC)
        );
        giftShop.position.set(X - 15, 2.5, 145);
        addMesh(giftShop);

        var giftShopRoof = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.5, 5),
            mat(0x336644)
        );
        giftShopRoof.position.set(X - 15, 5.5, 145);
        addMesh(giftShopRoof);

        // Donkeys on the beach (approximate animal shapes)
        var donkeyBodyMat = mat(0x8B7355);
        var donkeyPositions = [
            [X - 100, 0, 0],
            [X - 120, 0, 20],
            [X - 110, 0, 40]
        ];
        for (var dk = 0; dk < donkeyPositions.length; dk++) {
            var dkBody = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 4),
                donkeyBodyMat
            );
            dkBody.position.set(donkeyPositions[dk][0], 1, donkeyPositions[dk][2]);
            addMesh(dkBody);

            var dkHead = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 1.2, 1.5),
                donkeyBodyMat
            );
            dkHead.position.set(donkeyPositions[dk][0], 2, donkeyPositions[dk][2] - 2.5);
            addMesh(dkHead);

            var dkEarL = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.8, 0.3),
                donkeyBodyMat
            );
            dkEarL.position.set(donkeyPositions[dk][0] - 0.5, 2.9, donkeyPositions[dk][2] - 2.5);
            addMesh(dkEarL);

            var dkEarR = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.8, 0.3),
                donkeyBodyMat
            );
            dkEarR.position.set(donkeyPositions[dk][0] + 0.5, 2.9, donkeyPositions[dk][2] - 2.5);
            addMesh(dkEarR);
        }

        // Litter bins along promenade
        var binMat = mat(0x444444);
        var binPositions = [-60, -20, 20, 60, 100, 140];
        for (var bi = 0; bi < binPositions.length; bi++) {
            var bin = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.3, 1.2, 6),
                binMat
            );
            bin.position.set(X - 38, 0.6, binPositions[bi]);
            addMesh(bin);
        }
    }

    function buildVictorianGasLamps() {
        // Victorian gas lamp posts along promenade and Lord Street
        var postMat = mat(0x333322);
        var globeMat = mat(0xFFFFCC);

        // Promenade lamp posts
        var promLampZ = [-280, -240, -200, -160, -120, -80, -40, 0, 40, 80, 120, 160, 200];
        for (var vl = 0; vl < promLampZ.length; vl++) {
            var vlPost = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.22, 5, 6),
                postMat
            );
            vlPost.position.set(X - 10, 2.5, promLampZ[vl]);
            addMesh(vlPost);

            var vlArm = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.15, 0.15),
                postMat
            );
            vlArm.position.set(X - 9, 5.3, promLampZ[vl]);
            addMesh(vlArm);

            var vlGlobe = new THREE.Mesh(
                new THREE.SphereGeometry(0.45, 6, 4),
                globeMat
            );
            vlGlobe.position.set(X - 8, 5.5, promLampZ[vl]);
            addMesh(vlGlobe);
        }

        // Lord Street lamp posts
        var lsLampX = [-60, -20, 20, 60, 100, 140, 180, 220, 260, 300];
        for (var ll = 0; ll < lsLampX.length; ll++) {
            var llPost = new THREE.Mesh(
                new THREE.CylinderGeometry(0.18, 0.22, 6, 6),
                postMat
            );
            llPost.position.set(X + lsLampX[ll], 3, -208);
            addMesh(llPost);

            var llGlobe = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 6, 4),
                globeMat
            );
            llGlobe.position.set(X + lsLampX[ll], 6.3, -208);
            addMesh(llGlobe);
        }
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
