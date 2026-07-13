window.LomondFort = (function() {
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
        var castleTowerGeom = new THREE.BoxGeometry(8, 20, 8);
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var castleTower = new THREE.Mesh(castleTowerGeom, castleMat);
        castleTower.position.set(-25, 10, -20);
        scene.add(castleTower);
        objects.push(castleTower);

        var turretGeom = new THREE.CylinderGeometry(3, 3, 12, 16);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var turret = new THREE.Mesh(turretGeom, turretMat);
        turret.position.set(-25, 16, -20);
        scene.add(turret);
        objects.push(turret);

        var gunboat1Geom = new THREE.BoxGeometry(6, 3, 12);
        var gunboatMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        var gunboat1 = new THREE.Mesh(gunboat1Geom, gunboatMat);
        gunboat1.position.set(-10, 1.5, 5);
        scene.add(gunboat1);
        objects.push(gunboat1);

        var funnel1Geom = new THREE.CylinderGeometry(1, 1.2, 5, 12);
        var funnelMat = new THREE.MeshLambertMaterial({ color: 0x34495e });
        var funnel1 = new THREE.Mesh(funnel1Geom, funnelMat);
        funnel1.position.set(-10, 4, 5);
        scene.add(funnel1);
        objects.push(funnel1);

        var gunboat2Geom = new THREE.BoxGeometry(6, 3, 12);
        var gunboat2 = new THREE.Mesh(gunboat2Geom, gunboatMat);
        gunboat2.position.set(0, 1.5, 15);
        scene.add(gunboat2);
        objects.push(gunboat2);

        var funnel2Geom = new THREE.CylinderGeometry(1, 1.2, 5, 12);
        var funnel2 = new THREE.Mesh(funnel2Geom, funnelMat);
        funnel2.position.set(0, 4, 15);
        scene.add(funnel2);
        objects.push(funnel2);

        var gunboat3Geom = new THREE.BoxGeometry(6, 3, 12);
        var gunboat3 = new THREE.Mesh(gunboat3Geom, gunboatMat);
        gunboat3.position.set(15, 1.5, -5);
        scene.add(gunboat3);
        objects.push(gunboat3);

        var benPeakGeom = new THREE.ConeGeometry(12, 25, 16);
        var peakMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });
        var benPeak = new THREE.Mesh(benPeakGeom, peakMat);
        benPeak.position.set(25, 12.5, 20);
        scene.add(benPeak);
        objects.push(benPeak);

        var bunkerGeom = new THREE.BoxGeometry(10, 4, 8);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x5d4e37 });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(25, 2, 20);
        scene.add(bunker);
        objects.push(bunker);

        var hangarGeom = new THREE.BoxGeometry(16, 8, 14);
        var hangarMat = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
        var hangar = new THREE.Mesh(hangarGeom, hangarMat);
        hangar.position.set(-30, 4, 10);
        scene.add(hangar);
        objects.push(hangar);

        var floatplaneGeom = new THREE.CylinderGeometry(2, 2, 10, 12);
        var planeMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
        var floatplane = new THREE.Mesh(floatplaneGeom, planeMat);
        floatplane.position.set(-30, 4.5, 10);
        floatplane.rotation.z = Math.PI / 2;
        scene.add(floatplane);
        objects.push(floatplane);

        var netPoints = [];
        netPoints.push(new THREE.Vector3(-20, 2, -15));
        netPoints.push(new THREE.Vector3(-20, 8, -15));
        netPoints.push(new THREE.Vector3(-20, 2, 15));
        netPoints.push(new THREE.Vector3(-20, 8, 15));
        netPoints.push(new THREE.Vector3(5, 2, -15));
        netPoints.push(new THREE.Vector3(5, 8, -15));
        netPoints.push(new THREE.Vector3(5, 2, 15));
        netPoints.push(new THREE.Vector3(5, 8, 15));
        var netGeom = new THREE.BufferGeometry();
        netGeom.setFromPoints(netPoints);
        var netMat = new THREE.LineBasicMaterial({ color: 0x27ae60, linewidth: 2 });
        var netSegments = new THREE.LineSegments(netGeom, netMat);
        scene.add(netSegments);
        objects.push(netSegments);

        var anchorBuoy1Geom = new THREE.BoxGeometry(2, 1, 2);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
        var anchorBuoy1 = new THREE.Mesh(anchorBuoy1Geom, buoyMat);
        anchorBuoy1.position.set(-20, 0.5, -15);
        scene.add(anchorBuoy1);
        objects.push(anchorBuoy1);

        var anchorBuoy2Geom = new THREE.BoxGeometry(2, 1, 2);
        var anchorBuoy2 = new THREE.Mesh(anchorBuoy2Geom, buoyMat);
        anchorBuoy2.position.set(5, 0.5, 15);
        scene.add(anchorBuoy2);
        objects.push(anchorBuoy2);

        var caveGeom = new THREE.BoxGeometry(12, 8, 10);
        var caveMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
        var cave = new THREE.Mesh(caveGeom, caveMat);
        cave.position.set(30, 4, -20);
        scene.add(cave);
        objects.push(cave);

        var torpedoGeom = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
        var torpedoMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });
        var torpedo1 = new THREE.Mesh(torpedoGeom, torpedoMat);
        torpedo1.position.set(30, 3, -22);
        torpedo1.rotation.z = Math.PI / 2;
        scene.add(torpedo1);
        objects.push(torpedo1);

        var earthwork1Geom = new THREE.BoxGeometry(20, 2, 4);
        var earthworkMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
        var earthwork1 = new THREE.Mesh(earthwork1Geom, earthworkMat);
        earthwork1.position.set(0, 1, -25);
        scene.add(earthwork1);
        objects.push(earthwork1);

        var ammoStorageGeom = new THREE.BoxGeometry(6, 5, 6);
        var ammoMat = new THREE.MeshLambertMaterial({ color: 0x424242 });
        var ammoStorage = new THREE.Mesh(ammoStorageGeom, ammoMat);
        ammoStorage.position.set(-15, 2.5, 25);
        scene.add(ammoStorage);
        objects.push(ammoStorage);

        var radarDomeGeom = new THREE.SphereGeometry(2, 12, 12);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
        var radarDome = new THREE.Mesh(radarDomeGeom, radarMat);
        radarDome.position.set(-25, 28, -20);
        scene.add(radarDome);
        objects.push(radarDome);

        var mainLight = new THREE.PointLight(0xffffff, 1, 100);
        mainLight.position.set(0, 30, 0);
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0xcccccc);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.05;
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

    return { init: init, update: update, reset: reset };
}());
