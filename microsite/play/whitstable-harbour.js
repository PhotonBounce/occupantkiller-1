window.WhitstableHarbour = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 10680;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildHarbourWall() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x888880 });
        var segments = 18;
        var radius = 120;
        var cx = X_OFFSET + 0;
        var cz = -80;
        for (var i = 0; i < segments; i++) {
            var angle = (Math.PI * 0.6) * (i / (segments - 1)) - Math.PI * 0.3;
            var x = cx + Math.sin(angle) * radius;
            var z = cz + Math.cos(angle) * radius - radius;
            var geo = new THREE.BoxGeometry(8, 5, 12);
            var mesh = new THREE.Mesh(geo, wallMat);
            mesh.position.set(x, 2.5, z);
            mesh.rotation.y = -angle;
            addMesh(mesh);
        }
        var capGeo = new THREE.BoxGeometry(244, 1.5, 10);
        var cap = new THREE.Mesh(capGeo, new THREE.MeshLambertMaterial({ color: 0x999990 }));
        cap.position.set(cx, 5.75, cz - radius + 4);
        addMesh(cap);
    }

    function buildFishMarketShed() {
        var mat = new THREE.MeshLambertMaterial({ color: 0xbbbbaa });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var base = new THREE.Mesh(new THREE.BoxGeometry(40, 6, 20), mat);
        base.position.set(X_OFFSET + 30, 3, -10);
        addMesh(base);
        var roof = new THREE.Mesh(new THREE.BoxGeometry(42, 1, 22), roofMat);
        roof.position.set(X_OFFSET + 30, 6.5, -10);
        addMesh(roof);
        var ridgeGeo = new THREE.CylinderGeometry(0.5, 0.5, 42, 6);
        var ridge = new THREE.Mesh(ridgeGeo, roofMat);
        ridge.rotation.z = Math.PI / 2;
        ridge.position.set(X_OFFSET + 30, 9, -10);
        addMesh(ridge);
        var doorMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
        for (var d = 0; d < 3; d++) {
            var door = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.5), doorMat);
            door.position.set(X_OFFSET + 18 + d * 8, 2.5, -0.25);
            addMesh(door);
        }
    }

    function buildIceHouse() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x9a9090 });
        var roofMat2 = new THREE.MeshLambertMaterial({ color: 0x776655 });
        var body = new THREE.Mesh(new THREE.CylinderGeometry(8, 9, 12, 12), stoneMat);
        body.position.set(X_OFFSET + 70, 6, -15);
        addMesh(body);
        var cone = new THREE.Mesh(new THREE.ConeGeometry(8.5, 6, 12), roofMat2);
        cone.position.set(X_OFFSET + 70, 15, -15);
        addMesh(cone);
        var door2 = new THREE.Mesh(new THREE.BoxGeometry(3, 5, 1), new THREE.MeshLambertMaterial({ color: 0x443322 }));
        door2.position.set(X_OFFSET + 70, 2.5, -6.5);
        addMesh(door2);
    }

    function buildCrabPots() {
        var potMat = new THREE.MeshLambertMaterial({ color: 0x886644 });
        var ropeMat = new THREE.MeshLambertMaterial({ color: 0xddcc99 });
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 6; col++) {
                var px = X_OFFSET + 50 + col * 5;
                var pz = -25 + row * 5;
                var pot = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), potMat);
                pot.position.set(px, row * 2 + 1, pz);
                addMesh(pot);
                var rope = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 2, 4), ropeMat);
                rope.position.set(px, row * 2 + 2.5, pz);
                addMesh(rope);
            }
        }
    }

    function buildOysterBeds() {
        var mudMat = new THREE.MeshLambertMaterial({ color: 0x887766 });
        var stakeMat = new THREE.MeshLambertMaterial({ color: 0x996633 });
        var flat = new THREE.Mesh(new THREE.BoxGeometry(200, 0.4, 60), mudMat);
        flat.position.set(X_OFFSET + 200, 0.2, 80);
        addMesh(flat);
        for (var or = 0; or < 5; or++) {
            for (var oc = 0; oc < 10; oc++) {
                var sx = X_OFFSET + 120 + oc * 18;
                var sz = 60 + or * 12;
                var stake = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 5), stakeMat);
                stake.position.set(sx, 0.75, sz);
                addMesh(stake);
            }
        }
        var cordMat = new THREE.MeshLambertMaterial({ color: 0xbbaa88 });
        for (var cr = 0; cr < 5; cr++) {
            for (var cc = 0; cc < 9; cc++) {
                var c1x = X_OFFSET + 120 + cc * 18;
                var c2x = X_OFFSET + 120 + (cc + 1) * 18;
                var cz2 = 60 + cr * 12;
                var cx2 = (c1x + c2x) / 2;
                var cord = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 18, 4), cordMat);
                cord.rotation.z = Math.PI / 2;
                cord.position.set(cx2, 1.2, cz2);
                addMesh(cord);
            }
        }
    }

    function buildWeatherboardCottages() {
        var boardMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var windowMat = new THREE.MeshLambertMaterial({ color: 0xeeeedd });
        var roofMat3 = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var chimMat = new THREE.MeshLambertMaterial({ color: 0xaa8866 });
        for (var h = 0; h < 7; h++) {
            var hx = X_OFFSET - 80 + h * 22;
            var hz = 30;
            var house = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 14), boardMat);
            house.position.set(hx, 4, hz);
            addMesh(house);
            var hroof = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 16), roofMat3);
            hroof.position.set(hx, 8.5, hz);
            addMesh(hroof);
            var hridge = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 20, 5), roofMat3);
            hridge.rotation.z = Math.PI / 2;
            hridge.position.set(hx, 11.5, hz);
            addMesh(hridge);
            var gableL = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 16), boardMat);
            gableL.position.set(hx - 9.5, 11, hz);
            addMesh(gableL);
            var gableR = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 16), boardMat);
            gableR.position.set(hx + 9.5, 11, hz);
            addMesh(gableR);
            var win1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 2), windowMat);
            win1.position.set(hx - 4, 5, hz - 7.1);
            addMesh(win1);
            var win2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2, 2), windowMat);
            win2.position.set(hx + 4, 5, hz - 7.1);
            addMesh(win2);
            var chim = new THREE.Mesh(new THREE.BoxGeometry(2, 5, 2), chimMat);
            chim.position.set(hx + 5, 14, hz);
            addMesh(chim);
        }
    }

    function buildIslandWall() {
        var wallMat2 = new THREE.MeshLambertMaterial({ color: 0x999988 });
        var capMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        var wallLen = 400;
        var wall = new THREE.Mesh(new THREE.BoxGeometry(wallLen, 3, 4), wallMat2);
        wall.position.set(X_OFFSET + 20, 1.5, 12);
        addMesh(wall);
        var wallCap = new THREE.Mesh(new THREE.BoxGeometry(wallLen, 0.5, 4.5), capMat);
        wallCap.position.set(X_OFFSET + 20, 3.25, 12);
        addMesh(wallCap);
        var shingleMat = new THREE.MeshLambertMaterial({ color: 0xbbaa99 });
        var shingle = new THREE.Mesh(new THREE.BoxGeometry(wallLen, 0.6, 30), shingleMat);
        shingle.position.set(X_OFFSET + 20, 0.3, 28);
        addMesh(shingle);
        for (var b = 0; b < 20; b++) {
            var stone = new THREE.Mesh(new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 5, 4), shingleMat);
            stone.position.set(X_OFFSET - 180 + b * 20, 0.5, 22 + (b % 3) * 4);
            addMesh(stone);
        }
    }

    function buildOldNeptune() {
        var pubMat = new THREE.MeshLambertMaterial({ color: 0x222211 });
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        var roofMat4 = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var signMat = new THREE.MeshLambertMaterial({ color: 0x1133aa });
        var pub = new THREE.Mesh(new THREE.BoxGeometry(26, 7, 16), pubMat);
        pub.position.set(X_OFFSET - 30, 3.5, 20);
        addMesh(pub);
        var pubRoof = new THREE.Mesh(new THREE.BoxGeometry(28, 1, 18), roofMat4);
        pubRoof.position.set(X_OFFSET - 30, 7.5, 20);
        addMesh(pubRoof);
        var pubRidge2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 28, 5), roofMat4);
        pubRidge2.rotation.z = Math.PI / 2;
        pubRidge2.position.set(X_OFFSET - 30, 10, 20);
        addMesh(pubRidge2);
        var pubGableL = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 18), pubMat);
        pubGableL.position.set(X_OFFSET - 43, 9.5, 20);
        addMesh(pubGableL);
        var pubGableR = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 18), pubMat);
        pubGableR.position.set(X_OFFSET - 17, 9.5, 20);
        addMesh(pubGableR);
        var door3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 3), whiteMat);
        door3.position.set(X_OFFSET - 30, 2.5, 12.2);
        addMesh(door3);
        var win3 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2, 2.5), whiteMat);
        win3.position.set(X_OFFSET - 37, 4, 12.2);
        addMesh(win3);
        var win4 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2, 2.5), whiteMat);
        win4.position.set(X_OFFSET - 23, 4, 12.2);
        addMesh(win4);
        var signPost = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 5, 5), new THREE.MeshLambertMaterial({ color: 0x553311 }));
        signPost.position.set(X_OFFSET - 44, 6.5, 12);
        addMesh(signPost);
        var signBoard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3, 6), signMat);
        signBoard.position.set(X_OFFSET - 44, 9.5, 12);
        addMesh(signBoard);
        var signText = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 5), whiteMat);
        signText.position.set(X_OFFSET - 44, 9.5, 12);
        addMesh(signText);
        var chimPub = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshLambertMaterial({ color: 0xbb9977 }));
        chimPub.position.set(X_OFFSET - 38, 12, 20);
        addMesh(chimPub);
    }

    function buildHarbourLights() {
        var lightPoleMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
        var lightHeadMat = new THREE.MeshLambertMaterial({ color: 0xffffaa });
        for (var lp = 0; lp < 5; lp++) {
            var lpx = X_OFFSET - 60 + lp * 40;
            var lpz = 8;
            var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 10, 6), lightPoleMat);
            pole.position.set(lpx, 5, lpz);
            addMesh(pole);
            var head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 5), lightHeadMat);
            head.position.set(lpx, 10.5, lpz);
            addMesh(head);
        }
    }

    function buildBoats() {
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x334455 });
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0xddccaa });
        var mastMat = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
        for (var bt = 0; bt < 4; bt++) {
            var bx = X_OFFSET - 10 + bt * 28;
            var bz = -50 - bt * 10;
            var hull = new THREE.Mesh(new THREE.BoxGeometry(12, 2.5, 5), hullMat);
            hull.position.set(bx, 1.25, bz);
            addMesh(hull);
            var cabin = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 4), cabinMat);
            cabin.position.set(bx + 2, 4, bz);
            addMesh(cabin);
            var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 12, 5), mastMat);
            mast.position.set(bx - 3, 8.5, bz);
            addMesh(mast);
        }
    }

    function build() {
        buildHarbourWall();
        buildFishMarketShed();
        buildIceHouse();
        buildCrabPots();
        buildOysterBeds();
        buildWeatherboardCottages();
        buildIslandWall();
        buildOldNeptune();
        buildHarbourLights();
        buildBoats();
    }

    function update(delta) {
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
