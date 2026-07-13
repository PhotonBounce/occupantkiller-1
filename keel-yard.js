window.KeelYard = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var gantryGroup = null;
    var gantryTimer = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        gantryTimer = 0;
        buildDrydock();
        buildShipHulls();
        buildGantries();
        buildWeldingBays();
        buildSupplyDocks();
        buildDefenses();
        buildWorkshops();
        setupLighting();
    }

    function buildDrydock() {
        // Large drydock pit depression - concrete walls and floor
        var drydockWidth = 80;
        var drydockLength = 150;
        var drydockDepth = 40;

        // Bottom floor
        var floorGeo = new THREE.BoxGeometry(drydockWidth, 2, drydockLength);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var floor = new THREE.Mesh(floorGeo, floorMat);
        floor.position.y = -drydockDepth;
        scene.add(floor);
        objects.push(floor);

        // North wall
        var wallGeo = new THREE.BoxGeometry(drydockWidth, drydockDepth, 3);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var northWall = new THREE.Mesh(wallGeo, wallMat);
        northWall.position.set(0, -drydockDepth / 2, -drydockLength / 2);
        scene.add(northWall);
        objects.push(northWall);

        // South wall
        var southWall = new THREE.Mesh(wallGeo, wallMat);
        southWall.position.set(0, -drydockDepth / 2, drydockLength / 2);
        scene.add(southWall);
        objects.push(southWall);

        // East wall
        var eastWallGeo = new THREE.BoxGeometry(3, drydockDepth, drydockLength);
        var eastWall = new THREE.Mesh(eastWallGeo, wallMat);
        eastWall.position.set(drydockWidth / 2, -drydockDepth / 2, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        // West wall
        var westWall = new THREE.Mesh(eastWallGeo, wallMat);
        westWall.position.set(-drydockWidth / 2, -drydockDepth / 2, 0);
        scene.add(westWall);
        objects.push(westWall);

        // Water in drydock (one section)
        var waterGeo = new THREE.BoxGeometry(30, 1, 50);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x001a4d });
        var water = new THREE.Mesh(waterGeo, waterMat);
        water.position.set(-35, -drydockDepth + 0.5, 0);
        scene.add(water);
        objects.push(water);
    }

    function buildShipHulls() {
        // Three warship keels at various construction stages

        // Ship 1 - early stage
        var keel1Geo = new THREE.BoxGeometry(6, 4, 80);
        var keelMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var keel1 = new THREE.Mesh(keel1Geo, keelMat);
        keel1.position.set(-20, -35, 0);
        scene.add(keel1);
        objects.push(keel1);

        // Keel 1 hull frames (ribs)
        for (var i = 0; i < 8; i++) {
            var frameGeo = new THREE.BoxGeometry(20, 12, 2);
            var frameMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
            var frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(-20, -28, -35 + i * 10);
            scene.add(frame);
            objects.push(frame);
        }

        // Ship 2 - mid stage
        var keel2Geo = new THREE.BoxGeometry(6, 4, 80);
        var keel2 = new THREE.Mesh(keel2Geo, keelMat);
        keel2.position.set(0, -35, 0);
        scene.add(keel2);
        objects.push(keel2);

        // Keel 2 hull frames
        for (var i = 0; i < 10; i++) {
            var frameGeo = new THREE.BoxGeometry(25, 15, 2);
            var frameMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
            var frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(0, -25, -35 + i * 8);
            scene.add(frame);
            objects.push(frame);
        }

        // Ship 3 - advanced stage
        var keel3Geo = new THREE.BoxGeometry(6, 4, 80);
        var keel3 = new THREE.Mesh(keel3Geo, keelMat);
        keel3.position.set(20, -35, 0);
        scene.add(keel3);
        objects.push(keel3);

        // Keel 3 hull frames
        for (var i = 0; i < 12; i++) {
            var frameGeo = new THREE.BoxGeometry(30, 18, 2);
            var frameMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
            var frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(20, -20, -35 + i * 7);
            scene.add(frame);
            objects.push(frame);
        }
    }

    function buildGantries() {
        // Gantry crane system - create a group for animation
        gantryGroup = new THREE.Group();
        scene.add(gantryGroup);
        objects.push(gantryGroup);

        // Gantry base legs - left side
        var legGeo = new THREE.BoxGeometry(3, 50, 3);
        var legMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var legLeft = new THREE.Mesh(legGeo, legMat);
        legLeft.position.set(-35, 15, -60);
        gantryGroup.add(legLeft);

        // Gantry base legs - right side
        var legRight = new THREE.Mesh(legGeo, legMat);
        legRight.position.set(-35, 15, 60);
        gantryGroup.add(legRight);

        // Gantry cross beam (horizontal)
        var beamGeo = new THREE.BoxGeometry(3, 3, 125);
        var beamMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(-35, 45, 0);
        gantryGroup.add(beam);

        // Lifting chain - cylinder
        var chainGeo = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
        var chainMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
        var chain = new THREE.Mesh(chainGeo, chainMat);
        chain.position.set(-35, 30, 0);
        gantryGroup.add(chain);

        // Lifting hook
        var hookGeo = new THREE.BoxGeometry(2, 3, 2);
        var hookMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var hook = new THREE.Mesh(hookGeo, hookMat);
        hook.position.set(-35, 22, 0);
        gantryGroup.add(hook);

        // Second gantry - right side
        var leg2Left = new THREE.Mesh(legGeo, legMat);
        leg2Left.position.set(35, 15, -60);
        gantryGroup.add(leg2Left);

        var leg2Right = new THREE.Mesh(legGeo, legMat);
        leg2Right.position.set(35, 15, 60);
        gantryGroup.add(leg2Right);

        var beam2 = new THREE.Mesh(beamGeo, beamMat);
        beam2.position.set(35, 45, 0);
        gantryGroup.add(beam2);

        var chain2 = new THREE.Mesh(chainGeo, chainMat);
        chain2.position.set(35, 30, 0);
        gantryGroup.add(chain2);

        var hook2 = new THREE.Mesh(hookGeo, hookMat);
        hook2.position.set(35, 22, 0);
        gantryGroup.add(hook2);
    }

    function buildWeldingBays() {
        // Welding shelter structures over hull sections

        // Bay 1 roof
        var roofGeo = new THREE.BoxGeometry(25, 2, 30);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var roof1 = new THREE.Mesh(roofGeo, roofMat);
        roof1.position.set(-20, 5, -45);
        scene.add(roof1);
        objects.push(roof1);

        // Bay 1 support columns
        var colGeo = new THREE.CylinderGeometry(2, 2, 12, 8);
        var colMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var col1a = new THREE.Mesh(colGeo, colMat);
        col1a.position.set(-10, -2, -35);
        scene.add(col1a);
        objects.push(col1a);

        var col1b = new THREE.Mesh(colGeo, colMat);
        col1b.position.set(-30, -2, -35);
        scene.add(col1b);
        objects.push(col1b);

        var col1c = new THREE.Mesh(colGeo, colMat);
        col1c.position.set(-10, -2, -55);
        scene.add(col1c);
        objects.push(col1c);

        var col1d = new THREE.Mesh(colGeo, colMat);
        col1d.position.set(-30, -2, -55);
        scene.add(col1d);
        objects.push(col1d);

        // Welding sparks - sphere particles
        for (var i = 0; i < 8; i++) {
            var sparkGeo = new THREE.SphereGeometry(0.5, 4, 4);
            var sparkMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
            var spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.set(-20 + Math.random() * 10, 0 + Math.random() * 8, -45 + Math.random() * 10);
            scene.add(spark);
            objects.push(spark);
        }

        // Bay 2 roof
        var roof2 = new THREE.Mesh(roofGeo, roofMat);
        roof2.position.set(0, 5, -45);
        scene.add(roof2);
        objects.push(roof2);

        // Bay 2 support columns
        var col2a = new THREE.Mesh(colGeo, colMat);
        col2a.position.set(10, -2, -35);
        scene.add(col2a);
        objects.push(col2a);

        var col2b = new THREE.Mesh(colGeo, colMat);
        col2b.position.set(-10, -2, -35);
        scene.add(col2b);
        objects.push(col2b);

        var col2c = new THREE.Mesh(colGeo, colMat);
        col2c.position.set(10, -2, -55);
        scene.add(col2c);
        objects.push(col2c);

        var col2d = new THREE.Mesh(colGeo, colMat);
        col2d.position.set(-10, -2, -55);
        scene.add(col2d);
        objects.push(col2d);

        // Welding sparks Bay 2
        for (var i = 0; i < 8; i++) {
            var sparkGeo = new THREE.SphereGeometry(0.5, 4, 4);
            var sparkMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
            var spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.set(0 + Math.random() * 10, 0 + Math.random() * 8, -45 + Math.random() * 10);
            scene.add(spark);
            objects.push(spark);
        }

        // Bay 3 roof
        var roof3 = new THREE.Mesh(roofGeo, roofMat);
        roof3.position.set(20, 5, -45);
        scene.add(roof3);
        objects.push(roof3);

        // Bay 3 support columns
        var col3a = new THREE.Mesh(colGeo, colMat);
        col3a.position.set(30, -2, -35);
        scene.add(col3a);
        objects.push(col3a);

        var col3b = new THREE.Mesh(colGeo, colMat);
        col3b.position.set(10, -2, -35);
        scene.add(col3b);
        objects.push(col3b);

        var col3c = new THREE.Mesh(colGeo, colMat);
        col3c.position.set(30, -2, -55);
        scene.add(col3c);
        objects.push(col3c);

        var col3d = new THREE.Mesh(colGeo, colMat);
        col3d.position.set(10, -2, -55);
        scene.add(col3d);
        objects.push(col3d);

        // Welding sparks Bay 3
        for (var i = 0; i < 8; i++) {
            var sparkGeo = new THREE.SphereGeometry(0.5, 4, 4);
            var sparkMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
            var spark = new THREE.Mesh(sparkGeo, sparkMat);
            spark.position.set(20 + Math.random() * 10, 0 + Math.random() * 8, -45 + Math.random() * 10);
            scene.add(spark);
            objects.push(spark);
        }
    }

    function buildSupplyDocks() {
        // Supply dock pier
        var pierGeo = new THREE.BoxGeometry(20, 4, 30);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var pier = new THREE.Mesh(pierGeo, pierMat);
        pier.position.set(50, -10, 0);
        scene.add(pier);
        objects.push(pier);

        // Pier support posts
        var postGeo = new THREE.CylinderGeometry(2, 2, 15, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var post1 = new THREE.Mesh(postGeo, postMat);
        post1.position.set(40, -15, -10);
        scene.add(post1);
        objects.push(post1);

        var post2 = new THREE.Mesh(postGeo, postMat);
        post2.position.set(60, -15, -10);
        scene.add(post2);
        objects.push(post2);

        var post3 = new THREE.Mesh(postGeo, postMat);
        post3.position.set(40, -15, 10);
        scene.add(post3);
        objects.push(post3);

        var post4 = new THREE.Mesh(postGeo, postMat);
        post4.position.set(60, -15, 10);
        scene.add(post4);
        objects.push(post4);

        // Supply boat hull
        var boatGeo = new THREE.BoxGeometry(12, 6, 25);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var boat = new THREE.Mesh(boatGeo, boatMat);
        boat.position.set(50, -8, 0);
        scene.add(boat);
        objects.push(boat);

        // Boat cabin
        var cabinGeo = new THREE.BoxGeometry(10, 5, 8);
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var cabin = new THREE.Mesh(cabinGeo, cabinMat);
        cabin.position.set(50, 2, -5);
        scene.add(cabin);
        objects.push(cabin);

        // Mooring posts
        var moorGeo = new THREE.CylinderGeometry(1, 1, 6, 8);
        var moorMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var moor1 = new THREE.Mesh(moorGeo, moorMat);
        moor1.position.set(40, -6, 20);
        scene.add(moor1);
        objects.push(moor1);

        var moor2 = new THREE.Mesh(moorGeo, moorMat);
        moor2.position.set(60, -6, 20);
        scene.add(moor2);
        objects.push(moor2);
    }

    function buildDefenses() {
        // Military checkpoint gate
        var gateLeftGeo = new THREE.BoxGeometry(2, 12, 2);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var gateLeft = new THREE.Mesh(gateLeftGeo, gateMat);
        gateLeft.position.set(-55, 5, -70);
        scene.add(gateLeft);
        objects.push(gateLeft);

        var gateRight = new THREE.Mesh(gateLeftGeo, gateMat);
        gateRight.position.set(-55, 5, -60);
        scene.add(gateRight);
        objects.push(gateRight);

        // Gate bar
        var barGeo = new THREE.BoxGeometry(2, 2, 10);
        var barMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(-55, 12, -65);
        scene.add(bar);
        objects.push(bar);

        // Guard booth
        var boothGeo = new THREE.BoxGeometry(8, 8, 8);
        var boothMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var booth = new THREE.Mesh(boothGeo, boothMat);
        booth.position.set(-50, 2, -75);
        scene.add(booth);
        objects.push(booth);

        // Anti-aircraft gun on crane platform
        var platformGeo = new THREE.BoxGeometry(6, 2, 6);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(-35, 48, -60);
        scene.add(platform);
        objects.push(platform);

        // Gun barrel - cone shape
        var gunGeo = new THREE.ConeGeometry(1.5, 15, 8);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var gun = new THREE.Mesh(gunGeo, gunMat);
        gun.position.set(-35, 52, -60);
        gun.rotation.z = Math.PI / 2;
        scene.add(gun);
        objects.push(gun);

        // Gun mount base
        var mountGeo = new THREE.CylinderGeometry(2, 2, 2, 8);
        var mountMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var mount = new THREE.Mesh(mountGeo, mountMat);
        mount.position.set(-35, 48, -60);
        scene.add(mount);
        objects.push(mount);
    }

    function buildWorkshops() {
        // Main workshop building
        var workshopGeo = new THREE.BoxGeometry(40, 15, 25);
        var workshopMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var workshop = new THREE.Mesh(workshopGeo, workshopMat);
        workshop.position.set(-40, 0, 70);
        scene.add(workshop);
        objects.push(workshop);

        // Workshop roof
        var roofGeo = new THREE.BoxGeometry(40, 2, 25);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var wRoof = new THREE.Mesh(roofGeo, roofMat);
        wRoof.position.set(-40, 8, 70);
        scene.add(wRoof);
        objects.push(wRoof);

        // Workbenches inside
        var benchGeo = new THREE.BoxGeometry(6, 1, 4);
        var benchMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        for (var i = 0; i < 6; i++) {
            var bench = new THREE.Mesh(benchGeo, benchMat);
            bench.position.set(-45 + i * 8, 1, 65);
            scene.add(bench);
            objects.push(bench);
        }

        // Tool racks (boxes)
        var rackGeo = new THREE.BoxGeometry(4, 8, 2);
        var rackMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        for (var i = 0; i < 4; i++) {
            var rack = new THREE.Mesh(rackGeo, rackMat);
            rack.position.set(-50, 2, 60 + i * 4);
            scene.add(rack);
            objects.push(rack);
        }

        // Plate storage - stacked boxes
        var plateGeo = new THREE.BoxGeometry(15, 2, 12);
        var plateMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        for (var i = 0; i < 6; i++) {
            var plate = new THREE.Mesh(plateGeo, plateMat);
            plate.position.set(50, 0.5 + i * 2.2, 70);
            scene.add(plate);
            objects.push(plate);
        }

        // Generator bank - cylinder units
        var genGeo = new THREE.CylinderGeometry(2, 2, 6, 8);
        var genMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        for (var i = 0; i < 4; i++) {
            var gen = new THREE.Mesh(genGeo, genMat);
            gen.position.set(35 + i * 5, 2, 50);
            scene.add(gen);
            objects.push(gen);
        }

        // Generator housing
        var genHouseGeo = new THREE.BoxGeometry(22, 8, 10);
        var genHouseMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var genHouse = new THREE.Mesh(genHouseGeo, genHouseMat);
        genHouse.position.set(45, 3, 45);
        scene.add(genHouse);
        objects.push(genHouse);
    }

    function buildEnvironment() {
        // Scrap metal heap - sphere and box debris
        var heapPos = -50;
        var heapZ = 50;

        // Large debris boxes
        for (var i = 0; i < 8; i++) {
            var debrisGeo = new THREE.BoxGeometry(4 + Math.random() * 3, 3 + Math.random() * 2, 4 + Math.random() * 3);
            var debrisMat = new THREE.MeshLambertMaterial({ color: 0xaa6633 });
            var debris = new THREE.Mesh(debrisGeo, debrisMat);
            debris.position.set(heapPos + Math.random() * 10, 2 + i * 0.5, heapZ + Math.random() * 10);
            debris.rotation.set(Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5);
            scene.add(debris);
            objects.push(debris);
        }

        // Scrap spheres
        for (var i = 0; i < 10; i++) {
            var sphereGeo = new THREE.SphereGeometry(1 + Math.random() * 2, 4, 4);
            var sphereMat = new THREE.MeshLambertMaterial({ color: 0x994411 });
            var sphere = new THREE.Mesh(sphereGeo, sphereMat);
            sphere.position.set(heapPos + Math.random() * 15, 2 + Math.random() * 5, heapZ + Math.random() * 15);
            scene.add(sphere);
            objects.push(sphere);
        }

        // Ground terrain boxes (foundation pads)
        var groundGeo = new THREE.BoxGeometry(200, 1, 200);
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = -42;
        scene.add(ground);
        objects.push(ground);
    }

    function setupLighting() {
        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (sun)
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 80, 50);
        dirLight.castShadow = true;
        scene.add(dirLight);
        lights.push(dirLight);

        // Spotlight on gantry area
        var spotLight = new THREE.PointLight(0xffff00, 0.5);
        spotLight.position.set(-35, 30, 0);
        scene.add(spotLight);
        lights.push(spotLight);

        // Spotlight on welding bays (orange glow)
        var weldLight = new THREE.PointLight(0xff6600, 0.4);
        weldLight.position.set(0, 10, -45);
        scene.add(weldLight);
        lights.push(weldLight);

        // Light on supply dock
        var dockLight = new THREE.PointLight(0xcccccc, 0.3);
        dockLight.position.set(50, 15, 0);
        scene.add(dockLight);
        lights.push(dockLight);
    }

    function update(delta) {
        gantryTimer += delta;

        // Gantry crane oscillation
        if (gantryGroup !== null) {
            var oscillation = Math.sin(gantryTimer * 0.5) * 15;
            gantryGroup.position.x = oscillation;
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
        gantryGroup = null;
        scene = null;
        camera = null;
    }

    // Call buildEnvironment from init sequence
    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        gantryTimer = 0;
        buildDrydock();
        buildShipHulls();
        buildGantries();
        buildWeldingBays();
        buildSupplyDocks();
        buildDefenses();
        buildWorkshops();
        buildEnvironment();
        setupLighting();
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
