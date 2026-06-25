window.KilbirnieFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildFort();
    }

    function buildFort() {
        // Kilbirnie Place ruined tower stronghold
        var towerGeom = new THREE.BoxGeometry(8, 20, 8);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-25, 10, -20);
        scene.add(tower);
        objects.push(tower);

        var courtyardGeom = new THREE.BoxGeometry(18, 3, 18);
        var courtyardMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var courtyard = new THREE.Mesh(courtyardGeom, courtyardMat);
        courtyard.position.set(-25, 1.5, -20);
        scene.add(courtyard);
        objects.push(courtyard);

        var turretGeom = new THREE.ConeGeometry(3, 12, 8);
        var turretMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var turret = new THREE.Mesh(turretGeom, turretMat);
        turret.position.set(-20, 15, -25);
        scene.add(turret);
        objects.push(turret);

        // Loch Kilbirnie shoreline defense
        var boathouseGeom = new THREE.BoxGeometry(6, 4, 8);
        var boathouseMat = new THREE.MeshLambertMaterial({color: 0x556B2F});
        var boathouse = new THREE.Mesh(boathouseGeom, boathouseMat);
        boathouse.position.set(15, 2, -28);
        scene.add(boathouse);
        objects.push(boathouse);

        var mineGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var mine1 = new THREE.Mesh(mineGeom, mineMat);
        mine1.position.set(18, 1, -32);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeom, mineMat);
        mine2.position.set(12, 1, -30);
        scene.add(mine2);
        objects.push(mine2);

        var cableGeom = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    15, 3, -28, 18, 1, -32,
                    15, 3, -28, 12, 1, -30
                ]), 3)),
            new THREE.LineBasicMaterial({color: 0x000000})
        );
        scene.add(cableGeom);
        objects.push(cableGeom);

        var clifftopGeom = new THREE.BoxGeometry(12, 2, 6);
        var clifftopMat = new THREE.MeshLambertMaterial({color: 0xA9A9A9});
        var clifftop = new THREE.Mesh(clifftopGeom, clifftopMat);
        clifftop.position.set(20, 3, -15);
        scene.add(clifftop);
        objects.push(clifftop);

        // Garnock valley road ambush
        var roadGeom = new THREE.BoxGeometry(14, 1, 25);
        var roadMat = new THREE.MeshLambertMaterial({color: 0x4a4a4a});
        var road = new THREE.Mesh(roadGeom, roadMat);
        road.position.set(-8, 0.5, 10);
        scene.add(road);
        objects.push(road);

        var coverWallGeom = new THREE.BoxGeometry(3, 5, 20);
        var coverWallMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var coverWall = new THREE.Mesh(coverWallGeom, coverWallMat);
        coverWall.position.set(-12, 2.5, 10);
        scene.add(coverWall);
        objects.push(coverWall);

        var iedGeom = new THREE.SphereGeometry(1.2, 6, 6);
        var iedMat = new THREE.MeshLambertMaterial({color: 0x333333});
        var ied1 = new THREE.Mesh(iedGeom, iedMat);
        ied1.position.set(-10, 0.8, 5);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeom, iedMat);
        ied2.position.set(-6, 0.8, 15);
        scene.add(ied2);
        objects.push(ied2);

        var wireGeom = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -10, 0.8, 5, -12, 2.5, 10,
                    -6, 0.8, 15, -12, 2.5, 10
                ]), 3)),
            new THREE.LineBasicMaterial({color: 0xFF6347})
        );
        scene.add(wireGeom);
        objects.push(wireGeom);

        // Beith town garrison
        var townBuildGeom = new THREE.BoxGeometry(5, 6, 5);
        var townBuildMat = new THREE.MeshLambertMaterial({color: 0xCD853F});
        var townBuild1 = new THREE.Mesh(townBuildGeom, townBuildMat);
        townBuild1.position.set(8, 3, 18);
        scene.add(townBuild1);
        objects.push(townBuild1);

        var townBuild2 = new THREE.Mesh(townBuildGeom, townBuildMat);
        townBuild2.position.set(3, 3, 22);
        scene.add(townBuild2);
        objects.push(townBuild2);

        var barrierGeom = new THREE.BoxGeometry(12, 1.5, 2);
        var barrierMat = new THREE.MeshLambertMaterial({color: 0x808080});
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(5.5, 0.75, 25);
        scene.add(barrier);
        objects.push(barrier);

        var guardTowerGeom = new THREE.CylinderGeometry(2.5, 2.5, 10, 8);
        var guardTowerMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var guardTower = new THREE.Mesh(guardTowerGeom, guardTowerMat);
        guardTower.position.set(12, 5, 20);
        scene.add(guardTower);
        objects.push(guardTower);

        // Ladyland Moor radar station
        var opsBlockGeom = new THREE.BoxGeometry(10, 4, 8);
        var opsBlockMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var opsBlock = new THREE.Mesh(opsBlockGeom, opsBlockMat);
        opsBlock.position.set(-15, 2, 8);
        scene.add(opsBlock);
        objects.push(opsBlock);

        var radarGeom = new THREE.CylinderGeometry(4, 4, 8, 16);
        var radarMat = new THREE.MeshLambertMaterial({color: 0xB0C4DE});
        var radar = new THREE.Mesh(radarGeom, radarMat);
        radar.position.set(-15, 6, 8);
        scene.add(radar);
        objects.push(radar);

        var generatorGeom = new THREE.BoxGeometry(4, 3, 4);
        var generatorMat = new THREE.MeshLambertMaterial({color: 0x808080});
        var generator = new THREE.Mesh(generatorGeom, generatorMat);
        generator.position.set(-12, 1.5, 12);
        scene.add(generator);
        objects.push(generator);

        // Blair Estate command HQ
        var houseGeom = new THREE.BoxGeometry(14, 8, 12);
        var houseMat = new THREE.MeshLambertMaterial({color: 0xDEAD88});
        var house = new THREE.Mesh(houseGeom, houseMat);
        house.position.set(22, 4, 8);
        scene.add(house);
        objects.push(house);

        var stableGeom = new THREE.BoxGeometry(8, 4, 6);
        var stableMat = new THREE.MeshLambertMaterial({color: 0xA0522D});
        var stable = new THREE.Mesh(stableGeom, stableMat);
        stable.position.set(28, 2, 14);
        scene.add(stable);
        objects.push(stable);

        var waterTowerGeom = new THREE.CylinderGeometry(2, 2.5, 12, 8);
        var waterTowerMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var waterTower = new THREE.Mesh(waterTowerGeom, waterTowerMat);
        waterTower.position.set(18, 6, 10);
        scene.add(waterTower);
        objects.push(waterTower);

        // Ras Hill summit relay
        var shelterGeom = new THREE.BoxGeometry(4, 3, 4);
        var shelterMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(-20, 2, 25);
        scene.add(shelter);
        objects.push(shelter);

        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 18, 6);
        var mastMat = new THREE.MeshLambertMaterial({color: 0xA9A9A9});
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-20, 10, 25);
        scene.add(mast);
        objects.push(mast);

        var radomeGeom = new THREE.SphereGeometry(2, 8, 8);
        var radiomeMat = new THREE.MeshLambertMaterial({color: 0xFFF8DC});
        var radome = new THREE.Mesh(radomeGeom, radiomeMat);
        radome.position.set(-20, 18, 25);
        scene.add(radome);
        objects.push(radome);

        // Dalgarven Mill supply depot
        var millGeom = new THREE.BoxGeometry(10, 7, 10);
        var millMat = new THREE.MeshLambertMaterial({color: 0xA0522D});
        var mill = new THREE.Mesh(millGeom, millMat);
        mill.position.set(30, 3.5, -5);
        scene.add(mill);
        objects.push(mill);

        var wheelGeom = new THREE.CylinderGeometry(3, 3, 1, 12);
        var wheelMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(38, 3, -5);
        scene.add(wheel);
        objects.push(wheel);

        var grainGeom = new THREE.BoxGeometry(6, 5, 6);
        var grainMat = new THREE.MeshLambertMaterial({color: 0xBDB76B});
        var grain = new THREE.Mesh(grainGeom, grainMat);
        grain.position.set(34, 2.5, 2);
        scene.add(grain);
        objects.push(grain);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 30, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        if (scene && objects.length > 0) {
            var radarIdx = -1;
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry && objects[i].geometry.type === 'CylinderGeometry' &&
                    Math.abs(objects[i].position.x - (-15)) < 1 &&
                    Math.abs(objects[i].position.z - 8) < 1) {
                    radarIdx = i;
                    break;
                }
            }
            if (radarIdx >= 0) {
                objects[radarIdx].rotation.y += delta * 0.5;
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
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
