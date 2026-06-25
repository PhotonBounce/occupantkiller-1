window.BoneRidge = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var dustParticles = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        dustParticles = [];
        buildRidgeTerrain();
        buildBoneFormations();
        buildAncientRuins();
        buildLimestonePillars();
        buildSniperRedoubts();
        buildAmmoDepots();
        buildCommandBunker();
        buildMinefields();
        buildArtilleryCraters();
        buildDeadTrees();
        buildErosionChannels();
        setupLighting();
        initializeWindDust();
    }

    function buildRidgeTerrain() {
        var terrainColor = 0xE8E8E0;
        var shadowColor = 0x8B8B7A;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Main ridge spine - stepped white limestone sections
        for (var i = 0; i < 8; i++) {
            geometry = new THREE.BoxGeometry(25, 8 + i * 1.5, 15);
            material = new THREE.MeshLambertMaterial({ color: terrainColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-40 + i * 12, 4 + i * 2, -30);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Base terrain platform
        geometry = new THREE.BoxGeometry(200, 2, 120);
        material = new THREE.MeshLambertMaterial({ color: 0xD9D9CC });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, -1, 0);
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        // Cliff face - gray limestone
        geometry = new THREE.BoxGeometry(80, 35, 8);
        material = new THREE.MeshLambertMaterial({ color: shadowColor });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(50, 12, -45);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        // Secondary ridge plateau
        geometry = new THREE.BoxGeometry(95, 6, 40);
        material = new THREE.MeshLambertMaterial({ color: 0xCFCFC0 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-25, 8, 15);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        // Rock outcroppings
        for (var i = 0; i < 12; i++) {
            var size = 3 + Math.random() * 4;
            geometry = new THREE.BoxGeometry(size, size * 0.8, size * 0.6);
            material = new THREE.MeshLambertMaterial({ color: 0xB8B8A8 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-60 + Math.random() * 80, 2, -20 + Math.random() * 40);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildBoneFormations() {
        var boneColor = 0xFFF8DC;
        var skullColor = 0xFFFAF0;
        var ribColor = 0xE8E0D0;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Large femur bones
        for (var i = 0; i < 6; i++) {
            geometry = new THREE.CylinderGeometry(1.2, 0.9, 18, 16);
            material = new THREE.MeshLambertMaterial({ color: boneColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-30 + i * 15, 8, -35 + Math.random() * 10);
            mesh.rotation.z = Math.random() * 0.5;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Skull formations - sphere clusters
        for (var i = 0; i < 8; i++) {
            geometry = new THREE.SphereGeometry(1.8, 12, 12);
            material = new THREE.MeshLambertMaterial({ color: skullColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-50 + Math.random() * 100, 5 + Math.random() * 8, -40 + Math.random() * 50);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Rib cage sections - box formations
        for (var i = 0; i < 7; i++) {
            geometry = new THREE.BoxGeometry(4, 8, 0.6);
            material = new THREE.MeshLambertMaterial({ color: ribColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(10 + i * 12, 12, -32);
            mesh.rotation.z = 0.3;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Fossil fragments scattered
        for (var i = 0; i < 15; i++) {
            var size = 0.8 + Math.random() * 1.5;
            geometry = new THREE.SphereGeometry(size, 8, 8);
            material = new THREE.MeshLambertMaterial({ color: 0xE0D8C8 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-40 + Math.random() * 120, 2 + Math.random() * 3, -35 + Math.random() * 60);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Spinal column formations
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 8; j++) {
                geometry = new THREE.SphereGeometry(0.6, 8, 8);
                material = new THREE.MeshLambertMaterial({ color: boneColor });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(-35 + i * 30, 6 + j * 0.8, -25 + Math.random() * 8);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                objects.push(mesh);
            }
        }
    }

    function buildAncientRuins() {
        var stoneColor = 0xC0C0B0;
        var crumbleColor = 0xB0B0A0;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Ruined wall sections
        for (var i = 0; i < 5; i++) {
            geometry = new THREE.BoxGeometry(20, 12, 3);
            material = new THREE.MeshLambertMaterial({ color: stoneColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-80 + i * 35, 8, 35);
            mesh.rotation.y = Math.random() * 0.3 - 0.15;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Fallen stone blocks
        for (var i = 0; i < 10; i++) {
            geometry = new THREE.BoxGeometry(8 + Math.random() * 6, 5, 4 + Math.random() * 3);
            material = new THREE.MeshLambertMaterial({ color: crumbleColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-70 + Math.random() * 90, 3, 30 + Math.random() * 20);
            mesh.rotation.z = Math.random() * 0.6;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Ancient pillars stumps
        for (var i = 0; i < 6; i++) {
            geometry = new THREE.CylinderGeometry(2, 2.2, 8, 12);
            material = new THREE.MeshLambertMaterial({ color: 0xAA9A8A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-60 + i * 24, 5, 40);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Archway ruins
        geometry = new THREE.BoxGeometry(15, 20, 2);
        material = new THREE.MeshLambertMaterial({ color: stoneColor });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(60, 12, 50);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        // Crumbled detail blocks
        for (var i = 0; i < 12; i++) {
            geometry = new THREE.BoxGeometry(3, 4, 2);
            material = new THREE.MeshLambertMaterial({ color: 0x9A8A7A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-90 + Math.random() * 140, 2 + Math.random() * 5, 25 + Math.random() * 30);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildLimestonePillars() {
        var pillarColor = 0xD0D0C0;
        var capColor = 0xC8C8B8;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Tall eroded cylinder columns
        for (var i = 0; i < 8; i++) {
            geometry = new THREE.CylinderGeometry(2.5, 2.2, 25, 16);
            material = new THREE.MeshLambertMaterial({ color: pillarColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-55 + i * 18, 13, -50);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);

            // Weathered cone caps
            geometry = new THREE.ConeGeometry(2.8, 4, 16);
            material = new THREE.MeshLambertMaterial({ color: capColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-55 + i * 18, 25, -50);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Supporting pillar clusters
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 3; j++) {
                geometry = new THREE.CylinderGeometry(1.5, 1.3, 16, 12);
                material = new THREE.MeshLambertMaterial({ color: 0xB8B8A8 });
                mesh = new THREE.Mesh(geometry, material);
                mesh.position.set(-30 + i * 40 + j * 4, 9, 10 + j * 5);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                scene.add(mesh);
                objects.push(mesh);
            }
        }
    }

    function buildSniperRedoubts() {
        var metalColor = 0x708090;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Main sniper position boxes
        for (var i = 0; i < 3; i++) {
            geometry = new THREE.BoxGeometry(12, 8, 10);
            material = new THREE.MeshLambertMaterial({ color: metalColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(30 + i * 35, 18, -38);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);

            // Gun port openings
            geometry = new THREE.BoxGeometry(6, 3, 1.5);
            material = new THREE.MeshLambertMaterial({ color: 0x404040 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(30 + i * 35, 19, -43);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Observation turrets
        for (var i = 0; i < 3; i++) {
            geometry = new THREE.CylinderGeometry(3, 3, 6, 16);
            material = new THREE.MeshLambertMaterial({ color: 0x5A5A50 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(30 + i * 35, 24, -38);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Sandbag walls
        for (var i = 0; i < 12; i++) {
            geometry = new THREE.BoxGeometry(4, 3, 2);
            material = new THREE.MeshLambertMaterial({ color: 0x8B7D6B });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(20 + i * 6, 15, -35);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildAmmoDepots() {
        var crateColor = 0x6B5D4F;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Crate stacks
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 4; j++) {
                for (var k = 0; k < 3; k++) {
                    geometry = new THREE.BoxGeometry(6, 4, 5);
                    material = new THREE.MeshLambertMaterial({ color: crateColor });
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.position.set(-40 + i * 10, 2 + k * 4, 25 + j * 10);
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    scene.add(mesh);
                    objects.push(mesh);
                }
            }
        }

        // Cave-like overhang for depot
        geometry = new THREE.BoxGeometry(40, 8, 20);
        material = new THREE.MeshLambertMaterial({ color: 0x505050 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-30, 16, 30);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        // Support pillars for overhang
        for (var i = 0; i < 4; i++) {
            geometry = new THREE.CylinderGeometry(2.5, 3, 14, 12);
            material = new THREE.MeshLambertMaterial({ color: 0x707070 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-40 + i * 25, 8, 30);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildCommandBunker() {
        var bunkerColor = 0x4A4A40;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Half-buried main bunker
        geometry = new THREE.BoxGeometry(25, 12, 20);
        material = new THREE.MeshLambertMaterial({ color: bunkerColor });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 4, 60);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        // Entrance tunnel
        geometry = new THREE.BoxGeometry(8, 5, 12);
        material = new THREE.MeshLambertMaterial({ color: 0x3A3A30 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(-15, 2, 55);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);

        // Roof reinforcement sections
        for (var i = 0; i < 5; i++) {
            geometry = new THREE.BoxGeometry(5, 2, 3);
            material = new THREE.MeshLambertMaterial({ color: 0x3A3A2A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-10 + i * 8, 10.5, 60);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Ventilation shafts
        for (var i = 0; i < 3; i++) {
            geometry = new THREE.CylinderGeometry(1.5, 1.5, 6, 12);
            material = new THREE.MeshLambertMaterial({ color: 0x505040 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-8 + i * 8, 16, 60);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Command center interior sections
        geometry = new THREE.BoxGeometry(20, 8, 15);
        material = new THREE.MeshLambertMaterial({ color: 0x2A2A20 });
        mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(0, 4, 60);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildMinefields() {
        var metalColor = 0x8B8B7D;
        var wireColor = 0xB8A89A;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Mine marker stakes
        for (var i = 0; i < 20; i++) {
            geometry = new THREE.CylinderGeometry(0.5, 0.4, 3, 8);
            material = new THREE.MeshLambertMaterial({ color: metalColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-80 + Math.random() * 40, 1.5, -70 + Math.random() * 30);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Wire barriers - LineSegments
        for (var i = 0; i < 8; i++) {
            var points = [
                new THREE.Vector3(-80, 0.8, -70 + i * 8),
                new THREE.Vector3(-40, 0.8, -70 + i * 8)
            ];
            geometry = new THREE.BufferGeometry().setFromPoints(points);
            material = new THREE.LineBasicMaterial({ color: 0xA0907A, linewidth: 2 });
            mesh = new THREE.LineSegments(geometry, material);
            scene.add(mesh);
            objects.push(mesh);
        }

        // Perimeter wires
        for (var i = 0; i < 6; i++) {
            var points = [
                new THREE.Vector3(-80 + i * 8, 0.8, -70),
                new THREE.Vector3(-80 + i * 8, 0.8, -40)
            ];
            geometry = new THREE.BufferGeometry().setFromPoints(points);
            material = new THREE.LineBasicMaterial({ color: 0xA0907A, linewidth: 2 });
            mesh = new THREE.LineSegments(geometry, material);
            scene.add(mesh);
            objects.push(mesh);
        }

        // Mine boxes (buried)
        for (var i = 0; i < 15; i++) {
            geometry = new THREE.BoxGeometry(2, 0.5, 2);
            material = new THREE.MeshLambertMaterial({ color: 0x5A5A4A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-75 + Math.random() * 30, 0.25, -65 + Math.random() * 20);
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildArtilleryCraters() {
        var cementColor = 0x8A8A7A;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Crater depressions
        for (var i = 0; i < 6; i++) {
            geometry = new THREE.BoxGeometry(15 + Math.random() * 8, 4, 12 + Math.random() * 6);
            material = new THREE.MeshLambertMaterial({ color: cementColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-50 + i * 35, -1, -10 + Math.random() * 20);
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Crater rim rubble
        for (var i = 0; i < 12; i++) {
            geometry = new THREE.BoxGeometry(4 + Math.random() * 3, 2 + Math.random() * 2, 3 + Math.random() * 2);
            material = new THREE.MeshLambertMaterial({ color: 0x7A7A6A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-60 + Math.random() * 100, 0.5 + Math.random() * 2, -20 + Math.random() * 30);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Shell casings
        for (var i = 0; i < 10; i++) {
            geometry = new THREE.CylinderGeometry(0.4, 0.3, 2.5, 12);
            material = new THREE.MeshLambertMaterial({ color: 0x9A7A5A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-40 + Math.random() * 80, 0.2, -15 + Math.random() * 25);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildDeadTrees() {
        var trunkColor = 0xF0F0E8;
        var geometry = null;
        var material = null;
        var mesh = null;

        // Dead white tree trunks
        for (var i = 0; i < 8; i++) {
            geometry = new THREE.CylinderGeometry(1.2, 1.5, 20, 12);
            material = new THREE.MeshLambertMaterial({ color: trunkColor });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-70 + i * 22, 10, -60);
            mesh.rotation.z = Math.random() * 0.3 - 0.15;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Broken tree stubs
        for (var i = 0; i < 6; i++) {
            geometry = new THREE.CylinderGeometry(1.8, 2, 4, 12);
            material = new THREE.MeshLambertMaterial({ color: 0xE8E8DC });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-50 + i * 30, 3, -75);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Fallen logs
        for (var i = 0; i < 5; i++) {
            geometry = new THREE.CylinderGeometry(0.8, 0.7, 18, 12);
            material = new THREE.MeshLambertMaterial({ color: 0xD8D8CC });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-60 + i * 40, 2, -80);
            mesh.rotation.z = 1.2;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildErosionChannels() {
        var geometry = null;
        var material = null;
        var mesh = null;

        // Wind erosion trench cuts
        for (var i = 0; i < 6; i++) {
            geometry = new THREE.BoxGeometry(8, 6, 2);
            material = new THREE.MeshLambertMaterial({ color: 0x9A9A8A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-40 + i * 20, 10, -45);
            mesh.rotation.z = 0.15;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Vertical erosion grooves
        for (var i = 0; i < 10; i++) {
            geometry = new THREE.BoxGeometry(1.5, 15, 1);
            material = new THREE.MeshLambertMaterial({ color: 0x8A8A7A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(30 + i * 5, 12, -45);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }

        // Canyon walls
        for (var i = 0; i < 4; i++) {
            geometry = new THREE.BoxGeometry(4, 12, 25);
            material = new THREE.MeshLambertMaterial({ color: 0x7A7A6A });
            mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-85 + i * 45, 8, 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0xFFFFCC, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFDD, 0.8);
        directionalLight.position.set(100, 80, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.far = 300;
        directionalLight.shadow.camera.left = -150;
        directionalLight.shadow.camera.right = 150;
        directionalLight.shadow.camera.top = 150;
        directionalLight.shadow.camera.bottom = -150;
        scene.add(directionalLight);
        lights.push(directionalLight);

        var fillLight = new THREE.DirectionalLight(0xEEEECC, 0.3);
        fillLight.position.set(-80, 40, -60);
        scene.add(fillLight);
        lights.push(fillLight);

        var pointLight = new THREE.PointLight(0xFFDDB0, 0.4);
        pointLight.position.set(0, 20, 40);
        scene.add(pointLight);
        lights.push(pointLight);

        var caveLight = new THREE.PointLight(0xCCCCBB, 0.3);
        caveLight.position.set(-30, 15, 30);
        scene.add(caveLight);
        lights.push(caveLight);
    }

    function initializeWindDust() {
        for (var i = 0; i < 25; i++) {
            var geometry = new THREE.SphereGeometry(0.3, 6, 6);
            var material = new THREE.MeshLambertMaterial({ color: 0xFFFFF0, transparent: true, opacity: 0.3 });
            var mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(-100 + Math.random() * 200, 15 + Math.random() * 20, -80 + Math.random() * 100);
            scene.add(mesh);
            dustParticles.push({
                mesh: mesh,
                vx: 0.3 + Math.random() * 0.4,
                vy: (Math.random() - 0.5) * 0.1,
                vz: (Math.random() - 0.5) * 0.2
            });
            objects.push(mesh);
        }
    }

    function update(delta) {
        for (var i = 0; i < dustParticles.length; i++) {
            var particle = dustParticles[i];
            particle.mesh.position.x += particle.vx * delta;
            particle.mesh.position.y += particle.vy * delta;
            particle.mesh.position.z += particle.vz * delta;

            if (particle.mesh.position.x > 100) {
                particle.mesh.position.x = -100;
            }
            if (particle.mesh.position.y > 60) {
                particle.mesh.position.y = 15;
            }
            if (particle.mesh.position.y < 5) {
                particle.mesh.position.y = 35;
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
        dustParticles = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
