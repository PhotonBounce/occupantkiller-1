window.SkyCitadel = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var propellerAngles = [];
    var cloudOffsets = [];
    var beaconTimers = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        propellerAngles = [];
        cloudOffsets = [];
        beaconTimers = [];
        buildPlatforms();
        buildTowers();
        buildBridges();
        buildDefenses();
        buildPropellers();
        buildClouds();
        buildElevators();
        buildSupplyPods();
        setupLighting();
    }

    function buildPlatforms() {
        var platformConfigs = [
            { x: 0, y: 0, z: 0, w: 60, h: 8, d: 50, color: 0x808080 },
            { x: -80, y: 35, z: -30, w: 40, h: 6, d: 40, color: 0x707070 },
            { x: 90, y: 28, z: 20, w: 35, h: 6, d: 35, color: 0x808080 },
            { x: -40, y: 50, z: 50, w: 30, h: 5, d: 30, color: 0x909090 }
        ];

        for (var i = 0; i < platformConfigs.length; i++) {
            var cfg = platformConfigs[i];
            var geom = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
            var mat = new THREE.MeshLambertMaterial({ color: cfg.color });
            var mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(cfg.x, cfg.y, cfg.z);
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildTowers() {
        var towerBase = new THREE.BoxGeometry(12, 25, 12);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var mainTower = new THREE.Mesh(towerBase, baseMat);
        mainTower.position.set(0, 20, 0);
        scene.add(mainTower);
        objects.push(mainTower);

        var towerTop = new THREE.BoxGeometry(10, 15, 10);
        var topMesh = new THREE.Mesh(towerTop, baseMat);
        topMesh.position.set(0, 45, 0);
        scene.add(topMesh);
        objects.push(topMesh);

        var turretGeom = new THREE.CylinderGeometry(3, 3, 8, 16);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var turretPositions = [
            { x: 5, y: 50, z: 5 },
            { x: -5, y: 50, z: 5 },
            { x: 5, y: 50, z: -5 },
            { x: -5, y: 50, z: -5 }
        ];
        for (var i = 0; i < turretPositions.length; i++) {
            var turret = new THREE.Mesh(turretGeom, turretMat);
            var pos = turretPositions[i];
            turret.position.set(pos.x, pos.y, pos.z);
            scene.add(turret);
            objects.push(turret);
        }

        var supportTower = new THREE.BoxGeometry(8, 20, 8);
        var supportMesh = new THREE.Mesh(supportTower, baseMat);
        supportMesh.position.set(-80, 45, -30);
        scene.add(supportMesh);
        objects.push(supportMesh);

        var sideTower = new THREE.BoxGeometry(9, 18, 9);
        var sideMesh = new THREE.Mesh(sideTower, baseMat);
        sideMesh.position.set(90, 40, 20);
        scene.add(sideMesh);
        objects.push(sideMesh);
    }

    function buildBridges() {
        var bridgeConfigs = [
            { x1: 0, z1: 0, x2: -80, z2: -30, y: 15, color: 0x707070 },
            { x1: 0, z1: 0, x2: 90, z2: 20, y: 10, color: 0x707070 },
            { x1: -80, z1: -30, x2: 90, z2: 20, y: 20, color: 0x757575 }
        ];

        for (var i = 0; i < bridgeConfigs.length; i++) {
            var cfg = bridgeConfigs[i];
            var dx = cfg.x2 - cfg.x1;
            var dz = cfg.z2 - cfg.z1;
            var len = Math.sqrt(dx * dx + dz * dz);
            var mid = { x: (cfg.x1 + cfg.x2) / 2, z: (cfg.z1 + cfg.z2) / 2 };

            var deckGeom = new THREE.BoxGeometry(len, 3, 8);
            var deckMat = new THREE.MeshLambertMaterial({ color: cfg.color });
            var deck = new THREE.Mesh(deckGeom, deckMat);
            deck.position.set(mid.x, cfg.y, mid.z);
            deck.rotation.y = Math.atan2(dz, dx);
            scene.add(deck);
            objects.push(deck);

            var chainCount = Math.max(2, Math.floor(len / 20));
            for (var j = 0; j < chainCount; j++) {
                var t = j / (chainCount - 1);
                var cx = cfg.x1 + t * dx;
                var cz = cfg.z1 + t * dz;
                var chain = new THREE.CylinderGeometry(1, 1, 12, 8);
                var chainMat = new THREE.MeshLambertMaterial({ color: 0xCC6600 });
                var chainMesh = new THREE.Mesh(chain, chainMat);
                chainMesh.position.set(cx, cfg.y - 8, cz);
                scene.add(chainMesh);
                objects.push(chainMesh);
            }
        }
    }

    function buildDefenses() {
        var wallHeight = 4;
        var wallThickness = 2;
        var platformEdges = [
            { x: 30, y: 8, z: 0, horizontal: true },
            { x: -30, y: 8, z: 0, horizontal: true },
            { x: 0, y: 8, z: 25, horizontal: false },
            { x: 0, y: 8, z: -25, horizontal: false }
        ];

        for (var i = 0; i < platformEdges.length; i++) {
            var edge = platformEdges[i];
            var wallLen = edge.horizontal ? 15 : 15;
            var wallGeom = new THREE.BoxGeometry(wallLen, wallHeight, wallThickness);
            var wallMat = new THREE.MeshLambertMaterial({ color: 0x909090 });
            var wall = new THREE.Mesh(wallGeom, wallMat);
            wall.position.set(edge.x, edge.y, edge.z);
            scene.add(wall);
            objects.push(wall);

            var crenCount = Math.floor(wallLen / 6);
            for (var j = 0; j < crenCount; j++) {
                var crenX = edge.x + (j - crenCount / 2) * 6;
                var crenZ = edge.z;
                var crenGeom = new THREE.BoxGeometry(2, 3, 2);
                var crenMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
                var cren = new THREE.Mesh(crenGeom, crenMat);
                cren.position.set(crenX, edge.y + 3, crenZ);
                scene.add(cren);
                objects.push(cren);
            }
        }

        var gunEmplacements = [
            { x: 28, y: 12, z: 22 },
            { x: -28, y: 12, z: 22 },
            { x: 28, y: 12, z: -22 },
            { x: -28, y: 12, z: -22 }
        ];

        for (var i = 0; i < gunEmplacements.length; i++) {
            var gun = gunEmplacements[i];
            var baseGeom = new THREE.BoxGeometry(4, 3, 4);
            var baseMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var gunBase = new THREE.Mesh(baseGeom, baseMat);
            gunBase.position.set(gun.x, gun.y, gun.z);
            scene.add(gunBase);
            objects.push(gunBase);

            var barrelsPerGun = 2;
            for (var k = 0; k < barrelsPerGun; k++) {
                var barrelGeom = new THREE.CylinderGeometry(0.5, 0.5, 6, 12);
                var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
                var barrel = new THREE.Mesh(barrelGeom, barrelMat);
                barrel.position.set(gun.x + (k - 0.5) * 2, gun.y + 2, gun.z);
                barrel.rotation.z = Math.PI / 6;
                scene.add(barrel);
                objects.push(barrel);
            }
        }
    }

    function buildPropellers() {
        var platformProps = [
            { x: 0, y: 0, z: 0 },
            { x: -80, y: 35, z: -30 },
            { x: 90, y: 28, z: 20 },
            { x: -40, y: 50, z: 50 }
        ];

        for (var i = 0; i < platformProps.length; i++) {
            var pPos = platformProps[i];
            var propPositions = [
                { dx: 20, dz: 15 },
                { dx: -20, dz: 15 },
                { dx: 20, dz: -15 },
                { dx: -20, dz: -15 }
            ];

            for (var j = 0; j < propPositions.length; j++) {
                var pProp = propPositions[j];
                var px = pPos.x + pProp.dx;
                var py = pPos.y - 6;
                var pz = pPos.z + pProp.dz;

                var podGeom = new THREE.CylinderGeometry(3, 3, 4, 16);
                var podMat = new THREE.MeshLambertMaterial({ color: 0xCC6600 });
                var pod = new THREE.Mesh(podGeom, podMat);
                pod.position.set(px, py, pz);
                scene.add(pod);
                objects.push(pod);
                propellerAngles.push(0);

                var rotorGeom = new THREE.BoxGeometry(8, 0.5, 1);
                var rotorMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
                var rotor = new THREE.Mesh(rotorGeom, rotorMat);
                rotor.position.set(px, py + 2, pz);
                rotor.userData.isPropeller = true;
                rotor.userData.propellerIndex = propellerAngles.length - 1;
                scene.add(rotor);
                objects.push(rotor);

                var secondRotor = new THREE.BoxGeometry(0.5, 1, 8);
                var secondMesh = new THREE.Mesh(secondRotor, rotorMat);
                secondMesh.position.set(px, py + 2, pz);
                secondMesh.userData.isPropeller = true;
                secondMesh.userData.propellerIndex = propellerAngles.length - 1;
                scene.add(secondMesh);
                objects.push(secondMesh);
            }
        }
    }

    function buildClouds() {
        var cloudLayers = [
            { y: -15, count: 8, radius: 35 },
            { y: -25, count: 10, radius: 45 },
            { y: -40, count: 6, radius: 28 }
        ];

        for (var i = 0; i < cloudLayers.length; i++) {
            var layer = cloudLayers[i];
            for (var j = 0; j < layer.count; j++) {
                var angle = (j / layer.count) * Math.PI * 2;
                var rad = layer.radius + Math.random() * 20;
                var x = Math.cos(angle) * rad;
                var z = Math.sin(angle) * rad;

                var cloudCluster = createCloudCluster(x, layer.y, z);
                cloudOffsets.push({ x: x, z: z, y: layer.y, vx: -0.5 + Math.random() * 0.3, vz: -0.3 + Math.random() * 0.2 });
            }
        }
    }

    function createCloudCluster(x, y, z) {
        var cloudGeom = new THREE.SphereGeometry(8, 8, 8);
        var cloudMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var cloud = new THREE.Mesh(cloudGeom, cloudMat);
        cloud.position.set(x, y, z);
        cloud.userData.isCloud = true;
        scene.add(cloud);
        objects.push(cloud);

        var bulge1 = new THREE.SphereGeometry(6, 8, 8);
        var bulge = new THREE.Mesh(bulge1, cloudMat);
        bulge.position.set(x + 6, y, z);
        bulge.userData.isCloud = true;
        scene.add(bulge);
        objects.push(bulge);

        var bulge2 = new THREE.SphereGeometry(5, 8, 8);
        var bulge2Mesh = new THREE.Mesh(bulge2, cloudMat);
        bulge2Mesh.position.set(x - 5, y + 3, z);
        bulge2Mesh.userData.isCloud = true;
        scene.add(bulge2Mesh);
        objects.push(bulge2Mesh);

        return { cloud: cloud, bulge: bulge, bulge2: bulge2Mesh };
    }

    function buildElevators() {
        var elevatorConfigs = [
            { x: -5, y: 10, z: 5, height: 30 },
            { x: 5, y: 15, z: -8, height: 25 },
            { x: -80, y: 25, z: -30, height: 20 }
        ];

        for (var i = 0; i < elevatorConfigs.length; i++) {
            var elev = elevatorConfigs[i];
            var shaftGeom = new THREE.BoxGeometry(2, elev.height, 2);
            var shaftMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
            var shaft = new THREE.Mesh(shaftGeom, shaftMat);
            shaft.position.set(elev.x, elev.y + elev.height / 2, elev.z);
            scene.add(shaft);
            objects.push(shaft);

            var cabinGeom = new THREE.BoxGeometry(2.5, 3, 2.5);
            var cabinMat = new THREE.MeshLambertMaterial({ color: 0xDD8800 });
            var cabin = new THREE.Mesh(cabinGeom, cabinMat);
            cabin.position.set(elev.x, elev.y + 5, elev.z);
            cabin.userData.isElevator = true;
            scene.add(cabin);
            objects.push(cabin);
        }
    }

    function buildSupplyPods() {
        var podPositions = [
            { x: 15, y: 12, z: 10 },
            { x: -20, y: 10, z: -15 },
            { x: 25, y: 11, z: -8 },
            { x: -15, y: 9, z: 20 },
            { x: 10, y: 40, z: 15 },
            { x: -70, y: 45, z: -25 },
            { x: 100, y: 35, z: 25 },
            { x: -30, y: 60, z: 55 }
        ];

        for (var i = 0; i < podPositions.length; i++) {
            var podPos = podPositions[i];
            var containerGeom = new THREE.BoxGeometry(3, 4, 3);
            var containerMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
            var container = new THREE.Mesh(containerGeom, containerMat);
            container.position.set(podPos.x, podPos.y, podPos.z);
            scene.add(container);
            objects.push(container);

            var chuteGeom = new THREE.ConeGeometry(4, 3, 16);
            var chuteMat = new THREE.MeshLambertMaterial({ color: 0xFF8800 });
            var chute = new THREE.Mesh(chuteGeom, chuteMat);
            chute.position.set(podPos.x, podPos.y + 5, podPos.z);
            scene.add(chute);
            objects.push(chute);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x808080);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(100, 80, 100);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var landingPadPositions = [
            { x: 30, y: 10, z: 30 },
            { x: -35, y: 8, z: -20 }
        ];

        for (var i = 0; i < landingPadPositions.length; i++) {
            var padPos = landingPadPositions[i];
            var markerPositions = [
                { dx: 5, dz: 5 },
                { dx: -5, dz: 5 },
                { dx: 5, dz: -5 },
                { dx: -5, dz: -5 }
            ];

            for (var j = 0; j < markerPositions.length; j++) {
                var marker = markerPositions[j];
                var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
                var poleMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
                var pole = new THREE.Mesh(poleGeom, poleMat);
                pole.position.set(padPos.x + marker.dx, padPos.y + 3, padPos.z + marker.dz);
                scene.add(pole);
                objects.push(pole);

                var lightGeom = new THREE.SphereGeometry(0.8, 8, 8);
                var lightMat = new THREE.MeshLambertMaterial({ color: 0x00FF00 });
                var lightMesh = new THREE.Mesh(lightGeom, lightMat);
                lightMesh.position.set(padPos.x + marker.dx, padPos.y + 6, padPos.z + marker.dz);
                lightMesh.userData.isBeacon = true;
                lightMesh.userData.beaconIndex = beaconTimers.length;
                scene.add(lightMesh);
                objects.push(lightMesh);
                beaconTimers.push(0);

                var pointLight = new THREE.PointLight(0x00FF00, 0.6, 30);
                pointLight.position.set(padPos.x + marker.dx, padPos.y + 6, padPos.z + marker.dz);
                pointLight.userData.beaconIndex = beaconTimers.length - 1;
                scene.add(pointLight);
                lights.push(pointLight);
            }

            var padGeom = new THREE.CylinderGeometry(12, 12, 0.5, 32);
            var padMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
            var pad = new THREE.Mesh(padGeom, padMat);
            pad.position.set(padPos.x, padPos.y, padPos.z);
            scene.add(pad);
            objects.push(pad);
        }
    }

    function update(delta) {
        if (!scene) return;

        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.userData.isPropeller) {
                var pIdx = obj.userData.propellerIndex;
                propellerAngles[pIdx] = (propellerAngles[pIdx] + delta * 8) % (Math.PI * 2);
                obj.rotation.y = propellerAngles[pIdx];
            }
            if (obj.userData.isCloud) {
                var offset = cloudOffsets[0];
                if (offset) {
                    offset.x += offset.vx;
                    offset.z += offset.vz;
                    obj.position.x = offset.x;
                    obj.position.z = offset.z;
                }
            }
            if (obj.userData.isBeacon) {
                var bIdx = obj.userData.beaconIndex;
                beaconTimers[bIdx] = (beaconTimers[bIdx] + delta) % 1.5;
                var visible = beaconTimers[bIdx] < 0.75;
                obj.visible = visible;
                if (lights[i]) lights[i].visible = visible;
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
        propellerAngles = [];
        cloudOffsets = [];
        beaconTimers = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
