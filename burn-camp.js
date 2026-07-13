window.BurnCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        var lightA = new THREE.PointLight(0xffffff, 1, 100);
        lightA.position.set(0, 20, 0);
        scene.add(lightA);
        lights.push(lightA);

        var lightB = new THREE.PointLight(0xff6600, 0.8, 80);
        lightB.position.set(-25, 15, -25);
        scene.add(lightB);
        lights.push(lightB);

        var steppingStone1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x8b8b8b })
        );
        steppingStone1.position.set(-20, 0.5, -10);
        scene.add(steppingStone1);
        objects.push(steppingStone1);

        var steppingStone2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x7a7a7a })
        );
        steppingStone2.position.set(-10, 0.5, -8);
        scene.add(steppingStone2);
        objects.push(steppingStone2);

        var steppingStone3 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x8b8b8b })
        );
        steppingStone3.position.set(0, 0.5, -10);
        scene.add(steppingStone3);
        objects.push(steppingStone3);

        var steppingStone4 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        steppingStone4.position.set(10, 0.5, -8);
        scene.add(steppingStone4);
        objects.push(steppingStone4);

        var steppingStone5 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x7a7a7a })
        );
        steppingStone5.position.set(20, 0.5, -10);
        scene.add(steppingStone5);
        objects.push(steppingStone5);

        var flamethrowerPost1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0x2f2f2f })
        );
        flamethrowerPost1.position.set(-25, 3, 5);
        scene.add(flamethrowerPost1);
        objects.push(flamethrowerPost1);

        var flame1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xff4500, emissive: 0xff2200 })
        );
        flame1.position.set(-25, 7, 5);
        scene.add(flame1);
        objects.push(flame1);

        var flamethrowerPost2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0x2f2f2f })
        );
        flamethrowerPost2.position.set(0, 3, 15);
        scene.add(flamethrowerPost2);
        objects.push(flamethrowerPost2);

        var flame2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xff6347, emissive: 0xff3300 })
        );
        flame2.position.set(0, 7, 15);
        scene.add(flame2);
        objects.push(flame2);

        var flamethrowerPost3 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0x1f1f1f })
        );
        flamethrowerPost3.position.set(25, 3, 8);
        scene.add(flamethrowerPost3);
        objects.push(flamethrowerPost3);

        var flame3 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xffa500, emissive: 0xff5500 })
        );
        flame3.position.set(25, 7, 8);
        scene.add(flame3);
        objects.push(flame3);

        var ruinBox1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 5, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        ruinBox1.position.set(-30, 2.5, 25);
        scene.add(ruinBox1);
        objects.push(ruinBox1);

        var ruinBox2 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 6),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        ruinBox2.position.set(-15, 2, 28);
        scene.add(ruinBox2);
        objects.push(ruinBox2);

        var ruinBox3 = new THREE.Mesh(
            new THREE.BoxGeometry(7, 4.5, 7),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        ruinBox3.position.set(15, 2.25, 27);
        scene.add(ruinBox3);
        objects.push(ruinBox3);

        var smokeGenerator1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
        );
        smokeGenerator1.position.set(-20, 4, -25);
        scene.add(smokeGenerator1);
        objects.push(smokeGenerator1);

        var cloudTop1 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        cloudTop1.position.set(-20, 10, -25);
        scene.add(cloudTop1);
        objects.push(cloudTop1);

        var smokeGenerator2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 8, 12),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        smokeGenerator2.position.set(20, 4, -28);
        scene.add(smokeGenerator2);
        objects.push(smokeGenerator2);

        var cloudTop2 = new THREE.Mesh(
            new THREE.SphereGeometry(2, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        cloudTop2.position.set(20, 10, -28);
        scene.add(cloudTop2);
        objects.push(cloudTop2);

        var bunker = new THREE.Mesh(
            new THREE.BoxGeometry(12, 2.5, 8),
            new THREE.MeshLambertMaterial({ color: 0x2d5016 })
        );
        bunker.position.set(0, 1.25, -30);
        scene.add(bunker);
        objects.push(bunker);

        var bunkerDetail = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        bunkerDetail.position.set(-4, 3.5, -30);
        scene.add(bunkerDetail);
        objects.push(bunkerDetail);

        var bunkerDetail2 = new THREE.Mesh(
            new THREE.ConeGeometry(1.5, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        bunkerDetail2.position.set(4, 3.5, -30);
        scene.add(bunkerDetail2);
        objects.push(bunkerDetail2);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.y > 0) {
                objects[i].rotation.y += 0.005;
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
