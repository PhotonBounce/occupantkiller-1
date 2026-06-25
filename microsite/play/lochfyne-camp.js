window.LochfyneCamp = (function() {
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
        // Loch Fyne inlet water base
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a5c7a });
        var waterGeom = new THREE.BoxGeometry(80, 2, 100);
        var water = new THREE.Mesh(waterGeom, waterMaterial);
        water.position.set(0, -5, 0);
        scene.add(water);
        objects.push(water);

        // Herring fishing fleet drifter 1
        var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a3d });
        var hullGeom = new THREE.BoxGeometry(8, 3, 20);
        var drifter1 = new THREE.Mesh(hullGeom, hullMaterial);
        drifter1.position.set(-25, -2, -15);
        scene.add(drifter1);
        objects.push(drifter1);

        var mastMaterial = new THREE.MeshLambertMaterial({ color: 0x8b8680 });
        var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 18, 8);
        var mast1 = new THREE.Mesh(mastGeom, mastMaterial);
        mast1.position.set(-25, 8, -15);
        scene.add(mast1);
        objects.push(mast1);

        // Herring fishing fleet drifter 2
        var drifter2 = new THREE.Mesh(hullGeom, hullMaterial);
        drifter2.position.set(-15, -2, 5);
        scene.add(drifter2);
        objects.push(drifter2);

        var mast2 = new THREE.Mesh(mastGeom, mastMaterial);
        mast2.position.set(-15, 8, 5);
        scene.add(mast2);
        objects.push(mast2);

        // Fish hold covers
        var holdMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var holdGeom = new THREE.BoxGeometry(6, 2, 10);
        var hold1 = new THREE.Mesh(holdGeom, holdMaterial);
        hold1.position.set(-25, 0.5, -15);
        scene.add(hold1);
        objects.push(hold1);

        // Strachur shore base village hall HQ
        var villageHallMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var villageHallGeom = new THREE.BoxGeometry(16, 10, 20);
        var villageHall = new THREE.Mesh(villageHallGeom, villageHallMaterial);
        villageHall.position.set(20, 3, -20);
        scene.add(villageHall);
        objects.push(villageHall);

        // Strachur jetty
        var jettyMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var jettyGeom = new THREE.BoxGeometry(4, 2, 30);
        var jetty = new THREE.Mesh(jettyGeom, jettyMaterial);
        jetty.position.set(25, -3, 0);
        scene.add(jetty);
        objects.push(jetty);

        // Fuel tank cylinder
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0xc0a080 });
        var tankGeom = new THREE.CylinderGeometry(3, 3, 12, 16);
        var fuelTank = new THREE.Mesh(tankGeom, tankMaterial);
        fuelTank.position.set(22, 5, -25);
        scene.add(fuelTank);
        objects.push(fuelTank);

        // Newton Hill stone sheepfold
        var sheepfoldMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var sheepfoldGeom = new THREE.BoxGeometry(18, 3, 14);
        var sheepfold = new THREE.Mesh(sheepfoldGeom, sheepfoldMaterial);
        sheepfold.position.set(-10, 28, 22);
        scene.add(sheepfold);
        objects.push(sheepfold);

        // Signal mast on hilltop
        var signalMastGeom = new THREE.CylinderGeometry(0.6, 0.6, 22, 8);
        var signalMast = new THREE.Mesh(signalMastGeom, mastMaterial);
        signalMast.position.set(-10, 38, 22);
        scene.add(signalMast);
        objects.push(signalMast);

        // Newton Hill to valley communication wire
        var wireGeom = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -10, 38, 22,
            5, 10, -18
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireSegments = new THREE.LineSegments(wireGeom, new THREE.LineBasicMaterial({ color: 0x333333 }));
        scene.add(wireSegments);
        objects.push(wireSegments);

        // Creggans Inn hotel building
        var innMaterial = new THREE.MeshLambertMaterial({ color: 0xa0522d });
        var innGeom = new THREE.BoxGeometry(14, 8, 16);
        var inn = new THREE.Mesh(innGeom, innMaterial);
        inn.position.set(15, 2, 12);
        scene.add(inn);
        objects.push(inn);

        // Vehicle park
        var parkMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var parkGeom = new THREE.BoxGeometry(20, 0.8, 12);
        var park = new THREE.Mesh(parkGeom, parkMaterial);
        park.position.set(25, 0, 8);
        scene.add(park);
        objects.push(park);

        // Fuel dump marker spheres
        var fuelMarkerMaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        var markerGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var marker1 = new THREE.Mesh(markerGeom, fuelMarkerMaterial);
        marker1.position.set(28, 2, 15);
        scene.add(marker1);
        objects.push(marker1);

        var marker2 = new THREE.Mesh(markerGeom, fuelMarkerMaterial);
        marker2.position.set(32, 2, 18);
        scene.add(marker2);
        objects.push(marker2);

        // St Catherines submarine resupply cove shingle beach quay
        var quayMaterial = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        var quayGeom = new THREE.BoxGeometry(24, 2, 8);
        var quay = new THREE.Mesh(quayGeom, quayMaterial);
        quay.position.set(-22, -3, 20);
        scene.add(quay);
        objects.push(quay);

        // Submarine conning tower
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var towerGeom = new THREE.CylinderGeometry(2.5, 2.5, 8, 12);
        var tower = new THREE.Mesh(towerGeom, towerMaterial);
        tower.position.set(-22, 1, 20);
        scene.add(tower);
        objects.push(tower);

        // Sensor buoys
        var buoyMaterial = new THREE.MeshLambertMaterial({ color: 0xffa500 });
        var buoyGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy1.position.set(-28, 1, 25);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy2.position.set(-16, 1, 26);
        scene.add(buoy2);
        objects.push(buoy2);

        // Strachurmore ammunition cache camouflaged depot
        var depotMaterial = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var depotGeom = new THREE.BoxGeometry(12, 6, 10);
        var depot = new THREE.Mesh(depotGeom, depotMaterial);
        depot.position.set(-30, 2, -5);
        scene.add(depot);
        objects.push(depot);

        // Marker post cones
        var coneMarkerMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var coneGeom = new THREE.ConeGeometry(1, 3, 8);
        var cone1 = new THREE.Mesh(coneGeom, coneMarkerMaterial);
        cone1.position.set(-36, 0.5, -8);
        scene.add(cone1);
        objects.push(cone1);

        var cone2 = new THREE.Mesh(coneGeom, coneMarkerMaterial);
        cone2.position.set(-24, 0.5, -8);
        scene.add(cone2);
        objects.push(cone2);

        // Ammunition cache security wire perimeter
        var secWireGeom = new THREE.BufferGeometry();
        var secWirePositions = new Float32Array([
            -36, 0, -10,
            -24, 0, -10,
            -24, 0, 0,
            -36, 0, 0,
            -36, 0, -10
        ]);
        secWireGeom.setAttribute('position', new THREE.BufferAttribute(secWirePositions, 3));
        var secWireSegments = new THREE.LineSegments(secWireGeom, new THREE.LineBasicMaterial({ color: 0x8b0000 }));
        scene.add(secWireSegments);
        objects.push(secWireSegments);

        // Otter Ferry crossing control slipway
        var slipwayMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var slipwayGeom = new THREE.BoxGeometry(6, 1, 16);
        var slipway = new THREE.Mesh(slipwayGeom, slipwayMaterial);
        slipway.position.set(5, -3.5, -28);
        scene.add(slipway);
        objects.push(slipway);

        // Crossing barrier
        var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0xdc143c });
        var barrierGeom = new THREE.BoxGeometry(2, 4, 12);
        var barrier = new THREE.Mesh(barrierGeom, barrierMaterial);
        barrier.position.set(5, 0, -38);
        scene.add(barrier);
        objects.push(barrier);

        // Guard post cylinder
        var guardMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var guardGeom = new THREE.CylinderGeometry(1.8, 1.8, 5, 8);
        var guardPost = new THREE.Mesh(guardGeom, guardMaterial);
        guardPost.position.set(10, 0, -32);
        scene.add(guardPost);
        objects.push(guardPost);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(40, 50, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation loop placeholder
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
