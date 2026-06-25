window.MullCamp = (function() {
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
        // Mull rugged box highland terrain
        var terrainGeom = new THREE.BoxGeometry(80, 15, 80);
        var terrainMat = new THREE.MeshLambertMaterial({ color: 0x4a5a2a });
        var terrain = new THREE.Mesh(terrainGeom, terrainMat);
        terrain.position.set(0, -10, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Duart Castle keep (box)
        var keepGeom = new THREE.BoxGeometry(20, 25, 20);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var keep = new THREE.Mesh(keepGeom, keepMat);
        keep.position.set(-25, 5, -20);
        scene.add(keep);
        objects.push(keep);

        // Duart Castle outer walls (box)
        var wallGeom = new THREE.BoxGeometry(50, 12, 50);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8b6434 });
        var walls = new THREE.Mesh(wallGeom, wallMat);
        walls.position.set(-25, 0, -20);
        scene.add(walls);
        objects.push(walls);

        // Duart Castle corner tower 1 (cylinder)
        var towerGeom = new THREE.CylinderGeometry(6, 6, 20, 8);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
        var tower1 = new THREE.Mesh(towerGeom, towerMat);
        tower1.position.set(-45, 2, -40);
        scene.add(tower1);
        objects.push(tower1);

        // Duart Castle corner tower 2 (cylinder)
        var tower2 = new THREE.Mesh(towerGeom, towerMat);
        tower2.position.set(-5, 2, -40);
        scene.add(tower2);
        objects.push(tower2);

        // Tobermory Victorian townhouse 1 (box)
        var houseGeom = new THREE.BoxGeometry(12, 14, 10);
        var houseMat = new THREE.MeshLambertMaterial({ color: 0xcc8844 });
        var house1 = new THREE.Mesh(houseGeom, houseMat);
        house1.position.set(15, 2, 10);
        scene.add(house1);
        objects.push(house1);

        // Tobermory Victorian townhouse 2 (box)
        var house2 = new THREE.Mesh(houseGeom, houseMat);
        house2.position.set(30, 2, 10);
        scene.add(house2);
        objects.push(house2);

        // Tobermory distillery chimney (cylinder)
        var chimneyGeom = new THREE.CylinderGeometry(3, 3.5, 18, 12);
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
        chimney.position.set(22, 5, 25);
        scene.add(chimney);
        objects.push(chimney);

        // Tobermory fishing boat 1 (box)
        var boatGeom = new THREE.BoxGeometry(8, 4, 16);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x1a1a4d });
        var boat1 = new THREE.Mesh(boatGeom, boatMat);
        boat1.position.set(8, 1, 32);
        scene.add(boat1);
        objects.push(boat1);

        // Tobermory fishing boat 2 (box)
        var boat2 = new THREE.Mesh(boatGeom, boatMat);
        boat2.position.set(25, 1, 35);
        scene.add(boat2);
        objects.push(boat2);

        // Ben More summit blockhouse (box)
        var blockGeom = new THREE.BoxGeometry(16, 10, 16);
        var blockMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var blockhouse = new THREE.Mesh(blockGeom, blockMat);
        blockhouse.position.set(-20, 12, 20);
        scene.add(blockhouse);
        objects.push(blockhouse);

        // Ben More radio mast (cylinder)
        var mastGeom = new THREE.CylinderGeometry(1.5, 1.5, 22, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-20, 20, 20);
        scene.add(mast);
        objects.push(mast);

        // Ben More weather station (sphere)
        var weatherGeom = new THREE.SphereGeometry(3, 8, 8);
        var weatherMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var weather = new THREE.Mesh(weatherGeom, weatherMat);
        weather.position.set(-20, 26, 20);
        scene.add(weather);
        objects.push(weather);

        // Loch na Keal landing craft (box)
        var lcraftGeom = new THREE.BoxGeometry(18, 6, 12);
        var lcraftMat = new THREE.MeshLambertMaterial({ color: 0x2a4a2a });
        var lcraft = new THREE.Mesh(lcraftGeom, lcraftMat);
        lcraft.position.set(25, 1, -35);
        scene.add(lcraft);
        objects.push(lcraft);

        // Loch na Keal beach (box)
        var beachGeom = new THREE.BoxGeometry(40, 4, 20);
        var beachMat = new THREE.MeshLambertMaterial({ color: 0xccaa77 });
        var beach = new THREE.Mesh(beachGeom, beachMat);
        beach.position.set(25, -2, -35);
        scene.add(beach);
        objects.push(beach);

        // Loch na Keal RHIB inflatable (cylinder)
        var ribGeom = new THREE.CylinderGeometry(3, 3, 8, 12);
        var ribMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var rib = new THREE.Mesh(ribGeom, ribMat);
        rib.position.set(35, 2, -40);
        scene.add(rib);
        objects.push(rib);

        // Loch na Keal buoy marker 1 (sphere)
        var buoyGeom = new THREE.SphereGeometry(2, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xff3333 });
        var buoy1 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy1.position.set(15, 2, -30);
        scene.add(buoy1);
        objects.push(buoy1);

        // Loch na Keal buoy marker 2 (sphere)
        var buoy2 = new THREE.Mesh(buoyGeom, buoyMat);
        buoy2.position.set(5, 2, -45);
        scene.add(buoy2);
        objects.push(buoy2);

        // Eas Fors waterfall cliff face (box)
        var cliffGeom = new THREE.BoxGeometry(30, 35, 8);
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var cliff = new THREE.Mesh(cliffGeom, cliffMat);
        cliff.position.set(-30, 10, -25);
        scene.add(cliff);
        objects.push(cliff);

        // Eas Fors demolition charge box 1 (box)
        var chargeGeom = new THREE.BoxGeometry(3, 3, 3);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var charge1 = new THREE.Mesh(chargeGeom, chargeMat);
        charge1.position.set(-35, 15, -22);
        scene.add(charge1);
        objects.push(charge1);

        // Eas Fors demolition charge box 2 (box)
        var charge2 = new THREE.Mesh(chargeGeom, chargeMat);
        charge2.position.set(-25, 20, -22);
        scene.add(charge2);
        objects.push(charge2);

        // Eas Fors detonator wire (LineSegments)
        var wireGeom = new THREE.BufferGeometry();
        var wirePos = new Float32Array([
            -35, 15, -22,
            -25, 20, -22,
            -25, 20, -22,
            -20, 18, -20
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 });
        var wire = new THREE.LineSegments(wireGeom, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Croggan peninsula stone ruins (box)
        var ruinsGeom = new THREE.BoxGeometry(14, 8, 14);
        var ruinsMat = new THREE.MeshLambertMaterial({ color: 0x6a6a5a });
        var ruins = new THREE.Mesh(ruinsGeom, ruinsMat);
        ruins.position.set(-10, 2, 30);
        scene.add(ruins);
        objects.push(ruins);

        // Croggan elevated fire position (box)
        var fireposGeom = new THREE.BoxGeometry(12, 6, 12);
        var fireposMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var firepos = new THREE.Mesh(fireposGeom, fireposMat);
        firepos.position.set(-10, 10, 30);
        scene.add(firepos);
        objects.push(firepos);

        // Loch Spelve clifftop hide (box)
        var hideGeom = new THREE.BoxGeometry(10, 8, 10);
        var hideMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
        var hide = new THREE.Mesh(hideGeom, hideMat);
        hide.position.set(10, 8, -10);
        scene.add(hide);
        objects.push(hide);

        // Loch Spelve sonar array (LineSegments)
        var sonarGeom = new THREE.BufferGeometry();
        var sonarPos = new Float32Array([
            10, 8, -10,
            8, 5, -12,
            10, 8, -10,
            12, 5, -12,
            10, 8, -10,
            10, 5, -14,
            10, 8, -10,
            10, 5, -8
        ]);
        sonarGeom.setAttribute('position', new THREE.BufferAttribute(sonarPos, 3));
        var sonarMat = new THREE.LineBasicMaterial({ color: 0x0099ff, linewidth: 2 });
        var sonar = new THREE.LineSegments(sonarGeom, sonarMat);
        scene.add(sonar);
        objects.push(sonar);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(40, 30, 40);
        scene.add(dirLight);
        lights.push(dirLight);

        // Ambient light
        var ambLight = new THREE.AmbientLight(0x606060, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);
    }

    function update(delta) {
        // Animate sonar array rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry instanceof THREE.BufferGeometry) {
                var positions = objects[i].geometry.attributes.position;
                if (positions && i > 20) {
                    objects[i].rotation.y += delta * 0.5;
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
