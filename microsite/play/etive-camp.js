window.EtiveCamp = (function() {
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
        // Glen Etive valley walls (2 large box walls)
        var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var wallGeom1 = new THREE.BoxGeometry(80, 60, 8);
        var wall1 = new THREE.Mesh(wallGeom1, wallMaterial);
        wall1.position.set(-35, 20, -25);
        scene.add(wall1);
        objects.push(wall1);

        var wallGeom2 = new THREE.BoxGeometry(80, 60, 8);
        var wall2 = new THREE.Mesh(wallGeom2, wallMaterial);
        wall2.position.set(35, 20, 25);
        scene.add(wall2);
        objects.push(wall2);

        // Deer stalking hide - repurposed as sniper position (low box hide)
        var hideMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        var hideGeom = new THREE.BoxGeometry(12, 8, 10);
        var hide = new THREE.Mesh(hideGeom, hideMaterial);
        hide.position.set(-20, 2, -15);
        scene.add(hide);
        objects.push(hide);

        // Hide branches (LineSegments)
        var branchGeom = new THREE.BufferGeometry();
        var branchPositions = new Float32Array([
            -20, 8, -15, -18, 12, -13,
            -20, 8, -15, -22, 12, -17,
            -20, 8, -15, -24, 10, -15
        ]);
        branchGeom.setAttribute('position', new THREE.BufferAttribute(branchPositions, 3));
        var branchMaterial = new THREE.LineBasicMaterial({ color: 0x8b4513 });
        var branches = new THREE.LineSegments(branchGeom, branchMaterial);
        scene.add(branches);
        objects.push(branches);

        // Glen Etive road barrier (box barrier across track)
        var barrierMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var barrierGeom = new THREE.BoxGeometry(25, 5, 3);
        var barrier = new THREE.Mesh(barrierGeom, barrierMaterial);
        barrier.position.set(0, 1, -28);
        scene.add(barrier);
        objects.push(barrier);

        // Road ambush IED (sphere)
        var iedMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var iedGeom = new THREE.SphereGeometry(2.5, 8, 8);
        var ied = new THREE.Mesh(iedGeom, iedMaterial);
        ied.position.set(0, 0.5, -26);
        scene.add(ied);
        objects.push(ied);

        // Shepherd bothy base (box cottage)
        var bothyMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var bothyGeom = new THREE.BoxGeometry(16, 10, 14);
        var bothy = new THREE.Mesh(bothyGeom, bothyMaterial);
        bothy.position.set(15, 3, 5);
        scene.add(bothy);
        objects.push(bothy);

        // Bothy turf roof (cone)
        var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        var roofGeom = new THREE.ConeGeometry(9, 8, 6);
        var roof = new THREE.Mesh(roofGeom, roofMaterial);
        roof.position.set(15, 13, 5);
        scene.add(roof);
        objects.push(roof);

        // Hillside drainage ditch (long narrow box trench)
        var trenchMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var trenchGeom = new THREE.BoxGeometry(50, 4, 2);
        var trench = new THREE.Mesh(trenchGeom, trenchMaterial);
        trench.position.set(0, 0.5, 18);
        scene.add(trench);
        objects.push(trench);

        // Waterfall cliff observation post (box platform)
        var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var platformGeom = new THREE.BoxGeometry(8, 3, 8);
        var platform = new THREE.Mesh(platformGeom, platformMaterial);
        platform.position.set(25, 45, -8);
        scene.add(platform);
        objects.push(platform);

        // Waterfall cylinder post
        var waterfallMaterial = new THREE.MeshLambertMaterial({ color: 0x4da6ff });
        var waterfallGeom = new THREE.CylinderGeometry(3, 3.5, 50, 16);
        var waterfall = new THREE.Mesh(waterfallGeom, waterfallMaterial);
        waterfall.position.set(25, 20, -8);
        scene.add(waterfall);
        objects.push(waterfall);

        // Supply cache ruins (box ruin walls - 4 walls)
        var ruinMaterial = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var ruinGeom = new THREE.BoxGeometry(3, 7, 12);
        var ruin1 = new THREE.Mesh(ruinGeom, ruinMaterial);
        ruin1.position.set(-25, 2, 12);
        scene.add(ruin1);
        objects.push(ruin1);

        var ruin2 = new THREE.Mesh(ruinGeom, ruinMaterial);
        ruin2.position.set(-15, 2, 12);
        scene.add(ruin2);
        objects.push(ruin2);

        // Supply cache sphere
        var cacheMaterial = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var cacheGeom = new THREE.SphereGeometry(3, 8, 8);
        var cache = new THREE.Mesh(cacheGeom, cacheMaterial);
        cache.position.set(-20, 5, 12);
        scene.add(cache);
        objects.push(cache);

        // Star-navigation night ops marker (sphere constellation - arrange overhead)
        var starMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
        var starGeom = new THREE.SphereGeometry(1.2, 6, 6);

        var star1 = new THREE.Mesh(starGeom, starMaterial);
        star1.position.set(-15, 50, -5);
        scene.add(star1);
        objects.push(star1);

        var star2 = new THREE.Mesh(starGeom, starMaterial);
        star2.position.set(5, 52, 0);
        scene.add(star2);
        objects.push(star2);

        var star3 = new THREE.Mesh(starGeom, starMaterial);
        star3.position.set(20, 48, 8);
        scene.add(star3);
        objects.push(star3);

        var star4 = new THREE.Mesh(starGeom, starMaterial);
        star4.position.set(-5, 55, 15);
        scene.add(star4);
        objects.push(star4);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 40, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate star markers (gentle rotation)
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.y > 45) {
                objects[i].rotation.y += 0.5 * delta;
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
