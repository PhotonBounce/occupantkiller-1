window.ColonsayBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        var terrainGeom = new THREE.BoxGeometry(60, 3, 60);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x6b8e23 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -2, 0);
        scene.add(terrain);
        objects.push(terrain);

        var gardenWall1Geom = new THREE.BoxGeometry(25, 4, 1);
        var gardenMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var gardenWall1 = new THREE.Mesh(gardenWall1Geom, gardenMat);
        gardenWall1.position.set(-10, 2, -15);
        scene.add(gardenWall1);
        objects.push(gardenWall1);

        var gardenWall2Geom = new THREE.BoxGeometry(25, 4, 1);
        var gardenWall2 = new THREE.Mesh(gardenWall2Geom, gardenMat);
        gardenWall2.position.set(-10, 2, -5);
        scene.add(gardenWall2);
        objects.push(gardenWall2);

        var greenHouseGeom = new THREE.BoxGeometry(12, 8, 8);
        var greenMat = new THREE.MeshLambertMaterial({ color: 0x90ee90 });
        var greenHouse = new THREE.Mesh(greenHouseGeom, greenMat);
        greenHouse.position.set(-20, 4, -10);
        scene.add(greenHouse);
        objects.push(greenHouse);

        var beachDefense1Geom = new THREE.BoxGeometry(6, 3, 2);
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var beachDefense1 = new THREE.Mesh(beachDefense1Geom, concreteMat);
        beachDefense1.position.set(15, 1.5, 25);
        scene.add(beachDefense1);
        objects.push(beachDefense1);

        var beachDefense2Geom = new THREE.BoxGeometry(6, 3, 2);
        var beachDefense2 = new THREE.Mesh(beachDefense2Geom, concreteMat);
        beachDefense2.position.set(25, 1.5, 25);
        scene.add(beachDefense2);
        objects.push(beachDefense2);

        var rocketLauncherGeom = new THREE.CylinderGeometry(1.5, 2, 4, 16);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var rocketLauncher = new THREE.Mesh(rocketLauncherGeom, metalMat);
        rocketLauncher.position.set(20, 4, 22);
        scene.add(rocketLauncher);
        objects.push(rocketLauncher);

        var pierBuildingGeom = new THREE.BoxGeometry(16, 6, 8);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0xb8860b });
        var pierBuilding = new THREE.Mesh(pierBuildingGeom, pierMat);
        pierBuilding.position.set(28, 3, -20);
        scene.add(pierBuilding);
        objects.push(pierBuilding);

        var moringCapstanGeom = new THREE.CylinderGeometry(1.2, 1.5, 2, 12);
        var moringCapstan = new THREE.Mesh(moringCapstanGeom, metalMat);
        moringCapstan.position.set(32, 2, -18);
        scene.add(moringCapstan);
        objects.push(moringCapstan);

        var mineGeom = new THREE.SphereGeometry(1, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var mine1 = new THREE.Mesh(mineGeom, mineMat);
        mine1.position.set(-5, 0.5, 8);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeom, mineMat);
        mine2.position.set(0, 0.5, 10);
        scene.add(mine2);
        objects.push(mine2);

        var mine3 = new THREE.Mesh(mineGeom, mineMat);
        mine3.position.set(5, 0.5, 8);
        scene.add(mine3);
        objects.push(mine3);

        var tripWireGeom = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -5, 0.5, 8, 0, 0.5, 10,
                    0, 0.5, 10, 5, 0.5, 8
                ]), 3)
            )
        );
        var tripWireMat = new THREE.MeshLambertMaterial({ color: 0xffa500 });
        tripWireGeom.material = tripWireMat;
        scene.add(tripWireGeom);
        objects.push(tripWireGeom);

        var runwayMarker1Geom = new THREE.BoxGeometry(2, 0.5, 18);
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var runwayMarker1 = new THREE.Mesh(runwayMarker1Geom, whiteMat);
        runwayMarker1.position.set(-8, 0.25, -30);
        scene.add(runwayMarker1);
        objects.push(runwayMarker1);

        var runwayMarker2Geom = new THREE.BoxGeometry(2, 0.5, 18);
        var runwayMarker2 = new THREE.Mesh(runwayMarker2Geom, whiteMat);
        runwayMarker2.position.set(8, 0.25, -30);
        scene.add(runwayMarker2);
        objects.push(runwayMarker2);

        var approachLightGeom = new THREE.ConeGeometry(0.8, 3, 8);
        var redMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var approachLight1 = new THREE.Mesh(approachLightGeom, redMat);
        approachLight1.position.set(-6, 2, -38);
        scene.add(approachLight1);
        objects.push(approachLight1);

        var approachLight2 = new THREE.Mesh(approachLightGeom, redMat);
        approachLight2.position.set(6, 2, -38);
        scene.add(approachLight2);
        objects.push(approachLight2);

        var mastGeom = new THREE.CylinderGeometry(0.6, 0.6, 20, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var radarMast = new THREE.Mesh(mastGeom, mastMat);
        radarMast.position.set(-25, 10, -8);
        scene.add(radarMast);
        objects.push(radarMast);

        var radarShedGeom = new THREE.BoxGeometry(10, 5, 10);
        var radarShed = new THREE.Mesh(radarShedGeom, concreteMat);
        radarShed.position.set(-25, 2.5, -8);
        scene.add(radarShed);
        objects.push(radarShed);

        var goatMarker1Geom = new THREE.SphereGeometry(0.8, 8, 8);
        var brownMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var goat1 = new THREE.Mesh(goatMarker1Geom, brownMat);
        goat1.position.set(-18, 1, 18);
        scene.add(goat1);
        objects.push(goat1);

        var goat2 = new THREE.Mesh(goatMarker1Geom, brownMat);
        goat2.position.set(-12, 1.2, 20);
        scene.add(goat2);
        objects.push(goat2);

        var goat3 = new THREE.Mesh(goatMarker1Geom, brownMat);
        goat3.position.set(-6, 1.4, 22);
        scene.add(goat3);
        objects.push(goat3);

        var goat4 = new THREE.Mesh(goatMarker1Geom, brownMat);
        goat4.position.set(0, 1.2, 20);
        scene.add(goat4);
        objects.push(goat4);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry && i > 18) {
                objects[i].rotation.y += delta * 0.3;
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
