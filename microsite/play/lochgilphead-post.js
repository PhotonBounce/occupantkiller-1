window.LochgilpheadPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Lochgilphead town garrison - concrete barriers
        var barrierGeom1 = new THREE.BoxGeometry(8, 2, 1.5);
        var barrierMat1 = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var barrier1 = new THREE.Mesh(barrierGeom1, barrierMat1);
        barrier1.position.set(-25, 1, -20);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrierGeom2 = new THREE.BoxGeometry(8, 2, 1.5);
        var barrierMat2 = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var barrier2 = new THREE.Mesh(barrierGeom2, barrierMat2);
        barrier2.position.set(-15, 1, -18);
        barrier2.rotation.y = Math.PI / 4;
        scene.add(barrier2);
        objects.push(barrier2);

        // Watchtower - cylinder
        var towerGeom = new THREE.CylinderGeometry(3, 3.5, 12, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-20, 6, -5);
        scene.add(tower);
        objects.push(tower);

        // Sandbag position - stacked boxes
        var sandbagGeom = new THREE.BoxGeometry(4, 1.2, 4);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xa0a080 });
        var sandbag1 = new THREE.Mesh(sandbagGeom, sandbagMat);
        sandbag1.position.set(-8, 0.6, -15);
        scene.add(sandbag1);
        objects.push(sandbag1);

        var sandbag2 = new THREE.Mesh(sandbagGeom, sandbagMat);
        sandbag2.position.set(-8, 1.8, -15);
        scene.add(sandbag2);
        objects.push(sandbag2);

        // Argyll & Bute Council HQ - modern office block
        var officeGeom = new THREE.BoxGeometry(10, 15, 8);
        var officeMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        var office = new THREE.Mesh(officeGeom, officeMat);
        office.position.set(5, 7.5, 10);
        scene.add(office);
        objects.push(office);

        // Secure annexe
        var annexeGeom = new THREE.BoxGeometry(6, 8, 6);
        var annexeMat = new THREE.MeshLambertMaterial({ color: 0x909090 });
        var annexe = new THREE.Mesh(annexeGeom, annexeMat);
        annexe.position.set(15, 4, 8);
        scene.add(annexe);
        objects.push(annexe);

        // Communications mast
        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 18, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(12, 9, 15);
        scene.add(mast);
        objects.push(mast);

        // Crinan Canal - lock keeper's cottage
        var cottageGeom = new THREE.BoxGeometry(6, 6, 7);
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0xcc8844 });
        var cottage = new THREE.Mesh(cottageGeom, cottageMat);
        cottage.position.set(25, 3, 0);
        scene.add(cottage);
        objects.push(cottage);

        // Lock mechanism - cylinder
        var lockGeom = new THREE.CylinderGeometry(2, 2.5, 4, 10);
        var lockMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var lock = new THREE.Mesh(lockGeom, lockMat);
        lock.position.set(28, 2, -8);
        scene.add(lock);
        objects.push(lock);

        // Footbridge - box
        var bridgeGeom = new THREE.BoxGeometry(8, 1, 3);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(30, 2.5, 5);
        scene.add(bridge);
        objects.push(bridge);

        // Kilmory Castle - Gothic Victorian mansion
        var castleGeom = new THREE.BoxGeometry(12, 14, 10);
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x704020 });
        var castle = new THREE.Mesh(castleGeom, castleMat);
        castle.position.set(-30, 7, 20);
        scene.add(castle);
        objects.push(castle);

        // Stable courtyard
        var stableGeom = new THREE.BoxGeometry(10, 5, 8);
        var stableMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
        var stable = new THREE.Mesh(stableGeom, stableMat);
        stable.position.set(-20, 2.5, 28);
        scene.add(stable);
        objects.push(stable);

        // Castle turret - cone
        var turretGeom = new THREE.ConeGeometry(3, 8, 8);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x5a3020 });
        var turret = new THREE.Mesh(turretGeom, turretMat);
        turret.position.set(-32, 11, 25);
        scene.add(turret);
        objects.push(turret);

        // Mòine Mhòr nature reserve - raised bog track
        var trackGeom = new THREE.BoxGeometry(15, 0.8, 3);
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x6b5d4f });
        var track = new THREE.Mesh(trackGeom, trackMat);
        track.position.set(5, 0.4, 25);
        scene.add(track);
        objects.push(track);

        // IED charges - spheres
        var iedGeom1 = new THREE.SphereGeometry(0.6, 8, 8);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var ied1 = new THREE.Mesh(iedGeom1, iedMat);
        ied1.position.set(8, 0.8, 22);
        scene.add(ied1);
        objects.push(ied1);

        var iedGeom2 = new THREE.SphereGeometry(0.6, 8, 8);
        var ied2 = new THREE.Mesh(iedGeom2, iedMat);
        ied2.position.set(12, 0.9, 28);
        scene.add(ied2);
        objects.push(ied2);

        // Tripwire - LineSegments
        var wireGeom = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            10, 1.2, 20,
            14, 1.2, 26
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Loch Crinan shore battery - clifftop emplacement
        var emplacementGeom = new THREE.BoxGeometry(14, 2, 5);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var emplacement = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement.position.set(-10, 1, -28);
        scene.add(emplacement);
        objects.push(emplacement);

        // Gun barrel - cylinder
        var barrelGeom = new THREE.CylinderGeometry(0.5, 0.6, 10, 6);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(-8, 3, -30);
        barrel.rotation.z = Math.PI / 6;
        scene.add(barrel);
        objects.push(barrel);

        // Magazine - box
        var magGeom = new THREE.BoxGeometry(5, 4, 6);
        var magMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var magazine = new THREE.Mesh(magGeom, magMat);
        magazine.position.set(-15, 2, -32);
        scene.add(magazine);
        objects.push(magazine);

        // Dunadd fort - Iron Age hillfort
        var fortGeom = new THREE.BoxGeometry(16, 1.5, 14);
        var fortMat = new THREE.MeshLambertMaterial({ color: 0x8b8680 });
        var fort = new THREE.Mesh(fortGeom, fortMat);
        fort.position.set(15, 0.75, -10);
        scene.add(fort);
        objects.push(fort);

        // Signal mast
        var signalGeom = new THREE.CylinderGeometry(0.6, 0.6, 16, 5);
        var signalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var signalMast = new THREE.Mesh(signalGeom, signalMat);
        signalMast.position.set(18, 8, -8);
        scene.add(signalMast);
        objects.push(signalMast);

        // Radome - sphere
        var radomeGeom = new THREE.SphereGeometry(2, 10, 10);
        var radiMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var radome = new THREE.Mesh(radomeGeom, radiMat);
        radome.position.set(18, 15, -8);
        scene.add(radome);
        objects.push(radome);

        // Ardrishaig ferry dock - pier
        var pierGeom = new THREE.BoxGeometry(12, 1.2, 4);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x8b7765 });
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(-5, 0.6, -5);
        scene.add(pier);
        objects.push(pier);

        // Dock crane - cylinder
        var craneGeom = new THREE.CylinderGeometry(1, 1.2, 14, 8);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var crane = new THREE.Mesh(craneGeom, craneMat);
        crane.position.set(0, 7, -8);
        scene.add(crane);
        objects.push(crane);

        // Buoys - spheres
        var buoyGeom = new THREE.SphereGeometry(0.8, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(-8, 0.8, 2);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(5, 0.8, 0);
        scene.add(buoy2);
        objects.push(buoy2);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 25, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects if needed
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
