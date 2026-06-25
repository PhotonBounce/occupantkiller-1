window.RuelPost = (function() {
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
        // Sheltered Glen Box Terrain - main ground platform
        var glenBoxGeom = new THREE.BoxGeometry(60, 8, 50);
        var glenBoxMat = new THREE.MeshLambertMaterial({color: 0x4a5f3f});
        var glenBox = new THREE.Mesh(glenBoxGeom, glenBoxMat);
        glenBox.position.set(0, -5, 0);
        scene.add(glenBox);
        objects.push(glenBox);

        // Glendaruel Estate Big House - Georgian manor command post
        var manorGeom = new THREE.BoxGeometry(20, 18, 16);
        var manorMat = new THREE.MeshLambertMaterial({color: 0xd4a574});
        var manor = new THREE.Mesh(manorGeom, manorMat);
        manor.position.set(-25, 5, -15);
        scene.add(manor);
        objects.push(manor);

        // Manor Chimney Stack 1
        var chimney1Geom = new THREE.CylinderGeometry(2, 2.5, 12, 8);
        var chimneyMat = new THREE.MeshLambertMaterial({color: 0x8b4513});
        var chimney1 = new THREE.Mesh(chimney1Geom, chimneyMat);
        chimney1.position.set(-32, 14, -18);
        scene.add(chimney1);
        objects.push(chimney1);

        // Manor Chimney Stack 2
        var chimney2 = new THREE.Mesh(chimney1Geom, chimneyMat);
        chimney2.position.set(-18, 14, -18);
        scene.add(chimney2);
        objects.push(chimney2);

        // Tidal Barrier Defense - concrete barriers across estuary
        var barrier1Geom = new THREE.BoxGeometry(8, 5, 4);
        var barrierMat = new THREE.MeshLambertMaterial({color: 0x999999});
        var barrier1 = new THREE.Mesh(barrier1Geom, barrierMat);
        barrier1.position.set(-15, 0, 25);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2 = new THREE.Mesh(barrier1Geom, barrierMat);
        barrier2.position.set(0, 0, 25);
        scene.add(barrier2);
        objects.push(barrier2);

        var barrier3 = new THREE.Mesh(barrier1Geom, barrierMat);
        barrier3.position.set(15, 0, 25);
        scene.add(barrier3);
        objects.push(barrier3);

        // Woodland Camouflage Position - sphere tree canopy over box bunkers
        var bunker1Geom = new THREE.BoxGeometry(10, 6, 10);
        var bunkerMat = new THREE.MeshLambertMaterial({color: 0x3d4a2f});
        var bunker1 = new THREE.Mesh(bunker1Geom, bunkerMat);
        bunker1.position.set(20, 0, -20);
        scene.add(bunker1);
        objects.push(bunker1);

        var canopy1Geom = new THREE.SphereGeometry(8, 8, 8);
        var canopyMat = new THREE.MeshLambertMaterial({color: 0x2d5a1f});
        var canopy1 = new THREE.Mesh(canopy1Geom, canopyMat);
        canopy1.position.set(20, 10, -20);
        scene.add(canopy1);
        objects.push(canopy1);

        // Glen Road IED Placement - box culvert bombs under road surface
        var culvert1Geom = new THREE.BoxGeometry(12, 3, 6);
        var culvertMat = new THREE.MeshLambertMaterial({color: 0x5c5c5c});
        var culvert1 = new THREE.Mesh(culvert1Geom, culvertMat);
        culvert1.position.set(-30, 1, 10);
        scene.add(culvert1);
        objects.push(culvert1);

        var culvert2 = new THREE.Mesh(culvert1Geom, culvertMat);
        culvert2.position.set(10, 1, 8);
        scene.add(culvert2);
        objects.push(culvert2);

        // Observation Post on Cnoc Mòr - box OP with cylinder flagpole
        var opBoxGeom = new THREE.BoxGeometry(12, 10, 12);
        var opMat = new THREE.MeshLambertMaterial({color: 0x6b8e23});
        var opBox = new THREE.Mesh(opBoxGeom, opMat);
        opBox.position.set(28, 8, 15);
        scene.add(opBox);
        objects.push(opBox);

        var flagpoleGeom = new THREE.CylinderGeometry(1.5, 1.5, 16, 8);
        var flagpoleMat = new THREE.MeshLambertMaterial({color: 0x2f4f4f});
        var flagpole = new THREE.Mesh(flagpoleGeom, flagpoleMat);
        flagpole.position.set(28, 18, 15);
        scene.add(flagpole);
        objects.push(flagpole);

        // Boat Resupply Cache - box waterproof caches
        var cache1Geom = new THREE.BoxGeometry(6, 4, 5);
        var cacheMat = new THREE.MeshLambertMaterial({color: 0x556b2f});
        var cache1 = new THREE.Mesh(cache1Geom, cacheMat);
        cache1.position.set(-20, 1, -25);
        scene.add(cache1);
        objects.push(cache1);

        // Oil Drums - sphere shapes at river bank
        var drum1Geom = new THREE.SphereGeometry(2, 12, 12);
        var drumMat = new THREE.MeshLambertMaterial({color: 0xffa500});
        var drum1 = new THREE.Mesh(drum1Geom, drumMat);
        drum1.position.set(-25, 2, -28);
        scene.add(drum1);
        objects.push(drum1);

        var drum2 = new THREE.Mesh(drum1Geom, drumMat);
        drum2.position.set(-15, 2, -28);
        scene.add(drum2);
        objects.push(drum2);

        // Field Hospital in Converted Barn - box barn structure
        var barnGeom = new THREE.BoxGeometry(24, 14, 18);
        var barnMat = new THREE.MeshLambertMaterial({color: 0x8b7355});
        var barn = new THREE.Mesh(barnGeom, barnMat);
        barn.position.set(5, 3, -8);
        scene.add(barn);
        objects.push(barn);

        // Medical Cross Marker on Barn Roof - box marker
        var crossGeom = new THREE.BoxGeometry(8, 1, 8);
        var crossMat = new THREE.MeshLambertMaterial({color: 0xff0000});
        var cross = new THREE.Mesh(crossGeom, crossMat);
        cross.position.set(5, 12, -8);
        scene.add(cross);
        objects.push(cross);

        // Additional defensive structure - cone observation tower
        var towerGeom = new THREE.ConeGeometry(4, 15, 8);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x4a5a3a});
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-5, 8, 20);
        scene.add(tower);
        objects.push(tower);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for glen atmosphere
        var dirLight = new THREE.DirectionalLight(0xffffee, 0.8);
        dirLight.position.set(40, 30, 40);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation loop - subtle rotation for visual interest
        for (var i = 0; i < objects.length; i++) {
            if (objects[i] && objects[i].geometry instanceof THREE.SphereGeometry) {
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
