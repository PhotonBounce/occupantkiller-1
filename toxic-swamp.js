window.ToxicSwamp = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animationData = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animationData = [];

        buildTerrain();
        buildToxicPools();
        buildMutatedTrees();
        buildMilitaryVehicles();
        buildWatchtowers();
        buildRadiationSigns();
        buildResearchStation();
        buildPipelineSystem();
        buildBarrelDumps();
        buildDebris();
        buildFogParticles();
        buildHazmatStations();
        buildCrateStacks();
        buildScaffolds();
        buildChemicalVats();
        buildWarningMarkers();
        setupLighting();
    }

    function buildTerrain() {
        var terrainColor = 0x2d5016;
        var mudColor = 0x3a2a1a;

        var terrainGeom = new THREE.BoxGeometry(400, 1, 400);
        var terrainMat = new THREE.MeshLambertMaterial({ color: terrainColor });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        terrain.receiveShadow = true;
        scene.add(terrain);
        objects.push(terrain);

        for (var i = 0; i < 12; i++) {
            var x = (Math.random() - 0.5) * 350;
            var z = (Math.random() - 0.5) * 350;
            var w = 15 + Math.random() * 20;
            var d = 15 + Math.random() * 20;
            var h = 0.5 + Math.random() * 1.5;

            var mudGeom = new THREE.BoxGeometry(w, h, d);
            var mudMat = new THREE.MeshLambertMaterial({ color: mudColor });
            var mudPatch = new THREE.Mesh(mudGeom, mudMat);
            mudPatch.position.set(x, -0.8, z);
            mudPatch.receiveShadow = true;
            scene.add(mudPatch);
            objects.push(mudPatch);
        }
    }

    function buildToxicPools() {
        var poolPositions = [
            { x: -80, z: -60 },
            { x: 70, z: -90 },
            { x: -120, z: 50 },
            { x: 100, z: 80 },
            { x: 0, z: 0 },
            { x: -150, z: -120 }
        ];

        for (var p = 0; p < poolPositions.length; p++) {
            var pos = poolPositions[p];
            var poolRadius = 25 + Math.random() * 15;
            var sphereCount = 8 + Math.floor(Math.random() * 6);

            for (var i = 0; i < sphereCount; i++) {
                var radius = 3 + Math.random() * 4;
                var offsetX = (Math.random() - 0.5) * poolRadius * 1.5;
                var offsetZ = (Math.random() - 0.5) * poolRadius * 1.5;
                var offsetY = -0.5 + Math.random() * 2;

                var sphereGeom = new THREE.SphereGeometry(radius, 8, 6);
                var glowColor = Math.random() > 0.5 ? 0x00ff00 : 0xffff00;
                var sphereMat = new THREE.MeshLambertMaterial({
                    color: glowColor,
                    emissive: glowColor,
                    emissiveIntensity: 0.6
                });
                var sphere = new THREE.Mesh(sphereGeom, sphereMat);
                sphere.position.set(pos.x + offsetX, offsetY, pos.z + offsetZ);
                scene.add(sphere);
                objects.push(sphere);

                animationData.push({
                    mesh: sphere,
                    type: 'bubble',
                    baseY: sphere.position.y,
                    speed: 0.5 + Math.random() * 1.5,
                    wobble: Math.random() * Math.PI * 2
                });
            }
        }
    }

    function buildMutatedTrees() {
        var treePositions = [
            { x: -150, z: -100 },
            { x: 120, z: -140 },
            { x: -180, z: 80 },
            { x: 160, z: 120 },
            { x: -30, z: -180 },
            { x: 80, z: -160 },
            { x: -200, z: -20 },
            { x: 140, z: 60 }
        ];

        for (var t = 0; t < treePositions.length; t++) {
            var tpos = treePositions[t];

            var trunkGeom = new THREE.CylinderGeometry(2, 3, 15, 6);
            var trunkMat = new THREE.MeshLambertMaterial({ color: 0x554411 });
            var trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.set(tpos.x, 5, tpos.z);
            trunk.castShadow = true;
            scene.add(trunk);
            objects.push(trunk);

            var foliageCount = 4 + Math.floor(Math.random() * 3);
            for (var f = 0; f < foliageCount; f++) {
                var foliageY = 8 + f * 3 + (Math.random() - 0.5) * 4;
                var foliageRadius = 6 - f * 0.8 + (Math.random() - 0.5) * 2;

                var foliageGeom = new THREE.SphereGeometry(foliageRadius, 6, 5);
                var foliageMat = new THREE.MeshLambertMaterial({ color: 0x3d7a1a });
                var foliage = new THREE.Mesh(foliageGeom, foliageMat);
                foliage.position.set(tpos.x + (Math.random() - 0.5) * 3, foliageY, tpos.z + (Math.random() - 0.5) * 3);
                foliage.castShadow = true;
                scene.add(foliage);
                objects.push(foliage);
            }

            var coneGeom = new THREE.ConeGeometry(5, 8, 6);
            var coneMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
            var cone = new THREE.Mesh(coneGeom, coneMat);
            cone.position.set(tpos.x, 16, tpos.z);
            cone.castShadow = true;
            scene.add(cone);
            objects.push(cone);
        }
    }

    function buildMilitaryVehicles() {
        var vehiclePositions = [
            { x: -100, z: 60 },
            { x: 130, z: -110 }
        ];

        for (var v = 0; v < vehiclePositions.length; v++) {
            var vpos = vehiclePositions[v];

            var chassisGeom = new THREE.BoxGeometry(8, 3, 16);
            var chassisMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
            var chassis = new THREE.Mesh(chassisGeom, chassisMat);
            chassis.position.set(vpos.x, 1, vpos.z);
            chassis.castShadow = true;
            scene.add(chassis);
            objects.push(chassis);

            var cabinGeom = new THREE.BoxGeometry(6, 4, 5);
            var cabinMat = new THREE.MeshLambertMaterial({ color: 0x704214 });
            var cabin = new THREE.Mesh(cabinGeom, cabinMat);
            cabin.position.set(vpos.x - 2, 4, vpos.z + 3);
            cabin.castShadow = true;
            scene.add(cabin);
            objects.push(cabin);

            for (var w = 0; w < 4; w++) {
                var wheelX = w < 2 ? -3 : 3;
                var wheelZ = (w % 2) * 10 - 5;
                var wheelGeom = new THREE.CylinderGeometry(1.5, 1.5, 1.5, 8);
                var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
                var wheel = new THREE.Mesh(wheelGeom, wheelMat);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(vpos.x + wheelX, 1.5, vpos.z + wheelZ);
                wheel.castShadow = true;
                scene.add(wheel);
                objects.push(wheel);
            }

            var turretGeom = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
            var turretMat = new THREE.MeshLambertMaterial({ color: 0x704214 });
            var turret = new THREE.Mesh(turretGeom, turretMat);
            turret.position.set(vpos.x, 5, vpos.z - 1);
            turret.castShadow = true;
            scene.add(turret);
            objects.push(turret);
        }
    }

    function buildWatchtowers() {
        var towerPositions = [
            { x: -170, z: -150 },
            { x: 180, z: 170 }
        ];

        for (var t = 0; t < towerPositions.length; t++) {
            var tpos = towerPositions[t];

            for (var s = 0; s < 4; s++) {
                var stiltX = (s % 2) * 4 - 2;
                var stiltZ = Math.floor(s / 2) * 4 - 2;
                var stiltGeom = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
                var stiltMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
                var stilt = new THREE.Mesh(stiltGeom, stiltMat);
                stilt.position.set(tpos.x + stiltX, 4, tpos.z + stiltZ);
                scene.add(stilt);
                objects.push(stilt);
            }

            var platformGeom = new THREE.BoxGeometry(10, 1, 10);
            var platformMat = new THREE.MeshLambertMaterial({ color: 0xa0522d });
            var platform = new THREE.Mesh(platformGeom, platformMat);
            platform.position.set(tpos.x, 10.5, tpos.z);
            platform.castShadow = true;
            scene.add(platform);
            objects.push(platform);

            var watchboxGeom = new THREE.BoxGeometry(8, 5, 8);
            var watchboxMat = new THREE.MeshLambertMaterial({ color: 0x705020 });
            var watchbox = new THREE.Mesh(watchboxGeom, watchboxMat);
            watchbox.position.set(tpos.x, 15, tpos.z);
            watchbox.castShadow = true;
            scene.add(watchbox);
            objects.push(watchbox);

            var roofGeom = new THREE.ConeGeometry(6, 3, 8);
            var roofMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var roof = new THREE.Mesh(roofGeom, roofMat);
            roof.position.set(tpos.x, 18.5, tpos.z);
            scene.add(roof);
            objects.push(roof);
        }
    }

    function buildRadiationSigns() {
        var signPositions = [
            { x: -60, z: -100 },
            { x: 100, z: 50 },
            { x: -140, z: 120 }
        ];

        for (var s = 0; s < signPositions.length; s++) {
            var spos = signPositions[s];

            var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
            var poleMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
            var pole = new THREE.Mesh(poleGeom, poleMat);
            pole.position.set(spos.x, 3, spos.z);
            pole.castShadow = true;
            scene.add(pole);
            objects.push(pole);

            var signGeom = new THREE.BoxGeometry(4, 4, 0.2);
            var signMat = new THREE.MeshLambertMaterial({
                color: 0xffff00,
                emissive: 0xffff00,
                emissiveIntensity: 0.4
            });
            var sign = new THREE.Mesh(signGeom, signMat);
            sign.position.set(spos.x, 7, spos.z);
            sign.castShadow = true;
            scene.add(sign);
            objects.push(sign);

            var radiusGeom = new THREE.SphereGeometry(1.5, 6, 5);
            var radiusMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
            var radius = new THREE.Mesh(radiusGeom, radiusMat);
            radius.position.set(spos.x - 1.5, 7, spos.z);
            scene.add(radius);
            objects.push(radius);
        }
    }

    function buildResearchStation() {
        var mainBuildingGeom = new THREE.BoxGeometry(30, 12, 25);
        var buildingMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var mainBuilding = new THREE.Mesh(mainBuildingGeom, buildingMat);
        mainBuilding.position.set(-40, 5, 100);
        mainBuilding.castShadow = true;
        scene.add(mainBuilding);
        objects.push(mainBuilding);

        var wingGeom = new THREE.BoxGeometry(15, 10, 20);
        var wingMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var wing1 = new THREE.Mesh(wingGeom, wingMat);
        wing1.position.set(-60, 4, 100);
        wing1.castShadow = true;
        scene.add(wing1);
        objects.push(wing1);

        var wing2 = new THREE.Mesh(wingGeom, wingMat);
        wing2.position.set(-20, 4, 100);
        wing2.castShadow = true;
        scene.add(wing2);
        objects.push(wing2);

        var domeGeom = new THREE.SphereGeometry(8, 8, 6);
        var domeMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var dome = new THREE.Mesh(domeGeom, domeMat);
        dome.position.set(-40, 15, 85);
        dome.castShadow = true;
        scene.add(dome);
        objects.push(dome);

        for (var w = 0; w < 6; w++) {
            var windowX = -50 + w * 15;
            var windowGeom = new THREE.BoxGeometry(2, 2, 0.5);
            var windowMat = new THREE.MeshLambertMaterial({
                color: 0x00ff00,
                emissive: 0x00ff00,
                emissiveIntensity: 0.5
            });
            var window = new THREE.Mesh(windowGeom, windowMat);
            window.position.set(windowX, 8, 82.5);
            scene.add(window);
            objects.push(window);
        }
    }

    function buildPipelineSystem() {
        var pipeSegments = [
            { start: { x: -40, y: 3, z: 80 }, end: { x: -40, y: 3, z: 40 }, radius: 0.8 },
            { start: { x: -40, y: 3, z: 40 }, end: { x: 20, y: 3, z: 40 }, radius: 0.8 },
            { start: { x: 20, y: 3, z: 40 }, end: { x: 20, y: 3, z: -40 }, radius: 0.8 },
            { start: { x: 20, y: 3, z: -40 }, end: { x: -60, y: 3, z: -40 }, radius: 0.8 },
            { start: { x: -60, y: 3, z: -40 }, end: { x: -60, y: 3, z: -100 }, radius: 0.8 }
        ];

        for (var p = 0; p < pipeSegments.length; p++) {
            var seg = pipeSegments[p];
            var dx = seg.end.x - seg.start.x;
            var dy = seg.end.y - seg.start.y;
            var dz = seg.end.z - seg.start.z;
            var length = Math.sqrt(dx * dx + dy * dy + dz * dz);

            var pipeGeom = new THREE.CylinderGeometry(seg.radius, seg.radius, length, 8);
            var pipeMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
            var pipe = new THREE.Mesh(pipeGeom, pipeMat);

            pipe.position.set(
                (seg.start.x + seg.end.x) / 2,
                (seg.start.y + seg.end.y) / 2,
                (seg.start.z + seg.end.z) / 2
            );

            var angle = Math.atan2(dz, dx);
            var vertAngle = Math.asin(dy / length);
            pipe.rotation.z = vertAngle;
            pipe.rotation.y = angle + Math.PI / 2;

            pipe.castShadow = true;
            scene.add(pipe);
            objects.push(pipe);

            var junctionGeom = new THREE.SphereGeometry(1.2, 6, 5);
            var junctionMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
            var junction = new THREE.Mesh(junctionGeom, junctionMat);
            junction.position.set(seg.end.x, seg.end.y, seg.end.z);
            scene.add(junction);
            objects.push(junction);
        }
    }

    function buildBarrelDumps() {
        var dumpPositions = [
            { x: 60, z: -140 },
            { x: -200, z: 60 },
            { x: 140, z: 100 }
        ];

        for (var d = 0; d < dumpPositions.length; d++) {
            var dpos = dumpPositions[d];
            var barrelCount = 8 + Math.floor(Math.random() * 6);

            for (var b = 0; b < barrelCount; b++) {
                var offsetX = (b % 4) * 2.5 - 3.75;
                var offsetZ = Math.floor(b / 4) * 2.5 - 1.25;
                var offsetY = (b % 3) * 2 + 0.5;

                var barrelGeom = new THREE.CylinderGeometry(1, 1, 2.5, 8);
                var barrelMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
                var barrel = new THREE.Mesh(barrelGeom, barrelMat);
                barrel.position.set(dpos.x + offsetX, offsetY, dpos.z + offsetZ);
                barrel.castShadow = true;
                scene.add(barrel);
                objects.push(barrel);

                var lidGeom = new THREE.CylinderGeometry(1.1, 1.1, 0.3, 8);
                var lidMat = new THREE.MeshLambertMaterial({
                    color: 0x00ff00,
                    emissive: 0x00ff00,
                    emissiveIntensity: 0.6
                });
                var lid = new THREE.Mesh(lidGeom, lidMat);
                lid.position.set(dpos.x + offsetX, offsetY + 1.5, dpos.z + offsetZ);
                scene.add(lid);
                objects.push(lid);
            }
        }
    }

    function buildDebris() {
        var debrisTypes = [
            { name: 'metal', color: 0x808080 },
            { name: 'concrete', color: 0x696969 },
            { name: 'wood', color: 0x654321 }
        ];

        for (var d = 0; d < 30; d++) {
            var typeIdx = Math.floor(Math.random() * debrisTypes.length);
            var debrisType = debrisTypes[typeIdx];

            var x = (Math.random() - 0.5) * 300;
            var z = (Math.random() - 0.5) * 300;

            var shape = Math.floor(Math.random() * 3);
            var debris;

            if (shape === 0) {
                var debrisGeom = new THREE.BoxGeometry(2 + Math.random() * 3, 1 + Math.random() * 2, 2 + Math.random() * 3);
                var debrisMat = new THREE.MeshLambertMaterial({ color: debrisType.color });
                debris = new THREE.Mesh(debrisGeom, debrisMat);
            } else if (shape === 1) {
                var debrisGeom = new THREE.SphereGeometry(1 + Math.random() * 1.5, 6, 5);
                var debrisMat = new THREE.MeshLambertMaterial({ color: debrisType.color });
                debris = new THREE.Mesh(debrisGeom, debrisMat);
            } else {
                var debrisGeom = new THREE.CylinderGeometry(0.8 + Math.random(), 0.8 + Math.random(), 2 + Math.random() * 2, 6);
                var debrisMat = new THREE.MeshLambertMaterial({ color: debrisType.color });
                debris = new THREE.Mesh(debrisGeom, debrisMat);
            }

            debris.position.set(x, 1, z);
            debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            debris.castShadow = true;
            scene.add(debris);
            objects.push(debris);
        }
    }

    function buildFogParticles() {
        var fogZones = [
            { x: 0, z: 0, radius: 50 },
            { x: -100, z: 80, radius: 40 },
            { x: 120, z: -100, radius: 45 }
        ];

        for (var f = 0; f < fogZones.length; f++) {
            var fzone = fogZones[f];
            var particleCount = 45 + Math.floor(Math.random() * 25);

            for (var p = 0; p < particleCount; p++) {
                var angle = Math.random() * Math.PI * 2;
                var dist = Math.random() * fzone.radius;
                var px = fzone.x + Math.cos(angle) * dist;
                var pz = fzone.z + Math.sin(angle) * dist;
                var py = 3 + Math.random() * 8;

                var fogGeom = new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 4, 3);
                var fogMat = new THREE.MeshLambertMaterial({
                    color: 0x7fff00,
                    transparent: true,
                    opacity: 0.3 + Math.random() * 0.2
                });
                var fogParticle = new THREE.Mesh(fogGeom, fogMat);
                fogParticle.position.set(px, py, pz);
                scene.add(fogParticle);
                objects.push(fogParticle);

                animationData.push({
                    mesh: fogParticle,
                    type: 'fog',
                    baseX: px,
                    baseY: py,
                    baseZ: pz,
                    driftX: (Math.random() - 0.5) * 0.3,
                    driftZ: (Math.random() - 0.5) * 0.3,
                    wobblePhase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    function buildHazmatStations() {
        var stationPositions = [
            { x: 50, z: 60 },
            { x: -150, z: -100 },
            { x: 100, z: -150 }
        ];

        for (var s = 0; s < stationPositions.length; s++) {
            var spos = stationPositions[s];

            var boxGeom = new THREE.BoxGeometry(8, 6, 8);
            var boxMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
            var box = new THREE.Mesh(boxGeom, boxMat);
            box.position.set(spos.x, 2.5, spos.z);
            scene.add(box);
            objects.push(box);

            for (var w = 0; w < 3; w++) {
                var winGeom = new THREE.BoxGeometry(1.5, 1.5, 0.3);
                var winMat = new THREE.MeshLambertMaterial({
                    color: 0xff6600,
                    emissive: 0xff6600,
                    emissiveIntensity: 0.3
                });
                var win = new THREE.Mesh(winGeom, winMat);
                win.position.set(spos.x - 3 + w * 3, 4, spos.z + 4.1);
                scene.add(win);
                objects.push(win);
            }
        }
    }

    function buildCrateStacks() {
        var cratePositions = [
            { x: 30, z: -80 },
            { x: -100, z: 0 },
            { x: 120, z: 40 }
        ];

        for (var c = 0; c < cratePositions.length; c++) {
            var cpos = cratePositions[c];

            for (var i = 0; i < 4; i++) {
                for (var j = 0; j < 3; j++) {
                    var crateGeom = new THREE.BoxGeometry(3, 3, 3);
                    var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
                    var crate = new THREE.Mesh(crateGeom, crateMat);
                    crate.position.set(cpos.x + i * 3.5, 1.5 + j * 3.5, cpos.z);
                    scene.add(crate);
                    objects.push(crate);
                }
            }
        }
    }

    function buildScaffolds() {
        var scaffoldPositions = [
            { x: -180, z: 100 },
            { x: 170, z: -140 }
        ];

        for (var s = 0; s < scaffoldPositions.length; s++) {
            var spos = scaffoldPositions[s];

            for (var h = 0; h < 3; h++) {
                for (var w = 0; w < 2; w++) {
                    var beamGeom = new THREE.BoxGeometry(10, 0.5, 0.5);
                    var beamMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
                    var beam = new THREE.Mesh(beamGeom, beamMat);
                    beam.position.set(spos.x, 3 + h * 3, spos.z + w * 8 - 4);
                    scene.add(beam);
                    objects.push(beam);
                }
            }

            for (var v = 0; v < 6; v++) {
                var vertGeom = new THREE.CylinderGeometry(0.3, 0.3, 10, 6);
                var vertMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
                var vert = new THREE.Mesh(vertGeom, vertMat);
                vert.position.set(spos.x - 5 + v * 2, 5, spos.z);
                scene.add(vert);
                objects.push(vert);
            }
        }
    }

    function buildChemicalVats() {
        var vatPositions = [
            { x: 60, z: 100 },
            { x: -140, z: -60 }
        ];

        for (var v = 0; v < vatPositions.length; v++) {
            var vpos = vatPositions[v];

            var vatGeom = new THREE.CylinderGeometry(5, 6, 8, 8);
            var vatMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var vat = new THREE.Mesh(vatGeom, vatMat);
            vat.position.set(vpos.x, 3, vpos.z);
            scene.add(vat);
            objects.push(vat);

            var liquidGeom = new THREE.CylinderGeometry(4.8, 5.8, 7.5, 8);
            var liquidMat = new THREE.MeshLambertMaterial({
                color: 0x00aa00,
                emissive: 0x00aa00,
                emissiveIntensity: 0.5
            });
            var liquid = new THREE.Mesh(liquidGeom, liquidMat);
            liquid.position.set(vpos.x, 3, vpos.z);
            scene.add(liquid);
            objects.push(liquid);

            var rimGeom = new THREE.CylinderGeometry(6.2, 6, 0.5, 8);
            var rimMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var rim = new THREE.Mesh(rimGeom, rimMat);
            rim.position.set(vpos.x, 7.5, vpos.z);
            scene.add(rim);
            objects.push(rim);
        }
    }

    function buildWarningMarkers() {
        var markerPositions = [
            { x: 40, z: -100 },
            { x: -110, z: 70 },
            { x: 150, z: 10 }
        ];

        for (var m = 0; m < markerPositions.length; m++) {
            var mpos = markerPositions[m];

            for (var i = 0; i < 4; i++) {
                var markerGeom = new THREE.BoxGeometry(0.5, 2, 0.5);
                var markerMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
                var marker = new THREE.Mesh(markerGeom, markerMat);
                marker.position.set(mpos.x + (i % 2) * 1.5 - 0.75, 1, mpos.z + Math.floor(i / 2) * 1.5 - 0.75);
                scene.add(marker);
                objects.push(marker);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x4a7c59, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffff99, 0.7);
        directionalLight.position.set(100, 80, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -200;
        directionalLight.shadow.camera.right = 200;
        directionalLight.shadow.camera.top = 200;
        directionalLight.shadow.camera.bottom = -200;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var toxicLight1 = new THREE.PointLight(0x00ff00, 0.8, 100);
        toxicLight1.position.set(-80, 2, -60);
        scene.add(toxicLight1);
        lights.push(toxicLight1);

        var toxicLight2 = new THREE.PointLight(0xffff00, 0.6, 80);
        toxicLight2.position.set(70, 2, -90);
        scene.add(toxicLight2);
        lights.push(toxicLight2);

        var toxicLight3 = new THREE.PointLight(0x00ff00, 0.7, 90);
        toxicLight3.position.set(-120, 2, 50);
        scene.add(toxicLight3);
        lights.push(toxicLight3);

        var stationLight = new THREE.PointLight(0x00ff00, 0.5, 60);
        stationLight.position.set(-40, 10, 100);
        scene.add(stationLight);
        lights.push(stationLight);
    }

    function update(delta) {
        for (var i = 0; i < animationData.length; i++) {
            var data = animationData[i];

            if (data.type === 'bubble') {
                data.mesh.position.y = data.baseY + Math.sin(data.wobble) * 0.5 + delta * data.speed;
                data.wobble += delta * 2;

                if (data.mesh.position.y > data.baseY + 8) {
                    data.mesh.position.y = data.baseY - 3;
                }
            } else if (data.type === 'fog') {
                data.mesh.position.x = data.baseX + Math.sin(data.wobblePhase) * 3 + data.driftX * delta * 10;
                data.mesh.position.z = data.baseZ + Math.cos(data.wobblePhase) * 3 + data.driftZ * delta * 10;
                data.wobblePhase += delta * 0.5;
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
        objects = [];
        lights = [];
        animationData = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
