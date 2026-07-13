window.DaleKeep = (function() {
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
        // Dry stone wall enclosure (stacked box layers forming field walls)
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });

        // Base stone wall - left side
        var wallGeom1 = new THREE.BoxGeometry(2, 3, 20);
        var wall1 = new THREE.Mesh(wallGeom1, wallMaterial);
        wall1.position.set(-25, 1.5, 0);
        scene.add(wall1);
        objects.push(wall1);

        // Base stone wall - right side
        var wallGeom2 = new THREE.BoxGeometry(2, 3, 20);
        var wall2 = new THREE.Mesh(wallGeom2, wallMaterial);
        wall2.position.set(25, 1.5, 0);
        scene.add(wall2);
        objects.push(wall2);

        // Base stone wall - back
        var wallGeom3 = new THREE.BoxGeometry(50, 3, 2);
        var wall3 = new THREE.Mesh(wallGeom3, wallMaterial);
        wall3.position.set(0, 1.5, -25);
        scene.add(wall3);
        objects.push(wall3);

        // Base stone wall - front
        var wallGeom4 = new THREE.BoxGeometry(50, 3, 2);
        var wall4 = new THREE.Mesh(wallGeom4, wallMaterial);
        wall4.position.set(0, 1.5, 25);
        scene.add(wall4);
        objects.push(wall4);

        // Upper wall section - left
        var upperWallGeom1 = new THREE.BoxGeometry(2, 2, 18);
        var upperWall1 = new THREE.Mesh(upperWallGeom1, wallMaterial);
        upperWall1.position.set(-25, 4.5, 0);
        scene.add(upperWall1);
        objects.push(upperWall1);

        // Upper wall section - right
        var upperWallGeom2 = new THREE.BoxGeometry(2, 2, 18);
        var upperWall2 = new THREE.Mesh(upperWallGeom2, wallMaterial);
        upperWall2.position.set(25, 4.5, 0);
        scene.add(upperWall2);
        objects.push(upperWall2);

        // Limestone barn converted to barracks - main structure
        var barnMaterial = new THREE.MeshLambertMaterial({ color: 0xd4a574 });
        var barnGeom = new THREE.BoxGeometry(15, 6, 12);
        var barn = new THREE.Mesh(barnGeom, barnMaterial);
        barn.position.set(-10, 3, -8);
        scene.add(barn);
        objects.push(barn);

        // Barn roof structure
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var roofGeom = new THREE.ConeGeometry(8, 4, 6);
        var roof = new THREE.Mesh(roofGeom, roofMaterial);
        roof.position.set(-10, 9, -8);
        scene.add(roof);
        objects.push(roof);

        // Dale limestone pavement - flat box grid base
        var paveMaterial = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
        var paveGeom = new THREE.BoxGeometry(40, 0.5, 40);
        var pave = new THREE.Mesh(paveGeom, paveMaterial);
        pave.position.set(0, 0.25, 0);
        scene.add(pave);
        objects.push(pave);

        // Pavement gap channels - channel 1
        var channelGeom1 = new THREE.BoxGeometry(38, 0.1, 2);
        var channel1 = new THREE.Mesh(channelGeom1, new THREE.MeshLambertMaterial({ color: 0x555555 }));
        channel1.position.set(0, 0.3, -10);
        scene.add(channel1);
        objects.push(channel1);

        // Pavement gap channels - channel 2
        var channelGeom2 = new THREE.BoxGeometry(38, 0.1, 2);
        var channel2 = new THREE.Mesh(channelGeom2, new THREE.MeshLambertMaterial({ color: 0x555555 }));
        channel2.position.set(0, 0.3, 10);
        scene.add(channel2);
        objects.push(channel2);

        // Hay bale firing positions - sphere bales behind walls
        var baleMaterial = new THREE.MeshLambertMaterial({ color: 0xf4a460 });
        var baleGeom1 = new THREE.SphereGeometry(2.5, 12, 12);
        var bale1 = new THREE.Mesh(baleGeom1, baleMaterial);
        bale1.position.set(-20, 4, -18);
        scene.add(bale1);
        objects.push(bale1);

        // Hay bale 2
        var bale2 = new THREE.Mesh(baleGeom1, baleMaterial);
        bale2.position.set(0, 4, -18);
        scene.add(bale2);
        objects.push(bale2);

        // Hay bale 3
        var bale3 = new THREE.Mesh(baleGeom1, baleMaterial);
        bale3.position.set(20, 4, -18);
        scene.add(bale3);
        objects.push(bale3);

        // Dovecote converted to signal tower - cylinder base
        var doveMaterial = new THREE.MeshLambertMaterial({ color: 0xa0826d });
        var doveCylGeom = new THREE.CylinderGeometry(3, 3, 8, 8);
        var doveCyl = new THREE.Mesh(doveCylGeom, doveMaterial);
        doveCyl.position.set(15, 4, 12);
        scene.add(doveCyl);
        objects.push(doveCyl);

        // Signal tower top - cone with hole pattern (represented as cone)
        var towerTopGeom = new THREE.ConeGeometry(3.5, 3, 8);
        var towerTop = new THREE.Mesh(towerTopGeom, new THREE.MeshLambertMaterial({ color: 0x8b6f47 }));
        towerTop.position.set(15, 11.5, 12);
        scene.add(towerTop);
        objects.push(towerTop);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 20, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation placeholder
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.z += delta * 0.1;
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
