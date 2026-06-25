window.IronRidge = (function() {
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

        // Iron ore outcrop cluster 1 - main ridge
        var box1 = new THREE.Mesh(
            new THREE.BoxGeometry(8, 12, 6),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        box1.position.set(-25, 6, -20);
        box1.castShadow = true;
        scene.add(box1);
        objects.push(box1);

        var box2 = new THREE.Mesh(
            new THREE.BoxGeometry(6, 14, 5),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        box2.position.set(-18, 7, -18);
        box2.castShadow = true;
        scene.add(box2);
        objects.push(box2);

        var box3 = new THREE.Mesh(
            new THREE.BoxGeometry(7, 10, 7),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        box3.position.set(-12, 5, -22);
        box3.castShadow = true;
        scene.add(box3);
        objects.push(box3);

        var box4 = new THREE.Mesh(
            new THREE.BoxGeometry(5, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0x964B00 })
        );
        box4.position.set(-5, 4, -19);
        box4.castShadow = true;
        scene.add(box4);
        objects.push(box4);

        // Ore crusher machinery - main cylinder
        var crusher = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 15, 16),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        crusher.position.set(5, 7.5, -15);
        crusher.castShadow = true;
        scene.add(crusher);
        objects.push(crusher);

        // Crusher support cylinder
        var support1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        support1.position.set(2, 6, -12);
        support1.castShadow = true;
        scene.add(support1);
        objects.push(support1);

        var support2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        support2.position.set(8, 6, -12);
        support2.castShadow = true;
        scene.add(support2);
        objects.push(support2);

        // Mining cart
        var cart = new THREE.Mesh(
            new THREE.BoxGeometry(4, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0xCD5C5C })
        );
        cart.position.set(15, 1.5, -10);
        cart.castShadow = true;
        scene.add(cart);
        objects.push(cart);

        // Cart wheel 1
        var wheel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        wheel1.rotation.z = Math.PI / 2;
        wheel1.position.set(12, 0.8, -11);
        wheel1.castShadow = true;
        scene.add(wheel1);
        objects.push(wheel1);

        // Cart wheel 2
        var wheel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        wheel2.rotation.z = Math.PI / 2;
        wheel2.position.set(18, 0.8, -11);
        wheel2.castShadow = true;
        scene.add(wheel2);
        objects.push(wheel2);

        // Conveyor belt support frame
        var conveyorSupport = new THREE.Mesh(
            new THREE.BoxGeometry(12, 2, 2),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        conveyorSupport.position.set(20, 8, 0);
        conveyorSupport.castShadow = true;
        scene.add(conveyorSupport);
        objects.push(conveyorSupport);

        // Blast hole cone 1
        var blast1 = new THREE.Mesh(
            new THREE.ConeGeometry(2, 6, 12),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        blast1.position.set(-30, 3, 10);
        blast1.castShadow = true;
        scene.add(blast1);
        objects.push(blast1);

        // Blast hole cone 2
        var blast2 = new THREE.Mesh(
            new THREE.ConeGeometry(1.8, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x808080 })
        );
        blast2.position.set(-22, 2.5, 15);
        blast2.castShadow = true;
        scene.add(blast2);
        objects.push(blast2);

        // Blast hole cone 3
        var blast3 = new THREE.Mesh(
            new THREE.ConeGeometry(2.2, 7, 12),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        blast3.position.set(-8, 3.5, 20);
        blast3.castShadow = true;
        scene.add(blast3);
        objects.push(blast3);

        // Ore pile sphere
        var orePile = new THREE.Mesh(
            new THREE.SphereGeometry(5, 16, 16),
            new THREE.MeshLambertMaterial({ color: 0xA0522D })
        );
        orePile.position.set(25, 5, 15);
        orePile.castShadow = true;
        scene.add(orePile);
        objects.push(orePile);

        // Rail system - cylinder segments for rails
        var railLeft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 40, 8),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        railLeft.rotation.z = Math.PI / 2;
        railLeft.position.set(15, 1, -5);
        railLeft.castShadow = true;
        scene.add(railLeft);
        objects.push(railLeft);

        var railRight = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 40, 8),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        railRight.rotation.z = Math.PI / 2;
        railRight.position.set(15, 1, -9);
        railRight.castShadow = true;
        scene.add(railRight);
        objects.push(railRight);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 40, 30);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation updates can be added here
        if (objects.length > 7 && objects[7]) {
            objects[7].rotation.y += 0.01;
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
