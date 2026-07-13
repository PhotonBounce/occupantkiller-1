window.WarGallery = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var flickerLights = [];
    var particleSystems = [];

    function buildHalls() {
        var hallLength = 200;
        var hallWidth = 60;
        var hallHeight = 40;
        var wallThickness = 2;

        // Main corridor - left wall
        var leftWallGeo = new THREE.BoxGeometry(wallThickness, hallHeight, hallLength);
        var leftWallMat = new THREE.MeshLambertMaterial({ color: 0xf5f5dc });
        var leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
        leftWall.position.set(-hallWidth / 2, hallHeight / 2, 0);
        scene.add(leftWall);
        objects.push(leftWall);

        // Main corridor - right wall
        var rightWall = new THREE.Mesh(leftWallGeo, leftWallMat);
        rightWall.position.set(hallWidth / 2, hallHeight / 2, 0);
        scene.add(rightWall);
        objects.push(rightWall);

        // Main corridor - back wall
        var backWallGeo = new THREE.BoxGeometry(hallWidth, hallHeight, wallThickness);
        var backWall = new THREE.Mesh(backWallGeo, leftWallMat);
        backWall.position.set(0, hallHeight / 2, -hallLength / 2);
        scene.add(backWall);
        objects.push(backWall);

        // Main corridor - front wall
        var frontWall = new THREE.Mesh(backWallGeo, leftWallMat);
        frontWall.position.set(0, hallHeight / 2, hallLength / 2);
        scene.add(frontWall);
        objects.push(frontWall);

        // Floor
        var floorGeo = new THREE.BoxGeometry(hallWidth + 4, 0.5, hallLength + 4);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.set(0, -0.25, 0);
        scene.add(floor);
        objects.push(floor);

        // Ceiling
        var ceilingGeo = new THREE.BoxGeometry(hallWidth + 4, 0.5, hallLength + 4);
        var ceilingMat = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
        var ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
        ceiling.position.set(0, hallHeight + 0.25, 0);
        scene.add(ceiling);
        objects.push(ceiling);

        // Archway opening - left side
        var archWidth = 15;
        var archHeight = 25;
        var archDepth = 3;
        var archX = -20;
        var archZ = 0;

        // Top arch (box approximation)
        var archTopGeo = new THREE.BoxGeometry(archWidth, 3, archDepth);
        var archMat = new THREE.MeshLambertMaterial({ color: 0xd4af37 });
        var archTop = new THREE.Mesh(archTopGeo, archMat);
        archTop.position.set(archX, archHeight - 1.5, archZ);
        scene.add(archTop);
        objects.push(archTop);

        // Left pillar
        var pillarGeo = new THREE.BoxGeometry(2, archHeight, archDepth);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0xc0a040 });
        var leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
        leftPillar.position.set(archX - archWidth / 2 - 1, archHeight / 2, archZ);
        scene.add(leftPillar);
        objects.push(leftPillar);

        // Right pillar
        var rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
        rightPillar.position.set(archX + archWidth / 2 + 1, archHeight / 2, archZ);
        scene.add(rightPillar);
        objects.push(rightPillar);

        // Archway opening - right side
        var archTopRight = new THREE.Mesh(archTopGeo, archMat);
        archTopRight.position.set(-archX, archHeight - 1.5, archZ);
        scene.add(archTopRight);
        objects.push(archTopRight);

        var leftPillarRight = new THREE.Mesh(pillarGeo, pillarMat);
        leftPillarRight.position.set(-archX - archWidth / 2 - 1, archHeight / 2, archZ);
        scene.add(leftPillarRight);
        objects.push(leftPillarRight);

        var rightPillarRight = new THREE.Mesh(pillarGeo, pillarMat);
        rightPillarRight.position.set(-archX + archWidth / 2 + 1, archHeight / 2, archZ);
        scene.add(rightPillarRight);
        objects.push(rightPillarRight);
    }

    function buildExhibits() {
        // Tank display 1 - main hall center left
        var tankX = -15;
        var tankZ = -40;

        // Pedestal base
        var pedestalGeo = new THREE.BoxGeometry(20, 3, 20);
        var pedestalMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
        pedestal.position.set(tankX, 1.5, tankZ);
        scene.add(pedestal);
        objects.push(pedestal);

        // Tank body (box)
        var tankBodyGeo = new THREE.BoxGeometry(8, 4, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var tankBody = new THREE.Mesh(tankBodyGeo, tankMat);
        tankBody.position.set(tankX, 5, tankZ);
        scene.add(tankBody);
        objects.push(tankBody);

        // Tank turret (cylinder)
        var turretGeo = new THREE.CylinderGeometry(3.5, 3.5, 2.5, 16);
        var turret = new THREE.Mesh(turretGeo, tankMat);
        turret.position.set(tankX, 7.5, tankZ);
        scene.add(turret);
        objects.push(turret);

        // Tank barrel (cylinder)
        var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 12, 12);
        var barrel = new THREE.Mesh(barrelGeo, tankMat);
        barrel.rotation.z = Math.PI / 2;
        barrel.position.set(tankX + 8, 7.5, tankZ);
        scene.add(barrel);
        objects.push(barrel);

        // Tank display 2 - center right
        var tank2X = 15;
        var tank2Z = -50;

        var pedestal2 = new THREE.Mesh(pedestalGeo, pedestalMat);
        pedestal2.position.set(tank2X, 1.5, tank2Z);
        scene.add(pedestal2);
        objects.push(pedestal2);

        var tankBody2 = new THREE.Mesh(tankBodyGeo, tankMat);
        tankBody2.position.set(tank2X, 5, tank2Z);
        tankBody2.rotation.y = Math.PI / 4;
        scene.add(tankBody2);
        objects.push(tankBody2);

        var turret2 = new THREE.Mesh(turretGeo, tankMat);
        turret2.position.set(tank2X, 7.5, tank2Z);
        scene.add(turret2);
        objects.push(turret2);

        var barrel2 = new THREE.Mesh(barrelGeo, tankMat);
        barrel2.rotation.z = Math.PI / 2;
        barrel2.position.set(tank2X + 8, 7.5, tank2Z);
        scene.add(barrel2);
        objects.push(barrel2);

        // Artillery piece 1 - left side
        var artX = -25;
        var artZ = 30;

        // Gun carriage (box)
        var carriageGeo = new THREE.BoxGeometry(6, 4, 8);
        var artMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var carriage = new THREE.Mesh(carriageGeo, artMat);
        carriage.position.set(artX, 2, artZ);
        scene.add(carriage);
        objects.push(carriage);

        // Gun barrel (cylinder)
        var gunBarrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 14, 16);
        var gunBarrel = new THREE.Mesh(gunBarrelGeo, artMat);
        gunBarrel.rotation.z = Math.PI / 3;
        gunBarrel.position.set(artX + 4, 5, artZ);
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        // Artillery piece 2 - right side
        var art2X = 25;
        var art2Z = 25;

        var carriage2 = new THREE.Mesh(carriageGeo, artMat);
        carriage2.position.set(art2X, 2, art2Z);
        scene.add(carriage2);
        objects.push(carriage2);

        var gunBarrel2 = new THREE.Mesh(gunBarrelGeo, artMat);
        gunBarrel2.rotation.z = -Math.PI / 3;
        gunBarrel2.position.set(art2X - 4, 5, art2Z);
        scene.add(gunBarrel2);
        objects.push(gunBarrel2);
    }

    function buildBarricades() {
        // Overturned display case 1 - left side
        var case1X = -10;
        var case1Z = 50;

        var caseGeo = new THREE.BoxGeometry(8, 12, 8);
        var caseMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var displayCase1 = new THREE.Mesh(caseGeo, caseMat);
        displayCase1.rotation.z = Math.PI / 2.2;
        displayCase1.position.set(case1X, 8, case1Z);
        scene.add(displayCase1);
        objects.push(displayCase1);

        // Glass fragments around case 1
        var fragMat = new THREE.MeshLambertMaterial({ color: 0xb0c4de });
        for (var i = 0; i < 4; i++) {
            var fragGeo = new THREE.SphereGeometry(0.8, 6, 6);
            var frag = new THREE.Mesh(fragGeo, fragMat);
            frag.position.set(case1X - 5 + i * 3, 2, case1Z - 3);
            scene.add(frag);
            objects.push(frag);
        }

        // Overturned display case 2 - right side
        var case2X = 10;
        var case2Z = 60;

        var displayCase2 = new THREE.Mesh(caseGeo, caseMat);
        displayCase2.rotation.z = -Math.PI / 2.2;
        displayCase2.position.set(case2X, 8, case2Z);
        scene.add(displayCase2);
        objects.push(displayCase2);

        // Glass fragments around case 2
        for (var i = 0; i < 4; i++) {
            var frag2Geo = new THREE.SphereGeometry(0.8, 6, 6);
            var frag2 = new THREE.Mesh(frag2Geo, fragMat);
            frag2.position.set(case2X - 5 + i * 3, 2, case2Z - 3);
            scene.add(frag2);
            objects.push(frag2);
        }

        // Fallen exhibit frame - barricade
        var frameGeo = new THREE.BoxGeometry(25, 1.5, 1.5);
        var frameMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var frame = new THREE.Mesh(frameGeo, frameMat);
        frame.rotation.z = Math.PI / 2;
        frame.position.set(0, 3, 80);
        scene.add(frame);
        objects.push(frame);

        // Support structures for barricade
        var supportGeo = new THREE.BoxGeometry(2, 4, 2);
        var supportMat = new THREE.MeshLambertMaterial({ color: 0x404040 });

        var support1 = new THREE.Mesh(supportGeo, supportMat);
        support1.position.set(-10, 2, 80);
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(supportGeo, supportMat);
        support2.position.set(10, 2, 80);
        scene.add(support2);
        objects.push(support2);
    }

    function buildColumns() {
        // Marble column hall - evenly spaced
        var columnRadius = 2;
        var columnHeight = 38;
        var columnMat = new THREE.MeshLambertMaterial({ color: 0xfffaf0 });
        var columnGeo = new THREE.CylinderGeometry(columnRadius, columnRadius, columnHeight, 16);

        var columnPositions = [
            [-20, -60], [-20, -30], [-20, 0], [-20, 30], [-20, 60],
            [0, -60], [0, -30], [0, 0], [0, 30], [0, 60],
            [20, -60], [20, -30], [20, 0], [20, 30], [20, 60]
        ];

        for (var i = 0; i < columnPositions.length; i++) {
            var col = new THREE.Mesh(columnGeo, columnMat);
            col.position.set(columnPositions[i][0], columnHeight / 2 + 1, columnPositions[i][1]);
            scene.add(col);
            objects.push(col);
        }

        // Capital details (small cylinder on top)
        var capitalGeo = new THREE.CylinderGeometry(2.8, columnRadius, 1, 16);
        var capitalMat = new THREE.MeshLambertMaterial({ color: 0xf0e68c });

        for (var i = 0; i < columnPositions.length; i++) {
            var capital = new THREE.Mesh(capitalGeo, capitalMat);
            capital.position.set(columnPositions[i][0], columnHeight + 0.5, columnPositions[i][1]);
            scene.add(capital);
            objects.push(capital);
        }
    }

    function buildSniperPositions() {
        // Elevated balcony - left side
        var balcony1X = -25;
        var balcony1Z = 0;
        var balconyWidth = 15;
        var balconyDepth = 10;

        var balconyGeo = new THREE.BoxGeometry(balconyWidth, 1, balconyDepth);
        var balconyMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var balcony1 = new THREE.Mesh(balconyGeo, balconyMat);
        balcony1.position.set(balcony1X, 28, balcony1Z);
        scene.add(balcony1);
        objects.push(balcony1);

        // Railing for balcony 1
        var railingGeo = new THREE.BoxGeometry(balconyWidth, 2, 0.5);
        var railingMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var railing1Front = new THREE.Mesh(railingGeo, railingMat);
        railing1Front.position.set(balcony1X, 29, balcony1Z + balconyDepth / 2);
        scene.add(railing1Front);
        objects.push(railing1Front);

        var railing1Back = new THREE.Mesh(railingGeo, railingMat);
        railing1Back.position.set(balcony1X, 29, balcony1Z - balconyDepth / 2);
        scene.add(railing1Back);
        objects.push(railing1Back);

        // Support pillars for balcony 1
        var supportGeo = new THREE.BoxGeometry(2, 26, 2);
        var supportMat = new THREE.MeshLambertMaterial({ color: 0x404040 });

        var sup1 = new THREE.Mesh(supportGeo, supportMat);
        sup1.position.set(balcony1X - 6, 13, balcony1Z - 4);
        scene.add(sup1);
        objects.push(sup1);

        var sup2 = new THREE.Mesh(supportGeo, supportMat);
        sup2.position.set(balcony1X + 6, 13, balcony1Z - 4);
        scene.add(sup2);
        objects.push(sup2);

        // Elevated balcony - right side
        var balcony2X = 25;
        var balcony2Z = -10;

        var balcony2 = new THREE.Mesh(balconyGeo, balconyMat);
        balcony2.position.set(balcony2X, 28, balcony2Z);
        scene.add(balcony2);
        objects.push(balcony2);

        // Railing for balcony 2
        var railing2Front = new THREE.Mesh(railingGeo, railingMat);
        railing2Front.position.set(balcony2X, 29, balcony2Z + balconyDepth / 2);
        scene.add(railing2Front);
        objects.push(railing2Front);

        var railing2Back = new THREE.Mesh(railingGeo, railingMat);
        railing2Back.position.set(balcony2X, 29, balcony2Z - balconyDepth / 2);
        scene.add(railing2Back);
        objects.push(railing2Back);

        // Support pillars for balcony 2
        var sup3 = new THREE.Mesh(supportGeo, supportMat);
        sup3.position.set(balcony2X - 6, 13, balcony2Z - 4);
        scene.add(sup3);
        objects.push(sup3);

        var sup4 = new THREE.Mesh(supportGeo, supportMat);
        sup4.position.set(balcony2X + 6, 13, balcony2Z - 4);
        scene.add(sup4);
        objects.push(sup4);
    }

    function buildArtwork() {
        // Weapon wall - left side
        var wallX = -29;
        var wallZ = -70;

        var weaponWallGeo = new THREE.BoxGeometry(2, 20, 30);
        var weaponMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var weaponWall = new THREE.Mesh(weaponWallGeo, weaponMat);
        weaponWall.position.set(wallX, 10, wallZ);
        scene.add(weaponWall);
        objects.push(weaponWall);

        // Mounted rifles - cylinders and boxes
        var riflePositions = [
            [wallX + 2, 8, wallZ - 15],
            [wallX + 2, 12, wallZ - 10],
            [wallX + 2, 16, wallZ - 5],
            [wallX + 2, 8, wallZ + 5],
            [wallX + 2, 12, wallZ + 10],
            [wallX + 2, 16, wallZ + 15]
        ];

        var rifleBarrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 5, 8);
        var rifleMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });

        for (var i = 0; i < riflePositions.length; i++) {
            var barrel = new THREE.Mesh(rifleBarrelGeo, rifleMat);
            barrel.rotation.z = Math.PI / 2.5;
            barrel.position.set(riflePositions[i][0], riflePositions[i][1], riflePositions[i][2]);
            scene.add(barrel);
            objects.push(barrel);

            var stockGeo = new THREE.BoxGeometry(1.5, 0.6, 3);
            var stock = new THREE.Mesh(stockGeo, rifleMat);
            stock.position.set(riflePositions[i][0] - 2, riflePositions[i][1], riflePositions[i][2]);
            scene.add(stock);
            objects.push(stock);
        }

        // Mounted sword/blade shapes
        var swordPositions = [
            [wallX + 2, 10, wallZ - 20],
            [wallX + 2, 14, wallZ],
            [wallX + 2, 10, wallZ + 20]
        ];

        for (var i = 0; i < swordPositions.length; i++) {
            var bladeGeo = new THREE.BoxGeometry(0.3, 6, 1.5);
            var bladeMat = new THREE.MeshLambertMaterial({ color: 0xc0a040 });
            var blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.z = Math.PI / 6;
            blade.position.set(swordPositions[i][0], swordPositions[i][1], swordPositions[i][2]);
            scene.add(blade);
            objects.push(blade);

            var guardGeo = new THREE.CylinderGeometry(1, 1, 0.5, 16);
            var guard = new THREE.Mesh(guardGeo, bladeMat);
            guard.rotation.z = Math.PI / 2;
            guard.position.set(swordPositions[i][0], swordPositions[i][1], swordPositions[i][2]);
            scene.add(guard);
            objects.push(guard);
        }

        // Trophy display cone sculptures
        var trophyPositions = [
            [-35, 3, 70],
            [35, 3, 70],
            [-35, 3, -80],
            [35, 3, -80]
        ];

        for (var i = 0; i < trophyPositions.length; i++) {
            var trophyGeo = new THREE.ConeGeometry(3, 12, 12);
            var trophyMat = new THREE.MeshLambertMaterial({ color: 0xdaa520 });
            var trophy = new THREE.Mesh(trophyGeo, trophyMat);
            trophy.position.set(trophyPositions[i][0], trophyPositions[i][1] + 6, trophyPositions[i][2]);
            scene.add(trophy);
            objects.push(trophy);

            var baseGeo = new THREE.CylinderGeometry(4, 4, 1, 16);
            var baseMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
            var base = new THREE.Mesh(baseGeo, baseMat);
            base.position.set(trophyPositions[i][0], trophyPositions[i][1] + 0.5, trophyPositions[i][2]);
            scene.add(base);
            objects.push(base);
        }
    }

    function buildLighting() {
        // Ambient light - museum ambiance
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Main directional light - skylights
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(0, 35, 0);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        // Emergency lighting strips with point lights
        var stripPositions = [
            [-25, 37, -60],
            [-25, 37, 0],
            [-25, 37, 60],
            [25, 37, -60],
            [25, 37, 0],
            [25, 37, 60],
            [0, 37, -70],
            [0, 37, 70]
        ];

        for (var i = 0; i < stripPositions.length; i++) {
            // Light strip tube
            var stripGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 12);
            var stripMat = new THREE.MeshLambertMaterial({ color: 0xdc143c });
            var strip = new THREE.Mesh(stripGeo, stripMat);
            strip.position.set(stripPositions[i][0], stripPositions[i][1], stripPositions[i][2]);
            scene.add(strip);
            objects.push(strip);

            // Point light from strip
            var pointLight = new THREE.PointLight(0xff4444, 0.5, 50);
            pointLight.position.set(stripPositions[i][0], stripPositions[i][1], stripPositions[i][2]);
            scene.add(pointLight);
            lights.push(pointLight);
            flickerLights.push(pointLight);
        }

        // Spotlight on sniper balcony 1
        var spotLight1 = new THREE.SpotLight(0xffff99, 0.7, 100, Math.PI / 4, 1, 2);
        spotLight1.position.set(-25, 30, 0);
        spotLight1.target.position.set(-25, 0, 0);
        scene.add(spotLight1);
        scene.add(spotLight1.target);
        lights.push(spotLight1);
        flickerLights.push(spotLight1);

        // Spotlight on sniper balcony 2
        var spotLight2 = new THREE.SpotLight(0xffff99, 0.7, 100, Math.PI / 4, 1, 2);
        spotLight2.position.set(25, 30, -10);
        spotLight2.target.position.set(25, 0, -10);
        scene.add(spotLight2);
        scene.add(spotLight2.target);
        lights.push(spotLight2);
        flickerLights.push(spotLight2);
    }

    function buildSkylight() {
        // Blasted open skylight frame
        var frameX = 0;
        var frameZ = -85;
        var skyWidth = 30;
        var skyHeight = 25;

        // Top frame
        var topFrameGeo = new THREE.BoxGeometry(skyWidth, 1, 1);
        var skyMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var topFrame = new THREE.Mesh(topFrameGeo, skyMat);
        topFrame.position.set(frameX, 39, frameZ);
        scene.add(topFrame);
        objects.push(topFrame);

        // Left frame
        var leftFrameGeo = new THREE.BoxGeometry(1, skyHeight, 1);
        var leftFrame = new THREE.Mesh(leftFrameGeo, skyMat);
        leftFrame.position.set(frameX - skyWidth / 2, 26, frameZ);
        scene.add(leftFrame);
        objects.push(leftFrame);

        // Right frame
        var rightFrame = new THREE.Mesh(leftFrameGeo, skyMat);
        rightFrame.position.set(frameX + skyWidth / 2, 26, frameZ);
        scene.add(rightFrame);
        objects.push(rightFrame);

        // Bottom frame - partial (shattered)
        var bottomFrameGeo = new THREE.BoxGeometry(12, 1, 1);
        var bottomFrame = new THREE.Mesh(bottomFrameGeo, skyMat);
        bottomFrame.position.set(frameX - 8, 13, frameZ);
        scene.add(bottomFrame);
        objects.push(bottomFrame);

        var bottomFrame2 = new THREE.Mesh(bottomFrameGeo, skyMat);
        bottomFrame2.position.set(frameX + 8, 13, frameZ);
        scene.add(bottomFrame2);
        objects.push(bottomFrame2);

        // Glass shards flying in gap
        var glassShardGeo = new THREE.BoxGeometry(1.5, 2, 0.3);
        var glassMat = new THREE.MeshLambertMaterial({ color: 0xb0e0e6 });

        for (var i = 0; i < 5; i++) {
            var shard = new THREE.Mesh(glassShardGeo, glassMat);
            shard.position.set(frameX - 12 + i * 6, 30, frameZ - 3);
            shard.rotation.x = Math.random() * Math.PI;
            scene.add(shard);
            objects.push(shard);
        }
    }

    function buildParticles() {
        // Dust particles - tiny spheres scattered in air
        var dustMat = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });

        for (var i = 0; i < 80; i++) {
            var dustGeo = new THREE.SphereGeometry(0.15, 4, 4);
            var dust = new THREE.Mesh(dustGeo, dustMat);
            dust.position.set(
                Math.random() * 60 - 30,
                Math.random() * 25 + 10,
                Math.random() * 160 - 80
            );
            scene.add(dust);
            objects.push(dust);
            particleSystems.push({
                mesh: dust,
                baseY: dust.position.y,
                speed: Math.random() * 0.02 + 0.01
            });
        }
    }

    function updateAnimation(delta) {
        // Spotlight flicker effect
        for (var i = 0; i < flickerLights.length; i++) {
            var light = flickerLights[i];
            if (light.intensity !== undefined) {
                var flicker = Math.random() * 0.15;
                if (light instanceof THREE.SpotLight || light instanceof THREE.PointLight) {
                    light.intensity = 0.5 + (Math.sin(Date.now() * 0.003) * 0.3) + (Math.random() * 0.2);
                }
            }
        }

        // Dust particle animation
        for (var i = 0; i < particleSystems.length; i++) {
            var p = particleSystems[i];
            p.mesh.position.y = p.baseY + Math.sin(Date.now() * p.speed * 0.001) * 2;
            p.mesh.rotation.x += 0.001;
            p.mesh.rotation.y += 0.002;
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        flickerLights = [];
        particleSystems = [];

        buildHalls();
        buildExhibits();
        buildBarricades();
        buildColumns();
        buildSniperPositions();
        buildArtwork();
        buildSkylight();
        buildLighting();
        buildParticles();
    }

    function update(delta) {
        updateAnimation(delta);
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
        flickerLights = [];
        particleSystems = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
