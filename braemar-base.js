window.BraemarBase = (function() {
    'use strict';

    var baseX = 580;
    var baseZ = 640;

    function createcastle() {
        var group = new THREE.Group();
        var roundtower = new THREE.Mesh(
            new THREE.CylinderGeometry(4, 4, 16, 32),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        roundtower.position.set(0, 8, 0);
        group.add(roundtower);

        var keepwing = new THREE.Mesh(
            new THREE.BoxGeometry(6, 14, 4),
            new THREE.MeshLambertMaterial({ color: 0x999999 })
        );
        keepwing.position.set(5, 7, 0);
        group.add(keepwing);

        group.position.set(baseX, 0, baseZ);
        return group;
    }

    function creategatherings() {
        var group = new THREE.Group();
        var outerwall = new THREE.Mesh(
            new THREE.BoxGeometry(20, 1, 20),
            new THREE.MeshLambertMaterial({ color: 0x777777 })
        );
        outerwall.position.set(0, 0.5, 0);
        group.add(outerwall);

        group.position.set(baseX + 40, 0, baseZ - 50);
        return group;
    }

    function createcheckpoint() {
        var group = new THREE.Group();

        var gate1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 8, 1),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        gate1.position.set(-4, 4, 0);
        group.add(gate1);

        var gate2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 8, 1),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        gate2.position.set(4, 4, 0);
        group.add(gate2);

        var crossbar = new THREE.Mesh(
            new THREE.BoxGeometry(8, 1, 1),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        crossbar.position.set(0, 8, 0);
        group.add(crossbar);

        group.position.set(baseX - 60, 0, baseZ + 40);
        return group;
    }

    function createradar() {
        var group = new THREE.Group();

        var plinth = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 4, 32),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        plinth.position.set(0, 2, 0);
        group.add(plinth);

        var radome = new THREE.Mesh(
            new THREE.SphereGeometry(8, 32, 32),
            new THREE.MeshLambertMaterial({ color: 0xffffff })
        );
        radome.position.set(0, 10, 0);
        group.add(radome);

        group.position.set(baseX + 80, 0, baseZ - 80);
        return group;
    }

    function createhelicopter() {
        var group = new THREE.Group();

        var hangar = new THREE.Mesh(
            new THREE.BoxGeometry(12, 8, 10),
            new THREE.MeshLambertMaterial({ color: 0x555555 })
        );
        hangar.position.set(0, 4, 0);
        group.add(hangar);

        var hpad = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.5, 20),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        hpad.position.set(0, 0.25, -15);
        group.add(hpad);

        group.position.set(baseX - 80, 0, baseZ + 80);
        return group;
    }

    function createartillery() {
        var group = new THREE.Group();

        var platform = new THREE.Mesh(
            new THREE.BoxGeometry(8, 2, 8),
            new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        platform.position.set(0, 1, 0);
        group.add(platform);

        var howitzer = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.6, 6, 16),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        howitzer.position.set(0, 3, 0);
        howitzer.rotation.z = Math.PI / 6;
        group.add(howitzer);

        group.position.set(baseX + 60, 0, baseZ + 60);
        return group;
    }

    function createboulders() {
        var group = new THREE.Group();

        var sizes = [
            { w: 4, h: 3, d: 3, x: -15, z: -15 },
            { w: 3, h: 4, d: 3, x: -5, z: -18 },
            { w: 5, h: 3, d: 4, x: 5, z: -20 },
            { w: 3, h: 3, d: 5, x: 15, z: -15 },
            { w: 4, h: 2, d: 3, x: -18, z: 5 },
            { w: 3, h: 5, d: 3, x: 0, z: 12 },
            { w: 4, h: 3, d: 4, x: 18, z: 8 },
            { w: 3, h: 4, d: 3, x: 12, z: 18 }
        ];

        var i;
        for (i = 0; i < sizes.length; i = i + 1) {
            var boulder = new THREE.Mesh(
                new THREE.BoxGeometry(sizes[i].w, sizes[i].h, sizes[i].d),
                new THREE.MeshLambertMaterial({ color: 0x888888 })
            );
            boulder.position.set(sizes[i].x, sizes[i].h / 2, sizes[i].z);
            group.add(boulder);
        }

        group.position.set(baseX - 40, 0, baseZ - 40);
        return group;
    }

    function createtunnel() {
        var group = new THREE.Group();

        var tunnelmouth = new THREE.Mesh(
            new THREE.BoxGeometry(6, 6, 4),
            new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        tunnelmouth.position.set(0, 3, 0);
        group.add(tunnelmouth);

        var tunnelinterior = new THREE.Mesh(
            new THREE.BoxGeometry(5.5, 5.5, 3.5),
            new THREE.MeshLambertMaterial({ color: 0x111111 })
        );
        tunnelinterior.position.set(0, 3, 0.5);
        group.add(tunnelinterior);

        group.position.set(baseX + 100, 0, baseZ - 100);
        return group;
    }

    function buildscene() {
        var scene = new THREE.Scene();
        scene.add(createcastle());
        scene.add(creategatherings());
        scene.add(createcheckpoint());
        scene.add(createradar());
        scene.add(createhelicopter());
        scene.add(createartillery());
        scene.add(createboulders());
        scene.add(createtunnel());
        return scene;
    }

    return {
        buildscene: buildscene
    };

}());
