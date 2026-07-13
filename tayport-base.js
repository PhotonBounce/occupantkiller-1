window.TayportBase = (function() {
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
        // Lighthouse - tall white cylinder
        var lighthouseMaterial = new THREE.MeshLambertMaterial({ color: 0xEEEEEE });
        var lighthouseGeom = new THREE.CylinderGeometry(4, 4, 35, 16);
        var lighthouse = new THREE.Mesh(lighthouseGeom, lighthouseMaterial);
        lighthouse.position.set(200, 17.5, 80);
        scene.add(lighthouse);
        objects.push(lighthouse);

        // Sandbag ring around lighthouse - 8 small boxes in circle
        var sandbagMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        var sandbagRadius = 12;
        var sandbagCount = 8;
        for (var i = 0; i < sandbagCount; i++) {
            var angle = (i / sandbagCount) * Math.PI * 2;
            var sandbagGeom = new THREE.BoxGeometry(1.5, 1, 2);
            var sandbag = new THREE.Mesh(sandbagGeom, sandbagMaterial);
            var x = 200 + Math.cos(angle) * sandbagRadius;
            var z = 80 + Math.sin(angle) * sandbagRadius;
            sandbag.position.set(x, 0.5, z);
            sandbag.rotation.y = angle;
            scene.add(sandbag);
            objects.push(sandbag);
        }

        // Ferry pier - series of brown wooden planks extending into water
        var piermaterial = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
        var pierCount = 12;
        for (var i = 0; i < pierCount; i++) {
            var plankGeom = new THREE.BoxGeometry(8, 0.5, 3);
            var plank = new THREE.Mesh(plankGeom, piermaterial);
            plank.position.set(200 + (i * 8), 1, 120);
            scene.add(plank);
            objects.push(plank);
        }

        // Pier support columns
        var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        for (var i = 0; i < pierCount; i++) {
            var supportGeom = new THREE.CylinderGeometry(0.6, 0.8, 8, 8);
            var support = new THREE.Mesh(supportGeom, supportMaterial);
            support.position.set(200 + (i * 8), 4, 120);
            scene.add(support);
            objects.push(support);
        }

        // Coastal watch bunker - low profile concrete box
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var bunkerGeom = new THREE.BoxGeometry(4, 2, 3);
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMaterial);
        bunker.position.set(215, 1, 70);
        scene.add(bunker);
        objects.push(bunker);

        // Naval gun position - cylinder base + box barrel
        var gunBaseMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var gunBaseGeom = new THREE.CylinderGeometry(2.5, 3, 1.5, 12);
        var gunBase = new THREE.Mesh(gunBaseGeom, gunBaseMaterial);
        gunBase.position.set(200 + (pierCount * 8), 1, 125);
        scene.add(gunBase);
        objects.push(gunBase);

        var gunBarrelMaterial = new THREE.MeshLambertMaterial({ color: 0x303030 });
        var gunBarrelGeom = new THREE.BoxGeometry(0.8, 0.8, 12);
        var gunBarrel = new THREE.Mesh(gunBarrelGeom, gunBarrelMaterial);
        gunBarrel.position.set(200 + (pierCount * 8), 3, 125 + 6);
        gunBarrel.rotation.x = -0.3;
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        // Harbour master building - stone gray box
        var buildingMaterial = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var buildingGeom = new THREE.BoxGeometry(5, 3, 4);
        var building = new THREE.Mesh(buildingGeom, buildingMaterial);
        building.position.set(235, 1.5, 75);
        scene.add(building);
        objects.push(building);

        // Building roof
        var roofGeom = new THREE.ConeGeometry(3.5, 2, 4);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x704020 });
        var roof = new THREE.Mesh(roofGeom, roofMaterial);
        roof.position.set(235, 4, 75);
        scene.add(roof);
        objects.push(roof);

        // Fuel storage tanks - 3 khaki spheres
        var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x8B864E });
        var tankPositions = [
            [250, 3, 90],
            [245, 3, 95],
            [255, 3, 95]
        ];
        for (var i = 0; i < tankPositions.length; i++) {
            var tankGeom = new THREE.SphereGeometry(2.5, 12, 12);
            var tank = new THREE.Mesh(tankGeom, tankMaterial);
            tank.position.set(tankPositions[i][0], tankPositions[i][1], tankPositions[i][2]);
            scene.add(tank);
            objects.push(tank);
        }

        // Anti-aircraft gun - angled cylinder barrel
        var aaMaterial = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        var aaBaseGeom = new THREE.CylinderGeometry(1.5, 2, 1, 8);
        var aaBase = new THREE.Mesh(aaBaseGeom, aaMaterial);
        aaBase.position.set(220, 0.5, 50);
        scene.add(aaBase);
        objects.push(aaBase);

        var aaBarrelGeom = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
        var aaBarrel = new THREE.Mesh(aaBarrelGeom, aaMaterial);
        aaBarrel.position.set(220, 4, 50);
        aaBarrel.rotation.z = 0.8;
        scene.add(aaBarrel);
        objects.push(aaBarrel);

        // Ambient light for the base
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(100, 50, 100);
        scene.add(dirLight);
        lights.push(dirLight);

        // Light at lighthouse
        var lighthouseLight = new THREE.PointLight(0xFFEECC, 0.5, 100);
        lighthouseLight.position.set(200, 30, 80);
        scene.add(lighthouseLight);
        lights.push(lighthouseLight);
    }

    function update(delta) {
        // Rotation animations for structures
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.z > 100 && objects[i].position.z < 130) {
                // Animate gun barrels slightly
                if (objects[i].rotation.x !== undefined && Math.abs(objects[i].rotation.x) > 0.2) {
                    objects[i].rotation.y += delta * 0.1;
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
