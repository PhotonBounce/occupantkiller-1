window.RuinPort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animatingObjects = [];

    function createMaterial(color, emissive) {
        emissive = emissive || 0x000000;
        return new THREE.MeshLambertMaterial({ color: color, emissive: emissive });
    }

    function addObject(mesh) {
        objects.push(mesh);
        scene.add(mesh);
        return mesh;
    }

    function addLight(light) {
        lights.push(light);
        scene.add(light);
        return light;
    }

    function buildDocks() {
        var dockMat = createMaterial(0x444444);
        var seawallMat = createMaterial(0x333333);

        var mainQuay = new THREE.Mesh(new THREE.BoxGeometry(200, 8, 40), dockMat);
        mainQuay.position.set(0, -4, 0);
        addObject(mainQuay);

        var northQuay = new THREE.Mesh(new THREE.BoxGeometry(120, 6, 30), dockMat);
        northQuay.position.set(-100, -3, -60);
        addObject(northQuay);

        var southQuay = new THREE.Mesh(new THREE.BoxGeometry(120, 6, 30), dockMat);
        southQuay.position.set(100, -3, 60);
        addObject(southQuay);

        var seawall1 = new THREE.Mesh(new THREE.BoxGeometry(220, 12, 6), seawallMat);
        seawall1.position.set(0, -8, -55);
        addObject(seawall1);

        var seawall2 = new THREE.Mesh(new THREE.BoxGeometry(220, 12, 6), seawallMat);
        seawall2.position.set(0, -8, 55);
        addObject(seawall2);

        var eastWall = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 110), seawallMat);
        eastWall.position.set(110, -8, 0);
        addObject(eastWall);

        var westWall = new THREE.Mesh(new THREE.BoxGeometry(6, 12, 110), seawallMat);
        westWall.position.set(-110, -8, 0);
        addObject(westWall);
    }

    function buildHarborWater() {
        var waterMat = createMaterial(0x0a1428);
        var water = new THREE.Mesh(new THREE.BoxGeometry(280, 40, 160), waterMat);
        water.position.set(0, -60, 0);
        addObject(water);
    }

    function buildWarehouses() {
        var brickMat = createMaterial(0x5a3a1a);
        var charMat = createMaterial(0x1a0a00);

        var wh1 = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 40), brickMat);
        wh1.position.set(-50, 15, 20);
        addObject(wh1);

        var wh1Roof = new THREE.Mesh(new THREE.BoxGeometry(65, 8, 45), charMat);
        wh1Roof.position.set(-50, 38, 20);
        addObject(wh1Roof);

        var wh1Rubble1 = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 30), charMat);
        wh1Rubble1.position.set(-40, 45, 15);
        addObject(wh1Rubble1);

        var wh1Rubble2 = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 25), charMat);
        wh1Rubble2.position.set(-60, 48, 30);
        addObject(wh1Rubble2);

        var wh1Rubble3 = new THREE.Mesh(new THREE.BoxGeometry(22, 14, 28), charMat);
        wh1Rubble3.position.set(-55, 50, 5);
        addObject(wh1Rubble3);

        var wh2 = new THREE.Mesh(new THREE.BoxGeometry(70, 28, 50), brickMat);
        wh2.position.set(60, 14, -30);
        addObject(wh2);

        var wh2Roof = new THREE.Mesh(new THREE.BoxGeometry(75, 6, 55), charMat);
        wh2Roof.position.set(60, 35, -30);
        addObject(wh2Roof);

        var wh2Wall1 = new THREE.Mesh(new THREE.BoxGeometry(70, 28, 4), charMat);
        wh2Wall1.position.set(60, 14, -53);
        addObject(wh2Wall1);

        var wh3 = new THREE.Mesh(new THREE.BoxGeometry(45, 25, 35), brickMat);
        wh3.position.set(-80, 12, -50);
        addObject(wh3);

        var wh3Roof = new THREE.Mesh(new THREE.BoxGeometry(50, 5, 40), charMat);
        wh3Roof.position.set(-80, 32, -50);
        addObject(wh3Roof);
    }

    function buildShipHulks() {
        var rustMat = createMaterial(0x6b4423);
        var hullMat = createMaterial(0x3a2a1a);

        var ship1Hull = new THREE.Mesh(new THREE.BoxGeometry(80, 35, 25), hullMat);
        ship1Hull.position.set(-40, -25, -80);
        ship1Hull.rotation.z = 0.3;
        addObject(ship1Hull);

        var ship1Superstructure = new THREE.Mesh(new THREE.BoxGeometry(30, 20, 15), rustMat);
        ship1Superstructure.position.set(-20, 0, -80);
        ship1Superstructure.rotation.z = 0.3;
        addObject(ship1Superstructure);

        var ship1Deck = new THREE.Mesh(new THREE.BoxGeometry(85, 3, 28), hullMat);
        ship1Deck.position.set(-40, -12, -80);
        ship1Deck.rotation.z = 0.3;
        addObject(ship1Deck);

        var ship2Hull = new THREE.Mesh(new THREE.BoxGeometry(50, 22, 18), hullMat);
        ship2Hull.position.set(50, -30, 70);
        ship2Hull.rotation.z = -0.5;
        addObject(ship2Hull);

        var ship2Super = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 12), rustMat);
        ship2Super.position.set(65, -10, 70);
        ship2Super.rotation.z = -0.5;
        addObject(ship2Super);

        var ship2Deck = new THREE.Mesh(new THREE.BoxGeometry(52, 2, 20), hullMat);
        ship2Deck.position.set(50, -20, 70);
        ship2Deck.rotation.z = -0.5;
        addObject(ship2Deck);
    }

    function buildCranes() {
        var steelMat = createMaterial(0x454545);
        var ironMat = createMaterial(0x2a2a2a);

        var crane1Mast = new THREE.Mesh(new THREE.BoxGeometry(8, 80, 8), steelMat);
        crane1Mast.position.set(-120, 40, 10);
        addObject(crane1Mast);

        var crane1Boom = new THREE.Mesh(new THREE.BoxGeometry(60, 8, 8), steelMat);
        crane1Boom.position.set(-90, 75, 10);
        crane1Boom.rotation.z = 0.4;
        addObject(crane1Boom);

        var crane1Wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 6, 16), ironMat);
        crane1Wheel1.position.set(-140, 30, 10);
        addObject(crane1Wheel1);

        var crane1Wheel2 = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 5, 16), ironMat);
        crane1Wheel2.position.set(-100, 25, 10);
        addObject(crane1Wheel2);

        var crane2Mast = new THREE.Mesh(new THREE.BoxGeometry(10, 70, 10), steelMat);
        crane2Mast.position.set(100, 35, -40);
        crane2Mast.rotation.x = 0.15;
        addObject(crane2Mast);

        var crane2Boom = new THREE.Mesh(new THREE.BoxGeometry(50, 10, 10), steelMat);
        crane2Boom.position.set(130, 70, -40);
        crane2Boom.rotation.z = -0.3;
        addObject(crane2Boom);

        var crane2Base = new THREE.Mesh(new THREE.BoxGeometry(30, 6, 30), steelMat);
        crane2Base.position.set(100, 2, -40);
        addObject(crane2Base);
    }

    function buildHarbormaster() {
        var concreteMat = createMaterial(0x555555);
        var damageMat = createMaterial(0x333333);

        var hmBase = new THREE.Mesh(new THREE.BoxGeometry(25, 12, 25), concreteMat);
        hmBase.position.set(-20, 6, 35);
        addObject(hmBase);

        var hmLower = new THREE.Mesh(new THREE.BoxGeometry(25, 15, 25), damageMat);
        hmLower.position.set(-20, 19, 35);
        addObject(hmLower);

        var hmUpper = new THREE.Mesh(new THREE.BoxGeometry(23, 14, 23), damageMat);
        hmUpper.position.set(-20, 37, 35);
        addObject(hmUpper);

        var hmRoof = new THREE.Mesh(new THREE.BoxGeometry(26, 4, 26), concreteMat);
        hmRoof.position.set(-20, 48, 35);
        addObject(hmRoof);

        var hmDamage1 = new THREE.Mesh(new THREE.BoxGeometry(8, 12, 6), damageMat);
        hmDamage1.position.set(-8, 25, 42);
        addObject(hmDamage1);

        var hmDamage2 = new THREE.Mesh(new THREE.BoxGeometry(6, 10, 8), damageMat);
        hmDamage2.position.set(-28, 28, 40);
        addObject(hmDamage2);
    }

    function buildFuelDock() {
        var tankMat = createMaterial(0x3a3a3a);
        var baseMat = createMaterial(0x555555);

        var tank1 = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 30, 12), tankMat);
        tank1.position.set(20, 15, -60);
        addObject(tank1);

        var tank2 = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 28, 12), tankMat);
        tank2.position.set(50, 14, -65);
        addObject(tank2);

        var tank3 = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 32, 12), tankMat);
        tank3.position.set(-5, 16, -58);
        addObject(tank3);

        var spillSphere1 = new THREE.Mesh(new THREE.SphereGeometry(8, 8, 8), createMaterial(0x1a0a00));
        spillSphere1.position.set(50, 8, -75);
        addObject(spillSphere1);

        var spillSphere2 = new THREE.Mesh(new THREE.SphereGeometry(6, 8, 8), createMaterial(0x0a0a00));
        spillSphere2.position.set(35, 6, -70);
        addObject(spillSphere2);

        var platform = new THREE.Mesh(new THREE.BoxGeometry(60, 4, 40), baseMat);
        platform.position.set(30, 2, -62);
        addObject(platform);
    }

    function buildBarricades() {
        var sandbagMat = createMaterial(0x6b5a47);
        var wireMat = createMaterial(0x8b7355);

        var bag1 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), sandbagMat);
        bag1.position.set(-30, 2, -35);
        addObject(bag1);

        var bag2 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), sandbagMat);
        bag2.position.set(-20, 2, -35);
        addObject(bag2);

        var bag3 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), sandbagMat);
        bag3.position.set(-10, 2, -35);
        addObject(bag3);

        var bag4 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), sandbagMat);
        bag4.position.set(0, 2, -35);
        addObject(bag4);

        var bag5 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), sandbagMat);
        bag5.position.set(10, 2, -35);
        addObject(bag5);

        var bag6 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), sandbagMat);
        bag6.position.set(20, 2, -35);
        addObject(bag6);

        var bag7 = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 8), sandbagMat);
        bag7.position.set(30, 2, -35);
        addObject(bag7);
    }

    function buildCheckpoint() {
        var concMat = createMaterial(0x666666);
        var guardMat = createMaterial(0x444444);

        var barrier1 = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 4), concMat);
        barrier1.position.set(-20, 4, -45);
        addObject(barrier1);

        var barrier2 = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 4), concMat);
        barrier2.position.set(20, 4, -45);
        addObject(barrier2);

        var barrierTop = new THREE.Mesh(new THREE.BoxGeometry(28, 2, 6), concMat);
        barrierTop.position.set(0, 12, -45);
        addObject(barrierTop);

        var guardPost = new THREE.Mesh(new THREE.BoxGeometry(20, 16, 15), guardMat);
        guardPost.position.set(0, 8, -20);
        addObject(guardPost);

        var roof = new THREE.Mesh(new THREE.BoxGeometry(22, 4, 17), concMat);
        roof.position.set(0, 24, -20);
        addObject(roof);

        var window1 = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 2), createMaterial(0x1a1a1a));
        window1.position.set(-6, 12, -27);
        addObject(window1);

        var window2 = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 2), createMaterial(0x1a1a1a));
        window2.position.set(6, 12, -27);
        addObject(window2);
    }

    function buildRubble() {
        var rubbleMat = createMaterial(0x4a4a4a);
        var rubble1 = new THREE.Mesh(new THREE.BoxGeometry(25, 18, 20), rubbleMat);
        rubble1.position.set(-70, 20, 5);
        rubble1.rotation.z = 0.2;
        addObject(rubble1);

        var rubble2 = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 16), rubbleMat);
        rubble2.position.set(-50, 22, -5);
        rubble2.rotation.x = 0.15;
        addObject(rubble2);

        var rubble3 = new THREE.Mesh(new THREE.BoxGeometry(22, 16, 18), rubbleMat);
        rubble3.position.set(80, 18, 40);
        rubble3.rotation.z = -0.25;
        addObject(rubble3);

        var rubble4 = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 22), rubbleMat);
        rubble4.position.set(70, 15, -50);
        rubble4.rotation.x = -0.1;
        addObject(rubble4);

        var rubble5 = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 14), rubbleMat);
        rubble5.position.set(-30, 8, 50);
        rubble5.rotation.z = 0.3;
        addObject(rubble5);

        var rubble6 = new THREE.Mesh(new THREE.BoxGeometry(19, 13, 17), rubbleMat);
        rubble6.position.set(10, 12, 55);
        rubble6.rotation.x = 0.2;
        addObject(rubble6);

        var rubble7 = new THREE.Mesh(new THREE.BoxGeometry(24, 15, 20), rubbleMat);
        rubble7.position.set(-100, 14, 0);
        rubble7.rotation.z = -0.15;
        addObject(rubble7);

        var rubble8 = new THREE.Mesh(new THREE.BoxGeometry(21, 14, 19), rubbleMat);
        rubble8.position.set(100, 13, 10);
        rubble8.rotation.x = 0.12;
        addObject(rubble8);

        var debris1 = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 7), rubbleMat);
        debris1.position.set(-60, 5, -20);
        addObject(debris1);

        var debris2 = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 8), rubbleMat);
        debris2.position.set(40, 4, 30);
        addObject(debris2);

        var debris3 = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 6), rubbleMat);
        debris3.position.set(-40, 6, -60);
        addObject(debris3);

        var debris4 = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 9), rubbleMat);
        debris4.position.set(60, 3, -70);
        addObject(debris4);
    }

    function buildDebris() {
        var metalMat = createMaterial(0x5a5a5a);
        var debris = [];

        for (var i = 0; i < 12; i++) {
            var d = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 5), metalMat);
            d.position.set(-50 + Math.random() * 100, 5 + Math.random() * 10, -40 + Math.random() * 80);
            d.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            addObject(d);
            debris.push(d);
        }

        for (var j = 0; j < 12; j++) {
            var b = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 6, 8), metalMat);
            b.position.set(-40 + Math.random() * 80, 3 + Math.random() * 8, -50 + Math.random() * 90);
            b.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            addObject(b);
            debris.push(b);
        }

        return debris;
    }

    function buildBreachedTanks() {
        var tankMat = createMaterial(0x2a2a2a);
        var tanks = [];

        var tank4 = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 26, 12), tankMat);
        tank4.position.set(-15, 13, -55);
        tank4.rotation.x = 0.3;
        addObject(tank4);
        tanks.push(tank4);

        var tank5 = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 30, 12), tankMat);
        tank5.position.set(25, 15, -70);
        tank5.rotation.z = 0.25;
        addObject(tank5);
        tanks.push(tank5);

        return tanks;
    }

    function setupLighting() {
        var ambLight = new THREE.AmbientLight(0xffffff, 0.5);
        addLight(ambLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 80, 50);
        dirLight.target.position.set(0, 0, 0);
        addLight(dirLight);

        var pointLight1 = new THREE.PointLight(0xff6600, 1, 80);
        pointLight1.position.set(50, 20, -65);
        addLight(pointLight1);

        var pointLight2 = new THREE.PointLight(0xff6600, 0.8, 60);
        pointLight2.position.set(-50, 25, 10);
        addLight(pointLight2);
    }

    function setupAnimation() {
        var debris = buildDebris();
        var tanks = buildBreachedTanks();

        animatingObjects = [];

        for (var i = 0; i < debris.length; i++) {
            animatingObjects.push({
                mesh: debris[i],
                startY: debris[i].position.y,
                offsetX: Math.random() * 0.02,
                offsetY: Math.random() * 0.05,
                offsetZ: Math.random() * 0.02,
                phaseX: Math.random() * Math.PI * 2,
                phaseY: Math.random() * Math.PI * 2,
                phaseZ: Math.random() * Math.PI * 2
            });
        }

        for (var j = 0; j < tanks.length; j++) {
            animatingObjects.push({
                mesh: tanks[j],
                startRot: tanks[j].rotation.z,
                rotOffset: (Math.random() - 0.5) * 0.015
            });
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animatingObjects = [];

        buildDocks();
        buildHarborWater();
        buildWarehouses();
        buildShipHulks();
        buildCranes();
        buildHarbormaster();
        buildFuelDock();
        buildBarricades();
        buildCheckpoint();
        buildRubble();
        setupLighting();
        setupAnimation();
    }

    function update(delta) {
        var time = delta || 0;

        for (var i = 0; i < animatingObjects.length; i++) {
            var anim = animatingObjects[i];
            if (anim.startY !== undefined) {
                anim.mesh.position.y = anim.startY + Math.sin(time * anim.offsetY + anim.phaseY) * 0.5;
                anim.mesh.position.x += Math.sin(time * anim.offsetX + anim.phaseX) * 0.001;
                anim.mesh.position.z += Math.sin(time * anim.offsetZ + anim.phaseZ) * 0.001;
            } else if (anim.startRot !== undefined) {
                anim.mesh.rotation.z = anim.startRot + Math.sin(time * anim.rotOffset) * 0.02;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
        }
        objects = [];
        lights = [];
        animatingObjects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
