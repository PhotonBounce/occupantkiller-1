window.LochBase = (function() {
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
        // Floating platform barracks on cylinder stilts
        var stilt1 = new THREE.CylinderGeometry(2, 2, 18, 8);
        var mat1 = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var mesh1 = new THREE.Mesh(stilt1, mat1);
        mesh1.position.set(-20, -8, -20);
        scene.add(mesh1);
        objects.push(mesh1);

        var barracks1 = new THREE.BoxGeometry(12, 6, 10);
        var mat2 = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var mesh2 = new THREE.Mesh(barracks1, mat2);
        mesh2.position.set(-20, 2, -20);
        scene.add(mesh2);
        objects.push(mesh2);

        // Second barracks platform
        var stilt2 = new THREE.CylinderGeometry(2, 2, 18, 8);
        var mat3 = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var mesh3 = new THREE.Mesh(stilt2, mat3);
        mesh3.position.set(15, -8, -15);
        scene.add(mesh3);
        objects.push(mesh3);

        var barracks2 = new THREE.BoxGeometry(10, 6, 12);
        var mat4 = new THREE.MeshLambertMaterial({ color: 0x9B8B6B });
        var mesh4 = new THREE.Mesh(barracks2, mat4);
        mesh4.position.set(15, 2, -15);
        scene.add(mesh4);
        objects.push(mesh4);

        // Bagpipe signal tower
        var tower = new THREE.CylinderGeometry(3, 3.5, 22, 10);
        var mat5 = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var mesh5 = new THREE.Mesh(tower, mat5);
        mesh5.position.set(-5, -5, 18);
        scene.add(mesh5);
        objects.push(mesh5);

        var towerCap = new THREE.ConeGeometry(3.5, 4, 10);
        var mat6 = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var mesh6 = new THREE.Mesh(towerCap, mat6);
        mesh6.position.set(-5, 16, 18);
        scene.add(mesh6);
        objects.push(mesh6);

        // Underwater sonar array - sphere clusters
        var sonar1 = new THREE.SphereGeometry(1.5, 8, 8);
        var mat7 = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
        var mesh7 = new THREE.Mesh(sonar1, mat7);
        mesh7.position.set(-15, -20, 5);
        scene.add(mesh7);
        objects.push(mesh7);

        var sonar2 = new THREE.SphereGeometry(1.2, 8, 8);
        var mat8 = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        var mesh8 = new THREE.Mesh(sonar2, mat8);
        mesh8.position.set(-10, -22, 8);
        scene.add(mesh8);
        objects.push(mesh8);

        var sonar3 = new THREE.SphereGeometry(1.4, 8, 8);
        var mat9 = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
        var mesh9 = new THREE.Mesh(sonar3, mat9);
        mesh9.position.set(-20, -19, 10);
        scene.add(mesh9);
        objects.push(mesh9);

        // Highland cattle obstacle barriers - box barricades
        var barrier1 = new THREE.BoxGeometry(8, 4, 2);
        var mat10 = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var mesh10 = new THREE.Mesh(barrier1, mat10);
        mesh10.position.set(25, -6, 0);
        scene.add(mesh10);
        objects.push(mesh10);

        var barrier2 = new THREE.BoxGeometry(2, 4, 8);
        var mat11 = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var mesh11 = new THREE.Mesh(barrier2, mat11);
        mesh11.position.set(28, -6, 8);
        scene.add(mesh11);
        objects.push(mesh11);

        // Kelpie monster effigy scarecrow - sphere + cylinder body on poles
        var kelpiePole1 = new THREE.CylinderGeometry(0.8, 0.8, 16, 6);
        var mat12 = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var mesh12 = new THREE.Mesh(kelpiePole1, mat12);
        mesh12.position.set(0, -3, -28);
        scene.add(mesh12);
        objects.push(mesh12);

        var kelpieBody = new THREE.CylinderGeometry(2.5, 2.5, 6, 10);
        var mat13 = new THREE.MeshLambertMaterial({ color: 0x6B5B45 });
        var mesh13 = new THREE.Mesh(kelpieBody, mat13);
        mesh13.position.set(0, 5, -28);
        scene.add(mesh13);
        objects.push(mesh13);

        var kelpieHead = new THREE.SphereGeometry(2.8, 10, 10);
        var mat14 = new THREE.MeshLambertMaterial({ color: 0x5D4E37 });
        var mesh14 = new THREE.Mesh(kelpieHead, mat14);
        mesh14.position.set(0, 14, -28);
        scene.add(mesh14);
        objects.push(mesh14);

        var kelpieHorn = new THREE.ConeGeometry(1, 3, 8);
        var mat15 = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var mesh15 = new THREE.Mesh(kelpieHorn, mat15);
        mesh15.position.set(0, 17, -28);
        scene.add(mesh15);
        objects.push(mesh15);

        // Add lights
        var light1 = new THREE.PointLight(0xFFFFFF, 0.8);
        light1.position.set(-10, 20, 10);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.DirectionalLight(0xFFFFFF, 0.6);
        light2.position.set(30, 25, 30);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animate kelpie effigy - gentle sway
        if (objects.length > 12) {
            var swayAmount = Math.sin(Date.now() * 0.001) * 0.3;
            objects[12].rotation.z = swayAmount * 0.1;
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
