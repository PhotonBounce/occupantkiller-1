window.TummelPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // River valley box terrain (base layer)
        var terrainGeom = new THREE.BoxGeometry(80, 2, 80);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -15, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Caledonian pine ridge treeline - trunk 1
        var trunk1Geom = new THREE.CylinderGeometry(1.5, 2, 20, 8);
        var brownMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var trunk1 = new THREE.Mesh(trunk1Geom, brownMat);
        trunk1.position.set(-20, 0, -25);
        scene.add(trunk1);
        objects.push(trunk1);

        // Pine canopy 1
        var canopy1Geom = new THREE.SphereGeometry(8, 12, 12);
        var greenMat = new THREE.MeshLambertMaterial({ color: 0x1a5f1a });
        var canopy1 = new THREE.Mesh(canopy1Geom, greenMat);
        canopy1.position.set(-20, 12, -25);
        scene.add(canopy1);
        objects.push(canopy1);

        // Caledonian pine ridge treeline - trunk 2
        var trunk2Geom = new THREE.CylinderGeometry(1.8, 2.2, 22, 8);
        var trunk2 = new THREE.Mesh(trunk2Geom, brownMat);
        trunk2.position.set(15, 0, -28);
        scene.add(trunk2);
        objects.push(trunk2);

        // Pine canopy 2
        var canopy2Geom = new THREE.SphereGeometry(9, 12, 12);
        var canopy2 = new THREE.Mesh(canopy2Geom, greenMat);
        canopy2.position.set(15, 13, -28);
        scene.add(canopy2);
        objects.push(canopy2);

        // Pass of Killiecrankie defense wall across gorge
        var wallGeom = new THREE.BoxGeometry(50, 12, 3);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var wall = new THREE.Mesh(wallGeom, stoneMat);
        wall.position.set(0, 2, -8);
        scene.add(wall);
        objects.push(wall);

        // Box flanking position left
        var flankLeftGeom = new THREE.BoxGeometry(6, 8, 8);
        var flankLeft = new THREE.Mesh(flankLeftGeom, stoneMat);
        flankLeft.position.set(-28, 1, -15);
        scene.add(flankLeft);
        objects.push(flankLeft);

        // Box flanking position right
        var flankRightGeom = new THREE.BoxGeometry(6, 8, 8);
        var flankRight = new THREE.Mesh(flankRightGeom, stoneMat);
        flankRight.position.set(28, 1, -15);
        scene.add(flankRight);
        objects.push(flankRight);

        // Salmon leap falls - box waterfall feature
        var waterfallGeom = new THREE.BoxGeometry(15, 18, 4);
        var blueMat = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });
        var waterfall = new THREE.Mesh(waterfallGeom, blueMat);
        waterfall.position.set(0, 5, 12);
        scene.add(waterfall);
        objects.push(waterfall);

        // Salmon leap falls - sphere rock 1
        var rock1Geom = new THREE.SphereGeometry(3, 12, 12);
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var rock1 = new THREE.Mesh(rock1Geom, rockMat);
        rock1.position.set(-5, 3, 18);
        scene.add(rock1);
        objects.push(rock1);

        // Salmon leap falls - sphere rock 2
        var rock2Geom = new THREE.SphereGeometry(2.5, 12, 12);
        var rock2 = new THREE.Mesh(rock2Geom, rockMat);
        rock2.position.set(6, 2, 20);
        scene.add(rock2);
        objects.push(rock2);

        // Valley floor minefield - sphere mine 1
        var mine1Geom = new THREE.SphereGeometry(0.8, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mine1 = new THREE.Mesh(mine1Geom, mineMat);
        mine1.position.set(-15, -12, 10);
        scene.add(mine1);
        objects.push(mine1);

        // Valley floor minefield - sphere mine 2
        var mine2Geom = new THREE.SphereGeometry(0.8, 8, 8);
        var mine2 = new THREE.Mesh(mine2Geom, mineMat);
        mine2.position.set(12, -12, 8);
        scene.add(mine2);
        objects.push(mine2);

        // Valley floor minefield - sphere mine 3
        var mine3Geom = new THREE.SphereGeometry(0.8, 8, 8);
        var mine3 = new THREE.Mesh(mine3Geom, mineMat);
        mine3.position.set(-8, -12, -5);
        scene.add(mine3);
        objects.push(mine3);

        // Minefield tripwire 1
        var wire1Geom = new THREE.BufferGeometry();
        var wirePositions1 = new Float32Array([
            -15, -11.5, 10,
            -10, -11.5, 12
        ]);
        wire1Geom.setAttribute('position', new THREE.BufferAttribute(wirePositions1, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2 });
        var wire1 = new THREE.LineSegments(wire1Geom, wireMat);
        scene.add(wire1);
        objects.push(wire1);

        // Minefield tripwire 2
        var wire2Geom = new THREE.BufferGeometry();
        var wirePositions2 = new Float32Array([
            12, -11.5, 8,
            8, -11.5, 5
        ]);
        wire2Geom.setAttribute('position', new THREE.BufferAttribute(wirePositions2, 3));
        var wire2 = new THREE.LineSegments(wire2Geom, wireMat);
        scene.add(wire2);
        objects.push(wire2);

        // Old military road checkpoint - box gatehouse
        var gatehouseGeom = new THREE.BoxGeometry(8, 10, 6);
        var gatemat = new THREE.MeshLambertMaterial({ color: 0x7a6254 });
        var gatehouse = new THREE.Mesh(gatehouseGeom, gatemat);
        gatehouse.position.set(0, 1, 25);
        scene.add(gatehouse);
        objects.push(gatehouse);

        // Checkpoint bollard 1
        var bollard1Geom = new THREE.CylinderGeometry(0.6, 0.7, 3, 6);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var bollard1 = new THREE.Mesh(bollard1Geom, bollardMat);
        bollard1.position.set(-6, -11, 25);
        scene.add(bollard1);
        objects.push(bollard1);

        // Checkpoint bollard 2
        var bollard2Geom = new THREE.CylinderGeometry(0.6, 0.7, 3, 6);
        var bollard2 = new THREE.Mesh(bollard2Geom, bollardMat);
        bollard2.position.set(6, -11, 25);
        scene.add(bollard2);
        objects.push(bollard2);

        // High ground OP hut - box shelter on ridge
        var hutGeom = new THREE.BoxGeometry(5, 6, 5);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(-25, 8, 0);
        scene.add(hut);
        objects.push(hut);

        // OP hut observation slot
        var slotGeom = new THREE.BoxGeometry(0.5, 2, 4);
        var slotMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var slot = new THREE.Mesh(slotGeom, slotMat);
        slot.position.set(-25, 7, 1.2);
        scene.add(slot);
        objects.push(slot);

        // Field ambulance station - box vehicle
        var vehicleGeom = new THREE.BoxGeometry(4, 3, 8);
        var vehicleMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        var vehicle = new THREE.Mesh(vehicleGeom, vehicleMat);
        vehicle.position.set(30, -10, -18);
        scene.add(vehicle);
        objects.push(vehicle);

        // Field ambulance station - red sphere marker
        var markerGeom = new THREE.SphereGeometry(1.2, 12, 12);
        var markerMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var marker = new THREE.Mesh(markerGeom, markerMat);
        marker.position.set(30, -5, -18);
        scene.add(marker);
        objects.push(marker);

        // Ridge cone landmark
        var coneGeom = new THREE.ConeGeometry(4, 16, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(22, 2, -12);
        scene.add(cone);
        objects.push(cone);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadow/depth
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(40, 30, 40);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation loop
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.y < -20) {
                objects[i].position.y = 30;
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
