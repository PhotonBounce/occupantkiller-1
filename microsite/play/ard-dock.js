window.ArdDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        // Dense forest box terrain
        var terrainGeometry = new THREE.BoxGeometry(100, 8, 100);
        var terrainMaterial = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.position.set(0, -5, 0);
        scene.add(terrain);
        objects.push(terrain);

        // Forest trees - box trunks scattered
        var treePositions = [
            [-25, 2, -25], [20, 2, -30], [-30, 2, 10], [25, 2, 20],
            [-15, 2, 15], [10, 2, -20], [-20, 2, 28], [28, 2, -10]
        ];
        for (var i = 0; i < treePositions.length; i++) {
            var treeGeometry = new THREE.BoxGeometry(3, 12, 3);
            var treeMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            var tree = new THREE.Mesh(treeGeometry, treeMaterial);
            tree.position.set(treePositions[i][0], treePositions[i][1], treePositions[i][2]);
            scene.add(tree);
            objects.push(tree);
        }

        // Timber mill building - converted to arms factory
        var millGeometry = new THREE.BoxGeometry(20, 10, 15);
        var millMaterial = new THREE.MeshLambertMaterial({ color: 0x704030 });
        var mill = new THREE.Mesh(millGeometry, millMaterial);
        mill.position.set(-20, 5, 0);
        scene.add(mill);
        objects.push(mill);

        // Saw blade mount cylinder
        var bladeGeometry = new THREE.CylinderGeometry(4, 4, 1, 32);
        var bladeMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.set(-20, 11, 0);
        scene.add(blade);
        objects.push(blade);

        // Forest fire observation tower - cylinder
        var towerGeometry = new THREE.CylinderGeometry(2.5, 3, 25, 16);
        var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(15, 12.5, -20);
        scene.add(tower);
        objects.push(tower);

        // Lookout cabin on tower top - box
        var cabinGeometry = new THREE.BoxGeometry(5, 4, 5);
        var cabinMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(15, 28, -20);
        scene.add(cabin);
        objects.push(cabin);

        // Hidden submarine pen - box concrete roof
        var penGeometry = new THREE.BoxGeometry(30, 8, 20);
        var penMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var pen = new THREE.Mesh(penGeometry, penMaterial);
        pen.position.set(0, 4, 25);
        scene.add(pen);
        objects.push(pen);

        // Submarine conning tower - cylinder
        var conningGeometry = new THREE.CylinderGeometry(1.5, 2, 6, 16);
        var conningMaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var conning = new THREE.Mesh(conningGeometry, conningMaterial);
        conning.position.set(5, 8, 28);
        scene.add(conning);
        objects.push(conning);

        // Forest trail IED tripwire 1 - LineSegments
        var wireGeometry1 = new THREE.BufferGeometry();
        var wirePositions1 = new Float32Array([
            -10, 0.5, -15,
            10, 0.5, -15
        ]);
        wireGeometry1.setAttribute('position', new THREE.BufferAttribute(wirePositions1, 3));
        var wireMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var wire1 = new THREE.LineSegments(wireGeometry1, wireMaterial);
        scene.add(wire1);
        objects.push(wire1);

        // Forest trail IED tripwire 2 - LineSegments
        var wireGeometry2 = new THREE.BufferGeometry();
        var wirePositions2 = new Float32Array([
            -10, 0.5, 5,
            10, 0.5, 5
        ]);
        wireGeometry2.setAttribute('position', new THREE.BufferAttribute(wirePositions2, 3));
        var wire2 = new THREE.LineSegments(wireGeometry2, wireMaterial);
        scene.add(wire2);
        objects.push(wire2);

        // Logging road convoy ambush - fallen trunk barrier
        var trunkGeometry = new THREE.BoxGeometry(25, 2, 3);
        var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4a3d });
        var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.rotation.z = 0.3;
        trunk.position.set(0, 1, -30);
        scene.add(trunk);
        objects.push(trunk);

        // Truck wreck - box
        var truckGeometry = new THREE.BoxGeometry(8, 5, 15);
        var truckMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var truck = new THREE.Mesh(truckGeometry, truckMaterial);
        truck.rotation.z = 0.2;
        truck.position.set(15, 2.5, -32);
        scene.add(truck);
        objects.push(truck);

        // Underwater explosive anchor chain - LineSegments from dock to mine
        var chainGeometry = new THREE.BufferGeometry();
        var chainPositions = new Float32Array([
            8, 0, 28,
            12, -8, 32
        ]);
        chainGeometry.setAttribute('position', new THREE.BufferAttribute(chainPositions, 3));
        var chainMaterial = new THREE.LineBasicMaterial({ color: 0xffa500, linewidth: 3 });
        var chain = new THREE.LineSegments(chainGeometry, chainMaterial);
        scene.add(chain);
        objects.push(chain);

        // Underwater explosive mine - sphere
        var mineGeometry = new THREE.SphereGeometry(2, 16, 16);
        var mineMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var mine = new THREE.Mesh(mineGeometry, mineMaterial);
        mine.position.set(12, -8, 32);
        scene.add(mine);
        objects.push(mine);

        // Wildfire escape trench - box earthwork
        var trenchGeometry = new THREE.BoxGeometry(35, 2, 4);
        var trenchMaterial = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var trench = new THREE.Mesh(trenchGeometry, trenchMaterial);
        trench.position.set(0, 0.5, -5);
        scene.add(trench);
        objects.push(trench);

        // Water pump - cylinder
        var pumpGeometry = new THREE.CylinderGeometry(1.2, 1.5, 5, 16);
        var pumpMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
        pump.position.set(-12, 2.5, -6);
        scene.add(pump);
        objects.push(pump);

        // Concrete dock structure - box
        var dockGeometry = new THREE.BoxGeometry(15, 3, 12);
        var dockMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var dock = new THREE.Mesh(dockGeometry, dockMaterial);
        dock.position.set(10, 1.5, 25);
        scene.add(dock);
        objects.push(dock);

        // Arms crates storage - box stack
        var crateGeometry = new THREE.BoxGeometry(6, 6, 6);
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var crate = new THREE.Mesh(crateGeometry, crateMaterial);
        crate.position.set(-18, 3, 12);
        scene.add(crate);
        objects.push(crate);

        // Gun emplacement bunker - cone
        var bunkerGeometry = new THREE.ConeGeometry(5, 4, 8);
        var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var bunker = new THREE.Mesh(bunkerGeometry, bunkerMaterial);
        bunker.position.set(25, 2, 5);
        scene.add(bunker);
        objects.push(bunker);

        // Ammunition magazine - cylinder
        var magGeometry = new THREE.CylinderGeometry(2, 2.5, 8, 16);
        var magMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var mag = new THREE.Mesh(magGeometry, magMaterial);
        mag.position.set(28, 4, 10);
        scene.add(mag);
        objects.push(mag);

        // Add ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light for dramatic forest shadows
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, -30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate rotating saw blade
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.CylinderGeometry &&
                objects[i].position.x === -20 && objects[i].position.y === 11) {
                objects[i].rotation.z += delta * 3;
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
