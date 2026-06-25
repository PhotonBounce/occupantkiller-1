window.GairFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Headland promontory - rocky cliff faces
        var cliffGeo1 = new THREE.BoxGeometry(25, 20, 15);
        var cliffMat1 = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var cliff1 = new THREE.Mesh(cliffGeo1, cliffMat1);
        cliff1.position.set(-20, 8, -25);
        cliff1.rotation.z = 0.2;
        scene.add(cliff1);
        objects.push(cliff1);

        var cliffGeo2 = new THREE.BoxGeometry(20, 18, 12);
        var cliffMat2 = new THREE.MeshLambertMaterial({ color: 0x7A6B5D });
        var cliff2 = new THREE.Mesh(cliffGeo2, cliffMat2);
        cliff2.position.set(18, 10, -22);
        cliff2.rotation.z = -0.15;
        scene.add(cliff2);
        objects.push(cliff2);

        // Sea-gate chain barrier - cylinder bollards with chain
        var bollardGeo1 = new THREE.CylinderGeometry(1.5, 1.8, 8, 12);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var bollard1 = new THREE.Mesh(bollardGeo1, bollardMat);
        bollard1.position.set(-10, 2, 5);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2 = new THREE.Mesh(bollardGeo1, bollardMat);
        bollard2.position.set(10, 2, 5);
        scene.add(bollard2);
        objects.push(bollard2);

        // Chain between bollards using LineSegments
        var chainGeo = new THREE.BufferGeometry();
        var chainVerts = new Float32Array([
            -10, 3, 5,
            -5, 5, 5,
            0, 6, 5,
            5, 5, 5,
            10, 3, 5
        ]);
        chainGeo.setAttribute('position', new THREE.BufferAttribute(chainVerts, 3));
        var chainMat = new THREE.LineBasicMaterial({ color: 0x8B7355 });
        var chain = new THREE.LineSegments(chainGeo, chainMat);
        scene.add(chain);
        objects.push(chain);

        // Coastal gun battery - cylinder barrels on box mounts
        var mountGeo = new THREE.BoxGeometry(12, 4, 8);
        var mountMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var mount1 = new THREE.Mesh(mountGeo, mountMat);
        mount1.position.set(-15, 5, 15);
        scene.add(mount1);
        objects.push(mount1);

        var barrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 16, 10);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        var barrel1 = new THREE.Mesh(barrelGeo, barrelMat);
        barrel1.position.set(-15, 10, 15);
        barrel1.rotation.z = 0.3;
        scene.add(barrel1);
        objects.push(barrel1);

        var barrel2 = new THREE.Mesh(barrelGeo, barrelMat);
        barrel2.position.set(-10, 10, 17);
        barrel2.rotation.z = 0.25;
        scene.add(barrel2);
        objects.push(barrel2);

        // Ammunition magazine cave - box interior with cone blast wall
        var magGeo = new THREE.BoxGeometry(14, 10, 12);
        var magMat = new THREE.MeshLambertMaterial({ color: 0x3D3D3D });
        var magazine = new THREE.Mesh(magGeo, magMat);
        magazine.position.set(0, 5, -8);
        scene.add(magazine);
        objects.push(magazine);

        var blastGeo = new THREE.ConeGeometry(8, 6, 12);
        var blastMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var blastWall = new THREE.Mesh(blastGeo, blastMat);
        blastWall.position.set(0, 12, -8);
        scene.add(blastWall);
        objects.push(blastWall);

        // Signal fire tower - cylinder with sphere flame
        var towerGeo = new THREE.CylinderGeometry(3, 3.5, 18, 14);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(25, 8, 0);
        scene.add(tower);
        objects.push(tower);

        var flameGeo = new THREE.SphereGeometry(2.5, 10, 10);
        var flameMat = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        var flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(25, 20, 0);
        scene.add(flame);
        objects.push(flame);

        // Anti-boat rock obstacles - sphere boulders in water
        var boulderGeo1 = new THREE.SphereGeometry(3.5, 10, 10);
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var boulder1 = new THREE.Mesh(boulderGeo1, boulderMat);
        boulder1.position.set(-8, 1, 25);
        scene.add(boulder1);
        objects.push(boulder1);

        var boulder2 = new THREE.Mesh(boulderGeo1, boulderMat);
        boulder2.position.set(12, 0.5, 28);
        scene.add(boulder2);
        objects.push(boulder2);

        var boulder3 = new THREE.Mesh(boulderGeo1, boulderMat);
        boulder3.position.set(5, 1.5, 30);
        scene.add(boulder3);
        objects.push(boulder3);

        // Tide-watch lookout slit tower - box embrasure tower
        var lookoutGeo = new THREE.BoxGeometry(6, 12, 6);
        var lookoutMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var lookout = new THREE.Mesh(lookoutGeo, lookoutMat);
        lookout.position.set(-28, 6, 10);
        scene.add(lookout);
        objects.push(lookout);

        // Hidden submarine cable tap station - box housing with cable
        var cableStnGeo = new THREE.BoxGeometry(10, 6, 8);
        var cableStnMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var cableStation = new THREE.Mesh(cableStnGeo, cableStnMat);
        cableStation.position.set(20, 2, -20);
        scene.add(cableStation);
        objects.push(cableStation);

        // Cable run using LineSegments
        var cableGeo = new THREE.BufferGeometry();
        var cableVerts = new Float32Array([
            20, 3, -20,
            18, 3, -18,
            12, 3, -12,
            5, 3, -5
        ]);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cableVerts, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x556B2F });
        var cableRun = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cableRun);
        objects.push(cableRun);

        // Additional reinforcement - secondary box fortification
        var fortGeo = new THREE.BoxGeometry(16, 7, 10);
        var fortMat = new THREE.MeshLambertMaterial({ color: 0x7A6B5D });
        var fort = new THREE.Mesh(fortGeo, fortMat);
        fort.position.set(5, 3, 12);
        fort.rotation.y = 0.4;
        scene.add(fort);
        objects.push(fort);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.7);
        directionalLight.position.set(30, 25, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate flame flicker
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].position.y > 19 && objects[i].position.y < 21) {
                    objects[i].scale.y = 0.95 + Math.sin(delta * 3) * 0.05;
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
