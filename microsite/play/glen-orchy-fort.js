window.GlenOrchyFort = (function() {
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
        // River Orchy valley box terrain
        var terrainGeom = new THREE.BoxGeometry(80, 5, 60);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -3, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Inveroran Hotel main house (box)
        var hotelGeom = new THREE.BoxGeometry(12, 10, 10);
        var hotelMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var hotel = new THREE.Mesh(hotelGeom, hotelMat);
        hotel.position.set(-20, 5, -15);
        scene.add(hotel);
        objects.push(hotel);

        // Inveroran Hotel stable block (box)
        var stableGeom = new THREE.BoxGeometry(10, 8, 8);
        var stableMat = new THREE.MeshLambertMaterial({ color: 0x704020 });
        var stable = new THREE.Mesh(stableGeom, stableMat);
        stable.position.set(-20, 4, -5);
        scene.add(stable);
        objects.push(stable);

        // Inveroran water tank (cylinder)
        var tankGeom = new THREE.CylinderGeometry(3, 3, 6, 8);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(-20, 3, 0);
        scene.add(tank);
        objects.push(tank);

        // Victoria Bridge stone arch (box)
        var bridgeGeom = new THREE.BoxGeometry(15, 4, 3);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x6b5d52 });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(0, 2, -20);
        scene.add(bridge);
        objects.push(bridge);

        // Victoria Bridge explosive charge (sphere)
        var explosiveGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var explosiveMat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        var explosive = new THREE.Mesh(explosiveGeom, explosiveMat);
        explosive.position.set(0, 6, -20);
        scene.add(explosive);
        objects.push(explosive);

        // Victoria Bridge command wire (LineSegments)
        var wirePoints1 = [
            new THREE.Vector3(0, 6, -20),
            new THREE.Vector3(10, 8, -18)
        ];
        var wireGeom1 = new THREE.BufferGeometry().setFromPoints(wirePoints1);
        var wireMat1 = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        var wire1 = new THREE.LineSegments(wireGeom1, wireMat1);
        scene.add(wire1);
        objects.push(wire1);

        // Black Mount stalker's bothy (box)
        var bothyGeom = new THREE.BoxGeometry(8, 7, 7);
        var bothyMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var bothy = new THREE.Mesh(bothyGeom, bothyMat);
        bothy.position.set(20, 3, 15);
        scene.add(bothy);
        objects.push(bothy);

        // Black Mount signal mast (cylinder)
        var mastGeom = new THREE.CylinderGeometry(1, 1, 12, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(20, 6, 15);
        scene.add(mast);
        objects.push(mast);

        // Black Mount relay wire (LineSegments)
        var wirePoints2 = [
            new THREE.Vector3(20, 12, 15),
            new THREE.Vector3(0, 8, 0)
        ];
        var wireGeom2 = new THREE.BufferGeometry().setFromPoints(wirePoints2);
        var wireMat2 = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
        var wire2 = new THREE.LineSegments(wireGeom2, wireMat2);
        scene.add(wire2);
        objects.push(wire2);

        // Rannoch Moor peat bog terrain (box)
        var peatGeom = new THREE.BoxGeometry(40, 3, 35);
        var peatMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var peat = new THREE.Mesh(peatGeom, peatMat);
        peat.position.set(15, -1, 18);
        scene.add(peat);
        objects.push(peat);

        // Rannoch mine 1 (sphere)
        var mine1Geom = new THREE.SphereGeometry(1, 6, 6);
        var mine1Mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var mine1 = new THREE.Mesh(mine1Geom, mine1Mat);
        mine1.position.set(10, 1, 10);
        scene.add(mine1);
        objects.push(mine1);

        // Rannoch mine 2 (sphere)
        var mine2Geom = new THREE.SphereGeometry(1, 6, 6);
        var mine2Mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var mine2 = new THREE.Mesh(mine2Geom, mine2Mat);
        mine2.position.set(20, 1, 25);
        scene.add(mine2);
        objects.push(mine2);

        // Rannoch perimeter wire (LineSegments)
        var wirePoints3 = [
            new THREE.Vector3(5, 2, 5),
            new THREE.Vector3(25, 2, 30)
        ];
        var wireGeom3 = new THREE.BufferGeometry().setFromPoints(wirePoints3);
        var wireMat3 = new THREE.LineBasicMaterial({ color: 0x555555, linewidth: 1.5 });
        var wire3 = new THREE.LineSegments(wireGeom3, wireMat3);
        scene.add(wire3);
        objects.push(wire3);

        // Gorton ruined shielings walls (box)
        var wallsGeom = new THREE.BoxGeometry(10, 6, 10);
        var wallsMat = new THREE.MeshLambertMaterial({ color: 0x696959 });
        var walls = new THREE.Mesh(wallsGeom, wallsMat);
        walls.position.set(-15, 3, 10);
        scene.add(walls);
        objects.push(walls);

        // Gorton hidden crates (box)
        var cratesGeom = new THREE.BoxGeometry(6, 4, 6);
        var cratesMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var crates = new THREE.Mesh(cratesGeom, cratesMat);
        crates.position.set(-15, 2, 10);
        scene.add(crates);
        objects.push(crates);

        // Gorton marker post (cone)
        var postGeom = new THREE.ConeGeometry(1.5, 5, 6);
        var postMat = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        var post = new THREE.Mesh(postGeom, postMat);
        post.position.set(-15, 2.5, 18);
        scene.add(post);
        objects.push(post);

        // Forest Lodge stepping stones (box)
        var stonesGeom = new THREE.BoxGeometry(8, 1, 12);
        var stonesMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var stones = new THREE.Mesh(stonesGeom, stonesMat);
        stones.position.set(-8, 0, -8);
        scene.add(stones);
        objects.push(stones);

        // Forest Lodge IED (sphere)
        var iedGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0xcd5c5c });
        var ied = new THREE.Mesh(iedGeom, iedMat);
        ied.position.set(-8, 1.5, -8);
        scene.add(ied);
        objects.push(ied);

        // Forest Lodge tripwire (LineSegments)
        var wirePoints4 = [
            new THREE.Vector3(-10, 1, -8),
            new THREE.Vector3(-6, 1, -8)
        ];
        var wireGeom4 = new THREE.BufferGeometry().setFromPoints(wirePoints4);
        var wireMat4 = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        var wire4 = new THREE.LineSegments(wireGeom4, wireMat4);
        scene.add(wire4);
        objects.push(wire4);

        // Beinn Achaladair stone shelter (box)
        var shelterGeom = new THREE.BoxGeometry(7, 5, 7);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x8b8680 });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(8, 2.5, 5);
        scene.add(shelter);
        objects.push(shelter);

        // Beinn Achaladair comms mast (cylinder)
        var commsMastGeom = new THREE.CylinderGeometry(0.8, 0.8, 10, 6);
        var commsMastMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var commsMast = new THREE.Mesh(commsMastGeom, commsMastMat);
        commsMast.position.set(8, 5, 5);
        scene.add(commsMast);
        objects.push(commsMast);

        // Beinn Achaladair radome (sphere)
        var radomeGeom = new THREE.SphereGeometry(1.3, 8, 8);
        var radiomeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var radome = new THREE.Mesh(radomeGeom, radiomeMat);
        radome.position.set(8, 10, 5);
        scene.add(radome);
        objects.push(radome);

        // Add lights
        var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(30, 40, 30);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xcccccc, 0.5);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animation loop
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
