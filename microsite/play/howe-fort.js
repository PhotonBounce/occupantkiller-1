window.HoweFort = (function() {
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
        buildFort();
    }

    function buildFort() {
        // Main burial mound - large sphere
        var moundGeom = new THREE.SphereGeometry(25, 32, 32);
        var moundMat = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
        var mound = new THREE.Mesh(moundGeom, moundMat);
        mound.position.set(0, 12, 0);
        scene.add(mound);
        objects.push(mound);

        // Stone cist weapons cache - box chamber exposed on north slope
        var cistGeom = new THREE.BoxGeometry(8, 6, 12);
        var cistMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var cist = new THREE.Mesh(cistGeom, cistMat);
        cist.position.set(5, 8, -20);
        cist.rotation.z = 0.1;
        scene.add(cist);
        objects.push(cist);

        // Ring ditch perimeter - LineSegments outline circle
        var ditchGeom = new THREE.BufferGeometry();
        var ditchPoints = [];
        var ditchRadius = 35;
        var ditchSegments = 48;
        for (var i = 0; i <= ditchSegments; i++) {
            var angle = (i / ditchSegments) * Math.PI * 2;
            ditchPoints.push(
                ditchRadius * Math.cos(angle),
                0.5,
                ditchRadius * Math.sin(angle)
            );
        }
        ditchGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ditchPoints), 3));
        var ditchMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a });
        var ditchLine = new THREE.LineSegments(ditchGeom, ditchMat);
        scene.add(ditchLine);
        objects.push(ditchLine);

        // Standing stone marker - north
        var stoneNGeom = new THREE.BoxGeometry(1.5, 8, 1.5);
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var stoneN = new THREE.Mesh(stoneNGeom, stoneMat);
        stoneN.position.set(0, 4, -32);
        scene.add(stoneN);
        objects.push(stoneN);

        // Standing stone marker - south
        var stoneSGeom = new THREE.BoxGeometry(1.5, 8, 1.5);
        var stoneS = new THREE.Mesh(stoneSGeom, stoneMat);
        stoneS.position.set(0, 4, 32);
        scene.add(stoneS);
        objects.push(stoneS);

        // Standing stone marker - east
        var stoneEGeom = new THREE.BoxGeometry(1.5, 8, 1.5);
        var stoneE = new THREE.Mesh(stoneEGeom, stoneMat);
        stoneE.position.set(32, 4, 0);
        scene.add(stoneE);
        objects.push(stoneE);

        // Standing stone marker - west
        var stoneWGeom = new THREE.BoxGeometry(1.5, 8, 1.5);
        var stoneW = new THREE.Mesh(stoneWGeom, stoneMat);
        stoneW.position.set(-32, 4, 0);
        scene.add(stoneW);
        objects.push(stoneW);

        // Machine gun nest emplacement - box dug into mound flank (east)
        var mgGeom = new THREE.BoxGeometry(6, 4, 10);
        var mgMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var mgNest = new THREE.Mesh(mgGeom, mgMat);
        mgNest.position.set(18, 6, 8);
        mgNest.rotation.y = 0.3;
        scene.add(mgNest);
        objects.push(mgNest);

        // Barrow entrance passage - tunnel entrance box
        var entranceGeom = new THREE.BoxGeometry(4, 3.5, 8);
        var entranceMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var entrance = new THREE.Mesh(entranceGeom, entranceMat);
        entrance.position.set(-10, 2, -15);
        scene.add(entrance);
        objects.push(entrance);

        // Antenna mast cylinder - pole on summit
        var mastGeom = new THREE.CylinderGeometry(0.4, 0.4, 18, 16);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(0, 28, 0);
        scene.add(mast);
        objects.push(mast);

        // Radar dish - sphere on top of antenna
        var dishGeom = new THREE.SphereGeometry(2, 16, 16);
        var dishMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var dish = new THREE.Mesh(dishGeom, dishMat);
        dish.position.set(0, 37, 0);
        scene.add(dish);
        objects.push(dish);

        // Secondary buried chamber - smaller box west of cist
        var chamber2Geom = new THREE.BoxGeometry(6, 4, 9);
        var chamber2Mat = new THREE.MeshLambertMaterial({ color: 0x707070 });
        var chamber2 = new THREE.Mesh(chamber2Geom, chamber2Mat);
        chamber2.position.set(-15, 5, -12);
        scene.add(chamber2);
        objects.push(chamber2);

        // Third stone marker - northeast
        var stoneNEGeom = new THREE.BoxGeometry(1.2, 7, 1.2);
        var stoneNE = new THREE.Mesh(stoneNEGeom, stoneMat);
        stoneNE.position.set(22, 3.5, -22);
        scene.add(stoneNE);
        objects.push(stoneNE);

        // Fourth stone marker - southwest
        var stoneSWGeom = new THREE.BoxGeometry(1.2, 7, 1.2);
        var stoneSW = new THREE.Mesh(stoneSWGeom, stoneMat);
        stoneSW.position.set(-22, 3.5, 22);
        scene.add(stoneSW);
        objects.push(stoneSW);

        // Auxiliary barrow mound - smaller sphere to southeast
        var auxMoundGeom = new THREE.SphereGeometry(10, 24, 24);
        var auxMoundMat = new THREE.MeshLambertMaterial({ color: 0x454545 });
        var auxMound = new THREE.Mesh(auxMoundGeom, auxMoundMat);
        auxMound.position.set(20, 5, 18);
        scene.add(auxMound);
        objects.push(auxMound);

        // Defensive cone structure - lookout post on rim
        var coneGeom = new THREE.ConeGeometry(3, 5, 12);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0x595959 });
        var cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.set(-25, 8, 10);
        scene.add(cone);
        objects.push(cone);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light from above
        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(15, 30, 15);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Optional animation - slowly rotate antenna
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry.type === 'CylinderGeometry') {
                objects[i].rotation.y += delta * 0.3;
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
