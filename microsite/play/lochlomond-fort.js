window.LochLomondFort = (function() {
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
        // Balloch Castle Keep (box castle keep)
        var keepGeom = new THREE.BoxGeometry(12, 18, 12);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var keep = new THREE.Mesh(keepGeom, keepMat);
        keep.position.set(-25, 9, -20);
        keep.castShadow = true;
        keep.receiveShadow = true;
        scene.add(keep);
        objects.push(keep);

        // Balloch Castle Curtain Wall (box curtain wall)
        var wallGeom = new THREE.BoxGeometry(30, 8, 2);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var wall = new THREE.Mesh(wallGeom, wallMat);
        wall.position.set(-15, 4, -10);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
        objects.push(wall);

        // Corner Tower 1 (cylinder corner tower)
        var towerGeom = new THREE.CylinderGeometry(4, 4, 14, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x7C7C7C });
        var tower1 = new THREE.Mesh(towerGeom, towerMat);
        tower1.position.set(-30, 7, -5);
        tower1.castShadow = true;
        tower1.receiveShadow = true;
        scene.add(tower1);
        objects.push(tower1);

        // Corner Tower 2 (cylinder corner tower)
        var tower2 = new THREE.Mesh(towerGeom, towerMat);
        tower2.position.set(0, 7, -15);
        tower2.castShadow = true;
        tower2.receiveShadow = true;
        scene.add(tower2);
        objects.push(tower2);

        // Boathouse (box boathouse)
        var boathouseGeom = new THREE.BoxGeometry(8, 5, 10);
        var boathouseMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var boathouse = new THREE.Mesh(boathouseGeom, boathouseMat);
        boathouse.position.set(15, 2.5, -25);
        boathouse.castShadow = true;
        boathouse.receiveShadow = true;
        scene.add(boathouse);
        objects.push(boathouse);

        // Patrol Boat Hull (cylinder patrol boat hull)
        var boatGeom = new THREE.CylinderGeometry(3, 3.5, 12, 12);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var boat = new THREE.Mesh(boatGeom, boatMat);
        boat.position.set(20, 1.5, -30);
        boat.rotation.z = Math.PI / 2;
        boat.castShadow = true;
        boat.receiveShadow = true;
        scene.add(boat);
        objects.push(boat);

        // Marker Buoy 1 (sphere marker buoy)
        var buoyGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(22, 0.75, -20);
        buoy1.castShadow = true;
        buoy1.receiveShadow = true;
        scene.add(buoy1);
        objects.push(buoy1);

        // Marker Buoy 2 (sphere marker buoy)
        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(25, 0.75, -15);
        buoy2.castShadow = true;
        buoy2.receiveShadow = true;
        scene.add(buoy2);
        objects.push(buoy2);

        // Anti-submarine Net (LineSegments anti-submarine net)
        var netGeom = new THREE.BufferGeometry();
        var netVertices = new Float32Array([
            24, 1, -22, 26, 1, -22,
            26, 1, -22, 28, 1, -18,
            28, 1, -18, 24, 1, -18,
            24, 1, -18, 24, 1, -22
        ]);
        netGeom.setAttribute('position', new THREE.BufferAttribute(netVertices, 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x228B22 });
        var net = new THREE.LineSegments(netGeom, netMat);
        scene.add(net);
        objects.push(net);

        // Ben Lomond Stone Shelter (box stone shelter)
        var shelterGeom = new THREE.BoxGeometry(6, 5, 6);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(-20, 2.5, 15);
        shelter.castShadow = true;
        shelter.receiveShadow = true;
        scene.add(shelter);
        objects.push(shelter);

        // Signal Mast (cylinder signal mast)
        var mastGeom = new THREE.CylinderGeometry(1.5, 1.5, 16, 12);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-18, 8, 18);
        mast.castShadow = true;
        mast.receiveShadow = true;
        scene.add(mast);
        objects.push(mast);

        // Radome (sphere radome)
        var radomeGeom = new THREE.SphereGeometry(2.5, 12, 12);
        var radiatorMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var radome = new THREE.Mesh(radomeGeom, radiatorMat);
        radome.position.set(-18, 17, 18);
        radome.castShadow = true;
        radome.receiveShadow = true;
        scene.add(radome);
        objects.push(radome);

        // Island Fortification (box island fortification)
        var islandGeom = new THREE.BoxGeometry(16, 6, 12);
        var islandMat = new THREE.MeshLambertMaterial({ color: 0x5F5F5F });
        var island = new THREE.Mesh(islandGeom, islandMat);
        island.position.set(10, 3, 20);
        island.castShadow = true;
        island.receiveShadow = true;
        scene.add(island);
        objects.push(island);

        // Magazine (box magazine)
        var magGeom = new THREE.BoxGeometry(5, 4, 5);
        var magMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var magazine = new THREE.Mesh(magGeom, magMat);
        magazine.position.set(8, 2, 24);
        magazine.castShadow = true;
        magazine.receiveShadow = true;
        scene.add(magazine);
        objects.push(magazine);

        // Pontoon Bridge Cables (LineSegments pontoon bridge cables)
        var pontoonGeom = new THREE.BufferGeometry();
        var pontoonVertices = new Float32Array([
            6, 1, 20, 14, 1, 25,
            14, 1, 25, 18, 1, 18,
            18, 1, 18, 10, 1, 15,
            10, 1, 15, 6, 1, 20
        ]);
        pontoonGeom.setAttribute('position', new THREE.BufferAttribute(pontoonVertices, 3));
        var pontoonMat = new THREE.LineBasicMaterial({ color: 0x8B4513 });
        var pontoon = new THREE.LineSegments(pontoonGeom, pontoonMat);
        scene.add(pontoon);
        objects.push(pontoon);

        // Victorian Lodge (box Victorian lodge)
        var lodgeGeom = new THREE.BoxGeometry(14, 8, 10);
        var lodgeMat = new THREE.MeshLambertMaterial({ color: 0xD2691E });
        var lodge = new THREE.Mesh(lodgeGeom, lodgeMat);
        lodge.position.set(-8, 4, 8);
        lodge.castShadow = true;
        lodge.receiveShadow = true;
        scene.add(lodge);
        objects.push(lodge);

        // Vehicle Compound (box vehicle compound)
        var compoundGeom = new THREE.BoxGeometry(12, 3, 12);
        var compoundMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var compound = new THREE.Mesh(compoundGeom, compoundMat);
        compound.position.set(-5, 1.5, -5);
        compound.castShadow = true;
        compound.receiveShadow = true;
        scene.add(compound);
        objects.push(compound);

        // Comms Mast (cylinder comms mast)
        var commsMastGeom = new THREE.CylinderGeometry(1, 1, 12, 8);
        var commsMastMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var commsMast = new THREE.Mesh(commsMastGeom, commsMastMat);
        commsMast.position.set(-2, 6, 5);
        commsMast.castShadow = true;
        commsMast.receiveShadow = true;
        scene.add(commsMast);
        objects.push(commsMast);

        // Watchtower (cone watchtower)
        var towerConeGeom = new THREE.ConeGeometry(4, 10, 12);
        var towerConeMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var watchTower = new THREE.Mesh(towerConeGeom, towerConeMat);
        watchTower.position.set(-15, 5, 25);
        watchTower.castShadow = true;
        watchTower.receiveShadow = true;
        scene.add(watchTower);
        objects.push(watchTower);

        // Concrete Barriers (box concrete barriers)
        var barrierGeom = new THREE.BoxGeometry(4, 2, 1);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(-20, 1, 28);
        barrier.castShadow = true;
        barrier.receiveShadow = true;
        scene.add(barrier);
        objects.push(barrier);

        // Guard Post (box guard post)
        var guardGeom = new THREE.BoxGeometry(6, 4, 6);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x3C3C3C });
        var guardPost = new THREE.Mesh(guardGeom, guardMat);
        guardPost.position.set(-18, 2, 30);
        guardPost.castShadow = true;
        guardPost.receiveShadow = true;
        scene.add(guardPost);
        objects.push(guardPost);

        // Landing Jetty (box landing jetty)
        var jettyGeom = new THREE.BoxGeometry(8, 1.5, 12);
        var jettyMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var jetty = new THREE.Mesh(jettyGeom, jettyMat);
        jetty.position.set(28, 0.75, 10);
        jetty.castShadow = true;
        jetty.receiveShadow = true;
        scene.add(jetty);
        objects.push(jetty);

        // Patrol Float 1 (sphere patrol float)
        var floatGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var floatMat = new THREE.MeshLambertMaterial({ color: 0x20B2AA });
        var float1 = new THREE.Mesh(floatGeom, floatMat);
        float1.position.set(32, 0.6, 12);
        float1.castShadow = true;
        float1.receiveShadow = true;
        scene.add(float1);
        objects.push(float1);

        // Patrol Float 2 (sphere patrol float)
        var float2 = new THREE.Mesh(floatGeom, floatMat);
        float2.position.set(35, 0.6, 8);
        float2.castShadow = true;
        float2.receiveShadow = true;
        scene.add(float2);
        objects.push(float2);

        // Cable Sensor (LineSegments cable sensor)
        var cableSensorGeom = new THREE.BufferGeometry();
        var cableSensorVertices = new Float32Array([
            28, 0.5, 8, 36, 0.5, 10,
            36, 0.5, 10, 34, 0.5, 14,
            34, 0.5, 14, 28, 0.5, 12,
            28, 0.5, 12, 28, 0.5, 8
        ]);
        cableSensorGeom.setAttribute('position', new THREE.BufferAttribute(cableSensorVertices, 3));
        var cableSensorMat = new THREE.LineBasicMaterial({ color: 0x00CED1 });
        var cableSensor = new THREE.LineSegments(cableSensorGeom, cableSensorMat);
        scene.add(cableSensor);
        objects.push(cableSensor);

        // Rocky Cutting (box rocky cutting)
        var rockyCuttingGeom = new THREE.BoxGeometry(14, 6, 8);
        var rockyCuttingMat = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
        var rockyCutting = new THREE.Mesh(rockyCuttingGeom, rockyCuttingMat);
        rockyCutting.position.set(15, 3, -8);
        rockyCutting.castShadow = true;
        rockyCutting.receiveShadow = true;
        scene.add(rockyCutting);
        objects.push(rockyCutting);

        // Sandbag Emplacement (box sandbag emplacement)
        var sandbagGeom = new THREE.BoxGeometry(10, 2, 6);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
        var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
        sandbag.position.set(18, 1, -2);
        sandbag.castShadow = true;
        sandbag.receiveShadow = true;
        scene.add(sandbag);
        objects.push(sandbag);

        // IED Charge 1 (sphere IED charge)
        var chargeGeom = new THREE.SphereGeometry(0.8, 8, 8);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var charge1 = new THREE.Mesh(chargeGeom, chargeMat);
        charge1.position.set(20, 0.4, 1);
        charge1.castShadow = true;
        charge1.receiveShadow = true;
        scene.add(charge1);
        objects.push(charge1);

        // IED Charge 2 (sphere IED charge)
        var charge2 = new THREE.Mesh(chargeGeom, chargeMat);
        charge2.position.set(16, 0.4, 0);
        charge2.castShadow = true;
        charge2.receiveShadow = true;
        scene.add(charge2);
        objects.push(charge2);

        // Ambient Light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional Light
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 25, 30);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.0005 * delta;
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
