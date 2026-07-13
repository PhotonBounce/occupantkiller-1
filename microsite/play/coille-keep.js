window.CoilleKeep = (function() {
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
        var greenMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var darkGreenMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a0a });
        var brownMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var redBrownMaterial = new THREE.MeshLambertMaterial({ color: 0x8b5a3c });
        var grayMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var mossGreenMaterial = new THREE.MeshLambertMaterial({ color: 0x3d6b1f });

        // Tree trunk 1 (main central trunk)
        var trunkGeom1 = new THREE.CylinderGeometry(4, 5, 60, 8);
        var trunk1 = new THREE.Mesh(trunkGeom1, redBrownMaterial);
        trunk1.position.set(0, 30, 0);
        trunk1.castShadow = true;
        scene.add(trunk1);
        objects.push(trunk1);

        // Tree trunk 2 (left side)
        var trunkGeom2 = new THREE.CylinderGeometry(3.5, 4.5, 50, 8);
        var trunk2 = new THREE.Mesh(trunkGeom2, redBrownMaterial);
        trunk2.position.set(-25, 25, -15);
        trunk2.castShadow = true;
        scene.add(trunk2);
        objects.push(trunk2);

        // Tree trunk 3 (right side)
        var trunkGeom3 = new THREE.CylinderGeometry(3.5, 4.5, 50, 8);
        var trunk3 = new THREE.Mesh(trunkGeom3, redBrownMaterial);
        trunk3.position.set(25, 25, 15);
        trunk3.castShadow = true;
        scene.add(trunk3);
        objects.push(trunk3);

        // Canopy sphere 1 (main large canopy on central trunk)
        var canopyGeom1 = new THREE.SphereGeometry(18, 12, 12);
        var canopy1 = new THREE.Mesh(canopyGeom1, darkGreenMaterial);
        canopy1.position.set(0, 70, 0);
        canopy1.castShadow = true;
        scene.add(canopy1);
        objects.push(canopy1);

        // Canopy sphere 2 (left trunk canopy)
        var canopyGeom2 = new THREE.SphereGeometry(15, 12, 12);
        var canopy2 = new THREE.Mesh(canopyGeom2, greenMaterial);
        canopy2.position.set(-25, 60, -15);
        canopy2.castShadow = true;
        scene.add(canopy2);
        objects.push(canopy2);

        // Canopy sphere 3 (right trunk canopy)
        var canopyGeom3 = new THREE.SphereGeometry(15, 12, 12);
        var canopy3 = new THREE.Mesh(canopyGeom3, greenMaterial);
        canopy3.position.set(25, 60, 15);
        canopy3.castShadow = true;
        scene.add(canopy3);
        objects.push(canopy3);

        // Treehouse command post floor 1 (box)
        var floorGeom1 = new THREE.BoxGeometry(14, 2, 14);
        var floor1 = new THREE.Mesh(floorGeom1, brownMaterial);
        floor1.position.set(0, 45, 0);
        floor1.castShadow = true;
        scene.add(floor1);
        objects.push(floor1);

        // Treehouse command post floor 2 (box)
        var floorGeom2 = new THREE.BoxGeometry(12, 2, 12);
        var floor2 = new THREE.Mesh(floorGeom2, brownMaterial);
        floor2.position.set(-20, 38, -10);
        floor2.castShadow = true;
        scene.add(floor2);
        objects.push(floor2);

        // Treehouse command post floor 3 (box)
        var floorGeom3 = new THREE.BoxGeometry(12, 2, 12);
        var floor3 = new THREE.Mesh(floorGeom3, brownMaterial);
        floor3.position.set(20, 38, 10);
        floor3.castShadow = true;
        scene.add(floor3);
        objects.push(floor3);

        // Pine cone IED tripwire 1 (sphere)
        var coneGeom1 = new THREE.SphereGeometry(2.5, 10, 10);
        var cone1 = new THREE.Mesh(coneGeom1, mossGreenMaterial);
        cone1.position.set(-18, 22, 8);
        cone1.castShadow = true;
        scene.add(cone1);
        objects.push(cone1);

        // Pine cone IED tripwire 2 (sphere)
        var coneGeom2 = new THREE.SphereGeometry(2.2, 10, 10);
        var cone2 = new THREE.Mesh(coneGeom2, mossGreenMaterial);
        cone2.position.set(22, 18, -12);
        cone2.castShadow = true;
        scene.add(cone2);
        objects.push(cone2);

        // Tripwire LineSegments 1
        var wireGeom1 = new THREE.BufferGeometry();
        var wirePos1 = new Float32Array([
            -18, 22, 8,
            -15, 20, 12
        ]);
        wireGeom1.setAttribute('position', new THREE.BufferAttribute(wirePos1, 3));
        var wireMat1 = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var wire1 = new THREE.LineSegments(wireGeom1, wireMat1);
        scene.add(wire1);
        objects.push(wire1);

        // Tripwire LineSegments 2
        var wireGeom2 = new THREE.BufferGeometry();
        var wirePos2 = new Float32Array([
            22, 18, -12,
            19, 16, -8
        ]);
        wireGeom2.setAttribute('position', new THREE.BufferAttribute(wirePos2, 3));
        var wireMat2 = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var wire2 = new THREE.LineSegments(wireGeom2, wireMat2);
        scene.add(wire2);
        objects.push(wire2);

        // Moss-covered log barricade (horizontal cylinder)
        var barricadeGeom = new THREE.CylinderGeometry(3, 3, 26, 8);
        var barricade = new THREE.Mesh(barricadeGeom, brownMaterial);
        barricade.rotation.z = Math.PI / 2;
        barricade.position.set(-28, 8, 0);
        barricade.castShadow = true;
        scene.add(barricade);
        objects.push(barricade);

        // Moss cluster on barricade 1 (sphere)
        var mossGeom1 = new THREE.SphereGeometry(2, 10, 10);
        var moss1 = new THREE.Mesh(mossGeom1, mossGreenMaterial);
        moss1.position.set(-20, 8, 3);
        moss1.castShadow = true;
        scene.add(moss1);
        objects.push(moss1);

        // Moss cluster on barricade 2 (sphere)
        var mossGeom2 = new THREE.SphereGeometry(2.2, 10, 10);
        var moss2 = new THREE.Mesh(mossGeom2, mossGreenMaterial);
        moss2.position.set(-35, 8, -4);
        moss2.castShadow = true;
        scene.add(moss2);
        objects.push(moss2);

        // Hidden weapons cache crate (box below ground)
        var crateGeom = new THREE.BoxGeometry(8, 6, 8);
        var crate = new THREE.Mesh(crateGeom, stoneMaterial);
        crate.position.set(28, -3, -20);
        crate.castShadow = true;
        scene.add(crate);
        objects.push(crate);

        // Carved-bark signal code pattern 1 on trunk (LineSegments)
        var signalGeom1 = new THREE.BufferGeometry();
        var signalPos1 = new Float32Array([
            -2, 35, 5,
            2, 35, 5,
            2, 45, 5,
            -2, 45, 5
        ]);
        signalGeom1.setAttribute('position', new THREE.BufferAttribute(signalPos1, 3));
        var signalMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var signal1 = new THREE.LineSegments(signalGeom1, signalMat);
        scene.add(signal1);
        objects.push(signal1);

        // Carved-bark signal code pattern 2 on trunk (LineSegments)
        var signalGeom2 = new THREE.BufferGeometry();
        var signalPos2 = new Float32Array([
            -3, 50, 5,
            3, 50, 5,
            0, 55, 5,
            -3, 50, 5
        ]);
        signalGeom2.setAttribute('position', new THREE.BufferAttribute(signalPos2, 3));
        var signal2 = new THREE.LineSegments(signalGeom2, signalMat);
        scene.add(signal2);
        objects.push(signal2);

        // Watchtower crow's nest platform (box high on trunk)
        var nestGeom = new THREE.BoxGeometry(10, 2, 10);
        var nest = new THREE.Mesh(nestGeom, stoneMaterial);
        nest.position.set(0, 78, 0);
        nest.castShadow = true;
        scene.add(nest);
        objects.push(nest);

        // Watchtower crow's nest support cone (decorative)
        var supportGeom = new THREE.ConeGeometry(6, 8, 8);
        var support = new THREE.Mesh(supportGeom, grayMaterial);
        support.position.set(0, 74, 0);
        support.castShadow = true;
        scene.add(support);
        objects.push(support);

        // Additional atmospheric canopy sphere 4 (overlapping far back)
        var canopyGeom4 = new THREE.SphereGeometry(16, 12, 12);
        var canopy4 = new THREE.Mesh(canopyGeom4, greenMaterial);
        canopy4.position.set(-10, 55, -30);
        canopy4.castShadow = true;
        scene.add(canopy4);
        objects.push(canopy4);

        // Additional atmospheric canopy sphere 5 (overlapping far right)
        var canopyGeom5 = new THREE.SphereGeometry(14, 12, 12);
        var canopy5 = new THREE.Mesh(canopyGeom5, darkGreenMaterial);
        canopy5.position.set(28, 52, 25);
        canopy5.castShadow = true;
        scene.add(canopy5);
        objects.push(canopy5);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for forest sunlight filtering through canopy
        var dirLight = new THREE.DirectionalLight(0xffffcc, 0.8);
        dirLight.position.set(15, 50, 20);
        dirLight.castShadow = true;
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.05;
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
