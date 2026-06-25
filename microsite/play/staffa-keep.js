window.StaffaKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Hexagonal basalt column box terrain - dark gray blocks in column formation
        var terrainGeometry1 = new THREE.BoxGeometry(8, 12, 8);
        var terrainMaterial1 = new THREE.MeshLambertMaterial({color: 0x333333});
        var terrain1 = new THREE.Mesh(terrainGeometry1, terrainMaterial1);
        terrain1.position.set(-25, 6, -20);
        scene.add(terrain1);
        objects.push(terrain1);

        var terrainGeometry2 = new THREE.BoxGeometry(8, 14, 8);
        var terrainMaterial2 = new THREE.MeshLambertMaterial({color: 0x2a2a2a});
        var terrain2 = new THREE.Mesh(terrainGeometry2, terrainMaterial2);
        terrain2.position.set(-10, 7, -25);
        scene.add(terrain2);
        objects.push(terrain2);

        var terrainGeometry3 = new THREE.BoxGeometry(8, 10, 8);
        var terrainMaterial3 = new THREE.MeshLambertMaterial({color: 0x3a3a3a});
        var terrain3 = new THREE.Mesh(terrainGeometry3, terrainMaterial3);
        terrain3.position.set(5, 5, -15);
        scene.add(terrain3);
        objects.push(terrain3);

        // Fingal's Cave command post - box cave mouth
        var caveGeometry = new THREE.BoxGeometry(20, 12, 6);
        var caveMaterial = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
        var cave = new THREE.Mesh(caveGeometry, caveMaterial);
        cave.position.set(0, 6, -28);
        scene.add(cave);
        objects.push(cave);

        // Fingal's Cave pillars - cylinder basalt column pillars
        var pillarGeometry1 = new THREE.CylinderGeometry(2, 2.2, 14, 6);
        var pillarMaterial = new THREE.MeshLambertMaterial({color: 0x2d2d2d});
        var pillar1 = new THREE.Mesh(pillarGeometry1, pillarMaterial);
        pillar1.position.set(-8, 7, -28);
        scene.add(pillar1);
        objects.push(pillar1);

        var pillarGeometry2 = new THREE.CylinderGeometry(2, 2.2, 14, 6);
        var pillar2 = new THREE.Mesh(pillarGeometry2, pillarMaterial);
        pillar2.position.set(8, 7, -28);
        scene.add(pillar2);
        objects.push(pillar2);

        // Clifftop naval observation tower - cylinder stone tower
        var towerGeometry = new THREE.CylinderGeometry(4, 4.5, 25, 8);
        var towerMaterial = new THREE.MeshLambertMaterial({color: 0x404040});
        var tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.set(20, 12.5, 15);
        scene.add(tower);
        objects.push(tower);

        // Tower crenelated top - box
        var crenelGeometry = new THREE.BoxGeometry(10, 3, 10);
        var crenelMaterial = new THREE.MeshLambertMaterial({color: 0x353535});
        var crenel = new THREE.Mesh(crenelGeometry, crenelMaterial);
        crenel.position.set(20, 27, 15);
        scene.add(crenel);
        objects.push(crenel);

        // Tower lookout cap - cone
        var coneGeometry = new THREE.ConeGeometry(5, 4, 8);
        var coneMaterial = new THREE.MeshLambertMaterial({color: 0x2f2f2f});
        var coneCap = new THREE.Mesh(coneGeometry, coneMaterial);
        coneCap.position.set(20, 30, 15);
        scene.add(coneCap);
        objects.push(coneCap);

        // Underwater cave weapons cache - box submerged cave entrance
        var cacheGeometry = new THREE.BoxGeometry(12, 8, 5);
        var cacheMaterial = new THREE.MeshLambertMaterial({color: 0x0a0a0a});
        var cache = new THREE.Mesh(cacheGeometry, cacheMaterial);
        cache.position.set(-15, -8, 20);
        scene.add(cache);
        objects.push(cache);

        // Supply pods - sphere
        var podGeometry1 = new THREE.SphereGeometry(2.5, 8, 8);
        var podMaterial = new THREE.MeshLambertMaterial({color: 0x4a4a4a});
        var pod1 = new THREE.Mesh(podGeometry1, podMaterial);
        pod1.position.set(-20, -6, 22);
        scene.add(pod1);
        objects.push(pod1);

        var podGeometry2 = new THREE.SphereGeometry(2.5, 8, 8);
        var pod2 = new THREE.Mesh(podGeometry2, podMaterial);
        pod2.position.set(-10, -7, 18);
        scene.add(pod2);
        objects.push(pod2);

        // Basalt column firing positions - cylinder column stacks as cover
        var stackGeometry = new THREE.CylinderGeometry(3, 3.2, 8, 6);
        var stackMaterial = new THREE.MeshLambertMaterial({color: 0x383838});
        var stack1 = new THREE.Mesh(stackGeometry, stackMaterial);
        stack1.position.set(15, 4, -10);
        scene.add(stack1);
        objects.push(stack1);

        // Sniper nest on stack - box
        var nestGeometry = new THREE.BoxGeometry(6, 2, 6);
        var nestMaterial = new THREE.MeshLambertMaterial({color: 0x2b2b2b});
        var nest = new THREE.Mesh(nestGeometry, nestMaterial);
        nest.position.set(15, 10, -10);
        scene.add(nest);
        objects.push(nest);

        // Emergency helicopter landing pad - box flat rooftop
        var padGeometry = new THREE.BoxGeometry(18, 1, 18);
        var padMaterial = new THREE.MeshLambertMaterial({color: 0x454545});
        var pad = new THREE.Mesh(padGeometry, padMaterial);
        pad.position.set(-5, 20, 5);
        scene.add(pad);
        objects.push(pad);

        // H marking on pad - LineSegments
        var points = [];
        points.push(new THREE.Vector3(-12, 20.5, 5));
        points.push(new THREE.Vector3(-12, 24, 5));
        points.push(new THREE.Vector3(-12, 22, 5));
        points.push(new THREE.Vector3(-2, 22, 5));
        points.push(new THREE.Vector3(-2, 20.5, 5));
        points.push(new THREE.Vector3(-2, 24, 5));
        var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        var lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
        var hMarking = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(hMarking);
        objects.push(hMarking);

        // Windsock cone
        var sockGeometry = new THREE.ConeGeometry(2.5, 6, 8);
        var sockMaterial = new THREE.MeshLambertMaterial({color: 0xff6600});
        var windsock = new THREE.Mesh(sockGeometry, sockMaterial);
        windsock.position.set(10, 22, 10);
        scene.add(windsock);
        objects.push(windsock);

        // Seabird colony thermal OP - box elevated platform
        var platformGeometry = new THREE.BoxGeometry(10, 2, 10);
        var platformMaterial = new THREE.MeshLambertMaterial({color: 0x505050});
        var platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(25, 15, -5);
        scene.add(platform);
        objects.push(platform);

        // Egg-shaped sensor pods - sphere
        var sensorGeometry = new THREE.SphereGeometry(2, 8, 8);
        var sensorMaterial = new THREE.MeshLambertMaterial({color: 0x666666});
        var sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
        sensor.position.set(25, 19, -5);
        scene.add(sensor);
        objects.push(sensor);

        // Tidal channel mine barrier - sphere mines on LineSegments cable anchors
        var cablePoints = [];
        cablePoints.push(new THREE.Vector3(-30, -2, 8));
        cablePoints.push(new THREE.Vector3(30, -2, 8));
        var cableGeometry = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableMaterial = new THREE.LineBasicMaterial({color: 0x444444});
        var cable = new THREE.LineSegments(cableGeometry, cableMaterial);
        scene.add(cable);
        objects.push(cable);

        // Mines on cable
        var mineGeometry = new THREE.SphereGeometry(1.5, 6, 6);
        var mineMaterial = new THREE.MeshLambertMaterial({color: 0x1a1a1a});
        var mine1 = new THREE.Mesh(mineGeometry, mineMaterial);
        mine1.position.set(-20, -2, 8);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeometry, mineMaterial);
        mine2.position.set(0, -2, 8);
        scene.add(mine2);
        objects.push(mine2);

        var mine3 = new THREE.Mesh(mineGeometry, mineMaterial);
        mine3.position.set(20, -2, 8);
        scene.add(mine3);
        objects.push(mine3);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation logic here if needed
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
