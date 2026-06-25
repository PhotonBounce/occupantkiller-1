window.LuingKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Slate quarry floor terrain boxes
        var quarryFloorGeom = new THREE.BoxGeometry(60, 2, 50);
        var quarryFloorMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var quarryFloor = new THREE.Mesh(quarryFloorGeom, quarryFloorMat);
        quarryFloor.position.set(0, -8, 0);
        scene.add(quarryFloor);
        objects.push(quarryFloor);

        // Box quarry walls (4 walls)
        var quarryWallGeom = new THREE.BoxGeometry(60, 15, 2);
        var quarryWallMat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });

        var northWall = new THREE.Mesh(quarryWallGeom, quarryWallMat);
        northWall.position.set(0, 5, -26);
        scene.add(northWall);
        objects.push(northWall);

        var southWall = new THREE.Mesh(quarryWallGeom, quarryWallMat);
        southWall.position.set(0, 5, 26);
        scene.add(southWall);
        objects.push(southWall);

        var eastWallGeom = new THREE.BoxGeometry(2, 15, 50);
        var eastWall = new THREE.Mesh(eastWallGeom, quarryWallMat);
        eastWall.position.set(31, 5, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        var westWall = new THREE.Mesh(eastWallGeom, quarryWallMat);
        westWall.position.set(-31, 5, 0);
        scene.add(westWall);
        objects.push(westWall);

        // Box guard tower
        var towerGeom = new THREE.BoxGeometry(8, 18, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(20, 10, -20);
        scene.add(tower);
        objects.push(tower);

        // Cattle ferry hull (large box)
        var ferryHullGeom = new THREE.BoxGeometry(25, 6, 12);
        var ferryHullMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var ferryHull = new THREE.Mesh(ferryHullGeom, ferryHullMat);
        ferryHull.position.set(-25, 2, 15);
        scene.add(ferryHull);
        objects.push(ferryHull);

        // Ferry engine (cylinder)
        var engineGeom = new THREE.CylinderGeometry(2, 2, 5, 8);
        var engineMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var engine = new THREE.Mesh(engineGeom, engineMat);
        engine.position.set(-25, 8, 15);
        scene.add(engine);
        objects.push(engine);

        // Tidal sound mine barrier - sphere mines (3 mines)
        var mineGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x555555 });

        var mine1 = new THREE.Mesh(mineGeom, mineMat);
        mine1.position.set(-15, 0, 25);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeom, mineMat);
        mine2.position.set(0, 0, 30);
        scene.add(mine2);
        objects.push(mine2);

        var mine3 = new THREE.Mesh(mineGeom, mineMat);
        mine3.position.set(15, 0, 25);
        scene.add(mine3);
        objects.push(mine3);

        // Mooring cable for mine barrier (LineSegments)
        var cableGeom = new THREE.BufferGeometry();
        var cablePoints = [
            new THREE.Vector3(-15, 0, 25),
            new THREE.Vector3(-15, -3, 25),
            new THREE.Vector3(0, 0, 30),
            new THREE.Vector3(0, -3, 30),
            new THREE.Vector3(15, 0, 25),
            new THREE.Vector3(15, -3, 25)
        ];
        cableGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cablePoints.flatMap(p => [p.x, p.y, p.z])), 3));
        var cableMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var mooringCable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(mooringCable);
        objects.push(mooringCable);

        // Ruined slate cottages defensive line (3 cottage walls)
        var cottageWallGeom = new THREE.BoxGeometry(6, 5, 2);
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });

        var cottage1 = new THREE.Mesh(cottageWallGeom, cottageMat);
        cottage1.position.set(-20, 3, -10);
        scene.add(cottage1);
        objects.push(cottage1);

        var cottage2 = new THREE.Mesh(cottageWallGeom, cottageMat);
        cottage2.position.set(0, 3, -12);
        scene.add(cottage2);
        objects.push(cottage2);

        var cottage3 = new THREE.Mesh(cottageWallGeom, cottageMat);
        cottage3.position.set(20, 3, -10);
        scene.add(cottage3);
        objects.push(cottage3);

        // Emergency beacon station - lighthouse tower (cylinder)
        var lighthouseTowerGeom = new THREE.CylinderGeometry(2, 2.5, 16, 12);
        var lighthouseMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var lighthouseTower = new THREE.Mesh(lighthouseTowerGeom, lighthouseMat);
        lighthouseTower.position.set(25, 9, -15);
        scene.add(lighthouseTower);
        objects.push(lighthouseTower);

        // Lighthouse light cap (cone)
        var lightCapGeom = new THREE.ConeGeometry(2, 4, 12);
        var lightCapMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var lightCap = new THREE.Mesh(lightCapGeom, lightCapMat);
        lightCap.position.set(25, 18, -15);
        scene.add(lightCap);
        objects.push(lightCap);

        // Keeper's house (box)
        var keepersHouseGeom = new THREE.BoxGeometry(6, 4, 8);
        var keepersHouseMat = new THREE.MeshLambertMaterial({ color: 0x7a5a3a });
        var keepersHouse = new THREE.Mesh(keepersHouseGeom, keepersHouseMat);
        keepersHouse.position.set(25, 2, -8);
        scene.add(keepersHouse);
        objects.push(keepersHouse);

        // Kelp processing station building (box)
        var kelpBuildingGeom = new THREE.BoxGeometry(10, 5, 12);
        var kelpBuildingMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
        var kelpBuilding = new THREE.Mesh(kelpBuildingGeom, kelpBuildingMat);
        kelpBuilding.position.set(-30, 2, -8);
        scene.add(kelpBuilding);
        objects.push(kelpBuilding);

        // Kelp balls as camouflage (2 sphere balls)
        var kelpBallGeom = new THREE.SphereGeometry(2, 8, 8);
        var kelpBallMat = new THREE.MeshLambertMaterial({ color: 0x4a6a2a });

        var kelpBall1 = new THREE.Mesh(kelpBallGeom, kelpBallMat);
        kelpBall1.position.set(-35, 5, -5);
        scene.add(kelpBall1);
        objects.push(kelpBall1);

        var kelpBall2 = new THREE.Mesh(kelpBallGeom, kelpBallMat);
        kelpBall2.position.set(-28, 5, -13);
        scene.add(kelpBall2);
        objects.push(kelpBall2);

        // Island perimeter wall - stone wall sections (3 sections)
        var perimeterWallGeom = new THREE.BoxGeometry(20, 3, 2);
        var perimeterMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });

        var perimWall1 = new THREE.Mesh(perimeterWallGeom, perimeterMat);
        perimWall1.position.set(-15, 1, 28);
        scene.add(perimWall1);
        objects.push(perimWall1);

        var perimWall2 = new THREE.Mesh(perimeterWallGeom, perimeterMat);
        perimWall2.position.set(15, 1, 28);
        scene.add(perimWall2);
        objects.push(perimWall2);

        var perimWall3Geom = new THREE.BoxGeometry(2, 3, 20);
        var perimWall3 = new THREE.Mesh(perimWall3Geom, perimeterMat);
        perimWall3.position.set(-32, 1, 15);
        scene.add(perimWall3);
        objects.push(perimWall3);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Lighthouse beam rotation
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].position.x === 25 && objects[i].position.z === -15 && objects[i].geometry.type === 'ConeGeometry') {
                    objects[i].rotation.y += delta * 0.5;
                }
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
