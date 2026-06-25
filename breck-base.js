window.BreckBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        // Sandy dune berm perimeter - stacked box earth walls
        var bermGeom1 = new THREE.BoxGeometry(60, 2, 4);
        var bermMat1 = new THREE.MeshLambertMaterial({ color: 0xc9a876 });
        var berm1 = new THREE.Mesh(bermGeom1, bermMat1);
        berm1.position.set(0, 1, -28);
        scene.add(berm1);
        objects.push(berm1);

        var bermGeom2 = new THREE.BoxGeometry(60, 2, 4);
        var bermMat2 = new THREE.MeshLambertMaterial({ color: 0xb8956a });
        var berm2 = new THREE.Mesh(bermGeom2, bermMat2);
        berm2.position.set(0, 1, 28);
        scene.add(berm2);
        objects.push(berm2);

        var bermGeom3 = new THREE.BoxGeometry(4, 2, 60);
        var bermMat3 = new THREE.MeshLambertMaterial({ color: 0xc9a876 });
        var berm3 = new THREE.Mesh(bermGeom3, bermMat3);
        berm3.position.set(-28, 1, 0);
        scene.add(berm3);
        objects.push(berm3);

        // Nissen hut barracks - cylinder half-buried + box end walls
        var nissenGeom = new THREE.CylinderGeometry(8, 8, 16, 32);
        var nissenMat = new THREE.MeshLambertMaterial({ color: 0x4a4a3a });
        var nissen = new THREE.Mesh(nissenGeom, nissenMat);
        nissen.position.set(-15, 4, -10);
        nissen.rotation.z = Math.PI / 2;
        scene.add(nissen);
        objects.push(nissen);

        var endWallGeom = new THREE.BoxGeometry(3, 8, 16);
        var endWallMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
        var endWall1 = new THREE.Mesh(endWallGeom, endWallMat);
        endWall1.position.set(-22, 4, -10);
        scene.add(endWall1);
        objects.push(endWall1);

        var endWall2 = new THREE.Mesh(endWallGeom, endWallMat);
        endWall2.position.set(-8, 4, -10);
        scene.add(endWall2);
        objects.push(endWall2);

        // Heathland fire observation tower - box floors stacked with cone cap
        var towerFloor1Geom = new THREE.BoxGeometry(6, 1, 6);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var towerFloor1 = new THREE.Mesh(towerFloor1Geom, towerMat);
        towerFloor1.position.set(20, 1, 15);
        scene.add(towerFloor1);
        objects.push(towerFloor1);

        var towerFloor2 = new THREE.Mesh(towerFloor1Geom, towerMat);
        towerFloor2.position.set(20, 5, 15);
        scene.add(towerFloor2);
        objects.push(towerFloor2);

        var towerFloor3 = new THREE.Mesh(towerFloor1Geom, towerMat);
        towerFloor3.position.set(20, 9, 15);
        scene.add(towerFloor3);
        objects.push(towerFloor3);

        var towerCapGeom = new THREE.ConeGeometry(5, 4, 32);
        var towerCapMat = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var towerCap = new THREE.Mesh(towerCapGeom, towerCapMat);
        towerCap.position.set(20, 12, 15);
        scene.add(towerCap);
        objects.push(towerCap);

        // Flint wall bunker - box with irregular LineSegments flint texture
        var bunkerGeom = new THREE.BoxGeometry(12, 6, 8);
        var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
        bunker.position.set(-5, 3, 20);
        scene.add(bunker);
        objects.push(bunker);

        var flintPoints = [
            new THREE.Vector3(-8, 5, 20),
            new THREE.Vector3(-2, 8, 20),
            new THREE.Vector3(4, 6, 20),
            new THREE.Vector3(-6, 3, 20),
            new THREE.Vector3(0, 2, 20),
            new THREE.Vector3(-8, 5, 20)
        ];
        var flintGeom = new THREE.BufferGeometry();
        flintGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(
            flintPoints.flatMap(p => [p.x, p.y, p.z])
        ), 3));
        var flintMat = new THREE.LineBasicMaterial({ color: 0xffffff });
        var flintLines = new THREE.LineSegments(flintGeom, flintMat);
        scene.add(flintLines);
        objects.push(flintLines);

        // Rabbit warren ammunition tunnel entrance - sphere mound with box hatch
        var moundGeom = new THREE.SphereGeometry(7, 16, 16);
        var moundMat = new THREE.MeshLambertMaterial({ color: 0x9d8659 });
        var mound = new THREE.Mesh(moundGeom, moundMat);
        mound.position.set(15, 3.5, -5);
        mound.scale.y = 0.6;
        scene.add(mound);
        objects.push(mound);

        var hatchGeom = new THREE.BoxGeometry(4, 0.5, 5);
        var hatchMat = new THREE.MeshLambertMaterial({ color: 0x3a3a2a });
        var hatch = new THREE.Mesh(hatchGeom, hatchMat);
        hatch.position.set(15, 5.5, -5);
        scene.add(hatch);
        objects.push(hatch);

        // Gorse camouflage net - sphere bushes + LineSegments mesh
        var gorseGeom = new THREE.SphereGeometry(5, 12, 12);
        var gorseMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var gorse1 = new THREE.Mesh(gorseGeom, gorseMat);
        gorse1.position.set(5, 2.5, 10);
        scene.add(gorse1);
        objects.push(gorse1);

        var gorse2 = new THREE.Mesh(gorseGeom, gorseMat);
        gorse2.position.set(12, 2.5, 5);
        scene.add(gorse2);
        objects.push(gorse2);

        var netPoints = [
            new THREE.Vector3(2, 6, 10),
            new THREE.Vector3(8, 6, 10),
            new THREE.Vector3(14, 6, 5),
            new THREE.Vector3(2, 6, 10)
        ];
        var netGeom = new THREE.BufferGeometry();
        netGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(
            netPoints.flatMap(p => [p.x, p.y, p.z])
        ), 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x6b8e23 });
        var netLines = new THREE.LineSegments(netGeom, netMat);
        scene.add(netLines);
        objects.push(netLines);

        // Radio relay post - cylinder mast + sphere dish + LineSegments wire stays
        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 20, 16);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0xaa8844 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(-20, 10, -20);
        scene.add(mast);
        objects.push(mast);

        var dishGeom = new THREE.SphereGeometry(3, 16, 16);
        var dishMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var dish = new THREE.Mesh(dishGeom, dishMat);
        dish.position.set(-20, 18, -20);
        dish.scale.set(1, 0.3, 1);
        scene.add(dish);
        objects.push(dish);

        var stayPoints = [
            new THREE.Vector3(-20, 18, -20),
            new THREE.Vector3(-25, 5, -15),
            new THREE.Vector3(-15, 5, -25),
            new THREE.Vector3(-20, 18, -20)
        ];
        var stayGeom = new THREE.BufferGeometry();
        stayGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(
            stayPoints.flatMap(p => [p.x, p.y, p.z])
        ), 3));
        var stayMat = new THREE.LineBasicMaterial({ color: 0x888888 });
        var stayLines = new THREE.LineSegments(stayGeom, stayMat);
        scene.add(stayLines);
        objects.push(stayLines);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 30, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation loop placeholder
        if (mast) {
            // Can add animation here if needed
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
