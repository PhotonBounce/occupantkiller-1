window.WarArch = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var flagPanels = [];
    var animationTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        flagPanels = [];
        buildTriumphalArch();
        buildBattledSquare();
        buildMilitaryHQ();
        buildBarbedPerimeter();
        buildCheckpoints();
        buildArmorColumn();
        buildSniperNests();
        buildPropagandaColumns();
        buildSandbagFortifications();
        buildFlagpoleCluster();
        setupLighting();
    }

    function buildTriumphalArch() {
        var archColor = 0xD4C5B0;
        var leftPillar = new THREE.Mesh(
            new THREE.BoxGeometry(3, 25, 3),
            new THREE.MeshLambertMaterial({ color: archColor })
        );
        leftPillar.position.set(-8, 12.5, 0);
        scene.add(leftPillar);
        objects.push(leftPillar);

        var rightPillar = new THREE.Mesh(
            new THREE.BoxGeometry(3, 25, 3),
            new THREE.MeshLambertMaterial({ color: archColor })
        );
        rightPillar.position.set(8, 12.5, 0);
        scene.add(rightPillar);
        objects.push(rightPillar);

        var lintel = new THREE.Mesh(
            new THREE.BoxGeometry(19, 2.5, 3),
            new THREE.MeshLambertMaterial({ color: archColor })
        );
        lintel.position.set(0, 24, 0);
        scene.add(lintel);
        objects.push(lintel);

        var frieze1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 0.4),
            new THREE.MeshLambertMaterial({ color: 0xA0957A })
        );
        frieze1.position.set(-5, 21, 1.5);
        scene.add(frieze1);
        objects.push(frieze1);

        var frieze2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 0.4),
            new THREE.MeshLambertMaterial({ color: 0xA0957A })
        );
        frieze2.position.set(0, 21, 1.5);
        scene.add(frieze2);
        objects.push(frieze2);

        var frieze3 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 3, 0.4),
            new THREE.MeshLambertMaterial({ color: 0xA0957A })
        );
        frieze3.position.set(5, 21, 1.5);
        scene.add(frieze3);
        objects.push(frieze3);

        var reinforcementPlate1 = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 4, 0.8),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        reinforcementPlate1.position.set(-8, 15, 2);
        scene.add(reinforcementPlate1);
        objects.push(reinforcementPlate1);

        var reinforcementPlate2 = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 4, 0.8),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        reinforcementPlate2.position.set(8, 15, 2);
        scene.add(reinforcementPlate2);
        objects.push(reinforcementPlate2);

        var capstone1 = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 1.5, 3.5),
            new THREE.MeshLambertMaterial({ color: archColor })
        );
        capstone1.position.set(-8, 26.5, 0);
        scene.add(capstone1);
        objects.push(capstone1);

        var capstone2 = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 1.5, 3.5),
            new THREE.MeshLambertMaterial({ color: archColor })
        );
        capstone2.position.set(8, 26.5, 0);
        scene.add(capstone2);
        objects.push(capstone2);
    }

    function buildBattledSquare() {
        var tileSize = 4;
        var tileHeight = 0.5;
        var pavingColor = 0x8B8680;
        var crackColor = 0x6B6660;

        for (var x = -12; x <= 12; x += tileSize) {
            for (var z = -12; z <= 12; z += tileSize) {
                var useCrack = (Math.abs(x) < tileSize && Math.abs(z) < tileSize) ? true : false;
                var tileColor = useCrack ? crackColor : pavingColor;

                var tile = new THREE.Mesh(
                    new THREE.BoxGeometry(tileSize - 0.1, tileHeight, tileSize - 0.1),
                    new THREE.MeshLambertMaterial({ color: tileColor })
                );
                tile.position.set(x, -0.25, z);
                if (useCrack) {
                    tile.position.y = 0.3;
                    tile.rotation.z = 0.15;
                }
                scene.add(tile);
                objects.push(tile);
            }
        }

        var borderTile = new THREE.Mesh(
            new THREE.BoxGeometry(30, tileHeight, 1),
            new THREE.MeshLambertMaterial({ color: 0x5A5450 })
        );
        borderTile.position.set(0, -0.25, 14);
        scene.add(borderTile);
        objects.push(borderTile);

        var borderTile2 = new THREE.Mesh(
            new THREE.BoxGeometry(30, tileHeight, 1),
            new THREE.MeshLambertMaterial({ color: 0x5A5450 })
        );
        borderTile2.position.set(0, -0.25, -14);
        scene.add(borderTile2);
        objects.push(borderTile2);
    }

    function buildMilitaryHQ() {
        var hqColor = 0x3C3C3C;
        var mainBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(14, 10, 10),
            new THREE.MeshLambertMaterial({ color: hqColor })
        );
        mainBuilding.position.set(0, 5, -20);
        scene.add(mainBuilding);
        objects.push(mainBuilding);

        for (var i = 0; i < 4; i++) {
            var column = new THREE.Mesh(
                new THREE.CylinderGeometry(0.6, 0.6, 9, 8),
                new THREE.MeshLambertMaterial({ color: 0x2A2A2A })
            );
            var xPos = -5 + (i * 3.5);
            column.position.set(xPos, 4.5, -20);
            scene.add(column);
            objects.push(column);
        }

        var roofSection = new THREE.Mesh(
            new THREE.BoxGeometry(15, 0.8, 11),
            new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
        );
        roofSection.position.set(0, 10.5, -20);
        scene.add(roofSection);
        objects.push(roofSection);

        var doorway = new THREE.Mesh(
            new THREE.BoxGeometry(3, 5, 0.5),
            new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
        );
        doorway.position.set(0, 2.5, -25);
        scene.add(doorway);
        objects.push(doorway);

        var window1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 0.3),
            new THREE.MeshLambertMaterial({ color: 0x1A3A1A })
        );
        window1.position.set(-4, 7, -25);
        scene.add(window1);
        objects.push(window1);

        var window2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 0.3),
            new THREE.MeshLambertMaterial({ color: 0x1A3A1A })
        );
        window2.position.set(4, 7, -25);
        scene.add(window2);
        objects.push(window2);
    }

    function buildBarbedPerimeter() {
        var barrowColor = 0x8B4513;
        var spikeColor = 0x444444;

        for (var i = 0; i < 8; i++) {
            var barrow = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1, 1),
                new THREE.MeshLambertMaterial({ color: barrowColor })
            );
            barrow.position.set(-14 + (i * 4), 0.5, 15);
            scene.add(barrow);
            objects.push(barrow);

            var spikePost = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6),
                new THREE.MeshLambertMaterial({ color: spikeColor })
            );
            spikePost.position.set(-14 + (i * 4), 1.8, 15);
            scene.add(spikePost);
            objects.push(spikePost);

            var barrowSide = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1, 1),
                new THREE.MeshLambertMaterial({ color: barrowColor })
            );
            barrowSide.position.set(15, 0.5, -14 + (i * 4));
            scene.add(barrowSide);
            objects.push(barrowSide);

            var spikePostSide = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 2.5, 6),
                new THREE.MeshLambertMaterial({ color: spikeColor })
            );
            spikePostSide.position.set(15, 1.8, -14 + (i * 4));
            scene.add(spikePostSide);
            objects.push(spikePostSide);
        }
    }

    function buildCheckpoints() {
        var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var gateFrame = new THREE.Mesh(
            new THREE.BoxGeometry(5, 3.5, 0.5),
            gateMaterial
        );
        gateFrame.position.set(0, 1.75, 12);
        scene.add(gateFrame);
        objects.push(gateFrame);

        var boomBarrier = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF6B35 })
        );
        boomBarrier.rotation.z = 1.57;
        boomBarrier.position.set(-3, 2.5, 12);
        scene.add(boomBarrier);
        objects.push(boomBarrier);

        var checkpointHut = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2.5, 3),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        checkpointHut.position.set(6, 1.25, 12);
        scene.add(checkpointHut);
        objects.push(checkpointHut);

        var hutWindow = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 1.2, 0.3),
            new THREE.MeshLambertMaterial({ color: 0x1A3A1A })
        );
        hutWindow.position.set(6, 1.8, 15);
        scene.add(hutWindow);
        objects.push(hutWindow);
    }

    function buildArmorColumn() {
        var tankColor = 0x556B2F;
        var barrelColor = 0x2A2A2A;

        for (var t = 0; t < 4; t++) {
            var hull = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2, 5),
                new THREE.MeshLambertMaterial({ color: tankColor })
            );
            hull.position.set(-6 + (t * 5), 1, 5 - (t * 2));
            scene.add(hull);
            objects.push(hull);

            var turret = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 8, 6),
                new THREE.MeshLambertMaterial({ color: tankColor })
            );
            turret.position.set(-6 + (t * 5), 2.5, 5 - (t * 2));
            scene.add(turret);
            objects.push(turret);

            var gunBarrel = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 3, 8),
                new THREE.MeshLambertMaterial({ color: barrelColor })
            );
            gunBarrel.rotation.z = 1.57;
            gunBarrel.position.set(-6 + (t * 5) + 1.5, 2.8, 5 - (t * 2));
            scene.add(gunBarrel);
            objects.push(gunBarrel);

            for (var w = 0; w < 2; w++) {
                var wheel = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8),
                    new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
                );
                wheel.rotation.z = 1.57;
                wheel.position.set(-6 + (t * 5) - 0.8 + (w * 1.6), 0.6, 5 - (t * 2) - 1.5);
                scene.add(wheel);
                objects.push(wheel);

                var wheelRear = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.6, 0.6, 0.4, 8),
                    new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
                );
                wheelRear.rotation.z = 1.57;
                wheelRear.position.set(-6 + (t * 5) - 0.8 + (w * 1.6), 0.6, 5 - (t * 2) + 1.5);
                scene.add(wheelRear);
                objects.push(wheelRear);
            }
        }
    }

    function buildSniperNests() {
        var nestColor = 0x556B2F;

        var leftNest = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1.5, 2.5),
            new THREE.MeshLambertMaterial({ color: nestColor })
        );
        leftNest.position.set(-8, 27, 0);
        scene.add(leftNest);
        objects.push(leftNest);

        var rightNest = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1.5, 2.5),
            new THREE.MeshLambertMaterial({ color: nestColor })
        );
        rightNest.position.set(8, 27, 0);
        scene.add(rightNest);
        objects.push(rightNest);

        var hqNestPlatform = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.8, 4),
            new THREE.MeshLambertMaterial({ color: nestColor })
        );
        hqNestPlatform.position.set(0, 11, -20);
        scene.add(hqNestPlatform);
        objects.push(hqNestPlatform);

        var railGuard = new THREE.Mesh(
            new THREE.BoxGeometry(5.5, 1, 0.4),
            new THREE.MeshLambertMaterial({ color: 0x2A2A2A })
        );
        railGuard.position.set(0, 11.8, -22);
        scene.add(railGuard);
        objects.push(railGuard);
    }

    function buildPropagandaColumns() {
        for (var i = 0; i < 3; i++) {
            var pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.4, 0.4, 15, 8),
                new THREE.MeshLambertMaterial({ color: 0x444444 })
            );
            pole.position.set(-10 + (i * 10), 7.5, 8);
            scene.add(pole);
            objects.push(pole);

            var banner = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2, 0.3),
                new THREE.MeshLambertMaterial({ color: 0xCC0000 })
            );
            banner.position.set(-10 + (i * 10), 11, 9.5);
            scene.add(banner);
            objects.push(banner);
            flagPanels.push(banner);

            var bannerBottom = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2, 0.3),
                new THREE.MeshLambertMaterial({ color: 0x660000 })
            );
            bannerBottom.position.set(-10 + (i * 10), 8, 9.5);
            scene.add(bannerBottom);
            objects.push(bannerBottom);
        }
    }

    function buildSandbagFortifications() {
        var bagColor = 0x8B7355;

        for (var i = 0; i < 6; i++) {
            var bagStack = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 1),
                new THREE.MeshLambertMaterial({ color: bagColor })
            );
            bagStack.position.set(-12, 0.5, -8 + (i * 3));
            scene.add(bagStack);
            objects.push(bagStack);

            var bagStack2 = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 1),
                new THREE.MeshLambertMaterial({ color: bagColor })
            );
            bagStack2.position.set(-12, 1.5, -8 + (i * 3));
            scene.add(bagStack2);
            objects.push(bagStack2);

            var bagStack3 = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.8, 1),
                new THREE.MeshLambertMaterial({ color: bagColor })
            );
            bagStack3.position.set(-12, 2.3, -8 + (i * 3));
            scene.add(bagStack3);
            objects.push(bagStack3);
        }

        for (var j = 0; j < 4; j++) {
            var fortBag = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.8, 1.2),
                new THREE.MeshLambertMaterial({ color: bagColor })
            );
            fortBag.position.set(10, 0.5, -10 + (j * 5));
            scene.add(fortBag);
            objects.push(fortBag);

            var fortBag2 = new THREE.Mesh(
                new THREE.BoxGeometry(1.2, 0.8, 1.2),
                new THREE.MeshLambertMaterial({ color: bagColor })
            );
            fortBag2.position.set(10, 1.3, -10 + (j * 5));
            scene.add(fortBag2);
            objects.push(fortBag2);
        }
    }

    function buildFlagpoleCluster() {
        var poleColor = 0x444444;
        var flagColor = 0xFFD700;

        for (var i = 0; i < 3; i++) {
            var flagpole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.35, 12, 8),
                new THREE.MeshLambertMaterial({ color: poleColor })
            );
            flagpole.position.set(12, 6, -6 + (i * 4));
            scene.add(flagpole);
            objects.push(flagpole);

            var flagPanel = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 1.8, 0.2),
                new THREE.MeshLambertMaterial({ color: flagColor })
            );
            flagPanel.position.set(14, 9, -6 + (i * 4));
            scene.add(flagPanel);
            objects.push(flagPanel);
            flagPanels.push(flagPanel);

            var base = new THREE.Mesh(
                new THREE.CylinderGeometry(1, 1, 0.5, 8),
                new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
            );
            base.position.set(12, -0.25, -6 + (i * 4));
            scene.add(base);
            objects.push(base);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
        directionalLight.position.set(20, 30, 20);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var spotLight = new THREE.SpotLight(0xFFFFFF, 0.5);
        spotLight.position.set(0, 15, 25);
        spotLight.castShadow = true;
        scene.add(spotLight);
        lights.push(spotLight);

        var accentLight = new THREE.PointLight(0xFF6B35, 0.4);
        accentLight.position.set(-15, 5, 15);
        scene.add(accentLight);
        lights.push(accentLight);
    }

    function update(delta) {
        animationTime += delta;
        for (var i = 0; i < flagPanels.length; i++) {
            flagPanels[i].rotation.y = Math.sin(animationTime * 1.5) * 0.3;
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
        flagPanels = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
