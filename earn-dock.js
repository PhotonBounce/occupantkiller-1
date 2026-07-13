window.EarnDock = (function() {
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
        // Shoreline dock platform - main wooden deck
        var dockGeom = new THREE.BoxGeometry(40, 2, 15);
        var dockMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var dock = new THREE.Mesh(dockGeom, dockMat);
        dock.position.set(0, 0, 10);
        scene.add(dock);
        objects.push(dock);

        // Command post box building
        var commandGeom = new THREE.BoxGeometry(15, 12, 12);
        var commandMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var command = new THREE.Mesh(commandGeom, commandMat);
        command.position.set(-20, 6, 15);
        scene.add(command);
        objects.push(command);

        // Command post mast
        var mastGeom = new THREE.CylinderGeometry(1, 1, 20, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-20, 16, 15);
        scene.add(mast);
        objects.push(mast);

        // Gunboat hull - main box
        var hullGeom = new THREE.BoxGeometry(12, 3, 8);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(8, 1.5, 5);
        scene.add(hull);
        objects.push(hull);

        // Gunboat stern cylinder
        var sternGeom = new THREE.CylinderGeometry(2, 2, 6, 8);
        var sternMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var stern = new THREE.Mesh(sternGeom, sternMat);
        stern.position.set(14, 2, 5);
        scene.add(stern);
        objects.push(stern);

        // Gunboat gun mount
        var gunGeom = new THREE.BoxGeometry(2, 4, 2);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var gun = new THREE.Mesh(gunGeom, gunMat);
        gun.position.set(8, 5, 5);
        scene.add(gun);
        objects.push(gun);

        // Jetski 1 - small hull
        var jetski1Geom = new THREE.BoxGeometry(2, 1, 4);
        var jetMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var jetski1 = new THREE.Mesh(jetski1Geom, jetMat);
        jetski1.position.set(20, 0.5, 0);
        scene.add(jetski1);
        objects.push(jetski1);

        // Jetski 2
        var jetski2Geom = new THREE.BoxGeometry(2, 1, 4);
        var jetski2 = new THREE.Mesh(jetski2Geom, jetMat);
        jetski2.position.set(20, 0.5, -8);
        scene.add(jetski2);
        objects.push(jetski2);

        // Jetski 3
        var jetski3Geom = new THREE.BoxGeometry(2, 1, 4);
        var jetski3 = new THREE.Mesh(jetski3Geom, jetMat);
        jetski3.position.set(20, 0.5, 8);
        scene.add(jetski3);
        objects.push(jetski3);

        // Underwater IED deployment raft platform
        var raftGeom = new THREE.BoxGeometry(6, 1, 6);
        var raftMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var raft = new THREE.Mesh(raftGeom, raftMat);
        raft.position.set(-15, -2, -10);
        scene.add(raft);
        objects.push(raft);

        // IED charge sphere 1
        var charge1Geom = new THREE.SphereGeometry(1.5, 8, 8);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var charge1 = new THREE.Mesh(charge1Geom, chargeMat);
        charge1.position.set(-17, -3, -10);
        scene.add(charge1);
        objects.push(charge1);

        // IED charge sphere 2
        var charge2Geom = new THREE.SphereGeometry(1.5, 8, 8);
        var charge2 = new THREE.Mesh(charge2Geom, chargeMat);
        charge2.position.set(-13, -3, -10);
        scene.add(charge2);
        objects.push(charge2);

        // IED detonator wires
        var wireGeom = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -15, -1, -10,
            -15, -5, -10
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 2 });
        var wires = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wires);
        objects.push(wires);

        // Lochside hotel building
        var hotelGeom = new THREE.BoxGeometry(20, 18, 16);
        var hotelMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var hotel = new THREE.Mesh(hotelGeom, hotelMat);
        hotel.position.set(25, 9, 25);
        scene.add(hotel);
        objects.push(hotel);

        // Sniper nest window slit 1
        var slitGeom = new THREE.BoxGeometry(1, 2, 0.5);
        var slitMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var slit1 = new THREE.Mesh(slitGeom, slitMat);
        slit1.position.set(25, 14, 32);
        scene.add(slit1);
        objects.push(slit1);

        // Sniper nest window slit 2
        var slit2Geom = new THREE.BoxGeometry(1, 2, 0.5);
        var slit2 = new THREE.Mesh(slit2Geom, slitMat);
        slit2.position.set(35, 14, 32);
        scene.add(slit2);
        objects.push(slit2);

        // Cliff-side bunker box structure
        var bunkerGeom = new THREE.BoxGeometry(18, 8, 14);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(-30, 4, -20);
        scene.add(bunker);
        objects.push(bunker);

        // Bunker gun emplacement cone
        var emplacementGeom = new THREE.ConeGeometry(3, 4, 8);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var emplacement = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement.position.set(-30, 8, -20);
        scene.add(emplacement);
        objects.push(emplacement);

        // Underwater cable sabotage control hut
        var hutGeom = new THREE.BoxGeometry(8, 6, 8);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(-8, 3, -28);
        scene.add(hut);
        objects.push(hut);

        // Cable sabotage control center cylinder
        var controlGeom = new THREE.CylinderGeometry(0.8, 0.8, 5, 6);
        var controlMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var control = new THREE.Mesh(controlGeom, controlMat);
        control.position.set(-8, 8, -28);
        scene.add(control);
        objects.push(control);

        // Cable from hut to loch center
        var cableGeom = new THREE.BufferGeometry();
        var cablePos = new Float32Array([
            -8, 0, -28,
            0, -10, 0
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePos, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x00FF00, linewidth: 3 });
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Ambient light
        var ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        // Directional light for shadows
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 30, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation loop can rotate/move objects if needed
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
