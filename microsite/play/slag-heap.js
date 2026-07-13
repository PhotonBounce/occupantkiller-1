window.SlagHeap = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animationData = {};

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animationData = {
            furnaceGlowPhase: 0,
            smokeRise: 0,
            slagFlow: 0,
            waterSpray: 0
        };

        buildSlagmounds();
        buildSmelter();
        buildConveyors();
        buildCoolingponds();
        buildDefenses();
        buildChimneys();
        buildCranes();
        buildChannels();
        setupLighting();
    }

    function update(delta) {
        animationData.furnaceGlowPhase += delta * 0.8;
        animationData.smokeRise += delta * 0.5;
        animationData.slagFlow += delta * 1.2;
        animationData.waterSpray += delta * 0.9;

        var furnaceLights = [];
        for (var i = 0; i < lights.length; i++) {
            if (lights[i].userData && lights[i].userData.isFurnace) {
                furnaceLights.push(lights[i]);
            }
        }

        for (var i = 0; i < furnaceLights.length; i++) {
            var baseIntensity = 1.2;
            var pulseAmount = 0.5 * Math.sin(animationData.furnaceGlowPhase);
            furnaceLights[i].intensity = baseIntensity + pulseAmount;
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
        animationData = {};
    }

    function buildSlagmounds() {
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var hotMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        var baseGeo = new THREE.BoxGeometry(180, 80, 150);
        var baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(0, 40, 100);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        scene.add(baseMesh);
        objects.push(baseMesh);

        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var radius = 70;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius + 100;

            var sphereGeo = new THREE.SphereGeometry(35 - i * 2, 16, 16);
            var mat = i % 2 === 0 ? darkMat : hotMat;
            var sphere = new THREE.Mesh(sphereGeo, mat);
            sphere.position.set(x, 90 + i * 3, z);
            sphere.castShadow = true;
            sphere.receiveShadow = true;
            scene.add(sphere);
            objects.push(sphere);
        }

        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var radius = 90;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius + 100;

            var smallGeo = new THREE.SphereGeometry(18, 12, 12);
            var smallMesh = new THREE.Mesh(smallGeo, hotMat);
            smallMesh.position.set(x, 75, z);
            smallMesh.castShadow = true;
            scene.add(smallMesh);
            objects.push(smallMesh);
        }

        for (var i = 0; i < 6; i++) {
            var rockGeo = new THREE.BoxGeometry(40 + i * 5, 25 + i * 3, 35);
            var rockMat = i % 2 === 0 ? baseMat : darkMat;
            var rock = new THREE.Mesh(rockGeo, rockMat);
            rock.position.set(-120 + i * 15, 55 + i * 8, 120 - i * 10);
            rock.rotation.set(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3);
            rock.castShadow = true;
            scene.add(rock);
            objects.push(rock);
        }
    }

    function buildSmelter() {
        var structMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var furnaceMat = new THREE.MeshLambertMaterial({ color: 0x330000 });

        var buildingGeo = new THREE.BoxGeometry(120, 100, 100);
        var building = new THREE.Mesh(buildingGeo, structMat);
        building.position.set(-150, 50, 0);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
        objects.push(building);

        for (var i = 0; i < 3; i++) {
            var furnaceGeo = new THREE.CylinderGeometry(25, 25, 80, 16);
            var furnace = new THREE.Mesh(furnaceGeo, furnaceMat);
            furnace.position.set(-180 + i * 40, 60, -20);
            furnace.castShadow = true;
            scene.add(furnace);
            objects.push(furnace);

            var doorGeo = new THREE.BoxGeometry(20, 30, 8);
            var doorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var door = new THREE.Mesh(doorGeo, doorMat);
            door.position.set(-180 + i * 40, 50, -8);
            scene.add(door);
            objects.push(door);
        }

        var furnaceEntranceGeo = new THREE.BoxGeometry(60, 70, 40);
        var entrance = new THREE.Mesh(furnaceEntranceGeo, furnaceMat);
        entrance.position.set(-150, 45, 35);
        entrance.castShadow = true;
        scene.add(entrance);
        objects.push(entrance);

        for (var i = 0; i < 4; i++) {
            var supportGeo = new THREE.CylinderGeometry(8, 8, 100, 12);
            var support = new THREE.Mesh(supportGeo, structMat);
            support.position.set(-180 + i * 30, 50, -30 + i * 20);
            scene.add(support);
            objects.push(support);
        }
    }

    function buildConveyors() {
        var beltMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var frameMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

        var frameGeo = new THREE.BoxGeometry(30, 15, 200);
        var frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(-50, 100, 50);
        frame.rotation.z = 0.3;
        frame.castShadow = true;
        scene.add(frame);
        objects.push(frame);

        var beltGeo = new THREE.BoxGeometry(25, 8, 190);
        var belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.set(-50, 105, 50);
        belt.rotation.z = 0.3;
        belt.castShadow = true;
        scene.add(belt);
        objects.push(belt);

        for (var i = 0; i < 12; i++) {
            var pulleyGeo = new THREE.CylinderGeometry(12, 12, 8, 16);
            var pulley = new THREE.Mesh(pulleyGeo, frameMat);
            pulley.position.set(-60 + i * 20, 95, 50 + i * 5);
            pulley.rotation.z = 0.3;
            scene.add(pulley);
            objects.push(pulley);
        }

        var beltFrame2Geo = new THREE.BoxGeometry(30, 15, 180);
        var beltFrame2 = new THREE.Mesh(beltFrame2Geo, frameMat);
        beltFrame2.position.set(80, 85, -80);
        beltFrame2.rotation.z = -0.2;
        beltFrame2.castShadow = true;
        scene.add(beltFrame2);
        objects.push(beltFrame2);

        var belt2Geo = new THREE.BoxGeometry(25, 8, 170);
        var belt2 = new THREE.Mesh(belt2Geo, beltMat);
        belt2.position.set(80, 90, -80);
        belt2.rotation.z = -0.2;
        belt2.castShadow = true;
        scene.add(belt2);
        objects.push(belt2);
    }

    function buildCoolingponds() {
        var pondMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
        var steamMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });

        var pondGeo = new THREE.BoxGeometry(120, 30, 100);
        var pond = new THREE.Mesh(pondGeo, pondMat);
        pond.position.set(150, 15, 80);
        pond.castShadow = true;
        pond.receiveShadow = true;
        scene.add(pond);
        objects.push(pond);

        for (var i = 0; i < 20; i++) {
            var x = 150 - 60 + Math.random() * 120;
            var z = 80 - 50 + Math.random() * 100;
            var steamGeo = new THREE.SphereGeometry(8 + Math.random() * 12, 8, 8);
            var steam = new THREE.Mesh(steamGeo, steamMat);
            steam.position.set(x, 50 + i * 3, z);
            steam.userData.steamIndex = i;
            scene.add(steam);
            objects.push(steam);
        }

        for (var i = 0; i < 8; i++) {
            var wallGeo = new THREE.BoxGeometry(10, 30, 100);
            var wallMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(90 + i * 30, 15, 80);
            wall.castShadow = true;
            scene.add(wall);
            objects.push(wall);
        }

        var pondDrainGeo = new THREE.CylinderGeometry(15, 15, 5, 12);
        var drain = new THREE.Mesh(pondDrainGeo, pondMat);
        drain.position.set(170, 0, 50);
        scene.add(drain);
        objects.push(drain);
    }

    function buildDefenses() {
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        for (var i = 0; i < 6; i++) {
            var angle = (i / 6) * Math.PI * 2;
            var radius = 200;
            var x = Math.cos(angle) * radius;
            var z = Math.sin(angle) * radius + 50;

            var sandbagGeo = new THREE.BoxGeometry(40, 35, 50);
            var sandbag = new THREE.Mesh(sandbagGeo, sandbagMat);
            sandbag.position.set(x, 20, z);
            sandbag.castShadow = true;
            scene.add(sandbag);
            objects.push(sandbag);

            var gunposGeo = new THREE.CylinderGeometry(8, 8, 15, 8);
            var gunpos = new THREE.Mesh(gunposGeo, bunkerMat);
            gunpos.position.set(x, 55, z);
            scene.add(gunpos);
            objects.push(gunpos);
        }

        for (var i = 0; i < 4; i++) {
            var bunkerGeo = new THREE.BoxGeometry(50, 40, 60);
            var bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
            bunker.position.set(-220 + i * 80, 25, -150);
            bunker.castShadow = true;
            scene.add(bunker);
            objects.push(bunker);
        }

        for (var i = 0; i < 8; i++) {
            var fencePostGeo = new THREE.CylinderGeometry(5, 5, 40, 8);
            var fencePost = new THREE.Mesh(fencePostGeo, bunkerMat);
            fencePost.position.set(-280, 20, -200 + i * 50);
            scene.add(fencePost);
            objects.push(fencePost);
        }
    }

    function buildChimneys() {
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var smokeMat = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });

        for (var i = 0; i < 3; i++) {
            var chimneyGeo = new THREE.CylinderGeometry(18, 20, 140, 12);
            var chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
            chimney.position.set(-180 + i * 40, 120, -40);
            chimney.castShadow = true;
            scene.add(chimney);
            objects.push(chimney);

            for (var j = 0; j < 8; j++) {
                var smokeGeo = new THREE.SphereGeometry(10 + Math.random() * 8, 8, 8);
                var smoke = new THREE.Mesh(smokeGeo, smokeMat);
                smoke.position.set(-180 + i * 40 + (Math.random() - 0.5) * 20, 180 + j * 15, -40 + (Math.random() - 0.5) * 15);
                smoke.userData.smokeAge = j;
                scene.add(smoke);
                objects.push(smoke);
            }
        }

        var exhaustStackGeo = new THREE.CylinderGeometry(25, 25, 120, 16);
        var exhaustStack = new THREE.Mesh(exhaustStackGeo, chimneyMat);
        exhaustStack.position.set(-150, 130, 20);
        exhaustStack.castShadow = true;
        scene.add(exhaustStack);
        objects.push(exhaustStack);
    }

    function buildCranes() {
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var ladleMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });

        var mastGeo = new THREE.CylinderGeometry(12, 12, 160, 12);
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(-80, 80, 60);
        mast.castShadow = true;
        scene.add(mast);
        objects.push(mast);

        var boomGeo = new THREE.BoxGeometry(150, 12, 12);
        var boom = new THREE.Mesh(boomGeo, boomMat);
        boom.position.set(-80, 155, 60);
        boom.castShadow = true;
        scene.add(boom);
        objects.push(boom);

        var cableGeo = new THREE.CylinderGeometry(2, 2, 50, 6);
        var cable = new THREE.Mesh(cableGeo, mastMat);
        cable.position.set(-20, 130, 60);
        scene.add(cable);
        objects.push(cable);

        var ladleGeo = new THREE.CylinderGeometry(22, 25, 35, 16);
        var ladle = new THREE.Mesh(ladleGeo, ladleMat);
        ladle.position.set(-20, 90, 60);
        ladle.castShadow = true;
        scene.add(ladle);
        objects.push(ladle);

        var ladleRimGeo = new THREE.CylinderGeometry(25, 28, 5, 16);
        var ladleRim = new THREE.Mesh(ladleRimGeo, ladleMat);
        ladleRim.position.set(-20, 115, 60);
        scene.add(ladleRim);
        objects.push(ladleRim);

        var crane2MastGeo = new THREE.CylinderGeometry(10, 10, 140, 12);
        var crane2Mast = new THREE.Mesh(crane2MastGeo, mastMat);
        crane2Mast.position.set(120, 70, -100);
        crane2Mast.castShadow = true;
        scene.add(crane2Mast);
        objects.push(crane2Mast);

        var crane2BoomGeo = new THREE.BoxGeometry(130, 10, 10);
        var crane2Boom = new THREE.Mesh(crane2BoomGeo, boomMat);
        crane2Boom.position.set(120, 140, -100);
        crane2Boom.castShadow = true;
        scene.add(crane2Boom);
        objects.push(crane2Boom);
    }

    function buildChannels() {
        var channelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var slagMat = new THREE.MeshLambertMaterial({ color: 0xff8800 });

        var channel1Geo = new THREE.BoxGeometry(40, 25, 200);
        var channel1 = new THREE.Mesh(channel1Geo, channelMat);
        channel1.position.set(-50, 20, 50);
        channel1.castShadow = true;
        scene.add(channel1);
        objects.push(channel1);

        for (var i = 0; i < 15; i++) {
            var slagBlockGeo = new THREE.BoxGeometry(35, 8, 12);
            var slagBlock = new THREE.Mesh(slagBlockGeo, slagMat);
            slagBlock.position.set(-50, 28 + i * 12, 50 - 100 + i * 14);
            scene.add(slagBlock);
            objects.push(slagBlock);
        }

        var channel2Geo = new THREE.BoxGeometry(35, 20, 180);
        var channel2 = new THREE.Mesh(channel2Geo, channelMat);
        channel2.position.set(80, 15, -80);
        channel2.castShadow = true;
        scene.add(channel2);
        objects.push(channel2);

        for (var i = 0; i < 12; i++) {
            var slagBlobGeo = new THREE.SphereGeometry(8, 8, 8);
            var slagBlob = new THREE.Mesh(slagBlobGeo, slagMat);
            slagBlob.position.set(80 + (Math.random() - 0.5) * 30, 25, -80 - 90 + i * 15);
            scene.add(slagBlob);
            objects.push(slagBlob);
        }

        var channel3Geo = new THREE.BoxGeometry(30, 15, 160);
        var channel3 = new THREE.Mesh(channel3Geo, channelMat);
        channel3.position.set(-200, 25, 0);
        channel3.castShadow = true;
        scene.add(channel3);
        objects.push(channel3);
    }

    function buildWatersprays() {
        var pipeMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x4488ff });

        for (var i = 0; i < 4; i++) {
            var pipeGeo = new THREE.CylinderGeometry(6, 6, 80, 8);
            var pipe = new THREE.Mesh(pipeGeo, pipeMat);
            pipe.position.set(100 + i * 30, 60, 100);
            pipe.castShadow = true;
            scene.add(pipe);
            objects.push(pipe);

            for (var j = 0; j < 5; j++) {
                var dropGeo = new THREE.SphereGeometry(4, 6, 6);
                var drop = new THREE.Mesh(dropGeo, waterMat);
                drop.position.set(100 + i * 30, 50 - j * 8, 100);
                scene.add(drop);
                objects.push(drop);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x666666, 0.8);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(100, 200, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -400;
        directionalLight.shadow.camera.right = 400;
        directionalLight.shadow.camera.top = 400;
        directionalLight.shadow.camera.bottom = -400;
        scene.add(directionalLight);
        lights.push(directionalLight);

        for (var i = 0; i < 3; i++) {
            var furnaceLight = new THREE.PointLight(0xff6600, 1.2, 300);
            furnaceLight.position.set(-180 + i * 40, 80, -20);
            furnaceLight.userData.isFurnace = true;
            scene.add(furnaceLight);
            lights.push(furnaceLight);
        }

        var moundLight = new THREE.PointLight(0xffaa44, 1.0, 250);
        moundLight.position.set(0, 120, 100);
        scene.add(moundLight);
        lights.push(moundLight);

        var pondLight = new THREE.PointLight(0x4488ff, 0.8, 200);
        pondLight.position.set(150, 100, 80);
        scene.add(pondLight);
        lights.push(pondLight);
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
