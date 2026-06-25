window.JadeFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Main fortress wall (large box)
        var wallGeometry = new THREE.BoxGeometry(60, 15, 60);
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a7c59 });
        var wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
        wallMesh.position.set(0, 7, 0);
        scene.add(wallMesh);
        objects.push(wallMesh);

        // Pagoda tower base (stacked boxes)
        var towerBase1 = new THREE.BoxGeometry(20, 8, 20);
        var towerMat1 = new THREE.MeshLambertMaterial({ color: 0x2d5a3d });
        var tower1 = new THREE.Mesh(towerBase1, towerMat1);
        tower1.position.set(25, 4, 25);
        scene.add(tower1);
        objects.push(tower1);

        var towerBase2 = new THREE.BoxGeometry(14, 8, 14);
        var towerMat2 = new THREE.MeshLambertMaterial({ color: 0x3d6b4d });
        var tower2 = new THREE.Mesh(towerBase2, towerMat2);
        tower2.position.set(25, 16, 25);
        scene.add(tower2);
        objects.push(tower2);

        var towerBase3 = new THREE.BoxGeometry(8, 8, 8);
        var towerMat3 = new THREE.MeshLambertMaterial({ color: 0x2d5a3d });
        var tower3 = new THREE.Mesh(towerBase3, towerMat3);
        tower3.position.set(25, 28, 25);
        scene.add(tower3);
        objects.push(tower3);

        // Pagoda roof (cone on top)
        var roofGeometry = new THREE.ConeGeometry(12, 10, 8);
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a2a });
        var roof1 = new THREE.Mesh(roofGeometry, roofMaterial);
        roof1.position.set(25, 38, 25);
        scene.add(roof1);
        objects.push(roof1);

        // Second pagoda tower on opposite corner
        var tower2Base1 = new THREE.BoxGeometry(16, 8, 16);
        var tower2Mat = new THREE.MeshLambertMaterial({ color: 0x3d6b4d });
        var tower2a = new THREE.Mesh(tower2Base1, tower2Mat);
        tower2a.position.set(-28, 4, -28);
        scene.add(tower2a);
        objects.push(tower2a);

        var tower2Base2 = new THREE.BoxGeometry(10, 8, 10);
        var tower2b = new THREE.Mesh(tower2Base2, tower2Mat);
        tower2b.position.set(-28, 16, -28);
        scene.add(tower2b);
        objects.push(tower2b);

        // Second pagoda roof
        var roof2Geometry = new THREE.ConeGeometry(10, 9, 8);
        var roof2Material = new THREE.MeshLambertMaterial({ color: 0x1a3a2a });
        var roof2 = new THREE.Mesh(roof2Geometry, roof2Material);
        roof2.position.set(-28, 33, -28);
        scene.add(roof2);
        objects.push(roof2);

        // Bamboo palisade cluster (cylinders)
        var bamboo1Geometry = new THREE.CylinderGeometry(1.5, 1.5, 14, 6);
        var bambooMaterial = new THREE.MeshLambertMaterial({ color: 0x5a9e6f });
        var bamboo1 = new THREE.Mesh(bamboo1Geometry, bambooMaterial);
        bamboo1.position.set(5, 7, 30);
        scene.add(bamboo1);
        objects.push(bamboo1);

        var bamboo2 = new THREE.Mesh(bamboo1Geometry, bambooMaterial);
        bamboo2.position.set(15, 7, 32);
        scene.add(bamboo2);
        objects.push(bamboo2);

        var bamboo3 = new THREE.Mesh(bamboo1Geometry, bambooMaterial);
        bamboo3.position.set(25, 7, 33);
        scene.add(bamboo3);
        objects.push(bamboo3);

        // Jade statue pedestal (stacked cylinders and box)
        var pedestalBase = new THREE.CylinderGeometry(3, 4, 2, 8);
        var pedestalMat = new THREE.MeshLambertMaterial({ color: 0x4a9d6f });
        var pedestal = new THREE.Mesh(pedestalBase, pedestalMat);
        pedestal.position.set(-15, 1, 20);
        scene.add(pedestal);
        objects.push(pedestal);

        var pedestalTop = new THREE.BoxGeometry(4, 3, 4);
        var pedestal2 = new THREE.Mesh(pedestalTop, pedestalMat);
        pedestal2.position.set(-15, 5, 20);
        scene.add(pedestal2);
        objects.push(pedestal2);

        // Jade statue (sphere on pedestal)
        var statueGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        var statueMaterial = new THREE.MeshLambertMaterial({ color: 0x6fbf8f });
        var statue = new THREE.Mesh(statueGeometry, statueMaterial);
        statue.position.set(-15, 9, 20);
        scene.add(statue);
        objects.push(statue);

        // Ornamental gate (two tall boxes with connecting box)
        var gatePillar1 = new THREE.BoxGeometry(3, 20, 3);
        var gateMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5a3d });
        var pillar1 = new THREE.Mesh(gatePillar1, gateMaterial);
        pillar1.position.set(-8, 10, -25);
        scene.add(pillar1);
        objects.push(pillar1);

        var gatePillar2 = new THREE.BoxGeometry(3, 20, 3);
        var pillar2 = new THREE.Mesh(gatePillar2, gateMaterial);
        pillar2.position.set(8, 10, -25);
        scene.add(pillar2);
        objects.push(pillar2);

        var gateTop = new THREE.BoxGeometry(20, 3, 3);
        var gateTopMat = new THREE.MeshLambertMaterial({ color: 0x1a3a2a });
        var topBar = new THREE.Mesh(gateTop, gateTopMat);
        topBar.position.set(0, 22, -25);
        scene.add(topBar);
        objects.push(topBar);

        // Decorative spheres around the fortress
        var decorGeometry = new THREE.SphereGeometry(2, 12, 12);
        var decorMaterial = new THREE.MeshLambertMaterial({ color: 0x5a9e6f });
        var decor1 = new THREE.Mesh(decorGeometry, decorMaterial);
        decor1.position.set(-30, 2, -10);
        scene.add(decor1);
        objects.push(decor1);

        var decor2 = new THREE.Mesh(decorGeometry, decorMaterial);
        decor2.position.set(30, 2, 10);
        scene.add(decor2);
        objects.push(decor2);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0x88aa99, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light
        var dirLight = new THREE.DirectionalLight(0xccddcc, 0.8);
        dirLight.position.set(40, 40, 40);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Gentle rotation of decorative elements
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry instanceof THREE.SphereGeometry) {
                    objects[i].rotation.y += delta * 0.3;
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
