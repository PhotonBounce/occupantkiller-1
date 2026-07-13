window.SootMill = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var smokeParticles = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        smokeParticles = [];
        buildMillBuilding();
        buildChimneys();
        buildCoalYard();
        buildConveyors();
        buildFurnaces();
        buildStorageSheds();
        buildDefenses();
        setupLighting();
    }

    function buildMillBuilding() {
        var mainGeometry = new THREE.BoxGeometry(30, 20, 15);
        var mainMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var mainBuilding = new THREE.Mesh(mainGeometry, mainMaterial);
        mainBuilding.position.set(0, 10, 0);
        mainBuilding.castShadow = true;
        mainBuilding.receiveShadow = true;
        scene.add(mainBuilding);
        objects.push(mainBuilding);

        var loadingBay1Geometry = new THREE.BoxGeometry(8, 6, 3);
        var loadingBay1Material = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var loadingBay1 = new THREE.Mesh(loadingBay1Geometry, loadingBay1Material);
        loadingBay1.position.set(12, 3, 5);
        loadingBay1.castShadow = true;
        scene.add(loadingBay1);
        objects.push(loadingBay1);

        var loadingBay2Geometry = new THREE.BoxGeometry(8, 6, 3);
        var loadingBay2 = new THREE.Mesh(loadingBay2Geometry, loadingBay1Material);
        loadingBay2.position.set(12, 3, -5);
        loadingBay2.castShadow = true;
        scene.add(loadingBay2);
        objects.push(loadingBay2);

        var loadingBay3Geometry = new THREE.BoxGeometry(8, 6, 3);
        var loadingBay3 = new THREE.Mesh(loadingBay3Geometry, loadingBay1Material);
        loadingBay3.position.set(-12, 3, 5);
        loadingBay3.castShadow = true;
        scene.add(loadingBay3);
        objects.push(loadingBay3);

        var loadingBay4Geometry = new THREE.BoxGeometry(8, 6, 3);
        var loadingBay4 = new THREE.Mesh(loadingBay4Geometry, loadingBay1Material);
        loadingBay4.position.set(-12, 3, -5);
        loadingBay4.castShadow = true;
        scene.add(loadingBay4);
        objects.push(loadingBay4);

        var roofSection1Geometry = new THREE.BoxGeometry(32, 1, 17);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
        var roofSection1 = new THREE.Mesh(roofSection1Geometry, roofMaterial);
        roofSection1.position.set(0, 20, 0);
        roofSection1.castShadow = true;
        scene.add(roofSection1);
        objects.push(roofSection1);

        var roofSection2Geometry = new THREE.BoxGeometry(1, 2, 17);
        var roofSection2 = new THREE.Mesh(roofSection2Geometry, roofMaterial);
        roofSection2.position.set(16, 21, 0);
        roofSection2.castShadow = true;
        scene.add(roofSection2);
        objects.push(roofSection2);

        var roofSection3Geometry = new THREE.BoxGeometry(1, 2, 17);
        var roofSection3 = new THREE.Mesh(roofSection3Geometry, roofMaterial);
        roofSection3.position.set(-16, 21, 0);
        roofSection3.castShadow = true;
        scene.add(roofSection3);
        objects.push(roofSection3);
    }

    function buildChimneys() {
        var chimney1Geometry = new THREE.CylinderGeometry(2, 2.5, 25, 16);
        var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2420 });
        var chimney1 = new THREE.Mesh(chimney1Geometry, chimneyMaterial);
        chimney1.position.set(10, 12.5, 6);
        chimney1.castShadow = true;
        scene.add(chimney1);
        objects.push(chimney1);

        var chimney2Geometry = new THREE.CylinderGeometry(2, 2.5, 28, 16);
        var chimney2 = new THREE.Mesh(chimney2Geometry, chimneyMaterial);
        chimney2.position.set(-10, 14, 6);
        chimney2.castShadow = true;
        scene.add(chimney2);
        objects.push(chimney2);

        var chimney3Geometry = new THREE.CylinderGeometry(2.2, 2.8, 22, 16);
        var chimney3 = new THREE.Mesh(chimney3Geometry, chimneyMaterial);
        chimney3.position.set(10, 11, -6);
        chimney3.castShadow = true;
        scene.add(chimney3);
        objects.push(chimney3);

        var chimney4Geometry = new THREE.CylinderGeometry(2, 2.5, 30, 16);
        var chimney4 = new THREE.Mesh(chimney4Geometry, chimneyMaterial);
        chimney4.position.set(-10, 15, -6);
        chimney4.castShadow = true;
        scene.add(chimney4);
        objects.push(chimney4);

        var rim1Geometry = new THREE.CylinderGeometry(2.8, 2.5, 0.5, 16);
        var rimMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3430 });
        var rim1 = new THREE.Mesh(rim1Geometry, rimMaterial);
        rim1.position.set(10, 24.75, 6);
        scene.add(rim1);
        objects.push(rim1);

        var rim2 = new THREE.Mesh(rim1Geometry, rimMaterial);
        rim2.position.set(-10, 27.5, 6);
        scene.add(rim2);
        objects.push(rim2);

        var rim3 = new THREE.Mesh(rim1Geometry, rimMaterial);
        rim3.position.set(10, 22, -6);
        scene.add(rim3);
        objects.push(rim3);

        var rim4 = new THREE.Mesh(rim1Geometry, rimMaterial);
        rim4.position.set(-10, 30, -6);
        scene.add(rim4);
        objects.push(rim4);

        buildSmokePlume();
    }

    function buildSmokePlume() {
        var smokeMaterial = new THREE.MeshLambertMaterial({ color: 0x444444, transparent: true, opacity: 0.6 });

        var smokePositions = [
            { base: [10, 24.75, 6], height: 25 },
            { base: [-10, 27.5, 6], height: 28 },
            { base: [10, 22, -6], height: 22 },
            { base: [-10, 30, -6], height: 30 }
        ];

        for (var i = 0; i < smokePositions.length; i++) {
            var pos = smokePositions[i];
            for (var j = 0; j < 4; j++) {
                var smokeGeometry = new THREE.SphereGeometry(1.5 + j * 0.8, 8, 8);
                var smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
                smoke.position.set(pos.base[0], pos.base[1] + pos.height + j * 3, pos.base[2]);
                smoke.userData = {
                    baseY: smoke.position.y,
                    driftX: (Math.random() - 0.5) * 0.01,
                    driftZ: (Math.random() - 0.5) * 0.01,
                    floatSpeed: 0.02 + Math.random() * 0.01
                };
                scene.add(smoke);
                objects.push(smoke);
                smokeParticles.push(smoke);
            }
        }
    }

    function buildCoalYard() {
        var pileGeometry = new THREE.BoxGeometry(20, 3, 12);
        var coalMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var coalpile = new THREE.Mesh(pileGeometry, coalMaterial);
        coalpile.position.set(-20, 1.5, 0);
        coalpile.castShadow = true;
        scene.add(coalpile);
        objects.push(coalpile);

        var darkCoalMaterial = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
        for (var i = 0; i < 20; i++) {
            var chunkGeometry = new THREE.SphereGeometry(0.8 + Math.random() * 0.6, 6, 6);
            var chunk = new THREE.Mesh(chunkGeometry, darkCoalMaterial);
            chunk.position.set(-25 + Math.random() * 18, 4 + Math.random() * 3, -8 + Math.random() * 12);
            chunk.castShadow = true;
            scene.add(chunk);
            objects.push(chunk);
        }

        for (var j = 0; j < 15; j++) {
            var chunk2Geometry = new THREE.SphereGeometry(1 + Math.random() * 0.7, 6, 6);
            var chunk2 = new THREE.Mesh(chunk2Geometry, coalMaterial);
            chunk2.position.set(-15 + Math.random() * 12, 5 + Math.random() * 2, -6 + Math.random() * 10);
            chunk2.castShadow = true;
            scene.add(chunk2);
            objects.push(chunk2);
        }
    }

    function buildConveyors() {
        var conveyorMainGeometry = new THREE.BoxGeometry(25, 2, 3);
        var conveyorMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var conveyorMain = new THREE.Mesh(conveyorMainGeometry, conveyorMaterial);
        conveyorMain.position.set(-5, 8, 10);
        conveyorMain.rotation.z = 0.3;
        conveyorMain.castShadow = true;
        scene.add(conveyorMain);
        objects.push(conveyorMain);

        var drumGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3.5, 12);
        var drumMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var drum1 = new THREE.Mesh(drumGeometry, drumMaterial);
        drum1.rotation.z = Math.PI / 2;
        drum1.position.set(5, 10, 10);
        drum1.castShadow = true;
        scene.add(drum1);
        objects.push(drum1);

        var drum2 = new THREE.Mesh(drumGeometry, drumMaterial);
        drum2.rotation.z = Math.PI / 2;
        drum2.position.set(-20, 4, 10);
        drum2.castShadow = true;
        scene.add(drum2);
        objects.push(drum2);

        var supportGeometry = new THREE.BoxGeometry(1, 8, 1);
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        for (var i = 0; i < 4; i++) {
            var support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(-8 + i * 5, 4, 12);
            support.castShadow = true;
            scene.add(support);
            objects.push(support);
        }

        var hopper1Geometry = new THREE.BoxGeometry(4, 3, 4);
        var hopperMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var hopper1 = new THREE.Mesh(hopper1Geometry, hopperMaterial);
        hopper1.position.set(-15, 12, 10);
        hopper1.rotation.x = 0.4;
        hopper1.castShadow = true;
        scene.add(hopper1);
        objects.push(hopper1);

        var hopper2Geometry = new THREE.BoxGeometry(3.5, 2.5, 3.5);
        var hopper2 = new THREE.Mesh(hopper2Geometry, hopperMaterial);
        hopper2.position.set(-15, 14.5, 10);
        hopper2.rotation.x = -0.3;
        hopper2.castShadow = true;
        scene.add(hopper2);
        objects.push(hopper2);
    }

    function buildFurnaces() {
        var furnaceGeometry = new THREE.BoxGeometry(4, 5, 4);
        var furnaceMaterial = new THREE.MeshLambertMaterial({ color: 0x4a2a1a });
        var furnaceCount = 6;
        for (var i = 0; i < furnaceCount; i++) {
            var furnace = new THREE.Mesh(furnaceGeometry, furnaceMaterial);
            var xpos = -12 + i * 4;
            furnace.position.set(xpos, 2.5, -8);
            furnace.castShadow = true;
            scene.add(furnace);
            objects.push(furnace);

            var flameGeometry = new THREE.SphereGeometry(1.5, 8, 8);
            var flameMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
            var flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.set(xpos, 3, -8);
            flame.userData = { baseY: flame.position.y, floatSpeed: 0.05 };
            scene.add(flame);
            objects.push(flame);
            smokeParticles.push(flame);
        }

        var coolGeometry = new THREE.CylinderGeometry(3.5, 3.5, 8, 16);
        var coolMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var cooler = new THREE.Mesh(coolGeometry, coolMaterial);
        cooler.position.set(25, 4, -10);
        cooler.castShadow = true;
        scene.add(cooler);
        objects.push(cooler);

        var coneGeometry = new THREE.ConeGeometry(4.2, 2, 16);
        var coneMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        var conePart = new THREE.Mesh(coneGeometry, coneMaterial);
        conePart.position.set(25, 8, -10);
        conePart.castShadow = true;
        scene.add(conePart);
        objects.push(conePart);
    }

    function buildStorageSheds() {
        var shed1Geometry = new THREE.BoxGeometry(22, 8, 6);
        var shedMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var shed1 = new THREE.Mesh(shed1Geometry, shedMaterial);
        shed1.position.set(5, 4, -15);
        shed1.castShadow = true;
        scene.add(shed1);
        objects.push(shed1);

        var roofGeometry = new THREE.BoxGeometry(24, 1, 7);
        var roofMatShed = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var roof1 = new THREE.Mesh(roofGeometry, roofMatShed);
        roof1.position.set(5, 8, -15);
        roof1.castShadow = true;
        scene.add(roof1);
        objects.push(roof1);

        for (var i = 0; i < 5; i++) {
            var corrugatedGeometry = new THREE.BoxGeometry(4, 0.5, 7);
            var corrugated = new THREE.Mesh(corrugatedGeometry, roofMatShed);
            corrugated.position.set(-5 + i * 5, 8.3, -15);
            scene.add(corrugated);
            objects.push(corrugated);
        }

        var shed2Geometry = new THREE.BoxGeometry(18, 7, 5);
        var shed2 = new THREE.Mesh(shed2Geometry, shedMaterial);
        shed2.position.set(22, 3.5, 15);
        shed2.castShadow = true;
        scene.add(shed2);
        objects.push(shed2);

        var roof2Geometry = new THREE.BoxGeometry(20, 1, 6);
        var roof2 = new THREE.Mesh(roof2Geometry, roofMatShed);
        roof2.position.set(22, 7, 15);
        roof2.castShadow = true;
        scene.add(roof2);
        objects.push(roof2);

        var shed3Geometry = new THREE.BoxGeometry(10, 6, 14);
        var shed3 = new THREE.Mesh(shed3Geometry, shedMaterial);
        shed3.position.set(-28, 3, 0);
        shed3.castShadow = true;
        scene.add(shed3);
        objects.push(shed3);

        var roof3Geometry = new THREE.BoxGeometry(12, 1, 16);
        var roof3 = new THREE.Mesh(roof3Geometry, roofMatShed);
        roof3.position.set(-28, 6, 0);
        roof3.castShadow = true;
        scene.add(roof3);
        objects.push(roof3);
    }

    function buildDefenses() {
        var barracksGeometry = new THREE.BoxGeometry(16, 8, 10);
        var barracksMaterial = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        var barracks = new THREE.Mesh(barracksGeometry, barracksMaterial);
        barracks.position.set(-18, 4, 12);
        barracks.castShadow = true;
        scene.add(barracks);
        objects.push(barracks);

        var roofGeometry = new THREE.BoxGeometry(18, 1, 12);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
        var barracksRoof = new THREE.Mesh(roofGeometry, roofMat);
        barracksRoof.position.set(-18, 8, 12);
        barracksRoof.castShadow = true;
        scene.add(barracksRoof);
        objects.push(barracksRoof);

        var boothGeometry = new THREE.BoxGeometry(4, 5, 4);
        var boothMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var booth = new THREE.Mesh(boothGeometry, boothMaterial);
        booth.position.set(-8, 2.5, 18);
        booth.castShadow = true;
        scene.add(booth);
        objects.push(booth);

        var boothRoofGeometry = new THREE.BoxGeometry(5, 0.5, 5);
        var boothRoof = new THREE.Mesh(boothRoofGeometry, roofMat);
        boothRoof.position.set(-8, 5, 18);
        boothRoof.castShadow = true;
        scene.add(boothRoof);
        objects.push(boothRoof);

        var railGeometry = new THREE.BoxGeometry(30, 0.5, 1.5);
        var railMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var rail1 = new THREE.Mesh(railGeometry, railMaterial);
        rail1.position.set(0, 2, -20);
        rail1.castShadow = true;
        scene.add(rail1);
        objects.push(rail1);

        var rail2 = new THREE.Mesh(railGeometry, railMaterial);
        rail2.position.set(0, 2, -22);
        rail2.castShadow = true;
        scene.add(rail2);
        objects.push(rail2);

        var wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 1, 12);
        var wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        for (var i = 0; i < 4; i++) {
            var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(-20 + i * 15, 1, -20);
            wheel.castShadow = true;
            scene.add(wheel);
            objects.push(wheel);
        }

        for (var j = 0; j < 4; j++) {
            var wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel2.rotation.z = Math.PI / 2;
            wheel2.position.set(-20 + j * 15, 1, -22);
            wheel2.castShadow = true;
            scene.add(wheel2);
            objects.push(wheel2);
        }

        var carGeometry = new THREE.BoxGeometry(8, 4, 2);
        var carMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var railcar = new THREE.Mesh(carGeometry, carMaterial);
        railcar.position.set(-5, 3.5, -21);
        railcar.castShadow = true;
        scene.add(railcar);
        objects.push(railcar);

        var ashGeometry = new THREE.ConeGeometry(4, 5, 12);
        var ashMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        var ashHeap1 = new THREE.Mesh(ashGeometry, ashMaterial);
        ashHeap1.position.set(30, 2.5, 0);
        ashHeap1.castShadow = true;
        scene.add(ashHeap1);
        objects.push(ashHeap1);

        var ashGeometry2 = new THREE.ConeGeometry(3.5, 4, 12);
        var ashHeap2 = new THREE.Mesh(ashGeometry2, ashMaterial);
        ashHeap2.position.set(35, 2, 5);
        ashHeap2.castShadow = true;
        scene.add(ashHeap2);
        objects.push(ashHeap2);

        var ashGeometry3 = new THREE.ConeGeometry(3, 3.5, 12);
        var ashHeap3 = new THREE.Mesh(ashGeometry3, ashMaterial);
        ashHeap3.position.set(32, 1.75, -6);
        ashHeap3.castShadow = true;
        scene.add(ashHeap3);
        objects.push(ashHeap3);
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
        directionalLight.position.set(30, 40, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var furnaceLight = new THREE.PointLight(0xff6600, 1, 30);
        furnaceLight.position.set(-10, 5, -8);
        scene.add(furnaceLight);
        lights.push(furnaceLight);

        var furnaceLight2 = new THREE.PointLight(0xff6600, 0.8, 28);
        furnaceLight2.position.set(2, 5, -8);
        scene.add(furnaceLight2);
        lights.push(furnaceLight2);
    }

    function update(delta) {
        for (var i = 0; i < smokeParticles.length; i++) {
            var particle = smokeParticles[i];
            if (particle.userData) {
                particle.position.y += particle.userData.floatSpeed;
                if (particle.userData.driftX) {
                    particle.position.x += particle.userData.driftX;
                }
                if (particle.userData.driftZ) {
                    particle.position.z += particle.userData.driftZ;
                }
                if (particle.userData.baseY && particle.position.y > particle.userData.baseY + 40) {
                    particle.position.y = particle.userData.baseY;
                }
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
        }
        objects = [];
        lights = [];
        smokeParticles = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
