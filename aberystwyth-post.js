window.AberystwythPost = (function() {
    'use strict';

    var WORLD_X = 3430;
    var WORLD_Z = 2200;

    function buildCastle(group) {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
        var mainWall = new THREE.Mesh(
            new THREE.BoxGeometry(20, 8, 14),
            wallMat
        );
        mainWall.position.set(WORLD_X - 30, 4, WORLD_Z - 60);
        group.add(mainWall);

        var towerMat = new THREE.MeshLambertMaterial({ color: 0x857565 });
        var tower1 = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 12, 8),
            towerMat
        );
        tower1.position.set(WORLD_X - 42, 6, WORLD_Z - 60);
        group.add(tower1);

        var tower2 = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 12, 8),
            towerMat
        );
        tower2.position.set(WORLD_X - 18, 6, WORLD_Z - 60);
        group.add(tower2);

        var battlement1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 14),
            wallMat
        );
        battlement1.position.set(WORLD_X - 38, 9, WORLD_Z - 60);
        group.add(battlement1);

        var battlement2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 14),
            wallMat
        );
        battlement2.position.set(WORLD_X - 22, 9, WORLD_Z - 60);
        group.add(battlement2);

        var ruinedSection = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 3),
            wallMat
        );
        ruinedSection.position.set(WORLD_X - 30, 2.5, WORLD_Z - 67);
        group.add(ruinedSection);
    }

    function buildFunicular(group) {
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        var trackLower = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1, 40),
            trackMat
        );
        trackLower.rotation.x = Math.PI * 0.18;
        trackLower.position.set(WORLD_X + 20, 6, WORLD_Z - 20);
        group.add(trackLower);

        var trackUpper = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1, 20),
            trackMat
        );
        trackUpper.rotation.x = Math.PI * 0.18;
        trackUpper.position.set(WORLD_X + 20, 14, WORLD_Z - 50);
        group.add(trackUpper);

        var carMat = new THREE.MeshLambertMaterial({ color: 0xCC4400 });
        var railCar = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 6),
            carMat
        );
        railCar.rotation.x = Math.PI * 0.18;
        railCar.position.set(WORLD_X + 20, 10, WORLD_Z - 35);
        group.add(railCar);

        var obscuraMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var obscuraBase = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 8),
            obscuraMat
        );
        obscuraBase.position.set(WORLD_X + 20, 21, WORLD_Z - 65);
        group.add(obscuraBase);

        var domeMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var dome = new THREE.Mesh(
            new THREE.SphereGeometry(4, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5),
            domeMat
        );
        dome.position.set(WORLD_X + 20, 27, WORLD_Z - 65);
        group.add(dome);
    }

    function buildUniversityBuilding(group) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0xD4D0C0 });
        var mainBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(24, 12, 16),
            stoneMat
        );
        mainBuilding.position.set(WORLD_X, 6, WORLD_Z + 20);
        group.add(mainBuilding);

        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0xB8B4A4 });
        var centralTower = new THREE.Mesh(
            new THREE.BoxGeometry(6, 22, 6),
            darkStoneMat
        );
        centralTower.position.set(WORLD_X, 11, WORLD_Z + 20);
        group.add(centralTower);

        var clockMat = new THREE.MeshLambertMaterial({ color: 0x888878 });
        var clockFace = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 0.5, 12),
            clockMat
        );
        clockFace.rotation.x = Math.PI * 0.5;
        clockFace.position.set(WORLD_X, 18, WORLD_Z + 17);
        group.add(clockFace);

        var orielMat = new THREE.MeshLambertMaterial({ color: 0xC8C4B4 });
        var oriel1 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 5, 2),
            orielMat
        );
        oriel1.position.set(WORLD_X - 8, 7, WORLD_Z + 12);
        group.add(oriel1);

        var oriel2 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 5, 2),
            orielMat
        );
        oriel2.position.set(WORLD_X + 8, 7, WORLD_Z + 12);
        group.add(oriel2);

        var wingMat = new THREE.MeshLambertMaterial({ color: 0xD4D0C0 });
        var leftWing = new THREE.Mesh(
            new THREE.BoxGeometry(8, 10, 10),
            wingMat
        );
        leftWing.position.set(WORLD_X - 16, 5, WORLD_Z + 22);
        group.add(leftWing);

        var rightWing = new THREE.Mesh(
            new THREE.BoxGeometry(8, 10, 10),
            wingMat
        );
        rightWing.position.set(WORLD_X + 16, 5, WORLD_Z + 22);
        group.add(rightWing);
    }

    function buildCardiganBay(group) {
        var seaMat = new THREE.MeshLambertMaterial({ color: 0x1A5A8A });

        var seaFar = new THREE.Mesh(
            new THREE.BoxGeometry(200, 1, 80),
            seaMat
        );
        seaFar.position.set(WORLD_X - 60, -1, WORLD_Z - 100);
        group.add(seaFar);

        var seaMid = new THREE.Mesh(
            new THREE.BoxGeometry(160, 1, 40),
            seaMat
        );
        seaMid.position.set(WORLD_X - 50, -0.5, WORLD_Z - 70);
        group.add(seaMid);

        var deepSeaMat = new THREE.MeshLambertMaterial({ color: 0x0F3D6A });
        var deepSea = new THREE.Mesh(
            new THREE.BoxGeometry(220, 1, 60),
            deepSeaMat
        );
        deepSea.position.set(WORLD_X - 60, -2, WORLD_Z - 150);
        group.add(deepSea);

        var dolphinMat = new THREE.MeshLambertMaterial({ color: 0x6A6A7A });
        var dolphinPositions = [
            [WORLD_X - 50, 1, WORLD_Z - 90],
            [WORLD_X - 55, 1.5, WORLD_Z - 95],
            [WORLD_X - 45, 0.8, WORLD_Z - 88],
            [WORLD_X - 80, 1, WORLD_Z - 110],
            [WORLD_X - 85, 1.5, WORLD_Z - 115],
            [WORLD_X - 75, 0.8, WORLD_Z - 108],
            [WORLD_X - 30, 1, WORLD_Z - 105],
            [WORLD_X - 35, 1.5, WORLD_Z - 110]
        ];

        var di;
        for (di = 0; di < dolphinPositions.length; di++) {
            var dp = dolphinPositions[di];
            var dolphinBody = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 6, 5),
                dolphinMat
            );
            dolphinBody.position.set(dp[0], dp[1], dp[2]);
            group.add(dolphinBody);

            var fin = new THREE.Mesh(
                new THREE.ConeGeometry(0.5, 1.2, 4),
                dolphinMat
            );
            fin.position.set(dp[0], dp[1] + 1.2, dp[2]);
            group.add(fin);
        }
    }

    function buildPromenade(group) {
        var promMat = new THREE.MeshLambertMaterial({ color: 0x9E9E9E });
        var promenade = new THREE.Mesh(
            new THREE.BoxGeometry(80, 1, 6),
            promMat
        );
        promenade.position.set(WORLD_X - 20, 0, WORLD_Z - 40);
        group.add(promenade);

        var lampPostMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var lampGlobeMat = new THREE.MeshLambertMaterial({ color: 0xFFFFCC });

        var lampStart = WORLD_X - 60;
        var lampEnd = WORLD_X + 20;
        var lx;
        for (lx = lampStart; lx <= lampEnd; lx += 8) {
            var pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.2, 5, 6),
                lampPostMat
            );
            pole.position.set(lx, 2.5, WORLD_Z - 37);
            group.add(pole);

            var globe = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 6, 5),
                lampGlobeMat
            );
            globe.position.set(lx, 5.3, WORLD_Z - 37);
            group.add(globe);

            var arm = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.1, 1),
                lampPostMat
            );
            arm.position.set(lx, 5, WORLD_Z - 37.5);
            group.add(arm);
        }

        var railMat = new THREE.MeshLambertMaterial({ color: 0x556655 });
        var handrail = new THREE.Mesh(
            new THREE.BoxGeometry(80, 0.3, 0.3),
            railMat
        );
        handrail.position.set(WORLD_X - 20, 1.5, WORLD_Z - 43);
        group.add(handrail);

        var benchMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        var benchPositions = [
            WORLD_X - 40,
            WORLD_X - 20,
            WORLD_X,
            WORLD_X + 20
        ];
        var bi;
        for (bi = 0; bi < benchPositions.length; bi++) {
            var bench = new THREE.Mesh(
                new THREE.BoxGeometry(3, 0.3, 1),
                benchMat
            );
            bench.position.set(benchPositions[bi], 1, WORLD_Z - 42);
            group.add(bench);
        }
    }

    function buildNationalLibrary(group) {
        var libMat = new THREE.MeshLambertMaterial({ color: 0xF0EED0 });
        var mainLib = new THREE.Mesh(
            new THREE.BoxGeometry(30, 14, 18),
            libMat
        );
        mainLib.position.set(WORLD_X + 50, 7, WORLD_Z + 40);
        group.add(mainLib);

        var porticoMat = new THREE.MeshLambertMaterial({ color: 0xE8E6C8 });
        var portico = new THREE.Mesh(
            new THREE.BoxGeometry(14, 12, 4),
            porticoMat
        );
        portico.position.set(WORLD_X + 50, 6, WORLD_Z + 31);
        group.add(portico);

        var pedimentMat = new THREE.MeshLambertMaterial({ color: 0xE0DECC });
        var pediment = new THREE.Mesh(
            new THREE.BoxGeometry(14, 3, 1),
            pedimentMat
        );
        pediment.position.set(WORLD_X + 50, 13.5, WORLD_Z + 29);
        group.add(pediment);

        var columnMat = new THREE.MeshLambertMaterial({ color: 0xF4F2E0 });
        var columnPositions = [
            WORLD_X + 43,
            WORLD_X + 47,
            WORLD_X + 51,
            WORLD_X + 55,
            WORLD_X + 59
        ];
        var ci;
        for (ci = 0; ci < columnPositions.length; ci++) {
            var column = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.7, 11, 8),
                columnMat
            );
            column.position.set(columnPositions[ci], 5.5, WORLD_Z + 30);
            group.add(column);

            var capital = new THREE.Mesh(
                new THREE.BoxGeometry(1.4, 0.8, 1.4),
                columnMat
            );
            capital.position.set(columnPositions[ci], 11.4, WORLD_Z + 30);
            group.add(capital);
        }

        var wingLibMat = new THREE.MeshLambertMaterial({ color: 0xECEAD4 });
        var leftLibWing = new THREE.Mesh(
            new THREE.BoxGeometry(8, 11, 12),
            wingLibMat
        );
        leftLibWing.position.set(WORLD_X + 35, 5.5, WORLD_Z + 42);
        group.add(leftLibWing);

        var rightLibWing = new THREE.Mesh(
            new THREE.BoxGeometry(8, 11, 12),
            wingLibMat
        );
        rightLibWing.position.set(WORLD_X + 65, 5.5, WORLD_Z + 42);
        group.add(rightLibWing);

        var rooflineMat = new THREE.MeshLambertMaterial({ color: 0xC8C6B0 });
        var roofline = new THREE.Mesh(
            new THREE.BoxGeometry(30, 1, 18),
            rooflineMat
        );
        roofline.position.set(WORLD_X + 50, 14.5, WORLD_Z + 40);
        group.add(roofline);

        var stepsFlightMat = new THREE.MeshLambertMaterial({ color: 0xD8D6C0 });
        var steps1 = new THREE.Mesh(
            new THREE.BoxGeometry(14, 0.5, 2),
            stepsFlightMat
        );
        steps1.position.set(WORLD_X + 50, 0.25, WORLD_Z + 28);
        group.add(steps1);

        var steps2 = new THREE.Mesh(
            new THREE.BoxGeometry(14, 0.5, 2),
            stepsFlightMat
        );
        steps2.position.set(WORLD_X + 50, 0.75, WORLD_Z + 26.5);
        group.add(steps2);

        var steps3 = new THREE.Mesh(
            new THREE.BoxGeometry(14, 0.5, 2),
            stepsFlightMat
        );
        steps3.position.set(WORLD_X + 50, 1.25, WORLD_Z + 25);
        group.add(steps3);
    }

    function buildCliffTerrain(group) {
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x6B5E4E });
        var cliff1 = new THREE.Mesh(
            new THREE.BoxGeometry(30, 20, 10),
            cliffMat
        );
        cliff1.position.set(WORLD_X + 10, 10, WORLD_Z - 55);
        group.add(cliff1);

        var cliff2 = new THREE.Mesh(
            new THREE.BoxGeometry(20, 16, 8),
            cliffMat
        );
        cliff2.position.set(WORLD_X - 15, 8, WORLD_Z - 52);
        group.add(cliff2);

        var hillMat = new THREE.MeshLambertMaterial({ color: 0x5A7A3A });
        var constitutionHill = new THREE.Mesh(
            new THREE.BoxGeometry(40, 24, 30),
            hillMat
        );
        constitutionHill.position.set(WORLD_X + 20, 12, WORLD_Z - 70);
        group.add(constitutionHill);

        var hillRock = new THREE.Mesh(
            new THREE.BoxGeometry(35, 18, 25),
            cliffMat
        );
        hillRock.position.set(WORLD_X + 20, 9, WORLD_Z - 68);
        group.add(hillRock);
    }

    function buildTownBuildings(group) {
        var terraceMat = new THREE.MeshLambertMaterial({ color: 0xD8C8B0 });
        var terrace1 = new THREE.Mesh(
            new THREE.BoxGeometry(40, 9, 8),
            terraceMat
        );
        terrace1.position.set(WORLD_X - 10, 4.5, WORLD_Z);
        group.add(terrace1);

        var terrace2 = new THREE.Mesh(
            new THREE.BoxGeometry(30, 8, 8),
            terraceMat
        );
        terrace2.position.set(WORLD_X + 15, 4, WORLD_Z + 10);
        group.add(terrace2);

        var shopMat = new THREE.MeshLambertMaterial({ color: 0xC8B898 });
        var shopRow = new THREE.Mesh(
            new THREE.BoxGeometry(50, 7, 10),
            shopMat
        );
        shopRow.position.set(WORLD_X - 5, 3.5, WORLD_Z - 15);
        group.add(shopRow);

        var pubMat = new THREE.MeshLambertMaterial({ color: 0xA04020 });
        var pub = new THREE.Mesh(
            new THREE.BoxGeometry(8, 8, 8),
            pubMat
        );
        pub.position.set(WORLD_X - 35, 4, WORLD_Z - 5);
        group.add(pub);

        var hotelMat = new THREE.MeshLambertMaterial({ color: 0xE0D0B8 });
        var seafrontHotel = new THREE.Mesh(
            new THREE.BoxGeometry(16, 14, 10),
            hotelMat
        );
        seafrontHotel.position.set(WORLD_X + 35, 7, WORLD_Z - 30);
        group.add(seafrontHotel);
    }

    function buildWireframe(group) {
        var wireMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08 });

        var edgeGeo1 = new THREE.BoxGeometry(20, 8, 14);
        var wireframe1 = new THREE.LineSegments(
            new THREE.EdgesGeometry(edgeGeo1),
            wireMat
        );
        wireframe1.position.set(WORLD_X - 30, 4, WORLD_Z - 60);
        group.add(wireframe1);
    }

    function create(scene) {
        var group = new THREE.Group();

        buildCliffTerrain(group);
        buildCastle(group);
        buildFunicular(group);
        buildCardiganBay(group);
        buildPromenade(group);
        buildUniversityBuilding(group);
        buildNationalLibrary(group);
        buildTownBuildings(group);

        scene.add(group);
        return group;
    }

    return {
        create: create
    };

}());
