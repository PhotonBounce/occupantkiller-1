window.LuingSound = (function() {
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
        buildSound();
    }

    function buildSound() {
        // Cullipool slate village base - cottage 1
        var cottage1Geo = new THREE.BoxGeometry(4, 3, 5);
        var cottage1Mat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var cottage1 = new THREE.Mesh(cottage1Geo, cottage1Mat);
        cottage1.position.set(-20, 1.5, -15);
        scene.add(cottage1);
        objects.push(cottage1);

        // Cullipool slate village base - cottage 2
        var cottage2Geo = new THREE.BoxGeometry(4, 3, 5);
        var cottage2Mat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var cottage2 = new THREE.Mesh(cottage2Geo, cottage2Mat);
        cottage2.position.set(-12, 1.5, -18);
        scene.add(cottage2);
        objects.push(cottage2);

        // Cullipool storage shed 1
        var shed1Geo = new THREE.BoxGeometry(6, 2.5, 4);
        var shed1Mat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
        var shed1 = new THREE.Mesh(shed1Geo, shed1Mat);
        shed1.position.set(-18, 1.25, -8);
        scene.add(shed1);
        objects.push(shed1);

        // Cullipool storage shed 2
        var shed2Geo = new THREE.BoxGeometry(6, 2.5, 4);
        var shed2Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var shed2 = new THREE.Mesh(shed2Geo, shed2Mat);
        shed2.position.set(-10, 1.25, -12);
        scene.add(shed2);
        objects.push(shed2);

        // Cullipool chimney stack
        var chimneyGeo = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
        chimney.position.set(-16, 4, -14);
        scene.add(chimney);
        objects.push(chimney);

        // Ardinamir Bay concrete quay
        var quayGeo = new THREE.BoxGeometry(12, 1, 8);
        var quayMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var quay = new THREE.Mesh(quayGeo, quayMat);
        quay.position.set(8, 0.5, 5);
        scene.add(quay);
        objects.push(quay);

        // Ardinamir patrol boat 1
        var boat1Geo = new THREE.BoxGeometry(3, 1.5, 6);
        var boat1Mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var boat1 = new THREE.Mesh(boat1Geo, boat1Mat);
        boat1.position.set(5, 1, 8);
        scene.add(boat1);
        objects.push(boat1);

        // Ardinamir patrol boat 2
        var boat2Geo = new THREE.BoxGeometry(3, 1.5, 6);
        var boat2Mat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
        var boat2 = new THREE.Mesh(boat2Geo, boat2Mat);
        boat2.position.set(12, 1, 9);
        scene.add(boat2);
        objects.push(boat2);

        // Ardinamir anchor buoy 1
        var buoy1Geo = new THREE.SphereGeometry(0.6, 8, 8);
        var buoy1Mat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var buoy1 = new THREE.Mesh(buoy1Geo, buoy1Mat);
        buoy1.position.set(3, 2, 2);
        scene.add(buoy1);
        objects.push(buoy1);

        // Ardinamir anchor buoy 2
        var buoy2Geo = new THREE.SphereGeometry(0.6, 8, 8);
        var buoy2Mat = new THREE.MeshLambertMaterial({ color: 0xff8800 });
        var buoy2 = new THREE.Mesh(buoy2Geo, buoy2Mat);
        buoy2.position.set(14, 2, 4);
        scene.add(buoy2);
        objects.push(buoy2);

        // Luing ferry ramp
        var rampGeo = new THREE.BoxGeometry(8, 0.5, 10);
        var rampMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var ramp = new THREE.Mesh(rampGeo, rampMat);
        ramp.position.set(28, 0.25, 12);
        scene.add(ramp);
        objects.push(ramp);

        // Luing ferry vehicle on deck
        var vehicleGeo = new THREE.BoxGeometry(4, 2, 5);
        var vehicleMat = new THREE.MeshLambertMaterial({ color: 0xcc0000 });
        var vehicle = new THREE.Mesh(vehicleGeo, vehicleMat);
        vehicle.position.set(28, 1.5, 14);
        scene.add(vehicle);
        objects.push(vehicle);

        // Luing mooring bollard
        var bollardGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var bollard = new THREE.Mesh(bollardGeo, bollardMat);
        bollard.position.set(32, 1, 10);
        scene.add(bollard);
        objects.push(bollard);

        // Cuan Sound clifftop post
        var postGeo = new THREE.BoxGeometry(1.5, 6, 1.5);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var post = new THREE.Mesh(postGeo, postMat);
        post.position.set(-5, 3, 25);
        scene.add(post);
        objects.push(post);

        // Cuan Sound boom cable (LineSegments)
        var cableGeo = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -5, 3, 25,
            15, 3, 25
        ]);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
        var cable = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Cuan Sound tidal generator float 1
        var floatGeo = new THREE.SphereGeometry(1, 8, 8);
        var floatMat = new THREE.MeshLambertMaterial({ color: 0x0066ff });
        var float1 = new THREE.Mesh(floatGeo, floatMat);
        float1.position.set(5, 2, 28);
        scene.add(float1);
        objects.push(float1);

        // Cuan Sound tidal generator float 2
        var float2Geo = new THREE.SphereGeometry(1, 8, 8);
        var float2Mat = new THREE.MeshLambertMaterial({ color: 0x0088ff });
        var float2 = new THREE.Mesh(float2Geo, float2Mat);
        float2.position.set(10, 2, 28);
        scene.add(float2);
        objects.push(float2);

        // Slate quarry entrance
        var entranceGeo = new THREE.BoxGeometry(5, 4, 2);
        var entranceMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var entrance = new THREE.Mesh(entranceGeo, entranceMat);
        entrance.position.set(-25, 2, 8);
        scene.add(entrance);
        objects.push(entrance);

        // Slate quarry tunnel section 1
        var tunnel1Geo = new THREE.BoxGeometry(3, 3, 6);
        var tunnel1Mat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var tunnel1 = new THREE.Mesh(tunnel1Geo, tunnel1Mat);
        tunnel1.position.set(-25, 2, 15);
        scene.add(tunnel1);
        objects.push(tunnel1);

        // Slate quarry tunnel section 2
        var tunnel2Geo = new THREE.BoxGeometry(3, 3, 6);
        var tunnel2Mat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var tunnel2 = new THREE.Mesh(tunnel2Geo, tunnel2Mat);
        tunnel2.position.set(-25, 2, 22);
        scene.add(tunnel2);
        objects.push(tunnel2);

        // Slate quarry support pillar 1
        var pillar1Geo = new THREE.CylinderGeometry(1.2, 1.2, 5, 8);
        var pillar1Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var pillar1 = new THREE.Mesh(pillar1Geo, pillar1Mat);
        pillar1.position.set(-22, 2.5, 18);
        scene.add(pillar1);
        objects.push(pillar1);

        // Slate quarry support pillar 2
        var pillar2Geo = new THREE.CylinderGeometry(1.2, 1.2, 5, 8);
        var pillar2Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var pillar2 = new THREE.Mesh(pillar2Geo, pillar2Mat);
        pillar2.position.set(-28, 2.5, 18);
        scene.add(pillar2);
        objects.push(pillar2);

        // Torsa observation post
        var opGeo = new THREE.BoxGeometry(3, 4, 3);
        var opMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var op = new THREE.Mesh(opGeo, opMat);
        op.position.set(-30, 2, -25);
        scene.add(op);
        objects.push(op);

        // Torsa relay cable (LineSegments)
        var relayCableGeo = new THREE.BufferGeometry();
        var relayCablePositions = new Float32Array([
            -30, 2, -25,
            -15, 2, -20
        ]);
        relayCableGeo.setAttribute('position', new THREE.BufferAttribute(relayCablePositions, 3));
        var relayCableMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
        var relayCable = new THREE.LineSegments(relayCableGeo, relayCableMat);
        scene.add(relayCable);
        objects.push(relayCable);

        // Black Mill Bay hidden quay
        var hiddenQuayGeo = new THREE.BoxGeometry(10, 1, 7);
        var hiddenQuayMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var hiddenQuay = new THREE.Mesh(hiddenQuayGeo, hiddenQuayMat);
        hiddenQuay.position.set(20, 0.5, -20);
        scene.add(hiddenQuay);
        objects.push(hiddenQuay);

        // Black Mill Bay camouflage netting 1
        var camo1Geo = new THREE.BoxGeometry(8, 1, 6);
        var camo1Mat = new THREE.MeshLambertMaterial({ color: 0x446644 });
        var camo1 = new THREE.Mesh(camo1Geo, camo1Mat);
        camo1.position.set(18, 0.5, -28);
        scene.add(camo1);
        objects.push(camo1);

        // Black Mill Bay camouflage netting 2
        var camo2Geo = new THREE.BoxGeometry(6, 0.8, 5);
        var camo2Mat = new THREE.MeshLambertMaterial({ color: 0x335533 });
        var camo2 = new THREE.Mesh(camo2Geo, camo2Mat);
        camo2.position.set(25, 0.4, -25);
        scene.add(camo2);
        objects.push(camo2);

        // Black Mill Bay fuel tank
        var tankGeo = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(22, 2, -18);
        scene.add(tank);
        objects.push(tank);

        // Additional cone structure - coastal warning beacon
        var beaconGeo = new THREE.ConeGeometry(0.8, 3, 8);
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(0, 1.5, 0);
        scene.add(beacon);
        objects.push(beacon);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.CylinderGeometry) {
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
