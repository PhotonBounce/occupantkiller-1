window.RustYard = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var crusherPiston = null;
    var rustyParticles = [];
    var animationTime = 0;

    function buildJunkPiles() {
        var pileCount = 12;
        for (var i = 0; i < pileCount; i++) {
            var x = (Math.random() - 0.5) * 200;
            var z = (Math.random() - 0.5) * 200;
            var pileHeight = 3 + Math.random() * 4;
            var pileWidth = 8 + Math.random() * 6;
            var pileDepth = 8 + Math.random() * 6;

            var boxGeo = new THREE.BoxGeometry(pileWidth, pileHeight, pileDepth);
            var boxMat = new THREE.MeshLambertMaterial({ color: 0xAA4422 });
            var boxMesh = new THREE.Mesh(boxGeo, boxMat);
            boxMesh.position.set(x, pileHeight / 2, z);
            boxMesh.castShadow = true;
            boxMesh.receiveShadow = true;
            scene.add(boxMesh);
            objects.push(boxMesh);

            var sphereGeo = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8);
            var sphereMat = new THREE.MeshLambertMaterial({ color: 0x996633 });
            var sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
            sphereMesh.position.set(x + 5, pileHeight + 2, z + 5);
            sphereMesh.castShadow = true;
            sphereMesh.receiveShadow = true;
            scene.add(sphereMesh);
            objects.push(sphereMesh);

            var box2Geo = new THREE.BoxGeometry(pileWidth * 0.7, pileHeight * 0.6, pileDepth * 0.7);
            var box2Mat = new THREE.MeshLambertMaterial({ color: 0x884411 });
            var box2Mesh = new THREE.Mesh(box2Geo, box2Mat);
            box2Mesh.position.set(x - 4, pileHeight * 0.8, z - 4);
            box2Mesh.castShadow = true;
            box2Mesh.receiveShadow = true;
            scene.add(box2Mesh);
            objects.push(box2Mesh);
        }
    }

    function buildVehicleHulks() {
        var hullCount = 15;
        for (var i = 0; i < hullCount; i++) {
            var x = (Math.random() - 0.5) * 180;
            var z = (Math.random() - 0.5) * 180;
            var stackHeight = 2 + Math.floor(Math.random() * 3);

            for (var s = 0; s < stackHeight; s++) {
                var carGeo = new THREE.BoxGeometry(2.2, 1.2, 4.5);
                var carMat = new THREE.MeshLambertMaterial({ color: 0xB85533 });
                var carMesh = new THREE.Mesh(carGeo, carMat);
                carMesh.position.set(x, 0.6 + s * 1.3, z);
                carMesh.castShadow = true;
                carMesh.receiveShadow = true;
                scene.add(carMesh);
                objects.push(carMesh);

                var wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
                for (var w = 0; w < 2; w++) {
                    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
                    var wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
                    wheelMesh.position.set(x + (w === 0 ? -0.9 : 0.9), 0.6 + s * 1.3, z);
                    wheelMesh.rotation.z = Math.PI / 2;
                    wheelMesh.castShadow = true;
                    wheelMesh.receiveShadow = true;
                    scene.add(wheelMesh);
                    objects.push(wheelMesh);
                }
            }
        }
    }

    function buildSheds() {
        var shedCount = 5;
        for (var i = 0; i < shedCount; i++) {
            var x = -90 + i * 40;
            var z = -80;

            var wallGeo = new THREE.BoxGeometry(15, 8, 10);
            var wallMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
            var wallMesh = new THREE.Mesh(wallGeo, wallMat);
            wallMesh.position.set(x, 4, z);
            wallMesh.castShadow = true;
            wallMesh.receiveShadow = true;
            scene.add(wallMesh);
            objects.push(wallMesh);

            var roofGeo = new THREE.BoxGeometry(16, 1.5, 11);
            var roofMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var roofMesh = new THREE.Mesh(roofGeo, roofMat);
            roofMesh.position.set(x, 8.75, z);
            roofMesh.castShadow = true;
            roofMesh.receiveShadow = true;
            scene.add(roofMesh);
            objects.push(roofMesh);

            var awningGeo = new THREE.BoxGeometry(18, 1, 5);
            var awningMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var awningMesh = new THREE.Mesh(awningGeo, awningMat);
            awningMesh.position.set(x, 8.5, z + 7.5);
            awningMesh.castShadow = true;
            awningMesh.receiveShadow = true;
            scene.add(awningMesh);
            objects.push(awningMesh);
        }
    }

    function buildCrushers() {
        var crusherCount = 2;
        for (var i = 0; i < crusherCount; i++) {
            var x = -50 + i * 100;
            var z = 60;

            var frameGeo = new THREE.BoxGeometry(12, 14, 8);
            var frameMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var frameMesh = new THREE.Mesh(frameGeo, frameMat);
            frameMesh.position.set(x, 7, z);
            frameMesh.castShadow = true;
            frameMesh.receiveShadow = true;
            scene.add(frameMesh);
            objects.push(frameMesh);

            var baseGeo = new THREE.BoxGeometry(14, 2, 10);
            var baseMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            var baseMesh = new THREE.Mesh(baseGeo, baseMat);
            baseMesh.position.set(x, 1, z);
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            scene.add(baseMesh);
            objects.push(baseMesh);

            var pistonGeo = new THREE.BoxGeometry(8, 3, 6);
            var pistonMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var pistonMesh = new THREE.Mesh(pistonGeo, pistonMat);
            pistonMesh.position.set(x, 8, z);
            pistonMesh.castShadow = true;
            pistonMesh.receiveShadow = true;
            scene.add(pistonMesh);
            objects.push(pistonMesh);

            if (i === 0) {
                crusherPiston = pistonMesh;
            }

            var cylinderGeo = new THREE.CylinderGeometry(1.5, 1.5, 10, 16);
            var cylinderMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
            cylinderMesh.position.set(x - 3, 10, z);
            cylinderMesh.rotation.z = Math.PI / 2;
            cylinderMesh.castShadow = true;
            cylinderMesh.receiveShadow = true;
            scene.add(cylinderMesh);
            objects.push(cylinderMesh);

            var cylinder2Mesh = new THREE.Mesh(cylinderGeo, cylinderMat);
            cylinder2Mesh.position.set(x + 3, 10, z);
            cylinder2Mesh.rotation.z = Math.PI / 2;
            cylinder2Mesh.castShadow = true;
            cylinder2Mesh.receiveShadow = true;
            scene.add(cylinder2Mesh);
            objects.push(cylinder2Mesh);
        }
    }

    function buildBarricades() {
        var barricadePositions = [
            [-60, 0, -60], [60, 0, -60], [-60, 0, 60], [60, 0, 60],
            [-80, 0, 0], [80, 0, 0], [0, 0, -80], [0, 0, 80]
        ];

        for (var i = 0; i < barricadePositions.length; i++) {
            var pos = barricadePositions[i];
            var x = pos[0];
            var z = pos[2];

            for (var j = 0; j < 3; j++) {
                var blockGeo = new THREE.BoxGeometry(3, 2.5, 3);
                var blockMat = new THREE.MeshLambertMaterial({ color: 0x9A4422 });
                var blockMesh = new THREE.Mesh(blockGeo, blockMat);
                blockMesh.position.set(x + j * 3.5, 1.25, z);
                blockMesh.castShadow = true;
                blockMesh.receiveShadow = true;
                scene.add(blockMesh);
                objects.push(blockMesh);
            }
        }
    }

    function buildWatchpoints() {
        var watchX = 75;
        var watchZ = 75;

        var baseGeo = new THREE.BoxGeometry(12, 2, 12);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(watchX, 1, watchZ);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        scene.add(baseMesh);
        objects.push(baseMesh);

        var pillarGeo = new THREE.CylinderGeometry(1, 1, 12, 12);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
        pillarMesh.position.set(watchX, 7, watchZ);
        pillarMesh.castShadow = true;
        pillarMesh.receiveShadow = true;
        scene.add(pillarMesh);
        objects.push(pillarMesh);

        var platformGeo = new THREE.BoxGeometry(10, 1.5, 10);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var platformMesh = new THREE.Mesh(platformGeo, platformMat);
        platformMesh.position.set(watchX, 13.75, watchZ);
        platformMesh.castShadow = true;
        platformMesh.receiveShadow = true;
        scene.add(platformMesh);
        objects.push(platformMesh);

        var railGeo = new THREE.BoxGeometry(10, 1, 0.5);
        for (var r = 0; r < 4; r++) {
            var railMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var railMesh = new THREE.Mesh(railGeo, railMat);
            if (r < 2) {
                railMesh.position.set(watchX, 14.5, watchZ + (r === 0 ? 5.25 : -5.25));
            } else {
                railMesh.rotation.z = Math.PI / 2;
                railMesh.position.set(watchX + (r === 2 ? 5.25 : -5.25), 14.5, watchZ);
            }
            railMesh.castShadow = true;
            railMesh.receiveShadow = true;
            scene.add(railMesh);
            objects.push(railMesh);
        }
    }

    function buildOilPits() {
        var pitCount = 3;
        for (var i = 0; i < pitCount; i++) {
            var x = -100 + i * 100;
            var z = 100;

            var pitGeo = new THREE.BoxGeometry(20, 3, 20);
            var pitMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var pitMesh = new THREE.Mesh(pitGeo, pitMat);
            pitMesh.position.set(x, 1.5, z);
            pitMesh.castShadow = true;
            pitMesh.receiveShadow = true;
            scene.add(pitMesh);
            objects.push(pitMesh);

            for (var b = 0; b < 8; b++) {
                var angle = (b / 8) * Math.PI * 2;
                var bubbleX = x + Math.cos(angle) * 6;
                var bubbleZ = z + Math.sin(angle) * 6;
                var bubbleGeo = new THREE.SphereGeometry(1.5 + Math.random() * 0.8, 8, 8);
                var bubbleMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d });
                var bubbleMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
                bubbleMesh.position.set(bubbleX, 3.5, bubbleZ);
                bubbleMesh.castShadow = true;
                bubbleMesh.receiveShadow = true;
                scene.add(bubbleMesh);
                objects.push(bubbleMesh);
            }
        }
    }

    function buildTires() {
        var tireStackCount = 6;
        for (var i = 0; i < tireStackCount; i++) {
            var x = -70 + Math.random() * 140;
            var z = -70 + Math.random() * 140;
            var stackSize = 2 + Math.floor(Math.random() * 3);

            for (var s = 0; s < stackSize; s++) {
                for (var t = 0; t < 3; t++) {
                    var tireGeo = new THREE.CylinderGeometry(2, 2, 0.6, 16);
                    var tireMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
                    var tireMesh = new THREE.Mesh(tireGeo, tireMat);
                    var offsetX = (t - 1) * 2.5;
                    tireMesh.position.set(x + offsetX, 0.3 + s * 2.2, z);
                    tireMesh.rotation.z = Math.PI / 2.5;
                    tireMesh.castShadow = true;
                    tireMesh.receiveShadow = true;
                    scene.add(tireMesh);
                    objects.push(tireMesh);
                }
            }
        }
    }

    function buildFences() {
        var fencePositions = [
            [-100, 0, -100, 200, 0],
            [100, 0, -100, 0, 200],
            [-100, 0, 100, 200, 0],
            [100, 0, 100, 0, 200]
        ];

        for (var f = 0; f < fencePositions.length; f++) {
            var pos = fencePositions[f];
            var startX = pos[0];
            var startZ = pos[1];
            var lengthX = pos[2];
            var lengthZ = pos[3];

            for (var p = 0; p < 8; p++) {
                var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
                var postMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
                var postMesh = new THREE.Mesh(postGeo, postMat);
                postMesh.position.set(
                    startX + (lengthX / 8) * p,
                    2.5,
                    startZ + (lengthZ / 8) * p
                );
                postMesh.castShadow = true;
                postMesh.receiveShadow = true;
                scene.add(postMesh);
                objects.push(postMesh);
            }
        }
    }

    function buildMisc() {
        var miscCount = 20;
        for (var i = 0; i < miscCount; i++) {
            var x = (Math.random() - 0.5) * 200;
            var z = (Math.random() - 0.5) * 200;
            var type = Math.floor(Math.random() * 3);

            if (type === 0) {
                var coneGeo = new THREE.ConeGeometry(2, 4, 12);
                var coneMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
                var coneMesh = new THREE.Mesh(coneGeo, coneMat);
                coneMesh.position.set(x, 2, z);
                coneMesh.castShadow = true;
                coneMesh.receiveShadow = true;
                scene.add(coneMesh);
                objects.push(coneMesh);
            } else if (type === 1) {
                var boxGeo = new THREE.BoxGeometry(1.5, 3, 1.5);
                var boxMat = new THREE.MeshLambertMaterial({ color: 0xAA5533 });
                var boxMesh = new THREE.Mesh(boxGeo, boxMat);
                boxMesh.position.set(x, 1.5, z);
                boxMesh.castShadow = true;
                boxMesh.receiveShadow = true;
                scene.add(boxMesh);
                objects.push(boxMesh);
            } else {
                var sphereGeo = new THREE.SphereGeometry(1.2, 8, 8);
                var sphereMat = new THREE.MeshLambertMaterial({ color: 0x996633 });
                var sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
                sphereMesh.position.set(x, 1.2, z);
                sphereMesh.castShadow = true;
                sphereMesh.receiveShadow = true;
                scene.add(sphereMesh);
                objects.push(sphereMesh);
            }
        }
    }

    function setupLighting() {
        var ambientGeo = new THREE.SphereGeometry(0.1, 4, 4);
        var ambientMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var ambientMesh = new THREE.Mesh(ambientGeo, ambientMat);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(100, 80, 100);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 4096;
        sunLight.shadow.mapSize.height = 4096;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -200;
        sunLight.shadow.camera.right = 200;
        sunLight.shadow.camera.top = 200;
        sunLight.shadow.camera.bottom = -200;
        scene.add(sunLight);
        lights.push(sunLight);

        for (var i = 0; i < 4; i++) {
            var angle = (i / 4) * Math.PI * 2;
            var pointLight = new THREE.PointLight(0xffaa66, 0.5, 100);
            pointLight.position.set(
                Math.cos(angle) * 80,
                40,
                Math.sin(angle) * 80
            );
            pointLight.castShadow = true;
            scene.add(pointLight);
            lights.push(pointLight);
        }
    }

    function update(delta) {
        animationTime += delta;

        if (crusherPiston) {
            var pistonCycle = 2.0;
            var t = (animationTime % pistonCycle) / pistonCycle;
            var baseY = 8;
            if (t < 0.5) {
                crusherPiston.position.y = baseY - (t * 2) * 2;
            } else {
                crusherPiston.position.y = baseY - 2 + ((t - 0.5) * 2) * 2;
            }
        }

        for (var i = rustyParticles.length - 1; i >= 0; i--) {
            var particle = rustyParticles[i];
            particle.position.y -= delta * 3;
            particle.material.opacity -= delta * 0.5;

            if (particle.position.y < -10 || particle.material.opacity <= 0) {
                scene.remove(particle);
                rustyParticles.splice(i, 1);
            }
        }

        if (animationTime % 0.3 < delta && Math.random() > 0.5) {
            var particleGeo = new THREE.SphereGeometry(0.3, 4, 4);
            var particleMat = new THREE.MeshLambertMaterial({
                color: 0xCC7744,
                transparent: true,
                opacity: 0.7
            });
            var particleMesh = new THREE.Mesh(particleGeo, particleMat);
            particleMesh.position.set(
                (Math.random() - 0.5) * 60,
                80,
                (Math.random() - 0.5) * 60
            );
            scene.add(particleMesh);
            rustyParticles.push(particleMesh);
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        for (var i = 0; i < rustyParticles.length; i++) {
            scene.remove(rustyParticles[i]);
        }
        objects = [];
        lights = [];
        rustyParticles = [];
        crusherPiston = null;
        scene = null;
        camera = null;
        animationTime = 0;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        rustyParticles = [];
        animationTime = 0;

        buildJunkPiles();
        buildVehicleHulks();
        buildSheds();
        buildCrushers();
        buildBarricades();
        buildWatchpoints();
        buildOilPits();
        buildTires();
        buildFences();
        buildMisc();
        setupLighting();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
