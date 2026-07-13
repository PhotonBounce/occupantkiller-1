window.LyonCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        // Roman fort outline (box square fort)
        var fortMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var fortWall1 = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 2), fortMaterial);
        fortWall1.position.set(-20, 1.5, -20);
        scene.add(fortWall1);
        objects.push(fortWall1);

        var fortWall2 = new THREE.Mesh(new THREE.BoxGeometry(40, 3, 2), fortMaterial);
        fortWall2.position.set(-20, 1.5, 20);
        scene.add(fortWall2);
        objects.push(fortWall2);

        var fortWall3 = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 40), fortMaterial);
        fortWall3.position.set(-40, 1.5, 0);
        scene.add(fortWall3);
        objects.push(fortWall3);

        var fortWall4 = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 40), fortMaterial);
        fortWall4.position.set(0, 1.5, 0);
        scene.add(fortWall4);
        objects.push(fortWall4);

        // Corner tower 1
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var tower1 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), towerMaterial);
        tower1.position.set(-40, 4, -20);
        scene.add(tower1);
        objects.push(tower1);

        // Corner tower 2
        var tower2 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), towerMaterial);
        tower2.position.set(0, 4, -20);
        scene.add(tower2);
        objects.push(tower2);

        // Corner tower 3
        var tower3 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), towerMaterial);
        tower3.position.set(-40, 4, 20);
        scene.add(tower3);
        objects.push(tower3);

        // Corner tower 4
        var tower4 = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), towerMaterial);
        tower4.position.set(0, 4, 20);
        scene.add(tower4);
        objects.push(tower4);

        // Ancient standing stones OP (box monoliths)
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var stone1 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), stoneMaterial);
        stone1.position.set(15, 5, -25);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 2), stoneMaterial);
        stone2.position.set(25, 5, -15);
        scene.add(stone2);
        objects.push(stone2);

        // Carved marks on stones (LineSegments)
        var stoneLinesGeom = new THREE.BufferGeometry();
        var linePositions = new Float32Array([
            15, 0, -25,   15, 8, -25,
            25, 0, -15,   25, 8, -15
        ]);
        stoneLinesGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        var stoneLinesMatl = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
        var stoneLines = new THREE.LineSegments(stoneLinesGeom, stoneLinesMatl);
        scene.add(stoneLines);
        objects.push(stoneLines);

        // River ford ambush (box sandbag walls)
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var sandbagWall1 = new THREE.Mesh(new THREE.BoxGeometry(15, 2, 1), sandbagMaterial);
        sandbagWall1.position.set(-15, 1, 8);
        scene.add(sandbagWall1);
        objects.push(sandbagWall1);

        var sandbagWall2 = new THREE.Mesh(new THREE.BoxGeometry(15, 2, 1), sandbagMaterial);
        sandbagWall2.position.set(-15, 1, 12);
        scene.add(sandbagWall2);
        objects.push(sandbagWall2);

        // Remote farmstead LRRP base (box farm buildings)
        var farmMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var farmBuilding1 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 6), farmMaterial);
        farmBuilding1.position.set(20, 2, 8);
        scene.add(farmBuilding1);
        objects.push(farmBuilding1);

        // Turf roof (cone)
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var roofCone1 = new THREE.Mesh(new THREE.ConeGeometry(5, 4, 8), roofMaterial);
        roofCone1.position.set(20, 6, 8);
        scene.add(roofCone1);
        objects.push(roofCone1);

        var farmBuilding2 = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 5), farmMaterial);
        farmBuilding2.position.set(32, 1.5, 10);
        scene.add(farmBuilding2);
        objects.push(farmBuilding2);

        var roofCone2 = new THREE.Mesh(new THREE.ConeGeometry(4, 3, 8), roofMaterial);
        roofCone2.position.set(32, 4.5, 10);
        scene.add(roofCone2);
        objects.push(roofCone2);

        // Helicopter FARP (box fuel point)
        var farpMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var fuelPoint = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 4), farpMaterial);
        fuelPoint.position.set(-25, 1, 25);
        scene.add(fuelPoint);
        objects.push(fuelPoint);

        // FARP pad (box)
        var padMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var farpPad = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 12), padMaterial);
        farpPad.position.set(-25, 0.25, 25);
        scene.add(farpPad);
        objects.push(farpPad);

        // Drone launch rail (box ramp)
        var rampMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var launchRamp = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 20), rampMaterial);
        launchRamp.position.set(8, 2, -8);
        launchRamp.rotation.z = 0.2;
        scene.add(launchRamp);
        objects.push(launchRamp);

        // Drone (sphere)
        var droneMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
        var droneBody = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), droneMaterial);
        droneBody.position.set(8, 12, -8);
        scene.add(droneBody);
        objects.push(droneBody);

        // Signal bonfire chain (sphere fires on box platforms)
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xFF4500 });

        var platform1 = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), platformMaterial);
        platform1.position.set(-30, 0.5, -5);
        scene.add(platform1);
        objects.push(platform1);

        var fire1 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), fireMaterial);
        fire1.position.set(-30, 2, -5);
        scene.add(fire1);
        objects.push(fire1);

        var platform2 = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), platformMaterial);
        platform2.position.set(-15, 0.5, 0);
        scene.add(platform2);
        objects.push(platform2);

        var fire2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), fireMaterial);
        fire2.position.set(-15, 2, 0);
        scene.add(fire2);
        objects.push(fire2);

        var platform3 = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), platformMaterial);
        platform3.position.set(10, 0.5, 5);
        scene.add(platform3);
        objects.push(platform3);

        var fire3 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), fireMaterial);
        fire3.position.set(10, 2, 5);
        scene.add(fire3);
        objects.push(fire3);

        // Terrain variation (cylinder rocks)
        var rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var rock1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 3, 6), rockMaterial);
        rock1.position.set(-5, 1.5, 15);
        scene.add(rock1);
        objects.push(rock1);

        var rock2 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 3, 6), rockMaterial);
        rock2.position.set(28, 1.5, 18);
        scene.add(rock2);
        objects.push(rock2);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate drone
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.geometry && obj.geometry instanceof THREE.SphereGeometry && obj.position.y > 10) {
                obj.position.y += Math.sin(Date.now() * 0.001) * 0.05;
                obj.rotation.x += 0.01;
                obj.rotation.z += 0.01;
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
