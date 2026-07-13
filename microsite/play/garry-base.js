window.GarryBase = (function() {
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
        // Ruined castle strongpoint - base walls
        var wall1Geo = new THREE.BoxGeometry(20, 8, 2);
        var wall1Mat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var wall1 = new THREE.Mesh(wall1Geo, wall1Mat);
        wall1.position.set(-15, 4, -20);
        scene.add(wall1);
        objects.push(wall1);

        var wall2Geo = new THREE.BoxGeometry(2, 8, 20);
        var wall2Mat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var wall2 = new THREE.Mesh(wall2Geo, wall2Mat);
        wall2.position.set(-25, 4, -10);
        scene.add(wall2);
        objects.push(wall2);

        var wall3Geo = new THREE.BoxGeometry(20, 8, 2);
        var wall3Mat = new THREE.MeshLambertMaterial({color: 0x8B7355});
        var wall3 = new THREE.Mesh(wall3Geo, wall3Mat);
        wall3.position.set(-15, 4, 0);
        scene.add(wall3);
        objects.push(wall3);

        // Tower stump - tall box
        var towerGeo = new THREE.BoxGeometry(6, 14, 6);
        var towerMat = new THREE.MeshLambertMaterial({color: 0x6B5344});
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(-20, 7, -15);
        scene.add(tower);
        objects.push(tower);

        // Open rallying ground plateau
        var plateauGeo = new THREE.BoxGeometry(30, 1, 25);
        var plateauMat = new THREE.MeshLambertMaterial({color: 0x7CB342});
        var plateau = new THREE.Mesh(plateauGeo, plateauMat);
        plateau.position.set(0, 0.5, 5);
        scene.add(plateau);
        objects.push(plateau);

        // Highland infantry musket line - row of firing positions
        var pos1Geo = new THREE.BoxGeometry(2, 2, 3);
        var posMat = new THREE.MeshLambertMaterial({color: 0x9C8E7E});
        var pos1 = new THREE.Mesh(pos1Geo, posMat);
        pos1.position.set(10, 1, 15);
        scene.add(pos1);
        objects.push(pos1);

        var pos2 = new THREE.Mesh(pos1Geo, posMat);
        pos2.position.set(15, 1, 15);
        scene.add(pos2);
        objects.push(pos2);

        var pos3 = new THREE.Mesh(pos1Geo, posMat);
        pos3.position.set(20, 1, 15);
        scene.add(pos3);
        objects.push(pos3);

        var pos4 = new THREE.Mesh(pos1Geo, posMat);
        pos4.position.set(25, 1, 15);
        scene.add(pos4);
        objects.push(pos4);

        // Bonfire signal hill - sphere fire on box mound
        var moundGeo = new THREE.BoxGeometry(8, 3, 8);
        var moundMat = new THREE.MeshLambertMaterial({color: 0x8B6F47});
        var mound = new THREE.Mesh(moundGeo, moundMat);
        mound.position.set(-10, 1.5, 20);
        scene.add(mound);
        objects.push(mound);

        var fireGeo = new THREE.SphereGeometry(2, 8, 8);
        var fireMat = new THREE.MeshLambertMaterial({color: 0xFF6347});
        var fire = new THREE.Mesh(fireGeo, fireMat);
        fire.position.set(-10, 6, 20);
        scene.add(fire);
        objects.push(fire);

        // Broadsword training yard - box court with cylinder training post
        var courtGeo = new THREE.BoxGeometry(14, 0.5, 14);
        var courtMat = new THREE.MeshLambertMaterial({color: 0xA0826D});
        var court = new THREE.Mesh(courtGeo, courtMat);
        court.position.set(5, 0.25, -15);
        scene.add(court);
        objects.push(court);

        var postGeo = new THREE.CylinderGeometry(1, 1, 5, 8);
        var postMat = new THREE.MeshLambertMaterial({color: 0x654321});
        var post = new THREE.Mesh(postGeo, postMat);
        post.position.set(5, 2.5, -15);
        scene.add(post);
        objects.push(post);

        // Bagpipe signal tower - tall box tower
        var sigTowerGeo = new THREE.BoxGeometry(5, 16, 5);
        var sigTowerMat = new THREE.MeshLambertMaterial({color: 0x5A4A3A});
        var sigTower = new THREE.Mesh(sigTowerGeo, sigTowerMat);
        sigTower.position.set(25, 8, -20);
        scene.add(sigTower);
        objects.push(sigTower);

        // Sound projector sphere on tower top
        var projectorGeo = new THREE.SphereGeometry(2.5, 8, 8);
        var projectorMat = new THREE.MeshLambertMaterial({color: 0x8FBC8F});
        var projector = new THREE.Mesh(projectorGeo, projectorMat);
        projector.position.set(25, 18, -20);
        scene.add(projector);
        objects.push(projector);

        // Supply route cattle drovers track - winding box path sections
        var track1Geo = new THREE.BoxGeometry(3, 0.3, 8);
        var trackMat = new THREE.MeshLambertMaterial({color: 0x9B8B6F});
        var track1 = new THREE.Mesh(track1Geo, trackMat);
        track1.position.set(-20, 0.15, 10);
        scene.add(track1);
        objects.push(track1);

        var track2Geo = new THREE.BoxGeometry(3, 0.3, 8);
        var track2 = new THREE.Mesh(track2Geo, trackMat);
        track2.position.set(-5, 0.15, 15);
        scene.add(track2);
        objects.push(track2);

        var track3Geo = new THREE.BoxGeometry(3, 0.3, 8);
        var track3 = new THREE.Mesh(track3Geo, trackMat);
        track3.position.set(10, 0.15, 8);
        scene.add(track3);
        objects.push(track3);

        // Terrain cones for Scottish hill features
        var hill1Geo = new THREE.ConeGeometry(5, 6, 8);
        var hillMat = new THREE.MeshLambertMaterial({color: 0x6B8E23});
        var hill1 = new THREE.Mesh(hill1Geo, hillMat);
        hill1.position.set(-28, 3, -5);
        scene.add(hill1);
        objects.push(hill1);

        var hill2 = new THREE.Mesh(hill1Geo, hillMat);
        hill2.position.set(28, 3, 25);
        scene.add(hill2);
        objects.push(hill2);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for sun
        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(20, 25, 10);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animate bonfire glow
        for (var i = 0; i < objects.length; i++) {
            var obj = objects[i];
            if (obj.geometry instanceof THREE.SphereGeometry &&
                obj.material.color.getHex() === 0xFF6347) {
                obj.rotation.y += 0.02;
                obj.scale.x = 0.95 + 0.05 * Math.sin(Date.now() * 0.005);
                obj.scale.z = 0.95 + 0.05 * Math.sin(Date.now() * 0.005);
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
