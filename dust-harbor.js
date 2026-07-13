window.DustHarbor = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var dustDevilSpeeds = [];
    var sandstormParticles = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        dustDevilSpeeds = [];
        sandstormParticles = [];
        buildHarborLayout();
        buildDustDunes();
        buildAbandonedBoats();
        buildSaltFlats();
        buildMarketRuins();
        buildWatchtowers();
        buildArtillerySite();
        buildSandstorm();
        setupLighting();
    }

    function buildHarborLayout() {
        var harborWallColor = 0x7a7a7a;
        var rubbleColor = 0x5a5a5a;

        var wallHeight = 8;
        var wallSegments = [
            { x: -40, z: 20, w: 15, h: wallHeight, d: 2 },
            { x: -25, z: 20, w: 2, h: wallHeight, d: 2 },
            { x: -8, z: 22, w: 2, h: 6, d: 2 },
            { x: 15, z: 25, w: 2, h: 5, d: 2 },
            { x: 40, z: 20, w: 10, h: wallHeight, d: 2 },
            { x: -50, z: 5, w: 2, h: wallHeight, d: 25 },
            { x: 50, z: 8, w: 2, h: wallHeight, d: 20 },
            { x: -45, z: -15, w: 8, h: wallHeight, d: 2 },
            { x: 45, z: -18, w: 12, h: 6, d: 2 },
            { x: 0, z: -35, w: 2, h: wallHeight, d: 15 }
        ];

        for (var i = 0; i < wallSegments.length; i++) {
            var seg = wallSegments[i];
            var geometry = new THREE.BoxGeometry(seg.w, seg.h, seg.d);
            var material = new THREE.MeshLambertMaterial({ color: harborWallColor });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(seg.x, seg.h / 2, seg.z);
            scene.add(mesh);
            objects.push(mesh);
        }

        var rubblePositions = [
            { x: -30, z: 18, count: 5 },
            { x: 20, z: 23, count: 4 },
            { x: 45, z: 22, count: 6 },
            { x: -48, z: 8, count: 3 },
            { x: -40, z: -12, count: 4 }
        ];

        for (var i = 0; i < rubblePositions.length; i++) {
            var pos = rubblePositions[i];
            for (var j = 0; j < pos.count; j++) {
                var rw = 2 + Math.random() * 3;
                var rh = 1 + Math.random() * 2;
                var rd = 2 + Math.random() * 3;
                var geometry = new THREE.BoxGeometry(rw, rh, rd);
                var material = new THREE.MeshLambertMaterial({ color: rubbleColor });
                var mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(
                    pos.x + (Math.random() - 0.5) * 8,
                    rh / 2,
                    pos.z + (Math.random() - 0.5) * 8
                );
                mesh.rotation.set(
                    Math.random() * 0.5,
                    Math.random() * Math.PI,
                    Math.random() * 0.5
                );
                scene.add(mesh);
                objects.push(mesh);
            }
        }

        var dryDockGeometry = new THREE.BoxGeometry(80, 15, 60);
        var dryDockMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var dryDock = new THREE.Mesh(dryDockGeometry, dryDockMaterial);
        dryDock.position.set(0, -7, -50);
        scene.add(dryDock);
        objects.push(dryDock);
    }

    function buildDustDunes() {
        var duneColor = 0xc9a876;
        var dunePositions = [
            { x: -60, z: -30, w: 30, h: 12, d: 25 },
            { x: 60, z: -40, w: 25, h: 14, d: 30 },
            { x: -35, z: 35, w: 20, h: 10, d: 20 },
            { x: 35, z: 40, w: 22, h: 11, d: 18 },
            { x: 0, z: 50, w: 35, h: 15, d: 25 },
            { x: -50, z: 10, w: 18, h: 9, d: 15 },
            { x: 55, z: 15, w: 20, h: 10, d: 22 },
            { x: -20, z: -50, w: 25, h: 12, d: 28 }
        ];

        for (var i = 0; i < dunePositions.length; i++) {
            var dune = dunePositions[i];
            var geometry = new THREE.BoxGeometry(dune.w, dune.h, dune.d);
            var material = new THREE.MeshLambertMaterial({ color: duneColor });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(dune.x, dune.h / 2, dune.z);
            mesh.rotation.z = (Math.random() - 0.5) * 0.3;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildAbandonedBoats() {
        var hullColor = 0x8b4513;
        var deckColor = 0x6b3410;

        var boatPositions = [
            { x: -30, z: 0, scale: 1.0 },
            { x: 25, z: 5, scale: 0.85 },
            { x: 45, z: -5, scale: 0.9 },
            { x: -50, z: -10, scale: 1.1 },
            { x: 10, z: 15, scale: 0.95 }
        ];

        for (var i = 0; i < boatPositions.length; i++) {
            var boat = boatPositions[i];
            var hullLength = 25 * boat.scale;
            var hullWidth = 8 * boat.scale;
            var hullHeight = 6 * boat.scale;

            var hullGeometry = new THREE.BoxGeometry(hullWidth, hullHeight, hullLength);
            var hullMaterial = new THREE.MeshLambertMaterial({ color: hullColor });
            var hull = new THREE.Mesh(hullGeometry, hullMaterial);
            hull.position.set(boat.x, hullHeight / 2, boat.z);
            hull.rotation.z = (Math.random() - 0.5) * 0.4;
            scene.add(hull);
            objects.push(hull);

            var deckGeometry = new THREE.BoxGeometry(hullWidth - 1, 1, hullLength - 2);
            var deckMaterial = new THREE.MeshLambertMaterial({ color: deckColor });
            var deck = new THREE.Mesh(deckGeometry, deckMaterial);
            deck.position.set(boat.x, hullHeight + 0.5, boat.z);
            deck.rotation.z = hull.rotation.z;
            scene.add(deck);
            objects.push(deck);

            var cabinGeometry = new THREE.BoxGeometry(hullWidth - 2, 3, 6);
            var cabinMaterial = new THREE.MeshLambertMaterial({ color: deckColor });
            var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
            cabin.position.set(boat.x, hullHeight + 2.5, boat.z - hullLength / 3);
            cabin.rotation.z = hull.rotation.z;
            scene.add(cabin);
            objects.push(cabin);
        }

        var freighterLength = 50;
        var freighterWidth = 15;
        var freighterHeight = 12;

        var freighterGeometry = new THREE.BoxGeometry(freighterWidth, freighterHeight, freighterLength);
        var freighterMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var freighter = new THREE.Mesh(freighterGeometry, freighterMaterial);
        freighter.position.set(-20, freighterHeight / 2 - 3, -45);
        freighter.rotation.z = 0.3;
        scene.add(freighter);
        objects.push(freighter);

        var superstructureGeometry = new THREE.BoxGeometry(freighterWidth - 2, 8, 8);
        var superstructureMaterial = new THREE.MeshLambertMaterial({ color: 0x6b3410 });
        var superstructure = new THREE.Mesh(superstructureGeometry, superstructureMaterial);
        superstructure.position.set(-20, freighterHeight + 2, -35);
        superstructure.rotation.z = 0.3;
        scene.add(superstructure);
        objects.push(superstructure);
    }

    function buildSaltFlats() {
        var saltColor = 0xf5f5dc;
        var crackColor = 0xd3d3d3;

        var flatGeometry = new THREE.BoxGeometry(200, 1, 200);
        var flatMaterial = new THREE.MeshLambertMaterial({ color: saltColor });
        var flat = new THREE.Mesh(flatGeometry, flatMaterial);
        flat.position.set(0, 0, 0);
        scene.add(flat);
        objects.push(flat);

        var crackPositions = [
            { x: -50, z: -20, w: 2, d: 40 },
            { x: 40, z: 10, w: 60, d: 2 },
            { x: -30, z: 40, w: 2, d: 30 },
            { x: 20, z: -40, w: 45, d: 2 },
            { x: -70, z: 0, w: 2, d: 50 },
            { x: 60, z: -50, w: 40, d: 2 },
            { x: -10, z: 55, w: 2, d: 35 },
            { x: 0, z: -60, w: 50, d: 2 }
        ];

        for (var i = 0; i < crackPositions.length; i++) {
            var crack = crackPositions[i];
            var crackGeometry = new THREE.BoxGeometry(crack.w, 0.3, crack.d);
            var crackMaterial = new THREE.MeshLambertMaterial({ color: crackColor });
            var crackMesh = new THREE.Mesh(crackGeometry, crackMaterial);
            crackMesh.position.set(crack.x, 0.15, crack.z);
            scene.add(crackMesh);
            objects.push(crackMesh);
        }

        var saltPillarPositions = [
            { x: -75, z: 45 },
            { x: 75, z: -40 },
            { x: 40, z: 60 },
            { x: -40, z: -60 },
            { x: 60, z: 30 },
            { x: -60, z: 50 },
            { x: 30, z: -75 },
            { x: -30, z: 70 }
        ];

        for (var i = 0; i < saltPillarPositions.length; i++) {
            var pillarPos = saltPillarPositions[i];
            var pillarGeometry = new THREE.CylinderGeometry(1.5, 2, 15, 6);
            var pillarMaterial = new THREE.MeshLambertMaterial({ color: 0xfffacd });
            var pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pillarPos.x, 7.5, pillarPos.z);
            scene.add(pillar);
            objects.push(pillar);
        }

        var thinPillarPositions = [
            { x: -45, z: 30 },
            { x: 45, z: -30 },
            { x: -55, z: -45 },
            { x: 55, z: 45 },
            { x: 20, z: 70 },
            { x: -20, z: -70 }
        ];

        for (var i = 0; i < thinPillarPositions.length; i++) {
            var thinPos = thinPillarPositions[i];
            var thinGeometry = new THREE.BoxGeometry(0.8, 12, 0.8);
            var thinMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f8ff });
            var thinPillar = new THREE.Mesh(thinGeometry, thinMaterial);
            thinPillar.position.set(thinPos.x, 6, thinPos.z);
            scene.add(thinPillar);
            objects.push(thinPillar);
        }
    }

    function buildMarketRuins() {
        var wallColor = 0x8b7355;
        var rubbleColor = 0x6b5345;

        var buildingPositions = [
            { x: -35, z: 45, w: 12, h: 8, d: 10 },
            { x: -20, z: 50, w: 10, h: 7, d: 12 },
            { x: -5, z: 48, w: 11, h: 9, d: 9 },
            { x: 12, z: 52, w: 9, h: 6, d: 11 },
            { x: 30, z: 50, w: 13, h: 8, d: 10 },
            { x: -28, z: 65, w: 10, h: 5, d: 10 },
            { x: 5, z: 68, w: 12, h: 6, d: 10 },
            { x: 28, z: 66, w: 11, h: 7, d: 9 }
        ];

        for (var i = 0; i < buildingPositions.length; i++) {
            var building = buildingPositions[i];
            var geometry = new THREE.BoxGeometry(building.w, building.h, building.d);
            var material = new THREE.MeshLambertMaterial({ color: wallColor });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(building.x, building.h / 2, building.z);
            scene.add(mesh);
            objects.push(mesh);

            var wallFragments = 3 + Math.floor(Math.random() * 2);
            for (var j = 0; j < wallFragments; j++) {
                var fragW = 2 + Math.random() * 2;
                var fragH = 2 + Math.random() * 3;
                var fragD = 1.5 + Math.random() * 1.5;
                var fragGeometry = new THREE.BoxGeometry(fragW, fragH, fragD);
                var fragMaterial = new THREE.MeshLambertMaterial({ color: rubbleColor });
                var fragment = new THREE.Mesh(fragGeometry, fragMaterial);
                fragment.position.set(
                    building.x + (Math.random() - 0.5) * 6,
                    building.h + 1 + Math.random() * 2,
                    building.z + (Math.random() - 0.5) * 6
                );
                fragment.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * 0.7
                );
                scene.add(fragment);
                objects.push(fragment);
            }
        }

        var stoneArchPositions = [
            { x: -25, z: 52, size: 8 },
            { x: 15, z: 55, size: 7 },
            { x: 32, z: 58, size: 8 }
        ];

        for (var i = 0; i < stoneArchPositions.length; i++) {
            var arch = stoneArchPositions[i];
            var archGeometry = new THREE.BoxGeometry(arch.size, arch.size, 2);
            var archMaterial = new THREE.MeshLambertMaterial({ color: wallColor });
            var archMesh = new THREE.Mesh(archGeometry, archMaterial);
            archMesh.position.set(arch.x, arch.size / 2 + 2, arch.z);
            scene.add(archMesh);
            objects.push(archMesh);
        }
    }

    function buildWatchtowers() {
        var towerColor = 0x696969;
        var platformColor = 0x5a5a5a;

        var towerPositions = [
            { x: -70, z: -50, size: 6 },
            { x: 70, z: 50, size: 6 },
            { x: -80, z: 30, size: 5 },
            { x: 75, z: -60, size: 5 }
        ];

        for (var i = 0; i < towerPositions.length; i++) {
            var tower = towerPositions[i];
            var towerHeight = 20;
            var towerGeometry = new THREE.BoxGeometry(tower.size, towerHeight, tower.size);
            var towerMaterial = new THREE.MeshLambertMaterial({ color: towerColor });
            var towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
            towerMesh.position.set(tower.x, towerHeight / 2, tower.z);
            scene.add(towerMesh);
            objects.push(towerMesh);

            var platformGeometry = new THREE.BoxGeometry(tower.size + 3, 1.5, tower.size + 3);
            var platformMaterial = new THREE.MeshLambertMaterial({ color: platformColor });
            var platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(tower.x, towerHeight + 0.75, tower.z);
            scene.add(platform);
            objects.push(platform);

            var railGeometry = new THREE.BoxGeometry(0.3, 1.5, tower.size + 3);
            var railMaterial = new THREE.MeshLambertMaterial({ color: towerColor });
            var railLeft = new THREE.Mesh(railGeometry, railMaterial);
            railLeft.position.set(tower.x - (tower.size + 3) / 2 - 0.2, towerHeight + 1.2, tower.z);
            scene.add(railLeft);
            objects.push(railLeft);

            var railRight = new THREE.Mesh(railGeometry, railMaterial);
            railRight.position.set(tower.x + (tower.size + 3) / 2 + 0.2, towerHeight + 1.2, tower.z);
            scene.add(railRight);
            objects.push(railRight);

            var railFront = new THREE.Mesh(railGeometry, railMaterial);
            railFront.rotation.z = Math.PI / 2;
            railFront.position.set(tower.x, towerHeight + 1.2, tower.z + (tower.size + 3) / 2 + 0.2);
            scene.add(railFront);
            objects.push(railFront);

            var railBack = new THREE.Mesh(railGeometry, railMaterial);
            railBack.rotation.z = Math.PI / 2;
            railBack.position.set(tower.x, towerHeight + 1.2, tower.z - (tower.size + 3) / 2 - 0.2);
            scene.add(railBack);
            objects.push(railBack);
        }
    }

    function buildArtillerySite() {
        var carriageColor = 0x4a4a4a;
        var barrelColor = 0x2a2a2a;

        var artilleryPositions = [
            { x: -50, z: -30 },
            { x: 50, z: 30 },
            { x: 35, z: -45 },
            { x: -35, z: 40 }
        ];

        for (var i = 0; i < artilleryPositions.length; i++) {
            var site = artilleryPositions[i];

            var carriageGeometry = new THREE.BoxGeometry(6, 3, 6);
            var carriageMaterial = new THREE.MeshLambertMaterial({ color: carriageColor });
            var carriage = new THREE.Mesh(carriageGeometry, carriageMaterial);
            carriage.position.set(site.x, 1.5, site.z);
            scene.add(carriage);
            objects.push(carriage);

            var barrelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 20, 8);
            var barrelMaterial = new THREE.MeshLambertMaterial({ color: barrelColor });
            var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
            barrel.rotation.z = Math.PI / 4;
            barrel.position.set(site.x, 4, site.z);
            scene.add(barrel);
            objects.push(barrel);

            var breechGeometry = new THREE.SphereGeometry(1.2, 8, 8);
            var breechMaterial = new THREE.MeshLambertMaterial({ color: barrelColor });
            var breech = new THREE.Mesh(breechGeometry, breechMaterial);
            breech.position.set(site.x, 3, site.z);
            scene.add(breech);
            objects.push(breech);
        }
    }

    function buildSandstorm() {
        var stormColor = 0xd4a574;
        var particleCount = 45;

        sandstormParticles = [];

        for (var i = 0; i < particleCount; i++) {
            var size = 2 + Math.random() * 3;
            var geometry = new THREE.SphereGeometry(size, 4, 4);
            var material = new THREE.MeshLambertMaterial({
                color: stormColor,
                transparent: true,
                opacity: 0.4 + Math.random() * 0.3
            });
            var particle = new THREE.Mesh(geometry, material);
            particle.position.set(
                -90 + Math.random() * 20,
                5 + Math.random() * 30,
                -80 + Math.random() * 40
            );
            scene.add(particle);
            objects.push(particle);
            sandstormParticles.push({
                mesh: particle,
                originalY: particle.position.y,
                speed: 0.5 + Math.random() * 1,
                drift: (Math.random() - 0.5) * 0.3
            });
        }
    }

    function buildDustDevils() {
        var dustColor = 0xc9a876;
        var devilCount = 3;

        var devilPositions = [
            { x: 60, z: -20 },
            { x: -60, z: 45 },
            { x: 25, z: 60 }
        ];

        for (var d = 0; d < devilCount; d++) {
            var devilPos = devilPositions[d];
            var spiralCount = 8;

            for (var s = 0; s < spiralCount; s++) {
                var sphereCount = 4;
                for (var sp = 0; sp < sphereCount; sp++) {
                    var geometry = new THREE.SphereGeometry(1.2, 6, 6);
                    var material = new THREE.MeshLambertMaterial({
                        color: dustColor,
                        transparent: true,
                        opacity: 0.5
                    });
                    var sphere = new THREE.Mesh(geometry, material);
                    var angle = (s / spiralCount) * Math.PI * 2;
                    var radius = 4 + sp * 1.5;
                    sphere.position.set(
                        devilPos.x + Math.cos(angle) * radius,
                        2 + sp * 3,
                        devilPos.z + Math.sin(angle) * radius
                    );
                    scene.add(sphere);
                    objects.push(sphere);
                    dustDevilSpeeds.push({
                        mesh: sphere,
                        centerX: devilPos.x,
                        centerZ: devilPos.z,
                        radius: radius,
                        baseY: 2 + sp * 3,
                        speed: 2 + Math.random() * 1
                    });
                }
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var sunLight = new THREE.DirectionalLight(0xffffff, 0.7);
        sunLight.position.set(50, 60, 40);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        scene.add(sunLight);
        lights.push(sunLight);

        var haloLight = new THREE.PointLight(0xffcc88, 0.4);
        haloLight.position.set(-80, 30, -80);
        scene.add(haloLight);
        lights.push(haloLight);

        var torchLight = new THREE.PointLight(0xffaa44, 0.3);
        torchLight.position.set(70, 25, 50);
        scene.add(torchLight);
        lights.push(torchLight);
    }

    function update(delta) {
        for (var i = 0; i < sandstormParticles.length; i++) {
            var particle = sandstormParticles[i];
            particle.mesh.position.y += particle.speed * delta;
            particle.mesh.position.x += particle.drift * delta;

            if (particle.mesh.position.y > particle.originalY + 15) {
                particle.mesh.position.y = particle.originalY - 5;
            }
        }

        for (var i = 0; i < dustDevilSpeeds.length; i++) {
            var devil = dustDevilSpeeds[i];
            var angle = (Date.now() * devil.speed * 0.001) % (Math.PI * 2);
            var nextX = devil.centerX + Math.cos(angle) * devil.radius;
            var nextZ = devil.centerZ + Math.sin(angle) * devil.radius;

            devil.mesh.position.x = nextX;
            devil.mesh.position.z = nextZ;
            devil.mesh.position.y = devil.baseY + Math.sin(Date.now() * 0.002) * 1.5;
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
        dustDevilSpeeds = [];
        sandstormParticles = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset,
        buildDustDevils: buildDustDevils
    };
}());
