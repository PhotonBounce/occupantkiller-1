window.NuclearConvoy = (function() {
    'use strict';

    var sceneObjects = [];
    var state = {
        warheadsSecure: 3,
        vehiclesLost: 0,
        ambushNeutralized: false,
        convoyPosition: 0,
        helicopterAngle: 0,
        spotlightAngle: 0,
        rockRollProgress: 0,
        enemyApproachDistance: 100,
        powerLineSwayAmount: 0,
        lastNKey: null,
        hudVisible: true,
        barricadeActive: false
    };

    var materials = {
        concrete: new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8, metalness: 0.1 }),
        rock: new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.9, metalness: 0 }),
        steel: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.8 }),
        emergency: new THREE.MeshStandardMaterial({ color: 0xff6b00, emissive: 0xff6b00, emissiveIntensity: 0.8 }),
        muzzle: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.9 }),
        camouflage: new THREE.MeshStandardMaterial({ color: 0x556633, roughness: 0.7, metalness: 0.1 }),
        warhead: new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.6 })
    };

    function createHighway(scene) {
        var geometry = new THREE.BoxGeometry(20, 0.5, 200);
        var mesh = new THREE.Mesh(geometry, materials.concrete);
        mesh.position.y = 0;
        mesh.position.z = 0;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add(mesh);
        sceneObjects.push(mesh);
        return mesh;
    }

    function createCliffFace(scene, side) {
        var geometry = new THREE.BoxGeometry(8, 60, 200);
        var mesh = new THREE.Mesh(geometry, materials.rock);
        mesh.position.x = side * 14;
        mesh.position.y = 20;
        mesh.position.z = 0;
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add(mesh);
        sceneObjects.push(mesh);
        return mesh;
    }

    function createHumvee(scene, xPos, zPos) {
        var group = new THREE.Group();
        group.position.set(xPos, 0, zPos);

        var body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 4.5), materials.steel);
        body.position.y = 1.2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        for (var i = 0; i < 4; i++) {
            var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16), materials.steel);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            var xOffset = (i < 2 ? -1 : 1) * 1.2;
            var zOffset = (i % 2 === 0 ? -1 : 1) * 1.5;
            wheel.position.set(xOffset, 0.8, zOffset);
            group.add(wheel);
        }

        var turret = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.8, 8), materials.steel);
        turret.position.y = 2.5;
        turret.castShadow = true;
        group.add(turret);

        var gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8), materials.muzzle);
        gunBarrel.rotation.z = Math.PI / 6;
        gunBarrel.position.set(0.5, 3.2, 0);
        gunBarrel.castShadow = true;
        group.add(gunBarrel);

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createNuclearTruck(scene, xPos, zPos) {
        var group = new THREE.Group();
        group.position.set(xPos, 0, zPos);

        var cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 3), materials.steel);
        cab.position.set(-3, 1.3, 0);
        cab.castShadow = true;
        cab.receiveShadow = true;
        group.add(cab);

        var truckBed = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 8), materials.steel);
        truckBed.position.set(1.5, 1.5, 0);
        truckBed.castShadow = true;
        truckBed.receiveShadow = true;
        group.add(truckBed);

        var warheadContainer = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 6), materials.warhead);
        warheadContainer.position.set(1.5, 2.6, 0);
        warheadContainer.castShadow = true;
        warheadContainer.receiveShadow = true;
        group.add(warheadContainer);

        for (var i = 0; i < 4; i++) {
            var wheel = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.6, 16), materials.steel);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            var xOffset = (i < 2 ? -2.5 : 2.5);
            var zOffset = (i % 2 === 0 ? -2.5 : 2.5);
            wheel.position.set(xOffset, 1, zOffset);
            group.add(wheel);
        }

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createRearAPC(scene, xPos, zPos) {
        var group = new THREE.Group();
        group.position.set(xPos, 0, zPos);

        var body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.3, 5.5), materials.steel);
        body.position.y = 1.2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        for (var i = 0; i < 4; i++) {
            var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 16), materials.steel);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            var xOffset = (i < 2 ? -1.2 : 1.2);
            var zOffset = (i % 2 === 0 ? -1.5 : 1.5);
            wheel.position.set(xOffset, 0.9, zOffset);
            group.add(wheel);
        }

        var turret = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 8), materials.steel);
        turret.position.y = 2.4;
        turret.castShadow = true;
        group.add(turret);

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createRoadblock(scene, xPos, zPos) {
        var group = new THREE.Group();
        group.position.set(xPos, 0, zPos);

        for (var i = 0; i < 5; i++) {
            var barrier = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 3), materials.concrete);
            barrier.position.x = (i - 2) * 2;
            barrier.position.y = 0.75;
            barrier.castShadow = true;
            barrier.receiveShadow = true;
            group.add(barrier);
        }

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createDisabledVehicle(scene, xPos, zPos) {
        var group = new THREE.Group();
        group.position.set(xPos, 0, zPos);
        group.rotation.z = Math.PI / 12;

        var body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 4.5), materials.emergency);
        body.position.y = 1.2;
        body.castShadow = true;
        group.add(body);

        for (var i = 0; i < 4; i++) {
            var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16), materials.steel);
            wheel.rotation.z = Math.PI / 2;
            var xOffset = (i < 2 ? -1 : 1) * 1.2;
            var zOffset = (i % 2 === 0 ? -1 : 1) * 1.5;
            wheel.position.set(xOffset, 0.8, zOffset);
            group.add(wheel);
        }

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createHelicopter(scene) {
        var group = new THREE.Group();
        group.position.set(5, 25, 0);

        var fuselage = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 4.5), materials.steel);
        fuselage.castShadow = true;
        group.add(fuselage);

        var tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 3), materials.steel);
        tail.position.set(0, 0, 2);
        tail.castShadow = true;
        group.add(tail);

        var rotorMast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1, 8), materials.steel);
        rotorMast.position.y = 1;
        group.add(rotorMast);

        var rotor = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 8), materials.steel);
        rotor.position.y = 1.5;
        rotor.name = 'helicopterRotor';
        rotor.castShadow = true;
        group.add(rotor);

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createPowerLinePoles(scene) {
        for (var i = 0; i < 10; i++) {
            var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 12, 8), materials.steel);
            pole.position.set(-9, 6, -100 + i * 25);
            pole.castShadow = true;
            scene.add(pole);
            sceneObjects.push(pole);

            if (i < 9) {
                var points = [
                    new THREE.Vector3(-9, 11, -100 + i * 25),
                    new THREE.Vector3(-9, 11, -75 + i * 25)
                ];
                var wireGeometry = new THREE.BufferGeometry().setFromPoints(points);
                var wireLines = new THREE.LineSegments(wireGeometry, new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 }));
                scene.add(wireLines);
                sceneObjects.push(wireLines);
            }
        }
    }

    function createGuardrail(scene) {
        var points = [];
        for (var i = 0; i < 20; i++) {
            points.push(new THREE.Vector3(-12, 2, -100 + i * 10));
            points.push(new THREE.Vector3(-12, 3, -100 + i * 10));
        }
        var geometry = new THREE.BufferGeometry().setFromPoints(points);
        var rails = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 }));
        scene.add(rails);
        sceneObjects.push(rails);
    }

    function createFallenRocks(scene) {
        var rockGroup = new THREE.Group();
        rockGroup.position.set(0, 0, -30);

        for (var i = 0; i < 8; i++) {
            var rockSize = 0.5 + Math.random() * 0.5;
            var rock = new THREE.Mesh(new THREE.SphereGeometry(rockSize, 8, 8), materials.rock);
            rock.position.set((Math.random() - 0.5) * 8, 0.5 + Math.random() * 2, (Math.random() - 0.5) * 4);
            rock.castShadow = true;
            rock.receiveShadow = true;
            rockGroup.add(rock);
        }

        scene.add(rockGroup);
        sceneObjects.push(rockGroup);
        return rockGroup;
    }

    function createEnemyTechnical(scene) {
        var group = new THREE.Group();
        group.position.set(6, 0, -80);

        var cab = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 3), materials.camouflage);
        cab.position.set(0, 1, 0);
        cab.castShadow = true;
        cab.receiveShadow = true;
        group.add(cab);

        var bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.5, 4), materials.camouflage);
        bed.position.set(0, 1.2, 2.5);
        bed.castShadow = true;
        bed.receiveShadow = true;
        group.add(bed);

        var gunMount = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8), materials.steel);
        gunMount.position.set(0, 2.5, 2);
        gunMount.castShadow = true;
        group.add(gunMount);

        var gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.5, 8), materials.muzzle);
        gunBarrel.rotation.z = Math.PI / 8;
        gunBarrel.position.set(0.5, 3.5, 1.5);
        gunBarrel.castShadow = true;
        group.add(gunBarrel);

        for (var i = 0; i < 4; i++) {
            var wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.4, 16), materials.steel);
            wheel.rotation.z = Math.PI / 2;
            var xOffset = (i < 2 ? -1 : 1) * 1.1;
            var zOffset = (i % 2 === 0 ? -1 : 1) * 1.3;
            wheel.position.set(xOffset, 0.75, zOffset);
            group.add(wheel);
        }

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createSniperHide(scene) {
        var group = new THREE.Group();
        group.position.set(-13, 15, 50);

        var shelter = new THREE.Mesh(new THREE.BoxGeometry(3, 2.5, 3), materials.camouflage);
        shelter.castShadow = true;
        group.add(shelter);

        var roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.5, 4), materials.camouflage);
        roof.position.y = 2;
        roof.castShadow = true;
        group.add(roof);

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createRadioTower(scene) {
        var group = new THREE.Group();
        group.position.set(10, 0, 60);

        var main = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 20, 8), materials.steel);
        main.position.y = 10;
        main.castShadow = true;
        group.add(main);

        for (var i = 0; i < 4; i++) {
            var antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6, 6), materials.steel);
            antenna.rotation.z = (i * Math.PI / 2) + Math.PI / 4;
            antenna.position.y = 15;
            antenna.castShadow = true;
            group.add(antenna);

            var antennaMesh = new THREE.LineSegments(
                new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 15, 0),
                    new THREE.Vector3(Math.cos(i * Math.PI / 2) * 4, 18, Math.sin(i * Math.PI / 2) * 4)
                ]),
                new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 1 })
            );
            group.add(antennaMesh);
        }

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createTunnelEntrance(scene) {
        var group = new THREE.Group();
        group.position.set(0, 3, -120);

        var arch1 = new THREE.Mesh(new THREE.BoxGeometry(12, 1.5, 1.5), materials.concrete);
        arch1.position.y = 4;
        arch1.castShadow = true;
        group.add(arch1);

        var arch2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5, 1.5), materials.concrete);
        arch2.position.set(-5.5, 1.5, 0);
        arch2.castShadow = true;
        group.add(arch2);

        var arch3 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 5, 1.5), materials.concrete);
        arch3.position.set(5.5, 1.5, 0);
        arch3.castShadow = true;
        group.add(arch3);

        scene.add(group);
        sceneObjects.push(group);
        return group;
    }

    function createAmbushSquad(scene) {
        var squad = new THREE.Group();
        squad.position.set(-6, 25, 40);

        for (var i = 0; i < 4; i++) {
            var soldier = new THREE.Group();
            soldier.position.x = (i - 1.5) * 2;

            var torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.4), materials.camouflage);
            torso.position.y = 0.8;
            soldier.add(torso);

            var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), materials.camouflage);
            head.position.y = 2;
            soldier.add(head);

            var gun = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), materials.steel);
            gun.rotation.z = Math.PI / 4;
            gun.position.set(0.3, 1.5, 0);
            soldier.add(gun);

            squad.add(soldier);
        }

        scene.add(squad);
        sceneObjects.push(squad);
        return squad;
    }

    function createHUD(scene) {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 512, 256);

        ctx.fillStyle = '#ff6b00';
        ctx.font = 'bold 32px monospace';
        ctx.fillText('WARHEADS SECURE: 3/3', 20, 50);

        ctx.fillStyle = '#cccccc';
        ctx.font = '24px monospace';
        ctx.fillText('CONVOY VEHICLES LOST: 0', 20, 100);
        ctx.fillText('AMBUSH NEUTRALIZED: NO', 20, 140);

        ctx.fillStyle = '#888888';
        ctx.font = '16px monospace';
        ctx.fillText('Press N+C to toggle display', 20, 200);

        var texture = new THREE.CanvasTexture(canvas);
        var material = new THREE.MeshBasicMaterial({ map: texture });
        var geometry = new THREE.PlaneGeometry(8, 4);
        var hudMesh = new THREE.Mesh(geometry, material);
        hudMesh.position.set(0, 2, -8);
        hudMesh.name = 'hudDisplay';
        scene.add(hudMesh);
        sceneObjects.push(hudMesh);

        return hudMesh;
    }

    function init(scene, camera) {
        if (!scene || !camera) {
            console.error('NuclearConvoy.init requires scene and camera');
            return;
        }

        scene.background = new THREE.Color(0x666666);
        scene.fog = new THREE.Fog(0x888888, 150, 300);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        sceneObjects.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 40, -50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -60;
        directionalLight.shadow.camera.right = 60;
        directionalLight.shadow.camera.top = 60;
        directionalLight.shadow.camera.bottom = -60;
        scene.add(directionalLight);
        sceneObjects.push(directionalLight);

        createHighway(scene);
        createCliffFace(scene, -1);
        createCliffFace(scene, 1);

        var humvee = createHumvee(scene, -4, 0);
        humvee.name = 'humvee';

        var nuclearTruck = createNuclearTruck(scene, 0, 8);
        nuclearTruck.name = 'nuclearTruck';

        var apc = createRearAPC(scene, 4, 16);
        apc.name = 'rearAPC';

        var roadblock = createRoadblock(scene, 0, -30);
        roadblock.name = 'roadblock';

        var disabled = createDisabledVehicle(scene, -5, -50);
        disabled.name = 'disabledVehicle';

        var heli = createHelicopter(scene);
        heli.name = 'helicopter';

        createPowerLinePoles(scene);
        createGuardrail(scene);

        var rocks = createFallenRocks(scene);
        rocks.name = 'fallenRocks';

        var technical = createEnemyTechnical(scene);
        technical.name = 'enemyTechnical';

        createSniperHide(scene);
        createRadioTower(scene);
        createTunnelEntrance(scene);
        createAmbushSquad(scene);

        createHUD(scene);

        document.addEventListener('keydown', handleKeyDown);

        return {
            warheadsSecure: state.warheadsSecure,
            vehiclesLost: state.vehiclesLost,
            ambushNeutralized: state.ambushNeutralized
        };
    }

    function handleKeyDown(event) {
        if (event.key === 'n' || event.key === 'N') {
            var now = Date.now();
            if (state.lastNKey && now - state.lastNKey < 400) {
                if (event.key === 'n' || event.key === 'N') {
                    state.hudVisible = !state.hudVisible;
                    var hudDisplay = findObjectByName('hudDisplay');
                    if (hudDisplay) {
                        hudDisplay.visible = state.hudVisible;
                    }
                    state.lastNKey = null;
                }
            } else {
                state.lastNKey = now;
                setTimeout(function() {
                    state.lastNKey = null;
                }, 400);
            }
        }
    }

    function findObjectByName(name) {
        for (var i = 0; i < sceneObjects.length; i++) {
            if (sceneObjects[i].name === name) {
                return sceneObjects[i];
            }
        }
        return null;
    }

    function update(delta) {
        if (delta === undefined || delta === null) {
            delta = 0.016;
        }

        state.convoyPosition += delta * 3;

        var humvee = findObjectByName('humvee');
        if (humvee) {
            humvee.position.z = state.convoyPosition;
        }

        var nuclearTruck = findObjectByName('nuclearTruck');
        if (nuclearTruck) {
            nuclearTruck.position.z = state.convoyPosition + 8;
        }

        var apc = findObjectByName('rearAPC');
        if (apc) {
            apc.position.z = state.convoyPosition + 16;
        }

        state.helicopterAngle += delta * 0.5;
        var helicopter = findObjectByName('helicopter');
        if (helicopter) {
            helicopter.position.x = 8 * Math.cos(state.helicopterAngle);
            helicopter.position.z = state.convoyPosition + 30 + 8 * Math.sin(state.helicopterAngle);

            var rotor = helicopter.children.find(function(child) {
                return child.name === 'helicopterRotor';
            });
            if (rotor) {
                rotor.rotation.y += delta * 20;
            }

            state.spotlightAngle += delta * 2;
        }

        state.powerLineSwayAmount = Math.sin(Date.now() * 0.001) * 0.15;

        state.rockRollProgress += delta * 0.3;
        var rocks = findObjectByName('fallenRocks');
        if (rocks) {
            rocks.position.z += delta * 1.5;
            rocks.children.forEach(function(rock) {
                rock.rotation.x += delta * 3;
                rock.rotation.z += delta * 2;
            });
        }

        state.enemyApproachDistance -= delta * 8;
        var technical = findObjectByName('enemyTechnical');
        if (technical) {
            technical.position.z += delta * 8;
        }

        var roadblock = findObjectByName('roadblock');
        if (roadblock && state.convoyPosition > 25) {
            state.barricadeActive = true;
            roadblock.rotation.y = Math.sin(Date.now() * 0.005) * 0.3;
        }

        if (state.convoyPosition > 150) {
            state.ambushNeutralized = true;
        }

        return {
            warheadsSecure: state.warheadsSecure,
            vehiclesLost: state.vehiclesLost,
            ambushNeutralized: state.ambushNeutralized,
            convoyPosition: state.convoyPosition
        };
    }

    function reset() {
        document.removeEventListener('keydown', handleKeyDown);

        for (var i = sceneObjects.length - 1; i >= 0; i--) {
            var obj = sceneObjects[i];
            if (obj.parent) {
                obj.parent.remove(obj);
            }
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(function(mat) {
                        mat.dispose();
                    });
                } else {
                    obj.material.dispose();
                }
            }
        }

        sceneObjects = [];

        Object.keys(materials).forEach(function(key) {
            materials[key].dispose();
        });

        state.warheadsSecure = 3;
        state.vehiclesLost = 0;
        state.ambushNeutralized = false;
        state.convoyPosition = 0;
        state.helicopterAngle = 0;
        state.spotlightAngle = 0;
        state.rockRollProgress = 0;
        state.enemyApproachDistance = 100;
        state.powerLineSwayAmount = 0;
        state.lastNKey = null;
        state.hudVisible = true;
        state.barricadeActive = false;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
