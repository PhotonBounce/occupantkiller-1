window.SteelCity = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var explosionLight = null;
    var neonSigns = [];
    var animationTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        neonSigns = [];
        animationTime = 0;
        buildSkyscrapers();
        buildStreets();
        buildBarricades();
        buildVehicles();
        buildOverpasses();
        buildCrane();
        buildSniperNests();
        buildBunkers();
        setupLighting();
    }

    function update(delta) {
        animationTime += delta;
        if (explosionLight) {
            var explosionFlash = Math.sin(animationTime * 3) * 0.5 + 0.5;
            explosionLight.intensity = explosionFlash * 0.8;
        }
        for (var i = 0; i < neonSigns.length; i++) {
            var neon = neonSigns[i];
            var flicker = Math.random() > 0.95 ? 0 : 1;
            neon.material.emissive.setHex(flicker > 0.5 ? neon.userData.color : 0x000000);
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        if (explosionLight) {
            scene.remove(explosionLight);
        }
        objects = [];
        lights = [];
        neonSigns = [];
        scene = null;
        camera = null;
    }

    function buildSkyscrapers() {
        var skyData = [
            { x: -80, z: -150, w: 30, h: 300, d: 25 },
            { x: -40, z: -180, w: 35, h: 280, d: 28 },
            { x: 0, z: -160, w: 32, h: 320, d: 26 },
            { x: 50, z: -200, w: 38, h: 300, d: 30 },
            { x: 100, z: -140, w: 36, h: 290, d: 29 },
            { x: -120, z: 80, w: 34, h: 310, d: 27 },
            { x: -60, z: 120, w: 31, h: 270, d: 25 },
            { x: 20, z: 100, w: 37, h: 300, d: 28 },
            { x: 80, z: 140, w: 33, h: 285, d: 26 },
            { x: -30, z: 0, w: 40, h: 330, d: 32 }
        ];
        for (var i = 0; i < skyData.length; i++) {
            var data = skyData[i];
            var geom = new THREE.BoxGeometry(data.w, data.h, data.d);
            var mat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
            var mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(data.x, data.h / 2, data.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
            addGlassWindows(mesh, data.w, data.h, data.d);
        }
    }

    function addGlassWindows(building, w, h, d) {
        var windowSpacing = 8;
        var windowSize = 5;
        var yStart = -h / 2 + 15;
        var yCount = Math.floor(h / windowSpacing);
        var xCount = Math.floor(w / windowSpacing);
        var zCount = Math.floor(d / windowSpacing);
        for (var yi = 0; yi < yCount; yi++) {
            for (var xi = 0; xi < xCount; xi++) {
                var y = yStart + yi * windowSpacing;
                var x = -w / 2 + xi * windowSpacing + 4;
                var geom = new THREE.BoxGeometry(windowSize, windowSize, 0.5);
                var mat = new THREE.MeshLambertMaterial({ color: 0x1a3a4a });
                var mesh = new THREE.Mesh(geom, mat);
                mesh.position.copy(building.position);
                mesh.position.x += x;
                mesh.position.y += y;
                mesh.position.z = building.position.z + d / 2 + 1;
                scene.add(mesh);
                objects.push(mesh);
            }
        }
        for (var yi = 0; yi < yCount; yi++) {
            for (var zi = 0; zi < zCount; zi++) {
                var y = yStart + yi * windowSpacing;
                var z = -d / 2 + zi * windowSpacing + 4;
                var geom = new THREE.BoxGeometry(0.5, windowSize, windowSize);
                var mat = new THREE.MeshLambertMaterial({ color: 0x1a3a4a });
                var mesh = new THREE.Mesh(geom, mat);
                mesh.position.copy(building.position);
                mesh.position.x = building.position.x + w / 2 + 1;
                mesh.position.y += y;
                mesh.position.z += z;
                scene.add(mesh);
                objects.push(mesh);
            }
        }
    }

    function buildStreets() {
        var streetGrid = [
            { x: 0, z: 0, w: 250, d: 15 },
            { x: 0, z: 100, w: 250, d: 15 },
            { x: 0, z: -100, w: 250, d: 15 },
            { x: -80, z: 0, w: 15, d: 250 },
            { x: 80, z: 0, w: 15, d: 250 },
            { x: 0, z: 50, w: 250, d: 15 },
            { x: 0, z: -50, w: 250, d: 15 }
        ];
        for (var i = 0; i < streetGrid.length; i++) {
            var street = streetGrid[i];
            var geom = new THREE.BoxGeometry(street.w, 1, street.d);
            var mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(street.x, 0.5, street.z);
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
        addConcreteBlocks();
        addSandbags();
    }

    function addConcreteBlocks() {
        var blockPositions = [
            { x: -40, z: -20 },
            { x: -40, z: 20 },
            { x: 40, z: -20 },
            { x: 40, z: 20 },
            { x: 0, z: -60 },
            { x: 0, z: 60 },
            { x: -50, z: 0 },
            { x: 50, z: 0 },
            { x: -30, z: -40 },
            { x: 30, z: 40 },
            { x: -60, z: 50 },
            { x: 60, z: -50 }
        ];
        for (var i = 0; i < blockPositions.length; i++) {
            var pos = blockPositions[i];
            var geom = new THREE.BoxGeometry(8, 6, 8);
            var mat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
            var mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(pos.x, 3, pos.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function addSandbags() {
        var sandbagPositions = [
            { x: -50, z: -30 },
            { x: -50, z: -20 },
            { x: -50, z: -10 },
            { x: 50, z: 30 },
            { x: 50, z: 20 },
            { x: 50, z: 10 },
            { x: -20, z: -50 },
            { x: -10, z: -50 },
            { x: 0, z: -50 },
            { x: 10, z: -50 },
            { x: 20, z: 50 },
            { x: 10, z: 50 },
            { x: 0, z: 50 },
            { x: -10, z: 50 },
            { x: -20, z: 50 }
        ];
        for (var i = 0; i < sandbagPositions.length; i++) {
            var pos = sandbagPositions[i];
            var geom = new THREE.BoxGeometry(6, 4, 4);
            var mat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
            var mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(pos.x, 2, pos.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildBarricades() {
        var shopFacades = [
            { x: -120, z: 0, destroyed: true },
            { x: -100, z: 50, destroyed: true },
            { x: 110, z: -40, destroyed: false },
            { x: 130, z: 60, destroyed: true }
        ];
        for (var i = 0; i < shopFacades.length; i++) {
            var shop = shopFacades[i];
            var width = 20;
            var height = 20;
            var gapStart = 8;
            var gapWidth = 10;
            if (shop.destroyed) {
                var topGeom = new THREE.BoxGeometry(width, 5, 2);
                var topMat = new THREE.MeshLambertMaterial({ color: 0xcc9999 });
                var topMesh = new THREE.Mesh(topGeom, topMat);
                topMesh.position.set(shop.x, 17.5, shop.z);
                topMesh.castShadow = true;
                scene.add(topMesh);
                objects.push(topMesh);
                var leftGeom = new THREE.BoxGeometry(gapStart, gapStart, 2);
                var leftMat = new THREE.MeshLambertMaterial({ color: 0xaa6666 });
                var leftMesh = new THREE.Mesh(leftGeom, leftMat);
                leftMesh.position.set(shop.x - width / 2 + gapStart / 2, gapStart / 2, shop.z);
                leftMesh.castShadow = true;
                scene.add(leftMesh);
                objects.push(leftMesh);
                var rightGeom = new THREE.BoxGeometry(gapStart, gapStart, 2);
                var rightMat = new THREE.MeshLambertMaterial({ color: 0xaa6666 });
                var rightMesh = new THREE.Mesh(rightGeom, rightMat);
                rightMesh.position.set(shop.x + width / 2 - gapStart / 2, gapStart / 2, shop.z);
                rightMesh.castShadow = true;
                scene.add(rightMesh);
                objects.push(rightMesh);
            } else {
                var facadeGeom = new THREE.BoxGeometry(width, height, 2);
                var facadeMat = new THREE.MeshLambertMaterial({ color: 0x663333 });
                var facadeMesh = new THREE.Mesh(facadeGeom, facadeMat);
                facadeMesh.position.set(shop.x, height / 2, shop.z);
                facadeMesh.castShadow = true;
                scene.add(facadeMesh);
                objects.push(facadeMesh);
            }
        }
    }

    function buildVehicles() {
        var carPositions = [
            { x: -30, z: -80 },
            { x: 30, z: 80 },
            { x: 70, z: -20 },
            { x: -70, z: 60 }
        ];
        for (var i = 0; i < carPositions.length; i++) {
            var pos = carPositions[i];
            var bodyGeom = new THREE.BoxGeometry(8, 6, 16);
            var bodyMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
            bodyMesh.position.set(pos.x, 3, pos.z);
            bodyMesh.castShadow = true;
            bodyMesh.receiveShadow = true;
            scene.add(bodyMesh);
            objects.push(bodyMesh);
            for (var w = -1; w <= 1; w += 2) {
                for (var z = -1; z <= 1; z += 2) {
                    var wheelGeom = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
                    var wheelMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
                    var wheelMesh = new THREE.Mesh(wheelGeom, wheelMat);
                    wheelMesh.rotation.z = Math.PI / 2;
                    wheelMesh.position.set(pos.x + w * 3, 2.5, pos.z + z * 6);
                    wheelMesh.castShadow = true;
                    scene.add(wheelMesh);
                    objects.push(wheelMesh);
                }
            }
        }
        var busGeom = new THREE.BoxGeometry(12, 10, 30);
        var busMat = new THREE.MeshLambertMaterial({ color: 0x5a3a3a });
        var busMesh = new THREE.Mesh(busGeom, busMat);
        busMesh.position.set(0, 5, -120);
        busMesh.castShadow = true;
        busMesh.receiveShadow = true;
        scene.add(busMesh);
        objects.push(busMesh);
        for (var i = 0; i < 4; i++) {
            var wheelGeom = new THREE.CylinderGeometry(3, 3, 2, 16);
            var wheelMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
            var wheelMesh = new THREE.Mesh(wheelGeom, wheelMat);
            wheelMesh.rotation.z = Math.PI / 2;
            wheelMesh.position.set(i < 2 ? -4 : 4, 3, -120 + (i % 2) * 20 - 10);
            wheelMesh.castShadow = true;
            scene.add(wheelMesh);
            objects.push(wheelMesh);
        }
    }

    function buildOverpasses() {
        var bridgeGeom = new THREE.BoxGeometry(40, 2, 60);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var bridge1 = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge1.position.set(-80, 30, -80);
        bridge1.castShadow = true;
        bridge1.receiveShadow = true;
        scene.add(bridge1);
        objects.push(bridge1);
        var bridge2 = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge2.position.set(80, 35, 80);
        bridge2.castShadow = true;
        bridge2.receiveShadow = true;
        scene.add(bridge2);
        objects.push(bridge2);
        var supportGeom = new THREE.CylinderGeometry(3, 3, 25, 8);
        var supportMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var supportPositions = [
            { x: -100, z: -100 },
            { x: -60, z: -100 },
            { x: 60, z: 100 },
            { x: 100, z: 100 }
        ];
        for (var i = 0; i < supportPositions.length; i++) {
            var pos = supportPositions[i];
            var support = new THREE.Mesh(supportGeom, supportMat);
            support.position.set(pos.x, 12.5, pos.z);
            support.castShadow = true;
            scene.add(support);
            objects.push(support);
        }
    }

    function buildCrane() {
        var mastGeom = new THREE.BoxGeometry(4, 80, 4);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-120, 40, -200);
        mast.castShadow = true;
        scene.add(mast);
        objects.push(mast);
        var boomGeom = new THREE.BoxGeometry(60, 4, 4);
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var boom = new THREE.Mesh(boomGeom, boomMat);
        boom.position.set(-90, 75, -200);
        boom.castShadow = true;
        scene.add(boom);
        objects.push(boom);
        var hookGeom = new THREE.CylinderGeometry(1.5, 1.5, 15, 8);
        var hookMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var hook = new THREE.Mesh(hookGeom, hookMat);
        hook.position.set(-60, 50, -200);
        hook.castShadow = true;
        scene.add(hook);
        objects.push(hook);
        var cableGeom = new THREE.CylinderGeometry(0.5, 0.5, 25, 8);
        var cableMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var cable = new THREE.Mesh(cableGeom, cableMat);
        cable.position.set(-60, 62.5, -200);
        scene.add(cable);
        objects.push(cable);
    }

    function buildSniperNests() {
        var nestPositions = [
            { x: -80, z: -150, y: 280 },
            { x: 50, z: -200, y: 285 },
            { x: 100, z: -140, y: 275 }
        ];
        for (var i = 0; i < nestPositions.length; i++) {
            var pos = nestPositions[i];
            var platformGeom = new THREE.BoxGeometry(12, 1, 12);
            var platformMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
            var platform = new THREE.Mesh(platformGeom, platformMat);
            platform.position.set(pos.x, pos.y, pos.z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            scene.add(platform);
            objects.push(platform);
            var perchGeom = new THREE.CylinderGeometry(2, 2, 3, 8);
            var perchMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
            var perch = new THREE.Mesh(perchGeom, perchMat);
            perch.position.set(pos.x, pos.y + 2, pos.z);
            perch.castShadow = true;
            scene.add(perch);
            objects.push(perch);
            var railGeom = new THREE.BoxGeometry(12, 2, 0.5);
            var railMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
            var rail1 = new THREE.Mesh(railGeom, railMat);
            rail1.position.set(pos.x, pos.y + 1.5, pos.z - 6);
            rail1.castShadow = true;
            scene.add(rail1);
            objects.push(rail1);
            var rail2 = new THREE.Mesh(railGeom, railMat);
            rail2.position.set(pos.x, pos.y + 1.5, pos.z + 6);
            rail2.castShadow = true;
            scene.add(rail2);
            objects.push(rail2);
        }
    }

    function buildBunkers() {
        var bunkerPositions = [
            { x: -90, z: 30 },
            { x: 90, z: -30 },
            { x: -40, z: 100 },
            { x: 40, z: -100 }
        ];
        for (var i = 0; i < bunkerPositions.length; i++) {
            var pos = bunkerPositions[i];
            var outerGeom = new THREE.BoxGeometry(16, 8, 16);
            var outerMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
            var outer = new THREE.Mesh(outerGeom, outerMat);
            outer.position.set(pos.x, 4, pos.z);
            outer.castShadow = true;
            outer.receiveShadow = true;
            scene.add(outer);
            objects.push(outer);
            var leftWallGeom = new THREE.BoxGeometry(2, 8, 16);
            var leftWallMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
            var leftWall = new THREE.Mesh(leftWallGeom, leftWallMat);
            leftWall.position.set(pos.x - 7, 4, pos.z);
            leftWall.castShadow = true;
            scene.add(leftWall);
            objects.push(leftWall);
            var rightWall = new THREE.Mesh(leftWallGeom, leftWallMat);
            rightWall.position.set(pos.x + 7, 4, pos.z);
            rightWall.castShadow = true;
            scene.add(rightWall);
            objects.push(rightWall);
            var backWallGeom = new THREE.BoxGeometry(16, 8, 2);
            var backWallMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
            var backWall = new THREE.Mesh(backWallGeom, backWallMat);
            backWall.position.set(pos.x, 4, pos.z - 7);
            backWall.castShadow = true;
            scene.add(backWall);
            objects.push(backWall);
        }
    }

    function addNeonSigns() {
        var signData = [
            { x: -40, y: 150, z: -150, color: 0xff0000 },
            { x: 40, y: 160, z: -180, color: 0x00ff00 },
            { x: -80, y: 140, z: 80, color: 0x0000ff },
            { x: 100, y: 170, z: -140, color: 0xffff00 },
            { x: -120, y: 155, z: 120, color: 0xff00ff }
        ];
        for (var i = 0; i < signData.length; i++) {
            var data = signData[i];
            var geom = new THREE.BoxGeometry(20, 12, 1);
            var mat = new THREE.MeshLambertMaterial({
                color: 0x222222,
                emissive: data.color
            });
            var mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(data.x, data.y, data.z);
            mesh.userData.color = data.color;
            scene.add(mesh);
            objects.push(mesh);
            neonSigns.push(mesh);
        }
    }

    function setupLighting() {
        var ambientGeom = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientGeom);
        lights.push(ambientGeom);
        var directionalGeom = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalGeom.position.set(100, 150, 100);
        directionalGeom.castShadow = true;
        directionalGeom.shadow.mapSize.width = 2048;
        directionalGeom.shadow.mapSize.height = 2048;
        directionalGeom.shadow.camera.far = 500;
        directionalGeom.shadow.camera.left = -200;
        directionalGeom.shadow.camera.right = 200;
        directionalGeom.shadow.camera.top = 200;
        directionalGeom.shadow.camera.bottom = -200;
        scene.add(directionalGeom);
        lights.push(directionalGeom);
        explosionLight = new THREE.PointLight(0xff6600, 0.5, 300);
        explosionLight.position.set(-60, 100, -120);
        explosionLight.castShadow = true;
        scene.add(explosionLight);
        lights.push(explosionLight);
        var streetLight1 = new THREE.PointLight(0xffff99, 0.6, 80);
        streetLight1.position.set(-80, 20, 0);
        streetLight1.castShadow = true;
        scene.add(streetLight1);
        lights.push(streetLight1);
        var streetLight2 = new THREE.PointLight(0xffff99, 0.6, 80);
        streetLight2.position.set(80, 20, 0);
        streetLight2.castShadow = true;
        scene.add(streetLight2);
        lights.push(streetLight2);
        var neonLight1 = new THREE.PointLight(0xff0000, 0.7, 100);
        neonLight1.position.set(-40, 150, -150);
        scene.add(neonLight1);
        lights.push(neonLight1);
        var neonLight2 = new THREE.PointLight(0x0000ff, 0.7, 100);
        neonLight2.position.set(-80, 140, 80);
        scene.add(neonLight2);
        lights.push(neonLight2);
        addNeonSigns();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
