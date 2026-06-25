window.GarelochheadFort = (function() {
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
        // Gareloch loch-head defensive wall - box concrete sea wall
        var seawallGeom = new THREE.BoxGeometry(40, 8, 3);
        var seawallMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var seawall = new THREE.Mesh(seawallGeom, seawallMat);
        seawall.position.set(-25, 4, -28);
        scene.add(seawall);
        objects.push(seawall);

        // Torpedo net winch - cylinder
        var winchGeom = new THREE.CylinderGeometry(3, 3, 6, 16);
        var winchMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var winch = new THREE.Mesh(winchGeom, winchMat);
        winch.position.set(-20, 3, -25);
        scene.add(winch);
        objects.push(winch);

        // Control cabin - box
        var cabinGeom = new THREE.BoxGeometry(8, 6, 6);
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.position.set(-10, 3, -20);
        scene.add(cabin);
        objects.push(cabin);

        // MoD restricted zone perimeter - box chain-link fence section 1
        var fenceGeom = new THREE.BoxGeometry(25, 4, 0.5);
        var fenceMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var fence1 = new THREE.Mesh(fenceGeom, fenceMat);
        fence1.position.set(0, 2, 10);
        scene.add(fence1);
        objects.push(fence1);

        // Guard tower 1 - cylinder
        var towerGeom = new THREE.CylinderGeometry(2.5, 3, 10, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var tower1 = new THREE.Mesh(towerGeom, towerMat);
        tower1.position.set(15, 5, 15);
        scene.add(tower1);
        objects.push(tower1);

        // Guard tower 2 - cylinder
        var tower2 = new THREE.Mesh(towerGeom, towerMat);
        tower2.position.set(-15, 5, 15);
        scene.add(tower2);
        objects.push(tower2);

        // Floodlights 1 - sphere
        var floodGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var floodMat = new THREE.MeshLambertMaterial({ color: 0xffff99 });
        var flood1 = new THREE.Mesh(floodGeom, floodMat);
        flood1.position.set(10, 12, 18);
        scene.add(flood1);
        objects.push(flood1);

        // Floodlights 2 - sphere
        var flood2 = new THREE.Mesh(floodGeom, floodMat);
        flood2.position.set(-12, 12, 18);
        scene.add(flood2);
        objects.push(flood2);

        // Faslane road checkpoint - concrete barriers
        var barrierGeom = new THREE.BoxGeometry(6, 3, 2);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var barrier1 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier1.position.set(5, 1.5, 25);
        scene.add(barrier1);
        objects.push(barrier1);

        // Guard booth - box
        var boothGeom = new THREE.BoxGeometry(5, 4, 5);
        var boothMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var booth = new THREE.Mesh(boothGeom, boothMat);
        booth.position.set(0, 2, 30);
        scene.add(booth);
        objects.push(booth);

        // Checkpoint watchtower - cylinder
        var checkTowerGeom = new THREE.CylinderGeometry(2, 2.5, 9, 12);
        var checkTowerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var checkTower = new THREE.Mesh(checkTowerGeom, checkTowerMat);
        checkTower.position.set(12, 4.5, 28);
        scene.add(checkTower);
        objects.push(checkTower);

        // Clynder village militia strongpoint - stone cottages
        var cottageGeom = new THREE.BoxGeometry(6, 5, 8);
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0x996633 });
        var cottage1 = new THREE.Mesh(cottageGeom, cottageMat);
        cottage1.position.set(-20, 2.5, 5);
        scene.add(cottage1);
        objects.push(cottage1);

        // Sandbagged window - box
        var sandbagGeom = new THREE.BoxGeometry(2, 2, 0.8);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x999966 });
        var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
        sandbag.position.set(-20, 3, 9);
        scene.add(sandbag);
        objects.push(sandbag);

        // IED trap 1 - sphere (Clynder)
        var iedGeom = new THREE.SphereGeometry(0.8, 6, 6);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x664444 });
        var ied1 = new THREE.Mesh(iedGeom, iedMat);
        ied1.position.set(-15, 0.8, 8);
        scene.add(ied1);
        objects.push(ied1);

        // Rosneath peninsula patrol - clifftop OP (observation post)
        var opGeom = new THREE.BoxGeometry(5, 3, 5);
        var opMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var op = new THREE.Mesh(opGeom, opMat);
        op.position.set(22, 1.5, -5);
        scene.add(op);
        objects.push(op);

        // Signal mast - cylinder
        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 15, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(25, 7.5, -3);
        scene.add(mast);
        objects.push(mast);

        // Buoys - spheres
        var buoyGeom = new THREE.SphereGeometry(1, 6, 6);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(30, 1, -15);
        scene.add(buoy1);
        objects.push(buoy1);

        // Sensor cable - LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePoints = [
            new THREE.Vector3(25, 7.5, -3),
            new THREE.Vector3(30, 1, -15)
        ];
        cableGeom.setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        var cable1 = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable1);
        objects.push(cable1);

        // Glen Fruin ambush valley - highland road
        var roadGeom = new THREE.BoxGeometry(8, 0.5, 20);
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var road = new THREE.Mesh(roadGeom, roadMat);
        road.position.set(-8, 0.25, -8);
        scene.add(road);
        objects.push(road);

        // Stone wall cover - box
        var wallGeom = new THREE.BoxGeometry(15, 3, 1);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(-25, 1.5, -12);
        scene.add(wall);
        objects.push(wall);

        // IED charges 2 - sphere (Glen Fruin)
        var ied2 = new THREE.Mesh(iedGeom, iedMat);
        ied2.position.set(-10, 0.8, -5);
        scene.add(ied2);
        objects.push(ied2);

        // Command wire - LineSegments (Glen Fruin)
        var cmdWireGeom = new THREE.BufferGeometry();
        var cmdWirePoints = [
            new THREE.Vector3(-25, 1.5, -12),
            new THREE.Vector3(-10, 0.8, -5)
        ];
        cmdWireGeom.setFromPoints(cmdWirePoints);
        var cmdWireMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var cmdWire = new THREE.LineSegments(cmdWireGeom, cmdWireMat);
        scene.add(cmdWire);
        objects.push(cmdWire);

        // Shandon hotel command HQ - Victorian hotel box
        var hotelGeom = new THREE.BoxGeometry(12, 8, 10);
        var hotelMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var hotel = new THREE.Mesh(hotelGeom, hotelMat);
        hotel.position.set(8, 4, -18);
        scene.add(hotel);
        objects.push(hotel);

        // Generator shed - box
        var genGeom = new THREE.BoxGeometry(4, 3, 5);
        var genMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var gen = new THREE.Mesh(genGeom, genMat);
        gen.position.set(16, 1.5, -15);
        scene.add(gen);
        objects.push(gen);

        // Comms mast - cylinder
        var commsMastGeom = new THREE.CylinderGeometry(1, 1, 12, 8);
        var commsMastMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var commsMast = new THREE.Mesh(commsMastGeom, commsMastMat);
        commsMast.position.set(14, 6, -20);
        scene.add(commsMast);
        objects.push(commsMast);

        // Coulport road interdiction - blast-proof barriers
        var blastBarrierGeom = new THREE.BoxGeometry(5, 4, 3);
        var blastBarrierMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var blastBarrier = new THREE.Mesh(blastBarrierGeom, blastBarrierMat);
        blastBarrier.position.set(-5, 2, -30);
        scene.add(blastBarrier);
        objects.push(blastBarrier);

        // Armed checkpoint - box
        var armedCheckGeom = new THREE.BoxGeometry(6, 3, 7);
        var armedCheckMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var armedCheck = new THREE.Mesh(armedCheckGeom, armedCheckMat);
        armedCheck.position.set(3, 1.5, -32);
        scene.add(armedCheck);
        objects.push(armedCheck);

        // Traffic cones - cone geometry
        var coneGeom = new THREE.ConeGeometry(0.8, 1.5, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var cone1 = new THREE.Mesh(coneGeom, coneMat);
        cone1.position.set(-2, 0.75, -35);
        scene.add(cone1);
        objects.push(cone1);

        var cone2 = new THREE.Mesh(coneGeom, coneMat);
        cone2.position.set(8, 0.75, -35);
        scene.add(cone2);
        objects.push(cone2);

        // Additional fence section 2
        var fence2 = new THREE.Mesh(fenceGeom, fenceMat);
        fence2.position.set(0, 2, -10);
        scene.add(fence2);
        objects.push(fence2);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation loop - rotate some objects for visual interest
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.1;
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
