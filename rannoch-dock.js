window.RannochDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        var moorlandColor = 0x3a4a2a;
        var bogColor = 0x5c4033;
        var stoneyColor = 0x7a7a7a;
        var metalColor = 0x4a4a4a;
        var woodColor = 0x8b6f47;
        var sandColor = 0xd4a574;
        var whiteColor = 0xffffff;

        // Vast moorland box terrain (base ground, multiple sections)
        var terrainGeo = new THREE.BoxGeometry(80, 2, 80);
        var terrainMat = new THREE.MeshLambertMaterial({ color: moorlandColor });
        var terrain = new THREE.Mesh(terrainGeo, terrainMat);
        terrain.position.set(0, -1, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Peat bog stepping stone 1 (flat box platform)
        var stoneGeo1 = new THREE.BoxGeometry(8, 1, 8);
        var stoneMat = new THREE.MeshLambertMaterial({ color: bogColor });
        var stone1 = new THREE.Mesh(stoneGeo1, stoneMat);
        stone1.position.set(-25, 0, -20);
        scene.add(stone1);
        objects.push(stone1);

        // Peat bog stepping stone 2
        var stoneGeo2 = new THREE.BoxGeometry(8, 1, 8);
        var stone2 = new THREE.Mesh(stoneGeo2, stoneMat);
        stone2.position.set(-10, 0, -15);
        scene.add(stone2);
        objects.push(stone2);

        // Peat bog stepping stone 3
        var stoneGeo3 = new THREE.BoxGeometry(8, 1, 8);
        var stone3 = new THREE.Mesh(stoneGeo3, stoneMat);
        stone3.position.set(5, 0, -25);
        scene.add(stone3);
        objects.push(stone3);

        // Remote resupply air-drop zone (box pad)
        var dropPadGeo = new THREE.BoxGeometry(15, 0.5, 15);
        var dropPadMat = new THREE.MeshLambertMaterial({ color: sandColor });
        var dropPad = new THREE.Mesh(dropPadGeo, dropPadMat);
        dropPad.position.set(20, 0.2, 10);
        scene.add(dropPad);
        objects.push(dropPad);

        // Sphere parachute cache above drop zone
        var cacheGeo = new THREE.SphereGeometry(3, 8, 8);
        var cacheMat = new THREE.MeshLambertMaterial({ color: whiteColor });
        var cache = new THREE.Mesh(cacheGeo, cacheMat);
        cache.position.set(20, 8, 10);
        scene.add(cache);
        objects.push(cache);

        // Isolated sniper hide (narrow box earth scrape)
        var hideGeo = new THREE.BoxGeometry(6, 1.5, 12);
        var hideMat = new THREE.MeshLambertMaterial({ color: bogColor });
        var hide = new THREE.Mesh(hideGeo, hideMat);
        hide.position.set(-30, 0.5, 8);
        scene.add(hide);
        objects.push(hide);

        // Bog-crossing corduroy road section 1 (box timber)
        var roadGeo1 = new THREE.BoxGeometry(20, 0.8, 3);
        var roadMat = new THREE.MeshLambertMaterial({ color: woodColor });
        var road1 = new THREE.Mesh(roadGeo1, roadMat);
        road1.position.set(0, 0.3, -5);
        scene.add(road1);
        objects.push(road1);

        // Bog-crossing corduroy road section 2
        var roadGeo2 = new THREE.BoxGeometry(20, 0.8, 3);
        var road2 = new THREE.Mesh(roadGeo2, roadMat);
        road2.position.set(0, 0.3, 0);
        scene.add(road2);
        objects.push(road2);

        // Bog-crossing corduroy road section 3
        var roadGeo3 = new THREE.BoxGeometry(20, 0.8, 3);
        var road3 = new THREE.Mesh(roadGeo3, roadMat);
        road3.position.set(0, 0.3, 5);
        scene.add(road3);
        objects.push(road3);

        // Emergency extraction LZ (box clearing)
        var lzGeo = new THREE.BoxGeometry(30, 0.3, 30);
        var lzMat = new THREE.MeshLambertMaterial({ color: 0xb8956a });
        var lz = new THREE.Mesh(lzGeo, lzMat);
        lz.position.set(25, -0.5, -20);
        scene.add(lz);
        objects.push(lz);

        // LZ markers using LineSegments
        var markerPointsA = new Float32Array([
            -15, 0, -15,
            15, 0, -15,
            15, 0, 15,
            -15, 0, 15,
            -15, 0, -15
        ]);
        var markerGeoA = new THREE.BufferGeometry();
        markerGeoA.setAttribute('position', new THREE.BufferAttribute(markerPointsA, 3));
        var lineMatA = new THREE.LineBasicMaterial({ color: 0xffff00 });
        var markerA = new THREE.LineSegments(markerGeoA, lineMatA);
        markerA.position.set(25, 0.5, -20);
        scene.add(markerA);
        objects.push(markerA);

        // Lone abandoned cottage strongpoint (box building)
        var cottageGeo = new THREE.BoxGeometry(12, 8, 10);
        var cottageMat = new THREE.MeshLambertMaterial({ color: stoneyColor });
        var cottage = new THREE.Mesh(cottageGeo, cottageMat);
        cottage.position.set(-20, 4, 25);
        scene.add(cottage);
        objects.push(cottage);

        // Cottage cone roof
        var roofGeo = new THREE.ConeGeometry(7, 5, 8);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(-20, 13, 25);
        scene.add(roof);
        objects.push(roof);

        // Remote signals relay tower (cylinder mast)
        var mastGeo = new THREE.CylinderGeometry(0.8, 0.8, 25, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: metalColor });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(30, 12.5, 30);
        scene.add(mast);
        objects.push(mast);

        // Tower top antenna sphere
        var antennaGeo = new THREE.SphereGeometry(1.2, 6, 6);
        var antennaMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.set(30, 26, 30);
        scene.add(antenna);
        objects.push(antenna);

        // Tower support wires using LineSegments
        var wirePointsA = new Float32Array([
            0, -12, 0,
            -8, -5, -8,
            0, -12, 0,
            8, -5, -8,
            0, -12, 0,
            -8, -5, 8,
            0, -12, 0,
            8, -5, 8
        ]);
        var wireGeoA = new THREE.BufferGeometry();
        wireGeoA.setAttribute('position', new THREE.BufferAttribute(wirePointsA, 3));
        var wireMatA = new THREE.LineBasicMaterial({ color: 0x888888 });
        var wireA = new THREE.LineSegments(wireGeoA, wireMatA);
        wireA.position.set(30, 26, 30);
        scene.add(wireA);
        objects.push(wireA);

        // Additional terrain variation - raised observation point
        var obsGeo = new THREE.BoxGeometry(10, 3, 10);
        var obsMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var obs = new THREE.Mesh(obsGeo, obsMat);
        obs.position.set(-15, 1, -30);
        scene.add(obs);
        objects.push(obs);

        // Equipment boxes scattered
        var equipGeo = new THREE.BoxGeometry(4, 3, 4);
        var equipMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var equip1 = new THREE.Mesh(equipGeo, equipMat);
        equip1.position.set(15, 1.5, 0);
        scene.add(equip1);
        objects.push(equip1);

        var equip2 = new THREE.Mesh(equipGeo, equipMat);
        equip2.position.set(-5, 1.5, 20);
        scene.add(equip2);
        objects.push(equip2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(40, 40, 40);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Gentle antenna bobbing
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].position.x > 25 && objects[i].position.z > 25) {
                    objects[i].rotation.y += 0.005;
                }
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
