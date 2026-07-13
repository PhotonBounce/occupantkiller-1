window.TrossachsPost = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    var OX = 1930;
    var OZ = 2200;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildPost();
    }

    function buildPost() {
        buildBenAan();
        buildLochKatrine();
        buildRobRoysCave();
        buildAberfoyle();
        buildFairyGlen();
        buildStandingStone();
        buildLighting();
    }

    function buildBenAan() {
        var mat;
        var geom;
        var mesh;

        // Ben A'an summit base tier - wide craggy box
        mat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        geom = new THREE.BoxGeometry(28, 12, 28);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 40, 6, OZ - 60);
        scene.add(mesh);
        objects.push(mesh);

        // Ben A'an mid tier
        geom = new THREE.BoxGeometry(20, 10, 20);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 40, 17, OZ - 60);
        scene.add(mesh);
        objects.push(mesh);

        // Ben A'an upper tier
        geom = new THREE.BoxGeometry(13, 9, 13);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 40, 26, OZ - 60);
        scene.add(mesh);
        objects.push(mesh);

        // Ben A'an near-summit craggy tier
        geom = new THREE.BoxGeometry(8, 8, 8);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 40, 34, OZ - 60);
        scene.add(mesh);
        objects.push(mesh);

        // Ben A'an rocky summit block 1
        var summitMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        geom = new THREE.BoxGeometry(5, 6, 4);
        mesh = new THREE.Mesh(geom, summitMat);
        mesh.position.set(OX - 42, 41, OZ - 62);
        scene.add(mesh);
        objects.push(mesh);

        // Ben A'an rocky summit block 2
        geom = new THREE.BoxGeometry(3, 5, 3);
        mesh = new THREE.Mesh(geom, summitMat);
        mesh.position.set(OX - 37, 40, OZ - 58);
        scene.add(mesh);
        objects.push(mesh);

        // Ben A'an rocky summit block 3
        geom = new THREE.BoxGeometry(4, 4, 4);
        mesh = new THREE.Mesh(geom, summitMat);
        mesh.position.set(OX - 44, 39, OZ - 57);
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildLochKatrine() {
        var mat;
        var geom;
        var mesh;

        // Loch Katrine main water surface - large blue box
        mat = new THREE.MeshLambertMaterial({ color: 0x1A4A7A });
        geom = new THREE.BoxGeometry(80, 1, 50);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX + 20, -1, OZ + 10);
        scene.add(mesh);
        objects.push(mesh);

        // Loch water extension east
        geom = new THREE.BoxGeometry(40, 1, 30);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX + 80, -1, OZ + 5);
        scene.add(mesh);
        objects.push(mesh);

        // SS Sir Walter Scott hull - elongated box 16x3x5
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
        geom = new THREE.BoxGeometry(16, 3, 5);
        mesh = new THREE.Mesh(geom, hullMat);
        mesh.position.set(OX + 18, 1, OZ + 8);
        scene.add(mesh);
        objects.push(mesh);

        // SS Sir Walter Scott deck superstructure box
        var deckMat = new THREE.MeshLambertMaterial({ color: 0xCCBB99 });
        geom = new THREE.BoxGeometry(10, 2, 4);
        mesh = new THREE.Mesh(geom, deckMat);
        mesh.position.set(OX + 17, 3.5, OZ + 8);
        scene.add(mesh);
        objects.push(mesh);

        // SS Sir Walter Scott black funnel cylinder
        var funnelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        geom = new THREE.CylinderGeometry(0.8, 1.0, 4, 10);
        mesh = new THREE.Mesh(geom, funnelMat);
        mesh.position.set(OX + 18, 6.5, OZ + 8);
        scene.add(mesh);
        objects.push(mesh);

        // Funnel smoke sphere
        var smokeMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        geom = new THREE.SphereGeometry(1.2, 6, 6);
        mesh = new THREE.Mesh(geom, smokeMat);
        mesh.position.set(OX + 18, 9.5, OZ + 8);
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildRobRoysCave() {
        var mat;
        var geom;
        var mesh;

        // Rob Roy's Cave - dark rock cliff face
        mat = new THREE.MeshLambertMaterial({ color: 0x3A3A3A });
        geom = new THREE.BoxGeometry(18, 14, 10);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 60, 7, OZ + 30);
        scene.add(mesh);
        objects.push(mesh);

        // Overhanging rock ledge box jutting outward
        geom = new THREE.BoxGeometry(14, 4, 8);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 60, 12, OZ + 25);
        scene.add(mesh);
        objects.push(mesh);

        // Cave gap left side box (dark void fill left)
        var gapMat = new THREE.MeshLambertMaterial({ color: 0x1A1A1A });
        geom = new THREE.BoxGeometry(4, 5, 7);
        mesh = new THREE.Mesh(geom, gapMat);
        mesh.position.set(OX - 65, 3, OZ + 26);
        scene.add(mesh);
        objects.push(mesh);

        // Cave gap right side box (dark void fill right)
        geom = new THREE.BoxGeometry(4, 5, 7);
        mesh = new THREE.Mesh(geom, gapMat);
        mesh.position.set(OX - 55, 3, OZ + 26);
        scene.add(mesh);
        objects.push(mesh);

        // Cave floor rubble sphere 1
        var rubbleMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        geom = new THREE.SphereGeometry(1.5, 6, 6);
        mesh = new THREE.Mesh(geom, rubbleMat);
        mesh.position.set(OX - 61, 1, OZ + 24);
        scene.add(mesh);
        objects.push(mesh);

        // Cave floor rubble sphere 2
        geom = new THREE.SphereGeometry(1.2, 6, 6);
        mesh = new THREE.Mesh(geom, rubbleMat);
        mesh.position.set(OX - 58, 1, OZ + 25);
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildAberfoyle() {
        var mat;
        var geom;
        var mesh;

        // Aberfoyle village ground base box
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x6B7A3A });
        geom = new THREE.BoxGeometry(60, 1, 40);
        mesh = new THREE.Mesh(geom, groundMat);
        mesh.position.set(OX + 30, -0.5, OZ - 30);
        scene.add(mesh);
        objects.push(mesh);

        // Church building box 8x8x6 (width x height x depth)
        var churchMat = new THREE.MeshLambertMaterial({ color: 0x9A9A8A });
        geom = new THREE.BoxGeometry(8, 6, 8);
        mesh = new THREE.Mesh(geom, churchMat);
        mesh.position.set(OX + 15, 3, OZ - 35);
        scene.add(mesh);
        objects.push(mesh);

        // Church roof cone
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x6A6A5A });
        geom = new THREE.ConeGeometry(6, 4, 4);
        mesh = new THREE.Mesh(geom, roofMat);
        mesh.position.set(OX + 15, 8, OZ - 35);
        mesh.rotation.y = Math.PI / 4;
        scene.add(mesh);
        objects.push(mesh);

        // Church bell tower cylinder
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8A8A7A });
        geom = new THREE.CylinderGeometry(1.5, 1.5, 10, 10);
        mesh = new THREE.Mesh(geom, towerMat);
        mesh.position.set(OX + 20, 5, OZ - 35);
        scene.add(mesh);
        objects.push(mesh);

        // Bell tower cone cap
        geom = new THREE.ConeGeometry(2, 3, 8);
        mesh = new THREE.Mesh(geom, roofMat);
        mesh.position.set(OX + 20, 11.5, OZ - 35);
        scene.add(mesh);
        objects.push(mesh);

        // Inn building box
        var innMat = new THREE.MeshLambertMaterial({ color: 0xBBAA88 });
        geom = new THREE.BoxGeometry(10, 5, 8);
        mesh = new THREE.Mesh(geom, innMat);
        mesh.position.set(OX + 32, 2.5, OZ - 32);
        scene.add(mesh);
        objects.push(mesh);

        // Inn roof cone
        geom = new THREE.ConeGeometry(7, 3, 4);
        mesh = new THREE.Mesh(geom, roofMat);
        mesh.position.set(OX + 32, 6.5, OZ - 32);
        mesh.rotation.y = Math.PI / 4;
        scene.add(mesh);
        objects.push(mesh);

        // Bridge over River Forth - box deck
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        geom = new THREE.BoxGeometry(20, 1.5, 5);
        mesh = new THREE.Mesh(geom, bridgeMat);
        mesh.position.set(OX + 30, 1, OZ - 18);
        scene.add(mesh);
        objects.push(mesh);

        // Bridge pier cylinder left
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
        geom = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
        mesh = new THREE.Mesh(geom, pierMat);
        mesh.position.set(OX + 22, -1, OZ - 18);
        scene.add(mesh);
        objects.push(mesh);

        // Bridge pier cylinder right
        geom = new THREE.CylinderGeometry(1.5, 1.5, 4, 8);
        mesh = new THREE.Mesh(geom, pierMat);
        mesh.position.set(OX + 38, -1, OZ - 18);
        scene.add(mesh);
        objects.push(mesh);

        // River Forth water box beneath bridge
        var riverMat = new THREE.MeshLambertMaterial({ color: 0x2A5A7A });
        geom = new THREE.BoxGeometry(22, 1, 8);
        mesh = new THREE.Mesh(geom, riverMat);
        mesh.position.set(OX + 30, -1.5, OZ - 18);
        scene.add(mesh);
        objects.push(mesh);

        // Small cottage box 1
        var cottageMat = new THREE.MeshLambertMaterial({ color: 0xCCBBAA });
        geom = new THREE.BoxGeometry(6, 4, 5);
        mesh = new THREE.Mesh(geom, cottageMat);
        mesh.position.set(OX + 45, 2, OZ - 38);
        scene.add(mesh);
        objects.push(mesh);

        // Cottage roof cone 1
        geom = new THREE.ConeGeometry(4.5, 3, 4);
        mesh = new THREE.Mesh(geom, roofMat);
        mesh.position.set(OX + 45, 5.5, OZ - 38);
        mesh.rotation.y = Math.PI / 4;
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildFairyGlen() {
        var mat;
        var geom;
        var mesh;

        // Fairy Glen waterfall cascade step 1 - top
        mat = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });
        geom = new THREE.BoxGeometry(8, 2, 5);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 20, 18, OZ + 55);
        scene.add(mesh);
        objects.push(mesh);

        // Cascade step 2
        geom = new THREE.BoxGeometry(9, 2, 5);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 20, 14, OZ + 60);
        scene.add(mesh);
        objects.push(mesh);

        // Cascade step 3
        geom = new THREE.BoxGeometry(10, 2, 5);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 20, 10, OZ + 65);
        scene.add(mesh);
        objects.push(mesh);

        // Cascade step 4
        geom = new THREE.BoxGeometry(11, 2, 5);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 20, 6, OZ + 70);
        scene.add(mesh);
        objects.push(mesh);

        // Cascade step 5 - bottom pool ledge
        geom = new THREE.BoxGeometry(14, 2, 6);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 20, 2, OZ + 75);
        scene.add(mesh);
        objects.push(mesh);

        // Spray sphere cluster 1
        var sprayMat = new THREE.MeshLambertMaterial({ color: 0xE0E8F0 });
        geom = new THREE.SphereGeometry(2.5, 7, 7);
        mesh = new THREE.Mesh(geom, sprayMat);
        mesh.position.set(OX - 18, 4, OZ + 73);
        scene.add(mesh);
        objects.push(mesh);

        // Spray sphere cluster 2
        geom = new THREE.SphereGeometry(2.0, 7, 7);
        mesh = new THREE.Mesh(geom, sprayMat);
        mesh.position.set(OX - 22, 5, OZ + 71);
        scene.add(mesh);
        objects.push(mesh);

        // Spray sphere cluster 3
        geom = new THREE.SphereGeometry(1.8, 7, 7);
        mesh = new THREE.Mesh(geom, sprayMat);
        mesh.position.set(OX - 20, 6, OZ + 74);
        scene.add(mesh);
        objects.push(mesh);

        // Spray sphere cluster 4
        geom = new THREE.SphereGeometry(1.5, 7, 7);
        mesh = new THREE.Mesh(geom, sprayMat);
        mesh.position.set(OX - 16, 3, OZ + 76);
        scene.add(mesh);
        objects.push(mesh);

        // Spray sphere cluster 5
        geom = new THREE.SphereGeometry(1.6, 7, 7);
        mesh = new THREE.Mesh(geom, sprayMat);
        mesh.position.set(OX - 24, 4, OZ + 74);
        scene.add(mesh);
        objects.push(mesh);

        // Glen pool water box at base
        var poolMat = new THREE.MeshLambertMaterial({ color: 0x4A7A9A });
        geom = new THREE.BoxGeometry(16, 1, 10);
        mesh = new THREE.Mesh(geom, poolMat);
        mesh.position.set(OX - 20, 0, OZ + 80);
        scene.add(mesh);
        objects.push(mesh);

        // LineSegments waterfall veil
        var veilGeom = new THREE.BufferGeometry();
        var veilPoints = [
            new THREE.Vector3(OX - 24, 18, OZ + 57),
            new THREE.Vector3(OX - 24, 2, OZ + 76),
            new THREE.Vector3(OX - 20, 18, OZ + 57),
            new THREE.Vector3(OX - 20, 2, OZ + 76),
            new THREE.Vector3(OX - 16, 18, OZ + 57),
            new THREE.Vector3(OX - 16, 2, OZ + 76)
        ];
        veilGeom.setFromPoints(veilPoints);
        var veilMat = new THREE.LineBasicMaterial({ color: 0xC0D8F0, linewidth: 2 });
        var veil = new THREE.LineSegments(veilGeom, veilMat);
        scene.add(veil);
        objects.push(veil);
    }

    function buildStandingStone() {
        var mat;
        var geom;
        var mesh;

        // Ancient MacGregor clan standing stone - tall thin box 2x8x1
        mat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
        geom = new THREE.BoxGeometry(2, 8, 1);
        mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(OX - 10, 4, OZ - 50);
        scene.add(mesh);
        objects.push(mesh);

        // Standing stone base rubble box
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x5A5040 });
        geom = new THREE.BoxGeometry(4, 1, 3);
        mesh = new THREE.Mesh(geom, baseMat);
        mesh.position.set(OX - 10, 0.5, OZ - 50);
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildLighting() {
        // Ambient light - overcast Scottish highland sky
        var ambientLight = new THREE.AmbientLight(0xCCDDEE, 0.7);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light - diffuse highland daylight
        var dirLight = new THREE.DirectionalLight(0xFFEEDD, 0.9);
        dirLight.position.set(OX - 30, 60, OZ - 40);
        scene.add(dirLight);
        lights.push(dirLight);

        // Fill light from loch reflection
        var fillLight = new THREE.DirectionalLight(0x8AAABB, 0.3);
        fillLight.position.set(OX + 50, 20, OZ + 20);
        scene.add(fillLight);
        lights.push(fillLight);
    }

    function update(delta) {
        // Gentle smoke sphere bob on SS Sir Walter Scott funnel
        // objects index for smoke sphere is 13
        if (objects.length > 13 && objects[13]) {
            objects[13].position.y += Math.sin(Date.now() * 0.001) * delta * 0.3;
        }
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
