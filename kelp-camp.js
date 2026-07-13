window.KelpCamp = (function() {
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
        // Kelp drying racks - main feature
        // Rack 1: vertical poles with rope lines
        var pole1Material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 12), pole1Material);
        pole1.position.set(-25, 4, -20);
        scene.add(pole1);
        objects.push(pole1);

        var pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 12), pole1Material);
        pole2.position.set(-15, 4, -20);
        scene.add(pole2);
        objects.push(pole2);

        var pole3 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 12), pole1Material);
        pole3.position.set(-25, 4, -10);
        scene.add(pole3);
        objects.push(pole3);

        var pole4 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 12), pole1Material);
        pole4.position.set(-15, 4, -10);
        scene.add(pole4);
        objects.push(pole4);

        // Rope lines between poles - using LineSegments
        var ropeGeometry = new THREE.BufferGeometry();
        var ropePositions = new Float32Array([
            -25, 7, -20, -15, 7, -20,
            -25, 7, -10, -15, 7, -10,
            -25, 5, -20, -25, 5, -10,
            -15, 5, -20, -15, 5, -10
        ]);
        ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropePositions, 3));
        var ropeMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        var ropeLines = new THREE.LineSegments(ropeGeometry, ropeMaterial);
        scene.add(ropeLines);
        objects.push(ropeLines);

        // Second kelp drying rack
        var pole5 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 12), pole1Material);
        pole5.position.set(5, 4, -20);
        scene.add(pole5);
        objects.push(pole5);

        var pole6 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 12), pole1Material);
        pole6.position.set(15, 4, -20);
        scene.add(pole6);
        objects.push(pole6);

        var pole7 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 12), pole1Material);
        pole7.position.set(5, 4, -10);
        scene.add(pole7);
        objects.push(pole7);

        var pole8 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 12), pole1Material);
        pole8.position.set(15, 4, -10);
        scene.add(pole8);
        objects.push(pole8);

        // Seaweed processing shed - rectangular structure
        var shedWallMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var shedWall1 = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 0.5), shedWallMaterial);
        shedWall1.position.set(20, 3, 5);
        scene.add(shedWall1);
        objects.push(shedWall1);

        var shedWall2 = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 0.5), shedWallMaterial);
        shedWall2.position.set(20, 3, 15);
        scene.add(shedWall2);
        objects.push(shedWall2);

        var shedWall3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 10), shedWallMaterial);
        shedWall3.position.set(14, 3, 10);
        scene.add(shedWall3);
        objects.push(shedWall3);

        var shedWall4 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6, 10), shedWallMaterial);
        shedWall4.position.set(26, 3, 10);
        scene.add(shedWall4);
        objects.push(shedWall4);

        var shedRoof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 10), new THREE.MeshLambertMaterial({ color: 0x8B0000 }));
        shedRoof.position.set(20, 6.5, 10);
        scene.add(shedRoof);
        objects.push(shedRoof);

        // Kelp bale stacks - arranged storage
        var baleMaterial = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
        var bale1 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), baleMaterial);
        bale1.position.set(-30, 1, 10);
        scene.add(bale1);
        objects.push(bale1);

        var bale2 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), baleMaterial);
        bale2.position.set(-30, 3.5, 10);
        scene.add(bale2);
        objects.push(bale2);

        var bale3 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), baleMaterial);
        bale3.position.set(-24, 1, 10);
        scene.add(bale3);
        objects.push(bale3);

        var bale4 = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), baleMaterial);
        bale4.position.set(-24, 3.5, 10);
        scene.add(bale4);
        objects.push(bale4);

        // Tidal pool collection area - circular basin
        var poolEdge = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1, 32), new THREE.MeshLambertMaterial({ color: 0x4169E1 }));
        poolEdge.position.set(5, 0.5, 20);
        scene.add(poolEdge);
        objects.push(poolEdge);

        var poolWater = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.5, 0.5, 32), new THREE.MeshLambertMaterial({ color: 0x1E90FF }));
        poolWater.position.set(5, 0.8, 20);
        scene.add(poolWater);
        objects.push(poolWater);

        // Coastal watchtower - tall conical structure
        var towerBase = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 2, 16), new THREE.MeshLambertMaterial({ color: 0xA0522D }));
        towerBase.position.set(25, 1, 25);
        scene.add(towerBase);
        objects.push(towerBase);

        var towerPole = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 12, 12), new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
        towerPole.position.set(25, 6.5, 25);
        scene.add(towerPole);
        objects.push(towerPole);

        var towerTop = new THREE.Mesh(new THREE.ConeGeometry(3, 4, 16), new THREE.MeshLambertMaterial({ color: 0xFF4500 }));
        towerTop.position.set(25, 12, 25);
        scene.add(towerTop);
        objects.push(towerTop);

        // Equipment spheres - buoys and floats
        var buoyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var buoy1 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), buoyMaterial);
        buoy1.position.set(-20, 1, 25);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), buoyMaterial);
        buoy2.position.set(-10, 1, 28);
        scene.add(buoy2);
        objects.push(buoy2);

        var buoy3 = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), new THREE.MeshLambertMaterial({ color: 0xFF6347 }));
        buoy3.position.set(0, 1, 25);
        scene.add(buoy3);
        objects.push(buoy3);

        // Ground platform area
        var platform = new THREE.Mesh(new THREE.BoxGeometry(60, 0.5, 60), new THREE.MeshLambertMaterial({ color: 0x8B7765 }));
        platform.position.set(0, -0.25, 0);
        scene.add(platform);
        objects.push(platform);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 20, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation placeholder
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
