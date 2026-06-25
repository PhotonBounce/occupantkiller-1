window.CoulportKeep = (function() {
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
        // Trident warhead bunkers
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var bunkerGeo = new THREE.BoxGeometry(12, 8, 10);
        var bunker1 = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunker1.position.set(-25, 2, -20);
        scene.add(bunker1);
        objects.push(bunker1);

        var bunker2 = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunker2.position.set(-20, 2, 0);
        scene.add(bunker2);
        objects.push(bunker2);

        var bunker3 = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunker3.position.set(-15, 2, 15);
        scene.add(bunker3);
        objects.push(bunker3);

        // Air shafts for bunkers
        var shaftMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var shaftGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 8);
        var shaft1 = new THREE.Mesh(shaftGeo, shaftMat);
        shaft1.position.set(-25, 6, -18);
        scene.add(shaft1);
        objects.push(shaft1);

        var shaft2 = new THREE.Mesh(shaftGeo, shaftMat);
        shaft2.position.set(-20, 6, 2);
        scene.add(shaft2);
        objects.push(shaft2);

        // Blast doors
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var doorGeo = new THREE.BoxGeometry(8, 7, 1);
        var door1 = new THREE.Mesh(doorGeo, doorMat);
        door1.position.set(-25, 3, -14);
        scene.add(door1);
        objects.push(door1);

        // Coulport jetty - hardened concrete pier
        var pieMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var pieGeo = new THREE.BoxGeometry(20, 2, 8);
        var pier = new THREE.Mesh(pieGeo, pieMat);
        pier.position.set(15, 1, -25);
        scene.add(pier);
        objects.push(pier);

        // Crane arm
        var craneMat = new THREE.MeshLambertMaterial({ color: 0xaa8844 });
        var craneGeo = new THREE.CylinderGeometry(0.8, 0.8, 18, 6);
        var craneArm = new THREE.Mesh(craneGeo, craneMat);
        craneArm.rotation.z = Math.PI / 2;
        craneArm.position.set(20, 8, -25);
        scene.add(craneArm);
        objects.push(craneArm);

        // Loading bay
        var bayMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var bayGeo = new THREE.BoxGeometry(14, 6, 10);
        var bay = new THREE.Mesh(bayGeo, bayMat);
        bay.position.set(22, 2, -15);
        scene.add(bay);
        objects.push(bay);

        // Loch Long approach - underwater mines
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
        var mineGeo = new THREE.SphereGeometry(2, 8, 8);
        var mine1 = new THREE.Mesh(mineGeo, mineMat);
        mine1.position.set(5, -8, -30);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeo, mineMat);
        mine2.position.set(12, -9, -28);
        scene.add(mine2);
        objects.push(mine2);

        // Anti-submarine net
        var netMat = new THREE.LineBasicMaterial({ color: 0x666666 });
        var netGeo = new THREE.BufferGeometry();
        var netVerts = new Float32Array([
            0, -5, -30,
            8, -5, -28,
            16, -5, -30,
            0, -10, -30,
            8, -10, -28,
            16, -10, -30
        ]);
        netGeo.setAttribute('position', new THREE.BufferAttribute(netVerts, 3));
        var netIndices = [0, 1, 1, 2, 3, 4, 4, 5, 0, 3, 1, 4, 2, 5];
        netGeo.setIndex(netIndices);
        var net = new THREE.LineSegments(netGeo, netMat);
        scene.add(net);
        objects.push(net);

        // Clifftop observation post
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var cliffGeo = new THREE.BoxGeometry(6, 5, 6);
        var cliffOP = new THREE.Mesh(cliffGeo, cliffMat);
        cliffOP.position.set(8, 12, -22);
        scene.add(cliffOP);
        objects.push(cliffOP);

        // Access road gates - blast-proof gatehouse
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var gateGeo = new THREE.BoxGeometry(10, 6, 8);
        var gatehouse = new THREE.Mesh(gateGeo, gateMat);
        gatehouse.position.set(-30, 2, 10);
        scene.add(gatehouse);
        objects.push(gatehouse);

        // Searchlight towers
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var towerGeo = new THREE.CylinderGeometry(1, 1.2, 10, 6);
        var tower1 = new THREE.Mesh(towerGeo, towerMat);
        tower1.position.set(-35, 4, 8);
        scene.add(tower1);
        objects.push(tower1);

        var tower2 = new THREE.Mesh(towerGeo, towerMat);
        tower2.position.set(-25, 4, 12);
        scene.add(tower2);
        objects.push(tower2);

        // Security post
        var secMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var secGeo = new THREE.BoxGeometry(5, 4, 5);
        var secPost = new THREE.Mesh(secGeo, secMat);
        secPost.position.set(-32, 1, 18);
        scene.add(secPost);
        objects.push(secPost);

        // Coulport peninsula perimeter - security fence
        var fenceMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var fenceGeo = new THREE.BoxGeometry(1, 4, 35);
        var fence = new THREE.Mesh(fenceGeo, fenceMat);
        fence.position.set(28, 1, 0);
        scene.add(fence);
        objects.push(fence);

        // Sensor nodes
        var sensorMat = new THREE.MeshLambertMaterial({ color: 0xccaa00 });
        var sensorGeo = new THREE.SphereGeometry(1.2, 6, 6);
        var sensor1 = new THREE.Mesh(sensorGeo, sensorMat);
        sensor1.position.set(25, 6, -15);
        scene.add(sensor1);
        objects.push(sensor1);

        var sensor2 = new THREE.Mesh(sensorGeo, sensorMat);
        sensor2.position.set(26, 6, 10);
        scene.add(sensor2);
        objects.push(sensor2);

        // Cable loop perimeter
        var cableMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
        var cableGeo = new THREE.BufferGeometry();
        var cableVerts = new Float32Array([
            28, 2, -20,
            28, 2, 20,
            20, 2, 25,
            -20, 2, 25,
            -28, 2, 20,
            -28, 2, -20,
            -20, 2, -25,
            20, 2, -25,
            28, 2, -20
        ]);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cableVerts, 3));
        var cableIndices = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8];
        cableGeo.setIndex(cableIndices);
        var cable = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Emergency warhead transfer facility - armored transporter garage
        var garageMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var garageGeo = new THREE.BoxGeometry(18, 8, 12);
        var garage = new THREE.Mesh(garageGeo, garageMat);
        garage.position.set(0, 3, 20);
        scene.add(garage);
        objects.push(garage);

        // Fuel depot
        var fuelMat = new THREE.MeshLambertMaterial({ color: 0x993333 });
        var fuelGeo = new THREE.CylinderGeometry(3, 3, 8, 8);
        var fuel = new THREE.Mesh(fuelGeo, fuelMat);
        fuel.position.set(10, 3, 26);
        scene.add(fuel);
        objects.push(fuel);

        // Admin block
        var adminMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var adminGeo = new THREE.BoxGeometry(8, 5, 8);
        var admin = new THREE.Mesh(adminGeo, adminMat);
        admin.position.set(-10, 2, 25);
        scene.add(admin);
        objects.push(admin);

        // Loch Long shoreline battery - gun emplacement
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var gunGeo = new THREE.BoxGeometry(10, 4, 10);
        var gun = new THREE.Mesh(gunGeo, gunMat);
        gun.position.set(18, 1, 5);
        scene.add(gun);
        objects.push(gun);

        // Gun barrel
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 14, 6);
        var barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.z = Math.PI / 4;
        barrel.position.set(20, 6, 5);
        scene.add(barrel);
        objects.push(barrel);

        // Magazine
        var magMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var magGeo = new THREE.BoxGeometry(8, 6, 8);
        var mag = new THREE.Mesh(magGeo, magMat);
        mag.position.set(18, 2, 15);
        scene.add(mag);
        objects.push(mag);

        // Kilcreggan peninsula relay - stone observation post
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var stoneGeo = new THREE.BoxGeometry(7, 6, 7);
        var stoneOP = new THREE.Mesh(stoneGeo, stoneMat);
        stoneOP.position.set(-18, 2, -8);
        scene.add(stoneOP);
        objects.push(stoneOP);

        // Signal mast
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var mastGeo = new THREE.CylinderGeometry(0.5, 0.5, 12, 6);
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(-18, 7, -8);
        scene.add(mast);
        objects.push(mast);

        // Radome
        var radiMat = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
        var radiGeo = new THREE.SphereGeometry(2.5, 8, 8);
        var radome = new THREE.Mesh(radiGeo, radiMat);
        radome.position.set(-18, 14, -8);
        scene.add(radome);
        objects.push(radome);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 15, 10);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation updates can be added here
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                // Subtle rotation for some structures
                if (i % 7 === 0) {
                    objects[i].rotation.y += delta * 0.05;
                }
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
