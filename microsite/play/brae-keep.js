window.BraeKeep = (function() {
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
        var stoneGray = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var darkStone = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var brownStone = new THREE.MeshLambertMaterial({ color: 0x664444 });
        var ironDark = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var fireOrange = new THREE.MeshLambertMaterial({ color: 0xff6600 });

        // Central keep tower - tall box
        var keepGeom = new THREE.BoxGeometry(12, 25, 12);
        var keepMesh = new THREE.Mesh(keepGeom, stoneGray);
        keepMesh.position.set(0, 12.5, 0);
        keepMesh.castShadow = true;
        keepMesh.receiveShadow = true;
        scene.add(keepMesh);
        objects.push(keepMesh);

        // Northeast corner tower cylinder
        var towerNEGeom = new THREE.CylinderGeometry(5, 5, 20, 16);
        var towerNE = new THREE.Mesh(towerNEGeom, darkStone);
        towerNE.position.set(20, 10, -20);
        towerNE.castShadow = true;
        towerNE.receiveShadow = true;
        scene.add(towerNE);
        objects.push(towerNE);

        // Northeast crenellated cone cap
        var capNEGeom = new THREE.ConeGeometry(5.5, 3, 16);
        var capNE = new THREE.Mesh(capNEGeom, brownStone);
        capNE.position.set(20, 22, -20);
        capNE.castShadow = true;
        capNE.receiveShadow = true;
        scene.add(capNE);
        objects.push(capNE);

        // Northwest corner tower cylinder
        var towerNWGeom = new THREE.CylinderGeometry(5, 5, 20, 16);
        var towerNW = new THREE.Mesh(towerNWGeom, darkStone);
        towerNW.position.set(-20, 10, -20);
        towerNW.castShadow = true;
        towerNW.receiveShadow = true;
        scene.add(towerNW);
        objects.push(towerNW);

        // Northwest crenellated cone cap
        var capNWGeom = new THREE.ConeGeometry(5.5, 3, 16);
        var capNW = new THREE.Mesh(capNWGeom, brownStone);
        capNW.position.set(-20, 22, -20);
        capNW.castShadow = true;
        capNW.receiveShadow = true;
        scene.add(capNW);
        objects.push(capNW);

        // Southeast corner tower cylinder
        var towerSEGeom = new THREE.CylinderGeometry(5, 5, 20, 16);
        var towerSE = new THREE.Mesh(towerSEGeom, darkStone);
        towerSE.position.set(20, 10, 20);
        towerSE.castShadow = true;
        towerSE.receiveShadow = true;
        scene.add(towerSE);
        objects.push(towerSE);

        // Southeast crenellated cone cap
        var capSEGeom = new THREE.ConeGeometry(5.5, 3, 16);
        var capSE = new THREE.Mesh(capSEGeom, brownStone);
        capSE.position.set(20, 22, 20);
        capSE.castShadow = true;
        capSE.receiveShadow = true;
        scene.add(capSE);
        objects.push(capSE);

        // Southwest corner tower cylinder
        var towerSWGeom = new THREE.CylinderGeometry(5, 5, 20, 16);
        var towerSW = new THREE.Mesh(towerSWGeom, darkStone);
        towerSW.position.set(-20, 10, 20);
        towerSW.castShadow = true;
        towerSW.receiveShadow = true;
        scene.add(towerSW);
        objects.push(towerSW);

        // Southwest crenellated cone cap
        var capSWGeom = new THREE.ConeGeometry(5.5, 3, 16);
        var capSW = new THREE.Mesh(capSWGeom, brownStone);
        capSW.position.set(-20, 22, 20);
        capSW.castShadow = true;
        capSW.receiveShadow = true;
        scene.add(capSW);
        objects.push(capSW);

        // Portcullis gate frame - outer box
        var gateFrameGeom = new THREE.BoxGeometry(10, 8, 1.5);
        var gateFrame = new THREE.Mesh(gateFrameGeom, ironDark);
        gateFrame.position.set(0, 4, -15);
        gateFrame.castShadow = true;
        gateFrame.receiveShadow = true;
        scene.add(gateFrame);
        objects.push(gateFrame);

        // Portcullis iron grating - LineSegments
        var gatePoints = [];
        for (var gx = -4; gx <= 4; gx += 1.5) {
            gatePoints.push(new THREE.Vector3(gx, -3, -15));
            gatePoints.push(new THREE.Vector3(gx, 3, -15));
        }
        for (var gy = -3; gy <= 3; gy += 1) {
            gatePoints.push(new THREE.Vector3(-4, gy, -15));
            gatePoints.push(new THREE.Vector3(4, gy, -15));
        }
        var gateGeom = new THREE.BufferGeometry();
        gateGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(
            gatePoints.flatMap(function(p) { return [p.x, p.y, p.z]; })
        ), 3));
        var gateMat = new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 });
        var gateGrid = new THREE.LineSegments(gateGeom, gateMat);
        scene.add(gateGrid);
        objects.push(gateGrid);

        // Murder hole ceiling - box floor with small gaps
        var murderHoleGeom = new THREE.BoxGeometry(14, 0.8, 14);
        var murderHole = new THREE.Mesh(murderHoleGeom, stoneGray);
        murderHole.position.set(0, 8, 0);
        murderHole.castShadow = true;
        murderHole.receiveShadow = true;
        scene.add(murderHole);
        objects.push(murderHole);

        // Gap 1 - small box removed visually (just darker)
        var gap1Geom = new THREE.BoxGeometry(2, 0.2, 2);
        var gap1 = new THREE.Mesh(gap1Geom, darkStone);
        gap1.position.set(3, 8.4, 3);
        scene.add(gap1);
        objects.push(gap1);

        // Gap 2 - small box removed visually
        var gap2Geom = new THREE.BoxGeometry(2, 0.2, 2);
        var gap2 = new THREE.Mesh(gap2Geom, darkStone);
        gap2.position.set(-3, 8.4, -3);
        scene.add(gap2);
        objects.push(gap2);

        // Spiral approach ramp section 1
        var ramp1Geom = new THREE.BoxGeometry(8, 1, 3);
        var ramp1 = new THREE.Mesh(ramp1Geom, brownStone);
        ramp1.rotation.z = 0.3;
        ramp1.position.set(12, 3, -18);
        ramp1.castShadow = true;
        ramp1.receiveShadow = true;
        scene.add(ramp1);
        objects.push(ramp1);

        // Spiral approach ramp section 2
        var ramp2Geom = new THREE.BoxGeometry(8, 1, 3);
        var ramp2 = new THREE.Mesh(ramp2Geom, brownStone);
        ramp2.rotation.z = -0.3;
        ramp2.position.set(-12, 3, -18);
        ramp2.castShadow = true;
        ramp2.receiveShadow = true;
        scene.add(ramp2);
        objects.push(ramp2);

        // Trebuchet siege weapon - base frame
        var trebBaseGeom = new THREE.BoxGeometry(6, 1, 6);
        var trebBase = new THREE.Mesh(trebBaseGeom, darkStone);
        trebBase.position.set(25, 1, -25);
        trebBase.castShadow = true;
        trebBase.receiveShadow = true;
        scene.add(trebBase);
        objects.push(trebBase);

        // Trebuchet arm - long box
        var trebArmGeom = new THREE.BoxGeometry(1.5, 0.8, 10);
        var trebArm = new THREE.Mesh(trebArmGeom, brownStone);
        trebArm.position.set(25, 3.5, -25);
        trebArm.rotation.x = 0.4;
        trebArm.castShadow = true;
        trebArm.receiveShadow = true;
        scene.add(trebArm);
        objects.push(trebArm);

        // Trebuchet counterweight - sphere
        var trebWeightGeom = new THREE.SphereGeometry(2, 12, 12);
        var trebWeight = new THREE.Mesh(trebWeightGeom, ironDark);
        trebWeight.position.set(25, 4, -20);
        trebWeight.castShadow = true;
        trebWeight.receiveShadow = true;
        scene.add(trebWeight);
        objects.push(trebWeight);

        // Beacon fire post - cylinder on highest tower
        var beaconPostGeom = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
        var beaconPost = new THREE.Mesh(beaconPostGeom, darkStone);
        beaconPost.position.set(-20, 25, -20);
        beaconPost.castShadow = true;
        beaconPost.receiveShadow = true;
        scene.add(beaconPost);
        objects.push(beaconPost);

        // Beacon fire flame - sphere
        var flameGeom = new THREE.SphereGeometry(2.5, 10, 10);
        var flameMesh = new THREE.Mesh(flameGeom, fireOrange);
        flameMesh.position.set(-20, 29, -20);
        flameMesh.castShadow = true;
        flameMesh.receiveShadow = true;
        scene.add(flameMesh);
        objects.push(flameMesh);

        // Terraced hillside wall section 1
        var hillWall1Geom = new THREE.BoxGeometry(40, 2, 1);
        var hillWall1 = new THREE.Mesh(hillWall1Geom, stoneGray);
        hillWall1.position.set(0, 1, -30);
        hillWall1.castShadow = true;
        hillWall1.receiveShadow = true;
        scene.add(hillWall1);
        objects.push(hillWall1);

        // Terraced hillside wall section 2
        var hillWall2Geom = new THREE.BoxGeometry(40, 2, 1);
        var hillWall2 = new THREE.Mesh(hillWall2Geom, stoneGray);
        hillWall2.position.set(0, 6, -18);
        hillWall2.castShadow = true;
        hillWall2.receiveShadow = true;
        scene.add(hillWall2);
        objects.push(hillWall2);

        // Lighting
        var mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(15, 25, 15);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.left = -50;
        mainLight.shadow.camera.right = 50;
        mainLight.shadow.camera.top = 50;
        mainLight.shadow.camera.bottom = -50;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 100;
        scene.add(mainLight);
        lights.push(mainLight);

        var ambientLight = new THREE.AmbientLight(0xaaaaaa, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        // Animate beacon flame pulsing
        if (objects.length > 0) {
            var beaconIdx = -1;
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry instanceof THREE.SphereGeometry && objects[i].position.z < -15) {
                    if (Math.abs(objects[i].position.y - 29) < 1) {
                        beaconIdx = i;
                        break;
                    }
                }
            }
            if (beaconIdx >= 0) {
                var scale = 1 + 0.1 * Math.sin(delta * 3);
                objects[beaconIdx].scale.set(scale, scale, scale);
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
