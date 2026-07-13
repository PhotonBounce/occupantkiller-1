window.LochDock = (function() {
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
        // Loch water shoreline - long box
        var shorelineGeo = new THREE.BoxGeometry(120, 2, 40);
        var shorelineMat = new THREE.MeshLambertMaterial({ color: 0x1a3a4a });
        var shoreline = new THREE.Mesh(shorelineGeo, shorelineMat);
        shoreline.position.set(0, -1, 0);
        scene.add(shoreline);
        objects.push(shoreline);

        // Seaplane hangar - box building at water's edge
        var hangarGeo = new THREE.BoxGeometry(35, 18, 25);
        var hangarMat = new THREE.MeshLambertMaterial({ color: 0x2d5a3d });
        var hangar = new THREE.Mesh(hangarGeo, hangarMat);
        hangar.position.set(-40, 8, 5);
        scene.add(hangar);
        objects.push(hangar);

        // Flying boat hull - main box fuselage
        var hullGeo = new THREE.BoxGeometry(22, 8, 6);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.set(-15, 3, -8);
        hull.rotation.z = 0.1;
        scene.add(hull);
        objects.push(hull);

        // Flying boat left float - cylinder
        var floatGeo = new THREE.CylinderGeometry(1.5, 1.5, 18, 8);
        var floatMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var leftFloat = new THREE.Mesh(floatGeo, floatMat);
        leftFloat.position.set(-10, 2, -6);
        leftFloat.rotation.z = Math.PI / 2;
        scene.add(leftFloat);
        objects.push(leftFloat);

        // Flying boat right float - cylinder
        var rightFloat = new THREE.Mesh(floatGeo, floatMat);
        rightFloat.position.set(-10, 2, -10);
        rightFloat.rotation.z = Math.PI / 2;
        scene.add(rightFloat);
        objects.push(rightFloat);

        // Torpedo net barrier frame - box frame
        var netFrameGeo = new THREE.BoxGeometry(50, 12, 2);
        var netFrameMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var netFrame = new THREE.Mesh(netFrameGeo, netFrameMat);
        netFrame.position.set(0, 5, -25);
        scene.add(netFrame);
        objects.push(netFrame);

        // Torpedo net barrier left float - cylinder
        var netFloatGeo = new THREE.CylinderGeometry(2, 2, 8, 8);
        var netFloatMat = new THREE.MeshLambertMaterial({ color: 0x4a5a5a });
        var netFloatLeft = new THREE.Mesh(netFloatGeo, netFloatMat);
        netFloatLeft.position.set(-25, 2, -25);
        netFloatLeft.rotation.z = Math.PI / 2;
        scene.add(netFloatLeft);
        objects.push(netFloatLeft);

        // Torpedo net barrier right float - cylinder
        var netFloatRight = new THREE.Mesh(netFloatGeo, netFloatMat);
        netFloatRight.position.set(25, 2, -25);
        netFloatRight.rotation.z = Math.PI / 2;
        scene.add(netFloatRight);
        objects.push(netFloatRight);

        // Depth charge rack frame - box frame
        var rackFrameGeo = new THREE.BoxGeometry(12, 10, 8);
        var rackFrameMat = new THREE.MeshLambertMaterial({ color: 0x2a4a3a });
        var rackFrame = new THREE.Mesh(rackFrameGeo, rackFrameMat);
        rackFrame.position.set(25, 4, 8);
        scene.add(rackFrame);
        objects.push(rackFrame);

        // Depth charge 1 - sphere
        var chargeSphereGeo = new THREE.SphereGeometry(1.2, 8, 8);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var charge1 = new THREE.Mesh(chargeSphereGeo, chargeMat);
        charge1.position.set(20, 8, 6);
        scene.add(charge1);
        objects.push(charge1);

        // Depth charge 2 - sphere
        var charge2 = new THREE.Mesh(chargeSphereGeo, chargeMat);
        charge2.position.set(25, 8, 6);
        scene.add(charge2);
        objects.push(charge2);

        // Depth charge 3 - sphere
        var charge3 = new THREE.Mesh(chargeSphereGeo, chargeMat);
        charge3.position.set(30, 8, 6);
        scene.add(charge3);
        objects.push(charge3);

        // Fuel pipeline section 1 - cylinder
        var pipeSectionGeo = new THREE.CylinderGeometry(1, 1, 20, 8);
        var pipeMat = new THREE.MeshLambertMaterial({ color: 0x5a3a2a });
        var pipeSection1 = new THREE.Mesh(pipeSectionGeo, pipeMat);
        pipeSection1.position.set(-5, 2, 15);
        pipeSection1.rotation.z = Math.PI / 2;
        scene.add(pipeSection1);
        objects.push(pipeSection1);

        // Fuel pipeline section 2 - cylinder
        var pipeSection2 = new THREE.Mesh(pipeSectionGeo, pipeMat);
        pipeSection2.position.set(10, 2, 15);
        pipeSection2.rotation.z = Math.PI / 2;
        scene.add(pipeSection2);
        objects.push(pipeSection2);

        // Fuel pump station - box
        var pumpStationGeo = new THREE.BoxGeometry(8, 6, 8);
        var pumpStationMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        var pumpStation = new THREE.Mesh(pumpStationGeo, pumpStationMat);
        pumpStation.position.set(20, 2, 15);
        scene.add(pumpStation);
        objects.push(pumpStation);

        // Underwater listening hydrophone control room - box
        var hydroControlGeo = new THREE.BoxGeometry(10, 6, 10);
        var hydroControlMat = new THREE.MeshLambertMaterial({ color: 0x1a2a3a });
        var hydroControl = new THREE.Mesh(hydroControlGeo, hydroControlMat);
        hydroControl.position.set(-30, 1, 12);
        scene.add(hydroControl);
        objects.push(hydroControl);

        // Hydrophone array pole 1 - cylinder
        var hydropoleGeo = new THREE.CylinderGeometry(0.5, 0.5, 15, 6);
        var hydropoleMat = new THREE.MeshLambertMaterial({ color: 0x2a4a4a });
        var hydropole1 = new THREE.Mesh(hydropoleGeo, hydropoleMat);
        hydropole1.position.set(-20, 6, 20);
        scene.add(hydropole1);
        objects.push(hydropole1);

        // Hydrophone array pole 2 - cylinder
        var hydropole2 = new THREE.Mesh(hydropoleGeo, hydropoleMat);
        hydropole2.position.set(-10, 6, 25);
        scene.add(hydropole2);
        objects.push(hydropole2);

        // Camouflage net pole 1 - cylinder
        var netPoleGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        var netPoleMat = new THREE.MeshLambertMaterial({ color: 0x3a4a3a });
        var netPole1 = new THREE.Mesh(netPoleGeo, netPoleMat);
        netPole1.position.set(-50, 9, -10);
        scene.add(netPole1);
        objects.push(netPole1);

        // Camouflage net pole 2 - cylinder
        var netPole2 = new THREE.Mesh(netPoleGeo, netPoleMat);
        netPole2.position.set(50, 9, -10);
        scene.add(netPole2);
        objects.push(netPole2);

        // Supply box storage 1 - box
        var supplyBoxGeo = new THREE.BoxGeometry(6, 5, 6);
        var supplyBoxMat = new THREE.MeshLambertMaterial({ color: 0x4a5a3a });
        var supplyBox1 = new THREE.Mesh(supplyBoxGeo, supplyBoxMat);
        supplyBox1.position.set(-35, 2, -5);
        scene.add(supplyBox1);
        objects.push(supplyBox1);

        // Supply box storage 2 - box
        var supplyBox2 = new THREE.Mesh(supplyBoxGeo, supplyBoxMat);
        supplyBox2.position.set(35, 2, -5);
        scene.add(supplyBox2);
        objects.push(supplyBox2);

        // Main ambient light
        var ambientLight = new THREE.AmbientLight(0xcccccc, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for dock simulation
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(40, 30, 30);
        dirLight.target.position.set(0, 0, 0);
        scene.add(dirLight);
        scene.add(dirLight.target);
        lights.push(dirLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.05;
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
