window.LeatCamp = (function() {
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
        // Water channel leat (main defensive moat)
        var leatGeo = new THREE.BoxGeometry(80, 2, 8);
        var leatMat = new THREE.MeshLambertMaterial({ color: 0x4A90E2 });
        var leat = new THREE.Mesh(leatGeo, leatMat);
        leat.position.set(0, -1, 0);
        scene.add(leat);
        objects.push(leat);

        // Waterwheel fortification - cylinder body
        var wheelBodyGeo = new THREE.CylinderGeometry(8, 8, 2, 16);
        var wheelMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var wheelBody = new THREE.Mesh(wheelBodyGeo, wheelMat);
        wheelBody.position.set(-25, 2, -15);
        wheelBody.rotation.z = Math.PI / 4;
        scene.add(wheelBody);
        objects.push(wheelBody);

        // Waterwheel paddles 1
        var paddleGeo = new THREE.BoxGeometry(1, 6, 1.5);
        var paddleMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var paddle1 = new THREE.Mesh(paddleGeo, paddleMat);
        paddle1.position.set(-25, 7, -15);
        scene.add(paddle1);
        objects.push(paddle1);

        // Waterwheel paddles 2
        var paddle2 = new THREE.Mesh(paddleGeo, paddleMat);
        paddle2.position.set(-25, -3, -15);
        scene.add(paddle2);
        objects.push(paddle2);

        // Waterwheel paddles 3
        var paddle3 = new THREE.Mesh(paddleGeo, paddleMat);
        paddle3.position.set(-30, 2, -15);
        scene.add(paddle3);
        objects.push(paddle3);

        // Millstone barricade stack 1 (flat cylinder discs)
        var stoneGeo = new THREE.CylinderGeometry(5, 5, 0.5, 12);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var stone1 = new THREE.Mesh(stoneGeo, stoneMat);
        stone1.position.set(20, 1, -20);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(stoneGeo, stoneMat);
        stone2.position.set(20, 2.5, -20);
        scene.add(stone2);
        objects.push(stone2);

        var stone3 = new THREE.Mesh(stoneGeo, stoneMat);
        stone3.position.set(20, 4, -20);
        scene.add(stone3);
        objects.push(stone3);

        // Stone granary tower - box floors with cone cap
        var floorGeo = new THREE.BoxGeometry(6, 1, 6);
        var floorMat = new THREE.MeshLambertMaterial({ color: 0x696969 });

        var floor1 = new THREE.Mesh(floorGeo, floorMat);
        floor1.position.set(15, 1, 10);
        scene.add(floor1);
        objects.push(floor1);

        var floor2 = new THREE.Mesh(floorGeo, floorMat);
        floor2.position.set(15, 4, 10);
        scene.add(floor2);
        objects.push(floor2);

        var floor3 = new THREE.Mesh(floorGeo, floorMat);
        floor3.position.set(15, 7, 10);
        scene.add(floor3);
        objects.push(floor3);

        // Cone cap for granary
        var capGeo = new THREE.ConeGeometry(4, 3, 8);
        var capMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(15, 10, 10);
        scene.add(cap);
        objects.push(cap);

        // Sluice gate control - box gate
        var gateGeo = new THREE.BoxGeometry(4, 6, 1);
        var gateMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var gate = new THREE.Mesh(gateGeo, gateMat);
        gate.position.set(-5, 2, 20);
        scene.add(gate);
        objects.push(gate);

        // Sluice chain using LineSegments
        var chainPoints = [
            new THREE.Vector3(-5, 6, 20),
            new THREE.Vector3(-5, 10, 20),
            new THREE.Vector3(0, 12, 20)
        ];
        var chainGeo = new THREE.BufferGeometry().setFromPoints(chainPoints);
        var chainMat = new THREE.LineBasicMaterial({ color: 0x2F4F4F });
        var chain = new THREE.LineSegments(chainGeo, chainMat);
        scene.add(chain);
        objects.push(chain);

        // Flour-sack sandbag wall - stacked boxes
        var bagGeo = new THREE.BoxGeometry(2, 1.5, 2);
        var bagMat = new THREE.MeshLambertMaterial({ color: 0xD2B48C });

        var bag1 = new THREE.Mesh(bagGeo, bagMat);
        bag1.position.set(-15, 1, -25);
        scene.add(bag1);
        objects.push(bag1);

        var bag2 = new THREE.Mesh(bagGeo, bagMat);
        bag2.position.set(-12, 1, -25);
        scene.add(bag2);
        objects.push(bag2);

        var bag3 = new THREE.Mesh(bagGeo, bagMat);
        bag3.position.set(-15, 3, -25);
        scene.add(bag3);
        objects.push(bag3);

        var bag4 = new THREE.Mesh(bagGeo, bagMat);
        bag4.position.set(-12, 3, -25);
        scene.add(bag4);
        objects.push(bag4);

        // Ambush firing position - box on granary roof
        var positionGeo = new THREE.BoxGeometry(3, 1, 3);
        var positionMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var position = new THREE.Mesh(positionGeo, positionMat);
        position.position.set(15, 11.5, 10);
        scene.add(position);
        objects.push(position);

        // Tactical rope bridge - LineSegments spanning cylinder posts
        var postGeo = new THREE.CylinderGeometry(1, 1, 8, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        var post1 = new THREE.Mesh(postGeo, postMat);
        post1.position.set(-35, 2, 5);
        scene.add(post1);
        objects.push(post1);

        var post2 = new THREE.Mesh(postGeo, postMat);
        post2.position.set(30, 2, 5);
        scene.add(post2);
        objects.push(post2);

        // Rope bridge cables
        var ropePoints = [
            new THREE.Vector3(-35, 6.5, 5),
            new THREE.Vector3(30, 6.5, 5)
        ];
        var ropeGeo = new THREE.BufferGeometry().setFromPoints(ropePoints);
        var ropeMat = new THREE.LineBasicMaterial({ color: 0xA0522D });
        var rope = new THREE.LineSegments(ropeGeo, ropeMat);
        scene.add(rope);
        objects.push(rope);

        // Defense sphere barricade
        var defenseGeo = new THREE.SphereGeometry(3, 8, 8);
        var defenseMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var defense = new THREE.Mesh(defenseGeo, defenseMat);
        defense.position.set(25, 2, 15);
        scene.add(defense);
        objects.push(defense);

        // Watchtower cone
        var towerGeo = new THREE.ConeGeometry(2.5, 6, 6);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(-20, 4, 25);
        scene.add(tower);
        objects.push(tower);

        // Water control barrier - box
        var barrierGeo = new THREE.BoxGeometry(3, 3, 10);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(0, 1.5, -30);
        scene.add(barrier);
        objects.push(barrier);

        // Lighting
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 1.2);
        light1.position.set(50, 40, 50);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animate waterwheel rotation
        if (objects.length > 1 && objects[1]) {
            objects[1].rotation.z += delta * 0.5;
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
