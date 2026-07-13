window.DartmoorPost = (function() {
    'use strict';

    var WX = 3640;
    var WZ = 2200;

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

    function addmesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function buildPost() {
        buildHaytorRocks();
        buildPrison();
        buildGrimspound();
        buildWistmansWood();
        buildBaskerville();
        buildMerrivale();
        buildLights();
    }

    function buildHaytorRocks() {
        var graniteMat = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });

        // Left tor - base block
        var geom = new THREE.BoxGeometry(8, 6, 7);
        var mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 30, 3, WZ - 10);
        addmesh(mesh);

        // Left tor - middle block
        geom = new THREE.BoxGeometry(6, 5, 6);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 30, 8.5, WZ - 10);
        addmesh(mesh);

        // Left tor - upper block
        geom = new THREE.BoxGeometry(5, 4, 5);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 29.5, 13, WZ - 10.5);
        addmesh(mesh);

        // Left tor - cap block (total ~14 units)
        geom = new THREE.BoxGeometry(4, 3, 4);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 30, 17, WZ - 10);
        addmesh(mesh);

        // Left tor - boulder 1
        geom = new THREE.SphereGeometry(2.5, 8, 6);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 25, 1, WZ - 7);
        addmesh(mesh);

        // Left tor - boulder 2
        geom = new THREE.SphereGeometry(1.8, 8, 6);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 34, 1, WZ - 13);
        addmesh(mesh);

        // Right tor - base block
        geom = new THREE.BoxGeometry(7, 6, 8);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 18, 3, WZ - 8);
        addmesh(mesh);

        // Right tor - middle block
        geom = new THREE.BoxGeometry(6, 5, 6);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 18, 8.5, WZ - 8);
        addmesh(mesh);

        // Right tor - upper block
        geom = new THREE.BoxGeometry(5, 4, 5);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 17.5, 13, WZ - 8.5);
        addmesh(mesh);

        // Right tor - cap block (total ~14 units)
        geom = new THREE.BoxGeometry(4, 3, 4);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 18, 17, WZ - 8);
        addmesh(mesh);

        // Right tor - boulder 1
        geom = new THREE.SphereGeometry(2.2, 8, 6);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 13, 1, WZ - 5);
        addmesh(mesh);

        // Right tor - boulder 2
        geom = new THREE.SphereGeometry(1.5, 8, 6);
        mesh = new THREE.Mesh(geom, graniteMat);
        mesh.position.set(WX - 22, 1, WZ - 12);
        addmesh(mesh);
    }

    function buildPrison() {
        var prisonMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var darkMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

        // Main prison block 30x8x20
        var geom = new THREE.BoxGeometry(30, 8, 20);
        var mesh = new THREE.Mesh(geom, prisonMat);
        mesh.position.set(WX + 20, 4, WZ + 20);
        addmesh(mesh);

        // Perimeter wall - north
        geom = new THREE.BoxGeometry(50, 6, 2);
        mesh = new THREE.Mesh(geom, darkMat);
        mesh.position.set(WX + 20, 3, WZ + 5);
        addmesh(mesh);

        // Perimeter wall - south
        geom = new THREE.BoxGeometry(50, 6, 2);
        mesh = new THREE.Mesh(geom, darkMat);
        mesh.position.set(WX + 20, 3, WZ + 40);
        addmesh(mesh);

        // Perimeter wall - east
        geom = new THREE.BoxGeometry(2, 6, 35);
        mesh = new THREE.Mesh(geom, darkMat);
        mesh.position.set(WX + 45, 3, WZ + 22.5);
        addmesh(mesh);

        // Perimeter wall - west
        geom = new THREE.BoxGeometry(2, 6, 35);
        mesh = new THREE.Mesh(geom, darkMat);
        mesh.position.set(WX - 5, 3, WZ + 22.5);
        addmesh(mesh);

        // Watchtower cylinder - NW corner
        geom = new THREE.CylinderGeometry(2.5, 2.5, 10, 10);
        mesh = new THREE.Mesh(geom, prisonMat);
        mesh.position.set(WX - 5, 5, WZ + 5);
        addmesh(mesh);

        // Watchtower cylinder - NE corner
        geom = new THREE.CylinderGeometry(2.5, 2.5, 10, 10);
        mesh = new THREE.Mesh(geom, prisonMat);
        mesh.position.set(WX + 45, 5, WZ + 5);
        addmesh(mesh);

        // Watchtower cylinder - SW corner
        geom = new THREE.CylinderGeometry(2.5, 2.5, 10, 10);
        mesh = new THREE.Mesh(geom, prisonMat);
        mesh.position.set(WX - 5, 5, WZ + 40);
        addmesh(mesh);

        // Watchtower cylinder - SE corner
        geom = new THREE.CylinderGeometry(2.5, 2.5, 10, 10);
        mesh = new THREE.Mesh(geom, prisonMat);
        mesh.position.set(WX + 45, 5, WZ + 40);
        addmesh(mesh);

        // Exercise yard divider wall
        geom = new THREE.BoxGeometry(24, 4, 1.5);
        mesh = new THREE.Mesh(geom, darkMat);
        mesh.position.set(WX + 20, 2, WZ + 27);
        addmesh(mesh);

        // Second prison wing
        geom = new THREE.BoxGeometry(14, 6, 10);
        mesh = new THREE.Mesh(geom, prisonMat);
        mesh.position.set(WX + 20, 3, WZ + 36);
        addmesh(mesh);

        // Gatehouse box
        geom = new THREE.BoxGeometry(8, 8, 6);
        mesh = new THREE.Mesh(geom, darkMat);
        mesh.position.set(WX + 20, 4, WZ + 5);
        addmesh(mesh);
    }

    function buildGrimspound() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
        var thatchMat = new THREE.MeshLambertMaterial({ color: 0xA0783C });

        // Granite wall ring - 12 stones placed in oval
        var ringCX = WX - 10;
        var ringCZ = WZ + 60;
        var angles = [0, 0.52, 1.05, 1.57, 2.09, 2.62, 3.14, 3.67, 4.19, 4.71, 5.24, 5.76];
        var rX = 14;
        var rZ = 11;

        for (var i = 0; i < angles.length; i++) {
            var geom = new THREE.BoxGeometry(2, 1.8, 1.2);
            var mesh = new THREE.Mesh(geom, wallMat);
            mesh.position.set(
                ringCX + rX * Math.cos(angles[i]),
                0.9,
                ringCZ + rZ * Math.sin(angles[i])
            );
            mesh.rotation.y = angles[i];
            addmesh(mesh);
        }

        // Roundhouse cylinder body r=4 h=3
        var geom = new THREE.CylinderGeometry(4, 4, 3, 14);
        var mesh = new THREE.Mesh(geom, wallMat);
        mesh.position.set(ringCX, 1.5, ringCZ);
        addmesh(mesh);

        // Roundhouse cone roof
        geom = new THREE.ConeGeometry(4.5, 3, 14);
        mesh = new THREE.Mesh(geom, thatchMat);
        mesh.position.set(ringCX, 4.5, ringCZ);
        addmesh(mesh);

        // Interior hut stones (small boxes scattered inside)
        geom = new THREE.BoxGeometry(1, 0.8, 0.8);
        mesh = new THREE.Mesh(geom, wallMat);
        mesh.position.set(ringCX + 7, 0.4, ringCZ + 4);
        addmesh(mesh);

        geom = new THREE.BoxGeometry(1.2, 0.9, 0.7);
        mesh = new THREE.Mesh(geom, wallMat);
        mesh.position.set(ringCX - 8, 0.45, ringCZ - 3);
        addmesh(mesh);

        geom = new THREE.BoxGeometry(0.9, 0.7, 1);
        mesh = new THREE.Mesh(geom, wallMat);
        mesh.position.set(ringCX + 5, 0.35, ringCZ - 7);
        addmesh(mesh);
    }

    function buildWistmansWood() {
        var trunkMat = new THREE.MeshLambertMaterial({ color: 0x3A2A1A });
        var canopyMat = new THREE.MeshLambertMaterial({ color: 0x2A5A1A });
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x6A6A62 });

        var treePosX = [WX + 60, WX + 65, WX + 68, WX + 72, WX + 58, WX + 63, WX + 70, WX + 75];
        var treePosZ = [WZ - 30, WZ - 25, WZ - 35, WZ - 28, WZ - 22, WZ - 40, WZ - 18, WZ - 32];
        var trunkH =   [5, 6, 4.5, 7, 5.5, 4, 6.5, 5];
        var canopyR =  [3.5, 4, 3, 4.5, 3.8, 3.2, 4.2, 3.6];

        for (var t = 0; t < 8; t++) {
            // Gnarled trunk cylinder
            var geom = new THREE.CylinderGeometry(0.6, 0.9, trunkH[t], 7);
            var mesh = new THREE.Mesh(geom, trunkMat);
            mesh.position.set(treePosX[t], trunkH[t] / 2, treePosZ[t]);
            mesh.rotation.z = (t % 3 - 1) * 0.12;
            mesh.rotation.x = (t % 2 - 0.5) * 0.08;
            addmesh(mesh);

            // Irregular sphere canopy
            geom = new THREE.SphereGeometry(canopyR[t], 7, 6);
            mesh = new THREE.Mesh(geom, canopyMat);
            mesh.position.set(treePosX[t] + (t % 3 - 1) * 0.6, trunkH[t] + canopyR[t] * 0.7, treePosZ[t]);
            addmesh(mesh);
        }

        // Boulder carpet under trees
        var boulderX = [WX + 61, WX + 66, WX + 71, WX + 56, WX + 74, WX + 64];
        var boulderZ = [WZ - 38, WZ - 20, WZ - 42, WZ - 28, WZ - 23, WZ - 33];
        var boulderS = [1.5, 1.2, 1.8, 1.3, 1.6, 1.1];

        for (var b = 0; b < 6; b++) {
            geom = new THREE.SphereGeometry(boulderS[b], 6, 5);
            mesh = new THREE.Mesh(geom, boulderMat);
            mesh.position.set(boulderX[b], boulderS[b] * 0.5, boulderZ[b]);
            addmesh(mesh);
        }
    }

    function buildBaskerville() {
        var bogMat = new THREE.MeshLambertMaterial({ color: 0x2A1A0A });
        var mistMat = new THREE.MeshLambertMaterial({ color: 0x888888, transparent: true, opacity: 0.45 });

        // Dark peaty bog boxes
        var bogX = [WX + 40, WX + 48, WX + 35, WX + 55, WX + 43, WX + 50];
        var bogZ = [WZ - 55, WZ - 60, WZ - 48, WZ - 65, WZ - 72, WZ - 50];
        var bogW = [10, 8, 12, 9, 11, 7];
        var bogD = [8, 12, 6, 10, 7, 9];

        for (var p = 0; p < 6; p++) {
            var geom = new THREE.BoxGeometry(bogW[p], 0.6, bogD[p]);
            var mesh = new THREE.Mesh(geom, bogMat);
            mesh.position.set(bogX[p], 0.3, bogZ[p]);
            addmesh(mesh);
        }

        // Mist sphere clusters
        var mistX = [WX + 42, WX + 50, WX + 37, WX + 56, WX + 46, WX + 52, WX + 39, WX + 60];
        var mistZ = [WZ - 57, WZ - 63, WZ - 52, WZ - 68, WZ - 74, WZ - 53, WZ - 70, WZ - 58];
        var mistR = [3, 4, 2.5, 3.5, 2, 4.5, 3, 2.8];
        var mistY = [1.5, 2, 1.2, 2.5, 1.8, 1, 3, 2.2];

        for (var m = 0; m < 8; m++) {
            geom = new THREE.SphereGeometry(mistR[m], 8, 6);
            mesh = new THREE.Mesh(geom, mistMat);
            mesh.position.set(mistX[m], mistY[m], mistZ[m]);
            addmesh(mesh);
        }
    }

    function buildMerrivale() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8A8A7A });

        // 30 thin standing stones in straight line (1x2x0.5, spaced 3 units apart)
        var rowZ = WZ - 90;
        var startX = WX - 40;

        for (var s = 0; s < 30; s++) {
            var geom = new THREE.BoxGeometry(1, 2, 0.5);
            var mesh = new THREE.Mesh(geom, stoneMat);
            mesh.position.set(startX + s * 3, 1, rowZ);
            // Slight lean variation for ancient look
            mesh.rotation.z = (s % 5 - 2) * 0.025;
            addmesh(mesh);
        }
    }

    function buildLights() {
        // Overcast Dartmoor ambient - cool grey daylight
        var ambientLight = new THREE.AmbientLight(0xB0B8C0, 0.7);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light - diffuse moorland sun
        var dirLight = new THREE.DirectionalLight(0xD0CEC8, 0.6);
        dirLight.position.set(WX - 50, 60, WZ - 80);
        scene.add(dirLight);
        lights.push(dirLight);

        // Fill light for prison side
        var fillLight = new THREE.DirectionalLight(0x8090A0, 0.3);
        fillLight.position.set(WX + 80, 30, WZ + 60);
        scene.add(fillLight);
        lights.push(fillLight);
    }

    function update(delta) {
        // Gently drift mist spheres (objects with transparent material)
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.material && obj.material.transparent) {
                obj.position.x += Math.sin(Date.now() * 0.0003 + i) * delta * 0.4;
                obj.position.z += Math.cos(Date.now() * 0.0002 + i) * delta * 0.3;
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

    return { init: init, update: update, reset: reset };
}());
