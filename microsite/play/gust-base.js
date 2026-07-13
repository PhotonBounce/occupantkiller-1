window.GustBase = (function() {
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
        // Ground control building (concrete bunker)
        var bunkerGeom = new THREE.BoxGeometry(20, 8, 15);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(-25, 4, -20);
        bunker.castShadow = true;
        scene.add(bunker);
        objects.push(bunker);

        // Main radar dish support pole
        var radarPoleGeom = new THREE.CylinderGeometry(1.5, 1.8, 12, 16);
        var radarPoleMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var radarPole = new THREE.Mesh(radarPoleGeom, radarPoleMat);
        radarPole.position.set(15, 6, 10);
        radarPole.castShadow = true;
        scene.add(radarPole);
        objects.push(radarPole);

        // Radar dish (spherical approximation with box segments)
        var radarDishGeom = new THREE.SphereGeometry(5, 12, 8);
        var radarDishMat = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        var radarDish = new THREE.Mesh(radarDishGeom, radarDishMat);
        radarDish.position.set(15, 18, 10);
        radarDish.scale.z = 0.3;
        radarDish.castShadow = true;
        scene.add(radarDish);
        objects.push(radarDish);

        // Wind turbine 1 - pole
        var turbine1PoleGeom = new THREE.CylinderGeometry(0.8, 1.0, 16, 12);
        var turbineMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
        var turbine1Pole = new THREE.Mesh(turbine1PoleGeom, turbineMat);
        turbine1Pole.position.set(-15, 8, 25);
        turbine1Pole.castShadow = true;
        scene.add(turbine1Pole);
        objects.push(turbine1Pole);

        // Wind turbine 1 - blade 1
        var turbineBladeGeom = new THREE.BoxGeometry(2, 12, 0.3);
        var turbineBladeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var turbine1Blade1 = new THREE.Mesh(turbineBladeGeom, turbineBladeMat);
        turbine1Blade1.position.set(-15, 20, 25);
        turbine1Blade1.castShadow = true;
        scene.add(turbine1Blade1);
        objects.push(turbine1Blade1);

        // Wind turbine 1 - blade 2
        var turbine1Blade2 = new THREE.Mesh(turbineBladeGeom, turbineBladeMat);
        turbine1Blade2.position.set(-15, 20, 25);
        turbine1Blade2.rotation.z = Math.PI / 3;
        turbine1Blade2.castShadow = true;
        scene.add(turbine1Blade2);
        objects.push(turbine1Blade2);

        // Wind turbine 1 - blade 3
        var turbine1Blade3 = new THREE.Mesh(turbineBladeGeom, turbineBladeMat);
        turbine1Blade3.position.set(-15, 20, 25);
        turbine1Blade3.rotation.z = (2 * Math.PI) / 3;
        turbine1Blade3.castShadow = true;
        scene.add(turbine1Blade3);
        objects.push(turbine1Blade3);

        // Communication antenna mast
        var antennaMastGeom = new THREE.CylinderGeometry(0.3, 0.4, 14, 8);
        var antennaMat = new THREE.MeshLambertMaterial({ color: 0xaa0000 });
        var antennaMast = new THREE.Mesh(antennaMastGeom, antennaMat);
        antennaMast.position.set(5, 7, -15);
        antennaMast.castShadow = true;
        scene.add(antennaMast);
        objects.push(antennaMast);

        // Antenna tip sphere
        var antennaTipGeom = new THREE.SphereGeometry(0.4, 8, 8);
        var antennaTipMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var antennaTip = new THREE.Mesh(antennaTipGeom, antennaTipMat);
        antennaTip.position.set(5, 18.5, -15);
        antennaTip.castShadow = true;
        scene.add(antennaTip);
        objects.push(antennaTip);

        // Storage container 1
        var containerGeom = new THREE.BoxGeometry(8, 6, 10);
        var containerMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
        var container1 = new THREE.Mesh(containerGeom, containerMat);
        container1.position.set(-5, 3, 5);
        container1.castShadow = true;
        scene.add(container1);
        objects.push(container1);

        // Storage container 2
        var container2 = new THREE.Mesh(containerGeom, containerMat);
        container2.position.set(8, 3, 8);
        container2.castShadow = true;
        scene.add(container2);
        objects.push(container2);

        // Hardened defense cone turret
        var turretConeGeom = new THREE.ConeGeometry(3, 6, 16);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var turret = new THREE.Mesh(turretConeGeom, turretMat);
        turret.position.set(22, 3, -8);
        turret.castShadow = true;
        scene.add(turret);
        objects.push(turret);

        // Lookout tower - cylindrical
        var towerGeom = new THREE.CylinderGeometry(2, 2.5, 10, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(-20, 5, 15);
        tower.castShadow = true;
        scene.add(tower);
        objects.push(tower);

        // Tower observation sphere
        var obsGeom = new THREE.SphereGeometry(1.2, 10, 10);
        var obsMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var obsGlobe = new THREE.Mesh(obsGeom, obsMat);
        obsGlobe.position.set(-20, 13, 15);
        obsGlobe.castShadow = true;
        scene.add(obsGlobe);
        objects.push(obsGlobe);

        // Secondary radar dome
        var secondaryDomeGeom = new THREE.SphereGeometry(3, 10, 8);
        var secondaryDomeMat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
        var secondaryDome = new THREE.Mesh(secondaryDomeGeom, secondaryDomeMat);
        secondaryDome.position.set(28, 4, 5);
        secondaryDome.scale.z = 0.4;
        secondaryDome.castShadow = true;
        scene.add(secondaryDome);
        objects.push(secondaryDome);

        // Command center core box
        var commandGeom = new THREE.BoxGeometry(12, 7, 16);
        var commandMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var commandCenter = new THREE.Mesh(commandGeom, commandMat);
        commandCenter.position.set(10, 3.5, 20);
        commandCenter.castShadow = true;
        scene.add(commandCenter);
        objects.push(commandCenter);

        // Reinforced storage - cone form (blast-resistant)
        var blastGeom = new THREE.ConeGeometry(2.5, 5, 12);
        var blastMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var blastStorage = new THREE.Mesh(blastGeom, blastMat);
        blastStorage.position.set(-8, 2.5, -25);
        blastStorage.castShadow = true;
        scene.add(blastStorage);
        objects.push(blastStorage);

        // Main ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light (storm-driven wind)
        var directionalLight = new THREE.DirectionalLight(0xccccff, 0.8);
        directionalLight.position.set(20, 25, 15);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate radar dish rotation
        if (objects.length > 2 && objects[2]) {
            objects[2].rotation.y += delta * 0.5;
        }
        // Animate wind turbine blades
        if (objects.length > 4 && objects[4]) {
            objects[4].rotation.z += delta * 1.2;
        }
        if (objects.length > 5 && objects[5]) {
            objects[5].rotation.z += delta * 1.2;
        }
        if (objects.length > 6 && objects[6]) {
            objects[6].rotation.z += delta * 1.2;
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
