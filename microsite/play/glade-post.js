window.GladePost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Forest perimeter: circular ring of tree trunks with cone canopies
        var treeCount = 12;
        var treeRadius = 40;

        for (var t = 0; t < treeCount; t++) {
            var angle = (t / treeCount) * Math.PI * 2;
            var xPos = Math.cos(angle) * treeRadius;
            var zPos = Math.sin(angle) * treeRadius;

            // Tree trunk (cylinder)
            var trunkGeo = new THREE.CylinderGeometry(2.5, 3, 18, 8);
            var trunkMat = new THREE.MeshLambertMaterial({color: 0x4a3728});
            var trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(xPos, 9, zPos);
            scene.add(trunk);
            objects.push(trunk);

            // Tree canopy (cone)
            var canopyGeo = new THREE.ConeGeometry(6, 12, 8);
            var canopyMat = new THREE.MeshLambertMaterial({color: 0x2d5016});
            var canopy = new THREE.Mesh(canopyGeo, canopyMat);
            canopy.position.set(xPos, 24, zPos);
            scene.add(canopy);
            objects.push(canopy);

            // Bioluminescent fungus at tree base (small sphere)
            var fungusGeo = new THREE.SphereGeometry(1.2, 8, 8);
            var fungusMat = new THREE.MeshLambertMaterial({color: 0x00ff88, emissive: 0x00ff88});
            var fungus = new THREE.Mesh(fungusGeo, fungusMat);
            fungus.position.set(xPos, 1, zPos);
            scene.add(fungus);
            objects.push(fungus);
        }

        // Central command tent (box structure)
        // Tent base perimeter boxes
        var tentPosX = 0;
        var tentPosZ = 0;

        // Front wall
        var frontWallGeo = new THREE.BoxGeometry(12, 8, 1);
        var tentWallMat = new THREE.MeshLambertMaterial({color: 0x5a4a3a});
        var frontWall = new THREE.Mesh(frontWallGeo, tentWallMat);
        frontWall.position.set(tentPosX, 4, tentPosZ - 5);
        scene.add(frontWall);
        objects.push(frontWall);

        // Back wall
        var backWall = new THREE.Mesh(frontWallGeo, tentWallMat);
        backWall.position.set(tentPosX, 4, tentPosZ + 5);
        scene.add(backWall);
        objects.push(backWall);

        // Left wall
        var sideWallGeo = new THREE.BoxGeometry(1, 8, 10);
        var leftWall = new THREE.Mesh(sideWallGeo, tentWallMat);
        leftWall.position.set(tentPosX - 6, 4, tentPosZ);
        scene.add(leftWall);
        objects.push(leftWall);

        // Right wall
        var rightWall = new THREE.Mesh(sideWallGeo, tentWallMat);
        rightWall.position.set(tentPosX + 6, 4, tentPosZ);
        scene.add(rightWall);
        objects.push(rightWall);

        // Tent roof (cone)
        var roofGeo = new THREE.ConeGeometry(8.5, 6, 8);
        var roofMat = new THREE.MeshLambertMaterial({color: 0x6b5a4a});
        var roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.set(tentPosX, 11, tentPosZ);
        scene.add(roof);
        objects.push(roof);

        // Sniper platform: tree-mounted observation post
        var platformTreeX = -25;
        var platformTreeZ = -20;

        // Platform trunk (tall cylinder)
        var platformTrunkGeo = new THREE.CylinderGeometry(2, 2.5, 20, 8);
        var platformTrunkMat = new THREE.MeshLambertMaterial({color: 0x3a2f28});
        var platformTrunk = new THREE.Mesh(platformTrunkGeo, platformTrunkMat);
        platformTrunk.position.set(platformTreeX, 10, platformTreeZ);
        scene.add(platformTrunk);
        objects.push(platformTrunk);

        // Platform box (observation deck)
        var platformBoxGeo = new THREE.BoxGeometry(6, 2, 6);
        var platformMat = new THREE.MeshLambertMaterial({color: 0x7a6a5a});
        var platformBox = new THREE.Mesh(platformBoxGeo, platformMat);
        platformBox.position.set(platformTreeX, 21, platformTreeZ);
        scene.add(platformBox);
        objects.push(platformBox);

        // Fallen log barricade (horizontal cylinders scattered)
        var logPositions = [
            {x: 15, z: -30},
            {x: 18, z: -25},
            {x: 20, z: -28}
        ];

        for (var l = 0; l < logPositions.length; l++) {
            var logGeo = new THREE.CylinderGeometry(1.5, 1.5, 14, 8);
            var logMat = new THREE.MeshLambertMaterial({color: 0x4a3f35});
            var log = new THREE.Mesh(logGeo, logMat);
            log.position.set(logPositions[l].x, 1.5, logPositions[l].z);
            log.rotation.z = Math.PI / 2.2;
            scene.add(log);
            objects.push(log);
        }

        // Additional bioluminescent fungus clusters (light source spheres)
        var fungusClusterPositions = [
            {x: -20, z: 15, size: 1.5, color: 0x00dd77},
            {x: 25, z: 10, size: 1.8, color: 0x00ff99},
            {x: -10, z: -25, size: 1.3, color: 0x00cc88}
        ];

        for (var f = 0; f < fungusClusterPositions.length; f++) {
            var clusterGeo = new THREE.SphereGeometry(fungusClusterPositions[f].size, 8, 8);
            var clusterMat = new THREE.MeshLambertMaterial({
                color: fungusClusterPositions[f].color,
                emissive: fungusClusterPositions[f].color
            });
            var cluster = new THREE.Mesh(clusterGeo, clusterMat);
            cluster.position.set(fungusClusterPositions[f].x, 1.2, fungusClusterPositions[f].z);
            scene.add(cluster);
            objects.push(cluster);
        }

        // Ambient lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0x00ff88, 1.5, 60);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Animate bioluminescent fungus glow
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.material && obj.material.emissive) {
                var pulseFactor = Math.sin(Date.now() * 0.001) * 0.3 + 0.7;
                if (obj.material.color.getHex() === 0x00ff88 ||
                    obj.material.color.getHex() === 0x00dd77 ||
                    obj.material.color.getHex() === 0x00ff99 ||
                    obj.material.color.getHex() === 0x00cc88) {
                    obj.material.emissiveIntensity = pulseFactor;
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
