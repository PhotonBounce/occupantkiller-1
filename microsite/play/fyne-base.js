window.FyneBase = (function() {
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
        // Deep loch box terrain
        var terrainGeom = new THREE.BoxGeometry(80, 12, 100);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x1a3a3a });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -10, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Inveraray castle command HQ - main keep
        var keepGeom = new THREE.BoxGeometry(16, 20, 16);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var keep = new THREE.Mesh(keepGeom, keepMat);
        keep.position.set(-25, 5, 15);
        scene.add(keep);
        objects.push(keep);

        // Castle round tower 1
        var tower1Geom = new THREE.CylinderGeometry(6, 6, 18, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
        var tower1 = new THREE.Mesh(tower1Geom, towerMat);
        tower1.position.set(-15, 4, 8);
        scene.add(tower1);
        objects.push(tower1);

        // Castle round tower 2
        var tower2 = new THREE.Mesh(tower1Geom, towerMat);
        tower2.position.set(-35, 4, 8);
        scene.add(tower2);
        objects.push(tower2);

        // Castle round tower 3
        var tower3 = new THREE.Mesh(tower1Geom, towerMat);
        tower3.position.set(-25, 4, 28);
        scene.add(tower3);
        objects.push(tower3);

        // Oyster farm pontoon 1
        var pontoon1Geom = new THREE.BoxGeometry(12, 3, 8);
        var pontoonMat = new THREE.MeshLambertMaterial({ color: 0x3a5a6a });
        var pontoon1 = new THREE.Mesh(pontoon1Geom, pontoonMat);
        pontoon1.position.set(20, 1, -10);
        scene.add(pontoon1);
        objects.push(pontoon1);

        // Mine sphere on pontoon 1
        var mineSphereGeom = new THREE.SphereGeometry(2, 12, 12);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var mine1 = new THREE.Mesh(mineSphereGeom, mineMat);
        mine1.position.set(20, 4, -10);
        scene.add(mine1);
        objects.push(mine1);

        // Oyster farm pontoon 2
        var pontoon2 = new THREE.Mesh(pontoon1Geom, pontoonMat);
        pontoon2.position.set(20, 1, 0);
        scene.add(pontoon2);
        objects.push(pontoon2);

        // Mine sphere on pontoon 2
        var mine2 = new THREE.Mesh(mineSphereGeom, mineMat);
        mine2.position.set(20, 4, 0);
        scene.add(mine2);
        objects.push(mine2);

        // Oyster farm pontoon 3
        var pontoon3 = new THREE.Mesh(pontoon1Geom, pontoonMat);
        pontoon3.position.set(20, 1, 10);
        scene.add(pontoon3);
        objects.push(pontoon3);

        // Mine sphere on pontoon 3
        var mine3 = new THREE.Mesh(mineSphereGeom, mineMat);
        mine3.position.set(20, 4, 10);
        scene.add(mine3);
        objects.push(mine3);

        // Naval ammunition wharf jetty
        var jettyGeom = new THREE.BoxGeometry(24, 4, 6);
        var jettyMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var jetty = new THREE.Mesh(jettyGeom, jettyMat);
        jetty.position.set(-5, 0, -20);
        scene.add(jetty);
        objects.push(jetty);

        // Crane arm cylinder
        var craneGeom = new THREE.CylinderGeometry(1.5, 1.5, 18, 12);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0x7a7a6a });
        var crane = new THREE.Mesh(craneGeom, craneMat);
        crane.rotation.z = 0.7;
        crane.position.set(0, 6, -20);
        scene.add(crane);
        objects.push(crane);

        // Patrol boat hull 1
        var boatGeom = new THREE.BoxGeometry(8, 3, 14);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x2a4a5a });
        var boat1 = new THREE.Mesh(boatGeom, boatMat);
        boat1.position.set(-20, 1, -8);
        scene.add(boat1);
        objects.push(boat1);

        // Patrol boat hull 2
        var boat2 = new THREE.Mesh(boatGeom, boatMat);
        boat2.position.set(-8, 1, -5);
        scene.add(boat2);
        objects.push(boat2);

        // Coastal artillery gun position base
        var gunPosGeom = new THREE.BoxGeometry(14, 2, 14);
        var gunPosMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var gunPos = new THREE.Mesh(gunPosGeom, gunPosMat);
        gunPos.position.set(25, 0, 25);
        scene.add(gunPos);
        objects.push(gunPos);

        // Gun barrel cylinder
        var barrelGeom = new THREE.CylinderGeometry(1, 1, 16, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.z = 0.4;
        barrel.position.set(25, 4, 25);
        scene.add(barrel);
        objects.push(barrel);

        // Signal station hut
        var hutGeom = new THREE.BoxGeometry(8, 6, 8);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x6a5a3a });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(10, 18, 28);
        scene.add(hut);
        objects.push(hut);

        // Signal tower base cylinder
        var towerBaseGeom = new THREE.CylinderGeometry(3, 4, 20, 14);
        var towerBaseMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var towerBase = new THREE.Mesh(towerBaseGeom, towerBaseMat);
        towerBase.position.set(10, 8, 28);
        scene.add(towerBase);
        objects.push(towerBase);

        // Sonar array buoy 1
        var buoyGeom = new THREE.SphereGeometry(1.5, 10, 10);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0x4a6a5a });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(-15, 1, 18);
        scene.add(buoy1);
        objects.push(buoy1);

        // Sonar array buoy 2
        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(-5, 1, 18);
        scene.add(buoy2);
        objects.push(buoy2);

        // Sonar array buoy 3
        var buoy3 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy3.position.set(5, 1, 18);
        scene.add(buoy3);
        objects.push(buoy3);

        // Sonar cable line segment
        var sonarPoints = [
            new THREE.Vector3(-15, 0, 18),
            new THREE.Vector3(-5, -2, 18),
            new THREE.Vector3(5, 0, 18)
        ];
        var sonarGeom = new THREE.BufferGeometry().setFromPoints(sonarPoints);
        var lineMat = new THREE.LineBasicMaterial({ color: 0x4a9a7a });
        var sonarCable = new THREE.LineSegments(sonarGeom, lineMat);
        scene.add(sonarCable);
        objects.push(sonarCable);

        // Ammunition crate cone structure
        var ammoGeom = new THREE.ConeGeometry(3, 6, 8);
        var ammoMat = new THREE.MeshLambertMaterial({ color: 0x8a6a3a });
        var ammo = new THREE.Mesh(ammoGeom, ammoMat);
        ammo.position.set(-10, 3, -20);
        scene.add(ammo);
        objects.push(ammo);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 30, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Rotate gun barrel slowly
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry && objects[i].geometry.type === 'CylinderGeometry') {
                    if (objects[i].position.z === 25) {
                        objects[i].rotation.z += delta * 0.1;
                    }
                }
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
