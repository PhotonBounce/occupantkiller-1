window.KilmarnockFort = (function() {
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
        var redMaterial = new THREE.MeshLambertMaterial({ color: 0xCC4444 });
        var grayMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var darkMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var brownMaterial = new THREE.MeshLambertMaterial({ color: 0x664422 });
        var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var metalMaterial = new THREE.MeshLambertMaterial({ color: 0x444466 });

        var light1 = new THREE.PointLight(0xFFFFFF, 1, 100);
        light1.position.set(0, 20, 0);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.6);
        light2.position.set(30, 15, 30);
        scene.add(light2);
        lights.push(light2);

        // Dick Institute command post - red sandstone Victorian building
        var dickBox1 = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 6), redMaterial);
        dickBox1.position.set(-28, 5, -25);
        scene.add(dickBox1);
        objects.push(dickBox1);

        // Dick Institute secure annexe
        var dickBox2 = new THREE.Mesh(new THREE.BoxGeometry(5, 7, 4), darkMaterial);
        dickBox2.position.set(-22, 3.5, -28);
        scene.add(dickBox2);
        objects.push(dickBox2);

        // Dick Institute radio mast
        var dickCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 18, 8), metalMaterial);
        dickCyl.position.set(-25, 9, -23);
        scene.add(dickCyl);
        objects.push(dickCyl);

        // Kilmarnock railway junction Victorian station
        var railBox1 = new THREE.Mesh(new THREE.BoxGeometry(12, 8, 8), redMaterial);
        railBox1.position.set(-8, 4, -22);
        scene.add(railBox1);
        objects.push(railBox1);

        // Kilmarnock signal cabin
        var railBox2 = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), brownMaterial);
        railBox2.position.set(-2, 3, -26);
        scene.add(railBox2);
        objects.push(railBox2);

        // Kilmarnock water tower
        var railCyl = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 14, 8), grayMaterial);
        railCyl.position.set(-5, 7, -18);
        scene.add(railCyl);
        objects.push(railCyl);

        // Dean Castle medieval keep tower
        var deanBox1 = new THREE.Mesh(new THREE.BoxGeometry(7, 16, 7), darkMaterial);
        deanBox1.position.set(12, 8, -20);
        scene.add(deanBox1);
        objects.push(deanBox1);

        // Dean Castle palace block
        var deanBox2 = new THREE.Mesh(new THREE.BoxGeometry(10, 9, 8), brownMaterial);
        deanBox2.position.set(20, 4.5, -22);
        scene.add(deanBox2);
        objects.push(deanBox2);

        // Dean Castle courtyard wall
        var deanBox3 = new THREE.Mesh(new THREE.BoxGeometry(15, 5, 2), grayMaterial);
        deanBox3.position.set(16, 2.5, -15);
        scene.add(deanBox3);
        objects.push(deanBox3);

        // Caprington Castle Gothic tower
        var capBox1 = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 6), redMaterial);
        capBox1.position.set(28, 7, -8);
        scene.add(capBox1);
        objects.push(capBox1);

        // Caprington Castle stable block
        var capBox2 = new THREE.Mesh(new THREE.BoxGeometry(10, 7, 8), brownMaterial);
        capBox2.position.set(36, 3.5, -10);
        scene.add(capBox2);
        objects.push(capBox2);

        // Caprington Castle water cistern
        var capCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 8), metalMaterial);
        capCyl.position.set(32, 3, -4);
        scene.add(capCyl);
        objects.push(capCyl);

        // Fenwick Moor concrete operations block
        var fenwBox1 = new THREE.Mesh(new THREE.BoxGeometry(11, 6, 9), concreteMaterial);
        fenwBox1.position.set(8, 3, 8);
        scene.add(fenwBox1);
        objects.push(fenwBox1);

        // Fenwick Moor radar dome
        var fenwCyl = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 5, 16), metalMaterial);
        fenwCyl.position.set(14, 2.5, 12);
        scene.add(fenwCyl);
        objects.push(fenwCyl);

        // Fenwick Moor generator shed
        var fenwBox2 = new THREE.Mesh(new THREE.BoxGeometry(7, 5, 6), darkMaterial);
        fenwBox2.position.set(2, 2.5, 14);
        scene.add(fenwBox2);
        objects.push(fenwBox2);

        // Irvine Valley road A71 cutting
        var irvBox1 = new THREE.Mesh(new THREE.BoxGeometry(20, 4, 3), grayMaterial);
        irvBox1.position.set(-15, 2, 20);
        scene.add(irvBox1);
        objects.push(irvBox1);

        // Irvine Valley stone wall cover
        var irvBox2 = new THREE.Mesh(new THREE.BoxGeometry(18, 3, 2), brownMaterial);
        irvBox2.position.set(-10, 1.5, 24);
        scene.add(irvBox2);
        objects.push(irvBox2);

        // Irvine Valley IED charges sphere
        var irvSph = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), redMaterial);
        irvSph.position.set(-12, 2.5, 22);
        scene.add(irvSph);
        objects.push(irvSph);

        // Irvine Valley command wire
        var wireGeom = new THREE.BufferGeometry();
        var wirePos = new Float32Array([
            -15, 3, 22,
            -8, 3, 26
        ]);
        wireGeom.setAttribute('position', new THREE.BufferAttribute(wirePos, 3));
        var wireLine = new THREE.LineSegments(wireGeom, new THREE.LineBasicMaterial({ color: 0x222222, linewidth: 2 }));
        scene.add(wireLine);
        objects.push(wireLine);

        // Waterslap concrete barriers
        var waterBox1 = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 3), concreteMaterial);
        waterBox1.position.set(-5, 1, -5);
        scene.add(waterBox1);
        objects.push(waterBox1);

        // Waterslap watchtower
        var waterCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 11, 8), metalMaterial);
        waterCyl.position.set(0, 5.5, -8);
        scene.add(waterCyl);
        objects.push(waterCyl);

        // Waterslap sandbag post
        var waterBox2 = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 4), brownMaterial);
        waterBox2.position.set(3, 1.25, -5);
        scene.add(waterBox2);
        objects.push(waterBox2);

        // Craigie Castle ruined tower
        var craigBox1 = new THREE.Mesh(new THREE.BoxGeometry(5, 11, 5), darkMaterial);
        craigBox1.position.set(20, 5.5, 18);
        scene.add(craigBox1);
        objects.push(craigBox1);

        // Craigie Castle enclosure wall
        var craigBox2 = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 2), grayMaterial);
        craigBox2.position.set(20, 2, 26);
        scene.add(craigBox2);
        objects.push(craigBox2);

        // Craigie Castle turret stump
        var craigCone = new THREE.Mesh(new THREE.ConeGeometry(2, 7, 8), redMaterial);
        craigCone.position.set(24, 3.5, 20);
        scene.add(craigCone);
        objects.push(craigCone);
    }

    function update(delta) {
        // Animation frame updates can be added here if needed
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
