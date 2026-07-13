window.StormWall = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var rainStreaks = [];
    var debrisItems = [];
    var searchlights = [];

    var stormGray = 0x4a4a4a;
    var darkConcrete = 0x2a2a2a;
    var lightningWhite = 0xffffff;
    var defenderKhaki = 0xc9a876;
    var darkWater = 0x1a3a52;

    function buildMainWall() {
        var wallThickness = 8;
        var wallHeight = 40;
        var wallLength = 150;

        var wallGeo = new THREE.BoxGeometry(wallLength, wallHeight, wallThickness);
        var wallMat = new THREE.MeshLambertMaterial({ color: darkConcrete });
        var mainWall = new THREE.Mesh(wallGeo, wallMat);
        mainWall.position.y = wallHeight / 2;
        mainWall.position.z = 0;
        scene.add(mainWall);
        objects.push(mainWall);

        var topBeamGeo = new THREE.BoxGeometry(wallLength, 3, wallThickness);
        var topBeamMat = new THREE.MeshLambertMaterial({ color: stormGray });
        var topBeam = new THREE.Mesh(topBeamGeo, topBeamMat);
        topBeam.position.y = wallHeight + 1.5;
        topBeam.position.z = 0;
        scene.add(topBeam);
        objects.push(topBeam);
    }

    function buildBattlements() {
        var crenelWidth = 8;
        var crenelHeight = 6;
        var crenelThickness = 6;
        var crenelSpacing = 16;
        var wallLength = 150;
        var baseY = 44;

        var startX = -wallLength / 2 + crenelWidth;
        var count = Math.floor(wallLength / crenelSpacing);

        for (var i = 0; i < count; i++) {
            var xPos = startX + i * crenelSpacing;
            var crenelGeo = new THREE.BoxGeometry(crenelWidth, crenelHeight, crenelThickness);
            var crenelMat = new THREE.MeshLambertMaterial({ color: stormGray });
            var crenel = new THREE.Mesh(crenelGeo, crenelMat);
            crenel.position.set(xPos, baseY, 0);
            scene.add(crenel);
            objects.push(crenel);
        }
    }

    function buildLightningRods() {
        var rodHeight = 50;
        var rodRadius = 0.8;
        var rodSpacing = 35;
        var wallLength = 150;
        var baseY = 46;

        var rodCount = 5;
        var startX = -70;

        for (var i = 0; i < rodCount; i++) {
            var xPos = startX + i * rodSpacing;

            var rodGeo = new THREE.CylinderGeometry(rodRadius, rodRadius, rodHeight, 8);
            var rodMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var rod = new THREE.Mesh(rodGeo, rodMat);
            rod.position.set(xPos, baseY + rodHeight / 2, -2);
            scene.add(rod);
            objects.push(rod);

            var tipGeo = new THREE.SphereGeometry(2, 8, 8);
            var tipMat = new THREE.MeshLambertMaterial({ color: lightningWhite });
            var tip = new THREE.Mesh(tipGeo, tipMat);
            tip.position.set(xPos, baseY + rodHeight, -2);
            scene.add(tip);
            objects.push(tip);
        }
    }

    function buildStormDebris() {
        var debrisTypes = 12;
        var debrisPerType = 8;

        for (var t = 0; t < debrisTypes; t++) {
            var baseY = 10 + Math.random() * 40;

            for (var d = 0; d < debrisPerType; d++) {
                var size = 1 + Math.random() * 3;
                var debrisGeo = new THREE.BoxGeometry(size, size * 0.6, size * 0.4);
                var debrisColor = stormGray + Math.floor(Math.random() * 0x111111);
                var debrisMat = new THREE.MeshLambertMaterial({ color: debrisColor });
                var debris = new THREE.Mesh(debrisGeo, debrisMat);

                debris.position.set(
                    -100 + Math.random() * 200,
                    baseY,
                    -30 + Math.random() * 40
                );

                debris.rotation.x = Math.random() * Math.PI;
                debris.rotation.y = Math.random() * Math.PI;
                debris.rotation.z = Math.random() * Math.PI;

                debris.userData.rotationSpeed = {
                    x: (Math.random() - 0.5) * 4,
                    y: (Math.random() - 0.5) * 4,
                    z: (Math.random() - 0.5) * 4
                };

                scene.add(debris);
                objects.push(debris);
                debrisItems.push(debris);
            }
        }
    }

    function buildRainEffect() {
        var rainCount = 80;
        var rainWidth = 0.1;
        var rainHeight = 25;
        var rainDepth = 0.1;

        for (var r = 0; r < rainCount; r++) {
            var rainGeo = new THREE.BoxGeometry(rainWidth, rainHeight, rainDepth);
            var rainMat = new THREE.MeshLambertMaterial({ color: 0x6688bb, transparent: true, opacity: 0.4 });
            var rain = new THREE.Mesh(rainGeo, rainMat);

            rain.position.set(
                -120 + Math.random() * 240,
                50 + Math.random() * 30,
                -40 + Math.random() * 80
            );

            rain.rotation.z = Math.PI / 6 + (Math.random() - 0.5) * 0.3;
            rain.userData.baseY = rain.position.y;
            rain.userData.fallSpeed = 15 + Math.random() * 20;

            scene.add(rain);
            objects.push(rain);
            rainStreaks.push(rain);
        }
    }

    function buildShelters() {
        var shelterPositions = [
            { x: -50, y: 4, z: 10 },
            { x: -20, y: 4, z: 12 },
            { x: 20, y: 4, z: 10 },
            { x: 50, y: 4, z: 12 },
            { x: -70, y: 4, z: 8 },
            { x: 70, y: 4, z: 9 }
        ];

        for (var s = 0; s < shelterPositions.length; s++) {
            var pos = shelterPositions[s];

            var backGeo = new THREE.BoxGeometry(12, 8, 2);
            var shelterMat = new THREE.MeshLambertMaterial({ color: defenderKhaki });
            var back = new THREE.Mesh(backGeo, shelterMat);
            back.position.set(pos.x, pos.y, pos.z);
            scene.add(back);
            objects.push(back);

            var sideLeftGeo = new THREE.BoxGeometry(2, 8, 6);
            var sideLeft = new THREE.Mesh(sideLeftGeo, shelterMat);
            sideLeft.position.set(pos.x - 6, pos.y, pos.z + 2);
            scene.add(sideLeft);
            objects.push(sideLeft);

            var sideRightGeo = new THREE.BoxGeometry(2, 8, 6);
            var sideRight = new THREE.Mesh(sideRightGeo, shelterMat);
            sideRight.position.set(pos.x + 6, pos.y, pos.z + 2);
            scene.add(sideRight);
            objects.push(sideRight);
        }
    }

    function buildArtillery() {
        var emplacementCount = 4;
        var spacing = 60;
        var startX = -90;
        var baseY = 45;

        for (var a = 0; a < emplacementCount; a++) {
            var xPos = startX + a * spacing;

            var platformGeo = new THREE.BoxGeometry(15, 2, 12);
            var platformMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var platform = new THREE.Mesh(platformGeo, platformMat);
            platform.position.set(xPos, baseY, 0);
            scene.add(platform);
            objects.push(platform);

            var barrelGeo = new THREE.CylinderGeometry(0.6, 0.8, 14, 8);
            var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var barrel = new THREE.Mesh(barrelGeo, barrelMat);
            barrel.rotation.z = Math.PI * 0.15;
            barrel.position.set(xPos, baseY + 3, 0);
            scene.add(barrel);
            objects.push(barrel);

            var pivotGeo = new THREE.CylinderGeometry(1.2, 1.2, 1, 8);
            var pivot = new THREE.Mesh(pivotGeo, platformMat);
            pivot.position.set(xPos, baseY + 2.5, 0);
            scene.add(pivot);
            objects.push(pivot);
        }
    }

    function buildBreachedSection() {
        var breachX = 0;
        var breachY = 20;
        var breachZ = 0;
        var breachWidth = 35;
        var breachHeight = 30;
        var gapWidth = 15;

        var leftGeo = new THREE.BoxGeometry(
            (breachWidth - gapWidth) / 2,
            breachHeight,
            6
        );
        var breachMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        var leftPart = new THREE.Mesh(leftGeo, breachMat);
        leftPart.position.set(breachX - gapWidth / 2 - (breachWidth - gapWidth) / 4, breachY, breachZ);
        scene.add(leftPart);
        objects.push(leftPart);

        var rightPart = new THREE.Mesh(leftGeo, breachMat);
        rightPart.position.set(breachX + gapWidth / 2 + (breachWidth - gapWidth) / 4, breachY, breachZ);
        scene.add(rightPart);
        objects.push(rightPart);

        var rubbleCount = 12;
        for (var rb = 0; rb < rubbleCount; rb++) {
            var rubbleGeo = new THREE.BoxGeometry(4, 3, 4);
            var rubble = new THREE.Mesh(rubbleGeo, breachMat);
            rubble.position.set(
                breachX - 8 + Math.random() * 16,
                2 + Math.random() * 6,
                breachZ + 2 + Math.random() * 4
            );
            rubble.rotation.y = Math.random() * Math.PI;
            scene.add(rubble);
            objects.push(rubble);
        }
    }

    function buildSearchlights() {
        var searchCount = 3;
        var spacing = 50;
        var startX = -50;
        var baseY = 48;
        var baseZ = -4;

        for (var sl = 0; sl < searchCount; sl++) {
            var xPos = startX + sl * spacing;

            var mountGeo = new THREE.BoxGeometry(3, 4, 3);
            var mountMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var mount = new THREE.Mesh(mountGeo, mountMat);
            mount.position.set(xPos, baseY, baseZ);
            scene.add(mount);
            objects.push(mount);

            var reflectorGeo = new THREE.CylinderGeometry(2.5, 2.5, 2, 16);
            var reflectorMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
            var reflector = new THREE.Mesh(reflectorGeo, reflectorMat);
            reflector.position.set(xPos, baseY + 2, baseZ);
            reflector.userData.baseRotation = sl * (Math.PI * 2 / searchCount);
            scene.add(reflector);
            objects.push(reflector);

            var beamGeo = new THREE.CylinderGeometry(1.5, 3, 40, 16);
            var beamMat = new THREE.MeshLambertMaterial({
                color: lightningWhite,
                transparent: true,
                opacity: 0.15
            });
            var beam = new THREE.Mesh(beamGeo, beamMat);
            beam.position.set(xPos, baseY + 20, baseZ + 20);
            beam.userData.reflector = reflector;
            scene.add(beam);
            objects.push(beam);

            var lightGeo = new THREE.SphereGeometry(0.8, 8, 8);
            var lightMat = new THREE.MeshLambertMaterial({ color: lightningWhite });
            var lightBulb = new THREE.Mesh(lightGeo, lightMat);
            lightBulb.position.set(xPos, baseY + 2, baseZ);
            scene.add(lightBulb);
            objects.push(lightBulb);

            var pointLight = new THREE.PointLight(0xccddff, 1.2, 100);
            pointLight.position.set(xPos, baseY + 2, baseZ);
            scene.add(pointLight);
            lights.push(pointLight);

            searchlights.push({ reflector: reflector, beam: beam });
        }
    }

    function buildMoat() {
        var moatGeo = new THREE.BoxGeometry(200, 3, 30);
        var moatMat = new THREE.MeshLambertMaterial({ color: darkWater });
        var moat = new THREE.Mesh(moatGeo, moatMat);
        moat.position.set(0, 0.5, 15);
        scene.add(moat);
        objects.push(moat);

        var bankLeftGeo = new THREE.BoxGeometry(200, 5, 8);
        var bankMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var bankLeft = new THREE.Mesh(bankLeftGeo, bankMat);
        bankLeft.position.set(0, 2.5, 25);
        scene.add(bankLeft);
        objects.push(bankLeft);

        var bankRightGeo = new THREE.BoxGeometry(200, 5, 8);
        var bankRight = new THREE.Mesh(bankRightGeo, bankMat);
        bankRight.position.set(0, 2.5, 5);
        scene.add(bankRight);
        objects.push(bankRight);
    }

    function buildWallDefenses() {
        var defenseCount = 6;
        var spacing = 40;
        var startX = -100;
        var baseY = 42;

        for (var wd = 0; wd < defenseCount; wd++) {
            var xPos = startX + wd * spacing;

            var shieldGeo = new THREE.BoxGeometry(6, 10, 1);
            var shieldMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.position.set(xPos, baseY, -5);
            shield.rotation.z = Math.random() * 0.3 - 0.15;
            scene.add(shield);
            objects.push(shield);

            var supportGeo = new THREE.CylinderGeometry(0.5, 0.8, 8, 6);
            var support = new THREE.Mesh(supportGeo, shieldMat);
            support.position.set(xPos - 4, baseY - 2, -5);
            scene.add(support);
            objects.push(support);

            var supportRight = new THREE.Mesh(supportGeo, shieldMat);
            supportRight.position.set(xPos + 4, baseY - 2, -5);
            scene.add(supportRight);
            objects.push(supportRight);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x505050, 1.2);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 60, 30);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var stormLight = new THREE.DirectionalLight(0xccccff, 0.4);
        stormLight.position.set(-80, 40, -60);
        scene.add(stormLight);
        lights.push(stormLight);
    }

    function animateDebris(delta) {
        for (var i = 0; i < debrisItems.length; i++) {
            var debris = debrisItems[i];
            debris.rotation.x += debris.userData.rotationSpeed.x * delta;
            debris.rotation.y += debris.userData.rotationSpeed.y * delta;
            debris.rotation.z += debris.userData.rotationSpeed.z * delta;
        }
    }

    function animateRain(delta) {
        for (var i = 0; i < rainStreaks.length; i++) {
            var rain = rainStreaks[i];
            rain.position.y -= rain.userData.fallSpeed * delta;

            if (rain.position.y < -10) {
                rain.position.y = rain.userData.baseY;
            }
        }
    }

    function animateSearchlights(delta) {
        var time = Date.now() * 0.0005;

        for (var i = 0; i < searchlights.length; i++) {
            var searchlight = searchlights[i];
            var reflector = searchlight.reflector;
            var beam = searchlight.beam;

            var rotationAngle = reflector.userData.baseRotation + time * 1.2;
            reflector.rotation.y = rotationAngle;

            beam.position.x = reflector.position.x + Math.sin(rotationAngle) * 20;
            beam.position.z = reflector.position.z + Math.cos(rotationAngle) * 20;
            beam.rotation.y = rotationAngle;
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        rainStreaks = [];
        debrisItems = [];
        searchlights = [];

        buildMainWall();
        buildBattlements();
        buildLightningRods();
        buildStormDebris();
        buildRainEffect();
        buildShelters();
        buildArtillery();
        buildBreachedSection();
        buildSearchlights();
        buildMoat();
        buildWallDefenses();
        setupLighting();
    }

    function update(delta) {
        animateDebris(delta);
        animateRain(delta);
        animateSearchlights(delta);
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
        rainStreaks = [];
        debrisItems = [];
        searchlights = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
