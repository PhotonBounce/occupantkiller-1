window.DorkingBoxHill = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 6040;
    var OZ = 0;

    function addmesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function escarpment() {
        // 5 stacked stepped boxes forming chalk escarpment slope up to height 17
        var chalkMat = new THREE.MeshLambertMaterial({ color: 0xEEEBDA });
        var widths  = [50, 42, 34, 26, 18];
        var heights = [3,  3,  4,  4,   3];
        var depths  = [18, 15, 12,  9,   6];
        var yBase   = 0;
        for (var i = 0; i < 5; i++) {
            var geo = new THREE.BoxGeometry(widths[i], heights[i], depths[i]);
            var mesh = new THREE.Mesh(geo, chalkMat);
            mesh.position.set(OX + 0, yBase + heights[i] / 2, OZ - 40 - i * 6);
            yBase += heights[i];
            addmesh(mesh);
        }
    }

    function yewtrees() {
        // 4 dark green sphere yew trees on summit
        var yewMat = new THREE.MeshLambertMaterial({ color: 0x1A3A1A });
        var positions = [
            { x: -10, z: -78 },
            { x:  -3, z: -82 },
            { x:   5, z: -76 },
            { x:  12, z: -80 }
        ];
        for (var i = 0; i < 4; i++) {
            var trunkGeo = new THREE.BoxGeometry(0.5, 3, 0.5);
            var trunkMat = new THREE.MeshLambertMaterial({ color: 0x3B2A1A });
            var trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.set(OX + positions[i].x, 17 + 1.5, OZ + positions[i].z);
            addmesh(trunk);

            var geo = new THREE.SphereGeometry(2.5, 8, 8);
            var mesh = new THREE.Mesh(geo, yewMat);
            mesh.position.set(OX + positions[i].x, 17 + 4.5, OZ + positions[i].z);
            addmesh(mesh);
        }
    }

    function monument() {
        // Leopold Monument — stone obelisk box 1.5×1.5×8 + small cap
        var mat = new THREE.MeshLambertMaterial({ color: 0xCCBBAA });
        var shaft = new THREE.BoxGeometry(1.5, 8, 1.5);
        var shaftMesh = new THREE.Mesh(shaft, mat);
        shaftMesh.position.set(OX + 2, 17 + 4, OZ - 72);
        addmesh(shaftMesh);

        var cap = new THREE.BoxGeometry(1.0, 1.5, 1.0);
        var capMesh = new THREE.Mesh(cap, mat);
        capMesh.position.set(OX + 2, 17 + 8.75, OZ - 72);
        addmesh(capMesh);
    }

    function visitorcenter() {
        // Box Hill café / visitor center — 15×8×4, stone 0xCCBBAA
        var mat = new THREE.MeshLambertMaterial({ color: 0xCCBBAA });
        var geo = new THREE.BoxGeometry(15, 4, 8);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX - 8, 17 + 2, OZ - 65);
        addmesh(mesh);

        // Simple flat roof extension
        var roofGeo = new THREE.BoxGeometry(16, 0.4, 9);
        var roof = new THREE.Mesh(roofGeo, mat);
        roof.position.set(OX - 8, 17 + 4.2, OZ - 65);
        addmesh(roof);
    }

    function steppingstones() {
        // 8 flat disk stepping stones across River Mole, zigzag
        var mat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        for (var i = 0; i < 8; i++) {
            var geo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 12);
            var mesh = new THREE.Mesh(geo, mat);
            var xOff = (i % 2 === 0) ? -1.2 : 1.2;
            mesh.position.set(OX - 18 + i * 2.5 + xOff, 0.15, OZ + 8);
            addmesh(mesh);
        }
    }

    function rivermole() {
        // River Mole — blue channel flat box 40×0.3×5
        var mat = new THREE.MeshLambertMaterial({ color: 0x4477AA });
        var geo = new THREE.BoxGeometry(40, 0.3, 5);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX - 5, 0.0, OZ + 8);
        addmesh(mesh);
    }

    function highstreet() {
        // Dorking High Street — 3 rows of market town buildings
        var brickMat   = new THREE.MeshLambertMaterial({ color: 0x8B3A2A });
        var plasterMat = new THREE.MeshLambertMaterial({ color: 0xD4C49A });
        var rows = [
            { z: 20, count: 4 },
            { z: 30, count: 4 },
            { z: 25, count: 3 }
        ];
        for (var r = 0; r < rows.length; r++) {
            for (var i = 0; i < rows[r].count; i++) {
                var mat = (i % 2 === 0) ? brickMat : plasterMat;
                var geo = new THREE.BoxGeometry(8, 7, 6);
                var mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(OX - 20 + i * 10, 3.5, OZ + rows[r].z);
                addmesh(mesh);
            }
        }
    }

    function church() {
        // Dorking church St Martin — 20×12×8 + tower 5×5×18 + ConeGeometry spire
        var mat = new THREE.MeshLambertMaterial({ color: 0xBBB8A0 });

        var nave = new THREE.BoxGeometry(20, 8, 12);
        var naveMesh = new THREE.Mesh(nave, mat);
        naveMesh.position.set(OX + 20, 4, OZ + 22);
        addmesh(naveMesh);

        var tower = new THREE.BoxGeometry(5, 18, 5);
        var towerMesh = new THREE.Mesh(tower, mat);
        towerMesh.position.set(OX + 30, 9, OZ + 22);
        addmesh(towerMesh);

        var spireMat = new THREE.MeshLambertMaterial({ color: 0xBBB8A0 });
        var spireGeo = new THREE.ConeGeometry(4, 12, 8);
        var spireMesh = new THREE.Mesh(spireGeo, spireMat);
        spireMesh.position.set(OX + 30, 18 + 6, OZ + 22);
        addmesh(spireMesh);
    }

    function antiqueshops() {
        // 6 wonky-fronted antique shops with slight position offsets
        var mat = new THREE.MeshLambertMaterial({ color: 0xCC9944 });
        var basePositions = [
            { x: -5,  z: 40 },
            { x:  5,  z: 42 },
            { x: 15,  z: 39 },
            { x: 25,  z: 41 },
            { x: 35,  z: 40 },
            { x: 45,  z: 43 }
        ];
        var widths  = [6, 5, 7, 6, 5, 6];
        var heights = [5, 6, 5, 7, 5, 6];
        for (var i = 0; i < 6; i++) {
            var geo = new THREE.BoxGeometry(widths[i], heights[i], 5);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(OX + basePositions[i].x, heights[i] / 2, OZ + basePositions[i].z);
            addmesh(mesh);
        }
    }

    function signposts() {
        // 6 North Downs Way path markers: vertical post + horizontal arm
        var mat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var locs = [
            { x: -30, z: -20 },
            { x: -15, z: -35 },
            { x:   0, z: -50 },
            { x:  15, z: -60 },
            { x:  25, z: -45 },
            { x:  -5, z: -30 }
        ];
        for (var i = 0; i < 6; i++) {
            var postGeo = new THREE.BoxGeometry(0.2, 3, 0.2);
            var post = new THREE.Mesh(postGeo, mat);
            post.position.set(OX + locs[i].x, 1.5, OZ + locs[i].z);
            addmesh(post);

            var armGeo = new THREE.BoxGeometry(2, 0.2, 0.2);
            var arm = new THREE.Mesh(armGeo, mat);
            arm.position.set(OX + locs[i].x + 1, 3.1, OZ + locs[i].z);
            addmesh(arm);
        }
    }

    function cyclingroad() {
        // Cycling road — flat dark strip 40×0.2×4
        var roadMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var roadGeo = new THREE.BoxGeometry(40, 0.2, 4);
        var road = new THREE.Mesh(roadGeo, roadMat);
        road.position.set(OX - 5, 0.1, OZ - 10);
        addmesh(road);

        // 4 km marker posts
        var markerMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        for (var i = 0; i < 4; i++) {
            var postGeo = new THREE.BoxGeometry(0.25, 1.5, 0.25);
            var post = new THREE.Mesh(postGeo, markerMat);
            post.position.set(OX - 20 + i * 12, 0.75, OZ - 10);
            addmesh(post);

            var topGeo = new THREE.BoxGeometry(0.6, 0.4, 0.6);
            var top = new THREE.Mesh(topGeo, markerMat);
            top.position.set(OX - 20 + i * 12, 1.7, OZ - 10);
            addmesh(top);
        }
    }

    function build() {
        escarpment();
        yewtrees();
        monument();
        visitorcenter();
        rivermole();
        steppingstones();
        highstreet();
        church();
        antiqueshops();
        signposts();
        cyclingroad();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) { }

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
