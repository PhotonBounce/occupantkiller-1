window.LenyCamp = (function() {
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
        // Gorge terrain - narrow box canyon walls
        var gorgeNorthMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var gorgeNorthGeo = new THREE.BoxGeometry(80, 40, 8);
        var gorgeNorth = new THREE.Mesh(gorgeNorthGeo, gorgeNorthMat);
        gorgeNorth.position.set(0, 20, -35);
        scene.add(gorgeNorth);
        objects.push(gorgeNorth);

        var gorgeSouthMat = new THREE.MeshLambertMaterial({ color: 0x454545 });
        var gorgeSouthGeo = new THREE.BoxGeometry(80, 40, 8);
        var gorgeSouth = new THREE.Mesh(gorgeSouthGeo, gorgeSouthMat);
        gorgeSouth.position.set(0, 20, 35);
        scene.add(gorgeSouth);
        objects.push(gorgeSouth);

        // River channel floor
        var riverMat = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
        var riverGeo = new THREE.BoxGeometry(20, 2, 70);
        var river = new THREE.Mesh(riverGeo, riverMat);
        river.position.set(0, 0, 0);
        scene.add(river);
        objects.push(river);

        // River rapid boulders
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var boulder1Geo = new THREE.BoxGeometry(6, 5, 6);
        var boulder1 = new THREE.Mesh(boulder1Geo, boulderMat);
        boulder1.position.set(-8, 3, -20);
        boulder1.rotation.z = 0.3;
        scene.add(boulder1);
        objects.push(boulder1);

        var boulder2Geo = new THREE.BoxGeometry(7, 4, 5);
        var boulder2 = new THREE.Mesh(boulder2Geo, boulderMat);
        boulder2.position.set(6, 2, 0);
        boulder2.rotation.x = 0.4;
        scene.add(boulder2);
        objects.push(boulder2);

        var boulder3Geo = new THREE.BoxGeometry(5, 6, 7);
        var boulder3 = new THREE.Mesh(boulder3Geo, boulderMat);
        boulder3.position.set(-5, 3, 15);
        boulder3.rotation.z = -0.2;
        scene.add(boulder3);
        objects.push(boulder3);

        // Abandoned hydroelectric plant - turbine house
        var turbineHouseMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var turbineHouseGeo = new THREE.BoxGeometry(16, 12, 14);
        var turbineHouse = new THREE.Mesh(turbineHouseGeo, turbineHouseMat);
        turbineHouse.position.set(28, 6, -18);
        scene.add(turbineHouse);
        objects.push(turbineHouse);

        // Penstocks (cylinder pipes)
        var penstockMat = new THREE.MeshLambertMaterial({ color: 0x704020 });
        var penstock1Geo = new THREE.CylinderGeometry(2, 2, 20, 8);
        var penstock1 = new THREE.Mesh(penstock1Geo, penstockMat);
        penstock1.position.set(22, 14, -18);
        penstock1.rotation.z = 0.4;
        scene.add(penstock1);
        objects.push(penstock1);

        var penstock2Geo = new THREE.CylinderGeometry(2, 2, 18, 8);
        var penstock2 = new THREE.Mesh(penstock2Geo, penstockMat);
        penstock2.position.set(32, 12, -16);
        penstock2.rotation.z = 0.35;
        scene.add(penstock2);
        objects.push(penstock2);

        // Road block checkpoint - barriers
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0xc41e3a });
        var barrier1Geo = new THREE.BoxGeometry(12, 3, 2);
        var barrier1 = new THREE.Mesh(barrier1Geo, barrierMat);
        barrier1.position.set(-20, 2, -8);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2Geo = new THREE.BoxGeometry(12, 3, 2);
        var barrier2 = new THREE.Mesh(barrier2Geo, barrierMat);
        barrier2.position.set(-20, 2, 8);
        scene.add(barrier2);
        objects.push(barrier2);

        // Checkpoint bollards (cylinders)
        var bollardMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        var bollard1Geo = new THREE.CylinderGeometry(0.8, 0.8, 4, 6);
        var bollard1 = new THREE.Mesh(bollard1Geo, bollardMat);
        bollard1.position.set(-26, 2, -8);
        scene.add(bollard1);
        objects.push(bollard1);

        var bollard2Geo = new THREE.CylinderGeometry(0.8, 0.8, 4, 6);
        var bollard2 = new THREE.Mesh(bollard2Geo, bollardMat);
        bollard2.position.set(-14, 2, -8);
        scene.add(bollard2);
        objects.push(bollard2);

        var bollard3Geo = new THREE.CylinderGeometry(0.8, 0.8, 4, 6);
        var bollard3 = new THREE.Mesh(bollard3Geo, bollardMat);
        bollard3.position.set(-26, 2, 8);
        scene.add(bollard3);
        objects.push(bollard3);

        // Guerrilla sniper hide - tree with platform
        var trunkMat = new THREE.MeshLambertMaterial({ color: 0x4a2c1a });
        var trunkGeo = new THREE.CylinderGeometry(1.5, 1.8, 15, 6);
        var trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(25, 7.5, 22);
        scene.add(trunk);
        objects.push(trunk);

        var platformMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var platformGeo = new THREE.BoxGeometry(6, 1, 6);
        var platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(25, 16, 22);
        scene.add(platform);
        objects.push(platform);

        // Mortar pit
        var pitMat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
        var pitGeo = new THREE.CylinderGeometry(5, 5, 3, 8);
        var pit = new THREE.Mesh(pitGeo, pitMat);
        pit.position.set(-28, 1.5, 0);
        scene.add(pit);
        objects.push(pit);

        // Mortar shells (spheres)
        var shellMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var shell1Geo = new THREE.SphereGeometry(0.6, 6, 6);
        var shell1 = new THREE.Mesh(shell1Geo, shellMat);
        shell1.position.set(-28, 3, -2);
        scene.add(shell1);
        objects.push(shell1);

        var shell2Geo = new THREE.SphereGeometry(0.6, 6, 6);
        var shell2 = new THREE.Mesh(shell2Geo, shellMat);
        shell2.position.set(-26, 3, 0);
        scene.add(shell2);
        objects.push(shell2);

        var shell3Geo = new THREE.SphereGeometry(0.6, 6, 6);
        var shell3 = new THREE.Mesh(shell3Geo, shellMat);
        shell3.position.set(-28, 3, 2);
        scene.add(shell3);
        objects.push(shell3);

        // Signal mirror relay station 1
        var mirrorPlatform1Mat = new THREE.MeshLambertMaterial({ color: 0x8b8b8b });
        var mirrorPlatform1Geo = new THREE.BoxGeometry(4, 1, 4);
        var mirrorPlatform1 = new THREE.Mesh(mirrorPlatform1Geo, mirrorPlatform1Mat);
        mirrorPlatform1.position.set(10, 25, -28);
        scene.add(mirrorPlatform1);
        objects.push(mirrorPlatform1);

        // Signal mirror relay station 2
        var mirrorPlatform2Mat = new THREE.MeshLambertMaterial({ color: 0x8b8b8b });
        var mirrorPlatform2Geo = new THREE.BoxGeometry(4, 1, 4);
        var mirrorPlatform2 = new THREE.Mesh(mirrorPlatform2Geo, mirrorPlatform2Mat);
        mirrorPlatform2.position.set(-15, 22, 30);
        scene.add(mirrorPlatform2);
        objects.push(mirrorPlatform2);

        // Reflection line between mirrors
        var reflectionPoints = [];
        reflectionPoints.push(new THREE.Vector3(10, 25, -28));
        reflectionPoints.push(new THREE.Vector3(-15, 22, 30));
        var reflectionGeo = new THREE.BufferGeometry().setFromPoints(reflectionPoints);
        var reflectionMat = new THREE.LineBasicMaterial({ color: 0xffff00 });
        var reflectionLine = new THREE.LineSegments(reflectionGeo, reflectionMat);
        scene.add(reflectionLine);
        objects.push(reflectionLine);

        // Retreat bridge span (box)
        var bridgeSpanMat = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
        var bridgeSpanGeo = new THREE.BoxGeometry(24, 2, 3);
        var bridgeSpan = new THREE.Mesh(bridgeSpanGeo, bridgeSpanMat);
        bridgeSpan.position.set(0, 12, -30);
        scene.add(bridgeSpan);
        objects.push(bridgeSpan);

        // Bridge piers (cylinders)
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var pierEastGeo = new THREE.CylinderGeometry(2.5, 3, 14, 8);
        var pierEast = new THREE.Mesh(pierEastGeo, pierMat);
        pierEast.position.set(12, 5, -30);
        scene.add(pierEast);
        objects.push(pierEast);

        var pierWestGeo = new THREE.CylinderGeometry(2.5, 3, 14, 8);
        var pierWest = new THREE.Mesh(pierWestGeo, pierMat);
        pierWest.position.set(-12, 5, -30);
        scene.add(pierWest);
        objects.push(pierWest);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate rotating components
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry instanceof THREE.CylinderGeometry) {
                if (objects[i].position.x > 20) {
                    objects[i].rotation.x += 0.01;
                }
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
