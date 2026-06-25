window.SladePost = (function() {
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
        // Chalk escarpment cliff face - tall white box walls
        var cliffGeom = new THREE.BoxGeometry(40, 60, 8);
        var cliffMat = new THREE.MeshLambertMaterial({color: 0xf5f5f5});
        var cliff = new THREE.Mesh(cliffGeom, cliffMat);
        cliff.position.set(-25, 30, -28);
        cliff.castShadow = true;
        cliff.receiveShadow = true;
        scene.add(cliff);
        objects.push(cliff);

        // Cliff face right side
        var cliffRight = new THREE.Mesh(cliffGeom, cliffMat);
        cliffRight.position.set(25, 30, -28);
        cliffRight.castShadow = true;
        cliffRight.receiveShadow = true;
        scene.add(cliffRight);
        objects.push(cliffRight);

        // Valley floor observation hide - box camouflage shelter
        var hideGeom = new THREE.BoxGeometry(12, 8, 10);
        var hideMat = new THREE.MeshLambertMaterial({color: 0x6b7d3d});
        var hide = new THREE.Mesh(hideGeom, hideMat);
        hide.position.set(0, 4, 8);
        hide.castShadow = true;
        hide.receiveShadow = true;
        scene.add(hide);
        objects.push(hide);

        // Chalk pit wall - tall box
        var pitWallGeom = new THREE.BoxGeometry(20, 35, 6);
        var pitMat = new THREE.MeshLambertMaterial({color: 0xe8e8d0});
        var pitWall = new THREE.Mesh(pitWallGeom, pitMat);
        pitWall.position.set(-20, 17.5, 15);
        pitWall.castShadow = true;
        pitWall.receiveShadow = true;
        scene.add(pitWall);
        objects.push(pitWall);

        // Ammunition crate 1 inside pit
        var crateGeom = new THREE.BoxGeometry(6, 6, 6);
        var crateMat = new THREE.MeshLambertMaterial({color: 0x8b4513});
        var crate1 = new THREE.Mesh(crateGeom, crateMat);
        crate1.position.set(-22, 9, 16);
        crate1.castShadow = true;
        crate1.receiveShadow = true;
        scene.add(crate1);
        objects.push(crate1);

        // Ammunition crate 2
        var crate2 = new THREE.Mesh(crateGeom, crateMat);
        crate2.position.set(-18, 9, 16);
        crate2.castShadow = true;
        crate2.receiveShadow = true;
        scene.add(crate2);
        objects.push(crate2);

        // Hawthorn hedge thorn cluster 1 - sphere
        var thornGeom = new THREE.SphereGeometry(3, 8, 8);
        var thornMat = new THREE.MeshLambertMaterial({color: 0x2d5016});
        var thorn1 = new THREE.Mesh(thornGeom, thornMat);
        thorn1.position.set(-30, 8, 0);
        thorn1.castShadow = true;
        thorn1.receiveShadow = true;
        scene.add(thorn1);
        objects.push(thorn1);

        // Hawthorn hedge thorn cluster 2
        var thorn2 = new THREE.Mesh(thornGeom, thornMat);
        thorn2.position.set(30, 8, 0);
        thorn2.castShadow = true;
        thorn2.receiveShadow = true;
        scene.add(thorn2);
        objects.push(thorn2);

        // Chalk path marker stone 1 - flat box
        var stoneGeom = new THREE.BoxGeometry(8, 1, 8);
        var stoneMat = new THREE.MeshLambertMaterial({color: 0xd3d3d3});
        var stone1 = new THREE.Mesh(stoneGeom, stoneMat);
        stone1.position.set(-15, 0.5, -5);
        stone1.castShadow = true;
        stone1.receiveShadow = true;
        scene.add(stone1);
        objects.push(stone1);

        // Chalk path marker stone 2
        var stone2 = new THREE.Mesh(stoneGeom, stoneMat);
        stone2.position.set(0, 0.5, 0);
        stone2.castShadow = true;
        stone2.receiveShadow = true;
        scene.add(stone2);
        objects.push(stone2);

        // Chalk path marker stone 3
        var stone3 = new THREE.Mesh(stoneGeom, stoneMat);
        stone3.position.set(15, 0.5, 5);
        stone3.castShadow = true;
        stone3.receiveShadow = true;
        scene.add(stone3);
        objects.push(stone3);

        // Signal mirror post - cylinder pole
        var poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 12);
        var poleMat = new THREE.MeshLambertMaterial({color: 0x404040});
        var pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(12, 6, -20);
        pole.castShadow = true;
        pole.receiveShadow = true;
        scene.add(pole);
        objects.push(pole);

        // Signal mirror reflector - box
        var mirrorGeom = new THREE.BoxGeometry(4, 4, 0.4);
        var mirrorMat = new THREE.MeshLambertMaterial({color: 0xcccccc});
        var mirror = new THREE.Mesh(mirrorGeom, mirrorMat);
        mirror.position.set(12, 12.5, -20);
        mirror.rotation.z = Math.PI / 6;
        mirror.castShadow = true;
        mirror.receiveShadow = true;
        scene.add(mirror);
        objects.push(mirror);

        // Spring-fed pool water - sphere
        var poolGeom = new THREE.SphereGeometry(6, 16, 16);
        var poolMat = new THREE.MeshLambertMaterial({color: 0x4a6fa5});
        var pool = new THREE.Mesh(poolGeom, poolMat);
        pool.position.set(20, 3, 15);
        pool.scale.set(1, 0.4, 1);
        pool.castShadow = true;
        pool.receiveShadow = true;
        scene.add(pool);
        objects.push(pool);

        // Pool observation hide - box shelter
        var poolHideGeom = new THREE.BoxGeometry(10, 6, 8);
        var poolHideMat = new THREE.MeshLambertMaterial({color: 0x5a6d3d});
        var poolHide = new THREE.Mesh(poolHideGeom, poolHideMat);
        poolHide.position.set(20, 3, 24);
        poolHide.castShadow = true;
        poolHide.receiveShadow = true;
        scene.add(poolHide);
        objects.push(poolHide);

        // Anti-helicopter wire obstacle - cylinder poles
        var wirePole1Geom = new THREE.CylinderGeometry(0.6, 0.6, 8, 10);
        var wirePole1Mat = new THREE.MeshLambertMaterial({color: 0x333333});
        var wirePole1 = new THREE.Mesh(wirePole1Geom, wirePole1Mat);
        wirePole1.position.set(-12, 4, 20);
        wirePole1.castShadow = true;
        wirePole1.receiveShadow = true;
        scene.add(wirePole1);
        objects.push(wirePole1);

        // Anti-helicopter wire obstacle - second pole
        var wirePole2 = new THREE.Mesh(wirePole1Geom, wirePole1Mat);
        wirePole2.position.set(12, 4, 20);
        wirePole2.castShadow = true;
        wirePole2.receiveShadow = true;
        scene.add(wirePole2);
        objects.push(wirePole2);

        // Anti-helicopter wire between poles
        var wireGeom = new THREE.BufferGeometry();
        var wirePositions = new Float32Array([
            -12, 7, 20,
            12, 7, 20
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePositions, 3));
        var wireMat = new THREE.LineBasicMaterial({color: 0x333333, linewidth: 2});
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Hawthorn hedge perimeter wire 1
        var hedgeWire1Geom = new THREE.BufferGeometry();
        var hedgeWire1Pos = new Float32Array([
            -30, 5, -15,
            -30, 5, 25
        ]);
        hedgeWire1Geom.setAttribute('position', new THREE.BufferAttribute(hedgeWire1Pos, 3));
        var hedgeWireMat = new THREE.LineBasicMaterial({color: 0x2d5016, linewidth: 1});
        var hedgeWire1 = new THREE.LineSegments(hedgeWire1Geom, hedgeWireMat);
        scene.add(hedgeWire1);
        objects.push(hedgeWire1);

        // Hawthorn hedge perimeter wire 2
        var hedgeWire2Geom = new THREE.BufferGeometry();
        var hedgeWire2Pos = new Float32Array([
            30, 5, -15,
            30, 5, 25
        ]);
        hedgeWire2Geom.setAttribute('position', new THREE.BufferAttribute(hedgeWire2Pos, 3));
        var hedgeWire2 = new THREE.LineSegments(hedgeWire2Geom, hedgeWireMat);
        scene.add(hedgeWire2);
        objects.push(hedgeWire2);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(15, 25, 10);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation can be added here if needed
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
