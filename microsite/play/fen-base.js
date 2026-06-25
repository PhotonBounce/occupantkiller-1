window.FenBase = (function() {
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
        // Causeway road - raised box across boggy ground
        var causewayGeom = new THREE.BoxGeometry(60, 2, 4);
        var causewayMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var causeway = new THREE.Mesh(causewayGeom, causewayMat);
        causeway.position.set(0, 0.5, 0);
        scene.add(causeway);
        objects.push(causeway);

        // Pumphouse - cylindrical main structure with windmill silhouette
        var pumphouseGeom = new THREE.CylinderGeometry(5, 5, 12, 8);
        var pumphouseMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var pumphouse = new THREE.Mesh(pumphouseGeom, pumphouseMat);
        pumphouse.position.set(-20, 6, -15);
        scene.add(pumphouse);
        objects.push(pumphouse);

        // Pumphouse roof cone
        var roofGeom = new THREE.ConeGeometry(6, 4, 8);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.set(-20, 14, -15);
        scene.add(roof);
        objects.push(roof);

        // Stilted barracks on cylinder pole - pole 1
        var stilePole1Geom = new THREE.CylinderGeometry(1, 1, 10, 6);
        var stileMat = new THREE.MeshLambertMaterial({ color: 0x5C4033 });
        var stilePole1 = new THREE.Mesh(stilePole1Geom, stileMat);
        stilePole1.position.set(15, 5, 10);
        scene.add(stilePole1);
        objects.push(stilePole1);

        // Stilted barracks platform on pole 1
        var barracksGeom = new THREE.BoxGeometry(8, 1.5, 8);
        var barracksMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var barracks = new THREE.Mesh(barracksGeom, barracksMat);
        barracks.position.set(15, 10.5, 10);
        scene.add(barracks);
        objects.push(barracks);

        // Stilted barracks wall box above platform
        var barracksWallGeom = new THREE.BoxGeometry(7, 6, 7);
        var barracksWallMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var barracksWall = new THREE.Mesh(barracksWallGeom, barracksWallMat);
        barracksWall.position.set(15, 14, 10);
        scene.add(barracksWall);
        objects.push(barracksWall);

        // Stilted barracks on pole 2
        var stilePole2Geom = new THREE.CylinderGeometry(1, 1, 10, 6);
        var stilePole2 = new THREE.Mesh(stilePole2Geom, stileMat);
        stilePole2.position.set(-15, 5, 20);
        scene.add(stilePole2);
        objects.push(stilePole2);

        // Stilted barracks platform on pole 2
        var barracks2Geom = new THREE.BoxGeometry(8, 1.5, 8);
        var barracks2 = new THREE.Mesh(barracks2Geom, barracksMat);
        barracks2.position.set(-15, 10.5, 20);
        scene.add(barracks2);
        objects.push(barracks2);

        // Stilted barracks wall on pole 2
        var barracksWall2Geom = new THREE.BoxGeometry(7, 6, 7);
        var barracksWall2 = new THREE.Mesh(barracksWall2Geom, barracksWallMat);
        barracksWall2.position.set(-15, 14, 20);
        scene.add(barracksWall2);
        objects.push(barracksWall2);

        // Observation tower - stacked box floors
        var towerBase1Geom = new THREE.BoxGeometry(6, 2, 6);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var towerBase1 = new THREE.Mesh(towerBase1Geom, towerMat);
        towerBase1.position.set(25, 1, -20);
        scene.add(towerBase1);
        objects.push(towerBase1);

        // Tower floor 2
        var towerFloor2Geom = new THREE.BoxGeometry(5, 2, 5);
        var towerFloor2 = new THREE.Mesh(towerFloor2Geom, towerMat);
        towerFloor2.position.set(25, 5, -20);
        scene.add(towerFloor2);
        objects.push(towerFloor2);

        // Tower floor 3
        var towerFloor3Geom = new THREE.BoxGeometry(4, 2, 4);
        var towerFloor3 = new THREE.Mesh(towerFloor3Geom, towerMat);
        towerFloor3.position.set(25, 9, -20);
        scene.add(towerFloor3);
        objects.push(towerFloor3);

        // Tower observation cabin
        var towerTopGeom = new THREE.BoxGeometry(3, 3, 3);
        var towerTopMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var towerTop = new THREE.Mesh(towerTopGeom, towerTopMat);
        towerTop.position.set(25, 13, -20);
        scene.add(towerTop);
        objects.push(towerTop);

        // Submerged ammunition cache - box crates half-buried
        var ammoCrate1Geom = new THREE.BoxGeometry(4, 3, 4);
        var ammoCrateMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var ammoCrate1 = new THREE.Mesh(ammoCrate1Geom, ammoCrateMat);
        ammoCrate1.position.set(-25, -1, 5);
        scene.add(ammoCrate1);
        objects.push(ammoCrate1);

        // Ammunition crate 2
        var ammoCrate2Geom = new THREE.BoxGeometry(4, 3, 4);
        var ammoCrate2 = new THREE.Mesh(ammoCrate2Geom, ammoCrateMat);
        ammoCrate2.position.set(-20, -1, 8);
        scene.add(ammoCrate2);
        objects.push(ammoCrate2);

        // Ammunition crate 3
        var ammoCrate3Geom = new THREE.BoxGeometry(4, 3, 4);
        var ammoCrate3 = new THREE.Mesh(ammoCrate3Geom, ammoCrateMat);
        ammoCrate3.position.set(-28, -1, 10);
        scene.add(ammoCrate3);
        objects.push(ammoCrate3);

        // Reed-cover camouflage net - LineSegments mesh
        var camo1Geom = new THREE.BufferGeometry();
        var camo1Verts = new Float32Array([
            -30, 2, -25,
            -30, 3, -25,
            -20, 2, -25,
            -20, 3, -25,
            -10, 2, -25,
            -10, 3, -25,
            0, 2, -25,
            0, 3, -25,
            10, 2, -25,
            10, 3, -25
        ]);
        camo1Geom.setAttribute('position', new THREE.BufferAttribute(camo1Verts, 3));
        var camoMat = new THREE.LineBasicMaterial({ color: 0x556B2F });
        var camo1Lines = new THREE.LineSegments(camo1Geom, camoMat);
        scene.add(camo1Lines);
        objects.push(camo1Lines);

        // Camouflage net 2 - cross pattern
        var camo2Geom = new THREE.BufferGeometry();
        var camo2Verts = new Float32Array([
            -25, 2, -15,
            -25, 3, 5,
            -15, 2, -15,
            -15, 3, 5,
            -5, 2, -15,
            -5, 3, 5,
            5, 2, -15,
            5, 3, 5
        ]);
        camo2Geom.setAttribute('position', new THREE.BufferAttribute(camo2Verts, 3));
        var camo2Lines = new THREE.LineSegments(camo2Geom, camoMat);
        scene.add(camo2Lines);
        objects.push(camo2Lines);

        // Perimeter marker buoy 1 - sphere float
        var buoyFloat1Geom = new THREE.SphereGeometry(1.5, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoyFloat1 = new THREE.Mesh(buoyFloat1Geom, buoyMat);
        buoyFloat1.position.set(30, 1, 15);
        scene.add(buoyFloat1);
        objects.push(buoyFloat1);

        // Buoy 1 pole
        var buoyPole1Geom = new THREE.CylinderGeometry(0.5, 0.5, 6, 4);
        var buoyPoleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var buoyPole1 = new THREE.Mesh(buoyPole1Geom, buoyPoleMat);
        buoyPole1.position.set(30, -3, 15);
        scene.add(buoyPole1);
        objects.push(buoyPole1);

        // Perimeter marker buoy 2
        var buoyFloat2Geom = new THREE.SphereGeometry(1.5, 8, 8);
        var buoyFloat2 = new THREE.Mesh(buoyFloat2Geom, buoyMat);
        buoyFloat2.position.set(-30, 1, -25);
        scene.add(buoyFloat2);
        objects.push(buoyFloat2);

        // Buoy 2 pole
        var buoyPole2Geom = new THREE.CylinderGeometry(0.5, 0.5, 6, 4);
        var buoyPole2 = new THREE.Mesh(buoyPole2Geom, buoyPoleMat);
        buoyPole2.position.set(-30, -3, -25);
        scene.add(buoyPole2);
        objects.push(buoyPole2);

        // Perimeter marker buoy 3
        var buoyFloat3Geom = new THREE.SphereGeometry(1.5, 8, 8);
        var buoyFloat3 = new THREE.Mesh(buoyFloat3Geom, buoyMat);
        buoyFloat3.position.set(25, 1, 30);
        scene.add(buoyFloat3);
        objects.push(buoyFloat3);

        // Buoy 3 pole
        var buoyPole3Geom = new THREE.CylinderGeometry(0.5, 0.5, 6, 4);
        var buoyPole3 = new THREE.Mesh(buoyPole3Geom, buoyPoleMat);
        buoyPole3.position.set(25, -3, 30);
        scene.add(buoyPole3);
        objects.push(buoyPole3);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate pumphouse rotation
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.x === -20 && objects[i].position.z === -15 && objects[i].geometry.type === 'CylinderGeometry') {
                objects[i].rotation.y += 0.01;
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
