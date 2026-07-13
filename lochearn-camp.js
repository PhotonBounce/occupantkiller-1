window.LochEarnCamp = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    function init(sceneRef, cameraRef) {
        scene = sceneRef; camera = cameraRef;
        objects = []; lights = [];
        buildCamp();
    }
    function buildCamp() {
        // Loch Earn lakeshore terrain
        var lakeGeom = new THREE.BoxGeometry(80, 2, 60);
        var lakeMat = new THREE.MeshLambertMaterial({ color: 0x1a5c7a });
        var lake = new THREE.Mesh(lakeGeom, lakeMat);
        lake.position.set(0, -1, 0);
        scene.add(lake);
        objects.push(lake);

        // St Fillans pier - stone pier base
        var pierGeom = new THREE.BoxGeometry(20, 1.5, 8);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x6b5b45 });
        var pier = new THREE.Mesh(pierGeom, pierMat);
        pier.position.set(-25, 0, -15);
        scene.add(pier);
        objects.push(pier);

        // Patrol boat hull
        var boatGeom = new THREE.CylinderGeometry(3, 3, 12, 8);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        var boat = new THREE.Mesh(boatGeom, boatMat);
        boat.position.set(-25, 2, -15);
        scene.add(boat);
        objects.push(boat);

        // Control shed
        var shedGeom = new THREE.BoxGeometry(6, 5, 5);
        var shedMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var shed = new THREE.Mesh(shedGeom, shedMat);
        shed.position.set(-25, 2.5, -5);
        scene.add(shed);
        objects.push(shed);

        // Ardvorlich House - stone manor
        var manorGeom = new THREE.BoxGeometry(15, 8, 12);
        var manorMat = new THREE.MeshLambertMaterial({ color: 0x7a6d5d });
        var manor = new THREE.Mesh(manorGeom, manorMat);
        manor.position.set(-10, 4, 15);
        scene.add(manor);
        objects.push(manor);

        // Stable yard
        var stableGeom = new THREE.BoxGeometry(10, 4, 10);
        var stableMat = new THREE.MeshLambertMaterial({ color: 0x9b8b7b });
        var stable = new THREE.Mesh(stableGeom, stableMat);
        stable.position.set(-5, 2, 28);
        scene.add(stable);
        objects.push(stable);

        // Water tower
        var towerGeom = new THREE.CylinderGeometry(2.5, 3, 10, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(5, 5, 20);
        scene.add(tower);
        objects.push(tower);

        // Ben Vorlich OP - stone shelter
        var shelterGeom = new THREE.BoxGeometry(8, 3, 8);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x706060 });
        var shelter = new THREE.Mesh(shelterGeom, shelterMat);
        shelter.position.set(20, 15, 25);
        scene.add(shelter);
        objects.push(shelter);

        // Signal mast
        var mastGeom = new THREE.CylinderGeometry(0.5, 0.6, 12, 6);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(20, 21, 25);
        scene.add(mast);
        objects.push(mast);

        // Radome
        var radomeGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var radiaMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var radome = new THREE.Mesh(radomeGeom, radiaMat);
        radome.position.set(20, 28, 25);
        scene.add(radome);
        objects.push(radome);

        // Lochearnhead checkpoint - concrete barriers
        var barrierGeom = new THREE.BoxGeometry(3, 2, 1.5);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var barrier1 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier1.position.set(15, 1, -20);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2 = new THREE.Mesh(barrierGeom, barrierMat);
        barrier2.position.set(20, 1, -20);
        scene.add(barrier2);
        objects.push(barrier2);

        // Guard post
        var guardGeom = new THREE.BoxGeometry(5, 6, 5);
        var guardMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
        var guard = new THREE.Mesh(guardGeom, guardMat);
        guard.position.set(25, 3, -18);
        scene.add(guard);
        objects.push(guard);

        // Watch tower
        var watchGeom = new THREE.CylinderGeometry(2, 2.5, 9, 8);
        var watchMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var watch = new THREE.Mesh(watchGeom, watchMat);
        watch.position.set(30, 4.5, -15);
        scene.add(watch);
        objects.push(watch);

        // Edinample Castle - ruined keep
        var keepGeom = new THREE.BoxGeometry(12, 10, 12);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x5c4a3d });
        var keep = new THREE.Mesh(keepGeom, keepMat);
        keep.position.set(-20, 5, -5);
        scene.add(keep);
        objects.push(keep);

        // Courtyard
        var courtGeom = new THREE.BoxGeometry(18, 0.5, 18);
        var courtMat = new THREE.MeshLambertMaterial({ color: 0x7d6b5d });
        var court = new THREE.Mesh(courtGeom, courtMat);
        court.position.set(-20, 0.25, -5);
        scene.add(court);
        objects.push(court);

        // Turret caps
        var turretGeom = new THREE.ConeGeometry(2, 3, 8);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var turret1 = new THREE.Mesh(turretGeom, turretMat);
        turret1.position.set(-14, 11, 2);
        scene.add(turret1);
        objects.push(turret1);

        var turret2 = new THREE.Mesh(turretGeom, turretMat);
        turret2.position.set(-26, 11, 2);
        scene.add(turret2);
        objects.push(turret2);

        // Gleann an Dubh Choirein - rocky ravine walls
        var ravineWallGeom = new THREE.BoxGeometry(8, 6, 3);
        var ravineMat = new THREE.MeshLambertMaterial({ color: 0x4d4230 });
        var ravineWall1 = new THREE.Mesh(ravineWallGeom, ravineMat);
        ravineWall1.position.set(-15, 3, 10);
        scene.add(ravineWall1);
        objects.push(ravineWall1);

        var ravineWall2 = new THREE.Mesh(ravineWallGeom, ravineMat);
        ravineWall2.position.set(-8, 3, 10);
        scene.add(ravineWall2);
        objects.push(ravineWall2);

        // IED charges
        var iedGeom = new THREE.SphereGeometry(1.2, 6, 6);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x331100 });
        var ied1 = new THREE.Mesh(iedGeom, iedMat);
        ied1.position.set(-15, 2, 12);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeom, iedMat);
        ied2.position.set(-8, 2, 12);
        scene.add(ied2);
        objects.push(ied2);

        // Tripwire
        var wireGeom = new THREE.BufferGeometry();
        var wirePos = new Float32Array([
            -15, 1, 10,
            -8, 1, 10
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var tripwire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(tripwire);
        objects.push(tripwire);

        // Dundurn Hill fort - Iron Age ramparts
        var rampartGeom = new THREE.BoxGeometry(25, 3, 3);
        var rampartMat = new THREE.MeshLambertMaterial({ color: 0x6d5c4d });
        var rampart1 = new THREE.Mesh(rampartGeom, rampartMat);
        rampart1.position.set(10, 1.5, 5);
        scene.add(rampart1);
        objects.push(rampart1);

        var rampart2 = new THREE.Mesh(rampartGeom, rampartMat);
        rampart2.position.set(10, 1.5, 8);
        scene.add(rampart2);
        objects.push(rampart2);

        // Stone enclosure
        var enclosureGeom = new THREE.BoxGeometry(20, 2.5, 20);
        var enclosureMat = new THREE.MeshLambertMaterial({ color: 0x8b7d6b });
        var enclosure = new THREE.Mesh(enclosureGeom, enclosureMat);
        enclosure.position.set(10, 1.25, 0);
        scene.add(enclosure);
        objects.push(enclosure);

        // Perimeter wire
        var perimGeom = new THREE.BufferGeometry();
        var perimPos = new Float32Array([
            0, 3, -10,
            20, 3, -10,
            20, 3, 10,
            0, 3, 10,
            0, 3, -10
        ]);
        perimGeom.setAttribute('position', new THREE.BufferAttribute(perimPos, 3));
        var perimMat = new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 1 });
        var perimWire = new THREE.LineSegments(perimGeom, perimMat);
        scene.add(perimWire);
        objects.push(perimWire);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }
    function update(delta) {
        // Patrol boat rotation
        if (objects.length > 1) {
            objects[2].rotation.y += 0.01;
        }
        // Signal mast sway
        if (objects.length > 8) {
            objects[8].rotation.z = Math.sin(Date.now() * 0.001) * 0.02;
        }
    }
    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
        objects = []; lights = []; scene = null; camera = null;
    }
    return { init: init, update: update, reset: reset };
}());
