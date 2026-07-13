window.InchPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Rocky island base - clustered sphere boulders
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var boulder1Geo = new THREE.SphereGeometry(8, 8, 8);
        var boulder1 = new THREE.Mesh(boulder1Geo, boulderMat);
        boulder1.position.set(-15, 0, -20);
        scene.add(boulder1);
        objects.push(boulder1);

        var boulder2Geo = new THREE.SphereGeometry(6, 8, 8);
        var boulder2 = new THREE.Mesh(boulder2Geo, boulderMat);
        boulder2.position.set(10, 2, -18);
        scene.add(boulder2);
        objects.push(boulder2);

        var boulder3Geo = new THREE.SphereGeometry(7, 8, 8);
        var boulder3 = new THREE.Mesh(boulder3Geo, boulderMat);
        boulder3.position.set(-5, 1, -15);
        scene.add(boulder3);
        objects.push(boulder3);

        // Stone jetty pier - box platform on cylinder piers
        var jettyBoxGeo = new THREE.BoxGeometry(20, 2, 30);
        var jettyMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var jettyBox = new THREE.Mesh(jettyBoxGeo, jettyMat);
        jettyBox.position.set(0, 5, 10);
        scene.add(jettyBox);
        objects.push(jettyBox);

        var pierGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 8);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pier1 = new THREE.Mesh(pierGeo, pierMat);
        pier1.position.set(-8, 1, 5);
        scene.add(pier1);
        objects.push(pier1);

        var pier2 = new THREE.Mesh(pierGeo, pierMat);
        pier2.position.set(8, 1, 5);
        scene.add(pier2);
        objects.push(pier2);

        // Beacon fire tower - cylinder column with sphere fire glow on top
        var towerColGeo = new THREE.CylinderGeometry(2, 2, 25, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var towerCol = new THREE.Mesh(towerColGeo, towerMat);
        towerCol.position.set(-25, 12.5, 20);
        scene.add(towerCol);
        objects.push(towerCol);

        var fireSphereGeo = new THREE.SphereGeometry(3, 8, 8);
        var fireMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var fireSphere = new THREE.Mesh(fireSphereGeo, fireMat);
        fireSphere.position.set(-25, 28, 20);
        scene.add(fireSphere);
        objects.push(fireSphere);

        // Defensive sea wall - box wall with crenellations (multiple boxes stacked)
        var wallGeo = new THREE.BoxGeometry(40, 4, 2);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
        var wallMain = new THREE.Mesh(wallGeo, wallMat);
        wallMain.position.set(0, 2, -28);
        scene.add(wallMain);
        objects.push(wallMain);

        var crenGeo = new THREE.BoxGeometry(3, 2, 2);
        var crenMat = new THREE.MeshLambertMaterial({ color: 0x8B8680 });
        var cren1 = new THREE.Mesh(crenGeo, crenMat);
        cren1.position.set(-15, 5, -28);
        scene.add(cren1);
        objects.push(cren1);

        var cren2 = new THREE.Mesh(crenGeo, crenMat);
        cren2.position.set(0, 5, -28);
        scene.add(cren2);
        objects.push(cren2);

        var cren3 = new THREE.Mesh(crenGeo, crenMat);
        cren3.position.set(15, 5, -28);
        scene.add(cren3);
        objects.push(cren3);

        // Signal lamp station - box housing with cone lamp reflector
        var lampHouseGeo = new THREE.BoxGeometry(6, 6, 6);
        var lampHouseMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var lampHouse = new THREE.Mesh(lampHouseGeo, lampHouseMat);
        lampHouse.position.set(20, 3, 15);
        scene.add(lampHouse);
        objects.push(lampHouse);

        var reflectorGeo = new THREE.ConeGeometry(2.5, 4, 8);
        var reflectorMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var reflector = new THREE.Mesh(reflectorGeo, reflectorMat);
        reflector.position.set(20, 8, 15);
        scene.add(reflector);
        objects.push(reflector);

        // Ammunition bunker - box embedded in rock
        var bunkerGeo = new THREE.BoxGeometry(10, 5, 12);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var bunker = new THREE.Mesh(bunkerGeo, bunkerMat);
        bunker.position.set(-20, 2.5, 0);
        scene.add(bunker);
        objects.push(bunker);

        // Coastal gun emplacement - cylinder barrel on box mount
        var gunMountGeo = new THREE.BoxGeometry(8, 3, 8);
        var gunMountMat = new THREE.MeshLambertMaterial({ color: 0x36454F });
        var gunMount = new THREE.Mesh(gunMountGeo, gunMountMat);
        gunMount.position.set(25, 1.5, -10);
        scene.add(gunMount);
        objects.push(gunMount);

        var gunBarrelGeo = new THREE.CylinderGeometry(0.8, 0.8, 12, 8);
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var gunBarrel = new THREE.Mesh(gunBarrelGeo, gunMat);
        gunBarrel.rotation.z = Math.PI / 6;
        gunBarrel.position.set(25, 5, -10);
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        // Kelp store converted to barracks - box building with sphere kelp bales
        var barracksGeo = new THREE.BoxGeometry(14, 8, 10);
        var barracksMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var barracks = new THREE.Mesh(barracksGeo, barracksMat);
        barracks.position.set(-10, 4, 25);
        scene.add(barracks);
        objects.push(barracks);

        var kelpBaleGeo = new THREE.SphereGeometry(2, 8, 8);
        var kelpMat = new THREE.MeshLambertMaterial({ color: 0x2F5233 });
        var kelpBale1 = new THREE.Mesh(kelpBaleGeo, kelpMat);
        kelpBale1.position.set(-18, 2, 20);
        scene.add(kelpBale1);
        objects.push(kelpBale1);

        var kelpBale2 = new THREE.Mesh(kelpBaleGeo, kelpMat);
        kelpBale2.position.set(-18, 2, 30);
        scene.add(kelpBale2);
        objects.push(kelpBale2);

        // Mooring post bollards - short fat cylinders
        var bollardGeo = new THREE.CylinderGeometry(1, 1.2, 3, 8);
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0x4A5D4A });
        var bollard1 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard1.position.set(5, 1.5, 25);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard2.position.set(15, 1.5, 20);
        scene.add(bollard2);
        objects.push(bollard2);

        var bollard3 = new THREE.Mesh(bollardGeo, bollardMat);
        bollard3.position.set(10, 1.5, 30);
        scene.add(bollard3);
        objects.push(bollard3);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light for beacon effect
        var dirLight = new THREE.DirectionalLight(0xFF6347, 0.8);
        dirLight.position.set(-25, 30, 25);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate beacon fire glow - find fire sphere and rotate it
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry.type === 'SphereGeometry' && objects[i].position.y > 25) {
                    objects[i].rotation.x += delta * 0.3;
                    objects[i].rotation.y += delta * 0.2;
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
