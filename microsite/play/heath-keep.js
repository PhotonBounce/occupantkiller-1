window.HeathKeep = (function() {
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
        // Perimeter wall ring - dry-stone fortification
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        // Wall section 1
        var wallGeo1 = new THREE.BoxGeometry(20, 8, 3);
        var wallMesh1 = new THREE.Mesh(wallGeo1, wallMaterial);
        wallMesh1.position.set(25, 4, 0);
        scene.add(wallMesh1);
        objects.push(wallMesh1);

        // Wall section 2
        var wallGeo2 = new THREE.BoxGeometry(20, 8, 3);
        var wallMesh2 = new THREE.Mesh(wallGeo2, wallMaterial);
        wallMesh2.position.set(-25, 4, 0);
        wallMesh2.rotation.y = 0;
        scene.add(wallMesh2);
        objects.push(wallMesh2);

        // Wall section 3 (perpendicular)
        var wallGeo3 = new THREE.BoxGeometry(3, 8, 20);
        var wallMesh3 = new THREE.Mesh(wallGeo3, wallMaterial);
        wallMesh3.position.set(0, 4, 25);
        scene.add(wallMesh3);
        objects.push(wallMesh3);

        // Wall section 4 (perpendicular)
        var wallGeo4 = new THREE.BoxGeometry(3, 8, 20);
        var wallMesh4 = new THREE.Mesh(wallGeo4, wallMaterial);
        wallMesh4.position.set(0, 4, -25);
        scene.add(wallMesh4);
        objects.push(wallMesh4);

        // Central command keep tower - stacked box floors narrowing upward
        var keepMaterialBase = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var keepMaterialTop = new THREE.MeshLambertMaterial({ color: 0x505050 });

        // Base floor (wide)
        var baseGeo = new THREE.BoxGeometry(12, 2, 12);
        var baseMesh = new THREE.Mesh(baseGeo, keepMaterialBase);
        baseMesh.position.set(0, 1, 0);
        scene.add(baseMesh);
        objects.push(baseMesh);

        // Middle floor
        var midGeo = new THREE.BoxGeometry(8, 2, 8);
        var midMesh = new THREE.Mesh(midGeo, keepMaterialBase);
        midMesh.position.set(0, 5, 0);
        scene.add(midMesh);
        objects.push(midMesh);

        // Top floor (narrow)
        var topGeo = new THREE.BoxGeometry(4, 2, 4);
        var topMesh = new THREE.Mesh(topGeo, keepMaterialTop);
        topMesh.position.set(0, 9, 0);
        scene.add(topMesh);
        objects.push(topMesh);

        // Central tower walls
        var towerWallGeo = new THREE.BoxGeometry(1, 8, 12);
        var towerWall = new THREE.Mesh(towerWallGeo, keepMaterialBase);
        towerWall.position.set(5, 5, 0);
        scene.add(towerWall);
        objects.push(towerWall);

        // Heather camouflage sphere clusters - purple-tinted bushes
        var heatherMaterial1 = new THREE.MeshLambertMaterial({ color: 0x9932CC });
        var heatherMaterial2 = new THREE.MeshLambertMaterial({ color: 0xBA55D3 });

        // Heather cluster 1
        var heatherGeo1 = new THREE.SphereGeometry(3, 12, 12);
        var heatherMesh1 = new THREE.Mesh(heatherGeo1, heatherMaterial1);
        heatherMesh1.position.set(-18, 2, -20);
        scene.add(heatherMesh1);
        objects.push(heatherMesh1);

        // Heather cluster 2
        var heatherGeo2 = new THREE.SphereGeometry(2.5, 12, 12);
        var heatherMesh2 = new THREE.Mesh(heatherGeo2, heatherMaterial2);
        heatherMesh2.position.set(20, 2, 18);
        scene.add(heatherMesh2);
        objects.push(heatherMesh2);

        // Heather cluster 3
        var heatherGeo3 = new THREE.SphereGeometry(2, 12, 12);
        var heatherMesh3 = new THREE.Mesh(heatherGeo3, heatherMaterial1);
        heatherMesh3.position.set(15, 2, -22);
        scene.add(heatherMesh3);
        objects.push(heatherMesh3);

        // Ground-level firing slits - box wall with LineSegments outline
        var slitWallGeo = new THREE.BoxGeometry(6, 4, 2);
        var slitWallMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var slitWall = new THREE.Mesh(slitWallGeo, slitWallMaterial);
        slitWall.position.set(0, 2, -12);
        scene.add(slitWall);
        objects.push(slitWall);

        // Slit outline with LineSegments
        var slitGeometry = new THREE.BufferGeometry();
        var slitPositions = new Float32Array([
            -2, 1, 0,  2, 1, 0,
            -2, -1, 0, 2, -1, 0,
            -2, 1, 0,  -2, -1, 0,
            2, 1, 0,   2, -1, 0
        ]);
        slitGeometry.setAttribute('position', new THREE.BufferAttribute(slitPositions, 3));
        var slitMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var slitLines = new THREE.LineSegments(slitGeometry, slitMaterial);
        slitLines.position.set(0, 2, -12);
        scene.add(slitLines);
        objects.push(slitLines);

        // Windmill observation platform - cylinder body + box sail arms
        var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var cylinderGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
        var cylinderMesh = new THREE.Mesh(cylinderGeo, cylinderMaterial);
        cylinderMesh.position.set(22, 5, -15);
        scene.add(cylinderMesh);
        objects.push(cylinderMesh);

        // Sail arm 1
        var sailGeo1 = new THREE.BoxGeometry(8, 1, 0.5);
        var sailMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var sailMesh1 = new THREE.Mesh(sailGeo1, sailMaterial);
        sailMesh1.position.set(22, 10, -15);
        scene.add(sailMesh1);
        objects.push(sailMesh1);

        // Sail arm 2 (perpendicular)
        var sailGeo2 = new THREE.BoxGeometry(0.5, 1, 8);
        var sailMesh2 = new THREE.Mesh(sailGeo2, sailMaterial);
        sailMesh2.position.set(22, 10, -15);
        scene.add(sailMesh2);
        objects.push(sailMesh2);

        // Bell heather IED minefield marker spheres
        var minerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });

        // Minefield marker 1
        var minerGeo1 = new THREE.SphereGeometry(1.2, 10, 10);
        var minerMesh1 = new THREE.Mesh(minerGeo1, minerMaterial);
        minerMesh1.position.set(-10, 1, 8);
        scene.add(minerMesh1);
        objects.push(minerMesh1);

        // Minefield marker 2
        var minerGeo2 = new THREE.SphereGeometry(1.2, 10, 10);
        var minerMesh2 = new THREE.Mesh(minerGeo2, minerMaterial);
        minerMesh2.position.set(8, 1, -15);
        scene.add(minerMesh2);
        objects.push(minerMesh2);

        // Minefield marker 3
        var minerGeo3 = new THREE.SphereGeometry(1.2, 10, 10);
        var minerMesh3 = new THREE.Mesh(minerGeo3, minerMaterial);
        minerMesh3.position.set(-20, 1, 12);
        scene.add(minerMesh3);
        objects.push(minerMesh3);

        // Underground escape hatch - box hatch flush with sphere mound
        var hatchMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var hatchGeo = new THREE.BoxGeometry(3, 0.5, 3);
        var hatchMesh = new THREE.Mesh(hatchGeo, hatchMaterial);
        hatchMesh.position.set(-8, 0.25, 20);
        scene.add(hatchMesh);
        objects.push(hatchMesh);

        // Hatch mound sphere
        var moundGeo = new THREE.SphereGeometry(2.5, 12, 12);
        var moundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        var moundMesh = new THREE.Mesh(moundGeo, moundMaterial);
        moundMesh.position.set(-8, 1.5, 20);
        scene.add(moundMesh);
        objects.push(moundMesh);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate heather sphere clusters (subtle bob)
        if (objects.length > 10) {
            var time = Date.now() * 0.001;
            for (var i = 9; i < 12 && i < objects.length; i++) {
                if (objects[i] && objects[i].geometry && objects[i].geometry.type === 'SphereGeometry') {
                    objects[i].position.y += Math.sin(time + i) * 0.01;
                }
            }
        }

        // Windmill rotation
        if (objects.length > 16 && objects[16]) {
            objects[16].rotation.z += 0.02;
        }
        if (objects.length > 17 && objects[17]) {
            objects[17].rotation.z += 0.02;
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
