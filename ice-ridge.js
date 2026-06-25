window.IceRidge = (function() {
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
        buildRidge();
    }

    function buildRidge() {
        var i;

        // Jagged ice formation cluster 1 - main ridge
        var ice1Geom = new THREE.BoxGeometry(8, 18, 4);
        var ice1Mat = new THREE.MeshLambertMaterial({ color: 0xb0e0e6 });
        var ice1 = new THREE.Mesh(ice1Geom, ice1Mat);
        ice1.position.set(-28, 9, -20);
        ice1.rotation.z = 0.4;
        scene.add(ice1);
        objects.push(ice1);

        var ice2Geom = new THREE.BoxGeometry(6, 16, 3);
        var ice2Mat = new THREE.MeshLambertMaterial({ color: 0x87ceeb });
        var ice2 = new THREE.Mesh(ice2Geom, ice2Mat);
        ice2.position.set(-22, 12, -22);
        ice2.rotation.z = -0.3;
        scene.add(ice2);
        objects.push(ice2);

        var ice3Geom = new THREE.BoxGeometry(7, 14, 5);
        var ice3Mat = new THREE.MeshLambertMaterial({ color: 0xaffbff });
        var ice3 = new THREE.Mesh(ice3Geom, ice3Mat);
        ice3.position.set(-16, 8, -25);
        ice3.rotation.z = 0.5;
        scene.add(ice3);
        objects.push(ice3);

        // Pressure ridge folds - stacked box wedges
        var wedge1Geom = new THREE.BoxGeometry(12, 5, 6);
        var wedge1Mat = new THREE.MeshLambertMaterial({ color: 0xcfe8f3 });
        var wedge1 = new THREE.Mesh(wedge1Geom, wedge1Mat);
        wedge1.position.set(-5, 3, -18);
        wedge1.rotation.z = 0.2;
        scene.add(wedge1);
        objects.push(wedge1);

        var wedge2Geom = new THREE.BoxGeometry(10, 4, 5);
        var wedge2Mat = new THREE.MeshLambertMaterial({ color: 0xd4f1f4 });
        var wedge2 = new THREE.Mesh(wedge2Geom, wedge2Mat);
        wedge2.position.set(-2, 6, -15);
        wedge2.rotation.z = -0.15;
        scene.add(wedge2);
        objects.push(wedge2);

        // Jagged ice formation cluster 2 - eastern ridge
        var ice4Geom = new THREE.BoxGeometry(9, 15, 4);
        var ice4Mat = new THREE.MeshLambertMaterial({ color: 0xb4d7f1 });
        var ice4 = new THREE.Mesh(ice4Geom, ice4Mat);
        ice4.position.set(8, 10, -24);
        ice4.rotation.z = 0.35;
        scene.add(ice4);
        objects.push(ice4);

        var ice5Geom = new THREE.BoxGeometry(7, 13, 3);
        var ice5Mat = new THREE.MeshLambertMaterial({ color: 0x9fd3e8 });
        var ice5 = new THREE.Mesh(ice5Geom, ice5Mat);
        ice5.position.set(16, 9, -20);
        ice5.rotation.z = -0.4;
        scene.add(ice5);
        objects.push(ice5);

        var ice6Geom = new THREE.BoxGeometry(6, 12, 4);
        var ice6Mat = new THREE.MeshLambertMaterial({ color: 0xace6f7 });
        var ice6 = new THREE.Mesh(ice6Geom, ice6Mat);
        ice6.position.set(24, 7, -22);
        ice6.rotation.z = 0.3;
        scene.add(ice6);
        objects.push(ice6);

        // Frozen equipment - cylindrical structures
        var equip1Geom = new THREE.CylinderGeometry(2, 2.5, 8, 8);
        var equip1Mat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var equip1 = new THREE.Mesh(equip1Geom, equip1Mat);
        equip1.position.set(-10, 4, -5);
        scene.add(equip1);
        objects.push(equip1);

        var equip2Geom = new THREE.CylinderGeometry(1.8, 2, 6, 8);
        var equip2Mat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var equip2 = new THREE.Mesh(equip2Geom, equip2Mat);
        equip2.position.set(12, 3, -8);
        scene.add(equip2);
        objects.push(equip2);

        // Ice wall defensive positions - tall box formations
        var wall1Geom = new THREE.BoxGeometry(15, 10, 2);
        var wall1Mat = new THREE.MeshLambertMaterial({ color: 0xa8d8ea });
        var wall1 = new THREE.Mesh(wall1Geom, wall1Mat);
        wall1.position.set(-20, 5, 15);
        scene.add(wall1);
        objects.push(wall1);

        var wall2Geom = new THREE.BoxGeometry(12, 9, 2);
        var wall2Mat = new THREE.MeshLambertMaterial({ color: 0xb8e0eb });
        var wall2 = new THREE.Mesh(wall2Geom, wall2Mat);
        wall2.position.set(18, 4.5, 18);
        wall2.rotation.y = 0.3;
        scene.add(wall2);
        objects.push(wall2);

        // Research station ruins - spherical structures
        var ruin1Geom = new THREE.SphereGeometry(4, 8, 8);
        var ruin1Mat = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var ruin1 = new THREE.Mesh(ruin1Geom, ruin1Mat);
        ruin1.position.set(0, 5, 8);
        scene.add(ruin1);
        objects.push(ruin1);

        var ruin2Geom = new THREE.SphereGeometry(3, 8, 8);
        var ruin2Mat = new THREE.MeshLambertMaterial({ color: 0x778899 });
        var ruin2 = new THREE.Mesh(ruin2Geom, ruin2Mat);
        ruin2.position.set(-15, 4, 10);
        scene.add(ruin2);
        objects.push(ruin2);

        // Cone-shaped ice peaks
        var peak1Geom = new THREE.ConeGeometry(3, 11, 8);
        var peak1Mat = new THREE.MeshLambertMaterial({ color: 0xd0f0ff });
        var peak1 = new THREE.Mesh(peak1Geom, peak1Mat);
        peak1.position.set(6, 6, -12);
        scene.add(peak1);
        objects.push(peak1);

        var peak2Geom = new THREE.ConeGeometry(2.5, 9, 8);
        var peak2Mat = new THREE.MeshLambertMaterial({ color: 0xe0f8ff });
        var peak2 = new THREE.Mesh(peak2Geom, peak2Mat);
        peak2.position.set(-8, 5, 5);
        scene.add(peak2);
        objects.push(peak2);

        // Lighting - polar research station ambient and key light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffdd, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        var i;
        for (i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.05;
            }
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
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
