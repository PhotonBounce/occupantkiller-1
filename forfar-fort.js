window.ForfarFort = (function() {
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
        var baseX = 340;
        var baseZ = 280;

        // County courthouse command center (8x6x5)
        var courthouseGeometry = new THREE.BoxGeometry(8, 6, 5);
        var courthouseMaterial = new THREE.MeshLambertMaterial({color: 0xD2B48C});
        var courthouse = new THREE.Mesh(courthouseGeometry, courthouseMaterial);
        courthouse.position.set(baseX, 3, baseZ);
        scene.add(courthouse);
        objects.push(courthouse);

        // Castle mound earthwork (12x3x12)
        var moundGeometry = new THREE.BoxGeometry(12, 3, 12);
        var moundMaterial = new THREE.MeshLambertMaterial({color: 0x8B6914});
        var mound = new THREE.Mesh(moundGeometry, moundMaterial);
        mound.position.set(baseX + 20, 1.5, baseZ + 15);
        scene.add(mound);
        objects.push(mound);

        // Fortified market square platform (10x0.5x10)
        var platformGeometry = new THREE.BoxGeometry(10, 0.5, 10);
        var platformMaterial = new THREE.MeshLambertMaterial({color: 0x808080});
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(baseX - 15, 0.25, baseZ - 10);
        scene.add(platform);
        objects.push(platform);

        // Perimeter walls for market square (4 walls)
        var wallGeometry = new THREE.BoxGeometry(10, 1.2, 0.4);
        var wallMaterial = new THREE.MeshLambertMaterial({color: 0x696969});
        var wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall1.position.set(baseX - 15, 0.8, baseZ - 15);
        scene.add(wall1);
        objects.push(wall1);

        var wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
        wall2.position.set(baseX - 15, 0.8, baseZ - 5);
        scene.add(wall2);
        objects.push(wall2);

        var wall3Geometry = new THREE.BoxGeometry(0.4, 1.2, 10);
        var wall3 = new THREE.Mesh(wall3Geometry, wallMaterial);
        wall3.position.set(baseX - 20, 0.8, baseZ - 10);
        scene.add(wall3);
        objects.push(wall3);

        var wall4 = new THREE.Mesh(wall3Geometry, wallMaterial);
        wall4.position.set(baseX - 10, 0.8, baseZ - 10);
        scene.add(wall4);
        objects.push(wall4);

        // Barricaded high street - 4 overturned vehicle hulks
        var vehicleGeometry1 = new THREE.BoxGeometry(3, 2, 1.5);
        var vehicleMaterial1 = new THREE.MeshLambertMaterial({color: 0x505050});
        var vehicle1 = new THREE.Mesh(vehicleGeometry1, vehicleMaterial1);
        vehicle1.position.set(baseX - 25, 1, baseZ + 5);
        vehicle1.rotation.z = 0.3;
        scene.add(vehicle1);
        objects.push(vehicle1);

        var vehicleMaterial2 = new THREE.MeshLambertMaterial({color: 0x606060});
        var vehicle2 = new THREE.Mesh(vehicleGeometry1, vehicleMaterial2);
        vehicle2.position.set(baseX - 25, 1, baseZ + 10);
        vehicle2.rotation.z = -0.3;
        scene.add(vehicle2);
        objects.push(vehicle2);

        var vehicleGeometry2 = new THREE.BoxGeometry(2.5, 1.8, 1.2);
        var vehicleMaterial3 = new THREE.MeshLambertMaterial({color: 0x707070});
        var vehicle3 = new THREE.Mesh(vehicleGeometry2, vehicleMaterial3);
        vehicle3.position.set(baseX - 30, 0.9, baseZ + 7);
        vehicle3.rotation.z = 0.4;
        scene.add(vehicle3);
        objects.push(vehicle3);

        var vehicleMaterial4 = new THREE.MeshLambertMaterial({color: 0x555555});
        var vehicle4 = new THREE.Mesh(vehicleGeometry2, vehicleMaterial4);
        vehicle4.position.set(baseX - 20, 0.9, baseZ + 8);
        vehicle4.rotation.z = -0.35;
        scene.add(vehicle4);
        objects.push(vehicle4);

        // Sniper tower - church steeple
        var steepleBaseGeometry = new THREE.CylinderGeometry(2, 2.5, 3, 8);
        var steepleBaseMaterial = new THREE.MeshLambertMaterial({color: 0x8B0000});
        var steepleBase = new THREE.Mesh(steepleBaseGeometry, steepleBaseMaterial);
        steepleBase.position.set(baseX + 30, 1.5, baseZ - 20);
        scene.add(steepleBase);
        objects.push(steepleBase);

        var steepleGeometry = new THREE.BoxGeometry(1.5, 4, 1.5);
        var steepleMaterial = new THREE.MeshLambertMaterial({color: 0xA52A2A});
        var steeple = new THREE.Mesh(steepleGeometry, steepleMaterial);
        steeple.position.set(baseX + 30, 5, baseZ - 20);
        scene.add(steeple);
        objects.push(steeple);

        var topGeometry = new THREE.ConeGeometry(1.2, 2, 8);
        var topMaterial = new THREE.MeshLambertMaterial({color: 0x654321});
        var top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(baseX + 30, 7.5, baseZ - 20);
        scene.add(top);
        objects.push(top);

        // Artillery position - gun on mound
        var gunBaseGeometry = new THREE.CylinderGeometry(1.5, 1.8, 0.8, 8);
        var gunBaseMaterial = new THREE.MeshLambertMaterial({color: 0x2F4F4F});
        var gunBase = new THREE.Mesh(gunBaseGeometry, gunBaseMaterial);
        gunBase.position.set(baseX + 25, 3, baseZ + 25);
        scene.add(gunBase);
        objects.push(gunBase);

        var barrelGeometry = new THREE.BoxGeometry(0.6, 0.6, 5);
        var barrelMaterial = new THREE.MeshLambertMaterial({color: 0x1C1C1C});
        var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(baseX + 25, 3.8, baseZ + 27);
        barrel.rotation.x = 0.4;
        scene.add(barrel);
        objects.push(barrel);

        // Supply storage - 5 crates
        var crateGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        var crateMaterial = new THREE.MeshLambertMaterial({color: 0x556B2F});

        var crate1 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate1.position.set(baseX - 35, 0.6, baseZ - 25);
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate2.position.set(baseX - 35, 1.8, baseZ - 25);
        scene.add(crate2);
        objects.push(crate2);

        var crate3 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate3.position.set(baseX - 33.8, 0.6, baseZ - 25);
        scene.add(crate3);
        objects.push(crate3);

        var crate4 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate4.position.set(baseX - 33.8, 1.8, baseZ - 25);
        scene.add(crate4);
        objects.push(crate4);

        var crate5 = new THREE.Mesh(crateGeometry, crateMaterial);
        crate5.position.set(baseX - 34.4, 3, baseZ - 25);
        scene.add(crate5);
        objects.push(crate5);

        // Anti-infantry wire obstacles - LineSegments grid pattern
        var wireGeometry = new THREE.BufferGeometry();
        var positions = [];

        // Horizontal wires
        for (var x = baseX - 40; x <= baseX + 40; x += 10) {
            for (var z = baseZ + 30; z <= baseZ + 40; z += 2) {
                positions.push(x, 0.3, z);
                positions.push(x, 0.3, z);
            }
        }

        // Vertical wires
        for (var z = baseZ + 30; z <= baseZ + 40; z += 10) {
            for (var x = baseX - 40; x <= baseX + 40; x += 2) {
                positions.push(x, 0.3, z);
                positions.push(x, 0.3, z);
            }
        }

        wireGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        var wireMaterial = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1});
        var wires = new THREE.LineSegments(wireGeometry, wireMaterial);
        scene.add(wires);
        objects.push(wires);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(baseX + 50, 20, baseZ + 50);
        scene.add(directionalLight);
        lights.push(directionalLight);

        var pointLight = new THREE.PointLight(0xFFFF00, 0.4);
        pointLight.position.set(baseX + 30, 8, baseZ - 20);
        scene.add(pointLight);
        lights.push(pointLight);
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
