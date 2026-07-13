window.ThornBase = (function() {
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
        var thornMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var thornMaterial2 = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
        var thornMaterial3 = new THREE.MeshLambertMaterial({ color: 0x0f0f0f });
        var wireColor = new THREE.MeshLambertMaterial({ color: 0x333333 });

        // Dense thorn bush cluster 1 - center left
        var thorn1 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), thornMaterial);
        thorn1.position.set(-25, 3, -15);
        scene.add(thorn1);
        objects.push(thorn1);

        var thorn2 = new THREE.Mesh(new THREE.SphereGeometry(3.0, 8, 8), thornMaterial2);
        thorn2.position.set(-20, 4, -12);
        scene.add(thorn2);
        objects.push(thorn2);

        var thorn3 = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), thornMaterial3);
        thorn3.position.set(-28, 2, -18);
        scene.add(thorn3);
        objects.push(thorn3);

        // Dense thorn bush cluster 2 - right side
        var thorn4 = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 8), thornMaterial);
        thorn4.position.set(22, 3.5, 8);
        scene.add(thorn4);
        objects.push(thorn4);

        var thorn5 = new THREE.Mesh(new THREE.SphereGeometry(2.9, 8, 8), thornMaterial2);
        thorn5.position.set(28, 2, 12);
        scene.add(thorn5);
        objects.push(thorn5);

        var thorn6 = new THREE.Mesh(new THREE.SphereGeometry(2.6, 8, 8), thornMaterial3);
        thorn6.position.set(25, 4, 5);
        scene.add(thorn6);
        objects.push(thorn6);

        // Concealed bunker structure 1 - cylinders representing underground bunker entrance
        var bunker1 = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4, 2, 8), thornMaterial);
        bunker1.position.set(-8, 0.5, 0);
        scene.add(bunker1);
        objects.push(bunker1);

        var bunker1Top = new THREE.Mesh(new THREE.ConeGeometry(4, 1.5, 8), thornMaterial2);
        bunker1Top.position.set(-8, 2.5, 0);
        scene.add(bunker1Top);
        objects.push(bunker1Top);

        // Concealed bunker structure 2 - opposite side
        var bunker2 = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.5, 1.8, 8), thornMaterial);
        bunker2.position.set(12, 0.6, -22);
        scene.add(bunker2);
        objects.push(bunker2);

        var bunker2Top = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.2, 8), thornMaterial2);
        bunker2Top.position.set(12, 2.3, -22);
        scene.add(bunker2Top);
        objects.push(bunker2Top);

        // Sniper hide - tall thorny structure
        var sniperHide = new THREE.Mesh(new THREE.BoxGeometry(3, 5.5, 3), thornMaterial3);
        sniperHide.position.set(-15, 2.75, 20);
        scene.add(sniperHide);
        objects.push(sniperHide);

        // Supply cache - concealed box
        var cache1 = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 3.5), thornMaterial);
        cache1.position.set(5, 1, -8);
        scene.add(cache1);
        objects.push(cache1);

        var cache2 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 3), wireColor);
        cache2.position.set(-12, 0.9, -28);
        scene.add(cache2);
        objects.push(cache2);

        // Thorned wire entanglement - LineSegments
        var wireGeom1 = new THREE.BufferGeometry();
        var wirePoints1 = new Float32Array([
            -30, 0, 0, 30, 0, 0,
            -30, 1, 0, 30, 1, 0,
            -30, 2, 0, 30, 2, 0
        ]);
        wireGeom1.setAttribute('position', new THREE.BufferAttribute(wirePoints1, 3));
        var wireMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var wires1 = new THREE.LineSegments(wireGeom1, wireMaterial);
        scene.add(wires1);
        objects.push(wires1);

        var wireGeom2 = new THREE.BufferGeometry();
        var wirePoints2 = new Float32Array([
            0, 0, -25, 0, 0, 25,
            1, 1, -25, 1, 1, 25,
            2, 2, -25, 2, 2, 25
        ]);
        wireGeom2.setAttribute('position', new THREE.BufferAttribute(wirePoints2, 3));
        var wires2 = new THREE.LineSegments(wireGeom2, wireMaterial);
        scene.add(wires2);
        objects.push(wires2);

        // Additional scattered thorns for density
        var thornScatter = [
            { pos: [-5, 2, 15], size: 2.2 },
            { pos: [18, 3, -8], size: 2.4 },
            { pos: [-18, 1.5, 8], size: 2.1 }
        ];

        for (var i = 0; i < thornScatter.length; i++) {
            var scatterThorn = new THREE.Mesh(new THREE.SphereGeometry(thornScatter[i].size, 8, 8), thornMaterial);
            scatterThorn.position.set(thornScatter[i].pos[0], thornScatter[i].pos[1], thornScatter[i].pos[2]);
            scene.add(scatterThorn);
            objects.push(scatterThorn);
        }

        // Lighting - subtle to maintain defensive theme
        var light1 = new THREE.PointLight(0x666666, 0.8, 100);
        light1.position.set(-20, 15, -20);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.PointLight(0x555555, 0.6, 80);
        light2.position.set(20, 12, 15);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Gentle rotation of some thorny structures for organic feel
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry && i % 3 === 0) {
                objects[i].rotation.x += delta * 0.1;
                objects[i].rotation.y += delta * 0.15;
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
