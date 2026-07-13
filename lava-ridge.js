window.LavaRidge = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var animationTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        animationTime = 0;
        buildRidgeTerrain();
        buildLavaFlows();
        buildMilitaryOutpost();
        buildVolcanicFeatures();
        buildHeatEffects();
        buildObsidianFormations();
        buildAbandonedEquipment();
        setupLighting();
    }

    function buildRidgeTerrain() {
        var ridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var cooledMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });

        // Base ridge structure - stacked dark boxes at various heights
        var ridgePositions = [
            { x: -40, z: -30, h: 15, w: 20, d: 25 },
            { x: 0, z: -35, h: 20, w: 25, d: 30 },
            { x: 40, z: -25, h: 18, w: 22, d: 28 },
            { x: -35, z: 10, h: 16, w: 18, d: 24 },
            { x: 5, z: 15, h: 22, w: 26, d: 32 },
            { x: 45, z: 20, h: 19, w: 20, d: 26 }
        ];

        for (var i = 0; i < ridgePositions.length; i++) {
            var pos = ridgePositions[i];
            var geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            var mesh = new THREE.Mesh(geo, ridgeMaterial);
            mesh.position.set(pos.x, pos.h / 2, pos.z);
            scene.add(mesh);
            objects.push(mesh);
        }

        // Ridge outcroppings - smaller stacked boxes
        for (var i = 0; i < 12; i++) {
            var x = -50 + Math.random() * 100;
            var z = -40 + Math.random() * 80;
            var h = 8 + Math.random() * 12;
            var w = 5 + Math.random() * 8;
            var d = 6 + Math.random() * 10;
            var geo = new THREE.BoxGeometry(w, h, d);
            var mesh = new THREE.Mesh(geo, cooledMaterial);
            mesh.position.set(x, h / 2, z);
            mesh.rotation.z = (Math.random() - 0.5) * 0.3;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildLavaFlows() {
        var lavaMaterial = new THREE.MeshLambertMaterial({
            color: 0xff6600,
            emissive: 0xff4400
        });

        // Lava flow channels
        var flowPositions = [
            { x: -20, z: -10, w: 8, d: 50, h: 2 },
            { x: 20, z: 0, w: 10, d: 45, h: 2 },
            { x: 0, z: 5, w: 12, d: 40, h: 2 }
        ];

        for (var i = 0; i < flowPositions.length; i++) {
            var pos = flowPositions[i];
            var geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
            var mesh = new THREE.Mesh(geo, lavaMaterial);
            mesh.position.set(pos.x, pos.h / 2, pos.z);
            scene.add(mesh);
            objects.push(mesh);
        }

        // Lava pools - scattered box sections
        for (var i = 0; i < 8; i++) {
            var x = -45 + Math.random() * 90;
            var z = -45 + Math.random() * 90;
            var w = 6 + Math.random() * 12;
            var d = 8 + Math.random() * 14;
            var h = 1.5;
            var geo = new THREE.BoxGeometry(w, h, d);
            var mesh = new THREE.Mesh(geo, lavaMaterial);
            mesh.position.set(x, h / 2, z);
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    function buildMilitaryOutpost() {
        var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var steelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

        // Main structures on cool rock section at x: 0, z: 35
        // Building 1
        var b1Geo = new THREE.BoxGeometry(12, 10, 10);
        var b1 = new THREE.Mesh(b1Geo, concreteMaterial);
        b1.position.set(-15, 5, 35);
        scene.add(b1);
        objects.push(b1);

        // Building 2
        var b2Geo = new THREE.BoxGeometry(10, 12, 12);
        var b2 = new THREE.Mesh(b2Geo, concreteMaterial);
        b2.position.set(0, 6, 35);
        scene.add(b2);
        objects.push(b2);

        // Building 3
        var b3Geo = new THREE.BoxGeometry(14, 9, 8);
        var b3 = new THREE.Mesh(b3Geo, concreteMaterial);
        b3.position.set(20, 4.5, 35);
        scene.add(b3);
        objects.push(b3);

        // Comms tower - cylinder
        var towerGeo = new THREE.CylinderGeometry(1.5, 2, 25, 8);
        var tower = new THREE.Mesh(towerGeo, steelMaterial);
        tower.position.set(0, 12.5, 40);
        scene.add(tower);
        objects.push(tower);

        // Antenna sphere
        var antGeo = new THREE.SphereGeometry(0.8, 6, 6);
        var ant = new THREE.Mesh(antGeo, steelMaterial);
        ant.position.set(0, 26, 40);
        scene.add(ant);
        objects.push(ant);

        // Fortification walls - boxes
        for (var i = 0; i < 4; i++) {
            var angle = (i / 4) * Math.PI * 2;
            var wx = Math.cos(angle) * 22;
            var wz = 35 + Math.sin(angle) * 22;
            var wgeo = new THREE.BoxGeometry(2, 8, 6);
            var w = new THREE.Mesh(wgeo, concreteMaterial);
            w.position.set(wx, 4, wz);
            scene.add(w);
            objects.push(w);
        }

        // Gun emplacements
        for (var i = 0; i < 3; i++) {
            var gemGeo = new THREE.BoxGeometry(3, 2, 4);
            var gem = new THREE.Mesh(gemGeo, steelMaterial);
            gem.position.set(-18 + i * 18, 11, 32);
            scene.add(gem);
            objects.push(gem);
        }
    }

    function buildVolcanicFeatures() {
        var ventMaterial = new THREE.MeshLambertMaterial({
            color: 0x444444,
            emissive: 0x662200
        });
        var smokeMaterial = new THREE.MeshLambertMaterial({
            color: 0x888888,
            emissive: 0x663300
        });

        // Volcanic vents - cylinder bases with sphere smoke
        var ventPositions = [
            { x: -35, z: -20 },
            { x: 25, z: -15 },
            { x: -10, z: 25 },
            { x: 40, z: 10 }
        ];

        for (var i = 0; i < ventPositions.length; i++) {
            var vp = ventPositions[i];

            // Vent crater
            var craterGeo = new THREE.CylinderGeometry(4, 6, 3, 12);
            var crater = new THREE.Mesh(craterGeo, ventMaterial);
            crater.position.set(vp.x, 1.5, vp.z);
            scene.add(crater);
            objects.push(crater);

            // Smoke plume spheres
            for (var j = 0; j < 5; j++) {
                var smokeGeo = new THREE.SphereGeometry(2 - j * 0.3, 6, 6);
                var smoke = new THREE.Mesh(smokeGeo, smokeMaterial);
                smoke.position.set(vp.x + (Math.random() - 0.5) * 2, 4 + j * 2.5, vp.z + (Math.random() - 0.5) * 2);
                smoke.scale.set(0.8 + Math.random() * 0.4, 1.2 + j * 0.2, 0.8 + Math.random() * 0.4);
                scene.add(smoke);
                objects.push(smoke);
            }
        }
    }

    function buildHeatEffects() {
        var heatMaterial = new THREE.MeshLambertMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.15,
            emissive: 0xff8800
        });

        // Heat shimmer - many transparent sphere clusters
        for (var i = 0; i < 25; i++) {
            var x = -50 + Math.random() * 100;
            var z = -50 + Math.random() * 100;
            var y = 2 + Math.random() * 8;
            var r = 3 + Math.random() * 6;
            var heatGeo = new THREE.SphereGeometry(r, 4, 4);
            var heat = new THREE.Mesh(heatGeo, heatMaterial);
            heat.position.set(x, y, z);
            scene.add(heat);
            objects.push(heat);
        }
    }

    function buildObsidianFormations() {
        var obsidianMaterial = new THREE.MeshLambertMaterial({
            color: 0x0a0a0a,
            emissive: 0x1a1a1a
        });

        // Cooled obsidian clusters - sphere and box combinations
        var clusterPositions = [
            { x: -45, z: 10 },
            { x: 35, z: -35 },
            { x: -20, z: -45 },
            { x: 50, z: 35 },
            { x: 10, z: 45 }
        ];

        for (var i = 0; i < clusterPositions.length; i++) {
            var cp = clusterPositions[i];

            // Cluster of spheres
            for (var j = 0; j < 5; j++) {
                var rad = 2 + Math.random() * 3;
                var sphGeo = new THREE.SphereGeometry(rad, 6, 6);
                var sph = new THREE.Mesh(sphGeo, obsidianMaterial);
                sph.position.set(cp.x + (j - 2) * 3, rad + 1, cp.z + (Math.random() - 0.5) * 4);
                scene.add(sph);
                objects.push(sph);
            }

            // Cluster of boxes
            for (var j = 0; j < 4; j++) {
                var w = 2 + Math.random() * 3;
                var h = 3 + Math.random() * 4;
                var d = 2 + Math.random() * 3;
                var boxGeo = new THREE.BoxGeometry(w, h, d);
                var box = new THREE.Mesh(boxGeo, obsidianMaterial);
                box.position.set(cp.x + (Math.random() - 0.5) * 5, h / 2, cp.z + (Math.random() - 0.5) * 5);
                box.rotation.set((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6);
                scene.add(box);
                objects.push(box);
            }
        }
    }

    function buildAbandonedEquipment() {
        var rustMaterial = new THREE.MeshLambertMaterial({
            color: 0x664422,
            emissive: 0x441100
        });
        var meltMaterial = new THREE.MeshLambertMaterial({
            color: 0x333333,
            emissive: 0x220000
        });

        // Equipment melting at lava edges
        var equipPositions = [
            { x: -15, z: -8 },
            { x: 18, z: 2 },
            { x: -5, z: 8 },
            { x: 30, z: -5 }
        ];

        for (var i = 0; i < equipPositions.length; i++) {
            var ep = equipPositions[i];

            // Distorted equipment bases
            for (var j = 0; j < 3; j++) {
                var w = 3 + j;
                var h = 2 + Math.random() * 3;
                var d = 3 + Math.random() * 2;
                var eqGeo = new THREE.BoxGeometry(w, h, d);
                var eq = new THREE.Mesh(eqGeo, meltMaterial);
                eq.position.set(ep.x + (j - 1) * 2.5, h / 2 + Math.random() * 1, ep.z + (Math.random() - 0.5) * 2);
                eq.scale.set(1 + Math.random() * 0.3, 0.7 + Math.random() * 0.4, 1 + Math.random() * 0.2);
                scene.add(eq);
                objects.push(eq);
            }
        }
    }

    function buildLavaBridges() {
        var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        // Cooled lava bridges over lava channels
        var bridgePositions = [
            { x: -20, z: -35, w: 15, d: 4 },
            { x: 20, z: 5, w: 18, d: 4 },
            { x: 0, z: 22, w: 16, d: 4 }
        ];

        for (var i = 0; i < bridgePositions.length; i++) {
            var bp = bridgePositions[i];
            var bridgeGeo = new THREE.BoxGeometry(bp.w, 1.5, bp.d);
            var bridge = new THREE.Mesh(bridgeGeo, bridgeMaterial);
            bridge.position.set(bp.x, 1, bp.z);
            scene.add(bridge);
            objects.push(bridge);
        }
    }

    function buildLavaSplash() {
        var splashMaterial = new THREE.MeshLambertMaterial({
            color: 0xff8833,
            emissive: 0xff5500
        });

        // Lava splash particles at edges
        var splashEdges = [
            { x: -20, z: -35 },
            { x: 20, z: 20 },
            { x: 0, z: 30 }
        ];

        for (var i = 0; i < splashEdges.length; i++) {
            var se = splashEdges[i];
            for (var j = 0; j < 6; j++) {
                var rad = 0.8 + Math.random() * 1.5;
                var sphGeo = new THREE.SphereGeometry(rad, 5, 5);
                var sph = new THREE.Mesh(sphGeo, splashMaterial);
                sph.position.set(se.x + (Math.random() - 0.5) * 6, 2 + Math.random() * 3, se.z + (Math.random() - 0.5) * 6);
                scene.add(sph);
                objects.push(sph);
            }
        }
    }

    function setupLighting() {
        // Main directional light
        var sunLight = new THREE.DirectionalLight(0xffffff, 0.7);
        sunLight.position.set(30, 40, 20);
        sunLight.castShadow = true;
        scene.add(sunLight);
        lights.push(sunLight);

        // Lava glow light
        var lavaLight = new THREE.PointLight(0xff6600, 1.5, 80);
        lavaLight.position.set(0, 5, 0);
        scene.add(lavaLight);
        lights.push(lavaLight);

        // Vent glow lights
        var ventLights = [
            { x: -35, z: -20 },
            { x: 25, z: -15 },
            { x: -10, z: 25 },
            { x: 40, z: 10 }
        ];

        for (var i = 0; i < ventLights.length; i++) {
            var vl = ventLights[i];
            var glow = new THREE.PointLight(0xff4400, 0.8, 60);
            glow.position.set(vl.x, 8, vl.z);
            scene.add(glow);
            lights.push(glow);
        }

        // Ambient light
        var ambient = new THREE.AmbientLight(0x4a4a4a, 0.5);
        scene.add(ambient);
        lights.push(ambient);

        // Outpost glow
        var outpostGlow = new THREE.PointLight(0xffaa00, 0.6, 50);
        outpostGlow.position.set(0, 15, 35);
        scene.add(outpostGlow);
        lights.push(outpostGlow);
    }

    function update(delta) {
        animationTime += delta;

        // Pulse lava glow
        var pulseAmount = Math.sin(animationTime * 2) * 0.5 + 1;
        if (lights.length > 1) {
            lights[1].intensity = 1.5 * pulseAmount;
        }

        // Animate volcanic vent smoke rising
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.geometry instanceof THREE.SphereGeometry && obj.position.y > 4 && obj.position.y < 20) {
                obj.position.y += delta * 0.5;
                obj.scale.y += delta * 0.1;
                if (obj.position.y > 25) {
                    obj.position.y = 4;
                    obj.scale.y = 1;
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
        animationTime = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
