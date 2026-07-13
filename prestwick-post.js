window.PrestwickPost = (function() {
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
        // Prestwick Airport runway complex
        var runwayGeom = new THREE.BoxGeometry(60, 2, 8);
        var runwayMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var runway = new THREE.Mesh(runwayGeom, runwayMat);
        runway.position.set(0, 0.5, -20);
        scene.add(runway);
        objects.push(runway);

        // Control tower
        var towerGeom = new THREE.BoxGeometry(6, 20, 6);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(15, 10, -15);
        scene.add(tower);
        objects.push(tower);

        // Fuel tanker
        var tankerGeom = new THREE.CylinderGeometry(3, 3, 12, 16);
        var tankerMat = new THREE.MeshLambertMaterial({ color: 0xccaa00 });
        var tanker = new THREE.Mesh(tankerGeom, tankerMat);
        tanker.position.set(20, 6, 5);
        tanker.rotation.z = Math.PI / 2;
        scene.add(tanker);
        objects.push(tanker);

        // NATO AWACS operations - hardened building
        var opsGeom = new THREE.BoxGeometry(25, 8, 20);
        var opsMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var ops = new THREE.Mesh(opsGeom, opsMat);
        ops.position.set(-25, 4, 10);
        scene.add(ops);
        objects.push(ops);

        // Aircraft hangar
        var hangarGeom = new THREE.BoxGeometry(30, 15, 40);
        var hangarMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var hangar = new THREE.Mesh(hangarGeom, hangarMat);
        hangar.position.set(-20, 7.5, 25);
        scene.add(hangar);
        objects.push(hangar);

        // Rotating radar dome
        var radarGeom = new THREE.SphereGeometry(5, 12, 12);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var radar = new THREE.Mesh(radarGeom, radarMat);
        radar.position.set(-25, 25, 15);
        scene.add(radar);
        objects.push(radar);

        // Perimeter reinforced fence
        var fenceGeom = new THREE.BoxGeometry(80, 3, 1);
        var fenceMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var fence = new THREE.Mesh(fenceGeom, fenceMat);
        fence.position.set(0, 1.5, -35);
        scene.add(fence);
        objects.push(fence);

        // Guard tower 1
        var guard1Geom = new THREE.CylinderGeometry(2, 2, 10, 12);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var guard1 = new THREE.Mesh(guard1Geom, guardMat);
        guard1.position.set(-30, 5, -32);
        scene.add(guard1);
        objects.push(guard1);

        // Guard tower 2
        var guard2 = new THREE.Mesh(guard1Geom, guardMat);
        guard2.position.set(30, 5, -32);
        scene.add(guard2);
        objects.push(guard2);

        // Floodlight pole
        var floodGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var floodMat = new THREE.MeshLambertMaterial({ color: 0xffff99 });
        var flood = new THREE.Mesh(floodGeom, floodMat);
        flood.position.set(-15, 20, -30);
        scene.add(flood);
        objects.push(flood);

        // Road approach - blast barriers
        var barrierGeom = new THREE.BoxGeometry(4, 2, 2);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x888800 });
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(0, 1, 30);
        scene.add(barrier);
        objects.push(barrier);

        // Checkpoint building
        var checkpointGeom = new THREE.BoxGeometry(8, 4, 6);
        var checkpointMat = new THREE.MeshLambertMaterial({ color: 0x666600 });
        var checkpoint = new THREE.Mesh(checkpointGeom, checkpointMat);
        checkpoint.position.set(12, 2, 28);
        scene.add(checkpoint);
        objects.push(checkpoint);

        // Traffic cones
        var coneGeom = new THREE.ConeGeometry(1, 3, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var cone1 = new THREE.Mesh(coneGeom, coneMat);
        cone1.position.set(-5, 1.5, 28);
        scene.add(cone1);
        objects.push(cone1);

        var cone2 = new THREE.Mesh(coneGeom, coneMat);
        cone2.position.set(5, 1.5, 28);
        scene.add(cone2);
        objects.push(cone2);

        // Monkton church - Norman stone
        var churchGeom = new THREE.BoxGeometry(8, 14, 10);
        var churchMat = new THREE.MeshLambertMaterial({ color: 0xaa9966 });
        var church = new THREE.Mesh(churchGeom, churchMat);
        church.position.set(-28, 7, -8);
        scene.add(church);
        objects.push(church);

        // Church fortified wall
        var churchWallGeom = new THREE.BoxGeometry(16, 4, 2);
        var churchWallMat = new THREE.MeshLambertMaterial({ color: 0x996633 });
        var churchWall = new THREE.Mesh(churchWallGeom, churchWallMat);
        churchWall.position.set(-28, 2, 3);
        scene.add(churchWall);
        objects.push(churchWall);

        // Bell tower
        var bellGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 12);
        var bellMat = new THREE.MeshLambertMaterial({ color: 0x884422 });
        var bell = new THREE.Mesh(bellGeom, bellMat);
        bell.position.set(-28, 18, -8);
        scene.add(bell);
        objects.push(bell);

        // Bruce's Well coastal OP - clifftop shelter
        var cliffGeom = new THREE.BoxGeometry(6, 5, 8);
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x778899 });
        var cliff = new THREE.Mesh(cliffGeom, cliffMat);
        cliff.position.set(28, 25, -25);
        scene.add(cliff);
        objects.push(cliff);

        // Sensor buoys
        var buoyGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        var buoy = new THREE.Mesh(buoyGeom, buoyMat);
        buoy.position.set(32, 24, -28);
        scene.add(buoy);
        objects.push(buoy);

        // Cable net (using LineSegments)
        var cablePoints = [
            new THREE.Vector3(28, 25, -25),
            new THREE.Vector3(32, 24, -28),
            new THREE.Vector3(28, 22, -30),
            new THREE.Vector3(25, 23, -26)
        ];
        var cableGeom = new THREE.BufferGeometry();
        cableGeom.setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0x999999 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Pow Burn valley ambush - track
        var trackGeom = new THREE.BoxGeometry(3, 1, 35);
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var track = new THREE.Mesh(trackGeom, trackMat);
        track.position.set(0, 0.5, 8);
        scene.add(track);
        objects.push(track);

        // IED charges
        var iedGeom = new THREE.SphereGeometry(1, 8, 8);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var ied = new THREE.Mesh(iedGeom, iedMat);
        ied.position.set(-3, 1, 15);
        scene.add(ied);
        objects.push(ied);

        // Tripwire
        var wirePoints = [
            new THREE.Vector3(-3, 1, 15),
            new THREE.Vector3(3, 1, 15),
            new THREE.Vector3(3, 1, 20)
        ];
        var wireGeom = new THREE.BufferGeometry();
        wireGeom.setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Adamton House barracks - Georgian mansion
        var mansionGeom = new THREE.BoxGeometry(18, 10, 14);
        var mansionMat = new THREE.MeshLambertMaterial({ color: 0xcc9944 });
        var mansion = new THREE.Mesh(mansionGeom, mansionMat);
        mansion.position.set(22, 5, -5);
        scene.add(mansion);
        objects.push(mansion);

        // Stable block
        var stableGeom = new THREE.BoxGeometry(12, 6, 10);
        var stableMat = new THREE.MeshLambertMaterial({ color: 0xbb8833 });
        var stable = new THREE.Mesh(stableGeom, stableMat);
        stable.position.set(28, 3, 8);
        scene.add(stable);
        objects.push(stable);

        // Comms mast
        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 25, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(16, 12.5, -8);
        scene.add(mast);
        objects.push(mast);

        // Add lights
        var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(20, 30, 20);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Rotate radar dome
        if (objects.length > 5) {
            objects[5].rotation.y += delta * 0.5;
        }
        // Rotate beacon
        if (objects.length > 9) {
            objects[9].rotation.z += delta * 1.2;
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
