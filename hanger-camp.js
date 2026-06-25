window.HangerCamp = (function() {
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
        // Massive beech trunk 1 - tall thick cylinder, grey-silver
        var trunkGeo1 = new THREE.CylinderGeometry(4, 4.5, 28, 16);
        var trunkMat1 = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var trunk1 = new THREE.Mesh(trunkGeo1, trunkMat1);
        trunk1.position.set(-18, 14, -15);
        trunk1.castShadow = true;
        trunk1.receiveShadow = true;
        scene.add(trunk1);
        objects.push(trunk1);

        // Massive beech trunk 2 - tall thick cylinder, grey-silver
        var trunkGeo2 = new THREE.CylinderGeometry(3.8, 4.2, 30, 16);
        var trunkMat2 = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var trunk2 = new THREE.Mesh(trunkGeo2, trunkMat2);
        trunk2.position.set(12, 15, -8);
        trunk2.castShadow = true;
        trunk2.receiveShadow = true;
        scene.add(trunk2);
        objects.push(trunk2);

        // Massive beech trunk 3 - tall thick cylinder, grey-silver
        var trunkGeo3 = new THREE.CylinderGeometry(4.2, 4.8, 32, 16);
        var trunkMat3 = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var trunk3 = new THREE.Mesh(trunkGeo3, trunkMat3);
        trunk3.position.set(5, 16, 12);
        trunk3.castShadow = true;
        trunk3.receiveShadow = true;
        scene.add(trunk3);
        objects.push(trunk3);

        // Dense canopy sphere 1 - large overlapping green
        var canopyGeo1 = new THREE.SphereGeometry(12, 12, 12);
        var canopyMat1 = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var canopy1 = new THREE.Mesh(canopyGeo1, canopyMat1);
        canopy1.position.set(-15, 24, -10);
        canopy1.castShadow = true;
        canopy1.receiveShadow = true;
        scene.add(canopy1);
        objects.push(canopy1);

        // Dense canopy sphere 2 - large overlapping green
        var canopyGeo2 = new THREE.SphereGeometry(13, 12, 12);
        var canopyMat2 = new THREE.MeshLambertMaterial({ color: 0x1f4c0f });
        var canopy2 = new THREE.Mesh(canopyGeo2, canopyMat2);
        canopy2.position.set(18, 25, 5);
        canopy2.castShadow = true;
        canopy2.receiveShadow = true;
        scene.add(canopy2);
        objects.push(canopy2);

        // Dense canopy sphere 3 - large overlapping green
        var canopyGeo3 = new THREE.SphereGeometry(11, 12, 12);
        var canopyMat3 = new THREE.MeshLambertMaterial({ color: 0x305a1a });
        var canopy3 = new THREE.Mesh(canopyGeo3, canopyMat3);
        canopy3.position.set(2, 23, 18);
        canopy3.castShadow = true;
        canopy3.receiveShadow = true;
        scene.add(canopy3);
        objects.push(canopy3);

        // Camouflage hide platform - box platform between cylinder trunks
        var platformGeo = new THREE.BoxGeometry(16, 1.5, 8);
        var platformMat = new THREE.MeshLambertMaterial({ color: 0x4a5a3a });
        var platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(-3, 18, 2);
        platform.castShadow = true;
        platform.receiveShadow = true;
        scene.add(platform);
        objects.push(platform);

        // Dead ground trap - box pit
        var trapGeo = new THREE.BoxGeometry(6, 2, 6);
        var trapMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var trap = new THREE.Mesh(trapGeo, trapMat);
        trap.position.set(-22, 0.5, 20);
        trap.castShadow = true;
        trap.receiveShadow = true;
        scene.add(trap);
        objects.push(trap);

        // Fallen log barricade - horizontal cylinder
        var logGeo = new THREE.CylinderGeometry(2.5, 2.5, 18, 12);
        var logMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var log = new THREE.Mesh(logGeo, logMat);
        log.position.set(20, 2, -20);
        log.rotation.z = Math.PI / 2.2;
        log.castShadow = true;
        log.receiveShadow = true;
        scene.add(log);
        objects.push(log);

        // Fallen log notch marks - LineSegments
        var notchGeo = new THREE.BufferGeometry();
        var notchVertices = new Float32Array([
            20, 2, -25,
            20.5, 2, -25,
            20, 2, -20,
            20.5, 2, -20,
            20, 2, -15,
            20.5, 2, -15,
            20, 2, -10,
            20.5, 2, -10
        ]);
        notchGeo.setAttribute('position', new THREE.BufferAttribute(notchVertices, 3));
        var notchMat = new THREE.LineBasicMaterial({ color: 0x3a2a1a });
        var notches = new THREE.LineSegments(notchGeo, notchMat);
        scene.add(notches);
        objects.push(notches);

        // Leaf litter IED concealment - sphere brown cluster 1
        var litterGeo1 = new THREE.SphereGeometry(3, 8, 8);
        var litterMat1 = new THREE.MeshLambertMaterial({ color: 0x6b5a47 });
        var litter1 = new THREE.Mesh(litterGeo1, litterMat1);
        litter1.position.set(-28, 1.5, 10);
        litter1.castShadow = true;
        litter1.receiveShadow = true;
        scene.add(litter1);
        objects.push(litter1);

        // Leaf litter IED concealment - sphere brown cluster 2
        var litterGeo2 = new THREE.SphereGeometry(2.5, 8, 8);
        var litterMat2 = new THREE.MeshLambertMaterial({ color: 0x5a4a37 });
        var litter2 = new THREE.Mesh(litterGeo2, litterMat2);
        litter2.position.set(-24, 1, 8);
        litter2.castShadow = true;
        litter2.receiveShadow = true;
        scene.add(litter2);
        objects.push(litter2);

        // Signal fire circle - cylinder stones ring
        var stoneRingGeo = new THREE.CylinderGeometry(6, 6, 0.8, 24);
        var stoneRingMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        var stoneRing = new THREE.Mesh(stoneRingGeo, stoneRingMat);
        stoneRing.position.set(28, 0.5, -25);
        stoneRing.castShadow = true;
        stoneRing.receiveShadow = true;
        scene.add(stoneRing);
        objects.push(stoneRing);

        // Signal fire - sphere fire in center
        var fireGeo = new THREE.SphereGeometry(2, 10, 10);
        var fireMat = new THREE.MeshLambertMaterial({ color: 0xff6b1a, emissive: 0xff4500 });
        var fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.set(28, 2, -25);
        fire.castShadow = true;
        fire.receiveShadow = true;
        scene.add(fire);
        objects.push(fire);

        // Observation hollow - box shelter dug into chalk bank
        var shelterGeo = new THREE.BoxGeometry(8, 5, 6);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0xccccaa });
        var shelter = new THREE.Mesh(shelterGeo, shelterMat);
        shelter.position.set(-20, 2, -28);
        shelter.castShadow = true;
        shelter.receiveShadow = true;
        scene.add(shelter);
        objects.push(shelter);

        // Chalk slope - large cone for slope
        var slopeGeo = new THREE.ConeGeometry(50, 5, 32);
        var slopeMat = new THREE.MeshLambertMaterial({ color: 0xd9cdb8 });
        var slope = new THREE.Mesh(slopeGeo, slopeMat);
        slope.position.set(0, -2, 0);
        slope.castShadow = true;
        slope.receiveShadow = true;
        scene.add(slope);
        objects.push(slope);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for sun
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(15, 25, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation loop - fire flickers
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].material && objects[i].material.emissive) {
                var intensity = 0xff4500 + Math.sin(Date.now() * 0.005) * 0x220000;
                objects[i].material.emissive.setHex(Math.max(0xff2200, Math.floor(intensity)));
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
