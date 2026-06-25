window.ForthCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        // Terrain base - wide estuary box
        var terrainGeom = new THREE.BoxGeometry(120, 2, 100);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -5, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Forth Bridge pylon 1 - box foundation
        var pylon1Geom = new THREE.BoxGeometry(8, 20, 6);
        var pylonMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var pylon1 = new THREE.Mesh(pylon1Geom, pylonMat);
        pylon1.position.set(-25, 5, -35);
        scene.add(pylon1);
        objects.push(pylon1);

        // Forth Bridge pylon 2 - box foundation
        var pylon2 = new THREE.Mesh(pylon1Geom, pylonMat);
        pylon2.position.set(25, 5, -35);
        scene.add(pylon2);
        objects.push(pylon2);

        // Bridge suspension cables using LineSegments
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -25, 25, -35, 25, 25, -35,
            -25, 25, -35, 0, 22, -30,
            25, 25, -35, 0, 22, -30
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0xCCCCCC, linewidth: 2 });
        var cables = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cables);
        objects.push(cables);

        // Coastal battery gun mount - box base
        var gunMountGeom = new THREE.BoxGeometry(6, 3, 8);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var gunMount = new THREE.Mesh(gunMountGeom, gunMat);
        gunMount.position.set(-35, 0, 15);
        scene.add(gunMount);
        objects.push(gunMount);

        // Coastal battery gun barrel - cylinder
        var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var barrel = new THREE.Mesh(barrelGeom, metalMat);
        barrel.rotation.z = 0.3;
        barrel.position.set(-35, 6, 15);
        scene.add(barrel);
        objects.push(barrel);

        // Naval minefield control hut - box
        var hutGeom = new THREE.BoxGeometry(5, 4, 5);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(20, 1, 20);
        scene.add(hut);
        objects.push(hut);

        // Mine marker 1 - sphere
        var mineGeom = new THREE.SphereGeometry(1.5, 8, 8);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0xFF4500 });
        var mine1 = new THREE.Mesh(mineGeom, mineMat);
        mine1.position.set(15, 0, 25);
        scene.add(mine1);
        objects.push(mine1);

        // Mine marker 2 - sphere
        var mine2 = new THREE.Mesh(mineGeom, mineMat);
        mine2.position.set(25, 0, 28);
        scene.add(mine2);
        objects.push(mine2);

        // Mine marker 3 - sphere
        var mine3 = new THREE.Mesh(mineGeom, mineMat);
        mine3.position.set(30, 0, 20);
        scene.add(mine3);
        objects.push(mine3);

        // Minefield control cables using LineSegments
        var mineLineGeom = new THREE.BufferGeometry();
        var mineLinePos = new Float32Array([
            20, 2, 20, 15, 1, 25,
            20, 2, 20, 25, 1, 28,
            20, 2, 20, 30, 1, 20
        ]);
        mineLineGeom.setAttribute('position', new THREE.BufferAttribute(mineLinePos, 3));
        var mineLineMat = new THREE.LineBasicMaterial({ color: 0xFFFF00, linewidth: 1 });
        var mineLines = new THREE.LineSegments(mineLineGeom, mineLineMat);
        scene.add(mineLines);
        objects.push(mineLines);

        // Submarine transit buoy 1 - sphere
        var buoyGeom = new THREE.SphereGeometry(1, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0x0000FF });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(-20, -2, 10);
        scene.add(buoy1);
        objects.push(buoy1);

        // Submarine transit buoy 2 - sphere
        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(-10, -2, 8);
        scene.add(buoy2);
        objects.push(buoy2);

        // Submarine transit buoy mooring chains using LineSegments
        var chainGeom = new THREE.BufferGeometry();
        var chainPos = new Float32Array([
            -20, -2, 10, -20, -8, 10,
            -10, -2, 8, -10, -8, 8
        ]);
        chainGeom.setAttribute('position', new THREE.BufferAttribute(chainPos, 3));
        var chainMat = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 1 });
        var chains = new THREE.LineSegments(chainGeom, chainMat);
        scene.add(chains);
        objects.push(chains);

        // Anti-aircraft platform support stilts - cylinder
        var stiltGeom = new THREE.CylinderGeometry(0.5, 0.5, 15, 6);
        var stiltMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var stilt1 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt1.position.set(-5, -2, -10);
        scene.add(stilt1);
        objects.push(stilt1);

        var stilt2 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt2.position.set(5, -2, -10);
        scene.add(stilt2);
        objects.push(stilt2);

        // Anti-aircraft platform deck - box
        var platformGeom = new THREE.BoxGeometry(12, 1, 10);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var platform = new THREE.Mesh(platformGeom, platformMat);
        platform.position.set(0, 8, -10);
        scene.add(platform);
        objects.push(platform);

        // Radar mast - cylinder tower
        var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 25, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-30, 5, 0);
        scene.add(mast);
        objects.push(mast);

        // Radar dish - sphere
        var radarGeom = new THREE.SphereGeometry(2, 8, 8);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0xDDD700 });
        var radar = new THREE.Mesh(radarGeom, radarMat);
        radar.position.set(-30, 20, 0);
        scene.add(radar);
        objects.push(radar);

        // Dragon's teeth anti-tank obstacle 1 - box
        var teethGeom = new THREE.BoxGeometry(2, 2, 2);
        var teethMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var teeth1 = new THREE.Mesh(teethGeom, teethMat);
        teeth1.position.set(-15, 0, -25);
        teeth1.rotation.y = 0.785;
        scene.add(teeth1);
        objects.push(teeth1);

        // Dragon's teeth obstacle 2 - box
        var teeth2 = new THREE.Mesh(teethGeom, teethMat);
        teeth2.position.set(-10, 0, -25);
        teeth2.rotation.y = 0.785;
        scene.add(teeth2);
        objects.push(teeth2);

        // Dragon's teeth obstacle 3 - box
        var teeth3 = new THREE.Mesh(teethGeom, teethMat);
        teeth3.position.set(-5, 0, -25);
        teeth3.rotation.y = 0.785;
        scene.add(teeth3);
        objects.push(teeth3);

        // Dragon's teeth obstacle 4 - box
        var teeth4 = new THREE.Mesh(teethGeom, teethMat);
        teeth4.position.set(0, 0, -25);
        teeth4.rotation.y = 0.785;
        scene.add(teeth4);
        objects.push(teeth4);

        // Ammunition storage cone - cone
        var ammoGeom = new THREE.ConeGeometry(1.5, 4, 8);
        var ammoMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var ammo = new THREE.Mesh(ammoGeom, ammoMat);
        ammo.position.set(-40, 1, 5);
        scene.add(ammo);
        objects.push(ammo);

        // Water barrier cylinder
        var barrierGeom = new THREE.CylinderGeometry(1, 1, 8, 8);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(10, -1, -40);
        scene.add(barrier);
        objects.push(barrier);

        // Searchlight platform cone - cone
        var searchGeom = new THREE.ConeGeometry(0.8, 3, 8);
        var searchMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var searchlight = new THREE.Mesh(searchGeom, searchMat);
        searchlight.position.set(30, 2, -20);
        scene.add(searchlight);
        objects.push(searchlight);

        // Observation tower - cylinder
        var towerGeom = new THREE.CylinderGeometry(1.2, 1.2, 10, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(25, 2, 5);
        scene.add(tower);
        objects.push(tower);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(50, 30, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate radar dish rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.x === -30 && objects[i].position.y === 20 && objects[i].position.z === 0) {
                objects[i].rotation.y += 0.03;
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
