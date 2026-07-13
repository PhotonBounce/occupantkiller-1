window.LochFort = (function() {
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
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var darkStoneMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
        var mistMaterial = new THREE.MeshLambertMaterial({ color: 0xaabbcc });

        // Main fortress wall - long rectangular structure
        var wallGeom = new THREE.BoxGeometry(60, 12, 8);
        var wall = new THREE.Mesh(wallGeom, stoneMaterial);
        wall.position.set(0, 6, 0);
        scene.add(wall);
        objects.push(wall);

        // Watchtower 1 - northeast
        var towerGeom = new THREE.CylinderGeometry(6, 6, 14, 16);
        var tower1 = new THREE.Mesh(towerGeom, darkStoneMaterial);
        tower1.position.set(25, 7, -20);
        scene.add(tower1);
        objects.push(tower1);

        // Conical roof for tower 1
        var roofGeom = new THREE.ConeGeometry(7, 8, 16);
        var roof1 = new THREE.Mesh(roofGeom, roofMaterial);
        roof1.position.set(25, 19, -20);
        scene.add(roof1);
        objects.push(roof1);

        // Watchtower 2 - northwest
        var tower2 = new THREE.Mesh(towerGeom, darkStoneMaterial);
        tower2.position.set(-25, 7, -20);
        scene.add(tower2);
        objects.push(tower2);

        // Conical roof for tower 2
        var roof2 = new THREE.Mesh(roofGeom, roofMaterial);
        roof2.position.set(-25, 19, -20);
        scene.add(roof2);
        objects.push(roof2);

        // Watchtower 3 - southeast
        var tower3 = new THREE.Mesh(towerGeom, darkStoneMaterial);
        tower3.position.set(25, 7, 20);
        scene.add(tower3);
        objects.push(tower3);

        // Conical roof for tower 3
        var roof3 = new THREE.Mesh(roofGeom, roofMaterial);
        roof3.position.set(25, 19, 20);
        scene.add(roof3);
        objects.push(roof3);

        // Watchtower 4 - southwest
        var tower4 = new THREE.Mesh(towerGeom, darkStoneMaterial);
        tower4.position.set(-25, 7, 20);
        scene.add(tower4);
        objects.push(tower4);

        // Conical roof for tower 4
        var roof4 = new THREE.Mesh(roofGeom, roofMaterial);
        roof4.position.set(-25, 19, 20);
        scene.add(roof4);
        objects.push(roof4);

        // Stone pier extending into loch
        var pierGeom = new THREE.BoxGeometry(4, 2, 25);
        var pier = new THREE.Mesh(pierGeom, stoneMaterial);
        pier.position.set(0, 1, 30);
        scene.add(pier);
        objects.push(pier);

        // Loch water body - series of dark blue boxes
        var waterGeom = new THREE.BoxGeometry(100, 1, 40);
        var water = new THREE.Mesh(waterGeom, waterMaterial);
        water.position.set(0, -0.5, 35);
        scene.add(water);
        objects.push(water);

        // Additional loch extension
        var waterExt = new THREE.Mesh(new THREE.BoxGeometry(80, 1, 50), waterMaterial);
        waterExt.position.set(0, -0.5, 55);
        scene.add(waterExt);
        objects.push(waterExt);

        // Highland mist - large semi-transparent spheres positioned high
        var mistGeom = new THREE.SphereGeometry(35, 8, 8);
        var mist1 = new THREE.Mesh(mistGeom, mistMaterial);
        mist1.position.set(-20, 25, -15);
        mist1.material.transparent = true;
        mist1.material.opacity = 0.15;
        scene.add(mist1);
        objects.push(mist1);

        var mist2 = new THREE.Mesh(mistGeom, mistMaterial);
        mist2.position.set(20, 28, 10);
        mist2.material.transparent = true;
        mist2.material.opacity = 0.15;
        scene.add(mist2);
        objects.push(mist2);

        // Castle gate tower - smaller tower at entrance
        var gateGeom = new THREE.CylinderGeometry(4, 4, 10, 12);
        var gateTower = new THREE.Mesh(gateGeom, darkStoneMaterial);
        gateTower.position.set(0, 5, -28);
        scene.add(gateTower);
        objects.push(gateTower);

        // Gate tower roof
        var gateRoof = new THREE.Mesh(new THREE.ConeGeometry(5, 6, 12), roofMaterial);
        gateRoof.position.set(0, 15, -28);
        scene.add(gateRoof);
        objects.push(gateRoof);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate mist rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry) {
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
