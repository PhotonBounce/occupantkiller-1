window.IrvineBase = (function() {
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
        // Irvine Beach Park landing zone - box beach barriers
        var barrierGeo1 = new THREE.BoxGeometry(8, 2, 2);
        var barrierMat1 = new THREE.MeshLambertMaterial({ color: 0xccaa55 });
        var barrier1 = new THREE.Mesh(barrierGeo1, barrierMat1);
        barrier1.position.set(-25, 1, -28);
        scene.add(barrier1);
        objects.push(barrier1);

        var barrier2 = new THREE.Mesh(barrierGeo1, barrierMat1);
        barrier2.position.set(-10, 1, -25);
        scene.add(barrier2);
        objects.push(barrier2);

        // Irvine Beach Park - sphere anti-boat mines
        var mineGeo1 = new THREE.SphereGeometry(1.5, 16, 16);
        var mineMat1 = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var mine1 = new THREE.Mesh(mineGeo1, mineMat1);
        mine1.position.set(-20, 0.5, -20);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(mineGeo1, mineMat1);
        mine2.position.set(5, 0.5, -22);
        scene.add(mine2);
        objects.push(mine2);

        // Irvine Beach Park - LineSegments cable net
        var cableGeo = new THREE.BufferGeometry();
        var cablePoints = [
            -15, 2, -18,
            -15, 2, -10,
            -8, 2, -18,
            -8, 2, -10,
            -15, 2, -14,
            -8, 2, -14
        ];
        cableGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cablePoints), 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x888888, linewidth: 2 });
        var cableNet = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cableNet);
        objects.push(cableNet);

        // Scottish Maritime Museum - box Victorian engine shop
        var engineGeo = new THREE.BoxGeometry(12, 8, 10);
        var engineMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var engineShop = new THREE.Mesh(engineGeo, engineMat);
        engineShop.position.set(10, 4, -15);
        scene.add(engineShop);
        objects.push(engineShop);

        // Scottish Maritime Museum - cylinder harbor crane
        var craneGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 16);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var crane = new THREE.Mesh(craneGeo, craneMat);
        crane.position.set(20, 10, -10);
        scene.add(crane);
        objects.push(crane);

        // Scottish Maritime Museum - box workshops
        var workshopGeo = new THREE.BoxGeometry(8, 6, 8);
        var workshopMat = new THREE.MeshLambertMaterial({ color: 0xaa8866 });
        var workshop = new THREE.Mesh(workshopGeo, workshopMat);
        workshop.position.set(15, 3, 5);
        scene.add(workshop);
        objects.push(workshop);

        // Irvine town garrison - box concrete barriers
        var concreteGeo = new THREE.BoxGeometry(6, 3, 6);
        var concreteMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var concrete1 = new THREE.Mesh(concreteGeo, concreteMat);
        concrete1.position.set(-15, 1.5, 10);
        scene.add(concrete1);
        objects.push(concrete1);

        var concrete2 = new THREE.Mesh(concreteGeo, concreteMat);
        concrete2.position.set(0, 1.5, 15);
        scene.add(concrete2);
        objects.push(concrete2);

        // Irvine town garrison - cylinder guard tower
        var towerGeo = new THREE.CylinderGeometry(2.5, 2.5, 15, 16);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(-25, 7.5, 20);
        scene.add(tower);
        objects.push(tower);

        // Irvine town garrison - box sandbag positions
        var sandbagGeo = new THREE.BoxGeometry(5, 2, 5);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xccaa44 });
        var sandbag = new THREE.Mesh(sandbagGeo, sandbagMat);
        sandbag.position.set(20, 1, 18);
        scene.add(sandbag);
        objects.push(sandbag);

        // Ravenspark Hospital command post - box Victorian hospital
        var hospitalGeo = new THREE.BoxGeometry(14, 10, 12);
        var hospitalMat = new THREE.MeshLambertMaterial({ color: 0xdd9955 });
        var hospital = new THREE.Mesh(hospitalGeo, hospitalMat);
        hospital.position.set(5, 5, 25);
        scene.add(hospital);
        objects.push(hospital);

        // Ravenspark Hospital - box generator shed
        var genGeo = new THREE.BoxGeometry(6, 5, 6);
        var genMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var genShed = new THREE.Mesh(genGeo, genMat);
        genShed.position.set(18, 2.5, 28);
        scene.add(genShed);
        objects.push(genShed);

        // Ravenspark Hospital - cylinder comms mast
        var mastGeo = new THREE.CylinderGeometry(0.8, 0.8, 18, 12);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(25, 9, 30);
        scene.add(mast);
        objects.push(mast);

        // Eglinton Castle ruin stronghold - box Gothic ruin towers
        var ruinGeo = new THREE.BoxGeometry(10, 12, 10);
        var ruinMat = new THREE.MeshLambertMaterial({ color: 0x666644 });
        var ruin = new THREE.Mesh(ruinGeo, ruinMat);
        ruin.position.set(-20, 6, 30);
        scene.add(ruin);
        objects.push(ruin);

        // Eglinton Castle - box courtyard wall
        var wallGeo = new THREE.BoxGeometry(16, 4, 2);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x888866 });
        var wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(-10, 2, 35);
        scene.add(wall);
        objects.push(wall);

        // Eglinton Castle - cone turret caps
        var turretGeo = new THREE.ConeGeometry(2.5, 5, 12);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x555533 });
        var turret = new THREE.Mesh(turretGeo, turretMat);
        turret.position.set(-5, 15, 32);
        scene.add(turret);
        objects.push(turret);

        // Irvine river bridge demolition - box stone bridge
        var bridgeGeo = new THREE.BoxGeometry(20, 3, 4);
        var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
        var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
        bridge.position.set(0, 1.5, -5);
        scene.add(bridge);
        objects.push(bridge);

        // Irvine river bridge - sphere explosive charges
        var explosiveGeo = new THREE.SphereGeometry(1.2, 14, 14);
        var explosiveMat = new THREE.MeshLambertMaterial({ color: 0xbb3333 });
        var explosive1 = new THREE.Mesh(explosiveGeo, explosiveMat);
        explosive1.position.set(-8, 2, -4);
        scene.add(explosive1);
        objects.push(explosive1);

        var explosive2 = new THREE.Mesh(explosiveGeo, explosiveMat);
        explosive2.position.set(8, 2, -4);
        scene.add(explosive2);
        objects.push(explosive2);

        // Irvine river bridge - LineSegments detonator wire
        var detGeo = new THREE.BufferGeometry();
        var detPoints = [
            -8, 2, -4,
            -4, 3, 2,
            8, 2, -4,
            4, 3, 2
        ];
        detGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(detPoints), 3));
        var detMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 1 });
        var detWire = new THREE.LineSegments(detGeo, detMat);
        scene.add(detWire);
        objects.push(detWire);

        // Dundonald Castle summit OP - box medieval keep
        var keepGeo = new THREE.BoxGeometry(9, 11, 9);
        var keepMat = new THREE.MeshLambertMaterial({ color: 0x775544 });
        var keep = new THREE.Mesh(keepGeo, keepMat);
        keep.position.set(15, 5.5, 10);
        scene.add(keep);
        objects.push(keep);

        // Dundonald Castle - box courtyard
        var courtGeo = new THREE.BoxGeometry(12, 2, 12);
        var courtMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var court = new THREE.Mesh(courtGeo, courtMat);
        court.position.set(18, 1, 12);
        scene.add(court);
        objects.push(court);

        // Dundonald Castle - cylinder signal mast
        var signalGeo = new THREE.CylinderGeometry(1.2, 1.2, 16, 14);
        var signalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var signal = new THREE.Mesh(signalGeo, signalMat);
        signal.position.set(28, 8, 15);
        scene.add(signal);
        objects.push(signal);

        // Shewalton Moss ambush - box boggy lowland track
        var trackGeo = new THREE.BoxGeometry(20, 1.5, 3);
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var track = new THREE.Mesh(trackGeo, trackMat);
        track.position.set(-5, 0.75, -35);
        scene.add(track);
        objects.push(track);

        // Shewalton Moss - sphere IED charges
        var iedGeo = new THREE.SphereGeometry(1.3, 15, 15);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x994400 });
        var ied1 = new THREE.Mesh(iedGeo, iedMat);
        ied1.position.set(-15, 1, -32);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeo, iedMat);
        ied2.position.set(10, 1, -38);
        scene.add(ied2);
        objects.push(ied2);

        // Shewalton Moss - LineSegments tripwire grid
        var tripGeo = new THREE.BufferGeometry();
        var tripPoints = [
            -20, 1.5, -35,
            20, 1.5, -35,
            -20, 1.5, -30,
            20, 1.5, -30,
            -15, 1.5, -40,
            15, 1.5, -40
        ];
        tripGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tripPoints), 3));
        var tripMat = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 1 });
        var tripWire = new THREE.LineSegments(tripGeo, tripMat);
        scene.add(tripWire);
        objects.push(tripWire);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for shadows
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 20, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation loop - objects can be animated here if needed
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
