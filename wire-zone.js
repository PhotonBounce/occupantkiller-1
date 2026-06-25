window.WireZone = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animatedObjects = [];
    var wireSparkParticles = [];
    var spotlightAngle = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animatedObjects = [];
        wireSparkParticles = [];
        spotlightAngle = 0;

        buildBarriers();
        buildWireNetworks();
        buildBunkers();
        buildPatrolPaths();
        buildHazards();
        buildWireStations();
        buildCommandDugout();
        buildTangleFoot();
        setupLighting();
    }

    function buildBarriers() {
        // Multiple fence lines of electrified wire with cylinder posts
        var fenceLines = [
            { x: -30, z: -40 },
            { x: -15, z: -35 },
            { x: 0, z: -40 },
            { x: 15, z: -35 },
            { x: 30, z: -40 },
            { x: -35, z: 0 },
            { x: -40, z: 15 },
            { x: 35, z: 0 },
            { x: 40, z: 15 }
        ];

        for (var f = 0; f < fenceLines.length; f++) {
            var line = fenceLines[f];
            var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
            var postMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var post = new THREE.Mesh(postGeometry, postMaterial);
            post.position.set(line.x, 1.5, line.z);
            scene.add(post);
            objects.push(post);

            // Electrified wire segments between posts
            var wirePoints = [
                new THREE.Vector3(line.x - 8, 2.5, line.z),
                new THREE.Vector3(line.x + 8, 2.5, line.z)
            ];
            var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
            var wireMaterial = new THREE.LineBasicMaterial({ color: 0xff8800, linewidth: 3 });
            var wireSegment = new THREE.LineSegments(wireGeometry, wireMaterial);
            scene.add(wireSegment);
            objects.push(wireSegment);
            animatedObjects.push({ mesh: wireSegment, type: 'spark' });

            // Additional posts along the line
            for (var p = 1; p < 3; p++) {
                var offsetX = line.x + (p * 8 - 8);
                var fencePost = new THREE.Mesh(postGeometry, postMaterial);
                fencePost.position.set(offsetX, 1.5, line.z);
                scene.add(fencePost);
                objects.push(fencePost);
            }
        }
    }

    function buildWireNetworks() {
        // Razor wire coil obstacles as tight LineSegments zigzag patterns
        var coilPositions = [
            { x: -20, z: -15 },
            { x: 10, z: -25 },
            { x: -25, z: 10 },
            { x: 25, z: 5 },
            { x: 5, z: 20 },
            { x: -10, z: 25 }
        ];

        for (var c = 0; c < coilPositions.length; c++) {
            var pos = coilPositions[c];
            var coilGeometry = new THREE.BufferGeometry();
            var coilPoints = [];

            // Create tight zigzag pattern
            for (var i = 0; i < 8; i++) {
                var angle = (i / 8) * Math.PI * 2;
                var x = pos.x + Math.cos(angle) * 3;
                var z = pos.z + Math.sin(angle) * 3;
                var y = (i % 2) * 0.5 + 0.3;
                coilPoints.push(new THREE.Vector3(x, y, z));
            }
            coilPoints.push(coilPoints[0]); // Close the loop

            coilGeometry.setFromPoints(coilPoints);
            var coilMaterial = new THREE.LineBasicMaterial({ color: 0xaa6600, linewidth: 2 });
            var coilWire = new THREE.LineSegments(coilGeometry, coilMaterial);
            scene.add(coilWire);
            objects.push(coilWire);
        }
    }

    function buildBunkers() {
        // Concrete bunkers between wire corridors
        var bunkerPositions = [
            { x: -20, z: 5 },
            { x: 20, z: -5 },
            { x: 0, z: 20 },
            { x: -35, z: -20 },
            { x: 35, z: 25 }
        ];

        for (var b = 0; b < bunkerPositions.length; b++) {
            var pos = bunkerPositions[b];

            // Main bunker structure
            var bunkerGeometry = new THREE.BoxGeometry(6, 2.5, 4);
            var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
            bunker.position.set(pos.x, 1.25, pos.z);
            scene.add(bunker);
            objects.push(bunker);

            // Bunker roof
            var roofGeometry = new THREE.BoxGeometry(6.4, 0.5, 4.4);
            var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(pos.x, 2.75, pos.z);
            scene.add(roof);
            objects.push(roof);

            // Bunker firing port
            var portGeometry = new THREE.BoxGeometry(2, 1, 0.3);
            var portMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var port = new THREE.Mesh(portGeometry, portMaterial);
            port.position.set(pos.x, 1.5, pos.z - 2.2);
            scene.add(port);
            objects.push(port);
        }
    }

    function buildPatrolPaths() {
        // Patrol towers with spotlights
        var towerPositions = [
            { x: -40, z: -45 },
            { x: 40, z: -45 },
            { x: -45, z: 45 },
            { x: 45, z: 45 }
        ];

        for (var t = 0; t < towerPositions.length; t++) {
            var pos = towerPositions[t];

            // Tower post
            var towerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
            var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.position.set(pos.x, 4, pos.z);
            scene.add(tower);
            objects.push(tower);

            // Tower platform
            var platformGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 16);
            var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(pos.x, 7.5, pos.z);
            scene.add(platform);
            objects.push(platform);

            // Guard rail
            var railGeometry = new THREE.BoxGeometry(3, 0.8, 0.2);
            var railMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            for (var r = 0; r < 4; r++) {
                var rail = new THREE.Mesh(railGeometry, railMaterial);
                var angle = (r / 4) * Math.PI * 2;
                rail.position.set(pos.x + Math.cos(angle) * 1.5, 7.8, pos.z + Math.sin(angle) * 1.5);
                rail.rotation.y = angle;
                scene.add(rail);
                objects.push(rail);
            }

            // Spotlight
            var spotGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.5, 8);
            var spotMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
            var spotlight = new THREE.Mesh(spotGeometry, spotMaterial);
            spotlight.position.set(pos.x, 7.8, pos.z);
            scene.add(spotlight);
            objects.push(spotlight);
            animatedObjects.push({ mesh: spotlight, type: 'spotlight', baseX: pos.x, baseZ: pos.z });
        }
    }

    function buildHazards() {
        // Minefield zones with sphere hazard markers and cone mines
        var minefieldZones = [
            { x: -25, z: -30 },
            { x: 15, z: -20 },
            { x: -10, z: 15 },
            { x: 25, z: 20 }
        ];

        for (var m = 0; m < minefieldZones.length; m++) {
            var zone = minefieldZones[m];

            // Zone marker sphere
            var markerGeometry = new THREE.SphereGeometry(3, 8, 8);
            var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xff4400, emissive: 0xff2200 });
            var marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(zone.x, 0.1, zone.z);
            scene.add(marker);
            objects.push(marker);

            // Individual mines (cones)
            for (var mine = 0; mine < 6; mine++) {
                var mineAngle = (mine / 6) * Math.PI * 2;
                var mineX = zone.x + Math.cos(mineAngle) * 2;
                var mineZ = zone.z + Math.sin(mineAngle) * 2;

                var mineGeometry = new THREE.ConeGeometry(0.3, 0.6, 6);
                var mineMaterial = new THREE.MeshLambertMaterial({ color: 0x442200 });
                var mineObj = new THREE.Mesh(mineGeometry, mineMaterial);
                mineObj.position.set(mineX, 0.3, mineZ);
                scene.add(mineObj);
                objects.push(mineObj);
            }

            // Central mine
            var centerMineGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
            var centerMineMaterial = new THREE.MeshLambertMaterial({ color: 0x330000 });
            var centerMine = new THREE.Mesh(centerMineGeometry, centerMineMaterial);
            centerMine.position.set(zone.x, 0.4, zone.z);
            scene.add(centerMine);
            objects.push(centerMine);
        }
    }

    function buildWireStations() {
        // Warning signposts every few meters
        var signPositions = [
            { x: -40, z: -30 },
            { x: -20, z: -40 },
            { x: 0, z: -35 },
            { x: 20, z: -40 },
            { x: 40, z: -30 },
            { x: -45, z: 0 },
            { x: -45, z: 20 },
            { x: 45, z: 0 },
            { x: 45, z: 20 },
            { x: -30, z: 40 },
            { x: 0, z: 45 },
            { x: 30, z: 40 }
        ];

        for (var s = 0; s < signPositions.length; s++) {
            var signPos = signPositions[s];

            // Signpost
            var postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.5, 8);
            var postMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var signPost = new THREE.Mesh(postGeometry, postMaterial);
            signPost.position.set(signPos.x, 1.25, signPos.z);
            scene.add(signPost);
            objects.push(signPost);

            // Sign box
            var signGeometry = new THREE.BoxGeometry(1.2, 1, 0.2);
            var signMaterial = new THREE.MeshLambertMaterial({ color: 0xff8800 });
            var sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(signPos.x, 2.3, signPos.z);
            scene.add(sign);
            objects.push(sign);
        }

        // Wire cutter station - box structure + cylinder tool racks
        var cutterX = 0;
        var cutterZ = -50;

        var stationGeometry = new THREE.BoxGeometry(5, 2, 4);
        var stationMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var station = new THREE.Mesh(stationGeometry, stationMaterial);
        station.position.set(cutterX, 1, cutterZ);
        scene.add(station);
        objects.push(station);

        // Tool racks
        for (var tr = 0; tr < 3; tr++) {
            var rackGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.8, 8);
            var rackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var rack = new THREE.Mesh(rackGeometry, rackMaterial);
            rack.position.set(cutterX - 1.5 + (tr * 1.5), 1.2, cutterZ);
            scene.add(rack);
            objects.push(rack);
        }

        // Station roof
        var roofGeometry = new THREE.BoxGeometry(5.3, 0.3, 4.3);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var stationRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        stationRoof.position.set(cutterX, 2.3, cutterZ);
        scene.add(stationRoof);
        objects.push(stationRoof);
    }

    function buildCommandDugout() {
        // Sunken command structure
        var dugX = 0;
        var dugZ = 50;

        // Outer pit walls
        var pitWallGeometry = new THREE.BoxGeometry(8, 2, 6);
        var pitMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var pitWall = new THREE.Mesh(pitWallGeometry, pitMaterial);
        pitWall.position.set(dugX, -0.8, dugZ);
        scene.add(pitWall);
        objects.push(pitWall);

        // Inner structure
        var dugGeometry = new THREE.BoxGeometry(7, 1.8, 5);
        var dugMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var dugStructure = new THREE.Mesh(dugGeometry, dugMaterial);
        dugStructure.position.set(dugX, 0.2, dugZ);
        scene.add(dugStructure);
        objects.push(dugStructure);

        // Roof structure
        var roofGeometry = new THREE.BoxGeometry(7.5, 0.5, 5.5);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var dugRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        dugRoof.position.set(dugX, 0.8, dugZ);
        scene.add(dugRoof);
        objects.push(dugRoof);

        // Equipment boxes inside
        for (var e = 0; e < 4; e++) {
            var equipGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
            var equipMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var equip = new THREE.Mesh(equipGeometry, equipMaterial);
            equip.position.set(dugX - 2.5 + (e % 2) * 2.5, 0.5, dugZ - 1.5 + Math.floor(e / 2) * 2);
            scene.add(equip);
            objects.push(equip);
        }

        // Command desk
        var deskGeometry = new THREE.BoxGeometry(3, 0.6, 2);
        var deskMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(dugX, 0.4, dugZ + 1.5);
        scene.add(desk);
        objects.push(desk);
    }

    function buildTangleFoot() {
        // Tangle foot wire - low LineSegments in random crisscross near ground
        var tangleZones = [
            { x: -15, z: -10 },
            { x: 10, z: 10 },
            { x: -30, z: 25 },
            { x: 25, z: -15 }
        ];

        for (var tz = 0; tz < tangleZones.length; tz++) {
            var zone = tangleZones[tz];

            for (var tw = 0; tw < 5; tw++) {
                var startX = zone.x + (Math.random() - 0.5) * 8;
                var startZ = zone.z + (Math.random() - 0.5) * 8;
                var endX = zone.x + (Math.random() - 0.5) * 8;
                var endZ = zone.z + (Math.random() - 0.5) * 8;

                var tangleGeometry = new THREE.BufferGeometry();
                var tanglePoints = [
                    new THREE.Vector3(startX, 0.1, startZ),
                    new THREE.Vector3(endX, 0.15, endZ)
                ];
                tangleGeometry.setFromPoints(tanglePoints);
                var tangleMaterial = new THREE.LineBasicMaterial({ color: 0x886633, linewidth: 2 });
                var tangleSegment = new THREE.LineSegments(tangleGeometry, tangleMaterial);
                scene.add(tangleSegment);
                objects.push(tangleSegment);
            }
        }

        // Safe passage corridors marked with white box markers
        var corridorPositions = [
            { x: 0, z: 0 },
            { x: -30, z: -30 },
            { x: 30, z: 30 },
            { x: -30, z: 30 }
        ];

        for (var cp = 0; cp < corridorPositions.length; cp++) {
            var corridor = corridorPositions[cp];

            for (var cm = 0; cm < 5; cm++) {
                var markerGeometry = new THREE.BoxGeometry(0.8, 0.1, 0.8);
                var markerMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
                var marker = new THREE.Mesh(markerGeometry, markerMaterial);
                marker.position.set(corridor.x + cm * 4, 0.05, corridor.z);
                scene.add(marker);
                objects.push(marker);
            }
        }
    }

    function setupLighting() {
        // Ambient light for general illumination
        var ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sun)
        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(50, 40, 50);
        sunLight.castShadow = true;
        scene.add(sunLight);
        lights.push(sunLight);

        // Spotlight for electrified wire glow effect
        var wireLight = new THREE.PointLight(0xff8800, 0.5);
        wireLight.position.set(-30, 3, -40);
        scene.add(wireLight);
        lights.push(wireLight);

        // Minefield warning light
        var warningLight = new THREE.PointLight(0xff4400, 0.4);
        warningLight.position.set(15, 2, -20);
        scene.add(warningLight);
        lights.push(warningLight);
    }

    function update(delta) {
        spotlightAngle += delta * 0.5;

        // Animate spotlight rotation
        for (var i = 0; i < animatedObjects.length; i++) {
            var anim = animatedObjects[i];
            if (anim.type === 'spotlight') {
                var rotationX = Math.cos(spotlightAngle) * 0.3;
                var rotationZ = Math.sin(spotlightAngle) * 0.3;
                anim.mesh.rotation.x = rotationX;
                anim.mesh.rotation.z = rotationZ;
            }
            else if (anim.type === 'spark') {
                // Simulate wire spark effect
                if (Math.random() > 0.95) {
                    var sparkSphere = new THREE.SphereGeometry(0.1, 4, 4);
                    var sparkMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00, emissive: 0xff6600 });
                    var spark = new THREE.Mesh(sparkSphere, sparkMaterial);

                    var wireGeom = anim.mesh.geometry;
                    if (wireGeom.attributes.position) {
                        var positions = wireGeom.attributes.position.array;
                        var idx = Math.floor(Math.random() * positions.length / 3) * 3;
                        spark.position.set(positions[idx], positions[idx + 1], positions[idx + 2]);
                    }

                    scene.add(spark);
                    wireSparkParticles.push({ mesh: spark, life: 0.2 });
                }
            }
        }

        // Update spark particles
        for (var s = wireSparkParticles.length - 1; s >= 0; s--) {
            var particle = wireSparkParticles[s];
            particle.life -= delta;
            if (particle.life <= 0) {
                scene.remove(particle.mesh);
                wireSparkParticles.splice(s, 1);
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        for (var i = 0; i < wireSparkParticles.length; i++) {
            scene.remove(wireSparkParticles[i].mesh);
        }
        objects = [];
        lights = [];
        animatedObjects = [];
        wireSparkParticles = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
