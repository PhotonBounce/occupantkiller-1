window.GilpBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        // Loch Gilp terrain - shallow tidal box
        var terrainGeom = new THREE.BoxGeometry(80, 3, 60);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x4a7c7e });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -2, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Lochgilphead police station HQ main building - box
        var stationGeom = new THREE.BoxGeometry(20, 12, 16);
        var stationMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var station = new THREE.Mesh(stationGeom, stationMat);
        station.position.set(-25, 6, 10);
        scene.add(station);
        objects.push(station);

        // Blue lamp post - cylinder
        var lampGeom = new THREE.CylinderGeometry(1.2, 1.2, 8, 16);
        var lampMat = new THREE.MeshLambertMaterial({ color: 0x0066cc });
        var lamp = new THREE.Mesh(lampGeom, lampMat);
        lamp.position.set(-20, 4, 15);
        scene.add(lamp);
        objects.push(lamp);

        // Crinan canal lock gate - box
        var lockGeom = new THREE.BoxGeometry(12, 10, 3);
        var lockMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var lock = new THREE.Mesh(lockGeom, lockMat);
        lock.position.set(15, 5, -15);
        scene.add(lock);
        objects.push(lock);

        // Bollards flanking lock - cylinder pair
        var bollardGeom = new THREE.CylinderGeometry(0.8, 0.8, 3, 12);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var bollard1 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard1.position.set(10, 1.5, -12);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2 = new THREE.Mesh(bollardGeom, bollardMat);
        bollard2.position.set(20, 1.5, -12);
        scene.add(bollard2);
        objects.push(bollard2);

        // Canal gunboat hull - box
        var hullGeom = new THREE.BoxGeometry(14, 3, 4);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(18, 1.5, -8);
        scene.add(hull);
        objects.push(hull);

        // Gunboat superstructure - box
        var superGeom = new THREE.BoxGeometry(8, 4, 3);
        var superMat = new THREE.MeshLambertMaterial({ color: 0x1a3d0a });
        var super1 = new THREE.Mesh(superGeom, superMat);
        super1.position.set(18, 4, -8);
        scene.add(super1);
        objects.push(super1);

        // Gun turret - cylinder
        var gunGeom = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var gun = new THREE.Mesh(gunGeom, gunMat);
        gun.position.set(18, 6, -8);
        scene.add(gun);
        objects.push(gun);

        // Kilmartin glen iron age dun - box base on hill
        var dunGeom = new THREE.BoxGeometry(16, 2, 16);
        var dunMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var dun = new THREE.Mesh(dunGeom, dunMat);
        dun.position.set(-30, 10, -25);
        scene.add(dun);
        objects.push(dun);

        // Rampart stones - sphere cluster
        var rampGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var rampMat = new THREE.MeshLambertMaterial({ color: 0x6b5b47 });
        var ramp1 = new THREE.Mesh(rampGeom, rampMat);
        ramp1.position.set(-38, 11, -25);
        scene.add(ramp1);
        objects.push(ramp1);

        var ramp2 = new THREE.Mesh(rampGeom, rampMat);
        ramp2.position.set(-22, 11, -25);
        scene.add(ramp2);
        objects.push(ramp2);

        var ramp3 = new THREE.Mesh(rampGeom, rampMat);
        ramp3.position.set(-30, 11, -33);
        scene.add(ramp3);
        objects.push(ramp3);

        // Motor torpedo boat pen - box concrete
        var penGeom = new THREE.BoxGeometry(18, 8, 12);
        var penMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var pen = new THREE.Mesh(penGeom, penMat);
        pen.position.set(25, 4, 20);
        scene.add(pen);
        objects.push(pen);

        // Boat hull inside pen - cylinder
        var boatGeom = new THREE.CylinderGeometry(2.5, 2.5, 10, 12);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var boat = new THREE.Mesh(boatGeom, boatMat);
        boat.position.set(25, 3, 20);
        scene.add(boat);
        objects.push(boat);

        // Anti-glider landing pole field - cylinder grid
        var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 6, 8);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
        for (var px = -20; px <= 0; px += 6) {
            for (var pz = 10; pz <= 22; pz += 6) {
                var pole = new THREE.Mesh(poleGeom, poleMat);
                pole.position.set(px, 3, pz);
                scene.add(pole);
                objects.push(pole);
            }
        }

        // Emergency airstrip runway end markers - cones
        var coneGeom = new THREE.ConeGeometry(2, 4, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var cone1 = new THREE.Mesh(coneGeom, coneMat);
        cone1.position.set(-15, 2, -20);
        scene.add(cone1);
        objects.push(cone1);

        var cone2 = new THREE.Mesh(coneGeom, coneMat);
        cone2.position.set(5, 2, -20);
        scene.add(cone2);
        objects.push(cone2);

        // Runway centreline - LineSegments
        var lineGeom = new THREE.BufferGeometry();
        var positions = new Float32Array([
            -15, 0.5, -20,
            5, 0.5, -20
        ]);
        lineGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        var lineMat = new THREE.LineBasicMaterial({ color: 0xffffcc, linewidth: 2 });
        var centreline = new THREE.LineSegments(lineGeom, lineMat);
        scene.add(centreline);
        objects.push(centreline);

        // Lights
        var ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation logic can be added here if needed
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
