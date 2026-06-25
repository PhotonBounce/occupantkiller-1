window.ConnelPost = (function() {
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
        // Connel Bridge - main steel truss box deck
        var bridgeDeckGeom = new THREE.BoxGeometry(40, 2, 8);
        var bridgeMaterial = new THREE.MeshLambertMaterial({color: 0x444444});
        var bridgeDeck = new THREE.Mesh(bridgeDeckGeom, bridgeMaterial);
        bridgeDeck.position.set(0, 15, 0);
        scene.add(bridgeDeck);
        objects.push(bridgeDeck);

        // Bridge support pier 1 - cylinder
        var pierGeom = new THREE.CylinderGeometry(2, 2.5, 12, 16);
        var pierMaterial = new THREE.MeshLambertMaterial({color: 0x555555});
        var pier1 = new THREE.Mesh(pierGeom, pierMaterial);
        pier1.position.set(-15, 3, 0);
        scene.add(pier1);
        objects.push(pier1);

        // Bridge support pier 2 - cylinder
        var pier2 = new THREE.Mesh(pierGeom, pierMaterial);
        pier2.position.set(15, 3, 0);
        scene.add(pier2);
        objects.push(pier2);

        // Bridge control hut - box structure
        var hutGeom = new THREE.BoxGeometry(6, 4, 5);
        var hutMaterial = new THREE.MeshLambertMaterial({color: 0x8B4513});
        var controlHut = new THREE.Mesh(hutGeom, hutMaterial);
        controlHut.position.set(0, 18, 15);
        scene.add(controlHut);
        objects.push(controlHut);

        // Falls of Lora - sonar buoy 1 (sphere)
        var buoyGeom = new THREE.SphereGeometry(1.5, 16, 16);
        var buoyMaterial = new THREE.MeshLambertMaterial({color: 0xFFD700});
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy1.position.set(-20, 2, -25);
        scene.add(buoy1);
        objects.push(buoy1);

        // Falls of Lora - sonar buoy 2 (sphere)
        var buoy2 = new THREE.Mesh(buoyGeom, buoyMaterial);
        buoy2.position.set(20, 2, -25);
        scene.add(buoy2);
        objects.push(buoy2);

        // Sensor net cable - LineSegments from buoy1 to hut
        var cableGeom1 = new THREE.BufferGeometry();
        var cablePoints1 = new Float32Array([
            -20, 2, -25,
            0, 18, 15
        ]);
        cableGeom1.setAttribute('position', new THREE.BufferAttribute(cablePoints1, 3));
        var cableMaterial = new THREE.LineBasicMaterial({color: 0x00FF00});
        var cable1 = new THREE.LineSegments(cableGeom1, cableMaterial);
        scene.add(cable1);
        objects.push(cable1);

        // Sensor net cable - LineSegments from buoy2 to hut
        var cableGeom2 = new THREE.BufferGeometry();
        var cablePoints2 = new Float32Array([
            20, 2, -25,
            0, 18, 15
        ]);
        cableGeom2.setAttribute('position', new THREE.BufferAttribute(cablePoints2, 3));
        var cable2 = new THREE.LineSegments(cableGeom2, cableMaterial);
        scene.add(cable2);
        objects.push(cable2);

        // Dunbeg NATO depot - warehouse 1 (box)
        var warehouseGeom = new THREE.BoxGeometry(12, 6, 10);
        var warehouseMaterial = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var warehouse1 = new THREE.Mesh(warehouseGeom, warehouseMaterial);
        warehouse1.position.set(-25, 3, 10);
        scene.add(warehouse1);
        objects.push(warehouse1);

        // Dunbeg NATO depot - fuel tank 1 (cylinder)
        var tankGeom = new THREE.CylinderGeometry(2, 2, 8, 16);
        var tankMaterial = new THREE.MeshLambertMaterial({color: 0xFF6347});
        var tank1 = new THREE.Mesh(tankGeom, tankMaterial);
        tank1.position.set(-30, 4, 22);
        scene.add(tank1);
        objects.push(tank1);

        // Dunbeg NATO depot - security post (box)
        var securityGeom = new THREE.BoxGeometry(4, 4, 4);
        var securityMaterial = new THREE.MeshLambertMaterial({color: 0x333333});
        var securityPost = new THREE.Mesh(securityGeom, securityMaterial);
        securityPost.position.set(-20, 2, 28);
        scene.add(securityPost);
        objects.push(securityPost);

        // North Connel airstrip - runway (box)
        var runwayGeom = new THREE.BoxGeometry(30, 0.5, 8);
        var runwayMaterial = new THREE.MeshLambertMaterial({color: 0x696969});
        var runway = new THREE.Mesh(runwayGeom, runwayMaterial);
        runway.position.set(25, 0.25, -10);
        scene.add(runway);
        objects.push(runway);

        // North Connel airstrip - hangar (box)
        var hangarGeom = new THREE.BoxGeometry(10, 5, 12);
        var hangarMaterial = new THREE.MeshLambertMaterial({color: 0xA9A9A9});
        var hangar = new THREE.Mesh(hangarGeom, hangarMaterial);
        hangar.position.set(30, 2.5, 5);
        scene.add(hangar);
        objects.push(hangar);

        // North Connel airstrip - windsock (cone)
        var windsockGeom = new THREE.ConeGeometry(1.5, 4, 12);
        var windsockMaterial = new THREE.MeshLambertMaterial({color: 0xFF4500});
        var windsock = new THREE.Mesh(windsockGeom, windsockMaterial);
        windsock.position.set(35, 3, -8);
        windsock.rotation.z = Math.PI / 4;
        scene.add(windsock);
        objects.push(windsock);

        // Airds Bay coastal battery - gun emplacement (box)
        var emplacementGeom = new THREE.BoxGeometry(8, 3, 8);
        var emplacementMaterial = new THREE.MeshLambertMaterial({color: 0x654321});
        var emplacement = new THREE.Mesh(emplacementGeom, emplacementMaterial);
        emplacement.position.set(-28, 1.5, -18);
        scene.add(emplacement);
        objects.push(emplacement);

        // Airds Bay coastal battery - barrel (cylinder)
        var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 14, 12);
        var barrelMaterial = new THREE.MeshLambertMaterial({color: 0x1C1C1C});
        var barrel = new THREE.Mesh(barrelGeom, barrelMaterial);
        barrel.position.set(-28, 5, -15);
        barrel.rotation.z = Math.PI / 6;
        scene.add(barrel);
        objects.push(barrel);

        // Airds Bay coastal battery - magazine (box)
        var magazineGeom = new THREE.BoxGeometry(6, 3, 6);
        var magazineMaterial = new THREE.MeshLambertMaterial({color: 0x4B4B4B});
        var magazine = new THREE.Mesh(magazineGeom, magazineMaterial);
        magazine.position.set(-35, 1.5, -22);
        scene.add(magazine);
        objects.push(magazine);

        // Achnaba hilltop OP - stone dyke enclosure (box)
        var dykeGeom = new THREE.BoxGeometry(16, 2, 16);
        var dykeMaterial = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var dyke = new THREE.Mesh(dykeGeom, dykeMaterial);
        dyke.position.set(10, 1, 22);
        scene.add(dyke);
        objects.push(dyke);

        // Achnaba hilltop OP - signal mast (cylinder)
        var mastGeom = new THREE.CylinderGeometry(0.5, 0.5, 10, 12);
        var mastMaterial = new THREE.MeshLambertMaterial({color: 0x696969});
        var mast = new THREE.Mesh(mastGeom, mastMaterial);
        mast.position.set(10, 5, 22);
        scene.add(mast);
        objects.push(mast);

        // Achnaba hilltop OP - relay cable (LineSegments)
        var relayGeom = new THREE.BufferGeometry();
        var relayPoints = new Float32Array([
            10, 10, 22,
            0, 18, 15
        ]);
        relayGeom.setAttribute('position', new THREE.BufferAttribute(relayPoints, 3));
        var relayCable = new THREE.LineSegments(relayGeom, cableMaterial);
        scene.add(relayCable);
        objects.push(relayCable);

        // Loch Etive head landing zone - beach (box)
        var beachGeom = new THREE.BoxGeometry(20, 0.5, 14);
        var beachMaterial = new THREE.MeshLambertMaterial({color: 0xEDC9AF});
        var beach = new THREE.Mesh(beachGeom, beachMaterial);
        beach.position.set(-5, 0.25, -28);
        scene.add(beach);
        objects.push(beach);

        // Loch Etive head landing zone - marker buoy 1 (sphere)
        var markerGeom = new THREE.SphereGeometry(1.2, 14, 14);
        var markerMaterial = new THREE.MeshLambertMaterial({color: 0xFF1493});
        var marker1 = new THREE.Mesh(markerGeom, markerMaterial);
        marker1.position.set(-10, 1, -32);
        scene.add(marker1);
        objects.push(marker1);

        // Loch Etive head landing zone - marker buoy 2 (sphere)
        var marker2 = new THREE.Mesh(markerGeom, markerMaterial);
        marker2.position.set(5, 1, -32);
        scene.add(marker2);
        objects.push(marker2);

        // Loch Etive head landing zone - supply dump (box)
        var dumpGeom = new THREE.BoxGeometry(8, 4, 6);
        var dumpMaterial = new THREE.MeshLambertMaterial({color: 0xDEB887});
        var dump = new THREE.Mesh(dumpGeom, dumpMaterial);
        dump.position.set(-5, 2, -35);
        scene.add(dump);
        objects.push(dump);

        // Clifftop monitoring post (box)
        var monitorGeom = new THREE.BoxGeometry(5, 5, 5);
        var monitorMaterial = new THREE.MeshLambertMaterial({color: 0x708090});
        var monitor = new THREE.Mesh(monitorGeom, monitorMaterial);
        monitor.position.set(20, 3, 30);
        scene.add(monitor);
        objects.push(monitor);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation: rotate control hut slowly
        if (objects[3]) {
            objects[3].rotation.y += 0.01 * delta;
        }
        // Animation: bob marker buoys
        if (objects[21]) {
            objects[21].position.y = 1 + Math.sin(delta * 2) * 0.3;
        }
        if (objects[22]) {
            objects[22].position.y = 1 + Math.cos(delta * 2) * 0.3;
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
