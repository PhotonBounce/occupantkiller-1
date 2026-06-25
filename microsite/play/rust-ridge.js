window.RustRidge = (function() {
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
        buildRidge();
    }

    function buildRidge() {
        // Corroded orange-red material (rust color)
        var rustMaterial = new THREE.MeshLambertMaterial({ color: 0xCC4422 });
        var deepRustMaterial = new THREE.MeshLambertMaterial({ color: 0x884411 });
        var oxidizedMaterial = new THREE.MeshLambertMaterial({ color: 0xDD6633 });
        var darkRustMaterial = new THREE.MeshLambertMaterial({ color: 0x663322 });

        // 1. Collapsed factory section - main structure
        var factory1Geom = new THREE.BoxGeometry(25, 8, 18);
        var factory1 = new THREE.Mesh(factory1Geom, rustMaterial);
        factory1.position.set(-25, 4, -20);
        factory1.rotation.z = 0.15;
        scene.add(factory1);
        objects.push(factory1);

        // 2. Factory section 2
        var factory2Geom = new THREE.BoxGeometry(20, 6, 16);
        var factory2 = new THREE.Mesh(factory2Geom, deepRustMaterial);
        factory2.position.set(18, 3, -15);
        factory2.rotation.z = -0.2;
        scene.add(factory2);
        objects.push(factory2);

        // 3. Rusted storage silo 1 - large cylinder
        var silo1Geom = new THREE.CylinderGeometry(6, 7, 20, 12);
        var silo1 = new THREE.Mesh(silo1Geom, oxidizedMaterial);
        silo1.position.set(-12, 10, 8);
        scene.add(silo1);
        objects.push(silo1);

        // 4. Rusted storage silo 2 - smaller cylinder
        var silo2Geom = new THREE.CylinderGeometry(5, 5.5, 18, 10);
        var silo2 = new THREE.Mesh(silo2Geom, rustMaterial);
        silo2.position.set(14, 9, 12);
        scene.add(silo2);
        objects.push(silo2);

        // 5. Silo cap 1
        var cap1Geom = new THREE.ConeGeometry(6.5, 4, 12);
        var cap1 = new THREE.Mesh(cap1Geom, darkRustMaterial);
        cap1.position.set(-12, 20.5, 8);
        scene.add(cap1);
        objects.push(cap1);

        // 6. Silo cap 2
        var cap2Geom = new THREE.ConeGeometry(5.5, 3, 10);
        var cap2 = new THREE.Mesh(cap2Geom, deepRustMaterial);
        cap2.position.set(14, 18.5, 12);
        scene.add(cap2);
        objects.push(cap2);

        // 7. Corroded metal girder frame - horizontal support
        var girderGeom1 = new THREE.BoxGeometry(35, 1, 1);
        var girder1 = new THREE.Mesh(girderGeom1, rustMaterial);
        girder1.position.set(0, 15, -5);
        scene.add(girder1);
        objects.push(girder1);

        // 8. Vertical girder support
        var girderGeom2 = new THREE.BoxGeometry(1, 12, 1);
        var girder2 = new THREE.Mesh(girderGeom2, oxidizedMaterial);
        girder2.position.set(-20, 8, -10);
        scene.add(girder2);
        objects.push(girder2);

        // 9. Diagonal bracing girder
        var girderGeom3 = new THREE.BoxGeometry(1, 1, 18);
        var girder3 = new THREE.Mesh(girderGeom3, darkRustMaterial);
        girder3.position.set(22, 6, 5);
        girder3.rotation.y = 0.3;
        scene.add(girder3);
        objects.push(girder3);

        // 10. Oxidized rail track section 1
        var rail1Geom = new THREE.BoxGeometry(40, 0.8, 2);
        var rail1 = new THREE.Mesh(rail1Geom, deepRustMaterial);
        rail1.position.set(0, 0.5, -18);
        scene.add(rail1);
        objects.push(rail1);

        // 11. Rail track section 2
        var rail2Geom = new THREE.BoxGeometry(2, 0.8, 28);
        var rail2 = new THREE.Mesh(rail2Geom, rustMaterial);
        rail2.position.set(-18, 0.5, 0);
        scene.add(rail2);
        objects.push(rail2);

        // 12. Collapsed beam - sphere representing ball joint damage
        var damageSphere1Geom = new THREE.SphereGeometry(3, 8, 8);
        var damageSphere1 = new THREE.Mesh(damageSphere1Geom, oxidizedMaterial);
        damageSphere1.position.set(25, 8, 22);
        scene.add(damageSphere1);
        objects.push(damageSphere1);

        // 13. Rusted structural connector sphere
        var connectorGeom = new THREE.SphereGeometry(2.5, 8, 8);
        var connector = new THREE.Mesh(connectorGeom, darkRustMaterial);
        connector.position.set(-28, 12, 15);
        scene.add(connector);
        objects.push(connector);

        // 14. Industrial base foundation block
        var foundationGeom = new THREE.BoxGeometry(50, 2, 40);
        var foundation = new THREE.Mesh(foundationGeom, deepRustMaterial);
        foundation.position.set(0, 0, 0);
        scene.add(foundation);
        objects.push(foundation);

        // 15. Collapsed section - tilted box
        var collapseGeom = new THREE.BoxGeometry(16, 5, 12);
        var collapse = new THREE.Mesh(collapseGeom, rustMaterial);
        collapse.position.set(-8, 6, 20);
        collapse.rotation.x = 0.4;
        collapse.rotation.z = 0.25;
        scene.add(collapse);
        objects.push(collapse);

        // 16. Additional rusted structural element - cylinder
        var structureGeom = new THREE.CylinderGeometry(2, 2.5, 14, 10);
        var structure = new THREE.Mesh(structureGeom, oxidizedMaterial);
        structure.position.set(28, 7, -8);
        structure.rotation.z = 0.3;
        scene.add(structure);
        objects.push(structure);

        // Add ambient light for overall illumination
        var ambientLight = new THREE.AmbientLight(0xBB6644, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Add directional light to simulate rust-colored sunlight
        var dirLight = new THREE.DirectionalLight(0xDD8855, 0.8);
        dirLight.position.set(30, 25, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Subtle rotation of damaged spheres to show deterioration
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry) {
                objects[i].rotation.x += delta * 0.1;
                objects[i].rotation.y += delta * 0.15;
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
