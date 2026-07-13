window.TarbertDock = (function() {
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
        // Tarbert harbour ferry terminal
        var piergeo = new THREE.BoxGeometry(20, 3, 8);
        var piermaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var pier = new THREE.Mesh(piergeo, piermaterial);
        pier.position.set(-25, 1.5, -20);
        scene.add(pier);
        objects.push(pier);

        var ferrygeo = new THREE.CylinderGeometry(5, 5, 12, 16);
        var ferrymaterial = new THREE.MeshLambertMaterial({ color: 0x1a5490 });
        var ferry = new THREE.Mesh(ferrygeo, ferrymaterial);
        ferry.position.set(-25, 6, -20);
        scene.add(ferry);
        objects.push(ferry);

        var buoyonegeo = new THREE.SphereGeometry(1.5, 8, 8);
        var buoymaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var buoyone = new THREE.Mesh(buoyonegeo, buoymaterial);
        buoyone.position.set(-20, 0.5, -18);
        scene.add(buoyone);
        objects.push(buoyone);

        var buoytwogeo = new THREE.SphereGeometry(1.5, 8, 8);
        var buoytwo = new THREE.Mesh(buoytwogeo, buoymaterial);
        buoytwo.position.set(-30, 0.5, -22);
        scene.add(buoytwo);
        objects.push(buoytwo);

        var cablepoints = [];
        cablepoints.push(new THREE.Vector3(-20, 1, -18));
        cablepoints.push(new THREE.Vector3(-25, 4, -20));
        cablepoints.push(new THREE.Vector3(-30, 1, -22));
        var cablegeometry = new THREE.BufferGeometry().setFromPoints(cablepoints);
        var cablematerial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        var cables = new THREE.LineSegments(cablegeometry, cablematerial);
        scene.add(cables);
        objects.push(cables);

        // Tarbert Castle stronghold
        var towergeo = new THREE.BoxGeometry(8, 15, 8);
        var towermaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var tower = new THREE.Mesh(towergeo, towermaterial);
        tower.position.set(10, 7.5, -15);
        scene.add(tower);
        objects.push(tower);

        var wallgeo = new THREE.BoxGeometry(15, 6, 2);
        var wallmaterial = new THREE.MeshLambertMaterial({ color: 0x9d8b7e });
        var wall = new THREE.Mesh(wallgeo, wallmaterial);
        wall.position.set(18, 3, -12);
        scene.add(wall);
        objects.push(wall);

        var turretgeo = new THREE.ConeGeometry(3, 5, 8);
        var turretmaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var turret = new THREE.Mesh(turretgeo, turretmaterial);
        turret.position.set(10, 22.5, -15);
        scene.add(turret);
        objects.push(turret);

        // East Loch Tarbert naval patrol
        var boatgeo = new THREE.CylinderGeometry(3, 3.5, 10, 12);
        var boatmaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        var boat = new THREE.Mesh(boatgeo, boatmaterial);
        boat.position.set(5, 1.5, 15);
        scene.add(boat);
        objects.push(boat);

        var anchorgeo = new THREE.SphereGeometry(2, 8, 8);
        var anchormaterial = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var anchor = new THREE.Mesh(anchorgeo, anchormaterial);
        anchor.position.set(8, 0.5, 18);
        scene.add(anchor);
        objects.push(anchor);

        var netpoints = [];
        netpoints.push(new THREE.Vector3(2, 2, 12));
        netpoints.push(new THREE.Vector3(5, 0, 15));
        netpoints.push(new THREE.Vector3(8, 2, 18));
        var netgeometry = new THREE.BufferGeometry().setFromPoints(netpoints);
        var netmaterial = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
        var net = new THREE.LineSegments(netgeometry, netmaterial);
        scene.add(net);
        objects.push(net);

        // Skipness Castle OP
        var ruintowergeo = new THREE.BoxGeometry(6, 12, 6);
        var ruintowermaterial = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var ruintower = new THREE.Mesh(ruintowergeo, ruintowermaterial);
        ruintower.position.set(-8, 6, 8);
        scene.add(ruintower);
        objects.push(ruintower);

        var enclosuregeo = new THREE.BoxGeometry(14, 4, 14);
        var enclosurematerial = new THREE.MeshLambertMaterial({ color: 0xb89968 });
        var enclosure = new THREE.Mesh(enclosuregeo, enclosurematerial);
        enclosure.position.set(-5, 2, 10);
        scene.add(enclosure);
        objects.push(enclosure);

        var mastgeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
        var mastmaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var mast = new THREE.Mesh(mastgeo, mastmaterial);
        mast.position.set(-8, 14, 8);
        scene.add(mast);
        objects.push(mast);

        // Stonefield Hotel command post
        var hotelmangeo = new THREE.BoxGeometry(12, 8, 10);
        var hotelmanmaterial = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        var hotelmanbuilding = new THREE.Mesh(hotelmangeo, hotelmanmaterial);
        hotelmanbuilding.position.set(22, 4, 5);
        scene.add(hotelmanbuilding);
        objects.push(hotelmanbuilding);

        var stablegeo = new THREE.BoxGeometry(8, 5, 6);
        var stablematerial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var stable = new THREE.Mesh(stablegeo, stablematerial);
        stable.position.set(28, 2.5, 12);
        scene.add(stable);
        objects.push(stable);

        var tankgeo = new THREE.CylinderGeometry(2.5, 2.5, 6, 8);
        var tankmaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tank = new THREE.Mesh(tankgeo, tankmaterial);
        tank.position.set(15, 3, 8);
        scene.add(tank);
        objects.push(tank);

        // West Loch ambush
        var roadgeo = new THREE.BoxGeometry(30, 0.5, 4);
        var roadmaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var road = new THREE.Mesh(roadgeo, roadmaterial);
        road.position.set(0, 0.25, 28);
        scene.add(road);
        objects.push(road);

        var iedgeo = new THREE.SphereGeometry(1.2, 6, 6);
        var iedmaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        var ied = new THREE.Mesh(iedgeo, iedmaterial);
        ied.position.set(-12, 0.5, 28);
        scene.add(ied);
        objects.push(ied);

        var wirepoints = [];
        wirepoints.push(new THREE.Vector3(-10, 0.3, 28));
        wirepoints.push(new THREE.Vector3(-14, 0.3, 28));
        var wiregeometry = new THREE.BufferGeometry().setFromPoints(wirepoints);
        var wirematerial = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 1 });
        var wire = new THREE.LineSegments(wiregeometry, wirematerial);
        scene.add(wire);
        objects.push(wire);

        // Kennacraig ferry terminal assault
        var rampgeo = new THREE.BoxGeometry(6, 1, 12);
        var rampmaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var ramp = new THREE.Mesh(rampgeo, rampmaterial);
        ramp.position.set(-15, 0.5, -3);
        scene.add(ramp);
        objects.push(ramp);

        var terminalgeo = new THREE.BoxGeometry(14, 7, 10);
        var terminalmaterial = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
        var terminal = new THREE.Mesh(terminalgeo, terminalmaterial);
        terminal.position.set(-15, 3.5, 10);
        scene.add(terminal);
        objects.push(terminal);

        var cranegeo = new THREE.CylinderGeometry(1, 1, 16, 6);
        var cranematerial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var crane = new THREE.Mesh(cranegeo, cranematerial);
        crane.position.set(-8, 8, 5);
        scene.add(crane);
        objects.push(crane);

        // Claonaig shore battery
        var emplacementgeo = new THREE.BoxGeometry(10, 2, 8);
        var emplacementmaterial = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var emplacement = new THREE.Mesh(emplacementgeo, emplacementmaterial);
        emplacement.position.set(28, 1, -8);
        scene.add(emplacement);
        objects.push(emplacement);

        var barrelgeo = new THREE.CylinderGeometry(0.6, 0.6, 9, 6);
        var barrelmaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var barrel = new THREE.Mesh(barrelgeo, barrelmaterial);
        barrel.position.set(28, 2.5, -8);
        barrel.rotation.z = Math.PI / 6;
        scene.add(barrel);
        objects.push(barrel);

        var magazinegeo = new THREE.BoxGeometry(6, 3, 5);
        var magazinematerial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var magazine = new THREE.Mesh(magazinegeo, magazinematerial);
        magazine.position.set(22, 1.5, -12);
        scene.add(magazine);
        objects.push(magazine);

        // Lighting
        var light1 = new THREE.PointLight(0xffffff, 0.8, 60);
        light1.position.set(0, 20, 0);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.DirectionalLight(0xcccccc, 0.6);
        light2.position.set(30, 25, 30);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
