window.WarChapel = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var candleLight = null;
    var bellCone = null;
    var bellRotation = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildChapel();
        buildTower();
        buildGraveyard();
        buildDefenses();
        buildBarricades();
        buildEquipment();
        buildDamage();
        buildAtmosphere();
        setupLighting();
    }

    function buildChapel() {
        var stoneGray = 0x888888;
        var darkStone = 0x333333;

        // Main nave - long rectangular box
        var naveGeom = new THREE.BoxGeometry(15, 25, 40);
        var naveMat = new THREE.MeshLambertMaterial({ color: stoneGray });
        var nave = new THREE.Mesh(naveGeom, naveMat);
        nave.position.set(0, 12.5, 0);
        nave.castShadow = true;
        nave.receiveShadow = true;
        scene.add(nave);
        objects.push(nave);

        // Apse (altar end) - rectangular box
        var apseGeom = new THREE.BoxGeometry(12, 25, 15);
        var apseMat = new THREE.MeshLambertMaterial({ color: darkStone });
        var apse = new THREE.Mesh(apseGeom, apseMat);
        apse.position.set(0, 12.5, 25);
        apse.castShadow = true;
        apse.receiveShadow = true;
        scene.add(apse);
        objects.push(apse);

        // Roof support beams - long boxes
        for (var i = 0; i < 4; i++) {
            var beamGeom = new THREE.BoxGeometry(1.5, 1.5, 35);
            var beamMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var beam = new THREE.Mesh(beamGeom, beamMat);
            beam.position.set(-5 + i * 3.3, 24, 5);
            beam.castShadow = true;
            beam.receiveShadow = true;
            scene.add(beam);
            objects.push(beam);
        }

        // Interior columns - 4 tall cylinders
        for (var i = 0; i < 4; i++) {
            var colGeom = new THREE.CylinderGeometry(1, 1, 24, 8);
            var colMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var col = new THREE.Mesh(colGeom, colMat);
            col.position.set(-4 + i * 2.7, 12, 5 + i * 5);
            col.castShadow = true;
            col.receiveShadow = true;
            scene.add(col);
            objects.push(col);
        }

        // Stained glass window frames (broken) - outer frames
        for (var i = 0; i < 6; i++) {
            var frameGeom = new THREE.BoxGeometry(3, 8, 0.5);
            var frameMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var frame = new THREE.Mesh(frameGeom, frameMat);
            frame.position.set(-7, 10, 2 + i * 7);
            frame.castShadow = true;
            frame.receiveShadow = true;
            scene.add(frame);
            objects.push(frame);
        }

        // Stained glass window frames - right side
        for (var i = 0; i < 6; i++) {
            var frameGeom = new THREE.BoxGeometry(3, 8, 0.5);
            var frameMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var frame = new THREE.Mesh(frameGeom, frameMat);
            frame.position.set(7, 10, 2 + i * 7);
            frame.castShadow = true;
            frame.receiveShadow = true;
            scene.add(frame);
            objects.push(frame);
        }

        // Gothic arch doorway segments - curved box effect with segments
        for (var i = 0; i < 6; i++) {
            var archGeom = new THREE.BoxGeometry(0.8, 1.2, 0.5);
            var archMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var arch = new THREE.Mesh(archGeom, archMat);
            arch.position.set(-2.5 + i * 0.9, 8 + i * 0.8, -20);
            arch.castShadow = true;
            arch.receiveShadow = true;
            scene.add(arch);
            objects.push(arch);
        }

        // Door opening frame left
        var doorLeftGeom = new THREE.BoxGeometry(0.5, 7, 0.5);
        var doorFrameMat = new THREE.MeshLambertMaterial({ color: darkStone });
        var doorLeft = new THREE.Mesh(doorLeftGeom, doorFrameMat);
        doorLeft.position.set(-2.5, 3.5, -20);
        doorLeft.castShadow = true;
        doorLeft.receiveShadow = true;
        scene.add(doorLeft);
        objects.push(doorLeft);

        // Door opening frame right
        var doorRightGeom = new THREE.BoxGeometry(0.5, 7, 0.5);
        var doorRight = new THREE.Mesh(doorRightGeom, doorFrameMat);
        doorRight.position.set(2.5, 3.5, -20);
        doorRight.castShadow = true;
        doorRight.receiveShadow = true;
        scene.add(doorRight);
        objects.push(doorRight);

        // Door frame lintel
        var lintelGeom = new THREE.BoxGeometry(5.5, 0.5, 0.5);
        var lintel = new THREE.Mesh(lintelGeom, doorFrameMat);
        lintel.position.set(0, 7, -20);
        lintel.castShadow = true;
        lintel.receiveShadow = true;
        scene.add(lintel);
        objects.push(lintel);
    }

    function buildTower() {
        var stoneGray = 0x888888;
        var darkStone = 0x333333;

        // Bell tower main shaft - tall cylinder
        var towerGeom = new THREE.CylinderGeometry(3, 3, 30, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: stoneGray });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(10, 15, 15);
        tower.castShadow = true;
        tower.receiveShadow = true;
        scene.add(tower);
        objects.push(tower);

        // Bell cap - cone
        var bellCapGeom = new THREE.ConeGeometry(3.5, 4, 12);
        var bellCapMat = new THREE.MeshLambertMaterial({ color: darkStone });
        bellCone = new THREE.Mesh(bellCapGeom, bellCapMat);
        bellCone.position.set(10, 32, 15);
        bellCone.castShadow = true;
        bellCone.receiveShadow = true;
        scene.add(bellCone);
        objects.push(bellCone);

        // Bell inside cone - sphere
        var bellGeom = new THREE.SphereGeometry(2, 12, 12);
        var bellMat = new THREE.MeshLambertMaterial({ color: 0xcdad00 });
        var bell = new THREE.Mesh(bellGeom, bellMat);
        bell.position.set(10, 30, 15);
        bell.castShadow = true;
        bell.receiveShadow = true;
        scene.add(bell);
        objects.push(bell);

        // Tower window openings - boxes as frames
        for (var i = 0; i < 4; i++) {
            var windowGeom = new THREE.BoxGeometry(1.5, 1.5, 0.5);
            var windowMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var window_ = new THREE.Mesh(windowGeom, windowMat);
            window_.position.set(10 + 2.5 * Math.cos(i * Math.PI / 2), 20 + i * 2, 15 + 2.5 * Math.sin(i * Math.PI / 2));
            window_.castShadow = true;
            window_.receiveShadow = true;
            scene.add(window_);
            objects.push(window_);
        }

        // Damaged tower repairs - patched boxes
        for (var i = 0; i < 5; i++) {
            var patchGeom = new THREE.BoxGeometry(2, 3, 0.5);
            var patchMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
            var patch = new THREE.Mesh(patchGeom, patchMat);
            patch.position.set(10 + 2.5 * Math.cos(i * Math.PI * 2 / 5), 10 + i * 3, 15 + 2.5 * Math.sin(i * Math.PI * 2 / 5));
            patch.castShadow = true;
            patch.receiveShadow = true;
            scene.add(patch);
            objects.push(patch);
        }
    }

    function buildGraveyard() {
        var stoneGray = 0x888888;

        // Gravestone headstones - cross pattern with box + cylinder
        for (var i = 0; i < 15; i++) {
            // Headstone box
            var stoneGeom = new THREE.BoxGeometry(1.5, 3, 0.4);
            var stoneMat = new THREE.MeshLambertMaterial({ color: stoneGray });
            var stone = new THREE.Mesh(stoneGeom, stoneMat);
            var angle = i * Math.PI * 2 / 15;
            var dist = 25 + (i % 3) * 5;
            stone.position.set(Math.cos(angle) * dist, 1.5, Math.sin(angle) * dist - 25);
            stone.castShadow = true;
            stone.receiveShadow = true;
            scene.add(stone);
            objects.push(stone);

            // Grave mound - cylinder base
            var moundGeom = new THREE.CylinderGeometry(2, 2.5, 0.5, 8);
            var moundMat = new THREE.MeshLambertMaterial({ color: 0x333300 });
            var mound = new THREE.Mesh(moundGeom, moundMat);
            mound.position.set(Math.cos(angle) * dist, 0.25, Math.sin(angle) * dist - 25);
            mound.castShadow = true;
            mound.receiveShadow = true;
            scene.add(mound);
            objects.push(mound);

            // Cross top on stone - two boxes forming cross
            var vertCrossGeom = new THREE.BoxGeometry(0.3, 1.5, 0.15);
            var crossMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var vertCross = new THREE.Mesh(vertCrossGeom, crossMat);
            vertCross.position.set(Math.cos(angle) * dist, 3.2, Math.sin(angle) * dist - 25);
            vertCross.castShadow = true;
            vertCross.receiveShadow = true;
            scene.add(vertCross);
            objects.push(vertCross);

            // Horizontal cross
            var horizCrossGeom = new THREE.BoxGeometry(1, 0.3, 0.15);
            var horizCross = new THREE.Mesh(horizCrossGeom, crossMat);
            horizCross.position.set(Math.cos(angle) * dist, 3, Math.sin(angle) * dist - 25);
            horizCross.castShadow = true;
            horizCross.receiveShadow = true;
            scene.add(horizCross);
            objects.push(horizCross);
        }

        // Ancient collapsed monument - cylinder
        var collapseGeom = new THREE.CylinderGeometry(2.5, 2.5, 1, 12);
        var collapseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var collapse = new THREE.Mesh(collapseGeom, collapseMat);
        collapse.position.set(-25, 0.5, -40);
        collapse.rotation.z = 1.2;
        collapse.castShadow = true;
        collapse.receiveShadow = true;
        scene.add(collapse);
        objects.push(collapse);

        // Crypt entrance marker - box
        var cryptGeom = new THREE.BoxGeometry(4, 5, 1.5);
        var cryptMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var crypt = new THREE.Mesh(cryptGeom, cryptMat);
        crypt.position.set(30, 2.5, -35);
        crypt.castShadow = true;
        crypt.receiveShadow = true;
        scene.add(crypt);
        objects.push(crypt);
    }

    function buildDefenses() {
        var khaki = 0xc3b091;

        // Sandbag walls - stacked boxes around chapel perimeter
        for (var ring = 0; ring < 3; ring++) {
            var radius = 20 + ring * 3;
            for (var i = 0; i < 24; i++) {
                var bagGeom = new THREE.BoxGeometry(1.5, 1, 1.2);
                var bagMat = new THREE.MeshLambertMaterial({ color: khaki });
                var bag = new THREE.Mesh(bagGeom, bagMat);
                var angle = i * Math.PI * 2 / 24;
                bag.position.set(Math.cos(angle) * radius, 0.5 + ring * 1.2, Math.sin(angle) * radius);
                bag.castShadow = true;
                bag.receiveShadow = true;
                scene.add(bag);
                objects.push(bag);
            }
        }

        // Corner watchtower foundation - boxes
        for (var corner = 0; corner < 4; corner++) {
            var posX = (corner < 2 ? -1 : 1) * 28;
            var posZ = (corner % 2 === 0 ? -1 : 1) * 35;

            // Tower base - stacked boxes
            for (var level = 0; level < 3; level++) {
                var baseGeom = new THREE.BoxGeometry(4, 1.5, 4);
                var baseMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
                var base = new THREE.Mesh(baseGeom, baseMat);
                base.position.set(posX, 0.75 + level * 1.8, posZ);
                base.castShadow = true;
                base.receiveShadow = true;
                scene.add(base);
                objects.push(base);
            }

            // Watchtower pillar - cylinder
            var pillarGeom = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
            var pillarMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
            var pillar = new THREE.Mesh(pillarGeom, pillarMat);
            pillar.position.set(posX, 4, posZ);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            scene.add(pillar);
            objects.push(pillar);
        }

        // Gate anti-vehicle obstacles - cylinders
        for (var i = 0; i < 8; i++) {
            var obstacleGeom = new THREE.CylinderGeometry(0.8, 0.8, 2, 8);
            var obstacleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var obstacle = new THREE.Mesh(obstacleGeom, obstacleMat);
            obstacle.position.set(-3 + i * 1.5, 1, -22);
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            scene.add(obstacle);
            objects.push(obstacle);
        }
    }

    function buildBarricades() {
        var woodBrown = 0x654321;

        // Barricades from chapel pews - long boxes
        for (var row = 0; row < 6; row++) {
            var barricadeGeom = new THREE.BoxGeometry(18, 1.2, 1.5);
            var barricadeMat = new THREE.MeshLambertMaterial({ color: woodBrown });
            var barricade = new THREE.Mesh(barricadeGeom, barricadeMat);
            barricade.position.set(0, 0.6 + row * 1.8, -8 + row * 1.2);
            barricade.castShadow = true;
            barricade.receiveShadow = true;
            scene.add(barricade);
            objects.push(barricade);

            // Support posts for barricade - cylinders
            for (var post = 0; post < 4; post++) {
                var postGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 6);
                var postMat = new THREE.MeshLambertMaterial({ color: 0x553300 });
                var postMesh = new THREE.Mesh(postGeom, postMat);
                postMesh.position.set(-8 + post * 6, 1.2 + row * 1.8, -8 + row * 1.2);
                postMesh.castShadow = true;
                postMesh.receiveShadow = true;
                scene.add(postMesh);
                objects.push(postMesh);
            }
        }

        // Interior furniture blockade - boxes scattered
        for (var i = 0; i < 10; i++) {
            var blockGeom = new THREE.BoxGeometry(2 + Math.random() * 2, 1.5, 1.5 + Math.random());
            var blockMat = new THREE.MeshLambertMaterial({ color: woodBrown });
            var block = new THREE.Mesh(blockGeom, blockMat);
            block.position.set(-5 + Math.random() * 10, 0.75, 8 + Math.random() * 10);
            block.rotation.y = Math.random() * Math.PI;
            block.castShadow = true;
            block.receiveShadow = true;
            scene.add(block);
            objects.push(block);
        }
    }

    function buildEquipment() {
        var khaki = 0xc3b091;
        var metalGray = 0x555555;

        // Military radio equipment base - composite boxes
        var radioBaseGeom = new THREE.BoxGeometry(3, 0.5, 2);
        var radioBaseMat = new THREE.MeshLambertMaterial({ color: metalGray });
        var radioBase = new THREE.Mesh(radioBaseGeom, radioBaseMat);
        radioBase.position.set(-8, 0.25, 12);
        radioBase.castShadow = true;
        radioBase.receiveShadow = true;
        scene.add(radioBase);
        objects.push(radioBase);

        // Radio box main unit
        var radioCaseGeom = new THREE.BoxGeometry(2.5, 1.5, 1.5);
        var radioCaseMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var radioCase = new THREE.Mesh(radioCaseGeom, radioCaseMat);
        radioCase.position.set(-8, 1.25, 11.5);
        radioCase.castShadow = true;
        radioCase.receiveShadow = true;
        scene.add(radioCase);
        objects.push(radioCase);

        // Radio antenna - tall cylinder
        var antennaGeom = new THREE.CylinderGeometry(0.15, 0.15, 4, 6);
        var antennaMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var antenna = new THREE.Mesh(antennaGeom, antennaMat);
        antenna.position.set(-8, 3, 11.5);
        antenna.castShadow = true;
        antenna.receiveShadow = true;
        scene.add(antenna);
        objects.push(antenna);

        // Mortar position - box composite with cylinder base
        var mortarBaseGeom = new THREE.CylinderGeometry(2, 2, 0.5, 12);
        var mortarBaseMat = new THREE.MeshLambertMaterial({ color: khaki });
        var mortarBase = new THREE.Mesh(mortarBaseGeom, mortarBaseMat);
        mortarBase.position.set(20, 0.25, -30);
        mortarBase.castShadow = true;
        mortarBase.receiveShadow = true;
        scene.add(mortarBase);
        objects.push(mortarBase);

        // Mortar tube - cylinder tilted
        var mortarTubeGeom = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        var mortarTubeMat = new THREE.MeshLambertMaterial({ color: metalGray });
        var mortarTube = new THREE.Mesh(mortarTubeGeom, mortarTubeMat);
        mortarTube.position.set(20, 2, -30);
        mortarTube.rotation.z = 0.6;
        mortarTube.castShadow = true;
        mortarTube.receiveShadow = true;
        scene.add(mortarTube);
        objects.push(mortarTube);

        // Ammo boxes scattered - small boxes
        for (var i = 0; i < 8; i++) {
            var ammoGeom = new THREE.BoxGeometry(1, 0.8, 1.2);
            var ammoMat = new THREE.MeshLambertMaterial({ color: 0x332211 });
            var ammo = new THREE.Mesh(ammoGeom, ammoMat);
            ammo.position.set(-5 + i * 1.5, 0.4, 18);
            ammo.castShadow = true;
            ammo.receiveShadow = true;
            scene.add(ammo);
            objects.push(ammo);
        }

        // Crate storage - boxes
        for (var i = 0; i < 5; i++) {
            var crateGeom = new THREE.BoxGeometry(2, 1.5, 2);
            var crateMat = new THREE.MeshLambertMaterial({ color: 0x443322 });
            var crate = new THREE.Mesh(crateGeom, crateMat);
            crate.position.set(5 + i * 2.5, 0.75, 20);
            crate.castShadow = true;
            crate.receiveShadow = true;
            scene.add(crate);
            objects.push(crate);
        }
    }

    function buildDamage() {
        var darkStone = 0x333333;

        // Bullet impact marks - dark spheres embedded in walls
        for (var i = 0; i < 25; i++) {
            var impactGeom = new THREE.SphereGeometry(0.3, 6, 6);
            var impactMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
            var impact = new THREE.Mesh(impactGeom, impactMat);

            // Scattered on chapel walls
            var side = Math.floor(i / 5);
            if (side === 0) {
                impact.position.set(-7.5, 8 + Math.random() * 12, 5 + Math.random() * 30);
            } else if (side === 1) {
                impact.position.set(7.5, 8 + Math.random() * 12, 5 + Math.random() * 30);
            } else if (side === 2) {
                impact.position.set(-5 + Math.random() * 10, 8 + Math.random() * 12, 40);
            } else if (side === 3) {
                impact.position.set(-5 + Math.random() * 10, 8 + Math.random() * 12, -20);
            } else {
                impact.position.set(10 + Math.random() * 3, 15 + Math.random() * 10, 15);
            }

            impact.castShadow = true;
            impact.receiveShadow = true;
            scene.add(impact);
            objects.push(impact);
        }

        // Structural damage - broken support section
        var damageGeom = new THREE.BoxGeometry(8, 2, 1.5);
        var damageMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var damage = new THREE.Mesh(damageGeom, damageMat);
        damage.position.set(0, 22, 20);
        damage.rotation.z = 0.3;
        damage.castShadow = true;
        damage.receiveShadow = true;
        scene.add(damage);
        objects.push(damage);

        // Shattered roof section box
        for (var i = 0; i < 4; i++) {
            var roofPieceGeom = new THREE.BoxGeometry(3, 1.5, 2);
            var roofPieceMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var roofPiece = new THREE.Mesh(roofPieceGeom, roofPieceMat);
            roofPiece.position.set(-6 + i * 4, 24 + i * 0.5, 10);
            roofPiece.rotation.z = 0.2 * i;
            roofPiece.castShadow = true;
            roofPiece.receiveShadow = true;
            scene.add(roofPiece);
            objects.push(roofPiece);
        }

        // Torn interior wall section
        var wallTornGeom = new THREE.BoxGeometry(6, 8, 1);
        var wallTornMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var wallTorn = new THREE.Mesh(wallTornGeom, wallTornMat);
        wallTorn.position.set(0, 10, 35);
        wallTorn.castShadow = true;
        wallTorn.receiveShadow = true;
        scene.add(wallTorn);
        objects.push(wallTorn);
    }

    function buildAtmosphere() {
        var darkStone = 0x333333;

        // Candle holders - small cylinders
        for (var i = 0; i < 6; i++) {
            var candleHolderGeom = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
            var candleHolderMat = new THREE.MeshLambertMaterial({ color: darkStone });
            var candleHolder = new THREE.Mesh(candleHolderGeom, candleHolderMat);
            candleHolder.position.set(-4 + i * 1.5, 2, 28);
            candleHolder.castShadow = true;
            candleHolder.receiveShadow = true;
            scene.add(candleHolder);
            objects.push(candleHolder);

            // Wax candles - small boxes/cylinders
            var candleGeom = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6);
            var candleMat = new THREE.MeshLambertMaterial({ color: 0xffff99 });
            var candle = new THREE.Mesh(candleGeom, candleMat);
            candle.position.set(-4 + i * 1.5, 2.8, 28);
            candle.castShadow = true;
            candle.receiveShadow = true;
            scene.add(candle);
            objects.push(candle);
        }

        // Rubble piles - scattered boxes and spheres
        for (var i = 0; i < 15; i++) {
            var rubbleGeom = new THREE.BoxGeometry(1 + Math.random() * 1.5, 0.8 + Math.random(), 1 + Math.random());
            var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x555555 + Math.random() * 0x333333 });
            var rubble = new THREE.Mesh(rubbleGeom, rubbleMat);
            rubble.position.set(-20 + Math.random() * 40, 0.5, -45 + Math.random() * 30);
            rubble.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            rubble.castShadow = true;
            rubble.receiveShadow = true;
            scene.add(rubble);
            objects.push(rubble);

            // Rubble sphere pieces
            var rubbleSphereGeom = new THREE.SphereGeometry(0.4 + Math.random() * 0.5, 8, 8);
            var rubbleSphere = new THREE.Mesh(rubbleSphereGeom, rubbleMat);
            rubbleSphere.position.set(-20 + Math.random() * 40, 1.5 + Math.random() * 1, -45 + Math.random() * 30);
            rubbleSphere.castShadow = true;
            rubbleSphere.receiveShadow = true;
            scene.add(rubbleSphere);
            objects.push(rubbleSphere);
        }

        // Ground craters - indented box sections
        for (var i = 0; i < 5; i++) {
            var craterGeom = new THREE.CylinderGeometry(2 + Math.random() * 2, 2.5 + Math.random() * 2, 0.5, 12);
            var craterMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var crater = new THREE.Mesh(craterGeom, craterMat);
            crater.position.set(-15 + Math.random() * 30, 0.1, -20 + Math.random() * 40);
            crater.castShadow = true;
            crater.receiveShadow = true;
            scene.add(crater);
            objects.push(crater);
        }

        // Directional damage patterns - cone shapes
        for (var i = 0; i < 3; i++) {
            var blastGeom = new THREE.ConeGeometry(3, 4, 12);
            var blastMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var blast = new THREE.Mesh(blastGeom, blastMat);
            blast.position.set(-10 + i * 10, 2, 30);
            blast.rotation.x = 1.5;
            blast.castShadow = true;
            blast.receiveShadow = true;
            scene.add(blast);
            objects.push(blast);
        }
    }

    function setupLighting() {
        // Ambient light for base illumination
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light as sunlight
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 30, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        scene.add(dirLight);
        lights.push(dirLight);

        // Flickering candle light
        candleLight = new THREE.PointLight(0xffaa00, 0.5, 20);
        candleLight.position.set(-1, 3, 28);
        candleLight.castShadow = true;
        scene.add(candleLight);
        lights.push(candleLight);

        // Radio equipment indicator light
        var radioLight = new THREE.PointLight(0xff0000, 0.3, 15);
        radioLight.position.set(-8, 2, 12);
        scene.add(radioLight);
        lights.push(radioLight);

        // Chapel interior accent light
        var altarLight = new THREE.PointLight(0xffddaa, 0.4, 25);
        altarLight.position.set(0, 15, 28);
        scene.add(altarLight);
        lights.push(altarLight);
    }

    function update(delta) {
        // Animate candle flicker
        if (candleLight) {
            var flicker = 0.4 + Math.sin(delta * 8) * 0.15 + Math.random() * 0.1;
            candleLight.intensity = Math.max(0, flicker);
        }

        // Animate loose bell swinging
        if (bellCone) {
            bellRotation += delta * 0.5;
            bellCone.rotation.x = Math.sin(bellRotation) * 0.15;
            bellCone.rotation.z = Math.cos(bellRotation * 0.7) * 0.1;
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
        scene = null;
        camera = null;
        candleLight = null;
        bellCone = null;
        bellRotation = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
