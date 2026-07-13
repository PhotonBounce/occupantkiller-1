window.Oremine = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var cartPosition = 0;
    var drillRotation = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        cartPosition = 0;
        drillRotation = 0;
        buildMineshafts();
        buildOreDeposits();
        buildEquipment();
        buildTunnels();
        buildSurface();
        buildDefenses();
        buildVentilation();
        setupLighting();
    }

    function buildMineshafts() {
        var archway1X = -40;
        var archway1Z = -50;
        var archway2X = 40;
        var archway2Z = -50;

        createShaftArchway(archway1X, archway1Z);
        createShaftArchway(archway2X, archway2Z);

        createShaftInterior(archway1X, archway1Z);
        createShaftInterior(archway2X, archway2Z);
    }

    function createShaftArchway(x, z) {
        var material = new THREE.MeshLambertMaterial({ color: 0x4A3F2F });

        var leftSide = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), material);
        leftSide.position.set(x - 6, 4, z);
        scene.add(leftSide);
        objects.push(leftSide);

        var rightSide = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), material);
        rightSide.position.set(x + 6, 4, z);
        scene.add(rightSide);
        objects.push(rightSide);

        var topArch = new THREE.Mesh(new THREE.BoxGeometry(12, 2, 2), material);
        topArch.position.set(x, 8, z);
        scene.add(topArch);
        objects.push(topArch);

        var leftCorner = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2), material);
        leftCorner.position.set(x - 5.5, 7.5, z);
        scene.add(leftCorner);
        objects.push(leftCorner);

        var rightCorner = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2), material);
        rightCorner.position.set(x + 5.5, 7.5, z);
        scene.add(rightCorner);
        objects.push(rightCorner);
    }

    function createShaftInterior(x, z) {
        var darkMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1410 });

        var tunnel1 = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 20), darkMaterial);
        tunnel1.position.set(x, 3, z - 15);
        scene.add(tunnel1);
        objects.push(tunnel1);

        var tunnel2 = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 20), darkMaterial);
        tunnel2.position.set(x, 3, z - 40);
        scene.add(tunnel2);
        objects.push(tunnel2);

        var sideTunnel = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 10), darkMaterial);
        sideTunnel.position.set(x + 15, 2.5, z - 25);
        scene.add(sideTunnel);
        objects.push(sideTunnel);
    }

    function buildOreDeposits() {
        createOreVein(0, 2, -30, 0xD4AF37);
        createOreVein(-25, 3, -40, 0xC0C0C0);
        createOreVein(25, 2, -35, 0xA0522D);
        createOreVein(-35, 4, -50, 0xD4AF37);
        createOreVein(35, 3, -50, 0xC0C0C0);
        createOreVein(0, 5, -60, 0xA0522D);
        createOreVein(-15, 2, -20, 0xD4AF37);
        createOreVein(15, 3, -25, 0xC0C0C0);
    }

    function createOreVein(x, y, z, color) {
        var material = new THREE.MeshLambertMaterial({ color: color });

        for (var i = 0; i < 4; i++) {
            var offsetX = (Math.random() - 0.5) * 8;
            var offsetY = (Math.random() - 0.5) * 4;
            var offsetZ = (Math.random() - 0.5) * 8;
            var oreSphere = new THREE.Mesh(new THREE.SphereGeometry(1.5 + Math.random(), 6, 6), material);
            oreSphere.position.set(x + offsetX, y + offsetY, z + offsetZ);
            scene.add(oreSphere);
            objects.push(oreSphere);
        }
    }

    function buildEquipment() {
        buildDrillMachinery();
        buildOreCartsWithRails();
        buildConveyorFrame();
        buildProcessingHopper();
    }

    function buildDrillMachinery() {
        var drillX = -30;
        var drillY = 6;
        var drillZ = -35;

        var housingMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var housing = new THREE.Mesh(new THREE.BoxGeometry(5, 8, 5), housingMaterial);
        housing.position.set(drillX, drillY, drillZ);
        scene.add(housing);
        objects.push(housing);

        var basePlate = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 6), housingMaterial);
        basePlate.position.set(drillX, drillY - 4.5, drillZ);
        scene.add(basePlate);
        objects.push(basePlate);

        var bitColor = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var drillBit = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 4, 8), bitColor);
        drillBit.position.set(drillX, drillY + 4, drillZ);
        drillBit.userData.isDrill = true;
        scene.add(drillBit);
        objects.push(drillBit);

        var motorBox = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), housingMaterial);
        motorBox.position.set(drillX, drillY + 6, drillZ);
        scene.add(motorBox);
        objects.push(motorBox);

        var brace1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), housingMaterial);
        brace1.position.set(drillX - 3, drillY + 2, drillZ);
        scene.add(brace1);
        objects.push(brace1);

        var brace2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 6), housingMaterial);
        brace2.position.set(drillX + 3, drillY + 2, drillZ);
        scene.add(brace2);
        objects.push(brace2);
    }

    function buildOreCartsWithRails() {
        var railStartX = -50;
        var railEndX = 50;
        var railY = 1;
        var railZ = -25;

        createRailLine(railStartX, railY, railZ, railEndX, railY, railZ);
        createRailLine(railStartX, railY - 0.3, railZ + 1.5, railEndX, railY - 0.3, railZ + 1.5);

        var cart1 = createOreCart(-20, railY + 1, railZ);
        cart1.userData.cartIndex = 0;

        var cart2 = createOreCart(0, railY + 1, railZ);
        cart2.userData.cartIndex = 1;

        var cart3 = createOreCart(20, railY + 1, railZ);
        cart3.userData.cartIndex = 2;
    }

    function createRailLine(x1, y1, z1, x2, y2, z2) {
        var geometry = new THREE.BufferGeometry();
        var points = [
            new THREE.Vector3(x1, y1, z1),
            new THREE.Vector3(x2, y2, z2)
        ];
        geometry.setFromPoints(points);
        var material = new THREE.LineBasicMaterial({ color: 0x8B7355 });
        var line = new THREE.LineSegments(geometry, material);
        scene.add(line);
        objects.push(line);
    }

    function createOreCart(x, y, z) {
        var cartMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mainCart = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 6), cartMaterial);
        mainCart.position.set(x, y, z);
        scene.add(mainCart);
        objects.push(mainCart);

        var wheelColor = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8), wheelColor);
        wheel1.rotation.z = Math.PI / 2;
        wheel1.position.set(x - 1.5, y - 1.2, z - 2);
        scene.add(wheel1);
        objects.push(wheel1);

        var wheel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8), wheelColor);
        wheel2.rotation.z = Math.PI / 2;
        wheel2.position.set(x + 1.5, y - 1.2, z - 2);
        scene.add(wheel2);
        objects.push(wheel2);

        var wheel3 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8), wheelColor);
        wheel3.rotation.z = Math.PI / 2;
        wheel3.position.set(x - 1.5, y - 1.2, z + 2);
        scene.add(wheel3);
        objects.push(wheel3);

        var wheel4 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.5, 8), wheelColor);
        wheel4.rotation.z = Math.PI / 2;
        wheel4.position.set(x + 1.5, y - 1.2, z + 2);
        scene.add(wheel4);
        objects.push(wheel4);

        var handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), cartMaterial);
        handle.position.set(x, y + 1.5, z + 3.5);
        scene.add(handle);
        objects.push(handle);

        mainCart.userData.isCart = true;
        mainCart.userData.wheels = [wheel1, wheel2, wheel3, wheel4];
        return mainCart;
    }

    function buildConveyorFrame() {
        var x = 30;
        var y = 5;
        var z = -40;

        var frameColor = new THREE.MeshLambertMaterial({ color: 0x555555 });

        var support1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 8), frameColor);
        support1.position.set(x - 5, y, z);
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 8), frameColor);
        support2.position.set(x + 5, y, z);
        scene.add(support2);
        objects.push(support2);

        var topBeam = new THREE.Mesh(new THREE.BoxGeometry(10, 1, 1), frameColor);
        topBeam.position.set(x, y + 4.5, z);
        scene.add(topBeam);
        objects.push(topBeam);

        var belt1 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 2), frameColor);
        belt1.position.set(x, y + 3, z + 3);
        scene.add(belt1);
        objects.push(belt1);

        var belt2 = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 2), frameColor);
        belt2.position.set(x, y + 3, z - 3);
        scene.add(belt2);
        objects.push(belt2);

        var crossBrace = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 7), frameColor);
        crossBrace.position.set(x, y + 2, z);
        scene.add(crossBrace);
        objects.push(crossBrace);
    }

    function buildProcessingHopper() {
        var hopperX = 50;
        var hopperY = 10;
        var hopperZ = -40;

        var hopperMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

        var topHopper = new THREE.Mesh(new THREE.ConeGeometry(4, 3, 8), hopperMaterial);
        topHopper.position.set(hopperX, hopperY, hopperZ);
        scene.add(topHopper);
        objects.push(topHopper);

        var mainBin = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), hopperMaterial);
        mainBin.position.set(hopperX, hopperY - 4, hopperZ);
        scene.add(mainBin);
        objects.push(mainBin);

        var discharge = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 4, 8), hopperMaterial);
        discharge.rotation.z = Math.PI / 6;
        discharge.position.set(hopperX + 4, hopperY - 6, hopperZ);
        scene.add(discharge);
        objects.push(discharge);
    }

    function buildTunnels() {
        buildSupportBeams(-40, -30);
        buildSupportBeams(-20, -10);
        buildSupportBeams(0, 10);
        buildSupportBeams(20, 30);
    }

    function buildSupportBeams(startX, endX) {
        var centerX = (startX + endX) / 2;
        var beamY = 3;
        var beamZ = -30;

        var postColor = new THREE.MeshLambertMaterial({ color: 0x6B4423 });

        for (var i = 0; i < 3; i++) {
            var post = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 8), postColor);
            post.position.set(centerX - 8 + i * 8, beamY, beamZ);
            scene.add(post);
            objects.push(post);
        }

        var crossBeam = new THREE.Mesh(new THREE.BoxGeometry(20, 0.8, 0.8), postColor);
        crossBeam.position.set(centerX, beamY + 3, beamZ);
        scene.add(crossBeam);
        objects.push(crossBeam);

        var sideBeam1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 8), postColor);
        sideBeam1.position.set(centerX - 10, beamY + 1, beamZ);
        scene.add(sideBeam1);
        objects.push(sideBeam1);

        var sideBeam2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 8), postColor);
        sideBeam2.position.set(centerX + 10, beamY + 1, beamZ);
        scene.add(sideBeam2);
        objects.push(sideBeam2);
    }

    function buildSurface() {
        var buildingX = 0;
        var buildingY = 0;
        var buildingZ = 30;

        var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

        var mainStructure = new THREE.Mesh(new THREE.BoxGeometry(30, 12, 20), buildingMaterial);
        mainStructure.position.set(buildingX, buildingY + 6, buildingZ);
        scene.add(mainStructure);
        objects.push(mainStructure);

        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var roof = new THREE.Mesh(new THREE.BoxGeometry(32, 2, 22), roofMaterial);
        roof.position.set(buildingX, buildingY + 13, buildingZ);
        scene.add(roof);
        objects.push(roof);

        var chimney1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 8), buildingMaterial);
        chimney1.position.set(buildingX - 8, buildingY + 13, buildingZ);
        scene.add(chimney1);
        objects.push(chimney1);

        var chimney2 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 8, 8), buildingMaterial);
        chimney2.position.set(buildingX + 8, buildingY + 13, buildingZ);
        scene.add(chimney2);
        objects.push(chimney2);

        var storageArea = new THREE.Mesh(new THREE.BoxGeometry(25, 8, 15), buildingMaterial);
        storageArea.position.set(buildingX - 20, buildingY + 4, buildingZ + 20);
        scene.add(storageArea);
        objects.push(storageArea);

        createOrePile(buildingX + 20, buildingY + 2, buildingZ + 20);
    }

    function createOrePile(x, y, z) {
        var oreMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });

        for (var i = 0; i < 6; i++) {
            var offsetX = (Math.random() - 0.5) * 12;
            var offsetY = (Math.random() - 0.5) * 4;
            var offsetZ = (Math.random() - 0.5) * 10;
            var oreMound = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random(), 6, 6), oreMaterial);
            oreMound.position.set(x + offsetX, y + offsetY, z + offsetZ);
            scene.add(oreMound);
            objects.push(oreMound);
        }
    }

    function buildDefenses() {
        buildSandbags(-60, 0);
        buildSandbags(60, 0);
        buildWirePerimeter();
        buildGuardTower();
    }

    function buildSandbags(x, z) {
        var bagMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        for (var i = 0; i < 8; i++) {
            var bag = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 2), bagMaterial);
            bag.position.set(x, 0.75 + (i % 2) * 1.5, z + (i - 3.5) * 2.5);
            scene.add(bag);
            objects.push(bag);
        }
    }

    function buildWirePerimeter() {
        var wireGeometry = new THREE.BufferGeometry();
        var wirePoints = [
            new THREE.Vector3(-70, 2, 0),
            new THREE.Vector3(70, 2, 0),
            new THREE.Vector3(70, 2, -80),
            new THREE.Vector3(-70, 2, -80),
            new THREE.Vector3(-70, 2, 0)
        ];
        wireGeometry.setFromPoints(wirePoints);
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x333333 });
        var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wire);
        objects.push(wire);
    }

    function buildVentilation() {
        var vent1 = createVentilationShaft(-40, 0, 20);
        var vent2 = createVentilationShaft(0, 0, 40);
        var vent3 = createVentilationShaft(40, 0, 15);
    }

    function createVentilationShaft(x, y, z) {
        var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

        var mainShaft = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 12, 8), ventMaterial);
        mainShaft.position.set(x, y + 6, z);
        scene.add(mainShaft);
        objects.push(mainShaft);

        var topCap = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2, 8), ventMaterial);
        topCap.position.set(x, y + 13, z);
        scene.add(topCap);
        objects.push(topCap);

        var baseFlange = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 8), ventMaterial);
        baseFlange.position.set(x, y + 0.5, z);
        scene.add(baseFlange);
        objects.push(baseFlange);

        return mainShaft;
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xcccccc, 0.7);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 30);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xffbb00, 0.6, 40);
        pointLight1.position.set(-30, 8, -35);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xff8800, 0.5, 35);
        pointLight2.position.set(50, 6, -40);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var spotLight = new THREE.SpotLight(0xffffff, 0.6);
        spotLight.position.set(0, 20, 0);
        spotLight.target.position.set(0, 0, -30);
        scene.add(spotLight);
        scene.add(spotLight.target);
        lights.push(spotLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];

            if (obj.userData.isDrill) {
                obj.rotation.y += delta * 3;
            }

            if (obj.userData.isCart) {
                cartPosition += delta * 15;
                if (cartPosition > 100) {
                    cartPosition = -100;
                }
                obj.position.x = -50 + cartPosition;

                if (obj.userData.wheels) {
                    for (var w = 0; w < obj.userData.wheels.length; w++) {
                        obj.userData.wheels[w].rotation.x += delta * 5;
                    }
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
