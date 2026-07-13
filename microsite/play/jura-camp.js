window.JuraCamp = (function() {
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
        var brownMat = new THREE.MeshLambertMaterial({color: 0x8B6F47});
        var grayMat = new THREE.MeshLambertMaterial({color: 0x808080});
        var darkGreenMat = new THREE.MeshLambertMaterial({color: 0x2d5016});
        var lightBlueMat = new THREE.MeshLambertMaterial({color: 0x6ba3d4});
        var redMat = new THREE.MeshLambertMaterial({color: 0xcc0000});
        var goldMat = new THREE.MeshLambertMaterial({color: 0xdaa520});
        var blackMat = new THREE.MeshLambertMaterial({color: 0x1a1a1a});

        // Three Paps of Jura - three large cone peaks
        var papGeo1 = new THREE.ConeGeometry(8, 25, 32);
        var pap1 = new THREE.Mesh(papGeo1, darkGreenMat);
        pap1.position.set(-20, 0, -20);
        scene.add(pap1);
        objects.push(pap1);

        var papGeo2 = new THREE.ConeGeometry(9, 28, 32);
        var pap2 = new THREE.Mesh(papGeo2, darkGreenMat);
        pap2.position.set(0, 0, -25);
        scene.add(pap2);
        objects.push(pap2);

        var papGeo3 = new THREE.ConeGeometry(7, 23, 32);
        var pap3 = new THREE.Mesh(papGeo3, darkGreenMat);
        pap3.position.set(22, 0, -18);
        scene.add(pap3);
        objects.push(pap3);

        // Jura distillery - box distillery buildings
        var distillery1Geo = new THREE.BoxGeometry(6, 5, 8);
        var distillery1 = new THREE.Mesh(distillery1Geo, brownMat);
        distillery1.position.set(-15, 2.5, 8);
        scene.add(distillery1);
        objects.push(distillery1);

        var distillery2Geo = new THREE.BoxGeometry(5, 6, 6);
        var distillery2 = new THREE.Mesh(distillery2Geo, brownMat);
        distillery2.position.set(-8, 3, 10);
        scene.add(distillery2);
        objects.push(distillery2);

        // Cylinder pot still towers for distillery
        var potStillGeo1 = new THREE.CylinderGeometry(1.5, 1.8, 12, 16);
        var potStill1 = new THREE.Mesh(potStillGeo1, goldMat);
        potStill1.position.set(-14, 6, 8);
        scene.add(potStill1);
        objects.push(potStill1);

        var potStillGeo2 = new THREE.CylinderGeometry(1.2, 1.5, 10, 16);
        var potStill2 = new THREE.Mesh(potStillGeo2, goldMat);
        potStill2.position.set(-9, 5, 11);
        scene.add(potStill2);
        objects.push(potStill2);

        // Corryvreckan whirlpool observation point - box clifftop OP
        var cliffOPGeo = new THREE.BoxGeometry(7, 4, 9);
        var cliffOP = new THREE.Mesh(cliffOPGeo, grayMat);
        cliffOP.position.set(18, 2, 5);
        scene.add(cliffOP);
        objects.push(cliffOP);

        // Whirlpool markers - sphere markers in sea
        var whirlpoolGeo1 = new THREE.SphereGeometry(2, 16, 16);
        var whirlpool1 = new THREE.Mesh(whirlpoolGeo1, lightBlueMat);
        whirlpool1.position.set(20, 0.5, 15);
        scene.add(whirlpool1);
        objects.push(whirlpool1);

        var whirlpoolGeo2 = new THREE.SphereGeometry(1.8, 16, 16);
        var whirlpool2 = new THREE.Mesh(whirlpoolGeo2, lightBlueMat);
        whirlpool2.position.set(25, 0.3, 18);
        scene.add(whirlpool2);
        objects.push(whirlpool2);

        // Red deer herd stampede trap - box deer pen
        var deerPenGeo = new THREE.BoxGeometry(10, 3, 12);
        var deerPen = new THREE.Mesh(deerPenGeo, brownMat);
        deerPen.position.set(-5, 1.5, -8);
        scene.add(deerPen);
        objects.push(deerPen);

        // Antlers marker - cone antlers
        var antlerGeo = new THREE.ConeGeometry(1, 6, 8);
        var antler = new THREE.Mesh(antlerGeo, redMat);
        antler.position.set(-5, 4.5, -8);
        scene.add(antler);
        objects.push(antler);

        // George Orwell's Barnhill farmhouse - box farmhouse
        var farmhouseGeo = new THREE.BoxGeometry(8, 6, 10);
        var farmhouse = new THREE.Mesh(farmhouseGeo, brownMat);
        farmhouse.position.set(10, 3, -12);
        scene.add(farmhouse);
        objects.push(farmhouse);

        // Farmhouse outbuilding - box outbuildings
        var outbuildingGeo = new THREE.BoxGeometry(5, 4, 6);
        var outbuilding = new THREE.Mesh(outbuildingGeo, brownMat);
        outbuilding.position.set(16, 2, -14);
        scene.add(outbuilding);
        objects.push(outbuilding);

        // Island road ambush - box passing place boxes every 100m in line
        var passPlace1Geo = new THREE.BoxGeometry(4, 0.5, 4);
        var passPlace1 = new THREE.Mesh(passPlace1Geo, grayMat);
        passPlace1.position.set(-25, 0.25, 0);
        scene.add(passPlace1);
        objects.push(passPlace1);

        var passPlace2Geo = new THREE.BoxGeometry(4, 0.5, 4);
        var passPlace2 = new THREE.Mesh(passPlace2Geo, grayMat);
        passPlace2.position.set(0, 0.25, 0);
        scene.add(passPlace2);
        objects.push(passPlace2);

        // Emergency radio relay - cylinder tower on cone peak apex
        var radioConeGeo = new THREE.ConeGeometry(6, 18, 32);
        var radioCone = new THREE.Mesh(radioConeGeo, blackMat);
        radioCone.position.set(-28, 0, 25);
        scene.add(radioCone);
        objects.push(radioCone);

        var radioTowerGeo = new THREE.CylinderGeometry(0.8, 0.8, 14, 12);
        var radioTower = new THREE.Mesh(radioTowerGeo, blackMat);
        radioTower.position.set(-28, 13, 25);
        scene.add(radioTower);
        objects.push(radioTower);

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
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.y > -50) {
                objects[i].position.y -= 0.01 * delta;
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

    return {init: init, update: update, reset: reset};
}());
