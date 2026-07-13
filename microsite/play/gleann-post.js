window.GleannPost = (function() {
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
        // Glen valley walls - tall box cliffs on both sides
        var leftCliffGeom = new THREE.BoxGeometry(8, 40, 60);
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var leftCliff = new THREE.Mesh(leftCliffGeom, cliffMat);
        leftCliff.position.set(-35, 15, 0);
        scene.add(leftCliff);
        objects.push(leftCliff);

        var rightCliffGeom = new THREE.BoxGeometry(8, 40, 60);
        var rightCliff = new THREE.Mesh(rightCliffGeom, cliffMat);
        rightCliff.position.set(35, 15, 0);
        scene.add(rightCliff);
        objects.push(rightCliff);

        // Glen floor
        var floorGeom = new THREE.BoxGeometry(60, 2, 60);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var floor = new THREE.Mesh(floorGeom, floorMat);
        floor.position.set(0, 0, 0);
        scene.add(floor);
        objects.push(floor);

        // Glen floor patrol path checkpoint - box gate across glen
        var gateGeom = new THREE.BoxGeometry(50, 12, 2);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var gate = new THREE.Mesh(gateGeom, gateMat);
        gate.position.set(0, 6, -20);
        scene.add(gate);
        objects.push(gate);

        // Watchtower at glen mouth - stacked box floors with cone top
        var tower1Geom = new THREE.BoxGeometry(6, 3, 6);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var tower1 = new THREE.Mesh(tower1Geom, towerMat);
        tower1.position.set(0, 3, 25);
        scene.add(tower1);
        objects.push(tower1);

        var tower2Geom = new THREE.BoxGeometry(5, 3, 5);
        var tower2 = new THREE.Mesh(tower2Geom, towerMat);
        tower2.position.set(0, 8, 25);
        scene.add(tower2);
        objects.push(tower2);

        var tower3Geom = new THREE.BoxGeometry(4, 3, 4);
        var tower3 = new THREE.Mesh(tower3Geom, towerMat);
        tower3.position.set(0, 13, 25);
        scene.add(tower3);
        objects.push(tower3);

        var coneGeom = new THREE.ConeGeometry(2, 5, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(0, 18, 25);
        scene.add(cone);
        objects.push(cone);

        // Glen stream tripwire alarm - LineSegments wire across + sphere bell
        var wireGeom = new THREE.BufferGeometry();
        var wirePos = new Float32Array([
            -25, 0.5, -10,
            25, 0.5, -10
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        var bellGeom = new THREE.SphereGeometry(1.5, 16, 16);
        var bellMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        var bell = new THREE.Mesh(bellGeom, bellMat);
        bell.position.set(0, 0.5, -10);
        scene.add(bell);
        objects.push(bell);

        // Rock overhang ambush position - box overhang jutting from cliff
        var overhangGeom = new THREE.BoxGeometry(10, 4, 8);
        var overhangMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var overhang = new THREE.Mesh(overhangGeom, overhangMat);
        overhang.position.set(-28, 28, -18);
        scene.add(overhang);
        objects.push(overhang);

        // Horse trough converted to water supply - box trough
        var troughGeom = new THREE.BoxGeometry(12, 3, 4);
        var troughMat = new THREE.MeshLambertMaterial({ color: 0x5f5f5f });
        var trough = new THREE.Mesh(troughGeom, troughMat);
        trough.position.set(20, 1, -15);
        scene.add(trough);
        objects.push(trough);

        // Signal fire on ledge - sphere glow + cylinder stone base
        var baseGeom = new THREE.CylinderGeometry(3, 3, 2, 8);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(-20, 1.5, 15);
        scene.add(base);
        objects.push(base);

        var fireGeom = new THREE.SphereGeometry(2, 16, 16);
        var fireMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var fire = new THREE.Mesh(fireGeom, fireMat);
        fire.position.set(-20, 5, 15);
        scene.add(fire);
        objects.push(fire);

        // Concealed mortar pit in glen floor - cylinder barrel + box pit walls
        var barrelGeom = new THREE.CylinderGeometry(2, 2, 4, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2f2f2f });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(15, 3, 10);
        scene.add(barrel);
        objects.push(barrel);

        var pitWallGeom = new THREE.BoxGeometry(10, 3, 10);
        var pitWallMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var pitWall = new THREE.Mesh(pitWallGeom, pitWallMat);
        pitWall.position.set(15, 2, 10);
        scene.add(pitWall);
        objects.push(pitWall);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate signal fire glow
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry && objects[i].position.y > 4) {
                objects[i].rotation.y += delta * 0.5;
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
