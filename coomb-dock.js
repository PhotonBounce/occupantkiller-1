window.CoombDock = (function() {
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
        // Chalk headwall cliff - tall white box walls
        var cliffGeom = new THREE.BoxGeometry(60, 40, 5);
        var cliffMat = new THREE.MeshLambertMaterial({color: 0xf5f5dc});
        var cliff = new THREE.Mesh(cliffGeom, cliffMat);
        cliff.position.set(0, 15, -25);
        scene.add(cliff);
        objects.push(cliff);

        // Supply dock platform - flat loading area
        var platformGeom = new THREE.BoxGeometry(40, 2, 25);
        var platformMat = new THREE.MeshLambertMaterial({color: 0x8b7355});
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(0, 1, 0);
        scene.add(platform);
        objects.push(platform);

        // Chalk tunnel entrance - left side box arch frame
        var tunnelFrameGeom = new THREE.BoxGeometry(8, 12, 2);
        var tunnelMat = new THREE.MeshLambertMaterial({color: 0xf5f5dc});
        var tunnelFrame = new THREE.Mesh(tunnelFrameGeom, tunnelMat);
        tunnelFrame.position.set(-18, 8, -15);
        scene.add(tunnelFrame);
        objects.push(tunnelFrame);

        // Tunnel arch support cylinder
        var archGeom = new THREE.CylinderGeometry(6, 6, 2, 16);
        var archMat = new THREE.MeshLambertMaterial({color: 0xd3d3d3});
        var arch = new THREE.Mesh(archGeom, archMat);
        arch.position.set(-18, 10, -15);
        scene.add(arch);
        objects.push(arch);

        // Tunnel interior LineSegments
        var tunnelPoints = [];
        tunnelPoints.push(new THREE.Vector3(-18, 0, -15));
        tunnelPoints.push(new THREE.Vector3(-18, 10, -15));
        tunnelPoints.push(new THREE.Vector3(-18, 12, -15));
        tunnelPoints.push(new THREE.Vector3(-18, 0, -15));
        var tunnelGeom = new THREE.BufferGeometry().setFromPoints(tunnelPoints);
        var tunnelLine = new THREE.LineSegments(tunnelGeom, new THREE.LineBasicMaterial({color: 0x333333}));
        scene.add(tunnelLine);
        objects.push(tunnelLine);

        // Ammo crate depot - stack of boxes
        var crateGeom = new THREE.BoxGeometry(4, 3, 4);
        var crateMat1 = new THREE.MeshLambertMaterial({color: 0x556b2f});
        var crate1 = new THREE.Mesh(crateGeom, crateMat1);
        crate1.position.set(15, 3, 10);
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(crateGeom, crateMat1);
        crate2.position.set(15, 7, 10);
        scene.add(crate2);
        objects.push(crate2);

        var crateMat2 = new THREE.MeshLambertMaterial({color: 0x6b4423});
        var crate3 = new THREE.Mesh(crateGeom, crateMat2);
        crate3.position.set(20, 3, 12);
        scene.add(crate3);
        objects.push(crate3);

        var crate4 = new THREE.Mesh(crateGeom, crateMat2);
        crate4.position.set(20, 7, 12);
        scene.add(crate4);
        objects.push(crate4);

        // Fuel tank farm - cylinder tanks
        var tankGeom = new THREE.CylinderGeometry(3, 3, 8, 16);
        var tankMat = new THREE.MeshLambertMaterial({color: 0xff6347});
        var tank1 = new THREE.Mesh(tankGeom, tankMat);
        tank1.position.set(-15, 5, 8);
        scene.add(tank1);
        objects.push(tank1);

        var tank2 = new THREE.Mesh(tankGeom, tankMat);
        tank2.position.set(-8, 5, 8);
        scene.add(tank2);
        objects.push(tank2);

        var tank3 = new THREE.Mesh(tankGeom, tankMat);
        tank3.position.set(-1, 5, 8);
        scene.add(tank3);
        objects.push(tank3);

        // Camouflage net support poles - cylinders
        var poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        var poleMat = new THREE.MeshLambertMaterial({color: 0x696969});
        var pole1 = new THREE.Mesh(poleGeom, poleMat);
        pole1.position.set(-20, 7, 5);
        scene.add(pole1);
        objects.push(pole1);

        var pole2 = new THREE.Mesh(poleGeom, poleMat);
        pole2.position.set(20, 7, 5);
        scene.add(pole2);
        objects.push(pole2);

        // Camouflage net grid - LineSegments over box structure
        var netPoints = [];
        netPoints.push(new THREE.Vector3(-20, 13, 5));
        netPoints.push(new THREE.Vector3(20, 13, 5));
        netPoints.push(new THREE.Vector3(20, 13, -5));
        netPoints.push(new THREE.Vector3(-20, 13, -5));
        netPoints.push(new THREE.Vector3(-20, 13, 5));
        var netGeom = new THREE.BufferGeometry().setFromPoints(netPoints);
        var netLine = new THREE.LineSegments(netGeom, new THREE.LineBasicMaterial({color: 0x228b22}));
        scene.add(netLine);
        objects.push(netLine);

        // Aerial resupply winch post - cylinder pole
        var winchPoleGeom = new THREE.CylinderGeometry(1, 1, 15, 8);
        var winchPoleMat = new THREE.MeshLambertMaterial({color: 0x2f4f4f});
        var winchPole = new THREE.Mesh(winchPoleGeom, winchPoleMat);
        winchPole.position.set(25, 8, -8);
        scene.add(winchPole);
        objects.push(winchPole);

        // Pulley - sphere at top
        var pulleyGeom = new THREE.SphereGeometry(1.2, 8, 8);
        var pulleyMat = new THREE.MeshLambertMaterial({color: 0xa9a9a9});
        var pulley = new THREE.Mesh(pulleyGeom, pulleyMat);
        pulley.position.set(25, 16, -8);
        scene.add(pulley);
        objects.push(pulley);

        // Cable LineSegments from pulley
        var cablePoints = [];
        cablePoints.push(new THREE.Vector3(25, 16, -8));
        cablePoints.push(new THREE.Vector3(0, 3, 0));
        cablePoints.push(new THREE.Vector3(-10, 2, 5));
        var cableGeom = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableLine = new THREE.LineSegments(cableGeom, new THREE.LineBasicMaterial({color: 0x8b8b7a}));
        scene.add(cableLine);
        objects.push(cableLine);

        // Anti-tank ditch - box trench crossing dock entrance
        var ditchGeom = new THREE.BoxGeometry(35, 3, 6);
        var ditchMat = new THREE.MeshLambertMaterial({color: 0x8b7355});
        var ditch = new THREE.Mesh(ditchGeom, ditchMat);
        ditch.position.set(0, 0, 20);
        scene.add(ditch);
        objects.push(ditch);

        // Ditch defensive spikes - cones
        var spikeGeom = new THREE.ConeGeometry(0.5, 2, 4);
        var spikeMat = new THREE.MeshLambertMaterial({color: 0x000000});
        var spike1 = new THREE.Mesh(spikeGeom, spikeMat);
        spike1.position.set(-10, 2, 20);
        scene.add(spike1);
        objects.push(spike1);

        var spike2 = new THREE.Mesh(spikeGeom, spikeMat);
        spike2.position.set(0, 2, 20);
        scene.add(spike2);
        objects.push(spike2);

        var spike3 = new THREE.Mesh(spikeGeom, spikeMat);
        spike3.position.set(10, 2, 20);
        scene.add(spike3);
        objects.push(spike3);

        // Additional support box structure under dock
        var supportGeom = new THREE.BoxGeometry(35, 1, 20);
        var supportMat = new THREE.MeshLambertMaterial({color: 0xa0826d});
        var support = new THREE.Mesh(supportGeom, supportMat);
        support.position.set(0, 0.5, 0);
        scene.add(support);
        objects.push(support);

        // Directional light for dock
        var dockLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dockLight.position.set(20, 25, 15);
        scene.add(dockLight);
        lights.push(dockLight);

        // Ambient light for overall illumination
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        // Animate pulley rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry &&
                objects[i].position.x === 25) {
                objects[i].rotation.y += delta * 0.5;
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
