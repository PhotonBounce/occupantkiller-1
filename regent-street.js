window.RegentStreet = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 11720;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, mat) {
        return new THREE.Mesh(geo, mat);
    }

    function lambertMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function buildRecentStreetCurve() {
        var roadMat = lambertMat(0x555555);
        var stoneMat = lambertMat(0xf0ece0);
        var pilasterMat = lambertMat(0xe8e4d8);
        var corniceColor = lambertMat(0xd8d4c8);
        var windowMat = lambertMat(0x88aacc);
        var i, mesh, geo, x, z, angle;

        // Road segments following a gentle arc
        var numSegments = 12;
        var arcRadius = 300;
        var arcStartAngle = -0.4;
        var arcEndAngle = 0.4;
        for (i = 0; i < numSegments; i++) {
            angle = arcStartAngle + (arcEndAngle - arcStartAngle) * (i / (numSegments - 1));
            x = X_OFFSET + arcRadius * Math.sin(angle);
            z = -200 + arcRadius * (1 - Math.cos(angle));
            geo = new THREE.BoxGeometry(30, 0.5, 22);
            mesh = makeMesh(geo, roadMat);
            mesh.position.set(x, 0.25, z);
            mesh.rotation.y = -angle;
            addObj(mesh);
        }

        // Nash facades — left and right side, 6 buildings each
        var numBuildings = 6;
        for (i = 0; i < numBuildings; i++) {
            angle = arcStartAngle + (arcEndAngle - arcStartAngle) * (i / (numBuildings - 1));
            x = X_OFFSET + arcRadius * Math.sin(angle);
            z = -200 + arcRadius * (1 - Math.cos(angle));
            var buildW = 28;
            var buildH = 18;
            var buildD = 10;
            var sideOffset = 16;
            var rot = -angle;

            // Left facade
            geo = new THREE.BoxGeometry(buildW, buildH, buildD);
            mesh = makeMesh(geo, stoneMat);
            mesh.position.set(
                x + Math.cos(rot + Math.PI / 2) * sideOffset,
                buildH / 2,
                z + Math.sin(rot + Math.PI / 2) * sideOffset
            );
            mesh.rotation.y = rot;
            addObj(mesh);

            // Left cornice
            geo = new THREE.BoxGeometry(buildW + 1, 1.5, buildD + 0.5);
            mesh = makeMesh(geo, corniceColor);
            mesh.position.set(
                x + Math.cos(rot + Math.PI / 2) * sideOffset,
                buildH + 0.75,
                z + Math.sin(rot + Math.PI / 2) * sideOffset
            );
            mesh.rotation.y = rot;
            addObj(mesh);

            // Left pilasters (4 per building)
            var j;
            for (j = 0; j < 4; j++) {
                var pOffset = -buildW / 2 + (j + 1) * (buildW / 5);
                geo = new THREE.BoxGeometry(1.2, buildH, 1.5);
                mesh = makeMesh(geo, pilasterMat);
                mesh.position.set(
                    x + Math.cos(rot + Math.PI / 2) * sideOffset + Math.cos(rot) * pOffset,
                    buildH / 2,
                    z + Math.sin(rot + Math.PI / 2) * sideOffset + Math.sin(rot) * pOffset
                );
                mesh.rotation.y = rot;
                addObj(mesh);
            }

            // Right facade
            geo = new THREE.BoxGeometry(buildW, buildH, buildD);
            mesh = makeMesh(geo, stoneMat);
            mesh.position.set(
                x - Math.cos(rot + Math.PI / 2) * sideOffset,
                buildH / 2,
                z - Math.sin(rot + Math.PI / 2) * sideOffset
            );
            mesh.rotation.y = rot;
            addObj(mesh);

            // Right cornice
            geo = new THREE.BoxGeometry(buildW + 1, 1.5, buildD + 0.5);
            mesh = makeMesh(geo, corniceColor);
            mesh.position.set(
                x - Math.cos(rot + Math.PI / 2) * sideOffset,
                buildH + 0.75,
                z - Math.sin(rot + Math.PI / 2) * sideOffset
            );
            mesh.rotation.y = rot;
            addObj(mesh);

            // Right pilasters
            for (j = 0; j < 4; j++) {
                var pOffsetR = -buildW / 2 + (j + 1) * (buildW / 5);
                geo = new THREE.BoxGeometry(1.2, buildH, 1.5);
                mesh = makeMesh(geo, pilasterMat);
                mesh.position.set(
                    x - Math.cos(rot + Math.PI / 2) * sideOffset + Math.cos(rot) * pOffsetR,
                    buildH / 2,
                    z - Math.sin(rot + Math.PI / 2) * sideOffset + Math.sin(rot) * pOffsetR
                );
                mesh.rotation.y = rot;
                addObj(mesh);
            }

            // Windows on both sides
            var winColors = [0x88aacc, 0x99bbdd];
            var wc = winColors[i % 2];
            var winMat = lambertMat(wc);
            for (j = 0; j < 3; j++) {
                var wOffset = -buildW / 2 + (j + 1) * (buildW / 4);
                // Left building windows
                geo = new THREE.BoxGeometry(3, 4, 0.3);
                mesh = makeMesh(geo, winMat);
                mesh.position.set(
                    x + Math.cos(rot + Math.PI / 2) * (sideOffset - buildD / 2 - 0.2) + Math.cos(rot) * wOffset,
                    buildH * 0.5,
                    z + Math.sin(rot + Math.PI / 2) * (sideOffset - buildD / 2 - 0.2) + Math.sin(rot) * wOffset
                );
                mesh.rotation.y = rot;
                addObj(mesh);

                // Right building windows
                geo = new THREE.BoxGeometry(3, 4, 0.3);
                mesh = makeMesh(geo, winMat);
                mesh.position.set(
                    x - Math.cos(rot + Math.PI / 2) * (sideOffset - buildD / 2 - 0.2) + Math.cos(rot) * wOffset,
                    buildH * 0.5,
                    z - Math.sin(rot + Math.PI / 2) * (sideOffset - buildD / 2 - 0.2) + Math.sin(rot) * wOffset
                );
                mesh.rotation.y = rot;
                addObj(mesh);
            }
        }
    }

    function buildPiccadillyCircus() {
        var cx = X_OFFSET + 60;
        var cz = -320;
        var mesh, geo;

        // Circular road surface
        geo = new THREE.CylinderGeometry(60, 60, 0.5, 32);
        mesh = makeMesh(geo, lambertMat(0x555555));
        mesh.position.set(cx, 0.25, cz);
        addObj(mesh);

        // Central island / fountain basin
        geo = new THREE.CylinderGeometry(14, 16, 1.2, 24);
        mesh = makeMesh(geo, lambertMat(0x888888));
        mesh.position.set(cx, 0.85, cz);
        addObj(mesh);

        // Fountain basin rim
        geo = new THREE.CylinderGeometry(16, 16, 0.5, 24);
        mesh = makeMesh(geo, lambertMat(0x777777));
        mesh.position.set(cx, 1.5, cz);
        addObj(mesh);

        // Water surface
        geo = new THREE.CylinderGeometry(13, 13, 0.2, 24);
        mesh = makeMesh(geo, lambertMat(0x336688));
        mesh.position.set(cx, 1.6, cz);
        addObj(mesh);

        // Eros plinth — stepped base
        geo = new THREE.BoxGeometry(5, 1.5, 5);
        mesh = makeMesh(geo, lambertMat(0xb0a898));
        mesh.position.set(cx, 2.15, cz);
        addObj(mesh);

        geo = new THREE.BoxGeometry(4, 1.5, 4);
        mesh = makeMesh(geo, lambertMat(0xb0a898));
        mesh.position.set(cx, 3.65, cz);
        addObj(mesh);

        geo = new THREE.BoxGeometry(3, 2, 3);
        mesh = makeMesh(geo, lambertMat(0xb0a898));
        mesh.position.set(cx, 5.4, cz);
        addObj(mesh);

        // Eros column
        geo = new THREE.CylinderGeometry(0.35, 0.5, 5, 8);
        mesh = makeMesh(geo, lambertMat(0x998877));
        mesh.position.set(cx, 8.9, cz);
        addObj(mesh);

        // Eros figure body
        geo = new THREE.CylinderGeometry(0.4, 0.5, 1.8, 8);
        mesh = makeMesh(geo, lambertMat(0x997744));
        mesh.position.set(cx, 12.3, cz);
        addObj(mesh);

        // Eros figure head
        geo = new THREE.SphereGeometry(0.4, 8, 8);
        mesh = makeMesh(geo, lambertMat(0x997744));
        mesh.position.set(cx, 13.5, cz);
        addObj(mesh);

        // Eros wings
        geo = new THREE.BoxGeometry(2.5, 1.2, 0.2);
        mesh = makeMesh(geo, lambertMat(0xccbbaa));
        mesh.position.set(cx, 12.5, cz);
        addObj(mesh);

        // Bow
        geo = new THREE.CylinderGeometry(0.07, 0.07, 1.8, 6);
        mesh = makeMesh(geo, lambertMat(0x886644));
        mesh.position.set(cx + 0.6, 12.0, cz - 0.3);
        mesh.rotation.z = 0.7;
        mesh.rotation.y = 0.5;
        addObj(mesh);

        // Arrow
        geo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6);
        mesh = makeMesh(geo, lambertMat(0x886644));
        mesh.position.set(cx + 0.4, 12.4, cz + 0.5);
        mesh.rotation.x = 0.8;
        mesh.rotation.z = -0.3;
        addObj(mesh);

        // Neon advertising screens — colorful panels around the circus
        var neonColors = [
            0xff2222, 0x22ff22, 0x2222ff, 0xffff22, 0xff22ff, 0x22ffff, 0xff8800
        ];
        var screenAngles = [0, 0.8, 1.6, 2.4, 3.2, 4.0, 4.8];
        var screenRadius = 55;
        var i, sAngle, sx, sz;
        for (i = 0; i < 7; i++) {
            sAngle = screenAngles[i];
            sx = cx + screenRadius * Math.sin(sAngle);
            sz = cz + screenRadius * Math.cos(sAngle);

            // Screen backing
            geo = new THREE.BoxGeometry(10, 12, 1.5);
            mesh = makeMesh(geo, lambertMat(0x222222));
            mesh.position.set(sx, 9, sz);
            mesh.rotation.y = -sAngle;
            addObj(mesh);

            // Colored neon panel
            geo = new THREE.BoxGeometry(8.5, 10, 0.4);
            mesh = makeMesh(geo, lambertMat(neonColors[i]));
            mesh.position.set(
                sx - Math.sin(sAngle) * 0.9,
                9,
                sz - Math.cos(sAngle) * 0.9
            );
            mesh.rotation.y = -sAngle;
            addObj(mesh);

            // Screen support column
            geo = new THREE.CylinderGeometry(0.5, 0.6, 4, 8);
            mesh = makeMesh(geo, lambertMat(0x333333));
            mesh.position.set(sx, 2, sz);
            addObj(mesh);
        }

        // Road markings — white strips
        var j;
        for (j = 0; j < 8; j++) {
            var mAngle = (j / 8) * Math.PI * 2;
            geo = new THREE.BoxGeometry(0.8, 0.1, 8);
            mesh = makeMesh(geo, lambertMat(0xffffff));
            mesh.position.set(cx + 50 * Math.sin(mAngle), 0.55, cz + 50 * Math.cos(mAngle));
            mesh.rotation.y = -mAngle;
            addObj(mesh);
        }
    }

    function buildLiberty() {
        var lx = X_OFFSET - 80;
        var lz = -120;
        var mesh, geo;

        // Tudor timber frame — main structure (black and white)
        // White plaster panels
        geo = new THREE.BoxGeometry(32, 22, 18);
        mesh = makeMesh(geo, lambertMat(0xf5f0e8));
        mesh.position.set(lx, 11, lz);
        addObj(mesh);

        // Black timber horizontals
        var i;
        for (i = 0; i < 5; i++) {
            geo = new THREE.BoxGeometry(32.5, 0.8, 0.6);
            mesh = makeMesh(geo, lambertMat(0x1a1a1a));
            mesh.position.set(lx, 3 + i * 4.5, lz - 9.1);
            addObj(mesh);
        }

        // Black timber verticals
        for (i = 0; i < 7; i++) {
            geo = new THREE.BoxGeometry(0.7, 22, 0.6);
            mesh = makeMesh(geo, lambertMat(0x1a1a1a));
            mesh.position.set(lx - 15 + i * 5, 11, lz - 9.1);
            addObj(mesh);
        }

        // Diagonal timbers
        geo = new THREE.BoxGeometry(0.6, 12, 0.6);
        mesh = makeMesh(geo, lambertMat(0x1a1a1a));
        mesh.position.set(lx - 8, 8, lz - 9.1);
        mesh.rotation.z = 0.6;
        addObj(mesh);

        geo = new THREE.BoxGeometry(0.6, 12, 0.6);
        mesh = makeMesh(geo, lambertMat(0x1a1a1a));
        mesh.position.set(lx + 8, 8, lz - 9.1);
        mesh.rotation.z = -0.6;
        addObj(mesh);

        // Tudor roof — pitched gables
        geo = new THREE.ConeGeometry(12, 8, 4);
        mesh = makeMesh(geo, lambertMat(0x553322));
        mesh.position.set(lx, 26, lz);
        mesh.rotation.y = Math.PI / 4;
        addObj(mesh);

        // Side wing
        geo = new THREE.BoxGeometry(18, 18, 12);
        mesh = makeMesh(geo, lambertMat(0xf5f0e8));
        mesh.position.set(lx + 24, 9, lz);
        addObj(mesh);

        // Side wing timbers
        for (i = 0; i < 4; i++) {
            geo = new THREE.BoxGeometry(18.5, 0.8, 0.6);
            mesh = makeMesh(geo, lambertMat(0x1a1a1a));
            mesh.position.set(lx + 24, 2 + i * 4.5, lz - 6.1);
            addObj(mesh);
        }

        // Side wing verticals
        for (i = 0; i < 5; i++) {
            geo = new THREE.BoxGeometry(0.7, 18, 0.6);
            mesh = makeMesh(geo, lambertMat(0x1a1a1a));
            mesh.position.set(lx + 24 - 8 + i * 4, 9, lz - 6.1);
            addObj(mesh);
        }

        geo = new THREE.ConeGeometry(8, 6, 4);
        mesh = makeMesh(geo, lambertMat(0x553322));
        mesh.position.set(lx + 24, 21, lz);
        mesh.rotation.y = Math.PI / 4;
        addObj(mesh);

        // Galleon figurehead left
        geo = new THREE.SphereGeometry(1.2, 8, 8);
        mesh = makeMesh(geo, lambertMat(0x886633));
        mesh.position.set(lx - 16, 20, lz - 9.5);
        addObj(mesh);

        geo = new THREE.ConeGeometry(0.8, 3, 6);
        mesh = makeMesh(geo, lambertMat(0x664422));
        mesh.position.set(lx - 16, 17.5, lz - 9.5);
        addObj(mesh);

        // Galleon figurehead right
        geo = new THREE.SphereGeometry(1.2, 8, 8);
        mesh = makeMesh(geo, lambertMat(0x886633));
        mesh.position.set(lx + 16, 20, lz - 9.5);
        addObj(mesh);

        geo = new THREE.ConeGeometry(0.8, 3, 6);
        mesh = makeMesh(geo, lambertMat(0x664422));
        mesh.position.set(lx + 16, 17.5, lz - 9.5);
        addObj(mesh);

        // Courtyard interior (recessed)
        geo = new THREE.BoxGeometry(22, 0.3, 14);
        mesh = makeMesh(geo, lambertMat(0x888877));
        mesh.position.set(lx, 0.15, lz + 16);
        addObj(mesh);

        // Courtyard walls
        geo = new THREE.BoxGeometry(22, 8, 2);
        mesh = makeMesh(geo, lambertMat(0xf5f0e8));
        mesh.position.set(lx, 4, lz + 23);
        addObj(mesh);

        geo = new THREE.BoxGeometry(2, 8, 14);
        mesh = makeMesh(geo, lambertMat(0xf5f0e8));
        mesh.position.set(lx - 11, 4, lz + 16);
        addObj(mesh);

        geo = new THREE.BoxGeometry(2, 8, 14);
        mesh = makeMesh(geo, lambertMat(0xf5f0e8));
        mesh.position.set(lx + 11, 4, lz + 16);
        addObj(mesh);

        // Liberty sign
        geo = new THREE.BoxGeometry(12, 2.5, 0.4);
        mesh = makeMesh(geo, lambertMat(0x004400));
        mesh.position.set(lx, 5, lz - 9.3);
        addObj(mesh);
    }

    function buildCarnaby() {
        var cx = X_OFFSET + 20;
        var cz = -80;
        var mesh, geo;
        var i;

        // Street surface
        geo = new THREE.BoxGeometry(14, 0.3, 120);
        mesh = makeMesh(geo, lambertMat(0x998877));
        mesh.position.set(cx, 0.15, cz);
        addObj(mesh);

        // Overhead sign arch left post
        geo = new THREE.CylinderGeometry(0.5, 0.6, 12, 8);
        mesh = makeMesh(geo, lambertMat(0xcc2222));
        mesh.position.set(cx - 7.5, 6, cz + 15);
        addObj(mesh);

        // Overhead sign arch right post
        geo = new THREE.CylinderGeometry(0.5, 0.6, 12, 8);
        mesh = makeMesh(geo, lambertMat(0xcc2222));
        mesh.position.set(cx + 7.5, 6, cz + 15);
        addObj(mesh);

        // Overhead sign board
        geo = new THREE.BoxGeometry(18, 2.5, 0.6);
        mesh = makeMesh(geo, lambertMat(0xcc2222));
        mesh.position.set(cx, 12.5, cz + 15);
        addObj(mesh);

        // Sign letters panels (white stripes)
        var k;
        for (k = 0; k < 7; k++) {
            geo = new THREE.BoxGeometry(1.8, 2, 0.2);
            mesh = makeMesh(geo, lambertMat(0xffffff));
            mesh.position.set(cx - 7 + k * 2.3, 12.5, cz + 14.7);
            addObj(mesh);
        }

        // Colorful shopfronts — 8 shops each side
        var shopColors = [
            0xff3366, 0x33cc66, 0x3366ff, 0xffcc00,
            0xff6600, 0x9933cc, 0x00cccc, 0xff0066
        ];

        for (i = 0; i < 8; i++) {
            var shopZ = cz - 50 + i * 14;
            var shopColor = shopColors[i % shopColors.length];

            // Left shop
            geo = new THREE.BoxGeometry(10, 14, 8);
            mesh = makeMesh(geo, lambertMat(shopColor));
            mesh.position.set(cx - 12, 7, shopZ);
            addObj(mesh);

            // Left shop window
            geo = new THREE.BoxGeometry(5, 5, 0.4);
            mesh = makeMesh(geo, lambertMat(0xaaccee));
            mesh.position.set(cx - 12, 4, shopZ + 4.2);
            addObj(mesh);

            // Left shop sign
            geo = new THREE.BoxGeometry(8, 2, 0.4);
            mesh = makeMesh(geo, lambertMat(0xffffff));
            mesh.position.set(cx - 12, 9, shopZ + 4.2);
            addObj(mesh);

            // Right shop
            geo = new THREE.BoxGeometry(10, 14, 8);
            mesh = makeMesh(geo, lambertMat(shopColors[(i + 3) % shopColors.length]));
            mesh.position.set(cx + 12, 7, shopZ);
            addObj(mesh);

            // Right shop window
            geo = new THREE.BoxGeometry(5, 5, 0.4);
            mesh = makeMesh(geo, lambertMat(0xaaccee));
            mesh.position.set(cx + 12, 4, shopZ - 4.2);
            addObj(mesh);

            // Right shop sign
            geo = new THREE.BoxGeometry(8, 2, 0.4);
            mesh = makeMesh(geo, lambertMat(0xffffff));
            mesh.position.set(cx + 12, 9, shopZ - 4.2);
            addObj(mesh);
        }

        // Decorative flags on arch
        var flagColors = [0xff2200, 0x0022ff, 0x22cc00, 0xffee00];
        for (i = 0; i < 4; i++) {
            geo = new THREE.BoxGeometry(1.5, 2.5, 0.1);
            mesh = makeMesh(geo, lambertMat(flagColors[i % 4]));
            mesh.position.set(cx - 6 + i * 4, 14, cz + 15);
            addObj(mesh);
        }

        // Pavement left
        geo = new THREE.BoxGeometry(4, 0.2, 120);
        mesh = makeMesh(geo, lambertMat(0xbbbbaa));
        mesh.position.set(cx - 9, 0.1, cz);
        addObj(mesh);

        // Pavement right
        geo = new THREE.BoxGeometry(4, 0.2, 120);
        mesh = makeMesh(geo, lambertMat(0xbbbbaa));
        mesh.position.set(cx + 9, 0.1, cz);
        addObj(mesh);
    }

    function buildHamleys() {
        var hx = X_OFFSET + 100;
        var hz = -180;
        var mesh, geo;
        var i;

        // Main structure — 6 floors
        var floorHeight = 4;
        var buildWidth = 24;
        var buildDepth = 16;
        var totalHeight = 6 * floorHeight;

        // Main body
        geo = new THREE.BoxGeometry(buildWidth, totalHeight, buildDepth);
        mesh = makeMesh(geo, lambertMat(0xcc1111));
        mesh.position.set(hx, totalHeight / 2, hz);
        addObj(mesh);

        // Floor dividers (white bands)
        for (i = 0; i < 6; i++) {
            geo = new THREE.BoxGeometry(buildWidth + 0.5, 0.6, buildDepth + 0.5);
            mesh = makeMesh(geo, lambertMat(0xffffff));
            mesh.position.set(hx, (i + 1) * floorHeight, hz);
            addObj(mesh);
        }

        // Window displays — 3 per floor, front face
        var winDisplayColors = [
            0xffff44, 0xff88cc, 0x44ffff, 0xffaa22, 0xcc44ff, 0x44ff88
        ];

        for (i = 0; i < 6; i++) {
            var floorY = i * floorHeight + 2;
            var j;
            for (j = 0; j < 3; j++) {
                var winX = hx - 8 + j * 8;
                // Window frame
                geo = new THREE.BoxGeometry(5, 3, 0.4);
                mesh = makeMesh(geo, lambertMat(0xffffff));
                mesh.position.set(winX, floorY, hz - buildDepth / 2 - 0.3);
                addObj(mesh);

                // Window glass / display color
                geo = new THREE.BoxGeometry(4.2, 2.4, 0.3);
                mesh = makeMesh(geo, lambertMat(winDisplayColors[(i + j) % winDisplayColors.length]));
                mesh.position.set(winX, floorY, hz - buildDepth / 2 - 0.55);
                addObj(mesh);
            }
        }

        // Main entrance
        geo = new THREE.BoxGeometry(5, 4, 0.5);
        mesh = makeMesh(geo, lambertMat(0x441111));
        mesh.position.set(hx, 2, hz - buildDepth / 2 - 0.3);
        addObj(mesh);

        // Entrance canopy
        geo = new THREE.BoxGeometry(8, 0.5, 3);
        mesh = makeMesh(geo, lambertMat(0xdd1111));
        mesh.position.set(hx, 4.5, hz - buildDepth / 2 - 1.5);
        addObj(mesh);

        // Hamleys sign — large banner
        geo = new THREE.BoxGeometry(20, 3, 0.4);
        mesh = makeMesh(geo, lambertMat(0xffffff));
        mesh.position.set(hx, totalHeight - 2, hz - buildDepth / 2 - 0.3);
        addObj(mesh);

        // Roof parapet
        geo = new THREE.BoxGeometry(buildWidth + 1, 2, buildDepth + 1);
        mesh = makeMesh(geo, lambertMat(0xdd1111));
        mesh.position.set(hx, totalHeight + 1, hz);
        addObj(mesh);

        // Toy balloon decorations on corners
        var balloonColors = [0xff2244, 0x2244ff, 0x22ff44, 0xffff22];
        var corners = [
            [-buildWidth / 2 + 2, hz - buildDepth / 2 + 2],
            [buildWidth / 2 - 2, hz - buildDepth / 2 + 2],
            [-buildWidth / 2 + 2, hz + buildDepth / 2 - 2],
            [buildWidth / 2 - 2, hz + buildDepth / 2 - 2]
        ];
        for (i = 0; i < 4; i++) {
            geo = new THREE.SphereGeometry(1.5, 8, 8);
            mesh = makeMesh(geo, lambertMat(balloonColors[i]));
            mesh.position.set(hx + corners[i][0], totalHeight + 4, corners[i][1]);
            addObj(mesh);

            // Balloon string
            geo = new THREE.CylinderGeometry(0.05, 0.05, 4, 4);
            mesh = makeMesh(geo, lambertMat(0xffffff));
            mesh.position.set(hx + corners[i][0], totalHeight + 2, corners[i][1]);
            addObj(mesh);
        }

        // Toy star decorations on facade
        var starColors = [0xffdd00, 0xff4400, 0x00aaff, 0xaa00ff];
        for (i = 0; i < 4; i++) {
            geo = new THREE.SphereGeometry(0.8, 6, 6);
            mesh = makeMesh(geo, lambertMat(starColors[i]));
            mesh.position.set(hx - 9 + i * 6, totalHeight + 0.5, hz - buildDepth / 2 - 0.6);
            addObj(mesh);
        }
    }

    function buildStreetFurniture() {
        var i, mesh, geo;

        // Lamp posts along Regent Street
        var lampPositions = [
            [X_OFFSET - 15, -150],
            [X_OFFSET - 10, -180],
            [X_OFFSET, -210],
            [X_OFFSET + 10, -240],
            [X_OFFSET + 15, -270],
            [X_OFFSET + 20, -300]
        ];

        for (i = 0; i < lampPositions.length; i++) {
            var lx = lampPositions[i][0];
            var lz = lampPositions[i][1];

            // Lamp post shaft
            geo = new THREE.CylinderGeometry(0.15, 0.25, 9, 6);
            mesh = makeMesh(geo, lambertMat(0x333355));
            mesh.position.set(lx, 4.5, lz);
            addObj(mesh);

            // Lamp head
            geo = new THREE.SphereGeometry(0.6, 8, 8);
            mesh = makeMesh(geo, lambertMat(0xffffcc));
            mesh.position.set(lx, 9.4, lz);
            addObj(mesh);

            // Mirror on other side
            geo = new THREE.CylinderGeometry(0.15, 0.25, 9, 6);
            mesh = makeMesh(geo, lambertMat(0x333355));
            mesh.position.set(lx + 30, 4.5, lz);
            addObj(mesh);

            geo = new THREE.SphereGeometry(0.6, 8, 8);
            mesh = makeMesh(geo, lambertMat(0xffffcc));
            mesh.position.set(lx + 30, 9.4, lz);
            addObj(mesh);
        }

        // Pavement slabs along Regent Street (both sides)
        var numPavements = 10;
        for (i = 0; i < numPavements; i++) {
            var pz = -140 - i * 18;
            geo = new THREE.BoxGeometry(6, 0.2, 16);
            mesh = makeMesh(geo, lambertMat(0xd4cfc0));
            mesh.position.set(X_OFFSET - 14, 0.1, pz);
            addObj(mesh);

            geo = new THREE.BoxGeometry(6, 0.2, 16);
            mesh = makeMesh(geo, lambertMat(0xd4cfc0));
            mesh.position.set(X_OFFSET + 14, 0.1, pz);
            addObj(mesh);
        }

        // Underground/tube entrance near Piccadilly
        var ux = X_OFFSET + 40;
        var uz = -310;
        geo = new THREE.CylinderGeometry(3.5, 3.5, 0.4, 16);
        mesh = makeMesh(geo, lambertMat(0xcc0000));
        mesh.position.set(ux, 0.2, uz);
        addObj(mesh);

        geo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 16);
        mesh = makeMesh(geo, lambertMat(0x003399));
        mesh.position.set(ux, 0.45, uz);
        addObj(mesh);

        // Tube entrance box
        geo = new THREE.BoxGeometry(7, 5, 5);
        mesh = makeMesh(geo, lambertMat(0xcc0000));
        mesh.position.set(ux, 2.5, uz - 4);
        addObj(mesh);

        // Tube entrance door
        geo = new THREE.BoxGeometry(3, 4, 0.4);
        mesh = makeMesh(geo, lambertMat(0x222222));
        mesh.position.set(ux, 2, uz - 6.2);
        addObj(mesh);

        // Tube roundel
        geo = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16);
        mesh = makeMesh(geo, lambertMat(0xcc0000));
        mesh.position.set(ux, 5.1, uz - 6.2);
        mesh.rotation.x = Math.PI / 2;
        addObj(mesh);

        geo = new THREE.CylinderGeometry(0.8, 0.8, 0.25, 16);
        mesh = makeMesh(geo, lambertMat(0x003399));
        mesh.position.set(ux, 5.1, uz - 6.2);
        mesh.rotation.x = Math.PI / 2;
        addObj(mesh);

        // Street benches
        var benchPositions = [
            [X_OFFSET - 18, -160],
            [X_OFFSET + 18, -200],
            [X_OFFSET - 18, -250]
        ];
        for (i = 0; i < benchPositions.length; i++) {
            var bx = benchPositions[i][0];
            var bz = benchPositions[i][1];
            geo = new THREE.BoxGeometry(4, 0.3, 1.2);
            mesh = makeMesh(geo, lambertMat(0x554422));
            mesh.position.set(bx, 1, bz);
            addObj(mesh);

            // Bench legs
            geo = new THREE.BoxGeometry(0.3, 1, 1.2);
            mesh = makeMesh(geo, lambertMat(0x333333));
            mesh.position.set(bx - 1.5, 0.5, bz);
            addObj(mesh);

            geo = new THREE.BoxGeometry(0.3, 1, 1.2);
            mesh = makeMesh(geo, lambertMat(0x333333));
            mesh.position.set(bx + 1.5, 0.5, bz);
            addObj(mesh);

            // Bench back
            geo = new THREE.BoxGeometry(4, 1.2, 0.3);
            mesh = makeMesh(geo, lambertMat(0x554422));
            mesh.position.set(bx, 1.8, bz + 0.6);
            addObj(mesh);
        }
    }

    function build() {
        buildRecentStreetCurve();
        buildPiccadillyCircus();
        buildLiberty();
        buildCarnaby();
        buildHamleys();
        buildStreetFurniture();
    }

    function update(delta) {
        // Static environment — no per-frame updates needed
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
