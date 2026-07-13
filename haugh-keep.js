window.HaughKeep = (function() {
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
        // Flood berm earthwork 1 - long low box
        var bermGeo1 = new THREE.BoxGeometry(40, 2, 4);
        var bermMat1 = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var berm1 = new THREE.Mesh(bermGeo1, bermMat1);
        berm1.position.set(-20, 0.5, -25);
        scene.add(berm1);
        objects.push(berm1);

        // Flood berm earthwork 2 - opposite side
        var bermGeo2 = new THREE.BoxGeometry(40, 2, 4);
        var bermMat2 = new THREE.MeshLambertMaterial({ color: 0x9B8365 });
        var berm2 = new THREE.Mesh(bermGeo2, bermMat2);
        berm2.position.set(-20, 0.5, 25);
        scene.add(berm2);
        objects.push(berm2);

        // Pillbox fighting position - main box
        var pillboxGeo = new THREE.BoxGeometry(8, 5, 8);
        var pillboxMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var pillbox = new THREE.Mesh(pillboxGeo, pillboxMat);
        pillbox.position.set(10, 2, 0);
        scene.add(pillbox);
        objects.push(pillbox);

        // Pillbox gun slits - LineSegments
        var slit1Points = [
            new THREE.Vector3(14, 3, -3),
            new THREE.Vector3(14, 3, -1)
        ];
        var slit1Geo = new THREE.BufferGeometry().setFromPoints(slit1Points);
        var slit1Mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var slit1 = new THREE.LineSegments(slit1Geo, slit1Mat);
        scene.add(slit1);
        objects.push(slit1);

        // Pillbox gun slit 2
        var slit2Points = [
            new THREE.Vector3(14, 3, 1),
            new THREE.Vector3(14, 3, 3)
        ];
        var slit2Geo = new THREE.BufferGeometry().setFromPoints(slit2Points);
        var slit2Mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        var slit2 = new THREE.LineSegments(slit2Geo, slit2Mat);
        scene.add(slit2);
        objects.push(slit2);

        // Ford crossing checkpoint - box road block
        var fordGeo = new THREE.BoxGeometry(12, 2, 3);
        var fordMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var ford = new THREE.Mesh(fordGeo, fordMat);
        ford.position.set(-5, 1, 0);
        scene.add(ford);
        objects.push(ford);

        // Ford checkpoint posts - cylinder 1
        var post1Geo = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
        var post1Mat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var post1 = new THREE.Mesh(post1Geo, post1Mat);
        post1.position.set(-11, 1.5, -2);
        scene.add(post1);
        objects.push(post1);

        // Ford checkpoint posts - cylinder 2
        var post2Geo = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
        var post2Mat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var post2 = new THREE.Mesh(post2Geo, post2Mat);
        post2.position.set(-11, 1.5, 2);
        scene.add(post2);
        objects.push(post2);

        // Field kitchen hut - box
        var kitchenGeo = new THREE.BoxGeometry(6, 5, 6);
        var kitchenMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var kitchen = new THREE.Mesh(kitchenGeo, kitchenMat);
        kitchen.position.set(25, 2.5, -15);
        scene.add(kitchen);
        objects.push(kitchen);

        // Field kitchen chimney pipe - cylinder
        var chimneyGeo = new THREE.CylinderGeometry(1, 1, 8, 12);
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var chimney = new THREE.Mesh(chimneyGeo, chimneyMat);
        chimney.position.set(28, 5, -15);
        scene.add(chimney);
        objects.push(chimney);

        // Ammunition boat pontoon - main box barge
        var bargeGeo = new THREE.BoxGeometry(20, 3, 6);
        var bargeMat = new THREE.MeshLambertMaterial({ color: 0x2C3E50 });
        var barge = new THREE.Mesh(bargeGeo, bargeMat);
        barge.position.set(-25, 1.5, 15);
        scene.add(barge);
        objects.push(barge);

        // Pontoon float 1 - cylinder
        var float1Geo = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
        var float1Mat = new THREE.MeshLambertMaterial({ color: 0x556B7F });
        var float1 = new THREE.Mesh(float1Geo, float1Mat);
        float1.position.set(-35, 0.5, 12);
        scene.add(float1);
        objects.push(float1);

        // Pontoon float 2 - cylinder
        var float2Geo = new THREE.CylinderGeometry(1.5, 1.5, 2, 12);
        var float2Mat = new THREE.MeshLambertMaterial({ color: 0x556B7F });
        var float2 = new THREE.Mesh(float2Geo, float2Mat);
        float2.position.set(-35, 0.5, 18);
        scene.add(float2);
        objects.push(float2);

        // Willow tree screen - trunk 1
        var willow1Geo = new THREE.CylinderGeometry(0.6, 0.8, 12, 8);
        var willow1Mat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var willow1 = new THREE.Mesh(willow1Geo, willow1Mat);
        willow1.position.set(15, 6, 20);
        scene.add(willow1);
        objects.push(willow1);

        // Willow tree canopy 1 - sphere
        var canopy1Geo = new THREE.SphereGeometry(6, 8, 8);
        var canopy1Mat = new THREE.MeshLambertMaterial({ color: 0x3D5C2A });
        var canopy1 = new THREE.Mesh(canopy1Geo, canopy1Mat);
        canopy1.position.set(15, 14, 20);
        scene.add(canopy1);
        objects.push(canopy1);

        // Willow tree screen - trunk 2
        var willow2Geo = new THREE.CylinderGeometry(0.6, 0.8, 12, 8);
        var willow2Mat = new THREE.MeshLambertMaterial({ color: 0x6B5D4F });
        var willow2 = new THREE.Mesh(willow2Geo, willow2Mat);
        willow2.position.set(28, 6, 20);
        scene.add(willow2);
        objects.push(willow2);

        // Willow tree canopy 2 - sphere
        var canopy2Geo = new THREE.SphereGeometry(6, 8, 8);
        var canopy2Mat = new THREE.MeshLambertMaterial({ color: 0x3D5C2A });
        var canopy2 = new THREE.Mesh(canopy2Geo, canopy2Mat);
        canopy2.position.set(28, 14, 20);
        scene.add(canopy2);
        objects.push(canopy2);

        // Flood alert bell tower - main cylinder
        var towerGeo = new THREE.CylinderGeometry(2, 2.5, 18, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(-15, 9, -18);
        scene.add(tower);
        objects.push(tower);

        // Bell - sphere
        var bellGeo = new THREE.SphereGeometry(3, 12, 12);
        var bellMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var bell = new THREE.Mesh(bellGeo, bellMat);
        bell.position.set(-15, 21, -18);
        scene.add(bell);
        objects.push(bell);

        // Barbed wire riverside perimeter - stake post 1
        var stake1Geo = new THREE.CylinderGeometry(0.3, 0.4, 4, 6);
        var stake1Mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var stake1 = new THREE.Mesh(stake1Geo, stake1Mat);
        stake1.position.set(0, 2, -28);
        scene.add(stake1);
        objects.push(stake1);

        // Barbed wire line 1 - LineSegments
        var wire1Points = [
            new THREE.Vector3(0, 3, -28),
            new THREE.Vector3(10, 3, -28)
        ];
        var wire1Geo = new THREE.BufferGeometry().setFromPoints(wire1Points);
        var wire1Mat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
        var wire1 = new THREE.LineSegments(wire1Geo, wire1Mat);
        scene.add(wire1);
        objects.push(wire1);

        // Barbed wire stake post 2
        var stake2Geo = new THREE.CylinderGeometry(0.3, 0.4, 4, 6);
        var stake2Mat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var stake2 = new THREE.Mesh(stake2Geo, stake2Mat);
        stake2.position.set(10, 2, -28);
        scene.add(stake2);
        objects.push(stake2);

        // Barbed wire line 2 - LineSegments
        var wire2Points = [
            new THREE.Vector3(10, 3, -28),
            new THREE.Vector3(20, 3, -28)
        ];
        var wire2Geo = new THREE.BufferGeometry().setFromPoints(wire2Points);
        var wire2Mat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 });
        var wire2 = new THREE.LineSegments(wire2Geo, wire2Mat);
        scene.add(wire2);
        objects.push(wire2);

        // Cone structure - ammunition pile
        var ammoPileGeo = new THREE.ConeGeometry(3, 5, 8);
        var ammoPileMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var ammoPile = new THREE.Mesh(ammoPileGeo, ammoPileMat);
        ammoPile.position.set(30, 2.5, 10);
        scene.add(ammoPile);
        objects.push(ammoPile);

        // Ground reference box
        var groundRefGeo = new THREE.BoxGeometry(80, 0.5, 80);
        var groundRefMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
        var groundRef = new THREE.Mesh(groundRefGeo, groundRefMat);
        groundRef.position.set(0, -0.25, 0);
        scene.add(groundRef);
        objects.push(groundRef);

        // Add lights
        var ambLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 30, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation updates can be added here
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        for (var i = 0; i < lights.length; i++) scene.remove(lights[i]);
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
