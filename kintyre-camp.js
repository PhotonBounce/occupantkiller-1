window.KintyreCamp = (function() {
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
        // Mull of Kintyre peninsula terrain - long narrow box
        var peninsulaGeo = new THREE.BoxGeometry(60, 2, 15);
        var peninsulaMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var peninsula = new THREE.Mesh(peninsulaGeo, peninsulaMat);
        peninsula.position.set(0, 0, 0);
        scene.add(peninsula);
        objects.push(peninsula);

        // Campbeltown airfield - box hangars
        var hangar1Geo = new THREE.BoxGeometry(12, 8, 10);
        var hangarMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var hangar1 = new THREE.Mesh(hangar1Geo, hangarMat);
        hangar1.position.set(-25, 4, -8);
        scene.add(hangar1);
        objects.push(hangar1);

        var hangar2Geo = new THREE.BoxGeometry(12, 8, 10);
        var hangar2 = new THREE.Mesh(hangar2Geo, hangarMat);
        hangar2.position.set(-25, 4, 8);
        scene.add(hangar2);
        objects.push(hangar2);

        // Campbeltown airfield - cylinder fuel tanks
        var fuelTankGeo = new THREE.CylinderGeometry(3, 3, 6, 16);
        var fuelMat = new THREE.MeshLambertMaterial({ color: 0xcc6633 });
        var fuelTank1 = new THREE.Mesh(fuelTankGeo, fuelMat);
        fuelTank1.position.set(-20, 3, -15);
        scene.add(fuelTank1);
        objects.push(fuelTank1);

        var fuelTank2 = new THREE.Mesh(fuelTankGeo, fuelMat);
        fuelTank2.position.set(-20, 3, 15);
        scene.add(fuelTank2);
        objects.push(fuelTank2);

        // Campbeltown airfield - cone marker lights
        var markerGeo = new THREE.ConeGeometry(1.5, 4, 8);
        var markerMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var marker1 = new THREE.Mesh(markerGeo, markerMat);
        marker1.position.set(-15, 2, -12);
        scene.add(marker1);
        objects.push(marker1);

        var marker2 = new THREE.Mesh(markerGeo, markerMat);
        marker2.position.set(-15, 2, 12);
        scene.add(marker2);
        objects.push(marker2);

        // Machrihanish NATO base - box runway structures
        var runwayGeo = new THREE.BoxGeometry(40, 3, 6);
        var runwayMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var runway = new THREE.Mesh(runwayGeo, runwayMat);
        runway.position.set(15, 1, 0);
        scene.add(runway);
        objects.push(runway);

        // Machrihanish - cylinder radar mast
        var radarGeo = new THREE.CylinderGeometry(1, 1, 20, 12);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var radar = new THREE.Mesh(radarGeo, radarMat);
        radar.position.set(25, 10, 5);
        scene.add(radar);
        objects.push(radar);

        // Southend Dunaverty Castle - box ruined castle on cliff
        var castleGeo = new THREE.BoxGeometry(10, 12, 10);
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var castle = new THREE.Mesh(castleGeo, castleMat);
        castle.position.set(35, 6, -20);
        scene.add(castle);
        objects.push(castle);

        // Southend - cylinder cliff column support
        var cliffGeo = new THREE.CylinderGeometry(4, 5, 15, 16);
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var cliff = new THREE.Mesh(cliffGeo, cliffMat);
        cliff.position.set(35, 7, -20);
        scene.add(cliff);
        objects.push(cliff);

        // Mull of Kintyre lighthouse - cylinder
        var lighthouseBodGeo = new THREE.CylinderGeometry(2, 2.5, 16, 16);
        var lighthouseMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var lighthouseBody = new THREE.Mesh(lighthouseBodGeo, lighthouseMat);
        lighthouseBody.position.set(30, 8, 20);
        scene.add(lighthouseBody);
        objects.push(lighthouseBody);

        // Lighthouse - cone cap
        var capGeo = new THREE.ConeGeometry(2.5, 3, 16);
        var capMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(30, 17, 20);
        scene.add(cap);
        objects.push(cap);

        // Lighthouse - box keeper cottages
        var cottageGeo = new THREE.BoxGeometry(6, 5, 6);
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0xd2691e });
        var cottage = new THREE.Mesh(cottageGeo, cottageMat);
        cottage.position.set(22, 2.5, 20);
        scene.add(cottage);
        objects.push(cottage);

        // Campbeltown Loch submarine anchorage - cylinder sub hull
        var subGeo = new THREE.CylinderGeometry(2, 2, 14, 16);
        var subMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
        var sub = new THREE.Mesh(subGeo, subMat);
        sub.position.set(-10, 1, -22);
        scene.add(sub);
        objects.push(sub);

        // Submarine - box pen shelter
        var penGeo = new THREE.BoxGeometry(20, 8, 8);
        var penMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var pen = new THREE.Mesh(penGeo, penMat);
        pen.position.set(-5, 4, -22);
        scene.add(pen);
        objects.push(pen);

        // Glen road ambush at Beinn na Lice - box stone wall barriers
        var wall1Geo = new THREE.BoxGeometry(20, 3, 1.5);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var wallLeft = new THREE.Mesh(wall1Geo, wallMat);
        wallLeft.position.set(-8, 1.5, 25);
        scene.add(wallLeft);
        objects.push(wallLeft);

        var wallRight = new THREE.Mesh(wall1Geo, wallMat);
        wallRight.position.set(8, 1.5, 25);
        scene.add(wallRight);
        objects.push(wallRight);

        // Paul McCartney High Park farmhouse - box farmhouse
        var farmhouseGeo = new THREE.BoxGeometry(8, 6, 8);
        var farmMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var farmhouse = new THREE.Mesh(farmhouseGeo, farmMat);
        farmhouse.position.set(-18, 3, 22);
        scene.add(farmhouse);
        objects.push(farmhouse);

        // High Park - cylinder water butt
        var buttGeo = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
        var buttMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var butt = new THREE.Mesh(buttGeo, buttMat);
        butt.position.set(-10, 1.5, 22);
        scene.add(butt);
        objects.push(butt);

        // High Park - sphere sheep herd markers
        var sheepGeo = new THREE.SphereGeometry(0.8, 8, 8);
        var sheepMat = new THREE.MeshLambertMaterial({ color: 0xf5f5dc });
        var sheep1 = new THREE.Mesh(sheepGeo, sheepMat);
        sheep1.position.set(-22, 1, 28);
        scene.add(sheep1);
        objects.push(sheep1);

        var sheep2 = new THREE.Mesh(sheepGeo, sheepMat);
        sheep2.position.set(-20, 1, 30);
        scene.add(sheep2);
        objects.push(sheep2);

        var sheep3 = new THREE.Mesh(sheepGeo, sheepMat);
        sheep3.position.set(-16, 1, 29);
        scene.add(sheep3);
        objects.push(sheep3);

        // Lights
        var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(30, 30, 30);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xcccccc, 0.5);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animation placeholder
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
