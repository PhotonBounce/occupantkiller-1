window.PortlethenDock = (function() {
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
        var baseX = 460;
        var baseZ = 460;

        buildSupplyVessel(baseX - 50, 0, baseZ - 100);
        buildHeavyLiftCrane(baseX + 80, 0, baseZ - 50);
        buildPipeStorage(baseX - 80, 0, baseZ + 80);
        buildHelicopterPad(baseX + 100, 0, baseZ + 120);
        buildOperationsBuilding(baseX - 120, 0, baseZ);
        buildFuelJetty(baseX + 30, 0, baseZ + 180);
        buildSecurityCheckpoint(baseX - 150, 0, baseZ - 80);
        buildContainerStorage(baseX + 150, 0, baseZ + 40);

        addLighting();
    }

    function buildSupplyVessel(x, y, z) {
        var hull = new THREE.Mesh(
            new THREE.BoxGeometry(12, 3, 3),
            new THREE.MeshLambertMaterial({ color: 0x2C3E50 })
        );
        hull.position.set(x, y + 1.5, z);
        scene.add(hull);
        objects.push(hull);

        var superstructure = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 2.5),
            new THREE.MeshLambertMaterial({ color: 0x34495E })
        );
        superstructure.position.set(x - 3, y + 5, z);
        scene.add(superstructure);
        objects.push(superstructure);

        var cabin1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 1.5),
            new THREE.MeshLambertMaterial({ color: 0x2C3E50 })
        );
        cabin1.position.set(x - 4, y + 7.5, z + 1);
        scene.add(cabin1);
        objects.push(cabin1);

        var cabin2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 1.5),
            new THREE.MeshLambertMaterial({ color: 0x2C3E50 })
        );
        cabin2.position.set(x - 4, y + 7.5, z - 1);
        scene.add(cabin2);
        objects.push(cabin2);
    }

    function buildHeavyLiftCrane(x, y, z) {
        var post = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 30, 16),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        post.position.set(x, y + 15, z);
        scene.add(post);
        objects.push(post);

        var boom = new THREE.Mesh(
            new THREE.BoxGeometry(40, 1.5, 1.5),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        boom.position.set(x + 15, y + 28, z);
        boom.rotation.z = 0.1;
        scene.add(boom);
        objects.push(boom);

        var trolley = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 2),
            new THREE.MeshLambertMaterial({ color: 0xE6C200 })
        );
        trolley.position.set(x + 8, y + 26, z);
        scene.add(trolley);
        objects.push(trolley);

        var counterweight = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 2),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        counterweight.position.set(x - 12, y + 27, z);
        scene.add(counterweight);
        objects.push(counterweight);
    }

    function buildPipeStorage(x, y, z) {
        var pipeRadius = 0.6;
        var pipeLength = 20;
        var startX = x - 6;
        var startZ = z;
        var pipeSpacing = 2;

        for (var row = 0; row < 2; row++) {
            for (var col = 0; col < 3; col++) {
                var pipe = new THREE.Mesh(
                    new THREE.CylinderGeometry(pipeRadius, pipeRadius, pipeLength, 12),
                    new THREE.MeshLambertMaterial({ color: 0x7F8C8D })
                );
                pipe.rotation.z = Math.PI / 2;
                pipe.position.set(
                    startX + col * pipeSpacing,
                    y + 1 + row * 1.5,
                    startZ
                );
                scene.add(pipe);
                objects.push(pipe);
            }
        }
    }

    function buildHelicopterPad(x, y, z) {
        var pad = new THREE.Mesh(
            new THREE.BoxGeometry(18, 0.3, 18),
            new THREE.MeshLambertMaterial({ color: 0xFF4444 })
        );
        pad.position.set(x, y + 0.15, z);
        scene.add(pad);
        objects.push(pad);

        var hMarkingVertical = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.2, 6),
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        );
        hMarkingVertical.position.set(x, y + 0.25, z);
        scene.add(hMarkingVertical);
        objects.push(hMarkingVertical);

        var hMarkingHorizontal = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.2, 2),
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
        );
        hMarkingHorizontal.position.set(x, y + 0.25, z);
        scene.add(hMarkingHorizontal);
        objects.push(hMarkingHorizontal);

        var windsock = new THREE.Mesh(
            new THREE.ConeGeometry(1.2, 4, 8),
            new THREE.MeshLambertMaterial({ color: 0xFF6600 })
        );
        windsock.position.set(x + 10, y + 2.5, z + 10);
        windsock.rotation.z = 0.3;
        scene.add(windsock);
        objects.push(windsock);
    }

    function buildOperationsBuilding(x, y, z) {
        var building = new THREE.Mesh(
            new THREE.BoxGeometry(6, 3, 4),
            new THREE.MeshLambertMaterial({ color: 0x4444AA })
        );
        building.position.set(x, y + 1.5, z);
        scene.add(building);
        objects.push(building);

        var roof = new THREE.Mesh(
            new THREE.BoxGeometry(6.5, 0.5, 4.5),
            new THREE.MeshLambertMaterial({ color: 0x1A1A3E })
        );
        roof.position.set(x, y + 3.5, z);
        scene.add(roof);
        objects.push(roof);

        var window1 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 0.2),
            new THREE.MeshLambertMaterial({ color: 0x6666DD })
        );
        window1.position.set(x - 1.5, y + 2, z + 2.1);
        scene.add(window1);
        objects.push(window1);

        var window2 = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 0.2),
            new THREE.MeshLambertMaterial({ color: 0x6666DD })
        );
        window2.position.set(x + 1.5, y + 2, z + 2.1);
        scene.add(window2);
        objects.push(window2);
    }

    function buildFuelJetty(x, y, z) {
        var jettyDeck = new THREE.Mesh(
            new THREE.BoxGeometry(35, 0.5, 4),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        jettyDeck.position.set(x, y + 0.25, z);
        scene.add(jettyDeck);
        objects.push(jettyDeck);

        var postSpacing = 7;
        for (var i = 0; i < 5; i++) {
            var post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.5, 6, 12),
                new THREE.MeshLambertMaterial({ color: 0x8B7355 })
            );
            post.position.set(
                x - 14 + i * postSpacing,
                y - 3,
                z
            );
            scene.add(post);
            objects.push(post);
        }

        var fuelPost1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 2, 12),
            new THREE.MeshLambertMaterial({ color: 0xCCCC00 })
        );
        fuelPost1.position.set(x - 10, y + 1.5, z + 2.5);
        scene.add(fuelPost1);
        objects.push(fuelPost1);

        var fuelPost2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 2, 12),
            new THREE.MeshLambertMaterial({ color: 0xCCCC00 })
        );
        fuelPost2.position.set(x, y + 1.5, z + 2.5);
        scene.add(fuelPost2);
        objects.push(fuelPost2);

        var fuelPost3 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 2, 12),
            new THREE.MeshLambertMaterial({ color: 0xCCCC00 })
        );
        fuelPost3.position.set(x + 10, y + 1.5, z + 2.5);
        scene.add(fuelPost3);
        objects.push(fuelPost3);
    }

    function buildSecurityCheckpoint(x, y, z) {
        var booth = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2.5, 2),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        booth.position.set(x, y + 1.25, z);
        scene.add(booth);
        objects.push(booth);

        var roof = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 0.3, 2.2),
            new THREE.MeshLambertMaterial({ color: 0x1A1A1A })
        );
        roof.position.set(x, y + 2.8, z);
        scene.add(roof);
        objects.push(roof);

        var boomArm = new THREE.Mesh(
            new THREE.BoxGeometry(12, 0.4, 0.4),
            new THREE.MeshLambertMaterial({ color: 0xFF3333 })
        );
        boomArm.position.set(x + 8, y + 1.5, z);
        boomArm.rotation.z = 0.15;
        scene.add(boomArm);
        objects.push(boomArm);

        var boomPivot = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        boomPivot.rotation.z = Math.PI / 2;
        boomPivot.position.set(x + 2, y + 1.5, z);
        scene.add(boomPivot);
        objects.push(boomPivot);
    }

    function buildContainerStorage(x, y, z) {
        var colors = [0xFF5733, 0x33FF57, 0x3357FF, 0xFF33F1, 0x33FFF1, 0xFFB833, 0xB833FF, 0xF1FF33];
        var colorIndex = 0;

        for (var row = 0; row < 2; row++) {
            for (var col = 0; col < 4; col++) {
                var container = new THREE.Mesh(
                    new THREE.BoxGeometry(3, 3, 3),
                    new THREE.MeshLambertMaterial({ color: colors[colorIndex % colors.length] })
                );
                container.position.set(
                    x - 6 + col * 3.5,
                    y + 1.5 + row * 3.5,
                    z
                );
                scene.add(container);
                objects.push(container);
                colorIndex++;
            }
        }
    }

    function addLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(500, 400, 500);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight = new THREE.PointLight(0xFFB833, 0.5);
        pointLight.position.set(460 + 80, 15, 460 - 50);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
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
