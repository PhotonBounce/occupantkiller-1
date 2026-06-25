window.Newgrange = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var group = null;
    var beamMesh = null;
    var beamOpacity = 0;
    var beamDirection = 1;
    var beamMaterial = null;

    var OFFSET_X = 17320;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMesh(geometry, color, opacity) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        if (opacity !== undefined && opacity < 1) {
            mat.transparent = true;
            mat.opacity = opacity;
        }
        return new THREE.Mesh(geometry, mat);
    }

    function buildMound() {
        var moundTop = makeMesh(
            new THREE.CylinderGeometry(28, 28, 13, 16),
            0x4A8A4A
        );
        moundTop.position.set(0, 6.5, 0);
        group.add(moundTop);

        var baseRing = makeMesh(
            new THREE.CylinderGeometry(30, 30, 4, 16),
            0x888888
        );
        baseRing.position.set(0, 2, 0);
        group.add(baseRing);
    }

    function buildQuartzFacing() {
        var facing = makeMesh(
            new THREE.BoxGeometry(24, 10, 3),
            0xF0F0F0
        );
        facing.position.set(0, 5, -29.5);
        group.add(facing);

        var i;
        for (i = 0; i < 12; i++) {
            var band = makeMesh(
                new THREE.BoxGeometry(1, 8, 0.3),
                0x333333
            );
            band.position.set(-11 + i * 2, 5, -28.0);
            group.add(band);
        }
    }

    function buildEntranceStone() {
        var kerbstone = makeMesh(
            new THREE.BoxGeometry(4, 2, 1.5),
            0xC8C0B0
        );
        kerbstone.position.set(0, 1, -31.5);
        group.add(kerbstone);

        var radii = [1.8, 1.2, 0.6];
        var j;
        for (j = 0; j < 3; j++) {
            var spiral = makeMesh(
                new THREE.CylinderGeometry(radii[j], radii[j], 0.2, 12),
                0xB8B0A0
            );
            spiral.rotation.x = Math.PI / 2;
            spiral.position.set(0, 1, -32.0 - j * 0.05);
            group.add(spiral);
        }
    }

    function buildPassage() {
        var passage = makeMesh(
            new THREE.BoxGeometry(3, 3, 19),
            0x2A2A2A
        );
        passage.position.set(0, 1.5, -20.5);
        group.add(passage);

        var sill = makeMesh(
            new THREE.BoxGeometry(3.5, 0.5, 2),
            0xC0B8A0
        );
        sill.position.set(0, 0.25, -30.5);
        group.add(sill);

        var roofbox = makeMesh(
            new THREE.BoxGeometry(2, 1, 2),
            0x1A1A1A
        );
        roofbox.position.set(0, 3.5, -30.5);
        group.add(roofbox);
    }

    function buildBeam() {
        var geo = new THREE.BoxGeometry(0.8, 0.8, 19);
        beamMaterial = new THREE.MeshLambertMaterial({
            color: 0xFFDD44,
            transparent: true,
            opacity: 0
        });
        beamMesh = new THREE.Mesh(geo, beamMaterial);
        beamMesh.position.set(0, 1.5, -20.5);
        group.add(beamMesh);
    }

    function buildKerbstones() {
        var count = 20;
        var radius = 30;
        var k;
        for (k = 0; k < count; k++) {
            var angle = (k / count) * Math.PI * 2;
            var kerb = makeMesh(
                new THREE.BoxGeometry(2, 1.5, 0.8),
                0xC0B8A0
            );
            var kx = Math.sin(angle) * radius;
            var kz = Math.cos(angle) * radius;
            kerb.position.set(kx, 0.75, kz);
            kerb.rotation.y = -angle;
            if (k % 3 === 0) {
                kerb.rotation.z = 0.08;
            } else if (k % 3 === 1) {
                kerb.rotation.z = -0.06;
            }
            group.add(kerb);
        }
    }

    function buildStandingStones() {
        var count = 12;
        var radius = 40;
        var arcSpan = (280 / 360) * Math.PI * 2;
        var arcStart = -arcSpan / 2 + Math.PI;
        var s;
        for (s = 0; s < count; s++) {
            var angle = arcStart + (s / (count - 1)) * arcSpan;
            var stone = makeMesh(
                new THREE.BoxGeometry(1, 8, 0.5),
                0x888878
            );
            var sx = Math.sin(angle) * radius;
            var sz = Math.cos(angle) * radius;
            stone.position.set(sx, 4, sz);
            stone.rotation.y = -angle;
            group.add(stone);
        }
    }

    function buildLandscape() {
        var fieldColors = [0x4A9A4A, 0xD4C5A9, 0x8B8B30, 0x4A9A4A, 0xD4C5A9, 0x8B8B30];
        var fieldOffsets = [
            [60, 0],
            [85, 20],
            [110, -15],
            [60, -30],
            [85, -50],
            [110, 30]
        ];
        var f;
        for (f = 0; f < 6; f++) {
            var field = makeMesh(
                new THREE.BoxGeometry(20, 0.3, 15),
                fieldColors[f]
            );
            field.position.set(fieldOffsets[f][0], -0.15, fieldOffsets[f][1]);
            group.add(field);
        }

        var riverOffsets = [
            [50, -10],
            [70, 15],
            [90, -5]
        ];
        var r;
        for (r = 0; r < 3; r++) {
            var river = makeMesh(
                new THREE.BoxGeometry(8, 0.5, 25),
                0x1B6CA8
            );
            river.position.set(riverOffsets[r][0], 0, riverOffsets[r][1]);
            group.add(river);
        }

        var hedgeOffsets = [
            [65, 10],
            [90, -20],
            [55, -40]
        ];
        var h;
        for (h = 0; h < 3; h++) {
            var hedge = makeMesh(
                new THREE.BoxGeometry(1, 3, 20),
                0x1A4A1A
            );
            hedge.position.set(hedgeOffsets[h][0], 1.5, hedgeOffsets[h][1]);
            group.add(hedge);
        }
    }

    function build() {
        group = new THREE.Group();
        group.position.set(OFFSET_X, 0, OFFSET_Z);

        buildMound();
        buildQuartzFacing();
        buildEntranceStone();
        buildPassage();
        buildBeam();
        buildKerbstones();
        buildStandingStones();
        buildLandscape();

        scene.add(group);
    }

    function update(delta) {
        if (!beamMesh || !beamMaterial) {
            return;
        }

        beamOpacity += beamDirection * delta * 0.3;

        if (beamOpacity >= 1) {
            beamOpacity = 1;
            beamDirection = -1;
        } else if (beamOpacity <= 0) {
            beamOpacity = 0;
            beamDirection = 1;
        }

        beamMaterial.opacity = beamOpacity;
    }

    function reset() {
        if (group && scene) {
            scene.remove(group);
        }
        group = null;
        beamMesh = null;
        beamMaterial = null;
        beamOpacity = 0;
        beamDirection = 1;
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
