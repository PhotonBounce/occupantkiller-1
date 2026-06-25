window.StratfordOlympic = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function mk(geo, color) {
        var m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
        objects.push(m);
        return m;
    }

    function build() {
        var ox = 11920;

        // Ground
        var g = mk(new THREE.BoxGeometry(500, 1, 400), 0x4a7c3f);
        g.position.set(ox, -0.5, 0);
        scene.add(g);

        // === London Stadium (Olympic) ===
        // Bowl base
        var bowl = mk(new THREE.CylinderGeometry(40, 42, 3, 16), 0xc0c0c0);
        bowl.position.set(ox - 80, 1.5, 0);
        scene.add(bowl);
        // Inner pitch (green)
        var pitch = mk(new THREE.CylinderGeometry(30, 30, 1, 16), 0x2d7a2d);
        pitch.position.set(ox - 80, 3, 0);
        scene.add(pitch);
        // Running track (red ring)
        var track = mk(new THREE.CylinderGeometry(34, 34, 0.8, 16), 0xcc4400);
        track.position.set(ox - 80, 3.2, 0);
        scene.add(track);
        // Inner track (green)
        var itrack = mk(new THREE.CylinderGeometry(30, 30, 0.9, 16), 0x2d7a2d);
        itrack.position.set(ox - 80, 3.3, 0);
        scene.add(itrack);
        // Stands tiers
        for (var t = 0; t < 3; t++) {
            var tier = mk(new THREE.CylinderGeometry(40 + t * 5, 42 + t * 5, 4, 16), 0xeeeeee);
            tier.position.set(ox - 80, 4 + t * 4, 0);
            scene.add(tier);
        }
        // Roof canopy
        var roof = mk(new THREE.CylinderGeometry(52, 48, 2, 16), 0xdddddd);
        roof.position.set(ox - 80, 17, 0);
        scene.add(roof);
        // 4 floodlight pylons
        var pylonPos = [[-60, -30], [-100, -30], [-60, 30], [-100, 30]];
        for (var pi = 0; pi < 4; pi++) {
            var pyl = mk(new THREE.CylinderGeometry(0.8, 1, 28, 6), 0x888888);
            pyl.position.set(ox + pylonPos[pi][0], 14, pylonPos[pi][1]);
            scene.add(pyl);
            var head = mk(new THREE.BoxGeometry(4, 1, 2), 0xffffcc);
            head.position.set(ox + pylonPos[pi][0], 28, pylonPos[pi][1]);
            scene.add(head);
        }

        // === Aquatics Centre ===
        // Main body
        var aq = mk(new THREE.BoxGeometry(45, 8, 25), 0x3a6ea8);
        aq.position.set(ox + 20, 4, -60);
        scene.add(aq);
        // Undulating wave roof (layered offset boxes)
        for (var wi = 0; wi < 6; wi++) {
            var wave = mk(new THREE.BoxGeometry(45, 1.5, 25), 0x5588bb);
            wave.position.set(ox + 20, 8 + Math.sin(wi * 1.2) * 2 + wi * 0.5, -60);
            scene.add(wave);
        }
        // Wing extensions
        var wl = mk(new THREE.BoxGeometry(10, 5, 40), 0x4477aa);
        wl.position.set(ox - 2, 2.5, -60);
        scene.add(wl);
        var wr = mk(new THREE.BoxGeometry(10, 5, 40), 0x4477aa);
        wr.position.set(ox + 42, 2.5, -60);
        scene.add(wr);

        // === ArcelorMittal Orbit ===
        // Main tower
        var orb1 = mk(new THREE.CylinderGeometry(1.5, 1.5, 40, 8), 0xcc2200);
        orb1.position.set(ox + 60, 20, -20);
        scene.add(orb1);
        // Spiraling sections (offset cylinders)
        var spiralOffsets = [
            [3, 5, 0], [-3, 8, 2], [5, 12, -2], [-4, 16, 3],
            [3, 20, -1], [-5, 24, 2], [4, 28, -3], [-2, 32, 1]
        ];
        for (var si = 0; si < spiralOffsets.length; si++) {
            var so = spiralOffsets[si];
            var seg = mk(new THREE.CylinderGeometry(0.8, 0.8, 6, 6), 0xdd3300);
            seg.position.set(ox + 60 + so[0], so[1], -20 + so[2]);
            scene.add(seg);
        }
        // Observation pod
        var pod = mk(new THREE.SphereGeometry(4, 10, 8), 0xee4400);
        pod.position.set(ox + 60, 42, -20);
        scene.add(pod);
        // Second pod (slide start)
        var pod2 = mk(new THREE.SphereGeometry(3, 8, 6), 0xff5500);
        pod2.position.set(ox + 63, 32, -18);
        scene.add(pod2);

        // === Velodrome ===
        var velo = mk(new THREE.CylinderGeometry(22, 22, 6, 12), 0x8B6914);
        velo.position.set(ox + 80, 3, 60);
        scene.add(velo);
        var veloRoof = mk(new THREE.CylinderGeometry(24, 20, 3, 12), 0xc8a020);
        veloRoof.position.set(ox + 80, 7.5, 60);
        scene.add(veloRoof);
        // Inner track
        var vtk = mk(new THREE.CylinderGeometry(16, 16, 1, 12), 0xdda030);
        vtk.position.set(ox + 80, 3.5, 60);
        scene.add(vtk);
        var vtki = mk(new THREE.CylinderGeometry(10, 10, 1.1, 12), 0x3a8a3a);
        vtki.position.set(ox + 80, 3.6, 60);
        scene.add(vtki);

        // === Westfield Stratford ===
        // Main mall
        var wf = mk(new THREE.BoxGeometry(60, 12, 30), 0xdddddd);
        wf.position.set(ox + 40, 6, 100);
        scene.add(wf);
        // Atrium glass
        var atr = mk(new THREE.BoxGeometry(20, 15, 30), 0x88bbdd);
        atr.position.set(ox + 40, 7.5, 100);
        scene.add(atr);
        // Anchor stores
        for (var as = 0; as < 3; as++) {
            var anch = mk(new THREE.BoxGeometry(18, 14, 28), 0xcccccc);
            anch.position.set(ox + 10 + as * 22, 7, 100);
            scene.add(anch);
        }
        // Entry canopy
        var can = mk(new THREE.BoxGeometry(60, 1, 6), 0xaabbcc);
        can.position.set(ox + 40, 14, 86);
        scene.add(can);

        // Park waterway
        var water = mk(new THREE.BoxGeometry(8, 0.5, 200), 0x3366aa);
        water.position.set(ox - 20, 0.3, 0);
        scene.add(water);

        // Trees around park
        var treePts = [
            [ox + 120, -40], [ox + 130, 40], [ox - 130, -50], [ox - 130, 50],
            [ox + 0, -100], [ox + 0, 100]
        ];
        for (var ti = 0; ti < treePts.length; ti++) {
            var tr = mk(new THREE.CylinderGeometry(0.8, 1, 6, 6), 0x5a3a1a);
            tr.position.set(treePts[ti][0], 3, treePts[ti][1]);
            scene.add(tr);
            var tc = mk(new THREE.SphereGeometry(4, 8, 6), 0x2d5a1b);
            tc.position.set(treePts[ti][0], 9, treePts[ti][1]);
            scene.add(tc);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) { }

    function reset() {
        for (var i = 0; i < objects.length; i++) scene.remove(objects[i]);
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
