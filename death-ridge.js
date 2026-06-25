window.DeathRidge = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animations = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animations = [];
        buildRidge();
        buildTrenches();
        buildGunPositions();
        buildMortarPits();
        buildWrecks();
        buildBarbed();
        buildOutcroppings();
        buildObservation();
        setupLighting();
    }

    function buildRidge() {
        var ridgeColor = 0x6b5d4f;
        var ridgeGeom = new THREE.BoxGeometry(120, 8, 40);
        var ridgeMat = new THREE.MeshLambertMaterial({color: ridgeColor});
        var ridgeMesh = new THREE.Mesh(ridgeGeom, ridgeMat);
        ridgeMesh.position.set(0, 12, 0);
        ridgeMesh.castShadow = true;
        ridgeMesh.receiveShadow = true;
        scene.add(ridgeMesh);
        objects.push(ridgeMesh);

        var eastSlope = new THREE.BoxGeometry(120, 6, 35);
        var slopeMat = new THREE.MeshLambertMaterial({color: 0x7a6d5f});
        var eastMesh = new THREE.Mesh(eastSlope, slopeMat);
        eastMesh.position.set(0, 6, 22);
        eastMesh.rotation.z = 0.15;
        eastMesh.castShadow = true;
        eastMesh.receiveShadow = true;
        scene.add(eastMesh);
        objects.push(eastMesh);

        var westSlope = new THREE.BoxGeometry(120, 6, 35);
        var westMesh = new THREE.Mesh(westSlope, slopeMat);
        westMesh.position.set(0, 6, -22);
        westMesh.rotation.z = -0.15;
        westMesh.castShadow = true;
        westMesh.receiveShadow = true;
        scene.add(westMesh);
        objects.push(westMesh);

        for (var i = 0; i < 8; i++) {
            var rockGeom = new THREE.BoxGeometry(6, 8, 5);
            var rockMat = new THREE.MeshLambertMaterial({color: 0x5a4d3f});
            var rockMesh = new THREE.Mesh(rockGeom, rockMat);
            rockMesh.position.set(-50 + i * 15, 18, 8);
            rockMesh.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.2);
            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            scene.add(rockMesh);
            objects.push(rockMesh);
        }

        for (var i = 0; i < 6; i++) {
            var stoneGeom = new THREE.BoxGeometry(5, 6, 4);
            var stoneMat = new THREE.MeshLambertMaterial({color: 0x6b5d4f});
            var stoneMesh = new THREE.Mesh(stoneGeom, stoneMat);
            stoneMesh.position.set(-40 + i * 18, 17, -12);
            stoneMesh.rotation.set(Math.random() * 0.25, Math.random() * 0.25, Math.random() * 0.15);
            stoneMesh.castShadow = true;
            stoneMesh.receiveShadow = true;
            scene.add(stoneMesh);
            objects.push(stoneMesh);
        }
    }

    function buildTrenches() {
        var trenchLength = 100;
        var trenchWidth = 6;
        var trenchDepth = 4;
        var frontWall = new THREE.BoxGeometry(trenchLength, trenchDepth, 1);
        var wallMat = new THREE.MeshLambertMaterial({color: 0x4a3f32});
        var front = new THREE.Mesh(frontWall, wallMat);
        front.position.set(0, 10, 12);
        front.castShadow = true;
        front.receiveShadow = true;
        scene.add(front);
        objects.push(front);

        var backWall = new THREE.BoxGeometry(trenchLength, trenchDepth, 1);
        var back = new THREE.Mesh(backWall, wallMat);
        back.position.set(0, 10, -12);
        back.castShadow = true;
        back.receiveShadow = true;
        scene.add(back);
        objects.push(back);

        var leftWall = new THREE.BoxGeometry(1, trenchDepth, 24);
        var left = new THREE.Mesh(leftWall, wallMat);
        left.position.set(-50, 10, 0);
        left.castShadow = true;
        left.receiveShadow = true;
        scene.add(left);
        objects.push(left);

        var rightWall = new THREE.BoxGeometry(1, trenchDepth, 24);
        var right = new THREE.Mesh(rightWall, wallMat);
        right.position.set(50, 10, 0);
        right.castShadow = true;
        right.receiveShadow = true;
        scene.add(right);
        objects.push(right);

        var floorMat = new THREE.MeshLambertMaterial({color: 0x5a4f42});
        for (var i = 0; i < 12; i++) {
            var floorBoard = new THREE.BoxGeometry(8, 0.5, 5);
            var boardMesh = new THREE.Mesh(floorBoard, floorMat);
            boardMesh.position.set(-45 + i * 8, 8.2, 0);
            boardMesh.castShadow = true;
            boardMesh.receiveShadow = true;
            scene.add(boardMesh);
            objects.push(boardMesh);
        }
    }

    function buildGunPositions() {
        var positions = [
            {x: -40, z: 15},
            {x: 0, z: 18},
            {x: 40, z: 15}
        ];

        for (var p = 0; p < positions.length; p++) {
            var pos = positions[p];
            var sandbagMat = new THREE.MeshLambertMaterial({color: 0xd4a574});
            for (var i = 0; i < 3; i++) {
                var bag = new THREE.BoxGeometry(8, 1, 2);
                var bagMesh = new THREE.Mesh(bag, sandbagMat);
                bagMesh.position.set(pos.x, 13 + i * 1.2, pos.z);
                bagMesh.castShadow = true;
                bagMesh.receiveShadow = true;
                scene.add(bagMesh);
                objects.push(bagMesh);
            }

            var barrelGeom = new THREE.CylinderGeometry(0.5, 0.5, 6, 8);
            var barrelMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
            var barrel = new THREE.Mesh(barrelGeom, barrelMat);
            barrel.position.set(pos.x, 16.5, pos.z);
            barrel.rotation.z = 0.1;
            barrel.castShadow = true;
            barrel.receiveShadow = true;
            scene.add(barrel);
            objects.push(barrel);
            animations.push({type: 'gunBarrel', mesh: barrel, speed: 0.03});

            var breechGeom = new THREE.CylinderGeometry(1, 1, 2, 8);
            var breechMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
            var breech = new THREE.Mesh(breechGeom, breechMat);
            breech.position.set(pos.x, 15.5, pos.z);
            breech.castShadow = true;
            breech.receiveShadow = true;
            scene.add(breech);
            objects.push(breech);
        }
    }

    function buildMortarPits() {
        var pitLocs = [
            {x: -35, z: -8},
            {x: 20, z: 10},
            {x: 50, z: -6}
        ];

        for (var p = 0; p < pitLocs.length; p++) {
            var loc = pitLocs[p];
            var pitGeom = new THREE.CylinderGeometry(5, 5, 2, 16);
            var pitMat = new THREE.MeshLambertMaterial({color: 0x4a3f32});
            var pit = new THREE.Mesh(pitGeom, pitMat);
            pit.position.set(loc.x, 10, loc.z);
            pit.castShadow = true;
            pit.receiveShadow = true;
            scene.add(pit);
            objects.push(pit);

            var mortarGeom = new THREE.ConeGeometry(1.2, 3, 12);
            var mortarMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
            var mortar = new THREE.Mesh(mortarGeom, mortarMat);
            mortar.position.set(loc.x, 11.5, loc.z);
            mortar.castShadow = true;
            mortar.receiveShadow = true;
            scene.add(mortar);
            objects.push(mortar);

            var ammoStack1 = new THREE.BoxGeometry(3, 2, 3);
            var ammoMat = new THREE.MeshLambertMaterial({color: 0x3a3a2a});
            var ammo1 = new THREE.Mesh(ammoStack1, ammoMat);
            ammo1.position.set(loc.x - 4, 10.5, loc.z);
            ammo1.castShadow = true;
            ammo1.receiveShadow = true;
            scene.add(ammo1);
            objects.push(ammo1);

            var ammoStack2 = new THREE.BoxGeometry(3, 2, 3);
            var ammo2 = new THREE.Mesh(ammoStack2, ammoMat);
            ammo2.position.set(loc.x + 4, 10.5, loc.z);
            ammo2.castShadow = true;
            ammo2.receiveShadow = true;
            scene.add(ammo2);
            objects.push(ammo2);

            animations.push({type: 'mortarSmoke', x: loc.x, z: loc.z, time: Math.random() * 6});
        }
    }

    function buildWrecks() {
        var wracks = [
            {x: -55, z: 25, rot: 0.3},
            {x: 55, z: -20, rot: -0.25},
            {x: 0, z: 35, rot: 0.15}
        ];

        for (var w = 0; w < wracks.length; w++) {
            var wrack = wracks[w];
            var hullGeom = new THREE.BoxGeometry(12, 5, 8);
            var rustMat = new THREE.MeshLambertMaterial({color: 0x3a2a1a});
            var hull = new THREE.Mesh(hullGeom, rustMat);
            hull.position.set(wrack.x, 10 + Math.random() * 3, wrack.z);
            hull.rotation.z = wrack.rot;
            hull.castShadow = true;
            hull.receiveShadow = true;
            scene.add(hull);
            objects.push(hull);

            var turretGeom = new THREE.CylinderGeometry(2, 2.5, 3, 8);
            var turretMat = new THREE.MeshLambertMaterial({color: 0x4a3a2a});
            var turret = new THREE.Mesh(turretGeom, turretMat);
            turret.position.set(wrack.x, 13 + Math.random() * 2, wrack.z);
            turret.castShadow = true;
            turret.receiveShadow = true;
            scene.add(turret);
            objects.push(turret);

            var gunGeom = new THREE.CylinderGeometry(0.4, 0.4, 4, 6);
            var gunMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
            var gun = new THREE.Mesh(gunGeom, gunMat);
            gun.position.set(wrack.x + 2, 14.5, wrack.z);
            gun.rotation.z = 0.4;
            gun.castShadow = true;
            gun.receiveShadow = true;
            scene.add(gun);
            objects.push(gun);

            for (var i = 0; i < 4; i++) {
                var wheelGeom = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 8);
                var wheelMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
                var wheel = new THREE.Mesh(wheelGeom, wheelMat);
                var xOffset = wrack.x + (i < 2 ? -5 : 5);
                var zOffset = wrack.z + (i % 2 === 0 ? -3 : 3);
                wheel.position.set(xOffset, 8 + Math.random() * 2, zOffset);
                wheel.rotation.x = Math.PI / 2;
                wheel.castShadow = true;
                wheel.receiveShadow = true;
                scene.add(wheel);
                objects.push(wheel);
            }
        }
    }

    function buildBarbed() {
        var wireMat = new THREE.LineBasicMaterial({color: 0x8a7a6a, linewidth: 2});
        for (var i = 0; i < 5; i++) {
            var yLevel = 12 + i * 1.5;
            var points = [];
            points.push(new THREE.Vector3(-60, yLevel, 5));
            points.push(new THREE.Vector3(-40, yLevel, 5));
            points.push(new THREE.Vector3(-20, yLevel, 5));
            points.push(new THREE.Vector3(0, yLevel, 5));
            points.push(new THREE.Vector3(20, yLevel, 5));
            points.push(new THREE.Vector3(40, yLevel, 5));
            points.push(new THREE.Vector3(60, yLevel, 5));
            var geometry = new THREE.BufferGeometry().setFromPoints(points);
            var line = new THREE.LineSegments(geometry, wireMat);
            scene.add(line);
            objects.push(line);
        }

        for (var i = 0; i < 5; i++) {
            var yLevel = 12 + i * 1.5;
            var points2 = [];
            points2.push(new THREE.Vector3(-60, yLevel, -8));
            points2.push(new THREE.Vector3(-40, yLevel, -8));
            points2.push(new THREE.Vector3(-20, yLevel, -8));
            points2.push(new THREE.Vector3(0, yLevel, -8));
            points2.push(new THREE.Vector3(20, yLevel, -8));
            points2.push(new THREE.Vector3(40, yLevel, -8));
            points2.push(new THREE.Vector3(60, yLevel, -8));
            var geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
            var line2 = new THREE.LineSegments(geometry2, wireMat);
            scene.add(line2);
            objects.push(line2);
        }
    }

    function buildOutcroppings() {
        var outcrops = [
            {x: -70, z: -25, sz: 8},
            {x: 70, z: 30, sz: 7},
            {x: -45, z: 40, sz: 6},
            {x: 35, z: -35, sz: 7},
            {x: 0, z: -40, sz: 6}
        ];

        for (var o = 0; o < outcrops.length; o++) {
            var crop = outcrops[o];
            for (var i = 0; i < 4; i++) {
                var rockGeom = new THREE.SphereGeometry(crop.sz / 2, 6, 6);
                var rockMat = new THREE.MeshLambertMaterial({color: 0x6b5d4f});
                var rockMesh = new THREE.Mesh(rockGeom, rockMat);
                rockMesh.position.set(
                    crop.x + Math.random() * 4 - 2,
                    8 + i * 3 + Math.random() * 2,
                    crop.z + Math.random() * 4 - 2
                );
                rockMesh.castShadow = true;
                rockMesh.receiveShadow = true;
                scene.add(rockMesh);
                objects.push(rockMesh);
            }
        }
    }

    function buildObservation() {
        var postGeom = new THREE.BoxGeometry(4, 8, 4);
        var postMat = new THREE.MeshLambertMaterial({color: 0x3a3a2a});
        var post = new THREE.Mesh(postGeom, postMat);
        post.position.set(-60, 14, -5);
        post.castShadow = true;
        post.receiveShadow = true;
        scene.add(post);
        objects.push(post);

        var scopeGeom = new THREE.CylinderGeometry(0.6, 0.6, 4, 8);
        var scopeMat = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
        var scope = new THREE.Mesh(scopeGeom, scopeMat);
        scope.position.set(-60, 19, -5);
        scope.rotation.z = 0.4;
        scope.castShadow = true;
        scope.receiveShadow = true;
        scene.add(scope);
        objects.push(scope);

        var eyepieceGeom = new THREE.SphereGeometry(0.5, 6, 6);
        var eyepieceMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
        var eyepiece = new THREE.Mesh(eyepieceGeom, eyepieceMat);
        eyepiece.position.set(-63.5, 21, -5);
        eyepiece.castShadow = true;
        eyepiece.receiveShadow = true;
        scene.add(eyepiece);
        objects.push(eyepiece);

        var platformGeom = new THREE.BoxGeometry(6, 0.5, 6);
        var platformMat = new THREE.MeshLambertMaterial({color: 0x4a4a3a});
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(-60, 18.5, -5);
        platform.castShadow = true;
        platform.receiveShadow = true;
        scene.add(platform);
        objects.push(platform);

        buildSupply();
        buildCraters();
    }

    function buildSupply() {
        var cratePos = [
            {x: 25, z: 20},
            {x: 30, z: 25},
            {x: 22, z: 28},
            {x: 35, z: 22},
            {x: 28, z: 32},
            {x: 40, z: 26},
            {x: 32, z: 35},
            {x: 45, z: 30}
        ];

        for (var c = 0; c < cratePos.length; c++) {
            var crate = cratePos[c];
            var crateGeom = new THREE.BoxGeometry(3, 3, 3);
            var crateMat = new THREE.MeshLambertMaterial({color: 0x6a5a3a});
            var crateMesh = new THREE.Mesh(crateGeom, crateMat);
            crateMesh.position.set(crate.x, 9.5 + Math.random() * 1, crate.z);
            crateMesh.rotation.set(Math.random() * 0.1, Math.random() * 0.2, Math.random() * 0.1);
            crateMesh.castShadow = true;
            crateMesh.receiveShadow = true;
            scene.add(crateMesh);
            objects.push(crateMesh);
        }
    }

    function buildCraters() {
        var craterLocs = [
            {x: -70, z: 10},
            {x: 60, z: -15},
            {x: -50, z: -25},
            {x: 45, z: 35},
            {x: -25, z: 30}
        ];

        for (var c = 0; c < craterLocs.length; c++) {
            var loc = craterLocs[c];
            var depthGeom = new THREE.CylinderGeometry(8, 10, 2, 12);
            var depthMat = new THREE.MeshLambertMaterial({color: 0x4a2a1a});
            var depth = new THREE.Mesh(depthGeom, depthMat);
            depth.position.set(loc.x, 8, loc.z);
            depth.castShadow = true;
            depth.receiveShadow = true;
            scene.add(depth);
            objects.push(depth);

            var rimGeom = new THREE.CylinderGeometry(10, 8, 1, 12);
            var rimMat = new THREE.MeshLambertMaterial({color: 0x5a3a2a});
            var rim = new THREE.Mesh(rimGeom, rimMat);
            rim.position.set(loc.x, 9, loc.z);
            rim.castShadow = true;
            rim.receiveShadow = true;
            scene.add(rim);
            objects.push(rim);

            for (var i = 0; i < 3; i++) {
                var rockGeom = new THREE.SphereGeometry(2 - i * 0.5, 5, 5);
                var rockMat = new THREE.MeshLambertMaterial({color: 0x6a4a2a});
                var rockMesh = new THREE.Mesh(rockGeom, rockMat);
                rockMesh.position.set(
                    loc.x + Math.random() * 6 - 3,
                    9 + i * 1.5,
                    loc.z + Math.random() * 6 - 3
                );
                rockMesh.castShadow = true;
                rockMesh.receiveShadow = true;
                scene.add(rockMesh);
                objects.push(rockMesh);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(80, 60, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x6a4a2a, 0.3);
        scene.add(hemisphereLight);
        lights.push(hemisphereLight);

        for (var i = 0; i < 3; i++) {
            var pointLight = new THREE.PointLight(0xff6b35, 0.5, 30);
            var gunPos = [{x: -40, z: 15}, {x: 0, z: 18}, {x: 40, z: 15}];
            pointLight.position.set(gunPos[i].x, 17, gunPos[i].z);
            scene.add(pointLight);
            lights.push(pointLight);
        }
    }

    function update(delta) {
        var time = Date.now() * 0.001;

        for (var a = 0; a < animations.length; a++) {
            var anim = animations[a];
            if (anim.type === 'gunBarrel') {
                anim.mesh.rotation.z = 0.1 + Math.sin(time * 2 + a) * 0.05;
            } else if (anim.type === 'mortarSmoke') {
                anim.time += delta;
                if (anim.time > 6) {
                    anim.time = 0;
                }
                if (anim.time < 3) {
                    var smokeGeom = new THREE.SphereGeometry(0.5 + anim.time * 0.8, 6, 6);
                    var smokeMat = new THREE.MeshLambertMaterial({
                        color: 0xaaaaaa,
                        transparent: true,
                        opacity: 0.4 * (1 - anim.time / 3)
                    });
                    var smokeMesh = new THREE.Mesh(smokeGeom, smokeMat);
                    smokeMesh.position.set(anim.x, 12 + anim.time * 3, anim.z);
                    smokeMesh.castShadow = true;
                    smokeMesh.receiveShadow = true;
                    scene.add(smokeMesh);
                    objects.push(smokeMesh);
                }
            }
        }

        if (Math.floor(time) % 8 === 0 && Math.floor(time) !== Math.floor(time - delta)) {
            var flashLight = new THREE.PointLight(0xff6b35, 2, 80);
            flashLight.position.set(Math.random() * 60 - 30, 50, Math.random() * 40 - 20);
            scene.add(flashLight);
            lights.push(flashLight);
            var tempLight = {mesh: flashLight, life: 0.3};
            animations.push(tempLight);
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
        animations = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
