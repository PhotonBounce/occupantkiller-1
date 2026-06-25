window.GighaBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        // Achamore Gardens camouflage training area
        // Box bunker 1
        var bunkerGeo1 = new THREE.BoxGeometry(8, 3, 6);
        var bunkerMat1 = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var bunker1 = new THREE.Mesh(bunkerGeo1, bunkerMat1);
        bunker1.position.set(-25, 1.5, -20);
        scene.add(bunker1);
        objects.push(bunker1);

        // Sphere tree canopy over bunker 1
        var treeGeo1 = new THREE.SphereGeometry(5, 16, 16);
        var treeMat1 = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        var tree1 = new THREE.Mesh(treeGeo1, treeMat1);
        tree1.position.set(-25, 6, -20);
        scene.add(tree1);
        objects.push(tree1);

        // Box bunker 2
        var bunkerGeo2 = new THREE.BoxGeometry(8, 3, 6);
        var bunkerMat2 = new THREE.MeshLambertMaterial({ color: 0x6b8e23 });
        var bunker2 = new THREE.Mesh(bunkerGeo2, bunkerMat2);
        bunker2.position.set(-5, 1.5, -15);
        scene.add(bunker2);
        objects.push(bunker2);

        // Sphere tree canopy over bunker 2
        var treeGeo2 = new THREE.SphereGeometry(5, 16, 16);
        var treeMat2 = new THREE.MeshLambertMaterial({ color: 0x2e8b57 });
        var tree2 = new THREE.Mesh(treeGeo2, treeMat2);
        tree2.position.set(-5, 6, -15);
        scene.add(tree2);
        objects.push(tree2);

        // Gigha Hotel command post - box building
        var hotelGeo = new THREE.BoxGeometry(12, 6, 10);
        var hotelMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var hotel = new THREE.Mesh(hotelGeo, hotelMat);
        hotel.position.set(15, 3, -10);
        scene.add(hotel);
        objects.push(hotel);

        // Beer keg ammo storage - cylinder
        var kegGeo = new THREE.CylinderGeometry(2.5, 2.5, 4, 12);
        var kegMat = new THREE.MeshLambertMaterial({ color: 0xc49b61 });
        var keg = new THREE.Mesh(kegGeo, kegMat);
        keg.position.set(25, 2, -5);
        scene.add(keg);
        objects.push(keg);

        // Ferry approach mines - sphere mines at Tayinloan crossing
        var mine1Geo = new THREE.SphereGeometry(1.5, 16, 16);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var mine1 = new THREE.Mesh(mine1Geo, mineMat);
        mine1.position.set(-20, 0.75, 20);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mine1Geo, mineMat);
        mine2.position.set(-10, 0.75, 22);
        scene.add(mine2);
        objects.push(mine2);

        var mine3 = new THREE.Mesh(mine1Geo, mineMat);
        mine3.position.set(5, 0.75, 25);
        scene.add(mine3);
        objects.push(mine3);

        // Island generator plant - box generator building
        var generatorGeo = new THREE.BoxGeometry(10, 5, 8);
        var generatorMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var generator = new THREE.Mesh(generatorGeo, generatorMat);
        generator.position.set(20, 2.5, 15);
        scene.add(generator);
        objects.push(generator);

        // Cylinder exhaust
        var exhaustGeo = new THREE.CylinderGeometry(1, 1, 8, 8);
        var exhaustMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
        exhaust.position.set(25, 8, 18);
        scene.add(exhaust);
        objects.push(exhaust);

        // Power lines - LineSegments
        var lineGeo = new THREE.BufferGeometry();
        var linePositions = new Float32Array([
            20, 9, 15,
            30, 11, 10,
            30, 11, 10,
            10, 10, 5
        ]);
        lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        var lineMat = new THREE.LineBasicMaterial({ color: 0x8b7500 });
        var powerLine = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(powerLine);
        objects.push(powerLine);

        // Coastal watch post - box clifftop hut
        var hutGeo = new THREE.BoxGeometry(6, 4, 6);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0xd2b48c });
        var hut = new THREE.Mesh(hutGeo, hutMat);
        hut.position.set(-30, 2, 10);
        scene.add(hut);
        objects.push(hut);

        // Cylinder telescope
        var telescopeGeo = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
        var telescopeMat = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
        var telescope = new THREE.Mesh(telescopeGeo, telescopeMat);
        telescope.position.set(-33, 5, 12);
        scene.add(telescope);
        objects.push(telescope);

        // Wind turbine power farm - cylinder turbine towers
        var turbine1Geo = new THREE.CylinderGeometry(1.5, 1.5, 20, 12);
        var turbineMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var turbine1 = new THREE.Mesh(turbine1Geo, turbineMat);
        turbine1.position.set(-15, 10, 0);
        scene.add(turbine1);
        objects.push(turbine1);

        // Cone blade tips
        var bladeGeo = new THREE.ConeGeometry(3, 2, 8);
        var bladeMat = new THREE.MeshLambertMaterial({ color: 0xe8e8e8 });
        var blade1 = new THREE.Mesh(bladeGeo, bladeMat);
        blade1.position.set(-15, 22, 0);
        scene.add(blade1);
        objects.push(blade1);

        // Ancient standing stone OP marker - cylinder monolith
        var stoneGeo = new THREE.CylinderGeometry(1, 1.2, 12, 8);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8b8b7a });
        var stone = new THREE.Mesh(stoneGeo, stoneMat);
        stone.position.set(0, 6, -30);
        scene.add(stone);
        objects.push(stone);

        // Sphere radar ball on top
        var radarGeo = new THREE.SphereGeometry(2, 16, 16);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0xffa500 });
        var radar = new THREE.Mesh(radarGeo, radarMat);
        radar.position.set(0, 14, -30);
        scene.add(radar);
        objects.push(radar);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate turbine blade rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.y > 20) {
                objects[i].rotation.z += delta * 0.5;
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

    return { init: init, update: update, reset: reset };
}());
