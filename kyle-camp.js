window.KyleCamp = (function() {
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
        // Narrow sea channel terrain - box floor
        var channelGeom = new THREE.BoxGeometry(80, 2, 60);
        var channelMat = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
        var channel = new THREE.Mesh(channelGeom, channelMat);
        channel.position.set(0, -15, 0);
        scene.add(channel);
        objects.push(channel);

        // Beach assault landing craft hull - box
        var hullGeom = new THREE.BoxGeometry(12, 4, 20);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(-20, -10, 15);
        scene.add(hull);
        objects.push(hull);

        // Landing craft ramp - cylinder
        var rampGeom = new THREE.CylinderGeometry(2, 2, 15, 8);
        var rampMat = new THREE.MeshLambertMaterial({ color: 0x34495e });
        var ramp = new THREE.Mesh(rampGeom, rampMat);
        ramp.rotation.z = Math.PI / 6;
        ramp.position.set(-20, -5, 5);
        scene.add(ramp);
        objects.push(ramp);

        // Anti-landing obstacle 1 - angled box stake
        var stakeGeom = new THREE.BoxGeometry(1.5, 6, 1.5);
        var stakeMat = new THREE.MeshLambertMaterial({ color: 0x7f8c8d });
        var stake1 = new THREE.Mesh(stakeGeom, stakeMat);
        stake1.rotation.z = Math.PI / 4;
        stake1.position.set(10, -8, 20);
        scene.add(stake1);
        objects.push(stake1);

        // Anti-landing obstacle 2
        var stake2 = new THREE.Mesh(stakeGeom, stakeMat);
        stake2.rotation.z = -Math.PI / 4;
        stake2.position.set(15, -8, 22);
        scene.add(stake2);
        objects.push(stake2);

        // Anti-landing obstacle 3
        var stake3 = new THREE.Mesh(stakeGeom, stakeMat);
        stake3.rotation.z = Math.PI / 3;
        stake3.position.set(20, -8, 18);
        scene.add(stake3);
        objects.push(stake3);

        // Fire support barge hull - box
        var bargeGeom = new THREE.BoxGeometry(10, 3, 18);
        var bargeMat = new THREE.MeshLambertMaterial({ color: 0x1a252f });
        var barge = new THREE.Mesh(bargeGeom, bargeMat);
        barge.position.set(25, -12, -10);
        scene.add(barge);
        objects.push(barge);

        // Barge gun mount - cylinder
        var gunGeom = new THREE.CylinderGeometry(1.2, 1.2, 8, 8);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x16202a });
        var gun = new THREE.Mesh(gunGeom, gunMat);
        gun.rotation.z = Math.PI / 6;
        gun.position.set(25, -8, -10);
        scene.add(gun);
        objects.push(gun);

        // Rope ferry platform - box
        var ferryGeom = new THREE.BoxGeometry(8, 2, 10);
        var ferryMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var ferry = new THREE.Mesh(ferryGeom, ferryMat);
        ferry.position.set(-15, -8, -15);
        scene.add(ferry);
        objects.push(ferry);

        // Rope ferry cable - LineSegments
        var cablePoints = [
            new THREE.Vector3(-15, -5, -20),
            new THREE.Vector3(-15, -5, 20),
            new THREE.Vector3(-25, -6, -20),
            new THREE.Vector3(-25, -6, 20)
        ];
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0xd4a574 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Sea-mine field bunker - box
        var bunkerGeom = new THREE.BoxGeometry(6, 4, 8);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x5d4e37 });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(30, -10, 5);
        scene.add(bunker);
        objects.push(bunker);

        // Mine array cables - LineSegments
        var minePoints = [
            new THREE.Vector3(25, -14, 0),
            new THREE.Vector3(35, -14, 0),
            new THREE.Vector3(25, -14, 10),
            new THREE.Vector3(35, -14, 10),
            new THREE.Vector3(30, -14, -5),
            new THREE.Vector3(30, -14, 15)
        ];
        var mineGeom = new THREE.BufferGeometry().setFromPoints(minePoints);
        var mineMat = new THREE.LineBasicMaterial({ color: 0xc0504d });
        var mineArray = new THREE.LineSegments(mineGeom, mineMat);
        scene.add(mineArray);
        objects.push(mineArray);

        // Beach fighting position berm - box
        var bermGeom = new THREE.BoxGeometry(14, 3, 5);
        var bermMat = new THREE.MeshLambertMaterial({ color: 0x9d8b78 });
        var berm = new THREE.Mesh(bermGeom, bermMat);
        berm.position.set(-5, -10, -20);
        scene.add(berm);
        objects.push(berm);

        // Camouflage sphere 1
        var camoGeom1 = new THREE.SphereGeometry(1.5, 8, 8);
        var camoMat1 = new THREE.MeshLambertMaterial({ color: 0x7cb342 });
        var camo1 = new THREE.Mesh(camoGeom1, camoMat1);
        camo1.position.set(-10, -8, -20);
        scene.add(camo1);
        objects.push(camo1);

        // Camouflage sphere 2
        var camoGeom2 = new THREE.SphereGeometry(1.2, 8, 8);
        var camoMat2 = new THREE.MeshLambertMaterial({ color: 0x8bc34a });
        var camo2 = new THREE.Mesh(camoGeom2, camoMat2);
        camo2.position.set(0, -8, -20);
        scene.add(camo2);
        objects.push(camo2);

        // Camouflage sphere 3
        var camoGeom3 = new THREE.SphereGeometry(1.3, 8, 8);
        var camoMat3 = new THREE.MeshLambertMaterial({ color: 0x689f38 });
        var camo3 = new THREE.Mesh(camoGeom3, camoMat3);
        camo3.position.set(5, -8, -20);
        scene.add(camo3);
        objects.push(camo3);

        // Signal lamp station pole - cylinder
        var poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x455a64 });
        var pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(-30, -6, -25);
        scene.add(pole);
        objects.push(pole);

        // Signal lamp - sphere
        var lampGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var lampMat = new THREE.MeshLambertMaterial({ color: 0xfdd835 });
        var lamp = new THREE.Mesh(lampGeom, lampMat);
        lamp.position.set(-30, 4, -25);
        scene.add(lamp);
        objects.push(lamp);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);

        // Ambient light
        var ambLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambLight);
        lights.push(ambLight);
    }

    function update(delta) {
        // Animate elements
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation && i % 7 === 0) {
                objects[i].rotation.y += delta * 0.3;
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
