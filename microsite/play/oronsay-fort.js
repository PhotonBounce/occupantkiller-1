window.OronsayFort = (function() {
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
        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 40, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);

        // Tidal island base terrain (large box)
        var terrainGeom = new THREE.BoxGeometry(60, 8, 50);
        var terrainMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -4, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Oronsay Priory nave (box)
        var naveGeom = new THREE.BoxGeometry(15, 12, 25);
        var naveMat = new THREE.MeshLambertMaterial({color: 0xA0826D});
        var nave = new THREE.Mesh(naveGeom, naveMat);
        nave.position.set(-15, 6, -5);
        scene.add(nave);
        objects.push(nave);

        // Priory cloister walls (4 boxes forming rectangle)
        var cloisterGeom = new THREE.BoxGeometry(3, 8, 20);
        var cloisterMat = new THREE.MeshLambertMaterial({color: 0x9B7E6E});

        var cloisWallN = new THREE.Mesh(cloisterGeom, cloisterMat);
        cloisWallN.position.set(-15, 4, 12);
        scene.add(cloisWallN);
        objects.push(cloisWallN);

        var cloisWallS = new THREE.Mesh(cloisterGeom, cloisterMat);
        cloisWallS.position.set(-15, 4, -22);
        scene.add(cloisWallS);
        objects.push(cloisWallS);

        var cloisWallEGeom = new THREE.BoxGeometry(18, 8, 3);
        var cloisWallE = new THREE.Mesh(cloisWallEGeom, cloisterMat);
        cloisWallE.position.set(-6, 4, -5);
        scene.add(cloisWallE);
        objects.push(cloisWallE);

        // Bell tower stump (cylinder)
        var beltowerGeom = new THREE.CylinderGeometry(5, 6, 14, 8);
        var beltowerMat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var beltower = new THREE.Mesh(beltowerGeom, beltowerMat);
        beltower.position.set(-15, 7, 5);
        scene.add(beltower);
        objects.push(beltower);

        // Tidal causeway - stone strand crossing (box)
        var strandGeom = new THREE.BoxGeometry(8, 3, 35);
        var strandMat = new THREE.MeshLambertMaterial({color: 0x7A6F6A});
        var strand = new THREE.Mesh(strandGeom, strandMat);
        strand.position.set(20, 1, 0);
        scene.add(strand);
        objects.push(strand);

        // Seaweed landmines (sphere decoys)
        var seaweedGeom = new THREE.SphereGeometry(2, 8, 8);
        var seaweedMat = new THREE.MeshLambertMaterial({color: 0x4A6B4E});

        var seaweed1 = new THREE.Mesh(seaweedGeom, seaweedMat);
        seaweed1.position.set(18, 2, 8);
        scene.add(seaweed1);
        objects.push(seaweed1);

        var seaweed2 = new THREE.Mesh(seaweedGeom, seaweedMat);
        seaweed2.position.set(22, 2, -10);
        scene.add(seaweed2);
        objects.push(seaweed2);

        // Celtic cross strongpoint - cross shaft (cylinder)
        var crossShaftGeom = new THREE.CylinderGeometry(1.5, 1.5, 16, 6);
        var crossShaftMat = new THREE.MeshLambertMaterial({color: 0x6B5D52});
        var crossShaft = new THREE.Mesh(crossShaftGeom, crossShaftMat);
        crossShaft.position.set(10, 8, 15);
        scene.add(crossShaft);
        objects.push(crossShaft);

        // Celtic cross base (box)
        var crossBaseGeom = new THREE.BoxGeometry(5, 2, 5);
        var crossBaseMat = new THREE.MeshLambertMaterial({color: 0x5B4D42});
        var crossBase = new THREE.Mesh(crossBaseGeom, crossBaseMat);
        crossBase.position.set(10, 1, 15);
        scene.add(crossBase);
        objects.push(crossBase);

        // Monastic garden - walled garden (box)
        var gardenGeom = new THREE.BoxGeometry(20, 1, 18);
        var gardenMat = new THREE.MeshLambertMaterial({color: 0x6B8E23});
        var garden = new THREE.Mesh(gardenGeom, gardenMat);
        garden.position.set(-25, 4.5, 10);
        scene.add(garden);
        objects.push(garden);

        // Raised garden beds (3 boxes)
        var bedGeom = new THREE.BoxGeometry(4, 1.5, 12);
        var bedMat = new THREE.MeshLambertMaterial({color: 0x5A7A1B});

        var bed1 = new THREE.Mesh(bedGeom, bedMat);
        bed1.position.set(-32, 5.5, 8);
        scene.add(bed1);
        objects.push(bed1);

        var bed2 = new THREE.Mesh(bedGeom, bedMat);
        bed2.position.set(-25, 5.5, 8);
        scene.add(bed2);
        objects.push(bed2);

        var bed3 = new THREE.Mesh(bedGeom, bedMat);
        bed3.position.set(-18, 5.5, 8);
        scene.add(bed3);
        objects.push(bed3);

        // Seal colony decoys (spheres)
        var sealGeom = new THREE.SphereGeometry(2.5, 8, 8);
        var sealMat = new THREE.MeshLambertMaterial({color: 0x5A5A5A});

        var seal1 = new THREE.Mesh(sealGeom, sealMat);
        seal1.position.set(-10, 3, -20);
        scene.add(seal1);
        objects.push(seal1);

        var seal2 = new THREE.Mesh(sealGeom, sealMat);
        seal2.position.set(-5, 3, -22);
        scene.add(seal2);
        objects.push(seal2);

        // Acoustic cable line (LineSegments)
        var cableGeom = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -10, 2, -20,
            -5, 2, -22,
            0, 2, -23,
            5, 2, -22,
            10, 2, -20
        ]);
        cableGeom.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({color: 0x1A1A2E, linewidth: 2});
        var cable = new THREE.LineSegments(cableGeom, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Shellfish farm pontoons (3 boxes)
        var pontoonGeom = new THREE.BoxGeometry(8, 2, 6);
        var pontoonMat = new THREE.MeshLambertMaterial({color: 0x8B4513});

        var pontoon1 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon1.position.set(25, 5, -12);
        scene.add(pontoon1);
        objects.push(pontoon1);

        var pontoon2 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon2.position.set(35, 5, -12);
        scene.add(pontoon2);
        objects.push(pontoon2);

        var pontoon3 = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon3.position.set(30, 5, -20);
        scene.add(pontoon3);
        objects.push(pontoon3);

        // Gun barrels (2 cylinders)
        var barrelGeom = new THREE.CylinderGeometry(1, 1, 8, 6);
        var barrelMat = new THREE.MeshLambertMaterial({color: 0x2F2F2F});

        var barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel1.position.set(27, 8, -12);
        barrel1.rotation.z = Math.PI / 6;
        scene.add(barrel1);
        objects.push(barrel1);

        var barrel2 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel2.position.set(33, 8, -12);
        barrel2.rotation.z = -Math.PI / 6;
        scene.add(barrel2);
        objects.push(barrel2);

        // Emergency supply cache - buried cache (box)
        var cacheGeom = new THREE.BoxGeometry(6, 4, 8);
        var cacheMat = new THREE.MeshLambertMaterial({color: 0x3E2723});
        var cache = new THREE.Mesh(cacheGeom, cacheMat);
        cache.position.set(-30, 2, -15);
        scene.add(cache);
        objects.push(cache);

        // Cache marker (cone above)
        var markerGeom = new THREE.ConeGeometry(2, 6, 6);
        var markerMat = new THREE.MeshLambertMaterial({color: 0xDAA520});
        var marker = new THREE.Mesh(markerGeom, markerMat);
        marker.position.set(-30, 7, -15);
        scene.add(marker);
        objects.push(marker);
    }

    function update(delta) {
        // Animation loop - gentle swaying for seal decoys
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry) {
                objects[i].position.y += Math.sin(Date.now() * 0.001 + i) * 0.001;
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
