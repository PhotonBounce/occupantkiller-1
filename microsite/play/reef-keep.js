window.ReefKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        var keepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var buoyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var coralMaterial = new THREE.MeshLambertMaterial({ color: 0xFF8C00 });
        var netMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var craneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });

        var leg1Geo = new THREE.CylinderGeometry(3, 3, 25, 8);
        var leg1 = new THREE.Mesh(leg1Geo, keepMaterial);
        leg1.position.set(-15, 0, -15);
        scene.add(leg1);
        objects.push(leg1);

        var leg2Geo = new THREE.CylinderGeometry(3, 3, 25, 8);
        var leg2 = new THREE.Mesh(leg2Geo, keepMaterial);
        leg2.position.set(15, 0, -15);
        scene.add(leg2);
        objects.push(leg2);

        var leg3Geo = new THREE.CylinderGeometry(3, 3, 25, 8);
        var leg3 = new THREE.Mesh(leg3Geo, keepMaterial);
        leg3.position.set(-15, 0, 15);
        scene.add(leg3);
        objects.push(leg3);

        var leg4Geo = new THREE.CylinderGeometry(3, 3, 25, 8);
        var leg4 = new THREE.Mesh(leg4Geo, keepMaterial);
        leg4.position.set(15, 0, 15);
        scene.add(leg4);
        objects.push(leg4);

        var platformGeo = new THREE.BoxGeometry(35, 4, 35);
        var platform = new THREE.Mesh(platformGeo, platformMaterial);
        platform.position.set(0, 13, 0);
        scene.add(platform);
        objects.push(platform);

        var fortressGeo = new THREE.BoxGeometry(20, 8, 20);
        var fortress = new THREE.Mesh(fortressGeo, keepMaterial);
        fortress.position.set(0, 20, 0);
        scene.add(fortress);
        objects.push(fortress);

        var towerGeo = new THREE.CylinderGeometry(4, 4, 12, 8);
        var tower = new THREE.Mesh(towerGeo, keepMaterial);
        tower.position.set(8, 26, 8);
        scene.add(tower);
        objects.push(tower);

        var buoy1Geo = new THREE.SphereGeometry(2, 8, 8);
        var buoy1 = new THREE.Mesh(buoy1Geo, buoyMaterial);
        buoy1.position.set(-25, 8, -25);
        scene.add(buoy1);
        objects.push(buoy1);

        var pole1Geo = new THREE.CylinderGeometry(0.5, 0.5, 8, 6);
        var pole1 = new THREE.Mesh(pole1Geo, craneMaterial);
        pole1.position.set(-25, 2, -25);
        scene.add(pole1);
        objects.push(pole1);

        var buoy2Geo = new THREE.SphereGeometry(2, 8, 8);
        var buoy2 = new THREE.Mesh(buoy2Geo, buoyMaterial);
        buoy2.position.set(25, 8, -25);
        scene.add(buoy2);
        objects.push(buoy2);

        var pole2Geo = new THREE.CylinderGeometry(0.5, 0.5, 8, 6);
        var pole2 = new THREE.Mesh(pole2Geo, craneMaterial);
        pole2.position.set(25, 2, -25);
        scene.add(pole2);
        objects.push(pole2);

        var coral1Geo = new THREE.SphereGeometry(3, 6, 6);
        var coral1 = new THREE.Mesh(coral1Geo, coralMaterial);
        coral1.position.set(-20, 4, 20);
        scene.add(coral1);
        objects.push(coral1);

        var coral2Geo = new THREE.SphereGeometry(2.5, 6, 6);
        var coral2 = new THREE.Mesh(coral2Geo, coralMaterial);
        coral2.position.set(-20, 8, 20);
        scene.add(coral2);
        objects.push(coral2);

        var coral3Geo = new THREE.SphereGeometry(2, 6, 6);
        var coral3 = new THREE.Mesh(coral3Geo, coralMaterial);
        coral3.position.set(-20, 11, 20);
        scene.add(coral3);
        objects.push(coral3);

        var cranePoleGeo = new THREE.CylinderGeometry(2, 2, 15, 8);
        var cranePole = new THREE.Mesh(cranePoleGeo, craneMaterial);
        cranePole.position.set(0, 8, -20);
        scene.add(cranePole);
        objects.push(cranePole);

        var craneArmGeo = new THREE.BoxGeometry(12, 1.5, 1.5);
        var craneArm = new THREE.Mesh(craneArmGeo, craneMaterial);
        craneArm.position.set(0, 17, -20);
        scene.add(craneArm);
        objects.push(craneArm);

        var bellConeGeo = new THREE.ConeGeometry(3, 5, 8);
        var bellCone = new THREE.Mesh(bellConeGeo, craneMaterial);
        bellCone.position.set(0, 6, -20);
        scene.add(bellCone);
        objects.push(bellCone);

        var netPoints = [];
        for (var x = -25; x <= 25; x += 10) {
            for (var z = -25; z <= 25; z += 10) {
                netPoints.push(new THREE.Vector3(x, 5, z));
                netPoints.push(new THREE.Vector3(x + 5, 5, z));
            }
        }
        var netGeo = new THREE.BufferGeometry();
        netGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(netPoints.flatMap(p => [p.x, p.y, p.z])), 3));
        var netMesh = new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0x2F4F4F, linewidth: 2 }));
        scene.add(netMesh);
        objects.push(netMesh);

        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
        pointLight.position.set(0, 25, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.001 * delta;
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
