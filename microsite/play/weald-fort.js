window.WealdFort = (function() {
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
        // Rampart 1: Inner earth bank (stacked boxes)
        var rampartMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var box1 = new THREE.Mesh(new THREE.BoxGeometry(80, 8, 15), rampartMat);
        box1.position.set(0, 4, 0);
        scene.add(box1);
        objects.push(box1);

        var box2 = new THREE.Mesh(new THREE.BoxGeometry(75, 6, 14), rampartMat);
        box2.position.set(0, 12, 0);
        scene.add(box2);
        objects.push(box2);

        // Rampart 2: Outer earth bank
        var box3 = new THREE.Mesh(new THREE.BoxGeometry(85, 7, 16), rampartMat);
        box3.position.set(0, 3.5, 30);
        scene.add(box3);
        objects.push(box3);

        // Ditch (sunken area)
        var ditchMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
        var box4 = new THREE.Mesh(new THREE.BoxGeometry(90, 5, 12), ditchMat);
        box4.position.set(0, -2, 20);
        scene.add(box4);
        objects.push(box4);

        // Roundhouse 1: Cylinder walls
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 6, 12), wallMat);
        cyl1.position.set(-25, 3, -15);
        scene.add(cyl1);
        objects.push(cyl1);

        // Roundhouse 1: Cone thatched roof
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
        var cone1 = new THREE.Mesh(new THREE.ConeGeometry(13, 8, 12), roofMat);
        cone1.position.set(-25, 11, -15);
        scene.add(cone1);
        objects.push(cone1);

        // Roundhouse 2: Cylinder walls
        var cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(11, 11, 6, 12), wallMat);
        cyl2.position.set(25, 3, -20);
        scene.add(cyl2);
        objects.push(cyl2);

        // Roundhouse 2: Cone thatched roof
        var cone2 = new THREE.Mesh(new THREE.ConeGeometry(12, 7, 12), roofMat);
        cone2.position.set(25, 10, -20);
        scene.add(cone2);
        objects.push(cone2);

        // Iron smelting bloomery: Cylinder furnace body
        var furnaceMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var cyl3 = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 10, 8), furnaceMat);
        cyl3.position.set(-30, 5, 15);
        scene.add(cyl3);
        objects.push(cyl3);

        // Bloomery: Glow sphere on top
        var glowMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var sphere1 = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), glowMat);
        sphere1.position.set(-30, 15, 15);
        scene.add(sphere1);
        objects.push(sphere1);

        // Charcoal burning mound: Black sphere
        var charcoalMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        var sphere2 = new THREE.Mesh(new THREE.SphereGeometry(14, 12, 8), charcoalMat);
        sphere2.position.set(30, 7, 10);
        scene.add(sphere2);
        objects.push(sphere2);

        // Machine gun nest: Small cylinder on rampart
        var gunMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var cyl4 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 2, 8), gunMat);
        cyl4.position.set(0, 20, 0);
        scene.add(cyl4);
        objects.push(cyl4);

        // Gun nest shield: Box
        var shieldMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var box5 = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 1.5), shieldMat);
        box5.position.set(0, 19, -3);
        scene.add(box5);
        objects.push(box5);

        // Storage structure: Small roundhouse
        var cyl5 = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 5, 10), wallMat);
        cyl5.position.set(-35, 2.5, -30);
        scene.add(cyl5);
        objects.push(cyl5);

        var cone3 = new THREE.Mesh(new THREE.ConeGeometry(9, 6, 10), roofMat);
        cone3.position.set(-35, 8.5, -30);
        scene.add(cone3);
        objects.push(cone3);

        // Support post: Tall cylinder
        var postMat = new THREE.MeshLambertMaterial({ color: 0x5a3a2a });
        var cyl6 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 14, 6), postMat);
        cyl6.position.set(35, 7, -10);
        scene.add(cyl6);
        objects.push(cyl6);

        // Add lights
        var light1 = new THREE.PointLight(0xffffff, 1, 100);
        light1.position.set(0, 25, 0);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.PointLight(0xff9900, 0.8, 60);
        light2.position.set(-30, 15, 15);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animate the glow sphere (bloomery)
        if (objects.length > 8) {
            objects[8].rotation.y += delta * 0.3;
            objects[8].position.y += Math.sin(Date.now() * 0.002) * 0.1;
        }
        // Animate the charcoal mound
        if (objects.length > 9) {
            objects[9].rotation.x += delta * 0.1;
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
