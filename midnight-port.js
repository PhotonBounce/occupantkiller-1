window.MidnightPort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animationState = {};

    function buildWarship() {
        var shipGroup = [];
        var darkGray = 0x2a2a2a;
        var steel = 0x4a4a4a;
        var orange = 0xff6600;

        // Hull - long box
        var hullGeom = new THREE.BoxGeometry(40, 8, 12);
        var hullMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(0, 4, 0);
        hull.castShadow = true;
        hull.receiveShadow = true;
        scene.add(hull);
        objects.push(hull);
        shipGroup.push(hull);

        // Bridge/Superstructure - box
        var bridgeGeom = new THREE.BoxGeometry(12, 10, 8);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: steel });
        var bridge = new THREE.Mesh(bridgeGeom, bridgeMat);
        bridge.position.set(-12, 12, 0);
        bridge.castShadow = true;
        bridge.receiveShadow = true;
        scene.add(bridge);
        objects.push(bridge);
        shipGroup.push(bridge);

        // Main turret 1 - cylinder gun
        var turretGeom = new THREE.CylinderGeometry(3, 3.5, 6, 16);
        var turretMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var turret1 = new THREE.Mesh(turretGeom, turretMat);
        turret1.position.set(8, 12, -4);
        turret1.castShadow = true;
        turret1.receiveShadow = true;
        scene.add(turret1);
        objects.push(turret1);
        shipGroup.push(turret1);

        // Main turret 2 - cylinder gun
        var turret2 = new THREE.Mesh(turretGeom, turretMat);
        turret2.position.set(-8, 12, 4);
        turret2.castShadow = true;
        turret2.receiveShadow = true;
        scene.add(turret2);
        objects.push(turret2);
        shipGroup.push(turret2);

        // Gun barrel 1 - long thin cylinder
        var barrelGeom = new THREE.CylinderGeometry(0.8, 0.8, 20, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: orange });
        var barrel1 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel1.rotation.z = Math.PI / 6;
        barrel1.position.set(8, 16, -4);
        barrel1.castShadow = true;
        scene.add(barrel1);
        objects.push(barrel1);
        shipGroup.push(barrel1);

        // Gun barrel 2
        var barrel2 = new THREE.Mesh(barrelGeom, barrelMat);
        barrel2.rotation.z = Math.PI / 6;
        barrel2.position.set(-8, 16, 4);
        barrel2.castShadow = true;
        scene.add(barrel2);
        objects.push(barrel2);
        shipGroup.push(barrel2);

        // Anchor windlass - small box
        var windlassGeom = new THREE.BoxGeometry(4, 2, 3);
        var windlassMat = new THREE.MeshLambertMaterial({ color: steel });
        var windlass = new THREE.Mesh(windlassGeom, windlassMat);
        windlass.position.set(18, 6, 0);
        windlass.castShadow = true;
        scene.add(windlass);
        objects.push(windlass);
        shipGroup.push(windlass);

        return shipGroup;
    }

    function buildLoadingCrane() {
        var craneGroup = [];
        var steel = 0x4a4a4a;
        var darkGray = 0x2a2a2a;

        // Base - large box
        var baseGeom = new THREE.BoxGeometry(8, 3, 8);
        var baseMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(0, 1.5, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        objects.push(base);
        craneGroup.push(base);

        // Mast - tall cylinder
        var mastGeom = new THREE.CylinderGeometry(1.2, 1.4, 50, 16);
        var mastMat = new THREE.MeshLambertMaterial({ color: steel });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(0, 27, 0);
        mast.castShadow = true;
        mast.receiveShadow = true;
        scene.add(mast);
        objects.push(mast);
        craneGroup.push(mast);

        // Boom arm - long box extending horizontally
        var boomGeom = new THREE.BoxGeometry(35, 2, 2);
        var boomMat = new THREE.MeshLambertMaterial({ color: steel });
        var boom = new THREE.Mesh(boomGeom, boomMat);
        boom.position.set(15, 48, 0);
        boom.castShadow = true;
        boom.receiveShadow = true;
        scene.add(boom);
        objects.push(boom);
        craneGroup.push(boom);

        // Trolley - small box on boom
        var trolleyGeom = new THREE.BoxGeometry(3, 2, 2);
        var trolleyMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var trolley = new THREE.Mesh(trolleyGeom, trolleyMat);
        trolley.position.set(10, 46, 0);
        trolley.castShadow = true;
        scene.add(trolley);
        objects.push(trolley);
        craneGroup.push(trolley);
        animationState.trolley = trolley;

        // Boom counterweight
        var counterGeom = new THREE.BoxGeometry(8, 4, 3);
        var counterMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var counter = new THREE.Mesh(counterGeom, counterMat);
        counter.position.set(-12, 46, 0);
        counter.castShadow = true;
        scene.add(counter);
        objects.push(counter);
        craneGroup.push(counter);

        // Hook cable pulley - small cylinder
        var pulleyGeom = new THREE.CylinderGeometry(0.6, 0.6, 2, 12);
        var pulleyMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var pulley = new THREE.Mesh(pulleyGeom, pulleyMat);
        pulley.rotation.z = Math.PI / 2;
        pulley.position.set(10, 44, 0);
        scene.add(pulley);
        objects.push(pulley);
        craneGroup.push(pulley);

        // Cabin - small box on mast
        var cabinGeom = new THREE.BoxGeometry(3, 3, 3);
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.position.set(-2, 42, 1.5);
        cabin.castShadow = true;
        scene.add(cabin);
        objects.push(cabin);
        craneGroup.push(cabin);

        return craneGroup;
    }

    function buildContainerStack() {
        var colors = [0xFF0000, 0x0066FF, 0xFFCC00, 0x00AA00];
        var stackGroup = [];
        var colorIndex = 0;

        for (var z = -8; z <= 8; z += 6) {
            for (var x = -8; x <= 8; x += 6) {
                for (var layer = 0; layer < 3; layer++) {
                    var color = colors[colorIndex % colors.length];
                    var containerGeom = new THREE.BoxGeometry(5, 5, 5);
                    var containerMat = new THREE.MeshLambertMaterial({ color: color });
                    var container = new THREE.Mesh(containerGeom, containerMat);
                    container.position.set(x, 2.5 + layer * 5.5, z);
                    container.castShadow = true;
                    container.receiveShadow = true;
                    scene.add(container);
                    objects.push(container);
                    stackGroup.push(container);
                    colorIndex++;
                }
            }
        }

        return stackGroup;
    }

    function buildWarehouse() {
        var warehouseGroup = [];
        var darkGray = 0x2a2a2a;
        var steel = 0x4a4a4a;

        // Main building box
        var buildingGeom = new THREE.BoxGeometry(50, 20, 30);
        var buildingMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var building = new THREE.Mesh(buildingGeom, buildingMat);
        building.position.set(0, 10, 0);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
        objects.push(building);
        warehouseGroup.push(building);

        // Roof support beams - boxes
        for (var i = 0; i < 5; i++) {
            var beamGeom = new THREE.BoxGeometry(50, 1, 2);
            var beamMat = new THREE.MeshLambertMaterial({ color: steel });
            var beam = new THREE.Mesh(beamGeom, beamMat);
            beam.position.set(0, 20 + i * 1.5, -12 + i * 6);
            beam.castShadow = true;
            scene.add(beam);
            objects.push(beam);
            warehouseGroup.push(beam);
        }

        // Door frame - tall box
        var doorGeom = new THREE.BoxGeometry(8, 15, 1);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var door = new THREE.Mesh(doorGeom, doorMat);
        door.position.set(0, 10, 15);
        door.castShadow = true;
        scene.add(door);
        objects.push(door);
        warehouseGroup.push(door);

        // Loading dock platform - large box
        var dockGeom = new THREE.BoxGeometry(50, 2, 8);
        var dockMat = new THREE.MeshLambertMaterial({ color: steel });
        var dock = new THREE.Mesh(dockGeom, dockMat);
        dock.position.set(0, 0.5, 16);
        dock.castShadow = true;
        dock.receiveShadow = true;
        scene.add(dock);
        objects.push(dock);
        warehouseGroup.push(dock);

        // Ventilation units - small boxes on roof
        for (var v = -20; v <= 20; v += 15) {
            var ventGeom = new THREE.BoxGeometry(3, 2, 3);
            var ventMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
            var vent = new THREE.Mesh(ventGeom, ventMat);
            vent.position.set(v, 20.5, 0);
            vent.castShadow = true;
            scene.add(vent);
            objects.push(vent);
            warehouseGroup.push(vent);
        }

        return warehouseGroup;
    }

    function buildDefensePosition() {
        var defenseGroup = [];
        var darkGray = 0x2a2a2a;
        var orange = 0xff6600;

        // Bunker - large box below ground
        var bunkerGeom = new THREE.BoxGeometry(12, 6, 12);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(0, 2, 0);
        bunker.castShadow = true;
        bunker.receiveShadow = true;
        scene.add(bunker);
        objects.push(bunker);
        defenseGroup.push(bunker);

        // Gun mount - cylinder turret
        var gunGeom = new THREE.CylinderGeometry(2.5, 3, 3, 16);
        var gunMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var gun = new THREE.Mesh(gunGeom, gunMat);
        gun.position.set(0, 5.5, 0);
        gun.castShadow = true;
        scene.add(gun);
        objects.push(gun);
        defenseGroup.push(gun);

        // Gun barrel - long thin cylinder
        var barrelGeom = new THREE.CylinderGeometry(0.6, 0.6, 16, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: orange });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.z = Math.PI / 8;
        barrel.position.set(0, 9, 0);
        barrel.castShadow = true;
        scene.add(barrel);
        objects.push(barrel);
        defenseGroup.push(barrel);

        // Radar dish - sphere on post
        var radarGeom = new THREE.SphereGeometry(2, 16, 12);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var radar = new THREE.Mesh(radarGeom, radarMat);
        radar.position.set(0, 9, 0);
        radar.scale.set(1.2, 0.5, 1.2);
        radar.castShadow = true;
        scene.add(radar);
        objects.push(radar);
        defenseGroup.push(radar);
        animationState.radar = radar;

        // Searchlight mount - box
        var mountGeom = new THREE.BoxGeometry(2, 2, 2);
        var mountMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var mount = new THREE.Mesh(mountGeom, mountMat);
        mount.position.set(5, 7, 0);
        mount.castShadow = true;
        scene.add(mount);
        objects.push(mount);
        defenseGroup.push(mount);

        return defenseGroup;
    }

    function buildSearchlightTower() {
        var towerGroup = [];
        var steel = 0x4a4a4a;
        var darkGray = 0x2a2a2a;

        // Tower mast - tall thin cylinder
        var mastGeom = new THREE.CylinderGeometry(0.8, 1, 35, 12);
        var mastMat = new THREE.MeshLambertMaterial({ color: steel });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(0, 18, 0);
        mast.castShadow = true;
        mast.receiveShadow = true;
        scene.add(mast);
        objects.push(mast);
        towerGroup.push(mast);

        // Searchlight housing - sphere
        var lightGeom = new THREE.SphereGeometry(1.5, 16, 12);
        var lightMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var lightHousing = new THREE.Mesh(lightGeom, lightMat);
        lightHousing.position.set(0, 35, 0);
        lightHousing.castShadow = true;
        scene.add(lightHousing);
        objects.push(lightHousing);
        towerGroup.push(lightHousing);

        // Actual searchlight - bright spotlight
        var spotlight = new THREE.SpotLight(0xFFFFFF, 1.2, 200, Math.PI / 4, 0.8, 2);
        spotlight.position.set(0, 35, 0);
        spotlight.target.position.set(50, 0, 50);
        scene.add(spotlight);
        lights.push(spotlight);
        towerGroup.push(spotlight);
        animationState.searchlight = spotlight;

        // Base platform - cylinder
        var baseGeom = new THREE.CylinderGeometry(3, 3, 2, 12);
        var baseMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(0, 0.5, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        scene.add(base);
        objects.push(base);
        towerGroup.push(base);

        return towerGroup;
    }

    function buildBuoyField() {
        var buoyGroup = [];

        for (var x = -40; x <= 40; x += 20) {
            for (var z = -40; z <= 40; z += 20) {
                // Buoy float - sphere
                var floatGeom = new THREE.SphereGeometry(1.2, 12, 10);
                var floatMat = new THREE.MeshLambertMaterial({ color: 0xFF3333 });
                var float = new THREE.Mesh(floatGeom, floatMat);
                float.position.set(x, 0.5, z);
                float.castShadow = true;
                float.receiveShadow = true;
                scene.add(float);
                objects.push(float);
                buoyGroup.push(float);

                // Buoy pole - cylinder
                var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
                var poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
                var pole = new THREE.Mesh(poleGeom, poleMat);
                pole.position.set(x, 0, z);
                pole.castShadow = true;
                scene.add(pole);
                objects.push(pole);
                buoyGroup.push(pole);
            }
        }

        return buoyGroup;
    }

    function buildPatrolBoat() {
        var boatGroup = [];
        var darkGray = 0x2a2a2a;
        var steel = 0x4a4a4a;

        // Hull - small elongated box
        var hullGeom = new THREE.BoxGeometry(12, 2, 4);
        var hullMat = new THREE.MeshLambertMaterial({ color: darkGray });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(0, 0.5, 0);
        hull.castShadow = true;
        hull.receiveShadow = true;
        scene.add(hull);
        objects.push(hull);
        boatGroup.push(hull);
        animationState.boat = hull;

        // Cabin - small box
        var cabinGeom = new THREE.BoxGeometry(3, 2.5, 2.5);
        var cabinMat = new THREE.MeshLambertMaterial({ color: steel });
        var cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.position.set(-2, 2, 0);
        cabin.castShadow = true;
        scene.add(cabin);
        objects.push(cabin);
        boatGroup.push(cabin);

        // Gun mount - small cylinder
        var gunGeom = new THREE.CylinderGeometry(1, 1, 2, 12);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var gun = new THREE.Mesh(gunGeom, gunMat);
        gun.position.set(4, 2, 0);
        gun.castShadow = true;
        scene.add(gun);
        objects.push(gun);
        boatGroup.push(gun);

        // Gun barrel
        var barrelGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.z = Math.PI / 6;
        barrel.position.set(4, 3.5, 0);
        barrel.castShadow = true;
        scene.add(barrel);
        objects.push(barrel);
        boatGroup.push(barrel);

        // Mast - thin cylinder
        var mastGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: steel });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-3, 3.5, 0);
        mast.castShadow = true;
        scene.add(mast);
        objects.push(mast);
        boatGroup.push(mast);

        return boatGroup;
    }

    function buildBollardField() {
        var bollardGroup = [];

        for (var x = -60; x <= 60; x += 15) {
            for (var z = -40; z <= 40; z += 20) {
                // Mooring post/bollard - short thick cylinder
                var bollardGeom = new THREE.CylinderGeometry(0.6, 0.8, 1.5, 12);
                var bollardMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
                var bollard = new THREE.Mesh(bollardGeom, bollardMat);
                bollard.position.set(x, 0.3, z);
                bollard.castShadow = true;
                bollard.receiveShadow = true;
                scene.add(bollard);
                objects.push(bollard);
                bollardGroup.push(bollard);
            }
        }

        return bollardGroup;
    }

    function buildFuelTanks() {
        var tankGroup = [];
        var darkGray = 0x2a2a2a;

        for (var i = 0; i < 4; i++) {
            var x = -30 + i * 20;

            // Large fuel tank - big cylinder
            var tankGeom = new THREE.CylinderGeometry(4, 4, 18, 16);
            var tankMat = new THREE.MeshLambertMaterial({ color: darkGray });
            var tank = new THREE.Mesh(tankGeom, tankMat);
            tank.position.set(x, 9, 50);
            tank.castShadow = true;
            tank.receiveShadow = true;
            scene.add(tank);
            objects.push(tank);
            tankGroup.push(tank);

            // Tank top cap - cone
            var capGeom = new THREE.ConeGeometry(4, 3, 16);
            var capMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
            var cap = new THREE.Mesh(capGeom, capMat);
            cap.position.set(x, 19, 50);
            cap.castShadow = true;
            scene.add(cap);
            objects.push(cap);
            tankGroup.push(cap);

            // Tank platform - box
            var platGeom = new THREE.BoxGeometry(2, 1, 2);
            var platMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            var plat = new THREE.Mesh(platGeom, platMat);
            plat.position.set(x + 4.5, 3, 50);
            plat.castShadow = true;
            scene.add(plat);
            objects.push(plat);
            tankGroup.push(plat);
        }

        return tankGroup;
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animationState = {};

        var ambientLight = new THREE.AmbientLight(0x333366, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(100, 80, 100);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 300;
        directionalLight.shadow.camera.left = -150;
        directionalLight.shadow.camera.right = 150;
        directionalLight.shadow.camera.top = 150;
        directionalLight.shadow.camera.bottom = -150;
        scene.add(directionalLight);
        lights.push(directionalLight);

        // Water surface - using boxes instead of plane
        var waterGeom = new THREE.BoxGeometry(200, 0.5, 200);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x001a33 });
        var water = new THREE.Mesh(waterGeom, waterMat);
        water.position.set(0, -0.25, 0);
        water.receiveShadow = true;
        scene.add(water);
        objects.push(water);

        // Build all structures
        buildWarship();
        buildLoadingCrane();
        buildContainerStack();
        buildWarehouse();
        buildDefensePosition();
        buildSearchlightTower();
        buildBuoyField();
        buildPatrolBoat();
        buildBollardField();
        buildFuelTanks();

        // Additional defensive structures
        var crane2 = buildLoadingCrane();
        for (var i = 0; i < crane2.length; i++) {
            crane2[i].position.x += 80;
        }

        var warehouse2 = buildWarehouse();
        for (var j = 0; j < warehouse2.length; j++) {
            warehouse2[j].position.x -= 80;
            warehouse2[j].position.z += 40;
        }

        var tower2 = buildSearchlightTower();
        for (var k = 0; k < tower2.length; k++) {
            tower2[k].position.x += 60;
            tower2[k].position.z -= 50;
        }

        var defense2 = buildDefensePosition();
        for (var m = 0; m < defense2.length; m++) {
            defense2[m].position.x -= 60;
            defense2[m].position.z += 50;
        }
    }

    function update(delta) {
        // Searchlight rotation
        if (animationState.searchlight) {
            animationState.searchlight.position.x = Math.sin(Date.now() * 0.001) * 30;
            animationState.searchlight.position.z = Math.cos(Date.now() * 0.001) * 30;
            if (animationState.searchlight.target) {
                animationState.searchlight.target.position.x = animationState.searchlight.position.x + 50;
                animationState.searchlight.target.position.z = animationState.searchlight.position.z + 50;
            }
        }

        // Boat bobbing
        if (animationState.boat) {
            var baseY = 0.5;
            animationState.boat.position.y = baseY + Math.sin(Date.now() * 0.002) * 0.5;
        }

        // Radar spinning
        if (animationState.radar) {
            animationState.radar.rotation.y += 0.02;
        }

        // Trolley back and forth
        if (animationState.trolley) {
            var baseX = 10;
            animationState.trolley.position.x = baseX + Math.sin(Date.now() * 0.0008) * 8;
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
        animationState = {};
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
