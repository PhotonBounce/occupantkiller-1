window.BalquhidderKeep = (function() {
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
        var greyMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var darkStoneMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var ironMaterial = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
        var brownMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var lightBrownMaterial = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var redMaterial = new THREE.MeshLambertMaterial({ color: 0xcc4444 });
        var creamMaterial = new THREE.MeshLambertMaterial({ color: 0xf5deb3 });

        // Rob Roy Tomb stronghold - Glen Buckie
        // Stone kirkyard wall
        var kirkWallGeom = new THREE.BoxGeometry(20, 3, 1);
        var kirkWall = new THREE.Mesh(kirkWallGeom, darkStoneMaterial);
        kirkWall.position.set(-20, 0.5, 10);
        scene.add(kirkWall);
        objects.push(kirkWall);

        // Old church ruin
        var churchGeom = new THREE.BoxGeometry(8, 6, 8);
        var church = new THREE.Mesh(churchGeom, stoneMaterial);
        church.position.set(-22, 3, 8);
        scene.add(church);
        objects.push(church);

        // Iron tomb cage cylinder
        var tombCageGeom = new THREE.CylinderGeometry(2, 2, 3, 8);
        var tombCage = new THREE.Mesh(tombCageGeom, ironMaterial);
        tombCage.position.set(-20, 2.5, 6);
        scene.add(tombCage);
        objects.push(tombCage);

        // Loch Voil shoreline patrol base
        // Boathouse
        var boathouseGeom = new THREE.BoxGeometry(6, 4, 8);
        var boathouse = new THREE.Mesh(boathouseGeom, brownMaterial);
        boathouse.position.set(15, 2, 5);
        scene.add(boathouse);
        objects.push(boathouse);

        // Patrol boat cylinder
        var patrolBoatGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 6);
        var patrolBoat = new THREE.Mesh(patrolBoatGeom, ironMaterial);
        patrolBoat.rotation.z = Math.PI / 2;
        patrolBoat.position.set(18, 1, 8);
        scene.add(patrolBoat);
        objects.push(patrolBoat);

        // Mooring buoy sphere 1
        var buoyGeom = new THREE.SphereGeometry(0.8, 6, 6);
        var buoy1 = new THREE.Mesh(buoyGeom, redMaterial);
        buoy1.position.set(20, 0.5, 12);
        scene.add(buoy1);
        objects.push(buoy1);

        // Mooring buoy sphere 2
        var buoy2 = new THREE.Mesh(buoyGeom, redMaterial);
        buoy2.position.set(14, 0.5, 10);
        scene.add(buoy2);
        objects.push(buoy2);

        // Net cable line segments
        var lineMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var cablePoints = [
            new THREE.Vector3(16, 0.3, 8),
            new THREE.Vector3(20, 0.3, 12)
        ];
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableLines = new THREE.LineSegments(cableGeom, lineMaterial);
        scene.add(cableLines);
        objects.push(cableLines);

        // Stronvar House command post
        // Victorian mansion box
        var mansionGeom = new THREE.BoxGeometry(10, 8, 12);
        var mansion = new THREE.Mesh(mansionGeom, creamMaterial);
        mansion.position.set(10, 4, -15);
        scene.add(mansion);
        objects.push(mansion);

        // Coach house
        var coachHouseGeom = new THREE.BoxGeometry(6, 5, 7);
        var coachHouse = new THREE.Mesh(coachHouseGeom, brownMaterial);
        coachHouse.position.set(18, 2.5, -18);
        scene.add(coachHouse);
        objects.push(coachHouse);

        // Dovecote tower cylinder
        var dovecoteGeom = new THREE.CylinderGeometry(1.8, 1.8, 5, 6);
        var dovecote = new THREE.Mesh(dovecoteGeom, lightBrownMaterial);
        dovecote.position.set(22, 2.5, -12);
        scene.add(dovecote);
        objects.push(dovecote);

        // Creag an Tuirc summit OP
        // Stone dyke enclosure box
        var dykeGeom = new THREE.BoxGeometry(14, 2, 14);
        var dyke = new THREE.Mesh(dykeGeom, darkStoneMaterial);
        dyke.position.set(-10, 1, -20);
        scene.add(dyke);
        objects.push(dyke);

        // Mast cylinder
        var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 9, 4);
        var mast = new THREE.Mesh(mastGeom, ironMaterial);
        mast.position.set(-8, 4.5, -18);
        scene.add(mast);
        objects.push(mast);

        // Radome sphere
        var radomeGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var radome = new THREE.Mesh(radomeGeom, greyMaterial);
        radome.position.set(-8, 9, -18);
        scene.add(radome);
        objects.push(radome);

        // Immervoulin Farm supply cache
        // Stone farmhouse box
        var farmhouseGeom = new THREE.BoxGeometry(7, 4, 9);
        var farmhouse = new THREE.Mesh(farmhouseGeom, stoneMaterial);
        farmhouse.position.set(-25, 2, -5);
        scene.add(farmhouse);
        objects.push(farmhouse);

        // Barn box
        var barnGeom = new THREE.BoxGeometry(9, 5, 12);
        var barn = new THREE.Mesh(barnGeom, brownMaterial);
        barn.position.set(-28, 2.5, 5);
        scene.add(barn);
        objects.push(barn);

        // Fuel tank cylinder
        var tankGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 6);
        var tank = new THREE.Mesh(tankGeom, ironMaterial);
        tank.position.set(-20, 2, 0);
        scene.add(tank);
        objects.push(tank);

        // Monachyle Mhor ambush
        // Glen road box (horizontal strip)
        var roadGeom = new THREE.BoxGeometry(25, 0.5, 3);
        var road = new THREE.Mesh(roadGeom, greyMaterial);
        road.position.set(5, 0.2, 25);
        scene.add(road);
        objects.push(road);

        // Stone wall cover box
        var wallCoverGeom = new THREE.BoxGeometry(4, 2, 1);
        var wallCover = new THREE.Mesh(wallCoverGeom, darkStoneMaterial);
        wallCover.position.set(8, 1, 27);
        scene.add(wallCover);
        objects.push(wallCover);

        // IED charge sphere 1
        var chargeGeom = new THREE.SphereGeometry(0.4, 4, 4);
        var charge1 = new THREE.Mesh(chargeGeom, redMaterial);
        charge1.position.set(5, 0.5, 29);
        scene.add(charge1);
        objects.push(charge1);

        // IED charge sphere 2
        var charge2 = new THREE.Mesh(chargeGeom, redMaterial);
        charge2.position.set(12, 0.5, 24);
        scene.add(charge2);
        objects.push(charge2);

        // Blaircreich ridge relay
        // Stone shelter box
        var shelterGeom = new THREE.BoxGeometry(5, 3, 6);
        var shelter = new THREE.Mesh(shelterGeom, stoneMaterial);
        shelter.position.set(-5, 1.5, -28);
        scene.add(shelter);
        objects.push(shelter);

        // Signal mast cylinder
        var signalMastGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 4);
        var signalMast = new THREE.Mesh(signalMastGeom, ironMaterial);
        signalMast.position.set(-2, 4, -26);
        scene.add(signalMast);
        objects.push(signalMast);

        // Cable network line segments
        var cablePoints2 = [
            new THREE.Vector3(-5, 3, -28),
            new THREE.Vector3(-2, 8, -26)
        ];
        var cableGeom2 = new THREE.BufferGeometry().setFromPoints(cablePoints2);
        var cableLines2 = new THREE.LineSegments(cableGeom2, lineMaterial);
        scene.add(cableLines2);
        objects.push(cableLines2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(25, 30, 25);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation loop - rotate certain objects for visual interest
        var now = Date.now() * 0.001;
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] && objects[i].geometry && objects[i].geometry.type === 'SphereGeometry') {
                objects[i].rotation.y += 0.005;
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
