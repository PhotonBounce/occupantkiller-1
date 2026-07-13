window.ShiraFort = (function() {
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
        var manorGeom, manorMat, manor;
        var towerGeom, towerMat, tower;
        var stationGeom, stationMat, station;
        var platformGeom, platformMat, platform;
        var poleGeom, poleMat, pole1, pole2, pole3;
        var wallGeom, wallMat, wall1, wall2;
        var ropeGeom, ropeMat, rope1, rope2;
        var pontoonGeom, pontoonMat, pontoon1, pontoon2;
        var anchorGeom, anchorMat, anchor1, anchor2;
        var bunkerGeom, bunkerMat, bunker;
        var canisterGeom, canisterMat, canister1, canister2;
        var ammoDumpGeom, ammoDumpMat, ammoDump;
        var boulderGeom, boulderMat, boulder1, boulder2;
        var gondolaGeom, gondolaMat, gondola;
        var cableTowerGeom, cableTowerMat, cableTower1, cableTower2;
        var cableGeom, cableMat, cable;
        var ambLight, dirLight;

        // Glenbranter estate manor house - large box
        manorGeom = new THREE.BoxGeometry(20, 14, 18);
        manorMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        manor = new THREE.Mesh(manorGeom, manorMat);
        manor.position.set(-25, 7, -20);
        scene.add(manor);
        objects.push(manor);

        // Water tower - cylinder
        towerGeom = new THREE.CylinderGeometry(6, 7, 22, 16);
        towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-25, 11, 5);
        scene.add(tower);
        objects.push(tower);

        // Forest ranger station - box
        stationGeom = new THREE.BoxGeometry(12, 10, 10);
        stationMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        station = new THREE.Mesh(stationGeom, stationMat);
        station.position.set(20, 5, -15);
        scene.add(station);
        objects.push(station);

        // Elevated sniper platform - box
        platformGeom = new THREE.BoxGeometry(10, 8, 10);
        platformMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(20, 18, -15);
        scene.add(platform);
        objects.push(platform);

        // Climbing pole 1 - cylinder
        poleGeom = new THREE.CylinderGeometry(1.5, 1.5, 16, 8);
        poleMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        pole1 = new THREE.Mesh(poleGeom, poleMat);
        pole1.position.set(-5, 8, 15);
        scene.add(pole1);
        objects.push(pole1);

        // Climbing pole 2 - cylinder
        pole2 = new THREE.Mesh(poleGeom, poleMat);
        pole2.position.set(0, 8, 15);
        scene.add(pole2);
        objects.push(pole2);

        // Climbing pole 3 - cylinder
        pole3 = new THREE.Mesh(poleGeom, poleMat);
        pole3.position.set(5, 8, 15);
        scene.add(pole3);
        objects.push(pole3);

        // Training wall 1 - box
        wallGeom = new THREE.BoxGeometry(8, 12, 2);
        wallMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        wall1 = new THREE.Mesh(wallGeom, wallMat);
        wall1.position.set(-10, 6, 20);
        scene.add(wall1);
        objects.push(wall1);

        // Training wall 2 - box
        wall2 = new THREE.Mesh(wallGeom, wallMat);
        wall2.position.set(10, 6, 20);
        scene.add(wall2);
        objects.push(wall2);

        // Rope obstacle 1 - line segments
        var ropePoints1 = [
            new THREE.Vector3(-8, 12, 18),
            new THREE.Vector3(-8, 8, 22),
            new THREE.Vector3(-2, 12, 18)
        ];
        var ropeGeom1 = new THREE.BufferGeometry().setFromPoints(ropePoints1);
        ropeMat = new THREE.LineBasicMaterial({ color: 0xFFD700 });
        rope1 = new THREE.LineSegments(ropeGeom1, ropeMat);
        scene.add(rope1);
        objects.push(rope1);

        // Rope obstacle 2 - line segments
        var ropePoints2 = [
            new THREE.Vector3(8, 12, 18),
            new THREE.Vector3(8, 8, 22),
            new THREE.Vector3(14, 12, 18)
        ];
        var ropeGeom2 = new THREE.BufferGeometry().setFromPoints(ropePoints2);
        rope2 = new THREE.LineSegments(ropeGeom2, ropeMat);
        scene.add(rope2);
        objects.push(rope2);

        // Pontoon bridge section 1 - box
        pontoonGeom = new THREE.BoxGeometry(8, 2, 6);
        pontoonMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        pontoon1 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon1.position.set(-15, 2, -5);
        scene.add(pontoon1);
        objects.push(pontoon1);

        // Pontoon bridge section 2 - box
        pontoon2 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon2.position.set(-5, 2, -5);
        scene.add(pontoon2);
        objects.push(pontoon2);

        // Mooring anchor 1 - cylinder
        anchorGeom = new THREE.CylinderGeometry(2, 2.5, 5, 12);
        anchorMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        anchor1 = new THREE.Mesh(anchorGeom, anchorMat);
        anchor1.position.set(-15, 1, -10);
        scene.add(anchor1);
        objects.push(anchor1);

        // Mooring anchor 2 - cylinder
        anchor2 = new THREE.Mesh(anchorGeom, anchorMat);
        anchor2.position.set(-5, 1, -10);
        scene.add(anchor2);
        objects.push(anchor2);

        // Mountain rescue cache bunker - box
        bunkerGeom = new THREE.BoxGeometry(10, 8, 8);
        bunkerMat = new THREE.MeshLambertMaterial({ color: 0x483D8B });
        bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(25, 4, 20);
        scene.add(bunker);
        objects.push(bunker);

        // Supply canister 1 - sphere
        canisterGeom = new THREE.SphereGeometry(2.5, 12, 12);
        canisterMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        canister1 = new THREE.Mesh(canisterGeom, canisterMat);
        canister1.position.set(22, 10, 20);
        scene.add(canister1);
        objects.push(canister1);

        // Supply canister 2 - sphere
        canister2 = new THREE.Mesh(canisterGeom, canisterMat);
        canister2.position.set(28, 10, 20);
        scene.add(canister2);
        objects.push(canister2);

        // Ammo dump hut - box
        ammoDumpGeom = new THREE.BoxGeometry(12, 6, 10);
        ammoDumpMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        ammoDump = new THREE.Mesh(ammoDumpGeom, ammoDumpMat);
        ammoDump.position.set(-20, 3, 25);
        scene.add(ammoDump);
        objects.push(ammoDump);

        // Camouflage boulders on ammo dump 1 - sphere
        boulderGeom = new THREE.SphereGeometry(3, 10, 10);
        boulderMat = new THREE.MeshLambertMaterial({ color: 0x8FBC8F });
        boulder1 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder1.position.set(-24, 8, 25);
        scene.add(boulder1);
        objects.push(boulder1);

        // Camouflage boulder 2 - sphere
        boulder2 = new THREE.Mesh(boulderGeom, boulderMat);
        boulder2.position.set(-16, 8, 25);
        scene.add(boulder2);
        objects.push(boulder2);

        // Cable car tower 1 - cylinder
        cableTowerGeom = new THREE.CylinderGeometry(4, 5, 28, 16);
        cableTowerMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        cableTower1 = new THREE.Mesh(cableTowerGeom, cableTowerMat);
        cableTower1.position.set(25, 14, -25);
        scene.add(cableTower1);
        objects.push(cableTower1);

        // Cable car tower 2 - cylinder
        cableTower2 = new THREE.Mesh(cableTowerGeom, cableTowerMat);
        cableTower2.position.set(25, 14, 25);
        scene.add(cableTower2);
        objects.push(cableTower2);

        // Gondola cabin - box
        gondolaGeom = new THREE.BoxGeometry(6, 6, 6);
        gondolaMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        gondola = new THREE.Mesh(gondolaGeom, gondolaMat);
        gondola.position.set(25, 8, 0);
        scene.add(gondola);
        objects.push(gondola);

        // Suspension cables - line segments
        var cablePoints = [
            new THREE.Vector3(25, 25, -25),
            new THREE.Vector3(25, 8, 0),
            new THREE.Vector3(25, 25, 25)
        ];
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        cableMat = new THREE.LineBasicMaterial({ color: 0xC0C0C0, linewidth: 2 });
        cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Ambient light
        ambLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        // Directional light for realism
        dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 30, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        var i;
        if (gondola) {
            gondola.rotation.y += 0.3 * delta;
        }
        for (i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.z += 0.001 * delta;
            }
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
