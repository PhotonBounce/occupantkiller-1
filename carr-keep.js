window.CarrKeep = (function() {
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
        // Alder tree trunks with spherical canopies
        var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
        var canopyMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x1a4d6d });
        var woodMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var paleMaterial = new THREE.MeshLambertMaterial({ color: 0xd4af37 });

        // Tree 1: trunk and canopy
        var trunk1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.8, 18, 8),
            trunkMaterial
        );
        trunk1.position.set(-25, 9, -20);
        objects.push(trunk1);
        scene.add(trunk1);

        var canopy1 = new THREE.Mesh(
            new THREE.SphereGeometry(8, 12, 12),
            canopyMaterial
        );
        canopy1.position.set(-25, 22, -20);
        objects.push(canopy1);
        scene.add(canopy1);

        // Tree 2: trunk and canopy
        var trunk2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 1.5, 20, 8),
            trunkMaterial
        );
        trunk2.position.set(15, 10, -15);
        objects.push(trunk2);
        scene.add(trunk2);

        var canopy2 = new THREE.Mesh(
            new THREE.SphereGeometry(7, 12, 12),
            canopyMaterial
        );
        canopy2.position.set(15, 25, -15);
        objects.push(canopy2);
        scene.add(canopy2);

        // Tree 3: trunk and canopy
        var trunk3 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.3, 1.6, 16, 8),
            trunkMaterial
        );
        trunk3.position.set(-8, 8, 18);
        objects.push(trunk3);
        scene.add(trunk3);

        var canopy3 = new THREE.Mesh(
            new THREE.SphereGeometry(6.5, 12, 12),
            canopyMaterial
        );
        canopy3.position.set(-8, 20, 18);
        objects.push(canopy3);
        scene.add(canopy3);

        // Tree 4: trunk and canopy
        var trunk4 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.4, 1.7, 19, 8),
            trunkMaterial
        );
        trunk4.position.set(22, 9.5, 12);
        objects.push(trunk4);
        scene.add(trunk4);

        var canopy4 = new THREE.Mesh(
            new THREE.SphereGeometry(7.5, 12, 12),
            canopyMaterial
        );
        canopy4.position.set(22, 24, 12);
        objects.push(canopy4);
        scene.add(canopy4);

        // Wooden palisade perimeter - fence posts and planks
        var fencePostMaterial = new THREE.MeshLambertMaterial({ color: 0x6b4423 });

        var fencePost1 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 8, 6),
            fencePostMaterial
        );
        fencePost1.position.set(-32, 4, 0);
        objects.push(fencePost1);
        scene.add(fencePost1);

        var fencePost2 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 8, 6),
            fencePostMaterial
        );
        fencePost2.position.set(32, 4, 0);
        objects.push(fencePost2);
        scene.add(fencePost2);

        var fencePost3 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 8, 6),
            fencePostMaterial
        );
        fencePost3.position.set(0, 4, -32);
        objects.push(fencePost3);
        scene.add(fencePost3);

        var fencePost4 = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 8, 6),
            fencePostMaterial
        );
        fencePost4.position.set(0, 4, 32);
        objects.push(fencePost4);
        scene.add(fencePost4);

        // Floating command platform on barrel floats
        var barrel1 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 3, 8),
            waterMaterial
        );
        barrel1.position.set(-8, 1.5, 0);
        objects.push(barrel1);
        scene.add(barrel1);

        var barrel2 = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 3, 8),
            waterMaterial
        );
        barrel2.position.set(8, 1.5, 0);
        objects.push(barrel2);
        scene.add(barrel2);

        var platform = new THREE.Mesh(
            new THREE.BoxGeometry(16, 1, 10),
            woodMaterial
        );
        platform.position.set(0, 4.5, 0);
        objects.push(platform);
        scene.add(platform);

        // Signal fire on raised platform - sphere glow
        var signalFireBase = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.5, 3),
            woodMaterial
        );
        signalFireBase.position.set(0, 5.2, 0);
        objects.push(signalFireBase);
        scene.add(signalFireBase);

        var signalFire = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xff6600 })
        );
        signalFire.position.set(0, 7.5, 0);
        objects.push(signalFire);
        scene.add(signalFire);

        // Submerged grenade cache spheres in dark water zone
        var grenadeCache1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        grenadeCache1.position.set(-18, 0.5, -24);
        objects.push(grenadeCache1);
        scene.add(grenadeCache1);

        var grenadeCache2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        grenadeCache2.position.set(16, 0.5, 26);
        objects.push(grenadeCache2);
        scene.add(grenadeCache2);

        var grenadeCache3 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
        );
        grenadeCache3.position.set(25, 0.5, -10);
        objects.push(grenadeCache3);
        scene.add(grenadeCache3);

        // Camouflage net canopy - LineSegments grid between tree trunks
        var netGeometry = new THREE.BufferGeometry();
        var netVertices = [];

        // Horizontal grid lines
        for (var y = 18; y <= 26; y += 2) {
            netVertices.push(-25, y, -20);
            netVertices.push(15, y, -15);
            netVertices.push(15, y, -15);
            netVertices.push(-8, y, 18);
            netVertices.push(-8, y, 18);
            netVertices.push(22, y, 12);
        }

        // Vertical connecting lines
        netVertices.push(-25, 18, -20);
        netVertices.push(-25, 26, -20);
        netVertices.push(15, 18, -15);
        netVertices.push(15, 26, -15);
        netVertices.push(-8, 18, 18);
        netVertices.push(-8, 26, 18);
        netVertices.push(22, 18, 12);
        netVertices.push(22, 26, 12);

        var netPositions = new Float32Array(netVertices);
        netGeometry.setAttribute('position', new THREE.BufferAttribute(netPositions, 3));

        var netMaterial = new THREE.LineBasicMaterial({ color: 0x556b2f, linewidth: 1 });
        var netCanopy = new THREE.LineSegments(netGeometry, netMaterial);
        objects.push(netCanopy);
        scene.add(netCanopy);

        // Hidden fox-hole entrances - box hatches flush with ground
        var hatches = [
            { x: -22, z: 5 },
            { x: 10, z: -28 },
            { x: 28, z: 20 }
        ];

        for (var i = 0; i < hatches.length; i++) {
            var hatch = new THREE.Mesh(
                new THREE.BoxGeometry(2.5, 0.3, 2.5),
                new THREE.MeshLambertMaterial({ color: 0x3d3d3d })
            );
            hatch.position.set(hatches[i].x, 0.15, hatches[i].z);
            objects.push(hatch);
            scene.add(hatch);
        }

        // Add cone-shaped tent structure
        var tentCone = new THREE.Mesh(
            new THREE.ConeGeometry(3, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        tentCone.position.set(-15, 3, -8);
        objects.push(tentCone);
        scene.add(tentCone);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        lights.push(ambientLight);
        scene.add(ambientLight);

        var pointLight = new THREE.PointLight(0xffcc00, 1, 50);
        pointLight.position.set(0, 8, 0);
        lights.push(pointLight);
        scene.add(pointLight);
    }

    function update(delta) {
        // Animate signal fire glow
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].position && objects[i].position.y > 7 && objects[i].position.y < 8) {
                    objects[i].rotation.y += 0.02;
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
