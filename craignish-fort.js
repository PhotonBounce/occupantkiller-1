window.CraignishFort = (function() {
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
        // Craignish Castle tower house - main box tower
        var towerGeom = new THREE.BoxGeometry(8, 12, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-25, 6, -20);
        scene.add(tower);
        objects.push(tower);

        // Craignish Castle courtyard walls - surrounding boxes
        var wallGeom = new THREE.BoxGeometry(20, 4, 1);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var wallN = new THREE.Mesh(wallGeom, wallMat);
        wallN.position.set(-25, 2, -12);
        scene.add(wallN);
        objects.push(wallN);

        var wallS = new THREE.Mesh(wallGeom, wallMat);
        wallS.position.set(-25, 2, -28);
        scene.add(wallS);
        objects.push(wallS);

        // Castle water tank - cylinder
        var tankGeom = new THREE.CylinderGeometry(2, 2, 5, 12);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(-18, 2.5, -20);
        scene.add(tank);
        objects.push(tank);

        // Crinan Canal lock gates - paired boxes
        var gateGeom = new THREE.BoxGeometry(1, 6, 10);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var gateL = new THREE.Mesh(gateGeom, gateMat);
        gateL.position.set(-10, 3, 5);
        scene.add(gateL);
        objects.push(gateL);

        var gateR = new THREE.Mesh(gateGeom, gateMat);
        gateR.position.set(-5, 3, 5);
        scene.add(gateR);
        objects.push(gateR);

        // Canal cottage - box
        var cottageGeom = new THREE.BoxGeometry(6, 5, 8);
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        var cottage = new THREE.Mesh(cottageGeom, cottageMat);
        cottage.position.set(0, 2.5, 20);
        scene.add(cottage);
        objects.push(cottage);

        // Bollard posts at canal - cylinders
        var bollardGeom = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var bollard1 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard1.position.set(5, 1, 10);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard2.position.set(8, 1, 15);
        scene.add(bollard2);
        objects.push(bollard2);

        // Duntrune Castle keep - box
        var keepGeom = new THREE.BoxGeometry(10, 14, 10);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x704214 });
        var keep = new THREE.Mesh(keepGeom, keepMat);
        keep.position.set(20, 7, -15);
        scene.add(keep);
        objects.push(keep);

        // Battery wall - long box
        var batteryGeom = new THREE.BoxGeometry(25, 3, 2);
        var batteryMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var battery = new THREE.Mesh(batteryGeom, batteryMat);
        battery.position.set(18, 1.5, 0);
        scene.add(battery);
        objects.push(battery);

        // Duntrune tower cap - cone
        var coneGeom = new THREE.ConeGeometry(4, 6, 16);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(20, 14, -15);
        scene.add(cone);
        objects.push(cone);

        // Loch Craignish boathouse - box
        var boathouseGeom = new THREE.BoxGeometry(8, 6, 12);
        var boathouseMat = new THREE.MeshLambertMaterial({ color: 0xB8860B });
        var boathouse = new THREE.Mesh(boathouseGeom, boathouseMat);
        boathouse.position.set(28, 3, 20);
        scene.add(boathouse);
        objects.push(boathouse);

        // RIB inflatable - cylinder
        var ribGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 12);
        var ribMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var rib = new THREE.Mesh(ribGeom, ribMat);
        rib.position.set(25, 1, 28);
        scene.add(rib);
        objects.push(rib);

        // Quay wall - box
        var quayGeom = new THREE.BoxGeometry(15, 2, 2);
        var quayMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var quay = new THREE.Mesh(quayGeom, quayMat);
        quay.position.set(30, 1, 32);
        scene.add(quay);
        objects.push(quay);

        // Point of Knap standing stones - cylinders
        var stoneGeom = new THREE.CylinderGeometry(1, 1, 4, 8);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var stone1 = new THREE.Mesh(stoneGeom, stoneMat);
        stone1.position.set(-30, 2, 10);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(stoneGeom, stoneMat);
        stone2.position.set(-28, 2, 12);
        scene.add(stone2);
        objects.push(stone2);

        var stone3 = new THREE.Mesh(stoneGeom, stoneMat);
        stone3.position.set(-32, 2, 12);
        scene.add(stone3);
        objects.push(stone3);

        // Sniper nest - box
        var nistGeom = new THREE.BoxGeometry(5, 4, 5);
        var nestMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var nest = new THREE.Mesh(nistGeom, nestMat);
        nest.position.set(-30, 2, 20);
        scene.add(nest);
        objects.push(nest);

        // Dunchraigaig cairn burial mound - box
        var cairnGeom = new THREE.BoxGeometry(12, 3, 12);
        var cairnMat = new THREE.MeshLambertMaterial({ color: 0x8B7765 });
        var cairn = new THREE.Mesh(cairnGeom, cairnMat);
        cairn.position.set(5, 1.5, -25);
        scene.add(cairn);
        objects.push(cairn);

        // Access shaft - box
        var shaftGeom = new THREE.BoxGeometry(3, 4, 3);
        var shaftMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var shaft = new THREE.Mesh(shaftGeom, shaftMat);
        shaft.position.set(2, 2, -25);
        scene.add(shaft);
        objects.push(shaft);

        // Ventilation cylinder
        var ventGeom = new THREE.CylinderGeometry(1, 1, 3, 8);
        var ventMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var vent = new THREE.Mesh(ventGeom, ventMat);
        vent.position.set(10, 1.5, -25);
        scene.add(vent);
        objects.push(vent);

        // Kilmartin Glen storage chambers - boxes
        var chamberGeom = new THREE.BoxGeometry(4, 3, 4);
        var chamberMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var chamber1 = new THREE.Mesh(chamberGeom, chamberMat);
        chamber1.position.set(12, 1.5, -10);
        scene.add(chamber1);
        objects.push(chamber1);

        var chamber2 = new THREE.Mesh(chamberGeom, chamberMat);
        chamber2.position.set(16, 1.5, -10);
        scene.add(chamber2);
        objects.push(chamber2);

        // Overhead camouflage netting - box
        var camoGeom = new THREE.BoxGeometry(20, 1, 20);
        var camoMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
        var camo = new THREE.Mesh(camoGeom, camoMat);
        camo.position.set(14, 8, -10);
        scene.add(camo);
        objects.push(camo);

        // Security wire perimeter - LineSegments
        var wireGeom = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -35, 0.5, -35,
            35, 0.5, -35,
            35, 0.5, -35,
            35, 0.5, 35,
            35, 0.5, 35,
            -35, 0.5, 35,
            -35, 0.5, 35,
            -35, 0.5, -35
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Lights
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        light1.position.set(30, 20, 30);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0x888888);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animation logic here if needed
        for (var i = 0; i < objects.length; i++) {
            // Placeholder for animations
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
