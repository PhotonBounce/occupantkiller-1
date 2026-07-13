window.MudKeep = (function() {
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
        var mudBrownMat = new THREE.MeshLambertMaterial({ color: 0x6B4423 });
        var darkMudMat = new THREE.MeshLambertMaterial({ color: 0x4A2C1A });
        var tanBrickMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var paleEarthMat = new THREE.MeshLambertMaterial({ color: 0x9B8B7B });
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x3D2817 });
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });

        var centralKeep = new THREE.Mesh(
            new THREE.BoxGeometry(20, 35, 20),
            mudBrownMat
        );
        centralKeep.position.set(0, 17.5, 0);
        scene.add(centralKeep);
        objects.push(centralKeep);

        var keepTop = new THREE.Mesh(
            new THREE.ConeGeometry(12, 15, 8),
            tanBrickMat
        );
        keepTop.position.set(0, 42.5, 0);
        scene.add(keepTop);
        objects.push(keepTop);

        var eastTower = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 28, 6),
            darkMudMat
        );
        eastTower.position.set(28, 14, 0);
        scene.add(eastTower);
        objects.push(eastTower);

        var westTower = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 28, 6),
            darkMudMat
        );
        westTower.position.set(-28, 14, 0);
        scene.add(westTower);
        objects.push(westTower);

        var northTower = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 28, 6),
            paleEarthMat
        );
        northTower.position.set(0, 14, 28);
        scene.add(northTower);
        objects.push(northTower);

        var southTower = new THREE.Mesh(
            new THREE.CylinderGeometry(8, 8, 28, 6),
            paleEarthMat
        );
        southTower.position.set(0, 14, -28);
        scene.add(southTower);
        objects.push(southTower);

        var eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(4, 20, 50),
            mudBrownMat
        );
        eastWall.position.set(26, 10, 0);
        scene.add(eastWall);
        objects.push(eastWall);

        var westWall = new THREE.Mesh(
            new THREE.BoxGeometry(4, 20, 50),
            mudBrownMat
        );
        westWall.position.set(-26, 10, 0);
        scene.add(westWall);
        objects.push(westWall);

        var northWall = new THREE.Mesh(
            new THREE.BoxGeometry(50, 20, 4),
            tanBrickMat
        );
        northWall.position.set(0, 10, 26);
        scene.add(northWall);
        objects.push(northWall);

        var southWall = new THREE.Mesh(
            new THREE.BoxGeometry(50, 20, 4),
            tanBrickMat
        );
        southWall.position.set(0, 10, -26);
        scene.add(southWall);
        objects.push(southWall);

        var courtyard = new THREE.Mesh(
            new THREE.BoxGeometry(35, 0.5, 35),
            paleEarthMat
        );
        courtyard.position.set(0, 0.25, 0);
        scene.add(courtyard);
        objects.push(courtyard);

        var woodenPalisade = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 18, 5),
            woodMat
        );
        woodenPalisade.position.set(20, 9, 20);
        scene.add(woodenPalisade);
        objects.push(woodenPalisade);

        var cornerStone1 = new THREE.Mesh(
            new THREE.SphereGeometry(3, 6, 6),
            stoneMat
        );
        cornerStone1.position.set(25, 8, 25);
        scene.add(cornerStone1);
        objects.push(cornerStone1);

        var cornerStone2 = new THREE.Mesh(
            new THREE.SphereGeometry(3, 6, 6),
            stoneMat
        );
        cornerStone2.position.set(-25, 8, 25);
        scene.add(cornerStone2);
        objects.push(cornerStone2);

        var cornerStone3 = new THREE.Mesh(
            new THREE.SphereGeometry(3, 6, 6),
            stoneMat
        );
        cornerStone3.position.set(25, 8, -25);
        scene.add(cornerStone3);
        objects.push(cornerStone3);

        var cornerStone4 = new THREE.Mesh(
            new THREE.SphereGeometry(3, 6, 6),
            stoneMat
        );
        cornerStone4.position.set(-25, 8, -25);
        scene.add(cornerStone4);
        objects.push(cornerStone4);

        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].rotation) {
                    objects[i].rotation.y += 0.0001 * delta;
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

    return { init: init, update: update, reset: reset };
}());
