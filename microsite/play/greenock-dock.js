window.GreenockDock = (function() {
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
        // James Watt Dock - dry dock basin (box)
        var dryDockGeom = new THREE.BoxGeometry(40, 8, 20);
        var dryDockMat = new THREE.MeshLambertMaterial({ color: 0x4a6fa5 });
        var dryDock = new THREE.Mesh(dryDockGeom, dryDockMat);
        dryDock.position.set(-25, 0, -20);
        scene.add(dryDock);
        objects.push(dryDock);

        // James Watt Dock - harbor crane (cylinder)
        var craneGeom = new THREE.CylinderGeometry(2, 3, 25, 8);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
        var crane = new THREE.Mesh(craneGeom, craneMat);
        crane.position.set(-20, 12, -15);
        scene.add(crane);
        objects.push(crane);

        // James Watt Dock - workshop shed 1 (box)
        var shed1Geom = new THREE.BoxGeometry(15, 10, 12);
        var shedMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var shed1 = new THREE.Mesh(shed1Geom, shedMat);
        shed1.position.set(-10, 5, -5);
        scene.add(shed1);
        objects.push(shed1);

        // James Watt Dock - workshop shed 2 (box)
        var shed2Geom = new THREE.BoxGeometry(15, 10, 12);
        var shed2 = new THREE.Mesh(shed2Geom, shedMat);
        shed2.position.set(5, 5, -8);
        scene.add(shed2);
        objects.push(shed2);

        // Custom House Quay - Georgian custom house (box)
        var customHouseGeom = new THREE.BoxGeometry(18, 12, 14);
        var customHouseMat = new THREE.MeshLambertMaterial({ color: 0xc19a6b });
        var customHouse = new THREE.Mesh(customHouseGeom, customHouseMat);
        customHouse.position.set(15, 6, 10);
        scene.add(customHouse);
        objects.push(customHouse);

        // Custom House Quay - concrete barrier 1 (box)
        var barrierGeom = new THREE.BoxGeometry(8, 2, 1.5);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var barrier1 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier1.position.set(10, 1, 15);
        scene.add(barrier1);
        objects.push(barrier1);

        // Custom House Quay - concrete barrier 2 (box)
        var barrier2 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier2.position.set(25, 1, 12);
        scene.add(barrier2);
        objects.push(barrier2);

        // Custom House Quay - watchtower (cylinder)
        var towerGeom = new THREE.CylinderGeometry(3, 3.5, 18, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(20, 9, 20);
        scene.add(tower);
        objects.push(tower);

        // Tail of the Bank - warship hull section (cylinder)
        var hullGeom = new THREE.CylinderGeometry(5, 5, 30, 12);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x36454f });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.rotation.z = Math.PI / 2;
        hull.position.set(-15, 8, 25);
        scene.add(hull);
        objects.push(hull);

        // Tail of the Bank - mooring buoy 1 (sphere)
        var buoyGeom = new THREE.SphereGeometry(2, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(-5, 3, 30);
        scene.add(buoy1);
        objects.push(buoy1);

        // Tail of the Bank - mooring buoy 2 (sphere)
        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(5, 3, 32);
        scene.add(buoy2);
        objects.push(buoy2);

        // Tail of the Bank - anchor chain (LineSegments)
        var chainGeom = new THREE.BufferGeometry();
        var chainVertices = new Float32Array([
            -5, 3, 30,    0, 0, 35,
            5, 3, 32,     2, 0, 38
        ]);
        chainGeom.setAttribute('position', new THREE.BufferAttribute(chainVertices, 3));
        var chainMat = new THREE.LineBasicMaterial({ color: 0x696969 });
        var chain = new THREE.LineSegments(chainGeom, chainMat);
        scene.add(chain);
        objects.push(chain);

        // Fort Matilda - gun emplacement (box)
        var emplacementGeom = new THREE.BoxGeometry(20, 4, 18);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var emplacement = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement.position.set(-30, 2, 5);
        scene.add(emplacement);
        objects.push(emplacement);

        // Fort Matilda - gun barrel (cylinder)
        var barrelGeom = new THREE.CylinderGeometry(1.2, 1.2, 16, 6);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.z = Math.PI / 3;
        barrel.position.set(-25, 6, 8);
        scene.add(barrel);
        objects.push(barrel);

        // Fort Matilda - magazine (box)
        var magazineGeom = new THREE.BoxGeometry(12, 8, 10);
        var magazineMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var magazine = new THREE.Mesh(magazineGeom, magazineMat);
        magazine.position.set(-35, 4, 12);
        scene.add(magazine);
        objects.push(magazine);

        // McLean Museum - Victorian museum (box)
        var museumGeom = new THREE.BoxGeometry(22, 14, 16);
        var museumMat = new THREE.MeshLambertMaterial({ color: 0xb87333 });
        var museum = new THREE.Mesh(museumGeom, museumMat);
        museum.position.set(0, 7, -25);
        scene.add(museum);
        objects.push(museum);

        // McLean Museum - secure comms room (box)
        var commsGeom = new THREE.BoxGeometry(8, 6, 8);
        var commsMat = new THREE.MeshLambertMaterial({ color: 0x4d4d4d });
        var comms = new THREE.Mesh(commsGeom, commsMat);
        comms.position.set(10, 3, -20);
        scene.add(comms);
        objects.push(comms);

        // McLean Museum - radio mast (cylinder)
        var mastGeom = new THREE.CylinderGeometry(1.5, 1.8, 22, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0xa9a9a9 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(5, 11, -15);
        scene.add(mast);
        objects.push(mast);

        // Greenock Cut - stone aqueduct (box)
        var aqueductGeom = new THREE.BoxGeometry(35, 3, 4);
        var aqueductMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var aqueduct = new THREE.Mesh(aqueductGeom, aqueductMat);
        aqueduct.position.set(-5, 8, -30);
        scene.add(aqueduct);
        objects.push(aqueduct);

        // Greenock Cut - clifftop OP (box)
        var opGeom = new THREE.BoxGeometry(10, 6, 10);
        var opMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var op = new THREE.Mesh(opGeom, opMat);
        op.position.set(20, 5, -32);
        scene.add(op);
        objects.push(op);

        // Greenock Cut - IED charge 1 (sphere)
        var iedGeom = new THREE.SphereGeometry(1.5, 6, 6);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0xb22222 });
        var ied1 = new THREE.Mesh(iedGeom, iedMat);
        ied1.position.set(-15, 10, -28);
        scene.add(ied1);
        objects.push(ied1);

        // Greenock Cut - IED charge 2 (sphere)
        var ied2 = new THREE.Mesh(iedGeom, iedMat);
        ied2.position.set(10, 10, -35);
        scene.add(ied2);
        objects.push(ied2);

        // Lyle Hill - stone monument (box)
        var monumentGeom = new THREE.BoxGeometry(6, 16, 6);
        var monumentMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var monument = new THREE.Mesh(monumentGeom, monumentMat);
        monument.position.set(28, 8, -5);
        scene.add(monument);
        objects.push(monument);

        // Lyle Hill - signal mast (cylinder)
        var signalGeom = new THREE.CylinderGeometry(1, 1.2, 20, 6);
        var signalMat = new THREE.MeshLambertMaterial({ color: 0xb0c4de });
        var signal = new THREE.Mesh(signalGeom, signalMat);
        signal.position.set(32, 10, 2);
        scene.add(signal);
        objects.push(signal);

        // Lyle Hill - radome (sphere)
        var radomeGeom = new THREE.SphereGeometry(3, 8, 8);
        var radiusMat = new THREE.MeshLambertMaterial({ color: 0xfffacd });
        var radome = new THREE.Mesh(radomeGeom, radiusMat);
        radome.position.set(32, 18, 2);
        scene.add(radome);
        objects.push(radome);

        // River Clyde - underwater mine 1 (sphere)
        var mineGeom = new THREE.SphereGeometry(2, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x2f4f2f });
        var mine1 = new THREE.Mesh(mineGeom, mineMat);
        mine1.position.set(-20, 2, 15);
        scene.add(mine1);
        objects.push(mine1);

        // River Clyde - underwater mine 2 (sphere)
        var mine2 = new THREE.Mesh(mineGeom, mineMat);
        mine2.position.set(-8, 2, 20);
        scene.add(mine2);
        objects.push(mine2);

        // River Clyde - net barrier (LineSegments)
        var netGeom = new THREE.BufferGeometry();
        var netVertices = new Float32Array([
            -25, 1, 10,   -5, 1, 22,
            -22, 1, 8,    -2, 1, 20
        ]);
        netGeom.setAttribute('position', new THREE.BufferAttribute(netVertices, 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x556b2f });
        var net = new THREE.LineSegments(netGeom, netMat);
        scene.add(net);
        objects.push(net);

        // River Clyde - clifftop detonation post (box)
        var detGeom = new THREE.BoxGeometry(8, 5, 8);
        var detMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var det = new THREE.Mesh(detGeom, detMat);
        det.position.set(-30, 4, 22);
        scene.add(det);
        objects.push(det);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.0001;
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
