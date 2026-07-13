window.TireeDock = (function() {
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
        // Flat machair box terrain
        var terrainGeom = new THREE.BoxGeometry(120, 2, 120);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Tiree Airport RAF forward operating base - control tower
        var towerGeom = new THREE.BoxGeometry(8, 20, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-20, 10, -15);
        scene.add(tower);
        objects.push(tower);

        // Tiree Airport RAF - hangar 1
        var hangar1Geom = new THREE.BoxGeometry(25, 15, 35);
        var hangar1Mat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var hangar1 = new THREE.Mesh(hangar1Geom, hangar1Mat);
        hangar1.position.set(-5, 7.5, 5);
        scene.add(hangar1);
        objects.push(hangar1);

        // Tiree Airport RAF - hangar 2
        var hangar2Geom = new THREE.BoxGeometry(25, 15, 35);
        var hangar2Mat = new THREE.MeshLambertMaterial({ color: 0x36454F });
        var hangar2 = new THREE.Mesh(hangar2Geom, hangar2Mat);
        hangar2.position.set(15, 7.5, 5);
        scene.add(hangar2);
        objects.push(hangar2);

        // Tiree Airport RAF - fuel bowser 1
        var bowser1Geom = new THREE.CylinderGeometry(3, 3, 8, 16);
        var bowser1Mat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var bowser1 = new THREE.Mesh(bowser1Geom, bowser1Mat);
        bowser1.position.set(-25, 4, 20);
        scene.add(bowser1);
        objects.push(bowser1);

        // Tiree Airport RAF - fuel bowser 2
        var bowser2Geom = new THREE.CylinderGeometry(3, 3, 8, 16);
        var bowser2Mat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var bowser2 = new THREE.Mesh(bowser2Geom, bowser2Mat);
        bowser2.position.set(-20, 4, 25);
        scene.add(bowser2);
        objects.push(bowser2);

        // Scarinish harbor naval dock - stone pier
        var pierGeom = new THREE.BoxGeometry(40, 6, 12);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(25, 3, -20);
        scene.add(pier);
        objects.push(pier);

        // Scarinish harbor - patrol vessel 1
        var patrol1Geom = new THREE.BoxGeometry(12, 8, 20);
        var patrol1Mat = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
        var patrol1 = new THREE.Mesh(patrol1Geom, patrol1Mat);
        patrol1.position.set(35, 7, -28);
        scene.add(patrol1);
        objects.push(patrol1);

        // Scarinish harbor - patrol vessel 2
        var patrol2Geom = new THREE.BoxGeometry(12, 8, 20);
        var patrol2Mat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var patrol2 = new THREE.Mesh(patrol2Geom, patrol2Mat);
        patrol2.position.set(25, 7, -32);
        scene.add(patrol2);
        objects.push(patrol2);

        // Scarinish harbor - harbor light cylinder
        var lightCylGeom = new THREE.CylinderGeometry(2, 2, 18, 16);
        var lightCylMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var lightCyl = new THREE.Mesh(lightCylGeom, lightCylMat);
        lightCyl.position.set(50, 9, -20);
        scene.add(lightCyl);
        objects.push(lightCyl);

        // Caoles tidal race observation post - clifftop OP box
        var caoleOPGeom = new THREE.BoxGeometry(10, 12, 10);
        var caoleOPMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var caoleOP = new THREE.Mesh(caoleOPGeom, caoleOPMat);
        caoleOP.position.set(20, 6, 30);
        scene.add(caoleOP);
        objects.push(caoleOP);

        // Caoles tidal race - current sensor cables (LineSegments)
        var cablePoints = [
            new THREE.Vector3(15, 10, 25),
            new THREE.Vector3(25, 10, 35),
            new THREE.Vector3(35, 10, 25),
            new THREE.Vector3(25, 10, 35)
        ];
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0xFF6347 });
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Dun Mor broch iron age fort - broch tower cylinder
        var brochGeom = new THREE.CylinderGeometry(8, 8, 14, 16);
        var brochMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var broch = new THREE.Mesh(brochGeom, brochMat);
        broch.position.set(-35, 7, 10);
        scene.add(broch);
        objects.push(broch);

        // Dun Mor - outer earthwork box
        var earthworkGeom = new THREE.BoxGeometry(28, 4, 28);
        var earthworkMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var earthwork = new THREE.Mesh(earthworkGeom, earthworkMat);
        earthwork.position.set(-35, 2, 10);
        scene.add(earthwork);
        objects.push(earthwork);

        // Ben Hynish summit tracking station - GCHQ station box
        var gchqGeom = new THREE.BoxGeometry(12, 10, 16);
        var gchqMat = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        var gchq = new THREE.Mesh(gchqGeom, gchqMat);
        gchq.position.set(-10, 5, 25);
        scene.add(gchq);
        objects.push(gchq);

        // Ben Hynish - tracking dish base cylinder
        var dishBaseGeom = new THREE.CylinderGeometry(6, 6, 3, 16);
        var dishBaseMat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var dishBase = new THREE.Mesh(dishBaseGeom, dishBaseMat);
        dishBase.position.set(-10, 7, 35);
        scene.add(dishBase);
        objects.push(dishBase);

        // Ben Hynish - radome sphere
        var radomeGeom = new THREE.SphereGeometry(7, 16, 16);
        var radiomeMat = new THREE.MeshLambertMaterial({ color: 0xE0E0E0 });
        var radome = new THREE.Mesh(radomeGeom, radiomeMat);
        radome.position.set(-10, 16, 35);
        scene.add(radome);
        objects.push(radome);

        // Atlantic gales wind power station - wind turbine tower 1
        var turbine1Geom = new THREE.CylinderGeometry(2, 2, 30, 12);
        var turbine1Mat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
        var turbine1 = new THREE.Mesh(turbine1Geom, turbine1Mat);
        turbine1.position.set(-30, 15, -30);
        scene.add(turbine1);
        objects.push(turbine1);

        // Atlantic gales - generator housing 1
        var generatorGeom = new THREE.BoxGeometry(8, 6, 8);
        var generatorMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var generator = new THREE.Mesh(generatorGeom, generatorMat);
        generator.position.set(-30, 2, -30);
        scene.add(generator);
        objects.push(generator);

        // Beach machair minefield - minefield terrain box
        var mineFieldGeom = new THREE.BoxGeometry(50, 1, 40);
        var mineFieldMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var mineField = new THREE.Mesh(mineFieldGeom, mineFieldMat);
        mineField.position.set(0, 0, -45);
        scene.add(mineField);
        objects.push(mineField);

        // Beach machair - mines (spheres)
        var mine1Geom = new THREE.SphereGeometry(1.5, 12, 12);
        var mine1Mat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var mine1 = new THREE.Mesh(mine1Geom, mine1Mat);
        mine1.position.set(-15, 1.5, -40);
        scene.add(mine1);
        objects.push(mine1);

        var mine2Geom = new THREE.SphereGeometry(1.5, 12, 12);
        var mine2Mat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var mine2 = new THREE.Mesh(mine2Geom, mine2Mat);
        mine2.position.set(10, 1.5, -48);
        scene.add(mine2);
        objects.push(mine2);

        // Beach machair - perimeter wire (LineSegments)
        var wirePoints = [
            new THREE.Vector3(-25, 0.5, -25),
            new THREE.Vector3(25, 0.5, -25),
            new THREE.Vector3(25, 0.5, -65),
            new THREE.Vector3(-25, 0.5, -65)
        ];
        var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x8B8B7A });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (simulating sunlight)
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(40, 40, 40);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Rotate turbine tower
        if (objects.length > 18) {
            objects[18].rotation.y += delta * 0.5;
        }
        // Pulse harbor light
        if (lights.length > 1) {
            var pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
            lights[0].intensity = pulse;
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
