window.MachineShop = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var cranePosition = 0;
    var sparkParticles = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        cranePosition = 0;
        sparkParticles = [];
        buildShopFloor();
        buildMachinery();
        buildStorageRacks();
        buildControlRoom();
        buildDefenses();
        buildVehicleBay();
        buildOverhead();
        buildWeldingStation();
        setupLighting();
    }

    function buildShopFloor() {
        var floorGeom = new THREE.BoxGeometry(80, 0.5, 60);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var floor = new THREE.Mesh(floorGeom, floorMat);
        floor.position.y = -0.25;
        scene.add(floor);
        objects.push(floor);

        var greasePitGeom = new THREE.BoxGeometry(8, 1.5, 12);
        var greasePitMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var greasePit = new THREE.Mesh(greasePitGeom, greasePitMat);
        greasePit.position.set(-20, -0.5, 10);
        scene.add(greasePit);
        objects.push(greasePit);

        var greasePit2 = new THREE.Mesh(greasePitGeom, greasePitMat);
        greasePit2.position.set(20, -0.5, -15);
        scene.add(greasePit2);
        objects.push(greasePit2);

        var rustStainMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var stainGeom = new THREE.BoxGeometry(25, 0.1, 30);
        var stain = new THREE.Mesh(stainGeom, rustStainMat);
        stain.position.set(-15, 0.05, -5);
        scene.add(stain);
        objects.push(stain);
    }

    function buildMachinery() {
        buildLathe(-30, 0, 15);
        buildLathe(0, 0, 20);
        buildLathe(30, 0, 18);
        buildMillingMachine(-25, 0, -10);
        buildMillingMachine(5, 0, -5);
        buildHydraulicPress(20, 0, 10);
    }

    function buildLathe(x, y, z) {
        var baseGeom = new THREE.BoxGeometry(6, 2, 8);
        var grayMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var base = new THREE.Mesh(baseGeom, grayMat);
        base.position.set(x, y + 1, z);
        scene.add(base);
        objects.push(base);

        var spindle1Geom = new THREE.CylinderGeometry(0.8, 0.8, 3, 16);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        var spindle1 = new THREE.Mesh(spindle1Geom, metalMat);
        spindle1.position.set(x - 2, y + 3, z);
        spindle1.rotation.z = Math.PI / 2;
        scene.add(spindle1);
        objects.push(spindle1);

        var spindle2 = new THREE.Mesh(spindle1Geom, metalMat);
        spindle2.position.set(x + 2, y + 3, z);
        spindle2.rotation.z = Math.PI / 2;
        scene.add(spindle2);
        objects.push(spindle2);

        var toolPostGeom = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        var toolPost = new THREE.Mesh(toolPostGeom, grayMat);
        toolPost.position.set(x, y + 2.5, z + 3);
        scene.add(toolPost);
        objects.push(toolPost);
    }

    function buildMillingMachine(x, y, z) {
        var columnGeom = new THREE.BoxGeometry(3, 6, 3);
        var grayMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var column = new THREE.Mesh(columnGeom, grayMat);
        column.position.set(x, y + 3, z);
        scene.add(column);
        objects.push(column);

        var spindle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 2, 16),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        spindle.position.set(x, y + 5.5, z);
        scene.add(spindle);
        objects.push(spindle);

        var tableGeom = new THREE.BoxGeometry(8, 0.5, 8);
        var table = new THREE.Mesh(tableGeom, grayMat);
        table.position.set(x, y + 0.25, z);
        scene.add(table);
        objects.push(table);

        var baseGeom = new THREE.BoxGeometry(9, 1, 9);
        var base = new THREE.Mesh(baseGeom, grayMat);
        base.position.set(x, y - 0.5, z);
        scene.add(base);
        objects.push(base);
    }

    function buildHydraulicPress(x, y, z) {
        var columnGeom = new THREE.BoxGeometry(4, 5, 4);
        var grayMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var column = new THREE.Mesh(columnGeom, grayMat);
        column.position.set(x, y + 2.5, z);
        scene.add(column);
        objects.push(column);

        var ramGeom = new THREE.BoxGeometry(5, 1.5, 5);
        var ram = new THREE.Mesh(ramGeom, grayMat);
        ram.position.set(x, y + 5.5, z);
        scene.add(ram);
        objects.push(ram);

        var piston1Geom = new THREE.CylinderGeometry(0.4, 0.4, 4, 12);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        for (var i = 0; i < 4; i++) {
            var piston = new THREE.Mesh(piston1Geom, metalMat);
            piston.position.set(x - 1.5 + i, y + 2, z - 1.5 + i);
            scene.add(piston);
            objects.push(piston);
        }

        var baseGeom = new THREE.BoxGeometry(6, 0.8, 6);
        var base = new THREE.Mesh(baseGeom, grayMat);
        base.position.set(x, y - 0.4, z);
        scene.add(base);
        objects.push(base);
    }

    function buildStorageRacks() {
        buildRackUnit(-35, 0, -20);
        buildRackUnit(-35, 0, 0);
        buildRackUnit(-35, 0, 20);
        buildRackUnit(35, 0, -25);
        buildRackUnit(35, 0, 5);
    }

    function buildRackUnit(x, y, z) {
        var frameGeom = new THREE.BoxGeometry(8, 10, 6);
        var grayMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var frame = new THREE.Mesh(frameGeom, grayMat);
        frame.position.set(x, y + 5, z);
        scene.add(frame);
        objects.push(frame);

        var shelf1Geom = new THREE.BoxGeometry(7.5, 0.3, 5.5);
        for (var i = 0; i < 4; i++) {
            var shelf = new THREE.Mesh(shelf1Geom, grayMat);
            shelf.position.set(x, y + 2 + i * 2.5, z);
            scene.add(shelf);
            objects.push(shelf);
        }

        var partBox1Geom = new THREE.BoxGeometry(2, 1.5, 2);
        var parts = [
            { x: x - 2, y: y + 2.5, z: z - 1 },
            { x: x + 1, y: y + 2.5, z: z + 1 },
            { x: x - 2.5, y: y + 5, z: z },
            { x: x + 2, y: y + 5, z: z - 1.5 },
            { x: x, y: y + 7.5, z: z + 1 },
            { x: x + 2.5, y: y + 7.5, z: z - 1 }
        ];
        for (var i = 0; i < parts.length; i++) {
            var part = new THREE.Mesh(partBox1Geom, new THREE.MeshLambertMaterial({ color: 0x888888 }));
            part.position.set(parts[i].x, parts[i].y, parts[i].z);
            scene.add(part);
            objects.push(part);
        }

        var cylinderPartGeom = new THREE.CylinderGeometry(0.5, 0.5, 3, 12);
        var cpart = new THREE.Mesh(cylinderPartGeom, new THREE.MeshLambertMaterial({ color: 0xcccccc }));
        cpart.position.set(x + 1.5, y + 4, z - 2);
        cpart.rotation.z = Math.PI / 2;
        scene.add(cpart);
        objects.push(cpart);
    }

    function buildControlRoom() {
        var wallGeom = new THREE.BoxGeometry(12, 4, 8);
        var grayMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var wall = new THREE.Mesh(wallGeom, grayMat);
        wall.position.set(-35, 2, -8);
        scene.add(wall);
        objects.push(wall);

        var roofGeom = new THREE.BoxGeometry(12.5, 0.3, 8.5);
        var roof = new THREE.Mesh(roofGeom, grayMat);
        roof.position.set(-35, 4.15, -8);
        scene.add(roof);
        objects.push(roof);

        var deskGeom = new THREE.BoxGeometry(6, 0.5, 3);
        var desk = new THREE.Mesh(deskGeom, new THREE.MeshLambertMaterial({ color: 0x333333 }));
        desk.position.set(-35, 1, -8);
        scene.add(desk);
        objects.push(desk);

        var screenGeom = new THREE.BoxGeometry(4, 2.5, 0.2);
        var screen = new THREE.Mesh(screenGeom, new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
        screen.position.set(-35, 2.5, -9.5);
        scene.add(screen);
        objects.push(screen);

        var chairBackGeom = new THREE.BoxGeometry(1.5, 1.5, 0.2);
        var chairBack = new THREE.Mesh(chairBackGeom, new THREE.MeshLambertMaterial({ color: 0x444444 }));
        chairBack.position.set(-32, 1.5, -8);
        scene.add(chairBack);
        objects.push(chairBack);
    }

    function buildDefenses() {
        var toolboxGeom = new THREE.BoxGeometry(2, 1.2, 1.5);
        var rustMat = new THREE.MeshLambertMaterial({ color: 0xcc6633 });

        var configs = [
            { x: -40, y: 0, z: -25 },
            { x: 40, y: 0, z: 25 },
            { x: 0, y: 0, z: 28 },
            { x: -38, y: 0, z: 28 }
        ];

        for (var i = 0; i < configs.length; i++) {
            var toolbox = new THREE.Mesh(toolboxGeom, rustMat);
            toolbox.position.set(configs[i].x, configs[i].y, configs[i].z);
            toolbox.rotation.z = Math.random() * 0.3;
            scene.add(toolbox);
            objects.push(toolbox);

            var toolbox2 = new THREE.Mesh(toolboxGeom, rustMat);
            toolbox2.position.set(configs[i].x + 0.5, configs[i].y + 1.2, configs[i].z + 0.3);
            toolbox2.rotation.z = Math.random() * 0.3;
            scene.add(toolbox2);
            objects.push(toolbox2);

            var toolbox3 = new THREE.Mesh(toolboxGeom, rustMat);
            toolbox3.position.set(configs[i].x - 0.8, configs[i].y + 2.4, configs[i].z - 0.2);
            toolbox3.rotation.z = Math.random() * 0.3;
            scene.add(toolbox3);
            objects.push(toolbox3);
        }
    }

    function buildVehicleBay() {
        var buildingGeom = new THREE.BoxGeometry(50, 8, 30);
        var industrialMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var building = new THREE.Mesh(buildingGeom, industrialMat);
        building.position.set(0, 4, 0);
        scene.add(building);
        objects.push(building);

        var roofGeom = new THREE.BoxGeometry(52, 1, 32);
        var roof = new THREE.Mesh(roofGeom, industrialMat);
        roof.position.set(0, 8.5, 0);
        scene.add(roof);
        objects.push(roof);

        var tankHullGeom = new THREE.BoxGeometry(7, 3, 12);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
        var tankHull = new THREE.Mesh(tankHullGeom, tankMat);
        tankHull.position.set(15, 1.5, 5);
        scene.add(tankHull);
        objects.push(tankHull);

        var turretGeom = new THREE.CylinderGeometry(2, 2, 2, 8);
        var turret = new THREE.Mesh(turretGeom, tankMat);
        turret.position.set(15, 3.5, 5);
        scene.add(turret);
        objects.push(turret);

        var barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 12);
        var barrel = new THREE.Mesh(barrelGeom, tankMat);
        barrel.position.set(19, 3.5, 5);
        barrel.rotation.z = Math.PI / 2;
        scene.add(barrel);
        objects.push(barrel);

        var doorFrameGeom = new THREE.BoxGeometry(12, 0.5, 8);
        var doorFrame = new THREE.Mesh(doorFrameGeom, industrialMat);
        doorFrame.position.set(-20, 4, 13);
        scene.add(doorFrame);
        objects.push(doorFrame);

        var doorFrameSide1Geom = new THREE.BoxGeometry(0.5, 8, 8);
        var doorSide1 = new THREE.Mesh(doorFrameSide1Geom, industrialMat);
        doorSide1.position.set(-26, 4, 13);
        scene.add(doorSide1);
        objects.push(doorSide1);

        var doorSide2 = new THREE.Mesh(doorFrameSide1Geom, industrialMat);
        doorSide2.position.set(-14, 4, 13);
        scene.add(doorSide2);
        objects.push(doorSide2);
    }

    function buildWeldingStation() {
        var tableGeom = new THREE.BoxGeometry(6, 0.8, 4);
        var grayMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var table = new THREE.Mesh(tableGeom, grayMat);
        table.position.set(-10, 0.4, 15);
        scene.add(table);
        objects.push(table);

        var tank1Geom = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 12);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0xccaa00 });
        var tank1 = new THREE.Mesh(tank1Geom, metalMat);
        tank1.position.set(-12, 1.2, 16);
        scene.add(tank1);
        objects.push(tank1);

        var tank2 = new THREE.Mesh(tank1Geom, metalMat);
        tank2.position.set(-12, 1.2, 14);
        scene.add(tank2);
        objects.push(tank2);

        var hoodGeom = new THREE.BoxGeometry(7, 2, 5);
        var hood = new THREE.Mesh(hoodGeom, new THREE.MeshLambertMaterial({ color: 0x333333 }));
        hood.position.set(-10, 3, 15);
        scene.add(hood);
        objects.push(hood);

        var torchStandGeom = new THREE.BoxGeometry(0.5, 1.5, 0.5);
        var torchStand = new THREE.Mesh(torchStandGeom, grayMat);
        torchStand.position.set(-8, 0.75, 16);
        scene.add(torchStand);
        objects.push(torchStand);

        for (var i = 0; i < 20; i++) {
            var spark = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 4, 4),
                new THREE.MeshLambertMaterial({ color: 0xffaa00 })
            );
            spark.position.set(-8 + Math.random() * 0.3, 1.5 + Math.random() * 0.5, 16 + Math.random() * 0.3);
            spark.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 2
            );
            spark.life = Math.random() * 1 + 0.5;
            scene.add(spark);
            objects.push(spark);
            sparkParticles.push(spark);
        }
    }

    function buildOverhead() {
        var beamGeom = new THREE.BoxGeometry(70, 0.4, 1);
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var beam = new THREE.Mesh(beamGeom, metalMat);
        beam.position.set(0, 7.5, 0);
        scene.add(beam);
        objects.push(beam);

        var craneBaseGeom = new THREE.BoxGeometry(2, 0.3, 2);
        var craneBase = new THREE.Mesh(craneBaseGeom, metalMat);
        craneBase.position.set(-20, 7.3, 0);
        scene.add(craneBase);
        objects.push(craneBase);

        var craneHookGeom = new THREE.CylinderGeometry(0.4, 0.4, 1, 12);
        var craneHook = new THREE.Mesh(craneHookGeom, metalMat);
        craneHook.position.set(-20, 6.5, 0);
        craneHook.id = 'crane-hook';
        scene.add(craneHook);
        objects.push(craneHook);

        var cableGeom = new THREE.BoxGeometry(0.05, 1.5, 0.05);
        var cable = new THREE.Mesh(cableGeom, new THREE.MeshLambertMaterial({ color: 0x666666 }));
        cable.position.set(-20, 7, 0);
        scene.add(cable);
        objects.push(cable);

        buildToolWall();
    }

    function buildToolWall() {
        var boardGeom = new THREE.BoxGeometry(12, 6, 0.3);
        var boardMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var board = new THREE.Mesh(boardGeom, boardMat);
        board.position.set(35, 3, -14);
        scene.add(board);
        objects.push(board);

        var pegGeom = new THREE.SphereGeometry(0.15, 6, 6);
        var pegMat = new THREE.MeshLambertMaterial({ color: 0xccaa00 });
        for (var i = 0; i < 30; i++) {
            var peg = new THREE.Mesh(pegGeom, pegMat);
            peg.position.set(
                35 - 5 + Math.random() * 10,
                0.5 + Math.random() * 5,
                -13.8
            );
            scene.add(peg);
            objects.push(peg);
        }

        var line1Points = [
            new THREE.Vector3(32, 2, -13.8),
            new THREE.Vector3(38, 2, -13.8)
        ];
        var line1Geom = new THREE.BufferGeometry().setFromPoints(line1Points);
        var lineM = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
        for (var i = 0; i < 8; i++) {
            var toolLine = new THREE.LineSegments(line1Geom, lineM);
            toolLine.position.y = 1.5 + i * 0.5;
            scene.add(toolLine);
            objects.push(toolLine);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight1 = new THREE.PointLight(0xffcc99, 0.6, 30);
        pointLight1.position.set(-10, 4, 15);
        scene.add(pointLight1);
        lights.push(pointLight1);

        var pointLight2 = new THREE.PointLight(0xffaa00, 0.4, 25);
        pointLight2.position.set(15, 2, 5);
        scene.add(pointLight2);
        lights.push(pointLight2);

        var pointLight3 = new THREE.PointLight(0xaaaaff, 0.5, 40);
        pointLight3.position.set(-35, 3, 0);
        scene.add(pointLight3);
        lights.push(pointLight3);
    }

    function update(delta) {
        cranePosition += delta * 3;
        if (cranePosition > 50) {
            cranePosition = -50;
        }

        for (var i = 0; i < objects.length; i++) {
            if (objects[i].id === 'crane-hook') {
                objects[i].position.x = -20 + cranePosition;
            }
        }

        var particlesToRemove = [];
        for (var i = 0; i < sparkParticles.length; i++) {
            var spark = sparkParticles[i];
            spark.life -= delta;
            spark.position.add(spark.velocity.clone().multiplyScalar(delta));
            spark.velocity.y -= 9.8 * delta;

            if (spark.life <= 0) {
                scene.remove(spark);
                var idx = objects.indexOf(spark);
                if (idx > -1) {
                    objects.splice(idx, 1);
                }
                particlesToRemove.push(i);
            }
        }

        for (var i = particlesToRemove.length - 1; i >= 0; i--) {
            sparkParticles.splice(particlesToRemove[i], 1);
        }

        if (sparkParticles.length < 20) {
            for (var i = 0; i < 3; i++) {
                var spark = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 4, 4),
                    new THREE.MeshLambertMaterial({ color: 0xffaa00 })
                );
                spark.position.set(-8 + Math.random() * 0.3, 1.5 + Math.random() * 0.5, 16 + Math.random() * 0.3);
                spark.velocity = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    Math.random() * 1.5,
                    (Math.random() - 0.5) * 2
                );
                spark.life = Math.random() * 1 + 0.5;
                scene.add(spark);
                objects.push(spark);
                sparkParticles.push(spark);
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
        sparkParticles = [];
        scene = null;
        camera = null;
        cranePosition = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
