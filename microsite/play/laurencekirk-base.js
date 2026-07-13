window.LaurencekirkBase = (function() {
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
        build();
    }

    function build() {
        var baseX = 420;
        var baseZ = 400;

        // A90 highway checkpoint - wide BoxGeometry barrier across road
        var barrierGeom = new THREE.BoxGeometry(25, 2, 3);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrier = new THREE.Mesh(barrierGeom, barrierMat);
        barrier.position.set(baseX, 1, baseZ);
        barrier.rotation.y = 0.1;
        scene.add(barrier);
        objects.push(barrier);

        // Guard post 1
        var guardPost1Geom = new THREE.BoxGeometry(4, 3.5, 4);
        var guardPost1Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var guardPost1 = new THREE.Mesh(guardPost1Geom, guardPost1Mat);
        guardPost1.position.set(baseX - 15, 1.75, baseZ - 8);
        scene.add(guardPost1);
        objects.push(guardPost1);

        // Guard post 2
        var guardPost2Geom = new THREE.BoxGeometry(4, 3.5, 4);
        var guardPost2Mat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var guardPost2 = new THREE.Mesh(guardPost2Geom, guardPost2Mat);
        guardPost2.position.set(baseX + 15, 1.75, baseZ - 8);
        scene.add(guardPost2);
        objects.push(guardPost2);

        // Farm supply depot - large agricultural barn
        var barnGeom = new THREE.BoxGeometry(14, 6, 5);
        var barnMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var barn = new THREE.Mesh(barnGeom, barnMat);
        barn.position.set(baseX + 40, 3, baseZ + 35);
        scene.add(barn);
        objects.push(barn);

        // Grain silo cluster - 4 tall CylinderGeometry silos
        var siloRadius = 2.5;
        var siloHeight = 12;
        var siloMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });

        var silo1Geom = new THREE.CylinderGeometry(siloRadius, siloRadius, siloHeight, 16);
        var silo1 = new THREE.Mesh(silo1Geom, siloMat);
        silo1.position.set(baseX - 30, siloHeight / 2, baseZ + 25);
        scene.add(silo1);
        objects.push(silo1);

        var silo2Geom = new THREE.CylinderGeometry(siloRadius, siloRadius, siloHeight, 16);
        var silo2 = new THREE.Mesh(silo2Geom, siloMat);
        silo2.position.set(baseX - 20, siloHeight / 2, baseZ + 25);
        scene.add(silo2);
        objects.push(silo2);

        var silo3Geom = new THREE.CylinderGeometry(siloRadius, siloRadius, siloHeight, 16);
        var silo3 = new THREE.Mesh(silo3Geom, siloMat);
        silo3.position.set(baseX - 30, siloHeight / 2, baseZ + 38);
        scene.add(silo3);
        objects.push(silo3);

        var silo4Geom = new THREE.CylinderGeometry(siloRadius, siloRadius, siloHeight, 16);
        var silo4 = new THREE.Mesh(silo4Geom, siloMat);
        silo4.position.set(baseX - 20, siloHeight / 2, baseZ + 38);
        scene.add(silo4);
        objects.push(silo4);

        // Military transport trucks - 3 BoxGeometry truck hulks lined up
        var truckMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });

        var truck1Geom = new THREE.BoxGeometry(8, 4, 3);
        var truck1 = new THREE.Mesh(truck1Geom, truckMat);
        truck1.position.set(baseX + 50, 2, baseZ - 25);
        scene.add(truck1);
        objects.push(truck1);

        var truck2Geom = new THREE.BoxGeometry(8, 4, 3);
        var truck2 = new THREE.Mesh(truck2Geom, truckMat);
        truck2.position.set(baseX + 65, 2, baseZ - 25);
        scene.add(truck2);
        objects.push(truck2);

        var truck3Geom = new THREE.BoxGeometry(8, 4, 3);
        var truck3 = new THREE.Mesh(truck3Geom, truckMat);
        truck3.position.set(baseX + 80, 2, baseZ - 25);
        scene.add(truck3);
        objects.push(truck3);

        // Logistics coordination center - BoxGeometry prefab HQ
        var hqGeom = new THREE.BoxGeometry(10, 5, 8);
        var hqMat = new THREE.MeshLambertMaterial({ color: 0x7A8B6F });
        var hq = new THREE.Mesh(hqGeom, hqMat);
        hq.position.set(baseX + 25, 2.5, baseZ - 50);
        scene.add(hq);
        objects.push(hq);

        // Fuel dump with berms - 3 CylinderGeometry tanks inside BoxGeometry earthwork berm
        var bermGeom = new THREE.BoxGeometry(18, 3, 18);
        var bermMat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var berm = new THREE.Mesh(bermGeom, bermMat);
        berm.position.set(baseX - 50, 1.5, baseZ - 40);
        scene.add(berm);
        objects.push(berm);

        var tankMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });

        var tank1Geom = new THREE.CylinderGeometry(2, 2, 4.5, 12);
        var tank1 = new THREE.Mesh(tank1Geom, tankMat);
        tank1.position.set(baseX - 55, 2.5, baseZ - 40);
        scene.add(tank1);
        objects.push(tank1);

        var tank2Geom = new THREE.CylinderGeometry(2, 2, 4.5, 12);
        var tank2 = new THREE.Mesh(tank2Geom, tankMat);
        tank2.position.set(baseX - 50, 2.5, baseZ - 40);
        scene.add(tank2);
        objects.push(tank2);

        var tank3Geom = new THREE.CylinderGeometry(2, 2, 4.5, 12);
        var tank3 = new THREE.Mesh(tank3Geom, tankMat);
        tank3.position.set(baseX - 45, 2.5, baseZ - 40);
        scene.add(tank3);
        objects.push(tank3);

        // Medical evacuation point - BoxGeometry tent + red cross marker
        var tentGeom = new THREE.BoxGeometry(8, 5, 8);
        var tentMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var tent = new THREE.Mesh(tentGeom, tentMat);
        tent.position.set(baseX - 75, 2.5, baseZ + 15);
        scene.add(tent);
        objects.push(tent);

        // Red cross marker on tent
        var crossHorizGeom = new THREE.BoxGeometry(4, 1, 0.5);
        var crossMat = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var crossHoriz = new THREE.Mesh(crossHorizGeom, crossMat);
        crossHoriz.position.set(baseX - 75, 4.5, baseZ + 15 + 0.1);
        scene.add(crossHoriz);
        objects.push(crossHoriz);

        var crossVertGeom = new THREE.BoxGeometry(0.5, 1, 4);
        var crossVert = new THREE.Mesh(crossVertGeom, crossMat);
        crossVert.position.set(baseX - 75, 4.5, baseZ + 15 + 0.1);
        scene.add(crossVert);
        objects.push(crossVert);

        // Helicopter landing pad - BoxGeometry H-marked platform + ConeGeometry wind marker
        var padGeom = new THREE.BoxGeometry(15, 0.5, 15);
        var padMat = new THREE.MeshLambertMaterial({ color: 0xDDDDDD });
        var pad = new THREE.Mesh(padGeom, padMat);
        pad.position.set(baseX + 10, 0.25, baseZ + 60);
        scene.add(pad);
        objects.push(pad);

        // H marker (two rectangles)
        var hLeftGeom = new THREE.BoxGeometry(1, 0.1, 4);
        var hMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var hLeft = new THREE.Mesh(hLeftGeom, hMat);
        hLeft.position.set(baseX + 5, 0.35, baseZ + 60);
        scene.add(hLeft);
        objects.push(hLeft);

        var hRightGeom = new THREE.BoxGeometry(1, 0.1, 4);
        var hRight = new THREE.Mesh(hRightGeom, hMat);
        hRight.position.set(baseX + 15, 0.35, baseZ + 60);
        scene.add(hRight);
        objects.push(hRight);

        var hCrossGeom = new THREE.BoxGeometry(10, 0.1, 1);
        var hCross = new THREE.Mesh(hCrossGeom, hMat);
        hCross.position.set(baseX + 10, 0.35, baseZ + 60);
        scene.add(hCross);
        objects.push(hCross);

        // Wind marker - ConeGeometry on top of pole
        var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(baseX + 10, 3, baseZ + 60);
        scene.add(pole);
        objects.push(pole);

        var coneGeom = new THREE.ConeGeometry(1.5, 2, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0xFF9900 });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(baseX + 10, 6.5, baseZ + 60);
        scene.add(cone);
        objects.push(cone);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows and depth
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(100, 80, 100);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // No animation needed for static structures
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
