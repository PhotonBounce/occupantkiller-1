window.KirriemuirBase = (function() {
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
        var baseX = 360;
        var baseZ = 310;

        // Former weaving mill strongpoint
        var millGeometry = new THREE.BoxGeometry(10, 6, 6);
        var millMaterial = new THREE.MeshLambertMaterial({ color: 0xB5651D });
        var mill = new THREE.Mesh(millGeometry, millMaterial);
        mill.position.set(baseX, 3, baseZ);
        mill.castShadow = true;
        mill.receiveShadow = true;
        scene.add(mill);
        objects.push(mill);

        // Mill chimney stack
        var chimneyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 20, 16);
        var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(baseX + 3, 13, baseZ + 2);
        chimney.castShadow = true;
        chimney.receiveShadow = true;
        scene.add(chimney);
        objects.push(chimney);

        // Glen gateway checkpoint barrier gates
        var gateLeftGeometry = new THREE.BoxGeometry(1.5, 4, 0.3);
        var gateMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        var gateLeft = new THREE.Mesh(gateLeftGeometry, gateMaterial);
        gateLeft.position.set(baseX - 8, 2, baseZ - 10);
        gateLeft.castShadow = true;
        gateLeft.receiveShadow = true;
        scene.add(gateLeft);
        objects.push(gateLeft);

        var gateRight = new THREE.Mesh(gateLeftGeometry, gateMaterial);
        gateRight.position.set(baseX + 8, 2, baseZ - 10);
        gateRight.castShadow = true;
        gateRight.receiveShadow = true;
        scene.add(gateRight);
        objects.push(gateRight);

        // Gate white stripe
        var stripeGeometry = new THREE.BoxGeometry(1.3, 0.6, 0.35);
        var stripeMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var stripeLeft = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripeLeft.position.set(baseX - 8, 2.8, baseZ - 9.85);
        stripeLeft.castShadow = true;
        scene.add(stripeLeft);
        objects.push(stripeLeft);

        var stripeRight = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripeRight.position.set(baseX + 8, 2.8, baseZ - 9.85);
        stripeRight.castShadow = true;
        scene.add(stripeRight);
        objects.push(stripeRight);

        // Highland terrain berm
        var bermGeometry = new THREE.BoxGeometry(25, 2.5, 1.5);
        var bermMaterial = new THREE.MeshLambertMaterial({ color: 0x6B7A2A });
        var berm = new THREE.Mesh(bermGeometry, bermMaterial);
        berm.position.set(baseX - 5, 1.25, baseZ + 15);
        berm.castShadow = true;
        berm.receiveShadow = true;
        scene.add(berm);
        objects.push(berm);

        // Church tower - snipers nest
        var towerGeometry = new THREE.CylinderGeometry(2.5, 2.5, 18, 20);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(baseX + 12, 9, baseZ - 8);
        tower.castShadow = true;
        tower.receiveShadow = true;
        scene.add(tower);
        objects.push(tower);

        // Tower battlement ring
        var battlementGeometry = new THREE.BoxGeometry(5.5, 1.2, 5.5);
        var battlementMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var battlement = new THREE.Mesh(battlementGeometry, battlementMaterial);
        battlement.position.set(baseX + 12, 18.5, baseZ - 8);
        battlement.castShadow = true;
        battlement.receiveShadow = true;
        scene.add(battlement);
        objects.push(battlement);

        // Ammunition depot - 5 crates
        var crateGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var crate1 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate1.position.set(baseX - 3, 0.75, baseZ + 6);
        crate1.castShadow = true;
        crate1.receiveShadow = true;
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate2.position.set(baseX - 0.5, 0.75, baseZ + 6);
        crate2.castShadow = true;
        crate2.receiveShadow = true;
        scene.add(crate2);
        objects.push(crate2);

        var crate3 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate3.position.set(baseX + 2, 0.75, baseZ + 6);
        crate3.castShadow = true;
        crate3.receiveShadow = true;
        scene.add(crate3);
        objects.push(crate3);

        var crate4 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate4.position.set(baseX - 2, 2.3, baseZ + 6);
        crate4.castShadow = true;
        crate4.receiveShadow = true;
        scene.add(crate4);
        objects.push(crate4);

        var crate5 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate5.position.set(baseX + 1, 2.3, baseZ + 6);
        crate5.castShadow = true;
        crate5.receiveShadow = true;
        scene.add(crate5);
        objects.push(crate5);

        // Ammunition depot shed
        var shedGeometry = new THREE.BoxGeometry(5, 3.5, 4);
        var shedMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var shed = new THREE.Mesh(shedGeometry, shedMaterial);
        shed.position.set(baseX - 1, 1.75, baseZ + 10);
        shed.castShadow = true;
        shed.receiveShadow = true;
        scene.add(shed);
        objects.push(shed);

        // Peter Pan statue-turned-beacon plinth
        var plinthGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2, 16);
        var plinthMaterial = new THREE.MeshLambertMaterial({ color: 0xB87333 });
        var plinth = new THREE.Mesh(plinthGeometry, plinthMaterial);
        plinth.position.set(baseX - 15, 1, baseZ + 3);
        plinth.castShadow = true;
        plinth.receiveShadow = true;
        scene.add(plinth);
        objects.push(plinth);

        // Beacon figure (SphereGeometry)
        var figureGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        var figureMaterial = new THREE.MeshLambertMaterial({ color: 0xCD7F32 });
        var figure = new THREE.Mesh(figureGeometry, figureMaterial);
        figure.position.set(baseX - 15, 2.8, baseZ + 3);
        figure.castShadow = true;
        figure.receiveShadow = true;
        scene.add(figure);
        objects.push(figure);

        // Defensive wire zigzag along glen approach (LineSegments)
        var wireGeometry = new THREE.BufferGeometry();
        var wirePoints = [
            new THREE.Vector3(baseX - 20, 0.5, baseZ - 20),
            new THREE.Vector3(baseX - 15, 1.2, baseZ - 18),
            new THREE.Vector3(baseX - 10, 0.5, baseZ - 20),
            new THREE.Vector3(baseX - 5, 1.2, baseZ - 18),
            new THREE.Vector3(baseX, 0.5, baseZ - 20),
            new THREE.Vector3(baseX + 5, 1.2, baseZ - 18),
            new THREE.Vector3(baseX + 10, 0.5, baseZ - 20)
        ];
        wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array().concat.apply(new Float32Array(), wirePoints.map(function(p) { return [p.x, p.y, p.z]; })), 3));
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513 });
        var wire = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wire);
        objects.push(wire);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(baseX + 20, 25, baseZ + 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
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
