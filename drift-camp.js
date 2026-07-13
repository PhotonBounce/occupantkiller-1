window.DriftCamp = (function() {
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
        // Tent 1 - partially buried with snow drift wedge
        var tent1Geo = new THREE.BoxGeometry(4, 3, 6);
        var tent1Mat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var tent1 = new THREE.Mesh(tent1Geo, tent1Mat);
        tent1.position.set(-25, 1, -20);
        scene.add(tent1);
        objects.push(tent1);

        // Snow drift wedge 1 - cone shape covering tent
        var drift1Geo = new THREE.ConeGeometry(5, 4, 8);
        var drift1Mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var drift1 = new THREE.Mesh(drift1Geo, drift1Mat);
        drift1.position.set(-25, 2.5, -20);
        scene.add(drift1);
        objects.push(drift1);

        // Tent 2 - another buried tent
        var tent2Geo = new THREE.BoxGeometry(4, 3, 6);
        var tent2Mat = new THREE.MeshLambertMaterial({ color: 0x666633 });
        var tent2 = new THREE.Mesh(tent2Geo, tent2Mat);
        tent2.position.set(15, 1, -25);
        scene.add(tent2);
        objects.push(tent2);

        // Snow drift wedge 2
        var drift2Geo = new THREE.ConeGeometry(5, 4, 8);
        var drift2Mat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
        var drift2 = new THREE.Mesh(drift2Geo, drift2Mat);
        drift2.position.set(15, 2.5, -25);
        scene.add(drift2);
        objects.push(drift2);

        // Supply cache 1 - cylindrical container
        var cache1Geo = new THREE.CylinderGeometry(2, 2, 3, 8);
        var cache1Mat = new THREE.MeshLambertMaterial({ color: 0xff4500 });
        var cache1 = new THREE.Mesh(cache1Geo, cache1Mat);
        cache1.position.set(-15, 1.5, 10);
        scene.add(cache1);
        objects.push(cache1);

        // Supply cache 2
        var cache2Geo = new THREE.CylinderGeometry(2, 2, 3, 8);
        var cache2Mat = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        var cache2 = new THREE.Mesh(cache2Geo, cache2Mat);
        cache2.position.set(5, 1.5, 15);
        scene.add(cache2);
        objects.push(cache2);

        // Partially buried vehicle 1 - box form
        var vehicle1Geo = new THREE.BoxGeometry(5, 3, 8);
        var vehicle1Mat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var vehicle1 = new THREE.Mesh(vehicle1Geo, vehicle1Mat);
        vehicle1.position.set(20, 1.5, 5);
        scene.add(vehicle1);
        objects.push(vehicle1);

        // Snow covering vehicle 1
        var snowCover1Geo = new THREE.ConeGeometry(6, 3, 12);
        var snowCover1Mat = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
        var snowCover1 = new THREE.Mesh(snowCover1Geo, snowCover1Mat);
        snowCover1.position.set(20, 3, 5);
        scene.add(snowCover1);
        objects.push(snowCover1);

        // Partially buried vehicle 2
        var vehicle2Geo = new THREE.BoxGeometry(4, 2.5, 7);
        var vehicle2Mat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var vehicle2 = new THREE.Mesh(vehicle2Geo, vehicle2Mat);
        vehicle2.position.set(-30, 1.25, 20);
        scene.add(vehicle2);
        objects.push(vehicle2);

        // Snow covering vehicle 2
        var snowCover2Geo = new THREE.ConeGeometry(5.5, 2.5, 10);
        var snowCover2Mat = new THREE.MeshLambertMaterial({ color: 0xdcdcdc });
        var snowCover2 = new THREE.Mesh(snowCover2Geo, snowCover2Mat);
        snowCover2.position.set(-30, 2.75, 20);
        scene.add(snowCover2);
        objects.push(snowCover2);

        // Ice cave entrance - sphere partial sphere representation
        var caveSphereGeo = new THREE.SphereGeometry(6, 12, 12);
        var caveMat = new THREE.MeshLambertMaterial({ color: 0x4da6ff });
        var caveSphere = new THREE.Mesh(caveSphereGeo, caveMat);
        caveSphere.position.set(25, 4, -15);
        caveSphere.scale.set(1, 1.2, 1);
        scene.add(caveSphere);
        objects.push(caveSphere);

        // Emergency beacon tower - stacked cylinders
        var beaconBase1Geo = new THREE.CylinderGeometry(1.5, 1.5, 4, 6);
        var beaconMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        var beaconBase1 = new THREE.Mesh(beaconBase1Geo, beaconMat);
        beaconBase1.position.set(-20, 2, 25);
        scene.add(beaconBase1);
        objects.push(beaconBase1);

        // Beacon top section
        var beaconTopGeo = new THREE.ConeGeometry(1, 3, 8);
        var beaconTopMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var beaconTop = new THREE.Mesh(beaconTopGeo, beaconTopMat);
        beaconTop.position.set(-20, 5.5, 25);
        scene.add(beaconTop);
        objects.push(beaconTop);

        // Beacon sphere at top
        var beaconSphereGeo = new THREE.SphereGeometry(0.8, 8, 8);
        var beaconSphereMat = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
        var beaconSphere = new THREE.Mesh(beaconSphereGeo, beaconSphereMat);
        beaconSphere.position.set(-20, 6.5, 25);
        scene.add(beaconSphere);
        objects.push(beaconSphere);

        // Ground reference box (partially buried)
        var groundBoxGeo = new THREE.BoxGeometry(60, 0.5, 60);
        var groundMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        var groundBox = new THREE.Mesh(groundBoxGeo, groundMat);
        groundBox.position.set(0, -0.25, 0);
        scene.add(groundBox);
        objects.push(groundBox);

        // Supply crate 3 - box form
        var crate1Geo = new THREE.BoxGeometry(3, 2.5, 3);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var crate1 = new THREE.Mesh(crate1Geo, crateMat);
        crate1.position.set(10, 1.25, -10);
        scene.add(crate1);
        objects.push(crate1);

        // Snow pile 1 - cone
        var snowPile1Geo = new THREE.ConeGeometry(4, 5, 10);
        var snowPileMat = new THREE.MeshLambertMaterial({ color: 0xfffaf0 });
        var snowPile1 = new THREE.Mesh(snowPile1Geo, snowPileMat);
        snowPile1.position.set(-10, 2.5, 0);
        scene.add(snowPile1);
        objects.push(snowPile1);

        // Lighting - ambient blizzard light
        var ambientLight = new THREE.AmbientLight(0x6699cc, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Beacon emergency light
        var beaconLight = new THREE.PointLight(0xff3333, 1.5, 40);
        beaconLight.position.set(-20, 6.5, 25);
        scene.add(beaconLight);
        lights.push(beaconLight);
    }

    function update(delta) {
        // Beacon flash effect
        if (lights.length > 1) {
            var beaconLight = lights[1];
            var flashIntensity = 1.5 + 0.5 * Math.sin(delta * 5);
            beaconLight.intensity = flashIntensity;
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
