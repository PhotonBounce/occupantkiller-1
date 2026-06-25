window.FeochanKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Loch Feochan coastal keep environment

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        lights.push(ambientLight);
        scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 40, 20);
        lights.push(directionalLight);
        scene.add(directionalLight);

        // 1. Keep fortress tower (cylinder base)
        var keepCylinderGeo = new THREE.CylinderGeometry(8, 10, 25, 16);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var keepCylinder = new THREE.Mesh(keepCylinderGeo, keepMat);
        keepCylinder.position.set(0, 12, 0);
        objects.push(keepCylinder);
        scene.add(keepCylinder);

        // 2. Keep fortress tower cap (cone)
        var keepConeGeo = new THREE.ConeGeometry(9, 8, 16);
        var keepConeMat = new THREE.MeshLambertMaterial({ color: 0xa0522d });
        var keepCone = new THREE.Mesh(keepConeGeo, keepConeMat);
        keepCone.position.set(0, 30, 0);
        objects.push(keepCone);
        scene.add(keepCone);

        // 3. Oban sea barrier boom (long horizontal box)
        var boomGeo = new THREE.BoxGeometry(40, 2, 3);
        var boomMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        var boom = new THREE.Mesh(boomGeo, boomMat);
        boom.position.set(-5, 1, -25);
        boom.rotation.z = 0.1;
        objects.push(boom);
        scene.add(boom);

        // 4. Sea barrier anchor pylon left (cylinder)
        var pylonGeo = new THREE.CylinderGeometry(3, 4, 18, 8);
        var pylonMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var pylonLeft = new THREE.Mesh(pylonGeo, pylonMat);
        pylonLeft.position.set(-25, 9, -27);
        objects.push(pylonLeft);
        scene.add(pylonLeft);

        // 5. Sea barrier anchor pylon right (cylinder)
        var pylonRight = new THREE.Mesh(pylonGeo, pylonMat);
        pylonRight.position.set(15, 9, -27);
        objects.push(pylonRight);
        scene.add(pylonRight);

        // 6. Radar station operations hut (box)
        var hutGeo = new THREE.BoxGeometry(8, 6, 10);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var hut = new THREE.Mesh(hutGeo, hutMat);
        hut.position.set(20, 3, 15);
        objects.push(hut);
        scene.add(hut);

        // 7. Radar dish mast (cylinder)
        var mastGeo = new THREE.CylinderGeometry(1.5, 2, 16, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(20, 19, 15);
        objects.push(mast);
        scene.add(mast);

        // 8. Radar dish reflector (sphere)
        var dishGeo = new THREE.SphereGeometry(4, 16, 12);
        var dishMat = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 });
        var dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(20, 26, 15);
        dish.scale.set(1.2, 0.6, 1);
        objects.push(dish);
        scene.add(dish);

        // 9. Seaplane tender floating dock (box)
        var dockGeo = new THREE.BoxGeometry(15, 2, 12);
        var dockMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var dock = new THREE.Mesh(dockGeo, dockMat);
        dock.position.set(-20, 0.5, 12);
        objects.push(dock);
        scene.add(dock);

        // 10. Biplane fuselage (box)
        var fuselageGeo = new THREE.BoxGeometry(2, 2, 10);
        var fuselageMat = new THREE.MeshLambertMaterial({ color: 0xdc143c });
        var fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
        fuselage.position.set(-20, 4, 12);
        objects.push(fuselage);
        scene.add(fuselage);

        // 11. Engine nacelle left (cylinder)
        var nacelleGeo = new THREE.CylinderGeometry(1.2, 1.5, 4, 8);
        var nacelleMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var nacelleLeft = new THREE.Mesh(nacelleGeo, nacelleMat);
        nacelleLeft.position.set(-24, 5, 8);
        nacelleLeft.rotation.z = 1.57;
        objects.push(nacelleLeft);
        scene.add(nacelleLeft);

        // 12. Engine nacelle right (cylinder)
        var nacelleRight = new THREE.Mesh(nacelleGeo, nacelleMat);
        nacelleRight.position.set(-16, 5, 8);
        nacelleRight.rotation.z = 1.57;
        objects.push(nacelleRight);
        scene.add(nacelleRight);

        // 13. Limpet mine workshop hut (box)
        var workshopGeo = new THREE.BoxGeometry(7, 5, 8);
        var workshopMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var workshop = new THREE.Mesh(workshopGeo, workshopMat);
        workshop.position.set(8, 2.5, -15);
        objects.push(workshop);
        scene.add(workshop);

        // 14. Limpet charge storage rack (box)
        var rackGeo = new THREE.BoxGeometry(6, 8, 4);
        var rackMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var rack = new THREE.Mesh(rackGeo, rackMat);
        rack.position.set(16, 4, -18);
        objects.push(rack);
        scene.add(rack);

        // 15. Limpet charges (sphere cluster)
        var limpetGeo = new THREE.SphereGeometry(1.5, 12, 10);
        var limpetMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var limpet1 = new THREE.Mesh(limpetGeo, limpetMat);
        limpet1.position.set(13, 9, -18);
        objects.push(limpet1);
        scene.add(limpet1);

        // 16. Limpet charge 2
        var limpet2 = new THREE.Mesh(limpetGeo, limpetMat);
        limpet2.position.set(19, 9, -18);
        objects.push(limpet2);
        scene.add(limpet2);

        // 17. Rockfall obstacle boulder 1 (sphere)
        var boulderGeo = new THREE.SphereGeometry(3.5, 14, 10);
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var boulder1 = new THREE.Mesh(boulderGeo, boulderMat);
        boulder1.position.set(-18, 8, 2);
        objects.push(boulder1);
        scene.add(boulder1);

        // 18. Rockfall obstacle boulder 2 (sphere)
        var boulder2 = new THREE.Mesh(boulderGeo, boulderMat);
        boulder2.position.set(-12, 10, 4);
        objects.push(boulder2);
        scene.add(boulder2);

        // 19. Antenna station 1 (box)
        var antenna1Geo = new THREE.BoxGeometry(2, 12, 2);
        var antennaMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        var antenna1 = new THREE.Mesh(antenna1Geo, antennaMat);
        antenna1.position.set(-28, 6, 20);
        objects.push(antenna1);
        scene.add(antenna1);

        // 20. Antenna station 2 (box)
        var antenna2 = new THREE.Mesh(antenna1Geo, antennaMat);
        antenna2.position.set(28, 6, -20);
        objects.push(antenna2);
        scene.add(antenna2);

        // 21. Communication cable relay (LineSegments)
        var cableGeo = new THREE.BufferGeometry();
        var cablePositions = new Float32Array([
            -28, 15, 20,
            0, 25, 0,
            0, 25, 0,
            28, 15, -20
        ]);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cablePositions, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        var cable = new THREE.LineSegments(cableGeo, cableMat);
        objects.push(cable);
        scene.add(cable);

        // 22. Tidal generator turbine casing (cylinder)
        var turbineGeo = new THREE.CylinderGeometry(5, 6, 20, 12);
        var turbineMat = new THREE.MeshLambertMaterial({ color: 0x4169e1 });
        var turbine = new THREE.Mesh(turbineGeo, turbineMat);
        turbine.position.set(-5, 10, -30);
        turbine.rotation.z = 1.57;
        objects.push(turbine);
        scene.add(turbine);

        // 23. Tidal channel support base (box)
        var channelGeo = new THREE.BoxGeometry(12, 3, 25);
        var channelMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
        var channel = new THREE.Mesh(channelGeo, channelMat);
        channel.position.set(-5, 0.5, -28);
        objects.push(channel);
        scene.add(channel);

        // 24. Command tower secondary (cylinder)
        var towerGeo = new THREE.CylinderGeometry(4, 5, 18, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(25, 9, -8);
        objects.push(tower);
        scene.add(tower);

        // 25. Armory storage (box)
        var armoryGeo = new THREE.BoxGeometry(10, 7, 9);
        var armoryMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var armory = new THREE.Mesh(armoryGeo, armoryMat);
        armory.position.set(-12, 3.5, 25);
        objects.push(armory);
        scene.add(armory);
    }

    function update(delta) {
        // Gentle rotation for radar dish
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry &&
                objects[i].position.x > 15 && objects[i].position.x < 25) {
                objects[i].rotation.y += 0.005;
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
