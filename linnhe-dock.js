window.LinnheDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        // Deep sea loch box shoreline
        var shoreGeom = new THREE.BoxGeometry(80, 5, 40);
        var shoreMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var shore = new THREE.Mesh(shoreGeom, shoreMat);
        shore.position.set(0, -8, 0);
        scene.add(shore);
        objects.push(shore);

        // Frigate berth - hull
        var hullGeom = new THREE.BoxGeometry(25, 8, 6);
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x2c4563 });
        var hull = new THREE.Mesh(hullGeom, hullMat);
        hull.position.set(-15, 0, -15);
        scene.add(hull);
        objects.push(hull);

        // Frigate berth - funnel 1
        var funnelGeom1 = new THREE.CylinderGeometry(2, 2, 12, 8);
        var funnelMat1 = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var funnel1 = new THREE.Mesh(funnelGeom1, funnelMat1);
        funnel1.position.set(-20, 8, -15);
        scene.add(funnel1);
        objects.push(funnel1);

        // Frigate berth - funnel 2
        var funnelGeom2 = new THREE.CylinderGeometry(2, 2, 12, 8);
        var funnelMat2 = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var funnel2 = new THREE.Mesh(funnelGeom2, funnelMat2);
        funnel2.position.set(-10, 8, -15);
        scene.add(funnel2);
        objects.push(funnel2);

        // Frigate berth - superstructure
        var superGeom = new THREE.BoxGeometry(8, 10, 5);
        var superMat = new THREE.MeshLambertMaterial({ color: 0x3a5a7a });
        var superstructure = new THREE.Mesh(superGeom, superMat);
        superstructure.position.set(-12, 12, -16);
        scene.add(superstructure);
        objects.push(superstructure);

        // Naval gun emplacement - mount
        var gunMountGeom = new THREE.BoxGeometry(6, 3, 8);
        var gunMountMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var gunMount = new THREE.Mesh(gunMountGeom, gunMountMat);
        gunMount.position.set(20, 2, -20);
        scene.add(gunMount);
        objects.push(gunMount);

        // Naval gun emplacement - barrel
        var barrelGeom = new THREE.CylinderGeometry(1, 1, 20, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.rotation.z = Math.PI / 6;
        barrel.position.set(20, 6, -10);
        scene.add(barrel);
        objects.push(barrel);

        // Torpedo tube battery - mount
        var torpMountGeom = new THREE.BoxGeometry(5, 2, 6);
        var torpMountMat = new THREE.MeshLambertMaterial({ color: 0x4a5a6a });
        var torpMount = new THREE.Mesh(torpMountGeom, torpMountMat);
        torpMount.position.set(15, 1, 10);
        scene.add(torpMount);
        objects.push(torpMount);

        // Torpedo tube battery - tubes
        var tube1Geom = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
        var tubeMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        var tube1 = new THREE.Mesh(tube1Geom, tubeMat);
        tube1.rotation.z = Math.PI / 2;
        tube1.position.set(12, 2, 10);
        scene.add(tube1);
        objects.push(tube1);

        var tube2 = new THREE.Mesh(tube1Geom, tubeMat);
        tube2.rotation.z = Math.PI / 2;
        tube2.position.set(18, 2, 10);
        scene.add(tube2);
        objects.push(tube2);

        // Fuel barge mooring - hull
        var bargeGeom = new THREE.BoxGeometry(12, 5, 8);
        var bargeMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var barge = new THREE.Mesh(bargeGeom, bargeMat);
        barge.position.set(-25, 1, 15);
        scene.add(barge);
        objects.push(barge);

        // Fuel barge mooring - tank
        var tankGeom = new THREE.CylinderGeometry(3, 3, 10, 16);
        var tankMat = new THREE.MeshLambertMaterial({ color: 0xaa6633 });
        var tank = new THREE.Mesh(tankGeom, tankMat);
        tank.rotation.z = Math.PI / 2;
        tank.position.set(-25, 4, 15);
        scene.add(tank);
        objects.push(tank);

        // Sea-boom defence barrier - boom (LineSegments)
        var boomGeom = new THREE.BufferGeometry();
        var boomPoints = [
            new THREE.Vector3(-40, 0, 20),
            new THREE.Vector3(40, 0, 20)
        ];
        boomGeom.setFromPoints(boomPoints);
        var boomMat = new THREE.LineBasicMaterial({ color: 0xffaa00, linewidth: 3 });
        var boom = new THREE.LineSegments(boomGeom, boomMat);
        scene.add(boom);
        objects.push(boom);

        // Sea-boom defence barrier - floats
        var floatGeom = new THREE.CylinderGeometry(1.5, 1.5, 2, 8);
        var floatMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var float1 = new THREE.Mesh(floatGeom, floatMat);
        float1.position.set(-30, 1, 20);
        scene.add(float1);
        objects.push(float1);

        var float2 = new THREE.Mesh(floatGeom, floatMat);
        float2.position.set(0, 1, 20);
        scene.add(float2);
        objects.push(float2);

        var float3 = new THREE.Mesh(floatGeom, floatMat);
        float3.position.set(30, 1, 20);
        scene.add(float3);
        objects.push(float3);

        // Naval command post - building
        var cmdGeom = new THREE.BoxGeometry(8, 8, 8);
        var cmdMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var cmdPost = new THREE.Mesh(cmdGeom, cmdMat);
        cmdPost.position.set(25, 5, 5);
        scene.add(cmdPost);
        objects.push(cmdPost);

        // Naval command post - radar mast
        var radarGeom = new THREE.CylinderGeometry(1, 1, 18, 8);
        var radarMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var radarMast = new THREE.Mesh(radarGeom, radarMat);
        radarMast.position.set(25, 14, 5);
        scene.add(radarMast);
        objects.push(radarMast);

        // Anti-submarine net winch - winch
        var winchGeom = new THREE.BoxGeometry(6, 4, 6);
        var winchMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var winch = new THREE.Mesh(winchGeom, winchMat);
        winch.position.set(-30, 2, -5);
        scene.add(winch);
        objects.push(winch);

        // Anti-submarine net winch - net cables (LineSegments)
        var netGeom = new THREE.BufferGeometry();
        var netPoints = [
            new THREE.Vector3(-30, 5, -5),
            new THREE.Vector3(-30, 0.5, -25),
            new THREE.Vector3(-30, 5, -5),
            new THREE.Vector3(-25, 0.5, -25),
            new THREE.Vector3(-30, 5, -5),
            new THREE.Vector3(-35, 0.5, -25)
        ];
        netGeom.setFromPoints(netPoints);
        var netMat = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
        var netCables = new THREE.LineSegments(netGeom, netMat);
        scene.add(netCables);
        objects.push(netCables);

        // Add lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate radar mast rotation
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i].geometry && objects[i].geometry.type === 'CylinderGeometry') {
                    if (objects[i].position.x === 25 && objects[i].position.y === 14) {
                        objects[i].rotation.y += delta * 0.5;
                    }
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
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
