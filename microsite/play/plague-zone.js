window.PlagueZone = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var particles = [];
    var aerosolSpheres = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        particles = [];
        aerosolSpheres = [];
        buildQuarantineWalls();
        buildInfectedBuildings();
        buildMedicalTents();
        buildContainment();
        buildAerosol();
        buildDecontamination();
        buildSprayTowers();
        buildInfectedVegetation();
        setupLighting();
    }

    function buildQuarantineWalls() {
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        var dangerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

        var wallGeometry = new THREE.BoxGeometry(200, 8, 1);
        var northWall = new THREE.Mesh(wallGeometry, wallMaterial);
        northWall.position.set(0, 4, -100);
        scene.add(northWall);
        objects.push(northWall);

        var southWall = new THREE.Mesh(wallGeometry, wallMaterial);
        southWall.position.set(0, 4, 100);
        scene.add(southWall);
        objects.push(southWall);

        var eastWallGeometry = new THREE.BoxGeometry(1, 8, 200);
        var eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        eastWall.position.set(100, 4, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        var westWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
        westWall.position.set(-100, 4, 0);
        scene.add(westWall);
        objects.push(westWall);

        var biohazardGeometry = new THREE.BoxGeometry(8, 8, 0.5);
        for (var i = 0; i < 12; i++) {
            var biohazard = new THREE.Mesh(biohazardGeometry, dangerMaterial);
            biohazard.position.set(-90 + i * 15, 4, -100);
            scene.add(biohazard);
            objects.push(biohazard);
        }

        for (var i = 0; i < 12; i++) {
            var biohazard2 = new THREE.Mesh(biohazardGeometry, dangerMaterial);
            biohazard2.position.set(-90 + i * 15, 4, 100);
            scene.add(biohazard2);
            objects.push(biohazard2);
        }

        for (var i = 0; i < 12; i++) {
            var biohazard3 = new THREE.Mesh(biohazardGeometry, dangerMaterial);
            biohazard3.position.set(100, 4, -90 + i * 15);
            scene.add(biohazard3);
            objects.push(biohazard3);
        }

        for (var i = 0; i < 12; i++) {
            var biohazard4 = new THREE.Mesh(biohazardGeometry, dangerMaterial);
            biohazard4.position.set(-100, 4, -90 + i * 15);
            scene.add(biohazard4);
            objects.push(biohazard4);
        }
    }

    function buildInfectedBuildings() {
        var infectedMaterial = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
        var darkMaterial = new THREE.MeshLambertMaterial({ color: 0x1a0033 });

        var buildingGeometry = new THREE.BoxGeometry(30, 25, 30);
        var building1 = new THREE.Mesh(buildingGeometry, infectedMaterial);
        building1.position.set(-50, 12.5, -50);
        scene.add(building1);
        objects.push(building1);

        var crackGeometry = new THREE.BoxGeometry(4, 25, 0.5);
        var crack1 = new THREE.Mesh(crackGeometry, darkMaterial);
        crack1.position.set(-50, 12.5, -65);
        scene.add(crack1);
        objects.push(crack1);

        var building2 = new THREE.Mesh(buildingGeometry, infectedMaterial);
        building2.position.set(50, 12.5, -50);
        scene.add(building2);
        objects.push(building2);

        var crack2 = new THREE.Mesh(crackGeometry, darkMaterial);
        crack2.position.set(50, 12.5, -65);
        scene.add(crack2);
        objects.push(crack2);

        var building3 = new THREE.Mesh(buildingGeometry, infectedMaterial);
        building3.position.set(-50, 12.5, 50);
        scene.add(building3);
        objects.push(building3);

        var crack3 = new THREE.Mesh(crackGeometry, darkMaterial);
        crack3.position.set(-50, 12.5, 65);
        scene.add(crack3);
        objects.push(crack3);

        var building4 = new THREE.Mesh(buildingGeometry, infectedMaterial);
        building4.position.set(50, 12.5, 50);
        scene.add(building4);
        objects.push(building4);

        var crack4 = new THREE.Mesh(crackGeometry, darkMaterial);
        crack4.position.set(50, 12.5, 65);
        scene.add(crack4);
        objects.push(crack4);

        var decayGeometry = new THREE.BoxGeometry(2, 25, 30);
        for (var i = 0; i < 8; i++) {
            var decay = new THREE.Mesh(decayGeometry, darkMaterial);
            decay.position.set(-65 + i * 4, 12.5, -50);
            scene.add(decay);
            objects.push(decay);
        }
    }

    function buildMedicalTents() {
        var tentMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var floorMaterial = new THREE.MeshLambertMaterial({ color: 0xDCDCDC });

        var roofGeometry = new THREE.ConeGeometry(12, 15, 8);
        var floor1Geometry = new THREE.BoxGeometry(20, 0.5, 20);

        for (var i = 0; i < 6; i++) {
            var tent = new THREE.Mesh(roofGeometry, tentMaterial);
            tent.position.set(-60 + i * 20, 7.5, 20);
            scene.add(tent);
            objects.push(tent);

            var floor = new THREE.Mesh(floor1Geometry, floorMaterial);
            floor.position.set(-60 + i * 20, 0.25, 20);
            scene.add(floor);
            objects.push(floor);
        }

        for (var i = 0; i < 4; i++) {
            var tent2 = new THREE.Mesh(roofGeometry, tentMaterial);
            tent2.position.set(-60 + i * 20, 7.5, 50);
            scene.add(tent2);
            objects.push(tent2);

            var floor2 = new THREE.Mesh(floor1Geometry, floorMaterial);
            floor2.position.set(-60 + i * 20, 0.25, 50);
            scene.add(floor2);
            objects.push(floor2);
        }

        var supportGeometry = new THREE.CylinderGeometry(1, 1, 8, 8);
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        for (var i = 0; i < 4; i++) {
            var support = new THREE.Mesh(supportGeometry, supportMaterial);
            support.position.set(-55 + i * 20, 4, 20);
            scene.add(support);
            objects.push(support);
        }
    }

    function buildContainment() {
        var containerMaterial = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
        var airlockMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

        var podGeometry = new THREE.CylinderGeometry(8, 8, 15, 12);

        for (var i = 0; i < 5; i++) {
            var pod = new THREE.Mesh(podGeometry, containerMaterial);
            pod.position.set(-70 + i * 30, 7.5, -20);
            scene.add(pod);
            objects.push(pod);

            var airlockGeometry = new THREE.BoxGeometry(4, 12, 3);
            var airlock = new THREE.Mesh(airlockGeometry, airlockMaterial);
            airlock.position.set(-70 + i * 30, 6, -27);
            scene.add(airlock);
            objects.push(airlock);
        }

        var biohazardBarrelGeometry = new THREE.CylinderGeometry(3, 3, 6, 16);
        var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                var barrel = new THREE.Mesh(biohazardBarrelGeometry, barrelMaterial);
                barrel.position.set(-40 + i * 8, 3, 60 + j * 8);
                scene.add(barrel);
                objects.push(barrel);
            }
        }

        var bandGeometry = new THREE.CylinderGeometry(3.2, 3.2, 1, 16);
        var bandMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                var band = new THREE.Mesh(bandGeometry, bandMaterial);
                band.position.set(-40 + i * 8, 2.5, 60 + j * 8);
                scene.add(band);
                objects.push(band);
            }
        }
    }

    function buildAerosol() {
        var aerosolMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCC00 });
        var particleGeometry = new THREE.SphereGeometry(0.8, 6, 6);

        for (var i = 0; i < 80; i++) {
            var sphere = new THREE.Mesh(particleGeometry, aerosolMaterial);
            sphere.position.set(
                Math.random() * 180 - 90,
                Math.random() * 40 + 5,
                Math.random() * 180 - 90
            );
            scene.add(sphere);
            objects.push(sphere);
            aerosolSpheres.push({
                mesh: sphere,
                vx: (Math.random() - 0.5) * 0.02,
                vy: (Math.random() - 0.5) * 0.01,
                vz: (Math.random() - 0.5) * 0.02
            });
        }
    }

    function buildDecontamination() {
        var archMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var uvMaterial = new THREE.MeshLambertMaterial({ color: 0x9900FF });

        var archGeometry = new THREE.BoxGeometry(20, 25, 1);

        for (var i = 0; i < 3; i++) {
            var arch = new THREE.Mesh(archGeometry, archMaterial);
            arch.position.set(-40 + i * 40, 12.5, -80);
            scene.add(arch);
            objects.push(arch);

            var uvLightGeometry = new THREE.SphereGeometry(2, 12, 12);
            var uvLight = new THREE.Mesh(uvLightGeometry, uvMaterial);
            uvLight.position.set(-40 + i * 40, 10, -80);
            scene.add(uvLight);
            objects.push(uvLight);
            aerosolSpheres.push({
                mesh: uvLight,
                vx: 0,
                vy: 0.003,
                vz: 0,
                isPulsing: true
            });
        }
    }

    function buildSprayTowers() {
        var poleGeometry = new THREE.CylinderGeometry(0.8, 0.8, 40, 8);
        var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var nozzleMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var nozzleGeometry = new THREE.SphereGeometry(2, 10, 10);

        for (var i = 0; i < 4; i++) {
            var pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(-70 + i * 50, 20, 30);
            scene.add(pole);
            objects.push(pole);

            var nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            nozzle.position.set(-70 + i * 50, 38, 30);
            scene.add(nozzle);
            objects.push(nozzle);
        }

        for (var i = 0; i < 4; i++) {
            var pole2 = new THREE.Mesh(poleGeometry, poleMaterial);
            pole2.position.set(-70 + i * 50, 20, -30);
            scene.add(pole2);
            objects.push(pole2);

            var nozzle2 = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            nozzle2.position.set(-70 + i * 50, 38, -30);
            scene.add(nozzle2);
            objects.push(nozzle2);
        }
    }

    function buildInfectedVegetation() {
        var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x664400 });
        var growthMaterial = new THREE.MeshLambertMaterial({ color: 0x990000 });

        var trunkGeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        var growthGeometry = new THREE.SphereGeometry(4, 12, 12);

        for (var i = 0; i < 6; i++) {
            var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk.position.set(-80 + i * 30, 10, 75);
            scene.add(trunk);
            objects.push(trunk);

            var growth = new THREE.Mesh(growthGeometry, growthMaterial);
            growth.position.set(-80 + i * 30, 22, 75);
            scene.add(growth);
            objects.push(growth);
        }

        for (var i = 0; i < 5; i++) {
            var trunk2 = new THREE.Mesh(trunkGeometry, trunkMaterial);
            trunk2.position.set(-70 + i * 35, 10, -75);
            scene.add(trunk2);
            objects.push(trunk2);

            var growth2 = new THREE.Mesh(growthGeometry, growthMaterial);
            growth2.position.set(-70 + i * 35, 22, -75);
            scene.add(growth2);
            objects.push(growth2);
        }
    }

    function buildIsolationChambers() {
        var chamberMaterial = new THREE.MeshLambertMaterial({ color: 0x333366 });
        var chamberGeometry = new THREE.BoxGeometry(18, 22, 18);

        for (var i = 0; i < 4; i++) {
            var chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
            chamber.position.set(-60 + i * 40, 11, 0);
            scene.add(chamber);
            objects.push(chamber);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFF00, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
        directionalLight.position.set(0, 50, 50);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var hazardLight1 = new THREE.PointLight(0xFF8C00, 1.0, 150);
        hazardLight1.position.set(-80, 15, -80);
        scene.add(hazardLight1);
        lights.push(hazardLight1);

        var hazardLight2 = new THREE.PointLight(0xFF8C00, 1.0, 150);
        hazardLight2.position.set(80, 15, 80);
        scene.add(hazardLight2);
        lights.push(hazardLight2);

        var hazardLight3 = new THREE.PointLight(0xFFFF00, 0.8, 120);
        hazardLight3.position.set(0, 30, 0);
        scene.add(hazardLight3);
        lights.push(hazardLight3);
    }

    function update(delta) {
        for (var i = 0; i < aerosolSpheres.length; i++) {
            var particle = aerosolSpheres[i];
            if (particle.isPulsing) {
                var scale = 1.0 + Math.sin(Date.now() * 0.005) * 0.3;
                particle.mesh.scale.set(scale, scale, scale);
            } else {
                particle.mesh.position.x += particle.vx * 60;
                particle.mesh.position.y += particle.vy * 60;
                particle.mesh.position.z += particle.vz * 60;

                if (particle.mesh.position.x < -95 || particle.mesh.position.x > 95) {
                    particle.vx *= -1;
                }
                if (particle.mesh.position.y < 5 || particle.mesh.position.y > 45) {
                    particle.vy *= -1;
                }
                if (particle.mesh.position.z < -95 || particle.mesh.position.z > 95) {
                    particle.vz *= -1;
                }
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
        particles = [];
        aerosolSpheres = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
