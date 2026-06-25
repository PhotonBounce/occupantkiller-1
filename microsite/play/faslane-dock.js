window.FaslaneDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        // Submarine pen complex - reinforced concrete pens
        var pen1Geometry = new THREE.BoxGeometry(12, 8, 20);
        var pen1Material = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var pen1 = new THREE.Mesh(pen1Geometry, pen1Material);
        pen1.position.set(-25, 4, -20);
        scene.add(pen1);
        objects.push(pen1);

        var pen2Geometry = new THREE.BoxGeometry(12, 8, 20);
        var pen2Material = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var pen2 = new THREE.Mesh(pen2Geometry, pen2Material);
        pen2.position.set(-10, 4, -20);
        scene.add(pen2);
        objects.push(pen2);

        // Submarine hull sections - cylinders
        var subHull1Geometry = new THREE.CylinderGeometry(3, 3, 15, 16);
        var subHull1Material = new THREE.MeshLambertMaterial({ color: 0x222255 });
        var subHull1 = new THREE.Mesh(subHull1Geometry, subHull1Material);
        subHull1.position.set(-25, 3, -15);
        subHull1.rotation.z = Math.PI / 2;
        scene.add(subHull1);
        objects.push(subHull1);

        var subHull2Geometry = new THREE.CylinderGeometry(3, 3, 15, 16);
        var subHull2Material = new THREE.MeshLambertMaterial({ color: 0x1a1a3a });
        var subHull2 = new THREE.Mesh(subHull2Geometry, subHull2Material);
        subHull2.position.set(-10, 3, -15);
        subHull2.rotation.z = Math.PI / 2;
        scene.add(subHull2);
        objects.push(subHull2);

        // Torpedo loading dock
        var torpedoDockGeometry = new THREE.BoxGeometry(8, 6, 12);
        var torpedoDockMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var torpedoDock = new THREE.Mesh(torpedoDockGeometry, torpedoDockMaterial);
        torpedoDock.position.set(0, 3, -18);
        scene.add(torpedoDock);
        objects.push(torpedoDock);

        // HMS Neptune command building - headquarters block
        var hqBlockGeometry = new THREE.BoxGeometry(10, 12, 8);
        var hqBlockMaterial = new THREE.MeshLambertMaterial({ color: 0x774400 });
        var hqBlock = new THREE.Mesh(hqBlockGeometry, hqBlockMaterial);
        hqBlock.position.set(15, 6, -5);
        scene.add(hqBlock);
        objects.push(hqBlock);

        // Communications mast - cylinder
        var commsMastGeometry = new THREE.CylinderGeometry(1.5, 1.5, 25, 12);
        var commsMastMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var commsMast = new THREE.Mesh(commsMastGeometry, commsMastMaterial);
        commsMast.position.set(20, 12.5, -5);
        scene.add(commsMast);
        objects.push(commsMast);

        // Vehicle compound
        var vehicleCompoundGeometry = new THREE.BoxGeometry(12, 1, 10);
        var vehicleCompoundMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var vehicleCompound = new THREE.Mesh(vehicleCompoundGeometry, vehicleCompoundMaterial);
        vehicleCompound.position.set(18, 0.5, 8);
        scene.add(vehicleCompound);
        objects.push(vehicleCompound);

        // Trident missile store - heavily armored bunker
        var bunkerGeometry = new THREE.BoxGeometry(15, 10, 12);
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
        bunker.position.set(-20, 5, 15);
        scene.add(bunker);
        objects.push(bunker);

        // Sentry tower - cylinder
        var sentryGeometry = new THREE.CylinderGeometry(2, 2.5, 18, 12);
        var sentryMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var sentry = new THREE.Mesh(sentryGeometry, sentryMaterial);
        sentry.position.set(-28, 9, 20);
        scene.add(sentry);
        objects.push(sentry);

        // Razor wire perimeter - LineSegments
        var wirePoints = [
            new THREE.Vector3(-30, 8, 25),
            new THREE.Vector3(30, 8, 25),
            new THREE.Vector3(30, 8, -30),
            new THREE.Vector3(-30, 8, -30),
            new THREE.Vector3(-30, 8, 25)
        ];
        var wireGeometry = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0xcccccc });
        var wirePerimeter = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wirePerimeter);
        objects.push(wirePerimeter);

        // Faslane village approach - protest camp box
        var protestCampGeometry = new THREE.BoxGeometry(6, 1, 8);
        var protestCampMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var protestCamp = new THREE.Mesh(protestCampGeometry, protestCampMaterial);
        protestCamp.position.set(-5, 0.5, 25);
        scene.add(protestCamp);
        objects.push(protestCamp);

        // MoD barrier
        var barrierGeometry = new THREE.BoxGeometry(20, 3, 1);
        var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
        barrier.position.set(5, 1.5, 28);
        scene.add(barrier);
        objects.push(barrier);

        // Floodlights - spheres
        var floodlight1Geometry = new THREE.SphereGeometry(1.2, 8, 8);
        var floodlight1Material = new THREE.MeshLambertMaterial({ color: 0xffff99 });
        var floodlight1 = new THREE.Mesh(floodlight1Geometry, floodlight1Material);
        floodlight1.position.set(0, 15, 20);
        scene.add(floodlight1);
        objects.push(floodlight1);

        var floodlight2Geometry = new THREE.SphereGeometry(1.2, 8, 8);
        var floodlight2Material = new THREE.MeshLambertMaterial({ color: 0xffff99 });
        var floodlight2 = new THREE.Mesh(floodlight2Geometry, floodlight2Material);
        floodlight2.position.set(25, 15, 15);
        scene.add(floodlight2);
        objects.push(floodlight2);

        // Gareloch patrol boats - cylinder hulls
        var patrolBoat1Geometry = new THREE.CylinderGeometry(2, 2, 12, 14);
        var patrolBoat1Material = new THREE.MeshLambertMaterial({ color: 0x003366 });
        var patrolBoat1 = new THREE.Mesh(patrolBoat1Geometry, patrolBoat1Material);
        patrolBoat1.position.set(10, 2, -5);
        patrolBoat1.rotation.z = Math.PI / 2;
        scene.add(patrolBoat1);
        objects.push(patrolBoat1);

        // Sonar buoys - spheres
        var sonarBuoy1Geometry = new THREE.SphereGeometry(0.8, 8, 8);
        var sonarBuoy1Material = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var sonarBuoy1 = new THREE.Mesh(sonarBuoy1Geometry, sonarBuoy1Material);
        sonarBuoy1.position.set(12, 1, -8);
        scene.add(sonarBuoy1);
        objects.push(sonarBuoy1);

        // Net barrier - LineSegments
        var netPoints = [
            new THREE.Vector3(8, 2, -2),
            new THREE.Vector3(14, 2, -2),
            new THREE.Vector3(14, 2, -10),
            new THREE.Vector3(8, 2, -10),
            new THREE.Vector3(8, 2, -2)
        ];
        var netGeometry = new THREE.BufferGeometry().setFromPoints(netPoints);
        var netMaterial = new THREE.LineBasicMaterial({ color: 0x00aa00 });
        var netBarrier = new THREE.LineSegments(netGeometry, netMaterial);
        scene.add(netBarrier);
        objects.push(netBarrier);

        // Security gatehouse
        var gatehouseGeometry = new THREE.BoxGeometry(5, 4, 5);
        var gatehouseMaterial = new THREE.MeshLambertMaterial({ color: 0x993333 });
        var gatehouse = new THREE.Mesh(gatehouseGeometry, gatehouseMaterial);
        gatehouse.position.set(-28, 2, 0);
        scene.add(gatehouse);
        objects.push(gatehouse);

        // Watchtower - cylinder
        var watchtowerGeometry = new THREE.CylinderGeometry(1.8, 2, 16, 12);
        var watchtowerMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var watchtower = new THREE.Mesh(watchtowerGeometry, watchtowerMaterial);
        watchtower.position.set(-30, 8, 5);
        scene.add(watchtower);
        objects.push(watchtower);

        // Fence sections - LineSegments
        var fencePoints = [
            new THREE.Vector3(-32, 5, -25),
            new THREE.Vector3(-32, 5, 25),
            new THREE.Vector3(32, 5, 25),
            new THREE.Vector3(32, 5, -25),
            new THREE.Vector3(-32, 5, -25)
        ];
        var fenceGeometry = new THREE.BufferGeometry().setFromPoints(fencePoints);
        var fenceMaterial = new THREE.LineBasicMaterial({ color: 0x666666 });
        var fence = new THREE.LineSegments(fenceGeometry, fenceMaterial);
        scene.add(fence);
        objects.push(fence);

        // Engineering workshops - dry dock box
        var dryDockGeometry = new THREE.BoxGeometry(10, 7, 14);
        var dryDockMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var dryDock = new THREE.Mesh(dryDockGeometry, dryDockMaterial);
        dryDock.position.set(20, 3.5, -15);
        scene.add(dryDock);
        objects.push(dryDock);

        // Crane structure - box
        var craneGeometry = new THREE.BoxGeometry(8, 15, 4);
        var craneMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        var crane = new THREE.Mesh(craneGeometry, craneMaterial);
        crane.position.set(22, 7.5, -5);
        scene.add(crane);
        objects.push(crane);

        // Fuel tanks - cylinders
        var fuelTank1Geometry = new THREE.CylinderGeometry(2.5, 2.5, 8, 12);
        var fuelTank1Material = new THREE.MeshLambertMaterial({ color: 0xdd4400 });
        var fuelTank1 = new THREE.Mesh(fuelTank1Geometry, fuelTank1Material);
        fuelTank1.position.set(28, 4, -10);
        scene.add(fuelTank1);
        objects.push(fuelTank1);

        // Explosive ordnance dump - blast-proof magazines
        var magazineGeometry = new THREE.BoxGeometry(7, 6, 9);
        var magazineMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var magazine = new THREE.Mesh(magazineGeometry, magazineMaterial);
        magazine.position.set(5, 3, 18);
        scene.add(magazine);
        objects.push(magazine);

        // Security post
        var securityPostGeometry = new THREE.BoxGeometry(4, 3, 4);
        var securityPostMaterial = new THREE.MeshLambertMaterial({ color: 0x882222 });
        var securityPost = new THREE.Mesh(securityPostGeometry, securityPostMaterial);
        securityPost.position.set(12, 1.5, 20);
        scene.add(securityPost);
        objects.push(securityPost);

        // Warning markers - spheres
        var warningMarkerGeometry = new THREE.SphereGeometry(0.6, 8, 8);
        var warningMarkerMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var warningMarker = new THREE.Mesh(warningMarkerGeometry, warningMarkerMaterial);
        warningMarker.position.set(8, 0.6, 15);
        scene.add(warningMarker);
        objects.push(warningMarker);

        // Add directional light
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0x666666, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        // Animation placeholder
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
