window.HempCamp = (function() {
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
        // Main workers' quarters building
        var buildingGeom = new THREE.BoxGeometry(20, 12, 15);
        var buildingMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var building = new THREE.Mesh(buildingGeom, buildingMat);
        building.position.set(-25, 6, 0);
        scene.add(building);
        objects.push(building);

        // Roof structure
        var roofGeom = new THREE.ConeGeometry(12, 8, 4);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.set(-25, 18, 0);
        scene.add(roof);
        objects.push(roof);

        // First drying rack frame (vertical poles)
        var poleGeom = new THREE.CylinderGeometry(0.8, 0.8, 16, 8);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var pole1 = new THREE.Mesh(poleGeom, poleMat);
        pole1.position.set(5, 8, -15);
        scene.add(pole1);
        objects.push(pole1);

        var pole2 = new THREE.Mesh(poleGeom, poleMat);
        pole2.position.set(5, 8, 5);
        scene.add(pole2);
        objects.push(pole2);

        var pole3 = new THREE.Mesh(poleGeom, poleMat);
        pole3.position.set(20, 8, -15);
        scene.add(pole3);
        objects.push(pole3);

        var pole4 = new THREE.Mesh(poleGeom, poleMat);
        pole4.position.set(20, 8, 5);
        scene.add(pole4);
        objects.push(pole4);

        // Drying rack horizontal bars
        var barGeom = new THREE.CylinderGeometry(0.5, 0.5, 20, 8);
        var barMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var bar1 = new THREE.Mesh(barGeom, barMat);
        bar1.rotation.z = Math.PI / 2;
        bar1.position.set(12.5, 12, -5);
        scene.add(bar1);
        objects.push(bar1);

        var bar2 = new THREE.Mesh(barGeom, barMat);
        bar2.rotation.z = Math.PI / 2;
        bar2.position.set(12.5, 6, -5);
        scene.add(bar2);
        objects.push(bar2);

        // Hemp bales stacked (using boxes)
        var baleGeom = new THREE.BoxGeometry(8, 6, 10);
        var baleMat = new THREE.MeshLambertMaterial({ color: 0x9ACD32 });

        var bale1 = new THREE.Mesh(baleGeom, baleMat);
        bale1.position.set(-5, 3, 18);
        scene.add(bale1);
        objects.push(bale1);

        var bale2 = new THREE.Mesh(baleGeom, baleMat);
        bale2.position.set(5, 3, 18);
        scene.add(bale2);
        objects.push(bale2);

        var bale3 = new THREE.Mesh(baleGeom, baleMat);
        bale3.position.set(-5, 11, 18);
        scene.add(bale3);
        objects.push(bale3);

        // Rope-making spindle (cylinder with cone top)
        var spindleGeom = new THREE.CylinderGeometry(2, 2, 3, 12);
        var spindleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var spindle = new THREE.Mesh(spindleGeom, spindleMat);
        spindle.position.set(28, 1.5, -20);
        scene.add(spindle);
        objects.push(spindle);

        var spindleTopGeom = new THREE.SphereGeometry(2.5, 12, 12);
        var spindleTopMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var spindleTop = new THREE.Mesh(spindleTopGeom, spindleTopMat);
        spindleTop.position.set(28, 5, -20);
        scene.add(spindleTop);
        objects.push(spindleTop);

        // Water tank for hemp processing
        var tankGeom = new THREE.CylinderGeometry(4, 4, 8, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.position.set(-15, 4, -22);
        scene.add(tank);
        objects.push(tank);

        // Worker's shade structure (cone tent)
        var tentGeom = new THREE.ConeGeometry(6, 10, 8);
        var tentMat = new THREE.MeshLambertMaterial({ color: 0xDAA520 });
        var tent = new THREE.Mesh(tentGeom, tentMat);
        tent.position.set(25, 5, 15);
        scene.add(tent);
        objects.push(tent);

        // Tool storage box
        var toolboxGeom = new THREE.BoxGeometry(6, 5, 8);
        var toolboxMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var toolbox = new THREE.Mesh(toolboxGeom, toolboxMat);
        toolbox.position.set(-28, 2.5, 15);
        scene.add(toolbox);
        objects.push(toolbox);

        // Ground level hemp processing wheel (sphere)
        var wheelGeom = new THREE.SphereGeometry(3, 16, 16);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var wheel = new THREE.Mesh(wheelGeom, wheelMat);
        wheel.position.set(10, 3, 20);
        scene.add(wheel);
        objects.push(wheel);

        // Compost pile (cone)
        var compostGeom = new THREE.ConeGeometry(5, 6, 12);
        var compostMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var compost = new THREE.Mesh(compostGeom, compostMat);
        compost.position.set(-30, 3, -28);
        scene.add(compost);
        objects.push(compost);

        // Lighting
        var sunLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        sunLight.position.set(30, 40, 20);
        scene.add(sunLight);
        lights.push(sunLight);

        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);
    }

    function update(delta) {
        // Animate rope-making spindle
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.x === 28 && objects[i].position.z === -20) {
                objects[i].rotation.y += 0.01;
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
