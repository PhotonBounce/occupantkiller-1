window.MalhamCove = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color, opts) {
        var params = { color: color };
        if (opts) {
            if (opts.emissive !== undefined) params.emissive = opts.emissive;
            if (opts.emissiveIntensity !== undefined) params.emissiveIntensity = opts.emissiveIntensity;
        }
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial(params));
    }

    function buildMalhamCove() {
        var i, mesh, x, z, angle, rx, rz;
        var baseX = 15400;
        var baseZ = -200;

        // Main curved cliff face — series of tall limestone blocks arranged in arc
        var cliffColor = 0xd4cdb8;
        var segments = 18;
        for (i = 0; i < segments; i++) {
            angle = (i / (segments - 1)) * Math.PI - Math.PI * 0.5;
            rx = Math.cos(angle) * 90;
            rz = Math.sin(angle) * 60;
            var cliffH = 55 + Math.random() * 15;
            var cliffW = 12 + Math.random() * 4;
            mesh = makeMesh(new THREE.BoxGeometry(cliffW, cliffH, 8), cliffColor);
            mesh.position.set(baseX + rx, cliffH * 0.5, baseZ + rz);
            mesh.rotation.y = -angle;
            addObj(mesh);
        }

        // Cliff base rubble blocks
        for (i = 0; i < 22; i++) {
            var bx = (Math.random() - 0.5) * 180;
            var bz = (Math.random() - 0.5) * 100;
            var bw = 3 + Math.random() * 6;
            var bh = 1 + Math.random() * 3;
            mesh = makeMesh(new THREE.BoxGeometry(bw, bh, bw * 0.8), cliffColor);
            mesh.position.set(baseX + bx, bh * 0.5, baseZ + bz);
            addObj(mesh);
        }

        // Limestone pavement on top — clints (blocks) in a grid
        var pavementColor = 0xe8e0cc;
        var gx, gz;
        for (gx = -8; gx <= 8; gx++) {
            for (gz = -5; gz <= 5; gz++) {
                var clintW = 4 + Math.random() * 2;
                var clintH = 0.6 + Math.random() * 0.4;
                var clintD = 3.5 + Math.random() * 1.5;
                mesh = makeMesh(new THREE.BoxGeometry(clintW, clintH, clintD), pavementColor);
                mesh.position.set(baseX + gx * 5.5 + (Math.random() - 0.5), 57 + clintH * 0.5, baseZ + gz * 4.5 + (Math.random() - 0.5));
                addObj(mesh);
            }
        }

        // Stream bed at cliff base — disappearing underground
        var streamColor = 0x7ab0c8;
        for (i = 0; i < 6; i++) {
            mesh = makeMesh(new THREE.BoxGeometry(2.5, 0.3, 4), streamColor);
            mesh.position.set(baseX + 2, 0.2, baseZ + 30 + i * 4.5);
            addObj(mesh);
        }
        // Stream sink hole
        mesh = makeMesh(new THREE.CylinderGeometry(2.5, 1.5, 1.5, 8), 0x333322);
        mesh.position.set(baseX + 2, 0, baseZ + 58);
        addObj(mesh);
    }

    function buildGordaleScar() {
        var i, mesh;
        var baseX = 15400 + 180;
        var baseZ = 100;
        var wallColor = 0xc8bfa8;

        // Left towering wall — tall overhanging cliff
        for (i = 0; i < 10; i++) {
            var wh = 45 + Math.random() * 20;
            mesh = makeMesh(new THREE.BoxGeometry(14, wh, 10), wallColor);
            mesh.position.set(baseX - 20, wh * 0.5, baseZ + i * 12);
            mesh.rotation.z = 0.08 + Math.random() * 0.05;
            addObj(mesh);
        }

        // Right towering wall
        for (i = 0; i < 10; i++) {
            var wh2 = 45 + Math.random() * 20;
            mesh = makeMesh(new THREE.BoxGeometry(14, wh2, 10), wallColor);
            mesh.position.set(baseX + 20, wh2 * 0.5, baseZ + i * 12);
            mesh.rotation.z = -0.08 - Math.random() * 0.05;
            addObj(mesh);
        }

        // Gorge floor — narrow limestone
        mesh = makeMesh(new THREE.BoxGeometry(30, 1, 130), 0xc0b89a);
        mesh.position.set(baseX, 0, baseZ + 60);
        addObj(mesh);

        // Waterfall cascade — stacked cylinders through gorge
        var wfColor = 0x88c0d8;
        for (i = 0; i < 8; i++) {
            mesh = makeMesh(new THREE.CylinderGeometry(1.5, 1.8, 6, 6), wfColor);
            mesh.position.set(baseX, 10 + i * 6, baseZ + 5);
            addObj(mesh);
        }
        // Waterfall pool
        mesh = makeMesh(new THREE.CylinderGeometry(5, 5, 0.5, 10), wfColor);
        mesh.position.set(baseX, 0.4, baseZ + 5);
        addObj(mesh);

        // Travertine tufa deposits — irregular rounded lumps
        var tufaColor = 0xb8b090;
        for (i = 0; i < 14; i++) {
            var tx = (Math.random() - 0.5) * 25;
            var tz = Math.random() * 100;
            var tr = 1.5 + Math.random() * 2.5;
            mesh = makeMesh(new THREE.SphereGeometry(tr, 6, 5), tufaColor);
            mesh.position.set(baseX + tx, tr * 0.5, baseZ + tz);
            addObj(mesh);
        }
    }

    function buildJanetsFoss() {
        var i, mesh;
        var baseX = 15400 + 120;
        var baseZ = 260;

        // Waterfall rock face
        mesh = makeMesh(new THREE.BoxGeometry(18, 12, 6), 0xb0a888);
        mesh.position.set(baseX, 7, baseZ);
        addObj(mesh);

        // Waterfall water
        mesh = makeMesh(new THREE.BoxGeometry(5, 12, 2), 0x90c8e0);
        mesh.position.set(baseX, 7, baseZ + 3);
        addObj(mesh);

        // Plunge pool
        mesh = makeMesh(new THREE.CylinderGeometry(7, 7, 0.6, 10), 0x6ab0cc);
        mesh.position.set(baseX, 0.4, baseZ + 10);
        addObj(mesh);

        // Tufa grotto — curved rock lip over pool
        mesh = makeMesh(new THREE.BoxGeometry(20, 4, 4), 0xc0b898);
        mesh.position.set(baseX, 13, baseZ + 1);
        mesh.rotation.x = 0.3;
        addObj(mesh);

        // Oak woodland trees around foss
        var treePositions = [
            [-14, 22], [-8, 28], [10, 25], [16, 18],
            [-18, 30], [12, 35], [-6, 40], [8, 42],
            [20, 30], [-22, 20]
        ];
        for (i = 0; i < treePositions.length; i++) {
            var tx = treePositions[i][0];
            var tz2 = treePositions[i][1];
            var th = 8 + Math.random() * 5;
            // Trunk
            mesh = makeMesh(new THREE.CylinderGeometry(0.4, 0.6, th, 6), 0x5a4030);
            mesh.position.set(baseX + tx, th * 0.5, baseZ + tz2);
            addObj(mesh);
            // Canopy
            mesh = makeMesh(new THREE.SphereGeometry(3 + Math.random() * 1.5, 6, 5), 0x3a6830);
            mesh.position.set(baseX + tx, th + 2, baseZ + tz2);
            addObj(mesh);
        }
    }

    function buildMalhamTarn() {
        var i, mesh;
        var baseX = 15400 + 50;
        var baseZ = -520;

        // Tarn water body — large dark lake
        mesh = makeMesh(new THREE.BoxGeometry(200, 0.5, 140), 0x2a4a5a);
        mesh.position.set(baseX, 0.3, baseZ);
        addObj(mesh);

        // Moorland edges — low undulating terrain blocks
        var edgeColor = 0x7a7060;
        var edgePositions = [
            [-110, 0], [110, 0], [0, -75], [0, 75],
            [-80, -55], [80, -55], [-80, 55], [80, 55]
        ];
        for (i = 0; i < edgePositions.length; i++) {
            var ew = 40 + Math.random() * 20;
            var eh = 3 + Math.random() * 4;
            var ed = 30 + Math.random() * 15;
            mesh = makeMesh(new THREE.BoxGeometry(ew, eh, ed), edgeColor);
            mesh.position.set(baseX + edgePositions[i][0], eh * 0.5, baseZ + edgePositions[i][1]);
            addObj(mesh);
        }

        // Limestone pavement edge along south shore
        var pavColor = 0xd8d0bc;
        for (i = 0; i < 12; i++) {
            var pw = 5 + Math.random() * 3;
            var ph = 0.5 + Math.random() * 0.6;
            mesh = makeMesh(new THREE.BoxGeometry(pw, ph, 4), pavColor);
            mesh.position.set(baseX - 55 + i * 10, ph * 0.5, baseZ + 72);
            addObj(mesh);
        }

        // Tarn House — Victorian field studies centre
        // Main building
        mesh = makeMesh(new THREE.BoxGeometry(22, 8, 14), 0xc0b090);
        mesh.position.set(baseX + 80, 4, baseZ - 50);
        addObj(mesh);
        // Roof
        mesh = makeMesh(new THREE.BoxGeometry(24, 3, 16), 0x707060);
        mesh.position.set(baseX + 80, 9.5, baseZ - 50);
        addObj(mesh);
        // Wing
        mesh = makeMesh(new THREE.BoxGeometry(10, 6, 10), 0xb8a888);
        mesh.position.set(baseX + 96, 3, baseZ - 50);
        addObj(mesh);
        // Wing roof
        mesh = makeMesh(new THREE.BoxGeometry(12, 2.5, 12), 0x707060);
        mesh.position.set(baseX + 96, 7.25, baseZ - 50);
        addObj(mesh);
        // Chimney
        mesh = makeMesh(new THREE.BoxGeometry(1.8, 4, 1.8), 0x888070);
        mesh.position.set(baseX + 76, 13, baseZ - 50);
        addObj(mesh);

        // Reed beds at tarn edge
        for (i = 0; i < 20; i++) {
            var reedX = (Math.random() - 0.5) * 160;
            var reedZ = (Math.random() - 0.5) * 110;
            var reedH = 1.5 + Math.random() * 1;
            mesh = makeMesh(new THREE.CylinderGeometry(0.15, 0.2, reedH, 4), 0x8a7848);
            mesh.position.set(baseX + reedX, reedH * 0.5, baseZ + reedZ);
            addObj(mesh);
        }
    }

    function buildDryStoneWalls() {
        var i, mesh;
        var baseX = 15400;
        var wallColor = 0xb8b0a0;

        // Network of dry stone walls across hillside — parallel and perpendicular runs
        var wallRuns = [
            // x, z, length, angle
            [0, -100, 120, 0],
            [0, -100, 80, Math.PI * 0.5],
            [120, -100, 80, Math.PI * 0.5],
            [-120, -100, 80, Math.PI * 0.5],
            [60, -20, 120, 0],
            [0, 60, 150, 0],
            [-60, 60, 80, Math.PI * 0.5],
            [90, 60, 80, Math.PI * 0.5],
            [0, 160, 130, 0],
            [65, 160, 80, Math.PI * 0.5],
            [-65, 140, 80, Math.PI * 0.5],
            [0, 320, 140, 0],
            [70, 320, 90, Math.PI * 0.5],
            [-70, 320, 90, Math.PI * 0.5],
            [0, 430, 130, 0]
        ];

        for (i = 0; i < wallRuns.length; i++) {
            var wr = wallRuns[i];
            var segments = Math.floor(wr[2] / 6);
            var j;
            for (j = 0; j < segments; j++) {
                var wx = wr[0] + (wr[3] === 0 ? -wr[2] * 0.5 + j * 6 + 3 : 0);
                var wz = wr[1] + (wr[3] !== 0 ? -wr[2] * 0.5 + j * 6 + 3 : 0);
                var wh = 1.0 + Math.random() * 0.4;
                mesh = makeMesh(new THREE.BoxGeometry(5.5, wh, 0.6), wallColor);
                mesh.position.set(baseX + wx, wh * 0.5, wz);
                mesh.rotation.y = wr[3];
                addObj(mesh);
            }
        }

        // Field barns — small grey stone buildings
        var barnPositions = [
            [40, 80], [-80, 120], [100, 200], [-40, 280],
            [120, 360], [-90, 380], [30, 440]
        ];
        for (i = 0; i < barnPositions.length; i++) {
            var bx = barnPositions[i][0];
            var bz = barnPositions[i][1];
            // Barn walls
            mesh = makeMesh(new THREE.BoxGeometry(8, 4.5, 5), 0xb0a890);
            mesh.position.set(baseX + bx, 2.25, bz);
            addObj(mesh);
            // Barn roof
            mesh = makeMesh(new THREE.BoxGeometry(9, 1.5, 6), 0x808070);
            mesh.position.set(baseX + bx, 5.25, bz);
            addObj(mesh);
        }

        // Stile posts at wall crossings
        var stilePositions = [
            [0, -100], [60, -20], [0, 60], [0, 160], [0, 320]
        ];
        for (i = 0; i < stilePositions.length; i++) {
            var sx = stilePositions[i][0];
            var sz = stilePositions[i][1];
            mesh = makeMesh(new THREE.BoxGeometry(0.3, 1.8, 0.3), 0x887060);
            mesh.position.set(baseX + sx - 1, 0.9, sz);
            addObj(mesh);
            mesh = makeMesh(new THREE.BoxGeometry(0.3, 1.8, 0.3), 0x887060);
            mesh.position.set(baseX + sx + 1, 0.9, sz);
            addObj(mesh);
            mesh = makeMesh(new THREE.BoxGeometry(2.5, 0.25, 0.25), 0xa08060);
            mesh.position.set(baseX + sx, 1.2, sz);
            addObj(mesh);
        }
    }

    function buildMalhamVillage() {
        var i, mesh;
        var baseX = 15400;
        var baseZ = 480;
        var stoneColor = 0xc8b898;
        var roofColor = 0x6a6858;

        // Limestone cottages — row along main street
        var cottages = [
            [-60, 0, 10, 6, 12],
            [-45, 0, 8, 5.5, 10],
            [-30, 0, 10, 6, 12],
            [30, 0, 9, 6, 11],
            [45, 0, 10, 5.5, 12],
            [60, 0, 9, 6, 11],
            [-60, 20, 10, 6, 10],
            [60, 20, 9, 5, 11]
        ];
        for (i = 0; i < cottages.length; i++) {
            var cx = cottages[i][0];
            var cz2 = cottages[i][1];
            var cw = cottages[i][2];
            var ch = cottages[i][3];
            var cd = cottages[i][4];
            // Walls
            mesh = makeMesh(new THREE.BoxGeometry(cw, ch, cd), stoneColor);
            mesh.position.set(baseX + cx, ch * 0.5, baseZ + cz2);
            addObj(mesh);
            // Roof
            mesh = makeMesh(new THREE.BoxGeometry(cw + 0.8, ch * 0.35, cd + 0.8), roofColor);
            mesh.position.set(baseX + cx, ch + ch * 0.175, baseZ + cz2);
            addObj(mesh);
            // Chimney
            mesh = makeMesh(new THREE.BoxGeometry(1.2, 2, 1.2), 0x908878);
            mesh.position.set(baseX + cx + cw * 0.3, ch + ch * 0.35 + 2, baseZ + cz2);
            addObj(mesh);
        }

        // Buck Inn pub — larger building, central
        mesh = makeMesh(new THREE.BoxGeometry(16, 7, 14), 0xd0c0a0);
        mesh.position.set(baseX, 3.5, baseZ - 5);
        addObj(mesh);
        mesh = makeMesh(new THREE.BoxGeometry(17, 2.5, 15), roofColor);
        mesh.position.set(baseX, 8.25, baseZ - 5);
        addObj(mesh);
        // Pub sign post
        mesh = makeMesh(new THREE.CylinderGeometry(0.15, 0.15, 4, 5), 0x5a4428);
        mesh.position.set(baseX - 10, 2, baseZ - 5);
        addObj(mesh);
        mesh = makeMesh(new THREE.BoxGeometry(2, 1.2, 0.2), 0xc8a040);
        mesh.position.set(baseX - 10, 4.6, baseZ - 5);
        addObj(mesh);

        // Packhorse bridge — arched stone bridge over beck
        // Bridge deck
        mesh = makeMesh(new THREE.BoxGeometry(22, 1, 4), stoneColor);
        mesh.position.set(baseX + 90, 1.8, baseZ + 10);
        addObj(mesh);
        // Bridge arch support left
        mesh = makeMesh(new THREE.BoxGeometry(3, 3.5, 4), stoneColor);
        mesh.position.set(baseX + 79, 1.75, baseZ + 10);
        addObj(mesh);
        // Bridge arch support right
        mesh = makeMesh(new THREE.BoxGeometry(3, 3.5, 4), stoneColor);
        mesh.position.set(baseX + 101, 1.75, baseZ + 10);
        addObj(mesh);
        // Beck water
        mesh = makeMesh(new THREE.BoxGeometry(30, 0.4, 6), 0x7ab8d0);
        mesh.position.set(baseX + 90, 0.3, baseZ + 10);
        addObj(mesh);
        // Parapet walls
        mesh = makeMesh(new THREE.BoxGeometry(22, 0.8, 0.5), stoneColor);
        mesh.position.set(baseX + 90, 2.7, baseZ + 8);
        addObj(mesh);
        mesh = makeMesh(new THREE.BoxGeometry(22, 0.8, 0.5), stoneColor);
        mesh.position.set(baseX + 90, 2.7, baseZ + 12);
        addObj(mesh);

        // Information centre
        mesh = makeMesh(new THREE.BoxGeometry(12, 5, 10), 0xb8b0a0);
        mesh.position.set(baseX - 80, 2.5, baseZ + 15);
        addObj(mesh);
        mesh = makeMesh(new THREE.BoxGeometry(13, 2, 11), roofColor);
        mesh.position.set(baseX - 80, 6, baseZ + 15);
        addObj(mesh);

        // Car park — flat tarmac area
        mesh = makeMesh(new THREE.BoxGeometry(40, 0.3, 30), 0x505050);
        mesh.position.set(baseX - 80, 0.2, baseZ + 40);
        addObj(mesh);
        // Car park wall / hedge
        mesh = makeMesh(new THREE.BoxGeometry(40, 1.2, 0.8), 0x708050);
        mesh.position.set(baseX - 80, 0.6, baseZ + 56);
        addObj(mesh);

        // Village green / grass area
        mesh = makeMesh(new THREE.BoxGeometry(50, 0.3, 30), 0x5a8040);
        mesh.position.set(baseX, 0.2, baseZ + 30);
        addObj(mesh);

        // Village road surface
        mesh = makeMesh(new THREE.BoxGeometry(8, 0.25, 140), 0x606060);
        mesh.position.set(baseX, 0.15, baseZ + 10);
        addObj(mesh);
    }

    function buildHillTerrain() {
        var i, mesh;
        var baseX = 15400;

        // Background moorland hills — large low boxes
        var hills = [
            [-250, -400, 180, 35, 200, 0x8a8070],
            [250, -380, 160, 30, 180, 0x909078],
            [0, -500, 220, 40, 160, 0x848070],
            [-300, -200, 120, 25, 140, 0x8a8278],
            [300, -200, 140, 28, 150, 0x888070],
            [-200, 400, 160, 30, 180, 0x7a7868],
            [200, 420, 140, 25, 160, 0x808070],
            [0, 500, 200, 35, 150, 0x7e7c6e]
        ];
        for (i = 0; i < hills.length; i++) {
            var h = hills[i];
            mesh = makeMesh(new THREE.BoxGeometry(h[2], h[3], h[4]), h[5]);
            mesh.position.set(baseX + h[0], h[3] * 0.5, h[1]);
            addObj(mesh);
        }

        // Ground plane for the area
        mesh = makeMesh(new THREE.BoxGeometry(700, 0.5, 900), 0x7a7a60);
        mesh.position.set(baseX, 0, 0);
        addObj(mesh);
    }

    function build() {
        buildHillTerrain();
        buildMalhamCove();
        buildGordaleScar();
        buildJanetsFoss();
        buildMalhamTarn();
        buildDryStoneWalls();
        buildMalhamVillage();
    }

    function update(delta) {
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
