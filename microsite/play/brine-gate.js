window.BrineGate = (function() {
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
        buildGate();
    }

    function buildGate() {
        var whitematerial = new THREE.MeshLambertMaterial({color: 0xf5f5dc});
        var darkbluematerial = new THREE.MeshLambertMaterial({color: 0x1a3a52});
        var brownmaterial = new THREE.MeshLambertMaterial({color: 0x6b4423});
        var lightgraymaterial = new THREE.MeshLambertMaterial({color: 0xcccccc});
        var graymaterial = new THREE.MeshLambertMaterial({color: 0x888888});

        // Brine evaporation pool 1
        var pool1geom = new THREE.BoxGeometry(20, 1, 25);
        var pool1 = new THREE.Mesh(pool1geom, darkbluematerial);
        pool1.position.set(-25, 0.5, -20);
        scene.add(pool1);
        objects.push(pool1);

        // Brine evaporation pool 2
        var pool2geom = new THREE.BoxGeometry(18, 1, 20);
        var pool2 = new THREE.Mesh(pool2geom, darkbluematerial);
        pool2.position.set(20, 0.5, 15);
        scene.add(pool2);
        objects.push(pool2);

        // Salt mound pile 1 - cone
        var saltmound1geom = new THREE.ConeGeometry(8, 12, 16);
        var saltmound1 = new THREE.Mesh(saltmound1geom, whitematerial);
        saltmound1.position.set(-10, 6, 10);
        scene.add(saltmound1);
        objects.push(saltmound1);

        // Salt mound pile 2 - cone
        var saltmound2geom = new THREE.ConeGeometry(6, 10, 16);
        var saltmound2 = new THREE.Mesh(saltmound2geom, whitematerial);
        saltmound2.position.set(15, 5, -15);
        scene.add(saltmound2);
        objects.push(saltmound2);

        // Salt mound base box 1
        var saltbase1geom = new THREE.BoxGeometry(10, 2, 10);
        var saltbase1 = new THREE.Mesh(saltbase1geom, whitematerial);
        saltbase1.position.set(-5, 1, 5);
        scene.add(saltbase1);
        objects.push(saltbase1);

        // Salt mound base box 2
        var saltbase2geom = new THREE.BoxGeometry(8, 1.5, 8);
        var saltbase2 = new THREE.Mesh(saltbase2geom, whitematerial);
        saltbase2.position.set(25, 0.75, -10);
        scene.add(saltbase2);
        objects.push(saltbase2);

        // Wooden salt works building 1 - main structure
        var building1geom = new THREE.BoxGeometry(15, 8, 12);
        var building1 = new THREE.Mesh(building1geom, brownmaterial);
        building1.position.set(-20, 4, 25);
        scene.add(building1);
        objects.push(building1);

        // Wooden salt works building 2 - secondary structure
        var building2geom = new THREE.BoxGeometry(10, 6, 10);
        var building2 = new THREE.Mesh(building2geom, brownmaterial);
        building2.position.set(10, 3, 28);
        scene.add(building2);
        objects.push(building2);

        // Tidal gate control tower - main tower cylinder
        var towermaingeom = new THREE.CylinderGeometry(5, 5, 20, 16);
        var towermain = new THREE.Mesh(towermaingeom, lightgraymaterial);
        towermain.position.set(0, 10, 0);
        scene.add(towermain);
        objects.push(towermain);

        // Tower top cap - sphere
        var towertopgeom = new THREE.SphereGeometry(5.5, 16, 16);
        var towertop = new THREE.Mesh(towertopgeom, graymaterial);
        towertop.position.set(0, 20.5, 0);
        scene.add(towertop);
        objects.push(towertop);

        // Tower base support cylinder
        var towerbasegeom = new THREE.CylinderGeometry(7, 8, 3, 16);
        var towerbase = new THREE.Mesh(towerbasegeom, graymaterial);
        towerbase.position.set(0, 1.5, 0);
        scene.add(towerbase);
        objects.push(towerbase);

        // Salt encrusted surface box 1
        var surface1geom = new THREE.BoxGeometry(12, 0.5, 15);
        var surface1 = new THREE.Mesh(surface1geom, whitematerial);
        surface1.position.set(-30, 0.25, -5);
        scene.add(surface1);
        objects.push(surface1);

        // Salt encrusted surface box 2
        var surface2geom = new THREE.BoxGeometry(14, 0.5, 12);
        var surface2 = new THREE.Mesh(surface2geom, whitematerial);
        surface2.position.set(28, 0.25, 10);
        scene.add(surface2);
        objects.push(surface2);

        // Equipment structure - cylinder storage tank
        var tangeom = new THREE.CylinderGeometry(4, 4, 8, 16);
        var tank = new THREE.Mesh(tangeom, graymaterial);
        tank.position.set(-15, 4, -25);
        scene.add(tank);
        objects.push(tank);

        // Small support box for equipment
        var supportgeom = new THREE.BoxGeometry(6, 1.5, 6);
        var support = new THREE.Mesh(supportgeom, brownmaterial);
        support.position.set(18, 0.75, -20);
        scene.add(support);
        objects.push(support);

        // Ambient light
        var ambientlight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientlight);
        lights.push(ambientlight);

        // Directional light for tidal gate tower
        var dirlight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirlight.position.set(10, 15, 10);
        scene.add(dirlight);
        lights.push(dirlight);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    if (i === 8) {
                        objects[i].rotation.y += delta * 0.3;
                    }
                    if (i === 2 || i === 3) {
                        objects[i].rotation.z += delta * 0.1;
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
